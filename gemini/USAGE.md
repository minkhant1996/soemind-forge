# How to Use Gemini Module

> ## ⚠️ AGENTS: DO NOT WRITE A SCRIPT TO GENERATE CONTENT
> To generate content, **call the workflow CLI** — one command per step, no script file:
> ```bash
> node workflows/cli.cjs <command> '<json-args>'     # node workflows/cli.cjs list
> ```
> See `AGENT-GUIDE.md` → "HOW TO RUN A WORKFLOW" and `workflows/WORKFLOWS.md`.
>
> Everything below is the **low-level SDK** reference — for building a genuinely new,
> reusable workflow function (`workflows/CREATING_WORKFLOWS.md`), *not* for one-off
> content generation. If you're reaching for this to make a video/image/voiceover, stop
> and use the CLI instead.

## For SDK / Custom-Workflow Authors: Correct Import Syntax

When writing a **new reusable workflow** against the gemini module, use this EXACT template:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (IMPORTANT - must be before gemini import!)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// NOW import gemini functions
import {
  gemini31FlashImage,
  veo31,
  veo31Lite,
  textToSpeech,
  generateMusic
} from '../../../gemini/dist/index.js';
```

**IMPORTANT:**
- Import from `gemini/dist/index.js` (the built module)
- Load dotenv BEFORE importing gemini functions
- Use `process.cwd()` to find .env at project root

## Setup Before Running Scripts

1. Make sure `.env` exists at root with `GEMINI_API_KEY`:
```bash
GEMINI_API_KEY=your-api-key-here
```

2. Install dependencies and build:
```bash
# At root level
npm install

# Build gemini module (if not already built)
cd gemini && npm install && npm run build
```

3. Run scripts with ts-node ESM loader:
```bash
npx ts-node --esm projects/{name}/scripts/your-script.ts
```

## Available Functions

### Image Generation
```typescript
import { gemini31FlashImage, gemini3ProImage } from '../../../gemini/dist/index.js';

const result = await gemini31FlashImage({
  userPrompt: 'A beautiful sunset',
  config: {
    aspectRatio: '16:9',  // or '9:16', '1:1', '4:5'
    imageSize: '1K',      // or '512', '2K', '4K'
    personGeneration: 'allow'  // or 'block'
  }
});

if (result.success) {
  fs.writeFileSync('image.png', result.data.images[0].data);
}
```

### Video Generation
```typescript
import { veo31Fast, veo31Lite } from '../../../gemini/dist/index.js';

// Budget option - $0.03/sec (4-8 second clips)
const result = await veo31Lite('A sunset timelapse', {
  aspectRatio: '9:16',
  durationSeconds: 6,
});

// Fast quality - $0.08/sec (RECOMMENDED)
const result = await veo31Fast('A sunset timelapse', {
  aspectRatio: '9:16',
  durationSeconds: 6,
});

if (result.success) {
  fs.writeFileSync('video.mp4', result.data.videos[0].data);
}
```

**Note:** Don't include `personGeneration` unless specifically needed - most models don't support it.

### Text-to-Speech
```typescript
import { textToSpeech, multiSpeakerTTS } from '../../../gemini/dist/index.js';

// Single speaker
const result = await textToSpeech(
  'Hello, welcome to our video!',
  'Zephyr',  // Voice: Zephyr, Puck, Aoede, Kore, etc.
  { style: 'professional' }
);

if (result.success) {
  fs.writeFileSync('voiceover.wav', result.data.audio.data);
}
```

### Music Generation
```typescript
import { generateMusic } from '../../../gemini/dist/index.js';

const result = await generateMusic({
  model: 'lyria-3',  // ≤30s
  prompt: 'Upbeat electronic music for tech video'
});

if (result.success) {
  fs.writeFileSync('music.wav', result.data.music.data);
}
```

## Script Template

```typescript
/**
 * Content Generation Script
 * Run with: npx ts-node --esm projects/{name}/scripts/this-file.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { gemini31FlashImage, veo31Lite } from '../../../gemini/dist/index.js';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure output directory exists
const outputDir = path.join(__dirname, '../output-contents');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function main() {
  // Generate keyframe
  const image = await gemini31FlashImage({
    userPrompt: 'Your prompt here',
    config: { aspectRatio: '9:16', personGeneration: 'allow' }
  });

  if (image.success) {
    fs.writeFileSync(
      path.join(outputDir, 'keyframe.png'),
      image.data.images[0].data
    );
    console.log('Saved keyframe.png');
    console.log(`Cost: $${image.data.cost.totalCost.toFixed(4)}`);
  } else {
    console.error('Failed:', image.error?.message);
  }
}

main().catch(console.error);
```

## Relative Paths

From different locations:

| Script Location | Import Path |
|-----------------|-------------|
| `projects/{name}/scripts/*.ts` | `../../../gemini/dist/index.js` |
| `gemini/tests/scripts/*.ts` | `../../dist/index.js` |
| Root level `*.ts` | `./gemini/dist/index.js` |
