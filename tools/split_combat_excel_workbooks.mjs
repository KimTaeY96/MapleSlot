import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const artifactPath = require.resolve("@oai/artifact-tool", { paths: ["C:/Users/ghddj/Documents/MSW"] });
const { FileBlob, SpreadsheetFile, Workbook } = await import(pathToFileURL(artifactPath).href);

const sourceArg = process.argv.indexOf("--source");
const outputArg = process.argv.indexOf("--output-dir");
const force = process.argv.includes("--force");
const sourcePath = sourceArg >= 0 ? path.resolve(process.argv[sourceArg + 1]) : path.resolve("ExcelTable/Combat.xlsx");
const outputDir = outputArg >= 0 ? path.resolve(process.argv[outputArg + 1]) : path.dirname(sourcePath);
const previewDir = path.join(outputDir, "_combat_split_previews");

const workbookSheets = {
  "Combat.xlsx": ["CombatConfig"],
  "Character.xlsx": ["PlayerStatsProfiles"],
  "Monster.xlsx": ["MonsterDefinitions"],
  "HuntingGround.xlsx": ["HuntingGroundTiers", "MonsterSpawnGroups", "CombatLanes", "CombatLadders"],
};

function fail(message) {
  throw new Error(`[Combat Excel Split] ${message}`);
}

function normalize(values) {
  return values.map((row) => row.map((value) => value === undefined ? null : value));
}

function styleSheet(sheet, values) {
  const rowCount = values.length;
  const columnCount = values[0].length;
  const range = sheet.getRangeByIndexes(0, 0, rowCount, columnCount);
  range.values = values;
  range.format.font = { name: "Malgun Gothic", size: 10 };
  range.format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  range.format.rowHeightPx = 22;
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(4);
  sheet.getRangeByIndexes(0, 0, 1, columnCount).format = {
    fill: "#172033",
    font: { name: "Malgun Gothic", size: 10, bold: true, color: "#FFFFFF" },
  };
  sheet.getRangeByIndexes(1, 0, 1, columnCount).format = {
    fill: "#334155",
    font: { name: "Malgun Gothic", size: 10, bold: true, color: "#E2E8F0" },
  };
  sheet.getRangeByIndexes(2, 0, 1, columnCount).format = {
    fill: "#E2E8F0",
    font: { name: "Malgun Gothic", size: 8, color: "#0F172A" },
    wrapText: true,
    rowHeightPx: 48,
  };
  sheet.getRangeByIndexes(3, 0, 1, columnCount).format = {
    fill: "#FEF3C7",
    font: { name: "Malgun Gothic", size: 10, bold: true, color: "#92400E" },
  };
  if (rowCount > 4) {
    sheet.getRangeByIndexes(4, 0, rowCount - 4, columnCount).format = {
      fill: "#FFFFFF",
      font: { name: "Malgun Gothic", size: 10, color: "#111827" },
    };
  }
  values[0].forEach((headerValue, index) => {
    const header = String(headerValue);
    const width = header.endsWith("Notes") ? 260
      : header.includes("Ruid") || header.includes("Guid") || header.includes("Path") ? 280
      : header.includes("Key") || header.includes("Id") ? 190
      : 145;
    sheet.getRangeByIndexes(0, index, rowCount, 1).format.columnWidthPx = width;
  });
}

await fs.access(sourcePath);
const sourceWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(sourcePath));
const sourceValues = {};
for (const sheetNames of Object.values(workbookSheets)) {
  for (const sheetName of sheetNames) {
    const sourceSheet = sourceWorkbook.worksheets.getItem(sheetName);
    if (!sourceSheet) fail(`${sourcePath} is missing ${sheetName}`);
    const values = normalize(sourceSheet.getUsedRange(true)?.values ?? []);
    if (values.length < 5) fail(`${sheetName} must contain four metadata rows and data`);
    sourceValues[sheetName] = values;
  }
}

if (!force) {
  for (const filename of Object.keys(workbookSheets)) {
    const outputPath = path.join(outputDir, filename);
    if (path.resolve(outputPath) === path.resolve(sourcePath)) continue;
    try {
      await fs.access(outputPath);
      fail(`${outputPath} already exists; pass --force only after reviewing it`);
    } catch (error) {
      if (!String(error?.message).includes("ENOENT")) throw error;
    }
  }
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

for (const [filename, sheetNames] of Object.entries(workbookSheets)) {
  const outputPath = path.join(outputDir, filename);
  const workbook = Workbook.create();
  for (const sheetName of sheetNames) {
    const sheet = workbook.worksheets.add(sheetName);
    styleSheet(sheet, sourceValues[sheetName]);
    const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
    await fs.writeFile(path.join(previewDir, `${path.parse(filename).name}_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
  }

  const formulaErrors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: `${filename} formula error scan`,
  });
  if (/#REF!|#DIV\/0!|#VALUE!|#NAME\?|#N\/A/.test(formulaErrors.ndjson)) fail(formulaErrors.ndjson);

  const exported = await SpreadsheetFile.exportXlsx(workbook);
  await exported.save(outputPath);

  const verified = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
  for (const sheetName of sheetNames) {
    const actual = normalize(verified.worksheets.getItem(sheetName).getUsedRange(true)?.values ?? []);
    if (JSON.stringify(actual) !== JSON.stringify(sourceValues[sheetName])) {
      fail(`${filename}/${sheetName} changed values during export`);
    }
  }
  console.log(`split: ${outputPath} (${sheetNames.join(", ")})`);
}
