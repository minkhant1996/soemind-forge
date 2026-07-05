# Recipe: Podcast → Content Week

**Goal:** one recorded episode becomes a full week of multi-format posts.
**When to use:** "repurpose my episode", "I have a long video, make content
from it". Works for podcasts, webinars, talks, livestreams, long YouTube videos.
**Prerequisites:** the recording file, OPENROUTER_API_KEY (transcription),
platforms chosen. This recipe is the strategic wrapper around
[`/repurpose-content`](../../skills/repurpose-content/SKILL.md) — that skill
does the mechanics.

## The plan (1 episode → 7 days)

| Day | Piece | Source | Skill / command |
|-----|-------|--------|-----------------|
| 1 | Best-hook clip (15-45s, 9:16) — the episode's spiciest moment | transcript pick #1 | `/repurpose-content` (extractClip) |
| 2 | Quote card — the most shareable one-liner | transcript | `/generate-image` |
| 3 | Insight thread/text post — the core argument, numbered | transcript | `/write-copy` |
| 4 | Second clip — the most *useful* moment (tip, how-to) | transcript pick #2 | extractClip |
| 5 | Carousel — "5 takeaways from this conversation" | transcript summary | `/generate-image` (carousel) |
| 6 | Third clip — the most *emotional/story* moment | transcript pick #3 | extractClip |
| 7 | Full-episode CTA post — where to listen, teaser of next | episode meta | `/write-copy` + `/generate-image` |

Selection logic for the three clips: **spicy** (disagreement, bold claim),
**useful** (concrete how-to), **human** (story, laugh, vulnerability). Three
different reasons to follow.

## Execution notes

- Transcribe ONCE (`transcribeVideo`), derive everything from that transcript —
  state the transcription cost up front for long episodes (~$0.006/min).
- Clip captions: hook line first ("He said WHAT about roast dates?"), then
  context; name the guest; every clip CTA points to the full episode.
- `cropTo: "9:16"` assumes a centered speaker — verify each clip's framing;
  pad instead of crop for two-person shots.
- Package per platform as you go; day-slot assignments are defaults — front-load
  the best clip on Day 1 while the episode is fresh.
- Batch-produce Days 1-7 in one session (one transcript read), then schedule.

## Budget

~$0.50-3 per episode: transcription (~$0.25-0.60 for 40-100 min) + 1-2 quote/
carousel images. Clips and packaging are local and free.

## Success signals

Clips out-reaching the full episode is NORMAL and good — watch which of the
three clip *types* wins and weight future weeks toward it. Track full-episode
listens from Day 7 vs Day 1 CTAs to learn where your listeners actually
convert.
