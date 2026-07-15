# Henesys Three-Lane Combat Map

## Scope

`map/map01.map` is the first playable Henesys combat map. It remains a real `TileMapMode=0` MapleTile map and uses Maker-authored tiles plus footholds, not a UI battle viewport.

The active combat area is framed inside the right half of the screen. The slot UI may continue to occupy the left 40%, but combat-critical actors and effects must remain between `CombatAreaMinimumWorldX=0.0` and `CombatAreaMaximumWorldX=8.0`.

## Lane Layout

| Lane | `LaneKey` | Expected Y offset | Initial basic attack | Initial monster spawn |
|---|---|---:|---:|---:|
| Upper | `UPPER` | `+2.1` | No | No |
| Center | `CENTER` | `0.0` | Yes | Yes |
| Lower | `LOWER` | `-2.1` | No | No |

- All three rows are horizontal Layer 1 MapleTile footholds.
- Each row has at least `6.0` common world units of walkable width.
- Adjacent rows keep at least `1.8` world units of vertical separation.
- The three rows share a common X span so future multi-lane skills can resolve one horizontal cast range across them.
- Initial content places the player and Tier 1 Slime on `CENTER` only.

## Maker Terrain Pass

Tile painting and foothold creation are Maker operations. For the initial layout:

1. Open `map01` and select `Layer1`.
2. Assign a Henesys-compatible MapleTile tileset to the existing `TileMap` entity.
3. Paint three straight rows with the same X span, targeting `x=0.3..7.3`.
4. Place the rows at `y=+2.1`, `0.0`, and `-2.1` within `LaneMatchTolerance=0.35`.
5. Keep each row continuous and avoid slopes in the initial pass.
6. Save the map, then run `node tools/create_henesys_combat_harness.mjs --apply`.

The placement tool refuses to write when three valid foothold rows are not present. It never creates or edits tile arrays or foothold chains.

## Runtime Contract

- Every monster exposes `CombatMonsterHealth.LaneKey`.
- `CombatPlayerAutoBattle.CombatLaneKey` comes from `PlayerStatsProfiles.BasicAttackLaneKey`.
- Basic attack target selection and hit acceptance require matching lane keys.
- Initial profile data fixes basic attacks and low-tier skills to `CENTER`.
- Future area skills call `CombatRuntime:FindMonstersInLanes` with an explicit lane list. A three-floor skill passes `{"UPPER", "CENTER", "LOWER"}`.
- A monster does not chase or attack a player assigned to another lane.

## Map Hierarchy

```text
map01
  CombatHarness
    PlayerSpawn
    Runtime
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
    Monsters
      SlimeTier1
```

## Acceptance

- `map01` remains `TileMapMode=0`.
- Three visible, uncut, horizontal tile rows exist in the right-side combat composition.
- Player and Slime stand on the center foothold without falling.
- Basic attacks cannot acquire or damage monsters whose `LaneKey` is `UPPER` or `LOWER`.
- Center-lane Slime death resolves `DROP_SLIME_TIER1` and respawns on the same lane.
- Build and runtime logs contain no errors and include the Henesys runtime and lane registration evidence logs.
