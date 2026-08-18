import {spawn} from 'node:child_process';
import {mkdir, readdir, rename, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {probeVideo} from './media-verification.mjs';

const args = process.argv.slice(2);
let filter = '';
if (args.length > 0) {
  if (args.length !== 2 || args[0] !== '--filter') {
    console.error('Usage: node scripts/render-batch.mjs [--filter DAY01]');
    process.exit(2);
  }
  filter = args[1];
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const daysRoot = path.join(projectRoot, 'public', 'days');
const outRoot = path.join(projectRoot, 'out');
const checkScript = path.join(projectRoot, 'scripts', 'check-assets.mjs');
const sheetScript = path.join(projectRoot, 'scripts', 'make-rendered-contact-sheets.mjs');
const remotionCli = path.join(projectRoot, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
const FPS = 30;
const INTRO_SECONDS = 2.4;
const WORD_BLOCK_SECONDS = 19;

const isFile = async (filePath) => {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
};

const run = (command, commandArgs, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, commandArgs, {cwd: projectRoot, stdio: 'inherit', ...options});
    child.on('error', (error) => resolve({code: 1, error}));
    child.on('close', (code) => resolve({code: code ?? 1}));
  });

const quarantine = async (videoPath) => {
  const parsed = path.parse(videoPath);
  const timestamp = new Date().toISOString().replaceAll(':', '').replaceAll('.', '');
  const badPath = path.join(parsed.dir, `${parsed.name}.bad-${timestamp}${parsed.ext}`);
  await rename(videoPath, badPath);
  return badPath;
};

const makeQa = async (setName) => {
  const qaDir = path.join(outRoot, 'qa-frames', setName);
  await mkdir(qaDir, {recursive: true});
  const props = `--props=${JSON.stringify({dayDir: `days/${setName}`})}`;
  for (let index = 0; index < 10; index += 1) {
    const position = String(index + 1).padStart(2, '0');
    for (const [kind, offset] of [
      ['study', 5],
      ['sentence', 13],
    ]) {
      const seconds = INTRO_SECONDS + index * WORD_BLOCK_SECONDS + offset;
      const frame = Math.round(seconds * FPS);
      const output = path.join(qaDir, `word${position}-${kind}.png`);
      const still = await run(process.execPath, [
        remotionCli,
        'still',
        'src/index.ts',
        'VocaSet',
        output,
        `--frame=${frame}`,
        props,
      ]);
      if (still.code !== 0) throw new Error(`${setName}: QA frame ${position}-${kind} failed`);
    }
  }
  const sheet = await run(process.execPath, [sheetScript, qaDir]);
  if (sheet.code !== 0) throw new Error(`${setName}: rendered contact sheet failed`);
  return qaDir;
};

await mkdir(outRoot, {recursive: true});
const entries = await readdir(daysRoot, {withFileTypes: true});
const setNames = entries
  .filter((entry) => entry.isDirectory() && /^DAY\d{2}_\d{2}-\d{2}_set[1-4]$/.test(entry.name))
  .map((entry) => entry.name)
  .filter((name) => !filter || name.includes(filter))
  .sort();

const rows = [];
for (const setName of setNames) {
  const output = path.join(outRoot, `${setName}.mp4`);
  let rendered = false;
  if (await isFile(output)) {
    const existingProbe = await probeVideo({projectRoot, videoPath: output});
    if (existingProbe.ok) {
      try {
        await makeQa(setName);
        rows.push({set: setName, result: 'OK existing + QA', seconds: 0});
      } catch (error) {
        rows.push({set: setName, result: `FAIL QA: ${error.message}`, seconds: 0});
      }
      continue;
    }
    const badPath = await quarantine(output);
    console.error(`INVALID ${setName}: ${existingProbe.errors.join('; ')} → ${badPath}`);
  }

  const gate = await run(process.execPath, [checkScript, '--set', setName]);
  if (gate.code !== 0) {
    rows.push({set: setName, result: 'FAIL asset gate', seconds: 0});
    continue;
  }

  const started = performance.now();
  const render = await run(process.execPath, [
    remotionCli,
    'render',
    'src/index.ts',
    'VocaSet',
    output,
    `--props=${JSON.stringify({dayDir: `days/${setName}`})}`,
    '--codec=h264',
    '--pixel-format=yuv420p',
  ]);
  const seconds = (performance.now() - started) / 1000;
  if (render.code !== 0) {
    rows.push({set: setName, result: 'FAIL render', seconds});
    continue;
  }
  rendered = true;

  const probe = await probeVideo({projectRoot, videoPath: output});
  if (!probe.ok) {
    const badPath = await quarantine(output);
    rows.push({set: setName, result: `FAIL probe → ${path.basename(badPath)}`, seconds});
    console.error(`FAIL ${setName}: ${probe.errors.join('; ')}`);
    continue;
  }

  try {
    await makeQa(setName);
    rows.push({set: setName, result: rendered ? 'OK rendered + probe + QA' : 'OK probe + QA', seconds});
  } catch (error) {
    rows.push({set: setName, result: `FAIL QA: ${error.message}`, seconds});
  }
}

if (setNames.length === 0) console.log('No matching set directories found.');
console.table(rows);
process.exit(rows.some((row) => row.result.startsWith('FAIL')) ? 1 : 0);
