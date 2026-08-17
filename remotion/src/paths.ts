const trimSlashes = (value: string) => value.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');

export const normalizeDayDir = (value: string): string => {
  const normalized = trimSlashes(value);
  const segments = normalized.split('/');

  if (!normalized || segments.some((segment) => segment === '..' || segment === '.')) {
    throw new Error(`Invalid dayDir: ${value}`);
  }

  if (normalized !== 'days' && !normalized.startsWith('days/')) {
    throw new Error(
      'dayDir must point inside public/days/. Example: days/DAY18_21-30_set1',
    );
  }

  return normalized;
};

export const joinPublicPath = (dayDir: string, assetPath: string): string => {
  const normalizedDayDir = normalizeDayDir(dayDir);
  const normalizedAsset = trimSlashes(assetPath);

  if (
    !normalizedAsset ||
    normalizedAsset.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Invalid asset path: ${assetPath}`);
  }

  return `${normalizedDayDir}/${normalizedAsset}`;
};
