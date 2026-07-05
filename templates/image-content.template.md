# Single Image Content Plan

> Full plan for single image post.
> Instagram, Facebook, Twitter, LinkedIn.

---

## Content Info

```yaml
id: ""
day: 0
date: ""
platform: ""
pillar: ""
status: "planned"
```

---

## Assets (from registry)

> Reference reusable assets by their `id` in `config/assets.yaml` so the look stays
> consistent. The generator resolves these with `resolveAsset(...)`.

```yaml
assets:
  character_id: ""                # locked character to reuse ("" = generate + register)
  product_id: ""                  # product reference
  logo_id: ""                     # brand mark
# Empty + needed → pre-flight provides/generates and registers it.
```

---

## Image Type & Style

```yaml
# Choose the image type
image_type:
  category: ""                    # See options below
  style: ""                       # See style options

# IMAGE CATEGORY OPTIONS:
# ─────────────────────────────────────────────────────
# PHOTO STYLES:
#   photo_realistic    - Real-looking photo
#   lifestyle          - Product in context
#   portrait           - Person focused
#   flat_lay           - Top-down arrangement
#   behind_scenes      - Authentic, raw
#
# GRAPHIC STYLES:
#   quote_graphic      - Quote + design
#   tip_graphic        - Single tip visual
#   stat_graphic       - Big number + context
#   announcement       - News/launch visual
#   meme               - Humor, relatable
#
# INFOGRAPHIC STYLES:
#   infographic_stat   - Data/numbers focused
#   infographic_list   - Multiple points + icons
#   infographic_process - Steps/flow
#   infographic_compare - A vs B
#   infographic_timeline - Chronological
#   infographic_map    - Geographic data
#
# THUMBNAIL STYLES:
#   thumbnail_face     - Expressive face + text
#   thumbnail_before_after - Split comparison
#   thumbnail_text     - Bold text, minimal image
#   thumbnail_product  - Product hero shot
#   thumbnail_minimal  - Clean, simple
#   thumbnail_question - "?" + curious visual
# ─────────────────────────────────────────────────────
```

---

## Image Specs

```yaml
specs:
  aspect_ratio: ""                # 1:1 | 4:5 | 16:9 | 9:16 | 3:2
  resolution: ""                  # 1080x1080, 1080x1350, etc.
```

---

## Image Content

```yaml
image:
  # What the image shows
  description: |
    [Detailed description for image generation]

  # Text on image (if any)
  text_overlay:
    headline: ""                  # Main text (keep short)
    subtext: ""                   # Supporting text
    position: ""                  # top | center | bottom
    font_style: ""                # bold | clean | handwritten

  # Visual elements
  subject: ""                     # Main focus of image
  background: ""                  # Background description
  mood: ""                        # Bright, moody, minimal, bold
  colors: ""                      # Color palette or brand colors

  # For infographics
  data_points: []                 # Numbers/stats to show
  icons: []                       # Icons to include

  # For thumbnails
  face_expression: ""             # If face: shocked, happy, curious
  split_layout: false             # For before/after
```

---

## Style

```yaml
style:
  visual: ""                      # polished | raw | minimal | bold
  brand_elements:
    logo: false
    colors: false
    watermark: false
```

---

## Caption & Hashtags

```yaml
caption:
  hook: ""                        # First line (most important)

  body: |
    [Rest of caption]

  cta: ""                         # Call to action

  hashtags:
    - ""
    - ""
    - ""

  mentions: []
```

---

## Cost Estimate

```yaml
costs:
  images:
    count: 1
    rate: 0.067
    subtotal: 0.067

  total: 0.067
```

---

## Output Files

```yaml
outputs:
  image: "image.png"
  caption_file: "caption.md"

output_path: ""
```
