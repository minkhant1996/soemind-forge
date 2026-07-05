import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Slide, SlideProps } from './Slide';

export type ReelProps = {
  slides: (SlideProps & { seconds: number })[];
  audio?: string;          // voiceover path
  music?: string;          // optional music bed
  musicVolume?: number;    // 0..1, default 0.2
};

const FadeSlide: React.FC<{ slide: SlideProps; frames: number }> = ({ slide, frames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, frames - 12, frames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, frames], [1, 1.04]);
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      <Slide {...slide} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC<ReelProps> = ({ slides, audio, music, musicVolume = 0.2 }) => {
  const { fps } = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#F6F8FB' }}>
      {slides.map((s, i) => {
        const frames = Math.round(s.seconds * fps);
        const seq = (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <FadeSlide slide={s} frames={frames} />
          </Sequence>
        );
        from += frames;
        return seq;
      })}
      {audio ? <Audio src={audio} /> : null}
      {music ? <Audio src={music} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};
