/**
 * Test All Workflows  (LEGACY)
 * ============================
 * Run from project root: node test-all-workflows.js
 *
 * DEPRECATED: the maintained suite is `workflows/test-workflows.ts`
 * (run: `cd workflows && npx ts-node --esm test-workflows.ts`). That file covers
 * validation + the audio/music/assembly workflows + the asset-registry round trip.
 * This script is kept only for quick smoke checks of the original workflows.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Load .env BEFORE importing workflow modules
dotenv.config();

// Dynamic import to ensure env vars are loaded first
const {
  generateText,
  analyzeImage,
  generateSingleImage,
  generateImageVariation,
  generateCarousel,
  generateCarouselFromRef,
  generateSilentVideo,
  generateSpeakingVideo,
  generateVideoFromImage,
  generateSpeakingVideoFromImage,
  generateVideoWithVoiceover,
  generateVideoFromImageWithVoiceover,
  WorkflowErrorCodes,
} = await import('./workflows/dist/index.js');

const TEST_OUTPUT_DIR = path.join(__dirname, 'test-output');

// Ensure output directory
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Results tracking
const results = [];

function record(name, passed, message, cost, duration) {
  results.push({ name, passed, message, cost, duration });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (cost !== undefined) console.log(`   Cost: $${cost.toFixed(4)}`);
  if (duration !== undefined) console.log(`   Duration: ${duration}ms`);
}

// ============================================================================
// VALIDATION TESTS (No API calls needed for failures)
// ============================================================================

async function testValidation() {
  console.log('\n=== VALIDATION TESTS ===\n');

  // Test 1: generateText - empty prompt
  let r = await generateText({ prompt: '' });
  record('generateText validation', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject empty prompt' : 'Correctly rejects empty prompt');

  // Test 2: generateSingleImage - empty prompt
  r = await generateSingleImage({ prompt: '', outputPath: path.join(TEST_OUTPUT_DIR, 'x.png') });
  record('generateSingleImage validation', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject empty prompt' : 'Correctly rejects empty prompt');

  // Test 3: generateImageVariation - missing file
  r = await generateImageVariation({
    referenceImagePath: '/nonexistent.png',
    prompt: 'test',
    outputPath: path.join(TEST_OUTPUT_DIR, 'x.png')
  });
  record('generateImageVariation validation', !r.success && r.error?.code === WorkflowErrorCodes.FILE_NOT_FOUND,
    r.success ? 'Should reject missing file' : 'Correctly rejects missing file');

  // Test 4: generateCarousel - empty topic
  r = await generateCarousel({
    projectName: 'test',
    topic: '',
    slideCount: 3,
    style: 'educational',
    platform: 'instagram',
    outputDir: path.join(TEST_OUTPUT_DIR, 'carousel')
  });
  record('generateCarousel validation', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject empty topic' : 'Correctly rejects empty topic');

  // Test 5: generateSilentVideo - empty prompt
  r = await generateSilentVideo({
    prompt: '',
    outputPath: path.join(TEST_OUTPUT_DIR, 'v.mp4'),
    duration: 5
  });
  record('generateSilentVideo validation', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject empty prompt' : 'Correctly rejects empty prompt');

  // Test 6: generateSpeakingVideo - empty character
  r = await generateSpeakingVideo({
    characterDescription: '',
    environment: 'Office',
    dialogue: 'Hello',
    voiceDescription: 'Warm',
    outputPath: path.join(TEST_OUTPUT_DIR, 'sv.mp4'),
    duration: 5
  });
  record('generateSpeakingVideo validation', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject empty character' : 'Correctly rejects empty character');

  // Test 7: generateVideoFromImage - missing file
  r = await generateVideoFromImage({
    referenceImagePath: '/nonexistent.png',
    prompt: 'test',
    outputPath: path.join(TEST_OUTPUT_DIR, 'vi.mp4'),
    duration: 5
  });
  record('generateVideoFromImage validation', !r.success && r.error?.code === WorkflowErrorCodes.FILE_NOT_FOUND,
    r.success ? 'Should reject missing file' : 'Correctly rejects missing file');

  // Test 8: generateVideoWithVoiceover - empty scenes
  r = await generateVideoWithVoiceover({
    scenes: [],
    voiceoverScript: 'Test',
    voiceName: 'Kore',
    outputDir: path.join(TEST_OUTPUT_DIR, 'vo')
  });
  record('generateVideoWithVoiceover validation', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject empty scenes' : 'Correctly rejects empty scenes');

  // Test 9: Duration validation
  r = await generateSilentVideo({
    prompt: 'test',
    outputPath: path.join(TEST_OUTPUT_DIR, 'dur.mp4'),
    duration: 100
  });
  record('Duration validation (>60s)', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject >60s duration' : 'Correctly rejects invalid duration');

  // Test 10: Slide count validation
  r = await generateCarousel({
    projectName: 'test',
    topic: 'test',
    slideCount: 25,
    style: 'educational',
    platform: 'instagram',
    outputDir: path.join(TEST_OUTPUT_DIR, 'carousel2')
  });
  record('Slide count validation (>20)', !r.success && r.error?.code === WorkflowErrorCodes.INVALID_INPUT,
    r.success ? 'Should reject >20 slides' : 'Correctly rejects invalid slide count');
}

// ============================================================================
// ACTUAL GENERATION TESTS (Cost money)
// ============================================================================

async function testGeneration() {
  console.log('\n=== GENERATION TESTS (API calls) ===\n');

  // Test: generateText
  let start = Date.now();
  let r = await generateText({
    prompt: 'Write a one-sentence hook for a smartwatch ad.',
    systemPrompt: 'You are a copywriter. Be very concise.',
  });
  record('generateText actual', r.success,
    r.success ? `"${r.data.text.substring(0, 60)}..."` : r.error?.message,
    r.success ? r.data.cost.totalCost : undefined,
    Date.now() - start);

  // Test: generateSingleImage
  const imgPath = path.join(TEST_OUTPUT_DIR, 'test-image.png');
  start = Date.now();
  r = await generateSingleImage({
    prompt: 'Minimalist smartwatch on white background, soft studio lighting, product photography',
    outputPath: imgPath,
    aspectRatio: '1:1',
    imageSize: '1K',
  });
  const imgExists = fs.existsSync(imgPath);
  record('generateSingleImage actual', r.success && imgExists,
    r.success && imgExists ? `Generated (${Math.round(fs.statSync(imgPath).size / 1024)}KB)` : r.error?.message,
    r.success ? r.data.cost.totalCost : undefined,
    Date.now() - start);
}

// ============================================================================
// VIDEO TESTS (Expensive - optional)
// ============================================================================

async function testVideoGeneration() {
  console.log('\n=== VIDEO TESTS (Expensive) ===\n');

  const videoPath = path.join(TEST_OUTPUT_DIR, 'test-video.mp4');
  const start = Date.now();

  const r = await generateSilentVideo({
    prompt: 'Cinematic close-up of smartwatch on wrist, soft focus background, slow camera movement',
    outputPath: videoPath,
    duration: 6,  // Veo Lite supports 4-8 seconds
    aspectRatio: '9:16',
    quality: 'lite',
  });

  const exists = fs.existsSync(videoPath);
  record('generateSilentVideo actual', r.success && exists,
    r.success && exists ? `Generated (${Math.round(fs.statSync(videoPath).size / 1024)}KB)` : r.error?.message,
    r.success ? r.data.cost.totalCost : undefined,
    Date.now() - start);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('WORKFLOW TESTS');
  console.log('='.repeat(60));
  console.log(`Output directory: ${TEST_OUTPUT_DIR}`);
  console.log(`API Key: ${process.env.GEMINI_API_KEY ? 'Found' : 'MISSING!'}`);

  const runFull = process.argv.includes('--full');
  const runVideo = process.argv.includes('--video');

  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEYS) {
    console.error('\n❌ No API key found. Set GEMINI_API_KEY in .env');
    process.exit(1);
  }

  // Validation tests (free)
  await testValidation();

  // Generation tests (costs money)
  await testGeneration();

  // Video tests (expensive - optional)
  if (runFull || runVideo) {
    await testVideoGeneration();
  } else {
    console.log('\n⏭️  Skipping video tests (use --full or --video to run)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);

  if (failed > 0) {
    console.log('\nFailed:');
    results.filter(r => !r.passed).forEach(r => console.log(`  - ${r.name}: ${r.message}`));
  }

  console.log(`\n📁 Outputs: ${TEST_OUTPUT_DIR}`);
}

main().catch(console.error);
