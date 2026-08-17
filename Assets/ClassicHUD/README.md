# Classic MMORPG HUD resource pack

- Full assembly reference: 1180 x 104. Current project runtime uses a compact 900 x 104 bottom-right layout with a 20 px safe margin so it does not overlap the left slot-machine panel.
- Runtime character zone: 228 px fixed. Gauge zone ends at x=544. The rightmost 328 px is reserved for up to three menu buttons.
- Menu button: 104 x 84, 8 px gap, maximum 3. Initial runtime shows inventory only; no empty slots.
- 9-slice borders: HUD/character 12 px, gauge frame 8 px, button 8 px.
- Gauge fills keep 7 px endcaps and resize the center.
- Text and numbers are not baked into runtime resource PNGs. Preview text is demonstrative only.
- Editable originals are SVG files under source/. PNG exports are generated under png/.
