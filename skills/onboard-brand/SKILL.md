---
name: onboard-brand
description: Interview the user about their brand and set up a complete project — filled brand.md, project.md, asset registry, and budget cap — through conversation instead of hand-editing templates. Use when the user is new, says "onboard my brand", "set up my brand", "new project", "get started", or asks to generate content but no project exists yet.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Onboard Brand

Turn a conversation into a ready-to-generate project. The user should never
have to hand-edit a template: **you ask, they answer, you write the files.**

Reference templates (the shapes you are filling):
- [`templates/project.template.md`](../../templates/project.template.md)
- [`templates/brand.template.md`](../../templates/brand.template.md)
- [`templates/assets.config.template.yaml`](../../templates/assets.config.template.yaml)

A completed example to calibrate against: [`examples/demo-brand/`](../../examples/demo-brand/).

> **Interview style:** batch related questions (3-5 at a time), never one long
> form. Accept "skip" for anything optional. After each batch, reflect back
> what you understood in one line. Total interview should feel like 5 minutes,
> not a tax return.

---

## STEP 1: Check what exists

```bash
ls projects/ 2>/dev/null
```

- Project already exists for this brand? → Offer to **review/complete** it
  instead (read its `templates/*.md`, list empty fields, ask only about those).
- User just wants to try the kit? → Point at the demo instead:
  `cp -r examples/demo-brand projects/demo-brand` and stop here.
- Otherwise continue.

## STEP 2: The interview

Ask in this order — each batch unlocks the next. **Suggest, don't interrogate:**
when the user gives a vague answer, propose 2-3 concrete options to pick from.

**Batch 1 — The business (required)**
1. What's the brand called, and what do you sell? (one sentence is fine)
2. Who buys it? (age range, situation — "busy parents", "junior developers"…)
3. What are the 2-3 things that make you different from alternatives?

**Batch 2 — Voice & look (required, suggest defaults from Batch 1)**
4. Pick 3-5 personality words (suggest a set that fits their domain)
5. Brand colors — hex codes if they have them, or describe the vibe and
   propose a palette (primary / secondary / accent / dark / light)
6. Anything the brand must NEVER say or do? (legal words, competitor names,
   claims)

**Batch 3 — Content goals (required)**
7. Which platforms first? (Instagram / TikTok / YouTube / Facebook / LinkedIn)
8. What's the first thing they want to make? (ad, launch, content calendar…)
9. Current offer/CTA if any (discount, trial, "DM us"…)

**Batch 4 — Assets & social proof (optional)**
10. Real stats or testimonials? ⚠️ **Only record what they state — never
    invent, round up, or "improve" numbers.** Empty is fine.
11. Do they have a logo / product photos / a face for the brand? (files can be
    registered now or generated later)
12. Budget cap for AI generation spend (suggest $10-25 to start)

## STEP 3: Write the project

Slug the brand name (kebab-case) and create the structure:

```bash
mkdir -p projects/{slug}/templates projects/{slug}/config projects/{slug}/assets
```

Then **Write** (not copy — fill them with the interview answers):

1. `projects/{slug}/templates/brand.md` — follow `brand.template.md` section
   structure. Where the user skipped, keep sensible defaults and mark
   `# TODO: confirm` so gaps are findable.
2. `projects/{slug}/templates/project.md` — follow `project.template.md`.
   Leave social-proof fields **empty** unless the user supplied real data.
3. `projects/{slug}/config/assets.yaml` — start from the registry template
   header + `project:`/`updated:` filled. For each identity mentioned in the
   interview (spokesperson, product, logo, voice), add an entry with
   `status: needs-generation` and **no `files:` paths** (never record paths
   that don't exist). If the user has real files, validate each exists, copy
   to `projects/{slug}/assets/<type>/`, and register with real paths:
   ```bash
   node workflows/cli.cjs registerAsset '["{slug}","logos",{...},{"date":"<today ISO>"}]'
   ```

4. Set the budget cap from Batch 4:
   ```bash
   node workflows/cli.cjs setBudgetCap '["{slug}",25]'
   ```

## STEP 4: Verify & hand off

```bash
node workflows/cli.cjs loadAssetConfig '["{slug}"]'
node workflows/cli.cjs validateAssets '["{slug}"]'
```

Fix any errors, then show a summary and the natural next step:

```
✅ ONBOARDED — {Brand Name} (projects/{slug}/)
  Brand:    tone, colors, restrictions saved
  Brief:    audience, USPs, offer saved   (empty: {list or "none"})
  Assets:   {n} identities registered ({m} need generation)
  Budget:   ${cap} cap set

Next: want me to generate your brand assets (/generate-brand-assets),
plan content (/plan-content), or make your first piece now?
```

If they choose to generate → run `/content-preflight` first, as always.
