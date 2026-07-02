from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(r"C:\Users\ghddj\Desktop\AI\MSW\GeneratedAssets\SlotMachineUI")
OUTPUT = ROOT / "wide" / "runtime"


def open_rgba(relative_path):
    return Image.open(ROOT / relative_path).convert("RGBA")


def stretch_center_x(image, target_width, left_keep, right_keep):
    if target_width <= image.width:
        return image.resize((target_width, image.height), Image.Resampling.LANCZOS)

    center_width = max(1, image.width - left_keep - right_keep)
    target_center_width = max(1, target_width - left_keep - right_keep)
    left = image.crop((0, 0, left_keep, image.height))
    center = image.crop((left_keep, 0, left_keep + center_width, image.height))
    right = image.crop((image.width - right_keep, 0, image.width, image.height))
    center = center.resize((target_center_width, image.height), Image.Resampling.LANCZOS)

    output = Image.new("RGBA", (target_width, image.height), (0, 0, 0, 0))
    output.alpha_composite(left, (0, 0))
    output.alpha_composite(center, (left_keep, 0))
    output.alpha_composite(right, (left_keep + target_center_width, 0))
    return output


def save_stretched(relative_path, output_name, target_width, left_keep, right_keep):
    source = open_rgba(relative_path)
    output = stretch_center_x(source, target_width, left_keep, right_keep)
    output.save(OUTPUT / output_name)
    print(f"{output_name}: {source.size} -> {output.size}")


def redistribute_reel_dividers(image):
    # The wide reel frame is built by stretching the original frame, but that
    # stretches divider positions unevenly. Preserve the generated gold art and
    # move only the center divider rods to the same boundaries used by the live
    # reel columns.
    output = image.copy()
    divider_top = 38
    divider_bottom = 264
    old_centers = [154.5, 314.5, 475.0, 635.0]
    target_centers = [170.5, 320.5, 470.5, 620.5]
    clear_half_width = 16
    paste_half_width = 10

    source_center = round(old_centers[2])
    divider_patch = image.crop(
        (
            source_center - paste_half_width,
            divider_top,
            source_center + paste_half_width,
            divider_bottom,
        )
    )

    transparent = Image.new("RGBA", output.size, (0, 0, 0, 0))
    for center in old_centers:
        x0 = max(0, round(center - clear_half_width))
        x1 = min(output.width, round(center + clear_half_width))
        output.paste(transparent.crop((x0, divider_top, x1, divider_bottom)), (x0, divider_top))

    for center in target_centers:
        x0 = round(center) - paste_half_width
        output.alpha_composite(divider_patch, (x0, divider_top))

    return output


def save_wide_reel_frame():
    source = open_rgba("layers/runtime/slot_layer_reel_window_frame.png")
    stretched = stretch_center_x(source, 791, 88, 88)
    output = redistribute_reel_dividers(stretched)
    output.save(OUTPUT / "slot_wide_reel_window_frame.png")
    print(f"slot_wide_reel_window_frame.png: {source.size} -> {output.size} with even divider spacing")


def draw_gem(draw, cx, cy, radius, fill=(45, 209, 255, 255), outline=(255, 220, 96, 255)):
    points = [(cx, cy - radius), (cx + radius, cy), (cx, cy + radius), (cx - radius, cy)]
    draw.polygon(points, fill=fill)
    draw.line(points + [points[0]], fill=outline, width=2)
    draw.line([(cx, cy - radius + 3), (cx + radius - 3, cy)], fill=(170, 245, 255, 190), width=1)


def make_title_ornament():
    size = (300, 28)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.line((22, 14, 124, 14), fill=(45, 210, 255, 95), width=3)
    gd.line((176, 14, 278, 14), fill=(45, 210, 255, 95), width=3)
    glow = glow.filter(ImageFilter.GaussianBlur(3))
    image.alpha_composite(glow)

    draw = ImageDraw.Draw(image)
    for offset, color, width in (
        (0, (82, 43, 5, 255), 5),
        (0, (240, 173, 43, 255), 3),
        (-1, (255, 234, 148, 230), 1),
    ):
        draw.line((22, 14 + offset, 122, 14 + offset), fill=color, width=width)
        draw.line((178, 14 + offset, 278, 14 + offset), fill=color, width=width)
    draw_gem(draw, 150, 14, 9)
    draw_gem(draw, 12, 14, 5, fill=(22, 152, 230, 255))
    draw_gem(draw, 288, 14, 5, fill=(22, 152, 230, 255))
    image.save(OUTPUT / "slot_wide_title_ornament.png")
    print(f"slot_wide_title_ornament.png: {size}")


def make_divider():
    size = (26, 94)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.line((13, 8, 13, 86), fill=(45, 210, 255, 90), width=5)
    glow = glow.filter(ImageFilter.GaussianBlur(4))
    image.alpha_composite(glow)

    draw = ImageDraw.Draw(image)
    draw.line((13, 8, 13, 86), fill=(82, 43, 5, 255), width=7)
    draw.line((13, 8, 13, 86), fill=(240, 173, 43, 255), width=4)
    draw.line((12, 10, 12, 84), fill=(255, 234, 148, 235), width=1)
    draw_gem(draw, 13, 47, 10)
    draw_gem(draw, 13, 11, 5, fill=(22, 152, 230, 255))
    draw_gem(draw, 13, 83, 5, fill=(22, 152, 230, 255))
    image.save(OUTPUT / "slot_wide_basebet_multiplier_divider.png")
    print(f"slot_wide_basebet_multiplier_divider.png: {size}")


def make_multiplier_selected_glow():
    size = (74, 72)
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((8, 10, 66, 62), radius=12, outline=(51, 221, 255, 210), width=7)
    glow = glow.filter(ImageFilter.GaussianBlur(5))
    image.alpha_composite(glow)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((12, 14, 62, 58), radius=10, outline=(255, 224, 92, 255), width=3)
    draw.rounded_rectangle((16, 18, 58, 54), radius=8, fill=(15, 73, 154, 210))
    image.save(OUTPUT / "slot_wide_multiplier_selected_glow.png")
    print(f"slot_wide_multiplier_selected_glow.png: {size}")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    save_stretched(
        "layers/runtime/slot_layer_cabinet_frame.png",
        "slot_wide_cabinet_frame.png",
        893,
        160,
        160,
    )
    save_wide_reel_frame()
    save_stretched(
        "bottom_split/runtime/slot_bottom_panel_empty.png",
        "slot_wide_bottom_panel_empty.png",
        791,
        92,
        92,
    )
    save_stretched(
        "bottom_split/runtime/slot_bottom_panel_wide_box.png",
        "slot_wide_bottom_panel_wide_box.png",
        340,
        48,
        48,
    )
    save_stretched(
        "sliced/casino_slot_ui_dropdown_list.png",
        "slot_wide_dropdown_list.png",
        380,
        48,
        48,
    )
    make_title_ornament()
    make_divider()
    make_multiplier_selected_glow()


if __name__ == "__main__":
    main()
