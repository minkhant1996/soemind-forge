/**
 * Cinematic Video Workflow
 * ========================
 *
 * Creates 20 seconds of cinematic video (3 clips × ~7 seconds)
 * using Veo 3.1 for the "AI Tools for Developers" content.
 */

import 'dotenv/config';
import { veo31, formatCost, CostCalculation } from '../index';
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

// Output directory
const outputDir = path.join(__dirname, 'content-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Cinematic video prompts for "AI Tools for Developers"
const videoPrompts = [
  {
    name: 'clip1-developer',
    prompt: `Cinematic shot of a developer working at a sleek modern desk with multiple monitors.
Code is flowing on screens with beautiful syntax highlighting in blue and purple.
Soft ambient lighting, shallow depth of field, 4K cinematic quality.
Camera slowly pushes in. Dramatic and professional atmosphere.`,
  },
  {
    name: 'clip2-ai-visualization',
    prompt: `Abstract cinematic visualization of artificial intelligence.
Glowing neural network connections forming in 3D space, particles of light connecting nodes.
Deep blue and cyan colors with golden accents.
Smooth camera movement through the network.
Cinematic, futuristic, inspiring. High-end tech commercial style.`,
  },
  {
    name: 'clip3-future-tech',
    prompt: `Cinematic wide shot of a futuristic tech workspace.
Holographic displays showing code and data visualizations floating in air.
Clean minimalist design, glass and light.
Golden hour lighting streaming through large windows.
Slow cinematic camera pan. Aspirational and cutting-edge atmosphere.`,
  },
];

async function createCinematicVideos() {
  console.log('='.repeat(60));
  console.log('CINEMATIC VIDEO CREATION');
  console.log('Target: 20 seconds (3 clips × ~7 seconds)');
  console.log('Model: Veo 3.1');
  console.log('='.repeat(60));
  console.log('');

  const generatedVideos: string[] = [];

  for (let i = 0; i < videoPrompts.length; i++) {
    const { name, prompt } = videoPrompts[i];
    console.log(`\nCLIP ${i + 1}/3: ${name}`);
    console.log('-'.repeat(40));
    console.log(`Prompt: ${prompt.slice(0, 80)}...`);
    console.log('Generating... (this may take 1-2 minutes)');

    const startTime = Date.now();

    const result = await veo31(prompt, {
      aspectRatio: '16:9',
      resolution: '1080p',
      durationSeconds: 8,
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (result.success && result.data.videos.length > 0) {
      const videoPath = path.join(outputDir, `${name}.mp4`);
      fs.writeFileSync(videoPath, result.data.videos[0].data);
      generatedVideos.push(videoPath);
      addCost(result.data.cost);

      console.log(`✓ Generated in ${elapsed}s`);
      console.log(`  Saved: ${videoPath}`);
      console.log(`  Duration: ${result.data.videos[0].durationSeconds}s`);
      console.log(`  Cost: ${formatCost(result.data.cost)}`);
    } else {
      console.log(`✗ Failed to generate`);
      if (!result.success) {
        console.log(`  Error: ${result.error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('VIDEO GENERATION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\nGenerated ${generatedVideos.length} clips:`);
  generatedVideos.forEach((v, i) => {
    console.log(`  ${i + 1}. ${path.basename(v)}`);
  });
  console.log(`\nTotal Duration: ~${generatedVideos.length * 7} seconds`);
  console.log(`Total Cost: ${formatCost(totalCost)}`);
  console.log(`\nOutput folder: ${outputDir}`);
  console.log('='.repeat(60));

  // Create a simple ffmpeg command to concatenate (user can run manually)
  if (generatedVideos.length > 0) {
    console.log('\nTo combine clips into one video, run:');
    console.log('ffmpeg -i clip1-developer.mp4 -i clip2-ai-visualization.mp4 -i clip3-future-tech.mp4 \\');
    console.log('  -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1[outv]" \\');
    console.log('  -map "[outv]" cinematic-final.mp4');
  }
}

createCinematicVideos().catch(console.error);
