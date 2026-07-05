/**
 * Workflow Example: Content Creation Pipeline
 * ============================================
 *
 * This example shows how to chain Gemini tools together to create
 * a complete content creation workflow.
 *
 * Workflow:
 * 1. Generate a blog post outline
 * 2. Write the full blog post
 * 3. Create a featured image
 * 4. Generate an audio version (podcast)
 * 5. Create background music
 *
 * Run with: npx ts-node examples/workflow-content-creation.ts
 */

// Load environment variables from .env file
import 'dotenv/config';

import {
  gemini25Flash,
  gemini25Pro,
  gemini31FlashImage,
  textToSpeech,
  multiSpeakerTTS,
  generateMusic,
  formatCost,
  CostCalculation,
} from '../index';
import fs from 'fs';
import path from 'path';

// Track total costs
let totalCost: CostCalculation = {
  inputCost: 0,
  outputCost: 0,
  totalCost: 0,
  currency: 'USD',
};

function addCost(cost: CostCalculation) {
  totalCost.inputCost += cost.inputCost;
  totalCost.outputCost += cost.outputCost;
  totalCost.totalCost += cost.totalCost;
}

// Create output directory
const outputDir = path.join(__dirname, 'content-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function createContentPipeline(topic: string) {
  console.log('='.repeat(60));
  console.log('CONTENT CREATION PIPELINE');
  console.log(`Topic: "${topic}"`);
  console.log('='.repeat(60));
  console.log('');

  // =========================================================================
  // STEP 1: Generate Blog Outline
  // =========================================================================
  console.log('STEP 1: Generating blog outline...');

  const outlineResult = await gemini25Flash({
    systemPrompt: `You are a content strategist. Create clear, actionable blog outlines.`,
    userPrompt: `Create a blog post outline for: "${topic}"

Include:
- Catchy title
- 4-5 main sections with bullet points
- Key takeaways

Format as markdown.`,
    config: { temperature: 0.7 },
  });

  if (!outlineResult.success) {
    throw new Error(`Outline failed: ${outlineResult.error.message}`);
  }

  const outline = outlineResult.data.text;
  addCost(outlineResult.data.cost);
  console.log('   ✓ Outline created');
  console.log(`   Cost: ${formatCost(outlineResult.data.cost)}\n`);

  // Save outline
  fs.writeFileSync(path.join(outputDir, '1-outline.md'), outline);

  // =========================================================================
  // STEP 2: Write Full Blog Post
  // =========================================================================
  console.log('STEP 2: Writing full blog post...');

  const blogResult = await gemini25Pro({
    systemPrompt: `You are an expert blog writer. Write engaging, informative content
with a conversational tone. Use examples and actionable advice.`,
    userPrompt: `Based on this outline, write a complete blog post (800-1000 words):

${outline}

Make it engaging, include examples, and end with a call to action.`,
    config: { temperature: 0.8, maxOutputTokens: 4096 },
  });

  if (!blogResult.success) {
    throw new Error(`Blog writing failed: ${blogResult.error.message}`);
  }

  const blogPost = blogResult.data.text;
  addCost(blogResult.data.cost);
  console.log('   ✓ Blog post written');
  console.log(`   Cost: ${formatCost(blogResult.data.cost)}\n`);

  // Save blog post
  fs.writeFileSync(path.join(outputDir, '2-blog-post.md'), blogPost);

  // =========================================================================
  // STEP 3: Generate Featured Image
  // =========================================================================
  console.log('STEP 3: Generating featured image...');

  // First, generate an image prompt
  const imagePromptResult = await gemini25Flash({
    systemPrompt: 'You create concise image generation prompts.',
    userPrompt: `Create a single image generation prompt for a blog featured image about: "${topic}"

Requirements:
- Modern, professional style
- No text in the image
- Suitable for a tech/business blog
- One sentence only`,
  });

  if (!imagePromptResult.success) {
    throw new Error('Image prompt generation failed');
  }

  const imagePrompt = imagePromptResult.data.text.trim();
  addCost(imagePromptResult.data.cost);

  // Generate the image
  const imageResult = await gemini31FlashImage({
    userPrompt: imagePrompt,
    config: { imageSize: '2K', aspectRatio: '16:9' },
  });

  if (imageResult.success && imageResult.data.images.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, '3-featured-image.png'),
      imageResult.data.images[0].data
    );
    addCost(imageResult.data.cost);
    console.log('   ✓ Featured image created');
    console.log(`   Cost: ${formatCost(imageResult.data.cost)}\n`);
  } else {
    console.log('   ⚠ Image generation skipped\n');
  }

  // =========================================================================
  // STEP 4: Generate Podcast Audio
  // =========================================================================
  console.log('STEP 4: Generating podcast audio...');

  // Convert blog to conversational script
  const scriptResult = await gemini25Flash({
    systemPrompt: 'You adapt written content into natural spoken scripts.',
    userPrompt: `Convert this blog post into a conversational podcast script between two hosts:
- Host (main speaker, explains concepts)
- Guest (asks clarifying questions, adds insights)

Blog post:
${blogPost.slice(0, 2000)}

Keep it natural and engaging. Format as:
Host: [dialogue]
Guest: [dialogue]`,
  });

  if (!scriptResult.success) {
    throw new Error('Script generation failed');
  }

  const script = scriptResult.data.text;
  addCost(scriptResult.data.cost);
  fs.writeFileSync(path.join(outputDir, '4-podcast-script.txt'), script);

  // Generate podcast audio
  const podcastResult = await multiSpeakerTTS(script, [
    {
      speaker: 'Host',
      voiceName: 'Zephyr',
      voiceSettings: { style: 'vocal_smile', pace: 'natural' },
    },
    {
      speaker: 'Guest',
      voiceName: 'Puck',
      voiceSettings: { style: 'casual', pace: 'natural' },
    },
  ]);

  if (podcastResult.success) {
    fs.writeFileSync(
      path.join(outputDir, '4-podcast.wav'),
      podcastResult.data.audio.data
    );
    addCost(podcastResult.data.cost);
    console.log('   ✓ Podcast audio created');
    console.log(`   Cost: ${formatCost(podcastResult.data.cost)}\n`);
  } else {
    console.log('   ⚠ Podcast generation skipped\n');
  }

  // =========================================================================
  // STEP 5: Generate Background Music (optional)
  // =========================================================================
  console.log('STEP 5: Background music (skipped - uncomment to enable)');
  /*
  const musicResult = await generateMusic({
    model: 'lyria-3',
    prompt: `Soft, upbeat background music for a podcast about ${topic}.
Modern, tech-inspired, subtle and not distracting.`,
  });

  if (musicResult.success) {
    fs.writeFileSync(
      path.join(outputDir, '5-background-music.wav'),
      musicResult.data.music.data
    );
    addCost(musicResult.data.cost);
    console.log('   ✓ Background music created');
  }
  */
  console.log('');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('='.repeat(60));
  console.log('PIPELINE COMPLETE!');
  console.log('='.repeat(60));
  console.log(`Output folder: ${outputDir}`);
  console.log('');
  console.log('Generated files:');
  console.log('  1. 1-outline.md - Blog outline');
  console.log('  2. 2-blog-post.md - Full blog post');
  console.log('  3. 3-featured-image.png - Featured image');
  console.log('  4. 4-podcast-script.txt - Podcast script');
  console.log('  5. 4-podcast.wav - Podcast audio');
  console.log('');
  console.log(`TOTAL COST: ${formatCost(totalCost)}`);
  console.log('='.repeat(60));
}

// Run the pipeline
const topic = process.argv[2] || 'How AI is Transforming Software Development in 2026';
createContentPipeline(topic).catch(console.error);
