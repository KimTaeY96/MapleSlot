const fs = require('fs');
const path = require('path');

const root = path.resolve('Assets/ClassicHUD');
const sourceDir = path.join(root, 'source');
const previewDir = path.join(root, 'previews');
for (const dir of [sourceDir, previewDir]) fs.mkdirSync(dir, { recursive: true });

const palette = {
  ink: '#07131f', deep: '#102437', steel: '#213d54', mid: '#365a73',
  light: '#86b4ca', shine: '#d6f2f7', gold: '#d7a846', goldDark: '#72501f',
  hp: '#c33b42', hpHi: '#f27872', mp: '#2876b8', mpHi: '#66b9e8',
  exp: '#9dbf32', expHi: '#d7ed71', empty: '#152431', disabled: '#4a5861'
};

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`;
}

function save(rel, w, h, body) {
  fs.writeFileSync(path.join(sourceDir, rel), svg(w, h, body));
}

function frame(w, h, accent = palette.gold) {
  return `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8" fill="${palette.ink}" stroke="${palette.shine}" stroke-width="2"/>
  <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="6" fill="${palette.deep}" stroke="${palette.mid}" stroke-width="3"/>
  <path d="M9 9H${w - 9}V13H9Z" fill="${palette.light}" opacity=".7"/>
  <path d="M12 ${h - 11}H${w - 12}V${h - 7}H12Z" fill="${palette.ink}"/>
  <rect x="10" y="10" width="6" height="6" fill="${accent}"/><rect x="${w - 16}" y="10" width="6" height="6" fill="${accent}"/>`;
}

function gaugeFill(base, hi) {
  return `<rect width="244" height="14" rx="5" fill="${base}"/>
  <rect x="3" y="2" width="238" height="4" rx="2" fill="${hi}"/>
  <rect x="3" y="10" width="238" height="2" fill="#07131f" opacity=".42"/>
  <rect x="0" y="3" width="3" height="8" fill="#f2fbff" opacity=".55"/>`;
}

save('hud_frame.svg', 1180, 104, `${frame(1180, 104)}
  <path d="M278 9V95M1038 9V95" stroke="${palette.light}" stroke-width="2"/>
  <path d="M282 12V92M1034 12V92" stroke="${palette.ink}" stroke-width="2"/>`);
save('character_info_bg.svg', 270, 84, `${frame(270, 84)}<rect x="76" y="12" width="2" height="60" fill="${palette.light}"/><rect x="82" y="12" width="2" height="60" fill="${palette.ink}"/>`);
save('level_frame.svg', 72, 84, `${frame(72, 84, palette.gold)}<path d="M9 57H63V70H9Z" fill="${palette.steel}"/><path d="M11 59H61V62H11Z" fill="${palette.light}" opacity=".65"/>`);
save('inner_separator.svg', 8, 80, `<path d="M1 4V76H3V4ZM5 4V76H7V4Z" fill="${palette.light}"/><path d="M3 4V76H5V4Z" fill="${palette.ink}"/>`);
save('gauge_frame.svg', 260, 28, `${frame(260, 28)}<rect x="8" y="7" width="244" height="14" rx="5" fill="none" stroke="${palette.light}" stroke-width="1"/>`);
save('hp_empty.svg', 244, 14, `<rect width="244" height="14" rx="5" fill="${palette.empty}"/><path d="M3 3H241V6H3Z" fill="${palette.mid}" opacity=".5"/>`);
save('mp_empty.svg', 244, 14, `<rect width="244" height="14" rx="5" fill="${palette.empty}"/><path d="M3 3H241V6H3Z" fill="${palette.mid}" opacity=".5"/>`);
save('exp_empty.svg', 244, 14, `<rect width="244" height="14" rx="5" fill="${palette.empty}"/><path d="M3 3H241V6H3Z" fill="${palette.mid}" opacity=".5"/>`);
save('hp_fill.svg', 244, 14, gaugeFill(palette.hp, palette.hpHi));
save('mp_fill.svg', 244, 14, gaugeFill(palette.mp, palette.mpHi));
save('exp_fill.svg', 244, 14, gaugeFill(palette.exp, palette.expHi));

function buttonBody(kind) {
  const state = {
    normal: [palette.deep, palette.steel, palette.light, 1],
    hover: [palette.steel, palette.mid, palette.shine, 1],
    pressed: [palette.ink, palette.deep, palette.mid, 1],
    disabled: ['#26333d', '#35434c', '#71808a', .7]
  }[kind];
  const y = kind === 'pressed' ? 4 : 1;
  return `<rect x="1" y="${y}" width="102" height="${82 - y}" rx="7" fill="${state[0]}" stroke="${state[2]}" stroke-width="2" opacity="${state[3]}"/>
  <rect x="5" y="${y + 4}" width="94" height="${74 - y}" rx="5" fill="${state[1]}" stroke="${palette.ink}" stroke-width="2" opacity="${state[3]}"/>
  <path d="M9 ${y + 8}H95V${y + 13}H9Z" fill="${state[2]}" opacity=".55"/>
  <path d="M9 63H95V77H9Z" fill="${palette.ink}" opacity=".75"/>
  <rect x="8" y="${y + 7}" width="5" height="5" fill="${palette.gold}" opacity="${state[3]}"/><rect x="91" y="${y + 7}" width="5" height="5" fill="${palette.gold}" opacity="${state[3]}"/>`;
}
for (const state of ['normal', 'hover', 'pressed', 'disabled']) save(`menu_button_${state}.svg`, 104, 84, buttonBody(state));
save('inventory_icon.svg', 48, 48, `<path d="M9 17H39V42H9Z" fill="${palette.goldDark}" stroke="${palette.shine}" stroke-width="2"/>
  <path d="M14 17V12C14 7 18 5 24 5S34 7 34 12V17H29V13C29 10 27 9 24 9S19 10 19 13V17Z" fill="${palette.gold}" stroke="${palette.shine}" stroke-width="2"/>
  <path d="M12 20H36V25H12Z" fill="#efc763"/><path d="M22 26H26V36H22Z" fill="${palette.shine}"/><rect x="20" y="34" width="8" height="5" fill="${palette.steel}"/>`);
save('menu_separator.svg', 8, 84, `<path d="M1 7V77H3V7ZM5 7V77H7V7Z" fill="${palette.light}" opacity=".75"/><path d="M3 7V77H5V7Z" fill="${palette.ink}"/>`);
save('corner_decoration.svg', 24, 24, `<path d="M2 22V2H22L17 7H7V17Z" fill="${palette.light}"/><path d="M5 19V5H19L16 8H8V16Z" fill="${palette.gold}"/>`);

function useHref(file, x, y, w, h) {
  const data = fs.readFileSync(path.join(sourceDir, file)).toString('base64');
  return '<image href="data:image/svg+xml;base64,' + data + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
}
const preview = svg(1280, 180, `<rect width="1280" height="180" fill="#0a1119"/>
  ${useHref('hud_frame.svg', 50, 38, 1180, 104)}
  ${useHref('character_info_bg.svg', 58, 48, 270, 84)}
  ${useHref('level_frame.svg', 62, 48, 72, 84)}
  ${useHref('gauge_frame.svg', 344, 48, 260, 28)}${useHref('hp_empty.svg', 352, 55, 244, 14)}${useHref('hp_fill.svg', 352, 55, 196, 14)}
  ${useHref('gauge_frame.svg', 618, 48, 260, 28)}${useHref('mp_empty.svg', 626, 55, 244, 14)}${useHref('mp_fill.svg', 626, 55, 171, 14)}
  ${useHref('gauge_frame.svg', 344, 94, 534, 28)}${useHref('exp_empty.svg', 352, 101, 518, 14)}${useHref('exp_fill.svg', 352, 101, 315, 14)}
  ${useHref('menu_button_normal.svg', 1118, 48, 104, 84)}${useHref('inventory_icon.svg', 1146, 55, 48, 48)}
  <g fill="#edf8fc" font-family="Arial,sans-serif"><text x="76" y="75" font-size="12">LV.</text><text x="77" y="108" font-size="28" font-weight="700">26</text><text x="151" y="77" font-size="18" font-weight="700">PLAYER</text><text x="151" y="104" font-size="13" fill="#9ec2d3">ADVENTURER</text><text x="354" y="70" font-size="13">HP 135 / 135</text><text x="628" y="70" font-size="13">MP 100 / 100</text><text x="354" y="116" font-size="13">EXP 640 / 1200 (53.3%)</text><text x="1138" y="122" font-size="11">INVENTORY</text></g>`);
fs.writeFileSync(path.join(previewDir, 'assembled-preview.svg'), preview);

for (const count of [1, 2, 3]) {
  let buttons = '';
  const right = 520;
  for (let i = 0; i < count; i++) {
    const x = right - 104 - i * 112;
    buttons += useHref('menu_button_normal.svg', x, 18, 104, 84);
    if (i === 0) buttons += useHref('inventory_icon.svg', x + 28, 24, 48, 48);
  }
  fs.writeFileSync(path.join(previewDir, `menu-${count}-buttons.svg`), svg(560, 120, `<rect width="560" height="120" fill="#0a1119"/><path d="M520 8V110" stroke="${palette.gold}" stroke-width="2"/>${buttons}`));
}

const guide = svg(1280, 310, `<rect width="1280" height="310" fill="#0a1119"/>
  ${useHref('hud_frame.svg', 50, 50, 1180, 104)}
  <g fill="none" stroke="#63e6be" stroke-width="2" stroke-dasharray="6 4"><rect x="50" y="50" width="278" height="104"/><rect x="328" y="50" width="710" height="104"/><rect x="1038" y="50" width="192" height="104"/></g>
  <g fill="#e8f7ff" font-family="Arial,sans-serif" font-size="14"><text x="50" y="28">1180 x 104 / bottom-center / safe margin 20</text><text x="72" y="180">Character fixed 278</text><text x="500" y="180">Gauge stretch zone 710</text><text x="1055" y="180">Menu right fixed</text><text x="50" y="225">9-slice: frame 12 px / gauge frame 8 px / button 8 px</text><text x="50" y="252">Gauge fill: fixed 7 px endcaps, center stretches; runtime width = max(14, 244 * ratio)</text><text x="50" y="279">Menu: 104 x 84, gap 8, right anchored; 1–3 buttons expand left, unused slots hidden</text></g>
  <g stroke="#ffcc66" stroke-width="1" stroke-dasharray="3 3"><path d="M62 50V154M1218 50V154"/><path d="M50 62H1230M50 142H1230"/></g>`);
fs.writeFileSync(path.join(previewDir, 'layout-and-slice-guide.svg'), guide);

fs.writeFileSync(path.join(root, 'README.md'), `# Classic MMORPG HUD resource pack\n\n- Full assembly reference: 1180 x 104. Current project runtime uses a compact 900 x 104 bottom-right layout with a 20 px safe margin so it does not overlap the left slot-machine panel.\n- Runtime character zone: 228 px fixed. Gauge zone ends at x=544. The rightmost 328 px is reserved for up to three menu buttons.\n- Menu button: 104 x 84, 8 px gap, maximum 3. Initial runtime shows inventory only; no empty slots.\n- 9-slice borders: HUD/character 12 px, gauge frame 8 px, button 8 px.\n- Gauge fills keep 7 px endcaps and resize the center.\n- Text and numbers are not baked into runtime resource PNGs. Preview text is demonstrative only.\n- Editable originals are SVG files under source/. PNG exports are generated under png/.\n`);

console.log(`Generated editable HUD sources at ${root}`);
