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

## UI Hierarchy Draft
This is a draft hierarchy only. It is not wired into `UIRoot_TestSandbox_MainPlay.ui` yet.

```text
Panel_ClassicSlotMachine
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

## Next Implementation Step
Upload the sliced PNGs to MSW resource storage, add their RUIDs to a manifest/table, then create a narrow UI patch that adds `Panel_ClassicSlotMachine` and binds only the new nodes. Avoid regenerating the full existing slot UI unless the hierarchy changes substantially.
