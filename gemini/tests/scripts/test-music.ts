/**
 * Test Script: Music Generation (Lyria)
 * ======================================
 *
 * Tests music generation with Lyria 3 Pro Preview model.
 *
 * Run: npx ts-node src/services/gemini/tests/scripts/test-music.ts
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
import 'dotenv/config';

const OUTPUT_DIR = join(__dirname, '../output');

interface MusicTestResult {
  testName: string;
  prompt: string;
  model: string;
  success: boolean;
  audioSize?: number;
  mimeType?: string;
  latencyMs?: number;
  error?: string;
}

async function saveMusic(filename: string, data: Buffer): Promise<void> {
  const filepath = join(OUTPUT_DIR, filename);
  await writeFile(filepath, data);
  console.log(`  ✓ Saved to: ${filepath} (${(data.length / 1024).toFixed(2)} KB)`);
}

async function testMusicGeneration(
  testName: string,
  prompt: string
): Promise<MusicTestResult> {
  console.log(`\n🎵 Testing: ${testName}...`);
  console.log(`  Prompt: "${prompt.substring(0, 60)}..."`);

  const startTime = Date.now();
  const model = 'lyria-3-pro-preview';

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const config = {
      responseModalities: ['audio'],
    };

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

    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/wav';

    for await (const chunk of response) {
      if (!chunk.candidates?.[0]?.content?.parts) {
        continue;
      }

      const part = chunk.candidates[0].content.parts[0];

      if (part.inlineData) {
        const inlineData = part.inlineData;
        mimeType = inlineData.mimeType || 'audio/wav';
        audioBuffer = Buffer.from(inlineData.data || '', 'base64');
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!audioBuffer) {
      throw new Error('No audio was generated');
    }

    // Determine extension from mime type
    const extMap: Record<string, string> = {
      'audio/wav': 'wav',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
    };
    const ext = extMap[mimeType] || 'wav';
    const filename = `music_lyria3pro_${testName.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    await saveMusic(filename, audioBuffer);

    console.log(`  ✓ Success! Size: ${(audioBuffer.length / 1024).toFixed(0)} KB, Time: ${(latencyMs / 1000).toFixed(1)}s`);

    return {
      testName,
      prompt,
      model,
      success: true,
      audioSize: audioBuffer.length,
      mimeType,
      latencyMs,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.log(`  ✗ Failed: ${errorMsg}`);
    return {
      testName,
      prompt,
      model,
      success: false,
      error: errorMsg,
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('          GEMINI MUSIC (LYRIA 3 PRO) TEST SUITE                 ');
  console.log('═══════════════════════════════════════════════════════════════');

  const results: MusicTestResult[] = [];

  // Test different music styles for startup/business context

  // Test 1: Upbeat tech startup music
  results.push(
    await testMusicGeneration(
      'Tech Startup Upbeat',
      'Upbeat electronic music with synthesizers, modern production, energetic drums, perfect for a tech startup promotional video, 120 BPM, positive and inspiring mood'
    )
  );

  // Test 2: Corporate background music
  results.push(
    await testMusicGeneration(
      'Corporate Background',
      'Soft corporate background music, ambient electronic with subtle piano, professional and calm, suitable for business presentations, minimal and modern'
    )
  );

  // Test 3: Podcast intro
  results.push(
    await testMusicGeneration(
      'Podcast Intro',
      'Short podcast intro music, modern and catchy, clean production, starts with impact and settles into groove, professional podcast opening theme'
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
  console.log('\n┌─────────────────────────────┬─────────┬────────────┬─────────────┐');
  console.log('│ Test Name                   │ Status  │ Time (s)   │ File Size   │');
  console.log('├─────────────────────────────┼─────────┼────────────┼─────────────┤');
  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    const time = r.latencyMs ? `${(r.latencyMs / 1000).toFixed(1)}s` : 'N/A';
    const size = r.audioSize ? `${(r.audioSize / 1024).toFixed(0)} KB` : 'N/A';
    console.log(`│ ${r.testName.padEnd(27)} │ ${status}      │ ${time.padStart(8)}   │ ${size.padStart(9)}  │`);
  }
  console.log('└─────────────────────────────┴─────────┴────────────┴─────────────┘');

  // Save summary
  const summaryPath = join(OUTPUT_DIR, 'music_summary.json');
  await writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Summary saved to: ${summaryPath}`);
}

main().catch(console.error);
