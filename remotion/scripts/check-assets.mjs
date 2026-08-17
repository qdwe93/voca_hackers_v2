import {execFile} from 'node:child_process';
import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

import {
  loadHackersCsv,
  parseDayDirectoryName,
  validateContentData,
} from './content-schema.mjs';

// 렌더 직전 게이트. 여기를 통과하면 렌더는 결정적으로 성공해야 한다.
// 인자 없이 실행하면 승격된 세트 전부를 검사한다 (30일 통짜 운영 기준).

const execFileAsync = promisify(execFile);
const args = process.argv.slice(2);
const sets = [];
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--set') sets.push(args[++i] ?? '');
  else if (arg === '--help' || arg === '-h') {
    console.log('Usage: node scripts/check-assets.mjs [--set DAY01_01-10_set1 ...]');
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const daysRoot = path.join(projectRoot, 'public', 'days');
const ffprobe = path.join(
  projectRoot,
  'node_modules',
  '@remotion',
  'compositor-win32-x64-msvc',
  process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe',
);
const csvRows = await loadHackersCsv(projectRoot);

const isFile = async (filePath) => {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
};

const probe = async (filePath) => {
  const {stdout} = await execFileAsync(ffprobe, [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', filePath,
  ]);
  return JSON.parse(stdout);
};

const targets = sets.filter(Boolean).length
  ? sets.filter(Boolean)
  : (await readdir(daysRoot, {withFileTypes: true}).catch(() => []))
      .filter((entry) => entry.isDirectory() && parseDayDirectoryName(entry.name))
      .map((entry) => entry.name)
      .sort();

if (targets.length === 0) {
  console.error(`${daysRoot} 에 승격된 세트가 없다.`);
  process.exit(2);
}

let failedSets = 0;
for (const setName of targets) {
  const dayDir = path.join(daysRoot, setName);
  const errors = [];
  let data = null;

  try {
    const raw = JSON.parse(await readFile(path.join(dayDir, 'words.json'), 'utf8'));
    const result = validateContentData({data: raw, directoryName: setName, csvRows});
    errors.push(...result.errors);
    data = result.data;
  } catch (error) {
    errors.push(`words.json: ${error.message}`);
  }

  if (data) {
    for (const item of data.words) {
      for (const [field, width, height] of [
        ['wordImage', 1024, 1024],
        ['sentenceImage', 1600, 900],
      ]) {
        const imagePath = path.resolve(dayDir, item[field]);
        if (!(await isFile(imagePath))) {
          errors.push(`${item.no} ${item.word}: missing ${item[field]}`);
          continue;
        }
        try {
          const metadata = await sharp(imagePath, {failOn: 'error'}).metadata();
          if (metadata.width !== width || metadata.height !== height) {
            errors.push(
              `${item.no} ${item.word}: ${item[field]} is ${metadata.width}×${metadata.height}; ` +
                `expected ${width}×${height} (import-images.mjs 로 다시 넣는다).`,
            );
          }
        } catch (error) {
          errors.push(`${item.no} ${item.word}: unreadable ${item[field]} — ${error.message}`);
        }
      }
    }

    const reportPath = path.join(dayDir, 'audio_report.json');
    const narrationPath = path.join(dayDir, 'audio', 'narration.mp3');
    if (await isFile(reportPath)) {
      const report = JSON.parse(await readFile(reportPath, 'utf8'));
      if (report.overflowCount !== 0) {
        errors.push(`audio_report.json has ${report.overflowCount} overflow segment(s).`);
      }
      if (Math.abs(report.trackDurationSeconds - 190) > 0.001) {
        errors.push(`audio_report.json track must be 190.0s; got ${report.trackDurationSeconds}.`);
      }
    } else {
      errors.push('audio_report.json is missing (build_set_audio.py 를 먼저 돌린다).');
    }
    if (!(await isFile(narrationPath))) {
      errors.push('audio/narration.mp3 is missing.');
    } else {
      const metadata = await probe(narrationPath);
      const duration = Number.parseFloat(metadata.format?.duration);
      if (!Number.isFinite(duration) || Math.abs(duration - 190) > 0.1) {
        errors.push(`narration.mp3 must be 190.0±0.1s; got ${duration}.`);
      }
    }
  }

  if (errors.length > 0) {
    failedSets += 1;
    console.error(`FAIL ${setName}`);
    for (const message of errors) console.error(`     ${message}`);
  } else {
    console.log(`OK   ${setName} — 20 images, narration 190.0s, overflow 0`);
  }
}

console.log(`\n${targets.length - failedSets}/${targets.length} sets ready to render`);
if (failedSets > 0) process.exitCode = 1;
