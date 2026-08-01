#!/usr/bin/env node
// Cross-platform `rm -rf dist` (works on Windows/macOS/Linux).
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
rmSync(dist, { recursive: true, force: true });
console.log('clean: removed', dist);
