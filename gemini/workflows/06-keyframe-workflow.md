# Keyframe-to-Video Workflow

> Generate consistent videos by creating keyframe images first.

---

## Overview

The keyframe workflow solves the consistency problem:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   STYLE     │     │  KEYFRAME   │     │   VIDEO     │
│   GUIDE     │ ──► │   IMAGES    │ ──► │   CLIPS     │
│ (Document)  │     │ (Start/End) │     │ (Final)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Benefits**:
- Character stays consistent
- Scene composition locked
- Review before expensive video generation
- Better creative control

---

## The Complete Pipeline

### Phase 1: Planning

```typescript
// 1. Define your story
const story = {
  title: "AI Tools for Developers",
  duration: 40, // seconds
  clips: 5,
  structure: "5-act"
};

// 2. Create style guide
const styleGuide = {
  character: {
    description: "Male developer, early 30s, dark brown hair, light stubble",
    clothing: "Navy blue cotton hoodie, silver watch on left wrist",
    expressions: ["frustrated", "curious", "amazed", "confident", "triumphant"]
  },
  environment: {
    setting: "Modern home office",
    desk: "White minimal desk, ultrawide monitor",
    background: "Bookshelf with plants, window with natural light"
  },
  colorPalette: {
    primary: "Deep navy blue",
    secondary: "Cyan/teal accents",
    accent: "Warm golden highlights",
    progression: "Cool harsh → warm balanced → golden triumphant"
  },
  lighting: {
    problem: "Harsh blue monitor glow, dark shadows",
    discovery: "Cyan accent light appearing, softening",
    success: "Warm golden hour, balanced fill"
  }
};
```

### Phase 2: Scene Definition

```typescript
const scenes = [
  {
    id: 1,
    name: "struggle",
    act: "Exposition",
    duration: 8,
    emotion: "Frustration",
    description: "Developer overwhelmed by errors",
    lighting: "Harsh blue, high contrast",
    camera: "Slow push in on face"
  },
  {
    id: 2,
    name: "discovery",
    act: "Rising Action",
    duration: 8,
    emotion: "Curiosity",
    description: "Discovers AI assistant",
    lighting: "Cyan glow appearing",
    camera: "Orbit from side to front"
  },
  {
    id: 3,
    name: "first-win",
    act: "Climax",
    duration: 8,
    emotion: "Amazement",
    description: "AI completes code perfectly",
    lighting: "Balanced blue and gold",
    camera: "Steady with subtle push"
  },
  {
    id: 4,
    name: "flow-state",
    act: "Falling Action",
    duration: 8,
    emotion: "Confidence",
    description: "Working in harmony with AI",
    lighting: "Warm and balanced",
    camera: "Slow dolly back"
  },
  {
    id: 5,
    name: "triumph",
    act: "Resolution",
    duration: 8,
    emotion: "Satisfaction",
    description: "Success achieved, satisfied",
    lighting: "Golden hour flooding",
    camera: "Pull back through window"
  }
];
```

### Phase 3: Generate Keyframes

```typescript
import { gemini31FlashImage } from '../index';
import fs from 'fs';
import path from 'path';

const outputDir = './keyframes';

// Character prompt block (reused in all prompts)
const characterBlock = `
a male developer in his early 30s with short dark brown hair and light stubble,
wearing a navy blue cotton hoodie, silver minimalist watch on left wrist,
friendly face with brown eyes
`;

// Environment prompt block
const environmentBlock = `
sitting at a white minimal desk with a curved ultrawide monitor,
modern home office with bookshelf and plants in background,
window with natural light on the right
`;

async function generateKeyframes() {
  for (const scene of scenes) {
    console.log(`\nGenerating keyframes for Scene ${scene.id}: ${scene.name}`);

    // Build prompts for start and end frames
    const startPrompt = buildFramePrompt(scene, 'start');
    const endPrompt = buildFramePrompt(scene, 'end');

    // Generate start frame
    const startResult = await gemini31FlashImage({
      userPrompt: startPrompt,
      config: { imageSize: '1K', aspectRatio: '16:9' }
    });

    if (startResult.success) {
      const startPath = path.join(outputDir, `scene${scene.id}-${scene.name}-start.png`);
      fs.writeFileSync(startPath, startResult.data.images[0].data);
      console.log(`  ✓ Start frame: ${startPath}`);
    }

    // Generate end frame
    const endResult = await gemini31FlashImage({
      userPrompt: endPrompt,
      config: { imageSize: '1K', aspectRatio: '16:9' }
    });

    if (endResult.success) {
      const endPath = path.join(outputDir, `scene${scene.id}-${scene.name}-end.png`);
      fs.writeFileSync(endPath, endResult.data.images[0].data);
      console.log(`  ✓ End frame: ${endPath}`);
    }
  }
}

function buildFramePrompt(scene, frameType) {
  const isStart = frameType === 'start';

  // Scene-specific details
  const sceneDetails = {
    struggle: {
      start: {
        action: "staring at screen with tired eyes, beginning to feel frustration",
        screen: "showing first error messages appearing",
        lighting: "blue monitor glow starting to feel harsh"
      },
      end: {
        action: "rubbing eyes in frustration, jaw tense, visibly stressed",
        screen: "filled with red error messages and warnings",
        lighting: "harsh blue shadows dominating his face"
      }
    },
    discovery: {
      start: {
        action: "noticing something new on screen, slight curiosity",
        screen: "showing AI assistant interface appearing",
        lighting: "cyan accent beginning to appear"
      },
      end: {
        action: "leaning forward with hope and interest, eyebrows raised",
        screen: "AI interface fully visible with welcoming glow",
        lighting: "soft cyan illuminating his face warmly"
      }
    },
    "first-win": {
      start: {
        action: "watching the screen with anticipation",
        screen: "AI starting to suggest code completions",
        lighting: "balanced blue and warm tones"
      },
      end: {
        action: "eyes wide with amazement, slight smile forming",
        screen: "perfect code auto-completed with green highlights",
        lighting: "warm golden light mixing with screen glow"
      }
    },
    "flow-state": {
      start: {
        action: "hands on keyboard, confidently typing",
        screen: "code flowing smoothly with AI suggestions",
        lighting: "warm balanced light filling the room"
      },
      end: {
        action: "relaxed posture, slight smile, in the zone",
        screen: "beautiful clean code, harmonious workflow",
        lighting: "golden hour warmth through window"
      }
    },
    triumph: {
      start: {
        action: "leaning back, looking at successful result",
        screen: "showing build successful with green checkmarks",
        lighting: "golden hour light streaming in"
      },
      end: {
        action: "satisfied smile, hands behind head, triumphant",
        screen: "clean dashboard, all green indicators",
        lighting: "room flooded with warm golden light, lens flare"
      }
    }
  };

  const details = sceneDetails[scene.name][frameType];

  return `
Cinematic ${isStart ? 'opening' : 'closing'} frame of ${scene.name} scene.

${characterBlock},
${details.action}.

${environmentBlock},
monitor ${details.screen}.

${details.lighting}.

${scene.emotion} mood, ${isStart ? 'beginning' : 'peak'} of the emotion.

Photorealistic, cinematic shallow depth of field,
movie still quality, 16:9 aspect ratio.
Consistent with film production style guide.
  `.trim();
}
```

### Phase 4: Review Keyframes

Before generating videos:

1. **Check character consistency** - Same person in all frames?
2. **Check lighting progression** - Logical flow from harsh to warm?
3. **Check composition** - Good framing for camera movement?
4. **Check emotion arc** - Expressions match the story?

```typescript
// Create a contact sheet for review
async function createContactSheet() {
  console.log('\n📋 KEYFRAME REVIEW');
  console.log('==================');

  for (const scene of scenes) {
    console.log(`\nScene ${scene.id}: ${scene.name}`);
    console.log(`  Start: keyframes/scene${scene.id}-${scene.name}-start.png`);
    console.log(`  End:   keyframes/scene${scene.id}-${scene.name}-end.png`);
    console.log(`  Emotion: ${scene.emotion}`);
    console.log(`  Camera: ${scene.camera}`);
  }

  console.log('\n⚠️  Review all keyframes before generating videos!');
  console.log('    - Do all frames show the same character?');
  console.log('    - Is the lighting progression logical?');
  console.log('    - Are emotions clearly differentiated?');
}
```

### Phase 5: Generate Videos

```typescript
import { veo31 } from '../index';

async function generateVideos() {
  for (const scene of scenes) {
    console.log(`\nGenerating video for Scene ${scene.id}: ${scene.name}`);

    // Read the start frame as reference
    const startFrame = fs.readFileSync(
      path.join(outputDir, `scene${scene.id}-${scene.name}-start.png`)
    );

    // Build video prompt
    const videoPrompt = buildVideoPrompt(scene);

    // Generate video using keyframe as reference
    const result = await veo31(videoPrompt, {
      referenceImage: startFrame,
      referenceImageMimeType: 'image/png',
      aspectRatio: '16:9',
      resolution: '1080p',
      durationSeconds: scene.duration
    });

    if (result.success) {
      const videoPath = path.join(outputDir, `scene${scene.id}-${scene.name}.mp4`);
      fs.writeFileSync(videoPath, result.data.videos[0].data);
      console.log(`  ✓ Video: ${videoPath}`);
      console.log(`  Duration: ${scene.duration}s`);
      console.log(`  Cost: $${result.data.cost.totalCost}`);
    }
  }
}

function buildVideoPrompt(scene) {
  const prompts = {
    struggle: `
      Cinematic shot of ${characterBlock} ${environmentBlock}.
      Starting calm, then increasingly frustrated as more errors appear on screen.
      Red error messages reflecting in his eyes.
      ${scene.camera}.
      Harsh blue monitor lighting creating dramatic shadows.
      Cinematic quality, emotional performance, 4K.
    `,
    discovery: `
      Cinematic shot of ${characterBlock} ${environmentBlock}.
      Expression transforms from tired to curious as AI interface appears.
      Soft cyan glow begins illuminating his face.
      ${scene.camera}.
      Hopeful atmosphere emerging, warm light through window.
      Cinematic quality, subtle emotional shift, 4K.
    `,
    // ... etc for each scene
  };

  return prompts[scene.name].trim();
}
```

---

## File Structure

After running the complete workflow:

```
keyframes/
├── scene1-struggle-start.png
├── scene1-struggle-end.png
├── scene1-struggle.mp4
├── scene2-discovery-start.png
├── scene2-discovery-end.png
├── scene2-discovery.mp4
├── scene3-first-win-start.png
├── scene3-first-win-end.png
├── scene3-first-win.mp4
├── scene4-flow-state-start.png
├── scene4-flow-state-end.png
├── scene4-flow-state.mp4
├── scene5-triumph-start.png
├── scene5-triumph-end.png
└── scene5-triumph.mp4
```

---

## Cost Breakdown

| Phase | Item | Count | Unit Cost | Total |
|-------|------|-------|-----------|-------|
| Keyframes | 1K images | 10 | $0.067 | $0.67 |
| Videos | Veo 3.1 (8s) | 5 | $3.20 | $16.00 |
| **Total** | | | | **$16.67** |

*Review keyframes before generating videos to avoid wasted video costs*

---

## Complete Workflow Script

```typescript
// workflow-keyframe-video.ts
import 'dotenv/config';
import { gemini31FlashImage, veo31, formatCost } from '../index';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './output/cinematic';

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('═'.repeat(60));
  console.log('KEYFRAME-TO-VIDEO WORKFLOW');
  console.log('═'.repeat(60));

  // Phase 1: Generate keyframes
  console.log('\n📸 PHASE 1: Generating Keyframes...\n');
  await generateKeyframes();

  // Phase 2: Review prompt
  console.log('\n👁️  PHASE 2: Review Keyframes\n');
  console.log('Check the keyframes folder and verify consistency.');
  console.log('Press Enter to continue to video generation...');
  // In production: await userConfirmation();

  // Phase 3: Generate videos
  console.log('\n🎬 PHASE 3: Generating Videos...\n');
  await generateVideos();

  // Phase 4: Summary
  console.log('\n✅ WORKFLOW COMPLETE\n');
  listOutputFiles();
}

main().catch(console.error);
```

---

## Tips

1. **Generate extra keyframes** - Make 2-3 variants of each, pick the best
2. **Match start/end frames** - End of scene N should flow into start of scene N+1
3. **Test with one scene first** - Verify consistency before generating all
4. **Keep prompts in sync** - Update both keyframe and video prompts together
5. **Save your prompts** - Store them alongside outputs for iteration
