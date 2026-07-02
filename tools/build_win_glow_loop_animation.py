from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


PROJECT_ROOT = Path("C:/Users/ghddj/Desktop/AI/MSW")
ASSET_DIR = PROJECT_ROOT / "GeneratedAssets" / "SlotMachineUI" / "sliced"
SOURCE = ASSET_DIR / "casino_slot_ui_win_glow_imagegen_source.png"
OUT_FRAME0 = ASSET_DIR / "casino_slot_ui_win_glow_loop_frame0.png"
OUT_FRAME_PATTERN = "casino_slot_ui_win_glow_loop_frame{index}.png"
OUT_SHEET = ASSET_DIR / "casino_slot_ui_win_glow_loop_8f_sheet.png"
OUT_APNG = ASSET_DIR / "casino_slot_ui_win_glow_loop_8f.png"

FRAME_COUNT = 8
FRAME_MS = 125
TARGET_SIZE = (192, 164)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def chroma_to_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    key = (255, 0, 255)
    transparent_threshold = 55.0
    opaque_threshold = 210.0

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            distance = math.sqrt(
                (r - key[0]) * (r - key[0])
                + (g - key[1]) * (g - key[1])
                + (b - key[2]) * (b - key[2])
            )
            factor = clamp((distance - transparent_threshold) / (opaque_threshold - transparent_threshold), 0.0, 1.0)
            if factor <= 0.0:
                pixels[x, y] = (r, g, b, 0)
                continue

            # Reduce magenta fringe on antialiased edges without touching the gold body.
            if factor < 1.0 and b > g and r > g:
                b = int(b * factor + 40 * (1.0 - factor))
                r = int(r * factor + 255 * (1.0 - factor))
                g = int(g * factor + 170 * (1.0 - factor))
            pixels[x, y] = (r, g, b, int(a * factor))

    return image


def crop_and_resize(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        raise RuntimeError("No visible glow pixels after chroma-key removal.")
    image = image.crop(bbox)
    return image.resize(TARGET_SIZE, Image.Resampling.LANCZOS)


def angular_distance(a: float, b: float) -> float:
    diff = abs((a - b + math.pi) % (math.pi * 2.0) - math.pi)
    return diff


def point_on_rect_path(t: float, width: int, height: int, margin: int = 14) -> tuple[float, float]:
    left = margin
    right = width - margin
    top = margin
    bottom = height - margin
    horizontal = right - left
    vertical = bottom - top
    perimeter = horizontal * 2 + vertical * 2
    distance = (t % 1.0) * perimeter

    if distance < horizontal:
        return left + distance, top
    distance -= horizontal
    if distance < vertical:
        return right, top + distance
    distance -= vertical
    if distance < horizontal:
        return right - distance, bottom
    distance -= horizontal
    return left, bottom - distance


def add_comet(frame: Image.Image, t: float) -> Image.Image:
    width, height = frame.size
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    for tail in range(5):
        px, py = point_on_rect_path(t - tail * 0.025, width, height)
        radius = 11 - tail * 1.5
        alpha = int(150 * (1.0 - tail / 6.0))
        draw.ellipse(
            (px - radius, py - radius, px + radius, py + radius),
            fill=(255, 245, 145, alpha),
        )

    px, py = point_on_rect_path(t, width, height)
    draw.ellipse((px - 5, py - 5, px + 5, py + 5), fill=(255, 255, 255, 230))
    overlay = overlay.filter(ImageFilter.GaussianBlur(1.2))
    return Image.alpha_composite(frame, overlay)


def make_frame(base: Image.Image, frame_index: int) -> Image.Image:
    phase = (frame_index / FRAME_COUNT) * math.pi * 2.0
    width, height = base.size
    cx = (width - 1) / 2.0
    cy = (height - 1) / 2.0

    source = base.convert("RGBA")
    pixels = source.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue

            angle = math.atan2(y - cy, x - cx)
            head = math.exp(-(angular_distance(angle, phase) ** 2) / (2 * 0.34 * 0.34))
            tail = math.exp(-(angular_distance(angle, phase - 0.70) ** 2) / (2 * 0.55 * 0.55))
            brightness = 0.58 + head * 0.72 + tail * 0.25
            alpha_scale = 0.62 + head * 0.42 + tail * 0.18
            pixels[x, y] = (
                int(clamp(r * brightness, 0, 255)),
                int(clamp(g * brightness, 0, 255)),
                int(clamp(b * brightness, 0, 255)),
                int(clamp(a * alpha_scale, 0, 255)),
            )

    return add_comet(source, frame_index / FRAME_COUNT)


def save_sheet(frames: list[Image.Image]) -> None:
    width, height = frames[0].size
    sheet = Image.new("RGBA", (width * len(frames), height), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * width, 0))
    sheet.save(OUT_SHEET)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    base = crop_and_resize(chroma_to_alpha(Image.open(SOURCE)))
    frames = [make_frame(base, index) for index in range(FRAME_COUNT)]
    frames[0].save(OUT_FRAME0)
    for index, frame in enumerate(frames, start=1):
        frame.save(ASSET_DIR / OUT_FRAME_PATTERN.format(index=index))
    save_sheet(frames)
    frames[0].save(
        OUT_APNG,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_MS,
        loop=0,
        disposal=2,
        optimize=False,
    )

    print(f"Wrote {OUT_FRAME0}")
    print(f"Wrote {OUT_SHEET}")
    print(f"Wrote {OUT_APNG} ({FRAME_COUNT} frames, {FRAME_MS * FRAME_COUNT} ms loop)")


if __name__ == "__main__":
    main()
