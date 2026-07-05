---
name: music-content
description: |
  Generate music using Gemini Lyria models. Use when user asks for
  "create music", "generate song", "background music", "soundtrack",
  "jingle", "audio track", "beat", or any music creation request.
license: MIT
allowed-tools:
  - generateMusicTrack
---

# Music Content Generation Skill

## When This Skill Activates

- User wants background music for video
- User needs a jingle or soundtrack
- User asks for music generation
- User wants audio tracks

---

## STEP 1: Ask Music Purpose

**Ask the user:**

> What do you need the music for?
>
> 1. **Video Background** - Ambient/subtle for video content
> 2. **Intro/Outro** - Short jingle for show/podcast
> 3. **Advertisement** - Energetic promo music
> 4. **Full Song** - Complete track with structure
> 5. **Mood Piece** - Atmosphere/ambient
> 6. **Other** - I'll describe

**Store answer as**: `musicPurpose`

---

## STEP 2: Ask Duration

**Ask the user:**

> How long should the music be?
>
> **Short (Lyria 3)** - Up to 30 seconds
> - Best for: Intros, jingles, short clips
> - Cost: $0.04 per clip
>
> **Full Length (Lyria 3 Pro)** - Up to 3 minutes
> - Best for: Full songs, longer videos
> - Cost: $0.08 per song

**Store answer as**: `duration` and `model`

| Duration | Model | Cost |
|----------|-------|------|
| ≤30 seconds | lyria-3 | $0.04 |
| 31-180 seconds | lyria-3-pro | $0.08 |

---

## STEP 3: Ask Genre/Style

**Ask the user:**

> What genre or style?
>
> 1. **Electronic/EDM** - Synths, beats, modern
> 2. **Ambient** - Atmospheric, calm, minimal
> 3. **Corporate** - Professional, uplifting, business
> 4. **Cinematic** - Epic, orchestral, dramatic
> 5. **Acoustic** - Guitar, piano, organic
> 6. **Upbeat/Pop** - Catchy, energetic, fun
> 7. **Lo-Fi** - Chill, relaxed, study music
> 8. **Other** - I'll describe

**Store answer as**: `genre`

---

## STEP 4: Ask Mood/Energy

**Ask the user:**

> What mood or energy level?
>
> **Energy:**
> - Low energy (calm, peaceful, meditative)
> - Medium energy (balanced, flowing, steady)
> - High energy (exciting, powerful, driving)
>
> **Mood:**
> - Happy/Uplifting
> - Mysterious/Intriguing
> - Dramatic/Intense
> - Calm/Peaceful
> - Melancholic/Emotional
> - Energetic/Exciting

**Store answers as**: `energy`, `mood`

---

## STEP 5: Build Music Prompt

### Prompt Structure

```
[GENRE] music for [PURPOSE].
[MOOD] and [ENERGY LEVEL].
[INSTRUMENTS/SOUNDS].
[TEMPO/RHYTHM].
[ADDITIONAL DETAILS].
```

### Genre Prompt Templates

**Electronic/EDM:**
```
Modern electronic music with synthesizers and driving beats.
{mood} atmosphere with {energy} energy.
Crisp drums, layered synths, and bass drops.
{bpm} BPM, suitable for {purpose}.
```

**Ambient:**
```
Atmospheric ambient music with ethereal textures.
{mood} and {energy} feeling.
Soft pads, subtle drones, and gentle movement.
Spacious and immersive, perfect for {purpose}.
```

**Corporate:**
```
Professional corporate music with uplifting tone.
{mood}, {energy} energy level.
Acoustic guitar, light percussion, and piano.
Inspiring and motivational, suitable for {purpose}.
```

**Cinematic:**
```
Epic cinematic orchestral music.
{mood} with {energy} intensity.
Strings, brass, and percussion building dramatically.
Movie soundtrack quality for {purpose}.
```

**Lo-Fi:**
```
Chill lo-fi hip hop beat with warm vinyl crackle.
Relaxed and {mood} atmosphere.
Mellow piano, soft drums, and ambient textures.
Perfect for studying or {purpose}.
```

---

## STEP 6: Reference Image (Optional)

**Ask the user:**

> Do you have a reference image for the mood?
> (Optional - can help capture the visual atmosphere)

If provided, pass the image path to the workflow function:

```typescript
const result = await generateMusicTrack({
  prompt: musicPrompt,
  outputPath: 'music.wav',
  quality: 'standard',
  durationSeconds: duration,
  referenceImagePath: 'reference.jpg'
});
```

---

## STEP 7: Confirm and Generate

**Show summary:**

```
📋 MUSIC GENERATION PLAN
========================
Purpose: {musicPurpose}
Genre: {genre}
Mood: {mood}
Energy: {energy}
Duration: {duration} seconds
Model: {model}

Estimated Cost: ${cost}

Proceed? (yes/no)
```

**Generate:**

Use the pre-built workflow function — it validates the duration per quality, retries, saves the `.wav`, and reports cost:

```typescript
import { generateMusicTrack } from '../index';

const result = await generateMusicTrack({
  prompt: finalPrompt,
  outputPath: 'music.wav',
  quality: 'standard', // or 'pro' for full songs up to 180s
  durationSeconds: duration
});

// result.data.audioPath, result.data.cost.totalCost
```

---

## Preset Prompts

### Video Background - Corporate
```
Upbeat corporate background music with light acoustic guitar and subtle percussion.
Positive and professional atmosphere.
Medium energy, not distracting.
Perfect for business presentations and explainer videos.
```

### Video Background - Tech
```
Modern electronic ambient music with soft synth pads.
Futuristic and innovative feeling.
Low to medium energy, atmospheric.
Suitable for tech product videos and demos.
```

### Intro/Outro - Podcast
```
Short energetic podcast intro music.
Upbeat and catchy with modern production.
Builds quickly and ends with a memorable hook.
15 seconds, suitable for show opening.
```

### Intro/Outro - YouTube
```
Catchy YouTube intro jingle.
Fun, energetic, and memorable.
Electronic elements with punchy drums.
5-10 seconds, instant brand recognition.
```

### Advertisement - High Energy
```
Exciting advertisement music with driving beat.
High energy, urgent, and attention-grabbing.
Modern pop/electronic hybrid.
Builds to an impactful climax.
```

### Ambient - Meditation
```
Peaceful meditation music with gentle drones.
Calm, serene, and deeply relaxing.
Soft synthesizer pads and nature-inspired textures.
Minimal and spacious.
```

### Cinematic - Epic
```
Epic cinematic orchestral score.
Dramatic, powerful, and emotionally stirring.
Full orchestra with soaring strings and powerful brass.
Builds from quiet to thunderous climax.
```

---

## Model Comparison

| Feature | Lyria 3 | Lyria 3 Pro |
|---------|---------|-------------|
| Max Duration | 30 seconds | 3 minutes |
| Cost | $0.04/clip | $0.08/song |
| Best For | Jingles, clips | Full songs |
| Quality | Good | Better |

---

## Tips for Better Results

1. **Be specific about instruments** - "acoustic guitar and soft piano" vs "music"
2. **Describe the vibe** - "coffee shop atmosphere" vs "relaxed"
3. **Mention BPM if known** - "120 BPM upbeat" for precise tempo
4. **Reference known styles** - "like Apple commercial music"
5. **Describe the arc** - "builds from quiet to powerful"
