from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(r"C:\Users\ghddj\Desktop\AI\MSW")
SOURCE = PROJECT_ROOT / "GeneratedAssets" / "SlotMachineUI" / "bonus777" / "source" / "bonus777_slot_atlas_alpha.png"
OUT_DIR = PROJECT_ROOT / "GeneratedAssets" / "SlotMachineUI" / "bonus777" / "sliced"
STRUCTURE = PROJECT_ROOT / "GeneratedAssets" / "SlotMachineUI" / "bonus777" / "bonus777_slot_ui_structure.json"


ASSETS = {
    "bonus777_slot_reel_column_background": {
        "resourceKey": "bonus777SlotReelColumnBackground",
        "file": "bonus777_slot_reel_column_background.png",
        "rect": [739, 577, 903, 1005],
        "trim": True,
        "displaySize": [150, 260],
        "uiPosition": [0, 0],
    },
    "bonus777_slot_digit_cell": {
        "resourceKey": "bonus777SlotDigitCell",
        "file": "bonus777_slot_digit_cell.png",
        "rect": [694, 1028, 977, 1213],
        "trim": True,
        "displaySize": [118, 78],
        "uiPosition": [0, 0],
    },
    "bonus777_slot_lever_up": {
        "resourceKey": "bonus777SlotLeverUp",
        "file": "bonus777_slot_lever_up.png",
        "rect": [1018, 502, 1220, 717],
        "trim": False,
        "clearFrameGuide": True,
        "displaySize": [150, 158],
        "uiPosition": [392, 110],
    },
    "bonus777_slot_lever_mid": {
        "resourceKey": "bonus777SlotLeverMid",
        "file": "bonus777_slot_lever_mid.png",
        "rect": [1018, 734, 1220, 949],
        "trim": False,
        "clearFrameGuide": True,
        "displaySize": [150, 158],
        "uiPosition": [392, 110],
    },
    "bonus777_slot_lever_down": {
        "resourceKey": "bonus777SlotLeverDown",
        "file": "bonus777_slot_lever_down.png",
        "rect": [1018, 965, 1220, 1180],
        "trim": False,
        "clearFrameGuide": True,
        "displaySize": [150, 158],
        "uiPosition": [392, 110],
    },
}


EXTERNAL_ASSETS = {
    "bonus777_slot_frame_shell": {
        "resourceKey": "bonus777SlotFrameShellBalanced",
        "file": "bonus777_slot_frame_shell_balanced.png",
        "displaySize": [760, 734],
        "uiPosition": [0, 0],
    },
    "bonus777_slot_reel_window_frame": {
        "resourceKey": "bonus777SlotReelWindowFrameBalanced",
        "file": "bonus777_slot_reel_window_frame_balanced.png",
        "displaySize": [600, 400],
        "uiPosition": [0, 0],
    },
    "bonus777_slot_lever_base": {
        "resourceKey": "bonus777SlotLeverBase",
        "file": "bonus777_slot_lever_base.png",
        "displaySize": [180, 180],
        "uiPosition": [326, 14],
    },
    "bonus777_slot_lever_arm_up": {
        "resourceKey": "bonus777SlotLeverArmUp",
        "file": "bonus777_slot_lever_arm_up.png",
        "displaySize": [170, 170],
        "uiPosition": [326, 71],
    },
    "bonus777_slot_lever_arm_mid": {
        "resourceKey": "bonus777SlotLeverArmMidVertical",
        "file": "bonus777_slot_lever_arm_mid_vertical.png",
        "displaySize": [170, 170],
        "uiPosition": [329, -13],
    },
    "bonus777_slot_lever_arm_down": {
        "resourceKey": "bonus777SlotLeverArmDownVertical",
        "file": "bonus777_slot_lever_arm_down_vertical.png",
        "displaySize": [170, 170],
        "uiPosition": [329, -13],
    },
}


def alpha_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.getbbox()


def crop_asset(source: Image.Image, spec: dict) -> Image.Image:
    left, top, right, bottom = spec["rect"]
    crop = source.crop((left, top, right, bottom))
    if spec.get("clearFrameGuide", False):
        pixels = crop.load()
        edge = 18
        for y in range(crop.height):
            for x in range(crop.width):
                near_edge = x < edge or y < edge or x >= crop.width - edge or y >= crop.height - edge
                if near_edge:
                    r, g, b, a = pixels[x, y]
                    neutral_guide = max(r, g, b) - min(r, g, b) <= 42 and max(r, g, b) >= 20
                    outside_safe_edge = x < 2 or y < 2 or x >= crop.width - 2 or y >= crop.height - 2
                    if a > 0 and (neutral_guide or outside_safe_edge):
                        pixels[x, y] = (r, g, b, 0)
    if spec.get("trim", True):
        bbox = alpha_bbox(crop)
        if bbox:
            crop = crop.crop(bbox)
    return crop


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")

    metadata = {
        "source": str(SOURCE.relative_to(PROJECT_ROOT)).replace("\\", "/"),
        "atlasSize": {"width": source.width, "height": source.height},
        "slotRoot": {
            "name": "Panel_Bonus777SlotRoot",
            "rectSize": [900, 760],
            "uiScale": [1.0, 1.0],
            "position": [10, 0],
        },
        "resourceValidation": {
            "centeredAssets": [
                "bonus777_slot_frame_shell",
                "bonus777_slot_reel_window_frame",
            ],
            "symmetricAssets": [
                "bonus777_slot_frame_shell",
                "bonus777_slot_reel_window_frame",
            ],
            "minAlphaPadding": 8,
            "maxVisualCenterOffset": 1.0,
            "maxAlphaMirrorDelta": 0.02,
            "minReelWindowToShellRatio": [0.78, 0.53],
        },
        "reels": {
            "logicalDigitCount": 7,
            "visualCellCount": 11,
            "cellHeight": 88,
            "maskSize": [150, 260],
            "stripSize": [150, 968],
            "positions": [-160, 0, 0, 0, 160, 0],
            "digitCellSize": [118, 78],
            "digitTextSize": [106, 70],
            "maskSafePadding": 3,
            "maxFrameOverlapRatio": 0.02,
        },
        "assets": [],
    }

    for name, spec in ASSETS.items():
        image = crop_asset(source, spec)
        output_path = OUT_DIR / spec["file"]
        image.save(output_path)
        metadata["assets"].append(
            {
                "name": name,
                "resourceKey": spec["resourceKey"],
                "file": str(output_path.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                "sourceRect": spec["rect"],
                "size": {"width": image.width, "height": image.height},
                "displaySize": {
                    "width": spec["displaySize"][0],
                    "height": spec["displaySize"][1],
                },
                "uiPosition": {
                    "x": spec["uiPosition"][0],
                    "y": spec["uiPosition"][1],
                },
                "trimmed": bool(spec.get("trim", True)),
            }
        )

    for name, spec in EXTERNAL_ASSETS.items():
        output_path = OUT_DIR / spec["file"]
        image = Image.open(output_path).convert("RGBA")
        metadata["assets"].append(
            {
                "name": name,
                "resourceKey": spec["resourceKey"],
                "file": str(output_path.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                "sourceRect": [0, 0, image.width, image.height],
                "size": {"width": image.width, "height": image.height},
                "displaySize": {
                    "width": spec["displaySize"][0],
                    "height": spec["displaySize"][1],
                },
                "uiPosition": {
                    "x": spec["uiPosition"][0],
                    "y": spec["uiPosition"][1],
                },
                "trimmed": False,
            }
        )

    STRUCTURE.parent.mkdir(parents=True, exist_ok=True)
    STRUCTURE.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {STRUCTURE}")
    for asset in metadata["assets"]:
        print(f"{asset['resourceKey']}: {asset['file']} {asset['size']}")


if __name__ == "__main__":
    main()
