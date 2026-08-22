# mid1st 검증·비교 도구

모든 명령은 저장소 루트 `C:\Workspaces\english\hackers_video_project_v2`에서 실행한다.
Node.js ESM 표준 라이브러리만 사용하므로 별도 패키지 설치가 필요 없다.

## 1. 고정 입력 생성

```powershell
node mid1st/scripts/build-data.mjs
```

이 명령은 별도 담당 도구다. 이후 스크립트는 다음 입력이 없으면 추측하거나 대신 만들지 않고
명확하게 실패한다.

- `mid1st/data/word_inventory.jsonl` — 1,200단어와 `baselineSentence`
- `mid1st/data/concept_catalog.json` — 153개 교과 개념
- `mid1st/data/concept_assignments.jsonl` — 공통 개념 배정
- `mid1st/data/concept_usage.json` — assignment에서 계산한 strict 사용량 집계

## 2. 공통 개념 배정 검증

배정을 작성한 뒤 수치를 손으로 계산하지 않고 먼저 strict usage 파일을 만든다.

```powershell
node mid1st/scripts/build-concept-usage.mjs
```

기존 `concept_usage.json`은 보호되며 재집계가 필요하다고 사람이 결정한 경우에만 `--force`를
사용한다. 자동 생성된 `balanceReviewNotesKo`는 빈 배열이므로 실제 균형 검토 메모가 있으면
배열에 추가한다.

```powershell
node mid1st/scripts/validate-assignments.mjs `
  --report mid1st/reports/assignment-validation.md
```

완전성, 불변 ID·단어, 유효한 개념 ID, match mode, confidence와 review flag를 검사한다.
개념별·과목별 사용량과 미사용·저사용·과다 사용 개념을 보고한다. 분포는 soft target이라
불균형만으로 FAIL하지 않는다. 다만 `concept_usage.json`의 concept·subject·matchMode·fallback
집계가 실제 assignment와 다르면 FAIL이다. 파일 없이 assignment만 진단할 때는 명시적으로
`--no-usage-file`을 붙일 수 있지만 정상 게이트에는 사용하지 않는다.

## 3. 대표 샘플 보정

각 author는 아래 단일 JSONL에 24개 대표 단어의 예문을 쓴다.

```text
mid1st/calibration/candidates/<author>/sentences.jsonl
```

검증:

```powershell
node mid1st/scripts/validate-candidates.mjs --author codex --calibration `
  --report mid1st/reports/calibration-codex-validation.md
```

`antigravity`, `claude`도 author만 바꿔 실행한다. 본 후보 폴더에서 부분 결과를 통과시키는
`--allow-partial`은 지원하지 않는다. 대표 샘플은 반드시 calibration 폴더로 격리한다.

세 모델과 baseline 비교표 및 선택 파일 생성:

```powershell
node mid1st/scripts/compare-candidates.mjs --calibration --selection-template
```

비교표는 `mid1st/calibration/comparison.md`, baseline으로 미리 채운 strict 선택 파일은
`mid1st/calibration/selected_examples.jsonl`에 생성된다. 사용자는 선택한 author·문장과
`preferenceNoteKo`를 수정하고 최종적으로 가장 대표적인 6~12행만 남긴다. 기존 파일이 있으면 명령은 중단하며, 의도한 재생성에만
`--force`와 `--force-template`을 쓴다.

사용자가 6~12개를 선택하고 각 행에 구체적인 선호 이유를 적은 뒤 P2 선행 게이트를 실행한다.

```powershell
node mid1st/scripts/validate-calibration-selection.mjs `
  --report mid1st/reports/calibration-selection-validation.md
```

`codex|antigravity|claude|baseline` 문장은 실제 원본과 완전히 같아야 한다. 문장을 고쳐 쓴
경우에만 `selectedAuthor:"manual"`을 사용한다.

## 4. 전량 후보 검증

```powershell
node mid1st/scripts/validate-candidates.mjs --author codex `
  --report mid1st/reports/codex-validation.md
node mid1st/scripts/validate-candidates.mjs --author antigravity `
  --report mid1st/reports/antigravity-validation.md
node mid1st/scripts/validate-candidates.mjs --author claude `
  --report mid1st/reports/claude-validation.md
```

full 모드는 author별 120개 `sentences.json`, 총 1,200문장을 요구한다. 각 문장은 표제어를
철자 그대로 포함하고 기존 검증기와 같은 방식으로 영어 8~12단어여야 한다. strict 스키마의
추가 필드, 잘못된 author, 다른 폴더, 빠진 세트는 FAIL이다.

비유·위험·수치·강한 인과 표현은 의미 검증의 대체물이 아닌 review note(WARN)로 남긴다.
단어 뜻, 교과 개념의 직접성, 사실성은 보고서의 `conceptCueKo`와 함께 사람이 확인한다.

## 5. 후보 비교

전량 비교:

```powershell
node mid1st/scripts/compare-candidates.mjs
```

필터 예시:

```powershell
node mid1st/scripts/compare-candidates.mjs --day DAY01 --set 1
node mid1st/scripts/compare-candidates.mjs --word-ids mid1st/calibration/representative_words.json --out mid1st/comparisons/representative.md
```

표에는 확정 뜻·정의, 공통 교과의 과목·한영 개념명·matchMode·직접 단서, baseline, 세 author
문장이 나란히 나온다.
`--selection-template`을 함께 쓰면 full 선택 manifest도 baseline으로 미리 채운다. DAY/set
필터와 함께 쓰면 조각 템플릿을 `comparisons/`에 만들므로 전량 manifest와 혼동하지 않는다.

## 6. 최종 결과 생성

선택 manifest 한 행:

```json
{"wordId":"DAY01-01","selectedAuthor":"codex","sentenceOverride":null,"note":"auto: 뜻과 교과 개념이 직접 드러남"}
```

직접 수정 문장은 `selectedAuthor:"manual"`과 8~12단어 `sentenceOverride`를 사용한다. 다른
source의 override는 `null`이어야 한다.
`note`는 자동 선택이면 `auto:`, 사람이 확인할 항목이면 `reviewRequired:`로 시작하고 짧은
이유를 반드시 포함한다. 비교 도구가 만든 baseline 템플릿의 빈 note는 선택 과정에서 채워야
최종 게이트를 통과한다.

```powershell
node mid1st/scripts/build-final.mjs --dry-run
node mid1st/scripts/build-final.mjs `
  --report mid1st/reports/final-build.md
```

첫 명령이 PASS인 뒤 두 번째를 실행한다. 출력은
`mid1st/final/final_sentences.jsonl`이며 기존 inventory, assignment, author 후보는 수정하지
않는다. 최종 파일이 이미 있으면 보호를 위해 중단하고, 사용자가 재생성을 결정한 경우에만
`--force`를 사용한다.
