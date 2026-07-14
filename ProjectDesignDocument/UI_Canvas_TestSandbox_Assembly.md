# UI Canvas Test Sandbox Assembly Notes

## Purpose
Provide the 아트 디렉터 / UI lane handoff for assembling the first main play screen UI in an isolated `Test_Sandbox` UI harness. This document extends `UI_Canvas_Layout.md` with concrete UI hierarchy, reusable UI prefab candidates, naming, placeholder states, and verification notes only.

## Authoritative Inputs
| Document | Use |
|---|---|
| `ProjectDirection.md` | Core screen requirements and Phase 1 scope. |
| `UI_Canvas_Layout.md` | UI/map boundary, layout ratio, required UI elements, acceptance criteria. |
| `UI_Canvas_SubAgent_Handoff.md` | Workstream boundaries and agent responsibilities. |

## Scope Boundary
- Build target: `Test_Sandbox` UI harness only.
- Output type: UI hierarchy and screen-space UI assembly notes.
- Do not create a fake battle viewport in UI.
- Do not place character prefabs, monster prefabs, tilemaps, map footholds, combat scripts, economy logic, final art, shop logic, payment integration, or persistence.

## Canvas Root
| Node | Type | Notes |
|---|---|---|
| `UIRoot_TestSandbox_MainPlay` | UI root canvas | Sandbox-only parent for screen-space UI. |
| `TopHUD_Currency` | HUD overlay group | Full-width top overlay. |
| `Panel_LeftSlotMachine` | Left panel group | Occupies roughly 40% screen width. Contains slot result and controls. |
| `BattleHUD_Right` | Lightweight HUD overlay | Shows combat state from actual map combat later; does not contain a battle viewport. |

## Hierarchy
```text
UIRoot_TestSandbox_MainPlay
  TopHUD_Currency
    Icon_PremiumCoin
    Text_PremiumCoinAmount
    Icon_CommonCoin
    Text_CommonCoinAmount
  Panel_LeftSlotMachine
    Bg_CabinetBackplate
    ReelFrame_BG
    ReelGrid_3x5
      ReelColumn_C1
        ReelCell_R1C1
        ReelCell_R2C1
        ReelCell_R3C1
      ...
      ReelColumn_C5
        ReelCell_R1C5
        ReelCell_R2C5
        ReelCell_R3C5
    Panel_BetMultiplierRow
      Text_BaseBetTitle
      Dropdown_BaseBet
        Text_BaseBetValue
      Panel_BaseBetList_Above_Hidden
        Scroll_BaseBetOptions
          Item_BaseBetOption_Template
      Text_BaseBetLockTimer
      Panel_BaseBetConfirm_Hidden
        Text_BaseBetConfirmMessage
        Button_BaseBetConfirmApply
      Button_BaseBetConfirmCancel
      Text_MultiplierTitle
      Button_Multiplier_x1
      Button_Multiplier_x2
      Button_Multiplier_x3
      Button_Multiplier_x4
      Button_Multiplier_x5
    Button_Spin
  BattleHUD_Right
    Header_HuntingGroundTier
    HPBar_Player
      Fill_HP
      Text_HPValue
    Text_DeathPenaltyCountdown
    Overlay_CombatPaused_Hidden
```

## Explicitly Not In This UI
| Removed Former Placeholder | Reason |
|---|---|
| `Panel_RightBattle` | Would imply combat is a UI panel. |
| `Viewport_BattleSandbox` | Battle must happen in the actual MSW map, not a UI viewport mock. |
| `Anchor_PlayerPreview` | Player must be a real map/prefab entity. |
| `Anchor_MonsterSpawnArea` | Monster spawn area must be a real map region/entity. |
| `Layer_BattleEffects` | Battle effects should be world-space or combat-system driven unless separately specified as UI feedback. |

## Prefab Candidates
| Prefab Candidate | Contains | Reuse Intent |
|---|---|---|
| `Prefab_CurrencyHUD` | `TopHUD_Currency` and four child fields | Reusable across shop, battle, and slot screens later. |
| `Prefab_ReelColumn` | One masked 3-cell reel viewport, one child `ReelStrip_Cx` containing 30 actual UI cells, and one optional center-row highlight overlay | Instantiate or duplicate exactly 5 times; each reel must stay independently bindable. |
| `Prefab_BaseBetDropdown` | `Dropdown_BaseBet`, `Text_BaseBetValue` | Supports many Base Bet values without permanently showing dozens/hundreds of buttons. The visual arrow text is intentionally omitted so the selected value can use the full button width. |
| `Prefab_BaseBetOption` | One scroll list item with region name and coin amount | Reused inside the upward Base Bet list. |
| `Prefab_MultiplierButton` | Multiplier button visual and text state | Reuse for `Button_Multiplier_x1` through `Button_Multiplier_x5`. |
| `Prefab_HPBar` | `HPBar_Player`, `Fill_HP`, `Text_HPValue` | Reusable for future character or monster health displays. |
| `Prefab_TimerText` | Timer text with normal/warning visual variants | Use for Base Bet lock and death penalty countdown. |

## Assembly Notes
| Area | Notes |
|---|---|
| Screen split | Use a heavy UI panel on the left 40%. Leave the right 60% mostly clear so the actual map combat is visible. |
| Reel grid | Visually show exactly 3 rows and 5 columns through masked reel columns. Each column contains a real `ReelStrip_Cx` UI entity that moves downward and wraps at strip end. The logical reel remains 30 stops, while the UI strip includes 34 rendered cells with two wrap-buffer cells on each side to prevent blank cells at the loop seam. `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` are the active P0.5 payout rows. Runtime timing follows weighted spin profiles (`NORMAL`, `QUICK`, `TENSION`) so stops feel varied while still landing on predetermined symbols. |
| Bet/multiplier row | Place Base Bet dropdown on the left and Multiplier buttons horizontally to its right. This row replaces the former separate Base Bet and Multiplier panels. |
| Base Bet controls | Display one single-cell dropdown showing the current Base Bet value. Clicking it opens `Panel_BaseBetList_Above_Hidden` upward as a scrollable list. Items use `지역 이름 - n코인` format, for example `헤네시스 - 10코인`. While locked, the dropdown uses a disabled visual and `Text_BaseBetLockTimer` shows `mm:ss`. |
| Base Bet confirmation | Keep `Panel_BaseBetConfirm_Hidden` inactive by default. It exists because changing Base Bet starts a 300-second lock. |
| Multiplier controls | Display buttons `x1` through `x5`. The selected multiplier uses a red active tint with bright text; unselected multipliers use a deep blue inactive tint. No cooldown state is needed for this workstream. |
| Spin button | Keep as the only control in the bottom-most slot panel area. Include normal, disabled, and resolving placeholder states, but do not wire currency logic. |
| Combat HUD | `BattleHUD_Right` may show tier, HP, death timer, and compact paused status only. It must not contain fake map objects. |
| HP display | Show a full HP placeholder by default. On death mock state, `Fill_HP` is empty and `Text_DeathPenaltyCountdown` shows a 300-second countdown placeholder. |
| Currency HUD | UI placeholder may remain `0` in the `.ui` file. Slot runtime initializes play-test Premium Coin to `9999` and Common Coin to `0`. |

## UI Quality Pass Notes
| Area | Applied Direction |
|---|---|
| Slot panel spacing | Active structure uses a 700x1020 parent slot panel. `Bg_CabinetFrame` is Layer 1 only; an independent `Bg_CabinetInterior` prevents the map from showing through its hollow center. |
| Reel window | `ReelFrame_BG` is a separate 620x300 Layer 3 image rendered over 5 independent masked columns. Each column has an 88x244 Layer 4 background, a logical 30-stop reel, and 34 rendered cells including wrap buffers. |
| Bet/multiplier row | `Panel_BetMultiplierRow/Bg` is the 620x170 Layer 5 panel. Base Bet and Multiplier nodes remain independent interactive controls on top of its empty display boxes. |
| Spin button | `Button_Spin` owns separate Normal, Hover/Pressed, and Disabled Layer 6 sprites through `ButtonComponent` sprite swapping. |
| Text overflow | Long labels use Ellipsis and selected dynamic labels use BestFit so button text and list labels do not spill into adjacent controls. |

## Selected UI Resource Direction
| Target | Style | RUID | Notes |
|---|---|---|---|
| Integrated slot cabinet | Generated textless integrated casino cabinet | `c27b175134964fff934c66823381ffef` | Deprecated prototype artifact only. It is no longer referenced by the generated `.ui` because it bakes several live UI areas into one bitmap. |
| Main slot panel / cabinet frame | Layer 1 generated cabinet frame | Manifest key `slotLayerCabinetFrame` | Applied to `Panel_LeftSlotMachine/Bg_CabinetFrame` at 700x1020. Contains no live UI areas. |
| Top ornament | Layer 2 generated emblem | Manifest key `slotLayerTopEmblem` | Applied to `Panel_LeftSlotMachine/Decoration_TopEmblem` at 520x250. |
| Reel frame | Layer 3 generated reel-window frame | Manifest key `slotLayerReelWindowFrame` | Applied to `Panel_LeftSlotMachine/ReelFrame_BG` at 620x300 above the reel masks. |
| Reel column background | Layer 4 generated recessed column | Manifest key `slotLayerReelColumnBackground` | Repeated at 88x244 under each independently moving reel strip. |
| Bet/multiplier panel | Layer 5 generated info panel | Manifest key `slotLayerInfoPanel` | Applied to `Panel_BetMultiplierRow/Bg` at 620x170; boxes remain empty for live labels. |
| Currency HUD | ImageGen minimal navy/gold two-bay currency frame | Manifest key `currencyHudMinimal` / `e91423e98d5442a38cb4a3582a1ba54d` | Applied to `TopHUD_Currency/Bg` at its native 740x88 aspect. The center divider and left/right bays stay symmetric and contain no baked labels, icons, gems, or live values. |
| Premium currency icon | Existing item sprite | `9f4a925aa417482c82e2c683e6d863b9` | Rendered untinted at 40x40 with aspect preservation, followed by the value-only GameString 202. |
| Common currency icon | Existing item sprite | `4cc5ffc272224edc809a792b8efa16e3` | Rendered untinted at 42x36 with aspect preservation, followed by the value-only GameString 203. |
| Combat HUD | Generated compact panel | `747efdda9e98478cb54c7aac431da554` | Applied to `BattleHUD_Right/Bg`. |
| Reel cell fill | No structural sprite | n/a | Reel cells render live text/future symbol sprites only; Layer 3 and Layer 4 own the frame and recessed surface. |
| Multiplier cell fill | Generated square blue casino cell | `1cd9fefcb2be4824a94bfd317ae14796` | Applied to multiplier buttons. Runtime tint controls red selected and blue inactive states. |
| Main Spin button | Layer 6 generated state sprites | Manifest keys `slotSpinButtonNormal`, `slotSpinButtonHoverPressed`, `slotSpinButtonDisabled` | Applied to `Button_Spin` at 304x100 through `SpriteSwap`. Runtime text remains separate. |
| Standard buttons | Generated textless blue casino button | `43d1ee446e5f4acdb177552304a7510c` | Applied to Base Bet dropdown/options and cancel-style buttons. |
| Selected option button | Generated textless bright blue button | `1789926c39df416ab73a52a888288440` | Applied to the initial selected Base Bet option. Runtime refresh still updates tints and labels. |
| Base Bet dropdown list | Generated dropdown list panel | `f322a2f674b54448a2481008b6b8f4a9` | Applied to `Panel_BaseBetList_Above_Hidden/Bg`; verify aspect in Maker. |
| Win highlight | Generated golden glow frame | `c57e42b4256c4816ad2d6fa657f67185` | Applied to column win highlights. |

Rejected resource rule: MSW object, building, map prop, or full-background sprites must not be applied as UI panels unless they are confirmed to support clean 9-slice behavior at the target size.

2026-06-14 correction: Text-baked button sprites were removed from all interactive buttons because their built-in lettering overlapped with runtime button text. New textless casino UI resources were generated through the imagegen skill, sliced into PNGs, uploaded to MSW account resources, and connected through `tools/create_mainplay_testsandbox_ui.cjs`.

Generated asset source:
- Raw sheet: `GeneratedAssets/SlotMachineUI/casino_slot_ui_sheet_raw.png`
- Sliced PNGs: `GeneratedAssets/SlotMachineUI/sliced/`
- RUID manifest: `GeneratedAssets/SlotMachineUI/msw_resource_manifest.json`
- Slicing script: `tools/slice_casino_ui_sheet.py`
- Rect-safe rebuild script: `tools/build_slot_ui_rectsafe_assets.py`
- Upload script: `tools/upload_slot_ui_assets_to_msw.mjs`
- Layer runtime build script: `tools/build_slot_ui_layer_runtime_assets.py`
- Layer runtime upload script: `tools/upload_slot_ui_layers_to_msw.mjs`

2026-06-14 text cleanup:
- Removed the decorative `SLOT MACHINE` title because it overlaps the generated casino frame ornament.
- Removed default idle `Ready` labels. Status text is empty by default and appears only for spin progress, wins, no-win results, or errors.
- Applied MSW `Maple` font (`FontType = 1`) across generated UI labels and buttons for better MapleStory Worlds fit and Korean readability.
- Reduced Base Bet selected-label size and centered/left-aligned controls so Korean region names stay inside the dropdown.

2026-06-21 control row polish:
- Removed the visible dropdown `v` text node from Base Bet selection so labels display as `지역 이름 - n코인` without a suffix.
- Replaced the flat bottom control box with a textless casino control deck asset.
- Changed selected multiplier visual state to red with bright text, and changed selected Base Bet option text from dark to bright so selected labels remain readable.

2026-06-21 imagegen style rollback:
- Rolled back the directly drawn V2 panel assets because they lost the original imagegen casino texture and looked too flat.
- Current slot UI must use imagegen-sourced visual resources by default. Do not replace them with deterministic/vector-style redraws unless explicitly approved.
- The 0.png concept remains the visual direction reference: ornate gold/purple casino cabinet, gem ornament, opaque deep-blue panels, and red selected multiplier.

2026-06-21 integrated cabinet structure pass:
- Generated a new imagegen-sourced textless integrated cabinet based on the 0.png concept.
- `Panel_LeftSlotMachine/Bg` now uses the integrated cabinet resource `c27b175134964fff934c66823381ffef`.
- Removed separate visual backgrounds from `ReelGrid_3x5` and `Panel_BetMultiplierRow`; these nodes now exist only as layout/binding containers over the integrated cabinet.
- `Button_Spin` uses a transparent click area and separate text over the integrated cabinet's green spin button.
- Active reel cells, Base Bet, Multiplier buttons, dropdown list, and runtime text remain separate UI nodes so gameplay logic and animations continue to work.

2026-06-21 UI structure-first correction:
- The integrated cabinet approach is now considered a temporary prototype artifact, not the target production workflow.
- Root issue: live UI areas such as the reel frame, bottom control row, and Spin button were baked into one full-panel bitmap, then UI nodes were forced to match that image. This creates layout drift across resolutions, anchors, and image aspect changes.
- Next UI quality pass must start by defining the UI hierarchy and rects first, then generating or selecting image assets per node.
- Required structural split for the slot area:
  - `Panel_LeftSlotMachine/Bg_CabinetBackplate`: decorative cabinet/backplate only.
  - `Panel_LeftSlotMachine/ReelFrame_BG`: opaque reel frame/background sized to the finalized `ReelGrid_3x5` rect.
  - `Panel_LeftSlotMachine/ReelGrid_3x5`: live masked reel columns only.
  - `Panel_LeftSlotMachine/Panel_BetMultiplierRow/Bg_ControlPanel`: opaque control-row background sized to the finalized control rect.
  - `Dropdown_BaseBet`, `Button_Multiplier_x1..x5`, and `Button_Spin`: each owns its own textless button/frame asset and state visuals.
- Full-cabinet imagegen outputs may be used as concept art or a slicing reference, but runtime UI should consume sliced/reusable pieces matched to node boundaries.
- When requesting imagegen assets, include the node rect/aspect, intended scaling rule, and whether the piece is decorative, structural, interactive, or effect-only.

2026-06-21 structure-first implementation pass:
- Removed the integrated cabinet RUID from the generated `.ui`; validation confirmed `usesIntegratedCabinet = false`.
- `Panel_LeftSlotMachine` now owns separate visual children:
  - `Bg_CabinetBackplate` uses `cabinetBackplateRectsafe` at 700x820.
  - `ReelFrame_BG` uses `reelFrameRectsafe` at 620x368.
  - `Panel_BetMultiplierRow/Bg` uses `controlsPanelRectsafe` inside a 620x120 parent.
  - `Button_Spin` uses the textless `buttonGreenRectsafe` image directly at 304x80.
- The integrated imagegen cabinet was reused only as a visual source. Runtime resources were rebuilt as rect-safe node-level PNGs so each image matches its target UI rectangle.
- Validation result: 579 UI entities, 170 reel strip cell entities, no missing required structural nodes, and no active reference to the deprecated integrated cabinet RUID.

2026-06-21 rect-safe image correction:
- Root issue: even with correct UI pivots, several image canvases had ornate pixels touching the canvas edge or used a different visual basis than the target UI rect, so the apparent pivot looked wrong after clipping/scaling.
- Rebuilt four production slot UI images from the integrated cabinet concept into target-rect canvases:
  - `casino_slot_ui_cabinet_backplate_rectsafe.png` -> 700x820, RUID `ca824a7986924ee19f000c0a56ec3d32`.
  - `casino_slot_ui_reel_frame_rectsafe.png` -> 620x368, RUID `2decb65569a743b4bfc3e99d15e03688`.
  - `casino_slot_ui_controls_panel_rectsafe.png` -> 620x120, RUID `5421cf8d66234665a3d9d906b74c3b0e`.
  - `casino_slot_ui_button_green_rectsafe.png` -> 304x80, RUID `a90a1b76261a44c49fcffec45bce238a`.
- `tools/create_mainplay_testsandbox_ui.cjs` now references only these rect-safe resources for the main slot cabinet, reel frame, control panel, and Spin button.
- Required validation: active `.ui` must contain all four rect-safe RUIDs and must not contain the deprecated integrated cabinet RUID.

2026-06-21 clean structural resource correction:
- Root issue: the previous rect-safe frame still contained visual UI responsibilities that were also owned by live UI nodes. The reel frame baked internal reel dividers while `ReelStripCell` nodes also had ornate cell frames. The control panel baked dropdown/multiplier button slots while live dropdown and multiplier buttons were drawn on top.
- Rebuilt clean structural resources:
  - `casino_slot_ui_reel_frame_clean_rectsafe.png` -> 620x368, RUID `3edabcf6493e407eb99c7c590a8776a5`.
  - `casino_slot_ui_controls_panel_clean_rectsafe.png` -> 620x120, RUID `bcf9ae94e58243ba91abee3c92712b5f`.
- Updated layout gaps so major ornate panels no longer touch:
  - Reel frame top remains `y=220`, bottom `y=588`.
  - Control panel top moved to `y=600`, bottom `y=720`.
  - Spin button top moved to `y=724`, bottom `y=804`.
- Required validation: active `.ui` must contain the two clean RUIDs and must not contain the old reel-frame/control-panel RUIDs.

2026-06-21 responsive layout pass:
- Static fallback layout now keeps major panels separated: `TopHUD_Currency` is top-center at 740x88, `Panel_LeftSlotMachine` starts below the HUD at 700x1020, and `BattleHUD_Right` starts below the top HUD band.
- Runtime calls `ApplyResponsiveLayout()` on client begin play and recalculates major panel scale/position from `_UILogic.ScreenWidth` and `_UILogic.ScreenHeight`.
- Top currency HUD scales between 0.72 and 1.0, anchored top-center.
- Slot machine panel scales down from 1.0 using both available width and available height, with a lower clamp of 0.48. Its pivot remains top-left so shrinking preserves the top safe gap and prevents bottom overflow.
- Battle HUD is hidden on widths below 1500 because it competes with the slot panel on compact resolutions. On wide screens it is placed below the same top-safe band.
- Baseline validation targets are 1366x768 and 1920x1080. At 1366x768, the slot panel scales to roughly 0.62 and fits below the top HUD without covering the screen bottom. At 1920x1080, it scales to roughly 0.92, leaving the same safe gaps without overlap.

2026-07-14 currency HUD resource pass:
- `TopHUD_Currency` keeps the existing node IDs and runtime bindings; only the panel background, two icon sprites, two value text layouts, and the responsive size constants changed.
- Premium and common values are displayed as `{icon} {value}`. GameString indices 202 and 203 intentionally contain only `{0}` so localized labels cannot duplicate the icon meaning or consume the value safe area.
- Both value text boxes use left alignment and BestFit from 26 down to 16 so long runtime values remain inside their own 240x48 bay.
- `tools/patch_currency_hud_ui.cjs` is the narrow update path for the active `.ui`; do not regenerate the full UI for this resource-only change.

## Binding Surface
| Dynamic Value | UI Node |
|---|---|
| Premium Coin amount | `Text_PremiumCoinAmount` |
| Common Coin amount | `Text_CommonCoinAmount` |
| Slot symbols | `ReelGrid_3x5` contains top/center/bottom symbols for each column; `TOP_LINE`, `MAIN_LINE`, and `BOTTOM_LINE` are active payout rows. |
| Selected Base Bet | `Dropdown_BaseBet` and `Text_BaseBetValue` |
| Base Bet option list | `Panel_BaseBetList_Above_Hidden`, `Scroll_BaseBetOptions`, `Item_BaseBetOption_Template` |
| Base Bet lock remaining | `Text_BaseBetLockTimer` |
| Selected multiplier | `Button_Multiplier_x1` through `Button_Multiplier_x5` |
| Spin enabled/resolving state | `Button_Spin` |
| Hunting ground tier | `Header_HuntingGroundTier` |
| Player HP fill | `Fill_HP` |
| Player HP text | `Text_HPValue` |
| Death penalty remaining | `Text_DeathPenaltyCountdown` |
| Combat paused visual | `Overlay_CombatPaused_Hidden` |

## Placeholder State Matrix
| State | Required Visual Setup |
|---|---|
| Default playable | UI file may show placeholder currency `0`; runtime play test shows Premium Coin `9999`, Common Coin `0`, Base Bet dropdown `1`, Multiplier `x1` selected, HP full, death countdown hidden or blank. |
| Base Bet list open | The list opens upward from the Base Bet dropdown, is height-limited, and scrolls if the catalog exceeds the visible area. |
| Base Bet locked | Base Bet dropdown disabled, selected Base Bet remains visible, `Text_BaseBetLockTimer` shows `04:59` placeholder. |
| Spin resolving | `Button_Spin` disabled or visually busy. Each reel strip moves downward behind its 3-cell mask and stops left-to-right on the predetermined 3x5 result. The UI strip has wrap-buffer cells so the seam between the last and first logical stop does not show an empty cell. |
| Death penalty | HP fill empty, `Text_HPValue` shows `0 / Max`, `Text_DeathPenaltyCountdown` shows `04:59`, compact combat paused overlay visible. |

## Verification Checklist
- `Test_Sandbox` contains `UIRoot_TestSandbox_MainPlay`.
- The left slot panel visibly occupies roughly 40% of the screen.
- The right map area is not covered by an opaque fake battle UI panel.
- The top currency HUD is visible.
- `ReelGrid_3x5` contains exactly 5 named columns and 15 visible cells.
- Every dynamic value listed in `Binding Surface` has a uniquely named UI node.
- Base Bet confirmation panel exists and is hidden by default.
- Base Bet is represented by one dropdown control, not by permanent value buttons.
- Base Bet dropdown opens a scrollable upward list with region-name and coin-amount item labels.
- Multiplier buttons share the same horizontal row as the Base Bet dropdown.
- Selected Multiplier is visibly red and unselected Multipliers are deep blue/dimmed.
- The bottom-most slot panel area contains only `Button_Spin`.
- Timer placeholders use `mm:ss` format.
- No production Lua, economy persistence, monster AI, map prefab placement, or tilemap work is introduced by this UI workstream.

## Current Implementation Artifact
- UI file: `ui/UIRoot_TestSandbox_MainPlay.ui`
- Root UI group: `UIRoot_TestSandbox_MainPlay`
- Generated by UIBuilder, not raw JSON editing.
- Verification target: `ui_lint.cjs --severity warning` should return 0 findings.
- Required read-side check: exactly 5 reel columns, 170 unique `ReelStripCell_Cx_yy` rendered cells, and no missing required UI nodes.

## 2026-06-22 Layered Resource Integration
The six approved imagegen layers supersede the earlier integrated-cabinet and rect-safe reconstruction resources for the main slot cabinet.

| Runtime node | Runtime PNG | Target rect | Behavior |
|---|---|---:|---|
| `Bg_CabinetFrame` | `slot_layer_cabinet_frame.png` | `700x1020` | Decorative outer structure only; the center remains hollow. |
| `Decoration_TopEmblem` | `slot_layer_top_emblem.png` | `520x250` | Decorative title-area ornament. |
| `ReelFrame_BG` | `slot_layer_reel_window_frame.png` | `620x300` | Structural frame and five visual column divisions; rendered above the reel masks. |
| `ReelColumn_Cx/Bg_ReelColumn` | `slot_layer_reel_column_background.png` | `88x244` | Repeated five times behind independently animated reel strips. |
| `Panel_BetMultiplierRow/Bg` | `slot_layer_info_panel.png` | `620x170` | Opaque control-panel art; runtime text and click targets stay independent. |
| `Button_Spin` | `slot_spin_button_normal.png` plus state PNGs | `304x100` | `ButtonComponent.Transition = SpriteSwap`; Hover and Pressed share one state, Disabled uses the grey-green state. |

Additional structural rules:
- `Bg_CabinetInterior` is a separate opaque navy fill behind the hollow Layer 1 frame.
- The parent slot reference rect is `700x1020`; responsive scaling is applied to the parent only.
- Reel cell height is `80`; the 30 logical cells and four wrap-buffer cells remain independently addressable.
- Reel strip cells do not draw the old square cell-frame image. Layer 3 owns reel divisions and Layer 4 owns the recessed column surface.
- Runtime binding paths for reel strips, Base Bet, Multiplier buttons, and Spin remain unchanged.
- The active UI must include all eight layered-resource RUIDs and must not use the deprecated integrated cabinet or clean rect-safe cabinet resources for the main slot structure.

### Maker Play Preview Verification
- Verified in the FHD PC Play Preview on 2026-06-22.
- Cabinet, emblem, reel frame, five reel-column backgrounds, info panel, and Spin button loaded without missing-resource placeholders.
- Spin sprite swapping was visible for Normal, Hover, and Disabled states.
- The 80px reel strips spun and stopped without exposing an empty wrap seam.
- Runtime initialization, predetermined result, spin profile, and spin-complete logs were emitted; the Maker console showed no red runtime errors during the test.
