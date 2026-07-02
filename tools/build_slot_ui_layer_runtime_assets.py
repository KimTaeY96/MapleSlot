from pathlib import Path

from PIL import Image


SOURCE_DIR = Path(
    r"C:\Users\ghddj\Desktop\AI\MSW\GeneratedAssets\SlotMachineUI\layers"
)
OUTPUT_DIR = SOURCE_DIR / "runtime"


def alpha_bbox(image):
    return image.getchannel("A").getbbox()


def trim(image, pad=4):
    bbox = alpha_bbox(image)
    if not bbox:
        raise ValueError("Image has no visible pixels")
    left, top, right, bottom = bbox
    return image.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(image.width, right + pad),
            min(image.height, bottom + pad),
        )
    )


def fit_to_canvas(image, size, pad=4):
    image = trim(image)
    target_width, target_height = size
    available_width = target_width - (pad * 2)
    available_height = target_height - (pad * 2)
    scale = min(
        available_width / image.width,
        available_height / image.height,
    )
    fitted_size = (
        max(1, round(image.width * scale)),
        max(1, round(image.height * scale)),
    )
    fitted = image.resize(fitted_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    position = (
        (target_width - fitted.width) // 2,
        (target_height - fitted.height) // 2,
    )
    canvas.alpha_composite(fitted, position)
    return canvas


def save_runtime(source_name, output_name, size):
    source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
    output = fit_to_canvas(source, size)
    output_path = OUTPUT_DIR / output_name
    output.save(output_path)
    print(f"{output_name}: size={output.size} bbox={alpha_bbox(output)}")


def split_spin_button_states():
    sheet = Image.open(
        SOURCE_DIR / "layer6_spin_button_three_states.png"
    ).convert("RGBA")
    alpha = sheet.getchannel("A")
    active_columns = [
        x for x in range(sheet.width) if alpha.crop((x, 0, x + 1, sheet.height)).getbbox()
    ]

    runs = []
    start = previous = active_columns[0]
    for x in active_columns[1:]:
        if x != previous + 1:
            runs.append((start, previous + 1))
            start = x
        previous = x
    runs.append((start, previous + 1))

    if len(runs) != 3:
        raise ValueError(f"Expected 3 spin-button states, found {len(runs)}: {runs}")

    state_names = ("normal", "hover_pressed", "disabled")
    for state_name, (left, right) in zip(state_names, runs):
        state = sheet.crop((left, 0, right, sheet.height))
        state = fit_to_canvas(state, (304, 100), pad=4)
        output_name = f"slot_spin_button_{state_name}.png"
        state.save(OUTPUT_DIR / output_name)
        print(f"{output_name}: size={state.size} bbox={alpha_bbox(state)}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    save_runtime(
        "layer1_cabinet_frame.png",
        "slot_layer_cabinet_frame.png",
        (700, 1020),
    )
    save_runtime(
        "layer2_top_decorative_emblem.png",
        "slot_layer_top_emblem.png",
        (520, 250),
    )
    save_runtime(
        "layer3_reel_window_frame.png",
        "slot_layer_reel_window_frame.png",
        (620, 300),
    )
    save_runtime(
        "layer4_single_reel_column_background.png",
        "slot_layer_reel_column_background.png",
        (88, 244),
    )
    save_runtime(
        "layer5_info_panel_empty_display_boxes.png",
        "slot_layer_info_panel.png",
        (620, 170),
    )
    split_spin_button_states()


if __name__ == "__main__":
    main()
