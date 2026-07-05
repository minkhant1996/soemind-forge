import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { textToSpeech } from '../index';

// =============================================================================
// Example AD - VOICEOVER GENERATION
// =============================================================================

const OUTPUT_DIR = path.join(__dirname, '../output/example-fb-reel-ad/20260622-211329/audio');

// Voiceover script - timed to match 24 second video
// Scene 1 (0-6s): Struggle
// Scene 2 (6-12s): Discovery
// Scene 3 (12-18s): Progress
// Scene 4 (18-24s): Success + CTA

const script = `
Stuck at disappointing results? You're not alone.

But what if you could reach Band 7 in just 30 days?

With MyProduct, thousands of students have done exactly that.

Start your free trial today. Band 7 plus is waiting.
`;

async function generateVoiceover() {
  console.log('='.repeat(60));
  console.log('Example AD - VOICEOVER GENERATION');
  console.log('='.repeat(60));
  console.log('Script:');
  console.log(script);
  console.log('='.repeat(60));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎙️ Generating voiceover...');

  try {
    // Use a warm, encouraging female voice
    const result = await textToSpeech(script.trim(), 'Kore', {
      speakingRate: 0.95, // Slightly slower for clarity
    });

    if (result.success && result.data.audio) {
      const filepath = path.join(OUTPUT_DIR, 'voiceover.wav');
      fs.writeFileSync(filepath, result.data.audio.data);
      console.log(`✓ Saved: ${filepath}`);
      console.log(`\nNow run ffmpeg to combine with video.`);
    } else {
      console.error('Failed:', JSON.stringify(result.error, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

generateVoiceover().catch(console.error);
