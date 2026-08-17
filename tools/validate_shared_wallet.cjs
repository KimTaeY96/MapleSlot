"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootArg = process.argv.indexOf("--project-root");
const root = rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const wallet = read("RootDesk/MyDesk/Player/PlayerWalletComponent.mlua");
const slot = read("RootDesk/MyDesk/SlotMachine/SlotMachineRuntime.mlua");
const bridge = read("RootDesk/MyDesk/Combat/CombatWalletBridge.mlua");
const combat = read("RootDesk/MyDesk/Combat/CombatRuntime.mlua");
const sandbox = read("RootDesk/MyDesk/Combat/CombatSandboxRuntime.mlua");

assert(wallet.includes("@TargetUserSync property integer CommonCoinUnits"), "Common Coin must target-sync read-only to its owner");
assert(wallet.includes("@TargetUserSync property integer PremiumCoinUnits"), "Premium Coin must target-sync read-only to its owner");
assert(wallet.includes("InitialCommonCoins = 0") && wallet.includes("InitialPremiumCoins = 9999"), "Wallet must reuse existing slot economy defaults");
assert(/@ExecSpace\("ServerOnly"\)\s*method table TryPaySlotCost/.test(wallet), "Slot payment must be server-only");
assert(/@ExecSpace\("ServerOnly"\)\s*method boolean SettleSlotPayout/.test(wallet), "Slot payout must be server-only");
assert(/@ExecSpace\("ServerOnly"\)\s*method boolean SettleCombatReward/.test(wallet), "Combat settlement must be server-only");
assert(wallet.indexOf("math.min(self.PremiumCoinUnits, costUnits)") < wallet.indexOf("costUnits - premiumSpentUnits"), "Slot payment must spend Premium before Common");
assert(wallet.includes("REJECTED_INSUFFICIENT_BALANCE"), "Insufficient balance must return an explicit unchanged-state status");
assert(wallet.includes("ProcessedTransactions") && wallet.includes("Duplicate transaction ignored"), "Wallet grants must be idempotent by transaction ID");
assert(wallet.includes("method table TrySpendCurrency"), "Wallet must expose the future shop spend boundary");

assert(!slot.includes("property integer premiumUnits"), "Slot runtime must not own Premium balance");
assert(!slot.includes("property integer commonUnits"), "Slot runtime must not own Common balance");
assert(!slot.includes("GrantCombatCommonCoins"), "Slot runtime must not expose combat-local balance mutation");
assert(slot.includes("wallet:TryPaySlotCost"), "Slot costs must use the authoritative wallet");
assert(slot.includes("wallet:SettleSlotPayout"), "Slot winnings must use the authoritative wallet");
assert(slot.includes('wallet:GetTransactionReceipt(transactionId .. ":COST")'), "Reused slot transaction IDs must be rejected");
assert(slot.includes("wallet.PremiumCoinUnits") && slot.includes("wallet.CommonCoinUnits"), "Coin UI must read synchronized wallet values");
assert(slot.includes("self:ResolveSpinResult()") && slot.includes("self:EvaluatePaylines(spinResult.grid)"), "Existing reel and payline resolution must remain the outcome source");

assert(!bridge.includes("@Sync property integer EarnedCommonCoins"), "Combat bridge must not replicate a second currency balance");
assert(!bridge.includes("SlotMachineRuntime"), "Combat bridge must not call the slot runtime");
assert(bridge.includes("wallet:SettleCombatReward(reward.quantity, reward.transactionId)"), "Completed Common Coin pickups must settle once into the wallet");
assert(bridge.includes('reward.rewardType == "ITEM"') && bridge.includes("GrantItemByKey"), "Future item rewards must remain on the inventory boundary");
assert(combat.includes('transactionId = "COMBAT:"'), "Combat reward queue must issue transaction IDs");
assert(combat.includes("local queuedGrant = {"), "Combat reward queue must snapshot immutable typed grants");
assert(sandbox.indexOf('AddComponent("PlayerWalletComponent")') < sandbox.indexOf('AddComponent("CombatWalletBridge")'), "Combat runtime must attach wallet before bridge");

console.log("Shared wallet valid: authoritative balances, idempotent transactions, slot settlement, combat settlement, and synchronized UI reads");
