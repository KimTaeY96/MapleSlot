"use strict";

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = process.cwd();
const coreVersion = JSON.parse(fs.readFileSync(path.join(projectRoot, "Environment/config"), "utf8")).CoreVersion;
process.env.MSW_MODEL_BUILDER_MOD_CORE_VERSION = coreVersion;

const { ModelBuilder, vector3 } = require(path.join(
  projectRoot,
  ".agents/skills/msw-general/scripts/model/msw_model_builder.cjs",
));

const templatePath = path.join(projectRoot, ".agents/skills/msw-general/models/MapObject.model");
const outputPath = path.join(projectRoot, "RootDesk/MyDesk/Models/MapObjects/CombatDropPickupVisual.model");
const model = ModelBuilder.fromTemplate(templatePath, "CombatDropPickupVisual");

model
  .value("MOD.Core.TransformComponent", "Scale", vector3(0.72, 0.72, 1), "vector3")
  .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "4cc5ffc272224edc809a792b8efa16e3", "string")
  .value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string")
  .value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 12, "int");

model._data.CoreVersion = coreVersion;
model.write(outputPath);
console.log(`Created ${outputPath} for CoreVersion ${coreVersion}`);
