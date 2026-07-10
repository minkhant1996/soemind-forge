# Content Requirements Matrix

> The agent's lookup table **before planning or generating any content**.
> It answers three questions: *What is this about? What must appear? What
> inputs/assets do I need before I can generate — and which do I have already?*
>
> Used by the [`content-preflight`](../skills/content-preflight/SKILL.md) skill.
> Reusable assets are tracked in [`config/assets.yaml`](./assets.config.template.yaml).

---

## How to use this file

```
1. Classify the TOPIC TYPE        (what is the content about?)
2. Classify the VISUAL MODE       (who/what appears on screen?)
3. Look up REQUIRED INPUTS        (the matrix below)
4. Check the ASSET REGISTRY       (config/assets.yaml) for what exists
5. For each MISSING required asset → provide / generate / describe-only
6. Save generated/received assets back to the registry (with paths)
7. Only then: plan or generate
```

If a required input is missing and cannot be resolved, **stop and ask** — never
fabricate stats, testimonials, faces of real people, or a product that doesn't exist.

---

## 1. Topic Types (what the content is *about*)

Not everything is a product ad. Classify first — it changes what's required.

| Topic type | What it is | Subject usually | Needs product? | Needs brand? |
|------------|-----------|-----------------|----------------|--------------|
| `product` | Selling a thing (physical, digital, app, course, SaaS) | product / person+product | ✅ yes | ✅ |
| `service` | Local / B2B service (agency, clinic, salon, consulting, restaurant) | person / result / place | ⛔ (offer, not object) | ✅ |
| `personal-brand` | A creator/founder/expert *is* the subject (coach, author, influencer) | person | ⛔ | ⚠️ light |
| `educational` | Teaching / info, no direct sell (how-to, tips, listicle, myth-bust, explainer) | faceless / person / illustration | ⛔ | ⚠️ optional |
| `brand-awareness` | Story, values, mission, vibe (top-of-funnel) | varies | ⛔ | ✅ |
| `event` | Launch, sale, webinar, drop, conference, seasonal campaign | varies | ⚠️ if product event | ✅ |
| `announcement` | News, feature release, update, milestone, hiring | UI / person / text-motion | ⚠️ if product news | ✅ |
| `community-cause` | Nonprofit, advocacy, UGC, testimonial-led | real people / story | ⛔ | ⚠️ |
| `entertainment` | Trend, meme, skit, relatable (engagement-first) | person / faceless | ⛔ | ⚠️ |
| `recruitment` | Hiring, employer brand, "work with us" | team / workplace | ⛔ | ✅ |

> If the user's request doesn't fit cleanly, ask one question: *"Is this about a
> specific product/service, a person, or a topic/idea?"* — that resolves 90% of cases.

---

## 2. Visual Modes (who/what appears)

| Visual mode | On screen | Consistency assets needed |
|-------------|-----------|---------------------------|
| `person` | A human (real provided, or AI-generated character) | **character** ref(s) + **voice** |
| `product-only` | Object, no people | **product** photo(s) |
| `mixed` | Person + product together | **character** + **product** |
| `faceless` | Hands, b-roll, screen-rec, text-motion, abstract | none (brand colors only) |
| `mascot` | Brand mascot / illustrated character | **character** (illustrated) ref |
| `ui-screens` | App / SaaS / website screens | **product** (UI captures) |

---

## 3. Requirements Matrix (topic × visual mode → inputs)

Legend: ✅ required · ⚠️ recommended · ⛔ not needed · 🎙️ audio · 🖼️ asset

### Product ad — **person** (`product` × `person`/`mixed`)
The flagship "product ad with a person" case.

| Input | Need | Source / notes |
|-------|------|----------------|
| Project brief (`project.md`) | ✅ | business, audience, pain points, offer, CTA |
| Brand (`brand.md`) | ✅ | colors, tone, restrictions |
| 🖼️ Product reference(s) | ✅ | registry `products[]` — provide photos OR generate mockup |
| 🖼️ Character reference(s) | ✅ | registry `characters[]` — **provide a real person** OR **generate** (then lock) |
| 🎙️ Voice identity | ✅ | registry `voices[]` — if character speaks |
| Dialogue / script | ✅ | from content plan or ask |
| Platform + aspect + duration | ✅ | presets in video skill |
| 🖼️ Logo | ⚠️ | registry `logos[]` for end card |
| 🖼️ Location/environment | ⚠️ | registry `locations[]` for multi-scene consistency |
| Social proof | ⚠️ | **real only** — skip if none |

### Product ad — **product-only** (`product` × `product-only`)
| Input | Need |
|-------|------|
| Project brief + brand | ✅ |
| 🖼️ Product reference(s), multiple angles | ✅ |
| Key features to highlight | ✅ |
| Lifestyle context (kitchen/gym/desk…) | ⚠️ |
| Character / voice | ⛔ (voiceover optional) |

### SaaS / app (`product` × `ui-screens`)
| Input | Need |
|-------|------|
| Project brief + brand | ✅ |
| 🖼️ UI screenshots / screen-recording | ✅ (provide; AI shouldn't invent fake UI of a real product) |
| Key feature to demo + before/after state | ✅ |
| 🎙️ Voiceover script | ⚠️ |

### Service business (`service` × `person`/`faceless`)
| Input | Need |
|-------|------|
| Project brief (offer, service area) + brand | ✅ |
| 🖼️ Character (staff/owner) or 🖼️ result/place refs | ⚠️ provide real where possible |
| Proof (before/after, reviews) | ⚠️ real only |
| Booking/visit CTA | ✅ |

### Personal brand / creator (`personal-brand` × `person`)
| Input | Need |
|-------|------|
| Who the person is, angle, niche | ✅ |
| 🖼️ Character ref — usually a **real person** | ✅ provide (consent implicit if it's the user) |
| 🎙️ Voice | ✅ |
| Brand | ⚠️ light (personal aesthetic) |
| Product | ⛔ (unless promoting one) |

### Educational / informational (`educational` × any)
| Input | Need |
|-------|------|
| Topic + key points + source of truth | ✅ (don't hallucinate facts) |
| Format (listicle/how-to/myth-bust) | ✅ |
| 🖼️ Character/voice (if talking-head) | ⚠️ |
| Brand | ⚠️ optional (minimal mode ok) |
| Product | ⛔ |

### Brand awareness / story (`brand-awareness` × any)
| Input | Need |
|-------|------|
| Brand story / values / mission | ✅ |
| Brand (colors, tone, aesthetic) | ✅ |
| 🖼️ Recurring character/location (if narrative) | ⚠️ lock for series |
| Hard offer/CTA | ⛔ (soft CTA only) |

### Music / jingle (any topic, audio only)
| Input | Need |
|-------|------|
| Purpose + genre + mood + tempo | ✅ |
| Brand tone (energy, do/don't) | ⚠️ |
| Length + standard/pro | ✅ |
| 🖼️ Mood reference image | ⚠️ optional |

> **Minimal mode:** for a quick one-off with no project (e.g. "just make me a
> 5-second abstract clip"), only the generation params are required. Skip the
> project/brand checks but **say so** ("Generating without brand context —
> create a project for consistent results?").

---

## 4. The Provide-vs-Generate decision (per visual asset)

For every **required 🖼️ asset that isn't in the registry**, run this:

```
Does a usable reference already exist?
├── In registry (config/assets.yaml)?      → REUSE it (resolveAsset). Done.
├── User has a file?                         → PROVIDE:
│     ask for the path → validate it exists, right type, decent resolution
│     → copy into assets/<type>/ → registerAsset(...)
└── No file?                                 → GENERATE:
      ask the DETAIL questions for that asset type (below)
      → generate with the matching workflow
      → STOP, show it, get approval
      → save to assets/<type>/ → registerAsset(..., locked: true)
```

### Detail questions before GENERATING a…

**Character (person):** gender & age · ethnicity/skin · hair (color/length/style) ·
face/build · exact wardrobe + colors · accessories · vibe/expression ·
**speaks?** → also capture voice (name/style/pace/accent). Generate a small
**character model sheet** — ONE image: full-body turnaround (front / 3⁄4 / side /
back) + face close-up + half-body + costume detail crops, all labeled — so later
scenes stay consistent, then `locked: true`.

**Product (mockup, pre-launch only):** exact form/material/color · size · logo
placement · packaging? · angles needed. *Never* mockup a real product you could
photograph — ask for a photo first.

**Location/environment:** place type · key furniture · background elements ·
lighting · props that must recur.

**Logo:** only if the user has none — offer a simple wordmark; flag it as
placeholder, not a final brand logo.

After generating, **always** write it back with `registerAsset` so the next piece
of content reuses the exact files.

---

## 5. Edge & unexpected cases (cover these)

| # | Situation | Handling |
|---|-----------|----------|
| 1 | **Multiple products** in one project | Each gets its own `products[]` id; content plan names which id |
| 2 | **Multiple characters** (founder + customer) | Separate `characters[]` ids; lock each; never blend descriptions |
| 3 | **Consistency across many videos** | `locked: true` + reuse the same ref files as keyframes; don't re-describe |
| 4 | **Real person** (user, client, staff) | `source: real-person` + `consent.release_on_file`; set `person_generation` per policy; never deepfake a non-consenting/public figure |
| 5 | **Public figure / celebrity / competitor likeness** | Refuse to generate their likeness; suggest a generic character |
| 6 | **Minors on screen** | Avoid generating; if real, require explicit guardian consent note; default `person_generation: block` |
| 7 | **Pre-launch product** (no photo) | Generate a mockup, mark `source: mockup`, flag "not a real photo" in review |
| 8 | **User gives wrong-aspect / low-res reference** | Validate; warn; offer to regenerate/upscale or crop; don't silently ship blurry |
| 9 | **Reference path moved/deleted** | `validateAssets` flags it; re-ask or regenerate; never reference a missing file |
| 10 | **No brand yet** | Offer: create brand.md / quick brand (name+color+tone) / minimal mode — and record the choice |
| 11 | **No logo yet** | Generate a placeholder wordmark or skip end card; mark placeholder |
| 12 | **Sensitive claims** (health, finance, legal, income) | Enforce `restrictions`; no "guaranteed/cure/risk-free"; require real proof or soften |
| 13 | **Non-English / multi-script** (Myanmar, Thai, Arabic…) | Confirm script & font support; for Burmese avoid Shan/Mon-only fonts (see font-lib) |
| 14 | **Reusing an asset across projects** | Copy the file into the new project's `assets/` and register locally (keep projects self-contained) |
| 15 | **Character must change outfit/age/scene** | New `files` entries (variations) under the same id; keep face identity locked |
| 16 | **Voice ≠ on-screen character mismatch** | Keep `linked_voice` so gender/age/accent match the look |
| 17 | **Copyrighted style/music reference** | Don't imitate a named artist/brand style 1:1; describe the vibe generically |
| 18 | **Budget ceiling** | Estimate cost from registry reuse (fewer regenerations) before confirming |
| 19 | **Platform mismatch** with existing asset aspect | Re-crop/regenerate for the new aspect; note which platform each output targets |
| 20 | **User says "just do it" / skip questions** | Still resolve **required** inputs; you may auto-suggest defaults but state every assumption |
| 21 | **Topic is none of the types** | Ask the one classifier question; default to `educational` if still unclear |
| 22 | **Mixed languages / code-switching in script** | Confirm pronunciation handling; consider per-segment voice settings |
| 23 | **Series / campaign** (many pieces) | Lock characters/location/voice/music **once**; every piece references the same ids |
| 24 | **Duplicate asset ids** | `validateAssets` errors; rename before proceeding |

---

## 6. Pre-flight gate (the rule)

> **No content plan and no generation starts until the matrix is satisfied for
> the chosen topic + visual mode, every required asset is `ready` in the
> registry (or explicitly waived as minimal mode), and the user has confirmed.**

The [`content-preflight`](../skills/content-preflight/SKILL.md) skill runs this gate.
