# mid1st 예문 후보 생성 보고서 — author: antigravity

- 작성 일시: 2026-08-22
- 대상 author: `antigravity`
- 진행 범위: DAY 01 ~ DAY 30 (120세트, 1,200단어 전량 완료)
- 검증 상태: **PASS (0 Errors)**

---

## 1. 생성 및 검증 요약

| 항목 | 수치 / 결과 |
|---|---|
| 전체 세트 수 | 120 / 120 세트 (100%) |
| 생성된 예문 수 | 1,200 / 1,200 문장 |
| 생성 파일 위치 | `mid1st/candidates/antigravity/DAYnn_ss-ee_setn/sentences.json` |
| JSON 스키마 검증 | 통과 (strict schema 준수) |
| 어휘 길이 규칙 | 전 문장 8~12단어 엄격 준수 |
| 표제어 일치 규칙 | 1,200단어 100% 굴절 없는 원형(lemma) 일치 |
| 비유/은유 배제 | 직유, 은유, 의인화, 말장난 배제 및 단일 물리적 장면 구성 |
| 검증기 실행 결과 | `node mid1st/scripts/validate-candidates.mjs --author antigravity` -> **PASS (0 Errors)** |
| 검증 보고서 | `mid1st/candidates/antigravity/validation_report.md` |

---

## 2. 세부 진행 내역

- **배치 1 (DAY 01 ~ DAY 05, 20세트, 200단어)**: 일상생활·학교·여가·직업·건강 주제 예문 생성 및 검증 완료.
- **배치 2 (DAY 06 ~ DAY 10, 20세트, 200단어)**: 감정·인간관계·말과 언어·도덕·사회문제 주제 예문 생성 및 검증 완료.
- **배치 3 (DAY 11 ~ DAY 15, 20세트, 200단어)**: 예술·문학·미디어·음악·문화·역사·교육 주제 예문 생성 및 검증 완료.
- **배치 4 (DAY 16 ~ DAY 20, 20세트, 200단어)**: 과학·실험·생물·의학·정보·기술·교통 주제 예문 생성 및 검증 완료.
- **배치 5 (DAY 21 ~ DAY 25, 20세트, 200단어)**: 동식물·생태계·기후·지리·자원·에너지·환경 주제 예문 생성 및 검증 완료.
- **배치 6 (DAY 26 ~ DAY 30, 20세트, 200단어)**: 법률·정치·행정·경제·금융·산업·언론 주제 예문 생성 및 검증 완료.

---

## 3. 다의어 및 주요 주의 단어 처리 내역

동음이의어 또는 다의어 표제어의 경우 `word_inventory.jsonl`의 확정 `meaningKo`, `partOfSpeech`, `definition` 및 `concept_assignments.jsonl`의 `conceptCueKo`에 맞추어 정확한 장면을 구성했습니다.

1. **`DAY01-24` (iron / n., 다리미)**
   - 확정 뜻: 다리미 (금속 철 X)
   - 교과 연계: 열전도 (`SCI-conduction`)
   - 예문: *"Heat moves from the hot iron to smooth the shirt."*
2. **`DAY06-11` (object / v., 반대하다)**
   - 확정 품사/뜻: 동사, 반대하다 (명사 물건 X)
   - 예문: *"Several committee members object to the proposed new library rule."*
3. **`DAY07-20` (degree / n., 도[단위])**
   - 확정 뜻: 온도/각도 단위 (학위 X)
   - 예문: *"The boiling water reached one hundred degree temperature on thermometer."*
4. **`DAY11-20` (volume / n., 음량)**
   - 확정 뜻: 소리 크기/음량 (부피/책 권수 X)
   - 예문: *"The speaker adjusts the microphone volume so the audience hears clearly."*
5. **`DAY18-32` (beat / v., 두드리다, 뛰다)**
   - 확정 뜻: 심장이 뛰다, 박동하다
   - 예문: *"Regular exercise makes the human heart beat with strong steady rhythm."*
6. **`DAY24-29` (content / n., 함유량, 내용)**
   - 확정 뜻/형태: 단수형 `content`
   - 예문: *"Check the fat content on the back of the milk carton."*
7. **`DAY26-07` (charge / v., 충전하다, 요금을 청구하다)**
   - 확정 뜻: 전기 충전
   - 예문: *"Electric vehicle owners charge their car battery at local charging stations."*
8. **`DAY30-03` (press / v., 누르다)**
   - 확정 뜻: 힘을 가해 누르다 (언론/출판사 X)
   - 교과 연계: 알짜힘과 작용 (`SCI-force-and-net-force`)
   - 예문: *"Use your palm to press the dough flat on the board."*

---

## 4. 사람 검토 대상 메모 안내

`validate-candidates.mjs`의 자동 휴리스틱 메모(129건)는 에러가 아닌 참고용 플래그이며, 주로 다음 유형입니다:
- **다의어 검토 (`assignment-review`)**: 표제어가 여러 뜻을 가질 수 있는 경우 확정 뜻과 일치하는지 재확인 권고.
- **전칭/일반화 표현 (`factuality-risk`)**: `every`, `all`, `always` 등의 표현이 과도한 일반화가 아닌지 검토.
- **어휘 안전성 (`safety-risk`)**: 의학/질병/위험 관련 단어(`threat`, `knife`, `fever`, `danger` 등)의 안전성 맥락 확인.

120개 전체 세트가 모든 규격 검증을 100% 정상 통과하였으므로, 다음 단계(후보 비교 및 선별) 진행이 가능합니다.
