"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  CombatSimulator,
  buildSkillHitArea,
  createSeededRandom,
  isPointInsideSkillHitArea,
  resolveDropGroup,
} = require("./combat_simulator_core.cjs");

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
  const playerSkill = combat.SkillInfo.find((row) => Number(row.SkillInfoIndex) === Number(player?.BasicAttackSkillInfoIndex));
  const contactSkill = combat.SkillInfo.find((row) => Number(row.SkillInfoIndex) === Number(monster?.ContactSkillInfoIndex));
  const activeSkill = combat.SkillInfo.find((row) => Number(row.SkillInfoIndex) === Number(activeMonster?.ActiveSkillInfoIndex));
  assert(player && monster && activeMonster, "Initial contact and upper active monster data must exist");
  assert(playerSkill && contactSkill && activeSkill, "Player, contact, and active SkillInfo rows must resolve");
  assert.equal(Number(playerSkill.CooldownSeconds), 0, "Basic attack repeats when its animation completes");
  assert.equal(playerSkill.HitOriginTypeEnumId, "SELF");
  assert.equal(playerSkill.HitShapeTypeEnumId, "RECTANGLE");
  assert.equal(contactSkill.HitShapeTypeEnumId, "CIRCLE");
  assert.equal(Number(player.AggroRange), 9999, "Player acquisition must cover the whole test map");
  assert.equal(Number(player.AttackAnimationDurationSeconds), 0.8);
  assert.equal(Number(player.AttackHitDelaySeconds), 0.35);
  assert.equal(Number(player.HitAnimationDurationSeconds), 0.5);
  assert.equal(Number(player.LadderClimbSpeed), 1, "Player ladder travel must use the table-backed world-units-per-second speed");
  assert.equal(Number(player.LadderExitStandOffset), 0.08, "Player ladder exit must finish above the one-way platform before IDLE");
  assert(Number(player.AttackHitDelaySeconds) < Number(player.AttackAnimationDurationSeconds), "Player hit frame must occur before attack animation completion");
  assert(Number(player.AttackAnimationDurationSeconds) <= Number(player.AttackIntervalSeconds), "Player attack animation must complete before the next attack interval");
  assert.equal(Number(monster.RespawnSeconds), 5, "Tier 1 Slime respawn must use the longer table-backed delay");
  assert.equal(monster.AttackMode, "CONTACT");
  assert.equal(monster.Aggressive, false);
  assert.equal(Number(monster.ContactMoveThroughSeconds), 0.5);
  assert(!monster.AttackAnimationRuid, "Contact-only Slime must not define an active attack animation");
  assert.equal(activeMonster.AttackMode, "ACTIVE");
  assert.equal(activeMonster.Aggressive, true);
  assert(activeMonster.AttackAnimationRuid, "Upper active Slime must define an attack animation");
  for (const definition of [monster, activeMonster]) {
    assert.equal(Number(definition.AttackAnimationDurationSeconds), 0.8);
    assert.equal(Number(definition.AttackHitDelaySeconds), 0.35);
    assert.equal(Number(definition.HitAnimationDurationSeconds), 0.35);
    assert(Number(definition.AttackHitDelaySeconds) < Number(definition.AttackAnimationDurationSeconds), `${definition.MonsterKey} hit frame must occur before attack completion`);
    assert(Number(definition.AttackAnimationDurationSeconds) <= Number(definition.AttackIntervalSeconds), `${definition.MonsterKey} attack animation must complete before its next attack interval`);
  }
  const tierSpawns = combat.MonsterSpawnGroups.filter((row) => Number(row.HuntingGroundTierIndex) === 1 && row.Enabled);
  assert.deepEqual(tierSpawns.map((row) => row.LaneKey).sort(), ["CENTER", "LOWER", "UPPER"]);
  assert.equal(Number(tierSpawns.find((row) => row.LaneKey === "UPPER").MonsterDefinitionIndex), 2);
  const tierLadders = combat.CombatLadders.filter((row) => Number(row.HuntingGroundTierIndex) === 1 && row.Enabled);
  assert.deepEqual(tierLadders.map((row) => `${row.LowerLaneKey}>${row.UpperLaneKey}`).sort(), ["CENTER>UPPER", "LOWER>CENTER"]);

  const forwardArea = buildSkillHitArea(playerSkill, { x: 0, y: 0 }, { x: 0.8, y: 0 }, 1);
  assert.deepEqual(forwardArea.center, { x: 0.5, y: 0 });
  assert.equal(isPointInsideSkillHitArea(forwardArea, { x: 0.8, y: 0 }), true);
  assert.equal(isPointInsideSkillHitArea(forwardArea, { x: -0.1, y: 0 }), false, "Forward rectangle must not extend behind SELF");
  const leftArea = buildSkillHitArea(playerSkill, { x: 0, y: 0 }, { x: -0.8, y: 0 }, -1);
  assert.equal(isPointInsideSkillHitArea(leftArea, { x: -0.8, y: 0 }), true);
  assert.equal(isPointInsideSkillHitArea(leftArea, { x: 0.1, y: 0 }), false);
  const targetCircle = buildSkillHitArea({ ...contactSkill, HitOriginTypeEnumId: "TARGET" }, { x: 0, y: 0 }, { x: 3, y: 2 }, 1);
  assert.deepEqual(targetCircle.origin, { x: 3, y: 2 }, "TARGET origin must be centered on the target");
  assert.equal(isPointInsideSkillHitArea(targetCircle, { x: 3.5, y: 2 }), true);

  const laneGuard = new CombatSimulator({ config, playerProfile: player, playerSkill, monsterDefinition: monster, drop, random: createSeededRandom(1) });
  const untouchedHp = laneGuard.monsterHp;
  assert.deepEqual(laneGuard.playerAttack("UPPER"), [], "Initial basic attack must not hit the upper lane");
  assert.deepEqual(laneGuard.playerAttack("LOWER"), [], "Initial basic attack must not hit the lower lane");
  assert.equal(laneGuard.monsterHp, untouchedHp, "Off-lane attacks must not change monster HP");

  const simulator = new CombatSimulator({ config, playerProfile: player, playerSkill, monsterDefinition: monster, drop, random: createSeededRandom(777) });
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
