# UI Canvas Layout Spec

## Purpose
Define the screen-space UI layout for the first playable **RPG Slot Machine** screen in MapleStory Worlds. This document is the handoff for the **아트 디렉터 / UI lane** only.

This document covers slot-machine UI, HUD, HP/timer/status overlays, naming, and bindable UI elements. It does **not** define the actual battle scene, character prefab placement, monster spawning, tilemap setup, or combat flow.

## Feature Scope
- In: Slot panel, visible 3x5 slot reel UI with 3 horizontal payline payout, Base Bet controls, Multiplier controls, Spin button, currency HUD, hunting tier text, character HP UI, Base Bet/death countdown text, status overlays.
- Out: Battle viewport UI mock, fake player/monster UI anchors, map prefab placement, tilemap assembly, monster AI, player combat prefab behavior, final art, economy logic, shop, payment integration, persistence.

## UI vs. Map Boundary
| Area | Implementation Type | Owner |
|---|---|---|
| Slot machine reels and controls | Screen-space UI | 아트 디렉터 / UI lane |
| Currency HUD | Screen-space UI | 아트 디렉터 / UI lane |
| Character HP, death timer, hunting tier text | Screen-space UI overlay | 아트 디렉터 / UI lane |
| Character and monster battle | Actual MSW map entities/prefabs | 아트 디렉터 / Level-asset lane + 테크 디렉터 |
| Monster spawn area and map/tile collision | Map/tilemap/prefab work | 아트 디렉터 / Level-asset lane |

## Layout Direction
Use a **4:6 Left/Right composition**, but only the left 40% is occupied by a heavy UI panel.

| Region | Ratio | Role | UI Rule |
|---|---:|---|---|
| Left Slot UI Panel | 40% | Slot machine controls and result viewer | Opaque UI panel is allowed. |
| Right Battle Map Area | 60% | Actual world-space combat scene | Must remain mostly uncovered by UI. No fake UI battle viewport. |
| Top HUD Overlay | Full width | Premium/Common coin display | Lightweight overlay only. |
| Right Combat Status Overlay | Right side | Hunting tier, HP, death countdown | Small UI overlay on top of the actual map. |

## Slot Cabinet Placement Rules
The active slot cabinet reference canvas is `893x1020`. Placement is defined
against this local canvas before runtime responsive scaling is applied.

### Pillar Inner-Safe Width
| Property | Value |
|---|---:|
| Frame total width | `893` |
| Left pillar zone, no child panels | `x=0..51` |
| Right pillar zone, no child panels | `x=842..893` |
| Inner-safe width | `791`, `x=51..842`, centered at `x=446.5` |

`ReelFrame_BG` and `Panel_BetMultiplierRow/Bg` must both be exactly `791`
wide and centered on the cabinet. Live child controls must not cross `x<51`
or `x>842`. The current pillar inner edge is treated as `51px`; if the source
cabinet art changes, this must be remeasured and marked `NEEDS CHECK`.

### Vertical Positions And Gaps
| Node | Size | Top Y | Rule |
|---|---:|---:|---|
| `Bg_CabinetFrame` | `893x1020` | `0` | Full local canvas. |
| `Bg_CabinetInterior` | `689x870` | `~75` | Opaque navy base behind hollow frame. |
| `Decoration_TopEmblem` | `520x250` | `-112` | Must stay behind and clear of the reel area. |
| `ReelFrame_BG` | `791x350` | `-366` | Inner-safe width, centered. Height gives 3 visible rows generous vertical padding. |
| `ReelGrid_3x5` | `791x290` | `-406` | 5 masked columns, 3 visible rows, `28px` top/bottom safe padding. |
| `Panel_BetMultiplierRow/Bg` | `791x170` | `-724` | Same width as reel frame; moved down to avoid the taller reel frame. |
| `Button_Spin` | `304x100` | `~840..910` | About `20px` below panel, above canvas bottom. |

Exact values may shift by up to `10px` to balance visual gaps, but stacked
nodes must not vertically overlap. The reel frame, bottom panel, and spin button
must remain fully inside the `893x1020` cabinet canvas.

### Explicit Z-Order
Higher order renders in front. When MSW rendering order cannot be controlled by
hierarchy alone, set `sorting_layer`, `order_in_layer`, and `override_sorting`.

| Z | Node |
|---:|---|
| `0` | `Bg_CabinetInterior` |
| `1` | `Decoration_TopEmblem` |
| `2` | `Bg_CabinetFrame` |
| `3` | reel column backgrounds and `ReelStripCell` symbols |
| `4` | `ReelFrame_BG` |
| `5` | `WinHighlight_Cx` |
| `6` | `Panel_BetMultiplierRow` contents |
| `7` | `Button_Spin` |
| `20` | `Panel_BaseBetList_Above_Hidden` |
| `21` | `Panel_BaseBetConfirm_Hidden` |
| `30` | `TopHUD_Currency` |

The open Base Bet dropdown must render above every bottom control, including
Multiplier labels and buttons, and must use an opaque background.

### Multiplier Selected Color
Multiplier selected state uses a gold or bright-blue glow/rim matching the
blue/gold palette. Unselected buttons stay dark navy/gray with a gold border.
Do not tint the shared border red; if a red accent is required later, apply it
only to an inner fill layer.

### Verification Checklist
- [ ] `ReelFrame_BG` width == `Panel_BetMultiplierRow/Bg` width == `791`, centered at cabinet `x=446.5`.
- [ ] No live child control crosses `x<51` or `x>842`.
- [ ] Top emblem, reel frame, bottom panel, and Spin button do not overlap vertically.
- [ ] Open Base Bet dropdown renders above Multiplier controls.
- [ ] Open Base Bet dropdown bottom edge stays above the Base Bet button.
- [ ] Open Base Bet dropdown background is opaque.
- [ ] Base Bet button and dropdown rows share one visual template/font.
- [ ] Multiplier selected state does not tint the shared border red.
- [ ] Bottom panel contains the Base Bet / Multiplier divider bar.
- [ ] No game-logic code is modified for layout/resource fixes.

### Centered Raster Resource Invariants

Resources that read as centered or bilaterally symmetric must be validated by their visible alpha silhouette, not only by node coordinates.

- A centered resource uses `uiPosition.x = 0` inside its local parent unless the layout spec explicitly defines an offset.
- The alpha-bounds center must be within `1px` of the image-canvas center on both axes.
- A symmetric resource must keep equal transparent left/right padding and pass the feature validator's alpha-mirror threshold.
- The complete silhouette needs at least `8px` transparent padding on every edge. Any pillar, frame corner, ornament, or anti-aliased outline touching the source edge is treated as clipped.
- ImageGen prompts must explicitly request a front-on centered composition, bilateral symmetry, equal side padding, and a complete uncut silhouette.
- Run `tools/normalize_centered_ui_asset.py --chroma-green` before upload for generated green-screen assets; after upload, validate the final PNG and the UI node using the same structure metadata.
- Resource uploaders must compare the current file against manifest metadata before skipping an existing key. A stale RUID is not accepted merely because the logical key already exists.
- Screen UI depth is controlled by sibling `displayOrder`. `OrderInLayer` must not be used as the sole proof that one Screen UI resource renders in front of another.

## Canvas Hierarchy
```text
UIRoot_TestSandbox_MainPlay
  TopHUD_Currency
    Icon_PremiumCoin
    Text_PremiumCoinAmount
    Icon_CommonCoin
    Text_CommonCoinAmount
  Panel_LeftSlotMachine
    Bg_CabinetInterior
    Bg_CabinetFrame
    Decoration_TopEmblem
    ReelGrid_3x5
      ReelColumn_C1 ... ReelColumn_C5
        Bg_ReelColumn
        ReelStrip_C1 ... ReelStrip_C5
          ReelStripCell_Cx_01 ... ReelStripCell_Cx_34
        WinHighlight_C1 ... WinHighlight_C5
    ReelFrame_BG
    Panel_BetMultiplierRow
      Bg
      Text_BaseBetTitle
      Dropdown_BaseBet
        Text_BaseBetValue
      Panel_BaseBetList_Above_Hidden
      Panel_BaseBetConfirm_Hidden
      Text_MultiplierTitle
      Divider_BaseBetMultiplier
      Button_Multiplier_x1 ... Button_Multiplier_x5
        Fill_Background
        Border
        Text_Label
    Button_Spin
    Text_SlotStatus
  BattleHUD_Right
    Header_HuntingGroundTier
    HPBar_Player
      Fill_HP
      Text_HPValue
    Text_DeathPenaltyCountdown
    Overlay_CombatPaused_Hidden
```

## Removed From UI Scope
The following former UI placeholders are intentionally removed:
- `Panel_RightBattle`
- `Viewport_BattleSandbox`
- `Anchor_PlayerPreview`
- `Anchor_MonsterSpawnArea`
- `Layer_BattleEffects`

These are not UI. They must be handled by the level/asset lane in an actual map harness.

## Required States
| UI Element | Default State | Disabled/Timer State | Notes |
|---|---|---|---|
| Base Bet dropdown | Single-cell dropdown showing current Base Bet | Disabled while `BaseBetLockRemaining > 0` | Base Bet may grow to dozens or hundreds of values, so do not list all values as permanent buttons. Lock timer shows remaining `mm:ss`. Base Bet change opens `Panel_BaseBetConfirm_Hidden` before applying the 300-second lock. |
| Multiplier buttons | Always enabled | No cooldown disabled state in this feature spec | Current selected multiplier must be visually distinct. |
| Spin button | Enabled if currency is enough | Disabled if insufficient coin or spin is resolving | Cost logic is a later script concern; expose state in UI. |
| HP bar | Shows current/maximum HP | Empty/disabled visual on death | Reads actual combat state from the map combat system later. |
| Death countdown | Hidden or blank while alive | Shows remaining 300-second penalty on death | UI display only; combat suspension is not implemented by the UI. |
| Combat paused overlay | Hidden by default | May show a compact status overlay on death | Must not replace the actual map combat scene. |

## MSW Assembly Guidelines
- Build and verify this layout in a `Test_Sandbox` UI harness before touching the main scene.
- Use stable names from this document so 테크 디렉터 can bind UI by convention later.
- Keep the 3x5 visible reel cells as independent masked reel columns backed by real 30-cell strips. Do not flatten the reel into one image; each reel strip must remain independently movable.
- Place Base Bet dropdown and Multiplier controls in one horizontal row. The bottom-most area of the slot panel should contain only the Spin button.
- Base Bet dropdown opens an upward, height-limited scroll list with `지역 이름 - n코인` item labels.
- Multiplier selected state uses a gold or bright-blue glow/rim; unselected multiplier buttons use a dark navy/gray dimmed color with the same gold border.
- Do not create a UI panel that represents the battle viewport. The right-side battle must be visible through the actual MSW map.
- Use placeholder rectangles/text/icons by default. Do not select final sprite RUIDs unless the PM explicitly opens an asset-selection task.
- Avoid hardcoding final currency values in UI. Use placeholder text such as `0` and document the binding target.

## Layered Runtime Resource Mapping
The active slot-machine reference size is `893x1020`. The runtime scales this parent as one unit, while every live UI area remains a separate child node.

| Node | Rect | Resource responsibility |
|---|---:|---|
| `Bg_CabinetInterior` | `689x870` | Opaque navy fill behind the hollow cabinet so the map does not show through. |
| `Bg_CabinetFrame` | `893x1020` | Layer 1 outer cabinet frame only. |
| `Decoration_TopEmblem` | `520x250` | Layer 2 decorative emblem only. |
| `ReelFrame_BG` | `791x350` | Layer 3 reel-window border and five divider bars. |
| `ReelColumn_Cx/Bg_ReelColumn` | `96x290` | Layer 4 recessed reel background, repeated once per column. |
| `Panel_BetMultiplierRow/Bg` | `791x170` | Layer 5 information/control panel with empty display boxes. |
| `Button_Spin` | `304x100` | Layer 6 split into Normal, Hover/Pressed, and Disabled sprite-swap states. |

The reel strip uses `80px` logical cell height, 30 logical stops, and four wrap-buffer cells. The visible column mask is `116x290`; with `88x74` cell frames this leaves `28px` safe padding above the first row and below the third row. Symbol sprites belong to `ReelStripCell` nodes; they must not be baked into Layer 3 or Layer 4.

## Acceptance Criteria
- The screen has a readable 4:6 composition at PC aspect ratio.
- The left slot panel contains 5 independently movable reel columns with a 3-row masked viewport, matching `Slot_Symbols_Paytable.md`.
- The visible reel window shows 3 rows x 5 columns, while payout is evaluated by the 3 horizontal paylines.
- Base Bet, Multiplier, Spin, currency, tier, HP, lock timer, and death timer are all visible in the UI hierarchy.
- The right 60% map area is not replaced by a fake UI battle viewport.
- A future Lua script can update all dynamic values through named UI elements without restructuring the canvas.
