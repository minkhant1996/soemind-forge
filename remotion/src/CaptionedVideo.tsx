import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

const { fontFamily: inter } = loadInter('normal', { weights: ['600', '700', '800'], subsets: ['latin'] });

const src = (p: string) => (p.startsWith('http') || p.startsWith('file:') ? p : staticFile(p));

export type CaptionCue = {
  /** Cue window in seconds on the video timeline. */
  start: number;
  end: number;
  /**
   * Cue text. `\n` splits stacked lines; `**word**` renders that word in the
   * accent color at heavier weight (per-word emphasis, TEXT-OVERLAY guide §4).
   */
  text: string;
  /** 'pill' (default) = lower-third caption pill · 'hero' = big open text, stroke+shadow, no pill. */
  style?: 'pill' | 'hero';
  /** Font size override for this cue (px). Hero default 84, pill default = fontSize prop. */
  size?: number;
  /** Base text color for this cue (default white). */
  color?: string;
  /** Vertical band: 'lower' (default caption zone) · 'mid' (~62% down) · 'upper' (top quarter). */
  pos?: 'lower' | 'mid' | 'upper';
  /** Horizontal alignment within the safe area (default 'center'). */
  align?: 'center' | 'left';
};

export type CaptionedVideoProps = {
  video: string;              // staged path of the source video (audio kept)
  cues: CaptionCue[];
  durationSeconds: number;    // video duration — drives composition length
  fontSize?: number;          // px, default 52
  marginBottom?: number;      // px from bottom edge, default 280 (above platform UI)
  accentColor?: string;       // emphasis / pill border accent, default brand cyan
};

/** Split on **emphasis** markers → segments tagged accent/plain. */
const parseEmphasis = (line: string) =>
  line.split('**').map((seg, i) => ({ seg, accent: i % 2 === 1 }));

/**
 * Burn timed captions over a finished video. Complex scripts (Burmese, Thai…)
 * shape correctly because Remotion renders in Chromium — the font stack falls
 * back to the OS Myanmar fonts after Inter. Supports a creative layer per
 * workflows/TEXT-OVERLAY-DESIGN-GUIDE.md: hero cues (open text, stroke+shadow),
 * stacked lines with staggered spring entrances, per-word accent emphasis,
 * and quadrant placement (pos/align).
 */
export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({
  video, cues, fontSize = 52, marginBottom = 280, accentColor = '#22d3ee',
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  const active = cues.find((c) => t >= c.start && t < c.end);

  const fontStack = `${inter}, 'Noto Sans Myanmar', 'Padauk', 'Noto Sans', sans-serif`;

  let overlay: React.ReactNode = null;
  if (active) {
    const isHero = active.style === 'hero';
    const size = active.size ?? (isHero ? 84 : fontSize);
    const baseColor = active.color ?? 'white';
    const lines = active.text.split('\n');

    // entrance/exit on the cue window
    const localFrame = frame - Math.round(active.start * fps);
    const cueFrames = Math.round((active.end - active.start) * fps);
    const exitFade = interpolate(localFrame, [cueFrames - Math.round(0.15 * fps), cueFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const band: React.CSSProperties =
      active.pos === 'upper'
        ? { top: Math.round(height * 0.09) }
        : active.pos === 'mid'
          ? { top: Math.round(height * 0.58) }
          : { bottom: marginBottom };

    const renderLine = (line: string, li: number) => {
      const enter = spring({
        frame: localFrame - Math.round(li * 0.12 * fps), // stagger stacked lines
        fps,
        config: { damping: 14, stiffness: 160, mass: 0.7 },
      });
      const lineStyle: React.CSSProperties = {
        opacity: enter * exitFade,
        transform: `translateY(${(1 - enter) * 18}px) scale(${0.94 + enter * 0.06})`,
        fontFamily: fontStack,
        fontWeight: isHero ? 800 : 700,
        fontSize: size,
        color: baseColor,
        lineHeight: 1.45,
        textAlign: active.align === 'left' ? 'left' : 'center',
        textShadow: isHero
          ? '0 4px 22px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)'
          : '0 2px 12px rgba(0,0,0,0.8)',
        WebkitTextStroke: isHero ? '1.5px rgba(2,8,20,0.55)' : undefined,
      };
      return (
        <div key={li} style={lineStyle}>
          {parseEmphasis(line).map(({ seg, accent }, si) =>
            accent ? (
              <span key={si} style={{ color: accentColor, fontWeight: 800 }}>{seg}</span>
            ) : (
              <span key={si}>{seg}</span>
            )
          )}
        </div>
      );
    };

    overlay = (
      <div
        style={{
          position: 'absolute',
          ...band,
          width: '100%',
          display: 'flex',
          justifyContent: active.align === 'left' ? 'flex-start' : 'center',
          padding: active.align === 'left' ? '0 64px' : '0 48px',
        }}
      >
        {isHero ? (
          <div style={{ maxWidth: '94%' }}>{lines.map(renderLine)}</div>
        ) : (
          <div
            style={{
              maxWidth: '92%',
              backgroundColor: 'rgba(2, 8, 20, 0.62)',
              border: `2px solid ${accentColor}33`,
              borderRadius: 20,
              padding: '16px 30px',
            }}
          >
            {lines.map(renderLine)}
          </div>
        )}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <OffthreadVideo src={src(video)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {overlay}
    </AbsoluteFill>
  );
};
