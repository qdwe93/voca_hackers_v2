import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

import {
  SPEAKERS,
  expectedImagePath,
  loadHackersCsv,
  validateContentData,
} from './content-schema.mjs';
import {verifySetImages} from './media-verification.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(projectRoot, '..');
const failures = [];
const ok = (condition, message) => {
  if (!condition) failures.push(message);
  else console.log(`OK   ${message}`);
};

const capture = (command, args, cwd) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString()));
    child.on('close', (code) => resolve({code: code ?? 1, stdout, stderr}));
  });

const csvRows = await loadHackersCsv(projectRoot);
const words = [];
for (let index = 0; index < 10; index += 1) {
  const no = index + 1;
  const word = csvRows.get(`DAY 01:${no}`);
  const item = {
    no,
    word,
    partOfSpeech: 'n.',
    meaningKo: '시험 뜻',
    ipa: '/test/',
    definition: 'a simple meaning shown in a clear way',
    sentence: `Every robot shows ${word} clearly beside the blue table.`,
    wordImage: '',
    sentenceImage: '',
    speaker: SPEAKERS[index % SPEAKERS.length],
  };
  item.wordImage = expectedImagePath(item, 'word');
  item.sentenceImage = expectedImagePath(item, 'sent');
  words.push(item);
}
words[1].sentence = `Monday robots show ${words[1].word} clearly beside the blue table.`;
words[2].sentence = `Monday robots show ${words[2].word} clearly beside the blue table.`;
const data = {schemaVersion: 3, day: 1, range: '1-10', set: 1, title: 'fixture', words};
const falsePositive = validateContentData({
  data,
  directoryName: 'DAY01_01-10_set1',
  csvRows,
});
ok(
  !falsePositive.errors.some((message) => message.includes('Repeated fixed name')),
  '문두 Every/Monday를 사람 이름으로 오인하지 않는다',
);

const repeatedLanguage = structuredClone(data);
repeatedLanguage.words[0].sentence = `A Korean robot shows ${words[0].word} clearly beside the blue table.`;
repeatedLanguage.words[1].sentence = `A Korean robot shows ${words[1].word} clearly beside the blue table.`;
const languageResult = validateContentData({
  data: repeatedLanguage,
  directoryName: 'DAY01_01-10_set1',
  csvRows,
});
ok(
  !languageResult.errors.some((message) => message.includes('Repeated fixed name')),
  '반복 언어·국적 형용사를 사람 이름으로 오인하지 않는다',
);

const repeatedPerson = structuredClone(data);
repeatedPerson.words[0].sentence = `The robot shows ${words[0].word} while Alice watches beside the table.`;
repeatedPerson.words[1].sentence = `A robot shows ${words[1].word} while Alice watches beside the table.`;
const truePositive = validateContentData({
  data: repeatedPerson,
  directoryName: 'DAY01_01-10_set1',
  csvRows,
});
ok(
  truePositive.errors.some((message) => message.includes('Repeated fixed name(s)') && message.includes('Alice')),
  '문중 반복 인물 이름은 계속 검출한다',
);

const emitted = await capture(
  process.execPath,
  [path.join(projectRoot, 'scripts', 'emit-request.mjs'), '--set', 'DAY03_21-30_set3'],
  repositoryRoot,
);
ok(emitted.code === 0 && !emitted.stdout.includes('{{'), 'emit-request가 토큰을 모두 치환한다');
ok(
  emitted.stdout.includes('DAY 번호: 3,  세트 번호: 3,  범위: 21-30'),
  'emit-request가 DAY·세트·범위를 맞춘다',
);

const candidateFixtureRoot = path.join(repositoryRoot, 'content', 'candidates', 'fixtureauthor');
const candidateFixtureSet = path.join(candidateFixtureRoot, 'DAY01_01-10_set1');
await mkdir(candidateFixtureSet, {recursive: true});
try {
  await writeFile(path.join(candidateFixtureSet, 'words.json'), `${JSON.stringify(data)}\n`, 'utf8');
  const status = await capture(
    process.execPath,
    [path.join(projectRoot, 'scripts', 'status.mjs'), '--day', '01'],
    repositoryRoot,
  );
  ok(status.code === 0 && status.stdout.includes('fixtureauthor'), 'status가 author 전체 이름을 표시한다');
} finally {
  await rm(candidateFixtureRoot, {recursive: true, force: true});
}

const guardDir = path.join(repositoryRoot, 'inbox', 'fixtureauthor');
await mkdir(guardDir, {recursive: true});
try {
  const guarded = await capture(
    process.execPath,
    [path.join(projectRoot, 'scripts', 'import-images.mjs')],
    repositoryRoot,
  );
  ok(guarded.code === 2 && guarded.stderr.includes('--author'), '임포터 무인자 실행이 author 폴더를 거부한다');
} finally {
  await rm(guardDir, {recursive: true, force: true});
}

const trimFixture = await sharp({
  create: {width: 1024, height: 1024, channels: 3, background: '#ffffff'},
})
  .composite([
    {
      input: await sharp({
        create: {width: 1024, height: 500, channels: 3, background: '#2244aa'},
      })
        .png()
        .toBuffer(),
      left: 0,
      top: 262,
    },
  ])
  .png()
  .toBuffer();
const originalMeta = await sharp(trimFixture).metadata();
const {info: trimmedMeta} = await sharp(trimFixture)
  .trim({threshold: 12})
  .png()
  .toBuffer({resolveWithObject: true});
const areaRatio =
  ((trimmedMeta.width ?? 0) * (trimmedMeta.height ?? 0)) /
  ((originalMeta.width ?? 1) * (originalMeta.height ?? 1));
ok(areaRatio >= 0.4 && areaRatio < 0.55, '0.40 트림 경계가 큰 단색 밴드 fixture를 수용한다');

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'voca-v2-fixture-'));
try {
  const setDir = path.join(tempRoot, 'DAY01_01-10_set1');
  const imageDir = path.join(setDir, 'images');
  await mkdir(imageDir, {recursive: true});
  await writeFile(path.join(setDir, 'words.json'), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  for (const item of data.words) {
    await sharp({create: {width: 1024, height: 1024, channels: 3, background: '#38bdf8'}})
      .png()
      .toFile(path.join(imageDir, path.basename(item.wordImage)));
    await sharp({create: {width: 1600, height: 900, channels: 3, background: '#fbbf24'}})
      .png()
      .toFile(path.join(imageDir, path.basename(item.sentenceImage)));
  }
  const verified = await verifySetImages(setDir);
  ok(verified.ok, '정밀 이미지 검증이 정상 PNG 20장을 통과시킨다');
} finally {
  await rm(tempRoot, {recursive: true, force: true});
}

const importerSource = await readFile(path.join(projectRoot, 'scripts', 'import-images.mjs'), 'utf8');
ok(importerSource.includes('const TRIM_MIN_AREA_RATIO = 0.40'), '임포터 트림 임계값이 0.40이다');
const agySource = await readFile(path.join(projectRoot, 'scripts', 'generate-images-agy.mjs'), 'utf8');
ok(
  agySource.includes('candidateRoot') && agySource.includes('stagedNames'),
  'agy 누락 판정이 후보 보관함과 inbox를 함께 확인한다',
);
const ttsSource = await readFile(path.join(repositoryRoot, 'tts', 'build_set_audio.py'), 'utf8');
ok(
  ttsSource.includes('for set_dir in sets:') && ttsSource.includes('except Exception as error:'),
  'TTS 배치가 세트별 예외를 격리한다',
);

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log('\nAll fixtures passed.');
