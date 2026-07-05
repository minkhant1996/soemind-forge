---
name: generate-video
description: Generate video content using Gemini Veo. Use when user asks to create video, TikTok ad, Instagram Reel, YouTube video, product video, explainer.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Generate Video

## ⚠️ STOP: COMPLETE THIS CHECKLIST BEFORE WRITING ANY CODE

**You MUST complete ALL steps below and SHOW output to user before generating.**

```
□ Step 0: RUN content-preflight (classify topic/visual mode, resolve required assets)
□ Step 1: ASK user "Does this video include a person/character?"
□ Step 2: Look up the character/product in the asset registry (resolveAsset) — SHOW result
□ Step 3: If a locked character asset exists → TELL user you will reuse its ref files
□ Step 4: READ project.md and brand.md templates
□ Step 5: ASK user to confirm workflow selection
□ Step 6: THEN generate using workflow function
```

**DO NOT skip to code. DO NOT assume. SHOW each step.**

---

## CRITICAL: CALL THE WORKFLOW CLI — DO NOT WRITE A SCRIPT

**DO NOT write raw API calls. DO NOT author a `.cjs`/`.ts` file that imports these
functions. RUN the workflow as a CLI command:**

```bash
node workflows/cli.cjs <command> '<json-args>'      # or @args.json for long prompts
```

Video commands (run `node workflows/cli.cjs list` for all):

| Command | Use for |
|---|---|
| `generateSilentVideo` | B-roll / product video, no voice |
| `generateSpeakingVideo` | On-camera character speaking |
| `generateVideoFromImage` | Animate an approved keyframe |
| `generateSpeakingVideoFromImage` | Character image → speaking clip |
| `generateVideoWithVoiceover` | Video + generated voiceover |
| `generateVideoFromImageWithVoiceover` | Keyframe → video + voiceover |

Example:

```bash
node workflows/cli.cjs generateSilentVideo \
  '{"prompt":"...","outputPath":"projects/{name}/output-contents/clip01.mp4","duration":8,"aspectRatio":"9:16","quality":"fast"}'
```

**For each command's argument shape: Read `workflows/WORKFLOWS.md`.** The `import`
signatures there document the args — translate them into a `cli.cjs` call.

> **Storyboard before you pay for clips.** For any multi-scene/character video, generate a
> keyframe per scene with `generateStoryboard()` (~$0.067 each), get the user's approval,
> then generate clips from the approved keyframes. See the `preview-pick` skill. Need the
> script/hook first? Use the `write-copy` skill (`generateHooks` → `generateScript`).

---

## MANDATORY STEPS BEFORE GENERATING (DO NOT SKIP)

### Step 1: Ask About Person/Character (REQUIRED)

**ALWAYS ask the user:**
1. **Does this video include a person/character?**
   - Yes → Need character reference OR description
   - No → Product-only or B-roll video

2. **If yes, ask:**
   - Do you have a character reference image in assets?
   - Should the character speak or be silent?

### Step 2: Look Up Assets in the Registry (REQUIRED) - SHOW RESULTS TO USER

**Don't guess from filenames.** Read the project's asset registry — it records every
reusable character/product/voice with validated paths. (Pre-flight has usually populated
it already; see `skills/content-preflight/SKILL.md`.)

```bash
node workflows/cli.cjs loadAssetConfig '["{name}"]'
node workflows/cli.cjs resolveAsset '["{name}","char-main"]'   # the character id from the content plan
node workflows/cli.cjs resolveAsset '["{name}","prod-main"]'
# resolveAsset → { ok, existing[], missing[] }
```

**Then TELL the user what you found:**

```
Asset registry (projects/{name}/config/assets.yaml):
  ✓ character char-main  → 3 refs, locked  (will reuse for consistency)
  ✓ product   prod-main  → 2 refs
  ⚠ no voice linked to char-main

Reusing char-main's reference images — not regenerating the character.
```

- `char.ok === true` → pass `char.existing[...]` as the reference image(s). **Do not
  re-describe or regenerate** a locked character.
- `char.ok === false` (missing or no asset) → resolve it via pre-flight's
  provide/generate flow, then `registerAsset(...)` so it's saved for next time.
- **Priority:** character reference > product reference when the video has a person.

### Step 3: Read Project Templates (REQUIRED)

```bash
cat projects/{name}/templates/project.md
cat projects/{name}/templates/brand.md
```

### Step 4: Read Workflow Documentation (REQUIRED)

```bash
cat workflows/WORKFLOWS.md
```

---

## CHARACTER CONSISTENCY (CRITICAL)

**Problem:** Each video generation creates a NEW random character.

**Solution:** Use the SAME character reference image for ALL video clips.

### Workflow for Character Consistency (registry-driven):

1. **Resolve the character from the registry:**
   ```bash
   node workflows/cli.cjs loadAssetConfig '["{name}"]'
   node workflows/cli.cjs resolveAsset '["{name}","char-main"]'   # → { ok, existing[], missing[] }
   ```

2. **If `char.ok` → reuse the SAME ref file for every clip:**
   ```bash
   # reuse char.existing[0] from resolveAsset (the validated, on-disk path) as referenceImagePath
   node workflows/cli.cjs generateSpeakingVideoFromImage '{"referenceImagePath":"<char.existing[0]>","dialogue":"Dialogue for this clip"}'   # ...more args
   ```

3. **If not (no asset yet) → generate ONCE, then register it:**
   ```bash
   # Step 1: Generate the character keyframe one time
   node workflows/cli.cjs generateSingleImage '{"prompt":"Woman in her 30s, dark hair, professional attire, neutral expression","outputPath":"projects/{name}/assets/characters/char-main-front.png","aspectRatio":"9:16"}'

   # Step 2: Save it to the registry so EVERY future clip/piece reuses it
   node workflows/cli.cjs registerAsset '["{name}","characters",{"id":"char-main","label":"Main character","description":"Woman in her 30s, dark hair, professional attire","source":"generated","status":"ready","locked":true,"files":{"front":"assets/characters/char-main-front.png"}},{"date":"<today ISO>"}]'

   # Step 3: Use it as the reference for all videos
   node workflows/cli.cjs generateSpeakingVideoFromImage '{"referenceImagePath":"projects/{name}/assets/characters/char-main-front.png"}'   # ...more args
   ```

4. **For multi-clip videos / series:**
   - Generate (or provide) the character keyframe ONCE and `registerAsset(... locked:true)`
   - Resolve the SAME id for every clip — identical character across all clips
   - Add extra angles as more `files` entries under the same id when needed

---

## REQUIRED QUESTIONS

### Always ask these questions:

1. **Does this video include a person/character?**
   - Yes, speaking → `generateSpeakingVideo()` or `generateSpeakingVideoFromImage()`
   - Yes, silent → `generateVideoFromImage()` with character reference
   - No → `generateSilentVideo()` or `generateVideoFromImage()` with product

2. **Platform?** (TikTok, Instagram, YouTube)

3. **Duration?** (15s, 30s, 60s)

4. **Audio style? — ALWAYS ask, don't assume:**
   - Silent → `generateSilentVideo()` or `generateVideoFromImage()`
   - Character speaks (on-screen) → `generateSpeakingVideo()` / `generateSpeakingVideoFromImage()`
   - **Voiceover (off-screen narration, TTS)** → `generateVideoWithVoiceover()` /
     `generateVideoFromImageWithVoiceover()`
   - Music only → generate video silent + add a music bed

   **If voiceover is chosen, do NOT auto-pick the voice.** Run the voiceover
   suggest-and-confirm flow (`skills/generate-voiceover/SKILL.md` Steps 1c–3): propose
   voice / style / pace / accent / script / pronunciation / music-under-VO with reasoning,
   show the summary, and get the user's confirmation **before** generating. Reuse the
   project's locked voice (or the on-screen character's `linked_voice`) if one exists, but
   still confirm it.

5. **Reference images?** (check assets folder)

---

## WORKFLOW SELECTION

| User Wants | Has Person? | Has Reference? | Audio | Use Workflow |
|------------|-------------|---------------|-------|--------------|
| B-roll, ambient | No | No | Silent | `generateSilentVideo()` |
| Product video | No | **YES** | Silent | `generateVideoFromImage()` |
| UGC, testimonial | **YES** | No | Character speaks | `generateSpeakingVideo()` |
| Character video | **YES** | **YES** | Character speaks | `generateSpeakingVideoFromImage()` |
| Explainer | No | No | Voiceover (TTS) | `generateVideoWithVoiceover()` |
| Product explainer | No | **YES** | Voiceover (TTS) | `generateVideoFromImageWithVoiceover()` |

**RULE: If video has person AND character image exists → ALWAYS use character image as reference.**

---

## WORKFLOW EXAMPLES

### 1. Silent Video (B-roll, no person)
```bash
node workflows/cli.cjs generateSilentVideo '{"prompt":"Cinematic shot of smartwatch on wrist, golden hour","outputPath":"projects/my-project/output-contents/video.mp4","duration":6,"aspectRatio":"9:16","quality":"fast"}'
```

### 2. Product Video from Reference (no person)
```bash
node workflows/cli.cjs generateVideoFromImage '{"referenceImagePath":"projects/my-project/assets/product-watch.png","prompt":"Product rotates slowly, premium lighting","outputPath":"projects/my-project/output-contents/product.mp4","duration":6,"aspectRatio":"9:16"}'
```

### 3. Speaking Video with Character Reference (RECOMMENDED for consistency)
```bash
# Use character image from assets for consistency
node workflows/cli.cjs generateSpeakingVideoFromImage '{"referenceImagePath":"projects/my-project/assets/characters/char-main-front.png","environment":"Modern office, soft lighting","dialogue":"This watch literally saved my life.","voiceDescription":"warm female voice, early 30s","outputPath":"projects/my-project/output-contents/testimonial.mp4","duration":8,"aspectRatio":"9:16"}'
```

### 4. Speaking Video without Reference (random character)
```bash
# Only use when NO character image exists
node workflows/cli.cjs generateSpeakingVideo '{"characterDescription":"Woman in her 30s, dark hair, professional","environment":"Modern office, soft lighting","dialogue":"This watch literally saved my life.","voiceDescription":"warm female voice, early 30s","outputPath":"projects/my-project/output-contents/testimonial.mp4","duration":8,"aspectRatio":"9:16"}'
```

### 5. Multi-Clip Video with Consistent Character
```bash
# Step 1: Resolve the locked character once from the registry — use .existing[0] as the reference below
node workflows/cli.cjs loadAssetConfig '["my-project"]'
node workflows/cli.cjs resolveAsset '["my-project","char-main"]'

# Step 2: Generate all clips with the SAME reference (char-main .existing[0])
node workflows/cli.cjs generateSpeakingVideoFromImage '{"referenceImagePath":"<char-main existing[0]>","dialogue":"First dialogue...","outputPath":"projects/my-project/output-contents/clip-01.mp4","duration":5}'
node workflows/cli.cjs generateSpeakingVideoFromImage '{"referenceImagePath":"<char-main existing[0]>","dialogue":"Second dialogue...","outputPath":"projects/my-project/output-contents/clip-02.mp4","duration":5}'   # SAME reference
node workflows/cli.cjs generateSpeakingVideoFromImage '{"referenceImagePath":"<char-main existing[0]>","dialogue":"Third dialogue...","outputPath":"projects/my-project/output-contents/clip-03.mp4","duration":5}'   # SAME reference
```

---

## REFERENCE IMAGE PRIORITY

**When multiple assets exist, prioritize:**

1. **Character image** (if video has person) → Use for character consistency
2. **Product image** (if product-focused) → Use for product consistency
3. **Environment image** (for scene setting) → Describe in prompt instead

**NOTE:** API supports ONE reference image per request. If you need both character AND product:
1. Use character reference for video generation
2. Describe product in the prompt
3. Or generate separate product shots

---

## CRITICAL: NO TEXT IN PROMPTS

❌ **NEVER include:**
- "Text appears..."
- "Caption reads..."
- "Title overlay..."

✅ **Only describe visuals:**
- Camera movement
- Subject action
- Environment
- Lighting

Text is added via FFmpeg post-production.

---

## COST REFERENCE

| Quality | Cost/sec |
|---------|----------|
| lite | $0.03 |
| fast | $0.08 |
| standard | $0.20 |

Example: 20s video at 'fast' = $1.60

**Check the budget cap BEFORE generating** (the CLI hard-stops at `BUDGET_EXCEEDED`):

```bash
node workflows/cli.cjs checkBudget '["{name}", 1.60]'   # project name + estimated cost
```

---

## PIPELINE-FIRST + AUDIT TRAIL (MANDATORY)

- **Author the pipeline before generating** — even for one clip: save
  `<content-id>.pipeline.json` IN the content folder (nodes = CLI commands,
  `{{node.data.field}}` refs wire outputs to inputs), then
  `node workflows/cli.cjs runPipeline @<file>`. See `workflows/pipelines/README.md`.
- **prompts.txt in every content folder** — video prompt(s), keyframe prompts, and
  script/VO text (with tags); update on EVERY retry with a one-line RESULT note.
- **Manifest** — log each generation via the `createGenerationManifest` /
  `addManifestEntry` CLI commands (AGENT-GUIDE Step 5).

---

## VOICE OPTIONS (for TTS)

**Professional:** Kore, Charon, Orus, Fenrir
**Friendly:** Zephyr, Puck, Aoede, Leda
**Energetic:** Calliope, Proteus
**Calm:** Autonoe, Despina, Aura

---

## FINISHING: captions + final assembly

After the clips/audio exist, assemble the deliverable with the assembly workflows
(local ffmpeg, no extra API cost). **Ask the user whether they want burned-in captions** —
short-form (TikTok/Reels/Shorts) usually should.

```bash
# 1. (optional) Captions from the voiceover/dialogue script
node workflows/cli.cjs generateCaptions '{"script":"<voiceover/dialogue script>","totalDuration":30,"outputPath":"projects/{name}/output-contents/captions.srt"}'

# 2. One call: concat clips → lay voiceover + music (music auto-ducks) → burn captions
node workflows/cli.cjs assembleFinal '{"clipPaths":["…/clip-01.mp4","…/clip-02.mp4"],"voiceoverPath":"…/voiceover.wav","musicPath":"…/music.wav","musicVolume":0.3,"captionsSrtPath":"…/captions.srt","outputPath":"projects/{name}/output-contents/final.mp4"}'
# voiceoverPath / musicPath / captionsSrtPath are optional; omit captionsSrtPath to skip burned-in captions; musicPath reuses the registry music bed
```

For audio-only mixing (single clip + VO/music, no concat/captions) use `mixVideoAudio()`.

---

## OUTPUT

Save to: `projects/{name}/output-contents/{date}/`
- `final.mp4` (assembled: clips + voiceover + music + optional captions)
- `video.mp4` or `final-with-voiceover.mp4`
- Individual clips: `clip-01.mp4`, `clip-02.mp4`, etc.
- `captions.srt` (if generated)

---

## PLATFORM SPECS

| Platform | Aspect | Duration |
|----------|--------|----------|
| TikTok | 9:16 | 15-60s |
| Instagram Reels | 9:16 | 15-90s |
| YouTube Shorts | 9:16 | 15-60s |
| YouTube | 16:9 | 60s+ |

## Kinetic-typography reels → renderKineticReel (Remotion, $0)

For word-driven reels (quotes, stats, hooks over brand backgrounds), skip Veo:
generate text-free backgrounds + voiceover, then one call renders staggered
animated typography (per-line size/color emphasis, gold #C8A24A for THE phrase):
`node workflows/cli.cjs renderKineticReel '{"scenes":[…],"audioPath":"vo.wav","outputPath":"reel.mp4"}'`
Args in WORKFLOWS.md § Remotion. Use Veo only when you need real motion/footage.

## Cinematic story film → follow the recipe

For "brand film" / "cinematic story with a character" requests, do NOT improvise:
read `workflows/recipes/cinematic-story-film.md` — storyline arc, character sheet →
keyframes → Veo 3.1 clips → adaptive per-scene VO (pacing trap documented) → one-call
`assembleStoryFilm`. ~$3.65 at fast tier for 4×8s.

## Model choice: Veo 3.1 vs Gemini Omni Flash (2026-07-05)

- **Veo 3.1** (`generateVideoFromImage` etc.): cinematic fidelity, 8s beats,
  animating locked NBP keyframes. $0.10/s fast tier.
- **Omni Flash** (`generateOmniVideoClip`): instruction-precision — live
  handwriting, text-in-scene, exact choreography. ~$1.03/10s. Pass
  `referenceImagePath` (NBP keyframe with your locked character) for
  image_to_video consistency. Timestamped prompts (`[00:00-00:02]…`,
  `He says,"…"`, `SFX:`, `(no subtitles)`) work on BOTH — see
  `workflows/VIDEO-PROMPT-GUIDE.md` § Pro syntax for the tested verdicts
  (set-text vs prop-text vs live-writing reliability).
