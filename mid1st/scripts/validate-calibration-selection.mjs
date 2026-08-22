#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AUTHORS,
  containsExactWord,
  defaultPath,
  englishWords,
  loadCalibrationCorpus,
  loadInventory,
  loadWordIdFilter,
  parseArgs,
  printFailure,
  readJsonl,
  resolveCliPath,
  strictKeys,
} from "./lib.mjs";

const KEYS = ["wordId", "selectedAuthor", "sentence", "preferenceNoteKo"];
const SOURCES = [...AUTHORS, "baseline", "manual"];

const HELP = `
사용자가 고른 대표 예문과 선호 메모를 P2 선행 게이트로 검증합니다.

사용법:
  node mid1st/scripts/validate-calibration-selection.mjs [options]

옵션:
  --selection <path>  기본: mid1st/calibration/selected_examples.jsonl
  --word-ids <path>   기본: mid1st/calibration/representative_words.json
  --inventory <path>  기본: mid1st/data/word_inventory.jsonl
  --min <number>       최소 선택 수. 기본: 6
  --max <number>       최대 선택 수. 기본: 12
  --report <path>      Markdown 보고서 저장
  --help               도움말

author/baseline 선택 문장은 실제 원문과 완전히 같아야 합니다. manual만 새 문장을 허용합니다.
모든 행에는 비어 있지 않은 preferenceNoteKo가 필요합니다.
`;

function positiveInteger(raw, fallback, name) {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name}은 양의 정수여야 합니다: ${raw}`);
  return value;
}

function validateSentence(row, inventoryRow, label, errors) {
  if (typeof row.sentence !== "string" || row.sentence.trim() !== row.sentence || !row.sentence) {
    errors.push(`${label}: sentence는 앞뒤 공백 없는 문자열이어야 합니다.`);
    return;
  }
  const count = englishWords(row.sentence).length;
  if (count < 8 || count > 12) errors.push(`${label}: sentence는 영어 8~12단어여야 합니다 (actual=${count}).`);
  if (!containsExactWord(row.sentence, inventoryRow.word)) errors.push(`${label}: 표제어 ${JSON.stringify(inventoryRow.word)}가 철자 그대로 없습니다.`);
}

function makeReport(errors, rows, min, max, sourceCounts) {
  const lines = [
    "# Calibration selection validation report",
    "",
    `- 상태: **${errors.length ? "FAIL" : "PASS"}**`,
    `- selected examples: ${rows.length} (required ${min}~${max})`,
    "",
    "## Source counts",
    "",
    "| source | count |",
    "|---|---:|",
    ...SOURCES.map((source) => `| ${source} | ${sourceCounts.get(source) ?? 0} |`),
    "",
    "## Errors",
    "",
  ];
  if (!errors.length) lines.push("- 없음");
  else errors.forEach((error) => lines.push(`- ${error}`));
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP.trimStart());
    return;
  }
  const min = positiveInteger(args.min, 6, "--min");
  const max = positiveInteger(args.max, 12, "--max");
  if (min > max) throw new Error(`--min은 --max보다 클 수 없습니다.`);
  const selectionPath = resolveCliPath(args.selection, defaultPath("calibration", "selected_examples.jsonl"));
  const wordIdsPath = resolveCliPath(args["word-ids"], defaultPath("calibration", "representative_words.json"));
  const inventoryPath = resolveCliPath(args.inventory, defaultPath("data", "word_inventory.jsonl"));
  const [parsed, representativeIds, inventory] = await Promise.all([
    readJsonl(selectionPath),
    loadWordIdFilter(wordIdsPath),
    loadInventory(inventoryPath),
  ]);
  const rows = parsed.map(({ value }) => value);
  const errors = [];
  if (rows.length < min || rows.length > max) errors.push(`선택 행 수는 ${min}~${max}여야 합니다: ${rows.length}`);
  const representativeSet = new Set(representativeIds);
  const seen = new Set();
  const requiredAuthors = new Set();
  const sourceCounts = new Map(SOURCES.map((source) => [source, 0]));
  parsed.forEach(({ value: row, line }) => {
    const label = `selected_examples line ${line}`;
    if (!strictKeys(row, KEYS, label, errors)) return;
    if (!representativeSet.has(row.wordId)) errors.push(`${label}: representative_words에 없는 wordId ${row.wordId}`);
    if (seen.has(row.wordId)) errors.push(`${label}: 중복 wordId ${row.wordId}`);
    seen.add(row.wordId);
    if (!SOURCES.includes(row.selectedAuthor)) errors.push(`${label}: selectedAuthor는 ${SOURCES.join("|")} 중 하나여야 합니다.`);
    if (AUTHORS.includes(row.selectedAuthor)) requiredAuthors.add(row.selectedAuthor);
    if (sourceCounts.has(row.selectedAuthor)) sourceCounts.set(row.selectedAuthor, sourceCounts.get(row.selectedAuthor) + 1);
    if (typeof row.preferenceNoteKo !== "string" || !row.preferenceNoteKo.trim()) errors.push(`${label}: preferenceNoteKo에 선택 이유를 적어야 합니다.`);
  });
  const corpora = new Map();
  await Promise.all([...requiredAuthors].map(async (author) => {
    corpora.set(author, await loadCalibrationCorpus(author, defaultPath("calibration", "candidates", author, "sentences.jsonl")));
  }));
  parsed.forEach(({ value: row, line }) => {
    const label = `selected_examples line ${line}`;
    const inventoryRow = inventory.byId.get(row?.wordId);
    if (!inventoryRow) {
      errors.push(`${label}: inventory에 없는 wordId ${row?.wordId}`);
      return;
    }
    validateSentence(row, inventoryRow, label, errors);
    if (row.selectedAuthor === "baseline" && row.sentence !== inventoryRow.baselineSentence) {
      errors.push(`${label}: baseline 문장이 inventory의 baselineSentence와 다릅니다.`);
    } else if (AUTHORS.includes(row.selectedAuthor)) {
      const original = corpora.get(row.selectedAuthor)?.byId.get(row.wordId)?.sentence;
      if (!original) errors.push(`${label}: ${row.selectedAuthor} 원본 후보를 찾을 수 없습니다.`);
      else if (row.sentence !== original) errors.push(`${label}: sentence가 ${row.selectedAuthor} 원본과 다릅니다. 수정 문장은 selectedAuthor=manual을 사용하세요.`);
    }
  });
  const report = makeReport(errors, rows, min, max, sourceCounts);
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
