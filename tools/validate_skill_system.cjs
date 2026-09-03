const assert = require('node:assert/strict');
const fs = require('node:fs');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const definitionSource = fs.readFileSync('RootDesk/MyDesk/Skills/SkillDefinitionRuntime.mlua','utf8');
const stateSource = fs.readFileSync('RootDesk/MyDesk/Skills/PlayerSkillComponent.mlua','utf8');
const uiSource = fs.readFileSync('RootDesk/MyDesk/Skills/SkillWindowUI.mlua','utf8');
const combatSource = fs.readFileSync('RootDesk/MyDesk/Combat/CombatPlayerAutoBattle.mlua','utf8');
const progressionSource = fs.readFileSync('RootDesk/MyDesk/Player/PlayerProgressionComponent.mlua','utf8');
const builderSource = fs.readFileSync('tools/build_skill_window_ui.cjs','utf8');
const hudSource = fs.readFileSync('RootDesk/MyDesk/UI/ClassicPlayerHUD.mlua','utf8');
const hudBuilderSource = fs.readFileSync('tools/build_classic_player_hud.cjs','utf8');
const snapshot = UIBuilder.snapshot('ui/SkillWindow.ui');
const hudSnapshot = UIBuilder.snapshot('ui/ClassicPlayerHUD.ui');
const hudBuilder = UIBuilder.read('ui/ClassicPlayerHUD.ui');
const skillBuilder = UIBuilder.read('ui/SkillWindow.ui');
const assetMap = JSON.parse(fs.readFileSync('Assets/UI/ClassicSilver/ImageGen/skill-ui-ruid-map.json','utf8'));

function test(name, fn) {
  try { fn(); process.stdout.write('PASS '+name+'\n'); }
  catch (error) { process.stderr.write('FAIL '+name+': '+error.message+'\n'); process.exitCode=1; }
}
function linear(base, perLevel, level) { return level <= 0 ? 0 : base + perLevel * (level - 1); }

test('linear formula current and next level',()=>{
  assert.equal(linear(1200,120,1),1200);
  assert.equal(linear(1200,120,5),1680);
  assert.equal(linear(1200,120,6),1800);
  assert.match(definitionSource,/formula\.base \+ formula\.perLevel \* \(level - 1\)/);
});
test('eight active and six passive tier-I definitions',()=>{
  assert.equal((definitionSource.match(/type="active"/g)||[]).length,8);
  assert.equal((definitionSource.match(/type="passive"/g)||[]).length,6);
  assert.match(definitionSource,/TierSkillIds = \{\[1\] = \{\}\}/);
});
test('atomic skill-up validations and exact one-level spend',()=>{
  for(const reason of ['보유 SP가 부족합니다.','이미 마스터한 스킬입니다.','요구 캐릭터 레벨이 부족합니다.','선행 스킬 조건을 충족하지 못했습니다.']) assert.ok(stateSource.includes(reason));
  assert.match(stateSource,/availablePointsByTier\["1"\] = self\.State\.availablePointsByTier\["1"\] - 1/);
  assert.match(stateSource,/skillLevels\[skillId\] = currentLevel \+ 1/);
  assert.ok(stateSource.indexOf('availablePointsByTier["1"] = self.State.availablePointsByTier["1"] - 1') < stateSource.indexOf('CommitMutation("SKILL_LEVEL_UP")'));
});
test('level-up grants exactly three SP once per character level',()=>{
  assert.match(stateSource,/gained \* 3/);
  assert.match(stateSource,/characterLevel <= lastLevel then return/);
  assert.match(stateSource,/lastGrantedCharacterLevel = characterLevel/);
  assert.match(progressionSource,/GrantPointsForCharacterLevel\(self\.Level\)/);
});
test('player state is versioned and persists required fields',()=>{
  for(const field of ['availablePointsByTier','skillLevels','equippedSlots','cooldownEndTimes','saveVersion','lastSaveUtcMillis','lastGrantedCharacterLevel']) assert.ok(stateSource.includes(field));
  assert.match(stateSource,/StorageKey = "SkillStateV1"/);
  assert.match(stateSource,/SetAsync\(/);
  assert.match(stateSource,/SetAndWait\(/);
  assert.match(stateSource,/math\.max\(now, saved\)/);
  assert.match(stateSource,/OfflineRewardCapSeconds/);
});
test('slots reject passive and duplicate active skills',()=>{
  assert.ok(stateSource.includes('패시브 스킬은 슬롯에 장착할 수 없습니다.'));
  assert.ok(stateSource.includes('동일한 액티브 스킬은 중복 장착할 수 없습니다.'));
  assert.match(stateSource,/for slot=1,8 do/);
  assert.match(stateSource,/equippedSlots\[targetSlot\] = sourceSkill/);
  assert.match(stateSource,/equippedSlots\[sourceSlot\] = targetSkill/);
});
test('auto battle scans 1 to 8 and commits before damage',()=>{
  assert.match(stateSource,/method table SelectAutoSkill/);
  assert.match(stateSource,/for slot=1,8 do/);
  assert.match(combatSource,/SelectAutoSkill\(self\.TargetEntity\)/);
  assert.match(combatSource,/CommitActiveSkillUse\(self\.ActiveSkillId, target\)/);
  assert.ok(combatSource.indexOf('CommitActiveSkillUse(self.ActiveSkillId, target)') < combatSource.indexOf('self:CreateAttackShape(target, self.AttackFacingDirectionX)'));
});
test('tooltip uses shared calculation and immediate enter-exit',()=>{
  assert.match(definitionSource,/BuildTooltipData/);
  assert.match(definitionSource,/BuildLevelEffect/);
  assert.match(uiSource,/UITouchEnterEvent/);
  assert.match(uiSource,/UITouchExitEvent/);
  assert.match(uiSource,/self\.TooltipGroup\.Enable = true/);
  assert.match(uiSource,/self\.TooltipGroup\.Enable = false/);
  assert.match(uiSource,/nextRoot\.Enable = tooltip\.next ~= nil/);
});
test('UI contains locked tiers, fourteen rows, eight slots and one footer button',()=>{
  const paths=snapshot.map(x=>x.path);
  for(const name of ['TierIButton','Tier2Button','Tier3Button','Tier4Button']) assert.ok(paths.some(p=>p.endsWith('/'+name)));
  assert.equal(paths.filter(p=>p.includes('/SkillRow_') && p.split('/').at(-1).startsWith('SkillRow_')).length,14);
  assert.equal(paths.filter(p=>/\/Slot_[1-8]$/.test(p)).length,8);
  const footerButtons=snapshot.filter(x=>x.path.includes('/Footer/') && x.kind==='BTN');
  assert.deepEqual(footerButtons.map(x=>x.name),['SlotSettingsButton']);
  for(const tier of [2,3,4]) assert.ok(paths.some(p=>p.endsWith('/Tier'+tier+'Button/LockText')));
});
test('slot settings layout is exactly 4 by 2 in priority order',()=>{
  const slots=snapshot.filter(x=>/\/Slot_[1-8]$/.test(x.path)).sort((a,b)=>Number(a.name.slice(5))-Number(b.name.slice(5)));
  assert.deepEqual(slots.map(x=>x.pos),[
    [74,-125],[171,-125],[268,-125],[365,-125],
    [74,-222],[171,-222],[268,-222],[365,-222],
  ]);
  assert.equal(snapshot.filter(x=>/\/Slot_[1-8]\/IconSprite$/.test(x.path)).length,8);
});

test('tooltip renderers do not intercept pointer events',()=>{
  const data=JSON.parse(fs.readFileSync('ui/SkillWindow.ui','utf8'));
  const tooltipEntities=data.ContentProto.Entities.filter(e=>(e.jsonString.path||'').includes('/TooltipGroup/'));
  for(const entity of tooltipEntities){
    for(const component of entity.jsonString['@components']||[]){
      if(component['@type']==='MOD.Core.SpriteGUIRendererComponent' || component['@type']==='MOD.Core.TextGUIRendererComponent') assert.equal(component.RaycastTarget,false,entity.jsonString.path);
    }
  }
});
test('drag end resolves the hovered slot for mouse and touch',()=>{
  assert.match(uiSource,/DragHoverSlot/);
  assert.match(uiSource,/UITouchEndDragEvent, function\(\) self:FinishDrag\(\) end/);
  assert.match(uiSource,/if targetSlot > 0 then[\s\S]*self:DropOnSlot\(targetSlot\)/);
  assert.doesNotMatch(uiSource,/FinishDragOutside/);
  assert.match(uiSource,/RequestClearSlot\(sourceSlot\)/);
});
test('bottom HUD restores original proportions and splits the menu area evenly',()=>{
  const hud=hudSnapshot.find(x=>x.path.endsWith('/HudFrame'));
  const inventory=hudSnapshot.find(x=>x.path.endsWith('/HudFrame/InventoryButton'));
  const skill=hudSnapshot.find(x=>x.path.endsWith('/HudFrame/SkillButton'));
  assert.deepEqual(hud.size,[1920,110]);
  assert.deepEqual(inventory.size,[123.5,110]);
  assert.deepEqual(skill.size,[123.5,110]);
  assert.equal(inventory.pos[0],-123.5);
  assert.equal(skill.pos[0],0);
  assert.match(hudSource,/method void OpenSkillWindow\(\)/);
  assert.ok(!snapshot.some(x=>x.path.endsWith('/OpenButton')));
});
test('persistent quick-slot HUD is exactly four by two and mirrors cooldowns',()=>{
  const slots=hudSnapshot.filter(x=>/\/QuickSlots\/Slot_[1-8]$/.test(x.path)).sort((a,b)=>Number(a.name.slice(5))-Number(b.name.slice(5)));
  assert.equal(slots.length,8);
  assert.deepEqual(slots.map(x=>x.pos),[
    [-143,51],[-47.5,51],[48,51],[143.5,51],
    [-143,-51],[-47.5,-51],[48,-51],[143.5,-51],
  ]);
  const panel=hudSnapshot.find(x=>x.path.endsWith('/QuickSlots'));
  assert.deepEqual(panel.size,[440,220]);
  assert.deepEqual(panel.pos,[-24,118]);
  assert.match(uiSource,/HudSlotByIndex/);
  assert.match(uiSource,/\/ui\/ClassicPlayerHUD\/QuickSlots/);
  assert.match(uiSource,/RefreshCooldownOnSlot\(self\.HudSlotByIndex\[slot\]/);
  assert.equal(hudSnapshot.filter(x=>/\/QuickSlots\/Slot_[1-8]\/CooldownShade$/.test(x.path)).length,8);
  assert.equal(hudSnapshot.filter(x=>/\/QuickSlots\/Slot_[1-8]\/IconSprite$/.test(x.path)).length,8);
});

test('plain ImageGen UI resources are project-bound and referenced by RUID',()=>{
  const expectedFiles=['skill-window-main.png','skill-slot-panel.png','skill-tooltip.png','power_slash.png','double_slash.png','charge_slash.png','whirlwind_slash.png','guard_break.png','battle_cry.png','emergency_heal.png','final_blow.png','weapon_mastery.png','vitality_training.png','combat_sense.png','swift_training.png','recovery_boost.png','elite_hunter.png'];
  for(const file of expectedFiles) assert.ok(fs.existsSync('Assets/UI/ClassicSilver/ImageGen/'+file),file);
  assert.equal(Object.keys(assetMap.skillIcons).length,14);
  assert.equal(Object.keys(assetMap.skins).length,3);
  for(const ruid of [...Object.values(assetMap.skins),...Object.values(assetMap.skillIcons)]) {
    assert.match(ruid,/^[0-9a-f]{32}$/);
    assert.ok((builderSource+hudBuilderSource+definitionSource+JSON.stringify(assetMap)).includes(ruid),ruid);
  }
  assert.match(definitionSource,/iconRuid=/);
  assert.equal((definitionSource.match(/iconRuid="[0-9a-f]{32}"/g)||[]).length,14);
  assert.doesNotMatch(definitionSource,/icon="[A-Z+]+"/);
  assert.ok(!builderSource.includes('IconGlyph'));
  assert.ok(!uiSource.includes('IconText'));
  const main=skillBuilder.find('/ui/SkillWindow/MainGroup/Window');
  const slot=skillBuilder.find('/ui/SkillWindow/SlotGroup/Panel');
  const tip=skillBuilder.find('/ui/SkillWindow/TooltipGroup/Panel');
  const imageRuid=e=>{ const value=e.jsonString['@components'].find(c=>c['@type']==='MOD.Core.SpriteGUIRendererComponent').ImageRUID; return value.DataId || value; };
  assert.equal(imageRuid(main),assetMap.skins.skillWindowMain);
  assert.equal(imageRuid(slot),assetMap.skins.skillSlotPanel);
  assert.equal(imageRuid(tip),assetMap.skins.skillTooltip);
});

test('inventory and skill windows are mutually exclusive toggles',()=>{
  assert.match(hudSource,/skillUi:CloseWindow\(\)[\s\S]*inventoryUi:ToggleUnifiedInfo\(\)/);
  assert.match(hudSource,/inventoryUi:CloseUnifiedInfo\(\)/);
  assert.match(hudSource,/skillUi\.MainGroup\.Enable[\s\S]*skillUi:CloseWindow\(\)[\s\S]*skillUi:OpenWindow\(\)/);
  assert.match(hudSource,/SkillPressedHandler/);
  assert.match(hudSource,/SkillTouchDownHandler/);
});
test('custom style is independent from simple-black UI',()=>{
  assert.ok(!builderSource.includes('simple-black'));
  assert.ok(builderSource.includes('#59636F') && builderSource.includes('#08699D') && builderSource.includes('#F59A16') && builderSource.includes('#061E35'));
  assert.match(builderSource,/Padding:\{left:10,right:10/);
});
if(process.exitCode) process.exit(process.exitCode);
process.stdout.write('All skill system validation tests passed.\n');
