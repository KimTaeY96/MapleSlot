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
const mapPath = path.join(root, "map/Test_Sandbox.map");
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
assert(playerSource.includes("controller.UseCustomScript = true"), "Sandbox player must disable default manual input");
assert(playerSource.includes("self.DisableManualControl"), "Sandbox manual input gate must consume CombatConfig");
assert(playerSource.includes("controller.UseCustomScript = self.PreviousUseCustomScript"), "Sandbox player must restore prior input mode");
assert(playerSource.includes("CollisionGroups.Monster"), "Player attacks must target the Monster collision group");

const monsterAttackSource = fs.readFileSync(path.join(combatDir, "CombatMonsterAttack.mlua"), "utf8");
assert(monsterAttackSource.includes("CollisionGroups.Player"), "Monster attacks must target the Player collision group");
for (const method of ["CalcDamage", "IsAttackTarget"]) {
  const pattern = new RegExp(`@ExecSpace\\([^\\n]+\\)\\s*method [^\\n]+ ${method}\\(`);
  assert(!pattern.test(playerSource), `CombatPlayerAutoBattle.${method} override must not change ExecSpace`);
  assert(!pattern.test(monsterAttackSource), `CombatMonsterAttack.${method} override must not change ExecSpace`);
}

const tableSource = fs.readFileSync(path.join(combatDir, "CombatTableRuntime.mlua"), "utf8");
assert(tableSource.includes('PlayerDeathPenaltySeconds = 300'), "Generated runtime must contain the configured death penalty");
assert(tableSource.includes('["DROP_SLIME_TIER1"]'), "Generated runtime must contain the Slime drop group");
assert(tableSource.includes('MinQuantity = 1') && tableSource.includes('MaxQuantity = 3'), "Generated runtime must preserve the variable Slime reward range");

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

if (fs.existsSync(mapPath)) {
  const { MapBuilder } = require(path.join(sdkRoot, ".agents/skills/msw-general/scripts/map/msw_map_builder.cjs"));
  const map = MapBuilder.read(mapPath);
  assert.equal(map.getTileMapMode(), 0, "Test_Sandbox must use MapleTile mode");
  assert(map.getMapInfo().footholdCount > 0, "Test_Sandbox must contain at least one foothold");
  for (const entityPath of [
    "CombatHarness/PlayerSpawn",
    "CombatHarness/MonsterSpawn/Tier1",
    "CombatHarness/Runtime",
    "CombatHarness/Monsters/SlimeTier1",
  ]) {
    assert(map.find(entityPath), `Test_Sandbox is missing ${entityPath}`);
  }
  console.log("Combat foundation valid: data runtime, scripts, model, and Test_Sandbox harness");
} else {
  console.log("Combat foundation valid: data runtime, scripts, and model; Test_Sandbox map awaits Maker foothold authoring");
}
