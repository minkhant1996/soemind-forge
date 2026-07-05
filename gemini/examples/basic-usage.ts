/**
 * Basic Usage Examples
 * ====================
 *
 * This file shows simple examples of each Gemini tool.
 * Run with: npx ts-node examples/basic-usage.ts
 */

// Load environment variables from .env file
import 'dotenv/config';

import {
  gemini25Flash,
  gemini31FlashImage,
  veo31Lite,
  textToSpeech,
  generateMusic,
} from '../index';
import fs from 'fs';
import path from 'path';

// Create output directory
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function main() {
  console.log('Gemini AI Tools - Basic Usage Examples\n');

  // =========================================================================
  // 1. TEXT GENERATION
  // =========================================================================
  console.log('1. Text Generation...');

  const textResult = await gemini25Flash({
    userPrompt: 'Write a haiku about programming',
  });

  if (textResult.success) {
    console.log('   Response:', textResult.data.text);
    console.log(`   Cost: $${textResult.data.cost.totalCost.toFixed(6)}`);
    console.log(`   Tokens: ${textResult.data.usage.totalTokens}\n`);
  } else {
    console.log('   Error:', textResult.error.message, '\n');
  }

  // =========================================================================
  // 2. TEXT WITH SYSTEM PROMPT
  // =========================================================================
  console.log('2. Text with System Prompt...');

  const codeResult = await gemini25Flash({
    systemPrompt: 'You are a TypeScript expert. Be concise.',
    userPrompt: 'Write a function to reverse a string',
  });

  if (codeResult.success) {
    console.log('   Response:', codeResult.data.text.slice(0, 200) + '...');
    console.log(`   Cost: $${codeResult.data.cost.totalCost.toFixed(6)}\n`);
  }

  // =========================================================================
  // 3. IMAGE GENERATION
  // =========================================================================
  console.log('3. Image Generation...');

  const imageResult = await gemini31FlashImage({
    userPrompt: 'A cute robot reading a book, digital art style',
    config: { imageSize: '1K' },
  });

  if (imageResult.success && imageResult.data.images.length > 0) {
    const imagePath = path.join(outputDir, 'robot.png');
    fs.writeFileSync(imagePath, imageResult.data.images[0].data);
    console.log(`   Saved to: ${imagePath}`);
    console.log(`   Cost: $${imageResult.data.cost.totalCost.toFixed(4)}\n`);
  } else {
    console.log('   Image generation skipped or failed\n');
  }

  // =========================================================================
  // 4. TEXT-TO-SPEECH
  // =========================================================================
  console.log('4. Text-to-Speech...');

  const ttsResult = await textToSpeech(
    'Hello! Welcome to Gemini AI Tools.',
    'Zephyr',
    { style: 'vocal_smile', pace: 'natural' }
  );

  if (ttsResult.success) {
    const audioPath = path.join(outputDir, 'greeting.wav');
    fs.writeFileSync(audioPath, ttsResult.data.audio.data);
    console.log(`   Saved to: ${audioPath}`);
    console.log(`   Cost: $${ttsResult.data.cost.totalCost.toFixed(6)}\n`);
  } else {
    console.log('   TTS skipped or failed\n');
  }

  // =========================================================================
  // 5. VIDEO GENERATION (commented - takes time)
  // =========================================================================
  console.log('5. Video Generation (skipped - uncomment to run)');
  /*
  const videoResult = await veo31Lite('A sunrise over mountains with clouds');
  if (videoResult.success) {
    fs.writeFileSync(path.join(outputDir, 'sunrise.mp4'), videoResult.data.videos[0].data);
    console.log(`   Cost: $${videoResult.data.cost.totalCost.toFixed(4)}`);
  }
  */
  console.log('');

  // =========================================================================
  // 6. MUSIC GENERATION (commented - takes time)
  // =========================================================================
  console.log('6. Music Generation (skipped - uncomment to run)');
  /*
  const musicResult = await generateMusic({
    model: 'lyria-3',
    prompt: 'Calm ambient music for relaxation',
  });
  if (musicResult.success) {
    fs.writeFileSync(path.join(outputDir, 'ambient.wav'), musicResult.data.music.data);
    console.log(`   Cost: $${musicResult.data.cost.totalCost.toFixed(4)}`);
  }
  */
  console.log('');

  console.log('Done! Check the output folder for generated files.');
}

main().catch(console.error);
