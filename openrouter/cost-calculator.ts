/**
 * OpenRouter Cost Calculator
 * ==========================
 *
 * Calculates costs based on token usage and model pricing.
 *
 * PRICING MODEL:
 * - Text models: per million tokens (input/output)
 * - Video models: per second of video
 *
 * HOW TO UPDATE PRICING:
 * 1. Check current prices at: https://openrouter.ai/models
 * 2. Update values in pricing.json
 * 3. This calculator will automatically use the new prices
 *
 * @see https://openrouter.ai/models - OpenRouter pricing
 */

import pricingData from './pricing.json' with { type: 'json' };
import {
  OpenRouterTextModel,
  OpenRouterVideoModel,
  OpenRouterTTSModel,
  OpenRouterSTTModel,
  OpenRouterImageModel,
  TokenUsage,
  CostCalculation,
  PricingData,
} from './types.js';

const pricing = pricingData as PricingData;

// =============================================================================
// COST CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate cost for text generation
 *
 * @param model - The model ID
 * @param usage - Token usage statistics
 * @returns Cost breakdown in USD
 */
export function calculateTextCost(
  model: OpenRouterTextModel,
  usage: TokenUsage
): CostCalculation {
  const modelInfo = pricing.models[model];

  if (!modelInfo) {
    console.warn(`[CostCalculator] Model '${model}' not found in pricing data`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const inputRate = modelInfo.pricing.input || 0;
  const outputRate = modelInfo.pricing.output || 0;

  const inputCost = (usage.inputTokens / 1_000_000) * inputRate;
  const outputCost = (usage.outputTokens / 1_000_000) * outputRate;

  return {
    inputCost: Math.round(inputCost * 1_000_000) / 1_000_000,
    outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
    totalCost: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Calculate cost for video generation
 *
 * @param model - The video model ID
 * @param durationSeconds - Video duration in seconds
 * @param videoCount - Number of videos generated
 * @returns Cost breakdown in USD
 */
export function calculateVideoCost(
  model: OpenRouterVideoModel,
  durationSeconds: number,
  videoCount: number = 1
): CostCalculation {
  const modelInfo = pricing.models[model];

  if (!modelInfo) {
    console.warn(`[CostCalculator] Model '${model}' not found in pricing data`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const perSecondRate = modelInfo.pricing.video_per_second || 0;
  const totalCost = durationSeconds * perSecondRate * videoCount;

  return {
    inputCost: 0,
    outputCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Calculate cost for TTS generation
 *
 * @param model - The TTS model ID
 * @param characterCount - Number of characters in input text
 * @returns Cost breakdown in USD
 */
export function calculateTTSCost(
  model: OpenRouterTTSModel,
  characterCount: number
): CostCalculation {
  const modelInfo = pricing.models[model];

  if (!modelInfo) {
    console.warn(`[CostCalculator] Model '${model}' not found in pricing data`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  // Some TTS models charge per character
  if (modelInfo.pricing.audio_per_million_chars) {
    const rate = modelInfo.pricing.audio_per_million_chars;
    const totalCost = (characterCount / 1_000_000) * rate;

    return {
      inputCost: Math.round(totalCost * 1_000_000) / 1_000_000,
      outputCost: 0,
      totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
      currency: modelInfo.currency,
    };
  }

  // Some TTS models charge per token (like Gemini)
  if (modelInfo.pricing.input && modelInfo.pricing.audio_output) {
    // Approximate: 1 token ≈ 4 characters
    const inputTokens = Math.ceil(characterCount / 4);
    const outputTokens = inputTokens * 2; // Estimate output tokens

    const inputCost = (inputTokens / 1_000_000) * modelInfo.pricing.input;
    const outputCost = (outputTokens / 1_000_000) * modelInfo.pricing.audio_output;

    return {
      inputCost: Math.round(inputCost * 1_000_000) / 1_000_000,
      outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
      totalCost: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
      currency: modelInfo.currency,
    };
  }

  return {
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    currency: 'USD',
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get pricing information for a model
 */
export function getModelPricing(model: string) {
  return pricing.models[model];
}

/**
 * Get list of all available models
 */
export function getAvailableModels() {
  return Object.keys(pricing.models);
}

/**
 * Get only text models
 */
export function getTextModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'text')
    .map(([model]) => model);
}

/**
 * Get only video models
 */
export function getVideoModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'video')
    .map(([model]) => model);
}

/**
 * Get only TTS/audio models
 */
export function getTTSModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'audio')
    .map(([model]) => model);
}

/**
 * Get only STT models
 */
export function getSTTModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'stt')
    .map(([model]) => model);
}

/**
 * Calculate cost for STT transcription
 *
 * @param model - The STT model ID
 * @param durationMinutes - Audio duration in minutes
 * @returns Cost breakdown in USD
 */
export function calculateSTTCost(
  model: OpenRouterSTTModel,
  durationMinutes: number
): CostCalculation {
  const modelInfo = pricing.models[model];

  if (!modelInfo) {
    console.warn(`[CostCalculator] Model '${model}' not found in pricing data`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const rate = modelInfo.pricing.stt_per_minute || 0;
  const totalCost = durationMinutes * rate;

  return {
    inputCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    outputCost: 0,
    totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Estimate STT cost
 */
export function estimateSTTCost(
  model: OpenRouterSTTModel,
  durationMinutes: number
): CostCalculation {
  return calculateSTTCost(model, durationMinutes);
}

/**
 * Get only image models
 */
export function getImageModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'image')
    .map(([model]) => model);
}

/**
 * Calculate cost for image generation
 *
 * @param model - The image model ID
 * @param imageCount - Number of images generated
 * @param resolution - Image resolution (for models with variable pricing)
 * @returns Cost breakdown in USD
 */
export function calculateImageCost(
  model: OpenRouterImageModel,
  imageCount: number = 1,
  resolution?: string
): CostCalculation {
  const modelInfo = pricing.models[model];

  if (!modelInfo) {
    console.warn(`[CostCalculator] Model '${model}' not found in pricing data`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  let totalCost = 0;

  // Check for per-image pricing
  if (modelInfo.pricing.image_per_image) {
    totalCost = imageCount * modelInfo.pricing.image_per_image;
  }
  // Check for resolution-based pricing (DALL-E)
  else if (modelInfo.pricing.image_1024 || modelInfo.pricing.image_1792) {
    const is1792 = resolution && (resolution.includes('1792') || resolution === '2K' || resolution === '4K');
    const rate = is1792
      ? (modelInfo.pricing.image_1792 || modelInfo.pricing.image_1024 || 0)
      : (modelInfo.pricing.image_1024 || 0);
    totalCost = imageCount * rate;
  }
  // Token-based pricing (Gemini)
  else if (modelInfo.pricing.input && modelInfo.pricing.output) {
    // Rough estimate: ~500 input tokens, ~1000 output tokens per image
    const inputTokens = 500 * imageCount;
    const outputTokens = 1000 * imageCount;
    const inputCost = (inputTokens / 1_000_000) * modelInfo.pricing.input;
    const outputCost = (outputTokens / 1_000_000) * modelInfo.pricing.output;
    totalCost = inputCost + outputCost;
  }

  return {
    inputCost: 0,
    outputCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Estimate image cost
 */
export function estimateImageCost(
  model: OpenRouterImageModel,
  imageCount: number = 1,
  resolution?: string
): CostCalculation {
  return calculateImageCost(model, imageCount, resolution);
}

/**
 * Estimate cost before making an API call
 */
export function estimateCost(
  model: OpenRouterTextModel,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): CostCalculation {
  return calculateTextCost(model, {
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
    totalTokens: estimatedInputTokens + estimatedOutputTokens,
  });
}

/**
 * Estimate video cost
 */
export function estimateVideoCost(
  model: OpenRouterVideoModel,
  durationSeconds: number,
  videoCount: number = 1
): CostCalculation {
  return calculateVideoCost(model, durationSeconds, videoCount);
}

/**
 * Format cost for display
 */
export function formatCost(cost: CostCalculation): string {
  if (cost.totalCost < 0.01) {
    return `$${(cost.totalCost * 100).toFixed(4)} cents`;
  }
  return `$${cost.totalCost.toFixed(6)} ${cost.currency}`;
}
