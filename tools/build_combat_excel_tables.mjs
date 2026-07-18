import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { combatWorkbookSheets, dropSheets } from "./combat_excel_schema.mjs";

const require = createRequire(import.meta.url);
const artifactPath = require.resolve("@oai/artifact-tool", { paths: ["C:/Users/ghddj/Documents/MSW"] });
const { SpreadsheetFile, Workbook } = await import(pathToFileURL(artifactPath).href);

const outputArg = process.argv.indexOf("--output-dir");
const outputDir = outputArg >= 0 ? path.resolve(process.argv[outputArg + 1]) : path.resolve("ExcelTable");
const previewDir = path.join(outputDir, "_combat_previews");

function styleRange(sheet, row, column, rowCount, columnCount, format) {
  sheet.getRangeByIndexes(row, column, rowCount, columnCount).format = {
    ...format,
    font: { name: "Malgun Gothic", ...(format.font ?? {}) },
  };
}

function addSheet(workbook, name, schema) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const columns = schema.columns;
  const grid = [
    columns.map(([column]) => column),
    columns.map(([, scope]) => scope),
    columns.map(([, , description]) => description),
    columns.map(([, , , type]) => type),
    ...schema.rows,
  ];
  const range = sheet.getRangeByIndexes(0, 0, grid.length, columns.length);
  range.values = grid;
  range.format.font = { name: "Malgun Gothic", size: 10 };
  range.format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  range.format.rowHeightPx = 22;
  sheet.freezePanes.freezeRows(4);
  styleRange(sheet, 0, 0, 1, columns.length, { fill: "#172033", font: { bold: true, color: "#FFFFFF" } });
  styleRange(sheet, 1, 0, 1, columns.length, { fill: "#334155", font: { bold: true, color: "#E2E8F0" } });
  styleRange(sheet, 2, 0, 1, columns.length, { fill: "#E2E8F0", font: { color: "#0F172A", size: 8 }, wrapText: true });
  styleRange(sheet, 3, 0, 1, columns.length, { fill: "#FEF3C7", font: { bold: true, color: "#92400E" } });
  styleRange(sheet, 4, 0, schema.rows.length, columns.length, { fill: "#FFFFFF", font: { color: "#111827" } });
  columns.forEach(([column], index) => {
    const width = column.endsWith("Notes") ? 260
      : column.includes("Ruid") || column.includes("Guid") || column.includes("Path") ? 280
      : column.includes("Key") || column.includes("Id") ? 190
      : 145;
    sheet.getRangeByIndexes(0, index, grid.length, 1).format.columnWidthPx = width;
  });
  sheet.getRangeByIndexes(2, 0, 1, columns.length).format.rowHeightPx = 48;
}

async function writeWorkbook(filename, schemas) {
  const outputPath = path.join(outputDir, filename);
  try {
    await fs.access(outputPath);
    return { filename, status: "preserved", outputPath };
  } catch {}

  const workbook = Workbook.create();
  for (const [name, schema] of Object.entries(schemas)) addSheet(workbook, name, schema);

  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: `${filename} formula error scan`,
  });
  if (/#REF!|#DIV\/0!|#VALUE!|#NAME\?|#N\/A/.test(errors.ndjson)) throw new Error(errors.ndjson);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
  for (const sheetName of Object.keys(schemas)) {
    const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
    const previewBytes = new Uint8Array(await preview.arrayBuffer());
    await fs.writeFile(path.join(previewDir, `${path.parse(filename).name}_${sheetName}.png`), previewBytes);
  }
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  return { filename, status: "created", outputPath };
}

const results = [
  ...(await Promise.all(Object.entries(combatWorkbookSheets)
    .map(([filename, schemas]) => writeWorkbook(filename, schemas)))),
  await writeWorkbook("Drop.xlsx", dropSheets),
];
for (const result of results) console.log(`${result.status}: ${result.outputPath}`);
