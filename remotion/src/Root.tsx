import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { Slide, SlideProps } from './Slide';
import { Reel, ReelProps } from './Reel';
import { KineticReel, KineticReelProps } from './KineticReel';

const FPS = 30;

const defaultSlide: SlideProps = {
  bg: '',
  headline: 'Headline goes here',
  sub: 'Subheading goes here',
};

const defaultReel: ReelProps = {
  slides: [{ ...defaultSlide, seconds: 4 }],
};

const defaultKinetic: KineticReelProps = {
  scenes: [{ bg: '', seconds: 4, lines: [{ text: 'Headline' }] }],
};

export const Root: React.FC = () => {
  const input = getInputProps() as Partial<ReelProps> & Partial<KineticReelProps>;
  const reelSeconds =
    (input.slides ?? defaultReel.slides).reduce((a, s) => a + (s.seconds ?? 4), 0);
  const kineticSeconds =
    (input.scenes ?? defaultKinetic.scenes).reduce((a, s) => a + (s.seconds ?? 4), 0);

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
    </>
  );
};
