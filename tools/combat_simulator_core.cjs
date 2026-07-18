"use strict";

function isEnabled(value) {
  return value === true || value === 1 || String(value).toLowerCase() === "true";
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function rollInclusive(min, max, random) {
  return min + Math.floor(random() * (max - min + 1));
}

function resolveDropGroup(drop, dropGroupId, random = Math.random) {
  const group = drop.DropGroups.find((row) => isEnabled(row.Enabled) && String(row.DropGroupId) === String(dropGroupId));
  if (!group) throw new Error(`Missing enabled drop group: ${dropGroupId}`);
  if (String(group.RollMode) !== "INDEPENDENT") throw new Error(`Unsupported RollMode: ${group.RollMode}`);

  const entries = drop.DropEntries.filter((row) => isEnabled(row.Enabled) && String(row.DropGroupId) === String(dropGroupId));
  const grants = [];
  const rollCount = Number(group.RollCount);
  for (let roll = 0; roll < rollCount; roll += 1) {
    for (const entry of entries) {
      if (random() * 1000 >= Number(entry.ChancePermille)) continue;
      grants.push({
        rewardType: String(entry.RewardType),
        rewardKey: String(entry.RewardKey),
        quantity: rollInclusive(Number(entry.MinQuantity), Number(entry.MaxQuantity), random),
        sourceDropGroupId: String(dropGroupId),
        sourceEntryIndex: Number(entry.DropEntriesIndex),
      });
    }
  }
  if (!isEnabled(group.EmptyResultAllowed) && grants.length === 0) {
    throw new Error(`Drop group ${dropGroupId} produced an empty result`);
  }
  return grants;
}

function buildSkillHitArea(skill, caster, target, facingDirectionX) {
  const origin = String(skill.HitOriginTypeEnumId) === "TARGET" ? target : caster;
  if (String(skill.HitShapeTypeEnumId) === "CIRCLE") {
    return { shape: "CIRCLE", origin: { ...origin }, radius: Number(skill.HitRadius) };
  }
  const direction = Number(facingDirectionX) >= 0 ? 1 : -1;
  const width = Number(skill.HitRangeX);
  const height = Number(skill.HitRangeY);
  return {
    shape: "RECTANGLE",
    origin: { ...origin },
    direction,
    width,
    height,
    center: { x: Number(origin.x) + direction * width / 2, y: Number(origin.y) },
  };
}

function isPointInsideSkillHitArea(area, point) {
  if (area.shape === "CIRCLE") {
    const dx = Number(point.x) - Number(area.origin.x);
    const dy = Number(point.y) - Number(area.origin.y);
    return dx * dx + dy * dy <= area.radius * area.radius;
  }
  const halfWidth = area.width / 2;
  const halfHeight = area.height / 2;
  return Math.abs(Number(point.x) - area.center.x) <= halfWidth
    && Math.abs(Number(point.y) - area.center.y) <= halfHeight;
}

class CombatSimulator {
  constructor({ config, playerProfile, playerSkill, monsterDefinition, drop, random = Math.random }) {
    this.config = config;
    this.playerProfile = playerProfile;
    this.playerSkill = playerSkill;
    this.monsterDefinition = monsterDefinition;
    this.drop = drop;
    this.random = random;
    this.time = 0;
    this.playerHp = Number(playerProfile.MaxHp);
    this.monsterHp = Number(monsterDefinition.MaxHp);
    this.playerState = "ACQUIRE";
    this.monsterDeathResolved = false;
    this.reviveAt = null;
    this.grants = [];
  }

  playerAttack(monsterLaneKey = "CENTER") {
    if (this.playerState === "DEAD_WAIT") return [];
    if (this.monsterDeathResolved) return [];
    if (String(monsterLaneKey) !== String(this.playerProfile.BasicAttackLaneKey)) return [];
    const coefficient = Number(this.playerSkill?.DamageCoefficientPermille ?? 1000);
    const damage = Math.floor(Number(this.playerProfile.AttackPower) * coefficient / 1000);
    this.monsterHp = Math.max(0, this.monsterHp - damage);
    if (this.monsterHp > 0) return [];
    this.monsterDeathResolved = true;
    const grants = resolveDropGroup(this.drop, this.monsterDefinition.DropGroupId, this.random);
    this.grants.push(...grants);
    this.playerState = "ACQUIRE";
    return grants;
  }

  damagePlayer(amount) {
    if (this.playerState === "DEAD_WAIT") return false;
    this.playerHp = Math.max(0, this.playerHp - Number(amount));
    if (this.playerHp > 0) return false;
    this.playerState = "DEAD_WAIT";
    this.reviveAt = this.time + Number(this.config.PlayerDeathPenaltySeconds);
    return true;
  }

  advance(seconds) {
    if (seconds < 0) throw new Error("Cannot advance negative time");
    this.time += seconds;
    if (this.playerState !== "DEAD_WAIT" || this.time < this.reviveAt) return false;
    this.playerHp = Math.max(1, Math.floor(Number(this.playerProfile.MaxHp) * Number(this.config.PlayerReviveHpPermille) / 1000));
    this.playerState = "ACQUIRE";
    this.reviveAt = null;
    return true;
  }
}

module.exports = {
  CombatSimulator,
  buildSkillHitArea,
  createSeededRandom,
  isPointInsideSkillHitArea,
  resolveDropGroup,
  rollInclusive,
};
