from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args():
    parser = argparse.ArgumentParser(
        description="Center a transparent UI asset on a padded canvas and validate expected symmetry."
    )
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--aspect-width", type=float, required=True)
    parser.add_argument("--aspect-height", type=float, required=True)
    parser.add_argument("--padding", type=int, default=32)
    parser.add_argument("--alpha-threshold", type=int, default=32)
    parser.add_argument(
        "--chroma-green",
        action="store_true",
        help="Convert a generated green-screen background to transparency before normalization.",
    )
    parser.add_argument("--max-alpha-mirror-delta", type=float, default=None)
    return parser.parse_args()


def chroma_green_to_alpha(image: Image.Image) -> Image.Image:
    result = image.copy()
    pixels = result.load()
    for y in range(result.height):
        for x in range(result.width):
            red, green, blue, alpha = pixels[x, y]
            dominance = green - max(red, blue)
            if green >= 80 and dominance >= 20:
                key = min(1.0, (dominance - 20) / 55)
                alpha = round(alpha * (1.0 - key))
                green = min(green, max(red, blue))
                pixels[x, y] = (red, green, blue, alpha)
    return result


def alpha_mirror_delta(image: Image.Image, threshold: int) -> float:
    alpha = image.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    mismatch = 0
    coverage = 0
    for x in range(width):
        mirror_x = width - 1 - x
        for y in range(height):
            left = pixels[x, y] > threshold
            right = pixels[mirror_x, y] > threshold
            mismatch += 1 if left != right else 0
            coverage += int(left) + int(right)
    return mismatch / max(1, coverage)


def main():
    args = parse_args()
    source = Image.open(args.input).convert("RGBA")
    if args.chroma_green:
        source = chroma_green_to_alpha(source)
    alpha = source.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > args.alpha_threshold else 0).getbbox()
    if bbox is None:
        raise SystemExit(f"Asset is fully transparent: {args.input}")

    subject = source.crop(bbox)
    min_width = subject.width + (args.padding * 2)
    min_height = subject.height + (args.padding * 2)
    aspect = args.aspect_width / args.aspect_height
    canvas_width = max(min_width, round(min_height * aspect))
    canvas_height = max(min_height, round(canvas_width / aspect))
    if canvas_width / canvas_height < aspect:
        canvas_width = round(canvas_height * aspect)

    canvas = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
    offset = ((canvas_width - subject.width) // 2, (canvas_height - subject.height) // 2)
    canvas.alpha_composite(subject, offset)

    normalized_bbox = canvas.getchannel("A").point(
        lambda value: 255 if value > args.alpha_threshold else 0
    ).getbbox()
    center_error = (
        abs(((normalized_bbox[0] + normalized_bbox[2]) * 0.5) - (canvas_width * 0.5)),
        abs(((normalized_bbox[1] + normalized_bbox[3]) * 0.5) - (canvas_height * 0.5)),
    )
    if max(center_error) > 0.5:
        raise SystemExit(f"Normalized alpha bounds are not centered: error={center_error}")

    mirror_delta = alpha_mirror_delta(canvas, args.alpha_threshold)
    if args.max_alpha_mirror_delta is not None and mirror_delta > args.max_alpha_mirror_delta:
        raise SystemExit(
            f"Expected symmetric asset is visually asymmetric: delta={mirror_delta:.4f}, "
            f"max={args.max_alpha_mirror_delta:.4f}"
        )

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output)
    margins = (
        normalized_bbox[0],
        normalized_bbox[1],
        canvas_width - normalized_bbox[2],
        canvas_height - normalized_bbox[3],
    )
    print(
        f"Wrote {output} size={canvas.size} margins={margins} "
        f"centerError={center_error} alphaMirrorDelta={mirror_delta:.4f}"
    )


if __name__ == "__main__":
    main()
