# 정의 병합 검토 보고서

## 요약

### 두 모델 기계 검증 위반

| 항목 | Claude | Codex |
|---|---:|---:|
| 행 수 | 0 | 0 |
| 키 | 0 | 0 |
| 순서 | 0 | 0 |
| 기존 정의 | 0 | 0 |
| 새 정의 단어 수 | 1 | 1 |
| 표제어 포함 | 0 | 0 |
| 마침표 | 0 | 0 |
| 첫 글자 | 0 | 0 |
| sentenceFit | 0 | 0 |
| reviewRequired/reviewReason | 0 | 0 |

- selectedFrom: claude 136 / codex 190 / both 871 / manual 3
- 정의 변경: 589 / 원문 유지: 611
- 새 정의 평균 단어 수: 5.72 / 최대: 7
- sentenceFit: ok 1200 / unclear 0 / mismatch 0
- reviewRequired: 0

## 검토 대상

| wordId | 단어 | 품사 | 뜻 | 예문 | 기존 정의 | Claude 정의 | Codex 정의 | 최종 정의 | 구분 | 판정 이유 |
|---|---|---|---|---|---|---|---|---|---|---|
| DAY03-14 | craft | n. | 공예 | The children made a paper craft with glue and ribbons. | making things with your hands, like paper art | making pretty things with your hands | something made by hand | a work of art made by hand | manual | Claude는 활동 의미, Codex는 일반 결과물 의미에 치우쳐 공예 결과물이라는 뜻과 예문 용법을 함께 담도록 직접 다듬었다. |
| DAY13-29 | novel | n. | 소설 | This novel repeats a scene we also read in the myth. | a long story book about made up people | a long made-up story in a book | a long made-up story in a book | a long story about made-up people | manual | 두 모델의 동일 정의가 하이픈 분리 기준 8단어여서 뜻을 유지한 7단어 정의로 고쳤다. |
| DAY18-32 | beat | v. | 이기다, 치다, 두드리다 | Doctors hear the patient's heart beat steadily through a stethoscope. | to defeat an opponent in a game or hit rhythmically | to move again and again steadily | to make steady movements in the body | to move with a steady pulse | manual | 두 후보 모두 심장이 규칙적으로 뛰는 자동사 용법을 자연스럽게 정의하지 못해 박동 의미로 직접 고쳤다. |
