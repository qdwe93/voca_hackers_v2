import {staticFile} from 'remotion';
import {dayDataSchema, type DayData} from './schema';
import {normalizeDayDir} from './paths';

const fetchJson = async (url: string, signal: AbortSignal): Promise<unknown> => {
  const response = await fetch(url, {signal});
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
};

export const loadDayData = async (
  dayDir: string,
  signal: AbortSignal,
): Promise<DayData> => {
  const normalizedDayDir = normalizeDayDir(dayDir);
  const raw = await fetchJson(staticFile(`${normalizedDayDir}/words.json`), signal);
  const parsed = dayDataSchema.safeParse(raw);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid words.json in ${normalizedDayDir}:\n${details}`);
  }

  return parsed.data;
};
