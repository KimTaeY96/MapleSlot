import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import { combatSheets } from "./combat_excel_schema.mjs";

const inputArg = process.argv.indexOf("--input");
const outputArg = process.argv.indexOf("--output");
const previewArg = process.argv.indexOf("--preview-dir");
const inputPath = inputArg >= 0
  ? path.resolve(process.argv[inputArg + 1])
  : path.resolve("ExcelTable/Combat.xlsx");
const outputPath = outputArg >= 0
  ? path.resolve(process.argv[outputArg + 1])
  : path.resolve(".codex-temp/Combat.henesys-lanes.xlsx");
const previewDir = previewArg >= 0
  ? path.resolve(process.argv[previewArg + 1])
  : path.resolve(".codex-temp/combat-henesys-after");

function getSheetOrNull(workbook, name) {
  try {
    return workbook.worksheets.getItem(name);
  } catch {
    return null;
  }
}

function styleRange(sheet, row, column, rowCount, columnCount, format) {
  sheet.getRangeByIndexes(row, column, rowCount, columnCount).format = {
    ...format,
    font: { name: "Malgun Gothic", ...(format.font ?? {}) },
  };
}

function columnWidth(column) {
  if (column.endsWith("Notes")) return 260;
  if (column.includes("Ruid") || column.includes("Guid") || column.includes("Path")) return 280;
  if (column.includes("Key") || column.includes("Id")) return 190;
  if (column.length > 18) return 190;
  return 145;
}

function addSchemaSheet(workbook, name, schema) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const grid = [
    schema.columns.map(([column]) => column),
    schema.columns.map(([, scope]) => scope),
    schema.columns.map(([, , description]) => description),
    schema.columns.map(([, , , type]) => type),
    ...schema.rows,
  ];
  const range = sheet.getRangeByIndexes(0, 0, grid.length, schema.columns.length);
  range.values = grid;
  range.format.font = { name: "Malgun Gothic", size: 10 };
  range.format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  range.format.rowHeightPx = 22;
  sheet.freezePanes.freezeRows(4);
  styleRange(sheet, 0, 0, 1, schema.columns.length, { fill: "#172033", font: { bold: true, color: "#FFFFFF" } });
  styleRange(sheet, 1, 0, 1, schema.columns.length, { fill: "#334155", font: { bold: true, color: "#E2E8F0" } });
  styleRange(sheet, 2, 0, 1, schema.columns.length, { fill: "#E2E8F0", font: { color: "#0F172A", size: 8 }, wrapText: true });
  styleRange(sheet, 3, 0, 1, schema.columns.length, { fill: "#FEF3C7", font: { bold: true, color: "#92400E" } });
  styleRange(sheet, 4, 0, schema.rows.length, schema.columns.length, { fill: "#FFFFFF", font: { color: "#111827" } });
  schema.columns.forEach(([column], index) => {
    sheet.getRangeByIndexes(0, index, grid.length, 1).format.columnWidthPx = columnWidth(column);
  });
  sheet.getRangeByIndexes(2, 0, 1, schema.columns.length).format.rowHeightPx = 48;
  return sheet;
}

function appendColumn(sheet, metadata, dataFactory) {
  const values = sheet.getUsedRange(true)?.values ?? [];
  const headers = values[0].map(String);
  const [name, scope, description, type] = metadata;
  if (headers.includes(name)) return false;
  const targetColumn = headers.length;
  const columnValues = [[name], [scope], [description], [type]];
  for (let rowIndex = 4; rowIndex < values.length; rowIndex += 1) {
    columnValues.push([dataFactory(values[rowIndex], rowIndex - 4)]);
  }
  const targetRange = sheet.getRangeByIndexes(0, targetColumn, columnValues.length, 1);
  targetRange.values = columnValues;
  targetRange.format.font = { name: "Malgun Gothic", size: 10 };
  targetRange.format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  targetRange.format.rowHeightPx = 22;
  targetRange.format.columnWidthPx = columnWidth(name);
  styleRange(sheet, 0, targetColumn, 1, 1, { fill: "#172033", font: { bold: true, color: "#FFFFFF" } });
  styleRange(sheet, 1, targetColumn, 1, 1, { fill: "#334155", font: { bold: true, color: "#E2E8F0" } });
  styleRange(sheet, 2, targetColumn, 1, 1, { fill: "#E2E8F0", font: { color: "#0F172A", size: 8 }, wrapText: true });
  styleRange(sheet, 3, targetColumn, 1, 1, { fill: "#FEF3C7", font: { bold: true, color: "#92400E" } });
  if (columnValues.length > 4) {
    styleRange(sheet, 4, targetColumn, columnValues.length - 4, 1, { fill: "#FFFFFF", font: { color: "#111827" } });
  }
  sheet.getRangeByIndexes(2, targetColumn, 1, 1).format.rowHeightPx = 48;
  return true;
}

function replaceExact(sheet, address, previousValue, nextValue) {
  const cell = sheet.getRange(address);
  if (cell.values?.[0]?.[0] === previousValue) cell.values = [[nextValue]];
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));

const configSheet = workbook.worksheets.getItem("CombatConfig");
appendColumn(configSheet, combatSheets.CombatConfig.columns[6], () => "map01");
appendColumn(configSheet, combatSheets.CombatConfig.columns[7], () => 0.35);
appendColumn(configSheet, combatSheets.CombatConfig.columns[8], () => 1.8);
appendColumn(configSheet, combatSheets.CombatConfig.columns[9], () => 0.32);
appendColumn(configSheet, combatSheets.CombatConfig.columns[10], () => 0.68);
appendColumn(configSheet, combatSheets.CombatConfig.columns[11], () => 0.3);
appendColumn(configSheet, combatSheets.CombatConfig.columns[12], () => 0.4);
appendColumn(configSheet, combatSheets.CombatConfig.columns[13], () => 0);
appendColumn(configSheet, combatSheets.CombatConfig.columns[14], () => 8);
appendColumn(configSheet, combatSheets.CombatConfig.columns[15], () => 0.75);
appendColumn(configSheet, combatSheets.CombatConfig.columns[16], () => 0.655);
appendColumn(configSheet, combatSheets.CombatConfig.columns[17], () => false);
replaceExact(configSheet, "F5", "TEST_SANDBOX", "HENESYS_TILE_LANES");

const profileSheet = workbook.worksheets.getItem("PlayerStatsProfiles");
appendColumn(profileSheet, combatSheets.PlayerStatsProfiles.columns[10], () => "CENTER");
appendColumn(profileSheet, combatSheets.PlayerStatsProfiles.columns[11], () => 1.2);

const monsterSheet = workbook.worksheets.getItem("MonsterDefinitions");
appendColumn(monsterSheet, combatSheets.MonsterDefinitions.columns[15], () => 1.2);

const spawnSheet = workbook.worksheets.getItem("MonsterSpawnGroups");
appendColumn(spawnSheet, combatSheets.MonsterSpawnGroups.columns[8], () => "CENTER");
replaceExact(spawnSheet, "E5", "CombatHarness/MonsterSpawn/Tier1", "CombatHarness/Lanes/CENTER/Spawn");
replaceExact(spawnSheet, "F5", "CombatHarness/CombatBoundsLeft", "CombatHarness/Lanes/CENTER/BoundsLeft");
replaceExact(spawnSheet, "G5", "CombatHarness/CombatBoundsRight", "CombatHarness/Lanes/CENTER/BoundsRight");

if (!getSheetOrNull(workbook, "CombatLanes")) {
  addSchemaSheet(workbook, "CombatLanes", combatSheets.CombatLanes);
}

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "Combat.xlsx Henesys lane migration formula error scan",
});
if (/#REF!|#DIV\/0!|#VALUE!|#NAME\?|#N\/A/.test(errorScan.ndjson)) {
  throw new Error(errorScan.ndjson);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.mkdir(previewDir, { recursive: true });
for (const sheetName of Object.keys(combatSheets)) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(
    path.join(previewDir, `${sheetName}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 16000,
  tableMaxRows: 8,
  tableMaxCols: 24,
  tableMaxCellChars: 120,
});
console.log(overview.ndjson);
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Migrated Combat.xlsx to ${outputPath}`);
