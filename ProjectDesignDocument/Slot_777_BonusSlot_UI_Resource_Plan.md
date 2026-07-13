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
- `Text_Bonus777Chance`
- `Text_Bonus777Result`
- `Sprite_Bonus777LeverBase`
- `Sprite_Bonus777LeverArm`

## Required Image Resources

The initial asset family is derived from one full ImageGen example atlas. A focused replacement may be generated separately only when the existing family is supplied as visual reference and the replacement passes the same transparency, center, symmetry, padding, and clipping checks.

| Resource Key | Purpose |
| --- | --- |
| `bonus777SlotFrameShellBalanced` | Center-normalized, symmetric cabinet shell with an integrated lower text field |
| `bonus777SlotReelWindowFrameBalanced` | Center-normalized symmetric gold front reel window frame and equal dividers |
| `bonus777SlotReelColumnBackground` | Interior backing behind each reel strip |
| `bonus777SlotDigitCell` | Repeated cell face behind dynamic digit text |
| `bonus777SlotLeverBaseCompact` | Compact navy-and-gold bearing plate aligned to the right black-crystal socket |
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

The fixed base must remain at or below `140x160`, use a centered circular bearing, and sit flush with the right pillar. A large protruding rectangular housing is not valid.

The lever arm uses UI-file `displayOrder=1000` and `OrderInLayer=1000`, above the fixed machine base. Every sprite-frame change also calls `_UILogic:SetSiblingIndex(leverTransform, 1000000)` so the moving arm remains in front at runtime. Do not assign `OverrideSorting` or `OrderInLayer` from mlua; they are serialized UI fields, not runtime script fields.

### Panel Alignment

- The reel window frame, reel-column backgrounds, and reel masks share the same inner-window center and opening dimensions.
- The validated reel window is `600x400` at local `y=0`; each live reel mask is `150x260` on that same axis.
- Each reel uses `88px` logical spacing and a `118x78` digit-cell rect. The front frame and live reels must fill the cabinet's upper inner cavity with comparable top and bottom inset.
- Validation rejects a front frame smaller than `78%` of the shell width or `53%` of the shell height, and rejects any reel whose local `y` center differs from the frame axis.
- The separate title badge, title string, and result-panel sprite do not exist.
- `Text_Chance` and `Text_Result` are centered directly inside the cabinet shell's integrated lower dark field.
- The lower field resource must not contain a center gemstone or any ornament behind either text line.
- Do not add separate `Bg_TitleOpaque`, `Bg_ResultOpaque`, `Sprite_TitleBadge`, or `Sprite_ResultPanel` nodes.

### Centered Resource Processing

- Any asset declared in `resourceValidation.centeredAssets` must use `uiPosition.x = 0` and have alpha-bounds center within `1px` of its image-canvas center.
- Any asset declared in `resourceValidation.symmetricAssets` must have left/right alpha-mask mirror delta no greater than `0.02`.
- Centered assets require at least `8px` of transparent alpha padding on every side; opaque pixels touching an image edge are a build failure.
- Run `tools/normalize_centered_ui_asset.py --chroma-green` for ImageGen green-screen output. It removes chroma, crops to the alpha subject, restores the declared aspect ratio, adds equal padding, centers the subject, and rejects unexpected asymmetry in one step.
- `tools/validate_bonus777_visual_safe_area.py` rechecks center, symmetry, padding, reel-mask fit, and visible-frame overlap before the UI layer validator can pass.

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
