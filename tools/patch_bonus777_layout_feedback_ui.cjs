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
const frameShell = asset("bonus777_slot_frame_shell");
const leverBase = asset("bonus777_slot_lever_base");
const leverArmUp = asset("bonus777_slot_lever_arm_up");

const builder = UIBuilder.load(uiPath);

builder.patch(slotRoot, {
  pos: structure.slotRoot.position,
  rect_size: structure.slotRoot.rectSize,
});

for (const stalePanel of ["Bg_TitleOpaque", "Bg_ResultOpaque", "Sprite_TitleBadge", "Sprite_ResultPanel", "Text_Title"]) {
  try {
    builder.remove(`${slotRoot}/${stalePanel}`);
  } catch (error) {
    if (!String(error?.message ?? "").includes("UI entity not found")) throw error;
  }
}

builder.patch(`${slotRoot}/Sprite_FrameShell`, { pos: pos(frameShell), rect_size: size(frameShell) });
builder.patchComponent(`${slotRoot}/Sprite_FrameShell`, "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: frameShell.ruid },
  PreserveAspect: true,
});
builder.patch(`${slotRoot}/Sprite_ReelWindowFrame`, { pos: pos(reelFrame), rect_size: size(reelFrame) });
builder.patchComponent(`${slotRoot}/Sprite_ReelWindowFrame`, "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: reelFrame.ruid },
  PreserveAspect: true,
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
  const stripPath = `${slotRoot}/Mask_Bonus777Reel_${reelIndex}/Panel_Bonus777ReelStrip_${reelIndex}`;
  builder.patch(stripPath, { rect_size: structure.reels.stripSize });
  for (let virtualIndex = -1; virtualIndex <= 9; virtualIndex += 1) {
    const displayIndex = virtualIndex + 2;
    const cellPath = `${stripPath}/DigitCell_${String(displayIndex).padStart(2, "0")}`;
    const y = ((4 - virtualIndex) * structure.reels.cellHeight);
    builder.patch(cellPath, {
      pos: [0, y],
      rect_size: [structure.reels.stripSize[0], structure.reels.cellHeight],
    });
    builder.patch(`${cellPath}/Sprite_Face`, { rect_size: structure.reels.digitCellSize });
    builder.patch(`${cellPath}/Text_Digit`, { rect_size: structure.reels.digitTextSize });
    builder.patchComponent(`${cellPath}/Text_Digit`, "MOD.Core.TextComponent", {
      FontSize: 52,
      MaxSize: 52,
      MinSize: 34,
    });
  }
}

builder.patch(`${slotRoot}/Text_Chance`, { pos: [0, -224], rect_size: [480, 28] });
builder.patchComponent(`${slotRoot}/Text_Chance`, "MOD.Core.TextComponent", {
  FontSize: 20,
  MaxSize: 20,
});
builder.patch(`${slotRoot}/Text_Result`, { pos: [0, -260], rect_size: [480, 32] });
builder.patchComponent(`${slotRoot}/Text_Result`, "MOD.Core.TextComponent", {
  FontSize: 22,
  MaxSize: 22,
});

builder.patch(`${slotRoot}/Sprite_LeverBase`, {
  pos: pos(leverBase),
  rect_size: size(leverBase),
  display_order: 59,
});
builder.patchComponent(`${slotRoot}/Sprite_LeverBase`, "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: leverBase.ruid },
  PreserveAspect: true,
});
builder.patch(`${slotRoot}/Sprite_Lever`, {
  pos: pos(leverArmUp),
  rect_size: size(leverArmUp),
  display_order: 60,
});
builder.patchComponent(`${slotRoot}/Sprite_Lever`, "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: leverArmUp.ruid },
  OrderInLayer: 465,
  PreserveAspect: true,
});

builder.write(uiPath, { lint: false, strict: false });
console.log("Patched centered 777 resources, embedded result text, and Screen UI lever depth.");
