# Brand Guidelines Template

> Copy this file to `brand.md` and fill in your brand details.
> Agents will read this file to maintain brand consistency across all content.

---

## Brand Identity

### Basic Info
```yaml
brand_name: "Your Brand Name"
tagline: "Your catchy tagline here"
website: "https://yourbrand.com"
industry: "Education / Tech / Health / Finance / etc."
```

### Brand Personality
```yaml
# Choose 3-5 personality traits
personality:
  - Professional
  - Friendly
  - Innovative
  - Trustworthy
  - Playful
  - Bold
  - Calm
  - Energetic

# Tone of voice
tone: "Conversational but professional, encouraging, never condescending"

# What we ARE vs what we're NOT
we_are:
  - Supportive and encouraging
  - Clear and straightforward
  - Confident but humble

we_are_not:
  - Pushy or salesy
  - Overly formal or stiff
  - Condescending or preachy
```

---

## Visual Identity

### Colors
```yaml
colors:
  primary: "#2563EB"      # Main brand color (buttons, highlights)
  secondary: "#10B981"    # Supporting color (success, accents)
  accent: "#F59E0B"       # Attention/CTA color
  dark: "#1F2937"         # Text, dark backgrounds
  light: "#F9FAFB"        # Light backgrounds

# Color usage notes
color_notes: |
  - Primary blue for main CTAs and headers
  - Green for success states and positive outcomes
  - Orange sparingly for urgent CTAs only
  - Never use red (associated with errors)
```

### Typography Feel
```yaml
typography:
  headings: "Bold, modern sans-serif (like Inter, Poppins)"
  body: "Clean, readable sans-serif"
  feel: "Modern and approachable, not corporate or stuffy"

# Text in videos
text_style:
  - Bold headlines, short (3-5 words max)
  - Sentence case, not ALL CAPS
  - Always readable against background (use shadows/boxes)
```

### Logo Usage
```yaml
logo:
  file: "./assets/logo.png"           # Path to logo file
  file_white: "./assets/logo-white.png"  # White version for dark backgrounds
  min_size: "Never smaller than 100px wide"
  clear_space: "Always have padding around logo"
  placement: "Bottom right corner for videos, centered for outros"

# Logo don'ts
logo_donts:
  - Don't stretch or distort
  - Don't place on busy backgrounds
  - Don't use low resolution versions
```

---

## Content Guidelines

### Target Audience
```yaml
audience:
  primary:
    age: "18-35"
    description: "University students and young professionals"
    goals: "Career advancement, skill development"
    pain_points: "Time constraints, test anxiety, unclear study paths"

  secondary:
    age: "35-50"
    description: "Working professionals seeking certification"
    goals: "Career change, immigration, academic advancement"
```

### Messaging Framework
```yaml
# Key messages to reinforce
key_messages:
  - "Achieve your target score faster"
  - "Learn from proven methods"
  - "Join thousands of successful students"

# Proof points / Social proof
proof_points:
  - "10,000+ students achieved Band 7+"
  - "95% satisfaction rate"
  - "Featured in [Publication]"

# Call-to-action phrases
cta_phrases:
  primary: "Start Free Trial"
  secondary: "Learn More"
  urgent: "Limited Spots Available"
```

### Content Restrictions
```yaml
restrictions:
  # Words/phrases to avoid
  never_say:
    - "Guaranteed results" (legal issue)
    - "Easy" or "Effortless" (undermines effort)
    - "The best" without qualification
    - Competitor names

  # Required disclaimers
  disclaimers:
    - "Results may vary" (for testimonials)
    - "Free trial requires registration"

  # Content policies
  policies:
    - No unrealistic promises
    - Always show diverse representation
    - No stock photos that look fake
```

---

## Visual Style for Video

### Overall Aesthetic
```yaml
aesthetic:
  style: "Modern, clean, minimal"
  mood: "Aspirational but achievable"
  references:
    - "Apple product videos"
    - "Headspace app"
    - "Duolingo ads"

  # What to avoid
  avoid:
    - "Corporate stock footage feel"
    - "Overly flashy transitions"
    - "Cluttered frames"
```

### Character/Talent Guidelines
```yaml
talent:
  appearance:
    - "Diverse representation"
    - "Relatable, not models"
    - "Smart casual clothing"
    - "Natural makeup, authentic look"

  expressions:
    - "Genuine smiles, not forced"
    - "Show real emotion (struggle → success)"
    - "Eye contact with camera for connection"

  clothing_colors:
    preferred: ["Navy", "White", "Light blue", "Soft earth tones"]
    avoid: ["Bright red", "Neon colors", "Busy patterns"]
```

### Environment/Setting
```yaml
settings:
  preferred:
    - "Modern home office / study space"
    - "Clean, minimal desk setup"
    - "Natural lighting, warm tones"
    - "Plants, books as subtle props"

  avoid:
    - "Dark, cramped spaces"
    - "Cluttered backgrounds"
    - "Obviously fake/staged setups"

  props:
    include: ["Laptop/tablet", "Notebook", "Coffee/tea", "Subtle plant"]
    avoid: ["Competitor products", "Alcohol", "Messy items"]
```

---

## Audio Guidelines

### Music Style
```yaml
music:
  genres:
    preferred: ["Upbeat electronic", "Inspiring acoustic", "Modern corporate"]
    avoid: ["Heavy metal", "Sad/melancholic", "Overly generic stock"]

  mood_by_section:
    hook: "Attention-grabbing, energetic"
    problem: "Tense but not dark"
    solution: "Hopeful, building"
    success: "Triumphant, uplifting"
    cta: "Confident, clear"
```

### Voice-over
```yaml
voiceover:
  preferred_voice:
    gender: "Female or Male (match target audience)"
    age: "25-35 sounding"
    accent: "Neutral American or British RP"
    tone: "Warm, encouraging, confident"

  pacing: "Natural, not rushed, with pauses for emphasis"

  # Specific instructions
  delivery:
    - "Emphasize key benefits"
    - "Slow down for important numbers/stats"
    - "End CTA with confident, clear tone"
```

---

## Templates

### Intro/Outro
```yaml
intro:
  duration: "3-5 seconds"
  elements: ["Logo animation", "Tagline"]
  music: "Brand jingle or first notes of track"

outro:
  duration: "5-8 seconds"
  elements:
    - Logo centered
    - CTA text below
    - Website URL
    - Social handles (optional)
  music: "Resolve to brand jingle"
```

### Text Overlays
```yaml
text_overlays:
  headline:
    font_weight: "Bold"
    position: "Center or top third"
    max_words: 5
    example: "Stuck at Band 6?"

  subhead:
    font_weight: "Regular"
    position: "Below headline"
    max_words: 10
    example: "Join 10,000+ students who scored Band 7+"

  cta:
    font_weight: "Bold"
    position: "Bottom third"
    style: "Button-like or underlined"
    example: "Start Free Trial →"
```

---

## File Checklist

Before generating content, ensure you have:

- [ ] `brand.md` - This file, filled in
- [ ] `assets/logo.png` - Main logo
- [ ] `assets/logo-white.png` - White logo for dark backgrounds
- [ ] `assets/colors.json` - Color palette (optional)
- [ ] Reference videos/images for style (optional)

---

## Usage by AI Agents

When this file exists, agents should:

1. **Read brand.md** before generating any content
2. **Apply colors** to any UI/graphics in prompts
3. **Use tone of voice** for any text/scripts
4. **Follow restrictions** (never_say, policies)
5. **Include brand elements** (logo placement, CTA phrases)
6. **Match aesthetic** to references provided
