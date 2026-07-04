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

async function optionalWorkbookRows(projectRoot, filename, sheetName) {
  try {
    return await workbookRows(projectRoot, filename, sheetName);
  } catch (error) {
    if (String(error?.message ?? "").includes(`Missing sheet: ${filename}/${sheetName}`)) {
      return [];
    }
    throw error;
  }
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
  const paytableGroups = makePaytableGroups(await workbookRows(projectRoot, "SlotMachine.xlsx", "Paytable"), enumResolver);
  const defaultPaytableIndex = Math.min(...paytableGroups.keys());
  const paytable = paytableGroups.get(defaultPaytableIndex);

  const slotSymbolRows = (await workbookRows(projectRoot, "SlotMachine.xlsx", "SlotSymbols"))
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
  const paylines = (await workbookRows(projectRoot, "SlotMachine.xlsx", "Paylines"))
    .sort((a, b) => num(a.PaylinesIndex, "PaylinesIndex") - num(b.PaylinesIndex, "PaylinesIndex"))
    .map((row) => ({
      id: enumResolver.resolve("LineType", row.LineTypeEnumId),
      rowIndex: num(row.StartRow, "StartRow"),
      enabled: bool(row.IsEnabled),
      costCountsAsLine: bool(row.CostCountsAsLine),
    }));

  const baseBetRows = (await workbookRows(projectRoot, "SlotMachine.xlsx", "BaseBetRegions"))
    .sort((a, b) => num(a.BaseBetRegionsIndex, "BaseBetRegionsIndex") - num(b.BaseBetRegionsIndex, "BaseBetRegionsIndex"))
    .map((row) => ({
      index: num(row.BaseBetRegionsIndex, "BaseBetRegionsIndex"),
      betCoins: num(row.BetCoins, "BetCoins"),
    }));

  const multiplierRows = (await workbookRows(projectRoot, "SlotMachine.xlsx", "Multipliers"))
    .sort((a, b) => num(a.MultipliersIndex, "MultipliersIndex") - num(b.MultipliersIndex, "MultipliersIndex"))
    .map((row) => ({
      index: num(row.MultipliersIndex, "MultipliersIndex"),
      value: num(row.MultiplierValue, "MultiplierValue"),
    }));

  const bonusSlotRuleRows = (await optionalWorkbookRows(projectRoot, "SlotMachine.xlsx", "BonusSlotRules"))
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
    enabled: clean(bonusSlotRuleRow.Enabled) ? bool(bonusSlotRuleRow.Enabled) : true,
    testCheatEnabled: clean(bonusSlotRuleRow.TestCheatEnabled) ? bool(bonusSlotRuleRow.TestCheatEnabled) : false,
    testCheatForceTrigger: clean(bonusSlotRuleRow.TestCheatForceTrigger) ? bool(bonusSlotRuleRow.TestCheatForceTrigger) : false,
    testCheatForceResultKey: clean(bonusSlotRuleRow.TestCheatForceResultKey) || "777",
    testCheatUseCount: clean(bonusSlotRuleRow.TestCheatUseCount) ? num(bonusSlotRuleRow.TestCheatUseCount, "TestCheatUseCount") : 0,
    testCheatRequiredRuntimeKind: clean(bonusSlotRuleRow.TestCheatRequiredRuntimeKind) || "TEST_SANDBOX",
  };
  const bonusSlotPaytableRows = (await optionalWorkbookRows(projectRoot, "SlotMachine.xlsx", "BonusSlotPaytable"))
    .sort((a, b) => num(a.BonusSlotPaytableIndex, "BonusSlotPaytableIndex") - num(b.BonusSlotPaytableIndex, "BonusSlotPaytableIndex"))
    .map((row) => ({
      digit: num(row.Digit, "Digit"),
      resultKey: clean(row.ResultKey),
      rewardMultiplier: num(row.RewardMultiplier, "RewardMultiplier"),
      extraChanceCount: num(row.ExtraChanceCount, "ExtraChanceCount"),
      rollWeight: num(row.RollWeight, "RollWeight"),
    }));
  const bonusSlotPaytable = new Map(bonusSlotPaytableRows.map((row) => [row.digit, row]));
  const bonusSlotDigits = bonusSlotPaytableRows.map((row) => row.digit);
  const bonusSlotTotalWeight = bonusSlotPaytableRows.reduce((sum, row) => sum + row.rollWeight, 0);

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
    bonusSlotRules,
    bonusSlotPaytable,
    bonusSlotDigits,
    bonusSlotTotalWeight,
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

function isBonusSlotLineTrigger(lineResult, data) {
  const config = data.bonusSlotRules;
  if (!config?.enabled || !lineResult?.cells) return false;
  if (lineResult.runLength < config.requiredMatchCount) return false;
  for (let index = 0; index < config.requiredMatchCount; index += 1) {
    if (lineResult.cells[index] !== config.requiredSymbolId) return false;
  }
  return true;
}

function rollBonusSlotDigit(data, rng) {
  if (!data.bonusSlotDigits?.length || data.bonusSlotTotalWeight <= 0) return 0;
  let roll = rng() * data.bonusSlotTotalWeight;
  for (const digit of data.bonusSlotDigits) {
    const row = data.bonusSlotPaytable.get(digit);
    roll -= row?.rollWeight ?? 0;
    if (roll < 0) return digit;
  }
  return data.bonusSlotDigits[0] ?? 0;
}

function isBonusSlotTestCheatAllowed(data, options = {}) {
  const config = data.bonusSlotRules;
  if (!options.enableTestCheat || !config?.testCheatEnabled) return false;
  if ((options.testCheatUseCount ?? config.testCheatUseCount) <= 0) return false;
  const runtimeBuildKind = options.runtimeBuildKind ?? "RELEASE";
  return runtimeBuildKind === (config.testCheatRequiredRuntimeKind || "TEST_SANDBOX");
}

function forcedBonusSlotDigits(resultKey, data, rng) {
  const config = data.bonusSlotRules;
  const normalized = clean(resultKey);
  return Array.from({ length: config.reelCount }, (_, index) => {
    const digit = Number(normalized[index]);
    return Number.isFinite(digit) && digit > 0 ? digit : rollBonusSlotDigit(data, rng);
  });
}

function resolveBonusSlot(triggerLineCount, data, rng, options = {}) {
  const config = data.bonusSlotRules;
  const testCheatAllowed = isBonusSlotTestCheatAllowed(data, options);
  if (testCheatAllowed && config.testCheatForceTrigger) {
    triggerLineCount = Math.max(triggerLineCount, config.minTriggerLineCount);
  }
  if (!config?.enabled || triggerLineCount < config.minTriggerLineCount) {
    return { triggered: false, payoutTenths: 0, spinCount: 0, hitCount: 0 };
  }

  let chances = config.initialChanceCount;
  const maxTotalSpinCount = config.maxTotalSpinCount || chances;
  let spinCount = 0;
  let hitCount = 0;
  let extraChanceCount = 0;
  let payoutTenths = 0;
  const spins = [];

  while (chances > 0 && spinCount < maxTotalSpinCount) {
    chances -= 1;
    spinCount += 1;
    const digits = testCheatAllowed && spinCount === 1 && config.testCheatForceResultKey
      ? forcedBonusSlotDigits(config.testCheatForceResultKey, data, rng)
      : Array.from({ length: config.reelCount }, () => rollBonusSlotDigit(data, rng));
    const matchedDigit = digits.slice(0, config.requiredSameCount).every((digit) => digit === digits[0])
      ? digits[0]
      : 0;
    const paytableRow = matchedDigit > 0 ? data.bonusSlotPaytable.get(matchedDigit) : null;
    const rewardMultiplier = paytableRow?.rewardMultiplier ?? 0;
    const extraChance = paytableRow?.extraChanceCount ?? 0;
    if (paytableRow) {
      payoutTenths += rewardMultiplier * data.coinUnitPerCoin;
      chances += extraChance;
      extraChanceCount += extraChance;
      hitCount += 1;
    }
    spins.push({
      resultKey: digits.join(""),
      matchedDigit,
      rewardMultiplier,
      extraChanceCount: extraChance,
    });
  }

  return {
    triggered: true,
    payoutTenths,
    spinCount,
    hitCount,
    extraChanceCount,
    spins,
    testCheatUsed: testCheatAllowed,
  };
}

function evaluateSpin(grid, data, rng = Math.random, options = {}) {
  let payoutTenths = 0;
  const lineWins = [];
  let bonusSlotTriggerLineCount = 0;
  for (const payline of data.paylines) {
    if (!payline.enabled) continue;
    const lineResult = evaluateLine(grid[payline.rowIndex - 1], data, payline.id, payline.rowIndex);
    const bonusSlotTrigger = isBonusSlotLineTrigger(lineResult, data);
    lineResult.bonusSlotTrigger = bonusSlotTrigger;
    if (lineResult.payoutTenths > 0 || bonusSlotTrigger) {
      payoutTenths += lineResult.payoutTenths;
      if (bonusSlotTrigger) bonusSlotTriggerLineCount += 1;
      lineWins.push(lineResult);
    }
  }
  const bonusSlot = resolveBonusSlot(bonusSlotTriggerLineCount, data, rng, options);
  payoutTenths += bonusSlot.payoutTenths;
  return {
    payoutTenths,
    lineWins,
    bonusSlot,
    bonusSlotTriggerLineCount,
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
      if (win.symbol) {
        bySymbolTenths[win.symbol] = (bySymbolTenths[win.symbol] ?? 0) + win.payoutTenths;
      }
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
      return evaluateSpin(buildVisibleGrid(reels, stopIndexes), scopedData, rng);
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
      return evaluateSpin(grid, data, rng);
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
  isBonusSlotLineTrigger,
  isBonusSlotTestCheatAllowed,
  resolveBonusSlot,
  simulateExplicitReelGroup,
  simulateWeightedSymbols,
};
