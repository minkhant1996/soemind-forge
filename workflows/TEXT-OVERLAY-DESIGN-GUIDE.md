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

## 8. Quick capability matrix

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
| Per-WORD size/weight within one KineticReel line | ❌ roadmap | split into adjacent lines as a workaround |
| Gradient/metallic text color | ❌ roadmap | — |
| Rotated side badge / margin watermark | ❌ roadmap | manual ffmpeg `transpose` workaround, § 1 |
| Text-behind-subject (occlusion by a moving person) | ✅ recipe (rembg) | § 6 recipe — repeatable, not a one-shot command yet |
| Skew/3D-perspective per letter | ❌ out of scope for now | — |

Don't tell a user any ❌/⚠️ row "just works" — name the gap and offer the
workaround or the roadmap item explicitly.
