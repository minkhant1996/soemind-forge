# Content Generation Workflows

## IMPORTANT: RUN THESE WORKFLOWS VIA THE CLI

**Agents MUST call these pre-built workflows instead of writing code from scratch.**

Every workflow is a runnable command:

```bash
node workflows/cli.cjs <command> '<json-args>'
node workflows/cli.cjs <command> @args.json    # long prompts → args in a file
node workflows/cli.cjs list                     # show every command
node workflows/cli.cjs doctor                   # environment health check (no args)
```

`doctor` verifies Node version, module builds, `.env` + API keys, and ffmpeg,
printing a fix for anything broken (exit 1 if problems). Add `--ping` to also
make one minimal paid call verifying the Gemini key works. Run it whenever a
command fails unexpectedly.

The command prints its JSON result (output paths, cost, errors) and exits non-zero on
failure. `generate*` commands take one options object; asset/budget helpers take positional
args — pass a JSON **array** to spread them (e.g. `loadAssetConfig '["myproject"]'`).

> ❌ **Do NOT** write a `.cjs`/`.ts` file that imports from `dist/index.js` and calls these
> functions yourself. The TypeScript signatures below document each command's **arguments** —
> translate them into a `cli.cjs` call. (Building a genuinely new workflow is the one
> exception — see [CREATING_WORKFLOWS.md](./CREATING_WORKFLOWS.md).)

The signatures below are the source of truth for each command's argument shape.

> **Adding your own?** See [CREATING_WORKFLOWS.md](./CREATING_WORKFLOWS.md) for the full
> guide on writing a custom, agent-callable workflow function.

---

## Asset Registry (reuse characters / products / logos / voices)

Generate or register a visual/audio identity **once**, save its path, and reuse it for
every piece of content. Backed by `projects/{name}/config/assets.yaml`. Exported from the
same module:

```typescript
import { loadAssetConfig, resolveAsset, registerAsset, validateAssets }
  from '../../workflows/dist/index.js';

const reg  = loadAssetConfig('summer-campaign');
const char = resolveAsset(reg, 'char-founder');   // { ok, existing[], missing[] }
if (char.ok) { /* pass char.existing as reference images — don't re-describe */ }
```

| Function | Purpose |
|----------|---------|
| `loadAssetConfig(name)` | Read the registry (empty-but-valid config if absent) |
| `resolveAsset(cfg, id)` | Check an asset's files on disk → `{ ok, existing[], missing[] }` |
| `findAsset(cfg, id)` | Locate an asset across collections |
| `registerAsset(name, collection, asset, { date })` | Upsert + save (returns `WorkflowResult`) |
| `validateAssets(cfg)` | Duplicate ids, missing files, broken voice links, consent |
| `pendingAssets(cfg)` | Ids still `needs-generation` / `placeholder` |

The pre-flight that drives this is `skills/content-preflight/SKILL.md`; the requirements
matrix is `templates/content-requirements.md`.

## Cost Tracker (per-project budget + cap)

Record every run's `cost.totalCost` against a project ledger
(`projects/{name}/config/budget.yaml`) and gate expensive runs on a cap.

```typescript
import { setBudgetCap, checkBudget, recordCost, budgetSummary }
  from '../../workflows/dist/index.js';

setBudgetCap('summer-campaign', 50);
const c = checkBudget('summer-campaign', 12.40);   // { ok, spent, remaining, projected, wouldExceed }
if (c.ok) { /* generate */ recordCost('summer-campaign', { label:'hero', type:'video', amount:12.40 }); }
```

| Function | Purpose |
|----------|---------|
| `setBudgetCap(name, cap)` | Set/clear the hard cap (USD, or null) |
| `checkBudget(name, est)` | Pure pre-check — would this run exceed the cap? |
| `recordCost(name, { label, type, amount })` | Append a spend entry + persist |
| `budgetSummary(name)` | `{ spent, cap, remaining, byType, entryCount }` |
| `loadBudget(name)` | Full ledger (empty-but-valid if absent) |

> **Enforced by the CLI, not just convention:** every paid command whose args
> reference a `projects/{name}/` path is gated on that project's cap BEFORE the
> API is called (hard `BUDGET_EXCEEDED` error at/over cap; warning at 80%), and
> its actual reported cost is **auto-recorded** to the ledger afterward
> (`label: "auto:<command>"`). Agents only call `recordCost` manually for spend
> that happened outside the CLI. Emergency override — user consent required:
> `BUDGET_OVERRIDE=1 node workflows/cli.cjs …`

Driven by the `cost-guard` skill; QA before committing spend via the `qa-review` skill
(`reviewOutput`).

---

## Generation Manifest (audit trail for prompts, parameters, outputs)

Every generation session gets a `manifest.json` recording the EXACT prompt, parameters,
output paths, and cost of each call — the machine-readable twin of `prompts.txt`. Full
guide: [MANIFEST-GUIDE.md](./MANIFEST-GUIDE.md). All five commands are local file
helpers — **no API cost**.

`createGenerationManifest` and `addManifestEntry` take one options object; the other
three take a positional manifest path — pass a JSON **array** to spread it.

```bash
# 1. Session start — creates <outputDir>/manifest.json and prints its path
node workflows/cli.cjs createGenerationManifest '{
  "projectName": "my-brand",
  "outputDir": "projects/my-brand/output-contents/2026-07-05",
  "context": {
    "brandColors": ["#1a365d", "#d4a84b"],
    "restrictions": ["no competitor logos"],
    "characterRef": "assets/characters/char-main.png"
  }
}'
# Optional: "sessionId" (auto-generated as <date>-<rand> if omitted)

# 2. After EACH generation — append an entry (id + timestamp added automatically)
node workflows/cli.cjs addManifestEntry '{
  "manifestPath": "projects/my-brand/output-contents/2026-07-05/manifest.json",
  "entry": {
    "type": "image",
    "model": "gemini-3-pro-image",
    "prompt": "The EXACT prompt used…",
    "referenceImagePath": "path/to/ref.png",
    "parameters": { "aspectRatio": "16:9", "imageSize": "2K" },
    "outputPaths": ["slide-01.png"],
    "cost": { "totalCost": 0.135, "breakdown": { "image": 0.135 } },
    "status": "success"
  }
}'

# 3. Inspect a manifest / render the markdown report (positional path → JSON array)
node workflows/cli.cjs loadManifest '["projects/my-brand/output-contents/2026-07-05/manifest.json"]'
node workflows/cli.cjs generateManifestReport '["projects/my-brand/output-contents/2026-07-05/manifest.json"]'

# 4. Session end — write manifest-report.md next to the manifest, print its path
node workflows/cli.cjs saveManifestReport '["projects/my-brand/output-contents/2026-07-05/manifest.json"]'
```

Entry fields: `type` (`image|video|voiceover|music|carousel|text`), `model`, `prompt`,
`parameters` (object — aspect ratio, size, duration, voice…), `outputPaths` (array),
`cost` (`{ totalCost, breakdown }`), `status` (`success|failed|needs-review`); optional:
`referenceImagePath`, `error`, `issues` (array), `reviewNotes`.

| Function | Args | Purpose |
|----------|------|---------|
| `createGenerationManifest({ projectName, outputDir, sessionId?, context? })` | one object | Create `manifest.json` in `outputDir`, return its path |
| `addManifestEntry({ manifestPath, entry })` | one object | Append an entry; updates summary counts + `totalCost` |
| `loadManifest(manifestPath)` | `'["path"]'` | Parse an existing manifest (null if missing) |
| `generateManifestReport(manifestPath)` | `'["path"]'` | Build the human-readable markdown report string |
| `saveManifestReport(manifestPath)` | `'["path"]'` | Write `manifest-report.md` next to the manifest, return its path |

---

## Publish & Repurpose (export packs, transcription, clips)

Close the gap between "generated file" and "thing you upload". All exported from the
same module; see `publish.ts` for full input types.

### packageContent — one asset → ready-to-upload folder per platform

```bash
node workflows/cli.cjs packageContent '{
  "mediaPath": "projects/my-brand/output-contents/ad/final.mp4",
  "platforms": ["instagram","tiktok","youtube"],
  "contentType": "reel",
  "caption": "Post copy here…",
  "title": "YouTube title (optional)",
  "hashtags": ["coffee","freshroast"],
  "altText": "Accessibility description (images)",
  "link": "https://…",
  "outputDir": "projects/my-brand/output-contents/ad/publish"
}'
```

Per platform it writes: `media.mp4`/`media.png` **resized/padded to that platform's
spec** (ffmpeg, local), `caption.txt` (copy + hashtags + link, **truncated to the
platform's char limit** with a warning), `alt-text.txt`, and a `post.json` manifest.
YouTube gets `title.txt` (100-char limit) + `description.txt` instead of caption.txt.
Hashtags beyond the platform's best-practice max are dropped (warned). Local only —
no API cost. `"resize": false` copies media as-is.

Platforms: `instagram` · `tiktok` · `youtube` · `facebook` · `linkedin` · `twitter`.
Content types: `feed` · `story` · `reel` · `short` · `long` (default: `reel` for
video, `feed` for image; sensible fallback if a platform lacks the exact type).

### transcribeVideo — video/audio → transcript (Whisper via OpenRouter)

```bash
node workflows/cli.cjs transcribeVideo '{"mediaPath":"video.mp4","language":"en"}'
# → { text, transcriptPath, durationMinutes, cost }
```

Extracts mono 16 kHz audio locally, transcribes with `openai/whisper-large-v3`
(override with `model`). Saves `<name>-transcript.txt` next to the media (or
`outputPath`). **Requires OPENROUTER_API_KEY.**

### extractClip — cut a segment from a long video

```bash
node workflows/cli.cjs extractClip '{
  "videoPath": "podcast.mp4",
  "outputPath": "clips/hook-01.mp4",
  "start": "12:30", "duration": 24,
  "cropTo": "9:16"
}'
```

`start`/`end` accept seconds, `"MM:SS"`, or `"HH:MM:SS"`. `cropTo` center-crops to a
vertical/square ratio for Shorts/Reels (omit to keep the original frame). Re-encodes
for frame-accurate cuts. Local only — no API cost. Used by the `repurpose-content`
skill: transcribe → pick moments → extractClip → packageContent.

### assembleStoryFilm — multi-scene cinematic cut in one call

The assembly step of the **cinematic-story-film recipe** (`recipes/cinematic-story-film.md`).
Concatenates scene clips keeping their native (Veo) ambience ducked under narration,
places each scene's VO segment at the right time, optional music bed, end-card logo
(white bg auto-keyed, faded in near the end). Local ffmpeg only — $0.

```bash
node workflows/cli.cjs assembleStoryFilm '{
  "scenes": [
    {"clipPath":"clips/scene-01.mp4","voPath":"vo/vo-01.wav","voOffsetSeconds":0.6},
    {"clipPath":"clips/scene-02.mp4","voPath":"vo/vo-02.wav"}
  ],
  "ambientVolume": 0.32,
  "musicPath": "assets/audio/bed.wav",
  "logoPath": "assets/logos/logo-primary.png",
  "logoPosition": "top",
  "outputPath": "the-film.mp4"
}'
```

Returns `{ videoPath, durationSeconds, sceneStarts[] }`. VO segments must each be
shorter than their scene — ffprobe them first (see the recipe's pacing trap).

---

### generateVideoFromKeyframes — Veo 3.1 first + last frame interpolation

Generate a clip that starts EXACTLY on one image and ends EXACTLY on another —
reveals, transformations, and guaranteeing characters/composition at both ends
of a shot. (Exposed in the CLI 2026-07-06.)

```bash
node workflows/cli.cjs generateVideoFromKeyframes '{
  "firstFramePath": "projects/x/output-contents/d/keyframes/kf-scene-04.png",
  "lastFramePath":  "projects/x/output-contents/d/keyframes/kf-scene-04-END.png",
  "prompt": "Transition: how to get from the first frame to the last — actions in order, camera path, dialogue line if any",
  "duration": 8, "aspectRatio": "9:16", "quality": "fast",
  "outputPath": "projects/x/output-contents/d/clips/scene-04.mp4"
}'
```

- Both keyframes should share the aspect ratio. Veo fast: $0.10/s.
- Free END-frame trick: pull it from a previous take —
  `ffmpeg -sseof -0.2 -i take.mp4 -frames:v 1 kf-END.png`.
- Rule from production: characters belong in the FIRST frame of a scene; if
  the shot design hides them at the start, put them in the LAST frame and use
  this command.

### Omni edit task — surgical fixes on existing clips (WITH character refs)

When a clip is 90% right, edit it instead of re-rolling:

```bash
node workflows/cli.cjs generateOmniVideoClip '{
  "inputVideoPath": "clips/scene-05.mp4",
  "referenceImagePaths": ["assets/characters/char-hero-sheet.png"],
  "prompt": "Keep everything the same — same motion, same camera, same timing, same audio and spoken dialogue, same lighting. Only <ONE fix>. The character must be IDENTICAL to <IMG_REF_0>: <locked description>. (no subtitles)",
  "outputPath": "clips/scene-05-fixed.mp4"
}'
```

- **Any edit that touches a character MUST attach that character's reference
  image(s)** — a text-only edit fixes the described shape but silently redraws
  identity (face/wardrobe) from imagination.
- Do NOT pass `duration`/`aspectRatio` on edit tasks — inherited from the
  input video.
- Non-English dialogue, character-consistency ladder, Veo filter triage:
  VIDEO-PROMPT-GUIDE.md § Production-Tested Playbook.

---

## Pipelines — connect workflows as a JSON graph

```bash
node workflows/cli.cjs runPipeline @content-folder/my.pipeline.json
```

Nodes run in order; `"{{nodeId.data.field}}"` wires outputs to inputs. Same
budget gate + auto-ledger per node as direct calls. Failed node stops the run
(`"optional": true` to continue). `pipeline-result.json` lands next to the file
with per-node status/costs/results. Templates + full spec:
[`workflows/pipelines/`](./pipelines/README.md). Save the filled pipeline INSIDE
the content folder — it is the machine-readable twin of prompts.txt.

---

## InfiniteTalk Lip-Sync (RunPod — sync a character image to PROVIDED audio)

The route for true lip-sync to a user-supplied recording (voice clones,
podcast audio, VO): character still + speech audio → talking video whose
mouth follows the audio. Video length follows the audio — no 10s cap
(13s+ verified in one request). Flat pricing: **480p $0.25 · 720p $0.50** per
request. Requires `RUNPOD_API_KEY`. Output ~704x1280 25fps (720p tier), the
provided audio embedded.

**Prompt rule: describe ACTING only** (posture, gestures, mood, setting) —
never the spoken words; the audio drives the mouth.

```bash
node workflows/cli.cjs infiniteTalkLipsync '{
  "imagePath": "projects/x/output-contents/y/kf-s1-studio.png",
  "audioPath": "projects/x/assets/audio/scene1.wav",
  "prompt": "A man in a suit sits at a recording-studio desk and speaks into a condenser microphone, calm and confident, natural head movements",
  "resolution": "720p",
  "outputPath": "projects/x/output-contents/y/s1-talk.mp4"
}'
```

Full per-scene pipeline (VO films): transcribe WAVs (`transcribeAudio`) →
keyframe per scene (photo anchor attached) → `infiniteTalkLipsync` per
scene/WAV → normalize + `assembleFinal` → `renderCaptionedVideo`.

---

## Transcription (transcribeAudio — Gemini, no OpenRouter needed)

Timestamped transcription via Gemini 3.5 Flash multimodal — handles Burmese
and other non-English speech well. Pennies per clip. Output: one
`[m:ss.d - m:ss.d] <text>` line per phrase (also written to `outputPath`).

```bash
node workflows/cli.cjs transcribeAudio '{"audioPath":"vo/scene1.wav","language":"Burmese","outputPath":"content-plans/transcript-scene1.txt"}'
```

⚠️ **Proofread product/brand names** — ASR mangles them (VoxCPM2 came back as
"VoxEP M2", "VITS-2", and "Voxi PM2" in one session). The human script is the
source of truth; fix names before captioning.

---

## generateEdgeTTSVoiceover — FREE voiceover (Microsoft Edge TTS, no API key)

A **$0, no-key** alternative to Gemini `generateVoiceover`. Uses Microsoft Edge's
online neural voices, incl. Burmese (`my-MM-ThihaNeural` male, `my-MM-NilarNeural`
female). Use when the user wants free narration or a different voice. NOT budget-gated
(it's free). Needs the `edge-tts` Python package + internet.

**Install once (check first):**
```bash
python3 -c "import edge_tts" || python3 -m pip install edge-tts
# node workflows/cli.cjs doctor  ← reports whether edge-tts is installed
```

```bash
# Burmese female → wav (48kHz mono, ready for assembleFinal)
node workflows/cli.cjs generateEdgeTTSVoiceover '{
  "script": "မင်္ဂလာပါ။ ဒါက အခမဲ့ voiceover ပါ။",
  "voice": "my-female",
  "outputPath": "projects/{name}/output-contents/vo.wav"
}'
# → { success:true, data:{ audioPath, voice, cost:{ totalCost:0 } } }
```

Fields: `script` · `outputPath` (`.wav` → auto-converted to 48kHz mono; `.mp3` → native
24kHz) · `voice` (a friendly alias — `my-male`/`my-female`/`en-male`/`en-female` — OR any
full Edge voice id; default `my-MM-ThihaNeural`) · `rate` (`"+0%"`,`"-10%"`) · `volume`
(`"+0%"`) · `pitch` (`"+0Hz"`). Full voice catalogue: `python3 -m edge_tts --list-voices`.

**Gemini vs Edge:** Gemini `generateVoiceover` = 30 styled voices, emotion/pace/accent
control, audio tags, ~$0.001/req (paid, budget-gated). Edge = free, fixed neural voices,
rate/volume/pitch only. For the user's OWN cloned voice, neither — use their provided
WAVs + `infiniteTalkLipsync`.

---

## Reference Video Analysis (analyzeReferenceVideo — "make something like that")

Analyze a reference video into a scene-by-scene breakdown + a recreation
blueprint. Accepts a **YouTube URL** (Gemini fetches it directly — no
download) or a **local video file** (≤19 MB inline; larger files auto-upload
via the Gemini Files API). Video input is tokenized at ~300 tokens/second
(~$0.03/min of video + output tokens).

```bash
node workflows/cli.cjs analyzeReferenceVideo '{"youtubeUrl":"https://www.youtube.com/watch?v=...","outputDir":"projects/my-brand/output-contents/2026-07-07/ref-01","notes":"Recreate for my coffee brand, 30s vertical","language":"Burmese"}'
# or: {"videoPath":"refs/competitor-ad.mp4", ...}
```

Writes into `outputDir`:
- `breakdown.json` — full structured analysis (metadata, style, pacing, audio, scenes[], recreation{})
- `breakdown.md` — human shot list: `Scene N · 0:00–0:03 — Opening hook`, shot type, camera move, visual, on-screen text, verbatim spoken line
- `recreation-plan.md` — per-scene generic video prompts + VO script + suggested command + music brief

The blueprint is a STARTING POINT: run content-preflight, swap generic
subjects for registered assets, then pipeline the generation as usual.
Skill: `skills/analyze-video/SKILL.md`.

---

## Remotion Rendering (local pixel-perfect typography, $0)

AI image models garble text; Remotion doesn't. Generate **text-free backgrounds**
with the image workflows, then render typography locally with real Sora/Inter fonts.
Requires one-time `npm install` inside `remotion/`. No API cost.

### renderCaptionedVideo — burn timed captions over a finished video (Burmese-safe)

Chromium shaping via OS font fallback (`'Myanmar MN'`, `'Noto Sans Myanmar'`)
renders complex scripts correctly — unlike ffmpeg drawtext. Cues come from
`transcribeAudio` timestamps, offset by each scene's start on the assembled
timeline. $0, audio kept.

```bash
node workflows/cli.cjs renderCaptionedVideo '{
  "videoPath": "final.mp4",
  "cues": [{"start": 0.0, "end": 2.0, "text": "ဒါကတော့ VoxCPM2 နဲ့"}, ...],
  "fontSize": 52, "marginBottom": 480,
  "outputPath": "final-cc.mp4"
}'
```

Top-level fields: `fontSize` (px, default 52) · `marginBottom` (px from bottom —
480 ≈ 3/4 frame height, 280 = low-thirds) · `accentColor` (pill border + `**word**`
emphasis color). Write a standard `.srt` from the same cues alongside for platform
captions.

**Per-cue creative fields** (this is more than a plain transcript — decide the method
by video type first: TEXT-OVERLAY-DESIGN-GUIDE.md § 0):
- `style`: `"pill"` (default lower-third pill) or `"hero"` (big open text, stroke +
  shadow, no pill — for hook/punch-in words).
- `pos`: `"lower"` (default) · `"mid"` (~62% down) · `"upper"` (top quarter — good for
  location/label stamps). `align`: `"center"` (default) or `"left"`.
- `size` (px, per-cue override) · `color` (base text color, default white).
- `**word**` inside `text` → renders that word in `accentColor` at heavier weight
  (per-word emphasis — highlight the 1–2 words that matter, e.g. a product name).
- `\n` inside `text` → stacked lines with a staggered spring entrance (use for
  bilingual native+translation).

**Only ONE cue is active at a time** (composition uses `cues.find`). To STACK layers —
e.g. a bottom transcript AND an upper location stamp, or transcript + a behind-subject
word — render in **separate passes**: pass 1 burns layer A onto the video, pass 2 runs
`renderCaptionedVideo` again on pass-1's output with layer B's cues.

For a big word BEHIND the speaker (occlusion), that's a different technique — the
`rembg` text-behind-subject recipe in TEXT-OVERLAY-DESIGN-GUIDE.md § 6 (bake into each
clip before assembly, then add the transcript pass here). That recipe needs the `rembg`
Python lib — check/install first: `python3 -c "import rembg" || python3 -m pip install
"rembg[cpu]" pillow` (§ 6 has the full requirements + model-download note).

### renderSlideStill — background + headline/sub/footer/logo → 1080x1350 slide

```bash
node workflows/cli.cjs renderSlideStill '{
  "backgroundPath": "projects/my-brand/output-contents/x/bg.png",
  "headline": "AI made building too easy.",
  "sub": "Now founders build the wrong things.",
  "footer": "soemindai.com",
  "logoPath": "projects/my-brand/assets/logos/logo-primary.png",
  "headlineSize": 64,
  "scrim": true,
  "outputPath": "projects/my-brand/output-contents/x/slide-01.png"
}'
```

`scrim: true` adds a frosted mist panel behind the text — use on busy backgrounds.

### renderKineticReel — scenes + VO → 9:16 kinetic-typography reel

Lines appear staggered (spring animation); per-line `size`/`color` control emphasis —
make the ONE key phrase bigger and gold (#C8A24A), keep the rest navy/slate.

```bash
node workflows/cli.cjs renderKineticReel '{
  "audioPath": "projects/my-brand/output-contents/x/voiceover.wav",
  "scenes": [
    { "backgroundPath": "projects/my-brand/output-contents/x/bg-01.png",
      "seconds": 3.6,
      "lines": [
        { "text": "AI made building", "size": 64 },
        { "text": "too easy.", "size": 112, "color": "#C8A24A" }
      ] },
    { "backgroundPath": "projects/my-brand/output-contents/x/bg-06.png",
      "seconds": 7.6,
      "logoPath": "projects/my-brand/assets/logos/logo-primary.png",
      "scrim": true,
      "lines": [
        { "text": "Stress-test your idea", "size": 64 },
        { "text": "soemindai.com", "size": 38, "font": "inter", "delay": 2.4 }
      ] }
  ],
  "outputPath": "projects/my-brand/output-contents/x/reel.mp4"
}'
```

Line fields: `text` (required), `size` (px, default 64), `color` (default navy
#0F172A), `font` ("sora" bold display / "inter" body), `weight`, `delay` (seconds,
default staggered 0.55s per line). Scene fields: `backgroundPath`, `seconds`,
`lines[]`, `logoPath`, `scrim`, `align`, `bgAudioVolume`. Media paths are real
project files — staged into remotion/public/ automatically. Total duration = sum
of scene seconds; match it to the voiceover length (~2.5 words/sec).

### renderTextMotion — full text-animation engine (positioned, timed, in/out/loop) · $0

The superset of `renderKineticReel`: a timeline of independently **positioned**
(`x`,`y`,`anchor`) and independently **timed** (`start`,`end`) text elements, each
with a CapCut-style entrance/exit/loop animation. Use this (not KineticReel) for
anything needing real placement, exits, loops, per-word/letter reveals, or
video-in-text. Local render, always $0. Structured output returns each element's
`resolvedBox` + timing.

```bash
node workflows/cli.cjs renderTextMotion @clip.textmotion.json
```
```jsonc
{
  "width": 1080, "height": 1920, "fps": 30, "durationSeconds": 10.2,
  "background": { "kind": "image", "path": "…/bg.png", "kenBurns": true, "dim": 0.1 },
  "audioPath": "…/vo.wav", "musicPath": "…/music.wav",
  "elements": [
    { "text": "NO $2,000 GPU", "x": 0.5, "y": 0.28, "anchor": "top-center",
      "in": "pop", "out": "sink", "loop": "float", "start": 0.5, "end": 9.8,
      "inDuration": 0.6, "outDuration": 0.4, "size": 96, "weight": 800,
      "gradient": "linear-gradient(135deg,#3b6bff,#1b4fd8,#c8a24a)" },
    { "text": "one number decides", "x": 0.5, "y": 0.42, "in": "wordByWord",
      "stagger": "word", "staggerStep": 0.06, "size": 40, "color": "#1a1c1f" },
    { "text": "LOCAL AI", "x": 0.5, "y": 0.7, "in": "fadeIn", "size": 150,
      "uppercase": true, "mediaFill": "…/broll.mp4" }
  ],
  "outputPath": "…/clip.mp4"
}
```

**Position** (`x`,`y`): fraction 0..1 of canvas, px if >1, or `"50%"`. `anchor` =
which point of the box lands at (x,y): `center|top|bottom|left|right|top-left|…`.
`maxWidth` (wrap), `align`, `rotate`.
**Timing** (seconds): `start`,`end`,`inDuration`,`outDuration`.
**Animation** — `in` / `out` / `loop` tokens (`easing`: spring|easeOut|easeInOut|
linear|backOut|bounce|elastic or `[x1,y1,x2,y2]`; `stagger`: none|word|letter +
`staggerStep`):
- **IN**: fadeIn fadeUp fadeDown fadeLeft fadeRight rise pop bounceIn zoomIn spinIn
  flipUp wipeRight wipeLeft revealUp blurIn elastic glitchIn inkReveal shakeIn roll
  expandTracking lightSweep typewriter wordByWord letterByLetter waveIn
- **OUT**: fadeOut sink slideOutL slideOutR slideOutU slideOutD zoomOut popOut
  blurOut wipeOut spinOut shrinkOut glitchOut dissolve
- **LOOP**: none float pulse breathe shake wiggle blink flicker wave bounceLoop
  rotateLoop sway heartbeat jelly neon hueShift
**Style**: `font`(sora|inter) `size` `weight` `color` `gradient` `stroke`/`strokeWidth`
`glow`/`glowSize` `italic` `uppercase` `tracking` `lineHeight` `highlight`/`highlightPad`
`shadow` `opacity`, and `mediaFill` (image OR video shown THROUGH the letters).
**Background**: `{ kind:"image|video|color", path, color, fit, kenBurns, dim }`.
**Creative extensions** (elements): `behind:true` (render UNDER the subject cutout —
needs top-level `subject:{source,model,maxSeconds,fps,feather}`, rembg-matted) ·
`bleed` (no-wrap hero overflow) · `badge` (chip/pill) · inline markup in `text`:
`**bold**` `==accent==`(→`accentColor`) `//italic//` · `perLetter:{stepY,stepRotate,skew}`
(cascade) · `parts:[{text,dx,dy,scale,color}]` (dominant+satellites) · fonts
`sora|inter|caveat(script)|bebas(display)`.
Design guidance (which anim/style when): `TEXT-OVERLAY-DESIGN-GUIDE.md`.

### suggestTextDesign — recommend placement + style + animation from a frame · ~$0.0004

Superset of `suggestTextPlacement`: same vision pass also classifies the scene and
returns the recommended creative **style + in/out/loop + font** (scene→style table:
cinematic-broll→behind-subject, flat-graphic→gradient-hero, talking-head→lower-third,
before-after→chips, celebratory→script-accent…). Lets the agent decide the *whole*
treatment per frame, then override anything.
```bash
node workflows/cli.cjs suggestTextDesign '{"framePath":"…/frame.png","text":"NO $2,000 GPU","intent":"hook"}'
# → { placement, style, in, out, loop, font, sceneType, emphasis, region, subject, reasoning, cost }
```

### subjectMatte — rembg cutout for text-behind-subject · $0 (slow)

Cuts out the foreground subject → RGBA PNG (image) or VP9/webm-alpha (video), cached
by source hash. Usually called for you by `renderTextMotion` when an element has
`behind:true` + `subject.source`; call directly to pre-warm/cache.
```bash
node workflows/cli.cjs subjectMatte '{"source":"…/clip.mp4","model":"u2netp","maxSeconds":15,"fps":25}'
# → { cutoutPath, kind:"image|video", cached, frames }
```
Models: `u2net` (default, best) · `u2netp` (fast) · `isnet-general-use`. Video ~1s/frame.

### suggestTextPlacement — frame-aware text placement (decide like a human) · ~$0.0004

Reads a frame and returns where/how big/what color to place text — so an agent
places captions the way a human art director would (negative space, away from the
subject, contrasting color) instead of hard-coding numbers. Vision (`analyzeImage`)
finds the empty region + subject; `sharp` samples that region's luminance/variance
for a guaranteed-contrast color and a scrim decision. Output drops straight into a
`renderTextMotion` element.

```bash
node workflows/cli.cjs suggestTextPlacement '{"framePath":"…/frame.png","text":"NO $2,000 GPU","intent":"hook headline"}'
# → { placement:{x,y,anchor,maxWidth,size,color,scrim}, region, subject, brightness, busy, reasoning, cost }
```
`framePath` (image or video — a frame is extracted) · `text` · `intent` · optional
`canvasWidth/Height`, `avoid` (normalized regions already used), `maxSizePx/minSizePx`.
Then: spread `data.placement` into a `renderTextMotion` element.

### transcriptToElements — transcript cues → timed renderTextMotion elements · $0

Turns `transcribeAudio` cues into ready-to-render text elements, each timed to when
it's spoken. Agent then optionally emphasizes keywords.

```bash
node workflows/cli.cjs transcriptToElements '{"cues":[{"start":0,"end":1.5,"text":"Run AI locally"}],"mode":"caption"}'
# mode: "caption" (lower-third) | "hero" (center big). → { elements:[…], count }
```
Feed `data.elements` as `renderTextMotion.elements` (override position/style per cue as needed).

### generateOmniVideoClip — Gemini Omni Flash video (experimental)

The instruction-precision alternative to Veo (~10s cap, 720p native,
~$1.03/10s measured). Wins at: live handwriting, text-in-scene, precise
choreography, stylized explainers, native audio (VO/SFX generated in the same
pass). Specs: max 10s/turn · 720p only · aspect `16:9` (default) or `9:16` ·
up to 5 reference images · audio OUT yes, audio IN no · refuses named real
people · SynthID watermark on every output.

**Audio behavior (production-verified 2026-06/07):** dialogue/SFX the model
GENERATES arrives embedded (aac) in the same mp4 — including on `edit` tasks
when the prompt contains dialogue. Audio already IN your input video NEVER
passes through an `edit` task — the output is silent every time. Plan a
`mixVideoAudio` remux ($0) after every edit that must keep source audio.
Avoid the phrase "audio track" in prompts (input-filter trigger);
"soundtrack" passes.

**Lip-sync to PROVIDED audio is policy-blocked on Omni** (3/3 deterministic:
"can't create videos with real people's likenesses" when a real voice is
embedded in the input + a sync instruction — deepfake guard, even for your own
face/voice). Model-generated dialogue lip-sync is fine. For syncing to a
user's recording, use `infiniteTalkLipsync` (RunPod) below.

**Video tasks** (auto-selected from your inputs; override with `task`):

| Task | Trigger inputs | Best for |
|---|---|---|
| `text_to_video` | prompt only | Explainers, sizzle reels, word-by-word text sync |
| `image_to_video` | `referenceImagePath` (1 image) | Explainers, cinematic beats, animating a locked NBP keyframe |
| `reference_to_video` | `referenceImagePaths` (2-5 images) | Consistency: cite each as `<IMG_REF_0>`, `<IMG_REF_1>`… in the prompt |
| `edit` | `inputVideoPath` | Add SFX, add/change on-video text, restyle, change camera/action — or **motion control**: swap the performers in a real video with your characters (+`referenceImagePaths`, cast by screen position; VIDEO-PROMPT-GUIDE §7) |
| `extend` | `inputVideoPath` + `task:"extend"` | Continue a scene past its end |

**Art styles** — Omni Flash shines at stylized output. `artStyle` prepends a
tuned fragment: `pixel-art`, `claymation`, `mixed-media`, `3d-papercraft`,
`whiteboard-doodle`, `2d-illustration`, `low-poly`, `3d-mix`,
`isometric-flat-vector`, `fluffy-toy`. **ASK the user which style** (or
photorealistic = omit) before generating — never silently pick one.

```bash
# image_to_video — production path: NBP keyframe with locked character
node workflows/cli.cjs generateOmniVideoClip '{
  "prompt": "[00:00-00:01] He uncaps the marker... [00:01-00:07] He writes TALK TO USERS — first T-A-L-K, then T-O... He says, \"Thats the whole strategy.\" (no subtitles)",
  "referenceImagePath": "projects/my-brand/output-contents/x/keyframe.png",
  "duration": "10s",
  "aspectRatio": "9:16",
  "outputPath": "projects/my-brand/output-contents/x/clip.mp4"
}'

# reference_to_video — multi-image consistency via <IMG_REF_n> tags
node workflows/cli.cjs generateOmniVideoClip '{
  "prompt": "A violinist is playing this violin <IMG_REF_0> on this stage <IMG_REF_1>",
  "referenceImagePaths": ["assets/products/violin.png", "assets/backgrounds/stage.png"],
  "outputPath": "projects/my-brand/output-contents/x/violin.mp4"
}'

# edit — add SFX / on-video text to an existing clip
node workflows/cli.cjs generateOmniVideoClip '{
  "prompt": "Keep everything the same. Add animated motion effects coming out of the skateboard, with whoosh SFX.",
  "inputVideoPath": "projects/my-brand/output-contents/x/skate.mp4",
  "outputPath": "projects/my-brand/output-contents/x/skate-fx.mp4"
}'

# edit as CREATIVE BAKED TEXT (Route C — PAID ≈$0.10/sec; the FREE routes are
# renderCaptionedVideo / renderTextMotion — TEXT-OVERLAY-DESIGN-GUIDE §0-pre).
# Timestamped beats in ONE prompt land multiple timed graphics reliably —
# key each timestamp to the VO transcript so graphics hit the spoken words:
node workflows/cli.cjs generateOmniVideoClip '{
  "prompt": "Keep everything the same — same people, same motion, same camera, same timing, same lighting. Only add bright-yellow hand-drawn marker doodles: 00:02 — a hand-lettered word position sketches itself upper left inside a loose marker oval. 00:05 — a giant doodle checkmark draws itself with sparkle rays and holds. (no subtitles)",
  "inputVideoPath": "projects/my-brand/output-contents/x/broll-8s.mp4",
  "outputPath": "projects/my-brand/output-contents/x/broll-doodled.mp4"
}'
# Baked-text rules (production-tested 2026-07, each cost real money to learn):
#  · keep prompts MINIMAL — verbose edit prompts (+char ref) → 400 Input blocked
#    ($0); drop the ref image when the person isn't being changed
#  · behind-subject words occlude ONLY at HEAD/SHOULDER height (3/3); words
#    crossing the torso paint IN FRONT (0/3) — torso-level = use rembg (free)
#  · baked words ≤2-3 short English words; frame-grab verify (can truncate)
#  · duration is a STRING '4s'..'10s' (number → 400 at response_format);
#    edit tasks: don't pass duration/aspect at all
#  · >10s scene: split base ≤10s, edit each, concat, setpts stretch ≤~7%, remux

# edit as MOTION CONTROL — swap performers in a real video with your characters.
# Prompt stays MINIMAL (refs carry all identity/outfit detail — descriptive
# prompts get filter-blocked); trim input to ≤10s first; output is silent →
# remux source audio with mixVideoAudio. Full recipe: VIDEO-PROMPT-GUIDE §7.
node workflows/cli.cjs generateOmniVideoClip '{
  "prompt": "Replace the three dancers with the three characters from <IMG_REF_0>, <IMG_REF_1>, and <IMG_REF_2> (left, center, right respectively), keeping the same choreography, timing, camera, background, and lighting. (no subtitles)",
  "inputVideoPath": "projects/my-brand/assets/dance-10s.mp4",
  "referenceImagePaths": ["char-a.png", "char-b.png", "char-c.png"],
  "outputPath": "projects/my-brand/output-contents/x/dance-swap.mp4"
}'

# text_to_video — stylized explainer with art style preset
node workflows/cli.cjs generateOmniVideoClip '{
  "prompt": "An explainer of how rain forms: evaporation, condensation, rainfall. A calm voiceover narrates each stage as it appears.",
  "artStyle": "claymation",
  "duration": "10s",
  "outputPath": "projects/my-brand/output-contents/x/rain.mp4"
}'
```

Fields: `prompt` (timestamps/dialogue/SFX syntax — see VIDEO-PROMPT-GUIDE §
Omni Flash), `referenceImagePath` / `referenceImagePaths` (max 5),
`inputVideoPath`, `task`, `artStyle`, `cameraMove` (46 presets —
VIDEO-PROMPT-GUIDE §2b), `aspectRatio` ('16:9'|'9:16'), `duration`
('4s'-'10s'), `thinkingLevel`. Requires @google/genai >= 2.0. Model selection
rule, prompting philosophy, and tested verdicts: VIDEO-PROMPT-GUIDE.md.

**Camera-move presets (all video commands):** `generateSilentVideo`,
`generateVideoFromImage`, and `generateOmniVideoClip` accept
`cameraMove: "<id>"` — a four-part block (Movement/Speed/Framing/End) is
prepended to the prompt from `CAMERA_MOVES`. For scene-array workflows
(voiceover scenes, speaking video, Seedance), paste the block manually at the
head of each scene prompt. Ids + when-to-use table: VIDEO-PROMPT-GUIDE.md §2b.

**Video backgrounds:** `backgroundPath` also accepts a video clip
(.mp4/.mov/.webm — e.g. a Veo render). Set `bgAudioVolume` (0–1, default 0/muted)
to keep the clip's native ambience under the text. This powers the POV-series
recipe: Veo clip + kinetic text in one call.

---

## Post-Generation QA (agents review their OWN outputs)

**After every image:** `reviewOutput` · **After every video:** `reviewVideoOutput` —
samples N frames evenly, runs the vision rubric on each, checks duration + audio
track. `{ pass, score, frames[], issues[] }` tells the agent exactly WHAT to fix
(which frame, which check) before packaging. ~$0.002/frame.

```bash
node workflows/cli.cjs reviewVideoOutput '{"videoPath":"out.mp4","frameCount":4,
  "brandColors":["#1E3A8A"],"expectedAspect":"9:16","expectAudio":true,
  "expectedDurationSeconds":12}'
```

Calibration: for KINETIC/TYPOGRAPHY content pass
`"checks":["brand-colors","consistency","aspect","quality"]` — the default
rubric treats rendered text as unwanted (right for photoreal scenes, wrong for
text-led reels). The reviewer is deliberately strict; a flagged frame means
LOOK at it (frames saved in .qa/ next to the video), not auto-regenerate.

---

## Content Review (Pre-Generation)

**Review content BEFORE spending money on generation.** Catch issues in plans, scripts,
and prompts early - a 1-second review can save $0.07-$20+ in wasted generations.

```typescript
import { reviewScript, reviewImagePrompt, reviewVideoPrompt, reviewThumbnail, reviewContentPlan, reviewBatch }
  from '../../workflows/dist/index.js';

// Review a script before TTS
const scriptResult = await reviewScript({
  script: 'This product will cure your problems!',
  targetDuration: 15,
  restrictions: ['cure', 'guaranteed'],
});
// scriptResult.data.pass === false (restriction violation)

// Review an image prompt
const imageResult = await reviewImagePrompt({
  prompt: 'Product with price tag showing $29',
  restrictions: ['price'],
});
// imageResult.data.pass === false (text in prompt)

// Review a video prompt
const videoResult = await reviewVideoPrompt({
  prompt: 'Camera zooms in while panning left',
  provider: 'veo',
});
// videoResult.data.pass === false (conflicting camera movements)

// Review a thumbnail (checks character reference requirement)
const thumbResult = await reviewThumbnail({
  prompt: 'Person with excited expression',
  thumbnailType: 'youtube',
  includesPerson: true,
  hasCharacterReference: false,  // Missing!
});
// thumbResult.data.pass === false
// thumbResult.data.characterStatus === 'needs-reference'
// thumbResult.data.nextSteps === ['Generate character keyframe first', ...]

// Batch review all prompts before a campaign
const batchResult = await reviewBatch({
  imagePrompts: ['prompt 1', 'prompt 2'],
  videoPrompts: ['video prompt'],
  scripts: ['script text'],
  restrictions: ['guarantee', 'cure'],
});
console.log(`Potential savings: $${batchResult.data.totalPotentialSavings}`);
```

| Function | Input | Checks |
|----------|-------|--------|
| `reviewScript` | script, duration, restrictions | Pacing, restrictions, hook, CTA |
| `reviewImagePrompt` | prompt, aspect, restrictions | Text, animation, style, lighting |
| `reviewVideoPrompt` | prompt, duration, provider | Text, camera, transitions, provider fit |
| **`reviewThumbnail`** | prompt, type, includesPerson, hasRef | **Character reference**, text/logo, expression, contrast |
| `reviewContentPlan` | plan path, brand path | Completeness, placeholders, brand |
| `reviewBatch` | arrays of prompts/scripts | All of the above |

**Thumbnail review returns extra fields:** `recommendedWorkflow`, `characterStatus`, `nextSteps`

**Review is FREE. Generation is NOT.** Driven by the `content-review` skill.

For thumbnail guidelines, see **THUMBNAIL-GUIDE.md**.

---

## Provider Detection (Gemini vs OpenRouter)

> **Note:** these helpers are library exports only (no CLI commands) — informational;
> from the CLI, check provider availability with `node workflows/cli.cjs doctor` instead.

Before generating, check which AI providers are available. The system supports two
providers with different capabilities:

| Provider | Video | Image | Text | TTS | Music | STT |
|----------|-------|-------|------|-----|-------|-----|
| **Gemini** | Veo 3.1 | Gemini 3 Image (Nano Banana) | Gemini 3.5 Flash | ✓ | Lyria | ✗ |
| **OpenRouter** | Seedance 2.0 | ✗ | GPT-4, Claude, etc. | ✗ | ✗ | Whisper |

```typescript
import { detectProviders, getProviderSummary, compareVideoProviders }
  from '../../workflows/dist/index.js';

// Check what's available
const config = detectProviders();
console.log(config.gemini.available);     // true/false
console.log(config.openrouter.available); // true/false
console.log(config.recommendation.video); // 'gemini' | 'openrouter' | null

// Human-readable summary for display
console.log(getProviderSummary());
// Output:
// Provider Status:
//   ✓ Gemini (Google AI Studio) - 1 API key(s) configured
//     Capabilities: text, image, video (Veo), tts, music (Lyria)
//   ✗ OpenRouter - No API key configured
//     Set OPENROUTER_API_KEY in .env to enable

// Compare video providers for a use case
const comparison = compareVideoProviders('lip-sync');
console.log(comparison.recommendation); // 'seedance'
console.log(comparison.reason);         // 'Seedance has native lip-sync support...'
```

| Function | Purpose |
|----------|---------|
| `detectProviders()` | Returns `{ gemini, openrouter, defaultProvider, recommendation }` |
| `getProviderSummary()` | Human-readable status string for display |
| `compareVideoProviders(useCase)` | Compare Veo vs Seedance for: `'general'`, `'lip-sync'`, `'product'`, `'ugc'`, `'b-roll'` |
| `getProviderSelectionPrompt()` | Formatted question to ask users (null if only one provider) |

### When to Use Which Provider

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Product video | Veo | Higher visual quality, multiple quality tiers |
| B-roll / cinematic | Veo | Better for ambient, non-speaking footage |
| Speaking character | Seedance | Native lip-sync support |
| UGC testimonial | Seedance | Integrated dialogue + natural speech |
| Video with SFX + music | Seedance | Native audio integration |
| Background music | Gemini | Lyria music generation |
| Model variety (GPT-4, Claude) | OpenRouter | Access to 100+ text models |

### Environment Variables

```env
# Gemini (Google AI Studio)
GEMINI_API_KEY=your-key
# or multiple keys for rotation:
GEMINI_API_KEYS=key1,key2,key3

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
# or multiple keys:
OPENROUTER_API_KEYS=key1,key2,key3
```

---

## Brand Assets (Logos, Profiles, Covers)

Generate consistent brand assets across all social platforms with correct specs.

```typescript
import {
  generateProfileImage,
  generateCoverImage,
  generateHighlightCovers,
  generateBrandAssets,
} from '../../workflows/dist/index.js';

// Generate profile images for all platforms
const profiles = await generateProfileImage({
  type: 'logo',  // 'logo' | 'person' | 'mascot' | 'monogram'
  logoPath: 'assets/logos/logo-icon.png',
  platforms: ['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok'],
  outputDir: 'projects/my-brand/assets/social/profiles',
});

// Generate cover/banner for a platform
const cover = await generateCoverImage({
  platform: 'youtube',  // 'facebook' | 'youtube' | 'linkedin' | 'twitter'
  style: 'modern tech startup',
  brandColors: ['#4F46E5', '#10B981'],
  outputPath: 'projects/my-brand/assets/social/covers/youtube-banner.png',
});

// Generate Instagram highlight covers
const highlights = await generateHighlightCovers({
  categories: ['About', 'Products', 'Reviews', 'Tips', 'Contact'],
  backgroundColor: '#4F46E5',
  iconColor: '#FFFFFF',
  outputDir: 'projects/my-brand/assets/social/highlights',
});

// Generate ALL brand assets in one call
const brandAssets = await generateBrandAssets({
  projectName: 'my-brand',
  brandName: 'SoeMind',
  tagline: 'Build smarter, not harder',
  style: 'modern minimalist',
  primaryColor: '#4F46E5',
  secondaryColor: '#10B981',
  logoPath: 'assets/logos/logo-icon.png',
  platforms: ['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok'],
  includeCovers: true,
  includeProfiles: true,
  includeHighlights: true,
  highlightCategories: ['About', 'Products', 'Reviews', 'Tips'],
  includeWatermark: true,  // YouTube watermark
});
```

### Platform Specs Quick Reference

| Platform | Profile | Cover | Notes |
|----------|---------|-------|-------|
| Facebook | 320×320 (circle) | 820×312 | Cover safe: 640×312 |
| Instagram | 320×320 (circle) | N/A | Use highlight covers |
| TikTok | 200×200 (circle) | N/A | No cover |
| YouTube | 800×800 (circle) | 2560×1440 | Banner safe: 1546×423 |
| LinkedIn | 400×400 (circle) | 1584×396 | Personal banner |
| Twitter | 400×400 (circle) | 1500×500 | Header |

**Cost:** ~$0.067/profile, ~$0.10/cover, ~$1.00-1.50 for full brand set

For detailed prompt templates, see **BRAND-ASSETS-GUIDE.md**.

---

## CRITICAL: READ PROJECT CONTEXT BEFORE WRITING PROMPTS

**Before writing ANY prompt, you MUST:**

1. **Read project templates** (if they exist):
   ```
   projects/{name}/templates/project.md  → Product info, audience, pain points
   projects/{name}/templates/brand.md    → Colors, visual style, tone
   ```

2. **Check assets folder** for reference images:
   ```
   projects/{name}/assets/
   ```

3. **Use the information** from templates in your prompts

**DO NOT write generic prompts. Use project-specific context.**

---

## PROMPT WRITING GUIDE

### RULE 1: NO TEXT IN VIDEO/IMAGE PROMPTS

**NEVER include these in prompts:**
- ❌ "Text appears saying..."
- ❌ "Caption reads..."
- ❌ "Words on screen..."
- ❌ "Title overlay..."
- ❌ "Text: [anything]"

**Text is added via post-production (FFmpeg), not AI generation.**

### RULE 2: Describe VISUALS Only

**Good video prompts describe:**
- Camera movement (slow pan, zoom in, tracking shot)
- Lighting (golden hour, soft natural, studio lighting)
- Subject action (checking watch, smiling, walking)
- Environment (modern office, gym, kitchen)
- Mood (energetic, calm, professional)

### RULE 3: Use Reference Images for Consistency

When you have a product/character image in `assets/`:
- Use `generateImageVariation()` for single images
- Use `generateCarouselFromRef()` for carousels
- Use `generateVideoFromImage()` for videos
- Use `generateSpeakingVideoFromImage()` for speaking videos

---

## CHARACTER CONSISTENCY (CRITICAL)

**Problem:** Each generation creates a NEW random person/character.

**Solution:** Use the SAME character reference image for ALL generations.

### Step 1: Ask About Person/Character

Before generating, ALWAYS ask:
1. **Does this content include a person/character?**
2. **If yes, is there a character image in assets?**

### Step 2: Check Assets for Character Reference

```bash
ls projects/{name}/assets/character-*.{png,jpg}
```

**Asset naming convention:**
- `character-main.png` - Primary character reference
- `character-alt.png` - Alternative character
- `product-*.png` - Product photos
- `environment-*.png` - Background/setting

### Step 3: Use Reference or Generate Keyframe

**If character image EXISTS:**
```typescript
// Use existing character for all generations
const result = await generateSpeakingVideoFromImage({
  referenceImagePath: 'projects/{name}/assets/character-main.png',
  dialogue: '...',
  ...
});
```

**If NO character image:**
```typescript
// Step 1: Generate character keyframe FIRST
const keyframe = await generateSingleImage({
  prompt: 'Woman in her 30s, dark hair, professional attire, neutral expression, facing camera',
  outputPath: 'projects/{name}/assets/character-main.png',
  aspectRatio: '1:1'
});

// Step 2: Use keyframe for ALL subsequent generations
const video = await generateSpeakingVideoFromImage({
  referenceImagePath: 'projects/{name}/assets/character-main.png',
  ...
});
```

### Reference Priority

When multiple assets exist:
1. **Character image** (if content has person) → Character consistency
2. **Product image** (if product-focused) → Product consistency

**NOTE:** API supports ONE reference image per request. For both character AND product:
- Use character reference for generation
- Describe product in the prompt

---

## PROMPT TEMPLATES BY CONTENT TYPE

### Product Shot Prompts
```
[Product] in [environment], [lighting style],
[camera angle], professional product photography,
[mood/style] aesthetic
```

**Example:**
```
Apple Watch on wrist, modern minimalist home office,
soft natural window light, close-up shot,
premium lifestyle photography, clean aesthetic
```

### Testimonial/UGC Video Prompts
```
[Character description] in [environment],
[action - looking at camera, speaking],
[lighting], authentic UGC style,
[emotion/energy level]
```

**Example:**
```
Professional woman in her 30s, dark hair, casual outfit,
modern apartment living room, speaking directly to camera,
warm natural lighting, authentic and relatable,
enthusiastic but genuine energy
```

### B-Roll/Ambient Video Prompts
```
[Cinematic/Documentary] shot of [subject],
[camera movement], [lighting],
[mood], no people speaking
```

**Example:**
```
Cinematic slow-motion shot of smartwatch display,
gentle rotation, studio lighting with soft shadows,
premium tech aesthetic, smooth camera movement
```

### Lifestyle Scene Prompts
```
[Person description] [doing activity] with [product],
[environment], [time of day/lighting],
[mood/energy], natural and authentic
```

**Example:**
```
Active woman in her 20s jogging in urban park,
checking Apple Watch mid-run, early morning golden light,
energetic and healthy lifestyle, candid moment
```

### Product Demo Prompts
```
Close-up of [product feature/screen],
[what's being shown - without text],
[lighting], [camera movement],
clean product demonstration style
```

**Example:**
```
Close-up of Apple Watch screen showing heart rate,
finger tapping to navigate, soft studio lighting,
slow zoom in, clean tech demo aesthetic
```

### Transformation/Before-After Prompts
```
[Scene 1 description - the problem/before state]
[Scene 2 description - the solution/after state]
[Visual contrast], [lighting shift], [mood change]
```

**Example:**
```
Scene 1: Person looking stressed checking phone repeatedly,
cluttered desk, harsh overhead lighting, anxious energy

Scene 2: Same person relaxed, glancing at watch confidently,
organized space, warm natural light, calm and in control
```

---

## PROMPTS FOR DIFFERENT AD STYLES

### Hook/Attention Grabber (First 3 seconds)
```
[Dramatic/surprising visual], [bold camera move],
high contrast, [immediate visual interest],
fast-paced energy, eye-catching
```

**Example:**
```
Extreme close-up of heart rate spiking on watch screen,
quick zoom out to reveal worried expression,
high contrast dramatic lighting, urgent energy
```

### Problem-Agitation Scene
```
[Person experiencing pain point], [frustrated expression],
[environment showing the problem], [tense mood],
relatable struggle, authentic emotion
```

**Example:**
```
Person anxiously checking phone at 3am unable to sleep,
dark bedroom lit only by phone glow, tired and frustrated,
bags under eyes, tangled in blankets, restless energy
```

### Solution/Product Scene
```
[Person using product with relief/joy], [positive transformation],
[brighter lighting], [confident body language],
aspirational but authentic, problem solved
```

**Example:**
```
Same person sleeping peacefully, watch on nightstand,
soft morning light beginning to fill room,
calm breathing, relaxed posture, peaceful atmosphere
```

### Social Proof Scene
```
[Real-looking person - not model-perfect],
[natural environment - home/office/outdoors],
[genuine expression while using product],
authentic UGC aesthetic, not overly polished
```

### Call-to-Action Scene
```
[Product hero shot], [premium presentation],
[clean background], [professional lighting],
final memorable image, brand moment
```

---

## CHARACTER DESCRIPTION TEMPLATES

### For Speaking Videos

**Professional/Expert:**
```
[Gender] professional in [age range], [ethnicity],
[hair description], wearing [business casual/formal attire],
[distinguishing features], confident and approachable
```

**Everyday Person (UGC style):**
```
Relatable [gender] in [age range], [natural appearance],
[casual everyday clothing], [setting-appropriate look],
genuine and authentic, not model-perfect
```

**Fitness/Active:**
```
Athletic [gender] in [age range], [fit appearance],
[workout attire], [activity-appropriate accessories],
energetic and healthy, post-workout glow
```

---

## VOICE DESCRIPTION TEMPLATES

### For Speaking Videos (Veo generates audio)

**Professional/Expert:**
```
confident [gender] voice, [age range], [accent if relevant],
clear articulation, warm but authoritative,
natural conversational pace
```

**Friendly/Relatable:**
```
warm friendly [gender] voice, [age range],
conversational and genuine, slight smile in voice,
relatable energy, like talking to a friend
```

**Energetic/Enthusiastic:**
```
upbeat [gender] voice, [age range],
enthusiastic but not over-the-top,
natural excitement, engaging energy
```

---

## ENVIRONMENT TEMPLATES

**Home Settings:**
- Modern minimalist apartment, clean lines, neutral colors
- Cozy living room, warm textures, personal touches
- Bright kitchen, natural light, lifestyle setting

**Work Settings:**
- Modern office, glass and wood, professional atmosphere
- Home office, organized desk, work-from-home vibe
- Co-working space, dynamic energy, creative environment

**Outdoor Settings:**
- Urban park, morning light, active lifestyle
- City street, golden hour, dynamic movement
- Nature trail, dappled sunlight, peaceful energy

**Fitness Settings:**
- Modern gym, equipment visible, motivated atmosphere
- Home workout space, yoga mat, personal fitness
- Running path, early morning, active energy

---

## Quick Reference

| # | Workflow | Input | Output | Function |
|---|----------|-------|--------|----------|
| 1 | `text-to-text` | Text | Text | `generateText()` |
| 2 | `image-to-text` | Text + Image | Text | `analyzeImage()` |
| 3 | `text-to-image` | Text | Single Image | `generateSingleImage()` |
| 4 | `image-to-image` | Text + Image | Single Image | `generateImageVariation()` |
| 5 | `text-to-carousel` | Text | Multiple Images | `generateCarousel()` |
| 6 | `image-to-carousel` | Text + Image | Multiple Images | `generateCarouselFromRef()` |
| 7 | `text-to-video-silent` | Text | Video (no audio) | `generateSilentVideo()` |
| 8 | `text-to-video-speaking` | Text | Video (character speaks) | `generateSpeakingVideo()` |
| 9 | `image-to-video-silent` | Text + Image | Video (no audio) | `generateVideoFromImage()` |
| 10 | `image-to-video-speaking` | Text + Image | Video (character speaks) | `generateSpeakingVideoFromImage()` |
| 11 | `text-to-video-voiceover` | Text | Video + TTS | `generateVideoWithVoiceover()` |
| 12 | `image-to-video-voiceover` | Text + Image | Video + TTS | `generateVideoFromImageWithVoiceover()` |
| 13 | `text-to-voiceover` | Text | Voiceover audio (.wav) | `generateVoiceover()` |
| 14 | `text-to-dialogue` | Text | Multi-speaker audio (.wav) | `generateMultiSpeakerVoiceover()` |
| 15 | `text-to-music` | Text | Music track (.wav) | `generateMusicTrack()` |
| 16 | `character-sheet` | Text | ONE model-sheet image (turnaround + face close-up + half-body + detail crops, labeled); `layout:'per-angle'` for legacy separate files | `generateCharacterSheet()` |
| 17 | `mix-audio` | Video + VO/music | Video with mixed audio | `mixVideoAudio()` |
| 18 | `captions` | Script/cues | Subtitle file (.srt) | `generateCaptions()` |
| 19 | `assemble-final` | Clips + VO + music + captions (+ optional xfade transitions) | Final video | `assembleFinal()` |
| 20 | `image-options` | Text | N cheap candidates | `generateImageOptions()` |
| 21 | `finalize-image` | Chosen preview | Full-res image | `finalizeImage()` |
| 22 | `storyboard` | Scenes | Keyframe per scene | `generateStoryboard()` |
| 23 | `hooks` | Topic | Scroll-stopping hooks | `generateHooks()` |
| 24 | `script` | Brief + framework | Structured script | `generateScript()` |
| 25 | `caption` | Topic + platform | Captions + hashtags | `generateCaption()` |
| 26 | `qa-review` | Image + brand rules | Pass/fail QA report | `reviewOutput()` |
| 27 | `render-slide` | Text-free bg + copy | Typeset 1080x1350 slide | `renderSlideStill()` |
| 28 | `render-kinetic-reel` | Text-free bgs + copy + VO | 9:16 kinetic typography reel | `renderKineticReel()` |
| 29 | `assemble-story-film` | Scene clips + per-scene VO + logo | Multi-scene cinematic cut | `assembleStoryFilm()` |
| 30 | `review-video` | Generated video + brand rules | Frame-sampled pass/fail QA | `reviewVideoOutput()` |
| 31 | `omni-video` | Text / 1-5 ref images / input video | ~10s clip via Gemini Omni Flash — 4 tasks (text/image/reference/edit), 10 art-style presets | `generateOmniVideoClip()` |
| 32 | `analyze-reference-video` | YouTube URL or local video | Scene-by-scene breakdown + recreation blueprint (json + 2× md) | `analyzeReferenceVideo()` |

### Seedance 2.0 Workflows (Native Audio, Lip-Sync, Multi-Reference)

| # | Workflow | Input | Output | Function |
|---|----------|-------|--------|----------|
| S1 | `seedance-text-to-video` | Text + audio config | Video with dialogue/SFX/music | `seedanceTextToVideo()` |
| S2 | `seedance-image-to-video` | Image(s) + text | Video with character/product consistency | `seedanceImageToVideo()` |
| S3 | `seedance-speaking-video` | Image + dialogue | Lip-synced video | `seedanceSpeakingVideo()` |
| S4 | `seedance-multi-shot` | Shots array + transitions | Multi-clip narrative video | `seedanceMultiShotVideo()` |
| S5 | `seedance-multi-ref` | Images + videos + audio refs | Video using all references | `seedanceMultiRefVideo()` |

### Manifest Workflows (generation audit trail, local, $0)

| # | Workflow | Input | Output | Function |
|---|----------|-------|--------|----------|
| M1 | `create-manifest` | projectName + outputDir (+ context) | `manifest.json` path | `createGenerationManifest()` |
| M2 | `add-manifest-entry` | manifestPath + entry | Updated `manifest.json` | `addManifestEntry()` |
| M3 | `load-manifest` | manifestPath | Parsed manifest (or null) | `loadManifest()` |
| M4 | `manifest-report` | manifestPath | Markdown report string | `generateManifestReport()` |
| M5 | `save-manifest-report` | manifestPath | `manifest-report.md` path | `saveManifestReport()` |

---

## How to Use Workflows

```typescript
import {
  generateCarousel,
  generateVideoWithVoiceover,
  generateSpeakingVideo
} from '../../workflows/index.js';

// Example: Generate a carousel
const result = await generateCarousel({
  projectName: 'smart-watch-apple',
  topic: 'Apple Watch health features',
  slideCount: 5,
  style: 'educational',
  platform: 'instagram'
});

// Example: Generate video with voiceover
const video = await generateVideoWithVoiceover({
  projectName: 'smart-watch-apple',
  scenes: [
    { description: 'Woman looking at Apple Watch', duration: 6 },
    { description: 'Close-up of heart rate monitor', duration: 4 }
  ],
  voiceoverScript: 'Your Apple Watch monitors your health 24/7.',
  voiceName: 'Kore',
  platform: 'tiktok'
});
```

---

## Workflow Details

### 1. Text to Text (`text-to-text`)

**Use for:** Scripts, captions, hooks, ad copy, content planning

```typescript
import { generateText } from '../../workflows/index.js';

const result = await generateText({
  prompt: 'Write a TikTok hook for Apple Watch health features',
  systemPrompt: 'You are a social media copywriter',
  model: 'gemini-2.5-flash' // optional
});

// Output: { success: true, data: { text: '...', cost: {...} } }
```

---

### 2. Image to Text (`image-to-text`)

**Use for:** Analyze product photos, describe scenes, extract info from images

```typescript
import { analyzeImage } from '../../workflows/index.js';

const result = await analyzeImage({
  imagePath: 'projects/my-project/assets/product.png',
  prompt: 'Describe this product in detail for ad copy',
  systemPrompt: 'You are a product marketing expert'
});

// Output: { success: true, data: { text: '...', cost: {...} } }
```

---

### 3. Text to Image (`text-to-image`)

**Use for:** Thumbnails, single promotional images, hero images

```typescript
import { generateSingleImage } from '../../workflows/index.js';

const result = await generateSingleImage({
  prompt: 'Professional woman checking Apple Watch, modern office, soft lighting',
  outputPath: 'projects/my-project/output-contents/thumbnail.png',
  aspectRatio: '9:16',
  imageSize: '1K'
});

// Output: { success: true, data: { imagePath: '...', cost: {...} } }
```

`imageModel` (optional, also on `generateImageVariation`):
- `'flash'` (default) — Gemini 3.1 Flash Image, $0.045–0.15/image
- `'pro'` — Gemini 3 Pro Image (Nano Banana Pro), $0.134 — best text rendering
- `'lite'` — Gemini 3.1 Flash Lite Image (Nano Banana 2 Lite), $0.0336 flat — cheapest, for bulk/preview work

---

### 4. Image to Image (`image-to-image`)

**Use for:** Product variations, style transfer, character in different scenes

```typescript
import { generateImageVariation } from '../../workflows/index.js';

const result = await generateImageVariation({
  referenceImagePath: 'projects/my-project/assets/product.png',
  prompt: 'Same product but in a gym setting with dramatic lighting',
  outputPath: 'projects/my-project/output-contents/variation.png',
  aspectRatio: '1:1'
});

// E-commerce product shot: productShot preset (26 ids — PRODUCT-SHOT-GUIDE.md)
// supplies scene + lighting + fidelity clause; prompt carries only specifics
const packshot = await generateImageVariation({
  referenceImagePath: 'projects/my-project/assets/products/prod-main.png',
  productShot: 'pure-white-packshot',
  prompt: 'The ceramic honey jar with the gold lid.',
  outputPath: 'projects/my-project/output-contents/packshot.png',
  aspectRatio: '1:1', imageSize: '2K'
});

// Multi-reference (max 5 total): production sheets, style refs — describe
// each image's role in the prompt (powers the storyboard step of
// recipes/story-short-film.md)
const board = await generateImageVariation({
  referenceImagePaths: ['assets/characters/char-lila-sheet.png', 'assets/backgrounds/loc-garden-sheet.png'],
  prompt: '12-panel cinematic storyboard… must match the reference sheets exactly in every panel…',
  outputPath: 'projects/my-project/output-contents/storyboard.png',
  aspectRatio: '16:9', imageSize: '2K'
});

// Output: { success: true, data: { imagePath: '...', cost: {...} } }
```

---

### 5. Text to Carousel (`text-to-carousel`)

**Use for:** Instagram carousels, educational slides, product showcases

**Styles:** `educational`, `product-showcase`, `story`, `testimonial`, `comparison`, `stats`

```typescript
import { generateCarousel } from '../../workflows/index.js';

const result = await generateCarousel({
  projectName: 'smart-watch-apple',
  topic: '5 Apple Watch features that could save your life',
  slideCount: 5,
  style: 'educational',
  platform: 'instagram',
  outputDir: 'projects/smart-watch-apple/output-contents/carousel-01'
});

// Output: { success: true, data: { imagePaths: [...], cost: {...} } }
```

---

### 6. Image to Carousel (`image-to-carousel`)

**Use for:** Product carousel with reference, character-based slides

```typescript
import { generateCarouselFromRef } from '../../workflows/index.js';

const result = await generateCarouselFromRef({
  projectName: 'smart-watch-apple',
  referenceImagePath: 'projects/smart-watch-apple/assets/product.png',
  topic: 'Apple Watch in different settings',
  slideCount: 4,
  style: 'product-showcase',
  platform: 'instagram',
  outputDir: 'projects/smart-watch-apple/output-contents/carousel-02'
});

// Output: { success: true, data: { imagePaths: [...], cost: {...} } }
```

---

### 7. Text to Video Silent (`text-to-video-silent`)

**Use for:** B-roll, ambient video, video to add audio later

```typescript
import { generateSilentVideo } from '../../workflows/index.js';

const result = await generateSilentVideo({
  prompt: 'Cinematic shot of smartwatch on wrist, golden hour lighting',
  outputPath: 'projects/my-project/output-contents/video.mp4',
  duration: 6,
  aspectRatio: '9:16',
  quality: 'fast', // 'lite', 'fast', 'standard'
  cameraMove: 'slow-zoom-in' // optional preset — full four-part block prepended (46 ids, VIDEO-PROMPT-GUIDE §2b)
});

// Output: { success: true, data: { videoPath: '...', cost: {...} } }
```

---

### 8. Text to Video Speaking (`text-to-video-speaking`)

**Use for:** Testimonials, UGC, talking head content

```typescript
import { generateSpeakingVideo } from '../../workflows/index.js';

const result = await generateSpeakingVideo({
  characterDescription: 'Professional woman in her 30s, dark hair, wearing business casual',
  environment: 'Modern minimalist office with soft natural lighting',
  dialogue: 'This watch literally saved my life. The ECG feature detected an irregular heartbeat.',
  voiceDescription: 'warm, authentic female voice, early 30s, American accent',
  outputPath: 'projects/my-project/output-contents/testimonial.mp4',
  duration: 8,
  aspectRatio: '9:16'
});

// Output: { success: true, data: { videoPath: '...', cost: {...} } }
```

---

### 9. Image to Video Silent (`image-to-video-silent`)

**Use for:** Product video from photo, consistent character video

```typescript
import { generateVideoFromImage } from '../../workflows/index.js';

const result = await generateVideoFromImage({
  referenceImagePath: 'projects/my-project/assets/product.png',   // first frame
  prompt: 'The smartwatch rotates slowly, light catches the screen, premium feel',
  outputPath: 'projects/my-project/output-contents/product-video.mp4',
  duration: 6,
  aspectRatio: '9:16',
  cameraMove: 'orbit-clockwise' // optional preset (46 ids, VIDEO-PROMPT-GUIDE §2b)
});

// Multi-reference consistency (Veo 3.1 asset refs, max 3): character sheet +
// environment sheet + prop in ONE clip. State each ref's role in the prompt.
// 4-5 refs → generateOmniVideoClip. See recipes/story-short-film.md.
const scene = await generateVideoFromImage({
  referenceImagePaths: [
    'assets/characters/char-lila-sheet.png',
    'assets/backgrounds/loc-garden-sheet.png',
    'assets/products/prop-ball-sheet.png',
  ],
  prompt: 'The girl from the character sheet chases the ball from the prop reference across the garden from the environment reference. Golden afternoon light.',
  cameraMove: 'tracking',
  outputPath: 'projects/my-project/output-contents/scene-02.mp4',
  duration: 8, aspectRatio: '16:9'
});

// Output: { success: true, data: { videoPath: '...', cost: {...} } }
```

---

### 10. Image to Video Speaking (`image-to-video-speaking`)

**Use for:** Consistent character testimonial, branded spokesperson

```typescript
import { generateSpeakingVideoFromImage } from '../../workflows/index.js';

const result = await generateSpeakingVideoFromImage({
  referenceImagePath: 'projects/my-project/assets/character.png',
  environment: 'Same modern office setting',
  dialogue: 'I check my heart rate every morning now. It gives me peace of mind.',
  voiceDescription: 'same warm female voice, conversational',
  outputPath: 'projects/my-project/output-contents/testimonial-02.mp4',
  duration: 6,
  aspectRatio: '9:16'
});

// Output: { success: true, data: { videoPath: '...', cost: {...} } }
```

---

### 11. Text to Video with Voiceover (`text-to-video-voiceover`)

**Use for:** Explainers, tutorials, product demos with narration

```typescript
import { generateVideoWithVoiceover } from '../../workflows/index.js';

const result = await generateVideoWithVoiceover({
  scenes: [
    { prompt: 'Woman looking at Apple Watch health notification', duration: 4 },
    { prompt: 'Close-up of ECG reading on watch screen', duration: 3 },
    { prompt: 'Woman smiling with relief', duration: 3 }
  ],
  voiceoverScript: 'Your Apple Watch monitors your heart 24/7. ECG. Blood oxygen. Sleep tracking. Health features that work while you live your life.',
  voiceName: 'Kore',
  voiceStyle: { style: 'professional', pace: 'natural' },
  outputDir: 'projects/my-project/output-contents/explainer',
  aspectRatio: '9:16',
  quality: 'fast'
});

// Output: { success: true, data: { finalVideoPath: '...', cost: {...} } }
```

---

### 12. Image to Video with Voiceover (`image-to-video-voiceover`)

**Use for:** Product explainer from photo, consistent visuals with narration

```typescript
import { generateVideoFromImageWithVoiceover } from '../../workflows/index.js';

const result = await generateVideoFromImageWithVoiceover({
  referenceImagePath: 'projects/my-project/assets/product.png',
  scenes: [
    { prompt: 'Product hero shot, slowly rotating', duration: 4 },
    { prompt: 'Close-up of screen showing health metrics', duration: 3 },
    { prompt: 'Product on wrist, lifestyle shot', duration: 3 }
  ],
  voiceoverScript: 'Introducing the future of health monitoring. Always on. Always watching out for you.',
  voiceName: 'Charon',
  voiceStyle: { style: 'promo_hype', pace: 'energetic' },
  outputDir: 'projects/my-project/output-contents/product-ad',
  aspectRatio: '9:16'
});

// Output: { success: true, data: { finalVideoPath: '...', cost: {...} } }
```

---

## Carousel Styles Reference

| Style | Best For | Visual Approach |
|-------|----------|-----------------|
| `educational` | Tips, how-to, listicles | Clean, minimal, text-focused |
| `product-showcase` | Features, benefits | Product center, feature callouts |
| `story` | Narrative, journey | Scene progression, emotional |
| `testimonial` | Social proof | Quote + person, authentic |
| `comparison` | Before/after, vs | Split layout, contrast |
| `stats` | Numbers, data | Bold numbers, minimal text |

---

## Voice Options Reference

**Professional voices:** Kore, Charon, Orus, Fenrir
**Friendly voices:** Zephyr, Puck, Aoede, Leda
**Energetic voices:** Perseus, Calliope, Proteus
**Calm voices:** Autonoe, Despina, Aura
**Deep voices:** Helios, Titan
**Soft voices:** Narcissus, Selene, Vesper

(All above = Gemini `generateVoiceover`.) **Free (Edge TTS `generateEdgeTTSVoiceover`):**
`my-male` (my-MM-ThihaNeural), `my-female` (my-MM-NilarNeural), `en-male`, `en-female`,
or any `--list-voices` id — no styles, but `rate`/`volume`/`pitch` + $0.

---

## Cost Reference

| Operation | Model | Cost |
|-----------|-------|------|
| Text generation | gemini-2.5-flash | ~$0.001/request |
| Image generation | gemini-3.1-flash-image | $0.045-0.15/image |
| Image (cheapest) | gemini-3.1-flash-lite-image | $0.0336/image (flat) |
| Image (best text) | gemini-3-pro-image | $0.134-0.24/image |
| Video (lite) | veo-3.1-lite | $0.03/sec |
| Video (fast) | veo-3.1-fast | $0.08/sec |
| Video (standard) | veo-3.1 | $0.20/sec |
| TTS | gemini-2.5-flash-tts | ~$0.001/request |
| TTS (free) | Microsoft Edge TTS (`generateEdgeTTSVoiceover`) | $0 (no key) |

---

## Platform Specs

| Platform | Aspect Ratio | Duration |
|----------|--------------|----------|
| TikTok | 9:16 | 15-60s |
| Instagram Reels | 9:16 | 15-90s |
| Instagram Carousel | 1:1 or 4:5 | N/A |
| YouTube Shorts | 9:16 | 15-60s |
| YouTube | 16:9 | 60s+ |
| Facebook | 1:1 or 16:9 | 15-120s |

---

## Seedance 2.0 Workflows

Seedance 2.0 is ByteDance's multimodal AI video generation model with native audio
generation (dialogue with lip-sync, SFX, music), multimodal references, and advanced
character consistency.

All five commands run via the CLI like everything else (**requires
OPENROUTER_API_KEY**; budget-gated + auto-ledgered):

```bash
node workflows/cli.cjs seedanceSpeakingVideo @args.json
```

### When to Use Seedance vs Veo

| Feature | Seedance 2.0 | Veo |
|---------|--------------|-----|
| Lip-synced dialogue | ✅ Native | ❌ No |
| Integrated SFX + music | ✅ Native | ❌ Post-production |
| Multimodal refs (up to 12) | ✅ @image/@video/@audio | ✅ Single image ref |
| Duration | 4-15s | 1-60s |
| Aspect ratios | 6 options | 3 options |
| Simple B-roll | Either works | ✅ Faster |

### Seedance Quick Reference

| # | Workflow | Input | Output | Function |
|---|----------|-------|--------|----------|
| S1 | Text → Video with Audio | Text + audio config | Video with dialogue/SFX/music | `seedanceTextToVideo()` |
| S2 | Image → Video | Image(s) + text | Video with character/product consistency | `seedanceImageToVideo()` |
| S3 | Speaking Video | Image + dialogue | Lip-synced video | `seedanceSpeakingVideo()` |
| S4 | Multi-Shot | Shots array | Multi-clip video | `seedanceMultiShotVideo()` |
| S5 | Multi-Reference | Images + videos + audio | Video using all refs | `seedanceMultiRefVideo()` |

---

### S1. Seedance Text to Video

**Use for:** Video with integrated audio (dialogue, SFX, music)

```bash
node workflows/cli.cjs seedanceTextToVideo '{
  "subject": "A confident woman in her late 20s with dark shoulder-length hair",
  "action": "strides through a rain-soaked neon-lit street",
  "environment": "Tokyo alley at night, reflections on wet pavement",
  "camera": {
    "movement": "tracking",
    "speed": "smooth",
    "shotType": "medium",
    "angle": "eye-level"
  },
  "style": {
    "lighting": "neon-colored",
    "style": "cinematic",
    "atmosphere": ["rain particles", "neon reflections"]
  },
  "audio": {
    "sfx": ["rain on pavement", "distant city ambience"],
    "music": "atmospheric synthwave, mysterious mood"
  },
  "constraints": {
    "avoidJitter": true,
    "avoidIdentityDrift": true
  },
  "outputPath": "output/scene.mp4",
  "duration": 8,
  "aspectRatio": "9:16"
}'
```

---

### S2. Seedance Image to Video

**Use for:** Character/product consistency from reference image(s)

```bash
# Single character reference
node workflows/cli.cjs seedanceImageToVideo '{
  "referenceImages": "assets/character-front.png",
  "referenceType": "character",
  "prompt": "walks through a bustling market, looking around curiously",
  "camera": { "movement": "tracking", "shotType": "medium" },
  "audio": { "sfx": ["crowd chatter", "footsteps on stone"] },
  "outputPath": "output/character-scene.mp4",
  "duration": 8
}'

# Multi-angle product reference
node workflows/cli.cjs seedanceImageToVideo '{
  "referenceImages": ["assets/product-front.png", "assets/product-side.png"],
  "referenceType": "multi-angle",
  "prompt": "rotates slowly on display pedestal with dramatic spotlight",
  "camera": { "movement": "orbit", "speed": "slow" },
  "style": { "lighting": "studio" },
  "outputPath": "output/product-360.mp4",
  "duration": 10
}'
```

---

### S3. Seedance Speaking Video (Lip-Sync)

**Use for:** Character speaking dialogue with natural lip-sync

**Best practices:**
- Use high-res, front-facing character reference
- Keep dialogue under 8 seconds for best quality
- Use close-up or medium close-up shots
- Lock camera (no movement) during dialogue

```bash
node workflows/cli.cjs seedanceSpeakingVideo '{
  "characterImagePath": "assets/character-front.png",
  "environment": "Modern office, soft natural lighting from window",
  "dialogue": "This product changed my life. I use it every single day.",
  "dialogueTone": "speaks warmly",
  "audio": {
    "sfx": ["subtle room ambience"],
    "music": "no music"
  },
  "camera": {
    "shotType": "close-up",
    "movement": "fixed",
    "angle": "eye-level"
  },
  "outputPath": "output/testimonial.mp4",
  "duration": 8,
  "aspectRatio": "9:16"
}'
```

(`"music": "no music"` keeps the dialogue clean; `close-up` + `fixed` camera give the
best lip-sync.)

**Dialogue Tones:**
- `whispers` - Intimate, soft delivery
- `speaks calmly` - Natural, conversational
- `speaks urgently` - Faster, tense
- `shouts` - Loud, emphatic
- `speaks warmly` - Friendly, inviting

---

### S4. Seedance Multi-Shot Video

**Use for:** Multi-scene narratives with consistent character and transitions

```bash
node workflows/cli.cjs seedanceMultiShotVideo '{
  "characterImagePath": "assets/character.png",
  "shots": [
    {
      "order": 1,
      "duration": 4,
      "prompt": "enters the dimly lit room cautiously",
      "camera": { "shotType": "wide", "movement": "push-in", "speed": "slow" },
      "audio": { "sfx": ["door creaking", "footsteps on wood"] },
      "transitionTo": "hard-cut"
    },
    {
      "order": 2,
      "duration": 4,
      "prompt": "walks toward the desk, eyes scanning",
      "camera": { "shotType": "medium", "movement": "tracking" },
      "audio": { "sfx": ["subtle tension ambience"] },
      "transitionTo": "dissolve"
    },
    {
      "order": 3,
      "duration": 4,
      "prompt": "picks up the phone, expression changes to worry",
      "camera": { "shotType": "close-up", "movement": "fixed" },
      "audio": {
        "dialogue": "What have I done...",
        "dialogueTone": "whispers"
      }
    }
  ],
  "style": {
    "lighting": "dramatic-rim",
    "style": "cinematic",
    "quality": ["35mm film quality", "heavy shadows"]
  },
  "constraints": {
    "avoidIdentityDrift": true
  },
  "outputDir": "output/multi-shot",
  "concatenate": true,
  "aspectRatio": "16:9"
}'

# Output: shot-01.mp4, shot-02.mp4, shot-03.mp4, final.mp4 ("concatenate": true)
```

**Transition Types:**
- `hard-cut` - Instant cut to next shot
- `dissolve` - Cross-dissolve blend
- `whip-pan` - Fast camera whip
- `push-through` - Camera pushes through subject
- `match-cut` - Match visual element
- `fade` - Fade to/from black

---

### S5. Seedance Multi-Reference Video

**Use for:** Combining multiple references (character + style + audio sync)

**Limits:** 9 images + 3 videos + 3 audio = 12 total references

```bash
node workflows/cli.cjs seedanceMultiRefVideo '{
  "references": [
    {
      "path": "assets/character.png",
      "type": "image",
      "purpose": "character"
    },
    {
      "path": "assets/outfit-reference.png",
      "type": "image",
      "purpose": "style",
      "instruction": "Use the outfit and colors from @image2"
    },
    {
      "path": "assets/environment.png",
      "type": "image",
      "purpose": "environment"
    },
    {
      "path": "assets/beat.mp3",
      "type": "audio",
      "purpose": "audio-sync"
    }
  ],
  "prompt": "Character dances energetically to the beat in a neon-lit club",
  "camera": {
    "movement": "orbit",
    "speed": "dynamic",
    "shotType": "medium"
  },
  "style": {
    "lighting": "neon-colored",
    "atmosphere": ["strobing lights", "crowd silhouettes"]
  },
  "outputPath": "output/dance-scene.mp4",
  "duration": 12,
  "aspectRatio": "9:16"
}'
```

**Reference Purposes:**
| Purpose | Use For |
|---------|---------|
| `character` | Lock character appearance from image |
| `product` | Lock product appearance |
| `style` | Copy visual aesthetic |
| `environment` | Use as scene background |
| `action` | Copy motion from video ref |
| `camera` | Copy camera movement from video |
| `audio-sync` | Sync to audio rhythm/beat |

---

### Seedance Audio Configuration

**Three audio layers (can be combined):**

```typescript
audio: {
  // Layer 1: Character speech (lip-synced)
  dialogue: 'The moment has finally arrived.',
  dialogueTone: 'speaks warmly',

  // Layer 2: Sound effects (describe source + surface)
  sfx: [
    'boots on wet cobblestone',
    'distant thunder rumbling',
    'rain hitting umbrella',
  ],

  // Layer 3: Background music
  music: 'tense orchestral underscore, building intensity',
  // Or suppress: music: 'no music',

  // Mix priority
  audioPriority: 'dialogue', // 'dialogue' | 'sfx' | 'music' | 'balanced'
}
```

**SFX Best Practice:** Describe source AND surface:
- ✅ `'boots on wet cobblestone'` (specific)
- ✅ `'glass shattering on concrete floor'`
- ❌ `'footsteps'` (too vague)

---

### Seedance Camera Configuration

```typescript
camera: {
  // Primary movement (ONE per prompt)
  movement: 'tracking', // 'push-in' | 'pull-out' | 'pan' | 'tracking' | 'orbit' | 'aerial' | 'handheld' | 'fixed'

  // Movement speed
  speed: 'smooth', // 'slow' | 'gentle' | 'smooth' | 'dynamic' | 'rapid'

  // Shot type
  shotType: 'medium', // 'wide' | 'establishing' | 'medium' | 'close-up' | 'extreme-close-up' | 'pov'

  // Camera angle
  angle: 'eye-level', // 'eye-level' | 'low-angle' | 'high-angle' | 'dutch' | 'birds-eye' | 'three-quarter'

  // Lens feel
  lens: 'shallow-dof', // 'wide-angle' | 'normal' | 'telephoto' | 'shallow-dof' | 'deep-focus'
}
```

---

### Seedance Style Configuration

```typescript
style: {
  // Overall visual style
  style: 'cinematic', // 'cinematic' | 'documentary' | 'commercial' | 'editorial' | 'retro-film' | 'futuristic'

  // Lighting setup
  lighting: 'golden-hour', // 'golden-hour' | 'dramatic-rim' | 'soft-diffused' | 'neon-colored' | 'volumetric' | 'practical' | 'studio'

  // Atmosphere effects
  atmosphere: ['dust in the air', 'volumetric fog'],

  // Technical quality anchors
  quality: ['35mm film quality', 'ARRI ALEXA aesthetic', 'heavy film grain'],
}
```

---

### Seedance Constraints

```typescript
constraints: {
  avoidJitter: true,           // Prevent screen shaking
  avoidBentLimbs: true,        // Prevent distorted limbs
  avoidTemporalFlicker: true,  // For 5+ second videos
  avoidIdentityDrift: true,    // Maintain character appearance

  // Custom constraints
  custom: ['no cuts', 'no zoom', 'natural head movement'],
}
```

---

### Seedance Cost Reference

| Operation | Duration | Est. Cost |
|-----------|----------|-----------|
| Text to video (4s) | 4s | ~$0.32 |
| Text to video (8s) | 8s | ~$0.64 |
| Text to video (15s) | 15s | ~$1.20 |
| Image to video (8s) | 8s | ~$0.70 |
| Speaking video (8s) | 8s | ~$0.75 |
| Multi-shot (3 shots) | 12s | ~$1.00 |

*Note: Costs are estimates based on current Veo pricing. Actual Seedance API pricing may vary.*
