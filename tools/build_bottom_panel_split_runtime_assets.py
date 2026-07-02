from pathlib import Path

from PIL import Image


STAGING_DIR = Path(r"C:\Users\ghddj\Documents\MSW\staging\bottom_panel_split\runtime")

SOURCES = {
    "slot_bottom_panel_empty": Path(
        r"C:\Users\ghddj\.codex\generated_images\019e9c01-d2d0-7623-a1dd-4b51ab9f4a1b\ig_026f9f00577d59e4016a3bc8d6fc248191957946427ece30ae.png"
    ),
    "slot_bottom_panel_wide_box": Path(
        r"C:\Users\ghddj\.codex\generated_images\019e9c01-d2d0-7623-a1dd-4b51ab9f4a1b\ig_026f9f00577d59e4016a3bc9716d5c8191a1af3a0d8d3b61b0.png"
    ),
    "slot_bottom_panel_small_box": Path(
        r"C:\Users\ghddj\.codex\generated_images\019e9c01-d2d0-7623-a1dd-4b51ab9f4a1b\ig_01776ab24e1175e0016a3bcc78e8cc8198b285bc3bbb5d6f0a.png"
    ),
}

TARGETS = {
    "slot_bottom_panel_empty": (620, 170),
    "slot_bottom_panel_wide_box": (250, 58),
    "slot_bottom_panel_small_box": (54, 56),
}


def chroma_to_alpha(image: Image.Image) -> Image.Image:
    src = image.convert("RGBA")
    pixels = src.load()
    width, height = src.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            magenta_like = r > 190 and b > 190 and g < 115
            soft_magenta = r > 150 and b > 150 and g < 150 and (r + b - g) > 360
            distance = ((r - 255) ** 2 + g**2 + (b - 255) ** 2) ** 0.5
            if magenta_like or distance <= 80:
                pixels[x, y] = (r, g, b, 0)
            elif soft_magenta or distance <= 145:
                alpha = int(a * min(1.0, max(0.0, (distance - 80) / 65)))
                pixels[x, y] = (r, g, b, alpha)
    return src


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 24 else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("image became fully transparent")
    return bbox


def crop_with_padding(image: Image.Image, padding: int) -> Image.Image:
    left, top, right, bottom = alpha_bbox(image)
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def fit_to_canvas(image: Image.Image, size: tuple[int, int], padding: int) -> Image.Image:
    canvas_w, canvas_h = size
    max_w = canvas_w - padding * 2
    max_h = canvas_h - padding * 2
    scale = min(max_w / image.width, max_h / image.height)
    resized = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((canvas_w - resized.width) // 2, (canvas_h - resized.height) // 2))
    return canvas


def build_contact_sheet(outputs: list[Path]) -> None:
    previews = []
    for path in outputs:
        image = Image.open(path).convert("RGBA")
        checker = Image.new("RGBA", image.size, (28, 28, 36, 255))
        checker.alpha_composite(image)
        previews.append((path.stem, checker))

    width = max(image.width for _, image in previews)
    height = sum(image.height + 28 for _, image in previews) + 12
    sheet = Image.new("RGBA", (width + 24, height), (16, 16, 22, 255))
    y = 12
    for name, image in previews:
        sheet.alpha_composite(image, (12, y))
        y += image.height + 28
    sheet.save(STAGING_DIR / "bottom_panel_split_preview.png")


def main() -> None:
    STAGING_DIR.mkdir(parents=True, exist_ok=True)
    outputs = []
    for key, source in SOURCES.items():
        image = Image.open(source)
        transparent = chroma_to_alpha(image)
        cropped = crop_with_padding(transparent, 8)
        fitted = fit_to_canvas(cropped, TARGETS[key], 4)
        output = STAGING_DIR / f"{key}.png"
        fitted.save(output)
        outputs.append(output)
        print(f"{key}: source={image.size}, cropped={cropped.size}, output={fitted.size} -> {output}")
    build_contact_sheet(outputs)
    print(f"preview -> {STAGING_DIR / 'bottom_panel_split_preview.png'}")


if __name__ == "__main__":
    main()
