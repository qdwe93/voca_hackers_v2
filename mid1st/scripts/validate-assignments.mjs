#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CURRICULUM_MODES,
  MATCH_MODES,
  addError,
  defaultPath,
  loadAssignments,
  loadConceptCatalog,
  loadInventory,
  markdownCell,
  parseArgs,
  printFailure,
  readJson,
  resolveCliPath,
  strictKeys,
  wordIdFor,
} from "./lib.mjs";

const ASSIGNMENT_KEYS = [
  "wordId",
  "day",
  "no",
  "set",
  "word",
  "conceptId",
  "matchMode",
  "rationaleKo",
  "conceptCueKo",
  "confidence",
  "reviewRequired",
  "reviewReason",
];

const HELP = `
공통 교과 개념 배정 1,200행을 검증합니다.

사용법:
  node mid1st/scripts/validate-assignments.mjs [options]

옵션:
  --assignments <path>  기본: mid1st/data/concept_assignments.jsonl
  --inventory <path>    기본: mid1st/data/word_inventory.jsonl
  --concepts <path>     기본: mid1st/data/concept_catalog.json
  --usage <path>        기본: mid1st/data/concept_usage.json
  --no-usage-file       진단용: usage 파일 검증 생략(WARN)
  --expected <number>   기대 단어 수. 기본: 1200
  --report <path>       같은 결과를 Markdown으로 저장
  --help                도움말

분포 편차는 WARN만 발생시키며 종료 코드를 실패로 만들지 않습니다.
`;

function finitePositive(raw, fallback, name) {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name}은 0 이상의 숫자여야 합니다: ${raw}`);
  }
  return value;
}

function conceptLabel(concept) {
  const title = concept?.conceptKo || concept?.conceptEn || "(제목 없음)";
  return `${concept?.conceptId ?? "(ID 없음)"} · ${title}`;
}

function validateCatalog(concepts, errors) {
  const seen = new Set();
  concepts.forEach((concept, index) => {
    const label = `concept_catalog[${index}]`;
    addError(errors, concept && typeof concept === "object" && !Array.isArray(concept), `${label}: 객체여야 합니다.`);
    if (!concept || typeof concept !== "object" || Array.isArray(concept)) return;
    addError(errors, typeof concept.conceptId === "string" && concept.conceptId.trim().length > 0, `${label}: conceptId가 필요합니다.`);
    if (typeof concept.conceptId === "string") {
      if (seen.has(concept.conceptId)) errors.push(`${label}: 중복 conceptId ${concept.conceptId}`);
      seen.add(concept.conceptId);
    }
    addError(errors, typeof concept.subject === "string" && concept.subject.length > 0, `${label}: subject가 필요합니다.`);
  });
}

function validateInventory(inventory, expected, errors) {
  addError(errors, inventory.rows.length === expected, `word inventory 행 수가 ${expected}가 아닙니다: ${inventory.rows.length}`);
  const seen = new Set();
  inventory.rows.forEach((row, index) => {
    const label = `word_inventory line ${inventory.parsed[index].line}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`${label}: 객체여야 합니다.`);
      return;
    }
    for (const key of ["wordId", "day", "no", "set", "word", "meaningKo", "definition", "baselineSentence"]) {
      addError(errors, row[key] !== undefined && row[key] !== null, `${label}: ${key}가 필요합니다.`);
    }
    if (Number.isInteger(row.day) && Number.isInteger(row.no)) {
      addError(errors, row.wordId === wordIdFor(row.day, row.no), `${label}: wordId가 day/no와 다릅니다 (${row.wordId}).`);
      addError(errors, row.set === Math.ceil(row.no / 10), `${label}: set이 no와 다릅니다 (${row.set}).`);
    }
    if (seen.has(row.wordId)) errors.push(`${label}: 중복 wordId ${row.wordId}`);
    seen.add(row.wordId);
  });
}

function validateRows(assignments, inventory, concepts, expected, errors, warnings) {
  addError(errors, assignments.rows.length === expected, `assignment 행 수가 ${expected}가 아닙니다: ${assignments.rows.length}`);
  const seen = new Set();
  const usage = new Map(concepts.rows.map((concept) => [concept.conceptId, 0]));
  const directUsage = new Map(concepts.rows.map((concept) => [concept.conceptId, 0]));
  const contextualUsage = new Map(concepts.rows.map((concept) => [concept.conceptId, 0]));
  const modeCounts = new Map(MATCH_MODES.map((mode) => [mode, 0]));
  const confidenceCounts = new Map([["high", 0], ["medium", 0], ["low", 0]]);
  let reviewRequiredCount = 0;
  let orderMismatch = 0;

  assignments.rows.forEach((row, index) => {
    const line = assignments.parsed[index].line;
    const label = `assignments line ${line}`;
    if (!strictKeys(row, ASSIGNMENT_KEYS, label, errors)) return;

    const source = inventory.byId.get(row.wordId);
    addError(errors, Boolean(source), `${label}: inventory에 없는 wordId ${row.wordId}`);
    if (seen.has(row.wordId)) errors.push(`${label}: 중복 wordId ${row.wordId}`);
    seen.add(row.wordId);

    if (source) {
      for (const key of ["wordId", "day", "no", "set", "word"]) {
        addError(errors, row[key] === source[key], `${label}: 불변 필드 ${key}가 inventory와 다릅니다 (expected=${JSON.stringify(source[key])}, actual=${JSON.stringify(row[key])}).`);
      }
      if (inventory.rows[index]?.wordId !== row.wordId) orderMismatch += 1;
    }

    addError(errors, MATCH_MODES.includes(row.matchMode), `${label}: 잘못된 matchMode ${JSON.stringify(row.matchMode)}`);
    const curriculum = CURRICULUM_MODES.has(row.matchMode);
    if (curriculum) {
      addError(errors, typeof row.conceptId === "string" && row.conceptId.trim().length > 0, `${label}: ${row.matchMode}에는 primary conceptId 하나가 필요합니다.`);
      addError(errors, !Array.isArray(row.conceptId), `${label}: conceptId 배열은 허용되지 않습니다. primary concept 하나만 사용하세요.`);
      if (typeof row.conceptId === "string") {
        addError(errors, concepts.byId.has(row.conceptId), `${label}: catalog에 없는 conceptId ${row.conceptId}`);
        if (usage.has(row.conceptId)) {
          usage.set(row.conceptId, usage.get(row.conceptId) + 1);
          const modeUsage = row.matchMode === "direct" ? directUsage : contextualUsage;
          modeUsage.set(row.conceptId, modeUsage.get(row.conceptId) + 1);
        }
      }
    } else if (MATCH_MODES.includes(row.matchMode)) {
      addError(errors, row.conceptId === null, `${label}: ${row.matchMode}의 conceptId는 null이어야 합니다.`);
    }

    addError(errors, typeof row.rationaleKo === "string" && row.rationaleKo.trim().length > 0, `${label}: rationaleKo가 비어 있습니다.`);
    addError(errors, typeof row.conceptCueKo === "string" && row.conceptCueKo.trim().length > 0, `${label}: conceptCueKo가 비어 있습니다.`);
    addError(errors, ["high", "medium", "low"].includes(row.confidence), `${label}: confidence는 high|medium|low여야 합니다.`);
    addError(errors, typeof row.reviewRequired === "boolean", `${label}: reviewRequired는 boolean이어야 합니다.`);
    addError(errors, typeof row.reviewReason === "string", `${label}: reviewReason은 string이어야 합니다.`);
    if (row.reviewRequired === true) {
      addError(errors, typeof row.reviewReason === "string" && row.reviewReason.trim().length > 0, `${label}: reviewRequired=true이면 reviewReason이 필요합니다.`);
    }
    if (row.reviewRequired === false) {
      addError(errors, row.reviewReason === "", `${label}: reviewRequired=false이면 reviewReason은 빈 문자열이어야 합니다.`);
    }
    if (row.confidence === "low") {
      addError(errors, row.reviewRequired === true, `${label}: confidence=low이면 reviewRequired=true여야 합니다.`);
    }
    if (row.reviewRequired === true) reviewRequiredCount += 1;

    if (modeCounts.has(row.matchMode)) modeCounts.set(row.matchMode, modeCounts.get(row.matchMode) + 1);
    if (confidenceCounts.has(row.confidence)) confidenceCounts.set(row.confidence, confidenceCounts.get(row.confidence) + 1);
  });

  for (const row of inventory.rows) {
    if (!seen.has(row.wordId)) errors.push(`assignment 누락: ${row.wordId} ${row.word}`);
  }
  if (orderMismatch > 0) warnings.push(`assignment의 ${orderMismatch}행이 inventory 순서와 다릅니다. ID 완전성에는 영향이 없습니다.`);
  return { usage, directUsage, contextualUsage, modeCounts, confidenceCounts, reviewRequiredCount };
}

const USAGE_KEYS = [
  "schemaVersion",
  "totalWords",
  "curriculumAssignedWords",
  "fallbackWords",
  "actualMeanPerConcept",
  "subjectCounts",
  "matchModeCounts",
  "concepts",
  "unusedConceptIds",
  "lowUseConceptIds",
  "overusedConceptIds",
  "balanceReviewNotesKo",
];
const USAGE_CONCEPT_KEYS = ["conceptId", "count", "directCount", "contextualCount"];

function sameSet(actual, expected) {
  return actual.length === expected.length && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

function validateUsageFile(value, assignments, concepts, stats, errors) {
  if (!strictKeys(value, USAGE_KEYS, "concept_usage", errors)) return;
  const curriculumCount = [...stats.usage.values()].reduce((sum, count) => sum + count, 0);
  const fallbackCount = assignments.rows.length - curriculumCount;
  const mean = concepts.rows.length ? curriculumCount / concepts.rows.length : 0;
  if (value.schemaVersion !== 1) errors.push(`concept_usage: schemaVersion은 1이어야 합니다.`);
  if (value.totalWords !== assignments.rows.length) errors.push(`concept_usage: totalWords 불일치 (expected=${assignments.rows.length}, actual=${value.totalWords}).`);
  if (value.curriculumAssignedWords !== curriculumCount) errors.push(`concept_usage: curriculumAssignedWords 불일치 (expected=${curriculumCount}, actual=${value.curriculumAssignedWords}).`);
  if (value.fallbackWords !== fallbackCount) errors.push(`concept_usage: fallbackWords 불일치 (expected=${fallbackCount}, actual=${value.fallbackWords}).`);
  if (typeof value.actualMeanPerConcept !== "number" || Math.abs(value.actualMeanPerConcept - mean) > 0.01) {
    errors.push(`concept_usage: actualMeanPerConcept 불일치 (expected=${mean}, actual=${value.actualMeanPerConcept}).`);
  }

  const subjectNames = [...new Set(concepts.rows.map((concept) => concept.subject))].sort();
  if (!value.subjectCounts || typeof value.subjectCounts !== "object" || Array.isArray(value.subjectCounts)) {
    errors.push(`concept_usage: subjectCounts는 객체여야 합니다.`);
  } else {
    strictKeys(value.subjectCounts, subjectNames, "concept_usage.subjectCounts", errors);
    for (const subject of subjectNames) {
      const expectedCount = concepts.rows
        .filter((concept) => concept.subject === subject)
        .reduce((sum, concept) => sum + (stats.usage.get(concept.conceptId) ?? 0), 0);
      if (value.subjectCounts[subject] !== expectedCount) errors.push(`concept_usage.subjectCounts.${subject} 불일치 (expected=${expectedCount}, actual=${value.subjectCounts[subject]}).`);
    }
  }
  if (!value.matchModeCounts || typeof value.matchModeCounts !== "object" || Array.isArray(value.matchModeCounts)) {
    errors.push(`concept_usage: matchModeCounts는 객체여야 합니다.`);
  } else {
    strictKeys(value.matchModeCounts, MATCH_MODES, "concept_usage.matchModeCounts", errors);
    for (const mode of MATCH_MODES) {
      if (value.matchModeCounts[mode] !== (stats.modeCounts.get(mode) ?? 0)) errors.push(`concept_usage.matchModeCounts.${mode} 불일치 (expected=${stats.modeCounts.get(mode) ?? 0}, actual=${value.matchModeCounts[mode]}).`);
    }
  }

  if (!Array.isArray(value.concepts) || value.concepts.length !== concepts.rows.length) {
    errors.push(`concept_usage.concepts는 정확히 ${concepts.rows.length}개여야 합니다.`);
  } else {
    const usageById = new Map();
    value.concepts.forEach((row, index) => {
      const label = `concept_usage.concepts[${index}]`;
      if (!strictKeys(row, USAGE_CONCEPT_KEYS, label, errors)) return;
      if (usageById.has(row.conceptId)) errors.push(`${label}: 중복 conceptId ${row.conceptId}`);
      usageById.set(row.conceptId, row);
    });
    for (const concept of concepts.rows) {
      const row = usageById.get(concept.conceptId);
      if (!row) {
        errors.push(`concept_usage.concepts 누락: ${concept.conceptId}`);
        continue;
      }
      const expectedCount = stats.usage.get(concept.conceptId) ?? 0;
      const expectedDirect = stats.directUsage.get(concept.conceptId) ?? 0;
      const expectedContextual = stats.contextualUsage.get(concept.conceptId) ?? 0;
      if (row.count !== expectedCount) errors.push(`concept_usage ${concept.conceptId}: count 불일치 (expected=${expectedCount}, actual=${row.count}).`);
      if (row.directCount !== expectedDirect) errors.push(`concept_usage ${concept.conceptId}: directCount 불일치 (expected=${expectedDirect}, actual=${row.directCount}).`);
      if (row.contextualCount !== expectedContextual) errors.push(`concept_usage ${concept.conceptId}: contextualCount 불일치 (expected=${expectedContextual}, actual=${row.contextualCount}).`);
      if (row.count !== row.directCount + row.contextualCount) errors.push(`concept_usage ${concept.conceptId}: count는 directCount+contextualCount여야 합니다.`);
    }
  }

  const expectedUnused = concepts.rows.filter((concept) => (stats.usage.get(concept.conceptId) ?? 0) === 0).map((concept) => concept.conceptId);
  const expectedLow = concepts.rows.filter((concept) => {
    const count = stats.usage.get(concept.conceptId) ?? 0;
    return count > 0 && count < mean * 0.5;
  }).map((concept) => concept.conceptId);
  const expectedOver = concepts.rows.filter((concept) => (stats.usage.get(concept.conceptId) ?? 0) > mean * 2).map((concept) => concept.conceptId);
  for (const [key, expectedIds] of [["unusedConceptIds", expectedUnused], ["lowUseConceptIds", expectedLow], ["overusedConceptIds", expectedOver]]) {
    if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) errors.push(`concept_usage.${key}는 conceptId 문자열 배열이어야 합니다.`);
    else if (!sameSet(value[key], expectedIds)) errors.push(`concept_usage.${key}가 assignment 집계와 다릅니다.`);
  }
  if (!Array.isArray(value.balanceReviewNotesKo) || value.balanceReviewNotesKo.some((note) => typeof note !== "string")) {
    errors.push(`concept_usage.balanceReviewNotesKo는 문자열 배열이어야 합니다.`);
  }
}

function makeReport({ errors, warnings, assignments, inventory, concepts, usage, modeCounts, confidenceCounts, reviewRequiredCount, lowFactor, overFactor, usageFileChecked }) {
  const curriculumCount = [...usage.values()].reduce((sum, count) => sum + count, 0);
  const target = concepts.rows.length ? curriculumCount / concepts.rows.length : 0;
  const unused = concepts.rows.filter((concept) => (usage.get(concept.conceptId) ?? 0) === 0);
  const low = concepts.rows.filter((concept) => {
    const count = usage.get(concept.conceptId) ?? 0;
    return count > 0 && count < target * lowFactor;
  });
  const over = concepts.rows.filter((concept) => (usage.get(concept.conceptId) ?? 0) > target * overFactor);
  if (unused.length) warnings.push(`미사용 개념 ${unused.length}개`);
  if (low.length) warnings.push(`저사용 개념 ${low.length}개 (사용량 < target × ${lowFactor})`);
  if (over.length) warnings.push(`과다 사용 개념 ${over.length}개 (사용량 > target × ${overFactor})`);

  const subjectCounts = new Map();
  for (const concept of concepts.rows) {
    const subject = concept.subject ?? "unknown";
    subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + (usage.get(concept.conceptId) ?? 0));
  }

  const lines = [
    "# Assignment validation report",
    "",
    `- 상태: **${errors.length ? "FAIL" : "PASS"}**`,
    `- inventory: ${inventory.rows.length}`,
    `- assignments: ${assignments.rows.length}`,
    `- concepts: ${concepts.rows.length}`,
    `- concept_usage file: ${usageFileChecked ? "checked" : "skipped"}`,
    `- curriculum assignments: ${curriculumCount}`,
    `- reviewRequired: ${reviewRequiredCount}`,
    `- soft target per concept: ${target.toFixed(2)}`,
    "",
    "## Match mode",
    "",
    "| mode | count |",
    "|---|---:|",
    ...MATCH_MODES.map((mode) => `| ${mode} | ${modeCounts.get(mode) ?? 0} |`),
    "",
    "## Confidence",
    "",
    "| confidence | count |",
    "|---|---:|",
    ...["high", "medium", "low"].map((level) => `| ${level} | ${confidenceCounts.get(level) ?? 0} |`),
    "",
    "## Subject usage",
    "",
    "| subject | assignment count |",
    "|---|---:|",
    ...[...subjectCounts].sort().map(([subject, count]) => `| ${markdownCell(subject)} | ${count} |`),
    "",
    "## Distribution warnings (soft target)",
    "",
    `- unused: ${unused.length}`,
    `- low: ${low.length}`,
    `- overused: ${over.length}`,
  ];

  for (const [heading, rows] of [["Unused concepts", unused], ["Low-use concepts", low], ["Overused concepts", over]]) {
    lines.push("", `### ${heading}`, "", "| concept | subject | count |", "|---|---|---:|");
    if (!rows.length) lines.push("| — | — | 0 |");
    else {
      for (const concept of rows.sort((a, b) => (usage.get(a.conceptId) ?? 0) - (usage.get(b.conceptId) ?? 0) || a.conceptId.localeCompare(b.conceptId))) {
        lines.push(`| ${markdownCell(conceptLabel(concept))} | ${markdownCell(concept.subject)} | ${usage.get(concept.conceptId) ?? 0} |`);
      }
    }
  }

  lines.push("", "## Warnings", "");
  if (!warnings.length) lines.push("- 없음");
  else warnings.forEach((warning) => lines.push(`- WARN: ${warning}`));
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
  const expected = finitePositive(args.expected, 1200, "--expected");
  if (!Number.isInteger(expected)) throw new Error(`--expected는 정수여야 합니다: ${args.expected}`);
  const lowFactor = 0.5;
  const overFactor = 2;
  const inventoryPath = resolveCliPath(args.inventory, defaultPath("data", "word_inventory.jsonl"));
  const conceptsPath = resolveCliPath(args.concepts, defaultPath("data", "concept_catalog.json"));
  const assignmentsPath = resolveCliPath(args.assignments, defaultPath("data", "concept_assignments.jsonl"));
  const usagePath = resolveCliPath(args.usage, defaultPath("data", "concept_usage.json"));

  const [inventory, concepts, assignments, usageFile] = await Promise.all([
    loadInventory(inventoryPath),
    loadConceptCatalog(conceptsPath),
    loadAssignments(assignmentsPath),
    args["no-usage-file"] ? Promise.resolve(null) : readJson(usagePath),
  ]);
  const errors = [];
  const warnings = [];
  validateInventory(inventory, expected, errors);
  validateCatalog(concepts.rows, errors);
  const stats = validateRows(assignments, inventory, concepts, expected, errors, warnings);
  if (usageFile) validateUsageFile(usageFile, assignments, concepts, stats, errors);
  else warnings.push(`--no-usage-file로 concept_usage.json 검증을 생략했습니다.`);
  const report = makeReport({ errors, warnings, assignments, inventory, concepts, ...stats, lowFactor, overFactor, usageFileChecked: Boolean(usageFile) });
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
