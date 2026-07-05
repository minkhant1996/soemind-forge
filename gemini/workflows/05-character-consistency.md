# Character Consistency Guide

> Maintain the same character across multiple clips and scenes.

---

## The Problem

AI video generation struggles with consistency:
- Same prompt = different faces
- Different clips = different characters
- No memory between generations

## The Solution: Keyframe Anchoring

```
1. Generate character image (master reference)
2. Create keyframe images for each scene
3. Use keyframes as reference for video generation
```

---

## Character Definition Template

### The Character Sheet

```markdown
## Character: [NAME]

### Physical Appearance
- Age: [Specific, e.g., "early 30s"]
- Gender: [Male/Female/Non-binary]
- Ethnicity: [Be specific for consistency]
- Hair: [Color, length, style]
- Face: [Shape, notable features]
- Eyes: [Color, shape]
- Build: [Body type]

### Clothing (Lock this exactly)
- Top: [Exact description, color, brand feel]
- Bottom: [Exact description]
- Accessories: [Watch, glasses, jewelry]
- Shoes: [If visible]

### Expression Range
- Neutral: [Default expression]
- Negative: [Frustration, stress, confusion]
- Positive: [Happy, satisfied, excited]
- Intense: [Focus, determination]

### Signature Elements
- [Something unique that appears in every shot]
- [e.g., "always wears silver watch on left wrist"]
- [e.g., "small scar above right eyebrow"]
```

### Example Character Sheet

```markdown
## Character: Alex (Developer Protagonist)

### Physical Appearance
- Age: Early 30s
- Gender: Male
- Ethnicity: Caucasian, light skin
- Hair: Dark brown, short, slightly messy
- Face: Oval, light stubble, friendly features
- Eyes: Brown, expressive
- Build: Average, slim

### Clothing
- Top: Navy blue cotton hoodie, slightly worn
- Bottom: Dark gray joggers (usually not visible)
- Accessories: Silver minimalist watch on left wrist
- Shoes: Not visible (seated)

### Expression Range
- Neutral: Thoughtful, slight focus
- Negative: Furrowed brow, tired eyes, tense jaw
- Positive: Warm smile, relaxed eyes, slight head tilt
- Intense: Leaning forward, widened eyes

### Signature Elements
- Always wears the navy blue hoodie
- Silver watch always visible when hands shown
- Coffee mug usually in frame (white ceramic)
```

---

## The Prompt Anchoring Technique

### Core Character Prompt Block

Create a reusable block that goes in EVERY prompt:

```
[CHARACTER BLOCK]
A male developer in his early 30s with short dark brown hair and light stubble.
Wearing a navy blue cotton hoodie.
Silver minimalist watch on left wrist.
Friendly, expressive face with brown eyes.
```

### Full Prompt Structure

```
[SHOT TYPE], [CHARACTER BLOCK] [DOING ACTION].
[EXPRESSION/EMOTION for this scene].
[ENVIRONMENT DESCRIPTION].
[LIGHTING for this scene].
[CAMERA MOVEMENT].
Cinematic quality, consistent with previous shots.
```

### Example: Same Character, Different Scenes

**Scene 1 - Frustrated**:
```
Cinematic medium close-up of a male developer in his early 30s with short dark brown
hair and light stubble, wearing a navy blue cotton hoodie, silver watch on left wrist.
Rubbing his tired eyes with frustration, jaw tense.
Sitting at a minimal desk with an ultrawide monitor showing error messages.
Harsh blue monitor light casting shadows on his face.
Camera slowly pushes in.
Cinematic quality, 4K.
```

**Scene 2 - Curious**:
```
Cinematic medium shot of a male developer in his early 30s with short dark brown
hair and light stubble, wearing a navy blue cotton hoodie, silver watch on left wrist.
Leaning forward with curiosity, eyebrows raised slightly, expression hopeful.
Same desk setup, monitor now showing clean AI interface.
Warmer light beginning to fill the room.
Camera gently orbits from side.
Cinematic quality, 4K, consistent with previous scene.
```

**Scene 3 - Triumphant**:
```
Cinematic medium wide shot of a male developer in his early 30s with short dark brown
hair and light stubble, wearing a navy blue cotton hoodie, silver watch on left wrist.
Leaning back with satisfied smile, relaxed posture, hands behind head.
Same desk, monitor showing success message with green indicators.
Warm golden hour light flooding the room.
Camera slowly pulls back.
Cinematic quality, 4K, consistent with previous scenes.
```

---

## Image-First Workflow

### Step 1: Generate Master Character Image

Use image generation to create your character reference:

```typescript
const masterImage = await gemini31FlashImage({
  userPrompt: `
    Portrait photograph of a male developer in his early 30s.
    Short dark brown hair, light stubble, friendly face, brown eyes.
    Wearing a navy blue cotton hoodie.
    Silver minimalist watch visible on left wrist.
    Neutral, thoughtful expression.
    Clean background, professional headshot lighting.
    Photorealistic, high detail, consistent features.
  `,
  config: { imageSize: '2K' }
});

// Save as reference
fs.writeFileSync('character-master.png', masterImage.data.images[0].data);
```

### Step 2: Generate Keyframe Images

For each video scene, generate start and end frame images:

```typescript
const scenes = [
  {
    name: 'scene1-frustrated',
    startPrompt: `Same male developer (early 30s, dark brown hair, stubble,
      navy blue hoodie, silver watch) looking at screen with frustration.
      Harsh blue lighting. Beginning of frustration.`,
    endPrompt: `Same male developer rubbing eyes, peak frustration.
      Same clothing and features. Harsh lighting intensified.`
  },
  {
    name: 'scene2-discovery',
    startPrompt: `Same male developer noticing something on screen.
      Expression shifting from tired to curious.
      Light beginning to warm.`,
    endPrompt: `Same male developer fully engaged, leaning forward.
      Hopeful expression, warm cyan glow on face.`
  }
];

for (const scene of scenes) {
  // Generate start frame
  const startFrame = await gemini31FlashImage({
    userPrompt: scene.startPrompt,
    config: { imageSize: '1K', aspectRatio: '16:9' }
  });
  fs.writeFileSync(`${scene.name}-start.png`, startFrame.data.images[0].data);

  // Generate end frame
  const endFrame = await gemini31FlashImage({
    userPrompt: scene.endPrompt,
    config: { imageSize: '1K', aspectRatio: '16:9' }
  });
  fs.writeFileSync(`${scene.name}-end.png`, endFrame.data.images[0].data);
}
```

### Step 3: Generate Video Using Keyframes

Use the keyframe images as reference:

```typescript
const video = await veo31(promptForScene, {
  referenceImage: fs.readFileSync('scene1-start.png'),
  referenceImageMimeType: 'image/png',
  aspectRatio: '16:9',
  durationSeconds: 8
});
```

---

## Consistency Checklist

For every prompt, verify:

- [ ] Age mentioned (exact: "early 30s" not "young")
- [ ] Hair described (color, length, style)
- [ ] Clothing exact (specific color, type)
- [ ] Signature accessory included (watch, glasses)
- [ ] Same environment details
- [ ] Lighting progression logical
- [ ] "Consistent with previous" phrase included

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "A developer" | "A male developer in his early 30s with dark brown hair" |
| "Blue shirt" | "Navy blue cotton hoodie" |
| "Sitting at desk" | "Sitting at the same minimal desk with ultrawide monitor" |
| Different lighting each scene | Map lighting progression explicitly |
| Forgetting accessories | Include signature items in every prompt |

---

## Environment Consistency

The environment also needs consistency:

```markdown
## Environment: Alex's Home Office

### Desk Setup
- Desk: White minimalist standing desk
- Monitor: Single ultrawide curved monitor (34")
- Keyboard: White mechanical keyboard
- Mouse: White ergonomic mouse
- Chair: Gray ergonomic office chair

### Background
- Left: White bookshelf with plants and books
- Right: Window with sheer white curtains
- Wall: Light gray paint

### Props
- White ceramic coffee mug (right side of desk)
- Small succulent plant (left side of desk)
- Laptop stand with closed laptop (when not in use)

### Lighting
- Main: Monitor glow (shifts color based on content)
- Fill: Soft ambient from ceiling
- Accent: Natural light from window (changes with time)
```

---

## Multi-Character Scenes

When you have multiple characters:

1. **Define each character separately**
2. **Use clear position labels**
3. **Keep clothing distinct**

```
On the left: [CHARACTER A FULL DESCRIPTION] sitting at desk.
On the right: [CHARACTER B FULL DESCRIPTION] standing nearby.
They are [INTERACTION DESCRIPTION].
```

---

## Validation Test

Before generating all clips, generate a test:

1. Create 2 images of your character in different poses
2. Check if they look like the same person
3. Adjust descriptions until consistent
4. Only then proceed to video generation

```typescript
// Test consistency
const test1 = await gemini31FlashImage({ userPrompt: characterPrompt + " smiling" });
const test2 = await gemini31FlashImage({ userPrompt: characterPrompt + " frowning" });

// Manually compare before proceeding
```
