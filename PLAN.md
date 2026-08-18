# 해커스 보카 v2 — 30일 통짜 4단계 파이프라인

`hackers.csv`의 1,200단어(DAY 01~30, 하루 40단어)를 초등 6학년용 학습 영상 120편으로
만든다. 이 저장소가 코드·문서·콘텐츠·미디어의 단일 작업 기준이다.

외부 의존은 TTS 모델 `C:\Workspaces\tts\qwen3_tts_1.7b_base`와 선택적 이미지 백엔드
`agy.exe`뿐이다. 설계 근거는 [`WHY.md`](WHY.md), 세션 라우팅은 [`AGENTS.md`](AGENTS.md)에 있다.

## 확정 운영 방식

| 항목 | 현재 방식 |
|---|---|
| 진행 단위 | 30일 전체를 단계별로 완료 |
| 콘텐츠 | 같은 120세트를 `opus` / `sol` / `gemini` 3벌 생성 후 사람이 승격 |
| 별도 검증 AI | 필수 절차에서 제외. 기계 검증 실패나 생성 오류가 난 산출물만 재작업 |
| 이미지 | `nanobanana2` / `gptimage2` 2벌 생성 후 사람이 전량 선별 |
| 이미지 프롬프트 | 장면 한 문장 + 고정 접미 |
| 비율·규격 | `import-images.mjs`가 단색 테두리 제거·크롭·PNG 변환을 전담 |
| 실행 상한 | 코드 게이트 없음. 중단 후 재실행 가능한 파일 단위로 복구 |
| 렌더 QA | 전 세트 ffprobe + 단어 블록 +5초/+13초 프레임 20장 + contact sheet |

## 이미지 프롬프트 규칙

```text
## 01_stomach_word.png
A friendly robot points at a glowing stomach inside its clear body. Stylized 3D cartoon illustration, square. No text.

## 01_stomach_sent.png
A small dragon holds its rumbling stomach beside a full picnic basket. Stylized 3D cartoon illustration, wide. Main subject in the upper two thirds. No text.
```

- 장면 묘사는 영어 한 문장, 권장 30단어 이하 / 하드 상한 45단어
- 고정 접미는 그대로 복사한다.
  - 단어: `Stylized 3D cartoon illustration, square. No text.`
  - 예문: `Stylized 3D cartoon illustration, wide. Main subject in the upper two thirds. No text.`
- 비율·해상도·하단 여백·`no logo`·`no watermark`·`no badge`·품질 수식어·특정 화풍은 넣지 않는다.
- 금지어 자동 검사기는 없다. 작성자와 사람이 규칙 준수 여부를 확인한다.

실패한 자산만 `--escalate text|crop|band|people`로 보강한다. 전량에 보강 문구를 붙이지 않는다.

## 4단계 파이프라인

```text
1단계  콘텐츠 + 이미지 프롬프트  → content/candidates/<author>/
       비교·사람 승격             → remotion/public/days/
2단계  이미지 2벌                 → inbox/<author>/ → import --author
                                   → content/image-candidates/<author>/
3단계  사람 선별                  → pick-images → days/*/images/
4단계  TTS + 렌더 + 자동 QA       → audio/ + out/*.mp4 + out/qa-frames/
```

단계를 섞지 않는다. 코드상 실행 상한은 없지만, 기존 파일을 건너뛰는 재실행 방식을 유지한다.

### 1단계 — 콘텐츠·프롬프트

`opus`, `sol`, `gemini`가 DAY 01~30 전체를 각각 작성한다. 생성 AI는 공용 `handover.md`가
아니라 `content/candidates/<author>/run_report.md`에 범위·기계 검증 결과·판단이 어려웠던
단어를 기록한다.

```powershell
node remotion\scripts\validate-content.mjs --author opus
node remotion\scripts\compare-candidates.mjs --set DAY01_01-10_set1 --out compare_DAY01.md
node remotion\scripts\promote-candidate.mjs --author opus --set DAY01_01-10_set1
```

승격은 형식 검증을 통과한 후보만 가능하다. IPA·뜻·정의·예문의 의미적 정확도는 사람이
후보 비교 때 판단한다. 별도 검증 AI 라운드는 필수가 아니다.

저장소를 보지 못하는 AI용 요청은 다음처럼 만든다.

```powershell
node remotion\scripts\emit-request.mjs --set DAY03_21-30_set3
```

### 2단계 — 이미지 생성

세트당 20장 × 120세트 × 2벌이다. author는 `nanobanana2`, `gptimage2`를 쓴다.

```powershell
node remotion\scripts\import-images.mjs --author nanobanana2 --dry-run
node remotion\scripts\import-images.mjs --author nanobanana2
node remotion\scripts\import-images.mjs --author gptimage2
```

임포터는 파일명 매칭 → 단색 테두리 제거(최소 잔존 면적비 0.40) → 규격 크롭 → PNG 저장 →
과다 크롭·업스케일·단색 의심 경고 순으로 처리한다. `--author` 없는 기본 실행은 `inbox/`
아래 author 폴더를 발견하면 선별 우회를 막기 위해 거부한다.

### 3단계 — 이미지 선별

```powershell
node remotion\scripts\make-image-sheets.mjs --day 01
node remotion\scripts\pick-images.mjs --author nanobanana2 --set DAY01_01-10_set1
```

전 세트 대지를 모두 본다. 임포터 콘솔 경고가 난 이미지를 먼저 확인하고, 글자·로고 → 의미
불일치 → 잘림 → 예문 이미지 하단 1/4 침범 → 화풍 → 안전성 순으로 판단한다.

### 4단계 — 오디오·렌더

```powershell
& C:\Workspaces\tts\qwen3_tts_1.7b_base\.venv\Scripts\python.exe tts\build_set_audio.py --all
node remotion\scripts\check-assets.mjs
node remotion\scripts\render-batch.mjs
node remotion\scripts\status.mjs --verify
```

TTS는 세트별 예외를 격리해 끝까지 진행한 뒤 실패를 표로 낸다. 렌더는 각 MP4를 즉시
ffprobe로 검사하고, 잘못된 파일은 `.bad-<시각>.mp4`로 격리한다. 각 단어 블록 +5초와
+13초 프레임 20장을 `remotion still`로 추출해 contact sheet를 자동 생성한다.

## 영상·음성 사양

- 1920×1080 / 30fps / H.264
- 계산상 영상 길이 **192.80초**, 5,784프레임; MP4 컨테이너 ffprobe 실측 **192.853초**
- 단어당 19초 격자: 단어 1.5 + 단어 1.5 + 정의 화면 8.0 + 예문 화면 8.0
- 정의 음성 예산은 예문 화면 선행 1.5초와 여유 0.15초를 뺀 **6.35초**
- 예문 화면은 블록 9.5초, 예문 음성은 11.0초에 시작(1.5초 선행)
- narration 트랙 190.0초, 영상 2.4초 지점에 배치
- 화자 순환: Zephyr → Liam → Erinome → Charon
- 속도 보정 상수: 압축 하한 0.85, 감속 상한 1.2, 3.0→2.6단어/초 목표
- 정의 12단어 이하, 예문 8~12단어
- `audio_report.json`은 정의·예문별 `effectiveWordsPerSecond`를 기록한다.

## Git 정책

- 코드·프롬프트·문서·설정·콘텐츠 후보 3벌을 추적한다.
- 이미지 후보 2벌과 최종 이미지·오디오는 전 DAY 추적한다.
- MP4는 DAY01만 추적한다. 용량 문제 시 DAY01 MP4도 제외할 수 있다.
- `node_modules`, TTS 캐시, inbox 임시 파일, QA 중간 프레임, DAY02~30 MP4는 제외한다.
- 원격은 `https://github.com/qdwe93/voca_hackers_v2`다.

Git 유무와 관계없이 실제 로컬 진행 상황은 `node remotion/scripts/status.mjs`가 판단한다.

## 게이트

- 승격 전: `validate-content.mjs`
- 이미지 반입: `import-images.mjs`
- 렌더 전: `check-assets.mjs`
- 렌더 후: ffprobe(192.853±0.1초, H.264, 오디오, 5,784프레임) + contact sheet
- 정밀 현황: `status.mjs --verify`(이미지 규격·오디오 보고서·MP4 실측)

## 환경 함정

- `tts/engine.py`의 torchaudio·`torch.load` 호환 몽키패치를 유지한다.
- 외부 `.venv`는 읽기 전용이므로 numba 캐시는 프로젝트 `tts/cache/numba`를 사용한다.
- TTS temperature를 낮추지 않는다. t=0.5에서 생성 폭주가 관측됐다.
- 파이썬은 반드시 지정된 TTS `.venv`를 쓴다.
- `agy.exe` 경로는 `AGY_PATH`로 덮을 수 있다.
- ffprobe는 Remotion 번들을 쓴다.
