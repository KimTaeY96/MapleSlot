"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectArg = process.argv.indexOf("--project-root");
const projectRoot = projectArg >= 0 ? path.resolve(process.argv[projectArg + 1]) : process.cwd();
const uiArg = process.argv.indexOf("--ui");
const uiPath = uiArg >= 0
  ? path.resolve(process.argv[uiArg + 1])
  : path.join(projectRoot, "ui/UIRoot_TestSandbox_MainPlay.ui");
const { UIBuilder } = require(path.join(projectRoot, ".agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const rendererType = "MOD.Core.SpriteGUIRendererComponent";
const spritePaths = [
  "TopHUD_Currency/Icon_PremiumCoin",
  "TopHUD_Currency/Icon_CommonCoin",
  "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Sprite_ReelWindowFrame",
];
const leverPath = "Panel_Bonus777_Hidden/Panel_Bonus777SlotRoot/Sprite_Lever";
const fullRoot = "/ui/UIRoot_TestSandbox_MainPlay";
const eol = fs.readFileSync(uiPath, "utf8").includes("\r\n") ? "\r\n" : "\n";
const ui = UIBuilder.read(uiPath);

for (const spritePath of spritePaths) {
  ui.patchComponent(spritePath, rendererType, { PreserveAspect: true });
  const renderer = ui.getComponent(spritePath, rendererType);
  assert.equal(renderer.PreserveAspect, true, `${spritePath} must preserve its source aspect ratio`);
}
ui.patch(leverPath, { display_order: 1000 });
const generatedLever = ui.build().ContentProto.Entities.find(
  (entity) => entity.path === `${fullRoot}/${leverPath}`,
);
assert.equal(generatedLever.jsonString.displayOrder, 1000);

let source = fs.readFileSync(uiPath, "utf8");

function preserveSpriteAspect(relativePath) {
  const fullPath = `${fullRoot}/${relativePath}`;
  const entityStart = source.indexOf(`"path": "${fullPath}"`);
  assert(entityStart >= 0, `Could not locate ${relativePath}`);
  const nextEntity = source.indexOf(`${eol}      {${eol}        "id"`, entityStart + 1);
  const entityEnd = nextEntity >= 0 ? nextEntity : source.length;
  const segment = source.slice(entityStart, entityEnd);
  assert(segment.includes(`"@type": "${rendererType}"`), `${relativePath} renderer is missing`);

  const existing = segment.match(/"PreserveAspect": (true|false)/);
  if (existing) {
    if (existing[1] === "true") return;
    const absoluteIndex = entityStart + existing.index;
    source = `${source.slice(0, absoluteIndex)}"PreserveAspect": true${source.slice(absoluteIndex + existing[0].length)}`;
    return;
  }

  const playRate = segment.match(/(^[ \t]*)"PlayRate": [^\r\n]+,(\r?\n)/m);
  assert(playRate, `${relativePath} PlayRate insertion point is missing`);
  const absoluteIndex = entityStart + playRate.index + playRate[0].length;
  const insertion = `${playRate[1]}"PreserveAspect": true,${playRate[2]}`;
  source = `${source.slice(0, absoluteIndex)}${insertion}${source.slice(absoluteIndex)}`;
}

function setDisplayOrder(relativePath, displayOrder) {
  const fullPath = `${fullRoot}/${relativePath}`;
  const entityStart = source.indexOf(`"path": "${fullPath}"`);
  assert(entityStart >= 0, `Could not locate ${relativePath}`);
  const nextEntity = source.indexOf(`${eol}      {${eol}        "id"`, entityStart + 1);
  const entityEnd = nextEntity >= 0 ? nextEntity : source.length;
  const segment = source.slice(entityStart, entityEnd);
  const current = segment.match(/"displayOrder": (-?\d+)/);
  assert(current, `${relativePath} displayOrder is missing`);
  if (Number(current[1]) === displayOrder) return;
  const absoluteIndex = entityStart + current.index;
  source = `${source.slice(0, absoluteIndex)}"displayOrder": ${displayOrder}${source.slice(absoluteIndex + current[0].length)}`;
}

for (const spritePath of spritePaths) preserveSpriteAspect(spritePath);
setDisplayOrder(leverPath, 1000);
fs.writeFileSync(uiPath, source, "utf8");

const reopened = UIBuilder.read(uiPath);
for (const spritePath of spritePaths) {
  assert.equal(reopened.getComponent(spritePath, rendererType).PreserveAspect, true);
}
const reopenedLever = reopened.build().ContentProto.Entities.find(
  (entity) => entity.path === `${fullRoot}/${leverPath}`,
);
assert.equal(reopenedLever.jsonString.displayOrder, 1000);
console.log(`Patched ${spritePaths.length} sprite aspect settings and the 777 lever display order`);
