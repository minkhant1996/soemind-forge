# Thumbnail Guide

> **MANDATORY:** Read this guide before generating any thumbnail.
> Thumbnails are the most important image for video/audio content - they determine click-through rate.

---

## Quick Reference

| Platform | Aspect | Size | Key Elements |
|----------|--------|------|--------------|
| YouTube | 16:9 | 1280x720 | Face + text + bold colors |
| TikTok | 9:16 | 1080x1920 | First frame or custom |
| Instagram Reels | 9:16 | 1080x1920 | Eye-catching, minimal text |
| Podcast | 1:1 | 3000x3000 | Face + show title |
| LinkedIn | 16:9 | 1200x627 | Professional, clean |

---

## CRITICAL: Character Reference Requirement

### If thumbnail includes a person:

```
□ Step 1: ASK "Does this thumbnail include a person/character?"
□ Step 2: If YES → Check asset registry for character reference
□ Step 3: If character exists → Use generateImageVariation() with reference
□ Step 4: If no character → Either:
   a) Generate character keyframe first → register → then thumbnail
   b) Use faceless thumbnail style
□ Step 5: CONFIRM choice with user before generating
```

**Why this matters:**
- Without reference: AI generates random face each time
- With reference: Same face across all content = brand consistency
- Matching video character: Thumbnail face MUST match video character

### Workflow Selection

| Has Character Reference? | Function to Use |
|-------------------------|-----------------|
| **YES (preferred)** | `generateImageVariation()` |
| No, generate new | `generateSingleImage()` → register → `generateImageVariation()` |
| No, faceless style | `generateSingleImage()` |

---

## Viral Thumbnail Patterns

### Pattern 1: The Face + Emotion (WITH Character)

**The most clickable thumbnail pattern for personality-driven content.**

```
[PERSON with EXAGGERATED EXPRESSION], [SIMPLE CONTRASTING BACKGROUND].
[OBJECT/CONTEXT showing topic]. High contrast, saturated colors,
YouTube thumbnail style. Negative space on [left/right] for text.
```

| Expression | Use For | Example |
|------------|---------|---------|
| **Shocked/Surprised** | Reveals, discoveries, "I can't believe..." | Mouth open, wide eyes, hands on cheeks |
| **Excited/Happy** | Wins, announcements, positive results | Big smile, raised eyebrows, fist pump |
| **Confused/Curious** | Tutorials, "How to...", questions | Raised eyebrow, slight head tilt, finger on chin |
| **Serious/Focused** | Expert content, warnings, important topics | Direct gaze, neutral expression, arms crossed |
| **Angry/Frustrated** | Rants, complaints, "Why X is wrong" | Furrowed brow, pointing finger, intense stare |

**Example Prompts:**

Shocked face (with reference):
```
Same person from reference with shocked expression, mouth wide open,
eyes wide, hands raised near face. Clean gradient background transitioning
from orange to yellow. High contrast, bold saturated colors.
YouTube thumbnail style. Negative space on right third for text overlay.
```

Excited face (with reference):
```
Same person from reference with excited expression, big genuine smile,
eyebrows raised, fist pump gesture. Solid bright blue background.
Professional lighting, high contrast. YouTube thumbnail style.
Clear space on left for bold text.
```

### Pattern 2: Before/After Split (WITH or WITHOUT Character)

**Perfect for transformation, comparison, results content.**

```
Split composition, left side shows [BEFORE STATE], right side shows
[AFTER STATE]. Clear dividing line or gradient transition.
High contrast between sides. [EMOTION on face if person included].
Transformation thumbnail style, dramatic lighting on "after" side.
```

**Example:**
```
Split thumbnail, left half: tired person with messy desk, dim lighting,
stressed expression. Right half: same person energized at organized desk,
bright lighting, confident smile. Diagonal split line, before side desaturated,
after side vibrant colors. Transformation style.
```

### Pattern 3: Product Hero (WITHOUT Character)

**For product reviews, unboxings, "best of" lists.**

```
[PRODUCT] as hero subject, [LOW ANGLE / DRAMATIC LIGHTING].
[CLEAN BACKGROUND with subtle gradient or glow].
Product photography style, premium feel, high contrast.
Space for text overlay on [position].
```

**Example:**
```
Smartphone floating at slight angle, dramatic side lighting creating
reflections on screen. Deep blue gradient background with subtle glow
behind product. Premium product photography, high contrast, sharp details.
Negative space on right for text. 16:9 aspect ratio.
```

### Pattern 4: Text-Dominant (WITHOUT Character)

**For list videos, educational content, announcements.**

```
[ABSTRACT BACKGROUND or TEXTURE], [BOLD GEOMETRIC SHAPES].
[DRAMATIC LIGHTING / GRADIENTS]. Minimal design, high contrast.
Space dominant for large text overlay. Modern, clean aesthetic.
```

**Example:**
```
Deep purple to pink gradient background, abstract geometric shapes
floating with subtle shadows. Dramatic lighting, bokeh light particles.
Minimal modern design, high contrast. Large clear space in center
for bold text. YouTube thumbnail aesthetic.
```

### Pattern 5: Curiosity Gap (WITH or WITHOUT Character)

**For mystery, reveals, "You won't believe..." content.**

```
[PARTIALLY HIDDEN SUBJECT / BLURRED ELEMENT / QUESTION MARK].
[DRAMATIC LIGHTING creating intrigue]. [PERSON looking curious if included].
Mystery atmosphere, subtle fog or shadows. Curiosity-inducing composition.
```

**Example:**
```
Person with curious expression looking at partially visible object
(blurred/cropped at edge). Dramatic side lighting, slight fog effect.
One hand reaching toward the mystery object. Dark moody background.
Curiosity thumbnail style. Space for "?" text overlay.
```

### Pattern 6: Number/List Visual (WITHOUT Character)

**For "X Tips", "Top 10", ranked lists.**

```
[LARGE BOLD NUMBER or STACKED ITEMS representing quantity].
[RELEVANT ICONS or MINI-ILLUSTRATIONS around number].
Clean background with brand colors, modern flat design.
Space for supporting text. Infographic thumbnail style.
```

**Example:**
```
Large 3D "5" in bold gold, floating with subtle shadow. Five small
icons arranged around it representing tips (lightbulb, checkmark, etc.).
Clean gradient background from navy to black. Modern flat design style.
Space below number for text. 16:9 thumbnail aspect.
```

---

## Platform-Specific Guidelines

### YouTube Thumbnails (16:9)

**Requirements:**
- 1280x720px minimum
- High contrast (readable at small sizes)
- Face fills ~40% of frame (if used)
- Text on opposite side from face
- 3-4 words maximum in text overlay
- Bold, sans-serif fonts

**Best Practices:**
```yaml
composition: "Subject on left 60%, text space on right 40%"
colors: "Bright, saturated, contrasting (red vs blue, yellow vs purple)"
face: "Close-up, exaggerated expression, direct eye contact"
lighting: "High key, minimal shadows on face"
text_space: "Clean area for 2-4 word overlay"
```

**Anti-patterns:**
- ❌ Small faces (unreadable at thumbnail size)
- ❌ Busy backgrounds (distracting)
- ❌ Too much text (5+ words)
- ❌ Dark/muddy colors (doesn't pop)
- ❌ Generic stock photo feel

### Podcast/Audio Thumbnails (1:1)

**Requirements:**
- 3000x3000px (for platforms)
- 1400x1400px minimum
- Works at 55x55px (tiny preview size)

**Structure:**
```yaml
layout: "Face dominant or abstract + title"
elements:
  - Host face (if personality-driven)
  - Show title (readable at small sizes)
  - Episode number (optional)
  - Brand colors
background: "Solid color or simple gradient"
```

**Example Prompt:**
```
Podcast cover, close-up portrait of host with confident smile,
warm studio lighting. Solid deep teal background. Clean modern
aesthetic, space at bottom for show title. Square 1:1 format,
high resolution, professional podcast style.
```

### TikTok/Reels Cover (9:16)

**Requirements:**
- Custom cover OR best frame from video
- Must match video content
- Works in small grid view

**If Custom:**
```yaml
composition: "Vertical, subject centered or rule-of-thirds"
text: "Minimal (0-3 words)"
style: "Match video aesthetic, not overly polished"
character: "MUST match character in video"
```

### LinkedIn Video Thumbnail (16:9)

**Requirements:**
- Professional appearance
- Clear value proposition visible
- Corporate-friendly colors

**Structure:**
```yaml
composition: "Professional headshot or product"
colors: "Blues, grays, clean whites"
text: "Topic/benefit clearly visible"
style: "Clean, not flashy"
```

---

## Thumbnail Types by Content

### Video Thumbnail

```yaml
purpose: "Drive clicks on video content"
key_elements:
  - Face with emotion (if personality content)
  - Topic hint without spoiling
  - Contrast with platform feed
styles:
  - face_emotion: "Shocked, excited, curious face + simple bg"
  - before_after: "Split transformation visual"
  - product_hero: "Product dominant, dramatic lighting"
  - text_bold: "Large text + simple visual"
  - curiosity: "Mystery, partial reveal, question"
```

### Podcast/Audio Thumbnail

```yaml
purpose: "Brand recognition + episode identification"
key_elements:
  - Host face OR abstract brand visual
  - Show title (readable at 55px)
  - Episode number/title (optional)
  - Consistent series look
styles:
  - host_portrait: "Face + title + brand colors"
  - abstract_brand: "Graphic design + title"
  - guest_feature: "Guest face + host small"
  - topic_visual: "Episode topic illustration"
```

### Social Post Thumbnail (Grid Preview)

```yaml
purpose: "Cohesive feed aesthetic"
key_elements:
  - Works in 1:1 crop (center important elements)
  - Matches feed color palette
  - Recognizable at small size
styles:
  - consistent_filter: "Same editing style across feed"
  - color_theme: "Consistent color palette"
  - template_based: "Same layout, different content"
```

---

## Thumbnail Prompt Templates

### Face + Emotion (WITH Reference)

```
Same person from reference image with [EXPRESSION] expression,
[GESTURE/POSE]. [SIMPLE BACKGROUND with COLOR].
High contrast, [LIGHTING STYLE]. YouTube thumbnail style.
Negative space on [SIDE] for text. 16:9 aspect ratio.
```

Variables:
- EXPRESSION: shocked, excited, confused, angry, happy, curious
- GESTURE: hands on face, pointing, thumbs up, arms crossed
- BACKGROUND: solid gradient, simple office, clean studio
- LIGHTING: high key, dramatic side light, ring light
- SIDE: left, right, top, bottom

### Faceless/Product

```
[PRODUCT/OBJECT] as hero subject, [ANGLE] view.
[DRAMATIC LIGHTING] creating depth and interest.
[BACKGROUND STYLE]. Premium [TYPE] photography style.
High contrast, sharp details. Space for text on [SIDE]. 16:9.
```

Variables:
- ANGLE: low angle, straight on, 3/4 view, top down
- LIGHTING: side light, backlit, studio softbox
- BACKGROUND: gradient, solid color, subtle texture
- TYPE: product, tech, lifestyle

### Before/After Split

```
Split composition, left shows [BEFORE], right shows [AFTER].
[DIVIDER STYLE]. Before side [TREATMENT], after side [TREATMENT].
[PERSON EXPRESSION if included]. High contrast, clear difference.
Transformation thumbnail style. 16:9.
```

Variables:
- DIVIDER: diagonal line, vertical split, gradient fade
- TREATMENT: desaturated/dim vs vibrant/bright
- EXPRESSION: stressed vs relieved, tired vs energized

---

## Common Mistakes to Avoid

| Mistake | Why It's Bad | Fix |
|---------|--------------|-----|
| Small face | Unrecognizable at thumbnail size | Face fills 40%+ of frame |
| Busy background | Distracts from subject | Solid colors or simple gradients |
| Inconsistent character | Different face than video | Always use character reference |
| Too much text in prompt | AI generates garbled text | Add text in post-production |
| Dark colors | Doesn't stand out in feed | High contrast, saturated colors |
| Complex scene | Confusing at small size | Single clear focal point |
| No emotion | Boring, no curiosity | Exaggerate expression |

---

## Review Checklist

Before generating any thumbnail, confirm:

```
□ Platform and aspect ratio confirmed?
□ Does it include a person?
  □ If YES: Character reference resolved from registry?
  □ If YES: Using generateImageVariation() with reference?
  □ If NO: Faceless style appropriate for content?
□ Expression/emotion matches content tone?
□ Background is simple and contrasting?
□ No text in the generation prompt? (add in post)
□ Space left for text overlay?
□ Will it be recognizable at small size?
□ Matches video character (if video thumbnail)?
```

---

## Quick Start Templates

### YouTube Video Thumbnail (with face)
```typescript
await generateImageVariation({
  referenceImagePath: 'projects/{name}/assets/characters/char-main-front.png',
  prompt: `Same person with shocked expression, mouth open, eyes wide,
           hands raised. Clean orange gradient background. High contrast,
           bright saturated colors. YouTube thumbnail style.
           Negative space on right for text.`,
  outputPath: 'projects/{name}/output-contents/thumbnail.png',
  aspectRatio: '16:9',
  imageSize: '2K'
});
```

### YouTube Video Thumbnail (no face)
```typescript
await generateSingleImage({
  prompt: `Smartphone floating at dramatic angle, side lighting with
           reflections. Deep blue gradient background with subtle glow.
           Premium product photography, high contrast. Space on left
           for text. YouTube thumbnail style.`,
  outputPath: 'projects/{name}/output-contents/thumbnail.png',
  aspectRatio: '16:9',
  imageSize: '2K'
});
```

### Podcast Cover (with host)
```typescript
await generateImageVariation({
  referenceImagePath: 'projects/{name}/assets/characters/host.png',
  prompt: `Same person, confident smile, professional headshot style.
           Solid deep purple background. Warm studio lighting.
           Clean modern podcast cover aesthetic. Square format.
           Space at bottom for title text.`,
  outputPath: 'projects/{name}/output-contents/podcast-cover.png',
  aspectRatio: '1:1',
  imageSize: '2K'
});
```
