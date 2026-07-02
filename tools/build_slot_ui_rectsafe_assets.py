from pathlib import Path

from PIL import Image, ImageDraw


SRC = Path(r"C:\Users\ghddj\Desktop\AI\MSW\GeneratedAssets\SlotMachineUI\sliced\casino_slot_ui_integrated_cabinet.png")
OUT_DIR = Path(r"C:\Users\ghddj\Desktop\AI\MSW\GeneratedAssets\SlotMachineUI\sliced")


def crop(box):
    return Image.open(SRC).convert("RGBA").crop(box)


def resize_piece(image, size):
    return image.resize(size, Image.Resampling.LANCZOS)


def alpha_bbox(image):
    return image.getchannel("A").getbbox()


def trim(image, pad=0):
    bbox = alpha_bbox(image)
    if not bbox:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    return image.crop((left, top, right, bottom))


def paste_alpha(dst, src, xy):
    dst.alpha_composite(src, xy)


def make_backplate():
    target = Image.new("RGBA", (700, 820), (0, 0, 0, 0))
    draw = ImageDraw.Draw(target)

    # Opaque central fill keeps the world background from showing through the
    # cabinet while all ornate edges remain independent from live UI panels.
    draw.rounded_rectangle((70, 90, 630, 780), radius=26, fill=(5, 13, 54, 246))
    draw.rounded_rectangle((88, 122, 612, 712), radius=20, fill=(6, 19, 71, 235))

    center_ornament = crop((180, 225, 844, 510))
    center_ornament = resize_piece(center_ornament, (520, 224))
    center_ornament.putalpha(center_ornament.getchannel("A").point(lambda a: int(a * 0.72)))
    paste_alpha(target, center_ornament, (90, 126))

    top_arch = trim(crop((12, 30, 1010, 290)), 0)
    top_arch = resize_piece(top_arch, (700, 194))
    paste_alpha(target, top_arch, (0, 0))

    left_column = trim(crop((12, 54, 126, 1498)), 0)
    left_column = resize_piece(left_column, (100, 770))
    paste_alpha(target, left_column, (0, 36))

    right_column = trim(crop((898, 54, 1010, 1498)), 0)
    right_column = resize_piece(right_column, (100, 770))
    paste_alpha(target, right_column, (600, 36))

    # Cover frame/control remnants that were attached to the source columns.
    # The real reel frame and control panel are separate rect-safe UI nodes.
    draw.rounded_rectangle((96, 292, 604, 750), radius=4, fill=(5, 13, 54, 252))

    bottom_arc = trim(crop((230, 1462, 794, 1513)), 0)
    bottom_arc = resize_piece(bottom_arc, (516, 48))
    paste_alpha(target, bottom_arc, (92, 766))

    return target


def make_reel_frame():
    # The crop includes the full ornate frame plus a little safe transparent
    # padding, then gets packed into the exact UI rect used by ReelFrame_BG.
    frame = crop((64, 486, 960, 1028))
    return resize_piece(frame, (620, 368))


def make_reel_frame_clean():
    frame = make_reel_frame()
    draw = ImageDraw.Draw(frame)
    for y in range(28, 342):
        t = (y - 28) / 314.0
        r = int(2 + 6 * (1.0 - t))
        g = int(8 + 12 * (1.0 - abs(t - 0.45)))
        b = int(33 + 42 * (1.0 - abs(t - 0.35)))
        draw.line((58, y, 562, y), fill=(r, g, b, 255))
    return frame


def make_controls_panel():
    panel = crop((74, 1060, 954, 1302))
    return resize_piece(panel, (620, 120))


def make_controls_panel_clean():
    panel = make_controls_panel()
    draw = ImageDraw.Draw(panel)
    for y in range(22, 98):
        t = (y - 22) / 76.0
        r = int(8 + 8 * (1.0 - t))
        g = int(12 + 10 * (1.0 - abs(t - 0.45)))
        b = int(45 + 34 * (1.0 - abs(t - 0.45)))
        draw.line((26, y, 594, y), fill=(r, g, b, 252))
    return panel


def make_spin_button():
    button = trim(crop((286, 1322, 738, 1448)), 4)
    return resize_piece(button, (304, 80))


def save(name, image):
    path = OUT_DIR / name
    image.save(path)
    bbox = alpha_bbox(image)
    print(f"{name}: size={image.size} bbox={bbox} bytes={path.stat().st_size}")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    save("casino_slot_ui_cabinet_backplate_rectsafe.png", make_backplate())
    save("casino_slot_ui_reel_frame_rectsafe.png", make_reel_frame())
    save("casino_slot_ui_reel_frame_clean_rectsafe.png", make_reel_frame_clean())
    save("casino_slot_ui_controls_panel_rectsafe.png", make_controls_panel())
    save("casino_slot_ui_controls_panel_clean_rectsafe.png", make_controls_panel_clean())
    save("casino_slot_ui_button_green_rectsafe.png", make_spin_button())


if __name__ == "__main__":
    main()
