const path = require("path");
const { UIBuilder } = require("C:/Users/ghddj/Desktop/AI/MSW/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const runtimePath = path.join(projectRoot, "RootDesk", "MyDesk", "SlotMachine", "SlotMachineRuntime.mlua");

const RUIDS = {
  buttonBlue: "43d1ee446e5f4acdb177552304a7510c",
  panel: "747efdda9e98478cb54c7aac431da554",
  input: "54d92389927a4acd817173cc7c7bfd8e",
  list: "f322a2f674b54448a2481008b6b8f4a9",
  item: "451613558bbd4f8a9dc8651ed0031c76",
};

const Z = {
  button: 430,
  panel: 431,
  input: 433,
  list: 433,
  item: 435,
  text: 436,
};

const b = UIBuilder.load(uiPath);

function addText(pathName, text, options = {}) {
  b.text(pathName, text, {
    anchor: options.anchor ?? "middle-center",
    pos: options.pos ?? [0, 0],
    rect_size: options.rect_size ?? [100, 40],
    size: options.size ?? 18,
    color: options.color ?? "#F7F5E8",
    alignment: options.alignment ?? 4,
    bestfit: options.bestfit ?? true,
    min_size: options.min_size ?? 10,
    max_size: options.max_size ?? options.size ?? 18,
    bold: options.bold ?? false,
    use_outline: true,
    outline_color: options.outline_color ?? "#101828",
    outline_width: options.outline_width ?? 1,
    drop_shadow: true,
    drop_shadow_distance: 2,
    drop_shadow_color: "#000000",
    sorting_layer: "UI",
    order_in_layer: options.order_in_layer ?? Z.text,
    override_sorting: true,
  });
}

function addButton(pathName, text, options = {}) {
  b.button(pathName, text, {
    anchor: options.anchor ?? "middle-center",
    pos: options.pos ?? [0, 0],
    rect_size: options.rect_size ?? [120, 44],
    image_ruid: options.image_ruid ?? RUIDS.buttonBlue,
    font_size: options.font_size ?? 18,
    color: options.color ?? "#F7F5E8",
    sorting_layer: "UI",
    order_in_layer: options.order_in_layer ?? Z.item,
    override_sorting: true,
  });
  b.patchComponent(pathName, "MOD.Core.TextComponent", {
    BestFit: true,
    MinSize: options.min_size ?? 10,
    MaxSize: options.max_size ?? options.font_size ?? 18,
    UseOutLine: true,
    OutlineColor: { r: 0.062745098, g: 0.094117647, b: 0.156862745, a: 1 },
    OutlineWidth: 1,
    OutlineDistance: { x: 1, y: -1 },
    DropShadow: true,
    DropShadowDistance: 2,
    DropShadowColor: { r: 0, g: 0, b: 0, a: 0.72 },
    Overflow: 2,
  });
}

addButton("Button_DevCheatMenu", "...", {
  anchor: "top-right",
  pos: [-40, -40],
  rect_size: [68, 68],
  font_size: 30,
  min_size: 20,
  max_size: 30,
  order_in_layer: Z.button,
});
b.upsertComponent("Button_DevCheatMenu", "MOD.Core.UITouchReceiveComponent");

b.panel("Panel_DevCheat_Hidden", {
  anchor: "top-right",
  pos: [-40, -318],
  rect_size: [420, 560],
  enable: false,
});
b.sprite("Panel_DevCheat_Hidden/Bg", {
  anchor: "stretch",
  image_ruid: RUIDS.panel,
  color: "#121A4C",
  alpha: 0.96,
  raycast: true,
  sorting_layer: "UI",
  order_in_layer: Z.panel,
  override_sorting: true,
});

b.textInput("Panel_DevCheat_Hidden/Input_CheatCode", {
  anchor: "top-left",
  pos: [20, -22],
  rect_size: [282, 46],
  image_ruid: RUIDS.input,
  placeholder: "CHEAT CODE",
  char_limit: 32,
  content_type: 0,
  line_type: 0,
  text: "",
  font_size: 18,
  color: "#FFFFFF",
  sorting_layer: "UI",
  order_in_layer: Z.input,
  override_sorting: true,
});
b.patchComponent("Panel_DevCheat_Hidden/Input_CheatCode", "MOD.Core.TextComponent", {
  Alignment: 3,
  BestFit: true,
  MinSize: 12,
  MaxSize: 18,
  UseOutLine: true,
  OutlineWidth: 1,
  OutlineColor: { r: 0.062745098, g: 0.094117647, b: 0.156862745, a: 1 },
  Padding: { left: 14, right: 8, top: 0, bottom: 0 },
});

addButton("Panel_DevCheat_Hidden/Button_ApplyCheat", "APPLY", {
  anchor: "top-right",
  pos: [-20, -22],
  rect_size: [92, 46],
  font_size: 16,
  min_size: 11,
  max_size: 16,
  order_in_layer: Z.input,
});

addText("Panel_DevCheat_Hidden/Text_Status", "", {
  anchor: "top-left",
  pos: [20, -78],
  rect_size: [380, 30],
  size: 15,
  min_size: 10,
  max_size: 15,
  alignment: 3,
  color: "#A7F3D0",
  order_in_layer: Z.text,
});

b.panel("Panel_DevCheat_Hidden/Panel_CheatList", {
  anchor: "top-center",
  pos: [0, -122],
  rect_size: [380, 410],
});
b.sprite("Panel_DevCheat_Hidden/Panel_CheatList/Bg", {
  anchor: "stretch",
  image_ruid: RUIDS.list,
  color: "#FFFFFF",
  alpha: 1,
  raycast: true,
  sorting_layer: "UI",
  order_in_layer: Z.list,
  override_sorting: true,
});
b.scrollLayout("Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands", {
  anchor: "stretch",
  layout_type: 1,
  spacing: 6,
  cell_size: [348, 42],
  use_scroll: true,
  scroll_bar_visible: 1,
  scroll_bar_thickness: 12,
  sorting_layer: "UI",
  order_in_layer: Z.list,
  override_sorting: true,
});
b.patchComponent("Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands", "MOD.Core.UITransformComponent", {
  OffsetMin: { x: 14, y: 12 },
  OffsetMax: { x: -14, y: -12 },
});
b.upsertComponent("Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands", "MOD.Core.MaskComponent", { Shape: 0, Enable: true });

for (let index = 1; index <= 12; index += 1) {
  addButton(`Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands/Item_CheatCommand_${index}`, "", {
    anchor: "top-center",
    pos: [0, -24 - (index - 1) * 48],
    rect_size: [348, 42],
    image_ruid: RUIDS.item,
    font_size: 14,
    min_size: 10,
    max_size: 14,
    order_in_layer: Z.item,
  });
  b.patchComponent(`Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands/Item_CheatCommand_${index}`, "MOD.Core.TextComponent", {
    Alignment: 3,
    Padding: { left: 12, right: 12, top: 0, bottom: 0 },
  });
}

const props = {
  devCheatButton: "/ui/UIRoot_TestSandbox_MainPlay/Button_DevCheatMenu",
  devCheatPanel: "/ui/UIRoot_TestSandbox_MainPlay/Panel_DevCheat_Hidden",
  devCheatInput: "/ui/UIRoot_TestSandbox_MainPlay/Panel_DevCheat_Hidden/Input_CheatCode",
  devCheatApplyButton: "/ui/UIRoot_TestSandbox_MainPlay/Panel_DevCheat_Hidden/Button_ApplyCheat",
  devCheatStatusText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_DevCheat_Hidden/Text_Status",
};
for (let index = 1; index <= 12; index += 1) {
  props[`devCheatListItem${index}`] = `/ui/UIRoot_TestSandbox_MainPlay/Panel_DevCheat_Hidden/Panel_CheatList/Scroll_CheatCommands/Item_CheatCommand_${index}`;
}

b.write(uiPath, {
  lint: false,
  strict: false,
  bind: {
    mlua: runtimePath,
    props,
  },
});
