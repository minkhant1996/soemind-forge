// SoeMind Forge desktop wizard — drives the Rust commands in src-tauri/src/main.rs
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { open: openDialog } = window.__TAURI__.dialog;
const { openPath } = window.__TAURI__.opener;

const $ = (id) => document.getElementById(id);
const steps = [...document.querySelectorAll("section.step")];
const navItems = [...document.querySelectorAll("#steps-nav li")];

const state = {
  step: 0,
  tool: "claude",
  scope: "project", // always project-level — skills live inside the studio folder
  path: "",
  pathKind: null,       // studio | empty | occupied
  depsOk: false,
  keysOk: false,
  setupOk: false,
  running: false,
};

// ---------------------------------------------------------------- navigation

function show(step) {
  state.step = step;
  steps.forEach((s) => s.classList.toggle("visible", +s.dataset.step === step));
  navItems.forEach((li) => {
    li.classList.toggle("active", +li.dataset.step === step);
    li.classList.toggle("done", +li.dataset.step < step);
  });
  $("back-btn").style.visibility = step === 0 ? "hidden" : "visible";
  $("next-btn").classList.toggle("hidden", step === 6);
  if (step === 1) refreshDeps();
  if (step === 2) initPathStep();
  if (step === 3) loadKeys();
  updateNext();
}

function updateNext() {
  const gates = {
    0: true,
    1: state.depsOk,
    2: state.pathKind === "studio",
    3: state.keysOk,
    4: state.setupOk,
    5: true,
  };
  $("next-btn").disabled = state.running || !gates[state.step];
}

$("back-btn").onclick = () => show(Math.max(0, state.step - 1));
$("next-btn").onclick = async () => {
  if (state.step === 3) {
    const ok = await saveKeys();
    if (!ok) return;
  }
  if (state.step === 5) {
    await invoke("save_config", { config: { studio_path: state.path, tool: state.tool, setup_done: true } });
  }
  show(state.step + 1);
};

// ---------------------------------------------------------------- log streaming

const logTargets = {}; // step-tag -> <pre>
listen("wizard-log", (e) => {
  const pre = logTargets[e.payload.step];
  if (!pre) return;
  pre.textContent += e.payload.line + "\n";
  pre.scrollTop = pre.scrollHeight;
});
function attachLog(tag, pre) {
  logTargets[tag] = pre;
  pre.textContent = "";
  pre.classList.remove("hidden");
}

// ---------------------------------------------------------------- step 0: choices

$("tool-select").onchange = (e) => (state.tool = e.target.value);

// ---------------------------------------------------------------- step 1: deps

let missingInstallable = []; // dep ids install_system_deps knows how to fix

async function refreshDeps() {
  const list = $("deps-list");
  list.innerHTML = "<div class='dep'><span class='mark'>…</span><span class='name'>Checking…</span></div>";
  const deps = await invoke("check_deps");
  list.innerHTML = "";
  missingInstallable = [];
  const installable = ["node", "git", "ffmpeg", "python3", "edge-tts"];
  let requiredOk = true;
  let cliFound = false;
  for (const d of deps) {
    if (!d.found && installable.includes(d.id)) missingInstallable.push(d.id);
    const isCli = ["claude", "gemini", "codex"].includes(d.id);
    if (isCli && d.id !== state.tool && ["claude", "gemini", "codex"].includes(state.tool)) continue;
    if (isCli && d.found) cliFound = true;
    if (d.required && !d.found) requiredOk = false;
    const div = document.createElement("div");
    div.className = `dep ${d.found ? "ok" : "miss"} ${d.required ? "required" : "optional"}`;
    div.innerHTML = `
      <span class="mark">${d.found ? "✓" : d.required ? "✗" : "○"}</span>
      <span class="name">${d.name}</span>
      <span class="ver">${d.found ? d.version : ""}</span>
      <span class="hint">${d.found ? "" : d.hint}</span>`;
    list.appendChild(div);
  }
  // Offer one-click install of the chosen AI CLI when npm is present.
  const npmOk = deps.find((d) => d.id === "npm")?.found;
  const btn = $("install-cli-btn");
  if (!cliFound && npmOk && ["claude", "gemini", "codex"].includes(state.tool)) {
    btn.textContent = `Install ${state.tool} CLI now`;
    btn.classList.remove("hidden");
    requiredOk = false; // the chosen CLI is effectively required
  } else {
    btn.classList.add("hidden");
  }
  $("install-deps-btn").classList.toggle("hidden", missingInstallable.length === 0);
  state.depsOk = requiredOk;
  updateNext();
}

$("install-deps-btn").onclick = async () => {
  const btn = $("install-deps-btn"), st = $("deps-status");
  btn.disabled = true;
  attachLog("sysdeps", $("cli-install-log"));
  st.textContent = "Installing… your system will ask for permission (password / UAC dialog).";
  st.className = "status";
  try {
    const code = await invoke("install_system_deps", { ids: missingInstallable });
    st.textContent = code === 0 ? "✓ Installed." : `Some installs failed (exit ${code}) — see the log.`;
    st.className = code === 0 ? "status ok" : "status err";
  } catch (e) {
    st.textContent = "✗ " + e;
    st.className = "status err";
  }
  btn.disabled = false;
  refreshDeps();
};

$("recheck-btn").onclick = refreshDeps;
$("install-cli-btn").onclick = async () => {
  const btn = $("install-cli-btn");
  btn.disabled = true;
  attachLog("cli-install", $("cli-install-log"));
  try {
    await invoke("install_cli", { tool: state.tool });
  } catch (e) {
    $("cli-install-log").textContent += "\n" + e;
  }
  btn.disabled = false;
  refreshDeps();
};

// ---------------------------------------------------------------- step 2: path

async function initPathStep() {
  if (!$("path-input").value) {
    const cfg = await invoke("get_config");
    $("path-input").value = cfg.studio_path || (await invoke("default_studio_path"));
  }
  inspectPath();
}

async function inspectPath() {
  state.path = $("path-input").value.trim();
  if (!state.path) return;
  state.pathKind = await invoke("inspect_path", { path: state.path });
  const st = $("path-status");
  const cloneBtn = $("clone-btn");
  cloneBtn.classList.add("hidden");
  if (state.pathKind === "studio") {
    st.textContent = "✓ SoeMind Forge studio found — it will be used.";
    st.className = "status ok";
  } else if (state.pathKind === "empty") {
    st.textContent = "Folder is empty (or doesn't exist yet) — the studio will be downloaded here.";
    st.className = "status";
    cloneBtn.classList.remove("hidden");
  } else {
    st.textContent = "⚠ Folder exists but isn't a SoeMind Forge studio. Pick another folder or an empty one.";
    st.className = "status err";
  }
  updateNext();
}

$("path-input").oninput = inspectPath;
$("browse-btn").onclick = async () => {
  const picked = await openDialog({ directory: true, title: "Choose the studio folder" });
  if (picked) {
    $("path-input").value = picked;
    inspectPath();
  }
};
$("clone-btn").onclick = async () => {
  const btn = $("clone-btn");
  btn.disabled = true;
  state.running = true;
  updateNext();
  attachLog("clone", $("clone-log"));
  try {
    const code = await invoke("clone_studio", { path: state.path });
    if (code !== 0) $("clone-log").textContent += `\n✗ download failed (exit ${code})`;
  } catch (e) {
    $("clone-log").textContent += "\n" + e;
  }
  btn.disabled = false;
  state.running = false;
  inspectPath();
};

// ---------------------------------------------------------------- step 3: keys

async function loadKeys() {
  const env = await invoke("read_env", { path: state.path });
  if (env.GEMINI_API_KEY) $("key-gemini").value = env.GEMINI_API_KEY;
  if (env.OPENROUTER_API_KEY) $("key-openrouter").value = env.OPENROUTER_API_KEY;
  if (env.RUNPOD_API_KEY) $("key-runpod").value = env.RUNPOD_API_KEY;
  validateKeys();
}
function validateKeys() {
  state.keysOk = $("key-gemini").value.trim().length > 10;
  const st = $("keys-status");
  st.textContent = state.keysOk ? "" : "A Gemini API key is required — everything runs on it.";
  st.className = "status";
  updateNext();
}
$("key-gemini").oninput = validateKeys;

async function saveKeys() {
  try {
    await invoke("write_env", {
      path: state.path,
      keys: {
        GEMINI_API_KEY: $("key-gemini").value.trim(),
        OPENROUTER_API_KEY: $("key-openrouter").value.trim(),
        RUNPOD_API_KEY: $("key-runpod").value.trim(),
      },
    });
    $("keys-status").textContent = "✓ Saved to .env";
    $("keys-status").className = "status ok";
    return true;
  } catch (e) {
    $("keys-status").textContent = "✗ Could not save keys: " + e;
    $("keys-status").className = "status err";
    return false;
  }
}

// ---------------------------------------------------------------- step 4: setup

$("setup-btn").onclick = async () => {
  const btn = $("setup-btn"), st = $("setup-status");
  btn.disabled = true;
  state.running = true;
  updateNext();
  attachLog("setup", $("setup-log"));
  st.textContent = "Installing… this can take a few minutes.";
  st.className = "status";
  try {
    const code = await invoke("run_setup", { path: state.path, tool: state.tool, scope: state.scope });
    state.setupOk = code === 0;
    st.textContent = state.setupOk ? "✓ Installation complete." : `✗ Setup exited with code ${code} — see the log above.`;
    st.className = state.setupOk ? "status ok" : "status err";
  } catch (e) {
    st.textContent = "✗ " + e;
    st.className = "status err";
  }
  btn.disabled = false;
  state.running = false;
  updateNext();
};

// ---------------------------------------------------------------- step 5: doctor

async function runDoctor(pre, st) {
  attachLog("doctor", pre);
  st.textContent = "Running…";
  st.className = "status";
  try {
    const code = await invoke("run_doctor", { path: state.path });
    st.textContent = code === 0 ? "✓ Studio is healthy." : `Doctor reported issues (exit ${code}) — review the log.`;
    st.className = code === 0 ? "status ok" : "status err";
  } catch (e) {
    st.textContent = "✗ " + e;
    st.className = "status err";
  }
}
$("doctor-btn").onclick = () => runDoctor($("doctor-log"), $("doctor-status"));

// ---------------------------------------------------------------- step 6: launch

$("launch-btn").onclick = async () => {
  const st = $("launch-status");
  try {
    await invoke("launch_studio", { path: state.path, tool: state.tool });
    st.textContent = `✓ Opened ${state.tool} in a terminal at the studio folder.`;
    st.className = "status ok";
  } catch (e) {
    st.textContent = "✗ " + e;
    st.className = "status err";
  }
};
$("open-folder-btn").onclick = () => openPath(state.path);
$("edit-keys-btn").onclick = () => show(3);
$("rerun-doctor-btn").onclick = () => show(5);
$("rerun-setup-btn").onclick = () => show(4);

// ---------------------------------------------------------------- boot

(async () => {
  const cfg = await invoke("get_config");
  if (cfg.tool) {
    state.tool = cfg.tool;
    $("tool-select").value = cfg.tool;
  }
  if (cfg.setup_done && cfg.studio_path) {
    state.path = cfg.studio_path;
    $("path-input").value = cfg.studio_path;
    const kind = await invoke("inspect_path", { path: state.path });
    if (kind === "studio") {
      state.pathKind = "studio";
      state.depsOk = state.keysOk = state.setupOk = true;
      show(6);
      return;
    }
  }
  show(0);
})();
