---
name: analyze-video
description: Analyze a reference video (YouTube URL or local file) into a scene-by-scene breakdown — timecodes, shot types, camera moves, on-screen text, spoken lines — plus a recreation blueprint with per-scene video prompts and VO script. Use when the user says "analyze this video", "I want to create something like that", "recreate this video", "break down this YouTube video", or pastes a video link they want to emulate.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Analyze Reference Video → Recreate

Turn "I want to create something like that + a link" into a structured,
reproducible plan. Two halves:

1. **Analyze** — one CLI call produces `breakdown.json` (machine),
   `breakdown.md` (human, scene-by-scene like a shot list), and
   `recreation-plan.md` (per-scene video prompts + VO script).
2. **Recreate** — the blueprint feeds the NORMAL production flow
   (preflight → asset registry → pipeline → generate). This skill never
   auto-generates the remake.

---

## CRITICAL: CALL THE WORKFLOW CLI — DO NOT WRITE A SCRIPT

```bash
node workflows/cli.cjs analyzeReferenceVideo '<json-args>'
```

---

## STEP 1: Resolve the source

| User gives | Pass |
|---|---|
| YouTube URL | `youtubeUrl` — Gemini fetches it directly, no download |
| Local file (mp4/webm/mov) | `videoPath` — ≤19 MB goes inline; larger files auto-upload via the Gemini Files API (48h storage, free) |

Ask if unclear:
- **What do they want out of it?** Structure only? Style? Full remake with
  their product? → pass as `notes` (it tailors the recreation blueprint).
- **Non-English speech?** → pass `language` (e.g. `"Burmese"`) for accurate
  verbatim dialogue capture.

## STEP 2: Estimate cost and confirm

Analysis is a Gemini 3.5 Flash multimodal text call — video input is
tokenized at roughly **300 tokens/second of video** (~$0.03/min of video,
plus output). A 7-minute video ≈ $0.15–0.25. State the estimate; for videos
over ~20 minutes, warn and confirm before running.

## STEP 3: Run the analysis

```bash
node workflows/cli.cjs analyzeReferenceVideo '{
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "outputDir": "projects/{name}/output-contents/{date}/{content-id}",
  "notes": "Recreate for my coffee brand, 30s vertical for Reels",
  "language": "Burmese"
}'
```

(Or `"videoPath": "path/to/video.mp4"` instead of `youtubeUrl`.)

Output lands in `outputDir`:

| File | What it is |
|---|---|
| `breakdown.json` | Full `ReferenceVideoBreakdown` — metadata, style, pacing, audio profile, `scenes[]`, `recreation{}` |
| `breakdown.md` | Human shot list: `Scene N · 0:00–0:03 — Opening hook`, shot type, camera move, visual, on-screen text, spoken line |
| `recreation-plan.md` | Per-scene ready-to-adapt video prompts + VO lines + suggested CLI command + music brief |

**SHOW the user the breakdown summary** (scene count, duration, style summary)
and where the files are. Log the call in the manifest + prompts.txt as usual.

## STEP 4: Recreate (only if the user wants to proceed)

The blueprint's prompts keep subjects GENERIC on purpose. To produce the remake:

```
□ 1. Run content-preflight — resolve project, brand, characters, products
□ 2. Swap generic subjects in recreation-plan.md prompts for the user's
     registered assets (use asset ids / reference images — never re-describe)
□ 3. Adapt format: reference may be 16:9/6min — user probably wants 9:16/30s.
     Compress scenes; keep the reference's STRUCTURE (hook → beats → CTA)
□ 4. Review prompts (reviewVideoPrompt / reviewScript) — pennies vs. dollars
□ 5. Author {content-id}.pipeline.json from the blueprint scenes (RULES 7)
     and execute with runPipeline
□ 6. Propose camera moves from the preset library per scene — don't improvise
```

**Respect RULES.md throughout**: budget consent before generating, preset
libraries for camera moves/art styles, never fake testimonials heard in the
reference video — the user's own social proof only.

## Edge cases

- **Private/age-gated/region-locked YouTube video** → Gemini can't fetch it;
  ask the user for a local file instead.
- **Copyrighted content**: analyzing structure/style is fine; warn the user
  the remake must not clone copyrighted footage, music, or a real person's
  likeness (RULES: real people need consent).
- **JSON parse failure** (rare): the raw model output is saved to
  `breakdown-raw.txt` — just retry the command once.
- **Very long videos**: scene lists get huge; suggest analyzing the most
  relevant segment (extractClip on a local copy) or accept a coarser breakdown.
