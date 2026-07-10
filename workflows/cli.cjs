#!/usr/bin/env node
/*!
 * SoeMind Forge — the budget-aware content studio for AI agents
 * https://github.com/minkhant1996/soemind-forge
 * Copyright (c) 2026 Min Khant Soe · MIT License
 */
/**
 * Workflow CLI dispatcher
 * =======================
 *
 * Exposes every pre-built workflow function as a runnable command so agents can
 * CALL a workflow instead of authoring a throwaway script for it.
 *
 *   node workflows/cli.cjs <command> '<json-args>'
 *   node workflows/cli.cjs <command> @args.json      # read args from a file
 *   node workflows/cli.cjs <command> -               # read args JSON from stdin
 *   node workflows/cli.cjs list                      # show all commands
 *
 * Example:
 *   node workflows/cli.cjs generateSilentVideo \
 *     '{"prompt":"...","outputPath":"out.mp4","duration":8}'
 *
 * Output: the workflow's JSON result on stdout. Exit code 0 on success,
 * 1 when the workflow returns { success: false } or throws.
 */

// Load API keys from the project's .env, regardless of cwd.
// quiet: keep stdout pure JSON (the banner otherwise prints on load).
try {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
} catch {
  console.error('Dependencies not installed. Run from the project root: npm install');
  process.exit(1);
}

// The build (rootDir '..', to include the sibling openrouter sources) emits the
// workflows entrypoint under dist/workflows/. package.json "main" points here too.
// Loaded lazily so `doctor` can diagnose a missing/broken build instead of
// crashing on this require.
let _workflows;
function loadWorkflows() {
  if (!_workflows) _workflows = require('./dist/workflows/index.js');
  return _workflows;
}

// Commands the CLI will dispatch, grouped for `list`/`--help` output.
// Anything exported by the workflows module can be called; these are the
// documented, agent-facing ones.
const COMMANDS = {
  'Text / copy': [
    'generateText', 'generateHooks', 'generateScript', 'generateCaption',
  ],
  Image: [
    'generateSingleImage', 'generateImageVariation', 'generateCarousel',
    'generateCarouselFromRef', 'generateImageOptions', 'finalizeImage',
    'generateStoryboard', 'generateCharacterSheet', 'analyzeImage',
  ],
  Video: [
    'generateSilentVideo', 'generateSpeakingVideo', 'generateVideoFromImage',
    'generateSpeakingVideoFromImage', 'generateVideoWithVoiceover',
    'generateVideoFromImageWithVoiceover', 'generateOmniVideoClip',
    'generateVideoFromKeyframes', 'infiniteTalkLipsync', 'analyzeReferenceVideo',
  ],
  'Video (Seedance 2.0 / OpenRouter — lip-sync, native audio)': [
    'seedanceTextToVideo', 'seedanceImageToVideo', 'seedanceSpeakingVideo',
    'seedanceMultiShotVideo', 'seedanceMultiRefVideo',
  ],
  'Audio / music': [
    'generateVoiceover', 'generateEdgeTTSVoiceover', 'generateMultiSpeakerVoiceover',
    'generateMusicTrack', 'transcribeAudio',
  ],
  'Brand assets': [
    'generateProfileImage', 'generateCoverImage', 'generateHighlightCovers',
    'generateBrandAssets',
  ],
  'Assemble / QA / review': [
    'mixVideoAudio', 'generateCaptions', 'assembleFinal', 'assembleStoryFilm', 'reviewOutput',
    'reviewVideoOutput', 'reviewScript', 'reviewImagePrompt', 'reviewVideoPrompt',
    'reviewThumbnail', 'reviewContentPlan', 'reviewBatch',
  ],
  'Assets / budget': [
    'loadAssetConfig', 'resolveAsset', 'findAsset', 'validateAssets',
    'registerAsset', 'pendingAssets', 'loadBudget', 'checkBudget',
    'recordCost', 'setBudgetCap', 'budgetSummary',
  ],
  'Publish / repurpose': [
    'packageContent', 'transcribeVideo', 'extractClip',
  ],
  'Remotion (local text rendering, $0)': [
    'renderKineticReel', 'renderSlideStill', 'renderCaptionedVideo', 'renderTextMotion',
  ],
  'Text tools (frame-aware)': [
    'suggestTextPlacement', 'suggestTextDesign', 'transcriptToElements', 'subjectMatte',
  ],
  'Manifest (generation audit trail)': [
    'createGenerationManifest', 'addManifestEntry', 'loadManifest',
    'generateManifestReport', 'saveManifestReport',
  ],
  Pipeline: [
    'runPipeline',
  ],
  Setup: [
    'doctor',
  ],
};

const ALL = new Set(Object.values(COMMANDS).flat());

// Helpers whose FIRST arg is a loaded AssetConfig object. For CLI ergonomics we let
// callers pass the project NAME string instead — we load the config for them.
// (loadAssetConfig / registerAsset already take a project-name string directly.)
const CONFIG_FIRST_HELPERS = new Set([
  'resolveAsset', 'findAsset', 'validateAssets', 'pendingAssets',
]);

// =============================================================================
// BUDGET ENFORCEMENT — "money moves only with consent" is code, not convention.
// Every command that calls a paid API is gated on the project's budget cap
// BEFORE it runs, and its actual cost is auto-recorded to the ledger AFTER.
// Agents cannot forget recordCost, and a capped project hard-stops.
// Override (explicit user consent only): BUDGET_OVERRIDE=1 env var.
// =============================================================================

// Commands that hit a paid provider API (everything local-only is excluded).
const PAID_COMMANDS = new Set([
  ...COMMANDS['Text / copy'], ...COMMANDS.Image, ...COMMANDS.Video,
  ...COMMANDS['Video (Seedance 2.0 / OpenRouter — lip-sync, native audio)'],
  ...COMMANDS['Audio / music'], ...COMMANDS['Brand assets'],
  'reviewOutput', 'reviewVideoOutput', 'reviewScript', 'reviewImagePrompt', 'reviewVideoPrompt',
  'reviewThumbnail', 'reviewContentPlan', 'reviewBatch',
  'transcribeVideo',
  'suggestTextPlacement', 'suggestTextDesign', // call a vision model (analyzeImage) — pennies, gate + record
]);
// Edge TTS is FREE (no API key, no paid provider) — never budget-gate it, even
// though it lives in the 'Audio / music' group above.
PAID_COMMANDS.delete('generateEdgeTTSVoiceover');

const LEDGER_TYPE = [
  [/video/i, 'video'],
  [/voiceover|speaker/i, 'voiceover'],
  [/music/i, 'music'],
  [/image|carousel|storyboard|character|profile|cover|highlight|brandassets|thumbnail/i, 'image'],
];

function ledgerType(command) {
  for (const [re, type] of LEDGER_TYPE) if (re.test(command)) return type;
  return 'text';
}

// Infer the project from explicit fields or any projects/<name>/ path in the args.
function inferProject(input) {
  if (input && !Array.isArray(input) && typeof input.projectName === 'string') {
    return input.projectName;
  }
  const m = JSON.stringify(input).match(/projects[\/\\]([^\/\\"]+)[\/\\]/);
  return m ? m[1] : null;
}

// Hard gate: refuse paid work for a project already at/over its cap.
function enforceBudgetCap(workflows, command, project) {
  if (!project || process.env.BUDGET_OVERRIDE === '1') return;
  let b;
  try { b = workflows.loadBudget(project); } catch { return; }
  if (!b || b.cap == null) return;
  if (b.spent >= b.cap) {
    console.log(JSON.stringify({
      success: false,
      error: {
        code: 'BUDGET_EXCEEDED',
        message: `Project "${project}" is at its budget cap ($${b.spent.toFixed(2)} spent / $${b.cap} cap). `
          + `Nothing was generated. Ask the user to raise the cap (setBudgetCap) or approve an override `
          + `(rerun with BUDGET_OVERRIDE=1).`,
      },
    }, null, 2));
    process.exit(1);
  }
  const ratio = b.spent / b.cap;
  if (ratio >= 0.8) {
    console.error(`[Budget] ⚠️ ${project}: $${b.spent.toFixed(2)} of $${b.cap} spent `
      + `(${Math.round(ratio * 100)}%) — approaching the cap.`);
  }
}

// Auto-record any real spend the workflow reported. The ledger cannot drift.
function autoRecordCost(workflows, command, project, result) {
  const cost = result && result.data && result.data.cost && result.data.cost.totalCost;
  if (!project || !cost || cost <= 0) return;
  try {
    const r = workflows.recordCost(project, {
      label: `auto:${command}`, type: ledgerType(command), amount: cost,
    });
    const d = (r && r.data) || r || {};
    console.error(`[Budget] recorded $${cost.toFixed(4)} to ${project}`
      + (d.cap != null ? ` — $${Number(d.spent).toFixed(2)} / $${d.cap} spent` : ''));
  } catch (e) {
    console.error(`[Budget] ⚠️ failed to auto-record $${cost.toFixed(4)} for ${project}: ${e.message}`);
  }
}


// =============================================================================
// PIPELINE RUNNER — executes a JSON graph of workflow calls.
// Nodes run in array order; any string "{{nodeId.path.to.value}}" in args is
// replaced with that value from an earlier node's result (whole-string refs
// keep their type; embedded refs interpolate as strings). Every node passes
// through the SAME budget gate + auto-ledger as a direct CLI call.
// Node fields: id, command, args, optional:true (continue on failure),
// skip:true (hold a node without deleting it).
// Result: pipeline-result.json written next to the pipeline file.
// =============================================================================

function resolvePipelineRefs(value, results) {
  const WHOLE = /^\{\{([\w.-]+)\}\}$/;
  const EMBED = /\{\{([\w.-]+)\}\}/g;
  const lookup = (ref) => {
    const [id, ...pathParts] = ref.split('.');
    if (!(id in results)) throw new Error(`Pipeline ref "{{${ref}}}" — no node "${id}" has run yet`);
    let v = results[id];
    for (const p of pathParts) {
      if (v == null) break;
      v = v[p];
    }
    if (v === undefined) throw new Error(`Pipeline ref "{{${ref}}}" resolved to undefined`);
    return v;
  };
  if (typeof value === 'string') {
    const whole = value.match(WHOLE);
    if (whole) return lookup(whole[1]);
    return value.replace(EMBED, (_, ref) => String(lookup(ref)));
  }
  if (Array.isArray(value)) return value.map((v) => resolvePipelineRefs(v, results));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolvePipelineRefs(v, results);
    return out;
  }
  return value;
}

async function runPipeline(pipelinePath) {
  const fs = require('fs');
  const path = require('path');
  const workflows = loadWorkflows();
  const pipe = JSON.parse(fs.readFileSync(pipelinePath, 'utf8'));
  if (!Array.isArray(pipe.nodes) || !pipe.nodes.length) {
    console.error('Pipeline needs a non-empty nodes[] array.');
    process.exit(1);
  }
  const results = {};
  const summary = [];
  console.error(`[Pipeline] ${pipe.name || path.basename(pipelinePath)} — ${pipe.nodes.length} nodes`);

  for (const node of pipe.nodes) {
    if (!node.id || !node.command) {
      console.error(`[Pipeline] node missing id/command: ${JSON.stringify(node).slice(0, 120)}`);
      process.exit(1);
    }
    if (node.skip) {
      summary.push({ id: node.id, command: node.command, status: 'skipped' });
      console.error(`[Pipeline] ○ ${node.id} (${node.command}) — skipped`);
      continue;
    }
    if (typeof workflows[node.command] !== 'function') {
      console.error(`[Pipeline] ✗ ${node.id}: unknown command "${node.command}"`);
      process.exit(1);
    }
    let args;
    try {
      args = resolvePipelineRefs(node.args ?? {}, results);
    } catch (e) {
      console.error(`[Pipeline] ✗ ${node.id}: ${e.message}`);
      process.exit(1);
    }
    if (CONFIG_FIRST_HELPERS.has(node.command) && Array.isArray(args) && typeof args[0] === 'string') {
      args = [workflows.loadAssetConfig(args[0]), ...args.slice(1)];
    }
    const project = PAID_COMMANDS.has(node.command)
      ? (inferProject(args) || pipe.project || null)
      : null;
    if (project) enforceBudgetCap(workflows, node.command, project);

    console.error(`[Pipeline] ▶ ${node.id} (${node.command})…`);
    let result;
    try {
      result = Array.isArray(args)
        ? await workflows[node.command](...args)
        : await workflows[node.command](args);
    } catch (e) {
      result = { success: false, error: { code: 'THREW', message: e.message } };
    }
    if (project) autoRecordCost(workflows, node.command, project, result);
    results[node.id] = result;

    const ok = !(result && typeof result === 'object' && result.success === false);
    const cost = result?.data?.cost?.totalCost || 0;
    summary.push({
      id: node.id, command: node.command,
      status: ok ? 'ok' : 'failed',
      cost,
      error: ok ? undefined : result?.error?.message,
    });
    console.error(`[Pipeline] ${ok ? '✓' : '✗'} ${node.id}${cost ? ` ($${cost.toFixed(3)})` : ''}${ok ? '' : ` — ${result?.error?.message}`}`);
    if (!ok && !node.optional) {
      console.error(`[Pipeline] stopping at failed node "${node.id}" (mark it optional:true to continue past failures)`);
      break;
    }
  }

  const totalCost = summary.reduce((a, s) => a + (s.cost || 0), 0);
  const resultPath = pipelinePath.replace(/\.json$/, '') + '-result.json';
  fs.writeFileSync(resultPath, JSON.stringify({ pipeline: pipe.name, totalCost, nodes: summary, results }, null, 2));
  console.log(JSON.stringify({ success: summary.every(s => s.status !== 'failed'), totalCost, nodes: summary, resultPath }, null, 2));
  process.exit(summary.some(s => s.status === 'failed') ? 1 : 0);
}
function printList() {
  console.error('Usage: node workflows/cli.cjs <command> \'<json-args>\'\n');
  console.error('Read args from a file with @path.json, or from stdin with -.\n');
  console.error('Commands:');
  for (const [group, cmds] of Object.entries(COMMANDS)) {
    console.error(`\n  ${group}`);
    for (const c of cmds) console.error(`    ${c}`);
  }
  console.error('\nSee workflows/WORKFLOWS.md for each command\'s argument shape.');
}

function readStdin() {
  return require('fs').readFileSync(0, 'utf8');
}

// `doctor` — environment health check. Static checks only (no API spend);
// pass --ping to also make one minimal paid text call per configured provider.
async function runDoctor(ping) {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const results = [];
  const check = (ok, label, fix) => {
    results.push({ ok, label, fix });
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !fix ? '' : `\n     fix: ${fix}`}`);
  };
  const warn = (label, fix) =>
    console.log(`  ⚠️  ${label}${fix ? `\n     fix: ${fix}` : ''}`);

  console.log('AI Director Studio — doctor\n');

  const major = Number(process.versions.node.split('.')[0]);
  check(major >= 18, `Node.js ${process.versions.node} (need >= 18)`,
    'install Node 18+ from https://nodejs.org');

  check(fs.existsSync(path.join(root, 'gemini', 'dist', 'index.js')),
    'gemini module built (gemini/dist/)',
    'cd gemini && npm install && npm run build');

  const workflowsBuilt = fs.existsSync(path.join(__dirname, 'dist', 'workflows', 'index.js'));
  check(workflowsBuilt, 'workflows module built (workflows/dist/)',
    'cd workflows && npm install && npm run build');

  if (workflowsBuilt) {
    try {
      loadWorkflows();
      check(true, 'workflows module loads');
    } catch (e) {
      check(false, `workflows module loads (${e.message})`,
        'rebuild both modules: cd gemini && npm run build && cd ../workflows && npm run build');
    }
  }

  // A dist that EXISTS but predates its .ts source silently runs old code —
  // newer args (e.g. Omni edit inputVideoPath/referenceImagePaths) are dropped
  // without error and generations still cost money (paid for the hard way,
  // dance-motion-test 2026-07-06). Compare newest source mtime vs dist mtime.
  const newestTsMtime = (dir) => {
    try {
      return fs.readdirSync(dir)
        .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
        .reduce((t, f) => Math.max(t, fs.statSync(path.join(dir, f)).mtimeMs), 0);
    } catch { return 0; }
  };
  const staleCheck = (label, srcDir, distFile, fixCmd) => {
    if (!fs.existsSync(distFile)) return; // missing dist already failed above
    const stale = newestTsMtime(srcDir) > fs.statSync(distFile).mtimeMs;
    check(!stale, `${label} build is current (dist not older than source)`, fixCmd);
  };
  staleCheck('gemini', path.join(root, 'gemini'),
    path.join(root, 'gemini', 'dist', 'index.js'),
    'cd gemini && npm run build');
  staleCheck('workflows', __dirname,
    path.join(__dirname, 'dist', 'workflows', 'index.js'),
    'cd workflows && npm run build');

  check(fs.existsSync(path.join(root, '.env')), '.env file exists',
    'cp .env.example .env  # then add your API key');

  const realKeys = (v) => (v || '').split(',').map((k) => k.trim())
    .filter((k) => k && !k.includes('your-') && !k.includes('...'));
  const gemKeys = realKeys(process.env.GEMINI_API_KEYS).length
    ? realKeys(process.env.GEMINI_API_KEYS) : realKeys(process.env.GEMINI_API_KEY);
  const orKeys = realKeys(process.env.OPENROUTER_API_KEYS).length
    ? realKeys(process.env.OPENROUTER_API_KEYS) : realKeys(process.env.OPENROUTER_API_KEY);
  const gemSet = gemKeys.length > 0;
  const orSet = orKeys.length > 0;
  check(Boolean(gemSet || orSet), 'at least one API key set in .env',
    'get a key: https://aistudio.google.com/app/apikey (GEMINI_API_KEY) or https://openrouter.ai/keys (OPENROUTER_API_KEY)');
  if (gemSet) console.log(`     GEMINI_API_KEY${gemKeys.length > 1 ? `S: ${gemKeys.length} keys (rotation)` : ': set'} (Veo video, Imagen images, Lyria music, TTS)`);
  else warn('GEMINI_API_KEY not set — no Veo/Imagen/Lyria/TTS');
  if (orSet) console.log(`     OPENROUTER_API_KEY${orKeys.length > 1 ? `S: ${orKeys.length} keys (rotation)` : ': set'} (optional: Seedance 2.0 talking avatar from custom voice audio, 100+ text models, Whisper — agent-added)`);
  else warn('OPENROUTER_API_KEY not set — no Seedance (custom-voice talking avatar) / GPT-4 / Claude / Whisper (optional)');
  const rpKeySet = realKeys(process.env.RUNPOD_API_KEY).length > 0;
  if (rpKeySet) console.log('     RUNPOD_API_KEY: set (InfiniteTalk lip-sync to provided audio — $0.25/480p, $0.50/720p)');
  else warn('RUNPOD_API_KEY not set — no infiniteTalkLipsync (lip-sync to user-provided audio, optional)');

  const remotionReady = fs.existsSync(path.join(root, 'remotion', 'node_modules', 'remotion'));
  if (remotionReady) console.log('  ✅ remotion module installed ($0 text rendering)');
  else warn('remotion/ not installed — renderSlideStill/renderKineticReel will fail',
    'cd remotion && npm install');

  const ffmpeg = require('child_process').spawnSync('ffmpeg', ['-version']).status === 0;
  if (ffmpeg) console.log('  ✅ ffmpeg available (video/audio assembly)');
  else warn('ffmpeg not found — mixVideoAudio/assembleFinal will fail',
    'macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg · Windows: https://ffmpeg.org/download.html');

  // Windows exposes `python`, not `python3` — probe both.
  const edgeTts = ['python3', 'python'].some((cmd) =>
    require('child_process').spawnSync(cmd, ['-c', 'import edge_tts']).status === 0);
  if (edgeTts) console.log('  ✅ edge-tts installed (generateEdgeTTSVoiceover — FREE voiceover, no key)');
  else warn('edge-tts not installed — no generateEdgeTTSVoiceover (FREE Microsoft TTS, optional)',
    'python3 -m pip install edge-tts  (Windows: python -m pip install edge-tts)');

  // rembg powers the text-behind-subject recipe (TEXT-OVERLAY-DESIGN-GUIDE § 6).
  // The import doubles as a health check: a numpy/scipy ABI mismatch fails here too.
  const rembg = ['python3', 'python'].some((cmd) =>
    require('child_process').spawnSync(cmd, ['-c', 'import rembg, PIL']).status === 0);
  if (rembg) console.log('  ✅ rembg installed (text-behind-subject recipe — TEXT-OVERLAY-DESIGN-GUIDE § 6)');
  else warn('rembg not installed or broken — no text-behind-subject recipe (optional)',
    'python3 -m pip install "rembg[cpu]" pillow  — if installed but failing, a numpy 2.x ABI conflict is likely: python3 -m pip install -U scipy');

  // Stale pricing silently breaks cost estimates and the budget guard's trust.
  for (const rel of ['gemini/pricing.json', 'openrouter/pricing.json']) {
    try {
      const { lastVerified } = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
      const ageDays = lastVerified
        ? Math.max(0, Math.floor((Date.now() - new Date(lastVerified).getTime()) / 86400000))
        : null;
      if (ageDays === null || ageDays > 90) {
        warn(`${rel} pricing ${ageDays === null ? 'has no lastVerified date' : `last verified ${ageDays} days ago`} — cost estimates may be stale`,
          'compare against provider pricing pages, update values, and set lastVerified to today');
      } else {
        console.log(`  ✅ ${rel} pricing verified ${ageDays} day(s) ago`);
      }
    } catch { /* missing/unreadable pricing surfaces via the build checks above */ }
  }

  if (ping && gemSet) {
    try {
      const r = await loadWorkflows().generateText({ prompt: 'Reply with the single word: ok', maxOutputTokens: 5 });
      check(r && r.success !== false, 'Gemini API reachable (1 minimal paid call)');
    } catch (e) {
      check(false, `Gemini API reachable (${e.message})`, 'verify the key at https://aistudio.google.com/app/apikey');
    }
  } else if (ping) {
    warn('--ping skipped: no GEMINI_API_KEY set');
  }

  const failed = results.filter((r) => !r.ok);
  console.log(failed.length
    ? `\n${failed.length} problem${failed.length > 1 ? 's' : ''} found — apply the fixes above, then re-run: node workflows/cli.cjs doctor`
    : '\nAll checks passed. Start your AI agent and say: "Read AGENT-GUIDE.md first, then onboard my brand."');
  process.exit(failed.length ? 1 : 0);
}

async function main() {
  const [command, rawArgs] = process.argv.slice(2);

  if (!command || command === 'list' || command === '--help' || command === '-h') {
    printList();
    process.exit(command ? 0 : 1);
  }

  if (command === 'doctor') {
    await runDoctor(rawArgs === '--ping');
    return;
  }

  if (command === 'runPipeline') {
    const file = rawArgs && rawArgs.startsWith('@') ? rawArgs.slice(1) : rawArgs;
    if (!file) { console.error('Usage: node workflows/cli.cjs runPipeline @pipeline.json'); process.exit(1); }
    await runPipeline(file);
    return;
  }

  const workflows = loadWorkflows();

  if (typeof workflows[command] !== 'function') {
    console.error(`Unknown command: ${command}`);
    if (!ALL.has(command)) console.error('Run `node workflows/cli.cjs list` to see available commands.');
    process.exit(1);
  }

  // Resolve the JSON argument payload.
  let argsText = rawArgs;
  if (rawArgs === '-') argsText = readStdin();
  else if (rawArgs && rawArgs.startsWith('@')) argsText = require('fs').readFileSync(rawArgs.slice(1), 'utf8');

  let input = {};
  if (argsText && argsText.trim()) {
    try {
      input = JSON.parse(argsText);
    } catch (e) {
      console.error(`Invalid JSON args for ${command}: ${e.message}`);
      process.exit(1);
    }
  }

  // Ergonomic shim: for config-first asset helpers, let callers pass the project NAME
  // as the first array element — load the AssetConfig for them.
  if (CONFIG_FIRST_HELPERS.has(command) && Array.isArray(input) && typeof input[0] === 'string') {
    input = [workflows.loadAssetConfig(input[0]), ...input.slice(1)];
  }

  // Budget gate: paid commands against a capped project stop BEFORE spending.
  const project = PAID_COMMANDS.has(command) ? inferProject(input) : null;
  if (project) enforceBudgetCap(workflows, command, project);

  // generate* workflows take a single options object; asset/budget helpers take
  // positional args — pass a JSON array to spread them: '["soemind-foundry"]'.
  const result = Array.isArray(input)
    ? await workflows[command](...input)
    : await workflows[command](input);

  // Ledger: any reported spend is recorded automatically — agents can't forget.
  if (project) autoRecordCost(workflows, command, project, result);

  // Print the full result so the agent can read paths, cost, and errors.
  console.log(JSON.stringify(result, null, 2));

  // Workflow functions return { success: boolean }; helpers return plain values.
  if (result && typeof result === 'object' && result.success === false) process.exit(1);
}

main().catch((err) => {
  console.error(`Workflow threw: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
