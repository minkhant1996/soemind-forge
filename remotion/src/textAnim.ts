// Text animation library — pure functions mapping progress/time → a transform state.
// Used by TextMotion.tsx. Every token here is callable by name from the
// renderTextMotion workflow. IN = entrance (p: 0→1), OUT = exit (q: 0→1, 0=start
// of exit), LOOP = continuous (t seconds since element start, i = unit index).

export type AnimState = {
  opacity: number;
  tx: number; ty: number;   // px
  sx: number; sy: number;   // scale factors
  rotate: number;           // deg
  blur: number;             // px
  ls: number;               // extra letterSpacing px
  hue: number;              // deg (filter hue-rotate)
  glowMul: number;          // multiplies glowSize
  clip?: string;            // clipPath
  origin?: string;          // transform-origin
};

export const identity = (): AnimState => ({
  opacity: 1, tx: 0, ty: 0, sx: 1, sy: 1, rotate: 0, blur: 0, ls: 0, hue: 0, glowMul: 1,
});

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const EASING: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeIn: (t) => t * t * t,
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  backOut: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  bounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
    if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
    t -= 2.625 / d1; return n1 * t * t + 0.984375;
  },
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  spring: (t) => { // approximated critically-damped-ish overshoot
    if (t >= 1) return 1;
    return 1 - Math.cos(t * Math.PI * 1.5) * Math.exp(-3 * t);
  },
};

export const easeWith = (name: string | number[] | undefined, t: number): number => {
  if (Array.isArray(name)) return cubicBezier(name[0], name[1], name[2], name[3], t);
  const fn = EASING[(name as string) || 'easeOut'];
  return (fn || EASING.easeOut)(clamp01(t));
};

// minimal cubic-bezier solver for [x1,y1,x2,y2]
function cubicBezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const fy = (u: number) => ((ay * u + by) * u + cy) * u;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = fx(u) - t;
    const d = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(x) < 1e-4 || d === 0) break;
    u -= x / d;
  }
  return fy(clamp01(u));
}

const osc = (t: number, periodSec: number) => Math.sin((t / periodSec) * Math.PI * 2);

// ---------------------------------------------------------------------------
// IN — entrance. p: 0 (start) → 1 (settled)
// ---------------------------------------------------------------------------
export const IN: Record<string, (p: number) => Partial<AnimState>> = {
  none: () => ({}),
  fadeIn: (p) => ({ opacity: EASING.easeOut(p) }),
  fadeUp: (p) => { const e = EASING.easeOut(p); return { opacity: e, ty: (1 - e) * 64 }; },
  fadeDown: (p) => { const e = EASING.easeOut(p); return { opacity: e, ty: -(1 - e) * 64 }; },
  fadeLeft: (p) => { const e = EASING.easeOut(p); return { opacity: e, tx: (1 - e) * 90 }; },
  fadeRight: (p) => { const e = EASING.easeOut(p); return { opacity: e, tx: -(1 - e) * 90 }; },
  rise: (p) => { const e = EASING.easeOut(p); return { opacity: e, ty: (1 - e) * 46 }; },
  pop: (p) => { const s = EASING.backOut(p); return { opacity: EASING.easeOut(Math.min(1, p * 2)), sx: 0.5 + 0.5 * s, sy: 0.5 + 0.5 * s }; },
  bounceIn: (p) => { const b = EASING.bounce(p); return { opacity: Math.min(1, p * 3), ty: (1 - b) * -60 }; },
  zoomIn: (p) => { const e = EASING.easeOut(p); return { opacity: e, sx: 0.2 + 0.8 * e, sy: 0.2 + 0.8 * e }; },
  spinIn: (p) => { const e = EASING.easeOut(p); return { opacity: e, rotate: (1 - e) * -180, sx: 0.6 + 0.4 * e, sy: 0.6 + 0.4 * e }; },
  flipUp: (p) => { const e = EASING.easeOut(p); return { opacity: e, sy: e, origin: 'bottom center' }; },
  wipeRight: (p) => ({ opacity: 1, clip: `inset(0 ${(1 - EASING.easeInOut(p)) * 100}% 0 0)` }),
  wipeLeft: (p) => ({ opacity: 1, clip: `inset(0 0 0 ${(1 - EASING.easeInOut(p)) * 100}%)` }),
  revealUp: (p) => ({ opacity: 1, clip: `inset(${(1 - EASING.easeInOut(p)) * 100}% 0 0 0)` }),
  blurIn: (p) => { const e = EASING.easeOut(p); return { opacity: e, blur: (1 - e) * 24 }; },
  elastic: (p) => { const s = EASING.elastic(p); return { opacity: Math.min(1, p * 3), sx: s, sy: s }; },
  glitchIn: (p) => ({ opacity: p > 0.15 ? 1 : p * 6, tx: (1 - p) * Math.sin(p * 60) * 16, hue: (1 - p) * Math.sin(p * 90) * 40 }),
  inkReveal: (p) => ({ opacity: 1, clip: `inset(0 0 ${(1 - EASING.easeInOut(p)) * 100}% 0)` }),
  shakeIn: (p) => ({ opacity: EASING.easeOut(Math.min(1, p * 2)), tx: (1 - p) * Math.sin(p * 50) * 14 }),
  roll: (p) => { const e = EASING.easeOut(p); return { opacity: e, rotate: (1 - e) * -90, tx: (1 - e) * -60 }; },
  expandTracking: (p) => { const e = EASING.easeOut(p); return { opacity: e, ls: (1 - e) * -14 }; },
  lightSweep: (p) => ({ opacity: EASING.easeOut(Math.min(1, p * 1.5)), glowMul: 1 + Math.sin(p * Math.PI) * 1.4 }),
  // stagger-based tokens (handled at composition level; base transform = gentle)
  typewriter: (p) => ({ opacity: p > 0 ? 1 : 0 }),
  wordByWord: (p) => { const e = EASING.easeOut(p); return { opacity: e, ty: (1 - e) * 30 }; },
  letterByLetter: (p) => { const e = EASING.easeOut(p); return { opacity: e, ty: (1 - e) * 24 }; },
  waveIn: (p) => { const e = EASING.easeOut(p); return { opacity: e, ty: (1 - e) * 40 }; },
};

// tokens that imply a per-unit reveal, and the granularity they imply
export const STAGGER_TOKENS: Record<string, 'word' | 'letter'> = {
  typewriter: 'letter', letterByLetter: 'letter', wordByWord: 'word', waveIn: 'letter',
};

// ---------------------------------------------------------------------------
// OUT — exit. q: 0 (start of exit) → 1 (gone)
// ---------------------------------------------------------------------------
export const OUT: Record<string, (q: number) => Partial<AnimState>> = {
  none: () => ({}),
  fadeOut: (q) => ({ opacity: 1 - EASING.easeIn(q) }),
  sink: (q) => ({ opacity: 1 - q, ty: EASING.easeIn(q) * 54 }),
  slideOutL: (q) => ({ opacity: 1 - q, tx: -EASING.easeIn(q) * 140 }),
  slideOutR: (q) => ({ opacity: 1 - q, tx: EASING.easeIn(q) * 140 }),
  slideOutU: (q) => ({ opacity: 1 - q, ty: -EASING.easeIn(q) * 140 }),
  slideOutD: (q) => ({ opacity: 1 - q, ty: EASING.easeIn(q) * 140 }),
  zoomOut: (q) => { const e = EASING.easeIn(q); return { opacity: 1 - q, sx: 1 - e * 0.7, sy: 1 - e * 0.7 }; },
  popOut: (q) => ({ opacity: 1 - q, sx: 1 + q * 0.4, sy: 1 + q * 0.4 }),
  blurOut: (q) => ({ opacity: 1 - q, blur: EASING.easeIn(q) * 24 }),
  wipeOut: (q) => ({ opacity: 1, clip: `inset(0 ${EASING.easeInOut(q) * 100}% 0 0)` }),
  spinOut: (q) => { const e = EASING.easeIn(q); return { opacity: 1 - q, rotate: e * 180, sx: 1 - e * 0.4, sy: 1 - e * 0.4 }; },
  shrinkOut: (q) => { const e = EASING.easeIn(q); return { opacity: 1 - q, sx: 1 - e, sy: 1 - e }; },
  glitchOut: (q) => ({ opacity: q < 0.85 ? 1 : (1 - q) * 6, tx: q * Math.sin(q * 60) * 16, hue: q * Math.sin(q * 80) * 40 }),
  dissolve: (q) => ({ opacity: 1 - EASING.easeIn(q), blur: q * 10 }),
};

// ---------------------------------------------------------------------------
// LOOP — continuous while visible. t = seconds since element start; i = unit idx
// ---------------------------------------------------------------------------
export const LOOP: Record<string, (t: number, i: number) => Partial<AnimState>> = {
  none: () => ({}),
  float: (t) => ({ ty: osc(t, 3) * 10 }),
  pulse: (t) => { const s = 1 + osc(t, 1.4) * 0.04; return { sx: s, sy: s }; },
  breathe: (t) => { const k = (osc(t, 3.2) + 1) / 2; return { opacity: 0.82 + k * 0.18, sx: 0.99 + k * 0.02, sy: 0.99 + k * 0.02 }; },
  shake: (t) => ({ tx: Math.sin(t * 22) * 4 }),
  wiggle: (t) => ({ rotate: Math.sin(t * 10) * 3 }),
  blink: (t) => ({ opacity: t % 1 < 0.5 ? 1 : 0.15 }),
  flicker: (t) => ({ opacity: 0.7 + Math.abs(Math.sin(t * 17) * Math.sin(t * 5)) * 0.3 }),
  wave: (t, i) => ({ ty: Math.sin(t * 4 + i * 0.6) * 12 }),
  bounceLoop: (t) => ({ ty: -Math.abs(Math.sin(t * Math.PI)) * 16 }),
  rotateLoop: (t) => ({ rotate: (t * 60) % 360 }),
  sway: (t) => ({ rotate: osc(t, 3.5) * 4, tx: osc(t, 3.5) * 6 }),
  heartbeat: (t) => { const p = t % 1; const k = p < 0.12 ? p / 0.12 : p < 0.24 ? 1 - (p - 0.12) / 0.12 : p < 0.36 ? (p - 0.24) / 0.12 * 0.6 : p < 0.48 ? 0.6 - (p - 0.36) / 0.12 * 0.6 : 0; const s = 1 + k * 0.12; return { sx: s, sy: s }; },
  jelly: (t) => ({ sx: 1 + Math.sin(t * 6) * 0.05, sy: 1 - Math.sin(t * 6) * 0.05 }),
  neon: (t) => ({ glowMul: 0.5 + (Math.sin(t * 6) * 0.5 + 0.5) * 1.5 }),
  hueShift: (t) => ({ hue: (t * 40) % 360 }),
  typewriterLoop: () => ({}),
};

export const composeState = (parts: Partial<AnimState>[]): AnimState => {
  const s = identity();
  for (const p of parts) {
    if (!p) continue;
    if (p.opacity != null) s.opacity *= p.opacity;
    if (p.tx != null) s.tx += p.tx;
    if (p.ty != null) s.ty += p.ty;
    if (p.sx != null) s.sx *= p.sx;
    if (p.sy != null) s.sy *= p.sy;
    if (p.rotate != null) s.rotate += p.rotate;
    if (p.blur != null) s.blur += p.blur;
    if (p.ls != null) s.ls += p.ls;
    if (p.hue != null) s.hue += p.hue;
    if (p.glowMul != null) s.glowMul *= p.glowMul;
    if (p.clip != null) s.clip = p.clip;
    if (p.origin != null) s.origin = p.origin;
  }
  return s;
};

export const toCss = (s: AnimState): React.CSSProperties => {
  const filters: string[] = [];
  if (s.blur > 0.01) filters.push(`blur(${s.blur.toFixed(2)}px)`);
  if (Math.abs(s.hue) > 0.01) filters.push(`hue-rotate(${s.hue.toFixed(1)}deg)`);
  return {
    opacity: clamp01(s.opacity),
    transform: `translate(${s.tx.toFixed(2)}px, ${s.ty.toFixed(2)}px) scale(${s.sx.toFixed(3)}, ${s.sy.toFixed(3)}) rotate(${s.rotate.toFixed(2)}deg)`,
    transformOrigin: s.origin || 'center center',
    filter: filters.length ? filters.join(' ') : undefined,
    clipPath: s.clip,
    WebkitClipPath: s.clip,
  } as React.CSSProperties;
};
