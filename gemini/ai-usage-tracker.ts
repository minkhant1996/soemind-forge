/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * AI Usage Tracker Service
 * =========================
 *
 * Tracks all AI operations with token usage and cost calculation.
 * Wraps Gemini provider functions to automatically log usage to database.
 *
 * Usage:
 * ```typescript
 * const tracker = new AIUsageTracker(userId, ventureId, simulationId);
 *
 * // Track text generation
 * const result = await tracker.trackTextGeneration(
 *   'gemini-2.5-flash',
 *   AIOperationType.AGENT_RESPONSE,
 *   async () => gemini25Flash({ systemPrompt, userPrompt }),
 *   'clarify_idea'
 * );
 *
 * // Track image generation
 * const imageResult = await tracker.trackImageGeneration(
 *   'gemini-3-pro-image',
 *   async () => gemini3ProImage({ userPrompt }),
 *   1, // imageCount
 *   '2K' // imageSize
 * );
 * ```
 */

import { PrismaClient, AIOperationType } from '@prisma/client';
import {
  calculateTextCost,
  calculateImageCost,
  calculateVideoCost,
  calculateTTSCost,
  calculateMusicCost,
} from './cost-calculator';
import {
  GeminiModel,
  VeoModel,
  TTSModel,
  LyriaModel,
  ImageSize,
  GeminiResult,
  GeminiTextResponse,
  GeminiImageResponse,
  VeoResponse,
  TTSResponse,
  LyriaResponse,
} from './types';

const prisma = new PrismaClient();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Type guard to check if a GeminiResult is an error
 */
function isGeminiError<T>(result: GeminiResult<T>): result is { success: false; error: { code: string; message: string } } {
  return !result.success;
}

/**
 * Extract error message from a GeminiResult safely
 */
function getErrorMessage<T>(result: GeminiResult<T>): string | undefined {
  if (isGeminiError(result)) {
    return result.error.message;
  }
  return undefined;
}

// =============================================================================
// AI OPERATION TYPES (matches Prisma enum)
// =============================================================================

/**
 * AI operation types for tracking
 * This mirrors the AIOperationType enum in schema.prisma
 */
// Re-export AIOperationType from Prisma
export { AIOperationType };

// =============================================================================
// TYPES
// =============================================================================

interface TrackerContext {
  userId: string;
  ventureId?: string;
  simulationId?: string;
}

interface TrackOptions {
  action?: string;
  requestPayload?: Record<string, unknown>;
  userId?: string; // Override the tracker's userId if needed
  ventureId?: string; // Override the tracker's ventureId if needed
  simulationId?: string; // Override the tracker's simulationId if needed
}

interface TextTrackResult<T> {
  result: T;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    latencyMs: number;
  };
}

interface MediaTrackResult<T> {
  result: T;
  usage: {
    cost: number;
    latencyMs: number;
  };
}

// =============================================================================
// AI USAGE TRACKER CLASS
// =============================================================================

export class AIUsageTracker {
  private userId: string;
  private ventureId?: string;
  private simulationId?: string;

  constructor(context: TrackerContext) {
    this.userId = context.userId;
    this.ventureId = context.ventureId;
    this.simulationId = context.simulationId;
  }

  /**
   * Set simulation ID after creation
   */
  setSimulationId(simulationId: string): void {
    this.simulationId = simulationId;
  }

  /**
   * Track text generation operation
   */
  async trackTextGeneration(
    model: GeminiModel,
    operationType: AIOperationType,
    operation: () => Promise<GeminiResult<GeminiTextResponse>>,
    options: TrackOptions = {}
  ): Promise<TextTrackResult<GeminiResult<GeminiTextResponse>>> {
    const startTime = Date.now();
    let result: GeminiResult<GeminiTextResponse>;
    let success = true;
    let errorMessage: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      result = await operation();
      if (result.success) {
        inputTokens = result.data.usage?.inputTokens || 0;
        outputTokens = result.data.usage?.outputTokens || 0;
      } else {
        success = false;
        errorMessage = getErrorMessage(result);
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result = { success: false, error: { code: 'ERROR', message: errorMessage } };
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const costCalc = calculateTextCost(model, {
      inputTokens,
      outputTokens,
      totalTokens,
    });

    // Log to database (non-blocking)
    this.logUsage({
      operationType,
      model,
      action: options.action,
      inputTokens,
      outputTokens,
      totalTokens,
      inputCost: costCalc.inputCost,
      outputCost: costCalc.outputCost,
      totalCost: costCalc.totalCost,
      latencyMs,
      success,
      errorMessage,
      requestPayload: options.requestPayload,
      userIdOverride: options.userId,
      ventureIdOverride: options.ventureId,
      simulationIdOverride: options.simulationId,
    }).catch(err => console.error('[AIUsageTracker] Log error:', err));

    return {
      result,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost: costCalc.totalCost,
        latencyMs,
      },
    };
  }

  /**
   * Track image generation operation
   */
  async trackImageGeneration(
    model: GeminiModel,
    operation: () => Promise<GeminiResult<GeminiImageResponse>>,
    imageCount: number = 1,
    imageSize: ImageSize = '1K',
    options: TrackOptions = {}
  ): Promise<MediaTrackResult<GeminiResult<GeminiImageResponse>>> {
    const startTime = Date.now();
    let result: GeminiResult<GeminiImageResponse>;
    let success = true;
    let errorMessage: string | undefined;

    try {
      result = await operation();
      if (!result.success) {
        success = false;
        errorMessage = getErrorMessage(result);
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result = { success: false, error: { code: 'IMAGE_ERROR', message: errorMessage } };
    }

    const latencyMs = Date.now() - startTime;

    // Calculate cost
    const costCalc = calculateImageCost(
      model,
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      imageCount,
      imageSize
    );

    // Log to database (non-blocking)
    this.logUsage({
      operationType: AIOperationType.IMAGE_GENERATION,
      model,
      action: options.action,
      imageCount,
      imageSize,
      inputCost: costCalc.inputCost,
      outputCost: costCalc.outputCost,
      totalCost: costCalc.totalCost,
      latencyMs,
      success,
      errorMessage,
      requestPayload: options.requestPayload,
      userIdOverride: options.userId,
      ventureIdOverride: options.ventureId,
      simulationIdOverride: options.simulationId,
    }).catch(err => console.error('[AIUsageTracker] Log error:', err));

    return {
      result,
      usage: {
        cost: costCalc.totalCost,
        latencyMs,
      },
    };
  }

  /**
   * Track video generation operation
   */
  async trackVideoGeneration(
    model: VeoModel,
    operation: () => Promise<GeminiResult<VeoResponse>>,
    durationSeconds: number,
    videoCount: number = 1,
    includesAudio: boolean = false,
    options: TrackOptions = {}
  ): Promise<MediaTrackResult<GeminiResult<VeoResponse>>> {
    const startTime = Date.now();
    let result: GeminiResult<VeoResponse>;
    let success = true;
    let errorMessage: string | undefined;

    try {
      result = await operation();
      if (!result.success) {
        success = false;
        errorMessage = getErrorMessage(result);
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result = { success: false, error: { code: 'ERROR', message: errorMessage } };
    }

    const latencyMs = Date.now() - startTime;

    // Calculate cost
    const costCalc = calculateVideoCost(model, durationSeconds, videoCount, includesAudio);

    // Log to database (non-blocking)
    this.logUsage({
      operationType: AIOperationType.VIDEO_GENERATION,
      model,
      action: options.action,
      videoDurationSec: durationSeconds,
      videoCount,
      includesAudio,
      inputCost: costCalc.inputCost,
      outputCost: costCalc.outputCost,
      totalCost: costCalc.totalCost,
      latencyMs,
      success,
      errorMessage,
      requestPayload: options.requestPayload,
      userIdOverride: options.userId,
      ventureIdOverride: options.ventureId,
      simulationIdOverride: options.simulationId,
    }).catch(err => console.error('[AIUsageTracker] Log error:', err));

    return {
      result,
      usage: {
        cost: costCalc.totalCost,
        latencyMs,
      },
    };
  }

  /**
   * Track TTS generation operation
   */
  async trackTTSGeneration(
    model: TTSModel,
    operation: () => Promise<GeminiResult<TTSResponse>>,
    options: TrackOptions = {}
  ): Promise<TextTrackResult<GeminiResult<TTSResponse>>> {
    const startTime = Date.now();
    let result: GeminiResult<TTSResponse>;
    let success = true;
    let errorMessage: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      result = await operation();
      if (!result.success) {
        success = false;
        errorMessage = getErrorMessage(result);
      } else {
        // TTS doesn't have standard token counts in response
        // We estimate based on text length (roughly 1 token per 4 chars)
        inputTokens = 0;
        outputTokens = 0;
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result = { success: false, error: { code: 'ERROR', message: errorMessage } };
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const costCalc = calculateTTSCost(model, {
      inputTokens,
      outputTokens,
      totalTokens,
    });

    // Log to database (non-blocking)
    this.logUsage({
      operationType: AIOperationType.TTS_GENERATION,
      model,
      action: options.action,
      inputTokens,
      outputTokens,
      totalTokens,
      inputCost: costCalc.inputCost,
      outputCost: costCalc.outputCost,
      totalCost: costCalc.totalCost,
      latencyMs,
      success,
      errorMessage,
      requestPayload: options.requestPayload,
      userIdOverride: options.userId,
      ventureIdOverride: options.ventureId,
      simulationIdOverride: options.simulationId,
    }).catch(err => console.error('[AIUsageTracker] Log error:', err));

    return {
      result,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost: costCalc.totalCost,
        latencyMs,
      },
    };
  }

  /**
   * Track music generation operation
   */
  async trackMusicGeneration(
    model: LyriaModel,
    operation: () => Promise<GeminiResult<LyriaResponse>>,
    clipCount: number = 1,
    options: TrackOptions = {}
  ): Promise<MediaTrackResult<GeminiResult<LyriaResponse>>> {
    const startTime = Date.now();
    let result: GeminiResult<LyriaResponse>;
    let success = true;
    let errorMessage: string | undefined;

    try {
      result = await operation();
      if (!result.success) {
        success = false;
        errorMessage = getErrorMessage(result);
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result = { success: false, error: { code: 'ERROR', message: errorMessage } };
    }

    const latencyMs = Date.now() - startTime;

    // Calculate cost
    const costCalc = calculateMusicCost(model, clipCount);

    // Log to database (non-blocking)
    this.logUsage({
      operationType: AIOperationType.MUSIC_GENERATION,
      model,
      action: options.action,
      audioClipCount: clipCount,
      inputCost: costCalc.inputCost,
      outputCost: costCalc.outputCost,
      totalCost: costCalc.totalCost,
      latencyMs,
      success,
      errorMessage,
      requestPayload: options.requestPayload,
      userIdOverride: options.userId,
      ventureIdOverride: options.ventureId,
      simulationIdOverride: options.simulationId,
    }).catch(err => console.error('[AIUsageTracker] Log error:', err));

    return {
      result,
      usage: {
        cost: costCalc.totalCost,
        latencyMs,
      },
    };
  }

  /**
   * Log usage to database
   */
  private async logUsage(data: {
    operationType: AIOperationType;
    model: string;
    action?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    imageCount?: number;
    imageSize?: string;
    videoDurationSec?: number;
    videoCount?: number;
    includesAudio?: boolean;
    audioClipCount?: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    latencyMs: number;
    success: boolean;
    errorMessage?: string;
    requestPayload?: Record<string, unknown>;
    userIdOverride?: string;
    ventureIdOverride?: string;
    simulationIdOverride?: string;
  }): Promise<void> {
    try {
      // Use overrides if provided, otherwise fall back to instance values
      const effectiveUserId = data.userIdOverride || this.userId;
      const effectiveVentureId = data.ventureIdOverride || this.ventureId;
      const effectiveSimulationId = data.simulationIdOverride || this.simulationId;

      // Check if AIUsageLog model exists (after migration)
      if (prisma.aIUsageLog) {
          await prisma.aIUsageLog.create({
          data: {
            userId: effectiveUserId,
            ventureId: effectiveVentureId,
            simulationId: effectiveSimulationId,
            operationType: data.operationType,
            model: data.model,
            action: data.action,
            inputTokens: data.inputTokens || 0,
            outputTokens: data.outputTokens || 0,
            totalTokens: data.totalTokens || 0,
            imageCount: data.imageCount,
            imageSize: data.imageSize,
            videoDurationSec: data.videoDurationSec,
            videoCount: data.videoCount,
            includesAudio: data.includesAudio || false,
            audioClipCount: data.audioClipCount,
            inputCost: data.inputCost,
            outputCost: data.outputCost,
            totalCost: data.totalCost,
            latencyMs: data.latencyMs,
            success: data.success,
            errorMessage: data.errorMessage,
            requestPayload: data.requestPayload as object,
          },
        });
      } else {
        // Before migration - just log to console
        console.log(`[AIUsageTracker] ${data.operationType} - Model: ${data.model}, Cost: $${data.totalCost.toFixed(6)}`);
      }
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('[AIUsageTracker] Failed to log usage:', error);
    }
  }

  /**
   * Get usage summary for user (after migration)
   */
  static async getUserUsageSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    byModel: Record<string, { calls: number; tokens: number; cost: number }>;
    byOperation: Record<string, { calls: number; tokens: number; cost: number }>;
  }> {
    if (!prisma.aIUsageLog) {
      return {
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        byModel: {},
        byOperation: {},
      };
    }

    const logs = await prisma.aIUsageLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const summary = {
      totalCalls: logs.length,
      totalTokens: 0,
      totalCost: 0,
      byModel: {} as Record<string, { calls: number; tokens: number; cost: number }>,
      byOperation: {} as Record<string, { calls: number; tokens: number; cost: number }>,
    };

    for (const log of logs) {
      summary.totalTokens += log.totalTokens;
      summary.totalCost += log.totalCost;

      // By model
      if (!summary.byModel[log.model]) {
        summary.byModel[log.model] = { calls: 0, tokens: 0, cost: 0 };
      }
      summary.byModel[log.model].calls++;
      summary.byModel[log.model].tokens += log.totalTokens;
      summary.byModel[log.model].cost += log.totalCost;

      // By operation
      if (!summary.byOperation[log.operationType]) {
        summary.byOperation[log.operationType] = { calls: 0, tokens: 0, cost: 0 };
      }
      summary.byOperation[log.operationType].calls++;
      summary.byOperation[log.operationType].tokens += log.totalTokens;
      summary.byOperation[log.operationType].cost += log.totalCost;
    }

    return summary;
  }

  /**
   * Get simulation cost breakdown (after migration)
   */
  static async getSimulationCost(simulationId: string): Promise<{
    totalCost: number;
    totalTokens: number;
    breakdown: {
      personaGeneration: number;
      agentResponses: number;
      experimentPlanning: number;
      contentGeneration: number;
    };
  }> {
    if (!prisma.aIUsageLog) {
      return {
        totalCost: 0,
        totalTokens: 0,
        breakdown: {
          personaGeneration: 0,
          agentResponses: 0,
          experimentPlanning: 0,
          contentGeneration: 0,
        },
      };
    }

    const logs = await prisma.aIUsageLog.findMany({
      where: { simulationId },
    });

    const breakdown = {
      personaGeneration: 0,
      agentResponses: 0,
      experimentPlanning: 0,
      contentGeneration: 0,
    };

    let totalCost = 0;
    let totalTokens = 0;

    for (const log of logs) {
      totalCost += log.totalCost;
      totalTokens += log.totalTokens;

      switch (log.operationType) {
        case AIOperationType.PERSONA_GENERATION:
          breakdown.personaGeneration += log.totalCost;
          break;
        case AIOperationType.AGENT_RESPONSE:
          breakdown.agentResponses += log.totalCost;
          break;
        case AIOperationType.EXPERIMENT_PLANNING:
          breakdown.experimentPlanning += log.totalCost;
          break;
        case AIOperationType.IMAGE_GENERATION:
        case AIOperationType.VIDEO_GENERATION:
        case AIOperationType.TTS_GENERATION:
        case AIOperationType.MUSIC_GENERATION:
          breakdown.contentGeneration += log.totalCost;
          break;
      }
    }

    return { totalCost, totalTokens, breakdown };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create a tracker for a simulation context
 */
export function createSimulationTracker(
  userId: string,
  ventureId?: string,
  simulationId?: string
): AIUsageTracker {
  return new AIUsageTracker({ userId, ventureId, simulationId });
}

/**
 * Create a tracker for general AI operations (no simulation context)
 */
export function createGeneralTracker(
  userId: string,
  ventureId?: string
): AIUsageTracker {
  return new AIUsageTracker({ userId, ventureId });
}
