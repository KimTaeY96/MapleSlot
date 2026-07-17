# Combat Auto-Battle Contract

## Authority

All target selection, lane filtering, movement intent, attack cadence, damage acceptance, death transitions, respawn timing, and reward rolls are server-authoritative. Clients render replicated state and animation only.

## Lane Contract

- Initial players and monsters are assigned to `CENTER`.
- Basic attacks and low-tier skills can acquire and damage only the profile's `BasicAttackLaneKey`.
- Monster chase and attack require the player's combat lane to match the monster's `LaneKey`.
- Future area skills provide an explicit list of target lanes to `CombatRuntime:FindMonstersInLanes`.
- Vertical lane spacing and attack hitbox heights are table data, not code constants.

## State Model

| State | Entry | Behavior | Exit |
|---|---|---|---|
| `ACQUIRE` | No valid target | Select nearest live monster inside aggro range on the allowed lane. | Target found -> `CHASE`; none -> remain. |
| `CHASE` | Target outside attack range | Move toward target while respecting combat bounds and foothold edges. | In range -> `ATTACK`; invalid target -> `ACQUIRE`. |
| `ATTACK` | Target inside range | Stop movement and attack at the profile interval. | Target dies/invalid -> `ACQUIRE`; target leaves range -> `CHASE`. |
| `DEAD_WAIT` | Player HP reaches zero | Disable targeting, movement, attacks, and reward production. | Penalty timer completes -> `REVIVE`. |
| `REVIVE` | Death timer completes | Restore configured HP, reset transient target state. | Immediately -> `ACQUIRE`. |

Monster controllers use their own small state machine and never coexist with `AIChaseComponent` or `AIWanderComponent`.

## Damage Contract

- Attack cadence and attack power come from `Combat.xlsx` profiles/definitions.
- Hit delivery uses native `AttackComponent` and `HitComponent` collision groups.
- Damage and death are accepted only on the server.
- A death is idempotent. Repeated hit/death events must not produce additional drops.
- Movement and attack visual timing may lag the authoritative outcome slightly, but may not change it.

## Drop Contract

1. A monster death supplies its `MonsterDefinitionIndex` and `DropGroupId`.
2. The drop resolver loads the enabled group from `Drop.xlsx/DropGroups`.
3. The resolver evaluates enabled `DropEntries` for that group.
4. Quantity is rolled inclusively from `MinQuantity` through `MaxQuantity`.
5. Successful results become typed reward grants such as `CURRENCY:COMMON_COIN`.
6. `CombatWalletBridge` drains each server currency entry once, validates its key, and replicates the cumulative earned Common Coin count; future item entries remain queued for the inventory boundary.
7. The client applies only the new replicated delta to the existing slot wallet, so slot winnings and combat drops do not overwrite each other.

Initial `INDEPENDENT` mode rolls every enabled entry once. The schema reserves `WEIGHTED_ONE` for future groups but the runtime must reject unsupported modes explicitly until implemented.

## Base Bet Link

Base Bet does not directly mutate combat stats. Its index selects one `HuntingGroundTiers` row, which then selects the player profile and monster spawn group. This keeps slot economy values separate from combat balance.

## Client Input And Camera

- `PlayerControllerComponent.UseCustomScript` is read-only at runtime and must never be assigned.
- The sandbox disables manual movement and attack by removing documented action bindings, then restores the default bindings when the combat component ends.
- The combat camera is attached to `CombatCameraAnchorKey`, positioned at the common center of the three foothold rows. It does not follow player movement.
- The fixed camera uses the `CombatConfig` screen offsets and disables foothold-area confinement by default. This keeps the three lanes in the screen-right composition regardless of tile world position.
- The previously active camera is restored when the combat component ends.

## Failure Policy

- Missing table, duplicate key, dangling reference, invalid numeric range, or unsupported enum: fail validation before runtime generation.
- Missing runtime model/script attachment: stop the harness and log one actionable error.
- Missing drop group during play: grant nothing; never substitute a hardcoded fallback reward.
- Missing foothold: placement tool exits without writing the map.
- Missing or misaligned three-lane foothold set: Henesys placement exits without writing the map.
