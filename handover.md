# 2026-08-23 — mid1st 확정 콘텐츠 통합·120세트 승격 완료

## 완료 내역

- `mid1st/final/final_sentences.jsonl`의 확정 정의·예문을
  `content/candidates/final/` 120세트에 통합했다. definition 589개, sentence 1,089개가
  바뀌었고 뜻·IPA는 바뀌지 않았다.
- 기존 단어 이미지 프롬프트 1,200개는 그대로 보존했다. 전후 SHA-256은
  `a7c1909cf476c7bd1fac04b87fd7ef2db3858fdf8cfe7eedbdf6671d86cd0816`으로 같다.
- 예문 이미지 프롬프트 1,200개는 확정 예문 장면과 고정 접미로 갱신했다.
- `Korean` 반복을 고정 인물 이름으로 오인하던 검증기를 수정하고 회귀 fixture를 추가했다.
  `validate-content --author final`과 전체 fixture가 통과했다.
- final 후보 120세트를 `remotion/public/days/`에 승격했다. 승격본 자체도 120/120세트
  검증 PASS이며 후보↔승격본 `words.json`·`image_prompts.md` 240개 해시가 모두 일치한다.

## 진행률

후보 120/120, 승격 120/120, 프롬프트 120/120. 이미지 후보·최종 이미지·오디오·렌더 0/120.

## 다음 시작

2단계 이미지 수급: `요청문/2_이미지_생성.txt`와 `prompts/P2_이미지_생성.md`를 읽고
`nanobanana2` / `gptimage2` 두 벌을 전체 생성한 뒤 author별로 반입한다.

# 2026-08-17 (3) — 설계 근거 문서(WHY.md) 추가

## 완료 내역

- `WHY.md` 를 추가했다. 결정 12개를 **결정 / 근거 / 버린 대안 / 바꿔도 되는 조건** 형식으로
  기록했다: 단계별 통짜 진행, 이미지 프롬프트 단순화, 규격 책임의 임포터 이전, 다중 AI
  후보 생성, 생성과 검증 분리, 세션 상한의 코드 강제, 텍스트 전용 git, 확정 사양(격자·
  화자·속도), 작업 폴더 경고의 유래, 버린 대안 6가지, 미해결 5가지, 검토 시작 절차.
  실측 수치(nano banana 2 실패 3종, agy 429, DAY18 글자 혼입 5장 재생성, 임포터 밴드
  44% 복구, TTS RTF 1.786, 렌더 147초)와 실제 사고(구프로젝트 오작업, DAY20~25 일괄 요청
  중단)를 근거로 붙였다.
- `요청문/4_프로세스_검토.txt` 를 추가했다. 새 세션(Claude·Codex)이 검토만 하도록
  수정 금지·보고 형식 고정·"결정을 바꾸려면 근거를 대체하라"·"버린 대안 재제안 금지"를
  명시했다.
- `AGENTS.md`·`PLAN.md` 첫머리와 공통 서두에 WHY.md 를 연결했다.

## 진행률

전 단계 0/120. 1단계 착수 대기.

## 다음 시작

- 설계 검토: `요청문/4_프로세스_검토.txt`
- 제작 착수: `요청문/1_콘텐츠_이미지프롬프트_생성.txt` (DAY 01~05 먼저, AI별로)

# 2026-08-17 (2) — 4단계 재편, 세션 상한, v1 독립 확인

## 완료 내역

- **v1 독립 검증.** 코드에 v1 경로 참조가 0건이고, 외부 의존은 TTS 모델
  (`C:\Workspaces	ts\qwen3_tts_1.7b_base`, 4단계 전용)과 선택적 `agy.exe` 뿐이다.
  DAY01 세트1로 콘텐츠 작성 → 검증 → 승격 → 이미지 반입 → TTS → 렌더 → ffprobe 까지
  v1 을 전혀 건드리지 않고 통과했다 (192.853초 / 5,784프레임 / H.264+AAC, TTS overflow 0,
  RTF 1.786, 렌더 147초). 스모크 산출물은 삭제했다.
- **스키마 정합.** `remotion/src/schema.ts` 에서 legacy(Aiden/Ryan·sentenceInstruct·style·
  date)를 제거하고 `content-schema.mjs` 와 키를 일치시켰다. `author` 필드를 words.json 에
  넣으려던 설계는 폐기했다 (Remotion props 가 strict 라 렌더가 거부한다 — 후보 구분은
  폴더명으로 한다).
- **4단계로 재편.** 1 콘텐츠·프롬프트 → 2 이미지 생성(AI별) → 3 이미지 선별 →
  4 TTS·렌더. `prompts/P3_이미지_선별.md` 를 새로 쓰고 P4 로 번호를 옮겼다.
- **AI별 이미지 후보.** `import-images.mjs --author <이름>` 이 규격 정규화 후
  `content/image-candidates/<이름>/` 에 쌓고, `make-image-sheets.mjs` 가 세트×AI 대지를
  만들며, `pick-images.mjs` 가 세트 단위·자산 단위로 최종 위치에 올린다.
- **세션 상한을 코드로 강제.** `session-limits.mjs` — 1단계 DAY 10개, 2단계 80장
  (`--max` 최대 200), 3단계 20세트. 넘으면 스크립트가 거부하고 나누는 법을 알려준다.
- **요청문 파일화.** `요청문/1_콘텐츠_이미지프롬프트_생성.txt`, `1b_저장소없이_생성.txt`,
  `2_이미지_생성.txt`, `3_검증.txt`. 검증은 만든 AI 가 아닌 다른 AI 에게 시키고 수정
  권한을 주지 않는다 (보고 형식 고정).

## 진행률

전 단계 0/120 (스모크 산출물 삭제 후 초기 상태).

## 다음 시작

`요청문/1_콘텐츠_이미지프롬프트_생성.txt` 를 AI별로 보낸다. DAY 01~05 를 먼저 여러 벌
받아 `compare-candidates` 로 비교하고, 품질 차이를 확인한 뒤 범위를 넓힌다.

# 2026-08-17 — v2 저장소 구축

## 완료 내역

- `C:\Workspaces\english\hackers_video_project_v2` 를 v1 과 독립된 저장소로 만들었다.
  Remotion 앱(`src/`), TTS(`engine.py`·`stretch.py`·`build_set_audio.py`), `hackers.csv`,
  `req.txt`, `node_modules` 는 v1 에서 그대로 복사했다 (영상·음성 사양 동일).
- 진행 순서를 **DAY 하루치 왕복 → 30일 통짜 3단계**로 바꿨다.
  1단계 콘텐츠·프롬프트(외부 AI 3벌) → 승격 → 2단계 이미지 2,400장 → 3단계 TTS·렌더.
- 이미지 프롬프트를 단순화했다. 장면 한 문장 + 고정 접미 1개, 30단어 권장/45단어 상한.
  비율·여백·no logo·화풍 수식어를 금지했다 (약한 모델의 크롭·단색 밴드 원인).
- 규격 책임을 `import-images.mjs` 로 옮겼다. 단색 테두리 트림 → cover 크롭
  (단어 주목영역 / 예문 위쪽 우선) → PNG 변환 → 과다크롭·업스케일·단색 경고.
- 새 스크립트: `import-images.mjs`, `promote-candidate.mjs`, `compare-candidates.mjs`,
  단계별 `status.mjs`, 인박스 방식으로 바꾼 `generate-images-agy.mjs`.
- 문서: `AGENTS.md`(라우팅·복붙 요청문), `PLAN.md`(설계), `prompts/P1·P2·P3`.

## 진행률

콘텐츠 후보 0/120, 승격 0/120, 이미지 0/120, 오디오 0/120, 렌더 0/120.
v1 의 DAY01·DAY18 산출물은 가져오지 않았다 (프롬프트 규칙이 달라 재작성 대상).

## 다음 시작

`요청문/1_콘텐츠_이미지프롬프트_생성.txt` 의 요청문을 Claude Opus · GPT Sol · Gemini 3.7 에게
각각 보낸다. 먼저 DAY 01~05 만 3벌로 받아 품질 차이를 확인한 뒤 범위를 늘린다.
# 2026-08-18 — 최종 프로세스 결정 반영 + fixture/스모크 통과

## 완료 내역

- `processreview/interview_result_fable5.md`를 원 검토서 6건과 다시 대조하고 §3 최종 승인안을
  구현했다. 프롬프트 금지어 검사기·승격 해시/교체 안전장치는 추가하지 않았고 세션 상한
  게이트와 `session-limits.mjs`는 제거했다.
- 코드: 문두 Every/Monday 이름 오탐 수정, 트림 임계값 0.40, agy 후보·inbox 중복 확인,
  TTS 세트별 예외 격리와 `effectiveWordsPerSecond`, `status --verify`, 렌더 후 ffprobe·
  +5초/+13초 20프레임·contact sheet 자동 QA를 반영했다.
- 문서·요청문·`req.txt`·Git 정책을 2026-08-18 결정에 맞췄다. `emit-request.mjs`와 fixture
  실행기를 추가했고 `normalize-generated-image.mjs`를 삭제했다.
- TTS 스모크 중 읽기 전용 외부 `.venv` 안에 numba 캐시를 쓰려다 멈추는 원인을 스택으로
  확인했다. `tts/engine.py`가 `tts/cache/numba`를 쓰게 수정한 뒤 정상화했다.
- fixture 전 항목과 TypeScript/Python 정적 검사가 통과했다.
- DAY01 set1 end-to-end 스모크 통과: 콘텐츠 검증·승격 → 이미지 20장 반입·선별 → TTS
  190.0초(overflow 0, RTF 1.957) → 자산 게이트 → 렌더 146.7초 → ffprobe 192.853초,
  5,784프레임, H.264+오디오 → QA 20프레임+2대지. 스모크 전용 자산은 삭제하지 않고
  `remotion/out/smoke-archive/2026-08-18/`로 이동했다.
- Git 원격 `origin=https://github.com/qdwe93/voca_hackers_v2` 연결 및 로컬 커밋
  `e9e677a` 생성 완료. 외부 push는 보안 검토가 전체 payload 재승인을 요구해 아직 실행하지
  않았다.

## 진행률

제작 전 단계 0/120. 스모크는 작업 현황에서 분리했다.

## 다음 시작

1. 사용자가 커밋 `e9e677a` 및 후속 스모크 수정 커밋 전체를 위 GitHub 원격으로 보내는 것을
   명시적으로 재승인하면 push한다.
2. 1단계: `요청문/1_콘텐츠_이미지프롬프트_생성.txt`를 `opus` / `sol` / `gemini`에 각각
   전달해 DAY01~30 전 구간 3벌을 만든다. 이 세션에는 세 외부 AI로 직접 발송할 연결이 없다.
