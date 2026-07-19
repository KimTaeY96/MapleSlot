import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { combatWorkbookSheets, dropSheets, columnNames } from "./combat_excel_schema.mjs";

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

function resolveEnumReferences(combat, enumRows) {
  const enumLookup = new Map();
  for (const row of enumRows) {
    const typeName = String(row.EnumTypeName);
    if (!enumLookup.has(typeName)) enumLookup.set(typeName, new Map());
    const values = enumLookup.get(typeName);
    values.set(String(row.EnumId), String(row.EnumId));
    values.set(String(row.EnumKo), String(row.EnumId));
  }
  for (const schemas of Object.values(combatWorkbookSheets)) {
    for (const [sheetName, schema] of Object.entries(schemas)) {
      for (const [columnName, , , columnType] of schema.columns) {
        const match = /^ref:Enums\.(.+)$/.exec(String(columnType));
        if (!match) continue;
        const values = enumLookup.get(match[1]);
        if (!values) fail(`Enum.xlsx is missing enum group ${match[1]}`);
        for (const row of combat[sheetName] ?? []) {
          const resolved = values.get(String(row[columnName]));
          if (!resolved) fail(`${sheetName}.${columnName} has unresolved ${match[1]} value ${JSON.stringify(row[columnName])}`);
          row[columnName] = resolved;
        }
      }
    }
  }
  return enumLookup;
}

export async function loadAndValidateCombatTables(options = {}) {
  const targetExcelDir = options.excelDir ? path.resolve(options.excelDir) : excelDir;
  const targetSlotMachinePath = options.slotMachinePath ? path.resolve(options.slotMachinePath) : slotMachinePath;
  const combatParts = await Promise.all(Object.entries(combatWorkbookSheets)
    .map(([filename, schemas]) => readWorkbook(targetExcelDir, filename, schemas)));
  const combat = Object.assign({}, ...combatParts);
  const drop = await readWorkbook(targetExcelDir, "Drop.xlsx", dropSheets);
  const enumRows = await readSheetRows(path.join(targetExcelDir, "Enum.xlsx"), "Enums");
  const gameStringRows = await readSheetRows(path.join(targetExcelDir, "GameString.xlsx"), "GameString");
  const gameStringIndexes = unique(gameStringRows, "Index", "GameString");
  for (const row of enumRows) {
    if (!gameStringIndexes.has(String(row.EnumString))) fail(`${row.EnumTypeName}.${row.EnumId} has dangling EnumString ${row.EnumString}`);
  }
  const enumLookup = resolveEnumReferences(combat, enumRows);
  const baseBetRows = await readSheetRows(targetSlotMachinePath, "BaseBetRegions");
  const baseBetIndexes = unique(baseBetRows, "BaseBetRegionsIndex", "BaseBetRegions");

  if (combat.CombatConfig.length !== 1) fail("CombatConfig must contain exactly one data row");
  const config = combat.CombatConfig[0];
  if (number(config.ServerTickSeconds, "CombatConfig.ServerTickSeconds") <= 0) fail("ServerTickSeconds must be > 0");
  if (number(config.PlayerDeathPenaltySeconds, "CombatConfig.PlayerDeathPenaltySeconds") < 0) fail("PlayerDeathPenaltySeconds must be >= 0");
  const revivePermille = number(config.PlayerReviveHpPermille, "CombatConfig.PlayerReviveHpPermille");
  if (revivePermille < 1 || revivePermille > 1000) fail("PlayerReviveHpPermille must be within 1..1000");
  if (String(config.RuntimeKind) !== "HENESYS_TILE_LANES") fail("Combat RuntimeKind must be HENESYS_TILE_LANES");
  if (isBlank(config.HenesysMapKey)) fail("CombatConfig.HenesysMapKey cannot be blank");
  if (number(config.LaneMatchTolerance, "CombatConfig.LaneMatchTolerance") <= 0) fail("LaneMatchTolerance must be > 0");
  const minimumLaneSpacing = number(config.MinimumLaneSpacing, "CombatConfig.MinimumLaneSpacing");
  if (minimumLaneSpacing <= 0) fail("MinimumLaneSpacing must be > 0");
  const playerSpawnX = number(config.PlayerSpawnNormalizedX, "CombatConfig.PlayerSpawnNormalizedX");
  const monsterSpawnX = number(config.MonsterSpawnNormalizedX, "CombatConfig.MonsterSpawnNormalizedX");
  if (playerSpawnX <= 0 || playerSpawnX >= 1) fail("PlayerSpawnNormalizedX must be within 0..1 exclusive");
  if (monsterSpawnX <= 0 || monsterSpawnX >= 1) fail("MonsterSpawnNormalizedX must be within 0..1 exclusive");
  if (playerSpawnX >= monsterSpawnX) fail("PlayerSpawnNormalizedX must be less than MonsterSpawnNormalizedX");
  if (number(config.CombatBoundsInset, "CombatConfig.CombatBoundsInset") < 0) fail("CombatBoundsInset must be >= 0");
  if (number(config.PlayerSpawnYOffset, "CombatConfig.PlayerSpawnYOffset") < 0) fail("PlayerSpawnYOffset must be >= 0");
  const combatAreaMinimumX = number(config.CombatAreaMinimumWorldX, "CombatConfig.CombatAreaMinimumWorldX");
  const combatAreaMaximumX = number(config.CombatAreaMaximumWorldX, "CombatConfig.CombatAreaMaximumWorldX");
  if (combatAreaMinimumX < 0) fail("CombatAreaMinimumWorldX must stay on the right side of the screen");
  if (combatAreaMaximumX <= combatAreaMinimumX) fail("CombatAreaMaximumWorldX must be greater than CombatAreaMinimumWorldX");
  const cameraScreenOffsetX = number(config.CombatCameraScreenOffsetX, "CombatConfig.CombatCameraScreenOffsetX");
  const cameraScreenOffsetY = number(config.CombatCameraScreenOffsetY, "CombatConfig.CombatCameraScreenOffsetY");
  if (cameraScreenOffsetX <= 0.5 || cameraScreenOffsetX >= 1) fail("CombatCameraScreenOffsetX must place combat in the screen-right half");
  if (cameraScreenOffsetY <= 0 || cameraScreenOffsetY >= 1) fail("CombatCameraScreenOffsetY must be within 0..1 exclusive");
  if (typeof config.CombatCameraConfineArea !== "boolean") fail("CombatCameraConfineArea must be boolean");
  if (isBlank(config.CombatCameraAnchorKey)) fail("CombatCameraAnchorKey cannot be blank");
  if (!String(config.CombatCameraAnchorKey).startsWith("CombatHarness/")) fail("CombatCameraAnchorKey must stay under CombatHarness");

  const tierIndexes = unique(combat.HuntingGroundTiers, "HuntingGroundTiersIndex", "HuntingGroundTiers");
  unique(combat.HuntingGroundTiers, "TierKey", "HuntingGroundTiers");
  const playerIndexes = unique(combat.PlayerStatsProfiles, "PlayerStatsProfilesIndex", "PlayerStatsProfiles");
  unique(combat.PlayerStatsProfiles, "ProfileKey", "PlayerStatsProfiles");
  unique(combat.CombatLanes, "CombatLanesIndex", "CombatLanes");
  unique(combat.CombatLadders, "CombatLaddersIndex", "CombatLadders");
  const monsterIndexes = unique(combat.MonsterDefinitions, "MonsterDefinitionsIndex", "MonsterDefinitions");
  unique(combat.MonsterDefinitions, "MonsterKey", "MonsterDefinitions");
  const skillIndexes = unique(combat.SkillInfo, "SkillInfoIndex", "SkillInfo");
  unique(combat.SkillInfo, "SkillKeyEnumId", "SkillInfo");
  const spawnIndexes = unique(combat.MonsterSpawnGroups, "MonsterSpawnGroupsIndex", "MonsterSpawnGroups");
  unique(combat.MonsterSpawnGroups, "SpawnGroupKey", "MonsterSpawnGroups");
  const dropGroupIds = unique(drop.DropGroups, "DropGroupId", "DropGroups");
  unique(drop.DropGroups, "DropGroupsIndex", "DropGroups");
  unique(drop.DropEntries, "DropEntriesIndex", "DropEntries");

  if (!tierIndexes.has(String(config.InitialHuntingGroundTierIndex))) fail("InitialHuntingGroundTierIndex is dangling");

  const supportedLaneKeys = new Set(["UPPER", "CENTER", "LOWER"]);
  const supportedSkillOrigins = new Set(enumLookup.get("SkillHitOriginType")?.values() ?? []);
  const supportedSkillShapes = new Set(enumLookup.get("SkillHitShapeType")?.values() ?? []);
  for (const row of combat.SkillInfo.filter((entry) => enabled(entry.Enabled))) {
    if (number(row.CooldownSeconds, `${row.SkillKeyEnumId}.CooldownSeconds`) < 0) fail(`${row.SkillKeyEnumId}.CooldownSeconds must be >= 0`);
    if (number(row.DamageCoefficientPermille, `${row.SkillKeyEnumId}.DamageCoefficientPermille`) <= 0) fail(`${row.SkillKeyEnumId}.DamageCoefficientPermille must be > 0`);
    if (number(row.CastRangeX, `${row.SkillKeyEnumId}.CastRangeX`) < 0 || number(row.CastRangeY, `${row.SkillKeyEnumId}.CastRangeY`) < 0) {
      fail(`${row.SkillKeyEnumId} cast ranges must be >= 0`);
    }
    if (!supportedSkillOrigins.has(String(row.HitOriginTypeEnumId))) fail(`${row.SkillKeyEnumId}.HitOriginTypeEnumId is invalid`);
    if (!supportedSkillShapes.has(String(row.HitShapeTypeEnumId))) fail(`${row.SkillKeyEnumId}.HitShapeTypeEnumId is invalid`);
    if (String(row.HitShapeTypeEnumId) === "CIRCLE") {
      if (number(row.HitRadius, `${row.SkillKeyEnumId}.HitRadius`) <= 0) fail(`${row.SkillKeyEnumId}.HitRadius must be > 0 for CIRCLE`);
    } else if (String(row.HitShapeTypeEnumId) === "RECTANGLE") {
      if (number(row.HitRangeX, `${row.SkillKeyEnumId}.HitRangeX`) <= 0 || number(row.HitRangeY, `${row.SkillKeyEnumId}.HitRangeY`) <= 0) {
        fail(`${row.SkillKeyEnumId} rectangle ranges must be > 0`);
      }
    }
  }
  const laneIdentity = new Set();
  for (const row of combat.CombatLanes.filter((entry) => enabled(entry.Enabled))) {
    const tierIndex = String(row.HuntingGroundTierIndex);
    const laneKey = String(row.LaneKey);
    if (!tierIndexes.has(tierIndex)) fail(`Combat lane ${row.CombatLanesIndex} has dangling HuntingGroundTierIndex`);
    if (!supportedLaneKeys.has(laneKey)) fail(`Combat lane ${row.CombatLanesIndex} has unsupported LaneKey ${laneKey}`);
    if (String(row.MapKey) !== String(config.HenesysMapKey)) fail(`Combat lane ${laneKey} must use map ${config.HenesysMapKey}`);
    const identity = `${tierIndex}:${laneKey}`;
    if (laneIdentity.has(identity)) fail(`CombatLanes contains duplicate ${identity}`);
    laneIdentity.add(identity);
    if (!Number.isInteger(number(row.LaneOrder, `${identity}.LaneOrder`))) fail(`${identity}.LaneOrder must be an integer`);
    number(row.WorldYOffset, `${identity}.WorldYOffset`);
    if (number(row.MinimumHorizontalSpan, `${identity}.MinimumHorizontalSpan`) <= 0) fail(`${identity}.MinimumHorizontalSpan must be > 0`);
    for (const key of ["SpawnAnchorKey", "BoundsLeftAnchorKey", "BoundsRightAnchorKey"]) {
      if (isBlank(row[key])) fail(`${identity}.${key} cannot be blank`);
    }
  }

  const ladderIdentity = new Set();
  for (const row of combat.CombatLadders.filter((entry) => enabled(entry.Enabled))) {
    const tierIndex = String(row.HuntingGroundTierIndex);
    const lowerLaneKey = String(row.LowerLaneKey);
    const upperLaneKey = String(row.UpperLaneKey);
    if (!tierIndexes.has(tierIndex)) fail(`Combat ladder ${row.CombatLaddersIndex} has dangling HuntingGroundTierIndex`);
    if (String(row.MapKey) !== String(config.HenesysMapKey)) fail(`Combat ladder ${row.LadderKey} must use map ${config.HenesysMapKey}`);
    if (isBlank(row.LadderKey)) fail(`Combat ladder ${row.CombatLaddersIndex}.LadderKey cannot be blank`);
    if (!supportedLaneKeys.has(lowerLaneKey) || !supportedLaneKeys.has(upperLaneKey)) fail(`Combat ladder ${row.LadderKey} has an invalid lane key`);
    const lowerLane = combat.CombatLanes.find((lane) => String(lane.HuntingGroundTierIndex) === tierIndex && String(lane.LaneKey) === lowerLaneKey);
    const upperLane = combat.CombatLanes.find((lane) => String(lane.HuntingGroundTierIndex) === tierIndex && String(lane.LaneKey) === upperLaneKey);
    if (!lowerLane || !upperLane || Number(lowerLane.LaneOrder) - Number(upperLane.LaneOrder) !== 1) {
      fail(`Combat ladder ${row.LadderKey} must connect adjacent lower and upper lanes`);
    }
    const identity = `${tierIndex}:${lowerLaneKey}:${upperLaneKey}`;
    if (ladderIdentity.has(identity)) fail(`CombatLadders contains duplicate ${identity}`);
    ladderIdentity.add(identity);
  }

  for (const row of combat.HuntingGroundTiers.filter((entry) => enabled(entry.Enabled))) {
    if (!baseBetIndexes.has(String(row.BaseBetRegionIndex))) fail(`Tier ${row.TierKey} has dangling BaseBetRegionIndex`);
    if (!playerIndexes.has(String(row.PlayerStatsProfileIndex))) fail(`Tier ${row.TierKey} has dangling PlayerStatsProfileIndex`);
    if (!spawnIndexes.has(String(row.SpawnGroupIndex))) fail(`Tier ${row.TierKey} has dangling SpawnGroupIndex`);
    if (number(row.BaseBetRegionIndex, `${row.TierKey}.BaseBetRegionIndex`) < 1) fail(`${row.TierKey}.BaseBetRegionIndex must be >= 1`);

    const lanes = combat.CombatLanes
      .filter((lane) => enabled(lane.Enabled) && String(lane.HuntingGroundTierIndex) === String(row.HuntingGroundTiersIndex))
      .sort((a, b) => Number(a.LaneOrder) - Number(b.LaneOrder));
    if (lanes.length !== 3) fail(`${row.TierKey} must define exactly three enabled combat lanes`);
    const laneKeys = lanes.map((lane) => String(lane.LaneKey));
    if (laneKeys.join(",") !== "UPPER,CENTER,LOWER") fail(`${row.TierKey} lane order must be UPPER,CENTER,LOWER`);
    if (lanes.map((lane) => Number(lane.LaneOrder)).join(",") !== "1,2,3") fail(`${row.TierKey} LaneOrder must be 1,2,3`);
    const centerLane = lanes[1];
    if (Math.abs(number(centerLane.WorldYOffset, `${row.TierKey}.CENTER.WorldYOffset`)) > Number(config.LaneMatchTolerance)) {
      fail(`${row.TierKey} CENTER WorldYOffset must be 0 within LaneMatchTolerance`);
    }
    for (let index = 1; index < lanes.length; index += 1) {
      const spacing = Math.abs(Number(lanes[index - 1].WorldYOffset) - Number(lanes[index].WorldYOffset));
      if (spacing < minimumLaneSpacing) fail(`${row.TierKey} adjacent lane spacing must be >= ${minimumLaneSpacing}`);
    }
    const basicAttackLanes = lanes.filter((lane) => enabled(lane.BasicAttackTargetable));
    if (basicAttackLanes.length !== 3) fail(`${row.TierKey} basic attacks must follow the player across all three lanes`);
    const initialSpawnLanes = lanes.filter((lane) => enabled(lane.InitialSpawnEnabled));
    if (initialSpawnLanes.length !== 3) fail(`${row.TierKey} must spawn monsters on all three lanes`);
    const profile = combat.PlayerStatsProfiles.find((entry) => String(entry.PlayerStatsProfilesIndex) === String(row.PlayerStatsProfileIndex));
    if (!supportedLaneKeys.has(String(profile?.BasicAttackLaneKey))) fail(`${row.TierKey} player profile has an invalid starting lane`);
    const spawnGroups = combat.MonsterSpawnGroups.filter((entry) => enabled(entry.Enabled)
      && String(entry.HuntingGroundTierIndex) === String(row.HuntingGroundTiersIndex));
    if (spawnGroups.length !== 3) fail(`${row.TierKey} must define exactly three enabled lane spawn groups`);
    const spawnGroupLaneKeys = spawnGroups.map((entry) => String(entry.LaneKey)).sort();
    if (spawnGroupLaneKeys.join(",") !== "CENTER,LOWER,UPPER") fail(`${row.TierKey} spawn groups must cover UPPER, CENTER, and LOWER once each`);
    if (!spawnGroups.some((entry) => String(entry.MonsterSpawnGroupsIndex) === String(row.SpawnGroupIndex))) {
      fail(`${row.TierKey} primary SpawnGroupIndex must belong to the tier`);
    }
    for (const spawnGroup of spawnGroups) {
      const lane = lanes.find((entry) => String(entry.LaneKey) === String(spawnGroup.LaneKey));
      for (const key of ["SpawnAnchorKey", "BoundsLeftAnchorKey", "BoundsRightAnchorKey"]) {
        if (String(spawnGroup[key]) !== String(lane?.[key])) fail(`${spawnGroup.SpawnGroupKey}.${key} does not match CombatLanes`);
      }
    }
    const ladders = combat.CombatLadders.filter((entry) => enabled(entry.Enabled)
      && String(entry.HuntingGroundTierIndex) === String(row.HuntingGroundTiersIndex));
    if (ladders.length !== 2) fail(`${row.TierKey} must define exactly two adjacent ladder routes`);
  }

  for (const row of combat.PlayerStatsProfiles.filter((entry) => enabled(entry.Enabled))) {
    for (const key of ["MaxHp", "AttackPower", "AttackIntervalSeconds", "AttackRange", "MoveSpeed", "AggroRange", "LadderClimbSpeed", "LadderExitStandOffset"]) {
      if (number(row[key], `${row.ProfileKey}.${key}`) <= 0) fail(`${row.ProfileKey}.${key} must be > 0`);
    }
    const chance = number(row.CriticalChancePermille, `${row.ProfileKey}.CriticalChancePermille`);
    if (chance < 0 || chance > 1000) fail(`${row.ProfileKey}.CriticalChancePermille must be within 0..1000`);
    if (number(row.CriticalDamagePermille, `${row.ProfileKey}.CriticalDamagePermille`) < 1000) fail(`${row.ProfileKey}.CriticalDamagePermille must be >= 1000`);
    if (!supportedLaneKeys.has(String(row.BasicAttackLaneKey))) fail(`${row.ProfileKey}.BasicAttackLaneKey is invalid`);
    const hitboxHeight = number(row.AttackHitboxHeight, `${row.ProfileKey}.AttackHitboxHeight`);
    if (hitboxHeight <= 0 || hitboxHeight >= minimumLaneSpacing) fail(`${row.ProfileKey}.AttackHitboxHeight must be > 0 and < MinimumLaneSpacing`);
    for (const key of ["LadderApproachTolerance", "LadderExitTolerance"]) {
      if (number(row[key], `${row.ProfileKey}.${key}`) <= 0) fail(`${row.ProfileKey}.${key} must be > 0`);
    }
    const attackDuration = number(row.AttackAnimationDurationSeconds, `${row.ProfileKey}.AttackAnimationDurationSeconds`);
    const attackHitDelay = number(row.AttackHitDelaySeconds, `${row.ProfileKey}.AttackHitDelaySeconds`);
    const hitDuration = number(row.HitAnimationDurationSeconds, `${row.ProfileKey}.HitAnimationDurationSeconds`);
    if (attackDuration <= 0) fail(`${row.ProfileKey}.AttackAnimationDurationSeconds must be > 0`);
    if (attackHitDelay < 0 || attackHitDelay >= attackDuration) fail(`${row.ProfileKey}.AttackHitDelaySeconds must be >= 0 and < AttackAnimationDurationSeconds`);
    if (hitDuration <= 0) fail(`${row.ProfileKey}.HitAnimationDurationSeconds must be > 0`);
    if (Number(row.AttackIntervalSeconds) < attackDuration) fail(`${row.ProfileKey}.AttackIntervalSeconds must be >= AttackAnimationDurationSeconds`);
    if (!skillIndexes.has(String(row.BasicAttackSkillInfoIndex))) fail(`${row.ProfileKey}.BasicAttackSkillInfoIndex is dangling`);
  }

  for (const row of combat.MonsterDefinitions.filter((entry) => enabled(entry.Enabled))) {
    for (const key of ["MaxHp", "AttackPower", "AttackIntervalSeconds", "MoveSpeed", "ChaseRange", "AttackRange", "RespawnSeconds", "IdleMinSeconds", "IdleMaxSeconds", "WanderMinSeconds", "WanderMaxSeconds", "ContactMoveThroughSeconds"]) {
      if (number(row[key], `${row.MonsterKey}.${key}`) < (key === "RespawnSeconds" ? 0 : Number.EPSILON)) fail(`${row.MonsterKey}.${key} is invalid`);
    }
    if (Number(row.IdleMaxSeconds) < Number(row.IdleMinSeconds)) fail(`${row.MonsterKey}.IdleMaxSeconds must be >= IdleMinSeconds`);
    if (Number(row.WanderMaxSeconds) < Number(row.WanderMinSeconds)) fail(`${row.MonsterKey}.WanderMaxSeconds must be >= WanderMinSeconds`);
    if (typeof row.Aggressive !== "boolean") fail(`${row.MonsterKey}.Aggressive must be boolean`);
    if (!new Set(["CONTACT", "ACTIVE"]).has(String(row.AttackMode))) fail(`${row.MonsterKey}.AttackMode is invalid`);
    if (String(row.AttackMode) === "CONTACT" && !isBlank(row.AttackAnimationRuid)) fail(`${row.MonsterKey} CONTACT mode must not define AttackAnimationRuid`);
    if (String(row.AttackMode) === "ACTIVE" && isBlank(row.AttackAnimationRuid)) fail(`${row.MonsterKey} ACTIVE mode requires AttackAnimationRuid`);
    if (!dropGroupIds.has(String(row.DropGroupId))) fail(`${row.MonsterKey} has dangling DropGroupId ${row.DropGroupId}`);
    if (isBlank(row.ModelPath) || isBlank(row.StandAnimationRuid) || isBlank(row.DieAnimationRuid)) fail(`${row.MonsterKey} is missing required model/animation data`);
    const hitboxHeight = number(row.AttackHitboxHeight, `${row.MonsterKey}.AttackHitboxHeight`);
    if (hitboxHeight <= 0 || hitboxHeight >= minimumLaneSpacing) fail(`${row.MonsterKey}.AttackHitboxHeight must be > 0 and < MinimumLaneSpacing`);
    const attackDuration = number(row.AttackAnimationDurationSeconds, `${row.MonsterKey}.AttackAnimationDurationSeconds`);
    const attackHitDelay = number(row.AttackHitDelaySeconds, `${row.MonsterKey}.AttackHitDelaySeconds`);
    const hitDuration = number(row.HitAnimationDurationSeconds, `${row.MonsterKey}.HitAnimationDurationSeconds`);
    if (attackDuration <= 0) fail(`${row.MonsterKey}.AttackAnimationDurationSeconds must be > 0`);
    if (attackHitDelay < 0 || attackHitDelay >= attackDuration) fail(`${row.MonsterKey}.AttackHitDelaySeconds must be >= 0 and < AttackAnimationDurationSeconds`);
    if (hitDuration <= 0) fail(`${row.MonsterKey}.HitAnimationDurationSeconds must be > 0`);
    if (Number(row.AttackIntervalSeconds) < attackDuration) fail(`${row.MonsterKey}.AttackIntervalSeconds must be >= AttackAnimationDurationSeconds`);
    if (!skillIndexes.has(String(row.ContactSkillInfoIndex))) fail(`${row.MonsterKey}.ContactSkillInfoIndex is dangling`);
    if (String(row.AttackMode) === "ACTIVE" && !skillIndexes.has(String(row.ActiveSkillInfoIndex))) {
      fail(`${row.MonsterKey}.ActiveSkillInfoIndex is dangling`);
    }
    if (String(row.AttackMode) === "CONTACT" && !isBlank(row.ActiveSkillInfoIndex)) {
      fail(`${row.MonsterKey} CONTACT mode must not define ActiveSkillInfoIndex`);
    }
  }

  for (const row of combat.MonsterSpawnGroups.filter((entry) => enabled(entry.Enabled))) {
    if (!tierIndexes.has(String(row.HuntingGroundTierIndex))) fail(`${row.SpawnGroupKey} has dangling HuntingGroundTierIndex`);
    if (!monsterIndexes.has(String(row.MonsterDefinitionIndex))) fail(`${row.SpawnGroupKey} has dangling MonsterDefinitionIndex`);
    if (!Number.isInteger(number(row.SpawnCount, `${row.SpawnGroupKey}.SpawnCount`)) || Number(row.SpawnCount) < 1) fail(`${row.SpawnGroupKey}.SpawnCount must be a positive integer`);
    for (const key of ["SpawnAnchorKey", "BoundsLeftAnchorKey", "BoundsRightAnchorKey"]) {
      if (isBlank(row[key])) fail(`${row.SpawnGroupKey}.${key} cannot be blank`);
    }
    if (!supportedLaneKeys.has(String(row.LaneKey))) fail(`${row.SpawnGroupKey}.LaneKey is invalid`);
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
