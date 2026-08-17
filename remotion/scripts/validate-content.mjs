import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {
  loadHackersCsv,
  parseDayDirectoryName,
  validateContentData,
  validateImagePrompts,
} from './content-schema.mjs';

const usage = `Usage: node scripts/validate-content.mjs [options]

  --author <name>   content/candidates/<name> 을 검사한다 (생략하면 승격된 public/days)
  --set <name>      대상 세트 (반복 가능, 생략하면 소스에 있는 전부)
  --no-prompts      image_prompts.md 검사를 건너뛴다 (콘텐츠만 볼 때)
`;

const args = process.argv.slice(2);
const sets = [];
let author = '';
let requirePrompts = true;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--author') author = args[++i] ?? '';
  else if (arg === '--set') sets.push(args[++i] ?? '');
  else if (arg === '--no-prompts') requirePrompts = false;
  else if (arg === '--help' || arg === '-h') {
    console.log(usage);
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}\n\n${usage}`);
    process.exit(2);
  }
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = author
  ? path.resolve(projectRoot, '..', 'content', 'candidates', author)
  : path.join(projectRoot, 'public', 'days');

const listSets = async () => {
  if (sets.length > 0) return sets.filter(Boolean);
  const entries = await readdir(sourceRoot, {withFileTypes: true}).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && parseDayDirectoryName(entry.name))
    .map((entry) => entry.name)
    .sort();
};

const targets = await listSets();
if (targets.length === 0) {
  console.error(`No sets found in ${sourceRoot}.`);
  process.exit(2);
}

const csvRows = await loadHackersCsv(projectRoot);
let failed = 0;
let warned = 0;

for (const setName of targets) {
  const setDir = path.join(sourceRoot, setName);
  const errors = [];
  const warnings = [];
  let data = null;

  try {
    const raw = JSON.parse(await readFile(path.join(setDir, 'words.json'), 'utf8'));
    const result = validateContentData({data: raw, directoryName: setName, csvRows});
    errors.push(...result.errors);
    data = result.data;
  } catch (error) {
    errors.push(`words.json: ${error.message}`);
  }

  if (requirePrompts && data) {
    try {
      const markdown = await readFile(path.join(setDir, 'image_prompts.md'), 'utf8');
      const result = validateImagePrompts({markdown, words: data.words});
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    } catch (error) {
      errors.push(`image_prompts.md: ${error.message}`);
    }
  }

  const label = author ? `${author}/${setName}` : setName;
  if (errors.length > 0) {
    failed += 1;
    console.error(`FAIL ${label}`);
    for (const message of errors) console.error(`     ${message}`);
  } else {
    console.log(
      `OK   ${label} — 10 words, CSV matched${requirePrompts ? ', 20 prompts' : ''}` +
        (warnings.length > 0 ? `, ${warnings.length} warning(s)` : ''),
    );
  }
  for (const message of warnings) {
    warned += 1;
    console.warn(`WARN ${label}: ${message}`);
  }
}

console.log(
  `\n${targets.length - failed}/${targets.length} sets passed` +
    (warned > 0 ? `, ${warned} warning(s)` : ''),
);
if (failed > 0) process.exitCode = 1;
