---
name: generate-music
description: Generate music using Gemini Lyria. Use for background music, jingles, intros, soundtracks, and complete songs WITH sung vocals — Lyria 3 sings your exact lyrics (8 languages, rap/sung delivery).
allowed-tools: Bash Read Write Edit
---

# Generate Music

## How to run it (IMPORTANT) — CALL THE CLI, DON'T WRITE A SCRIPT

**Do NOT create a `projects/{name}/scripts/*.ts` file. Run the workflow command:**

```bash
node workflows/cli.cjs generateMusicTrack \
  '{"prompt":"...","outputPath":"projects/{name}/output-contents/track.wav","duration":30}'
```

The CLI loads `.env` for you and prints the JSON result (path + cost). Other commands
you may chain: `mixVideoAudio`, and the asset helpers `loadAssetConfig` / `resolveAsset` /
`registerAsset` (pass positional args as a JSON array, e.g. `loadAssetConfig '["myproject"]'`).
Argument shapes are in `workflows/WORKFLOWS.md`.

**Output Location:** `projects/{name}/output-contents/` (pass this as `outputPath` in the args)

---

## Step 1: Check Project & Ask Purpose

```
Does projects/{project-name}/ exist?
  YES → Read these files for context:
  NO  → Ask user directly
```

**First, check the registry for a reusable music bed** — don't regenerate the same track:

```bash
node workflows/cli.cjs loadAssetConfig '["{name}"]'
node workflows/cli.cjs resolveAsset '["{name}","music-main"]'   # existing project music bed? → { "existing": [ ... ] }
```
- Found → offer to reuse it (`bed.existing[0]`) instead of generating. Confirm with user.
- Not found → continue; you'll register the new track in Step 5.

**If project exists, READ and USE:**

From `projects/{name}/templates/project.md`:
- `product.name` → Context for what the music supports
- `audience.primary.age_range` → Age-appropriate music style

From `projects/{name}/templates/brand.md`:
- `tone.energy` → High/medium/calm → determines tempo
- `tone.voice` → Professional/casual → determines genre
- `visual.style` → Modern/classic → influences music style

**"What is this music for?"**

- Background for video
- Intro/outro jingle
- Podcast background
- Full song
- Ad music
- App/product sound

## Step 2: Ask Style Preferences

1. **Genre?**
   - Electronic / EDM
   - Ambient / Chill
   - Corporate / Professional
   - Cinematic / Epic
   - Pop / Upbeat
   - Jazz / Lounge
   - Acoustic / Folk
   - Hip-hop / Trap

2. **Mood?**
   - Upbeat / Energetic
   - Calm / Relaxing
   - Dramatic / Intense
   - Happy / Cheerful
   - Serious / Professional
   - Mysterious / Suspenseful

3. **Duration?**
   - Short clip (≤30s) → Use Lyria 3
   - Full song (≤3min) → Use Lyria 3 Pro

4. **Tempo?**
   - Slow
   - Medium
   - Fast

5. **Vocals or instrumental?** (Lyria 3 generates vocals BY DEFAULT)
   - Instrumental → say so EXPLICITLY in the prompt ("Fully instrumental, no vocals")
   - Sung vocals → see "Vocals & Lyrics" below; ask if the user has exact lyrics

## Step 3: Choose Model

| Model | Duration | Cost | Use For |
|-------|----------|------|---------|
| `lyria-3` | ≤30 seconds | $0.04 | Intros, outros, short clips, jingles |
| `lyria-3-pro` | ≤3 minutes | $0.08 | Full songs (incl. sung vocals + your lyrics), longer background music |

## Step 3b: Vocals & Lyrics (Lyria 3 can sing — complete songs)

**Lyria 3 generates vocals and lyrics BY DEFAULT.** It can sing your EXACT lyrics,
including rap delivery, backing vocals, and structured arrangements. Everything goes in
the `prompt` string — there is no separate lyrics parameter.

**How to provide exact lyrics** — prefix the lines with `Lyrics:` inside the prompt:

```
...style/instrumentation description... A confident male vocalist performs the verses
with a rhythmic rapping delivery. Structure: intro; verse one; INSTRUMENTAL chorus;
verse two; outro spoken line. Only the lines below are sung.

Lyrics (verse one, rapped):
<exact lines>

Lyrics (verse two, rapped):
<exact lines>
```

**Steer the voice**: gender, timbre/range ("smooth baritone", "breathy soprano"),
delivery ("rapping", "spoken"), and language. Mention where backing vocals should
echo the lead if wanted.

**Supported vocal languages (8)**: English, German, Spanish, French, Hindi, Japanese,
Korean, Portuguese. **Burmese/Myanmar is NOT officially supported — output is a
retry lottery**: one production run sang near-real Burmese (transcribed back as actual
Burmese script, close to the target lyrics), another gave pure vocalese/gibberish.
If the user wants MM vocals, attempts are cheap ($0.08) — generate, verify with
`transcribeAudio` + a native listen, retry if garbled. The guaranteed route is still:
generate MM sections INSTRUMENTAL (state it explicitly per section: "a fuller
INSTRUMENTAL chorus with no vocals where piano and strings carry the melody") and
overlay a real recording later.

**Instrumental-only tracks**: because vocals are the default, ALWAYS end background-music
prompts with "Fully instrumental, no vocals."

**Production-tested gotchas** (cost real money if missed):
1. **Genre labels trip the copyright filter** ("cinematic hip-hop", "boom-bap" →
   finishReason OTHER, surfaced as generic "No music was generated"). Describe
   instrumentation + mood + BPM instead; add "an original composition".
2. **`quality:"standard"` may 404** on some keys — use `quality:"pro"` (auto-falls back
   to `lyria-3-pro-preview`, same price).
3. **Output is mp3-in-a-fake-WAV-header** (malformed .wav, wrong ffprobe duration).
   Remux after every generation:
   `ffmpeg -f mp3 -i out.wav -c:a pcm_s16le fixed.wav`
4. **Verify vocals landed**: run `transcribeAudio` on the result (~$0.01) and diff
   against the locked lyrics before calling it done.

## Step 4: Build the Prompt (Apply Brand Context)

Combine user preferences with brand context:

```
[Genre matching brand.tone.voice] music with [instruments],
[mood matching brand.tone.energy] and [tempo] tempo,
[purpose/context],
[any specific elements]
```

**Map brand.tone to music:**
- `brand.tone.energy: "high"` → Fast tempo, energetic, upbeat
- `brand.tone.energy: "medium"` → Medium tempo, confident
- `brand.tone.energy: "calm"` → Slow tempo, relaxing
- `brand.tone.voice: "professional"` → Corporate, clean sound
- `brand.tone.voice: "casual"` → Pop, acoustic, friendly
- `brand.tone.voice: "bold"` → Cinematic, dramatic

**Examples:**

For tech product video (energetic brand):
```
Upbeat electronic music with synth leads and punchy drums,
energetic and modern, medium-fast tempo,
suitable for tech product showcase video,
building energy with drops
```

For wellness brand (calm brand):
```
Calm ambient music with soft piano and gentle synth pads,
relaxing and peaceful, slow tempo,
for wellness brand background,
minimal and spacious sound
```

For corporate/professional brand:
```
Professional corporate music with light acoustic guitar,
confident and optimistic, medium tempo,
for business presentation background,
subtle and non-distracting
```

## Step 4b: Suggest the setup and CONFIRM (do NOT auto-run)

Propose every choice with reasoning from `brand.md`, then show one summary and wait for go —
let the user change any field. Don't auto-generate.

```
🎵 MUSIC SETUP — confirm or adjust
  Purpose:   background for product video
  Genre:     upbeat electronic   (suggested — matches your "energetic" brand)
  Mood:      modern, confident
  Tempo:     medium-fast
  Length:    30s   → quality: standard (lyria-3, ~$0.04)
  Prompt:    "Upbeat electronic music with synth leads…"
  Output:    projects/{name}/output-contents/music.wav

Proceed, or change a field? (proceed / slower / longer / different genre …)
```

If the user says "just do it", still show this summary once and state the assumed defaults.

## Step 5: Generate Music

**Only after confirmation.** Use the pre-built workflow function — do NOT re-implement file
saving, retry, or cost handling. It validates input, enforces the duration limit per quality,
retries on transient errors, writes the `.wav`, and returns the cost.

```bash
# Short clip (standard = lyria-3, ≤30s) - ~$0.04
node workflows/cli.cjs generateMusicTrack '{"prompt":"Your music description here","outputPath":"projects/{name}/output-contents/music.wav","quality":"standard","durationSeconds":30}'
# → { "success": true, "data": { "audioPath": "...", "cost": { "totalCost": 0.04 } } }
# On failure → { "success": false, "error": { "code": "...", "message": "..." } }

# Full song (pro = lyria-3-pro, ≤180s) - ~$0.08
node workflows/cli.cjs generateMusicTrack '{"prompt":"Your music description here","outputPath":"projects/{name}/output-contents/song.wav","quality":"pro","durationSeconds":120}'

# On success, save the bed to the registry so it can be reused (ask if it should be the project bed)
node workflows/cli.cjs registerAsset '["{name}","music",{"id":"music-main","label":"Brand music bed","description":"Upbeat electronic, energetic, medium-fast","source":"generated","path":"assets/music/music-main.wav","duration_seconds":30},{"date":"<today ISO>"}]'   # copy the output .wav to path for reuse
```

> `registerAsset` is its own CLI command (positional JSON array args), same as `generateMusicTrack`.

## Step 6: Combine with Video (if needed)

Use the `mixVideoAudio` workflow — it handles the ffmpeg mix (music ducked under a
voiceover if one is provided) and returns a clean result:

```bash
node workflows/cli.cjs mixVideoAudio '{"videoPath":"projects/{name}/output-contents/video.mp4","musicPath":"projects/{name}/output-contents/music.wav","musicVolume":0.3,"outputPath":"projects/{name}/output-contents/final.mp4"}'
# omit voiceoverPath, or add "voiceoverPath":"..." to layer both (music auto-ducks); musicVolume is 0–1
```

For a full deliverable (multiple clips + VO + music + captions in one call) use
`assembleFinal()` — see `workflows/WORKFLOWS.md`.

## Step 7: Save Output

Save to: `projects/{name}/output-contents/` or current directory
- `music.wav`
- `music-prompt.txt` (keep the prompt for reference)

## Pipeline-first + audit trail (mandatory)

- Author `<content-id>.pipeline.json` IN the content folder BEFORE generating
  (nodes = CLI commands, `{{node.data.field}}` refs), then
  `node workflows/cli.cjs runPipeline @<file>` — see `workflows/pipelines/README.md`.
- The content folder gets a `prompts.txt` with the music prompt; update it on
  every retry with a one-line RESULT note.
- Log each generation via the `createGenerationManifest` / `addManifestEntry`
  CLI commands (AGENT-GUIDE Step 5).

## Cost Summary

- 30-second clip: $0.04
- 3-minute song: $0.08

## Tips

- Be specific about instruments
- Mention the context/purpose
- Describe the energy arc (building, steady, fading)
- For video, match music length to video duration
- Generate multiple versions and pick the best
- Vocals are ON by default — end background-music prompts with "Fully instrumental, no vocals"
- For complete songs, put exact lyrics in the prompt as `Lyrics:` blocks (Step 3b)
- Avoid genre labels (copyright filter); describe instrumentation + mood + BPM instead
