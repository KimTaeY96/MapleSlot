"use strict";

const fs = require("fs");
const { execFileSync } = require("child_process");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = `${projectRoot}/ui/UIRoot_TestSandbox_MainPlay.ui`;
const manifestPath = `${projectRoot}/GeneratedAssets/SlotMachineUI/msw_resource_manifest.json`;
const coinAnimationManifestPath = `${projectRoot}/GeneratedAssets/CoinAnimation/msw_resource_manifest.json`;
const bonus777StructurePath = `${projectRoot}/GeneratedAssets/SlotMachineUI/bonus777/bonus777_slot_ui_structure.json`;
const runtimePath = `${projectRoot}/RootDesk/MyDesk/SlotMachine/SlotMachineRuntime.mlua`;

const ui = JSON.parse(fs.readFileSync(uiPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const coinAnimationManifest = JSON.parse(fs.readFileSync(coinAnimationManifestPath, "utf8"));
const bonus777Structure = JSON.parse(fs.readFileSync(bonus777StructurePath, "utf8"));
const runtime = fs.readFileSync(runtimePath, "utf8");
const screenSprayAnimationRuid = "b21f6d1b6d8d4c5ebe36b6d5b4503553";
const premiumCoinRuid = "9f4a925aa417482c82e2c683e6d863b9";
const commonCoinRuid = "4cc5ffc272224edc809a792b8efa16e3";
const entities = ui.ContentProto.Entities;
const entityRecordByPath = new Map(entities.map((entity) => [entity.path, entity]));
const byPath = new Map(entities.map((entity) => [entity.path, entity.jsonString]));
const root = "/ui/UIRoot_TestSandbox_MainPlay";

function fail(message) {
  throw new Error(message);
}

function validateBonus777VisualSafeArea() {
  const pythonPath = process.env.MSW_PYTHON_EXE || "C:/Users/ghddj/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
  const validatorPath = `${projectRoot}/tools/validate_bonus777_visual_safe_area.py`;
  execFileSync(pythonPath, [validatorPath], { stdio: "inherit" });
}

validateBonus777VisualSafeArea();

function getEntity(relativePath) {
  const fullPath = `${root}/${relativePath}`;
  const entity = byPath.get(fullPath);
  if (!entity) fail(`Missing UI entity: ${fullPath}`);
  return entity;
}

function getComponent(relativePath, type) {
  const entity = getEntity(relativePath);
  const component = entity["@components"].find((item) => item["@type"] === type);
  if (!component) fail(`Missing ${type} on ${relativePath}`);
  return component;
}

function expectRect(relativePath, width, height) {
  const transform = getComponent(relativePath, "MOD.Core.UITransformComponent");
  if (transform.RectSize.x !== width || transform.RectSize.y !== height) {
    fail(
      `Unexpected rect for ${relativePath}: ${transform.RectSize.x}x${transform.RectSize.y}; expected ${width}x${height}`,
    );
  }
}

function expectPosition(relativePath, x, y) {
  const transform = getComponent(relativePath, "MOD.Core.UITransformComponent");
  if (transform.anchoredPosition.x !== x || transform.anchoredPosition.y !== y) {
    fail(
      `Unexpected position for ${relativePath}: ${transform.anchoredPosition.x},${transform.anchoredPosition.y}; expected ${x},${y}`,
    );
  }
}

function expectSpriteOrder(relativePath, order) {
  const renderer = getComponent(relativePath, "MOD.Core.SpriteGUIRendererComponent");
  if (renderer.OrderInLayer !== order || renderer.OverrideSorting !== true) {
    fail(`Unexpected sprite order for ${relativePath}: order=${renderer.OrderInLayer}, override=${renderer.OverrideSorting}; expected ${order}/true`);
  }
}

function expectTextAlignment(relativePath, alignment) {
  const text = getComponent(relativePath, "MOD.Core.TextComponent");
  if (text.Alignment !== alignment) {
    fail(`Unexpected text alignment for ${relativePath}: ${text.Alignment}; expected ${alignment}`);
  }
}

function expectUiScale(relativePath, x, y) {
  const transform = getComponent(relativePath, "MOD.Core.UITransformComponent");
  if (transform.UIScale.x !== x || transform.UIScale.y !== y) {
    fail(`Unexpected UI scale for ${relativePath}: ${transform.UIScale.x},${transform.UIScale.y}; expected ${x},${y}`);
  }
}

function ruid(key) {
  const value = manifest[key]?.ruid;
  if (!value) fail(`Missing manifest RUID: ${key}`);
  return value;
}

function expectSprite(relativePath, key) {
  const renderer = getComponent(relativePath, "MOD.Core.SpriteGUIRendererComponent");
  const expected = ruid(key);
  if (renderer.ImageRUID?.DataId !== expected) {
    fail(`Unexpected RUID on ${relativePath}: ${renderer.ImageRUID?.DataId}; expected ${expected}`);
  }
}

function expectSpriteRuid(relativePath, expected) {
  const renderer = getComponent(relativePath, "MOD.Core.SpriteGUIRendererComponent");
  if (renderer.ImageRUID?.DataId !== expected) {
    fail(`Unexpected RUID on ${relativePath}: ${renderer.ImageRUID?.DataId}; expected ${expected}`);
  }
}

function expectWhiteSprite(relativePath, preserveAspect = false) {
  const renderer = getComponent(relativePath, "MOD.Core.SpriteGUIRendererComponent");
  const color = renderer.Color;
  if (color?.r !== 1 || color?.g !== 1 || color?.b !== 1 || color?.a !== 1) {
    fail(`Unexpected sprite tint on ${relativePath}: ${JSON.stringify(color)}; expected opaque white`);
  }
  if (preserveAspect && renderer.PreserveAspect !== true) {
    fail(`${relativePath} must preserve the source icon aspect ratio`);
  }
}

function expectText(relativePath, expected) {
  const text = getComponent(relativePath, "MOD.Core.TextComponent");
  if (text.Text !== expected) {
    fail(`Unexpected text on ${relativePath}: ${text.Text}; expected ${expected}`);
  }
}

function expectHorizontalSafeArea(relativePath, minX, maxX) {
  const transform = getComponent(relativePath, "MOD.Core.UITransformComponent");
  if (transform.OffsetMin.x < minX || transform.OffsetMax.x > maxX) {
    fail(
      `${relativePath} leaves its HUD bay: ${transform.OffsetMin.x}..${transform.OffsetMax.x}; expected inside ${minX}..${maxX}`,
    );
  }
}

function expectHorizontalGap(leftPath, rightPath, minGap) {
  const left = getComponent(leftPath, "MOD.Core.UITransformComponent");
  const right = getComponent(rightPath, "MOD.Core.UITransformComponent");
  const gap = right.OffsetMin.x - left.OffsetMax.x;
  if (gap < minGap) {
    fail(`Insufficient gap between ${leftPath} and ${rightPath}: ${gap}; expected at least ${minGap}`);
  }
}

function expectBestFit(relativePath, minSize, maxSize) {
  const text = getComponent(relativePath, "MOD.Core.TextComponent");
  if (text.BestFit !== true || text.MinSize !== minSize || text.MaxSize !== maxSize) {
    fail(
      `Unexpected BestFit on ${relativePath}: enabled=${text.BestFit}, range=${text.MinSize}..${text.MaxSize}; expected true/${minSize}..${maxSize}`,
    );
  }
}

expectRect("TopHUD_Currency", 740, 88);
expectRect("TopHUD_Currency/Bg", 740, 88);
expectRect("TopHUD_Currency/Icon_PremiumCoin", 40, 40);
expectRect("TopHUD_Currency/Text_PremiumCoinAmount", 240, 48);
expectRect("TopHUD_Currency/Icon_CommonCoin", 42, 36);
expectRect("TopHUD_Currency/Text_CommonCoinAmount", 240, 48);
expectPosition("TopHUD_Currency", 0, -18);
expectPosition("TopHUD_Currency/Icon_PremiumCoin", 44, 0);
expectPosition("TopHUD_Currency/Text_PremiumCoinAmount", 96, 0);
expectPosition("TopHUD_Currency/Icon_CommonCoin", 404, 0);
expectPosition("TopHUD_Currency/Text_CommonCoinAmount", 458, 0);
expectSprite("TopHUD_Currency/Bg", "currencyHudMinimal");
expectSpriteRuid("TopHUD_Currency/Icon_PremiumCoin", premiumCoinRuid);
expectSpriteRuid("TopHUD_Currency/Icon_CommonCoin", commonCoinRuid);
expectWhiteSprite("TopHUD_Currency/Bg");
expectWhiteSprite("TopHUD_Currency/Icon_PremiumCoin", true);
expectWhiteSprite("TopHUD_Currency/Icon_CommonCoin", true);
expectText("TopHUD_Currency/Text_PremiumCoinAmount", "0");
expectText("TopHUD_Currency/Text_CommonCoinAmount", "0");
expectTextAlignment("TopHUD_Currency/Text_PremiumCoinAmount", 3);
expectTextAlignment("TopHUD_Currency/Text_CommonCoinAmount", 3);
expectHorizontalSafeArea("TopHUD_Currency/Icon_PremiumCoin", 28, 348);
expectHorizontalSafeArea("TopHUD_Currency/Text_PremiumCoinAmount", 28, 348);
expectHorizontalSafeArea("TopHUD_Currency/Icon_CommonCoin", 391, 712);
expectHorizontalSafeArea("TopHUD_Currency/Text_CommonCoinAmount", 391, 712);
expectHorizontalGap("TopHUD_Currency/Icon_PremiumCoin", "TopHUD_Currency/Text_PremiumCoinAmount", 12);
expectHorizontalGap("TopHUD_Currency/Icon_CommonCoin", "TopHUD_Currency/Text_CommonCoinAmount", 12);
expectBestFit("TopHUD_Currency/Text_PremiumCoinAmount", 16, 26);
expectBestFit("TopHUD_Currency/Text_CommonCoinAmount", 16, 26);

expectRect("Panel_LeftSlotMachine", 893, 1020);
expectRect("Panel_LeftSlotMachine/Bg_CabinetFrame", 893, 1020);
expectRect("Panel_LeftSlotMachine/Bg_CabinetInterior", 689, 870);
expectRect("Panel_LeftSlotMachine/Decoration_TopEmblem", 378.863, 185.586761);
expectRect("Panel_LeftSlotMachine/ReelFrame_BG", 791, 350);
expectRect("Panel_LeftSlotMachine/ReelGrid_3x5", 791, 290);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow", 791, 170);
expectRect("Panel_LeftSlotMachine/Button_Spin", 304, 100);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet", 270, 54);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden", 270, 326);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetConfirm_Hidden", 760, 146);
expectRect("Panel_LeftSlotMachine/Panel_WinResult", 760, 28);
for (let index = 1; index <= 3; index += 1) {
  expectRect(`Panel_LeftSlotMachine/Panel_WinResult/Line_${index}`, 88, 28);
  expectRect(`Panel_LeftSlotMachine/Panel_WinResult/Line_${index}/Icon`, 22, 22);
  expectRect(`Panel_LeftSlotMachine/Panel_WinResult/Line_${index}/Text`, 62, 24);
}
expectRect("Panel_LeftSlotMachine/Panel_WinResult/Text_Total", 60, 24);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Divider_BaseBetMultiplier", 28, 88);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_BaseBetTitle", 270, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Backdrop_BaseBetTitle", 122, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_MultiplierTitle", 287, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Backdrop_MultiplierTitle", 136, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet/Text_BaseBetValue", 206, 34);

expectPosition("Panel_LeftSlotMachine/Decoration_TopEmblem", 0, -135);
expectPosition("Panel_LeftSlotMachine/Bg_CabinetInterior", 0, -75);
expectPosition("Panel_LeftSlotMachine/Text_SlotStatus", 0, 164);
expectPosition("Panel_LeftSlotMachine/Panel_WinResult", 0, 164);
expectPosition("Panel_LeftSlotMachine/ReelFrame_BG", 0, -316);
expectPosition("Panel_LeftSlotMachine/ReelGrid_3x5", 0, -356);
expectPosition("Panel_LeftSlotMachine/Panel_BetMultiplierRow", 0, -650);
expectPosition("Panel_LeftSlotMachine/Button_Spin", 0, 56);
expectPosition("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet", 76, -22);
expectPosition("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet/Text_BaseBetValue", 0, 0);
expectPosition("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden", 76, 90);
expectPosition("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Divider_BaseBetMultiplier", 380, -8);
expectPosition("Panel_LeftSlotMachine/Panel_WinResult/Line_1", -256, 0);
expectPosition("Panel_LeftSlotMachine/Panel_WinResult/Line_2", -160, 0);
expectPosition("Panel_LeftSlotMachine/Panel_WinResult/Line_3", -64, 0);
expectPosition("Panel_LeftSlotMachine/Panel_WinResult/Text_Total", -50, 0);
expectTextAlignment("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet/Text_BaseBetValue", 4);
expectTextAlignment("Panel_LeftSlotMachine/Panel_WinResult/Text_Total", 5);

expectSprite("Panel_LeftSlotMachine/Bg_CabinetFrame", "slotWideCabinetFrame");
expectSprite("Panel_LeftSlotMachine/Decoration_TopEmblem", "slotLayerTopEmblem");
expectSprite("Panel_LeftSlotMachine/ReelFrame_BG", "slotWideReelWindowFrame");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Bg", "slotWideBottomPanelEmpty");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet", "slotWideBottomPanelWideBox");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Bg", "slotWideDropdownList");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_1", "slotWideBottomPanelWideBox");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_10", "slotWideBottomPanelWideBox");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_BaseBetTitle", "slotWideTitleOrnament");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_MultiplierTitle", "slotWideTitleOrnament");
expectSprite("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Divider_BaseBetMultiplier", "slotWideBaseBetMultiplierDivider");
expectSpriteOrder("TopHUD_Currency/Bg", 300);
expectSpriteOrder("TopHUD_Currency/Icon_PremiumCoin", 301);
expectSpriteOrder("TopHUD_Currency/Text_PremiumCoinAmount", 302);
expectSpriteOrder("TopHUD_Currency/Icon_CommonCoin", 301);
expectSpriteOrder("TopHUD_Currency/Text_CommonCoinAmount", 302);
expectSpriteOrder("Panel_LeftSlotMachine/Bg_CabinetInterior", 0);
expectSpriteOrder("Panel_LeftSlotMachine/Decoration_TopEmblem", 10);
expectSpriteOrder("Panel_LeftSlotMachine/Bg_CabinetFrame", 20);
expectSpriteOrder("Panel_LeftSlotMachine/ReelFrame_BG", 40);
expectSpriteOrder("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Bg", 60);
expectSpriteOrder("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Bg", 200);
expectRect("ScreenSprayVFX_Fullscreen", 1920, 1080);
expectPosition("ScreenSprayVFX_Fullscreen", 0, 0);
const screenSprayEntity = getEntity("ScreenSprayVFX_Fullscreen");
const screenSprayRenderer = getComponent("ScreenSprayVFX_Fullscreen", "MOD.Core.SpriteGUIRendererComponent");
if (screenSprayEntity.enable !== false) {
  fail("ScreenSprayVFX_Fullscreen must start hidden and only be enabled by runtime trigger");
}
if (screenSprayRenderer.ImageRUID?.DataId !== screenSprayAnimationRuid) {
  fail(`Unexpected screen spray RUID: ${screenSprayRenderer.ImageRUID?.DataId}; expected ${screenSprayAnimationRuid}`);
}
if (screenSprayRenderer.AnimClipPlayType !== 0 || screenSprayRenderer.PlayRate !== 1) {
  fail("ScreenSprayVFX_Fullscreen must be configured as a one-time sprite animation");
}
if (screenSprayRenderer.OrderInLayer !== 420 || screenSprayRenderer.OverrideSorting !== true) {
  fail(`Unexpected screen spray sorting: order=${screenSprayRenderer.OrderInLayer}, override=${screenSprayRenderer.OverrideSorting}; expected 420/true`);
}
if (screenSprayRenderer.RaycastTarget !== false) {
  fail("ScreenSprayVFX_Fullscreen must not block slot controls while hidden or playing");
}

const bonus777Assets = new Map(bonus777Structure.assets.map((asset) => [asset.name, asset]));
const bonus777LeverArmUp = bonus777Assets.get("bonus777_slot_lever_arm_up");
const bonus777LeverArmMid = bonus777Assets.get("bonus777_slot_lever_arm_mid");
const bonus777LeverArmDown = bonus777Assets.get("bonus777_slot_lever_arm_down");
if (!bonus777LeverArmUp || !bonus777LeverArmMid || !bonus777LeverArmDown) {
  fail("777 vertical lever structure is incomplete");
}
if (
  bonus777LeverArmMid.resourceKey !== "bonus777SlotLeverArmMidVertical" ||
  bonus777LeverArmDown.resourceKey !== "bonus777SlotLeverArmDownVertical"
) {
  fail("777 lever must use the vertical mid/down resources, not the old leftward pull frames");
}
if (
  bonus777LeverArmMid.uiPosition.x !== bonus777LeverArmDown.uiPosition.x ||
  bonus777LeverArmMid.uiPosition.y >= bonus777LeverArmUp.uiPosition.y ||
  bonus777LeverArmDown.uiPosition.y >= bonus777LeverArmUp.uiPosition.y
) {
  fail("777 lever frame positions must keep one hinge and move from the upper state to lower states");
}
for (const leverAsset of [bonus777LeverArmUp, bonus777LeverArmMid, bonus777LeverArmDown]) {
  if (!runtime.includes(ruid(leverAsset.resourceKey))) {
    fail(`Runtime 777 lever RUID is stale: ${leverAsset.resourceKey}`);
  }
}
function expectBonus777Sprite(name, relativePath, order, overrideRect = null, overridePos = null) {
  const asset = bonus777Assets.get(name);
  if (!asset) fail(`Missing 777 slot structure asset: ${name}`);
  const expectedRect = overrideRect ?? [asset.displaySize.width, asset.displaySize.height];
  const expectedPos = overridePos ?? [asset.uiPosition.x, asset.uiPosition.y];
  expectRect(relativePath, expectedRect[0], expectedRect[1]);
  expectPosition(relativePath, expectedPos[0], expectedPos[1]);
  expectSprite(relativePath, asset.resourceKey);
  const renderer = getComponent(relativePath, "MOD.Core.SpriteGUIRendererComponent");
  if (renderer.OrderInLayer !== order || renderer.OverrideSorting !== true) {
    fail(`Unexpected 777 slot sorting for ${relativePath}: order=${renderer.OrderInLayer}, override=${renderer.OverrideSorting}; expected ${order}/true`);
  }
}

function bonus777ReelPosition(index) {
  const offset = (index - 1) * 2;
  return [bonus777Structure.reels.positions[offset], bonus777Structure.reels.positions[offset + 1]];
}

if (byPath.has(`${root}/Panel_ClassicSlotMachine_Hidden`)) {
  fail("Panel_ClassicSlotMachine_Hidden must not exist; the 777 bonus slot uses Panel_Bonus777_Hidden only");
}
if (byPath.has(`${root}/Panel_Bonus777_Hidden/ClassicSlot`)) {
  fail("Panel_Bonus777_Hidden/ClassicSlot must not exist; old classic resources must not be mixed into the 777 bonus slot");
}

expectRect("Panel_Bonus777_Hidden", 1920, 1080);
expectPosition("Panel_Bonus777_Hidden", 0, 0);
if (getEntity("Panel_Bonus777_Hidden").enable !== false) {
  fail("Panel_Bonus777_Hidden must start hidden and only be enabled during the 777 bonus presentation");
}
expectRect("Panel_Bonus777_Hidden/Dim", 1920, 1080);
expectRect("Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot", bonus777Structure.slotRoot.rectSize[0], bonus777Structure.slotRoot.rectSize[1]);
expectPosition("Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot", bonus777Structure.slotRoot.position[0], bonus777Structure.slotRoot.position[1]);
expectUiScale("Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot", bonus777Structure.slotRoot.uiScale[0], bonus777Structure.slotRoot.uiScale[1]);
expectRect("Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Chance", 480, 28);
expectRect("Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Result", 480, 32);
expectPosition("Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Chance", 0, -224);
expectPosition("Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Result", 0, -260);
const bonus777DimRenderer = getComponent("Panel_Bonus777_Hidden/Dim", "MOD.Core.SpriteGUIRendererComponent");
if (bonus777DimRenderer.OrderInLayer !== 440 || bonus777DimRenderer.OverrideSorting !== true) {
  fail(`Unexpected 777 dim sorting: order=${bonus777DimRenderer.OrderInLayer}, override=${bonus777DimRenderer.OverrideSorting}; expected 440/true`);
}
if (bonus777DimRenderer.RaycastTarget !== true) {
  fail("Panel_Bonus777_Hidden/Dim must block base slot touches while the bonus overlay is visible");
}
if (Math.abs((bonus777DimRenderer.Color?.a ?? 0) - 0.72) > 0.001) {
  fail(`Unexpected 777 dim alpha: ${bonus777DimRenderer.Color?.a}; expected 0.72`);
}

const bonus777Root = "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot";
expectBonus777Sprite("bonus777_slot_frame_shell", `${bonus777Root}/Sprite_FrameShell`, 450);
expectBonus777Sprite("bonus777_slot_reel_window_frame", `${bonus777Root}/Sprite_ReelWindowFrame`, 459);
if (getComponent(`${bonus777Root}/Sprite_ReelWindowFrame`, "MOD.Core.SpriteGUIRendererComponent").PreserveAspect !== true) {
  fail("777 reel window frame must preserve the normalized centered resource aspect");
}
expectBonus777Sprite("bonus777_slot_lever_base", `${bonus777Root}/Sprite_LeverBase`, 464);
expectBonus777Sprite("bonus777_slot_lever_arm_up", `${bonus777Root}/Sprite_Lever`, 1000);
const bonus777LeverBaseEntity = getEntity(`${bonus777Root}/Sprite_LeverBase`);
const bonus777LeverArmEntity = getEntity(`${bonus777Root}/Sprite_Lever`);
if (bonus777LeverArmEntity.displayOrder !== 1000 || bonus777LeverArmEntity.displayOrder <= bonus777LeverBaseEntity.displayOrder) {
  fail("Screen UI lever arm must use displayOrder 1000 above the fixed machine base");
}
if (
  !runtime.includes("self:EnsureBonus777LeverFront()")
  || !runtime.includes("_UILogic:SetSiblingIndex(self.bonus777LeverTransform, 1000000)")
) {
  fail("Runtime must force the animated 777 lever arm in front after every sprite-frame change");
}
if (runtime.includes("bonus777LeverRenderer.OverrideSorting =") || runtime.includes("bonus777LeverRenderer.OrderInLayer =")) {
  fail("Runtime must not assign serialized-only SpriteGUIRenderer sorting fields");
}
for (const redundantPath of [
  `${bonus777Root}/Bg_TitleOpaque`,
  `${bonus777Root}/Bg_ResultOpaque`,
  `${bonus777Root}/Sprite_TitleBadge`,
  `${bonus777Root}/Sprite_ResultPanel`,
  `${bonus777Root}/Text_Title`,
]) {
  if (byPath.has(`${root}/${redundantPath}`)) {
    fail(`${redundantPath} must not exist; title/result surfaces are integrated into the 777 cabinet background`);
  }
}

const bonus777DigitCellHeight = bonus777Structure.reels.cellHeight;
const bonus777RuntimeCellHeightMatch = runtime.match(
  /method float GetBonus777DigitCellHeight\(\)\s+return ([0-9.]+)\s+end/,
);
if (!bonus777RuntimeCellHeightMatch) {
  fail("Runtime is missing GetBonus777DigitCellHeight");
}
const bonus777RuntimeCellHeight = Number(bonus777RuntimeCellHeightMatch[1]);
if (bonus777RuntimeCellHeight !== bonus777DigitCellHeight) {
  fail(
    `Runtime 777 cell height ${bonus777RuntimeCellHeight} does not match UI structure ${bonus777DigitCellHeight}`,
  );
}
for (let index = 1; index <= 3; index += 1) {
  const reelPos = bonus777ReelPosition(index);
  expectBonus777Sprite(
    "bonus777_slot_reel_column_background",
    `${bonus777Root}/Sprite_ReelColumnBg_${index}`,
    452,
    bonus777Structure.reels.maskSize,
    reelPos,
  );
  const maskPath = `${bonus777Root}/Mask_Bonus777Reel_${index}`;
  const stripPath = `${maskPath}/Panel_Bonus777ReelStrip_${index}`;
  expectRect(maskPath, bonus777Structure.reels.maskSize[0], bonus777Structure.reels.maskSize[1]);
  expectPosition(maskPath, reelPos[0], reelPos[1]);
  getComponent(maskPath, "MOD.Core.MaskComponent");
  expectRect(stripPath, bonus777Structure.reels.stripSize[0], bonus777Structure.reels.stripSize[1]);
  expectPosition(stripPath, 0, 0);
  if (byPath.has(`${root}/${maskPath}/Sprite_ReelStrip`)) {
    fail(`${maskPath} must use live digit cells, not a static Sprite_ReelStrip image`);
  }
  for (let displayIndex = 1; displayIndex <= bonus777Structure.reels.visualCellCount; displayIndex += 1) {
    const virtualIndex = displayIndex - 2;
    const expectedDigit = ((((virtualIndex - 1) % 7) + 7) % 7) + 1;
    const cellPath = `${stripPath}/DigitCell_${String(displayIndex).padStart(2, "0")}`;
    expectRect(cellPath, bonus777Structure.reels.stripSize[0], bonus777DigitCellHeight);
    expectPosition(cellPath, 0, (4 - virtualIndex) * bonus777DigitCellHeight);
    expectBonus777Sprite("bonus777_slot_digit_cell", `${cellPath}/Sprite_Face`, 453, bonus777Structure.reels.digitCellSize, [0, 0]);
    expectRect(`${cellPath}/Text_Digit`, bonus777Structure.reels.digitTextSize[0], bonus777Structure.reels.digitTextSize[1]);
    expectTextAlignment(`${cellPath}/Text_Digit`, 4);
    const text = getComponent(`${cellPath}/Text_Digit`, "MOD.Core.TextComponent");
    if (text.Text !== String(expectedDigit)) {
      fail(`Unexpected 777 digit cell text for ${cellPath}: ${text.Text}; expected ${expectedDigit}`);
    }
  }
}
expectTextAlignment(`${bonus777Root}/Text_Chance`, 4);
expectTextAlignment(`${bonus777Root}/Text_Result`, 4);

expectRect("Button_DevCheatMenu", 68, 68);
expectPosition("Button_DevCheatMenu", -40, -40);
getComponent("Button_DevCheatMenu", "MOD.Core.ButtonComponent");
getComponent("Button_DevCheatMenu", "MOD.Core.UITouchReceiveComponent");
const devCheatButtonRenderer = getComponent("Button_DevCheatMenu", "MOD.Core.SpriteGUIRendererComponent");
if (devCheatButtonRenderer.OrderInLayer !== 430 || devCheatButtonRenderer.OverrideSorting !== true) {
  fail(`Unexpected dev cheat button sorting: order=${devCheatButtonRenderer.OrderInLayer}, override=${devCheatButtonRenderer.OverrideSorting}; expected 430/true`);
}
expectRect("Panel_DevCheat_Hidden", 420, 560);
expectPosition("Panel_DevCheat_Hidden", -40, -318);
if (getEntity("Panel_DevCheat_Hidden").enable !== false) {
  fail("Panel_DevCheat_Hidden must start hidden and only open after the development long-press");
}
expectRect("Panel_DevCheat_Hidden/Input_CheatCode", 282, 46);
expectRect("Panel_DevCheat_Hidden/Button_ApplyCheat", 92, 46);
expectRect("Panel_DevCheat_Hidden/Text_Status", 380, 30);
expectRect("Panel_DevCheat_Hidden/Panel_CheatList", 380, 410);
const cheatScrollTransform = getComponent("Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands", "MOD.Core.UITransformComponent");
if (
  cheatScrollTransform.OffsetMin.x !== 14 || cheatScrollTransform.OffsetMin.y !== 12
  || cheatScrollTransform.OffsetMax.x !== -14 || cheatScrollTransform.OffsetMax.y !== -12
) {
  fail("Cheat command scroll area must keep 14px horizontal and 12px vertical inner padding");
}
const cheatInput = getComponent("Panel_DevCheat_Hidden/Input_CheatCode", "MOD.Core.TextInputComponent");
if (cheatInput.LineType !== 0 || cheatInput.CharacterLimit !== 32) {
  fail(`Unexpected cheat input config: lineType=${cheatInput.LineType}, charLimit=${cheatInput.CharacterLimit}; expected 0/32`);
}
const cheatScroll = getComponent("Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands", "MOD.Core.ScrollLayoutGroupComponent");
if (cheatScroll.ScrollBarVisible !== 1 || cheatScroll.ScrollBarThickness !== 12) {
  fail("Cheat command list must expose a visible 12px scrollbar");
}
getComponent("Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands", "MOD.Core.MaskComponent");
for (let index = 1; index <= 12; index += 1) {
  expectRect(`Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands/Item_CheatCommand_${index}`, 348, 42);
  expectTextAlignment(`Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands/Item_CheatCommand_${index}`, 3);
}

for (let index = 1; index <= 5; index += 1) {
  expectPosition(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}`, 420 + (index - 1) * 58, -22);
  expectRect(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}`, 55, 55);
  expectRect(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Selected_Glow`, 67, 67);
  expectRect(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Fill_Background`, 39, 37);
  expectRect(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Border`, 55, 55);
  expectSprite(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Selected_Glow`, "slotWideMultiplierSelectedGlow");
  expectSprite(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Border`, "slotBottomPanelSmallBox");
}
expectSprite("Panel_LeftSlotMachine/Button_Spin", "slotSpinButtonNormal");

for (let column = 1; column <= 5; column += 1) {
  const base = `Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C${column}`;
  expectRect(base, 116, 290);
  expectRect(`${base}/Bg_ReelColumn`, 96, 290);
  expectPosition(base, (column - 3) * 150, 0);
  getComponent(base, "MOD.Core.MaskComponent");
  expectSprite(`${base}/Bg_ReelColumn`, "slotLayerReelColumnBackground");
  const columnBgRenderer = getComponent(`${base}/Bg_ReelColumn`, "MOD.Core.SpriteGUIRendererComponent");
  if (columnBgRenderer.OverrideSorting !== false) {
    fail(`Reel column background must stay inside the column mask sorting context: ${base}/Bg_ReelColumn`);
  }
  getEntity(`${base}/ReelStrip_C${column}`);
  expectRect(`${base}/WinHighlight_C${column}`, 108, 74);
}

const deprecatedCellFrames = entities.filter((entity) =>
  /\/ReelColumn_C[1-5]\/CellFrame_R[1-3]$/.test(entity.path),
);
if (deprecatedCellFrames.length !== 0) {
  fail(`Per-cell static frame entities should not exist on reels: ${deprecatedCellFrames.length}`);
}

const reelCells = entities.filter((entity) =>
  /\/ReelStripCell_C[1-5]_\d{2}$/.test(entity.path),
);
if (reelCells.length !== 170) {
  fail(`Expected 170 reel-strip cells, found ${reelCells.length}`);
}

const deprecatedSymbolTexts = entities.filter((entity) =>
  /\/ReelStripCell_C[1-5]_\d{2}\/Text_Symbol$/.test(entity.path),
);
if (deprecatedSymbolTexts.length !== 0) {
  fail(`Deprecated text symbol entities are still present: ${deprecatedSymbolTexts.length}`);
}

const reelSymbolSprites = entities.filter((entity) =>
  /\/ReelStripCell_C[1-5]_\d{2}\/Sprite_Symbol$/.test(entity.path),
);
if (reelSymbolSprites.length !== 170) {
  fail(`Expected 170 reel symbol sprites, found ${reelSymbolSprites.length}`);
}

const reelCellFrames = entities.filter((entity) =>
  /\/ReelStripCell_C[1-5]_\d{2}\/Sprite_CellFrame$/.test(entity.path),
);
if (reelCellFrames.length !== 170) {
  fail(`Expected 170 moving reel cell frames, found ${reelCellFrames.length}`);
}
for (const frameEntity of reelCellFrames) {
  const frame = frameEntity.jsonString["@components"].find((item) => item["@type"] === "MOD.Core.SpriteGUIRendererComponent");
  const transform = frameEntity.jsonString["@components"].find((item) => item["@type"] === "MOD.Core.UITransformComponent");
  if (frame.OverrideSorting !== false) {
    fail(`Reel cell frame must move inside its strip and mask context: ${frameEntity.path}`);
  }
  if (transform.RectSize.x !== 88 || transform.RectSize.y !== 74) {
    fail(`Unexpected reel cell frame size for ${frameEntity.path}: ${transform.RectSize.x}x${transform.RectSize.y}; expected 88x74`);
  }
  const expected = ruid("cellBlue");
  if (frame.ImageRUID?.DataId !== expected) {
    fail(`Unexpected reel cell frame RUID for ${frameEntity.path}: ${frame.ImageRUID?.DataId}; expected ${expected}`);
  }
}
const wildFrameColor = { r: 0.47843137254901963, g: 0.058823529411764705, b: 0.10588235294117647, a: 1 };
const wildFrameCount = reelCellFrames.filter((frameEntity) => {
  const frame = frameEntity.jsonString["@components"].find((item) => item["@type"] === "MOD.Core.SpriteGUIRendererComponent");
  return (
    Math.abs(frame.Color.r - wildFrameColor.r) < 0.001 &&
    Math.abs(frame.Color.g - wildFrameColor.g) < 0.001 &&
    Math.abs(frame.Color.b - wildFrameColor.b) < 0.001 &&
    Math.abs(frame.Color.a - wildFrameColor.a) < 0.001
  );
}).length;
if (wildFrameCount === 0) {
  fail("Expected at least one red Wild reel cell frame, found none");
}
for (const spriteEntity of reelSymbolSprites) {
  const symbol = spriteEntity.jsonString["@components"].find((item) => item["@type"] === "MOD.Core.SpriteGUIRendererComponent");
  const transform = spriteEntity.jsonString["@components"].find((item) => item["@type"] === "MOD.Core.UITransformComponent");
  if (symbol.OverrideSorting !== false) {
    fail(`Reel symbol must not override sorting outside its column mask: ${spriteEntity.path}`);
  }
  if (transform.RectSize.x !== 56 || transform.RectSize.y !== 56) {
    fail(`Unexpected symbol box for ${spriteEntity.path}: ${transform.RectSize.x}x${transform.RectSize.y}; expected 56x56`);
  }
}

const symbolIds = ["SLIME", "MUSHROOM", "PIG", "GOLEM", "PINK_BEAN", "WILD"];
const winVfxAnimationRuid = ruid("winGlowLoopFrame01");

const winCellVfxEntities = entities.filter((entity) =>
  /\/WinCellVFX_R[1-3]_C[1-5]$/.test(entity.path),
);
if (winCellVfxEntities.length !== 15) {
  fail(`Expected 15 win-cell VFX sprites, found ${winCellVfxEntities.length}`);
}
const winSymbolOverlayEntities = entities.filter((entity) =>
  /\/WinSymbol_R[1-3]_C[1-5]$/.test(entity.path),
);
if (winSymbolOverlayEntities.length !== 15) {
  fail(`Expected 15 win-symbol overlays, found ${winSymbolOverlayEntities.length}`);
}
for (let row = 1; row <= 3; row += 1) {
  for (let col = 1; col <= 5; col += 1) {
    const vfxPath = `Panel_LeftSlotMachine/ReelGrid_3x5/WinCellVFX_R${row}_C${col}`;
    expectRect(vfxPath, 96, 82);
    const vfx = getComponent(vfxPath, "MOD.Core.SpriteGUIRendererComponent");
    if (vfx.ImageRUID?.DataId !== winVfxAnimationRuid) {
      fail(`Unexpected win VFX animation RUID for ${vfxPath}: ${vfx.ImageRUID?.DataId}; expected ${winVfxAnimationRuid}`);
    }
    if (vfx.AnimClipPlayType !== 0 || vfx.PlayRate !== 1) {
      fail(`Win VFX must loop as a sprite animation for ${vfxPath}`);
    }
    if (vfx.OrderInLayer !== 52 || vfx.OverrideSorting !== true) {
      fail(`Unexpected win VFX sorting for ${vfxPath}: order=${vfx.OrderInLayer}, override=${vfx.OverrideSorting}; expected 52/true`);
    }
    const overlayPath = `Panel_LeftSlotMachine/ReelGrid_3x5/WinSymbol_R${row}_C${col}`;
    expectRect(overlayPath, 68, 68);
    const symbol = getComponent(overlayPath, "MOD.Core.SpriteGUIRendererComponent");
    if (!symbol.ImageRUID?.DataId) {
      fail(`Win-symbol overlay must have a default RUID before runtime data overrides it: ${overlayPath}`);
    }
    if (symbol.OrderInLayer !== 54 || symbol.OverrideSorting !== true) {
      fail(`Unexpected win-symbol overlay sorting for ${overlayPath}: order=${symbol.OrderInLayer}, override=${symbol.OverrideSorting}; expected 54/true`);
    }
  }
}
const serialized = JSON.stringify(ui);
for (const symbol of symbolIds) {
  if (!new RegExp(`${symbol}\\s*=\\s*\\{[^\\n]*resourcePath\\s*=`).test(runtime)) {
    fail(`Missing runtime symbol resource mapping for ${symbol}`);
  }
  if (!new RegExp(`${symbol}\\s*=\\s*\\{[^\\n]*winAnimationRuid\\s*=`).test(runtime)) {
    fail(`Missing runtime symbol win animation RUID mapping for ${symbol}`);
  }
}
if (!runtime.includes("symbolEntity.SpriteGUIRendererComponent.ImageRUID = symbolRuid")) {
  fail("Runtime does not apply table-driven win symbol overlay RUIDs");
}
if (!runtime.includes("symbolEntity.SpriteGUIRendererComponent.AnimClipPlayType = SpriteAnimClipPlayType.Loop")) {
  fail("Runtime does not force win symbol sprite animations to loop");
}
if (!runtime.includes("vfx.SpriteGUIRendererComponent.AnimClipPlayType = SpriteAnimClipPlayType.Loop")) {
  fail("Runtime does not force win VFX sprite animations to loop");
}
if (!runtime.includes("method table BuildWinVfxFrameRuids")) {
  fail("Runtime win VFX frame RUID table is missing");
}
for (let index = 1; index <= 8; index += 1) {
  const frameKey = `winGlowLoopFrame${String(index).padStart(2, "0")}`;
  if (!runtime.includes(ruid(frameKey))) {
    fail(`Runtime win VFX frame RUID is missing: ${frameKey}`);
  }
}
if (!runtime.includes("_TimerService:SetTimerRepeat(function()") || !runtime.includes("cell.vfxEntity.SpriteGUIRendererComponent.ImageRUID = frameRuid")) {
  fail("Runtime does not animate win VFX by cycling uploaded frame sprites");
}
if (!runtime.includes("_TimerService:ClearTimer(self.winVfxTimerId)")) {
  fail("Runtime does not clear the win VFX frame timer");
}
const coinAnimationFrames = Object.values(coinAnimationManifest.frames ?? {})
  .sort((left, right) => String(left.key).localeCompare(String(right.key)));
if (coinAnimationFrames.length !== coinAnimationManifest.frameCount) {
  fail(`Mileage coin manifest frame count mismatch: ${coinAnimationFrames.length}; expected ${coinAnimationManifest.frameCount}`);
}
if (!runtime.includes(`property string winSymbolAnimationClipRuid = "${coinAnimationManifest.animationClipRuid}"`)) {
  fail("Runtime mileage coin fallback is not keyed by the table AnimationClip RUID");
}
if (!runtime.includes(`property float winSymbolFrameInterval = ${coinAnimationManifest.frameDurationMs / 1000}`)) {
  fail("Runtime mileage coin fallback does not use the manifest frame duration");
}
if (!runtime.includes("method table BuildWinSymbolFrameRuids")) {
  fail("Runtime mileage coin fallback frame RUID table is missing");
}
for (const frame of coinAnimationFrames) {
  if (!runtime.includes(frame.ruid)) {
    fail(`Runtime mileage coin fallback frame RUID is missing: ${frame.key}`);
  }
}
if (
  !runtime.includes("method void StartWinSymbolFrameLoop()")
  || !runtime.includes("cell.winAnimationRuid == self.winSymbolAnimationClipRuid")
  || !runtime.includes("cell.symbolEntity.SpriteGUIRendererComponent.ImageRUID = frameRuid")
  || !runtime.includes("self:StartWinSymbolFrameLoop()")
) {
  fail("Runtime does not animate the mileage coin by cycling its uploaded frame sprites");
}
if (
  !runtime.includes("method void StopWinSymbolFrameLoop()")
  || !runtime.includes("_TimerService:ClearTimer(self.winSymbolFrameTimerId)")
  || !runtime.includes("self:StopWinSymbolFrameLoop()")
) {
  fail("Runtime does not clean up the mileage coin frame timer");
}
if (!runtime.includes("winAnimationRuid = winAnimationRuid,")) {
  fail("Runtime active win cells do not retain the table AnimationClip RUID for fallback selection");
}
const activateWinCellStart = runtime.indexOf("method void ActivateWinCell(integer rowIndex, integer col, string symbolId)");
const playWinCellStart = runtime.indexOf("method void PlayWinCellAnimation()", activateWinCellStart);
const activateWinCellMethod = activateWinCellStart >= 0 && playWinCellStart > activateWinCellStart
  ? runtime.slice(activateWinCellStart, playWinCellStart)
  : "";
const overlayDisableIndex = activateWinCellMethod.indexOf("symbolEntity.Enable = false");
const overlayConfigureIndex = activateWinCellMethod.indexOf("symbolEntity.SpriteGUIRendererComponent.AnimClipPlayType");
const overlayRuidIndex = activateWinCellMethod.indexOf("symbolEntity.SpriteGUIRendererComponent.ImageRUID = symbolRuid");
const overlayEnableIndex = activateWinCellMethod.indexOf("symbolEntity.Enable = true");
if (
  overlayDisableIndex < 0
  || overlayConfigureIndex <= overlayDisableIndex
  || overlayRuidIndex <= overlayConfigureIndex
  || overlayEnableIndex <= overlayRuidIndex
) {
  fail("Runtime win-symbol overlay must disable, configure, assign the RUID, then enable to restart playback");
}
if (runtime.includes("vfx.SpriteGUIRendererComponent.FillMethod = FillMethodType.Radial360")) {
  fail("Runtime still uses static radial-fill win VFX instead of sprite animation");
}

const spinButton = getComponent(
  "Panel_LeftSlotMachine/Button_Spin",
  "MOD.Core.ButtonComponent",
);
if (spinButton.Transition !== 2) fail(`Spin button Transition must be SpriteSwap (2)`);
const expectedSpinStates = {
  HighlightedSprite: ruid("slotSpinButtonHoverPressed"),
  PressedSprite: ruid("slotSpinButtonHoverPressed"),
  SelectedSprite: ruid("slotSpinButtonNormal"),
  DisabledSprite: ruid("slotSpinButtonDisabled"),
};
for (const [state, expected] of Object.entries(expectedSpinStates)) {
  const actual = spinButton.ImageRUIDs?.[state]?.DataId;
  if (actual !== expected) fail(`Unexpected Spin ${state}: ${actual}; expected ${expected}`);
}

const deprecatedStructuralRuids = [
  "c27b175134964fff934c66823381ffef",
  "ca824a7986924ee19f000c0a56ec3d32",
  "3edabcf6493e407eb99c7c590a8776a5",
  "bcf9ae94e58243ba91abee3c92712b5f",
  "a90a1b76261a44c49fcffec45bce238a",
  "1b9b158503e34a17a6b2f5d8a85a1501",
];
for (const value of deprecatedStructuralRuids) {
  if (serialized.includes(value)) fail(`Deprecated structural RUID is still active: ${value}`);
}

if (!runtime.includes("local slotWidth = 893.0")) {
  fail("Runtime responsive slot width is not 893");
}
if (!runtime.includes("local slotHeight = 1020.0")) {
  fail("Runtime responsive slot height is not 1020");
}
if (!/method float GetCellHeight\(\)[\s\S]*?return 80\.0/.test(runtime)) {
  fail("Runtime reel cell height is not 80");
}
if (!runtime.includes("property any slotSymbols = nil")) {
  fail("Runtime slotSymbols data table is missing");
}
if (!runtime.includes("self.slotSymbols = self:BuildSlotSymbols()")) {
  fail("Runtime slotSymbols initialization is missing");
}
if (!runtime.includes("self.textTemplates = self:BuildTextTemplates()")) {
  fail("Runtime text template initialization is missing");
}
if (!runtime.includes('MultiplierLabel = "x{0}"')) {
  fail("Runtime multiplier label format string is missing");
}
if (!runtime.includes('WinLineFormula = "x {0}"') || !runtime.includes('WinTotalFormula = "= {0}"')) {
  fail("Runtime win result formula strings are missing");
}
if (!runtime.includes("if selectedBaseBet ~= self.baseBet then") || !runtime.includes("self:ResetWinHighlights()")) {
  fail("Runtime does not reset win presentation when BaseBet changes");
}
if (!runtime.includes("self.multiplierOptions = self:BuildMultiplierOptions()")) {
  fail("Runtime multiplier option format string initialization is missing");
}
if (runtime.includes('label.Text = "x" .. tostring(index)')) {
  fail("Runtime multiplier label still uses hardcoded concatenation");
}
if (!/BaseBetLabel\s*=\s*"\{0\}\s*-\s*\{1\}[^"]*"/.test(runtime)) {
  fail("Runtime BaseBet label template is missing");
}
if (!runtime.includes("method string FormatTemplate")) {
  fail("Runtime string template formatter is missing");
}
if (!runtime.includes("local costUnits = self.baseBet * self.multiplier * self.coinUnitPerCoin")) {
  fail("Runtime spin cost must be BaseBet * Multiplier only");
}
if (runtime.includes("local costUnits = self.baseBet * self.multiplier * activePaylineCount * self.coinUnitPerCoin")) {
  fail("Runtime spin cost still multiplies active payline count");
}
if (runtime.includes("costCountsAsLine = true")) {
  fail("Runtime paylines still mark active lines as extra cost lines");
}
if (!runtime.includes("method table BuildBaseReelCellSymbolTable()")) {
  fail("Runtime base reel cell symbol table is missing");
}
if (!runtime.includes("method table GetCurrentReelStrips()")) {
  fail("Runtime BaseBet-specific reel strip accessor is missing");
}
if (!runtime.includes("method void RefreshReelStripResources()")) {
  fail("Runtime reel-strip resource refresh method is missing");
}
if (!runtime.includes("self.reelStrips[self.baseBet]")) {
  fail("Runtime reel strips are not grouped by current BaseBet");
}
if (!runtime.includes("cellData.idleSpriteRuid") || !runtime.includes("renderer.ImageRUID = imageRuid")) {
  fail("Runtime does not assign ReelStrips cell resource RUIDs to reel renderers");
}
if (!runtime.includes("method table GetCurrentPaytableTenths()") || !runtime.includes("currentPaytableTenths[targetSymbol]")) {
  fail("Runtime does not evaluate paytable by current BaseBet group");
}
if (runtime.includes("#self.reelStrips[col]") || runtime.includes("self.reelStrips[col]")) {
  fail("Runtime still indexes reel strips without the current BaseBet group");
}
if (!runtime.includes("self:ApplyWinPresentation(result.lineWins)")) {
  fail("Runtime win presentation application is missing");
}
if (!runtime.includes("method boolean IsWildSymbol") || !runtime.includes("symbolData.isWild == true")) {
  fail("Runtime Wild substitution helper is missing");
}
if (!runtime.includes("self:ShowWinResult(result.lineWins, result.payoutUnits)")) {
  fail("Runtime formatted win result UI flow is missing");
}
if (!runtime.includes("method table BuildScreenSprayVfxConfig")) {
  fail("Runtime screen spray VFX config builder is missing");
}
if (!runtime.includes("b21f6d1b6d8d4c5ebe36b6d5b4503553")) {
  fail("Runtime screen spray animation RUID is missing");
}
if (!runtime.includes("method table BuildBonusSlotRules") || !runtime.includes("initialChanceCount = 5")) {
  fail("Runtime 777 bonus slot rules are missing or initial chances are not data-driven");
}
if (!runtime.includes("method table BuildBonusSlotPaytable") || !runtime.includes("[7] = { resultKey = \"777\", rewardMultiplier = 777, extraChanceCount = 1")) {
  fail("Runtime 777 bonus slot paytable is missing the 777 extra chance rule");
}
if (!runtime.includes("method boolean IsBonusSlotLineTrigger") || !runtime.includes("bonusSlotTriggerLineCount")) {
  fail("Runtime does not detect Wild x5 bonus slot triggers");
}
if (!runtime.includes("method table ResolveBonusSlot") || !runtime.includes("self.baseBet * self.multiplier * rewardMultiplier * self.coinUnitPerCoin")) {
  fail("Runtime does not resolve 777 bonus payouts from data multipliers");
}
if (!runtime.includes("self:ApplyBonusSlotResult(result)") || !runtime.includes("self:FormatBonusSlotStatus(result.bonusSlotResult)")) {
  fail("Runtime spin flow does not apply or display the 777 bonus slot result");
}
if (
  !runtime.includes("method void PlayBonus777Presentation(table bonusSlotResult)") ||
  !runtime.includes("self:PlayBonus777Presentation(result.bonusSlotResult)") ||
  !runtime.includes("self.bonus777Panel.Enable = true") ||
  !runtime.includes("local targetDigits = spin.digits") ||
  !runtime.includes("self:PlayBonus777ReelSpin(targetDigits)") ||
  !runtime.includes("method table BuildBonus777ReelPlans(table targetDigits)") ||
  !runtime.includes("method table BuildBonus777LeverFrameRuids()") ||
  !runtime.includes("self:PlayBonus777LeverPullDown()") ||
  !runtime.includes("self:PlayBonus777LeverReturnUp()") ||
  !runtime.includes("self.bonus777LeverRenderer.ImageRUID = frameRuid") ||
  !runtime.includes("method table BuildBonus777LeverFramePositions()") ||
  !runtime.includes("self.bonus777LeverTransform.anchoredPosition = framePosition") ||
  !runtime.includes("method void MoveBonus777ReelDown(integer reelIndex, float pixelDelta)") ||
  !runtime.includes("method void UpdateBonus777LeverPull(float elapsed)")
) {
  fail("Runtime 777 bonus slot overlay presentation flow or moving-strip lever presentation is missing");
}
if (runtime.includes("self:SetBonus777DigitsFromResultKey(resultKey)")) {
  fail("Runtime 777 bonus slot must not swap digits after the reels have stopped");
}
if (!runtime.includes("runtimeBuildKind = \"TEST_SANDBOX\"") || !runtime.includes("method boolean IsBonusSlotTestCheatAllowed")) {
  fail("Runtime 777 test cheat build-kind guard is missing");
}
if (!runtime.includes("method table BuildBonusSlotTestCheatSpinResult") || !runtime.includes("return self:BuildBonusSlotTestCheatSpinResult()")) {
  fail("Runtime 777 test cheat must force the next visible spin result to Wild x5");
}
if (runtime.includes("result.bonusSlotTriggerLineCount = minTriggerLineCount")) {
  fail("Runtime 777 test cheat must not bypass Wild x5 by editing the bonus trigger count directly");
}
if (!runtime.includes("testCheatForceResultKey = \"777\"") || !runtime.includes("self:BuildForcedBonusSlotDigits(testCheatForceResultKey)")) {
  fail("Runtime 777 test cheat does not force the sandbox result through data");
}
if (!runtime.includes("bonusSlotTestCheatRemaining") || !runtime.includes("self.bonusSlotTestCheatRemaining = math.max(0")) {
  fail("Runtime 777 test cheat use count is not consumed");
}
if (!runtime.includes("fourPlusLineWinCount") || !runtime.includes("fivePlusLineWinCount")) {
  fail("Runtime does not expose MatchCount >= 4/5 win counters");
}
if (!runtime.includes("method boolean ShouldPlayScreenSprayVfx") || !runtime.includes("self:PlayScreenSprayVfxOnce()")) {
  fail("Runtime screen spray trigger flow is missing");
}
if (!runtime.includes('self:SetBonus777Texts("HIT "') || !runtime.includes('self:PlayScreenSprayVfxOnce()\n                wait(0.85)')) {
  fail("Runtime 777 bonus must play the screen spray once for every winning bonus spin");
}
if (!runtime.includes("(result.bonusSlotResult == nil or result.bonusSlotResult.triggered ~= true) and self:ShouldPlayScreenSprayVfx(result)")) {
  fail("Runtime must not replay the screen spray after the 777 bonus presentation completes");
}
if (!runtime.includes("SpriteAnimClipPlayType.Onetime")) {
  fail("Runtime screen spray VFX must play once, not loop");
}
if (!runtime.includes("_TimerService:SetTimerOnce(function()") || !runtime.includes("_TimerService:ClearTimer(self.screenSprayVfxTimerId)")) {
  fail("Runtime screen spray VFX timer cleanup is missing");
}
if (runtime.includes("if row[index] ~= first then")) {
  fail("Runtime line evaluation still requires strict same-symbol matches and cannot handle Wild substitution");
}
if (runtime.includes("self.winHighlights[col].Enable = true")) {
  fail("Runtime still enables center-line column highlights for row-specific wins");
}
if (runtime.includes("method void ApplySymbolWinAnimation")) {
  fail("Runtime still contains code-driven symbol win scaling; symbol wins should use sprite animation resources");
}
if (runtime.includes("method void ApplyWinVfxFrame")) {
  fail("Runtime still contains code-driven win VFX scaling; win VFX should use sprite animation resources");
}
if (!runtime.includes("method void SetVisibleWinBaseSymbolAlpha")) {
  fail("Runtime does not expose a helper for hiding the visible base reel symbol under a winning overlay");
}
if (!runtime.includes("self:SetVisibleWinBaseSymbolAlpha(rowIndex, col, 0.0)")) {
  fail("Runtime does not hide the normal SymbolResourceRuid sprite for winning cells");
}
if (!runtime.includes("self:SetVisibleWinBaseSymbolAlpha(cell.rowIndex, cell.col, 1.0)")) {
  fail("Runtime does not restore hidden base reel symbols when win presentation resets");
}
if (runtime.includes("DRAGON") || runtime.includes("Dragon")) {
  fail("Runtime still contains Dragon symbol references; jackpot symbol should be PINK_BEAN");
}
if (!runtime.includes('PINK_BEAN = { id = "PINK_BEAN"')) {
  fail("Runtime Pink Bean symbol mapping is missing");
}
if (!runtime.includes('WILD = { id = "WILD"') || !runtime.includes("isWild = true")) {
  fail("Runtime Wild symbol mapping is missing");
}
if (
  !runtime.includes(
    `WILD = { id = "WILD", payout3 = 0, payout4 = 0, payout5 = 0, resourcePath = "${coinAnimationManifest.sourceRuid}", winAnimationRuid = "${coinAnimationManifest.animationClipRuid}"`,
  )
) {
  fail("Runtime Wild symbol does not use the table-driven mileage coin resources");
}
const wildReelCellResources = [...runtime.matchAll(
  /symbolId = "WILD", idleSpriteRuid = "([^"]*)", winAnimationRuid = "([^"]*)"/g,
)];
if (wildReelCellResources.length === 0) {
  fail("Runtime reel strips contain no Wild resource rows");
}
for (const match of wildReelCellResources) {
  if (match[1] !== "" || match[2] !== "") {
    fail("Runtime Wild reel cells must inherit SlotSymbols RUIDs instead of overriding them");
  }
}
for (const animationId of ["BOUNCE", "POP", "WOBBLE", "SHAKE", "FLASH"]) {
  if (!runtime.includes(`winAnimation = "${animationId}"`)) {
    fail(`Runtime symbol win animation mapping is missing: ${animationId}`);
  }
}
if (!runtime.includes("button.SpriteGUIRendererComponent.Color = Color(1.00, 1.00, 1.00, 0.01)")) {
  fail("Runtime multiplier button parent is not near-transparent click-only UI");
}
if (!runtime.includes("fill.SpriteGUIRendererComponent.Color = Color(0.10, 0.42, 0.85, 0.96)")) {
  fail("Runtime selected multiplier fill color is not the requested blue/gold palette tint");
}
if (!runtime.includes("glow.Enable = true") || !runtime.includes("glow.Enable = false")) {
  fail("Runtime selected multiplier glow enable/disable logic is missing");
}
if (runtime.includes("button.SpriteGUIRendererComponent.Color = Color(0.93, 0.12, 0.08, 1)")) {
  fail("Runtime selected multiplier color still uses the old red tint");
}
if (runtime.includes("fill.SpriteGUIRendererComponent.Color = Color(0.72, 0.08, 0.06, 0.96)")) {
  fail("Runtime selected multiplier fill still uses the old red tint");
}
if (runtime.includes("button.SpriteGUIRendererComponent.Color = Color(0.95, 0.32, 0.06, 1)")) {
  fail("Runtime selected Base Bet row still uses the red/orange tint");
}
if (runtime.includes("button.SpriteGUIRendererComponent.Color = Color(1.00, 0.78, 0.20, 1)")) {
  fail("Runtime selected multiplier color still tints the border gold");
}

const requiredBindings = [
  "premiumText",
  "commonText",
  "baseBetText",
  "winResultPanel",
  "winResultIcon1",
  "winResultIcon3",
  "winResultText1",
  "winResultText3",
  "winResultTotalText",
  "screenSprayVfxEntity",
  "screenSprayVfxRenderer",
  "bonus777Panel",
  "bonus777ReelText1",
  "bonus777ReelText2",
  "bonus777ReelText3",
  "bonus777ChanceText",
  "bonus777ResultText",
  "bonus777ReelStripTransform1",
  "bonus777ReelStripTransform2",
  "bonus777ReelStripTransform3",
  "bonus777LeverTransform",
  "bonus777LeverRenderer",
  "spinButton",
  "multiplierButton1",
  "multiplierButton5",
  "multiplierFill1",
  "multiplierFill5",
  "multiplierGlow1",
  "multiplierGlow5",
  "multiplierLabel1",
  "multiplierLabel5",
  "reelStripTransform1",
  "reelStripTransform5",
  "reelCellSymbolC1I01",
  "reelCellSymbolC5I34",
  "winHighlight1",
  "winHighlight5",
];
for (const binding of requiredBindings) {
  if (!new RegExp(`property\\s+\\S+\\s+${binding}\\s*=`).test(runtime)) {
    fail(`Missing runtime binding property: ${binding}`);
  }
}

function runtimeProperty(name) {
  const match = runtime.match(new RegExp(`property\\s+(\\S+)\\s+${name}\\s*=\\s*"([^"]*)"`));
  if (!match) fail(`Missing runtime binding property: ${name}`);
  return { type: match[1], value: match[2] };
}

function expectBinding(name, relativePath, expectedType = null) {
  const fullPath = `${root}/${relativePath}`;
  const entity = entityRecordByPath.get(fullPath);
  if (!entity) fail(`Missing UI entity for binding ${name}: ${fullPath}`);
  const prop = runtimeProperty(name);
  if (expectedType !== null && prop.type !== expectedType) {
    fail(`Unexpected property type for ${name}: ${prop.type}; expected ${expectedType}`);
  }
  if (prop.value !== entity.id) {
    fail(`Stale runtime binding for ${name}: ${prop.value}; expected ${entity.id} (${fullPath})`);
  }
}

expectBinding("premiumText", "TopHUD_Currency/Text_PremiumCoinAmount");
expectBinding("commonText", "TopHUD_Currency/Text_CommonCoinAmount");
expectBinding("baseBetText", "Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet/Text_BaseBetValue");
expectBinding("statusText", "Panel_LeftSlotMachine/Text_SlotStatus");
expectBinding("winResultPanel", "Panel_LeftSlotMachine/Panel_WinResult", "Entity");
for (let index = 1; index <= 3; index += 1) {
  expectBinding(`winResultLine${index}`, `Panel_LeftSlotMachine/Panel_WinResult/Line_${index}`, "Entity");
  expectBinding(`winResultIcon${index}`, `Panel_LeftSlotMachine/Panel_WinResult/Line_${index}/Icon`, "SpriteGUIRendererComponent");
  expectBinding(`winResultText${index}`, `Panel_LeftSlotMachine/Panel_WinResult/Line_${index}/Text`, "TextComponent");
}
expectBinding("winResultTotalText", "Panel_LeftSlotMachine/Panel_WinResult/Text_Total", "TextComponent");
expectBinding("screenSprayVfxEntity", "ScreenSprayVFX_Fullscreen", "Entity");
expectBinding("screenSprayVfxRenderer", "ScreenSprayVFX_Fullscreen", "SpriteGUIRendererComponent");
expectBinding("bonus777Panel", "Panel_Bonus777_Hidden", "Entity");
expectBinding("bonus777ReelText1", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_1/Panel_Bonus777ReelStrip_1/DigitCell_04/Text_Digit", "TextComponent");
expectBinding("bonus777ReelText2", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_2/Panel_Bonus777ReelStrip_2/DigitCell_04/Text_Digit", "TextComponent");
expectBinding("bonus777ReelText3", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_3/Panel_Bonus777ReelStrip_3/DigitCell_04/Text_Digit", "TextComponent");
expectBinding("bonus777ChanceText", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Chance", "TextComponent");
expectBinding("bonus777ResultText", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Result", "TextComponent");
expectBinding("bonus777ReelStripTransform1", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_1/Panel_Bonus777ReelStrip_1", "UITransformComponent");
expectBinding("bonus777ReelStripTransform2", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_2/Panel_Bonus777ReelStrip_2", "UITransformComponent");
expectBinding("bonus777ReelStripTransform3", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_3/Panel_Bonus777ReelStrip_3", "UITransformComponent");
expectBinding("bonus777LeverTransform", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Sprite_Lever", "UITransformComponent");
expectBinding("bonus777LeverRenderer", "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Sprite_Lever", "SpriteGUIRendererComponent");
expectBinding("devCheatButton", "Button_DevCheatMenu", "Entity");
expectBinding("devCheatPanel", "Panel_DevCheat_Hidden", "Entity");
expectBinding("devCheatInput", "Panel_DevCheat_Hidden/Input_CheatCode", "TextInputComponent");
expectBinding("devCheatApplyButton", "Panel_DevCheat_Hidden/Button_ApplyCheat", "Entity");
expectBinding("devCheatStatusText", "Panel_DevCheat_Hidden/Text_Status", "TextComponent");
for (let index = 1; index <= 12; index += 1) {
  expectBinding(
    `devCheatListItem${index}`,
    `Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands/Item_CheatCommand_${index}`,
    "Entity",
  );
}
expectBinding("topHudTransform", "TopHUD_Currency");
expectBinding("slotPanelTransform", "Panel_LeftSlotMachine");
expectBinding("battleHudTransform", "BattleHUD_Right");
expectBinding("baseBetButton", "Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet", "Entity");
expectBinding("baseBetListPanel", "Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden", "Entity");
for (let index = 1; index <= 10; index += 1) {
  expectBinding(
    `baseBetOptionButton${index}`,
    `Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_${index}`,
    "Entity",
  );
}
expectBinding("spinButton", "Panel_LeftSlotMachine/Button_Spin", "Entity");
for (let index = 1; index <= 5; index += 1) {
  expectBinding(
    `multiplierButton${index}`,
    `Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}`,
    "Entity",
  );
  expectBinding(
    `multiplierFill${index}`,
    `Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Fill_Background`,
    "Entity",
  );
  expectBinding(
    `multiplierGlow${index}`,
    `Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Selected_Glow`,
    "Entity",
  );
  expectBinding(
    `multiplierLabel${index}`,
    `Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${index}/Text_Label`,
    "TextComponent",
  );
  expectBinding(
    `reelStripTransform${index}`,
    `Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C${index}/ReelStrip_C${index}`,
  );
  expectBinding(
    `winHighlight${index}`,
    `Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C${index}/WinHighlight_C${index}`,
    "Entity",
  );
  for (let displayIndex = 1; displayIndex <= 34; displayIndex += 1) {
    const displaySuffix = String(displayIndex).padStart(2, "0");
    expectBinding(
      `reelCellSymbolC${index}I${displaySuffix}`,
      `Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C${index}/ReelStrip_C${index}/ReelStripCell_C${index}_${displaySuffix}/Sprite_Symbol`,
      "SpriteGUIRendererComponent",
    );
  }
}
for (let row = 1; row <= 3; row += 1) {
  for (let col = 1; col <= 5; col += 1) {
    expectBinding(
      `winCellVfxR${row}C${col}`,
      `Panel_LeftSlotMachine/ReelGrid_3x5/WinCellVFX_R${row}_C${col}`,
      "Entity",
    );
    expectBinding(
      `winSymbolR${row}C${col}`,
      `Panel_LeftSlotMachine/ReelGrid_3x5/WinSymbol_R${row}_C${col}`,
      "Entity",
    );
  }
}

for (const snippet of [
  "method table BuildCheatCommands()",
  "method table BuildBonusSlotTestCheatSpinResult()",
  "method void ConnectDevCheatUi()",
  "method void OnDevCheatButtonDown(UITouchDownEvent event)",
  "method integer GetDevCheatListIndex(Entity entity)",
  "method void OnDevCheatListItemClicked(ButtonClickEvent event)",
  "method void OnDevCheatInputSubmit(TextInputSubmitEvent event)",
  "method boolean ApplyCheatCommand(table command)",
  "self.devCheatVisibleCommands[visibleIndex] = command",
  "self.devCheatInput.Text = command.code or \"\"",
  "self.bonusSlotTestCheatRemaining = 0",
  "command.cheatType == \"FORCE_777_BONUS_ONCE\"",
]) {
  if (!runtime.includes(snippet)) {
    fail(`Runtime missing dev cheat flow snippet: ${snippet}`);
  }
}
if (runtime.includes("displayName =")) {
  fail("Runtime CheatCommands must not carry a DisplayName/displayName field");
}

for (const snippet of [
  'PremiumAmount = "{0}",',
  'CommonAmount = "{0}",',
  "(screenWidth - 80.0) / 740.0",
  "18.0 + (88.0 * hudScale) + 36.0",
]) {
  if (!runtime.includes(snippet)) {
    fail(`Runtime missing top currency HUD snippet: ${snippet}`);
  }
}

console.log(`Validated ${entities.length} UI entities.`);
console.log(`Validated 5 reel columns, ${reelCells.length} reel-strip cells, and ${reelSymbolSprites.length} monster symbol sprites.`);
console.log(`Validated ${winCellVfxEntities.length} win-cell glow sprites, ${winSymbolOverlayEntities.length} symbol animation overlays, screen spray VFX, and the resource-backed 777 bonus overlay.`);
console.log("Validated layered RUIDs, split bottom-panel RUIDs, and Spin SpriteSwap states.");
console.log("Validated responsive dimensions, top currency HUD resources, runtime cell height, and current runtime bindings.");
