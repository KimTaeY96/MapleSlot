"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");

const defaultProjectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const dependencyRoot = "C:/Users/ghddj/Documents/MSW";
let artifactToolPromise = null;

function clean(value) {
  return String(value ?? "").trim();
}

function num(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for ${label}: ${value}`);
  }
  return parsed;
}

function bool(value) {
  if (typeof value === "boolean") return value;
  const text = clean(value).toLowerCase();
  return text === "true" || text === "1" || text === "yes";
}

async function getArtifactTool() {
  if (!artifactToolPromise) {
    const entryPath = require.resolve("@oai/artifact-tool", { paths: [dependencyRoot] });
    artifactToolPromise = import(pathToFileURL(entryPath).href);
  }
  return artifactToolPromise;
}

async function workbookRows(projectRoot, filename, sheetName) {
  const { FileBlob, SpreadsheetFile } = await getArtifactTool();
  const excelDir = path.join(projectRoot, "ExcelTable");
  const input = await FileBlob.load(path.join(excelDir, filename));
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
  return values
    .slice(4)
    .filter((row) => row.some((value) => value !== null && value !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

function buildEnumResolver(enumRows) {
  const byId = new Map();
  const byKo = new Map();

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

function makePaytableGroups(rows, enumResolver) {
  const paytableGroups = new Map();
  for (const row of rows) {
    const baseBetIndex = clean(row.BaseBetRegionIndex) ? num(row.BaseBetRegionIndex, "BaseBetRegionIndex") : 1;
    const symbolId = enumResolver.resolve("SlotSymbol", row.SymbolEnumId);
    const matchCount = num(row.MatchCount, "MatchCount");
    const payoutTenths = num(row.PayoutTenths, "PayoutTenths");
    if (!paytableGroups.has(baseBetIndex)) paytableGroups.set(baseBetIndex, new Map());
    const paytable = paytableGroups.get(baseBetIndex);
    if (!paytable.has(symbolId)) paytable.set(symbolId, {});
    paytable.get(symbolId)[matchCount] = payoutTenths;
  }
  return paytableGroups;
}

function validateReelGroups(reelGroups) {
  for (const [baseBetIndex, reels] of reelGroups) {
    for (let reelNo = 1; reelNo <= 5; reelNo += 1) {
      const strip = reels.get(reelNo);
      if (!strip) {
        throw new Error(`Missing reel ${reelNo} in BaseBet ${baseBetIndex}`);
      }
      const cells = strip.slice(1);
      if (cells.some((symbolId) => !symbolId)) {
        throw new Error(`Reel ${reelNo} in BaseBet ${baseBetIndex} has an empty stop`);
      }
      reels.set(reelNo, cells);
    }
  }
}

async function loadRuntimeSlotData(options = {}) {
  const projectRoot = options.projectRoot ?? defaultProjectRoot;
  const enumResolver = buildEnumResolver(await workbookRows(projectRoot, "Enum.xlsx", "Enums"));
  const paytableGroups = makePaytableGroups(await workbookRows(projectRoot, "Core.xlsx", "Paytable"), enumResolver);
  const defaultPaytableIndex = Math.min(...paytableGroups.keys());
  const paytable = paytableGroups.get(defaultPaytableIndex);

  const slotSymbolRows = (await workbookRows(projectRoot, "Core.xlsx", "SlotSymbols"))
    .sort((a, b) => num(a.SlotSymbolsIndex, "SlotSymbolsIndex") - num(b.SlotSymbolsIndex, "SlotSymbolsIndex"))
    .map((row) => {
      const symbolId = enumResolver.resolve("SlotSymbol", row.SymbolEnumId);
      return {
        id: symbolId,
        isWild: symbolId === "WILD",
        paytable: paytable.get(symbolId) ?? {},
      };
    });

  const slotSymbols = new Map(slotSymbolRows.map((row) => [row.id, row]));
  const paylines = (await workbookRows(projectRoot, "Core.xlsx", "Paylines"))
    .sort((a, b) => num(a.PaylinesIndex, "PaylinesIndex") - num(b.PaylinesIndex, "PaylinesIndex"))
    .map((row) => ({
      id: enumResolver.resolve("LineType", row.LineTypeEnumId),
      rowIndex: num(row.StartRow, "StartRow"),
      enabled: bool(row.IsEnabled),
      costCountsAsLine: bool(row.CostCountsAsLine),
    }));

  const baseBetRows = (await workbookRows(projectRoot, "Core.xlsx", "BaseBetRegions"))
    .sort((a, b) => num(a.BaseBetRegionsIndex, "BaseBetRegionsIndex") - num(b.BaseBetRegionsIndex, "BaseBetRegionsIndex"))
    .map((row) => ({
      index: num(row.BaseBetRegionsIndex, "BaseBetRegionsIndex"),
      betCoins: num(row.BetCoins, "BetCoins"),
    }));

  const multiplierRows = (await workbookRows(projectRoot, "Core.xlsx", "Multipliers"))
    .sort((a, b) => num(a.MultipliersIndex, "MultipliersIndex") - num(b.MultipliersIndex, "MultipliersIndex"))
    .map((row) => ({
      index: num(row.MultipliersIndex, "MultipliersIndex"),
      value: num(row.MultiplierValue, "MultiplierValue"),
    }));

  const reelGroups = new Map();
  for (const row of await workbookRows(projectRoot, "SpinPresentation.xlsx", "ReelStrips")) {
    const baseBetIndex = num(row.BaseBetRegionIndex, "BaseBetRegionIndex");
    const reelNo = num(row.ReelNo, "ReelNo");
    const stopIndex = num(row.StopIndex, "StopIndex");
    const symbolId = enumResolver.resolve("SlotSymbol", row.SymbolEnumId);
    if (!slotSymbols.has(symbolId)) {
      throw new Error(`ReelStrips references unknown slot symbol: ${symbolId}`);
    }
    if (!reelGroups.has(baseBetIndex)) reelGroups.set(baseBetIndex, new Map());
    const reels = reelGroups.get(baseBetIndex);
    if (!reels.has(reelNo)) reels.set(reelNo, []);
    reels.get(reelNo)[stopIndex] = symbolId;
  }
  validateReelGroups(reelGroups);

  return {
    projectRoot,
    coinUnitPerCoin: 10,
    wildSymbolId: "WILD",
    symbols: slotSymbolRows.map((row) => row.id),
    slotSymbols,
    paytable,
    paytableGroups,
    paylines,
    baseBetRows,
    multiplierRows,
    reelGroups,
  };
}

function makeRng(seed = 123456789) {
  let state = seed;
  if (state <= 0) state = 123456789;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function isWildSymbol(data, symbolId) {
  return data.slotSymbols.get(symbolId)?.isWild === true;
}

function getStripSymbolAt(strip, index) {
  const stripLength = strip.length;
  return strip[((index - 1) % stripLength + stripLength) % stripLength];
}

function buildVisibleGrid(reels, stopIndexes) {
  const grid = [[], [], []];
  for (let col = 1; col <= 5; col += 1) {
    const strip = reels.get(col);
    const stopIndex = stopIndexes[col - 1];
    grid[0][col - 1] = getStripSymbolAt(strip, stopIndex - 1);
    grid[1][col - 1] = getStripSymbolAt(strip, stopIndex);
    grid[2][col - 1] = getStripSymbolAt(strip, stopIndex + 1);
  }
  return grid;
}

function evaluateLine(row, data, lineId = "TEST_LINE", rowIndex = 1) {
  let targetSymbol = null;
  let runLength = 0;
  const matchedCells = [];

  for (let index = 0; index < 5; index += 1) {
    const currentSymbol = row[index];
    if (isWildSymbol(data, currentSymbol)) {
      runLength += 1;
      matchedCells.push(currentSymbol);
    } else if (targetSymbol === null) {
      targetSymbol = currentSymbol;
      runLength += 1;
      matchedCells.push(currentSymbol);
    } else if (currentSymbol === targetSymbol) {
      runLength += 1;
      matchedCells.push(currentSymbol);
    } else {
      break;
    }
  }

  const payoutTenths = targetSymbol !== null && runLength >= 3
    ? data.paytable.get(targetSymbol)?.[runLength] ?? 0
    : 0;

  return {
    lineId,
    rowIndex,
    symbol: targetSymbol,
    runLength,
    cells: matchedCells,
    payoutTenths,
  };
}

function evaluateSpin(grid, data) {
  let payoutTenths = 0;
  const lineWins = [];
  for (const payline of data.paylines) {
    if (!payline.enabled) continue;
    const lineResult = evaluateLine(grid[payline.rowIndex - 1], data, payline.id, payline.rowIndex);
    if (lineResult.payoutTenths > 0) {
      payoutTenths += lineResult.payoutTenths;
      lineWins.push(lineResult);
    }
  }
  return {
    payoutTenths,
    lineWins,
  };
}

function sampleSymbol(symbols, weights, rng) {
  const total = symbols.reduce((sum, symbol) => sum + (weights[symbol] ?? 0), 0);
  if (total <= 0) throw new Error("Total symbol weight must be greater than 0");
  let roll = rng() * total;
  for (const symbol of symbols) {
    roll -= weights[symbol] ?? 0;
    if (roll < 0) return symbol;
  }
  return symbols[symbols.length - 1];
}

function collectMetrics({ spinCount, baseBetCoins, multiplier, data, spin }) {
  let totalCostUnits = 0;
  let totalPayoutUnits = 0;
  let hitCount = 0;
  let multiLineHitCount = 0;
  let maxPayoutTenths = 0;
  const bySymbolTenths = Object.fromEntries(data.symbols.map((symbol) => [symbol, 0]));
  const byLineTenths = Object.fromEntries(data.paylines.map((payline) => [payline.id, 0]));

  for (let i = 0; i < spinCount; i += 1) {
    const result = spin();
    const payoutUnits = result.payoutTenths * baseBetCoins * multiplier;
    const costUnits = baseBetCoins * multiplier * data.coinUnitPerCoin;
    totalCostUnits += costUnits;
    totalPayoutUnits += payoutUnits;
    maxPayoutTenths = Math.max(maxPayoutTenths, result.payoutTenths);
    if (result.payoutTenths > 0) hitCount += 1;
    if (result.lineWins.length > 1) multiLineHitCount += 1;
    for (const win of result.lineWins) {
      bySymbolTenths[win.symbol] = (bySymbolTenths[win.symbol] ?? 0) + win.payoutTenths;
      byLineTenths[win.lineId] = (byLineTenths[win.lineId] ?? 0) + win.payoutTenths;
    }
  }

  return {
    totalSpins: spinCount,
    totalCostUnits,
    totalPayoutUnits,
    rtp: totalPayoutUnits / totalCostUnits,
    hitRate: hitCount / spinCount,
    multiLineWinRate: multiLineHitCount / spinCount,
    maxPayoutMultiple: maxPayoutTenths / data.coinUnitPerCoin,
    bySymbolTenths,
    byLineTenths,
  };
}

function simulateExplicitReelGroup({ data, baseBetIndex, spinCount = 100000, seed = 123456789, baseBetCoins = 1, multiplier = 1 }) {
  const reels = data.reelGroups.get(baseBetIndex);
  if (!reels) throw new Error(`Unknown BaseBet reel group: ${baseBetIndex}`);
  const paytable = data.paytableGroups.get(baseBetIndex) ?? data.paytable;
  const scopedData = { ...data, paytable };
  const rng = makeRng(seed);
  return collectMetrics({
    spinCount,
    baseBetCoins,
    multiplier,
    data: scopedData,
    spin() {
      const stopIndexes = [];
      for (let col = 1; col <= 5; col += 1) {
        stopIndexes[col - 1] = Math.floor(rng() * reels.get(col).length) + 1;
      }
      return evaluateSpin(buildVisibleGrid(reels, stopIndexes), scopedData);
    },
  });
}

function simulateWeightedSymbols({ data, weights, spinCount = 100000, seed = 123456789, baseBetCoins = 1, multiplier = 1 }) {
  const symbols = data.symbols.filter((symbol) => (weights[symbol] ?? 0) > 0);
  const rng = makeRng(seed);
  return collectMetrics({
    spinCount,
    baseBetCoins,
    multiplier,
    data,
    spin() {
      const grid = Array.from({ length: 3 }, () =>
        Array.from({ length: 5 }, () => sampleSymbol(symbols, weights, rng)),
      );
      return evaluateSpin(grid, data);
    },
  });
}

module.exports = {
  defaultProjectRoot,
  loadRuntimeSlotData,
  makeRng,
  buildVisibleGrid,
  evaluateLine,
  evaluateSpin,
  simulateExplicitReelGroup,
  simulateWeightedSymbols,
};
