import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { combatSheets, dropSheets, columnNames } from "./combat_excel_schema.mjs";

const require = createRequire(import.meta.url);
const artifactPath = require.resolve("@oai/artifact-tool", { paths: ["C:/Users/ghddj/Documents/MSW"] });
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(artifactPath).href);

const outputArg = process.argv.indexOf("--excel-dir");
const excelDir = outputArg >= 0 ? path.resolve(process.argv[outputArg + 1]) : path.resolve("ExcelTable");
const slotArg = process.argv.indexOf("--slot-machine");
const slotMachinePath = slotArg >= 0 ? path.resolve(process.argv[slotArg + 1]) : path.join(excelDir, "SlotMachine.xlsx");

function fail(message) {
  throw new Error(message);
}

function isBlank(value) {
  return value === null || value === undefined || value === "";
}

function enabled(value) {
  return value === true || value === 1 || String(value).toLowerCase() === "true";
}

function number(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(`${label} must be numeric; got ${JSON.stringify(value)}`);
  return parsed;
}

async function readWorkbook(directory, filename, schemas) {
  const filePath = path.join(directory, filename);
  await fs.access(filePath);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(filePath));
  const result = {};
  for (const [sheetName, schema] of Object.entries(schemas)) {
    const sheet = workbook.worksheets.getItem(sheetName);
    if (!sheet) fail(`${filename} is missing sheet ${sheetName}`);
    const values = sheet.getUsedRange(true)?.values ?? [];
    if (values.length < 5) fail(`${filename}/${sheetName} must contain four metadata rows and data`);
    const headers = values[0].map(String);
    const missing = columnNames(schema).filter((header) => !headers.includes(header));
    if (missing.length) fail(`${filename}/${sheetName} is missing columns: ${missing.join(", ")}`);
    result[sheetName] = values.slice(4)
      .filter((row) => row.some((value) => !isBlank(value)))
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
  }
  return result;
}

async function readSheetRows(filePath, sheetName) {
  await fs.access(filePath);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(filePath));
  const sheet = workbook.worksheets.getItem(sheetName);
  if (!sheet) fail(`${filePath} is missing sheet ${sheetName}`);
  const values = sheet.getUsedRange(true)?.values ?? [];
  if (values.length < 5) fail(`${filePath}/${sheetName} must contain four metadata rows and data`);
  const headers = values[0].map(String);
  return values.slice(4)
    .filter((row) => row.some((value) => !isBlank(value)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

function unique(rows, key, label) {
  const seen = new Set();
  for (const row of rows) {
    if (isBlank(row[key])) fail(`${label}.${key} cannot be blank`);
    const value = String(row[key]);
    if (seen.has(value)) fail(`${label}.${key} contains duplicate ${value}`);
    seen.add(value);
  }
  return seen;
}

export async function loadAndValidateCombatTables(options = {}) {
  const targetExcelDir = options.excelDir ? path.resolve(options.excelDir) : excelDir;
  const targetSlotMachinePath = options.slotMachinePath ? path.resolve(options.slotMachinePath) : slotMachinePath;
  const combat = await readWorkbook(targetExcelDir, "Combat.xlsx", combatSheets);
  const drop = await readWorkbook(targetExcelDir, "Drop.xlsx", dropSheets);
  const baseBetRows = await readSheetRows(targetSlotMachinePath, "BaseBetRegions");
  const baseBetIndexes = unique(baseBetRows, "BaseBetRegionsIndex", "BaseBetRegions");

  if (combat.CombatConfig.length !== 1) fail("CombatConfig must contain exactly one data row");
  const config = combat.CombatConfig[0];
  if (number(config.ServerTickSeconds, "CombatConfig.ServerTickSeconds") <= 0) fail("ServerTickSeconds must be > 0");
  if (number(config.PlayerDeathPenaltySeconds, "CombatConfig.PlayerDeathPenaltySeconds") < 0) fail("PlayerDeathPenaltySeconds must be >= 0");
  const revivePermille = number(config.PlayerReviveHpPermille, "CombatConfig.PlayerReviveHpPermille");
  if (revivePermille < 1 || revivePermille > 1000) fail("PlayerReviveHpPermille must be within 1..1000");
  if (String(config.RuntimeKind) !== "TEST_SANDBOX") fail("Combat Foundation RuntimeKind must be TEST_SANDBOX");

  const tierIndexes = unique(combat.HuntingGroundTiers, "HuntingGroundTiersIndex", "HuntingGroundTiers");
  unique(combat.HuntingGroundTiers, "TierKey", "HuntingGroundTiers");
  const playerIndexes = unique(combat.PlayerStatsProfiles, "PlayerStatsProfilesIndex", "PlayerStatsProfiles");
  unique(combat.PlayerStatsProfiles, "ProfileKey", "PlayerStatsProfiles");
  const monsterIndexes = unique(combat.MonsterDefinitions, "MonsterDefinitionsIndex", "MonsterDefinitions");
  unique(combat.MonsterDefinitions, "MonsterKey", "MonsterDefinitions");
  const spawnIndexes = unique(combat.MonsterSpawnGroups, "MonsterSpawnGroupsIndex", "MonsterSpawnGroups");
  unique(combat.MonsterSpawnGroups, "SpawnGroupKey", "MonsterSpawnGroups");
  const dropGroupIds = unique(drop.DropGroups, "DropGroupId", "DropGroups");
  unique(drop.DropGroups, "DropGroupsIndex", "DropGroups");
  unique(drop.DropEntries, "DropEntriesIndex", "DropEntries");

  if (!tierIndexes.has(String(config.InitialHuntingGroundTierIndex))) fail("InitialHuntingGroundTierIndex is dangling");

  for (const row of combat.HuntingGroundTiers.filter((entry) => enabled(entry.Enabled))) {
    if (!baseBetIndexes.has(String(row.BaseBetRegionIndex))) fail(`Tier ${row.TierKey} has dangling BaseBetRegionIndex`);
    if (!playerIndexes.has(String(row.PlayerStatsProfileIndex))) fail(`Tier ${row.TierKey} has dangling PlayerStatsProfileIndex`);
    if (!spawnIndexes.has(String(row.SpawnGroupIndex))) fail(`Tier ${row.TierKey} has dangling SpawnGroupIndex`);
    if (number(row.BaseBetRegionIndex, `${row.TierKey}.BaseBetRegionIndex`) < 1) fail(`${row.TierKey}.BaseBetRegionIndex must be >= 1`);
  }

  for (const row of combat.PlayerStatsProfiles.filter((entry) => enabled(entry.Enabled))) {
    for (const key of ["MaxHp", "AttackPower", "AttackIntervalSeconds", "AttackRange", "MoveSpeed", "AggroRange"]) {
      if (number(row[key], `${row.ProfileKey}.${key}`) <= 0) fail(`${row.ProfileKey}.${key} must be > 0`);
    }
    const chance = number(row.CriticalChancePermille, `${row.ProfileKey}.CriticalChancePermille`);
    if (chance < 0 || chance > 1000) fail(`${row.ProfileKey}.CriticalChancePermille must be within 0..1000`);
    if (number(row.CriticalDamagePermille, `${row.ProfileKey}.CriticalDamagePermille`) < 1000) fail(`${row.ProfileKey}.CriticalDamagePermille must be >= 1000`);
  }

  for (const row of combat.MonsterDefinitions.filter((entry) => enabled(entry.Enabled))) {
    for (const key of ["MaxHp", "AttackPower", "AttackIntervalSeconds", "MoveSpeed", "ChaseRange", "AttackRange", "RespawnSeconds"]) {
      if (number(row[key], `${row.MonsterKey}.${key}`) < (key === "RespawnSeconds" ? 0 : Number.EPSILON)) fail(`${row.MonsterKey}.${key} is invalid`);
    }
    if (!dropGroupIds.has(String(row.DropGroupId))) fail(`${row.MonsterKey} has dangling DropGroupId ${row.DropGroupId}`);
    if (isBlank(row.ModelPath) || isBlank(row.StandAnimationRuid) || isBlank(row.DieAnimationRuid)) fail(`${row.MonsterKey} is missing required model/animation data`);
  }

  for (const row of combat.MonsterSpawnGroups.filter((entry) => enabled(entry.Enabled))) {
    if (!monsterIndexes.has(String(row.MonsterDefinitionIndex))) fail(`${row.SpawnGroupKey} has dangling MonsterDefinitionIndex`);
    if (!Number.isInteger(number(row.SpawnCount, `${row.SpawnGroupKey}.SpawnCount`)) || Number(row.SpawnCount) < 1) fail(`${row.SpawnGroupKey}.SpawnCount must be a positive integer`);
    for (const key of ["SpawnAnchorKey", "BoundsLeftAnchorKey", "BoundsRightAnchorKey"]) {
      if (isBlank(row[key])) fail(`${row.SpawnGroupKey}.${key} cannot be blank`);
    }
  }

  const supportedModes = new Set(["INDEPENDENT"]);
  for (const row of drop.DropGroups.filter((entry) => enabled(entry.Enabled))) {
    if (!supportedModes.has(String(row.RollMode))) fail(`${row.DropGroupId} uses unsupported RollMode ${row.RollMode}`);
    if (!Number.isInteger(number(row.RollCount, `${row.DropGroupId}.RollCount`)) || Number(row.RollCount) < 1) fail(`${row.DropGroupId}.RollCount must be a positive integer`);
  }

  for (const row of drop.DropEntries.filter((entry) => enabled(entry.Enabled))) {
    if (!dropGroupIds.has(String(row.DropGroupId))) fail(`Drop entry ${row.DropEntriesIndex} has dangling DropGroupId`);
    if (!new Set(["CURRENCY", "ITEM"]).has(String(row.RewardType))) fail(`Drop entry ${row.DropEntriesIndex} has unsupported RewardType`);
    if (String(row.RewardType) === "CURRENCY" && String(row.RewardKey) !== "COMMON_COIN") fail(`Drop entry ${row.DropEntriesIndex} uses an unknown currency key`);
    if (isBlank(row.RewardKey)) fail(`Drop entry ${row.DropEntriesIndex} RewardKey cannot be blank`);
    const min = number(row.MinQuantity, `DropEntries.${row.DropEntriesIndex}.MinQuantity`);
    const max = number(row.MaxQuantity, `DropEntries.${row.DropEntriesIndex}.MaxQuantity`);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min) fail(`Drop entry ${row.DropEntriesIndex} has an invalid quantity range`);
    const chance = number(row.ChancePermille, `DropEntries.${row.DropEntriesIndex}.ChancePermille`);
    if (!Number.isInteger(chance) || chance < 0 || chance > 1000) fail(`Drop entry ${row.DropEntriesIndex} ChancePermille must be within 0..1000`);
    if (number(row.RollWeight, `DropEntries.${row.DropEntriesIndex}.RollWeight`) < 0) fail(`Drop entry ${row.DropEntriesIndex} RollWeight must be >= 0`);
  }

  return { combat, drop };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = await loadAndValidateCombatTables({ excelDir, slotMachinePath });
  console.log(`Combat tables valid: ${data.combat.MonsterDefinitions.length} monster(s), ${data.drop.DropEntries.length} drop entry(s)`);
}
