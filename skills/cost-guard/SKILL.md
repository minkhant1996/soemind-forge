---
name: cost-guard
description: Track per-project spend against a budget cap. Set a cap, check an estimate before an expensive run, record actual cost after each generation, and report the running total. Use whenever the user mentions budget, cost, how much, spend, cap, or before any expensive batch. Keywords - budget, cost, cap, spend, how much, afford, remaining.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Cost Guard (budget + per-project cap)

Generation costs real money. This keeps a per-project ledger and a hard cap so a run never
silently overspends. Ledger lives at `projects/{name}/config/budget.yaml`.

Every function is exposed as a CLI command: `node workflows/cli.cjs <command> '<json-args>'`
(loads `.env`, prints the JSON result, exits non-zero on failure; `node workflows/cli.cjs list`
shows all commands).

---

## STEP 1: Set a cap (once per project)

Ask the user early — ideally during pre-flight:

> "What's your budget for this project? I'll stop before going over."

```bash
node workflows/cli.cjs setBudgetCap '["{name}",50]'     # $50; pass null for no cap
```

## STEP 2: Estimate + CHECK before any expensive run

Estimate the run, then gate on the cap. **Never start an over-cap run without confirming.**

Rough rates: image 512 ≈ $0.045 · 1K ≈ $0.067 · 2K ≈ $0.101 · 4K ≈ $0.15 · lite model ≈ $0.0336 flat ·
video ≈ $0.40/s (lite $0.05/s) · TTS ≈ $0.001/sentence · music ≈ $0.04–0.08 · text ≈ ~$0.

```bash
node workflows/cli.cjs checkBudget '["{name}",12.40]'    # est ~31s of video
# → { ok, spent, cap, remaining, projected, wouldExceed }
```

Show it:
```
💰 BUDGET CHECK — {name}
  Spent so far:   $12.50 / $50.00   (remaining $37.50)
  This run:       ~$12.40
  After run:      $24.90 / $50.00
  → OK to proceed
```

If `c.ok === false` → tell the user it would exceed the cap, show by how much, and offer:
use a cheaper model (Veo Lite), shorten, drop scenes, or raise the cap. **Do not run.**

## STEP 3: Record actual cost after each generation

Every workflow returns `result.data.cost.totalCost`. Record it so the ledger stays accurate:

```bash
node workflows/cli.cjs recordCost '["{name}",{"label":"hero video 31s","type":"video","amount":12.40}]'
# amount = result.data.cost.totalCost; types: 'text' | 'image' | 'video' | 'audio' | 'music' | 'other'
```

## STEP 4: Report on request

```bash
node workflows/cli.cjs budgetSummary '["{name}"]'
# → { spent, cap, remaining, byType, entryCount }
```
```
💰 SPEND — {name}
  Total: $24.90 / $50.00   (remaining $25.10, 12 items)
  video $22.80 · image $1.90 · audio $0.20
```

---

## The rule

> Estimate → `checkBudget` → (confirm if over) → generate → `recordCost`.

For a planned batch (e.g. a 30-day calendar), sum the per-piece estimates and `checkBudget`
the **whole plan** up front: *"This calendar is ~$240 — your cap is $200. Trim or raise?"*
Prefer the `preview-pick` skill to keep estimates (and waste) low.

## Enforcement (built into the CLI — 2026-07-03)

The cap is not advisory. For any paid command whose args reference
`projects/{name}/`, `workflows/cli.cjs`:
1. **Blocks before spending** if `spent >= cap` → `BUDGET_EXCEEDED`, exit 1,
   nothing generated. Warns on stderr at ≥80% of cap.
2. **Auto-records** the actual returned cost to the ledger (`auto:<command>`).

So: `checkBudget` remains the polite pre-estimate for the conversation, but the
hard stop and the ledger are guaranteed even if an agent skips this skill.
Manual `recordCost` is only for out-of-band spend. Raising the cap or
`BUDGET_OVERRIDE=1` requires explicit user consent — never set it yourself.
