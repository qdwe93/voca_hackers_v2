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

`prompts/P1_콘텐츠_프롬프트.md` 의 요청문을 Claude Opus · GPT Sol · Gemini 3.7 에게
각각 보낸다. 먼저 DAY 01~05 만 3벌로 받아 품질 차이를 확인한 뒤 범위를 늘린다.
