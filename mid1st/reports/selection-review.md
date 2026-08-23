# 예문 선별 검토 보고서

- 대상: 1,200단어 전량 (baseline · codex · antigravity · claude 4개 후보 비교)
- 비교표: `mid1st/comparisons/all.md`
- 선택 manifest: `mid1st/final/selection_manifest.jsonl`
- `build-final.mjs --dry-run`: **PASS (1,200/1,200)**

## 1. 요약 수치

| 항목 | 수 |
|---|---:|
| 자동 추천 (`auto:`) | 1,193 |
| 사람 검토 필요 → **사용자 확정 완료** | 7 |
| 합계 | 1,200 |

### 추천 출처별 분포

| 출처 | 추천 수 |
|---|---:|
| claude | 854 |
| codex | 135 |
| baseline | 112 |
| antigravity | 98 |
| manual | 1 |

### 확정 뜻·품사 불일치로 탈락한 후보

문장이 `meaningKo`·`partOfSpeech`·`definition`이 지정한 뜻이나 품사와 다르게 쓰인 경우다.

| author | 수 | 해당 wordId |
|---|---:|---|
| antigravity | 12 | DAY04-05 position(직위), DAY06-11 object(반대하다), DAY07-16 request(동사), DAY07-39 owe(은혜를 입다), DAY07-40 treat(치료하다), DAY08-06 promise(명사), DAY08-28 besides(전치사), DAY08-29 cure(명사), DAY13-27 persist(증상이 지속되다), DAY17-10 sigh(명사), DAY25-15 harm(명사), DAY30-25 regret(명사) |
| codex | 8 | DAY11-15 outline(동사), DAY15-25 display(명사), DAY16-13 solid(명사), DAY23-04 average(명사), DAY26-14 criminal(형용사), DAY27-06 limit(동사), DAY28-06 trade(동사), DAY29-14 claim(명사) |
| baseline | 3 | DAY10-07 serious(진지한), DAY23-04 average(명사), DAY29-40 domestic(가축) |
| claude | 0 | — |
| 합계 | 23 | |

### 교과 개념 직접성이 부족한 후보

교과 개념이 배정된 330단어(direct 202 + contextual 128)에서 `conceptCueKo`의 사실·관계가 문장 안에 드러나지 않은 후보 수다. 각 author 330문장이 모집단이다.

| author | 개념 미구현 | 비율 |
|---|---:|---:|
| baseline | 311 | 94% |
| antigravity | 166 | 50% |
| claude | 23 | 7% |
| codex | 14 | 4% |
| 합계 | 514 / 1,320 | |

### 분포에 대한 설명

claude 비중이 높은 이유는 두 가지 관찰된 패턴 때문이며, 문체 선호가 아니다.

1. **codex는 fallback 870단어에서 baseline을 거의 그대로 재사용했다.** 1,200문장 중 833개가 baseline과 어휘의 80% 이상을 공유하고(그중 808개가 fallback 단어), 471개는 `Today,` 또는 `Now,`를 앞에 붙여 길이만 늘렸다. 같은 기준으로 antigravity는 1개, claude는 12개다. baseline 재서술은 새 후보로서 baseline보다 나을 것이 없어 대부분 baseline 또는 다른 author에게 밀렸다. 반면 교과 배정 330단어에서는 개념 구현이 가장 정확해 136건을 가져갔다.
2. **baseline은 교과 배정 이전에 쓰인 문장이라 330단어 중 311건에서 배정 개념이 없다.** day_fallback에서도 판타지 동물 장면이 DAY 주제(예: 학교생활, 일과 직업)와 어긋나는 경우가 많았다.

antigravity는 개념 구현이 절반 수준이고, 관사 누락·문장 절단(`...for play`, `...emissions into`) 같은 문법 오류와 초6 수준을 넘는 어휘가 반복돼 동점 상황에서 밀렸다.

## 2. 사람 검토가 필요한 항목 (7개)

아래 7개는 확정 뜻 해석이 후보마다 갈리거나 안전 표현 수위를 사람이 정해야 하는 항목이었다.
**2026-08-23 사용자가 모두 확정했고 manifest에 반영했다.** 각 항목의 `- 사용자 확정:` 줄이 최종 선택이다.

| wordId | 최초 추천 | 사용자 확정 |
|---|---|---|
| DAY02-26 minimum | claude | **claude** |
| DAY02-36 maximum | codex | **antigravity** |
| DAY12-33 funeral | claude | **claude** |
| DAY16-22 orbit | manual | **manual** |
| DAY17-29 bleed | claude | **claude** |
| DAY24-29 content | claude | **baseline** |
| DAY29-40 domestic | codex | **codex** |

남은 확인 사항 두 가지는 4절에 적었다.

### DAY02-26 · minimum

- 확정 뜻·품사·정의: 최소의 / adj. / the smallest amount that is allowed
- PART·DAY: PART 1 일상생활 · DAY 2 학교생활
- 공통 개념: mathematics / MATH-comparing-and-ordering-rational-numbers (MATH-comparing-and-ordering-rational-numbers) · matchMode contextual
- conceptCueKo: 여러 수를 비교해 가장 작은 값과 가장 큰 값을 찾는다

| 출처 | 문장 |
|---|---|
| baseline | Each player needs a minimum score to join the next round. |
| codex | Students compare four scores and circle the minimum value. |
| antigravity | The test requires a minimum passing score of sixty points. |
| claude | We circled the minimum value among five numbers on the board. |

- 현재 추천: **claude**
- **사용자 확정: claude**
- 검토 이유: 확정 정의는 '허용되는 최소'인데 배정 개념은 자료의 최솟값 찾기라 baseline·antigravity(합격 점수)와 codex·claude(수 비교)가 뜻을 다르게 해석했다

### DAY02-36 · maximum

- 확정 뜻·품사·정의: 최대의 / adj. / the largest amount that is allowed
- PART·DAY: PART 1 일상생활 · DAY 2 학교생활
- 공통 개념: mathematics / MATH-comparing-and-ordering-rational-numbers (MATH-comparing-and-ordering-rational-numbers) · matchMode contextual
- conceptCueKo: 여러 수를 비교해 가장 작은 값과 가장 큰 값을 찾는다

| 출처 | 문장 |
|---|---|
| baseline | The little cart carried its maximum load of round pumpkins. |
| codex | Students compare the loads and identify the maximum weight. |
| antigravity | The thermometer reached a maximum recorded temperature of thirty degrees. |
| claude | Eight kilograms is the maximum weight this science scale allows. |

- 현재 추천: **codex**
- **사용자 확정: antigravity**
- 검토 이유: minimum과 같은 사유로 '허용되는 최대'와 '자료의 최댓값' 해석이 갈린다

### DAY12-33 · funeral

- 확정 뜻·품사·정의: 장례식 / n. / a time when people say goodbye to someone
- PART·DAY: PART 3 문화&예술 · DAY 12 미디어와 음악
- 공통 개념: fallback · matchMode day_fallback
- conceptCueKo: 미디어와 음악 장면에서 '장례식'의 뜻이 행동·사물·상태로 바로 보이게 한다

| 출처 | 문장 |
|---|---|
| baseline | The village held a quiet funeral for the old oak. |
| codex | Today, the village held a quiet funeral for the old oak. |
| antigravity | Friends and family gathered solemnly for the memorial funeral service. |
| claude | Quiet music played during the funeral for the village elder. |

- 현재 추천: **claude**
- **사용자 확정: claude**
- 검토 이유: 죽음을 다루는 소재라 표현 수위 확인이 필요하다. baseline·codex는 나무의 장례라 비유적이다

### DAY16-22 · orbit

- 확정 뜻·품사·정의: 궤도 / n. / the path a planet takes around a star
- PART·DAY: PART 4 과학&기술 · DAY 16 물리학과 화학
- 공통 개념: science / SCI-solar-system-objects (SCI-solar-system-objects) · matchMode direct
- conceptCueKo: 태양·행성·위성·소행성을 특징과 궤도로 분류한다

| 출처 | 문장 |
|---|---|
| baseline | The tiny moon follows a wide orbit around the planet. |
| codex | The small moon follows a wide orbit around the planet. |
| antigravity | The Moon follows an elliptical orbit around Earth every single month. |
| claude | The moon follows a curved orbit around our planet Earth. |

- 현재 추천: **manual** — `Earth follows a curved orbit around the sun each year.`
- **사용자 확정: manual**
- 검토 이유: 확정 정의는 '행성이 별 주위를 도는 경로'인데 네 후보 모두 달이 행성을 도는 궤도만 보여 준다

### DAY17-29 · bleed

- 확정 뜻·품사·정의: 피가 나다 / v. / to lose blood from the body
- PART·DAY: PART 4 과학&기술 · DAY 17 생물학과 유전학
- 공통 개념: fallback · matchMode day_fallback
- conceptCueKo: 생물학과 유전학 장면에서 '피가 나다'의 뜻이 행동·사물·상태로 바로 보이게 한다

| 출처 | 문장 |
|---|---|
| baseline | The dog began to bleed, so we wrapped his injured paw. |
| codex | The dog started to bleed, so we wrapped his injured paw. |
| antigravity | Minor paper cuts can bleed slightly before forming a protective scab. |
| claude | If your nose begins to bleed, sit down and stay calm. |

- 현재 추천: **claude**
- **사용자 확정: claude**
- 검토 이유: 단어 뜻이 출혈이라 안전 규칙과 충돌한다. 코피 대처라는 가장 안전한 표현을 골랐으나 확인이 필요하다

### DAY24-29 · content

- 확정 뜻·품사·정의: 내용 / n. / the information or material inside something
- PART·DAY: PART 5 자연&환경 · DAY 24 자원과 에너지
- 공통 개념: fallback · matchMode day_fallback
- conceptCueKo: 자원과 에너지 장면에서 '내용'의 뜻이 행동·사물·상태로 바로 보이게 한다

| 출처 | 문장 |
|---|---|
| baseline | The box's content includes tools ropes and a lantern. |
| codex | The guide checks the box's content before shipping it. |
| antigravity | Check the fat content on the back of the milk carton. |
| claude | The label lists the sugar content of this fruit drink. |

- 현재 추천: **claude**
- **사용자 확정: baseline**
- 검토 이유: baseline·codex는 상자 속 물건, antigravity·claude는 성분 함량으로 '내용'을 다르게 해석했다

### DAY29-40 · domestic

- 확정 뜻·품사·정의: 가정의 / adj. / about the home or your own country
- PART·DAY: PART 6 사회 · DAY 29 산업과 경영
- 공통 개념: fallback · matchMode day_fallback
- conceptCueKo: 산업과 경영 장면에서 '가정의'의 뜻이 행동·사물·상태로 바로 보이게 한다

| 출처 | 문장 |
|---|---|
| baseline | Cats and dogs are common domestic animals in homes. |
| codex | Parents share domestic tasks such as cooking and cleaning. |
| antigravity | Washing dishes and sweeping floors are common domestic chores in households. |
| claude | These domestic tools include a broom, a mop, and buckets. |

- 현재 추천: **codex**
- **사용자 확정: codex**
- 검토 이유: 확정 뜻은 '가정의'인데 baseline은 domestic animals(가축) 용법이라 해석이 갈린다
## 3. 다음 단계

1. 7개 검토 항목은 사용자 확정으로 종료했고 manifest의 `reviewRequired:` 항목은 0개다.
2. `node mid1st/scripts/build-final.mjs --dry-run` 재실행 결과 **PASS 1,200/1,200**.
3. 남은 작업은 `node mid1st/scripts/build-final.mjs --report mid1st/reports/final-build.md` 실행으로 `final/final_sentences.jsonl`을 만드는 것뿐이다.

## 4. 확정 뒤 남은 확인 사항 (2건)

사용자 선택을 그대로 반영했으나, 선택한 문장 자체에 다음 특성이 있어 기록해 둔다.

### DAY24-29 content — baseline 문장의 쉼표 누락

```
The box's content includes tools ropes and a lantern.
```

`tools, ropes, and a lantern`이어야 할 자리에 쉼표가 없다. 선택한 author의 문장은 고칠 수 없으므로 바로잡으려면 `manual`로 바꿔야 한다.

- 수정안(9단어, exact word 유지): `The box's content includes tools, ropes, and a lantern.`

### DAY02-36 maximum — 배정 개념이 문장에 없음

```
The thermometer reached a maximum recorded temperature of thirty degrees.
```

'최대의'라는 확정 뜻과 품사는 정확하지만, 배정 개념 `MATH-comparing-and-ordering-rational-numbers`의 단서(여러 수를 비교해 최댓값을 찾는다)는 드러나지 않는다. 교과 연결보다 어휘 뜻을 우선한 선택으로 기록한다.
