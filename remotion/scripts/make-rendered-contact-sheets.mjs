import {stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const [qaDirArg] = process.argv.slice(2);

if (!qaDirArg) {
  console.error(
    'Usage: npm run qa:rendered-contact-sheets -- out/qa-frames/day01-01-10',
  );
  process.exit(2);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const qaRoot = path.resolve(projectRoot, 'out', 'qa-frames');
const qaDir = path.resolve(projectRoot, qaDirArg);
const relative = path.relative(qaRoot, qaDir);

if (relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error(`QA directory must stay inside ${qaRoot}.`);
}

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const makeSheet = async (kind) => {
  const columns = 5;
  const rows = 2;
  const imageWidth = 384;
  const imageHeight = 216;
  const labelHeight = 34;
  const tileHeight = labelHeight + imageHeight;
  const composites = [];

  for (let index = 1; index <= 10; index += 1) {
    const position = String(index).padStart(2, '0');
    const imagePath = path.join(qaDir, `word${position}-${kind}.png`);
    if (!(await stat(imagePath)).isFile()) {
      throw new Error(`Missing rendered QA frame: ${imagePath}`);
    }
    const left = ((index - 1) % columns) * imageWidth;
    const top = Math.floor((index - 1) / columns) * tileHeight;
    const image = await sharp(imagePath)
      .resize(imageWidth, imageHeight, {fit: 'cover', position: 'centre'})
      .png()
      .toBuffer();
    const labelText = `${position} · ${kind}`;
    const label = Buffer.from(
      `<svg width="${imageWidth}" height="${labelHeight}">
        <rect width="100%" height="100%" fill="#111827"/>
        <text x="12" y="24" fill="#f9fafb" font-family="Arial, sans-serif" font-size="18" font-weight="700">${escapeXml(labelText)}</text>
      </svg>`,
    );
    composites.push({input: label, left, top});
    composites.push({input: image, left, top: top + labelHeight});
  }

  const outputPath = path.join(qaDir, `contact-rendered-${kind}.png`);
  await sharp({
    create: {
      width: columns * imageWidth,
      height: rows * tileHeight,
      channels: 3,
      background: '#030712',
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
  console.log(outputPath);
};

await makeSheet('study');
await makeSheet('sentence');
