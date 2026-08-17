import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TAIL_FRAMES} from './constants';
import {joinPublicPath} from './paths';
import type {VocaWord} from './schema';
import type {StageTiming, VocaSetProps, WordTiming} from './types';

const COLORS = {
  ink: '#f7f5ff',
  muted: '#b9b7ca',
  violet: '#8d6cff',
  cyan: '#42d7ff',
  gold: '#ffc85a',
  panel: 'rgba(18, 17, 37, 0.88)',
};

const fontFamily =
  'Inter, Pretendard, "Noto Sans KR", "Segoe UI", Arial, sans-serif';

const fill: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
};

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(circle at 12% 12%, rgba(113, 85, 255, 0.38), transparent 32%), radial-gradient(circle at 84% 18%, rgba(40, 198, 255, 0.26), transparent 34%), linear-gradient(135deg, #090918 0%, #16132c 52%, #080b1a 100%)',
      overflow: 'hidden',
      fontFamily,
      color: COLORS.ink,
    }}
  >
    <div
      style={{
        ...fill,
        opacity: 0.16,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        transform: 'perspective(760px) rotateX(64deg) scale(1.75) translateY(210px)',
        transformOrigin: 'bottom center',
      }}
    />
    <div
      style={{
        position: 'absolute',
        width: 560,
        height: 560,
        right: -170,
        bottom: -240,
        borderRadius: '50%',
        border: '2px solid rgba(96, 218, 255, 0.24)',
        boxShadow: '0 0 90px rgba(66, 215, 255, 0.2)',
      }}
    />
  </AbsoluteFill>
);

const Intro: React.FC<{title: string; day: number; set: number}> = ({title, day, set}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame, fps, config: {damping: 16, stiffness: 120}});
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Background />
      <div
        style={{
          position: 'absolute',
          inset: 100,
          border: '2px solid rgba(255,255,255,.12)',
          borderRadius: 48,
          background: 'linear-gradient(140deg, rgba(24,22,52,.9), rgba(9,18,38,.82))',
          boxShadow: '0 36px 100px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
          transform: `scale(${0.9 + entrance * 0.1})`,
        }}
      >
        <div style={{textAlign: 'center'}}>
          <div
            style={{
              color: COLORS.cyan,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 10,
              marginBottom: 34,
            }}
          >
            HACKERS VOCA QUEST
          </div>
          <div
            style={{
              fontSize: 118,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: -5,
              textShadow: '0 0 46px rgba(141,108,255,.42)',
            }}
          >
            {title}
          </div>
          <div
            style={{
              margin: '44px auto 0',
              width: 'fit-content',
              padding: '16px 32px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,.18)',
              background: 'rgba(255,255,255,.07)',
              color: COLORS.muted,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            DAY {String(day).padStart(2, '0')} · SET {set} · 10 WORDS
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Header: React.FC<{
  day: number;
  set: number;
  position: number;
  wordNo: number;
  progress: number;
}> = ({day, set, position, wordNo, progress}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 72,
        top: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
      }}
    >
      <div style={{fontSize: 25, fontWeight: 850, letterSpacing: 4, color: COLORS.cyan}}>
        DAY {String(day).padStart(2, '0')} · SET {set}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <span style={{color: COLORS.muted, fontSize: 24, fontWeight: 700}}>
          WORD {wordNo}
        </span>
        <span
          style={{
            minWidth: 104,
            padding: '10px 16px',
            borderRadius: 16,
            background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.1)',
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 850,
          }}
        >
          {String(position).padStart(2, '0')} / 10
        </span>
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 72,
        top: 104,
        height: 6,
        borderRadius: 999,
        overflow: 'hidden',
        background: 'rgba(255,255,255,.1)',
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: `${Math.max(2, Math.min(100, progress * 100))}%`,
          height: '100%',
          borderRadius: 999,
          background: `linear-gradient(90deg, ${COLORS.violet}, ${COLORS.cyan})`,
          boxShadow: `0 0 18px ${COLORS.cyan}`,
        }}
      />
    </div>
  </>
);

const GameImageCard: React.FC<{src: string}> = ({src}) => (
  <div
    style={{
      width: 760,
      height: 760,
      padding: 13,
      borderRadius: 48,
      background: `linear-gradient(145deg, rgba(255,255,255,.34), ${COLORS.violet}, rgba(66,215,255,.7))`,
      boxShadow: '0 38px 90px rgba(0,0,0,.48), 0 0 28px rgba(141,108,255,.38)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 38,
        overflow: 'hidden',
        background: '#272341',
      }}
    >
      <Img
        src={src}
        style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 80px rgba(5,5,20,.28)',
        }}
      />
    </div>
  </div>
);

const WordCopy: React.FC<{
  item: VocaWord;
  reveal: number;
}> = ({item, reveal}) => {
  return (
    <div
      style={{
        width: 850,
        minHeight: 650,
        padding: '58px 62px',
        borderRadius: 44,
        background: COLORS.panel,
        border: '1px solid rgba(255,255,255,.13)',
        boxShadow: '0 34px 100px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 34}px)`,
      }}
    >
      <div
        style={{
          color: COLORS.cyan,
          fontSize: 25,
          fontWeight: 900,
          letterSpacing: 5,
          marginBottom: 30,
        }}
      >
        WORD QUEST
      </div>
      <div
        style={{
          fontSize: item.word.length > 12 ? 96 : 118,
          lineHeight: 0.98,
          fontWeight: 950,
          letterSpacing: -4,
          textShadow: '0 12px 40px rgba(0,0,0,.38)',
        }}
      >
        {item.word}
      </div>
      <div
        style={{
          marginTop: 25,
          fontSize: 40,
          fontWeight: 850,
          color: COLORS.gold,
        }}
      >
        {item.partOfSpeech} {item.meaningKo}
      </div>
      <div style={{marginTop: 13, color: COLORS.muted, fontSize: 28, fontWeight: 600}}>
        {item.ipa}
      </div>
      <div
        style={{
          height: 2,
          margin: '38px 0',
          background: 'linear-gradient(90deg, rgba(255,255,255,.18), transparent)',
        }}
      />
      <div
        style={{
          minHeight: 126,
          fontSize: 38,
          lineHeight: 1.42,
          fontWeight: 650,
          color: COLORS.ink,
        }}
      >
        {item.definition}
      </div>
    </div>
  );
};

const HighlightedSentence: React.FC<{sentence: string; word: string}> = ({sentence, word}) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = sentence.split(new RegExp(`((?<![A-Za-z])${escaped}(?![A-Za-z]))`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLocaleLowerCase('en-US') === word.toLocaleLowerCase('en-US') ? (
          <span
            // The sentence order is stable and duplicate parts are valid here.
            key={`${part}-${index}`}
            style={{color: COLORS.gold, textShadow: '0 0 20px rgba(255,200,90,.28)'}}
          >
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
};

const SentenceCard: React.FC<{item: VocaWord; src: string; reveal: number}> = ({
  item,
  src,
  reveal,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 160,
      right: 160,
      top: 130,
      bottom: 50,
      borderRadius: 48,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,.16)',
      background: '#111020',
      boxShadow: '0 42px 120px rgba(0,0,0,.52)',
      opacity: reveal,
      transform: `scale(${0.97 + reveal * 0.03})`,
    }}
  >
    <Img src={src} style={{...fill, width: '100%', height: '100%', objectFit: 'cover'}} />
    <div
      style={{
        ...fill,
        background:
          'linear-gradient(0deg, rgba(6,7,18,.98) 0%, rgba(7,8,21,.9) 26%, rgba(7,8,21,.18) 48%, transparent 66%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        bottom: 42,
        minHeight: 185,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 46,
      }}
    >
      <div style={{flex: 1}}>
        <div
          style={{
            color: COLORS.cyan,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 5,
            marginBottom: 16,
          }}
        >
          MISSION PHRASE
        </div>
        <div style={{fontSize: 43, lineHeight: 1.3, fontWeight: 820, letterSpacing: -1.2}}>
          <HighlightedSentence sentence={item.sentence} word={item.word} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          color: COLORS.muted,
          fontSize: 27,
          fontWeight: 750,
          whiteSpace: 'nowrap',
          paddingBottom: 8,
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 13,
            background: 'rgba(141,108,255,.22)',
            color: COLORS.violet,
          }}
        >
          ✓
        </span>
        {item.word} · {item.partOfSpeech} {item.meaningKo}
      </div>
    </div>
  </div>
);

const isWithin = (frame: number, stage: StageTiming) =>
  frame >= stage.from && frame < stage.from + stage.durationInFrames;

const WordScene: React.FC<{
  dayDir: string;
  day: number;
  set: number;
  item: VocaWord;
  timing: WordTiming;
  position: number;
}> = ({dayDir, day, set, item, timing, position}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stage: 'study' | 'sentence' = isWithin(frame, timing.study) ? 'study' : 'sentence';
  const sentenceReveal =
    stage === 'sentence'
      ? interpolate(
          frame,
          [timing.sentence.from, timing.sentence.from + Math.round(fps * 0.4)],
          [0, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        )
      : 0;
  const overallProgress = ((position - 1) + frame / timing.durationInFrames) / 10;
  const wordImage = staticFile(joinPublicPath(dayDir, item.wordImage));
  const sentenceImage = staticFile(joinPublicPath(dayDir, item.sentenceImage));

  return (
    <AbsoluteFill>
      <Background />
      <Header
        day={day}
        set={set}
        position={position}
        wordNo={item.no}
        progress={overallProgress}
      />
      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 150,
          bottom: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 92,
          opacity: 1 - sentenceReveal,
        }}
      >
        <GameImageCard src={wordImage} />
        <WordCopy item={item} reveal={1} />
      </div>
      {stage === 'sentence' ? (
        <SentenceCard item={item} src={sentenceImage} reveal={sentenceReveal} />
      ) : null}
    </AbsoluteFill>
  );
};

export const VocaSet: React.FC<VocaSetProps> = ({dayDir, data, timeline}) => {
  if (!data || !timeline) {
    throw new Error('VocaSet requires metadata resolved by calculateMetadata().');
  }

  return (
    <AbsoluteFill style={{backgroundColor: '#090918', color: COLORS.ink, fontFamily}}>
      <Sequence durationInFrames={timeline.introDurationInFrames} premountFor={30}>
        <Intro title={data.title} day={data.day} set={data.set} />
      </Sequence>
      {data.words.map((item, index) => {
        const timing = timeline.words[index];
        const isLastWord = index === data.words.length - 1;
        return (
          <Sequence
            key={`${item.no}-${item.word}`}
            from={timing.from}
            durationInFrames={timing.durationInFrames + (isLastWord ? TAIL_FRAMES : 0)}
            premountFor={30}
            name={`${item.no}. ${item.word}`}
          >
            <WordScene
              dayDir={dayDir}
              day={data.day}
              set={data.set}
              item={item}
              timing={timing}
              position={index + 1}
            />
          </Sequence>
        );
      })}
      {timeline.narration ? (
        <Sequence
          from={timeline.narration.from}
          durationInFrames={timeline.narration.durationInFrames}
          name="Narration"
        >
          <Audio src={staticFile(joinPublicPath(dayDir, timeline.narration.assetPath))} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
