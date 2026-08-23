# 2026-08-23 — mid1st 확정 예문·정의 통합

- 범위: DAY01~30, 120세트, 1,200단어
- 기준: `mid1st/final/final_sentences.jsonl`
- definition 변경: 589
- sentence 변경: 1089
- 품사 변경: 0
- 뜻·IPA 변경: 0
- 단어 이미지 프롬프트: 1200개 보존
- 단어 프롬프트 SHA-256: `a7c1909cf476c7bd1fac04b87fd7ef2db3858fdf8cfe7eedbdf6671d86cd0816`
- 예문 이미지 프롬프트: 1200개를 확정 예문 장면으로 갱신
- 검증: `validate-content --author final` — 120/120세트 PASS
- 회귀 테스트: `node remotion/scripts/fixtures.mjs` — 전체 PASS

## 이전 선택 보고

# final candidate selection report

- Scope: DAY01-DAY30, 120 sets, 1200 words
- Automatic choice for equivalent meanings: opus
- User-reviewed large-difference words: 79
- Selected base entries: opus 1159, sol 22, gemini 19
- Custom field overrides: 21
- Image prompts: copied from the selected source; mixed/custom examples were reconciled automatically
- Validation: `node remotion/scripts/validate-content.mjs --author final` — 120/120 sets passed
