/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * OpenRouter Provider
 * ===================
 *
 * Unified interface for OpenRouter API with automatic token tracking
 * and cost calculation.
 *
 * FEATURES:
 * - Access to 100+ AI models (OpenAI, Anthropic, Google, Meta, etc.)
 * - Video generation (Seedance)
 * - Automatic cost calculation
 * - API key rotation with rate limit handling
 * - OpenAI-compatible chat completions
 *
 * USAGE:
 * ```typescript
 * import { gpt4o, claudeSonnet4, generateVideo } from './openrouter-provider';
 *
 * // Text generation
 * const result = await gpt4o({
 *   systemPrompt: 'You are a helpful assistant',
 *   userPrompt: 'Hello!',
 * });
 *
 * // Video generation
 * const video = await generateVideo({
 *   model: 'bytedance/seedance-2.0',
 *   prompt: 'A sunset over mountains',
 * });
 * ```
 *
 * ENVIRONMENT:
 * ```env
 * OPENROUTER_API_KEY=sk-or-v1-...
 * # Or multiple keys:
 * OPENROUTER_API_KEYS=key1,key2,key3
 * ```
 *
 * @see https://openrouter.ai/docs
 */

// =============================================================================
// IMPORTS
// =============================================================================

import {
  OpenRouterTextModel,
  OpenRouterVideoModel,
  OpenRouterTTSModel,
  OpenRouterSTTModel,
  OpenRouterImageModel,
  OpenRouterTextInput,
  OpenRouterChatInput,
  OpenRouterVideoInput,
  OpenRouterTTSInput,
  OpenRouterSTTInput,
  OpenRouterImageInput,
  OpenRouterTextResponse,
  OpenRouterVideoResponse,
  OpenRouterTTSResponse,
  OpenRouterSTTResponse,
  OpenRouterImageResponse,
  OpenRouterResult,
  OpenRouterStreamChunk,
  OpenRouterTextConfig,
  OpenRouterVideoConfig,
  OpenRouterTTSConfig,
  OpenRouterSTTConfig,
  OpenRouterImageConfig,
  TokenUsage,
  ChatMessage,
  VideoJobStatus,
  GeneratedVideo,
  GeneratedAudio,
  GeneratedImage,
  TTSVoice,
  AudioFormat,
  AudioInputFormat,
  ImageResolution,
  ImageAspectRatio,
} from './types.js';

import {
  calculateTextCost,
  calculateVideoCost,
  calculateTTSCost,
  calculateSTTCost,
  calculateImageCost,
} from './cost-calculator.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_CHAT_ENDPOINT = `${OPENROUTER_API_BASE}/chat/completions`;
const OPENROUTER_VIDEO_ENDPOINT = `${OPENROUTER_API_BASE}/videos`;
const OPENROUTER_TTS_ENDPOINT = `${OPENROUTER_API_BASE}/audio/speech`;
const OPENROUTER_STT_ENDPOINT = `${OPENROUTER_API_BASE}/audio/transcriptions`;
const OPENROUTER_IMAGE_ENDPOINT = `${OPENROUTER_API_BASE}/images`;

// =============================================================================
// API KEY MANAGER
// =============================================================================

/**
 * API Key Manager for handling multiple API keys with rate limit fallback
 */
class ApiKeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private rateLimitedKeys: Map<string, number> = new Map();
  private cooldownMs: number = 60000;

  constructor() {
    this.loadKeys();
  }

  private loadKeys(): void {
    const multipleKeys = process.env.OPENROUTER_API_KEYS;
    if (multipleKeys) {
      this.keys = multipleKeys
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      if (this.keys.length > 0) {
        console.log(`[OpenRouter] Loaded ${this.keys.length} API keys for rotation`);
        return;
      }
    }

    const singleKey = process.env.OPENROUTER_API_KEY;
    if (singleKey) {
      this.keys = [singleKey.trim()];
      return;
    }

    this.keys = [];
  }

  getKey(): string {
    if (this.keys.length === 0) {
      throw new Error(
        'No API keys configured. ' +
          'Please add OPENROUTER_API_KEYS or OPENROUTER_API_KEY to your .env file.\n' +
          'Get your API key at: https://openrouter.ai/keys'
      );
    }

    this.cleanupExpiredRateLimits();

    const startIndex = this.currentIndex;
    let attempts = 0;

    while (attempts < this.keys.length) {
      const key = this.keys[this.currentIndex];

      if (!this.isKeyRateLimited(key)) {
        return key;
      }

      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }

    return this.keys[this.currentIndex];
  }

  markKeyRateLimited(key: string): boolean {
    this.rateLimitedKeys.set(key, Date.now());
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return this.hasAvailableKey();
  }

  private isKeyRateLimited(key: string): boolean {
    const rateLimitTime = this.rateLimitedKeys.get(key);
    if (!rateLimitTime) return false;
    return Date.now() - rateLimitTime < this.cooldownMs;
  }

  private hasAvailableKey(): boolean {
    return this.keys.some(key => !this.isKeyRateLimited(key));
  }

  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    for (const [key, time] of this.rateLimitedKeys) {
      if (now - time >= this.cooldownMs) {
        this.rateLimitedKeys.delete(key);
      }
    }
  }

  getStats() {
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
}

const apiKeyManager = new ApiKeyManager();
export { apiKeyManager, ApiKeyManager };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if error is rate limit
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('quota exceeded') ||
      message.includes('too many requests')
    );
  }
  return false;
}

/**
 * Build headers for OpenRouter API
 */
function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost',
    'X-Title': process.env.OPENROUTER_TITLE || 'AI App',
  };
}

/**
 * Extract token usage from OpenRouter response
 */
function extractUsage(response: {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}): TokenUsage {
  const usage = response.usage;
  return {
    inputTokens: usage?.prompt_tokens || 0,
    outputTokens: usage?.completion_tokens || 0,
    totalTokens: usage?.total_tokens || 0,
  };
}

/**
 * Build messages array from input
 */
function buildMessages(input: OpenRouterTextInput): ChatMessage[] {
  const messages: ChatMessage[] = [];

  if (input.systemPrompt) {
    messages.push({
      role: 'system',
      content: input.systemPrompt,
    });
  }

  if (input.imageInput) {
    // Multimodal message with image
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: input.userPrompt },
        {
          type: 'image_url',
          image_url: {
            url: input.imageInput.startsWith('data:')
              ? input.imageInput
              : `data:image/jpeg;base64,${input.imageInput}`,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: input.userPrompt,
    });
  }

  return messages;
}

// =============================================================================
// TEXT GENERATION
// =============================================================================

/**
 * Generate text using OpenRouter
 */
async function generateText(
  input: OpenRouterTextInput
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const config = input.config || {};
      const messages = buildMessages(input);

      const body: Record<string, unknown> = {
        model: input.model,
        messages,
      };

      if (config.temperature !== undefined) body.temperature = config.temperature;
      if (config.topP !== undefined) body.top_p = config.topP;
      if (config.topK !== undefined) body.top_k = config.topK;
      if (config.maxTokens !== undefined) body.max_tokens = config.maxTokens;
      if (config.frequencyPenalty !== undefined) body.frequency_penalty = config.frequencyPenalty;
      if (config.presencePenalty !== undefined) body.presence_penalty = config.presencePenalty;
      if (config.stop) body.stop = config.stop;
      if (config.provider) body.provider = config.provider;

      const response = await fetch(OPENROUTER_CHAT_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(currentKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error(`Rate limit: ${errorText}`);
        }
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      const usage = extractUsage(data);
      const cost = calculateTextCost(input.model, usage);

      return {
        success: true,
        data: {
          text: data.choices?.[0]?.message?.content || '',
          usage,
          cost,
          model: input.model,
          finishReason: data.choices?.[0]?.finish_reason,
          latencyMs,
          generationId: data.id,
        },
      };
    } catch (error) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        const hasMore = apiKeyManager.markKeyRateLimited(currentKey);
        if (hasMore) {
          console.log(`[OpenRouter] Rate limited, rotating key (attempt ${attempt + 2}/${maxRetries + 1})`);
          continue;
        }
      }

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
 * Generate text using chat messages array
 */
async function chat(
  input: OpenRouterChatInput
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const config = input.config || {};

      const body: Record<string, unknown> = {
        model: input.model,
        messages: input.messages,
      };

      if (config.temperature !== undefined) body.temperature = config.temperature;
      if (config.topP !== undefined) body.top_p = config.topP;
      if (config.maxTokens !== undefined) body.max_tokens = config.maxTokens;

      const response = await fetch(OPENROUTER_CHAT_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(currentKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error(`Rate limit: ${errorText}`);
        }
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      const usage = extractUsage(data);
      const cost = calculateTextCost(input.model, usage);

      return {
        success: true,
        data: {
          text: data.choices?.[0]?.message?.content || '',
          usage,
          cost,
          model: input.model,
          finishReason: data.choices?.[0]?.finish_reason,
          latencyMs,
          generationId: data.id,
        },
      };
    } catch (error) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        apiKeyManager.markKeyRateLimited(currentKey);
        continue;
      }

      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'All API keys are rate limited',
    },
  };
}

/**
 * Stream text generation
 */
async function* generateTextStream(
  input: OpenRouterTextInput
): AsyncGenerator<OpenRouterStreamChunk> {
  const currentKey = apiKeyManager.getKey();
  const messages = buildMessages(input);
  const config = input.config || {};

  const body: Record<string, unknown> = {
    model: input.model,
    messages,
    stream: true,
  };

  if (config.temperature !== undefined) body.temperature = config.temperature;
  if (config.maxTokens !== undefined) body.max_tokens = config.maxTokens;

  const response = await fetch(OPENROUTER_CHAT_ENDPOINT, {
    method: 'POST',
    headers: buildHeaders(currentKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          yield { text: '', done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield { text: content, done: false };
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  yield { text: '', done: true };
}

// =============================================================================
// VIDEO GENERATION
// =============================================================================

/**
 * Generate video using OpenRouter
 */
async function generateVideo(
  input: OpenRouterVideoInput
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const config = input.config || {};

      const body: Record<string, unknown> = {
        model: input.model,
        prompt: input.prompt,
      };

      if (config.durationSeconds !== undefined) body.duration = config.durationSeconds;
      if (config.aspectRatio !== undefined) body.aspect_ratio = config.aspectRatio;
      if (config.firstFrameImage !== undefined) body.first_frame_image = config.firstFrameImage;
      if (config.lastFrameImage !== undefined) body.last_frame_image = config.lastFrameImage;
      if (config.frequencyPenalty !== undefined) body.frequency_penalty = config.frequencyPenalty;

      // Step 1: Submit video generation request
      const submitResponse = await fetch(OPENROUTER_VIDEO_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(currentKey),
        body: JSON.stringify(body),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        if (submitResponse.status === 429) {
          throw new Error(`Rate limit: ${errorText}`);
        }
        throw new Error(`OpenRouter API error ${submitResponse.status}: ${errorText}`);
      }

      const submitData = await submitResponse.json();
      const jobId = submitData.id;
      const pollingUrl = submitData.polling_url;

      console.log(`[OpenRouter] Video job submitted: ${jobId}`);

      // Step 2: Poll for completion
      let status: VideoJobStatus;
      while (true) {
        const pollResponse = await fetch(pollingUrl, {
          headers: { 'Authorization': `Bearer ${currentKey}` },
        });

        status = await pollResponse.json();
        console.log(`[OpenRouter] Video status: ${status.status}`);

        if (status.status === 'completed') {
          break;
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'Video generation failed');
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Step 3: Collect video URLs
      const videos: GeneratedVideo[] = [];
      for (let i = 0; i < (status.unsigned_urls?.length || 0); i++) {
        const url = status.unsigned_urls![i];
        videos.push({
          url,
          mimeType: 'video/mp4',
          fileName: `video_${i}.mp4`,
        });
      }

      const latencyMs = Date.now() - startTime;
      const durationSeconds = config.durationSeconds || 5;
      const cost = calculateVideoCost(input.model, durationSeconds, videos.length);

      return {
        success: true,
        data: {
          videos,
          cost,
          model: input.model,
          latencyMs,
          jobId,
        },
      };
    } catch (error) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        apiKeyManager.markKeyRateLimited(currentKey);
        console.log(`[OpenRouter] Rate limited, rotating key`);
        continue;
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
 * Download video from URL
 */
async function downloadVideo(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// =============================================================================
// TTS (TEXT-TO-SPEECH) GENERATION
// =============================================================================

/**
 * Generate speech from text using OpenRouter TTS
 *
 * Returns raw audio stream in the requested format.
 *
 * @param input - TTS input with text and configuration
 * @returns Result with generated audio
 *
 * @example
 * const result = await generateTTS({
 *   model: 'hexgrad/kokoro-82m',
 *   input: 'Hello, world!',
 *   config: { voice: 'alloy', responseFormat: 'mp3' }
 * });
 *
 * if (result.success) {
 *   fs.writeFileSync('audio.mp3', result.data.audio.data);
 * }
 */
async function generateTTS(
  input: OpenRouterTTSInput
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const config = input.config || {};

      const body: Record<string, unknown> = {
        model: input.model,
        input: input.input,
        voice: config.voice || 'alloy',
      };

      if (config.responseFormat) body.response_format = config.responseFormat;
      if (config.speed !== undefined) body.speed = config.speed;
      if (config.temperature !== undefined) body.temperature = config.temperature;

      const response = await fetch(OPENROUTER_TTS_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(currentKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error(`Rate limit: ${errorText}`);
        }
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      // Response is raw audio stream
      const arrayBuffer = await response.arrayBuffer();
      const audioData = Buffer.from(arrayBuffer);

      const latencyMs = Date.now() - startTime;
      const generationId = response.headers.get('X-Generation-Id') || undefined;

      // Determine MIME type based on format
      const format = config.responseFormat || 'mp3';
      const mimeTypes: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        pcm: 'audio/pcm',
        opus: 'audio/opus',
        flac: 'audio/flac',
      };

      const cost = calculateTTSCost(input.model, input.input.length);

      return {
        success: true,
        data: {
          audio: {
            data: audioData,
            mimeType: mimeTypes[format] || 'audio/mpeg',
            fileName: `audio.${format}`,
          },
          cost,
          model: input.model,
          latencyMs,
          generationId,
        },
      };
    } catch (error) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        apiKeyManager.markKeyRateLimited(currentKey);
        console.log(`[OpenRouter] TTS rate limited, rotating key`);
        continue;
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
 * Simple text-to-speech convenience function
 */
async function textToSpeech(
  text: string,
  voice: TTSVoice = 'alloy',
  model: OpenRouterTTSModel = 'hexgrad/kokoro-82m'
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({
    model,
    input: text,
    config: { voice },
  });
}

// =============================================================================
// STT (SPEECH-TO-TEXT) TRANSCRIPTION
// =============================================================================

/**
 * Transcribe audio to text using OpenRouter STT
 *
 * @param input - STT input with audio and configuration
 * @returns Result with transcribed text
 *
 * @example
 * const audioBuffer = fs.readFileSync('audio.wav');
 * const result = await transcribe({
 *   model: 'nvidia/parakeet-tdt-0.6b-v3',
 *   audio: audioBuffer,
 *   config: { format: 'wav' }
 * });
 *
 * if (result.success) {
 *   console.log(result.data.text);
 * }
 */
async function transcribe(
  input: OpenRouterSTTInput
): Promise<OpenRouterResult<OpenRouterSTTResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const config = input.config || {};

      // Convert audio to base64 if it's a Buffer
      const audioBase64 = Buffer.isBuffer(input.audio)
        ? input.audio.toString('base64')
        : input.audio;

      const body: Record<string, unknown> = {
        model: input.model,
        input_audio: {
          data: audioBase64,
          format: config.format || 'wav',
        },
      };

      if (config.language) body.language = config.language;
      if (config.temperature !== undefined) body.temperature = config.temperature;

      const response = await fetch(OPENROUTER_STT_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(currentKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error(`Rate limit: ${errorText}`);
        }
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      const generationId = response.headers.get('X-Generation-Id') || undefined;

      // Estimate duration from audio size (rough: 1MB ≈ 1 minute for WAV)
      const audioSize = Buffer.isBuffer(input.audio)
        ? input.audio.length
        : Buffer.from(input.audio, 'base64').length;
      const estimatedMinutes = audioSize / (1024 * 1024); // Rough estimate

      const cost = calculateSTTCost(input.model, estimatedMinutes);

      return {
        success: true,
        data: {
          text: data.text || '',
          cost,
          model: input.model,
          latencyMs,
          generationId,
          durationMinutes: estimatedMinutes,
        },
      };
    } catch (error) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        apiKeyManager.markKeyRateLimited(currentKey);
        console.log(`[OpenRouter] STT rate limited, rotating key`);
        continue;
      }

      return {
        success: false,
        error: {
          code: isRateLimitError(error) ? 'RATE_LIMIT_ERROR' : 'STT_TRANSCRIPTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { model: input.model },
        },
      };
    }
  }

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
 * Simple speech-to-text convenience function
 */
async function speechToText(
  audio: Buffer | string,
  model: OpenRouterSTTModel = 'nvidia/parakeet-tdt-0.6b-v3',
  format: AudioInputFormat = 'wav'
): Promise<OpenRouterResult<OpenRouterSTTResponse>> {
  return transcribe({
    model,
    audio,
    config: { format },
  });
}

// =============================================================================
// IMAGE GENERATION
// =============================================================================

/**
 * Generate images using OpenRouter Image API
 *
 * @param input - Image generation input with prompt and configuration
 * @returns Result with generated images
 *
 * @example
 * const result = await generateImage({
 *   model: 'bytedance-seed/seedream-4.5',
 *   prompt: 'A serene mountain landscape at sunset',
 *   config: { resolution: '2K', aspectRatio: '16:9', n: 2 }
 * });
 *
 * if (result.success) {
 *   result.data.images.forEach((img, i) => {
 *     fs.writeFileSync(`output_${i}.png`, img.data);
 *   });
 * }
 */
async function generateImage(
  input: OpenRouterImageInput
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  const startTime = Date.now();
  const maxRetries = apiKeyManager.getStats().totalKeys;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = apiKeyManager.getKey();

    try {
      const config = input.config || {};

      const body: Record<string, unknown> = {
        model: input.model,
        prompt: input.prompt,
      };

      if (config.resolution) body.resolution = config.resolution;
      if (config.aspectRatio) body.aspect_ratio = config.aspectRatio;
      if (config.n) body.n = config.n;
      if (config.seed !== undefined) body.seed = config.seed;
      if (config.inputReferences) body.input_references = config.inputReferences;

      const response = await fetch(OPENROUTER_IMAGE_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(currentKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error(`Rate limit: ${errorText}`);
        }
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      // Parse images from response
      const images: GeneratedImage[] = [];
      for (let i = 0; i < (data.data?.length || 0); i++) {
        const imgData = data.data[i];
        const b64 = imgData.b64_json;
        const buffer = Buffer.from(b64, 'base64');

        images.push({
          data: buffer,
          b64_json: b64,
          mimeType: 'image/png',
          fileName: `image_${i}.png`,
        });
      }

      const cost = calculateImageCost(input.model, images.length, config.resolution);

      return {
        success: true,
        data: {
          images,
          cost,
          model: input.model,
          latencyMs,
        },
      };
    } catch (error) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        apiKeyManager.markKeyRateLimited(currentKey);
        console.log(`[OpenRouter] Image generation rate limited, rotating key`);
        continue;
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

/**
 * GPT-4o - OpenAI's flagship model
 *
 * COST: $2.50/M input, $10.00/M output
 */
export async function gpt4o(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/gpt-4o' });
}

/**
 * GPT-4o Mini - Cheap and fast
 *
 * COST: $0.15/M input, $0.60/M output
 */
export async function gpt4oMini(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/gpt-4o-mini' });
}

/**
 * GPT-4.1 - Latest OpenAI model
 *
 * COST: $2.00/M input, $8.00/M output
 */
export async function gpt41(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/gpt-4.1' });
}

/**
 * GPT-4.1 Mini
 *
 * COST: $0.40/M input, $1.60/M output
 */
export async function gpt41Mini(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/gpt-4.1-mini' });
}

/**
 * GPT-4.1 Nano - Cheapest OpenAI
 *
 * COST: $0.10/M input, $0.40/M output
 */
export async function gpt41Nano(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/gpt-4.1-nano' });
}

/**
 * OpenAI o3 - Reasoning model
 *
 * COST: $10.00/M input, $40.00/M output
 */
export async function o3(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/o3' });
}

/**
 * OpenAI o3 Mini
 *
 * COST: $1.10/M input, $4.40/M output
 */
export async function o3Mini(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/o3-mini' });
}

/**
 * Claude Sonnet 4 - Anthropic's balanced model
 *
 * COST: $3.00/M input, $15.00/M output
 */
export async function claudeSonnet4(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'anthropic/claude-sonnet-4' });
}

/**
 * Claude Opus 4 - Anthropic's most capable model
 *
 * COST: $15.00/M input, $75.00/M output
 */
export async function claudeOpus4(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'anthropic/claude-opus-4' });
}

/**
 * Claude 3.5 Haiku - Fast and cheap
 *
 * COST: $0.80/M input, $4.00/M output
 */
export async function claudeHaiku35(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'anthropic/claude-haiku-3.5' });
}

/**
 * Gemini 2.5 Flash via OpenRouter
 *
 * COST: $0.15/M input, $0.60/M output
 */
export async function gemini25Flash(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'google/gemini-2.5-flash' });
}

/**
 * Gemini 2.5 Pro via OpenRouter
 *
 * COST: $1.25/M input, $10.00/M output
 */
export async function gemini25Pro(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'google/gemini-2.5-pro' });
}

/**
 * Llama 4 Maverick
 *
 * COST: $0.20/M input, $0.60/M output
 */
export async function llama4Maverick(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'meta-llama/llama-4-maverick' });
}

/**
 * Llama 4 Scout
 *
 * COST: $0.11/M input, $0.34/M output
 */
export async function llama4Scout(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'meta-llama/llama-4-scout' });
}

/**
 * DeepSeek R1 - Reasoning model
 *
 * COST: $0.55/M input, $2.19/M output
 */
export async function deepseekR1(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'deepseek/deepseek-r1' });
}

/**
 * DeepSeek V3 (Chat)
 *
 * COST: $0.14/M input, $0.28/M output
 */
export async function deepseekChat(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'deepseek/deepseek-chat' });
}

/**
 * Mistral Large
 *
 * COST: $2.00/M input, $6.00/M output
 */
export async function mistralLarge(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'mistralai/mistral-large' });
}

/**
 * Mistral Small
 *
 * COST: $0.10/M input, $0.30/M output
 */
export async function mistralSmall(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'mistralai/mistral-small' });
}

/**
 * Qwen 2.5 72B
 *
 * COST: $0.15/M input, $0.40/M output
 */
export async function qwen25_72b(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'qwen/qwen-2.5-72b-instruct' });
}

/**
 * MiniMax M3 - 1M context, multimodal
 *
 * COST: $0.30/M input, $1.20/M output
 * Context: 1M tokens
 * Features: Text, image, video input; agentic work, coding
 */
export async function minimaxM3(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'minimax/minimax-m3' });
}

/**
 * MiniMax M2.7 - Production-grade agent
 *
 * COST: $0.18/M input, $0.72/M output (discounted)
 * Context: 205K tokens
 * Features: Multi-agent collaboration, debugging, document generation
 */
export async function minimaxM27(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'minimax/minimax-m2.7' });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - VIDEO MODELS
// =============================================================================

/**
 * Seedance 2.0 - High quality video generation
 *
 * COST: $0.06726/second
 */
export async function seedance20(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({
    model: 'bytedance/seedance-2.0',
    prompt,
    config,
  });
}

/**
 * Seedance 2.0 Fast - Faster, cheaper video generation
 *
 * COST: $0.0538/second
 */
export async function seedance20Fast(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({
    model: 'bytedance/seedance-2.0-fast',
    prompt,
    config,
  });
}

/**
 * MiniMax Hailuo 2.3 - Cinematic video generation
 *
 * COST: $0.0817/second
 * Features: Text-to-video, image-to-video, realistic motion
 */
export async function hailuo(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({
    model: 'minimax/hailuo-2.3',
    prompt,
    config,
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - TTS MODELS
// =============================================================================

/**
 * Kokoro 82M - Cheap, multilingual TTS
 *
 * COST: $0.62/M characters
 * Languages: EN, ES, FR, HI, IT, JA, PT, ZH
 */
export async function kokoro(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({
    model: 'hexgrad/kokoro-82m',
    input: text,
    config,
  });
}

/**
 * Grok Voice TTS - xAI's TTS model
 *
 * COST: ~$1.00/M characters
 */
export async function grokTTS(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({
    model: 'x-ai/grok-voice-tts-1.0',
    input: text,
    config,
  });
}

/**
 * Gemini 3.1 Flash TTS - Google's latest TTS
 *
 * COST: $1/M input, $20/M output tokens
 * Features: 200+ audio tags, 70+ languages
 */
export async function geminiTTS(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({
    model: 'google/gemini-3.1-flash-tts-preview',
    input: text,
    config,
  });
}

/**
 * OpenAI TTS-1 - Fast, affordable TTS
 *
 * COST: $15/M characters
 */
export async function openaiTTS(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({
    model: 'openai/tts-1',
    input: text,
    config,
  });
}

/**
 * OpenAI TTS-1 HD - Higher quality TTS
 *
 * COST: $30/M characters
 */
export async function openaiTTSHD(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({
    model: 'openai/tts-1-hd',
    input: text,
    config,
  });
}

/**
 * ElevenLabs Turbo v2.5 - Cheapest high-quality TTS
 *
 * COST: $0.18/M characters
 */
export async function elevenLabsTTS(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({
    model: 'elevenlabs/eleven-turbo-v2.5',
    input: text,
    config,
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - STT MODELS
// =============================================================================

/**
 * NVIDIA Parakeet - Cheapest STT ($0.0015/min)
 *
 * COST: $0.0015/minute
 * Languages: EU languages
 */
export async function parakeetSTT(
  audio: Buffer | string,
  config?: OpenRouterSTTConfig
): Promise<OpenRouterResult<OpenRouterSTTResponse>> {
  return transcribe({
    model: 'nvidia/parakeet-tdt-0.6b-v3',
    audio,
    config,
  });
}

/**
 * Google Chirp 3 - High quality multilingual STT
 *
 * COST: $0.016/minute
 * Languages: 24 GA + 77 preview languages
 */
export async function chirpSTT(
  audio: Buffer | string,
  config?: OpenRouterSTTConfig
): Promise<OpenRouterResult<OpenRouterSTTResponse>> {
  return transcribe({
    model: 'google/chirp-3',
    audio,
    config,
  });
}

/**
 * OpenAI Whisper Large v3 - Best accuracy
 *
 * COST: $0.006/minute
 * Languages: 100+ languages
 */
export async function whisperSTT(
  audio: Buffer | string,
  config?: OpenRouterSTTConfig
): Promise<OpenRouterResult<OpenRouterSTTResponse>> {
  return transcribe({
    model: 'openai/whisper-large-v3',
    audio,
    config,
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - IMAGE MODELS
// =============================================================================

/**
 * Seedream 4.5 - ByteDance's latest image model
 *
 * COST: $0.04/image
 * Features: Best editing consistency, portraits, small text
 */
export async function seedream(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({
    model: 'bytedance-seed/seedream-4.5',
    prompt,
    config,
  });
}

/**
 * Gemini 3 Pro Image (Nano Banana Pro) - Google's best
 *
 * COST: ~$0.20/image
 * Features: 2K/4K output, text rendering, multi-image blending
 */
export async function geminiProImage(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({
    model: 'google/gemini-3-pro-image',
    prompt,
    config,
  });
}

/**
 * Gemini 3.1 Flash Image (Nano Banana 2) - Fast Google image gen
 *
 * COST: $0.50/M input, $3/M output tokens
 * Features: Pro-level quality at Flash speed
 */
export async function geminiFlashImage(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({
    model: 'google/gemini-3.1-flash-image',
    prompt,
    config,
  });
}

/**
 * FLUX 1.1 Pro - Black Forest Labs professional
 *
 * COST: $0.04/image
 */
export async function fluxPro(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({
    model: 'black-forest-labs/flux-1.1-pro',
    prompt,
    config,
  });
}

/**
 * FLUX Schnell - Fast and cheap
 *
 * COST: $0.003/image (cheapest!)
 */
export async function fluxSchnell(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({
    model: 'black-forest-labs/flux-schnell',
    prompt,
    config,
  });
}

/**
 * DALL-E 3 - OpenAI's image model
 *
 * COST: $0.04-$0.08/image (based on resolution)
 */
export async function dalle3(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({
    model: 'openai/dall-e-3',
    prompt,
    config,
  });
}

/**
 * Stable Diffusion XL - Open source classic
 *
 * COST: $0.002/image
 */
export async function sdxl(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({
    model: 'stability/sdxl',
    prompt,
    config,
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  generateText,
  generateTextStream,
  chat,
  generateVideo,
  downloadVideo,
  generateTTS,
  textToSpeech,
  transcribe,
  speechToText,
  generateImage,
};

export type {
  OpenRouterTextModel,
  OpenRouterVideoModel,
  OpenRouterTTSModel,
  OpenRouterSTTModel,
  OpenRouterImageModel,
  OpenRouterTextInput,
  OpenRouterChatInput,
  OpenRouterVideoInput,
  OpenRouterTTSInput,
  OpenRouterSTTInput,
  OpenRouterImageInput,
  OpenRouterTextResponse,
  OpenRouterVideoResponse,
  OpenRouterTTSResponse,
  OpenRouterSTTResponse,
  OpenRouterImageResponse,
  OpenRouterResult,
  OpenRouterStreamChunk,
  OpenRouterTextConfig,
  OpenRouterVideoConfig,
  OpenRouterTTSConfig,
  OpenRouterSTTConfig,
  OpenRouterImageConfig,
  TokenUsage,
  ChatMessage,
  GeneratedVideo,
  GeneratedAudio,
  GeneratedImage,
  TTSVoice,
  AudioFormat,
  AudioInputFormat,
  ImageResolution,
  ImageAspectRatio,
};
