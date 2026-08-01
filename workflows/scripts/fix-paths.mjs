#!/usr/bin/env node
// Cross-platform replacement for the Unix `find ... sed` post-build step.
//
// tsconfig uses `rootDir: ".."` (to pull in ../openrouter), so tsc emits the
// entry at dist/workflows/index.js. The source import '../gemini/dist/index.js'
// (correct relative to workflows/index.ts) then points at the non-existent
// dist/gemini/... once moved. This rewrites it to '../../../gemini/dist/index.js'
// so it resolves to the repo-root gemini/ from dist/workflows/.
//
// Idempotent: the quote anchors mean an already-fixed path won't match again.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'workflows');
const RE = /(['"])\.\.\/gemini\/dist\/index\.js\1/g;
const REPLACEMENT = '$1../../../gemini/dist/index.js$1';

let changed = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.js$/.test(name) && !/\.d\.ts$/.test(name)) continue;
    const src = readFileSync(p, 'utf8');
    const out = src.replace(RE, REPLACEMENT);
    if (out !== src) { writeFileSync(p, out); changed++; }
  }
}

try {
  walk(root);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('fix-paths: dist/workflows not found — run `tsc` first.');
    process.exit(1);
  }
  throw err;
}
console.log(`fix-paths: rewrote gemini import in ${changed} file(s)`);
