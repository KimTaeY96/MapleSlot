# Slot RTP Candidates

## Purpose
Track Phase1 RTP candidates for the current 3x5 slot machine before later Scatter, Free Spin, Bonus Wheel, or Jackpot Wheel expansion.

This document is a planning reference for the 기획 디렉터 and 테크 디렉터. Update it whenever paytable values, explicit reel strips, Wild policy, active paylines, or the cost rule changes.

## Current Rule Set
- Active paylines: `TOP_LINE`, `MAIN_LINE`, `BOTTOM_LINE`.
- A line win starts at column 1 and continues left-to-right.
- Spin cost: `BaseBet * Multiplier`.
- Active paylines affect payout evaluation only; they do not multiply spin cost.
- Line payout: `BaseBet * Multiplier * paytableMultiplier`.
- Multiplier is RTP-neutral.
- `WILD` is substitute-only. It substitutes for the first non-Wild target in a left-to-right run, and an all-Wild line has no payout.
- Runtime-authoritative simulation uses explicit `SlotMachine.xlsx/ReelStrips` data.
- Weighted candidates are only pre-strip estimates.

## Current Explicit Reel Strip Results
Generated with `tools/check_slot_rtp_simulator.cjs` on 2026-07-05 from the current Excel tables.

| BaseBetIndex | Base Bet | RTP | Spin Hit Rate | Multi-Line Win Rate | Max Payout Multiple |
|---:|---:|---:|---:|---:|---:|
| 1 | 1 | 66.15% | 24.08% | 2.97% | 100.0x |
| 2 | 2 | 66.07% | 24.03% | 2.85% | 100.0x |
| 3 | 3 | 65.17% | 23.98% | 2.86% | 100.0x |
| 4 | 4 | 65.11% | 23.99% | 2.94% | 100.0x |
| 5 | 5 | 66.00% | 23.88% | 2.90% | 666.0x |
| 6 | 6 | 65.41% | 24.19% | 2.92% | 100.0x |
| 7 | 7 | 67.20% | 24.22% | 2.91% | 100.0x |
| 8 | 8 | 64.38% | 23.97% | 2.91% | 100.0x |
| 9 | 9 | 65.03% | 24.02% | 2.98% | 101.8x |
| 10 | 10 | 67.12% | 24.47% | 2.97% | 100.0x |

## Weighted Candidate Results
Generated with `tools/check_slot_rtp_candidates.cjs`.

| Candidate | Weights (`SLIME/MUSHROOM/PIG/GOLEM/PINK_BEAN/WILD`) | RTP | Spin Hit Rate | Multi-Line Win Rate | PM Read |
|---|---|---:|---:|---:|---|
| Equal runtime symbols | `20/20/20/20/20/20` | 297.13% | 42.07% | 7.45% | Economically broken because high-value and Wild symbols are too frequent. |
| Current common-heavy with Wild | `44/24/15/8/2/7` | 83.88% | 44.09% | 8.27% | Good feel-test candidate, but explicit reel-strip proof is preferred. |
| Conservative Wild-light | `40/25/16/9/3/3` | 51.65% | 32.81% | 4.28% | Safer economy candidate if Common Coin sinks are weak. |
| Feel-test high hit | `60/24/12/5/2/8` | 148.29% | 59.64% | 16.89% | Broken without major paytable or sink changes. |
| Broken Wild extreme | `80/8/5/3/1/20` | 599.73% | 95.44% | 70.71% | Red-flag boundary for Wild frequency. |

## Recommendation
Use the explicit reel strip lane as the Phase1 playable baseline.

The current Excel strips sit in the intended prototype feel band:
- RTP: about 64.4%-67.2%.
- Spin hit rate: about 23.9%-24.5%.
- Multi-line win rate: about 2.9%-3.0%.

Do not use weighted candidates as final proof. They are useful for rough direction only. Final balancing should edit `SlotMachine.xlsx/ReelStrips`, then rerun `tools/check_slot_rtp_simulator.cjs`.

## Design Risks
- Wild frequency can inflate RTP much faster than a normal symbol because it extends multiple target-symbol runs.
- High RTP with low hit rate can feel swingy; current strips are moderate-hit, medium-RTP by prototype standards.
- Current max payout multiples are large enough for presentation hooks, but jackpots and bonus wheels remain disabled.
- Final RTP cannot be approved until Common Coin sources and sinks are designed with combat and shop progression.

## Next Decisions
1. Decide whether the 70%-85% prototype lane should remain until combat/shop economy exists.
2. Decide whether BaseBet regions should intentionally differ in volatility, not only bet amount.
3. Decide when to add Scatter/Free Spin/Bonus Wheel tables, since those will require a fresh RTP pass.
