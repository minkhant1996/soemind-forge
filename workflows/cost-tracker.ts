/**
 * Cost Tracker
 * ============
 *
 * Per-project spend ledger with an optional hard cap. Every generation workflow
 * returns `cost.totalCost`; record it here so a project has a running total, a
 * per-type breakdown, and a cap that can block a run before it overspends.
 *
 * Ledger lives at `projects/{name}/config/budget.yaml`.
 *
 * USAGE:
 * ```typescript
 * import { setBudgetCap, checkBudget, recordCost, budgetSummary }
 *   from '../../workflows/dist/index.js';
 *
 * setBudgetCap('summer-campaign', 50);                 // $50 cap
 * const c = checkBudget('summer-campaign', 12.40);     // would this run fit?
 * if (!c.ok) console.log('Over cap:', c.remaining, 'left');
 * // ...after a successful generation:
 * recordCost('summer-campaign', { label: 'hero video', type: 'video', amount: 12.40 });
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import type { WorkflowResult } from './types.js';

// =============================================================================
// TYPES
// =============================================================================

export type CostType = 'text' | 'image' | 'video' | 'audio' | 'music' | 'other';

export interface BudgetEntry {
  date: string;
  label: string;
  type: CostType;
  amount: number;
}

export interface Budget {
  project: string;
  /** Hard cap in USD, or null for no cap. */
  cap: number | null;
  currency: string;
  spent: number;
  entries: BudgetEntry[];
  updated?: string;
}

export interface BudgetCheck {
  /** true if the estimated run fits under the cap (or there is no cap). */
  ok: boolean;
  spent: number;
  cap: number | null;
  remaining: number | null;
  estimatedCost: number;
  /** projected spent after the run */
  projected: number;
  wouldExceed: boolean;
}

export interface BudgetSummary {
  project: string;
  spent: number;
  cap: number | null;
  remaining: number | null;
  currency: string;
  entryCount: number;
  byType: Record<string, number>;
}

// =============================================================================
// PATHS & LOAD/SAVE
// =============================================================================

export function budgetPath(projectName: string): string {
  return path.join('projects', projectName, 'config', 'budget.yaml');
}

const EMPTY_BUDGET = (project: string): Budget => ({
  project, cap: null, currency: 'USD', spent: 0, entries: [], updated: '',
});

/** Load the ledger; returns an empty (valid) budget if none exists. Throws on bad YAML. */
export function loadBudget(projectName: string): Budget {
  const file = budgetPath(projectName);
  if (!fs.existsSync(file)) return EMPTY_BUDGET(projectName);

  let parsed: Partial<Budget> | null;
  try {
    parsed = parseYaml(fs.readFileSync(file, 'utf8')) as Partial<Budget> | null;
  } catch (error) {
    throw new Error(`Malformed budget.yaml for "${projectName}": ${error instanceof Error ? error.message : 'parse error'}`);
  }

  const base = EMPTY_BUDGET(projectName);
  if (!parsed || typeof parsed !== 'object') return base;

  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  // Recompute spent from entries for integrity (never trust a stale field).
  const spent = entries.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

  return {
    project: parsed.project || projectName,
    cap: typeof parsed.cap === 'number' ? parsed.cap : null,
    currency: parsed.currency || 'USD',
    spent: roundCents(spent),
    entries,
    updated: parsed.updated || '',
  };
}

export function saveBudget(budget: Budget): void {
  const file = budgetPath(budget.project);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stringifyYaml(budget), 'utf8');
}

function roundCents(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function nowIso(date?: string): string {
  if (date) return date;
  try { return new Date().toISOString(); } catch { return ''; }
}

// =============================================================================
// OPERATIONS
// =============================================================================

/** Set (or clear, with null) the project's hard cap in USD. */
export function setBudgetCap(projectName: string, cap: number | null): WorkflowResult<Budget> {
  if (cap !== null && (!(typeof cap === 'number') || cap < 0)) {
    return { success: false, error: { code: 'INVALID_INPUT', message: 'cap must be a non-negative number or null' } };
  }
  try {
    const budget = loadBudget(projectName);
    budget.cap = cap;
    budget.updated = nowIso();
    saveBudget(budget);
    return { success: true, data: budget };
  } catch (error) {
    return { success: false, error: { code: 'FILE_WRITE_ERROR', message: error instanceof Error ? error.message : 'Failed to set cap' } };
  }
}

/**
 * Check whether an estimated cost fits under the cap WITHOUT spending. Pure read —
 * call this before an expensive run and refuse/confirm if `ok` is false.
 */
export function checkBudget(projectName: string, estimatedCost: number): BudgetCheck {
  const budget = loadBudget(projectName);
  const est = Number(estimatedCost) || 0;
  const projected = roundCents(budget.spent + est);
  const remaining = budget.cap === null ? null : roundCents(budget.cap - budget.spent);
  const wouldExceed = budget.cap !== null && projected > budget.cap;
  return {
    ok: !wouldExceed,
    spent: budget.spent,
    cap: budget.cap,
    remaining,
    estimatedCost: est,
    projected,
    wouldExceed,
  };
}

/**
 * Append a spend entry and persist. Recomputes the running total. Returns the new
 * spent/remaining and whether the cap is now exceeded (recording never blocks — use
 * `checkBudget` to gate beforehand).
 */
export function recordCost(
  projectName: string,
  entry: { label: string; type: CostType; amount: number },
  options: { date?: string } = {}
): WorkflowResult<{ spent: number; remaining: number | null; cap: number | null; overCap: boolean }> {
  if (!entry || typeof entry.amount !== 'number' || entry.amount < 0) {
    return { success: false, error: { code: 'INVALID_INPUT', message: 'amount must be a non-negative number' } };
  }
  try {
    const budget = loadBudget(projectName);
    budget.entries.push({
      date: nowIso(options.date),
      label: entry.label || '(unlabelled)',
      type: entry.type || 'other',
      amount: roundCents(entry.amount),
    });
    budget.spent = roundCents(budget.entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
    budget.updated = nowIso(options.date);
    saveBudget(budget);

    const remaining = budget.cap === null ? null : roundCents(budget.cap - budget.spent);
    return {
      success: true,
      data: { spent: budget.spent, remaining, cap: budget.cap, overCap: budget.cap !== null && budget.spent > budget.cap },
    };
  } catch (error) {
    return { success: false, error: { code: 'FILE_WRITE_ERROR', message: error instanceof Error ? error.message : 'Failed to record cost' } };
  }
}

/** Running totals + per-type breakdown for reporting. */
export function budgetSummary(projectName: string): BudgetSummary {
  const budget = loadBudget(projectName);
  const byType: Record<string, number> = {};
  for (const e of budget.entries) {
    byType[e.type] = roundCents((byType[e.type] || 0) + (Number(e.amount) || 0));
  }
  return {
    project: budget.project,
    spent: budget.spent,
    cap: budget.cap,
    remaining: budget.cap === null ? null : roundCents(budget.cap - budget.spent),
    currency: budget.currency,
    entryCount: budget.entries.length,
    byType,
  };
}
