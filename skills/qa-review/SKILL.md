---
name: qa-review
description: Review a generated image/keyframe for brand fit, accidental in-frame text, claim/restriction violations, subject consistency, aspect, and quality artifacts BEFORE committing budget. Use after a preview/keyframe and before finalizing or generating clips. Keywords - qa, review, check, on-brand, consistency, looks right, before publishing.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Output QA Review

Catch off-brand colors, accidental text in frame, restriction violations, character drift,
wrong aspect, and artifacts **before** you pay for the full render or the video clips.
Cheapest place to fail is a 512px preview / a $0.067 keyframe — not a $14 video.

Every workflow function is exposed as a CLI command:

```bash
node workflows/cli.cjs <command> '<json-args>'   # node workflows/cli.cjs list shows all commands
```

---

## When to run

- On **preview options** (`generateImageOptions`) before `finalizeImage`
- On every **storyboard keyframe** before generating clips
- On a **product/character shot** before registering it as a locked asset
- On any hero/ad image before it ships

---

## How to use

Pull the brand facts from `brand.md` (colors, tone, `restrictions.never_say`) and the
expected subject from the registry/plan, then review:

```bash
# brandColors from brand.md; restrictions from brand.restrictions.never_say; expectedSubject is the locked character
# checks defaults to all: ['brand-colors','unwanted-text','claims','consistency','aspect','quality']
node workflows/cli.cjs reviewOutput '{"imagePath":"projects/{name}/output-contents/storyboard/scene-01-struggle.png","brandColors":["#2563EB","#10B981"],"brandTone":"professional, warm","restrictions":["guaranteed","cure","risk-free"],"expectedAspect":"9:16","expectedSubject":"late-20s East-Asian woman, beige knit, gold hoop earrings"}'
# data: { pass, score, issues:[{check, severity, detail}], summary }
```

---

## Acting on the report

```
pass === true  → proceed (finalize / generate clips / register).
pass === false → there is an ERROR-severity issue. STOP and show the user:
   • the issue list (check + detail)
   • offer to regenerate with a corrected prompt addressing each error
   • re-review the new output before spending
warnings/info  → surface them, but the user may accept and proceed.
```

**Always show the user the issues and the score** — don't silently pass or block. A failed
QA on a cheap preview is the system working: it just saved a wasteful expensive run.

> Reviewing a **video**? Extract a representative frame first
> (`ffmpeg -y -i clip.mp4 -vf "select=eq(n\,0)" -frames:v 1 frame.png`) and review that.

---

## Typical loop

```
generateImageOptions → reviewOutput(each) → user picks a PASS → finalizeImage → reviewOutput → ship
generateStoryboard   → reviewOutput(each keyframe) → fix fails → approve → generate clips
```

## Videos → reviewVideoOutput (2026-07-05)

Video QA is one call now — no manual frame extraction:
`node workflows/cli.cjs reviewVideoOutput '{"videoPath":"…","expectAudio":true,"expectedDurationSeconds":N,...}'`
Samples frames + checks container (duration/audio). For kinetic/typography
content pass checks WITHOUT "unwanted-text"/"claims". Run after EVERY video
generation; fix what frames[] flags before packaging.
