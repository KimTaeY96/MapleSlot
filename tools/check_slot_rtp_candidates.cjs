"use strict";

const {
  loadRuntimeSlotData,
  simulateWeightedSymbols,
} = require("./slot_rtp_runtime_data.cjs");

function summarize(metric) {
  return {
    rtp: Number(metric.rtp.toFixed(4)),
    spinHitRate: Number(metric.hitRate.toFixed(4)),
    multiLineWinRate: Number(metric.multiLineWinRate.toFixed(4)),
    maxPayoutMultiple: Number(metric.maxPayoutMultiple.toFixed(1)),
  };
}

function weightsFor(data, weights) {
  return Object.fromEntries(data.symbols.map((symbol) => [symbol, weights[symbol] ?? 0]));
}

async function main() {
  const data = await loadRuntimeSlotData();
  const candidates = {
    equalRuntimeSymbols: weightsFor(data, {
      SLIME: 20,
      MUSHROOM: 20,
      PIG: 20,
      GOLEM: 20,
      PINK_BEAN: 20,
      WILD: 20,
    }),
    currentCommonHeavyWithWild: weightsFor(data, {
      SLIME: 44,
      MUSHROOM: 24,
      PIG: 15,
      GOLEM: 8,
      PINK_BEAN: 2,
      WILD: 7,
    }),
    conservativeWildLight: weightsFor(data, {
      SLIME: 40,
      MUSHROOM: 25,
      PIG: 16,
      GOLEM: 9,
      PINK_BEAN: 3,
      WILD: 3,
    }),
    feelTestHighHit: weightsFor(data, {
      SLIME: 60,
      MUSHROOM: 24,
      PIG: 12,
      GOLEM: 5,
      PINK_BEAN: 2,
      WILD: 8,
    }),
    brokenWildExtreme: weightsFor(data, {
      SLIME: 80,
      MUSHROOM: 8,
      PIG: 5,
      GOLEM: 3,
      PINK_BEAN: 1,
      WILD: 20,
    }),
  };

  const result = Object.entries(candidates).map(([name, weights], index) => ({
    name,
    weights,
    ...summarize(simulateWeightedSymbols({
      data,
      weights,
      spinCount: 300000,
      seed: 987654321 + index,
    })),
  }));

  console.log(JSON.stringify({
    source: "ExcelTable/Core.xlsx + current WILD substitute rule",
    costRule: "baseBet * multiplier",
    note: "Weighted candidates are pre-strip estimates only; explicit ReelStrips simulation is authoritative for current runtime data.",
    candidates: result,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
