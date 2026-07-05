/**
 * Workflow Types
 * ==============
 *
 * Type definitions for all content generation workflows.
 */

// =============================================================================
// PROVIDER TYPES
// =============================================================================

/**
 * Available AI providers
 */
export type AIProvider = 'gemini' | 'openrouter';

/**
 * Capabilities available for each provider
 */
export interface ProviderCapabilities {
  text: boolean;
  image: boolean;
  video: boolean;
  tts: boolean;
  music: boolean;
  stt: boolean;
}

/**
 * Provider status with capabilities
 */
export interface ProviderStatus {
  provider: AIProvider;
  available: boolean;
  keyCount: number;
  capabilities: ProviderCapabilities;
}

/**
 * Full provider configuration status
 */
export interface ProviderConfig {
  gemini: ProviderStatus;
  openrouter: ProviderStatus;
  defaultProvider: AIProvider | null;
  recommendation: {
    text: AIProvider | null;
    image: AIProvider | null;
    video: AIProvider | null;
    tts: AIProvider | null;
    music: AIProvider | null;
  };
}

/**
 * Video provider options
 */
export type VideoProvider = 'veo' | 'seedance';

/**
 * Provider selection for a workflow
 */
export interface WorkflowProviderConfig {
  text?: AIProvider;
  image?: AIProvider;
  video?: VideoProvider;
  tts?: AIProvider;
  music?: AIProvider;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface WorkflowResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface CostInfo {
  totalCost: number;
  breakdown: Record<string, number>;
}

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'youtube-shorts' | 'facebook';
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';
export type VideoAspectRatio = '9:16' | '16:9' | '1:1'; // Veo supported ratios
export type VideoQuality = 'lite' | 'fast' | 'standard' | 'high';
export type CarouselStyle = 'educational' | 'product-showcase' | 'story' | 'testimonial' | 'comparison' | 'stats';
export type ImageSize = '512' | '1K' | '2K' | '4K';
export type PersonGeneration = 'allow' | 'dont_allow';

// Voice names that match TTSVoiceName from gemini types
export type VoiceName =
  | 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'
  | 'Aoede' | 'Leda' | 'Orus' | 'Calliope'
  | 'Autonoe' | 'Proteus' | 'Despina' | 'Erinome' | 'Aura'
  | 'Helios' | 'Narcissus' | 'Selene' | 'Titan' | 'Vesper';

/**
 * Voice Style Options (matching Gemini TTS API)
 *
 * Style: Controls the emotional tone and delivery style
 * Pace: Controls speaking speed and rhythm
 * Accent: Controls regional accent/dialect
 */
export type VoiceStyleType =
  | 'vocal_smile'   // Bright, sunny, explicitly inviting tone
  | 'newscaster'    // Professional, authoritative, standard broadcast cadence
  | 'whisper'       // Intimate, breathy, close-to-mic proximity effect
  | 'empathetic'    // Warm, understanding, soft tone with gentle inflections
  | 'promo_hype'    // High energy, punchy consonants, elongated vowels
  | 'deadpan';      // Flat affect, minimal pitch variation, dry delivery

export type VoicePaceType =
  | 'natural'       // Natural conversational pace
  | 'rapid_fire'    // Fast, energetic, no dead air, sentences overlap slightly
  | 'the_drift'     // Slow, liquid, zero urgency, long pauses for breath
  | 'staccato';     // Short, clipped sentences with distinct pauses

export type VoiceAccentType =
  | 'neutral'           // Neutral accent
  | 'american_gen'      // American (General)
  | 'american_valley'   // American (Valley)
  | 'american_south'    // American (Southern)
  | 'british_rp'        // British (Received Pronunciation)
  | 'british_brixton'   // British (Brixton/London)
  | 'transatlantic'     // Transatlantic (Mid-Atlantic)
  | 'australian';       // Australian

export interface VoiceStyle {
  style?: VoiceStyleType;
  pace?: VoicePaceType;
  accent?: VoiceAccentType;
  /**
   * Free-text natural-language description of the speaker for fine control,
   * e.g. "a warm radio host with a slight smile in their voice". Overrides/
   * augments the preset fields above when provided.
   */
  audioProfile?: string;
}

/**
 * Content type for automatic voice selection
 */
export type ContentType =
  | 'ad_hype'           // High-energy promotional ad
  | 'ad_direct'         // Direct response, call-out style ad
  | 'ad_testimonial'    // Customer testimonial, authentic
  | 'explainer'         // Educational explainer, calm and clear
  | 'tutorial'          // Step-by-step tutorial
  | 'news'              // News/announcement style
  | 'story'             // Narrative storytelling
  | 'meditation'        // Calm, relaxing, wellness
  | 'podcast'           // Conversational podcast style
  | 'luxury'            // Premium, refined brand
  | 'ugc'               // User-generated content style, authentic
  | 'corporate';        // Professional corporate

/**
 * Voice suggestion output from suggestVoiceSettings
 */
export interface VoiceSuggestion {
  voiceName: VoiceName;
  voiceStyle: VoiceStyle;
  reasoning: {
    voice: string;
    style: string;
    pace: string;
    accent: string;
  };
}

// =============================================================================
// TEXT WORKFLOW TYPES
// =============================================================================

export interface TextToTextInput {
  prompt: string;
  systemPrompt?: string;
  model?: string;
}

export interface TextToTextOutput {
  text: string;
  cost: CostInfo;
}

export interface ImageToTextInput {
  imagePath: string;
  prompt: string;
  systemPrompt?: string;
  model?: string;
}

export interface ImageToTextOutput {
  text: string;
  cost: CostInfo;
}

// =============================================================================
// IMAGE WORKFLOW TYPES
// =============================================================================

export interface TextToImageInput {
  prompt: string;
  outputPath: string;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  personGeneration?: 'allow' | 'block';
  /**
   * 'flash' (default, $0.067-0.10), 'pro' = Gemini 3 Pro Image / Nano Banana
   * Pro ($0.134) — state-of-the-art TEXT RENDERING in images; use 'pro' whenever
   * the image must contain readable typography (posters, cards, in-image copy).
   * 'lite' = Gemini 3.1 Flash Lite Image / Nano Banana 2 Lite ($0.0336 flat) —
   * cheapest option for at-scale/bulk generation and quick previews.
   */
  imageModel?: 'flash' | 'pro' | 'lite';
}

export interface TextToImageOutput {
  imagePath: string;
  cost: CostInfo;
}

export interface ImageToImageInput {
  referenceImagePath: string;
  prompt: string;
  outputPath: string;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  /** 'flash' (default), 'pro' (Nano Banana Pro — best-in-class text rendering, $0.134), or 'lite' (Nano Banana 2 Lite — cheapest, $0.0336 flat). */
  imageModel?: 'flash' | 'pro' | 'lite';
  personGeneration?: 'allow' | 'block';
}

export interface ImageToImageOutput {
  imagePath: string;
  cost: CostInfo;
}

// =============================================================================
// CAROUSEL WORKFLOW TYPES
// =============================================================================

export interface CarouselSlide {
  title?: string;
  content?: string;
  prompt?: string; // Custom prompt override for this slide
}

export interface TextToCarouselInput {
  projectName: string;
  topic: string;
  slideCount: number;
  style: CarouselStyle;
  platform: Platform;
  outputDir: string;
  slides?: CarouselSlide[]; // Optional pre-defined slides
  aspectRatio?: AspectRatio;
}

export interface TextToCarouselOutput {
  imagePaths: string[];
  slidesData: CarouselSlide[];
  cost: CostInfo;
}

export interface ImageToCarouselInput {
  projectName: string;
  referenceImagePath: string;
  topic: string;
  slideCount: number;
  style: CarouselStyle;
  platform: Platform;
  outputDir: string;
  slides?: CarouselSlide[];
  aspectRatio?: AspectRatio;
}

export interface ImageToCarouselOutput {
  imagePaths: string[];
  slidesData: CarouselSlide[];
  cost: CostInfo;
}

// =============================================================================
// VIDEO WORKFLOW TYPES
// =============================================================================

export interface VideoScene {
  prompt: string;
  duration: number; // in seconds
  /** Optional: generate a keyframe image first for this scene */
  keyframePrompt?: string;
}

/**
 * Detailed video prompt following the VIDEO-PROMPT-GUIDE.md structure
 */
export interface DetailedVideoPrompt {
  /** Shot type: wide, medium, close-up, etc. */
  shotType?: 'extreme_wide' | 'wide' | 'medium_wide' | 'medium' | 'medium_close' | 'close_up' | 'extreme_close' | 'insert' | 'over_shoulder' | 'pov' | 'top_down';
  /** Camera movement */
  cameraMovement?: 'static' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'dolly_in' | 'dolly_out' | 'track_left' | 'track_right' | 'crane_up' | 'crane_down' | 'orbit' | 'steadicam' | 'handheld' | 'aerial' | 'whip_pan' | 'crash_zoom';
  /** Movement speed */
  movementSpeed?: 'slow' | 'natural' | 'fast' | 'whip';
  /** Lens focal length */
  lens?: '16mm' | '24mm' | '35mm' | '50mm' | '85mm' | '135mm';
  /** Depth of field */
  depthOfField?: 'shallow' | 'deep' | 'natural';
  /** Subject description (what/who is in frame) */
  subject: string;
  /** Action/motion description (what happens during the clip) */
  action: string;
  /** Environment/setting */
  environment?: string;
  /** Lighting style */
  lighting?: 'natural' | 'golden_hour' | 'blue_hour' | 'soft' | 'hard' | 'rim' | 'rembrandt' | 'neon' | 'studio' | 'practical';
  /** Visual style */
  style?: 'cinematic' | 'documentary' | 'commercial' | 'film_noir' | 'anamorphic' | 'clean' | 'minimal';
  /** Mood/energy */
  mood?: 'confident' | 'hopeful' | 'tense' | 'intimate' | 'epic' | 'calm' | 'energetic' | 'mysterious';
}

// =============================================================================
// KEYFRAME TYPES (First Frame / Last Frame workflow)
// =============================================================================

/**
 * Generate a keyframe image to use as first/last frame for video generation.
 * This ensures visual consistency and precise control over the starting/ending look.
 */
export interface KeyframeInput {
  /** Detailed prompt for the keyframe image (static scene, no motion) */
  prompt: string;
  /** Output path for the keyframe image */
  outputPath: string;
  /** Aspect ratio - MUST match the target video aspect ratio */
  aspectRatio?: VideoAspectRatio;
  /** Image resolution */
  imageSize?: ImageSize;
  /** Allow person generation */
  personGeneration?: PersonGeneration;
  /** Optional reference image for character/product consistency */
  referenceImagePath?: string;
}

export interface KeyframeOutput {
  imagePath: string;
  cost: CostInfo;
}

/**
 * Generate video from a first frame keyframe image.
 * The video will start exactly at this visual and animate from there.
 */
export interface VideoFromKeyframeInput {
  /** Path to the first frame keyframe image */
  firstFramePath: string;
  /** Motion/action prompt - describe what CHANGES, not what the keyframe shows */
  prompt: string;
  /** Output path for the video */
  outputPath: string;
  /** Duration in seconds (Veo: 4-8s) */
  duration: number;
  /** Aspect ratio (should match keyframe) */
  aspectRatio?: VideoAspectRatio;
  /** Video quality */
  quality?: VideoQuality;
}

export interface VideoFromKeyframeOutput {
  videoPath: string;
  duration: number;
  cost: CostInfo;
}

/**
 * Generate video with both first AND last frame keyframes.
 * Veo interpolates the motion between the two endpoints.
 * Best for: transformations, before/after, reveals.
 */
export interface VideoFromKeyframesInput {
  /** Path to the starting keyframe image */
  firstFramePath: string;
  /** Path to the ending keyframe image */
  lastFramePath: string;
  /** Motion/transition prompt - describe HOW to get from first to last */
  prompt: string;
  /** Output path for the video */
  outputPath: string;
  /** Duration in seconds (Veo: 4-8s) */
  duration: number;
  /** Aspect ratio (should match both keyframes) */
  aspectRatio?: VideoAspectRatio;
  /** Video quality */
  quality?: VideoQuality;
}

export interface VideoFromKeyframesOutput {
  videoPath: string;
  duration: number;
  cost: CostInfo;
}

/**
 * Build a detailed video prompt string from structured parameters.
 * Use this to ensure prompts follow the VIDEO-PROMPT-GUIDE.md format.
 */
export interface BuildVideoPromptInput {
  /** Structured prompt parameters */
  details: DetailedVideoPrompt;
  /** Include technical specs (lens, etc.) - default true */
  includeTechnical?: boolean;
}

export interface TextToVideoSilentInput {
  prompt: string;
  outputPath: string;
  duration: number;
  aspectRatio?: AspectRatio;
  quality?: VideoQuality;
  personGeneration?: 'allow' | 'block';
  /** Optional: use a first frame keyframe for visual consistency */
  firstFramePath?: string;
  /** Optional: use a last frame keyframe (transformation mode) */
  lastFramePath?: string;
}

export interface TextToVideoSilentOutput {
  videoPath: string;
  duration: number;
  cost: CostInfo;
}

export interface TextToVideoSpeakingInput {
  characterDescription: string;
  environment: string;
  dialogue: string;
  voiceDescription: string;
  outputPath: string;
  duration: number;
  aspectRatio?: AspectRatio;
  quality?: VideoQuality;
}

export interface TextToVideoSpeakingOutput {
  videoPath: string;
  duration: number;
  cost: CostInfo;
}

export interface ImageToVideoSilentInput {
  /** Reference image for visual style/subject consistency */
  referenceImagePath: string;
  /** Motion/action prompt */
  prompt: string;
  outputPath: string;
  duration: number;
  aspectRatio?: AspectRatio;
  quality?: VideoQuality;
  /** Optional: use reference as first frame (animate FROM this exact image) */
  useAsFirstFrame?: boolean;
  /** Optional: last frame for transformation mode */
  lastFramePath?: string;
}

export interface ImageToVideoSilentOutput {
  videoPath: string;
  duration: number;
  cost: CostInfo;
}

export interface ImageToVideoSpeakingInput {
  referenceImagePath: string;
  environment: string;
  dialogue: string;
  voiceDescription: string;
  outputPath: string;
  duration: number;
  aspectRatio?: AspectRatio;
  quality?: VideoQuality;
}

export interface ImageToVideoSpeakingOutput {
  videoPath: string;
  duration: number;
  cost: CostInfo;
}

// =============================================================================
// VIDEO + VOICEOVER WORKFLOW TYPES
// =============================================================================

export interface TextToVideoVoiceoverInput {
  scenes: VideoScene[];
  voiceoverScript: string;
  voiceName: VoiceName;
  voiceStyle?: VoiceStyle;
  outputDir: string;
  aspectRatio?: AspectRatio;
  quality?: VideoQuality;
  addTextOverlays?: boolean;
  textOverlays?: string[]; // One per scene
}

export interface TextToVideoVoiceoverOutput {
  finalVideoPath: string;
  clipPaths: string[];
  voiceoverPath: string;
  totalDuration: number;
  cost: CostInfo;
}

export interface ImageToVideoVoiceoverInput {
  referenceImagePath: string;
  scenes: VideoScene[];
  voiceoverScript: string;
  voiceName: VoiceName;
  voiceStyle?: VoiceStyle;
  outputDir: string;
  aspectRatio?: AspectRatio;
  quality?: VideoQuality;
}

export interface ImageToVideoVoiceoverOutput {
  finalVideoPath: string;
  clipPaths: string[];
  voiceoverPath: string;
  totalDuration: number;
  cost: CostInfo;
}

// =============================================================================
// VOICEOVER (TTS) WORKFLOW TYPES
// =============================================================================

export interface VoiceoverInput {
  /**
   * The narration/script text to speak. With the default 3.1 TTS model you can
   * (and should) embed inline audio tags for expressive delivery:
   * "[excited] Welcome! [pause] [whispers] here's the secret." — 200+ tags.
   */
  script: string;
  /** Where to write the .wav file */
  outputPath: string;
  /** Voice to use (default: Kore) */
  voiceName?: VoiceName;
  /** Optional style/pace/accent settings */
  voiceStyle?: VoiceStyle;
  /** Default: gemini-3.1-flash-tts-preview (expressive, supports inline audio tags). */
  ttsModel?: 'gemini-2.5-flash-preview-tts' | 'gemini-3.1-flash-tts-preview';
}

export interface VoiceoverOutput {
  audioPath: string;
  cost: CostInfo;
}

export interface DialogueSpeaker {
  /** Speaker label used in the script, e.g. "Speaker 1" or "Host" (alphanumeric) */
  speaker: string;
  /** Voice assigned to this speaker */
  voiceName: VoiceName;
  /** Optional per-speaker style/pace/accent */
  voiceStyle?: VoiceStyle;
}

export interface MultiSpeakerVoiceoverInput {
  /**
   * The conversation script. Each line should be prefixed with the speaker
   * label, e.g. "Speaker 1: Hello\nSpeaker 2: Hi there"
   */
  script: string;
  /** Two or more speakers with their assigned voices */
  speakers: DialogueSpeaker[];
  /** Where to write the .wav file */
  outputPath: string;
}

export interface MultiSpeakerVoiceoverOutput {
  audioPath: string;
  cost: CostInfo;
}

// =============================================================================
// MUSIC (LYRIA) WORKFLOW TYPES
// =============================================================================

export type MusicQuality = 'standard' | 'pro';

// =============================================================================
// CHARACTER SHEET (multi-angle consistency reference)
// =============================================================================

export interface CharacterSheetInput {
  /** Locked physical description (face, hair, wardrobe, accessories). */
  description: string;
  /** Folder to write the angle images into. */
  outputDir: string;
  /** Filename stem, e.g. "char-sarah" → char-sarah-front.png. Default: "character". */
  idStem?: string;
  /** Angles to render. Default: front, three_quarter, profile. */
  angles?: Array<'front' | 'three_quarter' | 'profile' | 'full_body'>;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  personGeneration?: 'allow' | 'block';
}

export interface CharacterSheetOutput {
  /** angle -> written file path */
  files: Record<string, string>;
  cost: CostInfo;
}

// =============================================================================
// ASSEMBLY (mix audio, combine clips, captions) — local ffmpeg, no API cost
// =============================================================================

export interface MixVideoAudioInput {
  videoPath: string;
  /** Off-screen narration to lay over the video (full volume). */
  voiceoverPath?: string;
  /** Background music bed. */
  musicPath?: string;
  /** Music level when mixed under a voiceover (0–1). Default 0.3. */
  musicVolume?: number;
  outputPath: string;
}

export interface MixVideoAudioOutput {
  videoPath: string;
  cost: CostInfo;
}

export interface CaptionCue {
  text: string;
  /** seconds; if omitted, cues are distributed evenly across totalDuration */
  start?: number;
  end?: number;
}

export interface CaptionsInput {
  outputPath: string;            // .srt path
  /** Provide explicit cues, OR a script + totalDuration to auto-distribute. */
  cues?: CaptionCue[];
  script?: string;
  totalDuration?: number;        // seconds, required when using `script`
}

export interface CaptionsOutput {
  srtPath: string;
  cueCount: number;
  cost: CostInfo;
}

export interface AssembleFinalInput {
  /** Video clips to concatenate in order. */
  clipPaths: string[];
  voiceoverPath?: string;
  musicPath?: string;
  musicVolume?: number;
  /** Optional .srt to burn into the picture. */
  captionsSrtPath?: string;
  outputPath: string;
}

export interface AssembleFinalOutput {
  finalVideoPath: string;
  cost: CostInfo;
}

// =============================================================================
// PREVIEW → PICK → COMMIT (cheap options, then finalize the chosen one)
// =============================================================================

export interface ImageOptionsInput {
  prompt: string;
  /** How many candidates to generate (2–8). */
  count: number;
  outputDir: string;
  /** Cheap by default — 512 (~$0.045) so the user picks before paying for 2K/4K. */
  previewSize?: ImageSize;
  aspectRatio?: AspectRatio;
  referenceImagePath?: string;
  personGeneration?: 'allow' | 'block';
}

export interface ImageOptionsOutput {
  imagePaths: string[];
  previewSize: ImageSize;
  cost: CostInfo;
}

export interface FinalizeImageInput {
  /** The preview the user picked — used as the reference so the look is preserved. */
  chosenImagePath: string;
  prompt: string;
  outputPath: string;
  /** Upscale target. Default '2K'. */
  imageSize?: ImageSize;
  aspectRatio?: AspectRatio;
  personGeneration?: 'allow' | 'block';
}

export interface FinalizeImageOutput {
  imagePath: string;
  cost: CostInfo;
}

export interface StoryboardScene {
  name: string;
  prompt: string;
}

export interface StoryboardInput {
  scenes: StoryboardScene[];
  outputDir: string;
  /** Keyframe size. Default '1K'. */
  previewSize?: ImageSize;
  aspectRatio?: AspectRatio;
  /** Character reference image for consistency across scenes. */
  referenceImagePath?: string;
  personGeneration?: 'allow' | 'block';
}

export interface StoryboardKeyframe {
  scene: string;
  imagePath: string;
}

export interface StoryboardOutput {
  keyframes: StoryboardKeyframe[];
  cost: CostInfo;
}

// =============================================================================
// COPYWRITING (hooks / script / caption — ad frameworks)
// =============================================================================

export type CopyFramework =
  | 'AIDA'                 // Attention, Interest, Desire, Action
  | 'PAS'                  // Problem, Agitate, Solution
  | 'BAB'                  // Before, After, Bridge
  | 'hook-retain-reward'   // short-form video pacing
  | 'star-story-solution'; // testimonial / narrative

export interface HooksInput {
  topic: string;
  audience?: string;
  painPoint?: string;
  platform?: Platform;
  /** Number of hooks. Default 8. */
  count?: number;
}

export interface Hook {
  text: string;
  /** problem | curiosity | result | contrarian | question | stat | story */
  angle: string;
}

export interface HooksOutput {
  hooks: Hook[];
  cost: CostInfo;
}

export interface ScriptInput {
  brief: string;
  framework?: CopyFramework;
  platform?: Platform;
  durationSeconds?: number;
  hook?: string;
  cta?: string;
}

export interface ScriptSection {
  label: string;
  voiceover: string;
  visual?: string;
}

export interface ScriptOutput {
  framework: string;
  sections: ScriptSection[];
  wordCount: number;
  estimatedDurationSeconds: number;
  cost: CostInfo;
}

export interface CaptionInput {
  topic: string;
  platform: Platform;
  tone?: string;
  cta?: string;
  /** Number of caption variants. Default 3. */
  count?: number;
}

export interface CaptionVariant {
  text: string;
  hashtags: string[];
}

export interface CaptionOutput {
  captions: CaptionVariant[];
  cost: CostInfo;
}

// =============================================================================
// OUTPUT QA (review a generated image/keyframe before committing budget)
// =============================================================================

export type QACheck =
  | 'brand-colors'
  | 'unwanted-text'    // accidental text/watermark rendered in the image
  | 'claims'           // violates brand restrictions / makes unsupported claims
  | 'consistency'      // matches the expected character/product description
  | 'aspect'           // correct aspect ratio / framing
  | 'quality';         // artifacts, extra fingers, blur, distortion

export interface OmniVideoClipInput {
  /** Full direction — timestamps, dialogue quotes, SFX lines all supported. */
  prompt: string;
  /** Start-frame image → image_to_video task (character/scene consistency). */
  referenceImagePath?: string;
  outputPath: string;              // .mp4
  /** '4s'…'10s' (Omni Flash caps ~10s/turn). Default '8s'. */
  duration?: string;
  thinkingLevel?: 'low' | 'medium' | 'high';
}

export interface OmniVideoClipOutput {
  videoPath: string;
  /** Any text the model returned alongside the video. */
  modelNotes?: string;
  cost: CostInfo;
}

export interface ReviewVideoInput {
  videoPath: string;
  /** Frames to sample evenly across the video. Default 4. */
  frameCount?: number;
  /** Same knobs as image QA — applied to every sampled frame. */
  checks?: QACheck[];
  brandColors?: string[];
  brandTone?: string;
  restrictions?: string[];
  expectedAspect?: AspectRatio;
  expectedSubject?: string;
  /** If set, fail when the video has no audio track (VO/ambience expected). */
  expectAudio?: boolean;
  /** If set, fail when |duration - expected| > 1.5s. */
  expectedDurationSeconds?: number;
}

export interface ReviewVideoOutput {
  pass: boolean;
  score: number;                  // min frame score, penalized by container issues
  durationSeconds: number;
  hasAudio: boolean;
  summary: string;
  /** Per-frame QA reports with their timestamps. */
  frames: Array<{ atSeconds: number; score: number; summary: string; issues: unknown[] }>;
  /** Container-level problems (duration/audio/aspect). */
  issues: string[];
  cost: CostInfo;
}

export interface QAInput {
  /** Image or keyframe to review (review video by extracting a frame first). */
  imagePath: string;
  /** Which checks to run. Default: all applicable to the provided context. */
  checks?: QACheck[];
  brandColors?: string[];          // e.g. ["#2563EB", "#10B981"]
  brandTone?: string;
  restrictions?: string[];         // words/claims that must NOT appear
  expectedAspect?: AspectRatio;
  /** Locked character/product description to check the subject against. */
  expectedSubject?: string;
}

export interface QAIssue {
  check: QACheck;
  severity: 'error' | 'warning' | 'info';
  detail: string;
}

export interface QAReport {
  pass: boolean;          // false if any error-severity issue
  score: number;          // 0–100
  issues: QAIssue[];
  summary: string;
  cost: CostInfo;
}

export interface MusicInput {
  /** Text prompt describing the music (genre, mood, instruments, tempo) */
  prompt: string;
  /** Where to write the .wav file */
  outputPath: string;
  /**
   * Track length in seconds.
   * standard (lyria-3) supports up to 30s, pro (lyria-3-pro) up to 180s.
   */
  durationSeconds?: number;
  /** standard = lyria-3 (≤30s), pro = lyria-3-pro (full songs ≤180s) */
  quality?: MusicQuality;
  /** Optional reference image path to steer the mood */
  referenceImagePath?: string;
}

export interface MusicOutput {
  audioPath: string;
  durationSeconds: number;
  cost: CostInfo;
}

// =============================================================================
// SEEDANCE 2.0 WORKFLOW TYPES
// =============================================================================

/**
 * Seedance 2.0 aspect ratios (more options than Veo)
 */
export type SeedanceAspectRatio = '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '1:1';

/**
 * Seedance audio layer configuration
 */
export interface SeedanceAudioConfig {
  /** Character dialogue with lip-sync (use quotes for spoken lines) */
  dialogue?: string;
  /** Dialogue delivery style */
  dialogueTone?: 'whispers' | 'shouts' | 'speaks calmly' | 'speaks urgently' | 'speaks warmly' | 'speaks coldly';
  /** Sound effects (describe source + surface, e.g., "boots on wet cobblestone") */
  sfx?: string[];
  /** Background music description (or "no music" to suppress) */
  music?: string | 'no music';
  /** Audio mix priority: which layer is most prominent */
  audioPriority?: 'dialogue' | 'sfx' | 'music' | 'balanced';
}

/**
 * Seedance camera configuration
 */
export interface SeedanceCameraConfig {
  /** Primary camera movement (one movement per prompt) */
  movement?: 'push-in' | 'pull-out' | 'pan' | 'tracking' | 'orbit' | 'aerial' | 'handheld' | 'fixed';
  /** Movement speed descriptor */
  speed?: 'slow' | 'gentle' | 'smooth' | 'dynamic' | 'rapid';
  /** Shot type */
  shotType?: 'wide' | 'establishing' | 'medium' | 'close-up' | 'extreme-close-up' | 'pov';
  /** Camera angle */
  angle?: 'eye-level' | 'low-angle' | 'high-angle' | 'dutch' | 'birds-eye' | 'three-quarter' | 'over-the-shoulder';
  /** Lens feel */
  lens?: 'wide-angle' | 'normal' | 'telephoto' | 'shallow-dof' | 'deep-focus';
}

/**
 * Seedance visual style configuration
 */
export interface SeedanceStyleConfig {
  /** Overall visual style */
  style?: 'cinematic' | 'documentary' | 'commercial' | 'editorial' | 'retro-film' | 'futuristic';
  /** Lighting setup */
  lighting?: 'golden-hour' | 'dramatic-rim' | 'soft-diffused' | 'neon-colored' | 'volumetric' | 'practical' | 'studio';
  /** Atmosphere effects */
  atmosphere?: string[]; // e.g., ['dust in the air', 'volumetric fog', 'rain particles']
  /** Technical quality anchors */
  quality?: string[]; // e.g., ['35mm film quality', 'ARRI ALEXA aesthetic', 'heavy film grain']
}

/**
 * Seedance constraints for quality control
 */
export interface SeedanceConstraints {
  /** Prevent screen shaking */
  avoidJitter?: boolean;
  /** Prevent distorted limbs */
  avoidBentLimbs?: boolean;
  /** Prevent flickering (for 5+ second videos) */
  avoidTemporalFlicker?: boolean;
  /** Maintain character appearance */
  avoidIdentityDrift?: boolean;
  /** Custom negative constraints */
  custom?: string[];
}

/**
 * Seedance multimodal reference
 */
export interface SeedanceReference {
  /** File path to the reference */
  path: string;
  /** Type of reference */
  type: 'image' | 'video' | 'audio';
  /** How to use this reference */
  purpose: 'character' | 'product' | 'action' | 'camera' | 'style' | 'audio-sync' | 'environment';
  /** Custom instruction for this reference */
  instruction?: string;
}

/**
 * Seedance shot for multi-shot narratives
 */
export interface SeedanceShot {
  /** Shot number (for ordering) */
  order: number;
  /** Duration of this shot in seconds */
  duration: number;
  /** Shot-specific prompt */
  prompt: string;
  /** Camera config for this shot */
  camera?: SeedanceCameraConfig;
  /** Audio config for this shot */
  audio?: SeedanceAudioConfig;
  /** Transition to next shot */
  transitionTo?: 'hard-cut' | 'dissolve' | 'whip-pan' | 'push-through' | 'match-cut' | 'fade';
}

// -----------------------------------------------------------------------------
// Input/Output Types for Each Seedance Workflow
// -----------------------------------------------------------------------------

/**
 * 1. Text-only → Video (with optional audio layers)
 */
export interface SeedanceTextToVideoInput {
  /** Main subject description (critical: lead with WHO and WHAT action) */
  subject: string;
  /** Primary action (single present-tense verb phrase) */
  action: string;
  /** Environment/setting description */
  environment?: string;
  /** Camera configuration */
  camera?: SeedanceCameraConfig;
  /** Visual style configuration */
  style?: SeedanceStyleConfig;
  /** Audio configuration (dialogue, SFX, music) */
  audio?: SeedanceAudioConfig;
  /** Quality constraints */
  constraints?: SeedanceConstraints;
  /** Output video path */
  outputPath: string;
  /** Duration in seconds (4-15) */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: SeedanceAspectRatio;
}

export interface SeedanceVideoOutput {
  videoPath: string;
  duration: number;
  hasAudio: boolean;
  audioLayers: ('dialogue' | 'sfx' | 'music')[];
  cost: CostInfo;
}

/**
 * 2. Image reference → Video (character/product consistency)
 */
export interface SeedanceImageToVideoInput {
  /** Path(s) to reference image(s) - up to 9 */
  referenceImages: string[] | string;
  /** How to use the reference(s) */
  referenceType: 'character' | 'product' | 'style' | 'environment' | 'multi-angle';
  /** Action/motion prompt */
  prompt: string;
  /** Camera configuration */
  camera?: SeedanceCameraConfig;
  /** Visual style */
  style?: SeedanceStyleConfig;
  /** Audio configuration */
  audio?: SeedanceAudioConfig;
  /** Constraints */
  constraints?: SeedanceConstraints;
  /** Output path */
  outputPath: string;
  /** Duration (4-15s) */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: SeedanceAspectRatio;
}

/**
 * 3. Video reference → Video (action/camera reference, extension)
 */
export interface SeedanceVideoToVideoInput {
  /** Path(s) to reference video(s) - up to 3 */
  referenceVideos: string[] | string;
  /** How to use the reference */
  referenceType: 'action' | 'camera' | 'extend-forward' | 'extend-backward' | 'remix';
  /** Prompt for modifications/extensions */
  prompt: string;
  /** Camera config (for new generation) */
  camera?: SeedanceCameraConfig;
  /** Style config */
  style?: SeedanceStyleConfig;
  /** Audio config */
  audio?: SeedanceAudioConfig;
  /** Constraints */
  constraints?: SeedanceConstraints;
  /** Output path */
  outputPath: string;
  /** Duration (4-15s) */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: SeedanceAspectRatio;
}

/**
 * 4. Audio reference → Video (sync to audio/beat)
 */
export interface SeedanceAudioToVideoInput {
  /** Path(s) to reference audio - up to 3 */
  referenceAudio: string[] | string;
  /** How to sync (rhythm, mood, speech) */
  syncType: 'rhythm' | 'mood' | 'speech' | 'beat-match';
  /** Visual prompt */
  prompt: string;
  /** Camera config */
  camera?: SeedanceCameraConfig;
  /** Style config */
  style?: SeedanceStyleConfig;
  /** Constraints */
  constraints?: SeedanceConstraints;
  /** Output path */
  outputPath: string;
  /** Duration (4-15s, or auto-match audio length) */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: SeedanceAspectRatio;
}

/**
 * 5. Multi-reference → Video (combine images + videos + audio)
 */
export interface SeedanceMultiRefVideoInput {
  /** All references with their purposes */
  references: SeedanceReference[];
  /** Main prompt describing the scene */
  prompt: string;
  /** Camera config */
  camera?: SeedanceCameraConfig;
  /** Style config */
  style?: SeedanceStyleConfig;
  /** Audio config (may be supplemented by audio references) */
  audio?: SeedanceAudioConfig;
  /** Constraints */
  constraints?: SeedanceConstraints;
  /** Output path */
  outputPath: string;
  /** Duration (4-15s) */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: SeedanceAspectRatio;
}

/**
 * 6. Speaking video with lip-sync (image ref + dialogue)
 */
export interface SeedanceSpeakingVideoInput {
  /** Character reference image (high-res, front-facing recommended) */
  characterImagePath: string;
  /** Environment/setting */
  environment?: string;
  /** Spoken dialogue (will be lip-synced) */
  dialogue: string;
  /** Dialogue delivery style */
  dialogueTone?: 'whispers' | 'speaks calmly' | 'speaks urgently' | 'shouts' | 'speaks warmly';
  /** Additional audio (SFX, music) */
  audio?: Omit<SeedanceAudioConfig, 'dialogue' | 'dialogueTone'>;
  /** Camera (default: medium close-up, fixed for best lip-sync) */
  camera?: SeedanceCameraConfig;
  /** Style */
  style?: SeedanceStyleConfig;
  /** Constraints (avoidIdentityDrift auto-enabled) */
  constraints?: SeedanceConstraints;
  /** Output path */
  outputPath: string;
  /** Duration (4-15s, recommend under 8s for best lip-sync) */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: SeedanceAspectRatio;
}

/**
 * 7. Multi-shot narrative video
 */
export interface SeedanceMultiShotVideoInput {
  /** Ordered shots with transitions */
  shots: SeedanceShot[];
  /** Character reference (same for all shots) */
  characterImagePath?: string;
  /** Global style (applies to all shots unless overridden) */
  style?: SeedanceStyleConfig;
  /** Global constraints */
  constraints?: SeedanceConstraints;
  /** Output directory (will contain shot-01.mp4, shot-02.mp4, etc.) */
  outputDir: string;
  /** Whether to concatenate into final.mp4 */
  concatenate?: boolean;
  /** Aspect ratio (same for all shots) */
  aspectRatio?: SeedanceAspectRatio;
}

export interface SeedanceMultiShotVideoOutput {
  /** Individual shot video paths */
  shotPaths: string[];
  /** Final concatenated video (if concatenate=true) */
  finalPath?: string;
  /** Total duration */
  totalDuration: number;
  cost: CostInfo;
}

/**
 * 8. Video extension (extend existing video forward/backward)
 */
export interface SeedanceExtendVideoInput {
  /** Source video to extend */
  sourceVideoPath: string;
  /** Direction to extend */
  direction: 'forward' | 'backward';
  /** Description of the extended content */
  prompt: string;
  /** Additional duration to add (up to 15s total) */
  additionalDuration: number;
  /** Audio for extended portion */
  audio?: SeedanceAudioConfig;
  /** Constraints */
  constraints?: SeedanceConstraints;
  /** Output path */
  outputPath: string;
}

export interface SeedanceExtendVideoOutput {
  videoPath: string;
  originalDuration: number;
  extendedDuration: number;
  totalDuration: number;
  cost: CostInfo;
}

/**
 * 9. Video element modification (add/remove/modify elements)
 */
export interface SeedanceModifyVideoInput {
  /** Source video to modify */
  sourceVideoPath: string;
  /** Type of modification */
  modificationType: 'add' | 'remove' | 'modify';
  /** Description of the modification */
  prompt: string;
  /** Timestamp for element addition (if type='add') */
  timestamp?: number;
  /** Audio modifications */
  audio?: SeedanceAudioConfig;
  /** Output path */
  outputPath: string;
}

export interface SeedanceModifyVideoOutput {
  videoPath: string;
  modificationType: 'add' | 'remove' | 'modify';
  cost: CostInfo;
}

// =============================================================================
// PRE-GENERATION REVIEW TYPES
// =============================================================================

/**
 * Issue severity levels for content review
 */
export type ReviewSeverity = 'error' | 'warning' | 'suggestion';

/**
 * A single issue found during review
 */
export interface ReviewIssue {
  /** Category of the issue */
  category: string;
  /** Severity level */
  severity: ReviewSeverity;
  /** Description of the issue */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Line number or location (if applicable) */
  location?: string;
}

/**
 * Result of any content review
 */
export interface ReviewResult {
  /** Overall pass/fail (fails if any errors) */
  pass: boolean;
  /** Score out of 100 */
  score: number;
  /** List of issues found */
  issues: ReviewIssue[];
  /** Human-readable summary */
  summary: string;
  /** Estimated cost savings if issues fixed before generation */
  potentialSavings?: number;
}

/**
 * Input for reviewing a content plan
 */
export interface ReviewContentPlanInput {
  /** Path to the content plan file */
  planPath: string;
  /** Brand guidelines for comparison */
  brandPath?: string;
  /** Project info for context */
  projectPath?: string;
  /** Content type being planned */
  contentType: 'video' | 'image' | 'carousel' | 'audio' | 'music';
}

/**
 * Input for reviewing a script/hook
 */
export interface ReviewScriptInput {
  /** The script text to review */
  script: string;
  /** Target duration in seconds */
  targetDuration?: number;
  /** Platform (affects pacing, length) */
  platform?: Platform;
  /** Brand restrictions (words to avoid) */
  restrictions?: string[];
  /** Content type for pacing checks */
  contentType?: 'ad' | 'explainer' | 'testimonial' | 'ugc' | 'tutorial';
}

/**
 * Input for reviewing an image prompt
 */
export interface ReviewImagePromptInput {
  /** The image prompt to review */
  prompt: string;
  /** Target aspect ratio */
  aspectRatio?: AspectRatio;
  /** Expected style (from STYLE-GUIDE.md) */
  style?: string;
  /** Brand colors (hex codes) */
  brandColors?: string[];
  /** Words/concepts to avoid */
  restrictions?: string[];
  /** Whether the image should include a person */
  expectsPerson?: boolean;
  /** Character reference description (for consistency check) */
  characterDescription?: string;
}

/**
 * Input for reviewing a video prompt
 */
export interface ReviewVideoPromptInput {
  /** The video prompt to review */
  prompt: string;
  /** Target duration in seconds */
  duration?: number;
  /** Target aspect ratio */
  aspectRatio?: AspectRatio;
  /** Whether character speaks */
  hasSpeakingCharacter?: boolean;
  /** Dialogue text (if speaking) */
  dialogue?: string;
  /** Words/concepts to avoid */
  restrictions?: string[];
  /** Expected camera movement */
  expectedCameraWork?: string;
  /** Character reference description (for consistency check) */
  characterDescription?: string;
  /** Provider being used */
  provider?: 'veo' | 'seedance';
}

/**
 * Thumbnail type for review
 */
export type ThumbnailType =
  | 'youtube'           // YouTube video thumbnail (16:9)
  | 'tiktok'            // TikTok cover (9:16)
  | 'instagram-reel'    // Instagram Reel cover (9:16)
  | 'podcast'           // Podcast cover (1:1)
  | 'linkedin'          // LinkedIn video (16:9)
  | 'social-post';      // General social post

/**
 * Thumbnail style category
 */
export type ThumbnailStyle =
  | 'face-emotion'      // Person with exaggerated expression
  | 'before-after'      // Split transformation
  | 'product-hero'      // Product dominant
  | 'text-bold'         // Text-focused, minimal visual
  | 'curiosity'         // Mystery/reveal style
  | 'number-list'       // "Top 5", "3 Tips" style
  | 'faceless';         // No person needed

/**
 * Input for reviewing a thumbnail prompt
 */
export interface ReviewThumbnailInput {
  /** The thumbnail prompt to review */
  prompt: string;
  /** Thumbnail type (platform) */
  thumbnailType: ThumbnailType;
  /** Thumbnail style */
  style?: ThumbnailStyle;
  /** Does the thumbnail include a person? */
  includesPerson: boolean;
  /** Is there a character reference image available? */
  hasCharacterReference?: boolean;
  /** Character reference path (if available) */
  characterReferencePath?: string;
  /** Is this for a video? If so, must match video character */
  forVideo?: boolean;
  /** Video character reference (to check consistency) */
  videoCharacterPath?: string;
  /** Brand colors */
  brandColors?: string[];
  /** Words to avoid */
  restrictions?: string[];
}

/**
 * Thumbnail review result with additional guidance
 */
export interface ThumbnailReviewResult extends ReviewResult {
  /** Recommended workflow function */
  recommendedWorkflow: 'generateImageVariation' | 'generateSingleImage';
  /** Character reference status */
  characterStatus: 'has-reference' | 'needs-reference' | 'not-needed';
  /** Suggested next steps */
  nextSteps: string[];
}

/**
 * Input for batch reviewing multiple prompts
 */
export interface ReviewBatchPromptsInput {
  /** Image prompts to review */
  imagePrompts?: string[];
  /** Video prompts to review */
  videoPrompts?: string[];
  /** Script sections to review */
  scripts?: string[];
  /** Shared brand restrictions */
  restrictions?: string[];
  /** Shared brand colors */
  brandColors?: string[];
}

/**
 * Output for batch review
 */
export interface ReviewBatchOutput {
  /** Overall pass/fail */
  pass: boolean;
  /** Average score */
  averageScore: number;
  /** Results per item */
  results: {
    type: 'image' | 'video' | 'script';
    index: number;
    result: ReviewResult;
  }[];
  /** Total potential savings */
  totalPotentialSavings: number;
  /** Summary of all issues */
  summary: string;
}

// =============================================================================
// BRAND ASSETS TYPES
// =============================================================================

/**
 * Social media platform
 */
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'pinterest';

/**
 * Profile image type
 */
export type ProfileImageType = 'logo' | 'person' | 'mascot' | 'monogram';

/**
 * Platform-specific image specs
 */
export interface PlatformImageSpecs {
  platform: SocialPlatform;
  profile: {
    displaySize: string;
    uploadSize: string;
    safeZone: string;
  };
  cover?: {
    size: string;
    safeZone: string;
    mobileCrop?: string;
  };
}

/**
 * Input for generating a profile image
 */
export interface ProfileImageInput {
  /** Type of profile image */
  type: ProfileImageType;
  /** Path to existing logo (for type: 'logo') */
  logoPath?: string;
  /** Path to reference image (for type: 'person') */
  referenceImagePath?: string;
  /** Prompt for generation (for new images) */
  prompt?: string;
  /** Background color */
  backgroundColor?: string;
  /** Platforms to generate for */
  platforms: SocialPlatform[] | 'all';
  /** Output directory */
  outputDir: string;
  /** Style keywords */
  style?: string;
}

/**
 * Output for profile image generation
 */
export interface ProfileImageOutput {
  /** Generated profile images by platform */
  profiles: Record<SocialPlatform, string>;
  /** Cost information */
  cost: CostInfo;
}

/**
 * Input for generating a cover image
 */
export interface CoverImageInput {
  /** Platform to generate for */
  platform: SocialPlatform;
  /** Visual style */
  style: string;
  /** Main headline (optional - will be composited in post) */
  headline?: string;
  /** Subheadline */
  subheadline?: string;
  /** Call to action */
  cta?: string;
  /** Path to logo file */
  logoPath?: string;
  /** Brand colors */
  brandColors?: string[];
  /** Social handles to include */
  socialHandles?: string;
  /** Publishing schedule (for YouTube) */
  schedule?: string;
  /** Output path */
  outputPath: string;
}

/**
 * Output for cover image generation
 */
export interface CoverImageOutput {
  /** Path to generated cover */
  coverPath: string;
  /** Dimensions */
  dimensions: { width: number; height: number };
  /** Safe zone info */
  safeZone: { width: number; height: number };
  /** Cost information */
  cost: CostInfo;
}

/**
 * Input for generating Instagram highlight covers
 */
export interface HighlightCoversInput {
  /** Number of highlights */
  count: number;
  /** Visual style */
  style: string;
  /** Categories for each highlight */
  categories: string[];
  /** Icon color */
  iconColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Output directory */
  outputDir: string;
}

/**
 * Output for highlight covers generation
 */
export interface HighlightCoversOutput {
  /** Paths to generated highlight covers */
  highlights: { category: string; path: string }[];
  /** Cost information */
  cost: CostInfo;
}

/**
 * Input for generating logo variations
 */
export interface LogoVariationsInput {
  /** Brand name */
  brandName: string;
  /** Brand description/style */
  style: string;
  /** Primary color */
  primaryColor: string;
  /** Secondary color */
  secondaryColor?: string;
  /** Existing logo path (to create variations from) */
  existingLogoPath?: string;
  /** Output directory */
  outputDir: string;
  /** Which variations to generate */
  variations?: ('full' | 'icon' | 'wordmark' | 'horizontal' | 'stacked' | 'white' | 'black' | 'favicon')[];
}

/**
 * Output for logo variations generation
 */
export interface LogoVariationsOutput {
  /** Paths to generated logos */
  logos: {
    full?: string;
    icon?: string;
    wordmark?: string;
    horizontal?: string;
    stacked?: string;
    white?: string;
    black?: string;
    favicon?: string;
  };
  /** Cost information */
  cost: CostInfo;
}

/**
 * Input for generating complete brand assets
 */
export interface BrandAssetsInput {
  /** Project name */
  projectName: string;
  /** Brand name */
  brandName: string;
  /** Tagline */
  tagline?: string;
  /** Visual style */
  style: string;
  /** Primary color */
  primaryColor: string;
  /** Secondary color */
  secondaryColor?: string;
  /** Existing logo path */
  logoPath?: string;
  /** Platforms to generate for */
  platforms: SocialPlatform[];
  /** Include cover images */
  includeCovers?: boolean;
  /** Include profile images */
  includeProfiles?: boolean;
  /** Include highlight covers (Instagram) */
  includeHighlights?: boolean;
  /** Highlight categories (for Instagram) */
  highlightCategories?: string[];
  /** Include YouTube watermark */
  includeWatermark?: boolean;
}

/**
 * Output for brand assets generation
 */
export interface BrandAssetsOutput {
  /** Generated profile images */
  profiles?: Record<SocialPlatform, string>;
  /** Generated cover images */
  covers?: Record<string, string>;
  /** Generated highlight covers */
  highlights?: { category: string; path: string }[];
  /** Generated watermark */
  watermark?: string;
  /** Total cost */
  cost: CostInfo;
}

// =============================================================================
// GENERATION MANIFEST TYPES (for audit trail / review)
// =============================================================================

/**
 * Content type that was generated
 */
export type GeneratedContentType = 'image' | 'video' | 'voiceover' | 'music' | 'carousel' | 'text';

/**
 * A single generation entry in the manifest
 */
export interface GenerationEntry {
  /** Unique ID for this generation */
  id: string;
  /** Type of content generated */
  type: GeneratedContentType;
  /** Timestamp of generation */
  timestamp: string;
  /** Model used */
  model: string;
  /** The prompt used for generation */
  prompt: string;
  /** Reference image path (if used) */
  referenceImagePath?: string;
  /** All parameters/config used */
  parameters: {
    aspectRatio?: string;
    imageSize?: string;
    duration?: number;
    quality?: string;
    voiceName?: string;
    voiceStyle?: VoiceStyle;
    personGeneration?: string;
    [key: string]: unknown;
  };
  /** Output file path(s) */
  outputPaths: string[];
  /** Cost for this generation */
  cost: CostInfo;
  /** Status: success, failed, or needs-review */
  status: 'success' | 'failed' | 'needs-review';
  /** Error message if failed */
  error?: string;
  /** Review notes (added by human/AI reviewer) */
  reviewNotes?: string;
  /** Issues found during review */
  issues?: string[];
}

/**
 * Full generation manifest for a project/session
 */
export interface GenerationManifest {
  /** Project name */
  projectName: string;
  /** Session/batch ID */
  sessionId: string;
  /** When this session started */
  startedAt: string;
  /** When last updated */
  updatedAt: string;
  /** Total cost for this session */
  totalCost: number;
  /** Summary of what was generated */
  summary: {
    images: number;
    videos: number;
    voiceovers: number;
    music: number;
    carousels: number;
    text: number;
  };
  /** Brand/project context used */
  context?: {
    brandColors?: string[];
    restrictions?: string[];
    characterRef?: string;
    productRef?: string;
  };
  /** All generation entries */
  entries: GenerationEntry[];
}

/**
 * Input for creating/updating a manifest
 */
export interface ManifestInput {
  /** Project name */
  projectName: string;
  /** Output directory where manifest will be saved */
  outputDir: string;
  /** Optional session ID (auto-generated if not provided) */
  sessionId?: string;
  /** Brand context */
  context?: GenerationManifest['context'];
}

/**
 * Input for adding an entry to the manifest
 */
export interface AddManifestEntryInput {
  /** Path to the manifest file */
  manifestPath: string;
  /** Entry to add */
  entry: Omit<GenerationEntry, 'id' | 'timestamp'>;
}
