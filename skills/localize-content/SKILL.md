---
name: localize-content
description: Produce existing content in more languages — translated copy, re-generated voiceover in the same brand voice, per-language captions and publish packs. Use when the user says "make this in Spanish", "translate my ad", "localize for Thailand", "multi-language version".
allowed-tools: Bash Read Write Edit Glob Grep
---

# Localize Content

One piece of content, N markets. The visuals are already paid for — localization
re-generates only the **cheap layers**: script, voiceover (~$0.01), captions
(free), and copy. A $10 video becomes 3 markets for ~$0.10.

## STEP 1: Scope

Ask once: which languages/markets? Then identify what the piece contains
(check its manifest — see `/revise-content` STEP 1):

| Layer | Localize how | Cost |
|-------|-------------|------|
| Script / voiceover | translate → `generateVoiceover` per language | ~$0.01 each |
| On-screen captions (.srt) | `generateCaptions` from translated script | free |
| Caption/post copy + hashtags | translate + adapt (see STEP 2) | ~$0.001 |
| Text baked INTO the image/video | can't swap text in-place — flag it | see below |

> **Baked-in text warning:** if the visual has burned-in text (headline on a
> thumbnail, text overlay in a scene), tell the user up front: that layer needs
> regeneration per language (`/revise-content` for that piece, translated
> prompt). Get approval before this — it's the only expensive part.

## STEP 2: Translate like a marketer, not a dictionary

Use `generateText` (or translate yourself if fluent) with instructions to:

- Keep the brand tone from `brand.md` — a warm-casual brand must stay
  warm-casual in every language.
- **Transcreate** hooks, idioms, and CTAs — a literal pun translation is worse
  than a new hook with the same intent.
- Respect `restrictions` (never_say lists apply in every language; add
  market-specific legal terms if the user names any).
- Keep timing: a voiceover script must fit the same video duration —
  translations run 10-30% longer in many languages, so tighten wording, don't
  rush the voice.
- Localize hashtags (research/ask — don't literally translate tags) and
  numbers/currency formats.

Show the user each translation before generating audio. If they don't read the
language, say what you adapted and why.

## STEP 3: Regenerate the cheap layers per language

```bash
# Voiceover — SAME locked voice id from the asset registry for brand continuity
node workflows/cli.cjs generateVoiceover '{"script":"<translated script>","voiceName":"Kore","outputPath":".../es/voiceover.wav"}'

# Remix onto the existing video (local, free)
node workflows/cli.cjs mixVideoAudio '{"videoPath":".../final.mp4","voiceoverPath":".../es/voiceover.wav","musicPath":".../music.wav","outputPath":".../es/final-es.mp4"}'

# Captions from the translated script (local, free)
node workflows/cli.cjs generateCaptions '{"script":"<translated script>","totalDuration":30,"outputPath":".../es/captions.srt"}'
```

Check the voice supports the language (Gemini TTS is multilingual, but listen
to the first output before batching the rest). Non-Latin scripts (Thai,
Myanmar, Arabic…): confirm caption font/rendering — see the content-preflight
edge-case checklist.

## STEP 4: Package per language

`/package-content` each localized cut into
`output-contents/{piece}/publish/{lang}/{platform}/` with the translated
caption, localized hashtags, and link. Then report:

```
✅ LOCALIZED — summer-ad → ES, TH, MM
  es/  final-es.mp4 + captions + IG/TikTok packs   $0.011
  th/  final-th.mp4 + captions + IG/TikTok packs   $0.012
  mm/  final-mm.mp4 + captions + FB pack           $0.012
  Flagged: thumbnail has baked-in English headline — regenerate per language? (~$0.07 each)
```

`recordCost` the spend. Save translated scripts alongside outputs so future
revisions localize from the same source.

## Pipeline-first + prompts.txt (mandatory)

- Author `<content-id>.pipeline.json` in each language's folder BEFORE generating
  (nodes = CLI commands — voiceover → mix → captions — `{{node.data.field}}` refs),
  then `node workflows/cli.cjs runPipeline @<file>`. See `workflows/pipelines/README.md`.
- Each language folder gets a `prompts.txt` with the translated script (audio tags
  included) and voice params; update it on every retry with a one-line RESULT note.
