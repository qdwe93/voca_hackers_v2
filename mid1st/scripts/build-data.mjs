import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "../..");
const MID1ST_ROOT = path.join(PROJECT_ROOT, "mid1st");
const DATA_DIR = path.join(MID1ST_ROOT, "data");
const SETS_DIR = path.join(DATA_DIR, "sets");
const FINAL_DIR = path.join(PROJECT_ROOT, "content", "candidates", "final");
const CONTENT_ENG_ROOT = path.resolve(
  process.env.MID1ST_CONTENT_ENG ??
    "C:/Workspaces/junbe_study/middle_1st/content_eng",
);

const SUBJECTS = [
  {
    id: "korean",
    prefix: "KOR",
    ko: "국어",
    en: "Korean Language Arts",
    gradeScope: "middle-school-years-1-3",
    expectedCount: 35,
  },
  {
    id: "mathematics",
    prefix: "MATH",
    ko: "수학",
    en: "Mathematics",
    gradeScope: "grade-7",
    expectedCount: 34,
  },
  {
    id: "science",
    prefix: "SCI",
    ko: "과학",
    en: "Science",
    gradeScope: "grade-7",
    expectedCount: 45,
  },
  {
    id: "social_studies",
    prefix: "SOC",
    ko: "사회",
    en: "Social Studies",
    gradeScope: "grade-7",
    expectedCount: 39,
  },
];

const SOURCE_CONTENTS = new Map();

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function readSource(filePath, logicalPath) {
  const content = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  SOURCE_CONTENTS.set(logicalPath, content);
  return content;
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  assert(!quoted, "hackers.csv has an unterminated quoted field");
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

function collectWordFiles(directory) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...collectWordFiles(absolutePath));
    if (entry.isFile() && entry.name === "words.json") results.push(absolutePath);
  }
  return results;
}

function parsePartDayTable() {
  const filePath = path.join(PROJECT_ROOT, "part_day_table.md");
  const markdown = readSource(filePath, "part_day_table.md");
  const rows = new Map();
  const rowPattern =
    /^\|\s*PART\s+(\d+)\s*\|\s*([^|]+?)\s*\|\s*DAY\s+(\d+)\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*$/gm;
  for (const match of markdown.matchAll(rowPattern)) {
    const day = Number(match[3]);
    assert(!rows.has(day), `Duplicate DAY ${pad2(day)} in part_day_table.md`);
    rows.set(day, {
      part: Number(match[1]),
      partTopic: match[2].trim(),
      dayTopic: match[4].trim(),
      startPage: Number(match[5]),
    });
  }
  assert(rows.size === 30, `Expected 30 PART/DAY rows, found ${rows.size}`);
  for (let day = 1; day <= 30; day += 1) {
    assert(rows.has(day), `part_day_table.md is missing DAY ${pad2(day)}`);
  }
  return rows;
}

function parseHackersCsv() {
  const filePath = path.join(PROJECT_ROOT, "hackers.csv");
  const rows = parseCsv(readSource(filePath, "hackers.csv"));
  assert(rows.length > 1, "hackers.csv is empty");
  const headers = rows[0].map((value) => value.trim());
  const dayIndex = headers.indexOf("DAY");
  const noIndex = headers.indexOf("no.");
  const wordIndex = headers.indexOf("단어");
  assert(dayIndex >= 0 && noIndex >= 0 && wordIndex >= 0, "Unexpected hackers.csv headers");

  const byId = new Map();
  for (const row of rows.slice(1)) {
    const dayMatch = row[dayIndex]?.trim().match(/^DAY\s+(\d{2})$/);
    assert(dayMatch, `Invalid DAY value in hackers.csv: ${row[dayIndex]}`);
    const day = Number(dayMatch[1]);
    const no = Number(row[noIndex]);
    const word = row[wordIndex]?.trim();
    assert(Number.isInteger(no) && no >= 1 && no <= 40, `Invalid no. in hackers.csv: ${row[noIndex]}`);
    assert(word, `Missing word for DAY ${pad2(day)} no. ${no}`);
    const wordId = `DAY${pad2(day)}-${pad2(no)}`;
    assert(!byId.has(wordId), `Duplicate CSV wordId ${wordId}`);
    byId.set(wordId, word);
  }
  assert(byId.size === 1200, `Expected 1,200 CSV words, found ${byId.size}`);
  return byId;
}

function buildWordInventory(partDays, csvWords) {
  const wordFiles = collectWordFiles(FINAL_DIR);
  assert(wordFiles.length === 120, `Expected 120 final words.json files, found ${wordFiles.length}`);

  const parsedFiles = wordFiles.map((filePath) => {
    const relativePath = slash(path.relative(PROJECT_ROOT, filePath));
    const directoryName = path.basename(path.dirname(filePath));
    const match = directoryName.match(/^DAY(\d{2})_(\d{2})-(\d{2})_set(\d+)$/);
    assert(match, `Unexpected final set directory: ${directoryName}`);
    const raw = readSource(filePath, relativePath);
    return {
      filePath,
      relativePath,
      directoryName,
      fileDay: Number(match[1]),
      rangeStart: Number(match[2]),
      rangeEnd: Number(match[3]),
      fileSet: Number(match[4]),
      data: JSON.parse(raw),
    };
  });
  parsedFiles.sort((a, b) => a.fileDay - b.fileDay || a.fileSet - b.fileSet);

  const inventory = [];
  const setKeys = new Set();
  for (const source of parsedFiles) {
    const { data } = source;
    const expectedStart = (source.fileSet - 1) * 10 + 1;
    const expectedEnd = source.fileSet * 10;
    assert(source.fileDay >= 1 && source.fileDay <= 30, `Invalid day in ${source.directoryName}`);
    assert(source.fileSet >= 1 && source.fileSet <= 4, `Invalid set in ${source.directoryName}`);
    assert(
      source.rangeStart === expectedStart && source.rangeEnd === expectedEnd,
      `Filename range does not match set in ${source.directoryName}`,
    );
    assert(data.day === source.fileDay, `JSON day mismatch in ${source.relativePath}`);
    assert(data.set === source.fileSet, `JSON set mismatch in ${source.relativePath}`);
    assert(Array.isArray(data.words) && data.words.length === 10, `Expected 10 words in ${source.relativePath}`);
    const setKey = `${source.fileDay}:${source.fileSet}`;
    assert(!setKeys.has(setKey), `Duplicate final set ${setKey}`);
    setKeys.add(setKey);

    const topics = partDays.get(source.fileDay);
    assert(topics, `No PART/DAY topic for DAY ${pad2(source.fileDay)}`);
    data.words.forEach((entry, index) => {
      const expectedNo = expectedStart + index;
      assert(entry.no === expectedNo, `Unexpected word number in ${source.relativePath}: ${entry.no}`);
      for (const field of ["word", "partOfSpeech", "meaningKo", "ipa", "definition", "sentence"]) {
        assert(typeof entry[field] === "string" && entry[field].trim(), `Missing ${field} in ${source.relativePath} no. ${entry.no}`);
      }
      const wordId = `DAY${pad2(source.fileDay)}-${pad2(entry.no)}`;
      assert(csvWords.has(wordId), `${wordId} is missing from hackers.csv`);
      assert(
        csvWords.get(wordId) === entry.word,
        `${wordId} word mismatch: hackers.csv=${csvWords.get(wordId)}, final=${entry.word}`,
      );
      inventory.push({
        wordId,
        day: source.fileDay,
        no: entry.no,
        set: source.fileSet,
        word: entry.word,
        part: topics.part,
        partTopic: topics.partTopic,
        dayTopic: topics.dayTopic,
        partOfSpeech: entry.partOfSpeech,
        meaningKo: entry.meaningKo,
        ipa: entry.ipa,
        definition: entry.definition,
        baselineSentence: entry.sentence,
        sourcePath: source.relativePath,
      });
    });
  }

  const inventoryIds = new Set(inventory.map((entry) => entry.wordId));
  assert(inventory.length === 1200, `Expected 1,200 inventory rows, found ${inventory.length}`);
  assert(inventoryIds.size === 1200, `Expected 1,200 unique wordIds, found ${inventoryIds.size}`);
  assert(setKeys.size === 120, `Expected 120 unique sets, found ${setKeys.size}`);
  for (const csvId of csvWords.keys()) assert(inventoryIds.has(csvId), `${csvId} exists only in hackers.csv`);
  for (let day = 1; day <= 30; day += 1) {
    assert(inventory.filter((entry) => entry.day === day).length === 40, `DAY ${pad2(day)} does not contain 40 words`);
  }
  return inventory;
}

function splitBilingualHeading(rawHeading) {
  const heading = rawHeading.trim().replace(/^\d+\.\s*/, "");
  for (const separator of [/\s+\|\s+/, /\s+\/\s+/]) {
    const parts = heading.split(separator);
    if (parts.length >= 2) return { ko: parts[0].trim(), en: parts.slice(1).join(" | ").trim() };
  }
  const mixed = heading.match(/^(.+?[가-힣])\s+([A-Z][A-Za-z\s&-]+)$/);
  if (mixed) return { ko: mixed[1].trim(), en: mixed[2].trim() };
  return { ko: heading, en: heading };
}

function cleanMarkdownInline(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionBody(markdown, headingPattern) {
  const lines = markdown.split(/\r?\n/);
  let collecting = false;
  const result = [];
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (collecting) break;
      if (headingPattern.test(line.replace(/^##\s+/, "").trim())) {
        collecting = true;
      }
      continue;
    }
    if (collecting) result.push(line);
  }
  return result.join("\n").trim();
}

function firstParagraph(value) {
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => cleanMarkdownInline(paragraph))
    .find((paragraph) => paragraph && !paragraph.startsWith("#")) ?? "";
}

function extractConceptSummary(markdown) {
  const definition = sectionBody(markdown, /^Definition$/i);
  if (definition) return firstParagraph(definition);

  const body = markdown
    .replace(/^#\s+.+\r?\n/, "")
    .replace(/^\*\*Labels:\*\*.*\r?\n?/im, "")
    .trim();
  return firstParagraph(body);
}

function extractGradeContext(markdown) {
  const section = sectionBody(markdown, /^(Grade 7 Context|Middle-school context)$/i);
  if (section) return firstParagraph(section);

  const inline = markdown.match(/\*\*Grade-7 connection\.\*\*\s*([^\n]+(?:\n(?!\n|##)[^\n]+)*)/i);
  if (inline) return cleanMarkdownInline(inline[1]);

  const paragraphs = markdown.split(/\r?\n\s*\r?\n/);
  const gradeParagraph = paragraphs.find((paragraph) =>
    /\bGrade 7\b|first-year classroom|middle-school|\bstudents?\b/i.test(paragraph),
  );
  return gradeParagraph ? cleanMarkdownInline(gradeParagraph) : "";
}

function extractRelatedTerms(markdown) {
  let body = sectionBody(markdown, /^Related Terms$/i);
  if (!body) {
    const inline = markdown.match(/\*\*Related terms:\*\*\s*([^\n]+)/i);
    if (inline) body = inline[1];
  }
  assert(body, "Concept document has no Related Terms content");
  const normalized = cleanMarkdownInline(body)
    .replace(/\.\s*$/, "")
    .replace(/,\s+and\s+/gi, ", ");
  const terms = normalized
    .split(/\s*[,;]\s*/)
    .map((term) => term.replace(/^and\s+/i, "").trim())
    .filter(Boolean);
  return [...new Set(terms)];
}

function parseConceptIndex(subject) {
  const subjectDir = path.join(CONTENT_ENG_ROOT, subject.id);
  const indexPath = path.join(subjectDir, "keywords.md");
  assert(existsSync(indexPath), `Missing ${subject.id}/keywords.md`);
  const indexLogicalPath = `${subject.id}/keywords.md`;
  const markdown = readSource(indexPath, indexLogicalPath);
  const lines = markdown.split(/\r?\n/);
  const concepts = [];
  let domain = null;
  let unit = null;

  function setDomain(rawHeading) {
    if (/교육과정 개요|Curriculum Overview|범위와 구성|Scope and Organization|근거|Sources/i.test(rawHeading)) {
      domain = null;
      unit = null;
      return;
    }
    domain = splitBilingualHeading(rawHeading);
    unit = null;
  }

  function addConcept(conceptKo, conceptEn, linkedPath) {
    if (!domain) return;
    const normalizedLink = linkedPath.replace(/^\.\//, "").replace(/\\/g, "/");
    assert(!normalizedLink.includes(".."), `Concept link escapes subject directory: ${linkedPath}`);
    const sourcePath = `${subject.id}/${normalizedLink}`;
    const absolutePath = path.join(subjectDir, ...normalizedLink.split("/"));
    assert(existsSync(absolutePath) && statSync(absolutePath).isFile(), `Missing concept page ${sourcePath}`);
    const sourceMarkdown = readSource(absolutePath, sourcePath);
    const slug = path.posix.basename(normalizedLink, ".md");
    const resolvedUnit = unit ?? domain;
    concepts.push({
      conceptId: `${subject.prefix}-${slug}`,
      subject: subject.id,
      subjectKo: subject.ko,
      subjectEn: subject.en,
      domain: domain.ko,
      domainEn: domain.en,
      unit: resolvedUnit.ko,
      unitEn: resolvedUnit.en,
      unitInheritedFromDomain: unit === null,
      conceptKo: conceptKo.trim(),
      conceptEn: conceptEn.trim(),
      sourcePath,
      relatedTerms: extractRelatedTerms(sourceMarkdown),
      gradeScope: subject.gradeScope,
      definitionSummary: extractConceptSummary(sourceMarkdown),
      gradeContext: extractGradeContext(sourceMarkdown),
    });
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      setDomain(h2[1]);
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      if (domain) unit = splitBilingualHeading(h3[1]);
      continue;
    }
    if (!domain) continue;

    const tableRow = line.match(
      /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*\[[^\]]+\]\(([^)]+\.md)\)\s*\|\s*$/,
    );
    if (tableRow && tableRow[1] !== "한국어") {
      addConcept(tableRow[1], tableRow[2], tableRow[3]);
      continue;
    }

    const bullet = line.match(/^-\s*\[([^\]]+)\]\(([^)]+\.md)\)\s*$/);
    if (bullet) {
      const label = splitBilingualHeading(bullet[1]);
      addConcept(label.ko, label.en, bullet[2]);
    }
  }

  assert(
    concepts.length === subject.expectedCount,
    `${subject.id}: expected ${subject.expectedCount} indexed concepts, found ${concepts.length}`,
  );
  const linkedFiles = new Set(concepts.map((concept) => concept.sourcePath));
  assert(linkedFiles.size === concepts.length, `${subject.id}: duplicate concept page link in keywords.md`);
  const actualFiles = readdirSync(subjectDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "keywords.md")
    .map((entry) => `${subject.id}/${entry.name}`);
  assert(
    actualFiles.length === subject.expectedCount,
    `${subject.id}: expected ${subject.expectedCount} concept files, found ${actualFiles.length}`,
  );
  for (const sourcePath of actualFiles) {
    assert(linkedFiles.has(sourcePath), `${sourcePath} is not linked from keywords.md`);
  }
  return concepts;
}

function buildConceptCatalog() {
  assert(existsSync(CONTENT_ENG_ROOT), `Missing curriculum reference root: ${CONTENT_ENG_ROOT}`);
  const catalog = SUBJECTS.flatMap(parseConceptIndex);
  const ids = new Set(catalog.map((concept) => concept.conceptId));
  const sourcePaths = new Set(catalog.map((concept) => concept.sourcePath));
  assert(catalog.length === 153, `Expected 153 concepts, found ${catalog.length}`);
  assert(ids.size === 153, `Expected 153 unique conceptIds, found ${ids.size}`);
  assert(sourcePaths.size === 153, `Expected 153 unique concept links, found ${sourcePaths.size}`);
  for (const concept of catalog) {
    assert(concept.relatedTerms.length > 0, `${concept.conceptId} has no related terms`);
    assert(concept.definitionSummary, `${concept.conceptId} has no definition summary`);
    assert(concept.gradeContext, `${concept.conceptId} has no grade context`);
  }
  return catalog;
}

function buildSetInputs(inventory) {
  const groups = new Map();
  for (const word of inventory) {
    const key = `${word.day}:${word.set}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  assert(groups.size === 120, `Expected 120 set groups, found ${groups.size}`);

  const outputs = [];
  for (let day = 1; day <= 30; day += 1) {
    for (let set = 1; set <= 4; set += 1) {
      const words = groups.get(`${day}:${set}`);
      assert(words?.length === 10, `DAY ${pad2(day)} set ${set} must contain 10 words`);
      words.sort((a, b) => a.no - b.no);
      const rangeStart = (set - 1) * 10 + 1;
      const rangeEnd = set * 10;
      assert(words[0].no === rangeStart && words[9].no === rangeEnd, `Invalid range for DAY ${pad2(day)} set ${set}`);
      const first = words[0];
      const filename = `DAY${pad2(day)}_${pad2(rangeStart)}-${pad2(rangeEnd)}_set${set}.json`;
      const data = {
        schemaVersion: 1,
        setId: `DAY${pad2(day)}-set${set}`,
        day,
        set,
        range: `${pad2(rangeStart)}-${pad2(rangeEnd)}`,
        part: first.part,
        partTopic: first.partTopic,
        dayTopic: first.dayTopic,
        conceptCatalogPath: "../concept_catalog.json",
        words,
      };
      outputs.push({ filename, content: jsonText(data) });
    }
  }
  return outputs;
}

function verifyNoUnexpectedSetFiles(expectedFilenames) {
  if (!existsSync(SETS_DIR)) return;
  const existing = readdirSync(SETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name);
  const expected = new Set(expectedFilenames);
  const unexpected = existing.filter((filename) => !expected.has(filename));
  assert(unexpected.length === 0, `Unexpected JSON files in data/sets: ${unexpected.join(", ")}`);
}

function sourceDigest() {
  const lines = [...SOURCE_CONTENTS.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([logicalPath, content]) => `${logicalPath}\0${sha256(content)}`);
  return sha256(lines.join("\n"));
}

function main() {
  const partDays = parsePartDayTable();
  const csvWords = parseHackersCsv();
  const inventory = buildWordInventory(partDays, csvWords);
  const conceptCatalog = buildConceptCatalog();
  const setInputs = buildSetInputs(inventory);

  mkdirSync(SETS_DIR, { recursive: true });
  verifyNoUnexpectedSetFiles(setInputs.map((entry) => entry.filename));

  const inventoryContent = `${inventory.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
  const catalogContent = jsonText(conceptCatalog);
  writeFileSync(path.join(DATA_DIR, "word_inventory.jsonl"), inventoryContent, "utf8");
  writeFileSync(path.join(DATA_DIR, "concept_catalog.json"), catalogContent, "utf8");
  for (const output of setInputs) {
    writeFileSync(path.join(SETS_DIR, output.filename), output.content, "utf8");
  }

  const subjectCounts = Object.fromEntries(
    SUBJECTS.map((subject) => [
      subject.id,
      conceptCatalog.filter((concept) => concept.subject === subject.id).length,
    ]),
  );
  const setBundleContent = setInputs
    .map((entry) => `${entry.filename}\0${entry.content}`)
    .join("\n");
  const report = {
    schemaVersion: 1,
    deterministic: true,
    counts: {
      words: inventory.length,
      days: new Set(inventory.map((entry) => entry.day)).size,
      sets: setInputs.length,
      wordsPerDay: 40,
      wordsPerSet: 10,
      partDayRows: partDays.size,
      csvJoins: inventory.filter((entry) => csvWords.get(entry.wordId) === entry.word).length,
      concepts: conceptCatalog.length,
      conceptLinks: new Set(conceptCatalog.map((concept) => concept.sourcePath)).size,
      conceptsBySubject: subjectCounts,
    },
    uniqueness: {
      wordIds: new Set(inventory.map((entry) => entry.wordId)).size,
      conceptIds: new Set(conceptCatalog.map((entry) => entry.conceptId)).size,
      conceptSourcePaths: new Set(conceptCatalog.map((entry) => entry.sourcePath)).size,
    },
    sha256: {
      sources: sourceDigest(),
      wordInventory: sha256(inventoryContent),
      conceptCatalog: sha256(catalogContent),
      setBundle: sha256(setBundleContent),
    },
  };
  writeFileSync(path.join(DATA_DIR, "build_report.json"), jsonText(report), "utf8");

  console.log("mid1st data build complete");
  console.log(`words: ${report.counts.words} (${report.counts.csvJoins} CSV joins)`);
  console.log(`sets: ${report.counts.sets}`);
  console.log(`concepts: ${report.counts.concepts} (${report.counts.conceptLinks} linked pages)`);
  console.log(`subjects: ${JSON.stringify(report.counts.conceptsBySubject)}`);
  console.log(`source digest: ${report.sha256.sources}`);
}

main();
