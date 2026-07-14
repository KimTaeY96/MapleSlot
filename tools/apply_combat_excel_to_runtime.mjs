import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const excelArg = process.argv.indexOf("--excel-dir");
const outputArg = process.argv.indexOf("--output");
const slotArg = process.argv.indexOf("--slot-machine");
const excelDir = excelArg >= 0 ? path.resolve(process.argv[excelArg + 1]) : path.resolve("ExcelTable");
const slotMachinePath = slotArg >= 0 ? path.resolve(process.argv[slotArg + 1]) : path.join(excelDir, "SlotMachine.xlsx");
const outputPath = outputArg >= 0
  ? path.resolve(process.argv[outputArg + 1])
  : path.resolve("RootDesk/MyDesk/Combat/CombatTableRuntime.mlua");

const validatorUrl = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), "validate_combat_excel_tables.mjs")).href;
const { loadAndValidateCombatTables } = await import(validatorUrl);
const { combat, drop } = await loadAndValidateCombatTables({ excelDir, slotMachinePath });

function luaString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\r/g, "\\r").replace(/\n/g, "\\n")}"`;
}

function luaValue(value) {
  if (value === null || value === undefined || value === "") return "nil";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "nil";
  const normalized = String(value).toLowerCase();
  if (normalized === "true" || normalized === "false") return normalized;
  return luaString(value);
}

function luaRow(row) {
  return `{ ${Object.entries(row).map(([key, value]) => `${key} = ${luaValue(value)}`).join(", ")} }`;
}

function indexedRows(rows, indexKey) {
  return rows.map((row) => `            [${Number(row[indexKey])}] = ${luaRow(row)},`).join("\n");
}

function keyedRows(rows, key) {
  return rows.map((row) => `            [${luaString(row[key])}] = ${luaRow(row)},`).join("\n");
}

function groupedEntries(rows) {
  const groups = new Map();
  for (const row of rows) {
    const id = String(row.DropGroupId);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  return [...groups.entries()].map(([id, entries]) => {
    const body = entries.map((row) => `                ${luaRow(row)},`).join("\n");
    return `            [${luaString(id)}] = {\n${body}\n            },`;
  }).join("\n");
}

const source = `@Logic
script CombatTableRuntime extends Logic
    property any config = nil
    property any huntingGroundTiers = nil
    property any playerStatsProfiles = nil
    property any monsterDefinitions = nil
    property any monsterSpawnGroups = nil
    property any dropGroups = nil
    property any dropEntriesByGroup = nil

    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
        self:EnsureLoaded()
    end

    @ExecSpace("ServerOnly")
    method void EnsureLoaded()
        if self.config ~= nil then return end
        self.config = ${luaRow(combat.CombatConfig[0])}
        self.huntingGroundTiers = {
${indexedRows(combat.HuntingGroundTiers, "HuntingGroundTiersIndex")}
        }
        self.playerStatsProfiles = {
${indexedRows(combat.PlayerStatsProfiles, "PlayerStatsProfilesIndex")}
        }
        self.monsterDefinitions = {
${indexedRows(combat.MonsterDefinitions, "MonsterDefinitionsIndex")}
        }
        self.monsterSpawnGroups = {
${indexedRows(combat.MonsterSpawnGroups, "MonsterSpawnGroupsIndex")}
        }
        self.dropGroups = {
${keyedRows(drop.DropGroups, "DropGroupId")}
        }
        self.dropEntriesByGroup = {
${groupedEntries(drop.DropEntries)}
        }
    end

    @ExecSpace("ServerOnly")
    method table GetConfig()
        self:EnsureLoaded()
        return self.config
    end

    @ExecSpace("ServerOnly")
    method table GetHuntingGroundTier(integer index)
        self:EnsureLoaded()
        return self.huntingGroundTiers[index]
    end

    @ExecSpace("ServerOnly")
    method table GetPlayerStatsProfile(integer index)
        self:EnsureLoaded()
        return self.playerStatsProfiles[index]
    end

    @ExecSpace("ServerOnly")
    method table GetMonsterDefinition(integer index)
        self:EnsureLoaded()
        return self.monsterDefinitions[index]
    end

    @ExecSpace("ServerOnly")
    method table GetMonsterSpawnGroup(integer index)
        self:EnsureLoaded()
        return self.monsterSpawnGroups[index]
    end

    @ExecSpace("ServerOnly")
    method table ResolveDropGroup(string dropGroupId)
        self:EnsureLoaded()
        local group = self.dropGroups[dropGroupId]
        if group == nil or group.Enabled == false then
            log_error("[Combat] Missing enabled drop group: " .. tostring(dropGroupId))
            return {}
        end
        if group.RollMode ~= "INDEPENDENT" then
            log_error("[Combat] Unsupported drop RollMode: " .. tostring(group.RollMode))
            return {}
        end
        local entries = self.dropEntriesByGroup[dropGroupId] or {}
        local grants = {}
        for rollIndex = 1, group.RollCount do
            for _, entry in ipairs(entries) do
                if entry.Enabled and _UtilLogic:RandomIntegerRange(1, 1000) <= entry.ChancePermille then
                    local quantity = _UtilLogic:RandomIntegerRange(entry.MinQuantity, entry.MaxQuantity)
                    table.insert(grants, {
                        rewardType = entry.RewardType,
                        rewardKey = entry.RewardKey,
                        quantity = quantity,
                        sourceDropGroupId = dropGroupId,
                        sourceEntryIndex = entry.DropEntriesIndex,
                    })
                end
            end
        end
        if group.EmptyResultAllowed == false and #grants == 0 then
            log_error("[Combat] Non-empty drop group produced no reward: " .. tostring(dropGroupId))
        end
        return grants
    end
end
`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, source, "utf8");
console.log(`Applied Combat.xlsx and Drop.xlsx to ${outputPath}`);
