import {readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {countEnglishWords, parseDayDirectoryName, parseImagePrompts} from './content-schema.mjs';

// 같은 세트의 후보 3벌을 나란히 놓고 고르기 위한 표를 만든다.
// 판단(어느 정의가 정확한가)은 사람이나 상위 모델이 한다. 이 스크립트는 재료만 모은다.

const usage = `Usage: node scripts/compare-candidates.mjs --set <name> [options]

  --set <name>     비교할 세트 (반복 가능, 생략하면 후보가 2벌 이상인 전부)
  --out <file>     결과를 마크다운 파일로 저장한다 (생략하면 표준출력)
`;

const args = process.argv.slice(2);
const sets = [];
let outFile = '';
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--set') sets.push(args[++i] ?? '');
  else if (arg === '--out') outFile = args[++i] ?? '';
  else if (arg === '--help' || arg === '-h') {
    console.log(usage);
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}\n\n${usage}`);
    process.exit(2);
  }
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidatesRoot = path.resolve(projectRoot, '..', 'content', 'candidates');
const authors = (await readdir(candidatesRoot, {withFileTypes: true}).catch(() => []))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (authors.length === 0) {
  console.error(`${candidatesRoot} 에 후보가 없다.`);
  process.exit(2);
}

const setsByName = new Map();
for (const author of authors) {
  const entries = await readdir(path.join(candidatesRoot, author), {withFileTypes: true}).catch(
    () => [],
  );
  for (const entry of entries) {
    if (!entry.isDirectory() || !parseDayDirectoryName(entry.name)) continue;
    if (!setsByName.has(entry.name)) setsByName.set(entry.name, []);
    setsByName.get(entry.name).push(author);
  }
}

const targets = sets.filter(Boolean).length
  ? sets.filter(Boolean)
  : [...setsByName.entries()].filter(([, list]) => list.length > 1).map(([name]) => name).sort();

if (targets.length === 0) {
  console.error('비교할 세트가 없다 (후보가 2벌 이상인 세트가 없음).');
  process.exit(2);
}

const escape = (value) => String(value).replaceAll('|', '\\|');
const lines = [];

for (const setName of targets) {
  const present = setsByName.get(setName) ?? [];
  lines.push(`# ${setName}`, '');
  if (present.length < 2) {
    lines.push(`후보 ${present.length}벌 (${present.join(', ') || '없음'}) — 비교 대상 아님`, '');
    continue;
  }

  const loaded = [];
  for (const author of present) {
    const dir = path.join(candidatesRoot, author, setName);
    try {
      const data = JSON.parse(await readFile(path.join(dir, 'words.json'), 'utf8'));
      const prompts = await readFile(path.join(dir, 'image_prompts.md'), 'utf8').catch(() => '');
      loaded.push({author, data, prompts: parseImagePrompts(prompts)});
    } catch (error) {
      lines.push(`- ${author}: 읽기 실패 — ${error.message}`);
    }
  }

  const promptWords = (entry) =>
    entry.prompts.length
      ? Math.round(
          entry.prompts.reduce((sum, item) => sum + countEnglishWords(item.prompt), 0) /
            entry.prompts.length,
        )
      : 0;

  lines.push('| 후보 | 정의 평균 단어 | 예문 평균 단어 | 프롬프트 평균 단어 | 프롬프트 수 |');
  lines.push('|---|---|---|---|---|');
  for (const entry of loaded) {
    const definitions =
      entry.data.words.reduce((sum, item) => sum + countEnglishWords(item.definition), 0) / 10;
    const sentences =
      entry.data.words.reduce((sum, item) => sum + countEnglishWords(item.sentence), 0) / 10;
    lines.push(
      `| ${entry.author} | ${definitions.toFixed(1)} | ${sentences.toFixed(1)} | ${promptWords(entry)} | ${entry.prompts.length} |`,
    );
  }
  lines.push('');

  const wordCount = loaded[0]?.data.words.length ?? 0;
  for (let index = 0; index < wordCount; index += 1) {
    const head = loaded[0].data.words[index];
    lines.push(`## ${head.no}. ${head.word}`, '');
    lines.push('| 후보 | IPA | 뜻(ko) | 영영정의 | 예문 |');
    lines.push('|---|---|---|---|---|');
    for (const entry of loaded) {
      const item = entry.data.words[index];
      if (!item) continue;
      lines.push(
        `| ${entry.author} | ${escape(item.ipa)} | ${escape(item.meaningKo)} | ${escape(item.definition)} | ${escape(item.sentence)} |`,
      );
    }
    lines.push('');
  }
}

const output = lines.join('\n');
if (outFile) {
  const target = path.resolve(process.cwd(), outFile);
  await writeFile(target, output, 'utf8');
  console.log(`Wrote ${target} (${targets.length} set(s))`);
} else {
  console.log(output);
}
