# Skills

Claude Code slash command skills for quick actions.

## Structure

Each skill is a directory with `SKILL.md`:

```
skills/
├── content-preflight/
│   └── SKILL.md
├── content-review/
│   └── SKILL.md
├── cost-guard/
│   └── SKILL.md
├── create-workflow/
│   └── SKILL.md
├── generate-brand-assets/
│   └── SKILL.md
├── generate-image/
│   └── SKILL.md
├── generate-music/
│   └── SKILL.md
├── generate-video/
│   └── SKILL.md
├── generate-voiceover/
│   └── SKILL.md
├── localize-content/
│   └── SKILL.md
├── onboard-brand/
│   └── SKILL.md
├── package-content/
│   └── SKILL.md
├── plan-content/
│   └── SKILL.md
├── preview-pick/
│   └── SKILL.md
├── produce-content/
│   └── SKILL.md
├── qa-review/
│   └── SKILL.md
├── repurpose-content/
│   └── SKILL.md
├── revise-content/
│   └── SKILL.md
└── write-copy/
    └── SKILL.md
```

## How to Use

**Run setup script:**
```bash
./setup.sh
```

**Or copy manually:**
```bash
cp -r skills/* .claude/skills/
```

## Available Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| `onboard-brand` | `/onboard-brand` | Interview the user → filled brand/project templates + registry + budget |
| `generate-video` | `/generate-video` | Generate video with Veo |
| `analyze-video` | `/analyze-video` | Analyze a reference video (YouTube/local) → scene breakdown + recreation plan |
| `generate-image` | `/generate-image` | Generate image with Gemini 3 Image (Nano Banana) |
| `generate-voiceover` | `/generate-voiceover` | Generate TTS audio |
| `generate-music` | `/generate-music` | Generate music with Lyria |
| `generate-brand-assets` | `/generate-brand-assets` | Logos, profile pics, covers/banners, highlights, watermarks per platform |
| `plan-content` | `/plan-content` | Create content calendar |
| `content-preflight` | `/content-preflight` | **Run first** — check context + resolve assets before plan/generate |
| `write-copy` | `/write-copy` | Hooks, framework-driven scripts, platform captions + hashtags |
| `preview-pick` | `/preview-pick` | Cheap options/storyboard → pick → commit budget |
| `content-review` | `/content-review` | Review plans/scripts/prompts/thumbnails BEFORE generating — catch issues, save money |
| `qa-review` | `/qa-review` | Check output for brand/text/claims/consistency before spend |
| `cost-guard` | `/cost-guard` | Track spend vs a per-project budget cap |
| `package-content` | `/package-content` | One asset → ready-to-upload folder per platform (sizes, captions, limits) |
| `produce-content` | `/produce-content` | Execute the content calendar: produce a day's planned pieces end-to-end |
| `repurpose-content` | `/repurpose-content` | Long video/podcast → vertical clips, quote images, captions, thread |
| `revise-content` | `/revise-content` | Regenerate ONE piece (scene/voiceover/slide) via the manifest, re-assemble free |
| `localize-content` | `/localize-content` | Translated copy + re-generated VO/captions per language, packaged per market |
| `create-workflow` | `/create-workflow` | Scaffold a new reusable workflow function |

## After Setup

Use slash commands in Claude Code:

```
/generate-video
/generate-image
/plan-content
```

## Detailed Workflows

For comprehensive guides, see the `workflows/` folder.
