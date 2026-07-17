"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { CombatSimulator, createSeededRandom, resolveDropGroup } = require("./combat_simulator_core.cjs");

async function main() {
  const excelArg = process.argv.indexOf("--excel-dir");
  const slotArg = process.argv.indexOf("--slot-machine");
  const excelDir = excelArg >= 0 ? path.resolve(process.argv[excelArg + 1]) : path.resolve("ExcelTable");
  const slotMachinePath = slotArg >= 0 ? path.resolve(process.argv[slotArg + 1]) : path.join(excelDir, "SlotMachine.xlsx");
  const validatorUrl = pathToFileURL(path.join(__dirname, "validate_combat_excel_tables.mjs")).href;
  const { loadAndValidateCombatTables } = await import(validatorUrl);
  const { combat, drop } = await loadAndValidateCombatTables({ excelDir, slotMachinePath });

  const config = combat.CombatConfig[0];
  const player = combat.PlayerStatsProfiles.find((row) => Number(row.PlayerStatsProfilesIndex) === 1);
  const monster = combat.MonsterDefinitions.find((row) => Number(row.MonsterDefinitionsIndex) === 1);
  const activeMonster = combat.MonsterDefinitions.find((row) => Number(row.MonsterDefinitionsIndex) === 2);
  assert(player && monster && activeMonster, "Initial contact and upper active monster data must exist");
  assert.equal(Number(player.AggroRange), 9999, "Player acquisition must cover the whole test map");
  assert.equal(Number(monster.RespawnSeconds), 5, "Tier 1 Slime respawn must use the longer table-backed delay");
  assert.equal(monster.AttackMode, "CONTACT");
  assert.equal(monster.Aggressive, false);
  assert.equal(Number(monster.ContactMoveThroughSeconds), 0.5);
  assert(!monster.AttackAnimationRuid, "Contact-only Slime must not define an active attack animation");
  assert.equal(activeMonster.AttackMode, "ACTIVE");
  assert.equal(activeMonster.Aggressive, true);
  assert(activeMonster.AttackAnimationRuid, "Upper active Slime must define an attack animation");
  const tierSpawns = combat.MonsterSpawnGroups.filter((row) => Number(row.HuntingGroundTierIndex) === 1 && row.Enabled);
  assert.deepEqual(tierSpawns.map((row) => row.LaneKey).sort(), ["CENTER", "LOWER", "UPPER"]);
  assert.equal(Number(tierSpawns.find((row) => row.LaneKey === "UPPER").MonsterDefinitionIndex), 2);
  const tierLadders = combat.CombatLadders.filter((row) => Number(row.HuntingGroundTierIndex) === 1 && row.Enabled);
  assert.deepEqual(tierLadders.map((row) => `${row.LowerLaneKey}>${row.UpperLaneKey}`).sort(), ["CENTER>UPPER", "LOWER>CENTER"]);

  const laneGuard = new CombatSimulator({ config, playerProfile: player, monsterDefinition: monster, drop, random: createSeededRandom(1) });
  const untouchedHp = laneGuard.monsterHp;
  assert.deepEqual(laneGuard.playerAttack("UPPER"), [], "Initial basic attack must not hit the upper lane");
  assert.deepEqual(laneGuard.playerAttack("LOWER"), [], "Initial basic attack must not hit the lower lane");
  assert.equal(laneGuard.monsterHp, untouchedHp, "Off-lane attacks must not change monster HP");

  const simulator = new CombatSimulator({ config, playerProfile: player, monsterDefinition: monster, drop, random: createSeededRandom(777) });
  assert.deepEqual(simulator.playerAttack(), []);
  assert.deepEqual(simulator.playerAttack(), []);
  const grants = simulator.playerAttack();
  assert.equal(grants.length, 1, "Slime death must resolve exactly one initial drop entry");
  assert.equal(grants[0].rewardType, "CURRENCY");
  assert.equal(grants[0].rewardKey, "COMMON_COIN");
  assert(grants[0].quantity >= 1 && grants[0].quantity <= 3);
  assert.deepEqual(simulator.playerAttack(), [], "Repeated attacks after death must not duplicate drops");
  assert.equal(simulator.grants.length, 1, "Monster death must be idempotent");

  const observedQuantities = new Set();
  for (let seed = 1; seed <= 64; seed += 1) {
    const [grant] = resolveDropGroup(drop, monster.DropGroupId, createSeededRandom(seed));
    assert(grant.quantity >= 1 && grant.quantity <= 3);
    observedQuantities.add(grant.quantity);
  }
  assert(observedQuantities.size > 1, "Configured Slime quantity range must produce variable rewards");

  assert.equal(simulator.damagePlayer(Number(player.MaxHp)), true);
  assert.equal(simulator.playerState, "DEAD_WAIT");
  assert.equal(simulator.advance(299.999), false, "Player must not revive before 300 seconds");
  assert.equal(simulator.playerHp, 0);
  assert.equal(simulator.advance(0.001), true, "Player must revive at the configured boundary");
  assert.equal(simulator.playerHp, Number(player.MaxHp));
  assert.equal(simulator.playerState, "ACQUIRE");

  const futureItemDrop = {
    DropGroups: [{ DropGroupId: "FUTURE_ITEM", RollMode: "INDEPENDENT", RollCount: 1, EmptyResultAllowed: true, Enabled: true }],
    DropEntries: [{ DropEntriesIndex: 99, DropGroupId: "FUTURE_ITEM", RewardType: "ITEM", RewardKey: "FUTURE_ITEM_KEY", MinQuantity: 1, MaxQuantity: 1, ChancePermille: 1000, Enabled: true }],
  };
  const [futureGrant] = resolveDropGroup(futureItemDrop, "FUTURE_ITEM", createSeededRandom(1));
  assert.deepEqual(futureGrant, {
    rewardType: "ITEM",
    rewardKey: "FUTURE_ITEM_KEY",
    quantity: 1,
    sourceDropGroupId: "FUTURE_ITEM",
    sourceEntryIndex: 99,
  });

  console.log(`Combat simulator valid: three lanes, two ladders, respawn=${monster.RespawnSeconds}s, Slime drops=${[...observedQuantities].sort().join(",")}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
