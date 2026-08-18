"""Shared Qwen3-TTS-Base voice-clone segment generation, cleanup, normalization, caching, and MP3 encoding.

`C:\\Workspaces\\tts\\qwen3_tts_1.7b_base` 의 로컬 Base 모델과 참조 음성(voices/)을
읽기 전용으로 사용한다. 그 폴더의 파일은 절대 수정하지 않는다.
"""

from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path

import lameenc
import numpy as np
import soundfile as sf
import torch
import torchaudio

# qwen_tts가 불러오는 librosa/numba는 기본적으로 설치된 .venv 옆에 캐시를 쓰려 한다.
# 외부 TTS 환경은 읽기 전용 참조이므로 프로젝트의 재생성 가능한 캐시로 보낸다.
os.environ.setdefault("NUMBA_CACHE_DIR", str(Path(__file__).resolve().parent / "cache" / "numba"))


# torchaudio 2.9+ 는 load 를 TorchCodec/ffmpeg 로 위임해 이 환경에서 실패한다.
# qwen_tts 가 참조 음성 로드에 torchaudio.load 를 쓰므로 import 전에 대체해야 한다.
def _soundfile_load(path, *args, **kwargs):
    data, sample_rate = sf.read(str(path), dtype="float32", always_2d=True)
    return torch.tensor(data.T), sample_rate


torchaudio.load = _soundfile_load

_ORIG_TORCH_LOAD = torch.load


def _patched_torch_load(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _ORIG_TORCH_LOAD(*args, **kwargs)


torch.load = _patched_torch_load

from qwen_tts import Qwen3TTSModel  # noqa: E402

TTS_BASE_ROOT = Path(r"C:\Workspaces\tts\qwen3_tts_1.7b_base")
MODEL_PATH = TTS_BASE_ROOT / "qwen3_tts_model_base" / "Qwen3-TTS-12Hz-1.7B-Base"
VOICES_DIR = TTS_BASE_ROOT / "voices"
LANGUAGE = "English"

# words.json 의 speaker 값 → voices/ 참조 음성. 세트 내 위치 1·2·3·4 순환 배정.
SPEAKER_ROTATION = ("Zephyr", "Liam", "Erinome", "Charon")
SPEAKER_VOICES = {
    "Zephyr": "eng_Zephyr_f_google",
    "Liam": "eng_Liam_m_elevenlabs",
    "Erinome": "eng_Erinome_f_google",
    "Charon": "eng_Charon_m_google",
}

# 공식 예제 기본값. temperature 를 낮추면 안 된다 — base 프로젝트 0단계 실측에서
# t=0.5 일 때 5회 중 2회 생성이 폭주했다 (qwen3_tts_1.7b_base/docs 참조).
GEN_DEFAULTS = dict(
    do_sample=True,
    top_k=50,
    top_p=1.0,
    temperature=0.9,
    repetition_penalty=1.05,
    subtalker_dosample=True,
    subtalker_top_k=50,
    subtalker_top_p=1.0,
    subtalker_temperature=0.9,
)

TRIM_REL_THRESHOLD = 0.02
TRIM_KEEP_MS = 30
FADE_MS = 5
TARGET_RMS_DBFS = -20.0
PEAK_LIMIT_DBFS = -1.0


@dataclass(frozen=True)
class SegmentResult:
    wav: np.ndarray
    sample_rate: int
    cache_hit: bool
    cache_path: Path


def est_max_tokens(text: str) -> int:
    """12Hz 코덱 기준 토큰 상한. 생성이 폭주해도 이 선에서 끊긴다."""
    est_seconds = max(1.5, len(text) * 0.09)
    return int(min(2048, max(48, est_seconds * 12 * 2.5)))


def trim_silence(wav: np.ndarray, sample_rate: int) -> np.ndarray:
    peak = float(np.abs(wav).max(initial=0.0))
    if peak == 0.0:
        return wav
    loud = np.flatnonzero(np.abs(wav) > peak * TRIM_REL_THRESHOLD)
    if loud.size == 0:
        return wav
    keep = int(sample_rate * TRIM_KEEP_MS / 1000)
    return wav[max(0, int(loud[0]) - keep) : min(len(wav), int(loud[-1]) + keep + 1)]


def normalize_rms(wav: np.ndarray) -> np.ndarray:
    if wav.size == 0:
        return wav
    rms = float(np.sqrt(np.mean(np.square(wav, dtype=np.float64))))
    if rms <= 1e-9:
        return wav
    target_rms = 10.0 ** (TARGET_RMS_DBFS / 20.0)
    normalized = wav.astype(np.float32, copy=True) * (target_rms / rms)
    peak = float(np.abs(normalized).max(initial=0.0))
    peak_limit = 10.0 ** (PEAK_LIMIT_DBFS / 20.0)
    if peak > peak_limit:
        normalized *= peak_limit / peak
    return normalized


def apply_fade(wav: np.ndarray, sample_rate: int) -> np.ndarray:
    frames = min(int(sample_rate * FADE_MS / 1000), len(wav) // 2)
    if frames <= 0:
        return wav
    faded = wav.astype(np.float32, copy=True)
    ramp = np.linspace(0.0, 1.0, frames, dtype=np.float32)
    faded[:frames] *= ramp
    faded[-frames:] *= ramp[::-1]
    return faded


def to_mp3(wav: np.ndarray, sample_rate: int, output: Path, bitrate: int = 192) -> None:
    pcm = (np.clip(wav, -1.0, 1.0) * 32767.0).astype(np.int16)
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(bitrate)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(bytes(encoder.encode(pcm.tobytes())) + bytes(encoder.flush()))


class TTSEngine:
    def __init__(self, cache_dir: Path, attn: str = "sdpa") -> None:
        self.cache_dir = cache_dir
        self.attn = attn
        self.model: Qwen3TTSModel | None = None
        self._prompts: dict[str, object] = {}

    def load(self) -> None:
        if self.model is not None:
            return
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Base model not found (read-only reference): {MODEL_PATH}")
        self.model = Qwen3TTSModel.from_pretrained(
            str(MODEL_PATH),
            device_map="cuda:0" if torch.cuda.is_available() else "cpu",
            dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
            attn_implementation=self.attn,
        )

    def _prompt(self, speaker: str):
        cached = self._prompts.get(speaker)
        if cached is not None:
            return cached
        voice_name = SPEAKER_VOICES[speaker]
        wav_path = VOICES_DIR / f"{voice_name}.wav"
        txt_path = VOICES_DIR / f"{voice_name}.txt"
        if not wav_path.is_file() or not txt_path.is_file():
            raise FileNotFoundError(
                f"Reference voice for {speaker} needs both {wav_path} and {txt_path}"
            )
        assert self.model is not None
        prompt = self.model.create_voice_clone_prompt(
            ref_audio=str(wav_path),
            ref_text=txt_path.read_text(encoding="utf-8").strip(),
            x_vector_only_mode=False,
        )
        self._prompts[speaker] = prompt
        return prompt

    def _cache_path(self, speaker: str, text: str) -> Path:
        digest = hashlib.sha1(
            f"{SPEAKER_VOICES[speaker]}|{text}".encode("utf-8"), usedforsecurity=False
        ).hexdigest()
        return self.cache_dir / f"{digest}.wav"

    def save_cache(self, cache_path: Path, wav: np.ndarray, sample_rate: int) -> None:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = cache_path.with_suffix(f".{os.getpid()}.tmp.wav")
        sf.write(temporary, wav, sample_rate, format="WAV", subtype="PCM_16")
        temporary.replace(cache_path)

    def reload_from_cache(self, result: SegmentResult) -> SegmentResult:
        """Persist a take and return it as read back from cache (PCM_16 round-tripped).

        캐시에 남는 파형과 실제로 쓰는 파형을 같게 만들어 재빌드 결과를 재현 가능하게 한다.
        """
        self.save_cache(result.cache_path, result.wav, result.sample_rate)
        wav, sample_rate = sf.read(result.cache_path, dtype="float32", always_2d=False)
        return SegmentResult(
            np.asarray(wav, dtype=np.float32), sample_rate, result.cache_hit, result.cache_path
        )

    def synthesize(
        self,
        *,
        text: str,
        speaker: str,
        force: bool = False,
        write_cache: bool = True,
    ) -> SegmentResult:
        if speaker not in SPEAKER_VOICES:
            raise ValueError(f"Unknown speaker {speaker!r}; expected one of {SPEAKER_ROTATION}")
        cache_path = self._cache_path(speaker, text)
        if cache_path.is_file() and not force:
            wav, sample_rate = sf.read(cache_path, dtype="float32", always_2d=False)
            return SegmentResult(np.asarray(wav, dtype=np.float32), sample_rate, True, cache_path)

        self.load()
        assert self.model is not None
        with torch.inference_mode():
            wavs, sample_rate = self.model.generate_voice_clone(
                text=[text],
                language=[LANGUAGE],
                voice_clone_prompt=self._prompt(speaker),
                max_new_tokens=est_max_tokens(text),
                **GEN_DEFAULTS,
            )
        wav = np.asarray(wavs[0], dtype=np.float32)
        wav = apply_fade(normalize_rms(trim_silence(wav, sample_rate)), sample_rate)

        if write_cache:
            self.save_cache(cache_path, wav, sample_rate)
            wav, sample_rate = sf.read(cache_path, dtype="float32", always_2d=False)
            wav = np.asarray(wav, dtype=np.float32)
        return SegmentResult(wav, sample_rate, False, cache_path)
