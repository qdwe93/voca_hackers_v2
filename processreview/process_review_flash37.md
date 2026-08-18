# 해커스 보카 v2 파이프라인 프로세스 검토 보고서

> **검토 모델:** Gemini 3.7 Flash  
> **검토 일시:** 2026-08-18  
> **대상 저장소:** [hackers_video_project_v2](file:///C:/Workspaces/english/hackers_video_project_v2)

---

### 요약

현재 v2 파이프라인은 v1의 시행착오(프롬프트 비대화, 429 쿼터 중단, 세션 컨텍스트 초과 등)를 철저히 분석하여 **"단계별 통짜 진행"**, **"이미지 프롬프트 단순화"**, **"임포터 중심 규격 정규화"** 등 핵심 아키텍처가 매우 견고하게 설계되어 있습니다.  
다만 `status.mjs`의 단계 표기 오류(4단계 미반영), 일부 QA 스크립트의 인자 누락 호출, `collectLikelyNames`의 문두 일반 단어 오탐 위험, `generate-images-agy.mjs`의 중복 체크 경로 불일치 등 **즉시 수정이 필요한 코드·문서 불일치와 잠재적 실패 요인**이 존재합니다.  
해당 지점들을 보완하면 120편의 영상을 사람의 개입을 최소화하면서 고품질로 일괄 생산할 수 있는 상태입니다.

---

### 치명적 (이대로 두면 실패한다)

| # | 무엇 | 어디(파일·줄) | 왜 실패하는가 | 제안 | 근거를 무엇으로 대체하나 |
|---|---|---|---|---|---|
| 1 | `status.mjs`의 4단계 파이프라인 미반영 (구 3단계 출력) | [status.mjs:107-115](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/status.mjs#L107-L115) | v2에서 3단계(이미지 선별), 4단계(오디오·렌더)로 재편되었으나, 코드는 구 3단계(`3단계 — 오디오·렌더 배치 (prompts/P3)`)를 출력함. status 출력을 기반으로 작업하는 에이전트가 단계를 건너뛰거나 존재하지 않는 문서를 참조함 | `status.mjs`의 `nextPhase` 분기 로직에 3단계 선별(`prompts/P3_이미지_선별.md`)과 4단계 렌더(`prompts/P4_오디오_렌더.md`)를 정확히 반영 | [PLAN.md:65-75](file:///C:/Workspaces/english/hackers_video_project_v2/PLAN.md#L65-L75) 및 [handover.md:39-43](file:///C:/Workspaces/english/hackers_video_project_v2/handover.md#L39-L43)의 확정 4단계 파이프라인 사양 |
| 2 | `prompts/P2` 및 `P4`의 QA 스크립트 인자 누락 호출 | [P2_이미지_생성.md:50](file:///C:/Workspaces/english/hackers_video_project_v2/prompts/P2_이미지_생성.md#L50), [P4_오디오_렌더.md:38](file:///C:/Workspaces/english/hackers_video_project_v2/prompts/P4_오디오_렌더.md#L38) | `make-contact-sheets.mjs`는 `[dayDirArg, outputDirArg]`, `make-rendered-contact-sheets.mjs`는 `[qaDirArg]` 인자가 필수임. 문서대로 인자 없이 실행 시 `exit(2)` 에러로 즉시 실패함 | P2는 `node remotion\scripts\make-image-sheets.mjs --day 01`로 통일하거나 정확한 인자(`days/DAY01_01-10_set1 out/qa-frames/day01`) 명시, P4는 `npm run qa:rendered-contact-sheets -- out/qa-frames/day01` 형태로 수정 | [make-contact-sheets.mjs:7-14](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/make-contact-sheets.mjs#L7-L14) 및 [make-rendered-contact-sheets.mjs:7-14](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/make-rendered-contact-sheets.mjs#L7-L14) 실제 코드 구현 |
| 3 | `generate-images-agy.mjs`의 이미지 존재 확인 경로 오류 | [generate-images-agy.mjs:83-85](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/generate-images-agy.mjs#L83-L85) | `--author` 옵션을 주고 실행해도 최종 위치(`public/days/<set>/images/<filename>`)의 존재 여부만 체크함. 2단계 생성 시점에는 최종 폴더가 비어 있고 `inbox/<author>/`에 들어가므로, 이미 만든 이미지가 있어도 매번 agy를 재호출하여 쿼터를 낭비함 | `destination` 확인 시 `--author`가 있으면 `inbox/<author>/` 및 `content/image-candidates/<author>/<setName>/`의 파일 존재 여부를 체크하도록 수정 | [generate-images-agy.mjs:21](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/generate-images-agy.mjs#L21) 및 [PLAN.md:71-72](file:///C:/Workspaces/english/hackers_video_project_v2/PLAN.md#L71-L72) |
| 4 | `collectLikelyNames`의 문두 일반 단어 오인으로 인한 검증 오탐 | [content-schema.mjs:136-142](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/content-schema.mjs#L136-L142), [226-229](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/content-schema.mjs#L226-L229) | 문장 내 대문자 단어를 이름으로 판단하는 `common` 세트에 문두 부사/접속사/형용사(`Every`, `Many`, `Some`, `When`, `While`, `If`, `Because`, `During`, `Inside`, `Always` 등)가 누락되어 있음. 예문 2개가 "Every..."로 시작하면 고유명사 중복(`Repeated fixed name(s)`)으로 판정되어 `validate-content.mjs` 검증이 부당하게 실패함 | 문장 첫 단어는 이름 검사에서 제외하거나, `common` 화이트리스트에 흔한 문두 시작 단어들을 대거 추가 | 초등 6학년용 정상 영어 예문 생성 시 다양한 문장 시작 구조 허용 필요 |

---

### 개선 (효율·품질)

| # | 무엇 | 어디(파일·줄) | 왜 실패/비효율인가 | 제안 | 근거를 무엇으로 대체하나 |
|---|---|---|---|---|---|
| 1 | 1단계 상한이 코드 게이트(`session-limits.mjs`)에 미연결 | [session-limits.mjs:9](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/session-limits.mjs#L9), [validate-content.mjs](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/validate-content.mjs), [promote-candidate.mjs](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/promote-candidate.mjs) | `LIMITS.contentDaysPerSession = 10` 상한이 정의되어 있으나 `validate-content.mjs`나 `promote-candidate.mjs`에서 이를 검사하지 않아, WHY.md 6장의 "문서가 아닌 코드로 상한을 막는다"는 원칙이 1단계에는 누락됨 | `validate-content.mjs` 및 `promote-candidate.mjs`에 `refuseIfTooBig`를 호출하여 1회 처리 대상 세트가 40세트(DAY 10개) 초과 시 거부하도록 적용 | [WHY.md:143-160](file:///C:/Workspaces/english/hackers_video_project_v2/WHY.md#L143-L160) (세션 상한 코드 강제 원칙) |
| 2 | 3단계 이미지 선별 시 1차 글자/텍스트 자동 필터 부재 | [import-images.mjs](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/import-images.mjs), [make-image-sheets.mjs](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/make-image-sheets.mjs) | 2,400장 선별 시 사람이 대지를 보며 가장 먼저 탈락시키는 요인이 "글자·로고 혼입"임. 100% 육안 판정은 피로도가 매우 큼 | 가벼운 OCR/텍스트 감지(Tesseract 또는 로컬 라이브러리)를 선택적 플래그로 두어 텍스트 감지 시 대지에 빨간 테두리나 경고 라벨 표시 | [WHY.md:227-228](file:///C:/Workspaces/english/hackers_video_project_v2/WHY.md#L227-L228) (선별 인건비 단축 필요성 언급) |
| 3 | `req.txt`의 구버전 잔재 혼선 방지 안내 필요 | [req.txt](file:///C:/Workspaces/english/hackers_video_project_v2/req.txt) | `req.txt`는 과거 `voca` 폴더 기반의 8초 비디오 프롬프트 시절 문서가 남아 있어, 외부 AI가 읽었을 때 현재의 v2 정적 이미지 2장 + 19초 격자 구조와 혼선을 빚을 수 있음 | `req.txt`의 상단에 "초등 6학년 난이도 및 유해 콘텐츠 안전 기준 참조용"임을 명시하거나 현재 사양에 맞지 않는 8초 비디오/voca 폴더 관련 문구 정리 | [PLAN.md:145-155](file:///C:/Workspaces/english/hackers_video_project_v2/PLAN.md#L145-L155) 및 [WHY.md:13-28](file:///C:/Workspaces/english/hackers_video_project_v2/WHY.md#L13-L28) |
| 4 | `hackers.csv` 품사 표기 매핑 안내 보강 | [content-schema.mjs:27-37](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/content-schema.mjs#L27-L37), [요청문/1_콘텐츠_이미지프롬프트_생성.txt:20](file:///C:/Workspaces/english/hackers_video_project_v2/요청문/1_콘텐츠_이미지프롬프트_생성.txt#L20) | `hackers.csv`에는 품사 컬럼이 없음. `words.json`의 `partOfSpeech`는 9개 약어(`n.`, `v.`, `adj.`, `adv.`, `prep.`, `conj.`, `pron.`, `det.`, `interj.`) 중 하나여야 하는데, LLM이 `a.`, `ad.`, `noun` 등을 쓸 위험이 있음 | `validate-content.mjs` 검증 실패 시 허용되는 9개 품사 목록을 명확히 에러 메시지에 출력 | [content-schema.mjs:27-37](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/content-schema.mjs#L27-L37) |

---

### 문서·코드 불일치

| 무엇 | 어느 문서 | 어느 코드 | 실제 동작 |
|---|---|---|---|
| P4 문서의 제목 표기 | [prompts/P4_오디오_렌더.md:1](file:///C:/Workspaces/english/hackers_video_project_v2/prompts/P4_오디오_렌더.md#L1) (`# P3 — 오디오·렌더 배치`) | 파일명 `P4_오디오_렌더.md` | 문서는 P4인데 제목 헤더는 P3으로 남아 있어 문서 탐색 시 혼란 유발 |
| 현황판 다음 단계 출력 | [PLAN.md:65-75](file:///C:/Workspaces/english/hackers_video_project_v2/PLAN.md#L65-L75) (4단계 파이프라인) | [remotion/scripts/status.mjs:113](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/status.mjs#L113) | `status.mjs`는 `3단계 — 오디오·렌더 배치 (prompts/P3)`로 출력하여 3단계(선별)가 누락되고 단계 번호가 어긋남 |
| 1단계 요청문의 단어 필드 수 표기 | [요청문/1_콘텐츠_이미지프롬프트_생성.txt:18](file:///C:/Workspaces/english/hackers_video_project_v2/요청문/1_콘텐츠_이미지프롬프트_생성.txt#L18) ("필드는 아래 9개뿐이다") | [content-schema.mjs:55-68](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/content-schema.mjs#L55-L68), [요청문/1b_저장소없이_생성.txt:22](file:///C:/Workspaces/english/hackers_video_project_v2/요청문/1b_저장소없이_생성.txt#L22) | 실제 필드는 `no, word, partOfSpeech, meaningKo, ipa, definition, sentence, wordImage, sentenceImage, speaker`로 총 **10개**임 |
| 접촉 대지 생성 스크립트 인자 | [prompts/P2_이미지_생성.md:50](file:///C:/Workspaces/english/hackers_video_project_v2/prompts/P2_이미지_생성.md#L50) (`node remotion\scripts\make-contact-sheets.mjs`) | [remotion/scripts/make-contact-sheets.mjs:7-14](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/make-contact-sheets.mjs#L7-L14) | 인자 없이 호출 시 `Usage` 출력 후 즉시 종료됨 (인자 2개 필수) |
| 렌더 접촉 대지 생성 스크립트 인자 | [prompts/P4_오디오_렌더.md:38](file:///C:/Workspaces/english/hackers_video_project_v2/prompts/P4_오디오_렌더.md#L38) (`node remotion\scripts\make-rendered-contact-sheets.mjs`) | [remotion/scripts/make-rendered-contact-sheets.mjs:7-14](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/scripts/make-rendered-contact-sheets.mjs#L7-L14) | 인자 없이 호출 시 `Usage` 출력 후 즉시 종료됨 (`qaDirArg` 필수) |
| 비디오 전체 재생시간 표기 | [WHY.md:15](file:///C:/Workspaces/english/hackers_video_project_v2/WHY.md#L15), [PLAN.md:146](file:///C:/Workspaces/english/hackers_video_project_v2/PLAN.md#L146) (`192.85초 = 5,784프레임`) | [remotion/src/constants.ts:20-29](file:///C:/Workspaces/english/hackers_video_project_v2/remotion/src/constants.ts#L20-L29) | `2.4s + 190.0s + 0.4s = 192.80초` (30fps 기준 `192.8 * 30 = 5784프레임`). 실제 영상 길이는 정확히 **192.80초**임 |

---

### 근거가 확인된 결정 (건드리지 말 것)

[WHY.md](file:///C:/Workspaces/english/hackers_video_project_v2/WHY.md)의 결정들에 대한 검토 결과:

- **결정 0 (학습 목표 및 타깃):** 초등 6학년 수준 어휘 학습, 발음/정의/예문의 정확도 최우선 원칙은 확고함.
- **결정 1 (30일 통짜 단계별 진행):** DAY별 왕복 방식 대비 모델 전환 및 세션 컨텍스트 재구축 오버헤드를 극적으로 줄임.
- **결정 2 (이미지 프롬프트 한 문장 단순화):** nano banana 2 등 약한 모델 실측에 기반하여 단색 밴드, 과다 크롭, 글자 혼입 문제를 원천 차단함.
- **결정 3 (임포터의 규격·단색 트림 전담):** Sharp 기반의 단색 테두리 자동 트림 및 1024x1024 / 1600x900(위쪽 우선) cover 크롭으로 이미지 백엔드 독립성을 완벽히 확보함.
- **결정 4 (다중 AI 후보 생성 및 비교 승격):** 기계 검증이 불가능한 IPA 기호, 의미적 뉘앙스, 동형이음어를 교차 비교로 잡아내는 강력한 품질 게이트임.
- **결정 5 (생성과 검증 AI 분리):** 자기 확증 편향을 차단하고 수정 내역의 추적성을 보장함.
- **결정 6 (세션 상한 강제 원칙):** 1회 작업 범위를 강제하여 컨텍스트 초과 및 429 쿼터 중단 사고를 예방함.
- **결정 7 (git에 텍스트만 관리):** 파생 자산(미디어 6.6GB+)을 제외하고 텍스트 원본만 추적하여 저장소 경량화 및 재현성 유지.
- **결정 8 (타이밍 격자·화자 순환·속도 보정 고정):** 120편의 균일한 시청각 리듬을 보장하며, 넘침 발생 시 오디오 격자가 아닌 콘텐츠를 줄이는 원칙이 타당함.
- **결정 9 (작업 폴더 경고 및 서두 고정):** 과거 타 폴더 작업 사고를 방지하기 위한 필수 안전장치임.

---

### 열린 질문

1. **이미지 2,400장 주 수급 경로 및 배분 정책**
   - agy(CLI)는 완전 자동화가 가능하나 일일 쿼터(429) 제한이 있고, 웹 UI(Google Flow, nano banana)는 생성 품질이 우수하나 다운로드 및 파일명 정리에 사람 손이 듭니다.
   - **질문:** 1차 수급을 agy 자동 배치로 먼저 돌리고 쿼터 소진 시 누락/재생성분만 웹 UI로 보충할 것인지, 아니면 처음부터 DAY 단위로 도구를 분담할 것인지 결정이 필요합니다.
2. **콘텐츠 후보 생성 배치 단위 (DAY 01~05 시험 후 확장 여부)**
   - PLAN.md 권장대로 DAY 01~05(20세트)를 먼저 3개 AI(Opus, Sol, Gemini)로 생성하여 `compare-candidates`로 품질 차이를 실측한 후, 차이가 크지 않다면 DAY 06~30은 1~2개 모델로 생성 범위를 좁힐 것인지 확인이 필요합니다.
3. **`req.txt` 문서의 역할 정리**
   - 구프로젝트의 8초 동영상 생성 문구가 남아 있는 `req.txt`를 현재 Remotion 사양에 맞추어 "초등 6학년 안전 및 윤리 가이드라인"으로 정리할 것인지, 아니면 레거시 참조용으로 둘 것인지 결정이 필요합니다.
