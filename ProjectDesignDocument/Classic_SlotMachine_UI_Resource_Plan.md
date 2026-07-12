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
| UI patcher | `tools/patch_bonus777_overlay_ui.cjs` |

## UI Hierarchy Draft
These generated resources are wired into `UIRoot_TestSandbox_MainPlay.ui` through the existing 777 bonus overlay, `Panel_Bonus777_Hidden`. They do not create a separate active classic slot feature.

```text
Panel_Bonus777_Hidden
  Dim
  ClassicSlot
    Sprite_FrameShell
    ReelMask_1
      ReelStrip_1
        DigitCell_01..11
    ReelMask_2
      ReelStrip_2
        DigitCell_01..11
    ReelMask_3
      ReelStrip_3
        DigitCell_01..11
    Sprite_ReelWindowFrame
    Sprite_TopArch
    Sprite_TopEmblem
    Sprite_BottomPanel
    Sprite_BasePlinth
    Sprite_LeftSideCap
    Sprite_RightSideCap
    Sprite_Lever
  Text_Title
  Text_Chance
  Text_Result
```

Recommended layer order:

| Order | Node | Resource |
|---:|---|---|
| 0 | `Sprite_FrameShell` | `classic_slot_frame_shell.png` |
| 10 | `ReelMask_1/ReelStrip_1/DigitCell_*` | live digit cells, no baked strip image |
| 10 | `ReelMask_2/ReelStrip_2/DigitCell_*` | live digit cells, no baked strip image |
| 10 | `ReelMask_3/ReelStrip_3/DigitCell_*` | live digit cells, no baked strip image |
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
- The three reel strip samples are cropped from the generated source for geometry/reference only. They are not used as gameplay strip sprites.
- `classic_slot_full_composite.png` is reference-only and should not be layered with the decomposed assets in the final UI.
- `classic_slot_symbol_7.png` is an extracted example symbol crop; final symbol assets should be generated or cleaned separately if isolated icons are needed.

## Applied State
- Sliced PNGs were uploaded to MSW resource storage and merged into `GeneratedAssets/SlotMachineUI/msw_resource_manifest.json` with `classicSlot*` keys.
- `tools/patch_bonus777_overlay_ui.cjs` applies these resources to the existing `Panel_Bonus777_Hidden` overlay.
- `tools/create_mainplay_testsandbox_ui.cjs` calls the 777 overlay patcher after the normal UI generation flow so the resource-backed overlay can be restored after a full rebuild.
- `tools/validate_slot_ui_layers.cjs` validates the 777 overlay, reel masks, live digit-strip cells, sprite sizes, positions, RUIDs, runtime bindings, and layer order.

## Next Implementation Step
When the 777 bonus art is finalized, replace the current generated classic-slot slices with production slices while keeping the same `Panel_Bonus777_Hidden` hierarchy and existing bonus resolver contract.
