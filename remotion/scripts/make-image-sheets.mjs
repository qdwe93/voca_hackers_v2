import {mkdir, readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

import {expectedImagePath, parseDayDirectoryName} from './content-schema.mjs';

// 선별용 대지(contact sheet). 세트 하나를 AI별로 한 장씩 만들어 나란히 비교한다.
// 단어 이미지 10장 + 예문 이미지 10장을 4열 격자에 파일명 라벨과 함께 붙인다.

const CELL = 320;
const COLUMNS = 4;
const LABEL = 26;

const usage = `Usage: node scripts/make-image-sheets.mjs [options]

  --set <name>     대상 세트 (반복 가능)
  --day <nn>       그 DAY 의 4세트 전부
  --author <name>  이 AI 후보만 (반복 가능, 생략하면 후보 전부 + 최종)
  --final          최종 위치(public/days/*/images)도 대지로 만든다
`;

const args = process.argv.slice(2);
const sets = [];
const authors = [];
const days = [];
let includeFinal = false;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--set') sets.push(args[++i] ?? '');
  else if (arg === '--day') days.push((args[++i] ?? '').padStart(2, '0'));
  else if (arg === '--author') authors.push(args[++i] ?? '');
  else if (arg === '--final') includeFinal = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(usage);
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}\n\n${usage}`);
    process.exit(2);
  }
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const daysRoot = path.join(projectRoot, 'public', 'days');
const candidateRoot = path.resolve(projectRoot, '..', 'content', 'image-candidates');
const outputRoot = path.join(projectRoot, 'out', 'qa-images');
const exists = async (target) => stat(target).then(() => true).catch(() => false);

const promotedSets = (await readdir(daysRoot, {withFileTypes: true}).catch(() => []))
  .filter((entry) => entry.isDirectory() && parseDayDirectoryName(entry.name))
  .map((entry) => entry.name)
  .sort();

let targetSets = sets.filter(Boolean);
if (days.length > 0) {
  targetSets.push(...promotedSets.filter((name) => days.some((day) => name.startsWith(`DAY${day}_`))));
}
if (targetSets.length === 0) targetSets = promotedSets;
targetSets = [...new Set(targetSets)];
if (targetSets.length === 0) {
  console.error('대상 세트가 없다 (승격된 words.json 이 있어야 한다).');
  process.exit(2);
}

const availableAuthors = (await readdir(candidateRoot, {withFileTypes: true}).catch(() => []))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const useAuthors = authors.filter(Boolean).length ? authors.filter(Boolean) : availableAuthors;

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const labelBuffer = async (text, width) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${LABEL}">` +
        `<rect width="100%" height="100%" fill="#111827"/>` +
        `<text x="6" y="18" font-family="Segoe UI, sans-serif" font-size="14" fill="#e5e7eb">` +
        `${escapeXml(text)}</text></svg>`,
    ),
  )
    .png()
    .toBuffer();

const buildSheet = async ({setName, label, resolveImage, output}) => {
  const data = JSON.parse(await readFile(path.join(daysRoot, setName, 'words.json'), 'utf8'));
  const cells = [];
  for (const item of data.words) {
    for (const kind of ['word', 'sent']) {
      const filename = path.basename(expectedImagePath(item, kind));
      cells.push({filename, source: resolveImage(filename)});
    }
  }

  const rows = Math.ceil(cells.length / COLUMNS);
  const composites = [];
  let present = 0;
  for (const [index, cell] of cells.entries()) {
    const left = (index % COLUMNS) * CELL;
    const top = Math.floor(index / COLUMNS) * (CELL + LABEL);
    if (await exists(cell.source)) {
      present += 1;
      composites.push({
        input: await sharp(cell.source).resize(CELL, CELL, {fit: 'contain', background: '#0b1120'}).png().toBuffer(),
        left,
        top,
      });
    } else {
      composites.push({
        input: await sharp({
          create: {width: CELL, height: CELL, channels: 3, background: '#1f2937'},
        })
          .png()
          .toBuffer(),
        left,
        top,
      });
    }
    composites.push({input: await labelBuffer(cell.filename, CELL), left, top: top + CELL});
  }

  await mkdir(path.dirname(output), {recursive: true});
  await sharp({
    create: {
      width: COLUMNS * CELL,
      height: rows * (CELL + LABEL),
      channels: 3,
      background: '#0b1120',
    },
  })
    .composite(composites)
    .png()
    .toFile(output);
  console.log(`${label.padEnd(10)} ${setName} — ${present}/${cells.length}장 → ${path.relative(projectRoot, output)}`);
};

for (const setName of targetSets) {
  for (const author of useAuthors) {
    const authorDir = path.join(candidateRoot, author, setName);
    if (!(await exists(authorDir))) continue;
    await buildSheet({
      setName,
      label: author,
      resolveImage: (filename) => path.join(authorDir, filename),
      output: path.join(outputRoot, `${setName}__${author}.png`),
    });
  }
  if (includeFinal || useAuthors.length === 0) {
    await buildSheet({
      setName,
      label: 'final',
      resolveImage: (filename) => path.join(daysRoot, setName, 'images', filename),
      output: path.join(outputRoot, `${setName}__final.png`),
    });
  }
}
