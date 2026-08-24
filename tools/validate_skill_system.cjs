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
test('slot layout is exactly 4 by 2',()=>{
  const slots=snapshot.filter(x=>/\/Slot_[1-8]$/.test(x.path)).sort((a,b)=>Number(a.name.slice(5))-Number(b.name.slice(5)));
  assert.equal(new Set(slots.slice(0,4).map(x=>x.pos[1])).size,1);
  assert.equal(new Set(slots.slice(4).map(x=>x.pos[1])).size,1);
  assert.notEqual(slots[0].pos[1],slots[4].pos[1]);
  assert.deepEqual(slots.slice(0,4).map(x=>x.pos[0]),slots.slice(4).map(x=>x.pos[0]));
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
  assert.equal(new Set(slots.slice(0,4).map(x=>x.pos[1])).size,1);
  assert.equal(new Set(slots.slice(4).map(x=>x.pos[1])).size,1);
  assert.deepEqual(slots.slice(0,4).map(x=>x.pos[0]),slots.slice(4).map(x=>x.pos[0]));
  assert.match(uiSource,/HudSlotByIndex/);
  assert.match(uiSource,/RefreshCooldownOnSlot\(self\.HudSlotByIndex\[slot\]/);
  assert.equal(hudSnapshot.filter(x=>/\/QuickSlots\/Slot_[1-8]\/CooldownShade$/.test(x.path)).length,8);
});
test('imagegen-authored UI resources are project-bound and referenced by RUID',()=>{
  for(const file of ['skill-action-button.png','skill-quickslots-4x2.png','skill-cooldown-overlay.png','skill-book-icon.png','hud-menu-button-reference.png','hud-menu-button-blue.png','hud-menu-button-green.png','hud-inventory-bag-icon.png']) {
    assert.ok(fs.existsSync('Assets/UI/ClassicSilver/'+file),file);
  }
  for(const ruid of ['3cebca63ed1d41e4be6e34ee8761172a','5e4ee74cd7d0453994d4ce6a0ed4130c','ddf8548f22114eedb558f9decec77ba4','2459bb7e8ca24eb3963e11a30b1c3ecd','008c9a704d284753a32ab40da2cfbd52','cd1e25491fb243edba76e79613c1987a','1b0f6476f399444b9ff8f23958c447f8']) {
    assert.ok((builderSource+hudBuilderSource).includes(ruid),ruid);
  }
  assert.ok(hudBuilderSource.includes('008c9a704d284753a32ab40da2cfbd52'));
  assert.ok(hudBuilderSource.includes('cd1e25491fb243edba76e79613c1987a'));
  assert.ok(hudBuilderSource.includes('1b0f6476f399444b9ff8f23958c447f8'));
  assert.ok(!hudBuilderSource.includes('9c5feb02221248e7a1812578ad25181d'));
  assert.ok(!hudBuilderSource.includes('6d2ff1b0948c416f8f361024908de504'));
  assert.ok(!hudBuilderSource.includes('3cebca63ed1d41e4be6e34ee8761172a'));
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
