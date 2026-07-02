# Slot Win Presentation

## Purpose
Define the Phase1 win presentation hook surface for the current slot machine UI and runtime.

This document is for the 아트 디렉터 UI lane and 테크 디렉터. It should be used only after the slot runtime result contract is stable.

## Current Runtime Surface
| Runtime Data | Source | Current Use |
|---|---|---|
| `lineWins[]` | `EvaluatePaylines(grid)` | Stores winning `lineId`, `rowIndex`, payout `symbol`, matched `cells`, `runLength`, and `payoutUnits`. |
| `winLineCount` | `EvaluatePaylines(grid)` | Kept as metadata; visible result now uses per-line icon + formula fragments. |
| `maxRunLength` | `EvaluatePaylines(grid)` | Kept as result metadata and fallback summary; row-aware presentation now reads `lineWins[]`. |
| `payoutUnits` | `EvaluatePaylines(grid)` | Added to Common Coin after reel presentation. |
| `slotSymbols[symbolId].resourcePath` | `BuildSlotSymbols()` | Runtime symbol resource mapping used by the UI generator and win overlays. |
| `slotSymbols[symbolId].winAnimation` | `BuildSlotSymbols()` | Selects the symbol-specific win animation key. |
| `slotSymbols[symbolId].isWild` | `BuildSlotSymbols()` | Marks substitute symbols for left-to-right line evaluation. |

## Current UI Nodes
| Node | Role | Limitation |
|---|---|---|
| `WinHighlight_C1..C5` | Column-level highlight overlay | Still used as broad column emphasis for winning columns. |
| `WinCellVFX_R1_C1..R3_C5` | Row-aware VFX holder per visible cell | Prototype VFX uses glow and small spark sprites; can be replaced with richer particle/effect assets later. |
| `WinSymbol_R{row}_C{col}_{symbol}` | Symbol-specific win overlay per visible cell | Runs scale/alpha animation based on the winning symbol's `winAnimation`. |
| `Panel_WinResult` | Icon + formula result strip above the Spin button | Shows only winning lines as `{symbol icon} x{count} {line payout}` plus `= {total}`. |
| `Text_SlotStatus` | Text summary for errors and neutral spin state | No longer used for normal win formulas. |
| `Text_CommonCoinAmount` | Final balance display | No count-up tween yet. |
| `Button_Spin` | Spin input and disabled state | No quick-stop or skip-presentation input yet. |

## Phase1 Hook Direction
| Hook | Data Needed | First Implementation |
|---|---|---|
| Winning line highlight | `lineWins[].lineId`, `rowIndex`, `runLength` | Implemented through per-cell `WinCellVFX_R{row}_C{col}` holders. |
| Winning column pulse | `lineWins[].runLength` | Current `WinHighlight_C1..C5` remains as a broad fallback. |
| Symbol-specific win animation | `lineWins[].cells[]`, `slotSymbols[symbol].winAnimation` | Implemented with symbol overlays. Wild cells animate as Wild while the payout formula uses the substituted target symbol. |
| Win result formula | `lineWins[].symbol`, `runLength`, `payoutUnits`, total `payoutUnits` | Implemented through `Panel_WinResult`; GameString keys 208 and 209 own the format strings. |
| Payout count-up | `payoutUnits`, starting Common Coin, ending Common Coin | Count text from previous balance to final balance after reels stop. |
| Big win trigger | payout multiple or payoutUnits / spin cost | Trigger only text/glow first; imagegen effect assets can come later. |
| Jackpot-ready trigger | 5-of-kind high-tier symbol or high payout multiple | Stub event only; do not add jackpot reward logic yet. |

## Recommended UI Additions
| Node | Purpose | Priority |
|---|---|---|
| `WinCellVFX_R1_C1..R3_C5` | Row and cell-specific winning-cell VFX | Implemented |
| `WinSymbol_R{row}_C{col}_{symbol}` | Symbol-specific overlay that can animate independent of the spinning reel sprite | Implemented |
| `Text_PayoutCountUp` | Temporary payout count-up near slot status or coin HUD | P1 |
| `Panel_BigWinToast_Hidden` | Reusable big-win presentation surface | P1.5 |

## Guardrails
- Do not change RNG, payout, or balances during presentation.
- Presentation may skip or shorten animation later, but must not change the resolved result.
- UI should read from `lineWins` and `payoutUnits`; it must not inspect visible text cells to infer wins.
- Symbol visuals should come from symbol/reel data tables, not hardcoded visible text.
- Keep the integrated slot cabinet image unchanged unless the user explicitly approves a new imagegen pass.

## Acceptance Criteria
- A spin result can describe which lines won without re-evaluating UI cells.
- Current column highlight remains as fallback.
- Next UI pass can add row-aware highlights without changing payout logic.
- Payout count-up can be added as presentation only, after Common Coin final amount is already known.
