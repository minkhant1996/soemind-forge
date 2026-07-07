# SoeMind Forge - User Guide

> A complete toolkit for AI agents to generate professional content using Google Gemini AI and OpenRouter.
> Videos, images, audio, music, brand assets - all with consistent branding and organized output.
>
> **Dual Provider Support:** Gemini (Veo, Gemini 3 Image, Lyria) + OpenRouter (Seedance lip-sync, GPT-4, Claude)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Provider Setup](#provider-setup)
3. [Available Skills](#available-skills)
4. [Platform Specs](#platform-specs)
5. [Project Structure](#project-structure)
6. [Asset System](#asset-system)
7. [Content Generation](#content-generation)
8. [Brand Assets](#brand-assets)
9. [Content Review](#content-review)
10. [Cost Reference](#cost-reference)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Step 1: Get API Keys

**Option A: Google AI Studio (Gemini)** - Recommended
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the key

**Option B: OpenRouter** - For Seedance lip-sync, model variety
1. Go to https://openrouter.ai/keys
2. Create a new API key (starts with `sk-or-v1-...`)

### Step 2: Run Setup

**macOS / Linux:**
```bash
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

**Manual setup:**
```bash
npm install
cd gemini && npm install && cd ..
cd workflows && npm install && npm run build && cd ..
cp .env.example .env
# Edit .env and add your API key(s)
```

### Step 3: Start Your AI Agent

```bash
claude   # or hermes, codex, gemini
```

**Claude Code:** no extra step — it loads `CLAUDE.md` and the kit's skills
automatically. Just ask: *"help me create a TikTok ad"*.

**Other tools:** always tell the agent to read docs first:
```
Read AGENT-GUIDE.md first, then help me create a TikTok ad.
```

---

## Provider Setup

### Provider Comparison

| Feature | Gemini | OpenRouter |
|---------|--------|------------|
| **Video** | Veo 3.1 (high quality) | Seedance 2.0 (lip-sync) |
| **Image** | Gemini 3 Image (Nano Banana) | DALL-E, Stable Diffusion |
| **Text** | Gemini 3.5 Flash (2.5 still available) | GPT-4, Claude, Llama |
| **TTS** | 30 voices | Various |
| **Music** | Lyria | ✗ |
| **STT** | ✗ | Whisper |

### When to Use Which

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Product video | **Gemini** | Higher visual quality |
| B-roll / cinematic | **Gemini** | Better ambient footage |
| Speaking character | **OpenRouter** | Seedance native lip-sync |
| UGC testimonial | **OpenRouter** | Integrated dialogue |
| Background music | **Gemini** | Lyria music generation |
| Model variety | **OpenRouter** | GPT-4, Claude, etc. |

### Configuration

Edit `.env`:
```env
# Option 1: Gemini only
GEMINI_API_KEY=your-gemini-key

# Option 2: OpenRouter only
OPENROUTER_API_KEY=sk-or-v1-your-key

# Option 3: Both (recommended)
GEMINI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=sk-or-v1-your-key
```

---

## Available Skills

| Skill | Command | Trigger Phrases |
|-------|---------|-----------------|
| **Onboard Brand** | `/onboard-brand` | "get started", "set up my brand", "new project" |
| **Content Preflight** | `/content-preflight` | Run before any generation |
| **Generate Video** | `/generate-video` | "create video", "TikTok ad", "Reels" |
| **Generate Image** | `/generate-image` | "create image", "thumbnail", "carousel" |
| **Generate Brand Assets** | `/generate-brand-assets` | "profile pic", "cover image", "social assets" |
| **Generate Voiceover** | `/generate-voiceover` | "voiceover", "narration", "TTS" |
| **Generate Music** | `/generate-music` | "background music", "jingle", "soundtrack" |
| **Plan Content** | `/plan-content` | "content calendar", "30-day plan" |
| **Write Copy** | `/write-copy` | "write script", "hooks", "caption" |
| **Content Review** | `/content-review` | "review prompt", "check script" |
| **Preview Pick** | `/preview-pick` | "give me options", "preview first" |
| **QA Review** | `/qa-review` | "check quality", "review output" |
| **Cost Guard** | `/cost-guard` | "budget", "how much", "cost estimate" |
| **Package Content** | `/package-content` | "export for Instagram", "ready to post" |
| **Produce Content** | `/produce-content` | "produce day 3", "today's content" |
| **Repurpose Content** | `/repurpose-content` | "repurpose this video", "make shorts" |
| **Revise Content** | `/revise-content` | "redo scene 2", "change the voiceover" |
| **Localize Content** | `/localize-content` | "make this in Spanish", "translate my ad" |
| **Create Workflow** | `/create-workflow` | "create a workflow", "add a workflow function" |

---

## Platform Specs

### Images

| Use Case | Aspect Ratio | Platforms |
|----------|--------------|-----------|
| **Feed post** | **4:5** | Instagram, Facebook, TikTok |
| **Square** | **1:1** | All platforms (universal) |
| **Wide** | **16:9** | Twitter, LinkedIn, YouTube |
| **Pinterest** | **2:3** | Pinterest |

**Recommendation:** Generate **4:5** for feed posts - works on IG, FB, TikTok.

### Videos

| Use Case | Aspect Ratio | Platforms |
|----------|--------------|-----------|
| **Short-form** | **9:16** | Reels, Shorts, TikTok, FB Reels |
| **Long-form** | **16:9** | YouTube, FB Video, LinkedIn |
| **Square** | **1:1** | Twitter, LinkedIn |

**Recommendation:** Generate **9:16** once, post on all short-form platforms.

### Carousels

| Platform | Aspect Ratio | Max Slides |
|----------|--------------|------------|
| Instagram | 4:5 or 1:1 | 10 |
| TikTok | 4:5 | 35 |
| Facebook | 1:1 only | 10 |
| LinkedIn | 1:1 or 4:5 | PDF |

### Profile & Cover Images

| Platform | Profile | Cover |
|----------|---------|-------|
| Facebook | 320×320 (circle) | 820×312 |
| Instagram | 320×320 (circle) | - |
| TikTok | 200×200 (circle) | - |
| YouTube | 800×800 (circle) | 2560×1440 |
| LinkedIn | 400×400 (circle) | 1584×396 |
| Twitter | 400×400 (circle) | 1500×500 |

**Full specs:** See `workflows/PLATFORM-SPECS.md`

---

## Project Structure

```
projects/{project-name}/
├── templates/              # Project info
│   ├── project.md          # Business, audience, offer
│   └── brand.md            # Colors, tone, visual style
│
├── config/
│   └── assets.yaml         # Asset registry
│
├── assets/                 # Reference files
│   ├── characters/         # char-founder-front.png
│   ├── products/           # prod-main-hero.png
│   ├── logos/              # logo-icon.png, logo-white.png
│   ├── backgrounds/        # bg-studio-white.png
│   ├── thumbnails/         # Reference thumbnails
│   ├── social/             # Profile pics, covers
│   │   ├── profiles/
│   │   ├── covers/
│   │   └── highlights/
│   └── audio/              # Voice samples, music
│
├── content-plans/
│   ├── calendar.md
│   └── day-01/
│       └── content-01-video.md
│
└── output-contents/
    └── {timestamp}/
        ├── video.mp4
        ├── thumbnail.png
        └── caption.md
```

---

## Asset System

### Why Store Assets?

**Problem:** Each AI generation creates NEW random results.
- New character = different face every time
- New logo = inconsistent branding

**Solution:** Store reference assets and reuse them.
- Same character reference = consistent face
- Same logo = brand recognition

### Asset Types

| Type | Folder | Purpose |
|------|--------|---------|
| **Characters** | `assets/characters/` | Consistent faces across content |
| **Products** | `assets/products/` | Product shots, mockups |
| **Logos** | `assets/logos/` | Brand marks (full, icon, white) |
| **Backgrounds** | `assets/backgrounds/` | Scene backgrounds |
| **Thumbnails** | `assets/thumbnails/` | Reference thumbnails |
| **Social** | `assets/social/` | Profile pics, covers |
| **Audio** | `assets/audio/` | Voice samples, music, SFX |

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Character | `char-{id}-{angle}.png` | `char-founder-front.png` |
| Product | `prod-{id}-{shot}.png` | `prod-watch-hero.png` |
| Logo | `logo-{variant}.png` | `logo-icon.png` |
| Background | `bg-{description}.png` | `bg-studio-white.png` |
| Profile | `{platform}-profile.png` | `youtube-profile.png` |
| Cover | `{platform}-cover.png` | `facebook-cover.png` |

### Asset Registry

Assets are tracked in `config/assets.yaml`:

```yaml
characters:
  - id: char-founder
    label: "Founder - Sarah"
    source: generated
    status: ready
    locked: true  # Prevents regeneration
    files:
      front: assets/characters/char-founder-front.png
```

**Full guide:** `templates/ASSETS-GUIDE.md`

---

## Content Generation

### Workflow Order

1. **Pre-flight** - Validate project, resolve assets
2. **Check platform specs** - Get correct ratio
3. **Review prompts** - Catch issues before paying
4. **Preview first** - For expensive content
5. **Generate** - Run the skill
6. **QA review** - Check output quality

### Multilingual Speaking Characters & Consistent Casts

Two production-tested rules (full detail: `workflows/VIDEO-PROMPT-GUIDE.md`
§ Production-Tested Playbook):

- **Speaking in Myanmar / Thai / other non-Latin scripts → Gemini Omni Flash.**
  Veo silently blocks mixed-language prompts and sings the lines; Omni
  pronounces them naturally. Best flow: approve a keyframe still per scene,
  then Omni image-to-video with the dialogue line in native script.
- **Same characters across many scenes → keyframe-first.** Character sheets
  feed the IMAGE model (Nano Banana keyframes, ~$0.07 each, approve before
  animating); the VIDEO model only animates the approved still. For scenes
  where characters can't be in the first frame, lock them into the last frame
  with `generateVideoFromKeyframes` (Veo 3.1 first+last frame).

### Pipeline-First (How Generation Actually Runs)

Before generating anything, the agent authors a `<content-id>.pipeline.json`
in the content folder — each node is a CLI command, with `{{node.data.field}}`
refs wiring outputs to inputs — then executes it:

```bash
node workflows/cli.cjs runPipeline @my-content.pipeline.json
```

The folder ends up fully auditable: `pipeline.json` (plan) →
`pipeline-result.json` (execution + per-node costs) → outputs.
See `workflows/pipelines/README.md`.

**Every content folder also gets a `prompts.txt`** — the human-readable log of
every image/video prompt and script/VO text used (including retries), alongside
the machine-readable manifest.

### $0 Local Renders (Remotion)

Text on slides and reels is rendered locally with real fonts — no AI cost,
no garbled typography:

- `node workflows/cli.cjs renderKineticReel '{...}'` — 9:16 animated typography reels
- `node workflows/cli.cjs renderSlideStill '{...}'` — pixel-perfect carousel/slide stills

### Omni Video (Single-Call Video + Audio, Editing, Art Styles)

`node workflows/cli.cjs generateOmniVideoClip '{...}'` generates a clip with
integrated audio in one call (Gemini Omni Flash) — clips up to 10s, 720p,
16:9 or 9:16. Four tasks, auto-selected from what you pass:

- **Text to video** — explainers, sizzle reels, on-screen text that syncs
- **Image to video** — animate a keyframe or scene image
- **Reference to video** — 2-5 reference images (cited as `<IMG_REF_0>`…)
  keep your product/character/set consistent in a new scene
- **Edit video** — pass an existing clip and ask for changes: add SFX, add
  text, restyle, change the camera

Pick one of **10 art-style presets** (`artStyle`: claymation, pixel-art,
whiteboard-doodle, 3d-papercraft, fluffy-toy…) — the agent will always ask
you which style before generating stylized content.

### Camera Moves (46 presets)

Instead of describing camera work by hand, video commands accept
`cameraMove` ids — `dolly-in`, `orbit-clockwise`, `whip-pan-right`,
`drone-pull-back`, `earth-zoom-out`… Each expands to a tested four-part
block (movement/speed/framing/end). The agent proposes 1-2 that fit your
content and confirms. Library: `workflows/VIDEO-PROMPT-GUIDE.md` §2b.

### Product Shots (26 e-commerce presets)

Turn ONE real product photo into channel-ready assets — white-background
marketplace packshots, lifestyle scenes, scale/trust shots (in-hand,
multi-angle, texture close-up), and seasonal versions (spring → Black
Friday) — via `productShot` on `generateImageVariation`. Every preset
preserves exact shape, branding, and label text. Guide:
`workflows/PRODUCT-SHOT-GUIDE.md`.

### Story Short Films (production-sheet pipeline)

For multi-character stories, the agent follows
`workflows/recipes/story-short-film.md`: story bible (.md) → character/
environment/prop production sheets → storyboard → clips generated with up to
3 reference sheets each (same faces, same places, every shot) → ffmpeg
assembly with optional crossfade transitions.

### Video Generation

```
User: "Create a 30-second TikTok ad"

Agent workflow:
1. /content-preflight
2. Check: Has character? → Resolve from registry
3. /generate-video → 9:16, 30s, Veo or Seedance
4. Output to: output-contents/{timestamp}/
```

**Features:**
- Character consistency (same face across clips)
- Multi-reference clips (character + environment + prop sheets, max 3)
- 46 camera-move presets (`cameraMove`)
- Speaking characters (dialogue in video)
- Voiceover overlay (TTS narration)
- Music generation (Lyria)
- Assembly with crossfade transitions (`assembleFinal` + `transition`)

### Image Generation

```
User: "Create a carousel for Instagram"

Agent workflow:
1. /content-preflight
2. Check platform: IG → 4:5 ratio
3. /generate-image → carousel mode
4. Output: slide-01.png, slide-02.png, etc.
```

**Features:**
- Single images
- Carousels (multiple slides)
- Thumbnails
- Product shots (26 e-commerce presets — see PRODUCT-SHOT-GUIDE.md)
- Character keyframes
- Multi-reference generation (up to 5 images, e.g. storyboards from sheets)

### Voiceover Generation

```
User: "Add voiceover to my video"

Agent workflow:
1. Check voice in registry or suggest
2. /generate-voiceover
3. Combine with video via `node workflows/cli.cjs assembleFinal '{...}'`
```

**Voices available:** Kore, Charon, Zephyr, Puck, Aoede, and more.

---

## Brand Assets

### Generate Social Media Assets

```
User: "Set up my brand on all platforms"

Agent: /generate-brand-assets
Creates:
- Profile pics for all platforms
- Cover images (YouTube, Facebook, LinkedIn, Twitter)
- Instagram highlights
- YouTube watermark
```

### What Gets Generated

| Asset | Platforms | Cost |
|-------|-----------|------|
| Profile images | All (7 platforms) | ~$0.07 |
| Cover images | FB, YT, LinkedIn, Twitter | ~$0.40 |
| Highlight covers | Instagram (5 icons) | ~$0.35 |
| Watermark | YouTube | ~$0.07 |
| **Full set** | All | ~$1.00-1.50 |

### Example Usage

```bash
node workflows/cli.cjs generateBrandAssets '{
  "projectName": "my-brand",
  "brandName": "SoeMind",
  "style": "modern minimalist",
  "primaryColor": "#4F46E5",
  "platforms": ["facebook", "instagram", "youtube", "linkedin", "tiktok"],
  "includeProfiles": true,
  "includeCovers": true,
  "includeHighlights": true,
  "highlightCategories": ["About", "Products", "Reviews", "Tips"]
}'
```

---

## Content Review

### Why Review First?

| Content Type | Generation Cost | Review Cost |
|--------------|-----------------|-------------|
| Script/Hook | $0.05-0.50 (TTS) | FREE |
| Image | $0.067-0.15 | FREE |
| Video (30s) | $0.90-6.00 | FREE |
| Carousel (10 slides) | $0.67 | FREE |

**Review catches:**
- Restricted words in scripts
- Text in image prompts (AI generates garbled text)
- Conflicting camera movements
- Missing character references

### Review Commands

```bash
# Check script — fails on restriction violation
node workflows/cli.cjs reviewScript '{"script": "This product will cure your problems!", "restrictions": ["cure", "guaranteed"]}'

# Check image prompt — fails on text in prompt (garbled typography)
node workflows/cli.cjs reviewImagePrompt '{"prompt": "Product with price tag showing $29"}'

# Check video prompt — catches conflicting camera movements etc.
node workflows/cli.cjs reviewVideoPrompt '{"prompt": "Slow dolly-in while rapidly panning left"}'

# Check thumbnail — reports characterStatus: needs-reference
node workflows/cli.cjs reviewThumbnail '{"prompt": "Person with excited expression", "includesPerson": true, "hasCharacterReference": false}'
```

Each command prints its JSON result (`pass`, issues, suggestions) to stdout.

---

## Cost Reference

### Video (Veo)

| Quality | Cost/second | 30s Video |
|---------|-------------|-----------|
| Lite | $0.03 | $0.90 |
| Fast | $0.08 | $2.40 |
| Standard | $0.20 | $6.00 |

### Images (Gemini 3 Image / Nano Banana)

| Resolution | Cost |
|------------|------|
| Nano Banana 2 Lite (`imageModel:"lite"`, any size) | $0.0336 flat |
| 512px (flash) | $0.045 |
| 1K (flash) | $0.067 |
| 2K (flash / pro) | $0.101 / $0.134 |
| 4K (flash) | $0.15 |

### Audio

| Type | Cost |
|------|------|
| TTS | ~$0.001/sentence |
| Music (30s) | $0.04 |
| Music (3min) | $0.08 |

### Brand Assets

| Asset | Cost |
|-------|------|
| Profile image | $0.067 |
| Cover image | $0.10 |
| Full brand set | ~$1.00-1.50 |

---

## Troubleshooting

**Start with the health check** — it diagnoses the most common problems
(missing builds, missing keys, no ffmpeg) and prints the exact fix:

```bash
node workflows/cli.cjs doctor
```

### "API key not found"
- Check `.env` file exists in root
- Check key is correct format
- Gemini: starts with `AI...`
- OpenRouter: starts with `sk-or-v1-...`

### "Quota exceeded"
- Wait for quota reset
- Use different quality tier (Lite instead of Standard)
- Use different API key

### "Character looks different each time"
- Store character reference in `assets/characters/`
- Register in `config/assets.yaml`
- Set `locked: true`
- Use same reference for all generations
- **Video scenes:** use the keyframe-first pipeline — generate a still
  (Nano Banana) per scene from the sheets, approve it, then animate THAT file
  with image-to-video. Reference-based video generation alone drifts.
- **Fictional mascots/robots:** also crop ONE clean view from the sheet
  (`char-x-hero.png`) — video models blend multi-view object sheets into
  the wrong design.
- Full ladder of what works: `workflows/VIDEO-PROMPT-GUIDE.md`
  § Production-Tested Playbook.

### "Veo says 'No video was generated'" (silent filter block — $0 charged)
- Non-English script (e.g. Burmese) mixed into an English prompt is the usual
  trigger; words like *singing, music, voiceover, pronunciation* also block.
- Retry once (the filter is probabilistic), then: translate the whole prompt
  into the target language, or switch the beat to Omni Flash
  (`generateOmniVideoClip`), which handles non-English dialogue cleanly.

### "Speaking character sounds like singing" (non-English on Veo)
- Don't write "not singing"/"no music" — those words get the prompt blocked.
- Frame the delivery instead: "asks casually in everyday spoken <language>,
  plain conversational tone like chatting with a friend" — or use Omni Flash,
  which pronounces non-English dialogue more naturally.

### "One scene is 90% right but has a flaw"
- Don't re-roll — Omni edit task: `generateOmniVideoClip` with
  `inputVideoPath` + "Keep everything the same… only <fix>".
- If the fix touches a character, ATTACH the character's reference images —
  text-only edits redraw faces/wardrobe from imagination.

### "Wrong aspect ratio"
- Check `workflows/PLATFORM-SPECS.md`
- Use exact ratios: 4:5, 9:16, 16:9, 1:1, 2:3
- Don't use arbitrary sizes

### "Text in image looks garbled"
- Never include text in image prompts
- Add text in post-production
- Use overlays instead

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| **[README.md](./README.md)** | Quick start |
| **[AGENT-GUIDE.md](./AGENT-GUIDE.md)** | AI agent context (read first) |
| **[RULES.md](./RULES.md)** | Ground rules every AI tool must follow |
| **[workflows/PROMPT-GUIDES-INDEX.md](./workflows/PROMPT-GUIDES-INDEX.md)** | Master guide index |
| **[workflows/PLATFORM-SPECS.md](./workflows/PLATFORM-SPECS.md)** | All platform sizes |
| **[templates/ASSETS-GUIDE.md](./templates/ASSETS-GUIDE.md)** | Asset folder guide |

### Prompt Guides

| Guide | When to Use |
|-------|-------------|
| `PLATFORM-SPECS.md` | Before any generation |
| `IMAGE-PROMPT-GUIDE.md` | Image generation |
| `PRODUCT-SHOT-GUIDE.md` | E-commerce product shots (26 presets) |
| `VIDEO-PROMPT-GUIDE.md` | Veo + Omni Flash video, camera-move presets |
| `SEEDANCE-PROMPT-GUIDE.md` | Seedance lip-sync |
| `THUMBNAIL-GUIDE.md` | Thumbnails |
| `BRAND-ASSETS-GUIDE.md` | Social media assets |
| `STYLE-GUIDE.md` | Visual styles |

---

## Example Requests

**Video:**
```
Read AGENT-GUIDE.md first, then create a 30-second TikTok ad for my fitness app.
```

**Image:**
```
Read AGENT-GUIDE.md first, then create a YouTube thumbnail for my video about productivity.
```

**Brand assets:**
```
Read AGENT-GUIDE.md first, then set up my brand on Instagram, YouTube, and TikTok.
```

**Content plan:**
```
Read AGENT-GUIDE.md and templates/README.md, then create a 30-day content calendar.
```

**Script:**
```
Read skills/write-copy/SKILL.md, then write 3 hooks for my product launch.
```

**Product shots:**
```
Read AGENT-GUIDE.md first, then turn this product photo into an Amazon packshot plus 3 seasonal versions.
```

**Story short film:**
```
Read workflows/recipes/story-short-film.md, then make a 15-second animated short about a girl and her floating ball.
```

**Edit an existing clip (Omni):**
```
Read AGENT-GUIDE.md first, then add whoosh SFX and animated motion effects to output-contents/.../skate.mp4.
```
