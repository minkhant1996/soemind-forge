# Recipe: Video-Essay Explainer (Vox-style)

**Goal:** a 60–90s information-dense essay — authoritative VO, AI b-roll, kinetic
lower-thirds — that teaches one contrarian thesis. Edutainment is the dominant
viral format in 2026 and 60–90s earns the platforms' length bonus.
**When to use:** "explainer", "video essay", "break down why X", thought-leadership video.
**Prerequisites:** preflight done; locked narrator voice; thesis the brand can defend.

## The plan
1. **Script** (`/write-copy` → `reviewScript`, targetDuration 75): 150–220 words.
   Structure: hook question → thesis → 2-3 evidence beats → reframe → soft CTA.
   Every claim sourced or clearly framed as opinion — no invented stats.
2. **B-roll**: 6–8 text-free backgrounds (`generateSingleImage` on the locked
   style ref; photoreal where concrete). Optionally upgrade the 2–3 KEY beats to
   8s Veo clips (`generateVideoFromImage`, fast $0.10/s).
3. **VO**: 2–3 Charon-style segments, `pace: "natural"` always, emotion in
   `audioProfile` (authoritative → wry → conclusive). ffprobe each segment.
4. **Cut**: stills+text → one `renderKineticReel` call (bgs can be images AND
   video clips mixed; `bgAudioVolume` keeps Veo ambience). With many Veo beats →
   `assembleStoryFilm` then text pass.
5. **Captions burned in** — essays die without them. Package for
   instagram/tiktok/youtube.

## Budget
$0.60 (stills-only) → $3.00 (3 Veo beats). Confirm before step 2; auto-ledgered.

## Success signals
Completion rate + saves. A save-heavy essay → pin it and repurpose to a carousel
(`/repurpose-content` thinking). No traction after 3 essays → thesis too generic,
sharpen the contrarian angle before making more.
