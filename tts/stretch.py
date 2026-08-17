"""Pitch-preserving WSOLA time stretch used to fit narration into the fixed slot grid.

Base 모델은 instruct(낭독 속도 지시)를 지원하지 않으므로, 슬롯 초과·과속 낭독은
합성 후 파형 단계에서 보정한다. WSOLA는 위상 보코더보다 음성에서 인공음이 적고,
0.85~1.2 배율 범위에서는 청감상 차이가 거의 없다. 외부 패키지 없이 numpy 로만 구현해
base 폴더 venv 에 아무것도 설치하지 않는다.
"""

from __future__ import annotations

import numpy as np

WINDOW_SECONDS = 0.040
TOLERANCE_SECONDS = 0.010


def time_stretch(wav: np.ndarray, sample_rate: int, ratio: float) -> np.ndarray:
    """Return wav stretched to ratio x original duration (ratio > 1 = slower), pitch preserved."""
    x = np.asarray(wav, dtype=np.float32)
    out_length = int(round(x.size * ratio))
    # 길이가 한 샘플도 안 바뀔 때만 건너뛴다. 비율 기준 데드존(예: |ratio−1| < 1e-3)을 두면
    # 슬롯을 몇 ms 초과한 세그먼트가 압축 없이 통과해 빌더의 overflow 허용치(1e-3초)에
    # 걸리는 위양성 빌드 실패가 생긴다.
    if x.size == 0 or out_length == x.size:
        return x

    frame = max(4, int(round(sample_rate * WINDOW_SECONDS / 2)) * 2)
    hop_out = frame // 2
    hop_in = hop_out / ratio
    tolerance = int(round(sample_rate * TOLERANCE_SECONDS))
    window = np.hanning(frame).astype(np.float32)

    frames = max(1, int(np.ceil(out_length / hop_out)) + 1)
    padded = np.concatenate([x, np.zeros(frame, dtype=np.float32)])
    output = np.zeros(frames * hop_out + frame, dtype=np.float32)
    weight = np.zeros_like(output)

    previous_start: int | None = None
    for index in range(frames):
        target = int(round(index * hop_in))
        target = min(max(target, 0), x.size - 1)
        start = target
        if previous_start is not None and tolerance > 0:
            natural = previous_start + hop_out
            low = max(0, target - tolerance)
            high = min(x.size - 1, target + tolerance)
            if natural + frame <= padded.size and high > low:
                reference = padded[natural : natural + frame]
                region = padded[low : high + frame]
                scores = np.correlate(region, reference, mode="valid")
                start = low + int(np.argmax(scores))
        segment = padded[start : start + frame] * window
        position = index * hop_out
        output[position : position + frame] += segment
        weight[position : position + frame] += window
        previous_start = start

    valid = weight > 1e-6
    output[valid] /= weight[valid]
    return output[:out_length]
