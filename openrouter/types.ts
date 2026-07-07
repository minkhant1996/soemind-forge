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
  // Anthropic
  | 'anthropic/claude-sonnet-4'
  | 'anthropic/claude-opus-4'
  | 'anthropic/claude-haiku-3.5'
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
  // Mistral
  | 'mistralai/mistral-large'
  | 'mistralai/mistral-small'
  // Qwen
  | 'qwen/qwen-2.5-72b-instruct'
  // MiniMax
  | 'minimax/minimax-m3'
  | 'minimax/minimax-m2.7'
  // Allow any string for models not in this list
  | (string & {});

/**
 * Available video generation models on OpenRouter
 */
export type OpenRouterVideoModel =
  | 'bytedance/seedance-2.0'
  | 'bytedance/seedance-2.0-fast'
  | 'minimax/hailuo-2.3'
  | (string & {});

/**
 * Available TTS (Text-to-Speech) models on OpenRouter
 */
export type OpenRouterTTSModel =
  | 'hexgrad/kokoro-82m'
  | 'x-ai/grok-voice-tts-1.0'
  | 'google/gemini-3.1-flash-tts-preview'
  | 'openai/tts-1'
  | 'openai/tts-1-hd'
  | 'elevenlabs/eleven-turbo-v2.5'
  | (string & {});

/**
 * Available STT (Speech-to-Text) models on OpenRouter
 */
export type OpenRouterSTTModel =
  | 'google/chirp-3'
  | 'nvidia/parakeet-tdt-0.6b-v3'
  | 'openai/whisper-large-v3'
  | (string & {});

/**
 * Available image generation models on OpenRouter
 */
export type OpenRouterImageModel =
  | 'bytedance-seed/seedream-4.5'
  | 'google/gemini-3-pro-image'
  | 'google/gemini-3.1-flash-image'
  | 'openai/dall-e-3'
  | 'black-forest-labs/flux-1.1-pro'
  | 'black-forest-labs/flux-schnell'
  | 'stability/sdxl'
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
 * Configuration for video generation
 */
export interface OpenRouterVideoConfig {
  /**
   * Video duration in seconds
   */
  durationSeconds?: number;

  /**
   * Video aspect ratio
   */
  aspectRatio?: '16:9' | '9:16' | '1:1';

  /**
   * First frame image (base64)
   */
  firstFrameImage?: string;

  /**
   * Last frame image (base64)
   */
  lastFrameImage?: string;

  /**
   * Frequency penalty
   */
  frequencyPenalty?: number;
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
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'shimmer'
  | (string & {});

/**
 * Audio output format
 */
export type AudioFormat = 'mp3' | 'wav' | 'pcm' | 'opus' | 'flac';

/**
 * Configuration for TTS generation
 */
export interface OpenRouterTTSConfig {
  /**
   * Voice to use
   * @default 'alloy'
   */
  voice?: TTSVoice;

  /**
   * Output audio format
   * @default 'mp3'
   */
  responseFormat?: AudioFormat;

  /**
   * Speaking speed (0.25 to 4.0)
   * @default 1.0
   */
  speed?: number;

  /**
   * Temperature for variation
   */
  temperature?: number;
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
export type AudioInputFormat = 'wav' | 'mp3' | 'flac' | 'ogg' | 'webm' | 'm4a';

/**
 * Configuration for STT transcription
 */
export interface OpenRouterSTTConfig {
  /**
   * Audio format
   * @default 'wav'
   */
  format?: AudioInputFormat;

  /**
   * Language hint (ISO 639-1 code)
   */
  language?: string;

  /**
   * Temperature for variation
   */
  temperature?: number;
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
export type ImageResolution = '1K' | '2K' | '4K';

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
   * Image resolution
   * @default '1K'
   */
  resolution?: ImageResolution;

  /**
   * Aspect ratio
   * @default '1:1'
   */
  aspectRatio?: ImageAspectRatio;

  /**
   * Number of images to generate (1-10)
   * @default 1
   */
  n?: number;

  /**
   * Seed for reproducibility
   */
  seed?: number;

  /**
   * Reference images (base64)
   */
  inputReferences?: string[];
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

  /** Status */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /** Video URLs when completed */
  unsigned_urls?: string[];

  /** Error message if failed */
  error?: string;
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

  /** Generation ID from header */
  generationId?: string;
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
  /** Input token rate (per million) */
  input?: number;

  /** Output token rate (per million) */
  output?: number;

  /** Video rate (per second) */
  video_per_second?: number;

  /** Audio rate (per million characters) */
  audio_per_million_chars?: number;

  /** Audio output token rate (per million) */
  audio_output?: number;

  /** STT rate (per minute of audio) */
  stt_per_minute?: number;

  /** Image rate (per image) */
  image_per_image?: number;

  /** Image rate for 1024px */
  image_1024?: number;

  /** Image rate for 1792px */
  image_1792?: number;
}

/**
 * Model information
 */
export interface ModelInfo {
  /** Human-readable name */
  name: string;

  /** Model type */
  type: OpenRouterModelType;

  /** Pricing */
  pricing: ModelPricing;

  /** Currency */
  currency: string;

  /** Unit description */
  unit: string;

  /** Context window */
  contextWindow?: number;

  /** Max duration for video */
  maxDurationSeconds?: number;
}

/**
 * Complete pricing data structure
 */
export interface PricingData {
  /** Map of model ID to model info */
  models: Record<string, ModelInfo>;
}
