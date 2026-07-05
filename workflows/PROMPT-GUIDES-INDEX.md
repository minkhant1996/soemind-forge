# Prompt Guides Index

> **MASTER REFERENCE:** This index tells you which guides to read for each task.
> Read this FIRST, then read the specific guides for your task.

---

## Quick Decision Tree

```
What are you generating?
│
├─► THUMBNAIL (YouTube, podcast, social cover)
│   └─► Read: THUMBNAIL-GUIDE.md + STYLE-GUIDE.md
│   └─► Ratio: 16:9 (YouTube), 9:16 (vertical video covers)
│   └─► If person: Check character reference FIRST
│
├─► IMAGE (feed post, carousel, product photo)
│   └─► Read: IMAGE-PROMPT-GUIDE.md + PLATFORM-SPECS.md + STYLE-GUIDE.md
│   └─► Ratio: 4:5 (IG/FB/TikTok feed), 1:1 (universal), 16:9 (Twitter/LinkedIn)
│
├─► CAROUSEL
│   └─► Read: IMAGE-PROMPT-GUIDE.md + PLATFORM-SPECS.md
│   └─► Ratio: 4:5 (IG/TikTok), 1:1 (FB/LinkedIn)
│
├─► VIDEO (TikTok, Reel, ad, explainer, product video)
│   │
│   ├─► Short-form (Reels, Shorts, TikTok)
│   │   └─► Ratio: 9:16 ALWAYS
│   │   └─► Read: VIDEO-PROMPT-GUIDE.md + PLATFORM-SPECS.md
│   │
│   ├─► Long-form (YouTube, FB Video)
│   │   └─► Ratio: 16:9
│   │   └─► Read: VIDEO-PROMPT-GUIDE.md + PLATFORM-SPECS.md
│   │
│   ├─► Which model/API?
│   │   ├─► Gemini Veo (default) → VIDEO-PROMPT-GUIDE.md
│   │   └─► Seedance 2.0 (lip-sync) → SEEDANCE-PROMPT-GUIDE.md
│   │
│   ├─► Silent/B-roll → VIDEO-PROMPT-GUIDE.md (§1-4b)
│   ├─► Speaking character → VIDEO-PROMPT-GUIDE.md (§4e) or SEEDANCE (§Lip Sync)
│   ├─► Multi-clip → VIDEO-PROMPT-GUIDE.md (§4c-4d)
│   └─► With voiceover → generate-voiceover/SKILL.md
│
├─► VOICEOVER (narration, TTS, podcast)
│   └─► Read: generate-voiceover/SKILL.md
│
├─► MUSIC (background, jingle, soundtrack)
│   └─► Read: generate-music/SKILL.md
│
├─► BRAND ASSETS (logo, profile pic, cover image, highlights)
│   └─► Read: BRAND-ASSETS-GUIDE.md + PLATFORM-SPECS.md
│   └─► Profile: 1:1, Cover: 16:9 (cropped per platform)
│
├─► PLATFORM SPECS (aspect ratios, sizes, file limits)
│   └─► Read: PLATFORM-SPECS.md
│
└─► CONTENT PLAN (calendar, campaign, strategy)
    └─► Read: content-preflight/SKILL.md + plan-content/SKILL.md
```

---

## Aspect Ratio Quick Reference

| Content | Ratio | Platforms |
|---------|-------|-----------|
| Feed post (portrait) | **4:5** | IG, FB, TikTok |
| Feed post (square) | **1:1** | All platforms |
| Feed post (wide) | **16:9** | Twitter, LinkedIn, YouTube |
| Short video | **9:16** | Reels, Shorts, TikTok |
| Long video | **16:9** | YouTube, FB Video |
| Carousel | **4:5** or **1:1** | Varies by platform |
| Story | **9:16** | IG, FB, Snapchat |
| Thumbnail | **16:9** | YouTube |
| Profile pic | **1:1** | All platforms |
| Pinterest | **2:3** | Pinterest |

---

## Guide Purposes

| Guide | What It Covers | Read When |
|-------|----------------|-----------|
| **PLATFORM-SPECS.md** | Aspect ratios, resolutions, file limits for ALL platforms (IG, FB, TikTok, YT, LinkedIn, Twitter, Pinterest) | Before generating ANY content |
| **THUMBNAIL-GUIDE.md** | Viral thumbnail patterns, face+emotion, before/after, faceless, character reference requirements | Generating ANY thumbnail |
| **IMAGE-PROMPT-GUIDE.md** | Shot types, camera angles, lighting, composition, lens, effects, color grading | Generating ANY image |
| **VIDEO-PROMPT-GUIDE.md** | Camera movements, shot types, lighting, effects, transitions, clip chaining, character dialogue | Generating video with Gemini Veo |
| **SEEDANCE-PROMPT-GUIDE.md** | 6-part prompt structure, multimodal refs, integrated audio (dialogue + SFX + music), lip-sync, multi-shot narratives | Seedance 2.0 videos, lip-sync, audio integration |
| **BRAND-ASSETS-GUIDE.md** | Logo variations, profile images, cover/banner images, Instagram highlights, YouTube watermarks | Setting up brand presence on social platforms |
| **STYLE-GUIDE.md** | Visual styles (Pixar, anime, vintage, cyberpunk, meme, etc.) | Generating ANY visual content |
| **WORKFLOWS.md** | API functions, code examples, workflow selection | Writing generation code |
| **MANIFEST-GUIDE.md** | Generation audit trail — manifest.json format, logging prompts/parameters/costs per generation, review reports | Any generation session (manifest is mandatory) |
| **CREATING_WORKFLOWS.md** | How to author a new reusable workflow function in index.ts (typed input, WorkflowResult, retry, cost) | Extending the workflow library |
| **templates/ASSETS-GUIDE.md** | Asset folder structure, what users provide vs agents generate, file naming, registration | Project setup, asset management |

---

## VIDEO-PROMPT-GUIDE.md Sections

| Section | Content | Read When |
|---------|---------|-----------|
| §1. Shot Types | EWS, wide, medium, close-up, etc. | Always |
| §2. Camera Movements | Dolly, pan, tilt, crane, orbit, etc. | Always |
| §3. Lens Choices | 16mm to 135mm, depth of field | Always |
| §4. Lighting | Natural, studio, atmospheric, color temp | Always |
| §4b. Visual Effects | Lens effects, atmosphere, color grading, glow | When video needs effects |
| §4c. Scene Transitions | Cuts, fades, dissolves, match cuts | Multi-clip videos |
| §4d. Clip Chaining | Sequential prompts, keyframe chaining, continuity | Multi-clip sequences |
| §4e. Character Speaking | Dialogue, voice tone, acting, multi-character | Speaking characters |
| §5. Style & Mood | Cinematic, documentary, commercial | Always |
| §6. Action Verbs | Strong motion language | Action scenes |
| §7. Keyframe Workflow | First/last frame generation | Character consistency |

---

## IMAGE-PROMPT-GUIDE.md Sections

| Section | Content | Read When |
|---------|---------|-----------|
| Composition & Framing | Shot types, body framing, angles | Always |
| Lens Perspective | Focal lengths, lens effects | Always |
| Subject Description | People, products, expressions | Always |
| Environment & Setting | Indoor, outdoor, backgrounds | Always |
| Lighting | Natural, studio, atmospheric, color temp | Always |
| Visual Effects | Lens, film, atmosphere, color grading, glow | When image needs effects |
| Style & Mood | Photography styles, mood keywords | Always |
| Platform Specs | Aspect ratios per platform | Always |

---

## SEEDANCE-PROMPT-GUIDE.md Sections

| Section | Content | Read When |
|---------|---------|-----------|
| §1. Overview & Specs | Duration limits, resolution, multimodal inputs | Always (Seedance) |
| §2. Core Prompt Formula | 6-part structure: Subject→Action→Environment→Camera→Style→Constraints | Always (Seedance) |
| §3. Camera & Lighting | Movement types, lighting setups, visual style keywords | Always (Seedance) |
| §4. Constraints | Negative prompts, what to exclude | Complex scenes |
| §5. Multimodal References | @image1, @video1, @audio1 tagging, reference types | Using image/video/audio refs |
| §6. Audio Integration | Dialogue with lip-sync, SFX, background music | Videos with audio |
| §7. Character Consistency | Reference tagging, description strategy, multiple angles | Character videos |
| §8. Lip Sync | Dialogue pacing, phonetic tips, expression sync | Speaking characters |
| §9. Multi-Shot Narratives | Scene sequencing, continuity, cut planning | Multi-scene videos |
| §10. Video Operations | Extend, loop, remix existing clips | Editing/extending |
| §11. Genre Patterns | Action, transformation, POV, commercial formulas | Genre-specific content |

### When to Use Seedance vs Veo

| Scenario | Use Seedance | Use Veo |
|----------|--------------|---------|
| Lip-synced dialogue | ✅ Best choice | ❌ No lip-sync |
| Integrated SFX + music | ✅ Native audio | ❌ Add in post |
| Image-to-video with ref | ✅ @image1 syntax | ✅ referenceImagePath |
| Multi-shot narrative | ✅ Built-in support | ✅ Clip chaining |
| Simple B-roll | Either works | ✅ Simpler API |
| Quick generation | ❌ More complex | ✅ Faster |

---

## STYLE-GUIDE.md Sections

| Section | Content | Read When |
|---------|---------|-----------|
| Animation Styles | Pixar, anime, claymation, 2D cartoon | Animated content |
| Artistic Styles | Vintage, art deco, watercolor, pop art | Artistic/stylized content |
| Modern/Tech Styles | Futuristic, cyberpunk, glass morphism | Tech/modern content |
| Illustration Styles | Flat, line art, hand drawn, geometric | Illustrated content |
| 3D/CGI Styles | 3D render, clay, glass, metallic | 3D/product content |
| Photography Styles | Product, lifestyle, editorial, portrait | Photo-realistic content |
| Era/Period Styles | Medieval, Victorian, 1950s, Y2K | Period-specific content |
| Meme/Internet Culture | Lo-fi, glitch, aesthetic, cottagecore | Social/viral content |
| Platform Recommendations | TikTok, Instagram, LinkedIn, YouTube | Platform-specific |

---

## Routing by Task Type

### Image Generation Tasks

| Task | Guides to Read |
|------|----------------|
| Product photo | IMAGE §Subject(Products), §Lighting(Studio), STYLE §Photography |
| Thumbnail | IMAGE §Composition, §Lighting, STYLE §Platform(YouTube) |
| Carousel | IMAGE (all), STYLE (pick style) |
| Character portrait | IMAGE §Subject(People), §Lighting, §Character Consistency |
| Social graphic | IMAGE §Platform Specs, STYLE §Platform-specific |

### Video Generation Tasks

| Task | Guides to Read |
|------|----------------|
| Silent B-roll | VIDEO §1-4, STYLE |
| Product video | VIDEO §1-4b, §7(keyframe), STYLE |
| UGC/Testimonial | VIDEO §1-4e(speaking), STYLE |
| Explainer | VIDEO §4c-4d(chaining), §4e(if speaking), STYLE |
| Ad (multi-clip) | VIDEO (all sections), STYLE |
| Character intro | VIDEO §4e(speaking), §7(keyframe), STYLE |

### Speaking Video Tasks

| Task | Guides to Read |
|------|----------------|
| Single character | VIDEO §4e (Single Character Speaking) |
| Multi-character | VIDEO §4e (Multi-Character Dialogue) |
| Emotional scene | VIDEO §4e (Expression, Body Language, Acting Direction) |
| Professional/corporate | VIDEO §4e (Voice Description, Tone) |

### Seedance 2.0 Tasks

| Task | Guides to Read |
|------|----------------|
| Lip-synced dialogue | SEEDANCE §6 (Audio Integration), §8 (Lip Sync) |
| Video with SFX + music | SEEDANCE §6 (Dialogue, SFX, BGM sections) |
| Image-to-video | SEEDANCE §5 (Multimodal References), §7 (Character Consistency) |
| Multi-shot narrative | SEEDANCE §9 (Multi-Shot Narratives), VIDEO §4c-4d |
| Action sequence | SEEDANCE §11 (Action Pattern) |
| Product transformation | SEEDANCE §11 (Transformation Pattern) |
| POV/immersive | SEEDANCE §11 (POV Pattern) |
| Commercial/ad | SEEDANCE §11 (Commercial Pattern), VIDEO §4e |
| Extend/loop video | SEEDANCE §10 (Video Operations) |

---

## Checklist Before Generating

```
□ Identified content type (image/video/voiceover/music)
□ Chose video model if applicable:
  □ Veo → simpler API, quick B-roll, standard video
  □ Seedance → lip-sync, integrated audio, multimodal refs
□ Read the appropriate guide(s) from the decision tree above
□ Checked STYLE-GUIDE.md for visual style options
□ Applied proper terminology from the guides:
  □ Shot type / framing
  □ Camera angle (image) or movement (video)
  □ Lens choice
  □ Lighting setup
  □ Visual effects (if needed)
  □ Color grading / mood
  □ Character speaking details (if applicable)
□ For Seedance specifically:
  □ Used 6-part structure (Subject→Action→Environment→Camera→Style→Constraints)
  □ Tagged multimodal refs correctly (@image1, @video1, @audio1)
  □ Specified audio components (dialogue, SFX, BGM) if needed
  □ Applied lip-sync best practices for speaking characters
□ Built prompt using the guide's structure/formula
```

---

## File Locations

```
workflows/
├── PROMPT-GUIDES-INDEX.md    ← You are here (start here)
├── PLATFORM-SPECS.md         ← Aspect ratios & sizes for all platforms
├── IMAGE-PROMPT-GUIDE.md     ← Image generation (Gemini Imagen)
├── VIDEO-PROMPT-GUIDE.md     ← Video generation (Gemini Veo)
├── SEEDANCE-PROMPT-GUIDE.md  ← Seedance 2.0 (lip-sync, audio, multimodal)
├── THUMBNAIL-GUIDE.md        ← Viral thumbnails (face+emotion, faceless, etc.)
├── BRAND-ASSETS-GUIDE.md     ← Logo, profile, cover, highlights
├── STYLE-GUIDE.md            ← Visual styles
├── WORKFLOWS.md              ← API & code
├── MANIFEST-GUIDE.md         ← Generation audit trail (manifest.json)
└── CREATING_WORKFLOWS.md     ← Author a new workflow function

templates/
├── ASSETS-GUIDE.md           ← What to store in assets folder
├── assets.config.template.yaml ← Asset registry template
├── project.template.md       ← Project brief template
└── brand.template.md         ← Brand guidelines template

skills/
├── generate-image/SKILL.md   ← Image workflow
├── generate-video/SKILL.md   ← Video workflow
├── generate-voiceover/SKILL.md
├── generate-music/SKILL.md
├── generate-brand-assets/SKILL.md ← Social profiles, covers
├── content-preflight/SKILL.md ← Run first
├── content-review/SKILL.md   ← Pre-generation review
└── ...
```
