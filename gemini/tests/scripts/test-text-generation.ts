/**
 * Test Script: Text Generation with Different Models
 * ==================================================
 *
 * Tests text generation across different Gemini models:
 * - gemini-3.5-flash
 * - gemini-3.1-flash-lite
 * - gemini-2.5-flash
 * - gemini-2.5-flash-lite
 *
 * Output formats:
 * - Plain text
 * - JSON structured output
 *
 * Run: npx ts-node src/services/gemini/tests/scripts/test-text-generation.ts
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import {
  gemini35Flash,
  gemini31FlashLite,
  gemini25Flash,
  gemini25FlashLite,
  GeminiResult,
  GeminiTextResponse,
} from '../../index';

// Load environment variables
import 'dotenv/config';

const OUTPUT_DIR = join(__dirname, '../output');

interface TestResult {
  model: string;
  outputFormat: string;
  success: boolean;
  text?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: {
    totalCost: number;
  };
  latencyMs?: number;
  error?: string;
}

async function saveResult(filename: string, content: string): Promise<void> {
  const filepath = join(OUTPUT_DIR, filename);
  await writeFile(filepath, content, 'utf-8');
  console.log(`  ✓ Saved to: ${filepath}`);
}

async function testModel(
  modelName: string,
  generateFn: (input: { systemPrompt?: string; userPrompt: string }) => Promise<GeminiResult<GeminiTextResponse>>,
  outputFormat: 'text' | 'json'
): Promise<TestResult> {
  console.log(`\n📝 Testing ${modelName} with ${outputFormat} output...`);

  try {
    let systemPrompt: string;
    let userPrompt: string;

    if (outputFormat === 'json') {
      systemPrompt = `You are a helpful assistant that always responds in valid JSON format.
Return a JSON object with the following structure:
{
  "answer": "your answer here",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;
      userPrompt = 'What is the capital of Myanmar? Respond in JSON format only.';
    } else {
      systemPrompt = 'You are a helpful assistant. Be concise and informative.';
      userPrompt = 'What is the capital of Myanmar? Provide a brief 2-3 sentence answer.';
    }

    const result = await generateFn({ systemPrompt, userPrompt });

    if (result.success) {
      const filename = `text_${modelName.replace(/[-.]/g, '_')}_${outputFormat}.${outputFormat === 'json' ? 'json' : 'txt'}`;
      await saveResult(filename, result.data.text);

      console.log(`  ✓ Success! Tokens: ${result.data.usage.totalTokens}, Cost: $${result.data.cost.totalCost.toFixed(6)}`);

      return {
        model: modelName,
        outputFormat,
        success: true,
        text: result.data.text.substring(0, 200) + (result.data.text.length > 200 ? '...' : ''),
        usage: result.data.usage,
        cost: { totalCost: result.data.cost.totalCost },
        latencyMs: result.data.latencyMs,
      };
    }

    // Error case
    const errorResult = result as { success: false; error: { message: string } };
    console.log(`  ✗ Failed: ${errorResult.error.message}`);
    return {
      model: modelName,
      outputFormat,
      success: false,
      error: errorResult.error.message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ✗ Error: ${errorMsg}`);
    return {
      model: modelName,
      outputFormat,
      success: false,
      error: errorMsg,
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           GEMINI TEXT GENERATION TEST SUITE                    ');
  console.log('═══════════════════════════════════════════════════════════════');

  const results: TestResult[] = [];

  // Define models to test
  const models: Array<{
    name: string;
    fn: (input: { systemPrompt?: string; userPrompt: string }) => Promise<GeminiResult<GeminiTextResponse>>;
  }> = [
    { name: 'gemini-3.5-flash', fn: gemini35Flash },
    { name: 'gemini-3.1-flash-lite', fn: gemini31FlashLite },
    { name: 'gemini-2.5-flash', fn: gemini25Flash },
    { name: 'gemini-2.5-flash-lite', fn: gemini25FlashLite },
  ];

  // Test each model with both output formats
  for (const model of models) {
    // Test plain text output
    results.push(await testModel(model.name, model.fn, 'text'));

    // Test JSON output
    results.push(await testModel(model.name, model.fn, 'json'));
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        TEST SUMMARY                            ');
  console.log('═══════════════════════════════════════════════════════════════');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  // Save summary
  const summaryPath = join(OUTPUT_DIR, 'text_generation_summary.json');
  await writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Summary saved to: ${summaryPath}`);

  // Print cost summary
  const totalCost = results
    .filter(r => r.success && r.cost)
    .reduce((sum, r) => sum + (r.cost?.totalCost || 0), 0);
  console.log(`\n💰 Total cost: $${totalCost.toFixed(6)}`);
}

main().catch(console.error);
