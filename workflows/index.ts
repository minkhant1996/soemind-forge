/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * Content Generation Workflows
 * ============================
 *
 * Pre-built workflows for all content generation scenarios.
 * Agents should use these instead of writing code from scratch.
 *
 * USAGE:
 * ```typescript
 * import { generateCarousel, generateVideoWithVoiceover } from '../../workflows/index.js';
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import {
  gemini25Flash,
  gemini35Flash,
  gemini31FlashImage,
  gemini31FlashLiteImage,
  gemini3ProImage,
  generateVideo,
  generateOmniVideo,
  textToSpeech,
  multiSpeakerTTS,
  generateMusic,
  uploadMediaFile,
} from '../gemini/dist/index.js';

// Expressive TTS (inline audio tags like [excited] [pause] [whispers]) is the
// kit default — the older 2.5 model reads flat and was judged "boring".
const DEFAULT_TTS_MODEL = 'gemini-3.1-flash-tts-preview' as const;

// OpenRouter imports for Seedance video generation
import {
  generateVideo as generateOpenRouterVideo,
  downloadVideo as downloadOpenRouterVideo,
  seedance20,
  seedance20Fast,
} from '../openrouter/openrouter-provider.js';

import type {
  OpenRouterVideoInput,
  OpenRouterVideoConfig,
  OpenRouterResult,
  OpenRouterVideoResponse,
} from '../openrouter/types.js';

import type {
  VeoModel,
  VideoAspectRatio,
  TTSVoiceName,
  TTSVoiceSettings,
  SpeakerVoiceConfig,
  LyriaModel,
} from '../gemini/dist/index.js';

import type {
  WorkflowResult,
  CostInfo,
  AspectRatio,
  VideoQuality,
  CarouselStyle,
  VoiceName,
  VoiceStyle,
  ContentType,
  VoiceSuggestion,
  TextToTextInput,
  TextToTextOutput,
  ImageToTextInput,
  ImageToTextOutput,
  TranscribeAudioInput,
  TranscribeAudioOutput,
  AnalyzeReferenceVideoInput,
  AnalyzeReferenceVideoOutput,
  ReferenceVideoBreakdown,
  ReferenceVideoScene,
  ReferenceVideoRecreationScene,
  InfiniteTalkInput,
  InfiniteTalkOutput,
  TextToImageInput,
  TextToImageOutput,
  ImageToImageInput,
  ImageToImageOutput,
  TextToCarouselInput,
  TextToCarouselOutput,
  ImageToCarouselInput,
  ImageToCarouselOutput,
  TextToVideoSilentInput,
  TextToVideoSilentOutput,
  TextToVideoSpeakingInput,
  TextToVideoSpeakingOutput,
  ImageToVideoSilentInput,
  ImageToVideoSilentOutput,
  ImageToVideoSpeakingInput,
  ImageToVideoSpeakingOutput,
  TextToVideoVoiceoverInput,
  TextToVideoVoiceoverOutput,
  ImageToVideoVoiceoverInput,
  ImageToVideoVoiceoverOutput,
  VideoScene,
  CarouselSlide,
  VoiceoverInput,
  VoiceoverOutput,
  MultiSpeakerVoiceoverInput,
  MultiSpeakerVoiceoverOutput,
  MusicInput,
  MusicOutput,
  CharacterSheetInput,
  CharacterSheetOutput,
  MixVideoAudioInput,
  MixVideoAudioOutput,
  CaptionsInput,
  CaptionsOutput,
  CaptionCue,
  AssembleFinalInput,
  AssembleFinalOutput,
  ImageOptionsInput,
  ImageOptionsOutput,
  FinalizeImageInput,
  FinalizeImageOutput,
  StoryboardInput,
  StoryboardOutput,
  StoryboardKeyframe,
  HooksInput,
  HooksOutput,
  Hook,
  ScriptInput,
  ScriptOutput,
  ScriptSection,
  CaptionInput,
  CaptionOutput,
  CaptionVariant,
  QAInput,
  OmniVideoClipInput,
  OmniVideoClipOutput,
  OmniArtStyle,
  CameraMove,
  ProductShot,
  ReviewVideoInput,
  ReviewVideoOutput,
  QAReport,
  QAIssue,
  KeyframeInput,
  KeyframeOutput,
  VideoFromKeyframeInput,
  VideoFromKeyframeOutput,
  VideoFromKeyframesInput,
  VideoFromKeyframesOutput,
  DetailedVideoPrompt,
  GenerationManifest,
  GenerationEntry,
  GeneratedContentType,
  ManifestInput,
  AddManifestEntryInput,
} from './types.js';

// Re-export types
export * from './types.js';

// Re-export the asset registry (reusable characters/products/logos/voices/etc.)
export * from './asset-registry.js';

// Re-export the cost tracker (per-project spend ledger + cap)
export * from './cost-tracker.js';

// Re-export brand assets (profile images, covers, highlights for social platforms)
export * from './brand-assets.js';

// Re-export publish & repurpose (platform export packs, transcription, clip extraction)
export * from './publish.js';

// Re-export Remotion rendering (local pixel-perfect typography: slides + kinetic reels)
export * from './remotion.js';

// =============================================================================
// PROVIDER DETECTION & CONFIGURATION
// =============================================================================

import type {
  AIProvider,
  ProviderCapabilities,
  ProviderStatus,
  ProviderConfig,
  VideoProvider,
  WorkflowProviderConfig,
} from './types.js';

/**
 * Check if Gemini API keys are available
 */
function getGeminiKeyCount(): number {
  const multipleKeys = process.env.GEMINI_API_KEYS;
  if (multipleKeys) {
    return multipleKeys.split(',').filter(k => k.trim()).length;
  }
  return process.env.GEMINI_API_KEY ? 1 : 0;
}

/**
 * Check if OpenRouter API keys are available
 */
function getOpenRouterKeyCount(): number {
  const multipleKeys = process.env.OPENROUTER_API_KEYS;
  if (multipleKeys) {
    return multipleKeys.split(',').filter(k => k.trim()).length;
  }
  return process.env.OPENROUTER_API_KEY ? 1 : 0;
}

/**
 * Get Gemini provider status
 */
function getGeminiStatus(): ProviderStatus {
  const keyCount = getGeminiKeyCount();
  return {
    provider: 'gemini',
    available: keyCount > 0,
    keyCount,
    capabilities: {
      text: true,      // Gemini 2.5 Flash/Pro
      image: true,     // Imagen 3
      video: true,     // Veo 3/3.1
      tts: true,       // Gemini TTS
      music: true,     // Lyria
      stt: false,      // Not supported yet
    },
  };
}

/**
 * Get OpenRouter provider status
 */
function getOpenRouterStatus(): ProviderStatus {
  const keyCount = getOpenRouterKeyCount();
  return {
    provider: 'openrouter',
    available: keyCount > 0,
    keyCount,
    capabilities: {
      text: true,      // GPT-4, Claude, Gemini, Llama, etc.
      image: true,     // DALL-E, Stable Diffusion
      video: true,     // Seedance 2.0
      tts: true,       // Various TTS models
      music: false,    // Not supported
      stt: true,       // Whisper
    },
  };
}

/**
 * Detect available providers and get configuration
 *
 * Use this to check which API keys are configured and what capabilities
 * are available before generating content.
 *
 * @example
 * ```typescript
 * const config = detectProviders();
 * console.log('Available:', config.gemini.available, config.openrouter.available);
 * console.log('Recommended for video:', config.recommendation.video);
 * ```
 */
export function detectProviders(): ProviderConfig {
  const gemini = getGeminiStatus();
  const openrouter = getOpenRouterStatus();

  // Determine default provider (prefer Gemini if available)
  let defaultProvider: AIProvider | null = null;
  if (gemini.available) defaultProvider = 'gemini';
  else if (openrouter.available) defaultProvider = 'openrouter';

  // Recommendations based on capabilities and availability
  const recommendation = {
    text: gemini.available ? 'gemini' as AIProvider : (openrouter.available ? 'openrouter' as AIProvider : null),
    image: gemini.available ? 'gemini' as AIProvider : (openrouter.available ? 'openrouter' as AIProvider : null),
    video: gemini.available ? 'gemini' as AIProvider : (openrouter.available ? 'openrouter' as AIProvider : null),
    tts: gemini.available ? 'gemini' as AIProvider : (openrouter.available ? 'openrouter' as AIProvider : null),
    music: gemini.available && gemini.capabilities.music ? 'gemini' as AIProvider : null,
  };

  return {
    gemini,
    openrouter,
    defaultProvider,
    recommendation,
  };
}

/**
 * Get a human-readable summary of provider status
 *
 * @example
 * ```typescript
 * console.log(getProviderSummary());
 * // Output:
 * // Provider Status:
 * //   ✓ Gemini (Google AI Studio) - 2 API keys configured
 * //     Capabilities: text, image, video (Veo), tts, music (Lyria)
 * //   ✗ OpenRouter - No API key configured
 * //
 * // Recommended: Gemini for all content types
 * ```
 */
export function getProviderSummary(): string {
  const config = detectProviders();
  const lines: string[] = ['Provider Status:'];

  // Gemini status
  if (config.gemini.available) {
    lines.push(`  ✓ Gemini (Google AI Studio) - ${config.gemini.keyCount} API key(s) configured`);
    const caps = ['text', 'image', 'video (Veo)', 'tts', 'music (Lyria)'];
    lines.push(`    Capabilities: ${caps.join(', ')}`);
  } else {
    lines.push('  ✗ Gemini (Google AI Studio) - No API key configured');
    lines.push('    Set GEMINI_API_KEY in .env to enable');
  }

  // OpenRouter status
  if (config.openrouter.available) {
    lines.push(`  ✓ OpenRouter - ${config.openrouter.keyCount} API key(s) configured`);
    const caps = ['text (100+ models)', 'image', 'video (Seedance)', 'tts', 'stt'];
    lines.push(`    Capabilities: ${caps.join(', ')}`);
  } else {
    lines.push('  ✗ OpenRouter - No API key configured');
    lines.push('    Set OPENROUTER_API_KEY in .env to enable');
  }

  // Recommendation
  lines.push('');
  if (config.defaultProvider) {
    if (config.gemini.available && config.openrouter.available) {
      lines.push('Both providers available. Options:');
      lines.push('  • Gemini: Best for video (Veo 3.1), music (Lyria), native Google quality');
      lines.push('  • OpenRouter: Best for Seedance video (lip-sync), model variety (GPT-4, Claude)');
    } else {
      lines.push(`Recommended: ${config.defaultProvider === 'gemini' ? 'Gemini' : 'OpenRouter'} for all content types`);
    }
  } else {
    lines.push('⚠ No providers configured. Set API keys in .env file.');
  }

  return lines.join('\n');
}

/**
 * Video provider comparison for agent decision-making
 */
export interface VideoProviderComparison {
  veo: {
    available: boolean;
    strengths: string[];
    weaknesses: string[];
    costPerSecond: { lite: number; fast: number; standard: number };
  };
  seedance: {
    available: boolean;
    strengths: string[];
    weaknesses: string[];
    costPerSecond: number;
  };
  recommendation: VideoProvider | null;
  reason: string;
}

/**
 * Compare video providers to help agents decide which to use
 *
 * @example
 * ```typescript
 * const comparison = compareVideoProviders('lip-sync');
 * console.log(comparison.recommendation); // 'seedance'
 * console.log(comparison.reason); // 'Seedance has native lip-sync support'
 * ```
 */
export function compareVideoProviders(useCase?: 'general' | 'lip-sync' | 'product' | 'ugc' | 'b-roll'): VideoProviderComparison {
  const config = detectProviders();

  const comparison: VideoProviderComparison = {
    veo: {
      available: config.gemini.available,
      strengths: [
        'High visual quality (Veo 3.1)',
        'Multiple quality tiers (lite/fast/standard)',
        'Native integration with Gemini ecosystem',
        'Good for cinematic/product shots',
      ],
      weaknesses: [
        'No native lip-sync',
        'Audio is generated separately',
      ],
      costPerSecond: { lite: 0.03, fast: 0.08, standard: 0.20 },
    },
    seedance: {
      available: config.openrouter.available,
      strengths: [
        'Native lip-sync support',
        'Integrated audio (dialogue + SFX + music)',
        'Multimodal references (@image1, @video1, @audio1)',
        'Good for speaking characters/UGC',
      ],
      weaknesses: [
        'Single quality tier',
        'Requires OpenRouter API',
      ],
      costPerSecond: 0.05, // Approximate
    },
    recommendation: null,
    reason: '',
  };

  // Determine recommendation based on use case
  if (!config.gemini.available && !config.openrouter.available) {
    comparison.recommendation = null;
    comparison.reason = 'No video providers available. Configure API keys.';
  } else if (useCase === 'lip-sync' && config.openrouter.available) {
    comparison.recommendation = 'seedance';
    comparison.reason = 'Seedance has native lip-sync support for speaking characters.';
  } else if ((useCase === 'product' || useCase === 'b-roll') && config.gemini.available) {
    comparison.recommendation = 'veo';
    comparison.reason = 'Veo produces higher quality cinematic/product footage.';
  } else if (useCase === 'ugc' && config.openrouter.available) {
    comparison.recommendation = 'seedance';
    comparison.reason = 'Seedance is better for UGC-style speaking content with integrated audio.';
  } else if (config.gemini.available) {
    comparison.recommendation = 'veo';
    comparison.reason = 'Veo offers the best overall video quality.';
  } else {
    comparison.recommendation = 'seedance';
    comparison.reason = 'Seedance is the available video provider via OpenRouter.';
  }

  return comparison;
}

/**
 * Provider selection prompt for agents
 *
 * Returns a formatted question for agents to ask users about provider preference.
 */
export function getProviderSelectionPrompt(): string | null {
  const config = detectProviders();

  // Only ask if both providers are available
  if (!config.gemini.available || !config.openrouter.available) {
    return null;
  }

  return `
Both AI providers are available. Which would you like to use?

**Google AI Studio (Gemini)**
- Video: Veo 3.1 (high quality, lite/fast/standard tiers)
- Image: Imagen 3
- Audio: TTS + Lyria music generation
- Cost: $0.03-0.20/sec video, $0.067/image

**OpenRouter**
- Video: Seedance 2.0 (native lip-sync, integrated audio)
- Text: Access to GPT-4, Claude, Gemini, Llama, etc.
- Audio: TTS + STT (Whisper)
- Cost: ~$0.05/sec video

**Recommendation:**
- Use Gemini for: product videos, b-roll, music, high-quality images
- Use OpenRouter for: speaking characters, lip-sync, model variety
`;
}

// =============================================================================
// GENERATION MANIFEST (audit trail for prompts, parameters, outputs)
// =============================================================================

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const rand = Math.random().toString(36).substring(2, 8);
  return `${date}-${rand}`;
}

/**
 * Create a new generation manifest
 *
 * Call this at the start of a generation session to create a manifest file
 * that will track all prompts, parameters, and outputs.
 *
 * @example
 * ```typescript
 * const manifestPath = createGenerationManifest({
 *   projectName: 'soemind-foundry',
 *   outputDir: 'projects/soemind-foundry/output-contents/pitch-deck',
 *   context: {
 *     brandColors: ['#1a365d', '#d4a84b'],
 *     restrictions: ['no competitors mentioned'],
 *   }
 * });
 * // Returns: 'projects/soemind-foundry/output-contents/pitch-deck/manifest.json'
 * ```
 */
export function createGenerationManifest(input: ManifestInput): string {
  const sessionId = input.sessionId || generateSessionId();
  const now = new Date().toISOString();

  const manifest: GenerationManifest = {
    projectName: input.projectName,
    sessionId,
    startedAt: now,
    updatedAt: now,
    totalCost: 0,
    summary: {
      images: 0,
      videos: 0,
      voiceovers: 0,
      music: 0,
      carousels: 0,
      text: 0,
    },
    context: input.context,
    entries: [],
  };

  const manifestPath = path.join(input.outputDir, 'manifest.json');
  fs.mkdirSync(input.outputDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}

/**
 * Add an entry to an existing manifest
 *
 * Call this after each generation to record the prompt, parameters, and output.
 *
 * @example
 * ```typescript
 * addManifestEntry({
 *   manifestPath: 'projects/my-project/output/manifest.json',
 *   entry: {
 *     type: 'image',
 *     model: 'gemini-3-pro-image',
 *     prompt: 'Professional pitch deck slide...',
 *     parameters: {
 *       aspectRatio: '16:9',
 *       imageSize: '2K',
 *     },
 *     outputPaths: ['slide-01.png'],
 *     cost: { totalCost: 0.135, breakdown: { image: 0.135 } },
 *     status: 'success',
 *   }
 * });
 * ```
 */
export function addManifestEntry(input: AddManifestEntryInput): void {
  if (!fs.existsSync(input.manifestPath)) {
    throw new Error(`Manifest not found: ${input.manifestPath}`);
  }

  const manifest: GenerationManifest = JSON.parse(
    fs.readFileSync(input.manifestPath, 'utf-8')
  );

  // Generate entry ID
  const entryId = `${manifest.entries.length + 1}`.padStart(3, '0');

  // Create full entry
  const fullEntry: GenerationEntry = {
    id: entryId,
    timestamp: new Date().toISOString(),
    ...input.entry,
  };

  // Add to entries
  manifest.entries.push(fullEntry);

  // Update summary
  if (input.entry.type === 'image') manifest.summary.images++;
  else if (input.entry.type === 'video') manifest.summary.videos++;
  else if (input.entry.type === 'voiceover') manifest.summary.voiceovers++;
  else if (input.entry.type === 'music') manifest.summary.music++;
  else if (input.entry.type === 'carousel') manifest.summary.carousels++;
  else if (input.entry.type === 'text') manifest.summary.text++;

  // Update total cost
  manifest.totalCost += input.entry.cost?.totalCost || 0;
  manifest.updatedAt = new Date().toISOString();

  // Write back
  fs.writeFileSync(input.manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Load an existing manifest
 */
export function loadManifest(manifestPath: string): GenerationManifest | null {
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

/**
 * Generate a review report from a manifest
 *
 * Creates a human-readable markdown report of all generations in a session.
 */
export function generateManifestReport(manifestPath: string): string {
  const manifest = loadManifest(manifestPath);
  if (!manifest) {
    return 'Manifest not found.';
  }

  const lines: string[] = [
    `# Generation Report: ${manifest.projectName}`,
    '',
    `**Session ID:** ${manifest.sessionId}`,
    `**Started:** ${manifest.startedAt}`,
    `**Total Cost:** $${manifest.totalCost.toFixed(4)}`,
    '',
    '## Summary',
    `- Images: ${manifest.summary.images}`,
    `- Videos: ${manifest.summary.videos}`,
    `- Voiceovers: ${manifest.summary.voiceovers}`,
    `- Music: ${manifest.summary.music}`,
    '',
  ];

  if (manifest.context) {
    lines.push('## Context');
    if (manifest.context.brandColors) {
      lines.push(`- Brand Colors: ${manifest.context.brandColors.join(', ')}`);
    }
    if (manifest.context.restrictions) {
      lines.push(`- Restrictions: ${manifest.context.restrictions.join(', ')}`);
    }
    if (manifest.context.characterRef) {
      lines.push(`- Character Ref: ${manifest.context.characterRef}`);
    }
    lines.push('');
  }

  lines.push('## Generation Entries');
  lines.push('');

  for (const entry of manifest.entries) {
    lines.push(`### ${entry.id}: ${entry.type.toUpperCase()} (${entry.status})`);
    lines.push('');
    lines.push(`**Model:** ${entry.model}`);
    lines.push(`**Timestamp:** ${entry.timestamp}`);
    lines.push(`**Cost:** $${entry.cost?.totalCost?.toFixed(4) || '0.00'}`);
    lines.push('');
    lines.push('**Prompt:**');
    lines.push('```');
    lines.push(entry.prompt);
    lines.push('```');
    lines.push('');
    lines.push('**Parameters:**');
    lines.push('```json');
    lines.push(JSON.stringify(entry.parameters, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('**Output:**');
    for (const outputPath of entry.outputPaths) {
      lines.push(`- ${outputPath}`);
    }
    if (entry.referenceImagePath) {
      lines.push(`- Reference: ${entry.referenceImagePath}`);
    }
    lines.push('');
    if (entry.issues && entry.issues.length > 0) {
      lines.push('**Issues:**');
      for (const issue of entry.issues) {
        lines.push(`- ⚠️ ${issue}`);
      }
      lines.push('');
    }
    if (entry.reviewNotes) {
      lines.push(`**Review Notes:** ${entry.reviewNotes}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Save the manifest report as a markdown file
 */
export function saveManifestReport(manifestPath: string): string {
  const report = generateManifestReport(manifestPath);
  const reportPath = manifestPath.replace('.json', '-report.md');
  fs.writeFileSync(reportPath, report);
  return reportPath;
}

// =============================================================================
// ERROR HANDLING & RETRY UTILITIES
// =============================================================================

/**
 * Error codes for workflow failures
 */
export const WorkflowErrorCodes = {
  // API Errors
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  API_ERROR: 'API_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Input Errors
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Generation Errors
  GENERATION_FAILED: 'GENERATION_FAILED',
  NO_OUTPUT: 'NO_OUTPUT',
  PARTIAL_FAILURE: 'PARTIAL_FAILURE',

  // System Errors
  FFMPEG_ERROR: 'FFMPEG_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

type WorkflowErrorCode = typeof WorkflowErrorCodes[keyof typeof WorkflowErrorCodes];

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('quota exceeded') ||
      message.includes('resource exhausted') ||
      message.includes('too many requests')
    );
  }
  return false;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (isRateLimitError(error)) return true;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('500')
    );
  }
  return false;
}

/**
 * Get error code from error
 */
function getErrorCode(error: unknown): WorkflowErrorCode {
  if (isRateLimitError(error)) return WorkflowErrorCodes.RATE_LIMIT;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('quota')) return WorkflowErrorCodes.QUOTA_EXCEEDED;
    if (message.includes('not found') || message.includes('enoent')) return WorkflowErrorCodes.FILE_NOT_FOUND;
    if (message.includes('invalid')) return WorkflowErrorCodes.INVALID_INPUT;
  }

  return WorkflowErrorCodes.UNKNOWN_ERROR;
}

/**
 * Create a standardized error result
 */
function createErrorResult<T>(
  code: WorkflowErrorCode,
  message: string,
  details?: Record<string, unknown>
): WorkflowResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Execute a function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: string = 'operation'
): Promise<T> {
  const { maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && isRetryableError(error)) {
        console.warn(
          `[Workflow] ${context} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error instanceof Error ? error.message : 'Unknown error'}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Validate file exists and is readable
 */
function validateFile(filePath: string, description: string = 'File'): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${description} not found: ${filePath}`);
  }

  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch {
    throw new Error(`${description} is not readable: ${filePath}`);
  }
}

/**
 * Validate image file
 */
function validateImageFile(filePath: string): void {
  validateFile(filePath, 'Image file');

  const ext = path.extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
    throw new Error(`Invalid image file type: ${ext}. Supported: .png, .jpg, .jpeg, .webp, .gif`);
  }
}

/**
 * Get MIME type from file path
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function ensureDir(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getVeoModel(quality: VideoQuality): VeoModel {
  switch (quality) {
    case 'lite':
      return 'veo-3.1-lite-generate-preview';
    case 'fast':
      return 'veo-3.1-fast-generate-preview';
    case 'standard':
      return 'veo-3.1-generate-preview';
    case 'high':
      return 'veo-3-generate-preview';
    default:
      return 'veo-3.1-fast-generate-preview';
  }
}

function toVideoAspectRatio(ratio: AspectRatio | undefined): VideoAspectRatio {
  if (ratio === '4:5') return '9:16'; // Fallback for unsupported ratio
  return (ratio || '9:16') as VideoAspectRatio;
}

function getPlatformAspectRatio(platform: string): AspectRatio {
  switch (platform) {
    case 'tiktok':
    case 'instagram':
    case 'youtube-shorts':
      return '9:16';
    case 'youtube':
      return '16:9';
    case 'facebook':
      return '1:1';
    default:
      return '9:16';
  }
}

/**
 * Convert simplified personGeneration value to image API format
 * Image API: 'ALLOW_ALL' | 'ALLOW_ADULT' | 'ALLOW_NONE'
 */
function toImagePersonGeneration(value: 'allow' | 'block' | undefined): string | undefined {
  if (!value) return undefined; // Don't send if not specified
  return value === 'allow' ? 'ALLOW_ALL' : 'ALLOW_NONE';
}

/**
 * Convert simplified personGeneration value to video API format
 * Video API: 'allow' | 'dont_allow'
 */
function toVideoPersonGeneration(value: 'allow' | 'block' | undefined): 'allow' | 'dont_allow' {
  return value === 'block' ? 'dont_allow' : 'allow';
}

// =============================================================================
// WORKFLOW 1: TEXT TO TEXT
// =============================================================================

/**
 * Generate text from text prompt
 *
 * Use for: Scripts, captions, hooks, ad copy, content planning
 */
export async function generateText(
  input: TextToTextInput
): Promise<WorkflowResult<TextToTextOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }

  try {
    const result = await withRetry(
      () => gemini25Flash({
        systemPrompt: input.systemPrompt || 'You are a helpful content creator.',
        userPrompt: input.prompt,
      }),
      { maxRetries: 3 },
      'Text generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Text generation failed'
      );
    }

    return {
      success: true,
      data: {
        text: result.data.text,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { text: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during text generation';
    console.error(`[Workflow] generateText failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW: INFINITETALK LIP-SYNC (RunPod — audio-driven talking video)
// =============================================================================

/**
 * True lip-sync to a PROVIDED audio file via InfiniteTalk on RunPod serverless.
 *
 * Takes a character still + speech audio and returns a talking video whose
 * mouth follows the audio (video length follows the audio). This is the route
 * for syncing to user-supplied voice recordings — Omni cannot do it (policy
 * blocks photoreal-person + provided-speech) and Seedance needs OpenRouter.
 *
 * Flat pricing per request: 480p $0.25 · 720p $0.50. Requires RUNPOD_API_KEY.
 * The prompt describes ACTING only (posture/gesture/mood) — never the words.
 *
 * @example
 * await infiniteTalkLipsync({
 *   imagePath: 'kf-s1.png', audioPath: 'vo/scene1.wav',
 *   prompt: 'A man in a suit speaks into a studio microphone, calm and confident',
 *   resolution: '720p', outputPath: 'out/s1-talking.mp4',
 * });
 */
export async function infiniteTalkLipsync(
  input: InfiniteTalkInput
): Promise<WorkflowResult<InfiniteTalkOutput>> {
  if (!input.imagePath || !input.audioPath || !input.prompt || !input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'imagePath, audioPath, prompt, and outputPath are required');
  }
  const apiKey = process.env.RUNPOD_API_KEY;
  if (!apiKey) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'RUNPOD_API_KEY not set in .env');
  }

  try {
    for (const [label, p] of [['Image', input.imagePath], ['Audio', input.audioPath]] as const) {
      if (!fs.existsSync(p)) {
        return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `${label} not found: ${p}`);
      }
    }
    ensureDir(path.dirname(input.outputPath));

    const imgMime = getMimeType(input.imagePath);
    const audExt = path.extname(input.audioPath).toLowerCase().replace('.', '');
    const audMime = { wav: 'audio/wav', mp3: 'audio/mpeg', m4a: 'audio/mp4' }[audExt] || 'audio/wav';
    const resolution = input.resolution || '480p';
    const flatCost = resolution === '720p' ? 0.5 : 0.25;

    const fetchFn: typeof globalThis.fetch = (globalThis as any).fetch;
    const submit = await fetchFn('https://api.runpod.ai/v2/infinitetalk/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        input: {
          prompt: input.prompt,
          image: `data:${imgMime};base64,${fs.readFileSync(input.imagePath).toString('base64')}`,
          audio: `data:${audMime};base64,${fs.readFileSync(input.audioPath).toString('base64')}`,
          resolution,
          enable_safety_checker: true,
        },
      }),
    });
    if (!submit.ok) {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, `RunPod submit failed: ${submit.status} ${await submit.text()}`);
    }
    const job: any = await submit.json();
    if (!job.id) {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, `RunPod returned no job id: ${JSON.stringify(job).slice(0, 300)}`);
    }
    console.log(`[Workflow] InfiniteTalk job ${job.id} submitted (${resolution}, $${flatCost}) — polling...`);

    // Poll status up to ~15 min (cold starts + generation can take several minutes).
    let output: any = null;
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const st = await fetchFn(`https://api.runpod.ai/v2/infinitetalk/status/${job.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const s: any = await st.json();
      if (s.status === 'COMPLETED') { output = s.output; break; }
      if (s.status === 'FAILED' || s.status === 'CANCELLED') {
        return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, `InfiniteTalk job ${s.status}: ${JSON.stringify(s.error || s).slice(0, 500)}`);
      }
      if (i % 6 === 5) console.log(`[Workflow] InfiniteTalk ${s.status}... (${Math.round((i + 1) * 5 / 60)}min)`);
    }
    if (!output) {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, 'InfiniteTalk timed out after 15 minutes — check the job in the RunPod console');
    }

    // Handle the common serverless output shapes: URL or inline base64.
    const candidate = output.video_url || output.url || output.video || output.result
      || (Array.isArray(output) ? output[0] : null);
    if (!candidate || typeof candidate !== 'string') {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, `Unrecognized InfiniteTalk output shape: ${JSON.stringify(output).slice(0, 500)}`);
    }
    if (candidate.startsWith('http')) {
      const dl = await fetchFn(candidate);
      if (!dl.ok) return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, `Result download failed: ${dl.status}`);
      fs.writeFileSync(input.outputPath, Buffer.from(await dl.arrayBuffer()));
    } else {
      fs.writeFileSync(input.outputPath, Buffer.from(candidate.replace(/^data:video\/\w+;base64,/, ''), 'base64'));
    }

    console.log(`[Workflow] InfiniteTalk video saved: ${input.outputPath}`);
    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        cost: { totalCost: flatCost, breakdown: { lipsync: flatCost } },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during lip-sync';
    console.error(`[Workflow] infiniteTalkLipsync failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW: TRANSCRIBE AUDIO (Gemini 3.5 Flash multimodal — no OpenRouter needed)
// =============================================================================

/**
 * Transcribe an audio file with detailed timestamps via Gemini 3.5 Flash.
 *
 * Complements transcribeVideo (Whisper via OpenRouter): this path only needs
 * GEMINI_API_KEY and handles non-English speech (tested with Burmese) well.
 * Output format: one `[m:ss.d - m:ss.d] <spoken text>` line per phrase.
 *
 * @example
 * const r = await transcribeAudio({ audioPath: 'vo/scene1.wav', language: 'Burmese' });
 * console.log(r.data.transcript);
 */
export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<WorkflowResult<TranscribeAudioOutput>> {
  if (!input.audioPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'audioPath is required');
  }

  try {
    if (!fs.existsSync(input.audioPath)) {
      return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `Audio not found: ${input.audioPath}`);
    }
    const ext = path.extname(input.audioPath).toLowerCase().replace('.', '');
    const mime = { wav: 'audio/wav', mp3: 'audio/mp3', flac: 'audio/flac', m4a: 'audio/mp4', ogg: 'audio/ogg' }[ext] || 'audio/mp3';

    const result = await withRetry(
      () => gemini35Flash({
        systemPrompt: 'You are a precise transcription engine. Output only the transcript lines — no commentary, no translation, no markdown.',
        userPrompt:
          `Transcribe this audio verbatim${input.language ? ` (spoken language: ${input.language})` : ''} with detailed timestamps. ` +
          'Format EXACTLY one line per phrase/sentence: [m:ss.d - m:ss.d] <spoken text>. ' +
          'Timestamps accurate to tenths of a second, covering the full duration.',
        audioInput: fs.readFileSync(input.audioPath),
        audioMimeType: mime,
      }),
      { maxRetries: 2 },
      'Audio transcription'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Audio transcription failed'
      );
    }

    const transcript = result.data.text.trim();
    if (input.outputPath) {
      ensureDir(path.dirname(input.outputPath));
      fs.writeFileSync(input.outputPath, transcript);
    }

    return {
      success: true,
      data: {
        transcript,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { transcription: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during transcription';
    console.error(`[Workflow] transcribeAudio failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 2: IMAGE TO TEXT
// =============================================================================

/**
 * Analyze image and generate text
 *
 * Use for: Analyze product photos, describe scenes, extract info
 */
export async function analyzeImage(
  input: ImageToTextInput
): Promise<WorkflowResult<ImageToTextOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }

  try {
    // Validate image file
    validateImageFile(input.imagePath);

    const imageBuffer = fs.readFileSync(input.imagePath);
    const mimeType = getMimeType(input.imagePath);

    const result = await withRetry(
      () => gemini25Flash({
        systemPrompt: input.systemPrompt || 'You are an expert at analyzing images.',
        userPrompt: input.prompt,
        imageInput: imageBuffer,
        imageMimeType: mimeType,
      }),
      { maxRetries: 3 },
      'Image analysis'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Image analysis failed'
      );
    }

    return {
      success: true,
      data: {
        text: result.data.text,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { analysis: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during image analysis';
    console.error(`[Workflow] analyzeImage failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 3: TEXT TO IMAGE
// =============================================================================

/**
 * Generate a single image from text
 *
 * Use for: Thumbnails, single promotional images, hero images
 */
export async function generateSingleImage(
  input: TextToImageInput
): Promise<WorkflowResult<TextToImageOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    const imageConfig: Record<string, unknown> = {
      aspectRatio: input.aspectRatio || '9:16',
      imageSize: input.imageSize || '1K',
    };
    const personGen = toImagePersonGeneration(input.personGeneration);
    if (personGen) imageConfig.personGeneration = personGen;

    // 'pro' = Gemini 3 Pro Image (Nano Banana Pro) — use when the image must
    // contain readable typography; 'lite' = Nano Banana 2 Lite — cheapest,
    // for at-scale/preview work; 'flash' for everything else.
    const imageFn = input.imageModel === 'pro' ? gemini3ProImage
      : input.imageModel === 'lite' ? gemini31FlashLiteImage
      : gemini31FlashImage;
    const result = await withRetry(
      () => imageFn({
        userPrompt: input.prompt,
        config: imageConfig,
      }),
      { maxRetries: 3 },
      'Image generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Image generation failed'
      );
    }

    if (!result.data.images.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No image was generated');
    }

    // Write file with error handling
    try {
      fs.writeFileSync(input.outputPath, result.data.images[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save image: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Image saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        imagePath: input.outputPath,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { image: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during image generation';
    console.error(`[Workflow] generateSingleImage failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 4: IMAGE TO IMAGE
// =============================================================================

/**
 * Generate image variation from reference
 *
 * Use for: Product variations, style transfer, character in different scenes
 */
/**
 * E-commerce product-shot presets → scene/lighting prompt templates, applied
 * on top of a REAL product reference image (never generate a product from
 * text — RULES 4). The fidelity clause below is appended automatically.
 * Channel guidance + when-to-use: workflows/PRODUCT-SHOT-GUIDE.md.
 */
export const PRODUCT_SHOTS: Record<ProductShot, string> = {
  // --- Studio / marketplace ---
  'pure-white-packshot':
    'Place the product from the reference image centered on a pure white background, soft studio lighting, realistic shadow directly under the product, e-commerce packshot style, no props, no extra objects.',
  'soft-gray-hero':
    'Place the product from the reference image in a clean studio setup with a light gray seamless background, soft diffused lighting, subtle natural shadow, product fully visible, sharp edges, realistic reflections if the material is glossy, premium e-commerce photography.',
  'floating-shadow':
    'Turn the product from the reference image into a floating studio product image on a clean neutral background, soft shadow below to ground it, all visible details realistic and accurate.',
  'flat-lay':
    'Create a top-down flat lay of the product from the reference image on a clean studio surface, shot from directly above, balanced composition, soft even lighting, realistic material texture, minimal shadow, commercial product photography style.',
  // --- Scale & buying confidence ---
  'multi-angle':
    'Create a clean product composition showing the product from the reference image from front, side, and slightly angled views in one frame, consistent lighting, neutral background, catalog-ready.',
  'open-closed':
    'Show the product from the reference image in both closed and open state in one clean composition, simple studio background, realistic shadow, e-commerce comparison layout.',
  'texture-closeup':
    'Create a close-up detail image of the product from the reference image focused on material texture, stitching, finish, or surface quality, realistic macro-style lighting, sharp detail, premium product photography.',
  'in-hand-scale':
    'Show the product from the reference image being held naturally in one hand to communicate scale, realistic proportions, clean background, clear focus on the product, no distortion, e-commerce lifestyle photography.',
  // --- Lifestyle / context ---
  'natural-habitat':
    'Place the product from the reference image in its natural real-life environment, styled realistically, believable lighting and shadows, authentic commercial photography look.',
  'minimal-interior':
    'Place the product from the reference image in a modern minimal interior, clean composition, neutral styling, realistic daylight, the product remains the hero, no clutter, editorial e-commerce photography.',
  'outdoor-lifestyle':
    'Place the product from the reference image in an outdoor setting that matches its use, natural light, realistic environment, accurate texture and color, product clearly visible, premium lifestyle product photography.',
  'desk-context':
    'Place the product from the reference image in a realistic desk setup with complementary objects, clean arrangement, soft window light, the product as the focal point, modern commercial photography.',
  'hands-usage':
    'Show the product from the reference image being used by hands only, no full person visible, realistic interaction, clean composition, natural lighting, product details accurate and in focus.',
  'model-usage':
    'Show a model naturally using the product from the reference image in a realistic setting, product clearly visible, natural pose, commercial lifestyle photography.',
  'hands-premium':
    'Show elegant hands interacting with the product from the reference image, no face visible, clean composition, shallow depth of field, realistic commercial lighting, focus on product and usage.',
  'in-use-closeup':
    'Close-up of the product from the reference image being applied or used, with the product visible in the frame in soft focus context, natural daylight, the action in sharp focus.',
  // --- Mood / style ---
  'luxury-dark':
    'Place the product from the reference image on a dark marble surface with gold accents, soft directional lighting, dark blurred background for depth, premium luxury product photography.',
  'rustic-artisan':
    'Place the product from the reference image on a weathered wooden crate with a burlap cloth, warm afternoon sunlight from a nearby window, handmade artisan mood.',
  'colorful-pop':
    'Place the product from the reference image on a bright coral surface against a bold teal background, with a few tropical leaves and citrus slices, vivid pop-art lighting, color-blocked social-feed style.',
  'moody-editorial':
    'Place the product from the reference image on a dark slate surface with dramatic side lighting, wisps of smoke or mist in the background, deep shadows and rich contrast, editorial mood.',
  // --- Seasonal / merchandising ---
  'spring-fresh':
    'Place the product from the reference image in a fresh spring-themed scene, light airy styling, soft natural light, clean composition, subtle seasonal details.',
  'summer-bright':
    'Place the product from the reference image in a bright summer setting, warm natural light, fresh energetic atmosphere, clean composition, realistic shadows.',
  'winter-snow':
    'Place the product from the reference image in a crisp snowy setting, bright winter light, clean composition, fresh seasonal mood, realistic reflections and shadows.',
  'cozy-holiday':
    'Place the product from the reference image on a cozy knitted blanket surrounded by pine cones, cinnamon sticks, and warm fairy lights, winter holiday atmosphere.',
  'holiday-gift':
    'Place the product from the reference image in a festive gifting season scene, elegant celebratory styling, clean composition, realistic lighting, premium seasonal atmosphere.',
  'black-friday':
    'Place the product from the reference image in a bold Black Friday themed campaign scene, strong commercial composition, high-contrast lighting, modern promotional feel.',
};

/** Appended to every product-shot preset — fidelity is non-negotiable for e-commerce. */
const PRODUCT_SHOT_FIDELITY =
  'Keep the exact shape, proportions, branding, label text, colors, and material finish of the product from the reference image.';

export async function generateImageVariation(
  input: ImageToImageInput
): Promise<WorkflowResult<ImageToImageOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (input.productShot && !PRODUCT_SHOTS[input.productShot]) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      `Unknown productShot "${input.productShot}". Valid: ${Object.keys(PRODUCT_SHOTS).join(', ')}`
    );
  }

  const refPaths = [
    ...(input.referenceImagePath ? [input.referenceImagePath] : []),
    ...(input.referenceImagePaths || []),
  ];
  if (refPaths.length === 0) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      'Provide referenceImagePath and/or referenceImagePaths (max 5 total)'
    );
  }
  if (refPaths.length > 5) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      `At most 5 reference images per request (got ${refPaths.length})`
    );
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  try {
    // Validate reference images
    refPaths.forEach((p) => validateImageFile(p));

    ensureDir(path.dirname(input.outputPath));

    const [primaryPath, ...extraPaths] = refPaths;
    const referenceImage = fs.readFileSync(primaryPath);
    const mimeType = getMimeType(primaryPath);
    const extraImages = extraPaths.map((p) => ({
      data: fs.readFileSync(p),
      mimeType: getMimeType(p),
    }));

    const imageConfig: Record<string, unknown> = {
      aspectRatio: input.aspectRatio || '9:16',
      imageSize: input.imageSize || '1K',
    };
    const personGen = toImagePersonGeneration(input.personGeneration);
    if (personGen) imageConfig.personGeneration = personGen;

    const variationFn = input.imageModel === 'pro' ? gemini3ProImage
      : input.imageModel === 'lite' ? gemini31FlashLiteImage
      : gemini31FlashImage;
    const prompt = input.productShot
      ? `${PRODUCT_SHOTS[input.productShot]} ${PRODUCT_SHOT_FIDELITY} ${input.prompt}`
      : input.prompt;
    const result = await withRetry(
      () => variationFn({
        userPrompt: prompt,
        imageInput: referenceImage,
        imageMimeType: mimeType,
        imageInputs: extraImages.length ? extraImages : undefined,
        config: imageConfig,
      }),
      { maxRetries: 3 },
      'Image variation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Image variation failed'
      );
    }

    if (!result.data.images.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No image was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.images[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save image: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Image variation saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        imagePath: input.outputPath,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { image: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during image variation';
    console.error(`[Workflow] generateImageVariation failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 5: TEXT TO CAROUSEL
// =============================================================================

/**
 * Generate carousel images from text
 *
 * Use for: Instagram carousels, educational slides, product showcases
 */
export async function generateCarousel(
  input: TextToCarouselInput
): Promise<WorkflowResult<TextToCarouselOutput>> {
  // Validate input
  if (!input.topic || input.topic.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Topic is required');
  }

  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  if (!input.slideCount || input.slideCount < 1 || input.slideCount > 20) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Slide count must be between 1 and 20');
  }

  try {
    ensureDir(input.outputDir);

    const aspectRatio = input.aspectRatio || getPlatformAspectRatio(input.platform);
    const imagePaths: string[] = [];
    const failedSlides: number[] = [];
    let totalCost = 0;

    // Generate slide content if not provided
    let slides = input.slides;
    if (!slides || slides.length === 0) {
      console.log('[Workflow] Planning carousel content...');

      const planResult = await withRetry(
        () => gemini25Flash({
          systemPrompt: `You are a carousel content planner. Create ${input.slideCount} slides for a ${input.style} carousel.`,
          userPrompt: `Topic: ${input.topic}\n\nCreate ${input.slideCount} slides. For each slide, provide:\n- title (short, catchy)\n- content (1-2 sentences)\n\nFormat as JSON array: [{"title": "...", "content": "..."}, ...]`,
        }),
        { maxRetries: 2 },
        'Carousel planning'
      );

      if (planResult.success) {
        try {
          const jsonMatch = planResult.data.text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            slides = JSON.parse(jsonMatch[0]);
          }
        } catch {
          console.warn('[Workflow] Failed to parse slide plan, using defaults');
        }
        totalCost += planResult.data.cost.totalCost;
      }
    }

    // Default slides if planning failed
    if (!slides || slides.length === 0) {
      slides = Array.from({ length: input.slideCount }, (_, i) => ({
        title: `Slide ${i + 1}`,
        content: input.topic,
      }));
    }

    // Generate style-specific prompts
    const stylePrompts: Record<CarouselStyle, string> = {
      educational: 'Clean minimalist design, professional, easy to read text layout, white background',
      'product-showcase': 'Premium product photography, elegant, spotlight lighting, gradient background',
      story: 'Cinematic, emotional, lifestyle photography style, warm tones',
      testimonial: 'Authentic, trustworthy, person-focused, soft lighting',
      comparison: 'Split layout, clear contrast, side by side comparison',
      stats: 'Bold typography, data visualization, modern infographic style',
    };

    const baseStyle = stylePrompts[input.style] || stylePrompts.educational;

    // Generate each slide with retry
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideNum = String(i + 1).padStart(2, '0');

      const prompt = slide.prompt || `
${baseStyle}

Slide ${i + 1} of ${slides.length}:
Title: ${slide.title || ''}
Content: ${slide.content || ''}

Create a visually appealing slide image. Do NOT include any text - text will be added in post-production.
Focus on imagery that represents the concept.
      `.trim();

      console.log(`[Workflow] Generating slide ${i + 1}/${slides.length}...`);

      try {
        const result = await withRetry(
          () => gemini31FlashImage({
            userPrompt: prompt,
            config: {
              aspectRatio,
              imageSize: '1K',
            },
          }),
          { maxRetries: 2, initialDelayMs: 2000 },
          `Slide ${i + 1} generation`
        );

        if (result.success && result.data.images.length > 0) {
          const outputPath = path.join(input.outputDir, `slide-${slideNum}.png`);
          try {
            fs.writeFileSync(outputPath, result.data.images[0].data);
            imagePaths.push(outputPath);
            totalCost += result.data.cost.totalCost;
          } catch (writeError) {
            console.error(`[Workflow] Failed to save slide ${i + 1}: ${writeError}`);
            failedSlides.push(i + 1);
          }
        } else {
          failedSlides.push(i + 1);
        }
      } catch (slideError) {
        console.error(`[Workflow] Slide ${i + 1} failed after retries: ${slideError}`);
        failedSlides.push(i + 1);
      }

      // Small delay between requests to avoid rate limits
      await sleep(1500);
    }

    // Check if we generated any slides
    if (imagePaths.length === 0) {
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        'Failed to generate any carousel slides'
      );
    }

    // Save slides data for reference
    try {
      const slidesDataPath = path.join(input.outputDir, 'slides-data.json');
      fs.writeFileSync(slidesDataPath, JSON.stringify(slides, null, 2));
    } catch {
      console.warn('[Workflow] Failed to save slides metadata');
    }

    console.log(`[Workflow] Carousel complete: ${imagePaths.length}/${slides.length} slides generated`);

    // Partial success if some slides failed
    if (failedSlides.length > 0) {
      return {
        success: true,
        data: {
          imagePaths,
          slidesData: slides,
          cost: {
            totalCost,
            breakdown: { images: totalCost },
          },
        },
        error: {
          code: WorkflowErrorCodes.PARTIAL_FAILURE,
          message: `Some slides failed to generate: ${failedSlides.join(', ')}`,
        },
      };
    }

    return {
      success: true,
      data: {
        imagePaths,
        slidesData: slides,
        cost: {
          totalCost,
          breakdown: { images: totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during carousel generation';
    console.error(`[Workflow] generateCarousel failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 6: IMAGE TO CAROUSEL
// =============================================================================

/**
 * Generate carousel with reference image
 *
 * Use for: Product carousel, character-based slides
 */
export async function generateCarouselFromRef(
  input: ImageToCarouselInput
): Promise<WorkflowResult<ImageToCarouselOutput>> {
  // Validate input
  if (!input.referenceImagePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Reference image path is required');
  }

  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  if (!input.slideCount || input.slideCount < 1 || input.slideCount > 20) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Slide count must be between 1 and 20');
  }

  try {
    // Validate reference image
    validateImageFile(input.referenceImagePath);

    ensureDir(input.outputDir);

    const referenceImage = fs.readFileSync(input.referenceImagePath);
    const mimeType = getMimeType(input.referenceImagePath);
    const aspectRatio = input.aspectRatio || getPlatformAspectRatio(input.platform);
    const imagePaths: string[] = [];
    const failedSlides: number[] = [];
    let totalCost = 0;

    // Generate slide content if not provided
    let slides = input.slides;
    if (!slides || slides.length === 0) {
      slides = Array.from({ length: input.slideCount }, (_, i) => ({
        title: `Slide ${i + 1}`,
        content: `${input.topic} - variation ${i + 1}`,
      }));
    }

    // Generate each slide with reference
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideNum = String(i + 1).padStart(2, '0');

      const prompt = slide.prompt || `
Use this reference image as the main subject.
Create slide ${i + 1} of ${slides.length}: ${slide.title || ''} - ${slide.content || ''}
Style: ${input.style}
Do NOT include any text in the image.
      `.trim();

      console.log(`[Workflow] Generating slide ${i + 1}/${slides.length} from reference...`);

      try {
        const result = await withRetry(
          () => gemini31FlashImage({
            userPrompt: prompt,
            imageInput: referenceImage,
            imageMimeType: mimeType,
            config: {
              aspectRatio,
              imageSize: '1K',
            },
          }),
          { maxRetries: 2, initialDelayMs: 2000 },
          `Slide ${i + 1} generation`
        );

        if (result.success && result.data.images.length > 0) {
          const outputPath = path.join(input.outputDir, `slide-${slideNum}.png`);
          try {
            fs.writeFileSync(outputPath, result.data.images[0].data);
            imagePaths.push(outputPath);
            totalCost += result.data.cost.totalCost;
          } catch (writeError) {
            console.error(`[Workflow] Failed to save slide ${i + 1}: ${writeError}`);
            failedSlides.push(i + 1);
          }
        } else {
          failedSlides.push(i + 1);
        }
      } catch (slideError) {
        console.error(`[Workflow] Slide ${i + 1} failed after retries: ${slideError}`);
        failedSlides.push(i + 1);
      }

      await sleep(1500);
    }

    // Check if we generated any slides
    if (imagePaths.length === 0) {
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        'Failed to generate any carousel slides'
      );
    }

    // Save slides data
    try {
      const slidesDataPath = path.join(input.outputDir, 'slides-data.json');
      fs.writeFileSync(slidesDataPath, JSON.stringify(slides, null, 2));
    } catch {
      console.warn('[Workflow] Failed to save slides metadata');
    }

    console.log(`[Workflow] Carousel complete: ${imagePaths.length}/${slides.length} slides generated`);

    // Partial success if some slides failed
    if (failedSlides.length > 0) {
      return {
        success: true,
        data: {
          imagePaths,
          slidesData: slides,
          cost: {
            totalCost,
            breakdown: { images: totalCost },
          },
        },
        error: {
          code: WorkflowErrorCodes.PARTIAL_FAILURE,
          message: `Some slides failed to generate: ${failedSlides.join(', ')}`,
        },
      };
    }

    return {
      success: true,
      data: {
        imagePaths,
        slidesData: slides,
        cost: {
          totalCost,
          breakdown: { images: totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during carousel generation';
    console.error(`[Workflow] generateCarouselFromRef failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// CAMERA-MOVE PRESET LIBRARY (Veo + Omni Flash)
// =============================================================================

/**
 * Camera-movement presets — each value is a full four-part prompt block
 * (Movement / Speed / Framing / End) designed to LEAD the video prompt.
 * Pass the id as `cameraMove` on generateSilentVideo / generateVideoFromImage /
 * generateOmniVideoClip, or paste the block manually at the head of any scene
 * prompt (voiceover scenes, speaking videos, Seedance).
 * When-to-use table: VIDEO-PROMPT-GUIDE.md §2b.
 */
export const CAMERA_MOVES: Record<CameraMove, string> = {
  // --- Pan / Tilt ---
  'static':
    'locked-off static shot. Movement: hold one fixed camera position for the full clip. Speed: still and steady. Framing: keep the same angle, height, lens distance and composition. End: finish with the same framing and camera position.',
  'pan-right':
    'pan right. Movement: rotate the camera horizontally from left to right from one fixed point. Speed: smooth constant rotation. Framing: keep the horizon level while new space enters from the right side of the frame. End: settle on a clear final composition.',
  'pan-left':
    'pan left. Movement: rotate the camera horizontally from right to left from one fixed point. Speed: smooth constant rotation. Framing: keep the horizon level while new space enters from the left side of the frame. End: settle on a clear final composition.',
  'whip-pan-right':
    'whip pan right. Movement: rotate rapidly from the starting direction toward a new target on the right. Speed: fast snap with brief motion blur during the rotation. Framing: begin on one readable composition and land on a second readable target. End: settle into a sharp final frame.',
  'whip-pan-left':
    'whip pan left. Movement: rotate rapidly from the starting direction toward a new target on the left. Speed: fast snap with brief motion blur during the rotation. Framing: begin on one readable composition and land on a second readable target. End: settle into a sharp final frame.',
  'tilt-up':
    'tilt up. Movement: rotate the camera upward from one fixed point. Speed: smooth constant tilt. Framing: keep the vertical subject or architecture centered as the frame travels upward. End: land on the upper target.',
  'tilt-down':
    'tilt down. Movement: rotate the camera downward from one fixed point. Speed: smooth constant tilt. Framing: keep the vertical subject or architecture centered as the frame travels downward. End: land on the lower target.',
  // --- Zoom / Lens ---
  'slow-zoom-in':
    'slow zoom in. Movement: slowly increase lens focal length toward a tighter frame. Speed: gradual and even. Framing: keep the main visual target readable as it becomes larger in frame. End: finish on a stable tighter composition.',
  'slow-zoom-out':
    'slow zoom out. Movement: slowly decrease lens focal length toward a wider frame. Speed: gradual and even. Framing: keep the main visual target readable as more surrounding space appears. End: finish on a stable wider composition.',
  'fast-zoom-in':
    'fast zoom in. Movement: quickly increase lens focal length toward the main visual target. Speed: quick decisive zoom. Framing: keep the target centered or clearly readable during the scale change. End: finish on a stable tighter composition.',
  'fast-zoom-out':
    'fast zoom out. Movement: quickly decrease lens focal length away from the main visual target. Speed: quick decisive zoom. Framing: keep the target readable as the surrounding space appears. End: finish on a stable wider composition.',
  'crash-zoom-in':
    'crash zoom in. Movement: snap the lens rapidly toward the main visual target. Speed: very fast and punchy. Framing: keep the target readable through the sudden scale change. End: land on a bold tighter composition.',
  'crash-zoom-out':
    'crash zoom out. Movement: snap the lens rapidly away from the main visual target. Speed: very fast and punchy. Framing: keep the target readable as the surrounding space appears. End: land on a bold wider composition.',
  // --- Dolly / Track ---
  'dolly-in':
    'dolly in. Movement: move the camera physically forward in a straight line toward the main subject. Speed: smooth controlled push. Framing: keep camera height, lens direction and subject position consistent while distance closes. End: finish in a tighter composition.',
  'dolly-out':
    'dolly out. Movement: move the camera physically backward in a straight line away from the main subject. Speed: smooth controlled retreat. Framing: keep lens direction and camera height consistent while more environment enters frame. End: finish in a wider composition.',
  'tracking':
    "tracking shot. Movement: move through the scene with the main subject. Speed: match the subject's pace. Framing: keep the subject consistently readable while the environment moves around them. End: maintain a clear moving composition.",
  'follow':
    "follow shot from behind. Movement: move behind the subject along their route at shoulder height. Speed: match the subject's pace. Framing: keep the back, shoulder or head as the foreground guide while the route ahead stays readable. End: continue following with the subject leading the frame.",
  'reverse-tracking':
    "reverse tracking shot. Movement: move backward in front of the walking subject. Speed: match the subject's forward pace. Framing: keep front-facing face and body framing stable as the background moves behind them. End: hold a clear front-facing moving composition.",
  'side-tracking':
    "side tracking shot. Movement: move parallel beside the subject along their direction of travel. Speed: match the subject's motion. Framing: keep the subject in side profile or three-quarter profile at a stable distance. End: continue the parallel movement with clear horizontal motion.",
  'low-tracking':
    "low tracking shot. Movement: move at ground or below-waist height alongside the subject's movement path. Speed: match the subject, footsteps or wheels. Framing: keep the low detail readable while the ground plane moves through frame. End: finish with the low perspective clearly maintained.",
  'vehicle-tracking':
    "vehicle tracking shot. Movement: move with the vehicle along its route. Speed: match the vehicle's pace. Framing: keep the vehicle stable in frame while the road or environment moves past. End: maintain a clear moving vehicle composition.",
  'chase':
    'chase shot. Movement: follow a moving subject quickly along the action route. Speed: fast, reactive and physically close. Framing: keep the subject visible while allowing energetic reframing. End: stay connected to the subject in motion.',
  // --- Physical moves ---
  'truck-right':
    'truck right. Movement: move the camera physically to the right on a straight horizontal path. Speed: smooth constant lateral travel. Framing: keep the lens facing the same direction while the scene slides across frame. End: finish on a clean lateral composition.',
  'truck-left':
    'truck left. Movement: move the camera physically to the left on a straight horizontal path. Speed: smooth constant lateral travel. Framing: keep the lens facing the same direction while the scene slides across frame. End: finish on a clean lateral composition.',
  'pedestal-up':
    'pedestal up. Movement: move the entire camera vertically upward in a straight line. Speed: smooth constant lift. Framing: keep the lens level and pointed in the same direction during the vertical move. End: finish with the higher framing clearly readable.',
  'pedestal-down':
    'pedestal down. Movement: move the entire camera vertically downward in a straight line. Speed: smooth constant descent. Framing: keep the lens level and pointed in the same direction during the vertical move. End: finish with the lower framing clearly readable.',
  'slider-right':
    'slider right. Movement: slide the camera a small distance to the right. Speed: slow controlled constant motion. Framing: keep foreground, subject and background layers readable as parallax shifts. End: finish on a refined composition with the new right-side angle visible.',
  'slider-left':
    'slider left. Movement: slide the camera a small distance to the left. Speed: slow controlled constant motion. Framing: keep foreground, subject and background layers readable as parallax shifts. End: finish on a refined composition with the new left-side angle visible.',
  'push-past':
    'push past. Movement: move forward past a visible foreground object, edge or opening. Speed: smooth forward glide. Framing: let the foreground pass close to the lens while the space beyond becomes clearer. End: arrive inside or beyond the foreground layer.',
  'arc-right':
    'arc right. Movement: move on a shallow curved path around the main subject toward the right side. Speed: smooth measured curve. Framing: keep distance, height and subject readability consistent while the angle changes. End: finish from a new right-side angle.',
  'arc-left':
    'arc left. Movement: move on a shallow curved path around the main subject toward the left side. Speed: smooth measured curve. Framing: keep distance, height and subject readability consistent while the angle changes. End: finish from a new left-side angle.',
  'orbit-clockwise':
    'clockwise orbit. Movement: circle clockwise around the main subject at a consistent radius. Speed: smooth controlled orbit. Framing: keep the subject centered while the background rotates around them. End: complete the intended arc or full circle with stable framing.',
  'orbit-counterclockwise':
    'counterclockwise orbit. Movement: circle counterclockwise around the main subject at a consistent radius. Speed: smooth controlled orbit. Framing: keep the subject centered while the background rotates around them. End: complete the intended arc or full circle with stable framing.',
  // --- Human camera ---
  'handheld':
    'handheld shot. Movement: hold the camera at human operator height with natural body movement. Speed: responsive and organic. Framing: keep the subject readable while the frame has subtle sway and micro-adjustments. End: finish with a natural handheld composition.',
  'snorricam':
    "body-mounted Snorricam. Movement: keep the camera fixed relative to the subject's torso or face while the subject moves. Speed: match the subject's body motion. Framing: keep the subject close, centered and facing the camera as the background moves around them. End: finish with the subject still locked in frame.",
  // --- Drone / Crane ---
  'crane-up':
    'crane up. Movement: travel smoothly upward through open space. Speed: slow controlled vertical lift. Framing: keep the subject or location readable as the camera rises. End: finish with the higher scale clearly visible.',
  'crane-down':
    'crane down. Movement: travel smoothly downward through open space. Speed: slow controlled vertical descent. Framing: keep the subject or location readable as the camera descends. End: finish with the lower subject or destination clearly visible.',
  'drone-push-in':
    'drone push in. Movement: fly smoothly forward through open space toward the subject or destination. Speed: controlled aerial glide. Framing: keep the route and destination readable as the camera approaches. End: arrive at a closer aerial composition.',
  'drone-pull-back':
    'drone pull back. Movement: fly smoothly backward away from the subject or destination. Speed: controlled aerial retreat. Framing: keep the subject readable as more landscape appears. End: finish on a wider aerial composition.',
  'helicopter':
    'helicopter-style aerial shot. Movement: move from high altitude along a broad gradual flight path. Speed: steady controlled aerial motion. Framing: keep the landscape or distant moving subject readable at wide scale. End: finish on a stable high-altitude composition.',
  // --- Specials ---
  'first-person':
    "first-person view. Movement: move forward at human eye height from the character's perspective. Speed: natural walking or reaching pace. Framing: use visible hands, arms or body edges as the viewer's physical reference. End: arrive at the next point of action from the same point of view.",
  'tilt-shift':
    'tilt-shift miniature view. Movement: hold or glide from a high angled view over the scene. Speed: small precise movement. Framing: keep a narrow band of sharp focus across the key subject area with soft blur above and below. End: finish with the miniature-scale view intact.',
  'infinite-zoom':
    'infinite zoom. Movement: zoom continuously inward toward the exact center target. Speed: smooth accelerating zoom. Framing: keep the circular target centered as it expands. End: finish when the next visual world fills the frame.',
  'earth-zoom-out':
    'earth zoom out. Movement: pull upward from the starting point through street, city, landscape and planet scale. Speed: rapid expanding zoom out. Framing: keep the original location centered as scale grows. End: finish on a planet-scale view with the starting point still implied at center.',
  'time-lapse':
    'locked-camera time-lapse. Movement: hold one fixed camera position while time moves rapidly forward. Speed: fast time compression with a stable camera. Framing: keep the same composition and horizon as motion passes through the frame. End: finish from the same camera angle with visible passage of time.',
  'pass-through':
    'pass-through movement. Movement: move forward toward a visible object, surface or barrier and continue into the space beyond. Speed: smooth centered glide. Framing: keep the opening or surface centered as the transition point. End: arrive inside the revealed space beyond.',
};

/** Prepend a camera-move preset block to a prompt (no-op when move is unset). */
function applyCameraMove(prompt: string, move?: CameraMove): string {
  return move && CAMERA_MOVES[move] ? `${CAMERA_MOVES[move]} ${prompt}` : prompt;
}

/** INVALID_INPUT result for an unrecognized cameraMove id, or null when valid. */
function validateCameraMove(move?: CameraMove): WorkflowResult<never> | null {
  if (move && !CAMERA_MOVES[move]) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      `Unknown cameraMove "${move}". Valid: ${Object.keys(CAMERA_MOVES).join(', ')}`
    );
  }
  return null;
}

// =============================================================================
// WORKFLOW 7: TEXT TO VIDEO SILENT
// =============================================================================

/**
 * Generate silent video from text
 *
 * Use for: B-roll, ambient video, video to add audio later
 */
export async function generateSilentVideo(
  input: TextToVideoSilentInput
): Promise<WorkflowResult<TextToVideoSilentOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  if (input.duration && (input.duration < 1 || input.duration > 60)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Duration must be between 1 and 60 seconds');
  }

  const cameraMoveError = validateCameraMove(input.cameraMove);
  if (cameraMoveError) return cameraMoveError;

  try {
    ensureDir(path.dirname(input.outputPath));

    const model = getVeoModel(input.quality || 'fast');

    console.log(`[Workflow] Generating silent video (${input.duration || 5}s, ${input.quality || 'fast'})...`);

    // Build video config - only include personGeneration if explicitly specified
    const videoConfig: Record<string, unknown> = {
      aspectRatio: toVideoAspectRatio(input.aspectRatio),
      durationSeconds: input.duration,
    };
    if (input.personGeneration) {
      videoConfig.personGeneration = toVideoPersonGeneration(input.personGeneration);
    }

    const result = await withRetry(
      () => generateVideo({
        model,
        prompt: applyCameraMove(input.prompt, input.cameraMove),
        config: videoConfig,
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Video generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Video generation failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.videos[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save video: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Video saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration: input.duration || 5,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during video generation';
    console.error(`[Workflow] generateSilentVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 8: TEXT TO VIDEO SPEAKING
// =============================================================================

/**
 * Generate video with character speaking
 *
 * Use for: Testimonials, UGC, talking head content
 */
export async function generateSpeakingVideo(
  input: TextToVideoSpeakingInput
): Promise<WorkflowResult<TextToVideoSpeakingOutput>> {
  // Validate input
  if (!input.characterDescription || input.characterDescription.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Character description is required');
  }

  if (!input.dialogue || input.dialogue.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Dialogue is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  if (input.duration && (input.duration < 1 || input.duration > 60)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Duration must be between 1 and 60 seconds');
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    const model = getVeoModel(input.quality || 'fast');

    // Build prompt with dialogue (NO TEXT OVERLAYS)
    const prompt = `
${input.characterDescription}

${input.environment || 'Neutral background, professional lighting'}

The character looks at camera and says "${input.dialogue}" in a ${input.voiceDescription || 'natural, conversational voice'}.
Natural, authentic performance. Cinematic quality.
    `.trim();

    console.log(`[Workflow] Generating speaking video (${input.duration || 8}s)...`);

    const result = await withRetry(
      () => generateVideo({
        model,
        prompt,
        config: {
          aspectRatio: toVideoAspectRatio(input.aspectRatio),
          durationSeconds: input.duration,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Speaking video generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Speaking video generation failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.videos[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save video: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Speaking video saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration: input.duration || 8,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during speaking video generation';
    console.error(`[Workflow] generateSpeakingVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 9: IMAGE TO VIDEO SILENT
// =============================================================================

/**
 * Generate video from reference image
 *
 * Use for: Product video from photo, consistent character video
 */
export async function generateVideoFromImage(
  input: ImageToVideoSilentInput
): Promise<WorkflowResult<ImageToVideoSilentOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }

  if (!input.referenceImagePath && !input.referenceImagePaths?.length) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      'Provide referenceImagePath (first frame) and/or referenceImagePaths (up to 3 asset references)'
    );
  }

  if (input.referenceImagePaths && input.referenceImagePaths.length > 3) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      `Veo accepts at most 3 asset reference images (got ${input.referenceImagePaths.length}). For 4-5 refs use generateOmniVideoClip (reference_to_video).`
    );
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  if (input.duration && (input.duration < 1 || input.duration > 60)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Duration must be between 1 and 60 seconds');
  }

  const cameraMoveError = validateCameraMove(input.cameraMove);
  if (cameraMoveError) return cameraMoveError;

  try {
    // Validate reference images
    if (input.referenceImagePath) validateImageFile(input.referenceImagePath);
    input.referenceImagePaths?.forEach((p) => validateImageFile(p));

    ensureDir(path.dirname(input.outputPath));

    const referenceImage = input.referenceImagePath
      ? fs.readFileSync(input.referenceImagePath)
      : undefined;
    const mimeType = input.referenceImagePath
      ? getMimeType(input.referenceImagePath)
      : undefined;
    const referenceImages = input.referenceImagePaths?.map((p) => ({
      data: fs.readFileSync(p),
      mimeType: getMimeType(p),
    }));
    const model = getVeoModel(input.quality || 'fast');

    console.log(
      `[Workflow] Generating video from image (${input.duration || 5}s${referenceImages ? `, ${referenceImages.length} asset refs` : ''})...`
    );

    const result = await withRetry(
      () => generateVideo({
        model,
        prompt: applyCameraMove(input.prompt, input.cameraMove),
        referenceImage,
        referenceImageMimeType: mimeType,
        referenceImages,
        config: {
          aspectRatio: toVideoAspectRatio(input.aspectRatio),
          durationSeconds: input.duration,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Video from image generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Video generation from image failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.videos[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save video: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Video saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration: input.duration || 5,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during video from image generation';
    console.error(`[Workflow] generateVideoFromImage failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 9A: KEYFRAME GENERATION (First Frame)
// =============================================================================

/**
 * Generate a keyframe image to use as the first frame for video generation.
 *
 * This ensures visual consistency - the video will start from this exact image.
 * Use this before generateVideoFromKeyframe() for character/product consistency.
 *
 * @see VIDEO-PROMPT-GUIDE.md for keyframe best practices
 */
export async function generateKeyframe(
  input: KeyframeInput
): Promise<WorkflowResult<KeyframeOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    console.log(`[Workflow] Generating keyframe image...`);

    // Use image generation for the keyframe
    let result;

    if (input.referenceImagePath) {
      // Generate with reference for consistency
      validateImageFile(input.referenceImagePath);
      const referenceImage = fs.readFileSync(input.referenceImagePath);
      const refMimeType = getMimeType(input.referenceImagePath);

      result = await withRetry(
        () => gemini31FlashImage({
          userPrompt: input.prompt,
          imageInput: referenceImage,
          imageMimeType: refMimeType,
          config: {
            aspectRatio: input.aspectRatio || '9:16',
            personGeneration: input.personGeneration === 'allow' ? 'ALLOW' : 'DONT_ALLOW',
          },
        }),
        { maxRetries: 2, initialDelayMs: 2000 },
        'Keyframe generation'
      );
    } else {
      // Generate from text only
      result = await withRetry(
        () => gemini31FlashImage({
          userPrompt: input.prompt,
          config: {
            aspectRatio: input.aspectRatio || '9:16',
            personGeneration: input.personGeneration === 'allow' ? 'ALLOW' : 'DONT_ALLOW',
          },
        }),
        { maxRetries: 2, initialDelayMs: 2000 },
        'Keyframe generation'
      );
    }

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Keyframe generation failed'
      );
    }

    if (!result.data.images.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No keyframe was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.images[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save keyframe: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Keyframe saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        imagePath: input.outputPath,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { image: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during keyframe generation';
    console.error(`[Workflow] generateKeyframe failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 9B: VIDEO FROM KEYFRAME (First Frame -> Video)
// =============================================================================

/**
 * Generate video starting from a keyframe image.
 *
 * The video will begin exactly at the keyframe visual and animate from there.
 * The prompt should describe the MOTION/CHANGE, not the static appearance.
 *
 * @see VIDEO-PROMPT-GUIDE.md for motion prompt best practices
 */
export async function generateVideoFromKeyframe(
  input: VideoFromKeyframeInput
): Promise<WorkflowResult<VideoFromKeyframeOutput>> {
  // Validate input
  if (!input.firstFramePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'First frame path is required');
  }

  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Motion prompt is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  if (input.duration && (input.duration < 4 || input.duration > 8)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Duration must be between 4 and 8 seconds for Veo');
  }

  try {
    validateImageFile(input.firstFramePath);
    ensureDir(path.dirname(input.outputPath));

    const firstFrame = fs.readFileSync(input.firstFramePath);
    const mimeType = getMimeType(input.firstFramePath);
    const model = getVeoModel(input.quality || 'fast');

    console.log(`[Workflow] Generating video from keyframe (${input.duration || 6}s)...`);

    const result = await withRetry(
      () => generateVideo({
        model,
        prompt: input.prompt,
        referenceImage: firstFrame,
        referenceImageMimeType: mimeType,
        config: {
          aspectRatio: toVideoAspectRatio(input.aspectRatio),
          durationSeconds: input.duration || 6,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Video from keyframe generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Video from keyframe generation failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.videos[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save video: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Video saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration: input.duration || 6,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during video from keyframe generation';
    console.error(`[Workflow] generateVideoFromKeyframe failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 9C: VIDEO FROM KEYFRAMES (First + Last Frame -> Video)
// =============================================================================

/**
 * Generate video interpolating between first and last frame keyframes.
 *
 * Veo will create smooth motion that transitions from the first image to the last.
 * Best for: transformations, before/after, reveals, scene transitions.
 *
 * @see VIDEO-PROMPT-GUIDE.md for transformation prompt best practices
 */
export async function generateVideoFromKeyframes(
  input: VideoFromKeyframesInput
): Promise<WorkflowResult<VideoFromKeyframesOutput>> {
  // Validate input
  if (!input.firstFramePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'First frame path is required');
  }

  if (!input.lastFramePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Last frame path is required');
  }

  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Transition prompt is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  if (input.duration && (input.duration < 4 || input.duration > 8)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Duration must be between 4 and 8 seconds for Veo');
  }

  try {
    validateImageFile(input.firstFramePath);
    validateImageFile(input.lastFramePath);
    ensureDir(path.dirname(input.outputPath));

    const firstFrame = fs.readFileSync(input.firstFramePath);
    const lastFrame = fs.readFileSync(input.lastFramePath);
    const firstMimeType = getMimeType(input.firstFramePath);
    const lastMimeType = getMimeType(input.lastFramePath);
    const model = getVeoModel(input.quality || 'fast');

    console.log(`[Workflow] Generating video from first+last keyframes (${input.duration || 6}s)...`);

    const result = await withRetry(
      () => generateVideo({
        model,
        prompt: input.prompt,
        referenceImage: firstFrame,
        referenceImageMimeType: firstMimeType,
        lastFrameImage: lastFrame,
        lastFrameImageMimeType: lastMimeType,
        config: {
          aspectRatio: toVideoAspectRatio(input.aspectRatio),
          durationSeconds: input.duration || 6,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Video from keyframes generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Video from keyframes generation failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.videos[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save video: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Video saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration: input.duration || 6,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during video from keyframes generation';
    console.error(`[Workflow] generateVideoFromKeyframes failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 9D: BUILD DETAILED VIDEO PROMPT
// =============================================================================

/**
 * Build a detailed video prompt string from structured parameters.
 *
 * Use this to ensure prompts follow the VIDEO-PROMPT-GUIDE.md format:
 * [SHOT TYPE + CAMERA MOVEMENT] + [SUBJECT] + [ACTION] + [ENVIRONMENT] + [LIGHTING + STYLE]
 */
export function buildVideoPrompt(details: DetailedVideoPrompt): string {
  const parts: string[] = [];

  // Shot type and camera
  const shotMap: Record<string, string> = {
    extreme_wide: 'Extreme wide shot',
    wide: 'Wide shot',
    medium_wide: 'Medium wide shot',
    medium: 'Medium shot',
    medium_close: 'Medium close-up',
    close_up: 'Close-up',
    extreme_close: 'Extreme close-up',
    insert: 'Insert shot',
    over_shoulder: 'Over-the-shoulder shot',
    pov: 'POV shot',
    top_down: 'Top-down shot',
  };

  const cameraMap: Record<string, string> = {
    static: 'static camera',
    pan_left: 'slow pan left',
    pan_right: 'slow pan right',
    tilt_up: 'tilt up',
    tilt_down: 'tilt down',
    dolly_in: 'dolly push-in',
    dolly_out: 'dolly pull-back',
    track_left: 'tracking left',
    track_right: 'tracking right',
    crane_up: 'crane up',
    crane_down: 'crane down',
    orbit: 'slow orbit',
    steadicam: 'steadicam follow',
    handheld: 'handheld',
    aerial: 'aerial/drone shot',
    whip_pan: 'whip pan',
    crash_zoom: 'crash zoom',
  };

  const speedMap: Record<string, string> = {
    slow: 'slow',
    natural: '',
    fast: 'fast',
    whip: 'rapid',
  };

  // Build shot/camera line
  const shotParts: string[] = [];
  if (details.shotType) {
    shotParts.push(shotMap[details.shotType] || details.shotType);
  }
  if (details.lens) {
    shotParts.push(`${details.lens} lens`);
  }
  if (details.cameraMovement && details.cameraMovement !== 'static') {
    const speed = details.movementSpeed ? speedMap[details.movementSpeed] : '';
    shotParts.push(`${speed} ${cameraMap[details.cameraMovement]}`.trim());
  } else if (details.cameraMovement === 'static') {
    shotParts.push('static camera');
  }
  if (shotParts.length > 0) {
    parts.push(shotParts.join(', ') + '.');
  }

  // Subject
  parts.push(details.subject);

  // Action
  parts.push(details.action);

  // Environment
  if (details.environment) {
    parts.push(details.environment);
  }

  // Lighting and style
  const styleParts: string[] = [];
  if (details.lighting) {
    const lightingMap: Record<string, string> = {
      natural: 'natural lighting',
      golden_hour: 'golden hour light',
      blue_hour: 'blue hour',
      soft: 'soft diffused light',
      hard: 'hard dramatic lighting',
      rim: 'rim lighting',
      rembrandt: 'Rembrandt lighting',
      neon: 'neon glow',
      studio: 'studio lighting',
      practical: 'practical lights',
    };
    styleParts.push(lightingMap[details.lighting] || details.lighting);
  }
  if (details.depthOfField === 'shallow') {
    styleParts.push('shallow depth of field');
  } else if (details.depthOfField === 'deep') {
    styleParts.push('deep focus');
  }
  if (details.style) {
    styleParts.push(`${details.style} style`);
  }
  if (details.mood) {
    styleParts.push(`${details.mood} energy`);
  }
  if (styleParts.length > 0) {
    parts.push(styleParts.join(', ') + '.');
  }

  return parts.join(' ');
}

// =============================================================================
// WORKFLOW 10: IMAGE TO VIDEO SPEAKING
// =============================================================================

/**
 * Generate speaking video from reference image
 *
 * Use for: Consistent character testimonial, branded spokesperson
 */
export async function generateSpeakingVideoFromImage(
  input: ImageToVideoSpeakingInput
): Promise<WorkflowResult<ImageToVideoSpeakingOutput>> {
  // Validate input
  if (!input.referenceImagePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Reference image path is required');
  }

  if (!input.dialogue || input.dialogue.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Dialogue is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  if (input.duration && (input.duration < 1 || input.duration > 60)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Duration must be between 1 and 60 seconds');
  }

  try {
    // Validate reference image
    validateImageFile(input.referenceImagePath);

    ensureDir(path.dirname(input.outputPath));

    const referenceImage = fs.readFileSync(input.referenceImagePath);
    const mimeType = getMimeType(input.referenceImagePath);
    const model = getVeoModel(input.quality || 'fast');

    const prompt = `
Use this person/character from the reference image.

${input.environment || 'Neutral background, professional lighting'}

The character says "${input.dialogue}" in a ${input.voiceDescription || 'natural, conversational voice'}.
Natural, authentic performance. Cinematic quality.
    `.trim();

    console.log(`[Workflow] Generating speaking video from image (${input.duration || 8}s)...`);

    const result = await withRetry(
      () => generateVideo({
        model,
        prompt,
        referenceImage,
        referenceImageMimeType: mimeType,
        config: {
          aspectRatio: toVideoAspectRatio(input.aspectRatio),
          durationSeconds: input.duration,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Speaking video from image generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Speaking video from image generation failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.videos[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save video: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Speaking video saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration: input.duration || 8,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during speaking video from image generation';
    console.error(`[Workflow] generateSpeakingVideoFromImage failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 11: TEXT TO VIDEO + VOICEOVER
// =============================================================================

/**
 * Generate video with TTS voiceover
 *
 * Use for: Explainers, tutorials, product demos with narration
 */
export async function generateVideoWithVoiceover(
  input: TextToVideoVoiceoverInput
): Promise<WorkflowResult<TextToVideoVoiceoverOutput>> {
  // Validate input
  if (!input.scenes || input.scenes.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one scene is required');
  }

  if (!input.voiceoverScript || input.voiceoverScript.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Voiceover script is required');
  }

  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  // Validate each scene
  for (let i = 0; i < input.scenes.length; i++) {
    const scene = input.scenes[i];
    if (!scene.prompt || scene.prompt.trim().length === 0) {
      return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, `Scene ${i + 1} prompt is required`);
    }
    if (scene.duration && (scene.duration < 1 || scene.duration > 60)) {
      return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, `Scene ${i + 1} duration must be between 1 and 60 seconds`);
    }
  }

  try {
    ensureDir(input.outputDir);

    const model = getVeoModel(input.quality || 'fast');
    const clipPaths: string[] = [];
    const failedClips: number[] = [];
    let totalVideoCost = 0;
    let totalDuration = 0;

    // Generate video clips for each scene
    for (let i = 0; i < input.scenes.length; i++) {
      const scene = input.scenes[i];
      const clipNum = String(i + 1).padStart(2, '0');
      const clipPath = path.join(input.outputDir, `clip-${clipNum}.mp4`);

      console.log(`[Workflow] Generating clip ${i + 1}/${input.scenes.length}...`);

      try {
        const result = await withRetry(
          () => generateVideo({
            model,
            prompt: scene.prompt,
            config: {
              aspectRatio: toVideoAspectRatio(input.aspectRatio),
              durationSeconds: scene.duration,
                },
          }),
          { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
          `Clip ${i + 1} generation`
        );

        if (result.success && result.data.videos.length > 0) {
          try {
            fs.writeFileSync(clipPath, result.data.videos[0].data);
            clipPaths.push(clipPath);
            totalVideoCost += result.data.cost.totalCost;
            totalDuration += scene.duration || 5;
          } catch (writeError) {
            console.error(`[Workflow] Failed to save clip ${i + 1}: ${writeError}`);
            failedClips.push(i + 1);
          }
        } else {
          failedClips.push(i + 1);
        }
      } catch (clipError) {
        console.error(`[Workflow] Clip ${i + 1} failed after retries: ${clipError}`);
        failedClips.push(i + 1);
      }

      await sleep(3000);
    }

    // Check if we have any clips
    if (clipPaths.length === 0) {
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        'Failed to generate any video clips'
      );
    }

    // Generate voiceover
    console.log('[Workflow] Generating voiceover...');
    const voiceoverPath = path.join(input.outputDir, 'voiceover.wav');
    let voiceoverCost = 0;

    try {
      const ttsResult = await withRetry(
        () => textToSpeech(
          input.voiceoverScript,
          (input.voiceName || 'Kore') as TTSVoiceName,
          input.voiceStyle,
          DEFAULT_TTS_MODEL
        ),
        { maxRetries: 2 },
        'TTS generation'
      );

      if (ttsResult.success) {
        fs.writeFileSync(voiceoverPath, ttsResult.data.audio.data);
        voiceoverCost = ttsResult.data.cost.totalCost;
        console.log('[Workflow] Voiceover saved');
      }
    } catch (ttsError) {
      console.warn(`[Workflow] Voiceover generation failed: ${ttsError}`);
    }

    // Create file list for FFmpeg
    const filelistPath = path.join(input.outputDir, 'filelist.txt');
    const filelistContent = clipPaths.map(p => `file '${path.basename(p)}'`).join('\n');
    fs.writeFileSync(filelistPath, filelistContent);

    // Combine clips
    const combinedPath = path.join(input.outputDir, 'combined.mp4');
    const finalPath = path.join(input.outputDir, 'final-with-voiceover.mp4');

    try {
      console.log('[Workflow] Combining video clips...');
      execSync(`cd "${input.outputDir}" && ffmpeg -y -f concat -safe 0 -i filelist.txt -c copy combined.mp4`, { stdio: 'pipe' });

      // Add voiceover if available
      if (fs.existsSync(voiceoverPath)) {
        console.log('[Workflow] Adding voiceover to video...');
        execSync(`cd "${input.outputDir}" && ffmpeg -y -i combined.mp4 -i voiceover.wav -c:v copy -c:a aac -shortest final-with-voiceover.mp4`, { stdio: 'pipe' });
      } else {
        fs.copyFileSync(combinedPath, finalPath);
      }
      console.log('[Workflow] Final video assembled');
    } catch (ffmpegError) {
      console.warn(`[Workflow] FFmpeg combination failed: ${ffmpegError}`);
      // Still return success with clips if FFmpeg fails
    }

    const result: WorkflowResult<TextToVideoVoiceoverOutput> = {
      success: true,
      data: {
        finalVideoPath: fs.existsSync(finalPath) ? finalPath : (fs.existsSync(combinedPath) ? combinedPath : clipPaths[0]),
        clipPaths,
        voiceoverPath: fs.existsSync(voiceoverPath) ? voiceoverPath : '',
        totalDuration,
        cost: {
          totalCost: totalVideoCost + voiceoverCost,
          breakdown: {
            video: totalVideoCost,
            voiceover: voiceoverCost,
          },
        },
      },
    };

    // Add warning if some clips failed
    if (failedClips.length > 0) {
      result.error = {
        code: WorkflowErrorCodes.PARTIAL_FAILURE,
        message: `Some clips failed to generate: ${failedClips.join(', ')}`,
      };
    }

    return result;
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during video with voiceover generation';
    console.error(`[Workflow] generateVideoWithVoiceover failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 12: IMAGE TO VIDEO + VOICEOVER
// =============================================================================

/**
 * Generate video from reference image with TTS voiceover
 *
 * Use for: Product explainer from photo, consistent visuals with narration
 */
export async function generateVideoFromImageWithVoiceover(
  input: ImageToVideoVoiceoverInput
): Promise<WorkflowResult<ImageToVideoVoiceoverOutput>> {
  // Validate input
  if (!input.referenceImagePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Reference image path is required');
  }

  if (!input.scenes || input.scenes.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one scene is required');
  }

  if (!input.voiceoverScript || input.voiceoverScript.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Voiceover script is required');
  }

  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  // Validate each scene
  for (let i = 0; i < input.scenes.length; i++) {
    const scene = input.scenes[i];
    if (!scene.prompt || scene.prompt.trim().length === 0) {
      return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, `Scene ${i + 1} prompt is required`);
    }
    if (scene.duration && (scene.duration < 1 || scene.duration > 60)) {
      return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, `Scene ${i + 1} duration must be between 1 and 60 seconds`);
    }
  }

  try {
    // Validate reference image
    validateImageFile(input.referenceImagePath);

    ensureDir(input.outputDir);

    const referenceImage = fs.readFileSync(input.referenceImagePath);
    const mimeType = getMimeType(input.referenceImagePath);
    const model = getVeoModel(input.quality || 'fast');
    const clipPaths: string[] = [];
    const failedClips: number[] = [];
    let totalVideoCost = 0;
    let totalDuration = 0;

    // Generate video clips for each scene with reference image
    for (let i = 0; i < input.scenes.length; i++) {
      const scene = input.scenes[i];
      const clipNum = String(i + 1).padStart(2, '0');
      const clipPath = path.join(input.outputDir, `clip-${clipNum}.mp4`);

      console.log(`[Workflow] Generating clip ${i + 1}/${input.scenes.length} from reference...`);

      try {
        const result = await withRetry(
          () => generateVideo({
            model,
            prompt: scene.prompt,
            referenceImage,
            referenceImageMimeType: mimeType,
            config: {
              aspectRatio: toVideoAspectRatio(input.aspectRatio),
              durationSeconds: scene.duration,
                },
          }),
          { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
          `Clip ${i + 1} from image generation`
        );

        if (result.success && result.data.videos.length > 0) {
          try {
            fs.writeFileSync(clipPath, result.data.videos[0].data);
            clipPaths.push(clipPath);
            totalVideoCost += result.data.cost.totalCost;
            totalDuration += scene.duration || 5;
          } catch (writeError) {
            console.error(`[Workflow] Failed to save clip ${i + 1}: ${writeError}`);
            failedClips.push(i + 1);
          }
        } else {
          failedClips.push(i + 1);
        }
      } catch (clipError) {
        console.error(`[Workflow] Clip ${i + 1} failed after retries: ${clipError}`);
        failedClips.push(i + 1);
      }

      await sleep(3000);
    }

    // Check if we have any clips
    if (clipPaths.length === 0) {
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        'Failed to generate any video clips'
      );
    }

    // Generate voiceover
    console.log('[Workflow] Generating voiceover...');
    const voiceoverPath = path.join(input.outputDir, 'voiceover.wav');
    let voiceoverCost = 0;

    try {
      const ttsResult = await withRetry(
        () => textToSpeech(
          input.voiceoverScript,
          (input.voiceName || 'Kore') as TTSVoiceName,
          input.voiceStyle,
          DEFAULT_TTS_MODEL
        ),
        { maxRetries: 2 },
        'TTS generation'
      );

      if (ttsResult.success) {
        fs.writeFileSync(voiceoverPath, ttsResult.data.audio.data);
        voiceoverCost = ttsResult.data.cost.totalCost;
        console.log('[Workflow] Voiceover saved');
      }
    } catch (ttsError) {
      console.warn(`[Workflow] Voiceover generation failed: ${ttsError}`);
    }

    // Create file list and combine
    const filelistPath = path.join(input.outputDir, 'filelist.txt');
    const filelistContent = clipPaths.map(p => `file '${path.basename(p)}'`).join('\n');
    fs.writeFileSync(filelistPath, filelistContent);

    const combinedPath = path.join(input.outputDir, 'combined.mp4');
    const finalPath = path.join(input.outputDir, 'final-with-voiceover.mp4');

    try {
      console.log('[Workflow] Combining video clips...');
      execSync(`cd "${input.outputDir}" && ffmpeg -y -f concat -safe 0 -i filelist.txt -c copy combined.mp4`, { stdio: 'pipe' });

      if (fs.existsSync(voiceoverPath)) {
        console.log('[Workflow] Adding voiceover to video...');
        execSync(`cd "${input.outputDir}" && ffmpeg -y -i combined.mp4 -i voiceover.wav -c:v copy -c:a aac -shortest final-with-voiceover.mp4`, { stdio: 'pipe' });
      } else {
        fs.copyFileSync(combinedPath, finalPath);
      }
      console.log('[Workflow] Final video assembled');
    } catch (ffmpegError) {
      console.warn(`[Workflow] FFmpeg combination failed: ${ffmpegError}`);
    }

    const result: WorkflowResult<ImageToVideoVoiceoverOutput> = {
      success: true,
      data: {
        finalVideoPath: fs.existsSync(finalPath) ? finalPath : (fs.existsSync(combinedPath) ? combinedPath : clipPaths[0]),
        clipPaths,
        voiceoverPath: fs.existsSync(voiceoverPath) ? voiceoverPath : '',
        totalDuration,
        cost: {
          totalCost: totalVideoCost + voiceoverCost,
          breakdown: {
            video: totalVideoCost,
            voiceover: voiceoverCost,
          },
        },
      },
    };

    // Add warning if some clips failed
    if (failedClips.length > 0) {
      result.error = {
        code: WorkflowErrorCodes.PARTIAL_FAILURE,
        message: `Some clips failed to generate: ${failedClips.join(', ')}`,
      };
    }

    return result;
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during video from image with voiceover generation';
    console.error(`[Workflow] generateVideoFromImageWithVoiceover failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// VOICE SUGGESTION HELPER
// =============================================================================

/**
 * Suggest voice settings based on content type.
 *
 * Use this to automatically decide voice, style, pace, and accent
 * based on the type of content being created.
 *
 * @example
 * const suggestion = suggestVoiceSettings('ad_direct');
 * await generateVoiceover({
 *   script: "...",
 *   outputPath: "...",
 *   voiceName: suggestion.voiceName,
 *   voiceStyle: suggestion.voiceStyle
 * });
 */
export function suggestVoiceSettings(
  contentType: ContentType,
  options?: {
    gender?: 'male' | 'female' | 'any';
    region?: 'american' | 'british' | 'australian' | 'neutral';
  }
): VoiceSuggestion {
  const gender = options?.gender || 'any';
  const region = options?.region || 'american';

  // Voice selection based on gender preference
  const maleVoices: VoiceName[] = ['Charon', 'Orus', 'Fenrir', 'Helios', 'Titan'];
  const femaleVoices: VoiceName[] = ['Kore', 'Aoede', 'Leda', 'Calliope', 'Selene', 'Aura'];
  const neutralVoices: VoiceName[] = ['Puck', 'Zephyr', 'Proteus'];

  // Accent mapping
  const accentMap: Record<string, 'american_gen' | 'british_rp' | 'australian' | 'neutral'> = {
    american: 'american_gen',
    british: 'british_rp',
    australian: 'australian',
    neutral: 'neutral',
  };
  const accent = accentMap[region] || 'american_gen';

  // Content type to voice settings mapping
  const presets: Record<ContentType, {
    voices: { male: VoiceName; female: VoiceName; neutral: VoiceName };
    style: VoiceStyle['style'];
    pace: VoiceStyle['pace'];
    reasoning: { voice: string; style: string; pace: string };
  }> = {
    ad_hype: {
      voices: { male: 'Fenrir', female: 'Calliope', neutral: 'Zephyr' },
      style: 'promo_hype',
      pace: 'rapid_fire',
      reasoning: {
        voice: 'High energy voice for excitement',
        style: 'promo_hype: punchy consonants, elongated vowels for impact',
        pace: 'rapid_fire: fast, energetic, no dead air',
      },
    },
    ad_direct: {
      voices: { male: 'Charon', female: 'Kore', neutral: 'Puck' },
      style: 'newscaster',
      pace: 'staccato',
      reasoning: {
        voice: 'Authoritative voice for credibility',
        style: 'newscaster: professional, clear articulation',
        pace: 'staccato: distinct pauses for punchy statements',
      },
    },
    ad_testimonial: {
      voices: { male: 'Puck', female: 'Leda', neutral: 'Puck' },
      style: 'empathetic',
      pace: 'natural',
      reasoning: {
        voice: 'Warm, relatable voice for authenticity',
        style: 'empathetic: warm, understanding tone',
        pace: 'natural: conversational, genuine',
      },
    },
    explainer: {
      voices: { male: 'Orus', female: 'Kore', neutral: 'Proteus' },
      style: 'empathetic',
      pace: 'the_drift',
      reasoning: {
        voice: 'Clear, professional voice for teaching',
        style: 'empathetic: warm, understanding for learning',
        pace: 'the_drift: slow, deliberate for comprehension',
      },
    },
    tutorial: {
      voices: { male: 'Puck', female: 'Leda', neutral: 'Puck' },
      style: 'vocal_smile',
      pace: 'natural',
      reasoning: {
        voice: 'Friendly, encouraging voice for guidance',
        style: 'vocal_smile: bright, inviting tone',
        pace: 'natural: easy to follow along',
      },
    },
    news: {
      voices: { male: 'Charon', female: 'Kore', neutral: 'Proteus' },
      style: 'newscaster',
      pace: 'natural',
      reasoning: {
        voice: 'Authoritative, credible voice',
        style: 'newscaster: professional broadcast cadence',
        pace: 'natural: standard news delivery',
      },
    },
    story: {
      voices: { male: 'Helios', female: 'Aoede', neutral: 'Aura' },
      style: 'empathetic',
      pace: 'the_drift',
      reasoning: {
        voice: 'Expressive voice for narrative',
        style: 'empathetic: emotional, engaging',
        pace: 'the_drift: slow, dramatic pauses',
      },
    },
    meditation: {
      voices: { male: 'Narcissus', female: 'Despina', neutral: 'Aura' },
      style: 'whisper',
      pace: 'the_drift',
      reasoning: {
        voice: 'Soft, soothing voice for relaxation',
        style: 'whisper: intimate, breathy, calming',
        pace: 'the_drift: slow, long pauses for breath',
      },
    },
    podcast: {
      voices: { male: 'Puck', female: 'Leda', neutral: 'Zephyr' },
      style: 'vocal_smile',
      pace: 'natural',
      reasoning: {
        voice: 'Friendly, conversational voice',
        style: 'vocal_smile: warm, inviting',
        pace: 'natural: conversational flow',
      },
    },
    luxury: {
      voices: { male: 'Narcissus', female: 'Selene', neutral: 'Vesper' },
      style: 'empathetic',
      pace: 'the_drift',
      reasoning: {
        voice: 'Refined, smooth voice for premium feel',
        style: 'empathetic: sophisticated, understated',
        pace: 'the_drift: unhurried, luxurious',
      },
    },
    ugc: {
      voices: { male: 'Puck', female: 'Aoede', neutral: 'Zephyr' },
      style: 'vocal_smile',
      pace: 'natural',
      reasoning: {
        voice: 'Authentic, relatable voice',
        style: 'vocal_smile: genuine, approachable',
        pace: 'natural: unscripted feel',
      },
    },
    corporate: {
      voices: { male: 'Orus', female: 'Kore', neutral: 'Proteus' },
      style: 'newscaster',
      pace: 'natural',
      reasoning: {
        voice: 'Professional, polished voice',
        style: 'newscaster: authoritative, clear',
        pace: 'natural: business appropriate',
      },
    },
  };

  const preset = presets[contentType];

  // Select voice based on gender preference
  let voiceName: VoiceName;
  if (gender === 'male') {
    voiceName = preset.voices.male;
  } else if (gender === 'female') {
    voiceName = preset.voices.female;
  } else {
    // 'any' - use neutral or randomly pick
    voiceName = preset.voices.neutral;
  }

  return {
    voiceName,
    voiceStyle: {
      style: preset.style,
      pace: preset.pace,
      accent,
    },
    reasoning: {
      voice: preset.reasoning.voice,
      style: preset.reasoning.style,
      pace: preset.reasoning.pace,
      accent: `${region} accent for target audience`,
    },
  };
}

// =============================================================================
// WORKFLOW 13: VOICEOVER (SINGLE SPEAKER TTS)
// =============================================================================

/**
 * Generate a single-speaker voiceover / narration audio file.
 *
 * Use for: Narration, ad voiceover, podcast intro, audiobook lines.
 * Wraps the low-level textToSpeech() with validation, retry, file saving,
 * and standardized cost reporting so agents never rewrite that boilerplate.
 */
export async function generateVoiceover(
  input: VoiceoverInput
): Promise<WorkflowResult<VoiceoverOutput>> {
  // Validate input
  if (!input.script || input.script.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Script is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    console.log(`[Workflow] Generating voiceover (${input.voiceName || 'Kore'})...`);

    const result = await withRetry(
      () => textToSpeech(
        input.script,
        (input.voiceName || 'Kore') as TTSVoiceName,
        input.voiceStyle as TTSVoiceSettings | undefined,
        input.ttsModel || DEFAULT_TTS_MODEL
      ),
      { maxRetries: 3 },
      'Voiceover generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Voiceover generation failed'
      );
    }

    if (!result.data.audio?.data) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No audio was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.audio.data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save voiceover: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Voiceover saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        audioPath: input.outputPath,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { voiceover: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during voiceover generation';
    console.error(`[Workflow] generateVoiceover failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 14: MULTI-SPEAKER VOICEOVER (DIALOGUE / PODCAST)
// =============================================================================

/**
 * Generate a multi-speaker conversation audio file.
 *
 * Use for: Podcasts, dialogues, interviews, two-host explainers.
 * Wraps the low-level multiSpeakerTTS() with validation, retry, file saving,
 * and standardized cost reporting.
 */
export async function generateMultiSpeakerVoiceover(
  input: MultiSpeakerVoiceoverInput
): Promise<WorkflowResult<MultiSpeakerVoiceoverOutput>> {
  // Validate input
  if (!input.script || input.script.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Script is required');
  }

  if (!input.speakers || input.speakers.length < 2) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least two speakers are required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    const speakers: SpeakerVoiceConfig[] = input.speakers.map(s => ({
      speaker: s.speaker,
      voiceName: s.voiceName as TTSVoiceName,
      voiceSettings: s.voiceStyle as TTSVoiceSettings | undefined,
    }));

    console.log(`[Workflow] Generating multi-speaker voiceover (${speakers.length} speakers)...`);

    const result = await withRetry(
      () => multiSpeakerTTS(input.script, speakers, DEFAULT_TTS_MODEL),
      { maxRetries: 3 },
      'Multi-speaker voiceover generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Multi-speaker voiceover generation failed'
      );
    }

    if (!result.data.audio?.data) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No audio was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.audio.data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save voiceover: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Multi-speaker voiceover saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        audioPath: input.outputPath,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { voiceover: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during multi-speaker voiceover generation';
    console.error(`[Workflow] generateMultiSpeakerVoiceover failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 15: MUSIC (LYRIA)
// =============================================================================

/**
 * Generate a music track from a text prompt.
 *
 * Use for: Background music, jingles, intros, soundtracks, full songs.
 * Wraps the low-level generateMusic() (Lyria) with validation, retry,
 * file saving, and standardized cost reporting.
 */
export async function generateMusicTrack(
  input: MusicInput
): Promise<WorkflowResult<MusicOutput>> {
  // Validate input
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  const isPro = input.quality === 'pro';
  const maxDuration = isPro ? 180 : 30;

  if (input.durationSeconds && (input.durationSeconds < 1 || input.durationSeconds > maxDuration)) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      `Duration must be between 1 and ${maxDuration} seconds for ${isPro ? 'pro' : 'standard'} quality`
    );
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    const model: LyriaModel = isPro ? 'lyria-3-pro' : 'lyria-3';

    // Optional reference image to steer the mood
    let imageInput: Buffer | undefined;
    let imageMimeType: string | undefined;
    if (input.referenceImagePath) {
      validateImageFile(input.referenceImagePath);
      imageInput = fs.readFileSync(input.referenceImagePath);
      imageMimeType = getMimeType(input.referenceImagePath);
    }

    console.log(`[Workflow] Generating music (${model}, ${input.durationSeconds || maxDuration}s)...`);

    let result = await withRetry(
      () => generateMusic({
        model,
        prompt: input.prompt,
        ...(imageInput && { imageInput, imageMimeType }),
        config: { durationSeconds: input.durationSeconds },
      }),
      { maxRetries: 2, initialDelayMs: 3000, maxDelayMs: 30000 },
      'Music generation'
    );

    // Some API keys only serve the preview variant of the pro model — on a
    // 404 for lyria-3-pro, retry once with lyria-3-pro-preview (same pricing).
    if (!result.success && isPro && result.error?.message?.includes('is not found')) {
      console.log('[Workflow] lyria-3-pro not available on this key — falling back to lyria-3-pro-preview...');
      result = await withRetry(
        () => generateMusic({
          model: 'lyria-3-pro-preview',
          prompt: input.prompt,
          ...(imageInput && { imageInput, imageMimeType }),
          config: { durationSeconds: input.durationSeconds },
        }),
        { maxRetries: 2, initialDelayMs: 3000, maxDelayMs: 30000 },
        'Music generation (preview fallback)'
      );
    }

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Music generation failed'
      );
    }

    if (!result.data.music?.data) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No music was generated');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.music.data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save music: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Music saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        audioPath: input.outputPath,
        durationSeconds: result.data.music.durationSeconds || input.durationSeconds || maxDuration,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { music: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during music generation';
    console.error(`[Workflow] generateMusicTrack failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// ASSEMBLY HELPERS (local ffmpeg)
// =============================================================================

/** Run an ffmpeg command, surfacing a clean FFMPEG_ERROR on failure. */
function runFfmpeg(cmd: string, cwd?: string): void {
  try {
    execSync(cmd, { stdio: 'pipe', ...(cwd && { cwd }) });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer })?.stderr?.toString() || '';
    const msg = stderr.split('\n').filter(Boolean).slice(-2).join(' ')
      || (error instanceof Error ? error.message : 'ffmpeg failed');
    throw new Error(`FFmpeg error: ${msg.trim()}`);
  }
}

/** Verify ffmpeg is installed; throws FFMPEG_ERROR-mapped message otherwise. */
function assertFfmpeg(): void {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    throw new Error('FFmpeg not found. Install ffmpeg to use assembly/caption workflows.');
  }
}

/** seconds -> "HH:MM:SS,mmm" SRT timestamp */
function secondsToSrt(total: number): string {
  const ms = Math.max(0, Math.round(total * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(millis, 3)}`;
}

// =============================================================================
// WORKFLOW 16: CHARACTER SHEET (multi-angle consistency reference)
// =============================================================================

/**
 * Generate a multi-angle character sheet (front / three-quarter / profile) from
 * one locked description — the core asset for character consistency.
 *
 * Use for: locking a generated character before producing many clips/images.
 * Register the result with `registerAsset(..., { locked: true })` so every later
 * piece reuses the exact files.
 */
export async function generateCharacterSheet(
  input: CharacterSheetInput
): Promise<WorkflowResult<CharacterSheetOutput>> {
  if (!input.description || input.description.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Character description is required');
  }
  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  const angles = input.angles && input.angles.length ? input.angles : ['front', 'three_quarter', 'profile'];
  const anglePrompt: Record<string, string> = {
    front: 'front view, facing camera directly, neutral expression',
    three_quarter: 'three-quarter view, head turned ~45 degrees',
    profile: 'side profile view',
    full_body: 'full body shot, head to toe, standing',
  };
  const stem = input.idStem || 'character';

  try {
    ensureDir(input.outputDir);

    const files: Record<string, string> = {};
    const failed: string[] = [];
    let totalCost = 0;

    const imageConfig: Record<string, unknown> = {
      aspectRatio: input.aspectRatio || '9:16',
      imageSize: input.imageSize || '1K',
    };
    const personGen = toImagePersonGeneration(input.personGeneration);
    if (personGen) imageConfig.personGeneration = personGen;

    for (const angle of angles) {
      const prompt = `Character reference, ${anglePrompt[angle] || angle}. ${input.description}. `
        + `Consistent identity, plain neutral background, even studio lighting, photorealistic.`;
      const outPath = path.join(input.outputDir, `${stem}-${angle}.png`);

      try {
        const result = await withRetry(
          () => gemini31FlashImage({ userPrompt: prompt, config: imageConfig }),
          { maxRetries: 2, initialDelayMs: 2000 },
          `Character sheet (${angle})`
        );
        if (result.success && result.data.images.length > 0) {
          fs.writeFileSync(outPath, result.data.images[0].data);
          files[angle] = outPath;
          totalCost += result.data.cost.totalCost;
        } else {
          failed.push(angle);
        }
      } catch {
        failed.push(angle);
      }
      await sleep(1200);
    }

    if (Object.keys(files).length === 0) {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, 'Failed to generate any character angles');
    }

    const out: WorkflowResult<CharacterSheetOutput> = {
      success: true,
      data: { files, cost: { totalCost, breakdown: { images: totalCost } } },
    };
    if (failed.length) {
      out.error = { code: WorkflowErrorCodes.PARTIAL_FAILURE, message: `Some angles failed: ${failed.join(', ')}` };
    }
    return out;
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during character sheet generation';
    console.error(`[Workflow] generateCharacterSheet failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 17: MIX VIDEO + VOICEOVER + MUSIC
// =============================================================================

/**
 * Lay a voiceover and/or a music bed onto a video. Music is ducked to
 * `musicVolume` (default 0.3) when mixed under a voiceover. Local ffmpeg, no API cost.
 */
export async function mixVideoAudio(
  input: MixVideoAudioInput
): Promise<WorkflowResult<MixVideoAudioOutput>> {
  if (!input.videoPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'videoPath is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'outputPath is required');
  }
  if (!input.voiceoverPath && !input.musicPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Provide voiceoverPath and/or musicPath to mix');
  }

  try {
    assertFfmpeg();
    validateFile(input.videoPath, 'Video');
    if (input.voiceoverPath) validateFile(input.voiceoverPath, 'Voiceover');
    if (input.musicPath) validateFile(input.musicPath, 'Music');
    ensureDir(path.dirname(input.outputPath));

    const vol = input.musicVolume ?? 0.3;
    const v = `"${input.videoPath}"`;
    const out = `"${input.outputPath}"`;
    let cmd: string;

    if (input.voiceoverPath && input.musicPath) {
      cmd = `ffmpeg -y -i ${v} -i "${input.voiceoverPath}" -i "${input.musicPath}" `
        + `-filter_complex "[2:a]volume=${vol}[m];[1:a][m]amix=inputs=2:duration=first[a]" `
        + `-map 0:v -map "[a]" -c:v copy -c:a aac -shortest ${out}`;
    } else if (input.voiceoverPath) {
      cmd = `ffmpeg -y -i ${v} -i "${input.voiceoverPath}" -map 0:v -map 1:a -c:v copy -c:a aac -shortest ${out}`;
    } else {
      cmd = `ffmpeg -y -i ${v} -i "${input.musicPath}" -filter_complex "[1:a]volume=${vol}[a]" `
        + `-map 0:v -map "[a]" -c:v copy -c:a aac -shortest ${out}`;
    }

    runFfmpeg(cmd);

    return { success: true, data: { videoPath: input.outputPath, cost: { totalCost: 0, breakdown: {} } } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during audio mix';
    console.error(`[Workflow] mixVideoAudio failed: ${message}`);
    return createErrorResult(WorkflowErrorCodes.FFMPEG_ERROR, message);
  }
}

// =============================================================================
// WORKFLOW 18: CAPTIONS (.srt)
// =============================================================================

/**
 * Write an .srt subtitle file. Pass explicit `cues` (with timings), or a `script`
 * + `totalDuration` to auto-distribute one cue per sentence, weighted by length.
 * Local, no API cost.
 */
export async function generateCaptions(
  input: CaptionsInput
): Promise<WorkflowResult<CaptionsOutput>> {
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'outputPath is required');
  }

  try {
    let cues: CaptionCue[] = [];

    if (input.cues && input.cues.length) {
      cues = input.cues;
    } else if (input.script && input.totalDuration && input.totalDuration > 0) {
      const sentences = input.script
        .replace(/\s+/g, ' ')
        .match(/[^.!?]+[.!?]*/g)
        ?.map(s => s.trim())
        .filter(Boolean) || [input.script.trim()];

      const totalChars = sentences.reduce((sum, s) => sum + s.length, 0) || 1;
      let t = 0;
      for (const s of sentences) {
        const dur = (s.length / totalChars) * input.totalDuration;
        cues.push({ text: s, start: t, end: t + dur });
        t += dur;
      }
    } else {
      return createErrorResult(
        WorkflowErrorCodes.INVALID_INPUT,
        'Provide cues, or script + totalDuration'
      );
    }

    // Even distribution fallback for cues that lack timings
    if (cues.some(c => c.start === undefined || c.end === undefined)) {
      const dur = input.totalDuration || cues.length; // 1s each if unknown
      const each = dur / cues.length;
      cues = cues.map((c, i) => ({ text: c.text, start: c.start ?? i * each, end: c.end ?? (i + 1) * each }));
    }

    const srt = cues
      .map((c, i) => `${i + 1}\n${secondsToSrt(c.start as number)} --> ${secondsToSrt(c.end as number)}\n${c.text}\n`)
      .join('\n');

    ensureDir(path.dirname(input.outputPath));
    fs.writeFileSync(input.outputPath, srt, 'utf8');

    return {
      success: true,
      data: { srtPath: input.outputPath, cueCount: cues.length, cost: { totalCost: 0, breakdown: {} } },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error writing captions';
    console.error(`[Workflow] generateCaptions failed: ${message}`);
    return createErrorResult(WorkflowErrorCodes.FILE_WRITE_ERROR, message);
  }
}

// =============================================================================
// WORKFLOW 19: ASSEMBLE FINAL (concat clips + VO + music + burned captions)
// =============================================================================

/**
 * One-call final deliverable: concatenate clips, lay voiceover/music, and
 * optionally burn in captions. Local ffmpeg, no API cost.
 */
export async function assembleFinal(
  input: AssembleFinalInput
): Promise<WorkflowResult<AssembleFinalOutput>> {
  if (!input.clipPaths || input.clipPaths.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one clip is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'outputPath is required');
  }

  try {
    assertFfmpeg();
    input.clipPaths.forEach((c, i) => validateFile(c, `Clip ${i + 1}`));
    if (input.captionsSrtPath) validateFile(input.captionsSrtPath, 'Captions');

    const outDir = path.dirname(input.outputPath);
    ensureDir(outDir);

    // 1. Concatenate clips — hard cuts via concat demuxer (stream copy), or
    //    crossfades via xfade/acrossfade filter chain (re-encodes)
    let current = path.join(outDir, '_assembled-concat.mp4');
    if (input.clipPaths.length === 1) {
      fs.copyFileSync(input.clipPaths[0], current);
    } else if (input.transition) {
      const fadeDur = input.transitionDuration ?? 0.5;
      const probe = (file: string, args: string) =>
        execSync(`ffprobe -v error ${args} "${path.resolve(file)}"`, { stdio: 'pipe' }).toString().trim();
      const durations = input.clipPaths.map((p) =>
        parseFloat(probe(p, '-show_entries format=duration -of csv=p=0'))
      );
      if (durations.some((d) => !Number.isFinite(d) || d <= fadeDur)) {
        return createErrorResult(
          WorkflowErrorCodes.INVALID_INPUT,
          `Every clip must be longer than the transition (${fadeDur}s). Durations: ${durations.map((d) => d.toFixed(1)).join(', ')}`
        );
      }
      const allHaveAudio = input.clipPaths.every(
        (p) => probe(p, '-select_streams a -show_entries stream=codec_type -of csv=p=0').length > 0
      );
      const n = input.clipPaths.length;
      const filters: string[] = [];
      let vPrev = '[0:v]';
      let aPrev = '[0:a]';
      let offset = 0;
      for (let i = 1; i < n; i++) {
        offset += durations[i - 1] - fadeDur;
        const vOut = i === n - 1 ? '[vout]' : `[v${i}]`;
        filters.push(
          `${vPrev}[${i}:v]xfade=transition=${input.transition}:duration=${fadeDur}:offset=${offset.toFixed(3)}${vOut}`
        );
        vPrev = vOut;
        if (allHaveAudio) {
          const aOut = i === n - 1 ? '[aout]' : `[a${i}]`;
          filters.push(`${aPrev}[${i}:a]acrossfade=d=${fadeDur}${aOut}`);
          aPrev = aOut;
        }
      }
      const inputArgs = input.clipPaths.map((p) => `-i "${path.resolve(p)}"`).join(' ');
      const mapArgs = allHaveAudio ? '-map "[vout]" -map "[aout]" -c:a aac' : '-map "[vout]"';
      runFfmpeg(
        `ffmpeg -y ${inputArgs} -filter_complex "${filters.join(';')}" ${mapArgs} -c:v libx264 -pix_fmt yuv420p "${current}"`
      );
    } else {
      const listPath = path.join(outDir, '_assemble-list.txt');
      fs.writeFileSync(listPath, input.clipPaths.map(p => `file '${path.resolve(p)}'`).join('\n'));
      runFfmpeg(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${current}"`);
    }

    // 2. Mix voiceover / music
    if (input.voiceoverPath || input.musicPath) {
      const mixed = path.join(outDir, '_assembled-mixed.mp4');
      const mix = await mixVideoAudio({
        videoPath: current,
        voiceoverPath: input.voiceoverPath,
        musicPath: input.musicPath,
        musicVolume: input.musicVolume,
        outputPath: mixed,
      });
      if (!mix.success) return createErrorResult(WorkflowErrorCodes.FFMPEG_ERROR, mix.error?.message || 'Mix failed');
      current = mixed;
    }

    // 3. Burn captions (re-encodes video; run from outDir to dodge filter path escaping)
    if (input.captionsSrtPath) {
      const burned = path.join(outDir, '_assembled-captioned.mp4');
      runFfmpeg(
        `ffmpeg -y -i "${path.resolve(current)}" -vf "subtitles='${path.basename(input.captionsSrtPath)}'" -c:a copy "${path.resolve(burned)}"`,
        path.dirname(path.resolve(input.captionsSrtPath))
      );
      current = burned;
    }

    // 4. Move to final output
    if (path.resolve(current) !== path.resolve(input.outputPath)) {
      fs.copyFileSync(current, input.outputPath);
    }

    return { success: true, data: { finalVideoPath: input.outputPath, cost: { totalCost: 0, breakdown: {} } } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during assembly';
    console.error(`[Workflow] assembleFinal failed: ${message}`);
    return createErrorResult(WorkflowErrorCodes.FFMPEG_ERROR, message);
  }
}

// =============================================================================
// COPY HELPERS
// =============================================================================

/** Extract the first JSON object/array from a model response. */
function parseJsonResponse<T>(text: string): T | null {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

// =============================================================================
// WORKFLOW 20: IMAGE OPTIONS (cheap preview batch — pick before you pay)
// =============================================================================

/**
 * Generate N cheap candidate images for ONE slot so the user can pick the best
 * before committing to a full-resolution render. Defaults to 512px (~$0.045 each).
 *
 * Use for: thumbnails, hero images, any "give me a few to choose from".
 * Follow up with `finalizeImage()` on the chosen one.
 */
export async function generateImageOptions(
  input: ImageOptionsInput
): Promise<WorkflowResult<ImageOptionsOutput>> {
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }
  if (!input.count || input.count < 2 || input.count > 8) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'count must be between 2 and 8');
  }

  try {
    ensureDir(input.outputDir);

    let reference: Buffer | undefined;
    let referenceMime: string | undefined;
    if (input.referenceImagePath) {
      validateImageFile(input.referenceImagePath);
      reference = fs.readFileSync(input.referenceImagePath);
      referenceMime = getMimeType(input.referenceImagePath);
    }

    const config: Record<string, unknown> = {
      aspectRatio: input.aspectRatio || '9:16',
      imageSize: input.previewSize || '512',
    };
    const personGen = toImagePersonGeneration(input.personGeneration);
    if (personGen) config.personGeneration = personGen;

    const imagePaths: string[] = [];
    const failed: number[] = [];
    let totalCost = 0;

    for (let i = 0; i < input.count; i++) {
      const n = String(i + 1).padStart(2, '0');
      // Vary slightly by index so candidates differ
      const prompt = `${input.prompt}\n\n(Variation ${i + 1} — a distinct take.)`;
      try {
        const result = await withRetry(
          () => gemini31FlashImage({
            userPrompt: prompt,
            ...(reference && { imageInput: reference, imageMimeType: referenceMime }),
            config,
          }),
          { maxRetries: 2, initialDelayMs: 1500 },
          `Option ${i + 1}`
        );
        if (result.success && result.data.images.length > 0) {
          const outPath = path.join(input.outputDir, `option-${n}.png`);
          fs.writeFileSync(outPath, result.data.images[0].data);
          imagePaths.push(outPath);
          totalCost += result.data.cost.totalCost;
        } else {
          failed.push(i + 1);
        }
      } catch {
        failed.push(i + 1);
      }
      await sleep(1000);
    }

    if (imagePaths.length === 0) {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, 'Failed to generate any options');
    }

    const out: WorkflowResult<ImageOptionsOutput> = {
      success: true,
      data: {
        imagePaths,
        previewSize: input.previewSize || '512',
        cost: { totalCost, breakdown: { images: totalCost } },
      },
    };
    if (failed.length) {
      out.error = { code: WorkflowErrorCodes.PARTIAL_FAILURE, message: `Some options failed: ${failed.join(', ')}` };
    }
    return out;
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error generating options';
    console.error(`[Workflow] generateImageOptions failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 21: FINALIZE IMAGE (commit the chosen preview at full resolution)
// =============================================================================

/**
 * Re-render the picked preview at higher resolution, using it as the reference so
 * the chosen composition/look is preserved. Default target 2K.
 */
export async function finalizeImage(
  input: FinalizeImageInput
): Promise<WorkflowResult<FinalizeImageOutput>> {
  if (!input.chosenImagePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'chosenImagePath is required');
  }
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  const result = await generateImageVariation({
    referenceImagePath: input.chosenImagePath,
    prompt: `${input.prompt}\n\nKeep the same composition, subject and style as the reference; render at higher fidelity.`,
    outputPath: input.outputPath,
    imageSize: input.imageSize || '2K',
    aspectRatio: input.aspectRatio,
    personGeneration: input.personGeneration,
  });

  if (!result.success) {
    return createErrorResult((result.error?.code as never) || WorkflowErrorCodes.GENERATION_FAILED, result.error?.message || 'Finalize failed');
  }
  return { success: true, data: { imagePath: result.data!.imagePath, cost: result.data!.cost } };
}

// =============================================================================
// WORKFLOW 22: STORYBOARD (one cheap keyframe per scene — approve before clips)
// =============================================================================

/**
 * Generate a keyframe image for each scene so the user can approve the whole video
 * visually (~$0.067/scene) BEFORE paying for clips (~$0.40/s). Pass a character
 * reference to keep the subject consistent across scenes.
 */
export async function generateStoryboard(
  input: StoryboardInput
): Promise<WorkflowResult<StoryboardOutput>> {
  if (!input.scenes || input.scenes.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one scene is required');
  }
  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  try {
    ensureDir(input.outputDir);

    let reference: Buffer | undefined;
    let referenceMime: string | undefined;
    if (input.referenceImagePath) {
      validateImageFile(input.referenceImagePath);
      reference = fs.readFileSync(input.referenceImagePath);
      referenceMime = getMimeType(input.referenceImagePath);
    }

    const config: Record<string, unknown> = {
      aspectRatio: input.aspectRatio || '9:16',
      imageSize: input.previewSize || '1K',
    };
    const personGen = toImagePersonGeneration(input.personGeneration);
    if (personGen) config.personGeneration = personGen;

    const keyframes: StoryboardKeyframe[] = [];
    const failed: string[] = [];
    let totalCost = 0;

    for (let i = 0; i < input.scenes.length; i++) {
      const scene = input.scenes[i];
      const n = String(i + 1).padStart(2, '0');
      try {
        const result = await withRetry(
          () => gemini31FlashImage({
            userPrompt: scene.prompt,
            ...(reference && { imageInput: reference, imageMimeType: referenceMime }),
            config,
          }),
          { maxRetries: 2, initialDelayMs: 1500 },
          `Storyboard scene ${i + 1}`
        );
        if (result.success && result.data.images.length > 0) {
          const outPath = path.join(input.outputDir, `scene-${n}-${scene.name}.png`);
          fs.writeFileSync(outPath, result.data.images[0].data);
          keyframes.push({ scene: scene.name, imagePath: outPath });
          totalCost += result.data.cost.totalCost;
        } else {
          failed.push(scene.name);
        }
      } catch {
        failed.push(scene.name);
      }
      await sleep(1000);
    }

    if (keyframes.length === 0) {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, 'Failed to generate any keyframes');
    }

    const out: WorkflowResult<StoryboardOutput> = {
      success: true,
      data: { keyframes, cost: { totalCost, breakdown: { keyframes: totalCost } } },
    };
    if (failed.length) {
      out.error = { code: WorkflowErrorCodes.PARTIAL_FAILURE, message: `Some scenes failed: ${failed.join(', ')}` };
    }
    return out;
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error generating storyboard';
    console.error(`[Workflow] generateStoryboard failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 23: HOOKS (scroll-stopping opening lines, multiple angles)
// =============================================================================

/**
 * Generate scroll-stopping hooks across distinct angles (problem, curiosity,
 * result, contrarian, question, stat, story). The creative bottleneck, solved.
 */
export async function generateHooks(
  input: HooksInput
): Promise<WorkflowResult<HooksOutput>> {
  if (!input.topic || input.topic.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'topic is required');
  }

  const count = input.count && input.count > 0 ? Math.min(input.count, 20) : 8;

  try {
    const system = `You are a direct-response copywriter who writes scroll-stopping social hooks. `
      + `Hooks are punchy (≤ 14 words), specific, and land in the first second. `
      + `Vary the angle across: problem, curiosity, result, contrarian, question, stat, story.`;
    const user = `Write ${count} hooks for this:\n`
      + `Topic: ${input.topic}\n`
      + (input.audience ? `Audience: ${input.audience}\n` : '')
      + (input.painPoint ? `Pain point: ${input.painPoint}\n` : '')
      + (input.platform ? `Platform: ${input.platform}\n` : '')
      + `\nRespond ONLY with a JSON array: [{"text":"...","angle":"problem|curiosity|result|contrarian|question|stat|story"}]`;

    const result = await withRetry(
      () => gemini25Flash({ systemPrompt: system, userPrompt: user }),
      { maxRetries: 2 },
      'Hook generation'
    );
    if (!result.success) {
      return createErrorResult(getErrorCode(new Error(result.error?.message)), result.error?.message || 'Hook generation failed');
    }

    const hooks = parseJsonResponse<Hook[]>(result.data.text);
    if (!hooks || !Array.isArray(hooks) || hooks.length === 0) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'Could not parse hooks from model output');
    }

    return {
      success: true,
      data: {
        hooks: hooks.filter(h => h && h.text),
        cost: { totalCost: result.data.cost.totalCost, breakdown: { text: result.data.cost.totalCost } },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error generating hooks';
    console.error(`[Workflow] generateHooks failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 24: SCRIPT (structured, framework-driven)
// =============================================================================

/**
 * Write a structured short-form script using a proven framework
 * (AIDA / PAS / BAB / hook-retain-reward / star-story-solution). Returns
 * labelled sections with voiceover + visual direction, sized to the duration.
 */
export async function generateScript(
  input: ScriptInput
): Promise<WorkflowResult<ScriptOutput>> {
  if (!input.brief || input.brief.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'brief is required');
  }

  const framework = input.framework || 'hook-retain-reward';
  const duration = input.durationSeconds || 30;
  const targetWords = Math.round(duration * 2.5); // ~2.5 wps at natural pace

  try {
    const system = `You are a short-form video scriptwriter. Use the ${framework} framework. `
      + `Write spoken-style voiceover (no stage directions inside the VO) plus a brief visual cue per section. `
      + `Keep total voiceover near ${targetWords} words for a ${duration}s video.`;
    const user = `Brief: ${input.brief}\n`
      + (input.hook ? `Open with this hook: "${input.hook}"\n` : '')
      + (input.cta ? `End with this CTA: "${input.cta}"\n` : '')
      + (input.platform ? `Platform: ${input.platform}\n` : '')
      + `\nRespond ONLY with JSON: {"sections":[{"label":"Hook","voiceover":"...","visual":"..."}]}`;

    const result = await withRetry(
      () => gemini25Flash({ systemPrompt: system, userPrompt: user }),
      { maxRetries: 2 },
      'Script generation'
    );
    if (!result.success) {
      return createErrorResult(getErrorCode(new Error(result.error?.message)), result.error?.message || 'Script generation failed');
    }

    const parsed = parseJsonResponse<{ sections: ScriptSection[] }>(result.data.text);
    if (!parsed || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'Could not parse script from model output');
    }

    const wordCount = parsed.sections.reduce((sum, s) => sum + (s.voiceover?.split(/\s+/).filter(Boolean).length || 0), 0);

    return {
      success: true,
      data: {
        framework,
        sections: parsed.sections,
        wordCount,
        estimatedDurationSeconds: Math.round(wordCount / 2.5),
        cost: { totalCost: result.data.cost.totalCost, breakdown: { text: result.data.cost.totalCost } },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error generating script';
    console.error(`[Workflow] generateScript failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 25: CAPTION (platform-aware post copy + hashtags)
// =============================================================================

/**
 * Write platform-aware caption variants with hashtags — the publish-ready last mile.
 */
export async function generateCaption(
  input: CaptionInput
): Promise<WorkflowResult<CaptionOutput>> {
  if (!input.topic || input.topic.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'topic is required');
  }
  if (!input.platform) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'platform is required');
  }

  const count = input.count && input.count > 0 ? Math.min(input.count, 10) : 3;

  const guidance: Record<string, string> = {
    tiktok: 'short and punchy (≤150 chars), 3–5 trending hashtags',
    instagram: 'engaging first line, line breaks, 5–10 hashtags',
    youtube: 'descriptive, keyword-rich first two lines, 3–5 hashtags',
    facebook: 'conversational, minimal hashtags (0–3)',
  };

  try {
    const system = `You are a social media manager writing ${input.platform} captions. `
      + `Style: ${guidance[input.platform] || 'platform-appropriate'}. `
      + (input.tone ? `Tone: ${input.tone}. ` : '')
      + `No emojis-only spam; hooks first.`;
    const user = `Topic: ${input.topic}\n`
      + (input.cta ? `CTA: ${input.cta}\n` : '')
      + `Write ${count} distinct caption variants.\n`
      + `Respond ONLY with JSON: {"captions":[{"text":"...","hashtags":["#x"]}]}`;

    const result = await withRetry(
      () => gemini25Flash({ systemPrompt: system, userPrompt: user }),
      { maxRetries: 2 },
      'Caption generation'
    );
    if (!result.success) {
      return createErrorResult(getErrorCode(new Error(result.error?.message)), result.error?.message || 'Caption generation failed');
    }

    const parsed = parseJsonResponse<{ captions: CaptionVariant[] }>(result.data.text);
    if (!parsed || !Array.isArray(parsed.captions) || parsed.captions.length === 0) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'Could not parse captions from model output');
    }

    return {
      success: true,
      data: {
        captions: parsed.captions.map(c => ({ text: c.text, hashtags: Array.isArray(c.hashtags) ? c.hashtags : [] })),
        cost: { totalCost: result.data.cost.totalCost, breakdown: { text: result.data.cost.totalCost } },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error generating caption';
    console.error(`[Workflow] generateCaption failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW 26: OUTPUT QA (review an image/keyframe before committing budget)
// =============================================================================

/**
 * Review a generated image/keyframe against brand + restrictions using multimodal
 * analysis: on-brand colors, accidental in-frame text, claim/restriction violations,
 * subject consistency, aspect, and quality artifacts. Run it on cheap previews/keyframes
 * BEFORE paying for the full render or video clips.
 *
 * Returns a structured report; `pass` is false if any error-severity issue is found.
 */
export async function reviewOutput(
  input: QAInput
): Promise<WorkflowResult<QAReport>> {
  if (!input.imagePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'imagePath is required');
  }

  try {
    validateImageFile(input.imagePath);
    const imageBuffer = fs.readFileSync(input.imagePath);
    const mimeType = getMimeType(input.imagePath);

    const checks = input.checks && input.checks.length
      ? input.checks
      : (['brand-colors', 'unwanted-text', 'claims', 'consistency', 'aspect', 'quality'] as QAInput['checks'])!;

    const rubric: string[] = [];
    if (checks.includes('brand-colors'))
      rubric.push(`brand-colors: do the dominant colors fit the brand palette${input.brandColors?.length ? ` (${input.brandColors.join(', ')})` : ''}? Judge by FAMILY, not exact hex — AI-painted backgrounds legitimately vary in shade; flag only clearly off-palette hues (e.g. red where navy belongs), never a near-match of the same color.`);
    if (checks.includes('unwanted-text'))
      rubric.push('unwanted-text: is there ANY rendered text, watermark, logo, or garbled lettering in the image? (usually unwanted)');
    if (checks.includes('claims'))
      rubric.push(`claims: does anything shown violate these restrictions or make an unsupported claim${input.restrictions?.length ? ` (avoid: ${input.restrictions.join(', ')})` : ''}?`);
    if (checks.includes('consistency'))
      rubric.push(`consistency: does the main subject match this expected description${input.expectedSubject ? `: "${input.expectedSubject}"` : ' (if a subject was specified)'}?`);
    if (checks.includes('aspect'))
      rubric.push(`aspect: is the framing/aspect ratio appropriate${input.expectedAspect ? ` (expected ${input.expectedAspect})` : ''}?`);
    if (checks.includes('quality'))
      rubric.push('quality: any artifacts — extra fingers, distorted faces/hands, blur, warping, melted text?');

    const system = `You are a meticulous creative QA reviewer for marketing content`
      + `${input.brandTone ? ` (brand tone: ${input.brandTone})` : ''}. `
      + `Inspect the image against the checklist and report honestly. An "error" severity means do-not-ship.`;
    const user = `Review this image against:\n- ${rubric.join('\n- ')}\n\n`
      + `Respond ONLY with JSON: {"score":0-100,"summary":"...","issues":[{"check":"brand-colors|unwanted-text|claims|consistency|aspect|quality","severity":"error|warning|info","detail":"..."}]}`;

    const result = await withRetry(
      () => gemini25Flash({ systemPrompt: system, userPrompt: user, imageInput: imageBuffer, imageMimeType: mimeType }),
      { maxRetries: 2 },
      'Output QA'
    );
    if (!result.success) {
      return createErrorResult(getErrorCode(new Error(result.error?.message)), result.error?.message || 'QA review failed');
    }

    const parsed = parseJsonResponse<{ score?: number; summary?: string; issues?: QAIssue[] }>(result.data.text);
    if (!parsed) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'Could not parse QA report from model output');
    }

    const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
    const pass = !issues.some(i => i.severity === 'error');

    return {
      success: true,
      data: {
        pass,
        score: typeof parsed.score === 'number' ? parsed.score : (pass ? 80 : 40),
        issues,
        summary: parsed.summary || (pass ? 'No blocking issues found' : 'Issues found'),
        cost: { totalCost: result.data.cost.totalCost, breakdown: { review: result.data.cost.totalCost } },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during QA review';
    console.error(`[Workflow] reviewOutput failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// SEEDANCE 2.0 WORKFLOWS
// =============================================================================
//
// Seedance 2.0 is ByteDance's multimodal AI video generation model with native
// audio generation (dialogue + SFX + music), lip-sync, and multimodal references.
//
// Key differences from Veo:
// - Native audio generation with lip-sync
// - Up to 9 image refs, 3 video refs, 3 audio refs (12 total)
// - 4-15 second duration limit
// - More aspect ratio options (16:9, 9:16, 4:3, 3:4, 21:9, 1:1)
//
// These workflows use the OpenRouter API to call Seedance 2.0 (bytedance/seedance-2.0).
// Requires OPENROUTER_API_KEY or OPENROUTER_API_KEYS in environment.
// =============================================================================

import type {
  SeedanceAspectRatio,
  SeedanceAudioConfig,
  SeedanceCameraConfig,
  SeedanceStyleConfig,
  SeedanceConstraints,
  SeedanceReference,
  SeedanceShot,
  SeedanceTextToVideoInput,
  SeedanceVideoOutput,
  SeedanceImageToVideoInput,
  SeedanceVideoToVideoInput,
  SeedanceAudioToVideoInput,
  SeedanceMultiRefVideoInput,
  SeedanceSpeakingVideoInput,
  SeedanceMultiShotVideoInput,
  SeedanceMultiShotVideoOutput,
  SeedanceExtendVideoInput,
  SeedanceExtendVideoOutput,
  SeedanceModifyVideoInput,
  SeedanceModifyVideoOutput,
} from './types.js';

// -----------------------------------------------------------------------------
// SEEDANCE PROMPT BUILDERS
// -----------------------------------------------------------------------------

/**
 * Build camera movement string from config
 */
function buildSeedanceCameraPrompt(camera?: SeedanceCameraConfig): string {
  if (!camera) return '';

  const parts: string[] = [];

  if (camera.shotType) {
    const shotMap: Record<string, string> = {
      'wide': 'wide shot',
      'establishing': 'establishing shot',
      'medium': 'medium shot',
      'close-up': 'close-up',
      'extreme-close-up': 'extreme close-up',
      'pov': 'POV shot',
    };
    parts.push(shotMap[camera.shotType] || camera.shotType);
  }

  if (camera.movement && camera.movement !== 'fixed') {
    const speed = camera.speed || 'smooth';
    parts.push(`${speed} ${camera.movement.replace('-', ' ')}`);
  } else if (camera.movement === 'fixed') {
    parts.push('locked camera');
  }

  if (camera.angle && camera.angle !== 'eye-level') {
    parts.push(`${camera.angle.replace('-', ' ')}`);
  }

  if (camera.lens) {
    const lensMap: Record<string, string> = {
      'wide-angle': 'wide-angle lens with subtle distortion',
      'telephoto': 'telephoto compression',
      'shallow-dof': 'shallow depth of field',
      'deep-focus': 'deep focus',
    };
    if (lensMap[camera.lens]) parts.push(lensMap[camera.lens]);
  }

  return parts.length > 0 ? `CAMERA: ${parts.join(', ')}.` : '';
}

/**
 * Build style/lighting string from config
 */
function buildSeedanceStylePrompt(style?: SeedanceStyleConfig): string {
  if (!style) return '';

  const parts: string[] = [];

  if (style.lighting) {
    const lightingMap: Record<string, string> = {
      'golden-hour': 'soft golden hour lighting, warm amber tones, long shadows',
      'dramatic-rim': 'dramatic rim light against dark background, high contrast',
      'soft-diffused': 'soft diffused lighting, gentle shadows, even illumination',
      'neon-colored': 'neon glow, colorful accent lights, urban night aesthetic',
      'volumetric': 'volumetric light beams through atmosphere, god rays',
      'practical': 'lit by in-frame practical sources, realistic',
      'studio': 'professional three-point lighting, clean, commercial',
    };
    parts.push(lightingMap[style.lighting] || style.lighting);
  }

  if (style.style) {
    const styleMap: Record<string, string> = {
      'cinematic': '35mm film quality, ARRI ALEXA aesthetic, professional color grading',
      'documentary': 'observational, handheld, authentic, raw footage feel',
      'commercial': 'premium production design, polished, advertising quality',
      'editorial': 'high-fashion, magazine quality, dramatic lighting',
      'retro-film': 'heavy film grain, slightly desaturated, vintage color',
      'futuristic': 'sci-fi aesthetic, sleek technology, neon accents',
    };
    parts.push(styleMap[style.style] || style.style);
  }

  if (style.atmosphere && style.atmosphere.length > 0) {
    parts.push(style.atmosphere.join(', '));
  }

  if (style.quality && style.quality.length > 0) {
    parts.push(style.quality.join(', '));
  }

  return parts.length > 0 ? `STYLE: ${parts.join('. ')}.` : '';
}

/**
 * Build audio description from config
 */
function buildSeedanceAudioPrompt(audio?: SeedanceAudioConfig): string {
  if (!audio) return '';

  const parts: string[] = [];

  if (audio.dialogue) {
    const tone = audio.dialogueTone || 'speaks calmly';
    parts.push(`DIALOGUE: Character ${tone}: "${audio.dialogue}"`);
  }

  if (audio.sfx && audio.sfx.length > 0) {
    parts.push(`SFX: ${audio.sfx.join(', ')}`);
  }

  if (audio.music) {
    if (audio.music === 'no music') {
      parts.push('no music');
    } else {
      parts.push(`MUSIC: ${audio.music}`);
    }
  }

  if (audio.audioPriority && audio.audioPriority !== 'balanced') {
    parts.push(`Audio priority: ${audio.audioPriority} prominent`);
  }

  return parts.join('\n');
}

/**
 * Build constraints string from config
 */
function buildSeedanceConstraintsPrompt(constraints?: SeedanceConstraints): string {
  if (!constraints) return 'CONSTRAINTS: stable composition, consistent identity, no distortion.';

  const parts: string[] = [];

  if (constraints.avoidJitter !== false) parts.push('avoid jitter');
  if (constraints.avoidBentLimbs !== false) parts.push('avoid bent limbs');
  if (constraints.avoidTemporalFlicker) parts.push('avoid temporal flicker');
  if (constraints.avoidIdentityDrift !== false) parts.push('avoid identity drift, consistent face');
  parts.push('stable composition', 'no distortion');

  if (constraints.custom && constraints.custom.length > 0) {
    parts.push(...constraints.custom);
  }

  return `CONSTRAINTS: ${parts.join(', ')}.`;
}

/**
 * Build reference instruction for multimodal inputs
 */
function buildSeedanceReferencePrompt(references: SeedanceReference[]): string {
  if (!references || references.length === 0) return '';

  const instructions: string[] = [];

  // Group by type
  const images = references.filter(r => r.type === 'image');
  const videos = references.filter(r => r.type === 'video');
  const audios = references.filter(r => r.type === 'audio');

  images.forEach((ref, i) => {
    const tag = `@image${i + 1}`;
    const purposeMap: Record<string, string> = {
      'character': `Extract character from ${tag}, maintain exact facial features and appearance`,
      'product': `Reference product appearance from ${tag}, maintain exact shape and details`,
      'style': `Match visual style of ${tag}`,
      'environment': `Reference environment/setting from ${tag}`,
    };
    const instruction = ref.instruction || purposeMap[ref.purpose] || `Reference ${tag}`;
    instructions.push(instruction);
  });

  videos.forEach((ref, i) => {
    const tag = `@video${i + 1}`;
    const purposeMap: Record<string, string> = {
      'action': `Reference action/motion from ${tag}, apply to new scene`,
      'camera': `Reference camera movement from ${tag}`,
    };
    const instruction = ref.instruction || purposeMap[ref.purpose] || `Reference ${tag}`;
    instructions.push(instruction);
  });

  audios.forEach((ref, i) => {
    const tag = `@audio${i + 1}`;
    const instruction = ref.instruction || `Sync to rhythm/timing of ${tag}`;
    instructions.push(instruction);
  });

  return instructions.length > 0 ? `REFERENCES:\n${instructions.join('\n')}` : '';
}

/**
 * Build full Seedance prompt following 6-part structure
 */
function buildSeedancePrompt(opts: {
  subject: string;
  action?: string;
  environment?: string;
  camera?: SeedanceCameraConfig;
  style?: SeedanceStyleConfig;
  audio?: SeedanceAudioConfig;
  constraints?: SeedanceConstraints;
  references?: SeedanceReference[];
}): string {
  const parts: string[] = [];

  // 1. Subject (critical - first 20-30 words)
  parts.push(`SUBJECT: ${opts.subject}`);

  // 2. Action
  if (opts.action) {
    parts.push(`ACTION: ${opts.action}`);
  }

  // 3. Environment
  if (opts.environment) {
    parts.push(`ENVIRONMENT: ${opts.environment}`);
  }

  // 4. Camera
  const cameraPrompt = buildSeedanceCameraPrompt(opts.camera);
  if (cameraPrompt) parts.push(cameraPrompt);

  // 5. Style
  const stylePrompt = buildSeedanceStylePrompt(opts.style);
  if (stylePrompt) parts.push(stylePrompt);

  // References (if any)
  if (opts.references && opts.references.length > 0) {
    const refPrompt = buildSeedanceReferencePrompt(opts.references);
    if (refPrompt) parts.push(refPrompt);
  }

  // Audio
  const audioPrompt = buildSeedanceAudioPrompt(opts.audio);
  if (audioPrompt) parts.push(audioPrompt);

  // 6. Constraints
  parts.push(buildSeedanceConstraintsPrompt(opts.constraints));

  return parts.join('\n\n');
}

// -----------------------------------------------------------------------------
// SEEDANCE WORKFLOW FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * 1. Seedance Text to Video
 *
 * Generate video from text description with optional audio layers.
 *
 * @example
 * ```typescript
 * const result = await seedanceTextToVideo({
 *   subject: 'A confident woman in her late 20s with dark shoulder-length hair',
 *   action: 'strides through a rain-soaked neon-lit street',
 *   environment: 'Tokyo alley at night, reflections on wet pavement',
 *   camera: { movement: 'tracking', speed: 'smooth', shotType: 'medium' },
 *   style: { lighting: 'neon-colored', style: 'cinematic' },
 *   audio: {
 *     sfx: ['rain on pavement', 'distant city ambience'],
 *     music: 'atmospheric synthwave, mysterious mood',
 *   },
 *   outputPath: 'output/scene.mp4',
 *   duration: 8,
 *   aspectRatio: '9:16',
 * });
 * ```
 */
export async function seedanceTextToVideo(
  input: SeedanceTextToVideoInput
): Promise<WorkflowResult<SeedanceVideoOutput>> {
  // Validate
  if (!input.subject || input.subject.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Subject description is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  const duration = input.duration || 8;
  if (duration < 4 || duration > 15) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Seedance duration must be 4-15 seconds');
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    const prompt = buildSeedancePrompt({
      subject: input.subject,
      action: input.action,
      environment: input.environment,
      camera: input.camera,
      style: input.style,
      audio: input.audio,
      constraints: input.constraints,
    });

    console.log(`[Seedance] Generating video (${duration}s) via OpenRouter...`);
    console.log(`[Seedance] Prompt:\n${prompt}\n`);

    // Use OpenRouter Seedance 2.0 API
    const result = await withRetry<OpenRouterResult<OpenRouterVideoResponse>>(
      () => generateOpenRouterVideo({
        model: 'bytedance/seedance-2.0',
        prompt,
        config: {
          aspectRatio: input.aspectRatio as '16:9' | '9:16' | '1:1' || '16:9',
          durationSeconds: duration,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Seedance text-to-video'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Seedance video generation failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    // Download video from URL and save to file
    const videoData = await downloadOpenRouterVideo(result.data.videos[0].url);
    fs.writeFileSync(input.outputPath, videoData);
    console.log(`[Seedance] Video saved: ${input.outputPath}`);

    // Determine audio layers present
    const audioLayers: ('dialogue' | 'sfx' | 'music')[] = [];
    if (input.audio?.dialogue) audioLayers.push('dialogue');
    if (input.audio?.sfx && input.audio.sfx.length > 0) audioLayers.push('sfx');
    if (input.audio?.music && input.audio.music !== 'no music') audioLayers.push('music');

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration,
        hasAudio: audioLayers.length > 0,
        audioLayers,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Seedance] seedanceTextToVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}

/**
 * 2. Seedance Image to Video
 *
 * Generate video from image reference(s) with character/product consistency.
 *
 * @example
 * ```typescript
 * const result = await seedanceImageToVideo({
 *   referenceImages: 'assets/character-front.png',
 *   referenceType: 'character',
 *   prompt: 'walks through a neon-lit street at night, maintaining exact facial features',
 *   camera: { movement: 'tracking', shotType: 'medium' },
 *   audio: { sfx: ['footsteps on wet pavement'] },
 *   outputPath: 'output/character-scene.mp4',
 *   duration: 8,
 * });
 * ```
 */
export async function seedanceImageToVideo(
  input: SeedanceImageToVideoInput
): Promise<WorkflowResult<SeedanceVideoOutput>> {
  // Validate
  if (!input.referenceImages ||
      (Array.isArray(input.referenceImages) && input.referenceImages.length === 0)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one reference image is required');
  }
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  const duration = input.duration || 8;
  if (duration < 4 || duration > 15) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Seedance duration must be 4-15 seconds');
  }

  // Normalize to array
  const imagePaths = Array.isArray(input.referenceImages)
    ? input.referenceImages
    : [input.referenceImages];

  if (imagePaths.length > 9) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Seedance supports up to 9 image references');
  }

  try {
    // Validate all images exist
    for (const imgPath of imagePaths) {
      validateImageFile(imgPath);
    }

    ensureDir(path.dirname(input.outputPath));

    // Build references
    const references: SeedanceReference[] = imagePaths.map((p, i) => ({
      path: p,
      type: 'image' as const,
      purpose: input.referenceType === 'multi-angle' ? 'character' : input.referenceType,
    }));

    // Build prompt with references
    const purposePrefix: Record<string, string> = {
      'character': 'Extract character from @image1, maintain exact facial features and appearance.',
      'product': 'Reference product from @image1, maintain exact shape, color, and details.',
      'style': 'Match the visual style and aesthetic of @image1.',
      'environment': 'Use environment/setting from @image1 as the scene background.',
      'multi-angle': `Reference @image1 (front)${imagePaths.length > 1 ? ', @image2 (side)' : ''}${imagePaths.length > 2 ? ', @image3 (back)' : ''} to maintain consistent 3D appearance.`,
    };

    const fullPrompt = buildSeedancePrompt({
      subject: `${purposePrefix[input.referenceType] || ''} ${input.prompt}`,
      camera: input.camera,
      style: input.style,
      audio: input.audio,
      constraints: {
        ...input.constraints,
        avoidIdentityDrift: true, // Always enable for image-based generation
      },
      references,
    });

    console.log(`[Seedance] Generating video from ${imagePaths.length} image(s) (${duration}s) via OpenRouter...`);

    // Use primary image as first frame reference (base64 encoded)
    const referenceImage = fs.readFileSync(imagePaths[0]);
    const firstFrameBase64 = referenceImage.toString('base64');

    const result = await withRetry<OpenRouterResult<OpenRouterVideoResponse>>(
      () => generateOpenRouterVideo({
        model: 'bytedance/seedance-2.0',
        prompt: fullPrompt,
        config: {
          aspectRatio: input.aspectRatio as '16:9' | '9:16' | '1:1' || '16:9',
          durationSeconds: duration,
          firstFrameImage: firstFrameBase64,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Seedance image-to-video'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Seedance image-to-video failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    // Download video from URL and save to file
    const videoData = await downloadOpenRouterVideo(result.data.videos[0].url);
    fs.writeFileSync(input.outputPath, videoData);
    console.log(`[Seedance] Video saved: ${input.outputPath}`);

    const audioLayers: ('dialogue' | 'sfx' | 'music')[] = [];
    if (input.audio?.dialogue) audioLayers.push('dialogue');
    if (input.audio?.sfx && input.audio.sfx.length > 0) audioLayers.push('sfx');
    if (input.audio?.music && input.audio.music !== 'no music') audioLayers.push('music');

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration,
        hasAudio: audioLayers.length > 0,
        audioLayers,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Seedance] seedanceImageToVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}

/**
 * 3. Seedance Speaking Video (Lip-Sync)
 *
 * Generate video with character speaking dialogue (lip-synced).
 * Optimized for close-up shots with front-facing character.
 *
 * @example
 * ```typescript
 * const result = await seedanceSpeakingVideo({
 *   characterImagePath: 'assets/character-front.png',
 *   environment: 'Modern office, soft natural lighting',
 *   dialogue: 'This product changed my life. I use it every single day.',
 *   dialogueTone: 'speaks warmly',
 *   audio: { music: 'no music', sfx: ['subtle room ambience'] },
 *   outputPath: 'output/testimonial.mp4',
 *   duration: 8,
 * });
 * ```
 */
export async function seedanceSpeakingVideo(
  input: SeedanceSpeakingVideoInput
): Promise<WorkflowResult<SeedanceVideoOutput>> {
  // Validate
  if (!input.characterImagePath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Character image path is required for lip-sync');
  }
  if (!input.dialogue || input.dialogue.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Dialogue is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  const duration = input.duration || 8;
  if (duration < 4 || duration > 15) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Seedance duration must be 4-15 seconds');
  }

  // Warn about duration for lip-sync quality
  if (duration > 8) {
    console.warn('[Seedance] Warning: Lip-sync quality is best for dialogues under 8 seconds');
  }

  try {
    validateImageFile(input.characterImagePath);
    ensureDir(path.dirname(input.outputPath));

    // Optimal lip-sync settings
    const camera: SeedanceCameraConfig = input.camera || {
      shotType: 'close-up',
      movement: 'fixed',
      angle: 'eye-level',
    };

    // Ensure close-up for lip-sync
    if (!camera.shotType || camera.shotType === 'wide' || camera.shotType === 'establishing') {
      camera.shotType = 'close-up';
      console.log('[Seedance] Auto-set to close-up for optimal lip-sync');
    }

    // Build audio with dialogue
    const audioConfig: SeedanceAudioConfig = {
      dialogue: input.dialogue,
      dialogueTone: input.dialogueTone || 'speaks calmly',
      ...input.audio,
    };

    const prompt = buildSeedancePrompt({
      subject: `@image1's character faces camera directly, clearly enunciating dialogue with natural mouth movements and visible lip articulation`,
      environment: input.environment || 'Neutral background, soft professional lighting',
      camera,
      style: input.style,
      audio: audioConfig,
      constraints: {
        ...input.constraints,
        avoidIdentityDrift: true,
        avoidJitter: true,
      },
      references: [{
        path: input.characterImagePath,
        type: 'image',
        purpose: 'character',
        instruction: 'Extract character from @image1, maintain exact facial features for lip-sync',
      }],
    });

    console.log(`[Seedance] Generating speaking video with lip-sync (${duration}s) via OpenRouter...`);

    // Use character image as first frame reference (base64 encoded)
    const referenceImage = fs.readFileSync(input.characterImagePath);
    const firstFrameBase64 = referenceImage.toString('base64');

    const result = await withRetry<OpenRouterResult<OpenRouterVideoResponse>>(
      () => generateOpenRouterVideo({
        model: 'bytedance/seedance-2.0',
        prompt,
        config: {
          aspectRatio: input.aspectRatio as '16:9' | '9:16' | '1:1' || '16:9',
          durationSeconds: duration,
          firstFrameImage: firstFrameBase64,
        },
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Seedance speaking video'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Seedance speaking video failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    // Download video from URL and save to file
    const videoData = await downloadOpenRouterVideo(result.data.videos[0].url);
    fs.writeFileSync(input.outputPath, videoData);
    console.log(`[Seedance] Speaking video saved: ${input.outputPath}`);

    const audioLayers: ('dialogue' | 'sfx' | 'music')[] = ['dialogue'];
    if (input.audio?.sfx && input.audio.sfx.length > 0) audioLayers.push('sfx');
    if (input.audio?.music && input.audio.music !== 'no music') audioLayers.push('music');

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration,
        hasAudio: true,
        audioLayers,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Seedance] seedanceSpeakingVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}

/**
 * 4. Seedance Multi-Shot Video
 *
 * Generate multiple shots with consistent character and transitions,
 * then optionally concatenate into a final video.
 *
 * @example
 * ```typescript
 * const result = await seedanceMultiShotVideo({
 *   characterImagePath: 'assets/character.png',
 *   shots: [
 *     { order: 1, duration: 4, prompt: 'enters the room cautiously', camera: { shotType: 'wide' }, transitionTo: 'hard-cut' },
 *     { order: 2, duration: 4, prompt: 'walks to the desk', camera: { shotType: 'medium', movement: 'tracking' }, transitionTo: 'dissolve' },
 *     { order: 3, duration: 4, prompt: 'picks up the phone, looks worried', camera: { shotType: 'close-up' } },
 *   ],
 *   style: { lighting: 'dramatic-rim', style: 'cinematic' },
 *   outputDir: 'output/multi-shot',
 *   concatenate: true,
 *   aspectRatio: '16:9',
 * });
 * ```
 */
export async function seedanceMultiShotVideo(
  input: SeedanceMultiShotVideoInput
): Promise<WorkflowResult<SeedanceMultiShotVideoOutput>> {
  // Validate
  if (!input.shots || input.shots.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one shot is required');
  }
  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  // Validate each shot
  for (const shot of input.shots) {
    if (shot.duration < 4 || shot.duration > 15) {
      return createErrorResult(
        WorkflowErrorCodes.INVALID_INPUT,
        `Shot ${shot.order}: Duration must be 4-15 seconds (got ${shot.duration})`
      );
    }
    if (!shot.prompt || shot.prompt.trim().length === 0) {
      return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, `Shot ${shot.order}: Prompt is required`);
    }
  }

  try {
    ensureDir(input.outputDir);

    // Validate character image if provided
    if (input.characterImagePath) {
      validateImageFile(input.characterImagePath);
    }

    // Sort shots by order
    const sortedShots = [...input.shots].sort((a, b) => a.order - b.order);

    const shotPaths: string[] = [];
    let totalCost = 0;
    let totalDuration = 0;

    // Generate each shot
    for (let i = 0; i < sortedShots.length; i++) {
      const shot = sortedShots[i];
      const shotPath = path.join(input.outputDir, `shot-${String(i + 1).padStart(2, '0')}.mp4`);

      console.log(`[Seedance] Generating shot ${i + 1}/${sortedShots.length} (${shot.duration}s)...`);

      // Build shot-specific prompt
      const references: SeedanceReference[] = [];
      if (input.characterImagePath) {
        references.push({
          path: input.characterImagePath,
          type: 'image',
          purpose: 'character',
          instruction: '@image1\'s character, maintain exact appearance',
        });
      }

      // Include transition description
      let transitionNote = '';
      if (shot.transitionTo && i < sortedShots.length - 1) {
        const transitionMap: Record<string, string> = {
          'hard-cut': 'End with clean frame for hard cut',
          'dissolve': 'End with subtle pause for dissolve transition',
          'whip-pan': 'End with camera beginning to whip right',
          'push-through': 'End with camera pushing into subject',
          'match-cut': 'End with a strong visual element to match',
          'fade': 'End with slight fade to black',
        };
        transitionNote = transitionMap[shot.transitionTo] || '';
      }

      const prompt = buildSeedancePrompt({
        subject: `Shot ${shot.order}: ${shot.prompt}${transitionNote ? `. ${transitionNote}` : ''}`,
        camera: shot.camera || { shotType: 'medium' },
        style: input.style,
        audio: shot.audio,
        constraints: {
          ...input.constraints,
          avoidIdentityDrift: !!input.characterImagePath,
        },
        references,
      });

      // Generate shot via OpenRouter Seedance
      const videoConfig: OpenRouterVideoConfig = {
        aspectRatio: input.aspectRatio as '16:9' | '9:16' | '1:1' || '16:9',
        durationSeconds: shot.duration,
      };

      // Add character image as first frame if available
      if (input.characterImagePath) {
        const referenceImage = fs.readFileSync(input.characterImagePath);
        videoConfig.firstFrameImage = referenceImage.toString('base64');
      }

      const result = await withRetry<OpenRouterResult<OpenRouterVideoResponse>>(
        () => generateOpenRouterVideo({
          model: 'bytedance/seedance-2.0',
          prompt,
          config: videoConfig,
        }),
        { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
        `Seedance shot ${i + 1}`
      );

      if (!result.success) {
        return createErrorResult(
          getErrorCode(new Error(result.error?.message)),
          `Shot ${i + 1} failed: ${result.error?.message}`
        );
      }

      if (!result.data.videos.length) {
        return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, `Shot ${i + 1}: No video was generated`);
      }

      // Download video from URL and save to file
      const videoData = await downloadOpenRouterVideo(result.data.videos[0].url);
      fs.writeFileSync(shotPath, videoData);
      shotPaths.push(shotPath);
      totalCost += result.data.cost.totalCost;
      totalDuration += shot.duration;

      console.log(`[Seedance] Shot ${i + 1} saved: ${shotPath}`);
    }

    // Concatenate if requested
    let finalPath: string | undefined;
    if (input.concatenate && shotPaths.length > 1) {
      finalPath = path.join(input.outputDir, 'final.mp4');
      console.log(`[Seedance] Concatenating ${shotPaths.length} shots...`);

      // Create concat file list
      const concatListPath = path.join(input.outputDir, 'concat-list.txt');
      const concatContent = shotPaths.map(p => `file '${path.basename(p)}'`).join('\n');
      fs.writeFileSync(concatListPath, concatContent);

      try {
        execSync(
          `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalPath}"`,
          { cwd: input.outputDir, stdio: 'pipe' }
        );
        console.log(`[Seedance] Final video saved: ${finalPath}`);

        // Clean up concat list
        fs.unlinkSync(concatListPath);
      } catch (ffmpegError) {
        console.error('[Seedance] FFmpeg concatenation failed, individual shots are still available');
        finalPath = undefined;
      }
    }

    return {
      success: true,
      data: {
        shotPaths,
        finalPath,
        totalDuration,
        cost: {
          totalCost,
          breakdown: { video: totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Seedance] seedanceMultiShotVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}

/**
 * 5. Seedance Multi-Reference Video
 *
 * Generate video using multiple reference inputs (images, videos, audio).
 * Maximum: 9 images + 3 videos + 3 audio = 12 total references.
 *
 * @example
 * ```typescript
 * const result = await seedanceMultiRefVideo({
 *   references: [
 *     { path: 'assets/character.png', type: 'image', purpose: 'character' },
 *     { path: 'assets/outfit.png', type: 'image', purpose: 'style', instruction: 'Use outfit from @image2' },
 *     { path: 'assets/music.mp3', type: 'audio', purpose: 'audio-sync' },
 *   ],
 *   prompt: 'Character dances to the rhythm of the music in a neon-lit club',
 *   camera: { movement: 'orbit', speed: 'dynamic' },
 *   style: { lighting: 'neon-colored' },
 *   outputPath: 'output/multi-ref.mp4',
 *   duration: 10,
 * });
 * ```
 */
export async function seedanceMultiRefVideo(
  input: SeedanceMultiRefVideoInput
): Promise<WorkflowResult<SeedanceVideoOutput>> {
  // Validate
  if (!input.references || input.references.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one reference is required');
  }
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  // Count references by type
  const imageRefs = input.references.filter(r => r.type === 'image');
  const videoRefs = input.references.filter(r => r.type === 'video');
  const audioRefs = input.references.filter(r => r.type === 'audio');

  if (imageRefs.length > 9) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Maximum 9 image references allowed');
  }
  if (videoRefs.length > 3) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Maximum 3 video references allowed');
  }
  if (audioRefs.length > 3) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Maximum 3 audio references allowed');
  }

  const duration = input.duration || 8;
  if (duration < 4 || duration > 15) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Seedance duration must be 4-15 seconds');
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    // Validate all reference files exist
    for (const ref of input.references) {
      if (!fs.existsSync(ref.path)) {
        return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `Reference not found: ${ref.path}`);
      }
    }

    const prompt = buildSeedancePrompt({
      subject: input.prompt,
      camera: input.camera,
      style: input.style,
      audio: input.audio,
      constraints: input.constraints,
      references: input.references,
    });

    console.log(`[Seedance] Generating video with ${input.references.length} references (${duration}s) via OpenRouter...`);

    // Build config with optional first frame image
    const videoConfig: OpenRouterVideoConfig = {
      aspectRatio: input.aspectRatio as '16:9' | '9:16' | '1:1' || '16:9',
      durationSeconds: duration,
    };

    // Use primary image reference as first frame if available
    if (imageRefs.length > 0) {
      const referenceImage = fs.readFileSync(imageRefs[0].path);
      videoConfig.firstFrameImage = referenceImage.toString('base64');
    }

    const result = await withRetry<OpenRouterResult<OpenRouterVideoResponse>>(
      () => generateOpenRouterVideo({
        model: 'bytedance/seedance-2.0',
        prompt,
        config: videoConfig,
      }),
      { maxRetries: 2, initialDelayMs: 5000, maxDelayMs: 60000 },
      'Seedance multi-reference video'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Seedance multi-reference video failed'
      );
    }

    if (!result.data.videos.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No video was generated');
    }

    // Download video from URL and save to file
    const videoData = await downloadOpenRouterVideo(result.data.videos[0].url);
    fs.writeFileSync(input.outputPath, videoData);
    console.log(`[Seedance] Video saved: ${input.outputPath}`);

    const audioLayers: ('dialogue' | 'sfx' | 'music')[] = [];
    if (input.audio?.dialogue) audioLayers.push('dialogue');
    if (input.audio?.sfx && input.audio.sfx.length > 0) audioLayers.push('sfx');
    if (input.audio?.music && input.audio.music !== 'no music') audioLayers.push('music');
    if (audioRefs.length > 0) {
      // Audio reference implies audio sync
      if (!audioLayers.includes('music')) audioLayers.push('music');
    }

    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        duration,
        hasAudio: audioLayers.length > 0,
        audioLayers,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Seedance] seedanceMultiRefVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// PRE-GENERATION CONTENT REVIEW
// =============================================================================

import type {
  ReviewSeverity,
  ReviewIssue,
  ReviewResult,
  ReviewContentPlanInput,
  ReviewScriptInput,
  ReviewImagePromptInput,
  ReviewVideoPromptInput,
  ReviewBatchPromptsInput,
  ReviewBatchOutput,
} from './types.js';

/**
 * Common prompt issues to check for
 */
const PROMPT_ANTI_PATTERNS = [
  { pattern: /text\s+(says?|reads?|overlay|appears?|showing)/i, message: 'Text in prompts will be garbled - add text via FFmpeg post-production' },
  { pattern: /caption|title\s+card|words?\s+on\s+screen/i, message: 'Text/captions should be added via FFmpeg, not in the prompt' },
  { pattern: /logo\s+(appears?|shows?|displays?)/i, message: 'Logos render poorly - add via FFmpeg overlay' },
  { pattern: /watermark/i, message: 'Watermarks should be added in post-production' },
  { pattern: /\b(guarantee|guaranteed|risk.?free|cure|miracle)\b/i, message: 'Potentially problematic claim language' },
];

/**
 * Video-specific issues
 */
const VIDEO_ANTI_PATTERNS = [
  { pattern: /zoom\s+in\s+and\s+out|pan\s+left\s+and\s+right/i, message: 'Conflicting camera movements - pick one direction per clip' },
  { pattern: /multiple\s+(scenes?|shots?|clips?)/i, message: 'Each video prompt should be ONE scene - use multi-shot workflow for sequences' },
  { pattern: /cut\s+to|transition\s+to|then\s+we\s+see/i, message: 'Transitions belong in multi-shot workflow, not single prompt' },
  { pattern: /\d+\s*-\s*\d+\s*seconds?/i, message: 'Duration should be set via API parameter, not in prompt' },
];

/**
 * Image-specific issues
 */
const IMAGE_ANTI_PATTERNS = [
  { pattern: /animated|animation|moves?|moving/i, message: 'Images are static - use video workflow for animation' },
  { pattern: /before\s+and\s+after/i, message: 'Split into two separate image prompts for before/after' },
  { pattern: /collage|grid|multiple\s+(images?|photos?)/i, message: 'Generate separate images and composite via design tools' },
];

/**
 * Script pacing guidelines (words per second varies by style)
 */
const SCRIPT_PACING: Record<string, { wps: number; tolerance: number }> = {
  ad: { wps: 3.0, tolerance: 0.4 },           // Generic ad (same as ad_direct)
  ad_hype: { wps: 3.5, tolerance: 0.5 },      // Fast, punchy
  ad_direct: { wps: 3.0, tolerance: 0.4 },    // Clear, direct
  explainer: { wps: 2.5, tolerance: 0.3 },    // Educational pace
  testimonial: { wps: 2.8, tolerance: 0.4 },  // Authentic feel
  tutorial: { wps: 2.2, tolerance: 0.3 },     // Slow, clear
  ugc: { wps: 3.2, tolerance: 0.5 },          // Natural speech
};

/**
 * Review a script/hook before generating voiceover or video dialogue
 *
 * @example
 * ```typescript
 * const result = await reviewScript({
 *   script: 'This product will cure your problems guaranteed!',
 *   targetDuration: 15,
 *   restrictions: ['cure', 'guaranteed'],
 *   contentType: 'ad',
 * });
 * // result.pass === false (has restriction violations)
 * ```
 */
export async function reviewScript(
  input: ReviewScriptInput
): Promise<WorkflowResult<ReviewResult>> {
  const issues: ReviewIssue[] = [];
  let score = 100;

  const script = input.script.trim();
  const wordCount = script.split(/\s+/).filter(w => w.length > 0).length;

  // Check for restriction violations
  if (input.restrictions && input.restrictions.length > 0) {
    for (const restriction of input.restrictions) {
      const regex = new RegExp(`\\b${restriction}\\b`, 'gi');
      if (regex.test(script)) {
        issues.push({
          category: 'restrictions',
          severity: 'error',
          message: `Contains restricted word/phrase: "${restriction}"`,
          suggestion: `Remove or rephrase to avoid "${restriction}"`,
        });
        score -= 20;
      }
    }
  }

  // Check pacing if duration specified
  if (input.targetDuration) {
    const pacing = SCRIPT_PACING[input.contentType || 'ad_direct'];
    const expectedWords = input.targetDuration * pacing.wps;
    const tolerance = expectedWords * pacing.tolerance;

    if (wordCount > expectedWords + tolerance) {
      const overBy = Math.round(wordCount - expectedWords);
      issues.push({
        category: 'pacing',
        severity: 'warning',
        message: `Script too long: ${wordCount} words for ${input.targetDuration}s (expected ~${Math.round(expectedWords)})`,
        suggestion: `Cut ~${overBy} words or increase duration to ${Math.round(wordCount / pacing.wps)}s`,
      });
      score -= 10;
    } else if (wordCount < expectedWords - tolerance) {
      const underBy = Math.round(expectedWords - wordCount);
      issues.push({
        category: 'pacing',
        severity: 'warning',
        message: `Script too short: ${wordCount} words for ${input.targetDuration}s (expected ~${Math.round(expectedWords)})`,
        suggestion: `Add ~${underBy} words or reduce duration to ${Math.round(wordCount / pacing.wps)}s`,
      });
      score -= 5;
    }
  }

  // Check for common issues
  for (const antiPattern of PROMPT_ANTI_PATTERNS) {
    if (antiPattern.pattern.test(script)) {
      issues.push({
        category: 'content',
        severity: 'warning',
        message: antiPattern.message,
      });
      score -= 5;
    }
  }

  // Check hook strength (first sentence)
  const firstSentence = script.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length > 80) {
    issues.push({
      category: 'hook',
      severity: 'suggestion',
      message: 'Hook (first sentence) is long - consider shortening for impact',
      suggestion: 'First 3 seconds are critical - make the hook punchy',
    });
    score -= 3;
  }

  // Check for CTA
  const ctaPatterns = /\b(click|tap|link|bio|sign up|download|try|get|buy|shop|order|subscribe|follow)\b/i;
  if (!ctaPatterns.test(script)) {
    issues.push({
      category: 'cta',
      severity: 'suggestion',
      message: 'No clear call-to-action detected',
      suggestion: 'Add a CTA like "Link in bio" or "Try it free"',
    });
    score -= 5;
  }

  const pass = !issues.some(i => i.severity === 'error');
  score = Math.max(0, Math.min(100, score));

  // Estimate savings (cost of regenerating voiceover + potential video)
  const potentialSavings = pass ? 0 : 0.05 + (input.targetDuration || 30) * 0.08;

  return {
    success: true,
    data: {
      pass,
      score,
      issues,
      summary: pass
        ? `Script OK (${wordCount} words, ${issues.length} suggestions)`
        : `Script has ${issues.filter(i => i.severity === 'error').length} errors - fix before generating`,
      potentialSavings,
    },
  };
}

/**
 * Review an image prompt before generation
 *
 * @example
 * ```typescript
 * const result = await reviewImagePrompt({
 *   prompt: 'Woman holding product with text overlay showing price',
 *   aspectRatio: '9:16',
 *   restrictions: ['text', 'price'],
 * });
 * // result.pass === false (has text in prompt)
 * ```
 */
export async function reviewImagePrompt(
  input: ReviewImagePromptInput
): Promise<WorkflowResult<ReviewResult>> {
  const issues: ReviewIssue[] = [];
  let score = 100;

  const prompt = input.prompt.trim();

  // Check for common anti-patterns
  for (const antiPattern of [...PROMPT_ANTI_PATTERNS, ...IMAGE_ANTI_PATTERNS]) {
    if (antiPattern.pattern.test(prompt)) {
      issues.push({
        category: 'prompt-quality',
        severity: antiPattern.message.includes('Text') ? 'error' : 'warning',
        message: antiPattern.message,
      });
      score -= antiPattern.message.includes('Text') ? 15 : 5;
    }
  }

  // Check for restrictions
  if (input.restrictions && input.restrictions.length > 0) {
    for (const restriction of input.restrictions) {
      const regex = new RegExp(`\\b${restriction}\\b`, 'gi');
      if (regex.test(prompt)) {
        issues.push({
          category: 'restrictions',
          severity: 'error',
          message: `Contains restricted word/phrase: "${restriction}"`,
          suggestion: `Remove or rephrase to avoid "${restriction}"`,
        });
        score -= 15;
      }
    }
  }

  // Check prompt length
  if (prompt.length < 30) {
    issues.push({
      category: 'detail',
      severity: 'warning',
      message: 'Prompt is very short - may produce generic results',
      suggestion: 'Add details: lighting, composition, style, mood',
    });
    score -= 10;
  }

  // Check for person without description
  if (input.expectsPerson && !input.characterDescription) {
    const personTerms = /\b(person|man|woman|people|human|character)\b/i;
    if (personTerms.test(prompt)) {
      issues.push({
        category: 'consistency',
        severity: 'warning',
        message: 'Person mentioned but no character reference provided',
        suggestion: 'Use generateImageVariation() with character reference for consistency',
      });
      score -= 10;
    }
  }

  // Check for style keywords
  const styleKeywords = /\b(style|aesthetic|cinematic|professional|minimalist|vibrant|moody|dramatic)\b/i;
  if (!styleKeywords.test(prompt)) {
    issues.push({
      category: 'style',
      severity: 'suggestion',
      message: 'No style keywords detected',
      suggestion: 'Add style direction: "cinematic", "professional photography", "minimalist", etc.',
    });
    score -= 3;
  }

  // Check for lighting
  const lightingKeywords = /\b(light|lighting|lit|shadow|golden hour|backlit|soft|harsh|natural|studio)\b/i;
  if (!lightingKeywords.test(prompt)) {
    issues.push({
      category: 'lighting',
      severity: 'suggestion',
      message: 'No lighting direction specified',
      suggestion: 'Add lighting: "soft natural light", "golden hour", "studio lighting"',
    });
    score -= 3;
  }

  const pass = !issues.some(i => i.severity === 'error');
  score = Math.max(0, Math.min(100, score));

  // Estimate savings (cost of image generation)
  const potentialSavings = pass ? 0 : 0.067; // 1K image cost

  return {
    success: true,
    data: {
      pass,
      score,
      issues,
      summary: pass
        ? `Image prompt OK (score: ${score}, ${issues.length} suggestions)`
        : `Image prompt has ${issues.filter(i => i.severity === 'error').length} errors - fix before generating`,
      potentialSavings,
    },
  };
}

/**
 * Review a video prompt before generation
 *
 * @example
 * ```typescript
 * const result = await reviewVideoPrompt({
 *   prompt: 'Camera zooms in and out while panning left',
 *   duration: 8,
 *   provider: 'veo',
 * });
 * // result.pass === false (conflicting camera movements)
 * ```
 */
export async function reviewVideoPrompt(
  input: ReviewVideoPromptInput
): Promise<WorkflowResult<ReviewResult>> {
  const issues: ReviewIssue[] = [];
  let score = 100;

  const prompt = input.prompt.trim();

  // Check for common anti-patterns
  for (const antiPattern of [...PROMPT_ANTI_PATTERNS, ...VIDEO_ANTI_PATTERNS]) {
    if (antiPattern.pattern.test(prompt)) {
      issues.push({
        category: 'prompt-quality',
        severity: antiPattern.message.includes('Text') || antiPattern.message.includes('Conflicting') ? 'error' : 'warning',
        message: antiPattern.message,
      });
      score -= antiPattern.message.includes('error') ? 15 : 8;
    }
  }

  // Check for restrictions
  if (input.restrictions && input.restrictions.length > 0) {
    for (const restriction of input.restrictions) {
      const regex = new RegExp(`\\b${restriction}\\b`, 'gi');
      if (regex.test(prompt)) {
        issues.push({
          category: 'restrictions',
          severity: 'error',
          message: `Contains restricted word/phrase: "${restriction}"`,
          suggestion: `Remove or rephrase to avoid "${restriction}"`,
        });
        score -= 15;
      }
    }
  }

  // Check prompt length for video
  if (prompt.length < 50) {
    issues.push({
      category: 'detail',
      severity: 'warning',
      message: 'Video prompt is short - may produce generic results',
      suggestion: 'Add details: camera movement, lighting, action, environment',
    });
    score -= 10;
  }

  // Check for camera movement
  const cameraKeywords = /\b(pan|tilt|dolly|track|crane|zoom|static|handheld|orbit|follow)\b/i;
  if (!cameraKeywords.test(prompt)) {
    issues.push({
      category: 'camera',
      severity: 'suggestion',
      message: 'No camera movement specified',
      suggestion: 'Add camera direction: "slow dolly in", "static shot", "handheld follow"',
    });
    score -= 3;
  }

  // Provider-specific checks
  if (input.provider === 'veo' && input.hasSpeakingCharacter) {
    issues.push({
      category: 'provider',
      severity: 'warning',
      message: 'Veo does not have native lip-sync - audio may not match mouth movements',
      suggestion: 'Consider using Seedance via OpenRouter for speaking characters',
    });
    score -= 5;
  }

  if (input.provider === 'seedance' && !input.dialogue && input.hasSpeakingCharacter) {
    issues.push({
      category: 'dialogue',
      severity: 'error',
      message: 'Speaking character specified but no dialogue provided',
      suggestion: 'Add dialogue text for Seedance lip-sync',
    });
    score -= 15;
  }

  // Check character consistency
  if (input.characterDescription) {
    const charTerms = input.characterDescription.toLowerCase().split(/\s+/);
    const promptLower = prompt.toLowerCase();
    const missingTerms = charTerms.filter(t => t.length > 3 && !promptLower.includes(t));
    if (missingTerms.length > 2) {
      issues.push({
        category: 'consistency',
        severity: 'suggestion',
        message: 'Prompt may not match character reference',
        suggestion: `Include key character details: ${missingTerms.slice(0, 3).join(', ')}`,
      });
      score -= 3;
    }
  }

  const pass = !issues.some(i => i.severity === 'error');
  score = Math.max(0, Math.min(100, score));

  // Estimate savings (cost of video generation)
  const duration = input.duration || 8;
  const costPerSec = input.provider === 'seedance' ? 0.05 : 0.08;
  const potentialSavings = pass ? 0 : duration * costPerSec;

  return {
    success: true,
    data: {
      pass,
      score,
      issues,
      summary: pass
        ? `Video prompt OK (score: ${score}, ${issues.length} suggestions)`
        : `Video prompt has ${issues.filter(i => i.severity === 'error').length} errors - fix before generating`,
      potentialSavings,
    },
  };
}

/**
 * Review a content plan before generation
 *
 * @example
 * ```typescript
 * const result = await reviewContentPlan({
 *   planPath: 'projects/my-project/content-plans/day-01/content-01-video.md',
 *   brandPath: 'projects/my-project/templates/brand.md',
 *   contentType: 'video',
 * });
 * ```
 */
export async function reviewContentPlan(
  input: ReviewContentPlanInput
): Promise<WorkflowResult<ReviewResult>> {
  const issues: ReviewIssue[] = [];
  let score = 100;

  // Read the plan file
  if (!fs.existsSync(input.planPath)) {
    return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `Plan file not found: ${input.planPath}`);
  }

  const planContent = fs.readFileSync(input.planPath, 'utf-8');

  // Check for required sections based on content type
  const requiredSections: Record<string, string[]> = {
    video: ['hook', 'scene', 'cta', 'audience', 'duration'],
    image: ['subject', 'style', 'mood', 'composition'],
    carousel: ['slides', 'theme', 'style'],
    audio: ['script', 'voice', 'tone'],
    music: ['style', 'mood', 'duration'],
  };

  const sections = requiredSections[input.contentType] || [];
  for (const section of sections) {
    const regex = new RegExp(`(^|\\n)#+\\s*${section}|\\*\\*${section}\\*\\*|${section}:`, 'i');
    if (!regex.test(planContent)) {
      issues.push({
        category: 'completeness',
        severity: 'warning',
        message: `Missing section: ${section}`,
        suggestion: `Add a "${section}" section to the plan`,
      });
      score -= 5;
    }
  }

  // Check for empty placeholder text
  const placeholderPatterns = [
    /\[TODO\]/i,
    /\[FILL IN\]/i,
    /\[INSERT\]/i,
    /TBD/,
    /\.\.\./g,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(planContent)) {
      issues.push({
        category: 'completeness',
        severity: 'error',
        message: 'Plan contains unfilled placeholders',
        suggestion: 'Fill in all placeholder text before generating',
      });
      score -= 15;
      break;
    }
  }

  // Check brand alignment if brand file provided
  if (input.brandPath && fs.existsSync(input.brandPath)) {
    const brandContent = fs.readFileSync(input.brandPath, 'utf-8');

    // Extract restrictions from brand file
    const restrictionsMatch = brandContent.match(/never_say[:\s]*\[([^\]]+)\]/i) ||
                              brandContent.match(/restrictions[:\s]*([^\n]+)/i);
    if (restrictionsMatch) {
      const restrictions = restrictionsMatch[1].split(/[,\s]+/).filter(r => r.length > 2);
      for (const restriction of restrictions) {
        const cleanRestriction = restriction.replace(/['"]/g, '').trim();
        if (cleanRestriction && planContent.toLowerCase().includes(cleanRestriction.toLowerCase())) {
          issues.push({
            category: 'brand',
            severity: 'error',
            message: `Plan contains restricted term: "${cleanRestriction}"`,
            suggestion: `Remove or rephrase - this violates brand guidelines`,
          });
          score -= 15;
        }
      }
    }
  }

  // Check for cost estimate
  if (!/cost|budget|\$\d/i.test(planContent)) {
    issues.push({
      category: 'planning',
      severity: 'suggestion',
      message: 'No cost estimate in plan',
      suggestion: 'Add estimated cost to track budget',
    });
    score -= 3;
  }

  const pass = !issues.some(i => i.severity === 'error');
  score = Math.max(0, Math.min(100, score));

  // Estimate potential savings based on content type
  const typeCosts = { video: 2.40, image: 0.067, carousel: 0.40, audio: 0.05, music: 0.08 };
  const potentialSavings = pass ? 0 : (typeCosts[input.contentType] || 1);

  return {
    success: true,
    data: {
      pass,
      score,
      issues,
      summary: pass
        ? `Content plan OK (score: ${score}, ${issues.length} suggestions)`
        : `Content plan has ${issues.filter(i => i.severity === 'error').length} errors - fix before generating`,
      potentialSavings,
    },
  };
}

/**
 * Review multiple prompts/scripts in batch
 *
 * @example
 * ```typescript
 * const result = await reviewBatch({
 *   imagePrompts: ['prompt 1', 'prompt 2'],
 *   videoPrompts: ['video prompt 1'],
 *   scripts: ['script 1'],
 *   restrictions: ['guaranteed', 'cure'],
 * });
 * console.log(result.data.totalPotentialSavings);
 * ```
 */
export async function reviewBatch(
  input: ReviewBatchPromptsInput
): Promise<WorkflowResult<ReviewBatchOutput>> {
  const results: { type: 'image' | 'video' | 'script'; index: number; result: ReviewResult }[] = [];
  let totalSavings = 0;
  let totalScore = 0;
  let count = 0;

  // Review image prompts
  if (input.imagePrompts) {
    for (let i = 0; i < input.imagePrompts.length; i++) {
      const review = await reviewImagePrompt({
        prompt: input.imagePrompts[i],
        restrictions: input.restrictions,
        brandColors: input.brandColors,
      });
      if (review.success && review.data) {
        results.push({ type: 'image', index: i, result: review.data });
        totalSavings += review.data.potentialSavings || 0;
        totalScore += review.data.score;
        count++;
      }
    }
  }

  // Review video prompts
  if (input.videoPrompts) {
    for (let i = 0; i < input.videoPrompts.length; i++) {
      const review = await reviewVideoPrompt({
        prompt: input.videoPrompts[i],
        restrictions: input.restrictions,
      });
      if (review.success && review.data) {
        results.push({ type: 'video', index: i, result: review.data });
        totalSavings += review.data.potentialSavings || 0;
        totalScore += review.data.score;
        count++;
      }
    }
  }

  // Review scripts
  if (input.scripts) {
    for (let i = 0; i < input.scripts.length; i++) {
      const review = await reviewScript({
        script: input.scripts[i],
        restrictions: input.restrictions,
      });
      if (review.success && review.data) {
        results.push({ type: 'script', index: i, result: review.data });
        totalSavings += review.data.potentialSavings || 0;
        totalScore += review.data.score;
        count++;
      }
    }
  }

  const pass = results.every(r => r.result.pass);
  const averageScore = count > 0 ? Math.round(totalScore / count) : 0;
  const errorCount = results.filter(r => !r.result.pass).length;

  return {
    success: true,
    data: {
      pass,
      averageScore,
      results,
      totalPotentialSavings: totalSavings,
      summary: pass
        ? `All ${count} items passed review (avg score: ${averageScore})`
        : `${errorCount}/${count} items have errors - fix before generating (potential savings: $${totalSavings.toFixed(2)})`,
    },
  };
}

// =============================================================================
// THUMBNAIL REVIEW
// =============================================================================

import type {
  ThumbnailType,
  ThumbnailStyle,
  ReviewThumbnailInput,
  ThumbnailReviewResult,
} from './types.js';

/**
 * Thumbnail-specific anti-patterns
 */
const THUMBNAIL_ANTI_PATTERNS = [
  { pattern: /text\s+(says?|reads?|showing|displays?)/i, message: 'Text in thumbnail prompt will be garbled - add text in post-production' },
  { pattern: /logo|watermark|brand\s+mark/i, message: 'Logos render poorly in AI - overlay in post-production' },
  { pattern: /small\s+(face|person|figure)/i, message: 'Face should fill 40%+ of frame for thumbnail - use close-up' },
  { pattern: /multiple\s+(people|faces|persons)/i, message: 'Multiple faces hard to see at thumbnail size - focus on one subject' },
  { pattern: /busy|complex|detailed\s+background/i, message: 'Busy backgrounds reduce thumbnail impact - use simple backgrounds' },
];

/**
 * Platform-specific aspect ratio requirements
 */
const THUMBNAIL_ASPECTS: Record<string, { aspect: string; minWidth: number }> = {
  'youtube': { aspect: '16:9', minWidth: 1280 },
  'tiktok': { aspect: '9:16', minWidth: 1080 },
  'instagram-reel': { aspect: '9:16', minWidth: 1080 },
  'podcast': { aspect: '1:1', minWidth: 1400 },
  'linkedin': { aspect: '16:9', minWidth: 1200 },
  'social-post': { aspect: '1:1', minWidth: 1080 },
};

/**
 * Review a thumbnail prompt before generation
 *
 * This function checks:
 * - Text/logo anti-patterns (AI generates garbled text)
 * - Character reference requirements (consistency)
 * - Platform-specific requirements
 * - Composition guidelines (face size, contrast, etc.)
 *
 * @example
 * ```typescript
 * const result = await reviewThumbnail({
 *   prompt: 'Person with excited expression on blue background',
 *   thumbnailType: 'youtube',
 *   includesPerson: true,
 *   hasCharacterReference: false,
 * });
 *
 * if (!result.data.pass) {
 *   console.log('Issues:', result.data.issues);
 *   console.log('Next steps:', result.data.nextSteps);
 *   // ["Generate character keyframe first", "Use generateImageVariation"]
 * }
 * ```
 */
export async function reviewThumbnail(
  input: ReviewThumbnailInput
): Promise<WorkflowResult<ThumbnailReviewResult>> {
  const issues: ReviewIssue[] = [];
  let score = 100;
  const nextSteps: string[] = [];

  const prompt = input.prompt.trim();

  // Determine character status
  let characterStatus: 'has-reference' | 'needs-reference' | 'not-needed' = 'not-needed';
  let recommendedWorkflow: 'generateImageVariation' | 'generateSingleImage' = 'generateSingleImage';

  // Check if person is included and reference status
  if (input.includesPerson) {
    if (input.hasCharacterReference && input.characterReferencePath) {
      characterStatus = 'has-reference';
      recommendedWorkflow = 'generateImageVariation';

      // Check if file exists
      if (!fs.existsSync(input.characterReferencePath)) {
        issues.push({
          category: 'character',
          severity: 'error',
          message: `Character reference file not found: ${input.characterReferencePath}`,
          suggestion: 'Verify the character reference path or generate a new one',
        });
        score -= 20;
      }
    } else {
      characterStatus = 'needs-reference';
      issues.push({
        category: 'character',
        severity: 'error',
        message: 'Thumbnail includes person but no character reference provided',
        suggestion: 'Provide character reference image or generate one first for consistency',
      });
      score -= 25;
      nextSteps.push('1. Generate character keyframe: generateSingleImage() with detailed description');
      nextSteps.push('2. Register in asset registry: registerAsset()');
      nextSteps.push('3. Generate thumbnail: generateImageVariation() with reference');
    }

    // Check for video character consistency
    if (input.forVideo && input.videoCharacterPath) {
      if (input.characterReferencePath !== input.videoCharacterPath) {
        issues.push({
          category: 'consistency',
          severity: 'error',
          message: 'Thumbnail character must match video character',
          suggestion: `Use same reference as video: ${input.videoCharacterPath}`,
        });
        score -= 20;
      }
    } else if (input.forVideo && !input.videoCharacterPath) {
      issues.push({
        category: 'consistency',
        severity: 'warning',
        message: 'Video thumbnail - ensure character matches video',
        suggestion: 'Use same character reference image as video generation',
      });
      score -= 10;
    }
  }

  // Check for thumbnail anti-patterns
  for (const antiPattern of THUMBNAIL_ANTI_PATTERNS) {
    if (antiPattern.pattern.test(prompt)) {
      const isError = antiPattern.message.includes('garbled') || antiPattern.message.includes('poorly');
      issues.push({
        category: 'thumbnail-quality',
        severity: isError ? 'error' : 'warning',
        message: antiPattern.message,
      });
      score -= isError ? 15 : 8;
    }
  }

  // Check for common prompt anti-patterns
  for (const antiPattern of PROMPT_ANTI_PATTERNS) {
    if (antiPattern.pattern.test(prompt)) {
      issues.push({
        category: 'prompt-quality',
        severity: 'warning',
        message: antiPattern.message,
      });
      score -= 5;
    }
  }

  // Check for expression/emotion in face thumbnails
  if (input.includesPerson && (input.style === 'face-emotion' || input.thumbnailType === 'youtube')) {
    const emotionKeywords = /\b(expression|excited|shocked|surprised|happy|curious|angry|smile|wide.?eyes?)\b/i;
    if (!emotionKeywords.test(prompt)) {
      issues.push({
        category: 'expression',
        severity: 'warning',
        message: 'No expression/emotion specified for face thumbnail',
        suggestion: 'Add: "shocked expression", "excited smile", "curious look"',
      });
      score -= 8;
    }
  }

  // Check for high contrast/bright colors
  const contrastKeywords = /\b(high contrast|bright|vibrant|saturated|bold|eye.?catching)\b/i;
  if (!contrastKeywords.test(prompt)) {
    issues.push({
      category: 'visibility',
      severity: 'suggestion',
      message: 'No high-contrast or bright color keywords',
      suggestion: 'Add "high contrast", "bright saturated colors" for visibility',
    });
    score -= 5;
  }

  // Check for text space
  const textSpaceKeywords = /\b(space for text|negative space|text area|clear space)\b/i;
  if (!textSpaceKeywords.test(prompt)) {
    issues.push({
      category: 'layout',
      severity: 'suggestion',
      message: 'No text space specified',
      suggestion: 'Add "negative space on [left/right] for text overlay"',
    });
    score -= 3;
  }

  // Platform-specific checks
  const platformSpec = THUMBNAIL_ASPECTS[input.thumbnailType];
  if (platformSpec) {
    const aspectKeyword = new RegExp(platformSpec.aspect.replace(':', '[:\\s]'), 'i');
    if (!aspectKeyword.test(prompt)) {
      issues.push({
        category: 'format',
        severity: 'suggestion',
        message: `${input.thumbnailType} uses ${platformSpec.aspect} aspect ratio`,
        suggestion: `Set aspectRatio: '${platformSpec.aspect}' in API call`,
      });
      score -= 2;
    }
  }

  // Check restrictions
  if (input.restrictions && input.restrictions.length > 0) {
    for (const restriction of input.restrictions) {
      const regex = new RegExp(`\\b${restriction}\\b`, 'gi');
      if (regex.test(prompt)) {
        issues.push({
          category: 'restrictions',
          severity: 'error',
          message: `Contains restricted word: "${restriction}"`,
          suggestion: `Remove or rephrase to avoid "${restriction}"`,
        });
        score -= 15;
      }
    }
  }

  const pass = !issues.some(i => i.severity === 'error');
  score = Math.max(0, Math.min(100, score));

  // Add workflow guidance if pass
  if (pass && nextSteps.length === 0) {
    if (characterStatus === 'has-reference') {
      nextSteps.push(`Use generateImageVariation() with referenceImagePath`);
    } else {
      nextSteps.push('Use generateSingleImage() for faceless thumbnail');
    }
  }

  // Calculate potential savings
  const thumbnailCost = 0.10; // 2K image
  const characterCost = characterStatus === 'needs-reference' ? 0.067 : 0;
  const potentialSavings = pass ? 0 : thumbnailCost + characterCost;

  return {
    success: true,
    data: {
      pass,
      score,
      issues,
      summary: pass
        ? `Thumbnail OK (score: ${score}, use ${recommendedWorkflow})`
        : `Thumbnail has ${issues.filter(i => i.severity === 'error').length} errors - fix first`,
      potentialSavings,
      recommendedWorkflow,
      characterStatus,
      nextSteps,
    },
  };
}

// =============================================================================
// WORKFLOW: REVIEW VIDEO OUTPUT (auto-QA for generated video)
// =============================================================================

/**
 * QA a generated VIDEO the same way reviewOutput QAs an image: samples N frames
 * evenly across the runtime, runs the vision QA rubric on each, and adds
 * container-level checks (duration, audio track). Agents run this after every
 * video generation so they know when to fix instead of shipping blind.
 * Cost: ~$0.002-0.01 (N vision calls). Frames land next to the video in .qa/.
 */
export async function reviewVideoOutput(
  input: ReviewVideoInput
): Promise<WorkflowResult<ReviewVideoOutput>> {
  if (!input.videoPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'videoPath is required');
  }
  if (!fs.existsSync(input.videoPath)) {
    return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `Video not found: ${input.videoPath}`);
  }

  try {
    const probe = (args: string) =>
      execSync(`ffprobe -v error ${args} "${input.videoPath}"`, { stdio: 'pipe' }).toString().trim();

    const durationSeconds = parseFloat(probe('-show_entries format=duration -of csv=p=0'));
    const hasAudio = probe('-select_streams a -show_entries stream=codec_type -of csv=p=0').length > 0;

    const containerIssues: string[] = [];
    if (input.expectAudio && !hasAudio) {
      containerIssues.push('expected an audio track (VO/ambience) but the video is silent');
    }
    if (
      input.expectedDurationSeconds !== undefined &&
      Math.abs(durationSeconds - input.expectedDurationSeconds) > 1.5
    ) {
      containerIssues.push(
        `duration ${durationSeconds.toFixed(1)}s is off target ${input.expectedDurationSeconds}s`
      );
    }

    // Sample frames evenly, avoiding the very first/last frame (fades).
    const frameCount = Math.min(Math.max(input.frameCount ?? 4, 1), 10);
    const qaDir = path.join(path.dirname(input.videoPath), '.qa');
    ensureDir(qaDir);
    const stem = path.basename(input.videoPath).replace(/\.[^.]+$/, '');

    const frames: ReviewVideoOutput['frames'] = [];
    let totalCost = 0;
    let minScore = 100;

    for (let i = 0; i < frameCount; i++) {
      const at = Math.max(0.1, (durationSeconds * (i + 0.5)) / frameCount);
      const framePath = path.join(qaDir, `${stem}-f${i + 1}.png`);
      execSync(
        `ffmpeg -y -loglevel error -ss ${at.toFixed(2)} -i "${input.videoPath}" -frames:v 1 "${framePath}"`,
        { stdio: 'pipe' }
      );

      const report = await reviewOutput({
        imagePath: framePath,
        checks: input.checks,
        brandColors: input.brandColors,
        brandTone: input.brandTone,
        restrictions: input.restrictions,
        expectedAspect: input.expectedAspect,
        expectedSubject: input.expectedSubject,
      } as QAInput);

      if (report.success && report.data) {
        frames.push({
          atSeconds: Math.round(at * 10) / 10,
          score: report.data.score,
          summary: report.data.summary,
          issues: (report.data.issues as unknown[]) || [],
        });
        minScore = Math.min(minScore, report.data.score);
        totalCost += report.data.cost?.totalCost ?? 0;
      } else {
        frames.push({
          atSeconds: Math.round(at * 10) / 10,
          score: 0,
          summary: `frame review failed: ${report.error?.message || 'unknown'}`,
          issues: [],
        });
        minScore = 0;
      }
    }

    const score = Math.max(0, minScore - containerIssues.length * 15);
    const pass = score >= 70 && containerIssues.length === 0;
    const summary = pass
      ? `PASS (${score}) — ${frameCount} frames clean, ${durationSeconds.toFixed(1)}s, audio: ${hasAudio}`
      : `NEEDS FIX (${score}) — worst frame ${minScore}` +
        (containerIssues.length ? `; container: ${containerIssues.join('; ')}` : '') +
        ' — see frames[] for what to regenerate';

    return {
      success: true,
      data: {
        pass,
        score,
        durationSeconds: Math.round(durationSeconds * 100) / 100,
        hasAudio,
        summary,
        frames,
        issues: containerIssues,
        cost: { totalCost, breakdown: { qa: totalCost } },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] reviewVideoOutput failed: ${message}`);
    return createErrorResult(code, message);
  }
}


// =============================================================================
// WORKFLOW: GENERATE OMNI VIDEO CLIP (Gemini Omni Flash — experimental)
// =============================================================================

/**
 * Omni Flash art-style presets → prompt fragments. Present these ids to the
 * user and ASK which one fits (or photorealistic / their own custom style)
 * before generating stylized Omni content — do not silently pick one.
 */
export const OMNI_ART_STYLES: Record<OmniArtStyle, string> = {
  'pixel-art':
    'Retro pixel art style, chunky 16-bit pixels, limited color palette, crisp dithered shading',
  'claymation':
    'Claymation stop-motion style, hand-molded clay characters with visible fingerprints, slightly jerky 12fps motion, miniature set',
  'mixed-media':
    'Mixed-media collage style, photo cutouts layered with paper textures, hand-drawn scribbles and tape marks, stop-motion feel',
  '3d-papercraft':
    '3D papercraft style, layered cut-paper diorama, folded edges and soft studio shadows, handcrafted depth',
  'whiteboard-doodle':
    'Whiteboard doodle style, hand-drawn black marker line art on white, sketchy line-boil animation, simple stick-figure charm',
  '2d-illustration':
    'Flat 2D illustration style, clean vector shapes, bold editorial color blocking, minimal outlines, smooth motion-graphics animation',
  'low-poly':
    'Low-poly 3D style, faceted geometric surfaces, flat-shaded polygons, soft gradient lighting',
  '3d-mix':
    '3D-mixed style, polished 3D rendered subject blended with flat 2D graphic elements and hand-drawn accents',
  'isometric-flat-vector':
    'Isometric flat vector style, precise 30-degree geometry, clean pastel palette, miniature world feel',
  'fluffy-toy':
    'Fluffy plush toy style, soft fuzzy fabric textures, macro detail on stitching and felt, cozy toy-world lighting',
};

/**
 * Video via Gemini Omni Flash (Interactions API) — the multimodal alternative
 * to Veo. Different strengths: instruction-following/context over raw fidelity,
 * ~10s cap, 720p native. Token-priced ($17.5/M video-output tokens) — cost
 * varies per run, check the returned cost. Use Veo for cinematic quality; try
 * Omni for instruction-heavy beats (writing, UI, precise choreography),
 * stylized explainers (artStyle presets), multi-reference consistency
 * (reference_to_video), and editing existing clips (edit task).
 */
export async function generateOmniVideoClip(
  input: OmniVideoClipInput
): Promise<WorkflowResult<OmniVideoClipOutput>> {
  if (!input.prompt?.trim()) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required (.mp4)');
  }
  if (input.artStyle && !OMNI_ART_STYLES[input.artStyle]) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      `Unknown artStyle "${input.artStyle}". Valid: ${Object.keys(OMNI_ART_STYLES).join(', ')} (or omit for photorealistic)`
    );
  }
  const cameraMoveError = validateCameraMove(input.cameraMove);
  if (cameraMoveError) return cameraMoveError;

  try {
    ensureDir(path.dirname(input.outputPath));

    const refPaths = input.referenceImagePaths?.length
      ? input.referenceImagePaths
      : input.referenceImagePath
        ? [input.referenceImagePath]
        : [];
    if (refPaths.length > 5) {
      return createErrorResult(
        WorkflowErrorCodes.INVALID_INPUT,
        `Omni Flash accepts at most 5 reference images (got ${refPaths.length})`
      );
    }
    const images: Array<{ base64: string; mimeType?: string }> = [];
    for (const refPath of refPaths) {
      if (!fs.existsSync(refPath)) {
        return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `Reference image not found: ${refPath}`);
      }
      images.push({ base64: fs.readFileSync(refPath).toString('base64'), mimeType: getMimeType(refPath) });
    }

    let videoBase64: string | undefined;
    if (input.inputVideoPath) {
      if (!fs.existsSync(input.inputVideoPath)) {
        return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `Input video not found: ${input.inputVideoPath}`);
      }
      videoBase64 = fs.readFileSync(input.inputVideoPath).toString('base64');
    }

    const task =
      input.task ||
      (videoBase64
        ? 'edit'
        : images.length > 1
          ? 'reference_to_video'
          : images.length === 1
            ? 'image_to_video'
            : 'text_to_video');
    const styledPrompt = input.artStyle
      ? `Art style: ${OMNI_ART_STYLES[input.artStyle]}. ${input.prompt}`
      : input.prompt;
    const prompt = applyCameraMove(styledPrompt, input.cameraMove);

    console.log(`[Workflow] Generating Omni video (task: ${task}, ${input.duration || '8s'}, ${input.aspectRatio || '16:9'}, experimental)...`);

    const result = await withRetry(
      () => generateOmniVideo({
        prompt,
        images: images.length ? images : undefined,
        videoBase64,
        videoMimeType: input.inputVideoPath ? getMimeType(input.inputVideoPath) : undefined,
        task,
        aspectRatio: input.aspectRatio,
        duration: input.duration,
        thinkingLevel: input.thinkingLevel,
      }),
      { maxRetries: 2 },
      'Omni video generation'
    );

    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Omni video generation failed'
      );
    }
    if (!result.data) {
      return createErrorResult(WorkflowErrorCodes.GENERATION_FAILED, 'Omni returned no data');
    }

    try {
      fs.writeFileSync(input.outputPath, result.data.video.data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Omni video saved: ${input.outputPath}`);
    return {
      success: true,
      data: {
        videoPath: input.outputPath,
        modelNotes: result.data.text,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { video: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] generateOmniVideoClip failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// WORKFLOW: ANALYZE REFERENCE VIDEO ("I want to create something like that")
// =============================================================================

/** Render the breakdown as a human-readable scene-by-scene markdown doc. */
function renderBreakdownMarkdown(b: ReferenceVideoBreakdown): string {
  const lines: string[] = [
    `# Reference Video Breakdown`,
    ``,
    `**Source:** ${b.source}`,
    ...(b.title ? [`**Title:** ${b.title}`] : []),
    ...(b.duration ? [`**Duration:** ${b.duration}`] : []),
    ...(b.format ? [`**Format:** ${b.format}`] : []),
    `**Scenes:** ${b.scenes.length}`,
    ``,
    `## Style`,
    ``,
    b.styleSummary,
    ...(b.pacing ? [``, `**Pacing:** ${b.pacing}`] : []),
    ...(b.audio ? [
      ``,
      `**Audio:**`,
      ...(b.audio.music ? [`- Music: ${b.audio.music}`] : []),
      ...(b.audio.voiceover ? [`- Voiceover: ${b.audio.voiceover}`] : []),
      ...(b.audio.sfx ? [`- SFX: ${b.audio.sfx}`] : []),
    ] : []),
    ``,
    `## Scenes`,
    ``,
  ];
  for (const s of b.scenes) {
    lines.push(`### Scene ${s.index} · ${s.startTime}–${s.endTime} — ${s.purpose}`);
    lines.push(``);
    lines.push(`- **Shot:** ${s.shotType}${s.cameraMove ? ` · ${s.cameraMove}` : ''}`);
    lines.push(`- **Visual:** ${s.visualDescription}`);
    if (s.onScreenText) lines.push(`- **On-screen text:** ${s.onScreenText}`);
    if (s.dialogueOrVO) lines.push(`- **Spoken:** "${s.dialogueOrVO}"`);
    if (s.audioNotes) lines.push(`- **Audio:** ${s.audioNotes}`);
    lines.push(``);
  }
  return lines.join('\n');
}

/** Render the recreation blueprint as a ready-to-adapt markdown plan. */
function renderRecreationPlan(b: ReferenceVideoBreakdown): string {
  const r = b.recreation;
  const lines: string[] = [
    `# Recreation Blueprint`,
    ``,
    `> Adapted from: ${b.source}`,
    `> This is a STARTING POINT — run content-preflight, swap in YOUR brand/product/`,
    `> characters from the asset registry, and review prompts before generating.`,
    ``,
    ...(r.globalNotes ? [`## Global Notes`, ``, r.globalNotes, ``] : []),
    ...(r.musicBrief ? [`## Music Brief (generateMusicTrack)`, ``, r.musicBrief, ``] : []),
    `## Scene Prompts`,
    ``,
  ];
  for (const s of r.scenes) {
    lines.push(`### Scene ${s.index} (${s.durationSeconds}s) — \`${s.suggestedCommand}\``);
    lines.push(``);
    lines.push(`**Video prompt:**`);
    lines.push(``);
    lines.push('```');
    lines.push(s.videoPrompt);
    lines.push('```');
    if (s.voiceoverLine) {
      lines.push(``);
      lines.push(`**Voiceover:** "${s.voiceoverLine}"`);
    }
    lines.push(``);
  }
  return lines.join('\n');
}

/**
 * Analyze a reference video (YouTube URL or local file) into a scene-by-scene
 * breakdown + a recreation blueprint with per-scene video prompts and VO script.
 *
 * Use for: "analyze this video, I want to create something like that".
 * The blueprint feeds the normal preflight → pipeline → generate flow — it does
 * NOT generate anything itself (analysis is a cheap text call; generation is not).
 *
 * @example
 * const r = await analyzeReferenceVideo({
 *   youtubeUrl: 'https://www.youtube.com/watch?v=ODNzk5x2tR4',
 *   outputDir: 'projects/my-brand/output-contents/2026-07-07/ref-analysis',
 *   notes: 'Recreate for my coffee brand, 30s vertical',
 * });
 * console.log(r.data.sceneCount, r.data.breakdownMdPath);
 */
export async function analyzeReferenceVideo(
  input: AnalyzeReferenceVideoInput
): Promise<WorkflowResult<AnalyzeReferenceVideoOutput>> {
  // 1. VALIDATE — fail before spending tokens
  if (!input.youtubeUrl && !input.videoPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Provide youtubeUrl or videoPath');
  }
  if (input.youtubeUrl && input.videoPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Provide only ONE of youtubeUrl / videoPath');
  }
  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'outputDir is required');
  }
  if (input.youtubeUrl && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(input.youtubeUrl)) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, `Not a YouTube URL: ${input.youtubeUrl}`);
  }

  try {
    // 2. PREPARE — resolve the video source into provider inputs
    ensureDir(input.outputDir);
    const source = input.youtubeUrl || input.videoPath!;

    let videoFileUri: string | undefined;
    let videoInput: Buffer | undefined;
    let videoMimeType: string | undefined;

    if (input.youtubeUrl) {
      videoFileUri = input.youtubeUrl; // Gemini fetches YouTube directly
    } else {
      if (!fs.existsSync(input.videoPath!)) {
        return createErrorResult(WorkflowErrorCodes.FILE_NOT_FOUND, `Video not found: ${input.videoPath}`);
      }
      videoMimeType = getMimeType(input.videoPath!);
      if (!videoMimeType.startsWith('video/')) {
        return createErrorResult(WorkflowErrorCodes.INVALID_FILE_TYPE, `Not a video file: ${input.videoPath}`);
      }
      const sizeBytes = fs.statSync(input.videoPath!).size;
      const INLINE_LIMIT = 19 * 1024 * 1024; // stay under the ~20 MB request cap
      if (sizeBytes <= INLINE_LIMIT) {
        videoInput = fs.readFileSync(input.videoPath!);
      } else {
        console.log(`[Workflow] Video is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB — uploading via Files API...`);
        const upload = await uploadMediaFile(input.videoPath!, videoMimeType);
        if (!upload.success || !upload.fileUri) {
          return createErrorResult(WorkflowErrorCodes.API_ERROR, `Files API upload failed: ${upload.error}`);
        }
        videoFileUri = upload.fileUri;
        videoMimeType = upload.mimeType || videoMimeType;
      }
    }

    // 3. GENERATE (always inside withRetry)
    const systemPrompt =
      'You are a veteran film director and commercial video analyst. You break reference videos ' +
      'down scene by scene so a production team can recreate the same structure, pacing, and feel ' +
      'with their own subject matter. You are precise about timecodes, shot types, camera moves, ' +
      'on-screen text (verbatim), and spoken lines (verbatim). You respond ONLY with valid JSON.';

    const userPrompt =
      `Analyze this video scene by scene (a "scene" = one continuous shot or clear beat; split on cuts).` +
      `${input.language ? ` Spoken language: ${input.language}.` : ''}` +
      `${input.notes ? `\n\nRecreation intent from the user (tailor the recreation blueprint to this): ${input.notes}` : ''}` +
      `\n\nReturn ONLY a JSON object with EXACTLY this shape (no markdown fences, no commentary):\n` +
      JSON.stringify({
        title: 'video title if identifiable, else null',
        duration: 'total duration m:ss',
        format: "aspect + orientation, e.g. '16:9 horizontal'",
        styleSummary: 'overall look & feel: grading, grain, era, energy — 2-3 sentences',
        pacing: 'editing rhythm: avg scene length, cut style, transitions',
        audio: { music: 'style/energy or null', voiceover: 'narrator character or null', sfx: 'notable SFX or null' },
        scenes: [{
          index: 1,
          startTime: '0:00',
          endTime: '0:03',
          purpose: "narrative role, e.g. 'Opening hook'",
          shotType: "e.g. 'Medium shot'",
          cameraMove: 'movement or null',
          visualDescription: 'subject, setting, lighting, color — 1-2 sentences',
          onScreenText: 'burned-in text verbatim or null',
          dialogueOrVO: 'spoken words verbatim or null',
          audioNotes: 'music/SFX in this scene or null',
        }],
        recreation: {
          globalNotes: 'how to remake this: style keywords, consistency needs (characters/products), aspect ratio',
          musicBrief: 'one-line music generation brief or null',
          scenes: [{
            index: 1,
            durationSeconds: 3,
            suggestedCommand: 'generateSilentVideo | generateVideoFromImage | generateOmniVideoClip',
            videoPrompt: 'ready-to-use video generation prompt capturing this scene\'s shot type, camera move, lighting and mood — subject kept GENERIC so the user can swap in their own product/character',
            voiceoverLine: 'VO line to record for this scene or null',
          }],
        },
      }, null, 2) +
      `\n\nCover the FULL duration — every scene, no sampling. Use null (not empty strings) for absent fields.`;

    const result = await withRetry(
      () => gemini35Flash({
        systemPrompt,
        userPrompt,
        videoInput,
        videoMimeType,
        videoFileUri,
        config: { maxOutputTokens: 32768, temperature: 0.2 },
      }),
      { maxRetries: 2 },
      'Reference video analysis'
    );

    // 4. CHECK
    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Reference video analysis failed'
      );
    }

    // Parse the JSON (strip accidental code fences first)
    const raw = result.data.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let parsed: Omit<ReferenceVideoBreakdown, 'source'>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const rawPath = path.join(input.outputDir, 'breakdown-raw.txt');
      fs.writeFileSync(rawPath, result.data.text);
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        `Model did not return valid JSON — raw response saved to ${rawPath}. Retry the command.`
      );
    }
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'Analysis returned no scenes');
    }
    const breakdown: ReferenceVideoBreakdown = { source, ...parsed };
    breakdown.recreation = breakdown.recreation || { scenes: [] };

    // 5. SAVE (wrap the writes)
    const breakdownJsonPath = path.join(input.outputDir, 'breakdown.json');
    const breakdownMdPath = path.join(input.outputDir, 'breakdown.md');
    const recreationPlanPath = path.join(input.outputDir, 'recreation-plan.md');
    try {
      fs.writeFileSync(breakdownJsonPath, JSON.stringify(breakdown, null, 2));
      fs.writeFileSync(breakdownMdPath, renderBreakdownMarkdown(breakdown));
      fs.writeFileSync(recreationPlanPath, renderRecreationPlan(breakdown));
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    console.log(`[Workflow] Reference video analyzed: ${breakdown.scenes.length} scenes → ${breakdownMdPath}`);

    // 6. RETURN with cost
    return {
      success: true,
      data: {
        breakdownJsonPath,
        breakdownMdPath,
        recreationPlanPath,
        sceneCount: breakdown.scenes.length,
        duration: breakdown.duration,
        styleSummary: breakdown.styleSummary,
        breakdown,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { videoAnalysis: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    // 7. CATCH-ALL — never throw to the caller
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] analyzeReferenceVideo failed: ${message}`);
    return createErrorResult(code, message);
  }
}
