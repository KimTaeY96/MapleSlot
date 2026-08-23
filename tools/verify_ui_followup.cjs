const fs = require('fs');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const hud = UIBuilder.read('ui/ClassicPlayerHUD.ui');
const level = hud.getComponent('HudFrame/LevelLabel', 'MOD.Core.TextGUIRendererComponent');
const fillTransform = hud.getComponent('HudFrame/ExpGauge/Fill', 'MOD.Core.UITransformComponent');
const expTextTransform = hud.getComponent('HudFrame/ExpGauge/ValueText', 'MOD.Core.UITransformComponent');
const expText = hud.getComponent('HudFrame/ExpGauge/ValueText', 'MOD.Core.TextGUIRendererComponent');
const inventoryTouch = hud.getComponent('HudFrame/InventoryButton', 'MOD.Core.UITouchReceiveComponent');
const hudInventoryButton = hud.getComponent('HudFrame/InventoryButton', 'MOD.Core.ButtonComponent');
const hudInventorySprite = hud.getComponent('HudFrame/InventoryButton', 'MOD.Core.SpriteGUIRendererComponent');

const inventory = UIBuilder.read('ui/EquipmentInventory.ui');
const selected = inventory.getComponent(
  'InventoryPanel/TabBar/EquipmentTabButton/Selected',
  'MOD.Core.SpriteGUIRendererComponent',
);
const inventoryOpenButton = inventory.getComponent(
  'InventoryOpenButton',
  'MOD.Core.ButtonComponent',
);
const equipmentTabButton = inventory.getComponent(
  'InventoryPanel/TabBar/EquipmentTabButton',
  'MOD.Core.ButtonComponent',
);
const itemSelection = inventory.getComponent(
  'InventoryPanel/GridSection/ItemGrid/ItemTemplate/Selection',
  'MOD.Core.SpriteGUIRendererComponent',
);

const main = UIBuilder.read('ui/UIRoot_TestSandbox_MainPlay.ui');
const root = '/ui/UIRoot_TestSandbox_MainPlay';
const paths = new Set(main.build().ContentProto.Entities.map((entity) => entity.path));
const cheatPanel = main.find('Panel_DevCheat_Hidden');
const runtime = fs.readFileSync('RootDesk/MyDesk/SlotMachine/SlotMachineRuntime.mlua', 'utf8');
const classic = fs.readFileSync('RootDesk/MyDesk/UI/ClassicPlayerHUD.mlua', 'utf8');

const result = {
  levelText: level.Text,
  expTextOverlaysFill:
    expTextTransform.anchoredPosition.x === fillTransform.anchoredPosition.x
    && expTextTransform.anchoredPosition.y === fillTransform.anchoredPosition.y
    && expTextTransform.RectSize.x === fillTransform.RectSize.x
    && expTextTransform.RectSize.y === fillTransform.RectSize.y,
  expTextOutlined:
    expText.OutlineWidth > 0
    && expText.FontColor.r === 1 && expText.FontColor.g === 1 && expText.FontColor.b === 1,
  inventoryTouch: inventoryTouch != null,
  hudInventoryImage: hudInventorySprite.ImageRUID?.DataId,
  hudInventoryTransition: hudInventoryButton.Transition,
  hudInventoryStateSpritesUseBase: Object.values(hudInventoryButton.ImageRUIDs).every((value) => value?.DataId === hudInventorySprite.ImageRUID?.DataId),
  hudInventoryHighlighted: hudInventoryButton.Colors.HighlightedColor,
  hudInventoryPressed: hudInventoryButton.Colors.PressedColor,
  hudInventorySelected: hudInventoryButton.Colors.SelectedColor,
  hudInventoryRuntimeRuidSwapRemoved:
    !/Inventory(?:Normal|Pressed)RUID/.test(classic)
    && !/ImageRUID\s*=\s*DataRef\(self\.Inventory/.test(classic),
  selectedColor: selected.Color,
  selectedOutline: selected.Outline,
  selectedOutlineWidth: selected.OutlineWidth,
  selectedImage: selected.ImageRUID?.DataId,
  inventoryOpenTransition: inventoryOpenButton.Transition,
  inventoryOpenSpritesCleared: Object.values(inventoryOpenButton.ImageRUIDs).every((value) => value == null),
  inventoryOpenHighlighted: inventoryOpenButton.Colors.HighlightedColor,
  inventoryOpenPressed: inventoryOpenButton.Colors.PressedColor,
  equipmentTabTransition: equipmentTabButton.Transition,
  equipmentTabSpritesCleared: Object.values(equipmentTabButton.ImageRUIDs).every((value) => value == null),
  equipmentTabHighlighted: equipmentTabButton.Colors.HighlightedColor,
  equipmentTabPressed: equipmentTabButton.Colors.PressedColor,
  itemSelectionAlpha: itemSelection.Color.a,
  itemSelectionOutline: itemSelection.Outline,
  itemSelectionOutlineWidth: itemSelection.OutlineWidth,
  battleHudRemoved: !paths.has(`${root}/BattleHUD_Right`),
  floatingCheatRemoved: !paths.has(`${root}/Button_DevCheatMenu`),
  cheatPanelHidden: cheatPanel?.jsonString?.enable === false,
  closeButtonExists: paths.has(`${root}/Panel_DevCheat_Hidden/Button_CloseCheat`),
  holdSeconds: /end, 3\.0\)/.test(classic),
  battleBindingCleared: /battleHudTransform = ""/.test(runtime),
  panelBindingSet: /devCheatPanel = "[^"]+"/.test(runtime),
};

console.log(JSON.stringify(result, null, 2));

if (
  result.levelText !== 'LV'
  || result.expTextOverlaysFill !== true
  || result.expTextOutlined !== true
  || result.inventoryTouch !== true
  || result.hudInventoryImage !== 'a133768e51bc4d7caee800bffdd14944'
  || result.hudInventoryTransition !== 1
  || result.hudInventoryStateSpritesUseBase !== true
  || result.hudInventoryHighlighted.r !== 0.78
  || result.hudInventoryHighlighted.g !== 0.82
  || result.hudInventoryPressed.b !== 1
  || result.hudInventorySelected.b !== 1
  || result.hudInventoryRuntimeRuidSwapRemoved !== true
  || result.selectedColor.r !== 1
  || result.selectedColor.g !== 0.78
  || result.selectedColor.a !== 0.46
  || result.selectedOutline !== false
  || result.selectedOutlineWidth !== 0
  || result.inventoryOpenTransition !== 1
  || result.inventoryOpenSpritesCleared !== true
  || result.inventoryOpenHighlighted.r !== 0.78
  || result.inventoryOpenHighlighted.g !== 0.82
  || result.inventoryOpenPressed.b !== 1
  || result.equipmentTabTransition !== 1
  || result.equipmentTabSpritesCleared !== true
  || result.equipmentTabHighlighted.r !== 0.78
  || result.equipmentTabPressed.g !== 0.86
  || result.itemSelectionAlpha !== 0.28
  || result.itemSelectionOutline !== true
  || result.itemSelectionOutlineWidth !== 3
  || result.battleHudRemoved !== true
  || result.floatingCheatRemoved !== true
  || result.cheatPanelHidden !== true
  || result.closeButtonExists !== true
  || result.holdSeconds !== true
  || result.battleBindingCleared !== true
  || result.panelBindingSet !== true
) {
  process.exit(1);
}
