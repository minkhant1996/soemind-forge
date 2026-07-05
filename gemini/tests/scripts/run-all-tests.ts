/**
 * Main Test Runner for Gemini Services
 * =====================================
 *
 * Runs all Gemini service tests:
 * - Text generation (multiple models + JSON output)
 * - TTS (text-to-speech with voice settings)
 * - Image generation (Nano Pro + Nano 2)
 * - Video generation (Veo 3.1 variants)
 * - Music generation (Lyria 3)
 *
 * Usage:
 *   Run all tests:      npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts
 *   Run specific test:  npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=text
 *                       npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=tts
 *                       npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=image
 *                       npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=video
 *                       npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=music
 *
 * Environment:
 *   GEMINI_API_KEY must be set in .env file
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

// Load environment variables
import 'dotenv/config';

const SCRIPTS_DIR = __dirname;
const OUTPUT_DIR = join(__dirname, '../output');

interface TestSuite {
  name: string;
  script: string;
  description: string;
  estimatedTime: string;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'text',
    script: 'test-text-generation.ts',
    description: 'Text generation with multiple models (3.5 Flash, 3.1 Flash-Lite, 2.5 Flash, 2.5 Flash-Lite)',
    estimatedTime: '1-2 min',
  },
  {
    name: 'tts',
    script: 'test-tts.ts',
    description: 'Text-to-Speech with different voices, styles, and multi-speaker',
    estimatedTime: '2-3 min',
  },
  {
    name: 'image',
    script: 'test-image.ts',
    description: 'Image generation with Nano Pro and Nano 2 models',
    estimatedTime: '2-4 min',
  },
  {
    name: 'video',
    script: 'test-video.ts',
    description: 'Video generation with Veo 3.1 Lite, Fast, and Standard',
    estimatedTime: '5-15 min',
  },
  {
    name: 'music',
    script: 'test-music.ts',
    description: 'Music generation with Lyria 3',
    estimatedTime: '2-3 min',
  },
];

function runScript(scriptPath: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['ts-node', scriptPath], {
      cwd: join(__dirname, '../../../..'),
      env: { ...process.env },
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let output = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text);
      output += text;
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      process.stderr.write(text);
      output += text;
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
      });
    });

    child.on('error', (err) => {
      output += `\nError: ${err.message}`;
      resolve({
        success: false,
        output,
      });
    });
  });
}

async function main() {
  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY environment variable is not set');
    console.error('   Please add it to your .env file: GEMINI_API_KEY=your-api-key-here');
    console.error('   Get your API key at: https://aistudio.google.com/app/apikey');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const onlyArg = args.find(a => a.startsWith('--only='));
  const onlyTest = onlyArg?.split('=')[1];

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           GEMINI SERVICES TEST SUITE                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📁 Output directory:', OUTPUT_DIR);
  console.log('🔑 API Key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
  console.log('');

  // Filter tests if --only specified
  let suitesToRun = TEST_SUITES;
  if (onlyTest) {
    const suite = TEST_SUITES.find(s => s.name === onlyTest);
    if (!suite) {
      console.error(`❌ Unknown test suite: ${onlyTest}`);
      console.error(`   Available: ${TEST_SUITES.map(s => s.name).join(', ')}`);
      process.exit(1);
    }
    suitesToRun = [suite];
    console.log(`🎯 Running only: ${onlyTest}`);
  } else {
    console.log('🎯 Running all test suites');
  }

  console.log('');
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ Test Suites to Run                                              │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const suite of suitesToRun) {
    console.log(`│ • ${suite.name.padEnd(10)} - ${suite.description.substring(0, 45).padEnd(45)}│`);
    console.log(`│              Estimated time: ${suite.estimatedTime.padEnd(34)}│`);
  }
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log('');

  // Run tests
  const results: Array<{ suite: TestSuite; success: boolean; durationMs: number }> = [];

  for (const suite of suitesToRun) {
    console.log('');
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log(`┃ Running: ${suite.name.toUpperCase().padEnd(54)}┃`);
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    console.log('');

    const startTime = Date.now();
    const scriptPath = join(SCRIPTS_DIR, suite.script);
    const result = await runScript(scriptPath);
    const durationMs = Date.now() - startTime;

    results.push({
      suite,
      success: result.success,
      durationMs,
    });

    console.log('');
    console.log(`${result.success ? '✅' : '❌'} ${suite.name} completed in ${(durationMs / 1000).toFixed(1)}s`);
  }

  // Final Summary
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL TEST SUMMARY                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log('┌────────────────────┬─────────┬────────────┐');
  console.log('│ Test Suite         │ Status  │ Duration   │');
  console.log('├────────────────────┼─────────┼────────────┤');
  for (const r of results) {
    const status = r.success ? '✅ Pass' : '❌ Fail';
    const duration = `${(r.durationMs / 1000).toFixed(1)}s`;
    console.log(`│ ${r.suite.name.padEnd(18)} │ ${status.padEnd(7)} │ ${duration.padStart(8)}   │`);
  }
  console.log('├────────────────────┼─────────┼────────────┤');
  console.log(`│ ${'TOTAL'.padEnd(18)} │ ${successful}/${results.length}     │ ${(totalDuration / 1000).toFixed(1).padStart(8)}s  │`);
  console.log('└────────────────────┴─────────┴────────────┘');

  console.log('');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
  console.log('');
  console.log(`📁 All outputs saved to: ${OUTPUT_DIR}`);

  // Save master summary
  const masterSummary = {
    timestamp: new Date().toISOString(),
    results: results.map(r => ({
      name: r.suite.name,
      success: r.success,
      durationMs: r.durationMs,
    })),
    totals: {
      successful,
      failed,
      totalDurationMs: totalDuration,
    },
  };

  const summaryPath = join(OUTPUT_DIR, 'master_summary.json');
  await writeFile(summaryPath, JSON.stringify(masterSummary, null, 2), 'utf-8');
  console.log(`📄 Master summary: ${summaryPath}`);

  // Exit with error code if any failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
