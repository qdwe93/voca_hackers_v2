import {mkdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const [dayDirArg, outputDirArg] = process.argv.slice(2);

if (!dayDirArg || !outputDirArg) {
  console.error(
    'Usage: npm run qa:contact-sheets -- days/DAY01_01-10_set1 out/qa-frames/day01-01-10',
  );
  process.exit(2);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.resolve(projectRoot, 'public');
const dayDir = path.resolve(publicRoot, dayDirArg.replaceAll('\\', '/').replace(/^public\//, ''));
const outputDir = path.resolve(projectRoot, outputDirArg);

const assertInside = (parent, child, label) => {
  const relative = path.relative(parent, child);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside ${parent}.`);
  }
};

assertInside(path.resolve(publicRoot, 'days'), dayDir, 'dayDir');
assertInside(path.resolve(projectRoot, 'out', 'qa-frames'), outputDir, 'outputDir');

const data = JSON.parse(await readFile(path.join(dayDir, 'words.json'), 'utf8'));
if (!Array.isArray(data.words) || data.words.length !== 10) {
  throw new Error('words.json must contain exactly 10 words.');
}

await mkdir(outputDir, {recursive: true});

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const makeSheet = async ({field, suffix, imageWidth, imageHeight}) => {
  const columns = 5;
  const rows = 2;
  const labelHeight = 42;
  const tileWidth = imageWidth;
  const tileHeight = labelHeight + imageHeight;
  const width = columns * tileWidth;
  const height = rows * tileHeight;
  const composites = [];

  for (const [index, item] of data.words.entries()) {
    const left = (index % columns) * tileWidth;
    const top = Math.floor(index / columns) * tileHeight;
    const imagePath = path.resolve(dayDir, item[field]);
    assertInside(dayDir, imagePath, field);
    const image = await sharp(imagePath)
      .resize(imageWidth, imageHeight, {fit: 'cover', position: 'centre'})
      .png()
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${tileWidth}" height="${labelHeight}">
        <rect width="100%" height="100%" fill="#111827"/>
        <text x="14" y="29" fill="#f9fafb" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeXml(String(item.no).padStart(2, '0'))}. ${escapeXml(item.word)} · ${suffix}</text>
      </svg>`,
    );
    composites.push({input: label, left, top});
    composites.push({input: image, left, top: top + labelHeight});
  }

  const outputPath = path.join(outputDir, `contact-${suffix}.png`);
  await sharp({
    create: {width, height, channels: 3, background: '#030712'},
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
  console.log(outputPath);
};

await makeSheet({field: 'wordImage', suffix: 'words', imageWidth: 360, imageHeight: 360});
await makeSheet({field: 'sentenceImage', suffix: 'sentences', imageWidth: 480, imageHeight: 270});
