# Classic Slot Machine UI Resource Plan

## Goal
Create one generated full-slot-machine concept image, then split it into project-local example resources according to a planned UI hierarchy. This follows the previous slot UI workflow: concept image first, structure second, resource slices third.

## Generated Source
Built with the `imagegen` skill using a flat magenta chroma-key background, then converted to alpha PNG.

| Asset | Path |
|---|---|
| Chroma-key source | `GeneratedAssets/SlotMachineUI/classic_example/source/classic_slot_machine_full_chromakey.png` |
| Alpha source | `GeneratedAssets/SlotMachineUI/classic_example/source/classic_slot_machine_full_alpha.png` |
| Slice manifest | `GeneratedAssets/SlotMachineUI/classic_example/classic_slot_ui_structure.json` |
| Contact sheet | `GeneratedAssets/SlotMachineUI/classic_example/classic_slot_resource_sheet.png` |
| Slice builder | `tools/build_classic_slot_example_assets.py` |
| MSW uploader | `tools/upload_classic_slot_example_to_msw.mjs` |
| UI patcher | `tools/patch_classic_slot_example_ui.cjs` |

## UI Hierarchy Draft
This hierarchy is wired into `UIRoot_TestSandbox_MainPlay.ui` as `Panel_ClassicSlotMachine_Hidden`. The panel starts disabled to avoid overlapping the active slot machine UI.

```text
Panel_ClassicSlotMachine_Hidden
  Sprite_FrameShell
  ReelMask_1
    Sprite_ReelStrip
  ReelMask_2
    Sprite_ReelStrip
  ReelMask_3
    Sprite_ReelStrip
  Sprite_ReelWindowFrame
  Sprite_TopArch
  Sprite_TopEmblem
  Sprite_BottomPanel
  Sprite_BasePlinth
  Sprite_Lever
  Symbols
    Sprite_Seven
  Sprite_FullComposite_Reference
```

Recommended layer order:

| Order | Node | Resource |
|---:|---|---|
| 0 | `Sprite_FrameShell` | `classic_slot_frame_shell.png` |
| 10 | `ReelMask_1/Sprite_ReelStrip` | `classic_slot_reel_strip_1.png` |
| 10 | `ReelMask_2/Sprite_ReelStrip` | `classic_slot_reel_strip_2.png` |
| 10 | `ReelMask_3/Sprite_ReelStrip` | `classic_slot_reel_strip_3.png` |
| 20 | `Sprite_ReelWindowFrame` | `classic_slot_reel_window_frame.png` |
| 30 | `Sprite_TopArch` | `classic_slot_top_arch.png` |
| 31 | `Sprite_TopEmblem` | `classic_slot_top_emblem.png` |
| 32 | `Sprite_BottomPanel` | `classic_slot_bottom_panel.png` |
| 33 | `Sprite_BasePlinth` | `classic_slot_base_plinth.png` |
| 40 | `Sprite_Lever` | `classic_slot_lever.png` |
| 90 | `Sprite_FullComposite_Reference` | `classic_slot_full_composite.png` |

## Slice Notes
- `classic_slot_frame_shell.png` has the reel viewport cleared to alpha so reel strips can render beneath the frame.
- `classic_slot_reel_window_frame.png` keeps the gold reel-window frame and vertical dividers, with reel interiors cleared.
- The three reel strip samples are cropped from the generated source and are suitable as placeholder strip art.
- `classic_slot_full_composite.png` is reference-only and should not be layered with the decomposed assets in the final UI.
- `classic_slot_symbol_7.png` is an extracted example symbol crop; final symbol assets should be generated or cleaned separately if isolated icons are needed.

## Applied State
- Sliced PNGs were uploaded to MSW resource storage and merged into `GeneratedAssets/SlotMachineUI/msw_resource_manifest.json` with `classicSlot*` keys.
- `tools/patch_classic_slot_example_ui.cjs` applies only the new hidden classic slot panel and does not regenerate the existing slot UI.
- `tools/create_mainplay_testsandbox_ui.cjs` calls the classic slot patcher after the normal UI generation flow so the panel can be restored after a full rebuild.
- `tools/validate_slot_ui_layers.cjs` validates the hidden panel, reel masks, sprite sizes, positions, RUIDs, and layer order.

## Next Implementation Step
When this preview needs to become an active replacement or selectable skin, add runtime/table ownership for enabling `Panel_ClassicSlotMachine_Hidden` and deciding whether it should replace or coexist with `Panel_LeftSlotMachine`.
