"use strict";

const fs = require("node:fs");
const path = require("node:path");

const rootArg = process.argv.indexOf("--project-root");
const outputArg = process.argv.indexOf("--output");
const projectRoot = rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd();
const outputPath = outputArg >= 0
  ? path.resolve(process.argv[outputArg + 1])
  : path.join(projectRoot, "RootDesk/MyDesk/Models/Monsters/SlimeTier1.model");
const builderPath = path.join(projectRoot, ".agents/skills/msw-general/scripts/model/msw_model_builder.cjs");
const templatePath = path.join(projectRoot, ".agents/skills/msw-general/models/MonsterCanonical.model");
const { ModelBuilder, vector2, collisionGroup } = require(builderPath);

const standRuid = "50faf654ee5d479cb2958edce9feaef0";
const moveRuid = "dc932872543f4a02bf41e977ab79e5ad";
const dieRuid = "31ecb6c7cbc24599881f00cb01599f09";

const model = ModelBuilder.fromTemplate(templatePath, "SlimeTier1");
for (const component of [
  "MOD.Core.AIChaseComponent",
  "MOD.Core.StateAnimationComponent",
  "script.Monster",
  "script.MonsterAttack",
]) {
  if (model.hasComponent(component)) model.removeComponent(component);
}
for (const component of [
  "script.CombatMonsterHealth",
  "script.CombatMonsterAI",
  "script.CombatMonsterAttack",
]) {
  if (!model.hasComponent(component)) model.addComponent(component);
}

model
  .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", standRuid, "string")
  .value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string")
  .value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 2, "int")
  .value("MOD.Core.MovementComponent", "InputSpeed", 1.2, "float")
  .value("MOD.Core.StateComponent", "IsLegacy", false, "bool")
  .value("MOD.Core.HitComponent", "BoxSize", vector2(0.72, 0.64), "vector2")
  .value("MOD.Core.HitComponent", "ColliderOffset", vector2(0, 0.32), "vector2")
  .value("MOD.Core.HitComponent", "CollisionGroup", collisionGroup("8992acd1e8cd45838db6f10a7b41df09"), "collision_group")
  .value("MOD.Core.HitComponent", "IsLegacy", false, "bool")
  .value("script.CombatMonsterHealth", "MonsterDefinitionIndex", 1, "int")
  .value("script.CombatMonsterAI", "MonsterDefinitionIndex", 1, "int")
  .value("script.CombatMonsterAI", "StandRUID", standRuid, "string")
  .value("script.CombatMonsterAI", "MoveRUID", moveRuid, "string")
  .value("script.CombatMonsterAI", "DieRUID", dieRuid, "string")
  .value("script.CombatMonsterAttack", "MonsterDefinitionIndex", 1, "int");

const validation = model.validate();
if (validation && validation.valid === false) {
  throw new Error(`SlimeTier1 model validation failed: ${JSON.stringify(validation)}`);
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
model.write(outputPath);
console.log(`Created combat monster model: ${outputPath}`);
console.log(JSON.stringify(model.snapshot(), null, 2));
