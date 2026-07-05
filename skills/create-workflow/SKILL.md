---
name: create-workflow
description: Scaffold a new reusable workflow function in workflows/index.ts. Use when the user wants to "create a workflow", "add a workflow function", "make a reusable generation function", "extend the workflow library", or compose existing generators into a new pipeline.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Create a Custom Workflow

Add a new reusable, agent-callable function to the workflow library
(`workflows/index.ts`). Every workflow takes a typed input and returns a
`WorkflowResult<T>` — it owns validation, retry, file saving, and cost reporting so
agents never rewrite that boilerplate.

> Full reference: [`workflows/CREATING_WORKFLOWS.md`](../../workflows/CREATING_WORKFLOWS.md).
> This skill is the actionable, step-by-step version. **Read the reference once before
> starting** if you are unsure of the conventions.

## When This Skill Activates

- "Create / add a new workflow"
- "Make a reusable function for generating X"
- "I keep rewriting this prompt+save code — turn it into a workflow"
- "Compose generateImage + generateVoiceover into one call"

---

## STEP 1: Understand the Existing Library

**Always do this first** so the new function matches the house style and reuses helpers.

```bash
# See the 15 existing workflows + the Quick Reference table
sed -n '1,60p' workflows/WORKFLOWS.md
grep -n "export async function" workflows/index.ts
```

Read **one** similar existing function end-to-end as your template:
- Single asset (prompt → one file): read `generateSingleImage`
- Audio: read `generateVoiceover` or `generateMusicTrack`
- Multi-item loop (partial failure): read `generateCarousel`
- Composite (calls other workflows): see the worked example in `CREATING_WORKFLOWS.md`

---

## STEP 2: Ask the User the 4 Questions

Before writing code, confirm:

1. **What does it produce?** (image / video / audio / text / a bundle of several)
2. **What inputs does the agent provide?** (a raw `prompt`? structured fields? a `topic`
   the function expands itself?)
3. **Where does the output go?** (single `outputPath`, or an `outputDir` for many files)
4. **Build on what?** A low-level gemini call, or compose existing workflows?

Map the answer to an input style:

| Input style | Use when | Example |
|-------------|----------|---------|
| Raw prompt | Agent writes the full prompt | `generateSingleImage` |
| Structured fields | Function templates the prompt from parts | `generateSpeakingVideo` |
| Auto-planning | Function calls `gemini25Flash` to write content itself | `generateCarousel` |
| Composite | Chain existing workflows | `generateSocialBundle` (in the guide) |

---

## STEP 3: Define Types in `workflows/types.ts`

Add an input + output interface. **Reuse the shared unions** at the top of the file
(`AspectRatio`, `ImageSize`, `VideoQuality`, `VoiceName`, `Platform`, `CostInfo`) — do not
invent new string unions.

```typescript
export interface <Name>Input {
  prompt: string;          // or topic / script / structured fields
  outputPath: string;      // or outputDir for multi-file
  // ...optional params with sensible defaults
}

export interface <Name>Output {
  // path(s) to what was created
  cost: CostInfo;          // REQUIRED on every output
}
```

---

## STEP 4: Write the Function in `workflows/index.ts`

1. Add the new types to the existing `import type { … } from './types.js'` block.
2. If you call a new low-level primitive, add it to the
   `import { … } from '../gemini/dist/index.js'` block
   (`gemini25Flash`, `gemini31FlashImage`, `generateVideo`, `textToSpeech`,
   `multiSpeakerTTS`, `generateMusic`).
3. Append the function at the bottom with a numbered banner, following the **7-part
   skeleton**:

```typescript
// =============================================================================
// WORKFLOW <N>: <NAME>
// =============================================================================

/**
 * <one-line purpose>
 * Use for: <concrete use cases>
 */
export async function <name>(
  input: <Name>Input
): Promise<WorkflowResult<<Name>Output>> {
  // 1. VALIDATE — fail before spending tokens
  if (!input.prompt?.trim()) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Prompt is required');
  }
  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  try {
    // 2. PREPARE
    ensureDir(path.dirname(input.outputPath));

    // 3. GENERATE (always inside withRetry)
    const result = await withRetry(
      () => /* gemini primitive OR another workflow */,
      { maxRetries: 3 },
      '<Name> generation'
    );

    // 4. CHECK
    if (!result.success) {
      return createErrorResult(
        getErrorCode(new Error(result.error?.message)),
        result.error?.message || '<Name> failed'
      );
    }

    // 5. SAVE (wrap the write)
    try {
      fs.writeFileSync(input.outputPath, /* result bytes */);
    } catch (writeError) {
      return createErrorResult(
        WorkflowErrorCodes.FILE_WRITE_ERROR,
        `Failed to save: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
      );
    }

    // 6. RETURN with cost
    return {
      success: true,
      data: {
        /* path(s) */,
        cost: {
          totalCost: result.data.cost.totalCost,
          breakdown: { /* label */: result.data.cost.totalCost },
        },
      },
    };
  } catch (error) {
    // 7. CATCH-ALL — never throw to the caller
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Workflow] <name> failed: ${message}`);
    return createErrorResult(code, message);
  }
}
```

**Reuse these internal helpers** (they live in `index.ts`, that's why the function goes
there): `withRetry`, `ensureDir`, `createErrorResult`, `getErrorCode`, `validateImageFile`,
`getMimeType`, `getVeoModel`, `toVideoAspectRatio`, `sleep`.

**For multi-item loops** (slides, clips): don't abort on first failure — collect successes,
track failures, return `success: true` with `error.code = PARTIAL_FAILURE`. Copy the loop in
`generateCarousel`.

---

## STEP 5: Build

```bash
cd workflows && npm run build
```

`tsc` must compile clean (the `fix-paths` step rewrites the gemini import for `dist/`). Then
verify the export exists:

```bash
node --input-type=module -e "import('./dist/index.js').then(m=>console.log(typeof m.<name>))"
# expect: function
```

If `tsc` errors, fix types — do **not** ship a workflow that doesn't compile.

---

## STEP 6: Wire It Up So Agents Use It

A workflow nobody calls is dead code. Do both:

1. **Add a row** to the Quick Reference table in `workflows/WORKFLOWS.md`.
2. **Point a skill/agent at it** — find the relevant `SKILL.md` (in `skills/` or
   `workflows/*-content/`) or agent (`agents/*.md`) and replace any inline generation code
   with a call to the new function:

````markdown
```typescript
import { <name> } from '../../../workflows/dist/index.js';

const result = await <name>({ /* inputs */ });
if (result.success) console.log('Saved:', /* path */, '— $' + result.data.cost.totalCost);
else console.error(result.error.code, result.error.message);
```
````

---

## STEP 7: Confirm With a Checklist

```
[ ] Input + Output interfaces in types.ts (reused shared unions)
[ ] Function follows the 7-part skeleton
[ ] Every API call wrapped in withRetry()
[ ] Never throws — all paths return WorkflowResult
[ ] Output includes cost: CostInfo
[ ] `cd workflows && npm run build` compiles clean
[ ] Export verified at runtime
[ ] A SKILL.md / agent now calls it
[ ] Added to WORKFLOWS.md Quick Reference table
```

Report to the user: the function name, its signature, what it builds on, and the file(s)
you wired it into.

---

## Composable Primitives (what to build on)

| Primitive | Produces | Import from |
|-----------|----------|-------------|
| `gemini25Flash({ systemPrompt, userPrompt, imageInput? })` | text | `../gemini/dist/index.js` |
| `gemini31FlashImage({ userPrompt, imageInput?, config })` | image | `../gemini/dist/index.js` |
| `generateVideo({ model, prompt, referenceImage?, config })` | video | `../gemini/dist/index.js` |
| `textToSpeech(text, voiceName, voiceSettings?)` | audio | `../gemini/dist/index.js` |
| `multiSpeakerTTS(text, speakers[])` | audio | `../gemini/dist/index.js` |
| `generateMusic({ model, prompt, config })` | audio | `../gemini/dist/index.js` |
| **any existing workflow** | varies | same file (compose directly) |

All primitives return `{ success, data, error }` with `data.cost.totalCost`.
