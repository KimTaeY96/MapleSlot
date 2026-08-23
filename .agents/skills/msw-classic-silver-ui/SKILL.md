---
name: msw-classic-silver-ui
description: Build or refactor MapleSlot RPG information windows such as skills, equipment, inventory, quests, and character panels using the project's custom classic silver UI language. Use for silver framed system windows, tier tabs, compact lists, slot panels, dark blue tooltips, and orange actions. Never route this project through msw-simple-black-game-ui.
---

# MapleSlot Classic Silver UI

Use this skill after `msw-general` and `msw-ui-system` whenever a MapleSlot RPG information window is created or materially changed.

Read [references/style-contract.md](references/style-contract.md) in full before authoring the UI.

## Workflow

1. Inspect the current target UI hierarchy and any related runtime controller.
2. Preserve existing combat, save, data, and UI controller ownership; extend rather than duplicate.
3. Generate every `.ui` change through `msw_ui_builder.cjs`.
4. Apply the classic-silver contract to the target window and its attached panels.
5. Keep read-only informational text at least 10 px from panel inner borders.
6. Verify with UIBuilder lint, a structural test, and a Maker screenshot when runtime access is available.
7. Do not restyle unrelated asset-authored casino or HUD screens unless the user explicitly includes them.

## Hard rules

- Do not load or imitate `msw-simple-black-game-ui`.
- Do not copy third-party logos, characters, icons, or proprietary frame sheets.
- Use replaceable project RUIDs or original placeholder glyph/icon treatments.
- Tooltips must not intercept pointer events.
- Action buttons use orange; informational headers use blue; frame structure uses layered silver.
- A footer may contain only actions required by the feature specification.
