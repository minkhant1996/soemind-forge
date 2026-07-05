---
name: preview-pick
description: Generate cheap options first, let the user pick, then commit budget to the chosen one. Use before expensive image/video generation, when the user wants choices ("give me a few thumbnails"), or to approve a video visually before paying for clips. Keywords - options, variations, preview, storyboard, pick, choose, draft.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Preview → Pick → Commit

Don't fire-and-pay. **Iterate cheaply, commit expensively.** Generate low-cost options or a
storyboard, show them, let the user choose, then spend on the full-quality render.

Call each workflow through the CLI: `node workflows/cli.cjs <command> '<json-args>'`
(`node workflows/cli.cjs list` shows all commands).

Cost reality (per image): 512px ≈ $0.045 · 1K ≈ $0.067 · 2K ≈ $0.101 · 4K ≈ $0.15.
Cheaper still: `"imageModel":"lite"` (Nano Banana 2 Lite) ≈ $0.0336 flat at any size —
the default choice for preview/option rounds; re-render the winner with flash or pro.
A video clip ≈ $0.40/s. So previewing first is real money saved, not just nicer UX.

---

## Pattern A: Image options (thumbnails, hero, graphics)

```bash
# 1. Cheap preview batch (512px by default)
node workflows/cli.cjs generateImageOptions '{"prompt":"Bold thumbnail: shocked student looking at phone, neon accents, no text","count":4,"outputDir":"projects/{name}/output-contents/options","aspectRatio":"9:16"}'
# → result.data.imagePaths → SHOW all to the user as a numbered contact sheet
```

**Show the options, ask the user to pick a number.** Then commit only the chosen one:

```bash
# 2. Commit the pick at full resolution (uses it as reference to preserve the look)
# chosenImagePath is the picked option from result.data.imagePaths (e.g. index 2)
node workflows/cli.cjs finalizeImage '{"chosenImagePath":"projects/{name}/output-contents/options/option-3.png","prompt":"Bold thumbnail: shocked student… (same as above)","outputPath":"projects/{name}/output-contents/thumbnail.png","imageSize":"2K"}'
# → result.data.finalPath, result.data.cost
```

Total: 4×$0.045 preview + 1×$0.101 final ≈ **$0.28**, vs $0.60 to blindly make 4 at 4K.

---

## Pattern B: Storyboard before video (approve, THEN pay for clips)

The biggest saver. Generate one keyframe per scene (~$0.067 each) and get sign-off before
spending ~$0.40/s on clips.

```bash
# referenceImagePath keeps the character consistent across scenes
node workflows/cli.cjs generateStoryboard '{"scenes":[{"name":"struggle","prompt":"Student overwhelmed at messy desk, late night"},{"name":"discovery","prompt":"Same student opens the app, hopeful"},{"name":"result","prompt":"Student relaxed, clean schedule on screen"}],"outputDir":"projects/{name}/output-contents/storyboard","aspectRatio":"9:16","referenceImagePath":"projects/{name}/assets/characters/char-main-front.png"}'
# → result.data.keyframes → SHOW the whole storyboard to the user
```

**Stop and review.** Ask: same character throughout? right emotion/flow? Regenerate any
weak scene. Only after approval, generate the clips with the video skill, passing each
approved keyframe as the `referenceImagePath` (`generateVideoFromImage` /
`generateSpeakingVideoFromImage`).

```
3 keyframes (~$0.20) approved → then ~$7 of clips, with no surprises.
```

---

## Pattern C: Pick → refine loop ("like #2, but warmer")

Picking is rarely the end — users want to tweak the winner. Don't regenerate from
scratch (you'll lose what they liked); **vary the pick**:

```bash
# Refine the chosen option, keeping its composition (still cheap at 512-1K)
node workflows/cli.cjs generateImageVariation '{"referenceImagePath":"…/options/option-2.png","prompt":"Same composition and subject, but warmer golden-hour lighting and a softer smile","outputPath":"…/options/option-2b.png","imageSize":"512"}'
```

Loop: show → adjust one thing per round (lighting, expression, background, crop) →
regenerate the variation. When the user says it's right, `finalizeImage` that file at
full resolution. Two or three refine rounds still cost less than one blind 4K miss.

> Keep every round's files — users often walk back ("actually 2b was better").
> Number them `option-2b`, `option-2c`, … so picks stay unambiguous.

---

## Pattern D: A/B variants (marketing tests, not indecision)

When the user wants to **test** content (not just choose), deliver true variants:

1. Vary ONE deliberate dimension per variant — hook, thumbnail emotion, CTA,
   opening scene — and say which. Same everything else, so the test is clean.
   (For copy: `generateHooks` already returns multiple angles; pick 2 distinct ones.)
2. Produce **both** finals (A and B) and package both:
   `…/publish/variant-a/instagram/`, `…/publish/variant-b/instagram/`.
3. Record what differs in each variant's `post.json` via the caption/notes and tell
   the user what to measure (CTR for thumbnails/hooks, watch-through for opening scenes).

Cost doubles on the final render only — previews already existed from Pattern A.

---

## Pipeline-first + audit trail (mandatory)

- Author `<content-id>.pipeline.json` IN the content folder BEFORE any paid round
  (nodes = CLI commands, `{{node.data.field}}` refs — e.g. options → finalize wired
  together), then `node workflows/cli.cjs runPipeline @<file>`.
  See `workflows/pipelines/README.md`.
- Keep a `prompts.txt` in the content folder: the option-round prompt, each refine
  round's prompt, and the finalize prompt — every round gets a one-line RESULT note.
- Log every paid round via `createGenerationManifest` / `addManifestEntry`
  (AGENT-GUIDE Step 5), including the option rounds — cheap still counts.

---

## When to use

- "Give me a few options / variations" → Pattern A
- Any **expensive** image (hero, 4K, ad creative) → Pattern A (preview at 512 first)
- Any multi-clip / character video → Pattern B (storyboard before clips), then the video skill
- "Close, but change X" after a pick → Pattern C (vary the pick, don't restart)
- "Which hook/thumbnail works better?" → Pattern D (clean A/B, package both)
- One-off cheap asset where the user trusts a single gen → skip; generate directly

Always state the cost of the cheap step and the commit step so the user chooses with eyes open.
