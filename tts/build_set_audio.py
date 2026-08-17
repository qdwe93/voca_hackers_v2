"""Build fixed-grid 190-second narration tracks from schemaVersion 3 words.json files."""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from engine import SPEAKER_ROTATION, SegmentResult, TTSEngine, to_mp3
from stretch import time_stretch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DAYS_ROOT = PROJECT_ROOT / "remotion" / "public" / "days"
CACHE_DIR = PROJECT_ROOT / "tts" / "cache"
WORD_BLOCK_SECONDS = 19.0
TRACK_SECONDS = 190.0
FIT_MARGIN_SECONDS = 0.15
SENTENCE_VISUAL_LEAD_SECONDS = 1.5
DEFINITION_VISUAL_FIT_SECONDS = 8.0 - SENTENCE_VISUAL_LEAD_SECONDS

# 속도 보정 정책 (Base 모델은 instruct 미지원 — 파형 단계에서 WSOLA 로 보정).
# 사용자 확정값: 사용자 지시 없이 변경 금지.
MAX_COMPRESS_RATIO = 0.85  # 슬롯 초과 시 최대 ~15% 빠르게
MAX_SLOWDOWN_RATIO = 1.2  # 과속 낭독 감속은 최대 20% 느리게
MAX_WORDS_PER_SECOND = 3.0  # 정의·예문이 이보다 빠르면 감속 대상
TARGET_WORDS_PER_SECOND = 2.6  # 감속 목표 (초등 학습자 기준 여유 있는 속도)
MAX_TAKES = 3  # 압축으로도 못 맞추면 재생성해 최단 테이크 선택


@dataclass(frozen=True)
class Slot:
    kind: str
    offset: float
    length: float
    lead_in: float
    text: str
    fit_length: float | None = None


@dataclass(frozen=True)
class FittedSegment:
    wav: np.ndarray
    sample_rate: int
    natural_seconds: float
    stretch_ratio: float
    takes: int
    cache_hit: bool
    overflow: bool


def punctuate(text: str) -> str:
    stripped = text.strip()
    return stripped if stripped.endswith((".", "!", "?")) else f"{stripped}."


def count_words(text: str) -> int:
    return len([token for token in text.split() if any(ch.isalpha() for ch in token)])


def select_sets(explicit: list[str], build_all: bool) -> list[Path]:
    if build_all:
        return sorted(
            directory
            for directory in DAYS_ROOT.glob("DAY??_??-??_set?")
            if (directory / "words.json").is_file()
            and not (directory / "audio" / "narration.mp3").exists()
        )
    selected = []
    for name in explicit:
        directory = DAYS_ROOT / Path(name).name
        if not (directory / "words.json").is_file():
            raise FileNotFoundError(f"Missing words.json for {name}")
        selected.append(directory)
    return selected


def make_slots(item: dict) -> list[Slot]:
    word_text = f"{item['word']}."
    return [
        Slot("word1", 0.0, 1.5, 0.3, word_text),
        Slot("word2", 1.5, 1.5, 0.0, word_text),
        Slot(
            "definition",
            3.0,
            8.0,
            0.0,
            punctuate(item["definition"]),
            fit_length=DEFINITION_VISUAL_FIT_SECONDS,
        ),
        Slot("sentence", 11.0, 8.0, 0.0, punctuate(item["sentence"])),
    ]


def fit_segment(engine: TTSEngine, speaker: str, slot: Slot) -> tuple[FittedSegment, int]:
    """Generate takes for one slot and stretch the best one into its budget.

    Returns the fitted segment and the number of cache misses it cost.
    """
    fit_length = slot.fit_length if slot.fit_length is not None else slot.length
    budget = fit_length - FIT_MARGIN_SECONDS - slot.lead_in

    def seconds(result: SegmentResult) -> float:
        return len(result.wav) / result.sample_rate

    misses = 0
    first = engine.synthesize(text=slot.text, speaker=speaker)
    if not first.cache_hit:
        misses += 1
    takes = [first]
    best = first
    # 최대 압축(0.85)으로도 예산에 안 들어가면 확률적 재생성으로 더 짧은 테이크를 찾는다.
    while len(takes) < MAX_TAKES and seconds(best) * MAX_COMPRESS_RATIO > budget:
        retake = engine.synthesize(
            text=slot.text, speaker=speaker, force=True, write_cache=False
        )
        misses += 1
        takes.append(retake)
        best = min(takes, key=seconds)
    if best is not first:
        # 저장 후 다시 읽어 트랙에 쓰는 파형과 캐시 파형을 일치시킨다. 캐시는 PCM_16이라
        # 저장 전 float32 를 그대로 쓰면 재빌드 시 캐시 히트본과 미세하게 달라진다.
        best = engine.reload_from_cache(best)

    natural = seconds(best)
    ratio = 1.0
    if natural > budget:
        ratio = max(budget / natural, MAX_COMPRESS_RATIO)
    elif slot.kind in ("definition", "sentence") and natural > 0:
        words_per_second = count_words(slot.text) / natural
        if words_per_second > MAX_WORDS_PER_SECOND:
            ratio = min(
                words_per_second / TARGET_WORDS_PER_SECOND,
                MAX_SLOWDOWN_RATIO,
                budget / natural,
            )

    wav = best.wav if ratio == 1.0 else time_stretch(best.wav, best.sample_rate, ratio)
    duration = len(wav) / best.sample_rate
    overflow = duration > budget + 1e-3
    return (
        FittedSegment(
            wav=wav,
            sample_rate=best.sample_rate,
            natural_seconds=natural,
            stretch_ratio=ratio,
            takes=len(takes),
            cache_hit=first.cache_hit,
            overflow=overflow,
        ),
        misses,
    )


def build_set(engine: TTSEngine, set_dir: Path) -> bool:
    narration_path = set_dir / "audio" / "narration.mp3"
    report_path = set_dir / "audio_report.json"
    if narration_path.exists():
        print(f"SKIP {set_dir.name}: narration.mp3 already exists")
        return True

    data = json.loads((set_dir / "words.json").read_text(encoding="utf-8"))
    if data.get("schemaVersion") != 3 or len(data.get("words", [])) != 10:
        raise ValueError(f"{set_dir.name}: words.json must be schemaVersion 3 with 10 words")

    started = time.perf_counter()
    generated = []
    report_segments = []
    sample_rate = None
    generation_misses = 0

    for word_index, item in enumerate(data["words"]):
        expected_speaker = SPEAKER_ROTATION[word_index % len(SPEAKER_ROTATION)]
        if item.get("speaker") != expected_speaker:
            raise ValueError(
                f"{set_dir.name}: position {word_index + 1} must use {expected_speaker} "
                f"(legacy Aiden/Ryan sets stay as-is and are not rebuilt)"
            )
        for slot in make_slots(item):
            segment, misses = fit_segment(engine, item["speaker"], slot)
            generation_misses += misses

            if sample_rate is None:
                sample_rate = segment.sample_rate
            if segment.sample_rate != sample_rate:
                raise ValueError("TTS returned inconsistent sample rates")

            duration = len(segment.wav) / segment.sample_rate
            fit_length = slot.fit_length if slot.fit_length is not None else slot.length
            absolute_start = word_index * WORD_BLOCK_SECONDS + slot.offset + slot.lead_in
            generated.append((absolute_start, segment.wav, segment.overflow))
            margin = fit_length - FIT_MARGIN_SECONDS - slot.lead_in - duration
            report_segments.append(
                {
                    "no": item["no"],
                    "word": item["word"],
                    "kind": slot.kind,
                    "textPreview": slot.text[:40],
                    "speaker": item["speaker"],
                    "durationSeconds": round(duration, 4),
                    "naturalSeconds": round(segment.natural_seconds, 4),
                    "stretchRatio": round(segment.stretch_ratio, 4),
                    "takes": segment.takes,
                    "slotSeconds": slot.length,
                    "fitSeconds": fit_length,
                    "leadInSeconds": slot.lead_in,
                    "marginSeconds": round(margin, 4),
                    "overflow": segment.overflow,
                    "cacheHit": segment.cache_hit,
                    "regenerated": segment.takes > 1,
                }
            )
            stretch_note = (
                "        " if segment.stretch_ratio == 1.0 else f"x{segment.stretch_ratio:4.2f}"
            )
            print(
                f"  {item['no']:02d} {slot.kind:10s} {item['speaker']:7s} "
                f"{duration:5.2f}s {stretch_note} margin={margin:5.2f}s "
                f"{'OVERFLOW' if segment.overflow else 'OK'}"
            )

    assert sample_rate is not None
    elapsed = time.perf_counter() - started
    overflow_count = sum(1 for segment in report_segments if segment["overflow"])
    stretched_count = sum(1 for segment in report_segments if segment["stretchRatio"] != 1.0)
    speech_seconds = sum(segment["durationSeconds"] for segment in report_segments)
    report = {
        "schemaVersion": 2,
        "set": set_dir.name,
        "sampleRate": sample_rate,
        "trackDurationSeconds": TRACK_SECONDS,
        "generationSeconds": round(elapsed, 3),
        "speechSeconds": round(speech_seconds, 3),
        "rtf": round(elapsed / speech_seconds, 3) if speech_seconds else None,
        "cacheMisses": generation_misses,
        "overflowCount": overflow_count,
        "stretchedCount": stretched_count,
        "stretchPolicy": {
            "maxCompressRatio": MAX_COMPRESS_RATIO,
            "maxSlowdownRatio": MAX_SLOWDOWN_RATIO,
            "maxWordsPerSecond": MAX_WORDS_PER_SECOND,
            "targetWordsPerSecond": TARGET_WORDS_PER_SECOND,
            "maxTakes": MAX_TAKES,
        },
        "segments": report_segments,
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if overflow_count:
        print(f"FAIL {set_dir.name}: {overflow_count} overflow segment(s); narration not written")
        return False

    track = np.zeros(round(TRACK_SECONDS * sample_rate), dtype=np.float32)
    for absolute_start, wav, _ in generated:
        start = round(absolute_start * sample_rate)
        end = start + len(wav)
        if end > len(track):
            raise ValueError(f"{set_dir.name}: segment exceeds the fixed 190-second track")
        track[start:end] = wav

    narration_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = narration_path.with_suffix(".tmp.mp3")
    to_mp3(track, sample_rate, temporary, 192)
    temporary.replace(narration_path)
    print(
        f"OK {set_dir.name}: {TRACK_SECONDS:.1f}s, overflow=0, stretched={stretched_count}, "
        f"RTF={report['rtf']}, {narration_path}"
    )
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--set", action="append", default=[])
    group.add_argument("--all", action="store_true")
    parser.add_argument("--attn", choices=["sdpa", "eager", "flash_attention_2"], default="sdpa")
    args = parser.parse_args()

    sets = select_sets(args.set, args.all)
    if not sets:
        print("No sets require audio generation.")
        return
    engine = TTSEngine(CACHE_DIR, attn=args.attn)
    engine.load()
    results = [build_set(engine, set_dir) for set_dir in sets]
    if not all(results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
