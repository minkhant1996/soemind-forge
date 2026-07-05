# Seedance 2.0 Prompt Guide

> **ByteDance's multimodal AI video generation model.**
> Supports text, image, audio, and video inputs with native audio generation.

---

## Overview

| Specification | Value |
|---------------|-------|
| **Duration** | 4-15 seconds |
| **Resolution** | Up to 1080p |
| **Aspect Ratios** | 16:9, 9:16, 4:3, 3:4, 21:9, 1:1 |
| **Audio** | Native dual-channel stereo (dialogue, SFX, music) |
| **Inputs** | Up to 9 images, 3 videos, 3 audio files (12 total) |

### Key Capabilities

- **Multi-shot narrative** — Maintains character, lighting, style across cuts
- **Native audio sync** — Dialogue with lip-sync, ambient sounds, music
- **Multimodal references** — Use images/videos/audio as input anchors
- **Automatic camera planning** — Shot structure, angles, timing
- **Character consistency** — Identity preserved across sequences

---

## Core Prompt Formula

### 6-Part Structure

```
[SUBJECT] + [ACTION] + [ENVIRONMENT] + [CAMERA] + [STYLE] + [CONSTRAINTS]
```

**Optimal length:** 60-100 words

**Critical:** The first 20-30 words carry the most weight. Lead with WHO and WHAT action.

### Master Template

```
[Industry Style] video.
SUBJECT: [Main subject with detailed description]
ACTION: [Single clear present-tense action]
CAMERA: [Shot type] + [movement] + [lens/angle]
ENVIRONMENT: [Location, time of day, visual details]
LIGHTING: [Physical lighting setup, direction, quality]
ATMOSPHERE: [Environmental effects - dust, fog, particles]
AUDIO: [Dialogue/SFX/Music description]
VISUAL QUALITY: Photorealistic, cinematic composition, premium production
CONSTRAINTS: No distortion, stable composition, consistent identity
```

---

## Subject Description

### Leading with Subject (Critical)

The opening words anchor the entire generation:

❌ **Weak:** "A video showing someone walking"

✅ **Strong:** "A confident woman in her late 20s with tired but piercing green eyes, dark shoulder-length hair slightly disheveled, wearing a weathered leather jacket..."

### Character Detail Template

```
[Age] [gender] with [distinctive physical features], [hair description],
[clothing/outfit], [expression/demeanor], [pose/position]
```

---

## Action & Motion

### Single Clear Action

Use one present-tense verb describing the primary movement:

| Weak | Strong |
|------|--------|
| "is walking" | "strides confidently" |
| "looks around" | "scans the room with sharp eyes" |
| "talks" | "delivers with quiet intensity" |

### Motion Rhythm Words

Describe movement quality, not technical specs:

| Quality | Keywords |
|---------|----------|
| **Slow** | gradual, smooth, gentle, languid, deliberate |
| **Fast** | rapid, explosive, sudden, swift, dynamic |
| **Natural** | organic, flowing, authentic, unstilted |
| **Dramatic** | sweeping, powerful, intense, building |

---

## Camera Movements

### Supported Movements (8 Types)

| Movement | Description | Best For |
|----------|-------------|----------|
| **Push-in** | Camera moves toward subject | Reveals, intensity, focus |
| **Pull-out** | Camera moves away from subject | Context reveal, endings |
| **Pan** | Horizontal rotation | Environment scan, following |
| **Tracking** | Following alongside subject | Action, movement |
| **Orbit** | Circling around subject | 360° reveal, dramatic |
| **Aerial** | High/drone perspective | Establishing, scale |
| **Handheld** | Intentional shake/movement | POV, documentary, intimacy |
| **Fixed/Locked** | Static, no movement | Stability, focus, dialogue |

### Camera Rules

1. **ONE primary movement per prompt** — Don't combine multiple
2. **Use rhythmic words** — "slow push-in" not "2 seconds at 24fps"
3. **Specify angles** — Low, high, eye-level, Dutch

### Camera Keywords

```
SHOT TYPES:
  wide | medium | close-up | extreme close-up | establishing

MOVEMENTS:
  slow dolly | tracking shot | orbital movement | gentle push-in
  handheld micro-shake | arc shot | pull-back reveal

ANGLES:
  eye-level | low-angle | high-angle | Dutch angle | bird's eye
  three-quarter | front-facing | over-the-shoulder

LENS FEEL:
  wide-angle (distortion) | normal | telephoto (compression)
  shallow depth of field | deep focus
```

---

## Shot Types & Framing

| Shot | Description | Keywords |
|------|-------------|----------|
| **Wide/Establishing** | Full environment + subject small | "wide shot, establishes space" |
| **Medium** | Subject + context (waist up) | "medium shot, includes environment" |
| **Close-up** | Face/detail fills frame | "close-up, emotional focus" |
| **Extreme Close-up** | Single feature (eyes, hands) | "extreme close-up, macro detail" |
| **POV** | First-person perspective | "POV shot, camera is character's eyes" |
| **Tracking** | Following movement | "tracking shot following subject" |
| **Orbital** | 360° rotation around subject | "slow orbit around subject" |

---

## Lighting

### Lighting in Prompts

Seedance 2.0 responds strongly to explicit lighting descriptions. This is one of the highest-leverage elements.

| Type | Keywords |
|------|----------|
| **Golden Hour** | "soft golden hour lighting, warm amber tones, long shadows" |
| **Dramatic** | "dramatic rim light against dark background, high contrast" |
| **Soft/Diffused** | "soft side lighting, gentle shadows, even illumination" |
| **Neon/Colored** | "neon glow, pink and cyan accent lights, urban night" |
| **Volumetric** | "volumetric dust, light beams through atmosphere, god rays" |
| **Practical** | "lit by in-frame sources, practical lighting, realistic" |
| **Studio** | "professional three-point lighting, clean, commercial" |

### Atmosphere Effects

```
dust in the air | volumetric fog | atmospheric haze | mist
rain particles | snow falling | smoke wisps | floating embers
lens flare | halation on highlights | particle effects
```

---

## Visual Style

### Style Keywords

| Style | Keywords |
|-------|----------|
| **Cinematic** | "35mm film quality, ARRI ALEXA aesthetic, professional color grading" |
| **Documentary** | "observational, handheld, authentic, raw footage feel" |
| **Commercial** | "premium production design, polished, advertising quality" |
| **Editorial** | "high-fashion, magazine quality, dramatic lighting" |
| **Retro/Film** | "heavy film grain, slightly desaturated, vintage color" |
| **Futuristic** | "sci-fi aesthetic, sleek technology, neon accents" |

### Technical Quality Anchors

```
35mm film quality | ARRI ALEXA aesthetic | professional color grading
slightly desaturated tones | heavy film grain | sharp but imperfect focus
motion blur on fast actions | subtle chromatic aberration | 4K detail
premium production design | photorealistic rendering
```

---

## Constraints & Negative Prompts

### Quality Constraints (Always Include)

```
CONSTRAINTS:
- avoid jitter (prevents screen shaking)
- avoid bent limbs (prevents distorted limbs)
- avoid temporal flicker (for videos 5+ seconds)
- avoid identity drift (maintains character appearance)
- stable composition
- consistent identity
- no distortion
```

### Negative Instructions

Negative instructions matter equally to positive ones:

| Purpose | Constraint |
|---------|------------|
| **POV lock** | "no cuts, no zoom, natural head movement" |
| **Authentic handheld** | "no smoothness, no stabilization" |
| **Raw audio** | "no music, only raw SFX" |
| **Ultra-realism** | "no 3D, no cartoon, no VFX" |
| **Character lock** | "consistent face, no identity drift" |

---

## Multimodal References

### Reference Tagging

Use `@image1`, `@video1`, `@audio1` or `[Image1]`, `[Video1]` notation:

```
Reference @image1's character appearance, generate a scene where she
walks through a neon-lit street at night, maintaining her exact
facial features and outfit.
```

### Reference Types

| Reference | Purpose | Pattern |
|-----------|---------|---------|
| **Character** | Lock appearance | "Extract character from @image1, maintain features" |
| **Action** | Copy motion | "Reference action from @video1, apply to new scene" |
| **Camera** | Copy movement | "Reference camera movement from @video1" |
| **Style** | Copy aesthetic | "Match visual style of @image1" |
| **Audio** | Sync to beat | "Sync to rhythm of @audio1" |

### Multi-Image Reference

```
Combine @image1's character appearance with @image2's outfit
and @image3's environment. Generate scene maintaining all
three reference elements.
```

### Multi-Angle Subject Reference

```
Reference @image1 (front), @image2 (side), @image3 (back) of the
product. Generate 360° rotation showcase maintaining exact shape
and details from all angles.
```

---

## Audio Integration

### Three Audio Layers

Seedance 2.0 generates up to three simultaneous audio tracks:

| Layer | Purpose |
|-------|---------|
| **Dialogue** | Character speech with automatic lip-sync |
| **SFX** | Event-locked sounds (footsteps, impacts) |
| **BGM** | Mood-appropriate background score |

### Audio Prompt Format

**Compact format:**
```
Dialogue: "What are you waiting for?"
SFX: footsteps on wet cobblestone, distant thunder
Music: tense orchestral underscore, building
```

**Inline format:**
```
He drops the keys on the marble counter (metallic clatter),
walks toward the window (soft footsteps on hardwood), and
says in a low voice: "It's time."
```

### Dialogue Best Practices

| Do | Don't |
|----|-------|
| Put spoken lines in double quotes | Leave dialogue unmarked |
| Add pacing cues ("brief pause, then...") | Rush through lines |
| Specify tone ("whispers urgently") | Assume neutral delivery |
| Use medium close-up for lip sync | Use wide shots for dialogue |

### SFX Best Practices

Describe the source AND surface:

```
✅ "Boots on wet cobblestone" (specific)
✅ "Glass shattering on concrete floor" (source + surface)
❌ "Footsteps" (too vague)
```

### Suppressing Unwanted Audio

Always include the literal phrase:
```
no music
```

Note: "no background music" is less reliable than bare "no music".

### Audio Priority

When combining layers:
```
Dialogue clean and prominent, music low, ambient subtle
```

---

## Character Consistency

### Locking Character Appearance

1. **Provide reference image** — High-res, well-lit, front-facing
2. **Tag in prompt** — "@image1's character"
3. **Add constraint** — "avoid identity drift, consistent face"

### Multi-Shot Character Protocol

```
For a 4-shot sequence, use same reference image for all shots:

Shot 1: "@image1 character enters room..."
Shot 2: "@image1 character walks to desk..."
Shot 3: "@image1 character picks up phone..."
Shot 4: "@image1 character exits frame..."

Each shot maintains same face, outfit, proportions.
```

### Best Reference Images

| Requirement | Reason |
|-------------|--------|
| High resolution | More facial detail captured |
| Front-facing or 3/4 angle | Clear face structure |
| Well-lit | No shadows obscuring features |
| Neutral expression | Allows range of expressions |
| Transparent/clean background | Easier subject isolation |

---

## Lip Sync

### Optimal Settings

| Setting | Recommendation |
|---------|----------------|
| **Camera** | Medium close-up, locked (no movement) |
| **Angle** | Front-facing or slight three-quarter |
| **Dialogue length** | Short phrases, under 8 seconds |
| **Reference** | High-res front-facing portrait |

### Lip Sync Prompt Pattern

```
Medium close-up, locked camera. @image1's character faces camera
directly, clearly enunciating: "The moment has finally arrived."
Natural mouth movements, visible lip articulation, authentic delivery.
```

### Known Limitations

- Multi-person lip sync matching is imperfect
- Occasional audio distortion on complex phrases
- Wide shots reduce lip accuracy (face too small)

---

## Multi-Shot Narratives

### Shot Structure Format

**Always specify upfront:**
```
3 shots, 12 seconds total, 16:9 aspect ratio.

Shot 1 (0-4s): Establishing wide shot...
Shot 2 (4-8s): Medium shot...
Shot 3 (8-12s): Close-up...
```

### Escalation Arc Pattern

```
Shot 1 - Exposition: Establish calm baseline
Shot 2 - Threat: External danger emerges
Shot 3 - Manifestation: Character reveals ability/response
Shot 4 - Climax: Full confrontation, slo-motion peak
Shot 5 - Resolution: Return to equilibrium
```

### Transition Descriptions

Between shots, describe transitions:
```
Shot 1 ends with: "camera pushes into her eye, transitioning to..."
Shot 2 begins: "...extreme close-up of neural network visualization"
```

---

## Video Operations

### Video Extension

```
Extend @video1 forward: [Description of continued action]
Extend @video1 backward: [Description of preceding action]
```

### Element Modification

```
ADD: At 2s, add a butterfly landing on her shoulder
REMOVE: Remove the background crowd, keep subject and environment
MODIFY: Replace red dress with blue dress, motion unchanged
```

### Track Completion (Multi-video)

```
@video1 + @video2 + @video3 (max 15s total)

Transition 1→2: "camera whips right, motion blur connecting scenes"
Transition 2→3: "dissolve through particles of light"
```

---

## Text in Video

### Slogan/Title Text

```
Format: [Text Content] + [Timing] + [Position] + [Appearance] + [Style]

Example: Text "BELIEVE" appears center screen at 3s,
fading in with golden glow, elegant serif font
```

### Subtitles

```
Position at screen bottom, synchronized with narration:
"She whispers: 'Follow me'" — subtitle appears matching timing
```

### Speech Bubbles

```
Pattern: [Character] says: "...", speech bubbles appear around character

Example: The cat character says: "Time for adventure!"
with comic-style speech bubble appearing above its head
```

---

## Genre-Specific Patterns

### Action/Fight

```
Structure: Clear location + power mismatch + defined escalation
Method: Describe choreography beat-by-beat
Include: Slo-motion ramping for impact moments
Camera: Multi-angle orbits within continuous shots
```

### Transformation

```
Structure: Individual numbered shots with clear escalation arc
Pattern: calm → threat → transformation → aftermath
Pro tip: Add "no 3D, no cartoon, no VFX" for realistic rendering
```

### POV (First-Person)

```
Structure: Locked perspective, never breaking frame
Critical: "No cuts, no zoom, natural head movement"
Camera: "Completely unstabilized, violent raw human movement"
Purpose: Maintains perspective illusion
```

### Product/Commercial

```
Structure: Hero shot → feature highlights → lifestyle → CTA
Camera: Slow orbital, gentle push-ins, premium angles
Lighting: "Soft side lighting, high-contrast reflections"
Quality: "4K detail, crisp textures, premium production"
```

---

## Complete Prompt Examples

### Cinematic Character Scene

```
Cinematic drama video, 16:9, 8 seconds.

SUBJECT: A weathered detective in his 50s, gray stubble, tired eyes,
wearing a rumpled trench coat, standing in rain-slicked alley.

ACTION: He lights a cigarette, the flame briefly illuminating his
face, then looks up as headlights approach.

CAMERA: Medium shot, slow push-in over 8 seconds, handheld micro-shake.

ENVIRONMENT: Urban back alley at night, wet pavement reflecting neon
signs, steam rising from grates, garbage bins along walls.

LIGHTING: Dramatic rim light from distant streetlamp, neon pink and
blue accents, volumetric rain catching the light.

AUDIO: Rain pattering on concrete, distant traffic, lighter click,
cigarette sizzle. No music.

CONSTRAINTS: Avoid jitter, avoid identity drift, consistent character,
photorealistic, 35mm film grain, desaturated noir palette.
```

### Product Commercial

```
Luxury product commercial, 9:16, 10 seconds.

SUBJECT: Premium smartwatch on brushed marble surface, rose gold case,
sapphire crystal display showing time.

ACTION: Slow 180° rotation revealing all angles, display illuminates
at midpoint showing notification animation.

CAMERA: Macro detail shots, slow orbital movement, shallow depth of
field isolating product.

ENVIRONMENT: Minimalist studio, clean white infinity curve, soft
gradient background.

LIGHTING: Soft three-point setup, subtle rim highlights on metal edges,
controlled reflections on crystal.

AUDIO: Subtle electronic pulse, soft whoosh on rotation, gentle chime
on notification. No music.

CONSTRAINTS: 4K detail, crisp textures, premium production design,
stable composition, no distortion, product proportions maintained.
```

### Action Sequence

```
Action sequence, 16:9, 12 seconds, 3 shots.

Shot 1 (0-4s): Wide establishing shot. Two samurai face each other
across misty bamboo forest clearing. Dawn light filtering through.
Locked camera, tension building.

Shot 2 (4-8s): They charge simultaneously. Camera tracks alongside
at eye-level. Swords clash in center frame. Slo-motion ramp at impact.
Sparks fly, bamboo leaves scatter.

Shot 3 (8-12s): Close-up reaction. Winner's face, controlled breath,
slight nod. Loser falls out of frame. Return to normal speed.

AUDIO: Bamboo rustling, footsteps on grass accelerating, sword clash
metallic ring, impact whoosh, heavy breathing. No music.

CONSTRAINTS: @image1 samurai consistent across shots, avoid bent limbs,
sharp choreography, cinematic color grade, film grain.
```

---

## Quick Reference Card

```
STRUCTURE: Subject → Action → Environment → Camera → Style → Constraints

SUBJECT:    Lead with WHO + defining details (first 20-30 words critical)
ACTION:     Single present-tense verb, rhythmic quality words
CAMERA:     ONE movement: push-in | pull-out | pan | track | orbit | aerial | handheld | fixed
ANGLES:     eye-level | low | high | Dutch | bird's eye | POV
LIGHTING:   golden hour | dramatic rim | soft side | neon | volumetric | practical

AUDIO:
  Dialogue:  "Spoken line" + tone + pacing
  SFX:       source + surface ("boots on wet cobblestone")
  Music:     mood + intensity OR "no music"
  Priority:  "Dialogue prominent, music low, ambient subtle"

REFERENCES:
  Character: @image1's character, maintain features
  Action:    Reference action from @video1
  Camera:    Reference camera movement from @video1
  Style:     Match visual style of @image1
  Audio:     Sync to rhythm of @audio1

CONSTRAINTS:
  - avoid jitter
  - avoid bent limbs
  - avoid temporal flicker
  - avoid identity drift
  - consistent identity
  - stable composition
  - no distortion

NEGATIVE:
  "no music" | "no cuts, no zoom" | "no 3D, no cartoon" | "no stabilization"
```

---

## See Also

- **VIDEO-PROMPT-GUIDE.md** — Veo 3.1 video prompting (camera movements, dialogue)
- **IMAGE-PROMPT-GUIDE.md** — Image prompting (composition, lighting)
- **STYLE-GUIDE.md** — Visual styles reference
- **PROMPT-GUIDES-INDEX.md** — Guide routing index

---

## Sources

- [Seedance 2.0 Official Guide](https://seedance2.ai/guide)
- [Higgsfield - Seedance Prompting Guide](https://higgsfield.ai/blog/seedance-prompting-guide)
- [Imagine.art - 70 Seedance 2.0 Prompts](https://www.imagine.art/blogs/seedance-2-0-prompt-guide)
- [InVideo - Seedance 2.0 Prompt Guide](https://invideo.io/blog/seedance-2-0-prompt-guide/)
- [getimg.ai - Seedance 2.0 Overview](https://getimg.ai/blog/what-is-seedance-2-bytedance-ai-video-model)
- [fal.ai - Seedance 2.0 Prompting Guide](https://fal.ai/learn/tools/seedance-2-0-prompting-guide)
- [Lovart - Seedance 2.0 Features](https://www.lovart.ai/features/seedance-2-0-ai-video-generator)
