# Combat Foundation Handoff

## Implemented

- Combat and drop workbook schemas with create-only generation and cross-workbook validation.
- Tier 1 Slime data linked to `DROP_SLIME_TIER1`.
- Variable Common Coin reward (`1..3`) through an `INDEPENDENT` drop group.
- Deterministic combat/drop simulator covering idempotent death, quantity range, 300-second death pause, full-HP revive, and future typed item grants.
- Server combat table runtime generated from Excel.
- Server combat registry/reward queue, sandbox coordinator, player auto battle, monster health, monster AI, and monster attack scripts.
- Slime Tier 1 model with one custom movement owner and no built-in `AIChaseComponent`/`AIWanderComponent`.
- Map placement builder with fail-closed checks for map name, MapleTile mode, footholds, and model existence.

## Required Maker Step

1. Create an isolated map named `Test_Sandbox` under `map/Test_Sandbox.map`.
2. Keep `TileMapMode = 0` (`MapleTile`).
3. Paint one walkable Layer 1 foothold segment at least 4 world units wide.
4. Refresh Maker after the new `.mlua` files appear so their `.codeblock` metadata is generated.
5. Run:

```powershell
node tools/create_combat_monster_model.cjs
node tools/create_combat_testsandbox_harness.cjs
```

The placement tool then creates the player SpawnLocation, tier anchors, runtime entity, and one Slime model instance. It refuses to modify a production map or a map without footholds.

## Runtime Boundary

`CombatRuntime` queues typed rewards by player UserId. It intentionally does not mutate the existing slot-local wallet because that would create two competing currency authorities. The next integration step is a shared server wallet/economy service that drains these grants and publishes one Common Coin value to both slot and combat HUD.

## Playtest Checklist

- Manual movement and attack input are disabled only in `Test_Sandbox`.
- DefaultPlayer appearance, camera, movement, state, and player components remain intact.
- Player walks to the live Slime, enters `ATTACK`, and damages it through `AttackComponent -> HitComponent`.
- Slime death runs once, queues one drop-group result, hides, and respawns after the configured delay.
- Slime attacks the player; player death pauses combat for 300 seconds and revives at full HP.
- Leaving the sandbox removes `CombatPlayerAutoBattle` and restores the previous `UseCustomScript` value.
- Maker Build Console and runtime Console contain no new errors.
