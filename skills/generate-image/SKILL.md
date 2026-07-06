---
name: generate-image
description: Generate images using Gemini 3 Image (Nano Banana). Use for thumbnails, carousels, infographics, social graphics, product photos.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Generate Image

## ⚠️ STOP: COMPLETE THIS CHECKLIST BEFORE WRITING ANY CODE

**You MUST complete ALL steps below and SHOW output to user before generating.**

```
□ Step 0: RUN content-preflight (classify topic/visual mode, resolve required assets)
□ Step 1: ASK user "Does this image include a person/character?"
□ Step 2: Look up the character/product in the asset registry (resolveAsset) — SHOW result
□ Step 3: If a locked character asset exists → TELL user you will reuse its ref files
□ Step 4: READ project.md and brand.md templates
□ Step 5: ASK user to confirm workflow selection
□ Step 6: THEN generate using workflow function
```

**DO NOT skip to code. DO NOT assume. SHOW each step.**

---

## CRITICAL: CALL THE WORKFLOW CLI — DO NOT WRITE A SCRIPT

**DO NOT write raw API calls. DO NOT author a `.cjs`/`.ts` file that imports these
functions. RUN the workflow as a CLI command:**

```bash
node workflows/cli.cjs <command> '<json-args>'      # or @args.json for long prompts
```

Image commands: `generateSingleImage`, `generateImageVariation`, `generateCarousel`,
`generateCarouselFromRef`, `generateImageOptions`, `finalizeImage`, `generateStoryboard`,
`generateCharacterSheet`, `analyzeImage`. Example:

```bash
node workflows/cli.cjs generateSingleImage \
  '{"prompt":"...","outputPath":"projects/{name}/output-contents/thumb.png","aspectRatio":"9:16"}'
```

**For each command's argument shape: Read `workflows/WORKFLOWS.md`.**

> **Expensive image (thumbnail, hero, ad, 2K/4K)?** Offer the user cheap options first:
> `generateImageOptions()` (512px) → they pick → `finalizeImage()` at 2K. See the
> `preview-pick` skill. Don't blind-spend on a single high-res gen.

---

## MANDATORY STEPS BEFORE GENERATING (DO NOT SKIP)

### Step 1: Ask About Person/Character (REQUIRED)

**ALWAYS ask the user:**
1. **Does this image include a person/character?**
   - Yes → Need character reference OR will generate one
   - No → Product-only or abstract image

2. **If yes, ask:**
   - Do you have a character reference image in assets?
   - Should we generate a character keyframe first?

### Step 2: Look Up Assets in the Registry (REQUIRED) - SHOW RESULTS TO USER

**Don't guess from filenames.** Read the project's asset registry — it records every
reusable character/product with validated paths. (Pre-flight usually populated it already;
see `skills/content-preflight/SKILL.md`.)

```bash
node workflows/cli.cjs loadAssetConfig '["{name}"]'
node workflows/cli.cjs resolveAsset '["{name}","char-main"]'   # character id from the content plan
node workflows/cli.cjs resolveAsset '["{name}","prod-main"]'
# → { "ok": true, "existing": ["..."], "missing": [] }
```

**Then TELL the user what you found:**

```
Asset registry (projects/{name}/config/assets.yaml):
  ✓ character char-main  → 3 refs, locked  (will reuse for consistency)
  ✓ product   prod-main  → 2 refs

Reusing char-main's reference images — not regenerating the character.
```

- `char.ok === true` → pass `char.existing[...]` as the reference image(s). **Do not
  re-describe or regenerate** a locked character.
- `char.ok === false` → resolve via pre-flight's provide/generate flow, then
  `registerAsset(...)` so it's saved for next time.
- **Priority:** character reference > product reference when the image has a person.

### Step 3: Read Project Templates (REQUIRED)

```bash
cat projects/{name}/templates/project.md
cat projects/{name}/templates/brand.md
```

### Step 4: Read Workflow Documentation (REQUIRED)

```bash
cat workflows/WORKFLOWS.md
```

---

## CHARACTER CONSISTENCY (CRITICAL)

**Problem:** Each image generation creates a NEW random person.

**Solution:** Use the SAME character reference image for ALL images.

### Workflow for Character Consistency (registry-driven):

1. **Resolve the character from the registry:**
   ```bash
   node workflows/cli.cjs loadAssetConfig '["{name}"]'
   node workflows/cli.cjs resolveAsset '["{name}","char-main"]'   # → { "ok": true, "existing": ["..."], "missing": [] }
   ```

2. **If `char.ok` → reuse the SAME ref file (its validated, on-disk path):**
   ```bash
   # referenceImagePath = the resolved char.existing[0] path
   node workflows/cli.cjs generateImageVariation '{"referenceImagePath":"projects/{name}/assets/characters/char-main-front.png","prompt":"Same person in office setting","outputPath":"projects/{name}/output-contents/image.png"}'
   ```

3. **If not (no asset yet) → generate ONCE, then register it:**
   ```bash
   # Step 1: Generate the character keyframe one time
   node workflows/cli.cjs generateSingleImage '{"prompt":"Woman in her 30s, dark hair, professional attire, neutral expression, facing camera","outputPath":"projects/{name}/assets/characters/char-main-front.png","aspectRatio":"1:1","imageSize":"1K"}'

   # Step 2: Save to the registry so every future image/carousel reuses it
   node workflows/cli.cjs registerAsset '["{name}","characters",{"id":"char-main","label":"Main character","source":"generated","status":"ready","locked":true,"files":{"front":"assets/characters/char-main-front.png"}},{"date":"<today ISO>"}]'

   # Step 3: Use it as the reference
   node workflows/cli.cjs generateImageVariation '{"referenceImagePath":"projects/{name}/assets/characters/char-main-front.png","prompt":"Same person in different setting...","outputPath":"projects/{name}/output-contents/variation.png"}'
   ```

4. **For carousels with consistent character** — resolve once, pass the ref to every slide:
   ```bash
   node workflows/cli.cjs resolveAsset '["{name}","char-main"]'   # ref = char.existing[0]
   node workflows/cli.cjs generateCarouselFromRef '{"referenceImagePath":"projects/{name}/assets/characters/char-main-front.png","slides":[{"prompt":"Same person in scene 1"},{"prompt":"Same person in scene 2"},{"prompt":"Same person in scene 3"}],"outputDir":"projects/{name}/output-contents/carousel"}'
   ```

---

## PRODUCT CONSISTENCY (same pattern as characters)

Products are registry assets too — resolve before generating, and **register a generated
product shot/mockup so it's reused** (don't re-mockup the same product each time).

```bash
# Reuse an existing product reference — if ok, pass existing[0] as referenceImagePath
node workflows/cli.cjs resolveAsset '["{name}","prod-main"]'   # → { "ok": true, "existing": ["..."], "missing": [] }

# After generating a NEW product image/mockup, save it for reuse:
# source: "generated" | "provided" | "mockup" (pre-launch)
node workflows/cli.cjs registerAsset '["{name}","products",{"id":"prod-main","label":"Hero product","source":"generated","status":"ready","files":["assets/products/prod-main-front.png"],"key_features":["feature 1","feature 2"]},{"date":"<today ISO>"}]'
```

> A real product you can photograph should be **provided**, not mockup-generated — ask for
> a photo first. Only `source: mockup` a pre-launch product with no photo.

---

## PRODUCT SHOTS (e-commerce) → use the preset library

For "product photo", "packshot", "listing image", "lifestyle shot", "seasonal
version", "ad variations from this photo": **read
`workflows/PRODUCT-SHOT-GUIDE.md` first.** 26 tested presets ship as the
`productShot` field on `generateImageVariation`.

**The flow:**

1. **Get the real product photo** — resolve `prod-*` from the registry (or
   ask the user for one). A messy supplier/phone photo is a fine base.
   Never generate the product itself from text.
2. **Ask which channel** — marketplace listing / own-site PDP / paid ads /
   email-banner / Instagram. Propose the preset set from the guide's
   channel table (e.g. marketplace → `pure-white-packshot` +
   `multi-angle` + `texture-closeup` + `in-hand-scale`).
3. **Draft cheap → approve → finalize sharp:** iterate with
   `"imageModel":"lite"` ($0.0336), then regenerate the approved direction
   at `"imageSize":"2K"`.

```bash
node workflows/cli.cjs generateImageVariation '{"referenceImagePath":"<prod-main existing[0]>","productShot":"pure-white-packshot","prompt":"The ceramic honey jar with the gold lid.","outputPath":"…/packshot-white.png","aspectRatio":"1:1","imageSize":"2K"}'
```

The preset supplies scene + lighting + a fidelity clause (exact
shape/branding/label preserved — appended automatically); your `prompt`
carries only the specifics (product name, props, surface/light swaps).
QA every shot vs the reference with `reviewOutput` — label text and
proportions must match; marketplaces treat the image as the trust signal.
Presets involving people (`model-usage`, `hands-*`, `in-hand-scale`) need
`"personGeneration":"allow"`.

---

## REQUIRED QUESTIONS

### Always ask these questions:

1. **Does this image include a person/character?**
   - Yes → Check for character reference in assets
   - No → Product or abstract image

2. **What type of image?**
   - Single image → `generateSingleImage()` or `generateImageVariation()`
   - Carousel → `generateCarousel()` or `generateCarouselFromRef()`

3. **Platform?** (determines aspect ratio)

4. **Reference images?** (check assets folder)

5. **For carousels:** How many slides?

---

## WORKFLOW SELECTION

| User Wants | Has Person? | Has Reference? | Use Workflow |
|------------|-------------|----------------|--------------|
| Single image (no person) | No | No | `generateSingleImage()` |
| Product image | No | **YES** | `generateImageVariation()` |
| Image with person | **YES** | No | `generateSingleImage()` (generate keyframe first) |
| Image with person | **YES** | **YES** | `generateImageVariation()` |
| Carousel (no person) | No | No | `generateCarousel()` |
| Carousel with person | **YES** | **YES** | `generateCarouselFromRef()` |

**RULE: If image has person AND character image exists → ALWAYS use character image as reference.**

---

## WORKFLOW EXAMPLES

### 1. Single Image (no person)
```bash
node workflows/cli.cjs generateSingleImage '{"prompt":"Smartwatch on marble surface, soft studio lighting, product photography","outputPath":"projects/my-project/output-contents/product.png","aspectRatio":"1:1","imageSize":"1K"}'
```

### 2. Image Variation with Product Reference
```bash
node workflows/cli.cjs generateImageVariation '{"referenceImagePath":"projects/my-project/assets/product-watch.png","prompt":"Same product on wooden desk, morning light, minimalist setting","outputPath":"projects/my-project/output-contents/variation.png","aspectRatio":"1:1","imageSize":"1K"}'
```

### 3. Image with Character Reference (RECOMMENDED for consistency)
```bash
# Use character image from assets for consistency
node workflows/cli.cjs generateImageVariation '{"referenceImagePath":"projects/my-project/assets/characters/char-main-front.png","prompt":"Same person in modern office, checking smartwatch, professional lighting","outputPath":"projects/my-project/output-contents/lifestyle.png","aspectRatio":"9:16","imageSize":"1K"}'
```

### 4. Generating Character Keyframe First
```bash
# Step 1: Generate character keyframe and save to assets
node workflows/cli.cjs generateSingleImage '{"prompt":"Professional woman in her 30s, dark hair, neutral expression, business casual attire, facing camera, clean background","outputPath":"projects/my-project/assets/characters/char-main-front.png","aspectRatio":"1:1","imageSize":"1K","personGeneration":"allow"}'

# Step 2: Use keyframe for all subsequent images
node workflows/cli.cjs generateImageVariation '{"referenceImagePath":"projects/my-project/assets/characters/char-main-front.png","prompt":"Same person smiling while checking smartwatch in gym","outputPath":"projects/my-project/output-contents/gym-scene.png"}'
```

### 5. Carousel with Consistent Character
```bash
# All slides use same character reference
node workflows/cli.cjs generateCarouselFromRef '{"referenceImagePath":"projects/my-project/assets/characters/char-main-front.png","slides":[{"prompt":"Same person waking up, checking watch"},{"prompt":"Same person at gym, mid-workout"},{"prompt":"Same person at office, productive"},{"prompt":"Same person relaxing at home, peaceful"}],"outputDir":"projects/my-project/output-contents/lifestyle-carousel","aspectRatio":"1:1","imageSize":"1K"}'
```

---

## REFERENCE IMAGE PRIORITY

**When multiple assets exist, prioritize:**

1. **Character image** (if image has person) → Use for character consistency
2. **Product image** (if product-focused) → Use for product consistency

**NOTE:** API supports ONE reference image per request. If you need both character AND product:
1. Use character reference for image generation
2. Describe product in the prompt
3. Or generate separate product shots

---

## CRITICAL: NO TEXT IN IMAGE PROMPTS (for carousels)

❌ **NEVER include:**
- "Text says..."
- "Caption reads..."
- "Title: 5 Tips"

✅ **Only describe visuals:**
- Subject and action
- Environment/setting
- Lighting and mood
- Camera angle

Text is added via design tools in post-production.

---

## IMAGE PROMPT STRUCTURE

```
[SUBJECT] in [ENVIRONMENT], [LIGHTING],
[COMPOSITION/ANGLE], [STYLE], [MOOD]
```

**Example:**
```
Professional woman checking Apple Watch in modern minimalist office,
soft natural window light, medium close-up shot,
lifestyle photography style, confident and productive mood
```

### Prompt Templates by Type

**Product Shot:**
```
[Product] in [context/setting], [lighting style],
[camera angle], professional product photography,
[aesthetic] style
```

**Lifestyle Image with Person:**
```
[Person from reference] [using/with product] in [environment],
[natural/studio lighting], authentic [mood],
lifestyle photography, relatable
```

**Thumbnail:**
```
[Subject with expression], [background],
bold high contrast, eye-catching,
[platform] thumbnail style, 16:9
```

---

## COST REFERENCE

| Resolution | Cost/image |
|------------|------------|
| 1K | $0.067 |
| 2K | $0.10 |
| 4K | $0.15 |

Example: 10-slide carousel at 1K = ~$0.67

**Check the budget cap BEFORE generating** (the CLI hard-stops at `BUDGET_EXCEEDED`):

```bash
node workflows/cli.cjs checkBudget '["{name}", 0.67]'   # project name + estimated cost
```

---

## PIPELINE-FIRST + AUDIT TRAIL (MANDATORY)

- **Author the pipeline before generating** — even for a single image: save
  `<content-id>.pipeline.json` IN the content folder (nodes = CLI commands,
  `{{node.data.field}}` refs wire outputs to inputs), then
  `node workflows/cli.cjs runPipeline @<file>`. See `workflows/pipelines/README.md`.
- **prompts.txt in every content folder** — the exact image prompt(s); update on
  EVERY retry with a one-line RESULT note.
- **Manifest** — log each generation via the `createGenerationManifest` /
  `addManifestEntry` CLI commands (AGENT-GUIDE Step 5).

---

## OUTPUT

Save to: `projects/{name}/output-contents/{date}/`
- Single: `image.png` or `thumbnail.png`
- Carousel: `slide-01.png`, `slide-02.png`, etc.
- Character keyframes: `projects/{name}/assets/characters/char-main-front.png`

---

## PLATFORM SPECS

| Platform | Ratio | Resolution |
|----------|-------|------------|
| Instagram feed | 1:1 | 1080x1080 |
| Instagram portrait | 4:5 | 1080x1350 |
| Instagram story | 9:16 | 1080x1920 |
| YouTube thumbnail | 16:9 | 1280x720 |
| LinkedIn | 1:1 | 1080x1080 |
| Facebook | 16:9 | 1200x630 |

## Text on images → renderSlideStill (Remotion, $0)

Never ask the image model to render typography for final slides. Generate the
background text-free, then:
`node workflows/cli.cjs renderSlideStill '{"backgroundPath":"…","headline":"…","sub":"…","footer":"…","logoPath":"…","scrim":true,"outputPath":"…"}'`
(real Sora/Inter fonts, frosted scrim for busy backgrounds — see WORKFLOWS.md § Remotion).

## Baked-in text → imageModel "pro" (Nano Banana Pro, 2026-07-05)

For images that must CONTAIN typography (quote cards, posters, stat cards):
`generateSingleImage {..., "imageModel":"pro"}` — Gemini 3 Pro Image, $0.134,
state-of-the-art text rendering. Prompt with the exact text in quotes + font
style + color + position. ALWAYS QA spelling afterward (reviewOutput). Remotion
remains the $0 option and guarantees fonts; pro wins when you want the type
integrated INTO the art (texture, perspective, lighting).

## Bulk / previews → imageModel "lite" (Nano Banana 2 Lite, 2026-07-05)

For at-scale generation and cheap previews before committing to flash/pro:
`generateSingleImage {..., "imageModel":"lite"}` — Gemini 3.1 Flash Lite Image
(`gemini-3.1-flash-lite-image`), $0.0336/image flat at any size — half the cost
of flash 1K. Quality is below flash; don't use it for final hero images or
anything with typography. Ideal for /preview-pick option rounds and background
plates.
