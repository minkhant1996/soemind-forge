/**
 * Gemini Cost Calculator
 * ======================
 *
 * Calculates costs based on token usage and model pricing.
 *
 * This module reads pricing data from pricing.json and provides functions
 * to calculate the cost of API calls based on actual token usage.
 *
 * PRICING MODEL:
 * - Gemini charges per million tokens
 * - Input tokens (prompt) and output tokens (response) have different rates
 * - Some models have tiered pricing (different rates over 200K tokens)
 * - Image generation charges per image based on resolution
 * - Video generation charges per second of video
 * - TTS charges per million output tokens
 * - Music generation charges per song/clip
 *
 * HOW TO UPDATE PRICING:
 * 1. Check current prices at: https://ai.google.dev/pricing
 * 2. Update values in pricing.json
 * 3. This calculator will automatically use the new prices
 *
 * @see https://ai.google.dev/pricing - Official Gemini pricing
 * @see ./pricing.json - Local pricing data
 */

// =============================================================================
// IMPORTS
// =============================================================================

/**
 * Import pricing data from JSON file
 *
 * Note: TypeScript doesn't automatically infer JSON structure,
 * so we cast it to PricingData for type safety.
 *
 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9.html#import-types
 */
import pricingData from './pricing.json';

import {
  GeminiModel,
  VeoModel,
  GeminiOmniModel,
  TTSModel,
  LyriaModel,
  TokenUsage,
  CostCalculation,
  PricingData,
  ImageSize,
} from './types';

/**
 * Cast imported JSON to typed PricingData
 *
 * This gives us type checking when accessing pricing.models[model]
 */
const pricing = pricingData as PricingData;

// =============================================================================
// MAIN COST CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate cost for text generation
 *
 * Computes the cost in USD based on:
 * - Model's pricing (from pricing.json)
 * - Number of input tokens used
 * - Number of output tokens generated
 *
 * PRICING FORMULA:
 * ```
 * cost = (tokens / 1,000,000) × rate_per_million
 * ```
 *
 * @param model - The Gemini model ID (e.g., 'gemini-2.5-flash')
 * @param usage - Token usage statistics from the API response
 * @returns Cost breakdown in USD
 *
 * @example
 * const cost = calculateTextCost('gemini-2.5-flash', {
 *   inputTokens: 1000,
 *   outputTokens: 500,
 *   totalTokens: 1500
 * });
 * // Returns: { inputCost: 0.0003, outputCost: 0.00125, totalCost: 0.00155, currency: 'USD' }
 *
 * @see https://ai.google.dev/pricing
 */
export function calculateTextCost(
  model: GeminiModel,
  usage: TokenUsage
): CostCalculation {
  // Look up model in pricing data
  const modelInfo = pricing.models[model];

  // If model not found, return zero cost (fail gracefully)
  // This prevents crashes if pricing.json is out of date
  if (!modelInfo) {
    console.warn(`[CostCalculator] Model '${model}' not found in pricing data`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const modelPricing = modelInfo.pricing;
  let inputRate: number;
  let outputRate: number;

  // ==========================================================================
  // DETERMINE PRICING TIER
  // ==========================================================================

  /**
   * Some models (like gemini-2.5-pro) have tiered pricing:
   * - Under 200K tokens: lower rate
   * - Over 200K tokens: higher rate
   *
   * We check which tier applies based on input token count.
   */
  if (modelPricing.input_under_200k !== undefined) {
    // ----- TIERED PRICING MODEL -----
    // Models like gemini-2.5-pro, gemini-3.1-pro-preview

    if (usage.inputTokens <= 200000) {
      // Under 200K threshold - use lower rates
      inputRate = modelPricing.input_under_200k;
      outputRate = modelPricing.output_under_200k || 0;
    } else {
      // Over 200K threshold - use higher rates
      // Fall back to under_200k rate if over_200k not specified
      inputRate = modelPricing.input_over_200k || modelPricing.input_under_200k;
      outputRate = modelPricing.output_over_200k || modelPricing.output_under_200k || 0;
    }
  } else {
    // ----- FLAT RATE PRICING MODEL -----
    // Models like gemini-2.5-flash, gemini-3.5-flash

    // Use 'input' for text models, or 0 if not specified
    inputRate = modelPricing.input || 0;

    // Use 'output' for text models, 'output_text' for image models
    outputRate = modelPricing.output || modelPricing.output_text || 0;
  }

  // ==========================================================================
  // CALCULATE COSTS
  // ==========================================================================

  /**
   * Cost formula: (tokens / 1,000,000) × rate_per_million
   *
   * Example with gemini-2.5-flash ($0.30/M input, $2.50/M output):
   * - 2000 input tokens:  (2000 / 1,000,000) × 0.30 = $0.0006
   * - 1000 output tokens: (1000 / 1,000,000) × 2.50 = $0.0025
   * - Total: $0.0031
   */
  const inputCost = (usage.inputTokens / 1_000_000) * inputRate;
  const outputCost = (usage.outputTokens / 1_000_000) * outputRate;

  /**
   * Round to 6 decimal places to avoid floating point precision issues
   *
   * Without rounding, you might get values like: 0.00030000000000000003
   * With rounding, you get clean values like:    0.0003
   *
   * We multiply by 1,000,000, round, then divide by 1,000,000
   */
  return {
    inputCost: Math.round(inputCost * 1_000_000) / 1_000_000,
    outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
    totalCost: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Calculate cost for image generation
 *
 * Image models charge:
 * - Per token for text input (same as text models)
 * - Per image for generated output (based on resolution)
 *
 * @param model - The Gemini image model ID
 * @param usage - Token usage (for input cost)
 * @param imageCount - Number of images generated
 * @param imageSize - Resolution of generated images (default: '1K')
 * @returns Cost breakdown in USD
 *
 * @example
 * const cost = calculateImageCost(
 *   'gemini-3.1-flash-image-preview',
 *   { inputTokens: 100, outputTokens: 0, totalTokens: 100 },
 *   2,    // 2 images generated
 *   '2K'  // at 2K resolution
 * );
 * // Returns cost for input tokens + 2 × $0.101 per image
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
export function calculateImageCost(
  model: GeminiModel,
  usage: TokenUsage,
  imageCount: number,
  imageSize: ImageSize = '1K'
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

  const modelPricing = modelInfo.pricing;

  // ==========================================================================
  // CALCULATE INPUT COST (tokens for the prompt)
  // ==========================================================================
  const inputRate = modelPricing.input || 0;
  const inputCost = (usage.inputTokens / 1_000_000) * inputRate;

  // ==========================================================================
  // CALCULATE OUTPUT COST (per-image pricing)
  // ==========================================================================

  /**
   * Image pricing varies by:
   * 1. Model (flash vs pro)
   * 2. Resolution (512, 1K, 2K, 4K)
   *
   * Pricing data structure:
   * - gemini-3.1-flash-image: separate prices for each size
   * - gemini-3-pro-image: 1K and 2K share a price, 4K is separate
   */
  let imageRate = 0;

  if (model === 'gemini-3.1-flash-lite-image') {
    // Lite image model has one flat rate regardless of resolution
    imageRate = modelPricing.output_image || 0; // $0.0336
  } else if (model === 'gemini-3.1-flash-image-preview') {
    // Flash image model has granular size pricing
    switch (imageSize) {
      case '512':
        imageRate = modelPricing.output_image_512 || 0; // $0.045
        break;
      case '1K':
        imageRate = modelPricing.output_image_1k || 0; // $0.067
        break;
      case '2K':
        imageRate = modelPricing.output_image_2k || 0; // $0.101
        break;
      case '4K':
        imageRate = modelPricing.output_image_4k || 0; // $0.15
        break;
    }
  } else if (model === 'gemini-3-pro-image-preview' || model === 'gemini-3-pro-image') {
    // Pro image model has combined 1K/2K tier
    if (imageSize === '4K') {
      imageRate = modelPricing.output_image_4k || 0; // $0.24
    } else {
      // 512, 1K, 2K all use the same rate
      imageRate = modelPricing.output_image_1k_2k || 0; // $0.134
    }
  }

  // Total output cost = number of images × rate per image
  const outputCost = imageCount * imageRate;

  return {
    inputCost: Math.round(inputCost * 1_000_000) / 1_000_000,
    outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
    totalCost: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Calculate cost for video generation (Veo)
 *
 * Video models charge per second of generated video.
 * Audio-enabled videos cost more.
 *
 * @param model - The Veo model ID
 * @param durationSeconds - Duration of generated video(s)
 * @param videoCount - Number of videos generated
 * @param includesAudio - Whether video includes generated audio
 * @returns Cost breakdown in USD
 *
 * @example
 * const cost = calculateVideoCost(
 *   'veo-3.1-lite-generate-preview',
 *   6,      // 6 seconds
 *   2,      // 2 videos
 *   false   // no audio
 * );
 * // Returns: 2 × 6 × $0.03 = $0.36
 *
 * @see https://ai.google.dev/gemini-api/docs/video
 */
export function calculateVideoCost(
  model: VeoModel,
  durationSeconds: number,
  videoCount: number = 1,
  includesAudio: boolean = false
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

  const modelPricing = modelInfo.pricing;

  // Select rate based on whether audio is included
  const perSecondRate = includesAudio
    ? (modelPricing.video_audio_per_second || modelPricing.video_per_second || 0)
    : (modelPricing.video_per_second || 0);

  // Total cost = duration × rate × number of videos
  const totalCost = durationSeconds * perSecondRate * videoCount;

  return {
    inputCost: 0, // Video generation doesn't have separate input cost
    outputCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Calculate cost for the Omni video model (Gemini Omni Flash)
 *
 * Unlike Veo (billed per second), Omni is token-priced:
 * - Input tokens (text/image/audio/video prompt): `input` rate ($1.50/M)
 * - Text/audio output tokens: `output` rate ($9.00/M)
 * - Video output tokens: `video_output` rate ($17.50/M)
 *
 * The API's usageMetadata reports how many output tokens are video vs. text/audio;
 * pass them split so each is billed at its own rate.
 *
 * @param model - The Omni model ID
 * @param usage - Token usage, with video output tokens separated out
 * @returns Cost breakdown in USD
 *
 * @example
 * const cost = calculateOmniCost('gemini-omni-flash-preview', {
 *   inputTokens: 1200,
 *   outputTokens: 500,        // text/audio output
 *   videoOutputTokens: 40000, // video output
 * });
 *
 * @see https://ai.google.dev/gemini-api/docs
 */
export function calculateOmniCost(
  model: GeminiOmniModel,
  usage: { inputTokens: number; outputTokens?: number; videoOutputTokens?: number }
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

  const modelPricing = modelInfo.pricing;

  const inputRate = modelPricing.input || 0; // $1.50/M
  const outputRate = modelPricing.output || 0; // $9.00/M (text/audio)
  const videoOutputRate = modelPricing.video_output || 0; // $17.50/M

  const inputCost = (usage.inputTokens / 1_000_000) * inputRate;
  const textOutputCost = ((usage.outputTokens || 0) / 1_000_000) * outputRate;
  const videoOutputCost = ((usage.videoOutputTokens || 0) / 1_000_000) * videoOutputRate;
  const outputCost = textOutputCost + videoOutputCost;

  return {
    inputCost: Math.round(inputCost * 1_000_000) / 1_000_000,
    outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
    totalCost: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

/**
 * Calculate cost for TTS (Text-to-Speech)
 *
 * TTS models charge:
 * - Per million input tokens (text prompt)
 * - Per million output tokens (audio generated)
 *
 * @param model - The TTS model ID
 * @param usage - Token usage from the API
 * @returns Cost breakdown in USD
 *
 * @example
 * const cost = calculateTTSCost(
 *   'gemini-2.5-flash-preview-tts',
 *   { inputTokens: 500, outputTokens: 2000, totalTokens: 2500 }
 * );
 *
 * @see https://ai.google.dev/gemini-api/docs/speech
 */
export function calculateTTSCost(
  model: TTSModel,
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

  const modelPricing = modelInfo.pricing;

  const inputRate = modelPricing.input || 0;
  const outputRate = modelPricing.audio_output || 0;

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
 * Calculate cost for music generation (Lyria)
 *
 * Music models charge per song/clip:
 * - lyria-3, lyria-2: Per 30-second clip
 * - lyria-3-pro: Per full song (up to 3 minutes)
 *
 * @param model - The Lyria model ID
 * @param clipCount - Number of clips/songs generated
 * @returns Cost breakdown in USD
 *
 * @example
 * const cost = calculateMusicCost('lyria-3', 2);
 * // Returns: 2 × $0.04 = $0.08
 *
 * @see https://ai.google.dev/gemini-api/docs/music
 */
export function calculateMusicCost(
  model: LyriaModel,
  clipCount: number = 1
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

  const modelPricing = modelInfo.pricing;

  // Use per-song or per-30sec rate depending on model
  const perClipRate = modelPricing.music_per_song || modelPricing.music_per_30sec || 0;
  const totalCost = clipCount * perClipRate;

  return {
    inputCost: 0, // Music generation doesn't have separate input cost
    outputCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get pricing information for a specific model
 *
 * Useful for displaying pricing to users or debugging.
 *
 * @param model - The Gemini model ID
 * @returns Model info including pricing, or undefined if not found
 *
 * @example
 * const info = getModelPricing('gemini-2.5-flash');
 * console.log(info?.pricing.input);  // 0.30
 * console.log(info?.pricing.output); // 2.50
 */
export function getModelPricing(model: GeminiModel) {
  return pricing.models[model];
}

/**
 * Get list of all available models
 *
 * @returns Array of model IDs from pricing.json
 *
 * @example
 * const models = getAvailableModels();
 * // ['gemini-2.5-flash', 'gemini-2.5-pro', ...]
 */
export function getAvailableModels() {
  return Object.keys(pricing.models);
}

/**
 * Get only text generation models
 *
 * Filters models where type === 'text'
 *
 * @returns Array of text model IDs
 */
export function getTextModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'text')
    .map(([model]) => model);
}

/**
 * Get only image generation models
 *
 * Filters models where type === 'image'
 *
 * @returns Array of image model IDs
 */
export function getImageModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'image')
    .map(([model]) => model);
}

/**
 * Get only video generation models (Veo)
 *
 * Filters models where type === 'video'
 *
 * @returns Array of video model IDs
 */
export function getVideoModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'video')
    .map(([model]) => model);
}

/**
 * Get only TTS models
 *
 * Filters models where type === 'audio'
 *
 * @returns Array of TTS model IDs
 */
export function getTTSModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'audio')
    .map(([model]) => model);
}

/**
 * Get only music generation models (Lyria)
 *
 * Filters models where type === 'music'
 *
 * @returns Array of music model IDs
 */
export function getMusicModels() {
  return Object.entries(pricing.models)
    .filter(([, info]) => info.type === 'music')
    .map(([model]) => model);
}

/**
 * Estimate cost before making an API call
 *
 * Useful for:
 * - Budgeting/cost projections
 * - Warning users about expensive operations
 * - Deciding whether to use a cheaper model
 *
 * @param model - The model to estimate for
 * @param estimatedInputTokens - Expected input tokens
 * @param estimatedOutputTokens - Expected output tokens
 * @returns Estimated cost breakdown
 *
 * @example
 * // Estimate cost for a typical AI Coach request
 * const estimate = estimateCost('gemini-2.5-flash', 2000, 1500);
 * console.log(`Estimated cost: $${estimate.totalCost}`);
 *
 * // Warn if expensive
 * if (estimate.totalCost > 0.10) {
 *   console.warn('This request may be expensive!');
 * }
 */
export function estimateCost(
  model: GeminiModel,
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
 * Estimate video generation cost
 *
 * @param model - The Veo model
 * @param durationSeconds - Expected duration
 * @param videoCount - Number of videos
 * @param includesAudio - Whether audio is included
 * @returns Estimated cost
 */
export function estimateVideoCost(
  model: VeoModel,
  durationSeconds: number,
  videoCount: number = 1,
  includesAudio: boolean = false
): CostCalculation {
  return calculateVideoCost(model, durationSeconds, videoCount, includesAudio);
}

/**
 * Format cost for human-readable display
 *
 * Handles both very small costs (< 1 cent) and larger costs.
 *
 * @param cost - The cost calculation to format
 * @returns Human-readable string
 *
 * @example
 * formatCost({ totalCost: 0.0031, ... })
 * // Returns: "$0.3100 cents"
 *
 * formatCost({ totalCost: 0.15, ... })
 * // Returns: "$0.150000 USD"
 */
export function formatCost(cost: CostCalculation): string {
  if (cost.totalCost < 0.01) {
    // Under 1 cent - show in cents for readability
    // $0.0031 → "0.31 cents"
    return `$${(cost.totalCost * 100).toFixed(4)} cents`;
  }
  // Over 1 cent - show in dollars
  return `$${cost.totalCost.toFixed(6)} ${cost.currency}`;
}

/**
 * Calculate cost breakdown as a percentage
 *
 * Useful for understanding where costs come from.
 *
 * @param cost - The cost calculation
 * @returns Object with percentages
 *
 * @example
 * const cost = { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 };
 * const breakdown = getCostBreakdown(cost);
 * // Returns: { inputPercent: 33.33, outputPercent: 66.67 }
 */
export function getCostBreakdown(cost: CostCalculation): {
  inputPercent: number;
  outputPercent: number;
} {
  if (cost.totalCost === 0) {
    return { inputPercent: 0, outputPercent: 0 };
  }

  return {
    inputPercent: Math.round((cost.inputCost / cost.totalCost) * 10000) / 100,
    outputPercent: Math.round((cost.outputCost / cost.totalCost) * 10000) / 100,
  };
}
