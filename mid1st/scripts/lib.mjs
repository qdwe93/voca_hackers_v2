import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const MID_ROOT = path.resolve(SCRIPT_DIR, "..");
export const AUTHORS = Object.freeze(["codex", "antigravity", "claude"]);
export const MATCH_MODES = Object.freeze([
  "direct",
  "contextual",
  "day_fallback",
  "word_fallback",
]);
export const CURRICULUM_MODES = new Set(["direct", "contextual"]);

export function defaultPath(...parts) {
  return path.join(MID_ROOT, ...parts);
}

export function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      result._.push(token);
      continue;
    }
    const raw = token.slice(2);
    const equalAt = raw.indexOf("=");
    if (equalAt !== -1) {
      result[raw.slice(0, equalAt)] = raw.slice(equalAt + 1);
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      result[raw] = next;
      index += 1;
    } else {
      result[raw] = true;
    }
  }
  return result;
}

export function resolveCliPath(value, fallback) {
  return path.resolve(value ? String(value) : fallback);
}

export async function readJson(filePath) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`필수 파일을 읽을 수 없습니다: ${filePath}\n${error.message}`);
  }
  try {
    return JSON.parse(source.replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`JSON 파싱 실패: ${filePath}\n${error.message}`);
  }
}

export async function readJsonl(filePath) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`필수 파일을 읽을 수 없습니다: ${filePath}\n${error.message}`);
  }
  const rows = [];
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index].trim();
    if (!text) continue;
    try {
      rows.push({ value: JSON.parse(text), line: index + 1 });
    } catch (error) {
      throw new Error(
        `JSONL 파싱 실패: ${filePath}:${index + 1}\n${error.message}`,
      );
    }
  }
  return rows;
}

export function strictKeys(value, expected, label, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label}: 객체여야 합니다.`);
    return false;
  }
  const actual = Object.keys(value);
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length) errors.push(`${label}: 필수 필드 누락: ${missing.join(", ")}`);
  if (extra.length) errors.push(`${label}: 허용되지 않은 필드: ${extra.join(", ")}`);
  return missing.length === 0 && extra.length === 0;
}

export function addError(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function rangeForSet(set) {
  const start = (set - 1) * 10 + 1;
  return `${pad2(start)}-${pad2(start + 9)}`;
}

export function folderForSet(day, set) {
  const start = (set - 1) * 10 + 1;
  return `DAY${pad2(day)}_${pad2(start)}-${pad2(start + 9)}_set${set}`;
}

export function normalizeRange(value) {
  const match = String(value ?? "").match(/^(\d{1,2})-(\d{1,2})$/);
  return match ? `${Number(match[1])}-${Number(match[2])}` : null;
}

export function wordIdFor(day, no) {
  return `DAY${pad2(day)}-${pad2(no)}`;
}

export function englishWords(sentence) {
  return String(sentence).match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) ?? [];
}

export function containsExactWord(sentence, word) {
  const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, "i").test(
    String(sentence),
  );
}

export function markdownCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

export function isWithin(basePath, targetPath) {
  const relative = path.relative(path.resolve(basePath), path.resolve(targetPath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export async function listFilesRecursive(rootPath, fileName = null) {
  let info;
  try {
    info = await stat(rootPath);
  } catch (error) {
    throw new Error(`필수 경로가 없습니다: ${rootPath}\n${error.message}`);
  }
  if (info.isFile()) {
    return fileName && path.basename(rootPath) !== fileName ? [] : [rootPath];
  }
  const found = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile() && (!fileName || entry.name === fileName)) found.push(child);
    }
  }
  await visit(rootPath);
  return found;
}

export async function loadInventory(filePath) {
  const parsed = await readJsonl(filePath);
  const rows = parsed.map(({ value }) => value);
  const byId = new Map();
  for (const row of rows) {
    if (row && typeof row.wordId === "string" && !byId.has(row.wordId)) {
      byId.set(row.wordId, row);
    }
  }
  return { rows, parsed, byId };
}

export async function loadConceptCatalog(filePath) {
  const raw = await readJson(filePath);
  const rows = Array.isArray(raw) ? raw : raw?.concepts;
  if (!Array.isArray(rows)) {
    throw new Error(`개념 카탈로그는 JSON 배열이어야 합니다: ${filePath}`);
  }
  const byId = new Map();
  for (const row of rows) {
    if (row && typeof row.conceptId === "string" && !byId.has(row.conceptId)) {
      byId.set(row.conceptId, row);
    }
  }
  return { rows, byId };
}

export async function loadAssignments(filePath) {
  const parsed = await readJsonl(filePath);
  const rows = parsed.map(({ value }) => value);
  const byId = new Map();
  for (const row of rows) {
    if (row && typeof row.wordId === "string" && !byId.has(row.wordId)) {
      byId.set(row.wordId, row);
    }
  }
  return { rows, parsed, byId };
}

export async function loadWordIdFilter(filePath) {
  const raw = await readJson(filePath);
  let values;
  if (Array.isArray(raw)) values = raw;
  else if (Array.isArray(raw?.wordIds)) values = raw.wordIds;
  else if (Array.isArray(raw?.items)) values = raw.items;
  else if (Array.isArray(raw?.words)) values = raw.words;
  else {
    throw new Error(
      `word ID 필터는 배열 또는 {wordIds:[...]} 형식이어야 합니다: ${filePath}`,
    );
  }
  const ids = values.map((item) =>
    typeof item === "string" ? item : item?.wordId,
  );
  if (ids.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error(`word ID 필터에 wordId가 없는 항목이 있습니다: ${filePath}`);
  }
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) {
    throw new Error(`word ID 필터에 중복이 있습니다: ${[...new Set(duplicates)].join(", ")}`);
  }
  return ids;
}

export function candidateSetExpectedKeys() {
  return ["schemaVersion", "author", "day", "range", "set", "items"];
}

export function candidateItemExpectedKeys() {
  return ["wordId", "no", "word", "sentence"];
}

export async function loadCandidateCorpus(author, candidateRoot) {
  const files = await listFilesRecursive(candidateRoot, "sentences.json");
  if (files.length === 0) {
    throw new Error(`후보 파일이 없습니다: ${candidateRoot}`);
  }
  const sets = [];
  const byId = new Map();
  const duplicates = [];
  for (const filePath of files) {
    const value = await readJson(filePath);
    sets.push({ filePath, value });
    if (Array.isArray(value?.items)) {
      for (const item of value.items) {
        if (!item || typeof item.wordId !== "string") continue;
        if (byId.has(item.wordId)) duplicates.push(item.wordId);
        else byId.set(item.wordId, { ...item, filePath, setDocument: value });
      }
    }
  }
  return { author, root: candidateRoot, files, sets, byId, duplicates };
}

export async function loadCalibrationCorpus(author, filePath) {
  const parsed = await readJsonl(filePath);
  const byId = new Map();
  const duplicates = [];
  for (const { value, line } of parsed) {
    if (!value || typeof value.wordId !== "string") continue;
    if (byId.has(value.wordId)) duplicates.push(value.wordId);
    else byId.set(value.wordId, { ...value, filePath, line });
  }
  return {
    author,
    root: path.dirname(filePath),
    filePath,
    parsed,
    byId,
    duplicates,
  };
}

export function parseDayFilter(raw) {
  if (raw === undefined) return null;
  const match = String(raw).trim().match(/^(?:DAY\s*)?(\d{1,2})$/i);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 30) {
    throw new Error(`--day 값은 1~30 또는 DAY01 형식이어야 합니다: ${raw}`);
  }
  return Number(match[1]);
}

export function parseSetFilter(raw) {
  if (raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 4) {
    throw new Error(`--set 값은 1~4여야 합니다: ${raw}`);
  }
  return value;
}

export function sortByInventory(rows) {
  return [...rows].sort((left, right) => left.day - right.day || left.no - right.no);
}

export function printFailure(error) {
  process.stderr.write(`FAIL: ${error.message}\n`);
  process.exitCode = 1;
}
