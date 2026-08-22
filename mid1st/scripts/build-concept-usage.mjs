#!/usr/bin/env node

import { access, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CURRICULUM_MODES,
  MATCH_MODES,
  defaultPath,
  loadAssignments,
  loadConceptCatalog,
  parseArgs,
  printFailure,
  resolveCliPath,
} from "./lib.mjs";

const HELP = `
concept_assignments.jsonl에서 concept_usage.json을 결정론적으로 생성합니다.

사용법:
  node mid1st/scripts/build-concept-usage.mjs [options]

옵션:
  --assignments <path> 기본: mid1st/data/concept_assignments.jsonl
  --concepts <path>    기본: mid1st/data/concept_catalog.json
  --out <path>         기본: mid1st/data/concept_usage.json
  --stdout             파일을 쓰지 않고 JSON만 출력
  --force              기존 output 덮어쓰기
  --help               도움말

이 도구는 수치만 계산한다. balanceReviewNotesKo는 빈 배열로 생성되므로 의미 품질을 검토한
사람이나 assignment 작성자가 필요한 메모를 나중에 추가할 수 있다.
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
  if (!force && await exists(filePath)) throw new Error(`출력 파일이 이미 있습니다. 덮어쓰려면 --force를 사용하세요: ${filePath}`);
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

function buildUsage(assignments, concepts) {
  const conceptStats = new Map(concepts.rows.map((concept) => [concept.conceptId, {
    conceptId: concept.conceptId,
    count: 0,
    directCount: 0,
    contextualCount: 0,
  }]));
  const subjectCounts = Object.fromEntries(
    [...new Set(concepts.rows.map((concept) => concept.subject))].sort().map((subject) => [subject, 0]),
  );
  const matchModeCounts = Object.fromEntries(MATCH_MODES.map((mode) => [mode, 0]));

  assignments.rows.forEach((row, index) => {
    const label = `assignment line ${assignments.parsed[index].line}`;
    if (!MATCH_MODES.includes(row?.matchMode)) throw new Error(`${label}: 잘못된 matchMode ${JSON.stringify(row?.matchMode)}`);
    matchModeCounts[row.matchMode] += 1;
    if (CURRICULUM_MODES.has(row.matchMode)) {
      if (typeof row.conceptId !== "string" || !conceptStats.has(row.conceptId)) throw new Error(`${label}: catalog에 없는 conceptId ${JSON.stringify(row.conceptId)}`);
      const stat = conceptStats.get(row.conceptId);
      stat.count += 1;
      if (row.matchMode === "direct") stat.directCount += 1;
      else stat.contextualCount += 1;
      const concept = concepts.byId.get(row.conceptId);
      subjectCounts[concept.subject] += 1;
    } else if (row.conceptId !== null) {
      throw new Error(`${label}: fallback의 conceptId는 null이어야 합니다.`);
    }
  });

  const curriculumAssignedWords = matchModeCounts.direct + matchModeCounts.contextual;
  const fallbackWords = matchModeCounts.day_fallback + matchModeCounts.word_fallback;
  const actualMeanPerConcept = concepts.rows.length
    ? curriculumAssignedWords / concepts.rows.length
    : 0;
  const conceptRows = concepts.rows.map((concept) => conceptStats.get(concept.conceptId));
  return {
    schemaVersion: 1,
    totalWords: assignments.rows.length,
    curriculumAssignedWords,
    fallbackWords,
    actualMeanPerConcept,
    subjectCounts,
    matchModeCounts,
    concepts: conceptRows,
    unusedConceptIds: conceptRows.filter((row) => row.count === 0).map((row) => row.conceptId),
    lowUseConceptIds: conceptRows.filter((row) => row.count > 0 && row.count < actualMeanPerConcept * 0.5).map((row) => row.conceptId),
    overusedConceptIds: conceptRows.filter((row) => row.count > actualMeanPerConcept * 2).map((row) => row.conceptId),
    balanceReviewNotesKo: [],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP.trimStart());
    return;
  }
  const assignmentsPath = resolveCliPath(args.assignments, defaultPath("data", "concept_assignments.jsonl"));
  const conceptsPath = resolveCliPath(args.concepts, defaultPath("data", "concept_catalog.json"));
  const outputPath = resolveCliPath(args.out, defaultPath("data", "concept_usage.json"));
  const [assignments, concepts] = await Promise.all([
    loadAssignments(assignmentsPath),
    loadConceptCatalog(conceptsPath),
  ]);
  const usage = buildUsage(assignments, concepts);
  const text = `${JSON.stringify(usage, null, 2)}\n`;
  if (args.stdout) {
    process.stdout.write(text);
    return;
  }
  await writeAtomic(outputPath, text, Boolean(args.force));
  process.stdout.write(
    `PASS: ${usage.totalWords} rows; curriculum=${usage.curriculumAssignedWords}; fallback=${usage.fallbackWords}\n${outputPath}\n`,
  );
}

main().catch(printFailure);
