# 777 Bonus Slot UI Resource Plan

## Goal

The 777 bonus slot must reuse the existing bonus-slot logic, but replace the presentation resources with a dedicated slot-machine skin that matches the main slot UI tone.

Do not mix the old wood/parchment classic-stat UI tone with the current slot-machine scene. The new 777 slot should read as a compact bonus cabinet in the same visual family as the base slot:

- Deep navy and purple enamel surfaces
- Metallic gold trim and dividers
- Blue gem accents
- Sharp fantasy-casino silhouette
- No beige parchment, wood board, or old character-creation panel styling

## Runtime Hierarchy

`Panel_Bonus777_Hidden`

- `Dim_Bonus777`
- `Panel_Bonus777SlotRoot`
- `Sprite_Bonus777FrameShell`
- `Sprite_Bonus777ReelColumnBg_1`
- `Sprite_Bonus777ReelColumnBg_2`
- `Sprite_Bonus777ReelColumnBg_3`
- `Mask_Bonus777Reel_1`
- `Panel_Bonus777ReelStrip_1`
- `Sprite_Bonus777DigitCell_1_01` to `Sprite_Bonus777DigitCell_1_11`
- `Text_Bonus777Digit_1_01` to `Text_Bonus777Digit_1_11`
- `Mask_Bonus777Reel_2`
- `Panel_Bonus777ReelStrip_2`
- `Sprite_Bonus777DigitCell_2_01` to `Sprite_Bonus777DigitCell_2_11`
- `Text_Bonus777Digit_2_01` to `Text_Bonus777Digit_2_11`
- `Mask_Bonus777Reel_3`
- `Panel_Bonus777ReelStrip_3`
- `Sprite_Bonus777DigitCell_3_01` to `Sprite_Bonus777DigitCell_3_11`
- `Text_Bonus777Digit_3_01` to `Text_Bonus777Digit_3_11`
- `Sprite_Bonus777ReelWindowFrame`
- `Sprite_Bonus777TitleBadge`
- `Text_Bonus777Title`
- `Sprite_Bonus777ResultPanel`
- `Text_Bonus777Chance`
- `Text_Bonus777Result`
- `Sprite_Bonus777Lever`

## Required Image Resources

All generated raster assets must be transparent PNG slices derived from one full ImageGen example atlas.

| Resource Key | Purpose |
| --- | --- |
| `bonus777SlotFrameShell` | Main cabinet shell and backplate |
| `bonus777SlotReelWindowFrame` | Gold front reel window frame and dividers |
| `bonus777SlotReelColumnBackground` | Interior backing behind each reel strip |
| `bonus777SlotDigitCell` | Repeated cell face behind dynamic digit text |
| `bonus777SlotTitleBadge` | Decorative top title plaque without baked text |
| `bonus777SlotResultPanel` | Decorative lower result/chance panel without baked text |
| `bonus777SlotLeverUp` | Lever sprite frame: default/up |
| `bonus777SlotLeverMid` | Lever sprite frame: transition/mid-pull |
| `bonus777SlotLeverDown` | Lever sprite frame: pulled/held down |

## Motion Rules

### Lever

The right lever is a sprite animation, not a transform-only effect.

1. Idle: `bonus777SlotLeverUp`
2. Spin start: `bonus777SlotLeverUp -> bonus777SlotLeverMid -> bonus777SlotLeverDown`
3. Reels spinning: hold `bonus777SlotLeverDown`
4. Just before result text appears: `bonus777SlotLeverDown -> bonus777SlotLeverMid -> bonus777SlotLeverUp`

All lever frames must share the same padded canvas so swapping `ImageRUID` does not move or resize the lever.

### Reels

The reel animation must naturally stop on the already-decided result digits.

The runtime must not:

- Stop on arbitrary visible digits
- Then replace the stopped digits with the pre-decided result during the output phase

Instead, each reel plan calculates its target stop position before the spin starts and lands directly on that digit when the reel stops.

## Data Shape

The bonus slot keeps the existing data-driven result rules. Presentation-only values should stay in runtime/UI resource structure unless they are balance or tuning values already owned by Excel tables.

Expected current digit-strip shape:

- Logical digit count: 7
- Visual cells per reel strip: 11
- Visible rows: 3
- The center visible row is the pay/result row
