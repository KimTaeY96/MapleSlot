# Slot 777 Bonus Slot

## Goal
Add a dopamine-focused 777 bonus slot that triggers from the existing 3x5 slot without changing the base reel UI contract.

## Trigger
The bonus slot triggers when a payline resolves as `WILD x5`.

Current data defaults:

| Field | Value |
|---|---:|
| RequiredSymbolId | WILD |
| RequiredMatchCount | 5 |
| MinTriggerLineCount | 1 |
| InitialChanceCount | 5 |
| ReelCount | 3 |
| RequiredSameCount | 3 |
| DigitMin | 1 |
| DigitMax | 7 |
| MaxTotalSpinCount | 25 |
| TestCheatUseCount | 1 |
| TestCheatRequiredRuntimeKind | TEST_SANDBOX |

All of these values live in `SlotMachine.xlsx / BonusSlotRules`.

## Result Rule
The bonus slot rolls 3 numeric reels. A reward is paid only when all 3 digits match.

| Result | Multiplier | Extra Chance |
|---|---:|---:|
| 111 | 111x | 0 |
| 222 | 222x | 0 |
| 333 | 333x | 0 |
| 444 | 444x | 0 |
| 555 | 555x | 0 |
| 666 | 666x | 0 |
| 777 | 777x | 1 |

These values live in `SlotMachine.xlsx / BonusSlotPaytable`. `RollWeight` is also data-driven so the 1~7 digit distribution can be tuned later without code changes.

## Runtime Flow
1. `EvaluatePaylines` still evaluates the 3 horizontal lines.
2. A `WILD x5` line does not receive the normal Wild payline payout, but it is included in line wins for highlight/presentation and increments `bonusSlotTriggerLineCount`.
3. After paylines resolve, `ApplyBonusSlotResult` runs the 777 bonus when the trigger count meets `MinTriggerLineCount`.
4. The bonus consumes `InitialChanceCount` chances and grants additional chances from `BonusSlotPaytable.ExtraChanceCount`.
5. The accumulated bonus payout is added to the same spin result payout.
6. After the base 3x5 reels stop, `PlayBonus777Presentation` opens the dedicated 777 overlay and plays each bonus roll once.
7. The status text still uses `GameString.xlsx / GameString[210]` to summarize the bonus spin count and bonus payout.

## Presentation Scope
The 777 bonus uses the existing hidden overlay, `Panel_Bonus777_Hidden`, instead of creating a second standalone classic-slot feature. The overlay presentation is a resource replacement of the existing 777 bonus flow: it uses the generated classic slot frame/arch/base/lever slices, while keeping the existing `BonusSlotRules`, `BonusSlotPaytable`, trigger, cheat, and payout resolver intact.

The three bonus reels are live masked strips, not baked reel-strip images. Each reel has 11 digit cells: 7 logical stops (`1..7`) plus 2 wrap-buffer cells above and 2 below. The result is still decided before the presentation starts; the strips animate and then snap to the pre-decided digits. The right lever is cosmetic only and moves during the reel spin without affecting RNG, result selection, chance count, or payout.

This keeps the base 3x5 slot UI contract intact while making the Wild x5 bonus visibly distinct. Future art can replace the current classic-slot slices without changing the bonus data tables or resolver contract.

## Test-Only Cheat
The 777 result is intentionally rare, so the test sandbox supports a session-only force path through the development cheat UI.

- Long-press the top-right `...` development button in `TEST_SANDBOX`.
- Enter a code from `Cheat.xlsx / CheatCommands` in the input field, or tap a command row to copy that code into the input field.
- The default code is `777`.
- `CheatType = FORCE_777_BONUS_ONCE`.
- The next spin result is forced to a visible Wild x5 payline, which enters the 777 bonus slot through the normal payline resolver.
- `ForceResultKey = 777` then forces the first 777 bonus reel result.
- `UseCount = 1`.
- `RequiredRuntimeKind = TEST_SANDBOX`.

`BonusSlotRules` still carries the low-level force fields used by the resolver, but runtime starts with `bonusSlotTestCheatRemaining = 0`. Submitting a valid `CheatCommands` code grants the configured session use count for the current play only. Runtime generation stamps the current runtime kind into `BuildBonusSlotRules()`. The normal generator defaults to `RELEASE`; the test sandbox wrapper sets `MSW_SLOT_RUNTIME_KIND=TEST_SANDBOX` before importing the generator. The cheat UI and command application are allowed only when the generated runtime kind is `TEST_SANDBOX`. Simulator code also defaults to `RELEASE`, so RTP checks never include the cheat unless a test explicitly passes `enableTestCheat: true`, applies the forced Wild x5 grid, and uses `runtimeBuildKind: "TEST_SANDBOX"`.

## Validation Contract
- Runtime must be generated from `SlotMachine.xlsx`, not `Core.xlsx`.
- RTP simulator must include 777 bonus payouts through the same data tables.
- UI layer validation must assert the 777 data, trigger, dedicated overlay, classic resource bindings, live masked digit strips, and runtime presentation flow are present.
- Validation must assert the 777 cheat is guarded to `TEST_SANDBOX` and consumes its data-driven use count.
