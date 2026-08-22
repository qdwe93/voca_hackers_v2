# mid1st 생성 입력 데이터

이 폴더는 기존 최종 단어 데이터와 중1 교과 참고 자료를 읽어 만든 파생 데이터다. 원본은
수정하지 않으며, 아래 명령을 실행하면 같은 원본에서 같은 순서와 내용으로 다시 생성된다.

```powershell
node mid1st/scripts/build-data.mjs
```

교과 참고 자료의 기본 위치는
`C:/Workspaces/junbe_study/middle_1st/content_eng`이다. 다른 복제본을 사용할 때만
`MID1ST_CONTENT_ENG` 환경 변수로 경로를 지정한다.

## 파일

- `word_inventory.jsonl`: DAY·번호 순으로 정렬한 1,200단어 불변 기준 목록. 후보 작성자는
  `word`, `partOfSpeech`, `meaningKo`, `ipa`, `definition`을 변경하면 안 된다.
- `concept_catalog.json`: 네 과목 `keywords.md`의 계층과 153개 개별 문서를 결합한 배열.
- `sets/*.json`: DAY당 네 개, 총 120개의 10단어 생성 입력.
- `build_report.json`: 개수, 조인, 고유 ID, 소스·출력 체크섬 검증 결과.

## 주요 스키마

단어 ID는 `DAY01-01` 형식이다. `part`, `day`, `no`, `set`은 숫자이며 기존 예문은
`baselineSentence`에만 보존한다.

개념 ID는 `KOR-`, `MATH-`, `SCI-`, `SOC-`와 원문 파일 slug의 조합이다. `domain`은
`keywords.md`의 2단계 제목, `unit`은 3단계 제목이다. 국어와 과학처럼 3단계 제목이 없는
목차에서는 `unit`이 `domain`을 상속하고 `unitInheritedFromDomain`이 `true`가 된다.
`sourcePath`는 교과 참고 자료 루트 기준 상대 경로다. 저장소 없이도 개념을 판단할 수 있도록
각 개념 문서에서 `definitionSummary`, `gradeContext`, `relatedTerms`를 함께 추출한다.
