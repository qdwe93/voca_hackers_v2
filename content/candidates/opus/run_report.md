# opus — 1단계 실행 보고서

## 만든 범위

- DAY 01 ~ DAY 30 전체, 세트 120/120 (`DAYnn_ss-ee_setn` 4세트 × 30일)
- 단어 1,200개 (`hackers.csv` 의 DAY·번호 순서 그대로, 철자 무변경)
- 산출물: 세트별 `words.json` (schemaVersion 3, 10단어) + `image_prompts.md` (프롬프트 20개)
- 이미지·TTS·렌더는 이 단계 범위가 아니므로 실행하지 않았다.

## 검증 결과

```
node remotion\scripts\validate-content.mjs --author opus
120/120 sets passed
```

FAIL 0건, WARN 0건. 장면 묘사는 전부 30단어 권장선 이내라 길이 경고도 없다.

## 작성 기준 요약

- 정의: 초등 6학년 어휘, 12단어 이하. 예문: 표제어 철자 그대로 포함, 8~12단어, 한 장면으로 그려지는 문장.
- 예문끼리 이야기를 잇지 않았고, 고정 인물 이름을 쓰지 않았다 (문장 중간 대문자 고유명사를 아예 배제).
- 프롬프트: 장면 영어 한 문장 + 고정 접미 그대로. 비율·해상도·여백·`no logo`류·화풍 수식어는 넣지 않았다.
- 이미지에 글자가 생길 만한 소재(간판, 손글씨 카드, 숫자 시계, 라벨, 성적표, 달력)는 장면 단계에서 회피했다.

## 판단이 갈렸던 단어와 결정

### 동형이음어 · 다품사어 (발음/품사 교차 확인)

- `wound` (DAY18): 명사 "상처" 로 확정, `/wuːnd/`. 동사 wind 의 과거형 `/waʊnd/` 과 구분.
- `bleed` (DAY17): 사람 출혈 대신 "천·물에 색이 번지다" 뜻을 채택했다. 초6 안전 기준(req.txt)에 맞고 실제로 흔한 용법이다. 빨간 양말이 세탁물을 물들이는 장면.
- `minute` (DAY01): 명사 "분" `/ˈmɪnɪt/`. 형용사 "미세한" `/maɪˈnuːt/` 이 아니다.
- `record` (DAY14) 동사 `/rɪˈkɔːrd/`, `content` (DAY24) 명사 `/ˈkɑːntent/`, `object` (DAY06) 명사 `/ˈɑːbdʒɪkt/`, `present` (DAY29) 명사 `/ˈpreznt/`, `suspect` (DAY26) 명사 `/ˈsʌspekt/`, `import` (DAY29) 동사 `/ɪmˈpɔːrt/`, `contrast`·`contract` (DAY26) 명사, `increase`·`decrease` 동사 — 강세 위치를 품사에 맞춰 지정했다.
- `iron` `/ˈaɪərn/`, `receipt` `/rɪˈsiːt/`, `subtle` 계열의 묵음, `thumb` `/θʌm/`, `debt` `/det/` — 묵음 자음 확인.
- 짝지어 나오는 혼동쌍(quite/quiet, principal/principle, lose/loose, vacation/vocation, wonder/wander, former/formal, terrible/terrific, plane/plain, adopt/adapt, precede/proceed, compete/complete, loyal/royal, pray/prey, sign/sigh, scene/scent, trail/trait/trial)은 같은 세트 안에서 IPA·품사·뜻이 확실히 갈리도록 짝을 맞춰 썼다.
- `bear` (DAY10 no.20): 동물이 아니라 "참다" 동사. 같은 DAY 안에서 곰 이미지와 겹치지 않게 낙타 장면으로 잡았다.
- `found` (DAY26): find 의 과거형이 아니라 "설립하다" 동사 `/faʊnd/`.
- `fine` (DAY25), `charge` (DAY26), `scale` (DAY13), `branch` (DAY28), `medium` (DAY30) 등 다의어는 초6이 먼저 배우는 쪽 뜻을 택하고 예문·이미지를 그 뜻에만 맞췄다.

### 추상어 — 눈에 보이는 장면으로 치환

- `quite`(꽤): 아주 높이 쌓인 팬케이크를 올려다보는 쥐로 "정도"를 표현.
- `mind`·`insight`·`brilliant`: 머리 위에 뜬 전구.
- `principle`·`ethical`·`moral`: 사과를 똑같이 나누기, 거스름돈 돌려주기 같은 행동 장면.
- `perspective`: 나무 위에서 내려다본 작아진 마을.
- `context`: 웃음이 터진 이유가 보이는 넓은 장면.
- `absence`: 바람이 없어 완전히 잔잔한 호수.
- `potential`: 씨앗과 다 자란 나무를 나란히.
- `gender` (DAY09): 이분법을 피해 "a person's identity as a girl, a boy, or other" 로 정의하고, 이미지는 다양한 아이들이 함께 서 있는 장면으로 했다.

### 안전 치환 (req.txt 기준)

- `cruel`·`insult`·`criminal`·`arrest`·`combat`·`weapon`·`penalty`·`deadly`·`fatal`: 인형극 악당, 보드게임 규칙, 체스 말, 박물관 유리장 안의 옛 도구처럼 판타지·게임·전시 상황으로 옮겼다.
- `funeral`(DAY12): 사람 장례 대신 마을이 오래된 참나무 그루터기에 꽃을 놓는 장면.
- `orphan`(DAY10): 부모 잃은 아이 묘사 대신 농부가 우유를 먹여 키우는 새끼 양.
- `victim`(DAY10): 폭풍에 기운 어린 나무.
- `drown`(DAY23): 물을 너무 많이 줘서 잠긴 토마토 뿌리.
- `starve`(DAY24): 흙과 빛이 부족한 식물.
- `wound`·`surgery`(DAY18): 강아지 발의 작은 반창고, 인형 곰을 고치는 어린이 의사.
- `explode`(DAY30): 팝콘이 터지는 장면.
- `rage`·`furious`: 케이크 앞에서 화가 풀리는 거인, 팔짱 낀 만화 용.
- `prejudice`·`exclude`: 배제 장면을 그리지 않고, 서로 다가가는 동물 무리 / 누군가를 기다리는 원의 빈자리로 바꿨다.

### 프롬프트 쪽 판단

- `label`, `receipt`, `stamp`, `document`, `script`, `sentence`, `spell`, `journal`, `mathematics`, `semester`, `register` 처럼 글자가 자연스럽게 딸려올 소재는 "blank paper tag", "long narrow paper slip", "picture cookbook", "counting blocks" 처럼 글자 없는 형태로 지정했다.
- `minute`, `temperature`, `deadline` 의 시계·온도계는 숫자판이 나오지 않도록 "round kitchen timer being turned by a hand" 같은 표현을 썼다.
- 단어 이미지와 예문 이미지가 같은 그림이 되지 않도록, 단어 쪽은 개념 자체(도구·상태·행동), 예문 쪽은 예문 문장의 상황으로 항상 다르게 잡았다.
