# 해커스 보카 v2 — 30일 통짜 4단계 파이프라인

`hackers.csv`(DAY 01~30, 하루 40단어 = 120세트 1200단어)를 학습 영상 120편으로 만든다.
v1(`hackers_video_project`)과 **영상 사양·타이밍·TTS 정책은 같고, 진행 순서와 이미지
프롬프트 규칙만 다르다.** 이 저장소가 앞으로의 작업 기준이며, **v1 이 삭제돼도 v2 는
단독으로 완전히 동작한다** (코드·`node_modules`·자산을 전부 자체 보유한다).

외부 의존은 둘뿐이다: TTS 모델 `C:\Workspaces\tts\qwen3_tts_1.7b_base` (읽기 전용 참조,
4단계에만 필요)와 선택적 이미지 백엔드 `agy.exe`(`AGY_PATH` 로 경로 변경 가능).

**이 문서는 "무엇을 어떻게" 만 다룬다. "왜 그렇게 정했는가" 는 [`WHY.md`](WHY.md) 에 있다**
(결정별 근거·버린 대안·바꿔도 되는 조건). 설계를 바꾸려면 WHY.md 의 근거부터 본다.

## v1 에서 바뀐 것 (이유가 있는 것만)

| | v1 | v2 |
|---|---|---|
| 진행 단위 | DAY 1개씩 콘텐츠→이미지→렌더 | **30일 통짜, 단계별로 끝까지** |
| 콘텐츠 작성 | 한 AI 가 순서대로 | **같은 세트를 3개 AI 가 각각 → 골라 승격** |
| 이미지 프롬프트 | 60~80단어, canonical prefix + 금지문구 3종 | **장면 한 문장 + 고정 접미 1개** |
| 비율·규격 책임 | 프롬프트가 지시 | **임포터(`import-images.mjs`)가 전담** |
| 이미지 백엔드 | agy 기본, Codex 대체 | **아무거나** (Codex·Google Flow·nano banana·agy·손작업) |
| 보강 문구 | 항상 붙임 | **실패한 자산에만 사후 적용** |

### 왜 프롬프트를 줄였나

약한 이미지 모델(실측: nano banana 2)은 지시가 길수록 무너진다. 관측된 실패는 셋이다.

1. 피사체가 잘린다 (구도 지시를 따르려다 프레임을 못 맞춤)
2. 요청한 비율을 **단색 밴드**로 채운다 (16:9 를 만들라니 위아래를 단색으로 메움)
3. 금지 문구를 많이 넣을수록 오히려 글자·로고가 섞인다

그래서 v2 는 **프롬프트에서 비율·여백·품질 수식어를 뺀다.** 어떤 크기·비율로 나오든
임포터가 단색 테두리를 잘라내고 규격으로 크롭한다. 프롬프트에 남기는 안전장치는
`No text.` 하나뿐이고, 나머지는 **실패했을 때 그 자산에만** 덧붙인다.

## 이미지 프롬프트 규칙 (v2 — 이게 전부다)

```text
## 01_stomach_word.png
A friendly robot points at a glowing stomach inside its clear body. Stylized 3D cartoon illustration, square. No text.

## 01_stomach_sent.png
A small dragon holds its rumbling stomach beside a full picnic basket. Stylized 3D cartoon illustration, wide. Main subject in the upper two thirds. No text.
```

- 장면 묘사는 **영어 한 문장, 권장 30단어 이하 / 하드 상한 45단어**
- 고정 접미 (그대로 복사, 변경 금지)
  - 단어 이미지: `Stylized 3D cartoon illustration, square. No text.`
  - 예문 이미지: `Stylized 3D cartoon illustration, wide. Main subject in the upper two thirds. No text.`
- 비율·해상도·하단 여백·"no watermark/logo/badge" 같은 문구는 **넣지 않는다**
- 파일명 하나에 프롬프트 하나. 세트당 20개(단어 10 + 예문 10)

### 실패했을 때만 쓰는 보강 문구 (`--escalate`)

| 증상 | 키 | 덧붙이는 문장 |
|---|---|---|
| 글자·로고가 섞임 | `text` | `Absolutely no letters, numbers, logos, or watermarks anywhere.` |
| 피사체가 잘림 | `crop` | `Show the whole subject with clear margin on every side.` |
| 단색 밴드·빈 화면 | `band` | `Fill the entire frame with the scene, no borders, no empty color areas.` |
| 사람 얼굴이 부담스러움 | `people` | `Simple friendly cartoon characters, no realistic faces.` |

전량에 미리 붙이지 않는다. 실패한 자산만 재생성한다.

## 4단계 파이프라인

```text
1단계  콘텐츠 + 이미지 프롬프트   (외부 AI 여럿이 각각)   → content/candidates/<author>/
       ↓ compare-candidates → promote-candidate (사람이 고른다)
       승격                                              → remotion/public/days/
2단계  이미지 생성               (AI별로 각각)           → inbox/<author>/ → import --author
                                                        → content/image-candidates/<author>/
3단계  이미지 선별               (사람)                  → pick-images → days/*/images/
4단계  TTS 120세트 + 렌더 120편  (로컬 배치, 무인)       → out/*.mp4
```

각 단계는 **30일 전체를 끝내고** 다음으로 넘어간다. DAY 하루치씩 왕복하지 않는다
(모델 전환·세션 시작 비용이 매번 붙어 효율이 떨어졌다).

### 1회 실행 상한 (`remotion/scripts/session-limits.mjs` 가 강제한다)

| 단계 | 상한 | 근거 |
|---|---|---|
| 1 콘텐츠·프롬프트 | **DAY 10개**(40세트) | 그 이상이면 뒤로 갈수록 품질이 떨어진다 |
| 2 이미지 생성 | **80장**(DAY 1개), `--max` 로 최대 200 | 외부 도구 쿼터(429)에서 끊기면 복구 비용이 크다 |
| 3 이미지 선별 | **20세트**(DAY 5개) | 사람이 한 번에 눈으로 판정할 수 있는 분량 |
| 4 TTS·렌더 | 제한 없음 (무인 배치) | 스크립트만 돌고 게이트가 판정한다 |

상한을 넘기면 스크립트가 실행을 거부하고 나누는 방법을 알려준다. 문서로만 적어 두면
에이전트가 무시하기 때문에 코드로 막는다.

### 1단계 — 콘텐츠·프롬프트 (`prompts/P1_콘텐츠_이미지프롬프트.md`)

Claude Opus · GPT Sol · Gemini 3.7 에게 **같은 범위를 각각** 시킨다. 결과는
`content/candidates/{opus,sol,gemini}/DAYnn_.._setn/{words.json,image_prompts.md}`.

```powershell
node remotion\scripts\validate-content.mjs --author opus
node remotion\scripts\compare-candidates.mjs --set DAY01_01-10_set1 --out compare_DAY01.md
node remotion\scripts\promote-candidate.mjs --author opus --set DAY01_01-10_set1
```

승격은 검증을 통과한 후보만 가능하다. IPA·정의·예문의 **의미적 정확도는 어떤 스크립트도
검사하지 못하므로** 고르는 단계에서 사람이나 상위 모델이 본다.

### 2단계 — 이미지 생성 (`prompts/P2_이미지_생성.md`)

세트당 20장 × 120세트 = **2,400장**. 도구는 자유이며 규칙은 두 개뿐이다.

1. `image_prompts.md` 의 프롬프트를 그대로 쓴다
2. 결과 파일을 **목표 파일명 그대로** `inbox/` 에 둔다 (확장자·`(1)` 꼬리표는 무방)

```powershell
node remotion\scripts\import-images.mjs --dry-run
node remotion\scripts\import-images.mjs
```

임포터가 하는 일: 파일명 매칭 → 단색 테두리 제거 → 규격 크롭(단어 1024×1024 중앙
주목영역 / 예문 1600×900 위쪽 우선) → PNG 저장 → 원본을 `inbox/_imported/` 로 이동 →
과다 크롭·업스케일·단색 의심을 경고로 보고.

AI별로 비교하려면 `--author <이름>` 을 준다. 그러면 최종 위치가 아니라
`content/image-candidates/<이름>/` 에 규격 정규화된 상태로 쌓인다.

### 3단계 — 이미지 선별 (`prompts/P3_이미지_선별.md`)

```powershell
node remotion\scripts\make-image-sheets.mjs --day 01
node remotion\scripts\pick-images.mjs --author flow --set DAY01_01-10_set1
```

세트 × AI 마다 20칸 대지를 만들어 비교하고, 세트 단위(권장) 또는 자산 단위로 최종
위치에 올린다. 판정 기준은 글자 혼입 → 의미 불일치 → 잘림 → 하단 1/4 침범 → 화풍 순이다.

### 4단계 — 오디오·렌더 (`prompts/P4_오디오_렌더.md`)

로컬에서 무인 배치로 돈다. 사람이 볼 것은 마지막 요약뿐이다.

```powershell
& C:\Workspaces\tts\qwen3_tts_1.7b_base\.venv\Scripts\python.exe tts\build_set_audio.py --all
node remotion\scripts\check-assets.mjs
node remotion\scripts\render-batch.mjs
```

## 영상·음성 사양 (v1 과 동일 — 바꾸지 않는다)

- 1920×1080 / 30fps / H.264 / 세트당 192.85초 = 5,784프레임
- 단어당 19초 격자: 단어 1.5 + 단어 1.5 + 뜻 8.0 + 예문 8.0
- 예문 화면은 블록 9.5초에 전환, 예문 음성은 11.0초에 시작 (1.5초 화면 선행)
- narration 트랙 정확히 190.0초, 영상 2.4초 지점에 배치
- TTS: 로컬 `Qwen3-TTS-12Hz-1.7B-Base` 보이스 클로닝, 세트 내 위치 1·2·3·4 순환
  **Zephyr → Liam → Erinome → Charon**
- 속도 보정: 슬롯 초과 시 최대 15% 압축(하한 0.85), 3.0 단어/초 초과 시 2.6 목표로 감속
  (최대 20%), 압축으로 못 맞추면 최대 3테이크 후 overflow 실패 → 콘텐츠를 짧게 고친다
- 정의 12단어 이하, 예문 8~12단어(표제어 철자 그대로 포함)

## 저장소 구조

```text
hackers_video_project_v2/
├─ hackers.csv                 # 단어 원본
├─ req.txt                     # 콘텐츠·이미지 안전 기준
├─ WHY.md                      # 왜 이렇게 만들었나 (결정·근거·버린 대안) ← 검토 시작점
├─ AGENTS.md                   # 세션 라우팅 + 복붙용 요청 문구
├─ PLAN.md                     # 이 문서
├─ handover.md                 # 세션 인계
├─ prompts/P1~P4_*.md          # 단계별 실행 절차
├─ 요청문/*.txt                 # 다른 AI 에게 그대로 붙여넣는 생성·검증 요청문 [git 추적]
├─ content/candidates/<author>/DAYnn_..._setn/{words.json,image_prompts.md}   [git 추적]
├─ content/image-candidates/<author>/DAYnn_..._setn/*.png  # AI별 이미지 후보  [git 제외]
├─ inbox/<author>/             # 아무 AI 로 만든 이미지를 던지는 곳          [git 제외]
├─ samples/                    # 규격 참고용 예시 3개                        [git 추적]
├─ tts/                        # engine·stretch·build_set_audio (v1 과 동일)
└─ remotion/
   ├─ src/                     # Remotion 앱 (v1 과 동일)
   ├─ scripts/
   │  ├─ content-schema.mjs        # 스키마 + v2 프롬프트 규칙
   │  ├─ session-limits.mjs        # 1회 실행 상한 (코드로 강제)
   │  ├─ validate-content.mjs      # 후보/승격 세트 검사
   │  ├─ compare-candidates.mjs    # 콘텐츠 후보 비교표
   │  ├─ promote-candidate.mjs     # 콘텐츠 후보 → public/days 승격
   │  ├─ import-images.mjs         # ★ 규격·비율·단색밴드 전담 (--author 로 후보 보관)
   │  ├─ make-image-sheets.mjs     # AI별 이미지 비교 대지
   │  ├─ pick-images.mjs           # 이미지 후보 → 최종 선별
   │  ├─ generate-images-agy.mjs   # 자동 생성 백엔드 (선택) → inbox
   │  ├─ check-assets.mjs          # 렌더 게이트
   │  ├─ render-batch.mjs          # 통과분 일괄 렌더
   │  ├─ status.mjs                # 단계별 현황판
   │  └─ make-*-contact-sheets.mjs # QA 시트
   ├─ public/days/DAYnn_..._setn/  # words.json·image_prompts.md [추적] / images·audio [제외]
   └─ out/*.mp4                                                              [git 제외]
```

**git 은 텍스트만 관리한다.** 이미지·음성·영상은 로컬 전용이고 프롬프트로 다시 만들 수
있다. 클론한 저장소에 이미지가 없다고 "아직 안 만들었다"고 판단하면 안 된다.
진행 상황의 유일한 근거는 `node remotion/scripts/status.mjs` 다.

## 게이트

- 승격 전: `validate-content.mjs` (스키마·CSV 일치·화자 순환·정의/예문 길이·프롬프트 20개)
- 이미지 반입: `import-images.mjs` (규격 정규화 + 경고). 경고는 사람이 판단한다
- 렌더 전: `check-assets.mjs` (이미지 20장 규격, narration 190.0초, overflow 0)
- 렌더 후: ffprobe 192.85초 / 5,784프레임, contact sheet 판독

## 환경 함정 (v1 에서 이월 — 깨지면 여기부터 본다)

- **`tts/engine.py` 몽키패치 2개.** torchaudio 2.9+ 는 `load` 를 TorchCodec 에 위임해 이
  환경에서 실패하므로 `qwen_tts` import 전에 `torchaudio.load` 를 soundfile 로 바꾸고,
  `torch.load` 를 `weights_only=False` 로 감싼다. `.venv` 업그레이드 시 여기부터 터진다
- **TTS temperature 를 낮추지 않는다.** t=0.5 에서 5회 중 2회 생성이 폭주했다
- 파이썬은 반드시 `C:\Workspaces\tts\qwen3_tts_1.7b_base\.venv\Scripts\python.exe`
- `agy.exe` 경로는 `AGY_PATH` 환경변수로 덮을 수 있다 (기본값은 스크립트 상수)
- ffprobe 는 설치 불필요 — Remotion 번들을 쓴다
- `.mcp.json` 의 Codex 서버는 node 경로가 하드코딩돼 있고, 고치면 세션 재시작이 필요하다
