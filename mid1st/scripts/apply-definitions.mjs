#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultPath,
  markdownCell,
  printFailure,
  readJson,
  readJsonl,
} from "./lib.mjs";

const FINAL_KEYS = [
  "wordId", "day", "no", "set", "word", "part", "partTopic", "dayTopic",
  "partOfSpeech", "meaningKo", "ipa", "definition", "conceptId", "matchMode",
  "conceptCueKo", "selectedAuthor", "sentence", "selectionNote",
];
const DEFINITION_KEYS = [
  "wordId", "word", "partOfSpeech", "meaningKo", "definitionOld",
  "definitionNew", "selectedFrom", "sentenceFit", "reviewRequired",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function objectKeysEqual(value, expected) {
  return Object.keys(value).join(",") === expected.join(",");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeAtomic(filePath, text) {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.tmp-${process.pid}`);
  try {
    await writeFile(temporary, text, { encoding: "utf8", flag: "wx" });
    if (await exists(filePath)) await unlink(filePath);
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

function immutableProjection(rows) {
  return rows.map(({ definition, ...rest }) => rest);
}

function sourceCounts(rows) {
  const counts = new Map([
    ["claude", 0],
    ["codex", 0],
    ["baseline", 0],
    ["antigravity", 0],
    ["manual", 0],
  ]);
  for (const row of rows) counts.set(row.selectedAuthor, (counts.get(row.selectedAuthor) ?? 0) + 1);
  return counts;
}

function conceptLabel(row, concepts) {
  if (!row.conceptId) {
    if (row.matchMode === "word_fallback") return "—(단어 장면)";
    return "—(DAY 주제)";
  }
  const concept = concepts.get(row.conceptId);
  return concept ? `${concept.subjectKo} · ${concept.conceptKo}` : row.conceptId;
}

function renderMarkdown(rows, catalog) {
  const concepts = new Map(catalog.map((row) => [row.conceptId, row]));
  const counts = sourceCounts(rows);
  const lines = [
    "# mid1st 최종 예문 확인용 표",
    "",
    "`final/final_sentences.jsonl`을 사람이 읽기 쉽게 옮긴 표다. 원본은 JSONL이며 이 파일은 확인용 사본이다.",
    "",
    "- 단어: 1200개 · DAY 01~30 · 세트 120개",
    `- 선택 출처: claude ${counts.get("claude")} · codex ${counts.get("codex")} · baseline ${counts.get("baseline")} · antigravity ${counts.get("antigravity")} · manual ${counts.get("manual")}`,
    "- `definitions_v2.jsonl`의 승인된 영영 정의를 반영했다. 단어·품사·뜻·IPA·예문 등 다른 필드는 유지했다.",
    "",
  ];
  let previousDay = null;
  let previousSet = null;
  for (const row of rows) {
    if (row.day !== previousDay) {
      lines.push("", `## DAY ${String(row.day).padStart(2, "0")} · ${row.partTopic} / ${row.dayTopic}`, "");
      previousDay = row.day;
      previousSet = null;
    }
    if (row.set !== previousSet) {
      const start = (row.set - 1) * 10 + 1;
      const range = `${String(start).padStart(2, "0")}-${String(start + 9).padStart(2, "0")}`;
      lines.push(
        `### set ${row.set} (${range})`,
        "",
        "| # | 단어 | 품사 | 뜻 | 발음 | 영영 정의 | 예문 | 교과 개념 | 출처 |",
        "|---|---|---|---|---|---|---|---|---|",
      );
      previousSet = row.set;
    }
    lines.push(
      `| ${row.no} | **${markdownCell(row.word)}** | ${markdownCell(row.partOfSpeech)} | ${markdownCell(row.meaningKo)} | ${markdownCell(row.ipa)} | ${markdownCell(row.definition)} | ${markdownCell(row.sentence)} | ${markdownCell(conceptLabel(row, concepts))} | ${markdownCell(row.selectedAuthor)} |`,
    );
    if (row.no % 10 === 0) lines.push("");
  }
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

function renderReport({
  finalPath,
  markdownPath,
  definitionsPath,
  beforeHash,
  afterHash,
  beforeMarkdownHash,
  afterMarkdownHash,
  definitionsHash,
  immutableBeforeHash,
  immutableAfterHash,
  changed,
  unchanged,
}) {
  return `# 영영 정의 반영 보고서

- 상태: **PASS**
- 기준 정의: \`${definitionsPath}\`
- 반영 대상: \`${finalPath}\`
- 확인용 표: \`${markdownPath}\`
- 행 수: 1,200
- definition 변경: ${changed}
- definition 원문 유지: ${unchanged}
- wordId 순서 불일치: 0
- 단어·품사·뜻 불일치: 0
- reviewRequired: 0
- 적용 후 정의 검증: \`definition-validation.md\`에서 확인

## SHA-256

| 대상 | 적용 전 | 적용 후 |
|---|---|---|
| final_sentences.jsonl | \`${beforeHash}\` | \`${afterHash}\` |
| final_sentences.md | \`${beforeMarkdownHash}\` | \`${afterMarkdownHash}\` |
| definition을 제외한 JSONL 필드 | \`${immutableBeforeHash}\` | \`${immutableAfterHash}\` |
| definitions_v2.jsonl | \`${definitionsHash}\` | 동일 입력 |

definition을 제외한 JSONL 필드의 해시가 같으므로 단어·품사·뜻·IPA·예문과 선택 메타데이터는 변경되지 않았다.
`;
}

async function main() {
  const finalPath = defaultPath("final", "final_sentences.jsonl");
  const markdownPath = defaultPath("final", "final_sentences.md");
  const definitionsPath = defaultPath("final", "definitions_v2.jsonl");
  const catalogPath = defaultPath("data", "concept_catalog.json");
  const reportPath = defaultPath("reports", "definition-apply.md");

  const [finalSource, markdownSource, definitionSource, parsedFinal, parsedDefinitions, catalog] = await Promise.all([
    readFile(finalPath),
    readFile(markdownPath),
    readFile(definitionsPath),
    readJsonl(finalPath),
    readJsonl(definitionsPath),
    readJson(catalogPath),
  ]);
  const finalRows = parsedFinal.map(({ value }) => value);
  const definitions = parsedDefinitions.map(({ value }) => value);
  const errors = [];
  if (finalRows.length !== 1200) errors.push(`final_sentences.jsonl 행 수: ${finalRows.length}`);
  if (definitions.length !== 1200) errors.push(`definitions_v2.jsonl 행 수: ${definitions.length}`);

  const outputRows = [];
  let changed = 0;
  for (let index = 0; index < Math.max(finalRows.length, definitions.length); index += 1) {
    const current = finalRows[index];
    const definition = definitions[index];
    if (!current || !definition) continue;
    if (!objectKeysEqual(current, FINAL_KEYS)) errors.push(`${current.wordId ?? index + 1}: final 키 불일치`);
    if (!objectKeysEqual(definition, DEFINITION_KEYS)) errors.push(`${definition.wordId ?? index + 1}: definition 키 불일치`);
    if (current.wordId !== definition.wordId) errors.push(`${index + 1}: wordId 순서 불일치`);
    if (
      current.word !== definition.word ||
      current.partOfSpeech !== definition.partOfSpeech ||
      current.meaningKo !== definition.meaningKo
    ) errors.push(`${current.wordId}: 단어·품사·뜻 불일치`);
    if (current.definition !== definition.definitionOld && current.definition !== definition.definitionNew) {
      errors.push(`${current.wordId}: 현재 definition이 definitionOld/definitionNew 어느 쪽과도 일치하지 않음`);
    }
    if (definition.sentenceFit !== "ok" || definition.reviewRequired) {
      errors.push(`${current.wordId}: 미해결 판정 sentenceFit=${definition.sentenceFit}, reviewRequired=${definition.reviewRequired}`);
    }
    if (current.definition !== definition.definitionNew) changed += 1;
    outputRows.push({ ...current, definition: definition.definitionNew });
  }
  if (errors.length) throw new Error(`반영 전 게이트 실패 (${errors.length}건)\n${errors.slice(0, 30).join("\n")}`);

  const immutableBeforeHash = sha256(JSON.stringify(immutableProjection(finalRows)));
  const immutableAfterHash = sha256(JSON.stringify(immutableProjection(outputRows)));
  if (immutableBeforeHash !== immutableAfterHash) throw new Error("definition 외 필드가 변경되었습니다.");
  const outputJsonl = `${outputRows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const outputMarkdown = renderMarkdown(outputRows, catalog);
  const report = renderReport({
    finalPath: path.relative(process.cwd(), finalPath).replaceAll("\\", "/"),
    markdownPath: path.relative(process.cwd(), markdownPath).replaceAll("\\", "/"),
    definitionsPath: path.relative(process.cwd(), definitionsPath).replaceAll("\\", "/"),
    beforeHash: sha256(finalSource),
    afterHash: sha256(outputJsonl),
    beforeMarkdownHash: sha256(markdownSource),
    afterMarkdownHash: sha256(outputMarkdown),
    definitionsHash: sha256(definitionSource),
    immutableBeforeHash,
    immutableAfterHash,
    changed,
    unchanged: outputRows.length - changed,
  });

  await writeAtomic(finalPath, outputJsonl);
  await writeAtomic(markdownPath, outputMarkdown);
  await writeAtomic(reportPath, report);
  process.stdout.write(`PASS: ${outputRows.length}/1200줄, definition 변경 ${changed}, 유지 ${outputRows.length - changed}\n`);
  process.stdout.write(`Report: ${reportPath}\n`);
}

main().catch(printFailure);
