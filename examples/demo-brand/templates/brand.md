# Brand Guidelines — Sunrise Roasters (Demo)

> ⚠️ FICTIONAL DEMO BRAND — shows what a completed brand.md looks like.

---

## Brand Identity

### Basic Info
```yaml
brand_name: "Sunrise Roasters"
tagline: "Fresh from the roast, straight to your morning."
website: "https://sunriseroasters.example.com"
industry: "Specialty coffee / DTC ecommerce"
```

### Brand Personality
```yaml
personality:
  - Warm
  - Down-to-earth
  - Craft-obsessed
  - Welcoming
  - Honest

tone: "Like a friendly barista who loves explaining coffee without ever making you feel dumb"

we_are:
  - Warm and inviting — coffee is a ritual, not a flex
  - Transparent about sourcing and roast dates
  - Enthusiastic about craft without the jargon

we_are_not:
  - Snobby or gatekeep-y
  - Corporate or sterile
  - Hype-driven ("life-changing!!" is banned)
```

---

## Visual Identity

### Colors
```yaml
colors:
  primary: "#C4622D"      # Burnt sienna — roasted warmth, CTAs and headers
  secondary: "#2F4538"    # Deep forest green — bags, accents, farm/origin content
  accent: "#F2B441"       # Sunrise gold — highlights, sparingly
  dark: "#2B1D16"         # Espresso brown — text, dark backgrounds
  light: "#FAF3EA"        # Warm cream — backgrounds

color_notes: |
  - Warm palette always; avoid cool blues and grays
  - Cream backgrounds, not pure white — everything feels sunlit
  - Gold accent only for the sunrise motif and key CTAs
```

### Typography Feel
```yaml
typography:
  headings: "Friendly rounded serif (like Recoleta, Fraunces)"
  body: "Clean humanist sans-serif"
  feel: "Warm and crafted, like a nice café menu — never techy"

text_style:
  - Short, warm headlines (3-5 words)
  - Sentence case, never ALL CAPS
  - Text on cream boxes or espresso-brown bars for readability
```

### Logo Usage
```yaml
logo:
  file: "./assets/logos/logo.png"            # generate via /generate-brand-assets
  file_white: "./assets/logos/logo-white.png"
  min_size: "Never smaller than 80px wide"
  clear_space: "One 'sun ray' height of padding on all sides"
  placement: "Bottom right for videos, centered for outros"

logo_donts:
  - Don't place on busy photographic backgrounds without the cream badge
  - Don't recolor outside the brand palette
```

---

## Content Guidelines

### Target Audience
```yaml
audience:
  primary:
    age: "25-40"
    description: "Home coffee upgraders — own decent gear, tired of stale beans"
    goals: "Café-quality mornings at home"
    pain_points: "Stale supermarket coffee, jargon-heavy specialty scene, subscription pile-up"

  secondary:
    age: "25-55"
    description: "Gift buyers wanting a thoughtful consumable gift"
```

### Messaging Framework
```yaml
key_messages:
  - "Roasted to order — ships within 48 hours of roasting"
  - "Every bag names its farm"
  - "Freshness you can actually taste"

proof_points:
  - "4,200+ subscribers"          # FICTIONAL — use real numbers only
  - "4.9/5 from 870+ reviews"     # FICTIONAL — use real numbers only

cta_phrases:
  primary: "Try your first box"
  secondary: "See all roasts"
  urgent: "This lot is limited to 400 bags"
```

### Content Restrictions
```yaml
restrictions:
  never_say:
    - "World's best coffee" (unverifiable)
    - "Life-changing" (hype)
    - Competitor names
    - Health claims ("boosts metabolism" etc.)

  disclaimers: []

  policies:
    - Always show the roast-date stamp when the bag is visible
    - Farm names only when the sourcing is real (in demo: fictional)
    - Real, lived-in kitchens — no sterile staged sets
```

---

## Visual Style for Video

### Overall Aesthetic
```yaml
aesthetic:
  style: "Warm, natural, softly cinematic"
  mood: "Slow morning ritual — calm, sensory, inviting"
  references:
    - "Kinfolk magazine photography"
    - "Aesop product films (but warmer)"
    - "Slow-morning coffee TikToks"

  avoid:
    - "Cool/blue color grading"
    - "Fast, jittery cuts"
    - "Stocky smiling-at-camera shots"
```

### Character/Talent Guidelines
```yaml
talent:
  appearance:
    - "Real, relatable people — not models"
    - "Cozy textures: knits, linen, denim aprons"
    - "Hands featured often (pouring, holding mugs, scooping beans)"

  expressions:
    - "Content, unhurried — the first-sip exhale"
    - "Genuine focus while brewing"

  clothing_colors:
    preferred: ["Cream", "Rust", "Forest green", "Warm denim"]
    avoid: ["Neon", "Cool grays", "Busy logos"]
```

### Environment/Setting
```yaml
settings:
  preferred:
    - "Sunlit home kitchen, morning golden light"
    - "Wooden counters, ceramic mugs, linen towels"
    - "The roastery: small drum roaster, burlap sacks"

  avoid:
    - "Sterile white studios"
    - "Office/desk settings"

  props:
    include: ["Pour-over kit", "Ceramic mugs", "Bean bags with roast-date stamp", "Morning newspaper/book"]
    avoid: ["Branded competitor gear", "Energy drinks", "Plastic cups"]
```

---

## Audio Guidelines

### Music Style
```yaml
music:
  genres:
    preferred: ["Warm lo-fi", "Acoustic folk", "Soft jazz"]
    avoid: ["EDM", "Corporate upbeat", "Anything aggressive"]

  mood_by_section:
    hook: "Intriguing but gentle"
    problem: "Muted, flat (like stale coffee)"
    solution: "Warming up, adding instruments"
    success: "Full, cozy, satisfied"
    cta: "Confident and calm"
```

### Voice-over
```yaml
voiceover:
  preferred_voice:
    gender: "Female (primary) — see voice-maya in config/assets.yaml"
    age: "30s sounding"
    accent: "Neutral American, slight warmth"
    tone: "Calm, warm, a little wry — never salesy"

  pacing: "Unhurried, with room to breathe — matches the slow-morning aesthetic"

  delivery:
    - "Savor sensory words (bloom, blueberry, buttery)"
    - "Land the roast-date fact clearly"
    - "CTA delivered like a friend's recommendation"
```

---

## Templates

### Intro/Outro
```yaml
intro:
  duration: "2-3 seconds"
  elements: ["Sunrise mark fade-in over morning light footage"]
  music: "First warm chord of track"

outro:
  duration: "5 seconds"
  elements:
    - Logo centered on cream background
    - "Try your first box — 20% off with SUNRISE20"
    - Website URL
  music: "Resolve, single mug-clink sound"
```

### Text Overlays
```yaml
text_overlays:
  headline:
    font_weight: "Bold serif"
    position: "Top third"
    max_words: 5
    example: "Stale coffee? Never again."

  subhead:
    font_weight: "Regular"
    position: "Below headline"
    max_words: 10
    example: "Roasted to order. Shipped in 48 hours."

  cta:
    font_weight: "Bold"
    position: "Bottom third"
    style: "Cream button with espresso text"
    example: "Try your first box →"
```
