---
name: repurpose-content
description: Turn one long video (or podcast/audio) into many pieces — vertical Shorts/Reels clips, quote images, captions, and a thread. Use when the user says "repurpose this video", "turn my podcast into clips", "make shorts from this", "slice this up for social".
allowed-tools: Bash Read Write Edit Glob Grep
---

# Repurpose Content

One long asset → a week of content. Pipeline: transcribe → find the moments →
cut clips → derive posts → package per platform.

Commands used (argument shapes in `workflows/WORKFLOWS.md` § *Publish & Repurpose*):
`transcribeAudio` (Gemini — default) or `transcribeVideo` (OpenRouter) ·
`extractClip` · `packageContent` (both local/free) · `generateSingleImage` ·
`generateCaption`.

## STEP 1: Intake

1. Confirm the source file exists; note duration:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 "<file>"
   ```
2. Ask (one batch): which platforms? how many clips (default 3-5)? quote
   images / caption thread wanted too?
3. Run `/content-preflight` if a project exists (brand tone for captions);
   minimal mode is fine for a quick job.

## STEP 2: Transcribe

**Default — Gemini** (no second key, and it returns per-phrase timestamps, which
makes STEP 3 exact instead of estimated). Extract the audio first if the source
is video: `ffmpeg -y -i "<file>" -vn -ac 1 -ar 16000 "<file>.wav"`.

```bash
node workflows/cli.cjs transcribeAudio '{"audioPath":"<file>.wav","outputPath":"projects/{name}/output-contents/{piece}/transcript.txt"}'
```

**Alternative — OpenRouter** (only if the user prefers it; needs
OPENROUTER_API_KEY and an explicit `model`, since OpenRouter has no Whisper
endpoint — transcription runs on audio-capable chat models):

```bash
node workflows/cli.cjs transcribeVideo '{"mediaPath":"<file>","model":"openai/gpt-audio-mini","outputPath":"…/transcript.txt"}'
```

- Neither key available → ask the user to paste a transcript/subtitles file
  instead. Don't guess the content.
- State the cost before running on long files (>30 min). For the OpenRouter
  path, take the per-token rates from
  `listOpenRouterModels '["audio"]'` (gpt-audio-mini bills audio input per
  million tokens) rather than quoting a remembered per-minute rate — the
  duration drives the token count, so long recordings add up.

## STEP 3: Find the moments

Read the transcript and select clip candidates — **you** do this, no API call
needed. Look for: strong hooks/claims, complete self-contained thoughts
(15-60s), emotional peaks, concrete tips, quotable one-liners.

> `transcribeAudio` (Gemini) gives one `[m:ss.d - m:ss.d]` line per phrase —
> take clip start/end straight from those cues. Only if you transcribed the
> OpenRouter way (plain text, no timestamps) estimate the position from word
> offset (spoken English ≈ 150 words/min). Either way cut generously (start
> ~5s early) — you'll verify in the next step.

Present candidates and let the user pick:

```
Found 6 clip candidates:
  1. ~02:10  "The roast date matters more than the price tag" (hook, ~25s)
  2. ~08:45  The 3-signs-of-stale-beans tip (self-contained, ~40s)
  ...
Which ones? (numbers / all / adjust)
```

## STEP 4: Cut and verify each clip

```bash
node workflows/cli.cjs extractClip '{"videoPath":"<file>","outputPath":".../clips/clip-01.mp4","start":"02:05","duration":35,"cropTo":"9:16"}'
```

- `cropTo: "9:16"` center-crops for Shorts/Reels — warn if the speaker may be
  off-center; omit `cropTo` to pad instead at packaging time.
- Timestamps are estimates: after each cut, transcribe the CLIP (cheap — it's
  short) or ask the user to check it, and adjust `start`/`duration` if the cut
  clips a sentence. Iterate until clean.

## STEP 5: Derive the other formats (as requested)

- **Quote images**: pull the strongest lines → `/generate-image` with brand
  style (or a clean typographic card), 4:5.
- **Captions per clip**: `generateCaption` (or `/write-copy`) from the clip's
  transcript segment — hook first line, platform hashtags.
- **Thread/text post**: distill the transcript's core argument into a
  numbered thread (twitter/linkedin), respecting char limits.

## STEP 6: Package everything

For each clip/image: `/package-content` into
`output-contents/{piece}/publish/{clip-id}/`. Then report:

```
✅ REPURPOSED — podcast-ep12 (42 min source)
  3 clips (9:16)  → publish/clip-01..03/  (tiktok, youtube, instagram)
  2 quote images  → publish/quote-01..02/ (instagram, linkedin)
  1 thread        → publish/thread.txt    (twitter)
  Spend: $0.31 (transcription $0.25, images $0.06 — clips/packaging free)
```

`recordCost` any paid steps against the project budget.

## Pipeline-first + audit trail (mandatory)

- Author `<content-id>.pipeline.json` IN the content folder BEFORE running the
  chain (nodes = CLI commands — transcribe → extract → package —
  `{{node.data.field}}` refs wire outputs to inputs), then
  `node workflows/cli.cjs runPipeline @<file>`. See `workflows/pipelines/README.md`.
- The content folder gets a `prompts.txt`: quote-image prompts and caption/thread
  copy; update it on every retry with a one-line RESULT note.
- Log each paid generation via `createGenerationManifest` / `addManifestEntry`
  (AGENT-GUIDE Step 5).
