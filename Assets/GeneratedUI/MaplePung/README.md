# MaplePung UI resource kit

These sprites were generated with the built-in ImageGen tool from the three
user-provided inventory, equipment, and item-detail reference images.

The four `*-source.png` files are the generated chroma-key source atlases.
`tools/slice_maplepung_ui_assets.py` slices them into individual alpha PNGs.
`ruid-map.json` records the MSW account resource-storage RUID for each final
sprite.

The window, title, tabs, slots, scrollbar, meso bar, tooltip panels, and action
buttons have resource-side pivot, point-filter, clamp, and 9-slice border
metadata. Close buttons, menu icons, the selection overlay, arrows, and the
equipment silhouette are rendered as simple sprites.

ImageGen prompt groups:

1. A 4x4 common UI atlas: window frame, title bar, close states, tab states,
   inventory/equipment slots, selection overlay, scrollbar parts, and meso bar.
2. A standalone pale blue-gray equipment silhouette on a magenta key.
3. A 3x3 dark navy tooltip atlas: frame, icon box, information panels, and
   primary button states.
4. A 2x2 rounded-square inventory/equipment menu icon atlas.
