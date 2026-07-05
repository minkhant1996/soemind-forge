/**
 * Gemini Provider
 * ===============
 *
 * Unified interface for all Google Gemini AI models with automatic
 * token tracking and cost calculation.
 *
 * FEATURES:
 * - Pre-configured functions for each model (gemini25Flash, gemini35Flash, etc.)
 * - Automatic token usage tracking
 * - Cost calculation per request
 * - Support for text, image, video, audio (TTS), and music generation
 * - Type-safe TypeScript interfaces
 *
 * USAGE:
 * ```typescript
 * import { gemini25Flash, generateVideo, generateTTS } from './gemini-provider';
 *
 * // Text generation
 * const result = await gemini25Flash({
 *   systemPrompt: 'You are a helpful assistant',
 *   userPrompt: 'Hello!',
 * });
 *
 * // Video generation
 * const video = await generateVideo({
 *   model: 'veo-3.1-lite-generate-preview',
 *   prompt: 'A sunset over mountains',
 *   config: { aspectRatio: '16:9', durationSeconds: 6 }
 * });
 *
 * // TTS generation
 * const audio = await generateTTS({
 *   model: 'gemini-2.5-flash-preview-tts',
 *   text: 'Hello, world!',
 *   config: { voiceName: 'Zephyr' }
 * });
 * ```
 *
 * PACKAGE REQUIRED:
 * ```bash
 * npm install @google/genai
 * npm install -D @types/node
 * ```
 *
 * ENVIRONMENT:
 * ```env
 * GEMINI_API_KEY=your-api-key-here
 * ```
 *
 * @see https://www.npmjs.com/package/@google/genai - Official Google SDK
 * @see https://ai.google.dev/gemini-api/docs - Gemini API documentation
 * @see ./README.md - Detailed documentation for this module
 */

// =============================================================================
// IMPORTS
// =============================================================================

/**
 * GoogleGenAI - Official Google SDK for Gemini API
 *
 * This is the main class for interacting with Gemini models.
 * We use it to create a client and make API calls.
 *
 * @see https://www.npmjs.com/package/@google/genai
 * @see https://github.com/google/generative-ai-js
 */
import { GoogleGenAI } from '@google/genai';

/**
 * Import our type definitions
 * @see ./types.ts for detailed documentation of each type
 */
import {
  ThinkingLevel,
  ImageSize,
  GeminiTextInput,
  GeminiImageInput,
  GeminiTextResponse,
  GeminiImageResponse,
  GeminiResult,
  GeminiStreamChunk,
  TokenUsage,
  CostCalculation,
  GeminiBaseInput,
  GeminiTextConfig,
  GeminiImageConfig,
  VeoInput,
  VeoResponse,
  VeoConfig,
  GeneratedVideo,
  TTSInput,
  TTSResponse,
  TTSConfig,
  GeneratedAudio,
  LyriaInput,
  LyriaResponse,
  LyriaConfig,
  GeneratedMusic,
  VeoModel,
  TTSModel,
  LyriaModel,
  GeminiOmniModel,
  TTSVoiceName,
  VideoAspectRatio,
  VideoResolution,
  SpeakerVoiceConfig,
  TTSVoiceSettings,
  TTSVoiceStyle,
  TTSVoicePace,
  TTSVoiceAccent,
  TTSAudioTag,
} from './types';

/**
 * Import cost calculation functions
 * @see ./cost-calculator.ts for implementation details
 */
import {
  calculateTextCost,
  calculateImageCost,
  calculateVideoCost,
  calculateTTSCost,
  calculateMusicCost,
  calculateOmniCost,
} from './cost-calculator';

// =============================================================================
// API KEY MANAGER - Multi-key rotation with rate limit handling
// =============================================================================

/**
 * API Key Manager for handling multiple API keys with rate limit fallback
 *
 * FEATURES:
 * - Loads multiple API keys from GEMINI_API_KEYS (comma-separated)
 * - Falls back to single GEMINI_API_KEY if GEMINI_API_KEYS not set
 * - Tracks rate-limited keys with timestamps
 * - Automatically rotates to next available key on rate limit
 * - Keys become available again after cooldown period (60 seconds)
 *
 * USAGE:
 * Set environment variable with multiple keys:
 * ```env
 * GEMINI_API_KEYS=key1,key2,key3
 * ```
 * Or use single key (backwards compatible):
 * ```env
 * GEMINI_API_KEY=your-api-key
 * ```
 */
class ApiKeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private rateLimitedKeys: Map<string, number> = new Map(); // key -> timestamp when rate limited
  private cooldownMs: number = 60000; // 60 seconds cooldown for rate-limited keys

  constructor() {
    this.loadKeys();
  }

  /**
   * Load API keys from environment variables
   *
   * Priority:
   * 1. GEMINI_API_KEYS (comma-separated list)
   * 2. GEMINI_API_KEY (single key, backwards compatible)
   */
  private loadKeys(): void {
    // Try loading multiple keys first
    const multipleKeys = process.env.GEMINI_API_KEYS;
    if (multipleKeys) {
      this.keys = multipleKeys
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      if (this.keys.length > 0) {
        console.log(`[ApiKeyManager] Loaded ${this.keys.length} API keys for rotation`);
        return;
      }
    }

    // Fall back to single key
    const singleKey = process.env.GEMINI_API_KEY;
    if (singleKey) {
      this.keys = [singleKey.trim()];
      return;
    }

    // No keys found - will throw error when getKey() is called
    this.keys = [];
  }

  /**
   * Get the current API key
   *
   * @returns The current API key
   * @throws Error if no API keys are configured
   */
  getKey(): string {
    if (this.keys.length === 0) {
      throw new Error(
        'No API keys configured. ' +
          'Please add GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY to your .env file.\n' +
          'Get your API key at: https://aistudio.google.com/app/apikey'
      );
    }

    // Clean up expired rate limits
    this.cleanupExpiredRateLimits();

    // Find the next available (non-rate-limited) key
    const startIndex = this.currentIndex;
    let attempts = 0;

    while (attempts < this.keys.length) {
      const key = this.keys[this.currentIndex];

      if (!this.isKeyRateLimited(key)) {
        return key;
      }

      // Move to next key
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }

    // All keys are rate-limited - return the one with oldest rate limit
    // (it will become available soonest)
    const oldestKey = this.getOldestRateLimitedKey();
    if (oldestKey) {
      const remainingMs = this.getRemainingCooldown(oldestKey);
      console.warn(
        `[ApiKeyManager] All ${this.keys.length} API keys are rate-limited. ` +
          `Closest available in ${Math.ceil(remainingMs / 1000)}s`
      );
      return oldestKey;
    }

    // Fallback to current key
    return this.keys[this.currentIndex];
  }

  /**
   * Mark the current key as rate-limited and rotate to next
   *
   * Called when a 429 (rate limit) error is received.
   *
   * @param key - The key that was rate-limited
   * @returns true if there's another key available, false if all keys are rate-limited
   */
  markKeyRateLimited(key: string): boolean {
    const now = Date.now();
    this.rateLimitedKeys.set(key, now);

    const keyIndex = this.keys.indexOf(key);
    if (keyIndex !== -1) {
      console.warn(
        `[ApiKeyManager] Key ${keyIndex + 1}/${this.keys.length} rate-limited. ` +
          `Will retry with next key or after ${this.cooldownMs / 1000}s cooldown.`
      );
    }

    // Move to next key
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;

    // Check if we have any non-rate-limited keys
    return this.hasAvailableKey();
  }

  /**
   * Check if a key is currently rate-limited
   */
  private isKeyRateLimited(key: string): boolean {
    const rateLimitTime = this.rateLimitedKeys.get(key);
    if (!rateLimitTime) return false;

    const elapsed = Date.now() - rateLimitTime;
    return elapsed < this.cooldownMs;
  }

  /**
   * Get remaining cooldown time for a key in milliseconds
   */
  private getRemainingCooldown(key: string): number {
    const rateLimitTime = this.rateLimitedKeys.get(key);
    if (!rateLimitTime) return 0;

    const elapsed = Date.now() - rateLimitTime;
    return Math.max(0, this.cooldownMs - elapsed);
  }

  /**
   * Check if there's at least one available (non-rate-limited) key
   */
  private hasAvailableKey(): boolean {
    return this.keys.some(key => !this.isKeyRateLimited(key));
  }

  /**
   * Get the key with the oldest rate limit (will become available soonest)
   */
  private getOldestRateLimitedKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.rateLimitedKeys) {
      if (time < oldestTime && this.keys.includes(key)) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Clean up expired rate limits
   */
  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    for (const [key, time] of this.rateLimitedKeys) {
      if (now - time >= this.cooldownMs) {
        this.rateLimitedKeys.delete(key);
      }
    }
  }

  /**
   * Get statistics about key usage
   */
  getStats(): {
    totalKeys: number;
    availableKeys: number;
    rateLimitedKeys: number;
  } {
    this.cleanupExpiredRateLimits();
    const rateLimited = Array.from(this.rateLimitedKeys.keys()).filter(k =>
      this.keys.includes(k)
    ).length;

    return {
      totalKeys: this.keys.length,
      availableKeys: this.keys.length - rateLimited,
      rateLimitedKeys: rateLimited,
    };
  }

  /**
   * Reset all rate limits (useful for testing or manual recovery)
   */
  resetRateLimits(): void {
    this.rateLimitedKeys.clear();
    console.log('[ApiKeyManager] All rate limits cleared');
  }
}

// Singleton instance
const apiKeyManager = new ApiKeyManager();

// Export for external use (e.g., checking stats, manual reset)
export { apiKeyManager, ApiKeyManager };

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

/**
 * Get or create the Gemini client
 *
 * Uses lazy initialization - client is only created when first needed.
 * This allows the API key to be set after module load.
 *
 * Now uses ApiKeyManager for multi-key support with rate limit handling.
 *
 * WHY A FUNCTION?
 * - Environment variables might not be set when module loads
 * - Lazy initialization defers creation until actually needed
 * - Provides clear error message if API key is missing
 * - Returns different clients based on available keys
 *
 * @throws Error if no API keys are configured
 * @returns Initialized GoogleGenAI client
 *
 * @example
 * // Internally used by generateText, generateImage, etc.
 * const ai = getClient();
 * const response = await ai.models.generateContent({ ... });
 *
 * @see https://ai.google.dev/gemini-api/docs/quickstart
 */
const getClient = (): GoogleGenAI => {
  const apiKey = apiKeyManager.getKey();
  return new GoogleGenAI({ apiKey });
};

/**
 * Get client with a specific API key
 * Used internally for retry logic
 */
const getClientWithKey = (apiKey: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey });
};

/**
 * Check if an error is a rate limit error (429)
 */
const isRateLimitError = (error: unknown): boolean => {
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
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build content parts array from input
 *
 * Converts our input format to Gemini's expected format.
 * Gemini expects content as an array of "parts", where each part
 * can be text, image, or audio.
 *
 * GEMINI CONTENT STRUCTURE:
 * ```typescript
 * {
 *   role: 'user',
 *   parts: [
 *     { text: 'Describe this image' },
 *     { inlineData: { mimeType: 'image/jpeg', data: 'base64...' } }
 *   ]
 * }
 * ```
 *
 * @param input - Our input format with userPrompt, imageInput, etc.
 * @returns Array of parts in Gemini's expected format
 *
 * @see https://ai.google.dev/api/generate-content#Content
 * @see https://ai.google.dev/gemini-api/docs/vision
 */
function buildContentParts(
  input: GeminiBaseInput
): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> {
  // Initialize empty parts array
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  // ----- TEXT PART -----
  // Always add the user's text prompt
  parts.push({ text: input.userPrompt });

  // ----- IMAGE PART (optional) -----
  if (input.imageInput) {
    /**
     * Convert image to base64 if it's a Buffer
     *
     * Gemini requires base64-encoded data for inline content.
     * If user provides a Buffer (from fs.readFileSync), convert it.
     * If user provides a string, assume it's already base64.
     *
     * @see https://nodejs.org/api/buffer.html#buftostringencoding-start-end
     */
    const imageData = Buffer.isBuffer(input.imageInput)
      ? input.imageInput.toString('base64')
      : input.imageInput;

    parts.push({
      inlineData: {
        // MIME type tells Gemini what format the image is
        // Common types: 'image/jpeg', 'image/png', 'image/gif', 'image/webp'
        mimeType: input.imageMimeType || 'image/jpeg',
        data: imageData,
      },
    });
  }

  // ----- AUDIO PART (optional) -----
  if (input.audioInput) {
    /**
     * Same pattern as image - convert Buffer to base64 if needed
     *
     * Supported audio formats: MP3, WAV, FLAC, etc.
     * @see https://ai.google.dev/gemini-api/docs/audio
     */
    const audioData = Buffer.isBuffer(input.audioInput)
      ? input.audioInput.toString('base64')
      : input.audioInput;

    parts.push({
      inlineData: {
        // Common audio types: 'audio/mp3', 'audio/wav', 'audio/flac'
        mimeType: input.audioMimeType || 'audio/mp3',
        data: audioData,
      },
    });
  }

  return parts;
}

/**
 * Extract token usage from Gemini response
 *
 * Gemini returns token counts in the response's usageMetadata.
 * We normalize this to our TokenUsage interface.
 *
 * GEMINI'S NAMING:
 * - promptTokenCount = input tokens (what we sent)
 * - candidatesTokenCount = output tokens (what model generated)
 * - totalTokenCount = sum of both
 *
 * @param response - The Gemini API response object
 * @returns Normalized token usage statistics
 *
 * @see https://ai.google.dev/api/generate-content#UsageMetadata
 */
function extractUsage(response: {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}): TokenUsage {
  const metadata = response.usageMetadata;

  return {
    // Use nullish coalescing (||) to default to 0 if undefined
    inputTokens: metadata?.promptTokenCount || 0,
    outputTokens: metadata?.candidatesTokenCount || 0,
    totalTokens: metadata?.totalTokenCount || 0,
  };
}

/**
 * Build voice settings prompt from TTSVoiceSettings
 *
 * Converts voice settings (style, pace, accent) into a natural language
 * prompt that guides the TTS model's delivery.
 *
 * @param settings - Voice settings to convert
 * @returns Natural language prompt for voice delivery
 *
 * @example
 * buildVoiceSettingsPrompt({ style: 'excited', pace: 'fast', accent: 'british_rp' })
 * // Returns: "Speak with an excited style, at a fast pace, with a British RP accent."
 */
function buildVoiceSettingsPrompt(settings?: TTSVoiceSettings): string {
  if (!settings) return '';

  const parts: string[] = [];

  // If audioProfile is provided, use it as the primary instruction
  if (settings.audioProfile) {
    parts.push(settings.audioProfile);
  }

  // Map style presets to natural language
  if (settings.style) {
    const styleMap: Record<string, string> = {
      neutral: 'in a neutral tone',
      vocal_smile: 'with a bright, sunny, and inviting voice (vocal smile)',
      newscaster: 'like a professional news anchor',
      whisper: 'in a soft whisper',
      empathetic: 'with warmth and empathy',
      promo_hype: 'with high energy and excitement, like a promotional announcement',
      deadpan: 'in a flat, deadpan delivery',
      excited: 'with enthusiasm and excitement',
      sarcastic: 'with a sarcastic tone',
      serious: 'in a serious, grave manner',
      casual: 'in a relaxed, casual way',
    };
    const styleDesc = styleMap[settings.style] || settings.style;
    parts.push(`Speak ${styleDesc}`);
  }

  // Map pace presets to natural language
  if (settings.pace) {
    const paceMap: Record<string, string> = {
      natural: 'at a natural pace',
      rapid_fire: 'very quickly, rapid-fire delivery',
      slow: 'slowly and deliberately',
      the_drift: 'at an incredibly slow, liquid tempo',
      staccato: 'with sharp, clipped delivery',
      energetic: 'with an upbeat, energetic rhythm',
    };
    const paceDesc = paceMap[settings.pace] || settings.pace;
    parts.push(paceDesc);
  }

  // Map accent presets to natural language
  if (settings.accent && settings.accent !== 'neutral') {
    const accentMap: Record<string, string> = {
      american_general: 'with a standard American English accent',
      american_valley: 'with a Southern California valley girl accent',
      american_southern: 'with a Southern US accent',
      british_rp: 'with a British Received Pronunciation accent',
      british_brixton: 'with a London Brixton accent',
      british_scottish: 'with a Scottish accent',
      transatlantic: 'with a Mid-Atlantic accent',
      australian: 'with an Australian accent',
      indian: 'with an Indian English accent',
    };
    const accentDesc = accentMap[settings.accent] || `with a ${settings.accent} accent`;
    parts.push(accentDesc);
  }

  if (parts.length === 0) return '';

  // Join with proper punctuation
  return parts.join('. ') + '.';
}

/**
 * Build multi-speaker voice settings prompts
 *
 * Creates speaker-specific instructions for multi-speaker TTS.
 *
 * @param speakers - Array of speaker configurations
 * @returns Formatted speaker instructions
 */
function buildMultiSpeakerPrompt(speakers: SpeakerVoiceConfig[]): string {
  const instructions = speakers
    .filter(s => s.voiceSettings)
    .map(s => {
      const settings = buildVoiceSettingsPrompt(s.voiceSettings);
      return settings ? `${s.speaker}: ${settings}` : '';
    })
    .filter(Boolean);

  return instructions.length > 0 ? `Speaker instructions:\n${instructions.join('\n')}\n\n` : '';
}

/**
 * Convert raw audio data to WAV format
 *
 * TTS API returns raw PCM audio data. This function adds WAV headers
 * to make the audio playable in standard audio players.
 *
 * @param rawData - Base64 encoded raw audio data
 * @param mimeType - MIME type with format info (e.g., 'audio/L16;rate=24000')
 * @returns Buffer with WAV headers prepended
 */
function convertToWav(rawData: string, mimeType: string): Buffer {
  const options = parseMimeType(mimeType);
  const buffer = Buffer.from(rawData, 'base64');
  const wavHeader = createWavHeader(buffer.length, options);

  return Buffer.concat([wavHeader, buffer]);
}

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  // Default values if not parsed
  options.sampleRate = options.sampleRate || 24000;
  options.bitsPerSample = options.bitsPerSample || 16;

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options;

  // http://soundfile.sapp.org/doc/WaveFormat
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);                      // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
  buffer.write('WAVE', 8);                      // Format
  buffer.write('fmt ', 12);                     // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);        // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
  buffer.writeUInt32LE(byteRate, 28);           // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
  buffer.write('data', 36);                     // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

  return buffer;
}

// =============================================================================
// TEXT GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate text using any Gemini text model
 *
 * This is the core function that all text generation convenience
 * functions (gemini25Flash, gemini35Flash, etc.) use internally.
 *
 * FLOW:
 * 1. Get the Gemini client (uses API key rotation)
 * 2. Build configuration from input
 * 3. Make API call
 * 4. If rate limited, rotate to next key and retry
 * 5. Extract text, usage, and calculate cost
 * 6. Return structured result
 *
 * @param input - Text generation input including model, prompt, and config
 * @returns Result with text, usage, cost, or error
 *
 * @example
 * const result = await generateText({
 *   model: 'gemini-2.5-flash',
 *   userPrompt: 'What is 2+2?',
 *   config: { temperature: 0.5 }
 * });
 *
 * @see https://ai.google.dev/gemini-api/docs/text-generation
 */
async function generateText(
  input: GeminiTextInput
): Promise<GeminiResult<GeminiTextResponse>> {
  // Record start time for latency measurement
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys; // Try each key once

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      // ----- INITIALIZE CLIENT -----
      const ai = getClientWithKey(currentKey);
      const config = input.config || {};

      // ----- BUILD CONFIGURATION -----
      /**
       * We build the config object dynamically, only adding
       * properties that are explicitly set. This ensures we
       * don't override model defaults with undefined values.
       */
      const genConfig: Record<string, unknown> = {};

      // ===== SYSTEM INSTRUCTION =====
      /**
       * System instructions tell the model how to behave.
       * They're like a "system prompt" that sets the context.
       *
       * Gemini expects this as an array of text objects.
       * @see https://ai.google.dev/gemini-api/docs/system-instructions
       */
      if (input.systemPrompt) {
        genConfig.systemInstruction = [{ text: input.systemPrompt }];
      }

      // ===== THINKING CONFIGURATION =====
      /**
       * Gemini 3.x models use thinkingLevel (enum)
       * Gemini 2.5 models use thinkingBudget (number)
       *
       * These control how much internal reasoning the model does
       * before generating the response.
       *
       * @see https://ai.google.dev/gemini-api/docs/thinking
       */
      if (config.thinkingLevel) {
        // For Gemini 3.x models
        genConfig.thinkingConfig = {
          thinkingLevel: config.thinkingLevel,
        };
      }

      if (config.thinkingBudget !== undefined) {
        // For Gemini 2.5 models
        // -1 = unlimited, 0 = no thinking, N = N tokens for thinking
        genConfig.thinkingConfig = {
          thinkingBudget: config.thinkingBudget,
        };
      }

      // ===== URL CONTEXT / WEB GROUNDING =====
      /**
       * When enabled, the model can search the web for
       * real-time information to include in its response.
       *
       * Useful for: current events, recent data, fact-checking
       *
       * @see https://ai.google.dev/gemini-api/docs/grounding
       */
      if (config.enableUrlContext) {
        genConfig.tools = [{ urlContext: {} }];
      }

      // ===== GOOGLE SEARCH GROUNDING =====
      if (config.enableGoogleSearch) {
        genConfig.tools = [{ googleSearch: {} }];
      }

      // ===== GENERATION PARAMETERS =====
      /**
       * These control the model's output behavior.
       * Only add if explicitly set to avoid overriding defaults.
       *
       * @see https://ai.google.dev/gemini-api/docs/models/generative-models#model-parameters
       */
      if (config.temperature !== undefined) genConfig.temperature = config.temperature;
      if (config.topP !== undefined) genConfig.topP = config.topP;
      if (config.topK !== undefined) genConfig.topK = config.topK;
      if (config.maxOutputTokens !== undefined) genConfig.maxOutputTokens = config.maxOutputTokens;
      if (config.stopSequences) genConfig.stopSequences = config.stopSequences;

      // ----- BUILD CONTENTS -----
      /**
       * Gemini expects a conversation format with roles.
       * For single-turn generation, we just send one user message.
       *
       * @see https://ai.google.dev/api/generate-content#Content
       */
      const contents = [
        {
          role: 'user',
          parts: buildContentParts(input),
        },
      ];

      // ----- MAKE API CALL -----
      /**
       * This is the actual API call to Gemini.
       * It returns a response object with the generated text and metadata.
       *
       * @see https://ai.google.dev/api/generate-content
       */
      const response = await ai.models.generateContent({
        model: input.model,
        config: genConfig,
        contents,
      });

      // ----- CALCULATE METRICS -----
      const latencyMs = Date.now() - startTime;
      const usage = extractUsage(response);
      const cost = calculateTextCost(input.model, usage);

      // ----- RETURN SUCCESS RESULT -----
      return {
        success: true,
        data: {
          // Extract text from response (empty string if none)
          text: response.text || '',
          usage,
          cost,
          model: input.model,
          // Get finish reason from first candidate
          // Values: 'STOP', 'MAX_TOKENS', 'SAFETY', 'RECITATION'
          finishReason: response.candidates?.[0]?.finishReason,
          latencyMs,
        },
      };
    } catch (error) {
      // ----- HANDLE RATE LIMIT ERRORS -----
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[generateText] Rate limited on key, rotating to next key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue; // Retry with next key
        }
      }

      // ----- HANDLE OTHER ERRORS -----
      /**
       * Return structured error instead of throwing.
       * This makes error handling easier for callers.
       */
      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { model: input.model },
        },
      };
    }
  }

  // Should not reach here, but return error if we do
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'All API keys are rate limited',
      details: { model: input.model },
    },
  };
}

/**
 * Stream text generation from any Gemini text model
 *
 * Returns an async generator that yields chunks of text as they're generated.
 * Useful for real-time output display.
 *
 * Note: Streaming does not support automatic key rotation mid-stream.
 * If rate limited, it will try the next key before starting the stream.
 *
 * @param input - Text generation input
 * @yields Chunks of text as they're generated
 *
 * @example
 * for await (const chunk of generateTextStream({ ... })) {
 *   process.stdout.write(chunk.text || '');
 *   if (chunk.done) {
 *     console.log('Tokens used:', chunk.usage);
 *   }
 * }
 *
 * @see https://ai.google.dev/gemini-api/docs/text-generation#streaming
 */
async function* generateTextStream(
  input: GeminiTextInput
): AsyncGenerator<GeminiStreamChunk> {
  const maxRetries = apiKeyManager.getStats().totalKeys;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const ai = getClientWithKey(currentKey);
      const config = input.config || {};

      // Build configuration (same as generateText)
      const genConfig: Record<string, unknown> = {};

      if (input.systemPrompt) {
        genConfig.systemInstruction = [{ text: input.systemPrompt }];
      }

      if (config.thinkingLevel) {
        genConfig.thinkingConfig = { thinkingLevel: config.thinkingLevel };
      }

      if (config.thinkingBudget !== undefined) {
        genConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
      }

      if (config.enableUrlContext) {
        genConfig.tools = [{ urlContext: {} }];
      }

      if (config.enableGoogleSearch) {
        genConfig.tools = [{ googleSearch: {} }];
      }

      if (config.temperature !== undefined) genConfig.temperature = config.temperature;
      if (config.topP !== undefined) genConfig.topP = config.topP;
      if (config.topK !== undefined) genConfig.topK = config.topK;
      if (config.maxOutputTokens !== undefined) genConfig.maxOutputTokens = config.maxOutputTokens;

      const contents = [
        {
          role: 'user',
          parts: buildContentParts(input),
        },
      ];

      // Use generateContentStream for streaming response
      const response = await ai.models.generateContentStream({
        model: input.model,
        config: genConfig,
        contents,
      });

      // Track final usage (only available in last chunk)
      let finalUsage: TokenUsage | undefined;

      // Yield chunks as they arrive
      for await (const chunk of response) {
        if (chunk.text) {
          yield { text: chunk.text, done: false };
        }

        // Capture usage from final chunk
        if (chunk.usageMetadata) {
          finalUsage = extractUsage(chunk);
        }
      }

      // Final chunk signals completion and includes usage
      yield { text: '', done: true, usage: finalUsage };
      return; // Success - exit the retry loop
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[generateTextStream] Rate limited on key, rotating to next key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue; // Retry with next key
        }
      }
      // Non-rate-limit error or no more keys, throw
      throw error;
    }
  }

  // All retries exhausted
  throw lastError || new Error('All API keys are rate limited');
}

// =============================================================================
// IMAGE GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate images using Gemini image models
 *
 * @param input - Image generation input
 * @returns Result with generated images, usage, and cost
 *
 * @example
 * const result = await generateImage({
 *   model: 'gemini-3.1-flash-image-preview',
 *   userPrompt: 'A cat wearing a hat',
 *   config: { imageSize: '2K' }
 * });
 *
 * if (result.success) {
 *   fs.writeFileSync('cat.png', result.data.images[0].data);
 * }
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
async function generateImage(
  input: GeminiImageInput
): Promise<GeminiResult<GeminiImageResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const ai = getClientWithKey(currentKey);
      const config = input.config || {};

      // Build configuration for image generation
      const genConfig: Record<string, unknown> = {
        // Tell Gemini we want image output
        responseModalities: ['IMAGE', 'TEXT'],
      };

      // Add Google Search tool if enabled
      if (config.enableGoogleSearch) {
        genConfig.tools = [{ googleSearch: {} }];
      }

      if (input.systemPrompt) {
        genConfig.systemInstruction = [{ text: input.systemPrompt }];
      }

      if (config.thinkingLevel) {
        genConfig.thinkingConfig = { thinkingLevel: config.thinkingLevel };
      }

      // Image-specific configuration - only include personGeneration if explicitly set
      const imageConfig: Record<string, unknown> = {
        aspectRatio: config.aspectRatio || '',
        imageSize: config.imageSize || '1K',
      };
      if (config.personGeneration) {
        imageConfig.personGeneration = config.personGeneration;
      }
      genConfig.imageConfig = imageConfig;

      const contents = [
        {
          role: 'user',
          parts: buildContentParts(input),
        },
      ];

      // Use streaming for image generation (required by some models)
      const response = await ai.models.generateContentStream({
        model: input.model,
        config: genConfig,
        contents,
      });

      // Collect generated images
      const images: Array<{ data: Buffer; mimeType: string; fileName?: string }> = [];
      let text = '';
      let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      let fileIndex = 0;

      // Process streaming response
      for await (const chunk of response) {
        if (!chunk.candidates?.[0]?.content?.parts) {
          continue;
        }

        const part = chunk.candidates[0].content.parts[0];

        // Check if this chunk contains image data
        if (part.inlineData) {
          const inlineData = part.inlineData;
          // Get file extension from MIME type (e.g., 'image/png' → 'png')
          const fileExtension = (inlineData.mimeType || 'image/png').split('/')[1] || 'png';
          // Decode base64 to Buffer
          const buffer = Buffer.from(inlineData.data || '', 'base64');

          images.push({
            data: buffer,
            mimeType: inlineData.mimeType || 'image/png',
            fileName: `generated_image_${fileIndex++}.${fileExtension}`,
          });
        } else if (chunk.text) {
          // Some models can output text alongside images
          text += chunk.text;
        }

        // Capture usage metadata
        if (chunk.usageMetadata) {
          usage = extractUsage(chunk);
        }
      }

      const latencyMs = Date.now() - startTime;
      const cost = calculateImageCost(
        input.model,
        usage,
        images.length,
        config.imageSize || '1K'
      );

      return {
        success: true,
        data: {
          images,
          text: text || undefined,
          usage,
          cost,
          model: input.model,
          latencyMs,
        },
      };
    } catch (error) {
      // Handle rate limit errors with key rotation
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[generateImage] Rate limited on key, rotating to next key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue; // Retry with next key
        }
      }

      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'IMAGE_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { model: input.model },
        },
      };
    }
  }

  // Should not reach here
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'All API keys are rate limited',
      details: { model: input.model },
    },
  };
}

// =============================================================================
// VIDEO GENERATION FUNCTIONS (VEO)
// =============================================================================

/**
 * Generate videos using Veo models
 *
 * Video generation is asynchronous - the API returns an operation that
 * must be polled until completion.
 *
 * @param input - Video generation input
 * @returns Result with generated videos and cost
 *
 * @example
 * const result = await generateVideo({
 *   model: 'veo-3.1-lite-generate-preview',
 *   prompt: 'A sunset over mountains with birds flying',
 *   config: {
 *     aspectRatio: '16:9',
 *     resolution: '720p',
 *     durationSeconds: 6,
 *     generateAudio: false
 *   }
 * });
 *
 * if (result.success) {
 *   fs.writeFileSync('video.mp4', result.data.videos[0].data);
 * }
 *
 * @see https://ai.google.dev/gemini-api/docs/video
 */
export async function generateVideo(
  input: VeoInput
): Promise<GeminiResult<VeoResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const ai = getClientWithKey(currentKey);
      const config = input.config || {};

      // Build source object with optional first/last frame images
      const source: {
        prompt: string;
        image?: { imageBytes: string; mimeType: string };
        lastFrame?: { imageBytes: string; mimeType: string };
      } = {
        prompt: input.prompt,
      };

      // Add first frame (reference image) if provided
      if (input.referenceImage) {
        const imageData = Buffer.isBuffer(input.referenceImage)
          ? input.referenceImage.toString('base64')
          : input.referenceImage;
        source.image = {
          imageBytes: imageData,
          mimeType: input.referenceImageMimeType || 'image/jpeg',
        };
      }

      // Add last frame image if provided (Veo 3.1 interpolation mode)
      if (input.lastFrameImage) {
        const lastFrameData = Buffer.isBuffer(input.lastFrameImage)
          ? input.lastFrameImage.toString('base64')
          : input.lastFrameImage;
        source.lastFrame = {
          imageBytes: lastFrameData,
          mimeType: input.lastFrameImageMimeType || 'image/jpeg',
        };
      }

      // Start video generation operation
      // Build config - only include personGeneration if explicitly set
      const videoConfig: Record<string, unknown> = {
        numberOfVideos: config.numberOfVideos || 1,
        aspectRatio: config.aspectRatio || '9:16',
        resolution: config.resolution || '720p',
        durationSeconds: config.durationSeconds || 6,
      };

      // Only add personGeneration if explicitly provided
      if (config.personGeneration) {
        videoConfig.personGeneration = config.personGeneration;
      }

      let operation = await ai.models.generateVideos({
        model: input.model,
        source,
        config: videoConfig,
      });

      const operationName = operation.name;

      // Poll until complete (use same client for consistency)
      while (!operation.done) {
        console.log(`[Veo] Video ${operation.name} generating... checking in 10 seconds`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      // Download generated videos
      const videos: GeneratedVideo[] = [];
      const generatedVideos = operation.response?.generatedVideos || [];

      for (let i = 0; i < generatedVideos.length; i++) {
        const generatedVideo = generatedVideos[i];
        const videoUri = generatedVideo?.video?.uri;

        if (videoUri) {
          // Download video data using the same key that created the video
          const videoUrl = `${videoUri}&key=${currentKey}`;
          const response = await fetch(videoUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          videos.push({
            data: buffer,
            mimeType: 'video/mp4',
            uri: videoUri,
            durationSeconds: config.durationSeconds || 6,
            fileName: `video_${i}.mp4`,
          });
        }
      }

      const latencyMs = Date.now() - startTime;
      const includesAudio = config.generateAudio || input.model.includes('veo-3');
      const cost = calculateVideoCost(
        input.model,
        config.durationSeconds || 6,
        videos.length,
        includesAudio
      );

      return {
        success: true,
        data: {
          videos,
          cost,
          model: input.model,
          latencyMs,
          operationName,
        },
      };
    } catch (error) {
      // Handle rate limit errors with key rotation
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[generateVideo] Rate limited on key, rotating to next key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue; // Retry with next key
        }
      }

      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'VIDEO_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { model: input.model },
        },
      };
    }
  }

  // Should not reach here
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'All API keys are rate limited',
      details: { model: input.model },
    },
  };
}

// =============================================================================
// TTS (TEXT-TO-SPEECH) FUNCTIONS
// =============================================================================

/**
 * Generate speech from text using Gemini TTS models
 *
 * Supports both single-speaker and multi-speaker modes with voice settings
 * for style, pace, and accent control.
 *
 * @param input - TTS input with text and voice configuration
 * @returns Result with generated audio
 *
 * @example
 * // Single speaker with voice settings
 * const result = await generateTTS({
 *   model: 'gemini-2.5-flash-preview-tts',
 *   text: 'Hello, world! Welcome to our service.',
 *   config: {
 *     voiceName: 'Zephyr',
 *     voiceSettings: {
 *       style: 'vocal_smile',
 *       pace: 'natural',
 *       accent: 'american_general'
 *     }
 *   }
 * });
 *
 * @example
 * // Custom audio profile
 * const result = await generateTTS({
 *   model: 'gemini-2.5-flash-preview-tts',
 *   text: 'Welcome to the meditation session.',
 *   config: {
 *     voiceName: 'Aoede',
 *     voiceSettings: {
 *       audioProfile: 'A calm, soothing meditation guide who speaks slowly with gentle pauses'
 *     }
 *   }
 * });
 *
 * @example
 * // Multi-speaker with individual voice settings
 * const result = await generateTTS({
 *   model: 'gemini-2.5-flash-preview-tts',
 *   text: `
 *     Host: [excited] Welcome to the show!
 *     Guest: Thanks for having me!
 *   `,
 *   config: {
 *     speakers: [
 *       { speaker: 'Host', voiceName: 'Zephyr', voiceSettings: { style: 'excited', pace: 'energetic' } },
 *       { speaker: 'Guest', voiceName: 'Puck', voiceSettings: { style: 'casual', accent: 'british_rp' } }
 *     ]
 *   }
 * });
 *
 * @see https://ai.google.dev/gemini-api/docs/speech
 */
export async function generateTTS(
  input: TTSInput
): Promise<GeminiResult<TTSResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const ai = getClientWithKey(currentKey);
      const config = input.config || {};

      // Build speech configuration
      const genConfig: Record<string, unknown> = {
        temperature: config.temperature || 1,
        responseModalities: ['audio'],
      };

      // Build voice settings prompt prefix
      let textWithSettings = input.text;

      // Configure voice(s)
      if (config.speakers && config.speakers.length > 1) {
        // Multi-speaker mode
        genConfig.speechConfig = {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: config.speakers.map(s => ({
              speaker: s.speaker,
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: s.voiceName,
                },
              },
            })),
          },
        };

        // Add multi-speaker voice settings instructions
        const speakerInstructions = buildMultiSpeakerPrompt(config.speakers);
        if (speakerInstructions) {
          textWithSettings = speakerInstructions + textWithSettings;
        }
      } else if (config.voiceName || (config.speakers && config.speakers.length === 1)) {
        // Single speaker mode
        const voiceName = config.voiceName || config.speakers?.[0]?.voiceName || 'Zephyr';
        const voiceSettings = config.voiceSettings || config.speakers?.[0]?.voiceSettings;

        genConfig.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        };

        // Add voice settings prompt prefix
        const settingsPrompt = buildVoiceSettingsPrompt(voiceSettings);
        if (settingsPrompt) {
          textWithSettings = settingsPrompt + '\n\n' + textWithSettings;
        }
      } else {
        // No voice specified, use default with settings if provided
        genConfig.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Zephyr',
            },
          },
        };

        const settingsPrompt = buildVoiceSettingsPrompt(config.voiceSettings);
        if (settingsPrompt) {
          textWithSettings = settingsPrompt + '\n\n' + textWithSettings;
        }
      }

      const contents = [
        {
          role: 'user',
          parts: [{ text: textWithSettings }],
        },
      ];

      // Generate TTS using streaming API
      const response = await ai.models.generateContentStream({
        model: input.model,
        config: genConfig,
        contents,
      });

      // Collect audio chunks. Newer TTS models (3.1) stream MANY small
      // inlineData parts — they must be ACCUMULATED, not overwritten
      // (overwriting kept only the last ~0.04s chunk). Raw PCM is joined
      // first and converted to WAV once, so there is a single header.
      const audioParts: Buffer[] = [];
      let rawMime = '';
      let mimeType = 'audio/wav';
      let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

      for await (const chunk of response) {
        if (!chunk.candidates?.[0]?.content?.parts) {
          continue;
        }

        const part = chunk.candidates[0].content.parts[0];

        if (part.inlineData) {
          rawMime = part.inlineData.mimeType || rawMime;
          audioParts.push(Buffer.from(part.inlineData.data || '', 'base64'));
        }

        if (chunk.usageMetadata) {
          usage = extractUsage(chunk);
        }
      }

      let audioBuffer: Buffer | null = null;
      if (audioParts.length) {
        const joined = Buffer.concat(audioParts);
        if (!rawMime.includes('wav') && !rawMime.includes('mp3')) {
          audioBuffer = convertToWav(joined.toString('base64'), rawMime);
          mimeType = 'audio/wav';
        } else {
          audioBuffer = joined;
          mimeType = rawMime;
        }
      }

      if (!audioBuffer) {
        return {
          success: false,
          error: {
            code: 'TTS_NO_AUDIO',
            message: 'No audio was generated',
            details: { model: input.model },
          },
        };
      }

      const latencyMs = Date.now() - startTime;
      const cost = calculateTTSCost(input.model, usage);

      return {
        success: true,
        data: {
          audio: {
            data: audioBuffer,
            mimeType,
            fileName: 'generated_audio.wav',
          },
          cost,
          model: input.model,
          latencyMs,
        },
      };
    } catch (error) {
      // Handle rate limit errors with key rotation
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[generateTTS] Rate limited on key, rotating to next key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue; // Retry with next key
        }
      }

      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'TTS_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { model: input.model },
        },
      };
    }
  }

  // Should not reach here
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'All API keys are rate limited',
      details: { model: input.model },
    },
  };
}

/**
 * Generate TTS with single speaker (convenience function)
 *
 * @param text - Text to convert to speech (can include audio tags like [excited], [whispers])
 * @param voiceName - Voice to use (default: 'Zephyr')
 * @param voiceSettings - Optional voice settings for style, pace, accent
 * @param model - TTS model to use (default: 'gemini-2.5-flash-preview-tts')
 * @returns Result with generated audio
 *
 * @example
 * // Basic usage
 * const result = await textToSpeech('Hello, world!', 'Zephyr');
 *
 * @example
 * // With voice settings
 * const result = await textToSpeech(
 *   'Welcome to our amazing product!',
 *   'Aoede',
 *   { style: 'promo_hype', pace: 'energetic', accent: 'american_general' }
 * );
 *
 * @example
 * // With inline audio tags
 * const result = await textToSpeech(
 *   '[excited] Wow, this is incredible! [whispers] But keep it a secret.',
 *   'Puck'
 * );
 */
export async function textToSpeech(
  text: string,
  voiceName: TTSVoiceName = 'Zephyr',
  voiceSettings?: TTSVoiceSettings,
  model: TTSModel = 'gemini-2.5-flash-preview-tts'
): Promise<GeminiResult<TTSResponse>> {
  return generateTTS({
    model,
    text,
    config: { voiceName, voiceSettings },
  });
}

/**
 * Generate TTS with multiple speakers (convenience function)
 *
 * @param text - Text with speaker annotations (e.g., "Speaker 1: Hello!")
 * @param speakers - Speaker voice configurations
 * @param model - TTS model to use
 * @returns Result with generated audio
 */
export async function multiSpeakerTTS(
  text: string,
  speakers: SpeakerVoiceConfig[],
  model: TTSModel = 'gemini-2.5-flash-preview-tts'
): Promise<GeminiResult<TTSResponse>> {
  return generateTTS({
    model,
    text,
    config: { speakers },
  });
}

// =============================================================================
// MUSIC GENERATION FUNCTIONS (LYRIA)
// =============================================================================

/**
 * Generate video with Gemini Omni Flash (Interactions API — experimental).
 * Unlike Veo (dedicated video model, long-running operation), Omni is a
 * multimodal model invoked via ai.interactions.create with video response
 * modality. Contract per Google sample (2026-05): steps[] -> model_output ->
 * content parts of type 'text' | 'video' (base64 data).
 *
 * @example
 * const r = await generateOmniVideo({ prompt: 'A man writes TALK TO USERS on a whiteboard', duration: '10s' });
 */
export async function generateOmniVideo(input: {
  prompt: string;
  /** Base64 image for image_to_video / reference_to_video tasks. */
  imageBase64?: string;
  imageMimeType?: string;
  /** e.g. '8s', '10s' (Omni Flash caps ~10s per turn). Default '8s'. */
  duration?: string;
  thinkingLevel?: string;
  /** Omni task. Default 'text_to_video'. Also: image_to_video | reference_to_video | edit | extend. */
  task?: 'text_to_video' | 'image_to_video' | 'reference_to_video' | 'edit' | 'extend';
  model?: GeminiOmniModel;
}): Promise<GeminiResult<{
  video: { data: Buffer; mimeType: string };
  text?: string;
  usage: TokenUsage & { videoOutputTokens?: number };
  cost: CostCalculation;
  model: string;
  latencyMs: number;
}>> {
  const startTime = Date.now();
  const model: GeminiOmniModel = input.model || 'gemini-omni-flash-preview';
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();
    try {
      const ai = getClientWithKey(currentKey);

      const interactionInput: unknown = input.imageBase64
        ? [
            { type: 'image', data: input.imageBase64, mime_type: input.imageMimeType || 'image/png' },
            { type: 'text', text: input.prompt },
          ]
        : input.prompt;
      const task = input.task || (input.imageBase64 ? 'image_to_video' : 'text_to_video');

      const interaction: any = await (ai as any).interactions.create({
        model: `models/${model}`,
        input: interactionInput,
        generation_config: {
          max_output_tokens: 65536,
          thinking_level: input.thinkingLevel || 'high',
          video_config: { task },
        },
        response_modalities: ['video'],
        response_format: { type: 'video', duration: input.duration || '8s' },
      });

      // Collect output parts; keep the LARGEST video payload (a complete mp4 —
      // do not concat mp4 containers).
      let videoBuffer: Buffer | null = null;
      let mimeType = 'video/mp4';
      let text = '';
      if (interaction?.output_video?.data) {
        videoBuffer = Buffer.from(interaction.output_video.data, 'base64');
        mimeType = interaction.output_video.mime_type || 'video/mp4';
      }
      if (interaction?.steps) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output' && step.content) {
            for (const part of step.content) {
              if (part.type === 'text' && part.text) text += part.text;
              else if (part.type === 'video' && part.data) {
                const buf = Buffer.from(part.data, 'base64');
                if (!videoBuffer || buf.length > videoBuffer.length) {
                  videoBuffer = buf;
                  mimeType = part.mime_type || part.mimeType || 'video/mp4';
                }
              }
            }
          }
        }
      }

      if (!videoBuffer) {
        return {
          success: false,
          error: {
            code: 'OMNI_NO_VIDEO',
            message: `No video in interaction response${text ? ` (model said: ${text.slice(0, 200)})` : ''}`,
            details: { model },
          },
        };
      }

      // Usage shape is undocumented for interactions; map defensively.
      // Interactions usage shape (captured live 2026-07-05): total_input_tokens,
      // total_output_tokens, output_tokens_by_modality[{modality:'video',tokens}]
      const u: any = interaction.usage || {};
      const videoTokens = (u.output_tokens_by_modality || [])
        .filter((m: any) => m.modality === 'video')
        .reduce((a: number, m: any) => a + (m.tokens || 0), 0);
      const usage = {
        inputTokens: u.total_input_tokens ?? 0,
        outputTokens: Math.max(0, (u.total_output_tokens ?? 0) - videoTokens),
        totalTokens: u.total_tokens ?? 0,
        videoOutputTokens: videoTokens || undefined,
      };
      const cost = calculateOmniCost(model, usage);
      if (!usage.totalTokens && !usage.outputTokens) {
        console.warn('[generateOmniVideo] No usage metadata in response — reported cost may be $0/undercounted');
      }

      return {
        success: true,
        data: {
          video: { data: videoBuffer, mimeType },
          text: text || undefined,
          usage,
          cost,
          model,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[generateOmniVideo] Rate limited, rotating key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue;
        }
      }
      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'OMNI_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { model },
        },
      };
    }
  }
  return {
    success: false,
    error: { code: 'RATE_LIMIT_ERROR', message: 'All API keys are rate limited', details: { model } },
  };
}

/**
 * Generate music using Lyria models
 *
 * @param input - Music generation input
 * @returns Result with generated music
 *
 * @example
 * const result = await generateMusic({
 *   model: 'lyria-3',
 *   prompt: 'Upbeat electronic music for a tech startup video',
 * });
 *
 * if (result.success) {
 *   fs.writeFileSync('music.wav', result.data.music.data);
 * }
 *
 * @see https://ai.google.dev/gemini-api/docs/music
 */
export async function generateMusic(
  input: LyriaInput
): Promise<GeminiResult<LyriaResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const ai = getClientWithKey(currentKey);
      const config = input.config || {};

      // Build content parts
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: input.prompt },
      ];

      // Add reference image if provided
      if (input.imageInput) {
        const imageData = Buffer.isBuffer(input.imageInput)
          ? input.imageInput.toString('base64')
          : input.imageInput;
        parts.push({
          inlineData: {
            mimeType: input.imageMimeType || 'image/jpeg',
            data: imageData,
          },
        });
      }

      const contents = [
        {
          role: 'user',
          parts,
        },
      ];

      // Generate music
      const response = await ai.models.generateContentStream({
        model: input.model,
        config: {
          responseModalities: ['audio'],
        },
        contents,
      });

      // Collect music data
      let musicBuffer: Buffer | null = null;
      let mimeType = 'audio/wav';

      for await (const chunk of response) {
        if (!chunk.candidates?.[0]?.content?.parts) {
          continue;
        }

        const part = chunk.candidates[0].content.parts[0];

        if (part.inlineData) {
          const inlineData = part.inlineData;
          const rawMimeType = inlineData.mimeType || '';

          // Convert to WAV if needed
          if (!rawMimeType.includes('wav') && !rawMimeType.includes('mp3')) {
            musicBuffer = convertToWav(inlineData.data || '', rawMimeType);
            mimeType = 'audio/wav';
          } else {
            musicBuffer = Buffer.from(inlineData.data || '', 'base64');
            mimeType = rawMimeType;
          }
        }
      }

      if (!musicBuffer) {
        return {
          success: false,
          error: {
            code: 'MUSIC_NO_AUDIO',
            message: 'No music was generated',
            details: { model: input.model },
          },
        };
      }

      const latencyMs = Date.now() - startTime;
      const cost = calculateMusicCost(input.model, 1);

      // Determine duration based on model
      const maxDuration = input.model === 'lyria-3-pro' ? 180 : 30;
      const durationSeconds = config.durationSeconds || maxDuration;

      return {
        success: true,
        data: {
          music: {
            data: musicBuffer,
            mimeType,
            durationSeconds,
            fileName: 'generated_music.wav',
          },
          cost,
          model: input.model,
          latencyMs,
        },
      };
    } catch (error) {
      // Handle rate limit errors with key rotation
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[generateMusic] Rate limited on key, rotating to next key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue; // Retry with next key
        }
      }

      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'MUSIC_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { model: input.model },
        },
      };
    }
  }

  // Should not reach here
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'All API keys are rate limited',
      details: { model: input.model },
    },
  };
}

// =============================================================================
// CONVENIENCE FUNCTIONS - TEXT MODELS
// =============================================================================
// These functions provide a simpler API with sensible defaults for each model.
// Use these instead of calling generateText directly.
// =============================================================================

/**
 * Gemini 3.5 Flash - Latest fast model with thinking
 *
 * BEST FOR: General use, balanced speed and quality
 * COST: $1.50/M input, $9.00/M output
 * DEFAULT: ThinkingLevel.MEDIUM
 *
 * @param input - Text generation input (model is pre-configured)
 * @returns Result with text, usage, and cost
 *
 * @example
 * const result = await gemini35Flash({
 *   systemPrompt: 'You are a helpful assistant',
 *   userPrompt: 'Explain quantum computing',
 * });
 */
export async function gemini35Flash(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-3.5-flash',
    config: {
      thinkingLevel: ThinkingLevel.MEDIUM,
      ...input.config,
    },
  });
}

/**
 * Gemini 3.1 Flash-Lite - Budget option with thinking
 *
 * BEST FOR: Simple tasks, high volume, cost-sensitive
 * COST: $0.25/M input, $1.50/M output
 * DEFAULT: ThinkingLevel.MINIMAL
 *
 * @param input - Text generation input
 * @returns Result with text, usage, and cost
 */
export async function gemini31FlashLite(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-3.1-flash-lite',
    config: {
      thinkingLevel: ThinkingLevel.MINIMAL,
      ...input.config,
    },
  });
}

/**
 * Gemini 3 Flash Preview - Fast with high thinking
 *
 * BEST FOR: Tasks requiring reasoning but fast response
 * COST: $0.50/M input, $3.00/M output
 * DEFAULT: ThinkingLevel.HIGH
 *
 * @param input - Text generation input
 * @returns Result with text, usage, and cost
 */
export async function gemini3FlashPreview(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-3-flash-preview',
    config: {
      thinkingLevel: ThinkingLevel.HIGH,
      ...input.config,
    },
  });
}

/**
 * Gemini 3.1 Pro Preview - Highest quality
 *
 * BEST FOR: Complex tasks, detailed analysis, coding
 * COST: $2.00/M input, $12.00/M output
 * DEFAULT: ThinkingLevel.HIGH
 *
 * @param input - Text generation input
 * @returns Result with text, usage, and cost
 */
export async function gemini31ProPreview(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-3.1-pro-preview',
    config: {
      thinkingLevel: ThinkingLevel.HIGH,
      ...input.config,
    },
  });
}

/**
 * Gemini 2.5 Flash - RECOMMENDED DEFAULT
 *
 * BEST FOR: General use, cost-effective, stable
 * COST: $0.30/M input, $2.50/M output
 * DEFAULT: thinkingBudget = -1 (unlimited)
 *
 * This is the recommended model for most use cases.
 * Good balance of quality, speed, and cost.
 *
 * @param input - Text generation input
 * @returns Result with text, usage, and cost
 *
 * @example
 * // Simple usage
 * const result = await gemini25Flash({
 *   userPrompt: 'What is 2+2?',
 * });
 *
 * // With system prompt and config
 * const result = await gemini25Flash({
 *   systemPrompt: 'You are a math tutor',
 *   userPrompt: 'Explain calculus',
 *   config: {
 *     temperature: 0.7,
 *     maxOutputTokens: 2048,
 *   },
 * });
 */
export async function gemini25Flash(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-2.5-flash',
    config: {
      thinkingBudget: -1, // Unlimited thinking
      ...input.config,
    },
  });
}

/**
 * Gemini 2.5 Flash-Lite - Cheapest option
 *
 * BEST FOR: Very simple tasks, maximum cost savings
 * COST: $0.10/M input, $0.40/M output
 *
 * @param input - Text generation input
 * @returns Result with text, usage, and cost
 */
export async function gemini25FlashLite(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-2.5-flash-lite',
  });
}

/**
 * Gemini 2.5 Pro - Premium quality
 *
 * BEST FOR: Complex reasoning, high-stakes tasks
 * COST: $1.25/M input, $10.00/M output (tiered over 200K)
 * DEFAULT: thinkingBudget = -1 (unlimited)
 *
 * @param input - Text generation input
 * @returns Result with text, usage, and cost
 */
export async function gemini25Pro(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-2.5-pro',
    config: {
      thinkingBudget: -1,
      ...input.config,
    },
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - IMAGE MODELS
// =============================================================================

/**
 * Gemini 3.1 Flash Image - Fast image generation
 *
 * BEST FOR: Quick image generation, lower cost
 * COST: $0.045-0.15 per image (depending on size)
 *
 * @param input - Image generation input
 * @returns Result with images, usage, and cost
 *
 * @example
 * const result = await gemini31FlashImage({
 *   userPrompt: 'A sunset over mountains',
 *   config: { imageSize: '2K' },
 * });
 *
 * if (result.success) {
 *   fs.writeFileSync('sunset.png', result.data.images[0].data);
 * }
 */
export async function gemini31FlashImage(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiImageConfig }
): Promise<GeminiResult<GeminiImageResponse>> {
  return generateImage({
    ...input,
    model: 'gemini-3.1-flash-image-preview',
    config: {
      thinkingLevel: ThinkingLevel.MINIMAL,
      imageSize: '1K',
      ...input.config,
    },
  });
}

/**
 * Gemini 3.1 Flash Lite Image (Nano Banana 2 Lite) - Cheapest image generation
 *
 * BEST FOR: At-scale / bulk image generation where cost matters most
 * COST: $0.0336 per image (flat, any size)
 *
 * @param input - Image generation input
 * @returns Result with images, usage, and cost
 *
 * @example
 * const result = await gemini31FlashLiteImage({
 *   userPrompt: 'A sunset over mountains',
 *   config: { imageSize: '1K' },
 * });
 */
export async function gemini31FlashLiteImage(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiImageConfig }
): Promise<GeminiResult<GeminiImageResponse>> {
  return generateImage({
    ...input,
    model: 'gemini-3.1-flash-lite-image',
    config: {
      thinkingLevel: ThinkingLevel.MINIMAL,
      imageSize: '1K',
      ...input.config,
    },
  });
}

/**
 * Gemini 3 Pro Image - High quality image generation
 *
 * BEST FOR: High quality images, detailed generation
 * COST: $0.134-0.24 per image (depending on size)
 *
 * @param input - Image generation input
 * @returns Result with images, usage, and cost
 */
export async function gemini3ProImage(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiImageConfig }
): Promise<GeminiResult<GeminiImageResponse>> {
  return generateImage({
    ...input,
    model: 'gemini-3-pro-image',
    config: {
      imageSize: '1K',
      ...input.config,
    },
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - VIDEO MODELS (VEO)
// =============================================================================

/**
 * Veo 3.1 Lite - Fast, budget video generation
 *
 * BEST FOR: Quick video tests, lower cost
 * COST: $0.03/sec (video only), $0.05/sec (with audio)
 *
 * @param prompt - Text description of the video
 * @param config - Video configuration
 * @returns Result with generated video
 */
export async function veo31Lite(
  prompt: string,
  config?: VeoConfig
): Promise<GeminiResult<VeoResponse>> {
  return generateVideo({
    model: 'veo-3.1-lite-generate-preview',
    prompt,
    config: {
      aspectRatio: '9:16',
      resolution: '720p',
      durationSeconds: 6,
      ...config,
    },
  });
}

/**
 * Veo 3.1 Fast - Fast video generation with good quality
 *
 * BEST FOR: Quick quality videos, balance of speed and quality
 * COST: $0.08/sec (video only), $0.10/sec (with audio)
 *
 * @param prompt - Text description of the video
 * @param config - Video configuration
 * @returns Result with generated video
 */
export async function veo31Fast(
  prompt: string,
  config?: VeoConfig
): Promise<GeminiResult<VeoResponse>> {
  return generateVideo({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      aspectRatio: '9:16',
      resolution: '720p',
      durationSeconds: 6,
      ...config,
    },
  });
}

/**
 * Veo 3.1 - Balanced quality video generation
 *
 * BEST FOR: Good quality videos, reasonable cost
 * COST: $0.20/sec (video only), $0.40/sec (with audio)
 *
 * @param prompt - Text description of the video
 * @param config - Video configuration
 * @returns Result with generated video
 */
export async function veo31(
  prompt: string,
  config?: VeoConfig
): Promise<GeminiResult<VeoResponse>> {
  return generateVideo({
    model: 'veo-3.1-generate-preview',
    prompt,
    config: {
      aspectRatio: '9:16',
      resolution: '1080p',
      durationSeconds: 6,
      ...config,
    },
  });
}

/**
 * Veo 3 Fast - Fast high-quality video generation
 *
 * BEST FOR: Quick high-quality videos
 * COST: $0.08/sec (video only), $0.10/sec (with audio)
 *
 * @param prompt - Text description of the video
 * @param config - Video configuration
 * @returns Result with generated video
 */
export async function veo3Fast(
  prompt: string,
  config?: VeoConfig
): Promise<GeminiResult<VeoResponse>> {
  return generateVideo({
    model: 'veo-3-fast-generate-preview',
    prompt,
    config: {
      aspectRatio: '16:9',
      resolution: '720p',
      durationSeconds: 6,
      ...config,
    },
  });
}

/**
 * Veo 3 - Highest quality video generation
 *
 * BEST FOR: Best quality, audio included
 * COST: $0.20/sec (video only), $0.40/sec (with audio)
 *
 * @param prompt - Text description of the video
 * @param config - Video configuration
 * @returns Result with generated video
 */
export async function veo3(
  prompt: string,
  config?: VeoConfig
): Promise<GeminiResult<VeoResponse>> {
  return generateVideo({
    model: 'veo-3-generate-preview',
    prompt,
    config: {
      aspectRatio: '16:9',
      resolution: '1080p',
      durationSeconds: 6,
      generateAudio: true,
      ...config,
    },
  });
}

// =============================================================================
// STREAMING CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Stream from Gemini 3.5 Flash
 *
 * @param input - Text generation input
 * @yields Chunks of text as they're generated
 *
 * @example
 * for await (const chunk of gemini35FlashStream({ userPrompt: 'Tell a story' })) {
 *   process.stdout.write(chunk.text || '');
 * }
 */
export function gemini35FlashStream(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): AsyncGenerator<GeminiStreamChunk> {
  return generateTextStream({
    ...input,
    model: 'gemini-3.5-flash',
    config: {
      thinkingLevel: ThinkingLevel.MEDIUM,
      ...input.config,
    },
  });
}

/**
 * Stream from Gemini 2.5 Flash
 *
 * @param input - Text generation input
 * @yields Chunks of text as they're generated
 */
export function gemini25FlashStream(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): AsyncGenerator<GeminiStreamChunk> {
  return generateTextStream({
    ...input,
    model: 'gemini-2.5-flash',
    config: {
      thinkingBudget: -1,
      ...input.config,
    },
  });
}

// =============================================================================
// GENERIC EXPORTS
// =============================================================================

/**
 * Export core functions for advanced use cases
 *
 * Most users should use the convenience functions (gemini25Flash, etc.)
 * These are exported for cases where you need direct control.
 */
export {
  generateText,
  generateTextStream,
  generateImage,
  ThinkingLevel,
};

/**
 * Export types for consumers who need them
 */
export type {
  GeminiTextInput,
  GeminiImageInput,
  GeminiTextResponse,
  GeminiImageResponse,
  GeminiResult,
  GeminiStreamChunk,
  TokenUsage,
  CostCalculation,
  GeminiTextConfig,
  GeminiImageConfig,
  ImageSize,
  VeoInput,
  VeoResponse,
  VeoConfig,
  GeneratedVideo,
  TTSInput,
  TTSResponse,
  TTSConfig,
  GeneratedAudio,
  LyriaInput,
  LyriaResponse,
  LyriaConfig,
  GeneratedMusic,
  VeoModel,
  TTSModel,
  LyriaModel,
  TTSVoiceName,
  VideoAspectRatio,
  VideoResolution,
  SpeakerVoiceConfig,
  TTSVoiceSettings,
  TTSVoiceStyle,
  TTSVoicePace,
  TTSVoiceAccent,
  TTSAudioTag,
};
