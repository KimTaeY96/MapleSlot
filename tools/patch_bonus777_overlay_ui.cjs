const fs = require("fs");
const path = require("path");
const { UIBuilder, colorDict } = require("C:/Users/ghddj/Desktop/AI/MSW/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const runtimePath = path.join(projectRoot, "RootDesk", "MyDesk", "SlotMachine", "SlotMachineRuntime.mlua");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const structurePath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "bonus777", "bonus777_slot_ui_structure.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const structure = JSON.parse(fs.readFileSync(structurePath, "utf8"));

const ROOT = "Panel_Bonus777_Hidden";
const SLOT = `${ROOT}/Panel_Bonus777SlotRoot`;
const DIGIT_CELL_COUNT = structure.reels.visualCellCount;
const DIGIT_MIN = 1;
const DIGIT_MAX = structure.reels.logicalDigitCount;
const CELL_HEIGHT = structure.reels.cellHeight;
const Z = {
  dim: 440,
  shell: 450,
  reelBg: 452,
  reelText: 454,
  frame: 458,
  lever: 464,
  text: 470,
};

const bonus777Props = [
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
  '    property SpriteGUIRendererComponent bonus777LeverRenderer = ""',
];

function ensureRuntimeBindingProperties() {
  let runtime = fs.readFileSync(runtimePath, "utf8");
  const missing = bonus777Props.filter((line) => {
    const propName = line.match(/property\s+\S+\s+(\S+)/)?.[1];
    return propName && !new RegExp(`\\bproperty\\s+\\S+\\s+${propName}\\s*=`).test(runtime);
  });
  if (missing.length === 0) return;

  const marker = /    property UITransformComponent bonus777LeverTransform = "[^"]*"\r?\n/;
  if (!marker.test(runtime)) {
    throw new Error(`Could not insert 777 bonus runtime binding properties in ${runtimePath}`);
  }
  runtime = runtime.replace(marker, (match) => `${match}${missing.join("\n")}\n`);
  fs.writeFileSync(runtimePath, runtime, "utf8");
}

function asset(name) {
  const entry = structure.assets.find((item) => item.name === name);
  if (!entry) throw new Error(`Missing 777 slot structure asset: ${name}`);
  const ruid = manifest[entry.resourceKey]?.ruid;
  if (!ruid) throw new Error(`Missing 777 slot manifest RUID: ${entry.resourceKey}`);
  return { ...entry, ruid };
}

function pairPosition(index) {
  const offset = (index - 1) * 2;
  return [structure.reels.positions[offset], structure.reels.positions[offset + 1]];
}

function displaySize(entry) {
  return [entry.displaySize.width, entry.displaySize.height];
}

function uiPosition(entry) {
  return [entry.uiPosition.x, entry.uiPosition.y];
}

function addRect(b, pathName, options = {}) {
  b.sprite(pathName, {
    anchor: options.anchor ?? "middle-center",
    pos: options.pos ?? [0, 0],
    rect_size: options.rect_size ?? [100, 100],
    color: options.color ?? "#FFFFFF",
    alpha: options.alpha ?? 1,
    sprite_type: 1,
    raycast: options.raycast ?? false,
    sorting_layer: "UI",
    order_in_layer: options.order_in_layer ?? Z.reelBg,
    override_sorting: true,
  });
}

function addSprite(b, pathName, entry, order, options = {}) {
  b.sprite(pathName, {
    anchor: "middle-center",
    pos: options.pos ?? uiPosition(entry),
    rect_size: options.rect_size ?? displaySize(entry),
    image_ruid: options.image_ruid ?? entry.ruid,
    preserve_aspect: options.preserve_aspect ?? true,
    raycast: false,
    sorting_layer: "UI",
    order_in_layer: order,
    override_sorting: true,
  });
}

function addText(b, pathName, text, options = {}) {
  b.text(pathName, text, {
    anchor: options.anchor ?? "middle-center",
    pos: options.pos ?? [0, 0],
    rect_size: options.rect_size ?? [200, 44],
    size: options.size ?? 24,
    color: options.color ?? "#FFFFFF",
    alignment: options.alignment ?? 4,
    bold: options.bold ?? false,
    bestfit: options.bestfit ?? true,
    min_size: options.min_size ?? 12,
    max_size: options.max_size ?? options.size ?? 24,
    outline: options.outline ?? false,
    outline_color: options.outline_color ?? "#2B1608",
    outline_width: options.outline_width ?? 1,
    sorting_layer: "UI",
    order_in_layer: options.order_in_layer ?? Z.text,
    override_sorting: true,
  });
  b.patchComponent(pathName, "MOD.Core.TextComponent", {
    Font: 1,
    DropShadow: options.drop_shadow ?? true,
    DropShadowAngle: 315,
    DropShadowDistance: options.drop_shadow_distance ?? 2,
    DropShadowColor: colorDict("#000000", options.drop_shadow_alpha ?? 0.45),
    Padding: options.padding ?? { left: 0, right: 0, top: 0, bottom: 0 },
    Overflow: 2,
  });
}

function digitForVirtualIndex(virtualIndex) {
  return ((((virtualIndex - DIGIT_MIN) % DIGIT_MAX) + DIGIT_MAX) % DIGIT_MAX) + DIGIT_MIN;
}

const assets = {
  frameShell: asset("bonus777_slot_frame_shell"),
  reelWindowFrame: asset("bonus777_slot_reel_window_frame"),
  reelColumnBackground: asset("bonus777_slot_reel_column_background"),
  digitCell: asset("bonus777_slot_digit_cell"),
  leverUp: asset("bonus777_slot_lever_up"),
  leverBase: asset("bonus777_slot_lever_base"),
  leverArmUp: asset("bonus777_slot_lever_arm_up"),
};

const b = UIBuilder.load(uiPath);
for (const staleRoot of [ROOT, "Panel_ClassicSlotMachine_Hidden"]) {
  try {
    b.remove(staleRoot);
  } catch (error) {
    if (!String(error?.message ?? "").includes("UI entity not found")) {
      throw error;
    }
  }
}

b.panel(ROOT, {
  anchor: "stretch",
  rect_size: [1920, 1080],
  enable: false,
});
addRect(b, `${ROOT}/Dim`, {
  anchor: "stretch",
  rect_size: [1920, 1080],
  color: "#05020A",
  alpha: 0.72,
  raycast: true,
  order_in_layer: Z.dim,
});

b.panel(SLOT, {
  anchor: "middle-center",
  pos: structure.slotRoot.position,
  rect_size: structure.slotRoot.rectSize,
});
b.patchComponent(SLOT, "MOD.Core.UITransformComponent", {
  UIScale: {
    x: structure.slotRoot.uiScale[0],
    y: structure.slotRoot.uiScale[1],
    z: 1.0,
  },
});

addSprite(b, `${SLOT}/Sprite_FrameShell`, assets.frameShell, Z.shell);

for (let reelIndex = 1; reelIndex <= 3; reelIndex += 1) {
  const reelPos = pairPosition(reelIndex);
  addSprite(b, `${SLOT}/Sprite_ReelColumnBg_${reelIndex}`, assets.reelColumnBackground, Z.reelBg, {
    pos: reelPos,
    rect_size: structure.reels.maskSize,
  });

  const maskPath = `${SLOT}/Mask_Bonus777Reel_${reelIndex}`;
  const stripPath = `${maskPath}/Panel_Bonus777ReelStrip_${reelIndex}`;
  b.mask(maskPath, {
    anchor: "middle-center",
    pos: reelPos,
    rect_size: structure.reels.maskSize,
    alpha: 0,
    sorting_layer: "UI",
    order_in_layer: Z.reelBg,
    override_sorting: true,
  });
  b.panel(stripPath, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: structure.reels.stripSize,
  });

  for (let virtualIndex = -1; virtualIndex <= 9; virtualIndex += 1) {
    const displayIndex = virtualIndex + 2;
    const cellPath = `${stripPath}/DigitCell_${String(displayIndex).padStart(2, "0")}`;
    const digit = digitForVirtualIndex(virtualIndex);
    const y = (((DIGIT_MAX + 1) * 0.5) - virtualIndex) * CELL_HEIGHT;
    b.panel(cellPath, {
      anchor: "middle-center",
      pos: [0, y],
      rect_size: [structure.reels.stripSize[0], CELL_HEIGHT],
    });
    addSprite(b, `${cellPath}/Sprite_Face`, assets.digitCell, Z.reelBg + 1, {
      pos: [0, 0],
      rect_size: structure.reels.digitCellSize,
    });
    addText(b, `${cellPath}/Text_Digit`, String(digit), {
      rect_size: structure.reels.digitTextSize,
      size: 66,
      min_size: 42,
      max_size: 66,
      bold: true,
      color: "#FFE39A",
      outline: true,
      outline_color: "#1B1028",
      outline_width: 3,
      drop_shadow_alpha: 0.45,
      order_in_layer: Z.reelText,
    });
  }
}

addSprite(b, `${SLOT}/Sprite_ReelWindowFrame`, assets.reelWindowFrame, Z.frame + 1);
addSprite(b, `${SLOT}/Sprite_LeverBase`, assets.leverBase, Z.lever);
addSprite(b, `${SLOT}/Sprite_Lever`, assets.leverArmUp, Z.lever + 1);
b.patch(`${SLOT}/Sprite_LeverBase`, { display_order: 58 });
b.patch(`${SLOT}/Sprite_Lever`, { display_order: 1000 });
b.patchComponent(`${SLOT}/Sprite_Lever`, "MOD.Core.SpriteGUIRendererComponent", {
  OrderInLayer: 1000,
});

addText(b, `${SLOT}/Text_Chance`, "CHANCE 0 / 0", {
  pos: [0, -224],
  rect_size: [480, 28],
  size: 20,
  min_size: 14,
  max_size: 20,
  bold: true,
  color: "#FFE8A3",
  outline: true,
  outline_color: "#2A1208",
  order_in_layer: Z.text,
});
addText(b, `${SLOT}/Text_Result`, "WILD x5 BONUS", {
  pos: [0, -260],
  rect_size: [480, 32],
  size: 22,
  min_size: 15,
  max_size: 22,
  bold: true,
  color: "#FFE9B0",
  outline: true,
  outline_color: "#2A1208",
  outline_width: 3,
  order_in_layer: Z.text,
});

ensureRuntimeBindingProperties();
b.write(uiPath, {
  lint: false,
  strict: false,
  bind: {
    mlua: runtimePath,
    props: {
      bonus777Panel: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden",
      bonus777ReelText1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_1/Panel_Bonus777ReelStrip_1/DigitCell_04/Text_Digit",
      bonus777ReelText2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_2/Panel_Bonus777ReelStrip_2/DigitCell_04/Text_Digit",
      bonus777ReelText3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_3/Panel_Bonus777ReelStrip_3/DigitCell_04/Text_Digit",
      bonus777ChanceText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Chance",
      bonus777ResultText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Text_Result",
      bonus777ReelStripTransform1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_1/Panel_Bonus777ReelStrip_1",
      bonus777ReelStripTransform2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_2/Panel_Bonus777ReelStrip_2",
      bonus777ReelStripTransform3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Mask_Bonus777Reel_3/Panel_Bonus777ReelStrip_3",
      bonus777LeverTransform: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Sprite_Lever",
      bonus777LeverRenderer: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Sprite_Lever",
    },
  },
});
