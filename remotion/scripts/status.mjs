import {readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {allSetNames} from './content-schema.mjs';
import {probeVideo, verifySetAudio, verifySetImages} from './media-verification.mjs';

const args = process.argv.slice(2);
let showAll = false;
let dayFilter = '';
let verify = false;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--all') showAll = true;
  else if (arg === '--day') dayFilter = args[++i] ?? '';
  else if (arg === '--verify') verify = true;
  else if (arg === '--help' || arg === '-h') {
    console.log('Usage: node scripts/status.mjs [--all] [--day 07] [--verify]');
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
const phase = [];
const verifyIssues = [];

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
  const imageNames = (await readdir(path.join(setDir, 'images')).catch(() => [])).filter((name) =>
    name.toLowerCase().endsWith('.png'),
  );
  const imageCandidates = [];
  let candidateReady = false;
  for (const author of imageAuthors) {
    const count = (await readdir(path.join(imageCandidatesRoot, author, setName)).catch(() => []))
      .filter((name) => name.toLowerCase().endsWith('.png')).length;
    if (count > 0) imageCandidates.push(`${author}:${count}`);
    if (count >= 20) candidateReady = true;
  }

  const narrationExists = await exists(path.join(setDir, 'audio', 'narration.mp3'));
  const videoPath = path.join(outRoot, `${setName}.mp4`);
  const renderExists = await exists(videoPath);
  let imageStatus = imageNames.length === 20 ? 'O' : imageNames.length > 0 ? `${imageNames.length}/20` : '-';
  let audioStatus = narrationExists ? 'O' : '-';
  let renderStatus = renderExists ? 'O' : '-';

  if (verify && promoted) {
    if (imageNames.length > 0) {
      const result = await verifySetImages(setDir);
      imageStatus = result.ok ? 'O' : imageNames.length === 20 ? '△' : `${imageNames.length}/20`;
      if (!result.ok) verifyIssues.push(`${setName} 이미지: ${result.errors.join('; ')}`);
    }
    if (narrationExists) {
      const result = await verifySetAudio(setDir);
      audioStatus = result.ok ? 'O' : '△';
      if (!result.ok) verifyIssues.push(`${setName} 오디오: ${result.errors.join('; ')}`);
    }
    if (renderExists) {
      const result = await probeVideo({projectRoot, videoPath});
      renderStatus = result.ok ? 'O' : '△';
      if (!result.ok) verifyIssues.push(`${setName} 렌더: ${result.errors.join('; ')}`);
    }
  }

  rows.push({
    set: setName,
    후보: candidateAuthors.length ? `${candidateAuthors.length}(${candidateAuthors.join(',')})` : '-',
    승격: promoted ? 'O' : '-',
    프롬프트: prompts ? 'O' : '-',
    이미지후보: imageCandidates.length ? imageCandidates.join(' ') : '-',
    이미지: imageStatus,
    오디오: audioStatus,
    렌더: renderStatus,
  });
  phase.push({candidateReady});
}

const done = (key) => rows.filter((row) => row[key] === 'O').length;
const incomplete = rows.filter((row) => row.렌더 !== 'O');
console.table(showAll ? rows : incomplete.slice(0, 40));
if (!showAll && incomplete.length > 40) {
  console.log(`... 미완료 ${incomplete.length}세트 중 40개만 표시 (--all 로 전체)`);
}

const total = rows.length;
console.log(`
후보    : ${rows.filter((row) => row.후보 !== '-').length}/${total}
이미지후보: ${rows.filter((row) => row.이미지후보 !== '-').length}/${total}
승격    : ${done('승격')}/${total}
프롬프트: ${done('프롬프트')}/${total}
이미지  : ${done('이미지')}/${total}
오디오  : ${done('오디오')}/${total}
렌더    : ${done('렌더')}/${total}`);

if (verify) {
  console.log(`\n정밀 검증: ${verifyIssues.length === 0 ? '발견된 오류 없음' : `${verifyIssues.length}세트/항목 이상`}`);
  for (const issue of verifyIssues) console.log(`- ${issue}`);
}

const nextPhase =
  done('승격') < total
    ? '1단계 — 콘텐츠·프롬프트 (prompts/P1)'
    : done('이미지') < total
      ? phase.every((item) => item.candidateReady)
        ? '3단계 — 이미지 선별 (prompts/P3)'
        : '2단계 — 이미지 수급 (prompts/P2)'
      : done('렌더') < total
        ? '4단계 — 오디오·렌더 배치 (prompts/P4)'
        : '완료';
console.log(`\n다음 단계: ${nextPhase}`);
