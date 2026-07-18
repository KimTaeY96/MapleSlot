import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import { combatSheets, skillSheets } from "./combat_excel_schema.mjs";

const inputArg = process.argv.indexOf("--input-dir");
const outputArg = process.argv.indexOf("--output-dir");
const previewArg = process.argv.indexOf("--preview-dir");
const inputDir = inputArg >= 0 ? path.resolve(process.argv[inputArg + 1]) : path.resolve("ExcelTable");
const outputDir = outputArg >= 0 ? path.resolve(process.argv[outputArg + 1]) : path.resolve("outputs/skill-tables");
const previewDir = previewArg >= 0 ? path.resolve(process.argv[previewArg + 1]) : path.resolve("preview-skill-after");

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

function appendColumn(sheet, metadata, dataFactory) {
  const values = sheet.getUsedRange(true)?.values ?? [];
  const headers = values[0].map(String);
  const [name, scope, description, type] = metadata;
  if (headers.includes(name)) return;
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
}

function createSchemaWorkbook(sheetName, schema) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(sheetName);
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
  return workbook;
}

async function importWorkbook(filename) {
  return SpreadsheetFile.importXlsx(await FileBlob.load(path.join(inputDir, filename)));
}

async function verifyAndSave(workbook, filename, sheetNames) {
  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: `${filename} formula error scan`,
  });
  if (/#REF!|#DIV\/0!|#VALUE!|#NAME\?|#N\/A/.test(errors.ndjson)) throw new Error(errors.ndjson);
  for (const sheetName of sheetNames) {
    const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
    await fs.writeFile(path.join(previewDir, `${filename}.${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
  }
  const overview = await workbook.inspect({
    kind: "sheet,table",
    maxChars: 30000,
    tableMaxRows: 12,
    tableMaxCols: 80,
    tableMaxCellChars: 120,
  });
  await fs.writeFile(path.join(previewDir, `${filename}.ndjson`), overview.ndjson, "utf8");
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(outputDir, filename));
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const character = await importWorkbook("Character.xlsx");
const characterSheet = character.worksheets.getItem("PlayerStatsProfiles");
appendColumn(characterSheet, combatSheets.PlayerStatsProfiles.columns.at(-1), () => 1);
await verifyAndSave(character, "Character.xlsx", ["PlayerStatsProfiles"]);

const monster = await importWorkbook("Monster.xlsx");
const monsterSheet = monster.worksheets.getItem("MonsterDefinitions");
appendColumn(monsterSheet, combatSheets.MonsterDefinitions.columns.at(-2), () => 2);
appendColumn(monsterSheet, combatSheets.MonsterDefinitions.columns.at(-1), (_row, index) => index === 1 ? 3 : null);
await verifyAndSave(monster, "Monster.xlsx", ["MonsterDefinitions"]);

const enumWorkbook = await importWorkbook("Enum.xlsx");
const enumSheet = enumWorkbook.worksheets.getItem("Enums");
const enumValues = enumSheet.getUsedRange(true)?.values ?? [];
const existingIds = new Set(enumValues.slice(4).map((row) => `${row[1]}:${row[3]}`));
const enumRows = [
  [22, "SkillKey", 1, "PLAYER_BASIC_ATTACK", 301, "\uD50C\uB808\uC774\uC5B4 \uAE30\uBCF8 \uACF5\uACA9"],
  [23, "SkillKey", 2, "SLIME_CONTACT_DAMAGE", 302, "\uC2AC\uB77C\uC784 \uC811\uCD09 \uD53C\uD574"],
  [24, "SkillKey", 3, "SLIME_ACTIVE_ATTACK", 303, "\uC2AC\uB77C\uC784 \uB2A5\uB3D9 \uACF5\uACA9"],
  [25, "SkillHitOriginType", 1, "SELF", 304, "\uB098"],
  [26, "SkillHitOriginType", 2, "TARGET", 305, "\uB300\uC0C1"],
  [27, "SkillHitShapeType", 1, "CIRCLE", 306, "\uC6D0"],
  [28, "SkillHitShapeType", 2, "RECTANGLE", 307, "\uC0AC\uAC01\uD615"],
];
for (const desired of enumRows) {
  const rowIndex = enumValues.slice(4).findIndex((row) => `${row[1]}:${row[3]}` === `${desired[1]}:${desired[3]}`);
  if (rowIndex >= 0) enumSheet.getRangeByIndexes(rowIndex + 4, 4, 1, 1).values = [[desired[4]]];
}
const newEnumRows = enumRows.filter((row) => !existingIds.has(`${row[1]}:${row[3]}`));
if (newEnumRows.length > 0) {
  const startRow = enumValues.length;
  const range = enumSheet.getRangeByIndexes(startRow, 0, newEnumRows.length, 6);
  range.values = newEnumRows;
  range.format.font = { name: "Malgun Gothic", size: 10, color: "#111827" };
  range.format.fill = "#FFFFFF";
  range.format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  range.format.rowHeightPx = 22;
}
await verifyAndSave(enumWorkbook, "Enum.xlsx", ["Enums"]);

const gameString = await importWorkbook("GameString.xlsx");
const gameStringSheet = gameString.worksheets.getItem("GameString");
const gameStringValues = gameStringSheet.getUsedRange(true)?.values ?? [];
const existingGameStringIndexes = new Set(gameStringValues.slice(4).map((row) => Number(row[0])));
const gameStringRows = [
  [301, "\uD50C\uB808\uC774\uC5B4 \uAE30\uBCF8 \uACF5\uACA9"],
  [302, "\uC2AC\uB77C\uC784 \uC811\uCD09 \uD53C\uD574"],
  [303, "\uC2AC\uB77C\uC784 \uB2A5\uB3D9 \uACF5\uACA9"],
  [304, "\uB098"],
  [305, "\uB300\uC0C1"],
  [306, "\uC6D0"],
  [307, "\uC0AC\uAC01\uD615"],
].filter((row) => !existingGameStringIndexes.has(row[0]));
if (gameStringRows.length > 0) {
  const startRow = gameStringValues.length;
  const range = gameStringSheet.getRangeByIndexes(startRow, 0, gameStringRows.length, 2);
  range.values = gameStringRows;
  range.format.font = { name: "Malgun Gothic", size: 10, color: "#111827" };
  range.format.fill = "#FFFFFF";
  range.format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  range.format.rowHeightPx = 22;
}
await verifyAndSave(gameString, "GameString.xlsx", ["GameString"]);

const skill = createSchemaWorkbook("SkillInfo", skillSheets.SkillInfo);
await verifyAndSave(skill, "Skill.xlsx", ["SkillInfo"]);

console.log(`Patched combat skill workbooks in ${outputDir}`);
