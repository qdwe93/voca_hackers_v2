# 영영 정의 반영 보고서

- 상태: **PASS**
- 기준 정의: `mid1st/final/definitions_v2.jsonl`
- 반영 대상: `mid1st/final/final_sentences.jsonl`
- 확인용 표: `mid1st/final/final_sentences.md`
- 행 수: 1,200
- definition 변경: 589
- definition 원문 유지: 611
- wordId 순서 불일치: 0
- 단어·품사·뜻 불일치: 0
- reviewRequired: 0
- 적용 후 정의 검증: `definition-validation.md`에서 확인

## SHA-256

| 대상 | 적용 전 | 적용 후 |
|---|---|---|
| final_sentences.jsonl | `2833b0d80f9958ac354f954618901ce2fc7a2bb32220f54cc4391d7a53f491e5` | `186dba907131a03bcf3107bdb87ab618c724ba04a2f01e025c7fff63e1c0f2df` |
| final_sentences.md | `c26323f5a8df4c2fefb92cb703b363dfb3fc1080f7f7bc9b2a7e1d1d77950e4c` | `af142a1103e7368072f6c6af46cfda625128984d8259a2abd673d3f7e9559355` |
| definition을 제외한 JSONL 필드 | `4560c846a1c3e105cb0ca901ae7fd381af1f128d214a05a9511b4bedfc9572de` | `4560c846a1c3e105cb0ca901ae7fd381af1f128d214a05a9511b4bedfc9572de` |
| definitions_v2.jsonl | `642c980d05b0d9273311dfa1785bc33067b03f736c71b04e752da10fc21df905` | 동일 입력 |

definition을 제외한 JSONL 필드의 해시가 같으므로 단어·품사·뜻·IPA·예문과 선택 메타데이터는 변경되지 않았다.
