# Video Prompt Guide for Veo 3.1

> **MANDATORY:** Read this guide BEFORE generating any video prompt.
> The agent MUST apply these principles when crafting prompts.

---

## Core Principle

**More detail = greater creative control.** Veo 3.1 was trained on professional film footage
and understands real cinematography terminology. Use specific film language, not vague descriptions.

---

## Prompt Structure Formula

Every effective Veo 3.1 prompt follows this five-part structure:

```
[SHOT TYPE + CAMERA MOVEMENT] + [SUBJECT DETAILS] + [ACTION] + [SETTING/ENVIRONMENT] + [LIGHTING + MOOD/STYLE]
```

**Optimal length:** 100-200 words for best results.

### Example:

```
Medium close-up, 35mm lens, slow dolly push-in. A confident woman in her 30s
with dark hair, wearing a navy blazer, looks directly at camera. She nods
slightly and gestures with her hand while explaining. Modern minimalist office
with floor-to-ceiling windows, soft natural light streaming in from the left.
Clean, professional aesthetic, shallow depth of field, cinematic color grading.
```

---

## 1. Shot Types (Framing)

Use these exact terms for consistent results:

| Shot Type | Description | Use Case |
|-----------|-------------|----------|
| **Extreme wide shot (EWS)** | Subject tiny in vast environment | Establishing scale, landscapes |
| **Wide shot / Full shot** | Full body visible with environment | Context, movement |
| **Medium wide shot (MWS)** | Knees up | Walking, gestures |
| **Medium shot (MS)** | Waist up | Dialogue, interviews |
| **Medium close-up (MCU)** | Chest up | Emotional connection |
| **Close-up (CU)** | Face fills frame | Emotion, reaction |
| **Extreme close-up (ECU)** | Eyes or detail only | Intense emotion, detail |
| **Insert shot** | Object detail | Product focus |
| **Over-the-shoulder (OTS)** | Behind one person, facing another | Dialogue scenes |
| **POV shot** | First-person perspective | Immersive experience |
| **Top-down / Bird's eye** | Directly overhead | Flat-lay, workspace |

---

## 2. Camera Movements

**Critical:** Separate camera movement from subject action. Write "The camera pushes in slowly" as its own clause.

### Primary Movements

| Movement | Description | Prompt Syntax |
|----------|-------------|---------------|
| **Static** | No movement | "Static shot, locked-off camera" |
| **Pan** | Horizontal rotation | "Slow pan left to right" |
| **Tilt** | Vertical rotation | "Tilt up from feet to face" |
| **Dolly** | Camera moves toward/away | "Dolly push-in toward subject" |
| **Truck / Track** | Camera moves sideways | "Tracking shot from the right side" |
| **Crane** | Vertical rise/descend | "Crane up to reveal the cityscape" |
| **Orbit** | Circle around subject | "Slow 90° orbit clockwise" |
| **Steadicam** | Smooth handheld follow | "Steadicam follow behind subject" |
| **Handheld** | Intentional shake | "Handheld medium shot, slight shake" |

### Advanced Movements

| Movement | Description | Prompt Syntax |
|----------|-------------|---------------|
| **Aerial / Drone** | High altitude, sweeping | "Aerial wide shot, drone descending" |
| **Whip pan** | Ultra-fast blur pan | "Whip pan 180° to reveal new scene" |
| **Crash zoom** | Rapid zoom burst | "Crash zoom from wide to close-up in 0.5s" |
| **Dolly zoom (Vertigo)** | Dolly + opposite zoom | "Dolly forward while zooming out, vertigo effect" |
| **Push-in** | Slow approach | "Slow push-in over 4 seconds" |
| **Pull-back** | Slow retreat + reveal | "Pull back to reveal environment" |

### Movement Speed Terms

- **Slow / Gentle** — 1-2 ft/sec, contemplative
- **Natural / Moderate** — Walking pace, conversational
- **Fast / Rapid** — Urgent, energetic
- **Whip / Crash** — Near-instant, jarring

---

## 2b. Camera-Move Preset Library (46 ready-to-use blocks)

Each preset is a **four-part block** — `<move>. Movement: … Speed: … Framing: …
End: …` — that removes the ambiguity AI video models trip on (what moves, how
fast, what stays readable, where it lands). Works on **Veo AND Omni Flash**.

**Two ways to use them:**

1. **`cameraMove` arg** (preferred) — `generateSilentVideo`,
   `generateVideoFromImage`, and `generateOmniVideoClip` accept the preset id;
   the block is prepended to your prompt automatically:
   ```bash
   node workflows/cli.cjs generateSilentVideo '{"prompt":"A smartwatch on a marble pedestal, golden hour light","cameraMove":"orbit-clockwise","duration":6,"aspectRatio":"9:16","outputPath":"…/clip.mp4"}'
   ```
2. **Paste the block manually** at the HEAD of any scene prompt (voiceover
   scenes[], speaking videos, Seedance) — the full text lives in the tables
   below and in `CAMERA_MOVES` (workflows/index.ts).

**One move per clip.** Don't stack two presets — pick the one that serves the
beat. Combine with subject/lighting description AFTER the block.

### Pick by intent (cheat table)

| Content intent | Best moves |
|---|---|
| Product hero / reveal | `slow-zoom-in`, `orbit-clockwise`, `arc-right`, `dolly-in` |
| Premium B-roll, calm | `static`, `slider-right`, `slider-left`, `slow-zoom-out` |
| Energy / hype / hook | `crash-zoom-in`, `whip-pan-right`, `fast-zoom-in`, `chase` |
| UGC / authentic feel | `handheld`, `first-person`, `snorricam` |
| Walking testimonial | `reverse-tracking`, `side-tracking`, `follow` |
| Scale / location reveal | `drone-pull-back`, `crane-up`, `helicopter`, `earth-zoom-out` |
| Arrival / destination | `drone-push-in`, `push-past`, `pass-through` |
| Architecture / vertical | `tilt-up`, `tilt-down`, `pedestal-up`, `pedestal-down` |
| Transition between scenes | `whip-pan-right`/`-left`, `pass-through`, `infinite-zoom` |
| Passage of time | `time-lapse` |
| Cute / miniature worlds | `tilt-shift` (pairs well with Omni art styles) |
| Vehicles | `vehicle-tracking`, `low-tracking`, `chase` |

### Pan / Tilt

- **`static`** — locked-off static shot. Movement: hold one fixed camera position for the full clip. Speed: still and steady. Framing: keep the same angle, height, lens distance and composition. End: finish with the same framing and camera position.
- **`pan-right`** — pan right. Movement: rotate the camera horizontally from left to right from one fixed point. Speed: smooth constant rotation. Framing: keep the horizon level while new space enters from the right side of the frame. End: settle on a clear final composition.
- **`pan-left`** — mirror of `pan-right`, new space enters from the left.
- **`whip-pan-right`** — whip pan right. Movement: rotate rapidly from the starting direction toward a new target on the right. Speed: fast snap with brief motion blur during the rotation. Framing: begin on one readable composition and land on a second readable target. End: settle into a sharp final frame.
- **`whip-pan-left`** — mirror of `whip-pan-right`.
- **`tilt-up`** — tilt up. Movement: rotate the camera upward from one fixed point. Speed: smooth constant tilt. Framing: keep the vertical subject or architecture centered as the frame travels upward. End: land on the upper target.
- **`tilt-down`** — mirror of `tilt-up`, lands on the lower target.

### Zoom / Lens

- **`slow-zoom-in`** — slow zoom in. Movement: slowly increase lens focal length toward a tighter frame. Speed: gradual and even. Framing: keep the main visual target readable as it becomes larger in frame. End: finish on a stable tighter composition.
- **`slow-zoom-out`** — mirror: wider frame, more surrounding space.
- **`fast-zoom-in`** / **`fast-zoom-out`** — same geometry, "quick decisive zoom".
- **`crash-zoom-in`** — crash zoom in. Movement: snap the lens rapidly toward the main visual target. Speed: very fast and punchy. Framing: keep the target readable through the sudden scale change. End: land on a bold tighter composition.
- **`crash-zoom-out`** — mirror of `crash-zoom-in`.

### Dolly / Track

- **`dolly-in`** — dolly in. Movement: move the camera physically forward in a straight line toward the main subject. Speed: smooth controlled push. Framing: keep camera height, lens direction and subject position consistent while distance closes. End: finish in a tighter composition. *(Dolly = physical travel with parallax; zoom = lens only.)*
- **`dolly-out`** — mirror: backward, more environment enters frame.
- **`tracking`** — tracking shot. Movement: move through the scene with the main subject. Speed: match the subject's pace. Framing: keep the subject consistently readable while the environment moves around them. End: maintain a clear moving composition.
- **`follow`** — follow shot from behind at shoulder height; back/shoulder/head as foreground guide, route ahead readable.
- **`reverse-tracking`** — move backward in front of the walking subject; front-facing face and body stable, background moves behind them (walk-and-talk).
- **`side-tracking`** — move parallel beside the subject; side or three-quarter profile at stable distance.
- **`low-tracking`** — ground/below-waist height alongside the path; match footsteps or wheels, ground plane moves through frame.
- **`vehicle-tracking`** — move with the vehicle along its route; vehicle stable while road/environment moves past.
- **`chase`** — fast, reactive, physically close follow along the action route; energetic reframing allowed.

### Physical Moves

- **`truck-right`** / **`truck-left`** — move the camera physically sideways on a straight horizontal path; lens keeps facing the same direction while the scene slides across frame.
- **`pedestal-up`** / **`pedestal-down`** — move the entire camera vertically in a straight line; lens stays level and pointed the same direction.
- **`slider-right`** / **`slider-left`** — slide a SMALL distance; slow controlled motion; foreground/subject/background parallax shift (premium product feel).
- **`push-past`** — move forward past a visible foreground object, edge or opening; foreground passes close to lens, space beyond becomes clearer; arrive inside/beyond the foreground layer.
- **`arc-right`** / **`arc-left`** — shallow curved path around the subject to one side; distance, height and readability constant while the angle changes.
- **`orbit-clockwise`** / **`orbit-counterclockwise`** — circle the subject at consistent radius; subject centered while the background rotates.

### Human Camera

- **`handheld`** — human operator height, natural body movement; subtle sway and micro-adjustments (UGC/doc realism).
- **`snorricam`** — camera fixed relative to the subject's torso/face while they move; subject locked in frame, background moves around them.

### Drone / Crane

- **`crane-up`** / **`crane-down`** — travel smoothly vertically through open space; subject or location stays readable; end with the new scale visible.
- **`drone-push-in`** — fly smoothly forward through open space toward the subject/destination; controlled aerial glide; arrive at a closer aerial composition.
- **`drone-pull-back`** — mirror: fly backward, more landscape appears.
- **`helicopter`** — high altitude, broad gradual flight path; landscape or distant moving subject readable at wide scale.

### Specials

- **`first-person`** — first-person view. Movement: move forward at human eye height from the character's perspective. Speed: natural walking or reaching pace. Framing: use visible hands, arms or body edges as the viewer's physical reference. End: arrive at the next point of action from the same point of view.
- **`tilt-shift`** — high angled view, narrow band of sharp focus with soft blur above/below; miniature-scale look.
- **`infinite-zoom`** — zoom continuously inward toward the exact center target, accelerating; end when the next visual world fills the frame (great loop/transition).
- **`earth-zoom-out`** — pull upward from the starting point through street, city, landscape and planet scale; original location stays centered.
- **`time-lapse`** — locked camera while time moves rapidly forward; same composition and horizon; visible passage of time.
- **`pass-through`** — move forward toward a visible object/surface/barrier and continue into the space beyond; opening centered as the transition point.

> Mirror variants marked "mirror" use identical wording with direction words
> swapped — the exact full text for every id is in `CAMERA_MOVES`
> (workflows/index.ts) and is what `cameraMove` prepends.

---

## 3. Lens Choices

Lenses control depth and perspective, not just distance. Specify for precise control:

| Lens | Effect | Use Case |
|------|--------|----------|
| **16mm** | Wide, exaggerated depth | Expansive environments |
| **24mm** | Wide but natural | Establishing shots, POV |
| **35mm** | Natural perspective | General use, dialogue |
| **50mm** | Classic, flattering | Portraits, interviews |
| **85mm** | Compressed background | Intimate close-ups |
| **135mm** | Strong compression | Telephoto isolation |

**Depth of field:**
- "Shallow depth of field, f/1.4 feel" — Subject sharp, background blurred
- "Deep focus, f/11" — Everything sharp

---

## 4. Lighting Terms

Use professional lighting vocabulary:

### Direction
- **Key light** — Main illumination
- **Fill light** — Softens shadows
- **Backlight / Rim light** — Edge glow, separation
- **Practical lights** — In-scene lamps/screens

### Quality
- **Soft light** — Diffused, gentle shadows
- **Hard light** — Sharp, defined shadows
- **Even lighting** — Flat, shadowless
- **High contrast** — Deep shadows, bright highlights

### Style
- **Natural light** — Window, outdoor, realistic
- **Golden hour** — Warm sunset tones
- **Blue hour** — Cool twilight
- **Rembrandt lighting** — Triangle on cheek
- **Chiaroscuro** — Dramatic light/dark contrast
- **Neon / Practical glow** — Colored light sources
- **Studio lighting** — Clean, controlled

### Atmospheric Lighting

| Type | Prompt Keywords | Effect |
|------|-----------------|--------|
| **Volumetric** | "volumetric light, god rays, light beams through fog, atmospheric" | Epic, cinematic, dramatic |
| **Moonlight** | "moonlight, cool silver glow, night scene, lunar illumination" | Mystical, night, tranquil |
| **Firelight** | "firelight, flickering warm glow, campfire light, dancing shadows" | Cozy, outdoor, intimate |
| **Neon Glow** | "neon lighting, pink and cyan glow, cyberpunk, electric" | Futuristic, urban, edgy |
| **Spotlight** | "spotlight, theatrical beam, focused light, stage lighting" | Dramatic, performance, focus |
| **Screen Glow** | "screen glow, computer light on face, blue device light" | Tech, modern, late night |
| **Bioluminescent** | "bioluminescent glow, organic light, glowing nature, Avatar-style" | Magical, fantasy, ethereal |

### Color Temperature

| Temperature | Keywords | Mood |
|-------------|----------|------|
| **Warm (3200K)** | "warm tungsten, orange glow, candlelight warmth" | Cozy, intimate, inviting |
| **Neutral (5600K)** | "neutral daylight, balanced light, natural color" | Clean, accurate, natural |
| **Cool (8000K)** | "cool blue light, overcast blue, icy glow" | Cold, dramatic, tense |
| **Mixed** | "warm and cool contrast, teal and orange, split temperature" | Cinematic, dynamic, stylized |

---

## 4b. Visual Effects & Atmosphere

### Lens & Camera Effects

| Effect | Prompt Keywords | Visual Result |
|--------|-----------------|---------------|
| **Lens Flare** | "lens flare, sun flare, light streak, cinematic flare" | Dramatic, sun-kissed |
| **Anamorphic Flare** | "anamorphic lens flare, horizontal blue streak, oval bokeh" | Hollywood, widescreen |
| **Bokeh** | "shallow depth of field, beautiful bokeh, creamy background" | Focus, romantic, dreamy |
| **Motion Blur** | "motion blur, speed lines, movement trail" | Dynamic, fast, energetic |
| **Rack Focus** | "rack focus, focus pull, shifting focus" | Reveal, attention shift |
| **Vignette** | "subtle vignette, darkened edges, center focus" | Cinematic, focused |

### Atmospheric Effects

| Effect | Prompt Keywords | Visual Result |
|--------|-----------------|---------------|
| **Fog/Mist** | "fog, mist, atmospheric haze, misty environment" | Mysterious, ethereal |
| **Smoke** | "smoke wisps, hazy smoke, atmospheric smoke" | Dramatic, edgy |
| **Dust Particles** | "dust particles in light, floating dust motes, backlit dust" | Cinematic, warm, nostalgic |
| **Rain** | "rain falling, wet surfaces, rainy atmosphere, droplets" | Moody, emotional |
| **Snow** | "falling snow, snowflakes, winter atmosphere" | Cold, magical, peaceful |
| **Sparks** | "flying sparks, glowing embers, particle effects" | Dynamic, industrial, magical |
| **Volumetric Fog** | "volumetric fog, light rays through haze, god rays in fog" | Epic, cinematic |

### Color Grading & Film Looks

| Style | Prompt Keywords | Visual Result |
|-------|-----------------|---------------|
| **Teal & Orange** | "teal and orange color grading, blockbuster look, Hollywood color" | Modern cinematic |
| **Desaturated** | "desaturated, muted tones, low saturation, subtle color" | Moody, dramatic |
| **High Contrast** | "high contrast, deep blacks, bright highlights" | Bold, dramatic |
| **Film Grain** | "35mm film grain, subtle grain texture, Kodak film look" | Vintage, organic |
| **Vintage/Retro** | "vintage color, retro look, 70s film stock, faded colors" | Nostalgic, warm |
| **Cold/Blue** | "cold color grade, blue tint, icy atmosphere" | Tense, thriller |
| **Warm/Golden** | "warm color grade, golden tones, sunset palette" | Inviting, hopeful |
| **Noir** | "film noir, high contrast black and white, shadows" | Classic, mysterious |

### Glow & Light Effects

| Effect | Prompt Keywords | Visual Result |
|--------|-----------------|---------------|
| **Bloom** | "light bloom, glowing highlights, soft bloom effect" | Dreamy, ethereal |
| **Neon Glow** | "neon glow, electric glow, glowing outlines" | Futuristic, vibrant |
| **Holographic** | "holographic shimmer, iridescent glow, rainbow effect" | Futuristic, tech |
| **Light Trails** | "light trails, streaking lights, long exposure effect" | Dynamic, urban |
| **Glitch** | "glitch effect, digital distortion, RGB split" | Edgy, tech, cyberpunk |
| **Reflection** | "reflections on wet surface, mirror effect, polished reflection" | Elegant, depth |

---

## 4c. Scene Transitions & Clip Chaining

### Types of Transitions

| Transition | Prompt Keywords | When to Use |
|------------|-----------------|-------------|
| **Hard Cut** | "cuts to, switches to, jumps to" | Fast pacing, action, dialogue |
| **Dissolve/Cross-Dissolve** | "dissolves into, blends into, cross-fades to" | Time passage, dreams, memories |
| **Fade to Black** | "fades to black, scene darkens, blackout" | End of scene, dramatic pause |
| **Fade from Black** | "fades in from black, emerges from darkness" | Scene beginning, reveal |
| **Fade to White** | "fades to white, bright flash, whiteout" | Flashback, spiritual, dream |
| **Wipe** | "wipes across to reveal, horizontal wipe, iris wipe" | Location change, retro style |
| **Match Cut** | "cuts to matching shape/movement/color" | Thematic connection, elegance |
| **Whip Pan** | "camera whips rapidly, blur transition" | Energy, urgency, scene change |
| **Zoom Transition** | "rapid zoom into detail, crash zoom out" | Impact, reveal, energy |
| **Morph/Transform** | "transforms into, morphs into, shape-shifts" | Magical, conceptual, surreal |

### In-Prompt Transition Descriptions

**For clips with built-in transitions:**

```
Opening:
- "Scene fades in from black..."
- "Camera emerges from darkness to reveal..."
- "Starting with a blur that sharpens into focus..."

Closing:
- "...gradually fades to black"
- "...camera pulls back and blurs out"
- "...scene dissolves as light intensifies"

Mid-clip transitions:
- "The camera whips right, motion-blurring into the next scene"
- "A bright flash of light transitions to..."
- "Focus racks from foreground to background, revealing..."
```

### Match Cut Techniques

| Match Type | Description | Prompt Example |
|------------|-------------|----------------|
| **Graphic Match** | Same shape/composition | "Close-up of eye cuts to full moon in same position" |
| **Action Match** | Continuous movement | "Hand reaching for door handle, cuts to hand opening different door" |
| **Sound Match** | Audio continuity | "Alarm clock ringing cuts to phone ringing" |
| **Color Match** | Same dominant color | "Red sunset dissolves into red sports car" |
| **Movement Match** | Same motion direction | "Runner moving left, cuts to car driving left" |

---

## 4d. Chaining Multiple Clips (Multi-Shot Sequences)

### The Challenge

Each AI video clip is generated independently. To create a coherent sequence:
1. Maintain **visual consistency** (same character, environment, style)
2. Create **logical flow** (actions connect, story progresses)
3. Use **transitional elements** (ending of Clip A sets up Clip B)

### Chaining Strategy: Sequential Prompt Design

**Structure each clip prompt to connect:**

```
CLIP 1 (Hook):
  Ending: "...she turns toward the door, hand reaching for handle"

CLIP 2 (Continues):
  Opening: "Her hand grasps the door handle, pushes it open..."
  Ending: "...steps through into bright light"

CLIP 3 (Resolution):
  Opening: "Emerging into sunlit room, her expression shifts to wonder..."
```

### Keyframe Chaining (First/Last Frame Method)

**Most reliable for visual consistency:**

```typescript
// Generate Clip 1
const clip1 = await generateVideoFromKeyframe({
  firstFramePath: 'keyframe-01-start.png',
  prompt: 'She walks toward camera, expression curious, reaches toward door',
  outputPath: 'clip-01.mp4',
  duration: 4
});

// Extract last frame OR generate matching keyframe for Clip 2
const clip2Keyframe = await generateKeyframe({
  prompt: 'Same woman, hand on door handle, about to push open, same outfit and lighting',
  outputPath: 'keyframe-02-start.png'
});

// Generate Clip 2 continuing from Clip 1
const clip2 = await generateVideoFromKeyframe({
  firstFramePath: 'keyframe-02-start.png',
  prompt: 'Door swings open, light floods in, she steps forward into brightness',
  outputPath: 'clip-02.mp4',
  duration: 4
});
```

### Transformation Clips (First + Last Frame)

**For before/after or morph effects:**

```typescript
// Define start and end states
const transformation = await generateVideoFromKeyframes({
  firstFramePath: 'before-state.png',    // Messy desk, stressed person
  lastFramePath: 'after-state.png',       // Clean desk, relaxed person
  prompt: 'Time-lapse transformation, papers organize themselves, lighting brightens, expression shifts from stressed to relieved',
  outputPath: 'transformation.mp4',
  duration: 6
});
```

### Scene Flow Patterns

| Pattern | Structure | Use For |
|---------|-----------|---------|
| **Linear** | A → B → C → D | Story progression, tutorials |
| **Parallel** | A1/B1 → A2/B2 → A3/B3 | Comparisons, simultaneous events |
| **Circular** | A → B → C → A' | Callbacks, story loops |
| **Montage** | A, B, C, D (loose) | Time passage, emotion build |
| **Problem-Solution** | Problem → Agitate → Solution | Ads, explainers |

### Continuity Checklist

When chaining clips, maintain consistency in:

```
□ Character appearance (same outfit, hair, features)
□ Environment (same location, lighting, time of day)
□ Camera style (same lens, movement style, color grade)
□ Action continuity (movement direction, pose, gesture)
□ Emotional progression (mood builds logically)
□ Props and objects (same items, positions)
```

### Prompt Connectors for Smooth Flow

**Opening connectors (start of next clip):**
```
- "Continuing from the previous moment..."
- "The same [character] now..."
- "Moments later, [action continues]..."
- "As [previous action completes], [new action begins]..."
```

**Closing connectors (end of current clip):**
```
- "...reaches toward [next scene element]"
- "...turns to face [direction of next scene]"
- "...as the scene begins to [fade/blur/transition]"
- "...movement slowing as if time pauses"
```

### Multi-Clip Workflow Example

```typescript
// Define the sequence
const sequence = [
  {
    name: 'hook',
    keyframe: 'Woman looking frustrated at laptop, messy desk',
    motion: 'She sighs, pushes laptop away, rubs temples in frustration',
    ending: 'Hand reaches for phone on desk'
  },
  {
    name: 'discovery',
    keyframe: 'Same woman, phone in hand, screen glowing on face',
    motion: 'Eyes widen with interest, slight smile forming, sits up straighter',
    ending: 'Begins typing eagerly'
  },
  {
    name: 'transformation',
    keyframe: 'Same woman, now energized, laptop open',
    motion: 'Types confidently, desk magically organizes, lighting brightens',
    ending: 'Leans back satisfied, crosses arms with confident smile'
  },
  {
    name: 'result',
    keyframe: 'Same woman, relaxed confident pose, clean desk',
    motion: 'Subtle nod, genuine smile, picks up coffee cup',
    ending: 'Raises cup slightly as if toasting success'
  }
];

// Generate each clip with character consistency
for (const scene of sequence) {
  const keyframe = await generateKeyframe({
    prompt: scene.keyframe + ', same character throughout, consistent lighting',
    referenceImagePath: 'character-reference.png',  // Lock character appearance
    outputPath: `keyframes/${scene.name}.png`
  });

  await generateVideoFromKeyframe({
    firstFramePath: keyframe.data.imagePath,
    prompt: scene.motion + '. ' + scene.ending,
    outputPath: `clips/${scene.name}.mp4`,
    duration: 4
  });
}

// Assemble with transitions in post
await assembleFinal({
  clipPaths: sequence.map(s => `clips/${s.name}.mp4`),
  outputPath: 'final-sequence.mp4'
});
```

---

## 4e. Character Speaking & Dialogue

### Dialogue Prompt Structure

**Formula:** `[CHARACTER] + [EMOTION/STATE] + [ACTION] + says in [TONE]: [DIALOGUE]`

```
A confident woman in her 30s, wearing a navy blazer, leans forward with
intensity and says in a determined voice: I've been waiting for this moment
my entire career.
```

**Important Rules:**
- ❌ Don't use quotation marks (triggers subtitles instead of speech)
- ❌ Don't write long monologues (max 8 seconds / ~20 words)
- ✅ Combine emotion + action + speech together
- ✅ Keep dialogue short and punchy

---

### Single Character Speaking

#### Voice Tone Descriptors

| Tone Category | Keywords |
|---------------|----------|
| **Professional** | confident, authoritative, measured, clear, composed, professional |
| **Friendly** | warm, approachable, cheerful, enthusiastic, genuine, inviting |
| **Emotional** | passionate, heartfelt, vulnerable, sincere, moved, touched |
| **Urgent** | intense, pressing, hurried, breathless, anxious, desperate |
| **Calm** | soothing, gentle, relaxed, peaceful, meditative, soft |
| **Playful** | teasing, witty, mischievous, lighthearted, humorous, cheeky |
| **Serious** | grave, solemn, stern, no-nonsense, direct, blunt |
| **Mysterious** | hushed, secretive, cryptic, whispered, enigmatic |

#### Voice Quality Descriptors

| Quality | Keywords |
|---------|----------|
| **Pitch** | deep, low, baritone, high, bright, rich, resonant |
| **Texture** | smooth, raspy, gravelly, silky, breathy, husky, clear |
| **Speed** | slow, deliberate, rapid, measured, natural, rushed |
| **Volume** | soft, quiet, loud, booming, whispered, projected |
| **Accent** | American, British, Australian, Southern, New York, generic |

#### Emotion + Action + Speech (Best Practice)

**Combine all three for natural performance:**

```
She looks directly into camera, her expression softening as she speaks
in a warm, genuine tone: This changed everything for me. A slight smile
forms as she finishes, nodding subtly.
```

**Breakdown:**
- Emotion: "expression softening", "warm, genuine"
- Action: "looks directly into camera", "slight smile", "nodding subtly"
- Speech: "This changed everything for me"

#### Expression & Micro-Action Keywords

| Expression | Keywords |
|------------|----------|
| **Happy** | smiling, beaming, eyes brightening, laughing, grinning |
| **Sad** | eyes welling, voice breaking, looking down, sighing |
| **Surprised** | eyes widening, eyebrows raising, mouth opening slightly |
| **Angry** | jaw tightening, eyes narrowing, leaning forward, voice rising |
| **Thoughtful** | pausing, looking away, tilting head, furrowing brow |
| **Confident** | direct eye contact, chin up, shoulders back, slight smirk |
| **Nervous** | fidgeting, looking away, swallowing, voice trembling |
| **Determined** | intense gaze, leaning in, voice steady, decisive nod |

#### Body Language Cues

| State | Body Language Keywords |
|-------|----------------------|
| **Open/Welcoming** | arms open, leaning forward, palms visible, relaxed shoulders |
| **Closed/Defensive** | arms crossed, leaning back, turning away, shoulders hunched |
| **Confident** | standing tall, steady posture, controlled gestures, taking up space |
| **Nervous** | fidgeting, touching face, shifting weight, small gestures |
| **Engaged** | nodding, mirroring, leaning in, active eye contact |
| **Dismissive** | eye roll, looking away, wave of hand, turning body away |

---

### Multi-Character Dialogue

#### Structure for Two+ Characters

**Four-Step Approach:**

1. **Setup** — Location, time, participants
2. **Character Intent** — Each character's goal/mood
3. **Action Beats** — Physical movements, reactions
4. **Ambient Context** — Environment, background

#### Multi-Character Example

```
Inside a modern startup office, two co-founders face each other across
a desk. The woman, confident and direct, leans forward and says firmly:
We need to pivot now, before it's too late. The man, hesitant, rubs his
chin and responds with uncertainty: But our investors expect us to stay
the course. She shakes her head slowly, expression determined.
```

#### Character Labeling

**For clarity in multi-character scenes:**

```
SARAH (the CEO, commanding presence) stands at the window and says
with authority: The decision is final. MARK (junior developer, nervous)
shifts in his seat and replies quietly: I understand.
```

#### Reaction Shots

**Include non-speaking character reactions:**

```
As she delivers the news, he visibly deflates, shoulders dropping,
looking away. She pauses, noticing his reaction, her expression
softening slightly before continuing.
```

#### Conversation Flow Patterns

| Pattern | Description | Use For |
|---------|-------------|---------|
| **Back-and-forth** | Quick exchanges, cuts between speakers | Arguments, debates |
| **Monologue + reaction** | One speaks, other reacts silently | Announcements, revelations |
| **Overlapping** | Characters interrupt, talk over | Heated discussions |
| **Building tension** | Pauses grow longer, intensity rises | Confrontations |
| **Resolution** | Pace slows, agreement reached | Conclusions |

---

### Acting Direction Keywords

#### Performance Intensity

| Level | Keywords |
|-------|----------|
| **Subtle** | understated, restrained, minimal, naturalistic, quiet |
| **Natural** | authentic, believable, conversational, grounded, real |
| **Heightened** | dramatic, expressive, theatrical, bold, pronounced |
| **Intense** | powerful, explosive, overwhelming, raw, visceral |

#### Timing & Pacing

| Timing | Keywords |
|--------|----------|
| **Pause Before** | hesitates, takes a breath, considers, thinks, waits |
| **Pause After** | lets it sink in, holds the moment, silence hangs |
| **Quick Delivery** | rapid-fire, without pause, immediately responds |
| **Deliberate** | measured, each word weighted, careful delivery |

#### Subtext Indicators

**Show what's beneath the words:**

```
She says cheerfully: Everything is fine — but her eyes tell a
different story, a flicker of worry crossing her face.

He agrees with a nod: Of course, whatever you say — his jaw tight,
clearly holding back what he really thinks.
```

---

### Voice Description for TTS/Speaking Videos

#### Character Voice Template

```
[AGE] [GENDER] voice, [QUALITY], [TONE], [ACCENT if specific]
```

**Examples:**
- "Young woman's voice, warm and bright, enthusiastic, American"
- "Middle-aged man's voice, deep and gravelly, world-weary, slight Southern accent"
- "Professional female voice, clear and authoritative, confident, neutral accent"

#### Voice Matching to Character Type

| Character Type | Voice Description |
|----------------|-------------------|
| **CEO/Executive** | confident, commanding, measured, authoritative |
| **Teacher/Mentor** | warm, patient, encouraging, clear |
| **Tech Expert** | quick, precise, slightly nerdy, enthusiastic |
| **Friend/Peer** | casual, genuine, relatable, natural |
| **Narrator** | smooth, omniscient, rich, engaging |
| **Salesperson** | energetic, persuasive, upbeat, friendly |
| **Therapist** | calm, soothing, empathetic, gentle |
| **Villain** | cold, calculating, low, menacing |

---

### Complete Speaking Prompt Examples

#### Testimonial/UGC Style

```
Medium close-up, 35mm lens, soft natural window light. A genuine woman
in her late 20s, casual sweater, sitting on a couch in her living room.
She looks at camera with authentic warmth and says in a conversational,
slightly amazed tone: I honestly didn't expect it to work this fast.
She pauses, shaking her head with a slight laugh, then continues:
But here I am, three weeks later, and everything's different. Her
expression shifts to sincere gratitude as she finishes.
```

#### Professional/Corporate

```
Medium shot, clean office background, professional lighting. A confident
executive in his 40s, tailored suit, stands with composed authority.
He addresses the camera directly with a measured, authoritative voice:
Our commitment to excellence isn't just a slogan. He pauses, leaning
slightly forward for emphasis: It's in every decision we make. Subtle
nod, maintaining eye contact.
```

#### Dramatic/Emotional

```
Close-up, shallow depth of field, moody side lighting. A woman's face,
traces of tears, looking off-camera with distant pain. She speaks in
a quiet, broken voice: I thought I knew who he was. Her jaw tightens,
eyes glistening: Turns out I didn't know anything. She closes her eyes,
a single tear falling, then opens them with newfound resolve.
```

#### Energetic/Excited

```
Medium shot, bright colorful background, high energy lighting. A young
creator in vibrant streetwear, animated and expressive. He bursts out
with infectious excitement: You guys are NOT gonna believe what just
happened! Wide eyes, hands gesturing wildly: I literally just got the
call. He pauses for effect, then delivers with maximum hype: WE'RE IN!
```

---

### Lip-Sync Best Practices

| Do | Don't |
|----|-------|
| Keep dialogue under 8 seconds | Write long monologues |
| Use clear, simple sentences | Use complex tongue-twisters |
| Match emotion to facial expression | Write neutral dialogue with dramatic expressions |
| Include pauses and breaths | Rush through without breaks |
| Specify lip visibility ("clearly enunciating") | Assume perfect sync automatically |
| Use reference image for character consistency | Describe new character each time |

---

## 5. Style & Mood Keywords

### Visual Styles
- **Cinematic** — Film-quality, wide aspect feel
- **Documentary** — Authentic, observational
- **Commercial** — Polished, advertising quality
- **Film noir** — High contrast, shadows, moody
- **Anamorphic** — 2.35:1 look, horizontal flares
- **VHS / Retro** — Analog, nostalgic
- **Clean / Minimal** — Simple, uncluttered

### Mood Terms
- **Confident** — Assured, powerful
- **Hopeful** — Optimistic, bright
- **Tense** — Anxious, uncertain
- **Intimate** — Close, personal
- **Epic** — Grand, sweeping
- **Calm** — Peaceful, serene

---

## 6. Action & Motion Verbs

Use physical, force-based verbs for dynamic action:

| Weak | Strong |
|------|--------|
| "moves" | "pushes, pulls, strides, glides" |
| "looks" | "gazes, scans, locks eyes, glances" |
| "shows" | "reveals, emerges, materializes" |
| "goes" | "rushes, drifts, accelerates, creeps" |

**Example transformation:**
- ❌ "The person moves across the room and looks at the screen"
- ✅ "The person strides confidently across the room, then locks eyes on the glowing screen"

---

## 7. Keyframe Workflow (First Frame / Last Frame)

Veo 3.1 supports **keyframe-driven generation**: provide a start image (first frame) and
optionally an end image (last frame), and Veo interpolates the motion between them.

### When to Use Keyframes

| Scenario | Use Keyframes? |
|----------|----------------|
| Consistent character across clips | **YES** — generate character keyframe first |
| Product showcase | **YES** — photograph or render product as first frame |
| UI/dashboard animation | **YES** — screenshot as first frame |
| Abstract/ambient B-roll | No — text prompt sufficient |
| Transformation scene (before/after) | **YES** — first AND last frame |

### Keyframe Best Practices

1. **Generate the first frame image** using `generateKeyframe()` before video generation
2. **Use high-quality keyframes** — 1080p or higher, clean composition
3. **Match aspect ratio** — Keyframe aspect must match target video (9:16, 16:9, etc.)
4. **For transformations**, provide both first AND last frame
5. **Describe the motion** in the prompt, not the static appearance (already in keyframe)

### First Frame Only (Most Common)

```typescript
// Step 1: Generate the keyframe (what the video starts with)
const keyframe = await generateKeyframe({
  prompt: 'Woman in her 30s, dark hair, navy blazer, confident expression, facing camera, modern office background, medium close-up, soft natural lighting',
  outputPath: 'keyframe-01.png',
  aspectRatio: '9:16'
});

// Step 2: Generate video FROM that keyframe
const video = await generateVideoFromKeyframe({
  firstFramePath: 'keyframe-01.png',
  prompt: 'She nods confidently and gestures while explaining, slight smile forming, camera slowly pushes in',
  outputPath: 'clip-01.mp4',
  duration: 6
});
```

### First + Last Frame (Transformation)

```typescript
const video = await generateVideoFromKeyframes({
  firstFramePath: 'before-dashboard.png',
  lastFramePath: 'after-dashboard-populated.png',
  prompt: 'Dashboard cards animate in smoothly, progress bars fill up, data visualizations populate one by one, hopeful energy building',
  outputPath: 'transformation.mp4',
  duration: 6
});
```

---

## 7b. Production-Sheet Story Pipeline (multi-character consistency)

For narrative shorts where the SAME cast/locations/props must hold across many
shots, single keyframes aren't enough — build **production sheets** and feed
them as **asset references**. Full recipe: `workflows/recipes/story-short-film.md`.
The five steps: story bible (.md) → production sheets → storyboard + scene
prompt mapping → multi-reference clips → ffmpeg assembly.

### Asset references vs first frame (know the difference)

- `referenceImagePath` (first frame) — the clip STARTS from this exact image.
- `referenceImagePaths` (asset refs, **max 3 on Veo**) — guide what things
  LOOK like without appearing verbatim: character sheet + environment sheet +
  prop sheet in one request. For 4-5 refs use Omni Flash `reference_to_video`
  (max 5, `<IMG_REF_n>` tags).

### Prompt pattern: character sheet (one image = the whole character)

```
Character production sheet for LINA: full-body FRONT view, 3/4 view, SIDE
view, BACK view of a 7-year-old girl with dark braided pigtails, pink tee,
maroon overalls, yellow socks. Expressions grid: warm, curious, surprised,
thinking, sorry, happy. Personality: curious, fearless, quietly stubborn —
she investigates before she runs. Props: her felt ball. Color palette
swatches. White background. Photorealistic. Label all views clearly.
```

Include the PERSONALITY on the sheet — it drives acting in every clip that
references it. Same pattern for environments ("FRONT view, SIDE view, TOP
view, REAR view (behind the tree), corner detail, materials close-up …
Label all views clearly") and props (multiple angles + in-hand scale shot).

### Prompt pattern: storyboard (approval artifact before paying for clips)

```
12-panel cinematic storyboard titled "LILA — FLOATING WONDER", 15 seconds,
16:9. Character design, environment, props, colors and style must match the
reference sheets exactly in every panel. Avoid shots that are too similar to
each other. Each panel labeled: shot number, shot type, camera movement,
duration in seconds, visual description, and dialogue or action line. Not
every shot needs dialogue.
```

Pass ALL sheets via `generateImageVariation` `referenceImagePaths` (max 5).

### Prompt pattern: multi-reference scene clip

State each reference's ROLE — refs without roles produce mashups:

```
The girl from the character sheet — same face, braids, overalls — chases the
ball from the prop reference toward the ivy-wall corner of the garden from
the environment reference. Golden afternoon light. (soft ambient birds)
```

Multi-shot version (Omni Flash or a storyboard-driven clip): "Each shot
follows the timing, camera movement and composition specified in the
storyboard. Maintain consistent characters, environment and color palette
across all cuts. Smooth transitions between shots."

### Assembly transitions (ffmpeg, $0)

`assembleFinal` takes `transition` (`fade`, `dissolve`, `fadeblack`,
`wipeleft`, `slideleft`, `circleopen`, …) + `transitionDuration` (default
0.5s). Hard cuts (omit) for pace; dissolves for gentle story flow; each
overlap shortens total runtime by its duration.

---

## 8. Detailed Prompt Examples

### Product Video (UI Animation)

```
First frame: Screenshot of empty analytics dashboard

Medium shot, static camera. Clean SaaS dashboard interface springs to life.
Metric cards fade in one by one from left to right. Progress bars smoothly
fill to 85%. A line graph animates upward with a satisfying curve. Cursor
glides naturally to click the "View Report" button. Soft ambient office
lighting reflected in the screen. Premium tech aesthetic, calm confidence.
```

### Character Introduction

```
First frame: Generated keyframe of the character

Medium close-up, 50mm lens, slow 2-second push-in. The woman looks directly
into camera, her expression shifting from neutral to a subtle knowing smile.
She tilts her head slightly and raises one eyebrow. Soft Rembrandt lighting
from the left, warm tones. Modern minimalist background with shallow depth
of field. Confident, trustworthy energy.
```

### Dramatic Reveal

```
First frame: Close-up of closed laptop
Last frame: Wide shot showing full workspace with multiple monitors

Slow pull-back reveal over 6 seconds. Laptop opens, screen illuminates the
face of a focused developer. Camera continues pulling back through the room,
revealing a sophisticated workspace with three monitors, code on screen,
city lights visible through window. Crane movement rising slightly. Cool
blue ambient light mixing with warm desk lamp. Epic productivity aesthetic.
```

### Action Sequence

```
Medium tracking shot, 35mm lens, steadicam follow from behind. Runner
pushes off the starting blocks explosively, muscles tensing visibly.
Camera accelerates to match pace as they sprint down the track. Dust
kicks up from each footfall. Shallow depth of field isolates the runner.
Golden hour backlighting creates rim light on shoulders. Dynamic, powerful,
determined energy. Slight slow-motion feel at 48fps.
```

---

## 9. Common Mistakes to Avoid

### ❌ DON'T: Describe text overlays
```
❌ "Text appears saying 'Apply Now'"
```
Veo cannot render readable custom text. Add text in post-production.

### ❌ DON'T: Request multiple complex movements
```
❌ "Camera pans left while tilting up, then orbits, then zooms in"
```
Choose ONE primary movement per clip.

### ❌ DON'T: Use vague descriptions
```
❌ "A nice video of someone working"
```

### ✅ DO: Be specific and cinematic
```
✅ "Medium shot, 35mm lens, slow push-in. Professional woman in navy blazer
types confidently on laptop, soft smile forming. Modern office, natural
window light from left. Clean, focused, productive energy."
```

### ❌ DON'T: Describe what the keyframe already shows
```
❌ "A woman with dark hair wearing a blue shirt..." (when keyframe shows this)
```

### ✅ DO: Describe the motion/change
```
✅ "She turns to face camera, expression shifting to confident smile,
gestures with right hand while speaking"
```

---

## 10. The Two-to-Three Modifier Rule

For cleanest results, limit to:
1. **One framing choice** (medium close-up)
2. **One movement** (slow push-in)
3. **One lens** (35mm) — optional but recommended

**Clean example:**
```
Medium close-up, 35mm lens, slow dolly push-in.
```

**Overloaded example (avoid):**
```
❌ Medium close-up transitioning to close-up with 35mm then 85mm lens,
handheld with slight orbit and push-in while panning...
```

---

## Quick Reference Card

```
SHOT:       EWS | Wide | MWS | MS | MCU | CU | ECU | Insert | OTS | POV | Top-down
MOVEMENT:   Static | Pan | Tilt | Dolly | Track | Crane | Orbit | Steadicam | Handheld
SPEED:      Slow | Natural | Fast | Whip
LENS:       16mm | 24mm | 35mm | 50mm | 85mm | 135mm
DOF:        Shallow f/1.4 | Deep f/11

LIGHTING:
  Natural:    golden hour | blue hour | overcast | backlit | window light | dappled
  Studio:     Rembrandt | butterfly | split | rim light | three-point | softbox
  Quality:    high key | low key | soft | hard | volumetric | chiaroscuro
  Colored:    neon glow | RGB | firelight | moonlight | screen glow | practical
  Temp:       warm tungsten | neutral daylight | cool blue | teal and orange

EFFECTS:
  Lens:       lens flare | anamorphic flare | bokeh | motion blur | vignette
  Atmosphere: fog | mist | smoke | dust particles | rain | snow | sparks | volumetric fog
  Glow:       bloom | neon glow | holographic | light trails | glitch
  Color:      teal & orange | desaturated | film grain | vintage | noir | warm/golden

TRANSITIONS:
  Cuts:       hard cut | jump cut | match cut | action match | graphic match
  Fades:      fade to black | fade from black | fade to white | cross-dissolve
  Motion:     whip pan | zoom transition | blur transition | rack focus
  Creative:   morph | transform | wipe | iris wipe | particle dissolve

CHAINING:
  Openings:   "Continuing from..." | "Moments later..." | "The same character now..."
  Closings:   "...reaches toward" | "...turns to face" | "...fades as"
  Flow:       Linear (A→B→C) | Parallel | Circular | Montage | Problem-Solution

CHARACTER SPEAKING:
  Formula:    [CHARACTER] + [EMOTION] + [ACTION] + says in [TONE]: [DIALOGUE]
  Tone:       confident | warm | urgent | calm | playful | serious | mysterious | passionate
  Voice:      deep | bright | raspy | smooth | breathy | measured | energetic
  Expression: smiling | eyes widening | jaw tightening | nodding | looking away | leaning in
  Body:       arms open | leaning forward | fidgeting | standing tall | shoulders back
  Acting:     subtle | natural | heightened | intense | understated | theatrical
  Timing:     hesitates | pauses | immediately responds | lets it sink in | measured

MULTI-CHARACTER:
  Structure:  Setup → Character Intent → Action Beats → Reactions
  Label:      "SARAH (CEO, commanding) says..." | "MARK (nervous) replies..."
  Flow:       back-and-forth | monologue+reaction | overlapping | building tension

STYLE:      Cinematic | Documentary | Commercial | Film noir | Anamorphic | Clean
MOOD:       Confident | Hopeful | Tense | Intimate | Epic | Calm
```

---

## See Also

- **STYLE-GUIDE.md** — Visual style reference (animation, artistic, modern, meme, etc.)
- **IMAGE-PROMPT-GUIDE.md** — Image-specific prompting (composition, lighting, etc.)
- **WORKFLOWS.md** — API usage and workflow functions

---

## Sources

### Camera & Cinematography
- [Google DeepMind Veo Prompt Guide](https://deepmind.google/models/veo/prompt-guide/)
- [Google Cloud Ultimate Veo 3.1 Guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)
- [Google AI Gemini Video Docs](https://ai.google.dev/gemini-api/docs/video)
- [30 Cinematic Camera Prompts](https://prompt-architects.com/blog/25-30-cinematic-camera-prompts-for-veo3-and-kling)

### Lighting & Effects
- [OpenArt - Midjourney Prompts for Lighting](https://openart.ai/blog/post/midjourney-prompts-for-lighting)
- [Blenra - AI Art Lighting Prompts Gallery](https://www.blenra.com/blog/ai-art-lighting-prompts-gallery)
- [ZSky AI - Cinematic Scene Prompts](https://zsky.ai/blog/ai-cinematic-scene-prompts)

### Transitions & Clip Chaining
- [ReelMind - Veo 2 Flow Transitions](https://reelmind.ai/blog/veo-2-flow-smooth-transitions-in-ai-video-production)
- [Adobe - Video Transitions](https://www.adobe.com/creativecloud/video/post-production/transitions.html)
- [StudioBinder - Types of Editing Transitions](https://www.studiobinder.com/blog/types-of-editing-transitions-in-film/)
- [Veo 3.1 First/Last Frame API](https://fal.ai/models/fal-ai/veo3.1/first-last-frame-to-video)

### Character Speaking & Dialogue
- [FocalML - Veo 3 Speaking and Dialogue](https://focalml.com/blog/how-to-prompt-for-speaking-and-dialogue-in-veo-3/)
- [Runway - AI Talking Photo Lip Sync](https://runwayml.com/apps/add-dialogue)
- [Skywork - Lip-Synced Dialogue in Veo 3](https://skywork.ai/blog/how-to-prompt-lip-synced-dialogue-google-veo-3/)
- [MimicPC - Veo 3 Prompts Guide](https://www.mimicpc.com/learn/how-to-write-veo-3-prompts-for-the-best-result)

---

## Native in-video text — tested verdict (2026-07-05, "The Intervention" test)

Veo 3.1 CAN render text without Remotion, but placement determines reliability:

| Text placement | Result | Rule |
|---|---|---|
| SET text (whiteboard/sign in the environment description) | ✅ rendered, correctly spelled | Describe it in `environment` AND repeat "clearly legible" in the motion prompt |
| ACTION-PROP text (character holds up note/phone mid-scene) | ❌ 0/3 appeared | Image-to-video stays close to the reference frame — props absent from frame 1 rarely materialize |

**The pro workflow for text props:** bake the prop INTO the start frame —
Nano Banana Pro keyframe (`imageModel:"pro"`: character + prop with exact text,
NBP nails spelling) → `generateSpeakingVideoFromImage` animates it. Set text can
go straight in the environment prompt. Speaking + set-text + consistent
character in one clip is confirmed working.

---

## Pro syntax for Veo 3.1 (researched 2026-07-05 — USE THIS)

### 1. Timestamp prompting — direct beats INSIDE one 8s clip
```
[00:00-00:02] Medium shot: <who + what happens>. SFX: <sound>
[00:02-00:05] <next beat, camera change, emotion>. He says, "exact line."
[00:05-00:08] <resolution beat>. Ambient noise: <bed>. (no subtitles)
```
One prompt, multiple choreographed beats — pacing, camera moves, and emotional
progression inside a single generation. Best for product beats, punchline
timing, hero shots.

### 2. Dialogue — exact-line syntax
`He says, "We have to leave now."` — quotation marks = spoken verbatim with
lip-sync. Add `(no subtitles)` at the end of the prompt or Veo may burn its own
captions. One breath per 8s clip (~15 words max).

### 3. Audio direction
`SFX: thunder cracks in the distance` · `Ambient noise: quiet office hum` ·
music cues as SFX lines. Veo 3.1 syncs these to the visuals.

### 4. Combine with the kit
Put the full timestamped block in the `prompt` of `generateVideoFromImage` /
`generateSpeakingVideoFromImage`. For text PROPS: NBP start frame first
(see verdict above), then timestamp the reveal:
`[00:01-00:03] He raises the gold sticky note with the word STOP to the camera.`

### Live handwriting (character writes on blank board) — tested 2026-07-05, 2 attempts

The writing ANIMATION works beautifully (blank board → strokes appear → words,
with marker SFX). The final TEXT is the weak point: attempt 1 misspelled
(USRS), attempt 2 spelled correctly but added a stray squiggle. Reliability
hierarchy for in-video text, worst → best:

1. ❌ Live writing of full words — expect 1-3 retries, stray marks common
2. ⚠️ Live writing of ONE short word (STOP) — better odds, still retry-prone
3. ✅ Action prop baked into NBP start frame — reliable
4. ✅ Set text in environment (pre-written board/sign) — reliable

Production trick: for "writing on board" content, have the character UNDERLINE
or CIRCLE pre-written NBP text instead of writing it — same energy, zero
spelling risk. Save true live-writing for when the imperfection is charming.

### UPDATE (2026-07-05, later): Gemini Omni Flash tested — WINS the live-writing case

`generateOmniVideoClip` (new CLI command, Interactions API, task text_to_video,
~10s cap): the same whiteboard live-writing prompt that Veo failed twice
(USRS / stray squiggle) came out PERFECT first try — blank board → progressive
handwriting → "TALK TO USERS" correctly spelled → character steps aside on cue.

Model selection rule:
- **Veo 3.1** — cinematic fidelity, image-to-video from locked keyframes, 8s beats
- **Omni Flash** — instruction-heavy beats: live writing, precise choreography,
  text-in-scene; supports tasks text_to_video | image_to_video |
  reference_to_video | edit | extend (conversational editing — unexplored)
Cost (measured): ~$1.03 per 10s clip (≈58k video tokens @ $17.5/M + input) —
usage mapping fixed 2026-07-05, auto-ledgered from now on. Requires
@google/genai >= 2.0.0.
**image_to_video works and is the production path:** pass
`referenceImagePath` (e.g. an NBP keyframe with your locked character) —
character/room stay consistent AND text instructions land. For in-order
handwriting, spell out the stroke order in the prompt ("first T-A-L-K, then
T-O, then U-S-E-R-S, exactly as a person writes").

---

# Gemini Omni Flash — Full Prompting Guide (2026-07-06)

> Omni Flash is "Nano Banana for video": one conversational model for
> generating AND editing. Everything below runs through ONE CLI command —
> `generateOmniVideoClip` — the task is auto-selected from the inputs you pass.

## Specs (hard limits — plan around them)

| Spec | Value |
|---|---|
| Max clip length | **10 seconds** per turn (longer = multi-clip + `assembleFinal`) |
| Resolution | **720p native only** (need 1080p+? use Veo 3.1) |
| Aspect ratios | **16:9** (default) and **9:16** |
| Reference images | Up to **5** per prompt |
| Audio output | **Native** — VO, dialogue, SFX, ambience generated in the same pass; prompt for it in text |
| Audio input | **Not supported** (describe the audio you want instead) |
| Safety | Refuses named real people/likenesses; no voice editing of real footage; SynthID + C2PA on every output |

## The four video tasks — and when to use each

| Task | You provide | Good for | Example prompt |
|---|---|---|---|
| **Text to Video** | prompt only | Explainers, sizzle reels, text-sync pieces | "A side view of a person running, with a new cut every 2 seconds, they run past 5 unusual real world things. Label the things as they go by with the same text effect. Same road. Sizzle reel. A voiceover announces the things." |
| **Image to Video** | 1 image (`referenceImagePath`) | Explainers, cinematic beats, animating a keyframe/scene | *(attach scene image)* "A cat enters the scene and he pets it" |
| **Reference to Video** | 2-5 images (`referenceImagePaths`), cited as `<IMG_REF_0>`… | Keeping a product/character/environment consistent in a NEW scene | "A violinist is playing this violin `<IMG_REF_0>` on this stage `<IMG_REF_1>`" |
| **Edit Video** | existing clip (`inputVideoPath`) | SFX, adding/changing text in video, restyling, camera/action changes | "Keep everything the same. Add animated motion effects coming out of the skateboard." |

**`<IMG_REF_n>` tags:** in reference_to_video, images are numbered in array
order — `referenceImagePaths[0]` = `<IMG_REF_0>`. Cite the tag exactly where
the object appears in your sentence.

## Prompting philosophy: Omni ≠ Veo

**With Veo you must be prescriptive** (five-part formula, 100-200 words, exact
film language). **Omni Flash reasons** — it has Gemini's world knowledge of
history, science, and culture, plus intuitive physics. Tell it WHAT you want,
not every frame:

- ✅ "Claymation explainer of protein folding" → technically accurate alpha
  helices + synced narration, no manual spec needed.
- ✅ "Explain the difference between regular computing and quantum computing"
  → the model designs the visualization itself.

Detail still = control. Layer in **shot framing, style, lighting, location,
action** when you have an exact vision; leave them out when you want the
model's reasoning to fill the gaps.

## Art styles — ASK THE USER FIRST (mandatory)

Omni Flash excels at stylized worlds. The kit ships 10 presets
(`artStyle` field — fragments live in `OMNI_ART_STYLES`):

| `artStyle` id | Look |
|---|---|
| `pixel-art` | Retro 8/16-bit, chunky pixels, limited palette |
| `claymation` | Stop-motion clay, fingerprints, 12fps charm |
| `mixed-media` | Photo cutouts + paper textures + hand-drawn scribbles |
| `3d-papercraft` | Layered cut-paper diorama, folded edges |
| `whiteboard-doodle` | Marker line art, sketchy line-boil |
| `2d-illustration` | Flat vector shapes, editorial motion graphics |
| `low-poly` | Faceted 3D polygons, flat shading |
| `3d-mix` | Polished 3D subject + flat 2D graphic elements |
| `isometric-flat-vector` | Isometric miniature world, pastel precision |
| `fluffy-toy` | Plush fabric textures, macro stitching, cozy |

**Rule: before ANY stylized Omni generation, present these options and ask the
user to pick one — or photorealistic (omit `artStyle`), or their own custom
style description.** Style is a brand decision, not an agent guess. Record the
choice in the project's `brand.md` so future generations reuse it.

Custom styles also work — write them straight into the prompt, e.g. the
DeepMind sample: *"contemporary flat-media style that blends minimalist vector
shapes with rich organic textures … high-contrast electric palette of neon
pinks, cyans, limes on deep navy … stipple shading and grainy gradients,
risograph-like."*

## Camera direction vocabulary (tested Omni terms)

> Prefer the 46 preset blocks in **§2b** — `generateOmniVideoClip` takes
> `cameraMove: "<id>"` directly. The loose terms below are for conversational
> edit-task turns and custom moves.

- Continuous: "one continuous shot", "oner"
- Locked: "static", "locked off", "fixed"
- Moves: "push in", "punch in", "dolly zoom"
- Camera character: "natural smartphone zoom", "film camera", "webcam style"
- Edit-task camera changes: "Change the camera angle to be over the
  violinist's shoulder" · "a close-up on his shoes, quickly tilting up to
  medium shot, then widening"

## Text rendering & sync

Omni renders text accurately AND in sync with visuals — word-by-word reveals,
lower thirds, labels reacting to on-screen events. Sample that works:

> "word by word, one word on the screen at a time: did, you, know, that, this,
> model, can, do, pretty, good, text!? each word appears with a different
> animated style, perfect pacing to a rhythm, sizzle reel."

(This is the ONE model where "text appears…" prompts are allowed — the
NO-TEXT-IN-PROMPTS rule is a Veo rule.)

## Conversational editing (edit task) — iterate, don't regenerate

Each edit preserves what you didn't mention. Chain small asks:

1. "Change the butterfly to a bee." → 2. "Change the bee into a small swarm of fireflies."
- Action sync: "The lights of the apartments start turning on in sync with the music."
- Complex actions land without frame-by-frame spec: "Edit this keeping
  everything the same. Add animated motion effects coming out of the skateboard."
- Restyle while keeping motion: "apply a claymation style" / staged
  progressions (crayon → pencil sketch → glass 3D → risograph).

Feed the previous output as the next `inputVideoPath`, keep each instruction
to ONE change, and log every turn in prompts.txt with a RESULT note.

## More Omni superpowers

- **Drawing to video:** a rough sketch as reference guides motion/structure
  without appearing in the output — "photorealistic footage of this flying
  machine `<IMG_REF_0>` in motion".
- **Storyboard to video:** pass a storyboard image — "Show me in this story.
  Follow the story exactly in order starting top left. Entire story in 10
  seconds. Cinematic."
- **Native audio:** prompt it explicitly — "A voiceover announces the
  things", "SFX: marker squeaks", "Ambient noise: rain on a tin roof".

## Model selection cheat sheet (Veo 3.1 vs Omni Flash)

| Need | Use |
|---|---|
| Cinematic fidelity, 1080p+, premium brand film | Veo 3.1 |
| Live writing, text-in-scene, exact choreography | Omni Flash |
| Stylized explainer (clay/pixel/papercraft…) | Omni Flash + `artStyle` |
| Multi-asset consistency in one scene (product + set) | Omni Flash reference_to_video |
| Fix/augment an existing clip (SFX, text, restyle) | Omni Flash edit |
| Speaking character with lip-sync (UGC) | Seedance |
| >10s continuous single shot | Veo 3.1 (8s beats) or multi-clip assembly |

---

# Production-Tested Playbook — Consistent Characters, Non-English Dialogue, Surgical Edits

> Distilled from a full 6-scene Burmese-dialogue short-film production
> (2026-07-06, "Bo Bo & Star"). Every claim below was paid for and verified —
> receipts in `examples/` and the project's prompts.txt. Read this BEFORE
> starting any multi-scene character film or non-English speaking video.

## 1. Character consistency — the ladder (worst → best)

| # | Method | Held identity? | Verdict |
|---|---|---|---|
| 1 | Text description re-written per scene | ❌ never | Two descriptions = two characters. Don't. |
| 2 | Veo `referenceImagePaths` (asset refs) | ⚠️ humans drift, objects/mascots REINVENTED | Veo treats refs as inspiration. A fictional robot grew arms/legs/torso in 6/6 attempts. |
| 3 | Omni `reference_to_video` + `<IMG_REF_n>` cited roles | ✅ humans, ✅ objects mostly | Gemini reasoning follows refs far more literally than Veo. |
| 4 | **NBP keyframe → `image_to_video`** (Omni, or Veo single-ref) | ✅✅ both | **THE WINNER.** Identity lives in an approvable STILL (image models hold identity far better than video models); the video model only adds motion + speech. ~$0.07 still + ~$0.83 Omni clip. |
| 5 | Veo 3.1 first+last frame (`generateVideoFromKeyframes`) | ✅ at both ends, ⚠️ may morph mid-clip | Locks composition at both ends. Watch mid-flight frames on fictional objects. |

**Rules that fell out of production:**
- **Humans:** the multi-view character sheet works — faces transfer well.
- **Fictional objects/mascots/robots:** a multi-view sheet CONFUSES video
  models (they blend the views into a segmented toy). Crop ONE clean view
  (`char-x-hero.png`) and reference that instead. Keep the full sheet for
  image-model keyframes only.
- Per-scene pipeline: `generateImageVariation` (sheets as refs, 9:16, ~$0.07)
  → LOOK at the keyframe (or `reviewOutput`) → animate that exact file.
- Characters must appear in the FIRST frame of every scene; if a shot design
  hides them at the start (reveal shots), put them in the LAST frame and use
  `generateVideoFromKeyframes`.

## 2. Structured i2v prompts — START / ACTION / DIALOGUE / END

Omni image_to_video obeys this four-part structure precisely; freeform prompts
lose characters out of frame mid-scene:

```
START FRAME (this image): <who is where, doing what, emotional state>.
ACTION: <movements in order — subject, then camera>.
DIALOGUE: <speaker> says in <register> <language>, lips syncing: "<line>"
END FRAME: <exact final composition — WHO must still be in frame>.
Audio: <ambience, SFX>. Keep characters/design/location exactly as in the image. (no subtitles)
```

## 3. Non-English dialogue (tested with Burmese/Myanmar — applies to other scripts)

**Model choice: Gemini Omni Flash is the DEFAULT for non-English speaking
characters.** Its Gemini language layer both pronounces Burmese better and
passes Burmese script in prompts without fuss. Veo's safety filter silently
eats mixed-language prompts ("No video was generated", $0 charged, no reason
given).

Veo filter scorecard (Burmese, 2026-07-06 — expect similar for Thai/Khmer/etc.):

| Prompt pattern | Veo filter | Notes |
|---|---|---|
| English prompt + bare Burmese-script quote | ❌ 0/2 | Silent block |
| English prompt + Burmese quote + `(meaning: <English gloss>)` | ⚠️ 1/2 | Coin flip |
| + explicit voice/pronunciation direction | ❌ 0/1 | Meta speech words trigger it |
| + "not singing / no music" directives | ❌ 0/3 | Words for song/music/voice = instant block |
| **ENTIRE prompt in Burmese** (dialogue via `…မေးသည်- "…"`) | ✅ 7/8 | Passes, BUT ref-following weakens badly (see §1 ladder) |
| Omni (any of the above patterns) | ✅ | Just works; keep prompt English + native-script dialogue line |

More traps:
- Veo delivers non-English lines in a SINGING/melodic register by default.
  You cannot fix it with "not singing / no music" (filter). Fix by framing:
  "asks casually in everyday spoken <language>, plain conversational tone
  like chatting with a friend".
- Give the robot/mascot a voice too — "cute chirpy synthetic child-like
  <language> robot voice, display pulsing in sync" — no lip-sync risk on a
  faceless character.
- Always end with `(no subtitles)` (Burmese: `(စာတန်းထိုး မထည့်ပါနှင့်)`).

**Decision rule: speaking character in Myanmar/non-Latin-script language →
`generateOmniVideoClip` image_to_video with an approved keyframe. Use Veo only
for beats without dialogue (or English).**

## 4. Editing existing clips — Omni edit task, surgically

When a clip is 90% right, DON'T re-roll the generation — edit it:

```bash
node workflows/cli.cjs generateOmniVideoClip '{
  "inputVideoPath": "clips/scene-05.mp4",
  "referenceImagePaths": ["assets/characters/char-bobo-sheet.png",
                           "assets/characters/char-star-hero.png"],
  "prompt": "Keep everything the same — same motion, same camera, same timing, same audio and spoken dialogue, same lighting. Only <the ONE fix>. The man must be IDENTICAL to <IMG_REF_0>: <locked description>. The robot must be IDENTICAL to <IMG_REF_1>: <locked description>. (no subtitles)",
  "outputPath": "clips/scene-05-fixed.mp4"
}'
```

- **⚠️ THE RULE THAT COSTS MONEY IF IGNORED: any edit that touches a character
  MUST attach that character's reference image(s).** A text-only edit fixes
  the *shape* you describe but silently REDRAWS identity (face, wardrobe) from
  imagination. Refs pin it. (Paid for that lesson twice.)
- Open with "Keep everything the same — same motion, same camera, same
  timing, same audio and spoken dialogue" then state ONE change.
- Do NOT pass `duration`/`aspectRatio` for edit tasks — inherited from the
  input video (the API rejects them; the kit strips them automatically).
- Edit cost ≈ a fresh clip (~$0.90/8s) but converges in 1 try vs regen roulette.

## 5. First+last frame (`generateVideoFromKeyframes`, Veo 3.1)

For reveals, transformations, or guaranteeing characters/composition at both
ends of a shot:

```bash
node workflows/cli.cjs generateVideoFromKeyframes '{
  "firstFramePath": "keyframes/kf-scene-04.png",
  "lastFramePath":  "keyframes/kf-scene-04-END.png",
  "prompt": "<transition: how to get from first to last, + dialogue>",
  "duration": 8, "aspectRatio": "9:16", "quality": "fast",
  "outputPath": "clips/scene-04.mp4"
}'
```

- Free trick: extract a great END frame from a previous take —
  `ffmpeg -sseof -0.2 -i take.mp4 -frames:v 1 kf-END.png` — and interpolate
  toward it.
- Non-English dialogue in the prompt → same Veo filter rules as §3 (pure
  target-language prompt passes; retries are $0 on failure).

## 6. Filter-block triage (Veo "No video was generated")

$0 is charged on blocks — retry freely, but change ONE variable per attempt:
1. Same prompt again (filter is probabilistic — 1 retry is often enough).
2. Strip meta speech/music/voice words (singing, music, voiceover, pronunciation).
3. Non-English text present? → translate the ENTIRE prompt into that language.
4. Still blocked twice more? → switch the beat to Omni.
