/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * OpenRouter Provider Types
 * =========================
 *
 * Type definitions for OpenRouter API interactions.
 *
 * OpenRouter provides access to multiple AI models through a unified API:
 * - Text generation (OpenAI-compatible chat completions)
 * - Video generation (polling-based async API)
 *
 * @see https://openrouter.ai/docs
 */

// =============================================================================
// MODEL IDENTIFIERS
// =============================================================================

/**
 * Available text generation models on OpenRouter
 *
 * Format: provider/model-name
 */
export type OpenRouterTextModel =
  // OpenAI
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'openai/gpt-4.1'
  | 'openai/gpt-4.1-mini'
  | 'openai/gpt-4.1-nano'
  | 'openai/o3'
  | 'openai/o3-mini'
  | 'openai/o4-mini'
  | 'openai/gpt-5.6-luna'
  | 'openai/gpt-5.6-luna-pro'
  // Anthropic
  | 'anthropic/claude-sonnet-4'
  | 'anthropic/claude-opus-4'
  // Google
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-pro'
  // Meta
  | 'meta-llama/llama-4-maverick'
  | 'meta-llama/llama-4-scout'
  | 'meta-llama/llama-3.3-70b-instruct'
  // DeepSeek
  | 'deepseek/deepseek-r1'
  | 'deepseek/deepseek-chat'
  | 'deepseek/deepseek-v4-flash'
  | 'deepseek/deepseek-v4-pro'
  // Mistral
  | 'mistralai/mistral-large'
  // Qwen
  | 'qwen/qwen-2.5-72b-instruct'
  // MiniMax
  | 'minimax/minimax-m3'
  | 'minimax/minimax-m2.7'
  // Allow any string for models not in this list
  | (string & {});

/**
 * Video generation models on OpenRouter (POST /api/v1/videos).
 *
 * Verified against GET /api/v1/models?output_modalities=video — see
 * pricing.json for each model's durations, resolutions and billing family.
 */
export type OpenRouterVideoModel =
  | 'bytedance/seedance-2.5'
  | 'bytedance/seedance-2.0'
  | 'bytedance/seedance-2.0-fast'
  | 'bytedance/seedance-1-5-pro'
  | 'black-forest-labs/flux-3-video'
  | 'minimax/hailuo-3'
  | 'minimax/hailuo-2.3'
  | 'runway/aleph-2'
  | 'runway/gen-4.5'
  | 'alibaba/happyhorse-1.1'
  | 'alibaba/happyhorse-1.0'
  | 'alibaba/wan-2.7'
  | 'alibaba/wan-2.6'
  | 'kwaivgi/kling-v3.0-pro'
  | 'kwaivgi/kling-v3.0-std'
  | 'kwaivgi/kling-video-o1'
  | 'google/veo-3.1'
  | 'google/veo-3.1-fast'
  | 'google/veo-3.1-lite'
  | 'openai/sora-2-pro'
  | 'x-ai/grok-imagine-video'
  | 'x-ai/grok-imagine-video-1.5'
  | (string & {});

/**
 * Audio-output models on OpenRouter.
 *
 * NOTE: OpenRouter has no /audio/speech endpoint. Speech is produced by chat
 * models that list `audio` as an output modality, via POST /chat/completions
 * with `modalities: ['text','audio']`.
 */
export type OpenRouterTTSModel =
  | 'openai/gpt-audio'
  | 'openai/gpt-audio-mini'
  | 'google/lyria-3-pro-preview'
  | 'google/lyria-3-clip-preview'
  | (string & {});

/**
 * Models that accept audio input, used for transcription.
 *
 * NOTE: OpenRouter has no /audio/transcriptions endpoint. Transcription is done
 * by sending an `input_audio` content part to POST /chat/completions.
 */
export type OpenRouterSTTModel =
  | 'openai/gpt-audio'
  | 'openai/gpt-audio-mini'
  | 'google/gemini-3.5-flash'
  | 'google/gemini-3.6-flash'
  | 'google/gemini-3.1-flash-lite'
  | (string & {});

/**
 * Image generation models on OpenRouter (POST /api/v1/images).
 */
export type OpenRouterImageModel =
  | 'bytedance-seed/seedream-4.5'
  | 'google/gemini-3-pro-image'
  | 'google/gemini-3.1-flash-image'
  | 'google/gemini-3.1-flash-lite-image'
  | 'qwen/qwen-image-3'
  | 'qwen/qwen-image-3-pro'
  | 'openai/gpt-image-1'
  | 'openai/gpt-image-1-mini'
  | 'openai/gpt-image-2'
  | 'x-ai/grok-imagine-image-quality'
  | 'black-forest-labs/flux.2-pro'
  | 'black-forest-labs/flux.2-max'
  | 'microsoft/mai-image-2.5'
  | 'microsoft/mai-image-2.5-pro'
  | 'recraft/recraft-v4'
  | 'recraft/recraft-v4-pro'
  | (string & {});

/**
 * Union of all OpenRouter models
 */
export type OpenRouterModel = OpenRouterTextModel | OpenRouterVideoModel | OpenRouterTTSModel | OpenRouterSTTModel | OpenRouterImageModel;

/**
 * Model type categories
 */
export type OpenRouterModelType = 'text' | 'video' | 'audio' | 'stt' | 'image';

// =============================================================================
// INPUT INTERFACES
// =============================================================================

/**
 * Message format for chat completions
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

/**
 * Content part for multimodal messages
 */
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

/**
 * Configuration for text generation
 */
export interface OpenRouterTextConfig {
  /**
   * Controls randomness (0.0 - 2.0)
   * @default 1.0
   */
  temperature?: number;

  /**
   * Nucleus sampling threshold (0.0 - 1.0)
   */
  topP?: number;

  /**
   * Top-K sampling parameter
   */
  topK?: number;

  /**
   * Maximum tokens in response
   */
  maxTokens?: number;

  /**
   * Frequency penalty (-2.0 to 2.0)
   */
  frequencyPenalty?: number;

  /**
   * Presence penalty (-2.0 to 2.0)
   */
  presencePenalty?: number;

  /**
   * Stop sequences
   */
  stop?: string[];

  /**
   * Enable streaming
   * @default false
   */
  stream?: boolean;

  /**
   * Provider routing preferences
   */
  provider?: {
    order?: string[];
    allow_fallbacks?: boolean;
  };
}

/**
 * Input for text generation
 */
export interface OpenRouterTextInput {
  /** The model to use */
  model: OpenRouterTextModel;

  /** System prompt (optional) */
  systemPrompt?: string;

  /** User message/prompt */
  userPrompt: string;

  /** Optional image input (base64 or URL) */
  imageInput?: string;

  /** Generation configuration */
  config?: OpenRouterTextConfig;
}

/**
 * Input for chat completion with messages array
 */
export interface OpenRouterChatInput {
  /** The model to use */
  model: OpenRouterTextModel;

  /** Array of chat messages */
  messages: ChatMessage[];

  /** Generation configuration */
  config?: OpenRouterTextConfig;
}

/**
 * Video resolution tiers accepted by POST /api/v1/videos.
 * Per-model support is in pricing.json -> supportedResolutions.
 */
export type VideoResolution = '480p' | '720p' | '768p' | '1080p' | '1K' | '2K' | '4K';

/**
 * Video aspect ratios accepted by POST /api/v1/videos.
 */
export type VideoAspectRatio =
  | '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '3:2' | '2:3' | '21:9' | '9:21';

/**
 * A keyframe supplied to an image-to-video model.
 *
 * `image` is a data: URL or a public https URL. Which slots a model accepts is
 * in pricing.json -> supportedFrameImages.
 */
export interface VideoFrameImage {
  image: string;
  frameType: 'first_frame' | 'last_frame';
}

/**
 * Configuration for video generation
 *
 * Field names mirror POST /api/v1/videos; the provider converts camelCase to
 * the snake_case the API expects.
 */
export interface OpenRouterVideoConfig {
  /**
   * Video duration in seconds. Must be one of the model's supported durations
   * (pricing.json -> supportedDurations) or the API rejects the job.
   */
  durationSeconds?: number;

  /**
   * Resolution tier. Mutually exclusive with `size`.
   */
  resolution?: VideoResolution;

  /**
   * Video aspect ratio. Mutually exclusive with `size`.
   */
  aspectRatio?: VideoAspectRatio;

  /**
   * Explicit pixel dimensions as `WIDTHxHEIGHT`, e.g. '1280x720'.
   * Alternative to resolution + aspectRatio.
   */
  size?: string;

  /**
   * Keyframes for image-to-video (first and/or last frame).
   */
  frameImages?: VideoFrameImage[];

  /**
   * Reference images for style/subject guidance (reference-to-video).
   */
  inputReferences?: string[];

  /**
   * Generate an audio track. Defaults to true on models that support it —
   * set false to cut cost on models with a cheaper silent SKU (e.g. Veo).
   */
  generateAudio?: boolean;

  /**
   * Seed for deterministic generation (models with supportsSeed).
   */
  seed?: number;

  /**
   * HTTPS webhook notified on completion, instead of polling.
   */
  callbackUrl?: string;

  /**
   * Provider-specific passthrough options. Only keys listed in
   * pricing.json -> allowedPassthroughParameters are accepted.
   */
  provider?: Record<string, unknown>;

  /**
   * Stop polling after this many milliseconds.
   * @default 900000 (15 minutes)
   */
  pollTimeoutMs?: number;

  /**
   * Delay between poll requests in milliseconds.
   * @default 5000
   */
  pollIntervalMs?: number;

  /**
   * Called after each poll so callers can surface progress.
   */
  onPoll?: (status: string, elapsedMs: number) => void;
}

/**
 * Input for video generation
 */
export interface OpenRouterVideoInput {
  /** The video model to use */
  model: OpenRouterVideoModel;

  /** Text prompt describing the video */
  prompt: string;

  /** Video generation configuration */
  config?: OpenRouterVideoConfig;
}

/**
 * Available TTS voice presets
 */
export type TTSVoice =
  | 'alloy'
  | 'ash'
  | 'ballad'
  | 'cedar'
  | 'coral'
  | 'echo'
  | 'marin'
  | 'sage'
  | 'shimmer'
  | 'verse'
  | (string & {});

/**
 * Audio output container supported by the chat audio API.
 */
export type AudioFormat = 'wav' | 'mp3' | 'flac' | 'opus' | 'pcm16';

/**
 * Configuration for audio generation.
 *
 * Audio is produced through POST /chat/completions with
 * `modalities: ['text','audio']`, so chat parameters apply too.
 */
export interface OpenRouterTTSConfig {
  /**
   * Voice to use. Ignored by models that do not take a voice (Lyria).
   * @default 'alloy'
   */
  voice?: TTSVoice;

  /**
   * Output audio container.
   * @default 'wav'
   */
  responseFormat?: AudioFormat;

  /**
   * System prompt used to steer delivery (tone, pacing, accent) — the chat
   * audio API has no `speed` parameter, so direct it in words instead.
   */
  systemPrompt?: string;

  /**
   * Temperature for variation
   */
  temperature?: number;

  /**
   * Cap on generated tokens (audio tokens count toward this).
   */
  maxTokens?: number;
}

/**
 * Input for TTS generation
 */
export interface OpenRouterTTSInput {
  /** The TTS model to use */
  model: OpenRouterTTSModel;

  /** Text to convert to speech */
  input: string;

  /** TTS configuration */
  config?: OpenRouterTTSConfig;
}

/**
 * Audio input format for STT
 */
export type AudioInputFormat = 'wav' | 'mp3';

/**
 * Configuration for STT transcription
 */
export interface OpenRouterSTTConfig {
  /**
   * Audio container of the supplied bytes. Only 'wav' and 'mp3' are accepted
   * by the chat `input_audio` part; convert other formats first.
   * @default 'wav'
   */
  format?: AudioInputFormat;

  /**
   * Language hint, e.g. 'my' for Burmese. Folded into the instruction because
   * chat completions has no `language` parameter.
   */
  language?: string;

  /**
   * Instruction sent alongside the audio.
   * @default 'Transcribe this audio verbatim. Output only the transcript.'
   */
  prompt?: string;

  /**
   * Temperature for variation
   */
  temperature?: number;

  /**
   * Known audio duration in minutes. Supply it for an accurate cost figure —
   * otherwise duration is inferred from the byte length, which is only a rough
   * guess for compressed formats.
   */
  durationMinutes?: number;
}

/**
 * Input for STT transcription
 */
export interface OpenRouterSTTInput {
  /** The STT model to use */
  model: OpenRouterSTTModel;

  /** Audio data as Buffer or base64 string */
  audio: Buffer | string;

  /** STT configuration */
  config?: OpenRouterSTTConfig;
}

/**
 * Image resolution options
 */
export type ImageResolution = '512' | '1K' | '2K' | '4K';

/**
 * Image aspect ratio options
 */
export type ImageAspectRatio =
  | '1:1' | '1:2' | '2:1'
  | '2:3' | '3:2'
  | '3:4' | '4:3'
  | '4:5' | '5:4'
  | '9:16' | '16:9'
  | '9:21' | '21:9'
  | 'auto';

/**
 * Configuration for image generation
 */
export interface OpenRouterImageConfig {
  /**
   * Image resolution. Per-model support is in pricing.json -> resolutions;
   * on per-image models it also selects the price variant (1k vs 2k).
   * @default '1K'
   */
  resolution?: ImageResolution;

  /**
   * Aspect ratio
   * @default '1:1'
   */
  aspectRatio?: ImageAspectRatio;

  /**
   * Explicit pixel dimensions as `WIDTHxHEIGHT`. Alternative to
   * resolution + aspectRatio.
   */
  size?: string;

  /**
   * Number of images to generate. The ceiling is per-model
   * (pricing.json -> maxImagesPerRequest); several models only allow 1.
   * @default 1
   */
  n?: number;

  /**
   * Seed for reproducibility (models with supportsSeed).
   */
  seed?: number;

  /**
   * Reference images for editing or style guidance, as data: URLs or https
   * URLs. Ceiling is pricing.json -> maxInputReferences.
   */
  inputReferences?: string[];

  /**
   * Render quality, where the model exposes it (e.g. gpt-image-2).
   */
  quality?: 'auto' | 'low' | 'medium' | 'high';

  /**
   * Background handling, where the model exposes it.
   */
  background?: 'auto' | 'opaque' | 'transparent';

  /**
   * Output encoding, where the model exposes it.
   */
  outputFormat?: 'png' | 'jpeg' | 'webp';

  /**
   * Compression level 0-100 for lossy output formats.
   */
  outputCompression?: number;

  /**
   * Provider-specific passthrough options. Only keys listed in
   * pricing.json -> allowedPassthroughParameters are accepted.
   */
  provider?: Record<string, unknown>;
}

/**
 * Input for image generation
 */
export interface OpenRouterImageInput {
  /** The image model to use */
  model: OpenRouterImageModel;

  /** Text prompt describing the image */
  prompt: string;

  /** Image generation configuration */
  config?: OpenRouterImageConfig;
}

// =============================================================================
// OUTPUT INTERFACES
// =============================================================================

/**
 * Token usage statistics
 */
export interface TokenUsage {
  /** Input tokens */
  inputTokens: number;

  /** Output tokens */
  outputTokens: number;

  /** Total tokens */
  totalTokens: number;
}

/**
 * Cost calculation result
 */
export interface CostCalculation {
  /** Cost for input */
  inputCost: number;

  /** Cost for output */
  outputCost: number;

  /** Total cost */
  totalCost: number;

  /** Currency */
  currency: string;

  /**
   * Where the number came from:
   * - `api`      OpenRouter billed this exactly (usage.cost) — authoritative
   * - `computed` derived from pricing.json rates and the actual usage returned
   * - `estimate` derived from pricing.json before generating
   * - `unknown`  no published rate; totalCost is 0 and must not be trusted
   */
  source: 'api' | 'computed' | 'estimate' | 'unknown';

  /** Which SKU or rate was applied, for audit trails */
  basis?: string;

  /** Set when the cost could not be determined; explains why */
  note?: string;
}

/**
 * Response from text generation
 */
export interface OpenRouterTextResponse {
  /** Generated text */
  text: string;

  /** Token usage */
  usage: TokenUsage;

  /** Cost breakdown */
  cost: CostCalculation;

  /** Model used */
  model: OpenRouterTextModel;

  /** Finish reason */
  finishReason?: string;

  /** Response time in ms */
  latencyMs: number;

  /** OpenRouter generation ID */
  generationId?: string;
}

/**
 * Stream chunk from text generation
 */
export interface OpenRouterStreamChunk {
  /** Text content in this chunk */
  text?: string;

  /** Whether this is the final chunk */
  done: boolean;

  /** Token usage (only in final chunk) */
  usage?: TokenUsage;
}

/**
 * Generated video data
 */
export interface GeneratedVideo {
  /** Video URL (unsigned, temporary) */
  url: string;

  /** Video data as Buffer (if downloaded) */
  data?: Buffer;

  /** MIME type */
  mimeType: string;

  /** Suggested filename */
  fileName?: string;
}

/**
 * Response from video generation
 */
export interface OpenRouterVideoResponse {
  /** Generated videos */
  videos: GeneratedVideo[];

  /** Cost breakdown */
  cost: CostCalculation;

  /** Model used */
  model: OpenRouterVideoModel;

  /** Response time in ms */
  latencyMs: number;

  /** Job ID */
  jobId: string;
}

/**
 * Video generation job status
 */
export interface VideoJobStatus {
  /** Job ID */
  id: string;

  /**
   * Job status. OpenRouter reports `in_progress`; `processing` and `queued`
   * are tolerated as aliases so a server-side rename cannot hang the poller.
   */
  status: 'pending' | 'queued' | 'in_progress' | 'processing' | 'completed' | 'failed';

  /** Video URLs when completed */
  unsigned_urls?: string[];

  /** Actual billed cost, present on the terminal poll */
  usage?: { cost?: number; is_byok?: boolean };

  /** Error message if failed */
  error?: string | { message?: string; code?: string | number };
}

/**
 * Generated audio data
 */
export interface GeneratedAudio {
  /** Audio data as Buffer */
  data: Buffer;

  /** MIME type */
  mimeType: string;

  /** Suggested filename */
  fileName?: string;
}

/**
 * Response from TTS generation
 */
export interface OpenRouterTTSResponse {
  /** Generated audio */
  audio: GeneratedAudio;

  /** Cost breakdown */
  cost: CostCalculation;

  /** Model used */
  model: OpenRouterTTSModel;

  /** Response time in ms */
  latencyMs: number;

  /** Generation ID */
  generationId?: string;

  /** Token usage (audio output is billed in tokens) */
  usage?: TokenUsage;

  /** The model's own transcript of the spoken audio, when it returns one */
  transcript?: string;
}

/**
 * Response from STT transcription
 */
export interface OpenRouterSTTResponse {
  /** Transcribed text */
  text: string;

  /** Cost breakdown */
  cost: CostCalculation;

  /** Model used */
  model: OpenRouterSTTModel;

  /** Response time in ms */
  latencyMs: number;

  /** Generation ID from header */
  generationId?: string;

  /** Audio duration in minutes (for cost calculation) */
  durationMinutes?: number;
}

/**
 * Generated image data
 */
export interface GeneratedImage {
  /** Image data as Buffer */
  data: Buffer;

  /** Base64 encoded image */
  b64_json?: string;

  /** MIME type */
  mimeType: string;

  /** Suggested filename */
  fileName?: string;
}

/**
 * Response from image generation
 */
export interface OpenRouterImageResponse {
  /** Generated images */
  images: GeneratedImage[];

  /** Cost breakdown */
  cost: CostCalculation;

  /** Model used */
  model: OpenRouterImageModel;

  /** Response time in ms */
  latencyMs: number;

  /** Token usage, on models billed per token */
  usage?: TokenUsage;

  /** Any text the model returned alongside the images (refusals, captions) */
  text?: string;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Structured error response
 */
export interface OpenRouterError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Result wrapper type (discriminated union)
 */
export type OpenRouterResult<T> =
  | { success: true; data: T }
  | { success: false; error: OpenRouterError };

// =============================================================================
// PRICING DATA TYPES
// =============================================================================

/**
 * Pricing information for a model
 */
export interface ModelPricing {
  /** Prompt token rate (per million tokens) */
  input?: number;

  /** Completion token rate (per million tokens) */
  output?: number;

  /** Audio input token rate (per million tokens) */
  audio_input?: number;

  /** Audio output token rate (per million tokens) */
  audio_output?: number;

  /** Cached prompt read rate (per million tokens) */
  cache_read?: number;

  /** Cache write rate (per million tokens) */
  cache_write?: number;

  /** Internal reasoning token rate (per million tokens) */
  reasoning?: number;

  /** Flat rate per generated image, on models with one price for all sizes */
  image_per_image?: number;

  /** Flat rate per generated image at 1K / 2K / 4K */
  image_per_image_1k?: number;
  image_per_image_2k?: number;
  image_per_image_4k?: number;

  /** Flat rate charged per supplied reference image */
  input_image_per_image?: number;

  /** Flat rate per supplied font / style reference, on models that bill them */
  input_font_per_image?: number;
  input_reference_per_image?: number;

  /** Rate per megapixel of output (and input) area — the FLUX.2 family */
  image_per_megapixel?: number;
  input_image_per_megapixel?: number;

  /** Flat rate per finished generation — Lyria bills per song / per clip */
  audio_per_generation?: number;

  /** Output image token rate (per million tokens) */
  image_output_per_million_tokens?: number;

  /** Input image / text token rate on image models (per million tokens) */
  input_image_per_million_tokens?: number;
  input_text_per_million_tokens?: number;
}

/**
 * How a video model bills. The families are mutually incompatible, so the raw
 * SKU map is kept verbatim and resolved at estimate time.
 *
 * - `usd_per_second`   keys like `duration_seconds`, `duration_seconds_720p`,
 *                      `duration_seconds_with_audio`,
 *                      `text_to_video_duration_seconds_1080p` — USD per second
 * - `cents_per_second` keys like `cents_per_second_output_720p`,
 *                      `cents_per_video_output_second_480p` — US cents per second
 * - `video_tokens`     keys like `video_tokens`, `video_tokens_1080p` — USD per
 *                      video token; the token count is unknowable before the
 *                      render, so these cannot be estimated up front
 */
export type VideoPricingFamily = 'usd_per_second' | 'cents_per_second' | 'video_tokens' | 'unknown';

/**
 * Model information as stored in pricing.json.
 *
 * Generated by openrouter/scripts/sync-pricing.mjs — do not hand-edit.
 */
export interface ModelInfo {
  /** Human-readable name */
  name: string;

  /** Model type */
  type: OpenRouterModelType;

  /** Token / per-image rates. Empty for video models — see pricingSkus. */
  pricing?: ModelPricing;

  /** Currency */
  currency: string;

  /** Unit description */
  unit: string;

  /** Context window */
  contextWindow?: number;

  // --- video only ---
  /** Which SKU family the calculator should resolve */
  pricingFamily?: VideoPricingFamily;
  /** Raw SKU map exactly as published by OpenRouter (values are strings) */
  pricingSkus?: Record<string, string>;
  /** False when cost is only knowable after generation (token-billed video) */
  estimatable?: boolean;
  supportedResolutions?: string[];
  supportedAspectRatios?: string[];
  supportedDurations?: number[];
  supportedSizes?: string[] | null;
  supportedFrameImages?: string[];
  supportsAudio?: boolean;

  // --- image only ---
  resolutions?: string[];
  aspectRatios?: string[];
  qualities?: string[];
  backgrounds?: string[];
  outputFormats?: string[];
  maxImagesPerRequest?: number;
  maxInputReferences?: number;
  supportsStreaming?: boolean;

  // --- shared ---
  supportsSeed?: boolean;
  inputModalities?: string[];
  outputModalities?: string[];
  supportedParameters?: string[];
  allowedPassthroughParameters?: string[];

  /** True when OpenRouter publishes no rate; cost must come from usage.cost */
  pricingUnavailable?: boolean;

  /** Set when the rate was recovered from prose rather than a pricing field */
  priceSource?: string;
}

/**
 * Complete pricing data structure
 */
export interface PricingData {
  /** Date the catalog was last pulled (YYYY-MM-DD) */
  lastVerified?: string;

  /** Which endpoints the data came from */
  source?: string;

  /** Model counts by type */
  counts?: Record<string, number>;

  /** Map of model ID to model info */
  models: Record<string, ModelInfo>;
}
