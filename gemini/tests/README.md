# Gemini Services Test Suite

Test scripts for all Google Gemini AI services.

## Setup

1. Ensure you have a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

2. Install dependencies (from backend root):
   ```bash
   npm install @google/genai dotenv
   npm install -D @types/node
   ```

## Running Tests

### Run All Tests
```bash
npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts
```

### Run Individual Test Suites
```bash
# Text generation (fastest)
npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=text

# TTS (text-to-speech)
npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=tts

# Image generation
npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=image

# Video generation (slowest - can take 5-15 min)
npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=video

# Music generation
npx ts-node src/services/gemini/tests/scripts/run-all-tests.ts --only=music
```

### Run Scripts Directly
```bash
npx ts-node src/services/gemini/tests/scripts/test-text-generation.ts
npx ts-node src/services/gemini/tests/scripts/test-tts.ts
npx ts-node src/services/gemini/tests/scripts/test-image.ts
npx ts-node src/services/gemini/tests/scripts/test-video.ts
npx ts-node src/services/gemini/tests/scripts/test-music.ts
```

## Test Coverage

### Text Generation (`test-text-generation.ts`)
- **Models**: gemini-3.5-flash, gemini-3.1-flash-lite, gemini-2.5-flash, gemini-2.5-flash-lite
- **Output Formats**: Plain text, JSON structured output
- **Estimated Time**: 1-2 minutes
- **Estimated Cost**: ~$0.001

### TTS (`test-tts.ts`)
- **Voices**: Zephyr, Aoede, Puck, Charon, Enceladus
- **Features**:
  - Voice settings (style, pace, accent)
  - Custom audio profiles
  - Multi-speaker conversations
  - Audio tags ([excited], [whispers], etc.)
- **Estimated Time**: 2-3 minutes
- **Estimated Cost**: ~$0.01

### Image Generation (`test-image.ts`)
- **Models**:
  - gemini-3-pro-image (Nano Pro - highest quality)
  - gemini-3.1-flash-image-preview (Nano 2 - fast)
- **Aspect Ratios**: 16:9, 9:16, 1:1
- **Sizes**: 512, 1K, 2K
- **Estimated Time**: 2-4 minutes
- **Estimated Cost**: ~$0.50

### Video Generation (`test-video.ts`)
- **Models**:
  - veo-3.1-lite-generate-preview (budget/fast)
  - veo-3.1-fast-generate-preview (fast)
  - veo-3.1-generate-preview (standard quality)
- **Duration**: 4 seconds per video
- **Resolution**: 720p
- **Estimated Time**: 5-15 minutes (requires polling)
- **Estimated Cost**: ~$0.50-1.00

### Music Generation (`test-music.ts`)
- **Model**: lyria-3
- **Styles**:
  - Tech startup upbeat
  - Corporate background
  - Motivational inspiring
  - Lo-fi work music
  - Podcast intro
- **Duration**: 30 seconds per clip
- **Estimated Time**: 2-3 minutes
- **Estimated Cost**: ~$0.20

## Output Files

All generated files are saved to `tests/output/`:

```
output/
├── text_gemini_3_5_flash_text.txt
├── text_gemini_3_5_flash_json.json
├── text_gemini_2_5_flash_text.txt
├── text_gemini_2_5_flash_json.json
├── text_generation_summary.json
├── tts_basic_zephyr.wav
├── tts_promo_hype_style.wav
├── tts_british_newscaster.wav
├── tts_multi_speaker_podcast.wav
├── tts_summary.json
├── image_3_pro_image_pro_startup_office_0.png
├── image_3_1_flash_image_flash_logo_design_0.png
├── image_summary.json
├── video_veo_3_1_lite_1.mp4
├── video_veo_3_1_fast_1.mp4
├── video_veo_3_1_1.mp4
├── video_summary.json
├── music_tech_startup_upbeat.wav
├── music_podcast_intro.wav
├── music_summary.json
└── master_summary.json
```

## Cost Estimates

| Service | Model | Approximate Cost |
|---------|-------|------------------|
| Text | gemini-2.5-flash | $0.30/M input, $2.50/M output |
| Text | gemini-2.5-flash-lite | $0.10/M input, $0.40/M output |
| TTS | gemini-2.5-flash-preview-tts | $0.50/M input, $12/M output |
| Image | gemini-3-pro-image | $0.134-0.24/image |
| Image | gemini-3.1-flash-image | $0.045-0.15/image |
| Video | veo-3.1-lite | $0.03/sec |
| Video | veo-3.1-fast | $0.08/sec |
| Video | veo-3.1 | $0.20/sec |
| Music | lyria-3 | $0.04/30sec clip |

**Total estimated cost for full test suite: ~$2-3**

## Troubleshooting

### "GEMINI_API_KEY not set"
Add your API key to `.env` file in the backend root.

### Video generation timeout
Video generation can take 5+ minutes. The script polls every 10 seconds and times out after 10 minutes.

### Rate limiting
If you hit rate limits, wait a few minutes before running tests again.
