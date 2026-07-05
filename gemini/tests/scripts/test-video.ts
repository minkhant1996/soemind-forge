/**
 * Test Script: Video Generation (Veo)
 * ====================================
 *
 * Tests video generation with:
 * - veo-3.1-lite-generate-preview (fast, budget)
 * - veo-3.1-fast-generate-preview (fast)
 * - veo-3.1-generate-preview (balanced)
 * - Image-to-video generation (using reference image)
 *
 * Note: Video generation takes time (polling for completion)
 *
 * Run: npx ts-node src/services/gemini/tests/scripts/test-video.ts
 */

import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
import 'dotenv/config';

const OUTPUT_DIR = join(__dirname, '../output');

// Veo models to test
type VeoModel =
  | 'veo-3.1-lite-generate-preview'
  | 'veo-3.1-fast-generate-preview'
  | 'veo-3.1-generate-preview';

interface VideoTestResult {
  model: VeoModel;
  prompt: string;
  success: boolean;
  videoCount?: number;
  durationSeconds?: number;
  latencyMs?: number;
  error?: string;
  hasImageInput?: boolean;
}

async function saveVideo(filename: string, data: Buffer): Promise<void> {
  const filepath = join(OUTPUT_DIR, filename);
  await writeFile(filepath, data);
  console.log(`  ✓ Saved to: ${filepath} (${(data.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function generateVideo(
  model: VeoModel,
  prompt: string,
  durationSeconds: number = 4,
  referenceImagePath?: string
): Promise<VideoTestResult> {
  console.log(`\n🎬 Testing ${model}...`);
  console.log(`  Prompt: "${prompt.substring(0, 50)}..."`);
  console.log(`  Duration: ${durationSeconds} seconds`);
  if (referenceImagePath) {
    console.log(`  Reference Image: ${referenceImagePath}`);
  }

  const startTime = Date.now();

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Build source config
    const source: Record<string, unknown> = { prompt };

    // Add reference image if provided
    if (referenceImagePath && existsSync(referenceImagePath)) {
      const imageData = await readFile(referenceImagePath);
      const base64Image = imageData.toString('base64');
      const mimeType = referenceImagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

      source.image = {
        imageBytes: base64Image,
        mimeType,
      };
      console.log(`  ✓ Image loaded: ${(imageData.length / 1024).toFixed(1)} KB`);
    }

    // Start video generation
    let operation = await ai.models.generateVideos({
      model,
      source,
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        resolution: '720p',
        durationSeconds,
      },
    });

    console.log(`  ⏳ Video generation started: ${operation.name}`);

    // Poll for completion
    let pollCount = 0;
    const maxPolls = 60; // Max 10 minutes (60 * 10 seconds)

    while (!operation.done && pollCount < maxPolls) {
      pollCount++;
      console.log(`  ⏳ Waiting... (${pollCount * 10}s elapsed)`);
      await new Promise(resolve => setTimeout(resolve, 10000));

      operation = await ai.operations.getVideosOperation({
        operation,
      });
    }

    if (!operation.done) {
      throw new Error('Video generation timed out after 10 minutes');
    }

    const latencyMs = Date.now() - startTime;
    const videos = operation.response?.generatedVideos || [];

    if (videos.length === 0) {
      throw new Error('No videos were generated');
    }

    console.log(`  ✓ Generated ${videos.length} video(s) in ${(latencyMs / 1000).toFixed(1)}s`);

    // Download videos
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoUri = video?.video?.uri;

      if (videoUri) {
        console.log(`  📥 Downloading video ${i + 1}...`);

        const response = await fetch(`${videoUri}&key=${process.env.GEMINI_API_KEY}`);
        const buffer = await response.arrayBuffer();

        const modelShort = model.replace(/-generate-preview$/, '').replace(/-/g, '_');
        const imageTag = referenceImagePath ? '_img2vid' : '';
        const filename = `video_${modelShort}${imageTag}_${i + 1}.mp4`;
        await saveVideo(filename, Buffer.from(buffer));
      }
    }

    return {
      model,
      prompt,
      success: true,
      videoCount: videos.length,
      durationSeconds,
      latencyMs,
      hasImageInput: !!referenceImagePath,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ✗ Error: ${errorMsg}`);

    return {
      model,
      prompt,
      success: false,
      error: errorMsg,
      hasImageInput: !!referenceImagePath,
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              GEMINI VIDEO (VEO) TEST SUITE                     ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n⚠️  Note: Video generation can take 1-5 minutes per video');

  const results: VideoTestResult[] = [];

  // Test prompts for startup/validation context
  const prompts = {
    lite: 'A modern office space with a laptop showing analytics dashboard, soft natural lighting, clean minimalist design, 4K quality',
    fast: 'A person typing on a laptop in a coffee shop, shallow depth of field, cinematic look, warm ambient lighting',
    standard: 'Aerial drone shot of a city skyline at sunset, golden hour lighting, smooth camera movement, professional cinematography',
  };

  // Test 1: Veo 3.1 Lite (fastest, cheapest)
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Test 1: Veo 3.1 Lite (Budget/Fast)');
  console.log('────────────────────────────────────────────────────────────────');
  results.push(
    await generateVideo('veo-3.1-lite-generate-preview', prompts.lite, 4)
  );

  // Test 2: Veo 3.1 Fast
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Test 2: Veo 3.1 Fast');
  console.log('────────────────────────────────────────────────────────────────');
  results.push(
    await generateVideo('veo-3.1-fast-generate-preview', prompts.fast, 4)
  );

  // Test 3: Veo 3.1 (Standard quality)
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('Test 3: Veo 3.1 (Standard Quality)');
  console.log('────────────────────────────────────────────────────────────────');
  results.push(
    await generateVideo('veo-3.1-generate-preview', prompts.standard, 4)
  );

  // Test 4: Image-to-Video (using a generated image as reference)
  const referenceImagePath = join(OUTPUT_DIR, 'image_3-pro-image_pro_startup_office_0.jpg');
  if (existsSync(referenceImagePath)) {
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('Test 4: Image-to-Video (with reference image)');
    console.log('────────────────────────────────────────────────────────────────');
    results.push(
      await generateVideo(
        'veo-3.1-generate-preview',
        'Animate this office scene with subtle camera movement, people walking in the background, and natural lighting changes',
        4,
        referenceImagePath
      )
    );
  } else {
    console.log('\n⚠️  Skipping image-to-video test: Reference image not found');
    console.log('   Run test-image.ts first to generate reference images');
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

  // Print results table
  console.log('\n┌─────────────────────────────────┬─────────┬─────────────┬───────────┐');
  console.log('│ Model                           │ Status  │ Time (s)    │ Has Image │');
  console.log('├─────────────────────────────────┼─────────┼─────────────┼───────────┤');
  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    const time = r.latencyMs ? (r.latencyMs / 1000).toFixed(1) : 'N/A';
    const hasImage = r.hasImageInput ? '✓' : '-';
    console.log(`│ ${r.model.padEnd(31)} │ ${status}      │ ${time.padStart(9)}s │     ${hasImage}     │`);
  }
  console.log('└─────────────────────────────────┴─────────┴─────────────┴───────────┘');

  // Save summary
  const summaryPath = join(OUTPUT_DIR, 'video_summary.json');
  await writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Summary saved to: ${summaryPath}`);

  // Cost estimate (based on pricing.json)
  const costPerSecond: Record<VeoModel, number> = {
    'veo-3.1-lite-generate-preview': 0.03,
    'veo-3.1-fast-generate-preview': 0.08,
    'veo-3.1-generate-preview': 0.20,
  };

  let totalCost = 0;
  for (const r of results) {
    if (r.success && r.durationSeconds) {
      totalCost += costPerSecond[r.model] * r.durationSeconds;
    }
  }
  console.log(`\n💰 Estimated total cost: $${totalCost.toFixed(4)}`);
}

main().catch(console.error);
