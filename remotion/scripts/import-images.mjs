import {mkdir, readdir, readFile, rename, stat} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

import {expectedImagePath, parseDayDirectoryName} from './content-schema.mjs';

// 어떤 AI 로 만든 이미지든 여기로 들어온다 (Codex, Google Flow, nano banana, agy, 손그림).
// 규격 책임은 전부 이 스크립트에 있다. 프롬프트는 비율·여백을 지시하지 않는다.
//
//   1. 파일명으로 대상 자산을 찾는다 (확장자·접두사·(1) 같은 꼬리표는 무시)
//   2. 테두리 단색 밴드를 잘라낸다 (약한 모델이 비율을 못 맞출 때 채우는 그 밴드)
//   3. 목표 규격으로 cover 크롭 (단어=중앙 주목 영역, 예문=위쪽 우선)
//   4. PNG 로 저장하고 원본은 inbox/_imported/ 로 치운다
//   5. 의심스러운 결과(과다 크롭·저해상도 업스케일·단색 비율)는 경고로 보고한다

const TARGETS = {
  word: {width: 1024, height: 1024},
  sent: {width: 1600, height: 900},
};
const TRIM_MIN_AREA_RATIO = 0.55; // 트림이 이보다 더 잘라내면 트림하지 않는다 (오검출 방지)
const CROP_WARN_RATIO = 0.25; // 원본의 25% 이상을 버리면 경고
const UPSCALE_WARN_RATIO = 0.9; // 목표보다 작은 원본이면 경고
const FLAT_WARN_RATIO = 0.45; // 이미지의 45% 이상이 한 가지 색이면 단색 밴드 의심

const usage = `Usage: node scripts/import-images.mjs [options]

  --from <dir>     소스 폴더 (기본 ../inbox 또는 ../inbox/<author>)
  --author <name>  AI별 보관: content/image-candidates/<name>/ 로 정규화해 넣는다
                   (생략하면 최종 위치 remotion/public/days/*/images/ 로 바로 넣는다)
  --set <name>     대상 세트를 이 세트로 제한한다 (반복 가능, 이름 충돌 해소용)
  --replace        이미 있는 이미지를 덮어쓴다 (재생성분 반영)
  --keep           원본을 _imported/ 로 옮기지 않고 그대로 둔다
  --dry-run        무엇이 어디로 갈지만 출력한다
`;

const args = process.argv.slice(2);
let fromDir = '';
const onlySets = [];
let replace = false;
let keep = false;
let dryRun = false;
let author = '';
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--from') fromDir = args[++i] ?? '';
  else if (arg === '--author') author = args[++i] ?? '';
  else if (arg === '--set') onlySets.push(args[++i] ?? '');
  else if (arg === '--replace') replace = true;
  else if (arg === '--keep') keep = true;
  else if (arg === '--dry-run') dryRun = true;
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
const inbox = fromDir
  ? path.resolve(process.cwd(), fromDir)
  : author
    ? path.resolve(projectRoot, '..', 'inbox', author)
    : path.resolve(projectRoot, '..', 'inbox');
const importedRoot = path.join(inbox, '_imported');

// ── 대상 색인: 모든 세트의 words.json 에서 기대 파일명을 모은다 ──────────────
const buildTargetIndex = async () => {
  const index = new Map();
  const entries = await readdir(daysRoot, {withFileTypes: true}).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory() || !parseDayDirectoryName(entry.name)) continue;
    if (onlySets.length > 0 && !onlySets.includes(entry.name)) continue;
    const wordsPath = path.join(daysRoot, entry.name, 'words.json');
    let data;
    try {
      data = JSON.parse(await readFile(wordsPath, 'utf8'));
    } catch {
      continue;
    }
    for (const item of data.words ?? []) {
      for (const kind of ['word', 'sent']) {
        const relative = expectedImagePath(item, kind);
        const filename = path.basename(relative);
        const key = filename.replace(/\.png$/i, '').toLowerCase();
        const target = {
          setName: entry.name,
          filename,
          kind,
          destination: author
            ? path.join(candidateRoot, author, entry.name, filename)
            : path.join(daysRoot, entry.name, 'images', filename),
        };
        if (index.has(key)) index.get(key).push(target);
        else index.set(key, [target]);
      }
    }
  }
  return index;
};

// 느슨한 파일명 매칭: "DAY18_set1__01_stomach_word (2).jpg" → "01_stomach_word"
const normalizeSourceName = (filename) => {
  const base = path.basename(filename).replace(/\.[a-z0-9]+$/i, '');
  return base
    .replace(/\s*\(\d+\)$/, '')
    .replace(/[-_ ]?(copy|final|v\d+|\d{8,})$/i, '')
    .split(/__|\s-\s/)
    .pop()
    .trim()
    .toLowerCase();
};

const listSourceFiles = async (dir) => {
  const found = [];
  const entries = await readdir(dir, {withFileTypes: true}).catch(() => []);
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await listSourceFiles(full)));
    else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) found.push(full);
  }
  return found;
};

// 단색 면적 비율 — 히스토그램 대신 축소본에서 최빈 색 비율을 센다.
const flatColorRatio = async (image) => {
  const {data, info} = await image
    .clone()
    .resize(64, 64, {fit: 'fill'})
    .raw()
    .toBuffer({resolveWithObject: true});
  const counts = new Map();
  const step = info.channels;
  for (let i = 0; i < data.length; i += step) {
    const key = `${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = (info.width * info.height) || 1;
  return Math.max(...counts.values()) / total;
};

const index = await buildTargetIndex();
if (index.size === 0) {
  console.error(
    `대상 세트를 찾지 못했다. ${daysRoot} 아래에 words.json 이 승격돼 있어야 한다 ` +
      `(promote-candidate.mjs 를 먼저 실행한다).`,
  );
  process.exit(2);
}

const sources = await listSourceFiles(inbox);
if (sources.length === 0) {
  console.log(`${inbox} 에 가져올 이미지가 없다.`);
  process.exit(0);
}

const rows = [];
let imported = 0;
let skipped = 0;
let failed = 0;

for (const source of sources) {
  const key = normalizeSourceName(source);
  const matches = index.get(key) ?? [];
  const relSource = path.relative(inbox, source);

  if (matches.length === 0) {
    rows.push({file: relSource, result: 'UNMATCHED', note: '대상 파일명 없음'});
    failed += 1;
    continue;
  }
  if (matches.length > 1) {
    rows.push({
      file: relSource,
      result: 'AMBIGUOUS',
      note: `${matches.map((m) => m.setName).join(', ')} — --set 으로 지정한다`,
    });
    failed += 1;
    continue;
  }

  const target = matches[0];
  const exists = await stat(target.destination).then(() => true).catch(() => false);
  if (exists && !replace) {
    rows.push({file: relSource, result: 'SKIP', note: `이미 있음 ${target.setName}`});
    skipped += 1;
    continue;
  }

  try {
    const spec = TARGETS[target.kind];
    let image = sharp(source, {failOn: 'error'});
    const original = await image.metadata();

    // 2단계: 단색 테두리 제거. 과하게 잘리면 되돌린다.
    const notes = [];
    const trimmed = sharp(await image.clone().trim({threshold: 12}).toBuffer());
    const trimmedMeta = await trimmed.metadata().catch(() => null);
    if (trimmedMeta) {
      const originalArea = (original.width ?? 1) * (original.height ?? 1);
      const trimmedArea = (trimmedMeta.width ?? 1) * (trimmedMeta.height ?? 1);
      if (trimmedArea / originalArea >= TRIM_MIN_AREA_RATIO && trimmedArea < originalArea) {
        image = trimmed;
        notes.push(`단색 테두리 ${Math.round((1 - trimmedArea / originalArea) * 100)}% 제거`);
      }
    }

    const beforeCrop = await image.metadata();
    const sourceAspect = (beforeCrop.width ?? 1) / (beforeCrop.height ?? 1);
    const targetAspect = spec.width / spec.height;
    const keptRatio = sourceAspect > targetAspect ? targetAspect / sourceAspect : sourceAspect / targetAspect;
    if (1 - keptRatio > CROP_WARN_RATIO) {
      notes.push(`크롭 ${Math.round((1 - keptRatio) * 100)}% (비율 불일치)`);
    }
    if ((beforeCrop.width ?? 0) < spec.width * UPSCALE_WARN_RATIO) {
      notes.push(`업스케일 ${beforeCrop.width}px → ${spec.width}px`);
    }
    const flat = await flatColorRatio(image);
    if (flat > FLAT_WARN_RATIO) {
      notes.push(`단색 ${Math.round(flat * 100)}% — 밴드/빈 화면 의심`);
    }

    if (dryRun) {
      rows.push({
        file: relSource,
        result: 'DRY',
        note: `→ ${target.setName}/${target.filename}${notes.length ? ' · ' + notes.join(' · ') : ''}`,
      });
      continue;
    }

    await mkdir(path.dirname(target.destination), {recursive: true});
    await image
      .resize(spec.width, spec.height, {
        fit: 'cover',
        // 예문은 자막 바가 하단에 깔리므로 위쪽을 살린다. 단어는 주목 영역 기준.
        position: target.kind === 'sent' ? sharp.gravity.north : sharp.strategy.attention,
      })
      .png()
      .toFile(target.destination);

    if (!keep) {
      await mkdir(importedRoot, {recursive: true});
      await rename(source, path.join(importedRoot, path.basename(source))).catch(() => {});
    }
    imported += 1;
    rows.push({
      file: relSource,
      result: exists ? 'REPLACED' : 'OK',
      note: `${target.setName}/${target.filename}${notes.length ? ' · ' + notes.join(' · ') : ''}`,
    });
  } catch (error) {
    failed += 1;
    rows.push({file: relSource, result: 'FAIL', note: error.message});
  }
}

for (const row of rows) {
  const line = `${row.result.padEnd(9)} ${row.file} ${row.note}`;
  if (row.result === 'FAIL' || row.result === 'UNMATCHED' || row.result === 'AMBIGUOUS') {
    console.error(line);
  } else {
    console.log(line);
  }
}
console.log(`\nimported ${imported}, skipped ${skipped}, failed ${failed}`);
if (failed > 0) process.exitCode = 1;
