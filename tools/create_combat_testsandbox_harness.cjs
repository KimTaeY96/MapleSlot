"use strict";

const fs = require("node:fs");
const path = require("node:path");

const rootArg = process.argv.indexOf("--project-root");
const mapArg = process.argv.indexOf("--map");
const modelArg = process.argv.indexOf("--monster-model");
const projectRoot = rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd();
const mapPath = mapArg >= 0 ? path.resolve(process.argv[mapArg + 1]) : path.join(projectRoot, "map/Test_Sandbox.map");
const monsterModelPath = modelArg >= 0
  ? path.resolve(process.argv[modelArg + 1])
  : path.join(projectRoot, "RootDesk/MyDesk/Models/Monsters/SlimeTier1.model");
const { MapBuilder } = require(path.join(projectRoot, ".agents/skills/msw-general/scripts/map/msw_map_builder.cjs"));

function stop(message) {
  console.error(`[Combat Sandbox preflight] ${message}`);
  process.exitCode = 2;
  return false;
}

if (!/test[_-]?sandbox/i.test(path.basename(mapPath))) {
  stop(`Refusing production-map write. Target must be Test_Sandbox: ${mapPath}`);
  return;
}
if (!fs.existsSync(mapPath)) {
  stop(`Map does not exist. Create an isolated MapleTile Test_Sandbox map in Maker first: ${mapPath}`);
  return;
}
if (!fs.existsSync(monsterModelPath)) {
  stop(`Monster model does not exist: ${monsterModelPath}`);
  return;
}

const map = MapBuilder.read(mapPath);
const info = map.getMapInfo();
if (map.getTileMapMode() !== 0) {
  stop(`TileMapMode must be 0 (MapleTile); got ${map.getTileMapMode()}`);
  return;
}
if (info.footholdCount < 1) {
  stop("No foothold exists. Paint a walkable ground in Maker; the builder will not synthesize footholds.");
  return;
}

const candidates = map.getFootholds("1")
  .filter((foothold) => Math.abs(foothold.EndPoint.x - foothold.StartPoint.x) >= 4)
  .sort((a, b) => Math.abs(b.EndPoint.x - b.StartPoint.x) - Math.abs(a.EndPoint.x - a.StartPoint.x));
if (!candidates.length) {
  stop("Layer 1 needs a foothold segment at least 4 world units wide.");
  return;
}

const ground = candidates[0];
const minX = Math.min(ground.StartPoint.x, ground.EndPoint.x);
const maxX = Math.max(ground.StartPoint.x, ground.EndPoint.x);
const centerX = (minX + maxX) * 0.5;
function groundY(x) {
  const dx = ground.EndPoint.x - ground.StartPoint.x;
  if (dx === 0) return Math.max(ground.StartPoint.y, ground.EndPoint.y);
  const t = (x - ground.StartPoint.x) / dx;
  return ground.StartPoint.y + (ground.EndPoint.y - ground.StartPoint.y) * t;
}

const playerX = centerX - 1.5;
const monsterX = centerX + 1.5;
const markerY = groundY(centerX) + 0.4;
const playerY = groundY(playerX) + 0.4;
const monsterY = groundY(monsterX) + 0.4;

if (!map.find("CombatHarness")) map.empty("CombatHarness", { pos: [0, 0, 0] });
map.empty("CombatHarness/PlayerSpawn", { pos: [playerX, playerY, 0] });
map.upsertComponent("CombatHarness/PlayerSpawn", "MOD.Core.SpawnLocationComponent", { Enable: true });
map.empty("CombatHarness/MonsterSpawn/Tier1", { pos: [monsterX, monsterY, 0] });
map.empty("CombatHarness/CombatBoundsLeft", { pos: [minX, markerY, 0] });
map.empty("CombatHarness/CombatBoundsRight", { pos: [maxX, markerY, 0] });
map.empty("CombatHarness/Runtime", { pos: [centerX, markerY, 0], scripts: ["script.CombatSandboxRuntime"] });

if (!map.find("CombatHarness/Monsters/SlimeTier1")) {
  map.placeModel("CombatHarness/Monsters/SlimeTier1", monsterModelPath, { pos: [monsterX, monsterY, 0] });
}

map.write(mapPath);
console.log(`Combat Test Sandbox harness written: ${mapPath}`);
console.log(JSON.stringify(map.snapshot(), null, 2));
