/**
 * Test All Workflows
 * ==================
 *
 * This script tests the workflow functions with basic functionality.
 * Run with: npx ts-node --esm test-workflows.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Import directly from source for ts-node
import {
  // Text workflows
  generateText,
  analyzeImage,

  // Image workflows
  generateSingleImage,
  generateImageVariation,
  generateCarousel,
  generateCarouselFromRef,

  // Video workflows
  generateSilentVideo,
  generateSpeakingVideo,
  generateVideoFromImage,
  generateSpeakingVideoFromImage,
  generateVideoWithVoiceover,
  generateVideoFromImageWithVoiceover,

  // Audio + music workflows
  generateVoiceover,
  generateMultiSpeakerVoiceover,
  generateMusicTrack,

  // Assembly + captions
  generateCharacterSheet,
  mixVideoAudio,
  generateCaptions,
  assembleFinal,

  // Preview / pick + copywriting
  generateImageOptions,
  finalizeImage,
  generateStoryboard,
  generateHooks,
  generateScript,
  generateCaption,

  // QA
  reviewOutput,

  // Asset registry
  loadAssetConfig,
  resolveAsset,
  registerAsset,
  validateAssets,

  // Cost tracker
  setBudgetCap,
  checkBudget,
  recordCost,
  budgetSummary,

  // Types
  WorkflowErrorCodes,
} from './index.js';

// Test output directory
const TEST_OUTPUT_DIR = path.join(__dirname, 'test-output');

// Ensure output directory exists
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  cost?: number;
  duration?: number;
}

const results: TestResult[] = [];

// Helper to record test result
function recordResult(name: string, passed: boolean, message: string, cost?: number, duration?: number) {
  results.push({ name, passed, message, cost, duration });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (cost !== undefined) {
    console.log(`   Cost: $${cost.toFixed(4)}`);
  }
  if (duration !== undefined) {
    console.log(`   Duration: ${duration}ms`);
  }
}

// ============================================================================
// TEST 1: generateText - Input Validation
// ============================================================================
async function testGenerateTextValidation() {
  console.log('\n--- Test 1: generateText (validation) ---');

  // Test empty prompt
  const result = await generateText({ prompt: '' });

  if (!result.success && result.error?.code === WorkflowErrorCodes.INVALID_INPUT) {
    recordResult('generateText validation', true, 'Correctly rejects empty prompt');
  } else {
    recordResult('generateText validation', false, 'Should reject empty prompt');
  }
}

// ============================================================================
// TEST 2: generateText - Actual Generation
// ============================================================================
async function testGenerateTextActual() {
  console.log('\n--- Test 2: generateText (actual) ---');
  const start = Date.now();

  const result = await generateText({
    prompt: 'Write a one-sentence hook for a smartwatch ad.',
    systemPrompt: 'You are a copywriter. Be concise.',
  });

  const duration = Date.now() - start;

  if (result.success) {
    recordResult('generateText actual', true, `Generated: "${result.data.text.substring(0, 50)}..."`, result.data.cost.totalCost, duration);
  } else {
    recordResult('generateText actual', false, result.error?.message || 'Failed');
  }
}

// ============================================================================
// TEST 3: generateSingleImage - Validation
// ============================================================================
async function testGenerateSingleImageValidation() {
  console.log('\n--- Test 3: generateSingleImage (validation) ---');

  // Test missing prompt
  const result = await generateSingleImage({
    prompt: '',
    outputPath: path.join(TEST_OUTPUT_DIR, 'test.png'),
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.INVALID_INPUT) {
    recordResult('generateSingleImage validation', true, 'Correctly rejects empty prompt');
  } else {
    recordResult('generateSingleImage validation', false, 'Should reject empty prompt');
  }
}

// ============================================================================
// TEST 4: generateSingleImage - Actual Generation
// ============================================================================
async function testGenerateSingleImageActual() {
  console.log('\n--- Test 4: generateSingleImage (actual) ---');
  const start = Date.now();

  const outputPath = path.join(TEST_OUTPUT_DIR, 'test-image.png');

  const result = await generateSingleImage({
    prompt: 'Minimalist product shot of a smartwatch on white background, soft studio lighting',
    outputPath,
    aspectRatio: '1:1',
    imageSize: '1K',
  });

  const duration = Date.now() - start;

  if (result.success && fs.existsSync(outputPath)) {
    const fileSize = fs.statSync(outputPath).size;
    recordResult('generateSingleImage actual', true, `Generated image (${Math.round(fileSize / 1024)}KB)`, result.data.cost.totalCost, duration);
  } else {
    recordResult('generateSingleImage actual', false, result.error?.message || 'Failed');
  }
}

// ============================================================================
// TEST 5: generateImageVariation - Validation (missing file)
// ============================================================================
async function testGenerateImageVariationValidation() {
  console.log('\n--- Test 5: generateImageVariation (validation) ---');

  const result = await generateImageVariation({
    referenceImagePath: '/nonexistent/image.png',
    prompt: 'Same product in different lighting',
    outputPath: path.join(TEST_OUTPUT_DIR, 'variation.png'),
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.FILE_NOT_FOUND) {
    recordResult('generateImageVariation validation', true, 'Correctly rejects missing file');
  } else {
    recordResult('generateImageVariation validation', false, 'Should reject missing reference file');
  }
}

// ============================================================================
// TEST 6: generateCarousel - Validation
// ============================================================================
async function testGenerateCarouselValidation() {
  console.log('\n--- Test 6: generateCarousel (validation) ---');

  const result = await generateCarousel({
    projectName: 'test',
    topic: '',  // Empty topic
    slideCount: 3,
    style: 'educational',
    platform: 'instagram',
    outputDir: path.join(TEST_OUTPUT_DIR, 'carousel'),
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.INVALID_INPUT) {
    recordResult('generateCarousel validation', true, 'Correctly rejects empty topic');
  } else {
    recordResult('generateCarousel validation', false, 'Should reject empty topic');
  }
}

// ============================================================================
// TEST 7: generateSilentVideo - Validation
// ============================================================================
async function testGenerateSilentVideoValidation() {
  console.log('\n--- Test 7: generateSilentVideo (validation) ---');

  const result = await generateSilentVideo({
    prompt: '',
    outputPath: path.join(TEST_OUTPUT_DIR, 'video.mp4'),
    duration: 5,
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.INVALID_INPUT) {
    recordResult('generateSilentVideo validation', true, 'Correctly rejects empty prompt');
  } else {
    recordResult('generateSilentVideo validation', false, 'Should reject empty prompt');
  }
}

// ============================================================================
// TEST 8: generateSpeakingVideo - Validation
// ============================================================================
async function testGenerateSpeakingVideoValidation() {
  console.log('\n--- Test 8: generateSpeakingVideo (validation) ---');

  const result = await generateSpeakingVideo({
    characterDescription: '',
    environment: 'Office',
    dialogue: 'Hello',
    voiceDescription: 'Warm voice',
    outputPath: path.join(TEST_OUTPUT_DIR, 'speaking.mp4'),
    duration: 5,
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.INVALID_INPUT) {
    recordResult('generateSpeakingVideo validation', true, 'Correctly rejects empty character');
  } else {
    recordResult('generateSpeakingVideo validation', false, 'Should reject empty character description');
  }
}

// ============================================================================
// TEST 9: generateVideoFromImage - Validation
// ============================================================================
async function testGenerateVideoFromImageValidation() {
  console.log('\n--- Test 9: generateVideoFromImage (validation) ---');

  const result = await generateVideoFromImage({
    referenceImagePath: '/nonexistent/image.png',
    prompt: 'Product rotating',
    outputPath: path.join(TEST_OUTPUT_DIR, 'from-image.mp4'),
    duration: 5,
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.FILE_NOT_FOUND) {
    recordResult('generateVideoFromImage validation', true, 'Correctly rejects missing file');
  } else {
    recordResult('generateVideoFromImage validation', false, 'Should reject missing reference file');
  }
}

// ============================================================================
// TEST 10: generateVideoWithVoiceover - Validation
// ============================================================================
async function testGenerateVideoWithVoiceoverValidation() {
  console.log('\n--- Test 10: generateVideoWithVoiceover (validation) ---');

  const result = await generateVideoWithVoiceover({
    scenes: [],  // Empty scenes
    voiceoverScript: 'Test voiceover',
    voiceName: 'Kore',
    outputDir: path.join(TEST_OUTPUT_DIR, 'voiceover'),
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.INVALID_INPUT) {
    recordResult('generateVideoWithVoiceover validation', true, 'Correctly rejects empty scenes');
  } else {
    recordResult('generateVideoWithVoiceover validation', false, 'Should reject empty scenes array');
  }
}

// ============================================================================
// TEST 11: Duration Validation
// ============================================================================
async function testDurationValidation() {
  console.log('\n--- Test 11: Duration validation ---');

  const result = await generateSilentVideo({
    prompt: 'Test video',
    outputPath: path.join(TEST_OUTPUT_DIR, 'duration-test.mp4'),
    duration: 100,  // Invalid: max is 60
  });

  if (!result.success && result.error?.code === WorkflowErrorCodes.INVALID_INPUT) {
    recordResult('Duration validation', true, 'Correctly rejects invalid duration');
  } else {
    recordResult('Duration validation', false, 'Should reject duration > 60');
  }
}

// ============================================================================
// OPTIONAL: Full Generation Tests (Expensive - Skip by default)
// ============================================================================
async function testFullVideoGeneration() {
  console.log('\n--- Test FULL: generateSilentVideo (actual - EXPENSIVE) ---');
  const start = Date.now();

  const outputPath = path.join(TEST_OUTPUT_DIR, 'test-video.mp4');

  const result = await generateSilentVideo({
    prompt: 'Cinematic close-up of smartwatch on wrist, soft focus background, slow camera movement',
    outputPath,
    duration: 5,
    aspectRatio: '9:16',
    quality: 'lite',  // Use lite for cheaper testing
  });

  const duration = Date.now() - start;

  if (result.success && fs.existsSync(outputPath)) {
    const fileSize = fs.statSync(outputPath).size;
    recordResult('generateSilentVideo actual', true, `Generated video (${Math.round(fileSize / 1024)}KB)`, result.data.cost.totalCost, duration);
  } else {
    recordResult('generateSilentVideo actual', false, result.error?.message || 'Failed');
  }
}

// ============================================================================
// NEW: Voiceover / Music / Assembly — validation (free)
// ============================================================================
async function testNewWorkflowValidations() {
  console.log('\n--- New workflow validations ---');

  const cases: Array<[string, boolean]> = [
    ['generateVoiceover empty script',
      (await generateVoiceover({ script: '', outputPath: 'x.wav' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateMultiSpeakerVoiceover <2 speakers',
      (await generateMultiSpeakerVoiceover({ script: 'hi', speakers: [{ speaker: 'A', voiceName: 'Kore' }], outputPath: 'x.wav' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateMusicTrack empty prompt',
      (await generateMusicTrack({ prompt: '', outputPath: 'x.wav' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateMusicTrack over-long standard',
      (await generateMusicTrack({ prompt: 'x', outputPath: 'x.wav', quality: 'standard', durationSeconds: 120 })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateCharacterSheet empty description',
      (await generateCharacterSheet({ description: '', outputDir: 'x' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['mixVideoAudio no audio inputs',
      (await mixVideoAudio({ videoPath: 'v.mp4', outputPath: 'o.mp4' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['assembleFinal no clips',
      (await assembleFinal({ clipPaths: [], outputPath: 'o.mp4' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateCaptions no source',
      (await generateCaptions({ outputPath: 'c.srt' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateImageOptions bad count',
      (await generateImageOptions({ prompt: 'x', count: 1, outputDir: 'd' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['finalizeImage missing chosen',
      (await finalizeImage({ chosenImagePath: '', prompt: 'x', outputPath: 'o.png' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateStoryboard no scenes',
      (await generateStoryboard({ scenes: [], outputDir: 'd' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateHooks empty topic',
      (await generateHooks({ topic: '' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateScript empty brief',
      (await generateScript({ brief: '' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['generateCaption no platform',
      (await generateCaption({ topic: 'x' } as never)).error?.code === WorkflowErrorCodes.INVALID_INPUT],
    ['reviewOutput missing imagePath',
      (await reviewOutput({ imagePath: '' })).error?.code === WorkflowErrorCodes.INVALID_INPUT],
  ];

  for (const [name, ok] of cases) {
    recordResult(name, ok, ok ? 'rejected as expected' : 'did NOT reject');
  }
}

// ============================================================================
// NEW: generateCaptions — actual SRT output (free, local)
// ============================================================================
async function testGenerateCaptionsActual() {
  console.log('\n--- generateCaptions (actual, local) ---');
  const out = path.join(TEST_OUTPUT_DIR, 'captions.srt');
  const r = await generateCaptions({
    script: 'First line here. Second line follows. Third and final line.',
    totalDuration: 9,
    outputPath: out,
  });
  const ok = r.success && r.data!.cueCount === 3 && fs.existsSync(out) && fs.readFileSync(out, 'utf8').includes('-->');
  recordResult('generateCaptions actual', !!ok, ok ? `wrote ${r.data!.cueCount} cues` : 'failed to write valid SRT');
}

// ============================================================================
// NEW: Asset registry — round trip (free, local, no API)
// ============================================================================
async function testAssetRegistry() {
  console.log('\n--- asset registry (round trip, local) ---');

  // Use a throwaway project under the test output dir's relative root
  const proj = '_wf_test';
  const root = path.join('projects', proj);
  const charDir = path.join(root, 'assets', 'characters');
  fs.mkdirSync(charDir, { recursive: true });
  fs.writeFileSync(path.join(charDir, 'c-front.png'), 'PNG');

  const reg1 = registerAsset(proj, 'characters', {
    id: 'c1', label: 'Test', source: 'generated', status: 'ready',
    files: { front: 'assets/characters/c-front.png', profile: 'assets/characters/c-missing.png' },
    linked_voice: 'v-missing',
  }, { date: '2026-06-26' });
  recordResult('registerAsset writes', reg1.success, reg1.success ? 'saved' : 'failed');

  const cfg = loadAssetConfig(proj);
  recordResult('loadAssetConfig reads', cfg.characters.length === 1, `${cfg.characters.length} character(s)`);

  const res = resolveAsset(cfg, 'c1');
  const resolveOk = res.existing.length === 1 && res.missing.length === 1 && res.ok === false;
  recordResult('resolveAsset detects files', resolveOk, `${res.existing.length} present, ${res.missing.length} missing`);

  const val = validateAssets(cfg);
  const hasFileErr = val.issues.some(i => i.severity === 'error' && /not found/.test(i.message));
  const hasVoiceWarn = val.issues.some(i => i.severity === 'warning' && /linked_voice/.test(i.message));
  recordResult('validateAssets flags issues', hasFileErr && hasVoiceWarn && !val.ok, `${val.issues.length} issue(s)`);

  // cleanup
  fs.rmSync(root, { recursive: true, force: true });
}

// ============================================================================
// NEW: Cost tracker — round trip (free, local, no API)
// ============================================================================
async function testCostTracker() {
  console.log('\n--- cost tracker (round trip, local) ---');
  const proj = '_wf_budget_test';

  setBudgetCap(proj, 20);
  const under = checkBudget(proj, 12.40);
  recordResult('checkBudget under cap', under.ok === true && under.remaining === 20, `remaining ${under.remaining}`);

  recordCost(proj, { label: 'video', type: 'video', amount: 12.40 }, { date: '2026-06-26' });
  recordCost(proj, { label: 'thumb', type: 'image', amount: 0.10 }, { date: '2026-06-26' });

  const over = checkBudget(proj, 10);  // 12.50 + 10 > 20
  recordResult('checkBudget over cap', over.ok === false && over.wouldExceed === true, `projected ${over.projected}`);

  const s = budgetSummary(proj);
  const ok = s.spent === 12.5 && s.byType.video === 12.4 && s.entryCount === 2;
  recordResult('budgetSummary totals', ok, `spent ${s.spent}, ${s.entryCount} entries`);

  fs.rmSync(path.join('projects', proj), { recursive: true, force: true });
}

// ============================================================================
// Run All Tests
// ============================================================================
async function runTests() {
  console.log('='.repeat(60));
  console.log('WORKFLOW TESTS');
  console.log('='.repeat(60));
  console.log(`Output directory: ${TEST_OUTPUT_DIR}`);
  console.log(`API Key: ${process.env.GEMINI_API_KEY ? 'Found' : 'MISSING!'}`);

  const runExpensiveTests = process.argv.includes('--full');

  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEYS) {
    console.error('\n❌ ERROR: No API key found. Set GEMINI_API_KEY in .env');
    process.exit(1);
  }

  // Validation tests (free - no API calls for failures)
  await testGenerateTextValidation();
  await testGenerateSingleImageValidation();
  await testGenerateImageVariationValidation();
  await testGenerateCarouselValidation();
  await testGenerateSilentVideoValidation();
  await testGenerateSpeakingVideoValidation();
  await testGenerateVideoFromImageValidation();
  await testGenerateVideoWithVoiceoverValidation();
  await testDurationValidation();
  await testNewWorkflowValidations();

  // Local tests (free - no API): captions + asset registry + cost tracker round trips
  await testGenerateCaptionsActual();
  await testAssetRegistry();
  await testCostTracker();

  // Actual generation tests (costs money)
  await testGenerateTextActual();
  await testGenerateSingleImageActual();

  if (runExpensiveTests) {
    console.log('\n⚠️  Running expensive video tests (use --full flag to include)');
    await testFullVideoGeneration();
  } else {
    console.log('\n⏭️  Skipping expensive video tests (use --full flag to run)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }

  // Cleanup test output
  console.log('\n📁 Test outputs saved to:', TEST_OUTPUT_DIR);
}

runTests().catch(console.error);
