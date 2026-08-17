import {
  INTRO_FRAMES,
  NARRATION_FRAMES,
  NARRATION_START_FRAME,
  SENTENCE_FRAMES,
  STUDY_FRAMES,
  VIDEO_FRAMES,
  WORD_BLOCK_FRAMES,
} from './constants';
import type {DayData} from './schema';
import type {VocaTimeline, WordTiming} from './types';

export const buildTimeline = (data: DayData): VocaTimeline => {
  if (data.words.length !== 10) {
    throw new Error('A v3 set must contain exactly 10 words.');
  }

  const words: WordTiming[] = data.words.map((_, index) => ({
    from: INTRO_FRAMES + index * WORD_BLOCK_FRAMES,
    durationInFrames: WORD_BLOCK_FRAMES,
    study: {from: 0, durationInFrames: STUDY_FRAMES},
    sentence: {from: STUDY_FRAMES, durationInFrames: SENTENCE_FRAMES},
  }));

  return {
    introDurationInFrames: INTRO_FRAMES,
    words,
    durationInFrames: VIDEO_FRAMES,
    narration: {
      assetPath: 'audio/narration.mp3',
      from: NARRATION_START_FRAME,
      durationInFrames: NARRATION_FRAMES,
    },
  };
};
