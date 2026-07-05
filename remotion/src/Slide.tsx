import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont as loadSora } from '@remotion/google-fonts/Sora';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

const { fontFamily: sora } = loadSora('normal', { weights: ['600', '700'], subsets: ['latin'] });
const { fontFamily: inter } = loadInter('normal', { weights: ['400', '600'], subsets: ['latin'] });

const src = (p: string) => (p.startsWith('http') || p.startsWith('file:') ? p : staticFile(p));

export type SlideProps = {
  bg: string;              // absolute path or staticFile URL of background image
  headline: string;
  sub?: string;
  footer?: string;         // e.g. soemindai.com
  logo?: string;           // optional logo path, centered below text
  align?: 'center' | 'top' | 'bottom';   // vertical placement of the text block
  headlineSize?: number;   // px, default 72
  scrim?: boolean;         // frosted mist panel behind text for busy backgrounds
};

export const Slide: React.FC<SlideProps> = ({
  bg, headline, sub, footer, logo, align = 'center', headlineSize = 72, scrim,
}) => {
  const justify = align === 'top' ? 'flex-start' : align === 'bottom' ? 'flex-end' : 'center';
  return (
    <AbsoluteFill style={{ backgroundColor: '#F6F8FB' }}>
      {bg ? <Img src={src(bg)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      <AbsoluteFill
        style={{
          justifyContent: justify,
          alignItems: 'center',
          padding: '120px 90px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 720,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            ...(scrim
              ? {
                  backgroundColor: 'rgba(246,248,251,0.86)',
                  backdropFilter: 'blur(14px)',
                  borderRadius: 36,
                  padding: '52px 56px',
                }
              : {}),
          }}
        >
          <h1 style={{ fontFamily: sora, fontWeight: 700, fontSize: headlineSize, color: '#0F172A', lineHeight: 1.2, margin: 0 }}>
            {headline}
          </h1>
          {sub ? (
            <p style={{ fontFamily: inter, fontWeight: 400, fontSize: headlineSize * 0.42, color: '#475569', lineHeight: 1.55, marginTop: 28 }}>
              {sub}
            </p>
          ) : null}
          {logo ? <Img src={src(logo)} style={{ width: 300, marginTop: 48 }} /> : null}
        </div>
      </AbsoluteFill>
      {footer ? (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70 }}>
          <span style={{ fontFamily: inter, fontSize: 30, color: '#1E3A8A', letterSpacing: 1 }}>{footer}</span>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
