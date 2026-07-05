# Getting Started with Gemini AI Tools

> **For Users**: See [USER_GUIDE.md](./USER_GUIDE.md) for complete setup and usage.
> **For Developers**: This guide covers code setup and API usage.

This guide shows how to set up and use the Gemini AI tools after cloning.

---

## AI Agent Reading Order

**If you're an AI agent, read files in this order based on task:**

### For Content Generation (Videos, Images, Audio)
```
1. AGENT-GUIDE.md          ← Start here (context + routing)
2. skills/README.md   ← Understand skills system
3. skills/*/SKILL.md  ← Load appropriate skill
```

### For Content Planning (Campaigns, Calendars)
```
1. AGENT-GUIDE.md              ← Start here
2. templates/README.md    ← Understand templates
3. templates/*.template.md ← Copy to project
```

### For API/Code Development
```
1. AGENT_TOOL_SPEC.md  ← Complete API docs
2. tool-schema.json    ← JSON schema
3. This file           ← Code examples
```

---

## 1. Installation

```bash
# Clone or copy this folder to your project
cd gemini

# Install dependencies
npm install

# Build TypeScript (optional, for production)
npm run build
```

---

## 2. Environment Setup

Create a `.env` file or set the environment variable:

```bash
# Option A: Create .env file
echo "GEMINI_API_KEY=your-api-key-here" > .env

# Option B: Export directly
export GEMINI_API_KEY="your-api-key-here"
```

**Get your API key**: https://aistudio.google.com/app/apikey

---

## 3. Quick Test

```typescript
// test.ts
import { gemini25Flash } from './index';

async function test() {
  const result = await gemini25Flash({
    userPrompt: 'Say hello in 3 languages'
  });

  if (result.success) {
    console.log(result.data.text);
  } else {
    console.error(result.error);
  }
}

test();
```

Run with:
```bash
npx ts-node test.ts
```

---

## 4. Available Tools

### Text Generation
```typescript
import { gemini25Flash, gemini25Pro } from './index';

// Simple
const result = await gemini25Flash({ userPrompt: 'Hello' });

// With system prompt
const result = await gemini25Flash({
  systemPrompt: 'You are a helpful assistant',
  userPrompt: 'Help me write an email'
});

// With image
import fs from 'fs';
const result = await gemini25Flash({
  userPrompt: 'What is in this image?',
  imageInput: fs.readFileSync('photo.jpg'),
  imageMimeType: 'image/jpeg'
});
```

### Image Generation
```typescript
import { gemini31FlashImage } from './index';

const result = await gemini31FlashImage({
  userPrompt: 'A robot reading a book',
  config: { imageSize: '2K' }
});

if (result.success) {
  fs.writeFileSync('output.png', result.data.images[0].data);
}
```

### Video Generation
```typescript
import { veo31Lite } from './index';

const result = await veo31Lite('Sunset over mountains', {
  aspectRatio: '16:9',
  durationSeconds: 6
});

if (result.success) {
  fs.writeFileSync('video.mp4', result.data.videos[0].data);
}
```

### Text-to-Speech
```typescript
import { textToSpeech, multiSpeakerTTS } from './index';

// Single speaker
const result = await textToSpeech('Hello world!', 'Zephyr');

// With voice style
const result = await textToSpeech(
  'This is exciting!',
  'Aoede',
  { style: 'excited', pace: 'energetic' }
);

// Multi-speaker
const result = await multiSpeakerTTS(
  `Host: Welcome!
   Guest: Thanks for having me!`,
  [
    { speaker: 'Host', voiceName: 'Zephyr' },
    { speaker: 'Guest', voiceName: 'Puck' }
  ]
);

if (result.success) {
  fs.writeFileSync('audio.wav', result.data.audio.data);
}
```

### Music Generation
```typescript
import { generateMusic } from './index';

const result = await generateMusic({
  model: 'lyria-3',
  prompt: 'Upbeat electronic music'
});

if (result.success) {
  fs.writeFileSync('music.wav', result.data.music.data);
}
```

---

## 5. Error Handling

All functions return a discriminated union:

```typescript
const result = await gemini25Flash({ userPrompt: 'Hello' });

if (result.success) {
  // result.data is available
  console.log(result.data.text);
  console.log(result.data.cost.totalCost);
} else {
  // result.error is available
  console.error(result.error.code, result.error.message);
}
```

---

## 6. Cost Tracking

```typescript
import { estimateCost, formatCost } from './index';

// Before API call
const estimate = estimateCost('gemini-2.5-flash', 1000, 500);
console.log(`Estimated: ${formatCost(estimate)}`);

// After API call
if (result.success) {
  console.log(`Actual: ${formatCost(result.data.cost)}`);
}
```

---

## 7. Run Examples

```bash
# Basic usage examples
npx ts-node examples/basic-usage.ts

# Content creation workflow
npx ts-node examples/workflow-content-creation.ts "Your Topic Here"
```

---

## 8. File Structure

```
gemini/
├── index.ts              # Main exports (import from here)
├── gemini-provider.ts    # Core implementation
├── types.ts              # TypeScript types
├── cost-calculator.ts    # Cost utilities
├── pricing.json          # Model pricing data
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── AGENT_TOOL_SPEC.md    # Detailed tool documentation
├── tool-schema.json      # JSON schema for tools
├── GETTING_STARTED.md    # This file
└── examples/
    ├── basic-usage.ts
    └── workflow-content-creation.ts
```

---

## 9. Model Selection Guide

| Task | Recommended | Cost |
|------|-------------|------|
| Simple text | `gemini25FlashLite()` | Cheapest |
| General use | `gemini25Flash()` | Low |
| Complex reasoning | `gemini25Pro()` | Medium |
| Fast images | `gemini31FlashImage()` | Per image |
| Quality images | `gemini3ProImage()` | Per image |
| Budget video | `veo31Lite()` | $0.03/sec |
| Quality video | `veo3()` | $0.20/sec |
| TTS | `textToSpeech()` | Per token |
| Short music | `generateMusic({ model: 'lyria-3' })` | $0.04/clip |
| Full songs | `generateMusic({ model: 'lyria-3-pro' })` | $0.08/song |

---

## 10. Next Steps

- See `AGENT_TOOL_SPEC.md` for complete API reference
- See `tool-schema.json` for programmatic schema
- Check `examples/` for working code samples
- Visit https://ai.google.dev/gemini-api/docs for official docs
