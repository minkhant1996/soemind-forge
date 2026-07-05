---
name: tts-content
description: |
  Generate speech audio using Gemini TTS. Use when user asks for
  "text to speech", "voiceover", "narration", "voice", "audio",
  "podcast", "dialogue", "read this", "speak this", or any
  speech synthesis request.
license: MIT
allowed-tools:
  - generateVoiceover
  - generateMultiSpeakerVoiceover
---

# Text-to-Speech Content Skill

## When This Skill Activates

- User wants text converted to speech
- User needs voiceover for video
- User wants podcast/dialogue audio
- User asks for narration

---

## STEP 1: Ask Audio Type

**Ask the user:**

> What type of audio do you need?
>
> 1. **Single Narrator** - One voice reading text
> 2. **Multi-Speaker** - Dialogue, podcast, conversation
> 3. **Voiceover** - For video/presentation
> 4. **Character Voice** - Specific personality/style

**Store answer as**: `audioType`

---

## STEP 2: Ask Voice Preference

### For Single Narrator:

> What voice characteristics do you want?
>
> **Gender:**
> 1. Female voice
> 2. Male voice
>
> **Tone:**
> 1. Professional/Authoritative
> 2. Friendly/Warm
> 3. Energetic/Excited
> 4. Calm/Soothing
> 5. Casual/Conversational

### For Multi-Speaker:

> How many speakers do you need? (2-4)
>
> For each speaker, I'll ask about their voice.

---

## STEP 3: Voice Selection

### Female Voices

| Voice | Characteristics | Best For |
|-------|-----------------|----------|
| **Zephyr** | Warm, friendly, versatile | General narration |
| **Aoede** | Bright, energetic | Excited content |
| **Kore** | Calm, soothing | Meditation, ASMR |
| **Leda** | Professional, clear | Corporate, tutorials |
| **Achernar** | Authoritative | News, announcements |
| **Pulcherrima** | Elegant, refined | Luxury, premium |

### Male Voices

| Voice | Characteristics | Best For |
|-------|-----------------|----------|
| **Puck** | Friendly, casual | Casual content |
| **Charon** | Deep, authoritative | Documentary |
| **Orus** | Warm, trustworthy | Explainers |
| **Fenrir** | Energetic, dynamic | Ads, promos |
| **Schedar** | Professional, clear | Corporate |
| **Achird** | Calm, measured | Tutorials |

### Voice Recommendation by Content Type

| Content Type | Recommended Voices |
|--------------|-------------------|
| Tutorial/Explainer | Leda, Achird, Orus |
| Podcast | Zephyr + Puck (duo) |
| Advertisement | Fenrir, Aoede |
| Meditation/Calm | Kore, Charon |
| Corporate | Achernar, Schedar |
| Storytelling | Zephyr, Orus |

---

## STEP 4: Ask Style Settings

**Ask the user:**

> How should the voice sound?
>
> **Style:**
> - `neutral` - Standard delivery
> - `vocal_smile` - Bright, sunny
> - `newscaster` - Professional news
> - `whisper` - Soft, intimate
> - `excited` - High energy
> - `casual` - Relaxed, informal
> - `serious` - Grave, formal
>
> **Pace:**
> - `natural` - Normal speed
> - `slow` - Deliberate, measured
> - `energetic` - Quick, upbeat
> - `rapid_fire` - Very fast
>
> **Accent (optional):**
> - `american_general` - Standard US
> - `british_rp` - British received pronunciation
> - `australian` - Australian accent

**Store answers as**: `style`, `pace`, `accent`

---

## STEP 5: Format Text

### For Multi-Speaker

Format the text with speaker labels:

```
Host: Welcome to the show!
Guest: Thanks for having me!
Host: So tell us about your project.
Guest: Well, it started when...
```

### Audio Tags

User can add inline tags for expression:

```
[excited] This is amazing!
[whispers] But keep it a secret.
[laughs] That's hilarious!
[sighs] It's been a long day.
[slow] Listen carefully now.
```

**Available Tags:**
`[excited]`, `[whispers]`, `[laughs]`, `[sighs]`, `[gasp]`,
`[sarcastic]`, `[serious]`, `[slow]`, `[fast]`, `[short pause]`, `[long pause]`

---

## STEP 6: Confirm and Generate

**Show summary:**

```
📋 TTS GENERATION PLAN
======================
Type: {audioType}
Voice(s): {voiceNames}
Style: {style}
Pace: {pace}
Text length: {wordCount} words

Estimated Cost: ~${cost}

Proceed? (yes/no)
```

### Single Speaker Generation

Use the pre-built workflow function — it validates, retries, saves the `.wav`, and reports cost:

```typescript
import { generateVoiceover } from '../index';

const result = await generateVoiceover({
  script: text,
  outputPath: 'output.wav',
  voiceName,
  voiceStyle: { style, pace, accent }
});
// result.data.audioPath, result.data.cost.totalCost
```

### Multi-Speaker Generation

```typescript
import { generateMultiSpeakerVoiceover } from '../index';

const result = await generateMultiSpeakerVoiceover({
  script: dialogueText,
  speakers: [
    { speaker: 'Host', voiceName: 'Zephyr', voiceStyle: { style: 'vocal_smile' } },
    { speaker: 'Guest', voiceName: 'Puck', voiceStyle: { style: 'casual' } }
  ],
  outputPath: 'podcast.wav'
});
```

---

## Content Presets

### Podcast Preset
```yaml
speakers:
  - name: Host
    voice: Zephyr
    style: vocal_smile
    pace: natural
  - name: Guest
    voice: Puck
    style: casual
    pace: natural
```

### Tutorial Preset
```yaml
voice: Leda
style: neutral
pace: slow
accent: american_general
```

### Advertisement Preset
```yaml
voice: Fenrir
style: promo_hype
pace: energetic
```

### Meditation Preset
```yaml
voice: Kore
style: whisper
pace: slow
# Or use custom audioProfile:
audioProfile: "Calm, soothing meditation guide with gentle pauses"
```

---

## All Available Voices

### Female (14)
Achernar, Aoede, Autonoe, Callirrhoe, Despina, Erinome, Gacrux,
Kore, Laomedeia, Leda, Pulcherrima, Sulafat, Vindemiatrix, Zephyr

### Male (16)
Achird, Algenib, Algieba, Alnilam, Charon, Enceladus, Fenrir,
Iapetus, Orus, Puck, Rasalgethi, Sadachbia, Sadaltager, Schedar,
Umbriel, Zubenelgenubi

---

## Cost Reference

| Model | Input | Audio Output |
|-------|-------|--------------|
| gemini-2.5-flash-tts | $0.50/M tokens | $12.00/M tokens |
| gemini-3.1-flash-tts | $0.75/M tokens | $12.00/M tokens |

**Estimate**: ~$0.001 per sentence, ~$0.02 per paragraph
