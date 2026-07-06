/**
 * Gemini Provider Types
 * =====================
 *
 * Type definitions for all Gemini API interactions.
 *
 * This file defines TypeScript interfaces and types for:
 * - Model identifiers (which models are available)
 * - Input configurations (how to configure API calls)
 * - Response structures (what the API returns)
 * - Token usage and cost tracking
 *
 * @see https://ai.google.dev/api - Official Gemini API Reference
 * @see https://ai.google.dev/gemini-api/docs/models/gemini - Available models
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Thinking levels for Gemini 3.x models
 *
 * Gemini 3.x models support "thinking" - internal reasoning before responding.
 * Higher thinking levels produce better results but cost more tokens.
 *
 * @see https://ai.google.dev/gemini-api/docs/thinking
 *
 * @example
 * // For simple queries (fast, cheap)
 * config: { thinkingLevel: ThinkingLevel.MINIMAL }
 *
 * @example
 * // For complex analysis (slower, better quality)
 * config: { thinkingLevel: ThinkingLevel.HIGH }
 */
export enum ThinkingLevel {
  /** Fastest response, minimal reasoning. Best for simple lookups. */
  MINIMAL = 'MINIMAL',

  /** Light reasoning. Good for basic Q&A. */
  LOW = 'LOW',

  /** Balanced reasoning. Recommended for general use. */
  MEDIUM = 'MEDIUM',

  /** Deep reasoning. Best for complex analysis and coding tasks. */
  HIGH = 'HIGH',
}

/**
 * Video aspect ratios for video generation
 */
export type VideoAspectRatio = '9:16' | '16:9' | '1:1';

/**
 * Video resolution options
 */
export type VideoResolution = '720p' | '1080p' | '4k';

/**
 * Available TTS voice names (30 total)
 *
 * Voice characteristics:
 * - Female: Achernar, Aoede, Autonoe, Callirrhoe, Despina, Erinome, Gacrux,
 *           Kore, Laomedeia, Leda, Pulcherrima, Sulafat, Vindemiatrix, Zephyr
 * - Male: Achird, Algenib, Algieba, Alnilam, Charon, Enceladus, Fenrir,
 *         Iapetus, Orus, Puck, Rasalgethi, Sadachbia, Sadaltager, Schedar,
 *         Umbriel, Zubenelgenubi
 *
 * @see https://ai.google.dev/gemini-api/docs/speech
 */
export type TTSVoiceName =
  // Female voices
  | 'Achernar'
  | 'Aoede'
  | 'Autonoe'
  | 'Callirrhoe'
  | 'Despina'
  | 'Erinome'
  | 'Gacrux'
  | 'Kore'
  | 'Laomedeia'
  | 'Leda'
  | 'Pulcherrima'
  | 'Sulafat'
  | 'Vindemiatrix'
  | 'Zephyr'
  // Male voices
  | 'Achird'
  | 'Algenib'
  | 'Algieba'
  | 'Alnilam'
  | 'Charon'
  | 'Enceladus'
  | 'Fenrir'
  | 'Iapetus'
  | 'Orus'
  | 'Puck'
  | 'Rasalgethi'
  | 'Sadachbia'
  | 'Sadaltager'
  | 'Schedar'
  | 'Umbriel'
  | 'Zubenelgenubi';

/**
 * TTS voice style presets
 *
 * These are common styles - you can also provide custom natural language descriptions.
 */
export type TTSVoiceStyle =
  | 'neutral'
  | 'vocal_smile' // Bright, sunny, explicitly inviting
  | 'newscaster' // Professional news delivery
  | 'whisper' // Soft, intimate speaking
  | 'empathetic' // Warm, understanding tone
  | 'promo_hype' // Energetic, promotional
  | 'deadpan' // Flat, dry delivery
  | 'excited' // High energy, enthusiastic
  | 'sarcastic' // Ironic tone
  | 'serious' // Grave, formal
  | 'casual' // Relaxed, informal
  | string; // Custom natural language description

/**
 * TTS voice pace presets
 *
 * These are common paces - you can also provide custom natural language descriptions.
 */
export type TTSVoicePace =
  | 'natural' // Default speaking speed
  | 'rapid_fire' // Very fast delivery
  | 'slow' // Deliberate, measured pace
  | 'the_drift' // Incredibly slow and liquid tempo
  | 'staccato' // Sharp, clipped delivery
  | 'energetic' // Upbeat, quick
  | string; // Custom natural language description

/**
 * TTS voice accent presets
 *
 * These are common accents - you can also provide specific regional descriptions.
 * More specific descriptions work better (e.g., "British English as heard in Croydon").
 */
export type TTSVoiceAccent =
  | 'neutral'
  | 'american_general' // Standard American English
  | 'american_valley' // Southern California valley girl
  | 'american_southern' // Southern US accent
  | 'british_rp' // Received Pronunciation (Queen's English)
  | 'british_brixton' // London Brixton style
  | 'british_scottish' // Scottish accent
  | 'transatlantic' // Mid-Atlantic accent
  | 'australian' // Australian accent
  | 'indian' // Indian English accent
  | string; // Custom natural language description

/**
 * Common TTS audio tags for inline control
 *
 * Embed these in your text to control delivery at specific points.
 * @example "Hello [excited] this is amazing! [whispers] but keep it secret."
 */
export type TTSAudioTag =
  | '[amazed]'
  | '[crying]'
  | '[curious]'
  | '[excited]'
  | '[sighs]'
  | '[gasp]'
  | '[giggles]'
  | '[laughs]'
  | '[mischievously]'
  | '[panicked]'
  | '[sarcastic]'
  | '[serious]'
  | '[shouting]'
  | '[tired]'
  | '[trembling]'
  | '[whispers]'
  | '[slow]'
  | '[fast]'
  | '[short pause]'
  | '[long pause]';

/**
 * Voice settings for TTS (Director's Note)
 *
 * These settings control the overall delivery style, pace, and accent.
 * The API uses natural language, so you can provide custom descriptions.
 *
 * @example
 * {
 *   style: 'vocal_smile',
 *   pace: 'natural',
 *   accent: 'british_rp'
 * }
 *
 * @example
 * // Custom descriptions work too
 * {
 *   style: 'speak like a calm meditation guide',
 *   pace: 'slow and deliberate with pauses for breath',
 *   accent: 'soft Irish lilt'
 * }
 */
export interface TTSVoiceSettings {
  /**
   * Voice style/emotion
   * Use preset values or custom natural language description
   */
  style?: TTSVoiceStyle;

  /**
   * Speaking pace/speed
   * Use preset values or custom natural language description
   */
  pace?: TTSVoicePace;

  /**
   * Voice accent
   * More specific descriptions work better (e.g., "British as heard in Croydon")
   */
  accent?: TTSVoiceAccent;

  /**
   * Audio profile description
   * Full natural language description of the speaker's characteristics
   * @example "A warm, friendly radio host with a slight smile in their voice"
   */
  audioProfile?: string;
}

// =============================================================================
// BASIC TYPES
// =============================================================================

/**
 * Image output sizes for image generation models
 *
 * Higher resolutions cost more per image.
 *
 * | Size | Resolution      | Approx. Megapixels |
 * |------|-----------------|-------------------|
 * | 512  | ~512x512       | 0.25 MP           |
 * | 1K   | ~1024x1024     | 1 MP              |
 * | 2K   | ~2048x2048     | 4 MP              |
 * | 4K   | ~4096x4096     | 16 MP             |
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
export type ImageSize = '512' | '1K' | '2K' | '4K';

/**
 * Categorizes models by their primary output type
 */
export type GeminiModelType = 'text' | 'image' | 'video' | 'audio' | 'music';

// =============================================================================
// MODEL IDENTIFIERS
// =============================================================================

/**
 * Available text generation models
 *
 * Use these model IDs when calling the API directly.
 * For convenience, use the pre-configured functions instead:
 * - gemini25Flash() instead of model: 'gemini-2.5-flash'
 *
 * Model Selection Guide:
 * ----------------------
 * | Model                    | Best For                | Cost    |
 * |--------------------------|-------------------------|---------|
 * | gemini-2.5-flash-lite    | Simple tasks, budget    | Lowest  |
 * | gemini-2.5-flash         | General use (DEFAULT)   | Low     |
 * | gemini-3.1-flash-lite    | Budget with thinking    | Low     |
 * | gemini-3-flash-preview   | Balanced with thinking  | Medium  |
 * | gemini-3.5-flash         | Latest fast model       | Medium  |
 * | gemini-2.5-pro           | Complex reasoning       | High    |
 * | gemini-3.1-pro-preview   | Highest quality         | Highest |
 *
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 * @see https://ai.google.dev/pricing
 */
export type GeminiTextModel =
  | 'gemini-3.5-flash' // Latest fast model with thinking support
  | 'gemini-3.1-flash-lite' // Budget option for simple tasks
  | 'gemini-3-flash-preview' // Preview of Gemini 3 flash capabilities
  | 'gemini-3.1-pro-preview' // Highest quality, deep reasoning
  | 'gemini-2.5-flash' // Stable, cost-effective (RECOMMENDED)
  | 'gemini-2.5-flash-lite' // Cheapest option available
  | 'gemini-2.5-pro'; // Premium quality for complex tasks

/**
 * Available image generation models
 *
 * | Model                         | Quality | Speed   | Cost    |
 * |-------------------------------|---------|---------|---------|
 * | gemini-3.1-flash-lite-image   | OK      | Fastest | Lowest  |
 * | gemini-3.1-flash-image-preview| Good    | Fast    | Lower   |
 * | gemini-3-pro-image-preview    | Best    | Slower  | Higher  |
 * | gemini-3-pro-image            | Best    | Slower  | Higher  |
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
export type GeminiImageModel =
  | 'gemini-3.1-flash-lite-image' // Cheapest, at-scale image generation (Nano Banana 2 Lite)
  | 'gemini-3.1-flash-image-preview' // Fast image generation
  | 'gemini-3-pro-image-preview' // High quality images
  | 'gemini-3-pro-image'; // High quality images (alias)

/**
 * Available video generation models (Veo)
 *
 * | Model                        | Quality | Speed  | Audio | Cost    |
 * |------------------------------|---------|--------|-------|---------|
 * | veo-3.1-lite-generate-preview| Good    | Fast   | Yes   | Lowest  |
 * | veo-3.1-generate-preview     | Better  | Medium | Yes   | Medium  |
 * | veo-3-generate-preview       | Best    | Slow   | Yes   | Highest |
 *
 * @see https://ai.google.dev/gemini-api/docs/video
 */
export type VeoModel =
  | 'veo-3.1-lite-generate-preview' // Fast, budget video generation
  | 'veo-3.1-generate-preview' // Balanced quality/speed
  | 'veo-3-generate-preview' // Highest quality
  | 'veo-3.1-fast-generate-preview' // Fast generation
  | 'veo-3-fast-generate-preview'; // Fast high-quality

/**
 * Omni video model (Gemini Omni Flash)
 *
 * Unlike Veo (billed per second), Omni is a token-priced multimodal model that
 * generates video and supports conversational editing — bring text and images to
 * life as video and refine outputs through natural language. Billed per million
 * tokens: input $1.50, output $9.00, video output $17.50.
 *
 * @see https://ai.google.dev/gemini-api/docs
 */
export type GeminiOmniModel =
  | 'gemini-omni-flash-preview'; // Video generation + conversational editing

/**
 * Available TTS (Text-to-Speech) models
 *
 * | Model                          | Quality | Multi-Speaker |
 * |--------------------------------|---------|---------------|
 * | gemini-2.5-flash-preview-tts   | Good    | Yes           |
 * | gemini-3.1-flash-tts-preview   | Better  | Yes           |
 *
 * @see https://ai.google.dev/gemini-api/docs/speech
 */
export type TTSModel =
  | 'gemini-2.5-flash-preview-tts'
  | 'gemini-3.1-flash-tts-preview';

/**
 * Available music generation models (Lyria)
 *
 * | Model                  | Output            | Max Duration |
 * |------------------------|-------------------|--------------|
 * | lyria-3-pro-preview    | Full song         | 3 minutes    |
 * | lyria-3                | 30-second clip    | 30 seconds   |
 * | lyria-3-pro            | Full song         | 3 minutes    |
 * | lyria-2                | 30-second clip    | 30 seconds   |
 *
 * @see https://ai.google.dev/gemini-api/docs/music
 */
export type LyriaModel =
  | 'lyria-3-pro-preview'
  | 'lyria-3'
  | 'lyria-3-pro'
  | 'lyria-2';

/**
 * Union of all available Gemini models
 */
export type GeminiModel =
  | GeminiTextModel
  | GeminiImageModel
  | VeoModel
  | GeminiOmniModel
  | TTSModel
  | LyriaModel;

// =============================================================================
// INPUT INTERFACES
// =============================================================================

/**
 * Base input for all Gemini API calls
 *
 * This interface defines the common inputs accepted by all model functions.
 *
 * @property systemPrompt - Instructions for how the model should behave
 *   @see https://ai.google.dev/gemini-api/docs/system-instructions
 *
 * @property userPrompt - The actual user message/question (REQUIRED)
 *
 * @property imageInput - Optional image for multimodal input
 *   Can be a Node.js Buffer or base64-encoded string
 *   @see https://ai.google.dev/gemini-api/docs/vision
 *
 * @property imageMimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
 *   @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 *
 * @property audioInput - Optional audio for multimodal input
 *   @see https://ai.google.dev/gemini-api/docs/audio
 *
 * @property audioMimeType - MIME type of the audio (e.g., 'audio/mp3', 'audio/wav')
 *
 * @example
 * // Text only
 * { userPrompt: 'What is 2+2?' }
 *
 * @example
 * // With system prompt
 * {
 *   systemPrompt: 'You are a helpful math tutor.',
 *   userPrompt: 'Explain calculus to a beginner.'
 * }
 *
 * @example
 * // With image input
 * {
 *   userPrompt: 'Describe this image',
 *   imageInput: fs.readFileSync('photo.jpg'),
 *   imageMimeType: 'image/jpeg'
 * }
 */
export interface GeminiBaseInput {
  /** Instructions for model behavior. Optional but recommended. */
  systemPrompt?: string;

  /** The user's message or question. REQUIRED. */
  userPrompt: string;

  /** Image data as Buffer or base64 string. Optional. */
  imageInput?: Buffer | string;

  /** MIME type of image (default: 'image/jpeg'). */
  imageMimeType?: string;

  /**
   * Additional input images (multi-reference). Appended after imageInput.
   * Gemini image models accept several reference images in one request —
   * describe each image's role in the prompt.
   */
  imageInputs?: Array<{ data: Buffer | string; mimeType?: string }>;

  /** Audio data as Buffer or base64 string. Optional. */
  audioInput?: Buffer | string;

  /** MIME type of audio (default: 'audio/mp3'). */
  audioMimeType?: string;
}

/**
 * Configuration options for text generation
 *
 * These parameters control the model's output behavior.
 *
 * @see https://ai.google.dev/gemini-api/docs/models/generative-models#model-parameters
 *
 * @example
 * // Creative writing
 * {
 *   temperature: 1.2,
 *   topP: 0.95,
 *   maxOutputTokens: 4096
 * }
 *
 * @example
 * // Factual Q&A
 * {
 *   temperature: 0.2,
 *   topP: 0.8,
 *   maxOutputTokens: 1024
 * }
 */
export interface GeminiTextConfig {
  /**
   * Controls randomness in output (0.0 - 2.0)
   *
   * - 0.0 = Deterministic (same input always gives same output)
   * - 0.7 = Balanced (default for most use cases)
   * - 1.0 = Standard randomness
   * - 2.0 = Maximum creativity/randomness
   *
   * @see https://ai.google.dev/gemini-api/docs/models/generative-models#model-parameters
   */
  temperature?: number;

  /**
   * Nucleus sampling threshold (0.0 - 1.0)
   *
   * Controls diversity by limiting tokens to those within cumulative probability.
   * - 0.9 means: only consider tokens whose cumulative probability reaches 90%
   * - Lower = more focused, Higher = more diverse
   *
   * @see https://arxiv.org/abs/1904.09751 - Original paper on nucleus sampling
   */
  topP?: number;

  /**
   * Top-K sampling parameter (1 - 100)
   *
   * Only consider the top K most likely tokens at each step.
   * - Lower = more focused/predictable
   * - Higher = more diverse
   * - Often used together with topP
   */
  topK?: number;

  /**
   * Maximum number of tokens in the response
   *
   * - 1 token ≈ 4 characters or ¾ of a word
   * - Model will stop when reaching this limit
   * - Maximum varies by model (typically 8192)
   *
   * @see https://ai.google.dev/gemini-api/docs/tokens
   */
  maxOutputTokens?: number;

  /**
   * Strings that stop generation when encountered
   *
   * @example
   * stopSequences: ['END', '---', '\n\n\n']
   */
  stopSequences?: string[];

  /**
   * Thinking level for Gemini 3.x models
   *
   * Controls how much reasoning the model does before responding.
   * Only works with Gemini 3.x models.
   *
   * @see ThinkingLevel enum for options
   * @see https://ai.google.dev/gemini-api/docs/thinking
   */
  thinkingLevel?: ThinkingLevel;

  /**
   * Thinking budget for Gemini 2.5 models
   *
   * - -1 = Unlimited thinking (recommended)
   * - 0 = No thinking
   * - N = Allow N tokens for thinking
   *
   * Only works with Gemini 2.5 models.
   */
  thinkingBudget?: number;

  /**
   * Enable web search/grounding
   *
   * When true, model can search the web for real-time information.
   * Useful for current events, recent data, etc.
   *
   * @see https://ai.google.dev/gemini-api/docs/grounding
   */
  enableUrlContext?: boolean;

  /**
   * Enable Google Search grounding
   *
   * When true, model uses Google Search for grounding.
   */
  enableGoogleSearch?: boolean;
}

/**
 * Configuration for image generation
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
export interface GeminiImageConfig {
  /**
   * Aspect ratio of generated images
   *
   * Common values: '1:1', '16:9', '9:16', '4:3', '3:4'
   * Empty string uses model default.
   */
  aspectRatio?: string;

  /**
   * Output image size/resolution
   *
   * Higher sizes cost more per image.
   * @see ImageSize type for options
   */
  imageSize?: ImageSize;

  /**
   * Controls generation of images with people
   *
   * May be restricted based on safety settings.
   */
  personGeneration?: string;

  /**
   * Thinking level (for models that support it)
   */
  thinkingLevel?: ThinkingLevel;

  /**
   * Enable Google Search for reference images
   */
  enableGoogleSearch?: boolean;
}

/**
 * Configuration for video generation (Veo)
 *
 * @see https://ai.google.dev/gemini-api/docs/video
 */
export interface VeoConfig {
  /**
   * Number of videos to generate (1-4)
   * @default 1
   */
  numberOfVideos?: number;

  /**
   * Video aspect ratio
   * @default '16:9'
   */
  aspectRatio?: VideoAspectRatio;

  /**
   * Video resolution
   * @default '720p'
   */
  resolution?: VideoResolution;

  /**
   * Duration in seconds (5-8 for most models)
   * @default 6
   */
  durationSeconds?: number;

  /**
   * Controls generation of videos with people
   * 'allow' or 'dont_allow'
   * @default 'dont_allow'
   */
  personGeneration?: 'allow' | 'dont_allow';

  /**
   * Generate audio with video (for Veo 3+)
   * @default false
   */
  generateAudio?: boolean;
}

/**
 * Speaker voice configuration for TTS (multi-speaker mode)
 */
export interface SpeakerVoiceConfig {
  /** Speaker identifier (e.g., 'Speaker 1', alphanumeric only) */
  speaker: string;

  /** Voice name to use */
  voiceName: TTSVoiceName;

  /**
   * Voice settings for this speaker (style, pace, accent)
   * These override the global voice settings for this specific speaker
   */
  voiceSettings?: TTSVoiceSettings;
}

/**
 * Configuration for TTS (Text-to-Speech)
 *
 * @see https://ai.google.dev/gemini-api/docs/speech
 *
 * @example
 * // Basic single speaker
 * {
 *   voiceName: 'Zephyr',
 *   voiceSettings: { style: 'vocal_smile', pace: 'natural', accent: 'american_general' }
 * }
 *
 * @example
 * // Multi-speaker conversation
 * {
 *   speakers: [
 *     { speaker: 'Host', voiceName: 'Zephyr', voiceSettings: { style: 'excited', pace: 'energetic' } },
 *     { speaker: 'Guest', voiceName: 'Puck', voiceSettings: { style: 'casual', accent: 'british_rp' } }
 *   ]
 * }
 *
 * @example
 * // Custom audio profile
 * {
 *   voiceName: 'Aoede',
 *   voiceSettings: {
 *     audioProfile: 'A warm, friendly podcast host who speaks with enthusiasm and occasional laughter'
 *   }
 * }
 */
export interface TTSConfig {
  /**
   * Temperature for voice variation (0.0 - 2.0)
   * Higher values produce more varied/creative delivery
   * @default 1
   */
  temperature?: number;

  /**
   * Single speaker voice name (for single-speaker mode)
   * @default 'Zephyr'
   */
  voiceName?: TTSVoiceName;

  /**
   * Voice settings (style, pace, accent, audioProfile)
   * Applied to single speaker or as defaults for all speakers
   */
  voiceSettings?: TTSVoiceSettings;

  /**
   * Multi-speaker configuration (for dialogue/conversation)
   * Each speaker can have individual voice name and settings
   */
  speakers?: SpeakerVoiceConfig[];
}

/**
 * Configuration for music generation (Lyria)
 *
 * @see https://ai.google.dev/gemini-api/docs/music
 */
export interface LyriaConfig {
  /**
   * Duration in seconds
   * - lyria-3: 30 seconds max
   * - lyria-3-pro: 180 seconds (3 minutes) max
   */
  durationSeconds?: number;
}

/**
 * Complete input for text generation
 */
export interface GeminiTextInput extends GeminiBaseInput {
  /** The text model to use */
  model: GeminiTextModel;

  /** Generation configuration */
  config?: GeminiTextConfig;
}

/**
 * Complete input for image generation
 */
export interface GeminiImageInput extends GeminiBaseInput {
  /** The image model to use */
  model: GeminiImageModel;

  /** Image generation configuration */
  config?: GeminiImageConfig;
}

/**
 * Input for video generation (Veo)
 */
export interface VeoInput {
  /** The Veo model to use */
  model: VeoModel;

  /** Text prompt describing the video */
  prompt: string;

  /**
   * Optional reference image (first frame).
   * When provided, the video starts from this exact visual.
   */
  referenceImage?: Buffer | string;

  /** Reference image MIME type */
  referenceImageMimeType?: string;

  /**
   * Optional last frame image (Veo 3.1 only).
   * When provided along with referenceImage, Veo interpolates between them.
   * Use for: transformations, before/after, reveals.
   */
  lastFrameImage?: Buffer | string;

  /** Last frame image MIME type */
  lastFrameImageMimeType?: string;

  /**
   * Optional asset reference images (Veo 3.1 only, max 3).
   * Unlike referenceImage (the exact first frame), these guide WHAT things
   * look like — character sheets, environment sheets, props — without
   * appearing verbatim. Describe each asset's role in the prompt.
   */
  referenceImages?: Array<{ data: Buffer | string; mimeType?: string }>;

  /** Video generation configuration */
  config?: VeoConfig;
}

/**
 * Input for TTS (Text-to-Speech)
 */
export interface TTSInput {
  /** The TTS model to use */
  model: TTSModel;

  /** Text to convert to speech (can include speaker annotations) */
  text: string;

  /** TTS configuration */
  config?: TTSConfig;
}

/**
 * Input for music generation (Lyria)
 */
export interface LyriaInput {
  /** The Lyria model to use */
  model: LyriaModel;

  /** Text prompt describing the music */
  prompt: string;

  /** Optional reference image for mood */
  imageInput?: Buffer | string;

  /** Image MIME type */
  imageMimeType?: string;

  /** Music generation configuration */
  config?: LyriaConfig;
}

// =============================================================================
// OUTPUT INTERFACES
// =============================================================================

/**
 * Token usage statistics
 *
 * Tracks how many tokens were used for billing purposes.
 * You pay for both input (prompt) and output (response) tokens.
 *
 * @see https://ai.google.dev/gemini-api/docs/tokens
 * @see https://ai.google.dev/pricing
 *
 * @example
 * // Example response
 * {
 *   inputTokens: 150,    // Your prompt used 150 tokens
 *   outputTokens: 500,   // Model response used 500 tokens
 *   totalTokens: 650     // Total for billing
 * }
 */
export interface TokenUsage {
  /** Number of tokens in the input (prompt + images + audio) */
  inputTokens: number;

  /** Number of tokens in the output (model's response) */
  outputTokens: number;

  /** Total tokens (input + output) */
  totalTokens: number;
}

/**
 * Cost calculation result
 *
 * Provides cost breakdown in USD for each API call.
 * Calculated based on token usage and model pricing.
 *
 * @see ./pricing.json for current pricing data
 * @see https://ai.google.dev/pricing
 *
 * @example
 * // Typical response
 * {
 *   inputCost: 0.000045,   // $0.000045 for input
 *   outputCost: 0.00125,   // $0.00125 for output
 *   totalCost: 0.001295,   // Total: ~$0.0013 (~0.13 cents)
 *   currency: 'USD'
 * }
 */
export interface CostCalculation {
  /** Cost for input tokens in USD */
  inputCost: number;

  /** Cost for output tokens in USD */
  outputCost: number;

  /** Total cost (inputCost + outputCost) in USD */
  totalCost: number;

  /** Currency code (always 'USD') */
  currency: string;
}

/**
 * Response from text generation
 *
 * Contains the generated text plus usage/cost metrics.
 */
export interface GeminiTextResponse {
  /** The generated text content */
  text: string;

  /** Token usage statistics */
  usage: TokenUsage;

  /** Cost breakdown in USD */
  cost: CostCalculation;

  /** Which model was used */
  model: GeminiTextModel;

  /**
   * Why generation stopped
   *
   * | Value       | Meaning                           |
   * |-------------|-----------------------------------|
   * | STOP        | Natural completion               |
   * | MAX_TOKENS  | Hit maxOutputTokens limit        |
   * | SAFETY      | Blocked by safety filters        |
   * | RECITATION  | Blocked for potential copyright  |
   *
   * @see https://ai.google.dev/api/generate-content#FinishReason
   */
  finishReason?: string;

  /** Response time in milliseconds */
  latencyMs: number;
}

/**
 * Response from image generation
 */
export interface GeminiImageResponse {
  /** Array of generated images */
  images: GeneratedImage[];

  /** Optional text output (some models can output both) */
  text?: string;

  /** Token usage statistics */
  usage: TokenUsage;

  /** Cost breakdown in USD */
  cost: CostCalculation;

  /** Which model was used */
  model: GeminiImageModel;

  /** Response time in milliseconds */
  latencyMs: number;
}

/**
 * A single generated image
 */
export interface GeneratedImage {
  /** Raw image data as Buffer */
  data: Buffer;

  /** MIME type (e.g., 'image/png') */
  mimeType: string;

  /** Suggested filename */
  fileName?: string;
}

/**
 * Response from video generation (Veo)
 */
export interface VeoResponse {
  /** Array of generated videos */
  videos: GeneratedVideo[];

  /** Cost breakdown in USD */
  cost: CostCalculation;

  /** Which model was used */
  model: VeoModel;

  /** Total processing time in milliseconds */
  latencyMs: number;

  /** Operation name for tracking */
  operationName?: string;
}

/**
 * A single generated video
 */
export interface GeneratedVideo {
  /** Video data as Buffer */
  data: Buffer;

  /** MIME type (typically 'video/mp4') */
  mimeType: string;

  /** Video URI from API (for debugging) */
  uri?: string;

  /** Duration in seconds */
  durationSeconds?: number;

  /** Suggested filename */
  fileName?: string;
}

/**
 * Response from TTS (Text-to-Speech)
 */
export interface TTSResponse {
  /** Generated audio data */
  audio: GeneratedAudio;

  /** Cost breakdown in USD */
  cost: CostCalculation;

  /** Which model was used */
  model: TTSModel;

  /** Response time in milliseconds */
  latencyMs: number;
}

/**
 * Generated audio data
 */
export interface GeneratedAudio {
  /** Audio data as Buffer (WAV format) */
  data: Buffer;

  /** MIME type (typically 'audio/wav' or 'audio/L16') */
  mimeType: string;

  /** Sample rate in Hz */
  sampleRate?: number;

  /** Suggested filename */
  fileName?: string;
}

/**
 * Response from music generation (Lyria)
 */
export interface LyriaResponse {
  /** Generated music data */
  music: GeneratedMusic;

  /** Cost breakdown in USD */
  cost: CostCalculation;

  /** Which model was used */
  model: LyriaModel;

  /** Response time in milliseconds */
  latencyMs: number;
}

/**
 * Generated music data
 */
export interface GeneratedMusic {
  /** Music data as Buffer */
  data: Buffer;

  /** MIME type (typically 'audio/wav' or 'audio/mp3') */
  mimeType: string;

  /** Duration in seconds */
  durationSeconds?: number;

  /** Suggested filename */
  fileName?: string;
}

/**
 * A chunk from streaming response
 *
 * @see https://ai.google.dev/gemini-api/docs/text-generation#streaming
 */
export interface GeminiStreamChunk {
  /** Text content in this chunk (may be empty) */
  text?: string;

  /** True if this is the final chunk */
  done: boolean;

  /** Token usage (only present in final chunk) */
  usage?: TokenUsage;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Structured error response
 *
 * @example
 * {
 *   code: 'QUOTA_EXCEEDED',
 *   message: 'API quota exceeded. Please try again later.',
 *   details: { model: 'gemini-2.5-flash', quotaRemaining: 0 }
 * }
 */
export interface GeminiError {
  /** Error code for programmatic handling */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Result wrapper type
 *
 * Uses discriminated union for type-safe error handling.
 * Check `success` property to narrow the type.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
 *
 * @example
 * const result = await gemini25Flash({ userPrompt: 'Hello' });
 *
 * if (result.success) {
 *   // TypeScript knows result.data exists here
 *   console.log(result.data.text);
 *   console.log('Cost:', result.data.cost.totalCost);
 * } else {
 *   // TypeScript knows result.error exists here
 *   console.error('Error:', result.error.message);
 * }
 */
export type GeminiResult<T> =
  | { success: true; data: T }
  | { success: false; error: GeminiError };

// =============================================================================
// PRICING DATA TYPES (for pricing.json)
// =============================================================================

/**
 * Pricing information for a model
 *
 * Prices are in USD per million tokens.
 * Some models have tiered pricing (different rates over 200K tokens).
 */
export interface ModelPricing {
  /** Flat rate for input tokens (per million) */
  input?: number;

  /** Flat rate for output tokens (per million) */
  output?: number;

  /** Rate for cached input tokens (per million) */
  cached_input?: number;

  /** Rate for audio input tokens (per million) */
  audio_input?: number;

  /** Input rate for prompts under 200K tokens */
  input_under_200k?: number;

  /** Input rate for prompts over 200K tokens */
  input_over_200k?: number;

  /** Output rate for prompts under 200K tokens */
  output_under_200k?: number;

  /** Output rate for prompts over 200K tokens */
  output_over_200k?: number;

  /** Cached input rate under 200K tokens */
  cached_input_under_200k?: number;

  /** Cached input rate over 200K tokens */
  cached_input_over_200k?: number;

  /** Text output rate for image models */
  output_text?: number;

  /** Image output cost at 512px resolution */
  output_image_512?: number;

  /** Image output cost at 1K resolution */
  output_image_1k?: number;

  /** Image output cost at 2K resolution */
  output_image_2k?: number;

  /** Image output cost at 4K resolution */
  output_image_4k?: number;

  /** Image output cost at 1K-2K resolution (combined tier) */
  output_image_1k_2k?: number;

  /** Flat per-image output cost regardless of resolution */
  output_image?: number;

  /** Video cost per second (for Veo) */
  video_per_second?: number;

  /** Video with audio cost per second */
  video_audio_per_second?: number;

  /** Video output cost per million tokens (for token-priced video models like Omni) */
  video_output?: number;

  /** TTS audio output cost (per million tokens) */
  audio_output?: number;

  /** Music generation cost (per song/clip) */
  music_per_song?: number;

  /** Music generation cost (per 30 seconds) */
  music_per_30sec?: number;
}

/**
 * Complete information about a model
 */
export interface ModelInfo {
  /** Human-readable model name */
  name: string;

  /** Model type ('text' or 'image') */
  type: GeminiModelType;

  /** Pricing information */
  pricing: ModelPricing;

  /** Currency for prices (always 'USD') */
  currency: string;

  /** Unit description (e.g., 'per_million_tokens') */
  unit: string;

  /** Supported thinking levels (for 3.x models) */
  thinkingLevels?: string[];

  /** Whether model supports thinkingBudget (for 2.5 models) */
  thinkingBudget?: boolean;

  /** Maximum output tokens */
  maxOutputTokens?: number;

  /** Maximum context window in tokens */
  contextWindow?: number;

  /** Supported image sizes (for image models) */
  imageSizes?: string[];

  /** Supported video resolutions (for Veo) */
  videoResolutions?: string[];

  /** Supported video aspect ratios (for Omni video) */
  videoAspectRatios?: string[];

  /** Supported video durations (for Veo) */
  videoDurations?: number[];

  /** Supported input/output modalities (for multimodal models like Omni) */
  modalities?: { input: string[]; output: string[] };

  /** Model knowledge cutoff (e.g. '2025-01') */
  knowledgeCutoff?: string;

  /** Model release date (e.g. '2026-06-30') */
  releaseDate?: string;

  /** Available voice names (for TTS) */
  voiceNames?: string[];

  /** Max duration in seconds (for music/video) */
  maxDurationSeconds?: number;
}

/**
 * Complete pricing data structure
 *
 * Loaded from pricing.json
 */
export interface PricingData {
  /** Map of model ID to model information */
  models: Record<string, ModelInfo>;

  /** Thinking level descriptions and multipliers */
  thinkingLevels: Record<string, { description: string; multiplier: number }>;
}

// =============================================================================
// RESULT TYPE ALIASES (for convenience and clarity)
// =============================================================================

/**
 * Extended text response with token tracking
 */
export interface TextResponseWithTokens extends GeminiTextResponse {
  /** Input tokens for cost tracking */
  inputTokens: number;
  /** Output tokens for cost tracking */
  outputTokens: number;
}

/**
 * Result type for image generation operations
 */
export type ImageResult = GeminiResult<GeminiImageResponse>;

/**
 * Result type for video generation operations
 */
export type VideoResult = GeminiResult<VeoResponse>;

/**
 * Result type for TTS generation operations
 */
export type TTSResult = GeminiResult<TTSResponse & { inputTokens: number; outputTokens: number }>;

/**
 * Result type for music generation operations
 */
export type MusicResult = GeminiResult<LyriaResponse>;
