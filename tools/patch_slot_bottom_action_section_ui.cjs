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

const originalSource = fs.readFileSync(uiPath, "utf8");
const originalDocument = JSON.parse(originalSource);
const ui = UIBuilder.read(uiPath);
const cabinetPath = "Panel_LeftSlotMachine";
const rowPath = `${cabinetPath}/Panel_BetMultiplierRow`;
const rowBgPath = `${rowPath}/Bg`;
const spinPath = `${cabinetPath}/Button_Spin`;
const statusPath = `${cabinetPath}/Text_SlotStatus`;
const winResultPath = `${cabinetPath}/Panel_WinResult`;
const actionBgPath = `${cabinetPath}/Bg_SpinActionSection`;
const actionBgEntityId = "6378eaca-621c-4f48-968e-837c3c5710d0";

const cabinet = ui.getComponent(cabinetPath, "MOD.Core.UITransformComponent");
const row = ui.getComponent(rowPath, "MOD.Core.UITransformComponent");
const rowBg = ui.getComponent(rowBgPath, "MOD.Core.SpriteGUIRendererComponent");
const spin = ui.getComponent(spinPath, "MOD.Core.UITransformComponent");
assert(cabinet && row && rowBg && spin, "Slot cabinet action-section anchors are missing");

const cabinetHeight = Number(cabinet.RectSize.y);
const rowBottomFromTop = Math.abs(Number(row.anchoredPosition.y)) + Number(row.RectSize.y);
const rowBottomFromBottom = cabinetHeight - rowBottomFromTop;
const actionBottom = Number(spin.anchoredPosition.y);
const actionHeight = rowBottomFromBottom - actionBottom;
assert(actionHeight > 0, "Spin action section has no positive vertical gap to fill");

const fullActionBgPath = `/ui/UIRoot_TestSandbox_MainPlay/${actionBgPath}`;
const originalEntities = originalDocument.ContentProto.Entities;
const existingEntity = originalEntities.find((entity) => entity.path === fullActionBgPath);

if (!existingEntity) {
  ui.sprite(actionBgPath, {
    anchor: "bottom-center",
    pivot: [0.5, 0],
    pos: [0, actionBottom],
    rect_size: [Number(row.RectSize.x), actionHeight],
    image_ruid: rowBg.ImageRUID.DataId,
    raycast: false,
  });
  ui.patchComponent(actionBgPath, "MOD.Core.SpriteGUIRendererComponent", {
    Color: { r: 1, g: 1, b: 1, a: 1 },
    OrderInLayer: 55,
    OverrideSorting: true,
    SortingLayer: "UI",
    RaycastTarget: false,
  });

  const generatedEntity = ui.build().ContentProto.Entities.find(
    (entity) => entity.path === fullActionBgPath,
  );
  assert(generatedEntity, "UIBuilder did not generate the spin action background entity");
  generatedEntity.id = actionBgEntityId;
  generatedEntity.jsonString.displayOrder = 6;

  // Keep Maker's existing serialization byte-for-byte and append only the
  // UIBuilder-generated entity. This prevents a one-node patch from producing
  // a whole-file diff after Maker and UIBuilder use different key ordering.
  const eol = originalSource.includes("\r\n") ? "\r\n" : "\n";
  const terminalMatch = originalSource.match(/(\r?\n {4}\]\r?\n {2}\}\r?\n\}\s*)$/);
  assert(terminalMatch, "Could not locate the UI entity-array terminator");
  const entityJson = JSON.stringify(generatedEntity, null, 2)
    .split("\n")
    .map((line) => `      ${line}`)
    .join(eol);
  const separator = originalEntities.length > 0 ? "," : "";
  function updateDisplayOrder(source, relativePath, previousOrder, nextOrder) {
    const fullPath = `/ui/UIRoot_TestSandbox_MainPlay/${relativePath}`;
    const pathIndex = source.indexOf(`"path": "${fullPath}"`);
    assert(pathIndex >= 0, `Could not locate ${relativePath} for sibling-order update`);
    const nextEntityIndex = source.indexOf(`${eol}      {${eol}        "id"`, pathIndex + 1);
    const token = `"displayOrder": ${previousOrder}`;
    const orderIndex = source.indexOf(token, pathIndex);
    assert(orderIndex >= 0 && (nextEntityIndex < 0 || orderIndex < nextEntityIndex),
      `Unexpected displayOrder for ${relativePath}`);
    return `${source.slice(0, orderIndex)}"displayOrder": ${nextOrder}${source.slice(orderIndex + token.length)}`;
  }

  let orderedSource = originalSource;
  orderedSource = updateDisplayOrder(orderedSource, spinPath, 6, 7);
  orderedSource = updateDisplayOrder(orderedSource, statusPath, 7, 8);
  orderedSource = updateDisplayOrder(orderedSource, winResultPath, 8, 9);
  const orderedTerminalMatch = orderedSource.match(/(\r?\n {4}\]\r?\n {2}\}\r?\n\}\s*)$/);
  assert(orderedTerminalMatch, "Could not relocate the UI entity-array terminator");
  const orderedInsertionPoint = orderedTerminalMatch.index;
  const patchedSource = `${orderedSource.slice(0, orderedInsertionPoint)}${separator}${eol}${entityJson}${orderedTerminalMatch[1]}`;
  fs.writeFileSync(uiPath, patchedSource, "utf8");
}

const reopened = UIBuilder.read(uiPath);
const result = reopened.getComponent(actionBgPath, "MOD.Core.UITransformComponent");
assert.equal(Number(result.RectSize.x), Number(row.RectSize.x));
assert.equal(Number(result.RectSize.y), actionHeight);
assert.equal(Number(result.anchoredPosition.y), actionBottom);
console.log(`Patched ${actionBgPath}: ${result.RectSize.x}x${result.RectSize.y} at bottom y=${result.anchoredPosition.y}`);
