# 해커스 보카 v2 — 세션 라우팅

> ## ⚠️ 작업 폴더를 먼저 확인한다
>
> **이 프로젝트의 작업 폴더는 `C:\Workspaces\english\hackers_video_project_v2` 다.**
>
> 읽기 전용이라 **열지도 쓰지도 않는 폴더**:
> - `C:\Workspaces\english\hackers_video_project` — v1. 사양은 같지만 절차가 다르다
> - `C:\Workspaces\junbe_study\voca_video_plan` — 구프로젝트. 스키마 v2 이고 TTS 자동화가
>   없다. 여기를 근거로 "TTS 자동화가 없다"고 판단하면 틀린 결론이다 (실제 사고 사례)
> - `C:\Workspaces\tts\qwen3_tts_1.7b_base` — 모델·voices·`.venv` 참조용
>
> **이미지·음성·영상은 git 에 없다(로컬 전용).** 저장소에 이미지가 없다고 "아직 안
> 만들었다"고 판단하지 마라. 진행 상황의 유일한 근거는
> `node remotion/scripts/status.mjs` 다.

30일(120세트)을 **단계별로 통째로** 진행한다. DAY 하루치씩 왕복하지 않는다.

| 단계 | 무엇 | 어디서 | 문서 |
|---|---|---|---|
| **1** | 콘텐츠 + 이미지 프롬프트 | 외부 AI 3개 (Opus·Sol·Gemini) 각각 | `prompts/P1_콘텐츠_프롬프트.md` |
| **선택** | 3벌 비교 → 승격 | 로컬 | `compare-candidates` → `promote-candidate` |
| **2** | 이미지 2,400장 | 아무 도구 (Codex·Flow·nano banana·agy) | `prompts/P2_이미지_수급.md` |
| **3** | TTS + 렌더 | 로컬 무인 배치 | `prompts/P3_오디오_렌더.md` |

## 복붙용 요청 문구

### 공통 서두 (어떤 요청이든 이 4줄을 먼저 붙인다)

```text
작업 폴더는 C:\Workspaces\english\hackers_video_project_v2 하나뿐이다.
v1(hackers_video_project)과 junbe_study\voca_video_plan 은 읽기 전용이다. 열지도 말고 쓰지도 마라.
시작 전에 AGENTS.md, PLAN.md, 해당 단계의 prompts/P*.md, handover.md 를 읽어라.
이미지·음성·영상은 git 에 없다. 진행 상황은 node remotion/scripts/status.mjs 로만 판단하라.
```

### 1단계 — 콘텐츠·프롬프트 (외부 AI 3개에게 각각)

전문은 `prompts/P1_콘텐츠_프롬프트.md` 의 요청문 블록을 그대로 복사한다. 핵심만:

```text
(공통 서두)
DAY 01~05 의 20개 세트에 대해 words.json 과 image_prompts.md 를 만들어라.
저장 위치는 content/candidates/<네 이름: opus|sol|gemini>/DAYnn_ss-ee_setn/ 이다.
이미지는 생성하지 마라. 텍스트만 만든다.
이미지 프롬프트는 장면 한 문장 + 고정 접미만 쓴다. 30단어 이하로 짧게.
비율·해상도·여백·no logo·no watermark·화풍 수식어는 넣지 마라 (임포터가 규격을 맞춘다).
끝내기 전에 node remotion\scripts\validate-content.mjs --author <네 이름> 을 통과시켜라.
```

한 세션에 5~10 DAY 가 한계다. 30일을 한 번에 시키면 뒤로 갈수록 무너진다.

### 2단계 — 이미지

**케이스 A: 사람이 직접 만들거나 웹 UI(Google Flow 등)를 쓸 때**

```text
node remotion\scripts\generate-images-agy.mjs --list-missing    ← 남은 목록 뽑기
```
프롬프트를 붙여넣고 받은 파일을 **목표 파일명 그대로** `inbox/` 에 저장한 뒤:
```powershell
node remotion\scripts\import-images.mjs --dry-run
node remotion\scripts\import-images.mjs
```
비율·크기·확장자는 맞추지 않아도 된다.

**케이스 B: 에이전트에게 자동 생성까지 시킬 때**

```text
(공통 서두)
DAY 01~05 의 이미지를 만들어라.
node remotion\scripts\generate-images-agy.mjs --set <세트> --concurrency 4 로 생성하고
node remotion\scripts\import-images.mjs 로 반입해라.
프롬프트를 임의로 늘리지 마라. 보강 문구는 실패한 자산에만 --escalate 로 붙인다.
쿼터(429)로 끊기면 같은 명령을 다시 돌려라 (누락분만 생성된다). 3회 실패하면 멈추고 기록해라.
contact sheet 로 검수하고 불합격 목록만 보고해라. 정상 이미지는 덮어쓰지 마라.
```

**케이스 C: Codex 에게 시킬 때** — `sandbox: "read-only"` 로 생성만 시키고 절대 경로만
받는다. 파일 저장·복사를 시키지 않는다 (이 PC 의 Codex 샌드박스는 셸을 못 띄운다).

### 3단계 — 오디오·렌더 (전부 자동)

```text
(공통 서두)
밀린 오디오와 렌더를 전부 돌려라.
tts\build_set_audio.py --all → check-assets.mjs → render-batch.mjs 순서로 진행하고,
실패 세트는 건너뛴 뒤 마지막에 모아 보고해라.
overflow 가 나오면 그 세트의 정의·예문만 짧게 고치고 다시 빌드해라.
격자·속도 보정 상수는 절대 바꾸지 마라. 3회 실패하면 멈추고 handover.md 에 기록해라.
```

## 이렇게 요청하면 안 된다

| 나쁜 요청 | 왜 |
|---|---|
| `이 폴더 읽고 알아서 만들어줘` | 폴더를 잘못 짚으면 통째로 헛돈다 (v1 에서 실제 사고) |
| `DAY 01~30 전부 한 세션에 끝까지` | 1단계는 5~10 DAY, 2단계는 도구 쿼터, 3단계는 8시간 배치다. 단계를 섞지 않는다 |
| `이미지 비율이 안 맞으니 프롬프트에 16:9라고 써줘` | v2 는 정반대다. 비율 지시가 실패 원인이었다. 규격은 임포터가 맞춘다 |
| `보강 문구를 전부에 넣어줘` | 프롬프트가 길수록 약한 모델이 무너진다. 실패한 자산에만 붙인다 |
| `목소리를 더 또박또박하게` | 격자·속도는 확정값이다. 바꾸려면 근거와 함께 명시적으로 지시한다 |

## 전 세션 공통 규칙

- 기존 산출물(`words.json`, `images/`, `narration.mp3`, `out/*.mp4`)을 덮어쓰지 않는다.
  재작업은 사용자가 대상과 이유를 지정했을 때만 한다
- 게이트 순서: `validate-content` → 승격 → 이미지 → `check-assets` → 렌더
- 타이밍 격자(1.5/1.5/8/8초), 화자 순환(Zephyr→Liam→Erinome→Charon), 속도 보정 상수,
  예문 화면 1.5초 선행은 사용자 지시 없이 바꾸지 않는다
- `words.json` 콘텐츠 생성은 최상위 모델로 한다 (IPA·정의·예문은 기계 검증 불가)
- 파이썬은 반드시 `C:\Workspaces\tts\qwen3_tts_1.7b_base\.venv\Scripts\python.exe`
- 한 단계를 3회 실패하면 중단하고 `handover.md` 에 기록한다. 무한 재시도 금지
- 세션 종료 시 `handover.md` 맨 위에 완료 내역·진행률·다음 시작 프롬프트를 남긴다
