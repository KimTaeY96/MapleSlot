"use strict";

const fs = require("fs");
const path = require("path");
const { UIBuilder, colorDict } = require("C:/Users/ghddj/Desktop/AI/MSW/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const outputPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const runtimePath = path.join(projectRoot, "RootDesk", "MyDesk", "SlotMachine", "SlotMachineRuntime.mlua");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const resourceManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function manifestRuid(key) {
  const ruid = resourceManifest[key]?.ruid;
  if (!ruid) {
    throw new Error(`Missing MSW resource RUID for ${key} in ${manifestPath}`);
  }
  return ruid;
}

const CASINO_UI_RUIDS = {
  mainPanel: "637248687ada4e45b2ab4882f4763257",
  reelFrame: "48a496fc054542eebf9c177f0b38a229",
  hudPanel: "747efdda9e98478cb54c7aac431da554",
  currencyBar: "f3e3b3f00fc34012bab90aecb84a8a54",
  dropdown: "54d92389927a4acd817173cc7c7bfd8e",
  dropdownList: "f322a2f674b54448a2481008b6b8f4a9",
  cellBlue: "1cd9fefcb2be4824a94bfd317ae14796",
  cellGold: "bfcf94b32aad48c7bc9397ad1e4b9b2b",
  buttonBlue: "43d1ee446e5f4acdb177552304a7510c",
  buttonBlueSelected: "1789926c39df416ab73a52a888288440",
  buttonBlueDisabled: "4e17250041bf4edcb8d7b9af137cbb2d",
  buttonGreen: "7717c567dd3242a580e75973c2c5a617",
  controlsPanel: "c9a80ebd798344cc854634e404c6731e",
  cabinetBackplateRectsafe: "ca824a7986924ee19f000c0a56ec3d32",
  reelFrameRectsafe: "2decb65569a743b4bfc3e99d15e03688",
  controlsPanelRectsafe: "5421cf8d66234665a3d9d906b74c3b0e",
  buttonGreenRectsafe: "a90a1b76261a44c49fcffec45bce238a",
  reelFrameCleanRectsafe: "3edabcf6493e407eb99c7c590a8776a5",
  controlsPanelCleanRectsafe: "bcf9ae94e58243ba91abee3c92712b5f",
  winGlow: "c57e42b4256c4816ad2d6fa657f67185",
  slotLayerCabinetFrame: manifestRuid("slotLayerCabinetFrame"),
  slotLayerTopEmblem: manifestRuid("slotLayerTopEmblem"),
  slotLayerReelWindowFrame: manifestRuid("slotLayerReelWindowFrame"),
  slotLayerReelColumnBackground: manifestRuid("slotLayerReelColumnBackground"),
  slotLayerInfoPanel: manifestRuid("slotLayerInfoPanel"),
  slotSpinButtonNormal: manifestRuid("slotSpinButtonNormal"),
  slotSpinButtonHoverPressed: manifestRuid("slotSpinButtonHoverPressed"),
  slotSpinButtonDisabled: manifestRuid("slotSpinButtonDisabled"),
  slotBottomPanelEmpty: manifestRuid("slotBottomPanelEmpty"),
  slotBottomPanelWideBox: manifestRuid("slotBottomPanelWideBox"),
  slotBottomPanelSmallBox: manifestRuid("slotBottomPanelSmallBox"),
  slotWideCabinetFrame: manifestRuid("slotWideCabinetFrame"),
  slotWideReelWindowFrame: manifestRuid("slotWideReelWindowFrame"),
  slotWideBottomPanelEmpty: manifestRuid("slotWideBottomPanelEmpty"),
  slotWideBottomPanelWideBox: manifestRuid("slotWideBottomPanelWideBox"),
  slotWideDropdownList: manifestRuid("slotWideDropdownList"),
  slotWideTitleOrnament: manifestRuid("slotWideTitleOrnament"),
  slotWideBaseBetMultiplierDivider: manifestRuid("slotWideBaseBetMultiplierDivider"),
  slotWideMultiplierSelectedGlow: manifestRuid("slotWideMultiplierSelectedGlow"),
  winGlowLoop: manifestRuid("winGlowLoop"),
  winGlowLoopFrame01: manifestRuid("winGlowLoopFrame01"),
};
const UI_FONT_MAPLE = 1;
const SLOT_PANEL_WIDTH = 893;
const SLOT_PANEL_HEIGHT = 1020;
const SLOT_INNER_WIDTH = 791;
const SLOT_INTERIOR_WIDTH = 689;
const REEL_GRID_WIDTH = 791;
const REEL_COLUMN_MASK_WIDTH = 116;
const REEL_COLUMN_BG_WIDTH = 96;
const REEL_CELL_FRAME_WIDTH = 88;
const REEL_CELL_FRAME_HEIGHT = 74;
const REEL_VERTICAL_SAFE_PADDING_UNIT = (REEL_COLUMN_MASK_WIDTH - REEL_CELL_FRAME_WIDTH) / 2;
const REEL_VERTICAL_SAFE_PADDING = REEL_VERTICAL_SAFE_PADDING_UNIT * 2;
const REEL_VISIBLE_CELL_SPAN = REEL_CELL_FRAME_HEIGHT + 80 * 2;
const REEL_COLUMN_HEIGHT = REEL_VISIBLE_CELL_SPAN + REEL_VERTICAL_SAFE_PADDING * 2;
const REEL_COLUMN_STEP = 150;
const REEL_SYMBOL_SIZE = 56;
const REEL_FRAME_HEIGHT = REEL_COLUMN_HEIGHT + 60;
const REEL_FRAME_Y = -316;
const REEL_GRID_Y = -356;
const BET_ROW_PANEL_Y = -650;
const BET_ROW_PANEL_HEIGHT = 170;
const BET_ROW_BASE_X = 76;
const BET_ROW_BASE_WIDTH = 270;
const BET_ROW_BASE_HEIGHT = 54;
const BET_ROW_LIST_WIDTH = BET_ROW_BASE_WIDTH;
const BET_ROW_DIVIDER_X = 380;
const BET_ROW_DIVIDER_Y = -8;
const BET_ROW_DIVIDER_HEIGHT = 88;
const BET_ROW_MULTIPLIER_X = 420;
const BET_ROW_MULTIPLIER_BUTTON_COUNT = 5;
const BET_ROW_MULTIPLIER_BUTTON_SIZE = 55;
const BET_ROW_MULTIPLIER_BUTTON_GAP = 58;
const BET_ROW_MULTIPLIER_WIDTH =
  BET_ROW_MULTIPLIER_BUTTON_SIZE + (BET_ROW_MULTIPLIER_BUTTON_COUNT - 1) * BET_ROW_MULTIPLIER_BUTTON_GAP;
const BET_ROW_TITLE_Y = -42;
const BET_ROW_ORNAMENT_Y = -54;
const BET_ROW_CONTROL_Y = -22;
const BET_ROW_LIST_BOTTOM_Y = BET_ROW_PANEL_HEIGHT / 2 + BET_ROW_CONTROL_Y + BET_ROW_BASE_HEIGHT / 2;
const Z = {
  interior: 0,
  topEmblem: 10,
  cabinetFrame: 20,
  reels: 30,
  reelFrame: 40,
  winHighlight: 50,
  controls: 60,
  spin: 70,
  dropdown: 200,
  confirm: 210,
  topHud: 300,
};

const b = new UIBuilder("UIRoot_TestSandbox_MainPlay", 1, true);

const SLOT_SYMBOL_TABLE = {
  SLIME: {
    resourcePath: "3d49a57487b44ccab1063900cf3aa8cd",
    searchQuery: "*slime",
    winAnimation: "BOUNCE",
  },
  MUSHROOM: {
    resourcePath: "f49d748a481d4dc496148df59b22d90e",
    searchQuery: "*mushroom",
    winAnimation: "POP",
  },
  PIG: {
    resourcePath: "5f9d9ec91b85404bbb5fcc83d26c5c1c",
    searchQuery: "*pig",
    winAnimation: "WOBBLE",
  },
  GOLEM: {
    resourcePath: "2ef159c2e9f646ae96fcf6c5101c25dc",
    searchQuery: "*golem",
    winAnimation: "SHAKE",
  },
  PINK_BEAN: {
    resourcePath: "fdb9c7763b5145f78830d98931bc7727",
    searchQuery: "*pinkbean",
    winAnimation: "FLASH",
  },
  WILD: {
    resourcePath: CASINO_UI_RUIDS.slotLayerTopEmblem,
    searchQuery: "*wild",
    winAnimation: "FLASH",
  },
};
const SLOT_SYMBOL_IDS = Object.keys(SLOT_SYMBOL_TABLE);
const SLOT_SYMBOL_RESOURCES = SLOT_SYMBOL_TABLE;
const WIN_VFX_ANIMATION_RUID = CASINO_UI_RUIDS.winGlowLoopFrame01;
const DEFAULT_CELL_FRAME_COLOR = "#FFFFFF";
const WILD_CELL_FRAME_COLOR = "#7A0F1B";
const REEL_STRIP_PATTERN_TABLE = [
  ["SLIME", "MUSHROOM", "WILD", "PIG", "GOLEM", "PINK_BEAN"],
  ["MUSHROOM", "PIG", "SLIME", "WILD", "PINK_BEAN", "GOLEM"],
  ["PIG", "SLIME", "GOLEM", "MUSHROOM", "WILD", "PINK_BEAN"],
  ["GOLEM", "SLIME", "WILD", "MUSHROOM", "PINK_BEAN", "PIG"],
  ["PINK_BEAN", "PIG", "MUSHROOM", "WILD", "SLIME", "GOLEM"],
];
const REEL_CELL_SYMBOL_TABLE = REEL_STRIP_PATTERN_TABLE.map((pattern) =>
  Array.from({ length: Math.ceil(30 / pattern.length) }, () => pattern).flat().slice(0, 30)
);
const WIN_CELL_ROWS = [
  { row: 1, y: 80 },
  { row: 2, y: 0 },
  { row: 3, y: -80 },
];

function winCellVfxPropName(row, col) {
  return `winCellVfxR${row}C${col}`;
}

function winSymbolPropName(row, col) {
  return `winSymbolR${row}C${col}`;
}

function winCellVfxPath(row, col) {
  return `/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/WinCellVFX_R${row}_C${col}`;
}

function winSymbolPath(row, col) {
  return `/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/WinSymbol_R${row}_C${col}`;
}

function reelCellSymbolRendererPropName(reelNo, displayIndex) {
  return `reelCellSymbolC${reelNo}I${String(displayIndex).padStart(2, "0")}`;
}

function reelCellSymbolRendererPath(reelNo, displayIndex) {
  return `/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C${reelNo}/ReelStrip_C${reelNo}/ReelStripCell_C${reelNo}_${String(displayIndex).padStart(2, "0")}/Sprite_Symbol`;
}

function reelCellFrameRendererPropName(reelNo, displayIndex) {
  return `reelCellFrameC${reelNo}I${String(displayIndex).padStart(2, "0")}`;
}

function reelCellFrameRendererPath(reelNo, displayIndex) {
  return `/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C${reelNo}/ReelStrip_C${reelNo}/ReelStripCell_C${reelNo}_${String(displayIndex).padStart(2, "0")}/Sprite_CellFrame`;
}

function reelCellSymbolId(reelNo, virtualIndex) {
  const strip = REEL_CELL_SYMBOL_TABLE[reelNo - 1];
  const logicalIndex = ((virtualIndex - 1) % strip.length + strip.length) % strip.length;
  return strip[logicalIndex];
}

function cellFrameColorForSymbol(symbolId) {
  return symbolId === "WILD" ? WILD_CELL_FRAME_COLOR : DEFAULT_CELL_FRAME_COLOR;
}

function buildWinRuntimeBindings() {
  const bindings = {};
  for (let row = 1; row <= 3; row += 1) {
    for (let col = 1; col <= 5; col += 1) {
      bindings[winCellVfxPropName(row, col)] = winCellVfxPath(row, col);
      bindings[winSymbolPropName(row, col)] = winSymbolPath(row, col);
    }
  }
  return bindings;
}

function buildReelCellSymbolRuntimeBindings() {
  const bindings = {};
  for (let reelNo = 1; reelNo <= 5; reelNo += 1) {
    for (let displayIndex = 1; displayIndex <= 34; displayIndex += 1) {
      bindings[reelCellSymbolRendererPropName(reelNo, displayIndex)] = reelCellSymbolRendererPath(reelNo, displayIndex);
    }
  }
  return bindings;
}

function buildReelCellFrameRuntimeBindings() {
  const bindings = {};
  for (let reelNo = 1; reelNo <= 5; reelNo += 1) {
    for (let displayIndex = 1; displayIndex <= 34; displayIndex += 1) {
      bindings[reelCellFrameRendererPropName(reelNo, displayIndex)] = reelCellFrameRendererPath(reelNo, displayIndex);
    }
  }
  return bindings;
}

function buildReelCellFrameRuntimeBindingProperties() {
  const lines = [];
  for (let reelNo = 1; reelNo <= 5; reelNo += 1) {
    for (let displayIndex = 1; displayIndex <= 34; displayIndex += 1) {
      lines.push(`    property SpriteGUIRendererComponent ${reelCellFrameRendererPropName(reelNo, displayIndex)} = ""`);
    }
  }
  return lines;
}

function buildDevCheatRuntimeBindingProperties() {
  const lines = [
    '    property Entity devCheatButton = ""',
    '    property Entity devCheatPanel = ""',
    '    property TextInputComponent devCheatInput = ""',
    '    property Entity devCheatApplyButton = ""',
    '    property TextComponent devCheatStatusText = ""',
  ];
  for (let index = 1; index <= 12; index += 1) {
    lines.push(`    property Entity devCheatListItem${index} = ""`);
  }
  return lines;
}

function buildBonus777RuntimeBindingProperties() {
  return [
    '    property Entity bonus777Panel = ""',
    '    property TextComponent bonus777ReelText1 = ""',
    '    property TextComponent bonus777ReelText2 = ""',
    '    property TextComponent bonus777ReelText3 = ""',
    '    property TextComponent bonus777ChanceText = ""',
    '    property TextComponent bonus777ResultText = ""',
    '    property UITransformComponent bonus777ReelStripTransform1 = ""',
    '    property UITransformComponent bonus777ReelStripTransform2 = ""',
    '    property UITransformComponent bonus777ReelStripTransform3 = ""',
    '    property UITransformComponent bonus777LeverTransform = ""',
  ];
}

function formatTemplate(template, values) {
  return values.reduce(
    (result, value, index) => result.replaceAll(`{${index}}`, String(value)),
    template,
  );
}

function ensureRuntimeBindingProperties() {
  const requiredProps = [
    '    property Entity winResultPanel = ""',
    '    property Entity winResultLine1 = ""',
    '    property Entity winResultLine2 = ""',
    '    property Entity winResultLine3 = ""',
    '    property SpriteGUIRendererComponent winResultIcon1 = ""',
    '    property SpriteGUIRendererComponent winResultIcon2 = ""',
    '    property SpriteGUIRendererComponent winResultIcon3 = ""',
    '    property TextComponent winResultText1 = ""',
    '    property TextComponent winResultText2 = ""',
    '    property TextComponent winResultText3 = ""',
    '    property TextComponent winResultTotalText = ""',
    ...buildReelCellFrameRuntimeBindingProperties(),
    ...buildDevCheatRuntimeBindingProperties(),
    ...buildBonus777RuntimeBindingProperties(),
  ];
  let runtime = fs.readFileSync(runtimePath, "utf8");
  const missingProps = requiredProps.filter((line) => {
    const propName = line.match(/property\s+\S+\s+(\S+)/)?.[1];
    return propName && !new RegExp(`\\bproperty\\s+\\S+\\s+${propName}\\s*=`).test(runtime);
  });
  if (missingProps.length === 0) {
    return;
  }

  const marker = /    property TextComponent statusText = "[^"]*"\r?\n/;
  if (!marker.test(runtime)) {
    throw new Error(`Could not insert win-result runtime binding properties in ${runtimePath}`);
  }
  runtime = runtime.replace(marker, (match) => `${match}${missingProps.join("\n")}\n`);
  fs.writeFileSync(runtimePath, runtime, "utf8");
}

const PREMIUM_AMOUNT_TEMPLATE = "Premium {0}";
const COMMON_AMOUNT_TEMPLATE = "Common {0}";
const MULTIPLIER_LABEL_TEMPLATE = "x{0}";
const BASE_BET_CONFIRM_LOCK_TEMPLATE = "Apply new Base Bet? Lock starts for {0}.";
const BASE_BET_CONFIRM_LOCK_TIME = "05:00";

function bg(name, color, alpha = 1, options = {}) {
  b.sprite(`${name}/Bg`, {
    anchor: "stretch",
    color,
    alpha,
    image_ruid: options.image_ruid,
    sprite_type: options.sprite_type ?? 0,
    raycast: false,
    sorting_layer: options.sorting_layer,
    order_in_layer: options.order_in_layer,
    override_sorting: options.override_sorting,
  });
}

function tint(name, color, alpha = 1) {
  b.patchComponent(name, "MOD.Core.SpriteGUIRendererComponent", {
    Color: colorDict(color, alpha),
  });
}

function label(pathName, text, options = {}) {
  b.text(pathName, text, {
    color: options.color || "#F7F5E8",
    size: options.size || 24,
    bold: options.bold || false,
    alignment: options.alignment ?? 4,
    anchor: options.anchor || "middle-center",
    pos: options.pos || [0, 0],
    rect_size: options.rect_size || [240, 44],
    outline: options.outline ?? false,
    overflow: options.overflow ?? 2,
    bestfit: options.bestfit ?? false,
    min_size: options.min_size ?? 12,
    max_size: options.max_size ?? (options.size || 24),
    sorting_layer: options.sorting_layer,
    order_in_layer: options.order_in_layer,
    override_sorting: options.override_sorting,
  });
  b.patchComponent(pathName, "MOD.Core.TextComponent", {
    Font: options.font ?? UI_FONT_MAPLE,
    UseOutLine: options.use_outline ?? false,
    OutlineColor: options.outline_color ? colorDict(options.outline_color, options.outline_alpha ?? 1) : colorDict("#000000", 1),
    OutlineWidth: options.outline_width ?? 1,
    DropShadow: options.drop_shadow ?? false,
    DropShadowAngle: options.drop_shadow_angle ?? 315,
    DropShadowDistance: options.drop_shadow_distance ?? 2,
    DropShadowColor: options.drop_shadow_color ? colorDict(options.drop_shadow_color, options.drop_shadow_alpha ?? 0.72) : colorDict("#000000", 0.72),
  });
}

function labelOrnament(pathName, options = {}) {
  const centerX = options.pos?.[0] ?? 0;
  const centerY = options.pos?.[1] ?? 0;
  const width = options.width ?? 170;
  b.sprite(pathName, {
    anchor: options.anchor || "top-left",
    pos: [centerX, centerY],
    rect_size: [width, 28],
    color: "#FFFFFF",
    alpha: options.alpha ?? 1,
    image_ruid: CASINO_UI_RUIDS.slotWideTitleOrnament,
    raycast: false,
    sorting_layer: options.sorting_layer,
    order_in_layer: options.order_in_layer,
    override_sorting: options.override_sorting,
  });
}

function titleBackdrop(pathName, options = {}) {
  b.sprite(pathName, {
    anchor: options.anchor || "top-left",
    pos: options.pos || [0, 0],
    rect_size: options.rect_size || [128, 30],
    color: options.color || "#071338",
    alpha: options.alpha ?? 0.92,
    sprite_type: 1,
    raycast: false,
    sorting_layer: options.sorting_layer,
    order_in_layer: options.order_in_layer,
    override_sorting: options.override_sorting,
  });
}

function styledButton(pathName, text, options = {}) {
  const buttonOptions = {
    anchor: options.anchor || "middle-center",
    pos: options.pos || [0, 0],
    rect_size: options.rect_size || [110, 88],
    font_size: options.font_size || 24,
    color: options.text_color || "#F7F5E8",
    sorting_layer: options.sorting_layer,
    order_in_layer: options.order_in_layer,
    override_sorting: options.override_sorting,
  };
  if (options.image_ruid) {
    buttonOptions.image_ruid = options.image_ruid;
  }
  b.button(pathName, text, buttonOptions);
  tint(pathName, options.color || "#E9D77B", options.alpha ?? 1);
  b.patchComponent(pathName, "MOD.Core.SpriteGUIRendererComponent", {
    Type: options.sprite_type ?? (options.image_ruid ? 0 : 1),
  });
  b.patchComponent(pathName, "MOD.Core.TextComponent", {
    Font: options.font ?? UI_FONT_MAPLE,
    Overflow: 2,
    BestFit: options.bestfit ?? true,
    MinSize: options.min_size ?? 14,
    MaxSize: options.max_size ?? (options.font_size || 24),
  });
}

function multiplierButton(pathName, text, options = {}) {
  const rectSize = options.rect_size || [54, 56];
  const fillSize = options.fill_size || [Math.max(28, rectSize[0] - 16), Math.max(28, rectSize[1] - 18)];
  const borderSize = options.border_size || rectSize;
  const glowSize = options.glow_size || [rectSize[0] + 12, rectSize[1] + 12];
  b.button(pathName, "", {
    anchor: options.anchor || "middle-left",
    pos: options.pos || [0, 0],
    rect_size: rectSize,
    font_size: 1,
    color: "#FFFFFF",
  });
  b.patchComponent(pathName, "MOD.Core.SpriteGUIRendererComponent", {
    Color: colorDict("#FFFFFF", 0.01),
    Type: 1,
  });
  b.patchComponent(pathName, "MOD.Core.TextComponent", {
    Text: "",
    FontSize: 1,
    FontColor: colorDict("#FFFFFF", 0),
  });
  b.sprite(`${pathName}/Selected_Glow`, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: glowSize,
    color: "#FFFFFF",
    alpha: options.selected ? 1 : 0,
    image_ruid: CASINO_UI_RUIDS.slotWideMultiplierSelectedGlow,
    raycast: false,
    sorting_layer: "UI",
    order_in_layer: (options.order_in_layer ?? Z.controls) + 1,
    override_sorting: true,
  });
  b.sprite(`${pathName}/Fill_Background`, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: fillSize,
    color: options.selected ? "#1A6BD8" : "#07112B",
    alpha: options.selected ? 0.96 : 0.9,
    sprite_type: 1,
    raycast: false,
    sorting_layer: "UI",
    order_in_layer: (options.order_in_layer ?? Z.controls) + 2,
    override_sorting: true,
  });
  b.sprite(`${pathName}/Border`, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: borderSize,
    color: "#FFFFFF",
    alpha: 1,
    image_ruid: CASINO_UI_RUIDS.slotBottomPanelSmallBox,
    raycast: false,
    sorting_layer: "UI",
    order_in_layer: (options.order_in_layer ?? Z.controls) + 3,
    override_sorting: true,
  });
  label(`${pathName}/Text_Label`, text, {
    anchor: "middle-center",
    pos: [0, -1],
    rect_size: [rectSize[0], 38],
    alignment: 4,
    size: 22,
    color: "#F7F5E8",
    bestfit: true,
    min_size: 14,
    max_size: 20,
    use_outline: true,
    outline_color: "#151012",
    outline_width: 1,
    drop_shadow: true,
    drop_shadow_distance: 2,
    drop_shadow_color: "#000000",
    sorting_layer: "UI",
    order_in_layer: (options.order_in_layer ?? Z.controls) + 4,
    override_sorting: true,
  });
}

// Top currency HUD.
b.panel("TopHUD_Currency", {
  anchor: "top-center",
  pos: [0, -18],
  rect_size: [780, 60],
});
bg("TopHUD_Currency", "#FFFFFF", 1, {
  image_ruid: CASINO_UI_RUIDS.currencyBar,
  sorting_layer: "UI",
  order_in_layer: Z.topHud,
  override_sorting: true,
});
b.sprite("TopHUD_Currency/Icon_PremiumCoin", {
  anchor: "middle-left",
  pos: [36, 0],
  rect_size: [42, 42],
  color: "#F5CE4A",
  sorting_layer: "UI",
  order_in_layer: Z.topHud + 1,
  override_sorting: true,
});
label("TopHUD_Currency/Text_PremiumCoinAmount", formatTemplate(PREMIUM_AMOUNT_TEMPLATE, [0]), {
  anchor: "middle-left",
  pos: [158, 0],
  rect_size: [220, 42],
  alignment: 3,
  size: 24,
  sorting_layer: "UI",
  order_in_layer: Z.topHud + 2,
  override_sorting: true,
});
b.sprite("TopHUD_Currency/Icon_CommonCoin", {
  anchor: "middle-left",
  pos: [442, 0],
  rect_size: [42, 42],
  color: "#80D3FF",
  sorting_layer: "UI",
  order_in_layer: Z.topHud + 1,
  override_sorting: true,
});
label("TopHUD_Currency/Text_CommonCoinAmount", formatTemplate(COMMON_AMOUNT_TEMPLATE, [0]), {
  anchor: "middle-left",
  pos: [568, 0],
  rect_size: [220, 42],
  alignment: 3,
  size: 24,
  sorting_layer: "UI",
  order_in_layer: Z.topHud + 2,
  override_sorting: true,
});

// Left slot machine panel, 40 percent of the 1920 reference width.
// Structure-first rule: the cabinet, reel frame, control deck, and buttons
// are separate image nodes. Do not bake live UI zones into one full bitmap.
b.panel("Panel_LeftSlotMachine", {
  anchor: "top-left",
  pos: [42, -112],
  rect_size: [SLOT_PANEL_WIDTH, SLOT_PANEL_HEIGHT],
});
b.sprite("Panel_LeftSlotMachine/Bg_CabinetInterior", {
  anchor: "top-center",
  pos: [0, -75],
  rect_size: [SLOT_INTERIOR_WIDTH, 870],
  color: "#050D36",
  alpha: 0.98,
  raycast: false,
  sorting_layer: "UI",
  order_in_layer: Z.interior,
  override_sorting: true,
});
b.sprite("Panel_LeftSlotMachine/Bg_CabinetFrame", {
  anchor: "top-center",
  pos: [0, 0],
  rect_size: [SLOT_PANEL_WIDTH, SLOT_PANEL_HEIGHT],
  color: "#FFFFFF",
  alpha: 1,
  image_ruid: CASINO_UI_RUIDS.slotWideCabinetFrame,
  raycast: false,
  sorting_layer: "UI",
  order_in_layer: Z.cabinetFrame,
  override_sorting: true,
});
b.sprite("Panel_LeftSlotMachine/Decoration_TopEmblem", {
  anchor: "top-center",
  pos: [0, -135],
  rect_size: [378.863, 185.586761],
  color: "#FFFFFF",
  alpha: 0.9,
  image_ruid: CASINO_UI_RUIDS.slotLayerTopEmblem,
  raycast: false,
  sorting_layer: "UI",
  order_in_layer: Z.topEmblem,
  override_sorting: true,
});

b.panel("Panel_LeftSlotMachine/ReelGrid_3x5", {
  anchor: "top-center",
  pos: [0, REEL_GRID_Y],
  rect_size: [REEL_GRID_WIDTH, REEL_COLUMN_HEIGHT],
});

const BASE_BET_LABEL_TEMPLATE = "{0} - {1} Coin";
const baseBetRows = [
  { regionName: "Henesys", bet: 1 },
  { regionName: "Ellinia", bet: 2 },
  { regionName: "Perion", bet: 3 },
  { regionName: "Kerning City", bet: 4 },
  { regionName: "Lith Harbor", bet: 5 },
  { regionName: "Sleepywood", bet: 6 },
  { regionName: "Orbis", bet: 7 },
  { regionName: "Ludibrium", bet: 8 },
  { regionName: "Aquarium", bet: 9 },
  { regionName: "Leafre", bet: 10 },
];
const baseBetLabels = baseBetRows.map(({ regionName, bet }) =>
  formatTemplate(BASE_BET_LABEL_TEMPLATE, [regionName, bet])
);
for (let c = 1; c <= 5; c += 1) {
  const columnName = `Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C${c}`;
  const x = (c - 3) * REEL_COLUMN_STEP;
  b.mask(columnName, {
    anchor: "middle-center",
    pos: [x, 0],
    rect_size: [REEL_COLUMN_MASK_WIDTH, REEL_COLUMN_HEIGHT],
    color: "#FFFFFF",
    alpha: 0,
  });
  b.sprite(`${columnName}/Bg_ReelColumn`, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [REEL_COLUMN_BG_WIDTH, REEL_COLUMN_HEIGHT],
    color: "#FFFFFF",
    alpha: 1,
    image_ruid: CASINO_UI_RUIDS.slotLayerReelColumnBackground,
    raycast: false,
  });

  const stripName = `${columnName}/ReelStrip_C${c}`;
  b.panel(stripName, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [REEL_COLUMN_BG_WIDTH, 2720],
  });

  // Add two wrap-buffer cells above and below the logical 30-cell strip.
  // Without these duplicates, the masked viewport can show blank space while
  // the runtime wraps from the first logical stop back to the last one.
  for (let virtualIndex = -1; virtualIndex <= 32; virtualIndex += 1) {
    const displayIndex = virtualIndex + 2;
    const cellName = `${stripName}/ReelStripCell_C${c}_${String(displayIndex).padStart(2, "0")}`;
    const y = (15.5 - virtualIndex) * 80;
    const symbolId = reelCellSymbolId(c, virtualIndex);
    const symbolData = SLOT_SYMBOL_TABLE[symbolId];
    b.panel(cellName, {
      anchor: "middle-center",
      pos: [0, y],
      rect_size: [REEL_COLUMN_BG_WIDTH, 80],
    });
    b.sprite(`${cellName}/Sprite_CellFrame`, {
      anchor: "middle-center",
      pos: [0, 0],
      rect_size: [REEL_CELL_FRAME_WIDTH, REEL_CELL_FRAME_HEIGHT],
      color: cellFrameColorForSymbol(symbolId),
      alpha: 1,
      image_ruid: CASINO_UI_RUIDS.cellBlue,
      raycast: false,
    });
    b.sprite(`${cellName}/Sprite_Symbol`, {
      anchor: "middle-center",
      pos: [0, 0],
      rect_size: [REEL_SYMBOL_SIZE, REEL_SYMBOL_SIZE],
      color: "#FFFFFF",
      alpha: 1,
      image_ruid: symbolData.resourcePath,
      preserve_aspect: true,
      raycast: false,
    });
  }

  b.sprite(`${columnName}/WinHighlight_C${c}`, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [108, 74],
    color: "#7DFFF4",
    alpha: 0.58,
  image_ruid: CASINO_UI_RUIDS.winGlow,
    raycast: false,
    sorting_layer: "UI",
    order_in_layer: Z.winHighlight,
    override_sorting: true,
  });
  b.patch(`${columnName}/WinHighlight_C${c}`, { enable: false });
}

for (const { row, y } of WIN_CELL_ROWS) {
  for (let col = 1; col <= 5; col += 1) {
    const x = (col - 3) * REEL_COLUMN_STEP;
    const vfxName = `Panel_LeftSlotMachine/ReelGrid_3x5/WinCellVFX_R${row}_C${col}`;
    b.sprite(vfxName, {
      anchor: "middle-center",
      pos: [x, y],
      rect_size: [96, 82],
      color: "#FFFFFF",
      alpha: 1,
      image_ruid: WIN_VFX_ANIMATION_RUID,
      preserve_aspect: false,
      raycast: false,
      sorting_layer: "UI",
      order_in_layer: Z.winHighlight + 2,
      override_sorting: true,
      enable: false,
    });
    b.patchComponent(vfxName, "MOD.Core.SpriteGUIRendererComponent", {
      AnimClipPlayType: 0,
      StartFrameIndex: 0,
      EndFrameIndex: 2147483647,
      PlayRate: 1,
      FillAmount: 1,
      FillMethod: 0,
      FillClockWise: true,
    });

    const symbolName = `Panel_LeftSlotMachine/ReelGrid_3x5/WinSymbol_R${row}_C${col}`;
    b.sprite(symbolName, {
      anchor: "middle-center",
      pos: [x, y],
      rect_size: [68, 68],
      color: "#FFFFFF",
      alpha: 1,
      image_ruid: SLOT_SYMBOL_TABLE.PINK_BEAN.resourcePath,
      preserve_aspect: true,
      raycast: false,
      sorting_layer: "UI",
      order_in_layer: Z.winHighlight + 4,
      override_sorting: true,
      enable: false,
    });
  }
}

b.sprite("Panel_LeftSlotMachine/ReelFrame_BG", {
  anchor: "top-center",
  pos: [0, REEL_FRAME_Y],
  rect_size: [SLOT_INNER_WIDTH, REEL_FRAME_HEIGHT],
  color: "#FFFFFF",
  alpha: 1,
  image_ruid: CASINO_UI_RUIDS.slotWideReelWindowFrame,
  raycast: false,
  sorting_layer: "UI",
  order_in_layer: Z.reelFrame,
  override_sorting: true,
});

b.panel("Panel_LeftSlotMachine/Panel_BetMultiplierRow", {
  anchor: "top-center",
  pos: [0, BET_ROW_PANEL_Y],
  rect_size: [SLOT_INNER_WIDTH, BET_ROW_PANEL_HEIGHT],
});
bg("Panel_LeftSlotMachine/Panel_BetMultiplierRow", "#FFFFFF", 1, {
  image_ruid: CASINO_UI_RUIDS.slotWideBottomPanelEmpty,
  sorting_layer: "UI",
  order_in_layer: Z.controls,
  override_sorting: true,
});
labelOrnament("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_BaseBetTitle", {
  anchor: "top-left",
  pos: [BET_ROW_BASE_X, BET_ROW_ORNAMENT_Y],
  width: BET_ROW_BASE_WIDTH,
  sorting_layer: "UI",
  order_in_layer: Z.controls + 4,
  override_sorting: true,
});
titleBackdrop("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Backdrop_BaseBetTitle", {
  anchor: "top-left",
  pos: [BET_ROW_BASE_X + (BET_ROW_BASE_WIDTH - 122) / 2, BET_ROW_TITLE_Y + 11],
  rect_size: [122, 28],
  sorting_layer: "UI",
  order_in_layer: Z.controls + 5,
  override_sorting: true,
});
label("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Text_BaseBetTitle", "Base Bet", {
  anchor: "top-left",
  pos: [BET_ROW_BASE_X, BET_ROW_TITLE_Y + 12],
  rect_size: [BET_ROW_BASE_WIDTH, 28],
  alignment: 4,
  size: 20,
  bold: true,
  color: "#FFE9A0",
  use_outline: true,
  outline_color: "#071338",
  outline_width: 1,
  drop_shadow: true,
  drop_shadow_distance: 2,
  drop_shadow_color: "#000000",
  sorting_layer: "UI",
  order_in_layer: Z.controls + 6,
  override_sorting: true,
});
styledButton("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet", "", {
  anchor: "middle-left",
  pos: [BET_ROW_BASE_X, BET_ROW_CONTROL_Y],
  rect_size: [BET_ROW_BASE_WIDTH, BET_ROW_BASE_HEIGHT],
  color: "#FFFFFF",
  text_color: "#F7F5E8",
  font_size: 20,
  image_ruid: CASINO_UI_RUIDS.slotWideBottomPanelWideBox,
  sorting_layer: "UI",
  order_in_layer: Z.controls + 10,
  override_sorting: true,
});
label("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet/Text_BaseBetValue", baseBetLabels[0], {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [BET_ROW_BASE_WIDTH - 64, 34],
  alignment: 4,
  size: 19,
  bestfit: true,
  min_size: 13,
  max_size: 19,
  bold: true,
  color: "#F7F5E8",
  use_outline: true,
  outline_color: "#151012",
  outline_width: 1,
  drop_shadow: true,
  drop_shadow_distance: 2,
  drop_shadow_color: "#000000",
  sorting_layer: "UI",
  order_in_layer: Z.controls + 11,
  override_sorting: true,
});

b.panel("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden", {
  anchor: "bottom-left",
  pos: [BET_ROW_BASE_X, BET_ROW_LIST_BOTTOM_Y],
  rect_size: [BET_ROW_LIST_WIDTH, 326],
  enable: false,
});
bg("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden", "#FFFFFF", 1, {
  image_ruid: CASINO_UI_RUIDS.slotWideDropdownList,
  sorting_layer: "UI",
  order_in_layer: Z.dropdown,
  override_sorting: true,
});
b.panel("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions", {
  anchor: "stretch",
});
b.patchComponent(
  "Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions",
  "MOD.Core.UITransformComponent",
  {
    OffsetMin: { x: 12, y: 10 },
    OffsetMax: { x: -12, y: -10 },
  },
);
b.addComponent(
  "Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions",
  "MOD.Core.ScrollLayoutGroupComponent",
  {
    Type: 1,
    Spacing: 6,
    ScrollBarVisible: 1,
    ScrollBarThickness: 12,
  },
);
b.addComponent(
  "Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions",
  "MOD.Core.MaskComponent",
  { Shape: 0 },
);
styledButton("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Item_BaseBetOption_Template", "Template", {
  anchor: "top-center",
  pos: [0, -24],
  rect_size: [BET_ROW_LIST_WIDTH - 44, 42],
  color: "#FFFFFF",
  text_color: "#F7F5E8",
  font_size: 17,
  image_ruid: CASINO_UI_RUIDS.slotWideBottomPanelWideBox,
  sorting_layer: "UI",
  order_in_layer: Z.dropdown + 2,
  override_sorting: true,
});
b.patch("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Item_BaseBetOption_Template", { enable: false });
for (let i = 1; i <= 10; i += 1) {
  styledButton(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_${i}`, baseBetLabels[i - 1], {
    anchor: "top-center",
    pos: [0, -24 - (i - 1) * 48],
    rect_size: [BET_ROW_LIST_WIDTH - 44, 42],
    color: i === 1 ? "#62D4FF" : "#FFFFFF",
    text_color: "#F8F1D5",
    font_size: 17,
    min_size: 13,
    max_size: 17,
    image_ruid: CASINO_UI_RUIDS.slotWideBottomPanelWideBox,
    sorting_layer: "UI",
    order_in_layer: Z.dropdown + 2,
    override_sorting: true,
  });
}
b.panel("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetConfirm_Hidden", {
  anchor: "middle-center",
  pos: [0, -4],
  rect_size: [760, 146],
  enable: false,
});
bg("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetConfirm_Hidden", "#121A4C", 0.98, {
  sorting_layer: "UI",
  order_in_layer: Z.confirm,
  override_sorting: true,
});
label("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetConfirm_Hidden/Text_BaseBetConfirmMessage", formatTemplate(BASE_BET_CONFIRM_LOCK_TEMPLATE, [BASE_BET_CONFIRM_LOCK_TIME]), {
  anchor: "top-center",
  pos: [0, -12],
  rect_size: [720, 34],
  size: 22,
  bestfit: true,
  min_size: 14,
  max_size: 22,
});
styledButton("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetConfirm_Hidden/Button_BaseBetConfirmApply", "Apply", {
  anchor: "bottom-center",
  pos: [-110, 10],
  rect_size: [190, 88],
  color: "#94E8B8",
  text_color: "#10131B",
  font_size: 24,
  image_ruid: CASINO_UI_RUIDS.buttonGreen,
});
styledButton("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetConfirm_Hidden/Button_BaseBetConfirmCancel", "Cancel", {
  anchor: "bottom-center",
  pos: [110, 10],
  rect_size: [190, 88],
  color: "#2B3A7A",
  font_size: 24,
  image_ruid: CASINO_UI_RUIDS.buttonBlue,
});

labelOrnament("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Ornament_MultiplierTitle", {
  anchor: "top-left",
  pos: [BET_ROW_MULTIPLIER_X, BET_ROW_ORNAMENT_Y],
  width: BET_ROW_MULTIPLIER_WIDTH,
  sorting_layer: "UI",
  order_in_layer: Z.controls + 4,
  override_sorting: true,
});
titleBackdrop("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Backdrop_MultiplierTitle", {
  anchor: "top-left",
  pos: [BET_ROW_MULTIPLIER_X + (BET_ROW_MULTIPLIER_WIDTH - 136) / 2, BET_ROW_TITLE_Y + 11],
  rect_size: [136, 28],
  sorting_layer: "UI",
  order_in_layer: Z.controls + 5,
  override_sorting: true,
});
label("Panel_LeftSlotMachine/Panel_BetMultiplierRow/Text_MultiplierTitle", "Multiplier", {
  anchor: "top-left",
  pos: [BET_ROW_MULTIPLIER_X, BET_ROW_TITLE_Y + 12],
  rect_size: [BET_ROW_MULTIPLIER_WIDTH, 28],
  alignment: 4,
  size: 20,
  bold: true,
  color: "#FFE9A0",
  use_outline: true,
  outline_color: "#071338",
  outline_width: 1,
  drop_shadow: true,
  drop_shadow_distance: 2,
  drop_shadow_color: "#000000",
  sorting_layer: "UI",
  order_in_layer: Z.controls + 6,
  override_sorting: true,
});
const dividerName = "Panel_LeftSlotMachine/Panel_BetMultiplierRow/Divider_BaseBetMultiplier";
b.sprite(dividerName, {
  anchor: "middle-left",
  pos: [BET_ROW_DIVIDER_X, BET_ROW_DIVIDER_Y],
  rect_size: [28, BET_ROW_DIVIDER_HEIGHT],
  color: "#FFFFFF",
  alpha: 1,
  image_ruid: CASINO_UI_RUIDS.slotWideBaseBetMultiplierDivider,
  raycast: false,
  sorting_layer: "UI",
  order_in_layer: Z.controls + 12,
  override_sorting: true,
});
for (let i = 1; i <= 5; i += 1) {
  multiplierButton(`Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x${i}`, formatTemplate(MULTIPLIER_LABEL_TEMPLATE, [i]), {
    anchor: "middle-left",
    pos: [BET_ROW_MULTIPLIER_X + (i - 1) * BET_ROW_MULTIPLIER_BUTTON_GAP, BET_ROW_CONTROL_Y],
    selected: i === 1,
    rect_size: [BET_ROW_MULTIPLIER_BUTTON_SIZE, BET_ROW_MULTIPLIER_BUTTON_SIZE],
    order_in_layer: Z.controls + 20,
  });
}
styledButton("Panel_LeftSlotMachine/Button_Spin", "SPIN", {
  anchor: "bottom-center",
  pos: [0, 56],
  rect_size: [304, 100],
  color: "#FFFFFF",
  text_color: "#FFFFFF",
  font_size: 30,
  image_ruid: CASINO_UI_RUIDS.slotSpinButtonNormal,
  sorting_layer: "UI",
  order_in_layer: Z.spin,
  override_sorting: true,
});
b.patchComponent("Panel_LeftSlotMachine/Button_Spin", "MOD.Core.ButtonComponent", {
  Transition: 2,
  ImageRUIDs: {
    HighlightedSprite: { DataId: CASINO_UI_RUIDS.slotSpinButtonHoverPressed },
    PressedSprite: { DataId: CASINO_UI_RUIDS.slotSpinButtonHoverPressed },
    SelectedSprite: { DataId: CASINO_UI_RUIDS.slotSpinButtonNormal },
    DisabledSprite: { DataId: CASINO_UI_RUIDS.slotSpinButtonDisabled },
  },
});
b.patchComponent("Panel_LeftSlotMachine/Button_Spin", "MOD.Core.TextComponent", {
  FontColor: colorDict("#FFE9A0", 1),
  UseOutLine: true,
  OutlineColor: colorDict("#2B1808", 1),
  OutlineWidth: 2,
  DropShadow: true,
  DropShadowAngle: 315,
  DropShadowDistance: 3,
  DropShadowColor: colorDict("#000000", 0.75),
});
label("Panel_LeftSlotMachine/Text_SlotStatus", "", {
  anchor: "bottom-center",
  pos: [0, 164],
  rect_size: [360, 28],
  alignment: 4,
  size: 19,
  bold: true,
  bestfit: true,
  min_size: 14,
  max_size: 19,
  color: "#FFE9A0",
  use_outline: true,
  outline_color: "#2B1808",
  outline_width: 2,
  drop_shadow: true,
  drop_shadow_alpha: 0.72,
  sorting_layer: "UI",
  order_in_layer: Z.spin - 1,
  override_sorting: true,
});
b.panel("Panel_LeftSlotMachine/Panel_WinResult", {
  anchor: "bottom-center",
  pos: [0, 164],
  rect_size: [760, 28],
  enable: false,
});
const winResultLineGroups = [
  { name: "Line_1", x: -256 },
  { name: "Line_2", x: -160 },
  { name: "Line_3", x: -64 },
];
for (const group of winResultLineGroups) {
  b.panel(`Panel_LeftSlotMachine/Panel_WinResult/${group.name}`, {
    anchor: "middle-right",
    pos: [group.x, 0],
    rect_size: [88, 28],
    enable: false,
  });
  b.sprite(`Panel_LeftSlotMachine/Panel_WinResult/${group.name}/Icon`, {
    anchor: "middle-left",
    pos: [0, 0],
    rect_size: [22, 22],
    color: "#FFFFFF",
    alpha: 1,
    image_ruid: SLOT_SYMBOL_TABLE.SLIME.resourcePath,
    raycast: false,
    sorting_layer: "UI",
    order_in_layer: Z.spin - 1,
    override_sorting: true,
  });
  label(`Panel_LeftSlotMachine/Panel_WinResult/${group.name}/Text`, "", {
    anchor: "middle-left",
    pos: [26, 0],
    rect_size: [62, 24],
    alignment: 3,
    size: 17,
    bold: true,
    bestfit: true,
    min_size: 12,
    max_size: 17,
    color: "#FFE9A0",
    use_outline: true,
    outline_color: "#2B1808",
    outline_width: 2,
    drop_shadow: true,
    drop_shadow_alpha: 0.72,
    sorting_layer: "UI",
    order_in_layer: Z.spin - 1,
    override_sorting: true,
  });
}
label("Panel_LeftSlotMachine/Panel_WinResult/Text_Total", "", {
  anchor: "middle-right",
  pos: [-50, 0],
  rect_size: [60, 24],
  alignment: 5,
  size: 18,
  bold: true,
  bestfit: true,
  min_size: 12,
  max_size: 18,
  color: "#FFFFFF",
  use_outline: true,
  outline_color: "#2B1808",
  outline_width: 2,
  drop_shadow: true,
  drop_shadow_alpha: 0.72,
  sorting_layer: "UI",
  order_in_layer: Z.spin - 1,
  override_sorting: true,
});

// Lightweight combat HUD only. The actual battle area remains the world map.
b.panel("BattleHUD_Right", {
  anchor: "top-right",
  pos: [-240, -154],
  rect_size: [430, 132],
});
bg("BattleHUD_Right", "#FFFFFF", 1, { image_ruid: CASINO_UI_RUIDS.hudPanel });
label("BattleHUD_Right/Header_HuntingGroundTier", "Hunting Ground Tier 1", {
  anchor: "top-center",
  pos: [0, -28],
  rect_size: [390, 38],
  size: 23,
  bold: true,
});

b.panel("BattleHUD_Right/HPBar_Player", {
  anchor: "middle-center",
  pos: [0, -10],
  rect_size: [370, 40],
});
bg("BattleHUD_Right/HPBar_Player", "#11141C", 0.94);
b.sprite("BattleHUD_Right/HPBar_Player/Fill_HP", {
  anchor: "stretch",
  color: "#57D17C",
  alpha: 1,
});
label("BattleHUD_Right/HPBar_Player/Text_HPValue", "HP 100 / 100", {
  rect_size: [350, 36],
  size: 22,
  bold: true,
});
label("BattleHUD_Right/Text_DeathPenaltyCountdown", "Respawn --:--", {
  anchor: "bottom-center",
  pos: [0, 20],
  rect_size: [320, 38],
  alignment: 4,
  size: 24,
  color: "#F2C94C",
});
b.panel("BattleHUD_Right/Overlay_CombatPaused_Hidden", {
  anchor: "middle-center",
  pos: [0, -10],
  rect_size: [390, 76],
  enable: false,
});
bg("BattleHUD_Right/Overlay_CombatPaused_Hidden", "#090A0D", 0.74);
label("BattleHUD_Right/Overlay_CombatPaused_Hidden/Text_Label", "COMBAT PAUSED", {
  rect_size: [340, 42],
  size: 26,
  bold: true,
});

// The reel strips intentionally place most cells outside the visible mask.
// ui_lint treats those masked strip cells as off-canvas errors, so this generator
// uses explicit read-side checks after writing instead of builder lint.
ensureRuntimeBindingProperties();
b.write(outputPath, {
  lint: false,
  strict: false,
  lint_verbose: false,
  bind: {
    mlua: runtimePath,
    props: {
      premiumText: "/ui/UIRoot_TestSandbox_MainPlay/TopHUD_Currency/Text_PremiumCoinAmount",
      commonText: "/ui/UIRoot_TestSandbox_MainPlay/TopHUD_Currency/Text_CommonCoinAmount",
      baseBetText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet/Text_BaseBetValue",
      statusText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Text_SlotStatus",
      winResultPanel: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult",
      winResultLine1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_1",
      winResultLine2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_2",
      winResultLine3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_3",
      winResultIcon1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_1/Icon",
      winResultIcon2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_2/Icon",
      winResultIcon3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_3/Icon",
      winResultText1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_1/Text",
      winResultText2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_2/Text",
      winResultText3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Line_3/Text",
      winResultTotalText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_WinResult/Text_Total",
      topHudTransform: "/ui/UIRoot_TestSandbox_MainPlay/TopHUD_Currency",
      slotPanelTransform: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine",
      battleHudTransform: "/ui/UIRoot_TestSandbox_MainPlay/BattleHUD_Right",
      baseBetButton: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Dropdown_BaseBet",
      baseBetListPanel: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden",
      baseBetOptionButton1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_1",
      baseBetOptionButton2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_2",
      baseBetOptionButton3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_3",
      baseBetOptionButton4: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_4",
      baseBetOptionButton5: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_5",
      baseBetOptionButton6: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_6",
      baseBetOptionButton7: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_7",
      baseBetOptionButton8: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_8",
      baseBetOptionButton9: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_9",
      baseBetOptionButton10: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Panel_BaseBetList_Above_Hidden/Scroll_BaseBetOptions/Item_BaseBetOption_10",
      spinButton: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Button_Spin",
      multiplierButton1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x1",
      multiplierButton2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x2",
      multiplierButton3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x3",
      multiplierButton4: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x4",
      multiplierButton5: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x5",
      multiplierFill1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x1/Fill_Background",
      multiplierFill2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x2/Fill_Background",
      multiplierFill3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x3/Fill_Background",
      multiplierFill4: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x4/Fill_Background",
      multiplierFill5: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x5/Fill_Background",
      multiplierGlow1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x1/Selected_Glow",
      multiplierGlow2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x2/Selected_Glow",
      multiplierGlow3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x3/Selected_Glow",
      multiplierGlow4: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x4/Selected_Glow",
      multiplierGlow5: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x5/Selected_Glow",
      multiplierLabel1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x1/Text_Label",
      multiplierLabel2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x2/Text_Label",
      multiplierLabel3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x3/Text_Label",
      multiplierLabel4: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x4/Text_Label",
      multiplierLabel5: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/Panel_BetMultiplierRow/Button_Multiplier_x5/Text_Label",
      reelStripTransform1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C1/ReelStrip_C1",
      reelStripTransform2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C2/ReelStrip_C2",
      reelStripTransform3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C3/ReelStrip_C3",
      reelStripTransform4: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C4/ReelStrip_C4",
      reelStripTransform5: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C5/ReelStrip_C5",
      winHighlight1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C1/WinHighlight_C1",
      winHighlight2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C2/WinHighlight_C2",
      winHighlight3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C3/WinHighlight_C3",
      winHighlight4: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C4/WinHighlight_C4",
      winHighlight5: "/ui/UIRoot_TestSandbox_MainPlay/Panel_LeftSlotMachine/ReelGrid_3x5/ReelColumn_C5/WinHighlight_C5",
      ...buildReelCellSymbolRuntimeBindings(),
      ...buildReelCellFrameRuntimeBindings(),
      ...buildWinRuntimeBindings(),
    },
  },
});
console.log(`Created ${outputPath}`);

require("./patch_dev_cheat_ui.cjs");
require("./patch_bonus777_overlay_ui.cjs");
