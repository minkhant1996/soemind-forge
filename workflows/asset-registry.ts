/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * Asset Registry
 * ==============
 *
 * Load / validate / resolve / register the reusable assets recorded in a
 * project's `config/assets.yaml` (characters, products, logos, voices,
 * locations, music, style references).
 *
 * The goal: generate or register a visual/audio identity ONCE, save its file
 * path, and reuse it forever with consistency. Pre-flight (and generation
 * workflows) call these helpers instead of re-describing assets each time.
 *
 * USAGE:
 * ```typescript
 * import { loadAssetConfig, resolveAsset, registerAsset } from '../../workflows/dist/index.js';
 *
 * const reg = loadAssetConfig('summer-campaign');
 * const char = resolveAsset(reg, 'char-founder');   // validated paths
 * if (!char.ok) console.log('missing files:', char.missing);
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import type { WorkflowResult } from './types.js';

// =============================================================================
// TYPES
// =============================================================================

export type AssetSource = 'generated' | 'provided' | 'real-person' | 'mockup';
export type AssetStatus = 'ready' | 'needs-generation' | 'placeholder';
export type CharacterRole = 'spokesperson' | 'customer' | 'mascot' | 'extra';

export interface AssetConsent {
  real_person: boolean;
  release_on_file: boolean;
  notes?: string;
}

export interface CharacterAsset {
  id: string;
  label: string;
  description?: string;
  role?: CharacterRole;
  source?: AssetSource;
  status?: AssetStatus;
  locked?: boolean;
  /** angle/state -> relative path */
  files?: Record<string, string>;
  wardrobe?: string[];
  linked_voice?: string;
  consent?: AssetConsent;
  person_generation?: 'allow' | 'block';
  notes?: string;
  created?: string;
}

export interface ProductAsset {
  id: string;
  label: string;
  description?: string;
  type?: string;
  source?: AssetSource;
  status?: AssetStatus;
  files?: string[];
  key_features?: string[];
  colorways?: string[];
  packaging?: string;
  notes?: string;
  created?: string;
}

export interface LogoAsset {
  id: string;
  label?: string;
  files?: Record<string, string>;
  clear_space?: string;
  min_size_px?: number;
  notes?: string;
}

export interface VoiceAsset {
  id: string;
  label?: string;
  voice_name: string;
  style?: string;
  pace?: string;
  accent?: string;
  sample?: string;
  notes?: string;
}

export interface LocationAsset {
  id: string;
  label?: string;
  description?: string;
  source?: AssetSource;
  files?: string[];
  notes?: string;
}

export interface MusicAsset {
  id: string;
  label?: string;
  description?: string;
  source?: AssetSource;
  path?: string;
  duration_seconds?: number;
  notes?: string;
}

export interface StyleReferenceAsset {
  id: string;
  label?: string;
  files?: string[];
  what_we_like?: string;
  notes?: string;
}

export interface BackgroundAsset {
  id: string;
  label?: string;
  description?: string;
  source?: AssetSource;
  files?: string[];
  use_for?: string[];
  notes?: string;
}

export interface ThumbnailAsset {
  id: string;
  label?: string;
  description?: string;
  style?: string;
  source?: AssetSource;
  files?: string[];
  platform?: string;
  notes?: string;
}

export interface SocialAsset {
  id: string;
  label?: string;
  source?: AssetSource;
  status?: AssetStatus;
  files?: Record<string, string>;
  created?: string;
}

export interface SfxAsset {
  id: string;
  label?: string;
  description?: string;
  source?: AssetSource;
  path?: string;
  duration_seconds?: number;
  notes?: string;
}

export interface OverlayAsset {
  id: string;
  label?: string;
  description?: string;
  position?: string;
  opacity?: number;
  files?: string[];
  notes?: string;
}

export interface IconAsset {
  id: string;
  label?: string;
  source?: AssetSource;
  files?: Record<string, string> | string[];
  notes?: string;
}

export interface AssetConfig {
  project: string;
  updated?: string;
  characters: CharacterAsset[];
  products: ProductAsset[];
  logos: LogoAsset[];
  voices: VoiceAsset[];
  locations: LocationAsset[];
  music: MusicAsset[];
  style_references: StyleReferenceAsset[];
  backgrounds: BackgroundAsset[];
  thumbnails: ThumbnailAsset[];
  social: SocialAsset[];
  sfx: SfxAsset[];
  overlays: OverlayAsset[];
  icons: IconAsset[];
}

export type AssetCollection = keyof Pick<
  AssetConfig,
  'characters' | 'products' | 'logos' | 'voices' | 'locations' | 'music' | 'style_references' | 'backgrounds' | 'thumbnails' | 'social' | 'sfx' | 'overlays' | 'icons'
>;

/** Result of resolving one asset's files against the filesystem. */
export interface ResolvedAsset<T = unknown> {
  ok: boolean;
  id: string;
  collection: AssetCollection;
  asset: T;
  /** absolute paths that exist on disk */
  existing: string[];
  /** relative paths recorded but missing on disk */
  missing: string[];
}

// =============================================================================
// PATHS & CONSTANTS
// =============================================================================

const EMPTY_CONFIG = (project: string): AssetConfig => ({
  project,
  updated: '',
  characters: [],
  products: [],
  logos: [],
  voices: [],
  locations: [],
  music: [],
  style_references: [],
  backgrounds: [],
  thumbnails: [],
  social: [],
  sfx: [],
  overlays: [],
  icons: [],
});

const COLLECTIONS: AssetCollection[] = [
  'characters', 'products', 'logos', 'voices', 'locations', 'music', 'style_references',
  'backgrounds', 'thumbnails', 'social', 'sfx', 'overlays', 'icons',
];

/** Root of a project: projects/{name}/ */
export function projectRoot(projectName: string): string {
  return path.join('projects', projectName);
}

/** Path to a project's asset config file. */
export function assetConfigPath(projectName: string): string {
  return path.join(projectRoot(projectName), 'config', 'assets.yaml');
}

// =============================================================================
// LOAD / SAVE
// =============================================================================

/**
 * Load and normalize a project's asset registry. Returns an empty (but valid)
 * config if the file does not exist yet, so callers can always treat the result
 * as a complete object. Throws only on malformed YAML.
 */
export function loadAssetConfig(projectName: string): AssetConfig {
  const file = assetConfigPath(projectName);
  if (!fs.existsSync(file)) {
    return EMPTY_CONFIG(projectName);
  }

  const raw = fs.readFileSync(file, 'utf8');
  let parsed: Partial<AssetConfig> | null;
  try {
    parsed = parseYaml(raw) as Partial<AssetConfig> | null;
  } catch (error) {
    throw new Error(
      `Malformed assets.yaml for "${projectName}": ${error instanceof Error ? error.message : 'parse error'}`
    );
  }

  const base = EMPTY_CONFIG(projectName);
  if (!parsed || typeof parsed !== 'object') return base;

  // Merge, coercing any null/omitted collection to an array
  const merged: AssetConfig = { ...base, ...parsed, project: parsed.project || projectName };
  for (const col of COLLECTIONS) {
    const value = (parsed as Record<string, unknown>)[col];
    merged[col] = (Array.isArray(value) ? value : []) as never;
  }
  return merged;
}

/** Write the registry back to disk (creates config/ if needed). */
export function saveAssetConfig(config: AssetConfig): void {
  const file = assetConfigPath(config.project);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const out: AssetConfig = { ...config };
  fs.writeFileSync(file, stringifyYaml(out), 'utf8');
}

// =============================================================================
// LOOKUP & RESOLUTION
// =============================================================================

/** Collect every recorded file path on an asset, regardless of its shape. */
function assetFilePaths(asset: Record<string, unknown>): string[] {
  const paths: string[] = [];
  const push = (v: unknown) => { if (typeof v === 'string' && v.trim()) paths.push(v); };

  push(asset.path);
  push(asset.packaging);
  push(asset.sample);

  if (Array.isArray(asset.files)) {
    asset.files.forEach(push);
  } else if (asset.files && typeof asset.files === 'object') {
    Object.values(asset.files as Record<string, unknown>).forEach(push);
  }
  return paths;
}

/** Find an asset by id across all collections (or a specific one). */
export function findAsset(
  config: AssetConfig,
  id: string,
  collection?: AssetCollection
): { collection: AssetCollection; asset: Record<string, unknown> } | null {
  const cols = collection ? [collection] : COLLECTIONS;
  for (const col of cols) {
    const hit = (config[col] as unknown as Array<Record<string, unknown>>).find(a => a.id === id);
    if (hit) return { collection: col, asset: hit };
  }
  return null;
}

/**
 * Resolve an asset's files against the filesystem.
 * `ok` is true only when the asset exists AND every recorded file is present.
 * Paths are resolved relative to projects/{project}/.
 */
export function resolveAsset<T = unknown>(
  config: AssetConfig,
  id: string,
  collection?: AssetCollection
): ResolvedAsset<T> {
  const found = findAsset(config, id, collection);
  if (!found) {
    return { ok: false, id, collection: collection || 'characters', asset: undefined as T, existing: [], missing: [] };
  }

  const root = projectRoot(config.project);
  const recorded = assetFilePaths(found.asset);
  const existing: string[] = [];
  const missing: string[] = [];

  for (const rel of recorded) {
    const abs = path.isAbsolute(rel) ? rel : path.join(root, rel);
    if (fs.existsSync(abs)) existing.push(abs);
    else missing.push(rel);
  }

  // An asset with NO recorded files is only "ok" if it is non-visual (voice).
  const isVisual = found.collection !== 'voices';
  const ok = missing.length === 0 && (!isVisual || existing.length > 0);

  return { ok, id, collection: found.collection, asset: found.asset as T, existing, missing };
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationIssue {
  id: string;
  collection: AssetCollection;
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Validate the whole registry: duplicate ids, missing files, broken voice
 * links, and real-person assets lacking a consent record.
 */
export function validateAssets(config: AssetConfig): { ok: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const voiceIds = new Set(config.voices.map(v => v.id));

  for (const col of COLLECTIONS) {
    for (const asset of config[col] as unknown as Array<Record<string, unknown>>) {
      const id = String(asset.id ?? '');

      if (!id) {
        issues.push({ id: '(missing)', collection: col, severity: 'error', message: `An entry in "${col}" has no id` });
        continue;
      }
      if (seen.has(id)) {
        issues.push({ id, collection: col, severity: 'error', message: `Duplicate asset id "${id}"` });
      }
      seen.add(id);

      // Missing files
      const resolved = resolveAsset(config, id, col);
      for (const miss of resolved.missing) {
        issues.push({ id, collection: col, severity: 'error', message: `File not found: ${miss}` });
      }
      if (col !== 'voices' && resolved.existing.length === 0 && resolved.missing.length === 0
          && asset.status !== 'needs-generation' && asset.status !== 'placeholder') {
        issues.push({ id, collection: col, severity: 'warning', message: `No files recorded for "${id}"` });
      }

      // Voice link integrity (characters)
      if (col === 'characters' && asset.linked_voice && !voiceIds.has(String(asset.linked_voice))) {
        issues.push({ id, collection: col, severity: 'warning', message: `linked_voice "${asset.linked_voice}" not found in voices` });
      }

      // Consent for real people
      if (asset.source === 'real-person') {
        const consent = asset.consent as AssetConsent | undefined;
        if (!consent || consent.release_on_file !== true) {
          issues.push({ id, collection: col, severity: 'warning', message: `Real-person asset "${id}" has no signed release on file` });
        }
      }
    }
  }

  return { ok: issues.every(i => i.severity !== 'error'), issues };
}

// =============================================================================
// REGISTER (APPEND + SAVE)
// =============================================================================

/**
 * Add or update an asset, then persist. Upserts by id within the collection.
 * Use this right after generating/receiving a reusable asset so the path is
 * saved for future content.
 *
 * Returns a WorkflowResult so it composes with the rest of the library.
 */
export function registerAsset(
  projectName: string,
  collection: AssetCollection,
  asset: Record<string, unknown> & { id: string },
  options: { date?: string } = {}
): WorkflowResult<{ id: string; collection: AssetCollection; configPath: string }> {
  if (!asset.id || !String(asset.id).trim()) {
    return { success: false, error: { code: 'INVALID_INPUT', message: 'Asset id is required' } };
  }

  try {
    const config = loadAssetConfig(projectName);
    const list = config[collection] as unknown as Array<Record<string, unknown>>;
    const idx = list.findIndex(a => a.id === asset.id);

    if (idx >= 0) list[idx] = { ...list[idx], ...asset };
    else list.push(asset);

    if (options.date) config.updated = options.date;
    saveAssetConfig(config);

    return {
      success: true,
      data: { id: asset.id, collection, configPath: assetConfigPath(projectName) },
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'FILE_WRITE_ERROR', message: error instanceof Error ? error.message : 'Failed to register asset' },
    };
  }
}

/** Convenience: list ids that still need generation (status flagged). */
export function pendingAssets(config: AssetConfig): Array<{ id: string; collection: AssetCollection }> {
  const pending: Array<{ id: string; collection: AssetCollection }> = [];
  for (const col of COLLECTIONS) {
    for (const asset of config[col] as unknown as Array<Record<string, unknown>>) {
      if (asset.status === 'needs-generation' || asset.status === 'placeholder') {
        pending.push({ id: String(asset.id), collection: col });
      }
    }
  }
  return pending;
}
