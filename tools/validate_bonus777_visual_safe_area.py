import json
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(r"C:\Users\ghddj\Desktop\AI\MSW")
STRUCTURE_PATH = PROJECT_ROOT / "GeneratedAssets" / "SlotMachineUI" / "bonus777" / "bonus777_slot_ui_structure.json"
FRAME_ALPHA_THRESHOLD = 32
LEVER_SAFE_MARGIN = 8


def load_structure():
    return json.loads(STRUCTURE_PATH.read_text(encoding="utf-8"))


def asset_map(structure):
    return {asset["name"]: asset for asset in structure["assets"]}


def ui_rect_to_canvas(slot_width, slot_height, center_x, center_y, width, height):
    return (
        round((slot_width * 0.5) + center_x - (width * 0.5)),
        round((slot_height * 0.5) - center_y - (height * 0.5)),
        round((slot_width * 0.5) + center_x + (width * 0.5)),
        round((slot_height * 0.5) - center_y + (height * 0.5)),
    )


def frame_overlap_ratio(frame_alpha, frame_origin, rect):
    frame_x, frame_y = frame_origin
    frame_w, frame_h = frame_alpha.size
    rect_x0, rect_y0, rect_x1, rect_y1 = rect
    total = max(0, rect_x1 - rect_x0) * max(0, rect_y1 - rect_y0)
    overlap = 0

    start_y = max(rect_y0, frame_y)
    end_y = min(rect_y1, frame_y + frame_h)
    start_x = max(rect_x0, frame_x)
    end_x = min(rect_x1, frame_x + frame_w)
    for y in range(start_y, end_y):
        for x in range(start_x, end_x):
            if frame_alpha.getpixel((x - frame_x, y - frame_y)) > FRAME_ALPHA_THRESHOLD:
                overlap += 1

    return overlap / max(1, total)


def alpha_mirror_delta(alpha, threshold):
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
    structure = load_structure()
    assets = asset_map(structure)
    reels = structure["reels"]
    resource_validation = structure["resourceValidation"]
    slot_width, slot_height = structure["slotRoot"]["rectSize"]

    cell_height = reels["cellHeight"]
    mask_width, mask_height = reels["maskSize"]
    digit_width, digit_height = reels["digitCellSize"]
    mask_padding = (mask_height * 0.5) - cell_height - (digit_height * 0.5)
    expected_padding = reels.get("maskSafePadding", 3)
    if abs(mask_padding - expected_padding) > 0.001:
        raise SystemExit(
            f"777 bonus reel mask padding mismatch: {mask_padding}; expected {expected_padding}. "
            "Mask height must expose exactly three digit cells without leaking adjacent cells."
        )

    frame_asset = assets["bonus777_slot_reel_window_frame"]
    shell_asset = assets["bonus777_slot_frame_shell"]
    frame_path = PROJECT_ROOT / frame_asset["file"]
    frame_size = (frame_asset["displaySize"]["width"], frame_asset["displaySize"]["height"])
    shell_size = (shell_asset["displaySize"]["width"], shell_asset["displaySize"]["height"])
    min_fill_ratio = resource_validation["minReelWindowToShellRatio"]
    frame_to_shell_ratio = (frame_size[0] / shell_size[0], frame_size[1] / shell_size[1])
    if frame_to_shell_ratio[0] < min_fill_ratio[0] or frame_to_shell_ratio[1] < min_fill_ratio[1]:
        raise SystemExit(
            "777 reel window is undersized relative to the cabinet shell: "
            f"ratio=({frame_to_shell_ratio[0]:.4f}, {frame_to_shell_ratio[1]:.4f}); "
            f"expected >=({min_fill_ratio[0]:.4f}, {min_fill_ratio[1]:.4f})"
        )
    frame_axis_y = frame_asset["uiPosition"]["y"]
    reel_axis_y = reels["positions"][1::2]
    if any(value != frame_axis_y for value in reel_axis_y):
        raise SystemExit(
            f"777 reel centers must share the front-frame y axis: frame={frame_axis_y}, reels={reel_axis_y}"
        )
    frame_image = Image.open(frame_path).convert("RGBA").resize(frame_size, Image.LANCZOS)
    frame_alpha = frame_image.getchannel("A")
    frame_origin = (
        round((slot_width * 0.5) + frame_asset["uiPosition"]["x"] - (frame_size[0] * 0.5)),
        round((slot_height * 0.5) - frame_asset["uiPosition"]["y"] - (frame_size[1] * 0.5)),
    )

    max_allowed_overlap = reels.get("maxFrameOverlapRatio", 0.02)
    row_steps = (("top", 1), ("middle", 0), ("bottom", -1))
    worst = {"ratio": 0.0, "reel": 0, "row": ""}
    for reel_index in range(3):
        reel_x = reels["positions"][reel_index * 2]
        reel_y = reels["positions"][(reel_index * 2) + 1]
        mask_rect = ui_rect_to_canvas(slot_width, slot_height, reel_x, reel_y, mask_width, mask_height)
        for row_name, row_step in row_steps:
            row_y = reel_y + (row_step * cell_height)
            cell_rect = ui_rect_to_canvas(slot_width, slot_height, reel_x, row_y, digit_width, digit_height)
            if (
                cell_rect[0] < mask_rect[0]
                or cell_rect[1] < mask_rect[1]
                or cell_rect[2] > mask_rect[2]
                or cell_rect[3] > mask_rect[3]
            ):
                raise SystemExit(
                    f"777 bonus {row_name} row on reel {reel_index + 1} escapes the reel mask: "
                    f"cell={cell_rect}, mask={mask_rect}"
                )
            ratio = frame_overlap_ratio(frame_alpha, frame_origin, cell_rect)
            if ratio > worst["ratio"]:
                worst = {"ratio": ratio, "reel": reel_index + 1, "row": row_name}

    if worst["ratio"] > max_allowed_overlap:
        raise SystemExit(
            f"777 bonus reel cell overlaps the front frame too much: "
            f"reel={worst['reel']} row={worst['row']} ratio={worst['ratio']:.4f}; "
            f"expected <= {max_allowed_overlap:.4f}. Adjust reel positions/cell sizes from the frame alpha mask, not by eye."
        )

    min_padding = resource_validation["minAlphaPadding"]
    max_center_offset = resource_validation["maxVisualCenterOffset"]
    max_mirror_delta = resource_validation["maxAlphaMirrorDelta"]
    for name in resource_validation["centeredAssets"]:
        asset = assets[name]
        if asset["uiPosition"]["x"] != 0:
            raise SystemExit(f"Centered 777 asset must use uiPosition.x=0: {name}")
        image = Image.open(PROJECT_ROOT / asset["file"]).convert("RGBA")
        alpha = image.getchannel("A")
        bbox = alpha.point(lambda value: 255 if value > FRAME_ALPHA_THRESHOLD else 0).getbbox()
        if bbox is None:
            raise SystemExit(f"Centered 777 asset is fully transparent: {name}")
        margins = (bbox[0], bbox[1], image.width - bbox[2], image.height - bbox[3])
        if min(margins) < min_padding:
            raise SystemExit(f"Centered 777 asset lacks safe padding: {name} margins={margins}")
        center_offset = (
            abs(((bbox[0] + bbox[2]) * 0.5) - (image.width * 0.5)),
            abs(((bbox[1] + bbox[3]) * 0.5) - (image.height * 0.5)),
        )
        if max(center_offset) > max_center_offset:
            raise SystemExit(f"Centered 777 asset has shifted alpha bounds: {name} offset={center_offset}")

    for name in resource_validation["symmetricAssets"]:
        asset = assets[name]
        alpha = Image.open(PROJECT_ROOT / asset["file"]).convert("RGBA").getchannel("A")
        mirror_delta = alpha_mirror_delta(alpha, FRAME_ALPHA_THRESHOLD)
        if mirror_delta > max_mirror_delta:
            raise SystemExit(
                f"Expected symmetric 777 asset is asymmetric: {name} delta={mirror_delta:.4f}; "
                f"expected <= {max_mirror_delta:.4f}"
            )

    lever_names = (
        "bonus777_slot_lever_base",
        "bonus777_slot_lever_arm_up",
        "bonus777_slot_lever_arm_mid",
        "bonus777_slot_lever_arm_down",
    )
    lever_base = assets["bonus777_slot_lever_base"]
    lever_base_size = (lever_base["displaySize"]["width"], lever_base["displaySize"]["height"])
    max_lever_base_size = resource_validation["maxLeverBaseDisplaySize"]
    if lever_base_size[0] > max_lever_base_size[0] or lever_base_size[1] > max_lever_base_size[1]:
        raise SystemExit(
            f"777 lever base is oversized: size={lever_base_size}; expected <= {tuple(max_lever_base_size)}"
        )
    for name in lever_names:
        asset = assets[name]
        image = Image.open(PROJECT_ROOT / asset["file"]).convert("RGBA")
        bbox = image.getchannel("A").getbbox()
        if bbox is None:
            raise SystemExit(f"777 lever resource is fully transparent: {name}")
        margins = (bbox[0], bbox[1], image.width - bbox[2], image.height - bbox[3])
        if min(margins) < LEVER_SAFE_MARGIN:
            raise SystemExit(
                f"777 lever resource touches its source edge: {name} margins={margins}; "
                f"expected at least {LEVER_SAFE_MARGIN}px on every side."
            )

    print(
        "Validated 777 bonus visual safe area "
        f"(maskPadding={mask_padding:.1f}px, maxFrameOverlap={worst['ratio']:.4f}, "
        f"frameToShell=({frame_to_shell_ratio[0]:.3f},{frame_to_shell_ratio[1]:.3f}), "
        "centeredSymmetry=ok, leverMargins=ok)."
    )


if __name__ == "__main__":
    main()
