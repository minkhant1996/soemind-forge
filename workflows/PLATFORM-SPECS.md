# Platform Specs Guide

> **All specs for every content type across all platforms.**
> Images, videos, carousels, stories, thumbnails - with AI-compatible aspect ratios.

---

## AI-Compatible Aspect Ratios

AI image/video models only generate specific ratios. Map platform needs to these:

| Ratio | Orientation | Best For |
|-------|-------------|----------|
| **1:1** | Square | Profile pics, IG feed (legacy), LinkedIn |
| **4:5** | Portrait | IG/FB/TikTok feed posts (recommended) |
| **9:16** | Tall Portrait | Stories, Reels, Shorts, TikTok videos |
| **16:9** | Landscape | YouTube, Twitter, LinkedIn video |
| **3:4** | Portrait | Pinterest, some feeds |
| **4:3** | Landscape | Traditional video, presentations |
| **3:2** | Landscape | Photography standard |
| **2:3** | Portrait | Pinterest pins |

**Rule:** Always use these exact ratios. Platforms crop/letterbox non-native sizes.

---

## Quick Reference: One Asset, Multiple Platforms

### Feed Images (Static Posts)

| Ratio | Platforms | Notes |
|-------|-----------|-------|
| **4:5** | Instagram, Facebook, TikTok | Best for feed visibility (takes up more screen) |
| **1:1** | All platforms | Safe universal fallback |
| **16:9** | Twitter, LinkedIn, YouTube community | Wide format |

**Recommendation:** Generate **4:5** for social feed posts - works on IG, FB, TikTok.

### Vertical Videos (Short-Form)

| Ratio | Platforms | Duration |
|-------|-----------|----------|
| **9:16** | Instagram Reels, TikTok, YouTube Shorts, FB Reels, Snapchat | 15-90s |

**Recommendation:** Generate **9:16** once, post everywhere.

### Horizontal Videos (Long-Form)

| Ratio | Platforms | Duration |
|-------|-----------|----------|
| **16:9** | YouTube, Facebook, Twitter, LinkedIn | 1min+ |

---

## Platform-by-Platform Specs

### Instagram

| Content Type | Aspect Ratio | Resolution | Max Duration | Notes |
|--------------|--------------|------------|--------------|-------|
| **Feed Post** | 4:5 (recommended) | 1080×1350 | - | Portrait takes more screen |
| **Feed Post** | 1:1 | 1080×1080 | - | Square (legacy standard) |
| **Feed Post** | 16:9 | 1080×608 | - | Landscape (less engagement) |
| **Carousel** | 4:5 or 1:1 | 1080×1350 or 1080×1080 | - | All slides same ratio |
| **Story** | 9:16 | 1080×1920 | 15s | Full screen vertical |
| **Reels** | 9:16 | 1080×1920 | 15-90s | Full screen vertical |
| **Profile Pic** | 1:1 | 320×320 | - | Circular crop |
| **Highlight Cover** | 1:1 | 1080×1080 | - | Displayed at 110×110 |

**AI Generation:**
- Feed: `4:5` at `1K` (1024px) → Instagram scales
- Reels/Stories: `9:16` at `1K`
- Carousel: `4:5` at `1K`, all slides

### Facebook

| Content Type | Aspect Ratio | Resolution | Max Duration | Notes |
|--------------|--------------|------------|--------------|-------|
| **Feed Post** | 4:5 | 1080×1350 | - | Same as Instagram |
| **Feed Post** | 1:1 | 1080×1080 | - | Square |
| **Feed Post** | 16:9 | 1200×630 | - | Link preview default |
| **Carousel** | 1:1 | 1080×1080 | - | Square only |
| **Story** | 9:16 | 1080×1920 | 20s | Full screen |
| **Reels** | 9:16 | 1080×1920 | 15-90s | Same as IG Reels |
| **Video (Feed)** | 16:9 or 9:16 | 1280×720+ | 240min | Both work |
| **Profile Pic** | 1:1 | 320×320 | - | Circular crop |
| **Cover Photo** | 16:9 | 820×312 | - | Safe zone: 640×312 |
| **Event Cover** | 16:9 | 1920×1005 | - | Large banner |

**AI Generation:**
- Feed images: `4:5` at `1K`
- Cover: `16:9` at `2K`
- Video: `9:16` for Reels, `16:9` for feed video

### TikTok

| Content Type | Aspect Ratio | Resolution | Max Duration | Notes |
|--------------|--------------|------------|--------------|-------|
| **Video** | 9:16 | 1080×1920 | 10min | Vertical is REQUIRED |
| **Photo Post** | 4:5 | 1080×1350 | - | New feature |
| **Photo Carousel** | 4:5 | 1080×1350 | - | Up to 35 photos |
| **Profile Pic** | 1:1 | 200×200 | - | Circular crop |

**AI Generation:**
- Video: `9:16` ALWAYS
- Photo: `4:5` at `1K`

### YouTube

| Content Type | Aspect Ratio | Resolution | Max Duration | Notes |
|--------------|--------------|------------|--------------|-------|
| **Long-form Video** | 16:9 | 1920×1080 (1080p) | 12hr | Standard HD |
| **Long-form Video** | 16:9 | 3840×2160 (4K) | 12hr | For quality |
| **Shorts** | 9:16 | 1080×1920 | 60s | Vertical only |
| **Thumbnail** | 16:9 | 1280×720 | - | 2MB max |
| **Profile Pic** | 1:1 | 800×800 | - | Circular crop |
| **Banner** | 16:9 base | 2560×1440 | - | Safe: 1546×423 |
| **Watermark** | 1:1 | 150×150 | - | Video overlay |
| **Community Post** | 16:9 or 1:1 | 1280×720 or 1080×1080 | - | Image posts |

**AI Generation:**
- Video: `16:9` for long, `9:16` for Shorts
- Thumbnail: `16:9` at `1K` or `2K`
- Banner: `16:9` at `2K` (will be cropped)

### LinkedIn

| Content Type | Aspect Ratio | Resolution | Max Duration | Notes |
|--------------|--------------|------------|--------------|-------|
| **Feed Image** | 1:1 | 1080×1080 | - | Square recommended |
| **Feed Image** | 16:9 | 1200×627 | - | Landscape |
| **Feed Image** | 4:5 | 1080×1350 | - | Portrait (supported) |
| **Carousel** | 1:1 or 4:5 | 1080×1080 or 1080×1350 | - | PDF upload |
| **Video** | 16:9 | 1920×1080 | 10min | Landscape preferred |
| **Video** | 1:1 | 1080×1080 | 10min | Square works |
| **Profile Pic** | 1:1 | 400×400 | - | Circular crop |
| **Personal Banner** | 4:1 | 1584×396 | - | Wide banner |
| **Company Banner** | 16:9 | 1128×191 | - | Very wide |

**AI Generation:**
- Feed: `1:1` at `1K` (safest)
- Video: `16:9` at `1080p`
- Banner: `16:9` at `2K` (will be cropped)

### Twitter / X

| Content Type | Aspect Ratio | Resolution | Max Duration | Notes |
|--------------|--------------|------------|--------------|-------|
| **Feed Image** | 16:9 | 1200×675 | - | Default display |
| **Feed Image** | 4:5 | 1080×1350 | - | Portrait supported |
| **Feed Image** | 1:1 | 1080×1080 | - | Square |
| **Video** | 16:9 | 1920×1080 | 2:20 | Landscape |
| **Video** | 1:1 | 1080×1080 | 2:20 | Square |
| **Profile Pic** | 1:1 | 400×400 | - | Circular crop |
| **Header** | 3:1 | 1500×500 | - | Wide banner |

**AI Generation:**
- Feed: `16:9` at `1K`
- Video: `16:9` at `1080p`
- Header: `16:9` at `2K` (will be cropped to 3:1)

### Pinterest

| Content Type | Aspect Ratio | Resolution | Notes |
|--------------|--------------|------------|-------|
| **Pin (Standard)** | 2:3 | 1000×1500 | Tall portrait (best) |
| **Pin (Square)** | 1:1 | 1000×1000 | Square |
| **Pin (Long)** | 1:2.1 | 1000×2100 | Extra tall (max) |
| **Video Pin** | 2:3 or 9:16 | 1080×1920 | 4s-15min |
| **Idea Pin** | 9:16 | 1080×1920 | Story format |
| **Profile Pic** | 1:1 | 165×165 | Circular |
| **Board Cover** | 16:9 | 800×450 | - |

**AI Generation:**
- Pins: `2:3` at `1K` (closest to Pinterest ideal)
- Video: `9:16` at `1080p`

### Snapchat

| Content Type | Aspect Ratio | Resolution | Max Duration |
|--------------|--------------|------------|--------------|
| **Snap** | 9:16 | 1080×1920 | 10s |
| **Story** | 9:16 | 1080×1920 | 60s |
| **Spotlight** | 9:16 | 1080×1920 | 60s |

**AI Generation:** Always `9:16`

---

## Content Type Summary

### Images

| Use Case | Ratio | Works On |
|----------|-------|----------|
| **Universal feed post** | 4:5 | IG, FB, TikTok |
| **Square fallback** | 1:1 | All platforms |
| **Wide/preview** | 16:9 | Twitter, LinkedIn, YouTube |
| **Pinterest pin** | 2:3 | Pinterest |
| **Stories/vertical** | 9:16 | IG Story, FB Story, Snapchat |

### Videos

| Use Case | Ratio | Works On |
|----------|-------|----------|
| **Short-form vertical** | 9:16 | Reels, Shorts, TikTok, FB Reels |
| **Long-form horizontal** | 16:9 | YouTube, FB Video, LinkedIn |
| **Square video** | 1:1 | Twitter, LinkedIn, FB (legacy) |

### Carousels

| Platform | Ratio | Slides | Notes |
|----------|-------|--------|-------|
| Instagram | 4:5 or 1:1 | 10 | All same ratio |
| Facebook | 1:1 | 10 | Square only |
| LinkedIn | 1:1 or 4:5 | PDF | Document upload |
| TikTok | 4:5 | 35 | Photo mode |

---

## AI Generation Cheat Sheet

### For Images

```typescript
// Universal feed post (IG, FB, TikTok)
{ aspectRatio: '4:5', imageSize: '1K' }

// Square (all platforms)
{ aspectRatio: '1:1', imageSize: '1K' }

// Wide (Twitter, LinkedIn, YouTube community)
{ aspectRatio: '16:9', imageSize: '1K' }

// Pinterest pin
{ aspectRatio: '2:3', imageSize: '1K' }  // or closest available

// Story/vertical
{ aspectRatio: '9:16', imageSize: '1K' }

// Thumbnail (YouTube)
{ aspectRatio: '16:9', imageSize: '2K' }

// High-res hero
{ aspectRatio: '4:5', imageSize: '2K' }
```

### For Videos

```typescript
// Reels/Shorts/TikTok (vertical)
{ aspectRatio: '9:16', duration: 30, quality: 'fast' }

// YouTube long-form (horizontal)
{ aspectRatio: '16:9', duration: 60, quality: 'standard' }

// Square video (Twitter, LinkedIn)
{ aspectRatio: '1:1', duration: 30, quality: 'fast' }
```

### For Carousels

```typescript
// Instagram/TikTok carousel
await generateCarousel({
  topic: '...',
  slideCount: 5,
  aspectRatio: '4:5',  // Portrait
  outputDir: '...',
});

// Facebook carousel
await generateCarousel({
  topic: '...',
  slideCount: 5,
  aspectRatio: '1:1',  // Square required
  outputDir: '...',
});
```

---

## Platform Selection by Goal

### Maximize Reach (One Image)

Generate **4:5** at **1K** → Post on IG, FB, TikTok

### Maximize Engagement (Video)

Generate **9:16** at **1080p** → Post on Reels, Shorts, TikTok, FB Reels

### Professional/B2B

Generate **1:1** or **16:9** → Post on LinkedIn, Twitter

### Long-form Video

Generate **16:9** at **1080p** → Post on YouTube

---

## Thumbnail Specs by Platform

| Platform | Ratio | Resolution | Notes |
|----------|-------|------------|-------|
| YouTube | 16:9 | 1280×720 | 2MB max, custom upload |
| TikTok | 9:16 | 1080×1920 | First frame or custom |
| Instagram Reels | 9:16 | 1080×1920 | Cover from video or upload |
| Facebook | 16:9 | 1200×630 | Link preview, video thumb |
| LinkedIn | 16:9 | 1200×627 | Video thumbnail |

---

## Profile & Banner Specs

### Profile Pictures (All Circular Crop)

| Platform | Upload | Display | Safe Zone |
|----------|--------|---------|-----------|
| Instagram | 320×320 | 110×110 | Center 70% |
| Facebook | 320×320 | 176×176 | Center 70% |
| TikTok | 200×200 | 200×200 | Center 70% |
| YouTube | 800×800 | 98×98 | Center 70% |
| LinkedIn | 400×400 | 200×200 | Center 70% |
| Twitter | 400×400 | 200×200 | Center 70% |

**AI Generation:** Always `1:1` at minimum `512px`, ideally `1K`

### Banners/Covers

| Platform | Size | Safe Zone | AI Ratio |
|----------|------|-----------|----------|
| Facebook Page | 820×312 | 640×312 | 16:9 (crop) |
| YouTube | 2560×1440 | 1546×423 | 16:9 (crop) |
| LinkedIn Personal | 1584×396 | 1200×300 | 16:9 (crop) |
| Twitter Header | 1500×500 | 1200×400 | 16:9 (crop) |

**AI Generation:** Generate `16:9` at `2K`, then crop to platform spec

---

## File Size Limits

| Platform | Image | Video |
|----------|-------|-------|
| Instagram | 30MB | 650MB (Reels), 4GB (Feed) |
| Facebook | 30MB | 4GB |
| TikTok | 20MB | 287MB (mobile), 500MB (web) |
| YouTube | 2MB (thumb) | 256GB |
| LinkedIn | 8MB | 5GB |
| Twitter | 5MB | 512MB |
| Pinterest | 20MB | 2GB |

---

## Quick Decision Tree

```
What are you posting?
│
├─► IMAGE (single)
│   ├─► Social feed → 4:5
│   ├─► Professional → 1:1 or 16:9
│   └─► Pinterest → 2:3
│
├─► CAROUSEL
│   ├─► Instagram/TikTok → 4:5
│   └─► Facebook/LinkedIn → 1:1
│
├─► VIDEO (short)
│   └─► All platforms → 9:16
│
├─► VIDEO (long)
│   └─► YouTube/LinkedIn → 16:9
│
├─► STORY
│   └─► All platforms → 9:16
│
├─► THUMBNAIL
│   ├─► YouTube → 16:9
│   └─► Vertical video → 9:16
│
└─► PROFILE/BANNER
    ├─► Profile → 1:1
    └─► Banner → 16:9 (will be cropped)
```
