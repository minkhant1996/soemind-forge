---
name: write-copy
description: Write the words — scroll-stopping hooks, framework-driven scripts, and platform-ready captions with hashtags. Use when the user needs hook ideas, a video/ad script, ad copy, post captions, or says "what should I post", "write a script", "give me hooks", "write the caption".
allowed-tools: Bash Read Write Edit Glob Grep
---

# Write Copy (hooks · script · caption)

The creative bottleneck isn't generating media — it's knowing **what to say**. This skill
generates hooks, scripts, and captions using proven direct-response frameworks, then lets
the user pick and refine. Backed by workflow commands — **call the CLI, don't write a script:**

```bash
node workflows/cli.cjs generateHooks '<json-args>'     # also: generateScript, generateCaption
```

The TypeScript call signatures shown below document each command's **arguments** — translate
them into `node workflows/cli.cjs <command> '<json-args>'`, don't paste them into a new file.

Pull context from the project first when it exists (`project.md` audience/pain points/offer;
`brand.md` tone/restrictions) so the copy is on-brand and never violates `restrictions`.

---

## STEP 0: Check for reference copy BEFORE writing anything

Voice consistency comes from examples, not adjectives. Before generating hooks,
scripts, or captions:

1. **Check the registry** for saved copy examples:
   ```bash
   node workflows/cli.cjs resolveAsset '["{name}","style-copy"]'   # a style_references id holding copy examples
   cat projects/{name}/assets/style/copy-examples.md 2>/dev/null
   cat projects/{name}/style-samples/caption-examples/*.md 2>/dev/null   # user's drop inbox
   ```
   Found → extract the patterns (sentence length, emoji use, hashtag style, CTA
   phrasing, formality) and MIRROR them in everything you write below.
2. **Nothing saved → ask once:**
   > *"Do you have past posts, captions, or scripts that worked well — or accounts
   > whose copy style you like? Paste 1-3 examples (or 'none' — I'll go from brand.md)."*
   - Examples given → save to `projects/{name}/assets/style/copy-examples.md` and
     register (`registerAsset '["{name}","style_references",...]'`) so future pieces reuse them.
   - "none" → proceed from `brand.md` tone and state which tone assumptions you made.
3. When examples exist, note in `prompts.txt` which reference the copy was matched to.

---

## STEP 1: Hooks (pick the angle before writing the whole thing)

Generate a spread of hooks across angles and let the user choose 1–2 to build on.

```bash
node workflows/cli.cjs generateHooks '{"topic":"AI study planner app","audience":"uni students prepping for finals","painPoint":"no idea where to start revising","platform":"tiktok","count":8}'
# h.data.hooks: [{ text, angle }]  — angles: problem | curiosity | result | contrarian | question | stat | story
```

**Show them grouped by angle and ask which to use.** Don't auto-pick — the hook decides the
whole piece.

---

## STEP 2: Script (framework-driven, sized to duration)

Once a hook is chosen, write the script with a framework that fits the goal:

| Framework | Best for |
|-----------|----------|
| `hook-retain-reward` | short-form video (TikTok/Reels/Shorts) — default |
| `PAS` (Problem-Agitate-Solution) | pain-led ads |
| `AIDA` (Attention-Interest-Desire-Action) | classic direct response |
| `BAB` (Before-After-Bridge) | transformation / results |
| `star-story-solution` | testimonials / founder story |

```bash
# hook: pass the chosen hook text from generateHooks
node workflows/cli.cjs generateScript '{"brief":"AI study planner that builds a revision schedule in 60 seconds","framework":"PAS","platform":"tiktok","durationSeconds":30,"hook":"<chosen hook text>","cta":"Try it free — link in bio"}'
# s.data: { framework, sections:[{label, voiceover, visual}], wordCount, estimatedDurationSeconds }
```

**Show the script as labelled sections (voiceover + visual cue) and the estimated duration.**
Flag if `estimatedDurationSeconds` is far from the target so the user can trim/expand.
This `voiceover` text feeds straight into `generateVoiceover()` and the per-scene `visual`
cues feed `generateStoryboard()` / the video skill.

---

## STEP 3: Caption (publish-ready, per platform)

The last mile — the post copy + hashtags that actually ship with the video/image.

```bash
node workflows/cli.cjs generateCaption '{"topic":"AI study planner app","platform":"instagram","tone":"friendly, confident","cta":"Link in bio","count":3}'   # platform: tiktok | instagram | youtube | facebook
# c.data.captions: [{ text, hashtags:[] }]
```

Generate per-platform variants if the piece is cross-posted (each platform has different
length + hashtag norms). Save the chosen caption next to the output, e.g.
`projects/{name}/output-contents/.../caption.md`.

---

## How it connects

```
generateHooks → pick → generateScript → { voiceover → generateVoiceover,
                                          visual cues → generateStoryboard → video }
                                       → generateCaption → caption.md
```

Always **suggest and confirm** — present options, recommend one with a reason, let the user
edit. Never fabricate stats/testimonials (pull only real ones from `project.md`).
