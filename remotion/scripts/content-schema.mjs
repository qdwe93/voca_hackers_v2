import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';

// v2 이미지 프롬프트 규칙 — 단순화가 목적이다.
// 약한 이미지 모델(nano banana 2 등)은 지시가 길수록 피사체를 자르거나 요청한 비율을
// 단색 밴드로 채운다. 그래서 프롬프트는 "장면 한 문장 + 최소 안전장치"만 둔다.
// 비율·규격은 프롬프트가 아니라 import-images.mjs 가 책임진다.
export const WORD_SUFFIX = 'Stylized 3D cartoon illustration, square. No text.';
export const SENTENCE_SUFFIX =
  'Stylized 3D cartoon illustration, wide. Main subject in the upper two thirds. No text.';

// 장면 묘사 권장 상한과 하드 상한. 상한을 넘으면 약한 모델에서 지시가 뭉개진다.
export const SCENE_WORDS_WARN = 30;
export const SCENE_WORDS_MAX = 45;

// 생성이 실패했을 때만, 실패한 자산에만 덧붙이는 보강 문구 (P2 문서 참조).
export const ESCALATIONS = {
  text: 'Absolutely no letters, numbers, logos, or watermarks anywhere.',
  crop: 'Show the whole subject with clear margin on every side.',
  band: 'Fill the entire frame with the scene, no borders, no empty color areas.',
  people: 'Simple friendly cartoon characters, no realistic faces.',
};

export const SPEAKERS = ['Zephyr', 'Liam', 'Erinome', 'Charon'];

export const PARTS_OF_SPEECH = [
  'n.',
  'v.',
  'adj.',
  'adv.',
  'prep.',
  'conj.',
  'pron.',
  'det.',
  'interj.',
];

const relativeAssetPath = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !path.isAbsolute(value), 'Asset path must be relative.')
  .refine(
    (value) => !value.replaceAll('\\', '/').split('/').includes('..'),
    'Asset path may not contain parent-directory traversal.',
  );

export const countEnglishWords = (value) =>
  value.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)?.length ?? 0;

export const expectedImagePath = (item, kind) =>
  `images/${String(item.no).padStart(2, '0')}_${item.word.toLocaleLowerCase('en-US')}_${kind}.png`;

export const wordSchema = z
  .object({
    no: z.number().int().positive(),
    word: z.string().trim().regex(/^[a-z]+(?:-[a-z]+)?$/),
    partOfSpeech: z.enum(PARTS_OF_SPEECH),
    meaningKo: z.string().trim().min(1),
    ipa: z.string().trim().regex(/^\/.+\/$/, 'IPA must be wrapped in slashes.'),
    definition: z.string().trim().min(1),
    sentence: z.string().trim().min(1),
    wordImage: relativeAssetPath,
    sentenceImage: relativeAssetPath,
    speaker: z.enum(SPEAKERS),
  })
  .strict();

export const dataSchema = z
  .object({
    schemaVersion: z.literal(3),
    day: z.union([z.number().int().min(1).max(30), z.string().regex(/^DAY\s+\d+$/i)]),
    range: z.string().regex(/^\d+\s*[-–]\s*\d+$/),
    set: z.number().int().min(1).max(4),
    title: z.string().trim().min(1),
    words: z.array(wordSchema).length(10),
  })
  .strict();

export const parseDayDirectoryName = (name) => {
  const match = /^DAY(\d{2})_(\d{2})-(\d{2})_set([1-4])$/.exec(name);
  if (!match) return null;
  return {
    day: Number.parseInt(match[1], 10),
    start: Number.parseInt(match[2], 10),
    end: Number.parseInt(match[3], 10),
    set: Number.parseInt(match[4], 10),
  };
};

export const setDirectoryName = ({day, set}) => {
  const start = (set - 1) * 10 + 1;
  const end = set * 10;
  const pad = (value) => String(value).padStart(2, '0');
  return `DAY${pad(day)}_${pad(start)}-${pad(end)}_set${set}`;
};

export const allSetNames = () => {
  const names = [];
  for (let day = 1; day <= 30; day += 1) {
    for (let set = 1; set <= 4; set += 1) names.push(setDirectoryName({day, set}));
  }
  return names;
};

export const resolveDayDirectory = (projectRoot, dayDirArg) => {
  const publicRoot = path.join(projectRoot, 'public');
  const normalizedArg = dayDirArg.replaceAll('\\', '/').replace(/^public\//, '');
  const dayDir = path.resolve(publicRoot, normalizedArg);
  const daysRoot = path.join(publicRoot, 'days');
  const relative = path.relative(daysRoot, dayDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('dayDir must point to one set inside remotion/public/days/.');
  }
  return dayDir;
};

export const loadHackersCsv = async (projectRoot) => {
  const csvPath = path.resolve(projectRoot, '..', 'hackers.csv');
  const text = (await readFile(csvPath, 'utf8')).replace(/^﻿/, '');
  const rows = new Map();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.shift() !== 'DAY,no.,단어') {
    throw new Error(`Unexpected hackers.csv header in ${csvPath}.`);
  }
  for (const line of lines) {
    const [day, rawNo, ...wordParts] = line.split(',');
    const no = Number.parseInt(rawNo, 10);
    const word = wordParts.join(',').trim().replace(/^"|"$/g, '').replaceAll('""', '"');
    rows.set(`${day.trim().toLocaleUpperCase('en-US')}:${no}`, word);
  }
  return rows;
};

const collectLikelyNames = (sentence) => {
  const common = new Set([
    'A', 'An', 'The', 'This', 'That', 'These', 'Those', 'Fresh', 'She', 'He', 'They',
    'We', 'I', 'It', 'My', 'Our', 'Your', 'Their', 'His', 'Her', 'After', 'Before',
  ]);
  return (sentence.match(/\b[A-Z][a-z]{2,}\b/g) ?? []).filter((token) => !common.has(token));
};

export const validateContentData = ({data, directoryName, csvRows}) => {
  const errors = [];
  const parsed = dataSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join('.') || 'root'}: ${issue.message}`);
    }
    return {errors, data: null, names: []};
  }

  const value = parsed.data;
  const directory = parseDayDirectoryName(directoryName);
  if (!directory) {
    errors.push(`Invalid set directory name: ${directoryName}`);
  } else {
    const dayValue =
      typeof value.day === 'number'
        ? value.day
        : Number.parseInt(value.day.replace(/\D/g, ''), 10);
    if (
      dayValue !== directory.day ||
      value.set !== directory.set ||
      value.range.replace('–', '-') !== `${directory.start}-${directory.end}`
    ) {
      errors.push('words.json day/range/set must match the set directory name.');
    }
  }

  const range = value.range.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  const expectedStart = Number.parseInt(range?.[1] ?? '0', 10);
  const expectedEnd = Number.parseInt(range?.[2] ?? '0', 10);
  if (expectedEnd - expectedStart !== 9) {
    errors.push(`range must cover exactly 10 words; got ${value.range}.`);
  }

  const names = [];
  const seenNumbers = new Set();
  const seenWords = new Set();
  for (const [index, item] of value.words.entries()) {
    const expectedNo = expectedStart + index;
    if (item.no !== expectedNo) errors.push(`${item.word}: expected no.${expectedNo}.`);
    if (seenNumbers.has(item.no)) errors.push(`${item.word}: duplicate number ${item.no}.`);
    seenNumbers.add(item.no);
    const normalizedWord = item.word.toLocaleLowerCase('en-US');
    if (seenWords.has(normalizedWord)) errors.push(`${item.word}: duplicate word.`);
    seenWords.add(normalizedWord);

    const dayNumber = directory?.day ?? 0;
    const csvKey = `DAY ${String(dayNumber).padStart(2, '0')}:${item.no}`;
    const csvWord = csvRows.get(csvKey);
    if (csvWord !== item.word) {
      errors.push(`${item.no} ${item.word}: hackers.csv has "${csvWord ?? 'missing'}".`);
    }

    const expectedSpeaker = SPEAKERS[index % SPEAKERS.length];
    if (item.speaker !== expectedSpeaker) {
      errors.push(`${item.no} ${item.word}: position ${index + 1} must use ${expectedSpeaker}.`);
    }

    const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, 'i').test(item.sentence)) {
      errors.push(`${item.no} ${item.word}: sentence must contain the exact target word.`);
    }
    const definitionWords = countEnglishWords(item.definition);
    if (definitionWords > 12) {
      errors.push(`${item.no} ${item.word}: definition has ${definitionWords} words; maximum is 12.`);
    }
    const sentenceWords = countEnglishWords(item.sentence);
    if (sentenceWords < 8 || sentenceWords > 12) {
      errors.push(`${item.no} ${item.word}: sentence has ${sentenceWords} words; expected 8-12.`);
    }
    const expectedWordImage = expectedImagePath(item, 'word');
    const expectedSentenceImage = expectedImagePath(item, 'sent');
    if (item.wordImage.replaceAll('\\', '/') !== expectedWordImage) {
      errors.push(`${item.no} ${item.word}: wordImage must be ${expectedWordImage}.`);
    }
    if (item.sentenceImage.replaceAll('\\', '/') !== expectedSentenceImage) {
      errors.push(`${item.no} ${item.word}: sentenceImage must be ${expectedSentenceImage}.`);
    }
    names.push(...collectLikelyNames(item.sentence));
  }

  const repeatedNames = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
  if (repeatedNames.length > 0) {
    errors.push(`Repeated fixed name(s) in example sentences: ${repeatedNames.join(', ')}.`);
  }

  return {errors, data: value, names};
};

export const parseImagePrompts = (markdown) => {
  const entries = [];
  const matches = markdown.matchAll(/^##\s+([^\r\n]+)\r?\n+([\s\S]*?)(?=^##\s+|\s*$)/gm);
  for (const match of matches) {
    entries.push({filename: match[1].trim(), prompt: match[2].trim().replace(/\s+/g, ' ')});
  }
  return entries;
};

// v2 프롬프트 검사 — 규칙은 3개뿐이다: 파일명 1:1 대응, 고정 접미, 길이 상한.
export const validateImagePrompts = ({markdown, words}) => {
  const errors = [];
  const warnings = [];
  const entries = parseImagePrompts(markdown);
  const expected = new Map();
  for (const item of words) {
    expected.set(path.basename(expectedImagePath(item, 'word')), 'word');
    expected.set(path.basename(expectedImagePath(item, 'sent')), 'sent');
  }

  const seen = new Set();
  for (const entry of entries) {
    const kind = expected.get(entry.filename);
    if (!kind) {
      errors.push(`${entry.filename}: not a target image for this set.`);
      continue;
    }
    if (seen.has(entry.filename)) errors.push(`${entry.filename}: duplicate prompt.`);
    seen.add(entry.filename);

    const suffix = kind === 'word' ? WORD_SUFFIX : SENTENCE_SUFFIX;
    if (!entry.prompt.endsWith(suffix)) {
      errors.push(`${entry.filename}: must end with the fixed suffix "${suffix}"`);
      continue;
    }
    const scene = entry.prompt.slice(0, -suffix.length).trim().replace(/[.,]$/, '');
    const sceneWords = countEnglishWords(scene);
    if (sceneWords < 4) {
      errors.push(`${entry.filename}: scene description is too short (${sceneWords} words).`);
    } else if (sceneWords > SCENE_WORDS_MAX) {
      errors.push(
        `${entry.filename}: scene has ${sceneWords} words; hard limit is ${SCENE_WORDS_MAX}.`,
      );
    } else if (sceneWords > SCENE_WORDS_WARN) {
      warnings.push(`${entry.filename}: scene has ${sceneWords} words (target ${SCENE_WORDS_WARN}).`);
    }
  }

  for (const filename of expected.keys()) {
    if (!seen.has(filename)) errors.push(`${filename}: prompt is missing.`);
  }

  return {errors, warnings, entries};
};
