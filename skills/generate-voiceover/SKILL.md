---
name: generate-voiceover
description: Generate voiceover audio using Gemini TTS. Use for narration, voiceovers, podcasts, multi-speaker dialogue.
allowed-tools: Bash Read Write Edit
---

# Generate Voiceover

## 🔴 WHEN NOT TO USE THIS SKILL

**Voiceover is for NARRATION ONLY** — a narrator speaking over visuals, with no
on-screen speaker.

**Do NOT generate a voiceover for a scene where a character speaks on camera.**
Those clips (Omni `text_to_video` / `image_to_video` / `reference_to_video`, Veo
and Seedance speaking clips) generate their own dialogue audio and lip-sync. The
lines belong in the **video prompt** (`says: <exact words>`), not in a TTS file.
Layering TTS on top double-stacks two performances and muddies the mix.

| Scene | Audio source |
|---|---|
| Character speaks on camera | The clip's own audio — quote the dialogue in the video prompt |
| Narrator over visuals | **This skill** |
| Silent / ambient b-roll | Music bed + clip ambience |

See `workflows/VIDEO-PROMPT-GUIDE.md` §4e-vo.

---

## How to run it (IMPORTANT) — CALL THE CLI, DON'T WRITE A SCRIPT

**Do NOT create a `projects/{name}/scripts/*.ts` file. Run the workflow command:**

```bash
node workflows/cli.cjs generateVoiceover \
  '{"text":"...","outputPath":"projects/{name}/output-contents/vo.wav","voice":"..."}'
```

For dialogue between voices use `generateMultiSpeakerVoiceover`. For long scripts, put the
args in a file and pass `@args.json`. The CLI loads `.env` and prints the JSON result
(path + cost). Argument shapes are in `workflows/WORKFLOWS.md`.

**Free option — Microsoft Edge TTS (`generateEdgeTTSVoiceover`, $0, no API key):** use
when the user wants free narration or a different voice. Same output shape, not
budget-gated. Burmese voices `my-male`/`my-female`; `rate`/`volume`/`pitch` control but no
styles/emotion. Needs the `edge-tts` lib once: `python3 -c "import edge_tts" || python3 -m
pip install edge-tts` (`doctor` reports it). Full args: WORKFLOWS.md § generateEdgeTTSVoiceover.
```bash
node workflows/cli.cjs generateEdgeTTSVoiceover '{"script":"...","voice":"my-female","outputPath":"projects/{name}/output-contents/vo.wav"}'
```
Trade-off: Gemini `generateVoiceover` = styled/emotive voices (paid ~$0.001/req); Edge =
free but plain. For the user's OWN cloned voice, use their WAVs + `infiniteTalkLipsync`, not TTS.

**Output Location:** `projects/{name}/output-contents/`

---

## Step 1: Check Project & Get Script

```
Does projects/{project-name}/ exist?
  YES → Read these files for context:
  NO  → Ask user for the script directly
```

**If project exists, READ and USE:**

From `projects/{name}/templates/project.md`:
- `product.name` → What to mention
- `offer.headline` → What to promote
- `cta.primary` → Call to action to say

From `projects/{name}/templates/brand.md`:
- `tone.voice` → How character speaks (professional, casual, energetic)
- `tone.energy` → Pacing and intensity
- `restrictions.never_say` → Words to AVOID in script

From `projects/{name}/content-plans/`:
- Read the video plan for the dialogue/narration script

Ask: **"What text do you want to convert to speech?"**
(Or use script from video plan)

## Step 1b: Confirm whether this needs a voiceover at all

**Always ask first — don't assume.** A piece may want: a voiceover (off-screen
narrator), an on-screen character speaking (handled by the video skill, not here),
music only, or silence.

> "Do you want a **voiceover** (off-screen narration) on this? Or character-speaks /
> music-only / silent?"

If **no voiceover** → stop here. If **yes** → go to Step 2.

## Step 1c: Check the registry for a locked voice

A project (or a specific character) may already have a locked voice identity so
narration stays consistent across pieces.

```bash
# Check the locked voice's files on disk. Pass the project name — the CLI loads the
# registry itself. id = "voice-main" (or a character's linked_voice id).
node workflows/cli.cjs resolveAsset '["{name}","voice-main"]'
# → { ok, existing[], missing[] }
```

- Found → **pre-fill** the parameters below from it, but **still show them and confirm**
  (Step 3) — don't silently auto-run.
- On-screen character? use that character's `linked_voice` so voice matches the face.
- Not found → choose params with the user, then `registerAsset('{name}', 'voices', {...})`.

## Step 2: Suggest each parameter (with reasoning)

Read `brand.md` tone, then **propose** a value for every parameter and say *why* — the
user adjusts, you don't decide alone.

**Voice** (suggest 1, offer 2 alternatives):

| Voice | Gender | Best For | Matches brand tone |
|-------|--------|----------|--------------------|
| Zephyr | Male | Professional, calm narration | "professional", "calm" |
| Puck | Male | Energetic, casual, youthful | "energetic", "casual" |
| Charon | Male | Deep, authoritative | "authoritative", "serious" |
| Kore | Female | Professional, clear | "professional", "clear" |
| Aoede | Female | Warm, friendly, approachable | "friendly", "warm" |
| Fenrir | Male | Strong, dramatic | "bold", "dramatic" |
| Leda | Female | Soft, gentle | "gentle", "calm" |
| Orus | Male | Mature, wise | "wise", "trustworthy" |

**Other parameters to propose:**
- **Style** — neutral · professional · casual · energetic · calm · excited · serious
- **Pace** — natural · slow · fast
- **Accent** — american_general · british_rp · australian · indian
- **Audio profile** (optional, fine control) — a free-text line, e.g.
  *"warm radio host with a slight smile"* → maps to `voiceStyle.audioProfile`
- **Script** — the exact words, formatted per **§ Script formatting & pacing** below
  (punctuation = pause control; normalize numbers/symbols/URLs). Estimate length:
  ~2.5 words/sec at natural pace, so an N-second piece ≈ N×2.5 words. Flag if the
  script is too long/short for the target.
- **Pronunciation** — call out brand names / foreign / unusual words and ask for the
  intended pronunciation (e.g. "Acme" → "AK-mee"); for non-English/Myanmar/Thai confirm
  language + script handling.
- **Reference read** — ask once: *"Is there a narration you'd like this to sound
  like — a past VO of yours, a creator/channel, or an ad read? (link/file/description,
  or 'none')"* If given, translate what you hear/see into concrete params: voice pick,
  style, pace, and an `audioProfile` line describing that delivery — and check
  `assets/style/copy-examples.md` for past scripts whose phrasing the new script
  should match. Save the description to the registered voice so future VOs reuse it.
- **Music under the voiceover?** — yes/no; if yes, note volume (e.g. 30%) for the mix.

## Step 3: Show the full setup and CONFIRM (do NOT auto-run)

Present everything back as one summary and wait for explicit go — let the user change any
single field:

```
🎙️ VOICEOVER SETUP — confirm or adjust each line
  Voice:        Kore           (suggested — matches your "professional, warm" brand tone)
                 alt: Aoede (friendlier) · Charon (deeper male)
  Style:        professional
  Pace:         natural
  Accent:       american_general
  Audio profile: (none)        — add a custom description?
  Script:       "…"            (~38 words ≈ 15s at natural pace ✓)
  Pronunciation: "Acme" → AK-mee?
  Music under VO: no           (or: yes @ 30%)
  Output:       projects/{name}/output-contents/voiceover.wav

Proceed, or change a field? (proceed / change voice / slower / edit script / add music …)
```

Only after the user confirms → Step 4. If the user says "just do it", still **show this
summary once** and state the assumed defaults before running.

## Step 4: Single Speaker Generation

**Use the pre-built workflow function — do NOT re-implement file saving, retry, or cost handling.**
It validates input, retries on transient errors, writes the `.wav`, and returns the cost.

**Only run after the user confirmed the setup in Step 3.** Use the exact values they
approved:

```bash
# voiceName = the CONFIRMED voice; voiceStyle fields all confirmed in Step 3;
# audioProfile is optional free-text, only if the user added one.
node workflows/cli.cjs generateVoiceover '{"script":"The confirmed script text","outputPath":"projects/{name}/output-contents/voiceover.wav","voiceName":"Kore","voiceStyle":{"style":"professional","pace":"natural","accent":"american_general","audioProfile":""}}'
# → { success:true, data:{ audioPath, cost:{ totalCost } } }  |  { success:false, error:{ code, message } }
```

If it succeeded, save the voice identity so future narration stays consistent (ask the
user first if it should become the project's locked voice):

```bash
node workflows/cli.cjs registerAsset '["{name}","voices",{"id":"voice-main","label":"Main narrator","voice_name":"Kore","style":"professional","pace":"natural","accent":"american_general"},{"date":"<today ISO>"}]'
```

## Step 5: Multi-Speaker (Podcast/Interview)

Ask user to format script with speaker labels:
```
Host: Welcome to the show!
Guest: Thanks for having me.
Host: Let's dive right in...
```

Then generate with the pre-built workflow function:
```bash
node workflows/cli.cjs generateMultiSpeakerVoiceover '{"script":"<speaker-labeled script>","speakers":[{"speaker":"Host","voiceName":"Zephyr"},{"speaker":"Guest","voiceName":"Aoede"}],"outputPath":"projects/{name}/output-contents/podcast.wav"}'
# → { success:true, data:{ audioPath } }
```

## Step 6: Combine with Video (if needed)

If this voiceover is for a video:
```bash
ffmpeg -i video.mp4 -i voiceover.wav -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 output.mp4
```

## Step 7: Save Output

Save to: `projects/{name}/output-contents/` or current directory
- `voiceover.wav`
- `script.txt` (keep the script)

## Pipeline-first + audit trail (mandatory)

- Author `<content-id>.pipeline.json` IN the content folder BEFORE generating
  (nodes = CLI commands, `{{node.data.field}}` refs), then
  `node workflows/cli.cjs runPipeline @<file>` — see `workflows/pipelines/README.md`.
- The content folder gets a `prompts.txt` with the VO script (including audio tags)
  and voice/style params; update it on every retry with a one-line RESULT note.
- Log each generation via the `createGenerationManifest` / `addManifestEntry`
  CLI commands (AGENT-GUIDE Step 5).

## Cost

~$0.001 per sentence (very cheap)

Example: 100-word script = ~$0.01

## Script formatting & pacing — SPACING AND PUNCTUATION ARE DELIVERY CONTROLS

The TTS model reads the script *as formatted*. Whitespace, punctuation, and line
breaks all change the output audio — write the script for the ear, not the eye.

**Punctuation → pause mapping (use deliberately):**

| You write | The model does |
|---|---|
| `,` comma | short beat |
| `.` period | full stop + breath |
| `…` ellipsis | hesitation / trailing off |
| `—` em-dash | dramatic beat mid-sentence |
| `?` / `!` | rising / emphatic intonation |
| blank line (paragraph break) | longer pause, topic shift |
| `[short pause]` / `[long pause]` tag | explicit pause where punctuation isn't enough |

- **Keep sentences short** — one idea per sentence reads naturally; long
  comma-chains rush and flatten.
- **Normalize whitespace** — collapse double spaces and accidental mid-sentence
  line breaks before generating; they produce audible stutters/odd gaps.
  Deliberate paragraph breaks between beats are GOOD — that's the pause control.
- **One thought per line for hooks/CTAs** — a line break before the CTA gives it
  its own beat.

**Normalization — spell out what TTS mangles (fix in the script, don't hope):**

| Written | Script should say |
|---|---|
| `$50` | "fifty dollars" |
| `24/7` | "twenty-four seven" |
| `2026-07-09` | "July ninth" (or as the brand says dates) |
| `50%` | "fifty percent" |
| `AI`, `FAQ` | keep if spelled letter-by-letter is wanted; else write it out ("A-I") |
| URLs (`acme.com/shop`) | "acme dot com slash shop" — or cut it; URLs rarely belong in VO |
| Brand/foreign names | phonetic respelling confirmed in Step 2 ("Acme" → "AK-mee") |

**Tips:**
- Test different voices for best fit; for dramatic effect use style 'excited' or 'serious'
- Read the script aloud once yourself (or mentally) — anywhere YOU need a breath, the model does too

## Expressive delivery is the default (2026-07-05)

Voiceovers now use gemini-3.1-flash-tts-preview: embed inline audio tags IN the
script — "[excited] …", "[short pause]", "[long pause]", "[whispers]",
"[dry chuckle]" (200+ tags; documented set in `gemini/types.ts` TTSAudioTag) —
plus audioProfile as director's notes. Never ship a flat read: every script
should carry 2-4 tags placed where the emotion turns. Old model available via
ttsModel:"gemini-2.5-flash-preview-tts". ffprobe the duration — expressive reads
run longer.
