const fs = require("fs");
const path = require("path");
const { UIBuilder, colorDict } = require("C:/Users/ghddj/Desktop/AI/MSW/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const runtimePath = path.join(projectRoot, "RootDesk", "MyDesk", "SlotMachine", "SlotMachineRuntime.mlua");

const Z = {
  dim: 440,
  window: 450,
  panel: 452,
  reel: 456,
  text: 460,
};

const bonus777Props = [
  '    property Entity bonus777Panel = ""',
  '    property TextComponent bonus777ReelText1 = ""',
  '    property TextComponent bonus777ReelText2 = ""',
  '    property TextComponent bonus777ReelText3 = ""',
  '    property TextComponent bonus777ChanceText = ""',
  '    property TextComponent bonus777ResultText = ""',
];

function ensureRuntimeBindingProperties() {
  let runtime = fs.readFileSync(runtimePath, "utf8");
  const missing = bonus777Props.filter((line) => {
    const propName = line.match(/property\s+\S+\s+(\S+)/)?.[1];
    return propName && !new RegExp(`\\bproperty\\s+\\S+\\s+${propName}\\s*=`).test(runtime);
  });
  if (missing.length === 0) return;

  const marker = /    property TextComponent winResultTotalText = "[^"]*"\r?\n/;
  if (!marker.test(runtime)) {
    throw new Error(`Could not insert 777 bonus runtime binding properties in ${runtimePath}`);
  }
  runtime = runtime.replace(marker, (match) => `${match}${missing.join("\n")}\n`);
  fs.writeFileSync(runtimePath, runtime, "utf8");
}

const b = UIBuilder.load(uiPath);
try {
  b.remove("Panel_Bonus777_Hidden");
} catch (error) {
  if (!String(error?.message ?? "").includes("UI entity not found")) {
    throw error;
  }
}

function addRect(pathName, options = {}) {
  b.sprite(pathName, {
    anchor: options.anchor ?? "middle-center",
    pos: options.pos ?? [0, 0],
    rect_size: options.rect_size ?? [100, 100],
    color: options.color ?? "#FFFFFF",
    alpha: options.alpha ?? 1,
    sprite_type: 1,
    raycast: options.raycast ?? false,
    sorting_layer: "UI",
    order_in_layer: options.order_in_layer ?? Z.panel,
    override_sorting: true,
  });
}

function addText(pathName, text, options = {}) {
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

b.panel("Panel_Bonus777_Hidden", {
  anchor: "stretch",
  rect_size: [1920, 1080],
  enable: false,
});
addRect("Panel_Bonus777_Hidden/Dim", {
  anchor: "stretch",
  rect_size: [1920, 1080],
  color: "#05020A",
  alpha: 0.48,
  raycast: true,
  order_in_layer: Z.dim,
});
addRect("Panel_Bonus777_Hidden/WindowBorder", {
  pos: [0, -8],
  rect_size: [660, 452],
  color: "#5B3416",
  alpha: 1,
  order_in_layer: Z.window,
});
addRect("Panel_Bonus777_Hidden/Window", {
  pos: [0, -8],
  rect_size: [628, 420],
  color: "#F5E6B8",
  alpha: 1,
  order_in_layer: Z.window + 1,
});
addRect("Panel_Bonus777_Hidden/TopBand", {
  pos: [0, 176],
  rect_size: [560, 54],
  color: "#A64820",
  alpha: 1,
  order_in_layer: Z.panel,
});
addText("Panel_Bonus777_Hidden/Text_Title", "777 BONUS SLOT", {
  pos: [0, 176],
  rect_size: [520, 46],
  size: 28,
  min_size: 18,
  max_size: 28,
  bold: true,
  color: "#FFE8A3",
  outline: true,
  outline_color: "#2A1208",
  outline_width: 2,
});
addRect("Panel_Bonus777_Hidden/Badge_Generate", {
  pos: [0, 116],
  rect_size: [220, 46],
  color: "#6E3B20",
  alpha: 1,
  order_in_layer: Z.panel,
});
addText("Panel_Bonus777_Hidden/Text_Generate", "GENERATE!!", {
  pos: [0, 116],
  rect_size: [200, 38],
  size: 22,
  min_size: 14,
  max_size: 22,
  bold: true,
  color: "#FFFFFF",
  outline: true,
  outline_color: "#321709",
});
addRect("Panel_Bonus777_Hidden/ReelBackplate", {
  pos: [0, -18],
  rect_size: [510, 168],
  color: "#2B1830",
  alpha: 1,
  order_in_layer: Z.panel,
});

for (let index = 1; index <= 3; index += 1) {
  const x = -160 + (index - 1) * 160;
  addRect(`Panel_Bonus777_Hidden/Reel_${index}`, {
    pos: [x, -18],
    rect_size: [124, 144],
    color: "#8F111A",
    alpha: 1,
    order_in_layer: Z.reel,
  });
  addRect(`Panel_Bonus777_Hidden/Reel_${index}/Face`, {
    pos: [0, 0],
    rect_size: [104, 124],
    color: "#F9FBFF",
    alpha: 1,
    order_in_layer: Z.reel + 1,
  });
  addText(`Panel_Bonus777_Hidden/Reel_${index}/Text_Digit`, "7", {
    pos: [0, 0],
    rect_size: [96, 112],
    size: 72,
    min_size: 42,
    max_size: 72,
    bold: true,
    color: "#D91224",
    outline: true,
    outline_color: "#580810",
    outline_width: 2,
    order_in_layer: Z.text + 2,
  });
}

addText("Panel_Bonus777_Hidden/Text_Chance", "CHANCE 0 / 0", {
  pos: [0, -128],
  rect_size: [500, 34],
  size: 20,
  min_size: 13,
  max_size: 20,
  bold: true,
  color: "#442514",
  order_in_layer: Z.text,
});
addText("Panel_Bonus777_Hidden/Text_Result", "WILD x5 BONUS", {
  pos: [0, -168],
  rect_size: [560, 44],
  size: 24,
  min_size: 14,
  max_size: 24,
  bold: true,
  color: "#8C171F",
  outline: true,
  outline_color: "#FFF1B8",
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
      bonus777ReelText1: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Reel_1/Text_Digit",
      bonus777ReelText2: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Reel_2/Text_Digit",
      bonus777ReelText3: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Reel_3/Text_Digit",
      bonus777ChanceText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Text_Chance",
      bonus777ResultText: "/ui/UIRoot_TestSandbox_MainPlay/Panel_Bonus777_Hidden/Text_Result",
    },
  },
});
