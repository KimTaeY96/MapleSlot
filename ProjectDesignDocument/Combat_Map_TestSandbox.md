# Combat Map Test Sandbox Spec

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
