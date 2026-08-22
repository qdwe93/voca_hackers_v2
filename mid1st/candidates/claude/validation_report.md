# Candidate validation report — claude

- 상태: **PASS**
- mode: full
- expected words: 1200
- candidate sentences: 1200
- files: 120

## 의미 검토 범위

이 검증기는 철자·길이·ID·경로·strict 형식을 확인한다. 지정 뜻과 배정 교과 개념이
비유 없이 직접 드러나는지, 교과 사실이 정확한지는 자동 확정하지 않는다. 아래 휴리스틱
메모와 assignment의 `conceptCueKo`를 함께 보고 사람이 비교·선택해야 한다.

## Warnings

- WARN: 자동 휴리스틱 검토 메모 138건

## Review notes (PASS/FAIL에 영향 없음)

| wordId | word | concept | concept cue | kind | note | sentence |
|---|---|---|---|---|---|---|
| DAY01-01 | chore | fallback | 의식주생활 장면에서 '집안일'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Feeding the rabbit is my easiest chore every Saturday morning. |
| DAY01-22 | bitter | fallback | 의식주생활 장면에서 '쓴'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | This dark chocolate tastes bitter, not sweet at all. |
| DAY01-24 | iron | SCI-conduction | 뜨거운 다리미에서 천으로 열이 전도되어 주름이 펴지는 모습을 관찰한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '다리미'에 맞는 장면인지 확인해야 한다. | Heat moves from the hot iron into the shirt, flattening wrinkles. |
| DAY01-28 | appeal | fallback | 의식주생활 장면에서 '마음을 끌다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '마음을 끌다'에 맞는 장면인지 확인해야 한다. | Soft cotton pajamas appeal to shoppers who want comfortable sleep. |
| DAY02-19 | shout | KOR-phonology-and-writing-systems | 말소리의 크기와 들림 정도를 비교해 소리의 특징을 설명한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Players shout across the field because normal talking cannot reach there. |
| DAY02-20 | subject | fallback | 학교생활 장면에서 '과목'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '과목'에 맞는 장면인지 확인해야 한다. | History is the subject I study right after lunch. |
| DAY02-35 | union | SOC-labor-rights | 노동자가 조합을 만들어 근로 조건과 안전 문제를 함께 협의한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Factory workers' union asked for safer ladders and shorter night hours. |
| DAY02-40 | term | fallback | 학교생활 장면에서 '용어, 기간'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '용어, 기간'에 맞는 장면인지 확인해야 한다. | Photosynthesis is a science term that means making food from light. |
| DAY03-31 | capital | fallback | 여가와 취미 장면에서 '수도'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '수도'에 맞는 장면인지 확인해야 한다. | Seoul is the capital of Korea, so many tourists visit it. |
| DAY04-20 | board | fallback | 일과 직업 장면에서 '탑승하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '탑승하다'에 맞는 장면인지 확인해야 한다. | Passengers board the morning ferry with heavy fishing boxes. |
| DAY04-25 | wage | SOC-labor-rights | 임금·안전·단결권 등 일터의 기본 권리를 사례에서 확인한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Part-time workers receive a fair wage for every hour worked. |
| DAY04-30 | formal | KOR-orthography-and-language-variation | 상황과 상대에 따라 격식 있는 말투와 편안한 말투를 구별한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | New workers use formal words at interviews and casual words with friends. |
| DAY04-32 | vice | fallback | 일과 직업 장면에서 '부(副), 대리'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '부(副), 대리'에 맞는 장면인지 확인해야 한다. | The vice captain leads practice when the captain is absent. |
| DAY04-38 | competent | fallback | 일과 직업 장면에서 '유능한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | A competent guide answered every question about the mountain path. |
| DAY05-01 | muscle | fallback | 운동과 건강 장면에서 '근육'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Running up stairs makes every leg muscle work harder. |
| DAY05-08 | cause | fallback | 운동과 건강 장면에서 '원인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The cause of my sore knee was too much running. |
| DAY05-25 | monitor | SCI-scientific-inquiry | 현상을 일정 시간 관찰하며 변화를 감지하고 자료로 기록한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | We monitor our heart rate every minute and record the numbers. |
| DAY06-11 | object | fallback | 성격과 심리 장면에서 '물건'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '물건'에 맞는 장면인지 확인해야 한다. | The smallest object in the box is a wooden button. |
| DAY06-13 | anxious | fallback | 성격과 심리 장면에서 '불안한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Waiting for test results made my brother anxious all morning. |
| DAY06-20 | race | fallback | 성격과 심리 장면에서 '경주'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '경주'에 맞는 장면인지 확인해야 한다. | Two turtles finished the slow race side by side. |
| DAY06-28 | correspond | KOR-dialogue-principles | 편지를 주고받을 때 목적과 상대에 맞게 내용을 이어서 응답한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '일치하다, 편지를 주고받다'에 맞는 장면인지 확인해야 한다. | Two pen pals correspond monthly and answer each other's questions. |
| DAY07-14 | rely | fallback | 인간관계 장면에서 '의지하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Younger children rely on the crossing guard every school morning. |
| DAY07-20 | degree | MATH-interior-and-exterior-angles | 다각형 꼭짓점의 내각과 이어진 외각의 크기를 재어 관계를 확인한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '도(단위), 정도, 학위'에 맞는 장면인지 확인해야 한다. | Turning the polygon's side one degree changes its interior and exterior angles. |
| DAY07-29 | contribute | SOC-sustainable-development-and-international-cooperation | 공동 문제를 해결하려고 사람이나 집단이 자원과 역할을 나누어 협력한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Three villages contribute workers and tools to rebuild the shared bridge. |
| DAY07-36 | casual | KOR-orthography-and-language-variation | 상황과 상대에 따라 격식 있는 말투와 편안한 말투를 구별한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | With close friends we use casual words, but teachers hear polite ones. |
| DAY07-40 | treat | fallback | 인간관계 장면에서 '대하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Good teammates treat every player with the same fair respect. |
| DAY07-40 | treat | fallback | 인간관계 장면에서 '대하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '대하다'에 맞는 장면인지 확인해야 한다. | Good teammates treat every player with the same fair respect. |
| DAY08-08 | pleasure | fallback | 말과 언어 장면에서 '즐거움'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Telling funny stories gives my grandmother great pleasure every evening. |
| DAY08-09 | involve | fallback | 말과 언어 장면에서 '포함하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Our word game will involve every student in the class. |
| DAY09-07 | selfish | fallback | 도덕과 윤리 장면에서 '이기적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Taking all the crayons was selfish, so I returned some. |
| DAY09-08 | penalty | SOC-law-morality-and-the-rule-of-law | 법적 의무와 도덕적 의무를 구별하고 모든 사람에게 같은 절차를 적용한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The same penalty applies to every player who breaks this rule. |
| DAY09-14 | generous | fallback | 도덕과 윤리 장면에서 '너그러운'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Our neighbor is generous and shares fresh vegetables every week. |
| DAY09-21 | devote | fallback | 도덕과 윤리 장면에서 '바치다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Some volunteers devote every Sunday to cleaning the river bank. |
| DAY09-23 | gender | SOC-socialization-and-social-identity | 가족·학교·친구 관계에서 규범과 정체성을 배우는 모습을 찾는다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Our club welcomes members of any gender for every activity. |
| DAY09-31 | fundamental | fallback | 도덕과 윤리 장면에서 '근본적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Honesty is a fundamental rule in every team we join. |
| DAY09-37 | humble | fallback | 도덕과 윤리 장면에서 '겸손한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The winning runner stayed humble and thanked every teammate quietly. |
| DAY09-40 | order | MATH-comparing-and-ordering-rational-numbers | 여러 수를 같은 기준으로 비교해 작은 수부터 순서대로 놓는다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '순서'에 맞는 장면인지 확인해야 한다. | We placed the five fractions in order from smallest to largest. |
| DAY10-01 | welfare | SOC-human-rights-and-constitutional-rights | 건강·교육·기초 생활을 보장하는 사회적 권리와 복지의 관계를 확인한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Free school lunches protect the welfare of every child here. |
| DAY10-01 | welfare | SOC-human-rights-and-constitutional-rights | 건강·교육·기초 생활을 보장하는 사회적 권리와 복지의 관계를 확인한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Free school lunches protect the welfare of every child here. |
| DAY10-10 | personnel | fallback | 문제와 해결책 장면에서 '직원들'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Hospital personnel meet every morning to plan the day's work. |
| DAY10-18 | unite | SOC-sustainable-development-and-international-cooperation | 공동 문제를 해결하려고 사람이나 집단이 자원과 역할을 나누어 협력한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Three classes unite to clean the school garden every spring. |
| DAY10-18 | unite | SOC-sustainable-development-and-international-cooperation | 공동 문제를 해결하려고 사람이나 집단이 자원과 역할을 나누어 협력한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Three classes unite to clean the school garden every spring. |
| DAY10-21 | abandon | fallback | 문제와 해결책 장면에서 '버리다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Please never abandon a pet beside the river path. |
| DAY10-38 | compromise | KOR-discussion | 여러 사람이 문제의 대안을 말하고 공통 결론이나 타협점을 찾는다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Our compromise gives the field to soccer players every other day. |
| DAY10-40 | stock | fallback | 문제와 해결책 장면에서 '재고'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '재고'에 맞는 장면인지 확인해야 한다. | The shop's stock of notebooks ran low before the new semester. |
| DAY11-06 | plot | KOR-narrative-conflict | 등장인물의 목표와 장애물·갈등이 사건을 어떻게 움직이는지 정리한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | We wrote the plot showing how the lost map caused trouble. |
| DAY11-09 | state | fallback | 예술과 문학 장면에서 '상태'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Workers checked the state of every wooden frame before the show. |
| DAY11-09 | state | fallback | 예술과 문학 장면에서 '상태'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '상태'에 맞는 장면인지 확인해야 한다. | Workers checked the state of every wooden frame before the show. |
| DAY11-20 | volume | KOR-phonology-and-writing-systems | 말소리의 크기와 들림 정도를 비교해 소리의 특징을 설명한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '음량'에 맞는 장면인지 확인해야 한다. | Lower the radio volume until the singer's soft words become clear. |
| DAY11-28 | profound | fallback | 한 장면에서 '깊은'의 확정 뜻이 다른 뜻으로 오해되지 않게 직접 보여 준다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The last line left a profound feeling in every reader. |
| DAY11-32 | opportunity | fallback | 예술과 문학 장면에서 '기회'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The contest gives every student one opportunity to read aloud. |
| DAY11-33 | poetry | KOR-poetic-devices | 시에서 반복되는 소리와 비유·상징이 만드는 느낌을 찾는다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | This poetry repeats soft s sounds in every second line. |
| DAY12-07 | suit | fallback | 미디어와 음악 장면에서 '어울리다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '어울리다'에 맞는 장면인지 확인해야 한다. | Bright yellow scarves suit the dancers in this stage light. |
| DAY12-17 | genius | fallback | 미디어와 음악 장면에서 '천재'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | That young violin genius practiced eight hours every day. |
| DAY12-40 | cast | KOR-multimodal-media-production | 대본·영상·소리 자료를 역할에 맞게 묶어 하나의 매체 자료를 만든다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '배역진'에 맞는 장면인지 확인해야 한다. | The whole cast recorded their lines before the filming day. |
| DAY13-24 | humor | fallback | 문화와 종교 장면에서 '유머'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The storyteller's gentle humor made every listener smile at once. |
| DAY13-40 | scale | SOC-geographic-scale-and-spatial-interaction | 동네·도시·국가처럼 지리적 규모를 바꾸어 같은 현상의 범위를 비교한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '규모, 저울, 비늘'에 맞는 장면인지 확인해야 한다. | We compared the festival at village scale and then city scale. |
| DAY14-12 | settle | SOC-physical-and-human-environments | 자연환경과 사람이 만든 토지 이용·정착 모습을 한 지역에서 비교한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Farmers settle near flat land because rice needs level fields. |
| DAY14-14 | mass | fallback | 역사와 전통 장면에서 '덩어리'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '덩어리'에 맞는 장면인지 확인해야 한다. | The potter pressed a large mass of clay onto the wheel. |
| DAY14-25 | weapon | fallback | 역사와 전통 장면에서 '무기'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 상처·폭력 관련 어휘 | One old wooden weapon rests inside the museum's glass case. |
| DAY14-38 | cooperation | SOC-sustainable-development-and-international-cooperation | 공동 문제를 해결하려고 사람이나 집단이 자원과 역할을 나누어 협력한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Village cooperation rebuilt the shared well after the dry summer. |
| DAY14-40 | stable | SCI-force-equilibrium | 서로 반대 방향의 힘이 균형을 이루어 물체가 안정된 상태를 유지한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The stone tower stays stable because opposite pushes balance each other. |
| DAY15-02 | education | fallback | 교육과 학문 장면에서 '교육'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Free education helps every child in this town read well. |
| DAY15-15 | standard | fallback | 교육과 학문 장면에서 '기준'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Every poster must reach the same standard of neat handwriting. |
| DAY15-22 | submit | fallback | 교육과 학문 장면에서 '제출하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | We submit our reading logs to the librarian every Monday. |
| DAY15-31 | bias | KOR-media-literacy | 뉴스의 출처·표현·빠진 정보를 확인해 메시지를 비판적으로 읽는다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | This news report shows bias because it quotes only one side. |
| DAY16-12 | conduct | SCI-scientific-inquiry | 정해진 절차와 통제 조건에 따라 실험을 수행하고 결과를 기록한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | We conduct the test three times and record every result. |
| DAY16-15 | gravity | SCI-gravity-mass-and-weight | 질량과 무게를 구별하고 중력이 물체를 아래로 당기는 힘을 잰다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The scale shows more weight because gravity pulls harder on heavier stones. |
| DAY16-23 | toxic | fallback | 물리학과 화학 장면에서 '독성의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 독성·위험 관련 어휘 | Some wild berries are toxic, so we never taste them. |
| DAY16-23 | toxic | fallback | 물리학과 화학 장면에서 '독성의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Some wild berries are toxic, so we never taste them. |
| DAY16-25 | liquid | SCI-states-of-matter | 고체·액체·기체의 모양과 부피 및 입자 배열을 비교한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Poured liquid takes the shape of every container we use. |
| DAY16-35 | particle | SCI-temperature-and-particle-motion | 온도가 높아질수록 입자 운동이 빨라지는 모형을 관찰한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Every particle moves faster when the water temperature rises. |
| DAY16-38 | valid | KOR-source-credibility | 자료의 작성자·날짜·근거를 확인하고 다른 출처와 대조한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | This measurement stays valid because two students checked the same scale. |
| DAY17-07 | research | SCI-scientific-inquiry | 관찰 질문을 세우고 한 조건만 바꾼 실험의 자료와 결론을 기록한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | This research recorded leaf color every week for two months. |
| DAY17-14 | threat | SCI-biodiversity-conservation | 서식지 파괴가 특정 생물종에 주는 위협과 보호 방법을 연결한다 | safety-risk | 공포·위협 관련 어휘 | Losing wetlands is the biggest threat to these migrating birds. |
| DAY17-14 | threat | SCI-biodiversity-conservation | 서식지 파괴가 특정 생물종에 주는 위협과 보호 방법을 연결한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Losing wetlands is the biggest threat to these migrating birds. |
| DAY17-22 | silent | KOR-phonology-and-writing-systems | 말소리의 크기와 들림 정도를 비교해 소리의 특징을 설명한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The classroom went silent, so we heard every soft breath sound. |
| DAY17-29 | bleed | fallback | 생물학과 유전학 장면에서 '피가 나다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 상처·폭력 관련 어휘 | If your nose begins to bleed, sit down and stay calm. |
| DAY17-40 | tissue | fallback | 생물학과 유전학 장면에서 '화장지'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '화장지'에 맞는 장면인지 확인해야 한다. | Wipe the wet table with one soft paper tissue. |
| DAY18-04 | wound | fallback | 의학과 질병 장면에서 '상처'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 상처·폭력 관련 어휘 | A clean bandage covers the healing wound on my elbow. |
| DAY18-20 | seal | SCI-gas-pressure | 밀봉한 용기 안 기체 입자의 충돌이 압력을 만드는 모습을 모형으로 본다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '밀봉하다'에 맞는 장면인지 확인해야 한다. | We seal the bottle, so trapped air pushes on its walls. |
| DAY18-21 | track | fallback | 의학과 질병 장면에서 '추적하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '추적하다'에 맞는 장면인지 확인해야 한다. | Nurses track each patient's temperature on a simple daily chart. |
| DAY18-24 | alert | fallback | 의학과 질병 장면에서 '경계하는'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The lifeguard stayed alert and watched every swimmer closely. |
| DAY18-32 | beat | fallback | 의학과 질병 장면에서 '이기다, 치다, 두드리다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '이기다, 치다, 두드리다'에 맞는 장면인지 확인해야 한다. | Doctors count how many times a heart can beat each minute. |
| DAY18-38 | fatal | fallback | 의학과 질병 장면에서 '치명적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 독성·위험 관련 어휘 | Skipping the safety check was a fatal error for the model rocket. |
| DAY18-40 | patient | fallback | 의학과 질병 장면에서 '환자'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '환자'에 맞는 장면인지 확인해야 한다. | One patient waited calmly while the nurse checked the chart. |
| DAY19-06 | efficient | fallback | 정보와 기술 장면에서 '효율적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | This lamp is efficient because it uses very little electricity. |
| DAY19-09 | trust | fallback | 정보와 기술 장면에서 '신뢰하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | We trust this weather site because it lists its sources. |
| DAY19-12 | artificial | SCI-artificial-intelligence-and-science | 사람이 만든 인공지능이 자료에서 규칙을 찾아 예측하는 과정을 확인한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | This artificial helper learned rules from thousands of weather records. |
| DAY20-10 | leak | fallback | 교통과 통신 장면에서 '새다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Old pipes leak water onto the sidewalk every rainy week. |
| DAY20-16 | accurate | KOR-source-credibility | 자료의 작성자·날짜·근거를 확인하고 다른 출처와 대조한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | This timetable is accurate because the station updated it today. |
| DAY20-29 | commit | fallback | 교통과 통신 장면에서 '약속하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Drivers commit to stopping fully at every school crossing. |
| DAY21-14 | lay | fallback | 동물과 식물 장면에서 '알을 낳다, 놓다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Hens lay one egg almost every morning in warm seasons. |
| DAY21-18 | engage | fallback | 동물과 식물 장면에서 '참여시키다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Our guide will engage every visitor by asking simple questions. |
| DAY21-22 | poison | fallback | 동물과 식물 장면에서 '독'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 독성·위험 관련 어휘 | Some mushrooms carry poison, so we never pick them. |
| DAY21-22 | poison | fallback | 동물과 식물 장면에서 '독'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Some mushrooms carry poison, so we never pick them. |
| DAY21-25 | role | SOC-social-status-and-social-role | 한 사람이 가진 지위와 그에 기대되는 역할을 구별한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The club leader's role includes watering plants every Friday. |
| DAY22-02 | desert | fallback | 자연과 생태계 장면에서 '사막'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Few plants grow in this desert because rain falls rarely. |
| DAY22-04 | mature | fallback | 자연과 생태계 장면에서 '성숙한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | A mature oak tree produces many acorns every autumn season. |
| DAY22-16 | element | fallback | 자연과 생태계 장면에서 '요소'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Clean water is one important element of every healthy wetland. |
| DAY22-24 | eco-friendly | SCI-sustainable-development | 자원 사용의 환경·사회 영향을 함께 비교해 오래 지속할 방법을 고른다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Cloth bags are eco-friendly because we reuse them many times. |
| DAY22-25 | portion | fallback | 자연과 생태계 장면에서 '부분'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Only a small portion of this field stays wet all year. |
| DAY23-01 | climate | SOC-physical-and-human-environments | 한 지역의 장기간 기후가 생활과 토지 이용에 미치는 영향을 비교한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | This warm climate lets farmers grow two rice crops yearly. |
| DAY23-13 | damage | fallback | 기후와 지리 장면에서 '손상'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The flood caused damage to the wooden bridge railings. |
| DAY24-08 | essential | fallback | 자원과 에너지 장면에서 '필수적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Clean water is essential for every living thing here. |
| DAY24-11 | solve | MATH-equations-and-solutions | 미지수가 있는 등식에서 참이 되는 값을 찾아 문제를 해결한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | We solve the equation and find that x equals seven. |
| DAY24-13 | source | fallback | 자원과 에너지 장면에서 '근원'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '근원'에 맞는 장면인지 확인해야 한다. | This spring is the source of our village stream. |
| DAY24-16 | coal | SCI-sustainable-development | 석탄 사용의 에너지 이점과 대기·기후 영향을 재생 에너지와 비교한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Burning coal makes electricity but adds smoke to the air. |
| DAY24-29 | content | fallback | 자원과 에너지 장면에서 '내용'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '내용'에 맞는 장면인지 확인해야 한다. | The label lists the sugar content of this fruit drink. |
| DAY24-32 | float | SCI-buoyancy | 물에 넣은 물체가 밀어낸 물의 양과 뜨거나 가라앉는 결과를 비교한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The wooden block will float because it pushes aside enough water. |
| DAY24-40 | plant | fallback | 자원과 에너지 장면에서 '심다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '심다'에 맞는 장면인지 확인해야 한다. | We plant bean seeds two centimeters under the soft soil. |
| DAY25-13 | generate | SCI-renewable-energy | 태양빛을 이용해 전기를 발생시키는 장치의 에너지 변환을 확인한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | These panels generate electricity whenever bright sunlight hits them. |
| DAY25-18 | marine | SOC-pacific-environmental-challenges | 해수면 상승과 해양 오염이 태평양 섬과 생태계에 주는 영향을 살핀다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Rising seas and plastic threaten marine life around small Pacific islands. |
| DAY25-26 | responsible | fallback | 환경 문제 장면에서 '책임감 있는'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Responsible campers carry every wrapper home in their backpacks. |
| DAY25-30 | dedicate | fallback | 환경 문제 장면에서 '바치다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Our club members dedicate every Saturday morning to river cleaning. |
| DAY25-39 | discard | fallback | 환경 문제 장면에서 '버리다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Never discard batteries with normal trash; use the special box. |
| DAY26-02 | obey | SOC-law-morality-and-the-rule-of-law | 법적 의무와 도덕적 의무를 구별하고 모든 사람에게 같은 절차를 적용한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Every driver must obey the same traffic light rules. |
| DAY26-05 | innocent | SOC-civil-and-criminal-trials | 민사와 형사 사건에서 당사자·목적·결과가 어떻게 다른지 비교한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The court found the shopkeeper innocent after hearing every witness. |
| DAY26-07 | charge | fallback | 법과 사회 장면에서 '요금을 청구하다, 충전하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '요금을 청구하다, 충전하다'에 맞는 장면인지 확인해야 한다. | Bus companies charge less money for students on weekends. |
| DAY26-09 | law | SOC-law-morality-and-the-rule-of-law | 법적 의무와 도덕적 의무를 구별하고 모든 사람에게 같은 절차를 적용한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | This law protects every child's right to attend school. |
| DAY26-32 | secure | fallback | 법과 사회 장면에서 '안전한, 튼튼한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The bicycle stayed secure because we locked it to the rack. |
| DAY26-38 | prohibit | SOC-law-morality-and-the-rule-of-law | 법적 의무와 도덕적 의무를 구별하고 모든 사람에게 같은 절차를 적용한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Park signs prohibit fishing here, and rangers check every visitor. |
| DAY27-03 | vote | SOC-free-and-fair-elections | 비밀 투표와 정확한 개표로 유권자의 선택을 공정하게 반영한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Students vote in secret, then two helpers count every paper. |
| DAY27-05 | civil | SOC-democracy-and-citizenship | 시민이 자유와 평등을 지키며 공공 문제 결정에 참여한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Voting is one civil right that adults use every election. |
| DAY27-14 | guard | fallback | 정치와 행정 장면에서 '지키다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Two volunteers guard the crosswalk every school morning until eight. |
| DAY27-17 | opinion | SOC-political-process-and-public-opinion | 설문과 토론으로 모인 여론이 정책 의제와 결정에 반영되는 과정을 추적한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Every written opinion from residents went into the council meeting. |
| DAY28-01 | economic | SOC-industrial-structure-and-global-value-chains | 생산 단계별 비용과 부가가치가 기업의 이익과 경제 활동으로 이어짐을 본다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Each economic step, from farm to shop, adds a little cost. |
| DAY28-17 | credit | fallback | 경제와 금융 장면에서 '신용, 칭찬, 학점'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '신용, 칭찬, 학점'에 맞는 장면인지 확인해야 한다. | The whole team received credit for finishing the mural early. |
| DAY28-29 | proceed | fallback | 경제와 금융 장면에서 '진행하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | We proceed with the fundraising plan after counting every vote. |
| DAY29-05 | international | SOC-globalization-and-glocalization | 서로 다른 나라 사이의 상품·사람·문화 이동이 지역 생활을 바꾸는 사례를 본다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | This international shop sells Korean tea beside Indian spices. |
| DAY29-18 | import | SOC-resource-exports-and-interdependence | 자원 수출국과 수입국이 무역을 통해 서로 의존하는 관계를 표시한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Korea must import wheat because local farms grow mostly rice. |
| DAY29-40 | domestic | fallback | 산업과 경영 장면에서 '가정의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '가정의'에 맞는 장면인지 확인해야 한다. | These domestic tools include a broom, a mop, and buckets. |
| DAY30-01 | magazine | KOR-media-literacy | 뉴스의 출처·표현·빠진 정보를 확인해 메시지를 비판적으로 읽는다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | This magazine lists its writers and sources on every page. |
| DAY30-03 | press | SCI-force-and-net-force | 물체에 작용하는 힘의 크기와 방향을 화살표로 합성한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '누르다, 언론'에 맞는 장면인지 확인해야 한다. | We press down on the scale and watch the number rise. |
| DAY30-05 | recent | KOR-source-credibility | 자료의 게시 날짜가 최근인지 확인해 현재 주장에 쓸 수 있는지 판단한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | We used the most recent chart because older numbers changed. |
| DAY30-05 | recent | KOR-source-credibility | 자료의 게시 날짜가 최근인지 확인해 현재 주장에 쓸 수 있는지 판단한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | We used the most recent chart because older numbers changed. |
| DAY30-07 | document | KOR-informative-writing | 독자가 절차나 사실을 이해하도록 정확한 정보를 순서 있게 쓴다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | One document lists every safety rule in numbered order. |
| DAY30-14 | obvious | fallback | 한 장면에서 '분명한'의 확정 뜻이 다른 뜻으로 오해되지 않게 직접 보여 준다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The missing date made the mistake obvious to every reader. |

## Errors

- 없음

