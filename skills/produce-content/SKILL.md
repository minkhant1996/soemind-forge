---
name: produce-content
description: Execute a content calendar — read a day's planned entries and produce them end-to-end (preflight → generate → package → mark done). Use when the user says "produce day 3", "make today's content", "work through the calendar", "what's next on the plan", or wants the calendar turned into actual content.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Produce Content (calendar execution)

A calendar from `/plan-content` is a backlog, not a document. This skill burns
it down: pick a day → produce each planned piece → record results → mark
entries done. **One piece at a time, with user confirmation on cost.**

## STEP 1: Load the calendar

```bash
ls projects/{name}/content-plans/
```

Read `calendar.md` (format: `templates/content-calendar.template.md`). If no
calendar exists → offer `/plan-content` first.

Resolve which day to produce:
- User named it ("day 3", "July 10") → use it.
- "today's content" → match `date:` to today.
- "what's next" → first day with any entry not `generated`/`published`.

Show the day's entries and their status before starting:

```
Day 3 — 2026-07-10 (2 planned, 1 generated)
  d03-c01  video     tiktok      educational  "3 signs your beans are stale"   planned
  d03-c02  carousel  instagram   educational  "Roast date vs best-by date"     planned
  d03-c03  image     facebook    promotional  "Yirgacheffe launch"             generated ✓
Produce the 2 planned pieces? (yes / pick one / skip)
```

## STEP 2: Produce each entry (in order)

For each entry with `status: planned` or `approved`:

1. **Read its plan file** (`plan_file:` → `content-plans/day-XX/…md`). If the
   plan file is missing/empty, draft it from the calendar row + project
   context, show the user, and save it before generating.
2. **Run `/content-preflight`** — resolve the assets (character, product,
   logo, voice) the piece needs; reuse locked ids, never re-describe.
3. **Check budget** (`checkBudget`) with the piece's estimated cost. Over cap
   or close to it → stop and ask.
4. **Generate** via the matching skill:
   `video → /generate-video` · `image → /generate-image` ·
   `carousel → /generate-image (carousel)` · `text → /write-copy` ·
   `audio_slides → /generate-voiceover + images`.
   Output goes under `projects/{name}/output-contents/{entry-id}/`.
5. **QA** the output (`/qa-review`); `recordCost` the actual spend.
6. **Package** for the entry's platform (`/package-content`) into
   `output-contents/{entry-id}/publish/`.

## STEP 3: Record and report

After each piece, update the calendar entry:

```yaml
status: "generated"            # planned → generated (published is set by the user)
output: "output-contents/d03-c01/publish/tiktok/"   # add this field
```

After the day, report:

```
✅ Day 3 produced — 2/2 pieces
  d03-c01  tiktok video      $1.28   output-contents/d03-c01/publish/tiktok/
  d03-c02  ig carousel       $0.34   output-contents/d03-c02/publish/instagram/
  Budget: $8.40 / $25.00 spent
Next unproduced day: Day 4 (3 pieces). Continue?
```

## Rules

- **Never batch-generate the whole calendar silently.** Confirm per day; show
  cost estimates before each expensive piece (video especially).
- A failed generation → keep the entry `planned`, note the error in the plan
  file, continue with the next entry, and report the failure at the end.
- Respect the plan: the calendar's pillar/topic/platform is the brief. If the
  plan file conflicts with `brand.md` restrictions, fix the plan first and
  tell the user.

## Pipeline-first — MANDATORY for every piece (2026-07-05)

Before generating ANYTHING (even a one-call image), author the pipeline: copy a template from
`workflows/pipelines/`, fill placeholders, save as
`<content-id>.pipeline.json` IN the content folder, then
`node workflows/cli.cjs runPipeline @<file>`. Refs like
`"{{keyframe.data.imagePath}}"` wire outputs to inputs; every node is
budget-gated + auto-ledgered; `pipeline-result.json` shows exactly which node
to fix on failure. The pipeline file doubles as the machine-readable prompts
record (prompts.txt remains the human one). A content folder without a
.pipeline.json is an incomplete piece. Map all plans across a project:
`find projects/<name>/output-contents -name '*.pipeline.json'`


## Text placement is LOOKED AT, never defaulted (2026-07-05)

Before any Remotion text pass over a background containing a subject
(person/face/prop), decide placement by inspection — either eyeball the
keyframe you just generated, or add a `placement` node to the pipeline:
`analyzeImage` with the "emptiest vertical third" prompt (see
`workflows/pipelines/pov-episode.pipeline.json`), then wire
`"align": "{{placement.data.text}}"` into the reel scene. A scrim panel must
NEVER cover a face or the key action — that mistake shipped once (d02-c02 v1,
caught by QA at 40/100) and is why this rule exists. Ask for the EMPTIEST
third, not "where should text go" — the inverted question confuses the model.
