# SoeMind Forge — AI Content Studio for Claude Code, Codex, Gemini CLI, Hermes & OpenClaw

**Generate AI videos (Veo 3.1), images (Nano Banana), voiceovers, music, and
30-day content calendars from plain English — budget-aware: it asks before it
spends, previews before it renders, and keeps your brand consistent down to
the character's face.**

Describe what you want in plain English — *"create a TikTok ad for my coffee
brand"*, *"make a cinematic story film"* — and your AI coding agent plans,
prices, generates, QAs, and packages it ready to upload.

```
Cinematic Films • Kinetic Text Reels • Videos • Carousels • Voiceover • Music • 30-Day Calendars
```

**Why this beats raw prompting an AI agent:**

- **Money moves only with consent.** Every project has a budget cap and a spend
  ledger; the agent shows the estimated cost *before* generating, previews cheap
  before rendering expensive, and records every dollar.
- **Consistency is engineered, not hoped for.** Characters, products, logos, and
  voices are generated once, locked in an asset registry, and reused by ID — the
  same face across a whole campaign, not a new stranger per clip.
- **Text never garbles.** AI models paint beautiful backgrounds but butcher
  typography — so slides and reels get pixel-perfect text rendered locally with
  real fonts (Remotion), for $0.
- **It ships upload-ready.** Correctly sized media per platform, captions within
  char limits, hashtags, alt text — not a folder of loose renders.
- **Proof stays real.** The agent is hard-blocked from inventing testimonials,
  stats, or press. Your numbers, verbatim, or nothing.

**Who this is for:** founders, marketers, and small brands who want professional
AI content without babysitting the spend — no coding required.

**What you need:**
1. A free [Google AI Studio](https://aistudio.google.com/app/apikey) API key —
   this kit is **optimized for Gemini models**. The free tier works to start;
   pay-as-you-go unlocks higher-quality video and images. Everything core
   (video, images, voiceover, music, transcription) runs on Gemini alone.
   *Optional add-ons:* [OpenRouter](https://openrouter.ai/keys) to reach more
   models (GPT-4, Claude, Seedance 2.0 video) — the agent wires those in on
   request; and [RunPod](https://runpod.io?ref=z1r0sgie) for talking-avatar
   lip-sync (InfiniteTalk).
2. Any supported AI agent CLI — **Claude Code**, **Codex CLI**, **Gemini CLI**,
   **Hermes**, or **OpenClaw**
3. Node.js 18+

**What it costs:** you pay only the AI providers, per generation. Rough guide: a
thumbnail ≈ $0.07, a 30-second voiceover ≈ $0.01, an 8-second Veo 3.1 clip ≈
$0.80, a full 32-second cinematic brand film (character sheet, keyframes, 4
clips, adaptive narration) ≈ $3.65. Every project gets a budget cap + ledger so
the agent warns before big generations. See [Cost Reference](#cost-reference).

**Supported Providers:**
- **Google AI Studio (Gemini)** — the optimized core. Veo video, Gemini 3 image
  models (Nano Banana), Lyria music, TTS, and transcription all run here. A free
  key gets you started; pay-as-you-go is only for higher-quality video/image
  generations. **You can run the whole kit on Gemini alone.**
- **OpenRouter** (optional) — a *gateway to more models*, not a lip-sync engine.
  It gives the agent access to 100+ text models (GPT-4, Claude, Llama) plus
  Seedance 2.0 video. The kit isn't tuned around these — the agent adds whichever
  model you ask for, on request.
- **RunPod** (optional) — the **talking-avatar / lip-sync** path: InfiniteTalk
  drives a character's mouth from your own audio recording (no duration cap).
  This is the only true lip-sync in the kit. [Sign up](https://runpod.io?ref=z1r0sgie)
  *(referral link: load $10+ and get a $5–500 one-time bonus credit — most get
  $5–10; supports this project)*, then create a key under
  [Settings → API Keys](https://www.runpod.io/console/user/settings)

> **New here?** Follow [GETTING-STARTED.md](./GETTING-STARTED.md) — from zero to
> your first generated image in about 10 minutes.

---

## Quick Start

### macOS / Linux
```bash
./setup.sh
```

### Windows
```cmd
setup.bat
```

### Manual Setup
```bash
# 1. Install dependencies
npm install
cd gemini && npm install && cd ..
cd workflows && npm install && npm run build && cd ..

# 2. Set API keys
cp .env.example .env
# Edit .env and add:
#   GEMINI_API_KEY=...      (Google AI Studio)
#   OPENROUTER_API_KEY=...  (OpenRouter - optional)

# 3. Start your AI agent (setup.sh installed the skills for your tool)
claude   # loads CLAUDE.md context automatically
> Create a TikTok ad

# other tools (hermes, codex, gemini):
> Read AGENT-GUIDE.md first, then create a TikTok ad
```

---

## What You Can Create

| Type | Examples | Skills |
|------|----------|--------|
| **Cinematic Story Films** | 30–45s brand films: locked character, Veo 3.1 scenes, adaptive narration | `workflows/recipes/cinematic-story-film.md` |
| **Story Short Films** | 15–60s multi-character shorts: production sheets → storyboard → multi-reference clips → transitions | `workflows/recipes/story-short-film.md` |
| **Kinetic Text Reels** | 9:16 typography reels — staggered animated lines, $0 text rendering | `renderKineticReel` |
| **Video** | TikTok ads, Reels, Shorts, explainers — 46 camera-move presets | `/generate-video` |
| **Omni Video** | Video + native audio in one call: text/image/reference-to-video AND editing existing clips, 10 art styles (claymation, pixel-art…) | `generateOmniVideoClip` |
| **Motion Control** | Swap the dancers/actors in a real video with your characters — choreography, camera, and background carry over 1:1 | Omni edit task · `VIDEO-PROMPT-GUIDE.md` §7 |
| **Lip-Sync to Your Audio** | Character image + your voice recording → talking video, mouth follows the audio, no duration cap | `infiniteTalkLipsync` (RunPod, $0.25-0.50/req) |
| **Transcription** | Timestamped transcripts in any language (incl. Myanmar) via Gemini — no extra provider needed | `transcribeAudio` |
| **Burned Captions + SRT** | Styled caption pills over any video, Burmese-safe shaping, $0 local render | `renderCaptionedVideo` |
| **Product Shots** | 26 e-commerce presets from one real product photo: packshots, lifestyle, scale/trust, seasonal | `productShot` on `/generate-image` |
| **Images & Slides** | Thumbnails, carousels with pixel-perfect type | `/generate-image` + `renderSlideStill` |
| **Brand Assets** | Logos, profiles, covers, highlights | `/generate-brand-assets` |
| **Voiceover** | Narration with per-scene emotional delivery, podcasts | `/generate-voiceover` |
| **Music** | Background music, jingles, songs | `/generate-music` |
| **Content Plans** | 30-day calendars, campaign recipes | `/plan-content` |
| **Copy** | Hooks, scripts, captions | `/write-copy` |
| **Consistent-Character Films** | Keyframe-first pipeline: NBP still per scene → image-to-video, characters hold across every shot | `VIDEO-PROMPT-GUIDE.md` § Production-Tested Playbook |
| **Non-English Dialogue Video** | Speaking characters in Myanmar/Thai/other scripts — Omni Flash native speech + lip-sync | same playbook, §3 |
| **First+Last Frame Shots** | Reveals/transformations locked to exact start & end images (Veo 3.1) | `generateVideoFromKeyframes` |

---

## Provider Comparison

**Gemini is the optimized core** — the whole kit runs on it. OpenRouter and
RunPod are optional add-ons.

| Feature | Gemini (core) | OpenRouter (optional) | RunPod (optional) |
|---------|--------|------------|--------|
| **Video** | Veo 3.1 (high quality, multi-reference consistency) · Omni Flash (video+audio, 4 tasks incl. edit-video, art styles) | Seedance 2.0 + other video models — agent-added on request | — |
| **Talking avatar / lip-sync** | — | — | InfiniteTalk (mouth follows your audio, no duration cap) |
| **Image** | Gemini 3 Image (Nano Banana) | DALL-E, SD, etc. — agent-added | — |
| **Text** | Gemini 3.5 Flash (2.5 still available) | GPT-4, Claude, Llama, 100+ models | — |
| **TTS** | 30 voices | Various | — |
| **Music** | Lyria | ✗ | — |
| **STT / transcription** | Gemini (timestamped, any language) | Whisper | — |

**When to use which:**
- **Gemini (default)** — video, images, music, TTS, transcription. Start and
  finish here; it's what everything is tuned for.
- **OpenRouter (optional)** — only when you want a model Gemini doesn't offer
  (e.g. GPT-4/Claude text, or Seedance 2.0 video). It's a model gateway, **not**
  a lip-sync feature — the agent adds the specific model you ask for.
- **RunPod (optional)** — the true lip-sync / talking-avatar path (InfiniteTalk),
  driven by your own audio file.
- **Veo 3.1 vs Omni Flash** - Veo for cinematic no-dialogue/English beats and
  first+last-frame shots; **Omni Flash for non-English speaking characters
  (e.g. Myanmar — better pronunciation, no silent filter blocks), reference
  consistency, and editing existing clips**. Details:
  `workflows/VIDEO-PROMPT-GUIDE.md` § Production-Tested Playbook.

---

## Platform Specs (All Supported)

| Platform | Feed Image | Short Video | Long Video |
|----------|------------|-------------|------------|
| Instagram | 4:5 | 9:16 | - |
| Facebook | 4:5 | 9:16 | 16:9 |
| TikTok | 4:5 | 9:16 | - |
| YouTube | - | 9:16 (Shorts) | 16:9 |
| LinkedIn | 1:1 | - | 16:9 |
| Twitter | 16:9 | - | 16:9 |

See `workflows/PLATFORM-SPECS.md` for complete specs.

---

## Skills Available

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `/onboard-brand` | "get started", "set up my brand" | Interview → ready-to-generate project |
| `/content-preflight` | Before any generation | Validates project, resolves assets |
| `/generate-video` | "create video", "TikTok ad" | Video generation (Veo / Omni Flash; Seedance optional via OpenRouter) |
| `/generate-image` | "create image", "thumbnail" | Image generation (Gemini 3 Image / Nano Banana) |
| `/generate-brand-assets` | "profile pic", "cover image" | Social media assets |
| `/generate-voiceover` | "voiceover", "narration" | TTS audio |
| `/generate-music` | "background music", "jingle" | Music generation (Lyria) |
| `/plan-content` | "30-day plan", "content calendar" | Content planning |
| `/write-copy` | "write script", "hooks" | Scripts, hooks, captions |
| `/content-review` | "review prompt", "check script" | Pre-generation validation |
| `/preview-pick` | "give me options", "preview" | Cheap previews before committing |
| `/qa-review` | "check quality", "review output" | QA generated content |
| `/cost-guard` | "budget", "how much" | Cost tracking |
| `/package-content` | "export for Instagram", "ready to post" | Per-platform upload packs |
| `/produce-content` | "produce day 3", "today's content" | Execute the content calendar |
| `/repurpose-content` | "repurpose this video", "make shorts" | Long video → clips, quotes, threads |
| `/revise-content` | "redo scene 2", "change the voiceover" | Edit one piece, not the whole render |
| `/localize-content` | "make this in Spanish", "translate my ad" | Multi-language versions cheaply |
| `/create-workflow` | "create a workflow", "add a workflow function" | Scaffold a new reusable workflow function in `workflows/index.ts` |

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[AGENT-GUIDE.md](./AGENT-GUIDE.md)** | AI agent entry point - read first |
| **[RULES.md](./RULES.md)** | Ground rules every AI tool must follow |
| **[USER_GUIDE.md](./USER_GUIDE.md)** | Complete setup and usage guide |
| **[workflows/PROMPT-GUIDES-INDEX.md](./workflows/PROMPT-GUIDES-INDEX.md)** | Master index of all guides |
| **[workflows/recipes/](./workflows/recipes/README.md)** | Campaign recipes: launch week, 30-day calendar, testimonial ad, podcast week, cinematic story film, story short film |
| **[workflows/PLATFORM-SPECS.md](./workflows/PLATFORM-SPECS.md)** | All platform sizes and ratios |
| **[templates/ASSETS-GUIDE.md](./templates/ASSETS-GUIDE.md)** | What to store in assets folder |

### Prompt Guides

| Guide | When to Use |
|-------|-------------|
| `PLATFORM-SPECS.md` | Aspect ratios for all platforms |
| `IMAGE-PROMPT-GUIDE.md` | Image generation |
| `PRODUCT-SHOT-GUIDE.md` | E-commerce product shots (26 presets, channel mapping) |
| `VIDEO-PROMPT-GUIDE.md` | Veo + Omni Flash video (46 camera-move presets, production-sheet pipeline) |
| `VIDEO-PROMPT-GUIDE.md` § Production-Tested Playbook | Consistent characters (keyframe-first), non-English/Myanmar dialogue, Omni edit-with-refs, Veo filter triage |
| `SEEDANCE-PROMPT-GUIDE.md` | Seedance video (OpenRouter, optional) |
| `THUMBNAIL-GUIDE.md` | Viral thumbnails |
| `BRAND-ASSETS-GUIDE.md` | Social media assets |
| `STYLE-GUIDE.md` | Visual styles |

---

## Folder Structure

```
project-root/
├── .env                  # API keys (gitignored)
├── AGENT-GUIDE.md             # AI agent entry point
├── USER_GUIDE.md         # User documentation
├── setup.sh / setup.bat  # Setup scripts
│
├── workflows/            # Workflow functions + guides
│   ├── PLATFORM-SPECS.md     # All platform sizes
│   ├── PROMPT-GUIDES-INDEX.md # Master guide index
│   ├── IMAGE-PROMPT-GUIDE.md
│   ├── PRODUCT-SHOT-GUIDE.md
│   ├── VIDEO-PROMPT-GUIDE.md
│   ├── THUMBNAIL-GUIDE.md
│   ├── BRAND-ASSETS-GUIDE.md
│   └── STYLE-GUIDE.md
│
├── skills/               # Generation skills
│   ├── generate-video/
│   ├── generate-image/
│   ├── generate-brand-assets/
│   ├── generate-voiceover/
│   ├── generate-music/
│   ├── content-preflight/
│   ├── content-review/
│   ├── plan-content/
│   └── write-copy/
│
├── templates/            # Project templates
│   ├── ASSETS-GUIDE.md       # What to store
│   ├── assets.config.template.yaml
│   ├── project.md
│   └── brand.md
│
├── projects/             # User projects (gitignored)
│   └── {project-name}/
│       ├── templates/    # Filled project info
│       ├── config/       # Asset registry
│       ├── assets/       # Reference files
│       └── output-contents/
│
├── gemini/               # Gemini API provider
└── openrouter/           # OpenRouter provider
```

---

## Supported AI Tools

One unified layer: **skills** — the same `skills/*/SKILL.md` files drive every
supported tool.

| Tool | Skills | Installed by `./setup.sh` / `setup.bat` to |
|------|--------|--------------------------------------------|
| **Claude Code** | ✓ | `.claude/skills/` (project) or `~/.claude/skills/` (global) |
| **Hermes** | ✓ | `~/.hermes/skills/` (global) · project scope reads `./skills/` in place via `external_dirs` in `~/.hermes/config.yaml` (setup prints the snippet) |
| **OpenClaw** | ✓ | `~/.openclaw/skills/` (global) · project scope: workspace `./skills/` is read in place |
| **Codex CLI** | ✓ | `.agents/skills/` (project) or `~/.agents/skills/` (global) |
| **Gemini CLI** | ✓ | `.gemini/skills/` (project) or `~/.gemini/skills/` (global) |

Run setup once and pick your tool — it installs the skills to the right place.
Claude Code additionally loads [`CLAUDE.md`](./CLAUDE.md) automatically for
context; on other tools, tell the agent to **read `AGENT-GUIDE.md` first**.

---

## For AI Agents

**Claude Code** reads [`CLAUDE.md`](./CLAUDE.md) automatically — just ask:

```
Help me create a video ad.
```

**Other tools** — always tell the agent to read first:

```
Read AGENT-GUIDE.md first, then help me create a video ad.
```

```
Read AGENT-GUIDE.md and workflows/PROMPT-GUIDES-INDEX.md, then create a 30-day content calendar.
```

---

## Asset System

Store reusable assets for consistency across content:

| Asset Type | Folder | Purpose |
|------------|--------|---------|
| Characters | `assets/characters/` | Consistent faces |
| Products | `assets/products/` | Product shots |
| Logos | `assets/logos/` | Brand marks |
| Backgrounds | `assets/backgrounds/` | Scene backgrounds |
| Social | `assets/social/` | Profile pics, covers |
| Audio | `assets/audio/` | Voice samples, music |

See `templates/ASSETS-GUIDE.md` for complete guide.

---

## Cost Reference

| Content | Provider | Cost |
|---------|----------|------|
| Video (fast, with audio) | Veo 3.1 | $0.10/sec (measured Jul 2026) — video-only $0.08/sec |
| Video (standard) | Veo 3.1 | $0.20/sec |
| Video + native audio (≤10s, 720p) | Gemini Omni Flash | ~$1.03/clip (token-priced, measured Jul 2026) |
| Image (1K) | Gemini 3.1 Flash Image (Nano Banana) | $0.067 |
| Image (2K) | Gemini 3.1 Flash Image / Gemini 3 Pro Image | $0.101 / $0.134 |
| Image (cheapest) | Nano Banana 2 Lite (`imageModel:"lite"`) | $0.0336 flat |
| TTS | Gemini | ~$0.001/sentence |
| Music (30s) | Lyria | $0.04 |
| Slide/reel text rendering | Remotion (local) | $0 |
| Film/reel assembly, publish packs | ffmpeg (local) | $0 |

---

## License

MIT © [Min Khant Soe](https://github.com/minkhant1996) — Senior AI Developer,
Thailand. Founder, SoeMindAI, Inc.

Contributions welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
