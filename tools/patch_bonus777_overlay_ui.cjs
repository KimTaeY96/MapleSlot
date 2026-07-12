const fs = require("fs");
const path = require("path");
const { UIBuilder, colorDict } = require("C:/Users/ghddj/Desktop/AI/MSW/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const runtimePath = path.join(projectRoot, "RootDesk", "MyDesk", "SlotMachine", "SlotMachineRuntime.mlua");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const structurePath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "classic_example", "classic_slot_ui_structure.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const structure = JSON.parse(fs.readFileSync(structurePath, "utf8"));

const ROOT = "Panel_Bonus777_Hidden";
const SLOT = `${ROOT}/ClassicSlot`;
const CELL_HEIGHT = 174;
const DIGIT_CELL_COUNT = 11;
const DIGIT_MIN = 1;
const DIGIT_MAX = 7;
const Z = {
  dim: 440,
  shell: 450,
  reelBg: 452,
  reelText: 454,
  frame: 456,
  ornament: 458,
  lever: 464,
  text: 470,
};

const assetKeys = {
  classic_slot_frame_shell: "classicSlotFrameShell",
  classic_slot_reel_window_frame: "classicSlotReelWindowFrame",
  classic_slot_top_arch: "classicSlotTopArch",
  classic_slot_top_emblem: "classicSlotTopEmblem",
  classic_slot_bottom_panel: "classicSlotBottomPanel",
  classic_slot_base_plinth: "classicSlotBasePlinth",
  classic_slot_lever: "classicSlotLever",
  classic_slot_side_left: "classicSlotSideLeft",
  classic_slot_side_right: "classicSlotSideRight",
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
];

function ensureRuntimeBindingProperties() {
  let runtime = fs.readFileSync(runtimePath, "utf8");
  const missing = bonus777Props.filter((line) => {
    const propName = line.match(/property\s+\S+\s+(\S+)/)?.[1];
    return propName && !new RegExp(`\\bproperty\\s+\\S+\\s+${propName}\\s*=`).test(runtime);
  });
  if (missing.length === 0) return;

  const marker = /    property TextComponent bonus777ResultText = "[^"]*"\r?\n/;
  if (!marker.test(runtime)) {
    throw new Error(`Could not insert 777 bonus runtime binding properties in ${runtimePath}`);
  }
  runtime = runtime.replace(marker, (match) => `${match}${missing.join("\n")}\n`);
  fs.writeFileSync(runtimePath, runtime, "utf8");
}

function asset(name) {
  const entry = structure.assets.find((item) => item.name === name);
  if (!entry) throw new Error(`Missing classic slot structure asset: ${name}`);
  const key = assetKeys[name];
  const ruid = manifest[key]?.ruid;
  if (!ruid) throw new Error(`Missing classic slot manifest RUID: ${key}`);
  return { ...entry, key, ruid };
}

function pos(entry) {
  return [entry.uiPositionFromSourceCenter.x, entry.uiPositionFromSourceCenter.y];
}

function size(entry) {
  return [entry.size.width, entry.size.height];
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
    pos: options.pos ?? pos(entry),
    rect_size: options.rect_size ?? size(entry),
    image_ruid: entry.ruid,
    preserve_aspect: true,
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
    color: options.color ?? "#2B1608",
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
  alpha: 0.48,
  raycast: true,
  order_in_layer: Z.dim,
});

b.panel(SLOT, {
  anchor: "middle-center",
  pos: [0, 54],
  rect_size: [1139, 1099],
});
b.patchComponent(SLOT, "MOD.Core.UITransformComponent", {
  UIScale: { x: 0.58, y: 0.58, z: 1.0 },
});

addSprite(b, `${SLOT}/Sprite_FrameShell`, asset("classic_slot_frame_shell"), Z.shell);

const reelAssets = [
  structure.assets.find((item) => item.name === "classic_slot_reel_strip_1"),
  structure.assets.find((item) => item.name === "classic_slot_reel_strip_2"),
  structure.assets.find((item) => item.name === "classic_slot_reel_strip_3"),
];
for (let reelIndex = 1; reelIndex <= 3; reelIndex += 1) {
  const reelAsset = reelAssets[reelIndex - 1];
  if (!reelAsset) throw new Error(`Missing classic reel asset geometry for reel ${reelIndex}`);
  const maskPath = `${SLOT}/ReelMask_${reelIndex}`;
  const stripPath = `${maskPath}/ReelStrip_${reelIndex}`;
  b.mask(maskPath, {
    anchor: "middle-center",
    pos: pos(reelAsset),
    rect_size: [reelAsset.size.width, 522],
    alpha: 0,
    sorting_layer: "UI",
    order_in_layer: Z.reelBg,
    override_sorting: true,
  });
  b.panel(stripPath, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [reelAsset.size.width, CELL_HEIGHT * DIGIT_CELL_COUNT],
  });
  for (let virtualIndex = -1; virtualIndex <= 9; virtualIndex += 1) {
    const displayIndex = virtualIndex + 2;
    const cellPath = `${stripPath}/DigitCell_${String(displayIndex).padStart(2, "0")}`;
    const digit = digitForVirtualIndex(virtualIndex);
    const y = (((DIGIT_MAX + 1) * 0.5) - virtualIndex) * CELL_HEIGHT;
    b.panel(cellPath, {
      anchor: "middle-center",
      pos: [0, y],
      rect_size: [reelAsset.size.width, CELL_HEIGHT],
    });
    addRect(b, `${cellPath}/Face`, {
      rect_size: [reelAsset.size.width - 20, CELL_HEIGHT - 18],
      color: "#FFF4D8",
      alpha: 0.96,
      order_in_layer: Z.reelBg,
    });
    addText(b, `${cellPath}/Text_Digit`, String(digit), {
      rect_size: [reelAsset.size.width - 30, CELL_HEIGHT - 20],
      size: 112,
      min_size: 68,
      max_size: 112,
      bold: true,
      color: "#D91224",
      outline: true,
      outline_color: "#5E0710",
      outline_width: 3,
      drop_shadow_alpha: 0.3,
      order_in_layer: Z.reelText,
    });
  }
}

addSprite(b, `${SLOT}/Sprite_ReelWindowFrame`, asset("classic_slot_reel_window_frame"), Z.frame);
addSprite(b, `${SLOT}/Sprite_TopArch`, asset("classic_slot_top_arch"), Z.ornament);
addSprite(b, `${SLOT}/Sprite_TopEmblem`, asset("classic_slot_top_emblem"), Z.ornament + 1);
addSprite(b, `${SLOT}/Sprite_BottomPanel`, asset("classic_slot_bottom_panel"), Z.ornament + 2);
addSprite(b, `${SLOT}/Sprite_BasePlinth`, asset("classic_slot_base_plinth"), Z.ornament + 3);
addSprite(b, `${SLOT}/Sprite_LeftSideCap`, asset("classic_slot_side_left"), Z.ornament + 4);
addSprite(b, `${SLOT}/Sprite_RightSideCap`, asset("classic_slot_side_right"), Z.ornament + 4);
addSprite(b, `${SLOT}/Sprite_Lever`, asset("classic_slot_lever"), Z.lever);

addText(b, `${ROOT}/Text_Title`, "777 BONUS SLOT", {
  pos: [0, 455],
  rect_size: [620, 46],
  size: 30,
  min_size: 18,
  max_size: 30,
  bold: true,
  color: "#FFE8A3",
  outline: true,
  outline_color: "#2A1208",
  outline_width: 2,
});
addText(b, `${ROOT}/Text_Chance`, "CHANCE 0 / 0", {
  pos: [0, -326],
  rect_size: [640, 34],
  size: 22,
  min_size: 14,
  max_size: 22,
  bold: true,
  color: "#FFE8A3",
  outline: true,
  outline_color: "#2A1208",
  order_in_layer: Z.text,
});
addText(b, `${ROOT}/Text_Result`, "WILD x5 BONUS", {
  pos: [0, -372],
  rect_size: [760, 48],
  size: 26,
  min_size: 15,
  max_size: 26,
  bold: true,
  color: "#FFFFFF",
  outline: true,
  outline_color: "#8C171F",
  outline_width: 2,
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
      bonus777ReelText1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/ClassicSlot/ReelMask_1/ReelStrip_1/DigitCell_04/Text_Digit",
      bonus777ReelText2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/ClassicSlot/ReelMask_2/ReelStrip_2/DigitCell_04/Text_Digit",
      bonus777ReelText3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/ClassicSlot/ReelMask_3/ReelStrip_3/DigitCell_04/Text_Digit",
      bonus777ChanceText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Text_Chance",
      bonus777ResultText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Text_Result",
      bonus777ReelStripTransform1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/ClassicSlot/ReelMask_1/ReelStrip_1",
      bonus777ReelStripTransform2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/ClassicSlot/ReelMask_2/ReelStrip_2",
      bonus777ReelStripTransform3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/ClassicSlot/ReelMask_3/ReelStrip_3",
      bonus777LeverTransform: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/ClassicSlot/Sprite_Lever",
    },
  },
});
