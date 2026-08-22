# sol 콘텐츠 후보 생성 보고서

## 생성 범위

- 작성자: `sol`
- 범위: DAY 01~30 전체
- 세트: 120세트
- 단어: 1,200개
- 산출물: 세트별 `words.json` 1개와 `image_prompts.md` 1개
- 이 단계에서는 이미지, TTS, 렌더를 생성하지 않음

## 검증 결과

- 실행 명령: `node remotion/scripts/validate-content.mjs --author sol`
- 최종 결과: `120/120 sets passed`
- 경고: 0개
- CSV 단어·순서, 스키마 버전 3, day/range/set, 화자 순환, 정의 12단어 이하,
  예문 8~12단어, 표제어 포함, 세트별 프롬프트 20개, 파일명과 고정 접미를 전량 통과함
- 형식 검증 뒤 예문 직접 시각화와 다품사 발음을 별도로 검토하고 다시 120/120 통과함

## 판단이 갈렸던 단어와 결정

- `wound`: DAY18의 의료 문맥에 맞춰 명사 `상처`, `/wuːnd/`로 정함. 동사 과거형
  `/waʊnd/`를 쓰지 않음.
- `lead`: DAY05에서 동사 `이끌다`, `/liːd/`로 정함. 금속 명사 `/led/`를 쓰지 않음.
- `minute`: DAY01에서 시간 명사 `분`, `/ˈmɪnɪt/`로 정함. 형용사 `아주 작은` 용법을
  쓰지 않음.
- `object`, `subject`, `suspect`, `content`, `contract`, `contrast`, `progress`, `refund`:
  예문에서 명사로 고정하고 명사 강세를 사용함.
- `record`, `conduct`, `permit`, `refuse`, `insult`, `protest`, `decrease`, `increase`,
  `import`, `present`, `produce`, `transfer`, `transport`, `associate`: 예문에서 동사로
  고정하고 동사 발음과 강세를 사용함.
- `graduate`, `estimate`, `separate`: 예문에서 동사로 정하고 끝 음절이 `/eɪt/`인 발음을
  사용함.
- `plant`: DAY24의 자원·산업 문맥에 맞춰 식물이 아니라 명사 `공장`으로 정함.
- `fine`: DAY25의 환경 규제 문맥에 맞춰 형용사 대신 명사 `벌금`으로 정함.
- `prey`, `predator`, `fatal`, `poison`, `weapon`, `combat`, `criminal`, `drown`, `starve` 등은
  뜻을 유지하되 판타지·게임·박물관·안전 장벽·구조 장면을 사용해 직접적 피해 묘사를 피함.
- 추상어(`principle`, `concept`, `bias`, `context`, `reputation` 등)는 저울, 비교 대상,
  표정, 선택 행동처럼 한 장면에서 보이는 단서로 바꿈.

## 발음 기준

- 미국 영어 CMU Pronouncing Dictionary의 ARPABET을 IPA로 옮겨 기본 발음을 확인함.
- 자동 변환에서 음절 강세 위치가 불확실한 일반 단어는 잘못된 강세표를 넣지 않았고,
  위 다품사·동형이음어는 선택한 품사에 맞는 IPA를 직접 교정함.
