import type {CalculateMetadataFunction} from 'remotion';
import {Composition} from 'remotion';
import {FPS, HEIGHT, VIDEO_FRAMES, WIDTH} from './constants';
import {loadDayData} from './load-data';
import {normalizeDayDir} from './paths';
import {buildTimeline} from './timing';
import type {VocaSetProps} from './types';
import {VocaSet} from './VocaSet';

const calculateMetadata: CalculateMetadataFunction<VocaSetProps> = async ({
  props,
  abortSignal,
}) => {
  const dayDir = normalizeDayDir(props.dayDir);
  const data = await loadDayData(dayDir, abortSignal);
  const timeline = buildTimeline(data);

  return {
    durationInFrames: timeline.durationInFrames,
    props: {dayDir, data, timeline},
    defaultCodec: 'h264',
    defaultVideoImageFormat: 'jpeg',
    defaultPixelFormat: 'yuv420p',
    defaultOutName: dayDir.split('/').at(-1) ?? 'voca-set',
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="VocaSet"
    component={VocaSet}
    durationInFrames={VIDEO_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{dayDir: 'days/DAY01_01-10_set1'}}
    calculateMetadata={calculateMetadata}
  />
);
