# Carousel Content Plan

> Full plan for image carousel (multiple images/slides).
> Instagram, LinkedIn, Facebook carousels.

---

## Content Info

```yaml
id: ""
day: 0
date: ""
platform: ""                      # instagram | linkedin | facebook
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
  product_id: ""                  # product shown across slides
  logo_id: ""                     # brand mark
# Empty + needed → pre-flight provides/generates and registers it.
```

---

## Carousel Type & Style

```yaml
# Choose the carousel type
carousel_type:
  category: ""                    # See options below
  style: ""                       # See style options

# CAROUSEL CATEGORY OPTIONS:
# ─────────────────────────────────────────────────────
# EDUCATIONAL:
#   tips_list         - "5 tips for...", each slide = 1 tip
#   how_to            - Step-by-step tutorial
#   explainer         - Concept breakdown
#   myth_vs_fact      - Debunking misconceptions
#   mistakes          - "X mistakes to avoid"
#
# STORYTELLING:
#   narrative         - Beginning → Middle → End
#   case_study        - Problem → Solution → Results
#   transformation    - Before → Process → After
#   journey           - Personal/brand story
#
# DATA/STATS:
#   statistics        - Key numbers + insights
#   research          - Study findings
#   comparison_data   - A vs B with data
#   trends            - Industry/market data
#
# LISTICLE:
#   resources         - Tools, links, recommendations
#   examples          - "X examples of..."
#   quotes            - Quote series
#   checklist         - Items to check off
#
# PROMOTIONAL:
#   product_features  - Feature showcase
#   testimonials      - Customer quotes (REAL only)
#   offer             - Sale/promo details
# ─────────────────────────────────────────────────────

# VISUAL STYLE OPTIONS:
# ─────────────────────────────────────────────────────
#   minimal          - Clean, lots of whitespace
#   bold             - Strong colors, big text
#   elegant          - Sophisticated, muted tones
#   playful          - Fun colors, illustrations
#   corporate        - Professional, structured
#   branded          - Heavy brand elements
#   photo_based      - Real photos + text
#   illustration     - Custom illustrations
#   infographic      - Data-viz style
# ─────────────────────────────────────────────────────
```

---

## Carousel Specs

```yaml
specs:
  slide_count: 0                  # 2-10 slides (IG), up to 20 (new IG)
  aspect_ratio: ""                # 1:1 | 4:5 | 9:16
```

---

## Hook (First Slide)

```yaml
hook:
  type: ""                        # question | bold_statement | curiosity | listicle_preview

  # Visual
  image_description: ""           # What the image shows
  text_overlay: ""                # Bold text on image

  # Goal
  swipe_trigger: ""               # Why they swipe to next
```

---

## Slides (Body)

```yaml
slides:
  - slide: 1
    role: "hook"                  # hook | content | cta
    image_description: ""         # What image shows
    text_overlay: ""              # Text on image
    key_point: ""                 # Main message of this slide

  - slide: 2
    role: "content"
    image_description: ""
    text_overlay: ""
    key_point: ""

  - slide: 3
    role: "content"
    image_description: ""
    text_overlay: ""
    key_point: ""

  # ... more slides

  - slide: 10
    role: "cta"
    image_description: ""
    text_overlay: ""              # CTA text
    key_point: ""
```

---

## Visual Style

```yaml
style:
  overall: ""                     # minimalist | bold | elegant | playful
  color_scheme: ""                # Brand colors, or describe
  font_style: ""                  # Clean sans-serif, bold headers, etc.
  image_type: ""                  # photo | illustration | graphic | mixed

  consistency:
    same_background: false
    same_layout: false
    brand_element: ""             # Logo, icon, color bar, etc.
```

---

## Ending & CTA (Last Slide)

```yaml
ending:
  cta_text: ""                    # e.g., "Save this post!", "Follow for more"
  cta_action: ""                  # save | share | follow | comment | link
  show_logo: false
  show_handle: false
```

---

## Caption & Hashtags

```yaml
caption:
  text: |
    [Full caption - summarize carousel + CTA]

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
    count: 0
    rate: 0.067
    subtotal: 0

  total: 0
```

---

## Generation Checklist

```yaml
checklist:
  - [ ] All slides planned
  - [ ] Text overlays written
  - [ ] Style consistent
  - [ ] Hook strong
  - [ ] CTA clear
  - [ ] Caption written
  - [ ] Images generated
  - [ ] Final review
```

---

## Output Files

```yaml
outputs:
  slides:
    - "slide-01.png"
    - "slide-02.png"
    # ...
  caption_file: "caption.md"

output_path: ""
```
