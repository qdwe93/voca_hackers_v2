import {copyFile, mkdir, readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {expectedImagePath, parseDayDirectoryName} from './content-schema.mjs';

// 3단계 선별. AI별로 만들어 둔 이미지 후보 중 하나를 최종 위치로 올린다.
// 세트 단위(한 AI 로 20장 통째)와 자산 단위(파일별로 다른 AI) 둘 다 된다.
//
//   content/image-candidates/<author>/<set>/<파일명>  →  public/days/<set>/images/<파일명>

const usage = `Usage: node scripts/pick-images.mjs [options]

  --author <name>     이 AI 의 후보를 올린다
  --set <name>        대상 세트 (반복 가능, 생략하면 그 author 의 후보 전부)
  --file <name>       특정 파일만 (반복 가능, --set 과 함께 쓴다)
  --from-list <file>  줄마다 "<set>/<파일명> <author>" 인 목록으로 골라 올린다
  --replace           최종 위치의 기존 이미지를 덮어쓴다
  --dry-run           무엇이 올라갈지만 출력한다
`;

const args = process.argv.slice(2);
const sets = [];
const files = [];
let author = '';
let fromList = '';
let replace = false;
let dryRun = false;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--author') author = args[++i] ?? '';
  else if (arg === '--set') sets.push(args[++i] ?? '');
  else if (arg === '--file') files.push(args[++i] ?? '');
  else if (arg === '--from-list') fromList = args[++i] ?? '';
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
if (!author && !fromList) {
  console.error(usage);
  process.exit(2);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const daysRoot = path.join(projectRoot, 'public', 'days');
const candidateRoot = path.resolve(projectRoot, '..', 'content', 'image-candidates');
const exists = async (target) => stat(target).then(() => true).catch(() => false);

const targetFilenames = async (setName) => {
  const data = JSON.parse(await readFile(path.join(daysRoot, setName, 'words.json'), 'utf8'));
  return data.words.flatMap((item) => [
    path.basename(expectedImagePath(item, 'word')),
    path.basename(expectedImagePath(item, 'sent')),
  ]);
};

// 옮길 목록을 (author, set, filename) 으로 평탄화한다.
const picks = [];
if (fromList) {
  const text = await readFile(path.resolve(process.cwd(), fromList), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [target, listAuthor] = trimmed.split(/\s+/);
    const [setName, filename] = target.split('/');
    if (!setName || !filename || !listAuthor) {
      console.error(`목록 형식 오류: ${line}`);
      process.exit(2);
    }
    picks.push({author: listAuthor, setName, filename});
  }
} else {
  const targetSets = sets.filter(Boolean).length
    ? sets.filter(Boolean)
    : (await readdir(path.join(candidateRoot, author), {withFileTypes: true}).catch(() => []))
        .filter((entry) => entry.isDirectory() && parseDayDirectoryName(entry.name))
        .map((entry) => entry.name)
        .sort();

  for (const setName of targetSets) {
    const wanted = files.filter(Boolean).length ? files.filter(Boolean) : await targetFilenames(setName);
    for (const filename of wanted) picks.push({author, setName, filename});
  }
}

let copied = 0;
let skipped = 0;
let failed = 0;
const missingBySet = new Map();

for (const pick of picks) {
  const source = path.join(candidateRoot, pick.author, pick.setName, pick.filename);
  const destination = path.join(daysRoot, pick.setName, 'images', pick.filename);
  const label = `${pick.setName}/${pick.filename}`;

  if (!(await exists(source))) {
    failed += 1;
    if (!missingBySet.has(pick.setName)) missingBySet.set(pick.setName, []);
    missingBySet.get(pick.setName).push(pick.filename);
    continue;
  }
  if ((await exists(destination)) && !replace) {
    skipped += 1;
    continue;
  }
  if (dryRun) {
    console.log(`DRY  ${label} ← ${pick.author}`);
    continue;
  }
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(source, destination);
  copied += 1;
  console.log(`OK   ${label} ← ${pick.author}`);
}

for (const [setName, list] of missingBySet) {
  console.error(`MISS ${setName} — 후보 없음 ${list.length}장: ${list.slice(0, 4).join(', ')}${list.length > 4 ? ' …' : ''}`);
}
console.log(`\npicked ${copied}, skipped ${skipped}(이미 있음), missing ${failed}`);
if (failed > 0) {
  console.error('누락분은 다른 author 후보로 채우거나 재생성한다 (P2 참조).');
  process.exitCode = 1;
}
