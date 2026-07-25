from __future__ import annotations

import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "Assets" / "GeneratedUI" / "MaplePung"


def remove_chroma(image: Image.Image, key: tuple[int, int, int]) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            distance = math.sqrt(
                (r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2
            )
            if distance <= 120:
                alpha = 0
            elif distance < 200:
                alpha = round(a * (distance - 120) / 80)
            else:
                alpha = a

            if alpha > 0 and key == (0, 255, 0) and g > max(r, b):
                g = max(r, b)
            if alpha > 0 and key == (255, 0, 255) and r > g and b > g:
                neutral = max(g, min(r, b))
                r = neutral
                b = neutral
            pixels[x, y] = (r, g, b, alpha)
    return rgba


def keep_largest_component(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    pixels = alpha.load()
    visited: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []
    for y in range(image.height):
        for x in range(image.width):
            if pixels[x, y] <= 24 or (x, y) in visited:
                continue
            stack = [(x, y)]
            visited.add((x, y))
            component: list[tuple[int, int]] = []
            while stack:
                current_x, current_y = stack.pop()
                component.append((current_x, current_y))
                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                ):
                    if (
                        0 <= next_x < image.width
                        and 0 <= next_y < image.height
                        and (next_x, next_y) not in visited
                        and pixels[next_x, next_y] > 24
                    ):
                        visited.add((next_x, next_y))
                        stack.append((next_x, next_y))
            components.append(component)
    if not components:
        return image
    keep = set(max(components, key=len))
    output = image.copy()
    output_pixels = output.load()
    for y in range(output.height):
        for x in range(output.width):
            if (x, y) not in keep:
                r, g, b, _ = output_pixels[x, y]
                output_pixels[x, y] = (r, g, b, 0)
    return output

def trim(image: Image.Image, padding: int = 4) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Generated asset became fully transparent")
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def split_atlas(
    source_name: str,
    columns: int,
    rows: int,
    names: list[str],
    key: tuple[int, int, int] = (0, 255, 0),
    gutter_trim: int = 16,
) -> None:
    source = Image.open(ASSET_DIR / source_name).convert("RGBA")
    if len(names) != columns * rows:
        raise ValueError("Atlas name count does not match grid dimensions")
    cell_width = source.width / columns
    cell_height = source.height / rows
    for index, name in enumerate(names):
        column = index % columns
        row = index // columns
        left = round(column * cell_width) + gutter_trim
        top = round(row * cell_height) + gutter_trim
        right = round((column + 1) * cell_width) - gutter_trim
        bottom = round((row + 1) * cell_height) - gutter_trim
        cell = source.crop((left, top, right, bottom))
        final = trim(keep_largest_component(remove_chroma(cell, key)))
        final.save(ASSET_DIR / f"{name}.png")


def process_silhouette() -> None:
    source = Image.open(ASSET_DIR / "equipment-silhouette-source.png")
    final = trim(remove_chroma(source, (255, 0, 255)), padding=8)
    final.save(ASSET_DIR / "equipment-silhouette.png")


def validate() -> None:
    failures: list[str] = []
    for path in sorted(ASSET_DIR.glob("*.png")):
        if path.name.endswith("-source.png"):
            continue
        image = Image.open(path)
        if image.mode != "RGBA":
            failures.append(f"{path.name}: mode={image.mode}")
            continue
        alpha = image.getchannel("A")
        extrema = alpha.getextrema()
        if extrema[0] != 0:
            failures.append(f"{path.name}: no transparent pixels")
        if extrema[1] == 0:
            failures.append(f"{path.name}: fully transparent")
        print(f"{path.name}: {image.width}x{image.height}, alpha={extrema}")
    if failures:
        raise SystemExit("\n".join(failures))


def main() -> None:
    split_atlas(
        "common-atlas-source.png",
        4,
        4,
        [
            "window-frame",
            "title-bar",
            "close-normal",
            "close-hover",
            "close-pressed",
            "tab-inactive",
            "tab-active",
            "tab-hover",
            "slot-inventory",
            "slot-equipment",
            "slot-selection",
            "scroll-track",
            "scroll-handle",
            "scroll-up",
            "scroll-down",
            "meso-bar",
        ],
    )
    split_atlas(
        "tooltip-atlas-source.png",
        3,
        3,
        [
            "tooltip-frame",
            "tooltip-icon-box",
            "tooltip-job-strip",
            "tooltip-description-panel",
            "tooltip-stats-panel",
            "tooltip-table-panel",
            "action-normal",
            "action-hover",
            "action-pressed",
        ],
        gutter_trim=12,
    )
    split_atlas(
        "menu-icons-atlas-source.png",
        2,
        2,
        [
            "inventory-menu-normal",
            "equipment-menu-normal",
            "inventory-menu-hover",
            "equipment-menu-hover",
        ],
    )
    process_silhouette()
    validate()


if __name__ == "__main__":
    main()
