# MapleSlot classic-silver UI contract

## Visual tokens

- Outer frame: deep silver-gray `#59636F`.
- Inner frame: pale silver `#E7EDF2`.
- Information header: blue `#08699D`; deep accent `#0A4773`.
- Primary/select action: orange `#F59A16`; pressed accent may darken toward `#B95A08`.
- Tooltip: dark navy `#061E35` with blue border `#0B3857`.
- Main text: near-white on dark surfaces and ink `#14202C` on silver surfaces.
- Compact list rows may alternate `#D8DEE3` and `#C8D0D7`.

## Layout

- Use a layered outer frame and inner frame instead of a single flat rectangle.
- Put the close action in the title bar.
- Place category/tier tabs directly below the title bar.
- Place a blue identity/section header below tabs.
- Use a compact vertical scroll list for dense RPG information.
- Attach auxiliary slot panels to the left and contextual tooltips to the right.
- Keep at least a 10 px visual gap between the main window, attached panel, and tooltip.
- Flip a tooltip to the left only when the right side cannot fit.
- Read-only informational glyphs must be at least 10 px from the panel's inner border.
- Button labels and title bars are exempt from the informational-text inset rule.

## Interaction

- Orange indicates the selected tab or the single primary action.
- Locked tabs remain visible, desaturated, and do not navigate.
- Hover/pointer-enter tooltips open immediately; pointer-exit closes immediately.
- Every tooltip sprite and text renderer sets `RaycastTarget=false`.
- Mouse and touch use the same `UITouch*` event flow.
- Drag failure restores the source visual and shows a short nearby reason.
- Cooldowns use a navy shade above the icon and an integer-second countdown.

## Asset policy

- Prefer original project assets. When unavailable, use a replaceable nine-slice plus colored glyph treatment.
- Placeholder icons must be isolated behind a stable definition field so a SpriteRUID can replace them later.
- Do not reproduce external trademarks, game logos, characters, or original skill icons.

## Verification checklist

- UIBuilder lint exits successfully.
- Panel hierarchy, footer actions, tab states, list rows, and slot count are asserted by a structural test.
- Attached panels do not overlap at the 1920×1080 reference canvas.
- Tooltip renderers are all non-raycast.
- Information-panel text has 10 px padding or an equivalent child inset.
- Runtime verification uses Maker play, logs, and a screenshot; never infer successful rendering from source alone.
