# Slot RTP Simulator Handoff

## Purpose
Capture the Design agent's critical review of the current 3x5 visual slot, 3 horizontal paylines, Wild behavior, and payout design. This document is design/balance planning and now also records the current data-backed simulator contract.

## Authority
- Read with `ProjectDirection.md` and `Slot_Symbols_Paytable.md`.
- This handoff does not authorize UI implementation, production Lua, economy persistence, payment behavior, or final reel weights.
- Current design status: conditionally acceptable for simulator prototyping only. It is not implementation-approved until the open questions and simulator checks below are resolved.

## Critical Review Summary
| Area | Finding | Risk | Design Decision / Required Follow-up |
|---|---|---:|---|
| Payline matching | The original phrase `3 of a kind on a payline` is ambiguous. | High | Use the 3x5 visual window and evaluate only 3 horizontal paylines, with left-to-right consecutive matching from column 1. Do not pay non-consecutive, center-start, diagonal, or V-shaped matches. |
| RTP proof | Payouts alone cannot prove RTP because reel strips control stop probability. | High | 테크 디렉터 must simulate using the same explicit reel strips that runtime uses before balance approval. |
| Common-heavy weights | Making common symbols too frequent can exceed 100% RTP even with low common payouts. | High | Do not assume rarity order is safe. Verify each candidate weight set numerically. |
| Payline overlap | Enabling many paylines too early can create correlated wins, higher volatility, and higher RTP when spin cost is paid once per spin. | Medium | P0.5 enables only `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE`. Diagonal/V-shaped paylines wait until P1 or later. |
| Fractional payouts | Level 1 payouts include `0.4x` and `0.6x`. Rounding can create abuse or silent RTP drift. | High | Use scaled integer units or choose Base Bet costs divisible enough to pay all listed multipliers exactly. |
| Coin conversion | Premium Coin can operate slots, while slot winnings are Common Coin by current economy wording. | Medium | Slot winnings always pay Common Coin. Premium Coin is spent first and is never paid back as a slot reward. |
| Multiplier | Multiplier is safe for RTP only if cost and payout scale with the exact same arithmetic. | Medium | Simulator should verify x1 through x5 produce the same RTP within sampling error. |
| Multi-line payout | Three horizontal paylines are active after the Phase0 expansion. | Low | Evaluate `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE`; diagonal, V-shaped, and ways-style paylines wait for a later expansion spec. |
| Wild behavior | Wild is now enabled as a substitute-only symbol. | Medium | Wild extends the first non-Wild target run; all-Wild lines do not pay unless a future Wild jackpot rule is explicitly added. |

## Required Pay Evaluation Rules
1. The slot window is 3 rows x 5 columns, matching `Slot_Symbols_Paytable.md`.
2. A spin evaluates exactly 3 fixed horizontal paylines in P0.5: `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE`.
3. Inspect the five cells in left-to-right order.
4. A winning line must start at the first cell and continue consecutively left-to-right.
5. Pay the best single length per payline:
   - 3 matching cells pays the 3-of-kind value only if the 4th cell breaks the run.
   - 4 matching cells pays the 4-of-kind value only if the 5th cell breaks the run.
   - 5 matching cells pays the 5-of-kind value only.
6. A line with matching cells in positions 1, 3, and 5 does not pay.
7. A line with positions 2, 3, and 4 matching does not pay.
8. A spin can pay multiple horizontal line results in P0.5.

## Active Payline Cost Rule
Spin cost is paid once per spin. It does **not** multiply by the active payline count:

```text
spinCost = BaseBet * Multiplier
```

Each line payout remains:

```text
linePayout = BaseBet * Multiplier * paytableMultiplier
```

This means the 3 horizontal paylines increase win opportunities without making the user spend 3x coins. RTP must be balanced through reel strips and paytable values under this single-spin-cost rule.

## P0 Authority Requirement
- Client UI may animate reels and preview balances, but final spin outcome, cost deduction, and reward grant must be resolved by authoritative logic before production release.
- The prototype may continue using local script logic while the MSW server contract is being prepared.
- The authoritative result must include RNG seed or trace metadata for QA logs when practical.
- The simulator must be able to evaluate the same reel strip and payline data that runtime uses.

## RTP Red Flags From Current Table
These are sanity-check examples, not final balance claims.

| Scenario | Interpretation | Estimated RTP | Meaning |
|---|---|---:|---|
| Current explicit Excel reel strips | 3 horizontal lines with single-spin cost and substitute-only Wild | ~70.5%-75.6% | Acceptable prototype feel-test band; still needs economy context. |
| Equal chance across all 6 runtime symbols, including `PINK_BEAN` and `WILD` | Weighted candidate, not explicit strips | ~297.1% | Economically broken because high-value and Wild symbols are too frequent. |
| Common-heavy with moderate Wild (`44/24/15/8/2/7`) | Weighted candidate, not explicit strips | ~83.9% | Useful feel-test shape, but explicit strip simulation remains authoritative. |
| Any-position 3/4/5 matching evaluation | Pays non-consecutive or center-start runs | Broken by design | This interpretation remains rejected. |

## P0 Production-Facing Simulator Contract
The later Script Dev simulator should accept data, not hardcoded branching, so Design can test revised tables without rewriting logic.

### Inputs
- `symbols`: ordered symbol IDs: `SLIME`, `MUSHROOM`, `PIG`, `GOLEM`, `PINK_BEAN`, `WILD`.
- `reelStrips`: explicit per-reel symbol stop data from `SpinPresentation.xlsx/ReelStrips`.
- `paylines`: ordered coordinate arrays. P0.5 enables only the three horizontal lines, but the format must support additional lines later.
- `paytable`: symbol ID mapped to 3, 4, and 5 match payout multipliers.
- `baseBetCost`: integer unit cost for Base Bet Level 1.
- `multiplier`: x1 through x5.
- `spinCount` and deterministic random seed.

### Outputs
- Total spins, total cost, total payout, and RTP.
- Hit rate: percentage of spins with payout greater than 0.
- Per-symbol payout contribution.
- Per-line payout contribution.
- Distribution of total spin payout multiples.
- Maximum observed payout multiple.
- Frequency of multi-line wins.
- RTP by multiplier level to confirm multiplier neutrality.

### Validation Cases
| Case | Expected Result |
|---|---|
| All 15 visible cells are `SLIME` | `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` each pay 5-of-kind `SLIME`; total payout is `12.0x` Base Bet before multiplier scaling. |
| All 15 visible cells are `PINK_BEAN` | `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` each pay 5-of-kind `PINK_BEAN`; total payout is `300.0x` Base Bet before multiplier scaling. |
| Payline has `SLIME SLIME SLIME PIG GOLEM` | That line pays `0.4x`. |
| Payline has `SLIME PIG SLIME GOLEM SLIME` | That line pays `0`. |
| Payline has `PIG PIG PIG PIG SLIME` | That line pays `3.0x`, not `1.0x + 3.0x`. |
| Payline has `WILD WILD PINK_BEAN PINK_BEAN SLIME` | That line pays 4-of-kind `PINK_BEAN`. |
| Payline has `PIG WILD PIG WILD PIG` | That line pays 5-of-kind `PIG`. |
| Payline has `WILD WILD WILD WILD WILD` | That line pays `0` because Wild is substitute-only. |
| Horizontal multi-line case | `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` can each pay once; total payout is the sum of winning horizontal lines. |
| Diagonal or V-shaped overlap case | Out of P0.5 scope; no payout before a later P1 payline spec. |
| Same weights tested at x1 and x5 | RTP remains effectively equal, with only sampling variance. |

## Open Design Questions For Slot Deepening
1. What exact symbol weight model should become production-facing after the first playable pass: iid per cell, per-column weights, or physical reel strips?
2. What target RTP band should the first playable build aim for, for example 85%-95%, rather than only `strictly below 100%`?
3. Should the 300-second Base Bet lock be active during the first test build, or bypassed until QA no longer needs rapid Base Bet switching?
4. Scatter, Free Spin, and bonus triggers remain excluded from this slice. Decide which one is next after current Wild RTP is accepted.
5. Should final Common Coin display support one decimal digit, or should the paytable be retuned later for integer-only coin display?

## Current Runtime Decisions
- Base Bet test values are `1` through `10`.
- Multiplier test values are `x1` through `x5`.
- Spin cost is `BaseBet * Multiplier`.
- Premium Coin is spent first. If Premium Coin is insufficient, Common Coin pays the remaining cost.
- Slot rewards always pay Common Coin.
- Runtime currency math uses scaled integer units: `1 displayed coin = 10 internal units`.
- Current payout multipliers remain represented in tenths of Base Bet (`0.4x = 4`, `100.0x = 1000`) to avoid floating point rounding drift.
- The detailed runtime handoff is `Slot_Machine_Runtime.md`.

## Recommendation
Freeze the current payline shape and symbol hierarchy for the first runtime pass, but do not freeze reel weights. The next Design step should propose 2-3 candidate weight sets and an RTP target band after the first playable spin loop is verified.

## Current Implementation Artifact
- Shared Excel-backed simulator loader: `tools/slot_rtp_runtime_data.cjs`
- Pure Lua simulator module for handoff/reference: `tools/slot_rtp_simulator.lua`
- Local validation runner: `tools/check_slot_rtp_simulator.cjs`
- Weighted candidate runner: `tools/check_slot_rtp_candidates.cjs`
- The simulator uses `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` left-to-right consecutive evaluation from column 1.
- The simulator reads `Enum.xlsx`, `SlotMachine.xlsx`, and `SpinPresentation.xlsx` to match runtime symbols, paylines, paytable, and explicit reel strips.
- Payouts are represented in tenths of Base Bet (`0.4x = 4`, `100.0x = 1000`) to avoid fractional payout drift during RTP calculation.
- Validation status on 2026-07-01: `node tools/check_slot_rtp_simulator.cjs` passed all required validation cases.
- Current explicit reel strip result range: RTP about `70.5%-75.6%`, hit rate about `22%-23%`, multi-line win rate about `2.3%`.
- Lua runtime status: local `lua`/`luajit` executable was not available in PATH, so runtime validation was performed with the paired Node checker that mirrors the Lua logic.
