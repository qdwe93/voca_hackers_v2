#!/usr/bin/env node

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AUTHORS,
  defaultPath,
  loadAssignments,
  loadCalibrationCorpus,
  loadCandidateCorpus,
  loadConceptCatalog,
  loadInventory,
  loadWordIdFilter,
  markdownCell,
  parseArgs,
  parseDayFilter,
  parseSetFilter,
  printFailure,
  resolveCliPath,
  sortByInventory,
} from "./lib.mjs";

const HELP = `
baseline·codex·antigravity·claude 문장을 단어별 Markdown 표로 비교합니다.

사용법:
  node mid1st/scripts/compare-candidates.mjs [options]
  node mid1st/scripts/compare-candidates.mjs --calibration [options]

옵션:
  --day <1..30|DAY01>  특정 DAY만 비교
  --set <1..4>         특정 세트만 비교(--day와 조합 가능)
  --word-ids <path>    JSON 배열/{wordIds}/{items[].wordId} 필터
  --calibration        대표 샘플 후보 JSONL 3개 비교
  --inventory <path>   inventory 재정의
  --assignments <path> assignment 재정의
  --concepts <path>    concept catalog 재정의
  --out <path>         Markdown 출력 경로 재정의
  --stdout             파일을 쓰지 않고 stdout에만 출력
  --force              기존 Markdown 출력 덮어쓰기
  --selection-template [path]
                       선택 JSONL을 baseline으로 미리 채워 생성
  --force-template     기존 선택 템플릿 덮어쓰기
  --help               도움말

기본 출력:
  full: mid1st/comparisons/all.md (필터 사용 시 파일명 자동 변경)
  calibration: mid1st/calibration/comparison.md
`;

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function defaultOutput(calibration, day, set) {
  if (calibration) return defaultPath("calibration", "comparison.md");
  const bits = [];
  if (day) bits.push(`DAY${String(day).padStart(2, "0")}`);
  if (set) bits.push(`set${set}`);
  return defaultPath("comparisons", bits.length ? `${bits.join("_")}.md` : "all.md");
}

function selectedRows(inventory, ids, day, set) {
  const idSet = ids ? new Set(ids) : null;
  return sortByInventory(
    inventory.rows.filter((row) =>
      (!idSet || idSet.has(row.wordId)) &&
      (!day || row.day === day) &&
      (!set || row.set === set),
    ),
  );
}

function candidateSentence(corpus, wordId) {
  const row = corpus.byId.get(wordId);
  return typeof row?.sentence === "string" ? row.sentence : null;
}

function makeMarkdown(rows, assignments, concepts, corpora, calibration) {
  const lines = [
    `# ${calibration ? "Calibration " : ""}sentence candidate comparison`,
    "",
    "선택 기준: 확정 뜻이 정확하고, 배정된 교과 개념과 단어가 비유·은유 없이 한 장면에서",
    "직접 확인되며, 사실에 맞고 자연스러운 문장을 고른다.",
    "",
    `- words: ${rows.length}`,
    `- authors: ${AUTHORS.join(", ")}`,
    "",
  ];
  let previousGroup = "";
  for (const row of rows) {
    const group = `${row.day}-${row.set}`;
    if (group !== previousGroup) {
      if (previousGroup) lines.push("");
      lines.push(
        `## DAY ${String(row.day).padStart(2, "0")} · set ${row.set} · ${row.partTopic} / ${row.dayTopic}`,
        "",
        "| ID | word | 확정 뜻·정의 | 배정 개념·직접 단서 | baseline | codex | antigravity | claude | 선택 |",
        "|---|---|---|---|---|---|---|---|---|",
      );
      previousGroup = group;
    }
    const assignment = assignments.byId.get(row.wordId);
    const fixedMeaning = `${row.meaningKo}<br>${row.definition}`;
    const concept = assignment?.conceptId ? concepts.byId.get(assignment.conceptId) : null;
    const conceptName = concept
      ? `${concept.subjectKo} / ${concept.conceptKo} (${concept.conceptEn})`
      : (assignment?.conceptId ?? "fallback");
    const assigned = assignment
      ? `${conceptName}<br>${assignment.matchMode}<br>${assignment.conceptCueKo}`
      : "⚠ assignment 없음";
    lines.push(
      `| ${markdownCell(row.wordId)} | ${markdownCell(row.word)} | ${markdownCell(fixedMeaning)} | ${markdownCell(assigned)} | ${markdownCell(row.baselineSentence)} | ${markdownCell(candidateSentence(corpora.codex, row.wordId) ?? "⚠ 누락")} | ${markdownCell(candidateSentence(corpora.antigravity, row.wordId) ?? "⚠ 누락")} | ${markdownCell(candidateSentence(corpora.claude, row.wordId) ?? "⚠ 누락")} |  |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

async function writeSafe(filePath, text, force, description) {
  if (!force && await pathExists(filePath)) {
    throw new Error(`${description}이 이미 있습니다. 덮어쓰려면 해당 force 옵션을 사용하세요: ${filePath}`);
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP.trimStart());
    return;
  }
  const calibration = Boolean(args.calibration);
  if (args["allow-partial"] && !calibration) {
    throw new Error(`부분 후보 비교는 --calibration 모드로 격리되어 있습니다.`);
  }
  const day = parseDayFilter(args.day);
  const set = parseSetFilter(args.set);
  const inventoryPath = resolveCliPath(args.inventory, defaultPath("data", "word_inventory.jsonl"));
  const assignmentsPath = resolveCliPath(args.assignments, defaultPath("data", "concept_assignments.jsonl"));
  const conceptsPath = resolveCliPath(args.concepts, defaultPath("data", "concept_catalog.json"));
  const [inventory, assignments, concepts] = await Promise.all([
    loadInventory(inventoryPath),
    loadAssignments(assignmentsPath),
    loadConceptCatalog(conceptsPath),
  ]);
  let wordIds = null;
  if (calibration || args["word-ids"]) {
    const filterPath = resolveCliPath(args["word-ids"], defaultPath("calibration", "representative_words.json"));
    wordIds = await loadWordIdFilter(filterPath);
    const unknown = wordIds.filter((id) => !inventory.byId.has(id));
    if (unknown.length) throw new Error(`word ID 필터에 inventory 밖의 ID가 있습니다: ${unknown.join(", ")}`);
  }
  const rows = selectedRows(inventory, wordIds, day, set);
  if (!rows.length) throw new Error(`필터에 맞는 단어가 없습니다.`);

  const corpora = {};
  await Promise.all(AUTHORS.map(async (author) => {
    corpora[author] = calibration
      ? await loadCalibrationCorpus(author, defaultPath("calibration", "candidates", author, "sentences.jsonl"))
      : await loadCandidateCorpus(author, defaultPath("candidates", author));
  }));
  const missing = [];
  for (const row of rows) {
    if (!assignments.byId.has(row.wordId)) missing.push(`${row.wordId}:assignment`);
    const assignment = assignments.byId.get(row.wordId);
    if (assignment?.conceptId && !concepts.byId.has(assignment.conceptId)) missing.push(`${row.wordId}:concept=${assignment.conceptId}`);
    for (const author of AUTHORS) {
      if (!candidateSentence(corpora[author], row.wordId)) missing.push(`${row.wordId}:${author}`);
    }
  }
  if (missing.length) {
    throw new Error(`비교 입력이 불완전합니다 (${missing.length}건): ${missing.slice(0, 30).join(", ")}${missing.length > 30 ? ", …" : ""}`);
  }

  const markdown = makeMarkdown(rows, assignments, concepts, corpora, calibration);
  if (args.stdout) process.stdout.write(`${markdown}\n`);
  else {
    const outputPath = resolveCliPath(args.out, defaultOutput(calibration, day, set));
    await writeSafe(outputPath, `${markdown}\n`, Boolean(args.force), "비교 파일");
    process.stdout.write(`PASS: ${rows.length}개 단어 비교표 생성\n${outputPath}\n`);
  }

  if (args["selection-template"]) {
    const raw = args["selection-template"];
    const filteredName = [day ? `DAY${String(day).padStart(2, "0")}` : null, set ? `set${set}` : null]
      .filter(Boolean).join("_");
    const templatePath = resolveCliPath(
      typeof raw === "string" ? raw : undefined,
      calibration
        ? defaultPath("calibration", "selected_examples.jsonl")
        : (filteredName
          ? defaultPath("comparisons", `selection_${filteredName}.jsonl`)
          : defaultPath("final", "selection_manifest.jsonl")),
    );
    const text = rows.map((row) => JSON.stringify(calibration
      ? {
        wordId: row.wordId,
        selectedAuthor: "baseline",
        sentence: row.baselineSentence,
        preferenceNoteKo: "",
      }
      : {
        wordId: row.wordId,
        selectedAuthor: "baseline",
        sentenceOverride: null,
        note: "",
      })).join("\n") + "\n";
    await writeSafe(templatePath, text, Boolean(args["force-template"]), "선택 템플릿");
    process.stdout.write(`Selection template: ${templatePath}\n`);
  }
}

main().catch(printFailure);
