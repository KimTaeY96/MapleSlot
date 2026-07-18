import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { loadAndValidateCombatTables } from "./validate_combat_excel_tables.mjs";

const require = createRequire(import.meta.url);
const rootArg = process.argv.indexOf("--project-root");
const mapArg = process.argv.indexOf("--map");
const excelArg = process.argv.indexOf("--excel-dir");
const modelArg = process.argv.indexOf("--monster-model");
const applyChanges = process.argv.includes("--apply");
const projectRoot = rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd();
const excelDir = excelArg >= 0 ? path.resolve(process.argv[excelArg + 1]) : path.join(projectRoot, "ExcelTable");
const mapPath = mapArg >= 0 ? path.resolve(process.argv[mapArg + 1]) : path.join(projectRoot, "map/map01.map");
const modelPath = modelArg >= 0
  ? path.resolve(process.argv[modelArg + 1])
  : path.join(projectRoot, "RootDesk/MyDesk/Models/Monsters/SlimeTier1.model");
const { MapBuilder } = require(path.join(projectRoot, ".agents/skills/msw-general/scripts/map/msw_map_builder.cjs"));

function fail(message) {
  throw new Error(`[Henesys Combat Harness] ${message}`);
}

function enabled(value) {
  return value === true || value === 1 || String(value).toLowerCase() === "true";
}

function groupHorizontalFootholds(footholds, tolerance) {
  const groups = [];
  const segments = footholds
    .map((foothold) => {
      const start = foothold.StartPoint;
      const end = foothold.EndPoint;
      const width = Math.abs(end.x - start.x);
      return {
        foothold,
        minX: Math.min(start.x, end.x),
        maxX: Math.max(start.x, end.x),
        width,
        y: (start.y + end.y) * 0.5,
        slope: Math.abs(end.y - start.y),
      };
    })
    .filter((segment) => segment.width > 0.1 && segment.slope <= tolerance)
    .sort((a, b) => b.y - a.y);

  for (const segment of segments) {
    let group = groups.find((candidate) => Math.abs(candidate.y - segment.y) <= tolerance);
    if (!group) {
      group = { y: segment.y, totalWeight: 0, minX: segment.minX, maxX: segment.maxX, segments: [] };
      groups.push(group);
    }
    group.segments.push(segment.foothold);
    group.totalWeight += segment.width;
    group.y = group.segments.length === 1
      ? segment.y
      : ((group.y * (group.totalWeight - segment.width)) + segment.y * segment.width) / group.totalWeight;
    group.minX = Math.min(group.minX, segment.minX);
    group.maxX = Math.max(group.maxX, segment.maxX);
    group.width = group.maxX - group.minX;
  }
  return groups.sort((a, b) => b.y - a.y);
}

function chooseLaneGroups(groups, lanes, tolerance) {
  let best = null;
  for (let upperIndex = 0; upperIndex < groups.length - 2; upperIndex += 1) {
    for (let centerIndex = upperIndex + 1; centerIndex < groups.length - 1; centerIndex += 1) {
      for (let lowerIndex = centerIndex + 1; lowerIndex < groups.length; lowerIndex += 1) {
        const selected = [groups[upperIndex], groups[centerIndex], groups[lowerIndex]];
        const centerY = selected[1].y;
        const errors = selected.map((group, index) => Math.abs((group.y - centerY) - Number(lanes[index].WorldYOffset)));
        if (errors.some((error) => error > tolerance)) continue;
        if (selected.some((group, index) => group.width < Number(lanes[index].MinimumHorizontalSpan))) continue;
        const score = errors.reduce((sum, error) => sum + error, 0);
        if (!best || score < best.score) best = { selected, score };
      }
    }
  }
  return best?.selected ?? null;
}

function readComponentOrNull(map, entityPath, componentType) {
  try {
    return map.component(entityPath, componentType);
  } catch {
    return null;
  }
}

function verifyPosition(map, entityPath, expected, tolerance = 0.001) {
  const transform = readComponentOrNull(map, entityPath, "MOD.Core.TransformComponent");
  const position = transform?.Position;
  if (!position) fail(`Placement verification is missing TransformComponent on ${entityPath}`);
  if (Math.abs(Number(position.x) - expected.x) > tolerance || Math.abs(Number(position.y) - expected.y) > tolerance) {
    fail(`${entityPath} is at (${position.x}, ${position.y}), expected (${expected.x}, ${expected.y}).`);
  }
}

const slotMachinePath = path.join(excelDir, "SlotMachine.xlsx");
const { combat } = await loadAndValidateCombatTables({ excelDir, slotMachinePath });
const config = combat.CombatConfig[0];
const tier = combat.HuntingGroundTiers.find((row) => Number(row.HuntingGroundTiersIndex) === Number(config.InitialHuntingGroundTierIndex));
if (!tier || !enabled(tier.Enabled)) fail("Initial hunting-ground tier is missing or disabled.");
const lanes = combat.CombatLanes
  .filter((row) => enabled(row.Enabled) && Number(row.HuntingGroundTierIndex) === Number(tier.HuntingGroundTiersIndex))
  .sort((a, b) => Number(a.LaneOrder) - Number(b.LaneOrder));
const spawnGroups = combat.MonsterSpawnGroups.filter((row) => enabled(row.Enabled)
  && Number(row.HuntingGroundTierIndex) === Number(tier.HuntingGroundTiersIndex));
const ladders = combat.CombatLadders.filter((row) => enabled(row.Enabled)
  && Number(row.HuntingGroundTierIndex) === Number(tier.HuntingGroundTiersIndex));
if (spawnGroups.length !== 3) fail("The initial tier must define three enabled lane spawn groups.");
if (ladders.length !== 2) fail("The initial tier must define two enabled ladder routes.");

if (path.parse(mapPath).name !== String(config.HenesysMapKey)) {
  fail(`Refusing a non-Henesys map. Expected ${config.HenesysMapKey}.map, got ${mapPath}`);
}
if (!fs.existsSync(mapPath)) fail(`Map does not exist: ${mapPath}`);
if (!fs.existsSync(modelPath)) fail(`Monster model does not exist: ${modelPath}`);

const map = MapBuilder.read(mapPath);
if (map.getTileMapMode() !== 0) fail(`TileMapMode must be 0 (MapleTile); got ${map.getTileMapMode()}`);
const footholds = map.getFootholds("1");
if (footholds.length < 3) {
  fail("Layer 1 needs three Maker-authored horizontal foothold rows before placement. No map data was written.");
}

const laneGroups = chooseLaneGroups(
  groupHorizontalFootholds(footholds, Number(config.LaneMatchTolerance)),
  lanes,
  Number(config.LaneMatchTolerance),
);
if (!laneGroups) {
  fail("Could not match UPPER/CENTER/LOWER footholds to HuntingGround.xlsx offsets, spans, and tolerance. No map data was written.");
}

for (let index = 1; index < laneGroups.length; index += 1) {
  const spacing = laneGroups[index - 1].y - laneGroups[index].y;
  if (spacing < Number(config.MinimumLaneSpacing)) {
    fail(`Lane spacing ${spacing.toFixed(3)} is smaller than MinimumLaneSpacing ${config.MinimumLaneSpacing}.`);
  }
}

const commonMinX = Math.max(...laneGroups.map((group) => group.minX));
const commonMaxX = Math.min(...laneGroups.map((group) => group.maxX));
const commonSpan = commonMaxX - commonMinX;
const requiredSpan = Math.max(...lanes.map((lane) => Number(lane.MinimumHorizontalSpan)));
if (commonMinX < Number(config.CombatAreaMinimumWorldX) - Number(config.LaneMatchTolerance)) {
  fail(`Lane area starts at ${commonMinX.toFixed(3)}, left of CombatAreaMinimumWorldX ${config.CombatAreaMinimumWorldX}.`);
}
if (commonMaxX > Number(config.CombatAreaMaximumWorldX) + Number(config.LaneMatchTolerance)) {
  fail(`Lane area ends at ${commonMaxX.toFixed(3)}, right of CombatAreaMaximumWorldX ${config.CombatAreaMaximumWorldX}.`);
}
if (commonSpan < requiredSpan) fail(`Common lane span ${commonSpan.toFixed(3)} must be at least ${requiredSpan}.`);
if (Number(config.CombatBoundsInset) * 2 >= commonSpan) fail("CombatBoundsInset leaves no usable combat width.");

const playerX = commonMinX + commonSpan * Number(config.PlayerSpawnNormalizedX);
const monsterX = commonMinX + commonSpan * Number(config.MonsterSpawnNormalizedX);
const centerLaneIndex = lanes.findIndex((lane) => String(lane.LaneKey) === "CENTER");
if (centerLaneIndex < 0) fail("CombatLanes is missing CENTER.");
const centerGroup = laneGroups[centerLaneIndex];
const playerY = centerGroup.y + Number(config.PlayerSpawnYOffset);
const cameraAnchorPath = String(config.CombatCameraAnchorKey);
const cameraAnchorX = (commonMinX + commonMaxX) * 0.5;
const cameraAnchorY = centerGroup.y;

if (applyChanges) {
  if (!map.find("CombatHarness")) map.empty("CombatHarness", { pos: [0, 0, 0] });
  lanes.forEach((lane, index) => {
    const group = laneGroups[index];
    const spawnGroup = spawnGroups.find((entry) => String(entry.LaneKey) === String(lane.LaneKey));
    const anchorY = group.y + Number(spawnGroup.SpawnYOffset);
    map.empty(String(lane.SpawnAnchorKey), { pos: [monsterX, anchorY, 0] });
    map.empty(String(lane.BoundsLeftAnchorKey), { pos: [commonMinX + Number(config.CombatBoundsInset), group.y, 0] });
    map.empty(String(lane.BoundsRightAnchorKey), { pos: [commonMaxX - Number(config.CombatBoundsInset), group.y, 0] });
  });
  const playerSpawnPath = "CombatHarness/SpawnLocation";
  if (map.find("CombatHarness/PlayerSpawn") && !map.find(playerSpawnPath)) {
    map.rename("CombatHarness/PlayerSpawn", "SpawnLocation");
  }
  map.empty(playerSpawnPath, { pos: [playerX, playerY, 0] });
  map.upsertComponent(playerSpawnPath, "MOD.Core.SpawnLocationComponent", { Enable: true });
  map.empty("CombatHarness/Runtime", { pos: [(commonMinX + commonMaxX) * 0.5, centerGroup.y, 0], scripts: ["script.CombatSandboxRuntime"] });
  map.empty(cameraAnchorPath, { pos: [cameraAnchorX, cameraAnchorY, 0] });
  map.upsertComponent(cameraAnchorPath, "MOD.Core.CameraComponent", {
    Enable: true,
    ConfineCameraArea: enabled(config.CombatCameraConfineArea),
    ScreenOffset: {
      x: Number(config.CombatCameraScreenOffsetX),
      y: Number(config.CombatCameraScreenOffsetY),
    },
  });

  const legacyMonsterPath = "CombatHarness/Monsters/SlimeTier1";
  if (map.find(legacyMonsterPath)) map.remove(legacyMonsterPath);
  map.write(mapPath);
}

const requiredPaths = [
  "CombatHarness/SpawnLocation",
  "CombatHarness/Runtime",
  cameraAnchorPath,
  ...lanes.flatMap((lane) => [lane.SpawnAnchorKey, lane.BoundsLeftAnchorKey, lane.BoundsRightAnchorKey]),
  ...ladders.map((ladder) => ladder.LadderKey),
];
for (const ladder of ladders) {
  if (!map.find(String(ladder.LadderKey))) fail(`Missing Maker-authored ladder ${ladder.LadderKey}.`);
  if (!readComponentOrNull(map, String(ladder.LadderKey), "MOD.Core.ClimbableComponent")) {
    fail(`${ladder.LadderKey} is missing ClimbableComponent.`);
  }
}
if (applyChanges) {
  const written = MapBuilder.read(mapPath);
  const missing = requiredPaths.filter((entityPath) => !written.find(String(entityPath)));
  if (missing.length) fail(`Placement verification is missing: ${missing.join(", ")}`);
  verifyPosition(written, "CombatHarness/SpawnLocation", { x: playerX, y: playerY });
  verifyPosition(written, cameraAnchorPath, { x: cameraAnchorX, y: cameraAnchorY });
  const fixedCamera = readComponentOrNull(written, cameraAnchorPath, "MOD.Core.CameraComponent");
  if (!fixedCamera) fail(`${cameraAnchorPath} is missing CameraComponent.`);
  if (fixedCamera.ConfineCameraArea !== enabled(config.CombatCameraConfineArea)) fail(`${cameraAnchorPath} has an invalid ConfineCameraArea value.`);
  if (Math.abs(Number(fixedCamera.ScreenOffset?.x) - Number(config.CombatCameraScreenOffsetX)) > 0.001
    || Math.abs(Number(fixedCamera.ScreenOffset?.y) - Number(config.CombatCameraScreenOffsetY)) > 0.001) {
    fail(`${cameraAnchorPath} has an invalid ScreenOffset.`);
  }
}

console.log(JSON.stringify({
  mode: applyChanges ? "applied" : "preflight",
  map: mapPath,
  tileMapMode: map.getTileMapMode(),
  laneLayout: lanes.map((lane, index) => ({
    laneKey: lane.LaneKey,
    y: laneGroups[index].y,
    minX: laneGroups[index].minX,
    maxX: laneGroups[index].maxX,
  })),
  playerSpawn: { x: playerX, y: playerY, laneKey: "CENTER" },
  monsterSpawns: lanes.map((lane, index) => ({
    laneKey: lane.LaneKey,
    x: monsterX,
    y: laneGroups[index].y + Number(spawnGroups.find((entry) => String(entry.LaneKey) === String(lane.LaneKey)).SpawnYOffset),
  })),
  ladders: ladders.map((ladder) => ({ key: ladder.LadderKey, lower: ladder.LowerLaneKey, upper: ladder.UpperLaneKey })),
  cameraAnchor: { path: cameraAnchorPath, x: cameraAnchorX, y: cameraAnchorY },
}, null, 2));
if (!applyChanges) console.log("Preflight passed. Re-run with --apply to write Henesys combat anchors; runtime spawning covers all three lanes.");
