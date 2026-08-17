import {copyFile, mkdir, readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {
  loadHackersCsv,
  parseDayDirectoryName,
  validateContentData,
  validateImagePrompts,
} from './content-schema.mjs';

// 같은 세트를 3개 AI 가 각각 만든다. 그중 하나를 골라 public/days 로 승격한다.
// 승격은 검증을 통과한 후보만 가능하고, 이미 승격된 세트는 --replace 없이 덮지 않는다.

const usage = `Usage: node scripts/promote-candidate.mjs --author <name> [options]

  --author <name>  content/candidates/<name> 에서 가져온다 (필수)
  --set <name>     대상 세트 (반복 가능, 생략하면 그 author 의 전부)
  --replace        이미 승격된 세트를 덮어쓴다
  --dry-run        무엇이 승격될지만 출력한다
`;

const args = process.argv.slice(2);
const sets = [];
let author = '';
let replace = false;
let dryRun = false;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--author') author = args[++i] ?? '';
  else if (arg === '--set') sets.push(args[++i] ?? '');
  else if (arg === '--replace') replace = true;
  else if (arg === '--dry-run') dryRun = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(usage);
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}\n\n${usage}`);
    process.exit(2);
  }
}
if (!author) {
  console.error(usage);
  process.exit(2);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidateRoot = path.resolve(projectRoot, '..', 'content', 'candidates', author);
const daysRoot = path.join(projectRoot, 'public', 'days');
const csvRows = await loadHackersCsv(projectRoot);

const targets = sets.filter(Boolean).length
  ? sets.filter(Boolean)
  : (await readdir(candidateRoot, {withFileTypes: true}).catch(() => []))
      .filter((entry) => entry.isDirectory() && parseDayDirectoryName(entry.name))
      .map((entry) => entry.name)
      .sort();

if (targets.length === 0) {
  console.error(`${candidateRoot} 에 후보 세트가 없다.`);
  process.exit(2);
}

let promoted = 0;
let failed = 0;
for (const setName of targets) {
  const sourceDir = path.join(candidateRoot, setName);
  const destinationDir = path.join(daysRoot, setName);
  const errors = [];
  let data = null;

  try {
    const raw = JSON.parse(await readFile(path.join(sourceDir, 'words.json'), 'utf8'));
    const result = validateContentData({data: raw, directoryName: setName, csvRows});
    errors.push(...result.errors);
    data = result.data;
  } catch (error) {
    errors.push(`words.json: ${error.message}`);
  }
  if (data) {
    try {
      const markdown = await readFile(path.join(sourceDir, 'image_prompts.md'), 'utf8');
      errors.push(...validateImagePrompts({markdown, words: data.words}).errors);
    } catch (error) {
      errors.push(`image_prompts.md: ${error.message}`);
    }
  }

  const alreadyPromoted = await stat(path.join(destinationDir, 'words.json'))
    .then(() => true)
    .catch(() => false);
  if (alreadyPromoted && !replace) {
    console.log(`SKIP  ${setName} — 이미 승격됨 (--replace 로 교체)`);
    continue;
  }
  if (errors.length > 0) {
    failed += 1;
    console.error(`FAIL  ${setName} — 검증 실패, 승격하지 않는다`);
    for (const message of errors) console.error(`      ${message}`);
    continue;
  }
  if (dryRun) {
    console.log(`DRY   ${setName} ← ${author}`);
    continue;
  }

  await mkdir(destinationDir, {recursive: true});
  await copyFile(path.join(sourceDir, 'words.json'), path.join(destinationDir, 'words.json'));
  await copyFile(
    path.join(sourceDir, 'image_prompts.md'),
    path.join(destinationDir, 'image_prompts.md'),
  );
  promoted += 1;
  console.log(`OK    ${setName} ← ${author}${alreadyPromoted ? ' (replaced)' : ''}`);
}

console.log(`\npromoted ${promoted}, failed ${failed}, of ${targets.length} candidate set(s)`);
if (failed > 0) process.exitCode = 1;
