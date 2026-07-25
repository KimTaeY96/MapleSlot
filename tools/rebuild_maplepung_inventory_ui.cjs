const fs = require("fs");
const path = require("path");
const {
  UIBuilder,
} = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const ROOT = path.resolve(__dirname, "..");
const UI_PATH = path.join(ROOT, "ui", "EquipmentInventory.ui");
const RUIDS = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "Assets", "GeneratedUI", "MaplePung", "ruid-map.json"),
    "utf8",
  ),
);

const b = UIBuilder.read(UI_PATH);

const C = {
  white: { r: 1, g: 1, b: 1, a: 1 },
  transparent: { r: 1, g: 1, b: 1, a: 0 },
  navy: { r: 0.08, g: 0.14, b: 0.28, a: 1 },
  mutedBlue: { r: 0.38, g: 0.54, b: 0.67, a: 1 },
  paleBlue: { r: 0.70, g: 0.82, b: 0.90, a: 1 },
  darkTooltip: { r: 0.12, g: 0.14, b: 0.29, a: 0.98 },
};
// Project UI rule: every direct child of a bordered panel must stay inside this
// content-safe inset. Text and interactive controls must never overlap 9-slice borders.
const BORDER_CONTENT_SAFE_INSET = 16;


function dataRef(key) {
  return { DataId: RUIDS[key] };
}

function sprite(pathName, key, type = 1, raycast = false, color = C.white) {
  b.patchComponent(pathName, "MOD.Core.SpriteGUIRendererComponent", {
    ImageRUID: dataRef(key),
    Type: type,
    RaycastTarget: raycast,
    Color: color,
  });
}

function textStyle(
  pathName,
  size,
  color,
  horizontal = 2,
  vertical = 512,
  bold = false,
) {
  b.patchComponent(pathName, "MOD.Core.TextGUIRendererComponent", {
    Font: "Maple",
    FontSize: size,
    FontColor: color,
    FontStyle: bold ? 1 : 0,
    HorizontalAlignment: horizontal,
    VerticalAlignment: vertical,
    Overflow: 1,
    BestFit: false,
    Underlay: false,
    OutlineWidth: 0,
  });
}

function spriteSwap(pathName, normal, hover, pressed = hover) {
  sprite(pathName, normal, 0, true);
  b.patchComponent(pathName, "MOD.Core.ButtonComponent", {
    Transition: 2,
    ImageRUIDs: {
      HighlightedSprite: dataRef(hover),
      PressedSprite: dataRef(pressed),
      SelectedSprite: dataRef(hover),
      DisabledSprite: dataRef(normal),
    },
  });
}

function moveSubtreeToVisualFront(pathName) {
  const root = b.find(pathName);
  if (!root) throw new Error(`Missing UI subtree: ${pathName}`);
  const rootPath = root.jsonString.path;
  const subtree = b.entities.filter((entity) => {
    const entityPath = entity?.jsonString?.path || "";
    return entityPath === rootPath || entityPath.startsWith(`${rootPath}/`);
  });
  const remainder = b.entities.filter((entity) => !subtree.includes(entity));
  b.entities.splice(0, b.entities.length, ...remainder, ...subtree);
}
function assertInsideBorder(parentPath, childPath, inset = BORDER_CONTENT_SAFE_INSET) {
  const parent = b.getComponent(parentPath, "MOD.Core.UITransformComponent");
  const child = b.getComponent(childPath, "MOD.Core.UITransformComponent");
  if (!parent || !child) {
    throw new Error(`Missing bordered UI transform: ${parentPath} -> ${childPath}`);
  }

  const parentWidth = parent.RectSize.x;
  const parentHeight = parent.RectSize.y;
  const left = child.AnchorsMin.x * parentWidth + child.OffsetMin.x;
  const right = child.AnchorsMax.x * parentWidth + child.OffsetMax.x;
  const bottom = child.AnchorsMin.y * parentHeight + child.OffsetMin.y;
  const top = child.AnchorsMax.y * parentHeight + child.OffsetMax.y;
  const epsilon = 0.01;

  if (
    left < inset - epsilon ||
    right > parentWidth - inset + epsilon ||
    bottom < inset - epsilon ||
    top > parentHeight - inset + epsilon
  ) {
    throw new Error(
      `Border-safe inset violation: ${childPath} in ${parentPath} ` +
        `(rect=${left},${bottom},${right},${top}, inset=${inset})`,
    );
  }
}


function patchEquipmentCell(cellName, buttonName, x, y, label) {
  const cell = `EquipmentPanel/EquipmentSection/SlotGrid/${cellName}`;
  const button = `${cell}/${buttonName}`;
  b.patch(cell, {
    anchor: "top-center",
    pos: [x, y],
    rect_size: [92, 108],
    pivot: [0.5, 1],
  });
  b.patch(button, {
    anchor: "top-center",
    pos: [0, 0],
    rect_size: [88, 88],
    pivot: [0.5, 1],
  });
  sprite(button, "slot-equipment", 1, true);
  b.patchComponent(button, "MOD.Core.ButtonComponent", {
    Transition: 1,
    Colors: {
      NormalColor: C.white,
      HighlightedColor: { r: 1, g: 1, b: 1, a: 1 },
      PressedColor: { r: 0.78, g: 0.86, b: 0.94, a: 1 },
      SelectedColor: C.white,
      DisabledColor: { r: 0.75, g: 0.78, b: 0.82, a: 0.55 },
      ColorMultiplier: 1,
      FadeDuration: 0.08,
    },
  });
  b.patch(`${button}/Icon`, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [64, 64],
  });
  b.patch(`${button}/Selection`, {
    anchor: "stretch",
    pos: [0, 0],
    rect_size: [88, 88],
    pivot: [0.5, 0.5],
  });
  sprite(`${button}/Selection`, "slot-selection", 0, false);
  b.patch(`${button}/Grade`, {
    anchor: "top-center",
    pos: [0, -4],
    rect_size: [68, 5],
  });
  b.patch(`${button}/Enhancement`, {
    anchor: "bottom-right",
    pos: [-4, 4],
    rect_size: [36, 22],
    pivot: [1, 0],
  });
  textStyle(`${button}/Enhancement`, 18, C.white, 4, 1024, true);
  b.patch(`${button}/Empty`, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: [72, 28],
  });
  textStyle(`${button}/Empty`, 17, C.mutedBlue, 2, 512, false);
  b.patch(`${button}/CanEquip`, {
    anchor: "top-center",
    pos: [0, -8],
    rect_size: [72, 20],
    pivot: [0.5, 1],
  });
  textStyle(`${button}/CanEquip`, 15, { r: 0.20, g: 0.50, b: 0.82, a: 1 }, 2, 512, true);
  b.patch(`${cell}/Label`, {
    anchor: "bottom-center",
    pos: [0, 0],
    rect_size: [92, 24],
  });
  b.patchComponent(`${cell}/Label`, "MOD.Core.TextGUIRendererComponent", {
    Text: label,
  });
  textStyle(`${cell}/Label`, 18, C.mutedBlue, 2, 512, true);
}

// Root remains enabled so the controller's OnBeginPlay lifecycle always runs.
b.patchComponent("EquipmentInventory", "MOD.Core.UIGroupComponent", {
  DefaultShow: true,
  GroupType: 2,
  GroupOrder: 7,
});

// One bottom-right rounded-square button toggles the unified information window.
b.patch("InventoryOpenButton", {
  anchor: "bottom-right",
  pos: [-24, 24],
  rect_size: [88, 88],
  pivot: [1, 0],
  display_order: 200,
});
spriteSwap(
  "InventoryOpenButton",
  "inventory-menu-normal",
  "inventory-menu-hover",
  "inventory-menu-hover",
);
b.patch("InventoryOpenButton/Icon", { enable: false });

if (b.find("EquipmentOpenButton")) b.remove("EquipmentOpenButton");

// Unified information window order: future Stats -> Equipment -> Inventory.
// With Stats not authored yet, the existing two panels are centered as one 976px group.
for (const [panelName, x, order] of [
  ["EquipmentPanel", -248, 20],
  ["InventoryPanel", 248, 30],
]) {
  b.patch(panelName, {
    anchor: "middle-center",
    pos: [x, 30],
    rect_size: [480, 820],
    pivot: [0.5, 0.5],
    display_order: order,
  });
  sprite(panelName, "window-frame", 1, true);
  b.patch(`${panelName}/Header`, {
    anchor: "top-center",
    pos: [0, -12],
    rect_size: [448, 54],
    pivot: [0.5, 1],
  });
  sprite(`${panelName}/Header`, "title-bar", 1, false);
  b.patch(`${panelName}/Header/CloseButton`, {
    anchor: "top-right",
    pos: [-4, -3],
    rect_size: [48, 48],
    pivot: [1, 1],
  });
  spriteSwap(
    `${panelName}/Header/CloseButton`,
    "close-normal",
    "close-hover",
    "close-pressed",
  );
  b.patch(`${panelName}/Header/Title`, {
    anchor: "stretch",
    pos: [0, 0],
    rect_size: [372, 48],
    pivot: [0.5, 0.5],
  });
  b.patchComponent(
    `${panelName}/Header/Title`,
    "MOD.Core.UITransformComponent",
    {
      OffsetMin: { x: 18, y: 3 },
      OffsetMax: { x: -58, y: -3 },
    },
  );
  textStyle(
    `${panelName}/Header/Title`,
    25,
    C.navy,
    1,
    512,
    true,
  );
}

// The unified information window is closed from the inventory header only.
// Equipment is a fixed companion panel and must not expose a second close action.
if (b.find("EquipmentPanel/Header/CloseButton")) {
  b.remove("EquipmentPanel/Header/CloseButton");
}

b.patchComponent(
  "InventoryPanel/Header/Title",
  "MOD.Core.TextGUIRendererComponent",
  { Text: "ITEM INVENTORY" },
);
b.patchComponent(
  "EquipmentPanel/Header/Title",
  "MOD.Core.TextGUIRendererComponent",
  { Text: "EQUIPMENT INVENTORY" },
);

// Inventory tabs: four equal units, real selected/hover sprite states.
b.patch("InventoryPanel/TabBar", {
  anchor: "top-center",
  pos: [0, -74],
  rect_size: [416, 62],
  pivot: [0.5, 1],
});
const tabs = [
  ["EquipmentTabButton", "장비"],
  ["ConsumableTabButton", "소비"],
  ["MaterialTabButton", "재료"],
  ["EtcTabButton", "기타"],
];
tabs.forEach(([tabName, label], index) => {
  const tab = `InventoryPanel/TabBar/${tabName}`;
  const width = 101;
  const gap = 4;
  b.patch(tab, {
    anchor: "top-left",
    pos: [index * (width + gap), 0],
    rect_size: [width, 62],
    pivot: [0, 1],
  });
  spriteSwap(tab, "tab-inactive", "tab-hover", "tab-active");
  b.patch(`${tab}/Selected`, { anchor: "stretch", rect_size: [width, 62] });
  sprite(`${tab}/Selected`, "tab-active", 1, false);
  b.patch(`${tab}/Label`, { anchor: "stretch", rect_size: [width, 62] });
  b.patchComponent(`${tab}/Label`, "MOD.Core.TextGUIRendererComponent", {
    Text: label,
  });
  textStyle(`${tab}/Label`, 22, C.navy, 2, 512, true);
});

// Inventory grid: five columns, 76px cells, 8px gaps and explicit generated scrollbar.
b.patch("InventoryPanel/GridSection", {
  anchor: "top-center",
  pos: [0, -148],
  rect_size: [448, 512],
  pivot: [0.5, 1],
});
b.upsertComponent(
  "InventoryPanel/GridSection",
  "MOD.Core.CanvasGroupComponent",
  {
    "@type": "MOD.Core.CanvasGroupComponent",
    Enable: true,
    BlocksRaycasts: true,
    GroupAlpha: 1,
    Interactable: true,
  },
);
sprite("InventoryPanel/GridSection", "slot-inventory", 1, false, {
  r: 1,
  g: 1,
  b: 1,
  a: 0.20,
});
b.patch("InventoryPanel/GridSection/ItemGrid", {
  anchor: "stretch",
  rect_size: [432, 480],
});
b.patchComponent(
  "InventoryPanel/GridSection/ItemGrid",
  "MOD.Core.UITransformComponent",
  {
    OffsetMin: { x: 8, y: 8 },
    OffsetMax: { x: -8, y: -8 },
  },
);
b.patchComponent(
  "InventoryPanel/GridSection/ItemGrid",
  "MOD.Core.GridViewComponent",
  {
    CellSize: { x: 76, y: 76 },
    FixedCount: 5,
    FixedType: 0,
    Spacing: { x: 8, y: 8 },
    Padding: { left: 0, right: 20, top: 0, bottom: 0 },
    UseScroll: true,
    ScrollBarVisible: 0,
    ScrollBarThickness: 14,
    ScrollBarBackgroundImageRUID: dataRef("scroll-track"),
    ScrollBarHandleImageRUID: dataRef("scroll-handle"),
    ScrollBarBackgroundColor: C.white,
    ScrollBarHandleColor: C.white,
    VerticalScrollBarDirection: 3,
  },
);
const template = "InventoryPanel/GridSection/ItemGrid/ItemTemplate";
b.patch(template, {
  anchor: "top-left",
  pos: [0, 0],
  rect_size: [76, 76],
  pivot: [0, 1],
});
sprite(template, "slot-inventory", 1, true);
b.patch(`${template}/Icon`, {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [60, 60],
});
b.patch(`${template}/Selection`, { anchor: "stretch", rect_size: [76, 76] });
sprite(`${template}/Selection`, "slot-selection", 0, false);
b.patch(`${template}/Grade`, {
  anchor: "top-center",
  pos: [0, -3],
  rect_size: [66, 4],
});
b.patch(`${template}/Quantity`, {
  anchor: "bottom-right",
  pos: [-4, 4],
  rect_size: [40, 22],
});
textStyle(`${template}/Quantity`, 18, C.white, 4, 1024, true);
b.patchComponent(`${template}/Quantity`, "MOD.Core.TextGUIRendererComponent", {
  OutlineColor: { r: 0, g: 0, b: 0, a: 1 },
  OutlineWidth: 3,
});
b.patch(`${template}/New`, {
  anchor: "top-left",
  pos: [5, -5],
  rect_size: [18, 18],
});
b.patchComponent(`${template}/New`, "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: "" },
  Color: C.transparent,
  RaycastTarget: false,
});
b.patchComponent(`${template}/New`, "MOD.Core.TextGUIRendererComponent", {
  Text: "●",
});
textStyle(
  `${template}/New`,
  18,
  { r: 0.92, g: 0.10, b: 0.12, a: 1 },
  2,
  512,
  true,
);
b.patchComponent(`${template}/New`, "MOD.Core.TextGUIRendererComponent", {
  OutlineColor: { r: 0.25, g: 0, b: 0, a: 1 },
  OutlineWidth: 1,
});
b.patch(`${template}/Equipped`, {
  anchor: "bottom-left",
  pos: [4, 4],
  rect_size: [32, 18],
});
b.patch(`${template}/Disabled`, { anchor: "stretch", rect_size: [76, 76] });

// Inventory footer: status/capacity row plus one unambiguous sort state button.
b.patch("InventoryPanel/Footer", {
  anchor: "bottom-center",
  pos: [0, 16],
  rect_size: [448, 128],
  pivot: [0.5, 0],
});
b.patchComponent("InventoryPanel/Footer", "MOD.Core.SpriteGUIRendererComponent", {
  Color: C.transparent,
  RaycastTarget: false,
});
for (const obsolete of [
  "InventoryPanel/Footer/MesoBar",
  "InventoryPanel/Footer/CurrencyIcon",
  "InventoryPanel/Footer/CurrencyText",
]) {
  if (b.find(obsolete)) b.remove(obsolete);
}
b.patch("InventoryPanel/Footer/CapacityText", {
  anchor: "top-left",
  pos: [8, -12],
  rect_size: [140, 30],
  pivot: [0, 1],
});
textStyle(
  "InventoryPanel/Footer/CapacityText",
  18,
  C.mutedBlue,
  1,
  512,
  false,
);
b.patch("InventoryPanel/Footer/InventoryStatusText", {
  anchor: "top-left",
  pos: [152, -12],
  rect_size: [288, 30],
  pivot: [0, 1],
});
textStyle(
  "InventoryPanel/Footer/InventoryStatusText",
  16,
  C.mutedBlue,
  1,
  512,
  false,
);
b.patch("InventoryPanel/Footer/SortButton", {
  anchor: "bottom-right",
  pos: [-8, 8],
  rect_size: [156, 48],
  pivot: [1, 0],
});
spriteSwap(
  "InventoryPanel/Footer/SortButton",
  "action-normal",
  "action-hover",
  "action-pressed",
);
b.patchComponent(
  "InventoryPanel/Footer/SortButton",
  "MOD.Core.TextGUIRendererComponent",
  { Text: "" },
);
b.patch("InventoryPanel/Footer/SortButton/ModeText", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [132, 42],
  pivot: [0.5, 0.5],
});
textStyle(
  "InventoryPanel/Footer/SortButton/ModeText",
  18,
  C.white,
  2,
  512,
  true,
);

// Equipment hierarchy: shared frame, static live avatar preview, symmetric five slots.
b.patch("EquipmentPanel/EquipmentSection", {
  anchor: "top-center",
  pos: [0, -74],
  rect_size: [448, 552],
  pivot: [0.5, 1],
});
sprite("EquipmentPanel/EquipmentSection", "slot-equipment", 1, false, {
  r: 1,
  g: 1,
  b: 1,
  a: 0.18,
});
b.patch("EquipmentPanel/EquipmentSection/SectionTitle", {
  anchor: "top-left",
  pos: [14, -10],
  rect_size: [180, 28],
  pivot: [0, 1],
});
b.patchComponent(
  "EquipmentPanel/EquipmentSection/SectionTitle",
  "MOD.Core.TextGUIRendererComponent",
  { Text: "EQUIPMENT" },
);
textStyle(
  "EquipmentPanel/EquipmentSection/SectionTitle",
  18,
  C.mutedBlue,
  1,
  512,
  true,
);
b.patch("EquipmentPanel/EquipmentSection/SlotGrid", {
  anchor: "stretch",
  pos: [0, 0],
  rect_size: [416, 504],
  pivot: [0.5, 0.5],
});
b.patchComponent(
  "EquipmentPanel/EquipmentSection/SlotGrid",
  "MOD.Core.UITransformComponent",
  {
    OffsetMin: { x: 16, y: 16 },
    OffsetMax: { x: -16, y: -40 },
  },
);
b.patchComponent(
  "EquipmentPanel/EquipmentSection/SlotGrid",
  "MOD.Core.ScrollLayoutGroupComponent",
  { Enable: false },
);
for (const obsolete of [
  "EquipmentPanel/EquipmentSection/SlotGrid/Cell_Empty_TopLeft",
  "EquipmentPanel/EquipmentSection/SlotGrid/Cell_Empty_TopRight",
  "EquipmentPanel/EquipmentSection/SlotGrid/Cell_Empty_BottomRight",
]) {
  if (b.find(obsolete)) b.remove(obsolete);
}
const preview = "EquipmentPanel/EquipmentSection/SlotGrid/Cell_Preview";
const avatarPreview = `${preview}/AvatarPreview`;
if (b.find(`${preview}/Silhouette`)) b.remove(`${preview}/Silhouette`);
b.patch(preview, {
  anchor: "top-center",
  pos: [0, -68],
  rect_size: [178, 370],
  pivot: [0.5, 1],
});
if (!b.find(avatarPreview)) {
  b.avatar(avatarPreview, {
    anchor: "middle-center",
    pos: [0, -4],
    rect_size: [178, 354],
    pivot: [0.5, 0.5],
    play_rate: 0,
    preserve_avatar: 1,
    raycast: false,
  });
} else {
  b.patch(avatarPreview, {
    anchor: "middle-center",
    pos: [0, -4],
    rect_size: [178, 354],
    pivot: [0.5, 0.5],
  });
}
b.upsertComponent(
  `${preview}/AvatarPreview`,
  "MOD.Core.CostumeManagerComponent",
  {
    "@type": "MOD.Core.CostumeManagerComponent",
    Enable: true,
    DefaultEquipUserId: "",
    UseCustomEquipOnly: true,
  },
);
b.patchComponent(
  `${preview}/AvatarPreview`,
  "MOD.Core.AvatarGUIRendererComponent",
  {
    PlayRate: 0,
    PreserveAvatar: 1,
    RaycastTarget: false,
    Color: C.white,
  },
);
patchEquipmentCell("Cell_Helmet", "HelmetSlotButton", 0, -18, "모자");
patchEquipmentCell("Cell_Weapon", "WeaponSlotButton", -142, -168, "무기");
patchEquipmentCell("Cell_Armor", "ArmorSlotButton", 142, -168, "상의");
patchEquipmentCell("Cell_Gloves", "GlovesSlotButton", -142, -330, "장갑");
patchEquipmentCell("Cell_Shoes", "ShoesSlotButton", 142, -330, "신발");

// Stat section: consistent left labels/right values.
b.patch("EquipmentPanel/StatsSection", {
  anchor: "bottom-center",
  pos: [0, 16],
  rect_size: [448, 166],
  pivot: [0.5, 0],
});
sprite("EquipmentPanel/StatsSection", "tooltip-description-panel", 1, false);
b.patch("EquipmentPanel/StatsSection/Title", {
  anchor: "top-left",
  pos: [16, -18],
  rect_size: [200, 24],
  pivot: [0, 1],
});
textStyle(
  "EquipmentPanel/StatsSection/Title",
  20,
  C.paleBlue,
  1,
  512,
  true,
);
[
  ["AttackRow", "공격력", -46],
  ["MaxHpRow", "최대 HP", -84],
  ["DefenseRow", "방어력", -122],
].forEach(([rowName, label, y]) => {
  const row = `EquipmentPanel/StatsSection/${rowName}`;
  b.patch(row, {
    anchor: "top-center",
    pos: [0, rowName === "AttackRow" ? -50 : rowName === "DefenseRow" ? -118 : y],
    rect_size: [408, 32],
    pivot: [0.5, 1],
  });
  b.patch(`${row}/Label`, {
    anchor: "middle-left",
    pos: [0, 0],
    rect_size: [190, 34],
    pivot: [0, 0.5],
  });
  b.patchComponent(`${row}/Label`, "MOD.Core.TextGUIRendererComponent", {
    Text: label,
  });
  textStyle(`${row}/Label`, 18, C.paleBlue, 1, 512, false);
  b.patch(`${row}/Value`, {
    anchor: "middle-right",
    pos: [0, 0],
    rect_size: [190, 34],
    pivot: [1, 0.5],
  });
  textStyle(`${row}/Value`, 19, C.white, 4, 512, true);
});

// Item detail: generated dark frame with real visual sub-sections.
b.patch("TooltipPanel", {
  anchor: "middle-center",
  pos: [0, 30],
  rect_size: [420, 820],
  pivot: [0.5, 0.5],
  display_order: 100,
});
sprite("TooltipPanel", "tooltip-frame", 1, true, C.darkTooltip);
b.patch("TooltipPanel/Header", {
  anchor: "top-center",
  pos: [0, -18],
  rect_size: [388, 58],
  pivot: [0.5, 1],
});
b.patchComponent("TooltipPanel/Header", "MOD.Core.SpriteGUIRendererComponent", {
  Color: C.transparent,
  RaycastTarget: false,
});
b.patch("TooltipPanel/Header/CloseButton", {
  anchor: "top-right",
  pos: [0, 0],
  rect_size: [44, 44],
  pivot: [1, 1],
});
spriteSwap(
  "TooltipPanel/Header/CloseButton",
  "close-normal",
  "close-hover",
  "close-pressed",
);
b.patch("TooltipPanel/Header/CloseButton/Visual", { enable: false });
b.patch("TooltipPanel/Header/TooltipTitleText", {
  anchor: "stretch",
  pos: [0, 0],
  rect_size: [330, 52],
  pivot: [0.5, 0.5],
});
b.patchComponent(
  "TooltipPanel/Header/TooltipTitleText",
  "MOD.Core.UITransformComponent",
  {
    OffsetMin: { x: 10, y: 0 },
    OffsetMax: { x: -54, y: -2 },
  },
);
textStyle(
  "TooltipPanel/Header/TooltipTitleText",
  26,
  { r: 1, g: 0.58, b: 0.08, a: 1 },
  2,
  512,
  true,
);
b.sprite("TooltipPanel/IconBox", {
  anchor: "top-left",
  pos: [22, -86],
  rect_size: [116, 116],
  pivot: [0, 1],
  image_ruid: RUIDS["tooltip-icon-box"],
  image_type: 1,
});
b.patch("TooltipPanel/TooltipIcon", {
  anchor: "top-left",
  pos: [32, -96],
  rect_size: [96, 96],
  pivot: [0, 1],
  display_order: 20,
});
b.sprite("TooltipPanel/JobStrip", {
  anchor: "top-right",
  pos: [-20, -88],
  rect_size: [246, 62],
  pivot: [1, 1],
  image_ruid: RUIDS["tooltip-job-strip"],
  image_type: 1,
});
b.patch("TooltipPanel/TooltipGradeText", {
  anchor: "top-right",
  pos: [-32, -96],
  rect_size: [222, 46],
  pivot: [1, 1],
  display_order: 20,
});
textStyle(
  "TooltipPanel/TooltipGradeText",
  19,
  C.white,
  2,
  512,
  true,
);
b.sprite("TooltipPanel/DetailsPanel", {
  anchor: "top-center",
  pos: [0, -224],
  rect_size: [380, 310],
  pivot: [0.5, 1],
  image_ruid: RUIDS["tooltip-description-panel"],
  image_type: 1,
});
b.patch("TooltipPanel/TooltipDetailsText", {
  anchor: "top-center",
  pos: [0, -238],
  rect_size: [344, 282],
  pivot: [0.5, 1],
  display_order: 20,
});
textStyle(
  "TooltipPanel/TooltipDetailsText",
  18,
  C.white,
  1,
  256,
  false,
);
b.patch("TooltipPanel/ComparePanel", {
  anchor: "bottom-center",
  pos: [0, 92],
  rect_size: [380, 122],
  pivot: [0.5, 0],
});
sprite("TooltipPanel/ComparePanel", "tooltip-description-panel", 1, false);
b.patch("TooltipPanel/ComparePanel/TooltipCompareText", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [348, 94],
  pivot: [0.5, 0.5],
});
textStyle(
  "TooltipPanel/ComparePanel/TooltipCompareText",
  17,
  C.paleBlue,
  1,
  512,
  false,
);
b.patch("TooltipPanel/ActionButton", {
  anchor: "bottom-center",
  pos: [0, 24],
  rect_size: [210, 54],
  pivot: [0.5, 0],
});
spriteSwap(
  "TooltipPanel/ActionButton",
  "action-normal",
  "action-hover",
  "action-pressed",
);
textStyle(
  "TooltipPanel/ActionButton",
  20,
  C.white,
  2,
  512,
  true,
);

// Make the whole tooltip subtree the final top-level sibling so it renders above every unified-info panel.
moveSubtreeToVisualFront("TooltipPanel");

// Enforce the bordered-container rule during every rebuild.
assertInsideBorder("InventoryPanel", "InventoryPanel/TabBar");
for (const childName of ["Title", "AttackRow", "MaxHpRow", "DefenseRow"]) {
  assertInsideBorder(
    "EquipmentPanel/StatsSection",
    `EquipmentPanel/StatsSection/${childName}`,
  );
}

// Preserve every existing controller UUID; only write the rebuilt UI tree.
b.write(UI_PATH, {
  lint: true,
  strict: true,
  lint_verbose: true,
  bind: {
    mlua: path.join(
      ROOT,
      "RootDesk",
      "MyDesk",
      "Equipment",
      "EquipmentInventoryUI.mlua",
    ),
    props: {
      GridSection: "InventoryPanel/GridSection",
      AvatarPreview:
        "EquipmentPanel/EquipmentSection/SlotGrid/Cell_Preview/AvatarPreview",
    },
  },
});

console.log(
  JSON.stringify(
    {
      ui: UI_PATH,
      entities: b.listEntities().length,
      inventory: { size: [480, 820], pos: [248, 30] },
      equipment: { size: [480, 820], pos: [-248, 30] },
      grid: { columns: 5, cell: [76, 76], spacing: [8, 8] },
      tooltip: { size: [420, 820], position: "selected-slot-adjacent, window-height-aligned" },
    },
    null,
    2,
  ),
);
