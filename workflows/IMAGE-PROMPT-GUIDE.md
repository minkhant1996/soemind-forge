# Image Prompt Guide

> **MANDATORY:** Read this guide before writing any image prompt.
> Agents MUST apply these principles to every image generation request.

---

## How to Use This Guide

1. **Identify the image type** (product, lifestyle, portrait, thumbnail, etc.)
2. **Determine the composition** (subject placement, framing, negative space)
3. **Choose lighting style** (natural, studio, dramatic, etc.)
4. **Select visual style** (see STYLE-GUIDE.md for full options)
5. **Build the prompt** using the structure below

---

## Core Principle

> **"Describe the scene, don't just list keywords."**

Narrative descriptions outperform disconnected word lists. Think like a photographer describing the shot you want.

❌ **Bad:** `woman, office, portrait, professional, 85mm, bokeh`

✅ **Good:** `A professional headshot of a confident woman in her 30s, wearing a navy blazer, direct eye contact with a subtle smile. Modern office background with floor-to-ceiling windows. Shot with 85mm portrait lens, soft natural window light from the left, shallow depth of field creating creamy bokeh. Clean, corporate aesthetic.`

---

## The Prompt Structure

```
[COMPOSITION/FRAMING] + [SUBJECT] + [ENVIRONMENT/SETTING] + [LIGHTING] + [STYLE/MOOD]
```

### Example Breakdown

**Full prompt:**
```
Medium close-up shot, 35mm lens perspective. Confident woman in her 30s,
dark hair pulled back, wearing navy blazer, direct eye contact. Modern
minimalist office with floor-to-ceiling windows. Soft natural window light
from the left, subtle rim light. Professional lifestyle photography,
shallow depth of field, warm confident energy.
```

| Component | Example |
|-----------|---------|
| Composition | Medium close-up shot, 35mm lens perspective |
| Subject | Confident woman in her 30s, dark hair pulled back, wearing navy blazer, direct eye contact |
| Environment | Modern minimalist office with floor-to-ceiling windows |
| Lighting | Soft natural window light from the left, subtle rim light |
| Style/Mood | Professional lifestyle photography, shallow depth of field, warm confident energy |

---

## Composition & Framing

### Shot Types (Distance from Subject)

| Shot Type | Prompt Keywords | Framing | Best For |
|-----------|-----------------|---------|----------|
| **Extreme Wide (EWS)** | "extreme wide shot, panoramic view, establishing shot" | Subject tiny in vast environment | Scale, landscapes, context |
| **Wide/Long Shot (LS)** | "wide shot, long shot, full environment" | Full body + significant environment | Architecture, fashion, context |
| **Full Shot (FS)** | "full body shot, head to toe, full figure" | Head to toe, complete outfit | Character intro, fashion, action |
| **Medium Long (MLS)** | "medium long shot, knees up, 3/4 body" | Knees up | Walking, movement, casual |
| **Cowboy Shot** | "cowboy shot, mid-thigh up" | Mid-thigh up | Action, hands visible, western |
| **Medium Shot (MS)** | "medium shot, waist up, half body" | Waist up | Dialogue, interviews, lifestyle |
| **Medium Close-up (MCU)** | "medium close-up, chest up, bust shot" | Chest up | Portraits, testimonials, headshots |
| **Close-up (CU)** | "close-up, face shot, portrait" | Face fills frame | Emotion, beauty, expressions |
| **Extreme Close-up (ECU)** | "extreme close-up, macro, tight crop" | Single feature (eyes, lips) | Detail, drama, impact |
| **Insert/Detail** | "insert shot, detail shot, product close-up" | Isolated object/detail | Product, texture, UI element |

### Quick Reference: Body Framing

| Common Term | Frame Boundary | Prompt Keyword |
|-------------|----------------|----------------|
| **Headshot** | Head + shoulders only | "professional headshot, shoulders up" |
| **Bust Shot** | Chest up | "bust shot, chest up portrait" |
| **Half Body** | Waist up | "half body, waist up, upper body" |
| **3/4 Body** | Knees up | "3/4 body shot, three-quarter length" |
| **Full Body** | Head to toe | "full body, head to toe, complete figure" |

### Camera Angles (Height/Perspective)

| Angle | Prompt Keywords | Effect | Use For |
|-------|-----------------|--------|---------|
| **Eye Level** | "eye level shot, neutral angle, straight on" | Neutral, relatable, natural | Most images, dialogue, portraits |
| **Low Angle** | "low angle shot, from below, upward angle, heroic" | Subject appears powerful, dominant | Hero shots, authority, power |
| **High Angle** | "high angle shot, from above, looking down" | Subject appears smaller, vulnerable | Vulnerability, overview, scale |
| **Ground Level** | "ground level shot, 6-inch height, worm's eye" | Dramatic, imposing, extreme | Architecture, action, drama |
| **Dutch/Tilted** | "Dutch angle, tilted frame, canted angle" | Tension, unease, instability | Thriller, edgy, psychological |
| **Bird's Eye** | "bird's eye view, overhead shot, top-down, 90-degree down" | Patterns, layouts, organized | Flat lays, maps, food |
| **Aerial** | "aerial view, drone shot, high altitude" | Grand scale, expansive | Landscapes, real estate |
| **Over-the-Shoulder** | "over the shoulder shot, OTS" | Intimate dialogue, spatial relationship | Conversations, interactions |

### Camera Angle Effects on Subject

| Goal | Use This Angle | Why |
|------|----------------|-----|
| Make subject look **powerful** | Low angle (from below) | Looking up = authority |
| Make subject look **vulnerable** | High angle (from above) | Looking down = diminished |
| Create **tension/unease** | Dutch angle (tilted) | Off-balance = psychological |
| Show **natural perspective** | Eye level | Human POV = relatable |
| Emphasize **height/scale** | Ground level / Worm's eye | Extreme low = towering |
| Reveal **patterns/layout** | Bird's eye / Overhead | Top-down = organized |

### Lens Perspective

| Focal Length | Prompt Keywords | Characteristics | Best For |
|--------------|-----------------|-----------------|----------|
| **16mm** | "16mm lens, ultra-wide, wide-angle" | Extreme wide, distortion, expansive | Architecture, real estate, dramatic |
| **24mm** | "24mm lens, wide-angle" | Wide natural, environmental | Landscapes, street, context |
| **35mm** | "35mm lens, natural perspective" | Slight wide, documentary feel | Lifestyle, environmental portraits |
| **50mm** | "50mm lens, standard lens, nifty fifty" | Human eye perspective | General purpose, street, natural |
| **85mm** | "85mm portrait lens, telephoto portrait" | Background compression, flattering | Portraits, beauty, headshots |
| **135mm** | "135mm lens, telephoto" | Strong compression, isolation | Fashion, product isolation |
| **200mm+** | "200mm telephoto, long lens" | Extreme compression, distant | Sports, wildlife, compressed |

### Lens Effects Keywords

| Effect | Prompt Keywords |
|--------|-----------------|
| **Shallow DOF** | "shallow depth of field, f/1.4, bokeh background, blurred background" |
| **Deep Focus** | "deep focus, f/11, everything sharp, large depth of field" |
| **Bokeh** | "beautiful bokeh, creamy background blur, soft bokeh balls" |
| **Vignette** | "natural vignette, darkened corners, vintage lens" |
| **Lens Flare** | "lens flare, sun flare, anamorphic flare" |
| **Distortion** | "wide-angle distortion, barrel distortion, fisheye" |

### Framing Keywords

| Keyword | Meaning |
|---------|---------|
| `rule of thirds` | Subject offset, balanced composition |
| `centered composition` | Subject in exact center, symmetrical |
| `negative space` | Empty space for text/breathing room |
| `tight crop` | Subject fills frame, intimate |
| `loose framing` | Subject has space around them |
| `symmetrical` | Mirrored balance |
| `asymmetrical` | Dynamic off-center balance |
| `leading lines` | Lines draw eye to subject |
| `frame within frame` | Subject framed by environment |

---

## Subject Description

### For People (Characters)

**Structure:** `[Gender/Age] + [Physical traits] + [Clothing] + [Expression] + [Pose/Action]`

**Good example:**
```
Confident woman in her early 30s, dark brown hair in a low ponytail,
wearing a navy blazer over white blouse, slight smile with direct
eye contact, arms crossed casually
```

**Bad example:**
```
Pretty lady in nice clothes
```

### Physical Traits to Specify

| Category | Examples |
|----------|----------|
| Age range | early 20s, mid-30s, senior |
| Hair | dark brown, shoulder-length curly, pulled back, silver-streaked |
| Build | athletic, slender, average, muscular |
| Skin tone | fair, olive, warm brown, dark |
| Distinguishing | freckles, beard, glasses, tattoos |

### Expressions

| Expression | Keywords |
|------------|----------|
| Confident | direct eye contact, slight smile, knowing look |
| Friendly | warm smile, approachable, relaxed |
| Professional | composed, neutral, focused |
| Thoughtful | contemplative, looking away, pensive |
| Energetic | laughing, dynamic, mid-action |
| Serious | intense gaze, determined, focused |

### For Products

**Structure:** `[Product] + [Angle] + [Surface/Context] + [Key Features Visible]`

**Good example:**
```
Premium smartwatch, 45-degree angle on brushed marble surface,
sapphire display showing time, titanium case visible, crown detail
prominent
```

**Bad example:**
```
Watch on table
```

### Product Photography Keywords

| Keyword | Effect |
|---------|--------|
| `hero shot` | Product as the star, dramatic |
| `floating` | Product suspended, clean background |
| `in-context` | Product in use environment |
| `flat lay` | Top-down arranged composition |
| `product cluster` | Multiple products grouped |
| `scale reference` | Object showing size |

---

## Environment & Setting

### Indoor Environments

| Setting | Keywords |
|---------|----------|
| Modern office | floor-to-ceiling windows, minimalist desk, city skyline |
| Home | cozy living room, warm textures, natural light |
| Studio | clean backdrop, professional lighting, neutral |
| Retail | product shelves, brand environment, commercial |
| Industrial | raw concrete, exposed brick, warehouse |
| Cafe | warm tones, coffee cups, lifestyle |

### Outdoor Environments

| Setting | Keywords |
|---------|----------|
| Urban | city streets, architecture, modern buildings |
| Nature | forest, mountains, natural landscape |
| Beach | ocean, sand, coastal |
| Garden | flowers, greenery, botanical |
| Rooftop | city views, open sky, urban terrace |

### Background Control

| Keyword | Effect |
|---------|--------|
| `clean background` | Minimal distraction |
| `gradient background` | Smooth color transition |
| `bokeh background` | Soft blurred lights |
| `environmental` | Rich context visible |
| `isolated` | Subject cut out from context |
| `studio backdrop` | Professional photography setup |

---

## Lighting

### Natural Light

| Type | Prompt Keywords | Effect |
|------|-----------------|--------|
| **Golden Hour** | "golden hour, warm sunset light, golden glow, magic hour, long shadows" | Warm, magical, flattering |
| **Blue Hour** | "blue hour, twilight, cool blue tones, dusk lighting, pre-dawn" | Cool, atmospheric, cinematic |
| **Overcast** | "overcast sky, soft diffused light, cloudy day, even illumination" | Soft, shadowless, neutral |
| **Direct Sun** | "harsh sunlight, direct sun, hard shadows, high contrast, midday sun" | Dramatic, intense, summer |
| **Window Light** | "natural window light, side light from window, soft shadows, indoor natural" | Natural, editorial, portrait |
| **Backlit** | "backlit, light behind subject, rim light, halo effect, silhouette edge" | Dramatic, glowing, dreamy |
| **Dappled Light** | "dappled light, light through leaves, forest light, spotted shadows" | Natural, organic, artistic |

### Studio Lighting Setups

| Setup | Prompt Keywords | Effect |
|-------|-----------------|--------|
| **Three-Point** | "three-point lighting, key fill rim, studio lighting setup" | Professional, balanced, commercial |
| **Softbox** | "softbox lighting, soft even light, diffused studio light" | Clean, commercial, product |
| **Rembrandt** | "Rembrandt lighting, triangle shadow on cheek, classic portrait" | Portrait, dramatic, artistic |
| **Butterfly/Paramount** | "butterfly lighting, shadow under nose, glamour lighting" | Beauty, fashion, elegant |
| **Split Lighting** | "split lighting, half face lit, half in shadow, dramatic" | Mysterious, noir, dramatic |
| **Rim/Edge Light** | "rim light, edge light, backlight outline, hair light" | Separation, depth, cinematic |
| **Loop Lighting** | "loop lighting, small nose shadow, portrait lighting" | Flattering, natural portrait |
| **Broad Lighting** | "broad lighting, lit side facing camera" | Makes face appear wider |
| **Short Lighting** | "short lighting, shadow side facing camera" | Slimming, dramatic |

### Lighting Quality & Mood

| Quality | Prompt Keywords | Visual Result |
|---------|-----------------|---------------|
| **High Key** | "high key lighting, bright, minimal shadows, clean white" | Happy, commercial, airy |
| **Low Key** | "low key lighting, dark, dramatic highlights, moody shadows" | Mysterious, luxury, noir |
| **Soft Light** | "soft lighting, diffused, gentle shadows, wrap-around light" | Flattering, beauty, calm |
| **Hard Light** | "hard lighting, sharp shadows, defined edges, dramatic" | Edgy, intense, graphic |
| **Volumetric** | "volumetric light, god rays, light beams, atmospheric haze" | Cinematic, epic, dramatic |
| **Chiaroscuro** | "chiaroscuro, strong light-dark contrast, Renaissance lighting" | Artistic, dramatic, classical |
| **Noir** | "film noir lighting, high contrast black and white, venetian blinds shadow" | Mysterious, thriller, vintage |

### Colored & Practical Lighting

| Type | Prompt Keywords | Effect |
|------|-----------------|--------|
| **Neon** | "neon lighting, neon glow, pink and cyan, cyberpunk lighting" | Futuristic, urban, edgy |
| **Practical Lights** | "practical lighting, visible light sources, lamps in frame" | Realistic, cinematic, cozy |
| **RGB** | "RGB lighting, colored gel lights, multicolor illumination" | Gaming, tech, creative |
| **Candlelight** | "candlelight, warm flickering glow, intimate lighting" | Romantic, cozy, vintage |
| **Firelight** | "firelight, campfire glow, warm orange light, dancing shadows" | Outdoor, cozy, atmospheric |
| **Screen Glow** | "screen glow, computer light on face, blue screen light" | Tech, modern, late night |

### Atmospheric & Special Lighting

| Type | Prompt Keywords | Effect |
|------|-----------------|--------|
| **Moonlight** | "moonlight, cool silver light, night scene, lunar glow" | Mystical, tranquil, night |
| **Spotlight** | "spotlight, theatrical lighting, focused beam, stage light" | Dramatic, performance, focus |
| **Underwater** | "underwater lighting, diffused aquatic, caustic light patterns" | Dreamy, flowing, ethereal |
| **Fairy Lights** | "fairy lights, twinkling lights, string lights, magical ambiance" | Festive, romantic, magical |
| **Strobe** | "strobe lighting, flash burst, club lighting, high energy" | Party, dynamic, energetic |
| **Laser** | "laser light, colored beams, concert lighting, rave" | Event, energetic, futuristic |
| **Bioluminescence** | "bioluminescent glow, organic light, Avatar-style, glowing nature" | Fantasy, sci-fi, magical |
| **Lightning** | "lightning flash, storm light, dramatic burst, electric" | Dramatic, powerful, intense |

### Color Temperature Guide

| Temperature | Prompt Keywords | Mood |
|-------------|-----------------|------|
| **Warm (2700-3200K)** | "warm tungsten, orange glow, cozy warm light, candlelight warmth" | Intimate, cozy, inviting |
| **Neutral (4000-5000K)** | "neutral daylight, balanced white, natural color" | Clean, accurate, professional |
| **Cool (5500-6500K)** | "cool daylight, bright white, crisp light" | Fresh, clean, modern |
| **Cold (7000-10000K)** | "cold blue light, icy glow, overcast blue, moonlight cold" | Dramatic, tense, isolated |
| **Mixed Warm/Cool** | "warm and cool contrast, orange and teal, split color temperature" | Cinematic, dynamic, stylized |

---

## Visual Effects & Post-Processing

### Lens Effects

| Effect | Prompt Keywords | Visual Result |
|--------|-----------------|---------------|
| **Lens Flare** | "lens flare, sun flare, light streak, JJ Abrams style" | Cinematic, dramatic, sun-kissed |
| **Anamorphic Flare** | "anamorphic lens flare, horizontal blue streak, oval bokeh" | Cinematic, widescreen, Hollywood |
| **Bokeh** | "beautiful bokeh, creamy bokeh balls, soft background blur, f/1.4" | Romantic, dreamy, subject focus |
| **Chromatic Aberration** | "chromatic aberration, color fringing, RGB split edge" | Vintage, analog, artistic |
| **Vignette** | "natural vignette, darkened corners, spotlight effect" | Focus, vintage, dramatic |
| **Halation** | "halation, glow around highlights, film halation, dreamy glow" | Vintage film, soft, ethereal |

### Film & Texture Effects

| Effect | Prompt Keywords | Visual Result |
|--------|-----------------|---------------|
| **Film Grain** | "35mm film grain, subtle grain texture, analog film, Kodak grain" | Vintage, cinematic, organic |
| **VHS/Retro** | "VHS effect, scan lines, retro video, 80s video quality" | Nostalgic, lo-fi, vintage |
| **Noise/Grit** | "digital noise, grainy texture, gritty urban" | Raw, authentic, documentary |
| **Soft Focus** | "soft focus, dreamy blur, Vaseline lens, romantic soft" | Dreamy, beauty, ethereal |
| **Tilt-Shift** | "tilt-shift effect, miniature look, selective focus" | Toy-like, creative, unique |
| **Double Exposure** | "double exposure, overlay, ghostly blend, multiple exposure" | Artistic, surreal, creative |

### Atmospheric Effects

| Effect | Prompt Keywords | Visual Result |
|--------|-----------------|---------------|
| **Fog/Mist** | "fog, mist, atmospheric haze, morning fog, misty" | Mysterious, ethereal, moody |
| **Smoke** | "smoke effect, haze, smoky atmosphere, wisps of smoke" | Dramatic, edgy, atmospheric |
| **Dust Particles** | "dust particles in light, floating dust, dust motes, backlit dust" | Cinematic, warm, nostalgic |
| **Rain** | "rain drops, wet surface, rainy atmosphere, rain on window" | Moody, emotional, dramatic |
| **Snow** | "falling snow, snowflakes, winter atmosphere, snowy" | Cold, magical, peaceful |
| **Sparks/Particles** | "sparks, glowing particles, floating embers, magical particles" | Dynamic, magical, energetic |
| **Volumetric Fog** | "volumetric fog, god rays through fog, light beams in haze" | Cinematic, epic, dramatic |

### Color Grading Styles

| Style | Prompt Keywords | Visual Result |
|-------|-----------------|---------------|
| **Teal & Orange** | "teal and orange color grading, blockbuster look, Hollywood color" | Cinematic, modern, commercial |
| **Desaturated** | "desaturated colors, muted tones, low saturation, subtle color" | Moody, dramatic, artistic |
| **High Saturation** | "vibrant colors, saturated, punchy colors, vivid" | Bold, energetic, eye-catching |
| **Monochrome** | "black and white, monochrome, grayscale, noir" | Classic, dramatic, timeless |
| **Sepia** | "sepia tone, warm vintage, brown tint, antique" | Vintage, nostalgic, classic |
| **Cross-Processed** | "cross-processed, color shift, experimental color, lomography" | Retro, artistic, unique |
| **Cinematic LUT** | "cinematic color grading, film look, movie color palette" | Professional, polished, filmic |
| **Kodak/Fuji Film** | "Kodak Portra colors, Fujifilm aesthetic, film stock look" | Warm, natural, analog |

### Glow & Light Effects

| Effect | Prompt Keywords | Visual Result |
|--------|-----------------|---------------|
| **Bloom** | "light bloom, glowing highlights, soft bloom effect" | Dreamy, ethereal, magical |
| **Neon Glow** | "neon glow, glowing neon, electric glow, cyberpunk glow" | Futuristic, urban, vibrant |
| **Holographic** | "holographic effect, iridescent, rainbow shimmer, prismatic" | Futuristic, trendy, magical |
| **Light Trails** | "light trails, light painting, long exposure lights, streaking lights" | Dynamic, energetic, urban |
| **Glitch** | "glitch effect, digital distortion, RGB shift, corrupted" | Edgy, tech, cyberpunk |
| **Reflection** | "reflections, mirror surface, wet reflection, polished surface" | Elegant, depth, premium |

---

## Style & Mood

### Photography Styles

| Style | Keywords | Use For |
|-------|----------|---------|
| **Editorial** | magazine quality, high fashion, artistic | Fashion, luxury, brand |
| **Lifestyle** | authentic, candid, relatable | Social media, ads, brand |
| **Product** | clean, commercial, professional | E-commerce, catalogs |
| **Portrait** | flattering, focused on person | Headshots, personal brand |
| **Documentary** | raw, unposed, real | Storytelling, journalism |
| **Fine Art** | conceptual, artistic, creative | Art, galleries, creative |

### Mood Keywords

| Mood | Supporting Keywords |
|------|---------------------|
| **Professional** | clean, polished, corporate, business |
| **Friendly** | warm, approachable, inviting, casual |
| **Luxurious** | elegant, premium, sophisticated, refined |
| **Energetic** | dynamic, vibrant, active, bold |
| **Calm** | peaceful, serene, tranquil, soft |
| **Mysterious** | moody, shadowy, intriguing, dark |
| **Playful** | fun, colorful, whimsical, light |
| **Nostalgic** | vintage, retro, warm, timeless |

### Technical Quality Keywords

| Keyword | Effect |
|---------|--------|
| `shallow depth of field` | Blurred background, subject sharp |
| `deep depth of field` | Everything in focus |
| `high resolution` | Maximum detail |
| `film grain` | Analog texture, nostalgic |
| `sharp focus` | Crisp detail throughout |
| `motion blur` | Sense of movement |
| `bokeh` | Beautiful out-of-focus areas |

---

## Prompt Templates by Image Type

### Product Hero Shot

```
[PRODUCT] at [ANGLE], [SURFACE/ENVIRONMENT].
[LIGHTING STYLE], [KEY FEATURES VISIBLE].
[STYLE] photography, [MOOD] aesthetic.
```

**Example:**
```
Premium smartwatch at 45-degree angle, floating on dark gradient background.
Soft studio lighting with subtle reflection, sapphire display and titanium
case visible. High-end product photography, premium minimalist aesthetic.
```

### Lifestyle Portrait

```
[SHOT TYPE], [LENS] perspective. [PERSON DESCRIPTION].
[ENVIRONMENT]. [LIGHTING].
[STYLE] photography, [MOOD], shallow depth of field.
```

**Example:**
```
Medium close-up, 85mm perspective. Woman in her 30s, dark hair,
wearing casual white linen shirt, genuine smile, looking slightly
off-camera. Bright modern cafe with natural light streaming through
windows. Soft window light from the right. Lifestyle photography,
warm and approachable, shallow depth of field.
```

### YouTube Thumbnail

```
[PERSON with EXPRESSION], [BOLD VISUAL ELEMENT].
[SIMPLE BACKGROUND], high contrast, eye-catching.
YouTube thumbnail style, bright colors, [EMOTION].
Space for text on [SIDE].
```

**Example:**
```
Man with shocked expression, mouth open, eyes wide, pointing at
laptop screen. Clean blue gradient background, high contrast,
eye-catching. YouTube thumbnail style, bright saturated colors,
excitement. Negative space on right for text.
```

### Flat Lay

```
Top-down shot. [ITEMS] arranged on [SURFACE].
[LIGHTING], organized composition. [STYLE] aesthetic,
[MOOD], instagram-worthy arrangement.
```

**Example:**
```
Top-down shot. Coffee cup, open notebook, smartphone, succulent plant,
and reading glasses arranged on light wood desk. Soft natural window
light from above, organized asymmetrical composition. Minimalist
aesthetic, productive calm mood, instagram-worthy arrangement.
```

### Social Media Post (Instagram Feed)

```
[SHOT TYPE]. [SUBJECT] in [SETTING].
[LIGHTING], [STYLE] photography.
1:1 square crop, instagram-ready, [MOOD] energy.
```

**Example:**
```
Full body shot. Athletic woman mid-yoga pose on rooftop terrace
at sunrise. Golden hour light, silhouette effect with warm glow.
Lifestyle fitness photography. 1:1 square crop, instagram-ready,
peaceful energizing morning vibe.
```

---

## Character Consistency (Critical)

### The Problem

Each image generation creates a NEW random person.

### The Solution

**Generate a character keyframe ONCE, then use it as reference for all images.**

### Character Keyframe Prompt Structure

```
[SHOT TYPE] portrait, [LENS] perspective.
[DETAILED PERSON DESCRIPTION: age, gender, ethnicity, hair, build].
[CLOTHING]. Neutral expression, direct eye contact, facing camera.
Clean simple background, [LIGHTING].
Reference photo style, character sheet.
```

**Example:**
```
Medium close-up portrait, 50mm perspective.
Woman in her early 30s, East Asian descent, dark brown hair in
low ponytail, athletic build, light makeup. Wearing navy blazer
over white blouse. Neutral confident expression, direct eye contact,
facing camera. Clean light gray background, soft studio lighting.
Reference photo style, character consistency sheet.
```

### Using the Character Reference

Once you have the keyframe, reference it for all variations:

**Prompt for variations:**
```
Same person from reference image, [NEW POSE/ACTION].
[NEW ENVIRONMENT]. [NEW LIGHTING].
[STYLE], maintain character consistency.
```

---

## What NOT to Include

### Never Include in Image Prompts

| Don't Include | Why |
|---------------|-----|
| Text overlays | "Text says Buy Now" - Gemini can't reliably render text |
| Logos | Will be distorted or wrong |
| Specific brand names | Copyright issues, unreliable rendering |
| UI elements with text | Text will be garbled |
| QR codes | Will not be scannable |

### Add These in Post-Production

- Text overlays and captions
- Logos and watermarks
- UI screenshots (composite real screenshots)
- CTA buttons
- Brand elements with text

---

## Platform-Specific Guidelines

### Instagram Feed (1:1)

- **Composition:** Centered or rule-of-thirds
- **Style:** Polished, aesthetic, cohesive with feed
- **Lighting:** Even, flattering, not harsh
- **Tips:** Leave space for engagement, avoid too much detail

### Instagram Story (9:16)

- **Composition:** Subject in lower 2/3, top clear for stickers
- **Style:** Casual, authentic, mobile-first
- **Tips:** Vertical subjects, avoid horizontal scenes

### YouTube Thumbnail (16:9)

- **Composition:** Subject on left or right, space for text opposite
- **Style:** HIGH CONTRAST, bold, eye-catching
- **Expression:** Exaggerated emotion (surprise, excitement)
- **Background:** Simple, contrasting color
- **Tips:** Think 1-second glance, must pop in small size

### LinkedIn (1:1 or 16:9)

- **Composition:** Professional, clean
- **Style:** Corporate but approachable
- **Lighting:** Well-lit, professional
- **Tips:** Avoid overly casual or trendy aesthetics

### Pinterest (2:3)

- **Composition:** Vertical, subject in frame
- **Style:** Aspirational, beautiful, save-worthy
- **Tips:** Rich colors, lifestyle focus, inspirational

---

## Quick Reference Checklist

Before generating, verify your prompt includes:

```
□ Composition (shot type, framing, camera angle)
□ Subject description (detailed, specific)
□ Environment/setting (context, background)
□ Lighting (type, direction, quality)
□ Style (photography style, artistic treatment)
□ Mood/energy (emotional tone)
□ Aspect ratio consideration (platform-appropriate)
□ NO text, logos, or specific brand names
```

---

## Prompt Length Guidelines

| Image Type | Word Count | Why |
|------------|------------|-----|
| Simple product | 30-50 | Clean, focused |
| Lifestyle | 50-80 | More context needed |
| Complex scene | 80-120 | Multiple elements |
| Character keyframe | 60-80 | Precise description |

**Too short:** Vague, random results
**Too long:** Conflicting instructions, confusion

---

## Quick Reference Card

Copy-paste these keywords into your prompts:

```
FRAMING:
  headshot | bust shot | half body | 3/4 body | full body
  close-up | medium close-up | medium shot | wide shot | extreme wide

ANGLES:
  eye level | low angle | high angle | Dutch angle
  bird's eye | worm's eye | over the shoulder | POV

LENS:
  16mm ultra-wide | 24mm wide | 35mm natural | 50mm standard
  85mm portrait | 135mm telephoto

LIGHTING:
  Natural:    golden hour | blue hour | overcast | backlit | window light | dappled
  Studio:     Rembrandt | butterfly | split | rim light | loop | three-point | softbox
  Quality:    high key | low key | soft | hard | volumetric | chiaroscuro | noir
  Colored:    neon glow | RGB | firelight | moonlight | candlelight | screen glow
  Atmosphere: spotlight | underwater | fairy lights | strobe | bioluminescent
  Temp:       warm tungsten 3200K | neutral 5600K | cool blue 8000K | teal and orange

EFFECTS:
  Lens:       lens flare | anamorphic flare | bokeh | vignette | halation | chromatic aberration
  Film:       35mm film grain | VHS | noise/grit | soft focus | tilt-shift | double exposure
  Atmosphere: fog | mist | smoke | dust particles | rain | snow | sparks | volumetric fog
  Color:      teal & orange | desaturated | high saturation | monochrome | sepia | cross-processed
  Glow:       bloom | neon glow | holographic | light trails | glitch | reflection

DEPTH:
  shallow depth of field f/1.4 | deep focus f/11 | bokeh background

STYLE:
  cinematic | editorial | lifestyle | product photography | portrait
  minimalist | dramatic | moody | high contrast | soft
```

---

## See Also

- **STYLE-GUIDE.md** — Visual style reference (animation, artistic, modern, etc.)
- **VIDEO-PROMPT-GUIDE.md** — Video-specific prompting (camera movement, keyframes)
- **WORKFLOWS.md** — API usage and workflow functions

---

## Sources

- [Google Developers Blog - How to prompt Gemini 2.5 Flash](https://developers.googleblog.com/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/)
- [MimicPC - Master Guide to Camera Angles](https://www.mimicpc.com/learn/master-guide-to-camera-angles-and-shot-types-for-AI-image-and-video-generation)
- [Aiarty - 15 Midjourney Camera Angles](https://www.aiarty.com/midjourney-prompts/midjourney-camera-angles.htm)
- [Aituts - Midjourney Lighting and Camera Prompts](https://aituts.com/midjourney-camera-prompts/)
