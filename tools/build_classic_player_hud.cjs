const fs = require('node:fs');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const R = {
  hud: '2f078b8c944d49b5b3cafef5a5b2d0fe',
  hp: '51acb1aa892f4534a75155564f88d098',
  mp: '101fd676b4904874a8b1a1653e99d908',
  exp: 'b302e62956f0465ca378677d031b4a54',
  hitbox: 'a133768e51bc4d7caee800bffdd14944',
  menuHover: '4664cc83a49640e5bec64bf57ed2b51f',
  menuPressed: '9c5feb02221248e7a1812578ad25181d',
  menuDisabled: '5a16a754bd26461bbbadb0be8edbe65a',
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
  anchor: 'top-right', pos: [0, 0], rect_size: [247, 110],
  image_ruid: R.hitbox, sprite_type: 0,
});
b.upsertComponent('HudFrame/InventoryButton', 'MOD.Core.UITouchReceiveComponent');

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

b.patchComponent('HudFrame/InventoryButton', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 1, g: 1, b: 1, a: 1 }, Type: 0,
});
b.patchComponent('HudFrame/InventoryButton', 'MOD.Core.ButtonComponent', {
  Transition: 2,
  ImageRUIDs: {
    HighlightedSprite: { DataId: R.menuHover },
    PressedSprite: { DataId: R.menuPressed },
    SelectedSprite: { DataId: R.menuHover },
    DisabledSprite: { DataId: R.menuDisabled },
  },
});

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
    },
  },
});

console.log(JSON.stringify(UIBuilder.snapshot('ui/ClassicPlayerHUD.ui'), null, 2));
