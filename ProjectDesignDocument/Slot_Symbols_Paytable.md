# Slot Symbols and Paytable Spec

## Purpose
Define the initial 3x5 visual slot symbol hierarchy, horizontal paylines, and Base Bet Level 1 payout table. This document is the handoff for the Design agent and the later probability simulation harness.

## Feature Scope
- In: Five basic symbols, rarity hierarchy, 3 fixed horizontal paylines for a 3-row x 5-column reel window, Base Bet Level 1 payout multipliers, RTP risk notes.
- Out: Final reel strip weights, jackpot animation, paid-currency tuning, pity systems, long-term economy balancing.

## Grid Convention
This spec treats the slot viewer as **3 rows x 5 columns**.

```text
R1C1 R1C2 R1C3 R1C4 R1C5
R2C1 R2C2 R2C3 R2C4 R2C5
R3C1 R3C2 R3C3 R3C4 R3C5
```

P0.5 evaluates the 3 horizontal rows only. Diagonal, V-shaped, scatter, and ways-style evaluations are reserved for P1 or later.

## Symbol Hierarchy
| Rank | Symbol ID | Display Name | Theme Role | Intended Rarity |
|---:|---|---|---|---|
| 1 | `SLIME` | Slime | Common monster icon | Very common |
| 2 | `MUSHROOM` | Mushroom | Early RPG monster icon | Common |
| 3 | `PIG` | Ribbon Pig | Mid-tier monster icon | Uncommon |
| 4 | `GOLEM` | Stone Golem | Heavy monster icon | Rare |
| 5 | `PINK_BEAN` | Pink Bean | Jackpot boss monster icon | Very rare |

## Current Symbol Data Contract
The prototype now keeps symbol visuals and win animation keys table-driven. The runtime still uses local table builders until the later Excel import pipeline is wired, but the same values are exported to `ExcelTable/SlotMachine.xlsx` and `ExcelTable/SpinPresentation.xlsx`.

| Symbol ID | Default Idle Resource RUID | Default Win Animation RUID | Win Animation |
|---|---|---|---|
| `SLIME` | `a8f43ecd71084c14aab092cf23406235` | `a8f43ecd71084c14aab092cf23406235` | `BOUNCE` |
| `MUSHROOM` | `c61cc1debb2a4f27b19b46bc32f34426` | `c61cc1debb2a4f27b19b46bc32f34426` | `POP` |
| `PIG` | `ed6b1a230f7d4e079f5db8dfa50f5468` | `ed6b1a230f7d4e079f5db8dfa50f5468` | `WOBBLE` |
| `GOLEM` | `af728bc3f10641efb84f31edcd3506a7` | `af728bc3f10641efb84f31edcd3506a7` | `SHAKE` |
| `PINK_BEAN` | `00b055cd1b1141f9bee48a4e9ce0534c` | `00b055cd1b1141f9bee48a4e9ce0534c` | `FLASH` |

### Excel Table Mapping
- `SlotMachine.xlsx / SlotSymbols`: owns each symbol's default `SymbolResourceRuid`, default `WinAnimationRuid`, and `WinAnimationEnumId`.
- `SpinPresentation.xlsx / ReelStrips`: owns cell-level reel stop data grouped by `BaseBetRegionIndex`. Each row can override `IdleSpriteRuid` and `WinAnimationRuid` per BaseBet type, reel, and stop index.
- `Enum.xlsx / Enums`: includes `SymbolWinAnimation` values `BOUNCE`, `POP`, `WOBBLE`, `SHAKE`, and `FLASH`.
- `ProjectDesignDocument/Slot_Resource_Table_Input_Prompt.md`: prompt for finding MSW sprite or animationclip RUIDs and filling the cell-level resource table.

### BaseBet-Specific Reel Strip Contract
BaseBet type is treated as the selected region/town. Each BaseBet region owns a complete reel strip set:

```text
ReelStrips[BaseBetRegionIndex][ReelNo][StopIndex] -> SymbolEnumId
```

Required table shape:

- `BaseBetRegionIndex`: references `SlotMachine.xlsx / BaseBetRegions`.
- `ReelNo`: 1 to 5.
- `StopIndex`: 1 to 30 per reel.
- Total row count: `BaseBet region count * 5 reels * 30 stops`.
- `IdleSpriteRuid`: normal reel-cell resource.
- `WinAnimationRuid`: animationclip resource used when this exact cell is part of a winning line.

## Paylines
Use 3 fixed horizontal paylines for P0.5. This gives the 3x5 visual surface real gameplay meaning while avoiding diagonal and V-shaped complexity before P1.

| Payline ID | Cells | Description |
|---|---|---|
| `TOP_LINE` | R1C1-R1C2-R1C3-R1C4-R1C5 | Top horizontal row |
| `MAIN_LINE` | R2C1-R2C2-R2C3-R2C4-R2C5 | Center horizontal row |
| `BOTTOM_LINE` | R3C1-R3C2-R3C3-R3C4-R3C5 | Bottom horizontal row |

## Active Payline Cost Rule
Spin cost is paid once per spin. It does **not** multiply by the active payline count:

```text
spinCost = BaseBet * Multiplier
```

Each winning line still pays from the single-line base:

```text
linePayout = BaseBet * Multiplier * paytableMultiplier
```

The 3 horizontal paylines increase the number of evaluated win opportunities, but they do not make the user spend 3x coins. RTP must be balanced through reel strips and paytable values under this single-spin-cost rule.

## Base Bet Level 1 Payout Multipliers
Payouts are expressed as a multiplier of Base Bet Level 1 cost before the user-selected multiplier is applied.

## Payline Evaluation Rule
For the current design pass, a payline win is counted only when matching symbols are **left-to-right consecutive starting at column 1**.

- `3 of a kind` means columns 1-3 match on the evaluated payline, and column 4 is different.
- `4 of a kind` means columns 1-4 match on the evaluated payline, and column 5 is different.
- `5 of a kind` means columns 1-5 match on the evaluated payline.
- Only the best matching length pays on a payline. A 5-symbol match does not also pay the 3-symbol and 4-symbol prizes.
- Non-consecutive matches, center-start matches, right-to-left matches, and multiple window matches on the same payline are not part of this table.
- `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` are evaluated per spin.
- Multiple horizontal lines can pay on the same spin.
- Diagonal and V-shaped lines do not pay before P1.
- `WILD` substitutes for the first non-Wild symbol in the left-to-right run. Example: `WILD, WILD, SLIME` pays as a `SLIME x3` line.
- All-Wild-only lines do not pay yet; add a dedicated Wild paytable row before enabling that behavior.

## P0 Expansion Contract
- Symbol IDs must be enum-backed data, not hardcoded display text.
- Reel strips must support per-reel weighted stop data before production balancing.
- Payline definitions must be table-driven.
- Wild is enabled as a substitute symbol in the Phase1 slice. Scatter, Free Spin, Bonus Wheel, and Jackpot symbols remain future modules and must not require changing the core result object shape.

| Combination | SLIME | MUSHROOM | PIG | GOLEM | PINK_BEAN | WILD |
|---|---:|---:|---:|---:|---:|---:|
| 3 of a kind on a payline | 0.4x | 0.6x | 1.0x | 1.8x | 4.0x | Substitute only |
| 4 of a kind on a payline | 1.2x | 1.8x | 3.0x | 6.0x | 15.0x | Substitute only |
| 5 of a kind on a payline | 4.0x | 7.0x | 12.0x | 30.0x | 100.0x | Substitute only |

## RTP Guardrails
- The final RTP must remain **strictly below 100%** after reel weights, paylines, multiplier behavior, and bonus effects are combined.
- Multiplier must scale both cost and payout equally, so multiplier alone should not change RTP.
- Premium Coin and Common Coin spins must share the same payout math unless a later monetization document explicitly defines different tables.
- Before implementation, Script Dev must create a pure Lua probability simulator and verify estimated RTP under chosen reel weights.
- Fractional payout multipliers require an integer-unit policy before implementation. Either Base Bet Level 1 cost must be divisible enough to pay values such as `0.4x`, or payouts must be represented in scaled integer units to avoid rounding abuse.
- This table is not approved for production script integration until the Lua simulator verifies RTP under the final reel-weight model.

## Design Risks to Review
- Common Coin can both fund spins and buy items, so slot payouts can destabilize progression if hunting income and shop pricing are not tuned together.
- Base Bet tier lock can feel punitive if users accidentally select the wrong tier; UI must clearly confirm or show lock consequences before switching.
- The 100x `PINK_BEAN` five-of-kind payout is intentionally aspirational and must be controlled through rarity weights before release.
- Treat `Slot_RTP_Simulator_Handoff.md` as the focused Script Dev handoff for simulator assumptions, RTP risks, and validation cases.
