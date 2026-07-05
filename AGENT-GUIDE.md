# Min AI Content Studio Kit - Agent Context

> **For AI Agents**: This file provides persistent context. READ THIS FIRST.
> **Ground rules**: [RULES.md](./RULES.md) — binding rules for every AI tool in this repo. Read it before generating anything.
> **For Users**: See [USER_GUIDE.md](./USER_GUIDE.md) for setup and usage instructions.

---

## What This Project Is

A content-generation toolkit built on Google Gemini AI and OpenRouter with support for:

**Gemini (Google AI Studio)**
- **Text Generation** - Gemini 3.5 Flash / 3.1 Pro
- **Image Generation** - Gemini 3 Image (Nano Banana 2 / Pro / Lite)
- **Video Generation** - Veo 3.1 (lite/fast/standard)
- **Text-to-Speech** - 30 voices, multi-speaker
- **Music Generation** - Lyria (clips and full songs)

**OpenRouter**
- **Video Generation** - Seedance 2.0 (native lip-sync, integrated audio)
- **Text Generation** - GPT-4, Claude, Llama, Mistral, and 100+ models
- **Speech-to-Text** - Whisper transcription

**Required**: At least one API key in root .env file:
- `GEMINI_API_KEY` - For Veo, Gemini image models (Nano Banana 2 / Pro / Lite), Lyria, TTS
- `OPENROUTER_API_KEY` - For Seedance (lip-sync), GPT-4, Claude

---

## ⚠️ HOW TO RUN A WORKFLOW (READ THIS FIRST)

**Every workflow is a CLI command. CALL it — do NOT write a script.**

```bash
node workflows/cli.cjs <command> '<json-args>'
```

For long prompts, put the args in a file and pass it with `@`:

```bash
node workflows/cli.cjs generateSilentVideo @args.json
# or pipe JSON on stdin:
echo '{"prompt":"...","outputPath":"out.mp4","duration":8}' | node workflows/cli.cjs generateSilentVideo -
```

- `node workflows/cli.cjs list` → every available command, grouped.
- The command prints its JSON result (paths, cost, errors) to stdout; exit code is non-zero on failure.
- Argument shapes for each command are in `workflows/WORKFLOWS.md`.
- `generate*` commands take a single options object `{...}`; asset/budget helpers take
  positional args — pass a JSON **array** to spread them, e.g. `budgetSummary '["myproject"]'`.

> ❌ **DO NOT** author `generate-*.cjs` / `.ts` files that `import` from `workflows/dist/index.js`
> and call functions yourself. That duplicates the toolkit, buries per-project business content
> in throwaway scripts, and is the exact anti-pattern this CLI exists to remove. The `import`
> snippets elsewhere in the skills document each command's **arguments** — translate them into a
> `cli.cjs` call, don't paste them into a new script file.

To chain steps (storyboard → approve → clips → voiceover → assemble), run **multiple CLI
commands**, reading each JSON result before the next — not one big script.

---

## ⚠️ MANDATORY WORKFLOW (DO NOT SKIP)

**For ANY content plan or generation, follow this EXACT order:**

### Step 0: CREATE PROJECT FOLDER
```bash
# Check if exists
ls projects/{name}/ 2>/dev/null

# If NOT → create it NOW:
mkdir -p projects/{name}/{templates,config,assets/{characters,products,logos,backgrounds,thumbnails,social/{profiles,covers,highlights},audio,icons,overlays},content-plans,output-contents}

# Copy ALL templates:
cp templates/project.template.md projects/{name}/templates/project.md
cp templates/brand.template.md projects/{name}/templates/brand.md
cp templates/assets.config.template.yaml projects/{name}/config/assets.yaml
```

### Step 1: ASK QUESTIONS (DO NOT ASSUME)
**STOP and ask the user:**
- Business name, what they sell, website
- Target audience, pain points, goals
- Offer, CTA, urgency
- Brand colors, tone, visual style
- Any restrictions (words/topics to avoid)

**WAIT for answers. Do NOT make things up.**

### Step 2: FILL TEMPLATES
Write user's answers into:
- `projects/{name}/templates/project.md`
- `projects/{name}/templates/brand.md`

### Step 3: RUN PRE-FLIGHT
```
Read: skills/content-preflight/SKILL.md

Steps:
1. Classify topic type + visual mode
2. Check project + brand templates (now filled)
3. Load the asset registry (projects/{name}/config/assets.yaml)
4. Resolve required assets — reuse / provide / generate
5. Handle edge cases (real people, claims, series…)
6. Confirm readiness, THEN generate
```

### Step 4: THEN GENERATE
Only after Steps 0-3 are complete.

### Step 5: SAVE PROMPTS & MANIFEST (MANDATORY)
After EVERY generation, save prompts for reproducibility:

```bash
# Create manifest at session start
node workflows/cli.cjs createGenerationManifest '{"projectName":"{name}","outputDir":"..."}'

# After EACH generation, log the prompt
node workflows/cli.cjs addManifestEntry '{"manifestPath":"...","entry":{"type":"...","prompt":"...","parameters":{},"outputPaths":[],"cost":0,"status":"success"}}'

# Save report at end
node workflows/cli.cjs saveManifestReport '["<manifestPath>"]'
```

**Output folder structure:**
```
projects/{name}/output-contents/{date}/
├── {content-id}.pipeline.json  ← Pipeline plan (nodes = CLI commands) — RULES 7
├── pipeline-result.json        ← Execution log + per-node costs — RULES 7
├── manifest.json               ← All prompts + params (machine-readable)
├── manifest-report.md          ← Summary report (human-readable)
├── prompts.txt                 ← Human prompt log (image/video/VO + RESULT notes) — RULES 5b
├── script.md                   ← Video/voiceover script
├── image.png / video.mp4 / voiceover.wav
└── ...
```

**See:** `workflows/MANIFEST-GUIDE.md`

---

## What to Read Based on User Request

| User Wants | Read First | Then Read |
|------------|------------|-----------|
| **Any generation** | `skills/content-preflight/SKILL.md` | Appropriate skill below |
| **Platform specs** | `workflows/PLATFORM-SPECS.md` | All sizes & ratios |
| **Video** | `skills/generate-video/SKILL.md` | `workflows/VIDEO-PROMPT-GUIDE.md` |
| **Image** | `skills/generate-image/SKILL.md` | `workflows/IMAGE-PROMPT-GUIDE.md` |
| **Brand assets** | `skills/generate-brand-assets/SKILL.md` | `workflows/BRAND-ASSETS-GUIDE.md` |
| **Thumbnail** | `skills/generate-image/SKILL.md` | `workflows/THUMBNAIL-GUIDE.md` |
| **Voiceover** | `skills/generate-voiceover/SKILL.md` | - |
| **Music** | `skills/generate-music/SKILL.md` | - |
| **Content plan** | `skills/plan-content/SKILL.md` | `templates/README.md` |
| **Script/hooks** | `skills/write-copy/SKILL.md` | - |
| **Review prompts** | `skills/content-review/SKILL.md` | Save money on bad generations |
| **All guides index** | `workflows/PROMPT-GUIDES-INDEX.md` | Master reference |

---

## Available Skills

| Skill | Slash Command | Trigger Phrases |
|-------|---------------|-----------------|
| **Onboard Brand** | `/onboard-brand` | "get started", "set up my brand", "new project" |
| **Content Preflight** | `/content-preflight` | Before any generation |
| **Generate Video** | `/generate-video` | "create video", "TikTok", "Reels" |
| **Generate Image** | `/generate-image` | "create image", "thumbnail", "carousel" |
| **Generate Brand Assets** | `/generate-brand-assets` | "profile pic", "cover image", "logo" |
| **Generate Voiceover** | `/generate-voiceover` | "voiceover", "narration", "TTS" |
| **Generate Music** | `/generate-music` | "background music", "jingle" |
| **Plan Content** | `/plan-content` | "content calendar", "30-day plan" |
| **Write Copy** | `/write-copy` | "write script", "hooks", "caption" |
| **Content Review** | `/content-review` | "review prompt", "check script" |
| **Preview Pick** | `/preview-pick` | "give me options", "preview" |
| **QA Review** | `/qa-review` | "check quality", "review output" |
| **Cost Guard** | `/cost-guard` | "budget", "how much", "cost" |
| **Package Content** | `/package-content` | "export for Instagram", "ready to post", "prepare for upload" |
| **Produce Content** | `/produce-content` | "produce day 3", "today's content", "work through the calendar" |
| **Repurpose Content** | `/repurpose-content` | "repurpose this video", "make shorts from this", "podcast into clips" |
| **Revise Content** | `/revise-content` | "redo scene 2", "change the voiceover", "fix slide 3" |
| **Localize Content** | `/localize-content` | "make this in Spanish", "translate my ad", "multi-language" |
| **Create Workflow** | `/create-workflow` | "create a workflow", "add a workflow function", "extend the workflow library" |

---

## Platform Specs Quick Reference

### Images

| Use Case | Ratio | Platforms |
|----------|-------|-----------|
| Feed post | **4:5** | IG, FB, TikTok (one image for all) |
| Square | **1:1** | All platforms |
| Wide | **16:9** | Twitter, LinkedIn, YouTube |
| Pinterest | **2:3** | Pinterest |

### Videos

| Use Case | Ratio | Platforms |
|----------|-------|-----------|
| Short-form | **9:16** | Reels, Shorts, TikTok, FB Reels |
| Long-form | **16:9** | YouTube, FB Video, LinkedIn |

### Carousels

| Platform | Ratio |
|----------|-------|
| IG, TikTok | **4:5** |
| FB, LinkedIn | **1:1** |

**Full specs:** `workflows/PLATFORM-SPECS.md`

---

## Provider Selection

**Check which providers are available:**

Run `node workflows/cli.cjs doctor` — it reports which API keys are configured and
what each enables. `GEMINI_API_KEY` unlocks Veo video, Gemini image models
(Nano Banana 2 / Pro / Lite), Lyria music, and TTS; `OPENROUTER_API_KEY` unlocks
Seedance (lip-sync video), Whisper transcription, and GPT-4/Claude text models.

### When to Use Each Provider

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Product video / B-roll | **Veo (Gemini)** | Higher visual quality |
| Speaking character | **Seedance (OpenRouter)** | Native lip-sync |
| UGC testimonial | **Seedance** | Integrated dialogue |
| Background music | **Gemini** | Lyria music generation |
| Model variety | **OpenRouter** | GPT-4, Claude, etc. |

---

## Asset System

**Store reusable assets for consistency:**

```
projects/{name}/assets/
├── characters/     # char-founder-front.png (lock for consistency)
├── products/       # prod-main-hero.png
├── logos/          # logo-icon.png, logo-white.png
├── backgrounds/    # bg-studio-white.png
├── thumbnails/     # Reference thumbnails
├── social/         # Profile pics, covers, highlights
│   ├── profiles/
│   ├── covers/
│   └── highlights/
├── audio/          # Voice samples, music, SFX
└── overlays/       # Watermarks, lower thirds
```

**Asset registry:** `projects/{name}/config/assets.yaml`

**Always check registry before generating:**
```bash
node workflows/cli.cjs loadAssetConfig '["project-name"]'
node workflows/cli.cjs resolveAsset '["project-name", "char-founder"]'
# If ok → use existing[0] as reference image
# If not ok → generate or ask user for asset
```

**Full guide:** `templates/ASSETS-GUIDE.md`

---

## Content Review (Save Money)

**Review prompts BEFORE generating to catch issues:**

```bash
# Check script for pacing, restrictions
node workflows/cli.cjs reviewScript '{"script":"...","targetDuration":15}'

# Check image prompt for text, animation terms
node workflows/cli.cjs reviewImagePrompt '{"prompt":"..."}'

# Check video prompt for conflicts
node workflows/cli.cjs reviewVideoPrompt '{"prompt":"..."}'

# Check thumbnail for character reference
node workflows/cli.cjs reviewThumbnail '{"prompt":"...","includesPerson":true}'
```

**Review costs pennies (text-only LLM calls, budget-gated). Generation costs real money.**

---

## Generation Manifest (Audit Trail)

**ALWAYS save a manifest alongside outputs** so reviewers can see exactly what prompts and parameters were used.

```bash
# 1. Create manifest at session start (prints the manifest path)
node workflows/cli.cjs createGenerationManifest '{"projectName":"my-project","outputDir":"projects/my-project/output-contents/2026-06-28","context":{"brandColors":["#1a365d","#d4a84b"],"restrictions":["no competitor logos"]}}'

# 2. Log EACH generation
node workflows/cli.cjs addManifestEntry '{"manifestPath":"<manifestPath>","entry":{"type":"image","model":"gemini-3-pro-image","prompt":"Your exact prompt here...","referenceImagePath":"path/to/ref.png","parameters":{"aspectRatio":"16:9","imageSize":"2K"},"outputPaths":["output/file.png"],"cost":0.134,"status":"success"}}'

# 3. Generate report at end
node workflows/cli.cjs saveManifestReport '["<manifestPath>"]'
```

**Output structure:**
```
output-contents/2026-06-28/
├── {content-id}.pipeline.json  # Pipeline plan — RULES 7
├── pipeline-result.json        # Execution log + per-node costs — RULES 7
├── manifest.json               # Machine-readable log
├── manifest-report.md          # Human-readable review report
├── prompts.txt                 # Human prompt log — RULES 5b
├── slide-01.png
└── ...
```

**Why this matters:**
- See EXACTLY what prompt caused a bad output
- Iterate on prompts without re-explaining context
- Track costs per generation
- Build a library of working prompts

**Full guide:** `workflows/MANIFEST-GUIDE.md`

---

## Project Structure

```
projects/{name}/
├── templates/              # Filled project info
│   ├── project.md          # Business, audience, offer
│   └── brand.md            # Visual identity, style
├── config/
│   └── assets.yaml         # Asset registry
├── assets/                 # Reference files
│   ├── characters/
│   ├── products/
│   ├── logos/
│   └── social/
├── content-plans/
│   └── plan-001.md
└── output-contents/
    └── {timestamp}/
```

---

## Workflow Order

### For Any Generation

1. **Pre-flight** - `skills/content-preflight/SKILL.md`
2. **Check platform specs** - `workflows/PLATFORM-SPECS.md`
3. **Create manifest** - `createGenerationManifest()` for audit trail
4. **Load skill** - appropriate `/generate-*` skill
5. **Review prompts** - `skills/content-review/SKILL.md` (optional but recommended)
6. **Preview first** - `skills/preview-pick/SKILL.md` (for expensive content)
7. **Generate** - log each generation with `addManifestEntry()`
8. **QA review** - `skills/qa-review/SKILL.md`
9. **Save report** - `saveManifestReport()` for review

### For Brand Setup

1. **Generate brand assets** - `skills/generate-brand-assets/SKILL.md`
2. Creates: profiles, covers, highlights, watermarks
3. Registers in asset registry

### For Video with Character

1. **Check asset registry** for character
2. If missing: generate keyframe and register
3. Use character reference for ALL clips
4. Same face across entire video

---

## Cost Awareness

**Always show estimated cost before generating:**

| Content | Model | Cost |
|---------|-------|------|
| Video | Veo fast | $0.08/second |
| Video | Veo standard | $0.20/second |
| Image | Gemini 3 image (Nano Banana 2) 1K | $0.067 |
| Image | Gemini 3 image (Nano Banana 2) 2K | $0.101 |
| Image (cheapest) | Nano Banana 2 Lite (`imageModel:"lite"`) | $0.0336 flat |
| TTS | - | ~$0.001/sentence |
| Music | Lyria | $0.04/30s |

---

## Questions to Ask

### For Video
1. Platform? (TikTok/IG/YT) → Determines ratio
2. Duration? (15s/30s/60s)
3. Has person? → Check character reference
4. Audio type? (Speaking/voiceover/music only)

### For Image
1. Platform? → Determines ratio (4:5/1:1/16:9)
2. Type? (Feed post/carousel/thumbnail)
3. Has person? → Check character reference

### For Brand Assets
1. What platforms?
2. Have logo? → Use as profile base
3. Brand colors?

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `workflows/PROMPT-GUIDES-INDEX.md` | Master index of all guides |
| `workflows/PLATFORM-SPECS.md` | All platform sizes & ratios |
| `workflows/WORKFLOWS.md` | All workflow functions |
| `workflows/MANIFEST-GUIDE.md` | Generation audit trail guide |
| `templates/ASSETS-GUIDE.md` | Asset folder guide |
| `templates/assets.config.template.yaml` | Asset registry template |

---

## Skill Files Are Self-Contained

Each `skills/*/SKILL.md` contains the FULL workflow:
- Questions to ask
- Presets to apply
- Code to run
- Review checkpoints

**Load the skill and follow it.**
