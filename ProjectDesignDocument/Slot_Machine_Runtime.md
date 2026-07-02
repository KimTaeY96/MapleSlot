# Slot Machine Runtime Spec

## Purpose
Define the Phase 1 slot machine runtime logic, economy mutation rules, UI binding contract, and presentation sequence before production MSW script implementation.

## Authoritative Inputs
| Document | Use |
|---|---|
| `ProjectDirection.md` | Core loop, currency roles, Base Bet / Multiplier intent. |
| `Slot_Symbols_Paytable.md` | Symbol IDs, center-row payline, payout table. |
| `Slot_RTP_Simulator_Handoff.md` | RTP risks, simulator contract, validation cases. |
| `UI_Canvas_TestSandbox_Assembly.md` | UI node names and binding surface. |
| `C:\Users\ghddj\Downloads\slot_machine_logic_reference.md` | Reference only. Do not copy into official docs. |

## Runtime Principle
The spin result is fully determined when the player presses `Button_Spin`.

Reel animation is presentation only. It must land on the precomputed result and must never decide, alter, reroll, or repair a payout.

## Phase 1 Test Data
| Field | Value |
|---|---|
| Base Bet values | `1` through `10` |
| Multiplier values | `x1` through `x5` |
| Initial Premium Coin on play test start | `9999` |
| Initial Common Coin on play test start | `0` unless another test setup overrides it |
| Spin cost | `BaseBet * Multiplier` |
| Payout currency | Common Coin only |
| First probability model | Equal 20% symbol chance per symbol, matching the safe center-row simulator baseline |

## P0 Economy Replenishment Direction
Premium Coin is the first-consumed slot operating currency, but it is not treated as cash-only in the prototype economy.

Approved free replenishment loop:
1. Grant a fixed amount of Premium Coin every day at UTC 00:00.
2. Generate a small amount of Premium Coin every minute through the later idle RPG system.
3. Spend Premium Coin before Common Coin whenever a spin starts.
4. Pay all slot winnings as Common Coin only.

Production follow-up:
- Define the daily grant amount, per-minute generation amount, offline accumulation behavior, cap, and anti-clock-abuse policy in data before persistence work.
- If real-money purchase is added later, separate it into a monetization spec and keep it out of the P0 free-economy contract.

## Base Bet Selection UI
Base Bet must open as a scrollable upward list from `Dropdown_BaseBet`, not as repeated permanent buttons.

List item display format uses a data-driven string template:

```text
BASE_BET_LABEL = "{0} - {1}코인"
{0} = RegionName
{1} = BetCoins
```

This project calls this pattern **포맷 스트링**. It is also known as a format string, string template, or parameterized localization string. `BaseBetRegions.DisplayTemplateKey` should reference `UI.xlsx/StringTemplates.TemplateKey`.

Additional current format string keys:

```text
MULTIPLIER_LABEL = "x{0}"
PREMIUM_AMOUNT = "Premium {0}"
COMMON_AMOUNT = "Common {0}"
WIN_STATUS = "Win {0} lines +{1}"
BASE_BET_CONFIRM_LOCK = "Apply new Base Bet? Lock starts for {0}."
```

Initial test catalog:

| Base Bet | Display Label |
|---:|---|
| 1 | 헤네시스 - 1코인 |
| 2 | 엘리니아 - 2코인 |
| 3 | 페리온 - 3코인 |
| 4 | 커닝시티 - 4코인 |
| 5 | 리스항구 - 5코인 |
| 6 | 슬리피우드 - 6코인 |
| 7 | 오르비스 - 7코인 |
| 8 | 루디브리엄 - 8코인 |
| 9 | 아쿠아리움 - 9코인 |
| 10 | 리프레 - 10코인 |

The labels are test data. Later production tiers can change region names, amounts, and count without changing the dropdown pattern.

## Currency Precision
Base Bet values shown to the player remain literal coin amounts: Base Bet `1` means staking `1` coin before multiplier.

Because the current paytable contains fractional multipliers such as `0.4x`, `0.6x`, and `1.8x`, runtime math must not use floating point or ad hoc rounding.

Use scaled integer currency units:

```text
1 displayed coin = 10 internal coin units
0.1 displayed coin = 1 internal coin unit
```

Examples:

```text
BaseBet 1, Multiplier x1, SLIME 3-of-kind 0.4x
costUnits = 1 * 1 * 10 = 10
payoutUnits = 1 * 1 * 4 = 4
display payout = 0.4 Common Coin
```

```text
BaseBet 10, Multiplier x5, DRAGON 5-of-kind 100.0x
costUnits = 10 * 5 * 10 = 500
payoutUnits = 10 * 5 * 1000 = 50000
display payout = 5000 Common Coin
```

Display rule:
- Show whole numbers without `.0`.
- Show one decimal digit only when the internal unit is not divisible by 10.

If Common Coin must later become integer-only, the paytable must be retuned or Base Bet increments must be constrained before production economy approval.

## Spend And Reward Rules
1. Calculate spin cost as `BaseBet * Multiplier`.
2. Convert cost to internal units.
3. Spend Premium Coin first.
4. If Premium Coin is insufficient, spend all remaining Premium Coin and pay the rest from Common Coin.
5. If total Premium + Common balance is below cost, reject the spin and keep the state at `IDLE`.
6. Resolve the spin result immediately after successful cost deduction.
7. Apply all slot winnings as Common Coin only.
8. Premium Coin is never paid out by the slot machine.

## P0 Server Authority Direction
The current prototype may run locally for fast iteration, but production-facing slot resolution must move toward authoritative logic.

Authoritative responsibilities:
- Validate current balances and selected Base Bet / Multiplier.
- Deduct spin cost atomically using Premium Coin first and Common Coin second.
- Select reel stop indexes from data-driven reel strips or weighted stop tables.
- Evaluate enabled paylines from data.
- Grant Common Coin reward atomically.
- Return a presentation-safe `SpinResult` to the client.

Client responsibilities:
- Send spin request and selected options.
- Animate reels to the returned stop indexes.
- Display deduction, win highlights, and count-up presentation.
- Never reroll, repair, or locally override the authoritative result.

## Spin State Machine
| State | Responsibility | Input Allowed |
|---|---|---|
| `IDLE` | Controls are available. HUD reflects current balances, Base Bet, and Multiplier. | Base Bet, Multiplier, Spin |
| `BET_DEDUCT` | Validate and deduct spin cost with Premium-first priority. | None |
| `OUTCOME_RESOLVE` | Select RNG result, construct grid, evaluate paylines, calculate payout. | None |
| `SPINNING` | Start downward reel-strip scrolling using non-authoritative intermediate strip positions. | Quick stop only |
| `STOPPING` | Stop columns left-to-right on the predetermined grid. | Quick stop only |
| `PRESENTING` | Highlight wins and count up Common Coin payout. | Skip presentation later if implemented |
| `REWARD_APPLY` | Credit final Common Coin payout and unlock controls. | None |

Quick stop is approved for the architecture but may be implemented after the first working spin if the MSW UI binding cost is high. Quick stop must shorten timing only; it must not change stops, grid, payouts, or RNG calls.

## Result Model
The logic layer returns a presentation-safe result object:

```text
SpinResult
  baseBet
  multiplier
  costUnits
  premiumSpentUnits
  commonSpentUnits
  stopIndexes[5]
  row[5]
  grid[3][5]
  spinCostIncludesActivePaylineCount = false
  lineWins[]
    lineId
    symbolId
    matchCount
    cells[]
    payoutUnits
  totalPayoutUnits
```

## Payline Evaluation
The slot visually shows a 3-row x 5-column reel window:

```text
R1C1 R1C2 R1C3 R1C4 R1C5
R2C1 R2C2 R2C3 R2C4 R2C5
R3C1 R3C2 R3C3 R3C4 R3C5
```

Evaluate exactly 3 fixed horizontal paylines:

| Payline ID | Cells |
|---|---|
| `TOP_LINE` | R1C1-R1C2-R1C3-R1C4-R1C5 |
| `MAIN_LINE` | R2C1-R2C2-R2C3-R2C4-R2C5 |
| `BOTTOM_LINE` | R3C1-R3C2-R3C3-R3C4-R3C5 |

Rules:
- A win must be consecutive from the first cell of the payline.
- `3`, `4`, or `5` matching cells can pay.
- A broken chain pays nothing beyond the matched prefix.
- A line pays only the best single match length.
- Multiple horizontal lines can pay on the same spin.
- Spin cost is paid once per spin as `BaseBet * Multiplier`, while each active line payout uses the single-line BaseBet x Multiplier payout basis.
- `WILD` is enabled in the Phase1 runtime as a substitute-only symbol for left-to-right horizontal payline evaluation.
- Diagonal, V-shaped, Scatter, Free Spin, bonus triggers, and payout caps remain out of the current runtime scope.

## Reel Result Model
Phase 1 uses explicit reel-strip stops and real UI reel-strip movement.

The production-facing implementation should keep the data shape compatible with physical reel strips:

```text
reelStrips[5] = {
  { "SLIME", "MUSHROOM", ... },
  ...
}
stopIndex[col] = RandomInt(1, #reelStrips[col])
row[col] = reelStrips[col][stopIndex[col]]
```

The current test implementation uses 30 UI cells per reel. Each reel has one masked viewport and one actual 30-cell strip entity. During Spin, the strip entity moves downward by changing `UITransformComponent.anchoredPosition`; when it passes the end of the strip, its position wraps back by one strip height so the first cells continue seamlessly.

## Reel Strip Presentation Model
The current random text flicker is no longer the target presentation. Each of the 5 reels should be treated as a vertical strip that moves downward rapidly and loops seamlessly.

Outcome-first rule still applies:
1. Spin input deducts cost.
2. RNG immediately selects each reel's target stop index.
3. Payout is calculated from those final symbols.
4. Reel strips animate only to reveal the already-decided result.

Spin timing should feel varied, not mathematically identical on every press. Choose one spin profile first, then calculate each reel's stop time and strip speed from that profile.

Spin profiles:

| Profile | Weight | Overall Feel | First Reel Base Time | Stagger Range |
|---|---:|---|---:|---:|
| `NORMAL` | `70%` | Standard spin rhythm. | `1.55~1.90s` | `0.18~0.36s` |
| `QUICK` | `20%` | Snappier short spin. | `1.25~1.55s` | `0.14~0.28s` |
| `TENSION` | `10%` | Longer suspenseful spin. | `1.85~2.30s` | `0.26~0.55s` |

Timing fields:

| Field | Meaning | Initial Test Value |
|---|---|---:|
| `profileWeights` | Weighted spin timing profile selection. | `NORMAL 70 / QUICK 20 / TENSION 10` |
| `firstReelTimeRange` | Random stop time range for Reel 1, based on selected profile. | See profile table |
| `staggerRange` | Random added stop delay between adjacent reels. | See profile table |
| `minCellsPerSecond` | Lowest acceptable strip speed. | `18` |
| `maxCellsPerSecond` | Highest acceptable strip speed before reducing loops or extending time. | `42` |
| `extraLoopMin` | Minimum full strip loops before stopping. | `2` |
| `extraLoopRandom` | Additional random loops to reduce sameness. | `0~2` |
| `accelerateSeconds` | Initial ramp-up time. | `0.15~0.25` |
| `decelerateSeconds` | Final slow-down time before snap. | `0.35~0.55` |
| `settleBounceSeconds` | Small final snap/bounce time. | `0.08~0.14` |

Stop-time calculation:

```text
profile = weightedRandom(NORMAL, QUICK, TENSION)
stopTime[1] = random(profile.firstReelMin, profile.firstReelMax)

for reelIndex = 2..5:
    stopTime[reelIndex] = stopTime[reelIndex - 1] + random(profile.staggerMin, profile.staggerMax)
```

This guarantees left-to-right stopping while still making the exact rhythm vary on every spin.

Speed calculation per reel:

```text
baseDistance = circularDistance(currentVisualIndex, targetStopIndex, stripLength)
extraLoops = extraLoopMin + randomInt(0, extraLoopRandom)
distanceCells = baseDistance + stripLength * extraLoops
cellsPerSecond = distanceCells / stopTime
```

If `cellsPerSecond < minCellsPerSecond`, increase `extraLoops` until the minimum speed is satisfied. If `cellsPerSecond > maxCellsPerSecond`, first try reducing random extra loops; if still too fast, extend that reel's `stopTime` slightly while preserving the left-to-right stop order.

The goal is not to make speed numerically random for its own sake. The goal is to make the stop rhythm, loop count, and speed combination feel slightly different on every spin while always landing on the precomputed target stop index.

Stop order:
- Reels must stop from left to right: `C1 -> C2 -> C3 -> C4 -> C5`.
- Later reels can continue spinning while earlier reels are already locked.
- Quick stop, if added later, compresses remaining stop times but must not change target stop indexes.

## Presentation Requirements
The first playable presentation should approximate a modern 5-reel slot:

1. On Spin click, disable Base Bet and Multiplier controls.
2. Deduct cost immediately and update the HUD.
3. Animate each reel as an actual 30-cell UI strip moving downward behind a 3-cell visible mask, not as random text replacement.
4. Stop reels column-by-column from left to right.
5. Each column should decelerate, snap to the target stop index, and briefly bounce when MSW UI scripting allows it.
6. Once all reels stop, reveal the exact predetermined center-row result inside the 3x5 reel window.
7. If no win, pause briefly and return to `IDLE`.
8. If there are wins, sum all horizontal line wins, highlight the winning columns/lines as supported by the current UI, then count up the Common Coin payout.
9. Credit the final payout and unlock controls.

Acceptable Phase 1 simplification:
- If per-cell bounce or line drawing is expensive in the current UI system, implement symbol cycling, sequential stops, and winning-cell color/highlight first.

## UI Binding Contract
| Runtime Value / Action | UI Node |
|---|---|
| Premium Coin display | `Text_PremiumCoinAmount` |
| Common Coin display | `Text_CommonCoinAmount` |
| Base Bet current value | `Text_BaseBetValue` |
| Base Bet dropdown open / selection | `Dropdown_BaseBet` |
| Base Bet lock display | `Text_BaseBetLockTimer` |
| Multiplier selection | `Button_Multiplier_x1` through `Button_Multiplier_x5` |
| Spin click / state | `Button_Spin` |
| Slot symbols | Visible 3x5 reel window; `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` are payout rows |
| Win highlight | Prefer existing reel cell visual state first; add dedicated highlight nodes only if required. |

## Multiplier Visual State
Multiplier buttons must communicate selection clearly:

| State | Visual |
|---|---|
| Selected multiplier | Blue active color, normal opacity, readable text |
| Unselected multipliers | Gray dimmed color, lower visual priority |
| Spin resolving | All multiplier buttons disabled; selected state remains visible |

## Director Routing
| Director | Receives | Must Produce |
|---|---|---|
| 기획 디렉터 | `Slot_Machine_Runtime.md`, `Slot_Symbols_Paytable.md`, `Slot_RTP_Simulator_Handoff.md` | RTP target, final reel weight candidates, later Wild/Scatter/bonus scope. |
| 테크 디렉터 | `Slot_Machine_Runtime.md`, `Slot_RTP_Simulator_Handoff.md`, `UI_Canvas_TestSandbox_Assembly.md` | Runtime state machine, coin math, spin result logic, UI binding, tests. |
| 아트 디렉터 | `Slot_Machine_Runtime.md`, `UI_Canvas_TestSandbox_Assembly.md` | Reel presentation states, symbol visual pass, highlight/count-up polish if UI assets need changes. |

## Acceptance Criteria
- Play test starts with Premium Coin `9999`.
- Base Bet dropdown supports values `1` through `10`.
- Multiplier supports `x1` through `x5`.
- Spin cost is deducted immediately with Premium Coin first.
- If Premium Coin is insufficient but Common Coin is sufficient, the remainder is paid from Common Coin.
- If total balance is insufficient, Spin is rejected with no result reroll and no negative balance.
- Spin result is determined before reel animation starts.
- Reels stop left-to-right on the predetermined 3x5 result.
- Three-horizontal-line payout evaluation matches `Slot_Symbols_Paytable.md`.
- Winning payout is credited as Common Coin only.
- Fractional multipliers are represented through scaled integer units, not floating point rounding.
- Multiplier changes both cost and payout equally and does not change RTP.

## Implementation Update - 2026-06-11
- Base Bet is now wired as an upward option list using `Panel_BaseBetList_Above_Hidden` and `Item_BaseBetOption_1..10`.
- Spin result now resolves from explicit 5-reel strips and target stop indexes before presentation starts.
- Reel presentation now uses actual 30-cell UI strip entities per reel, moves them downward through `anchoredPosition`, loops them at strip end, and locks reels left-to-right on the predetermined center-row result.
- Spin timing now selects `NORMAL`, `QUICK`, or `TENSION` profile and derives per-reel stop time and movement speed.
- Multiplier selection now updates selected/unselected button color and text color at runtime.
- Remaining QA risk: Maker play-mode verification is still required because this Codex session exposes MSW document/resource MCP tools, but not direct Maker refresh/play/log tools.

## Implementation Update - 2026-06-14
- Runtime now resolves a full 3x5 result grid from each reel stop index.
- `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` are enabled for P0.5.
- Spin cost is paid once per spin: `BaseBet * Multiplier`.
- `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` are all evaluated for payout, but they do not multiply spin cost.
- Each winning line pays from the single-line `BaseBet * Multiplier` basis, and total payout is the sum of all winning horizontal lines.
- Diagonal and V-shaped paylines remain excluded until P1.
- RTP simulator and Excel export tables were updated to the same 3-horizontal-line data contract.

## Implementation Update - 2026-06-21
- Current user phase naming is now fixed as Phase0 = slot prototype and Phase1 = slot machine deepening.
- Runtime reel-strip and paytable symbol IDs now use the canonical data IDs `SLIME`, `MUSHROOM`, `PIG`, `GOLEM`, and `DRAGON`.
- Short UI labels such as `MUSH` and `DRGN` may remain visual-only in generated UI cells, but must not be used as runtime/economy/simulator data IDs.
- Runtime cost scaling is now `BaseBet * Multiplier`; 3 horizontal paylines affect payout opportunities, not spend amount.
- Runtime prototype tables are now isolated behind `BuildBaseBetOptions`, `BuildReelStrips`, `BuildInitialReelVisualIndex`, `BuildPaytableTenths`, `BuildPaylines`, and `BuildSpinProfiles`.
- Test economy constants now expose `coinUnitPerCoin`, `initialPremiumCoins`, and `initialCommonCoins` properties before later Excel import/persistence work.
- Paylines now set `costCountsAsLine=false`; keep this false while the spin cost policy remains single-cost-per-spin.
- Runtime text output now uses `{0}` style 포맷 스트링 entries through `BuildTextTemplates()` and `FormatTemplate()`. `UI.xlsx/StringTemplates` is the Excel-side source for the same keys.
- UI generation script now keeps canonical reel symbol IDs internally and maps them to short visual labels only when rendering prototype reel cell text.

## Open Decisions Before Production Balance
| Topic | Current Phase 1 Decision | Later Follow-up |
|---|---|---|
| RTP target | Use `Slot_RTP_Candidates.md` as the current Phase1 candidate record. | Decide whether the next pass prioritizes conservative data validation or high-hit feel testing. |
| Reel probability model | Keep implementation swappable between iid and reel strips. | Move to explicit reel strips before production balance. |
| Common Coin precision | Use 0.1 coin internal precision. | Decide whether final Common Coin display/economy remains decimal-capable. |
| Base Bet lock | Keep UI surface ready. | Decide whether 300-second lock is active in test build or bypassed for rapid QA. |
| Quick stop | Architecture approved. | Include in first script pass only if low-risk after base spin works. |
| Diagonal / V-shaped paylines | Excluded from P0.5. | Add as separate P1 feature spec only after 3 horizontal lines are balanced. |
| Wild / Scatter | Excluded. | Add as separate feature spec after Phase 1 runtime is stable. |
| Premium Coin replenishment | Daily UTC 00:00 grant plus idle RPG per-minute generation. | Define amounts, caps, offline rules, and abuse prevention in data. |
| Server authority | Prototype may run local logic. | Move spin cost, RNG, payout, and reward persistence to authoritative logic before production economy testing. |
