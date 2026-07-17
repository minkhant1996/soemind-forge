import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { Slide, SlideProps } from './Slide';
import { Reel, ReelProps } from './Reel';
import { KineticReel, KineticReelProps } from './KineticReel';
import { CaptionedVideo, CaptionedVideoProps } from './CaptionedVideo';
import { TextMotion, TextMotionProps } from './TextMotion';

const FPS = 30;

const defaultSlide: SlideProps = {
  bg: '',
  headline: 'Headline goes here',
  sub: 'Subheading goes here',
};

const defaultReel: ReelProps = {
  slides: [{ ...defaultSlide, seconds: 4 }],
};

const defaultCaptioned: CaptionedVideoProps = {
  video: '', cues: [], durationSeconds: 1,
};

const defaultKinetic: KineticReelProps = {
  scenes: [{ bg: '', seconds: 4, lines: [{ text: 'Headline' }] }],
};

const defaultTextMotion: TextMotionProps = {
  elements: [{ text: 'Text Motion', in: 'pop' }],
  background: { kind: 'color', color: '#0d1a3a' },
  durationSeconds: 6,
};

export const Root: React.FC = () => {
  const input = getInputProps() as Partial<ReelProps> & Partial<KineticReelProps> &
    Partial<CaptionedVideoProps> & Partial<TextMotionProps> & { width?: number; height?: number; fps?: number };
  const captionedSeconds = input.durationSeconds ?? defaultCaptioned.durationSeconds;
  const reelSeconds =
    (input.slides ?? defaultReel.slides).reduce((a, s) => a + (s.seconds ?? 4), 0);
  const kineticSeconds =
    (input.scenes ?? defaultKinetic.scenes).reduce((a, s) => a + (s.seconds ?? 4), 0);
  const tmW = input.width ?? 1080;
  const tmH = input.height ?? 1920;
  const tmFps = input.fps ?? FPS;
  const tmSeconds =
    input.durationSeconds ??
    Math.max(6, ...(input.elements ?? []).map((e) => (e.end ?? (e.start ?? 0) + 4)));

  return (
    <>
      {/* Render one still slide:
          npx remotion still src/index.ts Slide out.png --props='{"bg":"/abs/path.png","headline":"...","sub":"..."}' */}
      <Composition
        id="Slide"
        component={Slide}
        width={1080}
        height={1350}
        fps={FPS}
        durationInFrames={1}
        defaultProps={defaultSlide}
      />
      {/* Render the reel:
          npx remotion render src/index.ts Reel out.mp4 --props=reel-props.json */}
      <Composition
        id="Reel"
        component={Reel}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.max(1, Math.round(reelSeconds * FPS))}
        defaultProps={defaultReel}
      />
      {/* Kinetic typography reel (lines appear staggered, per-line size/color emphasis):
          npx remotion render src/index.ts KineticReel out.mp4 --props=props.json */}
      <Composition
        id="KineticReel"
        component={KineticReel}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.max(1, Math.round(kineticSeconds * FPS))}
        defaultProps={defaultKinetic}
      />
      {/* Burn timed captions over a finished video (Burmese-safe via Chromium shaping):
          npx remotion render src/index.ts CaptionedVideo out.mp4 --props=props.json */}
      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        width={input.width ?? 1080}
        height={input.height ?? 1920}
        fps={FPS}
        durationInFrames={Math.max(1, Math.round(captionedSeconds * FPS))}
        defaultProps={defaultCaptioned}
      />
      {/* Fully-parameterized text-animation engine (positioned, timed, in/out/loop):
          npx remotion render src/index.ts TextMotion out.mp4 --props=props.json */}
      <Composition
        id="TextMotion"
        component={TextMotion}
        width={tmW}
        height={tmH}
        fps={tmFps}
        durationInFrames={Math.max(1, Math.round(tmSeconds * tmFps))}
        defaultProps={defaultTextMotion}
      />
    </>
  );
};
