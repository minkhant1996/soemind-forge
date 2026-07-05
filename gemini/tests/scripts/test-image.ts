/**
 * Test Script: Image Generation
 * ==============================
 *
 * Tests image generation with:
 * - gemini-3-pro-image (Nano Pro - highest quality)
 * - gemini-3.1-flash-image-preview (Nano 2 - fast)
 *
 * Run: npx ts-node src/services/gemini/tests/scripts/test-image.ts
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
import 'dotenv/config';

const OUTPUT_DIR = join(__dirname, '../output');

// Image models to test
type ImageModel = 'gemini-3-pro-image' | 'gemini-3.1-flash-image-preview';

interface ImageTestResult {
  model: ImageModel;
  prompt: string;
  success: boolean;
  imageCount?: number;
  imageSize?: number;
  mimeType?: string;
  latencyMs?: number;
  error?: string;
}

async function saveImage(filename: string, data: Buffer, mimeType: string): Promise<void> {
  // Determine extension from MIME type
  const extMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const ext = extMap[mimeType] || 'png';
  const filepath = join(OUTPUT_DIR, `${filename}.${ext}`);
  await writeFile(filepath, data);
  console.log(`  ✓ Saved to: ${filepath} (${(data.length / 1024).toFixed(2)} KB)`);
}

async function generateImage(
  model: ImageModel,
  prompt: string,
  testName: string,
  aspectRatio: string = '16:9',
  imageSize: string = '1K'
): Promise<ImageTestResult> {
  console.log(`\n🖼️  Testing ${model}...`);
  console.log(`  Prompt: "${prompt.substring(0, 50)}..."`);
  console.log(`  Aspect Ratio: ${aspectRatio}, Size: ${imageSize}`);

  const startTime = Date.now();

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Build config based on model
    const config: Record<string, unknown> = {
      imageConfig: {
        aspectRatio,
        imageSize,
      },
      responseModalities: ['IMAGE'],
    };

    // Add thinking config for flash model
    if (model === 'gemini-3.1-flash-image-preview') {
      config.thinkingConfig = {
        thinkingLevel: 'MINIMAL',
      };
    }

    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let imageCount = 0;
    let lastImageSize = 0;
    let lastMimeType = '';

    for await (const chunk of response) {
      if (!chunk.candidates?.[0]?.content?.parts) {
        continue;
      }

      const part = chunk.candidates[0].content.parts[0];

      if (part.inlineData) {
        const inlineData = part.inlineData;
        const mimeType = inlineData.mimeType || 'image/png';
        const buffer = Buffer.from(inlineData.data || '', 'base64');

        const modelShort = model.replace(/-preview$/, '').replace(/gemini-/g, '');
        const filename = `image_${modelShort}_${testName.toLowerCase().replace(/\s+/g, '_')}_${imageCount}`;
        await saveImage(filename, buffer, mimeType);

        imageCount++;
        lastImageSize = buffer.length;
        lastMimeType = mimeType;
      } else if (part.text) {
        console.log(`  📝 Text response: ${part.text.substring(0, 100)}...`);
      }
    }

    const latencyMs = Date.now() - startTime;

    if (imageCount === 0) {
      throw new Error('No images were generated');
    }

    console.log(`  ✓ Generated ${imageCount} image(s) in ${(latencyMs / 1000).toFixed(1)}s`);

    return {
      model,
      prompt,
      success: true,
      imageCount,
      imageSize: lastImageSize,
      mimeType: lastMimeType,
      latencyMs,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ✗ Error: ${errorMsg}`);

    return {
      model,
      prompt,
      success: false,
      error: errorMsg,
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('            GEMINI IMAGE GENERATION TEST SUITE                  ');
  console.log('═══════════════════════════════════════════════════════════════');

  const results: ImageTestResult[] = [];

  // Test prompts for startup/business context
  const prompts = {
    startup: 'Modern tech startup office space with glass walls, plants, standing desks, and natural lighting, minimalist aesthetic, professional photography style',
    product: 'Clean product mockup of a mobile app on an iPhone, floating in a gradient background, soft shadows, professional app store screenshot style',
    team: 'Abstract representation of teamwork and collaboration, geometric shapes forming connected nodes, modern corporate art style, blue and orange gradient colors',
    logo: 'Minimalist logo design for a tech company, abstract geometric shape, clean lines, professional brand identity, white background',
  };

  // ============================================================
  // Test 1: Gemini 3 Pro Image (Nano Pro - Highest Quality)
  // ============================================================
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Testing: Gemini 3 Pro Image (Nano Pro - Highest Quality)');
  console.log('────────────────────────────────────────────────────────────────');

  results.push(
    await generateImage(
      'gemini-3-pro-image',
      prompts.startup,
      'Pro Startup Office',
      '16:9',
      '2K'
    )
  );

  results.push(
    await generateImage(
      'gemini-3-pro-image',
      prompts.product,
      'Pro Product Mockup',
      '9:16',
      '1K'
    )
  );

  // ============================================================
  // Test 2: Gemini 3.1 Flash Image (Nano 2 - Fast)
  // ============================================================
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Testing: Gemini 3.1 Flash Image (Nano 2 - Fast)');
  console.log('────────────────────────────────────────────────────────────────');

  results.push(
    await generateImage(
      'gemini-3.1-flash-image-preview',
      prompts.team,
      'Flash Team Collaboration',
      '16:9',
      '1K'
    )
  );

  results.push(
    await generateImage(
      'gemini-3.1-flash-image-preview',
      prompts.logo,
      'Flash Logo Design',
      '1:1',
      '512'
    )
  );

  // Additional tests with different aspect ratios
  results.push(
    await generateImage(
      'gemini-3.1-flash-image-preview',
      'Social media banner for a startup launch announcement, modern design, bold typography placeholder, exciting colors, celebration theme',
      'Flash Social Banner',
      '16:9',
      '2K'
    )
  );

  results.push(
    await generateImage(
      'gemini-3-pro-image',
      'Instagram story graphic for a startup tip of the day, vertical format, clean design, gradient background, modern sans-serif placeholder text',
      'Pro Instagram Story',
      '9:16',
      '1K'
    )
  );

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        TEST SUMMARY                            ');
  console.log('═══════════════════════════════════════════════════════════════');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  // Print results table
  console.log('\n┌─────────────────────────────────┬─────────┬────────────┬─────────────┐');
  console.log('│ Model                           │ Status  │ Time (s)   │ Size        │');
  console.log('├─────────────────────────────────┼─────────┼────────────┼─────────────┤');
  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    const time = r.latencyMs ? (r.latencyMs / 1000).toFixed(1) + 's' : 'N/A';
    const size = r.imageSize ? `${(r.imageSize / 1024).toFixed(0)} KB` : 'N/A';
    const modelShort = r.model.replace('gemini-', '').substring(0, 20);
    console.log(`│ ${modelShort.padEnd(31)} │ ${status}      │ ${time.padStart(8)}   │ ${size.padStart(9)}  │`);
  }
  console.log('└─────────────────────────────────┴─────────┴────────────┴─────────────┘');

  // Save summary
  const summaryPath = join(OUTPUT_DIR, 'image_summary.json');
  await writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Summary saved to: ${summaryPath}`);

  // Cost estimate (based on pricing.json)
  const costPerImage: Record<ImageModel, Record<string, number>> = {
    'gemini-3-pro-image': {
      '1K': 0.134,
      '2K': 0.134,
      '4K': 0.24,
    },
    'gemini-3.1-flash-image-preview': {
      '512': 0.045,
      '1K': 0.067,
      '2K': 0.101,
      '4K': 0.15,
    },
  };

  let totalCost = 0;
  for (const r of results) {
    if (r.success) {
      // Rough estimate - assume 1K for simplicity
      totalCost += costPerImage[r.model]['1K'] || 0.1;
    }
  }
  console.log(`\n💰 Estimated total cost: $${totalCost.toFixed(4)}`);
}

main().catch(console.error);
