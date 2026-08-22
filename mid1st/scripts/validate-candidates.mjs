#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AUTHORS,
  CURRICULUM_MODES,
  MATCH_MODES,
  candidateItemExpectedKeys,
  candidateSetExpectedKeys,
  containsExactWord,
  defaultPath,
  englishWords,
  folderForSet,
  isWithin,
  loadAssignments,
  loadCalibrationCorpus,
  loadCandidateCorpus,
  loadConceptCatalog,
  loadInventory,
  loadWordIdFilter,
  markdownCell,
  parseArgs,
  printFailure,
  rangeForSet,
  resolveCliPath,
  strictKeys,
} from "./lib.mjs";

const HELP = `
작성자별 예문 후보를 검증합니다.

사용법:
  node mid1st/scripts/validate-candidates.mjs --author <author> [options]
  node mid1st/scripts/validate-candidates.mjs --author <author> --calibration [options]

옵션:
  --author <name>        codex | antigravity | claude (필수)
  --inventory <path>     기본: mid1st/data/word_inventory.jsonl
  --assignments <path>   기본: mid1st/data/concept_assignments.jsonl
  --concepts <path>      기본: mid1st/data/concept_catalog.json
  --candidate-root <p>   full 후보 루트(정규 author 경로만 허용)
  --calibration          대표 24단어 JSONL 검증 모드
  --word-ids <path>      calibration ID 목록 재정의
  --candidate-file <p>   calibration sentences.jsonl 재정의
  --report <path>        결과를 Markdown으로 저장
  --help                 도움말

full 모드는 120개 세트와 1,200문장을 요구합니다. calibration 모드는
calibration/representative_words.json에 적힌 ID만 요구합니다.
`;

const FIGURATIVE_PATTERNS = [
  [/\blike\b/i, "like가 포함되어 비유인지 직접 비교인지 확인"],
  [/\bas if\b/i, "as if가 포함되어 비유 가능성 확인"],
  [/\bheart of\b/i, "heart of 관용·비유 가능성 확인"],
  [/\bworld of\b/i, "world of 비유 가능성 확인"],
  [/\bsymboli[sz]e(?:s|d)?\b/i, "상징 표현 확인"],
];
const SAFETY_PATTERNS = [
  [/\b(?:blood|bleed|wound|injur(?:y|ed)|kill|dead|death|gun|rifle|weapon|knife)\b/i, "상처·폭력 관련 어휘"],
  [/\b(?:poison|venom|toxic|fatal|dangerous)\b/i, "독성·위험 관련 어휘"],
  [/\b(?:terror|horror|threat|attack)\b/i, "공포·위협 관련 어휘"],
];
const FACTUALITY_PATTERNS = [
  [/\b(?:always|never|every|all|none)\b/i, "전칭 표현의 사실 정확성 확인"],
  [/\b(?:cause|causes|caused|because|therefore|equals?)\b/i, "인과·등식 주장의 사실 정확성 확인"],
  [/\b\d+(?:\.\d+)?\b/, "수치가 포함된 교과 사실 확인"],
];

function candidateReviewNotes(sentence, assignment) {
  const notes = [];
  for (const [pattern, note] of FIGURATIVE_PATTERNS) {
    if (pattern.test(sentence)) notes.push({ kind: "figurative-risk", note });
  }
  for (const [pattern, note] of SAFETY_PATTERNS) {
    if (pattern.test(sentence)) notes.push({ kind: "safety-risk", note });
  }
  for (const [pattern, note] of FACTUALITY_PATTERNS) {
    if (pattern.test(sentence)) notes.push({ kind: "factuality-risk", note });
  }
  if (assignment?.reviewRequired) {
    notes.push({ kind: "assignment-review", note: assignment.reviewReason });
  } else if (assignment?.confidence === "low") {
    notes.push({ kind: "assignment-review", note: "배정 confidence가 low입니다." });
  }
  return notes;
}

function validateItem({ item, inventoryRow, assignment, label, errors, reviewRows }) {
  if (!strictKeys(item, candidateItemExpectedKeys(), label, errors)) return;
  if (!inventoryRow) {
    errors.push(`${label}: inventory에 없는 wordId ${item.wordId}`);
    return;
  }
  for (const key of ["wordId", "no", "word"]) {
    if (item[key] !== inventoryRow[key]) {
      errors.push(`${label}: 불변 필드 ${key}가 inventory와 다릅니다 (expected=${JSON.stringify(inventoryRow[key])}, actual=${JSON.stringify(item[key])}).`);
    }
  }
  if (!assignment) errors.push(`${label}: concept assignment가 없습니다: ${item.wordId}`);
  if (typeof item.sentence !== "string" || item.sentence.trim() !== item.sentence || !item.sentence) {
    errors.push(`${label}: sentence는 앞뒤 공백 없는 비어 있지 않은 문자열이어야 합니다.`);
    return;
  }
  const count = englishWords(item.sentence).length;
  if (count < 8 || count > 12) errors.push(`${label}: 영어 단어 수는 8~12여야 합니다 (actual=${count}).`);
  if (!containsExactWord(item.sentence, inventoryRow.word)) {
    errors.push(`${label}: 표제어 ${JSON.stringify(inventoryRow.word)}가 철자 그대로 포함되지 않았습니다.`);
  }
  for (const review of candidateReviewNotes(item.sentence, assignment)) {
    reviewRows.push({
      wordId: item.wordId,
      word: item.word,
      conceptId: assignment?.conceptId ?? "fallback",
      conceptCueKo: assignment?.conceptCueKo ?? "assignment 없음",
      kind: review.kind,
      note: review.note,
      sentence: item.sentence,
    });
  }
}

function validateAssignmentReferences(targetRows, inventory, assignments, concepts, errors) {
  if (assignments.rows.length !== inventory.rows.length) {
    errors.push(`assignment 행 수가 inventory와 다릅니다 (inventory=${inventory.rows.length}, assignments=${assignments.rows.length}).`);
  }
  const counts = new Map();
  for (const row of assignments.rows) {
    if (typeof row?.wordId === "string") counts.set(row.wordId, (counts.get(row.wordId) ?? 0) + 1);
  }
  for (const [wordId, count] of counts) {
    if (count > 1) errors.push(`중복 assignment wordId: ${wordId} (${count}행)`);
  }
  for (const inventoryRow of targetRows) {
    const row = assignments.byId.get(inventoryRow.wordId);
    if (!row) {
      errors.push(`assignment 누락: ${inventoryRow.wordId} ${inventoryRow.word}`);
      continue;
    }
    for (const key of ["wordId", "day", "no", "set", "word"]) {
      if (row[key] !== inventoryRow[key]) errors.push(`assignment ${row.wordId}: 불변 필드 ${key}가 inventory와 다릅니다.`);
    }
    if (!MATCH_MODES.includes(row.matchMode)) {
      errors.push(`assignment ${row.wordId}: 잘못된 matchMode ${JSON.stringify(row.matchMode)}`);
    } else if (CURRICULUM_MODES.has(row.matchMode)) {
      if (typeof row.conceptId !== "string" || !concepts.byId.has(row.conceptId)) errors.push(`assignment ${row.wordId}: catalog에 없는 conceptId ${JSON.stringify(row.conceptId)}`);
    } else if (row.conceptId !== null) {
      errors.push(`assignment ${row.wordId}: fallback conceptId는 null이어야 합니다.`);
    }
    if (typeof row.conceptCueKo !== "string" || !row.conceptCueKo.trim()) errors.push(`assignment ${row.wordId}: conceptCueKo가 비어 있습니다.`);
  }
}

async function validateFull({ author, candidateRoot, targetRows, inventory, assignments, errors, warnings, reviewRows }) {
  const expectedRoot = defaultPath("candidates", author);
  if (path.resolve(candidateRoot).toLowerCase() !== path.resolve(expectedRoot).toLowerCase()) {
    errors.push(`author/path 불일치: ${author} 후보는 ${expectedRoot}에 있어야 합니다 (actual=${candidateRoot}).`);
  }
  if (!isWithin(defaultPath("candidates"), candidateRoot)) {
    errors.push(`후보 루트가 mid1st/candidates 밖에 있습니다: ${candidateRoot}`);
  }
  const corpus = await loadCandidateCorpus(author, candidateRoot);
  const expectedGroups = new Map();
  for (const row of targetRows) {
    const key = `${row.day}-${row.set}`;
    if (!expectedGroups.has(key)) expectedGroups.set(key, []);
    expectedGroups.get(key).push(row);
  }
  if (corpus.files.length !== expectedGroups.size) {
    errors.push(`세트 파일 수가 ${expectedGroups.size}가 아닙니다: ${corpus.files.length}`);
  }
  for (const duplicate of corpus.duplicates) errors.push(`중복 후보 wordId: ${duplicate}`);

  const actualRelative = new Set();
  for (const { filePath, value } of corpus.sets) {
    const relative = path.relative(candidateRoot, filePath).replace(/\\/g, "/");
    actualRelative.add(relative.toLowerCase());
    const label = relative;
    if (!strictKeys(value, candidateSetExpectedKeys(), label, errors)) continue;
    if (value.schemaVersion !== 1) errors.push(`${label}: schemaVersion은 1이어야 합니다.`);
    if (value.author !== author) errors.push(`${label}: author는 ${author}여야 합니다 (actual=${value.author}).`);
    if (!Number.isInteger(value.day) || value.day < 1 || value.day > 30) errors.push(`${label}: day는 1~30 정수여야 합니다.`);
    if (!Number.isInteger(value.set) || value.set < 1 || value.set > 4) errors.push(`${label}: set은 1~4 정수여야 합니다.`);
    if (Number.isInteger(value.set) && value.range !== rangeForSet(value.set)) {
      errors.push(`${label}: range가 set과 다릅니다 (expected=${rangeForSet(value.set)}, actual=${value.range}).`);
    }
    if (Number.isInteger(value.day) && Number.isInteger(value.set)) {
      const expectedRelative = `${folderForSet(value.day, value.set)}/sentences.json`.toLowerCase();
      if (relative.toLowerCase() !== expectedRelative) errors.push(`${label}: 파일 경로가 day/set과 다릅니다 (expected=${expectedRelative}).`);
    }
    if (!Array.isArray(value.items) || value.items.length !== 10) {
      errors.push(`${label}: items는 정확히 10개여야 합니다.`);
      continue;
    }
    const group = expectedGroups.get(`${value.day}-${value.set}`) ?? [];
    const expectedIds = group.map((row) => row.wordId);
    value.items.forEach((item, index) => {
      const itemLabel = `${label} items[${index}]`;
      if (item?.wordId !== expectedIds[index]) {
        errors.push(`${itemLabel}: 세트 순서/ID 불일치 (expected=${expectedIds[index] ?? "none"}, actual=${item?.wordId}).`);
      }
      validateItem({
        item,
        inventoryRow: inventory.byId.get(item?.wordId),
        assignment: assignments.byId.get(item?.wordId),
        label: itemLabel,
        errors,
        reviewRows,
      });
    });
  }
  for (const rows of expectedGroups.values()) {
    const first = rows[0];
    const expected = `${folderForSet(first.day, first.set)}/sentences.json`.toLowerCase();
    if (!actualRelative.has(expected)) errors.push(`후보 세트 누락: ${expected}`);
  }
  for (const row of targetRows) {
    if (!corpus.byId.has(row.wordId)) errors.push(`후보 문장 누락: ${row.wordId} ${row.word}`);
  }
  if (reviewRows.length) warnings.push(`자동 휴리스틱 검토 메모 ${reviewRows.length}건`);
  return corpus;
}

async function validateCalibration({ author, candidateFile, targetRows, inventory, assignments, errors, warnings, reviewRows }) {
  const expectedFile = defaultPath("calibration", "candidates", author, "sentences.jsonl");
  if (path.resolve(candidateFile).toLowerCase() !== path.resolve(expectedFile).toLowerCase()) {
    errors.push(`author/path 불일치: ${author} calibration 후보는 ${expectedFile}에 있어야 합니다 (actual=${candidateFile}).`);
  }
  const corpus = await loadCalibrationCorpus(author, candidateFile);
  if (corpus.parsed.length !== targetRows.length) {
    errors.push(`calibration 행 수가 ${targetRows.length}가 아닙니다: ${corpus.parsed.length}`);
  }
  for (const duplicate of corpus.duplicates) errors.push(`중복 calibration wordId: ${duplicate}`);
  const targetIds = new Set(targetRows.map((row) => row.wordId));
  corpus.parsed.forEach(({ value: item, line }, index) => {
    const label = `${candidateFile}:${line}`;
    if (item?.wordId !== targetRows[index]?.wordId) {
      errors.push(`${label}: representative_words 순서/ID 불일치 (expected=${targetRows[index]?.wordId ?? "none"}, actual=${item?.wordId}).`);
    }
    if (item?.wordId && !targetIds.has(item.wordId)) errors.push(`${label}: 대표 목록 밖의 wordId ${item.wordId}`);
    validateItem({
      item,
      inventoryRow: inventory.byId.get(item?.wordId),
      assignment: assignments.byId.get(item?.wordId),
      label,
      errors,
      reviewRows,
    });
  });
  for (const row of targetRows) {
    if (!corpus.byId.has(row.wordId)) errors.push(`calibration 문장 누락: ${row.wordId} ${row.word}`);
  }
  if (reviewRows.length) warnings.push(`자동 휴리스틱 검토 메모 ${reviewRows.length}건`);
  return corpus;
}

function makeReport({ author, mode, targetRows, corpus, errors, warnings, reviewRows }) {
  const lines = [
    `# Candidate validation report — ${author}`,
    "",
    `- 상태: **${errors.length ? "FAIL" : "PASS"}**`,
    `- mode: ${mode}`,
    `- expected words: ${targetRows.length}`,
    `- candidate sentences: ${corpus?.byId?.size ?? 0}`,
    `- files: ${mode === "calibration" ? (corpus ? 1 : 0) : (corpus?.files?.length ?? 0)}`,
    "",
    "## 의미 검토 범위",
    "",
    "이 검증기는 철자·길이·ID·경로·strict 형식을 확인한다. 지정 뜻과 배정 교과 개념이",
    "비유 없이 직접 드러나는지, 교과 사실이 정확한지는 자동 확정하지 않는다. 아래 휴리스틱",
    "메모와 assignment의 `conceptCueKo`를 함께 보고 사람이 비교·선택해야 한다.",
    "",
    "## Warnings",
    "",
  ];
  if (!warnings.length) lines.push("- 없음");
  else warnings.forEach((warning) => lines.push(`- WARN: ${warning}`));
  lines.push("", "## Review notes (PASS/FAIL에 영향 없음)", "", "| wordId | word | concept | concept cue | kind | note | sentence |", "|---|---|---|---|---|---|---|");
  if (!reviewRows.length) lines.push("| — | — | — | — | — | 자동 감지 항목 없음 | — |");
  else {
    for (const row of reviewRows) {
      lines.push(`| ${markdownCell(row.wordId)} | ${markdownCell(row.word)} | ${markdownCell(row.conceptId)} | ${markdownCell(row.conceptCueKo)} | ${markdownCell(row.kind)} | ${markdownCell(row.note)} | ${markdownCell(row.sentence)} |`);
    }
  }
  lines.push("", "## Errors", "");
  if (!errors.length) lines.push("- 없음");
  else {
    errors.slice(0, 200).forEach((error) => lines.push(`- ${error}`));
    if (errors.length > 200) lines.push(`- … ${errors.length - 200}개 오류 생략`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP.trimStart());
    return;
  }
  const author = String(args.author ?? "").toLowerCase();
  if (!AUTHORS.includes(author)) throw new Error(`--author는 ${AUTHORS.join("|")} 중 하나여야 합니다.`);
  const calibration = Boolean(args.calibration);
  if (args["allow-partial"] && !calibration) {
    throw new Error(`부분 후보는 본 후보 폴더에서 허용하지 않습니다. --calibration을 사용하세요.`);
  }
  const inventoryPath = resolveCliPath(args.inventory, defaultPath("data", "word_inventory.jsonl"));
  const assignmentsPath = resolveCliPath(args.assignments, defaultPath("data", "concept_assignments.jsonl"));
  const conceptsPath = resolveCliPath(args.concepts, defaultPath("data", "concept_catalog.json"));
  const [inventory, assignments, concepts] = await Promise.all([
    loadInventory(inventoryPath),
    loadAssignments(assignmentsPath),
    loadConceptCatalog(conceptsPath),
  ]);
  let targetRows = inventory.rows;
  if (calibration) {
    const wordIdsPath = resolveCliPath(args["word-ids"], defaultPath("calibration", "representative_words.json"));
    const ids = await loadWordIdFilter(wordIdsPath);
    targetRows = ids.map((id) => {
      const row = inventory.byId.get(id);
      if (!row) throw new Error(`대표 목록에 inventory 밖의 wordId가 있습니다: ${id}`);
      return row;
    });
  }
  const errors = [];
  const warnings = [];
  const reviewRows = [];
  validateAssignmentReferences(targetRows, inventory, assignments, concepts, errors);
  let corpus;
  if (calibration) {
    const candidateFile = resolveCliPath(args["candidate-file"], defaultPath("calibration", "candidates", author, "sentences.jsonl"));
    corpus = await validateCalibration({ author, candidateFile, targetRows, inventory, assignments, errors, warnings, reviewRows });
  } else {
    const candidateRoot = resolveCliPath(args["candidate-root"], defaultPath("candidates", author));
    corpus = await validateFull({ author, candidateRoot, targetRows, inventory, assignments, errors, warnings, reviewRows });
  }
  const report = makeReport({ author, mode: calibration ? "calibration" : "full", targetRows, corpus, errors, warnings, reviewRows });
  process.stdout.write(`${report}\n`);
  if (args.report) {
    const reportPath = path.resolve(String(args.report));
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${report}\n`, "utf8");
    process.stdout.write(`Report: ${reportPath}\n`);
  }
  if (errors.length) process.exitCode = 1;
}

main().catch(printFailure);
