import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { generateVideo } from '../index';

// =============================================================================
// Example FB REEL AD - REMAINING VIDEOS (Scenes 3 & 4)
// Using Veo 3.1 Lite (faster, cheaper)
// =============================================================================

const KEYFRAMES_DIR = path.join(__dirname, '../output/example-fb-reel-ad/20260622-211329/keyframes');
const VIDEOS_DIR = path.join(__dirname, '../output/example-fb-reel-ad/20260622-211329/videos');

const CHARACTER_BLOCK = `
Young Asian female student, early 20s, shoulder-length black hair,
wearing a light blue cozy sweater over white t-shirt,
natural makeup, warm friendly expression.
`;

const ENVIRONMENT_BLOCK = `
Cozy bedroom study corner with warm lighting,
clean white desk, silver MacBook laptop,
small green potted plant, soft natural light from window,
minimal and tidy space with books and notebook visible.
`;

const STYLE_BLOCK = `
Photorealistic, warm color tones, soft natural lighting,
9:16 vertical composition, cinematic quality,
smooth natural movements, authentic and relatable.
`;

// Only scenes 3 and 4
const scenes = [
  {
    id: 3,
    name: 'progress',
    duration: 6,
    startFrame: 'scene2-discovery-end.png',
    prompt: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student is now actively engaged in studying on her laptop.
She sits up straight with confidence, typing and taking notes in her notebook.
Her expression shows focus and determination, occasionally nodding as she learns.
${STYLE_BLOCK}
Mood: Productive, engaged, making progress, confident.`,
  },
  {
    id: 4,
    name: 'success',
    duration: 6,
    startFrame: 'scene3-progress-end.png',
    prompt: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student looks at her laptop screen showing a high test score (success results).
Her eyes widen with joy, she breaks into a big genuine smile.
She raises her fists in a victory celebration, pure happiness and relief on her face.
${STYLE_BLOCK}
Mood: Triumph, celebration, achievement, joy.`,
  },
];

async function generateRemainingVideos() {
  console.log('='.repeat(60));
  console.log('Example AD - REMAINING VIDEOS (Veo 3.1 Lite)');
  console.log('='.repeat(60));
  console.log(`Model: Veo 3.1 Lite (faster, $0.05/sec)`);
  console.log(`Remaining: 2 clips × 6s = 12 seconds`);
  console.log(`Estimated cost: $0.60`);
  console.log('='.repeat(60));

  let totalCost = 0;
  let generated = 0;

  for (const scene of scenes) {
    console.log(`\n🎬 Scene ${scene.id}: ${scene.name.toUpperCase()}`);

    const filename = `scene${scene.id}-${scene.name}.mp4`;
    const filepath = path.join(VIDEOS_DIR, filename);

    // Read reference image
    const referenceImagePath = path.join(KEYFRAMES_DIR, scene.startFrame);
    let referenceImage: Buffer | undefined;

    if (fs.existsSync(referenceImagePath)) {
      referenceImage = fs.readFileSync(referenceImagePath);
      console.log(`   ✓ Reference: ${scene.startFrame}`);
    }

    console.log(`   🎥 Generating...`);

    try {
      const result = await generateVideo({
        model: 'veo-3.1-lite-generate-preview',
        prompt: scene.prompt,
        referenceImage,
        referenceImageMimeType: 'image/png',
        config: {
          aspectRatio: '9:16',
          resolution: '720p',
          durationSeconds: scene.duration,
          numberOfVideos: 1,
        },
      });

      if (result.success && result.data.videos && result.data.videos.length > 0) {
        fs.writeFileSync(filepath, result.data.videos[0].data);
        console.log(`   ✓ Saved: ${filename}`);
        generated++;
        totalCost += scene.duration * 0.05;
      } else {
        console.error(`   ✗ Failed: ${JSON.stringify(result.error, null, 2)}`);
      }
    } catch (error) {
      console.error(`   ✗ Error:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Generated: ${generated}/2 clips | Cost: $${totalCost.toFixed(2)}`);
  console.log('='.repeat(60));
}

generateRemainingVideos().catch(console.error);
