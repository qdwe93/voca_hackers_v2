import {spawn} from 'node:child_process';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const EXPECTED_CONTAINER_SECONDS = 192.853;
export const DURATION_TOLERANCE_SECONDS = 0.1;
export const EXPECTED_FRAMES = 5784;

const isFile = async (filePath) =>
  stat(filePath)
    .then((value) => value.isFile())
    .catch(() => false);

const capture = (command, args, cwd) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString()));
    child.on('error', (error) => resolve({code: 1, stdout, stderr: `${stderr}${error.message}`}));
    child.on('close', (code) => resolve({code: code ?? 1, stdout, stderr}));
  });

export const probeVideo = async ({projectRoot, videoPath}) => {
  const errors = [];
  if (!(await isFile(videoPath))) return {ok: false, errors: ['MP4 없음'], probe: null};

  const ffprobe = path.join(
    projectRoot,
    'node_modules',
    '@remotion',
    'compositor-win32-x64-msvc',
    'ffprobe.exe',
  );
  if (!(await isFile(ffprobe))) return {ok: false, errors: [`ffprobe 없음: ${ffprobe}`], probe: null};

  const result = await capture(
    ffprobe,
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration:stream=codec_type,codec_name,nb_frames',
      '-of',
      'json',
      videoPath,
    ],
    projectRoot,
  );
  if (result.code !== 0) {
    return {ok: false, errors: [`ffprobe 실패: ${result.stderr.trim()}`], probe: null};
  }

  let probe;
  try {
    probe = JSON.parse(result.stdout);
  } catch (error) {
    return {ok: false, errors: [`ffprobe JSON 오류: ${error.message}`], probe: null};
  }

  const duration = Number(probe.format?.duration);
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  const frames = Number(video?.nb_frames);
  if (!Number.isFinite(duration) || Math.abs(duration - EXPECTED_CONTAINER_SECONDS) > DURATION_TOLERANCE_SECONDS) {
    errors.push(`길이 ${Number.isFinite(duration) ? duration.toFixed(3) : 'N/A'}초`);
  }
  if (video?.codec_name !== 'h264') errors.push(`비디오 코덱 ${video?.codec_name ?? '없음'}`);
  if (!audio) errors.push('오디오 스트림 없음');
  if (!Number.isFinite(frames) || frames !== EXPECTED_FRAMES) {
    errors.push(`프레임 ${Number.isFinite(frames) ? frames : 'N/A'}`);
  }
  return {ok: errors.length === 0, errors, probe: {duration, frames, video, audio}};
};

export const verifySetImages = async (setDir) => {
  const errors = [];
  const wordsPath = path.join(setDir, 'words.json');
  if (!(await isFile(wordsPath))) return {ok: false, errors: ['words.json 없음']};
  const data = JSON.parse(await readFile(wordsPath, 'utf8'));
  const expected = (data.words ?? []).flatMap((item) => [
    {name: path.basename(item.wordImage), width: 1024, height: 1024},
    {name: path.basename(item.sentenceImage), width: 1600, height: 900},
  ]);
  for (const item of expected) {
    const imagePath = path.join(setDir, 'images', item.name);
    if (!(await isFile(imagePath))) {
      errors.push(`${item.name}: 없음`);
      continue;
    }
    try {
      const metadata = await sharp(imagePath).metadata();
      if (metadata.format !== 'png' || metadata.width !== item.width || metadata.height !== item.height) {
        errors.push(
          `${item.name}: ${metadata.format ?? '?'} ${metadata.width ?? '?'}x${metadata.height ?? '?'}`,
        );
      }
    } catch (error) {
      errors.push(`${item.name}: 읽기 실패 (${error.message})`);
    }
  }
  const actualCount = (await readdir(path.join(setDir, 'images')).catch(() => [])).filter((name) =>
    name.toLowerCase().endsWith('.png'),
  ).length;
  if (actualCount !== expected.length) errors.push(`PNG 개수 ${actualCount}/${expected.length}`);
  return {ok: errors.length === 0, errors};
};

export const verifySetAudio = async (setDir) => {
  const narration = path.join(setDir, 'audio', 'narration.mp3');
  if (!(await isFile(narration))) return {ok: false, errors: ['narration.mp3 없음']};
  const reportPath = path.join(setDir, 'audio_report.json');
  if (!(await isFile(reportPath))) return {ok: false, errors: ['audio_report.json 없음']};
  try {
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const errors = [];
    if (report.overflowCount !== 0) errors.push(`overflowCount=${report.overflowCount ?? '없음'}`);
    if (report.trackDurationSeconds !== 190) {
      errors.push(`trackDurationSeconds=${report.trackDurationSeconds ?? '없음'}`);
    }
    return {ok: errors.length === 0, errors};
  } catch (error) {
    return {ok: false, errors: [`audio_report.json 오류: ${error.message}`]};
  }
};
