# Combat Map Test Sandbox Spec

> Historical foundation harness. Production integration now targets the three-lane Henesys layout in `Combat_Henesys_ThreeLane_Map.md`; the Test Sandbox remains an isolated regression fixture only.

> Active sprint: Combat Foundation. This file defines the real-map verification harness and supersedes earlier placeholder-only interpretation.

## Purpose
Define the Phase 1 map-side combat harness for **RPG Slot Machine**. This document is the handoff for the **아트 디렉터 / Level-asset lane** and later 테크 디렉터 integration.

The battle side of the game must be a real MapleStory Worlds map/prefab flow, not a UI viewport mock.

## Feature Scope
- In: Test_Sandbox map area, tilemap/foothold plan, player prefab placement, monster spawn placement, basic combat harness expectations, Base Bet tier map/monster relation placeholders.
- Out: Slot machine UI, currency HUD, HP UI styling, production combat balance, final monster AI, persistence, shop, payment integration.

## Phase 1 Principle
The right-side combat area must show actual MSW world entities:
- A player/character prefab or placeholder entity placed on the map.
- Monster prefab/entity placement or spawn points in the map.
- Map footholds/tile collision suitable for normal MSW side-view combat flow.
- No user control requirement for combat. The intended flow is idle/auto battle.

## UI Boundary
| Needed Element | Where It Belongs |
|---|---|
| Player/monster visuals | Map or prefab entities |
| Monster spawn positions | Map entities/spawn markers |
| Collision/footholds/tilemap | Map/tilemap setup |
| HP bar, death timer, hunting tier text | UI overlay in `UI_Canvas_Layout.md` |
| Slot machine | UI overlay in `UI_Canvas_Layout.md` |

## Test_Sandbox Map Requirements
| Item | Requirement |
|---|---|
| Map target | Use an isolated `Test_Sandbox` map/harness before main scene integration. |
| Player placement | Place a player/character placeholder where the combat loop will operate. |
| Monster placement | Place at least one monster placeholder or spawn marker per active test tier. |
| Footholds/tilemap | Provide valid ground/footholds so character and monsters can use normal MSW movement/combat assumptions. |
| Camera framing | Frame the right 60% battle area so it remains visible beside the left slot UI panel. |
| Base Bet tier placeholder | Document where tier-specific monster/map variants will be swapped later. |

## Phase 1 Placeholder Entities
| Entity | Purpose | Notes |
|---|---|---|
| `MapAnchor_PlayerCombat` | Player combat starting location | Real map entity/marker, not UI. |
| `MapAnchor_MonsterSpawn_Tier1` | Tier 1 monster spawn point | Real map entity/marker, not UI. |
| `CombatBounds_TestSandbox` | Practical area for idle combat | Can be represented by markers/footholds depending on builder support. |
| `TierMapLabel_TestSandbox` | Editor-only marker for current tier area | Optional; do not expose as UI unless later needed. |

## Combat Flow Expectation
1. Player entity is placed in the map harness.
2. Monster entity or spawn marker exists in the same combat area.
3. Later 테크 디렉터 logic will drive idle combat without player input.
4. On player HP reaching 0, combat logic pauses farming for 300 seconds.
5. UI only reflects the combat state through HP/death/tier fields; UI does not simulate combat.

## Acceptance Criteria
- No battle scene is represented as a `.ui` viewport.
- Player and monster placeholders are planned as actual map/prefab entities.
- Map/tile/foothold requirements are explicit enough for implementation.
- UI workstream can proceed independently using only status values from combat later.
- Main scene integration remains blocked until the Test_Sandbox map harness is verified.

## Approved Runtime Contract

### Player

- Use the MSW `DefaultPlayer` appearance and retain its player, state, movement, body, avatar, and camera dependencies.
- Disable manual movement and attack input only while the player is inside `Test_Sandbox`.
- Do not edit `Global/DefaultPlayer.model` to disable controls for every map.
- Auto battle selects the closest valid monster, moves into range, and attacks on the server.
- At zero HP, stop targeting, movement, attacks, and farming for `PlayerDeathPenaltySeconds` from `Combat.xlsx/CombatConfig`.
- Revive at `PlayerReviveHpPermille` HP and resume auto battle.

### Monster

- Tier 1 uses the classic Slime resource pack `mob/0210100.img`.
- Each monster instance resolves combat stats and `DropGroupId` through `Monster.xlsx/MonsterDefinitions`.
- Monster hit detection uses the native `AttackComponent -> HitComponent -> DeadEvent` path wherever the runtime supports it.
- MapleTile monsters require `RigidbodyComponent`, a valid foothold below their spawn position, and exactly one movement owner.
- The initial controller is custom and data-driven; do not attach `AIChaseComponent` or `AIWanderComponent` beside it because those components overwrite body velocity every frame.

### Rewards

- Combat code never embeds a fixed reward amount.
- On a valid server-side monster death, resolve the monster's `DropGroupId` in `Drop.xlsx`.
- Roll enabled entries according to the group's roll mode, then emit reward grants to the shared economy boundary.
- Initial content grants a variable Common Coin amount. `ITEM` is a supported reward type but is not populated until an item catalog exists.

## Data Links

```text
BaseBetRegionsIndex
  -> HuntingGroundTiers.BaseBetRegionIndex
  -> HuntingGroundTiers.PlayerStatsProfileIndex
  -> HuntingGroundTiers.SpawnGroupIndex
  -> MonsterSpawnGroups.MonsterDefinitionIndex
  -> MonsterDefinitions.DropGroupId
  -> DropGroups.DropGroupId
  -> DropEntries.DropGroupId
```

## Test Sandbox Preflight

The placement builder must stop without writing when any item below fails:

1. The target is an isolated combat sandbox map, not the production map.
2. `MapComponent.TileMapMode` is `0` (`MapleTile`).
3. At least one valid foothold exists.
4. Player and monster spawn Y positions are above that foothold.
5. Required custom script codeblocks are registered after Maker Refresh.
6. The Slime model exists and passes `ModelBuilder.validate()`.

Tile painting and foothold creation remain Maker actions. The builder may inspect them, place models, and patch components, but it must never synthesize or rewrite tile/foothold arrays.

## Initial Harness Layout

| Path | Type | Purpose |
|---|---|---|
| `CombatHarness/PlayerSpawn` | Marker | DefaultPlayer-derived combat spawn. |
| `CombatHarness/MonsterSpawn/Tier1` | Marker | Tier 1 Slime spawn origin. |
| `CombatHarness/CombatBoundsLeft` | Marker | Left patrol/targeting bound. |
| `CombatHarness/CombatBoundsRight` | Marker | Right patrol/targeting bound. |
| `CombatHarness/Runtime` | Entity | Server combat coordinator and table-backed configuration. |

## Verification Matrix

| Scenario | Expected Result |
|---|---|
| Manual input during combat | Player remains under auto-battle control. |
| Monster enters attack range | Player attacks through the native hit pipeline. |
| Monster HP reaches zero | Death animation/event runs once and one drop group is resolved. |
| Player HP reaches zero | Farming pauses for the configured 300 seconds. |
| Revive timer completes | Player returns at configured HP and auto battle resumes. |
| Base Bet tier changes | Combat tier switches only through the data link contract. |
| Missing drop group | Validator fails; runtime grants nothing and logs one actionable error. |
