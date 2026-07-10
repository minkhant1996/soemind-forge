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
  // ---- creative styling (all optional, backward compatible) ----
  anim?: 'rise' | 'pop' | 'blur' | 'mask' | 'slideL' | 'slideR'; // entrance, default 'rise'
  gradient?: string;    // CSS gradient for fill text, e.g. 'linear-gradient(135deg,#3b6bff,#c8a24a)'
  stroke?: string;      // outline color (WebkitTextStroke)
  strokeWidth?: number; // px, default 2
  glow?: string;        // glow color (text-shadow)
  glowSize?: number;    // px blur, default 24
  italic?: boolean;
  tracking?: number;    // letterSpacing px
  rotate?: number;      // deg
  highlight?: string;   // marker-pill background behind the word
  uppercase?: boolean;
  mediaFill?: string;   // image OR video path — shows THROUGH the letters (knockout / "video in text")
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
  const { fps, width } = useVideoConfig();
  const delayF = Math.round((line.delay ?? index * 0.55) * fps);
  const t = frame - delayF;
  const started = t >= 0;
  const prog = spring({ frame: t, fps, config: { damping: 200, stiffness: 90 } });
  const anim = line.anim ?? 'rise';

  // ---- entrance animation ----
  let tx = 0, ty = 0, scale = 1, blur = 0;
  let clipPath: string | undefined;
  const opacity = started ? (anim === 'mask' ? 1 : prog) : 0;
  if (anim === 'rise') ty = interpolate(prog, [0, 1], [46, 0]);
  else if (anim === 'slideL') tx = interpolate(prog, [0, 1], [-110, 0]);
  else if (anim === 'slideR') tx = interpolate(prog, [0, 1], [110, 0]);
  else if (anim === 'blur') blur = interpolate(prog, [0, 1], [24, 0]);
  else if (anim === 'mask') clipPath = `inset(0 ${interpolate(prog, [0, 1], [100, 0])}% 0 0)`;
  else if (anim === 'pop') {
    const pj = spring({ frame: t, fps, config: { damping: 10, stiffness: 130, mass: 0.7 } });
    scale = started ? interpolate(pj, [0, 1], [0.5, 1]) : 0.5;
  }
  const rot = line.rotate ? ` rotate(${line.rotate}deg)` : '';

  // ---- media-in-text (knockout): video/image shows THROUGH the letters ----
  if (line.mediaFill) {
    const boxW = width - 168;
    const boxH = Math.round((line.size ?? 120) * 1.18);
    const cid = `mf${index}s${line.size ?? 120}`;
    const label = line.uppercase ? line.text.toUpperCase() : line.text;
    const mediaStyle: React.CSSProperties = {
      width: boxW, height: boxH, objectFit: 'cover',
      clipPath: `url(#${cid})`, WebkitClipPath: `url(#${cid})`,
    };
    return (
      <div style={{ opacity, transform: `translate(${tx}px, ${ty}px) scale(${scale})${rot}`, marginTop: 18 }}>
        <div style={{ position: 'relative', width: boxW, height: boxH }}>
          <svg width={boxW} height={boxH} viewBox={`0 0 ${boxW} ${boxH}`} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <clipPath id={cid}>
                <text
                  x={boxW / 2} y={boxH / 2} textAnchor="middle" dominantBaseline="central"
                  style={{
                    fontFamily: sora, fontWeight: line.weight ?? 800,
                    fontSize: line.size ?? 120, letterSpacing: `${line.tracking ?? 0}px`,
                  }}
                >
                  {label}
                </text>
              </clipPath>
            </defs>
          </svg>
          {/\.(mp4|mov|webm|m4v)$/i.test(line.mediaFill) ? (
            <OffthreadVideo src={src(line.mediaFill)} muted style={mediaStyle} />
          ) : (
            <Img src={src(line.mediaFill)} style={mediaStyle} />
          )}
        </div>
      </div>
    );
  }

  // ---- inner text styling ----
  const inner: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: line.font === 'inter' ? inter : sora,
    fontWeight: line.weight ?? 700,
    fontSize: line.size ?? 64,
    lineHeight: 1.16,
    fontStyle: line.italic ? 'italic' : undefined,
    letterSpacing: line.tracking != null ? line.tracking : undefined,
    textTransform: line.uppercase ? 'uppercase' : undefined,
  };
  if (line.gradient) {
    inner.backgroundImage = line.gradient;
    inner.WebkitBackgroundClip = 'text';
    inner.backgroundClip = 'text';
    inner.WebkitTextFillColor = 'transparent';
    inner.color = 'transparent';
  } else {
    inner.color = line.color ?? '#0F172A';
  }
  if (line.stroke) inner.WebkitTextStroke = `${line.strokeWidth ?? 2}px ${line.stroke}`;
  if (line.glow) inner.textShadow = `0 0 ${line.glowSize ?? 24}px ${line.glow}`;
  if (line.highlight) {
    inner.background = line.highlight;
    inner.padding = '2px 22px';
    inner.borderRadius = 14;
    inner.WebkitBackgroundClip = 'border-box';
    inner.backgroundClip = 'border-box';
  }

  return (
    <div
      style={{
        opacity,
        transform: `translate(${tx}px, ${ty}px) scale(${scale})${rot}`,
        filter: blur ? `blur(${blur}px)` : undefined,
        clipPath,
        textAlign: 'center',
        marginTop: 18,
        maxWidth: '100%',
      }}
    >
      <span style={inner}>{line.text}</span>
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
