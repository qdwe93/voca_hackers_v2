# Candidate validation report — codex

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

- WARN: 자동 휴리스틱 검토 메모 154건

## Review notes (PASS/FAIL에 영향 없음)

| wordId | word | concept | concept cue | kind | note | sentence |
|---|---|---|---|---|---|---|
| DAY01-01 | chore | fallback | 의식주생활 장면에서 '집안일'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The robot completed every chore before the family woke up. |
| DAY01-24 | iron | SCI-conduction | 뜨거운 다리미에서 천으로 열이 전도되어 주름이 펴지는 모습을 관찰한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '다리미'에 맞는 장면인지 확인해야 한다. | Heat from the iron moves into cloth and smooths wrinkles. |
| DAY01-28 | appeal | fallback | 의식주생활 장면에서 '마음을 끌다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '마음을 끌다'에 맞는 장면인지 확인해야 한다. | Colorful fruit bowls appeal to children choosing a healthy snack. |
| DAY01-30 | compel | fallback | 의식주생활 장면에서 '강요하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the rules compel every player to move only one space. |
| DAY01-35 | tender | fallback | 의식주생활 장면에서 '부드러운'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the stew had tender carrots that melted in every bite. |
| DAY02-01 | active | fallback | 학교생활 장면에서 '활발한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the active puppy ran across the field all morning. |
| DAY02-05 | encourage | fallback | 학교생활 장면에서 '격려하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | A sports teacher will encourage every runner before the large race. |
| DAY02-10 | principle | fallback | 학교생활 장면에서 '원칙'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, sharing fairly is an important principle in every team game. |
| DAY02-14 | annual | fallback | 학교생활 장면에서 '연례의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the village holds an annual kite festival every warm spring. |
| DAY02-20 | subject | fallback | 학교생활 장면에서 '과목'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '과목'에 맞는 장면인지 확인해야 한다. | Science is the subject where students investigate plants and forces. |
| DAY02-32 | strict | fallback | 학교생활 장면에서 '엄격한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Before lunch, the strict but kind teacher checked every desk. |
| DAY02-35 | union | SOC-labor-rights | 노동자가 조합을 만들어 근로 조건과 안전 문제를 함께 협의한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Workers form a union to discuss fair pay and safety. |
| DAY02-40 | term | fallback | 학교생활 장면에서 '용어, 기간'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '용어, 기간'에 맞는 장면인지 확인해야 한다. | The teacher defines each science term with a clear example. |
| DAY03-17 | practice | fallback | 여가와 취미 장면에서 '연습하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The young penguins practice their dance every evening close to the ice. |
| DAY03-25 | ensure | fallback | 여가와 취미 장면에서 '보장하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, strong ropes ensure the swing stays safe for every child. |
| DAY03-31 | capital | fallback | 여가와 취미 장면에서 '수도'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '수도'에 맞는 장면인지 확인해야 한다. | The capital contains the main offices that govern the country. |
| DAY03-40 | return | fallback | 여가와 취미 장면에서 '돌아가다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the birds return to the warm valley every early spring. |
| DAY04-04 | tend | fallback | 일과 직업 장면에서 '돌보다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | A student gardener will tend the roses every quiet spring morning. |
| DAY04-10 | label | fallback | 일과 직업 장면에서 '라벨'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | One colorful label was stuck on every jam jar. |
| DAY04-13 | divide | MATH-operations-with-integers-and-rational-numbers | 정수나 분수를 더하고 빼고 곱하고 나누어 값을 구한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Students divide twelve counters into three equal groups. |
| DAY04-20 | board | fallback | 일과 직업 장면에서 '탑승하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '탑승하다'에 맞는 장면인지 확인해야 한다. | Passengers board the bus after the driver opens its doors. |
| DAY04-27 | spend | fallback | 일과 직업 장면에서 '쓰다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The small rabbits spend every sunny afternoon painting in the garden. |
| DAY04-30 | formal | KOR-orthography-and-language-variation | 상황과 상대에 따라 격식 있는 말투와 편안한 말투를 구별한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | She uses formal language when presenting her report to adults. |
| DAY04-32 | vice | fallback | 일과 직업 장면에서 '부(副), 대리'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '부(副), 대리'에 맞는 장면인지 확인해야 한다. | The vice captain leads practice when the captain is absent. |
| DAY05-08 | cause | fallback | 운동과 건강 장면에서 '원인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Today, too little sleep was the cause of the sleepy yawns. |
| DAY05-21 | capable | fallback | 운동과 건강 장면에서 '유능한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the capable young sailor tied every knot without any help. |
| DAY05-23 | frequent | fallback | 운동과 건강 장면에서 '잦은'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, frequent rain kept the garden green all through the summer. |
| DAY05-26 | consume | fallback | 운동과 건강 장면에서 '소비하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, growing puppies consume a lot of water every single day. |
| DAY05-29 | slide | SCI-friction | 표면의 거칠기와 마찰이 미끄러지는 움직임에 주는 영향을 비교한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Blocks slide farther on smooth wood because friction is lower. |
| DAY05-35 | intake | fallback | 운동과 건강 장면에서 '섭취량'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | A sports teacher checked the water intake of every young runner. |
| DAY06-11 | object | fallback | 성격과 심리 장면에서 '물건'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '물건'에 맞는 장면인지 확인해야 한다. | The student picks up each object and describes its texture. |
| DAY06-15 | sudden | fallback | 한 장면에서 '갑작스러운'의 확정 뜻이 다른 뜻으로 오해되지 않게 직접 보여 준다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | One sudden breeze lifted every paper napkin off the table. |
| DAY06-20 | race | fallback | 성격과 심리 장면에서 '경주'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '경주'에 맞는 장면인지 확인해야 한다. | Two cyclists start a race to see who finishes fastest. |
| DAY06-22 | stare | fallback | 성격과 심리 장면에서 '응시하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The small owl will stare at the moon all night long. |
| DAY06-28 | correspond | KOR-dialogue-principles | 편지를 주고받을 때 목적과 상대에 맞게 내용을 이어서 응답한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '일치하다, 편지를 주고받다'에 맞는 장면인지 확인해야 한다. | The pen pals correspond by answering each other's questions in letters. |
| DAY06-30 | crucial | fallback | 성격과 심리 장면에서 '결정적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, water is a crucial part of every growing green plant. |
| DAY07-02 | situation | fallback | 인간관계 장면에서 '상황'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the rainy situation changed all the plans for the picnic. |
| DAY07-03 | related | fallback | 인간관계 장면에서 '관련된'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Today, these two puzzles are related because they share one picture. |
| DAY07-04 | suppose | KOR-inference | 글에 나온 단서와 배경지식을 연결해 드러나지 않은 뜻을 추론한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Readers suppose the door opened because muddy prints lead outside. |
| DAY07-06 | unique | fallback | 인간관계 장면에서 '독특한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, every snowflake has a unique shape falling from the sky. |
| DAY07-10 | district | fallback | 인간관계 장면에서 '구역'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the quiet garden district has flowers along every narrow street. |
| DAY07-20 | degree | MATH-interior-and-exterior-angles | 다각형 꼭짓점의 내각과 이어진 외각의 크기를 재어 관계를 확인한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '도(단위), 정도, 학위'에 맞는 장면인지 확인해야 한다. | Students record the degree measure of each angle with a protractor. |
| DAY07-21 | capacity | MATH-surface-area-and-volume | 상자나 원기둥의 겉넓이와 내부 부피를 단위로 계산한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Students calculate the box's capacity using equal unit cubes. |
| DAY07-29 | contribute | SOC-sustainable-development-and-international-cooperation | 공동 문제를 해결하려고 사람이나 집단이 자원과 역할을 나누어 협력한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Two towns contribute workers and tools to repair the bridge. |
| DAY07-36 | casual | KOR-orthography-and-language-variation | 상황과 상대에 따라 격식 있는 말투와 편안한 말투를 구별한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Friends use casual language while chatting after the formal meeting. |
| DAY07-40 | treat | fallback | 인간관계 장면에서 '대하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '대하다'에 맞는 장면인지 확인해야 한다. | Classmates treat the new student with patience and respect. |
| DAY08-05 | public | fallback | 말과 언어 장면에서 '공공의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the public garden welcomes families every warm summer afternoon. |
| DAY08-09 | involve | fallback | 말과 언어 장면에서 '포함하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The games involve every child in the helpful summer camp. |
| DAY08-16 | share | fallback | 말과 언어 장면에서 '나누다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The brown bear will share honey cake with all the cubs. |
| DAY08-18 | translate | fallback | 말과 언어 장면에서 '번역하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | A helpful robot can translate every message for the visitors. |
| DAY09-06 | necessary | fallback | 한 장면에서 '필요한'의 확정 뜻이 다른 뜻으로 오해되지 않게 직접 보여 준다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, water is necessary for every plant in the school garden. |
| DAY09-07 | selfish | fallback | 도덕과 윤리 장면에서 '이기적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the selfish dragon puppet kept all the cookies to itself. |
| DAY09-08 | penalty | SOC-law-morality-and-the-rule-of-law | 법적 의무와 도덕적 의무를 구별하고 모든 사람에게 같은 절차를 적용한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The same rule gives each player an equal penalty. |
| DAY09-14 | generous | fallback | 도덕과 윤리 장면에서 '너그러운'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The generous baker offered extra rolls to every child. |
| DAY09-37 | humble | fallback | 도덕과 윤리 장면에서 '겸손한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | After the game, the humble champion thanked every teammate. |
| DAY09-40 | order | MATH-comparing-and-ordering-rational-numbers | 여러 수를 같은 기준으로 비교해 작은 수부터 순서대로 놓는다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '순서'에 맞는 장면인지 확인해야 한다. | Students place fractions in order from smallest to largest. |
| DAY10-01 | welfare | SOC-human-rights-and-constitutional-rights | 건강·교육·기초 생활을 보장하는 사회적 권리와 복지의 관계를 확인한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Free school meals protect children's health and welfare. |
| DAY10-10 | personnel | fallback | 문제와 해결책 장면에서 '직원들'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the zoo personnel fed the animals early every single morning. |
| DAY10-14 | critic | fallback | 문제와 해결책 장면에서 '비평가'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the food critic tasted every soup at the village fair. |
| DAY10-18 | unite | SOC-sustainable-development-and-international-cooperation | 공동 문제를 해결하려고 사람이나 집단이 자원과 역할을 나누어 협력한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Nearby towns unite their workers and tools to clean the river. |
| DAY10-40 | stock | fallback | 문제와 해결책 장면에서 '재고'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '재고'에 맞는 장면인지 확인해야 한다. | The clerk checks the store's stock before ordering more rice. |
| DAY11-09 | state | fallback | 예술과 문학 장면에서 '상태'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '상태'에 맞는 장면인지 확인해야 한다. | The restorer checks the old painting's state before cleaning it. |
| DAY11-20 | volume | KOR-phonology-and-writing-systems | 말소리의 크기와 들림 정도를 비교해 소리의 특징을 설명한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '음량'에 맞는 장면인지 확인해야 한다. | The speaker lowers the microphone volume until everyone hears clearly. |
| DAY12-01 | perform | fallback | 미디어와 음악 장면에서 '공연하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the young dancers perform on stage every autumn evening. |
| DAY12-07 | suit | fallback | 미디어와 음악 장면에서 '어울리다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '어울리다'에 맞는 장면인지 확인해야 한다. | These soft blue shoes suit the dancer's silver costume. |
| DAY12-08 | inspire | fallback | 미디어와 음악 장면에서 '영감을 주다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, ocean waves inspire the young painter every single morning. |
| DAY12-13 | steady | fallback | 미디어와 음악 장면에서 '꾸준한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | One steady rain fell all night on the tin roof. |
| DAY12-15 | define | KOR-explanation-and-argument | 원인과 결과 또는 주장과 근거의 연결을 분명히 설명한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Students define evaporation, then explain its cause with evidence. |
| DAY12-30 | consistent | fallback | 미디어와 음악 장면에서 '일관된'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the baker keeps a consistent taste in every honey loaf. |
| DAY12-40 | cast | KOR-multimodal-media-production | 대본·영상·소리 자료를 역할에 맞게 묶어 하나의 매체 자료를 만든다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '배역진'에 맞는 장면인지 확인해야 한다. | The cast combines acting, sound, and props for one show. |
| DAY13-40 | scale | SOC-geographic-scale-and-spatial-interaction | 동네·도시·국가처럼 지리적 규모를 바꾸어 같은 현상의 범위를 비교한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '규모, 저울, 비늘'에 맞는 장면인지 확인해야 한다. | The map changes scale to show neighborhoods, cities, and countries. |
| DAY14-14 | mass | fallback | 역사와 전통 장면에서 '덩어리'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '덩어리'에 맞는 장면인지 확인해야 한다. | A dark mass of clouds gathers above the quiet town. |
| DAY14-25 | weapon | fallback | 역사와 전통 장면에서 '무기'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 상처·폭력 관련 어휘 | An old wooden weapon rested safely within the glass case. |
| DAY14-31 | harvest | fallback | 역사와 전통 장면에서 '수확'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | This year's harvest filled every barn with yellow corn. |
| DAY14-38 | cooperation | SOC-sustainable-development-and-international-cooperation | 공동 문제를 해결하려고 사람이나 집단이 자원과 역할을 나누어 협력한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Town cooperation brings workers and tools together to repair wells. |
| DAY15-05 | medical | fallback | 교육과 학문 장면에서 '의학의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the medical team checked every puppy at the animal shelter. |
| DAY15-14 | praise | fallback | 교육과 학문 장면에서 '칭찬하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | An instructor will praise every student who tried hard today. |
| DAY15-15 | standard | fallback | 교육과 학문 장면에서 '기준'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the bakery keeps a high standard for every fruit tart. |
| DAY15-27 | discipline | fallback | 교육과 학문 장면에서 '규율'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, daily discipline helped the young swimmer improve every single week. |
| DAY15-33 | examination | fallback | 교육과 학문 장면에서 '시험'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the examination covered every plant in the school garden. |
| DAY15-35 | laboratory | fallback | 교육과 학문 장면에서 '실험실'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the laboratory had bright beakers along every clean white shelf. |
| DAY15-39 | deprived | SOC-human-rights-and-constitutional-rights | 필요한 권리나 접근이 부족한 사람이 동등하게 교육과 서비스를 이용할 방법을 찾는다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Students deprived of books receive equal library access. |
| DAY16-20 | support | SCI-force-equilibrium | 서로 반대 방향의 힘이 같을 때 물체가 안정된 상태를 유지함을 본다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Two equal forces support the balanced hanging sign. |
| DAY16-23 | toxic | fallback | 물리학과 화학 장면에서 '독성의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 독성·위험 관련 어휘 | Today, some bright berries are toxic, so nobody should taste them. |
| DAY16-24 | atom | fallback | 물리학과 화학 장면에서 '원자'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, every single atom is far too small to see. |
| DAY17-12 | circumstance | fallback | 생물학과 유전학 장면에서 '상황'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | After all, one lucky circumstance let the picnic happen. |
| DAY17-14 | threat | SCI-biodiversity-conservation | 서식지 파괴가 특정 생물종에 주는 위협과 보호 방법을 연결한다 | safety-risk | 공포·위협 관련 어휘 | Habitat loss is a threat to frogs living near wetlands. |
| DAY17-14 | threat | SCI-biodiversity-conservation | 서식지 파괴가 특정 생물종에 주는 위협과 보호 방법을 연결한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Habitat loss is a threat to frogs living near wetlands. |
| DAY17-29 | bleed | fallback | 생물학과 유전학 장면에서 '피가 나다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 상처·폭력 관련 어휘 | The dog started to bleed, so we wrapped his injured paw. |
| DAY17-39 | explicit | fallback | 생물학과 유전학 장면에서 '명확한'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The explicit map displayed every turn along the trail. |
| DAY17-40 | tissue | fallback | 생물학과 유전학 장면에서 '화장지'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '화장지'에 맞는 장면인지 확인해야 한다. | The child uses a tissue to wipe spilled juice. |
| DAY18-04 | wound | fallback | 의학과 질병 장면에서 '상처'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 상처·폭력 관련 어휘 | One small bandage covered the wound on the puppy's paw. |
| DAY18-19 | trouble | fallback | 의학과 질병 장면에서 '문제'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Today, the tangled string caused trouble for the young kite flyer. |
| DAY18-20 | seal | SCI-gas-pressure | 밀봉한 용기 안 기체 입자의 충돌이 압력을 만드는 모습을 모형으로 본다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '밀봉하다'에 맞는 장면인지 확인해야 한다. | Students seal a bottle before testing how trapped air pushes. |
| DAY18-21 | track | fallback | 의학과 질병 장면에서 '추적하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '추적하다'에 맞는 장면인지 확인해야 한다. | Nurses track the patient's temperature on a daily chart. |
| DAY18-27 | disabled | SOC-human-rights-and-constitutional-rights | 필요한 권리나 접근이 부족한 사람이 동등하게 교육과 서비스를 이용할 방법을 찾는다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | A ramp gives disabled students equal access to the classroom. |
| DAY18-32 | beat | fallback | 의학과 질병 장면에서 '이기다, 치다, 두드리다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '이기다, 치다, 두드리다'에 맞는 장면인지 확인해야 한다. | Doctors hear the patient's heart beat steadily through a stethoscope. |
| DAY18-38 | fatal | fallback | 의학과 질병 장면에서 '치명적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 독성·위험 관련 어휘 | A plant disease became fatal after its leaves turned brown. |
| DAY18-40 | patient | fallback | 의학과 질병 장면에서 '환자'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '환자'에 맞는 장면인지 확인해야 한다. | A nurse brings warm soup to the recovering patient. |
| DAY19-01 | modern | fallback | 정보와 기술 장면에서 '현대의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the modern kitchen had shiny buttons on every drawer. |
| DAY19-02 | mobile | fallback | 정보와 기술 장면에서 '이동하는'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | One mobile library visits the village every second week. |
| DAY19-12 | artificial | SCI-artificial-intelligence-and-science | 사람이 만든 인공지능이 자료에서 규칙을 찾아 예측하는 과정을 확인한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | An artificial system studies weather data and predicts tomorrow's rain. |
| DAY19-30 | erase | fallback | 정보와 기술 장면에서 '지우다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, waves erase every footprint along the smooth wet sand. |
| DAY20-22 | construction | fallback | 교통과 통신 장면에서 '건설'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the bridge construction continued all through the warm summer. |
| DAY20-28 | eliminate | fallback | 교통과 통신 장면에서 '없애다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, careful sweeping can eliminate dust from every corner. |
| DAY20-29 | commit | fallback | 교통과 통신 장면에서 '약속하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The club will commit to practicing every single morning. |
| DAY20-34 | vital | fallback | 교통과 통신 장면에서 '필수적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, clean water is vital for every living green plant. |
| DAY20-40 | station | fallback | 교통과 통신 장면에서 '역'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the busy station filled with travelers every early morning. |
| DAY21-18 | engage | fallback | 동물과 식물 장면에서 '참여시키다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the story will engage every child in the room. |
| DAY21-22 | poison | fallback | 동물과 식물 장면에서 '독'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 독성·위험 관련 어휘 | A locked cabinet keeps each poison safely away from children. |
| DAY21-36 | diameter | MATH-sectors-and-arcs | 원의 중심각·반지름·호를 표시하고 부채꼴의 크기를 비교한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Students draw a diameter, then mark two equal semicircle arcs. |
| DAY22-06 | maintain | fallback | 자연과 생태계 장면에서 '유지하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, gardeners maintain the park paths through every busy season. |
| DAY22-16 | element | fallback | 자연과 생태계 장면에서 '요소'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, water is an important element of every healthy garden. |
| DAY22-27 | tension | SCI-force-equilibrium | 팽팽한 줄이 양쪽 물체를 당기는 힘의 방향과 크기를 표시한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Equal tension pulls both ends of the balanced sign. |
| DAY22-40 | yield | fallback | 자연과 생태계 장면에서 '산출하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, these apple trees yield sweet fruit every single autumn. |
| DAY23-01 | climate | SOC-physical-and-human-environments | 한 지역의 장기간 기후가 생활과 토지 이용에 미치는 영향을 비교한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | A dry climate leads farmers to grow crops needing little water. |
| DAY23-07 | rough | SCI-friction | 표면의 거칠기와 마찰이 미끄러지는 움직임에 주는 영향을 비교한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The block moves slowly on rough wood because friction is stronger. |
| DAY23-13 | damage | fallback | 기후와 지리 장면에서 '손상'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Today, the storm caused small damage to the garden fence. |
| DAY23-23 | drought | fallback | 기후와 지리 장면에서 '가뭄'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the long drought made the village save every drop. |
| DAY23-38 | split | fallback | 기후와 지리 장면에서 '나누다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Two classmates will split the melon into equal halves. |
| DAY24-08 | essential | fallback | 자원과 에너지 장면에서 '필수적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, sunlight is essential for every green growing plant. |
| DAY24-11 | solve | MATH-equations-and-solutions | 미지수가 있는 등식에서 참이 되는 값을 찾아 문제를 해결한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Students solve x plus three equals seven using balance blocks. |
| DAY24-13 | source | fallback | 자원과 에너지 장면에서 '근원'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '근원'에 맞는 장면인지 확인해야 한다. | Melting mountain snow is the source of this clear stream. |
| DAY24-16 | coal | SCI-sustainable-development | 석탄 사용의 에너지 이점과 대기·기후 영향을 재생 에너지와 비교한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Burning coal provides energy but releases gases into the air. |
| DAY24-21 | shortage | fallback | 자원과 에너지 장면에서 '부족'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | One water shortage made the villagers share every bucket. |
| DAY24-29 | content | fallback | 자원과 에너지 장면에서 '내용'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '내용'에 맞는 장면인지 확인해야 한다. | The guide checks the box's content before shipping it. |
| DAY24-40 | plant | fallback | 자원과 에너지 장면에서 '심다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '심다'에 맞는 장면인지 확인해야 한다. | Students plant sunflower seeds where they can receive enough sunlight. |
| DAY25-13 | generate | SCI-renewable-energy | 태양빛을 이용해 전기를 발생시키는 장치의 에너지 변환을 확인한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Solar panels generate electricity by changing energy from sunlight. |
| DAY25-18 | marine | SOC-pacific-environmental-challenges | 해수면 상승과 해양 오염이 태평양 섬과 생태계에 주는 영향을 살핀다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Plastic waste harms marine animals around small Pacific islands. |
| DAY25-20 | fine | SOC-law-morality-and-the-rule-of-law | 법적 의무와 도덕적 의무를 구별하고 모든 사람에게 같은 절차를 적용한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The same legal rule gives each driver an equal fine. |
| DAY25-23 | respect | fallback | 환경 문제 장면에서 '존중'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | A student always treats her elderly neighbors with care and sincere respect. |
| DAY25-30 | dedicate | fallback | 환경 문제 장면에서 '바치다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, volunteers dedicate every weekend to cleaning the river bank. |
| DAY25-37 | acknowledge | fallback | 환경 문제 장면에서 '인정하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The club will acknowledge every helper at the picnic. |
| DAY26-07 | charge | fallback | 법과 사회 장면에서 '요금을 청구하다, 충전하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '요금을 청구하다, 충전하다'에 맞는 장면인지 확인해야 한다. | The campsite will charge each visitor five dollars per night. |
| DAY26-12 | raise | fallback | 법과 사회 장면에서 '올리다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Sailors raise the colorful flag every sunny morning. |
| DAY26-23 | plenty | fallback | 한 장면에서 '많음'의 확정 뜻이 다른 뜻으로 오해되지 않게 직접 보여 준다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, there was plenty of soup for every hungry guest. |
| DAY27-03 | vote | SOC-free-and-fair-elections | 비밀 투표와 정확한 개표로 유권자의 선택을 공정하게 반영한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Students vote secretly, and teachers count every ballot accurately. |
| DAY27-07 | conservative | fallback | 정치와 행정 장면에서 '보수적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the conservative baker keeps the same recipe every year. |
| DAY27-15 | profit | SOC-industrial-structure-and-global-value-chains | 생산 단계별 비용과 부가가치가 기업의 이익과 경제 활동으로 이어짐을 본다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | The factory's profit equals sales money after production costs. |
| DAY27-25 | household | fallback | 정치와 행정 장면에서 '가정'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Every household on the street shared garden tools cheerfully. |
| DAY27-28 | spot | fallback | 정치와 행정 장면에서 '발견하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | safety-risk | 독성·위험 관련 어휘 | Today, can you spot the poison dart frog among the leaves? |
| DAY28-01 | economic | SOC-industrial-structure-and-global-value-chains | 생산 단계별 비용과 부가가치가 기업의 이익과 경제 활동으로 이어짐을 본다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Factories add economic value as raw cotton becomes clothing. |
| DAY28-17 | credit | fallback | 경제와 금융 장면에서 '신용, 칭찬, 학점'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '신용, 칭찬, 학점'에 맞는 장면인지 확인해야 한다. | The teacher gives Mia credit for solving the difficult puzzle. |
| DAY28-32 | independent | fallback | 경제와 금융 장면에서 '독립적인'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, the independent kitten opened the door all alone. |
| DAY28-40 | account | fallback | 경제와 금융 장면에서 '계좌'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | The savings account grew gently with every small coin. |
| DAY29-05 | international | SOC-globalization-and-glocalization | 서로 다른 나라 사이의 상품·사람·문화 이동이 지역 생활을 바꾸는 사례를 본다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | An international market brings foreign foods to local neighborhoods. |
| DAY29-12 | deliver | fallback | 산업과 경영 장면에서 '배달하다'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | One cheerful rider will deliver bread to every house. |
| DAY29-40 | domestic | fallback | 산업과 경영 장면에서 '가정의'의 뜻이 행동·사물·상태로 바로 보이게 한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '가정의'에 맞는 장면인지 확인해야 한다. | Parents share domestic tasks such as cooking and cleaning. |
| DAY30-03 | press | SCI-force-and-net-force | 물체에 작용하는 힘의 크기와 방향을 화살표로 합성한다 | assignment-review | 확정 뜻 또는 품사에 다른 대표 용법이 함께 있어 '누르다, 언론'에 맞는 장면인지 확인해야 한다. | Students press opposite sides of a cart to compare forces. |
| DAY30-05 | recent | KOR-source-credibility | 자료의 게시 날짜가 최근인지 확인해 현재 주장에 쓸 수 있는지 판단한다 | assignment-review | 교과 개념 연결이 장식적 배경으로 약해지지 않는지 예문 단계에서 확인해야 한다. | Students check whether a recent article uses current evidence. |
| DAY30-17 | detail | fallback | 언론과 뉴스 장면에서 '세부 사항'의 뜻이 행동·사물·상태로 바로 보이게 한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, every tiny detail of the model ship looked perfect. |
| DAY30-18 | conflict | SOC-social-conflict-and-discrimination | 집단 간 갈등과 차별의 원인을 찾고 평등한 해결 방안을 비교한다 | factuality-risk | 인과·등식 주장의 사실 정확성 확인 | Students find the conflict's cause and choose an equal solution. |
| DAY30-19 | thus | fallback | 한 장면에서 '따라서'의 확정 뜻이 다른 뜻으로 오해되지 않게 직접 보여 준다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | Today, rain fell all night; thus, the river rose higher. |
| DAY30-31 | deceive | SOC-media-and-information-literacy | 사람을 속이는 정보의 출처와 근거를 확인해 사실과 구별한다 | factuality-risk | 전칭 표현의 사실 정확성 확인 | False headlines deceive readers who never check their sources. |

## Errors

- 없음

