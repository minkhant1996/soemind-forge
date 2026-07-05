/**
 * Test Script: Text-to-Speech (TTS)
 * ==================================
 *
 * Tests TTS generation with:
 * - Different voices (Zephyr, Aoede, Puck, etc.)
 * - Voice settings (style, pace, accent)
 * - Multi-speaker conversation
 * - Audio tags for inline control
 *
 * Run: npx ts-node src/services/gemini/tests/scripts/test-tts.ts
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import {
  textToSpeech,
  multiSpeakerTTS,
  TTSVoiceName,
  TTSVoiceSettings,
} from '../../index';

// Load environment variables
import 'dotenv/config';

const OUTPUT_DIR = join(__dirname, '../output');

interface TTSTestResult {
  testName: string;
  voiceName?: string;
  voiceSettings?: TTSVoiceSettings;
  success: boolean;
  audioSize?: number;
  mimeType?: string;
  latencyMs?: number;
  cost?: number;
  error?: string;
}

async function saveAudio(filename: string, data: Buffer): Promise<void> {
  const filepath = join(OUTPUT_DIR, filename);
  await writeFile(filepath, data);
  console.log(`  ✓ Saved to: ${filepath} (${(data.length / 1024).toFixed(2)} KB)`);
}

async function testBasicTTS(
  voiceName: TTSVoiceName,
  text: string
): Promise<TTSTestResult> {
  console.log(`\n🎤 Testing basic TTS with voice: ${voiceName}...`);

  try {
    const result = await textToSpeech(text, voiceName);

    if (result.success) {
      const filename = `tts_basic_${voiceName.toLowerCase()}.wav`;
      await saveAudio(filename, result.data.audio.data);

      console.log(`  ✓ Success! Cost: $${result.data.cost.totalCost.toFixed(6)}`);

      return {
        testName: `Basic TTS - ${voiceName}`,
        voiceName,
        success: true,
        audioSize: result.data.audio.data.length,
        mimeType: result.data.audio.mimeType,
        latencyMs: result.data.latencyMs,
        cost: result.data.cost.totalCost,
      };
    }

    // Error case
    const errorResult = result as { success: false; error: { message: string } };
    console.log(`  ✗ Failed: ${errorResult.error.message}`);
    return {
      testName: `Basic TTS - ${voiceName}`,
      voiceName,
      success: false,
      error: errorResult.error.message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ✗ Error: ${errorMsg}`);
    return {
      testName: `Basic TTS - ${voiceName}`,
      voiceName,
      success: false,
      error: errorMsg,
    };
  }
}

async function testTTSWithSettings(
  voiceName: TTSVoiceName,
  text: string,
  settings: TTSVoiceSettings,
  testLabel: string
): Promise<TTSTestResult> {
  console.log(`\n🎤 Testing TTS with settings: ${testLabel}...`);

  try {
    const result = await textToSpeech(text, voiceName, settings);

    if (result.success) {
      const filename = `tts_${testLabel.toLowerCase().replace(/\s+/g, '_')}.wav`;
      await saveAudio(filename, result.data.audio.data);

      console.log(`  ✓ Success! Cost: $${result.data.cost.totalCost.toFixed(6)}`);

      return {
        testName: testLabel,
        voiceName,
        voiceSettings: settings,
        success: true,
        audioSize: result.data.audio.data.length,
        mimeType: result.data.audio.mimeType,
        latencyMs: result.data.latencyMs,
        cost: result.data.cost.totalCost,
      };
    }

    // Error case
    const errorResult = result as { success: false; error: { message: string } };
    console.log(`  ✗ Failed: ${errorResult.error.message}`);
    return {
      testName: testLabel,
      voiceName,
      voiceSettings: settings,
      success: false,
      error: errorResult.error.message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ✗ Error: ${errorMsg}`);
    return {
      testName: testLabel,
      voiceName,
      voiceSettings: settings,
      success: false,
      error: errorMsg,
    };
  }
}

async function testMultiSpeaker(): Promise<TTSTestResult> {
  console.log('\n🎤 Testing multi-speaker TTS...');

  const script = `Host: Welcome to today's startup podcast! We have an amazing guest.
Guest: Thanks for having me! I'm excited to share my journey.
Host: So tell us, how did you come up with your startup idea?
Guest: Well, it all started when I noticed a problem in my daily life...`;

  try {
    const result = await multiSpeakerTTS(
      script,
      [
        {
          speaker: 'Host',
          voiceName: 'Zephyr',
          voiceSettings: { style: 'excited', pace: 'energetic' },
        },
        {
          speaker: 'Guest',
          voiceName: 'Puck',
          voiceSettings: { style: 'casual', accent: 'british_rp' },
        },
      ]
    );

    if (result.success) {
      const filename = 'tts_multi_speaker_podcast.wav';
      await saveAudio(filename, result.data.audio.data);

      console.log(`  ✓ Success! Cost: $${result.data.cost.totalCost.toFixed(6)}`);

      return {
        testName: 'Multi-Speaker Podcast',
        success: true,
        audioSize: result.data.audio.data.length,
        mimeType: result.data.audio.mimeType,
        latencyMs: result.data.latencyMs,
        cost: result.data.cost.totalCost,
      };
    }

    // Error case
    const errorResult = result as { success: false; error: { message: string } };
    console.log(`  ✗ Failed: ${errorResult.error.message}`);
    return {
      testName: 'Multi-Speaker Podcast',
      success: false,
      error: errorResult.error.message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ✗ Error: ${errorMsg}`);
    return {
      testName: 'Multi-Speaker Podcast',
      success: false,
      error: errorMsg,
    };
  }
}

async function testAudioTags(): Promise<TTSTestResult> {
  console.log('\n🎤 Testing TTS with audio tags...');

  const text = `[excited] Wow, this is incredible news!
[whispers] But keep it a secret for now...
[shouting] We did it! We actually did it!
[sighs] What a journey it's been.`;

  try {
    const result = await textToSpeech(text, 'Aoede');

    if (result.success) {
      const filename = 'tts_audio_tags.wav';
      await saveAudio(filename, result.data.audio.data);

      console.log(`  ✓ Success! Cost: $${result.data.cost.totalCost.toFixed(6)}`);

      return {
        testName: 'Audio Tags',
        voiceName: 'Aoede',
        success: true,
        audioSize: result.data.audio.data.length,
        mimeType: result.data.audio.mimeType,
        latencyMs: result.data.latencyMs,
        cost: result.data.cost.totalCost,
      };
    }

    // Error case
    const errorResult = result as { success: false; error: { message: string } };
    console.log(`  ✗ Failed: ${errorResult.error.message}`);
    return {
      testName: 'Audio Tags',
      voiceName: 'Aoede',
      success: false,
      error: errorResult.error.message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ✗ Error: ${errorMsg}`);
    return {
      testName: 'Audio Tags',
      voiceName: 'Aoede',
      success: false,
      error: errorMsg,
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              GEMINI TTS TEST SUITE                             ');
  console.log('═══════════════════════════════════════════════════════════════');

  const results: TTSTestResult[] = [];
  const sampleText = 'Hello! Welcome to the AI Content Studio. This is a sample voiceover to test text-to-speech generation.';

  // Test 1: Basic TTS with different voices
  const voicesToTest: TTSVoiceName[] = ['Zephyr', 'Aoede', 'Puck', 'Charon'];
  for (const voice of voicesToTest) {
    results.push(await testBasicTTS(voice, sampleText));
  }

  // Test 2: TTS with style settings
  results.push(
    await testTTSWithSettings(
      'Zephyr',
      'Introducing our revolutionary new product that will change everything!',
      { style: 'promo_hype', pace: 'energetic' },
      'Promo Hype Style'
    )
  );

  // Test 3: TTS with British accent
  results.push(
    await testTTSWithSettings(
      'Aoede',
      'Good evening. Today we bring you the latest developments in artificial intelligence.',
      { style: 'newscaster', accent: 'british_rp' },
      'British Newscaster'
    )
  );

  // Test 4: TTS with whisper style
  results.push(
    await testTTSWithSettings(
      'Puck',
      'Welcome to this guided meditation. Close your eyes and take a deep breath.',
      { style: 'whisper', pace: 'slow' },
      'Whisper Meditation'
    )
  );

  // Test 5: TTS with custom audio profile
  results.push(
    await testTTSWithSettings(
      'Enceladus',
      'In a world where technology meets humanity, one platform stands above the rest.',
      {
        audioProfile: 'A dramatic movie trailer narrator with a deep, resonant voice and epic delivery',
      },
      'Movie Trailer Narrator'
    )
  );

  // Test 6: Multi-speaker conversation
  results.push(await testMultiSpeaker());

  // Test 7: Audio tags
  results.push(await testAudioTags());

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
  const summaryPath = join(OUTPUT_DIR, 'tts_summary.json');
  await writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Summary saved to: ${summaryPath}`);

  // Print cost summary
  const totalCost = results
    .filter(r => r.success && r.cost)
    .reduce((sum, r) => sum + (r.cost || 0), 0);
  console.log(`\n💰 Total cost: $${totalCost.toFixed(6)}`);
}

main().catch(console.error);
