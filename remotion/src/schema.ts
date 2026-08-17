import {z} from 'zod';

export const SPEAKERS = ['Zephyr', 'Liam', 'Erinome', 'Charon'] as const;
// 구버전 CustomVoice 화자 — DAY01 초기 4세트만 해당하며 새 세트에는 쓰지 않는다.
export const LEGACY_SPEAKERS = ['Aiden', 'Ryan'] as const;

export const PARTS_OF_SPEECH = [
  'n.',
  'v.',
  'adj.',
  'adv.',
  'prep.',
  'conj.',
  'pron.',
  'det.',
  'interj.',
] as const;

const relativeAssetPath = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !value.startsWith('/') && !value.startsWith('\\'), {
    message: 'Asset paths must be relative to dayDir.',
  })
  .refine(
    (value) =>
      !value.replaceAll('\\', '/').split('/').some((segment) => segment === '..'),
    {message: 'Asset paths may not contain parent-directory traversal.'},
  );

const countEnglishWords = (value: string): number =>
  value.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)?.length ?? 0;

export const vocaWordSchema = z
  .object({
    no: z.number().int().positive(),
    word: z.string().trim().regex(/^[a-z]+(?:-[a-z]+)?$/),
    partOfSpeech: z.enum(PARTS_OF_SPEECH),
    meaningKo: z.string().trim().min(1),
    ipa: z.string().trim().regex(/^\/.+\/$/, 'IPA must be wrapped in slashes.'),
    definition: z.string().trim().min(1),
    sentence: z.string().trim().min(1),
    wordImage: relativeAssetPath,
    sentenceImage: relativeAssetPath,
    speaker: z.enum([...SPEAKERS, ...LEGACY_SPEAKERS]),
    // 구버전 세트에만 남은 legacy 필드 — Base 모델은 instruct를 지원하지 않는다.
    sentenceInstruct: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Za-z][A-Za-z ,'-]*$/, 'sentenceInstruct must be short English text.')
      .optional(),
  })
  .strict();

export const dayDataSchema = z
  .object({
    schemaVersion: z.literal(3),
    day: z
      .union([z.number().int().min(1).max(30), z.string().regex(/^DAY\s+\d+$/i)])
      .transform((value) =>
        typeof value === 'number'
          ? value
          : Number.parseInt(value.replace(/\D/g, ''), 10),
      )
      .pipe(z.number().int().min(1).max(30)),
    range: z.string().regex(/^\d+\s*[-–]\s*\d+$/),
    set: z.number().int().min(1).max(4),
    title: z.string().trim().min(1),
    date: z.string().date().optional(),
    style: z.literal('B').optional(),
    words: z.array(vocaWordSchema).length(10),
  })
  .strict()
  .superRefine((data, context) => {
    const rangeMatch = data.range.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    const expectedStart = Number.parseInt(rangeMatch?.[1] ?? '0', 10);
    const expectedEnd = Number.parseInt(rangeMatch?.[2] ?? '0', 10);

    if (expectedEnd - expectedStart !== 9) {
      context.addIssue({
        code: 'custom',
        path: ['range'],
        message: `Range must cover exactly 10 consecutive numbers; got ${data.range}.`,
      });
    }

    const seenNumbers = new Set<number>();
    const seenWords = new Set<string>();
    const isLegacySet = data.words.some((item) =>
      (LEGACY_SPEAKERS as readonly string[]).includes(item.speaker),
    );
    data.words.forEach((item, index) => {
      const expectedNumber = expectedStart + index;
      if (item.no !== expectedNumber) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'no'],
          message: `Expected consecutive word number ${expectedNumber}; got ${item.no}.`,
        });
      }
      if (seenNumbers.has(item.no)) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'no'],
          message: `Duplicate word number: ${item.no}`,
        });
      }
      seenNumbers.add(item.no);

      const normalizedWord = item.word.toLocaleLowerCase('en-US');
      if (seenWords.has(normalizedWord)) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'word'],
          message: `Duplicate word: ${item.word}`,
        });
      }
      seenWords.add(normalizedWord);

      const expectedSpeaker = isLegacySet
        ? index < 5
          ? 'Aiden'
          : 'Ryan'
        : SPEAKERS[index % SPEAKERS.length];

      if (!isLegacySet && item.sentenceInstruct !== undefined) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'sentenceInstruct'],
          message: 'sentenceInstruct is legacy-only; the Base model has no instruct support.',
        });
      }
      if (item.speaker !== expectedSpeaker) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'speaker'],
          message: `Position ${index + 1} must use ${expectedSpeaker}.`,
        });
      }

      const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const targetPattern = new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, 'i');
      if (!targetPattern.test(item.sentence)) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'sentence'],
          message: `The sentence must contain the exact target word “${item.word}”.`,
        });
      }

      const definitionWordCount = countEnglishWords(item.definition);
      if (definitionWordCount > 12) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'definition'],
          message: `Definition must contain no more than 12 words; got ${definitionWordCount}.`,
        });
      }

      const sentenceWordCount = countEnglishWords(item.sentence);
      if (sentenceWordCount < 8 || sentenceWordCount > 12) {
        context.addIssue({
          code: 'custom',
          path: ['words', index, 'sentence'],
          message: `Sentence must contain 8–12 words; got ${sentenceWordCount}.`,
        });
      }
    });
  });

export type VocaWord = z.infer<typeof vocaWordSchema>;
export type DayData = z.infer<typeof dayDataSchema>;
