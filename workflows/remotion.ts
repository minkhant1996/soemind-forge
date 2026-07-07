/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * Remotion Rendering Workflows (local text rendering)
 * ===================================================
 *
 * AI models generate great text-free backgrounds but garble typography.
 * These workflows close that gap: agents plan the copy (lines, sizes, colors,
 * timing) and make ONE call — Remotion renders pixel-perfect Sora/Inter type
 * over the generated backgrounds. Local only, no API cost.
 *
 *   renderKineticReel — scenes[] (bg + staggered kinetic text lines) + optional
 *                       voiceover/music → 1080x1920 9:16 reel .mp4
 *   renderSlideStill  — one bg + headline/sub/footer/logo → 1080x1350 slide .png
 *
 * All media inputs are REAL file paths (project assets/outputs); they are
 * staged into remotion/public/ automatically and cleaned up after the render.
 *
 *   node workflows/cli.cjs renderKineticReel '{"scenes":[...],"outputPath":"reel.mp4"}'
 *   node workflows/cli.cjs renderSlideStill '{"bg":"...","headline":"...","outputPath":"slide.png"}'
 *
 * Requires: `npm install` inside remotion/ (one-time). First render downloads
 * Remotion's headless browser.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import type { WorkflowResult, CostInfo } from './types.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

// =============================================================================
// SHARED HELPERS (self-contained, matching publish.ts conventions)
// =============================================================================

function errorResult<T>(code: string, message: string): WorkflowResult<T> {
  return { success: false, error: { code, message } };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

const ZERO_COST: CostInfo = { totalCost: 0, breakdown: {} };

/** Walk up from this module until we find the remotion/ module directory. */
function findRemotionDir(): string | null {
  let dir = MODULE_DIR;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'remotion');
    if (fs.existsSync(path.join(candidate, 'src', 'index.ts'))) return candidate;
    dir = path.dirname(dir);
  }
  return null;
}

function assertRemotionReady(remotionDir: string): void {
  if (!fs.existsSync(path.join(remotionDir, 'node_modules', 'remotion'))) {
    throw new Error(
      `Remotion is not installed. Run: cd ${remotionDir} && npm install`
    );
  }
}

/**
 * Copy every referenced media file into remotion/public/.staged/<id>/ and
 * return the rewritten (staticFile-relative) path. Remotion can only load
 * assets from its public/ dir.
 */
function makeStager(remotionDir: string) {
  const id = `run-${Date.now()}-${process.pid}`;
  const stageDir = path.join(remotionDir, 'public', '.staged', id);
  let counter = 0;
  const staged = new Map<string, string>();

  return {
    stage(filePath: string | undefined, label: string): string | undefined {
      if (!filePath) return undefined;
      if (staged.has(filePath)) return staged.get(filePath);
      if (!fs.existsSync(filePath)) {
        throw new Error(`${label} not found: ${filePath}`);
      }
      ensureDir(stageDir);
      const name = `${counter++}-${path.basename(filePath)}`;
      fs.copyFileSync(filePath, path.join(stageDir, name));
      const rel = `.staged/${id}/${name}`;
      staged.set(filePath, rel);
      return rel;
    },
    cleanup(): void {
      fs.rmSync(stageDir, { recursive: true, force: true });
    },
  };
}

function runRemotion(remotionDir: string, cmd: string): void {
  try {
    execSync(cmd, { cwd: remotionDir, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer })?.stderr?.toString() || '';
    const msg = stderr.split('\n').filter(Boolean).slice(-4).join(' ')
      || (error instanceof Error ? error.message : 'remotion render failed');
    throw new Error(`Remotion error: ${msg.trim()}`);
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface KineticLineInput {
  text: string;
  /** px; bigger = more emphasis. Default 64. */
  size?: number;
  /** Default navy #0F172A. Use gold #C8A24A for the ONE emphasized phrase. */
  color?: string;
  weight?: number;
  font?: 'sora' | 'inter';
  /** Seconds after scene start; default: staggered 0.55s per line. */
  delay?: number;
}

export interface KineticSceneInput {
  /** Real path to a TEXT-FREE background — image OR video clip (.mp4/.mov/.webm, e.g. a Veo render). */
  backgroundPath: string;
  seconds: number;
  lines: KineticLineInput[];
  /** Real path to a logo file, shown under the lines (end cards). */
  logoPath?: string;
  /** Vertical text placement. Accepts model output loosely ('Top', ' bottom\n') — sanitized. */
  align?: string;
  /** Frosted mist panel behind the text — set true on busy backgrounds. */
  scrim?: boolean;
  /** Video backgrounds only: keep the clip's native audio at this level (0-1). Default 0 (muted). */
  bgAudioVolume?: number;
}

export interface RenderKineticReelInput {
  scenes: KineticSceneInput[];
  outputPath: string;          // .mp4
  /** Real path to voiceover audio (wav/mp3). */
  audioPath?: string;
  /** Real path to music bed. */
  musicPath?: string;
  musicVolume?: number;        // 0..1, default 0.18
}

export interface RenderKineticReelOutput {
  videoPath: string;
  durationSeconds: number;
  cost: CostInfo;              // always $0 — local render
}

export interface RenderSlideStillInput {
  /** Real path to a TEXT-FREE background image. */
  backgroundPath: string;
  headline: string;
  sub?: string;
  footer?: string;             // e.g. "soemindai.com"
  logoPath?: string;
  align?: 'center' | 'top' | 'bottom';
  headlineSize?: number;       // px, default 72
  /** Frosted mist panel behind the text — set true on busy backgrounds. */
  scrim?: boolean;
  outputPath: string;          // .png
}

export interface RenderSlideStillOutput {
  imagePath: string;
  cost: CostInfo;
}

export interface CaptionCueInput {
  /** Seconds on the video timeline. */
  start: number;
  end: number;
  text: string;
}

export interface RenderCaptionedVideoInput {
  /** Real path to the finished video (audio is kept in the render). */
  videoPath: string;
  /** Timed cues — e.g. from transcribeAudio output, offset per scene. */
  cues: CaptionCueInput[];
  outputPath: string;          // .mp4
  fontSize?: number;           // px, default 52
  marginBottom?: number;       // px from bottom, default 280
  accentColor?: string;        // pill border accent
}

export interface RenderCaptionedVideoOutput {
  videoPath: string;
  durationSeconds: number;
  cost: CostInfo;              // always $0 — local render
}

// =============================================================================
// WORKFLOW: RENDER KINETIC REEL (Remotion, local, $0)
// =============================================================================

/**
 * Render a 9:16 kinetic-typography reel: text-free AI backgrounds + staggered
 * animated lines with per-line size/color emphasis + optional VO/music.
 * Use for: reels/shorts/tiktoks where the words carry the message.
 */
export async function renderKineticReel(
  input: RenderKineticReelInput
): Promise<WorkflowResult<RenderKineticReelOutput>> {
  if (!input.scenes?.length) {
    return errorResult('INVALID_INPUT', 'scenes[] is required (backgroundPath, seconds, lines[])');
  }
  if (!input.outputPath) return errorResult('INVALID_INPUT', 'outputPath is required (.mp4)');
  for (const [i, s] of input.scenes.entries()) {
    if (!s.backgroundPath) return errorResult('INVALID_INPUT', `scenes[${i}].backgroundPath is required`);
    if (!s.seconds || s.seconds <= 0) return errorResult('INVALID_INPUT', `scenes[${i}].seconds must be > 0`);
    if (!s.lines?.length) return errorResult('INVALID_INPUT', `scenes[${i}].lines[] is required`);
  }

  const remotionDir = findRemotionDir();
  if (!remotionDir) return errorResult('FILE_NOT_FOUND', 'remotion/ module not found in project');

  let stager: ReturnType<typeof makeStager> | null = null;
  let propsFile = '';
  try {
    assertRemotionReady(remotionDir);
    ensureDir(path.dirname(path.resolve(input.outputPath)));
    stager = makeStager(remotionDir);

    const props = {
      audio: stager.stage(input.audioPath, 'audioPath'),
      music: stager.stage(input.musicPath, 'musicPath'),
      musicVolume: input.musicVolume,
      scenes: input.scenes.map((s) => ({
        bg: stager!.stage(s.backgroundPath, 'backgroundPath'),
        seconds: s.seconds,
        lines: s.lines,
        logo: stager!.stage(s.logoPath, 'logoPath'),
        align: (() => {
          const a = String(s.align || '').trim().toLowerCase();
          return a === 'top' || a === 'bottom' ? a : 'center';
        })(),
        scrim: s.scrim,
        bgAudioVolume: s.bgAudioVolume,
      })),
    };

    propsFile = path.join(remotionDir, `.props-${Date.now()}.json`);
    fs.writeFileSync(propsFile, JSON.stringify(props));

    const outAbs = path.resolve(input.outputPath);
    console.error('[Workflow] Rendering kinetic reel (Remotion, local)...');
    runRemotion(
      remotionDir,
      `npx remotion render src/index.ts KineticReel "${outAbs}" --props="${propsFile}"`
    );

    if (!fs.existsSync(outAbs)) {
      return errorResult('FILE_WRITE_ERROR', 'Render completed but output file is missing');
    }
    console.error(`[Workflow] Reel saved: ${input.outputPath}`);
    const durationSeconds = input.scenes.reduce((a, s) => a + s.seconds, 0);
    return { success: true, data: { videoPath: input.outputPath, durationSeconds, cost: ZERO_COST } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] renderKineticReel failed: ${message}`);
    return errorResult('GENERATION_FAILED', message);
  } finally {
    stager?.cleanup();
    if (propsFile) fs.rmSync(propsFile, { force: true });
  }
}

// =============================================================================
// WORKFLOW: RENDER SLIDE STILL (Remotion, local, $0)
// =============================================================================

/**
 * Render one 1080x1350 slide: text-free AI background + pixel-perfect
 * headline/sub/footer typography (+ optional logo).
 * Use for: carousel slides, quote cards, stat cards, end cards.
 */
export async function renderSlideStill(
  input: RenderSlideStillInput
): Promise<WorkflowResult<RenderSlideStillOutput>> {
  if (!input.backgroundPath) return errorResult('INVALID_INPUT', 'backgroundPath is required');
  if (!input.headline?.trim()) return errorResult('INVALID_INPUT', 'headline is required');
  if (!input.outputPath) return errorResult('INVALID_INPUT', 'outputPath is required (.png)');

  const remotionDir = findRemotionDir();
  if (!remotionDir) return errorResult('FILE_NOT_FOUND', 'remotion/ module not found in project');

  let stager: ReturnType<typeof makeStager> | null = null;
  let propsFile = '';
  try {
    assertRemotionReady(remotionDir);
    ensureDir(path.dirname(path.resolve(input.outputPath)));
    stager = makeStager(remotionDir);

    const props = {
      bg: stager.stage(input.backgroundPath, 'backgroundPath'),
      headline: input.headline,
      sub: input.sub,
      footer: input.footer,
      logo: stager.stage(input.logoPath, 'logoPath'),
      align: input.align,
      headlineSize: input.headlineSize,
      scrim: input.scrim,
    };

    propsFile = path.join(remotionDir, `.props-${Date.now()}.json`);
    fs.writeFileSync(propsFile, JSON.stringify(props));

    const outAbs = path.resolve(input.outputPath);
    console.error('[Workflow] Rendering slide still (Remotion, local)...');
    runRemotion(
      remotionDir,
      `npx remotion still src/index.ts Slide "${outAbs}" --props="${propsFile}"`
    );

    if (!fs.existsSync(outAbs)) {
      return errorResult('FILE_WRITE_ERROR', 'Render completed but output file is missing');
    }
    console.error(`[Workflow] Slide saved: ${input.outputPath}`);
    return { success: true, data: { imagePath: input.outputPath, cost: ZERO_COST } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] renderSlideStill failed: ${message}`);
    return errorResult('GENERATION_FAILED', message);
  } finally {
    stager?.cleanup();
    if (propsFile) fs.rmSync(propsFile, { force: true });
  }
}

// =============================================================================
// WORKFLOW: RENDER CAPTIONED VIDEO (Remotion, local, $0)
// =============================================================================

/**
 * Burn timed captions over a finished video — $0, local. Complex scripts
 * (Burmese/Thai/…) shape correctly because the render runs in Chromium with
 * OS font fallback ('Myanmar MN', 'Noto Sans Myanmar').
 *
 * Cues come from `transcribeAudio` output: offset each scene's timestamps by
 * the scene's start time on the assembled timeline.
 */
export async function renderCaptionedVideo(
  input: RenderCaptionedVideoInput
): Promise<WorkflowResult<RenderCaptionedVideoOutput>> {
  if (!input.videoPath) return errorResult('INVALID_INPUT', 'videoPath is required');
  if (!input.cues?.length) return errorResult('INVALID_INPUT', 'cues[] is required ({start,end,text} seconds)');
  if (!input.outputPath) return errorResult('INVALID_INPUT', 'outputPath is required (.mp4)');
  for (const [i, c] of input.cues.entries()) {
    if (typeof c.start !== 'number' || typeof c.end !== 'number' || c.end <= c.start || !c.text) {
      return errorResult('INVALID_INPUT', `cues[${i}] must be {start<end (seconds), text}`);
    }
  }

  const remotionDir = findRemotionDir();
  if (!remotionDir) return errorResult('FILE_NOT_FOUND', 'remotion/ module not found in project');

  let stager: ReturnType<typeof makeStager> | null = null;
  let propsFile = '';
  try {
    assertRemotionReady(remotionDir);
    if (!fs.existsSync(input.videoPath)) return errorResult('FILE_NOT_FOUND', `Video not found: ${input.videoPath}`);
    ensureDir(path.dirname(path.resolve(input.outputPath)));

    const durationSeconds = Number(
      execSync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${path.resolve(input.videoPath)}"`,
        { encoding: 'utf8' }
      ).trim()
    );
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return errorResult('GENERATION_FAILED', 'Could not read video duration via ffprobe');
    }

    stager = makeStager(remotionDir);
    const props = {
      video: stager.stage(input.videoPath, 'videoPath'),
      cues: input.cues,
      durationSeconds,
      fontSize: input.fontSize,
      marginBottom: input.marginBottom,
      accentColor: input.accentColor,
    };
    propsFile = path.join(remotionDir, `.props-${Date.now()}.json`);
    fs.writeFileSync(propsFile, JSON.stringify(props));

    const outAbs = path.resolve(input.outputPath);
    console.error('[Workflow] Rendering captioned video (Remotion, local)...');
    runRemotion(
      remotionDir,
      `npx remotion render src/index.ts CaptionedVideo "${outAbs}" --props="${propsFile}"`
    );

    if (!fs.existsSync(outAbs)) {
      return errorResult('FILE_WRITE_ERROR', 'Render completed but output file is missing');
    }
    console.error(`[Workflow] Captioned video saved: ${input.outputPath}`);
    return { success: true, data: { videoPath: input.outputPath, durationSeconds, cost: ZERO_COST } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] renderCaptionedVideo failed: ${message}`);
    return errorResult('GENERATION_FAILED', message);
  } finally {
    stager?.cleanup();
    if (propsFile) fs.rmSync(propsFile, { force: true });
  }
}
