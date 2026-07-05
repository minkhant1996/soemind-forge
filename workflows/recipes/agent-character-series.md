# Recipe: Agent Character Series (episodic)

**Goal:** turn product personas (e.g. SoeMind's 6 agents) into recurring visual
characters with an episodic show — "The Board Meeting": the agents react to a
startup pitch, debate each other, verdict. Recognizable recurring characters
are the retention flywheel behind every big faceless channel, and nobody can
copy YOUR cast.
**When to use:** "give the agents faces", episodic series, differentiated
mid-funnel content once reach formats (POV/essay) are working.
**Prerequisites:** preflight; brand personas defined; the ONE-TIME setup below.

## Setup (once, ~$0.90)
1. **6 character sheets** (`generateCharacterSheet`, 2 angles each): distinct
   silhouette + palette per persona inside the brand system — e.g. Skeptic:
   sharp slate angles · Customer: warm gold accents · Investor: navy pinstripe ·
   Memory: translucent layers · Competitor: mirrored · Planner: grid/lab motifs.
   Register ALL as locked characters.
2. **One "board room" location keyframe** → register `loc-boardroom`. $0.07
3. **Voices:** one distinct TTS voice per character, registered in `voices`
   (multi-speaker episodes use `generateMultiSpeakerVoiceover`).

## Per episode (~$1.70–3)
1. Script a 2-scene exchange (`/write-copy`): pitch in → two agents clash →
   verdict line. Generic/archetypal pitches first; real public companies only
   as neutral public facts, nothing defamatory.
2. 2 keyframes from the character refs → 2 Veo clips (8s, fast).
3. Multi-speaker VO → `assembleStoryFilm` → captions → package.

## Success signals
Followers asking for a specific character = character-market fit; give that
agent more episodes. Series dies if episodes are irregular — weekly or not at all.
