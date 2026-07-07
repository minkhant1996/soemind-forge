# Creating a Custom Workflow

> How to add your own reusable, agent-callable workflow function to **SoeMind Forge**.

A **workflow** is a single async function that takes a typed input object and returns a
standardized `WorkflowResult<T>`. Agents call it instead of writing generation code from
scratch — the function owns all the boilerplate: input validation, retry/backoff, file
saving, FFmpeg assembly, and cost reporting.

There are 15 built-in workflows in [`index.ts`](./index.ts) (see [WORKFLOWS.md](./WORKFLOWS.md)
for the full list). This guide shows how to add a 16th.

---

## The contract every workflow follows

```typescript
async function myWorkflow(input: MyInput): Promise<WorkflowResult<MyOutput>>
```

```typescript
// From types.ts — the shape ALL workflows return
interface WorkflowResult<T> {
  success: boolean;
  data?: T;                          // present when success === true
  error?: { code: string; message: string };  // present when success === false
}

interface CostInfo {
  totalCost: number;
  breakdown: Record<string, number>;
}
```

**Rules:**
1. **Never throw to the caller.** Catch everything and return a `WorkflowResult`. Agents
   check `result.success`, not `try/catch`.
2. **Always report cost.** Every output `data` includes a `cost: CostInfo`.
3. **Own the side effects.** Create directories, write files, and return the final path(s)
   in `data` — the caller should not have to touch the filesystem.
4. **Validate inputs first**, before spending any tokens.

---

## Anatomy of a workflow (the 7-part skeleton)

Every function in `index.ts` follows the same shape. Copy this skeleton:

```typescript
export async function myWorkflow(
  input: MyInput
): Promise<WorkflowResult<MyOutput>> {

  // 1. VALIDATE INPUT — fail fast, before any API call
  if (!input.prompt || input.prompt.trim().length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  try {
    // 2. PREPARE — make output dirs, read reference files
    ensureDir(path.dirname(input.outputPath));

    // 3. GENERATE — call a low-level gemini fn (or another workflow) inside withRetry
    const result = await withRetry(
      () => gemini31FlashImage({ userPrompt: input.prompt, config: { imageSize: '1K' } }),
      { maxRetries: 3 },
      'My workflow'           // label shown in retry logs
    );

    // 4. CHECK API RESULT
    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || 'Generation failed'
      );
    }
    if (!result.data.images.length) {
      return createErrorResult(WorkflowErrorCodes.NO_OUTPUT, 'No output was generated');
    }

    // 5. SAVE OUTPUT — wrap writes so disk errors become clean results
    try {
      fs.writeFileSync(input.outputPath, result.data.images[0].data);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    // 6. RETURN SUCCESS — include path(s) + cost
    return {
      success: true,
      data: {
        outputPath: input.outputPath,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { image: result.data.cost.totalCost },
        },
      },
    };

  } catch (error) {
    // 7. CATCH-ALL — never let an exception escape
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] myWorkflow failed: ${message}`);
    return createErrorResult(code, message);
  }
}
```

---

## Step-by-step: add a workflow to the library

This is the **recommended** path — your function lives in `index.ts`, reuses all the
internal helpers, and is exported for every agent automatically.

### 1. Define the input/output types in `types.ts`

```typescript
// workflows/types.ts

export interface ProductShotInput {
  prompt: string;
  outputPath: string;
  aspectRatio?: AspectRatio;      // reuse the shared union types
  imageSize?: ImageSize;
}

export interface ProductShotOutput {
  imagePath: string;
  cost: CostInfo;
}
```

Reuse the shared types already defined at the top of `types.ts` (`AspectRatio`,
`ImageSize`, `VideoQuality`, `VoiceName`, `Platform`, `CostInfo`, …) instead of inventing
new string unions.

### 2. Import your types in `index.ts`

Add them to the existing `import type { … } from './types.js'` block:

```typescript
import type {
  // …existing types…
  ProductShotInput,
  ProductShotOutput,
} from './types.js';
```

### 3. Write the function in `index.ts`

Add it at the bottom, following the skeleton above, with a numbered banner comment to
match the house style:

```typescript
// =============================================================================
// WORKFLOW 16: PRODUCT SHOT
// =============================================================================

/**
 * Generate a clean product hero shot.
 *
 * Use for: Catalog images, ad hero frames, thumbnails.
 */
export async function generateProductShot(
  input: ProductShotInput
): Promise<WorkflowResult<ProductShotOutput>> {
  // …skeleton…
}
```

### 4. Build

```bash
cd workflows && npm run build
```

This runs `tsc` and rewrites the import path in `dist/` (the `fix-paths` step). If it
compiles, your function is exported from `workflows/dist/index.js`.

### 5. Wire an agent or skill to call it

Point the relevant `SKILL.md` / agent file at the new function so agents use it instead of
writing inline code:

````markdown
```typescript
import { generateProductShot } from '../../../workflows/dist/index.js';

const result = await generateProductShot({
  prompt: 'Matte black water bottle on marble, soft studio light',
  outputPath: 'projects/{name}/output-contents/hero.png',
});

if (result.success) {
  console.log('Saved:', result.data.imagePath, '— $' + result.data.cost.totalCost);
} else {
  console.error(result.error.code, result.error.message);
}
```
````

---

## Composable primitives

Inside a workflow you call **low-level gemini functions** (one model call each) or **other
workflows** (to compose bigger pipelines). Import them from the gemini library:

```typescript
import { gemini25Flash, gemini31FlashImage, generateVideo, textToSpeech,
         multiSpeakerTTS, generateMusic } from '../gemini/dist/index.js';
```

| Primitive | Produces | Notes |
|-----------|----------|-------|
| `gemini25Flash({ systemPrompt, userPrompt, imageInput? })` | text | Scripts, captions, planning, image analysis |
| `gemini31FlashImage({ userPrompt, imageInput?, config })` | image bytes | `config: { aspectRatio, imageSize, personGeneration? }` |
| `generateVideo({ model, prompt, referenceImage?, config })` | video bytes | `model` from `getVeoModel(quality)` |
| `textToSpeech(text, voiceName, voiceSettings?)` | audio bytes | Single speaker |
| `multiSpeakerTTS(text, speakers[])` | audio bytes | Dialogue / podcast |
| `generateMusic({ model, prompt, config })` | audio bytes | Lyria; `model: 'lyria-3' | 'lyria-3-pro'` |

Every primitive returns `{ success, data, error }` with `data.cost.totalCost`.

---

## Helper reference (internal to `index.ts`)

These live in `index.ts` and are available to any function you add **in that file**. They
are intentionally not exported — that is why adding to the library is the recommended path.

| Helper | Use |
|--------|-----|
| `withRetry(fn, config, label)` | Wrap any API call. Retries on rate-limit / 5xx / network with exponential backoff. `config`: `{ maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier }` |
| `createErrorResult(code, message)` | Build a failed `WorkflowResult` |
| `getErrorCode(error)` | Map an exception to a `WorkflowErrorCodes` value |
| `ensureDir(dirPath)` | `mkdir -p` with error handling |
| `validateImageFile(path)` | Throw if missing/unreadable/not an image type |
| `getMimeType(path)` | Derive MIME from extension |
| `getVeoModel(quality)` | `'lite' | 'fast' | 'standard' | 'high'` → Veo model id |
| `toVideoAspectRatio(ratio)` | Clamp `4:5` → `9:16` for Veo |
| `sleep(ms)` | Delay between batched requests |

### Error codes (`WorkflowErrorCodes`, exported)

`RATE_LIMIT` · `API_ERROR` · `QUOTA_EXCEEDED` · `INVALID_INPUT` · `FILE_NOT_FOUND` ·
`INVALID_FILE_TYPE` · `GENERATION_FAILED` · `NO_OUTPUT` · `PARTIAL_FAILURE` ·
`FFMPEG_ERROR` · `FILE_WRITE_ERROR` · `UNKNOWN_ERROR`

---

## Worked example: a *composite* workflow

Workflows can call other workflows. Here is a "social bundle" that produces a thumbnail
**and** a voiceover in one call by composing two existing workflows — note how it forwards
partial failure instead of throwing.

```typescript
// types.ts
export interface SocialBundleInput {
  topic: string;
  script: string;
  outputDir: string;
  voiceName?: VoiceName;
}
export interface SocialBundleOutput {
  thumbnailPath: string;
  voiceoverPath: string;
  cost: CostInfo;
}

// index.ts
export async function generateSocialBundle(
  input: SocialBundleInput
): Promise<WorkflowResult<SocialBundleOutput>> {
  if (!input.topic || !input.script || !input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'topic, script and outputDir are required');
  }

  try {
    ensureDir(input.outputDir);

    // Reuse existing workflows as building blocks
    const thumb = await generateSingleImage({
      prompt: `Eye-catching thumbnail about: ${input.topic}. No text.`,
      outputPath: path.join(input.outputDir, 'thumbnail.png'),
      aspectRatio: '9:16',
    });
    if (!thumb.success) return createErrorResult(thumb.error!.code as any, thumb.error!.message);

    const vo = await generateVoiceover({
      script: input.script,
      outputPath: path.join(input.outputDir, 'voiceover.wav'),
      voiceName: input.voiceName || 'Kore',
    });
    if (!vo.success) return createErrorResult(vo.error!.code as any, vo.error!.message);

    const totalCost = thumb.data!.cost.totalCost + vo.data!.cost.totalCost;
    return {
      success: true,
      data: {
        thumbnailPath: thumb.data!.imagePath,
        voiceoverPath: vo.data!.audioPath,
        cost: { totalCost, breakdown: { thumbnail: thumb.data!.cost.totalCost, voiceover: vo.data!.cost.totalCost } },
      },
    };
  } catch (error) {
    return createErrorResult(getErrorCode(error), error instanceof Error ? error.message : 'Unknown error');
  }
}
```

**Partial-success pattern (multi-item loops):** when a workflow generates many items (e.g.
carousel slides, video clips), don't abort on the first failure. Collect what succeeded,
record what failed, and return `success: true` with an `error` of code
`PARTIAL_FAILURE`. See `generateCarousel` and `generateVideoWithVoiceover` in `index.ts`
for the reference implementation.

---

## Alternative: a project-specific workflow (no library edit)

For a one-off you don't want in the shared library, write a standalone script under a
project. You lose access to the internal helpers, so import the **exported** pieces and keep
it simple:

```typescript
// projects/{name}/scripts/my-custom-flow.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Reuse finished workflows…
import { generateSingleImage, WorkflowErrorCodes } from '../../../workflows/dist/index.js';
// …or drop to the raw model calls:
import { gemini31FlashImage } from '../../../gemini/dist/index.js';

const result = await generateSingleImage({
  prompt: 'Studio product shot',
  outputPath: path.join(__dirname, '..', 'output-contents', 'shot.png'),
});
console.log(result.success ? result.data.imagePath : result.error);
```

Run it:

```bash
npx ts-node --esm projects/{name}/scripts/my-custom-flow.ts
```

Prefer the library path when the workflow is reusable; use a project script only for
genuinely one-off pipelines.

---

## Checklist before you ship a workflow

- [ ] Input + output interfaces added to `types.ts`, reusing shared unions
- [ ] Function follows the 7-part skeleton (validate → prepare → generate → check → save → return → catch)
- [ ] Every API call wrapped in `withRetry(...)`
- [ ] Never throws to the caller — all paths return a `WorkflowResult`
- [ ] Output includes a `cost: CostInfo`
- [ ] `cd workflows && npm run build` compiles clean
- [ ] A `SKILL.md` / agent references the new function (so agents call it, not inline code)
- [ ] Added to the Quick Reference table in [WORKFLOWS.md](./WORKFLOWS.md)
```

