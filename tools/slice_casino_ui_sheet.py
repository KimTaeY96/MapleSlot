from pathlib import Path
from PIL import Image


SOURCE = Path(r"C:\Users\ghddj\Desktop\AI\MSW\GeneratedAssets\SlotMachineUI\casino_slot_ui_sheet_raw.png")
OUT_DIR = Path(r"C:\Users\ghddj\Desktop\AI\MSW\GeneratedAssets\SlotMachineUI\sliced")
KEY = (255, 0, 255)


ASSETS = {
    "casino_slot_ui_main_panel.png": (14, 24, 524, 594),
    "casino_slot_ui_reel_frame.png": (542, 52, 1102, 384),
    "casino_slot_ui_hud_panel.png": (1126, 60, 1516, 202),
    "casino_slot_ui_currency_bar.png": (1118, 234, 1512, 326),
    "casino_slot_ui_dropdown.png": (1128, 368, 1492, 432),
    "casino_slot_ui_dropdown_list.png": (1138, 428, 1496, 612),
    "casino_slot_ui_cell_blue.png": (544, 424, 700, 578),
    "casino_slot_ui_cell_gold.png": (736, 424, 894, 578),
    "casino_slot_ui_cell_cyan.png": (928, 424, 1088, 578),
    "casino_slot_ui_divider.png": (40, 628, 1040, 654),
    "casino_slot_ui_button_blue.png": (38, 676, 334, 758),
    "casino_slot_ui_button_purple.png": (378, 676, 678, 758),
    "casino_slot_ui_button_green.png": (716, 676, 1028, 758),
    "casino_slot_ui_button_blue_selected.png": (36, 786, 334, 878),
    "casino_slot_ui_button_purple_selected.png": (378, 786, 678, 878),
    "casino_slot_ui_button_green_selected.png": (716, 786, 1028, 878),
    "casino_slot_ui_button_blue_disabled.png": (38, 904, 334, 984),
    "casino_slot_ui_button_purple_disabled.png": (378, 904, 678, 984),
    "casino_slot_ui_button_green_disabled.png": (716, 904, 1028, 984),
    "casino_slot_ui_win_glow.png": (1056, 668, 1506, 970),
}


def chroma_to_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Generated key backgrounds are visually flat but have compression
            # and antialiasing variance, so classify strong magenta broadly.
            if r > 180 and b > 170 and g < 105:
                pixels[x, y] = (r, g, b, 0)
                continue
            distance = abs(r - KEY[0]) + abs(g - KEY[1]) + abs(b - KEY[2])
            if distance < 150:
                pixels[x, y] = (r, g, b, 0)
            elif distance < 260:
                alpha = int(a * (distance - 150) / 110)
                pixels[x, y] = (r, g, b, alpha)
    return rgba


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE)
    for name, box in ASSETS.items():
        crop = source.crop(box)
        output = chroma_to_alpha(crop)
        output.save(OUT_DIR / name)
    print(f"Wrote {len(ASSETS)} assets to {OUT_DIR}")


if __name__ == "__main__":
    main()
