const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const HUD_FILE = 'ui/ClassicPlayerHUD.ui';
const SKILL_FILE = 'ui/SkillWindow.ui';
const QUICK_ROOT = '/ui/ClassicPlayerHUD/HudFrame/QuickSlots';
const ROTATED_FRAME = QUICK_ROOT + '/RotatedFrame';

function patchHud() {
  const b = UIBuilder.read(HUD_FILE);
  const quickRenderer = b.getComponent(QUICK_ROOT, 'MOD.Core.SpriteGUIRendererComponent');
  const frameRuid = quickRenderer.ImageRUID.DataId;

  b.patchComponent(QUICK_ROOT, 'MOD.Core.UITransformComponent', {
    AnchorsMin: { x: 1, y: 1 },
    AnchorsMax: { x: 1, y: 1 },
    Pivot: { x: 1, y: 0 },
    RectSize: { x: 204, y: 388 },
    anchoredPosition: { x: 0, y: 0 },
    OffsetMin: { x: -204, y: 0 },
    OffsetMax: { x: 0, y: 388 },
  });
  b.patchComponent(QUICK_ROOT, 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 1, g: 1, b: 1, a: 0 },
    RaycastTarget: false,
  });

  b.patch(QUICK_ROOT + '/SeamFill', {
    anchor: 'middle-center',
    pos: [0, 0],
    rect_size: [172, 352],
    display_order: 0,
  });

  if (b.find(ROTATED_FRAME) == null) {
    b.sprite(ROTATED_FRAME, {
      anchor: 'middle-center',
      pos: [0, 0],
      rect_size: [388, 204],
      image_ruid: frameRuid,
      sprite_type: 0,
      preserve_aspect: false,
      raycast: false,
    });
  }
  b.patch(ROTATED_FRAME, {
    anchor: 'middle-center',
    pos: [0, 0],
    rect_size: [388, 204],
    display_order: 1,
  });
  b.patchComponent(ROTATED_FRAME, 'MOD.Core.UITransformComponent', {
    QuaternionRotation: { x: 0, y: 0, z: 0.7071067811865475, w: 0.7071067811865476 },
  });
  b.patchComponent(ROTATED_FRAME, 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: frameRuid },
    Color: { r: 1, g: 1, b: 1, a: 1 },
    Type: 0,
    RaycastTarget: false,
  });

  for (let i = 1; i <= 8; i += 1) {
    const col = (i - 1) % 2;
    const row = Math.floor((i - 1) / 2);
    const x = 12 + col * 92;
    const y = -12 - row * 92;
    const slotPath = QUICK_ROOT + '/Slot_' + i;
    b.patch(slotPath, { display_order: i + 1 });
    b.patchComponent(slotPath, 'MOD.Core.UITransformComponent', {
      AnchorsMin: { x: 0, y: 1 },
      AnchorsMax: { x: 0, y: 1 },
      Pivot: { x: 0, y: 1 },
      RectSize: { x: 88, y: 88 },
      anchoredPosition: { x, y },
      OffsetMin: { x, y: y - 88 },
      OffsetMax: { x: x + 88, y },
    });
  }

  b.write(HUD_FILE, { lint_verbose: true });
}

function patchSlotSettings() {
  const b = UIBuilder.read(SKILL_FILE);
  const panel = '/ui/SkillWindow/SlotGroup/Panel';

  b.patch(panel, { anchor: 'middle-center', pos: [-390, 40], rect_size: [190, 430] });
  b.patch(panel + '/Inner', { anchor: 'stretch', pos: [0, 0], rect_size: [176, 416] });
  b.patch(panel + '/TitleBar', { anchor: 'top-center', pos: [0, -8], rect_size: [170, 48] });
  b.patch(panel + '/TitleBar/Title', { anchor: 'middle-center', pos: [0, 0], rect_size: [150, 40] });

  for (let i = 1; i <= 8; i += 1) {
    const col = (i - 1) % 2;
    const row = Math.floor((i - 1) / 2);
    b.patch(panel + '/Slot_' + i, {
      anchor: 'top-left',
      pos: [19 + col * 78, -64 - row * 78],
      rect_size: [72, 72],
    });
  }

  b.patch(panel + '/HintText', {
    anchor: 'bottom-center',
    pos: [0, 8],
    rect_size: [176, 38],
  });
  b.patchComponent(panel + '/HintText', 'MOD.Core.TextGUIRendererComponent', {
    Text: '1–2 / 3–4 / 5–6 / 7–8',
    FontSize: 15,
    Padding: { left: 10, right: 10, top: 4, bottom: 4 },
  });

  b.write(SKILL_FILE, { lint_verbose: true });
}

patchHud();
patchSlotSettings();

console.log(JSON.stringify({
  hud: UIBuilder.snapshot(HUD_FILE),
  skill: UIBuilder.snapshot(SKILL_FILE),
  layout: [[1, 2], [3, 4], [5, 6], [7, 8]],
}, null, 2));
