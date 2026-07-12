import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const dependencyRoot = "C:/Users/ghddj/Documents/MSW";
const require = createRequire(import.meta.url);
const artifactToolPath = require.resolve("@oai/artifact-tool", { paths: [dependencyRoot] });
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(artifactToolPath).href);

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const excelDir = `${projectRoot}/ExcelTable`;
const runtimePath = `${projectRoot}/RootDesk/MyDesk/SlotMachine/SlotMachineRuntime.mlua`;
const stagingRuntimePath = "C:/Users/ghddj/Documents/MSW/staging/slot_ui_layers/SlotMachineRuntime.mlua";
const manifestPath = `${projectRoot}/GeneratedAssets/SlotMachineUI/msw_resource_manifest.json`;
const runtimeBuildKind = process.env.MSW_SLOT_RUNTIME_KIND || "RELEASE";
const resourceManifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

const fallbackStrings = new Map([
  [201, "{0} - {1} Coin"],
  [202, "Premium {0}"],
  [203, "Common {0}"],
  [204, "Win {0} lines +{1}"],
  [205, "Not enough coins"],
  [206, "x{0}"],
  [207, "Apply new Base Bet? Lock starts for {0}."],
  [208, "x {0}"],
  [209, "= {0}"],
  [210, "777 BONUS {0} spins +{1}"],
]);

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function num(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be numeric: ${value}`);
  }
  return parsed;
}

function bool(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

function hasValue(row, key) {
  return row[key] !== null && row[key] !== undefined && row[key] !== "";
}

function luaString(value) {
  const source = clean(value);
  let result = '"';
  for (const ch of source) {
    if (ch === "\\") {
      result += "\\\\";
    } else if (ch === '"') {
      result += '\\"';
    } else if (ch === "\n") {
      result += "\\n";
    } else if (ch === "\r") {
      result += "\\r";
    } else if (ch === "\t") {
      result += "\\t";
    } else {
      const code = ch.codePointAt(0);
      if (code >= 0x20 && code <= 0x7e) {
        result += ch;
      } else {
        const bytes = Buffer.from(ch, "utf8");
        for (const byte of bytes) {
          result += `\\${String(byte).padStart(3, "0")}`;
        }
      }
    }
  }
  result += '"';
  return result;
}

function luaValue(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return luaString(value);
}

function manifestRuid(key) {
  const ruid = resourceManifest[key]?.ruid;
  if (!ruid) {
    throw new Error(`Missing MSW resource RUID for ${key} in ${manifestPath}`);
  }
  return ruid;
}

async function workbookRows(filename, sheetName) {
  const fullPath = path.join(excelDir, filename);
  const input = await FileBlob.load(fullPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const sheet = workbook.worksheets.getItem(sheetName);
  if (!sheet) {
    throw new Error(`Missing sheet: ${filename}/${sheetName}`);
  }
  const values = sheet.getUsedRange(true)?.values;
  if (!values || values.length < 4) {
    throw new Error(`Sheet has no table header rows: ${filename}/${sheetName}`);
  }
  const headers = values[0].map(clean);
  return values.slice(4)
    .filter((row) => row.some((value) => value !== null && value !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

async function optionalWorkbookRows(filename, sheetName) {
  try {
    return await workbookRows(filename, sheetName);
  } catch (error) {
    const message = String(error?.message ?? "");
    if (error?.code === "ENOENT" || message.includes("ENOENT") || message.includes(`Missing sheet: ${filename}/${sheetName}`)) {
      return [];
    }
    throw error;
  }
}

async function workbookRowsFromSlotMachine(sheetName) {
  return await workbookRows("SlotMachine.xlsx", sheetName);
}

function buildEnumResolver(enumRows) {
  const byKo = new Map();
  const byId = new Map();
  for (const row of enumRows) {
    const type = clean(row.EnumTypeName);
    const id = clean(row.EnumId);
    const ko = clean(row.EnumKo);
    if (!type || !id) continue;
    byId.set(`${type}:${id}`, id);
    if (ko) byKo.set(`${type}:${ko}`, id);
  }
  return {
    resolve(type, value) {
      const key = clean(value);
      if (byId.has(`${type}:${key}`)) return key;
      const resolved = byKo.get(`${type}:${key}`);
      if (resolved) return resolved;
      throw new Error(`Unknown ${type} enum value: ${value}`);
    },
  };
}

async function loadData() {
  const enumRows = await workbookRows("Enum.xlsx", "Enums");
  const enumResolver = buildEnumResolver(enumRows);

  const gameString = new Map();
  for (const row of await workbookRows("GameString.xlsx", "GameString")) {
    const index = Number(row.Index);
    if (Number.isFinite(index)) {
      gameString.set(index, clean(row["String<ko>"]));
    }
  }

  const text = (index) => gameString.get(Number(index)) ?? fallbackStrings.get(Number(index)) ?? "";

  const baseBetRows = (await workbookRows("SlotMachine.xlsx", "BaseBetRegions"))
    .sort((a, b) => num(a.BaseBetRegionsIndex, "BaseBetRegionsIndex") - num(b.BaseBetRegionsIndex, "BaseBetRegionsIndex"));

  const multiplierRows = (await workbookRows("SlotMachine.xlsx", "Multipliers"))
    .sort((a, b) => num(a.MultipliersIndex, "MultipliersIndex") - num(b.MultipliersIndex, "MultipliersIndex"));

  const paytableGroups = new Map();
  for (const row of await workbookRows("SlotMachine.xlsx", "Paytable")) {
    const baseBetIndex = hasValue(row, "BaseBetRegionIndex") ? num(row.BaseBetRegionIndex, "BaseBetRegionIndex") : 1;
    const symbolId = enumResolver.resolve("SlotSymbol", row.SymbolEnumId);
    const matchCount = num(row.MatchCount, "MatchCount");
    const payoutTenths = num(row.PayoutTenths, "PayoutTenths");
    if (!paytableGroups.has(baseBetIndex)) paytableGroups.set(baseBetIndex, new Map());
    const paytable = paytableGroups.get(baseBetIndex);
    if (!paytable.has(symbolId)) paytable.set(symbolId, {});
    paytable.get(symbolId)[matchCount] = payoutTenths;
  }
  const defaultPaytableIndex = Math.min(...paytableGroups.keys());
  const defaultPaytable = paytableGroups.get(defaultPaytableIndex);

  const slotSymbolRows = (await workbookRows("SlotMachine.xlsx", "SlotSymbols"))
    .sort((a, b) => num(a.SlotSymbolsIndex, "SlotSymbolsIndex") - num(b.SlotSymbolsIndex, "SlotSymbolsIndex"))
    .map((row) => {
      const symbolId = enumResolver.resolve("SlotSymbol", row.SymbolEnumId);
      const payouts = defaultPaytable.get(symbolId) ?? {};
      return {
        symbolId,
        resourcePath: clean(row.SymbolResourceRuid),
        winAnimationRuid: clean(row.WinAnimationRuid) || clean(row.SymbolResourceRuid),
        winAnimation: enumResolver.resolve("SymbolWinAnimation", row.WinAnimationEnumId),
        isWild: symbolId === "WILD",
        payout3: payouts[3] ?? 0,
        payout4: payouts[4] ?? 0,
        payout5: payouts[5] ?? 0,
      };
    });

  const reelGroups = new Map();
  const reelCellGroups = new Map();
  for (const row of await workbookRowsFromSlotMachine("ReelStrips")) {
    const baseBetIndex = num(row.BaseBetRegionIndex, "BaseBetRegionIndex");
    const reelNo = num(row.ReelNo, "ReelNo");
    const stopIndex = num(row.StopIndex, "StopIndex");
    const symbolId = enumResolver.resolve("SlotSymbol", row.SymbolEnumId);
    const winAnimationId = hasValue(row, "WinAnimationEnumId")
      ? enumResolver.resolve("SymbolWinAnimation", row.WinAnimationEnumId)
      : "";
    if (!reelGroups.has(baseBetIndex)) reelGroups.set(baseBetIndex, new Map());
    const reels = reelGroups.get(baseBetIndex);
    if (!reels.has(reelNo)) reels.set(reelNo, []);
    reels.get(reelNo)[stopIndex] = symbolId;

    if (!reelCellGroups.has(baseBetIndex)) reelCellGroups.set(baseBetIndex, new Map());
    const cellReels = reelCellGroups.get(baseBetIndex);
    if (!cellReels.has(reelNo)) cellReels.set(reelNo, []);
    cellReels.get(reelNo)[stopIndex] = {
      symbolId,
      idleSpriteRuid: clean(row.IdleSpriteRuid),
      winAnimationRuid: clean(row.WinAnimationRuid),
      winAnimation: winAnimationId,
    };
  }

  const spinProfileRows = (await workbookRowsFromSlotMachine("SpinProfiles"))
    .sort((a, b) => num(a.SpinProfilesIndex, "SpinProfilesIndex") - num(b.SpinProfilesIndex, "SpinProfilesIndex"))
    .map((row) => ({
      id: enumResolver.resolve("SpinProfileType", row.SpinProfileEnumId),
      weight: num(row.WeightPercent, "WeightPercent"),
      firstMin: num(row.FirstReelMinSec, "FirstReelMinSec"),
      firstMax: num(row.FirstReelMaxSec, "FirstReelMaxSec"),
      staggerMin: num(row.StaggerMinSec, "StaggerMinSec"),
      staggerMax: num(row.StaggerMaxSec, "StaggerMaxSec"),
    }));

  const paylineRows = (await workbookRows("SlotMachine.xlsx", "Paylines"))
    .sort((a, b) => num(a.PaylinesIndex, "PaylinesIndex") - num(b.PaylinesIndex, "PaylinesIndex"))
    .map((row) => ({
      id: enumResolver.resolve("LineType", row.LineTypeEnumId),
      rowIndex: num(row.StartRow, "StartRow"),
      enabled: bool(row.IsEnabled),
      costCountsAsLine: bool(row.CostCountsAsLine),
    }));

  const screenSprayRows = (await workbookRows("SlotMachine.xlsx", "ScreenSprayVfx"))
    .sort((a, b) => num(a.ScreenSprayVfxIndex, "ScreenSprayVfxIndex") - num(b.ScreenSprayVfxIndex, "ScreenSprayVfxIndex"));
  const screenSprayRow = screenSprayRows[0] ?? null;
  const screenSprayVfx = screenSprayRow == null ? null : {
    triggerKey: clean(screenSprayRow.TriggerKey) || "BIG_MATCH_SCREEN_SPRAY",
    animationClipRuid: clean(screenSprayRow.AnimationClipRuid),
    minFourPlusLineWins: hasValue(screenSprayRow, "MinFourPlusLineWins") ? num(screenSprayRow.MinFourPlusLineWins, "MinFourPlusLineWins") : 2,
    minFivePlusLineWins: hasValue(screenSprayRow, "MinFivePlusLineWins") ? num(screenSprayRow.MinFivePlusLineWins, "MinFivePlusLineWins") : 1,
    playRate: hasValue(screenSprayRow, "PlayRate") ? num(screenSprayRow.PlayRate, "PlayRate") : 1.0,
    fallbackHideSeconds: hasValue(screenSprayRow, "FallbackHideSeconds") ? num(screenSprayRow.FallbackHideSeconds, "FallbackHideSeconds") : 1.25,
  };

  const bonusSlotRuleRows = (await optionalWorkbookRows("SlotMachine.xlsx", "BonusSlotRules"))
    .sort((a, b) => num(a.BonusSlotRulesIndex, "BonusSlotRulesIndex") - num(b.BonusSlotRulesIndex, "BonusSlotRulesIndex"));
  const bonusSlotRuleRow = bonusSlotRuleRows[0] ?? null;
  const bonusSlotRules = bonusSlotRuleRow == null ? null : {
    triggerKey: clean(bonusSlotRuleRow.TriggerKey) || "WILD_5_BONUS_SLOT",
    requiredSymbolId: enumResolver.resolve("SlotSymbol", bonusSlotRuleRow.RequiredSymbolId),
    requiredMatchCount: num(bonusSlotRuleRow.RequiredMatchCount, "RequiredMatchCount"),
    minTriggerLineCount: num(bonusSlotRuleRow.MinTriggerLineCount, "MinTriggerLineCount"),
    initialChanceCount: num(bonusSlotRuleRow.InitialChanceCount, "InitialChanceCount"),
    reelCount: num(bonusSlotRuleRow.ReelCount, "ReelCount"),
    requiredSameCount: num(bonusSlotRuleRow.RequiredSameCount, "RequiredSameCount"),
    digitMin: num(bonusSlotRuleRow.DigitMin, "DigitMin"),
    digitMax: num(bonusSlotRuleRow.DigitMax, "DigitMax"),
    maxTotalSpinCount: num(bonusSlotRuleRow.MaxTotalSpinCount, "MaxTotalSpinCount"),
    enabled: hasValue(bonusSlotRuleRow, "Enabled") ? bool(bonusSlotRuleRow.Enabled) : true,
    testCheatEnabled: hasValue(bonusSlotRuleRow, "TestCheatEnabled") ? bool(bonusSlotRuleRow.TestCheatEnabled) : false,
    testCheatForceTrigger: hasValue(bonusSlotRuleRow, "TestCheatForceTrigger") ? bool(bonusSlotRuleRow.TestCheatForceTrigger) : false,
    testCheatForceResultKey: clean(bonusSlotRuleRow.TestCheatForceResultKey) || "777",
    testCheatUseCount: hasValue(bonusSlotRuleRow, "TestCheatUseCount") ? num(bonusSlotRuleRow.TestCheatUseCount, "TestCheatUseCount") : 0,
    testCheatRequiredRuntimeKind: clean(bonusSlotRuleRow.TestCheatRequiredRuntimeKind) || "TEST_SANDBOX",
  };

  const bonusSlotPaytableRows = (await optionalWorkbookRows("SlotMachine.xlsx", "BonusSlotPaytable"))
    .sort((a, b) => num(a.BonusSlotPaytableIndex, "BonusSlotPaytableIndex") - num(b.BonusSlotPaytableIndex, "BonusSlotPaytableIndex"))
    .map((row) => ({
      digit: num(row.Digit, "Digit"),
      resultKey: clean(row.ResultKey),
      rewardMultiplier: num(row.RewardMultiplier, "RewardMultiplier"),
      extraChanceCount: num(row.ExtraChanceCount, "ExtraChanceCount"),
      rollWeight: num(row.RollWeight, "RollWeight"),
    }));

  const cheatCommandRows = (await optionalWorkbookRows("Cheat.xlsx", "CheatCommands"))
    .sort((a, b) => num(a.CheatCommandsIndex, "CheatCommandsIndex") - num(b.CheatCommandsIndex, "CheatCommandsIndex"))
    .map((row) => ({
      code: clean(row.CheatCode).toUpperCase(),
      description: clean(row.Description),
      cheatType: clean(row.CheatType),
      targetKey: clean(row.TargetKey),
      forceResultKey: clean(row.ForceResultKey),
      useCount: hasValue(row, "UseCount") ? num(row.UseCount, "UseCount") : 1,
      requiredRuntimeKind: clean(row.RequiredRuntimeKind) || "TEST_SANDBOX",
      enabled: hasValue(row, "Enabled") ? bool(row.Enabled) : true,
    }))
    .filter((row) => row.code !== "");

  return {
    text,
    slotSymbolRows,
    baseBetRows,
    multiplierRows,
    paytableGroups,
    reelGroups,
    reelCellGroups,
    spinProfileRows,
    paylineRows,
    screenSprayVfx,
    bonusSlotRules,
    bonusSlotPaytableRows,
    cheatCommandRows,
  };
}

function makeTextTemplates(data) {
  const winStatus = data.text(204).replace(/\s*\+\{1\}\s*$/, "");
  const winTotalFormula = data.text(209) === "0" ? fallbackStrings.get(209) : data.text(209);
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildTextTemplates()",
    "        return {",
    `            BaseBetLabel = ${luaString(data.text(201))},`,
    `            PremiumAmount = ${luaString(data.text(202))},`,
    `            CommonAmount = ${luaString(data.text(203))},`,
    `            WinStatus = ${luaString(winStatus)},`,
    `            NotEnoughCoins = ${luaString(data.text(205))},`,
    `            MultiplierLabel = ${luaString(data.text(206))},`,
    `            BaseBetConfirmLock = ${luaString(data.text(207))},`,
    `            WinLineFormula = ${luaString(data.text(208))},`,
    `            WinTotalFormula = ${luaString(winTotalFormula)},`,
    `            BonusSlotStatus = ${luaString(data.text(210) || fallbackStrings.get(210))},`,
    "        }",
    "    end",
  ].join("\n");
}

function makeBaseBetOptions(data) {
  const rows = data.baseBetRows.map((row) => {
    const index = num(row.BaseBetRegionsIndex, "BaseBetRegionsIndex");
    const bet = num(row.BetCoins, "BetCoins");
    const regionName = data.text(row.RegionNameStringIndex);
    return `            [${index}] = { bet = ${bet}, regionName = ${luaString(regionName)} },`;
  });
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildBaseBetOptions()",
    "        local rows = {",
    ...rows,
    "        }",
    "        for _, row in ipairs(rows) do",
    "            row.label = self:FormatTemplate(self.textTemplates.BaseBetLabel, { row.regionName, tostring(row.bet) })",
    "        end",
    "        return rows",
    "    end",
  ].join("\n");
}

function makeMultiplierOptions(data) {
  const rows = data.multiplierRows.map((row) => {
    const index = num(row.MultipliersIndex, "MultipliersIndex");
    const value = num(row.MultiplierValue, "MultiplierValue");
    return `            [${index}] = { value = ${value}, label = self:FormatTemplate(self.textTemplates.MultiplierLabel, { tostring(${value}) }) },`;
  });
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildMultiplierOptions()",
    "        return {",
    ...rows,
    "        }",
    "    end",
  ].join("\n");
}

function makeSlotSymbols(data) {
  const rows = data.slotSymbolRows.map((row) =>
    `            ${row.symbolId} = { id = ${luaString(row.symbolId)}, payout3 = ${row.payout3}, payout4 = ${row.payout4}, payout5 = ${row.payout5}, resourcePath = ${luaString(row.resourcePath)}, winAnimationRuid = ${luaString(row.winAnimationRuid)}, winAnimation = ${luaString(row.winAnimation)}, isWild = ${luaValue(row.isWild)} },`
  );
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildSlotSymbols()",
    "        return {",
    ...rows,
    "        }",
    "    end",
  ].join("\n");
}

function makeBaseReelCellSymbolTable(data) {
  const firstGroupIndex = Math.min(...data.reelGroups.keys());
  const reels = data.reelGroups.get(firstGroupIndex);
  const rows = [];
  for (let reelNo = 1; reelNo <= 5; reelNo += 1) {
    const strip = reels.get(reelNo);
    if (!strip) throw new Error(`Missing reel ${reelNo} in base group ${firstGroupIndex}`);
    rows.push(`            { ${strip.slice(1).map(luaString).join(", ")} },`);
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildBaseReelCellSymbolTable()",
    "        return {",
    ...rows,
    "        }",
    "    end",
  ].join("\n");
}

function makeReelStrips(data) {
  const groupLines = [];
  for (const baseBetIndex of [...data.reelGroups.keys()].sort((a, b) => a - b)) {
    const reels = data.reelGroups.get(baseBetIndex);
    groupLines.push(`            [${baseBetIndex}] = {`);
    for (let reelNo = 1; reelNo <= 5; reelNo += 1) {
      const strip = reels.get(reelNo);
      if (!strip) throw new Error(`Missing reel ${reelNo} in BaseBet ${baseBetIndex}`);
      const cells = strip.slice(1);
      if (cells.length === 0 || cells.some((cell) => !cell)) {
        throw new Error(`BaseBet ${baseBetIndex} reel ${reelNo} has missing StopIndex values`);
      }
      groupLines.push(`                [${reelNo}] = { ${cells.map(luaString).join(", ")} },`);
    }
    groupLines.push("            },");
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildReelStrips()",
    "        return {",
    ...groupLines,
    "        }",
    "    end",
  ].join("\n");
}

function makeReelStripCellData(data) {
  const groupLines = [];
  for (const baseBetIndex of [...data.reelCellGroups.keys()].sort((a, b) => a - b)) {
    const reels = data.reelCellGroups.get(baseBetIndex);
    groupLines.push(`            [${baseBetIndex}] = {`);
    for (let reelNo = 1; reelNo <= 5; reelNo += 1) {
      const strip = reels.get(reelNo);
      if (!strip) throw new Error(`Missing reel cell data ${reelNo} in BaseBet ${baseBetIndex}`);
      const cells = strip.slice(1);
      if (cells.length === 0 || cells.some((cell) => !cell)) {
        throw new Error(`BaseBet ${baseBetIndex} reel ${reelNo} has missing cell data values`);
      }
      groupLines.push(`                [${reelNo}] = {`);
      for (const cell of cells) {
        groupLines.push(`                    { symbolId = ${luaString(cell.symbolId)}, idleSpriteRuid = ${luaString(cell.idleSpriteRuid)}, winAnimationRuid = ${luaString(cell.winAnimationRuid)}, winAnimation = ${luaString(cell.winAnimation)} },`);
      }
      groupLines.push("                },");
    }
    groupLines.push("            },");
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildReelStripCellData()",
    "        return {",
    ...groupLines,
    "        }",
    "    end",
  ].join("\n");
}

function makePaytableTenths(data) {
  const groupLines = [];
  for (const baseBetIndex of [...data.paytableGroups.keys()].sort((a, b) => a - b)) {
    const paytable = data.paytableGroups.get(baseBetIndex);
    groupLines.push(`            [${baseBetIndex}] = {`);
    for (const symbolRow of data.slotSymbolRows) {
      if (symbolRow.isWild) continue;
      const payouts = paytable.get(symbolRow.symbolId) ?? {};
      groupLines.push(`                ${symbolRow.symbolId} = { [3] = ${payouts[3] ?? 0}, [4] = ${payouts[4] ?? 0}, [5] = ${payouts[5] ?? 0} },`);
    }
    groupLines.push("            },");
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildPaytableTenths()",
    "        return {",
    ...groupLines,
    "        }",
    "    end",
  ].join("\n");
}

function makeGetCurrentPaytableTenths() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table GetCurrentPaytableTenths()",
    "        if self.paytableTenths == nil then",
    "            return nil",
    "        end",
    "        local paytable = self.paytableTenths[self.baseBet]",
    "        if paytable == nil then",
    "            paytable = self.paytableTenths[1]",
    "        end",
    "        return paytable",
    "    end",
  ].join("\n");
}

function makeGetCurrentReelStripCells() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table GetCurrentReelStripCells()",
    "        if self.reelStripCellData == nil then",
    "            return nil",
    "        end",
    "        local strips = self.reelStripCellData[self.baseBet]",
    "        if strips == nil then",
    "            strips = self.reelStripCellData[1]",
    "        end",
    "        return strips",
    "    end",
  ].join("\n");
}

function makeGetStripCellDataAt() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table GetStripCellDataAt(integer col, integer index)",
    "        local strips = self:GetCurrentReelStripCells()",
    "        if strips == nil or strips[col] == nil then",
    "            return nil",
    "        end",
    "",
    "        local strip = strips[col]",
    "        local stripLength = #strip",
    "        if stripLength <= 0 then",
    "            return nil",
    "        end",
    "",
    "        local wrappedIndex = ((index - 1) % stripLength) + 1",
    "        return strip[wrappedIndex]",
    "    end",
  ].join("\n");
}

function makeGetVisibleCellData() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table GetVisibleCellData(integer rowIndex, integer col)",
    "        if self.reelVisualIndex == nil then",
    "            return nil",
    "        end",
    "",
    "        local visualIndex = self.reelVisualIndex[col]",
    "        if visualIndex == nil then",
    "            return nil",
    "        end",
    "",
    "        local virtualIndex = visualIndex + rowIndex - 2",
    "        return self:GetStripCellDataAt(col, virtualIndex)",
    "    end",
  ].join("\n");
}

function makeRefreshReelStripResources() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void RefreshReelStripResources()",
    "        local strips = self:GetCurrentReelStrips()",
    "        if strips == nil or self.reelCellSymbolRenderers == nil then",
    "            return",
    "        end",
    "",
    "        for col = 1, 5 do",
    "            if self.reelCellSymbolRenderers[col] ~= nil then",
    "                for displayIndex = 1, 34 do",
    "                    local renderer = self.reelCellSymbolRenderers[col][displayIndex]",
    "                    local frameRenderer = nil",
    "                    if self.reelCellFrameRenderers ~= nil and self.reelCellFrameRenderers[col] ~= nil then",
    "                        frameRenderer = self.reelCellFrameRenderers[col][displayIndex]",
    "                    end",
    "",
    "                    local virtualIndex = displayIndex - 2",
    "                    local cellData = self:GetStripCellDataAt(col, virtualIndex)",
    "                    local symbolId = self:GetStripSymbolAt(col, virtualIndex)",
    "                    if cellData ~= nil and cellData.symbolId ~= nil and cellData.symbolId ~= \"\" then",
    "                        symbolId = cellData.symbolId",
    "                    end",
    "",
    "                    local symbolData = self.slotSymbols[symbolId]",
    "                    local imageRuid = nil",
    "                    if cellData ~= nil then",
    "                        imageRuid = cellData.idleSpriteRuid",
    "                    end",
    "                    if (imageRuid == nil or imageRuid == \"\") and symbolData ~= nil then",
    "                        imageRuid = symbolData.resourcePath",
    "                    end",
    "",
    "                    if renderer ~= nil and imageRuid ~= nil and imageRuid ~= \"\" then",
    "                        renderer.ImageRUID = imageRuid",
    "                        renderer.Color = Color(1.0, 1.0, 1.0, 1.0)",
    "                    end",
    "                    if frameRenderer ~= nil then",
    "                        if self:IsWildSymbol(symbolId) then",
    "                            frameRenderer.Color = Color(0.48, 0.06, 0.11, 1.0)",
    "                        else",
    "                            frameRenderer.Color = Color(1.0, 1.0, 1.0, 1.0)",
    "                        end",
    "                    end",
    "                end",
    "            end",
    "        end",
    "    end",
  ].join("\n");
}

function makePaylines(data) {
  const rows = data.paylineRows.map((row) =>
    `            { id = ${luaString(row.id)}, rowIndex = ${row.rowIndex}, enabled = ${luaValue(row.enabled)}, costCountsAsLine = ${luaValue(row.costCountsAsLine)} },`
  );
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildPaylines()",
    "        return {",
    ...rows,
    "        }",
    "    end",
  ].join("\n");
}

function makeSpinProfiles(data) {
  const rows = data.spinProfileRows.map((row) =>
    `            { id = ${luaString(row.id)}, weight = ${row.weight}, firstMin = ${row.firstMin}, firstMax = ${row.firstMax}, staggerMin = ${row.staggerMin}, staggerMax = ${row.staggerMax} },`
  );
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildSpinProfiles()",
    "        return {",
    ...rows,
    "        }",
    "    end",
  ].join("\n");
}

function makeScreenSprayVfxConfig(data) {
  const config = data.screenSprayVfx ?? {};
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildScreenSprayVfxConfig()",
    "        return {",
    `            triggerKey = ${luaString(config.triggerKey ?? "BIG_MATCH_SCREEN_SPRAY")},`,
    `            animationClipRuid = ${luaString(config.animationClipRuid ?? "")},`,
    `            minFourPlusLineWins = ${Number(config.minFourPlusLineWins ?? 2)},`,
    `            minFivePlusLineWins = ${Number(config.minFivePlusLineWins ?? 1)},`,
    `            playRate = ${Number(config.playRate ?? 1.0)},`,
    `            fallbackHideSeconds = ${Number(config.fallbackHideSeconds ?? 1.25)},`,
    "        }",
    "    end",
  ].join("\n");
}

function makeBonusSlotRules(data) {
  const config = data.bonusSlotRules ?? {};
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildBonusSlotRules()",
    "        return {",
    `            triggerKey = ${luaString(config.triggerKey ?? "WILD_5_BONUS_SLOT")},`,
    `            requiredSymbolId = ${luaString(config.requiredSymbolId ?? "WILD")},`,
    `            requiredMatchCount = ${Number(config.requiredMatchCount ?? 5)},`,
    `            minTriggerLineCount = ${Number(config.minTriggerLineCount ?? 1)},`,
    `            initialChanceCount = ${Number(config.initialChanceCount ?? 0)},`,
    `            reelCount = ${Number(config.reelCount ?? 3)},`,
    `            requiredSameCount = ${Number(config.requiredSameCount ?? 3)},`,
    `            digitMin = ${Number(config.digitMin ?? 1)},`,
    `            digitMax = ${Number(config.digitMax ?? 7)},`,
    `            maxTotalSpinCount = ${Number(config.maxTotalSpinCount ?? 0)},`,
    `            enabled = ${luaValue(config.enabled === true)},`,
    `            runtimeBuildKind = ${luaString(runtimeBuildKind)},`,
    `            testCheatEnabled = ${luaValue(config.testCheatEnabled === true)},`,
    `            testCheatForceTrigger = ${luaValue(config.testCheatForceTrigger === true)},`,
    `            testCheatForceResultKey = ${luaString(config.testCheatForceResultKey ?? "777")},`,
    `            testCheatUseCount = ${Number(config.testCheatUseCount ?? 0)},`,
    `            testCheatRequiredRuntimeKind = ${luaString(config.testCheatRequiredRuntimeKind ?? "TEST_SANDBOX")},`,
    "        }",
    "    end",
  ].join("\n");
}

function makeBonusSlotPaytable(data) {
  const rows = data.bonusSlotPaytableRows ?? [];
  const digits = rows.map((row) => row.digit);
  const totalWeight = rows.reduce((sum, row) => sum + row.rollWeight, 0);
  const rowLines = rows.map((row) =>
    `            [${row.digit}] = { resultKey = ${luaString(row.resultKey)}, rewardMultiplier = ${row.rewardMultiplier}, extraChanceCount = ${row.extraChanceCount}, rollWeight = ${row.rollWeight} },`
  );
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildBonusSlotPaytable()",
    "        return {",
    `            digits = { ${digits.join(", ")} },`,
    `            totalWeight = ${totalWeight},`,
    "            rows = {",
    ...rowLines,
    "            },",
    "        }",
    "    end",
  ].join("\n");
}

function makeBuildCheatCommands(data) {
  const rows = data.cheatCommandRows ?? [];
  const rowLines = rows.map((row, index) =>
    `            [${index + 1}] = { code = ${luaString(row.code)}, description = ${luaString(row.description)}, cheatType = ${luaString(row.cheatType)}, targetKey = ${luaString(row.targetKey)}, forceResultKey = ${luaString(row.forceResultKey)}, useCount = ${Number(row.useCount ?? 1)}, requiredRuntimeKind = ${luaString(row.requiredRuntimeKind || "TEST_SANDBOX")}, enabled = ${luaValue(row.enabled === true)} },`
  );
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildCheatCommands()",
    "        return {",
    ...rowLines,
    "        }",
    "    end",
  ].join("\n");
}

function makeIsBonusSlotLineTrigger() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method boolean IsBonusSlotLineTrigger(table matchedCells, integer runLength)",
    "        local config = self.bonusSlotRules",
    "        if config == nil or config.enabled ~= true then",
    "            return false",
    "        end",
    "        if matchedCells == nil or runLength < (config.requiredMatchCount or 5) then",
    "            return false",
    "        end",
    "        for index = 1, config.requiredMatchCount do",
    "            if matchedCells[index] ~= config.requiredSymbolId then",
    "                return false",
    "            end",
    "        end",
    "        return true",
    "    end",
  ].join("\n");
}

function makeGetBonusSlotPaytableRow() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table GetBonusSlotPaytableRow(integer digit)",
    "        if self.bonusSlotPaytable == nil or self.bonusSlotPaytable.rows == nil then",
    "            return nil",
    "        end",
    "        return self.bonusSlotPaytable.rows[digit]",
    "    end",
  ].join("\n");
}

function makeRollBonusSlotDigit() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method integer RollBonusSlotDigit()",
    "        if self.bonusSlotPaytable == nil or self.bonusSlotPaytable.digits == nil then",
    "            return 0",
    "        end",
    "        local totalWeight = self.bonusSlotPaytable.totalWeight or 0",
    "        if totalWeight <= 0 then",
    "            return 0",
    "        end",
    "        local roll = _UtilLogic:RandomIntegerRange(1, totalWeight)",
    "        for _, digit in ipairs(self.bonusSlotPaytable.digits) do",
    "            local row = self:GetBonusSlotPaytableRow(digit)",
    "            if row ~= nil then",
    "                roll = roll - (row.rollWeight or 0)",
    "                if roll <= 0 then",
    "                    return digit",
    "                end",
    "            end",
    "        end",
    "        return self.bonusSlotPaytable.digits[1] or 0",
    "    end",
  ].join("\n");
}

function makeIsBonusSlotTestCheatAllowed() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method boolean IsBonusSlotTestCheatAllowed()",
    "        local config = self.bonusSlotRules",
    "        if config == nil or config.testCheatEnabled ~= true then",
    "            return false",
    "        end",
    "        if self.bonusSlotTestCheatRemaining == nil or self.bonusSlotTestCheatRemaining <= 0 then",
    "            return false",
    "        end",
    "        local requiredRuntimeKind = config.testCheatRequiredRuntimeKind or \"TEST_SANDBOX\"",
    "        if (config.runtimeBuildKind or \"\") ~= requiredRuntimeKind then",
    "            return false",
    "        end",
    "        return true",
    "    end",
  ].join("\n");
}

function makeResolveSpinResult() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table ResolveSpinResult()",
    "        if self:IsBonusSlotTestCheatAllowed() == true and self.bonusSlotRules ~= nil and self.bonusSlotRules.testCheatForceTrigger == true then",
    "            return self:BuildBonusSlotTestCheatSpinResult()",
    "        end",
    "",
    "        local grid = { {}, {}, {} }",
    "        local stopIndexes = {}",
    "        local strips = self:GetCurrentReelStrips()",
    "        for col = 1, 5 do",
    "            local stopIndex = _UtilLogic:RandomIntegerRange(1, #strips[col])",
    "            stopIndexes[col] = stopIndex",
    "            grid[1][col] = self:GetStripSymbolAt(col, stopIndex - 1)",
    "            grid[2][col] = self:GetStripSymbolAt(col, stopIndex)",
    "            grid[3][col] = self:GetStripSymbolAt(col, stopIndex + 1)",
    "        end",
    "        return {",
    "            row = grid[2],",
    "            grid = grid,",
    "            stopIndexes = stopIndexes,",
    "        }",
    "    end",
  ].join("\n");
}

function makeBuildBonusSlotTestCheatSpinResult() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildBonusSlotTestCheatSpinResult()",
    "        local grid = { {}, {}, {} }",
    "        local stopIndexes = {}",
    "        local strips = self:GetCurrentReelStrips()",
    "        local requiredSymbolId = \"WILD\"",
    "        if self.bonusSlotRules ~= nil and self.bonusSlotRules.requiredSymbolId ~= nil and self.bonusSlotRules.requiredSymbolId ~= \"\" then",
    "            requiredSymbolId = self.bonusSlotRules.requiredSymbolId",
    "        end",
    "",
    "        for col = 1, 5 do",
    "            local stripLength = #strips[col]",
    "            local stopIndex = 1",
    "            local found = false",
    "            for index = 1, stripLength do",
    "                if self:GetStripSymbolAt(col, index) == requiredSymbolId then",
    "                    stopIndex = index",
    "                    found = true",
    "                    break",
    "                end",
    "            end",
    "            if found ~= true then",
    "                stopIndex = _UtilLogic:RandomIntegerRange(1, stripLength)",
    "            end",
    "            stopIndexes[col] = stopIndex",
    "            grid[1][col] = self:GetStripSymbolAt(col, stopIndex - 1)",
    "            grid[2][col] = self:GetStripSymbolAt(col, stopIndex)",
    "            grid[3][col] = self:GetStripSymbolAt(col, stopIndex + 1)",
    "            if found ~= true then",
    "                grid[2][col] = requiredSymbolId",
    "            end",
    "        end",
    "",
    "        return {",
    "            row = grid[2],",
    "            grid = grid,",
    "            stopIndexes = stopIndexes,",
    "            bonusSlotTestCheatUsed = true,",
    "        }",
    "    end",
  ].join("\n");
}

function makeBuildForcedBonusSlotDigits() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildForcedBonusSlotDigits(string resultKey)",
    "        local config = self.bonusSlotRules",
    "        local reelCount = 3",
    "        if config ~= nil and config.reelCount ~= nil then",
    "            reelCount = config.reelCount",
    "        end",
    "        local digits = {}",
    "        for reel = 1, reelCount do",
    "            local digitText = string.sub(resultKey or \"\", reel, reel)",
    "            local digit = tonumber(digitText)",
    "            if digit == nil then",
    "                digit = self:RollBonusSlotDigit()",
    "            end",
    "            digits[reel] = digit",
    "        end",
    "        return digits",
    "    end",
  ].join("\n");
}

function makeBuildBonusSlotResultKey() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method string BuildBonusSlotResultKey(table digits)",
    "        local resultKey = \"\"",
    "        if digits == nil then",
    "            return resultKey",
    "        end",
    "        for _, digit in ipairs(digits) do",
    "            resultKey = resultKey .. tostring(digit)",
    "        end",
    "        return resultKey",
    "    end",
  ].join("\n");
}

function makeGetMatchedBonusSlotDigit() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method integer GetMatchedBonusSlotDigit(table digits)",
    "        local config = self.bonusSlotRules",
    "        if digits == nil or config == nil then",
    "            return 0",
    "        end",
    "        local requiredSameCount = config.requiredSameCount or 3",
    "        if #digits < requiredSameCount then",
    "            return 0",
    "        end",
    "        local digit = digits[1]",
    "        for index = 2, requiredSameCount do",
    "            if digits[index] ~= digit then",
    "                return 0",
    "            end",
    "        end",
    "        return digit",
    "    end",
  ].join("\n");
}

function makeResolveBonusSlot() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table ResolveBonusSlot(table result)",
    "        local config = self.bonusSlotRules",
    "        if result == nil or config == nil or config.enabled ~= true then",
    "            return { triggered = false, payoutUnits = 0 }",
    "        end",
    "        local triggerLineCount = result.bonusSlotTriggerLineCount or 0",
    "        if triggerLineCount < (config.minTriggerLineCount or 1) then",
    "            return { triggered = false, payoutUnits = 0 }",
    "        end",
    "",
    "        local chances = config.initialChanceCount or 0",
    "        local maxTotalSpinCount = config.maxTotalSpinCount or chances",
    "        local spinCount = 0",
    "        local hitCount = 0",
    "        local extraChanceCount = 0",
    "        local totalPayoutUnits = 0",
    "        local spins = {}",
    "        local testCheatAllowed = self:IsBonusSlotTestCheatAllowed()",
    "        local testCheatForceResultKey = \"\"",
    "        if testCheatAllowed == true then",
    "            testCheatForceResultKey = config.testCheatForceResultKey or \"\"",
    "        end",
    "",
    "        while chances > 0 and spinCount < maxTotalSpinCount do",
    "            chances = chances - 1",
    "            spinCount = spinCount + 1",
    "            local digits = {}",
    "            if spinCount == 1 and testCheatForceResultKey ~= \"\" then",
    "                digits = self:BuildForcedBonusSlotDigits(testCheatForceResultKey)",
    "            else",
    "                for reel = 1, config.reelCount do",
    "                    digits[reel] = self:RollBonusSlotDigit()",
    "                end",
    "            end",
    "",
    "            local resultKey = self:BuildBonusSlotResultKey(digits)",
    "            local matchedDigit = self:GetMatchedBonusSlotDigit(digits)",
    "            local rewardMultiplier = 0",
    "            local payoutUnits = 0",
    "            local extraChance = 0",
    "            if matchedDigit > 0 then",
    "                local paytableRow = self:GetBonusSlotPaytableRow(matchedDigit)",
    "                if paytableRow ~= nil then",
    "                    rewardMultiplier = paytableRow.rewardMultiplier or 0",
    "                    extraChance = paytableRow.extraChanceCount or 0",
    "                    payoutUnits = self.baseBet * self.multiplier * rewardMultiplier * self.coinUnitPerCoin",
    "                    totalPayoutUnits = totalPayoutUnits + payoutUnits",
    "                    extraChanceCount = extraChanceCount + extraChance",
    "                    chances = chances + extraChance",
    "                    hitCount = hitCount + 1",
    "                end",
    "            end",
    "",
    "            table.insert(spins, {",
    "                resultKey = resultKey,",
    "                matchedDigit = matchedDigit,",
    "                rewardMultiplier = rewardMultiplier,",
    "                payoutUnits = payoutUnits,",
    "                extraChanceCount = extraChance,",
    "            })",
    "        end",
    "",
    "        return {",
    "            triggered = true,",
    "            triggerLineCount = triggerLineCount,",
    "            spinCount = spinCount,",
    "            hitCount = hitCount,",
    "            extraChanceCount = extraChanceCount,",
    "            payoutUnits = totalPayoutUnits,",
    "            spins = spins,",
    "            testCheatUsed = testCheatAllowed,",
    "        }",
    "    end",
  ].join("\n");
}

function makeApplyBonusSlotResult() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void ApplyBonusSlotResult(table result)",
    "        if result == nil then",
    "            return",
    "        end",
    "        local testCheatAllowed = self:IsBonusSlotTestCheatAllowed()",
    "        local bonusSlotResult = self:ResolveBonusSlot(result)",
    "        result.bonusSlotResult = bonusSlotResult",
    "        if bonusSlotResult ~= nil and bonusSlotResult.triggered == true then",
    "            result.payoutUnits = result.payoutUnits + (bonusSlotResult.payoutUnits or 0)",
    "            if testCheatAllowed == true and (result.bonusSlotTestCheatUsed == true or bonusSlotResult.testCheatUsed == true) then",
    "                self.bonusSlotTestCheatRemaining = math.max(0, (self.bonusSlotTestCheatRemaining or 0) - 1)",
    "            end",
    "        end",
    "    end",
  ].join("\n");
}

function makeFormatBonusSlotStatus() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method string FormatBonusSlotStatus(table bonusSlotResult)",
    "        if bonusSlotResult == nil or bonusSlotResult.triggered ~= true then",
    "            return \"\"",
    "        end",
    "        return self:FormatTemplate(self.textTemplates.BonusSlotStatus, { tostring(bonusSlotResult.spinCount or 0), self:FormatUnits(bonusSlotResult.payoutUnits or 0) })",
    "    end",
  ].join("\n");
}

function makeHideBonus777Panel() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void HideBonus777Panel()",
    "        if self.bonus777Panel ~= nil then",
    "            self.bonus777Panel.Enable = false",
    "        end",
    "        self:SetBonus777LeverOffset(0.0)",
    "    end",
  ].join("\n");
}

function makeGetBonus777ReelStripTransform() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method any GetBonus777ReelStripTransform(integer reelIndex)",
    "        if reelIndex == 1 then",
    "            return self.bonus777ReelStripTransform1",
    "        elseif reelIndex == 2 then",
    "            return self.bonus777ReelStripTransform2",
    "        elseif reelIndex == 3 then",
    "            return self.bonus777ReelStripTransform3",
    "        end",
    "        return nil",
    "    end",
  ].join("\n");
}

function makeGetBonus777DigitCellHeight() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method float GetBonus777DigitCellHeight()",
    "        return 174.0",
    "    end",
  ].join("\n");
}

function makeGetBonus777DigitCount() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method integer GetBonus777DigitCount()",
    "        return 7",
    "    end",
  ].join("\n");
}

function makeGetBonus777CenterYForDigit() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method float GetBonus777CenterYForDigit(integer digit)",
    "        local digitCount = self:GetBonus777DigitCount()",
    "        if digit < 1 then",
    "            digit = 1",
    "        elseif digit > digitCount then",
    "            digit = digitCount",
    "        end",
    "        return (digit - ((digitCount + 1) * 0.5)) * self:GetBonus777DigitCellHeight()",
    "    end",
  ].join("\n");
}

function makeGetBonus777MinStripY() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method float GetBonus777MinStripY()",
    "        return self:GetBonus777CenterYForDigit(1) - self:GetBonus777DigitCellHeight()",
    "    end",
  ].join("\n");
}

function makeMoveBonus777ReelDown() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void MoveBonus777ReelDown(integer reelIndex, float pixelDelta)",
    "        local transform = self:GetBonus777ReelStripTransform(reelIndex)",
    "        if transform == nil then",
    "            return",
    "        end",
    "        local pos = transform.anchoredPosition",
    "        local nextY = pos.y - pixelDelta",
    "        local stripHeight = self:GetBonus777DigitCount() * self:GetBonus777DigitCellHeight()",
    "        local minY = self:GetBonus777MinStripY()",
    "        while nextY < minY do",
    "            nextY = nextY + stripHeight",
    "        end",
    "        transform.anchoredPosition = Vector2(pos.x, nextY)",
    "    end",
  ].join("\n");
}

function makeSetBonus777ReelDigitFallback() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetBonus777ReelDigitFallback(integer reelIndex, integer digit)",
    "        local text = tostring(digit)",
    "        if reelIndex == 1 and self.bonus777ReelText1 ~= nil then",
    "            self.bonus777ReelText1.Text = text",
    "        elseif reelIndex == 2 and self.bonus777ReelText2 ~= nil then",
    "            self.bonus777ReelText2.Text = text",
    "        elseif reelIndex == 3 and self.bonus777ReelText3 ~= nil then",
    "            self.bonus777ReelText3.Text = text",
    "        end",
    "    end",
  ].join("\n");
}

function makeSetBonus777ReelDigit() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetBonus777ReelDigit(integer reelIndex, integer digit)",
    "        local transform = self:GetBonus777ReelStripTransform(reelIndex)",
    "        if transform ~= nil then",
    "            local pos = transform.anchoredPosition",
    "            transform.anchoredPosition = Vector2(pos.x, self:GetBonus777CenterYForDigit(digit))",
    "            return",
    "        end",
    "        self:SetBonus777ReelDigitFallback(reelIndex, digit)",
    "    end",
  ].join("\n");
}

function makeSetBonus777DigitsFromResultKey() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetBonus777DigitsFromResultKey(string resultKey)",
    "        for reelIndex = 1, 3 do",
    "            local digitText = string.sub(resultKey or \"\", reelIndex, reelIndex)",
    "            local digit = tonumber(digitText)",
    "            if digit == nil then",
    "                digit = 0",
    "            end",
    "            self:SetBonus777ReelDigit(reelIndex, digit)",
    "        end",
    "    end",
  ].join("\n");
}

function makeSetBonus777Texts() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetBonus777Texts(string chanceText, string resultText)",
    "        if self.bonus777ChanceText ~= nil then",
    "            self.bonus777ChanceText.Text = chanceText or \"\"",
    "        end",
    "        if self.bonus777ResultText ~= nil then",
    "            self.bonus777ResultText.Text = resultText or \"\"",
    "        end",
    "    end",
  ].join("\n");
}

function makeSetBonus777LeverOffset() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetBonus777LeverOffset(float offsetY)",
    "        if self.bonus777LeverTransform == nil then",
    "            return",
    "        end",
    "        self.bonus777LeverTransform.anchoredPosition = Vector2(509.5, 80.0 + offsetY)",
    "    end",
  ].join("\n");
}

function makeUpdateBonus777LeverPull() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void UpdateBonus777LeverPull(float elapsed)",
    "        local duration = 0.36",
    "        local pullDistance = -72.0",
    "        local offsetY = 0.0",
    "        if elapsed < duration then",
    "            local half = duration * 0.5",
    "            if elapsed < half then",
    "                offsetY = pullDistance * (elapsed / half)",
    "            else",
    "                offsetY = pullDistance * (1.0 - ((elapsed - half) / half))",
    "            end",
    "        end",
    "        self:SetBonus777LeverOffset(offsetY)",
    "    end",
  ].join("\n");
}

function makePlayBonus777ReelSpin() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void PlayBonus777ReelSpin(table digits)",
    "        local tick = 0.016",
    "        local elapsed = 0.0",
    "        local cellHeight = self:GetBonus777DigitCellHeight()",
    "        local stopTimes = { 0.56, 0.72, 0.9 }",
    "        local cellsPerSecond = { 32.0, 36.0, 40.0 }",
    "        local stopped = { false, false, false }",
    "        local stoppedCount = 0",
    "",
    "        while stoppedCount < 3 do",
    "            self:UpdateBonus777LeverPull(elapsed)",
    "            for reelIndex = 1, 3 do",
    "                if not stopped[reelIndex] then",
    "                    if elapsed >= stopTimes[reelIndex] then",
    "                        local digit = 1",
    "                        if digits ~= nil and digits[reelIndex] ~= nil then",
    "                            digit = digits[reelIndex]",
    "                        end",
    "                        self:SetBonus777ReelDigit(reelIndex, digit)",
    "                        stopped[reelIndex] = true",
    "                        stoppedCount = stoppedCount + 1",
    "                    else",
    "                        self:MoveBonus777ReelDown(reelIndex, cellsPerSecond[reelIndex] * cellHeight * tick)",
    "                    end",
    "                end",
    "            end",
    "",
    "            if stoppedCount < 3 then",
    "                wait(tick)",
    "                elapsed = elapsed + tick",
    "            end",
    "        end",
    "        self:SetBonus777LeverOffset(0.0)",
    "    end",
  ].join("\n");
}

function makePlayBonus777Presentation() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void PlayBonus777Presentation(table bonusSlotResult)",
    "        if bonusSlotResult == nil or bonusSlotResult.triggered ~= true then",
    "            self:HideBonus777Panel()",
    "            return",
    "        end",
    "        if self.bonus777Panel == nil then",
    "            return",
    "        end",
    "",
    "        self.bonus777Panel.Enable = true",
    "        self:SetBonus777DigitsFromResultKey(\"777\")",
    "        self:SetBonus777Texts(\"CHANCE 0 / \" .. tostring(bonusSlotResult.spinCount or 0), \"WILD x5 BONUS\")",
    "        wait(0.25)",
    "",
    "        local spins = bonusSlotResult.spins or {}",
    "        local totalSpinCount = #spins",
    "        if totalSpinCount <= 0 then",
    "            totalSpinCount = bonusSlotResult.spinCount or 0",
    "        end",
    "",
    "        for spinIndex, spin in ipairs(spins) do",
    "            self:SetBonus777Texts(\"CHANCE \" .. tostring(spinIndex) .. \" / \" .. tostring(totalSpinCount), \"GENERATE!!\")",
    "            local resultKey = spin.resultKey or \"000\"",
    "            self:PlayBonus777ReelSpin(spin.digits)",
    "            self:SetBonus777DigitsFromResultKey(resultKey)",
    "            if (spin.matchedDigit or 0) > 0 then",
    "                local resultText = resultKey .. \" x\" .. tostring(spin.rewardMultiplier or 0) .. \" = +\" .. self:FormatUnits(spin.payoutUnits or 0)",
    "                if (spin.extraChanceCount or 0) > 0 then",
    "                    resultText = resultText .. \" / +\" .. tostring(spin.extraChanceCount) .. \" CHANCE\"",
    "                end",
    "                self:SetBonus777Texts(\"HIT \" .. tostring(spinIndex) .. \" / \" .. tostring(totalSpinCount), resultText)",
    "                wait(0.85)",
    "            else",
    "                self:SetBonus777Texts(\"CHANCE \" .. tostring(spinIndex) .. \" / \" .. tostring(totalSpinCount), resultKey .. \" MISS\")",
    "                wait(0.45)",
    "            end",
    "        end",
    "",
    "        self:SetBonus777Texts(\"TOTAL \" .. self:FormatUnits(bonusSlotResult.payoutUnits or 0), \"BONUS COMPLETE\")",
    "        wait(0.75)",
    "        self:HideBonus777Panel()",
    "    end",
  ].join("\n");
}

function makeEvaluatePaylines() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table EvaluatePaylines(table grid)",
    "        local totalPayoutUnits = 0",
    "        local winLineCount = 0",
    "        local maxRunLength = 0",
    "        local fourPlusLineWinCount = 0",
    "        local fivePlusLineWinCount = 0",
    "        local bonusSlotTriggerLineCount = 0",
    "        local lineWins = {}",
    "",
    "        for _, payline in ipairs(self.paylines) do",
    "            if payline.enabled then",
    "                local lineResult = self:EvaluateLine(grid[payline.rowIndex], payline.id, payline.rowIndex)",
    "                local isBonusSlotTrigger = self:IsBonusSlotLineTrigger(lineResult.cells, lineResult.runLength)",
    "                lineResult.bonusSlotTrigger = isBonusSlotTrigger",
    "                if lineResult.payoutUnits > 0 or isBonusSlotTrigger then",
    "                    if lineResult.payoutUnits > 0 then",
    "                        totalPayoutUnits = totalPayoutUnits + lineResult.payoutUnits",
    "                    end",
    "                    if isBonusSlotTrigger then",
    "                        bonusSlotTriggerLineCount = bonusSlotTriggerLineCount + 1",
    "                    end",
    "                    winLineCount = winLineCount + 1",
    "                    if lineResult.runLength > maxRunLength then",
    "                        maxRunLength = lineResult.runLength",
    "                    end",
    "                    if lineResult.runLength >= 4 then",
    "                        fourPlusLineWinCount = fourPlusLineWinCount + 1",
    "                    end",
    "                    if lineResult.runLength >= 5 then",
    "                        fivePlusLineWinCount = fivePlusLineWinCount + 1",
    "                    end",
    "                    table.insert(lineWins, lineResult)",
    "                end",
    "            end",
    "        end",
    "",
    "        return {",
    "            payoutUnits = totalPayoutUnits,",
    "            winLineCount = winLineCount,",
    "            maxRunLength = maxRunLength,",
    "            fourPlusLineWinCount = fourPlusLineWinCount,",
    "            fivePlusLineWinCount = fivePlusLineWinCount,",
    "            bonusSlotTriggerLineCount = bonusSlotTriggerLineCount,",
    "            lineWins = lineWins,",
    "        }",
    "    end",
  ].join("\n");
}

function makeShouldPlayScreenSprayVfx() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method boolean ShouldPlayScreenSprayVfx(table result)",
    "        if result == nil or self.screenSprayVfxConfig == nil then",
    "            return false",
    "        end",
    "        local config = self.screenSprayVfxConfig",
    "        if config.animationClipRuid == nil or config.animationClipRuid == \"\" then",
    "            return false",
    "        end",
    "        local fourPlusLineWins = result.fourPlusLineWinCount or 0",
    "        local fivePlusLineWins = result.fivePlusLineWinCount or 0",
    "        if config.minFourPlusLineWins ~= nil and config.minFourPlusLineWins > 0 and fourPlusLineWins >= config.minFourPlusLineWins then",
    "            return true",
    "        end",
    "        if config.minFivePlusLineWins ~= nil and config.minFivePlusLineWins > 0 and fivePlusLineWins >= config.minFivePlusLineWins then",
    "            return true",
    "        end",
    "        return false",
    "    end",
  ].join("\n");
}

function makeHideScreenSprayVfx() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void HideScreenSprayVfx()",
    "        if self.screenSprayVfxTimerId ~= nil then",
    "            _TimerService:ClearTimer(self.screenSprayVfxTimerId)",
    "            self.screenSprayVfxTimerId = nil",
    "        end",
    "        if self.screenSprayVfxEntity ~= nil then",
    "            self.screenSprayVfxEntity.Enable = false",
    "        end",
    "    end",
  ].join("\n");
}

function makePlayScreenSprayVfxOnce() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void PlayScreenSprayVfxOnce()",
    "        if self.screenSprayVfxEntity == nil or self.screenSprayVfxRenderer == nil or self.screenSprayVfxConfig == nil then",
    "            return",
    "        end",
    "        local animationRuid = self.screenSprayVfxConfig.animationClipRuid",
    "        if animationRuid == nil or animationRuid == \"\" then",
    "            return",
    "        end",
    "",
    "        self:HideScreenSprayVfx()",
    "        self.screenSprayVfxRenderer.ImageRUID = animationRuid",
    "        self.screenSprayVfxRenderer.AnimClipPlayType = SpriteAnimClipPlayType.Onetime",
    "        self.screenSprayVfxRenderer.StartFrameIndex = 0",
    "        self.screenSprayVfxRenderer.EndFrameIndex = 2147483647",
    "        self.screenSprayVfxRenderer.PlayRate = self.screenSprayVfxConfig.playRate or 1.0",
    "        self.screenSprayVfxRenderer.Color = Color(1.0, 1.0, 1.0, 1.0)",
    "        self.screenSprayVfxEntity.Enable = false",
    "        self.screenSprayVfxEntity.Enable = true",
    "",
    "        local hideDelay = self.screenSprayVfxConfig.fallbackHideSeconds or 1.25",
    "        self.screenSprayVfxTimerId = _TimerService:SetTimerOnce(function()",
    "            self.screenSprayVfxTimerId = nil",
    "            self:HideScreenSprayVfx()",
    "        end, hideDelay)",
    "    end",
  ].join("\n");
}

function patchScreenSprayVfxProperties(runtime) {
  if (!runtime.includes("property any screenSprayVfxConfig = nil")) {
    runtime = runtime.replace(
      /    property any spinProfiles = nil\r?\n/,
      (match) => `${match}    property any screenSprayVfxConfig = nil\n    property any screenSprayVfxTimerId = nil\n`,
    );
  }
  return runtime;
}

function patchScreenSprayVfxFlow(runtime) {
  runtime = upsertTypedMethod(runtime, "boolean", "ShouldPlayScreenSprayVfx", makeShouldPlayScreenSprayVfx(), "ApplyWinPresentation");
  runtime = upsertTypedMethod(runtime, "void", "HideScreenSprayVfx", makeHideScreenSprayVfx(), "ApplyWinPresentation");
  runtime = upsertTypedMethod(runtime, "void", "PlayScreenSprayVfxOnce", makePlayScreenSprayVfxOnce(), "ApplyWinPresentation");

  if (!runtime.includes("self.screenSprayVfxConfig = self:BuildScreenSprayVfxConfig()")) {
    runtime = runtime.replace(
      /        self\.spinProfiles = self:BuildSpinProfiles\(\)\r?\n/,
      (match) => `${match}        self.screenSprayVfxConfig = self:BuildScreenSprayVfxConfig()\n        self.screenSprayVfxTimerId = nil\n        self:HideScreenSprayVfx()\n`,
    );
  }

  const onEndPlayMatch = runtime.match(/    @ExecSpace\("ClientOnly"\)\r?\n    method void OnEndPlay\(\)\r?\n[\s\S]*?\r?\n    end/);
  if (!onEndPlayMatch || !onEndPlayMatch[0].includes("self:HideScreenSprayVfx()")) {
    runtime = runtime.replace(
      /    method void OnEndPlay\(\)\r?\n        self:StopWinVfxFrameLoop\(\)\r?\n/,
      "    method void OnEndPlay()\n        self:StopWinVfxFrameLoop()\n        self:HideScreenSprayVfx()\n",
    );
  }

  if (!runtime.includes("self:PlayScreenSprayVfxOnce()")) {
    runtime = runtime.replace(
      /            self:ApplyWinPresentation\(result\.lineWins\)\r?\n/,
      "            self:ApplyWinPresentation(result.lineWins)\n            if self:ShouldPlayScreenSprayVfx(result) then\n                self:PlayScreenSprayVfxOnce()\n            end\n",
    );
  }

  runtime = runtime.replace(/(        self:HideScreenSprayVfx\(\)\r?\n){2,}/g, "        self:HideScreenSprayVfx()\n");

  return runtime;
}

function replaceMethod(runtime, methodName, replacement) {
  const pattern = new RegExp(`[ \\t]*@ExecSpace\\("ClientOnly"\\)\\r?\\n    method table ${methodName}\\([^\\n]*\\)\\r?\\n[\\s\\S]*?\\r?\\n    end`);
  if (!pattern.test(runtime)) {
    throw new Error(`Missing method to replace: ${methodName}`);
  }
  return runtime.replace(pattern, replacement);
}

function replaceVoidMethod(runtime, methodName, replacement) {
  const pattern = new RegExp(`[ \\t]*@ExecSpace\\("ClientOnly"\\)\\r?\\n    method void ${methodName}\\([^\\n]*\\)\\r?\\n[\\s\\S]*?\\r?\\n    end`);
  if (!pattern.test(runtime)) {
    throw new Error(`Missing void method to replace: ${methodName}`);
  }
  return runtime.replace(pattern, replacement);
}

function upsertTypedMethod(runtime, returnType, methodName, replacement, beforeMethodName = "ApplyWinPresentation") {
  const pattern = new RegExp(`[ \\t]*@ExecSpace\\("ClientOnly"\\)\\r?\\n    method ${returnType} ${methodName}\\([^\\n]*\\)\\r?\\n[\\s\\S]*?\\r?\\n    end`);
  if (pattern.test(runtime)) {
    return runtime.replace(pattern, replacement);
  }

  const marker = new RegExp(`    @ExecSpace\\("ClientOnly"\\)\\r?\\n    method \\S+ ${beforeMethodName}\\(`);
  const match = runtime.match(marker);
  if (!match || match.index === undefined) {
    throw new Error(`Could not insert ${methodName}; missing method: ${beforeMethodName}`);
  }
  return `${runtime.slice(0, match.index)}${replacement}\n\n${runtime.slice(match.index)}`;
}

function makeIsWildSymbol() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method boolean IsWildSymbol(string symbolId)",
    "        local symbolData = self.slotSymbols[symbolId]",
    "        return symbolData ~= nil and symbolData.isWild == true",
    "    end",
  ].join("\n");
}

function makeEvaluateLine() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table EvaluateLine(table row, string lineId, integer rowIndex)",
    "        local targetSymbol = nil",
    "        local runLength = 0",
    "        local matchedCells = {}",
    "",
    "        for index = 1, 5 do",
    "            local currentSymbol = row[index]",
    "            if self:IsWildSymbol(currentSymbol) then",
    "                runLength = runLength + 1",
    "                matchedCells[runLength] = currentSymbol",
    "            else",
    "                if targetSymbol == nil then",
    "                    targetSymbol = currentSymbol",
    "                    runLength = runLength + 1",
    "                    matchedCells[runLength] = currentSymbol",
    "                elseif currentSymbol == targetSymbol then",
    "                    runLength = runLength + 1",
    "                    matchedCells[runLength] = currentSymbol",
    "                else",
    "                    break",
    "                end",
    "            end",
    "        end",
    "",
    "        local payoutTenths = 0",
    "        local currentPaytableTenths = self:GetCurrentPaytableTenths()",
    "        if targetSymbol ~= nil and runLength >= 3 and currentPaytableTenths ~= nil and currentPaytableTenths[targetSymbol] ~= nil then",
    "            payoutTenths = currentPaytableTenths[targetSymbol][runLength] or 0",
    "        end",
    "",
    "        return {",
    "            lineId = lineId,",
    "            rowIndex = rowIndex,",
    "            symbol = targetSymbol,",
    "            runLength = runLength,",
    "            cells = matchedCells,",
    "            payoutUnits = self.baseBet * self.multiplier * payoutTenths,",
    "        }",
    "    end",
  ].join("\n");
}

function makeHideWinResult() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void HideWinResult()",
    "        if self.winResultPanel ~= nil then",
    "            self.winResultPanel.Enable = false",
    "        end",
    "        if self.winResultLine1 ~= nil then self.winResultLine1.Enable = false end",
    "        if self.winResultLine2 ~= nil then self.winResultLine2.Enable = false end",
    "        if self.winResultLine3 ~= nil then self.winResultLine3.Enable = false end",
    "        if self.winResultText1 ~= nil then self.winResultText1.Text = \"\" end",
    "        if self.winResultText2 ~= nil then self.winResultText2.Text = \"\" end",
    "        if self.winResultText3 ~= nil then self.winResultText3.Text = \"\" end",
    "        if self.winResultTotalText ~= nil then self.winResultTotalText.Text = \"\" end",
    "    end",
  ].join("\n");
}

function makeSetWinResultLine() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetWinResultLine(integer lineSlot, table lineWin, integer visibleLineCount)",
    "        local group = nil",
    "        local icon = nil",
    "        local lineText = nil",
    "        if lineSlot == 1 then",
    "            group = self.winResultLine1",
    "            icon = self.winResultIcon1",
    "            lineText = self.winResultText1",
    "        elseif lineSlot == 2 then",
    "            group = self.winResultLine2",
    "            icon = self.winResultIcon2",
    "            lineText = self.winResultText2",
    "        elseif lineSlot == 3 then",
    "            group = self.winResultLine3",
    "            icon = self.winResultIcon3",
    "            lineText = self.winResultText3",
    "        end",
    "",
    "        if group == nil then",
    "            return",
    "        end",
    "        if lineWin == nil or lineWin.payoutUnits <= 0 or lineWin.symbol == nil then",
    "            group.Enable = false",
    "            return",
    "        end",
    "",
    "        local transform = group.UITransformComponent",
    "        if transform ~= nil then",
    "            local lineWidth = 88.0",
    "            local lineGap = 8.0",
    "            local rightOffset = 64.0 + (visibleLineCount - lineSlot) * (lineWidth + lineGap)",
    "            transform.anchoredPosition = Vector2(-rightOffset, 0.0)",
    "        end",
    "",
    "        local symbolInfo = self.slotSymbols[lineWin.symbol]",
    "        if icon ~= nil and symbolInfo ~= nil then",
    "            icon.ImageRUID = symbolInfo.resourcePath",
    "            icon.Color = Color(1.0, 1.0, 1.0, 1.0)",
    "        end",
    "        if lineText ~= nil then",
    "            lineText.Text = self:FormatTemplate(self.textTemplates.WinLineFormula, { tostring(lineWin.runLength) })",
    "        end",
    "        group.Enable = true",
    "    end",
  ].join("\n");
}

function makeShowWinResult() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void ShowWinResult(table lineWins, integer totalPayoutUnits)",
    "        if self.statusText ~= nil then",
    "            self.statusText.Text = \"\"",
    "        end",
    "        if self.winResultPanel ~= nil then",
    "            self.winResultPanel.Enable = true",
    "        end",
    "",
    "        local visibleWins = {}",
    "        for index = 1, 3 do",
    "            local lineWin = lineWins[index]",
    "            if lineWin ~= nil and lineWin.payoutUnits > 0 and lineWin.symbol ~= nil then",
    "                table.insert(visibleWins, lineWin)",
    "            end",
    "        end",
    "",
    "        local visibleLineCount = #visibleWins",
    "        self:SetWinResultLine(1, visibleWins[1], visibleLineCount)",
    "        self:SetWinResultLine(2, visibleWins[2], visibleLineCount)",
    "        self:SetWinResultLine(3, visibleWins[3], visibleLineCount)",
    "        if self.winResultTotalText ~= nil then",
    "            self.winResultTotalText.Text = self:FormatTemplate(self.textTemplates.WinTotalFormula, { self:FormatUnits(totalPayoutUnits) })",
    "        end",
    "    end",
  ].join("\n");
}

function makeApplyWinPresentation() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void ApplyWinPresentation(table lineWins)",
    "        self:ResetWinHighlights()",
    "        if lineWins == nil then",
    "            return",
    "        end",
    "",
    "        for _, lineWin in ipairs(lineWins) do",
    "            local rowIndex = lineWin.rowIndex",
    "            for col = 1, lineWin.runLength do",
    "                local cellSymbolId = lineWin.symbol",
    "                if lineWin.cells ~= nil and lineWin.cells[col] ~= nil then",
    "                    cellSymbolId = lineWin.cells[col]",
    "                end",
    "                if cellSymbolId ~= nil then",
    "                    self:ActivateWinCell(rowIndex, col, cellSymbolId)",
    "                end",
    "            end",
    "        end",
    "",
    "        self:PlayWinCellAnimation()",
    "    end",
  ].join("\n");
}

function patchWinResultFlow(runtime) {
  runtime = upsertTypedMethod(runtime, "boolean", "IsWildSymbol", makeIsWildSymbol(), "EvaluatePaylines");
  runtime = replaceMethod(runtime, "EvaluatePaylines", makeEvaluatePaylines());
  runtime = upsertTypedMethod(runtime, "table", "GetCurrentPaytableTenths", makeGetCurrentPaytableTenths(), "EvaluateLine");
  runtime = replaceMethod(runtime, "EvaluateLine", makeEvaluateLine());
  runtime = upsertTypedMethod(runtime, "void", "HideWinResult", makeHideWinResult(), "ApplyWinPresentation");
  runtime = upsertTypedMethod(runtime, "void", "SetWinResultLine", makeSetWinResultLine(), "ApplyWinPresentation");
  runtime = upsertTypedMethod(runtime, "void", "ShowWinResult", makeShowWinResult(), "ApplyWinPresentation");
  runtime = replaceVoidMethod(runtime, "ApplyWinPresentation", makeApplyWinPresentation());

  runtime = runtime.replace(
    /            self\.statusText\.Text = self\.textTemplates\.NotEnoughCoins\r?\n            log\("\[SlotMachineRuntime\] Spin rejected: insufficient balance"\)/,
    "            self.statusText.Text = self.textTemplates.NotEnoughCoins\n            self:HideWinResult()\n            log(\"[SlotMachineRuntime] Spin rejected: insufficient balance\")",
  );
  runtime = runtime.replace(
    /        self:ResetWinHighlights\(\)\r?\n\r?\n        local premiumSpent/,
    "        self:ResetWinHighlights()\n        self:HideWinResult()\n\n        local premiumSpent",
  );
  runtime = runtime.replace(
    /            self\.statusText\.Text = self:FormatTemplate\(self\.textTemplates\.WinStatus, \{ tostring\(result\.winLineCount\), self:FormatUnits\(result\.payoutUnits\) \}\)\r?\n            self:ApplyWinPresentation\(result\.lineWins\)/,
    "            self:ShowWinResult(result.lineWins, result.payoutUnits)\n            self:ApplyWinPresentation(result.lineWins)",
  );
  runtime = runtime.replace(
    /            self\.statusText\.Text = ""\r?\n            self:ResetWinHighlights\(\)/,
    "            self.statusText.Text = \"\"\n            self:HideWinResult()\n            self:ResetWinHighlights()",
  );
  runtime = runtime.replace(
    /        self:SetBaseBetListOpen\(false\)\r?\n        self:ResetWinHighlights\(\)/,
    "        self:SetBaseBetListOpen(false)\n        self:HideWinResult()\n        self:ResetWinHighlights()",
  );
  const baseBetResetBlock = "        if selectedBaseBet ~= self.baseBet then\n            self:HideWinResult()\n            self:ResetWinHighlights()\n        end\n";
  runtime = runtime.replace(
    /(        if selectedBaseBet ~= self\.baseBet then\r?\n            self:HideWinResult\(\)\r?\n            self:ResetWinHighlights\(\)\r?\n        end\r?\n)+(?=        self\.baseBet = selectedBaseBet)/g,
    baseBetResetBlock,
  );
  if (!/        if selectedBaseBet ~= self\.baseBet then\r?\n            self:HideWinResult\(\)\r?\n            self:ResetWinHighlights\(\)\r?\n        end\r?\n        self\.baseBet = selectedBaseBet/.test(runtime)) {
    runtime = runtime.replace(
      /        self\.baseBet = selectedBaseBet\r?\n        self\.reelVisualIndex = self:BuildInitialReelVisualIndex\(\)/,
      `${baseBetResetBlock}        self.baseBet = selectedBaseBet\n        self.reelVisualIndex = self:BuildInitialReelVisualIndex()`,
    );
  }
  return runtime;
}

function patchRuntimeDataProperties(runtime) {
  if (!runtime.includes("property any reelStripCellData = nil")) {
    runtime = runtime.replace(
      /    property any reelStrips = nil\r?\n/,
      (match) => `${match}    property any reelStripCellData = nil\n`,
    );
  }

  if (!runtime.includes("self.reelStripCellData = self:BuildReelStripCellData()")) {
    runtime = runtime.replace(
      /        self\.reelStrips = self:BuildReelStrips\(\)\r?\n/,
      (match) => `${match}        self.reelStripCellData = self:BuildReelStripCellData()\n`,
    );
  }

  return runtime;
}

function patchBonus777PanelLifecycle(runtime) {
  const onBeginPlayMatch = runtime.match(/    method void OnBeginPlay\(\)\r?\n[\s\S]*?\r?\n    end/);
  if (onBeginPlayMatch) {
    let updatedOnBeginPlay = onBeginPlayMatch[0].replace(/        self:HideBonus777Panel\(\)\r?\n/g, "");
    updatedOnBeginPlay = updatedOnBeginPlay.includes("self:HideScreenSprayVfx()")
      ? updatedOnBeginPlay.replace(
        /        self:HideScreenSprayVfx\(\)\r?\n/,
        (match) => `${match}        self:HideBonus777Panel()\n`,
      )
      : updatedOnBeginPlay.replace(
        /        self\.bonusSlotTestCheatRemaining = 0\r?\n/,
        (match) => `${match}        self:HideBonus777Panel()\n`,
      );
    runtime = runtime.replace(onBeginPlayMatch[0], updatedOnBeginPlay);
  }

  const onEndPlayMatch = runtime.match(/    method void OnEndPlay\(\)\r?\n[\s\S]*?\r?\n    end/);
  if (onEndPlayMatch) {
    let updatedOnEndPlay = onEndPlayMatch[0].replace(/        self:HideBonus777Panel\(\)\r?\n/g, "");
    updatedOnEndPlay = updatedOnEndPlay.includes("self:HideScreenSprayVfx()")
      ? updatedOnEndPlay.replace(
        /        self:HideScreenSprayVfx\(\)\r?\n/,
        (match) => `${match}        self:HideBonus777Panel()\n`,
      )
      : updatedOnEndPlay.replace(
        /        self:StopWinVfxFrameLoop\(\)\r?\n/,
        (match) => `${match}        self:HideBonus777Panel()\n`,
      );
    runtime = runtime.replace(onEndPlayMatch[0], updatedOnEndPlay);
  }

  return runtime;
}

function patchBonusSlotProperties(runtime) {
  const bonus777UiProps = [
    '    property Entity bonus777Panel = ""',
    '    property TextComponent bonus777ReelText1 = ""',
    '    property TextComponent bonus777ReelText2 = ""',
    '    property TextComponent bonus777ReelText3 = ""',
    '    property TextComponent bonus777ChanceText = ""',
    '    property TextComponent bonus777ResultText = ""',
    '    property UITransformComponent bonus777ReelStripTransform1 = ""',
    '    property UITransformComponent bonus777ReelStripTransform2 = ""',
    '    property UITransformComponent bonus777ReelStripTransform3 = ""',
    '    property UITransformComponent bonus777LeverTransform = ""',
  ];
  const missingBonus777UiProps = bonus777UiProps.filter((line) => {
    const propName = line.match(/property\s+\S+\s+(\S+)/)?.[1];
    return propName && !new RegExp(`\\bproperty\\s+\\S+\\s+${propName}\\s*=`).test(runtime);
  });
  if (missingBonus777UiProps.length > 0) {
    runtime = runtime.replace(
      /    property TextComponent winResultTotalText = "[^"]*"\r?\n/,
      (match) => `${match}${missingBonus777UiProps.join("\n")}\n`,
    );
  }

  if (!runtime.includes("property any bonusSlotRules = nil")) {
    runtime = runtime.replace(
      /    property any paytableTenths = nil\r?\n/,
      (match) => `${match}    property any bonusSlotRules = nil\n    property any bonusSlotPaytable = nil\n    property integer bonusSlotTestCheatRemaining = 0\n`,
    );
  }
  if (!runtime.includes("property integer bonusSlotTestCheatRemaining = 0")) {
    runtime = runtime.replace(
      /    property any bonusSlotPaytable = nil\r?\n/,
      (match) => `${match}    property integer bonusSlotTestCheatRemaining = 0\n`,
    );
  }

  if (!runtime.includes("self.bonusSlotRules = self:BuildBonusSlotRules()")) {
    runtime = runtime.replace(
      /        self\.paytableTenths = self:BuildPaytableTenths\(\)\r?\n/,
      (match) => `${match}        self.bonusSlotRules = self:BuildBonusSlotRules()\n        self.bonusSlotPaytable = self:BuildBonusSlotPaytable()\n        self.bonusSlotTestCheatRemaining = 0\n`,
    );
  }
  if (!runtime.includes("self.bonusSlotTestCheatRemaining = 0")) {
    runtime = runtime.replace(
      /        self\.bonusSlotPaytable = self:BuildBonusSlotPaytable\(\)\r?\n/,
      (match) => `${match}        self.bonusSlotTestCheatRemaining = 0\n`,
    );
  }
  runtime = runtime.replace(/        self\.bonusSlotTestCheatRemaining = self\.bonusSlotRules\.testCheatUseCount or 0/g, "        self.bonusSlotTestCheatRemaining = 0");
  runtime = runtime.replace(/(        self\.bonusSlotTestCheatRemaining = 0\r?\n){2,}/g, "        self.bonusSlotTestCheatRemaining = 0\n");

  return patchBonus777PanelLifecycle(runtime);
}

function makeDevCheatUiProperties() {
  const rows = [];
  for (let index = 1; index <= 12; index += 1) {
    rows.push(`    property Entity devCheatListItem${index} = ""`);
  }
  return [
    '    property Entity devCheatButton = ""',
    '    property Entity devCheatPanel = ""',
    '    property TextInputComponent devCheatInput = ""',
    '    property Entity devCheatApplyButton = ""',
    '    property TextComponent devCheatStatusText = ""',
    ...rows,
  ].join("\n");
}

function makeDevCheatStateProperties() {
  return [
    "    property any devCheatCommands = nil",
    "    property any devCheatItemRows = nil",
    "    property any devCheatVisibleCommands = nil",
    "    property any devCheatItemClickHandlers = nil",
    "    property any devCheatButtonDownHandler = nil",
    "    property any devCheatButtonUpHandler = nil",
    "    property any devCheatApplyHandler = nil",
    "    property any devCheatSubmitHandler = nil",
    "    property any devCheatLongPressTimerId = nil",
    "    property boolean isDevCheatPanelOpen = false",
  ].join("\n");
}

function patchDevCheatProperties(runtime) {
  if (!runtime.includes("property Entity devCheatButton =")) {
    runtime = runtime.replace(
      /    property SpriteGUIRendererComponent screenSprayVfxRenderer = "[^"]*"\r?\n/,
      (match) => `${match}\n${makeDevCheatUiProperties()}\n`,
    );
  }
  if (!runtime.includes("property any devCheatCommands = nil")) {
    runtime = runtime.replace(
      /    property any screenSprayVfxTimerId = nil\r?\n/,
      (match) => `${match}${makeDevCheatStateProperties()}\n`,
    );
  }
  if (!runtime.includes("self.devCheatCommands = self:BuildCheatCommands()")) {
    runtime = runtime.replace(
      /        self\.screenSprayVfxConfig = self:BuildScreenSprayVfxConfig\(\)\r?\n/,
      (match) => `${match}        self.devCheatCommands = self:BuildCheatCommands()\n`,
    );
  }
  if (!runtime.includes("self:ConnectDevCheatUi()")) {
    runtime = runtime.replace(
      /        self:ApplyResponsiveLayout\(\)\r?\n/,
      (match) => `${match}        self:ConnectDevCheatUi()\n`,
    );
  }
  if (!runtime.includes("self:DisconnectDevCheatUi()")) {
    runtime = runtime.replace(
      /    method void OnEndPlay\(\)\r?\n        self:StopWinVfxFrameLoop\(\)\r?\n        self:HideScreenSprayVfx\(\)\r?\n/,
      (match) => `${match}        self:DisconnectDevCheatUi()\n`,
    );
  }
  return runtime;
}

function makeIsDevCheatRuntime() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method boolean IsDevCheatRuntime()",
    "        if self.bonusSlotRules == nil then",
    "            return false",
    "        end",
    "        return (self.bonusSlotRules.runtimeBuildKind or \"\") == \"TEST_SANDBOX\"",
    "    end",
  ].join("\n");
}

function makeNormalizeCheatCode() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method string NormalizeCheatCode(string text)",
    "        if text == nil then",
    "            return \"\"",
    "        end",
    "        local normalized = tostring(text)",
    "        normalized = string.gsub(normalized, \"^%s*(.-)%s*$\", \"%1\")",
    "        return string.upper(normalized)",
    "    end",
  ].join("\n");
}

function makeSetDevCheatStatus() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetDevCheatStatus(string text)",
    "        if self.devCheatStatusText ~= nil then",
    "            self.devCheatStatusText.Text = text or \"\"",
    "        end",
    "    end",
  ].join("\n");
}

function makeSetDevCheatPanelOpen() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetDevCheatPanelOpen(boolean isOpen)",
    "        if self:IsDevCheatRuntime() ~= true then",
    "            isOpen = false",
    "        end",
    "        self.isDevCheatPanelOpen = isOpen",
    "        if self.devCheatPanel ~= nil then",
    "            self.devCheatPanel.Enable = isOpen",
    "        end",
    "        if isOpen == true then",
    "            self:RefreshDevCheatList()",
    "            if self.devCheatInput ~= nil then",
    "                self.devCheatInput:ActivateInputField()",
    "            end",
    "        end",
    "    end",
  ].join("\n");
}

function makeRefreshDevCheatList() {
  const hideRows = [];
  for (let index = 1; index <= 12; index += 1) {
    hideRows.push(`        local row${index} = self.devCheatItemRows[${index}]`);
    hideRows.push(`        if row${index} ~= nil then`);
    hideRows.push(`            row${index}.Enable = false`);
    hideRows.push(`            if row${index}.TextComponent ~= nil then`);
    hideRows.push(`                row${index}.TextComponent.Text = ""`);
    hideRows.push("            end");
    hideRows.push("        end");
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void RefreshDevCheatList()",
    "        if self.devCheatItemRows == nil or self.devCheatCommands == nil then",
    "            return",
    "        end",
    "        self.devCheatVisibleCommands = {}",
    ...hideRows,
    "",
    "        local runtimeKind = \"\"",
    "        if self.bonusSlotRules ~= nil then",
    "            runtimeKind = self.bonusSlotRules.runtimeBuildKind or \"\"",
    "        end",
    "        local visibleIndex = 1",
    "        for _, command in ipairs(self.devCheatCommands) do",
    "            local requiredRuntimeKind = command.requiredRuntimeKind or \"\"",
    "            local runtimeAllowed = requiredRuntimeKind == \"\" or requiredRuntimeKind == runtimeKind",
    "            if command.enabled == true and runtimeAllowed == true then",
    "                local row = self.devCheatItemRows[visibleIndex]",
    "                if row ~= nil then",
    "                    row.Enable = true",
    "                    self.devCheatVisibleCommands[visibleIndex] = command",
    "                    if row.TextComponent ~= nil then",
    "                        row.TextComponent.Text = command.code .. \" - \" .. command.description",
    "                    end",
    "                end",
    "                visibleIndex = visibleIndex + 1",
    "            end",
    "        end",
    "    end",
  ].join("\n");
}

function makeFindCheatCommand() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table FindCheatCommand(string code)",
    "        local normalizedCode = self:NormalizeCheatCode(code)",
    "        if normalizedCode == \"\" or self.devCheatCommands == nil then",
    "            return nil",
    "        end",
    "        for _, command in ipairs(self.devCheatCommands) do",
    "            if self:NormalizeCheatCode(command.code) == normalizedCode then",
    "                return command",
    "            end",
    "        end",
    "        return nil",
    "    end",
  ].join("\n");
}

function makeApplyCheatCommand() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method boolean ApplyCheatCommand(table command)",
    "        if command == nil or command.enabled ~= true then",
    "            self:SetDevCheatStatus(\"Cheat not found\")",
    "            return false",
    "        end",
    "        if self:IsDevCheatRuntime() ~= true then",
    "            self:SetDevCheatStatus(\"Cheat blocked\")",
    "            return false",
    "        end",
    "        local runtimeKind = self.bonusSlotRules.runtimeBuildKind or \"\"",
    "        local requiredRuntimeKind = command.requiredRuntimeKind or \"\"",
    "        if requiredRuntimeKind ~= \"\" and requiredRuntimeKind ~= runtimeKind then",
    "            self:SetDevCheatStatus(\"Cheat blocked\")",
    "            return false",
    "        end",
    "        if command.cheatType == \"FORCE_777_BONUS_ONCE\" then",
    "            local useCount = command.useCount or 1",
    "            if useCount < 1 then",
    "                useCount = 1",
    "            end",
    "            self.bonusSlotTestCheatRemaining = useCount",
    "            if self.bonusSlotRules ~= nil then",
    "                self.bonusSlotRules.testCheatEnabled = true",
    "                self.bonusSlotRules.testCheatForceTrigger = true",
    "                self.bonusSlotRules.testCheatForceResultKey = command.forceResultKey or \"777\"",
    "                self.bonusSlotRules.testCheatUseCount = useCount",
    "            end",
    "            self:SetDevCheatStatus(command.code .. \" applied\")",
    "            return true",
    "        end",
    "        self:SetDevCheatStatus(\"Unsupported cheat\")",
    "        return false",
    "    end",
  ].join("\n");
}

function makeApplyDevCheatInput() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void ApplyDevCheatInput(string rawText)",
    "        local code = self:NormalizeCheatCode(rawText)",
    "        if code == \"\" then",
    "            self:SetDevCheatStatus(\"Enter cheat code\")",
    "            return",
    "        end",
    "        local command = self:FindCheatCommand(code)",
    "        self:ApplyCheatCommand(command)",
    "        if self.devCheatInput ~= nil then",
    "            self.devCheatInput.Text = \"\"",
    "        end",
    "    end",
  ].join("\n");
}

function makeOnDevCheatButtonDown() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void OnDevCheatButtonDown(UITouchDownEvent event)",
    "        if self:IsDevCheatRuntime() ~= true then",
    "            return",
    "        end",
    "        if self.devCheatLongPressTimerId ~= nil then",
    "            _TimerService:ClearTimer(self.devCheatLongPressTimerId)",
    "            self.devCheatLongPressTimerId = nil",
    "        end",
    "        self.devCheatLongPressTimerId = _TimerService:SetTimerOnce(function()",
    "            self.devCheatLongPressTimerId = nil",
    "            self:SetDevCheatPanelOpen(true)",
    "        end, 0.55)",
    "    end",
  ].join("\n");
}

function makeOnDevCheatButtonUp() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void OnDevCheatButtonUp(UITouchUpEvent event)",
    "        if self.devCheatLongPressTimerId ~= nil then",
    "            _TimerService:ClearTimer(self.devCheatLongPressTimerId)",
    "            self.devCheatLongPressTimerId = nil",
    "        end",
    "    end",
  ].join("\n");
}

function makeOnDevCheatInputSubmit() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void OnDevCheatInputSubmit(TextInputSubmitEvent event)",
    "        if event == nil then",
    "            self:ApplyDevCheatInput(\"\")",
    "            return",
    "        end",
    "        self:ApplyDevCheatInput(event.Text)",
    "    end",
  ].join("\n");
}

function makeOnDevCheatApplyClicked() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void OnDevCheatApplyClicked(ButtonClickEvent event)",
    "        local text = \"\"",
    "        if self.devCheatInput ~= nil then",
    "            text = self.devCheatInput.Text",
    "        end",
    "        self:ApplyDevCheatInput(text)",
    "    end",
  ].join("\n");
}

function makeGetDevCheatListIndex() {
  const rows = [];
  for (let index = 1; index <= 12; index += 1) {
    rows.push(`        if entity == self.devCheatListItem${index} then return ${index} end`);
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method integer GetDevCheatListIndex(Entity entity)",
    "        if entity == nil then",
    "            return 0",
    "        end",
    ...rows,
    "        return 0",
    "    end",
  ].join("\n");
}

function makeOnDevCheatListItemClicked() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void OnDevCheatListItemClicked(ButtonClickEvent event)",
    "        if event == nil or self.devCheatVisibleCommands == nil then",
    "            return",
    "        end",
    "        local index = self:GetDevCheatListIndex(event.Entity)",
    "        if index <= 0 then",
    "            return",
    "        end",
    "        local command = self.devCheatVisibleCommands[index]",
    "        if command == nil then",
    "            return",
    "        end",
    "        if self.devCheatInput ~= nil then",
    "            self.devCheatInput.Text = command.code or \"\"",
    "            self.devCheatInput:ActivateInputField()",
    "        end",
    "        self:SetDevCheatStatus(command.code .. \" selected\")",
    "    end",
  ].join("\n");
}

function makeConnectDevCheatUi() {
  const itemRows = [];
  for (let index = 1; index <= 12; index += 1) {
    itemRows.push(`            self.devCheatListItem${index},`);
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void ConnectDevCheatUi()",
    "        self.devCheatItemRows = {",
    ...itemRows,
    "        }",
    "        if self.devCheatCommands == nil then",
    "            self.devCheatCommands = self:BuildCheatCommands()",
    "        end",
    "        self:SetDevCheatPanelOpen(false)",
    "        self:RefreshDevCheatList()",
    "        if self:IsDevCheatRuntime() ~= true then",
    "            if self.devCheatButton ~= nil then",
    "                self.devCheatButton.Enable = false",
    "            end",
    "            return",
    "        end",
    "        if self.devCheatButton ~= nil then",
    "            self.devCheatButton.Enable = true",
    "            self.devCheatButtonDownHandler = self.devCheatButton:ConnectEvent(UITouchDownEvent, self.OnDevCheatButtonDown)",
    "            self.devCheatButtonUpHandler = self.devCheatButton:ConnectEvent(UITouchUpEvent, self.OnDevCheatButtonUp)",
    "        end",
    "        if self.devCheatApplyButton ~= nil then",
    "            self.devCheatApplyHandler = self.devCheatApplyButton:ConnectEvent(ButtonClickEvent, self.OnDevCheatApplyClicked)",
    "        end",
    "        if self.devCheatInput ~= nil and self.devCheatInput.Entity ~= nil then",
    "            self.devCheatSubmitHandler = self.devCheatInput.Entity:ConnectEvent(TextInputSubmitEvent, self.OnDevCheatInputSubmit)",
    "        end",
    "        self.devCheatItemClickHandlers = {}",
    "        for index, row in ipairs(self.devCheatItemRows) do",
    "            if row ~= nil then",
    "                self.devCheatItemClickHandlers[index] = row:ConnectEvent(ButtonClickEvent, self.OnDevCheatListItemClicked)",
    "            end",
    "        end",
    "    end",
  ].join("\n");
}

function makeDisconnectDevCheatUi() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void DisconnectDevCheatUi()",
    "        if self.devCheatLongPressTimerId ~= nil then",
    "            _TimerService:ClearTimer(self.devCheatLongPressTimerId)",
    "            self.devCheatLongPressTimerId = nil",
    "        end",
    "        if self.devCheatButton ~= nil then",
    "            if self.devCheatButtonDownHandler ~= nil then",
    "                self.devCheatButton:DisconnectEvent(UITouchDownEvent, self.devCheatButtonDownHandler)",
    "                self.devCheatButtonDownHandler = nil",
    "            end",
    "            if self.devCheatButtonUpHandler ~= nil then",
    "                self.devCheatButton:DisconnectEvent(UITouchUpEvent, self.devCheatButtonUpHandler)",
    "                self.devCheatButtonUpHandler = nil",
    "            end",
    "        end",
    "        if self.devCheatApplyButton ~= nil and self.devCheatApplyHandler ~= nil then",
    "            self.devCheatApplyButton:DisconnectEvent(ButtonClickEvent, self.devCheatApplyHandler)",
    "            self.devCheatApplyHandler = nil",
    "        end",
    "        if self.devCheatInput ~= nil and self.devCheatInput.Entity ~= nil and self.devCheatSubmitHandler ~= nil then",
    "            self.devCheatInput.Entity:DisconnectEvent(TextInputSubmitEvent, self.devCheatSubmitHandler)",
    "            self.devCheatSubmitHandler = nil",
    "        end",
    "        if self.devCheatItemRows ~= nil and self.devCheatItemClickHandlers ~= nil then",
    "            for index, row in ipairs(self.devCheatItemRows) do",
    "                local handler = self.devCheatItemClickHandlers[index]",
    "                if row ~= nil and handler ~= nil then",
    "                    row:DisconnectEvent(ButtonClickEvent, handler)",
    "                end",
    "            end",
    "            self.devCheatItemClickHandlers = nil",
    "        end",
    "    end",
  ].join("\n");
}

function patchDevCheatFlow(runtime, data) {
  runtime = patchDevCheatProperties(runtime);
  runtime = upsertTypedMethod(runtime, "table", "BuildCheatCommands", makeBuildCheatCommands(data), "BuildBonusSlotRules");
  runtime = upsertTypedMethod(runtime, "boolean", "IsDevCheatRuntime", makeIsDevCheatRuntime(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "string", "NormalizeCheatCode", makeNormalizeCheatCode(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "SetDevCheatStatus", makeSetDevCheatStatus(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "SetDevCheatPanelOpen", makeSetDevCheatPanelOpen(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "RefreshDevCheatList", makeRefreshDevCheatList(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "table", "FindCheatCommand", makeFindCheatCommand(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "boolean", "ApplyCheatCommand", makeApplyCheatCommand(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "ApplyDevCheatInput", makeApplyDevCheatInput(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "OnDevCheatButtonDown", makeOnDevCheatButtonDown(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "OnDevCheatButtonUp", makeOnDevCheatButtonUp(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "OnDevCheatInputSubmit", makeOnDevCheatInputSubmit(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "OnDevCheatApplyClicked", makeOnDevCheatApplyClicked(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "integer", "GetDevCheatListIndex", makeGetDevCheatListIndex(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "OnDevCheatListItemClicked", makeOnDevCheatListItemClicked(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "ConnectDevCheatUi", makeConnectDevCheatUi(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "DisconnectDevCheatUi", makeDisconnectDevCheatUi(), "EvaluatePaylines");
  return runtime;
}

function patchBonusSlotFlow(runtime, data) {
  runtime = patchBonusSlotProperties(runtime);
  runtime = upsertTypedMethod(runtime, "table", "BuildBonusSlotRules", makeBonusSlotRules(data), "BuildPaylines");
  runtime = upsertTypedMethod(runtime, "table", "BuildBonusSlotPaytable", makeBonusSlotPaytable(data), "BuildPaylines");
  runtime = upsertTypedMethod(runtime, "boolean", "IsBonusSlotLineTrigger", makeIsBonusSlotLineTrigger(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "table", "GetBonusSlotPaytableRow", makeGetBonusSlotPaytableRow(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "integer", "RollBonusSlotDigit", makeRollBonusSlotDigit(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "boolean", "IsBonusSlotTestCheatAllowed", makeIsBonusSlotTestCheatAllowed(), "EvaluatePaylines");
  runtime = replaceMethod(runtime, "ResolveSpinResult", makeResolveSpinResult());
  runtime = upsertTypedMethod(runtime, "table", "BuildBonusSlotTestCheatSpinResult", makeBuildBonusSlotTestCheatSpinResult(), "GetStripSymbolAt");
  runtime = upsertTypedMethod(runtime, "table", "BuildForcedBonusSlotDigits", makeBuildForcedBonusSlotDigits(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "string", "BuildBonusSlotResultKey", makeBuildBonusSlotResultKey(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "integer", "GetMatchedBonusSlotDigit", makeGetMatchedBonusSlotDigit(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "table", "ResolveBonusSlot", makeResolveBonusSlot(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "ApplyBonusSlotResult", makeApplyBonusSlotResult(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "string", "FormatBonusSlotStatus", makeFormatBonusSlotStatus(), "ShowWinResult");
  runtime = upsertTypedMethod(runtime, "void", "HideBonus777Panel", makeHideBonus777Panel(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "any", "GetBonus777ReelStripTransform", makeGetBonus777ReelStripTransform(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "float", "GetBonus777DigitCellHeight", makeGetBonus777DigitCellHeight(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "integer", "GetBonus777DigitCount", makeGetBonus777DigitCount(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "float", "GetBonus777CenterYForDigit", makeGetBonus777CenterYForDigit(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "float", "GetBonus777MinStripY", makeGetBonus777MinStripY(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "MoveBonus777ReelDown", makeMoveBonus777ReelDown(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "SetBonus777ReelDigitFallback", makeSetBonus777ReelDigitFallback(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "SetBonus777ReelDigit", makeSetBonus777ReelDigit(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "SetBonus777DigitsFromResultKey", makeSetBonus777DigitsFromResultKey(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "SetBonus777Texts", makeSetBonus777Texts(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "SetBonus777LeverOffset", makeSetBonus777LeverOffset(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "UpdateBonus777LeverPull", makeUpdateBonus777LeverPull(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "PlayBonus777ReelSpin", makePlayBonus777ReelSpin(), "EvaluatePaylines");
  runtime = upsertTypedMethod(runtime, "void", "PlayBonus777Presentation", makePlayBonus777Presentation(), "EvaluatePaylines");

  if (!runtime.includes("self:ApplyBonusSlotResult(result)")) {
    runtime = runtime.replace(
      /        local result = self:EvaluatePaylines\(spinResult\.grid\)\r?\n/,
      (match) => `${match}        self:ApplyBonusSlotResult(result)\n`,
    );
  }

  if (!runtime.includes("self:PlayBonus777Presentation(result.bonusSlotResult)")) {
    runtime = runtime.replace(
      /        self:PlaySpinPresentation\(spinResult\.stopIndexes\)\r?\n/,
      (match) => `${match}\n        self:PlayBonus777Presentation(result.bonusSlotResult)\n`,
    );
  }

  runtime = runtime.replace(
    /        if result\.payoutUnits > 0 then\r?\n/,
    "        if result.payoutUnits > 0 or (result.bonusSlotResult ~= nil and result.bonusSlotResult.triggered == true) then\n",
  );

  if (!runtime.includes("self.statusText.Text = self:FormatBonusSlotStatus(result.bonusSlotResult)")) {
    runtime = runtime.replace(
      /            self:ShowWinResult\(result\.lineWins, result\.payoutUnits\)\r?\n            self:ApplyWinPresentation\(result\.lineWins\)\r?\n/,
      "            self:ShowWinResult(result.lineWins, result.payoutUnits)\n            self:ApplyWinPresentation(result.lineWins)\n            if result.bonusSlotResult ~= nil and result.bonusSlotResult.triggered == true and self.statusText ~= nil then\n                self.statusText.Text = self:FormatBonusSlotStatus(result.bonusSlotResult)\n            end\n",
    );
  }

  return runtime;
}

function makeWinSymbolProperties() {
  const lines = [];
  for (let row = 1; row <= 3; row += 1) {
    for (let col = 1; col <= 5; col += 1) {
      lines.push(`    property Entity winSymbolR${row}C${col} = ""`);
    }
  }
  return lines.join("\n");
}

function patchWinSymbolProperties(runtime) {
  runtime = runtime.replace(
    /\r?\n    property Entity winSymbolR[1-3]C[1-5](Slime|Mushroom|Pig|Golem|PinkBean) = "[^"]*"/g,
    "",
  );
  if (runtime.includes("property Entity winSymbolR1C1 =")) {
    return runtime;
  }
  const marker = /    property Entity winCellVfxR3C5 = "[^"]*"\r?\n/;
  if (!marker.test(runtime)) {
    throw new Error("Could not locate win-cell VFX property block");
  }
  return runtime.replace(marker, (match) => `${match}${makeWinSymbolProperties()}\n`);
}

function patchWinVfxFrameProperties(runtime) {
  if (runtime.includes("property any winVfxFrameRuids = nil")) {
    return runtime;
  }
  const marker = /    property any activeWinCells = nil\r?\n/;
  if (!marker.test(runtime)) {
    throw new Error("Could not locate activeWinCells property");
  }
  return runtime.replace(marker, (match) =>
    [
      match.trimEnd(),
      "    property any winVfxFrameRuids = nil",
      "    property any winVfxTimerId = nil",
      "    property integer winVfxFrameIndex = 1",
      "",
    ].join("\n"),
  );
}

function patchWinVfxFrameInitialization(runtime) {
  if (runtime.includes("self.winVfxFrameRuids = self:BuildWinVfxFrameRuids()")) {
    return runtime;
  }
  const marker = /        self\.activeWinCells = \{\}\r?\n/;
  if (!marker.test(runtime)) {
    throw new Error("Could not locate activeWinCells initialization");
  }
  return runtime.replace(marker, (match) =>
    [
      match.trimEnd(),
      "        self.winVfxFrameRuids = self:BuildWinVfxFrameRuids()",
      "        self.winVfxFrameIndex = 1",
      "        self.winVfxTimerId = nil",
      "",
    ].join("\n"),
  );
}

function patchOnEndPlayWinVfxCleanup(runtime) {
  const methodMatch = runtime.match(/    @ExecSpace\("ClientOnly"\)\r?\n    method void OnEndPlay\(\)\r?\n[\s\S]*?\r?\n    end/);
  if (!methodMatch) {
    throw new Error("Could not locate OnEndPlay");
  }
  if (methodMatch[0].includes("self:StopWinVfxFrameLoop()")) {
    return runtime;
  }
  const marker = /    method void OnEndPlay\(\)\r?\n/;
  return runtime.replace(marker, (match) => `${match}        self:StopWinVfxFrameLoop()\n`);
}

function makeBuildWinSymbolOverlayRefs() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildWinSymbolOverlayRefs()",
    "        return {",
    "            [1] = { [1] = self.winSymbolR1C1, [2] = self.winSymbolR1C2, [3] = self.winSymbolR1C3, [4] = self.winSymbolR1C4, [5] = self.winSymbolR1C5 },",
    "            [2] = { [1] = self.winSymbolR2C1, [2] = self.winSymbolR2C2, [3] = self.winSymbolR2C3, [4] = self.winSymbolR2C4, [5] = self.winSymbolR2C5 },",
    "            [3] = { [1] = self.winSymbolR3C1, [2] = self.winSymbolR3C2, [3] = self.winSymbolR3C3, [4] = self.winSymbolR3C4, [5] = self.winSymbolR3C5 },",
    "        }",
    "    end",
  ].join("\n");
}

function makeBuildWinVfxFrameRuids() {
  const rows = [];
  for (let index = 1; index <= 8; index += 1) {
    rows.push(`            ${luaString(manifestRuid(`winGlowLoopFrame${String(index).padStart(2, "0")}`))},`);
  }
  return [
    '    @ExecSpace("ClientOnly")',
    "    method table BuildWinVfxFrameRuids()",
    "        return {",
    ...rows,
    "        }",
    "    end",
  ].join("\n");
}

function makeStartWinVfxFrameLoop() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void StartWinVfxFrameLoop()",
    "        self:StopWinVfxFrameLoop()",
    "        if self.winVfxFrameRuids == nil or #self.winVfxFrameRuids == 0 then",
    "            return",
    "        end",
    "",
    "        self.winVfxFrameIndex = 1",
    "        self.winVfxTimerId = _TimerService:SetTimerRepeat(function()",
    "            if self.activeWinCells == nil or #self.activeWinCells == 0 then",
    "                self:StopWinVfxFrameLoop()",
    "                return",
    "            end",
    "",
    "            self.winVfxFrameIndex = self.winVfxFrameIndex + 1",
    "            if self.winVfxFrameIndex > #self.winVfxFrameRuids then",
    "                self.winVfxFrameIndex = 1",
    "            end",
    "",
    "            local frameRuid = self.winVfxFrameRuids[self.winVfxFrameIndex]",
    "            for _, cell in ipairs(self.activeWinCells) do",
    "                if cell.vfxEntity ~= nil and cell.vfxEntity.SpriteGUIRendererComponent ~= nil then",
    "                    cell.vfxEntity.SpriteGUIRendererComponent.ImageRUID = frameRuid",
    "                end",
    "            end",
    "        end, 0.125)",
    "    end",
  ].join("\n");
}

function makeStopWinVfxFrameLoop() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void StopWinVfxFrameLoop()",
    "        if self.winVfxTimerId ~= nil then",
    "            _TimerService:ClearTimer(self.winVfxTimerId)",
    "            self.winVfxTimerId = nil",
    "        end",
    "    end",
  ].join("\n");
}

function makeSetVisibleWinBaseSymbolAlpha() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void SetVisibleWinBaseSymbolAlpha(integer rowIndex, integer col, float alpha)",
    "        if self.reelCellSymbolRenderers == nil or self.reelVisualIndex == nil then",
    "            return",
    "        end",
    "",
    "        local renderers = self.reelCellSymbolRenderers[col]",
    "        if renderers == nil then",
    "            return",
    "        end",
    "",
    "        local visualIndex = self.reelVisualIndex[col]",
    "        if visualIndex == nil then",
    "            return",
    "        end",
    "",
    "        local displayIndex = visualIndex + rowIndex",
    "        if displayIndex < 1 then",
    "            displayIndex = displayIndex + #renderers",
    "        end",
    "        if displayIndex > #renderers then",
    "            displayIndex = displayIndex - #renderers",
    "        end",
    "",
    "        local renderer = renderers[displayIndex]",
    "        if renderer ~= nil then",
    "            renderer.Color = Color(1.0, 1.0, 1.0, alpha)",
    "        end",
    "    end",
  ].join("\n");
}

function makeActivateWinCell() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void ActivateWinCell(integer rowIndex, integer col, string symbolId)",
    "        local cellData = self:GetVisibleCellData(rowIndex, col)",
    "        local vfx = nil",
    "        if self.winCellVfx ~= nil and self.winCellVfx[rowIndex] ~= nil then",
    "            vfx = self.winCellVfx[rowIndex][col]",
    "        end",
    "        if vfx ~= nil then",
    "            vfx.Enable = false",
    "            if vfx.SpriteGUIRendererComponent ~= nil then",
    "                if self.winVfxFrameRuids ~= nil and self.winVfxFrameRuids[1] ~= nil then",
    "                    vfx.SpriteGUIRendererComponent.ImageRUID = self.winVfxFrameRuids[1]",
    "                end",
    "                vfx.SpriteGUIRendererComponent.AnimClipPlayType = SpriteAnimClipPlayType.Loop",
    "                vfx.SpriteGUIRendererComponent.StartFrameIndex = 0",
    "                vfx.SpriteGUIRendererComponent.EndFrameIndex = 2147483647",
    "                vfx.SpriteGUIRendererComponent.PlayRate = 1.0",
    "                vfx.SpriteGUIRendererComponent.FillAmount = 1.0",
    "            end",
    "            vfx.UITransformComponent.UIScale = Vector3(1.0, 1.0, 1.0)",
    "            vfx.Enable = true",
    "        end",
    "",
    "        self:SetVisibleWinBaseSymbolAlpha(rowIndex, col, 0.0)",
    "",
    "        local symbolEntity = nil",
    "        if self.winSymbolOverlays ~= nil and self.winSymbolOverlays[rowIndex] ~= nil then",
    "            symbolEntity = self.winSymbolOverlays[rowIndex][col]",
    "        end",
    "        if symbolEntity ~= nil then",
    "            local symbolDataForOverlay = self.slotSymbols[symbolId]",
    "            local symbolRuid = nil",
    "            if cellData ~= nil then",
    "                symbolRuid = cellData.winAnimationRuid",
    "            end",
    "            if (symbolRuid == nil or symbolRuid == \"\") and symbolDataForOverlay ~= nil then",
    "                symbolRuid = symbolDataForOverlay.winAnimationRuid",
    "            end",
    "            if (symbolRuid == nil or symbolRuid == \"\") and symbolDataForOverlay ~= nil then",
    "                symbolRuid = symbolDataForOverlay.resourcePath",
    "            end",
    "            if symbolRuid ~= nil and symbolRuid ~= \"\" then",
    "                symbolEntity.SpriteGUIRendererComponent.ImageRUID = symbolRuid",
    "            end",
    "            symbolEntity.Enable = false",
    "            symbolEntity.UITransformComponent.UIScale = Vector3(1.0, 1.0, 1.0)",
    "            symbolEntity.SpriteGUIRendererComponent.AnimClipPlayType = SpriteAnimClipPlayType.Loop",
    "            symbolEntity.SpriteGUIRendererComponent.StartFrameIndex = 0",
    "            symbolEntity.SpriteGUIRendererComponent.EndFrameIndex = 2147483647",
    "            symbolEntity.SpriteGUIRendererComponent.PlayRate = 1.0",
    "            symbolEntity.SpriteGUIRendererComponent.Color = Color(1.0, 1.0, 1.0, 1.0)",
    "            symbolEntity.Enable = true",
    "        end",
    "",
    "        if self.activeWinCells == nil then",
    "            self.activeWinCells = {}",
    "        end",
    "",
    "        local symbolData = self.slotSymbols[symbolId]",
    "        local animationId = \"POP\"",
    "        if cellData ~= nil and cellData.winAnimation ~= nil and cellData.winAnimation ~= \"\" then",
    "            animationId = cellData.winAnimation",
    "        elseif symbolData ~= nil and symbolData.winAnimation ~= nil then",
    "            animationId = symbolData.winAnimation",
    "        end",
    "        table.insert(self.activeWinCells, {",
    "            rowIndex = rowIndex,",
    "            col = col,",
    "            symbolId = symbolId,",
    "            symbolEntity = symbolEntity,",
    "            vfxEntity = vfx,",
    "            animationId = animationId,",
    "        })",
    "    end",
  ].join("\n");
}

function makePlayWinCellAnimation() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void PlayWinCellAnimation()",
    "        if self.activeWinCells == nil or #self.activeWinCells == 0 then",
    "            return",
    "        end",
    "",
    "        for _, cell in ipairs(self.activeWinCells) do",
    "            if cell.vfxEntity ~= nil and cell.vfxEntity.SpriteGUIRendererComponent ~= nil then",
    "                cell.vfxEntity.SpriteGUIRendererComponent.FillAmount = 1.0",
    "                cell.vfxEntity.SpriteGUIRendererComponent.AnimClipPlayType = SpriteAnimClipPlayType.Loop",
    "                cell.vfxEntity.SpriteGUIRendererComponent.PlayRate = 1.0",
    "            end",
    "            if cell.symbolEntity ~= nil then",
    "                cell.symbolEntity.UITransformComponent.UIScale = Vector3(1.0, 1.0, 1.0)",
    "                cell.symbolEntity.SpriteGUIRendererComponent.AnimClipPlayType = SpriteAnimClipPlayType.Loop",
    "                cell.symbolEntity.SpriteGUIRendererComponent.PlayRate = 1.0",
    "                cell.symbolEntity.SpriteGUIRendererComponent.Color = Color(1.0, 1.0, 1.0, 1.0)",
    "            end",
    "        end",
    "        self:StartWinVfxFrameLoop()",
    "    end",
  ].join("\n");
}

function makeResetWinCellPresentation() {
  return [
    '    @ExecSpace("ClientOnly")',
    "    method void ResetWinCellPresentation()",
    "        self:StopWinVfxFrameLoop()",
    "        if self.activeWinCells ~= nil then",
    "            for _, cell in ipairs(self.activeWinCells) do",
    "                self:SetVisibleWinBaseSymbolAlpha(cell.rowIndex, cell.col, 1.0)",
    "            end",
    "        end",
    "        self.activeWinCells = {}",
    "        if self.winCellVfx ~= nil then",
    "            for row = 1, 3 do",
    "                if self.winCellVfx[row] ~= nil then",
    "                    for col = 1, 5 do",
    "                        local vfx = self.winCellVfx[row][col]",
    "                        if vfx ~= nil then",
    "                            vfx.Enable = false",
    "                            vfx.UITransformComponent.UIScale = Vector3(1.0, 1.0, 1.0)",
    "                            if vfx.SpriteGUIRendererComponent ~= nil then",
    "                                vfx.SpriteGUIRendererComponent.FillAmount = 1.0",
    "                                vfx.SpriteGUIRendererComponent.PlayRate = 1.0",
    "                            end",
    "                        end",
    "                    end",
    "                end",
    "            end",
    "        end",
    "",
    "        if self.winSymbolOverlays ~= nil then",
    "            for row = 1, 3 do",
    "                if self.winSymbolOverlays[row] ~= nil then",
    "                    for col = 1, 5 do",
    "                        local symbolEntity = self.winSymbolOverlays[row][col]",
    "                        if symbolEntity ~= nil then",
    "                            symbolEntity.Enable = false",
    "                            symbolEntity.UITransformComponent.UIScale = Vector3(1.0, 1.0, 1.0)",
    "                            symbolEntity.SpriteGUIRendererComponent.Color = Color(1.0, 1.0, 1.0, 1.0)",
    "                        end",
    "                    end",
    "                end",
    "            end",
    "        end",
    "    end",
  ].join("\n");
}

function patchWinPresentation(runtime) {
  runtime = patchWinSymbolProperties(runtime);
  runtime = patchWinVfxFrameProperties(runtime);
  runtime = patchWinVfxFrameInitialization(runtime);
  runtime = patchOnEndPlayWinVfxCleanup(runtime);
  runtime = replaceMethod(runtime, "BuildWinSymbolOverlayRefs", makeBuildWinSymbolOverlayRefs());
  runtime = upsertTypedMethod(runtime, "table", "BuildWinVfxFrameRuids", makeBuildWinVfxFrameRuids(), "ApplyWinPresentation");
  runtime = upsertTypedMethod(runtime, "void", "StartWinVfxFrameLoop", makeStartWinVfxFrameLoop(), "ApplyWinPresentation");
  runtime = upsertTypedMethod(runtime, "void", "StopWinVfxFrameLoop", makeStopWinVfxFrameLoop(), "ApplyWinPresentation");
  runtime = upsertTypedMethod(runtime, "void", "SetVisibleWinBaseSymbolAlpha", makeSetVisibleWinBaseSymbolAlpha(), "ActivateWinCell");
  runtime = replaceVoidMethod(runtime, "ActivateWinCell", makeActivateWinCell());
  runtime = replaceVoidMethod(runtime, "PlayWinCellAnimation", makePlayWinCellAnimation());
  runtime = replaceVoidMethod(runtime, "ResetWinCellPresentation", makeResetWinCellPresentation());
  return runtime;
}

async function main() {
  const data = await loadData();
  let runtime = await fs.readFile(runtimePath, "utf8");
  runtime = patchRuntimeDataProperties(runtime);
  runtime = patchScreenSprayVfxProperties(runtime);
  runtime = replaceMethod(runtime, "BuildTextTemplates", makeTextTemplates(data));
  runtime = replaceMethod(runtime, "BuildBaseBetOptions", makeBaseBetOptions(data));
  runtime = replaceMethod(runtime, "BuildMultiplierOptions", makeMultiplierOptions(data));
  runtime = replaceMethod(runtime, "BuildSlotSymbols", makeSlotSymbols(data));
  runtime = replaceMethod(runtime, "BuildBaseReelCellSymbolTable", makeBaseReelCellSymbolTable(data));
  runtime = replaceMethod(runtime, "BuildReelStrips", makeReelStrips(data));
  runtime = upsertTypedMethod(runtime, "table", "BuildReelStripCellData", makeReelStripCellData(data), "GetCurrentReelStrips");
  runtime = upsertTypedMethod(runtime, "table", "GetCurrentReelStripCells", makeGetCurrentReelStripCells(), "RefreshReelStripResources");
  runtime = upsertTypedMethod(runtime, "table", "GetStripCellDataAt", makeGetStripCellDataAt(), "RefreshReelStripResources");
  runtime = upsertTypedMethod(runtime, "table", "GetVisibleCellData", makeGetVisibleCellData(), "RefreshReelStripResources");
  runtime = replaceVoidMethod(runtime, "RefreshReelStripResources", makeRefreshReelStripResources());
  runtime = replaceMethod(runtime, "BuildPaytableTenths", makePaytableTenths(data));
  runtime = patchBonusSlotFlow(runtime, data);
  runtime = patchDevCheatFlow(runtime, data);
  runtime = replaceMethod(runtime, "BuildPaylines", makePaylines(data));
  runtime = replaceMethod(runtime, "BuildSpinProfiles", makeSpinProfiles(data));
  runtime = upsertTypedMethod(runtime, "table", "BuildScreenSprayVfxConfig", makeScreenSprayVfxConfig(data), "BuildSpinProfiles");
  runtime = patchWinPresentation(runtime);
  runtime = patchWinResultFlow(runtime);
  runtime = patchScreenSprayVfxFlow(runtime);
  runtime = patchBonus777PanelLifecycle(runtime);

  await fs.writeFile(runtimePath, runtime, "utf8");
  try {
    await fs.access(path.dirname(stagingRuntimePath));
    await fs.writeFile(stagingRuntimePath, runtime, "utf8");
  } catch {
    // Staging path is optional in fresh checkouts.
  }

  console.log(`Applied ${data.slotSymbolRows.length} slot symbols from SlotMachine.xlsx/SlotSymbols.`);
  console.log(`Applied ${data.reelGroups.size} BaseBet reel groups from SlotMachine.xlsx/ReelStrips.`);
  console.log(`Updated runtime: ${runtimePath}`);
}

await main();
