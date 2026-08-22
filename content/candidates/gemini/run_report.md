# Phase 1 Candidate Generation Report — `gemini`

## 1. 생성 개요
- **작성 모델 / Author**: `gemini`
- **생성 범위**: DAY01 ~ DAY30 전 범위 (총 120개 세트, 1,200개 단어, 2,400개 이미지 프롬프트)
- **생성 위치**: `content/candidates/gemini/DAY01_01-10_set1/` ~ `content/candidates/gemini/DAY30_31-40_set4/`

## 2. 유효성 검증 결과 (Validation Results)
- **실행 명령**: `node remotion/scripts/validate-content.mjs --author gemini`
- **검증 결과**: **120 / 120 sets PASSED (0 errors, 0 warnings)**
- **스키마 준수 확인**:
  - `schemaVersion`: 3
  - 품사 (`partOfSpeech`): `n.`, `v.`, `adj.`, `adv.`, `prep.`, `conj.`, `pron.`, `det.`, `interj.` 표준 기호 준수
  - 발음기호 (`ipa`): `/.../` 슬래시 포맷 준수 및 품사/문맥 일치 (예: `minute` `/ˈmɪn.ɪt/`, `lead` `/liːd/`, `wound` `/wuːnd/`, `record` /ˈrek.ɚd/)
  - 영문 정의 (`definition`): 12단어 이하 간결형 준수
  - 예문 (`sentence`): 8~12단어 엄수, 표제어 철자 완전 일치 (`content`, `store`, `match` 등)
  - 화자 순환 (`speaker`): 1~4순환 (`Zephyr` → `Liam` → `Erinome` → `Charon`) 일치
  - 고유명사 중복 제한: 세트 내 인명 중복 회피 및 보편적 맥락 사용
  - 안전성 가이드라인 (`req.txt`): 부정적/폭력적 단어(상처, 파괴, 고난, 함정, 범죄 등)를 동화, 동물, 게임, 스포츠, 자연 관찰 메타포로 치환
  - 이미지 프롬프트 (`image_prompts.md`):
    - 단어 프롬프트 10개 (1:1 정사각형, `Stylized 3D cartoon illustration, square. No text.`)
    - 예문 프롬프트 10개 (16:9 와이드, `Stylized 3D cartoon illustration, wide. Main subject in the upper two thirds. No text.`)
    - 장면 묘사 길이 4~30단어 준수, 금지어(화질/카메라/비율 지시어) 배제

## 3. 동음이의어 / 다의어 / 추상어 처리 내역

| 단어 | 품사 | IPA | 문맥 및 예문 설계 |
|---|---|---|---|
| `minute` (DAY03) | n. | `/ˈmɪn.ɪt/` | 시간 단위(분) — 10분 읽기 시간 |
| `lead` (DAY05) | v. | `/liːd/` | 이끌다/안내하다 — 산악 가이드 |
| `bear` (DAY06) | v. | `/ber/` | 견디다/참다 — 추운 겨울 바람 견디기 |
| `drill` (DAY06) | n. | `/drɪl/` | 훈련/연습 — 소방 대피 훈련 |
| `object` (DAY09) | n. | `/ˈɑːb.dʒɪkt/` | 물체/물건 — 돋보기로 관찰하는 금속 물체 |
| `record` (DAY14) | n. | `/ˈrek.ɚd/` | 기록 — 세계 신기록 달성 |
| `wound` (DAY18) | n. | `/wuːnd/` | 상처 — 학교 보건실의 반창고 치료 |
| `patient` (DAY18) | n. | `/ˈpeɪ.ʃənt/` | 환자 — 소아과 병원 방문 |
| `present` (DAY29) | n. | /ˈprez.ənt/ | 선물 — 생일 선물 포장 |
| `depress` (DAY30) | v. | `/dɪˈpres/` | 누르다 — 피아노 건반 부드럽게 누르기 |

## 4. 특이사항 및 다음 단계 안내
- `gemini`의 1단계 콘텐츠 및 이미지 프롬프트 생성이 100% 완료되었습니다.
- 다음 단계는 다른 후보 모델(`opus`, `sol` 등)과의 후보 비교 및 승격(`compare-candidates` → `promote-candidate`) 단계입니다.
