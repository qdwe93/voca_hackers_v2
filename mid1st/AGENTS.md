# mid1st 세션 규칙

이 디렉터리는 기존 1,200단어에 중학교 1학년 교과 개념을 연결해 새 예문 후보를 만드는
독립 작업 공간이다.

## 작업 경계

- 쓰기는 이 `mid1st/` 디렉터리 안에서만 한다.
- 다음 기준 자료는 읽기만 하고 절대 수정하지 않는다.
  - `../hackers.csv`
  - `../part_day_table.md`
  - `../content/candidates/final/`
  - `C:/Workspaces/junbe_study/middle_1st/content_eng/`
- 기존 완성 파일을 덮어쓰지 않는다. 재실행은 누락·검증 실패 파일만 대상으로 한다.
- 이미지 생성, TTS, 렌더는 이 작업 범위가 아니다.

## 시작 순서

1. `README.md`
2. `DECISIONS.md`
3. `PLAN.md`
4. 해당 단계의 `prompts/P*.md`
5. `schema/README.md`

## 역할별 쓰기 위치

- 공통 개념 배정 세션: 프롬프트가 지정한 `data/`와 `reports/` 파일만
- Codex 예문 세션: `candidates/codex/`만
- Antigravity 예문 세션: `candidates/antigravity/`만
- Claude 예문 세션: `candidates/claude/`만
- 대표 샘플 세션: `calibration/candidates/<author>/`만
- 비교·선택 세션: `comparisons/`, `final/`, `reports/`만

작성자는 다른 모델의 후보를 읽고 문장을 모방하지 않는다. 비교 단계에서만 세 후보와 기존
예문을 함께 읽는다.

## 절대 고정값

`data/word_inventory.jsonl`의 단어 철자, 품사, 한국어 뜻, IPA, 영영 정의는 사용자가 이미
확정했다. 새 모델이 만드는 것은 예문뿐이며, 공통 교과개념 배정도 예문 세션에서 바꾸지 않는다.

## 품질 우선순위

1. 확정된 단어 뜻과 품사의 정확한 문자적 사용
2. 배정된 교과개념의 정확하고 직접적인 표현
3. 자연스러운 8~12단어 영어 문장
4. 초6 가독성과 중1 교과 맥락
5. 한 장면으로 보이는 안전한 내용

비유·은유·말장난으로 단어와 교과개념을 연결하지 않는다. 사용량이 적은 개념은 동등하게
정확한 후보 사이에서만 우선하며, 균형을 위해 직접성이나 자연스러움을 낮추지 않는다.
