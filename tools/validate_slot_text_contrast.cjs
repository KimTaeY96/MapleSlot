"use strict";

const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function textComponent(builder, path) {
  const component = builder.getComponent(path, "MOD.Core.TextGUIRendererComponent");
  assert(component != null, "Missing text component: " + path);
  return component;
}

function isBlack(color) {
  return color != null && color.r <= 0.05 && color.g <= 0.05 && color.b <= 0.05 && color.a >= 0.99;
}

function assertBlackOutline(builder, path, minWidth) {
  const text = textComponent(builder, path);
  assert(isBlack(text.OutlineColor), path + " must use an opaque black outline");
  assert(text.OutlineWidth >= minWidth, path + " outline must be at least " + minWidth + ", got " + text.OutlineWidth);
}

function isNearWhite(color) {
  return color != null && color.r >= 0.85 && color.g >= 0.85 && color.b >= 0.85 && color.a >= 0.9;
}

function auditNearWhiteSlotText(file, builder) {
  let count = 0;
  for (const entry of UIBuilder.snapshot(file)) {
    if (entry.kind !== "TEXT" || !/(Slot|ItemTemplate|IconFrame)/.test(entry.path)) continue;
    const relative = entry.path.replace(/^\/ui\/[^/]+\/?/, "");
    const text = textComponent(builder, relative);
    if (!isNearWhite(text.FontColor)) continue;
    assertBlackOutline(builder, relative, 2);
    count += 1;
  }
  return count;
}

const equipment = UIBuilder.read("ui/EquipmentInventory.ui");
const equipmentSlots = [
  ["Cell_Weapon", "WeaponSlotButton"],
  ["Cell_Helmet", "HelmetSlotButton"],
  ["Cell_Armor", "ArmorSlotButton"],
  ["Cell_Gloves", "GlovesSlotButton"],
  ["Cell_Shoes", "ShoesSlotButton"],
];
for (const [cell, button] of equipmentSlots) {
  const root = "EquipmentPanel/EquipmentSection/SlotGrid/" + cell;
  assertBlackOutline(equipment, root + "/" + button + "/Enhancement", 3);
  assertBlackOutline(equipment, root + "/" + button + "/CanEquip", 2);
  for (const suffix of ["/" + button + "/Empty", "/Label"]) {
    const color = textComponent(equipment, root + suffix).FontColor;
    const luminance = (color.r + color.g + color.b) / 3;
    assert(luminance < 0.30, root + suffix + " must use a dark high-contrast font on the light slot background");
  }
}
assertBlackOutline(equipment, "InventoryPanel/GridSection/ItemGrid/ItemTemplate/Quantity", 3);
for (const path of [
  "InventoryPanel/Footer/CapacityText",
  "InventoryPanel/Footer/InventoryStatusText",
  "EquipmentPanel/EquipmentSection/SectionTitle",
]) {
  const color = textComponent(equipment, path).FontColor;
  const luminance = (color.r + color.g + color.b) / 3;
  assert(luminance < 0.30, path + " must use a dark high-contrast font on the light panel");
}

const skill = UIBuilder.read("ui/SkillWindow.ui");
const skillPaths = UIBuilder.snapshot("ui/SkillWindow.ui").map((entry) => entry.path);
for (const path of skillPaths.filter((path) => /\/SkillRow_[^/]+\/IconButton\/IconGlyph$/.test(path))) {
  assertBlackOutline(skill, path.replace("/ui/SkillWindow/", ""), 3);
}
for (const path of skillPaths.filter((path) => /\/SkillRow_[^/]+\/TypeBadge\/BadgeText$/.test(path))) {
  assertBlackOutline(skill, path.replace("/ui/SkillWindow/", ""), 2);
}
for (let i = 1; i <= 8; i += 1) {
  const root = "SlotGroup/Panel/Slot_" + i;
  assertBlackOutline(skill, root + "/IconText", 3);
  assertBlackOutline(skill, root + "/CooldownShade/CooldownText", 3);
}
assertBlackOutline(skill, "TooltipGroup/Panel/IconFrame/TooltipIconText", 3);

const hud = UIBuilder.read("ui/ClassicPlayerHUD.ui");
for (let i = 1; i <= 8; i += 1) {
  const root = "QuickSlots/Slot_" + i;
  assertBlackOutline(hud, root + "/IconText", 3);
  assertBlackOutline(hud, root + "/CooldownShade/CooldownText", 3);
  assertBlackOutline(hud, "QuickSlots/SlotNumber_" + i, 2);
}

const audited = {
  equipmentNearWhiteSlotTexts: auditNearWhiteSlotText("ui/EquipmentInventory.ui", equipment),
  skillNearWhiteSlotTexts: auditNearWhiteSlotText("ui/SkillWindow.ui", skill),
  hudNearWhiteSlotTexts: auditNearWhiteSlotText("ui/ClassicPlayerHUD.ui", hud),
};
process.stdout.write(JSON.stringify(audited, null, 2) + "\n");
