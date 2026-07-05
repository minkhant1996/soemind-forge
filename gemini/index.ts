/**
 * Gemini Services - Main Export
 * ==============================
 *
 * This is the public API for the Gemini provider module.
 * Import from here to use Gemini AI in your application.
 *
 * QUICK START:
 * ```typescript
 * import { gemini25Flash, generateVideo, generateTTS } from '../services/gemini';
 *
 * // Text generation
 * const result = await gemini25Flash({
 *   systemPrompt: 'You are a helpful assistant',
 *   userPrompt: 'Hello!',
 * });
 *
 * // Video generation
 * const video = await veo31Lite('A sunset over mountains');
 *
 * // Text-to-Speech
 * const audio = await textToSpeech('Hello world!', 'Zephyr');
 * ```
 *
 * AVAILABLE FUNCTIONS:
 *
 * Text Generation:
 * - gemini25Flash()       - RECOMMENDED: Best balance of cost/quality
 * - gemini25FlashLite()   - Cheapest option
 * - gemini25Pro()         - Premium quality
 * - gemini35Flash()       - Latest with thinking
 * - gemini31FlashLite()   - Budget with thinking
 * - gemini3FlashPreview() - Fast with high thinking
 * - gemini31ProPreview()  - Highest quality
 *
 * Image Generation:
 * - gemini31FlashLiteImage() - Cheapest images ($0.0336/image)
 * - gemini31FlashImage()  - Fast image generation
 * - gemini3ProImage()     - High quality images
 *
 * Video Generation (Veo):
 * - veo31Lite()           - Budget video ($0.03/sec)
 * - veo31Fast()           - Fast quality ($0.08/sec)
 * - veo31()               - Balanced quality ($0.20/sec)
 * - veo3Fast()            - Fast high-quality ($0.08/sec)
 * - veo3()                - Highest quality ($0.20/sec)
 * - generateVideo()       - Generic video generation
 *
 * Text-to-Speech (TTS):
 * - textToSpeech()        - Single speaker TTS
 * - multiSpeakerTTS()     - Multi-speaker conversation
 * - generateTTS()         - Generic TTS generation
 *
 * Music Generation (Lyria):
 * - generateMusic()       - Generate music from prompt
 *
 * Streaming:
 * - gemini25FlashStream() - Stream from 2.5 Flash
 * - gemini35FlashStream() - Stream from 3.5 Flash
 *
 * DOCUMENTATION:
 * @see ./README.md - Detailed code documentation
 * @see https://ai.google.dev/gemini-api/docs - Official API docs
 *
 * ENVIRONMENT:
 * Requires GEMINI_API_KEY in .env file
 * Get your key at: https://aistudio.google.com/app/apikey
 */

// =============================================================================
// CONVENIENCE FUNCTIONS (Main API)
// =============================================================================

/**
 * API Key Manager for multi-key rotation with rate limit handling
 *
 * Use apiKeyManager to:
 * - Check key statistics: apiKeyManager.getStats()
 * - Reset rate limits: apiKeyManager.resetRateLimits()
 *
 * Environment variables:
 * - GEMINI_API_KEYS: Comma-separated list of API keys for rotation
 * - GEMINI_API_KEY: Single key (fallback if GEMINI_API_KEYS not set)
 */
export { apiKeyManager, ApiKeyManager } from './gemini-provider';

/**
 * Pre-configured functions for each model
 *
 * These are the primary functions you should use.
 * They have sensible defaults for their respective models.
 */
export {
  // ----- TEXT MODELS -----

  /**
   * Gemini 2.5 Flash - RECOMMENDED DEFAULT
   * Cost: $0.30/M input, $2.50/M output
   * Best for: General use, cost-effective
   * @see ./gemini-provider.ts for implementation
   */
  gemini25Flash,

  /**
   * Gemini 2.5 Flash-Lite - CHEAPEST
   * Cost: $0.10/M input, $0.40/M output
   * Best for: Simple tasks, high volume
   */
  gemini25FlashLite,

  /**
   * Gemini 2.5 Pro - PREMIUM
   * Cost: $1.25/M input, $10.00/M output
   * Best for: Complex reasoning
   */
  gemini25Pro,

  /**
   * Gemini 3.5 Flash - LATEST
   * Cost: $1.50/M input, $9.00/M output
   * Best for: Balanced speed/quality with thinking
   */
  gemini35Flash,

  /**
   * Gemini 3.1 Flash-Lite - BUDGET WITH THINKING
   * Cost: $0.25/M input, $1.50/M output
   * Best for: Simple tasks that benefit from reasoning
   */
  gemini31FlashLite,

  /**
   * Gemini 3 Flash Preview
   * Cost: $0.50/M input, $3.00/M output
   * Best for: Fast responses with high thinking
   */
  gemini3FlashPreview,

  /**
   * Gemini 3.1 Pro Preview - HIGHEST QUALITY
   * Cost: $2.00/M input, $12.00/M output
   * Best for: Complex analysis, coding, detailed tasks
   */
  gemini31ProPreview,

  // ----- IMAGE MODELS -----

  /**
   * Gemini 3.1 Flash Lite Image (Nano Banana 2 Lite)
   * Cost: $0.0336 per image (flat)
   * Best for: Cheapest at-scale image generation
   */
  gemini31FlashLiteImage,

  /**
   * Gemini 3.1 Flash Image
   * Cost: $0.045-0.15 per image
   * Best for: Fast image generation
   */
  gemini31FlashImage,

  /**
   * Gemini 3 Pro Image
   * Cost: $0.134-0.24 per image
   * Best for: High quality images
   */
  gemini3ProImage,

  // ----- VIDEO MODELS (VEO) -----

  /**
   * Veo 3.1 Lite - Budget video
   * Cost: $0.03/sec (video), $0.05/sec (with audio)
   * Best for: Quick tests, lowest cost
   */
  veo31Lite,

  /**
   * Veo 3.1 Fast - Fast quality video
   * Cost: $0.08/sec (video), $0.10/sec (with audio)
   * Best for: Balance of speed and quality
   */
  veo31Fast,

  /**
   * Veo 3.1 - Balanced quality
   * Cost: $0.20/sec (video), $0.40/sec (with audio)
   * Best for: Good quality at reasonable cost
   */
  veo31,

  /**
   * Veo 3 Fast - Fast high-quality video
   * Cost: $0.08/sec (video), $0.10/sec (with audio)
   * Best for: Quick high-quality videos
   */
  veo3Fast,

  /**
   * Veo 3 - Highest quality with audio
   * Cost: $0.20/sec (video), $0.40/sec (with audio)
   * Best for: Best quality, production use
   */
  veo3,

  /**
   * Generic video generation
   * Use for full control over video generation
   */
  generateVideo,

  // ----- TEXT-TO-SPEECH (TTS) -----

  /**
   * Single speaker text-to-speech
   * @example textToSpeech('Hello!', 'Zephyr')
   */
  textToSpeech,

  /**
   * Multi-speaker text-to-speech
   * @example multiSpeakerTTS(script, [{ speaker: 'Speaker 1', voiceName: 'Zephyr' }])
   */
  multiSpeakerTTS,

  /**
   * Generic TTS generation
   * Use for full control over TTS options
   */
  generateTTS,

  // ----- MUSIC GENERATION (LYRIA) -----

  /**
   * Generate music from text prompt
   * @example generateMusic({ model: 'lyria-3', prompt: 'Upbeat electronic music' })
   */
  generateMusic,
  /**
   * Gemini Omni Flash video (Interactions API, experimental)
   * @example generateOmniVideo({ prompt: '...', duration: '10s' })
   */
  generateOmniVideo,

  // ----- STREAMING -----

  /**
   * Stream from Gemini 2.5 Flash
   * Use with: for await (const chunk of ...)
   */
  gemini25FlashStream,

  /**
   * Stream from Gemini 3.5 Flash
   * Use with: for await (const chunk of ...)
   */
  gemini35FlashStream,

  // ----- GENERIC FUNCTIONS -----

  /**
   * Generic text generation (advanced use)
   * Use this when you need direct model control
   */
  generateText,

  /**
   * Generic text streaming (advanced use)
   */
  generateTextStream,

  /**
   * Generic image generation (advanced use)
   */
  generateImage,

  // ----- ENUMS -----

  /**
   * Thinking levels for Gemini 3.x models
   * Values: MINIMAL, LOW, MEDIUM, HIGH
   */
  ThinkingLevel,
} from './gemini-provider';

// =============================================================================
// TYPES
// =============================================================================

/**
 * TypeScript types for consumers
 *
 * Import these when you need to type your variables:
 * ```typescript
 * import type { GeminiTextResponse, VeoResponse, TTSResponse } from '../services/gemini';
 * ```
 */
export type {
  /** Input for text generation functions */
  GeminiTextInput,

  /** Input for image generation functions */
  GeminiImageInput,

  /** Response from text generation */
  GeminiTextResponse,

  /** Response from image generation */
  GeminiImageResponse,

  /** Wrapper type for all results (success or error) */
  GeminiResult,

  /** Chunk from streaming response */
  GeminiStreamChunk,

  /** Token usage statistics */
  TokenUsage,

  /** Cost breakdown in USD */
  CostCalculation,

  /** Configuration for text generation */
  GeminiTextConfig,

  /** Configuration for image generation */
  GeminiImageConfig,

  /** Image output sizes: '512' | '1K' | '2K' | '4K' */
  ImageSize,

  // ----- VIDEO TYPES -----

  /** Input for video generation */
  VeoInput,

  /** Response from video generation */
  VeoResponse,

  /** Configuration for video generation */
  VeoConfig,

  /** A single generated video */
  GeneratedVideo,

  /** Veo model identifiers */
  VeoModel,

  /** Video aspect ratios */
  VideoAspectRatio,

  /** Video resolutions */
  VideoResolution,

  // ----- TTS TYPES -----

  /** Input for TTS generation */
  TTSInput,

  /** Response from TTS generation */
  TTSResponse,

  /** Configuration for TTS */
  TTSConfig,

  /** Generated audio data */
  GeneratedAudio,

  /** TTS model identifiers */
  TTSModel,

  /** Available voice names (30 total) */
  TTSVoiceName,

  /** Speaker configuration for multi-speaker TTS */
  SpeakerVoiceConfig,

  /** Voice settings for style, pace, accent control */
  TTSVoiceSettings,

  /** Voice style presets (or custom string) */
  TTSVoiceStyle,

  /** Voice pace presets (or custom string) */
  TTSVoicePace,

  /** Voice accent presets (or custom string) */
  TTSVoiceAccent,

  /** Common audio tags for inline control */
  TTSAudioTag,

  // ----- MUSIC TYPES -----

  /** Input for music generation */
  LyriaInput,

  /** Response from music generation */
  LyriaResponse,

  /** Configuration for music generation */
  LyriaConfig,

  /** Generated music data */
  GeneratedMusic,

  /** Lyria model identifiers */
  LyriaModel,
} from './gemini-provider';

// =============================================================================
// COST CALCULATOR
// =============================================================================

/**
 * Cost calculation utilities
 *
 * Use these to estimate costs or analyze usage.
 */
export {
  /**
   * Calculate cost from token usage
   * @example
   * const cost = calculateTextCost('gemini-2.5-flash', { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 });
   */
  calculateTextCost,

  /**
   * Calculate cost for image generation
   * @example
   * const cost = calculateImageCost('gemini-3.1-flash-image-preview', usage, 2, '2K');
   */
  calculateImageCost,

  /**
   * Calculate cost for video generation
   * @example
   * const cost = calculateVideoCost('veo-3.1-lite-generate-preview', 6, 1, false);
   */
  calculateVideoCost,

  /**
   * Calculate cost for Omni video generation (token-priced)
   * @example
   * const cost = calculateOmniCost('gemini-omni-flash-preview', {
   *   inputTokens: 1200, outputTokens: 500, videoOutputTokens: 40000,
   * });
   */
  calculateOmniCost,

  /**
   * Calculate cost for TTS generation
   * @example
   * const cost = calculateTTSCost('gemini-2.5-flash-preview-tts', usage);
   */
  calculateTTSCost,

  /**
   * Calculate cost for music generation
   * @example
   * const cost = calculateMusicCost('lyria-3', 1);
   */
  calculateMusicCost,

  /**
   * Get pricing info for a model
   * @example
   * const info = getModelPricing('gemini-2.5-flash');
   * console.log(info.pricing.input); // 0.30
   */
  getModelPricing,

  /**
   * List all available models
   * @example
   * const models = getAvailableModels(); // ['gemini-2.5-flash', ...]
   */
  getAvailableModels,

  /**
   * List text-only models
   */
  getTextModels,

  /**
   * List image-only models
   */
  getImageModels,

  /**
   * List video models (Veo)
   */
  getVideoModels,

  /**
   * List TTS models
   */
  getTTSModels,

  /**
   * List music models (Lyria)
   */
  getMusicModels,

  /**
   * Estimate cost before API call
   * @example
   * const estimate = estimateCost('gemini-2.5-flash', 2000, 1000);
   */
  estimateCost,

  /**
   * Estimate video generation cost
   * @example
   * const estimate = estimateVideoCost('veo-3.1-lite-generate-preview', 6, 2, true);
   */
  estimateVideoCost,

  /**
   * Format cost for display
   * @example
   * formatCost({ totalCost: 0.003 }) // "$0.3000 cents"
   */
  formatCost,
} from './cost-calculator';

// =============================================================================
// ALL TYPES (for advanced consumers)
// =============================================================================

/**
 * Re-export all types from types.ts
 *
 * This provides access to all internal types for advanced use cases.
 */
export * from './types';
