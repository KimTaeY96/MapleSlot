"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootArg = process.argv.indexOf("--project-root");
const sdkArg = process.argv.indexOf("--sdk-root");
const root = rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd();
const sdkRoot = sdkArg >= 0 ? path.resolve(process.argv[sdkArg + 1]) : root;
const combatDir = path.join(root, "RootDesk/MyDesk/Combat");
const modelPath = path.join(root, "RootDesk/MyDesk/Models/Monsters/SlimeTier1.model");
const mapPath = path.join(root, "map/map01.map");
const { ModelBuilder } = require(path.join(sdkRoot, ".agents/skills/msw-general/scripts/model/msw_model_builder.cjs"));

const scriptNames = [
  "CombatTableRuntime.mlua",
  "CombatRuntime.mlua",
  "CombatSandboxRuntime.mlua",
  "CombatPlayerAutoBattle.mlua",
  "CombatPlayerMovementDriver.mlua",
  "CombatWalletBridge.mlua",
  "CombatMonsterHealth.mlua",
  "CombatMonsterAI.mlua",
  "CombatMonsterAttack.mlua",
];
for (const name of scriptNames) {
  const filePath = path.join(combatDir, name);
  assert(fs.existsSync(filePath), `Missing combat script: ${filePath}`);
  const source = fs.readFileSync(filePath, "utf8");
  assert(source.includes("script "), `${name} has no script declaration`);
  assert(!source.includes("OverrideSorting"), `${name} contains unsupported OverrideSorting`);
}

const playerSource = fs.readFileSync(path.join(combatDir, "CombatPlayerAutoBattle.mlua"), "utf8");
assert(!playerSource.includes("UseCustomScript"), "Combat scripts must not write the read-only UseCustomScript field");
assert(playerSource.includes("RemoveAllActionKeyByActionName"), "Sandbox player must disable manual input through documented action bindings");
assert(playerSource.includes("SetActionKey"), "Sandbox player must restore default action bindings when combat ends");
assert(playerSource.includes("_CameraService:SwitchCameraTo"), "Sandbox player must switch to and restore a dedicated combat camera");
assert(playerSource.includes("self.CombatCameraAnchorKey"), "Sandbox player must resolve the table-backed fixed camera anchor");
assert(playerSource.includes('map:GetChildByName("CameraAnchor", true)'), "Sandbox player must resolve CameraAnchor below the current runtime map");
assert(!playerSource.includes('"/maps/" .. map.Id'), "Runtime map GUID must not be used as a world path key");
assert(!playerSource.includes("self.Entity.CameraComponent"), "Combat framing must not keep following the player camera");
assert(playerSource.includes("CollisionGroups.Monster"), "Player attacks must target the Monster collision group");
assert(playerSource.includes("self.CombatLaneKey"), "Player targeting must consume the configured combat lane");
assert(playerSource.includes("profile.AttackHitboxHeight"), "Player hitbox height must come from Character.xlsx");
assert(playerSource.includes("profile.AttackAnimationDurationSeconds") && playerSource.includes("profile.AttackHitDelaySeconds") && playerSource.includes("profile.HitAnimationDurationSeconds"), "Player action timing must come from Character.xlsx");
assert(playerSource.includes("GetCombatLadder"), "Player AI must resolve ladder routes from HuntingGround.xlsx");
assert(!playerSource.includes("LadderMountWorldY"), "Server ladder data must not overwrite the client-authoritative mount Y");
assert(playerSource.includes("CreateAttackShape"), "Player attacks must build their hit shape from SkillInfo");
assert(playerSource.includes("origin.x + direction * self.AttackHitRangeX * 0.5"), "Player rectangle attacks must extend forward from their origin");
assert(playerSource.includes("AttackFacingDirectionX"), "Player skill direction must lock onto its target");
assert(playerSource.includes("nextLane.BoundsLeftAnchorKey"), "Ladder exit must use the destination platform height");
assert(!playerSource.includes("nextLane.SpawnAnchorKey"), "Ladder exit must not use the elevated monster spawn anchor");
assert(playerSource.includes("climbDirection > 0 and selfPosition.y >= targetY"), "Upward climbing must reach the platform before releasing the ladder");
assert(!playerSource.includes("selfPosition.y >= targetY - self.LadderExitTolerance"), "Upward climbing must not release below the destination platform");
assert(playerSource.includes("FindNearestMonsterAcrossLanes"), "Player AI must acquire targets on other floors when its lane is empty");
assert(/@ExecSpace\("ServerOnly"\)\s*method void OnUpdate\(/.test(playerSource), "Player target selection must remain server-authoritative");
assert(playerSource.includes('MovementIntent = "HORIZONTAL"'), "Player AI must publish horizontal movement intent");
assert(playerSource.includes("RetaliationTargetEntity"), "Player AI must prioritize the monster that damaged it");
assert(playerSource.includes("RequestImmediateMonsterPopulation"), "Player AI must recover an empty map before retrying acquisition");
assert(/@ExecSpace\("Client"\)\s*method void PlayAttackAnimation\(/.test(playerSource), "Player attack state changes must use a targeted client RPC");
assert(playerSource.includes("self:PlayAttackAnimation(player.UserId)"), "Server attack start must target the owning player client for animation");
assert(playerSource.includes('@Sync @HideFromInspector property string ActionPhase = "NONE"'), "Player attack and hit locks must replicate to the movement client");
assert(playerSource.includes("BeginAttackAction") && playerSource.includes("ResolveAttackHitFrame") && playerSource.includes("CompleteAttackAction"), "Player attacks must use a begin, hit-frame, and completion timeline");
assert(playerSource.indexOf("method boolean BeginAttackAction") < playerSource.indexOf("method void ResolveAttackHitFrame"), "Player damage resolution must follow attack start");
assert(playerSource.includes("self.ActionElapsedSeconds >= self.AttackHitDelaySeconds"), "Player damage must wait for the configured hit frame");
assert(playerSource.includes("self.ActionElapsedSeconds >= self.AttackAnimationDurationSeconds"), "Player ATTACK must remain locked for the configured animation duration");
assert(playerSource.includes("PendingHitReaction") && playerSource.includes("HandlePlayerHitEvent"), "Player hits during attack must queue a post-attack reaction");
assert(playerSource.includes("FinishAttackAnimation") && playerSource.includes("FinishHitAnimation"), "Player retained action states must be released explicitly");

const movementDriverSource = fs.readFileSync(path.join(combatDir, "CombatPlayerMovementDriver.mlua"), "utf8");
assert(movementDriverSource.includes("AppliedLadderMountSequence"), "Client movement must apply each ladder mount correction once");
assert(movementDriverSource.includes("Vector2(autoBattle.LadderMountWorldX, currentPosition.y)"), "Ladder entry must preserve the client's current world Y");
assert(movementDriverSource.includes("controller.LookDirectionX = autoBattle.AttackFacingDirectionX"), "Client attack animation must face the locked target direction");
assert(/@ExecSpace\("ClientOnly"\)\s*method void OnUpdate\(/.test(movementDriverSource), "Player movement execution must run on the avatar-owning client");
assert(movementDriverSource.includes("ActionClimb"), "Player movement driver must mount Maker-authored ladders through PlayerControllerComponent");
assert(movementDriverSource.includes('MovementIntent == "HORIZONTAL"'), "Player movement driver must consume horizontal movement intent");
assert(movementDriverSource.includes('state:ChangeState("MOVE")'), "Player horizontal movement must drive the avatar MOVE animation state");
assert(movementDriverSource.includes('state.CurrentStateName ~= "DEAD"'), "Player movement must recover from retained attack or hit states without moving while dead");
assert(movementDriverSource.includes('autoBattle.ActionPhase == "ATTACK"') && movementDriverSource.includes('autoBattle.ActionPhase == "HIT"'), "Player movement must stop while attack or hit animation locks are active");
assert(movementDriverSource.includes("AlwaysMovingState = true"), "Player horizontal movement must preserve MOVE animation without manual input");

const monsterAttackSource = fs.readFileSync(path.join(combatDir, "CombatMonsterAttack.mlua"), "utf8");
assert(monsterAttackSource.includes("HitOriginTypeEnumId"), "Monster attacks must honor SELF/TARGET SkillInfo origins");
assert(monsterAttackSource.includes("HitShapeTypeEnumId"), "Monster attacks must honor CIRCLE/RECTANGLE SkillInfo shapes");
assert(monsterAttackSource.includes("CollisionGroups.Player"), "Monster attacks must target the Player collision group");
assert(monsterAttackSource.includes("definition.AttackHitboxHeight"), "Monster hitbox height must come from Monster.xlsx");
assert(monsterAttackSource.includes("HandleTriggerStayEvent"), "Monster contact damage must originate from body overlap events");
assert(monsterAttackSource.includes("TryActiveAttack"), "Monster attack must keep active attacks separate from contact damage");
assert(monsterAttackSource.includes('ai.ActionPhase ~= "NONE"'), "Monster contact damage must pause during attack and hit animation locks");
assert(monsterAttackSource.includes("NotifyDamagedByMonster"), "Successful monster damage must update player retaliation priority");
for (const method of ["CalcDamage", "IsAttackTarget"]) {
  const pattern = new RegExp(`@ExecSpace\\([^\\n]+\\)\\s*method [^\\n]+ ${method}\\(`);
  assert(!pattern.test(playerSource), `CombatPlayerAutoBattle.${method} override must not change ExecSpace`);
  assert(!pattern.test(monsterAttackSource), `CombatMonsterAttack.${method} override must not change ExecSpace`);
}

const sandboxSource = fs.readFileSync(path.join(combatDir, "CombatSandboxRuntime.mlua"), "utf8");
assert(sandboxSource.includes("_SpawnService:SpawnByModelId"), "Combat runtime must spawn real monster model instances");
assert(sandboxSource.includes("spawnGroup.SpawnCount"), "Combat runtime must maintain the table-backed spawn count");
assert(sandboxSource.includes("GetMonsterSpawnGroupsForTier"), "Combat runtime must maintain spawn groups on all three lanes");
assert(sandboxSource.includes("spawnGroup.SpawnAnchorKey"), "Combat runtime must resolve the table-backed spawn anchor");
assert(sandboxSource.includes("definition.ModelPath"), "Combat runtime must derive the model id from table-backed model data");
assert(sandboxSource.includes("EnsureImmediateMonsterPopulation"), "Combat runtime must immediately restore all live floor populations when empty");
assert(sandboxSource.includes('AddComponent("CombatPlayerMovementDriver")'), "Combat runtime must attach the client player movement driver");
assert(sandboxSource.includes('AddComponent("CombatWalletBridge")'), "Combat runtime must attach the reward wallet bridge");

const walletSource = fs.readFileSync(path.join(combatDir, "CombatWalletBridge.mlua"), "utf8");
assert(walletSource.includes("DrainPendingCurrencyRewards"), "Combat wallet must consume only server-validated currency grants");
assert(walletSource.includes('reward.rewardKey == "COMMON_COIN"'), "Combat wallet must explicitly validate the Common Coin key");
assert(walletSource.includes("GrantCombatCommonCoins"), "Combat wallet must apply replicated reward deltas to the slot wallet");

const combatRuntimeSource = fs.readFileSync(path.join(combatDir, "CombatRuntime.mlua"), "utf8");
assert(combatRuntimeSource.includes("self.pendingRewardsByUserId[userId] = remaining"), "Currency draining must preserve future item grants");
assert(combatRuntimeSource.includes("floorDistance * 100"), "Cross-floor targeting must prioritize the nearest lane before horizontal distance");
assert(combatRuntimeSource.includes("CountLiveMonsterInstances"), "Combat runtime must distinguish live monsters from respawn-waiting instances");

const monsterAiSource = fs.readFileSync(path.join(combatDir, "CombatMonsterAI.mlua"), "utf8");
assert(monsterAiSource.includes('AIState = "IDLE"') && monsterAiSource.includes('AIState = "WANDER"'), "Monster AI must alternate idle and autonomous movement");
assert(monsterAiSource.includes("self.Aggressive"), "Monster AI must distinguish aggressive and passive definitions");
assert(monsterAiSource.includes("NotifyAttacked"), "Passive monsters must enter chase after being attacked");
assert(monsterAiSource.includes("ContactMoveThroughSeconds"), "Contact monsters must continue moving after player contact");
assert(monsterAiSource.includes("ActiveAttackEnabled"), "Only monsters with an active attack definition may use attack animation logic");
assert(monsterAiSource.includes("definition.AttackAnimationDurationSeconds") && monsterAiSource.includes("definition.AttackHitDelaySeconds") && monsterAiSource.includes("definition.HitAnimationDurationSeconds"), "Monster action timing must come from Monster.xlsx");
assert(monsterAiSource.includes("ResolveActiveAttackHitFrame") && monsterAiSource.includes("CompleteAttackAction"), "Monster active attacks must resolve on a delayed hit frame and complete their animation lock");
assert(monsterAiSource.includes("PendingHitReaction") && monsterAiSource.includes("BeginHitReaction"), "Monster hit reactions must queue behind active attacks");

const healthSource = fs.readFileSync(path.join(combatDir, "CombatMonsterHealth.mlua"), "utf8");
assert(!healthSource.includes("self.Entity:SetEnable(false)"), "Respawning monsters must not disable their own timer owner");
assert(healthSource.includes("math.max(self.DestroyDelay, self.RespawnSeconds)"), "Monster respawn must respect death visibility and respawn timing");

const tableSource = fs.readFileSync(path.join(combatDir, "CombatTableRuntime.mlua"), "utf8");
assert(tableSource.includes('PlayerDeathPenaltySeconds = 300'), "Generated runtime must contain the configured death penalty");
assert(tableSource.includes('["DROP_SLIME_TIER1"]'), "Generated runtime must contain the Slime drop group");
assert(tableSource.includes('MinQuantity = 1') && tableSource.includes('MaxQuantity = 3'), "Generated runtime must preserve the variable Slime reward range");
assert(tableSource.includes('RuntimeKind = "HENESYS_TILE_LANES"'), "Generated runtime must enable the Henesys lane runtime");
assert(tableSource.includes('CombatAreaMinimumWorldX = 0') && tableSource.includes('CombatAreaMaximumWorldX = 8'), "Generated runtime must constrain combat to the screen-right world-X range");
assert(tableSource.includes('CombatCameraScreenOffsetX = 0.75') && tableSource.includes('CombatCameraScreenOffsetY = 0.655'), "Generated runtime must frame combat in the screen-right region");
assert(tableSource.includes('CombatCameraConfineArea = false'), "Generated runtime must not recenter the camera from foothold bounds");
assert(tableSource.includes('CombatCameraAnchorKey = "CombatHarness/CameraAnchor"'), "Generated runtime must contain the fixed combat camera anchor key");
assert(tableSource.includes('BasicAttackLaneKey = "CENTER"'), "Generated runtime must start the player on CENTER");
assert(tableSource.includes('AttackAnimationDurationSeconds = 0.8') && tableSource.includes('AttackHitDelaySeconds = 0.35') && tableSource.includes('HitAnimationDurationSeconds = 0.5'), "Generated runtime must contain player animation timing");
assert(tableSource.includes('HitAnimationDurationSeconds = 0.35'), "Generated runtime must contain monster hit animation timing");
assert(tableSource.includes('["UPPER"]') && tableSource.includes('["CENTER"]') && tableSource.includes('["LOWER"]'), "Generated runtime must contain all three combat lanes");
assert(tableSource.includes('LadderKey = "ladder-3"') && tableSource.includes('LadderKey = "ladder-3_1"'), "Generated runtime must contain both Maker-authored ladder routes");
assert(tableSource.includes('SkillKeyEnumId = "PLAYER_BASIC_ATTACK"'), "Generated runtime must contain the player basic SkillInfo row");
assert(tableSource.includes('HitOriginTypeEnumId = "SELF"') && tableSource.includes('HitShapeTypeEnumId = "RECTANGLE"'), "Generated runtime must contain resolved skill hit enums");
assert(tableSource.includes('AttackMode = "CONTACT"') && tableSource.includes('ContactMoveThroughSeconds = 0.5'), "Generated runtime must contain contact-damage behavior");
assert(tableSource.includes('MonsterKey = "SLIME_TIER_1_ACTIVE"') && tableSource.includes('AttackMode = "ACTIVE"'), "Generated runtime must contain the upper-lane active attack test definition");
assert(tableSource.includes('MonsterDefinitionIndex = 2') && tableSource.includes('LaneKey = "UPPER"'), "Upper spawn group must reference the active attack definition");
assert(tableSource.includes('RespawnSeconds = 5'), "Generated runtime must contain the longer Slime respawn delay");
assert((tableSource.match(/SpawnGroupKey = "SPAWN_SLIME_TIER_1_/g) || []).length >= 6, "Generated runtime must index all three lane spawn groups");

assert(fs.existsSync(modelPath), `Missing Slime model: ${modelPath}`);
const model = ModelBuilder.read(modelPath);
const components = new Set(model.listComponents());
for (const required of [
  "MOD.Core.RigidbodyComponent",
  "MOD.Core.MovementComponent",
  "MOD.Core.StateComponent",
  "MOD.Core.HitComponent",
  "MOD.Core.TriggerComponent",
  "script.CombatMonsterHealth",
  "script.CombatMonsterAI",
  "script.CombatMonsterAttack",
]) {
  assert(components.has(required), `Slime model is missing ${required}`);
}
assert(!components.has("MOD.Core.AIChaseComponent"), "Slime model must not combine custom AI with AIChaseComponent");
assert(!components.has("MOD.Core.AIWanderComponent"), "Slime model must not combine custom AI with AIWanderComponent");
assert(!components.has("MOD.Core.StateAnimationComponent"), "Direct SpriteRUID AI must not be overwritten by StateAnimationComponent");
assert.equal(model.getValue("MOD.Core.StateComponent", "IsLegacy"), false, "Slime StateComponent.IsLegacy must be false");

if (fs.existsSync(mapPath)) {
  const { MapBuilder } = require(path.join(sdkRoot, ".agents/skills/msw-general/scripts/map/msw_map_builder.cjs"));
  const map = MapBuilder.read(mapPath);
  assert.equal(map.getTileMapMode(), 0, "Henesys map01 must use MapleTile mode");
  if (map.getMapInfo().footholdCount >= 3) {
    for (const entityPath of [
      "CombatHarness/SpawnLocation",
      "CombatHarness/Runtime",
      "CombatHarness/CameraAnchor",
      "CombatHarness/Lanes/UPPER/Spawn",
      "CombatHarness/Lanes/CENTER/Spawn",
      "CombatHarness/Lanes/LOWER/Spawn",
      "ladder-3",
      "ladder-3_1",
    ]) {
      assert(map.find(entityPath), `Henesys map01 is missing ${entityPath}`);
    }
    const fixedCamera = map.component("CombatHarness/CameraAnchor", "MOD.Core.CameraComponent");
    assert.equal(fixedCamera.ConfineCameraArea, false, "Fixed combat camera must not use foothold confinement");
    assert.deepEqual(fixedCamera.ScreenOffset, { x: 0.75, y: 0.655 }, "Fixed combat camera must use the table-backed screen offset");
    assert(map.component("ladder-3", "MOD.Core.ClimbableComponent"), "Lower-center ladder must be climbable");
    assert(map.component("ladder-3_1", "MOD.Core.ClimbableComponent"), "Center-upper ladder must be climbable");
    console.log("Combat foundation valid: data runtime, scripts, model, and Henesys three-lane harness");
  } else {
    console.log("Combat foundation valid: data runtime, scripts, and model; Henesys map01 awaits three Maker-authored foothold rows");
  }
} else {
  console.log("Combat foundation valid: data runtime, scripts, and model; Henesys map01 is missing");
}
