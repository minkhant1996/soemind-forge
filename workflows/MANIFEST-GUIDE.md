# Generation Manifest Guide

**Always save a manifest alongside outputs** so reviewers (human or AI) can see exactly what prompts and parameters were used.

## Why Use Manifests?

| Problem | Manifest Solution |
|---------|-------------------|
| Bad output, can't remember what prompt | Exact prompt logged |
| Need to iterate on a specific generation | All parameters saved |
| Budget tracking per item | Cost per generation |
| Human/AI reviewer can't see context | Full audit trail |
| Can't reproduce a good result | All inputs captured |

## Quick Start

```typescript
import {
  createGenerationManifest,
  addManifestEntry,
  saveManifestReport,
} from './workflows/dist/index.js';

// 1. Create manifest at session start
const manifestPath = createGenerationManifest({
  projectName: 'my-project',
  outputDir: 'projects/my-project/output-contents/2026-06-28',
  context: {
    brandColors: ['#1a365d', '#d4a84b'],
    restrictions: ['no competitor logos'],
    characterRef: 'assets/characters/char-main.png',
  }
});

// 2. After EACH generation, log it
addManifestEntry({
  manifestPath,
  entry: {
    type: 'image',                          // image | video | voiceover | music
    model: 'gemini-3-pro-image',
    prompt: 'Your exact prompt here...',
    referenceImagePath: 'path/to/ref.png',  // optional
    parameters: {
      aspectRatio: '16:9',
      imageSize: '2K',
      duration: 8,                          // for video
      voiceName: 'Kore',                    // for voiceover
    },
    outputPaths: ['output/file.png'],
    cost: result.data?.cost || { totalCost: 0, breakdown: {} },
    status: result.success ? 'success' : 'failed',
    error: result.error?.message,           // if failed
    issues: ['typo in slide 3'],            // found during review
    reviewNotes: 'Needs regeneration',      // reviewer comments
  }
});

// 3. Generate report at end
const reportPath = saveManifestReport(manifestPath);
```

## Manifest Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `image\|video\|voiceover\|music\|carousel\|text` | Content type |
| `model` | string | Model used (e.g., `gemini-3-pro-image`) |
| `prompt` | string | **EXACT** prompt used |
| `referenceImagePath` | string? | Reference image if any |
| `parameters` | object | All config (aspect ratio, size, voice, etc.) |
| `outputPaths` | string[] | Generated file paths |
| `cost` | CostInfo | `{ totalCost, breakdown }` |
| `status` | `success\|failed\|needs-review` | Generation status |
| `error` | string? | Error message if failed |
| `issues` | string[]? | Problems found during review |
| `reviewNotes` | string? | Human/AI reviewer comments |

## Output Structure

```
projects/my-project/output-contents/2026-06-28/
├── manifest.json           # Machine-readable log (auto-generated)
├── manifest-report.md      # Human-readable report (call saveManifestReport)
├── slide-01.png
├── slide-02.png
├── video-01.mp4
├── voiceover.wav
└── ...
```

## Reading & Reviewing Manifests

```typescript
import { loadManifest, generateManifestReport } from './workflows/dist/index.js';

// Load manifest
const manifest = loadManifest('projects/my-project/output-contents/manifest.json');

// Get summary
console.log(`Total cost: $${manifest.totalCost}`);
console.log(`Images: ${manifest.summary.images}`);
console.log(`Videos: ${manifest.summary.videos}`);

// Find failed entries
const failed = manifest.entries.filter(e => e.status === 'failed');

// Find entries needing review
const needsReview = manifest.entries.filter(e => e.status === 'needs-review');

// Generate markdown report
const report = generateManifestReport('path/to/manifest.json');
console.log(report);
```

## Integration with Skills

All generation skills should:

1. **Create manifest** at session start
2. **Add entry** after each generation
3. **Save report** at session end
4. **Mark issues** when QA finds problems

```typescript
// Example in generate-video flow
const manifestPath = createGenerationManifest({ ... });

for (const scene of scenes) {
  const result = await generateVideoClip({ ... });

  addManifestEntry({
    manifestPath,
    entry: {
      type: 'video',
      model: 'veo-3.1-generate-1080p',
      prompt: scene.prompt,
      parameters: { duration: scene.duration, aspectRatio: '9:16' },
      outputPaths: [result.data.videoPath],
      cost: result.data.cost,
      status: result.success ? 'success' : 'failed',
    }
  });
}

saveManifestReport(manifestPath);
```

## Benefits for Review

When reviewing outputs, the manifest tells you:

1. **What went wrong?** → Check the exact prompt
2. **Why does it look different?** → Check parameters
3. **How much did this cost?** → Per-item cost breakdown
4. **Can we reproduce it?** → All inputs are logged
5. **What needs fixing?** → Status and issues fields
