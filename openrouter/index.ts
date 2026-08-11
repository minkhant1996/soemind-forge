/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * OpenRouter Provider
 * ===================
 *
 * Access 100+ AI models through a unified API.
 *
 * Capabilities (model ids verified against the live catalog — regenerate with
 * `node openrouter/scripts/sync-pricing.mjs`):
 * - Text generation (GPT-5.x, Claude, Gemini, Llama, DeepSeek, …)
 * - Image generation (Seedream, Nano Banana, Qwen Image, GPT Image, Grok)
 * - Video generation (Veo 3.1, Seedance, Kling, Wan, Hailuo, FLUX.3, Runway)
 * - Speech + music (GPT Audio, Lyria 3) via chat completions
 * - Transcription — any chat model that accepts audio input
 *
 * @example
 * ```typescript
 * import {
 *   gpt4o,          // Text
 *   seedream,       // Image ($0.04 flat)
 *   veo31Fast,      // Video
 *   gptAudioMini,   // Speech
 *   geminiSTT       // Transcription
 * } from './openrouter';
 * ```
 */

// Main provider functions
export {
  // Core functions
  generateText,
  generateTextStream,
  chat,
  generateImage,
  generateVideo,
  downloadVideo,
  generateTTS,
  textToSpeech,
  transcribe,
  speechToText,
  // API key manager
  apiKeyManager,
  ApiKeyManager,
  // OpenAI text models
  gpt4o,
  gpt4oMini,
  gpt41,
  gpt41Mini,
  gpt41Nano,
  o3,
  o3Mini,
  gpt56Luna,
  // Anthropic text models
  claudeSonnet4,
  claudeOpus4,
  // Google text models
  gemini25Flash,
  gemini25Pro,
  // Meta text models
  llama4Maverick,
  llama4Scout,
  // DeepSeek text models
  deepseekR1,
  deepseekChat,
  deepseekV4Flash,
  // Mistral text models
  mistralLarge,
  // Qwen text models
  qwen25_72b,
  // MiniMax text models
  minimaxM3,
  minimaxM27,
  // Image models
  seedream,
  geminiProImage,
  geminiFlashImage,
  geminiFlashLiteImage,
  qwenImage3Pro,
  gptImage2,
  grokImage,
  // Video models
  veo31,
  veo31Fast,
  veo31Lite,
  seedance25,
  seedance20,
  seedance20Fast,
  klingV3Pro,
  klingV3Std,
  klingVideoO1,
  hailuo3,
  hailuo,
  wan27,
  wan26,
  flux3Video,
  aleph2,
  happyhorse11,
  happyhorse10,
  // Audio (speech / music) models
  gptAudio,
  gptAudioMini,
  lyria3Pro,
  lyria3Clip,
  // Transcription
  gptAudioMiniSTT,
  geminiSTT,
} from './openrouter-provider.js';

// Types
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
  VideoResolution,
  VideoAspectRatio,
  VideoFrameImage,
  CostCalculation,
  ModelInfo,
  ModelPricing,
  PricingData,
  VideoPricingFamily,
} from './openrouter-provider.js';

// Cost calculator
export {
  calculateTextCost,
  calculateVideoCost,
  calculateAudioCost,
  calculateTTSCost,
  calculateSTTCost,
  calculateImageCost,
  costFromApi,
  validateVideoRequest,
  validateImageRequest,
  getModelPricing,
  getAvailableModels,
  getTextModels,
  getVideoModels,
  getTTSModels,
  getSTTModels,
  getImageModels,
  getPricingMetadata,
  estimateCost,
  estimateAudioCost,
  estimateVideoCost,
  estimateSTTCost,
  estimateImageCost,
  formatCost,
} from './cost-calculator.js';

export type {
  ImageCostOptions,
  VideoCostOptions,
  ValidationIssue,
} from './cost-calculator.js';
