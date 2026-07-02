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
const resourceManifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

const fallbackStrings = new Map([
  [201, "{0} - {1} Coin"],
  [202, "Premium {0}"],
  [203, "Common {0}"],
  [204, "Win {0} lines +{1}"],
  [205, "Not enough coins"],
  [206, "x{0}"],
  [207, "Apply new Base Bet? Lock starts for {0}."],
  [208, "x{0} {1}"],
  [209, "= {0}"],
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

  const baseBetRows = (await workbookRows("Core.xlsx", "BaseBetRegions"))
    .sort((a, b) => num(a.BaseBetRegionsIndex, "BaseBetRegionsIndex") - num(b.BaseBetRegionsIndex, "BaseBetRegionsIndex"));

  const multiplierRows = (await workbookRows("Core.xlsx", "Multipliers"))
    .sort((a, b) => num(a.MultipliersIndex, "MultipliersIndex") - num(b.MultipliersIndex, "MultipliersIndex"));

  const paytableGroups = new Map();
  for (const row of await workbookRows("Core.xlsx", "Paytable")) {
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

  const slotSymbolRows = (await workbookRows("Core.xlsx", "SlotSymbols"))
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
  for (const row of await workbookRows("SpinPresentation.xlsx", "ReelStrips")) {
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

  const spinProfileRows = (await workbookRows("SpinPresentation.xlsx", "SpinProfiles"))
    .sort((a, b) => num(a.SpinProfilesIndex, "SpinProfilesIndex") - num(b.SpinProfilesIndex, "SpinProfilesIndex"))
    .map((row) => ({
      id: enumResolver.resolve("SpinProfileType", row.SpinProfileEnumId),
      weight: num(row.WeightPercent, "WeightPercent"),
      firstMin: num(row.FirstReelMinSec, "FirstReelMinSec"),
      firstMax: num(row.FirstReelMaxSec, "FirstReelMaxSec"),
      staggerMin: num(row.StaggerMinSec, "StaggerMinSec"),
      staggerMax: num(row.StaggerMaxSec, "StaggerMaxSec"),
    }));

  const paylineRows = (await workbookRows("Core.xlsx", "Paylines"))
    .sort((a, b) => num(a.PaylinesIndex, "PaylinesIndex") - num(b.PaylinesIndex, "PaylinesIndex"))
    .map((row) => ({
      id: enumResolver.resolve("LineType", row.LineTypeEnumId),
      rowIndex: num(row.StartRow, "StartRow"),
      enabled: bool(row.IsEnabled),
      costCountsAsLine: bool(row.CostCountsAsLine),
    }));

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

function replaceMethod(runtime, methodName, replacement) {
  const pattern = new RegExp(`    @ExecSpace\\("ClientOnly"\\)\\r?\\n    method table ${methodName}\\([^\\n]*\\)\\r?\\n[\\s\\S]*?\\r?\\n    end`);
  if (!pattern.test(runtime)) {
    throw new Error(`Missing method to replace: ${methodName}`);
  }
  return runtime.replace(pattern, replacement);
}

function replaceVoidMethod(runtime, methodName, replacement) {
  const pattern = new RegExp(`    @ExecSpace\\("ClientOnly"\\)\\r?\\n    method void ${methodName}\\([^\\n]*\\)\\r?\\n[\\s\\S]*?\\r?\\n    end`);
  if (!pattern.test(runtime)) {
    throw new Error(`Missing void method to replace: ${methodName}`);
  }
  return runtime.replace(pattern, replacement);
}

function upsertTypedMethod(runtime, returnType, methodName, replacement, beforeMethodName = "ApplyWinPresentation") {
  const pattern = new RegExp(`    @ExecSpace\\("ClientOnly"\\)\\r?\\n    method ${returnType} ${methodName}\\([^\\n]*\\)\\r?\\n[\\s\\S]*?\\r?\\n    end`);
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
    "            lineText.Text = self:FormatTemplate(self.textTemplates.WinLineFormula, { tostring(lineWin.runLength), self:FormatUnits(lineWin.payoutUnits) })",
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
  runtime = replaceMethod(runtime, "BuildPaylines", makePaylines(data));
  runtime = replaceMethod(runtime, "BuildSpinProfiles", makeSpinProfiles(data));
  runtime = patchWinPresentation(runtime);
  runtime = patchWinResultFlow(runtime);

  await fs.writeFile(runtimePath, runtime, "utf8");
  try {
    await fs.access(path.dirname(stagingRuntimePath));
    await fs.writeFile(stagingRuntimePath, runtime, "utf8");
  } catch {
    // Staging path is optional in fresh checkouts.
  }

  console.log(`Applied ${data.slotSymbolRows.length} slot symbols from Core.xlsx/SlotSymbols.`);
  console.log(`Applied ${data.reelGroups.size} BaseBet reel groups from SpinPresentation.xlsx/ReelStrips.`);
  console.log(`Updated runtime: ${runtimePath}`);
}

await main();
