---
name: generate-brand-assets
description: Generate brand assets - logos, profile images, cover/banner images, Instagram highlights, YouTube watermarks. Use when user needs social media setup, brand presence, profile pics, banners, or platform assets.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Generate Brand Assets

Generate consistent brand assets across all social platforms with correct specs.

All workflow functions are exposed as CLI commands:

```bash
node workflows/cli.cjs <command> '<json-args>'
```

Run `node workflows/cli.cjs list` to see every command. Loads `.env`, prints the JSON result to stdout, exits non-zero on failure. For long prompts use `@args.json` or pipe JSON via `-`.

**For full documentation: Read `workflows/BRAND-ASSETS-GUIDE.md`**

---

## Platform Specs Quick Reference

### Profile Images (Circular Crop)

| Platform | Upload Size | Safe Zone |
|----------|-------------|-----------|
| Facebook | 320×320px | Center 70% |
| Instagram | 320×320px | Center 70% |
| TikTok | 200×200px | Center 70% |
| YouTube | 800×800px | Center 70% |
| LinkedIn | 400×400px | Center 70% |
| Twitter | 400×400px | Center 70% |
| Pinterest | 165×165px | Center 70% |

### Cover Images / Banners

| Platform | Size | Safe Zone |
|----------|------|-----------|
| Facebook Page | 820×312px | 640×312 |
| YouTube Banner | 2560×1440px | 1546×423 (critical!) |
| LinkedIn | 1584×396px | 1200×300 |
| Twitter Header | 1500×500px | 1200×400 |

**Instagram & TikTok have no cover images.**

---

## Workflow Selection

| User Wants | Function |
|------------|----------|
| Profile pics for multiple platforms | `generateProfileImage()` |
| Single cover/banner | `generateCoverImage()` |
| Instagram highlight icons | `generateHighlightCovers()` |
| Complete brand setup | `generateBrandAssets()` |

---

## Examples

### 1. Profile Images from Logo

```bash
node workflows/cli.cjs generateProfileImage '{"type":"logo","logoPath":"projects/my-brand/assets/logos/logo-icon.png","backgroundColor":"#FFFFFF","platforms":["facebook","instagram","youtube","linkedin","tiktok"],"outputDir":"projects/my-brand/assets/social/profiles"}'
# Creates: facebook-profile.png, instagram-profile.png, etc.
```

### 2. Founder Profile (Personal Brand)

```bash
node workflows/cli.cjs generateProfileImage '{"type":"person","referenceImagePath":"projects/my-brand/assets/characters/founder.png","style":"professional headshot, friendly smile, clean background","platforms":["linkedin","twitter"],"outputDir":"projects/my-brand/assets/social/profiles"}'
```

### 3. YouTube Banner

```bash
node workflows/cli.cjs generateCoverImage '{"platform":"youtube","style":"modern tech startup, professional","headline":"Build Your Startup in 4 Weeks","socialHandles":"@soemind","schedule":"New videos every Tuesday","brandColors":["#4F46E5","#10B981"],"outputPath":"projects/my-brand/assets/social/covers/youtube-banner.png"}'
# IMPORTANT: Keep text in center 1546×423 safe zone
```

### 4. Facebook Cover

```bash
node workflows/cli.cjs generateCoverImage '{"platform":"facebook","style":"professional service, trustworthy","brandColors":["#4F46E5","#10B981"],"outputPath":"projects/my-brand/assets/social/covers/facebook-cover.png"}'
```

### 5. Instagram Highlights

```bash
node workflows/cli.cjs generateHighlightCovers '{"count":5,"style":"minimal icons","categories":["About","Products","Reviews","Tips","Contact"],"backgroundColor":"#4F46E5","iconColor":"#FFFFFF","outputDir":"projects/my-brand/assets/social/highlights"}'
# Creates: highlight-about.png, highlight-products.png, etc.
```

### 6. Complete Brand Asset Set

```bash
# logoPath is optional; includeWatermark generates a YouTube watermark
node workflows/cli.cjs generateBrandAssets '{"projectName":"my-brand","brandName":"SoeMind","tagline":"Build smarter, not harder","style":"modern minimalist","primaryColor":"#4F46E5","secondaryColor":"#10B981","logoPath":"assets/logos/logo-icon.png","platforms":["facebook","instagram","youtube","linkedin","tiktok"],"includeProfiles":true,"includeCovers":true,"includeHighlights":true,"highlightCategories":["About","Products","Reviews","Tips","Contact"],"includeWatermark":true}'

# Output structure:
# projects/my-brand/assets/social/
# ├── profiles/
# │   ├── facebook-profile.png
# │   ├── instagram-profile.png
# │   └── ...
# ├── covers/
# │   ├── facebook-cover.png
# │   ├── youtube-cover.png
# │   └── ...
# ├── highlights/
# │   ├── highlight-about.png
# │   └── ...
# └── watermarks/
#     └── youtube-watermark.png
```

---

## Required Questions

**Before generating, ask:**

1. **What platforms?** (Facebook, Instagram, TikTok, YouTube, LinkedIn, Twitter)

2. **What type of profile?**
   - Logo icon → use existing logo
   - Founder/person → need reference image or generate
   - Monogram → auto-generate from brand name

3. **Do you have a logo?**
   - Yes → use as profile base
   - No → generate monogram or icon

4. **Brand colors?** (primary + secondary)

5. **For covers: Any text to include?**
   - Tagline?
   - Social handles?
   - Schedule (YouTube)?

---

## Asset Registry Integration

Register generated assets for reuse:

```bash
# Register profile images
node workflows/cli.cjs registerAsset '["my-brand","social",{"id":"social-profiles","label":"Social Media Profiles","source":"generated","status":"ready","files":{"facebook":"assets/social/profiles/facebook-profile.png","instagram":"assets/social/profiles/instagram-profile.png","youtube":"assets/social/profiles/youtube-profile.png"}},{"date":"2024-01-15"}]'

# Register covers
node workflows/cli.cjs registerAsset '["my-brand","social",{"id":"social-covers","label":"Social Media Covers","source":"generated","status":"ready","files":{"facebook_cover":"assets/social/covers/facebook-cover.png","youtube_banner":"assets/social/covers/youtube-banner.png"}},{"date":"2024-01-15"}]'
```

---

## Cost Reference

| Asset | Cost |
|-------|------|
| Profile image (1K) | $0.067 |
| Cover image (2K) | $0.10 |
| Highlight cover | $0.067 |
| YouTube watermark | $0.067 |
| Full brand set (6 platforms) | ~$1.00-1.50 |

---

## Pipeline-First + Audit Trail (Mandatory)

- Author `<content-id>.pipeline.json` IN the output folder BEFORE generating
  (nodes = CLI commands, `{{node.data.field}}` refs), then
  `node workflows/cli.cjs runPipeline @<file>` — see `workflows/pipelines/README.md`.
- The output folder gets a `prompts.txt` with each asset's prompt (style, colors,
  text); update it on every retry with a one-line RESULT note.
- Log each generation via the `createGenerationManifest` / `addManifestEntry`
  CLI commands (AGENT-GUIDE Step 5).

---

## Output Structure

```
projects/{name}/assets/social/
├── profiles/
│   ├── profile-master.png      # Master 800×800
│   ├── facebook-profile.png
│   ├── instagram-profile.png
│   ├── youtube-profile.png
│   ├── linkedin-profile.png
│   ├── tiktok-profile.png
│   └── twitter-profile.png
├── covers/
│   ├── facebook-cover.png      # 820×312
│   ├── youtube-cover.png       # 2560×1440
│   ├── linkedin-cover.png      # 1584×396
│   └── twitter-header.png      # 1500×500
├── highlights/
│   ├── highlight-about.png
│   ├── highlight-products.png
│   └── ...
└── watermarks/
    └── youtube-watermark.png   # 150×150
```

---

## Safe Zone Guidelines

### YouTube Banner (CRITICAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                         TV (2560×1440)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Desktop (2560×423)                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Mobile Safe (1546×423)                 │  │  │
│  │  │                                                     │  │  │
│  │  │     [LOGO]     CHANNEL NAME     [@handles]         │  │  │
│  │  │                    Tagline                          │  │  │
│  │  │                                                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Keep ALL text in center 1546×423 safe zone!**

### Facebook Cover

```
┌─────────────────────────────────────────────────────┐
│                 Desktop (820×312)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │           Mobile Safe (640×312)               │  │
│  │                                               │  │
│  │    [HEADLINE]        [CTA]                   │  │
│  │    Subheadline                               │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│ ┌─────┐                                             │
│ │PROF │  Profile overlaps bottom-left              │
│ └─────┘                                             │
└─────────────────────────────────────────────────────┘
```

**Avoid bottom-left corner (profile overlap). Keep CTA on right.**
