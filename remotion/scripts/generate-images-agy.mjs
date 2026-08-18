import {spawn} from 'node:child_process';
import {copyFile, mkdir, readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {ESCALATIONS, parseDayDirectoryName, parseImagePrompts} from './content-schema.mjs';

// 이미지 백엔드 중 "자동" 경로. 생성물은 inbox/ 에 목표 파일명으로 떨어뜨리기만 한다.
// 규격 변환·크롭·검사는 import-images.mjs 가 전담한다 (백엔드마다 다른 규격을 여기서
// 처리하지 않는다. 모든 백엔드는 같은 inbox 경로로 수렴한다.

const AGY = process.env.AGY_PATH ?? 'C:\\Users\\x_xo_\\AppData\\Local\\agy\\bin\\agy.exe';

const usage = `Usage: node scripts/generate-images-agy.mjs [options]

  --set <name>       대상 세트 (반복 가능, 생략하면 이미지가 빠진 승격 세트 전부)
  --concurrency <n>  동시 실행 수 (1~8, 기본 4)
  --limit <n>        앞에서 n개만 생성 (쿼터 아끼며 시험할 때)
  --author <name>    생성물을 inbox/<name>/ 에 스테이징한다 (AI별 비교용)
  --escalate <k>     실패 자산 재생성용 보강 문구 (text|crop|band|people, 반복 가능)
  --list-missing     생성하지 않고 누락 목록만 JSON 으로 출력 (다른 도구로 넘길 때)
`;

const args = process.argv.slice(2);
const sets = [];
const escalations = [];
let concurrency = 4;
let limit = Infinity;
let listMissing = false;
let author = '';
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--set') sets.push(args[++i] ?? '');
  else if (arg === '--author') author = args[++i] ?? '';
  else if (arg === '--concurrency') concurrency = Number(args[++i]);
  else if (arg === '--limit') limit = Number(args[++i]);
  else if (arg === '--escalate') escalations.push(args[++i] ?? '');
  else if (arg === '--list-missing') listMissing = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(usage);
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}\n\n${usage}`);
    process.exit(2);
  }
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
  console.error('--concurrency must be an integer from 1 to 8.');
  process.exit(2);
}
for (const key of escalations) {
  if (!ESCALATIONS[key]) {
    console.error(`Unknown escalation "${key}". Use one of: ${Object.keys(ESCALATIONS).join(', ')}`);
    process.exit(2);
  }
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const daysRoot = path.join(projectRoot, 'public', 'days');
const inboxRoot = path.resolve(projectRoot, '..', 'inbox');
const inbox = author ? path.join(inboxRoot, author) : inboxRoot;
const candidateRoot = path.resolve(projectRoot, '..', 'content', 'image-candidates');
const exists = async (target) => stat(target).then(() => true).catch(() => false);

const normalizeExistingName = (filename) =>
  path
    .basename(filename)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/[-_ ]?(copy|final|v\d+|\d{8,})$/i, '')
    .split(/__|\s-\s/)
    .pop()
    .trim()
    .toLowerCase();

const listStagedNames = async (directory) => {
  const names = new Set();
  const walk = async (current) => {
    const entries = await readdir(current, {withFileTypes: true}).catch(() => []);
    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
        names.add(normalizeExistingName(entry.name));
      }
    }
  };
  await walk(directory);
  return names;
};

const stagedNames = author ? await listStagedNames(inbox) : new Set();

const targetSets = sets.filter(Boolean).length
  ? sets.filter(Boolean)
  : (await readdir(daysRoot, {withFileTypes: true}).catch(() => []))
      .filter((entry) => entry.isDirectory() && parseDayDirectoryName(entry.name))
      .map((entry) => entry.name)
      .sort();

const jobs = [];
for (const setName of targetSets) {
  const setDir = path.join(daysRoot, setName);
  const promptsPath = path.join(setDir, 'image_prompts.md');
  if (!(await exists(promptsPath))) continue;
  const entries = parseImagePrompts(await readFile(promptsPath, 'utf8'));
  for (const entry of entries) {
    const destination = path.join(setDir, 'images', entry.filename);
    if (await exists(destination)) continue;
    if (author) {
      const candidate = path.join(candidateRoot, author, setName, entry.filename);
      const stagedKey = normalizeExistingName(entry.filename);
      if ((await exists(candidate)) || stagedNames.has(stagedKey)) continue;
    }
    jobs.push({...entry, setName});
  }
}

if (listMissing) {
  console.log(JSON.stringify(jobs.slice(0, limit), null, 2));
  process.exit(0);
}
if (jobs.length === 0) {
  console.log('생성할 이미지가 없다 (모든 대상이 이미 존재).');
  process.exit(0);
}

const runJobs = jobs.slice(0, limit);
await mkdir(inbox, {recursive: true});

const extractImagePath = (output) => {
  const normalized = output.replaceAll('/', '\\');
  const matches = normalized.match(/[A-Za-z]:\\[^\r\n"'`<>|]+?\.(?:jpe?g|png|webp)/gi) ?? [];
  return [...matches].reverse().find((candidate) => {
    try {
      return candidate.trim().length > 0;
    } catch {
      return false;
    }
  })?.trim();
};

const runAgy = (job) =>
  new Promise((resolve, reject) => {
    const instruction = [
      'Use the generate_image tool exactly once.',
      job.prompt,
      ...escalations.map((key) => ESCALATIONS[key]),
      'Do not use any other tools. Do not copy, move, resize, or edit files.',
      'Reply with the generated image absolute filesystem path and nothing else.',
    ].join(' ');
    const child = spawn(AGY, ['--effort=low', '--print', instruction], {
      cwd: projectRoot,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk.toString()));
    child.stderr.on('data', (chunk) => (output += chunk.toString()));
    child.stdin.end();
    child.on('error', reject);
    child.on('close', async (code) => {
      const source = extractImagePath(output);
      if (code !== 0 || !source || !(await exists(source))) {
        reject(new Error(`${job.setName}/${job.filename}: agy exit ${code}; ${output.slice(-500)}`));
        return;
      }
      resolve(source);
    });
  });

let completed = 0;
let cursor = 0;
const failures = [];
const worker = async () => {
  while (true) {
    const index = cursor++;
    if (index >= runJobs.length) return;
    const job = runJobs[index];
    try {
      const source = await runAgy(job);
      // 목표 파일명 그대로 inbox 에 둔다 → import-images.mjs 가 규격을 맞춘다.
      const extension = path.extname(source) || '.png';
      const staged = path.join(inbox, job.filename.replace(/\.png$/i, extension));
      await copyFile(source, staged);
      completed += 1;
      console.log(`DONE ${completed}/${runJobs.length} ${job.setName}/${job.filename}`);
    } catch (error) {
      failures.push(error.message);
      console.error(`FAIL ${job.setName}/${job.filename}: ${error.message.slice(0, 200)}`);
    }
  }
};

await Promise.all(Array.from({length: concurrency}, worker));
console.log(`\n${completed}/${runJobs.length} staged in ${inbox}`);
console.log(`다음: node scripts/import-images.mjs${author ? ` --author ${author}` : ''}`);
if (failures.length > 0) {
  console.error(`${failures.length} 건 실패. 같은 명령을 다시 실행하면 누락분만 생성한다.`);
  process.exitCode = 1;
}
