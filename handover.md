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
