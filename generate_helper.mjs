import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  countEnglishWords,
  WORD_SUFFIX,
  SENTENCE_SUFFIX,
  SPEAKERS,
  setDirectoryName,
} from './remotion/scripts/content-schema.mjs';

const projectRoot = path.resolve('.');

export async function writeCandidateSet({ author, day, set, wordsData }) {
  if (wordsData.length !== 10) {
    throw new Error(`wordsData must have exactly 10 words, got ${wordsData.length}`);
  }

  const startNo = (set - 1) * 10 + 1;
  const endNo = set * 10;
  const dirName = setDirectoryName({ day, set });
  const setDir = path.join(projectRoot, 'content', 'candidates', author, dirName);

  await mkdir(setDir, { recursive: true });

  const padDay = String(day).padStart(2, '0');
  const padStart = String(startNo).padStart(2, '0');
  const padEnd = String(endNo).padStart(2, '0');

  const words = wordsData.map((item, index) => {
    const expectedNo = startNo + index;
    const expectedSpeaker = SPEAKERS[index % SPEAKERS.length];
    const padNo = String(expectedNo).padStart(2, '0');
    const wordLower = item.word.toLowerCase();

    // Check sentence length
    const sWords = countEnglishWords(item.sentence);
    if (sWords < 8 || sWords > 12) {
      throw new Error(
        `[DAY${padDay} set${set}] Word "${item.word}" sentence has ${sWords} words (expected 8-12): "${item.sentence}"`
      );
    }

    // Check definition length
    const dWords = countEnglishWords(item.definition);
    if (dWords > 12) {
      throw new Error(
        `[DAY${padDay} set${set}] Word "${item.word}" definition has ${dWords} words (max 12): "${item.definition}"`
      );
    }

    // Check word inclusion
    const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, 'i').test(item.sentence)) {
      throw new Error(
        `[DAY${padDay} set${set}] Word "${item.word}" not found in sentence: "${item.sentence}"`
      );
    }

    return {
      no: expectedNo,
      word: item.word,
      partOfSpeech: item.partOfSpeech,
      meaningKo: item.meaningKo,
      ipa: item.ipa,
      definition: item.definition,
      sentence: item.sentence,
      wordImage: `images/${padNo}_${wordLower}_word.png`,
      sentenceImage: `images/${padNo}_${wordLower}_sent.png`,
      speaker: expectedSpeaker,
    };
  });

  const wordsJson = {
    schemaVersion: 3,
    day: day,
    range: `${startNo}-${endNo}`,
    set: set,
    title: `DAY ${padDay} · ${padStart}-${padEnd}`,
    words: words,
  };

  await writeFile(
    path.join(setDir, 'words.json'),
    JSON.stringify(wordsJson, null, 2) + '\n',
    'utf8'
  );

  // Generate image_prompts.md
  const promptLines = [];
  for (let i = 0; i < wordsData.length; i++) {
    const item = wordsData[i];
    const expectedNo = startNo + i;
    const padNo = String(expectedNo).padStart(2, '0');
    const wordLower = item.word.toLowerCase();

    // Check prompt scenes
    const wordSceneWords = countEnglishWords(item.wordPromptScene);
    if (wordSceneWords < 4 || wordSceneWords > 45) {
      throw new Error(
        `[DAY${padDay} set${set}] Word "${item.word}" wordPromptScene has ${wordSceneWords} words: "${item.wordPromptScene}"`
      );
    }

    const sentSceneWords = countEnglishWords(item.sentPromptScene);
    if (sentSceneWords < 4 || sentSceneWords > 45) {
      throw new Error(
        `[DAY${padDay} set${set}] Word "${item.word}" sentPromptScene has ${sentSceneWords} words: "${item.sentPromptScene}"`
      );
    }

    promptLines.push(`## ${padNo}_${wordLower}_word.png`);
    promptLines.push(`${item.wordPromptScene} ${WORD_SUFFIX}`);
    promptLines.push('');
    promptLines.push(`## ${padNo}_${wordLower}_sent.png`);
    promptLines.push(`${item.sentPromptScene} ${SENTENCE_SUFFIX}`);
    promptLines.push('');
  }

  await writeFile(
    path.join(setDir, 'image_prompts.md'),
    promptLines.join('\n'),
    'utf8'
  );
}
