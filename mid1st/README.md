# mid1st

중학교 1학년 교과 개념을 활용해 기존 1,200단어의 새 예문 후보를 만드는 독립 작업 공간이다.
기존 `hackers.csv`, `content/candidates/final`, `part_day_table.md`와 외부 교과 참고 자료는
읽기만 하며 수정하지 않는다.

## 핵심 원칙

1. 기존에 확정한 단어 철자·품사·한국어 뜻·IPA·영영 정의는 바꾸지 않는다.
2. 공통 교과개념 배정표를 먼저 만들고 세 모델이 같은 조건에서 예문만 작성한다.
3. 단어 뜻과 교과개념은 비유·은유가 아니라 문장 안에서 직접 확인되어야 한다.
4. 여러 개념이 모두 자연스러우면 현재까지 사용 횟수가 적은 개념을 먼저 검토한다.
5. 분포 균형은 soft goal이다. 개념을 쓰기 위해 단어 뜻이나 자연스러움을 희생하지 않는다.
6. 기존 예문과 세 모델 후보를 단어별로 비교하며 원본은 덮어쓰지 않는다.

세부 절차는 [PLAN.md](PLAN.md), 사용자 확정값은 [DECISIONS.md](DECISIONS.md), 생성 규칙은
`prompts/`, 데이터 계약은 `schema/`를 따른다.

## 작성자

| 작성자 ID | 실행 방식 | 출력 위치 |
|---|---|---|
| `codex` | 새 Codex 세션 | `candidates/codex/` |
| `antigravity` | 새 Antigravity 세션 | `candidates/antigravity/` |
| `claude` | 새 Claude 세션 | `candidates/claude/` |

각 세션은 자기 폴더만 쓰고 다른 작성자의 결과를 읽거나 수정하지 않는다.

## 작업 순서

```text
기준 데이터 생성
→ 공통 교과개념 배정 및 사용량 점검
→ 대표 샘플 3벌 생성
→ 사용자 대표 선택을 보정 예시로 기록
→ 세 모델 전 범위 예문 생성
→ 형식 검증
→ 기존 예문 포함 4열 비교
→ 단어별 선택 및 별도 최종 결과 생성
```

## 실행 순서

모든 명령은 저장소 루트 `C:\Workspaces\english\hackers_video_project_v2`에서 실행한다.

### 0. 기준 데이터 확인

현재 기준 데이터는 이미 생성되어 있다. 원본이 바뀌었을 때만 다시 만든다.

```powershell
node mid1st/scripts/build-data.mjs
```

완료 기준은 단어 1,200개, 120세트, 교과 개념 153개다.

### 1. 공통 교과개념 배정

새 세션에서 `prompts/concept_assignment_요청문.txt`를 그대로 실행한다. 이 세션은 예문을 만들지
않고 다음 두 파일만 확정한다.

```text
data/concept_assignments.jsonl
data/concept_usage.json
```

정상 게이트:

```powershell
node mid1st/scripts/validate-assignments.mjs `
  --report mid1st/reports/assignment-validation.md
```

개념 분포는 경고만 낸다. 미사용·저사용 개념은 다시 검토하되, 단어 뜻과 교과 직접성이
동등한 배정만 바꾼다.

### 2. 대표 예문 24개를 세 모델에서 생성

각각 새 세션에서 다음 요청문을 실행한다.

```text
prompts/calibration_codex_요청문.txt
prompts/calibration_antigravity_요청문.txt
prompts/calibration_claude_요청문.txt
```

세 파일이 모두 24/24로 검증되면 비교표와 선택 템플릿을 만든다.

```powershell
node mid1st/scripts/compare-candidates.mjs --calibration --selection-template
```

`calibration/comparison.md`를 보고 취향이 분명하게 드러나는 6~12개만 고른다. 선택하지 않은
행은 `calibration/selected_examples.jsonl`에서 지우고, 선택 출처·문장·구체적인 선택 이유를
기록한다.

```powershell
node mid1st/scripts/validate-calibration-selection.mjs `
  --report mid1st/reports/calibration-selection-validation.md
```

### 3. 전 범위 예문 후보를 세 모델에서 생성

대표 선택 검증이 통과한 뒤 각각 새 세션에서 다음 요청문을 실행한다.

```text
prompts/codex_요청문.txt
prompts/antigravity_요청문.txt
prompts/claude_요청문.txt
```

각 작성자는 자기 폴더에 120세트·1,200문장만 만들며, 공통 배정이나 확정 뜻을 변경하지 않는다.
검증 명령은 author만 바꾸어 세 번 실행한다.

```powershell
node mid1st/scripts/validate-candidates.mjs --author codex
node mid1st/scripts/validate-candidates.mjs --author antigravity
node mid1st/scripts/validate-candidates.mjs --author claude
```

### 4. 단어별 비교·추천·최종 생성

세 모델이 모두 통과한 뒤 새 비교 세션에서 `prompts/selection_요청문.txt`를 실행한다. 이 세션은
baseline까지 포함한 네 문장을 비교하고, 대표 선택에서 확인된 사용자 성향으로 우열이 분명한
항목을 자동 추천한다. 뜻이나 교과 개념 해석이 크게 갈리는 항목만 사용자에게 묻는다.

검토 항목을 사용자가 해결하거나 현재 추천을 승인한 뒤 최종 결과를 만든다.

```powershell
node mid1st/scripts/build-final.mjs --dry-run
node mid1st/scripts/build-final.mjs `
  --report mid1st/reports/final-build.md
```

최종 파일은 `final/final_sentences.jsonl`이며 기존 `content/candidates/final`은 그대로 남는다.

## 현재 준비 상태

- 기준 단어 1,200개와 10단어 입력 세트 120개 생성 완료
- 국어 35, 수학 34, 과학 45, 사회 39개 등 교과 개념 153개 카탈로그 생성 완료
- 대표 단어 24개 선정 완료
- 공통 배정, 세 모델 생성, 대표 선택, 전량 비교, 최종 병합용 프롬프트·검증 도구 준비 완료
- 실제 공통 개념 배정과 새 예문 생성은 아직 시작하지 않음
