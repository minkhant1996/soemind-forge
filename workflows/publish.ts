/**
 * Publish & Repurpose Workflows
 * =============================
 *
 * Close the gap between "generated file on disk" and "thing you upload":
 *
 *   packageContent  — one asset + copy → a ready-to-upload folder per platform
 *                     (correctly sized media, caption.txt within char limits,
 *                     alt-text.txt, post.json manifest). Local only, no API cost.
 *   transcribeVideo — video/audio → transcript text file (Whisper via OpenRouter).
 *   extractClip     — cut a segment out of a long video, optionally center-crop
 *                     to a vertical/square ratio for Shorts/Reels. Local only.
 *
 * All run via the CLI like every other workflow:
 *   node workflows/cli.cjs packageContent '{"mediaPath":"...","platforms":["instagram","tiktok"],...}'
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import type { WorkflowResult, CostInfo } from './types.js';
import { transcribe } from '../openrouter/openrouter-provider.js';

// =============================================================================
// SHARED HELPERS (self-contained — index.ts helpers are not exported)
// =============================================================================

function errorResult<T>(code: string, message: string): WorkflowResult<T> {
  return { success: false, error: { code, message } };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function assertFfmpegInstalled(): void {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    throw new Error('FFmpeg not found. Install ffmpeg to use publish/repurpose workflows.');
  }
}

function runFfmpegCmd(cmd: string): void {
  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer })?.stderr?.toString() || '';
    const msg = stderr.split('\n').filter(Boolean).slice(-2).join(' ')
      || (error instanceof Error ? error.message : 'ffmpeg failed');
    throw new Error(`FFmpeg error: ${msg.trim()}`);
  }
}

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi']);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function isVideoFile(p: string): boolean {
  return VIDEO_EXTS.has(path.extname(p).toLowerCase());
}

/** "90", 90, "1:30", "01:01:30.5" → seconds */
function parseTimeToSeconds(t: number | string): number {
  if (typeof t === 'number') return t;
  const parts = t.split(':').map(Number);
  if (parts.some(Number.isNaN)) throw new Error(`Invalid time "${t}" — use seconds, "MM:SS", or "HH:MM:SS"`);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

// =============================================================================
// WORKFLOW: packageContent  (platform export packs)
// =============================================================================

export type PublishPlatform =
  | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin' | 'twitter';

export type PublishContentType = 'feed' | 'story' | 'reel' | 'short' | 'long';

interface PlatformSpec {
  width: number;
  height: number;
  ratio: string;
  captionLimit: number;   // hard character limit for caption text incl. hashtags
  hashtagMax: number;     // platform best-practice ceiling — extras are dropped
  notes: string;
}

// Sizes/ratios per workflows/PLATFORM-SPECS.md; caption limits per platform docs.
const PLATFORM_SPECS: Record<PublishPlatform, Partial<Record<PublishContentType, PlatformSpec>>> = {
  instagram: {
    feed: { width: 1080, height: 1350, ratio: '4:5', captionLimit: 2200, hashtagMax: 30, notes: 'Portrait 4:5 takes the most feed space; 5-10 hashtags is the sweet spot.' },
    story: { width: 1080, height: 1920, ratio: '9:16', captionLimit: 2200, hashtagMax: 10, notes: 'Text is usually added in-app; keep caption as overlay reference.' },
    reel: { width: 1080, height: 1920, ratio: '9:16', captionLimit: 2200, hashtagMax: 30, notes: '15-90s. Cover image can be set on upload.' },
  },
  tiktok: {
    feed: { width: 1080, height: 1350, ratio: '4:5', captionLimit: 2200, hashtagMax: 6, notes: 'Photo mode post.' },
    reel: { width: 1080, height: 1920, ratio: '9:16', captionLimit: 2200, hashtagMax: 6, notes: '3-6 hashtags outperform hashtag walls on TikTok.' },
    short: { width: 1080, height: 1920, ratio: '9:16', captionLimit: 2200, hashtagMax: 6, notes: 'Same as reel.' },
  },
  youtube: {
    short: { width: 1080, height: 1920, ratio: '9:16', captionLimit: 100, hashtagMax: 3, notes: 'captionLimit is the TITLE limit; put long copy in description.txt.' },
    long: { width: 1920, height: 1080, ratio: '16:9', captionLimit: 100, hashtagMax: 15, notes: 'captionLimit is the TITLE limit; description supports 5000 chars.' },
  },
  facebook: {
    feed: { width: 1080, height: 1350, ratio: '4:5', captionLimit: 63206, hashtagMax: 3, notes: 'Keep the first 125 chars strong — that is what shows before "See more".' },
    story: { width: 1080, height: 1920, ratio: '9:16', captionLimit: 2200, hashtagMax: 3, notes: '' },
    reel: { width: 1080, height: 1920, ratio: '9:16', captionLimit: 2200, hashtagMax: 3, notes: '' },
    long: { width: 1920, height: 1080, ratio: '16:9', captionLimit: 63206, hashtagMax: 3, notes: '' },
  },
  linkedin: {
    feed: { width: 1080, height: 1080, ratio: '1:1', captionLimit: 3000, hashtagMax: 5, notes: 'First 140 chars show before "…see more". 3-5 professional hashtags.' },
    long: { width: 1920, height: 1080, ratio: '16:9', captionLimit: 3000, hashtagMax: 5, notes: '' },
  },
  twitter: {
    feed: { width: 1200, height: 675, ratio: '16:9', captionLimit: 280, hashtagMax: 2, notes: '280 chars INCLUDING hashtags and a ~23-char t.co link.' },
    long: { width: 1920, height: 1080, ratio: '16:9', captionLimit: 280, hashtagMax: 2, notes: '' },
  },
};

export interface PackageContentInput {
  /** Image or video file to publish */
  mediaPath: string;
  /** Platforms to build packs for */
  platforms: PublishPlatform[];
  /** What kind of post; default: 'reel'/'short' for videos, 'feed' for images */
  contentType?: PublishContentType;
  /** Post copy (YouTube: used as description; provide `title` separately) */
  caption?: string;
  /** YouTube/long-form title (falls back to first caption line) */
  title?: string;
  /** Without '#' or with — normalized either way */
  hashtags?: string[];
  /** Accessibility alt text for images */
  altText?: string;
  /** Link to include after the caption */
  link?: string;
  /** Pack root; one subfolder per platform is created inside */
  outputDir: string;
  /** Resize/pad media to each platform's spec (default true; false = copy as-is) */
  resize?: boolean;
  /** Pad color when the source ratio doesn't match (default: black video, white image) */
  padColor?: string;
}

export interface PlatformPack {
  platform: PublishPlatform;
  contentType: PublishContentType;
  dir: string;
  mediaPath: string;
  captionPath: string;
  spec: { width: number; height: number; ratio: string };
  warnings: string[];
}

export interface PackageContentOutput {
  packDir: string;
  packs: PlatformPack[];
  cost: CostInfo;
}

/**
 * Build a ready-to-upload folder per platform from one asset + copy.
 * Local only (ffmpeg) — no API cost.
 */
export async function packageContent(
  input: PackageContentInput
): Promise<WorkflowResult<PackageContentOutput>> {
  if (!input.mediaPath) return errorResult('INVALID_INPUT', 'mediaPath is required');
  if (!input.outputDir) return errorResult('INVALID_INPUT', 'outputDir is required');
  if (!input.platforms?.length) return errorResult('INVALID_INPUT', 'platforms[] is required, e.g. ["instagram","tiktok"]');
  if (!fs.existsSync(input.mediaPath)) return errorResult('FILE_NOT_FOUND', `Media not found: ${input.mediaPath}`);

  const isVideo = isVideoFile(input.mediaPath);
  if (!isVideo && !IMAGE_EXTS.has(path.extname(input.mediaPath).toLowerCase())) {
    return errorResult('INVALID_INPUT', `Unsupported media type: ${path.extname(input.mediaPath)}`);
  }
  const contentType: PublishContentType = input.contentType ?? (isVideo ? 'reel' : 'feed');
  const resize = input.resize !== false;

  try {
    if (resize) assertFfmpegInstalled();
    ensureDir(input.outputDir);

    const hashtags = (input.hashtags ?? [])
      .map((h) => (h.startsWith('#') ? h : `#${h}`).replace(/\s+/g, ''));

    const packs: PlatformPack[] = [];
    for (const platform of input.platforms) {
      const byType = PLATFORM_SPECS[platform];
      if (!byType) return errorResult('INVALID_INPUT', `Unknown platform: ${platform}`);
      // Fall back sensibly when a platform lacks the exact content type
      // (e.g. 'reel' on youtube → 'short', 'short' on instagram → 'reel').
      const spec = byType[contentType]
        ?? byType[contentType === 'reel' ? 'short' : contentType === 'short' ? 'reel' : 'feed']
        ?? byType.feed ?? byType.long;
      if (!spec) return errorResult('INVALID_INPUT', `${platform} has no spec for contentType "${contentType}"`);

      const warnings: string[] = [];
      const dir = path.join(input.outputDir, platform);
      ensureDir(dir);

      // --- media ---
      const outExt = isVideo ? '.mp4' : '.png';
      const mediaOut = path.join(dir, `media${outExt}`);
      if (resize) {
        const pad = input.padColor ?? (isVideo ? 'black' : 'white');
        const vf = `scale=${spec.width}:${spec.height}:force_original_aspect_ratio=decrease,`
          + `pad=${spec.width}:${spec.height}:(ow-iw)/2:(oh-ih)/2:color=${pad}`;
        const cmd = isVideo
          ? `ffmpeg -y -i "${input.mediaPath}" -vf "${vf}" -c:v libx264 -preset medium -crf 18 -c:a aac -movflags +faststart "${mediaOut}"`
          : `ffmpeg -y -i "${input.mediaPath}" -vf "${vf}" "${mediaOut}"`;
        runFfmpegCmd(cmd);
      } else {
        fs.copyFileSync(input.mediaPath, path.join(dir, `media${path.extname(input.mediaPath).toLowerCase()}`));
      }

      // --- caption / title / hashtags, within platform limits ---
      const tags = hashtags.slice(0, spec.hashtagMax);
      if (hashtags.length > tags.length) {
        warnings.push(`Dropped ${hashtags.length - tags.length} hashtag(s) — ${platform} best practice is <= ${spec.hashtagMax}`);
      }

      let body = (input.caption ?? '').trim();
      const suffixParts = [tags.join(' '), input.link?.trim()].filter(Boolean) as string[];
      const suffix = suffixParts.length ? `\n\n${suffixParts.join('\n')}` : '';

      const isYouTube = platform === 'youtube';
      // YouTube: captionLimit governs the TITLE; description gets the caption.
      const limit = isYouTube ? 5000 : spec.captionLimit;
      if (body.length + suffix.length > limit) {
        const room = Math.max(0, limit - suffix.length - 1);
        body = `${body.slice(0, room).replace(/\s+\S*$/, '')}…`;
        warnings.push(`Caption truncated to fit ${platform}'s ${limit}-char limit`);
      }

      const captionPath = path.join(dir, isYouTube ? 'description.txt' : 'caption.txt');
      fs.writeFileSync(captionPath, `${body}${suffix}\n`, 'utf8');

      if (isYouTube) {
        let title = (input.title ?? body.split('\n')[0] ?? '').trim();
        if (title.length > spec.captionLimit) {
          title = `${title.slice(0, spec.captionLimit - 1).replace(/\s+\S*$/, '')}…`;
          warnings.push(`Title truncated to ${spec.captionLimit} chars`);
        }
        fs.writeFileSync(path.join(dir, 'title.txt'), `${title}\n`, 'utf8');
      }

      if (input.altText && !isVideo) {
        fs.writeFileSync(path.join(dir, 'alt-text.txt'), `${input.altText.trim()}\n`, 'utf8');
      }

      // --- manifest ---
      const files = fs.readdirSync(dir).sort();
      fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify({
        platform,
        contentType,
        spec: { width: spec.width, height: spec.height, ratio: spec.ratio },
        files,
        captionChars: body.length + suffix.length,
        hashtags: tags,
        link: input.link ?? null,
        notes: spec.notes,
        warnings,
        source: path.resolve(input.mediaPath),
        created: new Date().toISOString(),
      }, null, 2), 'utf8');

      packs.push({
        platform,
        contentType,
        dir,
        mediaPath: mediaOut,
        captionPath,
        spec: { width: spec.width, height: spec.height, ratio: spec.ratio },
        warnings,
      });
    }

    return { success: true, data: { packDir: input.outputDir, packs, cost: { totalCost: 0, breakdown: {} } } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during packaging';
    console.error(`[Workflow] packageContent failed: ${message}`);
    return errorResult('FFMPEG_ERROR', message);
  }
}

// =============================================================================
// WORKFLOW: transcribeVideo  (video/audio → transcript, Whisper via OpenRouter)
// =============================================================================

export interface TranscribeVideoInput {
  /** Video or audio file */
  mediaPath: string;
  /** Where to save the transcript (default: alongside media, .txt) */
  outputPath?: string;
  /** OpenRouter STT model (default: openai/whisper-large-v3) */
  model?: string;
  /** ISO-639-1 language hint, e.g. "en" */
  language?: string;
}

export interface TranscribeVideoOutput {
  text: string;
  transcriptPath: string;
  durationMinutes: number;
  cost: CostInfo;
}

/**
 * Transcribe a video (or audio file) to text. Extracts mono 16 kHz audio with
 * ffmpeg, then transcribes via OpenRouter STT. Requires OPENROUTER_API_KEY.
 */
export async function transcribeVideo(
  input: TranscribeVideoInput
): Promise<WorkflowResult<TranscribeVideoOutput>> {
  if (!input.mediaPath) return errorResult('INVALID_INPUT', 'mediaPath is required');
  if (!fs.existsSync(input.mediaPath)) return errorResult('FILE_NOT_FOUND', `Media not found: ${input.mediaPath}`);
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEYS) {
    return errorResult('MISSING_API_KEY', 'transcribeVideo needs OPENROUTER_API_KEY in .env (get one at https://openrouter.ai/keys)');
  }

  const ext = path.extname(input.mediaPath).toLowerCase();
  const transcriptPath = input.outputPath
    ?? path.join(path.dirname(input.mediaPath), `${path.basename(input.mediaPath, ext)}-transcript.txt`);

  let tempWav: string | null = null;
  try {
    // Whisper wants clean audio; extract/downmix unless it's already a wav.
    let audioFile = input.mediaPath;
    if (ext !== '.wav') {
      assertFfmpegInstalled();
      tempWav = path.join(path.dirname(transcriptPath), `.transcribe-tmp-${process.pid}.wav`);
      ensureDir(path.dirname(tempWav));
      runFfmpegCmd(`ffmpeg -y -i "${input.mediaPath}" -vn -ac 1 -ar 16000 "${tempWav}"`);
      audioFile = tempWav;
    }

    const result = await transcribe({
      model: (input.model ?? 'openai/whisper-large-v3') as never,
      audio: fs.readFileSync(audioFile),
      config: { format: 'wav', ...(input.language && { language: input.language }) },
    });

    if (!result.success) {
      return errorResult(result.error.code || 'STT_TRANSCRIPTION_ERROR',
        result.error.message || 'Transcription failed');
    }

    ensureDir(path.dirname(transcriptPath));
    fs.writeFileSync(transcriptPath, `${result.data.text.trim()}\n`, 'utf8');

    const totalCost = result.data.cost?.totalCost ?? 0;
    return {
      success: true,
      data: {
        text: result.data.text,
        transcriptPath,
        durationMinutes: result.data.durationMinutes ?? 0,
        cost: { totalCost, breakdown: { transcription: totalCost } },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during transcription';
    console.error(`[Workflow] transcribeVideo failed: ${message}`);
    return errorResult('STT_TRANSCRIPTION_ERROR', message);
  } finally {
    if (tempWav && fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
  }
}

// =============================================================================
// WORKFLOW: extractClip  (cut a segment, optionally crop for Shorts/Reels)
// =============================================================================

export interface ExtractClipInput {
  videoPath: string;
  outputPath: string;
  /** Seconds, "MM:SS", or "HH:MM:SS" */
  start: number | string;
  /** Clip length in seconds (or pass `end`) */
  duration?: number;
  /** Absolute end time (alternative to duration) */
  end?: number | string;
  /** Center-crop to a target ratio (e.g. "9:16" for Shorts/Reels). Omit to keep original. */
  cropTo?: '9:16' | '1:1' | '4:5' | '16:9';
}

export interface ExtractClipOutput {
  clipPath: string;
  start: number;
  duration: number;
  cost: CostInfo;
}

/**
 * Cut a segment from a longer video (re-encoded for frame-accurate cuts).
 * `cropTo: "9:16"` center-crops landscape footage into a vertical clip.
 * Local only (ffmpeg) — no API cost.
 */
export async function extractClip(
  input: ExtractClipInput
): Promise<WorkflowResult<ExtractClipOutput>> {
  if (!input.videoPath) return errorResult('INVALID_INPUT', 'videoPath is required');
  if (!input.outputPath) return errorResult('INVALID_INPUT', 'outputPath is required');
  if (input.start === undefined) return errorResult('INVALID_INPUT', 'start is required');
  if (input.duration === undefined && input.end === undefined) {
    return errorResult('INVALID_INPUT', 'Provide duration (seconds) or end');
  }
  if (!fs.existsSync(input.videoPath)) return errorResult('FILE_NOT_FOUND', `Video not found: ${input.videoPath}`);

  try {
    assertFfmpegInstalled();
    const start = parseTimeToSeconds(input.start);
    const duration = input.duration ?? parseTimeToSeconds(input.end!) - start;
    if (duration <= 0) return errorResult('INVALID_INPUT', `Clip duration must be positive (got ${duration}s)`);
    ensureDir(path.dirname(input.outputPath));

    let vf = '';
    if (input.cropTo) {
      const [rw, rh] = input.cropTo.split(':').map(Number);
      // Center-crop to the target ratio, whichever dimension needs trimming.
      vf = ` -vf "crop='min(iw,ih*${rw}/${rh})':'min(ih,iw*${rh}/${rw})'"`;
    }

    runFfmpegCmd(
      `ffmpeg -y -ss ${start} -i "${input.videoPath}" -t ${duration}${vf} `
      + `-c:v libx264 -preset medium -crf 18 -c:a aac -movflags +faststart "${input.outputPath}"`
    );

    return {
      success: true,
      data: { clipPath: input.outputPath, start, duration, cost: { totalCost: 0, breakdown: {} } },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during clip extraction';
    console.error(`[Workflow] extractClip failed: ${message}`);
    return errorResult('FFMPEG_ERROR', message);
  }
}

// =============================================================================
// ASSEMBLE STORY FILM (multi-scene cinematic cut — local ffmpeg, no API cost)
// =============================================================================

export interface StoryFilmScene {
  /** Video clip for this scene (in story order). Native audio kept as ambience. */
  clipPath: string;
  /** Narration segment laid over this scene (optional per scene). */
  voPath?: string;
  /** Seconds into the scene before the narration starts. Default 0.5. */
  voOffsetSeconds?: number;
}

export interface AssembleStoryFilmInput {
  scenes: StoryFilmScene[];
  outputPath: string;            // .mp4
  /** Level of the clips' own (ambient) audio under the narration. Default 0.32. */
  ambientVolume?: number;
  /** Optional music bed across the whole film. */
  musicPath?: string;
  musicVolume?: number;          // default 0.15
  /** Logo faded in near the end (white backgrounds keyed out by default). */
  logoPath?: string;
  /** When the logo appears. Default: 3s before the end. */
  logoStartSeconds?: number;
  logoPosition?: 'top' | 'bottom';   // default 'top' — pick the brighter region
  keyWhiteLogo?: boolean;            // default true
}

export interface AssembleStoryFilmOutput {
  videoPath: string;
  durationSeconds: number;
  sceneStarts: number[];         // where each scene begins in the final cut
  cost: CostInfo;
}

function probeDuration(file: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`,
    { stdio: 'pipe' }
  ).toString().trim();
  const d = parseFloat(out);
  if (!Number.isFinite(d) || d <= 0) throw new Error(`Could not read duration of ${file}`);
  return d;
}

function probeHasAudio(file: string): boolean {
  const out = execSync(
    `ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${file}"`,
    { stdio: 'pipe' }
  ).toString().trim();
  return out.length > 0;
}

/**
 * Cut a multi-scene story film in one call: concatenates the scene clips
 * (keeping their native ambience, ducked), lays each scene's narration at the
 * right time, optionally adds a music bed and an end-card logo. This is the
 * assembly step of the cinematic-story-film recipe — no hand-written ffmpeg.
 */
export async function assembleStoryFilm(
  input: AssembleStoryFilmInput
): Promise<WorkflowResult<AssembleStoryFilmOutput>> {
  if (!input.scenes?.length) return errorResult('INVALID_INPUT', 'scenes[] is required');
  if (!input.outputPath) return errorResult('INVALID_INPUT', 'outputPath is required (.mp4)');
  for (const [i, s] of input.scenes.entries()) {
    if (!s.clipPath) return errorResult('INVALID_INPUT', `scenes[${i}].clipPath is required`);
    if (!fs.existsSync(s.clipPath)) return errorResult('FILE_NOT_FOUND', `Clip not found: ${s.clipPath}`);
    if (s.voPath && !fs.existsSync(s.voPath)) return errorResult('FILE_NOT_FOUND', `VO not found: ${s.voPath}`);
  }
  if (input.musicPath && !fs.existsSync(input.musicPath)) {
    return errorResult('FILE_NOT_FOUND', `Music not found: ${input.musicPath}`);
  }
  if (input.logoPath && !fs.existsSync(input.logoPath)) {
    return errorResult('FILE_NOT_FOUND', `Logo not found: ${input.logoPath}`);
  }

  try {
    assertFfmpegInstalled();
    ensureDir(path.dirname(path.resolve(input.outputPath)));

    // Scene timing from real clip durations.
    const durations = input.scenes.map((s) => probeDuration(s.clipPath));
    const sceneStarts: number[] = [];
    let total = 0;
    for (const d of durations) { sceneStarts.push(total); total += d; }

    const ambientVolume = input.ambientVolume ?? 0.32;
    const musicVolume = input.musicVolume ?? 0.15;
    const logoStart = input.logoStartSeconds ?? Math.max(0, total - 3);

    // Inputs: scene clips, then VO files, then music, then logo.
    const args: string[] = ['-y', '-loglevel', 'error'];
    input.scenes.forEach((s) => args.push('-i', s.clipPath));
    const voInput: (number | null)[] = [];
    let nextIdx = input.scenes.length;
    for (const s of input.scenes) {
      if (s.voPath) { args.push('-i', s.voPath); voInput.push(nextIdx++); }
      else voInput.push(null);
    }
    let musicIdx: number | null = null;
    if (input.musicPath) { args.push('-i', input.musicPath); musicIdx = nextIdx++; }
    let logoIdx: number | null = null;
    if (input.logoPath) {
      args.push('-loop', '1', '-t', String(Math.ceil(total)), '-i', input.logoPath);
      logoIdx = nextIdx++;
    }

    // Filtergraph.
    const f: string[] = [];
    const concatIn = input.scenes.map((s, i) => {
      if (probeHasAudio(s.clipPath)) return `[${i}:v][${i}:a]`;
      f.push(`anullsrc=r=48000:cl=stereo:d=${durations[i]}[sil${i}]`);
      return `[${i}:v][sil${i}]`;
    }).join('');
    f.push(`${concatIn}concat=n=${input.scenes.length}:v=1:a=1[vcat][acat]`);
    f.push(`[acat]volume=${ambientVolume}[amb]`);

    const mixIns = ['[amb]'];
    input.scenes.forEach((s, i) => {
      const idx = voInput[i];
      if (idx === null) return;
      const ms = Math.round((sceneStarts[i] + (s.voOffsetSeconds ?? 0.5)) * 1000);
      f.push(`[${idx}:a]adelay=${ms}|${ms}[vo${i}]`);
      mixIns.push(`[vo${i}]`);
    });
    if (musicIdx !== null) {
      f.push(`[${musicIdx}:a]volume=${musicVolume}[mus]`);
      mixIns.push('[mus]');
    }
    f.push(`${mixIns.join('')}amix=inputs=${mixIns.length}:duration=first:normalize=0[aout]`);

    let vOut = '[vcat]';
    if (logoIdx !== null) {
      const key = input.keyWhiteLogo === false ? '' : ',colorkey=white:0.15:0.08';
      const y = input.logoPosition === 'bottom' ? 'H*0.82' : 'H*0.05';
      f.push(`[${logoIdx}:v]scale=320:-1,format=rgba${key},fade=in:st=${logoStart}:d=1:alpha=1[lg]`);
      f.push(`[vcat][lg]overlay=(W-w)/2:${y}[vlogo]`);
      vOut = '[vlogo]';
    }

    const cmd = `ffmpeg ${args.map((a) => (a.startsWith('-') || /^[\d.]+$/.test(a) ? a : `"${a}"`)).join(' ')} `
      + `-filter_complex "${f.join(';')}" -map "${vOut}" -map "[aout]" `
      + `-c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "${input.outputPath}"`;
    console.error(`[Workflow] Assembling story film (${input.scenes.length} scenes, ${total.toFixed(1)}s)...`);
    runFfmpegCmd(cmd);

    if (!fs.existsSync(input.outputPath)) {
      return errorResult('FFMPEG_ERROR', 'Assembly completed but output file is missing');
    }
    console.error(`[Workflow] Film saved: ${input.outputPath}`);
    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        durationSeconds: Math.round(total * 100) / 100,
        sceneStarts,
        cost: { totalCost: 0, breakdown: {} },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during film assembly';
    console.error(`[Workflow] assembleStoryFilm failed: ${message}`);
    return errorResult('FFMPEG_ERROR', message);
  }
}
