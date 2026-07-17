# Henesys Three-Lane Combat Map

## Scope

`map/map01.map` is the first playable Henesys combat map. It remains a real `TileMapMode=0` MapleTile map and uses Maker-authored tiles plus footholds, not a UI battle viewport.

The active combat area is framed inside the right half of the screen. The slot UI may continue to occupy the left 40%, but combat-critical actors and effects must remain between `CombatAreaMinimumWorldX=0.0` and `CombatAreaMaximumWorldX=8.0`.

World X placement and viewport composition are separate concerns. During combat, a fixed `CombatHarness/CameraAnchor` at the common lane center is displayed at `CombatCameraScreenOffsetX=0.75`, while `CombatCameraConfineArea=false` prevents a small foothold set from being recentered automatically.

## Lane Layout

| Lane | `LaneKey` | Expected Y offset | Initial basic attack | Initial monster spawn |
|---|---|---:|---:|---:|
| Upper | `UPPER` | `+2.1` | Yes, while standing here | Yes |
| Center | `CENTER` | `0.0` | Yes | Yes |
| Lower | `LOWER` | `-2.1` | Yes, while standing here | Yes |

- All three rows are horizontal Layer 1 MapleTile footholds.
- Each row has at least `4.5` common world units of walkable width inside the left/right blocking walls.
- Adjacent rows keep at least `1.8` world units of vertical separation.
- The three rows share a common X span so future multi-lane skills can resolve one horizontal cast range across them.
- Initial content places the player on `CENTER` and maintains one Tier 1 Slime on each lane.
- `ladder-3` connects `LOWER` to `CENTER`; `ladder-3_1` connects `CENTER` to `UPPER`. Both remain Maker-authored entities with `ClimbableComponent`.

## Maker Terrain Pass

Tile painting and foothold creation are Maker operations. For the initial layout:

1. Open `map01` and select `Layer1`.
2. Assign a Henesys-compatible MapleTile tileset to the existing `TileMap` entity.
3. Paint three straight rows with the same X span. The initial Maker layout uses approximately `x=0.05..5.35`.
4. Place the rows at `y=+2.1`, `0.0`, and `-2.1` within `LaneMatchTolerance=0.35`.
5. Keep each row continuous and avoid slopes in the initial pass.
6. Save the map, then run `node tools/create_henesys_combat_harness.mjs --apply`.

The placement tool refuses to write when three valid foothold rows are not present. It never creates or edits tile arrays or foothold chains.

## Runtime Contract

- Every monster exposes `CombatMonsterHealth.LaneKey`.
- `CombatSandboxRuntime` maintains all tier-owned `MonsterSpawnGroups.SpawnCount` values with real `SpawnByModelId` instances at each lane's `SpawnAnchorKey`.
- A dead monster remains enabled as a server entity, leaves target selection through `IsDead`, hides after its death clip, and respawns after `MonsterDefinitions.RespawnSeconds`.
- `CombatPlayerAutoBattle.CombatLaneKey` starts from `PlayerStatsProfiles.BasicAttackLaneKey` and changes only after native ladder navigation reaches an adjacent lane.
- Basic attack target selection and hit acceptance require matching lane keys.
- Basic attacks and low-tier skills remain single-lane attacks, but follow the player's physical floor.
- Future area skills call `CombatRuntime:FindMonstersInLanes` with an explicit lane list. A three-floor skill passes `{"UPPER", "CENTER", "LOWER"}`.
- A monster does not chase or attack a player assigned to another lane. Passive monsters wander inside their spawn bounds until damaged; contact damage still applies when a player touches them.

## Map Hierarchy

```text
map01
  ladder-3 (LOWER <-> CENTER)
  ladder-3_1 (CENTER <-> UPPER)
  CombatHarness
    SpawnLocation
    Runtime
    CameraAnchor
    Lanes
      UPPER
        Spawn
        BoundsLeft
        BoundsRight
      CENTER
        Spawn
        BoundsLeft
        BoundsRight
      LOWER
        Spawn
        BoundsLeft
        BoundsRight
    Monsters (legacy placed instances are removed at runtime)
```

Runtime-spawned monsters are direct dynamic children of the map because `SpawnByModelId` requires the map entity as its parent.

## Acceptance

- `map01` remains `TileMapMode=0`.
- Three visible, uncut, horizontal tile rows exist in the right-side combat composition.
- `CameraAnchor` remains at the common center of all three rows and owns the active combat `CameraComponent`.
- Player movement does not pan the combat field or push a lane beyond the right edge.
- Player and all three Slimes stand on their assigned footholds without falling.
- When the current floor is empty, the player reaches the next target through the correct native ladder and attacks only after `CombatLaneKey` matches.
- Slimes idle and wander inside lane bounds, aggro after being attacked, deal contact damage, and continue moving for `0.5` seconds after contact.
- Every lane's Slime death resolves `DROP_SLIME_TIER1` and respawns on the same lane after `5` seconds.
- The runtime population returns to `MonsterSpawnGroups.SpawnCount` if a spawned entity is unexpectedly destroyed.
- Build and runtime logs contain no errors and include the Henesys runtime and lane registration evidence logs.
