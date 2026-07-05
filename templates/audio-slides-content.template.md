# Audio + Slides Content Plan

> Full plan for audio content with image slides.
> Podcast clips, audiograms, educational audio.

---

## Content Info

```yaml
id: ""
day: 0
date: ""
platform: ""                      # instagram | tiktok | youtube | spotify
pillar: ""
status: "planned"
```

---

## Assets (from registry)

> Reference reusable assets by their `id` in `config/assets.yaml`. The generator resolves
> these with `resolveAsset(...)` so the narrator voice and visuals stay consistent.

```yaml
assets:
  voice_id: ""                    # narrator voice (locks audio identity)
  music_id: ""                    # background bed
  character_id: ""                # if slides show a person
  logo_id: ""                     # brand mark
# Empty + needed → pre-flight provides/generates and registers it.
```

---

## Audio Specs

```yaml
audio:
  type: ""                        # voiceover | podcast_clip | narration | interview
  duration: 0                     # Total seconds
  format: "wav"                   # wav | mp3

voice:
  speaker: ""                     # single | multi
  voice_name: ""                  # Kore, Charon, Aoede, Puck, Zephyr
  tone: ""                        # warm, professional, energetic
  pace: ""                        # slow | moderate | fast
```

---

## Slides Specs

```yaml
slides:
  count: 0                        # Number of slides
  aspect_ratio: ""                # 1:1 | 9:16 | 16:9
  style: ""                       # minimal | bold | branded
  transition: ""                  # cut | fade | slide
```

---

## Script & Slides Sync

```yaml
# Each section = one slide
sections:
  - id: 1
    timestamp: "0:00"
    duration: 0                   # Seconds this slide shows

    # Audio
    script: |
      [What is spoken]

    # Visual
    slide:
      image_description: ""       # What image shows
      text_overlay: ""            # Key text on slide
      style: ""                   # For this slide

  - id: 2
    timestamp: "0:05"
    duration: 0
    script: |
      [What is spoken]
    slide:
      image_description: ""
      text_overlay: ""

  # ... continue for all sections
```

---

## Visual Style

```yaml
style:
  background: ""                  # Solid color, gradient, image
  text_style: ""                  # Bold headlines, clean, handwritten
  color_scheme: ""                # Brand colors
  waveform: false                 # Show audio waveform?
  speaker_image: false            # Show speaker photo?
```

---

## Caption & Hashtags

```yaml
caption:
  text: |
    [Caption for the post]

  hashtags:
    - ""
    - ""

  mentions: []
```

---

## Cost Estimate

```yaml
costs:
  audio:
    tts_sentences: 0
    rate: 0.001
    subtotal: 0

  images:
    count: 0
    rate: 0.067
    subtotal: 0

  total: 0
```

---

## Generation Steps

```yaml
checklist:
  - [ ] Script written
  - [ ] Slides planned
  - [ ] Audio generated (TTS)
  - [ ] Slides generated (images)
  - [ ] Audio + slides synced
  - [ ] Final review
```

---

## Output Files

```yaml
outputs:
  audio: "audio.wav"
  slides:
    - "slide-01.png"
    - "slide-02.png"
    # ...
  final_video: "audiogram.mp4"    # Combined audio + slides
  caption_file: "caption.md"

output_path: ""
```
