# Slot Resource Table Input Prompt

## Purpose
Use this prompt when filling slot symbol resources in Excel. The goal is to connect each reel stop cell to:

- an idle/static display resource used during normal reel display
- a win animation resource used when the cell is part of a winning payline

## Prompt

You are helping me fill MapleStory Worlds slot-machine resource tables.

Use MSW official resources first. Search resources with `asset_search_resources` and prefer `source = "maplestory"`.

For each slot symbol or reel cell:

1. Search idle resources.
   - Use `cat = "sprite,animationclip"` when unsure.
   - Use partial queries such as `*slime`, `*mushroom`, `*pig`, `*golem`, `*pinkbean`.
   - For normal reel display, prefer a readable standing/idle sprite or a subtle idle animationclip.
   - Copy only the RUID into `IdleSpriteRuid`.

2. Search win animation resources.
   - Use `cat = "animationclip"` first.
   - Prefer action clips that read well inside a small slot cell: `stand`, `hit`, `attack`, `skill`, `special`, or monster-specific celebratory clips.
   - Copy only the RUID into `WinAnimationRuid`.

3. Fill the row by cell context.
   - `BaseBetRegionIndex`: which BaseBet region/town group this reel data belongs to.
   - `RegionName`: design-only helper for filtering.
   - `ReelNo`: 1 to 5 from left to right.
   - `StopIndex`: 1 to 30 inside that reel's logical strip.
   - `SymbolEnumId`: gameplay symbol identity such as `SLIME`, `MUSHROOM`, `PIG`, `GOLEM`, `PINK_BEAN`.
   - `IdleSpriteRuid`: normal cell resource.
   - `WinAnimationRuid`: winning cell animation resource.
   - `WinAnimationEnumId`: fallback/category label such as `BOUNCE`, `POP`, `WOBBLE`, `SHAKE`, `FLASH`.

4. Validate table shape.
   - Each BaseBet group must have 5 reels.
   - Each reel must have exactly 30 logical stop rows.
   - Total row count should be `BaseBet count * 5 * 30`.
   - Do not edit `ReelStripsIndex` manually unless regenerating all row indexes.

5. Resource selection rules.
   - Do not paste preview image URLs.
   - Do not paste local file paths.
   - Paste the MSW RUID string only.
   - Keep idle and win RUIDs separate even if they temporarily use the same resource.
   - If a resource is uncertain, leave a note in `Notes` instead of inventing an ID.

## Example MCP Searches

```text
asset_search_resources(cat="sprite,animationclip", query="*slime", source="maplestory", count=20, detail=true)
asset_search_resources(cat="animationclip", query="*pinkbean", source="maplestory", count=20, detail=true)
asset_search_resources(cat="animationclip", query="*golem", source="maplestory", count=20, detail=true)
```

## Current Table Contract

`ExcelTable/SlotMachine.xlsx / ReelStrips` is the cell-level source of truth.

BaseBet is a region/town type. Selecting a different BaseBet should switch to that region's reel strip data.

The runtime shape is:

```text
ReelStrips[BaseBetRegionIndex][ReelNo][StopIndex] -> SymbolEnumId
```

The later Excel importer should also apply:

```text
IdleSpriteRuid -> SpriteGUIRendererComponent.ImageRUID during normal display
WinAnimationRuid -> winning overlay SpriteGUIRendererComponent.ImageRUID
```
