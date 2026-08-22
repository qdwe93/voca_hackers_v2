#!/usr/bin/env node

import { access, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AUTHORS,
  containsExactWord,
  defaultPath,
  englishWords,
  loadAssignments,
  loadCandidateCorpus,
  loadInventory,
  parseArgs,
  printFailure,
  readJsonl,
  resolveCliPath,
  sortByInventory,
  strictKeys,
} from "./lib.mjs";

const SELECTION_KEYS = ["wordId", "selectedAuthor", "sentenceOverride", "note"];
const SOURCES = [...AUTHORS, "baseline", "manual"];

const HELP = `
단어별 selection manifest를 읽어 별도의 최종 JSONL을 생성합니다.

사용법:
  node mid1st/scripts/build-final.mjs [options]

옵션:
  --selection <path>    기본: mid1st/final/selection_manifest.jsonl
  --inventory <path>    기본: mid1st/data/word_inventory.jsonl
  --assignments <path>  기본: mid1st/data/concept_assignments.jsonl
  --out <path>          기본: mid1st/final/final_sentences.jsonl
  --expected <number>   기본: 1200
  --report <path>       빌드 보고서 Markdown 저장
  --dry-run             검증만 하고 결과를 쓰지 않음
  --force               기존 --out 파일 덮어쓰기
  --help                도움말

manual 선택은 sentenceOverride에 문장을 넣어야 합니다. 그 외 source는
sentenceOverride가 null이어야 합니다. 기존 inventory·assignment·후보 파일은 수정하지 않습니다.
`;

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeAtomic(filePath, text, force) {
  if (!force && await exists(filePath)) {
    throw new Error(`최종 파일이 이미 있습니다. 덮어쓰려면 --force를 사용하세요: ${filePath}`);
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.tmp-${process.pid}`);
  try {
    await writeFile(temporary, text, { encoding: "utf8", flag: "wx" });
    if (force && await exists(filePath)) await unlink(filePath);
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

function validateSelection(rows, inventory, expected, errors) {
  if (rows.length !== expected) errors.push(`selection 행 수가 ${expected}가 아닙니다: ${rows.length}`);
  const byId = new Map();
  rows.forEach(({ value: row, line }) => {
    const label = `selection line ${line}`;
    if (!strictKeys(row, SELECTION_KEYS, label, errors)) return;
    if (!inventory.byId.has(row.wordId)) errors.push(`${label}: inventory에 없는 wordId ${row.wordId}`);
    if (byId.has(row.wordId)) errors.push(`${label}: 중복 wordId ${row.wordId}`);
    else byId.set(row.wordId, row);
    if (!SOURCES.includes(row.selectedAuthor)) errors.push(`${label}: selectedAuthor는 ${SOURCES.join("|")} 중 하나여야 합니다.`);
    if (row.selectedAuthor === "manual") {
      if (typeof row.sentenceOverride !== "string" || !row.sentenceOverride.trim()) errors.push(`${label}: manual 선택에는 sentenceOverride가 필요합니다.`);
    } else if (row.sentenceOverride !== null) {
      errors.push(`${label}: manual 외 선택의 sentenceOverride는 null이어야 합니다.`);
    }
    if (typeof row.note !== "string" || !/^(?:auto|reviewRequired):\s*\S/.test(row.note)) {
      errors.push(`${label}: note는 'auto:' 또는 'reviewRequired:'로 시작하고 이유를 포함해야 합니다.`);
    }
  });
  for (const row of inventory.rows) {
    if (!byId.has(row.wordId)) errors.push(`selection 누락: ${row.wordId} ${row.word}`);
  }
  return byId;
}

function validateSentence(sentence, inventoryRow, label, errors) {
  if (typeof sentence !== "string" || sentence.trim() !== sentence || !sentence) {
    errors.push(`${label}: 선택 문장은 앞뒤 공백 없는 비어 있지 않은 문자열이어야 합니다.`);
    return;
  }
  const count = englishWords(sentence).length;
  if (count < 8 || count > 12) errors.push(`${label}: 선택 문장은 영어 8~12단어여야 합니다 (actual=${count}).`);
  if (!containsExactWord(sentence, inventoryRow.word)) errors.push(`${label}: 표제어 ${JSON.stringify(inventoryRow.word)}가 철자 그대로 없습니다.`);
}

function reportText(errors, outputRows, sourceCounts, outputPath, dryRun) {
  const lines = [
    "# Final sentence build report",
    "",
    `- 상태: **${errors.length ? "FAIL" : "PASS"}**`,
    `- rows: ${outputRows.length}`,
    `- action: ${dryRun ? "dry-run (파일 미작성)" : "write"}`,
    `- output: ${outputPath}`,
    "",
    "## Selected source",
    "",
    "| source | count |",
    "|---|---:|",
    ...SOURCES.map((source) => `| ${source} | ${sourceCounts.get(source) ?? 0} |`),
    "",
    "## Errors",
    "",
  ];
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
  const expected = args.expected === undefined ? 1200 : Number(args.expected);
  if (!Number.isInteger(expected) || expected < 1) throw new Error(`--expected는 양의 정수여야 합니다: ${args.expected}`);
  const inventoryPath = resolveCliPath(args.inventory, defaultPath("data", "word_inventory.jsonl"));
  const assignmentsPath = resolveCliPath(args.assignments, defaultPath("data", "concept_assignments.jsonl"));
  const selectionPath = resolveCliPath(args.selection, defaultPath("final", "selection_manifest.jsonl"));
  const outputPath = resolveCliPath(args.out, defaultPath("final", "final_sentences.jsonl"));
  const [inventory, assignments, parsedSelections] = await Promise.all([
    loadInventory(inventoryPath),
    loadAssignments(assignmentsPath),
    readJsonl(selectionPath),
  ]);
  const errors = [];
  if (inventory.rows.length !== expected) errors.push(`inventory 행 수가 ${expected}가 아닙니다: ${inventory.rows.length}`);
  const selections = validateSelection(parsedSelections, inventory, expected, errors);
  const requiredAuthors = new Set(
    parsedSelections.map(({ value }) => value?.selectedAuthor).filter((source) => AUTHORS.includes(source)),
  );
  const corpora = new Map();
  await Promise.all([...requiredAuthors].map(async (author) => {
    corpora.set(author, await loadCandidateCorpus(author, defaultPath("candidates", author)));
  }));

  const outputRows = [];
  const sourceCounts = new Map(SOURCES.map((source) => [source, 0]));
  for (const inventoryRow of sortByInventory(inventory.rows)) {
    const selection = selections.get(inventoryRow.wordId);
    const assignment = assignments.byId.get(inventoryRow.wordId);
    if (!selection || !assignment) {
      if (!assignment) errors.push(`assignment 누락: ${inventoryRow.wordId}`);
      continue;
    }
    let sentence = null;
    if (selection.selectedAuthor === "manual") sentence = selection.sentenceOverride;
    else if (selection.selectedAuthor === "baseline") sentence = inventoryRow.baselineSentence;
    else sentence = corpora.get(selection.selectedAuthor)?.byId.get(inventoryRow.wordId)?.sentence ?? null;
    if (sentence === null) errors.push(`선택한 후보 문장 누락: ${inventoryRow.wordId} source=${selection.selectedAuthor}`);
    else validateSentence(sentence, inventoryRow, `${inventoryRow.wordId} source=${selection.selectedAuthor}`, errors);
    sourceCounts.set(selection.selectedAuthor, (sourceCounts.get(selection.selectedAuthor) ?? 0) + 1);
    outputRows.push({
      wordId: inventoryRow.wordId,
      day: inventoryRow.day,
      no: inventoryRow.no,
      set: inventoryRow.set,
      word: inventoryRow.word,
      part: inventoryRow.part,
      partTopic: inventoryRow.partTopic,
      dayTopic: inventoryRow.dayTopic,
      partOfSpeech: inventoryRow.partOfSpeech,
      meaningKo: inventoryRow.meaningKo,
      ipa: inventoryRow.ipa,
      definition: inventoryRow.definition,
      conceptId: assignment.conceptId,
      matchMode: assignment.matchMode,
      conceptCueKo: assignment.conceptCueKo,
      selectedAuthor: selection.selectedAuthor,
      sentence,
      selectionNote: selection.note,
    });
  }
  if (outputRows.length !== expected) errors.push(`최종 행 수가 ${expected}가 아닙니다: ${outputRows.length}`);
  const report = reportText(errors, outputRows, sourceCounts, outputPath, Boolean(args["dry-run"]));
  process.stdout.write(`${report}\n`);
  if (args.report) {
    const reportPath = path.resolve(String(args.report));
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${report}\n`, "utf8");
    process.stdout.write(`Report: ${reportPath}\n`);
  }
  if (errors.length) {
    process.exitCode = 1;
    return;
  }
  if (!args["dry-run"]) {
    const jsonl = outputRows.map((row) => JSON.stringify(row)).join("\n") + "\n";
    await writeAtomic(outputPath, jsonl, Boolean(args.force));
    process.stdout.write(`Final output: ${outputPath}\n`);
  }
}

main().catch(printFailure);
