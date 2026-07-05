---
name: image-content
description: |
  Generate images using Gemini image models. Use when user asks to
  "create image", "generate picture", "make illustration", "design graphic",
  "thumbnail", "cover image", "social media graphic", "product shot",
  "character design", or any image creation request.
license: MIT
allowed-tools:
  - gemini31FlashImage
  - gemini3ProImage
---

# Image Content Generation Skill

## When This Skill Activates

- User wants to create images or graphics
- User mentions: thumbnail, cover, graphic, illustration, photo
- User needs: character reference, keyframes, product shots

---

## STEP 0: Resolve assets from the registry FIRST

Before describing a character or product, check the registry (the content plan may name an
id in `assets.character_id` / `assets.product_id`):

```typescript
import { loadAssetConfig, resolveAsset, registerAsset } from '../../workflows/dist/index.js';
const reg = loadAssetConfig('{name}');
const char = resolveAsset(reg, planAssets.character_id || 'char-main');
const prod = resolveAsset(reg, planAssets.product_id || 'prod-main');
```

- `ok` → reuse `existing[...]` as the reference image; don't re-describe/regenerate.
- not found → generate, then `registerAsset(...)` (characters: `locked:true`) so it's reused.

## STEP 1: Ask Image Purpose

**Ask the user:**

> What type of image do you need?
>
> 1. **Social Media Graphic** - Post, story, cover image
> 2. **Thumbnail** - YouTube, blog, video thumbnail
> 3. **Product Shot** - E-commerce, marketing
> 4. **Character Design** - For video/animation consistency
> 5. **Illustration** - Blog, article, presentation
> 6. **Keyframes** - Start/end frames for video generation
> 7. **Other** - I'll describe

**Store answer as**: `imageType`

---

## STEP 2: Ask Platform/Size

**Based on imageType, ask:**

### For Social Media Graphic:

> Which platform?
>
> 1. **Instagram Post** - 1:1 (1080×1080) or 4:5 (1080×1350)
> 2. **Instagram Story** - 9:16 (1080×1920)
> 3. **Facebook Post** - 1.91:1 (1200×628)
> 4. **Twitter/X Post** - 16:9 (1200×675)
> 5. **LinkedIn Post** - 1.91:1 (1200×627)
> 6. **Pinterest Pin** - 2:3 (1000×1500)

### For Thumbnail:

> What size?
>
> 1. **YouTube Thumbnail** - 16:9 (1280×720)
> 2. **Blog Featured** - 16:9 or 2:1
> 3. **Video Thumbnail** - 16:9

### For Keyframes:

> What aspect ratio matches your video?
>
> 1. **Vertical (9:16)** - TikTok, Reels, Shorts
> 2. **Horizontal (16:9)** - YouTube, ads
> 3. **Square (1:1)** - Instagram feed

**Store answer as**: `platform` and `aspectRatio`

---

## STEP 3: Map to Image Settings

### Size Presets

| Purpose | Aspect Ratio | Gemini Size | Resolution |
|---------|--------------|-------------|------------|
| Instagram Post | 1:1 | 1K or 2K | 1024×1024 |
| Instagram Story | 9:16 | 1K | ~576×1024 |
| YouTube Thumb | 16:9 | 2K | ~1820×1024 |
| Facebook | 1.91:1 | 1K | ~1024×536 |
| Character Design | 1:1 | 2K | High detail |
| Keyframe | Match video | 1K | Match video |

### Quality Presets

| Quality | Model | Size | Cost |
|---------|-------|------|------|
| Fast/Draft | gemini-3.1-flash-image | 1K | $0.067 |
| Standard | gemini-3.1-flash-image | 2K | $0.101 |
| High Quality | gemini-3-pro-image | 2K | $0.134 |
| Maximum | gemini-3-pro-image | 4K | $0.24 |

---

## STEP 4: Ask Style

**Ask the user:**

> What visual style?
>
> 1. **Photorealistic** - Looks like a real photo
> 2. **Digital Art** - Polished illustration style
> 3. **Minimalist** - Clean, simple, modern
> 4. **Cinematic** - Movie-like, dramatic lighting
> 5. **Cartoon/Illustrated** - Fun, stylized
> 6. **Corporate/Professional** - Business appropriate
> 7. **Other** - I'll describe

**Store answer as**: `style`

---

## STEP 5: Build Prompt

### Prompt Structure

```
[SUBJECT] in [STYLE] style.
[COMPOSITION/FRAMING].
[ENVIRONMENT/BACKGROUND].
[LIGHTING].
[MOOD/ATMOSPHERE].
[QUALITY KEYWORDS].
[ASPECT RATIO NOTE].
```

### Style Modifiers

| Style | Add to Prompt |
|-------|---------------|
| Photorealistic | "photorealistic, DSLR quality, natural lighting, high detail" |
| Digital Art | "digital art, polished illustration, vibrant colors, artstation quality" |
| Minimalist | "minimalist, clean design, simple shapes, negative space, modern" |
| Cinematic | "cinematic, dramatic lighting, shallow depth of field, movie still" |
| Cartoon | "cartoon style, bold lines, bright colors, playful, illustrated" |
| Corporate | "professional, clean, corporate photography, neutral colors" |

---

## STEP 6: Confirm and Generate

**Show summary:**

```
📋 IMAGE GENERATION PLAN
========================
Type: {imageType}
Platform: {platform}
Aspect Ratio: {aspectRatio}
Size: {size}
Style: {style}
Model: {model}

Estimated Cost: ${cost}

Proceed? (yes/no)
```

**Generate:**

```typescript
import { gemini31FlashImage } from '../index';

const result = await gemini31FlashImage({
  userPrompt: finalPrompt,
  config: {
    imageSize: size,
    aspectRatio: aspectRatio
  }
});

fs.writeFileSync('output.png', result.data.images[0].data);
```

---

## Special Workflows

### Character Consistency (Multiple Images)

When user needs same character in multiple images:

1. **Generate Master Reference First**
   ```
   Portrait of [CHARACTER DESCRIPTION].
   Neutral expression, clean background.
   High detail, consistent features.
   ```

2. **Use Detailed Description in All Subsequent Prompts**
   - Include exact clothing colors
   - Include signature accessories
   - Include specific physical features

3. **Reference: `workflows/05-character-consistency.md`**

### Keyframe Generation (For Video)

When generating keyframes for video:

1. Generate in pairs (start + end frame)
2. Same character/environment in both
3. Only change: expression, action, lighting
4. Reference: `workflows/06-keyframe-workflow.md`

---

## Platform Quick Reference

| Platform | Ratio | Recommended Size | Notes |
|----------|-------|------------------|-------|
| Instagram Post | 1:1 | 1K-2K | High engagement with faces |
| Instagram Story | 9:16 | 1K | Safe zones for text |
| YouTube Thumb | 16:9 | 2K | Faces + text work best |
| Facebook | 1.91:1 | 1K | Bright colors stand out |
| LinkedIn | 1.91:1 | 1K | Professional, clean |
| Pinterest | 2:3 | 2K | Vertical performs best |
| Twitter/X | 16:9 | 1K | Simple, bold |

---

## Cost Reference

| Model | 512px | 1K | 2K | 4K |
|-------|-------|-----|-----|-----|
| Flash | $0.045 | $0.067 | $0.101 | $0.15 |
| Pro | - | $0.134 | $0.134 | $0.24 |
