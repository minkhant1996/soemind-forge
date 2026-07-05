# Assets Guide

> **What to store, where to store it, and how to register it for reuse.**

This guide helps both **users** (what to provide) and **agents** (what to generate and save) maintain consistent brand assets across all content.

---

## Why Store Assets?

**Problem:** Every AI generation creates NEW random results.
- New character = different face every time
- New logo = inconsistent branding
- New style = visual chaos

**Solution:** Store reference assets and reuse them.
- Same character reference = consistent face
- Same logo = brand recognition
- Same style reference = cohesive look

---

## Asset Folder Structure

```
projects/{name}/
├── assets/
│   ├── characters/          # People, mascots, avatars
│   │   ├── char-founder-front.png
│   │   ├── char-founder-side.png
│   │   └── char-mascot.png
│   │
│   ├── products/            # Physical products, screenshots, mockups
│   │   ├── prod-main-hero.png
│   │   ├── prod-main-angle.png
│   │   └── prod-app-screenshot.png
│   │
│   ├── logos/               # All logo variations
│   │   ├── logo-full.png
│   │   ├── logo-icon.png
│   │   ├── logo-wordmark.png
│   │   ├── logo-white.png
│   │   └── logo-black.png
│   │
│   ├── backgrounds/         # Reusable backgrounds, locations
│   │   ├── bg-office.png
│   │   ├── bg-studio.png
│   │   └── bg-lifestyle.png
│   │
│   ├── thumbnails/          # Reference thumbnails for consistency
│   │   ├── thumb-template-face.png
│   │   └── thumb-template-product.png
│   │
│   ├── style-refs/          # Visual style references, mood boards
│   │   ├── style-brand-moodboard.png
│   │   ├── style-color-palette.png
│   │   └── style-typography.png
│   │
│   ├── social/              # Social media assets
│   │   ├── profiles/
│   │   ├── covers/
│   │   ├── highlights/
│   │   └── watermarks/
│   │
│   ├── audio/               # Voice samples, music, sound effects
│   │   ├── voice-founder-sample.wav
│   │   ├── music-brand-jingle.wav
│   │   └── sfx-notification.wav
│   │
│   ├── icons/               # UI icons, app icons
│   │   ├── icon-app.png
│   │   └── icon-set/
│   │
│   └── overlays/            # Text overlays, watermarks, lower thirds
│       ├── overlay-logo-corner.png
│       └── overlay-cta.png
│
├── config/
│   └── assets.yaml          # Asset registry (auto-managed)
│
└── templates/
    ├── project.md           # Project brief
    └── brand.md             # Brand guidelines
```

---

## Asset Types Reference

### 1. Characters (`assets/characters/`)

**What to store:**
- Main spokesperson/founder
- Brand mascot
- Recurring actors/models
- AI-generated characters (lock after approval)

**Recommended angles:**
- `front` - Facing camera (for thumbnails, profile pics)
- `three-quarter` - 3/4 view (most versatile)
- `side` - Profile view
- `full-body` - Head to toe

**Naming convention:**
```
char-{id}-{angle}.png

Examples:
char-founder-front.png
char-founder-three-quarter.png
char-mascot-front.png
char-model-sarah-front.png
```

**User provides:**
- Real photos of themselves/team
- Existing brand mascot images
- Reference images for desired look

**Agent generates:**
- Character keyframes from descriptions
- Additional angles from reference
- Character sheet (multiple poses)

**Registry entry:**
```yaml
characters:
  - id: char-founder
    label: "Founder - Sarah"
    description: "Woman, early 30s, dark hair, professional attire"
    source: provided  # or 'generated'
    status: ready
    locked: true      # Prevent regeneration
    files:
      front: assets/characters/char-founder-front.png
      three_quarter: assets/characters/char-founder-34.png
    linked_voice: voice-founder  # Link to voice asset
```

---

### 2. Products (`assets/products/`)

**What to store:**
- Hero product shots
- Product in use
- Product details/close-ups
- App screenshots
- Physical product photos

**Recommended shots:**
- `hero` - Main product shot
- `angle` - Alternative angle
- `detail` - Close-up features
- `in-use` - Lifestyle context
- `packaging` - Box/packaging

**Naming convention:**
```
prod-{id}-{shot}.png

Examples:
prod-main-hero.png
prod-main-detail.png
prod-app-home.png
prod-app-dashboard.png
```

**User provides:**
- Real product photos (preferred)
- App screenshots
- Packaging images

**Agent generates:**
- Product mockups (pre-launch only)
- Lifestyle contexts with product
- Product variations

**Registry entry:**
```yaml
products:
  - id: prod-main
    label: "Smart Watch Pro"
    description: "Premium smartwatch, silver case, black band"
    source: provided
    status: ready
    files:
      hero: assets/products/prod-main-hero.png
      angle: assets/products/prod-main-angle.png
    key_features:
      - "Heart rate monitor"
      - "GPS tracking"
      - "7-day battery"
```

---

### 3. Logos (`assets/logos/`)

**What to store:**
- Full logo (icon + wordmark)
- Icon only (for profile pics)
- Wordmark only (text)
- Horizontal layout
- Stacked layout
- White version (dark backgrounds)
- Black version (light backgrounds)
- Favicon/app icon

**Naming convention:**
```
logo-{variant}.png

Examples:
logo-full.png
logo-icon.png
logo-wordmark.png
logo-horizontal.png
logo-stacked.png
logo-white.png
logo-black.png
logo-favicon.png
```

**User provides:**
- Existing brand logos (always preferred)
- Vector files if available (SVG, AI, EPS)

**Agent generates:**
- Logo variations from main logo
- Favicon from logo icon
- NEVER generate a new logo if one exists

**Registry entry:**
```yaml
logos:
  - id: logo-primary
    label: "Primary Logo Set"
    source: provided
    status: ready
    locked: true
    files:
      full: assets/logos/logo-full.png
      icon: assets/logos/logo-icon.png
      wordmark: assets/logos/logo-wordmark.png
      white: assets/logos/logo-white.png
    brand_colors:
      - "#4F46E5"
      - "#10B981"
      - "#FFFFFF"
```

---

### 4. Backgrounds (`assets/backgrounds/`)

**What to store:**
- Brand-consistent environments
- Studio setups
- Location references
- Abstract brand backgrounds

**Common backgrounds:**
- `office` - Professional office setting
- `studio` - Clean studio backdrop
- `home` - Home/lifestyle setting
- `outdoor` - Outdoor locations
- `abstract` - Brand-colored abstract

**Naming convention:**
```
bg-{description}.png

Examples:
bg-modern-office.png
bg-home-living-room.png
bg-studio-white.png
bg-gradient-brand.png
```

**User provides:**
- Real location photos
- Preferred environment references

**Agent generates:**
- Matching backgrounds for video scenes
- Abstract brand backgrounds

---

### 5. Thumbnails (`assets/thumbnails/`)

**What to store:**
- Thumbnail templates
- Approved thumbnail styles
- Reference thumbnails

**Purpose:** Maintain consistent thumbnail style across content.

**Naming convention:**
```
thumb-{style}-{description}.png

Examples:
thumb-face-emotion-template.png
thumb-before-after-template.png
thumb-product-hero-template.png
```

**User provides:**
- Existing successful thumbnails
- Competitor thumbnails they like

**Agent generates:**
- Thumbnail keyframes (cheap previews)
- Final thumbnails (after approval)

---

### 6. Style References (`assets/style-refs/`)

**What to store:**
- Mood boards
- Color palettes
- Typography samples
- Visual style examples
- Competitor references

**Purpose:** Guide AI to match desired aesthetic.

**Naming convention:**
```
style-{type}.png

Examples:
style-moodboard.png
style-color-palette.png
style-typography.png
style-reference-competitor.png
```

**User provides:**
- Pinterest boards / mood boards
- Screenshots of admired styles
- Color palette images

**Agent generates:**
- Style guide visualizations
- Color palette cards

---

### 7. Social Assets (`assets/social/`)

**Structure:**
```
social/
├── profiles/         # Profile pictures per platform
├── covers/           # Cover/banner images
├── highlights/       # Instagram highlight icons
└── watermarks/       # Video watermarks
```

**Generated by:** `generateBrandAssets()` function

---

### 8. Audio Assets (`assets/audio/`)

**What to store:**
- Voice samples (for TTS matching)
- Brand music/jingles
- Sound effects
- Podcast intros/outros

**Naming convention:**
```
{type}-{description}.wav

Examples:
voice-founder-sample.wav
music-brand-jingle.wav
music-background-upbeat.wav
sfx-notification.wav
sfx-whoosh.wav
```

**User provides:**
- Existing audio assets
- Voice recordings for cloning reference

**Agent generates:**
- TTS voiceovers
- Background music (Lyria)
- Music stems

**Registry entry:**
```yaml
voices:
  - id: voice-founder
    label: "Founder Voice"
    tts_voice: Kore
    style: professional_friendly
    description: "Warm, confident, early 30s female"
    sample_path: assets/audio/voice-founder-sample.wav

music:
  - id: music-brand
    label: "Brand Jingle"
    style: upbeat corporate
    duration: 15
    path: assets/audio/music-brand-jingle.wav
```

---

### 9. Icons (`assets/icons/`)

**What to store:**
- App icon
- Favicon
- UI icon sets
- Social media icons

---

### 10. Overlays (`assets/overlays/`)

**What to store:**
- Logo watermarks (corner placement)
- CTA overlays
- Lower thirds
- End cards

**Purpose:** Post-production elements added via FFmpeg.

---

## User Guide: What to Provide

### Essential (Start Here)

| Asset | Priority | Why |
|-------|----------|-----|
| **Logo** | Required | Brand recognition |
| **Product photos** | Required | Accurate representation |
| **Brand colors** | Required | Visual consistency |
| **Founder photo** (if personal brand) | High | Character consistency |

### Recommended

| Asset | Priority | Why |
|-------|----------|-----|
| Voice sample | High | TTS matching |
| Style references | Medium | Visual direction |
| Existing thumbnails | Medium | Style consistency |
| Background preferences | Medium | Scene consistency |

### Optional

| Asset | Priority | Why |
|-------|----------|-----|
| Music/jingles | Low | Audio branding |
| Font samples | Low | Reference only (AI can't use custom fonts) |
| Competitor examples | Low | Style direction |

---

## Agent Guide: What to Generate & Save

### Always Save (Register)

| When You Generate | Save To | Register As |
|-------------------|---------|-------------|
| Character keyframe | `assets/characters/` | `characters` collection |
| Product mockup | `assets/products/` | `products` collection |
| Approved thumbnail | `assets/thumbnails/` | Reference for future |
| Social profiles/covers | `assets/social/` | `social` collection |
| Voice settings | `config/assets.yaml` | `voices` collection |
| Background scene | `assets/backgrounds/` | For scene reuse |
| Brand music | `assets/audio/` | `music` collection |

### Registration Code

```typescript
import { registerAsset } from '../../../workflows/dist/index.js';

// After generating a character
registerAsset('project-name', 'characters', {
  id: 'char-main',
  label: 'Main Character',
  description: 'Woman, 30s, dark hair, professional',
  source: 'generated',
  status: 'ready',
  locked: true,  // IMPORTANT: Lock to prevent regeneration
  files: {
    front: 'assets/characters/char-main-front.png',
  },
}, { date: '2024-01-15' });
```

### Lock Rule

**Lock assets that must stay consistent:**
- Characters (faces must match)
- Logos (brand identity)
- Voice settings (audio consistency)

**Don't lock assets that can vary:**
- Backgrounds (can be different per scene)
- Style references (inspiration only)

---

## Asset Resolution Flow

```
User Request: "Create a video with the founder speaking"
                    │
                    ▼
┌─────────────────────────────────────────┐
│  1. Check Asset Registry                │
│     resolveAsset(config, 'char-founder')│
└─────────────────────────────────────────┘
                    │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    Asset Found        Asset Missing
          │                 │
          ▼                 ▼
    Use existing     Ask user:
    reference        "Provide founder photo
          │           or generate character?"
          │                 │
          │         ┌───────┴───────┐
          │         │               │
          │         ▼               ▼
          │    User provides   Generate new
          │         │               │
          │         ▼               ▼
          │    Save to assets/  Save to assets/
          │         │               │
          │         ▼               ▼
          │    Register asset   Register asset
          │    (source:provided) (source:generated)
          │         │               │
          └─────────┴───────┬───────┘
                            │
                            ▼
              Use asset for generation
```

---

## Quick Reference: File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Character | `char-{id}-{angle}.png` | `char-founder-front.png` |
| Product | `prod-{id}-{shot}.png` | `prod-watch-hero.png` |
| Logo | `logo-{variant}.png` | `logo-icon.png` |
| Background | `bg-{description}.png` | `bg-modern-office.png` |
| Thumbnail | `thumb-{style}-{desc}.png` | `thumb-face-excited.png` |
| Voice | `voice-{id}-sample.wav` | `voice-founder-sample.wav` |
| Music | `music-{style}.wav` | `music-upbeat-jingle.wav` |
| Profile | `{platform}-profile.png` | `youtube-profile.png` |
| Cover | `{platform}-cover.png` | `facebook-cover.png` |

---

## Asset Validation

Before using any asset, the system validates:

1. **File exists** at the specified path
2. **Format is correct** (PNG for images, WAV for audio)
3. **No duplicate IDs** in registry
4. **Linked assets exist** (e.g., character's linked_voice)

Run validation:
```typescript
import { loadAssetConfig, validateAssets } from '../../../workflows/dist/index.js';

const config = loadAssetConfig('project-name');
const result = validateAssets(config);

if (!result.ok) {
  console.log('Issues:', result.issues);
}
```

---

## Checklist: Project Asset Setup

```
□ Logo provided (or generated)
□ Logo registered in assets.yaml
□ Product photos provided (if applicable)
□ Products registered
□ Character reference (if using people)
□ Character registered with locked: true
□ Voice settings configured
□ Brand colors in brand.md
□ Style references collected
□ Social assets generated (profiles, covers)
```
