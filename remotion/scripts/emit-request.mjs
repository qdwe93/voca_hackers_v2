import {readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {loadHackersCsv, parseDayDirectoryName} from './content-schema.mjs';

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--set') {
  console.error('Usage: node scripts/emit-request.mjs --set DAY03_21-30_set3');
  process.exit(2);
}

const setName = args[1];
const parsed = parseDayDirectoryName(setName);
if (!parsed) {
  console.error(`Invalid set name: ${setName}`);
  process.exit(2);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(projectRoot, '..');
const templatePath = path.join(repositoryRoot, '요청문', '1b_저장소없이_생성.txt');
const csvRows = await loadHackersCsv(projectRoot);
const wordList = [];
for (let no = parsed.start; no <= parsed.end; no += 1) {
  const key = `DAY ${String(parsed.day).padStart(2, '0')}:${no}`;
  const word = csvRows.get(key);
  if (!word) throw new Error(`hackers.csv 에 ${key}가 없다.`);
  wordList.push(`${no} ${word}`);
}

const replacements = {
  '{{WORD_LIST}}': wordList.join(' / '),
  '{{DAY}}': String(parsed.day),
  '{{DAY_PADDED}}': String(parsed.day).padStart(2, '0'),
  '{{SET}}': String(parsed.set),
  '{{RANGE}}': `${parsed.start}-${parsed.end}`,
  '{{RANGE_PADDED}}': `${String(parsed.start).padStart(2, '0')}-${String(parsed.end).padStart(2, '0')}`,
};

let output = await readFile(templatePath, 'utf8');
for (const [token, value] of Object.entries(replacements)) output = output.replaceAll(token, value);
process.stdout.write(output);
