# Gemini Code Library

TypeScript library for Google Gemini AI APIs.

> **For project documentation**, see the parent folder's [README.md](../README.md) and [USER_GUIDE.md](../USER_GUIDE.md).

---

## Quick Start

```typescript
import { gemini25Flash, gemini31FlashImage, veo31Lite, textToSpeech, generateMusic } from './index';

// Text generation
const text = await gemini25Flash({ userPrompt: 'Explain quantum computing' });

// Image generation
const image = await gemini31FlashImage({ userPrompt: 'A sunset over mountains' });

// Video generation
const video = await veo31Lite('Ocean waves on a beach');

// Text-to-Speech
const audio = await textToSpeech('Hello world!', 'Zephyr');

// Music generation
const music = await generateMusic({ model: 'lyria-3', prompt: 'Upbeat electronic' });
```

**Requires**: `GEMINI_API_KEY` in root `.env` file.

---

## API Key Rotation (Rate Limit Fallback)

For high-volume usage, you can configure multiple API keys that automatically rotate when one hits rate limits:

```env
# .env file - comma-separated keys for rotation
GEMINI_API_KEYS=key1,key2,key3

# Or single key (backwards compatible)
GEMINI_API_KEY=your-single-key
```

**How it works:**
- When a request hits a 429 (rate limit) error, it automatically retries with the next available key
- Rate-limited keys have a 60-second cooldown before becoming available again
- All generation functions (text, image, video, TTS, music) support automatic key rotation

**Programmatic access:**
```typescript
import { apiKeyManager } from './index';

// Check key statistics
const stats = apiKeyManager.getStats();
console.log(`Available: ${stats.availableKeys}/${stats.totalKeys}`);

// Reset all rate limits (for testing)
apiKeyManager.resetRateLimits();
```

---

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Main exports |
| `gemini-provider.ts` | Core implementation |
| `types.ts` | TypeScript types |
| `cost-calculator.ts` | Cost tracking |
| `pricing.json` | Model pricing |
| `AGENT_TOOL_SPEC.md` | Full API documentation |
| `GETTING_STARTED.md` | Developer setup guide |

---

# Technical Documentation

> The sections below contain detailed code documentation for developers.

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [types.ts - Type Definitions](#typests---type-definitions)
4. [pricing.json - Model Pricing Data](#pricingjson---model-pricing-data)
5. [cost-calculator.ts - Cost Calculation](#cost-calculatorts---cost-calculation)
6. [gemini-provider.ts - Main Provider](#gemini-providerts---main-provider)
7. [index.ts - Exports](#indexts---exports)
8. [References & Links](#references--links)

---

## Overview

This module provides a unified interface for all Google Gemini AI models with:
- Automatic token usage tracking
- Cost calculation per request
- Support for text, image, and streaming generation
- Type-safe TypeScript interfaces

**Package Used:** `@google/genai` (Google's official Gemini SDK)
- NPM: https://www.npmjs.com/package/@google/genai
- Documentation: https://ai.google.dev/gemini-api/docs

---

## File Structure

```
gemini/
├── README.md           # This documentation file
├── index.ts            # Main exports (public API)
├── gemini-provider.ts  # Core implementation
├── types.ts            # TypeScript type definitions
├── cost-calculator.ts  # Token cost calculations
└── pricing.json        # Model pricing data
```

---

## types.ts - Type Definitions

This file defines all TypeScript types used throughout the Gemini provider.

```typescript
/**
 * Gemini Provider Types
 * Type definitions for all Gemini API interactions
 */
```
> Standard JSDoc comment describing the file purpose.

---

### ThinkingLevel Enum

```typescript
// Thinking levels for Gemini 3.x models
export enum ThinkingLevel {
  MINIMAL = 'MINIMAL',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}
```

**Purpose:** Gemini 3.x models support "thinking" - internal reasoning before responding.

| Level | Description | When to Use |
|-------|-------------|-------------|
| MINIMAL | Fastest, almost no reasoning | Simple lookups, greetings |
| LOW | Light reasoning | Basic Q&A |
| MEDIUM | Balanced | General use (recommended) |
| HIGH | Deep reasoning | Complex analysis, coding |

**Reference:**
- https://ai.google.dev/gemini-api/docs/thinking
- https://cloud.google.com/vertex-ai/generative-ai/docs/thinking

---

### ImageSize Type

```typescript
// Image sizes for image generation
export type ImageSize = '512' | '1K' | '2K' | '4K';
```

**Purpose:** Defines valid image output resolutions for image generation models.

| Size | Approximate Resolution | Use Case |
|------|------------------------|----------|
| 512 | ~0.25 megapixels | Thumbnails, previews |
| 1K | ~1 megapixel | Web images |
| 2K | ~4 megapixels | High quality |
| 4K | ~16 megapixels | Print, large displays |

**Reference:** https://ai.google.dev/gemini-api/docs/image-generation

---

### Model Type Definitions

```typescript
// Model types
export type GeminiModelType = 'text' | 'image';
```
> Categorizes models by their primary output type.

```typescript
// Available text models
export type GeminiTextModel =
  | 'gemini-3.5-flash'        // Latest fast model with thinking
  | 'gemini-3.1-flash-lite'   // Budget option for simple tasks
  | 'gemini-3-flash-preview'  // Preview of Gemini 3 flash
  | 'gemini-3.1-pro-preview'  // Highest quality model
  | 'gemini-2.5-flash'        // Stable, cost-effective (recommended)
  | 'gemini-2.5-flash-lite'   // Cheapest option
  | 'gemini-2.5-pro';         // Premium quality
```
> Union type of all valid text model IDs. Using a union type ensures TypeScript will catch typos.

```typescript
// Available image models
export type GeminiImageModel =
  | 'gemini-3.1-flash-image-preview'  // Fast image generation
  | 'gemini-3-pro-image-preview';     // High quality images
```
> Union type for image generation models.

```typescript
// All models combined
export type GeminiModel = GeminiTextModel | GeminiImageModel;
```
> Combined type for any Gemini model.

**Reference:**
- Model list: https://ai.google.dev/gemini-api/docs/models/gemini
- Vertex AI models: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models

---

### Input Interfaces

```typescript
// Base input for all Gemini calls
export interface GeminiBaseInput {
  systemPrompt?: string;      // Instructions for how the model should behave
  userPrompt: string;         // The actual user message/question (required)
  imageInput?: Buffer | string; // Image data as Buffer or base64 string
  imageMimeType?: string;     // MIME type like 'image/jpeg', 'image/png'
  audioInput?: Buffer | string; // Audio data as Buffer or base64 string
  audioMimeType?: string;     // MIME type like 'audio/mp3', 'audio/wav'
}
```

**systemPrompt:**
- Sets the model's behavior, personality, and constraints
- Example: "You are a helpful startup coach. Be concise."
- Reference: https://ai.google.dev/gemini-api/docs/system-instructions

**userPrompt:**
- The actual question or task from the user
- This is the only required field

**imageInput / audioInput:**
- Multimodal input support
- Can be a Node.js Buffer or base64-encoded string
- Reference: https://ai.google.dev/gemini-api/docs/vision
- Reference: https://ai.google.dev/gemini-api/docs/audio

---

### Configuration Interfaces

```typescript
// Configuration for text generation
export interface GeminiTextConfig {
  temperature?: number;       // 0.0-2.0, controls randomness
  topP?: number;              // 0.0-1.0, nucleus sampling threshold
  topK?: number;              // 1-100, limits token candidates
  maxOutputTokens?: number;   // Maximum response length
  stopSequences?: string[];   // Strings that stop generation
  thinkingLevel?: ThinkingLevel; // For Gemini 3.x models
  thinkingBudget?: number;    // For Gemini 2.5 models (-1 = unlimited)
  enableUrlContext?: boolean; // Enable web grounding/search
}
```

**temperature:**
- Controls randomness/creativity
- 0.0 = deterministic (same input → same output)
- 1.0 = balanced (default)
- 2.0 = highly creative/random
- Reference: https://ai.google.dev/gemini-api/docs/models/generative-models#model-parameters

**topP (nucleus sampling):**
- Filters tokens by cumulative probability
- 0.9 means: consider tokens until their probabilities sum to 90%
- Lower = more focused, higher = more diverse
- Reference: https://arxiv.org/abs/1904.09751

**topK:**
- Only consider the top K most likely tokens
- Lower = more focused, higher = more diverse
- Often used with topP

**maxOutputTokens:**
- Limits response length
- 1 token ≈ 4 characters or ¾ of a word
- Reference: https://ai.google.dev/gemini-api/docs/tokens

**stopSequences:**
- Array of strings that stop generation when encountered
- Example: `['END', '---']` stops when model outputs "END" or "---"

**thinkingLevel vs thinkingBudget:**
- Gemini 3.x uses `thinkingLevel` (enum: MINIMAL/LOW/MEDIUM/HIGH)
- Gemini 2.5 uses `thinkingBudget` (number: -1 for unlimited, 0 for none)
- These control how much "reasoning" the model does before responding

**enableUrlContext:**
- Enables web search/grounding
- Model can fetch real-time information from the web
- Reference: https://ai.google.dev/gemini-api/docs/grounding

---

### Token Usage Interface

```typescript
// Token usage tracking
export interface TokenUsage {
  inputTokens: number;   // Tokens in the prompt (you pay for these)
  outputTokens: number;  // Tokens in the response (you pay for these)
  totalTokens: number;   // Sum of input + output
}
```

**Why track tokens?**
- Billing is based on token usage
- Input and output tokens have different prices
- Helps monitor costs and optimize prompts

**Reference:** https://ai.google.dev/gemini-api/docs/tokens

---

### Cost Calculation Interface

```typescript
// Cost calculation result
export interface CostCalculation {
  inputCost: number;   // Cost for input tokens in USD
  outputCost: number;  // Cost for output tokens in USD
  totalCost: number;   // Total cost in USD
  currency: string;    // Always 'USD'
}
```

**Purpose:** Provides cost breakdown for each API call.

---

### Response Interfaces

```typescript
// Response from text generation
export interface GeminiTextResponse {
  text: string;              // The generated text
  usage: TokenUsage;         // Token counts
  cost: CostCalculation;     // Cost breakdown
  model: GeminiTextModel;    // Which model was used
  finishReason?: string;     // Why generation stopped
  latencyMs: number;         // Response time in milliseconds
}
```

**finishReason values:**
| Value | Meaning |
|-------|---------|
| STOP | Natural completion |
| MAX_TOKENS | Hit maxOutputTokens limit |
| SAFETY | Blocked by safety filters |
| RECITATION | Blocked for potential copyright |

**Reference:** https://ai.google.dev/api/generate-content#FinishReason

```typescript
// Response from image generation
export interface GeminiImageResponse {
  images: GeneratedImage[];  // Array of generated images
  text?: string;             // Optional text (some models output both)
  usage: TokenUsage;         // Token counts
  cost: CostCalculation;     // Cost breakdown
  model: GeminiImageModel;   // Which model was used
  latencyMs: number;         // Response time
}

// Individual generated image
export interface GeneratedImage {
  data: Buffer;        // Raw image bytes
  mimeType: string;    // e.g., 'image/png'
  fileName?: string;   // Suggested filename
}
```

---

### Result Wrapper

```typescript
// Result wrapper for all operations
export type GeminiResult<T> =
  | { success: true; data: T }
  | { success: false; error: GeminiError };
```

**Purpose:** Discriminated union for type-safe error handling.

**Usage:**
```typescript
const result = await gemini25Flash({ userPrompt: 'Hello' });

if (result.success) {
  // TypeScript knows result.data exists here
  console.log(result.data.text);
} else {
  // TypeScript knows result.error exists here
  console.log(result.error.message);
}
```

**Reference:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions

---

## pricing.json - Model Pricing Data

This JSON file contains pricing information for all Gemini models.

```json
{
  "models": {
    "gemini-2.5-flash": {
      "name": "Gemini 2.5 Flash",
      "type": "text",
      "pricing": {
        "input": 0.30,          // $0.30 per million input tokens
        "output": 2.50,         // $2.50 per million output tokens
        "cached_input": 0.03,   // $0.03 per million cached tokens
        "audio_input": 1.00     // $1.00 per million audio tokens
      },
      "currency": "USD",
      "unit": "per_million_tokens",
      "thinkingBudget": true,   // Supports thinkingBudget config
      "maxOutputTokens": 8192,
      "contextWindow": 1000000  // 1 million token context
    }
  }
}
```

**Pricing Structure:**
- Prices are in USD per 1 million tokens
- Different input types may have different prices (text vs audio)
- Some models have tiered pricing (under/over 200K tokens)

**How to update:**
1. Check current pricing: https://ai.google.dev/pricing
2. Update the values in this JSON file
3. The cost calculator will automatically use new prices

**Reference:** https://ai.google.dev/pricing

---

## cost-calculator.ts - Cost Calculation

This file calculates costs based on token usage and pricing data.

### Imports

```typescript
import pricingData from './pricing.json';
import {
  GeminiModel,
  TokenUsage,
  CostCalculation,
  PricingData,
  ImageSize,
} from './types';

const pricing = pricingData as PricingData;
```

**Why cast to PricingData?**
- TypeScript doesn't automatically infer JSON structure
- Casting ensures type safety when accessing pricing properties

---

### calculateTextCost Function

```typescript
/**
 * Calculate cost for text generation
 */
export function calculateTextCost(
  model: GeminiModel,
  usage: TokenUsage
): CostCalculation {
```
> Function signature with typed parameters and return type.

```typescript
  const modelInfo = pricing.models[model];

  if (!modelInfo) {
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }
```
> Safety check: return zero cost if model not found in pricing data.

```typescript
  const modelPricing = modelInfo.pricing;
  let inputRate: number;
  let outputRate: number;

  // Check if model has tiered pricing (over/under 200k tokens)
  if (modelPricing.input_under_200k !== undefined) {
    // Tiered pricing model (like gemini-2.5-pro)
    if (usage.inputTokens <= 200000) {
      inputRate = modelPricing.input_under_200k;
      outputRate = modelPricing.output_under_200k || 0;
    } else {
      inputRate = modelPricing.input_over_200k || modelPricing.input_under_200k;
      outputRate = modelPricing.output_over_200k || modelPricing.output_under_200k || 0;
    }
  } else {
    // Flat rate pricing (like gemini-2.5-flash)
    inputRate = modelPricing.input || 0;
    outputRate = modelPricing.output || modelPricing.output_text || 0;
  }
```
> Handles two pricing models:
> 1. **Flat rate:** Same price regardless of context length
> 2. **Tiered:** Different prices for prompts under/over 200K tokens

```typescript
  // Calculate costs (rates are per million tokens)
  const inputCost = (usage.inputTokens / 1_000_000) * inputRate;
  const outputCost = (usage.outputTokens / 1_000_000) * outputRate;

  return {
    inputCost: Math.round(inputCost * 1_000_000) / 1_000_000,
    outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
    totalCost: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
    currency: modelInfo.currency,
  };
}
```

**Cost Formula:**
```
cost = (tokens / 1,000,000) × rate_per_million
```

**Example:**
- 2,000 input tokens at $0.30/million = $0.0006
- 1,000 output tokens at $2.50/million = $0.0025
- Total = $0.0031

**Why Math.round?**
- Floating point arithmetic can produce values like 0.00030000000000000003
- Rounding to 6 decimal places keeps it clean

---

### calculateImageCost Function

```typescript
export function calculateImageCost(
  model: GeminiModel,
  usage: TokenUsage,
  imageCount: number,
  imageSize: ImageSize = '1K'
): CostCalculation {
```
> Image cost depends on number of images and their resolution.

```typescript
  // Calculate output image cost based on size
  let imageRate = 0;

  if (model === 'gemini-3.1-flash-image-preview') {
    switch (imageSize) {
      case '512':
        imageRate = modelPricing.output_image_512 || 0;  // $0.045
        break;
      case '1K':
        imageRate = modelPricing.output_image_1k || 0;   // $0.067
        break;
      case '2K':
        imageRate = modelPricing.output_image_2k || 0;   // $0.101
        break;
      case '4K':
        imageRate = modelPricing.output_image_4k || 0;   // $0.15
        break;
    }
  }
```
> Each image size has a different per-image cost.

---

### Utility Functions

```typescript
export function getModelPricing(model: GeminiModel) {
  return pricing.models[model];
}
```
> Get full pricing info for a specific model.

```typescript
export function getAvailableModels() {
  return Object.keys(pricing.models);
}
```
> List all models in the pricing data.

```typescript
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
```
> Estimate cost before making an API call. Useful for budgeting.

```typescript
export function formatCost(cost: CostCalculation): string {
  if (cost.totalCost < 0.01) {
    return `$${(cost.totalCost * 100).toFixed(4)} cents`;
  }
  return `$${cost.totalCost.toFixed(6)} ${cost.currency}`;
}
```
> Human-readable cost formatting.
> - Under 1 cent: show in cents (e.g., "$0.3100 cents")
> - Over 1 cent: show in dollars (e.g., "$0.012000 USD")

---

## gemini-provider.ts - Main Provider

This is the core implementation file.

### Imports

```typescript
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
```

**@google/genai:**
- Official Google SDK for Gemini API
- NPM: https://www.npmjs.com/package/@google/genai
- Source: https://github.com/google/generative-ai-js

**mime:**
- Library for MIME type detection
- Used to determine file extensions for generated images
- NPM: https://www.npmjs.com/package/mime

---

### Client Initialization

```typescript
// Initialize the Gemini client
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
};
```

**Why a function instead of a constant?**
- Lazy initialization: client is only created when needed
- Allows environment variable to be set after module load
- Fails fast with clear error message

**Reference:** https://ai.google.dev/gemini-api/docs/quickstart

---

### buildContentParts Function

```typescript
function buildContentParts(input: GeminiBaseInput): Array<{
  text?: string;
  inlineData?: { mimeType: string; data: string }
}> {
  const parts: Array<{...}> = [];

  // Add text prompt (always present)
  parts.push({ text: input.userPrompt });

  // Add image if provided
  if (input.imageInput) {
    const imageData = Buffer.isBuffer(input.imageInput)
      ? input.imageInput.toString('base64')
      : input.imageInput;

    parts.push({
      inlineData: {
        mimeType: input.imageMimeType || 'image/jpeg',
        data: imageData,
      },
    });
  }

  // Add audio if provided (same pattern)
  if (input.audioInput) {
    // ... similar to image
  }

  return parts;
}
```

**Purpose:** Converts our input format to Gemini's expected format.

**Gemini Content Structure:**
```typescript
{
  role: 'user',
  parts: [
    { text: 'Describe this image' },
    { inlineData: { mimeType: 'image/jpeg', data: 'base64...' } }
  ]
}
```

**Reference:** https://ai.google.dev/api/generate-content#Content

---

### extractUsage Function

```typescript
function extractUsage(response: {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number
  }
}): TokenUsage {
  const metadata = response.usageMetadata;
  return {
    inputTokens: metadata?.promptTokenCount || 0,
    outputTokens: metadata?.candidatesTokenCount || 0,
    totalTokens: metadata?.totalTokenCount || 0,
  };
}
```

**Purpose:** Extracts token counts from Gemini's response.

**Gemini's naming:**
- `promptTokenCount` = input tokens (what we sent)
- `candidatesTokenCount` = output tokens (what model generated)

**Reference:** https://ai.google.dev/api/generate-content#UsageMetadata

---

### generateText Function

```typescript
async function generateText(input: GeminiTextInput): Promise<GeminiResult<GeminiTextResponse>> {
  const startTime = Date.now();  // Track latency
```
> Capture start time for latency measurement.

```typescript
  try {
    const ai = getClient();
    const config = input.config || {};

    // Build configuration object
    const genConfig: Record<string, unknown> = {};
```
> Initialize empty config object. We'll add properties conditionally.

```typescript
    // System instruction
    if (input.systemPrompt) {
      genConfig.systemInstruction = [{ text: input.systemPrompt }];
    }
```
> System instructions tell the model how to behave.
> Format: array of text objects (Gemini's expected format).

```typescript
    // Thinking config for Gemini 3.x
    if (config.thinkingLevel) {
      genConfig.thinkingConfig = {
        thinkingLevel: config.thinkingLevel,
      };
    }

    // Thinking budget for Gemini 2.5
    if (config.thinkingBudget !== undefined) {
      genConfig.thinkingConfig = {
        thinkingBudget: config.thinkingBudget,
      };
    }
```
> Different models use different thinking configuration formats.

```typescript
    // URL context tool for web grounding
    if (config.enableUrlContext) {
      genConfig.tools = [{ urlContext: {} }];
    }
```
> Enables the model to search the web for real-time information.
> Reference: https://ai.google.dev/gemini-api/docs/grounding

```typescript
    // Generation parameters
    if (config.temperature !== undefined) genConfig.temperature = config.temperature;
    if (config.topP !== undefined) genConfig.topP = config.topP;
    if (config.topK !== undefined) genConfig.topK = config.topK;
    if (config.maxOutputTokens !== undefined) genConfig.maxOutputTokens = config.maxOutputTokens;
    if (config.stopSequences) genConfig.stopSequences = config.stopSequences;
```
> Only add parameters that are explicitly set. Undefined values use model defaults.

```typescript
    // Build contents array
    const contents = [
      {
        role: 'user',
        parts: buildContentParts(input),
      },
    ];
```
> Gemini expects a conversation format with roles ('user' or 'model').

```typescript
    // Make API call
    const response = await ai.models.generateContent({
      model: input.model,
      config: genConfig,
      contents,
    });
```
> The actual API call. Returns a response object with text and metadata.

```typescript
    const latencyMs = Date.now() - startTime;
    const usage = extractUsage(response);
    const cost = calculateTextCost(input.model, usage);
```
> Calculate metrics after response.

```typescript
    return {
      success: true,
      data: {
        text: response.text || '',
        usage,
        cost,
        model: input.model,
        finishReason: response.candidates?.[0]?.finishReason,
        latencyMs,
      },
    };
```
> Return successful result with all data.

```typescript
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { model: input.model },
      },
    };
  }
}
```
> Catch any errors and return structured error response.

---

### Convenience Functions

```typescript
/**
 * Gemini 2.5 Flash - Recommended default
 */
export async function gemini25Flash(
  input: Omit<GeminiBaseInput, 'model'> & { config?: GeminiTextConfig }
): Promise<GeminiResult<GeminiTextResponse>> {
  return generateText({
    ...input,
    model: 'gemini-2.5-flash',
    config: {
      thinkingBudget: -1, // Unlimited thinking
      ...input.config,
    },
  });
}
```

**Why convenience functions?**
1. Simpler API: no need to specify model ID
2. Sensible defaults: each model has optimal default settings
3. Type safety: prevents using wrong model ID

**Omit<GeminiBaseInput, 'model'>:**
- TypeScript utility type
- Takes GeminiBaseInput but removes 'model' property
- User doesn't need to specify model (it's hardcoded)
- Reference: https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys

---

## index.ts - Exports

This file defines the public API of the module.

```typescript
// Main provider functions
export {
  // Text Models
  gemini35Flash,
  gemini31FlashLite,
  // ... other functions

  // Enums
  ThinkingLevel,
} from './gemini-provider';

// Types
export type {
  GeminiTextInput,
  GeminiImageInput,
  // ... other types
} from './gemini-provider';

// Cost calculator
export {
  calculateTextCost,
  calculateImageCost,
  // ... other functions
} from './cost-calculator';
```

**Why separate exports?**
- `export { }` for values (functions, enums, constants)
- `export type { }` for types (interfaces, type aliases)
- Helps with tree-shaking and TypeScript compilation

**Reference:** https://www.typescriptlang.org/docs/handbook/modules.html

---

## References & Links

### Internal Documentation

| Document | Path | Purpose |
|----------|------|---------|
| Migration Plan | `docs/GEMINI_MIGRATION_PLAN.md` | Stage-based AI coach architecture |
| **Quiz System** | `docs/TRAINER_QUIZ_SYSTEM.md` | **Trainer agent & interactive quizzes** |
| Model Guide | `docs/GEMINI_MODEL_GUIDE.md` | Which model for what task |
| Model Reference | `docs/GEMINI_MODEL_REFERENCE.md` | API reference with code examples |
| Pricing Guide | `docs/GEMINI_PRICING.md` | Cost estimation |

### Coaching Program Methodology

| Source | Path | Key Concepts |
|--------|------|--------------|
| Problem Validation | `/1-Problem-Direction-Validation/` | Lean Startup, Mom Test, customer slicing, scary questions |
| MVP Scoping | `/2-MVP-Scope-Features/` | Inspired (Marty Cagan), feature prioritization, MVP types |
| Build & Test | `/3-Build-First-MVP/` | Build-Measure-Learn, cold outreach, signal vs noise |
| Refine & Pitch | `/4-Refine-MVP/` | Innovation accounting, Demo Day, metrics |
| Full Curriculum | `/coaching-program-v2/` | 4-week program with slides and templates |
| YC Transcripts | `/yc-transcripts/` | Y Combinator startup wisdom |

### Coaching Methodology Books

| Book | Author | Key Concepts Used |
|------|--------|-------------------|
| The Lean Startup | Eric Ries | Build-Measure-Learn, MVP, pivot/persevere, innovation accounting |
| The Mom Test | Rob Fitzpatrick | Customer interviews, avoiding bias, scary questions |
| Inspired | Marty Cagan | Product discovery, opportunity assessment, 4 risks |
| Running Lean | Ash Maurya | Lean Canvas, problem/solution fit |

### Official Gemini Documentation

| Resource | URL |
|----------|-----|
| Gemini API Overview | https://ai.google.dev/gemini-api/docs |
| API Reference | https://ai.google.dev/api |
| Model List | https://ai.google.dev/gemini-api/docs/models/gemini |
| Pricing | https://ai.google.dev/pricing |
| Quickstart | https://ai.google.dev/gemini-api/docs/quickstart |

### Specific Features

| Feature | URL |
|---------|-----|
| Text Generation | https://ai.google.dev/gemini-api/docs/text-generation |
| Image Generation | https://ai.google.dev/gemini-api/docs/image-generation |
| Vision (Image Input) | https://ai.google.dev/gemini-api/docs/vision |
| Audio Input | https://ai.google.dev/gemini-api/docs/audio |
| System Instructions | https://ai.google.dev/gemini-api/docs/system-instructions |
| Thinking | https://ai.google.dev/gemini-api/docs/thinking |
| Grounding (Web Search) | https://ai.google.dev/gemini-api/docs/grounding |
| Tokens | https://ai.google.dev/gemini-api/docs/tokens |
| Safety Settings | https://ai.google.dev/gemini-api/docs/safety-settings |

### SDK & Tools

| Resource | URL |
|----------|-----|
| @google/genai NPM | https://www.npmjs.com/package/@google/genai |
| GitHub Repository | https://github.com/google/generative-ai-js |
| Google AI Studio | https://aistudio.google.com/ |
| Vertex AI Console | https://console.cloud.google.com/vertex-ai |

### TypeScript References

| Topic | URL |
|-------|-----|
| Utility Types (Omit, Pick) | https://www.typescriptlang.org/docs/handbook/utility-types.html |
| Discriminated Unions | https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions |
| Enums | https://www.typescriptlang.org/docs/handbook/enums.html |
| Modules | https://www.typescriptlang.org/docs/handbook/modules.html |

### Research Papers

| Topic | URL |
|-------|-----|
| Top-P (Nucleus) Sampling | https://arxiv.org/abs/1904.09751 |
| Temperature in LLMs | https://arxiv.org/abs/2307.03172 |

---

## Troubleshooting

### Common Errors

**"GEMINI_API_KEY environment variable is not set"**
- Ensure `.env` file has `GEMINI_API_KEY=your-key`
- Restart the server after adding the key

**"API key not valid"**
- Check the key at https://aistudio.google.com/app/apikey
- Ensure no extra spaces or quotes in the .env file

**"Quota exceeded"**
- Free tier has limits (requests per minute/day)
- Check usage at https://console.cloud.google.com/apis/dashboard

**"Content blocked by safety"**
- Model refused due to safety filters
- Review prompt for potentially harmful content
- Reference: https://ai.google.dev/gemini-api/docs/safety-settings

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-31 | Initial implementation |

---

## Contributing

To add a new model:

1. Add model ID to `types.ts` (GeminiTextModel or GeminiImageModel)
2. Add pricing to `pricing.json`
3. Add convenience function to `gemini-provider.ts`
4. Export from `index.ts`
5. Update this documentation
