import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

const { fontFamily: inter } = loadInter('normal', { weights: ['600', '700'], subsets: ['latin'] });

const src = (p: string) => (p.startsWith('http') || p.startsWith('file:') ? p : staticFile(p));

export type CaptionCue = {
  /** Cue window in seconds on the video timeline. */
  start: number;
  end: number;
  text: string;
};

export type CaptionedVideoProps = {
  video: string;              // staged path of the source video (audio kept)
  cues: CaptionCue[];
  durationSeconds: number;    // video duration — drives composition length
  fontSize?: number;          // px, default 52
  marginBottom?: number;      // px from bottom edge, default 280 (above platform UI)
  accentColor?: string;       // pill border accent, default brand cyan
};

/**
 * Burn timed captions over a finished video. Complex scripts (Burmese, Thai…)
 * shape correctly because Remotion renders in Chromium — the font stack falls
 * back to the OS Myanmar fonts after Inter.
 */
export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({
  video, cues, fontSize = 52, marginBottom = 280, accentColor = '#22d3ee',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = cues.find((c) => t >= c.start && t < c.end);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <OffthreadVideo src={src(video)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {active ? (
        <div
          style={{
            position: 'absolute',
            bottom: marginBottom,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0 48px',
          }}
        >
          <div
            style={{
              maxWidth: '92%',
              backgroundColor: 'rgba(2, 8, 20, 0.62)',
              border: `2px solid ${accentColor}33`,
              borderRadius: 20,
              padding: '16px 30px',
              fontFamily: `${inter}, 'Myanmar MN', 'Noto Sans Myanmar', 'Padauk', sans-serif`,
              fontWeight: 700,
              fontSize,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.5,
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}
          >
            {active.text}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
