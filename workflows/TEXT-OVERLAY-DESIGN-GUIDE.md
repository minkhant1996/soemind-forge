# Text Overlay Design Guide — placement, size, color, style patterns

> Read this when a request involves on-screen text/typography beyond a plain
> caption: hero titles, kinetic reels, "text behind subject," meme-style
> overlays, before/after labels, hook+CTA two-stage reveals. Pairs with
> `renderKineticReel` / `renderSlideStill` / `renderCaptionedVideo`
> (WORKFLOWS.md § Remotion) and the text-behind-subject technique below.

Patterns catalogued from real short-form video/thumbnail design (Reels,
TikTok, carousels, editor tutorials). Each pattern names what it looks like,
when to use it, the concrete X/Y/Z + size/color spec, and — critically —
**whether this toolkit can render it today or not**. Don't silently claim a
capability that isn't wired up; tell the user it's a manual/roadmap item.

---

## 0-pre. THE THREE TEXT ROUTES — pick one before anything else (READ FIRST)

Every on-video text job goes down one of three routes. Name the route in your
plan; they have different costs and different failure modes.

| Route | What | Cost | Command | When |
|---|---|---|---|---|
| **A — Normal captions** | Transcript pills at 3/4 screen, white-on-dark, accent keywords | **$0** (local Remotion) | `renderCaptionedVideo` (burn onto finished video) or `scrim:true` caption elements in `renderTextMotion` | Every talking/VO video gets these. Default. |
| **B — Creative text, AI-designed** | Agent designs the overlay: analyzes the frame, picks WHERE (negative space) / WHAT (transcript words) / HOW (per-word style+motion), renders pixel-exact | **$0** (local Remotion) | `renderTextMotion` (+ rembg §6 for behind-subject) | Hero words, kinetic beats, self-demonstrating typography, video-in-text, behind-subject — the default creative route. |
| **C — Creative text, Omni-baked** | Gemini Omni EDIT redraws the footage with text/graphics baked INTO the scene (hand-lettering, painted-on-wall, doodle worlds) | **PAID ≈ $0.10/sec** (~$1 per 10s clip, token-priced) | `generateOmniVideoClip` task `edit` (§8) | Only when the text must look organic to the scene (drawn/painted/physical) or the whole frame gets restyled. Confirm spend first. |

**Route A house style (production-locked):** white Inter 700 on dark pill
`rgba(2,8,20,0.62)` + subtle blue accent border, centered at **y = 0.75**
(`marginBottom ≈ 430` on 1920-tall). Cues from `transcribeAudio` timestamps;
text from the human script (ASR mangles names). Accent 1–2 keywords per cue
(`**word**` in renderCaptionedVideo, `==word==` in renderTextMotion).

**Route B is a design task, not a template.** The agent must:
1. **Grab a frame** (`ffmpeg -ss N -i clip -frames:v 1 f.png`) and LOOK at it.
2. **Find the subject's negative space** — place words there, never by frame
   corners. Close 9:16 talking head → the only safe band is ABOVE the head
   (y ≈ 0.09); b-roll → the empty third. Words on a face = instant amateur.
3. **Pick words from the video's own transcript** (never leftover/test text),
   timed to the spoken moment.
4. **Style per word** — renderTextMotion supports per-element font/size/color/
   gradient/stroke/glow/badge/highlight, 20+ entrances, loops, letter/word
   stagger, `mediaFill` (video-in-text), `behind:true` (rembg matte). A word
   can demonstrate itself: "size" zooms in bigger, "animation" wiggles.
5. **Frame-grab VERIFY the render before assembling** — placement bugs are
   invisible in JSON and obvious in a PNG.

**Route C is paid and has hard physics** — read §8 before writing the prompt.

**⚠️ ASK THE USER before any creative text work (binding, RULES.md #8):**
Route A needs no ask — every VO video gets captions. But when the request
calls for CREATIVE text, present the choice explicitly and wait:

> "Creative text — two ways: **free** (Remotion — I design the overlay:
> placement, per-word style, motion; pixel-exact) or **paid with Gemini Omni**
> (~$0.10/sec, ≈$1 per 10s clip — text drawn/painted INTO the scene,
> hand-lettered look). Which one?"

Default recommendation = **free (Route B)** unless the user's reference shows
an in-scene/hand-drawn look only Omni produces. Never route to Omni silently;
never present Omni without its price.

**If the user picks Omni, CALCULATE the job's real price and show it before
running** — not just the rate. Count every Omni call the job needs (a >10s
scene splits into multiple ≤10s calls; retries are extra) at ≈$0.10/sec:

> "Scene is 18s → 2 Omni calls (9s + 9s) ≈ **$1.90**. Budget: $X spent /
> $Y cap → $Z after. Proceed?"

Then `checkBudget` with that estimate before the first call (the CLI enforces
the cap, but the user hears the number from you first, per RULES.md #3).

---

## 0. Caption method selector — DECIDE by the video, don't default blindly (READ FIRST)

Captions are not one-size-fits-all. **Pick the method from the video's shape and
goal**, then build it with `renderCaptionedVideo` cue fields (§ below + WORKFLOWS.md
§ renderCaptionedVideo) or the text-behind-subject recipe (§6). When unsure, use the
first row. Confirm the pick with the user for anything beyond a plain transcript.

| Video / goal | Best caption method | How |
|---|---|---|
| **Talking-head / spokesperson explainer** (person speaks to camera) | Bottom **pill transcript + gold keyword accent**; optionally ONE **behind-subject** topic word | pill cues `pos:"lower"` + `**keyword**`; behind = §6 |
| **Fast-cut hook / hype / product sizzle** | **Hero word punch-ins** — one big word/short phrase per beat | `style:"hero"`, big `size`, short cue windows |
| **B-roll / cinematic** with negative space | **Quadrant caption** in the empty region (not center) | `pos:"upper"/"mid"` + `align`; `analyzeImage` finds the empty third |
| **Tutorial / step-by-step** | **Numbered lower-third pills**, one per step, keyword-accented | pill cues + `**Step 1**` |
| **Multi-scene / travel / location changes** | **Location/label stamp** (upper) + bottom transcript | two-pass: transcript (lower) → stamps (upper) |
| **Signature "wow" hero moment** (once/clip) | **Text-behind-subject** big word | rembg recipe §6 |
| **Non-English / Myanmar dialogue** | any row above, but **Remotion path only** (never ffmpeg drawtext) | `renderCaptionedVideo` is already Remotion — §7 |
| **Bilingual audience** | **Stacked two-line** caption (native + translation) | one cue `text:"line1\nline2"` |

**Rules of engagement:**
- Transcript timing comes from `transcribeAudio` (Burmese-safe), offset onto the
  assembled timeline (add each clip's start time).
- **Only ONE cue is active at a time** (the composition uses `cues.find`). To stack
  layers (e.g. transcript + location stamp, or transcript + behind-word), render in
  **separate passes** — pass 1 burns layer A, pass 2 runs on pass-1's output.
- ONE hero/behind moment per clip MAX — overuse kills the impact.
- Emphasize only the 1–2 words that matter with `**word**` (→ accent color), not whole
  lines. Keep pills in the safe zone (`marginBottom` clear of the platform UI).

---

## 1. The Z-axis: where does the text sit relative to the subject?

| Placement | Effect | How to build it here |
|---|---|---|
| **Behind** | Subject occludes the text as they move — text reads as part of the scene, not a sticker on top. Big, bold, bleeds off-frame edges for scale drama. | ✅ **Repeatable recipe (not yet a one-shot CLI command).** Matte the subject per-frame with **`rembg`** (installed; `u2net`, ~1s/frame CPU), then `ffmpeg` layer order: background video → text → subject cutout on top. Full recipe + validated params in § 6. |
| **Front (always-on-top)** | Classic caption/lower-third — never occluded, always legible. Lower-third pill/box is the safest default for dense backgrounds. | ✅ Today: `renderSlideStill` (static) or `renderKineticReel` per-scene lines (animated). For a lower-third *pill* look, use `renderCaptionedVideo`'s caption-pill style. |
| **Side (margin badge/watermark)** | Small persistent tag — brand mark, series label, "swipe/1 of 3" indicator. Usually rotated 90° or tucked in a corner, low visual weight, present for the whole clip. | ⚠️ Partial: `renderSlideStill`/`renderKineticReel` have no native rotate/margin-badge prop. Workaround used in R&D: render the label to a small transparent PNG via `drawtext`, rotate with ffmpeg `transpose=1`, overlay at `x=W-w-margin`. Roadmap: add a `sideBadge` prop to KineticReel. |

**Rule of thumb:** behind = the hook/hero moment (biggest visual impact, use once per clip); front = anything that must stay readable no matter what's happening on screen (CTAs, brand claims, safety-critical text); side = persistent low-key branding, not for primary messages.

---

## 2. X/Y position patterns

| Pattern | Spec | When to use |
|---|---|---|
| **Bleed-off-edge hero word** | One word sized so it overflows the left AND/OR right frame edge (crop it — don't shrink to fit). Sits in the upper 2/3. | Maximum scale/impact for a single hook word. Works with both "behind" and "front" placement. |
| **Centered stacked block** | 2–3 lines, centered, tight `line-height` (~1.2), all roughly the same size. | Titles, series names, section headers — the current `KineticReel`/`Slide` default. |
| **Quadrant placement by negative space** | Read the background for the emptiest region (sky, wall, water) and put the text THERE, not by default center. Two-stage copy (question, then answer) can each get a different quadrant. | Cinematic B-roll with a clear negative-space area. `analyzeImage` (already in this toolkit) can auto-detect the emptiest third — see the `pov-episode` pipeline template for the pattern (`placement` node → `align` prop). |
| **Dominant word + orbiting satellites** | One big word centered; 1-2 tiny connector words tucked diagonally above/below it at ~25% of its size. | Editorial/collage feel, e.g. "in **your** professional" with "in" and "professional" tiny and offset. Not supported by current per-*line* props (KineticReel sizes a whole line, not words within it) — would need per-word spans, see § 5 roadmap. |
| **Rhythm-mapped kinetic words** | Word-by-word reveal where size tracks vocal emphasis/stress from the voiceover, not a fixed pattern — loud/emphasized words get bigger, filler words shrink. Loose, overlapping, NOT grid-aligned. | Lyric-video / voiceover-synced reels. Today: build as one `KineticReel` scene per emphasized word/phrase with `delay` staggered to the VO timestamps and `size` set per word manually — this already works since each line is independently sized/delayed; you're just treating short phrases as the "lines." |

---

## 3. Size hierarchy patterns

| Pattern | Structure | Example |
|---|---|---|
| **2-tier: hero + support** | One giant word/phrase (60-120px+, often behind subject) + one small caption below (28-36px, mixed weight — regular text with ONE bold word). | "**MAKE**" (giant, behind subject) + "every word **unmissable**" (small, front, bottom third). |
| **3-tier: hook → context → CTA** | Large hook line, medium context line, small CTA/fine-print line, stacked top to bottom. | Classic poster hierarchy ("I WANT YOU" / "FOR U.S. ARMY" / "NEAREST RECRUITING STATION"). |
| **2-stage reveal: question → answer** | Smaller/softer-colored question or hook appears first (or sits upper-left), then a bolder, larger, whiter CTA/answer appears in a different screen region. | "Want to make your videos feel more immersive?" (small, pale blue, upper-left) → "**Watch this.**" (bold, white, larger, lower-center-right). Build as two `KineticLine`s with staggered `delay` and different `size`/`color`. |

**Already supported:** all three patterns above are achievable TODAY with `renderKineticReel`'s per-line `size`/`color`/`delay` — they just require the agent to plan the copy into the right number of lines/scenes with deliberately different sizes, not rely on a default.

---

## 4. Color patterns

| Pattern | Spec | Notes |
|---|---|---|
| **Single-word color emphasis** | Whole phrase one neutral color (white/navy); ONE key word switches to a bright accent (red, gold, neon green). | This is a **per-word** color change within one line — current `KineticLineInput.color` is per-LINE only. Workaround: split the phrase into two adjacent lines with `delay: 0` on both so they render on the same beat, one neutral-colored, one accent-colored. Roadmap: per-word color spans. |
| **High-contrast neon on neutral bg** | Lime green / hot pink / cyan text on desaturated or dim photo backgrounds. | Reliable "stop the scroll" combo. Pick ONE neon, not several — competing neons read as cheap. |
| **Metallic / gradient display type** | Silver-to-white gradient, or warm gold — usually paired with a script-font accent word in a contrasting hue (e.g., red script "Happy" over silver block "BIRTHDAY"). | Not supported by current Remotion components (flat `color` only, no CSS gradient prop exposed). Roadmap: add `colorGradient` to `KineticLineInput` (trivial — CSS `background: linear-gradient(...); -webkit-background-clip: text`). |
| **Outline/stroke for legibility** | White or black stroke (`text-stroke` / drop-shadow) around bold caps, used over busy/green/organic backgrounds (foliage, crowds). | Not exposed today (Remotion `Line`/`Slide` have no stroke prop). Roadmap item — cheap CSS addition (`WebkitTextStroke`). Until then, `scrim: true` (frosted panel behind text) is the current legibility fix. |
| **UI-chip / pill badges for meta-labels** | Small rounded-rect background behind short meta text ("Before"/"After", "1 of 3", dimensions), separate from the main headline treatment. | `renderSlideStill`'s `box`-less design doesn't have this; can approximate today with `ffmpeg drawbox`/`drawtext:box=1:boxcolor=...` in a custom composite, same technique used for the lower-third pill in the Myanmar text test (`dev-doc/matte-test/omni`). |

---

## 5. Font & weight patterns

| Pattern | Spec |
|---|---|
| **Two-font pairing for contrast** | Elegant script/cursive for a short connector word ("Happy") + bold condensed display for the hero word ("BIRTHDAY"). Different families signal different tones in the same frame. |
| **Themed/distressed display fonts** | Match font texture to content mood — rugged/hand-drawn or distressed-edge caps for outdoor/adventure content, clean geometric sans for tech/business content. `KineticReel` ships `sora` (bold display) and `inter` (body) — for a themed third option, load an additional `@remotion/google-fonts` family per project rather than improvising with system fonts. |
| **Mixed weight within one sentence** | Regular weight for connective words, bold only on the 1-2 words that matter ("**Don't** take on all the things people ask"). | Same per-word limitation as color above — split into separate lines/spans if the words need independent weight. |
| **Italic for tonal shift** | A trailing clause in italic/serif against an otherwise plain sans sentence ("9:16 is fine, *but...*"). | **No italic for Myanmar/Burmese text** — Noto Myanmar ships no italic variant, and synthetic slant distorts stacked medials/vowel signs. For Latin scripts, `fontStyle: 'italic'` is trivial to add to `KineticLineInput` (roadmap — not present today). |
| **Skew/perspective per letter** | Each letter offset further down-and-right than the last, creating a "falling downstairs" 3D-perspective look (birthday-card style). | Not supported — would need per-character transforms, a real Remotion animation build, not a quick prop addition. Flag as out of scope unless a project specifically needs it. |

---

## 6. Recipe: "text behind subject" (validated — rembg matte)

A big word sitting BEHIND the speaker, occluded as they move — the signature
"wow" caption for a talking-head. **Validated 2026-07-09** on a Myanmar
talking-avatar (giant city name behind the presenter, read cleanly on both
bright and dark backgrounds). Repeatable recipe — not a one-shot CLI command
yet, so run it as an ad-hoc script per clip:

**Requirements (install once — check first, don't assume):**
```bash
# Are the libs already present? (prints versions, or errors if missing)
python3 -c "import rembg, PIL, onnxruntime; print(rembg.__version__)"
# If missing, install (rembg pulls onnxruntime + numpy; pillow = PIL):
python3 -m pip install "rembg[cpu]" pillow
```
- `ffmpeg` — already a kit dependency (`node workflows/cli.cjs doctor` verifies it).
- First `rembg.new_session("u2net")` **auto-downloads the ~176 MB `u2net.onnx`
  model to `~/.u2net/`** — needs internet ONCE, then it's cached (≈1s/frame after).
- Verified working set (2026-07-09): Python 3.13, rembg 2.0.72, Pillow 12.1,
  onnxruntime 1.24, numpy 2.4. If `pip install rembg` alone fails to import
  onnxruntime, use the `rembg[cpu]` extra (or `rembg[gpu]` on CUDA machines).

1. **Extract frames** at the clip's native fps: `ffmpeg -i clip.mp4 -r 24 fr/%04d.png`.
2. **Matte each frame with `rembg`** (installed as a Python module; the `rembg`
   CLI is usually NOT on PATH — call it in Python):
   ```python
   import rembg
   from PIL import Image
   sess = rembg.new_session("u2net")            # general person model
   cut = rembg.remove(Image.open(frame), session=sess)   # RGBA, person on transparent bg
   cut.save(out)                                # ~1s/frame CPU; model caches after first run
   ```
   Cutout edges (hair, glasses, shoulders) come out clean. Preferred over the
   older MediaPipe `selfie_segmenter_landscape` path — fewer setup steps.
3. **Build the text layer** as one transparent RGBA PNG (PIL, a bold display
   font like Impact; letter-space UPPERCASE; baseline ~0.16·H so the head
   occludes the lower half of the letters; white ~235α + a soft dark shadow for
   legibility on any bg). Size by letter count so it bleeds a little off-frame:
   ~195px for 5 letters, 165 for 6, 140 for 7, 120 for 8 (720-wide 9:16).
   Do NOT draw Myanmar text via `drawtext` (§7) — for Latin words PIL/Impact is fine.
4. **Composite in this exact layer order** — background clip → text → cutout
   sequence on top, keeping the clip's audio:
   ```bash
   ffmpeg -y -i clip.mp4 -loop 1 -i text.png -framerate 24 -i cut/%04d.png \
     -filter_complex "[0:v][1:v]overlay[bt];[bt][2:v]overlay=shortest=1[v]" \
     -map "[v]" -map 0:a? -c:a copy -c:v libx264 -pix_fmt yuv420p -r 24 out.mp4
   ```

Bake this into each clip BEFORE assembly, then add the bottom transcript with
`renderCaptionedVideo` on the assembled video (that layer stays a real command).

**Known caveats:** per-frame matte has no temporal smoothing — fine for talking
heads, can flicker on fast motion; occasional stray blobs near bright lights.
Good for real use, not pixel-perfect. **This is not yet a `workflows/` command;**
if a project needs it often, promote a `renderTextBehindSubject` workflow
(frame extract → rembg batch → composite) per `CREATING_WORKFLOWS.md`.

---

## 7. Myanmar/Burmese text — rendering engine matters

**Never render Myanmar script through `ffmpeg drawtext`.** FreeType (what
`drawtext` uses) has no complex-script shaping — Myanmar needs proper
reordering/positioning of medial consonants and vowel signs, which only a
real shaping engine (HarfBuzz — what Chromium/Remotion use) provides
reliably. This toolkit's existing `renderCaptionedVideo` already routes
through Remotion for exactly this reason ("Burmese-safe shaping" in
AGENT-GUIDE.md) — extend that same rule to ANY new Myanmar text feature,
including hero titles and side badges, not just burned captions.

- Use **Noto Sans Myanmar** / **Noto Serif Myanmar** (already installed,
  many weights: Regular→Black). Both are Myanmar-block-only fonts — **no
  Latin glyph coverage**, so don't mix untransliterated English brand names
  into a Myanmar-font string (renders as tofu boxes). Transliterate or
  render the Latin portion in a separate font/layer.
- No italic exists for Myanmar in Noto — use weight/color/an accent bar
  instead of italic or underline for style variation.
- If ffmpeg-only rendering is unavoidable for a specific technical reason,
  say so explicitly and flag the shaping risk rather than assuming it's fine
  because it "looks okay" in a quick preview — get a native-speaker check
  before shipping.

---

## 8. Route C — creative text with Gemini Omni (PAID, production rules)

Omni `edit` redraws every frame, so text is baked INTO the scene — hand-drawn
marker doodles, painted-on-wall words, letters the subject walks in front of.
The look is organic in a way overlays can't fake. It is **not free**:
**≈ $0.10/second** measured across 16 production calls ($0.89/8s · $0.99/9s ·
$1.03/10s — token-priced). State the estimate + `checkBudget` before running.

```bash
node workflows/cli.cjs generateOmniVideoClip '{
  "task": "edit",
  "inputVideoPath": "clips/broll-8s.mp4",
  "prompt": "Keep everything the same — same people, same motion, same camera, same timing, same lighting. Only add bright-yellow hand-drawn marker doodles: 00:02 — a hand-lettered word position sketches itself upper left inside a loose marker oval. 00:05 — a giant doodle checkmark draws itself with sparkle rays and holds. (no subtitles)",
  "outputPath": "clips/broll-8s-doodled.mp4"
}'
# output is ALWAYS silent → remux:
node workflows/cli.cjs mixVideoAudio '{"videoPath":"clips/broll-8s-doodled.mp4","voiceoverPath":"audio/vo.wav","outputPath":"clips/scene.mp4"}'
```

**Production rules (each one cost real money to learn — don't rediscover):**

1. **Timestamped beats WORK.** `00:02 — {…} 00:05 — {…}` inside one prompt
   lands multiple timed scene changes reliably. Key the timestamps to the VO
   transcript so graphics hit the spoken words.
2. **Keep the prompt MINIMAL.** Descriptive prompts + a character ref image →
   `400 Input blocked` ($0, pre-generation). Drop the ref image when the edit
   doesn't change the person (identity passes through from the footage) and
   strip adjectives. Minimal prompts passed 5/5 after verbose ones failed.
3. **Behind-subject text occludes ONLY at head/shoulder height** (3 pass /
   3 fail): a word crossing the narrow head silhouette hides correctly; a word
   crossing the torso gets painted IN FRONT every time. Phrase as "painted on
   the wall BEHIND the man… letters never drawn over his body". For guaranteed
   torso-level occlusion use the FREE rembg matte (§6) instead.
4. **`duration` is a STRING** `'4s'…'10s'` — a bare number → `400 Invalid
   input at 'response_format'`. Edit tasks: don't pass duration/aspect at all.
5. **10s hard cap per call.** Longer VO → split the base video into ≤10s
   segments, Omni-edit each, `concat`, then a small `setpts` stretch (≤~7% is
   invisible on b-roll) to match the VO length, then remux.
6. **Short English bakes are reliable; keep baked words ≤ 2–3 words.** Verify
   every bake with a frame grab — labels can come out truncated ("subje").
7. **The claim follows the route.** If the VO says "cost $0 / local render",
   that's Route A/B only — re-record the line if the same content ships via
   Omni (≈$0.10/sec). Never let reused copy overclaim.

**Choosing B vs C:** B is free, pixel-exact, and owns precise typography,
captions, and guaranteed occlusion. C buys an in-scene organic look (drawn,
painted, physical) and whole-frame restyles. Ask the user before spending; a
hybrid (C for the doodle world, A for captions on top) is often the answer.

---

## 9. Quick capability matrix

| Want to do this | Supported today | Tool |
|---|---|---|
| Per-line size/color/weight/font/delay | ✅ | `renderKineticReel` |
| Centered/top/bottom static slide + sub + footer | ✅ | `renderSlideStill` |
| Frosted scrim panel behind text on busy bg | ✅ | `scrim: true` on either |
| Burmese-safe captions burned onto video | ✅ | `renderCaptionedVideo` |
| Caption **style: pill / hero** (big, stroke+shadow), **pos: upper/mid/lower**, **align** | ✅ | `renderCaptionedVideo` cue fields — § 0 |
| Per-WORD **accent color** in a caption cue (`**word**` → accent) | ✅ | `renderCaptionedVideo` (KineticReel is still per-line only) |
| Stacked multi-line caption w/ staggered entrance | ✅ | `renderCaptionedVideo` cue `text:"a\nb"` |
| Text stroke/outline | ✅ in captions (hero `style`) · ❌ roadmap in KineticReel | `renderCaptionedVideo` hero; else `scrim` |
| Per-WORD size/weight within one KineticReel line | ❌ roadmap | use `renderTextMotion` separate elements instead |
| Gradient/metallic text color | ✅ | `renderTextMotion` `gradient` (shadow auto-converts to drop-shadow so the fill stays bright) |
| Rotated side badge / margin watermark | ❌ roadmap | manual ffmpeg `transpose` workaround, § 1 |
| Text-behind-subject (occlusion by a moving person) | ✅ recipe (rembg) | § 6 recipe — repeatable, not a one-shot command yet |
| Skew/3D-perspective per letter | ✅ | `renderTextMotion` `perLetter` (stepY/stepRotate/skew) |
| Video-inside-letters (media fill) | ✅ | `renderTextMotion` `mediaFill` |
| Text baked INTO the scene (drawn/painted, subject walks past) | ✅ PAID | Omni edit — §8 (~$0.10/sec) |

Don't tell a user any ❌/⚠️ row "just works" — name the gap and offer the
workaround or the roadmap item explicitly.
