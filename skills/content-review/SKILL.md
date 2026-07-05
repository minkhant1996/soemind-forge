---
name: content-review
description: Review content plans, scripts, image prompts, video prompts, and thumbnails BEFORE generating to catch issues early and save money. Use before any expensive generation. Keywords - review prompt, check script, validate plan, review thumbnail, review before generating, save money, catch errors.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Content Review (Pre-Generation)

**Review content BEFORE spending money on generation.** Catch issues in plans, scripts,
and prompts early - a 1-second review can save $0.07-$20+ in wasted generations.

All review functions are available via the CLI:

```bash
node workflows/cli.cjs list   # show all commands (reviewScript, reviewImagePrompt, reviewVideoPrompt, reviewThumbnail, reviewContentPlan, reviewBatch, ...)
```

---

## Why Review First?

| Content Type | Generation Cost | Review Cost |
|--------------|-----------------|-------------|
| Script/Hook | $0.05-0.50 (TTS) | FREE |
| Thumbnail | $0.067-0.15 | FREE |
| Image | $0.067-0.15 | FREE |
| Video (30s) | $0.90-6.00 | FREE |
| Carousel (10 slides) | $0.67 | FREE |

**One failed video = 10-100x the cost of reviewing first.**

---

## What Gets Caught

### Script Review (`reviewScript`)

| Issue | Severity | Why It Matters |
|-------|----------|----------------|
| Restricted words (guarantee, cure) | ERROR | Brand/legal violations |
| Script too long for duration | WARNING | Rushed delivery, bad pacing |
| Script too short | WARNING | Awkward pauses, dead air |
| No clear CTA | SUGGESTION | Missed conversion opportunity |
| Long hook (first sentence) | SUGGESTION | Loses attention in first 3s |

### Image Prompt Review (`reviewImagePrompt`)

| Issue | Severity | Why It Matters |
|-------|----------|----------------|
| Text in prompt | ERROR | AI generates garbled text |
| Logo in prompt | ERROR | Logos render poorly |
| Animation terms | ERROR | Images are static |
| No style keywords | SUGGESTION | Generic results |
| No lighting direction | SUGGESTION | Flat lighting |
| Person without reference | WARNING | Inconsistent character |

### Video Prompt Review (`reviewVideoPrompt`)

| Issue | Severity | Why It Matters |
|-------|----------|----------------|
| Text/captions in prompt | ERROR | Garbled on-screen text |
| Conflicting camera moves | ERROR | Impossible to render |
| Multiple scenes in one prompt | ERROR | Use multi-shot workflow |
| Transitions in prompt | ERROR | Belongs in editing |
| No camera movement | SUGGESTION | Static, boring footage |
| Veo + speaking character | WARNING | No native lip-sync |
| Seedance + no dialogue | ERROR | Lip-sync needs dialogue |

### Thumbnail Review (`reviewThumbnail`) - NEW

| Issue | Severity | Why It Matters |
|-------|----------|----------------|
| Person but no character reference | ERROR | Inconsistent face across content |
| Text/logo in prompt | ERROR | AI generates garbled text |
| Small face | WARNING | Unrecognizable at thumbnail size |
| Multiple faces | WARNING | Confusing at small size |
| Busy background | WARNING | Reduces thumbnail impact |
| No expression/emotion | WARNING | Boring, no curiosity |
| Video thumbnail mismatch | ERROR | Must match video character |
| No high-contrast colors | SUGGESTION | Doesn't stand out in feed |
| No text space | SUGGESTION | No room for post-production text |

**Special Output:**
- `recommendedWorkflow`: `'generateImageVariation'` or `'generateSingleImage'`
- `characterStatus`: `'has-reference'`, `'needs-reference'`, or `'not-needed'`
- `nextSteps`: Array of actions to take

### Content Plan Review (`reviewContentPlan`)

| Issue | Severity | Why It Matters |
|-------|----------|----------------|
| Unfilled placeholders | ERROR | Incomplete plan |
| Missing required sections | WARNING | Incomplete brief |
| Brand restriction violation | ERROR | Off-brand content |
| No cost estimate | SUGGESTION | Budget tracking |

---

## How to Use

### 1. Review a Script Before TTS/Video

```bash
node workflows/cli.cjs reviewScript '{"script":"This product will cure your problems guaranteed!","targetDuration":15,"platform":"tiktok","restrictions":["cure","guaranteed","risk-free"],"contentType":"ad"}'
# Returns { data: { pass, issues: [{ severity, message }], potentialSavings } }
# If data.pass is false, STOP and fix issues before running generateVoiceover.
```

### 2. Review an Image Prompt Before Generation

```bash
node workflows/cli.cjs reviewImagePrompt '{"prompt":"Professional woman holding product with price tag showing $29","aspectRatio":"9:16","restrictions":["price","discount"],"expectsPerson":true,"characterDescription":"Woman, 30s, dark hair, business casual"}'
# Returns { data: { pass, summary } }; if data.pass is false, fix issues before generating.
```

### 3. Review a Video Prompt Before Generation

```bash
node workflows/cli.cjs reviewVideoPrompt '{"prompt":"Camera zooms in while panning left, text appears showing \"50% OFF\"","duration":8,"provider":"veo","restrictions":["text","discount"]}'
# data.pass === false; issues:
#   - [ERROR] Text in prompts will be garbled
#   - [ERROR] Conflicting camera movements
#   - [ERROR] Contains restricted word: "discount"
```

### 4. Review a Thumbnail Before Generation (IMPORTANT)

```bash
# hasCharacterReference false = no reference provided; forVideo true = this is for a video
node workflows/cli.cjs reviewThumbnail '{"prompt":"Person with excited expression on blue background","thumbnailType":"youtube","includesPerson":true,"hasCharacterReference":false,"forVideo":true}'
# data.pass === false
# data.characterStatus === 'needs-reference'
# data.nextSteps === [
#   '1. Generate character keyframe: generateSingleImage() with detailed description',
#   '2. Register in asset registry: registerAsset()',
#   '3. Generate thumbnail: generateImageVariation() with reference'
# ]
```

**Thumbnail with character reference (correct):**
```bash
node workflows/cli.cjs reviewThumbnail '{"prompt":"Same person with shocked expression, mouth open, high contrast","thumbnailType":"youtube","includesPerson":true,"hasCharacterReference":true,"characterReferencePath":"projects/my-project/assets/characters/char-main.png","forVideo":true,"videoCharacterPath":"projects/my-project/assets/characters/char-main.png"}'
# data.pass === true
# data.recommendedWorkflow === 'generateImageVariation'
# data.nextSteps === ['Use generateImageVariation() with referenceImagePath']
```

### 4. Review a Content Plan Before Generation

```bash
node workflows/cli.cjs reviewContentPlan '{"planPath":"projects/my-project/content-plans/day-01/content-01-video.md","brandPath":"projects/my-project/templates/brand.md","contentType":"video"}'
# Returns { data: { pass, issues } }; if data.pass is false, the plan needs fixes.
```

### 5. Batch Review Multiple Prompts

```bash
node workflows/cli.cjs reviewBatch '{"imagePrompts":["Product hero shot, studio lighting","Woman using product with text showing features"],"videoPrompts":["Camera dollies in on product, premium feel","Character speaks to camera with caption overlay"],"scripts":["This will cure your problems...","Try it free, link in bio."],"restrictions":["cure","guaranteed","caption"]}'
# Returns { data: { pass, averageScore, totalPotentialSavings } }
```

---

## Workflow Integration

### Before Image Generation

```
1. Write image prompt
2. reviewImagePrompt() ← REVIEW
3. Fix any errors
4. generateSingleImage() or generateImageVariation()
```

### Before Video Generation

```
1. Write video prompt
2. reviewVideoPrompt() ← REVIEW
3. Fix any errors
4. generateSingleImage() keyframe (preview) — or generateStoryboard() for multi-scene
5. reviewOutput() (QA the keyframe)
6. generateVideoFromImage() / generateSpeakingVideoFromImage()
```

### Before Thumbnail Generation (CRITICAL)

```
1. ASK: "Does thumbnail include a person?"
2. If YES: Check asset registry for character reference
3. reviewThumbnail() ← REVIEW (checks reference requirement)
4. If needs-reference:
   a. Generate character keyframe first
   b. Register in asset registry
   c. THEN generate thumbnail with reference
5. If has-reference: generateImageVariation()
6. If faceless: generateSingleImage()
```

### Before TTS/Voiceover

```
1. Write script
2. reviewScript() ← REVIEW
3. Fix any errors (pacing, restrictions)
4. generateVoiceover()
```

### Before Campaign Generation

```
1. Create content plan
2. reviewContentPlan() ← REVIEW
3. Fix any errors
4. Extract prompts/scripts
5. reviewBatch() ← REVIEW ALL
6. Generate content
```

---

## Review Result Format

All review functions return:

```typescript
{
  pass: boolean,           // false if any errors
  score: number,           // 0-100
  issues: [{
    category: string,      // 'restrictions', 'prompt-quality', 'pacing', etc.
    severity: 'error' | 'warning' | 'suggestion',
    message: string,       // What's wrong
    suggestion?: string,   // How to fix
    location?: string,     // Where in the content
  }],
  summary: string,         // Human-readable summary
  potentialSavings: number // $ saved by fixing before generating
}
```

**Thumbnail review returns additional fields:**

```typescript
{
  ...baseFields,
  recommendedWorkflow: 'generateImageVariation' | 'generateSingleImage',
  characterStatus: 'has-reference' | 'needs-reference' | 'not-needed',
  nextSteps: string[]      // Step-by-step actions to take
}
```

---

## Acting on Results

```
pass === true   → Safe to generate
pass === false  → STOP. Fix errors first.

For each issue:
  severity === 'error'      → MUST fix before generating
  severity === 'warning'    → Should fix, user can override
  severity === 'suggestion' → Nice to have, optional
```

**Always show the user:**
1. The issues list
2. The potential savings
3. Suggested fixes

---

## Cost Savings Examples

| Scenario | Without Review | With Review |
|----------|----------------|-------------|
| Text in 5 image prompts | $0.34 wasted | $0 (caught) |
| Conflicting camera in 30s video | $2.40 wasted | $0 (caught) |
| Restriction violation in script | $0.05 + $6 video | $0 (caught) |
| Thumbnail without character ref | $0.10 + inconsistent branding | $0 (caught) |
| Incomplete plan → bad outputs | $10+ wasted | $0 (caught) |

**Review costs pennies (text-only LLM calls, budget-gated). Generation costs real money.**

---

## Quick Reference

| Function | Input | Checks |
|----------|-------|--------|
| `reviewScript` | script text, duration, restrictions | Pacing, restrictions, hook, CTA |
| `reviewImagePrompt` | prompt, aspect, restrictions | Text, animation, style, lighting |
| `reviewVideoPrompt` | prompt, duration, provider | Text, camera, transitions, provider fit |
| **`reviewThumbnail`** | prompt, type, includesPerson, hasRef | Character ref, text/logo, expression, contrast |
| `reviewContentPlan` | plan path, brand path | Completeness, placeholders, brand |
| `reviewBatch` | arrays of prompts/scripts | All of the above |
