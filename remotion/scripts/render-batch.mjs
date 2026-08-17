import {spawn} from 'node:child_process';
import {mkdir, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

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
const remotionCli = path.join(projectRoot, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');

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
  if (await isFile(output)) {
    rows.push({set: setName, result: 'SKIP existing', seconds: 0});
    continue;
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
  rows.push({set: setName, result: render.code === 0 ? 'OK rendered' : 'FAIL render', seconds});
}

if (setNames.length === 0) console.log('No matching set directories found.');
console.table(rows);
process.exit(rows.some((row) => row.result.startsWith('FAIL')) ? 1 : 0);
