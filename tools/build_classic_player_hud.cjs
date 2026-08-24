const fs = require('node:fs');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const R = {
  hud: '2f078b8c944d49b5b3cafef5a5b2d0fe',
  hp: '51acb1aa892f4534a75155564f88d098',
  mp: '101fd676b4904874a8b1a1653e99d908',
  exp: 'b302e62956f0465ca378677d031b4a54',
  menuButtonBlue: '008c9a704d284753a32ab40da2cfbd52',
  menuButtonGreen: 'cd1e25491fb243edba76e79613c1987a',
  inventoryBagIcon: '1b0f6476f399444b9ff8f23958c447f8',
  skillBookIcon: '2459bb7e8ca24eb3963e11a30b1c3ecd',
  quickSlots: '5e4ee74cd7d0453994d4ce6a0ed4130c',
  cooldownOverlay: 'ddf8548f22114eedb558f9decec77ba4',
};

const projectCoreVersion = JSON.parse(fs.readFileSync('Environment/config', 'utf8')).CoreVersion;
const b = new UIBuilder('ClassicPlayerHUD', 4, true);
b.script('Controller', 'script.ClassicPlayerHUD', { anchor: 'stretch', rect_size: [1920, 1080] });
b.sprite('HudFrame', {
  anchor: 'bottom-center', pos: [0, 0], rect_size: [1920, 110],
  image_ruid: R.hud, sprite_type: 0, preserve_aspect: true, raycast: false,
});
b.patchComponent('HudFrame', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0,
});

b.text('HudFrame/LevelLabel', 'LV', {
  anchor: 'top-left', pos: [24, -18], rect_size: [58, 36], size: 28,
  color: '#DFF7FF', bold: true, alignment: 0,
});
b.text('HudFrame/LevelText', '1', {
  anchor: 'top-left', pos: [88, -18], rect_size: [68, 36], size: 30,
  color: '#FFFFFF', bold: true, alignment: 0,
});
b.text('HudFrame/CharacterNameText', 'PLAYER', {
  anchor: 'top-left', pos: [218, -17], rect_size: [350, 38], size: 28,
  color: '#FFFFFF', bold: true, alignment: 0,
});
b.text('HudFrame/CharacterSubText', 'ADVENTURER', {
  anchor: 'top-left', pos: [218, -61], rect_size: [350, 32], size: 22,
  color: '#9EC2D3', alignment: 0,
});

function addGauge(name, x, width, fillRuid, label) {
  const root = 'HudFrame/' + name;
  b.empty(root, { anchor: 'stretch', rect_size: [1920, 110] });
  b.sprite(root + '/Fill', {
    anchor: 'top-left', pos: [x + 16, -65], rect_size: [width - 32, 29],
    image_ruid: fillRuid, sprite_type: 0, raycast: false,
  });
  b.patchComponent(root + '/Fill', 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0,
  });
  b.text(root + '/ValueText', label, {
    anchor: 'top-left', pos: [x + 16, -17], rect_size: [width - 32, 38], size: 27,
    color: '#FFFFFF', bold: true, alignment: 4,
  });
}

function addExpGauge(x, width, fillRuid) {
  b.empty('HudFrame/ExpGauge', { anchor: 'stretch', rect_size: [1920, 110] });
  b.sprite('HudFrame/ExpGauge/Fill', {
    anchor: 'top-left', pos: [x + 16, -65], rect_size: [width - 32, 29],
    image_ruid: fillRuid, sprite_type: 0, raycast: false,
  });
  b.patchComponent('HudFrame/ExpGauge/Fill', 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0,
  });
  b.text('HudFrame/ExpGauge/ValueText', 'EXP 0 / 100 (0.0%)', {
    anchor: 'top-left', pos: [x + 16, -65], rect_size: [width - 32, 29], size: 23,
    color: '#FFFFFF', bold: true, alignment: 4,
  });
}

addGauge('HpGauge', 617, 335, R.hp, 'HP 100 / 100');
addGauge('MpGauge', 962, 335, R.mp, 'MP 100 / 100');
addExpGauge(1307, 335, R.exp);

b.button('HudFrame/InventoryButton', '', {
  anchor: 'top-right', pos: [-123.5, 0], rect_size: [123.5, 110],
  image_ruid: R.menuButtonBlue, sprite_type: 0, font_size: 20,
});
b.upsertComponent('HudFrame/InventoryButton', 'MOD.Core.UITouchReceiveComponent');
b.sprite('HudFrame/InventoryButton/Icon', {
  anchor: 'middle-center', pos: [0, 0], rect_size: [52, 52],
  image_ruid: R.inventoryBagIcon, sprite_type: 0, preserve_aspect: true, raycast: false,
});
b.patchComponent('HudFrame/InventoryButton/Icon', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0, RaycastTarget: false,
});
b.button('HudFrame/SkillButton', '', {
  anchor: 'top-right', pos: [0, 0], rect_size: [123.5, 110],
  image_ruid: R.menuButtonGreen, sprite_type: 0, font_size: 20,
});
b.upsertComponent('HudFrame/SkillButton', 'MOD.Core.UITouchReceiveComponent');
b.sprite('HudFrame/SkillButton/Icon', {
  anchor: 'middle-center', pos: [0, 0], rect_size: [70, 70],
  image_ruid: R.skillBookIcon, sprite_type: 0, preserve_aspect: true, raycast: false,
});
b.patchComponent('HudFrame/SkillButton/Icon', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0, RaycastTarget: false,
});

b.sprite('QuickSlots', {
  anchor: 'bottom-right', pos: [-24, 118], rect_size: [440, 220],
  image_ruid: R.quickSlots, sprite_type: 0, preserve_aspect: true, raycast: false,
});
b.patchComponent('QuickSlots', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0, RaycastTarget: false,
});
for (let i = 1; i <= 8; i += 1) {
  const col = (i - 1) % 4;
  const row = Math.floor((i - 1) / 4);
  const root = `QuickSlots/Slot_${i}`;
  b.empty(root, {
    anchor: 'middle-center', pos: [-143 + col * 95.5, 51 - row * 102], rect_size: [88, 88],
  });
  b.text(root + '/IconText', '', {
    anchor: 'middle-center', rect_size: [72, 72], size: 22,
    color: '#FFFFFF', bold: true, alignment: 4,
  });
  b.text('QuickSlots/SlotNumber_' + i, String(i), {
    anchor: 'middle-center', pos: [-143 + col * 95.5, 94 - row * 102], rect_size: [20, 18], size: 14,
    color: '#FFE2A1', bold: true, alignment: 4,
  });
  b.panel(root + '/CooldownShade', {
    anchor: 'middle-center', rect_size: [74, 74], image_ruid: R.cooldownOverlay,
    color: '#061728', alpha: 0.82, enable: false,
  });
  b.patchComponent(root + '/CooldownShade', 'MOD.Core.SpriteGUIRendererComponent', {
    Type: 3, FillMethod: 4, FillOrigin: 0, FillClockwise: true, FillAmount: 1,
    RaycastTarget: false,
  });
  b.text(root + '/CooldownShade/CooldownText', '', {
    anchor: 'middle-center', rect_size: [70, 70], size: 23,
    color: '#FFFFFF', bold: true, alignment: 4,
  });
}

const textPaths = [
  'HudFrame/LevelLabel', 'HudFrame/LevelText',
  'HudFrame/CharacterNameText', 'HudFrame/CharacterSubText',
  'HudFrame/HpGauge/ValueText', 'HudFrame/MpGauge/ValueText',
  'HudFrame/ExpGauge/ValueText',
];
for (const path of textPaths) {
  b.patchComponent(path, 'MOD.Core.TextGUIRendererComponent', {
    Font: 'Maple', Underlay: true,
    UnderlayColor: { r: 0, g: 0, b: 0, a: 0.72 },
    Padding: { left: 12, right: 12, top: 4, bottom: 4 },
  });
}

b.patchComponent('HudFrame/ExpGauge/ValueText', 'MOD.Core.TextGUIRendererComponent', {
  FontColor: { r: 1, g: 1, b: 1, a: 1 },
  OutlineColor: { r: 0, g: 0, b: 0, a: 1 },
  OutlineWidth: 0.36,
  Underlay: true,
  UnderlayColor: { r: 0, g: 0, b: 0, a: 0.85 },
  UnderlayDilate: 0.2,
});

for (const [path, imageRuid] of [
  ['HudFrame/InventoryButton', R.menuButtonBlue],
  ['HudFrame/SkillButton', R.menuButtonGreen],
]) {
  b.patchComponent(path, 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0,
  });
  b.patchComponent(path, 'MOD.Core.ButtonComponent', {
    Transition: 1,
    Colors: {
      NormalColor: { r: 1, g: 1, b: 1, a: 1 },
      HighlightedColor: { r: 0.72, g: 0.72, b: 0.72, a: 1 },
      PressedColor: { r: 0.72, g: 0.72, b: 0.72, a: 1 },
      SelectedColor: { r: 1, g: 1, b: 1, a: 1 },
      DisabledColor: { r: 0.72, g: 0.72, b: 0.72, a: 0.55 },
      ColorMultiplier: 1,
      FadeDuration: 0.08,
    },
    ImageRUIDs: {
      HighlightedSprite: { DataId: imageRuid },
      PressedSprite: { DataId: imageRuid },
      SelectedSprite: { DataId: imageRuid },
      DisabledSprite: { DataId: imageRuid },
    },
  });
}

b._data = b.build();
b._data.CoreVersion = projectCoreVersion;

b.write('ui/ClassicPlayerHUD.ui', {
  lint_verbose: true,
  bind: {
    mlua: 'RootDesk/MyDesk/UI/ClassicPlayerHUD.mlua',
    props: {
      HudFrame: 'HudFrame',
      LevelText: 'HudFrame/LevelText',
      CharacterNameText: 'HudFrame/CharacterNameText',
      CharacterSubText: 'HudFrame/CharacterSubText',
      HpText: 'HudFrame/HpGauge/ValueText',
      MpText: 'HudFrame/MpGauge/ValueText',
      ExpText: 'HudFrame/ExpGauge/ValueText',
      HpFill: 'HudFrame/HpGauge/Fill',
      MpFill: 'HudFrame/MpGauge/Fill',
      ExpFill: 'HudFrame/ExpGauge/Fill',
      InventoryButton: 'HudFrame/InventoryButton',
      SkillButton: 'HudFrame/SkillButton',
    },
  },
});

console.log(JSON.stringify(UIBuilder.snapshot('ui/ClassicPlayerHUD.ui'), null, 2));
