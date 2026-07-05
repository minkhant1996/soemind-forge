---
name: revise-content
description: Change ONE piece of an already-generated content item without paying to regenerate everything — one scene of a video, the voiceover, the music bed, one carousel slide, a caption. Use when the user says "redo scene 2", "change the voiceover", "swap the music", "fix slide 3", "same video but different ending".
allowed-tools: Bash Read Write Edit Glob Grep
---

# Revise Content (edit one piece, not the whole thing)

A finished video is scenes + voiceover + music + captions, each generated
separately and assembled locally. So a revision should cost **one piece**, not
the whole render. The generation manifest makes this possible — it recorded
every piece's exact prompt, model, and parameters.

Reference: [`workflows/MANIFEST-GUIDE.md`](../../workflows/MANIFEST-GUIDE.md).

## STEP 1: Find what was generated

```bash
node workflows/cli.cjs loadManifest '["projects/{name}/output-contents/{piece}/manifest.json"]'
```

Show the user the entries so they can point at the piece:

```
This item has 6 recorded generations:
  1. video   scene-1 "Student overwhelmed at desk…"      $3.20
  2. video   scene-2 "Opens the app, hopeful…"           $3.20
  3. video   scene-3 "Relaxed, clean schedule…"          $3.20
  4. voiceover (Kore) "Struggling to keep up?…"          $0.02
  5. music   "upbeat lo-fi bed"                          $0.04
  6. assembly (local, free)
Which one changes, and how?
```

No manifest? Reconstruct what you can from the output folder + ask the user
for the missing context — and **create a manifest for the revision** so the
next edit is cheap.

## STEP 2: Regenerate ONLY that piece

Take the entry's recorded `prompt`, `model`, `parameters`, and
`referenceImagePath`, apply the user's requested change, and re-run the same
workflow command. Everything not mentioned by the user stays IDENTICAL —
same character refs, same aspect ratio, same duration — so the new piece
drops into place.

| Change | Regenerate with | Typical cost |
|--------|-----------------|--------------|
| One scene of a video | same video command, edited prompt, same keyframe/refs | ~$0.40/s for that scene only |
| Voiceover (words or voice) | `generateVoiceover` with edited script / new voice id | ~$0.01 |
| Music bed | `generateMusicTrack` with edited style | ~$0.04 |
| One carousel slide | `generateSingleImage` with the slide's prompt + style refs | ~$0.07 |
| Caption / copy only | `generateCaption` — free-ish, no media touched | ~$0.001 |
| End card / thumbnail | `generateSingleImage` / `finalizeImage` | ~$0.07–0.10 |

Before spending: state the piece's cost vs. what a full regeneration would
have cost, and `checkBudget`. For visual pieces, preview cheap first if the
change is subjective (`/preview-pick` Pattern C).

Pipeline-first applies to revisions too: author the revision as a small
`<content-id>-rev.pipeline.json` in the content folder (nodes = CLI commands,
`{{node.data.field}}` refs) and run it with
`node workflows/cli.cjs runPipeline @<file>` — see `workflows/pipelines/README.md`.

## STEP 3: Re-assemble locally (free)

Assembly is ffmpeg, not AI — redoing it costs nothing:

- Replaced a scene → re-run the concat/assembly used originally
  (`assembleFinal` / the recorded assembly step) with the new clip in place.
- Replaced voiceover or music → `mixVideoAudio` again on the existing video.
- Words changed → regenerate captions (`generateCaptions`) so subtitles match.
- Then re-package (`/package-content`) so the publish folders hold the new cut.

Keep the old files as `*-v1.*` instead of overwriting — users change their
minds back.

## STEP 4: Record it

`addManifestEntry` for the regenerated piece (status the old one as
superseded in `notes`), `recordCost` the actual spend, and **append the
revision prompt to the folder's existing `prompts.txt`** with a one-line
RESULT note (every retry too). Then report:

```
✅ Revised scene-2 only: $3.20 (full regen would have been $9.60+)
   New cut: output-contents/{piece}/final-v2.mp4  (v1 kept)
   Publish folders updated.
```
