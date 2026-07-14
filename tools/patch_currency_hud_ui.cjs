"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const uiPath = path.join(projectRoot, "ui", "UIRoot_TestSandbox_MainPlay.ui");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const assetPath = path.join(
  projectRoot,
  "GeneratedAssets",
  "SlotMachineUI",
  "currency_hud",
  "runtime",
  "slot_currency_hud_minimal.png",
);

const root = "/ui/UIRoot_TestSandbox_MainPlay";
const hudRuid = "e91423e98d5442a38cb4a3582a1ba54d";
const premiumCoinRuid = "9f4a925aa417482c82e2c683e6d863b9";
const commonCoinRuid = "4cc5ffc272224edc809a792b8efa16e3";
const parentWidth = 740;
const parentHeight = 88;

if (!fs.existsSync(assetPath)) {
  throw new Error(`Missing generated currency HUD asset: ${assetPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.currencyHudMinimal = {
  key: "currencyHudMinimal",
  fileName: "slot_currency_hud_minimal.png",
  ruid: hudRuid,
  size: fs.statSync(assetPath).size,
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const ui = JSON.parse(fs.readFileSync(uiPath, "utf8"));
const records = new Map(ui.ContentProto.Entities.map((entity) => [entity.path, entity]));
const before = new Map(ui.ContentProto.Entities.map((entity) => [entity.path, JSON.stringify(entity.jsonString)]));

function record(relativePath) {
  const fullPath = `${root}/${relativePath}`;
  const entity = records.get(fullPath);
  if (!entity) throw new Error(`Missing UI entity: ${fullPath}`);
  return entity;
}

function component(relativePath, type) {
  const result = record(relativePath).jsonString["@components"].find((item) => item["@type"] === type);
  if (!result) throw new Error(`Missing ${type} on ${relativePath}`);
  return result;
}

function setTopPanel(relativePath) {
  const transform = component(relativePath, "MOD.Core.UITransformComponent");
  transform.OffsetMin = { x: -parentWidth / 2, y: -18 - parentHeight };
  transform.OffsetMax = { x: parentWidth / 2, y: -18 };
  transform.RectSize = { x: parentWidth, y: parentHeight };
  transform.anchoredPosition = { x: 0, y: -18 };
  transform.Position = { x: 0, y: 522, z: 0 };
}

function setStretch(relativePath) {
  const transform = component(relativePath, "MOD.Core.UITransformComponent");
  transform.OffsetMin = { x: 0, y: 0 };
  transform.OffsetMax = { x: 0, y: 0 };
  transform.RectSize = { x: parentWidth, y: parentHeight };
  transform.anchoredPosition = { x: 0, y: 0 };
  transform.Position = { x: 0, y: -parentHeight / 2, z: 0 };
}

function setMiddleLeft(relativePath, x, y, width, height) {
  const transform = component(relativePath, "MOD.Core.UITransformComponent");
  transform.OffsetMin = { x, y: y - height / 2 };
  transform.OffsetMax = { x: x + width, y: y + height / 2 };
  transform.RectSize = { x: width, y: height };
  transform.anchoredPosition = { x, y };
  transform.Position = { x: -parentWidth / 2 + x, y: -parentHeight / 2 + y, z: 0 };
}

function setSprite(relativePath, ruid, order, preserveAspect) {
  const renderer = component(relativePath, "MOD.Core.SpriteGUIRendererComponent");
  renderer.ImageRUID = { DataId: ruid };
  renderer.Color = { r: 1, g: 1, b: 1, a: 1 };
  renderer.OrderInLayer = order;
  renderer.OverrideSorting = true;
  renderer.SortingLayer = "UI";
  renderer.PreserveAspect = preserveAspect;
  renderer.RaycastTarget = false;
}

function setAmountText(relativePath) {
  const text = component(relativePath, "MOD.Core.TextComponent");
  text.Text = "0";
  text.Alignment = 3;
  text.FontSize = 26;
  text.BestFit = true;
  text.MinSize = 16;
  text.MaxSize = 26;
  text.OrderInLayer = 302;
  text.OverrideSorting = true;
  text.SortingLayer = "UI";
}

setTopPanel("TopHUD_Currency");
setStretch("TopHUD_Currency/Bg");
setSprite("TopHUD_Currency/Bg", hudRuid, 300, false);

setMiddleLeft("TopHUD_Currency/Icon_PremiumCoin", 44, 0, 40, 40);
setSprite("TopHUD_Currency/Icon_PremiumCoin", premiumCoinRuid, 301, true);
setMiddleLeft("TopHUD_Currency/Text_PremiumCoinAmount", 96, 0, 240, 48);
setAmountText("TopHUD_Currency/Text_PremiumCoinAmount");

setMiddleLeft("TopHUD_Currency/Icon_CommonCoin", 404, 0, 42, 36);
setSprite("TopHUD_Currency/Icon_CommonCoin", commonCoinRuid, 301, true);
setMiddleLeft("TopHUD_Currency/Text_CommonCoinAmount", 458, 0, 240, 48);
setAmountText("TopHUD_Currency/Text_CommonCoinAmount");

const expectedChangedPaths = new Set([
  `${root}/TopHUD_Currency`,
  `${root}/TopHUD_Currency/Bg`,
  `${root}/TopHUD_Currency/Icon_PremiumCoin`,
  `${root}/TopHUD_Currency/Text_PremiumCoinAmount`,
  `${root}/TopHUD_Currency/Icon_CommonCoin`,
  `${root}/TopHUD_Currency/Text_CommonCoinAmount`,
]);
const changedPaths = ui.ContentProto.Entities
  .filter((entity) => before.get(entity.path) !== JSON.stringify(entity.jsonString))
  .map((entity) => entity.path);

if (changedPaths.some((entityPath) => !expectedChangedPaths.has(entityPath))) {
  throw new Error(`Unexpected .ui change scope: ${JSON.stringify(changedPaths)}`);
}

fs.writeFileSync(uiPath, `${JSON.stringify(ui, null, 2)}\n`, "utf8");
console.log(`Updated currency HUD manifest entry: currencyHudMinimal -> ${hudRuid}`);
console.log(`Patched ${changedPaths.length} existing UI nodes without changing entity IDs.`);
for (const entityPath of changedPaths) console.log(`- ${entityPath}`);
