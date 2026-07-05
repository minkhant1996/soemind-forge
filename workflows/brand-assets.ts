/**
 * Brand Assets Workflows
 * ======================
 *
 * Generate brand assets: logos, profile images, cover images, highlights
 * for all major social platforms.
 */

import * as fs from 'fs';
import * as path from 'path';
import { gemini31FlashImage } from '../gemini/dist/index.js';

import type {
  WorkflowResult,
  CostInfo,
  AspectRatio,
  SocialPlatform,
  ProfileImageInput,
  ProfileImageOutput,
  CoverImageInput,
  CoverImageOutput,
  HighlightCoversInput,
  HighlightCoversOutput,
  BrandAssetsInput,
  BrandAssetsOutput,
} from './types.js';

// =============================================================================
// HELPERS
// =============================================================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return mimeTypes[ext] || 'image/png';
}

function validateImageFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file not found: ${filePath}`);
  }
  const ext = path.extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
    throw new Error(`Invalid image format: ${ext}`);
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number },
  label: string
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[${label}] Attempt ${i + 1} failed: ${lastError.message}`);
      if (i < options.maxRetries - 1) await sleep(1000 * (i + 1));
    }
  }
  throw lastError || new Error(`${label} failed after ${options.maxRetries} attempts`);
}

const WorkflowErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  GENERATION_FAILED: 'GENERATION_FAILED',
} as const;

function createErrorResult<T>(code: string, message: string): WorkflowResult<T> {
  return { success: false, error: { code, message } };
}

function getErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.includes('quota')) return 'QUOTA_EXCEEDED';
  if (error instanceof Error && error.message.includes('rate')) return 'RATE_LIMITED';
  return 'GENERATION_FAILED';
}

// =============================================================================
// PLATFORM SPECIFICATIONS
// =============================================================================

/**
 * Platform-specific image specifications
 */
export const PLATFORM_SPECS: Record<SocialPlatform, {
  profile: { uploadSize: number; safeZonePercent: number };
  cover?: { width: number; height: number; safeWidth: number; safeHeight: number };
}> = {
  facebook: {
    profile: { uploadSize: 320, safeZonePercent: 70 },
    cover: { width: 820, height: 312, safeWidth: 640, safeHeight: 312 },
  },
  instagram: {
    profile: { uploadSize: 320, safeZonePercent: 70 },
    // Instagram has no cover, but we generate highlight covers
  },
  tiktok: {
    profile: { uploadSize: 200, safeZonePercent: 70 },
    // TikTok has no cover
  },
  youtube: {
    profile: { uploadSize: 800, safeZonePercent: 70 },
    cover: { width: 2560, height: 1440, safeWidth: 1546, safeHeight: 423 },
  },
  linkedin: {
    profile: { uploadSize: 400, safeZonePercent: 70 },
    cover: { width: 1584, height: 396, safeWidth: 1200, safeHeight: 300 },
  },
  twitter: {
    profile: { uploadSize: 400, safeZonePercent: 70 },
    cover: { width: 1500, height: 500, safeWidth: 1200, safeHeight: 400 },
  },
  pinterest: {
    profile: { uploadSize: 165, safeZonePercent: 70 },
    cover: { width: 800, height: 450, safeWidth: 800, safeHeight: 450 },
  },
};

// =============================================================================
// PROFILE IMAGE GENERATION
// =============================================================================

/**
 * Generate profile images for social platforms
 *
 * Use for: Brand profile pics, founder headshots, logo variations for circular crop
 *
 * @example
 * ```typescript
 * // Generate from existing logo
 * const result = await generateProfileImage({
 *   type: 'logo',
 *   logoPath: 'assets/logos/logo-icon.png',
 *   platforms: ['facebook', 'instagram', 'youtube'],
 *   outputDir: 'projects/my-brand/assets/social/profiles',
 * });
 *
 * // Generate founder headshot
 * const result = await generateProfileImage({
 *   type: 'person',
 *   referenceImagePath: 'assets/characters/founder.png',
 *   platforms: ['linkedin', 'twitter'],
 *   outputDir: 'projects/my-brand/assets/social/profiles',
 * });
 * ```
 */
export async function generateProfileImage(
  input: ProfileImageInput
): Promise<WorkflowResult<ProfileImageOutput>> {
  if (!input.type) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Profile type is required');
  }

  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  // Resolve platforms
  const platforms: SocialPlatform[] = input.platforms === 'all'
    ? ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'pinterest']
    : input.platforms;

  if (platforms.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one platform is required');
  }

  try {
    ensureDir(input.outputDir);

    const profiles: Partial<Record<SocialPlatform, string>> = {};
    let totalCost = 0;

    // Build the prompt based on type
    let prompt = '';
    let referenceImage: Buffer | undefined;
    let mimeType: string | undefined;

    if (input.type === 'logo' && input.logoPath) {
      validateImageFile(input.logoPath);
      referenceImage = fs.readFileSync(input.logoPath);
      mimeType = getMimeType(input.logoPath);
      prompt = `Same logo icon, ${input.backgroundColor ? `on ${input.backgroundColor} background` : 'on clean background'}, centered, suitable for circular profile picture crop, keep center 70% safe zone clear`;
    } else if (input.type === 'person' && input.referenceImagePath) {
      validateImageFile(input.referenceImagePath);
      referenceImage = fs.readFileSync(input.referenceImagePath);
      mimeType = getMimeType(input.referenceImagePath);
      prompt = `Same person, ${input.style || 'professional headshot, friendly expression'}, suitable for circular profile picture, face in center, shoulders up, clean background`;
    } else if (input.prompt) {
      prompt = input.prompt;
    } else {
      return createErrorResult(
        WorkflowErrorCodes.INVALID_INPUT,
        'Either logoPath, referenceImagePath, or prompt is required'
      );
    }

    // Generate at the highest required size (800px for YouTube)
    const maxSize = Math.max(...platforms.map(p => PLATFORM_SPECS[p].profile.uploadSize));
    const outputPath = path.join(input.outputDir, 'profile-master.png');

    console.log(`[Workflow] Generating master profile image (${maxSize}px)...`);

    const imageConfig: Record<string, unknown> = {
      aspectRatio: '1:1' as AspectRatio,
      imageSize: maxSize >= 800 ? '1K' : '512',
    };

    let result;
    if (referenceImage && mimeType) {
      result = await withRetry(
        () => gemini31FlashImage({
          userPrompt: prompt,
          imageInput: referenceImage,
          imageMimeType: mimeType,
          config: imageConfig,
        }),
        { maxRetries: 3 },
        'Profile image'
      );
    } else {
      result = await withRetry(
        () => gemini31FlashImage({
          userPrompt: prompt,
          config: {
            ...imageConfig,
            personGeneration: input.type === 'person' ? 'allow_adult' : undefined,
          },
        }),
        { maxRetries: 3 },
        'Profile image'
      );
    }

    if (!result.success) {
      const errorMsg = 'error' in result ? (result.error as { message?: string })?.message : undefined;
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        errorMsg || 'Failed to generate profile image'
      );
    }

    if (!result.data?.images?.length) {
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        'No image generated'
      );
    }

    // Save master image
    fs.writeFileSync(outputPath, result.data.images[0].data);
    totalCost += result.data.cost?.totalCost || 0.067;

    console.log(`[Workflow] Master profile saved: ${outputPath}`);

    // Copy to each platform (in production, would resize)
    for (const platform of platforms) {
      const platformPath = path.join(input.outputDir, `${platform}-profile.png`);
      fs.copyFileSync(outputPath, platformPath);
      profiles[platform] = platformPath;
      console.log(`[Workflow] ${platform} profile: ${platformPath}`);
    }

    return {
      success: true,
      data: {
        profiles: profiles as Record<SocialPlatform, string>,
        cost: {
          totalCost,
          breakdown: { profile: totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during profile generation';
    console.error(`[Workflow] generateProfileImage failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// COVER IMAGE GENERATION
// =============================================================================

/**
 * Generate cover/banner image for a platform
 *
 * Use for: YouTube banners, Facebook covers, LinkedIn headers, Twitter headers
 *
 * @example
 * ```typescript
 * const result = await generateCoverImage({
 *   platform: 'youtube',
 *   style: 'modern tech startup',
 *   headline: 'Build Your Startup in 4 Weeks',
 *   brandColors: ['#4F46E5', '#10B981'],
 *   outputPath: 'projects/my-brand/assets/social/covers/youtube-banner.png',
 * });
 * ```
 */
export async function generateCoverImage(
  input: CoverImageInput
): Promise<WorkflowResult<CoverImageOutput>> {
  if (!input.platform) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Platform is required');
  }

  if (!input.outputPath) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output path is required');
  }

  const specs = PLATFORM_SPECS[input.platform];
  if (!specs?.cover) {
    return createErrorResult(
      WorkflowErrorCodes.INVALID_INPUT,
      `Platform ${input.platform} does not support cover images`
    );
  }

  try {
    ensureDir(path.dirname(input.outputPath));

    // Build cover prompt
    const colorSection = input.brandColors?.length
      ? `brand colors ${input.brandColors.join(', ')}`
      : 'professional color palette';

    const prompt = `Professional ${input.platform} banner, ${input.style},
${colorSection},
${input.logoPath ? 'subtle logo placement,' : ''}
clean negative space for text overlay,
${input.socialHandles ? `space for social handles: ${input.socialHandles},` : ''}
${input.schedule ? `upload schedule: ${input.schedule},` : ''}
high quality, wide banner format,
IMPORTANT: Keep all important elements in center ${specs.cover.safeWidth}x${specs.cover.safeHeight} safe zone`.trim();

    console.log(`[Workflow] Generating ${input.platform} cover (${specs.cover.width}x${specs.cover.height})...`);

    const result = await withRetry(
      () => gemini31FlashImage({
        userPrompt: prompt,
        config: {
          aspectRatio: '16:9' as AspectRatio,
          imageSize: '2K',
        },
      }),
      { maxRetries: 3 },
      'Cover image'
    );

    if (!result.success) {
      const errorMsg = 'error' in result ? (result.error as { message?: string })?.message : undefined;
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        errorMsg || 'Failed to generate cover image'
      );
    }

    if (!result.data?.images?.length) {
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        'No cover image generated'
      );
    }

    fs.writeFileSync(input.outputPath, result.data.images[0].data);
    console.log(`[Workflow] Cover saved: ${input.outputPath}`);

    return {
      success: true,
      data: {
        coverPath: input.outputPath,
        dimensions: { width: specs.cover.width, height: specs.cover.height },
        safeZone: { width: specs.cover.safeWidth, height: specs.cover.safeHeight },
        cost: {
          totalCost: result.data.cost?.totalCost || 0.10,
          breakdown: { cover: result.data.cost?.totalCost || 0.10 },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during cover generation';
    console.error(`[Workflow] generateCoverImage failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// HIGHLIGHT COVERS GENERATION
// =============================================================================

/**
 * Generate Instagram highlight covers
 *
 * Use for: Instagram story highlight icons
 *
 * @example
 * ```typescript
 * const result = await generateHighlightCovers({
 *   count: 5,
 *   style: 'minimal icons',
 *   categories: ['About', 'Products', 'Reviews', 'Tips', 'Contact'],
 *   backgroundColor: '#4F46E5',
 *   iconColor: '#FFFFFF',
 *   outputDir: 'projects/my-brand/assets/social/highlights',
 * });
 * ```
 */
export async function generateHighlightCovers(
  input: HighlightCoversInput
): Promise<WorkflowResult<HighlightCoversOutput>> {
  if (!input.categories || input.categories.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Categories are required');
  }

  if (!input.outputDir) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Output directory is required');
  }

  try {
    ensureDir(input.outputDir);

    const highlights: { category: string; path: string }[] = [];
    let totalCost = 0;

    for (const category of input.categories) {
      const prompt = `Minimalist icon for Instagram highlight cover,
${category} concept, single simple icon centered,
${input.backgroundColor || '#000000'} background,
${input.iconColor || 'white'} icon color,
clean simple design, cohesive brand aesthetic,
suitable for small circular display`;

      console.log(`[Workflow] Generating highlight: ${category}...`);

      const result = await withRetry(
        () => gemini31FlashImage({
          userPrompt: prompt,
          config: {
            aspectRatio: '1:1' as AspectRatio,
            imageSize: '512',
          },
        }),
        { maxRetries: 3 },
        `Highlight ${category}`
      );

      if (result.success && result.data?.images?.length) {
        const highlightPath = path.join(
          input.outputDir,
          `highlight-${category.toLowerCase().replace(/\s+/g, '-')}.png`
        );
        fs.writeFileSync(highlightPath, result.data.images[0].data);
        highlights.push({ category, path: highlightPath });
        totalCost += result.data.cost?.totalCost || 0.067;
        console.log(`[Workflow] Highlight saved: ${highlightPath}`);
      }

      await sleep(1000);
    }

    if (highlights.length === 0) {
      return createErrorResult(
        WorkflowErrorCodes.GENERATION_FAILED,
        'Failed to generate any highlight covers'
      );
    }

    return {
      success: true,
      data: {
        highlights,
        cost: {
          totalCost,
          breakdown: { highlights: totalCost },
        },
      },
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during highlight generation';
    console.error(`[Workflow] generateHighlightCovers failed: ${message}`);
    return createErrorResult(code, message);
  }
}

// =============================================================================
// COMPLETE BRAND ASSETS GENERATION
// =============================================================================

/**
 * Generate complete brand assets for all platforms
 *
 * Use for: New brand setup, platform expansion, brand refresh
 *
 * @example
 * ```typescript
 * const result = await generateBrandAssets({
 *   projectName: 'my-brand',
 *   brandName: 'SoeMind',
 *   tagline: 'Build smarter, not harder',
 *   style: 'modern minimalist',
 *   primaryColor: '#4F46E5',
 *   secondaryColor: '#10B981',
 *   logoPath: 'assets/logos/logo-icon.png',
 *   platforms: ['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok'],
 *   includeCovers: true,
 *   includeProfiles: true,
 *   includeHighlights: true,
 *   highlightCategories: ['About', 'Products', 'Reviews', 'Tips', 'Contact'],
 *   includeWatermark: true,
 * });
 * ```
 */
export async function generateBrandAssets(
  input: BrandAssetsInput
): Promise<WorkflowResult<BrandAssetsOutput>> {
  if (!input.projectName) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Project name is required');
  }

  if (!input.brandName) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'Brand name is required');
  }

  if (!input.platforms || input.platforms.length === 0) {
    return createErrorResult(WorkflowErrorCodes.INVALID_INPUT, 'At least one platform is required');
  }

  try {
    const baseDir = `projects/${input.projectName}/assets/social`;
    ensureDir(baseDir);

    const result: Partial<BrandAssetsOutput> = {};
    let totalCost = 0;

    // Generate profiles
    if (input.includeProfiles !== false) {
      console.log('[Workflow] Generating profile images...');
      const profileResult = await generateProfileImage({
        type: input.logoPath ? 'logo' : 'monogram',
        logoPath: input.logoPath,
        prompt: input.logoPath ? undefined : `Modern minimalist logo icon, letter ${input.brandName[0]}, ${input.style}, ${input.primaryColor} primary color, clean design`,
        platforms: input.platforms,
        outputDir: path.join(baseDir, 'profiles'),
        style: input.style,
        backgroundColor: input.secondaryColor || '#FFFFFF',
      });

      if (profileResult.success && profileResult.data) {
        result.profiles = profileResult.data.profiles;
        totalCost += profileResult.data.cost.totalCost;
      }
    }

    // Generate covers
    if (input.includeCovers !== false) {
      console.log('[Workflow] Generating cover images...');
      const covers: Record<string, string> = {};

      for (const platform of input.platforms) {
        if (PLATFORM_SPECS[platform]?.cover) {
          const coverResult = await generateCoverImage({
            platform,
            style: input.style,
            headline: input.tagline,
            logoPath: input.logoPath,
            brandColors: [input.primaryColor, input.secondaryColor].filter(Boolean) as string[],
            outputPath: path.join(baseDir, 'covers', `${platform}-cover.png`),
          });

          if (coverResult.success && coverResult.data) {
            covers[`${platform}_cover`] = coverResult.data.coverPath;
            totalCost += coverResult.data.cost.totalCost;
          }

          await sleep(1500);
        }
      }

      if (Object.keys(covers).length > 0) {
        result.covers = covers;
      }
    }

    // Generate Instagram highlights
    if (input.includeHighlights && input.highlightCategories?.length && input.platforms.includes('instagram')) {
      console.log('[Workflow] Generating Instagram highlights...');
      const highlightResult = await generateHighlightCovers({
        count: input.highlightCategories.length,
        style: 'minimal icons',
        categories: input.highlightCategories,
        backgroundColor: input.primaryColor,
        iconColor: '#FFFFFF',
        outputDir: path.join(baseDir, 'highlights'),
      });

      if (highlightResult.success && highlightResult.data) {
        result.highlights = highlightResult.data.highlights;
        totalCost += highlightResult.data.cost.totalCost;
      }
    }

    // Generate YouTube watermark
    if (input.includeWatermark && input.platforms.includes('youtube')) {
      console.log('[Workflow] Generating YouTube watermark...');
      const watermarkDir = path.join(baseDir, 'watermarks');
      ensureDir(watermarkDir);
      const watermarkPath = path.join(watermarkDir, 'youtube-watermark.png');

      const watermarkResult = await withRetry(
        () => gemini31FlashImage({
          userPrompt: `Simple logo watermark, ${input.brandName} brand, transparent background effect, suitable for video overlay, minimal, ${input.primaryColor} color, 150x150 pixels feel`,
          config: {
            aspectRatio: '1:1' as AspectRatio,
            imageSize: '512',
          },
        }),
        { maxRetries: 3 },
        'Watermark'
      );

      if (watermarkResult.success && watermarkResult.data?.images?.length) {
        fs.writeFileSync(watermarkPath, watermarkResult.data.images[0].data);
        result.watermark = watermarkPath;
        totalCost += watermarkResult.data.cost?.totalCost || 0.067;
      }
    }

    console.log(`[Workflow] Brand assets complete. Total cost: $${totalCost.toFixed(2)}`);

    return {
      success: true,
      data: {
        ...result,
        cost: {
          totalCost,
          breakdown: {
            profiles: result.profiles ? 0.067 : 0,
            covers: result.covers ? Object.keys(result.covers).length * 0.10 : 0,
            highlights: result.highlights ? result.highlights.length * 0.067 : 0,
            watermark: result.watermark ? 0.067 : 0,
          },
        },
      } as BrandAssetsOutput,
    };
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'Unknown error during brand assets generation';
    console.error(`[Workflow] generateBrandAssets failed: ${message}`);
    return createErrorResult(code, message);
  }
}
