# Combat Data Table Contract

## Combat.xlsx

### CombatConfig

Horizontal configuration used by the server runtime.

| Column | Purpose |
|---|---|
| `ServerTickSeconds` | Combat decision cadence. |
| `PlayerDeathPenaltySeconds` | Farming pause after player death. Initial value: `300`. |
| `PlayerReviveHpPermille` | Revive HP ratio. Initial value: `1000`. |
| `DisableManualControlInSandbox` | Test Sandbox control gate. |
| `InitialHuntingGroundTierIndex` | Initial tier for the harness. |
| `RuntimeKind` | Production combat runtime selector. Henesys uses `HENESYS_TILE_LANES`. |
| `HenesysMapKey` | Production Henesys map key. Initial value: `map01`. |
| `LaneMatchTolerance` | Allowed Y difference between Maker footholds and lane offsets. |
| `MinimumLaneSpacing` | Minimum vertical separation between adjacent lanes. |
| `PlayerSpawnNormalizedX` | Player spawn position within the common lane span. |
| `MonsterSpawnNormalizedX` | Initial monster spawn position within the common lane span. |
| `CombatBoundsInset` | Horizontal inset applied to lane combat bounds. |
| `PlayerSpawnYOffset` | Player height above the center foothold. |
| `CombatAreaMinimumWorldX` | Minimum world X for the screen-right combat area. Initial value: `0`. |
| `CombatAreaMaximumWorldX` | Maximum world X for the screen-right combat area. Initial value: `8`. |

### HuntingGroundTiers

Maps one `BaseBetRegionIndex` to one player profile and one monster spawn group. The index is the combat tier key.

### PlayerStatsProfiles

Defines player HP, attack power, cadence, attack range, move speed, critical values, aggro range, `BasicAttackLaneKey`, and table-backed hitbox height. It contains balance only, not player appearance.

### CombatLanes

Defines the `UPPER`, `CENTER`, and `LOWER` rows for each hunting-ground tier. The table owns expected Y offsets, minimum common width, map anchors, basic-attack eligibility, and initial-spawn eligibility. The initial Henesys contract enables targeting and spawning on `CENTER` only.

### MonsterDefinitions

Defines monster resource/model identity, stats, table-backed attack hitbox height, respawn behavior, and `DropGroupId`. The drop group is a string cross-workbook key intentionally independent from row order.

### MonsterSpawnGroups

Defines which monster appears, how many instances are maintained, its `LaneKey`, and which map anchor/bounds are used.

## Drop.xlsx

### DropGroups

Defines roll behavior for a reusable drop group.

### DropEntries

Defines typed rewards. `RewardType=CURRENCY` uses a currency enum key such as `COMMON_COIN`. `RewardType=ITEM` is accepted as a typed grant so future item rows do not require a drop-system rewrite; item-key existence validation is added when the item catalog is introduced.

## Cross-Workbook Rules

- Every enabled `HuntingGroundTiers.PlayerStatsProfileIndex` exists.
- Every enabled `HuntingGroundTiers.SpawnGroupIndex` exists.
- Every enabled tier has exactly `UPPER`, `CENTER`, and `LOWER` lanes in that order.
- Exactly one initial basic-attack lane and one initial spawn lane exist; both are `CENTER`.
- Player and monster hitbox heights remain smaller than `MinimumLaneSpacing`.
- Spawn-group lane and anchor keys match the tier's initial `CombatLanes` row.
- Every enabled `MonsterSpawnGroups.MonsterDefinitionIndex` exists.
- Every enabled `MonsterDefinitions.DropGroupId` exists in `DropGroups`.
- Every enabled `DropEntries.DropGroupId` exists in `DropGroups`.
- `MinQuantity <= MaxQuantity`, quantities are non-negative integers, and `ChancePermille` is within `0..1000`.
- Initial content has no `ITEM` entry, while the resolver and simulator already preserve typed future item grants.
- IDs are stable. Existing rows are preserved by builders unless a structural migration is explicitly requested.

## Initial Content

- Tier 1 links Base Bet region `1` to the Tier 1 player profile and a single center-lane Slime spawn group in `map01`.
- Slime uses the classic `mob/0210100.img` resource pack and references `DROP_SLIME_TIER1`.
- `DROP_SLIME_TIER1` independently grants `1..3` Common Coins at `1000` permille.
