# Content Creation Workflows

> Guidelines and templates for AI-generated content using Gemini tools.

## Overview

This folder contains production-ready workflows for different content types. Each guide includes:
- Story structure templates
- Prompt formulas
- Character consistency techniques
- Keyframe generation (image → video)
- Cost estimates

---

## Content Type Guides

| Guide | Use Case | Duration |
|-------|----------|----------|
| [01-storytelling.md](./01-storytelling.md) | Narrative videos, brand stories | 30-60s |
| [02-ads-commercial.md](./02-ads-commercial.md) | Product ads, promos, trailers | 15-30s |
| [03-explainer.md](./03-explainer.md) | Tutorial, how-to, educational | 60-120s |
| [04-social-media.md](./04-social-media.md) | TikTok, Reels, Shorts | 15-60s |
| [05-character-consistency.md](./05-character-consistency.md) | Maintaining character across clips | N/A |
| [06-keyframe-workflow.md](./06-keyframe-workflow.md) | Image → Video pipeline | N/A |

---

## Quick Start: The Universal Workflow

```
1. CONCEPT     → Define story, audience, goal
2. STRUCTURE   → Choose act structure (3-act, 5-act)
3. STYLE GUIDE → Lock visual style, colors, character
4. KEYFRAMES   → Generate start/end images per scene
5. VIDEO       → Generate clips using keyframes as reference
6. AUDIO       → Add voiceover, music, sound
7. ASSEMBLE    → Combine clips into final video
```

---

## The Golden Rules

### 1. Consistency First
> Lock your visual style BEFORE generating anything.

Define once, use everywhere:
- Character description (exact clothing, hair, features)
- Color palette (specific hex codes or references)
- Lighting mood (time of day, light source)
- Camera style (lens, movement patterns)

### 2. Prompt Structure
> Treat prompts like briefing a cinematographer who has never seen your storyboard.

```
[SHOT TYPE] + [SUBJECT] + [ACTION] + [ENVIRONMENT] + [LIGHTING] + [MOOD] + [CAMERA] + [STYLE]
```

### 3. Keyframes Before Video
> Generate images first, then use them as reference for video.

This ensures:
- Character stays consistent
- Scene composition is locked
- You can review before expensive video generation

### 4. Sweet Spot Duration
> 5-8 seconds per clip for best quality.

Longer clips = more drift and inconsistency.

---

## Cost Reference

| Content Type | Clips | Est. Cost |
|--------------|-------|-----------|
| 15s Social Ad | 2-3 | $6-10 |
| 30s Commercial | 4-5 | $13-16 |
| 60s Brand Story | 8-10 | $25-32 |
| 2min Explainer | 15-20 | $48-64 |

*Based on Veo 3.1 at $0.40/sec with audio*

---

## Sources & Research

- [Sora 2 Prompting Guide](https://wavespeed.ai/blog/posts/sora-2-prompting-tips-better-videos-2026/) - WaveSpeed
- [AI Video Generation 2026 Comparison](https://lushbinary.com/blog/ai-video-generation-sora-veo-kling-seedance-comparison/) - Lushbinary
- [Five-Act Structure](https://www.masterclass.com/articles/five-act-structure) - MasterClass
- [Story Structure for Video Marketing](https://idearocketanimation.com/22459-story-structure-video-marketing/) - Idea Rocket
- [Character Reference in Midjourney](https://docs.midjourney.com/hc/en-us/articles/32162917505293-Character-Reference) - Midjourney Docs
- [Creating Consistent Characters](https://prompting.systems/blog/creating-consistent-characters-in-ai-art) - Prompting Systems
