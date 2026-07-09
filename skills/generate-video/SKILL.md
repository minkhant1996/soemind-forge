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
| `generateOmniVideoClip` | Omni Flash: stylized explainers, text-in-scene, multi-ref consistency, edit existing clips |

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

6. **If generating with Omni Flash — ART STYLE (REQUIRED, do not skip):**
   Present the preset list and ask the user to pick ONE:

   ```
   Omni Flash art style — which look?
     1. photorealistic (default — no preset)
     2. pixel-art            7. low-poly
     3. claymation           8. 3d-mix
     4. mixed-media          9. isometric-flat-vector
     5. 3d-papercraft       10. fluffy-toy
     6. whiteboard-doodle   11. 2d-illustration
     …or describe your own custom style
   ```

   Pass the chosen id as `"artStyle"` (omit for photorealistic). Record the
   choice in `projects/{name}/templates/brand.md` so the whole series stays
   in one style. Never silently pick a style for the user.

7. **Camera movement — PROPOSE from the preset library, then confirm:**
   Don't improvise camera language. Pick 1-2 preset ids from
   `VIDEO-PROMPT-GUIDE.md §2b` that fit the content intent, tell the user
   which you chose and why, and confirm. One move per clip.

   | Intent | Propose |
   |---|---|
   | Product hero / reveal | `slow-zoom-in`, `orbit-clockwise`, `dolly-in` |
   | Calm premium B-roll | `static`, `slider-right`, `slow-zoom-out` |
   | Hype / hook energy | `crash-zoom-in`, `whip-pan-right`, `chase` |
   | UGC / authentic | `handheld`, `first-person` |
   | Walking testimonial | `reverse-tracking`, `side-tracking` |
   | Location / scale reveal | `drone-pull-back`, `crane-up`, `earth-zoom-out` |
   | Scene transition | `whip-pan-*`, `pass-through`, `infinite-zoom` |

   Pass it as `"cameraMove":"<id>"` on `generateSilentVideo`,
   `generateVideoFromImage`, or `generateOmniVideoClip` — the full
   Movement/Speed/Framing/End block is prepended automatically. For
   scene-array workflows (voiceover scenes, speaking video, Seedance), paste
   the block text from the guide at the head of each scene prompt instead.

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
node workflows/cli.cjs generateVideoFromImage '{"referenceImagePath":"projects/my-project/assets/product-watch.png","prompt":"Product rotates slowly, premium lighting","outputPath":"projects/my-project/output-contents/product.mp4","duration":6,"aspectRatio":"9:16","cameraMove":"orbit-clockwise"}'
```
`cameraMove` (optional, also on `generateSilentVideo` / `generateOmniVideoClip`)
prepends a tested four-part camera block — 46 preset ids in
`workflows/VIDEO-PROMPT-GUIDE.md §2b` (see Required Question 7).

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

## REFERENCE IMAGES: first frame vs asset refs

Two different mechanisms on `generateVideoFromImage`:

- `referenceImagePath` — **first frame**: the clip starts from this exact image
  (animate an approved keyframe).
- `referenceImagePaths` — **asset references, max 3 (Veo 3.1)**: character
  sheet + environment sheet + prop in ONE request; they guide what things look
  like without appearing verbatim. State each ref's role in the prompt
  ("the girl from the character sheet", "the garden from the environment
  reference"). Need 4-5 refs → `generateOmniVideoClip` (`<IMG_REF_n>` tags).

**When picking refs for a scene, prioritize:** character sheet (if the scene
has a person) → prop/product sheet → environment sheet. Drop the environment
ref first if over the limit — environments survive prompt description better
than faces do.

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
# Optional between-clip transitions: add "transition":"dissolve" + "transitionDuration":0.5
# 58 viable presets (pick by intent): slide=slideleft/right/up/down · swipe=wipe*/smooth* ·
# cover*/reveal* · zoom=zoomin/squeezeh/squeezev · fades=fade/fadeblack/fadewhite/dissolve ·
# stylized=pixelize/distance/hblur/*wind · shapes=circleopen/radial/diagtl… Full table: VIDEO-PROMPT-GUIDE.md § Assembly transitions.
# NOT YET (guard rejects): glitch, roll, zoomout. Hard cuts when transition omitted.
# Each overlap shortens the total by its duration; every clip must outlast it.
```

For audio-only mixing (single clip + VO/music, no concat/captions) use `mixVideoAudio()`.

### Creative captions — pick the method by the video, don't default blindly

`assembleFinal`'s `captionsSrtPath` burns a plain SRT. For anything more expressive, run
**`renderCaptionedVideo`** on the finished video — and **decide the method from the video
type** (a talking-head, a hook reel, and a multi-scene travel piece want different
caption treatments):

- **DECISION TABLE + rules:** `workflows/TEXT-OVERLAY-DESIGN-GUIDE.md` § 0 (caption
  method selector). E.g. talking-head → bottom pill transcript + `**keyword**` accent;
  hook/sizzle → `style:"hero"` word punch-ins; multi-scene → upper location stamp +
  transcript; signature "wow" moment → text-behind-subject.
- **Cue fields** (`style` pill/hero · `pos` upper/mid/lower · `size` · `color` ·
  `**word**` accent · `\n` stacked lines): WORKFLOWS.md § renderCaptionedVideo. Timing
  from `transcribeAudio`, offset by each clip's start on the assembled timeline. **Only
  one cue is active at a time → stack layers (transcript + stamp) with separate passes.**
- **Text-behind-subject** (a big word behind the speaker, `rembg` per-frame matte):
  recipe in TEXT-OVERLAY-DESIGN-GUIDE.md § 6 — bake into each clip BEFORE assembly, then
  add the transcript pass. Needs the `rembg` lib — check/install first:
  `python3 -c "import rembg" || python3 -m pip install "rembg[cpu]" pillow` (first run
  auto-downloads a ~176 MB model to `~/.u2net/`).

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

**Before planning ANY hero title / kinetic reel / "text behind subject" /
meme-style overlay copy**, read `workflows/TEXT-OVERLAY-DESIGN-GUIDE.md` —
placement (behind/front/side), size-hierarchy patterns (hero+support,
hook→context→CTA, question→answer reveal), color/font pairing, and — 
important — its capability matrix of what's actually supported by
`renderKineticReel`/`renderSlideStill` today vs. what's roadmap-only. Don't
promise a per-word color/size effect or a rotated side badge as if it just
works; the guide names the current workaround or gap explicitly. Myanmar/
Burmese text in ANY of these must go through Remotion, never raw `ffmpeg
drawtext` — same guide, § 7.

## Story films → follow the recipe (do NOT improvise)

- **"Brand film" / single-character cinematic story** →
  `workflows/recipes/cinematic-story-film.md`: storyline arc, character sheet →
  keyframes → Veo 3.1 clips → adaptive per-scene VO → one-call
  `assembleStoryFilm`. ~$3.65 at fast tier for 4×8s.
- **"Short film" / multi-character story with consistent cast, locations, props**
  → `workflows/recipes/story-short-film.md` — the production-sheet pipeline:
  1. story bible (`story.md`: storyline, characters+personality, locations,
     items, shot list) → user approval
  2. production sheets per character/location/prop (multi-angle + expressions
     + palette, white bg) → register locked
  3. storyboard image + per-scene prompts mapped to sheets
  4. clips via `generateVideoFromImage` `referenceImagePaths` (≤3 sheets/scene;
     4-5 refs or stylized → Omni Flash)
  5. `assembleFinal` with `transition` (dissolve/fade) + VO/music/captions

## Model choice: Veo 3.1 vs Gemini Omni Flash (updated 2026-07-06)

- **Veo 3.1** (`generateVideoFromImage` etc.): cinematic fidelity, 1080p+,
  8s beats, animating locked NBP keyframes. $0.10/s fast tier.
- **Omni Flash** (`generateOmniVideoClip`): instruction-precision + styling +
  editing. ~$1.03/10s, **max 10s/clip, 720p only, 16:9 or 9:16**, native audio
  (VO/SFX prompted in text — no audio input). Timestamped prompts
  (`[00:00-00:02]…`, `He says,"…"`, `SFX:`, `(no subtitles)`) work on BOTH
  models — see `workflows/VIDEO-PROMPT-GUIDE.md` § Gemini Omni Flash for the
  full guide and tested verdicts.

### Omni Flash task selection (auto-detected from args)

| User wants | Pass | Task |
|---|---|---|
| Explainer / sizzle reel from text | `prompt` only | text_to_video |
| Animate a keyframe / scene image (explainer, cinematic) | `referenceImagePath` | image_to_video |
| Product/character consistency in a new scene | `referenceImagePaths` (2-5) + cite `<IMG_REF_0>`… in prompt | reference_to_video |
| Add SFX / on-video text / restyle / camera change on an existing clip | `inputVideoPath` + one-change instruction | edit |
| **Motion control** — swap the performers in a real video with your characters | `inputVideoPath` + `referenceImagePaths` + minimal replace-prompt | edit |

### Motion control (video-to-video character swap) — tested recipe

Replaces the people in a real video (dance, choreography, any performance)
with your locked characters; motion, timing, camera, and background carry
over 1:1. Full recipe with receipts: `workflows/VIDEO-PROMPT-GUIDE.md` §7.
The rules that change outcomes:

1. **Trim the source to ≤10s** first (ffmpeg); aspect + duration inherit from
   the input video — never pass them on an edit task.
2. **Prompt MINIMAL — the reference images carry ALL identity/outfit detail**:
   "Replace the three dancers with the three characters from `<IMG_REF_0>`,
   `<IMG_REF_1>`, and `<IMG_REF_2>` (left, center, right respectively),
   keeping the same choreography, timing, camera, background, and lighting.
   (no subtitles)". Descriptive breed/outfit prompts get Input-blocked
   ($0 each) — don't reword adjectives, strip them.
3. **Cast multiple characters by screen position** (left/center/right →
   `IMG_REF_n`). Outfit variants of one locked character work well via
   `generateImageVariation` (~$0.13/still) — clothing must be text/logo-free
   or it renders garbled.
4. **Output is ALWAYS silent** (source audio never survives an edit task) —
   remux the same window's audio with `mixVideoAudio` (musicVolume 1.0, $0,
   beat-perfect since motion timing is copied 1:1).
5. QA with `reviewVideoOutput` (`frameCount: 4`) — watch for mid-clip
   plush/mascot style drift; re-roll only if publishing.

**Before any stylized Omni generation:** ask the art-style question (Required
Question 6 above). **Prefer Omni Flash over Veo for:** explainers in a preset
art style, live writing/text-in-scene, editing existing clips, and multi-asset
consistency. **Prefer Veo for:** premium cinematic quality and >10s beats.
The NO-TEXT-IN-PROMPTS rule is Veo-only — Omni renders and syncs text well.

## Consistency & language routing (production-tested 2026-07-06)

Full playbook: `workflows/VIDEO-PROMPT-GUIDE.md` § Production-Tested Playbook.
The short version that changes decisions:

### Character-consistent scenes — keyframe-first pipeline (MANDATORY for multi-scene character films)

1. Sheets: multi-view sheet for HUMANS; for fictional objects/mascots ALSO crop
   one clean view (`char-x-hero.png`) — video models blend multi-view object
   sheets into segmented toys.
2. Per scene: `generateImageVariation` keyframe (sheets as refs, target aspect,
   ~$0.07) → show/QA the STILL → animate that exact file with
   `generateOmniVideoClip` (image_to_video) or `generateVideoFromImage`.
   Identity lives in the keyframe; the video model only adds motion + speech.
3. Characters in the FIRST frame of every scene — or in the LAST frame via
   `generateVideoFromKeyframes` (firstFramePath + lastFramePath, Veo 3.1).
4. i2v prompts use START FRAME / ACTION / DIALOGUE / END FRAME structure —
   state WHO must still be in frame at the end.

### Language routing for speaking characters

| Dialogue language | Engine |
|---|---|
| English | Veo or Omni |
| **Myanmar / Thai / non-Latin scripts** | **Omni Flash (image_to_video)** — better pronunciation, no filter drama |
| Any language + lip-sync UGC realism | Seedance (needs OPENROUTER_API_KEY) |
| **PROVIDED audio file (voice clone/recording)** | **`infiniteTalkLipsync` (RunPod)** — the ONLY working path; audio drives the mouth, no duration cap. Omni is policy-blocked for this (deepfake guard) — do not retry it. Recipe: VIDEO-PROMPT-GUIDE §8 |

Veo + non-English script = silent filter blocks ($0, "No video was generated")
unless the ENTIRE prompt is in the target language — which then weakens
reference-following. Never write singing/music/voice-direction meta words in
Veo prompts (instant block); prevent sing-song delivery with "asks casually in
everyday spoken <language>, plain conversational tone".

### Fixing a 90%-right clip — Omni edit, WITH character refs

`generateOmniVideoClip {inputVideoPath, referenceImagePaths:[<character sheets>], prompt}` —
open with "Keep everything the same — same motion, camera, timing, audio and
spoken dialogue. Only <ONE fix>." **Any edit touching a character MUST attach
that character's reference images** — text-only edits redraw identity. Omit
duration/aspectRatio (inherited from input video).
