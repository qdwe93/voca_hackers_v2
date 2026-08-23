import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  defaultPath,
  englishWords,
  listFilesRecursive,
  loadInventory,
  markdownCell,
  parseArgs,
  printFailure,
  strictKeys,
} from "./lib.mjs";

const INTERMEDIATE_KEYS = [
  "wordId",
  "word",
  "definitionOld",
  "definitionNew",
  "sentenceFit",
  "reviewRequired",
  "reviewReason",
];
const FINAL_KEYS = [
  "wordId",
  "word",
  "partOfSpeech",
  "meaningKo",
  "definitionOld",
  "definitionNew",
  "selectedFrom",
  "sentenceFit",
  "reviewRequired",
];
const VALID_FITS = new Set(["ok", "unclear", "mismatch"]);
const PROPER_NOUN_STARTS = new Set([
  "africa",
  "america",
  "antarctica",
  "asia",
  "australia",
  "christmas",
  "earth",
  "europe",
  "january",
  "korea",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const CLAUDE_SELECTIONS = new Set(`
DAY01-02 DAY01-04 DAY01-08 DAY01-14 DAY01-15 DAY01-17 DAY01-21 DAY01-22
DAY01-23 DAY01-24 DAY01-28 DAY02-03 DAY02-04 DAY02-07 DAY02-08 DAY02-12
DAY02-15 DAY02-17 DAY02-18 DAY02-20 DAY02-21 DAY02-31 DAY02-35 DAY02-40
DAY03-08 DAY03-19 DAY03-31 DAY03-33 DAY03-34 DAY04-02 DAY04-05 DAY04-15
DAY04-17 DAY04-21 DAY04-23 DAY04-24 DAY04-27 DAY04-31 DAY04-32 DAY04-39 DAY05-02
DAY05-03 DAY05-04 DAY05-09 DAY05-10 DAY05-15 DAY05-16 DAY05-18 DAY05-19
DAY05-25 DAY05-26 DAY05-28 DAY05-32 DAY05-33 DAY05-35 DAY05-36 DAY06-01
DAY06-06 DAY06-08 DAY06-09 DAY06-13 DAY06-14 DAY06-17 DAY06-19 DAY06-22
DAY06-24 DAY06-30 DAY06-33 DAY06-35 DAY06-36 DAY06-37 DAY06-38 DAY06-40
DAY07-01 DAY07-03 DAY07-04 DAY07-05 DAY07-06 DAY07-07 DAY07-09 DAY07-12
DAY07-13 DAY07-16 DAY07-17 DAY07-19 DAY07-29 DAY07-30 DAY07-32 DAY07-34
DAY07-35 DAY07-36 DAY07-40 DAY08-09 DAY08-10 DAY08-11 DAY08-16 DAY08-25
DAY09-02 DAY09-03 DAY09-04 DAY09-09 DAY09-14 DAY09-20 DAY09-27 DAY09-29
DAY09-35 DAY09-40 DAY10-03 DAY10-04 DAY10-07 DAY10-25 DAY10-30 DAY10-31
DAY10-34 DAY10-36 DAY10-38 DAY11-02 DAY11-03 DAY11-12 DAY11-18 DAY11-28
DAY11-37 DAY11-38 DAY12-03 DAY12-08 DAY12-11 DAY12-12 DAY12-16 DAY13-01
DAY13-05 DAY13-09 DAY13-11 DAY13-12 DAY13-15 DAY13-16 DAY26-32
`.trim().split(/\s+/));

const MANUAL_SELECTIONS = new Map([
  ["DAY03-14", {
    definitionNew: "a work of art made by hand",
    sentenceFit: "ok",
    reviewRequired: false,
    reason: "Claude는 활동 의미, Codex는 일반 결과물 의미에 치우쳐 공예 결과물이라는 뜻과 예문 용법을 함께 담도록 직접 다듬었다.",
  }],
  ["DAY13-29", {
    definitionNew: "a long story about made-up people",
    sentenceFit: "ok",
    reviewRequired: false,
    reason: "두 모델의 동일 정의가 하이픈 분리 기준 8단어여서 뜻을 유지한 7단어 정의로 고쳤다.",
  }],
  ["DAY18-32", {
    definitionNew: "to move with a steady pulse",
    sentenceFit: "ok",
    reviewRequired: false,
    reason: "두 후보 모두 심장이 규칙적으로 뛰는 자동사 용법을 자연스럽게 정의하지 못해 박동 의미로 직접 고쳤다.",
  }],
]);

function usage() {
  return "사용법: node mid1st/scripts/validate-definitions.mjs <대상파일|폴더> [--report <경로>]";
}

function doubleFinalConsonant(word) {
  if (!/^[a-z]+$/i.test(word) || word.length < 3) return null;
  const vowels = "aeiou";
  const a = word.at(-3).toLowerCase();
  const b = word.at(-2).toLowerCase();
  const c = word.at(-1).toLowerCase();
  if (
    !vowels.includes(a) &&
    vowels.includes(b) &&
    !vowels.includes(c) &&
    !"wxy".includes(c)
  ) {
    return `${word}${word.at(-1)}`;
  }
  return null;
}

function headwordForms(rawWord) {
  const word = String(rawWord ?? "").trim().toLowerCase();
  const forms = new Set(word ? [word] : []);
  if (!word || !/^[a-z]+$/.test(word)) return forms;

  forms.add(`${word}s`);
  forms.add(`${word}es`);
  forms.add(`${word}ed`);
  forms.add(`${word}d`);
  forms.add(`${word}ing`);
  forms.add(`${word}er`);
  forms.add(`${word}est`);
  forms.add(`${word}ly`);

  if (word.endsWith("e")) {
    const stem = word.slice(0, -1);
    forms.add(`${stem}ing`);
    forms.add(`${stem}ed`);
  }
  if (word.endsWith("ie")) {
    forms.add(`${word.slice(0, -2)}ying`);
  }
  if (word.endsWith("y") && word.length > 1 && !"aeiou".includes(word.at(-2))) {
    const stem = word.slice(0, -1);
    forms.add(`${stem}ies`);
    forms.add(`${stem}ied`);
    forms.add(`${stem}ier`);
    forms.add(`${stem}iest`);
    forms.add(`${stem}ily`);
  }
  const doubled = doubleFinalConsonant(word);
  if (doubled) {
    forms.add(`${doubled}ed`);
    forms.add(`${doubled}ing`);
    forms.add(`${doubled}er`);
    forms.add(`${doubled}est`);
  }
  return forms;
}

function containedHeadwordForm(definition, word) {
  const definitionTokens = englishWords(definition).map((item) => item.toLowerCase());
  const wordTokens = englishWords(word).map((item) => item.toLowerCase());
  if (wordTokens.length > 1) {
    const finalForms = headwordForms(wordTokens.at(-1));
    for (let index = 0; index <= definitionTokens.length - wordTokens.length; index += 1) {
      const prefixMatches = wordTokens
        .slice(0, -1)
        .every((token, offset) => definitionTokens[index + offset] === token);
      const finalToken = definitionTokens[index + wordTokens.length - 1];
      if (prefixMatches && finalForms.has(finalToken)) {
        return definitionTokens.slice(index, index + wordTokens.length).join("-");
      }
    }
    return null;
  }
  const tokens = new Set(definitionTokens);
  return [...headwordForms(wordTokens[0] ?? word)].find((form) => tokens.has(form)) ?? null;
}

function addViolation(violations, category, filePath, line, wordId, reason) {
  violations.push({ category, filePath, line, wordId: wordId || "-", reason });
}

async function loadTarget(targetPath) {
  const info = await stat(targetPath);
  const files = info.isDirectory()
    ? (await listFilesRecursive(targetPath)).filter((file) => /^chunk\d{2}\.jsonl$/i.test(path.basename(file)))
    : [targetPath];
  files.sort((left, right) => left.localeCompare(right, "en"));
  if (!files.length) throw new Error(`검사할 chunkNN.jsonl 파일이 없습니다: ${targetPath}`);

  const rows = [];
  for (const filePath of files) {
    const source = (await readFile(filePath, "utf8")).replace(/^\uFEFF/, "");
    const lines = source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].trim()) continue;
      try {
        rows.push({ value: JSON.parse(lines[index]), filePath, line: index + 1 });
      } catch (error) {
        rows.push({
          value: null,
          filePath,
          line: index + 1,
          parseError: error.message,
        });
      }
    }
  }
  return { files, rows };
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

function markdownReport(targetPath, rows, violations, warnings, categoryCounts, applied) {
  const result = violations.length ? "FAIL" : "PASS";
  const lines = [
    "# 정의 검증 보고서",
    "",
    `- 대상: \`${relative(targetPath)}\``,
    `- 결과: **${result}**`,
    `- 기준: ${applied ? "반영 후(definitionNew = final_sentences.definition)" : "반영 전(definitionOld = final_sentences.definition)"}`,
    `- 유효 행: ${rows.filter((row) => row.value).length}/1,200`,
    `- 위반: ${violations.length}건`,
    `- 경고: ${warnings.length}건`,
    "",
    "## 항목별 위반 수",
    "",
    "| 항목 | 수 |",
    "|---|---:|",
  ];
  for (const [category, count] of [...categoryCounts.entries()].sort()) {
    lines.push(`| ${category} | ${count} |`);
  }
  if (!categoryCounts.size) lines.push("| 없음 | 0 |");

  lines.push("", "## 위반 목록", "");
  if (!violations.length) lines.push("없음");
  else {
    lines.push("| 파일 | 줄 | wordId | 항목 | 사유 |", "|---|---:|---|---|---|");
    for (const item of violations) {
      lines.push(
        `| ${relative(item.filePath)} | ${item.line} | ${item.wordId} | ${item.category} | ${item.reason.replaceAll("|", "\\|")} |`,
      );
    }
  }

  lines.push("", "## 경고", "");
  if (!warnings.length) lines.push("없음");
  else {
    lines.push("| 파일 | 줄 | wordId | 사유 |", "|---|---:|---|---|");
    for (const item of warnings) {
      lines.push(`| ${relative(item.filePath)} | ${item.line} | ${item.wordId} | ${item.reason} |`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function loadLane(lane) {
  const { rows } = await loadTarget(path.resolve("tmp", "defs", lane));
  if (rows.length !== 1200 || rows.some((row) => !row.value)) {
    throw new Error(`${lane} 후보는 파싱 가능한 1,200줄이어야 합니다.`);
  }
  return rows.map((row) => row.value);
}

function candidateViolationSummary(rows, baselineRows) {
  const counts = new Map([
    ["행 수", rows.length === 1200 ? 0 : 1],
    ["키", 0],
    ["순서", 0],
    ["기존 정의", 0],
    ["새 정의 단어 수", 0],
    ["표제어 포함", 0],
    ["마침표", 0],
    ["첫 글자", 0],
    ["sentenceFit", 0],
    ["reviewRequired/reviewReason", 0],
  ]);
  const bump = (key) => counts.set(key, counts.get(key) + 1);
  for (let index = 0; index < rows.length; index += 1) {
    const value = rows[index];
    const expected = baselineRows[index];
    const keyErrors = [];
    strictKeys(value, INTERMEDIATE_KEYS, `${index + 1}`, keyErrors);
    if (keyErrors.length) counts.set("키", counts.get("키") + keyErrors.length);
    if (!expected || value.wordId !== expected.wordId || value.word !== expected.word) bump("순서");
    if (!expected || value.definitionOld !== expected.definition) bump("기존 정의");
    const definition = typeof value.definitionNew === "string" ? value.definitionNew : "";
    const wordCount = englishWords(definition).length;
    if (wordCount < 1 || wordCount > 7) bump("새 정의 단어 수");
    if (containedHeadwordForm(definition, expected?.word ?? value.word)) bump("표제어 포함");
    if (/\.\s*$/.test(definition)) bump("마침표");
    const first = definition.match(/[A-Za-z]/)?.[0];
    if (first && first !== first.toLowerCase()) bump("첫 글자");
    if (!VALID_FITS.has(value.sentenceFit)) bump("sentenceFit");
    if (
      typeof value.reviewRequired !== "boolean" ||
      (value.reviewRequired && !(typeof value.reviewReason === "string" && value.reviewReason.trim()))
    ) bump("reviewRequired/reviewReason");
  }
  return counts;
}

function definitionsTable(finalRows, baselineRows) {
  const lines = ["# 쉬운 영영 정의 v2", ""];
  let previousGroup = "";
  for (let index = 0; index < finalRows.length; index += 1) {
    const row = finalRows[index];
    const baseline = baselineRows[index];
    const group = `${baseline.day}-${baseline.set}`;
    if (group !== previousGroup) {
      if (previousGroup) lines.push("");
      lines.push(
        `## DAY ${String(baseline.day).padStart(2, "0")} · 세트 ${baseline.set}`,
        "",
        "| # | 단어 | 품사 | 뜻 | 기존 정의 | 새 정의 | 예문 | 출처 |",
        "|---:|---|---|---|---|---|---|---|",
      );
      previousGroup = group;
    }
    lines.push(
      `| ${baseline.no} | ${markdownCell(row.word)} | ${markdownCell(row.partOfSpeech)} | ${markdownCell(row.meaningKo)} | ${markdownCell(row.definitionOld)} | ${markdownCell(row.definitionNew)} | ${markdownCell(baseline.sentence)} | ${row.selectedFrom} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

function reviewReport(finalRows, baselineRows, claudeRows, codexRows, laneSummaries) {
  const sourceCounts = Object.fromEntries(["claude", "codex", "both", "manual"].map((key) => [key, 0]));
  const fitCounts = Object.fromEntries(["ok", "unclear", "mismatch"].map((key) => [key, 0]));
  let changed = 0;
  let totalWords = 0;
  let maximumWords = 0;
  let reviewRequired = 0;
  for (const row of finalRows) {
    sourceCounts[row.selectedFrom] += 1;
    fitCounts[row.sentenceFit] += 1;
    if (row.definitionNew !== row.definitionOld) changed += 1;
    const count = englishWords(row.definitionNew).length;
    totalWords += count;
    maximumWords = Math.max(maximumWords, count);
    if (row.reviewRequired) reviewRequired += 1;
  }
  const unchanged = finalRows.length - changed;
  const lines = [
    "# 정의 병합 검토 보고서",
    "",
    "## 요약",
    "",
    "### 두 모델 기계 검증 위반",
    "",
    "| 항목 | Claude | Codex |",
    "|---|---:|---:|",
  ];
  for (const category of laneSummaries.claude.keys()) {
    lines.push(`| ${category} | ${laneSummaries.claude.get(category)} | ${laneSummaries.codex.get(category)} |`);
  }
  lines.push(
    "",
    `- selectedFrom: claude ${sourceCounts.claude} / codex ${sourceCounts.codex} / both ${sourceCounts.both} / manual ${sourceCounts.manual}`,
    `- 정의 변경: ${changed} / 원문 유지: ${unchanged}`,
    `- 새 정의 평균 단어 수: ${(totalWords / finalRows.length).toFixed(2)} / 최대: ${maximumWords}`,
    `- sentenceFit: ok ${fitCounts.ok} / unclear ${fitCounts.unclear} / mismatch ${fitCounts.mismatch}`,
    `- reviewRequired: ${reviewRequired}`,
    "",
    "## 검토 대상",
    "",
  );
  const flagged = finalRows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.sentenceFit !== "ok" || row.reviewRequired || row.selectedFrom === "manual");
  if (!flagged.length) {
    lines.push("없음");
  } else {
    lines.push(
      "| wordId | 단어 | 품사 | 뜻 | 예문 | 기존 정의 | Claude 정의 | Codex 정의 | 최종 정의 | 구분 | 판정 이유 |",
      "|---|---|---|---|---|---|---|---|---|---|---|",
    );
    for (const { row, index } of flagged) {
      const baseline = baselineRows[index];
      const manual = MANUAL_SELECTIONS.get(row.wordId);
      const flags = [
        row.sentenceFit !== "ok" ? `sentenceFit=${row.sentenceFit}` : null,
        row.reviewRequired ? "reviewRequired" : null,
        row.selectedFrom === "manual" ? "manual" : null,
      ].filter(Boolean).join(", ");
      lines.push(
        `| ${row.wordId} | ${markdownCell(row.word)} | ${markdownCell(row.partOfSpeech)} | ${markdownCell(row.meaningKo)} | ${markdownCell(baseline.sentence)} | ${markdownCell(row.definitionOld)} | ${markdownCell(claudeRows[index].definitionNew)} | ${markdownCell(codexRows[index].definitionNew)} | ${markdownCell(row.definitionNew)} | ${flags} | ${markdownCell(manual?.reason ?? "새 정의와 확정 예문의 의미를 직접 대조했다.")} |`,
      );
    }
  }
  return {
    text: `${lines.join("\n")}\n`,
    stats: { sourceCounts, fitCounts, changed, unchanged, averageWords: totalWords / finalRows.length, maximumWords, reviewRequired },
  };
}

async function finalizeDefinitions() {
  const finalPath = defaultPath("final", "definitions_v2.jsonl");
  if (await pathExists(finalPath)) {
    throw new Error(`기존 definitions_v2.jsonl을 덮어쓰지 않습니다: ${finalPath}`);
  }
  const markdownPath = defaultPath("final", "definitions_v2.md");
  const reviewPath = defaultPath("reports", "definition-review.md");
  const baseline = await loadInventory(defaultPath("final", "final_sentences.jsonl"));
  if (baseline.rows.length !== 1200) throw new Error(`기준 파일이 1,200줄이 아닙니다: ${baseline.rows.length}`);
  const claudeRows = await loadLane("claude");
  const codexRows = await loadLane("codex");

  const differingIds = new Set();
  for (let index = 0; index < 1200; index += 1) {
    if (claudeRows[index].definitionNew.trim() !== codexRows[index].definitionNew.trim()) {
      differingIds.add(baseline.rows[index].wordId);
    }
  }
  for (const wordId of CLAUDE_SELECTIONS) {
    if (!differingIds.has(wordId)) throw new Error(`Claude 선택표의 wordId가 차이 후보가 아닙니다: ${wordId}`);
  }

  const finalRows = baseline.rows.map((base, index) => {
    const claude = claudeRows[index];
    const codex = codexRows[index];
    if (claude.wordId !== base.wordId || codex.wordId !== base.wordId) {
      throw new Error(`후보 순서 불일치: ${base.wordId}`);
    }
    const manual = MANUAL_SELECTIONS.get(base.wordId);
    let definitionNew;
    let selectedFrom;
    let sentenceFit = "ok";
    let reviewRequired = false;
    if (manual) {
      definitionNew = manual.definitionNew;
      selectedFrom = "manual";
      sentenceFit = manual.sentenceFit;
      reviewRequired = manual.reviewRequired;
    } else if (claude.definitionNew.trim() === codex.definitionNew.trim()) {
      definitionNew = claude.definitionNew.trim();
      selectedFrom = "both";
    } else if (CLAUDE_SELECTIONS.has(base.wordId)) {
      definitionNew = claude.definitionNew.trim();
      selectedFrom = "claude";
    } else {
      definitionNew = codex.definitionNew.trim();
      selectedFrom = "codex";
    }
    return {
      wordId: base.wordId,
      word: base.word,
      partOfSpeech: base.partOfSpeech,
      meaningKo: base.meaningKo,
      definitionOld: base.definition,
      definitionNew,
      selectedFrom,
      sentenceFit,
      reviewRequired,
    };
  });

  const laneSummaries = {
    claude: candidateViolationSummary(claudeRows, baseline.rows),
    codex: candidateViolationSummary(codexRows, baseline.rows),
  };
  const review = reviewReport(finalRows, baseline.rows, claudeRows, codexRows, laneSummaries);
  await writeFile(finalPath, `${finalRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  await writeFile(markdownPath, definitionsTable(finalRows, baseline.rows), "utf8");
  await writeFile(reviewPath, review.text, "utf8");
  process.stdout.write(`CREATED: ${relative(finalPath)}\nCREATED: ${relative(markdownPath)}\nCREATED: ${relative(reviewPath)}\n`);
  process.stdout.write(`${JSON.stringify(review.stats)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.finalize) {
    await finalizeDefinitions();
    return;
  }
  if (args._.length !== 1) throw new Error(usage());
  const targetPath = path.resolve(args._[0]);
  const applied = Boolean(args.applied);
  const baselinePath = defaultPath("final", "final_sentences.jsonl");
  const baseline = await loadInventory(baselinePath);
  const { rows } = await loadTarget(targetPath);
  const violations = [];
  const warnings = [];
  const categoryCounts = new Map();

  const record = (category, row, wordId, reason) => {
    addViolation(violations, category, row.filePath, row.line, wordId, reason);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  };

  if (rows.length !== 1200) {
    const synthetic = rows[0] ?? { filePath: targetPath, line: 0 };
    record("행 수", synthetic, "-", `정확히 1,200줄이어야 하나 ${rows.length}줄입니다.`);
  }

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const expected = baseline.rows[index];
    if (!row.value) {
      record("JSON", row, "-", `JSON 파싱 실패: ${row.parseError}`);
      continue;
    }
    const value = row.value;
    const wordId = value.wordId;
    const isFinal = Object.hasOwn(value, "selectedFrom") || Object.hasOwn(value, "partOfSpeech");
    const keyErrors = [];
    strictKeys(value, isFinal ? FINAL_KEYS : INTERMEDIATE_KEYS, `${relative(row.filePath)}:${row.line}`, keyErrors);
    for (const reason of keyErrors) record("키", row, wordId, reason);

    if (!expected || wordId !== expected.wordId) {
      record("순서", row, wordId, `기준 wordId ${expected?.wordId ?? "(없음)"}와 일치하지 않습니다.`);
    }
    if (expected && value.word !== expected.word) {
      record("단어", row, wordId, `word가 기준값 ${expected.word}와 일치하지 않습니다.`);
    }
    if (expected && isFinal && applied) {
      if (value.definitionNew !== expected.definition) {
        record("적용 정의", row, wordId, "definitionNew가 반영된 확정 definition과 일치하지 않습니다.");
      }
    } else if (expected && value.definitionOld !== expected.definition) {
      record("기존 정의", row, wordId, "definitionOld가 확정 definition과 일치하지 않습니다.");
    }
    if (isFinal && expected) {
      if (value.partOfSpeech !== expected.partOfSpeech) {
        record("품사", row, wordId, "partOfSpeech가 확정값과 일치하지 않습니다.");
      }
      if (value.meaningKo !== expected.meaningKo) {
        record("한국어 뜻", row, wordId, "meaningKo가 확정값과 일치하지 않습니다.");
      }
      if (!new Set(["claude", "codex", "both", "manual"]).has(value.selectedFrom)) {
        record("출처", row, wordId, `허용되지 않은 selectedFrom: ${value.selectedFrom}`);
      }
    }

    const definition = typeof value.definitionNew === "string" ? value.definitionNew : "";
    const wordCount = englishWords(definition).length;
    if (wordCount < 1 || wordCount > 7) {
      record("새 정의 단어 수", row, wordId, `definitionNew가 ${wordCount}단어입니다(허용 1~7).`);
    }
    const forbidden = containedHeadwordForm(definition, expected?.word ?? value.word);
    if (forbidden) {
      record("표제어 포함", row, wordId, `definitionNew에 표제어 변화형 '${forbidden}'이 있습니다.`);
    }
    if (/\.\s*$/.test(definition)) {
      record("마침표", row, wordId, "definitionNew가 마침표로 끝납니다.");
    }
    const firstLetter = definition.match(/[A-Za-z]/)?.[0];
    if (firstLetter && firstLetter !== firstLetter.toLowerCase()) {
      const firstWord = englishWords(definition)[0]?.toLowerCase();
      if (PROPER_NOUN_STARTS.has(firstWord)) {
        warnings.push({ filePath: row.filePath, line: row.line, wordId, reason: `고유명사 '${englishWords(definition)[0]}'로 시작합니다.` });
      } else {
        record("첫 글자", row, wordId, "definitionNew의 첫 영문자가 소문자가 아닙니다.");
      }
    }
    if (!VALID_FITS.has(value.sentenceFit)) {
      record("sentenceFit", row, wordId, `허용되지 않은 값: ${value.sentenceFit}`);
    }
    if (typeof value.reviewRequired !== "boolean") {
      record("reviewRequired", row, wordId, "reviewRequired는 boolean이어야 합니다.");
    }
    if (!isFinal && value.reviewRequired === true && !(typeof value.reviewReason === "string" && value.reviewReason.trim())) {
      record("reviewReason", row, wordId, "reviewRequired가 true인데 reviewReason이 비어 있습니다.");
    }
  }

  const report = markdownReport(targetPath, rows, violations, warnings, categoryCounts, applied);
  if (args.report) await writeFile(path.resolve(String(args.report)), report, "utf8");

  process.stdout.write(`${violations.length ? "FAIL" : "PASS"}: ${relative(targetPath)} — ${rows.length}/1200줄, 위반 ${violations.length}건, 경고 ${warnings.length}건\n`);
  for (const [category, count] of [...categoryCounts.entries()].sort()) {
    process.stdout.write(`- ${category}: ${count}\n`);
  }
  for (const item of violations) {
    process.stdout.write(`  ${relative(item.filePath)}:${item.line} ${item.wordId} [${item.category}] ${item.reason}\n`);
  }
  if (violations.length) process.exitCode = 1;
}

main().catch(printFailure);
