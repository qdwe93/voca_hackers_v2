#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultPath, printFailure, readJsonl } from "./lib.mjs";

const PROJECT_ROOT = path.resolve(defaultPath(".."));
const CANDIDATE_ROOT = path.join(PROJECT_ROOT, "content", "candidates", "final");
const FINAL_SOURCE = defaultPath("final", "final_sentences.jsonl");
const SENTENCE_SUFFIX = "Stylized 3D cartoon illustration, wide. Main subject in the upper two thirds. No text.";
const WORD_SUFFIX = "Stylized 3D cartoon illustration, square. No text.";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

function wordId(day, no) {
  return `DAY${String(day).padStart(2, "0")}-${String(no).padStart(2, "0")}`;
}

function expectedFolder(day, set) {
  const start = (set - 1) * 10 + 1;
  return `DAY${String(day).padStart(2, "0")}_${String(start).padStart(2, "0")}-${String(start + 9).padStart(2, "0")}_set${set}`;
}

function updatePrompts(source, document, finalById, folder, wordPromptBodies) {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headings = new Map();
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^##\s+(.+\.png)\s*$/);
    if (!match) continue;
    if (headings.has(match[1])) throw new Error(`${folder}: 중복 프롬프트 ${match[1]}`);
    headings.set(match[1], index);
  }
  if (headings.size !== 20) throw new Error(`${folder}: 프롬프트가 20개가 아닙니다 (${headings.size})`);

  let sentencePrompts = 0;
  for (const word of document.words) {
    const id = wordId(document.day, word.no);
    const final = finalById.get(id);
    if (!final) throw new Error(`${folder}: 확정 행 누락 ${id}`);
    const wordName = path.basename(word.wordImage);
    const sentenceName = path.basename(word.sentenceImage);
    const wordAt = headings.get(wordName);
    const sentenceAt = headings.get(sentenceName);
    if (wordAt === undefined) throw new Error(`${folder}: 단어 프롬프트 누락 ${wordName}`);
    if (sentenceAt === undefined) throw new Error(`${folder}: 예문 프롬프트 누락 ${sentenceName}`);
    const wordBody = lines[wordAt + 1] ?? "";
    if (!wordBody.endsWith(WORD_SUFFIX)) throw new Error(`${folder}: 단어 고정 접미 불일치 ${wordName}`);
    wordPromptBodies.push(`${folder}/${wordName}\n${wordBody}\n`);
    lines[sentenceAt + 1] = `${final.sentence} ${SENTENCE_SUFFIX}`;
    sentencePrompts += 1;
  }
  return { text: `${lines.join("\n").replace(/\n+$/, "")}\n`, sentencePrompts };
}

async function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const finalParsed = await readJsonl(FINAL_SOURCE);
  const finalRows = finalParsed.map(({ value }) => value);
  if (finalRows.length !== 1200) throw new Error(`확정본이 1,200줄이 아닙니다: ${finalRows.length}`);
  const finalById = new Map(finalRows.map((row) => [row.wordId, row]));
  if (finalById.size !== 1200) throw new Error("확정본 wordId에 중복이 있습니다.");

  const entries = await readdir(CANDIDATE_ROOT, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory() && /^DAY\d{2}_\d{2}-\d{2}_set\d$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (folders.length !== 120) throw new Error(`final 후보 세트가 120개가 아닙니다: ${folders.length}`);

  const outputs = [];
  const wordPromptBodiesBefore = [];
  const wordPromptBodiesAfter = [];
  let words = 0;
  let definitionsChanged = 0;
  let sentencesChanged = 0;
  let partOfSpeechChanged = 0;
  let meaningChanged = 0;
  let ipaChanged = 0;
  let sentencePrompts = 0;

  for (const folder of folders) {
    const wordsPath = path.join(CANDIDATE_ROOT, folder, "words.json");
    const promptsPath = path.join(CANDIDATE_ROOT, folder, "image_prompts.md");
    const [wordsSource, promptsSource] = await Promise.all([
      readFile(wordsPath, "utf8"),
      readFile(promptsPath, "utf8"),
    ]);
    const document = JSON.parse(wordsSource.replace(/^\uFEFF/, ""));
    if (expectedFolder(document.day, document.set) !== folder) {
      throw new Error(`${folder}: words.json day/set과 폴더명이 일치하지 않습니다.`);
    }
    if (!Array.isArray(document.words) || document.words.length !== 10) {
      throw new Error(`${folder}: words 배열이 10개가 아닙니다.`);
    }

    const updatedWords = document.words.map((word) => {
      const id = wordId(document.day, word.no);
      const final = finalById.get(id);
      if (!final) throw new Error(`${folder}: 확정 행 누락 ${id}`);
      if (word.word !== final.word) throw new Error(`${folder}: 단어 불일치 ${id}`);
      words += 1;
      if (word.definition !== final.definition) definitionsChanged += 1;
      if (word.sentence !== final.sentence) sentencesChanged += 1;
      if (word.partOfSpeech !== final.partOfSpeech) partOfSpeechChanged += 1;
      if (word.meaningKo !== final.meaningKo) meaningChanged += 1;
      if (word.ipa !== final.ipa) ipaChanged += 1;
      return {
        ...word,
        partOfSpeech: final.partOfSpeech,
        meaningKo: final.meaningKo,
        ipa: final.ipa,
        definition: final.definition,
        sentence: final.sentence,
      };
    });
    const updatedDocument = { ...document, words: updatedWords };
    const promptResult = updatePrompts(
      promptsSource,
      updatedDocument,
      finalById,
      folder,
      wordPromptBodiesBefore,
    );
    sentencePrompts += promptResult.sentencePrompts;
    updatePrompts(
      promptResult.text,
      updatedDocument,
      finalById,
      folder,
      wordPromptBodiesAfter,
    );
    outputs.push({
      wordsPath,
      wordsText: `${JSON.stringify(updatedDocument, null, 2)}\n`,
      promptsPath,
      promptsText: promptResult.text,
    });
  }

  if (words !== 1200 || sentencePrompts !== 1200) {
    throw new Error(`처리 수 불일치: words=${words}, sentencePrompts=${sentencePrompts}`);
  }
  const wordPromptHashBefore = sha256(wordPromptBodiesBefore.join(""));
  const wordPromptHashAfter = sha256(wordPromptBodiesAfter.join(""));
  if (wordPromptHashBefore !== wordPromptHashAfter) throw new Error("단어 이미지 프롬프트가 변경되었습니다.");

  const summary = {
    sets: folders.length,
    words,
    definitionsChanged,
    sentencesChanged,
    partOfSpeechChanged,
    meaningChanged,
    ipaChanged,
    sentencePromptsUpdated: sentencePrompts,
    wordPromptsPreserved: wordPromptBodiesBefore.length,
    wordPromptHashBefore,
    wordPromptHashAfter,
  };
  process.stdout.write(`${dryRun ? "DRY-RUN" : "APPLY"}: ${JSON.stringify(summary)}\n`);
  if (dryRun) return;

  for (const output of outputs) {
    await writeAtomic(output.wordsPath, output.wordsText);
    await writeAtomic(output.promptsPath, output.promptsText);
  }

  const reportPath = path.join(CANDIDATE_ROOT, "run_report.md");
  const previous = await readFile(reportPath, "utf8").catch(() => "");
  const report = `# 2026-08-23 — mid1st 확정 예문·정의 통합

- 범위: DAY01~30, 120세트, 1,200단어
- 기준: \`mid1st/final/final_sentences.jsonl\`
- definition 변경: ${definitionsChanged}
- sentence 변경: ${sentencesChanged}
- 품사 변경: ${partOfSpeechChanged}
- 뜻·IPA 변경: ${meaningChanged + ipaChanged}
- 단어 이미지 프롬프트: ${wordPromptBodiesBefore.length}개 보존
- 단어 프롬프트 SHA-256: \`${wordPromptHashAfter}\`
- 예문 이미지 프롬프트: ${sentencePrompts}개를 확정 예문 장면으로 갱신
- 검증: 실행 후 \`validate-content --author final\` 결과를 기록한다

## 이전 선택 보고

${previous.trim()}
`;
  await writeAtomic(reportPath, report);
}

main().catch(printFailure);
