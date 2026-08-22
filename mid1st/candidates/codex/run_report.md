# Codex 전량 예문 후보 생성 보고서

## 완료 범위

- DAY01~30, 120/120세트
- 예문 1,200/1,200개
- 출력: `mid1st/candidates/codex/DAYnn_ss-ee_setn/sentences.json`
- 생성 필드: `sentence`만 작성했으며 identity와 공통 개념 배정은 변경하지 않음

## 검증 결과

- `validate-assignments.mjs`: PASS (1,200/1,200)
- `validate-calibration-selection.mjs --max 12`: PASS (12개)
- `validate-candidates.mjs --author codex`: PASS (120파일, 1,200문장)
- baseline과 완전 일치: 0개
- selected exemplar와 완전 일치: 0개
- 후보 문장 내부 중복: 0개
- 교과 배정 330개는 `conceptCueKo`와 전량 대조했고, fallback은 DAY별 2개씩 60개를 추가 샘플링함

## 사람 검토 항목

검증 보고서의 자동 휴리스틱 메모는 154건, 고유 wordId는 153개다. `every`·`because`·수치
등의 사실성 확인 메모와 표제어 자체가 안전 경고어인 경우를 포함하므로 PASS/FAIL에는 영향을
주지 않는다. 공통 배정에서 명시적으로 `reviewRequired`인 항목은 48개이며 모두 문장을 직접
보정했지만 최종 후보 비교 때 다시 확인해야 한다.

- 교과 연결이 장식적으로 약해질 위험 16개:
  `DAY02-35`, `DAY04-30`, `DAY07-29`, `DAY07-36`, `DAY10-01`, `DAY10-18`,
  `DAY14-38`, `DAY17-14`, `DAY19-12`, `DAY23-01`, `DAY24-16`, `DAY25-13`,
  `DAY25-18`, `DAY28-01`, `DAY29-05`, `DAY30-05`
- 다의어·품사 대표용법 확인 32개:
  `DAY01-24`, `DAY01-28`, `DAY02-20`, `DAY02-40`, `DAY03-31`, `DAY04-20`,
  `DAY04-32`, `DAY06-11`, `DAY06-20`, `DAY06-28`, `DAY07-20`, `DAY07-40`,
  `DAY09-40`, `DAY10-40`, `DAY11-09`, `DAY11-20`, `DAY12-07`, `DAY12-40`,
  `DAY13-40`, `DAY14-14`, `DAY17-40`, `DAY18-20`, `DAY18-21`, `DAY18-32`,
  `DAY18-40`, `DAY24-13`, `DAY24-29`, `DAY24-40`, `DAY26-07`, `DAY28-17`,
  `DAY29-40`, `DAY30-03`

상세 자동 검토 메모는 `validation_report.md`에 남겼다.
