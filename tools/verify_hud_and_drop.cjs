"use strict";

const fs = require("node:fs");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const coreVersion = JSON.parse(fs.readFileSync("Environment/config", "utf8")).CoreVersion;
const hud = UIBuilder.read("ui/ClassicPlayerHUD.ui");
const hudData = hud.build();
const hpFill = hud.getComponent("HudFrame/HpGauge/Fill", "MOD.Core.UITransformComponent");
const mpFill = hud.getComponent("HudFrame/MpGauge/Fill", "MOD.Core.UITransformComponent");
const expFill = hud.getComponent("HudFrame/ExpGauge/Fill", "MOD.Core.UITransformComponent");
const expTextTransform = hud.getComponent("HudFrame/ExpGauge/ValueText", "MOD.Core.UITransformComponent");
const expText = hud.getComponent("HudFrame/ExpGauge/ValueText", "MOD.Core.TextGUIRendererComponent");
const inventoryButton = hud.getComponent("HudFrame/InventoryButton", "MOD.Core.ButtonComponent");
const inventoryTouch = hud.getComponent("HudFrame/InventoryButton", "MOD.Core.UITouchReceiveComponent");

const classicSource = fs.readFileSync("RootDesk/MyDesk/UI/ClassicPlayerHUD.mlua", "utf8");
const healthSource = fs.readFileSync("RootDesk/MyDesk/Combat/CombatMonsterHealth.mlua", "utf8");
const dropSource = fs.readFileSync("RootDesk/MyDesk/Combat/CombatDropPickupVisual.mlua", "utf8");
const model = ModelBuilder.read("RootDesk/MyDesk/Models/MapObjects/CombatDropPickupVisual.model");
const modelData = model.build();

assert(coreVersion === "26.7.0.0", `Unexpected project CoreVersion: ${coreVersion}`);
assert(hudData.CoreVersion === coreVersion, "Classic HUD CoreVersion does not match Environment/config");
assert(modelData.CoreVersion === coreVersion, "Drop model CoreVersion does not match Environment/config");
assert(hpFill.RectSize.x === 303 && hpFill.RectSize.y === 29, "HP fill must stay inside the frame well");
assert(mpFill.RectSize.x === 303 && mpFill.RectSize.y === 29, "MP fill must stay inside the frame well");
assert(expFill.RectSize.x === 303 && expFill.RectSize.y === 29, "EXP fill must equal HP/MP safe bounds");
assert(expFill.anchoredPosition.x + expFill.RectSize.x <= 1642, "EXP fill exceeds its frame well");
assert(expTextTransform.anchoredPosition.x === expFill.anchoredPosition.x, "EXP text is not overlaid on fill");
assert(expTextTransform.RectSize.x === expFill.RectSize.x, "EXP text width does not match fill");
assert(expText.FontColor.r === 1 && expText.FontColor.g === 1 && expText.FontColor.b === 1, "EXP text must be white");
assert(expText.OutlineWidth >= 0.36 && expText.OutlineColor.a === 1, "EXP text requires a strong opaque black outline");
assert(inventoryButton.Transition === 2, "Inventory button must use SpriteSwap feedback");
assert(inventoryButton.ImageRUIDs.PressedSprite.DataId === "9c5feb02221248e7a1812578ad25181d", "Pressed inventory resource mismatch");
assert(inventoryTouch != null, "Inventory button long-press receiver is missing");
assert(/GaugeMaxWidth = 303/.test(classicSource), "Runtime gauge max width is not 303");
assert(/player\.Hp, player\.MaxHp/.test(classicSource), "HP gauge is not connected to live PlayerComponent HP");
assert(/EXP .* \(%/.test(classicSource) || /tostring\(expPercent\).*%\)/s.test(classicSource), "EXP percentage is not combined with value text");
assert(/SpawnDropVisuals\(killer, grants\)/.test(healthSource), "Monster death does not start drop visuals");
assert(!/_CombatRuntime:EnqueueGrants\(killer, grants\)/.test(healthSource), "Monster death still grants immediately");
assert(/GroundHoldDuration = 0\.5/.test(dropSource), "Ground hold must be 0.5 seconds");
assert(/SpinDegrees = 720/.test(dropSource), "Drop launch rotation is missing");
assert(/Landed rotation=0/.test(dropSource), "Zero-degree landing evidence log is missing");
assert(/LoadSpriteAndWait\(iconRuid\)/.test(dropSource), "Drop icons are not normalized from Sprite pivot metadata");
assert(/offsetX = sprite\.PivotPixel\.x \/ sprite\.PixelPerUnit/.test(dropSource), "Horizontal sprite pivot compensation is missing");
assert(/offsetY = sprite\.PivotPixel\.y \/ sprite\.PixelPerUnit/.test(dropSource), "Vertical sprite pivot compensation is missing");
assert(/spinTransform\.Rotation/.test(dropSource), "Drop rotation does not use the centered spin wrapper");
assert(!/transform\.Rotation = Vector3\(0, 0, self\.SpinDegrees/.test(dropSource), "Root drop transform still rotates around the source pivot");
assert(/method void CompletePickup\(\)[\s\S]*EnqueueGrants/.test(dropSource), "Reward is not queued after pickup flight");
assert(model.hasComponent("MOD.Core.TransformComponent"), "Drop model requires TransformComponent");
assert(!model.hasComponent("MOD.Core.SpriteRendererComponent"), "Drop root must not render or rotate the raw source sprite");
assert(model.hasChild("SpinPivot"), "Drop model requires a centered SpinPivot child");
assert(model.hasChild("Icon"), "Drop model requires an Icon renderer child");

console.log(JSON.stringify({
  coreVersion,
  gaugeWidths: [hpFill.RectSize.x, mpFill.RectSize.x, expFill.RectSize.x],
  expOverlay: true,
  inventoryFeedback: inventoryButton.Transition,
  dropModelId: model.model_id,
  groundHoldSeconds: 0.5,
}, null, 2));
