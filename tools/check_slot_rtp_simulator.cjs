"use strict";

const {
  evaluateLine,
  evaluateSpin,
  makeRng,
  buildBonusSlotTestCheatGrid,
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
    "All-Wild line has no normal payline payout",
  );
  const allWildBonus = evaluateSpin(makeGrid("WILD"), data, makeRng(777001));
  assertEqual(allWildBonus.bonusSlot.triggered, true, "All-Wild line triggers 777 bonus slot");
  assertEqual(allWildBonus.bonusSlotTriggerLineCount, 3, "All-Wild grid triggers one bonus candidate on each horizontal line");
  assertEqual(data.bonusSlotRules.initialChanceCount, 5, "777 bonus initial chance count is data-driven");
  assertEqual(data.bonusSlotPaytable.get(7).extraChanceCount, 1, "777 grants one extra chance from the paytable");
  assertEqual(data.bonusSlotRules.testCheatUseCount, 1, "777 test cheat is limited by data-driven use count");
  const force777Cheat = data.cheatCommands.find((command) => command.code === "777");
  if (!force777Cheat) {
    throw new Error("Cheat.xlsx must define the 777 development cheat");
  }
  assertEqual(force777Cheat.enabled, true, "777 development cheat is enabled by data");
  assertEqual(force777Cheat.cheatType, "FORCE_777_BONUS_ONCE", "777 development cheat type is data-driven");
  assertEqual(force777Cheat.forceResultKey, "777", "777 development cheat forces the 777 result key");
  assertEqual(force777Cheat.useCount, 1, "777 development cheat grants one session use");
  assertEqual(force777Cheat.requiredRuntimeKind, "TEST_SANDBOX", "777 development cheat is test-sandbox only");

  const directTriggerBlocked = evaluateSpin(makeGrid(lowSymbol), data, makeRng(777002), {
    enableTestCheat: true,
    runtimeBuildKind: "TEST_SANDBOX",
  });
  assertEqual(directTriggerBlocked.bonusSlot.triggered, false, "777 test cheat must not bypass the main spin Wild x5 result");

  const forcedWildGrid = buildBonusSlotTestCheatGrid(data, lowSymbol);
  assertEqual(forcedWildGrid[1].every((symbol) => symbol === "WILD"), true, "777 test cheat builds the next spin as a Wild x5 win");
  const forced777 = evaluateSpin(forcedWildGrid, data, makeRng(777004), {
    enableTestCheat: true,
    runtimeBuildKind: "TEST_SANDBOX",
  });
  assertEqual(forced777.bonusSlot.triggered, true, "777 test cheat Wild x5 spin enters the bonus slot");
  assertEqual(forced777.bonusSlotTriggerLineCount, 1, "777 test cheat forces one visible Wild x5 payline");
  assertEqual(forced777.bonusSlot.spins[0]?.resultKey, "777", "777 test cheat forces the first bonus result to 777");
  assertEqual(forced777.bonusSlot.testCheatUsed, true, "777 test cheat marks the result as cheat-driven");

  const releaseBlocked = evaluateSpin(makeGrid(lowSymbol), data, makeRng(777003), {
    enableTestCheat: true,
    runtimeBuildKind: "RELEASE",
  });
  assertEqual(releaseBlocked.bonusSlot.triggered, false, "777 test cheat is blocked outside TEST_SANDBOX runtime kind");
}

function validateReelStripGuards(data) {
  const pinkBeanWildAdjacency = [];
  for (const [baseBetIndex, reels] of data.reelGroups) {
    for (const [reelNo, strip] of reels) {
      for (let index = 0; index < strip.length; index += 1) {
        if (strip[index] !== "WILD") continue;
        const previous = strip[(index - 1 + strip.length) % strip.length];
        const next = strip[(index + 1) % strip.length];
        if (previous === "PINK_BEAN" || next === "PINK_BEAN") {
          pinkBeanWildAdjacency.push({
            baseBetIndex,
            reelNo,
            stopIndex: index + 1,
            previous,
            next,
          });
        }
      }
    }
  }

  if (pinkBeanWildAdjacency.length > 0) {
    throw new Error(`ReelStrips must not place PINK_BEAN next to WILD stops: ${JSON.stringify(pinkBeanWildAdjacency.slice(0, 5))}`);
  }

  return {
    pinkBeanAdjacentToWildCount: pinkBeanWildAdjacency.length,
  };
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
  const reelStripGuards = validateReelStripGuards(data);

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
    wildRule: "WILD substitutes for the first non-WILD target; all-WILD has no normal payline payout and triggers the 777 bonus slot",
    bonusSlotRule: {
      trigger: `${data.bonusSlotRules.requiredSymbolId} x${data.bonusSlotRules.requiredMatchCount}`,
      initialChanceCount: data.bonusSlotRules.initialChanceCount,
      reelCount: data.bonusSlotRules.reelCount,
      requiredSameCount: data.bonusSlotRules.requiredSameCount,
      jackpotResult: "777",
      jackpotExtraChanceCount: data.bonusSlotPaytable.get(7)?.extraChanceCount,
      testCheatUseCount: data.bonusSlotRules.testCheatUseCount,
      testCheatRequiredRuntimeKind: data.bonusSlotRules.testCheatRequiredRuntimeKind,
    },
    reelStripGuards,
    cheatCommands: data.cheatCommands.map((command) => ({
      code: command.code,
      cheatType: command.cheatType,
      requiredRuntimeKind: command.requiredRuntimeKind,
    })),
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
