from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > threshold else 0).getbbox()
    if bbox is None:
        raise ValueError("Input image has no visible alpha pixels")
    return bbox


def keep_largest_alpha_component(image: Image.Image, threshold: int) -> Image.Image:
    width, height = image.size
    pixels = image.load()
    mask = bytearray(width * height)

    for y in range(height):
        row = y * width
        for x in range(width):
            if pixels[x, y][3] > threshold:
                mask[row + x] = 1

    seen = bytearray(width * height)
    best: list[int] = []

    for start, visible in enumerate(mask):
        if not visible or seen[start]:
            continue

        component: list[int] = []
        stack = [start]
        seen[start] = 1

        while stack:
            current = stack.pop()
            component.append(current)
            x = current % width
            y = current // width

            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or nx >= width or ny < 0 or ny >= height:
                    continue
                next_index = ny * width + nx
                if mask[next_index] and not seen[next_index]:
                    seen[next_index] = 1
                    stack.append(next_index)

        if len(component) > len(best):
            best = component

    keep = bytearray(width * height)
    for index in best:
        keep[index] = 1

    for y in range(height):
        row = y * width
        for x in range(width):
            index = row + x
            red, green, blue, alpha = pixels[x, y]
            if not keep[index] or alpha <= threshold:
                pixels[x, y] = (red, green, blue, 0)

    return image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--width", type=int, default=791)
    parser.add_argument("--height", type=int, default=350)
    parser.add_argument("--padding-x", type=int, default=0)
    parser.add_argument("--padding-y", type=int, default=0)
    parser.add_argument("--bbox-threshold", type=int, default=8)
    parser.add_argument("--component-threshold", type=int, default=24)
    args = parser.parse_args()

    source_path = Path(args.input)
    output_path = Path(args.output)
    image = Image.open(source_path).convert("RGBA")
    inner_width = args.width - args.padding_x * 2
    inner_height = args.height - args.padding_y * 2
    if inner_width <= 0 or inner_height <= 0:
        raise ValueError("Padding is larger than the output size")

    cropped = image.crop(alpha_bbox(image, args.bbox_threshold))
    resized = cropped.resize((inner_width, inner_height), Image.Resampling.LANCZOS)
    cleaned_inner = keep_largest_alpha_component(resized, args.component_threshold)
    cleaned = Image.new("RGBA", (args.width, args.height), (0, 0, 0, 0))
    cleaned.alpha_composite(cleaned_inner, (args.padding_x, args.padding_y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(output_path)

    alpha_extrema = cleaned.getchannel("A").getextrema()
    print(f"Wrote {output_path}")
    print(f"Size: {cleaned.size}, alpha: {alpha_extrema}")


if __name__ == "__main__":
    main()
