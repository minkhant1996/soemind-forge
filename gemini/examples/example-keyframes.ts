import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { gemini31FlashImage } from '../index';

// =============================================================================
// EXAMPLE: KEYFRAME GENERATION FOR VIDEO AD
// =============================================================================
// Platform: Facebook Reel (9:16)
// Duration: 20 seconds (4 clips × 5s)
// =============================================================================

const OUTPUT_DIR = path.join(__dirname, '../output/example-ad/keyframes');

// CHARACTER BLOCK - Locked for consistency
const CHARACTER_BLOCK = `
Young Asian female student, early 20s, shoulder-length black hair,
wearing a light blue cozy sweater over white t-shirt,
natural makeup, warm friendly expression, relatable appearance.
`;

// ENVIRONMENT BLOCK - Locked for consistency
const ENVIRONMENT_BLOCK = `
Cozy bedroom study corner with warm lighting,
clean white IKEA-style desk, silver MacBook laptop,
small green potted plant, soft natural light from window,
minimal and tidy space with books and notebook visible.
`;

// STYLE BLOCK - Consistent visual style
const STYLE_BLOCK = `
Photorealistic, warm color tones, soft natural lighting,
9:16 vertical composition for mobile, cinematic depth of field,
Instagram/TikTok aesthetic, authentic and relatable mood.
`;

// Scene definitions with prompts
const scenes = [
  {
    id: 1,
    name: 'struggle',
    continues_from: null,
    frames: ['start', 'end'] as const,
    prompts: {
      start: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student is sitting at desk looking at laptop screen showing disappointing results.
Her expression shows disappointment and frustration, shoulders slightly slumped.
${STYLE_BLOCK}`,
      end: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student is sitting at desk with a stressed expression, hand on forehead,
looking overwhelmed by the laptop screen, showing signs of worry.
${STYLE_BLOCK}`
    }
  },
  {
    id: 2,
    name: 'discovery',
    continues_from: 1,
    frames: ['end'] as const,
    prompts: {
      end: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student's expression changes to curiosity and hope,
she leans forward slightly looking at phone in her hand,
a gentle smile forming as she discovers something interesting.
${STYLE_BLOCK}`
    }
  },
  {
    id: 3,
    name: 'progress',
    continues_from: 2,
    frames: ['end'] as const,
    prompts: {
      end: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student is actively practicing on laptop, looking confident and focused,
sitting upright with determined expression, notebook open beside her,
showing engagement and progress in her studies.
${STYLE_BLOCK}`
    }
  },
  {
    id: 4,
    name: 'success',
    continues_from: 3,
    frames: ['end'] as const,
    prompts: {
      end: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student is celebrating with joy, big genuine smile,
hands raised slightly in celebration gesture,
laptop screen visible showing success results,
warm triumphant feeling, eyes bright with happiness.
${STYLE_BLOCK}`
    }
  }
];

async function generateKeyframes() {
  console.log('='.repeat(60));
  console.log('EXAMPLE: KEYFRAME GENERATION');
  console.log('='.repeat(60));
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Total keyframes to generate: 5`);
  console.log(`Estimated cost: ~$0.34 (5 × $0.067)`);
  console.log('='.repeat(60));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let prevEndFrame: string | null = null;
  let totalCost = 0;
  let generated = 0;

  for (const scene of scenes) {
    console.log(`\n📍 Scene ${scene.id}: ${scene.name.toUpperCase()}`);

    for (const frameType of scene.frames) {
      const filename = `scene${scene.id}-${scene.name}-${frameType}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Check if continues from previous scene
      if (frameType === 'start' && scene.continues_from !== null && prevEndFrame) {
        console.log(`   ⏩ Reusing previous end frame as start (scene continuity)`);
        fs.copyFileSync(prevEndFrame, filepath);
        console.log(`   ✓ Copied: ${filename}`);
        continue;
      }

      const promptText = (scene.prompts as Record<string, string>)[frameType];
      if (!promptText) continue;

      console.log(`   🎨 Generating ${frameType} frame...`);

      try {
        const result = await gemini31FlashImage({
          userPrompt: promptText,
          config: {
            aspectRatio: '9:16',
            numberOfImages: 1,
          }
        });

        if (result.success && result.data.images && result.data.images.length > 0) {
          const imageData = result.data.images[0].data;
          fs.writeFileSync(filepath, imageData);
          console.log(`   ✓ Saved: ${filename}`);

          // Track end frames for continuity
          if (frameType === 'end') {
            prevEndFrame = filepath;
          }

          generated++;
          totalCost += 0.067;

          // Rate limiting - wait between API calls
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error(`   ✗ Failed to generate ${filename}`);
          if (!result.success) {
            console.error(`     Error: ${JSON.stringify(result.error, null, 2)}`);
          } else {
            console.error(`     No images in response`);
          }
        }
      } catch (error) {
        console.error(`   ✗ Error generating ${filename}:`, error);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('KEYFRAME GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Generated: ${generated} images`);
  console.log(`Estimated cost: $${totalCost.toFixed(2)}`);
  console.log(`\nKeyframes saved to: ${OUTPUT_DIR}`);
  console.log('\n⚠️  REVIEW THESE KEYFRAMES before proceeding to video generation!');
  console.log('='.repeat(60));
}

// Run
generateKeyframes().catch(console.error);
