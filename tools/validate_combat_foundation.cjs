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
assert(playerSource.includes("camera.ScreenOffset"), "Sandbox player must apply the configured screen-right camera offset");
assert(playerSource.includes("camera.ConfineCameraArea"), "Sandbox player must explicitly control camera area confinement");
assert(playerSource.includes("CollisionGroups.Monster"), "Player attacks must target the Monster collision group");
assert(playerSource.includes("self.CombatLaneKey"), "Player targeting must consume the configured combat lane");
assert(playerSource.includes("profile.AttackHitboxHeight"), "Player hitbox height must come from Combat.xlsx");

const monsterAttackSource = fs.readFileSync(path.join(combatDir, "CombatMonsterAttack.mlua"), "utf8");
assert(monsterAttackSource.includes("CollisionGroups.Player"), "Monster attacks must target the Player collision group");
assert(monsterAttackSource.includes("definition.AttackHitboxHeight"), "Monster hitbox height must come from Combat.xlsx");
for (const method of ["CalcDamage", "IsAttackTarget"]) {
  const pattern = new RegExp(`@ExecSpace\\([^\\n]+\\)\\s*method [^\\n]+ ${method}\\(`);
  assert(!pattern.test(playerSource), `CombatPlayerAutoBattle.${method} override must not change ExecSpace`);
  assert(!pattern.test(monsterAttackSource), `CombatMonsterAttack.${method} override must not change ExecSpace`);
}

const tableSource = fs.readFileSync(path.join(combatDir, "CombatTableRuntime.mlua"), "utf8");
assert(tableSource.includes('PlayerDeathPenaltySeconds = 300'), "Generated runtime must contain the configured death penalty");
assert(tableSource.includes('["DROP_SLIME_TIER1"]'), "Generated runtime must contain the Slime drop group");
assert(tableSource.includes('MinQuantity = 1') && tableSource.includes('MaxQuantity = 3'), "Generated runtime must preserve the variable Slime reward range");
assert(tableSource.includes('RuntimeKind = "HENESYS_TILE_LANES"'), "Generated runtime must enable the Henesys lane runtime");
assert(tableSource.includes('CombatAreaMinimumWorldX = 0') && tableSource.includes('CombatAreaMaximumWorldX = 8'), "Generated runtime must constrain combat to the screen-right world-X range");
assert(tableSource.includes('CombatCameraScreenOffsetX = 0.75') && tableSource.includes('CombatCameraScreenOffsetY = 0.655'), "Generated runtime must frame combat in the screen-right region");
assert(tableSource.includes('CombatCameraConfineArea = false'), "Generated runtime must not recenter the camera from foothold bounds");
assert(tableSource.includes('BasicAttackLaneKey = "CENTER"'), "Generated runtime must lock basic attacks to CENTER");
assert(tableSource.includes('["UPPER"]') && tableSource.includes('["CENTER"]') && tableSource.includes('["LOWER"]'), "Generated runtime must contain all three combat lanes");

assert(fs.existsSync(modelPath), `Missing Slime model: ${modelPath}`);
const model = ModelBuilder.read(modelPath);
const components = new Set(model.listComponents());
for (const required of [
  "MOD.Core.RigidbodyComponent",
  "MOD.Core.MovementComponent",
  "MOD.Core.StateComponent",
  "MOD.Core.HitComponent",
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
      "CombatHarness/Monsters/SlimeTier1",
      "CombatHarness/Lanes/UPPER/Spawn",
      "CombatHarness/Lanes/CENTER/Spawn",
      "CombatHarness/Lanes/LOWER/Spawn",
    ]) {
      assert(map.find(entityPath), `Henesys map01 is missing ${entityPath}`);
    }
    console.log("Combat foundation valid: data runtime, scripts, model, and Henesys three-lane harness");
  } else {
    console.log("Combat foundation valid: data runtime, scripts, and model; Henesys map01 awaits three Maker-authored foothold rows");
  }
} else {
  console.log("Combat foundation valid: data runtime, scripts, and model; Henesys map01 is missing");
}
