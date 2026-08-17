# Server-Authoritative Shared Wallet

## Scope

`PlayerWalletComponent` is the single session authority for Common Coin and Premium Coin. Combat drops, slot costs, slot payouts, the top currency HUD, and the slot balance display all use this component. DataStorage persistence, daily recharge, real-money payment, and shop UI are intentionally outside this phase.

The official MSWPackages `resource-package` was evaluated first. It provides a broader resource system with built-in database persistence and recharge behavior, so it was not imported here: both are explicitly outside this phase, while this project also requires scaled slot units, Premium-first atomic payment, and transaction-ID idempotency on the existing combat/slot boundary.

Initial values reuse the slot economy defaults:

- Premium Coin: `9,999`
- Common Coin: `0`
- Internal precision: `10 units = 1 coin`

The component is attached to the player on the server. `CommonCoinUnits`, `PremiumCoinUnits`, `CoinUnitPerCoin`, and `Initialized` use `@TargetUserSync`; clients may read the owning player's synchronized values but have no client mutation API.

## Authority and API

All mutation methods execute in `ServerOnly` space.

| API | Purpose | Result |
|---|---|---|
| `GetBalanceSnapshot()` | Read both balances and unit scale | Read-only table |
| `GetBalanceUnits(currencyKey)` | Read one balance | Integer units |
| `GrantCurrency(currencyKey, amountUnits, transactionId, sourceKey)` | Trusted server grant boundary | Boolean |
| `TrySpendCurrency(currencyKey, amountUnits, transactionId, sourceKey)` | Single-currency future shop debit | Receipt; unchanged on failure |
| `TryPaySlotCost(costUnits, transactionId)` | Atomic Premium-first slot payment | Receipt with Premium/Common split |
| `SettleSlotPayout(payoutUnits, transactionId)` | Common Coin slot payout | Boolean |
| `SettleCombatReward(quantity, transactionId)` | Typed combat Common Coin settlement | Boolean |
| `GetTransactionReceipt(transactionId)` | Idempotent retry/status lookup | Prior receipt or nil |

A receipt reports `transactionId`, `success`, `status`, `currencyKey`, `amountUnits`, `premiumSpentUnits`, `commonSpentUnits`, and `sourceKey`. Reusing an applied or rejected transaction ID never mutates balances again.

For the shop MVP, product validation and inventory delivery must remain server-side. The purchase boundary should validate the product, call `TrySpendCurrency` once with a unique purchase transaction ID, deliver the item only when the receipt succeeds, and keep its own delivery receipt so debit and item delivery can be retried idempotently. Shop code must never assign synchronized balance properties directly.

## Slot Flow

1. The client chooses the existing base-bet tier and multiplier and requests a spin.
2. The server validates the allowed values and rejects reused transaction IDs or an already-pending spin.
3. `TryPaySlotCost` checks the combined balance before mutation, spends Premium Coin first, and spends only the remainder from Common Coin.
4. The existing reel strips, RNG, paylines, bonus rules, and RTP calculation run on the server without changing their tables or presentation rules.
5. The client receives the resolved stops and plays the existing reel/bonus/win presentation.
6. The server settles only its stored payout through `SettleSlotPayout`; duplicate or stale settlement requests are ignored.

An insufficient combined balance produces `REJECTED_INSUFFICIENT_BALANCE`, starts no presentation, and changes neither currency.

## Combat Flow

1. Monster death and drop resolution remain server-authoritative.
2. The pickup visual completes its launch, hold, and flight sequence before calling `CombatRuntime:EnqueueGrants`.
3. `CombatRuntime` snapshots each typed grant and assigns a unique in-session transaction ID.
4. `CombatWalletBridge` drains the batch on the server.
5. `CURRENCY:COMMON_COIN` calls `SettleCombatReward` exactly once; `ITEM` continues through `EquipmentInventoryComponent:GrantItemByKey`.

The bridge has no replicated currency accumulator and never calls `SlotMachineRuntime`.

## UI Contract

`SlotMachineRuntime:RefreshCurrency` reads only the local player's target-synchronized wallet component. It updates the existing Premium and Common text references only when values change, using the existing format templates and `FormatUnits`. No UI resource, hierarchy, anchor, or layout changed in this phase.

## Lifetime and Known Limits

The wallet is session-only. It survives map changes while attached to the player but resets to the configured initial values on a new session. Transaction receipts are also in-memory only. Reconnect persistence and cross-session idempotency require the later DataStorage phase.
