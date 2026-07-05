---
name: content-preflight
description: MANDATORY pre-flight check that runs BEFORE any content plan or generation. Classifies the topic, verifies project/brand/product context, resolves the required reusable assets (characters, products, logos, voices) from the asset registry, and provides/generates whatever is missing — saving paths for reuse. Use whenever the user asks to plan a campaign, make a marketing plan, or create/generate any image, video, voiceover, or music.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Content Pre-flight

**Run this FIRST, every time, before planning or generating content.** It stops
the agent from writing generic prompts, re-describing the same character/product
for every piece, or generating with missing context.

Reference: [`templates/content-requirements.md`](../../templates/content-requirements.md)
(the matrix) and [`templates/assets.config.template.yaml`](../../templates/assets.config.template.yaml)
(the registry schema). Asset functions live in `workflows/dist/index.js`.

> **Gate:** do not proceed to a plan or generation until every **required** input
> for the chosen topic + visual mode is satisfied (or minimal mode is explicitly
> chosen) **and the user confirms.**

---

## STEP 1: Classify the request

Ask yourself (or the user, one question) two things:

1. **Topic type** — is this about a *product/service*, a *person*, or a *topic/idea*?
   Map to: `product` · `service` · `personal-brand` · `educational` ·
   `brand-awareness` · `event` · `announcement` · `community-cause` ·
   `entertainment` · `recruitment`.
2. **Visual mode** — who/what appears? `person` · `product-only` · `mixed` ·
   `faceless` · `mascot` · `ui-screens`.

Look the pair up in the **Requirements Matrix** to get the required inputs.

> If it doesn't fit any type, ask once: *"Is this about a specific
> product/service, a person, or a topic/idea?"* Default to `educational`.

---

## STEP 2: Check project context

```bash
ls projects/{name}/ 2>/dev/null
```

- **No project?** Offer: (a) create one now (`/plan-content` sets up the folder +
  templates), or (b) **minimal mode** — a quick one-off with no brand context.
  If minimal mode, **say so explicitly** and skip to STEP 5.
- **Project exists?** Read:
  - `projects/{name}/templates/project.md` → business, audience, pain points, offer, CTA
  - `projects/{name}/templates/brand.md` → colors, tone, restrictions, aesthetic
  Note any **empty required fields** (see the project template checklist).

Required-context rule by topic:
- `product` / `event(product)` → product info **required**
- `service` → offer + service area required (no object)
- `personal-brand` → who the person is required
- `educational` → topic + key points + source of truth required (don't hallucinate facts)
- brand fields → required for everything except minimal mode

If required project/brand fields are empty → **ask the user**, fill the template,
save it. Never fake stats, testimonials, press, or prices.

---

## STEP 3: Load the asset registry

```bash
node workflows/cli.cjs loadAssetConfig '["{name}"]'   # empty but valid if first run
node workflows/cli.cjs validateAssets '["{name}"]'    # catches missing files, dup ids, broken voice links
```

- If `config/assets.yaml` doesn't exist yet, create it from the template:
  ```bash
  mkdir -p projects/{name}/config projects/{name}/assets
  cp templates/assets.config.template.yaml projects/{name}/config/assets.yaml
  ```
- If `validateAssets` reports **errors** (missing files, duplicate ids), fix them
  before generating (re-ask path or regenerate). Report **warnings** to the user.

---

## STEP 4: Resolve required assets (provide / generate / reuse)

For each **required 🖼️/🎙️ asset** from the matrix (character, product, logo, voice…):

```bash
node workflows/cli.cjs resolveAsset '["{name}","char-founder"]'   # returns { ok, existing[], missing[] }
```

```
r.ok === true  → REUSE. Pass r.existing[...] as reference images. Do not re-describe.
r.ok === false → resolve it:
   ├── User has a file  → PROVIDE: get path → validate (exists, type, resolution)
   │                       → copy to assets/<type>/ → registerAsset(...)
   └── No file          → GENERATE: ask the asset's DETAIL questions
                           → generate (generateSingleImage / character sheet / etc.)
                           → STOP, show it, get approval
                           → save to assets/<type>/ → registerAsset(..., locked:true)
```

**Detail questions per asset type** are in `content-requirements.md §4`. For a
**character that must stay consistent across many pieces**, generate a small
character sheet (front + 3⁄4 + profile) and lock it.

### Registering a new asset (saves the path for reuse)

```bash
# source: "generated" | "provided" | "real-person"
node workflows/cli.cjs registerAsset '["{name}","characters",{"id":"char-founder","label":"Founder – Sarah","description":"…locked physical description…","source":"generated","status":"ready","locked":true,"files":{"front":"assets/characters/sarah-front.png","three_quarter":"assets/characters/sarah-34.png"},"linked_voice":"voice-sarah"},{"date":"<today ISO>"}]'   # returns WorkflowResult
```

Products → `'products'`, logos → `'logos'`, voices → `'voices'`,
locations → `'locations'`, music → `'music'`, style refs → `'style_references'`.

> **Always pass real, existing relative paths.** Files live under
> `projects/{name}/assets/`; registry paths are relative to the project root.

---

## STEP 5: Apply the edge-case checklist

Scan `content-requirements.md §5` and handle anything that applies. The high-value ones:

- **Real person / public figure / minors** → consent + `person_generation` policy;
  refuse celebrity/competitor likeness.
- **Pre-launch product with no photo** → mockup, marked `source: mockup`.
- **Sensitive claims** (health/finance/legal) → enforce `restrictions`, no
  "guaranteed/cure/risk-free".
- **Non-English / Myanmar script** → confirm font/script support.
- **Series/campaign** → lock character + location + voice + music once; every
  piece references the same ids.
- **"Just do it"** → still resolve required inputs; state every assumption.

---

## STEP 5b: Set a budget cap

Ask once per project (see the `cost-guard` skill) so no run silently overspends:

> "What's your budget for this project? I'll warn before going over."

```bash
node workflows/cli.cjs setBudgetCap '["{name}",50]'   # or null for no cap
```

Before any expensive run, `checkBudget(...)` the estimate; after each generation,
`recordCost(...)`.

## STEP 6: Confirm readiness

Show the user a readiness summary, then wait for go:

```
✅ PRE-FLIGHT — {project}
  Topic: {topicType}   Visual: {visualMode}
  Project brief: complete (or: missing {fields})
  Brand: loaded (or: minimal mode)
  Assets ready:
    ✓ product  prod-bottle      (2 refs)
    ✓ character char-founder    (3 refs, locked)
    ✓ voice    voice-sarah      (Kore, friendly)
    ⚠ logo     — none (end card will be skipped)
  Budget:  $12.50 / $50.00 spent  (remaining $37.50)
  Warnings: {validation warnings, if any}

Ready to {plan / generate}. Proceed? (yes / adjust)
```

On **yes** → hand off to `/plan-content` (for a plan) or the matching generate
skill (`/generate-video`, `/generate-image`, `/generate-voiceover`,
`/generate-music`), which now reuse the registered assets instead of asking again.

> Generating an expensive asset? Preview cheaply first (`preview-pick`), **QA the preview**
> (`qa-review`), then commit — and `recordCost` the spend.

---

## Quick reference — asset registry API

| Function | Purpose |
|----------|---------|
| `loadAssetConfig(name)` | Read `config/assets.yaml` (empty valid config if absent) |
| `resolveAsset(cfg, id)` | `{ ok, existing[], missing[] }` — files checked on disk |
| `findAsset(cfg, id)` | Locate an asset across collections |
| `registerAsset(name, collection, asset, { date })` | Upsert + save (returns `WorkflowResult`) |
| `validateAssets(cfg)` | `{ ok, issues[] }` — dup ids, missing files, broken voice links, consent |
| `pendingAssets(cfg)` | Ids still `needs-generation` / `placeholder` |
