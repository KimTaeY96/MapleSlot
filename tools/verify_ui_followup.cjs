const fs = require('fs');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const hud = UIBuilder.read('ui/ClassicPlayerHUD.ui');
const level = hud.getComponent('HudFrame/LevelLabel', 'MOD.Core.TextGUIRendererComponent');
const fillTransform = hud.getComponent('HudFrame/ExpGauge/Fill', 'MOD.Core.UITransformComponent');
const expTextTransform = hud.getComponent('HudFrame/ExpGauge/ValueText', 'MOD.Core.UITransformComponent');
const expText = hud.getComponent('HudFrame/ExpGauge/ValueText', 'MOD.Core.TextGUIRendererComponent');
const inventoryTouch = hud.getComponent('HudFrame/InventoryButton', 'MOD.Core.UITouchReceiveComponent');

const inventory = UIBuilder.read('ui/EquipmentInventory.ui');
const selected = inventory.getComponent(
  'InventoryPanel/TabBar/EquipmentTabButton/Selected',
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
  selectedColor: selected.Color,
  selectedOutline: selected.Outline,
  selectedImage: selected.ImageRUID?.DataId,
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
  || result.selectedColor.r !== 1
  || result.selectedColor.g !== 0.76
  || result.selectedOutline !== true
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
