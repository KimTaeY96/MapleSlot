from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path("C:/Users/ghddj/Desktop/AI/MSW")
SOURCE = PROJECT_ROOT / "GeneratedAssets/SlotMachineUI/classic_example/source/classic_slot_machine_full_alpha.png"
OUT_DIR = PROJECT_ROOT / "GeneratedAssets/SlotMachineUI/classic_example/sliced"
STRUCTURE_PATH = PROJECT_ROOT / "GeneratedAssets/SlotMachineUI/classic_example/classic_slot_ui_structure.json"
SHEET_PATH = PROJECT_ROOT / "GeneratedAssets/SlotMachineUI/classic_example/classic_slot_resource_sheet.png"


CANVAS_SIZE = (1254, 1254)
CANVAS_CENTER = (CANVAS_SIZE[0] / 2, CANVAS_SIZE[1] / 2)


SLICES = [
    {
        "name": "classic_slot_full_composite",
        "node": "Panel_ClassicSlotMachine/Sprite_FullComposite_Reference",
        "rect": [87, 72, 1226, 1171],
        "purpose": "Reference-only full generated mockup.",
    },
    {
        "name": "classic_slot_frame_shell",
        "node": "Panel_ClassicSlotMachine/Sprite_FrameShell",
        "rect": [87, 72, 1226, 1171],
        "clear_rects": [[240, 320, 1014, 850]],
        "purpose": "Cabinet shell, top arch, outer gold frame, base, and lever with the reel viewport cleared.",
    },
    {
        "name": "classic_slot_reel_window_frame",
        "node": "Panel_ClassicSlotMachine/Sprite_ReelWindowFrame",
        "rect": [178, 300, 1044, 895],
        "clear_rects": [[255, 300, 475, 850], [517, 300, 739, 850], [778, 300, 1002, 850]],
        "purpose": "Gold reel-window frame and vertical divider structure.",
    },
    {
        "name": "classic_slot_reel_strip_1",
        "node": "Panel_ClassicSlotMachine/ReelMask_1/Sprite_ReelStrip",
        "rect": [257, 322, 475, 843],
        "purpose": "Left reel strip sample with fruit, 7, and cherry cells.",
    },
    {
        "name": "classic_slot_reel_strip_2",
        "node": "Panel_ClassicSlotMachine/ReelMask_2/Sprite_ReelStrip",
        "rect": [518, 322, 740, 843],
        "purpose": "Center reel strip sample with watermelon, 7, and bell cells.",
    },
    {
        "name": "classic_slot_reel_strip_3",
        "node": "Panel_ClassicSlotMachine/ReelMask_3/Sprite_ReelStrip",
        "rect": [779, 322, 1003, 843],
        "purpose": "Right reel strip sample with grapes, 7, and orange cells.",
    },
    {
        "name": "classic_slot_top_arch",
        "node": "Panel_ClassicSlotMachine/Sprite_TopArch",
        "rect": [196, 72, 1054, 320],
        "purpose": "Wooden top arch and gold crown frame.",
    },
    {
        "name": "classic_slot_top_emblem",
        "node": "Panel_ClassicSlotMachine/Sprite_TopEmblem",
        "rect": [415, 128, 832, 315],
        "purpose": "Central red-gem ornament for the top arch.",
    },
    {
        "name": "classic_slot_bottom_panel",
        "node": "Panel_ClassicSlotMachine/Sprite_BottomPanel",
        "rect": [221, 884, 1033, 1019],
        "purpose": "Wood and gold decorative bottom panel.",
    },
    {
        "name": "classic_slot_base_plinth",
        "node": "Panel_ClassicSlotMachine/Sprite_BasePlinth",
        "rect": [96, 1018, 1153, 1171],
        "purpose": "Heavy gold base plinth.",
    },
    {
        "name": "classic_slot_lever",
        "node": "Panel_ClassicSlotMachine/Sprite_Lever",
        "rect": [1047, 320, 1226, 774],
        "purpose": "Right-side lever assembly with red ball handle.",
    },
    {
        "name": "classic_slot_side_left",
        "node": "Panel_ClassicSlotMachine/Sprite_LeftSideCap",
        "rect": [87, 210, 263, 1046],
        "purpose": "Left side pillar and side cap.",
    },
    {
        "name": "classic_slot_side_right",
        "node": "Panel_ClassicSlotMachine/Sprite_RightSideCap",
        "rect": [994, 210, 1141, 1046],
        "purpose": "Right side pillar and side cap below the lever.",
    },
    {
        "name": "classic_slot_symbol_7",
        "node": "Panel_ClassicSlotMachine/Symbols/Sprite_Seven",
        "rect": [317, 515, 449, 704],
        "purpose": "Standalone red 7 symbol example.",
    },
]


def relative_ui_position(rect: list[int]) -> dict[str, float]:
    left, top, right, bottom = rect
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    return {
        "x": round(center_x - CANVAS_CENTER[0], 3),
        "y": round(CANVAS_CENTER[1] - center_y, 3),
    }


def trim_alpha(image: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    bbox = image.getbbox()
    if bbox is None:
        return image, (0, 0, image.width, image.height)
    return image.crop(bbox), bbox


def apply_clear_rects(canvas: Image.Image, clear_rects: list[list[int]]) -> None:
    empty = (0, 0, 0, 0)
    pixels = canvas.load()
    for left, top, right, bottom in clear_rects:
        for y in range(max(0, top), min(canvas.height, bottom)):
            for x in range(max(0, left), min(canvas.width, right)):
                pixels[x, y] = empty


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {
        "source": str(SOURCE.relative_to(PROJECT_ROOT)).replace("\\", "/"),
        "canvasSize": {"width": source.width, "height": source.height},
        "rootNode": "Panel_ClassicSlotMachine",
        "uiHierarchy": [
            "Panel_ClassicSlotMachine",
            "Panel_ClassicSlotMachine/Sprite_FrameShell",
            "Panel_ClassicSlotMachine/ReelMask_1/Sprite_ReelStrip",
            "Panel_ClassicSlotMachine/ReelMask_2/Sprite_ReelStrip",
            "Panel_ClassicSlotMachine/ReelMask_3/Sprite_ReelStrip",
            "Panel_ClassicSlotMachine/Sprite_ReelWindowFrame",
            "Panel_ClassicSlotMachine/Sprite_TopArch",
            "Panel_ClassicSlotMachine/Sprite_TopEmblem",
            "Panel_ClassicSlotMachine/Sprite_BottomPanel",
            "Panel_ClassicSlotMachine/Sprite_BasePlinth",
            "Panel_ClassicSlotMachine/Sprite_Lever",
        ],
        "assets": [],
    }

    for spec in SLICES:
        work = source.copy()
        apply_clear_rects(work, spec.get("clear_rects", []))
        left, top, right, bottom = spec["rect"]
        cropped = work.crop((left, top, right, bottom))
        trimmed, trim_box = trim_alpha(cropped)
        out_path = OUT_DIR / f"{spec['name']}.png"
        trimmed.save(out_path)

        trim_left, trim_top, trim_right, trim_bottom = trim_box
        final_rect = [
            left + trim_left,
            top + trim_top,
            left + trim_right,
            top + trim_bottom,
        ]
        manifest["assets"].append(
            {
                "name": spec["name"],
                "node": spec["node"],
                "file": str(out_path.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                "sourceRect": {"left": left, "top": top, "right": right, "bottom": bottom},
                "trimmedSourceRect": {
                    "left": final_rect[0],
                    "top": final_rect[1],
                    "right": final_rect[2],
                    "bottom": final_rect[3],
                },
                "size": {"width": trimmed.width, "height": trimmed.height},
                "uiPositionFromSourceCenter": relative_ui_position(final_rect),
                "purpose": spec["purpose"],
            }
        )

    STRUCTURE_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf8")
    write_contact_sheet(manifest)
    print(f"Wrote {len(SLICES)} sliced assets to {OUT_DIR}")
    print(f"Wrote structure manifest to {STRUCTURE_PATH}")
    print(f"Wrote contact sheet to {SHEET_PATH}")


def write_contact_sheet(manifest: dict) -> None:
    from PIL import ImageDraw

    cell_w = 360
    cell_h = 290
    cols = 3
    rows = (len(manifest["assets"]) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell_w, rows * cell_h), (245, 245, 245, 255))
    draw = ImageDraw.Draw(sheet)

    for index, asset in enumerate(manifest["assets"]):
        col = index % cols
        row = index // cols
        x = col * cell_w
        y = row * cell_h
        draw.rectangle([x, y, x + cell_w - 1, y + cell_h - 1], outline=(210, 210, 210, 255))
        draw.text((x + 14, y + 12), asset["name"], fill=(30, 30, 30, 255))
        draw.text((x + 14, y + 32), f"{asset['size']['width']}x{asset['size']['height']}", fill=(80, 80, 80, 255))
        image = Image.open(PROJECT_ROOT / asset["file"]).convert("RGBA")
        max_w = cell_w - 36
        max_h = cell_h - 70
        scale = min(max_w / image.width, max_h / image.height, 1.0)
        preview = image.resize((max(1, int(image.width * scale)), max(1, int(image.height * scale))), Image.LANCZOS)
        px = x + (cell_w - preview.width) // 2
        py = y + 58 + (max_h - preview.height) // 2
        checker = Image.new("RGBA", preview.size, (255, 255, 255, 255))
        cd = ImageDraw.Draw(checker)
        step = 16
        for cy in range(0, checker.height, step):
            for cx in range(0, checker.width, step):
                if ((cx // step) + (cy // step)) % 2 == 0:
                    cd.rectangle([cx, cy, cx + step - 1, cy + step - 1], fill=(225, 225, 225, 255))
        checker.alpha_composite(preview)
        sheet.alpha_composite(checker, (px, py))

    SHEET_PATH.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(SHEET_PATH)


if __name__ == "__main__":
    main()
