"use strict";

const {
  evaluateLine,
  evaluateSpin,
  loadRuntimeSlotData,
  simulateExplicitReelGroup,
  simulateWeightedSymbols,
} = require("./slot_rtp_runtime_data.cjs");

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function makeGrid(fill) {
  return Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => fill));
}

function getPay(data, symbolId, matchCount) {
  const payout = data.paytable.get(symbolId)?.[matchCount];
  if (payout === undefined) {
    throw new Error(`Missing paytable value: ${symbolId}/${matchCount}`);
  }
  return payout;
}

function runValidationCases(data) {
  const normalSymbols = data.symbols.filter((symbol) => !data.slotSymbols.get(symbol)?.isWild);
  const lowSymbol = normalSymbols[0];
  const highSymbol = normalSymbols[normalSymbols.length - 1];

  assertEqual(
    evaluateSpin(makeGrid(lowSymbol), data).payoutTenths,
    getPay(data, lowSymbol, 5) * 3,
    `All ${lowSymbol} pays 5-of-kind on 3 horizontal lines`,
  );
  assertEqual(
    evaluateSpin(makeGrid(highSymbol), data).payoutTenths,
    getPay(data, highSymbol, 5) * 3,
    `All ${highSymbol} pays 5-of-kind on 3 horizontal lines`,
  );

  assertEqual(
    evaluateLine([lowSymbol, lowSymbol, lowSymbol, highSymbol, lowSymbol], data).payoutTenths,
    getPay(data, lowSymbol, 3),
    `${lowSymbol} ${lowSymbol} ${lowSymbol} break pays 3-of-kind only`,
  );
  assertEqual(
    evaluateLine([lowSymbol, highSymbol, lowSymbol, highSymbol, lowSymbol], data).payoutTenths,
    0,
    "Non-consecutive line matches pay 0",
  );

  const midSymbol = normalSymbols[Math.min(2, normalSymbols.length - 1)];
  assertEqual(
    evaluateLine([midSymbol, midSymbol, midSymbol, midSymbol, lowSymbol], data).payoutTenths,
    getPay(data, midSymbol, 4),
    `${midSymbol} four-of-kind pays 4-of-kind only`,
  );

  assertEqual(
    evaluateLine(["WILD", "WILD", highSymbol, highSymbol, lowSymbol], data).payoutTenths,
    getPay(data, highSymbol, 4),
    "Leading Wilds substitute for the first non-Wild target",
  );
  assertEqual(
    evaluateLine([midSymbol, "WILD", midSymbol, "WILD", midSymbol], data).payoutTenths,
    getPay(data, midSymbol, 5),
    "Wilds in a run substitute for the target symbol",
  );
  assertEqual(
    evaluateLine(["WILD", "WILD", "WILD", "WILD", "WILD"], data).payoutTenths,
    0,
    "All-Wild line is substitute-only and pays 0",
  );
}

function summarize(metric) {
  return {
    rtp: Number(metric.rtp.toFixed(4)),
    hitRate: Number(metric.hitRate.toFixed(4)),
    multiLineWinRate: Number(metric.multiLineWinRate.toFixed(4)),
    maxPayoutMultiple: Number(metric.maxPayoutMultiple.toFixed(1)),
  };
}

async function main() {
  const data = await loadRuntimeSlotData();
  runValidationCases(data);

  const equalWeights = Object.fromEntries(data.symbols.map((symbol) => [symbol, 20]));
  const equalX1 = simulateWeightedSymbols({ data, weights: equalWeights, spinCount: 200000, multiplier: 1, seed: 246813579 });
  const equalX5 = simulateWeightedSymbols({ data, weights: equalWeights, spinCount: 200000, multiplier: 5, seed: 246813579 });
  assertClose(equalX1.rtp, equalX5.rtp, 0.000001, "Multiplier neutrality");

  const explicitReelGroups = data.baseBetRows.map((row) => ({
    baseBetIndex: row.index,
    baseBetCoins: row.betCoins,
    ...summarize(simulateExplicitReelGroup({
      data,
      baseBetIndex: row.index,
      baseBetCoins: row.betCoins,
      spinCount: 100000,
      seed: 123456789 + row.index,
    })),
  }));

  console.log(JSON.stringify({
    validation: "passed",
    symbolIds: data.symbols,
    paylineMode: data.paylines.filter((line) => line.enabled).map((line) => `${line.id}:row${line.rowIndex}`),
    costRule: "baseBet * multiplier",
    payoutRule: "baseBet * multiplier * paytableTenths / 10 displayed coins",
    wildRule: "WILD substitutes for the first non-WILD target; all-WILD has no payout",
    multiplierNeutrality: {
      x1Rtp: Number(equalX1.rtp.toFixed(6)),
      x5Rtp: Number(equalX5.rtp.toFixed(6)),
    },
    explicitReelGroups,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
