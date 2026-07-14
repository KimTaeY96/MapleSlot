from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = PROJECT_ROOT / "GeneratedAssets" / "SlotMachineUI" / "currency_hud"
SOURCE_PATH = ASSET_DIR / "source" / "slot_currency_hud_minimal_imagegen_alpha.png"
OUTPUT_PATH = ASSET_DIR / "runtime" / "slot_currency_hud_minimal.png"

TARGET_SIZE = (740, 88)
CONTENT_SIZE = (732, 80)
CONTENT_OFFSET = (4, 4)
ALPHA_THRESHOLD = 16


def threshold_alpha(image: Image.Image) -> Image.Image:
    return image.getchannel("A").point(
        lambda alpha: 255 if alpha > ALPHA_THRESHOLD else 0,
    )


def main() -> None:
    source = Image.open(SOURCE_PATH).convert("RGBA")
    mask = threshold_alpha(source)
    bbox = mask.getbbox()
    if bbox is None:
        raise RuntimeError("Currency HUD source contains no visible pixels.")

    left, top, right, bottom = bbox
    if min(left, top, source.width - right, source.height - bottom) < 8:
        raise RuntimeError(f"Currency HUD source is clipped or lacks safe padding: bbox={bbox}.")

    source_center_x = (left + right) / 2.0
    center_error = abs(source_center_x - (source.width / 2.0))
    if center_error > source.width * 0.01:
        raise RuntimeError(f"Currency HUD source is not horizontally centered: error={center_error:.2f}px.")

    cropped = source.crop(bbox)
    resized = cropped.resize(CONTENT_SIZE, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    output.alpha_composite(resized, CONTENT_OFFSET)

    output_mask = threshold_alpha(output)
    output_bbox = output_mask.getbbox()
    expected_bbox = (
        CONTENT_OFFSET[0],
        CONTENT_OFFSET[1],
        CONTENT_OFFSET[0] + CONTENT_SIZE[0],
        CONTENT_OFFSET[1] + CONTENT_SIZE[1],
    )
    if output_bbox != expected_bbox:
        raise RuntimeError(f"Unexpected output bounds: {output_bbox}; expected {expected_bbox}.")

    mirrored_mask = ImageOps.mirror(output_mask)
    symmetry_diff = ImageChops.difference(output_mask, mirrored_mask)
    differing_pixels = sum(count for value, count in enumerate(symmetry_diff.histogram()) if value != 0)
    symmetry_ratio = differing_pixels / (TARGET_SIZE[0] * TARGET_SIZE[1])
    if symmetry_ratio > 0.02:
        raise RuntimeError(f"Currency HUD alpha silhouette is asymmetric: ratio={symmetry_ratio:.4f}.")

    if any(output.getpixel(point)[3] != 0 for point in [(0, 0), (739, 0), (0, 87), (739, 87)]):
        raise RuntimeError("Currency HUD output corners must be transparent.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    output.save(OUTPUT_PATH)
    print(
        f"Wrote {OUTPUT_PATH} size={output.size} bbox={output_bbox} "
        f"centerError={center_error:.2f}px symmetryRatio={symmetry_ratio:.4f}"
    )


if __name__ == "__main__":
    main()
