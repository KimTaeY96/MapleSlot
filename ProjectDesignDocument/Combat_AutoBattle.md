# Combat Auto-Battle Contract

## Authority

All target selection, lane filtering, movement intent, attack cadence, damage acceptance, death transitions, respawn timing, and reward rolls are server-authoritative. Clients render replicated state and animation only.

## Lane Contract

- Players start on `PlayerStatsProfiles.BasicAttackLaneKey`; initial monsters are maintained on all three lanes.
- Basic attacks damage only the player's current physical `CombatLaneKey`. The player may change that key only after completing a table-backed ladder route.
- Monster chase and attack require the player's combat lane to match the monster's `LaneKey`.
- Target acquisition covers the entire map. A valid target is retained until death unless a monster damages the player; that attacker becomes the highest-priority retaliation target.
- If the target is on another lane, the player walks to the adjacent `CombatLadders.LadderKey`. Once mounted, that adjacent route remains locked until the player reaches its destination floor, even if target acquisition changes during travel.
- Ladder entry invokes the native climb action once at the player's current world Y. The client then moves vertically at `PlayerStatsProfiles.LadderClimbSpeed`, clamps to the destination lane's `BoundsLeftAnchorKey` platform height, stops, and enters `IDLE` before the next chase decision.
- `SpawnAnchorKey` is elevated for monster spawning and must not be used as the floor height. `CombatLaneKey` changes only after replicated player Y reaches the exact destination platform height.
- If no live monster exists, the runtime immediately restores every configured lane population and retries acquisition in the same decision tick.
- Future area skills provide an explicit list of target lanes to `CombatRuntime:FindMonstersInLanes`.
- Vertical lane spacing and attack hitbox heights are table data, not code constants.

## State Model

| State | Entry | Behavior | Exit |
|---|---|---|---|
| `ACQUIRE` | No valid target | Retaliate against the last valid damage source, otherwise select the nearest live monster across the whole map; restore all lane populations if none exist. | Same lane -> `CHASE`; other lane -> `APPROACH_LADDER`. |
| `APPROACH_LADDER` | Target is on another floor | Move horizontally to the table-backed adjacent ladder. | Within approach tolerance -> `CLIMB_LADDER`. |
| `CLIMB_LADDER` | Player is aligned with the ladder | Enter the native climb animation once at the current Y, lock the route, and move vertically by the table-backed climb speed without remounting. | Clamp to destination platform Y, stop, and enter `IDLE` -> `LADDER_EXIT`. |
| `LADDER_EXIT` | Adjacent lane reached | Update `CombatLaneKey` after the client has reached a valid standing height. | Next decision -> `CHASE` or the next ladder route. |
| `CHASE` | Target outside attack range | Move toward target while respecting combat bounds and foothold edges. | In range -> `ATTACK_READY`; invalid target -> `ACQUIRE`. |
| `ATTACK_READY` | Target inside range while attack cooldown remains | Stop movement without entering the attack animation state. | Cooldown ready -> `ATTACK`; target leaves range -> `CHASE`. |
| `ATTACK` | Attack cooldown is ready | Lock movement and targeting, play the attack animation, and resolve damage at `AttackHitDelaySeconds`. | `AttackAnimationDurationSeconds` completes -> queued `HIT` or `ACQUIRE`. |
| `HIT` | Damage lands while no action is active, or a hit reaction was queued during `ATTACK` | Lock movement and play the native hit reaction. Repeated hits restart the hit timer. | `HitAnimationDurationSeconds` completes -> `ACQUIRE`. |
| `DEAD_WAIT` | Player HP reaches zero | Disable targeting, movement, attacks, and reward production. | Penalty timer completes -> `REVIVE`. |
| `REVIVE` | Death timer completes | Restore configured HP, reset transient target state. | Immediately -> `ACQUIRE`. |

Monster controllers use `IDLE`, `WANDER`, `CHASE`, `ATTACK`, `HIT`, and `CONTACT_MOVE` states and never coexist with `AIChaseComponent` or `AIWanderComponent`. `ATTACK` and `HIT` are exclusive action phases: movement, contact damage, and another state transition remain blocked until their configured animation duration completes. Passive monsters alternate table-timed idle and wander periods, aggro only after being damaged, and return to autonomy after losing the player. Aggressive definitions may acquire a same-lane player first.

## Damage Contract

- Attack power comes from the owning player or monster profile. Cooldown, cast extents, damage coefficient, hit origin, and hit shape come from the referenced `Skill.xlsx/SkillInfo` row.
- A skill locks its facing direction toward the selected target when the action begins. `RECTANGLE` hit areas start at `SELF` or `TARGET` and extend only along that locked facing direction; `CIRCLE` hit areas remain centered on the selected origin.
- Attack start, impact, and completion are separate server phases. Damage is applied at `AttackHitDelaySeconds`, never on the same tick that the attack animation starts.
- `AttackAnimationDurationSeconds` and `HitAnimationDurationSeconds` are action locks. A hit received during `ATTACK` queues `HIT` after attack completion instead of interrupting or freezing the current motion.
- Hit delivery uses native `AttackComponent` and `HitComponent` collision groups.
- Damage and death are accepted only on the server.
- A death is idempotent. Repeated hit/death events must not produce additional drops.
- Client movement mirrors the replicated action lock and cannot overwrite `ATTACK` or `HIT` with `MOVE` or `CLIMB`.
- Every monster deals contact damage from `TriggerStayEvent` overlap and continues in the same direction for `ContactMoveThroughSeconds` after a successful hit.
- `AttackMode=CONTACT` definitions have no separate attack animation or attack action.
- `AttackMode=ACTIVE` definitions additionally stop inside range, play `AttackAnimationRuid`, and resolve a server-authoritative active attack at the configured hit frame.

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

Base Bet does not directly mutate combat stats. Its index selects one `HuntingGroundTiers` row, which then selects the player profile and every enabled `MonsterSpawnGroups` row sharing that tier index. This keeps slot economy values separate from combat balance.

## Client Input And Camera

- `PlayerControllerComponent.UseCustomScript` is read-only at runtime and must never be assigned.
- The sandbox disables manual movement and attack by removing documented action bindings, then restores the default bindings when the combat component ends.
- Server AI publishes movement intent; the owning client executes avatar movement and changes `StateComponent` to `MOVE`, so automatic walking uses the normal avatar walk animation.
- A new ladder mount sequence calls `ActionClimb` exactly once, preserves the entry Y, and owns vertical movement until the client clamps to the destination platform and changes to `IDLE`.
- Replicated `ActionPhase=ATTACK|HIT` stops movement first and preserves that animation state even if native hit handling attempts an intermediate transition.
- Completion RPCs release retained `ATTACK`, `ATTACK_WAIT`, and `HIT` states only after the corresponding table-backed duration expires.
- The combat camera is attached to `CombatCameraAnchorKey`, positioned at the common center of the three foothold rows. It does not follow player movement.
- The fixed camera uses the `CombatConfig` screen offsets and disables foothold-area confinement by default. This keeps the three lanes in the screen-right composition regardless of tile world position.
- The previously active camera is restored when the combat component ends.

## Failure Policy

- Missing table, duplicate key, dangling reference, invalid numeric range, or unsupported enum: fail validation before runtime generation.
- Missing runtime model/script attachment: stop the harness and log one actionable error.
- Missing drop group during play: grant nothing; never substitute a hardcoded fallback reward.
- Missing foothold: placement tool exits without writing the map.
- Missing or misaligned three-lane foothold set: Henesys placement exits without writing the map.
