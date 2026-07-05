# Recipe: Storytime (First-Person Confession)

**Goal:** a 60–90s single-arc TRUE story with confession pacing — hook
mid-crisis → rewind → turn → lesson. Specificity is the viral mechanism:
"the time a founder deleted 48 features in one call" beats any generic advice.
**When to use:** "storytime", "tell the story of…", real cohort/founder stories.
**Prerequisites:** ⚠️ **A real story.** The user supplies the actual events
(anonymized is fine: "a founder in our May cohort"). If there's no true story,
this recipe does not run — staging visuals may be dramatized, facts may not.

## The plan
1. **Story intake:** get the beats from the user; draft the 4-beat arc
   (`/write-copy`); user confirms every factual detail before production.
2. **Visuals:** cinematic-story-film recipe mechanics — locked character
   (fictional stand-in, never the real person without consent) or faceless
   staging (desk/screen/hands), 3–4 keyframes → Veo clips.
3. **VO — one continuous take,** not per-scene segments: a confession is a
   single emotional slide, not four moods. One `generateVoiceover` call,
   `audioProfile` describing the full arc ("starts matter-of-fact, cracks
   slightly at the turn, lands quiet and certain"). ffprobe; it may span scene
   boundaries — `assembleStoryFilm` places it once at scene 1 with
   `voOffsetSeconds`.
4. Assemble → captions → package.

## Budget
$2.50–4/piece. Max 1/week — scarcity keeps them special.

## Success signals
Watch-through + "tag a founder" comments. If a story gets asked about in
DMs/comments, its LESSON becomes next week's video essay.
