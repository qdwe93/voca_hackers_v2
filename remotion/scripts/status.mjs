import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {allSetNames, parseDayDirectoryName} from './content-schema.mjs';

// 30일 통짜 운영용 현황판. 단계별로 몇 세트가 남았는지가 한눈에 보여야 한다.
//   후보  : content/candidates/<author>/<set>/words.json 이 있는 author 수
//   승격  : public/days/<set>/words.json
//   프롬프트: public/days/<set>/image_prompts.md
//   이미지 : images/*.png 개수 (20 이면 완료)
//   오디오 : audio/narration.mp3
//   렌더  : out/<set>.mp4
//
// git 에는 이미지·음성·영상이 없다. 진행 상황의 근거는 언제나 이 스크립트다.

const args = process.argv.slice(2);
let showAll = false;
let dayFilter = '';
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--all') showAll = true;
  else if (arg === '--day') dayFilter = args[++i] ?? '';
  else if (arg === '--help' || arg === '-h') {
    console.log('Usage: node scripts/status.mjs [--all] [--day 07]');
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const daysRoot = path.join(projectRoot, 'public', 'days');
const outRoot = path.join(projectRoot, 'out');
const candidatesRoot = path.resolve(projectRoot, '..', 'content', 'candidates');
const imageCandidatesRoot = path.resolve(projectRoot, '..', 'content', 'image-candidates');

const exists = async (target) => stat(target).then(() => true).catch(() => false);

const listAuthors = async (root) =>
  (await readdir(root, {withFileTypes: true}).catch(() => []))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
const authors = await listAuthors(candidatesRoot);
const imageAuthors = await listAuthors(imageCandidatesRoot);

const rows = [];
for (const setName of allSetNames()) {
  if (dayFilter && !setName.startsWith(`DAY${dayFilter.padStart(2, '0')}_`)) continue;
  const setDir = path.join(daysRoot, setName);

  const candidateAuthors = [];
  for (const author of authors) {
    if (await exists(path.join(candidatesRoot, author, setName, 'words.json'))) {
      candidateAuthors.push(author);
    }
  }

  const promoted = await exists(path.join(setDir, 'words.json'));
  const prompts = await exists(path.join(setDir, 'image_prompts.md'));
  const images = (await readdir(path.join(setDir, 'images')).catch(() => [])).filter((name) =>
    name.endsWith('.png'),
  ).length;
  const imageCandidates = [];
  for (const author of imageAuthors) {
    const count = (await readdir(path.join(imageCandidatesRoot, author, setName)).catch(() => []))
      .filter((name) => name.endsWith('.png')).length;
    if (count > 0) imageCandidates.push(`${author[0]}${count}`);
  }
  const audio = await exists(path.join(setDir, 'audio', 'narration.mp3'));
  const render = await exists(path.join(outRoot, `${setName}.mp4`));

  rows.push({
    set: setName,
    후보: candidateAuthors.length ? `${candidateAuthors.length}(${candidateAuthors.map((a) => a[0]).join('')})` : '-',
    승격: promoted ? 'O' : '-',
    프롬프트: prompts ? 'O' : '-',
    이미지후보: imageCandidates.length ? imageCandidates.join(' ') : '-',
    이미지: images === 20 ? 'O' : images > 0 ? `${images}/20` : '-',
    오디오: audio ? 'O' : '-',
    렌더: render ? 'O' : '-',
  });
}

const done = (key, predicate) => rows.filter((row) => predicate(row[key])).length;
const complete = (value) => value === 'O';

const incomplete = rows.filter((row) => row.렌더 !== 'O');
console.table(showAll ? rows : incomplete.slice(0, 40));
if (!showAll && incomplete.length > 40) {
  console.log(`... 미완료 ${incomplete.length}세트 중 40개만 표시 (--all 로 전체)`);
}

const total = rows.length;
console.log(`
후보    : ${rows.filter((row) => row.후보 !== '-').length}/${total}
이미지후보: ${rows.filter((row) => row.이미지후보 !== '-').length}/${total}
승격    : ${done('승격', complete)}/${total}
프롬프트: ${done('프롬프트', complete)}/${total}
이미지  : ${done('이미지', complete)}/${total}
오디오  : ${done('오디오', complete)}/${total}
렌더    : ${done('렌더', complete)}/${total}`);

const nextPhase =
  done('승격', complete) < total
    ? '1단계 — 콘텐츠·프롬프트 (prompts/P1)'
    : done('이미지', complete) < total
      ? '2단계 — 이미지 수급 (prompts/P2)'
      : done('렌더', complete) < total
        ? '3단계 — 오디오·렌더 배치 (prompts/P3)'
        : '완료';
console.log(`\n다음 단계: ${nextPhase}`);
