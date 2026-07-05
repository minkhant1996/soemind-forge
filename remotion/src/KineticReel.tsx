import React from 'react';
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import { loadFont as loadSora } from '@remotion/google-fonts/Sora';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

const { fontFamily: sora } = loadSora('normal', { weights: ['600', '700'], subsets: ['latin'] });
const { fontFamily: inter } = loadInter('normal', { weights: ['400', '600'], subsets: ['latin'] });

const src = (p: string) => (p.startsWith('http') || p.startsWith('file:') ? p : staticFile(p));

export type KineticLine = {
  text: string;
  size?: number;        // px, default 64
  color?: string;       // default navy #0F172A
  weight?: number;      // default 700
  font?: 'sora' | 'inter';
  delay?: number;       // seconds after scene start, default: staggered 0.55s per line
};

export type KineticScene = {
  bg: string;           // staticFile path of background image OR video (.mp4/.mov/.webm)
  seconds: number;
  lines: KineticLine[];
  logo?: string;        // optional logo shown under the lines
  align?: 'center' | 'top' | 'bottom';
  scrim?: boolean;      // soft mist panel behind text for busy backgrounds
  bgAudioVolume?: number; // for video backgrounds: keep native audio at this level (0 = muted, default)
};

const isVideoBg = (p: string) => /\.(mp4|mov|webm|m4v)$/i.test(p);

export type KineticReelProps = {
  scenes: KineticScene[];
  audio?: string;
  music?: string;
  musicVolume?: number;
};

const Line: React.FC<{ line: KineticLine; index: number }> = ({ line, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayF = Math.round((line.delay ?? index * 0.55) * fps);
  const t = frame - delayF;
  const prog = spring({ frame: t, fps, config: { damping: 200, stiffness: 90 } });
  const opacity = t < 0 ? 0 : prog;
  const y = interpolate(prog, [0, 1], [46, 0]);
  return (
    <div
      style={{
        fontFamily: line.font === 'inter' ? inter : sora,
        fontWeight: line.weight ?? 700,
        fontSize: line.size ?? 64,
        color: line.color ?? '#0F172A',
        lineHeight: 1.22,
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: 'center',
        marginTop: 18,
      }}
    >
      {line.text}
    </div>
  );
};

const Scene: React.FC<{ scene: KineticScene; frames: number }> = ({ scene, frames }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, frames], [1.02, 1.1]);
  const fade = interpolate(frame, [0, 8, frames - 8, frames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const logoProg = spring({
    frame: frame - Math.round(scene.lines.length * 0.55 * 30),
    fps: 30, config: { damping: 200 },
  });
  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: '#F6F8FB' }}>
      {isVideoBg(scene.bg) ? (
        <OffthreadVideo
          src={src(scene.bg)}
          muted={!scene.bgAudioVolume}
          volume={scene.bgAudioVolume ?? 0}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Img
          src={src(scene.bg)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: `scale(${zoom})`, opacity: 0.9,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          justifyContent:
            scene.align === 'top' ? 'flex-start'
            : scene.align === 'bottom' ? 'flex-end'
            : 'center',
          alignItems: 'center',
          padding: '160px 84px',
        }}
      >
        <div
          style={
            scene.scrim
              ? {
                  backgroundColor: 'rgba(246,248,251,0.86)',
                  backdropFilter: 'blur(14px)',
                  borderRadius: 36,
                  padding: '56px 64px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }
              : { display: 'flex', flexDirection: 'column', alignItems: 'center' }
          }
        >
          {scene.lines.map((l, i) => <Line key={i} line={l} index={i} />)}
          {scene.logo ? (
            <Img src={src(scene.logo)} style={{ width: 280, marginTop: 54, opacity: logoProg }} />
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const KineticReel: React.FC<KineticReelProps> = ({ scenes, audio, music, musicVolume = 0.18 }) => {
  const { fps } = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#F6F8FB' }}>
      {scenes.map((s, i) => {
        const frames = Math.round(s.seconds * fps);
        const seq = (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <Scene scene={s} frames={frames} />
          </Sequence>
        );
        from += frames;
        return seq;
      })}
      {audio ? <Audio src={src(audio)} /> : null}
      {music ? <Audio src={src(music)} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};
