# mid1st 데이터 스키마

JSONL 파일은 한 줄에 JSON 객체 하나를 저장한다. 빈 줄은 허용하지만 JSON 배열이나
마크다운 코드 펜스는 넣지 않는다. 모든 스키마는 `additionalProperties: false`이므로
정의되지 않은 필드는 검증에 실패한다.

## 파일 대응

| 파일 | 스키마 |
|---|---|
| `data/concept_assignments.jsonl`의 한 행 | `assignment-row.schema.json` |
| `data/concept_usage.json` | `concept-usage.schema.json` |
| `candidates/<author>/<set>/sentences.json` | `candidate-set.schema.json` |
| `calibration/candidates/<author>/sentences.jsonl`의 한 행 | `calibration-candidate-row.schema.json` |
| `calibration/selected_examples.jsonl`의 한 행 | `calibration-selection-row.schema.json` |
| `final/selection_manifest.jsonl`의 한 행 | `selection-row.schema.json` |
| `final/final_sentences.jsonl`의 한 행 | `final-row.schema.json` |

`direct`와 `contextual`은 유효한 `conceptId` 하나를 반드시 사용한다. `day_fallback`과
`word_fallback`은 `conceptId`가 반드시 `null`이다. 개념 분포는 soft target이며,
미사용·저사용·과다 사용은 검증 실패가 아닌 경고와 보고서 항목이다. 저사용은
`0 < count < actualMeanPerConcept × 0.5`, 과다 사용은 `count > actualMeanPerConcept × 2`다.

후보에는 뜻이나 개념을 다시 쓰지 않는다. `wordId`로 고정된 inventory와 assignment를
참조하고 새 예문만 제출한다. 이렇게 하면 확정된 뜻·품사·정의가 모델 출력으로 바뀌지 않는다.
