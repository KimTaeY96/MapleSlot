const fs = require('node:fs');
const { UIBuilder } = require('../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const ASSET_MAP = JSON.parse(fs.readFileSync('Assets/UI/ClassicSilver/ImageGen/skill-ui-ruid-map.json', 'utf8'));
const RUID = '2860136c06ab075439721c027de365af';
const MAIN_RUID = ASSET_MAP.skins.skillWindowMain;
const SLOT_RUID = ASSET_MAP.skins.skillSlotPanel;
const TOOLTIP_RUID = ASSET_MAP.skins.skillTooltip;
const ICONS = ASSET_MAP.skillIcons;
const ACTION_RUID = '3cebca63ed1d41e4be6e34ee8761172a';
const COOLDOWN_RUID = 'ddf8548f22114eedb558f9decec77ba4';
const coreVersion = JSON.parse(fs.readFileSync('Environment/config', 'utf8')).CoreVersion;
const b = new UIBuilder('SkillWindow', 4, true);
function blackOutline(path, width = 2) {
  b.patchComponent(path, 'MOD.Core.TextGUIRendererComponent', {
    OutlineColor: {r:0,g:0,b:0,a:1},
    OutlineWidth: width,
  });
}
const C = {silver:'#B8C0C8',silverDark:'#59636F',silverLight:'#E7EDF2',navy:'#061E35',blue:'#08699D',orange:'#F59A16',ink:'#14202C',row:'#D8DEE3',rowAlt:'#C8D0D7',white:'#F7FBFF'};

b.script('Controller','script.SkillWindowUI',{anchor:'stretch',rect_size:[1920,1080]});
b.empty('MainGroup',{anchor:'stretch',rect_size:[1920,1080],enable:false});
b.panel('MainGroup/Window',{anchor:'middle-center',pos:[0,0],rect_size:[560,880],image_ruid:MAIN_RUID,color:'#FFFFFF'});
b.panel('MainGroup/Window/InnerFrame',{anchor:'stretch',pos:[0,0],rect_size:[544,864],image_ruid:RUID,color:C.silverLight,alpha:0});
b.panel('MainGroup/Window/TitleBar',{anchor:'top-center',pos:[0,-10],rect_size:[536,52],image_ruid:RUID,color:'#293441',alpha:0});
b.text('MainGroup/Window/TitleBar/TitleText','SKILL',{anchor:'middle-center',pos:[0,0],rect_size:[340,44],size:26,color:'#FFD54A',bold:true,alignment:4});
b.button('MainGroup/Window/TitleBar/CloseButton','×',{anchor:'middle-right',pos:[-26,0],rect_size:[44,44],image_ruid:RUID});
b.patchComponent('MainGroup/Window/TitleBar/CloseButton','MOD.Core.SpriteGUIRendererComponent',{Color:{r:1,g:1,b:1,a:0},Type:1});
b.patchComponent('MainGroup/Window/TitleBar/CloseButton','MOD.Core.TextGUIRendererComponent',{Font:'Maple',FontSize:31,FontColor:{r:1,g:1,b:1,a:1},Bold:true});

const roman=['I','II','III','IV'];
for(let i=0;i<4;i++){
  const name=i===0?'TierIButton':'Tier'+(i+1)+'Button';
  const path='MainGroup/Window/'+name;
  b.button(path,'',{anchor:'top-left',pos:[18+i*131,-68],rect_size:[124,64],image_ruid:i===0?ACTION_RUID:RUID});
  b.patchComponent(path,'MOD.Core.SpriteGUIRendererComponent',{Color:{r:1,g:1,b:1,a:0},Type:1});
  b.text(path+'/RomanText',roman[i],{anchor:'middle-center',pos:[0,0],rect_size:[82,52],size:31,color:'#FFFFFF',bold:true,alignment:4});
  blackOutline(path+'/RomanText',2);
  if(i>0)b.text(path+'/LockText','▣',{anchor:'middle-right',pos:[-18,-9],rect_size:[28,30],size:17,color:'#26313B',bold:true,alignment:4});
}

b.panel('MainGroup/Window/JobHeader',{anchor:'top-center',pos:[0,-140],rect_size:[520,72],image_ruid:RUID,color:C.blue,alpha:0});
b.sprite('MainGroup/Window/JobHeader/Emblem',{anchor:'middle-left',pos:[44,0],rect_size:[58,58],image_ruid:ICONS.weapon_mastery,sprite_type:0,preserve_aspect:true,raycast:false});
b.text('MainGroup/Window/JobHeader/JobText','1차 모험가',{anchor:'middle-center',pos:[20,0],rect_size:[390,56],size:30,color:C.white,bold:true,alignment:4});

b.scrollLayout('MainGroup/Window/SkillList',{anchor:'top-center',pos:[0,-220],rect_size:[520,526],layout_type:1,spacing:6,cell_size:[500,88],use_scroll:true,padding:[8,8,8,8]});
const skills=[['power_slash','PS','A'],['double_slash','DS','A'],['charge_slash','CB','A'],['whirlwind','WT','A'],['guard_break','GB','A'],['battle_cry','BC','A'],['emergency_heal','EH','A'],['final_blow','FB','A'],['weapon_mastery','WM','P'],['vitality_training','VT','P'],['combat_sense','CS','P'],['swift_training','ST','P'],['recovery_boost','RB','P'],['elite_hunter','EH+','P']];
const names=['파워 슬래시','더블 슬래시','돌진 베기','회전 참격','가드 브레이크','전투 함성','응급 회복','최후의 일격','무기 숙련','체력 단련','전투 감각','신속 훈련','회복력 강화','정예 사냥꾼'];
const max=[20,20,15,15,15,10,10,10,20,20,15,15,15,15];
skills.forEach((s,i)=>{
  const root='MainGroup/Window/SkillList/SkillRow_'+s[0];
  b.panel(root,{anchor:'middle-center',rect_size:[500,88],image_ruid:RUID,color:i%2===0?C.row:C.rowAlt,alpha:0});
  b.button(root+'/IconButton','',{anchor:'middle-left',pos:[48,0],rect_size:[72,72],image_ruid:ICONS[s[0]]});
  b.patchComponent(root+'/IconButton','MOD.Core.SpriteGUIRendererComponent',{Color:{r:1,g:1,b:1,a:1},Type:0,RaycastTarget:true,PreserveAspect:true});
  b.upsertComponent(root+'/IconButton','MOD.Core.UITouchReceiveComponent');
  b.panel(root+'/TypeBadge',{anchor:'middle-left',pos:[98,-22],rect_size:[30,26],image_ruid:RUID,color:s[2]==='A'?'#D26A18':'#167A50'});
  b.text(root+'/TypeBadge/BadgeText',s[2],{anchor:'middle-center',pos:[0,0],rect_size:[28,24],size:17,color:'#FFFFFF',bold:true,alignment:4});
  blackOutline(root+'/TypeBadge/BadgeText',2);
  b.text(root+'/NameText',names[i],{anchor:'middle-left',pos:[120,15],rect_size:[270,34],size:24,color:C.ink,bold:true,alignment:0});
  b.text(root+'/LevelText','Lv. 0 / '+max[i],{anchor:'middle-left',pos:[120,-22],rect_size:[220,28],size:19,color:'#31465A',alignment:0});
  b.button(root+'/PlusButton','+',{anchor:'middle-right',pos:[-34,0],rect_size:[56,56],image_ruid:RUID});
  b.patchComponent(root+'/PlusButton','MOD.Core.SpriteGUIRendererComponent',{Color:{r:1,g:1,b:1,a:0},Type:1});
  b.patchComponent(root+'/PlusButton','MOD.Core.TextGUIRendererComponent',{Font:'Maple',FontSize:34,FontColor:{r:1,g:1,b:1,a:1},Bold:true});
  blackOutline(root+'/PlusButton',2);
});

b.panel('MainGroup/Window/Footer',{anchor:'bottom-center',pos:[0,16],rect_size:[520,92],image_ruid:RUID,color:C.silver,alpha:0});
b.text('MainGroup/Window/Footer/SkillPointText','SP 0',{anchor:'middle-left',pos:[20,0],rect_size:[245,54],size:26,color:C.ink,bold:true,alignment:0});
b.button('MainGroup/Window/Footer/SlotSettingsButton','슬롯 설정',{anchor:'middle-right',pos:[-96,0],rect_size:[180,60],image_ruid:ACTION_RUID});
b.patchComponent('MainGroup/Window/Footer/SlotSettingsButton','MOD.Core.SpriteGUIRendererComponent',{Color:{r:1,g:1,b:1,a:0},Type:1});
b.patchComponent('MainGroup/Window/Footer/SlotSettingsButton','MOD.Core.TextGUIRendererComponent',{Font:'Maple',FontSize:25,FontColor:{r:1,g:1,b:1,a:1},Bold:true});
blackOutline('MainGroup/Window/Footer/SlotSettingsButton',2);
b.text('MainGroup/GlobalFeedbackText','',{anchor:'middle-center',pos:[0,-420],rect_size:[520,44],size:20,color:'#FFE28A',bold:true,alignment:4,enable:false});

b.empty('SlotGroup',{anchor:'stretch',rect_size:[1920,1080],enable:false});
b.panel('SlotGroup/Panel',{anchor:'middle-center',pos:[-500,30],rect_size:[440,390],image_ruid:SLOT_RUID,color:'#FFFFFF'});
b.panel('SlotGroup/Panel/Inner',{anchor:'stretch',rect_size:[426,376],image_ruid:RUID,color:C.silverLight,alpha:0});
b.panel('SlotGroup/Panel/TitleBar',{anchor:'top-center',pos:[0,-8],rect_size:[420,48],image_ruid:RUID,color:'#293441',alpha:0});
b.text('SlotGroup/Panel/TitleBar/Title','SLOT',{anchor:'middle-center',rect_size:[270,40],size:24,color:'#FFD54A',bold:true,alignment:4});
for(let i=1;i<=8;i++){
  const col=(i-1)%4,row=Math.floor((i-1)/4);
  const root='SlotGroup/Panel/Slot_'+i;
  b.button(root,'',{anchor:'top-left',pos:[74+col*97,-125-row*97],rect_size:[70,70],image_ruid:RUID});
  b.patchComponent(root,'MOD.Core.SpriteGUIRendererComponent',{Color:{r:1,g:1,b:1,a:0},Type:1});
  b.upsertComponent(root,'MOD.Core.UITouchReceiveComponent');
  b.text(root+'/NumberText',String(i),{anchor:'top-center',pos:[0,22],rect_size:[48,24],size:18,color:'#27313A',bold:true,alignment:4});
  b.text(root+'/EmptyText','·',{anchor:'middle-center',pos:[0,-7],rect_size:[56,56],size:36,color:'#AEB7BF',alignment:4});
  b.sprite(root+'/IconSprite',{anchor:'middle-center',pos:[0,-7],rect_size:[58,58],image_ruid:ICONS.power_slash,sprite_type:0,preserve_aspect:true,raycast:false,enable:false});
  b.panel(root+'/CooldownShade',{anchor:'middle-center',pos:[0,-7],rect_size:[58,58],image_ruid:COOLDOWN_RUID,color:'#061728',alpha:0.82,enable:false});
  b.patchComponent(root+'/CooldownShade','MOD.Core.SpriteGUIRendererComponent',{Type:3,FillMethod:4,FillOrigin:0,FillClockwise:true,FillAmount:1,RaycastTarget:false});
  b.text(root+'/CooldownShade/CooldownText','',{anchor:'middle-center',rect_size:[54,54],size:23,color:'#FFFFFF',bold:true,alignment:4});
  blackOutline(root+'/CooldownShade/CooldownText',3);
}
b.text('SlotGroup/Panel/HintText','위 1–4 · 아래 5–8 · 낮은 번호 우선',{anchor:'bottom-center',pos:[0,18],rect_size:[300,38],size:17,color:'#344B5F',alignment:4});

b.empty('TooltipGroup',{anchor:'stretch',rect_size:[1920,1080],enable:false});
b.panel('TooltipGroup/Panel',{anchor:'middle-center',pos:[510,10],rect_size:[440,650],image_ruid:TOOLTIP_RUID,color:'#FFFFFF'});
b.panel('TooltipGroup/Panel/Border',{anchor:'stretch',rect_size:[428,638],image_ruid:RUID,color:'#0B3857',alpha:0});
b.panel('TooltipGroup/Panel/IconFrame',{anchor:'top-left',pos:[54,-58],rect_size:[84,84],image_ruid:RUID,color:'#2B5C80',alpha:0});
b.sprite('TooltipGroup/Panel/TooltipIcon',{anchor:'top-left',pos:[54,-58],rect_size:[76,76],image_ruid:ICONS.power_slash,sprite_type:0,preserve_aspect:true,raycast:false});
b.text('TooltipGroup/Panel/TooltipNameText','파워 슬래시',{anchor:'top-left',pos:[112,-34],rect_size:[300,40],size:28,color:'#FFFFFF',bold:true,alignment:0});
b.text('TooltipGroup/Panel/TooltipMetaText','액티브 · 마스터 레벨 20',{anchor:'top-left',pos:[112,-80],rect_size:[300,32],size:18,color:'#A9DDF4',alignment:0});
b.text('TooltipGroup/Panel/TooltipDescriptionText','검에 힘을 모아 단일 적을 벤다.',{anchor:'top-center',pos:[0,-142],rect_size:[398,76],size:20,color:'#E7F7FF',alignment:0});
b.panel('TooltipGroup/Panel/Divider',{anchor:'top-center',pos:[0,-226],rect_size:[398,3],image_ruid:RUID,color:'#7FC8E7'});
b.text('TooltipGroup/Panel/TooltipCurrentText','',{anchor:'top-center',pos:[0,-252],rect_size:[398,132],size:19,color:'#D9F4FF',alignment:0});
b.panel('TooltipGroup/Panel/NextSection',{anchor:'top-center',pos:[0,-400],rect_size:[410,206],image_ruid:RUID,color:'#082842',alpha:0});
b.text('TooltipGroup/Panel/NextSection/TooltipNextText','',{anchor:'top-center',pos:[0,-12],rect_size:[390,180],size:19,color:'#BBDCEB',alignment:0});

const infoTexts=['MainGroup/Window/JobHeader/JobText','MainGroup/Window/Footer/SkillPointText','SlotGroup/Panel/HintText','TooltipGroup/Panel/TooltipMetaText','TooltipGroup/Panel/TooltipDescriptionText','TooltipGroup/Panel/TooltipCurrentText','TooltipGroup/Panel/NextSection/TooltipNextText'];
for(const p of infoTexts)b.patchComponent(p,'MOD.Core.TextGUIRendererComponent',{Font:'Maple',Padding:{left:10,right:10,top:6,bottom:6}});
for(const p of ['TooltipGroup/Panel','TooltipGroup/Panel/Border','TooltipGroup/Panel/IconFrame','TooltipGroup/Panel/Divider','TooltipGroup/Panel/NextSection','TooltipGroup/Panel/TooltipIcon'])b.patchComponent(p,'MOD.Core.SpriteGUIRendererComponent',{RaycastTarget:false});
for(const p of ['TooltipGroup/Panel/TooltipNameText','TooltipGroup/Panel/TooltipMetaText','TooltipGroup/Panel/TooltipDescriptionText','TooltipGroup/Panel/TooltipCurrentText','TooltipGroup/Panel/NextSection/TooltipNextText'])b.patchComponent(p,'MOD.Core.TextGUIRendererComponent',{RaycastTarget:false});
for(const p of ['MainGroup/Window','SlotGroup/Panel','TooltipGroup/Panel'])b.patchComponent(p,'MOD.Core.SpriteGUIRendererComponent',{Color:{r:1,g:1,b:1,a:1},Type:0,PreserveAspect:true,RaycastTarget:false});
b._data=b.build();
b._data.CoreVersion=coreVersion;
b.write('ui/SkillWindow.ui',{lint_verbose:true});
console.log(JSON.stringify(UIBuilder.snapshot('ui/SkillWindow.ui'),null,2));
