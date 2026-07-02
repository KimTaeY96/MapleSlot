import sys
from pathlib import Path

from PIL import Image


def alpha_bbox(image: Image.Image, threshold: int = 8):
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def main() -> int:
    if len(sys.argv) != 5:
        print("Usage: postprocess_title_ornament.py <input.png> <output.png> <width> <height>")
        return 2

    source_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    target_width = int(sys.argv[3])
    target_height = int(sys.argv[4])

    source = Image.open(source_path).convert("RGBA")
    bbox = alpha_bbox(source)
    if bbox is None:
        raise RuntimeError(f"No non-transparent pixels found in {source_path}")

    left, top, right, bottom = bbox
    pad = 10
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(source.width, right + pad)
    bottom = min(source.height, bottom + pad)
    cropped = source.crop((left, top, right, bottom))

    fit_width = int(target_width * 0.94)
    fit_height = int(target_height * 0.82)
    scale = min(fit_width / cropped.width, fit_height / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", (target_width, target_height), (0, 0, 0, 0))
    x = (target_width - resized.width) // 2
    y = (target_height - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path)
    print(f"Wrote {output_path} ({target_width}x{target_height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
