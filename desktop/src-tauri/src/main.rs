// SoeMind Forge Desktop — installer + launcher for the AI content studio.
// The wizard mirrors setup.sh: system check → studio location → API keys →
// install/build (delegates to setup.sh / setup.bat) → doctor → launch AI CLI.

#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Emitter;

const REPO_URL: &str = "https://github.com/minkhant1996/soemind-forge.git";

// ---------------------------------------------------------------- process helpers

/// PATH augmented with common tool locations that GUI apps don't inherit
/// (nvm node, homebrew, pip --user, cargo).
fn augmented_path() -> String {
    let mut parts: Vec<String> = std::env::var("PATH")
        .unwrap_or_default()
        .split(if cfg!(windows) { ';' } else { ':' })
        .map(|s| s.to_string())
        .collect();
    let home = dirs::home_dir().unwrap_or_default();
    let mut extra: Vec<PathBuf> = vec![
        home.join(".local/bin"),
        home.join(".cargo/bin"),
        PathBuf::from("/usr/local/bin"),
        PathBuf::from("/opt/homebrew/bin"),
    ];
    // nvm: add every installed node version's bin (newest first wins nothing —
    // any node >= 18 satisfies us; the check reports the version it finds).
    let nvm = home.join(".nvm/versions/node");
    if let Ok(entries) = fs::read_dir(&nvm) {
        let mut vers: Vec<PathBuf> = entries.flatten().map(|e| e.path().join("bin")).collect();
        vers.sort();
        vers.reverse();
        extra.extend(vers);
    }
    for p in extra {
        if p.is_dir() {
            parts.push(p.to_string_lossy().to_string());
        }
    }
    parts.join(if cfg!(windows) { ";" } else { ":" })
}

/// Build a shell command with the augmented PATH.
fn shell(line: &str, cwd: Option<&Path>) -> Command {
    let mut cmd = if cfg!(windows) {
        let mut c = Command::new("cmd");
        c.args(["/C", line]);
        c
    } else {
        let mut c = Command::new("bash");
        c.args(["-c", line]);
        c
    };
    cmd.env("PATH", augmented_path());
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    cmd
}

/// Run a command line, return trimmed stdout on exit 0.
fn capture(line: &str) -> Option<String> {
    let out = shell(line, None).output().ok()?;
    if out.status.success() {
        let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
        Some(if s.is_empty() {
            String::from_utf8_lossy(&out.stderr).trim().to_string()
        } else {
            s
        })
    } else {
        None
    }
}

/// Run a command line streaming stdout+stderr lines to the frontend as
/// `wizard-log` events tagged with `step`. Returns the exit code.
fn stream(window: &tauri::Window, step: &str, line: &str, cwd: Option<&Path>) -> Result<i32, String> {
    let mut cmd = shell(line, cwd);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).stdin(Stdio::piped());
    let mut child = cmd.spawn().map_err(|e| format!("failed to start `{line}`: {e}"))?;
    // Nothing should ever prompt; close stdin so a stray prompt fails fast.
    drop(child.stdin.take());

    let emit = |w: &tauri::Window, step: &str, text: String| {
        let _ = w.emit("wizard-log", serde_json::json!({ "step": step, "line": text }));
    };
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let (w1, s1) = (window.clone(), step.to_string());
    let t1 = std::thread::spawn(move || {
        for l in BufReader::new(stdout).lines().flatten() {
            emit(&w1, &s1, l);
        }
    });
    let (w2, s2) = (window.clone(), step.to_string());
    let t2 = std::thread::spawn(move || {
        for l in BufReader::new(stderr).lines().flatten() {
            emit(&w2, &s2, l);
        }
    });
    let status = child.wait().map_err(|e| e.to_string())?;
    let _ = t1.join();
    let _ = t2.join();
    Ok(status.code().unwrap_or(-1))
}

// ---------------------------------------------------------------- dependency check

#[derive(Serialize)]
struct Dep {
    id: String,
    name: String,
    found: bool,
    version: String,
    required: bool,
    hint: String,
}

fn dep(id: &str, name: &str, required: bool, probe: &str, hint: &str) -> Dep {
    let v = capture(probe);
    Dep {
        id: id.into(),
        name: name.into(),
        found: v.is_some(),
        version: v.unwrap_or_default().lines().next().unwrap_or("").to_string(),
        required,
        hint: hint.into(),
    }
}

#[tauri::command]
fn check_deps() -> Vec<Dep> {
    let mut deps = vec![
        dep("node", "Node.js 18+", true, "node -v", "Install from https://nodejs.org"),
        dep("npm", "npm", true, "npm -v", "Ships with Node.js"),
        dep("git", "Git", true, "git --version", "https://git-scm.com/downloads"),
        dep(
            "ffmpeg",
            "ffmpeg + ffprobe",
            true,
            "ffmpeg -version && ffprobe -version",
            if cfg!(target_os = "macos") { "brew install ffmpeg" } else if cfg!(windows) { "winget install ffmpeg" } else { "sudo apt install ffmpeg" },
        ),
        dep(
            "python3",
            "Python 3",
            false,
            if cfg!(windows) { "python --version" } else { "python3 --version" },
            "Needed only for free Edge TTS voiceover",
        ),
        dep(
            "edge-tts",
            "edge-tts (free voiceover)",
            false,
            if cfg!(windows) { "python -c \"import edge_tts; print('ok')\"" } else { "python3 -c \"import edge_tts; print('ok')\"" },
            "pip install edge-tts (the installer will try this for you)",
        ),
        dep("claude", "Claude Code CLI", false, "claude --version", "npm install -g @anthropic-ai/claude-code"),
        dep("gemini", "Gemini CLI", false, "gemini --version", "npm install -g @google/gemini-cli"),
        dep("codex", "Codex CLI", false, "codex --version", "npm install -g @openai/codex"),
    ];
    // Node found but too old counts as missing.
    if let Some(n) = deps.iter_mut().find(|d| d.id == "node") {
        if n.found {
            let major: i32 = n
                .version
                .trim_start_matches('v')
                .split('.')
                .next()
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
            if major < 18 {
                n.found = false;
                n.hint = format!("{} is too old — need 18+. {}", n.version, n.hint);
            }
        }
    }
    deps
}

// ---------------------------------------------------------------- config (remember studio path)

fn config_file() -> PathBuf {
    let dir = dirs::config_dir().unwrap_or_default().join("soemind-forge");
    let _ = fs::create_dir_all(&dir);
    dir.join("desktop.json")
}

#[derive(Serialize, Deserialize, Default)]
struct AppConfig {
    studio_path: Option<String>,
    tool: Option<String>,
    setup_done: Option<bool>,
}

#[tauri::command]
fn get_config() -> AppConfig {
    fs::read_to_string(config_file())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

#[tauri::command]
fn save_config(config: AppConfig) -> Result<(), String> {
    fs::write(config_file(), serde_json::to_string_pretty(&config).unwrap()).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------- studio location

#[tauri::command]
fn default_studio_path() -> String {
    dirs::home_dir()
        .unwrap_or_default()
        .join("SoeMindForge")
        .to_string_lossy()
        .to_string()
}

/// "studio" (valid toolkit), "empty" (safe to clone into), "occupied" (exists, not the toolkit)
#[tauri::command]
fn inspect_path(path: String) -> String {
    let p = PathBuf::from(&path);
    if p.join("workflows").join("cli.cjs").is_file() {
        "studio".into()
    } else if !p.exists() || fs::read_dir(&p).map(|mut d| d.next().is_none()).unwrap_or(false) {
        "empty".into()
    } else {
        "occupied".into()
    }
}

#[tauri::command]
fn clone_studio(window: tauri::Window, path: String) -> Result<i32, String> {
    stream(&window, "clone", &format!("git clone --depth 1 {} \"{}\"", REPO_URL, path), None)
}

// ---------------------------------------------------------------- .env

#[tauri::command]
fn read_env(path: String) -> std::collections::HashMap<String, String> {
    let mut map = std::collections::HashMap::new();
    if let Ok(text) = fs::read_to_string(PathBuf::from(path).join(".env")) {
        for line in text.lines() {
            let line = line.trim();
            if line.starts_with('#') || line.is_empty() {
                continue;
            }
            if let Some((k, v)) = line.split_once('=') {
                map.insert(k.trim().to_string(), v.trim().trim_matches('"').to_string());
            }
        }
    }
    map
}

#[tauri::command]
fn write_env(path: String, keys: std::collections::HashMap<String, String>) -> Result<(), String> {
    let env_path = PathBuf::from(&path).join(".env");
    let existing = fs::read_to_string(&env_path).unwrap_or_default();
    let mut lines: Vec<String> = existing.lines().map(|s| s.to_string()).collect();
    for (k, v) in &keys {
        if v.trim().is_empty() {
            continue;
        }
        let mut replaced = false;
        for line in lines.iter_mut() {
            let t = line.trim_start();
            if t.starts_with(&format!("{k}=")) || t.starts_with(&format!("# {k}=")) || t.starts_with(&format!("#{k}=")) {
                *line = format!("{k}={v}");
                replaced = true;
                break;
            }
        }
        if !replaced {
            lines.push(format!("{k}={v}"));
        }
    }
    let mut out = lines.join("\n");
    if !out.ends_with('\n') {
        out.push('\n');
    }
    fs::write(&env_path, out).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------- setup / doctor

/// Delegates to the repo's own setup script (single source of truth for
/// builds + skill installs), answering its two prompts over stdin.
#[tauri::command]
fn run_setup(window: tauri::Window, path: String, tool: String, scope: String) -> Result<i32, String> {
    let tool_answer = match tool.as_str() {
        "claude" => "1",
        "hermes" => "2",
        "openclaw" => "3",
        "codex" => "4",
        "gemini" => "5",
        _ => "1",
    };
    let scope_answer = if scope == "global" { "2" } else { "1" };
    let p = PathBuf::from(&path);
    let line = if cfg!(windows) {
        format!("(echo {tool_answer}& echo {scope_answer}) | setup.bat")
    } else {
        format!("printf '{tool_answer}\\n{scope_answer}\\n' | bash setup.sh")
    };
    stream(&window, "setup", &line, Some(&p))
}

#[tauri::command]
fn run_doctor(window: tauri::Window, path: String) -> Result<i32, String> {
    stream(&window, "doctor", "node workflows/cli.cjs doctor", Some(&PathBuf::from(path)))
}

// ---------------------------------------------------------------- launch

/// Open the user's AI CLI in a real terminal at the studio folder.
#[tauri::command]
fn launch_studio(path: String, tool: String) -> Result<(), String> {
    let cli = match tool.as_str() {
        "gemini" => "gemini",
        "codex" => "codex",
        "hermes" => "hermes",
        "openclaw" => "openclaw",
        _ => "claude",
    };
    #[cfg(target_os = "windows")]
    {
        shell(&format!("start \"SoeMind Forge\" cmd /K \"cd /d \"{path}\" && {cli}\""), None)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        let script = format!("tell application \"Terminal\" to do script \"cd '{path}' && {cli}\"\ntell application \"Terminal\" to activate");
        Command::new("osascript")
            .args(["-e", &script])
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let inner = format!("cd '{path}' && {cli}; exec bash");
        let attempts: Vec<Vec<String>> = vec![
            vec!["gnome-terminal".into(), "--working-directory".into(), path.clone(), "--".into(), "bash".into(), "-lc".into(), inner.clone()],
            vec!["konsole".into(), "--workdir".into(), path.clone(), "-e".into(), "bash".into(), "-lc".into(), inner.clone()],
            vec!["xfce4-terminal".into(), "--working-directory".into(), path.clone(), "-e".into(), format!("bash -lc \"{inner}\"")],
            vec!["x-terminal-emulator".into(), "-e".into(), format!("bash -lc \"{inner}\"")],
            vec!["xterm".into(), "-e".into(), format!("bash -lc \"{inner}\"")],
        ];
        for a in attempts {
            let mut c = Command::new(&a[0]);
            c.args(&a[1..]).env("PATH", augmented_path());
            if c.spawn().is_ok() {
                return Ok(());
            }
        }
        Err("No terminal emulator found (tried gnome-terminal, konsole, xfce4-terminal, x-terminal-emulator, xterm)".into())
    }
}

/// One-click install of missing system tools. Elevation is requested through
/// the OS's own dialog (polkit on Linux, UAC via winget on Windows, brew —
/// no admin needed — on macOS), so the app never sees the user's password.
#[tauri::command]
fn install_system_deps(window: tauri::Window, ids: Vec<String>) -> Result<i32, String> {
    let want = |id: &str| ids.iter().any(|i| i == id);
    #[cfg(target_os = "linux")]
    {
        let mut pkgs: Vec<&str> = vec![];
        if want("node") {
            pkgs.extend(["nodejs", "npm"]);
        }
        if want("git") {
            pkgs.push("git");
        }
        if want("ffmpeg") {
            pkgs.push("ffmpeg");
        }
        if want("python3") {
            pkgs.extend(["python3", "python3-pip"]);
        }
        let mut code = 0;
        if !pkgs.is_empty() {
            let (mgr, args) = if capture("command -v apt-get").is_some() {
                ("apt-get", "install -y")
            } else if capture("command -v dnf").is_some() {
                ("dnf", "install -y")
            } else if capture("command -v pacman").is_some() {
                ("pacman", "-S --noconfirm")
            } else {
                return Err("No supported package manager found (apt/dnf/pacman)".into());
            };
            // pkexec pops the system password dialog; the app never sees the password.
            code = stream(
                &window,
                "sysdeps",
                &format!("pkexec {mgr} {args} {}", pkgs.join(" ")),
                None,
            )?;
        }
        if code == 0 && want("edge-tts") {
            code = stream(&window, "sysdeps", "python3 -m pip install --user edge-tts || python3 -m pip install --user --break-system-packages edge-tts", None)?;
        }
        return Ok(code);
    }
    #[cfg(target_os = "macos")]
    {
        if capture("command -v brew").is_none() {
            return Err("Homebrew not found — install it from https://brew.sh first, then re-check.".into());
        }
        let mut brews: Vec<&str> = vec![];
        if want("node") {
            brews.push("node");
        }
        if want("git") {
            brews.push("git");
        }
        if want("ffmpeg") {
            brews.push("ffmpeg");
        }
        if want("python3") {
            brews.push("python3");
        }
        let mut code = 0;
        if !brews.is_empty() {
            code = stream(&window, "sysdeps", &format!("brew install {}", brews.join(" ")), None)?;
        }
        if code == 0 && want("edge-tts") {
            code = stream(&window, "sysdeps", "python3 -m pip install --user edge-tts", None)?;
        }
        return Ok(code);
    }
    #[cfg(target_os = "windows")]
    {
        // winget shows the UAC prompt itself when elevation is needed.
        let mut code = 0;
        let winget = "winget install --accept-source-agreements --accept-package-agreements -e --id";
        for (id, pkg) in [
            ("node", "OpenJS.NodeJS.LTS"),
            ("git", "Git.Git"),
            ("ffmpeg", "Gyan.FFmpeg"),
            ("python3", "Python.Python.3.12"),
        ] {
            if want(id) && code == 0 {
                code = stream(&window, "sysdeps", &format!("{winget} {pkg}"), None)?;
            }
        }
        if code == 0 && want("edge-tts") {
            code = stream(&window, "sysdeps", "python -m pip install --user edge-tts", None)?;
        }
        return Ok(code);
    }
}

#[tauri::command]
fn install_cli(window: tauri::Window, tool: String) -> Result<i32, String> {
    let pkg = match tool.as_str() {
        "gemini" => "@google/gemini-cli",
        "codex" => "@openai/codex",
        _ => "@anthropic-ai/claude-code",
    };
    stream(&window, "cli-install", &format!("npm install -g {pkg}"), None)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_deps,
            get_config,
            save_config,
            default_studio_path,
            inspect_path,
            clone_studio,
            read_env,
            write_env,
            run_setup,
            run_doctor,
            launch_studio,
            install_cli,
            install_system_deps
        ])
        .run(tauri::generate_context!())
        .expect("error while running SoeMind Forge Desktop");
}
