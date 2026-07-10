// Frame-aware text helpers — let an agent decide text placement/size/color like a
// human art director, and turn transcripts into timed text elements.
//   suggestTextPlacement — vision finds the empty region + subject; sharp samples
//     the region's luminance/variance → returns {x,y,maxWidth,size,color,scrim}
//     ready to drop into renderTextMotion.
//   transcriptToElements — transcript cues → timed renderTextMotion elements.
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { execFileSync } from 'child_process';
import { analyzeImage } from './index.js';

type CostInfo = { totalCost: number; breakdown: Record<string, number> };
type WFResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };
const ok = <T>(data: T): WFResult<T> => ({ success: true, data });
const fail = (code: string, message: string): WFResult<any> => ({ success: false, error: { code, message } });

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function clampRegion(r: any): { x: number; y: number; w: number; h: number } {
  const x = clamp(Number(r?.x) || 0, 0, 1);
  const y = clamp(Number(r?.y) || 0, 0, 1);
  const w = clamp(Number(r?.w) || 0.5, 0.05, 1 - x);
  const h = clamp(Number(r?.h) || 0.2, 0.03, 1 - y);
  return { x, y, w, h };
}

function safeJson(text: string): any {
  if (!text) return null;
  let t = String(text).trim().replace(/^```(json)?/i, '').replace(/```$/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  t = t.replace(/,\s*([}\]])/g, '$1'); // tolerate trailing commas
  try { return JSON.parse(t); } catch { return null; }
}

// Vision call with retry — returns parsed JSON (or null) + cost. Robust against
// the model occasionally wrapping JSON in prose/fences.
async function visionAnalyze(framePng: string, prompt: string, tries = 2): Promise<{ parsed: any; cost: CostInfo }> {
  let cost: CostInfo = { totalCost: 0, breakdown: {} };
  for (let i = 0; i < tries; i++) {
    try {
      const vis: any = await analyzeImage({
        imagePath: framePng, prompt,
        systemPrompt: 'You output ONLY minified JSON. No prose, no markdown, no code fences, no explanation.',
      });
      if (vis?.success && vis.data) {
        if (vis.data.cost) cost = { totalCost: (cost.totalCost || 0) + (vis.data.cost.totalCost || 0), breakdown: { ...cost.breakdown, ...vis.data.cost.breakdown } };
        const p = safeJson(vis.data.text);
        if (p) return { parsed: p, cost };
      }
    } catch { /* retry */ }
  }
  return { parsed: null, cost };
}

// ---------------------------------------------------------------------------
export interface SuggestTextPlacementInput {
  framePath: string;                 // image OR video (a frame is extracted)
  text: string;                      // the text to place (drives size/width)
  intent?: string;                   // "hook" | "title" | "caption" | free text
  canvasWidth?: number;              // default = frame width
  canvasHeight?: number;
  avoid?: Array<{ x: number; y: number; w: number; h: number }>; // normalized regions to keep clear
  maxSizePx?: number;                // default 160
  minSizePx?: number;                // default 30
}
export interface TextPlacement {
  x: number; y: number; anchor: string; align: 'center';
  maxWidth: number; size: number; color: string;
  scrim: boolean; scrimColor?: string;
}
export interface SuggestTextPlacementOutput {
  placement: TextPlacement;
  region: { x: number; y: number; w: number; h: number };
  subject: { x: number; y: number; w: number; h: number } | null;
  brightness: number; busy: boolean; reasoning: string;
  cost: CostInfo;
}

export async function suggestTextPlacement(
  input: SuggestTextPlacementInput
): Promise<WFResult<SuggestTextPlacementOutput>> {
  if (!input?.framePath) return fail('INVALID_INPUT', 'framePath is required');
  if (!input?.text) return fail('INVALID_INPUT', 'text is required');
  if (!fs.existsSync(input.framePath)) return fail('FILE_NOT_FOUND', `frame not found: ${input.framePath}`);

  let tmp = '';
  try {
    // 1. ensure a still frame
    let framePng = input.framePath;
    if (/\.(mp4|mov|webm|m4v)$/i.test(input.framePath)) {
      tmp = path.join(path.dirname(input.framePath), `.stp-frame-${process.pid}.png`);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '0.5', '-i', input.framePath, '-vframes', '1', tmp]);
      framePng = tmp;
    }

    const meta = await sharp(framePng).metadata();
    const W = input.canvasWidth ?? meta.width ?? 1080;
    const H = input.canvasHeight ?? meta.height ?? 1920;

    // 2. vision: WHERE to place + subject to avoid + suggested color
    const avoidNote = input.avoid?.length
      ? ` Keep clear of these already-used normalized regions: ${JSON.stringify(input.avoid)}.` : '';
    const prompt =
      `You are a motion-graphics art director choosing where to place ${input.intent || 'text'} on this frame.\n` +
      `Text to place: "${input.text}".${avoidNote}\n` +
      `Return STRICT minified JSON only, no prose, no code fences:\n` +
      `{"region":{"x":0..1,"y":0..1,"w":0..1,"h":0..1},"subject":{"x":0..1,"y":0..1,"w":0..1,"h":0..1} or null,` +
      `"background":"light"|"dark"|"busy","suggestedColor":"#RRGGBB","reasoning":"one sentence"}\n` +
      `region = the best empty area (x,y = top-left) with clear negative space, away from the subject and key detail.`;

    let region = { x: 0.08, y: 0.08, w: 0.84, h: 0.2 };
    let subject: any = null; let vbg = 'light'; let reasoning = 'fallback: default upper band';
    const { parsed: p, cost } = await visionAnalyze(framePng, prompt);
    if (p) {
      if (p.region) region = clampRegion(p.region);
      subject = p.subject ? clampRegion(p.subject) : null;
      vbg = p.background || vbg;
      reasoning = p.reasoning || reasoning;
    }

    // 3. pixel-sample the region: mean luminance + variance (busy?)
    const left = clamp(Math.round(region.x * W), 0, W - 1);
    const top = clamp(Math.round(region.y * H), 0, H - 1);
    const width = clamp(Math.round(region.w * W), 8, W - left);
    const height = clamp(Math.round(region.h * H), 8, H - top);
    const { data } = await sharp(framePng).extract({ left, top, width, height })
      .resize(16, 16, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let sum = 0, sum2 = 0, count = 0;
    for (let i = 0; i + 2 < data.length; i += 3) {
      const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      sum += l; sum2 += l * l; count++;
    }
    const mean = count ? sum / count : 0.5;
    const std = Math.sqrt(Math.max(0, count ? sum2 / count - mean * mean : 0));
    const busy = std > 0.16 || vbg === 'busy';

    // 4. color + scrim: readable regardless of bg. Busy → frosted scrim + dark ink.
    const scrim = busy;
    const color = scrim ? '#14171c' : (mean > 0.55 ? '#14171c' : '#f5f7fb');
    const scrimColor = scrim ? 'rgba(246,248,251,0.88)' : undefined;

    // 5. fit size to the region width (single-line estimate; agent can wrap via maxWidth)
    const maxWidthFrac = clamp(region.w, 0.4, 0.94);
    const maxWidthPx = maxWidthFrac * W * 0.94;
    const CHAR = 0.56; // avg glyph advance / fontSize for Sora bold
    let size = maxWidthPx / Math.max(1, input.text.length * CHAR);
    size = Math.min(size, region.h * H * 0.8, input.maxSizePx ?? 160);
    size = Math.max(size, input.minSizePx ?? 30);
    size = Math.round(size);

    const placement: TextPlacement = {
      x: +(region.x + region.w / 2).toFixed(4),
      y: +(region.y + region.h / 2).toFixed(4),
      anchor: 'center', align: 'center',
      maxWidth: +maxWidthFrac.toFixed(4),
      size, color, scrim, scrimColor,
    };

    return ok({ placement, region, subject, brightness: +mean.toFixed(3), busy, reasoning, cost });
  } catch (error) {
    return fail('GENERATION_FAILED', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
  }
}

// ---------------------------------------------------------------------------
// suggestTextDesign — placement + WHICH creative style + animation + font.
// Superset of suggestTextPlacement: same vision pass classifies the scene, then a
// scene→style table recommends the treatment. Agent can accept or override any field.
const STYLE_MAP: Record<string, { style: string; in: string; out: string; loop: string; font: string }> = {
  'cinematic-broll': { style: 'behind-subject', in: 'fadeUp', out: 'fadeOut', loop: 'none', font: 'sora' },
  'talking-head': { style: 'lower-third-pill', in: 'rise', out: 'fadeOut', loop: 'none', font: 'inter' },
  'flat-graphic': { style: 'gradient-hero', in: 'pop', out: 'sink', loop: 'float', font: 'sora' },
  'product': { style: 'video-in-text', in: 'zoomIn', out: 'zoomOut', loop: 'pulse', font: 'sora' },
  'before-after': { style: 'chips', in: 'fadeIn', out: 'fadeOut', loop: 'none', font: 'inter' },
  'celebratory': { style: 'script-accent', in: 'rise', out: 'fadeOut', loop: 'breathe', font: 'caveat' },
  'screenshot-ui': { style: 'lower-third-pill', in: 'fadeUp', out: 'fadeOut', loop: 'none', font: 'inter' },
};
const DEFAULT_STYLE = { style: 'gradient-hero', in: 'fadeUp', out: 'fadeOut', loop: 'none', font: 'sora' };

export interface SuggestTextDesignOutput extends SuggestTextPlacementOutput {
  sceneType: string;
  style: string; in: string; out: string; loop: string; font: string;
  emphasis: string;
}

export async function suggestTextDesign(
  input: SuggestTextPlacementInput
): Promise<WFResult<SuggestTextDesignOutput>> {
  if (!input?.framePath) return fail('INVALID_INPUT', 'framePath is required');
  if (!input?.text) return fail('INVALID_INPUT', 'text is required');
  if (!fs.existsSync(input.framePath)) return fail('FILE_NOT_FOUND', `frame not found: ${input.framePath}`);

  let tmp = '';
  try {
    let framePng = input.framePath;
    if (/\.(mp4|mov|webm|m4v)$/i.test(input.framePath)) {
      tmp = path.join(path.dirname(input.framePath), `.std-frame-${process.pid}.png`);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '0.5', '-i', input.framePath, '-vframes', '1', tmp]);
      framePng = tmp;
    }
    const meta = await sharp(framePng).metadata();
    const W = input.canvasWidth ?? meta.width ?? 1080;
    const H = input.canvasHeight ?? meta.height ?? 1920;

    const prompt =
      `You are a motion-graphics art director. Analyze this frame and return STRICT minified JSON only:\n` +
      `{"sceneType":"cinematic-broll"|"talking-head"|"flat-graphic"|"product"|"before-after"|"celebratory"|"screenshot-ui",` +
      `"region":{"x":0..1,"y":0..1,"w":0..1,"h":0..1},"subject":{"x":0..1,"y":0..1,"w":0..1,"h":0..1} or null,` +
      `"background":"light"|"dark"|"busy","suggestedColor":"#RRGGBB","reasoning":"one sentence"}\n` +
      `Text to place: "${input.text}" (intent: ${input.intent || 'headline'}). ` +
      `region = best empty area with negative space; subject = main person/product to avoid or place behind.`;

    let region = { x: 0.08, y: 0.08, w: 0.84, h: 0.2 };
    let subject: any = null; let vbg = 'light'; let sceneType = 'flat-graphic';
    let reasoning = 'fallback';
    const { parsed: p, cost } = await visionAnalyze(framePng, prompt);
    if (p) {
      if (p.region) region = clampRegion(p.region);
      subject = p.subject ? clampRegion(p.subject) : null;
      vbg = p.background || vbg;
      if (typeof p.sceneType === 'string' && STYLE_MAP[p.sceneType]) sceneType = p.sceneType;
      reasoning = p.reasoning || reasoning;
    }

    const rec = STYLE_MAP[sceneType] || DEFAULT_STYLE;
    const behind = rec.style === 'behind-subject';

    // pixel-sample the placement region for luminance/contrast
    const left = clamp(Math.round(region.x * W), 0, W - 1);
    const top = clamp(Math.round(region.y * H), 0, H - 1);
    const rw = clamp(Math.round(region.w * W), 8, W - left);
    const rh = clamp(Math.round(region.h * H), 8, H - top);
    const { data } = await sharp(framePng).extract({ left, top, width: rw, height: rh })
      .resize(16, 16, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let sum = 0, sum2 = 0, n = 0;
    for (let i = 0; i + 2 < data.length; i += 3) {
      const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      sum += l; sum2 += l * l; n++;
    }
    const mean = n ? sum / n : 0.5;
    const std = Math.sqrt(Math.max(0, n ? sum2 / n - mean * mean : 0));
    const busy = std > 0.16 || vbg === 'busy';

    // placement: behind-subject centers a big hero over the subject; else negative space
    let px: number, py: number, maxWidthFrac: number, size: number, color: string, scrim: boolean, scrimColor: string | undefined;
    if (behind && subject) {
      px = +(subject.x + subject.w / 2).toFixed(4);
      py = +(subject.y + subject.h / 2 - 0.05).toFixed(4);
      maxWidthFrac = 0.98; // big, bleed
      size = Math.round(Math.min(input.maxSizePx ?? 200, (W * 0.98) / Math.max(1, input.text.length * 0.5)));
      color = mean > 0.5 ? '#14171c' : '#f5d84a'; // bold solid reads well behind subject
      scrim = false; scrimColor = undefined;
    } else {
      px = +(region.x + region.w / 2).toFixed(4);
      py = +(region.y + region.h / 2).toFixed(4);
      maxWidthFrac = clamp(region.w, 0.4, 0.94);
      const maxWidthPx = maxWidthFrac * W * 0.94;
      size = Math.min(maxWidthPx / Math.max(1, input.text.length * 0.56), rh * 0.8, input.maxSizePx ?? 160);
      size = Math.round(Math.max(size, input.minSizePx ?? 30));
      scrim = busy;
      color = scrim ? '#14171c' : (mean > 0.55 ? '#14171c' : '#f5f7fb');
      scrimColor = scrim ? 'rgba(246,248,251,0.88)' : undefined;
    }

    const placement: TextPlacement = { x: px, y: py, anchor: 'center', align: 'center', maxWidth: +maxWidthFrac.toFixed(4), size, color, scrim, scrimColor };
    return ok({
      placement, region, subject, brightness: +mean.toFixed(3), busy, reasoning, cost,
      sceneType, style: rec.style, in: rec.in, out: rec.out, loop: rec.loop, font: rec.font,
      emphasis: 'accent-keyword',
    });
  } catch (error) {
    return fail('GENERATION_FAILED', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
  }
}

// ---------------------------------------------------------------------------
export interface TranscriptCue { start: number; end: number; text: string; }
export interface TranscriptToElementsInput {
  cues: TranscriptCue[];
  mode?: 'caption' | 'hero';         // caption = lower-third; hero = center big
  x?: number; y?: number; anchor?: string; size?: number; color?: string;
  in?: string; out?: string; font?: 'sora' | 'inter'; weight?: number;
  extendEnd?: number;                // seconds added to each cue end (default 0.15)
  style?: Record<string, any>;       // extra props merged into every element
}
export function transcriptToElements(
  input: TranscriptToElementsInput
): WFResult<{ elements: any[]; count: number }> {
  if (!input?.cues?.length) return fail('INVALID_INPUT', 'cues[] is required');
  const mode = input.mode ?? 'caption';
  const base = mode === 'hero'
    ? { x: 0.5, y: 0.4, anchor: 'center', size: 96, color: '#ffffff', weight: 800, in: 'pop', out: 'fadeOut' }
    : { x: 0.5, y: 0.82, anchor: 'bottom-center', size: 46, color: '#ffffff', weight: 700, in: 'fadeUp', out: 'fadeOut' };
  const d = {
    x: input.x ?? base.x, y: input.y ?? base.y, anchor: input.anchor ?? base.anchor,
    size: input.size ?? base.size, color: input.color ?? base.color,
    weight: input.weight ?? base.weight, in: input.in ?? base.in, out: input.out ?? base.out,
    font: input.font,
  };
  const ext = input.extendEnd ?? 0.15;
  const elements = input.cues.map((c) => ({
    text: c.text, start: +c.start, end: +(c.end + ext),
    x: d.x, y: d.y, anchor: d.anchor, align: 'center',
    size: d.size, color: d.color, weight: d.weight, font: d.font,
    in: d.in, out: d.out, inDuration: 0.25, outDuration: 0.2,
    ...(input.style || {}),
  }));
  return ok({ elements, count: elements.length });
}
