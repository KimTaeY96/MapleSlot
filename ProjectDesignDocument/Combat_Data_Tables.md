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
| `CombatCameraScreenOffsetX` | Horizontal viewport ratio for the fixed camera anchor. Initial value: `0.75`. |
| `CombatCameraScreenOffsetY` | Vertical viewport ratio for the fixed camera anchor. Initial value: `0.655`. |
| `CombatCameraConfineArea` | Whether foothold bounds may recenter the combat camera. Initial value: `false`. |
| `CombatCameraAnchorKey` | Fixed camera entity path generated at the common lane center. Initial value: `CombatHarness/CameraAnchor`. |

### HuntingGroundTiers

Maps one `BaseBetRegionIndex` to one player profile and a primary spawn group. Every enabled spawn group with the same `HuntingGroundTierIndex` belongs to that tier.

### PlayerStatsProfiles

Defines player HP, attack power, cadence, attack range, move speed, critical values, map-wide aggro range, starting `BasicAttackLaneKey`, hitbox height, and ladder approach/exit tolerances. It contains balance only, not player appearance.

### CombatLanes

Defines the `UPPER`, `CENTER`, and `LOWER` rows for each hunting-ground tier. The table owns expected Y offsets, minimum common width, map anchors, basic-attack eligibility, and initial-spawn eligibility. Initial Henesys enables all three physical lanes.

### CombatLadders

Defines the Maker-authored `ClimbableComponent` entity path and the adjacent lower/upper lanes it connects. Initial Henesys uses `ladder-3` for `LOWER <-> CENTER` and `ladder-3_1` for `CENTER <-> UPPER`.

### MonsterDefinitions

Defines monster resource/model identity, stats, passive/aggressive behavior, autonomous idle/wander durations, optional `ACTIVE` attack behavior, contact move-through time, respawn behavior, and `DropGroupId`. Contact damage is common to every definition; `AttackMode=ACTIVE` adds a separate attack action and requires `AttackAnimationRuid`.

### MonsterSpawnGroups

Defines which monster appears, how many instances are maintained, its tier and `LaneKey`, and which map anchor/bounds are used.

## Drop.xlsx

### DropGroups

Defines roll behavior for a reusable drop group.

### DropEntries

Defines typed rewards. `RewardType=CURRENCY` uses a currency enum key such as `COMMON_COIN`. `RewardType=ITEM` is accepted as a typed grant so future item rows do not require a drop-system rewrite; item-key existence validation is added when the item catalog is introduced.

## Cross-Workbook Rules

- Every enabled `HuntingGroundTiers.PlayerStatsProfileIndex` exists.
- Every enabled `HuntingGroundTiers.SpawnGroupIndex` exists.
- Every enabled tier has exactly `UPPER`, `CENTER`, and `LOWER` lanes in that order.
- All three lanes allow physical same-lane basic attacks and initial monster spawning.
- Every tier defines exactly two adjacent ladder routes and exactly one enabled spawn group per lane.
- Player and monster hitbox heights remain smaller than `MinimumLaneSpacing`.
- Spawn-group lane and anchor keys match the corresponding `CombatLanes` row.
- Every enabled `MonsterSpawnGroups.MonsterDefinitionIndex` exists.
- Every enabled `MonsterDefinitions.DropGroupId` exists in `DropGroups`.
- Every enabled `DropEntries.DropGroupId` exists in `DropGroups`.
- `MinQuantity <= MaxQuantity`, quantities are non-negative integers, and `ChancePermille` is within `0..1000`.
- Initial content has no `ITEM` entry, while the resolver and simulator already preserve typed future item grants.
- IDs are stable. Existing rows are preserved by builders unless a structural migration is explicitly requested.

## Initial Content

- Tier 1 links Base Bet region `1` to the Tier 1 player profile and one Slime spawn group on each `map01` lane.
- Center/lower Tier 1 Slimes are passive contact-only monsters. The upper-lane test Slime is aggressive, keeps the same contact damage, and additionally uses the resource pack's active attack animation.
- All Tier 1 Slimes move through contact for `0.5` seconds and respawn after `5` seconds; if the whole map has no live target, all three lane populations are restored immediately.
- Slime uses the classic `mob/0210100.img` resource pack and references `DROP_SLIME_TIER1`.
- `DROP_SLIME_TIER1` independently grants `1..3` Common Coins at `1000` permille.
