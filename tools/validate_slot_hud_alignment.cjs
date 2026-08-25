"use strict";

const fs = require("node:fs");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nearlyEqual(actual, expected, epsilon, message) {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(message + ": expected " + expected + ", got " + actual);
  }
}

function calculateLayout(screenWidth, screenHeight, slotWidth, slotHeight) {
  const hudScale = Math.min(1, Math.max(0.72, (screenWidth - 80) / 740));
  const topHudOffset = 18;
  const slotToHudGap = 2;
  const slotToBottomHudGap = 2;
  const slotTop = topHudOffset + (88 * hudScale) + slotToHudGap;
  const leftMargin = 42;
  const bottomHudHeight = 110;
  const slotScaleByWidth = (screenWidth - (leftMargin * 2)) / slotWidth;
  const slotScaleByHeight = (screenHeight - bottomHudHeight - slotToBottomHudGap - slotTop) / slotHeight;
  const slotScale = Math.max(0.2, Math.min(0.90, Math.min(slotScaleByWidth, slotScaleByHeight)));
  const slotCenterX = leftMargin + (slotWidth * slotScale * 0.5);
  const topHudAnchoredX = slotCenterX - (screenWidth * 0.5);
  return {
    hudScale,
    slotScale,
    slotTop,
    slotBottom: slotTop + (slotHeight * slotScale),
    bottomHudTop: screenHeight - bottomHudHeight,
    slotCenterX,
    topHudCenterX: (screenWidth * 0.5) + topHudAnchoredX,
    topHudBottom: topHudOffset + (88 * hudScale),
  };
}

const runtimeSource = fs.readFileSync("RootDesk/MyDesk/SlotMachine/SlotMachineRuntime.mlua", "utf8");
for (const fragment of [
  "local slotToHudGap = 2.0",
  "local slotToBottomHudGap = 2.0",
  "local slotWidth = self.slotPanelTransform.RectSize.x",
  "local slotHeight = self.slotPanelTransform.RectSize.y",
  "local slotScale = math.min(0.90",
  "local slotCenterX = leftMargin + (slotWidth * slotScale * 0.5)",
  "self.topHudTransform.anchoredPosition = Vector2(topHudAnchoredX, -topHudOffset)",
  "self.slotPanelTransform.anchoredPosition = Vector2(leftMargin, -slotTop)",
]) {
  assert(runtimeSource.includes(fragment), "Responsive layout source missing: " + fragment);
}

const mainUi = UIBuilder.read("ui/UIRoot_TestSandbox_MainPlay.ui");
const slotTransform = mainUi.getComponent("Panel_LeftSlotMachine", "MOD.Core.UITransformComponent");
const layout = calculateLayout(1920, 1080, slotTransform.RectSize.x, slotTransform.RectSize.y);
assert(layout.slotScale > 0.87 && layout.slotScale <= 0.90, "Slot must enlarge beyond the old 0.87 cap without exceeding 0.90");
nearlyEqual(layout.slotTop - layout.topHudBottom, 2, 1e-9, "Coin HUD to slot gap must be 2px");
nearlyEqual(layout.bottomHudTop - layout.slotBottom, 2, 1e-9, "Slot to bottom HUD gap must be 2px");
nearlyEqual(layout.slotCenterX, layout.topHudCenterX, 1e-9, "Coin HUD must be centered over slot machine");

const hud = UIBuilder.read("ui/ClassicPlayerHUD.ui");
const inventoryIcon = hud.getComponent("HudFrame/InventoryButton/Icon", "MOD.Core.UITransformComponent");
const skillIcon = hud.getComponent("HudFrame/SkillButton/Icon", "MOD.Core.UITransformComponent");
assert(inventoryIcon.RectSize.x === 78 && inventoryIcon.RectSize.y === 78, "Inventory icon rollback size must be 78x78");
assert(skillIcon.RectSize.x === 70 && skillIcon.RectSize.y === 70, "Skill-book icon must match the bag visible footprint at 70x70");

process.stdout.write(JSON.stringify({
  screen: [1920, 1080],
  slotScale: layout.slotScale,
  topGap: layout.slotTop - layout.topHudBottom,
  bottomGap: layout.bottomHudTop - layout.slotBottom,
  slotCenterX: layout.slotCenterX,
  topHudCenterX: layout.topHudCenterX,
  inventoryIconSize: [inventoryIcon.RectSize.x, inventoryIcon.RectSize.y],
  skillIconSize: [skillIcon.RectSize.x, skillIcon.RectSize.y],
}, null, 2) + "\n");
