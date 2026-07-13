from __future__ import annotations

from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = PROJECT_ROOT / "GeneratedAssets" / "CoinAnimation"
SOURCE_SHEET = ASSET_DIR / "source" / "mileage_coin_spin_imagegen_sheet_alpha.png"
FRAME_DIR = ASSET_DIR / "frames"

FRAME_COUNT = 4
FRAME_MS = 150
CANVAS_SIZE = (32, 32)
TARGET_HEIGHT = 29
EXPECTED_WIDTH_RANGES = ((23, 27), (28, 31), (22, 27), (7, 10))


def alpha_bbox(image: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").point(lambda alpha: 255 if alpha > threshold else 0).getbbox()
    if bbox is None:
        raise RuntimeError("Generated coin frame contains no visible pixels.")
    return bbox


def make_frame(cell: Image.Image, frame_index: int) -> Image.Image:
    cropped = cell.crop(alpha_bbox(cell))
    target_width = max(1, round(cropped.width * TARGET_HEIGHT / cropped.height))
    low, high = EXPECTED_WIDTH_RANGES[frame_index]
    if not low <= target_width <= high:
        raise RuntimeError(
            f"Frame {frame_index + 1} width {target_width}px is outside expected range {low}-{high}px."
        )

    sprite = cropped.resize((target_width, TARGET_HEIGHT), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    left = (CANVAS_SIZE[0] - target_width) // 2
    top = (CANVAS_SIZE[1] - TARGET_HEIGHT) // 2
    canvas.alpha_composite(sprite, (left, top))
    return canvas


def save_sheet(frames: list[Image.Image]) -> Path:
    output = ASSET_DIR / "mileage_coin_spin_sheet_4f.png"
    sheet = Image.new("RGBA", (CANVAS_SIZE[0] * FRAME_COUNT, CANVAS_SIZE[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * CANVAS_SIZE[0], 0))
    sheet.save(output)
    return output


def save_apng(frames: list[Image.Image]) -> Path:
    output = ASSET_DIR / "mileage_coin_spin_4f.png"
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_MS,
        loop=0,
        disposal=2,
        blend=0,
        optimize=False,
    )
    return output


def save_gif(frames: list[Image.Image]) -> Path:
    output = ASSET_DIR / "mileage_coin_spin_4f.gif"
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_MS,
        loop=0,
        disposal=2,
        transparency=0,
        optimize=False,
    )
    return output


def main() -> None:
    if not SOURCE_SHEET.exists():
        raise FileNotFoundError(SOURCE_SHEET)

    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE_SHEET).convert("RGBA")
    if source.width % FRAME_COUNT != 0:
        raise RuntimeError(f"Source sheet width {source.width}px is not divisible by {FRAME_COUNT}.")

    cell_width = source.width // FRAME_COUNT
    frames = []
    for index in range(FRAME_COUNT):
        cell = source.crop((index * cell_width, 0, (index + 1) * cell_width, source.height))
        frame = make_frame(cell, index)
        frame_path = FRAME_DIR / f"mileage_coin_spin_frame_{index + 1:02d}.png"
        frame.save(frame_path)
        frames.append(frame)
        bbox = alpha_bbox(frame)
        print(f"Frame {index + 1}: {frame_path.name}, bbox={bbox}, size={bbox[2] - bbox[0]}x{bbox[3] - bbox[1]}")

    sheet_path = save_sheet(frames)
    apng_path = save_apng(frames)
    gif_path = save_gif(frames)
    print(f"Wrote {sheet_path}")
    print(f"Wrote {apng_path} ({FRAME_COUNT} frames, {FRAME_MS}ms each)")
    print(f"Wrote {gif_path} ({FRAME_COUNT} frames, {FRAME_MS}ms each)")


if __name__ == "__main__":
    main()
