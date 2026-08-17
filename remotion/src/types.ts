import type {DayData} from './schema';

export type StageTiming = {
  from: number;
  durationInFrames: number;
};

export type WordTiming = {
  from: number;
  durationInFrames: number;
  study: StageTiming;
  sentence: StageTiming;
};

export type VocaTimeline = {
  introDurationInFrames: number;
  words: WordTiming[];
  durationInFrames: number;
  narration: {
    assetPath: 'audio/narration.mp3';
    from: number;
    durationInFrames: number;
  };
};

export type VocaSetProps = {
  dayDir: string;
  data?: DayData;
  timeline?: VocaTimeline;
};
