# SoeMind Forge Desktop

A native installer + launcher for the SoeMind Forge AI content studio, built with
[Tauri 2](https://tauri.app). One app for Windows (`.exe`/`.msi`), macOS (`.dmg`),
and Linux (`.AppImage`/`.deb`).

## What it does

A setup wizard that:

1. **System check** — verifies Node 18+, npm, git, ffmpeg, Python/edge-tts, and your
   AI CLI (Claude Code / Gemini CLI / Codex), with one-click install of the CLI via npm.
2. **Studio folder** — uses an existing SoeMind Forge checkout or downloads the
   toolkit into a folder you pick (`git clone`).
3. **API keys** — collects `GEMINI_API_KEY` (required), `OPENROUTER_API_KEY` and
   `RUNPOD_API_KEY` (optional) into the studio's `.env`.
4. **Install & build** — runs the repo's own `setup.sh` / `setup.bat` (npm installs,
   gemini + workflows builds, Remotion, edge-tts, skill installation) with live log output.
5. **Health check** — runs `node workflows/cli.cjs doctor`.
6. **Launch** — opens your AI CLI in a terminal inside the studio folder. On later
   runs the app boots straight to this screen.

The wizard never re-implements setup logic — it drives `setup.sh`/`setup.bat` and
`cli.cjs doctor`, so the scripts stay the single source of truth.

## Develop

Prereqs: Rust (stable), Node 18+. On Linux additionally:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev librsvg2-dev libayatana-appindicator3-dev libxdo-dev patchelf
```

```bash
cd desktop
npm install        # installs @tauri-apps/cli
npm run dev        # run the app with hot frontend reload
npm run build      # build the installer for THIS platform (see src-tauri/target/release/bundle/)
```

The frontend is plain HTML/CSS/JS in `ui/` (no bundler); the backend commands live in
`src-tauri/src/main.rs`.

## Release installers for all platforms

Cross-compiling Tauri isn't practical — CI builds each OS natively. Push a tag:

```bash
git tag desktop-v0.1.0 && git push origin desktop-v0.1.0
```

`.github/workflows/desktop.yml` builds Windows/macOS/Linux and attaches the installers
to a **draft GitHub release** — review and publish it.

### macOS signing

Unsigned `.dmg` builds work but users must right-click → Open past Gatekeeper. For a
smooth experience add an Apple Developer certificate later via `APPLE_CERTIFICATE`
secrets (see Tauri docs → Distributing → macOS).
