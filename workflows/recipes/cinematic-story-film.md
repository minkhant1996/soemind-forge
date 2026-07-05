# Recipe: Cinematic Story Film

**Goal:** a 30-45s narrative brand film — a character the audience follows through
setup → fall → turn → resolution, with cinematic Veo footage and emotionally
adaptive narration. The premium end of short-form: brand films, launch films,
founder-story ads.

**When to use:** "cinematic story", "brand film", "tell a story with a character",
"real story explaining the product".

**Prerequisites:** `/content-preflight` run; brand.md restrictions loaded; a locked
narrator voice in the registry. If the story features a REAL person, use only
provided photos — never generate their likeness; invent a fictional character
instead.

## Cost & time (fast tier, 4 scenes × 8s)

| Step | Cost |
|---|---|
| Character sheet (2 angles) | ~$0.13 |
| 4 keyframes | ~$0.27 |
| 4 Veo 3.1 fast clips (8s @ **$0.10/s**) | $3.20 |
| 4 adaptive VO segments | ~$0.02 |
| Assembly + packaging | $0 (local) |
| **Total** | **~$3.65** |

Standard tier is ~$0.20/s (double). Always `checkBudget` first, `recordCost` per step.

## The pipeline (every step is one CLI call)

### 0. WRITE the storyline first — show the user, get approval
Four-beat arc, one sentence of VO per scene (≤20 words each — must fit 8s):
1. **Setup** — the character's strength that is secretly the flaw
2. **Fall** — the consequence lands (show, don't narrate the lesson yet)
3. **Turn** — the behavior change (this is where the product's philosophy lives)
4. **Resolution** — quiet win + brand line

Show a scene table (visual + VO per scene) and total cost. **Wait for approval.**

### 1. Character sheet → register locked
```bash
node workflows/cli.cjs generateCharacterSheet '{"description":"<locked physical description: age, hair, glasses, wardrobe, build + cinematic palette>","outputDir":"projects/{name}/assets/characters","idStem":"char-<id>","angles":["front","three_quarter"],"aspectRatio":"9:16"}'
node workflows/cli.cjs registerAsset '["{name}","characters",{"id":"char-<id>",...,"locked":true,"files":{...}},{"date":"<iso>"}]'
```
QA the faces match between angles before continuing.

### 2. One keyframe per scene (character-consistent)
`generateImageVariation` with the character sheet as `referenceImagePath`; prompt =
"Cinematic film still, scene N: the same man from the reference — same face,
glasses, wardrobe — <scene staging, lighting, mood>, 9:16 vertical framing".
QA all keyframes: same face, story readable. Register good sets/locations
(`locations` collection) for reuse.

### 3. Animate each keyframe → Veo 3.1
```bash
node workflows/cli.cjs generateVideoFromImage '{"referenceImagePath":"<keyframe>","prompt":"Cinematic scene: <specific motion + camera move + mood>","outputPath":"clips/scene-N.mp4","duration":8,"aspectRatio":"9:16","quality":"fast"}'
```
Veo 3.1 returns **native ambient audio** (rain, room tone) — keep it, the
assembler ducks it under the VO. Motion prompts: ONE camera move + ONE subject
action per scene. Never mention text/overlays.

### 4. Adaptive narration — one VO segment per scene
Same voice identity, different emotional read per scene via `voiceStyle`:
```bash
node workflows/cli.cjs generateVoiceover '{"script":"<scene line>","outputPath":"vo/vo-N.wav","voiceName":"<locked voice>","voiceStyle":{"pace":"natural","audioProfile":"<the emotional read, e.g. hushed documentary intimacy / hollow matter-of-fact / warming momentum / settled mentor certainty>"}}'
```
> ⚠️ **Pacing trap:** `pace: "the_drift"` and `"staccato"` can stretch a 10-word
> line to 30s. Put the emotion in `audioProfile`, keep `pace: "natural"`, and
> add "total read under N seconds". **Always ffprobe each segment** — it must be
> shorter than its scene; regenerate if not.

### 5. Assemble — ONE call, no hand-written ffmpeg
```bash
node workflows/cli.cjs assembleStoryFilm '{
  "scenes": [
    {"clipPath":"clips/scene-01.mp4","voPath":"vo/vo-01.wav","voOffsetSeconds":0.6},
    {"clipPath":"clips/scene-02.mp4","voPath":"vo/vo-02.wav"}
  ],
  "logoPath": "projects/{name}/assets/logos/logo-primary.png",
  "outputPath": "the-film.mp4"
}'
```
Handles: concat, ambient duck (0.32), VO placement at each scene start, optional
`musicPath` bed, end-card logo (white background auto-keyed, faded in 3s before
the end, `logoPosition` top/bottom — pick the brighter region of the final shot).

### 6. QA → package
Extract frames (`ffmpeg -ss`), check character consistency + logo legibility +
`volumedetect` (peaks ≈ -3 to -6dB). Then `packageContent` for
instagram/tiktok/youtube, `saveManifestReport`, `recordCost`.

## Success signals
Character recognizably identical across all scenes; the story readable with sound
OFF (visuals alone); VO emotion audibly different per scene; total ≤45s.

## Variations
- **Kinetic hybrid:** overlay `renderKineticReel`-style text beats on the film for
  sound-off viewers (see WORKFLOWS.md § Remotion).
- **Speaking character:** swap scene 3 for `generateSpeakingVideoFromImage`
  (character talks) — lip-sync is Veo-native but voice varies between clips.
- **Series:** reuse `char-<id>` + registered locations for episode 2 — that's why
  they're locked in the registry.
