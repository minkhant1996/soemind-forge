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

**Never assume which project — and never silently create a new one.** List what
exists and match the request against it first:

```bash
ls projects/ 2>/dev/null        # all existing projects
ls projects/{name}/ 2>/dev/null # the candidate
```

- **Request relates to an existing project** (same business, product line, brand,
  or audience — read its `project.md` to judge, don't match on name alone) →
  **ask:** *"This looks like it belongs to `projects/{existing}/` — continue
  there? You'd inherit its brand, characters, voices, and style refs, so
  everything stays consistent."* Only branch a new project if the user says so.
- **Genuinely new/unrelated** → **ask permission before creating:**
  *"No existing project fits — create `projects/{new-name}/`? (or: one-off in
  minimal mode, no brand context)"* Don't scaffold folders until they confirm.
- **No projects at all?** Offer: (a) create one now (`/plan-content` sets up the
  folder + templates), or (b) **minimal mode** — a quick one-off with no brand
  context. If minimal mode, **say so explicitly** and skip to STEP 5.
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
**character that must stay consistent across many pieces**, generate a
character model sheet — ONE image with a full-body turnaround (front / 3⁄4 /
side / back), face close-up, half-body shot and costume detail crops
(`generateCharacterSheet`, default layout) — and lock it. One file = one
reference slot in every later generation.

### Registering a new asset (saves the path for reuse)

```bash
# source: "generated" | "provided" | "real-person"
node workflows/cli.cjs registerAsset '["{name}","characters",{"id":"char-founder","label":"Founder – Sarah","description":"…locked physical description…","source":"generated","status":"ready","locked":true,"files":{"front":"assets/characters/sarah-front.png","three_quarter":"assets/characters/sarah-34.png"},"linked_voice":"voice-sarah"},{"date":"<today ISO>"}]'   # returns WorkflowResult
```

Products → `'products'`, logos → `'logos'`, voices → `'voices'`,
locations → `'locations'`, music → `'music'`, style refs → `'style_references'`.

> **Always pass real, existing relative paths.** Files live under
> `projects/{name}/assets/`; registry paths are relative to the project root.

### Style references (taste, not identity) — check registry, then ask ONCE

Identity assets keep the SUBJECT consistent; style references keep the LOOK and
VOICE consistent. Before writing any prompt, script, or caption:

```bash
node workflows/cli.cjs resolveAsset '["{name}","style-main"]'   # or any style_references id
```

- **Registered style refs exist** → USE them: pass image files as additional
  reference images (state the ref's role: "style only, not subject"), and mirror
  the `what_we_like` notes in prompts/copy. Don't improvise a look the project
  already has.
- **None registered** → check the drop inbox first: `ls projects/{name}/style-samples/`
  (video/image/caption/audio examples the user added by hand, with notes.md).
  Found something relevant → confirm with the user, then PROMOTE it: copy to
  `assets/style/`, register it (`style_references`, `what_we_like` from notes.md).
- **Inbox empty too** → ask ONCE per project:
  > *"Do you have examples of the look/voice you like — past posts or thumbnails,
  > captions or scripts that performed well, or a video to emulate? (paste text,
  > give file paths/links, or say 'none')"*
  - Images → copy to `assets/style/` → `registerAsset('{name}','style_references',...)`
    with a `what_we_like` note.
  - Copy examples (captions/scripts) → save to `assets/style/copy-examples.md`,
    register the same way — the write-copy skill reads it.
  - A reference video/link → route through the `analyze-video` skill first.
  - "none" → note it in brand.md so no one re-asks every piece.

---

## STEP 5: Apply the edge-case checklist

Scan `content-requirements.md §5` and handle anything that applies. The high-value ones:

- **Third-party source material** (RULES 10) → if the user hands you a video,
  image, song, or ad they did **not** create — to edit, dub, re-voice, face-swap,
  restyle, or republish — **ASK them to confirm they own it or have written
  permission to use AND modify it** before generating. Reselling a product ≠ owning
  its marketing videos. If it's clearly stolen/infringing, **decline and say why.**
  Client work? Advise a written warranty-of-rights + indemnity, and deliver the
  file rather than publishing it.
- **Real person / public figure / minors** → consent + `person_generation` policy;
  refuse celebrity/competitor likeness; never clone a real face/voice or put words
  in their mouth without consent.
- **Pre-launch product with no photo** → mockup, marked `source: mockup`.
- **Sensitive claims** (health/finance/legal) → enforce `restrictions`, no
  "guaranteed/cure/risk-free".
- **Non-English / Myanmar script** → confirm font/script support.
- **Series/campaign** → lock character + location + voice + music once; every
  piece references the same ids. ALSO lock a **Style Block**
  (`templates/style-block.template.md` → `projects/{name}/templates/style-block.md`,
  registered as `style_references`, locked) — it gets prepended to every prompt of
  the series so the LOOK stays constant, not just the subjects.
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
