"""Generate audition samples for the four cloned voices (word / definition / sentence).

각 화자로 실제 슬롯 조건(fit_segment — 재생성·타임스트레치 포함)을 그대로 통과시킨
샘플 mp3 를 tts/sample/ 에 만들어 사용자가 청취 확인할 수 있게 한다.
"""

from __future__ import annotations

import json
import time
from pathlib import Path

from build_set_audio import fit_segment, make_slots
from engine import SPEAKER_ROTATION, TTSEngine, to_mp3

ROOT = Path(__file__).resolve().parent
SAMPLE_DIR = ROOT / "sample"
CACHE_DIR = ROOT / "cache"
REPORT_PATH = SAMPLE_DIR / "voice_sample_report.json"

SAMPLE_ITEM = {
    "word": "chore",
    "definition": "a small job that must be done regularly",
    "sentence": "The child finishes each chore before starting the game.",
}


def main() -> None:
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    engine = TTSEngine(CACHE_DIR)
    engine.load()
    slots = [slot for slot in make_slots(SAMPLE_ITEM) if slot.kind != "word2"]
    rows = []
    for speaker in SPEAKER_ROTATION:
        for slot in slots:
            output = SAMPLE_DIR / f"voice_{speaker.lower()}_{slot.kind}.mp3"
            if output.exists():
                raise FileExistsError(f"Refusing to overwrite {output}")
            started = time.perf_counter()
            segment, _ = fit_segment(engine, speaker, slot)
            elapsed = time.perf_counter() - started
            to_mp3(segment.wav, segment.sample_rate, output)
            duration = len(segment.wav) / segment.sample_rate
            rows.append(
                {
                    "speaker": speaker,
                    "kind": slot.kind,
                    "text": slot.text,
                    "durationSeconds": round(duration, 4),
                    "naturalSeconds": round(segment.natural_seconds, 4),
                    "stretchRatio": round(segment.stretch_ratio, 4),
                    "takes": segment.takes,
                    "overflow": segment.overflow,
                    "generationSeconds": round(elapsed, 3),
                    "path": str(output.resolve()),
                }
            )
            print(
                f"{speaker:7s} {slot.kind:10s} {duration:5.2f}s "
                f"(natural {segment.natural_seconds:5.2f}s, x{segment.stretch_ratio:4.2f}) "
                f"{'OVERFLOW' if segment.overflow else 'OK'} -> {output.name}"
            )
    REPORT_PATH.write_text(
        json.dumps({"schemaVersion": 1, "samples": rows}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
