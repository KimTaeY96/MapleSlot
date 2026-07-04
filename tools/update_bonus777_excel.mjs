import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const dependencyRoot = "C:/Users/ghddj/Documents/MSW";
const require = createRequire(import.meta.url);
const artifactToolPath = require.resolve("@oai/artifact-tool", { paths: [dependencyRoot] });
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(artifactToolPath).href);

const excelDir = process.env.MSW_EXCEL_DIR || "C:/Users/ghddj/Desktop/AI/MSW/ExcelTable";
const bonusStatusIndex = 210;
const bonusStatusText = "777 \uBCF4\uB108\uC2A4 {0}\uD68C / +{1}";

function getSheet(workbook, name) {
  try {
    return workbook.worksheets.getItem(name);
  } catch {
    return null;
  }
}

function usedValues(sheet) {
  return sheet.getUsedRange(true)?.values ?? [];
}

function isFilled(value) {
  return value !== null && value !== undefined && value !== "";
}

function readRows(sheet) {
  const values = usedValues(sheet);
  if (values.length < 5) return [];
  const headers = values[0].map((value) => String(value ?? "").trim());
  return values.slice(4)
    .filter((row) => row.some(isFilled))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

function existingValue(row, key, fallback) {
  const value = row?.[key];
  return isFilled(value) ? value : fallback;
}

function styledRange(sheet, row, column, rowCount, columnCount, format) {
  sheet.getRangeByIndexes(row, column, rowCount, columnCount).format = {
    ...format,
    font: {
      name: "\uB9D1\uC740 \uACE0\uB515",
      ...(format.font ?? {}),
    },
  };
}

function setColumnWidths(sheet, totalRows, widths) {
  widths.forEach((width, column) => {
    sheet.getRangeByIndexes(0, column, totalRows, 1).format.columnWidthPx = width;
  });
}

function clearExistingValues(sheet) {
  const values = usedValues(sheet);
  const rowCount = values.length;
  const columnCount = values.reduce((max, row) => Math.max(max, row.length), 0);
  if (rowCount <= 0 || columnCount <= 0) return;
  sheet.getRangeByIndexes(0, 0, rowCount, columnCount).values =
    Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => ""));
}

function writeDataSheet(workbook, name, columns, rows, widths) {
  let sheet = getSheet(workbook, name);
  if (sheet == null) {
    sheet = workbook.worksheets.add(name);
  } else {
    clearExistingValues(sheet);
  }

  sheet.showGridLines = false;
  const values = [
    columns.map((column) => column.name),
    columns.map((column) => column.scope),
    columns.map((column) => column.desc),
    columns.map((column) => column.type),
    ...rows,
  ];
  const range = sheet.getRangeByIndexes(0, 0, values.length, columns.length);
  range.values = values;
  range.format.font = { name: "\uB9D1\uC740 \uACE0\uB515" };
  sheet.freezePanes.freezeRows(4);
  styledRange(sheet, 0, 0, 1, columns.length, {
    fill: "#111827",
    font: { bold: true, color: "#FFFFFF" },
  });
  styledRange(sheet, 1, 0, 1, columns.length, {
    fill: "#374151",
    font: { bold: true, color: "#E5E7EB" },
  });
  styledRange(sheet, 2, 0, 1, columns.length, {
    fill: "#E5E7EB",
    font: { color: "#111827", size: 8 },
  });
  styledRange(sheet, 3, 0, 1, columns.length, {
    fill: "#FEF3C7",
    font: { bold: true, color: "#92400E" },
  });
  range.format.borders = { preset: "all", style: "thin", color: "#D1D5DB" };
  setColumnWidths(sheet, values.length, widths);
}

async function loadWorkbook(filename) {
  const filePath = path.join(excelDir, filename);
  const input = await FileBlob.load(filePath);
  return SpreadsheetFile.importXlsx(input);
}

async function saveWorkbook(workbook, filename) {
  const filePath = path.join(excelDir, filename);
  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan",
  });
  if (errors.ndjson.includes("#REF!") || errors.ndjson.includes("#DIV/0!") || errors.ndjson.includes("#VALUE!")) {
    throw new Error(errors.ndjson);
  }
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(filePath);
  return filePath;
}

function updateSlotMachine(workbook) {
  const existingRule = readRows(getSheet(workbook, "BonusSlotRules") ?? { getUsedRange: () => null })[0] ?? {};
  const existingPaytable = new Map(
    readRows(getSheet(workbook, "BonusSlotPaytable") ?? { getUsedRange: () => null })
      .filter((row) => isFilled(row.Digit))
      .map((row) => [Number(row.Digit), row]),
  );

  writeDataSheet(workbook, "BonusSlotRules", [
    { name: "BonusSlotRulesIndex", scope: "all", desc: "777 bonus slot rule row index.", type: "int" },
    { name: "TriggerKey", scope: "server", desc: "Stable trigger key used by runtime and simulator.", type: "string" },
    { name: "RequiredSymbolId", scope: "server", desc: "SlotSymbol enum value required for the trigger.", type: "ref:Enums.SlotSymbol" },
    { name: "RequiredMatchCount", scope: "server", desc: "Required consecutive match count for the trigger.", type: "int" },
    { name: "MinTriggerLineCount", scope: "server", desc: "Minimum number of triggering paylines in one spin.", type: "int" },
    { name: "InitialChanceCount", scope: "server", desc: "Initial bonus slot chances granted on entry.", type: "int" },
    { name: "ReelCount", scope: "server", desc: "Number of numeric bonus reels.", type: "int" },
    { name: "RequiredSameCount", scope: "server", desc: "Number of equal digits required for a reward.", type: "int" },
    { name: "DigitMin", scope: "server", desc: "Minimum bonus reel digit.", type: "int" },
    { name: "DigitMax", scope: "server", desc: "Maximum bonus reel digit.", type: "int" },
    { name: "MaxTotalSpinCount", scope: "server", desc: "Safety cap for recursive extra chances.", type: "int" },
    { name: "Enabled", scope: "server", desc: "Whether the 777 bonus slot is active.", type: "bool" },
    { name: "StatusStringIndex", scope: "client", desc: "GameString index for bonus result status text.", type: "ref:GameString.Index" },
    { name: "TestCheatEnabled", scope: "client", desc: "Allows the one-shot 777 test cheat only when runtime kind matches.", type: "bool" },
    { name: "TestCheatForceTrigger", scope: "client", desc: "Forces bonus entry for the one-shot test cheat.", type: "bool" },
    { name: "TestCheatForceResultKey", scope: "client", desc: "Forced bonus result key for the one-shot test cheat.", type: "string" },
    { name: "TestCheatUseCount", scope: "client", desc: "Session use count for the one-shot test cheat.", type: "int" },
    { name: "TestCheatRequiredRuntimeKind", scope: "client", desc: "Runtime build kind required before the test cheat can run.", type: "string" },
    { name: "Notes", scope: "design", desc: "Design note.", type: "string" },
  ], [[
    Number(existingValue(existingRule, "BonusSlotRulesIndex", 1)),
    existingValue(existingRule, "TriggerKey", "WILD_5_BONUS_SLOT"),
    existingValue(existingRule, "RequiredSymbolId", "\uC640\uC77C\uB4DC"),
    Number(existingValue(existingRule, "RequiredMatchCount", 5)),
    Number(existingValue(existingRule, "MinTriggerLineCount", 1)),
    Number(existingValue(existingRule, "InitialChanceCount", 5)),
    Number(existingValue(existingRule, "ReelCount", 3)),
    Number(existingValue(existingRule, "RequiredSameCount", 3)),
    Number(existingValue(existingRule, "DigitMin", 1)),
    Number(existingValue(existingRule, "DigitMax", 7)),
    Number(existingValue(existingRule, "MaxTotalSpinCount", 25)),
    existingValue(existingRule, "Enabled", true),
    Number(existingValue(existingRule, "StatusStringIndex", bonusStatusIndex)),
    existingValue(existingRule, "TestCheatEnabled", true),
    existingValue(existingRule, "TestCheatForceTrigger", true),
    existingValue(existingRule, "TestCheatForceResultKey", "777"),
    Number(existingValue(existingRule, "TestCheatUseCount", 1)),
    existingValue(existingRule, "TestCheatRequiredRuntimeKind", "TEST_SANDBOX"),
    existingValue(existingRule, "Notes", "Wild x5 enters the 777 bonus slot with 5 initial chances."),
  ]], [170, 180, 150, 150, 150, 150, 110, 150, 100, 100, 150, 100, 140, 150, 160, 170, 150, 230, 340]);

  const paytableRows = [];
  for (let digit = 1; digit <= 7; digit += 1) {
    const row = existingPaytable.get(digit) ?? {};
    const resultKey = `${digit}${digit}${digit}`;
    paytableRows.push([
      Number(existingValue(row, "BonusSlotPaytableIndex", digit)),
      Number(existingValue(row, "Digit", digit)),
      existingValue(row, "ResultKey", resultKey),
      Number(existingValue(row, "RewardMultiplier", digit * 111)),
      Number(existingValue(row, "ExtraChanceCount", digit === 7 ? 1 : 0)),
      Number(existingValue(row, "RollWeight", 1)),
      existingValue(row, "Notes", digit === 7 ? "777 pays and grants one extra chance." : "Three matching digits pay this multiplier."),
    ]);
  }

  writeDataSheet(workbook, "BonusSlotPaytable", [
    { name: "BonusSlotPaytableIndex", scope: "all", desc: "777 bonus paytable row index.", type: "int" },
    { name: "Digit", scope: "server", desc: "Bonus slot digit.", type: "int" },
    { name: "ResultKey", scope: "client", desc: "Display key such as 111 or 777.", type: "string" },
    { name: "RewardMultiplier", scope: "server", desc: "Reward multiplier when all digits match.", type: "int" },
    { name: "ExtraChanceCount", scope: "server", desc: "Extra bonus chances granted by this result.", type: "int" },
    { name: "RollWeight", scope: "server", desc: "Relative digit roll weight.", type: "int" },
    { name: "Notes", scope: "design", desc: "Design note.", type: "string" },
  ], paytableRows, [170, 90, 110, 160, 160, 110, 340]);
}

function updateGameString(workbook) {
  const sheet = getSheet(workbook, "GameString");
  if (sheet == null) {
    throw new Error("Missing GameString sheet");
  }
  const values = usedValues(sheet);
  if (values.length < 4) {
    throw new Error("GameString sheet has no header rows");
  }
  const rowIndex = values.findIndex((row, index) => index >= 4 && Number(row[0]) === bonusStatusIndex);
  const targetRow = rowIndex >= 0 ? rowIndex : values.length;
  sheet.getRangeByIndexes(targetRow, 0, 1, 2).values = [[bonusStatusIndex, bonusStatusText]];
}

await fs.access(path.join(excelDir, "SlotMachine.xlsx"));
await fs.access(path.join(excelDir, "GameString.xlsx"));

const slotWorkbook = await loadWorkbook("SlotMachine.xlsx");
updateSlotMachine(slotWorkbook);
console.log(`Updated ${await saveWorkbook(slotWorkbook, "SlotMachine.xlsx")}`);

const gameStringWorkbook = await loadWorkbook("GameString.xlsx");
updateGameString(gameStringWorkbook);
console.log(`Updated ${await saveWorkbook(gameStringWorkbook, "GameString.xlsx")}`);
