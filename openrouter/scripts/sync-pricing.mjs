/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * Regenerate openrouter/pricing.json from the live OpenRouter catalog.
 *
 *   node openrouter/scripts/sync-pricing.mjs          # write pricing.json
 *   node openrouter/scripts/sync-pricing.mjs --check   # report drift, write nothing
 *
 * WHY THIS EXISTS
 * OpenRouter splits its catalog across three listings and prices each modality
 * in a different unit. Hand-maintaining that table goes stale silently and the
 * cost calculator then reports $0 for models it cannot find. This pulls the
 * truth instead:
 *
 *   text + audio  GET /models                              -> pricing per token
 *   image         GET /models?output_modalities=image      -> capabilities
 *                 GET /images/models/{id}/endpoints        -> pricing per image OR per token
 *   video         GET /models?output_modalities=video      -> capabilities + pricing_skus
 *
 * An API key is only needed for the per-model image endpoints; the listings are
 * public. Reads OPENROUTER_API_KEY or the first of OPENROUTER_API_KEYS.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'openrouter', 'pricing.json');
const API = 'https://openrouter.ai/api/v1';
const CHECK_ONLY = process.argv.includes('--check');

// Text models the kit actually routes to. Media models are taken wholesale from
// the catalog; text is curated because the catalog carries 400+ chat models.
const CURATED_TEXT = [
  'openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-4.1', 'openai/gpt-4.1-mini',
  'openai/gpt-4.1-nano', 'openai/o3', 'openai/o3-mini', 'openai/o4-mini',
  'openai/gpt-5.6-luna', 'openai/gpt-5.6-luna-pro',
  'anthropic/claude-sonnet-4', 'anthropic/claude-opus-4',
  'google/gemini-2.5-flash', 'google/gemini-2.5-pro',
  'meta-llama/llama-4-maverick', 'meta-llama/llama-4-scout',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-r1', 'deepseek/deepseek-chat',
  'deepseek/deepseek-v4-flash', 'deepseek/deepseek-v4-pro',
  'mistralai/mistral-large', 'qwen/qwen-2.5-72b-instruct',
  'minimax/minimax-m3', 'minimax/minimax-m2.7',
];

function loadKey() {
  const envPath = path.join(ROOT, '.env');
  let raw = '';
  try { raw = fs.readFileSync(envPath, 'utf8'); } catch { /* env vars only */ }
  const pick = (name) => {
    const m = raw.match(new RegExp(`^${name}=(.+)$`, 'm'));
    return m ? m[1].trim() : process.env[name];
  };
  const single = pick('OPENROUTER_API_KEY');
  if (single && !single.includes('your-key')) return single;
  const many = pick('OPENROUTER_API_KEYS');
  return many ? many.split(',')[0].trim() : undefined;
}

const KEY = loadKey();

async function get(url) {
  const headers = KEY ? { Authorization: `Bearer ${KEY}` } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${await res.text()}`);
  return res.json();
}

/** OpenRouter quotes token rates per single token; the kit stores per million. */
const perMillion = (v) => (v === undefined || v === null || v === '' ? undefined
  : Math.round(Number(v) * 1_000_000 * 1e6) / 1e6);

const clean = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== 0 && v !== '')
);

// -----------------------------------------------------------------------------
// TEXT + AUDIO (chat catalog)
// -----------------------------------------------------------------------------

function buildChatEntry(m) {
  const p = m.pricing || {};
  const out = m.architecture?.output_modalities || [];
  const isAudio = out.includes('audio');

  const pricing = clean({
    input: perMillion(p.prompt),
    output: perMillion(p.completion),
    audio_input: perMillion(p.audio),
    audio_output: perMillion(p.audio_output),
    cache_read: perMillion(p.input_cache_read),
    cache_write: perMillion(p.input_cache_write),
    reasoning: perMillion(p.internal_reasoning),
  });

  // Fall back to a price stated in prose (Lyria bills flat per song / per clip).
  let unit = 'per_million_tokens';
  let flatBasis;
  if (!Object.keys(pricing).length) {
    const prose = priceFromDescription(m.description);
    if (prose) {
      pricing.audio_per_generation = prose.amount;
      unit = `per_${prose.per}`;
      flatBasis = prose.quote;
    }
  }

  return {
    name: m.name,
    type: isAudio ? 'audio' : 'text',
    pricing,
    currency: 'USD',
    unit,
    priceSource: flatBasis ? `model description: "${flatBasis}"` : undefined,
    contextWindow: m.context_length || undefined,
    inputModalities: m.architecture?.input_modalities,
    outputModalities: out,
    supportedParameters: m.supported_parameters,
    // A published $0 rate means "not disclosed via the API", not "free".
    pricingUnavailable: Object.keys(pricing).length === 0 ? true : undefined,
  };
}

// -----------------------------------------------------------------------------
// IMAGE
// -----------------------------------------------------------------------------

/**
 * Image endpoints price either per finished image (optionally per resolution
 * variant) or per output-image token. Both shapes are flattened into one map:
 *   per image  -> image_per_image[_1k|_2k|_4k], input_image_per_image
 *   per token  -> image_output_per_million_tokens, input_image_per_million_tokens
 */
function buildImagePricing(rows = [], listingPricing = {}) {
  const pricing = {};
  let unit = 'per_image';
  for (const r of rows) {
    const variant = r.variant ? `_${String(r.variant).toLowerCase()}` : '';
    if (r.unit === 'image') {
      if (r.billable === 'output_image') pricing[`image_per_image${variant}`] = r.cost_usd;
      if (r.billable === 'input_image') pricing[`input_image_per_image${variant}`] = r.cost_usd;
      // Some models bill supplied fonts / style references separately.
      if (r.billable === 'input_font') pricing.input_font_per_image = r.cost_usd;
      if (r.billable === 'input_reference') pricing.input_reference_per_image = r.cost_usd;
    } else if (r.unit === 'token') {
      unit = 'per_output_image_token';
      if (r.billable === 'output_image') pricing.image_output_per_million_tokens = perMillion(r.cost_usd);
      if (r.billable === 'input_image') pricing.input_image_per_million_tokens = perMillion(r.cost_usd);
      if (r.billable === 'input_text') pricing.input_text_per_million_tokens = perMillion(r.cost_usd);
    } else if (r.unit === 'megapixel') {
      // The FLUX.2 family bills by output area rather than by image or token.
      unit = 'per_megapixel';
      if (r.billable === 'output_image') pricing.image_per_megapixel = r.cost_usd;
      if (r.billable === 'input_image') pricing.input_image_per_megapixel = r.cost_usd;
    }
  }

  // A few models (the Krea family) publish no endpoint rows at all but do carry
  // a token rate on the listing. Without this fallback they look unpriced.
  if (!Object.keys(pricing).length) {
    const tokenRate = listingPricing.image_output || listingPricing.image_token;
    if (tokenRate && tokenRate !== '0') {
      unit = 'per_output_image_token';
      pricing.image_output_per_million_tokens = perMillion(tokenRate);
    }
  }

  // Mixed shape (flat output + token inputs) still bills per image at the output.
  if (pricing.image_per_image || pricing.image_per_image_1k) unit = 'per_image';
  return { pricing, unit };
}

/**
 * Some models publish their real price only in prose — Lyria states
 * "Full-length songs are priced at $0.08 per song" while every structured
 * pricing field reads 0. Pull that out rather than reporting the model as free.
 */
function priceFromDescription(description = '') {
  const m = /\$([0-9]*\.?[0-9]+)\s*per\s+([a-z]+)/i.exec(description);
  if (!m) return undefined;
  return { amount: Number(m[1]), per: m[2].toLowerCase(), quote: m[0] };
}

function enumOf(params, name) {
  const p = params?.[name];
  return p?.type === 'enum' ? p.values : undefined;
}
function rangeMax(params, name) {
  const p = params?.[name];
  return p?.type === 'range' ? p.max : undefined;
}

// -----------------------------------------------------------------------------
// VIDEO
// -----------------------------------------------------------------------------

/**
 * Video SKUs come in four incompatible families. Rather than flatten them into
 * a lossy single rate, the raw sku map is preserved and tagged with the family
 * the cost calculator should use to resolve it.
 */
function videoFamily(skus = {}) {
  const keys = Object.keys(skus);
  if (keys.some(k => k.startsWith('video_tokens'))) return 'video_tokens';
  if (keys.some(k => k.startsWith('cents_per_video_output_second'))) return 'cents_per_second';
  if (keys.some(k => k.startsWith('cents_per_second'))) return 'cents_per_second';
  if (keys.some(k => k.startsWith('duration_seconds') || k.includes('duration_seconds'))) return 'usd_per_second';
  return 'unknown';
}

function buildVideoEntry(listed, meta) {
  const skus = meta?.pricing_skus || {};
  const family = videoFamily(skus);
  return {
    name: meta?.name || listed?.name,
    type: 'video',
    currency: 'USD',
    unit: family === 'video_tokens' ? 'per_video_token'
      : family === 'cents_per_second' ? 'cents_per_second'
        : family === 'usd_per_second' ? 'per_second' : 'unknown',
    pricingFamily: family,
    pricingSkus: skus,
    // Per-second families can be estimated before generating; token-billed
    // families cannot (token count is only known after the render).
    estimatable: family === 'usd_per_second' || family === 'cents_per_second',
    supportedResolutions: meta?.supported_resolutions || undefined,
    supportedAspectRatios: meta?.supported_aspect_ratios || undefined,
    supportedDurations: meta?.supported_durations || undefined,
    supportedSizes: meta?.supported_sizes || undefined,
    supportedFrameImages: meta?.supported_frame_images || undefined,
    supportsAudio: meta?.generate_audio ?? undefined,
    supportsSeed: meta?.seed ?? undefined,
    allowedPassthroughParameters: meta?.allowed_passthrough_parameters?.length
      ? meta.allowed_passthrough_parameters : undefined,
    inputModalities: listed?.architecture?.input_modalities,
    pricingUnavailable: Object.keys(skus).length === 0 ? true : undefined,
  };
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

async function main() {
  console.log('[sync-pricing] fetching OpenRouter catalogs…');
  const [chat, imageList, videoList, videoMeta] = await Promise.all([
    get(`${API}/models`),
    get(`${API}/models?output_modalities=image`),
    get(`${API}/models?output_modalities=video`),
    get(`${API}/videos/models`),
  ]);

  const chatById = new Map(chat.data.map(m => [m.id, m]));
  const videoMetaById = new Map(videoMeta.data.map(m => [m.id, m]));
  const models = {};
  const warnings = [];

  // --- text (curated) + audio (every chat model that emits audio) ---
  for (const id of CURATED_TEXT) {
    const m = chatById.get(id);
    if (!m) { warnings.push(`curated text model not in catalog: ${id}`); continue; }
    models[id] = buildChatEntry(m);
  }
  for (const m of chat.data) {
    const out = m.architecture?.output_modalities || [];
    if (out.includes('audio')) models[m.id] = buildChatEntry(m);
  }

  // --- image: capabilities from the listing, pricing from per-model endpoints ---
  for (const m of imageList.data) {
    if (m.id.startsWith('openrouter/auto')) continue; // router pseudo-model, price is -1
    let rows = [];
    let params = m.supported_parameters;
    let passthrough;
    try {
      const ep = await get(`${API}/images/models/${m.id}/endpoints`);
      const first = ep.endpoints?.[0];
      rows = first?.pricing || [];
      params = first?.supported_parameters || params;
      passthrough = first?.allowed_passthrough_parameters;
    } catch (e) {
      warnings.push(`image endpoints unavailable for ${m.id}: ${e.message.split('\n')[0]}`);
    }
    const { pricing, unit } = buildImagePricing(rows, m.pricing);
    models[m.id] = {
      name: m.name,
      type: 'image',
      pricing,
      currency: 'USD',
      unit,
      resolutions: enumOf(params, 'resolution'),
      aspectRatios: enumOf(params, 'aspect_ratio'),
      qualities: enumOf(params, 'quality'),
      backgrounds: enumOf(params, 'background'),
      outputFormats: enumOf(params, 'output_format'),
      maxImagesPerRequest: rangeMax(params, 'n'),
      maxInputReferences: rangeMax(params, 'input_references'),
      supportsSeed: params?.seed?.type === 'boolean' ? true : undefined,
      supportsStreaming: m.supports_streaming || undefined,
      allowedPassthroughParameters: passthrough?.length ? passthrough : undefined,
      inputModalities: m.architecture?.input_modalities,
      pricingUnavailable: Object.keys(pricing).length === 0 ? true : undefined,
    };
  }

  // --- video ---
  for (const m of videoList.data) {
    if (m.id.startsWith('openrouter/auto')) continue;
    models[m.id] = buildVideoEntry(m, videoMetaById.get(m.id));
  }
  for (const m of videoMeta.data) {
    if (!models[m.id]) models[m.id] = buildVideoEntry(undefined, m);
  }

  const byType = {};
  for (const v of Object.values(models)) byType[v.type] = (byType[v.type] || 0) + 1;
  const unpriced = Object.entries(models).filter(([, v]) => v.pricingUnavailable).map(([k]) => k);

  const payload = {
    lastVerified: new Date().toISOString().slice(0, 10),
    source: 'https://openrouter.ai/api/v1 (models, models?output_modalities=image|video, videos/models, images/models/{id}/endpoints)',
    generatedBy: 'openrouter/scripts/sync-pricing.mjs — do not hand-edit; re-run the script',
    counts: { total: Object.keys(models).length, ...byType },
    models: Object.fromEntries(Object.entries(models).sort(([a], [b]) => a.localeCompare(b))),
  };

  console.log(`[sync-pricing] ${payload.counts.total} models:`,
    Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(' '));
  if (unpriced.length) {
    console.log(`[sync-pricing] ${unpriced.length} model(s) publish no price via the API (cost must come from usage.cost):`);
    for (const id of unpriced) console.log(`    - ${id}`);
  }
  for (const w of warnings) console.log(`[sync-pricing] WARN ${w}`);

  if (CHECK_ONLY) {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const oldIds = new Set(Object.keys(old.models));
    const newIds = new Set(Object.keys(payload.models));
    const gone = [...oldIds].filter(i => !newIds.has(i));
    const added = [...newIds].filter(i => !oldIds.has(i));
    console.log(`[sync-pricing] --check: ${added.length} added, ${gone.length} removed`);
    if (gone.length) console.log('  removed:', gone.join(', '));
    process.exit(gone.length || added.length ? 1 : 0);
  }

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`[sync-pricing] wrote ${path.relative(ROOT, OUT)}`);
}

main().catch(e => { console.error('[sync-pricing] FAILED:', e.message); process.exit(1); });
