import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const dependencyRoot = "C:/Users/ghddj/Documents/MSW";
const require = createRequire(import.meta.url);
const artifactToolPath = require.resolve("@oai/artifact-tool", { paths: [dependencyRoot] });
const { FileBlob, SpreadsheetFile, Workbook } = await import(pathToFileURL(artifactToolPath).href);

const outputDir = "C:/Users/ghddj/Desktop/AI/MSW/ExcelTable";
const outputPath = path.join(outputDir, "Cheat.xlsx");

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

async function loadExistingSheetRows(filename, sheetName) {
  const inputPath = path.join(outputDir, filename);
  try {
    await fs.access(inputPath);
  } catch {
    return [];
  }

  const input = await FileBlob.load(inputPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const sheet = workbook.worksheets.getItem(sheetName);
  if (!sheet) return [];

  const usedRange = sheet.getUsedRange(true);
  const values = usedRange?.values;
  if (!values || values.length < 5) return [];

  const headers = values[0];
  return values.slice(4)
    .filter((row) => row.some((value) => value !== null && value !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

const existingCheatCommandRows = new Map(
  (await loadExistingSheetRows("Cheat.xlsx", "CheatCommands"))
    .filter((row) => row.CheatCode !== null && row.CheatCode !== "")
    .map((row) => [clean(row.CheatCode).toUpperCase(), row]),
);

function existingCheatCommandValue(code, key, fallback) {
  const value = existingCheatCommandRows.get(clean(code).toUpperCase())?.[key];
  return value === null || value === undefined || value === "" ? fallback : value;
}

function setColumnWidths(sheet, totalRows, widths) {
  widths.forEach((width, column) => {
    sheet.getRangeByIndexes(0, column, totalRows, 1).format.columnWidthPx = width;
  });
}

function styledRange(sheet, row, column, rowCount, columnCount, format) {
  sheet.getRangeByIndexes(row, column, rowCount, columnCount).format = {
    ...format,
    font: {
      name: "Malgun Gothic",
      ...(format.font ?? {}),
    },
  };
}

function addDataSheet(workbook, name, columns, rows, widths = []) {
  const sheet = workbook.worksheets.add(name);
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
  range.format.font = { name: "Malgun Gothic" };
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
  setColumnWidths(sheet, values.length, widths.length ? widths : columns.map(() => 150));
  return sheet;
}

const cheatCode = "777";
const workbook = Workbook.create();
addDataSheet(workbook, "CheatCommands", [
  { name: "CheatCommandsIndex", scope: "all", desc: "CheatCommands 테이블 행을 식별하는 정수 인덱스입니다.", type: "int" },
  { name: "CheatCode", scope: "client", desc: "테스트 UI 입력창에 입력할 치트 코드입니다.", type: "string" },
  { name: "DisplayName", scope: "client", desc: "테스트 UI 목록에 표시할 치트 이름입니다.", type: "string" },
  { name: "Description", scope: "client", desc: "치트의 동작을 설명하는 목록 표시 문구입니다.", type: "string" },
  { name: "CheatType", scope: "client", desc: "런타임에서 처리할 치트 동작 타입입니다.", type: "string" },
  { name: "TargetKey", scope: "client", desc: "치트가 대상으로 삼는 슬롯 기능 또는 트리거 키입니다.", type: "string" },
  { name: "ForceResultKey", scope: "client", desc: "강제 결과가 필요한 치트에서 사용할 결과 키입니다.", type: "string" },
  { name: "UseCount", scope: "client", desc: "치트 입력 1회로 현재 플레이 세션에 부여할 사용 가능 횟수입니다.", type: "int" },
  { name: "RequiredRuntimeKind", scope: "client", desc: "치트가 허용되는 런타임 종류입니다.", type: "string" },
  { name: "Enabled", scope: "client", desc: "현재 치트 행을 사용할지 여부입니다.", type: "bool" },
  { name: "Notes", scope: "design", desc: "개발 로직에서는 사용하지 않는 기획 참고 메모입니다.", type: "string" },
], [[
  Number(existingCheatCommandValue(cheatCode, "CheatCommandsIndex", 1)),
  existingCheatCommandValue(cheatCode, "CheatCode", cheatCode),
  existingCheatCommandValue(cheatCode, "DisplayName", "Force 777 Bonus"),
  existingCheatCommandValue(cheatCode, "Description", "Force the next spin to Wild x5 and first 777 result once."),
  existingCheatCommandValue(cheatCode, "CheatType", "FORCE_777_BONUS_ONCE"),
  existingCheatCommandValue(cheatCode, "TargetKey", "WILD_5_BONUS_SLOT"),
  existingCheatCommandValue(cheatCode, "ForceResultKey", "777"),
  Number(existingCheatCommandValue(cheatCode, "UseCount", 1)),
  existingCheatCommandValue(cheatCode, "RequiredRuntimeKind", "TEST_SANDBOX"),
  existingCheatCommandValue(cheatCode, "Enabled", true),
  existingCheatCommandValue(cheatCode, "Notes", "Development-only session cheat; release runtime cannot apply it."),
]], [170, 130, 190, 360, 210, 190, 130, 110, 190, 100, 360]);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
if (errors.ndjson.includes("#REF!") || errors.ndjson.includes("#DIV/0!") || errors.ndjson.includes("#VALUE!")) {
  throw new Error(errors.ndjson);
}

await fs.mkdir(outputDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(`Created ${outputPath}`);
