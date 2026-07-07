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
 * Capabilities:
 * - Text generation (GPT-4, Claude, Gemini, Llama, etc.)
 * - Image generation (FLUX, DALL-E, Seedream, Gemini)
 * - Video generation (Seedance)
 * - TTS - Text-to-Speech (Kokoro, ElevenLabs, OpenAI, etc.)
 * - STT - Speech-to-Text (Whisper, Chirp, Parakeet)
 *
 * @example
 * ```typescript
 * import {
 *   gpt4o,        // Text
 *   fluxSchnell,  // Image (cheapest)
 *   seedance20,   // Video
 *   kokoro,       // TTS
 *   whisperSTT    // STT
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
  // Anthropic text models
  claudeSonnet4,
  claudeOpus4,
  claudeHaiku35,
  // Google text models
  gemini25Flash,
  gemini25Pro,
  // Meta text models
  llama4Maverick,
  llama4Scout,
  // DeepSeek text models
  deepseekR1,
  deepseekChat,
  // Mistral text models
  mistralLarge,
  mistralSmall,
  // Qwen text models
  qwen25_72b,
  // MiniMax text models
  minimaxM3,
  minimaxM27,
  // Image models
  seedream,
  geminiProImage,
  geminiFlashImage,
  fluxPro,
  fluxSchnell,
  dalle3,
  sdxl,
  // Video models
  seedance20,
  seedance20Fast,
  hailuo,
  // TTS models
  kokoro,
  grokTTS,
  geminiTTS,
  openaiTTS,
  openaiTTSHD,
  elevenLabsTTS,
  // STT models
  parakeetSTT,
  chirpSTT,
  whisperSTT,
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
} from './openrouter-provider.js';

// Cost calculator
export {
  calculateTextCost,
  calculateVideoCost,
  calculateTTSCost,
  calculateSTTCost,
  calculateImageCost,
  getModelPricing,
  getAvailableModels,
  getTextModels,
  getVideoModels,
  getTTSModels,
  getSTTModels,
  getImageModels,
  estimateCost,
  estimateVideoCost,
  estimateSTTCost,
  estimateImageCost,
  formatCost,
} from './cost-calculator.js';
