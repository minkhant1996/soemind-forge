/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * OpenRouter Cost Calculator
 * ==========================
 *
 * OpenRouter bills each modality in a different unit, so there is no single
 * rate to multiply. This module resolves the right unit per model:
 *
 *   text / audio   per million tokens (prompt, completion, audio in/out)
 *   image          per finished image (optionally per 1K/2K/4K variant)
 *                  OR per output-image token
 *   video          per second (USD or cents, often split by resolution,
 *                  audio on/off, and text-to-video vs image-to-video)
 *                  OR per video token, which cannot be known before rendering
 *
 * TWO NUMBERS, NEVER CONFLATED
 * - Estimate (`estimate*Cost`): computed from pricing.json BEFORE spending, for
 *   budget checks and user confirmation. Marked `source: 'estimate'`.
 * - Actual (`costFromApi`): the `usage.cost` OpenRouter returns with the
 *   response. This is what you were really billed — always prefer it when
 *   recording spend. Marked `source: 'api'`.
 *
 * A model with no published rate yields `source: 'unknown'` and `totalCost: 0`
 * with a note. Callers must treat that as "unknown", not as "free".
 *
 * HOW TO UPDATE PRICING
 *   node openrouter/scripts/sync-pricing.mjs           # refresh from the API
 *   node openrouter/scripts/sync-pricing.mjs --check   # report drift only
 *
 * @see https://openrouter.ai/docs
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
  ModelInfo,
} from './types.js';

const pricing = pricingData as unknown as PricingData;

const round = (n: number) => Math.round(n * 1_000_000) / 1_000_000;
const perM = (tokens: number, ratePerMillion: number | undefined) =>
  ((tokens || 0) / 1_000_000) * (ratePerMillion || 0);

function unknownCost(model: string, why: string): CostCalculation {
  return {
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    currency: 'USD',
    source: 'unknown',
    note: `${why} (model: ${model}). Cost is unknown — read usage.cost from the response instead.`,
  };
}

function lookup(model: string): ModelInfo | undefined {
  return pricing.models[model];
}

// =============================================================================
// ACTUAL COST (authoritative)
// =============================================================================

/**
 * Wrap the `usage.cost` OpenRouter returns. This is the amount actually billed
 * and should be what gets recorded to the project ledger.
 *
 * @param apiCost - `usage.cost` from the response, in USD
 * @param basis   - what produced it, for the audit trail
 */
export function costFromApi(apiCost: number | undefined | null, basis = 'usage.cost'): CostCalculation | undefined {
  if (typeof apiCost !== 'number' || Number.isNaN(apiCost)) return undefined;
  return {
    inputCost: 0,
    outputCost: round(apiCost),
    totalCost: round(apiCost),
    currency: 'USD',
    source: 'api',
    basis,
  };
}

// =============================================================================
// TEXT
// =============================================================================

/**
 * Calculate cost for text generation from real token usage.
 */
export function calculateTextCost(
  model: OpenRouterTextModel,
  usage: TokenUsage
): CostCalculation {
  const info = lookup(model);
  if (!info || !info.pricing) return unknownCost(model, 'Model not found in pricing data');

  const p = info.pricing;
  if (p.input === undefined && p.output === undefined) {
    return unknownCost(model, 'Model publishes no token rate');
  }

  const inputCost = perM(usage.inputTokens, p.input);
  const outputCost = perM(usage.outputTokens, p.output);

  return {
    inputCost: round(inputCost),
    outputCost: round(outputCost),
    totalCost: round(inputCost + outputCost),
    currency: info.currency,
    source: 'computed',
    basis: `input $${p.input ?? 0}/M + output $${p.output ?? 0}/M`,
  };
}

/**
 * Estimate cost before making a text call.
 */
export function estimateCost(
  model: OpenRouterTextModel,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): CostCalculation {
  const c = calculateTextCost(model, {
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
    totalTokens: estimatedInputTokens + estimatedOutputTokens,
  });
  return c.source === 'computed' ? { ...c, source: 'estimate' } : c;
}

// =============================================================================
// AUDIO (speech generation via chat completions)
// =============================================================================

/**
 * Audio tokens per second of speech, used only to turn a script into a
 * pre-flight estimate. Measured against gpt-audio-mini: a 2.35 s clip billed
 * ~63 audio tokens, i.e. ~27 tok/s; 28 leaves a little headroom.
 * The real figure comes back in `usage` — never record this as actual spend.
 */
const AUDIO_TOKENS_PER_SECOND = 28;

/**
 * Speaking rate for turning characters into seconds. Measured ~17 chars/s on
 * the same clip; 16 slightly over-states duration, which is the safe direction.
 */
const CHARS_PER_SECOND = 16;

/**
 * Calculate audio-generation cost from real token usage.
 *
 * Audio models bill text prompt tokens plus audio output tokens; when the
 * response separates them, pass `audioOutputTokens` for an exact figure.
 */
export function calculateAudioCost(
  model: OpenRouterTTSModel,
  usage: TokenUsage & { audioInputTokens?: number; audioOutputTokens?: number }
): CostCalculation {
  const info = lookup(model);
  if (!info || !info.pricing) return unknownCost(model, 'Model not found in pricing data');

  const p = info.pricing;

  // Flat per-generation billing (Lyria: $0.08/song, $0.04/30s clip).
  if (p.audio_per_generation !== undefined) {
    return {
      inputCost: 0,
      outputCost: round(p.audio_per_generation),
      totalCost: round(p.audio_per_generation),
      currency: info.currency,
      source: 'computed',
      basis: `$${p.audio_per_generation} ${info.unit.replace('per_', 'per ')}`,
    };
  }

  if (!p.input && !p.output && !p.audio_output) {
    return unknownCost(model, 'Model publishes no rate (OpenRouter reports $0 for it)');
  }

  // Audio output tokens are billed at the audio rate; whatever is left of the
  // completion is billed as text.
  const audioOut = usage.audioOutputTokens ?? usage.outputTokens;
  const textOut = usage.audioOutputTokens !== undefined
    ? Math.max(0, usage.outputTokens - usage.audioOutputTokens)
    : 0;

  const inputCost = perM(usage.inputTokens, p.input)
    + perM(usage.audioInputTokens || 0, p.audio_input);
  const outputCost = perM(audioOut, p.audio_output ?? p.output)
    + perM(textOut, p.output);

  return {
    inputCost: round(inputCost),
    outputCost: round(outputCost),
    totalCost: round(inputCost + outputCost),
    currency: info.currency,
    source: 'computed',
    basis: `audio out $${p.audio_output ?? p.output ?? 0}/M tokens`,
  };
}

/**
 * Estimate speech cost from the script text, before generating.
 */
export function estimateAudioCost(
  model: OpenRouterTTSModel,
  text: string
): CostCalculation {
  // Flat per-generation models do not depend on the script length at all, so
  // the exact rate stands as-is rather than being restated as a token guess.
  const info = lookup(model);
  if (info?.pricing?.audio_per_generation !== undefined) {
    return calculateAudioCost(model, { inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  }

  const seconds = text.length / CHARS_PER_SECOND;
  const audioTokens = Math.ceil(seconds * AUDIO_TOKENS_PER_SECOND);
  const promptTokens = Math.ceil(text.length / 4);

  const c = calculateAudioCost(model, {
    inputTokens: promptTokens,
    outputTokens: audioTokens,
    totalTokens: promptTokens + audioTokens,
    audioOutputTokens: audioTokens,
  });
  if (c.source !== 'computed') return c;
  return {
    ...c,
    source: 'estimate',
    basis: `${Math.round(seconds)}s speech ≈ ${audioTokens} audio tokens (assumed ${AUDIO_TOKENS_PER_SECOND} tok/s)`,
  };
}

/** @deprecated Speech is billed per token, not per character. Use estimateAudioCost. */
export function calculateTTSCost(
  model: OpenRouterTTSModel,
  characterCount: number
): CostCalculation {
  return estimateAudioCost(model, 'x'.repeat(Math.max(0, characterCount)));
}

// =============================================================================
// STT (transcription via chat completions)
// =============================================================================

/**
 * Calculate transcription cost.
 *
 * Transcription runs through a chat model that accepts audio input, so it is
 * billed on audio input tokens, not per minute.
 */
export function calculateSTTCost(
  model: OpenRouterSTTModel,
  durationMinutes: number,
  outputTokens = 0
): CostCalculation {
  const info = lookup(model);
  if (!info || !info.pricing) return unknownCost(model, 'Model not found in pricing data');

  const p = info.pricing;
  const audioTokens = Math.ceil(durationMinutes * 60 * AUDIO_TOKENS_PER_SECOND);
  if (!p.audio_input && !p.input) {
    return unknownCost(model, 'Model publishes no audio input rate');
  }

  const inputCost = perM(audioTokens, p.audio_input ?? p.input);
  const outputCost = perM(outputTokens, p.output);

  return {
    inputCost: round(inputCost),
    outputCost: round(outputCost),
    totalCost: round(inputCost + outputCost),
    currency: info.currency,
    source: 'computed',
    basis: `${durationMinutes.toFixed(2)} min ≈ ${audioTokens} audio tokens @ $${p.audio_input ?? p.input}/M`,
  };
}

export function estimateSTTCost(
  model: OpenRouterSTTModel,
  durationMinutes: number
): CostCalculation {
  const c = calculateSTTCost(model, durationMinutes);
  return c.source === 'computed' ? { ...c, source: 'estimate' } : c;
}

// =============================================================================
// IMAGE
// =============================================================================

/**
 * Output-image tokens per generated image, for models billed per token.
 *
 * Only used for pre-flight estimates; the actual count comes back in `usage`.
 * Measured against the live API where noted, otherwise a documented default.
 */
const IMAGE_OUTPUT_TOKENS: Record<string, number> = {
  // Measured: gemini-3.1-flash-lite-image at 1K returned 1120 output tokens.
  // 1290 is Google's documented figure for the family and slightly over-states
  // cost, which is the safe direction for a budget gate.
  default: 1290,
  '4k': 2000,
};

function imageTokensPerImage(resolution?: string): number {
  const r = (resolution || '').toLowerCase();
  return IMAGE_OUTPUT_TOKENS[r] ?? IMAGE_OUTPUT_TOKENS.default;
}

/**
 * Output area per resolution tier, for models billed by the megapixel.
 * Square-ish defaults; pass `megapixels` explicitly for an exact figure.
 */
const MEGAPIXELS_BY_RESOLUTION: Record<string, number> = {
  '512': 0.26,
  '1k': 1.05,
  '2k': 4.19,
  '4k': 16.78,
};

function megapixelsFor(resolution?: string): number {
  return MEGAPIXELS_BY_RESOLUTION[(resolution || '1k').toLowerCase()]
    ?? MEGAPIXELS_BY_RESOLUTION['1k'];
}

export interface ImageCostOptions {
  /** Number of images generated */
  imageCount?: number;
  /** Resolution requested — selects the price variant on per-image models */
  resolution?: string;
  /** How many reference images were supplied (billed on some models) */
  referenceCount?: number;
  /** Exact output area, for megapixel-billed models (overrides the resolution guess) */
  megapixels?: number;
  /** Real token usage, when the call has already happened */
  usage?: TokenUsage;
}

/**
 * Calculate image generation cost.
 *
 * Handles both billing shapes: a flat rate per finished image (with optional
 * 1K/2K/4K variants) and a per-output-token rate.
 */
export function calculateImageCost(
  model: OpenRouterImageModel,
  imageCountOrOptions: number | ImageCostOptions = 1,
  resolution?: string
): CostCalculation {
  const opts: ImageCostOptions = typeof imageCountOrOptions === 'number'
    ? { imageCount: imageCountOrOptions, resolution }
    : imageCountOrOptions;
  const count = opts.imageCount ?? 1;
  const res = (opts.resolution || '').toLowerCase();

  const info = lookup(model);
  if (!info || !info.pricing) return unknownCost(model, 'Model not found in pricing data');
  const p = info.pricing;

  if (info.pricingUnavailable) {
    return unknownCost(model, 'OpenRouter publishes no rate for this model');
  }

  // --- flat per-image, optionally per resolution variant ---
  const variantRate = res ? (p as Record<string, number | undefined>)[`image_per_image_${res}`] : undefined;
  const flatRate = variantRate ?? p.image_per_image;
  if (flatRate !== undefined) {
    const output = count * flatRate;
    const input = (opts.referenceCount || 0) * (p.input_image_per_image || 0);
    return {
      inputCost: round(input),
      outputCost: round(output),
      totalCost: round(input + output),
      currency: info.currency,
      source: opts.usage ? 'computed' : 'estimate',
      basis: `${count} × $${flatRate}/image${variantRate !== undefined ? ` (${res})` : ''}`
        + (input ? ` + ${opts.referenceCount} ref × $${p.input_image_per_image}` : ''),
    };
  }

  // --- per megapixel of output area (FLUX.2 family) ---
  if (p.image_per_megapixel !== undefined) {
    const mp = opts.megapixels ?? megapixelsFor(res);
    const output = count * mp * p.image_per_megapixel;
    const input = (opts.referenceCount || 0) * mp * (p.input_image_per_megapixel || 0);
    return {
      inputCost: round(input),
      outputCost: round(output),
      totalCost: round(input + output),
      currency: info.currency,
      source: 'estimate',
      basis: `${count} × ${mp}MP × $${p.image_per_megapixel}/MP`
        + (opts.megapixels === undefined ? ` (assumed ${mp}MP for ${res || '1k'})` : ''),
    };
  }

  // --- per output-image token ---
  if (p.image_output_per_million_tokens !== undefined) {
    const measured = opts.usage?.outputTokens;
    const tokens = measured ?? count * imageTokensPerImage(res);
    const outputCost = perM(tokens, p.image_output_per_million_tokens);
    const inputCost = perM(opts.usage?.inputTokens || 0,
      p.input_text_per_million_tokens ?? p.input_image_per_million_tokens);
    return {
      inputCost: round(inputCost),
      outputCost: round(outputCost),
      totalCost: round(inputCost + outputCost),
      currency: info.currency,
      source: measured !== undefined ? 'computed' : 'estimate',
      basis: `${tokens} output tokens @ $${p.image_output_per_million_tokens}/M`
        + (measured === undefined ? ` (assumed ${imageTokensPerImage(res)} tok/image)` : ''),
    };
  }

  return unknownCost(model, 'No per-image or per-token rate found');
}

export function estimateImageCost(
  model: OpenRouterImageModel,
  imageCountOrOptions: number | ImageCostOptions = 1,
  resolution?: string
): CostCalculation {
  return calculateImageCost(model, imageCountOrOptions, resolution);
}

// =============================================================================
// VIDEO
// =============================================================================

export interface VideoCostOptions {
  durationSeconds: number;
  /** Resolution tier, e.g. '720p', '1080p', '4K' */
  resolution?: string;
  /** Whether an audio track is generated (defaults to the model's default) */
  withAudio?: boolean;
  /** Whether a first/last frame or reference image drives the shot */
  imageToVideo?: boolean;
  /** Whether a source video is supplied (continuation / editing) */
  hasVideoInput?: boolean;
  /** Number of reference images, where they are billed separately */
  referenceImages?: number;
  /** Number of videos generated */
  videoCount?: number;
}

/**
 * Build SKU key candidates most-specific first, so a model that publishes both
 * `duration_seconds_without_audio_720p` and `duration_seconds` resolves to the
 * precise one.
 */
function skuCandidates(prefix: string, o: VideoCostOptions): string[] {
  const res = (o.resolution || '').toLowerCase().replace('k', 'k');
  const audio = o.withAudio === undefined ? '' : o.withAudio ? 'with_audio' : 'without_audio';
  const mode = o.imageToVideo ? 'image_to_video' : 'text_to_video';
  const out: string[] = [];

  if (res) out.push(`${mode}_${prefix}_${res}`);
  if (audio && res) out.push(`${prefix}_${audio}_${res}`);
  if (res) out.push(`${prefix}_${res}`);
  if (audio) out.push(`${prefix}_${audio}`);
  out.push(prefix);
  return out;
}

/**
 * Estimate video generation cost.
 *
 * Token-billed models (the Seedance family) cannot be estimated up front — the
 * video token count only exists after the render — so those return
 * `source: 'unknown'`. Read `usage.cost` off the completed job instead.
 */
export function calculateVideoCost(
  model: OpenRouterVideoModel,
  durationSecondsOrOptions: number | VideoCostOptions,
  videoCount = 1
): CostCalculation {
  const o: VideoCostOptions = typeof durationSecondsOrOptions === 'number'
    ? { durationSeconds: durationSecondsOrOptions, videoCount }
    : { videoCount, ...durationSecondsOrOptions };
  const count = o.videoCount ?? 1;
  const seconds = o.durationSeconds;

  const info = lookup(model);
  if (!info) return unknownCost(model, 'Model not found in pricing data');

  const skus = info.pricingSkus || {};
  if (!Object.keys(skus).length) {
    return unknownCost(model, 'OpenRouter publishes no SKU for this model');
  }

  const family = info.pricingFamily;
  const num = (k: string) => (skus[k] === undefined ? undefined : Number(skus[k]));

  // --- per video token: not knowable before the render ---
  if (family === 'video_tokens') {
    return {
      ...unknownCost(model, 'Billed per video token, which is only known after rendering'),
      basis: `video_tokens @ $${skus.video_tokens ?? '?'} per token`,
    };
  }

  // --- per second, in USD or cents ---
  const isCents = family === 'cents_per_second';
  const prefixes = isCents
    ? ['cents_per_video_output_second', 'cents_per_second_output', 'cents_per_second']
    : ['duration_seconds'];

  let rate: number | undefined;
  let usedKey = '';
  for (const prefix of prefixes) {
    for (const key of skuCandidates(prefix, o)) {
      const v = num(key);
      if (v !== undefined) { rate = v; usedKey = key; break; }
    }
    if (rate !== undefined) break;
  }

  if (rate === undefined) {
    return unknownCost(model, `No SKU matched (available: ${Object.keys(skus).join(', ')})`);
  }

  const perSecondUsd = isCents ? rate / 100 : rate;
  let total = seconds * perSecondUsd * count;

  // Surcharges published as their own SKUs.
  const extras: string[] = [];
  const refRate = num('reference_images');
  if (refRate && o.referenceImages) {
    total += refRate * o.referenceImages;
    extras.push(`${o.referenceImages} ref × $${refRate}`);
  }
  const inputImageCents = num('cents_per_image_input');
  if (inputImageCents && o.referenceImages) {
    total += (inputImageCents / 100) * o.referenceImages;
    extras.push(`${o.referenceImages} input img × ${inputImageCents}¢`);
  }

  // Some models bill a floor per generation regardless of length.
  const minCents = num('minimum_cents_per_generation');
  if (minCents !== undefined) {
    const floor = (minCents / 100) * count;
    if (total < floor) {
      return {
        inputCost: 0,
        outputCost: round(floor),
        totalCost: round(floor),
        currency: info.currency,
        source: 'estimate',
        basis: `minimum_cents_per_generation floor: ${minCents}¢ × ${count}`,
      };
    }
  }

  return {
    inputCost: 0,
    outputCost: round(total),
    totalCost: round(total),
    currency: info.currency,
    source: 'estimate',
    basis: `${seconds}s × $${perSecondUsd}/s via ${usedKey}`
      + (count > 1 ? ` × ${count}` : '')
      + (extras.length ? ` + ${extras.join(' + ')}` : ''),
  };
}

export function estimateVideoCost(
  model: OpenRouterVideoModel,
  durationSecondsOrOptions: number | VideoCostOptions,
  videoCount = 1
): CostCalculation {
  return calculateVideoCost(model, durationSecondsOrOptions, videoCount);
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationIssue {
  field: string;
  message: string;
}

/**
 * Check request options against what the model actually supports, so a bad
 * duration or resolution fails locally instead of after a paid round trip.
 */
export function validateVideoRequest(
  model: OpenRouterVideoModel,
  o: { durationSeconds?: number; resolution?: string; aspectRatio?: string; size?: string; frameTypes?: string[]; seed?: number }
): ValidationIssue[] {
  const info = lookup(model);
  const issues: ValidationIssue[] = [];
  if (!info) return [{ field: 'model', message: `Unknown model '${model}' — run sync-pricing.mjs or check the id` }];
  if (info.type !== 'video') issues.push({ field: 'model', message: `'${model}' is a ${info.type} model, not video` });

  const { supportedDurations, supportedResolutions, supportedAspectRatios, supportedSizes, supportedFrameImages } = info;
  if (o.durationSeconds !== undefined && supportedDurations?.length && !supportedDurations.includes(o.durationSeconds)) {
    issues.push({ field: 'durationSeconds', message: `${o.durationSeconds}s not supported — allowed: ${supportedDurations.join(', ')}` });
  }
  if (o.resolution && supportedResolutions?.length && !supportedResolutions.includes(o.resolution)) {
    issues.push({ field: 'resolution', message: `'${o.resolution}' not supported — allowed: ${supportedResolutions.join(', ')}` });
  }
  if (o.aspectRatio && supportedAspectRatios?.length && !supportedAspectRatios.includes(o.aspectRatio)) {
    issues.push({ field: 'aspectRatio', message: `'${o.aspectRatio}' not supported — allowed: ${supportedAspectRatios.join(', ')}` });
  }
  if (o.size && supportedSizes?.length && !supportedSizes.includes(o.size)) {
    issues.push({ field: 'size', message: `'${o.size}' not supported — allowed: ${supportedSizes.join(', ')}` });
  }
  for (const ft of o.frameTypes || []) {
    if (supportedFrameImages?.length && !supportedFrameImages.includes(ft)) {
      issues.push({ field: 'frameImages', message: `'${ft}' not supported — allowed: ${supportedFrameImages.join(', ') || 'none'}` });
    }
  }
  if (o.seed !== undefined && info.supportsSeed === false) {
    issues.push({ field: 'seed', message: `'${model}' ignores seed` });
  }
  return issues;
}

/**
 * Check image request options against the model's published capabilities.
 */
export function validateImageRequest(
  model: OpenRouterImageModel,
  o: { resolution?: string; aspectRatio?: string; n?: number; inputReferences?: number; quality?: string; background?: string }
): ValidationIssue[] {
  const info = lookup(model);
  const issues: ValidationIssue[] = [];
  if (!info) return [{ field: 'model', message: `Unknown model '${model}' — run sync-pricing.mjs or check the id` }];
  if (info.type !== 'image') issues.push({ field: 'model', message: `'${model}' is a ${info.type} model, not image` });

  if (o.resolution && info.resolutions?.length && !info.resolutions.includes(o.resolution)) {
    issues.push({ field: 'resolution', message: `'${o.resolution}' not supported — allowed: ${info.resolutions.join(', ')}` });
  }
  if (o.aspectRatio && info.aspectRatios?.length && !info.aspectRatios.includes(o.aspectRatio)) {
    issues.push({ field: 'aspectRatio', message: `'${o.aspectRatio}' not supported — allowed: ${info.aspectRatios.join(', ')}` });
  }
  if (o.n !== undefined && info.maxImagesPerRequest !== undefined && o.n > info.maxImagesPerRequest) {
    issues.push({ field: 'n', message: `${o.n} exceeds max ${info.maxImagesPerRequest} for this model` });
  }
  if (o.inputReferences !== undefined && info.maxInputReferences !== undefined && o.inputReferences > info.maxInputReferences) {
    issues.push({ field: 'inputReferences', message: `${o.inputReferences} exceeds max ${info.maxInputReferences}` });
  }
  if (o.quality && info.qualities?.length && !info.qualities.includes(o.quality)) {
    issues.push({ field: 'quality', message: `'${o.quality}' not supported — allowed: ${info.qualities.join(', ')}` });
  }
  if (o.background && info.backgrounds?.length && !info.backgrounds.includes(o.background)) {
    issues.push({ field: 'background', message: `'${o.background}' not supported — allowed: ${info.backgrounds.join(', ')}` });
  }
  return issues;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getModelPricing(model: string) {
  return pricing.models[model];
}

export function getAvailableModels() {
  return Object.keys(pricing.models);
}

const byType = (t: string) => Object.entries(pricing.models)
  .filter(([, info]) => info.type === t)
  .map(([model]) => model);

export const getTextModels = () => byType('text');
export const getVideoModels = () => byType('video');
export const getImageModels = () => byType('image');
export const getTTSModels = () => byType('audio');

/** Models that accept audio input, usable for transcription. */
export const getSTTModels = () => Object.entries(pricing.models)
  .filter(([, info]) => info.inputModalities?.includes('audio'))
  .map(([model]) => model);

/** When the catalog was last pulled, for staleness checks. */
export const getPricingMetadata = () => ({
  lastVerified: pricing.lastVerified,
  source: pricing.source,
  counts: pricing.counts,
});

/**
 * Format cost for display.
 */
export function formatCost(cost: CostCalculation): string {
  if (cost.source === 'unknown') return 'cost unknown';
  const amount = cost.totalCost < 0.01
    ? `$${cost.totalCost.toFixed(6)}`
    : `$${cost.totalCost.toFixed(4)}`;
  const tag = cost.source === 'api' ? '' : cost.source === 'estimate' ? ' (est.)' : '';
  return `${amount} ${cost.currency}${tag}`;
}
