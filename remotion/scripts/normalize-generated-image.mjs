import {mkdir, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const [kind, inputArg, outputArg] = process.argv.slice(2);
if (!['word', 'sent'].includes(kind) || !inputArg || !outputArg) {
  console.error('Usage: node scripts/normalize-generated-image.mjs <word|sent> <input> <output.png>');
  process.exit(2);
}
const input = path.resolve(inputArg);
const output = path.resolve(outputArg);
try {
  if ((await stat(output)).isFile()) throw new Error(`Refusing to overwrite ${output}`);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
const [width, height] = kind === 'word' ? [1024, 1024] : [1600, 900];
await mkdir(path.dirname(output), {recursive: true});
await sharp(input, {failOn: 'error'})
  .resize(width, height, {fit: 'cover', position: 'centre'})
  .png({compressionLevel: 9})
  .toFile(output);
console.log(`${input} -> ${output} (${width}x${height} PNG)`);
