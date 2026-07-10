// Subject matte — cut out the foreground subject (rembg) so text can sit BEHIND it.
// Image → RGBA PNG cutout. Video → VP9/webm with alpha (yuva420p). Cached by source
// hash so re-renders are instant. Local, $0 (rembg + ffmpeg). Slow on video (~1s/frame).
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { execFileSync } from 'child_process';

type WFResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };
const ok = <T>(data: T): WFResult<T> => ({ success: true, data });
const fail = (code: string, message: string): WFResult<any> => ({ success: false, error: { code, message } });

const isVideo = (p: string) => /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(p);

export interface SubjectMatteInput {
  source: string;                 // image OR video whose foreground to cut out
  model?: string;                 // 'u2net' (default) | 'u2netp' (fast) | 'isnet-general-use'
  maxSeconds?: number;            // video cap, default 15
  fps?: number;                   // video sampling fps, default 25
  feather?: number;              // px blur on the alpha edge (video), default 0
  outputPath?: string;            // override cutout path
}
export interface SubjectMatteOutput {
  cutoutPath: string;
  kind: 'image' | 'video';
  cached: boolean;
  frames?: number;
}

function sourceHash(p: string, extra: string): string {
  const st = fs.statSync(p);
  return crypto.createHash('sha1')
    .update(`${path.resolve(p)}:${st.size}:${st.mtimeMs}:${extra}`)
    .digest('hex').slice(0, 12);
}

export async function subjectMatte(input: SubjectMatteInput): Promise<WFResult<SubjectMatteOutput>> {
  if (!input?.source) return fail('INVALID_INPUT', 'source is required');
  if (!fs.existsSync(input.source)) return fail('FILE_NOT_FOUND', `source not found: ${input.source}`);

  const model = input.model || 'u2net';
  const video = isVideo(input.source);
  const h = sourceHash(input.source, `${model}:${input.maxSeconds ?? 15}:${input.fps ?? 25}`);
  const cutoutPath = input.outputPath
    || path.join(path.dirname(input.source), `.matte-${h}.${video ? 'webm' : 'png'}`);

  if (fs.existsSync(cutoutPath)) {
    return ok({ cutoutPath, kind: video ? 'video' : 'image', cached: true });
  }

  try {
    if (!video) {
      console.error('[Workflow] Matting subject (rembg, image)...');
      execFileSync('rembg', ['i', '-m', model, input.source, cutoutPath], { stdio: 'pipe' });
      return ok({ cutoutPath, kind: 'image', cached: false });
    }

    // video: frames → rembg (folder) → VP9/webm with alpha
    const fps = input.fps ?? 25;
    const maxSec = input.maxSeconds ?? 15;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'matte-'));
    const framesDir = path.join(tmp, 'f');
    const cutDir = path.join(tmp, 'c');
    fs.mkdirSync(framesDir); fs.mkdirSync(cutDir);
    try {
      console.error(`[Workflow] Matting subject (rembg, video ≤${maxSec}s @ ${fps}fps — this is slow)...`);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-t', String(maxSec), '-i', input.source,
        '-vf', `fps=${fps}`, path.join(framesDir, '%05d.png')], { stdio: 'pipe' });
      execFileSync('rembg', ['p', '-m', model, framesDir, cutDir], { stdio: 'pipe' });
      const frames = fs.readdirSync(cutDir).filter((f) => f.endsWith('.png')).length;
      if (!frames) return fail('GENERATION_FAILED', 'rembg produced no frames');
      const vf = input.feather ? `-vf` : '';
      const args = ['-y', '-v', 'error', '-framerate', String(fps), '-i', path.join(cutDir, '%05d.png')];
      if (input.feather) args.push('-vf', `gblur=sigma=${input.feather}:steps=1`);
      args.push('-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '3M', '-auto-alt-ref', '0', cutoutPath);
      execFileSync('ffmpeg', args, { stdio: 'pipe' });
      return ok({ cutoutPath, kind: 'video', cached: false, frames });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  } catch (error: any) {
    const msg = error?.stderr?.toString?.() || (error instanceof Error ? error.message : 'Unknown error');
    console.error(`[Workflow] subjectMatte failed: ${msg}`);
    return fail('GENERATION_FAILED', msg);
  }
}
