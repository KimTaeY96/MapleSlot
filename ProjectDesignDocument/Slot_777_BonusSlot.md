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
6. The status text uses `GameString.xlsx / GameString[210]` to show the bonus spin count and bonus payout.

## Presentation Scope
This implementation does not add a new framed popup or regenerate the slot UI. It reuses the existing win presentation surface and status text to avoid broad `.ui` churn. A dedicated 777 bonus overlay can be added later once the interaction/visual spec is approved.

## Test-Only Cheat
The 777 result is intentionally rare, so the test sandbox supports a one-shot force path:

- `TestCheatEnabled = true`
- `TestCheatForceTrigger = true`
- `TestCheatForceResultKey = 777`
- `TestCheatUseCount = 1`
- `TestCheatRequiredRuntimeKind = TEST_SANDBOX`

Runtime generation stamps the current runtime kind into `BuildBonusSlotRules()`. The normal generator defaults to `RELEASE`; the test sandbox wrapper sets `MSW_SLOT_RUNTIME_KIND=TEST_SANDBOX` before importing the generator. The cheat is allowed only when that generated runtime kind matches `TestCheatRequiredRuntimeKind`. Simulator code also defaults to `RELEASE`, so RTP checks never include the cheat unless a test explicitly passes `enableTestCheat: true` and `runtimeBuildKind: "TEST_SANDBOX"`.

## Validation Contract
- Runtime must be generated from `SlotMachine.xlsx`, not `Core.xlsx`.
- RTP simulator must include 777 bonus payouts through the same data tables.
- UI layer validation must assert the 777 data, trigger, and runtime flow are present.
- Validation must assert the 777 cheat is guarded to `TEST_SANDBOX` and consumes its data-driven use count.
