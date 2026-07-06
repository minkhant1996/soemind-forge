# Recipe: Story Short Film (production-sheet pipeline)

**Goal:** a 15-60s animated/cinematic short with a cast, locations and props
that stay visually consistent across every shot — built the way studios do it:
story bible → production sheets → storyboard → multi-reference clips → assembly.

**When to use:** "short film", "animated story", "story with characters",
multi-character narratives, anything where the SAME character/place/prop must
appear across many shots. (For a single-character 4-scene brand film, the
lighter `cinematic-story-film.md` recipe is enough.)

**Prerequisites:** `/content-preflight` run. If the user provides their own
character/prop/setting images, use those as the inputs to Step 2 — don't
regenerate what they gave you.

## Why this order works

Consistency comes from generating REFERENCE SHEETS first and pointing every
downstream generation at them. A character described twice is two different
characters; a character sheet referenced twice is the same character.

```
Step 1  story.md          (words — free, iterate here)
Step 2  production sheets (images — cheap, lock the look)
Step 3  storyboard + scene prompts (map scenes ↔ sheets — free)
Step 4  clips             (video — expensive, everything is decided)
Step 5  ffmpeg assembly   (free, local)
```

## Cost & time (fast tier, 6 scenes × 8s, 2 characters + 1 location + 1 prop)

| Step | Cost |
|---|---|
| Story bible | $0 |
| 2 character sheets + 1 environment sheet + 1 prop sheet | ~$0.40 |
| Storyboard image (optional approval artifact) | ~$0.10 |
| 6 Veo 3.1 fast clips (8s @ $0.10/s) | $4.80 |
| VO + music | ~$0.10 |
| Assembly + transitions | $0 (local) |
| **Total** | **~$5.40** |

`checkBudget` before Step 2 and again before Step 4. Author the
`<content-id>.pipeline.json` before generating anything (RULES 7).

---

## Step 1 — Story bible (`story.md` in the content folder)

Write EVERYTHING down before generating a single image. Structure:

```markdown
# <Title>
Logline: <one sentence>
Runtime: <15/30/60s> · Format: <16:9 | 9:16> · Style: <photorealistic | claymation | …>

## Storyline
<3-6 beats: setup → complication → turn → resolution>

## Characters
### <char-id> — <Name>
- Age, role in story
- Personality: <2-3 lines — this goes ON the character sheet and DRIVES acting>
- Physical: <locked description: hair, eyes, build, wardrobe, colors>

## Locations
### <loc-id> — <Name>
- <detailed description: layout, materials, light, time of day, mood>

## Items / Props
### <prop-id> — <Name>
- <detailed description: size, color, texture, why it matters to the story>

## Scenes (shot list)
| # | Shot type | Camera move (§2b id) | Dur | Visual description | Dialogue / action | Refs needed |
|---|---|---|---|---|---|---|
| 01 | Wide | `static` | 1.5s | Lila plays alone in the sunny backyard | (ambient birds) | char-lila, loc-garden |
| 02 | Medium full | `tracking` | 1.5s | She chases her ball toward the corner | (giggles) | char-lila, prop-ball, loc-garden |
| … | | | | | | |
```

Shot-list rules (from the production-sheet method):
- 8-12 shots for 15s; ~6 shots for 30-45s at 8s each. Vary shot types —
  avoid consecutive near-identical shots.
- Every shot lists shot number, shot type, camera move (preset id from
  VIDEO-PROMPT-GUIDE §2b), duration, visual description, dialogue/action line.
- Not every shot needs dialogue — ambient/action lines count.
- The `Refs needed` column is the mapping Step 4 consumes.

**Show the user the story bible + total cost. Wait for approval.**

## Step 2 — Production sheets (one image per character / location / prop)

Generate a SHEET (not a portrait) for each entry in the bible, then register
it locked. Prompt patterns (see VIDEO-PROMPT-GUIDE § Production-sheet
patterns for full templates):

```bash
# Character sheet — multiple angles + expressions + palette on ONE image
node workflows/cli.cjs generateSingleImage '{"prompt":"Character production sheet for <Name>: full-body FRONT view, 3/4 view, SIDE view, BACK view of <locked physical description>. Expressions grid: warm, curious, surprised, thinking, sorry, happy. Personality: <personality lines>. Props: <their props>. Color palette swatches. White background. <style>. Label all views clearly.","outputPath":"projects/{name}/assets/characters/char-<id>-sheet.png","aspectRatio":"16:9","imageSize":"2K"}'

# Environment sheet — multiple labeled views of ONE location
node workflows/cli.cjs generateSingleImage '{"prompt":"Environment production sheet for <Location>: FRONT view, SIDE view (angle), TOP view (bird level), REAR view (behind <landmark>), corner detail, materials close-up of <detailed description>. Normal afternoon light. <style>. White background. Label all views clearly.","outputPath":"projects/{name}/assets/backgrounds/loc-<id>-sheet.png","aspectRatio":"16:9","imageSize":"2K"}'

# Prop sheet — the item from several angles on white
node workflows/cli.cjs generateSingleImage '{"prompt":"Prop sheet for <Item>: the object from front, side, top and 3/4 angles, plus one in-hand scale reference. <detailed description>. White background. <style>.","outputPath":"projects/{name}/assets/products/prop-<id>-sheet.png","aspectRatio":"16:9"}'
```

Then for EACH sheet: `reviewOutput` (QA), fix if needed, and
`registerAsset '["{name}","<collection>",{"id":"<id>",…,"locked":true,…}]'`.
User-provided images skip generation but still get registered.

**Gate: show all sheets to the user. Approved sheets are LOCKED — every later
step references the files, never re-describes them.**

## Step 3 — Storyboard + scene prompt mapping

1. **(Optional but recommended for >6 shots)** Generate ONE storyboard image
   as the approval artifact — 12 panels, each with shot number/type/camera/
   duration/visual/dialogue, using the sheets as strict references:

```bash
node workflows/cli.cjs generateImageVariation '{"referenceImagePaths":["…char-sheet.png","…loc-sheet.png"],"prompt":"12-panel cinematic storyboard titled <Title>, 15 seconds, 16:9. Character design, environment, props, colors and style must match the reference sheets exactly in every panel. Each panel labeled: shot number, shot type, camera movement, duration in seconds, visual description, dialogue or action line. Panels: <the 12 rows from story.md compressed>","outputPath":"…/storyboard.png","aspectRatio":"16:9","imageSize":"2K"}'
```

2. **Write the per-scene video prompts** into `prompts.txt` — one per shot,
   mapping the `Refs needed` column to actual sheet files. Template:

```
Scene NN → refs: [char-lila-sheet.png, loc-garden-sheet.png, prop-ball-sheet.png]
<camera move preset id>. The girl from the character reference sheet — same
face, hair, wardrobe — <action from shot list> in the garden from the
environment reference — same tree, ivy wall, light. The ball from the prop
reference. <mood/lighting>. <dialogue: She says, "…">. (no subtitles)
```

State each reference's ROLE in the prompt ("the girl from the character
sheet", "the garden from the environment reference") — refs without roles
produce mashups.

## Step 4 — Generate each scene clip with its references

Veo 3.1 takes up to **3 asset reference images** per clip via
`referenceImagePaths` — pick the 2-3 sheets that scene actually needs:

```bash
node workflows/cli.cjs generateVideoFromImage '{
  "referenceImagePaths": ["projects/{name}/assets/characters/char-lila-sheet.png","projects/{name}/assets/backgrounds/loc-garden-sheet.png","projects/{name}/assets/products/prop-ball-sheet.png"],
  "prompt": "The girl from the character sheet chases the ball from the prop reference toward the ivy-wall corner of the garden from the environment reference. Golden afternoon light. (soft ambient birds)",
  "cameraMove": "tracking",
  "duration": 8, "aspectRatio": "16:9", "quality": "fast",
  "outputPath": "projects/{name}/output-contents/{date}/clips/scene-02.mp4"
}'
```

- Need **4-5 refs** in one shot, or a stylized look (claymation, papercraft…)?
  Use `generateOmniVideoClip` with `referenceImagePaths` (max 5, cite
  `<IMG_REF_0>`… in the prompt) + `artStyle` — 10s/720p cap applies.
- `reviewVideoOutput` after EVERY clip (`expectedDurationSeconds`, character
  consistency vs the sheet). Regenerate failures before moving on — a wrong
  face in scene 3 is cheaper to fix now than after assembly.
- Log every generation in the manifest + prompts.txt with a RESULT note.

## Step 5 — Finalize with ffmpeg (+ transitions if the cut needs them)

```bash
# VO + music first if the story has narration (generate-voiceover / generate-music skills)

node workflows/cli.cjs assembleFinal '{
  "clipPaths": ["…/scene-01.mp4","…/scene-02.mp4","…/scene-03.mp4"],
  "transition": "dissolve", "transitionDuration": 0.5,
  "voiceoverPath": "…/voiceover.wav", "musicPath": "…/music.wav", "musicVolume": 0.25,
  "captionsSrtPath": "…/captions.srt",
  "outputPath": "…/final.mp4"
}'
```

Transition guidance:
- **Omit `transition`** (hard cuts, stream-copy, fastest) for fast-paced
  shot lists — cuts ARE the rhythm.
- `dissolve` / `fade` 0.4-0.6s for gentle story pacing; `fadeblack` for
  chapter breaks; `wipeleft`/`slideleft` for playful/kids content.
- Each overlap shortens total runtime by `transitionDuration` — budget shot
  durations accordingly (n clips lose (n-1)×duration seconds).
- Clip native audio is crossfaded automatically when every clip has audio.

Finish: `reviewVideoOutput` on final.mp4 (duration, audio, aspect), then
`/qa-review` and `/package-content`.

## Success signals

- Any frame from any clip visually matches the locked sheets (same face, same
  garden, same ball).
- story.md → storyboard → prompts.txt → clips are traceable 1:1 by shot number.
- A reviewer can regenerate any single scene from prompts.txt + the sheets
  without re-reading the whole project.
