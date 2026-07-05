import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { generateVideo } from '../index';

// =============================================================================
// Example FB REEL AD - VIDEO GENERATION
// =============================================================================
// Project: MyProduct Example - "great results in 30 Days"
// Platform: Facebook Reel (9:16)
// Duration: 24 seconds (4 clips × 6s)
// Model: Veo 3.1 (with audio) @ $0.40/second
// =============================================================================

const KEYFRAMES_DIR = path.join(__dirname, '../output/example-fb-reel-ad/20260622-211329/keyframes');
const VIDEOS_DIR = path.join(__dirname, '../output/example-fb-reel-ad/20260622-211329/videos');

// CHARACTER BLOCK - Locked for consistency
const CHARACTER_BLOCK = `
Young Asian female student, early 20s, shoulder-length black hair,
wearing a light blue cozy sweater over white t-shirt,
natural makeup, warm friendly expression.
`;

// ENVIRONMENT BLOCK - Locked for consistency
const ENVIRONMENT_BLOCK = `
Cozy bedroom study corner with warm lighting,
clean white desk, silver MacBook laptop,
small green potted plant, soft natural light from window,
minimal and tidy space with books and notebook visible.
`;

// STYLE BLOCK - Consistent visual style
const STYLE_BLOCK = `
Photorealistic, warm color tones, soft natural lighting,
9:16 vertical composition, cinematic quality,
smooth natural movements, authentic and relatable.
`;

// Scene definitions
const scenes = [
  {
    id: 1,
    name: 'struggle',
    duration: 6,
    startFrame: 'scene1-struggle-start.png',
    endFrame: 'scene1-struggle-end.png',
    prompt: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student is sitting at her desk, looking at her laptop screen showing a disappointing test score.
Her expression changes from hope to disappointment, she sighs and brings her hand to her forehead in frustration.
Subtle movements - slight shoulder slump, eyes scanning the screen with worry.
${STYLE_BLOCK}
Mood: Relatable struggle, sympathetic, not dramatic.`,
  },
  {
    id: 2,
    name: 'discovery',
    duration: 6,
    startFrame: 'scene1-struggle-end.png', // Continues from previous
    endFrame: 'scene2-discovery-end.png',
    prompt: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student notices her phone beside her laptop. She picks it up and sees something interesting.
Her expression gradually changes from stressed to curious, then to hopeful as she reads about a study app.
A gentle smile forms on her face as she discovers a solution.
${STYLE_BLOCK}
Mood: Moment of hope, discovery, turning point.`,
  },
  {
    id: 3,
    name: 'progress',
    duration: 6,
    startFrame: 'scene2-discovery-end.png', // Continues from previous
    endFrame: 'scene3-progress-end.png',
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
    startFrame: 'scene3-progress-end.png', // Continues from previous
    endFrame: 'scene4-success-end.png',
    prompt: `${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}
The student looks at her laptop screen showing a high test score (success results).
Her eyes widen with joy, she breaks into a big genuine smile.
She raises her fists in a victory celebration, pure happiness and relief on her face.
${STYLE_BLOCK}
Mood: Triumph, celebration, achievement, joy.`,
  },
];

async function generateVideos() {
  console.log('='.repeat(60));
  console.log('Example FB REEL AD - VIDEO GENERATION');
  console.log('='.repeat(60));
  console.log(`Keyframes: ${KEYFRAMES_DIR}`);
  console.log(`Output: ${VIDEOS_DIR}`);
  console.log(`Total clips: 4`);
  console.log(`Duration: 4 × 6s = 24 seconds`);
  console.log(`Model: Veo 3.1 (with audio)`);
  console.log(`Estimated cost: $9.60 (24s × $0.40)`);
  console.log('='.repeat(60));

  // Ensure output directory exists
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  let totalCost = 0;
  let generated = 0;

  for (const scene of scenes) {
    console.log(`\n🎬 Scene ${scene.id}: ${scene.name.toUpperCase()}`);
    console.log(`   Duration: ${scene.duration}s`);
    console.log(`   Reference: ${scene.startFrame}`);

    const filename = `scene${scene.id}-${scene.name}.mp4`;
    const filepath = path.join(VIDEOS_DIR, filename);

    // Read reference image (start frame)
    const referenceImagePath = path.join(KEYFRAMES_DIR, scene.startFrame);
    let referenceImage: Buffer | undefined;

    if (fs.existsSync(referenceImagePath)) {
      referenceImage = fs.readFileSync(referenceImagePath);
      console.log(`   ✓ Loaded reference image`);
    } else {
      console.log(`   ⚠ Reference image not found, generating without reference`);
    }

    console.log(`   🎥 Generating video...`);

    try {
      const result = await generateVideo({
        model: 'veo-3.1-generate-preview',
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
        const videoData = result.data.videos[0].data;
        fs.writeFileSync(filepath, videoData);
        console.log(`   ✓ Saved: ${filename}`);
        console.log(`   💰 Cost: $${(scene.duration * 0.40).toFixed(2)}`);

        generated++;
        totalCost += scene.duration * 0.40;
      } else {
        console.error(`   ✗ Failed to generate ${filename}`);
        if (!result.success) {
          console.error(`     Error: ${JSON.stringify(result.error, null, 2)}`);
        }
      }
    } catch (error) {
      console.error(`   ✗ Error generating ${filename}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('VIDEO GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Generated: ${generated}/4 clips`);
  console.log(`Total cost: $${totalCost.toFixed(2)}`);
  console.log(`\nVideos saved to: ${VIDEOS_DIR}`);
  console.log('='.repeat(60));
}

// Run
generateVideos().catch(console.error);
