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
  CostCalculation,
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
  VideoResolution,
  VideoAspectRatio,
  VideoFrameImage,
  ModelInfo,
  ModelPricing,
  PricingData,
  VideoPricingFamily,
} from './types.js';

import {
  calculateTextCost,
  calculateVideoCost,
  calculateAudioCost,
  calculateSTTCost,
  calculateImageCost,
  costFromApi,
  validateVideoRequest,
  validateImageRequest,
} from './cost-calculator.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_CHAT_ENDPOINT = `${OPENROUTER_API_BASE}/chat/completions`;
const OPENROUTER_VIDEO_ENDPOINT = `${OPENROUTER_API_BASE}/videos`;
const OPENROUTER_IMAGE_ENDPOINT = `${OPENROUTER_API_BASE}/images`;

// NOTE: OpenRouter has no /audio/speech or /audio/transcriptions endpoint.
// Speech generation and transcription both run through /chat/completions —
// speech with `modalities: ['text','audio']`, transcription with an
// `input_audio` content part. Earlier revisions of this file posted to
// /audio/* and always 404'd.

/** Default ceiling on how long to poll a video job before giving up. */
const DEFAULT_VIDEO_POLL_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_VIDEO_POLL_INTERVAL_MS = 5000;

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Pull the amount OpenRouter actually billed out of a response.
 *
 * Requests set `usage: { include: true }` so this is present; when it is, it
 * beats anything computed from the pricing table.
 */
function apiCost(payload: { usage?: { cost?: number } } | undefined): number | undefined {
  const c = payload?.usage?.cost;
  return typeof c === 'number' ? c : undefined;
}

/**
 * Prefer the billed cost, fall back to the locally computed one.
 */
function resolveCost(payload: unknown, computed: CostCalculation): CostCalculation {
  return costFromApi(apiCost(payload as { usage?: { cost?: number } })) ?? computed;
}

/**
 * Turn a `data:<mime>;base64,<payload>` URL — or a bare base64 string — into
 * bytes plus its MIME type.
 */
function decodeDataUrl(value: string, fallbackMime: string): { buffer: Buffer; mimeType: string } {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(value);
  if (!match) return { buffer: Buffer.from(value, 'base64'), mimeType: fallbackMime };
  const [, mimeType, isBase64, payload] = match;
  return {
    buffer: isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8'),
    mimeType: mimeType || fallbackMime,
  };
}

const extensionFor = (mimeType: string, fallback: string) =>
  ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
    'audio/wav': 'wav', 'audio/mpeg': 'mp3', 'audio/flac': 'flac',
    'audio/opus': 'opus', 'video/mp4': 'mp4' } as Record<string, string>)[mimeType] || fallback;

/**
 * Normalise the many shapes an OpenRouter error can take into one line.
 */
function describeError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body);
    const err = parsed.error || parsed;
    const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
    const meta = err.metadata?.raw ? ` — ${JSON.stringify(err.metadata.raw).slice(0, 300)}` : '';
    return `OpenRouter API error ${status}: ${msg}${meta}`;
  } catch {
    return `OpenRouter API error ${status}: ${body.slice(0, 500)}`;
  }
}

/** Sample rate of the PCM16 stream the chat audio API emits. */
const AUDIO_PCM_SAMPLE_RATE = 24000;

/**
 * Wrap raw PCM16 samples in a WAV container.
 *
 * Streamed audio comes back as headerless little-endian 16-bit mono PCM, which
 * no player will open as-is. Prepending a 44-byte RIFF header makes it a real
 * .wav without re-encoding.
 */
function wavFromPcm16(pcm: Buffer, sampleRate = AUDIO_PCM_SAMPLE_RATE, channels = 1): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * 2;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);          // PCM chunk size
  header.writeUInt16LE(1, 20);           // format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(channels * 2, 32); // block align
  header.writeUInt16LE(16, 34);          // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

interface StreamedUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
  prompt_tokens_details?: { audio_tokens?: number };
  completion_tokens_details?: { audio_tokens?: number };
}

/**
 * Consume an SSE audio response.
 *
 * Audio output is only available streamed, so the base64 payload arrives split
 * across `delta.audio.data` fragments that must be concatenated before
 * decoding. Usage (and therefore the billed cost) lands in the final chunk.
 */
async function readAudioStream(response: Response): Promise<{
  audioBase64: string;
  transcript: string;
  text: string;
  id?: string;
  usage?: StreamedUsage;
}> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body on audio stream');

  const decoder = new TextDecoder();
  const audioParts: string[] = [];
  let transcript = '';
  let text = '';
  let id: string | undefined;
  let usage: StreamedUsage | undefined;
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let parsed: {
        id?: string;
        usage?: StreamedUsage;
        error?: unknown;
        choices?: Array<{
          delta?: { audio?: { data?: string; transcript?: string }; content?: string };
          message?: { audio?: { data?: string; transcript?: string } };
        }>;
      };
      try { parsed = JSON.parse(payload); } catch { continue; }

      if (parsed.error) {
        throw new Error(`OpenRouter stream error: ${JSON.stringify(parsed.error).slice(0, 400)}`);
      }
      if (parsed.id) id = parsed.id;
      if (parsed.usage) usage = parsed.usage;

      const choice = parsed.choices?.[0];
      const audio = choice?.delta?.audio ?? choice?.message?.audio;
      if (audio?.data) audioParts.push(audio.data);
      if (audio?.transcript) transcript += audio.transcript;
      if (choice?.delta?.content) text += choice.delta.content;
    }
  }

  return { audioBase64: audioParts.join(''), transcript, text, id, usage };
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
        // Ask OpenRouter to report what it billed, so cost is measured not guessed.
        usage: { include: true },
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
      const cost = resolveCost(data, calculateTextCost(input.model, usage));

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
        usage: { include: true },
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
      const cost = resolveCost(data, calculateTextCost(input.model, usage));

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

      // Fail locally on an unsupported duration/resolution rather than paying
      // for a round trip that the provider will reject.
      const issues = validateVideoRequest(input.model, {
        durationSeconds: config.durationSeconds,
        resolution: config.resolution,
        aspectRatio: config.aspectRatio,
        size: config.size,
        frameTypes: config.frameImages?.map(f => f.frameType),
        seed: config.seed,
      });
      if (issues.length) {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: issues.map(i => `${i.field}: ${i.message}`).join('; '),
            details: { model: input.model, issues },
          },
        };
      }

      const body: Record<string, unknown> = {
        model: input.model,
        prompt: input.prompt,
      };

      if (config.durationSeconds !== undefined) body.duration = config.durationSeconds;
      if (config.resolution !== undefined) body.resolution = config.resolution;
      if (config.aspectRatio !== undefined) body.aspect_ratio = config.aspectRatio;
      if (config.size !== undefined) body.size = config.size;
      if (config.generateAudio !== undefined) body.generate_audio = config.generateAudio;
      if (config.seed !== undefined) body.seed = config.seed;
      if (config.callbackUrl !== undefined) body.callback_url = config.callbackUrl;
      if (config.provider !== undefined) body.provider = config.provider;
      // Keyframes go as objects tagged with the slot they fill, not as two
      // separate first_frame_image / last_frame_image fields.
      if (config.frameImages?.length) {
        body.frame_images = config.frameImages.map(f => ({
          image: f.image,
          frame_type: f.frameType,
        }));
      }
      if (config.inputReferences?.length) {
        body.input_references = config.inputReferences.map(image => ({ image }));
      }

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
        throw new Error(describeError(submitResponse.status, errorText));
      }

      const submitData = await submitResponse.json();
      const jobId = submitData.id;
      const pollingUrl = submitData.polling_url || `${OPENROUTER_VIDEO_ENDPOINT}/${jobId}`;

      console.log(`[OpenRouter] Video job submitted: ${jobId}`);

      // Step 2: Poll until terminal, bounded so a stuck job cannot hang forever
      const timeoutMs = config.pollTimeoutMs ?? DEFAULT_VIDEO_POLL_TIMEOUT_MS;
      const intervalMs = config.pollIntervalMs ?? DEFAULT_VIDEO_POLL_INTERVAL_MS;
      let status: VideoJobStatus | undefined;

      for (;;) {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeoutMs) {
          throw new Error(
            `Video job ${jobId} still '${status?.status ?? 'pending'}' after ${Math.round(elapsed / 1000)}s ` +
            `(timeout ${Math.round(timeoutMs / 1000)}s). The job may still finish — poll ${pollingUrl}`
          );
        }

        const pollResponse = await fetch(pollingUrl, {
          headers: { 'Authorization': `Bearer ${currentKey}` },
        });
        if (!pollResponse.ok) {
          throw new Error(describeError(pollResponse.status, await pollResponse.text()));
        }

        status = await pollResponse.json() as VideoJobStatus;
        config.onPoll?.(status.status, elapsed);
        console.log(`[OpenRouter] Video status: ${status.status} (${Math.round(elapsed / 1000)}s)`);

        if (status.status === 'completed') break;
        if (status.status === 'failed') {
          const err = status.error;
          throw new Error(
            typeof err === 'string' ? err : err?.message || 'Video generation failed with no message'
          );
        }
        await sleep(intervalMs);
      }

      // Step 3: Collect video URLs
      const urls = status.unsigned_urls || [];
      if (!urls.length) {
        throw new Error(`Video job ${jobId} completed but returned no URLs`);
      }
      const videos: GeneratedVideo[] = urls.map((url, i) => ({
        url,
        mimeType: 'video/mp4',
        fileName: `video_${i}.mp4`,
      }));

      const latencyMs = Date.now() - startTime;
      // Prefer what OpenRouter actually billed; the estimate is a fallback for
      // token-billed models that report no cost.
      const cost = resolveCost(status, calculateVideoCost(input.model, {
        durationSeconds: config.durationSeconds ?? 5,
        resolution: config.resolution,
        withAudio: config.generateAudio,
        imageToVideo: Boolean(config.frameImages?.length || config.inputReferences?.length),
        referenceImages: config.inputReferences?.length,
        videoCount: videos.length,
      }));

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
 *   model: 'openai/gpt-audio-mini',
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
      const format = config.responseFormat || 'wav';
      if (format !== 'wav' && format !== 'pcm16') {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: `Audio output is streamed, and the API only emits 'pcm16' on a stream — `
              + `so this client supports 'wav' (pcm16 wrapped in a RIFF header) or raw 'pcm16'. `
              + `Requested '${format}'; transcode the .wav with ffmpeg if you need it.`,
            details: { model: input.model, requestedFormat: format },
          },
        };
      }

      const messages: ChatMessage[] = [];
      if (config.systemPrompt) messages.push({ role: 'system', content: config.systemPrompt });
      messages.push({ role: 'user', content: input.input });

      const body: Record<string, unknown> = {
        model: input.model,
        messages,
        modalities: ['text', 'audio'],
        // pcm16 is the only container the API accepts on a stream; 'wav' is
        // produced locally by wrapping those samples.
        audio: { voice: config.voice || 'alloy', format: 'pcm16' },
        // OpenRouter rejects audio output on a non-streamed request
        // ("Audio output requires stream: true"), so this is not optional.
        stream: true,
        usage: { include: true },
      };
      if (config.temperature !== undefined) body.temperature = config.temperature;
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
        throw new Error(describeError(response.status, errorText));
      }

      const stream = await readAudioStream(response);
      if (!stream.audioBase64) {
        throw new Error(
          `Model returned no audio${stream.text ? `: ${stream.text.slice(0, 300)}` : ''}. ` +
          `Confirm '${input.model}' lists audio as an output modality.`
        );
      }

      const pcm = decodeDataUrl(stream.audioBase64, 'audio/pcm').buffer;
      const buffer = format === 'wav' ? wavFromPcm16(pcm) : pcm;
      const mimeType = format === 'wav' ? 'audio/wav' : 'audio/pcm';

      const latencyMs = Date.now() - startTime;
      const data = { id: stream.id, usage: stream.usage };
      const usage = extractUsage({ usage: stream.usage });
      const cost = resolveCost(data, calculateAudioCost(input.model, {
        ...usage,
        audioInputTokens: stream.usage?.prompt_tokens_details?.audio_tokens,
        audioOutputTokens: stream.usage?.completion_tokens_details?.audio_tokens,
      }));
      const message = { audio: { transcript: stream.transcript } };

      return {
        success: true,
        data: {
          audio: {
            data: buffer,
            mimeType,
            fileName: `audio.${extensionFor(mimeType, format)}`,
          },
          cost,
          model: input.model,
          latencyMs,
          generationId: data.id,
          usage,
          transcript: message?.audio?.transcript,
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
  model: OpenRouterTTSModel = 'openai/gpt-audio-mini'
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
      const format = config.format || 'wav';

      // Convert audio to base64 if it's a Buffer
      const audioBase64 = Buffer.isBuffer(input.audio)
        ? input.audio.toString('base64')
        : input.audio;

      const instruction = config.prompt
        || 'Transcribe this audio verbatim. Output only the transcript, with no preamble or commentary.';
      const languageHint = config.language
        ? ` The audio is in ${config.language}; transcribe in its native script.`
        : '';

      const body: Record<string, unknown> = {
        model: input.model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: instruction + languageHint },
            { type: 'input_audio', input_audio: { data: audioBase64, format } },
          ],
        }],
        usage: { include: true },
      };
      if (config.temperature !== undefined) body.temperature = config.temperature;

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
        throw new Error(describeError(response.status, errorText));
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      const content = data.choices?.[0]?.message?.content;
      const text = typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.filter((p: { type?: string }) => p?.type === 'text')
            .map((p: { text?: string }) => p.text).join('')
          : '';

      // Prefer a caller-supplied duration; the byte-length fallback is only a
      // rough guide and is wrong for compressed formats.
      const audioSize = Buffer.isBuffer(input.audio)
        ? input.audio.length
        : Buffer.from(input.audio, 'base64').length;
      const bytesPerMinute = format === 'wav' ? 16000 * 2 * 60 : 128000 / 8 * 60;
      const durationMinutes = config.durationMinutes ?? audioSize / bytesPerMinute;

      const usage = extractUsage(data);
      const cost = resolveCost(data, calculateSTTCost(input.model, durationMinutes, usage.outputTokens));

      return {
        success: true,
        data: {
          text,
          cost,
          model: input.model,
          latencyMs,
          generationId: data.id,
          durationMinutes,
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
  model: OpenRouterSTTModel = 'openai/gpt-audio-mini',
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

      const issues = validateImageRequest(input.model, {
        resolution: config.resolution,
        aspectRatio: config.aspectRatio,
        n: config.n,
        inputReferences: config.inputReferences?.length,
        quality: config.quality,
        background: config.background,
      });
      if (issues.length) {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: issues.map(i => `${i.field}: ${i.message}`).join('; '),
            details: { model: input.model, issues },
          },
        };
      }

      const body: Record<string, unknown> = {
        model: input.model,
        prompt: input.prompt,
        usage: { include: true },
      };

      if (config.resolution) body.resolution = config.resolution;
      if (config.aspectRatio) body.aspect_ratio = config.aspectRatio;
      if (config.size) body.size = config.size;
      if (config.n) body.n = config.n;
      if (config.seed !== undefined) body.seed = config.seed;
      if (config.quality) body.quality = config.quality;
      if (config.background) body.background = config.background;
      if (config.outputFormat) body.output_format = config.outputFormat;
      if (config.outputCompression !== undefined) body.output_compression = config.outputCompression;
      if (config.provider) body.provider = config.provider;
      if (config.inputReferences?.length) {
        body.input_references = config.inputReferences.map(image => ({ image }));
      }

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
        throw new Error(describeError(response.status, errorText));
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      // Images come back as `data[].b64_json` with `media_type`. Some models
      // return a `url` or a data: URL instead, so handle all three.
      const images: GeneratedImage[] = [];
      for (const [i, entry] of (data.data || []).entries()) {
        const raw: string | undefined = entry.b64_json || entry.image_url?.url || entry.url;
        if (!raw) continue;
        if (/^https?:\/\//.test(raw)) {
          const fetched = await fetch(raw);
          const buffer = Buffer.from(await fetched.arrayBuffer());
          const mimeType = entry.media_type || fetched.headers.get('content-type') || 'image/png';
          images.push({ data: buffer, mimeType, fileName: `image_${i}.${extensionFor(mimeType, 'png')}` });
          continue;
        }
        const { buffer, mimeType } = decodeDataUrl(raw, entry.media_type || 'image/png');
        images.push({
          data: buffer,
          b64_json: entry.b64_json,
          mimeType,
          fileName: `image_${i}.${extensionFor(mimeType, 'png')}`,
        });
      }

      if (!images.length) {
        throw new Error(
          `No image returned by '${input.model}'${data.error ? `: ${JSON.stringify(data.error).slice(0, 300)}` : ''}`
        );
      }

      const usage = extractUsage(data);
      const cost = resolveCost(data, calculateImageCost(input.model, {
        imageCount: images.length,
        resolution: config.resolution,
        referenceCount: config.inputReferences?.length,
        usage: usage.totalTokens ? usage : undefined,
      }));

      return {
        success: true,
        data: {
          images,
          cost,
          model: input.model,
          latencyMs,
          usage: usage.totalTokens ? usage : undefined,
          text: typeof data.text === 'string' ? data.text : undefined,
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
export async function gpt56Luna(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'openai/gpt-5.6-luna' });
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
export async function deepseekV4Flash(
  input: Omit<OpenRouterTextInput, 'model'> & { config?: OpenRouterTextConfig }
): Promise<OpenRouterResult<OpenRouterTextResponse>> {
  return generateText({ ...input, model: 'deepseek/deepseek-v4-flash' });
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
//
// Rates below are the published per-second SKUs; the figure actually charged
// comes back as usage.cost. Seedance bills per video token and cannot be
// priced ahead of the render. Durations/resolutions each model accepts are in
// pricing.json — validateVideoRequest() checks a request against them.

/**
 * Veo 3.1 — Google's flagship video model, native audio
 *
 * COST: $0.20/s silent, $0.40/s with audio (1080p); 4K $0.40/$0.60
 */
export async function veo31(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'google/veo-3.1', prompt, config });
}

/**
 * Veo 3.1 Fast — cheaper Veo tier
 *
 * COST: $0.10/s silent, $0.12/s with audio; 720p $0.08/$0.10
 */
export async function veo31Fast(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'google/veo-3.1-fast', prompt, config });
}

/**
 * Veo 3.1 Lite — cheapest Veo tier, best for drafts
 *
 * COST: $0.05/s silent, $0.08/s with audio; 720p $0.03/$0.05
 */
export async function veo31Lite(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'google/veo-3.1-lite', prompt, config });
}

/**
 * Seedance 2.5 — long-form storytelling, 4-30s, video editing/extension
 *
 * COST: billed per video token — estimate unavailable, read usage.cost
 */
export async function seedance25(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'bytedance/seedance-2.5', prompt, config });
}

/**
 * Seedance 2.0 — previous Seedance generation
 *
 * COST: billed per video token — estimate unavailable, read usage.cost
 */
export async function seedance20(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'bytedance/seedance-2.0', prompt, config });
}

/**
 * Seedance 2.0 Fast — cheaper Seedance tier
 *
 * COST: billed per video token — estimate unavailable, read usage.cost
 */
export async function seedance20Fast(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'bytedance/seedance-2.0-fast', prompt, config });
}

/**
 * Kling v3.0 Pro — strong motion and character consistency
 *
 * COST: $0.112/s ($0.168/s with audio)
 */
export async function klingV3Pro(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'kwaivgi/kling-v3.0-pro', prompt, config });
}

/**
 * Kling v3.0 Standard — cheaper Kling tier
 *
 * COST: $0.084/s ($0.126/s with audio)
 */
export async function klingV3Std(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'kwaivgi/kling-v3.0-std', prompt, config });
}

/**
 * MiniMax Hailuo 3 — cinematic motion
 *
 * COST: $0.13/s, plus $0.04 per reference image
 */
export async function hailuo3(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'minimax/hailuo-3', prompt, config });
}

/**
 * MiniMax Hailuo 2.3 — previous Hailuo generation
 *
 * COST: $0.0817/s
 */
export async function hailuo(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'minimax/hailuo-2.3', prompt, config });
}

/**
 * Alibaba Wan 2.7 — text/image to video
 *
 * COST: $0.10/s
 */
export async function wan27(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'alibaba/wan-2.7', prompt, config });
}

/**
 * Alibaba Wan 2.6 — resolution-tiered pricing, cheap at 480p
 *
 * COST: t2v $0.04/s 480p · $0.08/s 720p · $0.12/s 1080p (i2v slightly higher)
 */
export async function wan26(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'alibaba/wan-2.6', prompt, config });
}

/**
 * FLUX.3 Video — keyframe control and video continuation
 *
 * COST: $0.17/s 720p · $0.29/s 1080p (continuation costs more)
 */
export async function flux3Video(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'black-forest-labs/flux-3-video', prompt, config });
}

/**
 * Runway Aleph 2 — video-to-video editing
 *
 * COST: $0.28/s with a $0.56 minimum per generation
 */
export async function aleph2(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'runway/aleph-2', prompt, config });
}

/**
 * Alibaba HappyHorse 1.1 — expressive character animation
 *
 * COST: $0.0988/s 720p · $0.1278/s 1080p
 */
export async function happyhorse11(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'alibaba/happyhorse-1.1', prompt, config });
}

/**
 * Alibaba HappyHorse 1.0
 *
 * COST: $0.0988/s 720p · $0.1694/s 1080p
 */
export async function happyhorse10(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'alibaba/happyhorse-1.0', prompt, config });
}

/**
 * Kling Video O1
 *
 * COST: $0.112/s
 */
export async function klingVideoO1(
  prompt: string,
  config?: OpenRouterVideoConfig
): Promise<OpenRouterResult<OpenRouterVideoResponse>> {
  return generateVideo({ model: 'kwaivgi/kling-video-o1', prompt, config });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - AUDIO (SPEECH) MODELS
// =============================================================================
//
// Speech runs through /chat/completions with modalities ['text','audio'], so
// these take a prompt rather than a fixed script — tell the model what to say
// and how to say it. Output is 24 kHz mono PCM16, returned wrapped as WAV.

/**
 * GPT Audio — OpenAI's speech model
 *
 * COST: $2.50/M text in, $32/M audio in, $64/M audio out
 */
export async function gptAudio(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({ model: 'openai/gpt-audio', input: text, config });
}

/**
 * GPT Audio Mini — cheapest speech option, ~27x cheaper than gpt-audio
 *
 * COST: $0.60/M text in, $0.60/M audio in, $2.40/M audio out
 */
export async function gptAudioMini(
  text: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({ model: 'openai/gpt-audio-mini', input: text, config });
}

/**
 * Lyria 3 Pro — music generation (full tracks)
 *
 * COST: OpenRouter publishes no rate — read usage.cost from the response.
 */
export async function lyria3Pro(
  prompt: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({ model: 'google/lyria-3-pro-preview', input: prompt, config });
}

/**
 * Lyria 3 Clip — music generation (short clips)
 *
 * COST: OpenRouter publishes no rate — read usage.cost from the response.
 */
export async function lyria3Clip(
  prompt: string,
  config?: OpenRouterTTSConfig
): Promise<OpenRouterResult<OpenRouterTTSResponse>> {
  return generateTTS({ model: 'google/lyria-3-clip-preview', input: prompt, config });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - TRANSCRIPTION
// =============================================================================
//
// OpenRouter has no Whisper endpoint. Transcription is done by any chat model
// that accepts audio input; getSTTModels() lists them.

/**
 * Transcribe with GPT Audio Mini — cheapest transcription path
 */
export async function gptAudioMiniSTT(
  audio: Buffer | string,
  config?: OpenRouterSTTConfig
): Promise<OpenRouterResult<OpenRouterSTTResponse>> {
  return transcribe({ model: 'openai/gpt-audio-mini', audio, config });
}

/**
 * Transcribe with Gemini 3.5 Flash — strong on non-English audio
 */
export async function geminiSTT(
  audio: Buffer | string,
  config?: OpenRouterSTTConfig
): Promise<OpenRouterResult<OpenRouterSTTResponse>> {
  return transcribe({ model: 'google/gemini-3.5-flash', audio, config });
}

// =============================================================================
// CONVENIENCE FUNCTIONS - IMAGE MODELS
// =============================================================================

/**
 * Seedream 4.5 — flat-rate images, up to 10 per call, 4K capable
 *
 * COST: $0.04/image at any resolution
 */
export async function seedream(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({ model: 'bytedance-seed/seedream-4.5', prompt, config });
}

/**
 * Nano Banana Pro (Gemini 3 Pro Image) — best text rendering, 14 refs
 *
 * COST: $120/M output tokens (~$0.15/image)
 */
export async function geminiProImage(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({ model: 'google/gemini-3-pro-image', prompt, config });
}

/**
 * Nano Banana 2 (Gemini 3.1 Flash Image) — fast, 512-4K
 *
 * COST: $60/M output tokens (~$0.07/image)
 */
export async function geminiFlashImage(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({ model: 'google/gemini-3.1-flash-image', prompt, config });
}

/**
 * Nano Banana 2 Lite — cheapest Gemini image tier
 *
 * COST: $30/M output tokens (measured ~$0.034/image at 1K)
 */
export async function geminiFlashLiteImage(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({ model: 'google/gemini-3.1-flash-lite-image', prompt, config });
}

/**
 * Qwen Image 3 Pro — precise small text, up to 6 images per call
 *
 * COST: $0.04/image 1K · $0.075/image 2K · $0.003 per reference image
 */
export async function qwenImage3Pro(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({ model: 'qwen/qwen-image-3-pro', prompt, config });
}

/**
 * GPT Image 2 — OpenAI's image model, quality tiers, up to 16 refs
 *
 * COST: $30/M output tokens
 */
export async function gptImage2(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({ model: 'openai/gpt-image-2', prompt, config });
}

/**
 * Grok Imagine (quality tier)
 *
 * COST: $0.05/image 1K · $0.07/image 2K · $0.01 per reference image
 */
export async function grokImage(
  prompt: string,
  config?: OpenRouterImageConfig
): Promise<OpenRouterResult<OpenRouterImageResponse>> {
  return generateImage({ model: 'x-ai/grok-imagine-image-quality', prompt, config });
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
  CostCalculation,
  ChatMessage,
  GeneratedVideo,
  GeneratedAudio,
  GeneratedImage,
  TTSVoice,
  AudioFormat,
  AudioInputFormat,
  VideoResolution,
  VideoAspectRatio,
  VideoFrameImage,
  ModelInfo,
  ModelPricing,
  PricingData,
  VideoPricingFamily,
  ImageResolution,
  ImageAspectRatio,
};
