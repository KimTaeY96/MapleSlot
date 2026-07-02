# UI Canvas Sub-Agent Handoff

## Purpose
Route only the currently relevant UI canvas and slot runtime workstream documents to each director persona. This prevents unnecessary exploration and keeps agent context small.

## Current Workstream
**Slot UI, Combat Status UI Configuration, and Slot Runtime Binding**

## PM Decisions For This Workstream
- Slot row is fixed as **1 row x 5 columns**.
- Base Bet test values are `1` through `10`.
- Multiplier test values are `x1` through `x5`.
- Base Bet changes trigger a 300-second lock, so the UI includes a hidden Base Bet confirmation panel.
- Slot machine presentation is UI work.
- Slot outcome, payout, and currency mutation are script/runtime work.
- Slot runtime logic must follow an outcome-first structure: the spin result is decided before reel animation begins.
- Slot costs spend Premium Coin first; slot winnings pay Common Coin only.
- Character-vs-monster combat is **not** UI work. It must be implemented as actual MSW map/prefab combat in a separate level/asset workstream.
- The UI may display HP, tier, and countdown state, but it must not mock the battle scene as a UI viewport.
- The slot cabinet now uses the approved layered imagegen resource set. The UI lane must preserve the node-level separation defined in `UI_Canvas_Layout.md`; do not rebuild it as one integrated cabinet bitmap.

## PM Routing
| Director | Receives | Must Produce | Must Not Do |
|---|---|---|---|
| 기획 디렉터 | `ProjectDirection.md`, `Slot_Symbols_Paytable.md`, `Slot_RTP_Simulator_Handoff.md`, `Slot_Machine_Runtime.md` | Confirmed symbol/payline/payout table, RTP target, and future bonus-scope decisions | Do not invent final reel weights without simulator validation. |
| 테크 디렉터 | `Slot_Machine_Runtime.md`, `Slot_RTP_Simulator_Handoff.md`, `UI_Canvas_TestSandbox_Assembly.md` | Outcome-first slot runtime, coin math, UI binding, and validation tests after PM approval | Do not change UI hierarchy unless PM routes that to the Art Director. |
| 아트 디렉터 / UI lane | `ProjectDirection.md`, `UI_Canvas_Layout.md`, `UI_Canvas_TestSandbox_Assembly.md`, `Slot_Machine_Runtime.md` | Test_Sandbox screen-space UI hierarchy, layered slot resources, reel presentation states, slot controls, and combat status HUD | Do not create fake battle viewport, player/monster UI anchors, map prefabs, tilemaps, or combat logic. Do not merge the approved layered resources into one runtime bitmap. |
| 아트 디렉터 / Level-asset lane | `ProjectDirection.md`, `Combat_Map_TestSandbox.md` | Test_Sandbox map/prefab/tilemap combat harness plan | Do not edit `.ui` canvas structure. |

## Harness Requirement
- UI work must target a `Test_Sandbox` UI harness first.
- Map combat work must target a `Test_Sandbox` map/harness with real MSW entities/prefabs first.
- Probability work must target a pure Lua simulation harness before production script integration.
- Slot runtime integration begins from `Slot_Machine_Runtime.md` only after PM approval.
- Main scene integration begins only after PM approval of the current workstream documents.
