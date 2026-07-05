# Brand Assets Guide

> **Generate consistent brand assets across all platforms.** Logos, profile images, cover images, and channel art — all with correct specs and consistent branding.

---

## Platform Specs Quick Reference

### Profile Images (Square/Circle Crop)

| Platform | Display Size | Upload Size | Safe Zone | Notes |
|----------|-------------|-------------|-----------|-------|
| **Facebook** | 176×176px | 320×320px | Center 70% | Circular crop |
| **Instagram** | 110×110px | 320×320px | Center 70% | Circular crop |
| **TikTok** | 200×200px | 200×200px | Center 70% | Circular crop |
| **YouTube** | 98×98px | 800×800px | Center 70% | Circular crop |
| **LinkedIn** | 200×200px | 400×400px | Center 70% | Circular crop |
| **Twitter/X** | 200×200px | 400×400px | Center 70% | Circular crop |
| **Pinterest** | 165×165px | 165×165px | Center 70% | Circular crop |

**Rule:** Always generate **1:1 square** at **800×800px minimum**. Keep logo/face in center 70% for circular crop safety.

---

### Cover Images / Banners

| Platform | Size | Safe Zone | Mobile Crop | Notes |
|----------|------|-----------|-------------|-------|
| **Facebook Page** | 820×312px | Center 640×312 | 640×360 | Desktop crops sides |
| **Facebook Profile** | 851×315px | Center 560×315 | 640×360 | Mobile shows less |
| **Facebook Group** | 1640×856px | Center 1200×630 | Variable | Large hero |
| **Facebook Event** | 1920×1005px | Center 1200×628 | Variable | Event header |
| **Instagram** | N/A | — | — | No cover (use highlights) |
| **TikTok** | N/A | — | — | No cover (videos only) |
| **YouTube Banner** | 2560×1440px | Center 1546×423 | 1546×423 | TV shows full, mobile crops |
| **YouTube Thumbnail** | 1280×720px | Full | Full | 16:9 |
| **LinkedIn Personal** | 1584×396px | Center 1200×300 | Variable | 4:1 ratio |
| **LinkedIn Company** | 1128×191px | Center 900×191 | Variable | Wide banner |
| **Twitter/X Header** | 1500×500px | Center 1200×400 | 600×200 | 3:1 ratio |
| **Pinterest Board** | 800×450px | Full | Full | 16:9 |

---

## Asset Types & Generation

### 1. Logo Variations

Every brand needs multiple logo formats:

```
assets/logos/
├── logo-full.png          # Full logo (icon + wordmark)
├── logo-icon.png          # Icon only (for profile pics)
├── logo-wordmark.png      # Text only
├── logo-horizontal.png    # Wide format (for banners)
├── logo-stacked.png       # Vertical stack (icon over text)
├── logo-white.png         # White version (dark backgrounds)
├── logo-black.png         # Black version (light backgrounds)
└── logo-favicon.png       # 512×512 favicon/app icon
```

**Generation prompt template:**
```
[Logo type] logo for [brand name], [style] design,
[color palette], clean vector style, centered,
transparent background, professional branding
```

### 2. Profile Images

| Type | Best For | Prompt Focus |
|------|----------|--------------|
| **Logo icon** | Companies, products | Clean icon, readable at small size |
| **Founder face** | Personal brands | Professional headshot, friendly expression |
| **Character/mascot** | Fun brands | Mascot close-up, recognizable |
| **Monogram** | Luxury/minimal | Initials, elegant typography |

**Generation requirements:**
- Aspect ratio: `1:1`
- Size: `1K` or `2K`
- Safe zone: Keep subject in center 70%

### 3. Cover Images

| Platform | Aspect | Key Considerations |
|----------|--------|-------------------|
| Facebook | 2.63:1 | Text in center, CTA on right |
| YouTube | 16:9 base, crops to 6:1 | Safe zone critical, no text at edges |
| LinkedIn | 4:1 | Professional, subtle branding |
| Twitter | 3:1 | Clean, minimal text |

**Generation requirements:**
- Always check mobile crop preview
- Keep text/CTA in safe zone
- Use brand colors prominently
- Include subtle logo placement

---

## Workflow Functions

```typescript
import {
  generateBrandAssets,
  generateProfileImage,
  generateCoverImage,
  generateLogoVariations,
} from '../../../workflows/dist/index.js';
```

### Generate Complete Brand Asset Set

```typescript
const result = await generateBrandAssets({
  projectName: 'my-brand',
  brandName: 'SoeMind',
  tagline: 'Build smarter, not harder',
  style: 'modern minimalist',
  primaryColor: '#4F46E5',
  secondaryColor: '#10B981',
  logoPath: 'assets/logos/logo-icon.png',  // existing logo
  platforms: ['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok'],
  includeCovers: true,
  includeProfiles: true,
});
// Generates all platform-specific assets in one batch
```

### Generate Profile Image

```typescript
// Option 1: From existing logo
const profile = await generateProfileImage({
  type: 'logo',
  logoPath: 'assets/logos/logo-icon.png',
  backgroundColor: '#4F46E5',
  platforms: ['facebook', 'instagram', 'youtube'],
  outputDir: 'projects/my-brand/assets/social/profiles',
});

// Option 2: Founder/person profile
const founderProfile = await generateProfileImage({
  type: 'person',
  referenceImagePath: 'assets/characters/founder.png',
  style: 'professional headshot, friendly smile',
  platforms: ['linkedin', 'twitter'],
  outputDir: 'projects/my-brand/assets/social/profiles',
});

// Option 3: Generate new (no reference)
const newProfile = await generateProfileImage({
  type: 'logo',
  prompt: 'Modern geometric logo, letter S, gradient purple to teal',
  platforms: ['all'],
  outputDir: 'projects/my-brand/assets/social/profiles',
});
```

### Generate Cover Image

```typescript
const cover = await generateCoverImage({
  platform: 'youtube',
  style: 'modern tech startup',
  headline: 'Build Your Startup in 4 Weeks',
  subheadline: 'AI-powered validation',
  logoPath: 'assets/logos/logo-horizontal.png',
  brandColors: ['#4F46E5', '#10B981'],
  outputPath: 'projects/my-brand/assets/social/covers/youtube-banner.png',
});
```

---

## Platform-Specific Templates

### Facebook Page Setup

```typescript
// Generate Facebook assets
const fbAssets = await generateBrandAssets({
  projectName: 'my-brand',
  platforms: ['facebook'],
  assets: {
    profile: {
      type: 'logo',
      logoPath: 'assets/logos/logo-icon.png',
    },
    cover: {
      style: 'professional service',
      headline: 'Your Tagline Here',
      cta: 'Learn More →',
    },
  },
});

// Output:
// - profiles/facebook-profile.png (320×320)
// - covers/facebook-cover.png (820×312)
```

### Instagram Setup

```typescript
const igAssets = await generateBrandAssets({
  projectName: 'my-brand',
  platforms: ['instagram'],
  assets: {
    profile: {
      type: 'logo',  // or 'person' for personal brand
      logoPath: 'assets/logos/logo-icon.png',
    },
    // Instagram has no cover, but we generate highlight covers
    highlights: {
      count: 5,
      style: 'minimal icons',
      categories: ['About', 'Products', 'Reviews', 'Tips', 'Contact'],
    },
  },
});

// Output:
// - profiles/instagram-profile.png (320×320)
// - highlights/highlight-about.png (1080×1920)
// - highlights/highlight-products.png (1080×1920)
// - etc.
```

### YouTube Channel Setup

```typescript
const ytAssets = await generateBrandAssets({
  projectName: 'my-brand',
  platforms: ['youtube'],
  assets: {
    profile: {
      type: 'logo',
      logoPath: 'assets/logos/logo-icon.png',
    },
    banner: {
      style: 'creator/educator',
      headline: 'Learn to Build Startups',
      schedule: 'New videos every Tuesday',
      socialHandles: '@soemind',
    },
    watermark: {
      logoPath: 'assets/logos/logo-icon.png',
      opacity: 0.7,
    },
  },
});

// Output:
// - profiles/youtube-profile.png (800×800)
// - covers/youtube-banner.png (2560×1440)
// - watermarks/youtube-watermark.png (150×150)
```

### TikTok Setup

```typescript
const ttAssets = await generateBrandAssets({
  projectName: 'my-brand',
  platforms: ['tiktok'],
  assets: {
    profile: {
      type: 'person',  // TikTok favors faces
      referenceImagePath: 'assets/characters/founder.png',
      style: 'friendly, approachable',
    },
    // TikTok has no banner/cover
  },
});

// Output:
// - profiles/tiktok-profile.png (200×200)
```

### LinkedIn Setup

```typescript
const liAssets = await generateBrandAssets({
  projectName: 'my-brand',
  platforms: ['linkedin'],
  assets: {
    // Personal profile
    personalProfile: {
      type: 'person',
      referenceImagePath: 'assets/characters/founder.png',
      style: 'professional headshot',
    },
    personalBanner: {
      style: 'professional abstract',
      headline: 'Helping founders validate faster',
    },
    // Company page
    companyProfile: {
      type: 'logo',
      logoPath: 'assets/logos/logo-icon.png',
    },
    companyBanner: {
      style: 'corporate modern',
      headline: 'SoeMind Foundry',
      tagline: 'From idea to validated startup in 4 weeks',
    },
  },
});

// Output:
// - profiles/linkedin-personal.png (400×400)
// - profiles/linkedin-company.png (400×400)
// - covers/linkedin-personal-banner.png (1584×396)
// - covers/linkedin-company-banner.png (1128×191)
```

---

## Safe Zone Templates

### YouTube Banner Safe Zone

```
┌─────────────────────────────────────────────────────────────────┐
│                         TV (2560×1440)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Desktop (2560×423)                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Mobile Safe (1546×423)                 │  │  │
│  │  │                                                     │  │  │
│  │  │     [LOGO]     YOUR CHANNEL NAME     [SOCIAL]      │  │  │
│  │  │                    Tagline                          │  │  │
│  │  │                                                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Keep ALL text and important elements within the center 1546×423 zone.**

### Facebook Cover Safe Zone

```
┌─────────────────────────────────────────────────────┐
│                 Desktop (820×312)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │           Mobile Safe (640×312)               │  │
│  │                                               │  │
│  │    [HEADLINE]        [CTA BUTTON]            │  │
│  │    Subheadline                               │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│ ┌─────┐                                             │
│ │PROF │  Profile pic overlaps bottom-left          │
│ └─────┘                                             │
└─────────────────────────────────────────────────────┘
```

**Avoid bottom-left corner (profile overlap). Keep CTA on right side.**

---

## Prompt Templates

### Logo Icon (Profile Use)

```
Minimalist logo icon, [brand initial or symbol],
[primary color] on [background color],
clean geometric design, scalable,
centered composition, professional branding,
suitable for circular crop at small sizes
```

### Professional Headshot (Founder Profile)

```
Professional headshot of [person from reference],
[expression: friendly smile / confident / approachable],
[attire: business casual / professional / creative],
clean neutral background, soft studio lighting,
shoulders up, facing camera, high quality,
suitable for circular profile crop
```

### Cover/Banner (Business)

```
Professional banner for [platform],
[brand style: modern tech / creative agency / professional service],
featuring [elements: abstract shapes / product imagery / lifestyle],
brand colors [list colors], subtle gradient,
clean negative space for text overlay,
[dimensions] aspect ratio
```

### Cover/Banner (Creator/Personal)

```
YouTube creator banner for [niche],
[personality: energetic / professional / friendly],
featuring [creator or brand elements],
space for channel name on [left/center],
social handles area on right,
brand colors [list], modern design,
safe zone: center 1546×423
```

### Instagram Highlight Cover

```
Minimalist icon for Instagram highlight,
[category] concept, single icon centered,
[brand color] background, white icon,
clean simple design, 1:1 ratio,
cohesive with brand aesthetic
```

---

## Asset Registry Integration

Register generated brand assets for reuse:

```typescript
import { registerAsset } from '../../../workflows/dist/index.js';

// Register logo set
registerAsset('my-brand', 'logos', {
  id: 'logo-primary',
  label: 'Primary Logo Set',
  source: 'provided',  // or 'generated'
  status: 'ready',
  locked: true,
  files: {
    full: 'assets/logos/logo-full.png',
    icon: 'assets/logos/logo-icon.png',
    wordmark: 'assets/logos/logo-wordmark.png',
    horizontal: 'assets/logos/logo-horizontal.png',
    white: 'assets/logos/logo-white.png',
  },
  brand_colors: ['#4F46E5', '#10B981', '#FFFFFF'],
}, { date: '2024-01-15' });

// Register social profiles
registerAsset('my-brand', 'social', {
  id: 'social-profiles',
  label: 'Social Media Profiles',
  source: 'generated',
  status: 'ready',
  files: {
    facebook: 'assets/social/profiles/facebook-profile.png',
    instagram: 'assets/social/profiles/instagram-profile.png',
    youtube: 'assets/social/profiles/youtube-profile.png',
    linkedin: 'assets/social/profiles/linkedin-profile.png',
    tiktok: 'assets/social/profiles/tiktok-profile.png',
    twitter: 'assets/social/profiles/twitter-profile.png',
  },
}, { date: '2024-01-15' });

// Register covers/banners
registerAsset('my-brand', 'social', {
  id: 'social-covers',
  label: 'Social Media Covers',
  source: 'generated',
  status: 'ready',
  files: {
    facebook_cover: 'assets/social/covers/facebook-cover.png',
    youtube_banner: 'assets/social/covers/youtube-banner.png',
    linkedin_banner: 'assets/social/covers/linkedin-banner.png',
    twitter_header: 'assets/social/covers/twitter-header.png',
  },
}, { date: '2024-01-15' });
```

---

## Generation Checklist

```
□ Step 1: Check if logo exists in asset registry
□ Step 2: If no logo → generate logo variations first
□ Step 3: Register logo in assets
□ Step 4: Generate profile images (use logo-icon as reference)
□ Step 5: Generate cover images (incorporate brand elements)
□ Step 6: Check safe zones for each platform
□ Step 7: Register all social assets
□ Step 8: Export platform-specific sizes
```

---

## Cost Reference

| Asset Type | Cost |
|------------|------|
| Logo icon (1K) | $0.067 |
| Profile image (1K) | $0.067 |
| Cover image (2K) | $0.10 |
| YouTube banner (2K) | $0.10 |
| Full brand set (6 platforms) | ~$1.00-1.50 |
| Highlight covers (5) | ~$0.35 |

---

## Output Structure

```
projects/{name}/assets/
├── logos/
│   ├── logo-full.png
│   ├── logo-icon.png
│   ├── logo-wordmark.png
│   ├── logo-horizontal.png
│   └── logo-white.png
├── social/
│   ├── profiles/
│   │   ├── facebook-profile.png
│   │   ├── instagram-profile.png
│   │   ├── youtube-profile.png
│   │   ├── linkedin-profile.png
│   │   ├── tiktok-profile.png
│   │   └── twitter-profile.png
│   ├── covers/
│   │   ├── facebook-cover.png
│   │   ├── youtube-banner.png
│   │   ├── linkedin-personal-banner.png
│   │   ├── linkedin-company-banner.png
│   │   └── twitter-header.png
│   └── highlights/
│       ├── highlight-about.png
│       ├── highlight-products.png
│       └── ...
└── watermarks/
    └── youtube-watermark.png
```
