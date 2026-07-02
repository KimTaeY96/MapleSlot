from pathlib import Path

import numpy as np
from PIL import Image


FRAME = Path(r"C:\Users\ghddj\Desktop\AI\MSW\GeneratedAssets\SlotMachineUI\wide\runtime\slot_wide_reel_window_frame.png")
EXPECTED_DIVIDERS = [170.5, 320.5, 470.5, 620.5]


def find_vertical_peaks(image: Image.Image):
    alpha = np.array(image.convert("RGBA"))[:, :, 3]
    y0 = int(image.height * 0.22)
    y1 = int(image.height * 0.78)
    score = (alpha[y0:y1, :] > 80).sum(axis=0)
    peaks = []
    in_peak = False
    start = 0
    for index, value in enumerate(score):
        if value > 80 and not in_peak:
            start = index
            in_peak = True
        if (value <= 80 or index == len(score) - 1) and in_peak:
            end = index if value <= 80 else index + 1
            if end - start >= 3:
                peaks.append((start, end, (start + end - 1) / 2, int(score[start:end].max())))
            in_peak = False
    return peaks


def main() -> int:
    image = Image.open(FRAME).convert("RGBA")
    peaks = find_vertical_peaks(image)
    dividers = [peak[2] for peak in peaks[1:-1]]
    print(f"frame={FRAME}")
    print(f"size={image.size} bbox={image.getbbox()}")
    print(f"peaks={peaks}")
    print(f"dividers={dividers}")
    for actual, expected in zip(dividers, EXPECTED_DIVIDERS):
        if abs(actual - expected) > 2.5:
            raise SystemExit(f"divider mismatch: actual={actual}, expected={expected}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
