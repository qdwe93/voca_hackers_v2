# 해커스 보카 v2 프로세스 검토 보고서 — Sol High

> 검토일: 2026-08-18  
> 대상: `C:\Workspaces\english\hackers_video_project_v2`  
> 실제 진행 상태: `status.mjs` 기준 후보·승격·프롬프트·이미지·오디오·렌더 모두 **0/120**

### 요약

핵심 설계인 단계 분리, 다중 AI 후보 비교, 짧은 이미지 프롬프트, 임포터 중심 규격화, 고정 타이밍은 합리적이며 Remotion·TTS 구현도 그 사양과 대체로 맞는다. `hackers.csv` 1,200행의 DAY별 수량·번호·중복·단어 형식, TypeScript 타입 검사, 전체 `.mjs` 구문 검사도 정상이다.

그러나 현재 상태 그대로 120편을 무인 생산하는 것은 권장할 수 없다. 핵심 프롬프트 금지 규칙이 실제 검사기에 없고, `status.mjs`가 파일 존재만으로 완료를 선언하며, 렌더 후 ffprobe·프레임 추출 QA가 구현되어 있지 않다. TTS 배치도 일반 예외를 건너뛰지 못한다.

따라서 1단계 착수 전에 `req.txt`와 프롬프트 게이트를 정리하고, 대량 자산 생성 전에는 후보 누락 판정, 상태 검증, 렌더 후 QA, 산출물-원본 해시 연결을 보완해야 한다. 이 네 축을 고치면 현재 구조로 120편 완주가 가능하다.

### 치명적 (이대로 두면 실패한다)

| # | 무엇 | 어디(파일·줄) | 왜 실패하는가 | 제안 | 근거를 무엇으로 대체하나 |
|---:|---|---|---|---|---|
| 1 | 핵심 이미지 프롬프트 금지 규칙을 검사기가 막지 않는다 | `WHY.md:55-57`, `remotion/scripts/content-schema.mjs:243-280` | WHY는 비율·해상도·여백·로고/워터마크·품질 수식어·특정 화풍을 “검사기가 막는다”고 하지만 실제 검사는 파일명, 고정 접미, 단어 수뿐이다. `16:9`, `1920x1080`, `no logo`, `dramatic lighting`, `bottom blank space`를 넣은 시험 프롬프트도 `errors: []`로 통과했다. v2 핵심인 프롬프트 단순화가 생성 AI의 준수에만 의존한다. | 금지 토큰/패턴, 장면부 단일 문장, 접미 앞 장면부 존재 여부를 `validateImagePrompts`에 오류로 추가한다. 정상·금지·경계 사례 fixture 테스트도 둔다. | “문서상 금지”를 **실행 가능한 validator 테스트 결과**로 대체한다. WHY 2번의 실측 근거는 유지한다. |
| 2 | 유일한 진행 근거인 `status.mjs`가 유효성이 아니라 존재·개수만 센다 | `AGENTS.md:15-16`, `PLAN.md:196`, `remotion/scripts/status.mjs:55-84,107-115` | 후보는 `words.json` 존재, 이미지는 임의의 PNG 20개, 오디오는 임의의 `narration.mp3`, 렌더는 임의의 MP4 파일 하나만 있어도 완료로 표시된다. 손상·오규격·잘못된 세트·0바이트·구버전 산출물도 `O`가 될 수 있다. 다음 단계도 4단계를 반영하지 않아 이미지 선별을 표시하지 않고 `prompts/P3`를 오디오 단계로 안내한다. | 기본 출력은 빠른 존재 현황으로 유지하되 `검증됨` 열을 추가하거나 `--verify`에서 콘텐츠 스키마, 기대 이미지명/규격, 오디오 report/길이, MP4 ffprobe를 검사한다. 다음 단계는 후보 20장 충족 여부를 보고 P2/P3/P4로 정확히 분기한다. | “로컬 파일이 진실”을 **로컬 파일 + 게이트 통과 결과가 진실**로 정교화한다. |
| 3 | 문서가 약속한 렌더 후 QA가 실제로는 없다 | `PLAN.md:203`, `prompts/P4_오디오_렌더.md:38-48`, `remotion/scripts/make-rendered-contact-sheets.mjs:7-81`, `remotion/scripts/render-batch.mjs:49-75` | P4 명령은 필수 인자 없이 즉시 실패한다. 더 근본적으로 `make-rendered-contact-sheets.mjs`는 MP4에서 프레임을 추출하지 않고 이미 존재해야 하는 `wordNN-study.png`/`wordNN-sentence.png`를 합칠 뿐이며, 그 프레임을 만드는 코드가 저장소에 없다. `render-batch`는 렌더 후 코덱·오디오 스트림·길이·프레임 수를 검사하지 않고, 기존 MP4는 사전 게이트도 없이 건너뛴다. | 렌더 후 ffprobe 검증과 지정 시점 20프레임 추출을 한 스크립트로 구현하고, 실패한 MP4는 완료로 표시하지 않는다. 기존 MP4도 probe를 통과한 경우만 skip한다. contact sheet 생성은 프레임 추출 뒤 자동 호출한다. | handover의 1세트 수동 스모크 결과를 **120세트 각각의 자동 ffprobe·프레임 추출 로그**로 대체한다. |
| 4 | `req.txt`가 현재 프로젝트가 아닌 구 8초 영상 프롬프트 사양이다 | `PLAN.md:162`, `prompts/P1_콘텐츠_이미지프롬프트.md:25,42`, `요청문/1_콘텐츠_이미지프롬프트_생성.txt:4,30`, `req.txt:3-10,29-34,60,95-103` | P1 작성 AI에게 반드시 읽으라고 하지만 `req.txt`는 `voca → video_prompt`, 8초 영상, 0.8/2.5초 발화, 화면에 영어 단어를 크게 표시, `GAME OVER/RESPAWN` 텍스트를 요구한다. 현재의 정지 이미지 2장, `No text.`, 19초 격자와 직접 충돌한다. 모델이 어느 지시를 우선할지 불안정하며 검증기도 의미 충돌을 전부 잡지 못한다. | `req.txt`를 v2용 “콘텐츠 난이도·안전 기준”만 남긴 문서로 교체하고 8초 영상·폴더·화면 텍스트·발화 타이밍 항목을 제거한다. 레거시는 별도 보관하되 P1에서 참조하지 않는다. | 안전 기준의 근거를 구프로젝트 전체 요청문이 아니라 **v2 전용 짧은 안전 체크리스트와 검증 예시**로 대체한다. |
| 5 | `--author` 이미지 생성의 누락 판정이 최종 폴더만 본다 | `remotion/scripts/generate-images-agy.mjs:81-85,99-105` | 후보를 `content/image-candidates/<author>`에 이미 반입했어도 최종 `public/days/*/images`가 비어 있으면 전부 누락으로 판단한다. 재실행 시 이미 만든 80장도 다시 생성한다. 쿼터가 앞쪽 중복 생성에서 소진되면 뒤쪽 실제 누락분에 도달하지 못해 “재실행하면 누락분만 생성”이라는 복구 전략이 깨진다. | author가 있으면 후보 보관함과 해당 author inbox의 정규화 가능한 파일까지 확인한다. `--list-missing`도 동일한 판정을 공유하고, set/author별 manifest로 성공·실패를 기록한다. | “최종 이미지 존재”를 **해당 author 후보의 목표 파일별 상태**로 대체한다. |
| 6 | 4단계 TTS가 일반 실패 세트를 건너뛰지 못한다 | `AGENTS.md:71`, `prompts/P4_오디오_렌더.md:22`, `tts/build_set_audio.py:158-289` | overflow는 `False`를 반환해 다음 세트로 가지만, JSON 오류·화자 오류·모델 오류·CUDA OOM·파일 I/O 예외는 `build_set` 밖에서 잡지 않아 list comprehension 전체가 즉시 중단된다. 밤새 120세트를 돌린다는 운영 가정과 “마지막 표에 모아서 보고”가 성립하지 않는다. | 세트별 `try/except`로 실패 유형과 traceback 요약을 수집하고 다음 세트를 계속 처리한다. 프로세스 종료 코드는 실패가 하나라도 있으면 1로 하되 성공/실패/overflow 표를 끝에 출력한다. 치명적 전역 오류(모델 로드 실패 등)만 즉시 중단한다. | “1세트 스모크 성공”을 **고의로 한 세트를 실패시킨 다세트 fault-injection 테스트**로 대체한다. |
| 7 | 오디오·렌더가 현재 원본 콘텐츠와 같은 버전인지 확인할 방법이 없다 | `remotion/scripts/promote-candidate.mjs:90-115`, `tts/build_set_audio.py:160-162,229-253`, `remotion/scripts/check-assets.mjs:111-133`, `remotion/scripts/render-batch.mjs:49-53` | `--replace`로 words/prompts를 바꾸어도 기존 이미지·오디오·MP4가 남는다. TTS와 렌더는 파일이 있으면 건너뛰고, asset gate는 report의 set/세그먼트/텍스트를 현재 `words.json`과 대조하지 않는다. 다른 세트의 190초 MP3와 overflow 0 report도 규격만 맞으면 통과할 수 있다. 아이가 잘못된 단어·발음을 듣는 가장 비싼 오류를 검출하지 못한다. | 승격 시 `words.json`/prompt 해시를 기록하고 이미지 manifest, `audio_report`, render manifest에 입력 해시를 전파한다. gate가 해시 불일치·report.set 불일치·40개 segment와 현재 텍스트 불일치를 실패시킨다. `--replace`는 하위 산출물이 있으면 명시적 무효화 선택 없이는 거부한다. | 단계 순서를 지켰을 것이라는 가정을 **콘텐츠→이미지→오디오→MP4의 검증 가능한 provenance chain**으로 대체한다. |

### 개선 (효율·품질)

| # | 무엇 | 어디(파일·줄) | 왜 실패/비효율인가 | 제안 | 근거를 무엇으로 대체하나 |
|---:|---|---|---|---|---|
| 1 | 세션 상한의 코드 강제가 일부 경로에만 연결되어 있다 | `remotion/scripts/session-limits.mjs:7-35`, `validate-content.mjs`, `compare-candidates.mjs`, `promote-candidate.mjs`, `pick-images.mjs:70-98` | `contentDaysPerSession`과 `renderSetsPerRun`은 선언만 되어 있고 사용되지 않는다. 1단계 검증·비교·승격은 전량 실행 가능하며, 3단계도 `--from-list` 경로는 `refuseIfTooBig`를 우회한다. 웹 UI 생성과 AI의 파일 작성 자체는 코드가 막을 수도 없다. | 실제로 제어 가능한 명령마다 대상 DAY/set 수를 계산해 같은 limiter를 사용하고, 제어 불가능한 외부 생성은 “요청문 강제”라고 정확히 표현한다. `--from-list`도 고유 set 수를 제한한다. | “1·2·3단계 모두 코드가 거부”를 **명령별 enforcement matrix와 경계값 테스트**로 대체한다. |
| 2 | 정상 문두 단어를 사람 이름으로 오인할 수 있다 | `remotion/scripts/content-schema.mjs:136-142,223-229` | 대문자로 시작하는 3글자 이상 토큰을 이름으로 보고 작은 whitelist만 제외한다. 두 문장이 `Every`, `Many`, `When`, `During` 등으로 시작하면 반복 고유명사로 오탐할 수 있다. | 각 문장의 첫 토큰은 후보에서 제외하고, 이름 판정은 spaCy 같은 새 의존성 없이도 “문중 대문자 토큰” 위주로 좁힌다. 최소한 회귀 fixture를 둔다. | 임의 whitelist를 **실제 후보 20세트에서 측정한 오탐/미탐 사례**로 대체한다. |
| 3 | 이미지 importer 경고가 일회성 콘솔 출력이라 선별 단계로 전달되지 않는다 | `remotion/scripts/import-images.mjs:146-245`, `make-image-sheets.mjs` | 과다 크롭·업스케일·단색 비율을 잘 계산하지만 로그를 놓치면 P3 대지에는 표시되지 않는다. 2,400장에서는 세션 간 경고 유실 가능성이 높다. | author/set/filename별 경고 JSON manifest를 저장하고 대지 셀에 경고 배지를 표시한다. OCR은 자동 탈락이 아니라 선택적 “문자 의심” 배지로 추가한다. | 사람의 기억을 **자산별 지속 가능한 경고 데이터와 선별 결과 로그**로 대체한다. |
| 4 | 활성 이미지 모델에 대한 v2 짧은 프롬프트 실측이 아직 없다 | `WHY.md:50-76,224-228` | 단순화 결정은 nano banana 2와 v1 실측으로 타당하지만, 실제 2,400장 주 수급 모델과 버전이 아직 미확정이다. 모델이 바뀌면 접미·구도 지시의 최적점도 바뀔 수 있다. | DAY 01의 동일 20개 프롬프트를 후보 모델별로 만들고 텍스트 혼입, 의미 불일치, 크롭 경고, 재생성률, 초/장, 비용을 표로 기록한 뒤 주 모델을 정한다. | 과거 모델 관측을 **현재 후보 모델의 동일 프롬프트 A/B 실측**으로 보강한다. 전량 장문 프롬프트로 회귀하지는 않는다. |
| 5 | TTS 캐시 키가 모델·보이스 파일·생성/후처리 버전을 포함하지 않는다 | `tts/engine.py:43-70,178-214` | 캐시 키는 speaker voice 이름과 텍스트뿐이다. 모델 파일, 참조 음성, temperature, 정규화/trim 코드가 바뀌어도 오래된 WAV가 재사용되어 재현성과 변경 검증을 흐린다. | 모델 식별자, 참조 WAV/TXT 해시, 생성 파라미터 버전, 후처리 버전을 cache namespace 또는 키에 포함한다. | “같은 이름이면 같은 음성” 가정을 **입력·모델·파라미터 해시 기반 캐시**로 대체한다. |
| 6 | 콘텐츠 검증을 TTS 직전 다시 하지 않는다 | `prompts/P4_오디오_렌더.md:7-15`, `tts/build_set_audio.py:165-173` | TTS 빌더는 schemaVersion, 단어 수, speaker만 본다. 승격 뒤 파일이 바뀌었다면 비싼 TTS를 만든 후 `check-assets`에서야 CSV·문장 길이 오류를 발견할 수 있다. | P4 첫 명령을 `validate-content` → `check-assets --pre-audio` 또는 통합 preflight → TTS 순으로 만든다. | 단계 순서 기억을 **TTS 시작 전 자동 preflight 성공**으로 대체한다. |
| 7 | 여러 생성 AI가 공용 `handover.md`를 직접 수정한다 | `prompts/P1_콘텐츠_이미지프롬프트.md:55-56`, `요청문/1_콘텐츠_이미지프롬프트_생성.txt:78-79` | 같은 범위를 여러 AI가 병렬 생성할 때 공용 파일 상단 편집이 충돌하고, 다른 AI의 최신 기록을 덮거나 순서를 섞을 수 있다. | 후보 생성자는 `content/candidates/<author>/run_report.md`에 기록하고, 사람이 승격할 때 한 번만 handover에 요약한다. | 공용 파일 동시 편집을 **author별 실행 로그 + 단일 통합 인계**로 대체한다. |
| 8 | `normalize-generated-image.mjs`가 핵심 importer와 다른 예문 크롭 정책을 가진 미사용 경로다 | `remotion/scripts/normalize-generated-image.mjs:17-22`, `import-images.mjs:220-229` | 전자는 모든 이미지를 중앙 크롭하고, 후자는 예문을 북쪽 우선으로 크롭한다. 현재 참조는 없지만 이름상 에이전트가 실수로 사용할 수 있다. | 삭제 대신 deprecated 오류 안내를 내거나 importer의 공용 정규화 함수를 호출하도록 통합한다. | 중복 구현을 **하나의 정규화 함수와 테스트**로 대체한다. |
| 9 | `status.mjs`의 author 표기가 첫 글자만 사용된다 | `remotion/scripts/status.mjs:55-78` | `flow`, `flash`, `foo`처럼 첫 글자가 같은 author는 후보 현황에서 구분되지 않는다. | 짧은 고유 alias 또는 전체 author명과 장수를 출력한다. | 암묵적 첫 글자 구분을 **고유한 author 식별자**로 대체한다. |

### 문서·코드 불일치

| 무엇 | 어느 문서 | 어느 코드 | 실제 동작 |
|---|---|---|---|
| 금지 프롬프트 검사 | `WHY.md:55-57`, `요청문/3_검증.txt:27-29` | `content-schema.mjs:243-280` | 기계 검사는 금지어·복수 문장·특정 화풍을 막지 않는다. 별도 검증 AI만 잡을 수 있다. |
| `req.txt`의 역할 | `PLAN.md:162`, P1 문서·요청문 | `req.txt` 전체 | “콘텐츠·이미지 안전 기준”이 아니라 구 8초 동영상 프롬프트 작업 사양이다. |
| P4 문서 제목 | 파일명 `prompts/P4_오디오_렌더.md` | 같은 파일 `:1` | 본문 제목은 `# P3 — 오디오·렌더 배치`다. |
| 현황판 단계 | PLAN/AGENTS의 4단계 | `status.mjs:107-115` | 3단계 이미지 선별을 표시하지 않고 오디오를 `3단계`, 문서를 `prompts/P3`로 안내한다. |
| 진행 완료 정의 | “status가 진행 상황의 진실” | `status.mjs:55-84` | 유효성 검증 없이 파일 존재·PNG 개수만 센다. |
| 1회 상한 | `WHY.md:143-159`, `PLAN.md:80-90`, `AGENTS.md:32` | `session-limits.mjs`, 호출 검색 결과 | 실제 limiter 호출은 agy 생성과 일반 pick 경로뿐이다. 1단계와 pick `--from-list`는 강제되지 않는다. |
| P2 contact sheet 명령 | `prompts/P2_이미지_생성.md:50` | `make-contact-sheets.mjs:7-14` | 문서는 무인자 호출, 코드는 dayDir과 outputDir 두 인자를 필수로 요구한다. 후보 비교 목적에는 `make-image-sheets.mjs`가 맞다. |
| P4 rendered contact sheet 명령 | `prompts/P4_오디오_렌더.md:38` | `make-rendered-contact-sheets.mjs:7-24` | 문서는 무인자 호출, 코드는 qaDir 필수다. 더구나 MP4 프레임 추출 기능은 없다. |
| 렌더 후 ffprobe | `PLAN.md:203`, `P4:41-48` | `render-batch.mjs` | 렌더 후 probe가 없다. `check-assets`의 ffprobe는 렌더가 아니라 narration 길이만 본다. |
| TTS 실패 계속 진행 | `AGENTS.md:71`, `P4:22` | `build_set_audio.py:289` | overflow 반환값만 모으며 일반 예외는 전체 배치를 중단한다. |
| agy 재실행 복구 | `generate-images-agy.mjs:105`, P2 설명 | `generate-images-agy.mjs:83-85` | author 후보가 아니라 최종 이미지 존재만 보므로 후보 단계 재실행은 중복 생성한다. |
| 단어 객체 필드 수 | `요청문/1_콘텐츠_이미지프롬프트_생성.txt:18` | `content-schema.mjs:52-67`, 같은 요청문 `:19-29` | “9개”라고 쓰였지만 실제 키는 10개다. `요청문/1b`와 검증 요청문은 10개로 정확하다. |
| 영상 길이 표현 | `WHY.md:15`, `PLAN.md:147` | `constants.ts:20-29` | 5,784프레임/30fps의 영상 프레임 길이는 192.80초다. handover의 192.853초는 MP4 컨테이너·오디오까지 포함한 ffprobe 실측으로 볼 수 있으므로 둘을 구분해 표기해야 한다. |
| 예문 이미지 크롭 | 핵심 importer는 북쪽 우선이라고 문서화 | `normalize-generated-image.mjs:17-22` | 미사용 보조 스크립트는 중앙 크롭을 한다. |

### 근거가 확인된 결정 (건드리지 말 것)

- **WHY 1 — 30일을 단계별로 진행:** 콘텐츠·이미지·TTS/렌더의 도구와 비용 구조가 다르고 산출물 경계도 명확하다. DAY별 왕복보다 합리적이다. 다만 각 단계 내부의 재개 manifest는 보강해야 한다.
- **WHY 2 — 이미지 프롬프트 단순화:** nano banana 2와 v1의 실패 실측을 반박할 근거가 현재 없다. 유지하되 실제 주 모델로 DAY 1개 A/B 실측 후 접미를 재평가한다.
- **WHY 3 — 규격 책임을 importer로 이동:** 코드가 단색 trim, cover crop, PNG 변환, north/attention 전략, 경고를 실제 구현한다. 의미·글자 혼입을 못 고친다는 한계도 문서와 일치한다.
- **WHY 4 — 같은 범위를 여러 AI가 만들고 비교:** IPA·뜻·예문의 의미 품질은 스키마 검증만으로 보장할 수 없으므로 후보 차이를 의심 지점으로 쓰는 방식이 타당하다.
- **WHY 5 — 생성과 검증 AI 분리:** 자기 확증 편향과 무기록 수정을 줄이는 품질 절차로 타당하다. 승격 전에 검증 완료 사실을 기록하는 장치만 추가하면 된다.
- **WHY 6 — 상한을 코드 게이트로 만든다는 원칙:** 실제 사고 근거가 충분하다. 원칙은 유지하되 현재 미연결 경로를 보완해야 한다.
- **WHY 7 — git에는 텍스트만 저장:** 2,400장 이미지와 120편 영상을 git에서 제외하는 결정은 타당하다. 다만 로컬 미디어의 백업·manifest·해시가 별도로 필요하다.
- **WHY 8 — 타이밍·화자·속도 정책 고정:** `constants.ts`, `timing.ts`, `build_set_audio.py`, `engine.py`에서 1.5/1.5/8/8초, 1.5초 화면 선행, 190초 narration, Zephyr→Liam→Erinome→Charon, 0.85~1.2 보정이 일치한다. 임의 변경할 이유가 없다.
- **WHY 9 — 작업 폴더 경고:** 실제 오작업 사고를 직접 막는 저비용·고효과 장치다. 현재 요청문에도 반복되어 있어 유지해야 한다.
- 기존에 버린 대안인 로컬 이미지 생성 재도입, 안티그래비티 IDE MCP, agy TTS, SRT 역추출, `words.json.author` 추가, 전량 강화 금지문구는 재제안하지 않는다.

### 열린 질문

1. **1단계 시작 전 필수 수정 범위:** 위 치명적 항목 중 `req.txt`와 프롬프트 validator는 콘텐츠 생성 전에, 후보 누락·상태·렌더 QA·provenance는 대량 이미지 생성 전에 고치는 순서로 승인할 것인가?
2. **주 이미지 수급 모델:** agy, Codex, Google Flow/nano banana 중 어떤 모델·버전을 주 수급원으로 삼을 것인가? DAY 01 동일 20장 A/B 실측의 합격 기준(재생성률, 초/장, 비용)을 얼마로 둘 것인가?
3. **후보 벌 수:** DAY 01~10의 3벌 비교 후 품질 차이가 어느 수준이면 DAY 11~30을 1벌 또는 2벌로 줄일 것인가? IPA/뜻 오류율과 이미지 재생성률 같은 정량 기준이 필요하다.
4. **최종 QA 범위:** 현재 문서는 10세트당 1세트 표본을 제안한다. 자동 ffprobe는 120/120, contact sheet는 120/120 자동 생성 후 사람이 1/10 표본을 볼지, 또는 결함 발생 DAY를 전수 확대할지 확정해야 한다.
5. **하위 산출물 무효화 정책:** 승격 콘텐츠나 이미지 프롬프트를 교체했을 때 기존 이미지·오디오·MP4를 자동 삭제하지 않고 “stale”로 표시할지, 명시적 승인 아래 별도 격리 폴더로 이동할지 결정이 필요하다.
6. **로컬 미디어 백업:** git에서 제외된 이미지·음성·영상과 후보 자산을 어느 저장장치/클라우드에 어떤 주기로 백업할 것인가? 현재 원격 저장소도 없으므로 텍스트 원본과 manifest의 외부 백업 우선순위도 정해야 한다.
7. **검증 완료 기록:** 다른 AI의 검증 보고서를 어디에 저장하고 어떤 표식이 있어야 `promote-candidate`가 승격을 허용할지 결정해야 한다.
