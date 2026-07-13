const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("C:/Users/ghddj/Desktop/AI/MSW/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const structurePath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "bonus777", "bonus777_slot_ui_structure.json");
const slotRoot = "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const structure = JSON.parse(fs.readFileSync(structurePath, "utf8"));
const assets = new Map(structure.assets.map((entry) => [entry.name, entry]));

function asset(name) {
  const entry = assets.get(name);
  const ruid = entry && manifest[entry.resourceKey]?.ruid;
  if (!entry || !ruid) throw new Error(`Missing 777 asset or RUID: ${name}`);
  return { ...entry, ruid };
}

function pos(entry) {
  return [entry.uiPosition.x, entry.uiPosition.y];
}

function size(entry) {
  return [entry.displaySize.width, entry.displaySize.height];
}

const reelFrame = asset("bonus777_slot_reel_window_frame");
const titleBadge = asset("bonus777_slot_title_badge");
const resultPanel = asset("bonus777_slot_result_panel");
const leverBase = asset("bonus777_slot_lever_base");
const leverArmUp = asset("bonus777_slot_lever_arm_up");

const builder = UIBuilder.load(uiPath);

for (const stalePanel of ["Bg_TitleOpaque", "Bg_ResultOpaque"]) {
  try {
    builder.remove(`${slotRoot}/${stalePanel}`);
  } catch (error) {
    if (!String(error?.message ?? "").includes("UI entity not found")) throw error;
  }
}

builder.patch(`${slotRoot}/Sprite_ReelWindowFrame`, { pos: pos(reelFrame), rect_size: size(reelFrame) });
builder.patchComponent(`${slotRoot}/Sprite_ReelWindowFrame`, "MOD.Core.SpriteGUIRendererComponent", {
  PreserveAspect: false,
});
for (let reelIndex = 1; reelIndex <= 3; reelIndex += 1) {
  const offset = (reelIndex - 1) * 2;
  const reelPosition = [structure.reels.positions[offset], structure.reels.positions[offset + 1]];
  builder.patch(`${slotRoot}/Sprite_ReelColumnBg_${reelIndex}`, {
    pos: reelPosition,
    rect_size: structure.reels.maskSize,
  });
  builder.patch(`${slotRoot}/Mask_Bonus777Reel_${reelIndex}`, {
    pos: reelPosition,
    rect_size: structure.reels.maskSize,
  });
}

builder.patch(`${slotRoot}/Sprite_TitleBadge`, { pos: pos(titleBadge), rect_size: size(titleBadge) });
builder.patchComponent(`${slotRoot}/Sprite_TitleBadge`, "MOD.Core.SpriteGUIRendererComponent", {
  PreserveAspect: false,
});
builder.patch(`${slotRoot}/Text_Title`, { pos: [0, 350], rect_size: [486, 34] });
builder.patchComponent(`${slotRoot}/Text_Title`, "MOD.Core.TextComponent", {
  FontSize: 26,
  MaxSize: 26,
});

builder.patch(`${slotRoot}/Sprite_ResultPanel`, { pos: pos(resultPanel), rect_size: size(resultPanel) });
builder.patchComponent(`${slotRoot}/Sprite_ResultPanel`, "MOD.Core.SpriteGUIRendererComponent", {
  PreserveAspect: false,
});
builder.patch(`${slotRoot}/Text_Chance`, { pos: [0, -270], rect_size: [520, 28] });
builder.patchComponent(`${slotRoot}/Text_Chance`, "MOD.Core.TextComponent", {
  FontSize: 20,
  MaxSize: 20,
});
builder.patch(`${slotRoot}/Text_Result`, { pos: [0, -306], rect_size: [520, 34] });
builder.patchComponent(`${slotRoot}/Text_Result`, "MOD.Core.TextComponent", {
  FontSize: 22,
  MaxSize: 22,
});

builder.sprite(`${slotRoot}/Sprite_LeverBase`, {
  anchor: "middle-center",
  pos: pos(leverBase),
  rect_size: size(leverBase),
  image_ruid: leverBase.ruid,
  preserve_aspect: true,
  raycast: false,
  sorting_layer: "UI",
  order_in_layer: 464,
  override_sorting: true,
});
builder.patch(`${slotRoot}/Sprite_Lever`, { pos: pos(leverArmUp), rect_size: size(leverArmUp) });
builder.patchComponent(`${slotRoot}/Sprite_Lever`, "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: leverArmUp.ruid },
  OrderInLayer: 465,
  PreserveAspect: true,
});

builder.write(uiPath, { lint: false, strict: false });
console.log("Patched 777 reel alignment, removed redundant panels, and fixed the vertical lever hierarchy.");
