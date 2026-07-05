import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { generateVideo } from '../index';

// =============================================================================
// Example FB REEL AD - WITH CHARACTER SPEAKING
// =============================================================================

const KEYFRAMES_DIR = path.join(__dirname, '../output/example-fb-reel-ad/20260622-211329/keyframes');
const VIDEOS_DIR = path.join(__dirname, '../output/example-fb-reel-ad/20260622-211329/videos-speech');

// CHARACTER + VOICE
const CHARACTER_BLOCK = `
Young Asian female student, early 20s, shoulder-length black hair,
wearing a light blue cozy sweater over white t-shirt,
natural makeup, warm friendly expression.
`;

const VOICE_BLOCK = `
Speaking in a warm, relatable female voice, early 20s,
conversational and authentic tone, natural accent,
expressive delivery with genuine emotion.
`;

const ENVIRONMENT_BLOCK = `
Cozy bedroom study corner with warm lighting,
clean white desk, silver MacBook laptop,
small green potted plant, soft natural light from window.
`;

const STYLE_BLOCK = `
Photorealistic, warm color tones, 9:16 vertical,
cinematic quality, natural lip movements when speaking.
`;

// Scenes with dialogue
const scenes = [
  {
    id: 1,
    name: 'struggle',
    duration: 6,
    startFrame: 'scene1-struggle-start.png',
    dialogue: "disappointing results... again. I've been studying for months.",
    emotion: "frustrated, disappointed",
    action: "Looking at laptop showing score, sighs, slumps shoulders",
  },
  {
    id: 2,
    name: 'discovery',
    duration: 6,
    startFrame: 'scene1-struggle-end.png',
    dialogue: "Wait... what's this? MyProduct?",
    emotion: "curious, intrigued, hopeful",
    action: "Picks up phone, eyebrows raise, leans forward with interest",
  },
  {
    id: 3,
    name: 'progress',
    duration: 6,
    startFrame: 'scene2-discovery-end.png',
    dialogue: "Okay, this actually makes sense now!",
    emotion: "confident, engaged, determined",
    action: "Typing on laptop, nodding, taking notes with a smile",
  },
  {
    id: 4,
    name: 'success',
    duration: 6,
    startFrame: 'scene3-progress-end.png',
    dialogue: "success results! I did it! Start your free trial today!",
    emotion: "overjoyed, triumphant, excited",
    action: "Sees score on screen, gasps, raises fists in celebration, looks at camera for CTA",
  },
];

async function generateVideosWithSpeech() {
  console.log('='.repeat(60));
  console.log('Example AD - WITH CHARACTER SPEAKING');
  console.log('='.repeat(60));
  console.log('Model: Veo 3.1 Lite (with speech)');
  console.log('Clips: 4 × 6s = 24 seconds');
  console.log('='.repeat(60));

  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  let generated = 0;

  for (const scene of scenes) {
    console.log(`\n🎬 Scene ${scene.id}: ${scene.name.toUpperCase()}`);
    console.log(`   💬 "${scene.dialogue}"`);

    const filename = `scene${scene.id}-${scene.name}.mp4`;
    const filepath = path.join(VIDEOS_DIR, filename);

    // Load reference keyframe
    const refPath = path.join(KEYFRAMES_DIR, scene.startFrame);
    const referenceImage = fs.existsSync(refPath) ? fs.readFileSync(refPath) : undefined;

    // Build prompt with dialogue + voice
    const prompt = `
${CHARACTER_BLOCK}
${ENVIRONMENT_BLOCK}

The character ${scene.action}.
Expression: ${scene.emotion}.

She says: "${scene.dialogue}"
${VOICE_BLOCK}

Natural lip sync, authentic emotion, expressive delivery.
${STYLE_BLOCK}
`;

    console.log(`   🎥 Generating with speech...`);

    try {
      const result = await generateVideo({
        model: 'veo-3.1-lite-generate-preview',
        prompt,
        referenceImage,
        referenceImageMimeType: 'image/png',
        config: {
          aspectRatio: '9:16',
          resolution: '720p',
          durationSeconds: scene.duration,
          numberOfVideos: 1,
        },
      });

      if (result.success && result.data.videos?.[0]) {
        fs.writeFileSync(filepath, result.data.videos[0].data);
        console.log(`   ✓ Saved: ${filename}`);
        generated++;
      } else {
        console.error(`   ✗ Failed:`, JSON.stringify(result.error, null, 2));
      }
    } catch (error) {
      console.error(`   ✗ Error:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Generated: ${generated}/4 clips`);
  console.log(`Output: ${VIDEOS_DIR}`);
  console.log('='.repeat(60));

  // Concatenate if all generated
  if (generated === 4) {
    console.log('\n📦 Concatenating clips...');
    const concatList = scenes.map(s => `file '${path.join(VIDEOS_DIR, `scene${s.id}-${s.name}.mp4`)}'`).join('\n');
    fs.writeFileSync(path.join(VIDEOS_DIR, 'concat.txt'), concatList);
    console.log('Run: ffmpeg -f concat -safe 0 -i concat.txt -c copy final.mp4');
  }
}

generateVideosWithSpeech().catch(console.error);
