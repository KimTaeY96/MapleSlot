export const combatSheets = {
  CombatConfig: {
    config: true,
    columns: [
      ["ServerTickSeconds", "server", "\uC11C\uBC84 \uC804\uD22C \uC758\uC0AC \uACB0\uC815 \uAC31\uC2E0 \uC8FC\uAE30\uC785\uB2C8\uB2E4.", "float"],
      ["PlayerDeathPenaltySeconds", "server", "\uD50C\uB808\uC774\uC5B4 \uC0AC\uB9DD \uD6C4 \uC804\uD22C\uC640 \uD30C\uBC0D\uC744 \uC911\uB2E8\uD558\uB294 \uC2DC\uAC04\uC785\uB2C8\uB2E4.", "float"],
      ["PlayerReviveHpPermille", "server", "\uBD80\uD65C \uC2DC \uCD5C\uB300 HP \uB300\uBE44 \uCC9C\uBD84\uC728\uC785\uB2C8\uB2E4.", "int"],
      ["DisableManualControlInSandbox", "server", "\uC804\uD22C \uC0CC\uB4DC\uBC15\uC2A4\uC5D0\uC11C \uC218\uB3D9 \uC870\uC791\uC744 \uCC28\uB2E8\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["InitialHuntingGroundTierIndex", "server", "\uD14C\uC2A4\uD2B8 \uD558\uB124\uC2A4\uC758 \uCD08\uAE30 \uC0AC\uB0E5\uD130 \uD2F0\uC5B4 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["RuntimeKind", "all", "\uC804\uD22C \uD558\uB124\uC2A4\uAC00 \uD65C\uC131\uD654\uB420 \uB7F0\uD0C0\uC784 \uAD6C\uBD84 \uAC12\uC785\uB2C8\uB2E4.", "string"],
    ],
    rows: [[0.1, 300, 1000, true, 1, "TEST_SANDBOX"]],
  },
  HuntingGroundTiers: {
    columns: [
      ["HuntingGroundTiersIndex", "all", "\uC0AC\uB0E5\uD130 \uD2F0\uC5B4 \uD589\uC744 \uC2DD\uBCC4\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["BaseBetRegionIndex", "all", "SlotMachine.xlsx/BaseBetRegions\uB97C \uCC38\uC870\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["TierKey", "all", "\uCF54\uB4DC\uC5D0\uC11C \uC0AC\uC6A9\uD558\uB294 \uACE0\uC815 \uC0AC\uB0E5\uD130 \uD2F0\uC5B4 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["PlayerStatsProfileIndex", "server", "PlayerStatsProfiles\uB97C \uCC38\uC870\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["SpawnGroupIndex", "server", "MonsterSpawnGroups\uB97C \uCC38\uC870\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["Enabled", "all", "\uD574\uB2F9 \uC0AC\uB0E5\uD130 \uD2F0\uC5B4\uB97C \uC0AC\uC6A9\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["Notes", "design", "\uAE30\uD68D \uCC38\uACE0 \uBA54\uBAA8\uC785\uB2C8\uB2E4.", "string"],
    ],
    rows: [[1, 1, "TIER_1_HENESYS", 1, 1, true, "Initial Tier 1 slime hunting ground"]],
  },
  PlayerStatsProfiles: {
    columns: [
      ["PlayerStatsProfilesIndex", "all", "\uD50C\uB808\uC774\uC5B4 \uC2A4\uD0EF \uD504\uB85C\uD544 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["ProfileKey", "all", "\uCF54\uB4DC\uC5D0\uC11C \uC0AC\uC6A9\uD558\uB294 \uACE0\uC815 \uD504\uB85C\uD544 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["MaxHp", "server", "\uD50C\uB808\uC774\uC5B4 \uCD5C\uB300 HP\uC785\uB2C8\uB2E4.", "int"],
      ["AttackPower", "server", "\uAE30\uBCF8 \uACF5\uACA9\uB825\uC785\uB2C8\uB2E4.", "int"],
      ["AttackIntervalSeconds", "server", "\uC790\uB3D9 \uACF5\uACA9 \uAC04\uACA9\uC785\uB2C8\uB2E4.", "float"],
      ["AttackRange", "server", "\uACF5\uACA9\uC744 \uC2DC\uC791\uD558\uB294 \uAC70\uB9AC\uC785\uB2C8\uB2E4.", "float"],
      ["MoveSpeed", "server", "\uC790\uB3D9 \uCD94\uACA9 \uC774\uB3D9 \uC18D\uB3C4\uC785\uB2C8\uB2E4.", "float"],
      ["CriticalChancePermille", "server", "\uCE58\uBA85\uD0C0 \uD655\uB960\uC744 \uCC9C\uBD84\uC728\uB85C \uC800\uC7A5\uD55C \uAC12\uC785\uB2C8\uB2E4.", "int"],
      ["CriticalDamagePermille", "server", "\uCE58\uBA85\uD0C0 \uCD5C\uC885 \uBC30\uC728\uC744 \uCC9C\uBD84\uC728\uB85C \uC800\uC7A5\uD55C \uAC12\uC785\uB2C8\uB2E4.", "int"],
      ["AggroRange", "server", "\uD0C0\uAC9F \uD0D0\uC0C9 \uBC94\uC704\uC785\uB2C8\uB2E4.", "float"],
      ["Enabled", "all", "\uD574\uB2F9 \uD504\uB85C\uD544\uC744 \uC0AC\uC6A9\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["Notes", "design", "\uAE30\uD68D \uCC38\uACE0 \uBA54\uBAA8\uC785\uB2C8\uB2E4.", "string"],
    ],
    rows: [[1, "PLAYER_TIER_1", 100, 10, 1, 1.5, 2.5, 0, 1500, 8, true, "Initial auto-battle profile"]],
  },
  MonsterDefinitions: {
    columns: [
      ["MonsterDefinitionsIndex", "all", "\uBAAC\uC2A4\uD130 \uC815\uC758 \uD589\uC744 \uC2DD\uBCC4\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["MonsterKey", "all", "\uCF54\uB4DC\uC5D0\uC11C \uC0AC\uC6A9\uD558\uB294 \uACE0\uC815 \uBAAC\uC2A4\uD130 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["ResourcePackId", "client", "MSW \uBAAC\uC2A4\uD130 \uB9AC\uC18C\uC2A4 \uD329 \uC544\uC774\uB514\uC785\uB2C8\uB2E4.", "string"],
      ["ResourceAssetGuid", "client", "\uB9AC\uC18C\uC2A4 \uD329 \uC5D0\uC14B GUID\uC785\uB2C8\uB2E4.", "string"],
      ["ModelPath", "all", "\uB7F0\uD0C0\uC784\uC5D0\uC11C \uC2A4\uD3F0\uD560 \uBAA8\uB378 \uACBD\uB85C\uC785\uB2C8\uB2E4.", "string"],
      ["StandAnimationRuid", "client", "\uAE30\uBCF8 \uB300\uAE30 \uC560\uB2C8\uBA54\uC774\uC158 RUID\uC785\uB2C8\uB2E4.", "string"],
      ["MoveAnimationRuid", "client", "\uC774\uB3D9 \uC560\uB2C8\uBA54\uC774\uC158 RUID\uC785\uB2C8\uB2E4.", "string"],
      ["HitAnimationRuid", "client", "\uD53C\uACA9 \uC560\uB2C8\uBA54\uC774\uC158 RUID\uC785\uB2C8\uB2E4.", "string"],
      ["DieAnimationRuid", "client", "\uC0AC\uB9DD \uC560\uB2C8\uBA54\uC774\uC158 RUID\uC785\uB2C8\uB2E4.", "string"],
      ["MaxHp", "server", "\uBAAC\uC2A4\uD130 \uCD5C\uB300 HP\uC785\uB2C8\uB2E4.", "int"],
      ["AttackPower", "server", "\uBAAC\uC2A4\uD130 \uAE30\uBCF8 \uACF5\uACA9\uB825\uC785\uB2C8\uB2E4.", "int"],
      ["AttackIntervalSeconds", "server", "\uBAAC\uC2A4\uD130 \uACF5\uACA9 \uAC04\uACA9\uC785\uB2C8\uB2E4.", "float"],
      ["MoveSpeed", "server", "\uBAAC\uC2A4\uD130 \uC774\uB3D9 \uC18D\uB3C4\uC785\uB2C8\uB2E4.", "float"],
      ["ChaseRange", "server", "\uD50C\uB808\uC774\uC5B4 \uCD94\uACA9 \uBC94\uC704\uC785\uB2C8\uB2E4.", "float"],
      ["AttackRange", "server", "\uBAAC\uC2A4\uD130 \uACF5\uACA9 \uBC94\uC704\uC785\uB2C8\uB2E4.", "float"],
      ["DropGroupId", "server", "Drop.xlsx/DropGroups\uB97C \uCC38\uC870\uD558\uB294 \uACE0\uC815 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["RespawnSeconds", "server", "\uC0AC\uB9DD \uD6C4 \uC7AC\uC0DD\uC131\uAE4C\uC9C0 \uB300\uAE30 \uC2DC\uAC04\uC785\uB2C8\uB2E4.", "float"],
      ["Enabled", "all", "\uD574\uB2F9 \uBAAC\uC2A4\uD130 \uC815\uC758\uB97C \uC0AC\uC6A9\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["Notes", "design", "\uAE30\uD68D \uCC38\uACE0 \uBA54\uBAA8\uC785\uB2C8\uB2E4.", "string"],
    ],
    rows: [[1, "SLIME_TIER_1", "mob/0210100.img", "7fff84d9ffda46c0a0b4f5f223a26e18", "RootDesk/MyDesk/Models/Monsters/SlimeTier1.model", "50faf654ee5d479cb2958edce9feaef0", "dc932872543f4a02bf41e977ab79e5ad", "61c27025a8f14c478f30ede1b49758bc", "31ecb6c7cbc24599881f00cb01599f09", 30, 3, 1.5, 1.2, 6, 1.1, "DROP_SLIME_TIER1", 2, true, "Classic Tier 1 Slime"]],
  },
  MonsterSpawnGroups: {
    columns: [
      ["MonsterSpawnGroupsIndex", "all", "\uBAAC\uC2A4\uD130 \uC2A4\uD3F0 \uADF8\uB8F9 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["SpawnGroupKey", "all", "\uCF54\uB4DC\uC5D0\uC11C \uC0AC\uC6A9\uD558\uB294 \uACE0\uC815 \uC2A4\uD3F0 \uADF8\uB8F9 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["MonsterDefinitionIndex", "server", "MonsterDefinitions\uB97C \uCC38\uC870\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["SpawnCount", "server", "\uB9F5\uC5D0 \uC720\uC9C0\uD560 \uBAAC\uC2A4\uD130 \uC218\uC785\uB2C8\uB2E4.", "int"],
      ["SpawnAnchorKey", "all", "\uBAAC\uC2A4\uD130 \uC2A4\uD3F0 \uB9F5 \uC575\uCEE4 \uACBD\uB85C\uC785\uB2C8\uB2E4.", "string"],
      ["BoundsLeftAnchorKey", "all", "\uC804\uD22C \uBC94\uC704 \uC67C\uCABD \uC575\uCEE4 \uACBD\uB85C\uC785\uB2C8\uB2E4.", "string"],
      ["BoundsRightAnchorKey", "all", "\uC804\uD22C \uBC94\uC704 \uC624\uB978\uCABD \uC575\uCEE4 \uACBD\uB85C\uC785\uB2C8\uB2E4.", "string"],
      ["SpawnYOffset", "server", "\uBC1C\uD310 \uC704\uC5D0\uC11C \uC2A4\uD3F0\uD560 Y \uC624\uD504\uC14B\uC785\uB2C8\uB2E4.", "float"],
      ["Enabled", "all", "\uD574\uB2F9 \uC2A4\uD3F0 \uADF8\uB8F9\uC744 \uC0AC\uC6A9\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["Notes", "design", "\uAE30\uD68D \uCC38\uACE0 \uBA54\uBAA8\uC785\uB2C8\uB2E4.", "string"],
    ],
    rows: [[1, "SPAWN_SLIME_TIER_1", 1, 1, "CombatHarness/MonsterSpawn/Tier1", "CombatHarness/CombatBoundsLeft", "CombatHarness/CombatBoundsRight", 0.4, true, "Single Slime foundation group"]],
  },
};

export const dropSheets = {
  DropGroups: {
    columns: [
      ["DropGroupsIndex", "all", "\uB4DC\uB78D \uADF8\uB8F9 \uD589\uC744 \uC2DD\uBCC4\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["DropGroupId", "server", "\uBAAC\uC2A4\uD130\uAC00 \uCC38\uC870\uD558\uB294 \uACE0\uC815 \uB4DC\uB78D \uADF8\uB8F9 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["RollMode", "server", "\uB4DC\uB78D \uD56D\uBAA9 \uCD94\uCCA8 \uBC29\uC2DD\uC785\uB2C8\uB2E4.", "string"],
      ["RollCount", "server", "\uADF8\uB8F9 \uD574\uACB0 \uC2DC \uC218\uD589\uD560 \uCD94\uCCA8 \uD69F\uC218\uC785\uB2C8\uB2E4.", "int"],
      ["EmptyResultAllowed", "server", "\uC544\uBB34 \uBCF4\uC0C1\uB3C4 \uB098\uC624\uC9C0 \uC54A\uB294 \uACB0\uACFC\uB97C \uD5C8\uC6A9\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["Enabled", "all", "\uD574\uB2F9 \uB4DC\uB78D \uADF8\uB8F9\uC744 \uC0AC\uC6A9\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["Notes", "design", "\uAE30\uD68D \uCC38\uACE0 \uBA54\uBAA8\uC785\uB2C8\uB2E4.", "string"],
    ],
    rows: [[1, "DROP_SLIME_TIER1", "INDEPENDENT", 1, true, true, "Tier 1 Slime reward group"]],
  },
  DropEntries: {
    columns: [
      ["DropEntriesIndex", "all", "\uB4DC\uB78D \uD56D\uBAA9 \uD589\uC744 \uC2DD\uBCC4\uD558\uB294 \uC778\uB371\uC2A4\uC785\uB2C8\uB2E4.", "int"],
      ["DropGroupId", "server", "DropGroups.DropGroupId\uB97C \uCC38\uC870\uD558\uB294 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["RewardType", "server", "CURRENCY \uB610\uB294 \uD5A5\uD6C4 ITEM\uC744 \uAD6C\uBD84\uD558\uB294 \uBCF4\uC0C1 \uD0C0\uC785\uC785\uB2C8\uB2E4.", "string"],
      ["RewardKey", "server", "\uC7AC\uD654 \uB610\uB294 \uC544\uC774\uD15C \uCE74\uD0C8\uB85C\uADF8\uC758 \uACE0\uC815 \uD0A4\uC785\uB2C8\uB2E4.", "string"],
      ["MinQuantity", "server", "\uC131\uACF5 \uC2DC \uC9C0\uAE09\uD560 \uCD5C\uC18C \uC218\uB7C9\uC785\uB2C8\uB2E4.", "int"],
      ["MaxQuantity", "server", "\uC131\uACF5 \uC2DC \uC9C0\uAE09\uD560 \uCD5C\uB300 \uC218\uB7C9\uC785\uB2C8\uB2E4.", "int"],
      ["ChancePermille", "server", "\uD56D\uBAA9 \uB4DC\uB78D \uD655\uB960\uC744 \uCC9C\uBD84\uC728\uB85C \uC800\uC7A5\uD55C \uAC12\uC785\uB2C8\uB2E4.", "int"],
      ["RollWeight", "server", "\uAC00\uC911\uCE58 \uCD94\uCCA8 \uBAA8\uB4DC\uC5D0\uC11C \uC0AC\uC6A9\uD560 \uAC00\uC911\uCE58\uC785\uB2C8\uB2E4.", "int"],
      ["Enabled", "all", "\uD574\uB2F9 \uB4DC\uB78D \uD56D\uBAA9\uC744 \uC0AC\uC6A9\uD560\uC9C0 \uC5EC\uBD80\uC785\uB2C8\uB2E4.", "bool"],
      ["Notes", "design", "\uAE30\uD68D \uCC38\uACE0 \uBA54\uBAA8\uC785\uB2C8\uB2E4.", "string"],
    ],
    rows: [[1, "DROP_SLIME_TIER1", "CURRENCY", "COMMON_COIN", 1, 3, 1000, 1, true, "Variable Common Coin drop"]],
  },
};

export function columnNames(sheetSchema) {
  return sheetSchema.columns.map(([name]) => name);
}
