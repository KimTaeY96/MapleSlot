const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("C:/Users/ghddj/Desktop/AI/MSW/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const structurePath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "classic_example", "classic_slot_ui_structure.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const structure = JSON.parse(fs.readFileSync(structurePath, "utf8"));

const ROOT = "Panel_ClassicSlotMachine_Hidden";
const SCALE = 0.56;
const Z = {
  shell: 360,
  reel: 362,
  frame: 366,
  ornament: 368,
  reference: 359,
};

const assetKeys = {
  classic_slot_full_composite: "classicSlotFullComposite",
  classic_slot_frame_shell: "classicSlotFrameShell",
  classic_slot_reel_window_frame: "classicSlotReelWindowFrame",
  classic_slot_reel_strip_1: "classicSlotReelStrip1",
  classic_slot_reel_strip_2: "classicSlotReelStrip2",
  classic_slot_reel_strip_3: "classicSlotReelStrip3",
  classic_slot_top_arch: "classicSlotTopArch",
  classic_slot_top_emblem: "classicSlotTopEmblem",
  classic_slot_bottom_panel: "classicSlotBottomPanel",
  classic_slot_base_plinth: "classicSlotBasePlinth",
  classic_slot_lever: "classicSlotLever",
  classic_slot_side_left: "classicSlotSideLeft",
  classic_slot_side_right: "classicSlotSideRight",
  classic_slot_symbol_7: "classicSlotSymbol7",
};

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
    enable: options.enable ?? true,
  });
}

const b = UIBuilder.load(uiPath);
try {
  b.remove(ROOT);
} catch (error) {
  if (!String(error?.message ?? "").includes("UI entity not found")) {
    throw error;
  }
}

b.panel(ROOT, {
  anchor: "middle-right",
  pos: [-390, -30],
  rect_size: [1139, 1099],
  enable: false,
});
b.patchComponent(ROOT, "MOD.Core.UITransformComponent", {
  UIScale: { x: SCALE, y: SCALE, z: 1.0 },
});

addSprite(b, `${ROOT}/Sprite_FullComposite_Reference`, asset("classic_slot_full_composite"), Z.reference, { enable: false });
addSprite(b, `${ROOT}/Sprite_FrameShell`, asset("classic_slot_frame_shell"), Z.shell);

const reelEntries = [
  asset("classic_slot_reel_strip_1"),
  asset("classic_slot_reel_strip_2"),
  asset("classic_slot_reel_strip_3"),
];
for (let index = 1; index <= 3; index += 1) {
  const entry = reelEntries[index - 1];
  b.mask(`${ROOT}/ReelMask_${index}`, {
    anchor: "middle-center",
    pos: pos(entry),
    rect_size: size(entry),
    alpha: 0,
    sorting_layer: "UI",
    order_in_layer: Z.reel,
    override_sorting: true,
  });
  addSprite(b, `${ROOT}/ReelMask_${index}/Sprite_ReelStrip`, entry, Z.reel, {
    pos: [0, 0],
    rect_size: size(entry),
  });
}

addSprite(b, `${ROOT}/Sprite_ReelWindowFrame`, asset("classic_slot_reel_window_frame"), Z.frame);
addSprite(b, `${ROOT}/Sprite_TopArch`, asset("classic_slot_top_arch"), Z.ornament);
addSprite(b, `${ROOT}/Sprite_TopEmblem`, asset("classic_slot_top_emblem"), Z.ornament + 1);
addSprite(b, `${ROOT}/Sprite_BottomPanel`, asset("classic_slot_bottom_panel"), Z.ornament + 2);
addSprite(b, `${ROOT}/Sprite_BasePlinth`, asset("classic_slot_base_plinth"), Z.ornament + 3);
addSprite(b, `${ROOT}/Sprite_Lever`, asset("classic_slot_lever"), Z.ornament + 4);
addSprite(b, `${ROOT}/Sprite_LeftSideCap`, asset("classic_slot_side_left"), Z.ornament + 5);
addSprite(b, `${ROOT}/Sprite_RightSideCap`, asset("classic_slot_side_right"), Z.ornament + 5);

b.panel(`${ROOT}/Symbols`, {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [1139, 1099],
  enable: false,
});
addSprite(b, `${ROOT}/Symbols/Sprite_Seven`, asset("classic_slot_symbol_7"), Z.ornament + 6, {
  pos: [0, 0],
});

b.write(uiPath, {
  lint: false,
  strict: false,
});
