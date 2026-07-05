---
name: video-content
description: |
  Generate video content using Gemini Veo. Use when user asks to
  "create video", "make cinematic", "generate clips", "video ad",
  "product video", "explainer video", "social video", "TikTok",
  "Reels", "YouTube Shorts", or any video creation request.
license: MIT
allowed-tools:
  - gemini31FlashImage
  - veo31Lite
  - veo31
  - veo3
  - textToSpeech
---

# Video Content Generation Skill

## When This Skill Activates

- User wants to create video content
- User mentions platforms: TikTok, Instagram, YouTube, Facebook
- User asks for: ads, explainers, stories, tutorials, promos

---

## Pre-Flight Check (Read First)

**Before generating, check what exists:**

```
1. Project exists? → projects/{name}/
   YES → Read project.md + brand.md for context
   NO  → Create project first (templates/README.md)

2. Content plan exists? → content-plans/day-XX/content-XX-video.md
   YES → Read plan, skip to STEP 6 (all decisions made)
   NO  → Follow full workflow below

3. Style samples exist? → style-samples/video-examples/
   YES → Analyze and match style
   NO  → Use best practices
```

**Related Documentation:**
- Project setup: `templates/README.md`
- Video plan template: `templates/video-content.template.md`
- Character workflow: `gemini/workflows/05-character-consistency.md`
- Keyframe workflow: `gemini/workflows/06-keyframe-workflow.md`

---

# PHASE 1: Project Setup (MUST DO FIRST)

## STEP 0: Setup Project Folder

**BEFORE ANY CONTENT GENERATION:**

### 0.1: Ask Project Name (if new)

```
> What's the project name?
> (e.g., "Summer Campaign", "Product Launch Q3")
```

### 0.2: Create Project Structure

```typescript
import path from 'path';
import fs from 'fs';

function createProject(projectName: string) {
  // Sanitize name
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

  const projectPath = path.join('projects', safeName);

  // Create folder structure
  const folders = {
    root: projectPath,
    templates: path.join(projectPath, 'templates'),
    plans: path.join(projectPath, 'content-plans'),
    outputs: path.join(projectPath, 'output-contents'),
  };

  Object.values(folders).forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
  });

  // Copy master templates
  fs.copyFileSync(
    'templates/project.template.md',
    path.join(folders.templates, 'project.md')
  );
  fs.copyFileSync(
    'templates/brand.template.md',
    path.join(folders.templates, 'brand.md')
  );

  console.log(`✓ Created project: ${projectPath}`);
  return folders;
}
```

### Project Folder Structure

```
projects/
└── summer-campaign/
    ├── templates/              # Filled project info
    │   ├── project.md          # Business, audience, offer
    │   └── brand.md            # Visual identity, style
    ├── content-plans/          # Plans before generation
    │   ├── plan-001-fb-reel.md
    │   └── plan-002-tiktok.md
    └── output-contents/        # Generated files
        └── 20260622-211329/    # Timestamped
            ├── keyframes/
            ├── videos/
            ├── audio/
            └── final/
```

### 0.3: Check Project Brief

```typescript
const projectFile = path.join(PROJECT.templates, 'project.md');
const hasProject = fs.existsSync(projectFile);
```

### If project.md EXISTS:

```typescript
const project = parseProjectMd(projectFile);

// Check what's filled vs empty
const missing = [];
if (!project.business?.name) missing.push('business.name');
if (!project.audience?.primary) missing.push('audience');
if (!project.offer?.headline) missing.push('offer');
// ... check all required fields
```

**Show status:**

```
📋 PROJECT BRIEF STATUS
========================
✓ Business: {name} ({domain})
✓ Product: {product.name}
✓ Audience: {audience.primary.name}
✗ Missing: offer, hooks
✗ Missing: social proof (optional - will skip)
```

### If project.md DOES NOT EXIST:

```
No project brief found. Let me gather the info needed.
I'll create project.md and fill it as we go.
```

**Copy template:**
```typescript
fs.copyFileSync('project.template.md', projectFile);
```

---

## STEP 0A: Fill Missing Project Info

**For each missing field, either ASK or SUGGEST:**

### Fields Agent CAN Suggest:

| Field | How Agent Suggests |
|-------|-------------------|
| `domain` | Infer from product description |
| `audience.pain_points` | Based on domain + product |
| `hooks` | Based on pain points |
| `cta.primary` | Based on offer type |
| `style.visual` | Based on platform |
| `style.tone` | Based on audience |

**Example:**
```
Based on your online course, I suggest:

Target Audience:
  A) University students (18-24) preparing for study abroad
  B) Working professionals (25-35) for immigration
  C) Repeat test-takers who've failed before

Which fits best? Or describe your own:
```

### Fields Agent CANNOT Suggest (Must Ask):

| Field | Why |
|-------|-----|
| `social_proof.stats` | Must be real numbers |
| `social_proof.testimonials` | Must be real quotes |
| `social_proof.featured_in` | Must be real press |
| `business.name` | Only user knows |
| `product.price` | Only user knows |
| `offer.details` | Business decision |

**Example:**
```
Do you have any customer stats I can use?
(e.g., "10,000+ students", "95% success rate")

If not, I'll skip social proof in the content.
```

### Update File As User Answers:

```typescript
// User selects "A) University students"
project.audience.primary = {
  name: "University Students",
  age_range: "18-24",
  situation: "Preparing for study abroad",
};

// Save immediately
fs.writeFileSync(projectFile, serializeProject(project));
console.log("✓ Updated project.md with audience info");
```

---

## STEP 0B: Verify Before Proceeding

**Checklist - ALL must be filled:**

```
REQUIRED FOR GENERATION:
========================
[✓] Business name & domain
[✓] Product description
[✓] Target audience + pain points
[✓] Offer & CTA
[✓] Content type & platform
[✓] Visual style & tone
[✓] At least 1 hook idea
[✓] Character (if has_character = true)

OPTIONAL (will skip if empty):
==============================
[ ] Social proof / testimonials
[ ] Competitor references
[ ] Specific restrictions
```

**If required items missing:**
```
Still need before I can generate:
- Target audience pain points
- What's your offer/CTA?

Let me help you figure these out...
```

**If all required filled:**
```
✓ Project brief complete!
Proceeding to content planning...
```

---

# PHASE 2: Brand & Output Setup

## STEP 0C: Check for Brand Guidelines

**Check if brand.md exists (optional but recommended):**

```typescript
const brandFile = fs.existsSync('./brand.md');
```

### If brand.md EXISTS:

**Read and parse brand guidelines:**

```typescript
const brand = parseBrandMd('./brand.md');

// Extract key elements for prompts
const BRAND = {
  name: brand.brand_name,
  colors: brand.colors,
  tone: brand.tone,
  audience: brand.audience,
  aesthetic: brand.aesthetic,
  restrictions: brand.restrictions,
  cta: brand.cta_phrases,
  logo: brand.logo,
};
```

**Inform user:**

> ✓ Found brand.md - I'll apply your brand guidelines:
> - Brand: {brand_name}
> - Colors: {primary}, {secondary}, {accent}
> - Tone: {tone}
> - Aesthetic: {aesthetic.style}

### If brand.md DOES NOT EXIST:

**Ask user:**

> No brand.md found. Would you like to:
>
> 1. **Create brand guidelines** - I'll help you set up brand.md
> 2. **Quick brand info** - Just tell me basics (name, colors, style)
> 3. **Skip branding** - Generate without specific brand guidelines

**If "Create brand guidelines":**
- Copy `brand.template.md` to `brand.md`
- Walk user through filling key sections
- Save and continue

**If "Quick brand info":**

> Tell me the basics:
> - Brand name?
> - Main color (hex or name)?
> - Style (modern/playful/professional/minimal)?
> - Target audience?

**Store as temporary brand object.**

---

## STEP 0D: Apply Brand to Prompts

**Create brand prompt blocks for use in all generations:**

```typescript
// Color instructions for visuals
const BRAND_VISUAL_BLOCK = `
Brand colors: primary ${brand.colors.primary}, accent ${brand.colors.accent}.
Aesthetic: ${brand.aesthetic.style}.
Mood: ${brand.aesthetic.mood}.
Avoid: ${brand.aesthetic.avoid.join(', ')}.
`;

// For any text/copy generation
const BRAND_TONE_BLOCK = `
Tone of voice: ${brand.tone}.
Key messages: ${brand.key_messages.join('; ')}.
Never say: ${brand.restrictions.never_say.join(', ')}.
CTA phrase: "${brand.cta_phrases.primary}".
`;

// For character/talent in videos
const BRAND_TALENT_BLOCK = `
Talent appearance: ${brand.talent.appearance.join(', ')}.
Clothing colors: ${brand.talent.clothing_colors.preferred.join(', ')}.
Avoid: ${brand.talent.clothing_colors.avoid.join(', ')}.
`;

// For environment/setting
const BRAND_SETTING_BLOCK = `
Setting: ${brand.settings.preferred.join(', ')}.
Props: ${brand.settings.props.include.join(', ')}.
Avoid: ${brand.settings.avoid.join(', ')}.
`;
```

**These blocks are added to ALL prompts for consistency.**

---

## STEP 0E: Setup Output Folder Structure

**Create organized output folders before any generation:**

```typescript
import path from 'path';
import fs from 'fs';

function setupOutputFolder(projectName: string) {
  // Generate timestamp
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15); // 20260622-195530

  // Sanitize project name
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

  // Create folder structure
  const outputDir = path.join('output', safeName, timestamp);

  const folders = {
    root: outputDir,
    keyframes: path.join(outputDir, 'keyframes'),
    videos: path.join(outputDir, 'videos'),
    audio: path.join(outputDir, 'audio'),
    final: path.join(outputDir, 'final'),
  };

  // Create all folders
  Object.values(folders).forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
  });

  // Save project metadata
  const metadata = {
    project: projectName,
    created: now.toISOString(),
    brand: brandFile ? 'brand.md' : null,
    status: 'in_progress'
  };

  fs.writeFileSync(
    path.join(outputDir, 'project.json'),
    JSON.stringify(metadata, null, 2)
  );

  return folders;
}
```

### Output Folder Structure

```
output/
└── product-ad/                    # Project name
    └── 20260622-195530/                # Timestamp
        ├── project.json                # Metadata
        ├── keyframes/
        │   ├── scene1-struggle-start.png
        │   ├── scene1-struggle-end.png
        │   ├── scene2-discovery-start.png
        │   ├── scene2-discovery-end.png
        │   └── ...
        ├── videos/
        │   ├── scene1-struggle.mp4
        │   ├── scene2-discovery.mp4
        │   └── ...
        ├── audio/
        │   ├── voiceover.wav
        │   └── background-music.wav
        └── final/
            ├── product-ad-30s.mp4        # Combined final
            └── thumbnail.png            # If generated
```

### File Naming Convention

```
{scene_number}-{scene_name}-{type}.{ext}

Examples:
├── scene1-struggle-start.png      # Keyframe start
├── scene1-struggle-end.png        # Keyframe end
├── scene1-struggle.mp4            # Video clip
├── scene2-discovery-start.png
├── scene2-discovery-end.png
├── scene2-discovery.mp4
└── voiceover-full.wav             # Audio
```

### Ask Project Name

**At start of workflow, ask:**

> What's the project name? (for organizing files)
>
> Example: "Product Launch Ad", "Product Launch Video"

**Store as**: `projectName`

**Create output folder**: `OUTPUT = setupOutputFolder(projectName)`

**Use throughout:**
```typescript
// Keyframes
fs.writeFileSync(path.join(OUTPUT.keyframes, `scene${id}-${name}-start.png`), ...);

// Videos
fs.writeFileSync(path.join(OUTPUT.videos, `scene${id}-${name}.mp4`), ...);

// Audio
fs.writeFileSync(path.join(OUTPUT.audio, 'voiceover.wav'), ...);

// Final combined
fs.writeFileSync(path.join(OUTPUT.final, `${safeName}-${duration}s.mp4`), ...);
```

---

## STEP 1: Ask Content Type

**Ask the user:**

> What type of video content do you want to create?
>
> 1. **Storytelling** - Brand story, narrative, emotional journey
> 2. **Advertisement** - Product ad, promo, commercial
> 3. **Explainer** - Tutorial, how-to, educational
> 4. **Social Media** - TikTok, Reels, Shorts, quick content

**Store answer as**: `contentType`

---

## STEP 2: Ask Platform

**Ask the user:**

> Which platform is this for?
>
> 1. **TikTok** - Vertical 9:16, 15-60s, casual/trendy
> 2. **Instagram Reels** - Vertical 9:16, 15-90s, polished
> 3. **Instagram Feed** - Square 1:1 or 4:5, 15-60s
> 4. **YouTube Shorts** - Vertical 9:16, 15-60s
> 5. **YouTube Long** - Horizontal 16:9, 60s+
> 6. **Facebook** - Square 1:1 or 16:9, 15-120s
> 7. **LinkedIn** - Horizontal 16:9, 30-120s, professional
> 8. **General/Other** - I'll specify

**Store answer as**: `platform`

---

## STEP 3: Apply Platform Presets

Based on `platform`, set these values:

### TikTok
```yaml
aspectRatio: "9:16"
maxDuration: 60
recommendedDuration: 15-30
style: "casual, authentic, trendy, iPhone-quality"
hookWindow: "0.5 seconds"
```

### Instagram Reels
```yaml
aspectRatio: "9:16"
maxDuration: 90
recommendedDuration: 15-30
style: "polished, aesthetic, lifestyle"
hookWindow: "1 second"
```

### Instagram Feed
```yaml
aspectRatio: "1:1" # or "4:5" for portrait
maxDuration: 60
recommendedDuration: 15-30
style: "clean, branded, eye-catching"
hookWindow: "1 second"
```

### YouTube Shorts
```yaml
aspectRatio: "9:16"
maxDuration: 60
recommendedDuration: 30-60
style: "educational, entertaining, clear"
hookWindow: "1 second"
```

### YouTube Long
```yaml
aspectRatio: "16:9"
maxDuration: 600 # 10 minutes practical limit
recommendedDuration: 60-180
style: "cinematic, professional, produced"
hookWindow: "5 seconds"
```

### Facebook
```yaml
aspectRatio: "1:1" # or "16:9"
maxDuration: 120
recommendedDuration: 15-30
style: "attention-grabbing, shareable"
hookWindow: "1 second"
```

### LinkedIn
```yaml
aspectRatio: "16:9"
maxDuration: 120
recommendedDuration: 30-60
style: "professional, corporate, thought-leadership"
hookWindow: "3 seconds"
```

---

## STEP 4: Ask Duration

**Ask the user:**

> How long should the video be?
>
> Recommended for {platform}: {recommendedDuration} seconds

**Store answer as**: `totalDuration`

---

## STEP 4B: Auto-Calculate Clips & Timing

**Agent calculates optimal clip breakdown:**

### Clip Duration Rules

| Content Type | Optimal Clip Length | Reasoning |
|--------------|---------------------|-----------|
| Fast-paced ad | 4-5 seconds | Quick cuts, energy |
| Standard ad | 6 seconds | Balanced |
| Storytelling | 7-8 seconds | Emotional beats |
| Explainer | 6-8 seconds | Time to absorb |
| Social/TikTok | 4-6 seconds | Short attention |

### Calculation Logic

```typescript
function calculateClips(totalDuration: number, contentType: string, platform: string) {

  // 1. Determine optimal clip length
  let clipDuration: number;

  if (contentType === 'advertisement' && totalDuration <= 15) {
    clipDuration = 5;  // Fast cuts for short ads
  } else if (contentType === 'advertisement') {
    clipDuration = 6;  // Standard ad pacing
  } else if (contentType === 'storytelling') {
    clipDuration = 8;  // Max for emotional beats
  } else if (platform === 'tiktok' || platform === 'reels') {
    clipDuration = 5;  // Social = snappy
  } else {
    clipDuration = 6;  // Default balanced
  }

  // 2. Calculate number of clips
  const clipCount = Math.ceil(totalDuration / clipDuration);

  // 3. Adjust last clip if needed
  const lastClipDuration = totalDuration - (clipDuration * (clipCount - 1));

  // 4. Validate (Veo supports 4-8 seconds)
  const clips = [];
  for (let i = 0; i < clipCount; i++) {
    const isLast = i === clipCount - 1;
    let duration = isLast ? lastClipDuration : clipDuration;

    // Clamp to valid range (4-8 seconds)
    duration = Math.max(4, Math.min(8, duration));

    clips.push({ id: i + 1, duration });
  }

  return clips;
}
```

### Example Calculations

**15-second TikTok ad:**
```
totalDuration: 15
contentType: advertisement
platform: tiktok
clipDuration: 5s (fast-paced)

Result:
├── Clip 1: 5 seconds
├── Clip 2: 5 seconds
└── Clip 3: 5 seconds
Total: 3 clips
```

**30-second Instagram story ad:**
```
totalDuration: 30
contentType: advertisement
platform: reels
clipDuration: 6s (standard)

Result:
├── Clip 1: 6 seconds
├── Clip 2: 6 seconds
├── Clip 3: 6 seconds
├── Clip 4: 6 seconds
└── Clip 5: 6 seconds
Total: 5 clips
```

**45-second brand story:**
```
totalDuration: 45
contentType: storytelling
platform: youtube
clipDuration: 8s (emotional)

Result:
├── Clip 1: 8 seconds
├── Clip 2: 8 seconds
├── Clip 3: 8 seconds
├── Clip 4: 8 seconds
├── Clip 5: 8 seconds
└── Clip 6: 5 seconds (remainder)
Total: 6 clips
```

---

## STEP 4C: Calculate Keyframe Images Needed

**After determining continuity (Step 6B), calculate images:**

```typescript
function calculateKeyframes(scenes: Scene[]) {
  let newSceneImages = 0;    // Need start + end
  let continueImages = 0;     // Need end only

  for (const scene of scenes) {
    if (scene.continues_from === null) {
      newSceneImages += 2;    // start + end
    } else {
      continueImages += 1;    // end only
    }
  }

  const totalImages = newSceneImages + continueImages;
  const imageCost = totalImages * 0.067;  // $0.067 per 1K image

  return {
    newSceneImages,
    continueImages,
    totalImages,
    imageCost
  };
}
```

---

## STEP 4D: Calculate Total Cost

```typescript
function calculateTotalCost(clips: Clip[], keyframes: KeyframeCalc, model: string) {

  // Video cost per second
  const videoRates = {
    'veo31lite': { video: 0.03, audio: 0.05 },
    'veo31': { video: 0.20, audio: 0.40 },
    'veo3': { video: 0.20, audio: 0.40 }
  };

  const rate = videoRates[model] || videoRates['veo31'];
  const includeAudio = true;  // Usually want audio

  // Calculate video cost
  const totalSeconds = clips.reduce((sum, c) => sum + c.duration, 0);
  const videoCost = totalSeconds * (includeAudio ? rate.audio : rate.video);

  // Total
  const totalCost = keyframes.imageCost + videoCost;

  return {
    keyframeCost: keyframes.imageCost,
    videoCost,
    totalCost,
    breakdown: {
      images: `${keyframes.totalImages} × $0.067 = $${keyframes.imageCost.toFixed(2)}`,
      video: `${totalSeconds}s × $${rate.audio}/s = $${videoCost.toFixed(2)}`,
      total: `$${totalCost.toFixed(2)}`
    }
  };
}
```

### Quick Reference Table

| Duration | Clips | Keyframes (typical) | Video Cost | Total |
|----------|-------|---------------------|------------|-------|
| 15s | 3 | 4-6 | $6.00 | ~$6.50 |
| 30s | 5 | 6-8 | $12.00 | ~$12.50 |
| 45s | 6-7 | 8-10 | $18.00 | ~$18.70 |
| 60s | 8-10 | 10-14 | $24.00 | ~$25.00 |

---

## STEP 5: Ask About Character/Subject

**Ask the user:**

> Does your video feature:
>
> 1. **A person/character** - Need consistent character across clips
> 2. **Product only** - Product shots, no people
> 3. **Abstract/Motion** - Graphics, visualizations, no specific subject
> 4. **Mixed** - Combination of above

**Store answer as**: `subjectType`

**If answer is "A person/character" or "Mixed"**: → Go to STEP 5B (Character Setup)
**Otherwise**: → Skip to STEP 6

---

## STEP 5B: Character & Environment Setup (Required for Consistency)

**CRITICAL**: If video has a character, you MUST complete this step before ANY generation.

### 5B.0: Resolve from the asset registry FIRST

Before describing a character from scratch, check the registry — a locked character may
already exist (and the content plan's `assets.character_id` may name it):

```typescript
import { loadAssetConfig, resolveAsset, registerAsset } from '../../workflows/dist/index.js';
const char = resolveAsset(loadAssetConfig('{name}'), planAssets.character_id || 'char-main');
```

- `char.ok` → **reuse** `char.existing[...]` as reference images and SKIP the describe-and-
  generate steps below. Do not re-describe a locked character.
- not found → continue with 5B.1–5B.4 to define + generate, then call
  `generateCharacterSheet(...)` and `registerAsset('{name}', 'characters', { …, locked:true })`
  so every later piece reuses the exact files.

### 5B.1: Ask Character Details

**Ask the user:**

> Describe the main character:
> - Gender and age?
> - Hair (color, length, style)?
> - Clothing (be specific with colors)?
> - Any accessories (glasses, watch, jewelry)?

### 5B.2: Ask Environment Details

**Ask the user:**

> Describe the main setting:
> - Location (office, home, studio)?
> - Key furniture (desk, chair type)?
> - Background elements (wall color, window, plants)?
> - Props that should appear (laptop, books, coffee)?

### 5B.3: Create Style Guide

**Build a locked style guide (store for all prompts):**

```yaml
CHARACTER:
  description: "[age] [gender] with [hair description]"
  clothing: "[exact clothing with colors]"
  accessories: "[watch, earrings, glasses, etc.]"

ENVIRONMENT:
  location: "[setting type]"
  desk: "[desk description]"
  background: "[wall, window, decorations]"
  props: "[items that appear in every scene]"

LIGHTING_PROGRESSION:
  scene_1: "[lighting for problem/setup]"
  scene_2: "[lighting for discovery]"
  scene_3: "[lighting for transformation]"
  scene_4: "[lighting for success]"

SCREEN_CONTENT:
  scene_1: "[what's on screen - problem state]"
  scene_2: "[what's on screen - solution appears]"
  scene_3: "[what's on screen - progress]"
  scene_4: "[what's on screen - success result]"
```

### 5B.4: Create Prompt Blocks

**Create reusable blocks for ALL prompts:**

```
CHARACTER_BLOCK = """
[full character description from style guide]
"""

ENVIRONMENT_BLOCK = """
[full environment description from style guide]
"""
```

**These blocks are copy-pasted into EVERY scene prompt to ensure consistency.**

---

## STEP 5C: Ask About Audio & Speech

**CRITICAL: Ask this BEFORE generating videos!**

**Ask the user:**

> What audio does your video need?
>
> 1. **Character speaks in video** - Person on-screen talks (Veo generates speech)
> 2. **Voiceover narration** - Off-screen narrator (use TTS separately)
> 3. **Music only** - Just background music, no speech
> 4. **Silent** - No audio, will add later

**Store answer as**: `audioType`

---

### Option 1: Character Speaking In Video (Veo generates speech)

**Veo CAN generate character dialogue!** Include in the video prompt:
- What they say (exact dialogue)
- Voice characteristics (gender, age, tone, accent, style)

**Ask for dialogue:**

> What should the character say in each scene?
>
> Scene 1: "___"
> Scene 2: "___"
> ...

**Ask voice characteristics:**

> Describe the character's voice:
> - Gender? (male / female)
> - Age range? (young 20s / mid 30s / mature 50s)
> - Tone? (warm / authoritative / energetic / calm / excited)
> - Accent? (neutral American / British / Australian / etc.)
> - Style? (professional / casual / friendly / serious)

**Store as**: `characterVoice`

**Add to video prompt:**

```
The character says "{dialogue}" in a {tone}, {style} {gender} voice,
{age_range}, {accent} accent.
```

**Example prompt:**
```
Young Asian woman at desk looks at camera and says
"Struggling with this? I was too, until I found a solution."
in a warm, friendly female voice, early 20s, natural accent,
conversational and relatable tone.
```

---

### Option 2: Voiceover Narration (Off-screen, use TTS)

**For off-screen narrator voice, generate separately with TTS:**

**Ask for script:**

> What should the narrator say?
>
> For a {totalDuration}s video, aim for ~{totalDuration * 2.5} words.

**Store script as**: `voiceoverScript`

**Ask voice preference:**

> What voice style for narrator?
>
> 1. **Professional female** (Kore) - Clear, authoritative
> 2. **Professional male** (Charon) - Deep, trustworthy
> 3. **Friendly female** (Aoede) - Warm, approachable
> 4. **Friendly male** (Puck) - Casual, relatable
> 5. **Energetic** (Zephyr) - Upbeat, exciting

**Store as**: `voiceStyle`

**Then SUGGEST + CONFIRM the full voiceover setup before generating (don't auto-run):**
voice · style · pace · accent · optional audio-profile description · script (check it fits
the duration) · pronunciation of brand/foreign words · music-under-VO (and volume). Present
it as one summary and let the user adjust any field. Reuse the project's locked voice (or
the on-screen character's `linked_voice`) if one exists — but still confirm it. See
`skills/generate-voiceover/SKILL.md` Steps 1c–3 for the full flow.

**Generate after video, combine with ffmpeg.**

---

## STEP 6: Load Content Type Guide

Based on `contentType`, read the appropriate workflow guide:

| Content Type | Guide File |
|--------------|------------|
| Storytelling | `workflows/01-storytelling.md` |
| Advertisement | `workflows/02-ads-commercial.md` |
| Explainer | `workflows/03-explainer.md` |
| Social Media | `workflows/04-social-media.md` |

**Present the relevant structure options to user.**

---

## STEP 6B: Define Scene Continuity

**After defining scenes, ask about continuity:**

> Looking at your scenes:
>
> Scene 1: [description]
> Scene 2: [description]
> Scene 3: [description]
> Scene 4: [description]
>
> Which scenes CONTINUE from the previous? (same location, same moment)
> Which scenes are NEW? (location change, time jump, different setting)
>
> Example:
> - Scene 1 → Scene 2: Continues (same desk, reaction shot)
> - Scene 2 → Scene 3: NEW (moves to exam room)
> - Scene 3 → Scene 4: Continues (still in exam room)

**Mark each scene:**

| Scene | Continues From | Reason |
|-------|----------------|--------|
| 1 | - | First scene |
| 2 | Scene 1 | Same desk, immediate reaction |
| 3 | - | New location (exam room) |
| 4 | Scene 3 | Same exam room, result moment |

**Benefits of marking continuity:**
- Fewer keyframes to generate (saves cost)
- Better visual flow between clips
- Character stays more consistent

---

## STEP 7: Confirm Before Generation

**Agent auto-calculates and shows summary:**

```
📋 VIDEO GENERATION PLAN
════════════════════════════════════════════════════════

BASICS
├── Content Type: {contentType}
├── Platform: {platform}
├── Aspect Ratio: {aspectRatio}
└── Total Duration: {totalDuration} seconds

CLIP BREAKDOWN (auto-calculated)
├── Optimal clip length: {clipDuration}s ({reasoning})
├── Number of clips: {clipCount}
│
├── Clip 1: {duration}s - {sceneName} (NEW)
├── Clip 2: {duration}s - {sceneName} (continues)
├── Clip 3: {duration}s - {sceneName} (NEW)
└── Clip 4: {duration}s - {sceneName} (continues)

KEYFRAMES (auto-calculated)
├── New scenes: {newSceneCount} scenes × 2 imgs = {newSceneImages} images
├── Continuing: {continueCount} scenes × 1 img  = {continueImages} images
├── Total images: {totalImages}
└── Image cost: {totalImages} × $0.067 = ${imageCost}

VIDEO GENERATION
├── Model: Veo 3.1 (with audio) — fallback: Veo 3.1 Lite if quota hit
├── Rate: $0.40/second (Lite: $0.05/second)
├── Total seconds: {totalSeconds}s
└── Video cost: {totalSeconds} × $0.40 = ${videoCost}

AUDIO
├── Type: {audioType}
│   ├── Character speaks: Include dialogue in video prompt
│   └── Voiceover: Generate with TTS, combine with ffmpeg
├── Dialogue/Script: "{script}"
├── Voice: {voiceDescription}
└── TTS cost (if voiceover): ~$0.01

════════════════════════════════════════════════════════
TOTAL ESTIMATED COST: ${totalCost}
════════════════════════════════════════════════════════

Proceed? (yes / no / adjust)
```

### If User Says "adjust"

**Ask what to change:**

> What would you like to adjust?
>
> 1. **Clip duration** - Make clips shorter (4-5s) or longer (7-8s)
> 2. **Number of clips** - Add or remove scenes
> 3. **Model** - Use Veo 3.1 Lite (cheaper: $0.05/s) or Veo 3 (same price, higher quality)
> 4. **Continuity** - Change which scenes continue vs. new

**Recalculate after adjustment.**

---

## STEP 8: Generate Content

### Route Based on Subject Type:

- **Has Character** → Go to STEP 8A (Keyframe Workflow)
- **No Character** → Go to STEP 8B (Direct Generation)

---

## STEP 8A: Keyframe Workflow (For Character Consistency)

**MANDATORY when video has people/characters.**

### 8A.1: Define All Scenes + Continuity

For each clip, define AND mark if it continues from previous:

```yaml
scenes:
  - id: 1
    name: "struggle"
    continues_from: null  # First scene, needs keyframes
    emotion: "frustrated"
    action: "looking at screen, rubbing eyes"
    screen_content: "error messages, low score"
    lighting: "harsh blue monitor glow"
    camera: "slow push in"

  - id: 2
    name: "discovery"
    continues_from: 1  # ← Continues from scene 1, reuse end frame
    emotion: "curious, hopeful"
    action: "leaning forward, eyebrows raised"
    screen_content: "solution/product appearing"
    lighting: "softer, cyan accent appearing"
    camera: "gentle orbit"

  - id: 3
    name: "new_location"
    continues_from: null  # ← Scene change, needs new keyframes
    emotion: "confident"
    action: "walking into exam room"
    screen_content: null
    lighting: "bright, clean"
    camera: "wide shot"

  # ... continue for all clips
```

### Continuity Types

| Type | `continues_from` | Keyframes Needed |
|------|------------------|------------------|
| **New Scene** | `null` | Start + End frames |
| **Continues** | `previous_id` | End frame only (start = prev end) |
| **Same Scene, Cut** | `previous_id` | None (just generate video) |

### 8A.2: Generate Keyframe Images (Smart Continuity)

**Only generate what's needed based on continuity:**

```typescript
import { gemini31FlashImage } from '../../gemini';

for (const scene of scenes) {

  // ─────────────────────────────────────────────────────
  // START FRAME: Skip if continues from previous scene
  // ─────────────────────────────────────────────────────
  if (scene.continues_from === null) {
    // New scene - generate start frame
    const startPrompt = `
      Cinematic ${scene.name} scene opening frame.
      ${CHARACTER_BLOCK}
      ${ENVIRONMENT_BLOCK}
      ${scene.action} - beginning of motion.
      Expression: ${scene.emotion} starting to show.
      Screen shows: ${scene.screen_content}.
      ${scene.lighting}.
      Photorealistic, cinematic, ${aspectRatio} aspect ratio.
    `;

    const startFrame = await gemini31FlashImage({
      userPrompt: startPrompt,
      config: { imageSize: '1K', aspectRatio: aspectRatio }
    });

    fs.writeFileSync(`scene${scene.id}-${scene.name}-start.png`, startFrame.data.images[0].data);
    console.log(`✓ Scene ${scene.id} start frame (new scene)`);

  } else {
    // Continues from previous - copy previous end frame as start
    const prevEndFrame = `scene${scene.continues_from}-*-end.png`;
    fs.copyFileSync(prevEndFrame, `scene${scene.id}-${scene.name}-start.png`);
    console.log(`↳ Scene ${scene.id} start = Scene ${scene.continues_from} end (continuous)`);
  }

  // ─────────────────────────────────────────────────────
  // END FRAME: Always generate (shows progression)
  // ─────────────────────────────────────────────────────
  const endPrompt = `
    Cinematic ${scene.name} scene closing frame.
    ${CHARACTER_BLOCK}
    ${ENVIRONMENT_BLOCK}
    ${scene.action} - peak of motion.
    Expression: ${scene.emotion} at full intensity.
    Screen shows: ${scene.screen_content}.
    ${scene.lighting}.
    Photorealistic, cinematic, ${aspectRatio} aspect ratio.
  `;

  const endFrame = await gemini31FlashImage({
    userPrompt: endPrompt,
    config: { imageSize: '1K', aspectRatio: aspectRatio }
  });

  fs.writeFileSync(`scene${scene.id}-${scene.name}-end.png`, endFrame.data.images[0].data);
  console.log(`✓ Scene ${scene.id} end frame`);
}
```

### Keyframe Generation Summary

```
Scene 1 (new):       Generate START + END     = 2 images
Scene 2 (continues): Copy prev END + Generate END = 1 image
Scene 3 (new):       Generate START + END     = 2 images
Scene 4 (continues): Copy prev END + Generate END = 1 image
─────────────────────────────────────────────────────────
Total: 6 images instead of 8 (saves ~$0.13)
```

### 8A.3: Review Keyframes With User

**STOP and show user all keyframe images:**

```
📋 KEYFRAME REVIEW
==================
Scene 1: struggle
  - Start: scene1-struggle-start.png
  - End: scene1-struggle-end.png

Scene 2: discovery
  - Start: scene2-discovery-start.png
  - End: scene2-discovery-end.png

[... show all frames]

✅ Check:
- Same character in all frames?
- Same environment/room?
- Expressions match the emotion?
- Lighting progression makes sense?

Proceed to video generation? (yes/no/redo scene X)
```

**If user says "redo scene X"**: Regenerate that scene's keyframes with adjusted prompt.

### 8A.4: Generate Videos Using Keyframes

**Only after keyframes are approved:**

```typescript
import { veo31 } from '../../gemini';

for (const scene of scenes) {
  // Read the approved start frame as reference
  const startFrame = fs.readFileSync(`scene${scene.id}-${scene.name}-start.png`);

  // Build video prompt with SAME character/environment blocks
  const videoPrompt = `
    Cinematic shot of ${CHARACTER_BLOCK}
    ${ENVIRONMENT_BLOCK}.
    Action: ${scene.action}.
    Emotion progresses through: ${scene.emotion}.
    Screen displays: ${scene.screen_content}.
    ${scene.lighting}.
    ${scene.camera}.
    Cinematic quality, consistent with reference image.
  `;

  const result = await veo31(videoPrompt, {
    referenceImage: startFrame,
    referenceImageMimeType: 'image/png',
    aspectRatio: aspectRatio,
    resolution: '1080p',
    durationSeconds: 8,
  });

  fs.writeFileSync(`scene${scene.id}-${scene.name}.mp4`, result.data.videos[0].data);

  console.log(`✓ Scene ${scene.id} generated`);
}
```

### 8A.5: Final Review

**Show user all generated videos:**

```
📋 VIDEO REVIEW
===============
✓ scene1-struggle.mp4 (8s)
✓ scene2-discovery.mp4 (8s)
✓ scene3-transformation.mp4 (8s)
✓ scene4-result.mp4 (8s)

Total: 32 seconds
Cost: $12.80

Combine into final video? (yes/no/redo scene X)
```

---

## STEP 8B: Direct Generation (No Character)

**For abstract, product-only, or motion graphics videos:**

```typescript
import { veo31 } from '../../gemini';

for (const scene of scenes) {
  const result = await veo31(scene.prompt, {
    aspectRatio: aspectRatio,
    resolution: '1080p',
    durationSeconds: 8,
  });

  fs.writeFileSync(`scene-${scene.id}.mp4`, result.data.videos[0].data);
}
```

---

## Platform Quick Reference

| Platform | Aspect | Duration | Hook | Style |
|----------|--------|----------|------|-------|
| TikTok | 9:16 | 15-60s | 0.5s | Casual, trendy |
| IG Reels | 9:16 | 15-90s | 1s | Polished, aesthetic |
| IG Feed | 1:1, 4:5 | 15-60s | 1s | Clean, branded |
| YT Shorts | 9:16 | 15-60s | 1s | Educational |
| YT Long | 16:9 | 60s+ | 5s | Cinematic |
| Facebook | 1:1, 16:9 | 15-120s | 1s | Shareable |
| LinkedIn | 16:9 | 30-120s | 3s | Professional |

---

## STEP 9: Audio Options Summary

### Character Speaking In Video (Veo handles it)

**Include dialogue + voice description in video prompt:**

```typescript
const videoPrompt = `
  ${CHARACTER_BLOCK}
  ${ENVIRONMENT_BLOCK}

  The character looks at camera and says "${dialogue}"
  in a ${tone}, ${style} ${gender} voice, ${age_range}, ${accent} accent.

  Natural lip movements, expressive delivery, authentic emotion.
`;

const result = await generateVideo({
  model: 'veo-3.1-generate-preview',
  prompt: videoPrompt,
  // ... config
});
```

**Voice description elements:**
- Gender: male / female
- Age: young (20s) / mid (30s-40s) / mature (50s+)
- Tone: warm / authoritative / energetic / calm / excited / serious
- Style: professional / casual / friendly / conversational
- Accent: neutral American / British RP / Australian / etc.

---

### Voiceover Narration (Off-screen, use TTS)

**For narrator voice over the video:**

```typescript
import { textToSpeech } from '../../gemini';

const voiceOptions = {
  professional_female: 'Kore',
  professional_male: 'Charon',
  friendly_female: 'Aoede',
  friendly_male: 'Puck',
  energetic: 'Zephyr',
};

const result = await textToSpeech(script, voiceOptions[selectedVoice], {
  speakingRate: 0.95,
});

fs.writeFileSync(path.join(OUTPUT.audio, 'voiceover.wav'), result.data.audio.data);
```

### 9.4: Combine Video + Audio (for voiceover)

**After all clips generated, combine with ffmpeg:**

```bash
# Concatenate video clips
ffmpeg -f concat -safe 0 -i concat-list.txt -c copy combined.mp4

# Mix voiceover with background music (music at 30% volume)
ffmpeg -i combined.mp4 -i voiceover.wav \
  -filter_complex "[0:a]volume=0.3[music];[1:a]volume=1.0[voice];[music][voice]amix=inputs=2:duration=first[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a aac \
  final-with-voiceover.mp4
```

**Or replace audio entirely:**

```bash
# Replace video audio with voiceover only
ffmpeg -i combined.mp4 -i voiceover.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac \
  final-voiceover-only.mp4
```

---

## Model Fallback Strategy

**Use fallbacks when quota is exceeded or for cost savings:**

### Fallback Order

```
Veo 3.1 ($0.40/s) → Veo 3.1 Lite ($0.05/s) → Retry later
```

### When to Use Each Model

| Model | Best For | Cost | Quality |
|-------|----------|------|---------|
| **Veo 3.1** | Hero shots, main scenes | $0.40/s | Highest |
| **Veo 3.1 Lite** | Supporting scenes, drafts, fallback | $0.05/s | Good |
| **Veo 3** | Maximum quality needs | $0.40/s | Highest+ |

### Implement Fallback

```typescript
async function generateVideoWithFallback(prompt: string, config: VeoConfig) {
  const models = [
    'veo-3.1-generate-preview',      // Try first
    'veo-3.1-lite-generate-preview', // Fallback (cheaper, separate quota)
  ];

  for (const model of models) {
    try {
      const result = await generateVideo({
        model,
        prompt,
        config,
      });

      if (result.success) {
        console.log(`✓ Generated with ${model}`);
        return result;
      }

      // Check for quota error
      if (result.error?.message?.includes('quota') ||
          result.error?.message?.includes('RESOURCE_EXHAUSTED')) {
        console.log(`⚠ ${model} quota exceeded, trying fallback...`);
        continue;
      }

      // Other error - don't retry
      return result;

    } catch (error) {
      console.log(`⚠ ${model} failed, trying fallback...`);
      continue;
    }
  }

  return { success: false, error: 'All models exhausted' };
}
```

### Mixed Model Strategy (Cost Optimization)

For longer videos, use premium model for key scenes:

```typescript
const scenes = [
  { id: 1, name: 'hook',    model: 'veo-3.1', importance: 'high' },   // $0.40/s
  { id: 2, name: 'problem', model: 'veo-3.1-lite', importance: 'med' }, // $0.05/s
  { id: 3, name: 'solution', model: 'veo-3.1-lite', importance: 'med' },
  { id: 4, name: 'cta',     model: 'veo-3.1', importance: 'high' },   // $0.40/s
];

// Hook + CTA in premium, middle scenes in lite
// 24s video: (6s × $0.40) + (12s × $0.05) = $2.40 + $0.60 = $3.00
// vs all premium: 24s × $0.40 = $9.60
// Savings: 69%
```

---

## Cost Reference

| Model | Video Only | With Audio | Notes |
|-------|------------|------------|-------|
| Veo 3.1 Lite | $0.03/sec | $0.05/sec | Fast, good for drafts/fallback |
| Veo 3.1 | $0.20/sec | $0.40/sec | Balanced quality/cost |
| Veo 3 | $0.20/sec | $0.40/sec | Highest quality |

**Per 6-second clip:**
- Lite: $0.18 - $0.30
- Standard: $1.20 - $2.40

**Voiceover (TTS):** ~$0.001 per sentence
