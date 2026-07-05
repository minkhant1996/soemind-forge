# Recipe: POV Series

**Goal:** episodic first-person immersion — "POV: you're the founder who…" — the
cheapest video format in the kit and one of the highest-view formats of 2025-26.
Faceless (hands, screens, desks), so no character consistency cost.
**When to use:** "POV video", relatable-pain series, top-of-funnel reach content.
**Prerequisites:** preflight done. No character needed. Series works in rhythm —
plan 4+ episodes before making one.

## The plan (per episode)
1. **The caption IS the piece.** Write 5-10 candidate "POV: …" lines
   (`generateHooks`); pick by specificity ("feature #50, DAU 3" beats "overbuilding").
2. **One POV keyframe** (`generateSingleImage`): strict first-person camera —
   your hands on the keyboard, phone in hand, screen glow. No face, no readable
   text in frame. $0.07
3. **One 8s Veo clip** from it (`generateVideoFromImage`, fast). $0.80
4. **Text over video, one call** (`renderKineticReel`): the clip as
   `backgroundPath` (video supported), `bgAudioVolume: 0.5` to keep Veo's
   ambience, `scrim: true`, gold "POV:" line + 2 navy lines. Usually NO
   voiceover — POV runs on ambience + text. $0
5. Package reels/tiktok/shorts.

## Budget
~$0.90/episode. 2 episodes/week.

## Success signals
Shares + "this is me" comments. A winning episode gets a direct sequel within
the week. Product appears at most 1 episode in 3 — the series earns reach with
pain, not pitches.
