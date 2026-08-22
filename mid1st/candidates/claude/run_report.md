# Claude 예문 후보 생성 보고 (author: claude)

## 완료 범위

- 완료 세트: 120 / 120 (DAY01~DAY30, 세트당 10문장)
- 생성 문장: 1,200 / 1,200
- 출력 위치: `mid1st/candidates/claude/DAYnn_ss-ee_setn/sentences.json`
- 이번 실행에서 새로 만든 세트: 120개 (기존 완성 파일 없음, 덮어쓴 파일 없음)
- 생성 필드: `sentence`만. word·뜻·품사·IPA·definition·PART/DAY·conceptId·matchMode·conceptCueKo는 입력 그대로 유지했고 개념 재배정은 하지 않았다.

## 선행 게이트

- `node mid1st/scripts/validate-assignments.mjs` → PASS (assignments 1200, concepts 153, curriculum 330)
- `node mid1st/scripts/validate-calibration-selection.mjs --max 12` → PASS (선택 12개)

## 검증 결과

`node mid1st/scripts/validate-candidates.mjs --author claude --report mid1st/candidates/claude/validation_report.md`

- 상태: **PASS** (files 120, sentences 1200, Errors 없음)
- 자동 휴리스틱 검토 메모: 138건 / 서로 다른 wordId 130개
  - assignment-review 48 (배정 단계에서 이미 `reviewRequired: true`로 표시된 항목)
  - factuality-risk 83 (수치·인과·전칭 표현이 들어간 문장의 사실 확인용 표시)
  - safety-risk 7 (표제어 자체가 위험 어휘인 항목)
  - figurative-risk 0
- 추가 자체 점검
  - 1,200문장 중 동일 문장 중복 0건
  - `selected_examples.jsonl`의 claude 선택 6개(DAY01-04, DAY04-02, DAY06-05, DAY09-02, DAY10-03, DAY26-01)는 사용자가 승인한 문장을 그대로 유지
  - codex·antigravity가 선택된 6개(DAY01-29, DAY11-20, DAY11-31, DAY16-05, DAY21-02, DAY30-03)는 해당 후보를 읽지 않고 새 장면으로 독립 작성 — 주어·구조·구절 복제 없음
  - direct/contextual 330개와 fallback 870개를 표본 추출해 뜻·개념 직접성, 비유 부재, 한 장면 성립을 확인

## 판단이 어려웠던 wordId

### 1. 안전 규칙과 확정 뜻이 충돌한 항목

`req.txt`의 폭력·피·위험 묘사 금지를 지키면서 확정 뜻을 문자 그대로 보여야 해서 장면 선택 폭이 좁았다. 모두 비묘사적·교육적 장면으로 처리했으나 사람 확인이 필요하다.

| wordId | word | 처리 방식 |
|---|---|---|
| DAY17-29 | bleed | 코피 대처 안내 문장으로 처리(출혈 묘사 없음) |
| DAY18-04 | wound | 이미 아물고 있는 상처에 붕대가 덮인 상태만 제시 |
| DAY18-38 | fatal | 확정 정의가 "very serious"이므로 모형 로켓 실패 상황으로 처리 |
| DAY23-05 | drown | 구명조끼 착용 안내로 처리(사고 장면 없음) |
| DAY14-25 | weapon | 박물관 유리장 속 전시물로 처리 |
| DAY14-27 | combat | 역사책이 서술하는 대상으로만 처리 |
| DAY21-22 / DAY16-23 | poison / toxic | 먹지 않는다는 안전 지침 형태 |
| DAY22-26 / DAY24-37 | deadly / starve | 각각 유출유·겨울 새 먹이주기로 완화 |
| DAY12-33 | funeral | 조용한 추모 장면으로만 처리 |

### 2. 표제어 굴절 금지 때문에 문장 설계가 까다로웠던 항목

- **DAY07-20 `degree`** — 각의 단위는 보통 복수(`degrees`)로 쓰지만 굴절이 금지되어 "one degree"로 단수 사용이 자연스러운 문장을 새로 설계했다.
- **DAY29-30 `complete`, DAY07-33 `cherish`, DAY13-04 `vary`** 등 — 3인칭 단수 -s를 피하려고 복수 주어를 선택했다.

### 3. 규칙 자체와 표제어 뜻이 충돌한 항목

- **DAY08-34 `metaphor`(은유)** — 문장에서 비유 사용이 금지되어 있어, 은유를 *사용*하지 않고 시 속 은유를 *관찰 대상으로 서술*하는 문장으로 처리했다. 사람 검토 시 이 처리 방향이 적절한지 확인이 필요하다.

### 4. 다의어이지만 뜻이 고정된 항목 (배정에서도 reviewRequired 표시됨)

DAY01-24 `iron`, DAY02-40 `term`, DAY04-20 `board`, DAY04-32 `vice`, DAY06-11 `object`, DAY06-20 `race`, DAY10-40 `stock`, DAY11-09 `state`, DAY13-40 `scale`, DAY17-40 `tissue`, DAY18-32 `beat`, DAY26-07 `charge`, DAY27-09 `official`, DAY27-10 `officer`, DAY28-17 `credit`, DAY29-40 `domestic` 등 — 확정 `meaningKo`/`definition`이 가리키는 뜻만 쓰되, 다른 뜻으로 읽히지 않도록 문맥 단서를 문장 안에 넣었다.

## 반복적으로 나타난 문제 유형

1. **동일 개념의 다회 배정으로 인한 장면 획일화 위험** — `KOR-dialogue-principles`(11회), `SOC-law-morality-and-the-rule-of-law`(12회), `SOC-geographic-scale-and-spatial-interaction`, `MATH-interpreting-graphs` 등은 cue가 동일해 문장이 서로 비슷해지기 쉬웠다. 배정별로 주어·행동·측정 대상을 의도적으로 다르게 잡아 분산시켰다.
2. **day_fallback cue의 일반성** — 전체 1,200개 중 814개가 day_fallback이고 cue가 "DAY 주제 장면에서 뜻이 바로 보이게 한다"로 동일하다. 교과 요소를 억지로 넣지 않고 DAY 주제 안의 구체 사물·행동으로만 장면을 만들었다.
3. **8~12단어 제한과 개념 직접성의 균형** — 개념 증거(측정·비교·근거)를 넣으면 12단어에 근접해, 수식어를 줄이고 사실 관계 한 가지만 남기는 방식으로 조정했다.
4. **인칭대명사 회피** — 성별이 정해지지 않은 등장인물에 he/she를 쓰지 않도록 직업·역할 명사(runner, guide, potter 등)를 주어로 사용했다.

## 사람 검토 권장 항목

- 자동 휴리스틱이 표시한 **wordId 130개** (위 안전 7건 포함)
- 위 "판단이 어려웠던 wordId" 중 안전 치환 9건과 `metaphor` 1건은 처리 방향 자체에 대한 승인이 필요하다.
