# 해커스 보카 v2 — 세션 라우팅

> ## ⚠️ 작업 폴더를 먼저 확인한다
>
> 작업 폴더는 `C:\Workspaces\english\hackers_video_project_v2` 하나뿐이다.
>
> 읽기 전용이라 열지도 쓰지도 않는 폴더:
> - `C:\Workspaces\junbe_study\voca_video_plan` — 무관한 구프로젝트
> - `C:\Workspaces\tts\qwen3_tts_1.7b_base` — 모델·voices·`.venv` 참조용
>
> 진행 상황은 Git 파일 목록이 아니라 `node remotion/scripts/status.mjs`로 판단한다.

절차를 바꾸기 전에 [`WHY.md`](WHY.md)를 읽는다. 프로세스 검토 전용 세션은
`요청문/4_프로세스_검토.txt`를 쓴다.

30일(120세트)을 단계별로 통째로 진행한다.

| 단계 | 무엇 | 담당 | 범위 | 문서 |
|---|---|---|---|---|
| 1 | 콘텐츠 + 이미지 프롬프트 | `opus` / `sol` / `gemini` | 각자 DAY01~30 전부 | `prompts/P1_콘텐츠_이미지프롬프트.md` |
| 1-선별 | 후보 비교 → 승격 | 사람 + 로컬 | 120세트 | `compare-candidates` → `promote-candidate` |
| 2 | 이미지 2벌 | `nanobanana2` / `gptimage2` | 각자 전 이미지 | `prompts/P2_이미지_생성.md` |
| 3 | 이미지 선별 | 사람 | 120세트 전량 육안 | `prompts/P3_이미지_선별.md` |
| 4 | TTS + 렌더 + 자동 QA | 로컬 무인 배치 | 120세트 | `prompts/P4_오디오_렌더.md` |

단계를 섞지 않는다. 코드상 세션·실행 상한은 없다. 기존 파일을 건너뛰는 재실행 방식으로
중단 지점부터 복구한다.

## 복붙용 요청문

| 상황 | 파일 |
|---|---|
| 콘텐츠 생성(저장소 접근 O) | `요청문/1_콘텐츠_이미지프롬프트_생성.txt` |
| 콘텐츠 생성(저장소 접근 X) | `요청문/1b_저장소없이_생성.txt` 또는 `emit-request.mjs` 출력 |
| 이미지 생성 | `요청문/2_이미지_생성.txt` |
| 선택적 산출물 검증 | `요청문/3_검증.txt` |
| 프로세스 검토 | `요청문/4_프로세스_검토.txt` |

공통 서두:

```text
작업 폴더는 C:\Workspaces\english\hackers_video_project_v2 하나뿐이다.
다른 폴더는 열지도 쓰지도 마라.
시작 전에 WHY.md, AGENTS.md, PLAN.md, 해당 단계의 prompts/P*.md, handover.md 를 읽어라.
진행 상황은 node remotion/scripts/status.mjs 로 판단하라.
```

### 단계별 한 줄 요약

- 1단계: DAY01~30의 120세트를 `content/candidates/<author>/`에 만들고
  `validate-content --author <author>`를 통과시킨다. 보고는 author별 `run_report.md`에 쓴다.
- 2단계: 같은 전체 이미지를 `nanobanana2`와 `gptimage2`로 각각 만들고
  `import-images --author <author>`로 반입한다.
- 3단계: AI별 대지를 모두 보고 `pick-images`로 최종 위치에 올린다.
- 4단계: `build_set_audio.py --all` → `check-assets.mjs` → `render-batch.mjs` →
  `status.mjs --verify` 순으로 실행한다.

별도 검증 AI 라운드는 필수가 아니다. 필요할 때만 생성 AI와 다른 AI에게 `요청문/3`을 주며,
검증 AI는 파일을 수정하지 않는다.

## 이렇게 요청하면 안 된다

| 나쁜 요청 | 이유 |
|---|---|
| `이 폴더 읽고 알아서 만들어줘` | 작업 경계가 불명확하다 |
| `프롬프트부터 렌더까지 한 번에` | 단계 사이에 사람의 콘텐츠 승격·이미지 선별이 필요하다 |
| `이미지 프롬프트에 16:9를 추가` | 비율 지시가 잘림·단색 밴드의 원인이며 규격은 임포터가 맞춘다 |
| `보강 문구를 전부에 추가` | 실패 자산에만 보강한다 |
| `목소리를 더 또박또박하게` | 격자·속도 상수는 확정값이다 |

## 전 세션 공통 규칙

- 기존 산출물을 덮어쓰지 않는다. 재작업은 사용자가 대상과 이유를 지정했을 때만 한다.
- 게이트 순서는 `validate-content` → 승격 → 이미지 → `check-assets` → 렌더다.
- 격자(1.5/1.5/8/8초), 화자 순환, 속도 상수, 예문 화면 1.5초 선행을 바꾸지 않는다.
- `words.json`은 최상위 언어모델로 만든다.
- 파이썬은 `C:\Workspaces\tts\qwen3_tts_1.7b_base\.venv\Scripts\python.exe`를 쓴다.
- 생성 AI는 공용 `handover.md` 대신 `content/candidates/<author>/run_report.md`를 갱신한다.
- 승격·파이프라인 세션만 `handover.md` 맨 위에 완료 내역·진행률·다음 시작점을 남긴다.
- 같은 단계가 3회 실패하면 중단하고 해당 보고서에 기록한다.
