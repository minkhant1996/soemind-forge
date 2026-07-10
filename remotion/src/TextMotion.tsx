import React from 'react';
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import { loadFont as loadSora } from '@remotion/google-fonts/Sora';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { loadFont as loadBebas } from '@remotion/google-fonts/BebasNeue';
import { IN, OUT, LOOP, STAGGER_TOKENS, composeState, toCss, AnimState } from './textAnim';

const { fontFamily: sora } = loadSora('normal', { weights: ['600', '700', '800'], subsets: ['latin'] });
const { fontFamily: inter } = loadInter('normal', { weights: ['400', '600', '700'], subsets: ['latin'] });
const { fontFamily: caveat } = loadCaveat('normal', { weights: ['600', '700'], subsets: ['latin'] });
const { fontFamily: bebas } = loadBebas('normal', { weights: ['400'], subsets: ['latin'] });
const FONTS: Record<string, string> = { sora, inter, caveat, bebas };
const fontOf = (f?: string) => FONTS[f || 'sora'] || sora;

const src = (p: string) => (p.startsWith('http') || p.startsWith('file:') ? p : staticFile(p));
const isVideo = (p: string) => /\.(mp4|mov|webm|m4v)$/i.test(p);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export type TextElement = {
  text: string;
  // position
  x?: number | string; y?: number | string;
  anchor?: string; align?: 'left' | 'center' | 'right';
  maxWidth?: number | string; rotate?: number;
  // timing (seconds)
  start?: number; end?: number; inDuration?: number; outDuration?: number;
  // animation
  in?: string; out?: string; loop?: string;
  easing?: string | number[];
  stagger?: 'none' | 'word' | 'letter'; staggerStep?: number;
  // style
  font?: 'sora' | 'inter' | 'caveat' | 'bebas'; size?: number; weight?: number;
  color?: string; gradient?: string; stroke?: string; strokeWidth?: number;
  glow?: string; glowSize?: number; italic?: boolean; uppercase?: boolean;
  tracking?: number; lineHeight?: number; highlight?: string; highlightPad?: number[];
  shadow?: string; mediaFill?: string; opacity?: number;
  scrim?: boolean; scrimColor?: string; // frosted panel behind text for legibility
  // creative extensions
  behind?: boolean;                    // render UNDER the subject cutout layer
  bleed?: boolean;                     // no-wrap, overflow past frame edges (hero scale)
  badge?: boolean;                     // render as a rounded chip/pill label
  accentColor?: string;                // color for ==inline== / **bold** accents (default gold)
  boldWeight?: number;                 // weight for **bold** spans (default 800)
  perLetter?: { stepY?: number; stepRotate?: number; skew?: number }; // cascade/perspective
  parts?: Array<{ text: string; dx?: number; dy?: number; scale?: number; color?: string }>; // satellites
};

export type Background = {
  kind?: 'image' | 'video' | 'color'; path?: string; color?: string;
  fit?: 'cover' | 'contain'; kenBurns?: boolean; dim?: number;
  playbackRate?: number; // <1 slows the source video to stretch it over a longer scene
};

export type SubjectCutout = { path: string; kind: 'image' | 'video' };

export type TextMotionProps = {
  elements: TextElement[];
  background?: Background;
  subjectCutout?: SubjectCutout; // foreground matte layered OVER behind:true elements
  audio?: string; music?: string; musicVolume?: number;
  durationSeconds?: number; // used by Root for frame count
};

const ANCHORS: Record<string, [number, number]> = {
  center: [0.5, 0.5], top: [0.5, 0], bottom: [0.5, 1], left: [0, 0.5], right: [1, 0.5],
  'top-left': [0, 0], 'top-right': [1, 0], 'bottom-left': [0, 1], 'bottom-right': [1, 1],
  'top-center': [0.5, 0], 'bottom-center': [0.5, 1],
};

const resolve = (v: number | string | undefined, total: number, dflt: number): number => {
  if (v == null) return dflt;
  if (typeof v === 'string') {
    if (v.trim().endsWith('%')) return (parseFloat(v) / 100) * total;
    const n = parseFloat(v); return isNaN(n) ? dflt : (n <= 1 ? n * total : n);
  }
  return v <= 1 ? v * total : v;
};

// build the per-unit text span style (typography + fill/stroke/glow/highlight)
function textStyle(el: TextElement, extraLetterSpacing: number, glowMul: number): React.CSSProperties {
  const st: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: fontOf(el.font),
    fontWeight: el.weight ?? 700,
    fontSize: el.size ?? 72,
    lineHeight: el.lineHeight ?? 1.16,
    fontStyle: el.italic ? 'italic' : undefined,
    letterSpacing: `${(el.tracking ?? 0) + extraLetterSpacing}px`,
    textTransform: el.uppercase ? 'uppercase' : undefined,
    whiteSpace: el.bleed ? 'nowrap' : 'pre-wrap',
  };
  if (el.gradient) {
    st.backgroundImage = el.gradient; st.WebkitBackgroundClip = 'text'; st.backgroundClip = 'text';
    st.WebkitTextFillColor = 'transparent'; st.color = 'transparent';
  } else {
    st.color = el.color ?? '#0F172A';
  }
  if (el.stroke) st.WebkitTextStroke = `${el.strokeWidth ?? 2}px ${el.stroke}`;
  const shadows: string[] = [];
  if (el.glow) shadows.push(`0 0 ${(el.glowSize ?? 24) * glowMul}px ${el.glow}`);
  if (el.shadow) shadows.push(el.shadow);
  if (shadows.length) {
    if (el.gradient) {
      // gradient text has a transparent fill (background-clip:text), so a
      // text-shadow bleeds THROUGH the glyphs and muddies them — use
      // drop-shadow on the rendered pixels instead.
      st.filter = shadows
        .flatMap((s) => s.split(/,(?![^(]*\))/))
        .map((s) => `drop-shadow(${s.trim()})`)
        .join(' ');
    } else {
      st.textShadow = shadows.join(', ');
    }
  }
  if (el.badge) {
    st.background = el.highlight ?? '#1b4fd8'; st.color = el.color ?? '#ffffff';
    st.padding = '8px 22px'; st.borderRadius = 12; st.textTransform = 'uppercase';
    st.letterSpacing = `${(el.tracking ?? 1)}px`; st.fontWeight = el.weight ?? 800;
    st.boxShadow = '0 6px 18px rgba(13,26,58,0.28)';
    st.WebkitBackgroundClip = 'border-box'; st.backgroundClip = 'border-box';
    st.WebkitTextFillColor = st.color as string;
  } else if (el.highlight) {
    st.background = el.highlight;
    const pad = el.highlightPad ?? [2, 22];
    st.padding = `${pad[0]}px ${pad[1]}px`; st.borderRadius = 14;
    st.WebkitBackgroundClip = 'border-box'; st.backgroundClip = 'border-box';
  }
  return st;
}

// inline markup: **bold** (boldWeight+accent), ==accent== (accentColor), //italic//
type Span = { text: string; bold?: boolean; accent?: boolean; italic?: boolean };
function parseInline(raw: string): Span[] {
  const out: Span[] = [];
  const re = /(\*\*[^*]+\*\*|==[^=]+==|\/\/[^/]+\/\/)/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) out.push({ text: raw.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**')) out.push({ text: tok.slice(2, -2), bold: true });
    else if (tok.startsWith('==')) out.push({ text: tok.slice(2, -2), accent: true });
    else out.push({ text: tok.slice(2, -2), italic: true });
    last = re.lastIndex;
  }
  if (last < raw.length) out.push({ text: raw.slice(last) });
  return out;
}
const hasInline = (s: string) => /(\*\*[^*]+\*\*|==[^=]+==|\/\/[^/]+\/\/)/.test(s);

const MediaText: React.FC<{ el: TextElement; boxW: number }> = ({ el, boxW }) => {
  // Media canvas gets headroom past the layout box — the SVG glyph mask can run
  // slightly wider than boxW, and any glyph outside the media renders empty
  // (first/last letters vanish).
  const W = Math.round(boxW * 1.2);
  const boxH = Math.round((el.size ?? 120) * 1.35);
  const cid = `tmf-${Math.round((el.x as number) ?? 0)}-${el.size ?? 120}-${(el.text || '').length}`;
  const label = el.uppercase ? el.text.toUpperCase() : el.text;
  const mStyle: React.CSSProperties = {
    width: W, height: boxH, objectFit: 'cover',
    clipPath: `url(#${cid})`, WebkitClipPath: `url(#${cid})`,
  };
  return (
    <div style={{ position: 'relative', width: W, height: boxH, marginLeft: Math.round((boxW - W) / 2) }}>
      <svg width={W} height={boxH} viewBox={`0 0 ${W} ${boxH}`} style={{ position: 'absolute', inset: 0 }}>
        <defs><clipPath id={cid}>
          <text x={W / 2} y={boxH / 2} textAnchor="middle" dominantBaseline="central"
            style={{ fontFamily: sora, fontWeight: el.weight ?? 800, fontSize: el.size ?? 120, letterSpacing: `${el.tracking ?? 0}px` }}>
            {label}
          </text>
        </clipPath></defs>
      </svg>
      {isVideo(el.mediaFill!) ? <OffthreadVideo src={src(el.mediaFill!)} muted style={mStyle} /> : <Img src={src(el.mediaFill!)} style={mStyle} />}
    </div>
  );
};

const Element: React.FC<{ el: TextElement }> = ({ el }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const startF = Math.round((el.start ?? 0) * fps);
  const endF = el.end != null ? Math.round(el.end * fps) : durationInFrames;
  if (frame < startF - 1 || frame > endF + 1) return null;

  const inDurF = Math.max(1, Math.round((el.inDuration ?? 0.55) * fps));
  const outDurF = Math.max(0, Math.round((el.outDuration ?? 0.4) * fps));
  const tSec = (frame - startF) / fps;

  const inName = el.in ?? 'fadeUp';
  const outName = el.out ?? 'none';
  const loopName = el.loop ?? 'none';
  const inFn = IN[inName] || IN.fadeUp;
  const outFn = OUT[outName] || OUT.none;
  const loopFn = LOOP[loopName] || LOOP.none;

  // exit progress
  const q = outDurF > 0 ? clamp01((frame - (endF - outDurF)) / outDurF) : 0;

  // stagger
  const stagger = el.stagger ?? STAGGER_TOKENS[inName] ?? 'none';
  const stepF = Math.max(0, Math.round((el.staggerStep ?? 0.05) * fps));

  // OUT + element-level LOOP + rotate, applied to the inner wrapper
  const outPart = q > 0 ? outFn(q) : {};
  const loopPart = loopName !== 'wave' ? loopFn(tSec, 0) : {};
  const wrapState: AnimState = composeState([outPart, loopPart]);
  wrapState.rotate += el.rotate ?? 0;
  const wrapCss = toCss(wrapState);

  // position box
  const boxW = resolve(el.maxWidth, width, width - 168);
  const px = resolve(el.x, width, width / 2);
  const py = resolve(el.y, height, height / 2);
  const [ax, ay] = ANCHORS[el.anchor ?? 'center'] ?? ANCHORS.center;

  // build content
  let content: React.ReactNode;
  if (el.mediaFill) {
    const pUnit = clamp01((frame - startF) / inDurF);
    const inState = composeState([pUnit < 1 ? inFn(pUnit) : { opacity: 1 }]);
    content = <div style={toCss(inState)}><MediaText el={el} boxW={boxW} /></div>;
  } else if (el.parts && el.parts.length) {
    // dominant word + orbiting satellites
    const pUnit = clamp01((frame - startF) / inDurF);
    const stU = composeState([pUnit < 1 ? inFn(pUnit) : { opacity: 1 }]);
    content = (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <span style={{ ...textStyle(el, stU.ls, stU.glowMul), ...toCss(stU) }}>{el.text}</span>
        {el.parts.map((p, i) => (
          <span key={i} style={{
            position: 'absolute', left: `${50 + (p.dx ?? 0)}%`, top: `${50 + (p.dy ?? 0)}%`,
            transform: 'translate(-50%,-50%)', whiteSpace: 'nowrap',
            fontFamily: fontOf(el.font), fontWeight: el.weight ?? 700,
            fontSize: (el.size ?? 72) * (p.scale ?? 0.25),
            color: p.color ?? el.color ?? '#0F172A', opacity: stU.opacity,
          }}>{p.text}</span>
        ))}
      </div>
    );
  } else if (el.perLetter) {
    // per-letter cascade / perspective ("falling downstairs")
    const raw = el.uppercase ? el.text.toUpperCase() : el.text;
    const units = Array.from(raw);
    const pl = el.perLetter;
    content = (
      <span style={{ display: 'inline' }}>
        {units.map((u, i) => {
          const pUnit = clamp01((frame - startF - i * stepF) / inDurF);
          const stU = composeState([pUnit < 1 ? inFn(pUnit) : {}]);
          const anim = toCss(stU);
          const casc = `translateY(${i * (pl.stepY ?? 0)}px) rotate(${i * (pl.stepRotate ?? 0)}deg) skewX(${pl.skew ?? 0}deg)`;
          const merged = {
            ...textStyle(el, stU.ls, stU.glowMul), ...anim, display: 'inline-block',
            transform: `${anim.transform || ''} ${casc}`.trim(),
          };
          return <span key={i} style={merged}>{u === ' ' ? ' ' : u}</span>;
        })}
      </span>
    );
  } else if (stagger !== 'none') {
    const raw = el.uppercase ? el.text.toUpperCase() : el.text;
    const units = stagger === 'word' ? splitWords(raw) : Array.from(raw);
    content = (
      <span style={{ display: 'inline' }}>
        {units.map((u, i) => {
          const pUnit = clamp01((frame - startF - i * stepF) / inDurF);
          const parts: Partial<AnimState>[] = [pUnit < 1 ? inFn(pUnit) : {}];
          if (loopName === 'wave') parts.push(loopFn(tSec, i));
          const stU = composeState(parts);
          const merged = { ...textStyle(el, stU.ls, stU.glowMul), ...toCss(stU), display: 'inline-block' };
          return <span key={i} style={merged}>{u === ' ' ? ' ' : u}</span>;
        })}
      </span>
    );
  } else {
    const pUnit = clamp01((frame - startF) / inDurF);
    const stU = composeState([pUnit < 1 ? inFn(pUnit) : { opacity: 1 }]);
    const base = textStyle(el, stU.ls, stU.glowMul);
    const anim = toCss(stU);
    if (hasInline(el.text)) {
      const spans = parseInline(el.text);
      content = (
        <span style={{ ...base, ...anim }}>
          {spans.map((s, i) => {
            const ss: React.CSSProperties = {};
            if (s.bold) ss.fontWeight = el.boldWeight ?? 800;
            if (s.accent) { ss.color = el.accentColor ?? '#c8a24a'; (ss as any).WebkitTextFillColor = el.accentColor ?? '#c8a24a'; }
            if (s.italic) ss.fontStyle = 'italic';
            return <span key={i} style={ss}>{s.text}</span>;
          })}
        </span>
      );
    } else {
      content = <span style={{ ...base, ...anim }}>{el.text}</span>;
    }
  }

  const body = <div style={wrapCss}>{content}</div>;
  // Caption pill — same look as CaptionedVideo's lower-third (dark translucent
  // panel, subtle accent border); pair with white text. The pill must track the
  // text's entrance/exit opacity or it lingers as an empty box between cues.
  const scrimIn = clamp01((frame - startF) / inDurF);
  const scrimmed = el.scrim ? (
    <div style={{
      display: 'inline-block',
      background: el.scrimColor ?? 'rgba(2,8,20,0.62)',
      border: '2px solid rgba(122,165,255,0.20)',
      borderRadius: 20, padding: '16px 30px',
      opacity: scrimIn * (wrapState.opacity ?? 1),
    }}>{body}</div>
  ) : body;

  return (
    <div style={{
      position: 'absolute', left: px, top: py, width: boxW,
      transform: `translate(${-ax * 100}%, ${-ay * 100}%)`,
      textAlign: el.align ?? 'center', opacity: el.opacity ?? 1,
    }}>
      {scrimmed}
    </div>
  );
};

function splitWords(s: string): string[] {
  return s.split(/(\s+)/).filter((x) => x.length > 0);
}

const BackgroundLayer: React.FC<{ bg?: Background }> = ({ bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!bg || (!bg.path && bg.kind !== 'color')) return <AbsoluteFill style={{ backgroundColor: '#0d1a3a' }} />;
  if (bg.kind === 'color') return <AbsoluteFill style={{ backgroundColor: bg.color || '#0d1a3a' }} />;
  const zoom = bg.kenBurns ? 1.02 + (frame / Math.max(1, durationInFrames)) * 0.08 : 1;
  return (
    <AbsoluteFill>
      {bg.kind === 'video' || (bg.path && isVideo(bg.path)) ? (
        <OffthreadVideo src={src(bg.path!)} muted playbackRate={bg.playbackRate ?? 1} style={{ width: '100%', height: '100%', objectFit: bg.fit || 'cover' }} />
      ) : (
        <Img src={src(bg.path!)} style={{ width: '100%', height: '100%', objectFit: bg.fit || 'cover', transform: `scale(${zoom})` }} />
      )}
      {bg.dim ? <AbsoluteFill style={{ backgroundColor: `rgba(8,12,26,${bg.dim})` }} /> : null}
    </AbsoluteFill>
  );
};

const SubjectLayer: React.FC<{ cutout: SubjectCutout }> = ({ cutout }) => (
  <AbsoluteFill>
    {cutout.kind === 'video'
      ? <OffthreadVideo src={src(cutout.path)} transparent muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <Img src={src(cutout.path)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
  </AbsoluteFill>
);

export const TextMotion: React.FC<TextMotionProps> = ({ elements, background, subjectCutout, audio, music, musicVolume = 0.18 }) => {
  const els = elements || [];
  const behind = els.filter((e) => e.behind);
  const front = els.filter((e) => !e.behind);
  return (
    <AbsoluteFill style={{ backgroundColor: '#0d1a3a' }}>
      <BackgroundLayer bg={background} />
      {behind.map((el, i) => <Element key={`b${i}`} el={el} />)}
      {subjectCutout ? <SubjectLayer cutout={subjectCutout} /> : null}
      {front.map((el, i) => <Element key={`f${i}`} el={el} />)}
      {audio ? <Audio src={src(audio)} /> : null}
      {music ? <Audio src={src(music)} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};
