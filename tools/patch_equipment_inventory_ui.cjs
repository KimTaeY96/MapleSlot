const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const b = UIBuilder.load('ui/EquipmentInventory.ui');

b.patchComponent('InventoryPanel/TabBar', 'MOD.Core.ScrollLayoutGroupComponent', {
  CellSize: { x: 88, y: 62 },
  GridSpacing: { x: 8, y: 0 },
  Padding: { left: 20, right: 20, top: 0, bottom: 0 },
  ConstraintCount: 4,
  UseScroll: false,
});

const informationTextPaths = [
  'InventoryPanel/Footer/CapacityText',
  'InventoryPanel/Footer/InventoryStatusText',
  'EquipmentPanel/StatsSection/Title',
  'EquipmentPanel/StatsSection/AttackRow/Label',
  'EquipmentPanel/StatsSection/AttackRow/Value',
  'EquipmentPanel/StatsSection/MaxHpRow/Label',
  'EquipmentPanel/StatsSection/MaxHpRow/Value',
  'EquipmentPanel/StatsSection/DefenseRow/Label',
  'EquipmentPanel/StatsSection/DefenseRow/Value',
  'TooltipPanel/TooltipGradeText',
  'TooltipPanel/TooltipDetailsText',
  'TooltipPanel/ComparePanel/TooltipCompareText',
];

for (const path of informationTextPaths) {
  const vertical = path.includes('TooltipDetailsText') || path.includes('TooltipCompareText') ? 10 : 0;
  b.patchComponent(path, 'MOD.Core.TextGUIRendererComponent', {
    Padding: { left: 10, right: 10, top: vertical, bottom: vertical },
  });
}

const selectedTabPaths = [
  'InventoryPanel/TabBar/EquipmentTabButton',
  'InventoryPanel/TabBar/ConsumableTabButton',
  'InventoryPanel/TabBar/MaterialTabButton',
  'InventoryPanel/TabBar/EtcTabButton',
];
for (const tabPath of selectedTabPaths) {
  b.patchComponent(tabPath, 'MOD.Core.ButtonComponent', {
    Transition: 1,
    Colors: {
      NormalColor: { r: 1, g: 1, b: 1, a: 1 },
      HighlightedColor: { r: 1, g: 0.96, b: 0.82, a: 1 },
      PressedColor: { r: 0.92, g: 0.78, b: 0.38, a: 1 },
      SelectedColor: { r: 1, g: 1, b: 1, a: 1 },
      DisabledColor: { r: 0.72, g: 0.72, b: 0.72, a: 0.55 },
      ColorMultiplier: 1,
      FadeDuration: 0.08,
    },
  });
  b.patchComponent(`${tabPath}/Selected`, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: 'fab84ecbc11047c3bef60f2f9a79d9ff' },
    Color: { r: 1, g: 0.76, b: 0.16, a: 1 },
    Outline: true,
    OutlineColor: { r: 1, g: 0.94, b: 0.52, a: 1 },
    OutlineWidth: 2,
    Type: 1,
    RaycastTarget: false,
  });
}

b.write('ui/EquipmentInventory.ui', { lint_verbose: true });
console.log(JSON.stringify(UIBuilder.snapshot('ui/EquipmentInventory.ui').filter((entry) => entry.path.includes('/TabBar/')), null, 2));
