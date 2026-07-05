# Gemini AI Tool Specification for AI Agents

> **For AI Agents**: This document describes a TypeScript/Node.js tool for Google Gemini AI capabilities. Use this as an MCP-style tool reference.

## Quick Reference

| Capability | Function | Model | Cost |
|------------|----------|-------|------|
| Text Generation | `gemini25Flash()` | gemini-2.5-flash | $0.30/$2.50 per 1M tokens |
| Image Generation | `gemini31FlashImage()` | gemini-3.1-flash-image | $0.045-$0.15 per image |
| Video Generation | `veo31Lite()` | veo-3.1-lite | $0.03/sec |
| Text-to-Speech | `textToSpeech()` | gemini-2.5-flash-tts | $0.50/$12 per 1M tokens |
| Music Generation | `generateMusic()` | lyria-3 | $0.04 per 30sec |

---

## Installation & Setup

```bash
# Install dependencies
npm install @google/genai

# Environment variable required
GEMINI_API_KEY=your-api-key-here
```

**Get API Key**: https://aistudio.google.com/app/apikey

---

## Tool 1: Text Generation

### Function: `gemini25Flash(input)`

**Purpose**: Generate text responses, answer questions, analyze content, write code.

**Input Schema**:
```typescript
{
  userPrompt: string;           // REQUIRED: The question or task
  systemPrompt?: string;        // Optional: Behavior instructions
  imageInput?: Buffer | string; // Optional: Image for multimodal (base64 or Buffer)
  imageMimeType?: string;       // Optional: 'image/jpeg', 'image/png', etc.
  audioInput?: Buffer | string; // Optional: Audio for transcription
  audioMimeType?: string;       // Optional: 'audio/mp3', 'audio/wav', etc.
  config?: {
    temperature?: number;       // 0.0-2.0, controls randomness (default: 1.0)
    maxOutputTokens?: number;   // Max response length (default: 8192)
    thinkingBudget?: number;    // -1 = unlimited, 0 = none
    enableGoogleSearch?: boolean; // Enable web grounding
  }
}
```

**Output Schema**:
```typescript
{
  success: true;
  data: {
    text: string;              // Generated text response
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    cost: {
      inputCost: number;       // USD
      outputCost: number;      // USD
      totalCost: number;       // USD
    };
    latencyMs: number;
    model: string;
    finishReason?: string;     // 'STOP' | 'MAX_TOKENS' | 'SAFETY'
  }
}
// OR
{
  success: false;
  error: {
    code: string;
    message: string;
  }
}
```

**Example Usage**:
```typescript
import { gemini25Flash } from './gemini';

// Simple text generation
const result = await gemini25Flash({
  userPrompt: 'Explain quantum computing in 3 sentences'
});

if (result.success) {
  console.log(result.data.text);
  console.log(`Cost: $${result.data.cost.totalCost}`);
}

// With system prompt for specific behavior
const codeResult = await gemini25Flash({
  systemPrompt: 'You are a TypeScript expert. Provide concise, working code.',
  userPrompt: 'Write a function to merge two sorted arrays'
});

// With image input (multimodal)
import fs from 'fs';
const imageResult = await gemini25Flash({
  userPrompt: 'Describe what you see in this image',
  imageInput: fs.readFileSync('photo.jpg'),
  imageMimeType: 'image/jpeg'
});

// With web search enabled
const searchResult = await gemini25Flash({
  userPrompt: 'What are the latest AI developments in 2026?',
  config: { enableGoogleSearch: true }
});
```

### Available Text Models

| Function | Model ID | Best For | Cost (input/output per 1M) |
|----------|----------|----------|----------------------------|
| `gemini25FlashLite()` | gemini-2.5-flash-lite | Simple tasks, budget | $0.10 / $0.40 |
| `gemini25Flash()` | gemini-2.5-flash | **RECOMMENDED default** | $0.30 / $2.50 |
| `gemini31FlashLite()` | gemini-3.1-flash-lite | Budget with thinking | $0.25 / $1.50 |
| `gemini35Flash()` | gemini-3.5-flash | Latest with thinking | $1.50 / $9.00 |
| `gemini25Pro()` | gemini-2.5-pro | Complex reasoning | $1.25 / $10.00 |
| `gemini31ProPreview()` | gemini-3.1-pro-preview | Highest quality | $2.00 / $12.00 |

---

## Tool 2: Image Generation

### Function: `gemini31FlashImage(input)`

**Purpose**: Generate images from text descriptions.

**Input Schema**:
```typescript
{
  userPrompt: string;           // REQUIRED: Image description
  systemPrompt?: string;        // Optional: Style instructions
  config?: {
    imageSize?: '512' | '1K' | '2K' | '4K';  // Resolution (default: '1K')
    aspectRatio?: string;       // e.g., '1:1', '16:9', '9:16'
  }
}
```

**Output Schema**:
```typescript
{
  success: true;
  data: {
    images: [{
      data: Buffer;            // Raw image bytes
      mimeType: string;        // 'image/png' or 'image/jpeg'
      fileName?: string;
    }];
    text?: string;             // Optional descriptive text
    cost: CostCalculation;
    latencyMs: number;
  }
}
```

**Example Usage**:
```typescript
import { gemini31FlashImage } from './gemini';
import fs from 'fs';

const result = await gemini31FlashImage({
  userPrompt: 'A futuristic city at sunset with flying cars, digital art style',
  config: { imageSize: '2K', aspectRatio: '16:9' }
});

if (result.success) {
  fs.writeFileSync('generated.png', result.data.images[0].data);
  console.log(`Generated image, cost: $${result.data.cost.totalCost}`);
}
```

### Image Model Pricing

| Function | Model | 512px | 1K | 2K | 4K |
|----------|-------|-------|-----|-----|-----|
| `gemini31FlashImage()` | Flash | $0.045 | $0.067 | $0.101 | $0.15 |
| `gemini3ProImage()` | Pro | $0.134 | $0.134 | $0.134 | $0.24 |

---

## Tool 3: Video Generation

### Function: `veo31Lite(prompt, config?)`

**Purpose**: Generate short videos from text descriptions.

**Input Schema**:
```typescript
// prompt: string - REQUIRED: Video description
// config (optional):
{
  aspectRatio?: '9:16' | '16:9' | '1:1';  // Default: '9:16'
  resolution?: '720p' | '1080p' | '4k';   // Default: '720p'
  durationSeconds?: number;                // 5-8 seconds, default: 6
  numberOfVideos?: number;                 // 1-4, default: 1
  generateAudio?: boolean;                 // Include audio, default: false
}
```

**Output Schema**:
```typescript
{
  success: true;
  data: {
    videos: [{
      data: Buffer;            // MP4 video bytes
      mimeType: 'video/mp4';
      durationSeconds: number;
      fileName?: string;
    }];
    cost: CostCalculation;
    latencyMs: number;
  }
}
```

**Example Usage**:
```typescript
import { veo31Lite, veo31, veo3 } from './gemini';
import fs from 'fs';

// Budget option - fast generation
const result = await veo31Lite('A sunset over mountains with birds flying');

// Balanced quality
const result2 = await veo31('Ocean waves crashing on a beach', {
  aspectRatio: '16:9',
  resolution: '1080p',
  durationSeconds: 8
});

// Highest quality with audio
const result3 = await veo3('A jazz band performing in a dimly lit club', {
  generateAudio: true
});

if (result.success) {
  fs.writeFileSync('video.mp4', result.data.videos[0].data);
}
```

### Video Model Pricing

| Function | Model | Video Only | With Audio |
|----------|-------|------------|------------|
| `veo31Lite()` | veo-3.1-lite | $0.03/sec | $0.05/sec |
| `veo31()` | veo-3.1 | $0.20/sec | $0.40/sec |
| `veo3()` | veo-3 | $0.20/sec | $0.40/sec |

---

## Tool 4: Text-to-Speech (TTS)

### Function: `textToSpeech(text, voiceName?, voiceSettings?, model?)`

**Purpose**: Convert text to natural-sounding speech.

**Input Schema**:
```typescript
// Simple usage
textToSpeech(
  text: string,                    // REQUIRED: Text to speak
  voiceName?: TTSVoiceName,        // Default: 'Zephyr'
  voiceSettings?: {
    style?: string;                // 'vocal_smile', 'whisper', 'excited', etc.
    pace?: string;                 // 'natural', 'slow', 'rapid_fire', etc.
    accent?: string;               // 'american_general', 'british_rp', etc.
    audioProfile?: string;         // Custom description
  },
  model?: TTSModel                 // Default: 'gemini-2.5-flash-preview-tts'
)

// Full control
generateTTS({
  model: TTSModel;
  text: string;
  config?: {
    voiceName?: TTSVoiceName;
    voiceSettings?: TTSVoiceSettings;
    speakers?: SpeakerVoiceConfig[];  // For multi-speaker
    temperature?: number;
  }
})
```

**Available Voices (30 total)**:
- **Female**: Achernar, Aoede, Autonoe, Callirrhoe, Despina, Erinome, Gacrux, Kore, Laomedeia, Leda, Pulcherrima, Sulafat, Vindemiatrix, Zephyr
- **Male**: Achird, Algenib, Algieba, Alnilam, Charon, Enceladus, Fenrir, Iapetus, Orus, Puck, Rasalgethi, Sadachbia, Sadaltager, Schedar, Umbriel, Zubenelgenubi

**Voice Styles**: `neutral`, `vocal_smile`, `newscaster`, `whisper`, `empathetic`, `promo_hype`, `deadpan`, `excited`, `sarcastic`, `serious`, `casual`

**Output Schema**:
```typescript
{
  success: true;
  data: {
    audio: {
      data: Buffer;            // WAV audio bytes
      mimeType: 'audio/wav';
      fileName?: string;
    };
    cost: CostCalculation;
    latencyMs: number;
  }
}
```

**Example Usage**:
```typescript
import { textToSpeech, multiSpeakerTTS } from './gemini';
import fs from 'fs';

// Basic TTS
const result = await textToSpeech('Hello, welcome to our service!', 'Zephyr');

// With voice settings
const excited = await textToSpeech(
  'This is incredible news!',
  'Aoede',
  { style: 'excited', pace: 'energetic', accent: 'american_general' }
);

// With inline audio tags
const dramatic = await textToSpeech(
  '[excited] Wow, this is amazing! [whispers] But keep it a secret.',
  'Puck'
);

// Multi-speaker conversation
const podcast = await multiSpeakerTTS(
  `Host: Welcome to the show!
   Guest: Thanks for having me!
   Host: So tell us about your project.`,
  [
    { speaker: 'Host', voiceName: 'Zephyr', voiceSettings: { style: 'vocal_smile' } },
    { speaker: 'Guest', voiceName: 'Puck', voiceSettings: { style: 'casual', accent: 'british_rp' } }
  ]
);

if (result.success) {
  fs.writeFileSync('speech.wav', result.data.audio.data);
}
```

### Audio Tags for Inline Control

Embed in text: `[excited]`, `[whispers]`, `[laughs]`, `[sighs]`, `[gasp]`, `[sarcastic]`, `[slow]`, `[fast]`, `[short pause]`, `[long pause]`

---

## Tool 5: Music Generation

### Function: `generateMusic(input)`

**Purpose**: Generate music from text descriptions.

**Input Schema**:
```typescript
{
  model: 'lyria-3' | 'lyria-3-pro';  // REQUIRED
  prompt: string;                     // REQUIRED: Music description
  imageInput?: Buffer | string;       // Optional: Reference image for mood
  imageMimeType?: string;
  config?: {
    durationSeconds?: number;         // lyria-3: max 30, lyria-3-pro: max 180
  }
}
```

**Output Schema**:
```typescript
{
  success: true;
  data: {
    music: {
      data: Buffer;            // WAV/MP3 audio bytes
      mimeType: string;
      durationSeconds: number;
      fileName?: string;
    };
    cost: CostCalculation;
    latencyMs: number;
  }
}
```

**Example Usage**:
```typescript
import { generateMusic } from './gemini';
import fs from 'fs';

// Generate a 30-second clip
const result = await generateMusic({
  model: 'lyria-3',
  prompt: 'Upbeat electronic music for a tech startup video, energetic and modern'
});

// Generate a full song (up to 3 minutes)
const fullSong = await generateMusic({
  model: 'lyria-3-pro',
  prompt: 'Calm ambient music for meditation, soft piano and nature sounds',
  config: { durationSeconds: 120 }
});

if (result.success) {
  fs.writeFileSync('music.wav', result.data.music.data);
}
```

### Music Model Pricing

| Model | Max Duration | Cost |
|-------|--------------|------|
| lyria-3 | 30 seconds | $0.04 per clip |
| lyria-3-pro | 3 minutes | $0.08 per song |

---

## Tool 6: Streaming Text Generation

### Function: `gemini25FlashStream(input)`

**Purpose**: Stream text responses for real-time display.

**Example Usage**:
```typescript
import { gemini25FlashStream } from './gemini';

for await (const chunk of gemini25FlashStream({
  userPrompt: 'Write a short story about a robot'
})) {
  process.stdout.write(chunk.text || '');

  if (chunk.done) {
    console.log('\nTokens used:', chunk.usage);
  }
}
```

---

## Cost Estimation Utilities

```typescript
import {
  estimateCost,
  estimateVideoCost,
  calculateTextCost,
  formatCost,
  getModelPricing
} from './gemini';

// Estimate before API call
const estimate = estimateCost('gemini-2.5-flash', 2000, 1000);
console.log(`Estimated: ${formatCost(estimate)}`);

// Video cost estimation
const videoCost = estimateVideoCost('veo-3.1-lite-generate-preview', 6, 2, false);
console.log(`Video cost: ${formatCost(videoCost)}`);

// Get model pricing info
const pricing = getModelPricing('gemini-2.5-flash');
console.log(`Input: $${pricing.pricing.input}/M tokens`);
```

---

## Error Handling Pattern

All functions return a discriminated union for type-safe error handling:

```typescript
const result = await gemini25Flash({ userPrompt: 'Hello' });

if (result.success) {
  // TypeScript knows result.data exists
  console.log(result.data.text);
  console.log(`Cost: $${result.data.cost.totalCost}`);
  console.log(`Latency: ${result.data.latencyMs}ms`);
} else {
  // TypeScript knows result.error exists
  console.error(`Error [${result.error.code}]: ${result.error.message}`);
}
```

**Common Error Codes**:
- `GENERATION_ERROR` - API call failed
- `IMAGE_GENERATION_ERROR` - Image generation failed
- `VIDEO_GENERATION_ERROR` - Video generation failed
- `TTS_NO_AUDIO` - No audio generated
- `MUSIC_NO_AUDIO` - No music generated

---

## Complete Import Reference

```typescript
// Main functions
import {
  // Text generation
  gemini25Flash,        // RECOMMENDED default
  gemini25FlashLite,    // Budget
  gemini25Pro,          // Premium
  gemini35Flash,        // Latest with thinking
  gemini31FlashLite,    // Budget with thinking
  gemini31ProPreview,   // Highest quality
  generateText,         // Generic (advanced)

  // Streaming
  gemini25FlashStream,
  gemini35FlashStream,
  generateTextStream,

  // Image generation
  gemini31FlashImage,   // Fast
  gemini3ProImage,      // High quality
  generateImage,        // Generic

  // Video generation (Veo)
  veo31Lite,            // Budget
  veo31,                // Balanced
  veo3,                 // Best quality
  generateVideo,        // Generic

  // Text-to-Speech
  textToSpeech,         // Simple
  multiSpeakerTTS,      // Multi-speaker
  generateTTS,          // Generic

  // Music generation (Lyria)
  generateMusic,

  // Cost utilities
  calculateTextCost,
  calculateImageCost,
  calculateVideoCost,
  calculateTTSCost,
  calculateMusicCost,
  estimateCost,
  estimateVideoCost,
  formatCost,
  getModelPricing,
  getAvailableModels,

  // Enums
  ThinkingLevel,
} from './gemini';

// Types
import type {
  GeminiResult,
  GeminiTextResponse,
  GeminiImageResponse,
  VeoResponse,
  TTSResponse,
  LyriaResponse,
  TokenUsage,
  CostCalculation,
  TTSVoiceName,
  TTSVoiceSettings,
} from './gemini';
```

---

## Environment Requirements

| Requirement | Value |
|-------------|-------|
| Node.js | >= 18.0.0 |
| TypeScript | >= 5.0.0 |
| Package | @google/genai |
| API Key | GEMINI_API_KEY env var |

---

## Official Documentation Links

- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **Pricing**: https://ai.google.dev/pricing
- **Models**: https://ai.google.dev/gemini-api/docs/models/gemini
- **Get API Key**: https://aistudio.google.com/app/apikey
