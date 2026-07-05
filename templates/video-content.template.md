# Video Content Plan

> Full plan for a single video content piece.
> Contains everything needed to generate the video.

---

## Content Info

```yaml
id: ""                            # e.g., "d01-c01"
day: 0
date: ""
platform: ""                      # tiktok | instagram | youtube | facebook
pillar: ""                        # educational | promotional | engagement | testimonial | behind_scenes
status: "planned"                 # planned | approved | generating | completed
```

---

## Assets (from registry)

> Reference reusable assets by their `id` in `config/assets.yaml` instead of re-describing
> them. The generator resolves these with `resolveAsset(...)` and reuses the locked files,
> so the character / product / voice stay identical across every piece.

```yaml
assets:
  character_id: ""                # e.g. "char-founder" — locked character to reuse ("" = generate + register)
  product_id: ""                  # e.g. "prod-bottle"
  voice_id: ""                    # e.g. "voice-sarah" — narrator / character voice
  music_id: ""                    # e.g. "music-main" — background bed
  logo_id: ""                     # e.g. "logo-primary" — end card
  location_id: ""                 # e.g. "loc-studio" — recurring setting
# If an id is empty and this content needs that asset, pre-flight will
# provide/generate it, then register it so later plans can reference it.
```

---

## Video Specs

```yaml
specs:
  duration: 0                     # Total seconds
  aspect_ratio: ""                # 9:16 | 16:9 | 1:1 | 4:5
  resolution: ""                  # 720p | 1080p
  has_audio: true
  has_captions: false             # Burned-in captions?
```

---

## Hook (First 1-3 seconds)

```yaml
hook:
  type: ""                        # problem | curiosity | result | story | shock | question

  # What viewer sees
  visual: ""                      # e.g., "Close-up frustrated face"
  text_overlay: ""                # On-screen text (if any)

  # What viewer hears
  dialogue: ""                    # What character says
  sound: ""                       # Sound effect, music drop

  # Goal
  stop_scroll_factor: ""          # Why this makes them stop
```

---

## Body (Main content)

```yaml
body:
  structure: ""                   # problem-solution | story-arc | tips-list | demo | testimonial

  scenes:
    - id: 1
      name: ""                    # e.g., "problem", "solution", "demo"
      duration: 0                 # 4-8 seconds for Veo
      continues_from: null        # null = new scene, or previous id

      # Action
      action: ""                  # What happens visually
      emotion: ""                 # Character emotion

      # Dialogue (if character speaks)
      dialogue: ""
      voice_style: ""             # tone, gender, age, accent

      # Visuals
      setting: ""
      camera: ""                  # slow push, static, orbit, etc.
      text_overlay: ""            # On-screen text

      # For generation
      keyframes:
        start: true
        end: true

    - id: 2
      name: ""
      duration: 0
      continues_from: 1
      action: ""
      emotion: ""
      dialogue: ""
      # ... etc
```

---

## Ending & CTA (Last 2-5 seconds)

```yaml
ending:
  type: ""                        # hard_cta | soft_cta | cliffhanger | loop

  # Call to action
  cta_spoken: ""                  # What character says
  cta_text: ""                    # On-screen text
  cta_action: ""                  # "Link in bio", "Follow", "Comment"

  # Visuals
  show_logo: false
  show_handle: false
  end_screen_duration: 0          # Seconds for end card
```

---

## Character (if has_character = true)

```yaml
character:
  has_character: false
  speaks_in_video: false

  # Appearance (for consistency)
  description: ""                 # Age, gender, ethnicity
  hair: ""
  clothing: ""
  accessories: ""

  # Voice (if speaks)
  voice_gender: ""
  voice_age: ""
  voice_tone: ""                  # warm, authoritative, energetic
  voice_accent: ""

  # Prompt block (agent fills)
  CHARACTER_BLOCK: |
    [Generated from above]
```

---

## Environment

```yaml
environment:
  location: ""                    # e.g., "bedroom study corner"
  lighting: ""                    # e.g., "warm natural light"
  key_props: []
  background: ""

  # Prompt block (agent fills)
  ENVIRONMENT_BLOCK: |
    [Generated from above]
```

---

## Style & Tone

```yaml
style:
  visual_style: ""                # polished | ugc_authentic | cinematic | minimal
  color_mood: ""                  # warm | cool | vibrant | muted
  pacing: ""                      # fast_cuts | moderate | slow_cinematic

tone:
  voice: ""                       # professional | casual | energetic | emotional
  mood: ""                        # inspiring | urgent | calm | playful
```

---

## Thumbnail

```yaml
thumbnail:
  # Choose thumbnail style
  style: ""                       # See options below

  # THUMBNAIL STYLE OPTIONS:
  # ─────────────────────────────────────────────────────
  #   face_reaction    - Expressive face + bold text
  #   before_after     - Split comparison (left/right)
  #   text_heavy       - Bold text, minimal background
  #   product_hero     - Product/result prominently shown
  #   scene_capture    - Key moment from video
  #   minimal          - Clean, simple, branded
  #   question         - "?" with curious visual
  #   numbered         - Big number + topic (listicle)
  # ─────────────────────────────────────────────────────

  # Image description
  description: |
    [Detailed description for thumbnail generation]

  # Text overlay
  text_overlay:
    headline: ""                  # Main text (2-5 words, big)
    subtext: ""                   # Supporting text (optional)
    position: ""                  # top | center | bottom | custom

  # For face_reaction style
  face:
    expression: ""                # shocked | excited | curious | frustrated | happy
    looking_at: ""                # camera | product | off-screen
    same_as_video: true           # Use video character?

  # For before_after style
  split:
    left_label: ""                # "Before" / "Without"
    right_label: ""               # "After" / "With"
    left_description: ""
    right_description: ""

  # Visual specs
  specs:
    aspect_ratio: ""              # 16:9 (YouTube) | 9:16 (Reels) | 1:1
    resolution: ""                # 1280x720, 1080x1920, etc.

  # Style elements
  style_elements:
    colors: ""                    # Brand colors or describe
    font_style: ""                # Bold sans-serif, clean, etc.
    border: ""                    # None, colored border, etc.
    logo: false
    brand_element: ""             # Corner badge, watermark, etc.

  # Click trigger
  click_trigger: ""               # Why this makes them click
```

---

## Caption & Hashtags

```yaml
caption:
  text: |
    [Full caption text here]

  hashtags:
    - ""
    - ""
    - ""

  mentions: []                    # @accounts to tag

  link: ""                        # URL if applicable
```

---

## Cost Estimate

```yaml
costs:
  keyframes:
    count: 0
    rate: 0.067
    subtotal: 0

  video:
    seconds: 0
    model: ""                     # veo31 | veo31lite
    rate: 0
    subtotal: 0

  thumbnail:
    count: 1
    rate: 0.067
    subtotal: 0.067

  total: 0
```

---

## Generation Checklist

```yaml
checklist:
  pre_generation:
    - [ ] All scenes defined
    - [ ] Character defined (if needed)
    - [ ] Dialogue written
    - [ ] Hook approved
    - [ ] Thumbnail planned
    - [ ] Cost approved

  generation:
    - [ ] Keyframes generated
    - [ ] Keyframes reviewed
    - [ ] Videos generated
    - [ ] Videos combined
    - [ ] Audio verified
    - [ ] Thumbnail generated

  post_generation:
    - [ ] Caption written
    - [ ] Hashtags added
    - [ ] Final review
```

---

## Output Files

```yaml
outputs:
  keyframes: []
  video_clips: []
  final_video: ""
  thumbnail: ""
  caption_file: ""

output_path: ""                   # e.g., "output-contents/day-01/content-01/"
```
