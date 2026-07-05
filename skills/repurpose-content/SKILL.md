---
name: repurpose-content
description: Turn one long video (or podcast/audio) into many pieces — vertical Shorts/Reels clips, quote images, captions, and a thread. Use when the user says "repurpose this video", "turn my podcast into clips", "make shorts from this", "slice this up for social".
allowed-tools: Bash Read Write Edit Glob Grep
---

# Repurpose Content

One long asset → a week of content. Pipeline: transcribe → find the moments →
cut clips → derive posts → package per platform.

Commands used (argument shapes in `workflows/WORKFLOWS.md` § *Publish & Repurpose*):
`transcribeVideo` (needs OPENROUTER_API_KEY) · `extractClip` · `packageContent`
(both local/free) · `generateSingleImage` · `generateCaption`.

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

```bash
node workflows/cli.cjs transcribeVideo '{"mediaPath":"<file>","outputPath":"projects/{name}/output-contents/{piece}/transcript.txt"}'
```

- No OPENROUTER_API_KEY → tell the user transcription needs one
  (https://openrouter.ai/keys), or ask them to paste a transcript/subtitles
  file instead. Don't guess the content.
- Cost is roughly $0.006/minute — state it for long files (>30 min) before running.

## STEP 3: Find the moments

Read the transcript and select clip candidates — **you** do this, no API call
needed. Look for: strong hooks/claims, complete self-contained thoughts
(15-60s), emotional peaks, concrete tips, quotable one-liners.

> The transcript has no timestamps. Estimate each moment's position from its
> word offset (spoken English ≈ 150 words/min), then cut generously (start
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
