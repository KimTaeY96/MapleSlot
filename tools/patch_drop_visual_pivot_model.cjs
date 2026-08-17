"use strict";

const { ModelBuilder, vector3 } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");

const modelPath = "RootDesk/MyDesk/Models/MapObjects/CombatDropPickupVisual.model";
const model = ModelBuilder.read(modelPath);

if (model.hasComponent("MOD.Core.SpriteRendererComponent")) {
  model.removeComponent("MOD.Core.SpriteRendererComponent");
}
if (model.hasChild("SpinPivot")) {
  model.removeChild("SpinPivot");
}

model
  .child("SpinPivot", ["MOD.Core.TransformComponent"])
  .childValue("SpinPivot", "MOD.Core.TransformComponent", "Position", vector3(0, 0, 0), "vector3")
  .childValue("SpinPivot", "MOD.Core.TransformComponent", "Rotation", vector3(0, 0, 0), "vector3")
  .childValue("SpinPivot", "MOD.Core.TransformComponent", "Scale", vector3(1, 1, 1), "vector3")
  .child("Icon", ["MOD.Core.TransformComponent", "MOD.Core.SpriteRendererComponent"], { parent: "SpinPivot" })
  .childValue("Icon", "MOD.Core.TransformComponent", "Position", vector3(0, 0, 0), "vector3")
  .childValue("Icon", "MOD.Core.TransformComponent", "Rotation", vector3(0, 0, 0), "vector3")
  .childValue("Icon", "MOD.Core.TransformComponent", "Scale", vector3(1, 1, 1), "vector3")
  .childValue("Icon", "MOD.Core.SpriteRendererComponent", "SpriteRUID", "4cc5ffc272224edc809a792b8efa16e3", "string")
  .childValue("Icon", "MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string")
  .childValue("Icon", "MOD.Core.SpriteRendererComponent", "OrderInLayer", 12, "int")
  .write(modelPath);

console.log(JSON.stringify(model.snapshot(), null, 2));
