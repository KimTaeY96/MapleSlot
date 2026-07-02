"use strict";

const fs = require("fs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = `${projectRoot}/ui/UIRoot_TestSandbox_MainPlay.ui`;
const manifestPath = `${projectRoot}/GeneratedAssets/SlotMachineUI/msw_resource_manifest.json`;
const runtimePath = `${projectRoot}/RootDesk/MyDesk/SlotMachine/SlotMachineRuntime.mlua`;

const ui = JSON.parse(fs.readFileSync(uiPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const runtime = fs.readFileSync(runtimePath, "utf8");
const entities = ui.ContentProto.Entities;
const entityRecordByPath = new Map(entities.map((entity) => [entity.path, entity]));
const byPath = new Map(entities.map((entity) => [entity.path, entity.jsonString]));
const root = "/ui/UIRoot_TestSandbox_MainPlay";

function fail(message) {
  throw new Error(message);
}

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

expectRect("Panel_LeftSlotMachine", 893, 1020);
expectRect("Panel_LeftSlotMachine/Bg_CabinetFrame", 893, 1020);
expectRect("Panel_LeftSlotMachine/Bg_CabinetInterior", 689, 938);
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
expectRect("Panel_LeftSlotMachine/Panel_WinResult/Text_Total", 82, 24);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Divider_BaseBetMultiplier", 28, 88);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_BaseBetTitle", 270, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Backdrop_BaseBetTitle", 122, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_MultiplierTitle", 287, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Backdrop_MultiplierTitle", 136, 28);
expectRect("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet/Text_BaseBetValue", 206, 34);

expectPosition("Panel_LeftSlotMachine/Decoration_TopEmblem", 0, -135);
expectPosition("Panel_LeftSlotMachine/Bg_CabinetInterior", 0, -84);
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
expectPosition("Panel_LeftSlotMachine/Panel_WinResult/Text_Total", -20, 0);
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
expectSpriteOrder("Panel_LeftSlotMachine/Bg_CabinetInterior", 0);
expectSpriteOrder("Panel_LeftSlotMachine/Decoration_TopEmblem", 10);
expectSpriteOrder("Panel_LeftSlotMachine/Bg_CabinetFrame", 20);
expectSpriteOrder("Panel_LeftSlotMachine/ReelFrame_BG", 40);
expectSpriteOrder("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Bg", 60);
expectSpriteOrder("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Bg", 200);
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
if (!runtime.includes('WinLineFormula = "x{0} {1}"') || !runtime.includes('WinTotalFormula = "= {0}"')) {
  fail("Runtime win result formula strings are missing");
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

console.log(`Validated ${entities.length} UI entities.`);
console.log(`Validated 5 reel columns, ${reelCells.length} reel-strip cells, and ${reelSymbolSprites.length} monster symbol sprites.`);
console.log(`Validated ${winCellVfxEntities.length} win-cell glow sprites and ${winSymbolOverlayEntities.length} symbol animation overlays.`);
console.log("Validated layered RUIDs, split bottom-panel RUIDs, and Spin SpriteSwap states.");
console.log("Validated responsive dimensions, runtime cell height, and current runtime bindings.");
