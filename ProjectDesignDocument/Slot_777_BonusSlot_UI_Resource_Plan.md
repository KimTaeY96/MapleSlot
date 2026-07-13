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
- `Sprite_Bonus777LeverBase`
- `Sprite_Bonus777LeverArm`

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
| `bonus777SlotLeverBase` | Fixed mechanical housing aligned to the right black-crystal socket |
| `bonus777SlotLeverArmUp` | Moving arm sprite frame: default/up |
| `bonus777SlotLeverArmMidVertical` | Moving arm sprite frame: short vertical mid-pull |
| `bonus777SlotLeverArmDownVertical` | Moving arm sprite frame: vertical pulled/held-down state |

## Motion Rules

### Lever

The right lever is a sprite animation, not a transform-only effect.

1. The mechanical base remains fixed over the right black-crystal socket.
2. Idle arm: `bonus777SlotLeverArmUp`
3. Spin start: `bonus777SlotLeverArmUp -> bonus777SlotLeverArmMidVertical -> bonus777SlotLeverArmDownVertical`
4. Reels spinning: hold `bonus777SlotLeverArmDownVertical`
5. Just before result text appears: `bonus777SlotLeverArmDownVertical -> bonus777SlotLeverArmMidVertical -> bonus777SlotLeverArmUp`

The moving ball must travel from above the hinge to below it. Leftward or horizontal pull frames are not valid. Per-frame anchored positions keep the connector on one shared mechanical hinge point. The fixed base never changes RUID or transform, so only the rod and ball appear to move.

### Panel Alignment

- The reel window frame, reel-column backgrounds, and reel masks share the same inner-window center and opening dimensions.
- The result panel is `600 x 104`, fully opaque behind its two strings, with only compact top and bottom padding.
- The title badge is `540 x 90`, fully opaque behind the title string, and the string is centered in the badge interior.
- Do not add separate `Bg_TitleOpaque` or `Bg_ResultOpaque` sprites. The title and result artwork already owns those dark surfaces, and duplicate black sprites can cover the decorated panels in Screen UI draw order.

### Win VFX

- Every winning 777 bonus spin plays the configured full-screen spray animation once immediately after the reels stop and the `HIT` text is set.
- Misses do not play the spray animation.
- Completing or closing the 777 panel does not replay the spray animation. The normal main-slot threshold trigger remains available for non-bonus results.

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
