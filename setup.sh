#!/bin/bash

# Min AI Content Studio Kit - Setup Script
# ====================================================
# Central installer for Claude Code, Hermes, and OpenClaw.
# Installs the toolkit's skills into the right place for
# whichever AI CLI you use, then builds the gemini module.

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Get script directory (source of truth for skills/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SRC_SKILLS="$SCRIPT_DIR/skills"

echo ""
echo "=========================================="
echo "  Min AI Content Studio Kit - Setup"
echo "=========================================="
echo ""

# ------------------------------------------------------------------
# Step 0: Choose your AI tool
# ------------------------------------------------------------------
echo -e "${BOLD}Which AI CLI are you using?${NC}"
echo "  1) Claude Code  (Anthropic)"
echo "  2) Hermes       (NousResearch)"
echo "  3) OpenClaw"
echo "  4) Codex CLI    (OpenAI)"
echo "  5) Gemini CLI   (Google)"
echo ""
echo -ne "${BLUE}Enter choice [1-5]: ${NC}"
read -r TOOL_CHOICE

case "$TOOL_CHOICE" in
    1) TOOL="claude" ;;
    2) TOOL="hermes" ;;
    3) TOOL="openclaw" ;;
    4) TOOL="codex" ;;
    5) TOOL="gemini" ;;
    *)
        echo -e "${RED}✗ Invalid choice. Run the script again and pick 1-5.${NC}"
        exit 1
        ;;
esac
echo -e "   ${GREEN}✓${NC} Selected: ${BOLD}$TOOL${NC}"
echo ""

# ------------------------------------------------------------------
# Step 1: Choose install scope
# ------------------------------------------------------------------
echo -e "${BOLD}Install scope?${NC}"
echo "  1) Project  (this toolkit folder only)"
echo "  2) Global   (your home config - available in any project)"
echo ""
echo -ne "${BLUE}Enter choice [1-2]: ${NC}"
read -r SCOPE_CHOICE

case "$SCOPE_CHOICE" in
    1) SCOPE="project" ;;
    2) SCOPE="global" ;;
    *)
        echo -e "${RED}✗ Invalid choice. Run the script again and pick 1 or 2.${NC}"
        exit 1
        ;;
esac
echo -e "   ${GREEN}✓${NC} Scope: ${BOLD}$SCOPE${NC}"
echo ""

# Resolve skills destination per tool + scope.
SKILLS_DEST=""

case "$TOOL" in
    claude)
        if [ "$SCOPE" = "project" ]; then
            SKILLS_DEST="$SCRIPT_DIR/.claude/skills"
        else
            SKILLS_DEST="$HOME/.claude/skills"
        fi
        ;;
    hermes)
        if [ "$SCOPE" = "project" ]; then
            # Hermes has no auto-read project dir: it loads ~/.hermes/skills plus
            # external_dirs from ~/.hermes/config.yaml. Skills stay in place here;
            # we print the config snippet to register this repo's skills/ dir.
            SKILLS_DEST="$SCRIPT_DIR/skills"
        else
            SKILLS_DEST="$HOME/.hermes/skills"
        fi
        ;;
    openclaw)
        if [ "$SCOPE" = "project" ]; then
            # OpenClaw workspace skills live at <workspace>/skills (highest
            # precedence) — this repo's skills/ already IS that dir; no copy.
            SKILLS_DEST="$SCRIPT_DIR/skills"
        else
            SKILLS_DEST="$HOME/.openclaw/skills"
        fi
        ;;
    codex)
        if [ "$SCOPE" = "project" ]; then
            SKILLS_DEST="$SCRIPT_DIR/.agents/skills" # Codex reads ./.agents/skills
        else
            SKILLS_DEST="$HOME/.agents/skills"       # Codex global: ~/.agents/skills
        fi
        ;;
    gemini)
        if [ "$SCOPE" = "project" ]; then
            SKILLS_DEST="$SCRIPT_DIR/.gemini/skills" # Gemini CLI reads ./.gemini/skills
        else
            SKILLS_DEST="$HOME/.gemini/skills"
        fi
        ;;
esac

# ------------------------------------------------------------------
# Step 2: Check for .env
# ------------------------------------------------------------------
echo "1. Checking environment..."
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo -e "   ${GREEN}✓${NC} .env file found"
else
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        echo -e "   ${YELLOW}!${NC} .env not found. Creating from .env.example..."
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        echo -e "   ${YELLOW}!${NC} Please edit .env and add your API key(s) (GEMINI_API_KEY and/or OPENROUTER_API_KEY)"
    else
        echo -e "   ${RED}✗${NC} .env.example not found"
    fi
fi
echo ""

# ------------------------------------------------------------------
# Step 3: Install npm dependencies + build gemini module
# ------------------------------------------------------------------
echo "2. Installing dependencies..."
if command -v npm &> /dev/null; then
    npm install --silent 2>/dev/null || true
    echo -e "   ${GREEN}✓${NC} Root dependencies installed"

    if [ -d "$SCRIPT_DIR/gemini" ]; then
        cd "$SCRIPT_DIR/gemini"
        npm install --silent
        echo -e "   ${GREEN}✓${NC} Gemini dependencies installed"

        npm run build 2>/dev/null || echo -e "   ${YELLOW}!${NC} Build had warnings (optional features)"
        if [ -d "$SCRIPT_DIR/gemini/dist" ]; then
            echo -e "   ${GREEN}✓${NC} Gemini module built"
        fi
        cd "$SCRIPT_DIR"
    else
        echo -e "   ${RED}✗${NC} gemini/ folder not found"
        exit 1
    fi

    # Install and build workflows module (skills import from workflows/dist)
    if [ -d "$SCRIPT_DIR/workflows" ]; then
        cd "$SCRIPT_DIR/workflows"
        npm install --silent
        npm run build 2>/dev/null || echo -e "   ${YELLOW}!${NC} Workflows build had warnings"
        if [ -f "$SCRIPT_DIR/workflows/dist/index.js" ]; then
            echo -e "   ${GREEN}✓${NC} Workflows module built"
        else
            echo -e "   ${RED}✗${NC} Workflows build failed (video/image workflows won't run)"
        fi
        cd "$SCRIPT_DIR"
    else
        echo -e "   ${YELLOW}!${NC} workflows/ folder not found - skipping"
    fi

    # Install remotion module (local $0 text rendering: slides + kinetic reels)
    if [ -d "$SCRIPT_DIR/remotion" ]; then
        cd "$SCRIPT_DIR/remotion"
        npm install --silent 2>/dev/null \
            && echo -e "   ${GREEN}✓${NC} Remotion module installed (renderSlideStill / renderKineticReel)" \
            || echo -e "   ${YELLOW}!${NC} Remotion install had warnings — text rendering may need: cd remotion && npm install"
        cd "$SCRIPT_DIR"
    fi
else
    echo -e "   ${RED}✗${NC} npm not found. Please install Node.js first."
    exit 1
fi
echo ""

# ------------------------------------------------------------------
# Step 4: Install skills
# ------------------------------------------------------------------
echo "3. Installing skills for ${BOLD}$TOOL${NC} ($SCOPE)..."

# The skill files reference the gemini + workflows builds via RELATIVE paths
# (../../../ in skills). Those only resolve at one specific install depth,
# and never for global installs. Rewrite them to the toolkit's ABSOLUTE
# paths so imports work at any depth and any scope.
ABS_ESC=$(printf '%s' "$SCRIPT_DIR" | sed 's/[&#\\]/\\&/g')
rewrite_imports() {
    # On any line mentioning gemini/workflows, replace 2+ "../" climbs with the
    # absolute toolkit root. Temp-file dance instead of sed -i: BSD (macOS) sed
    # would swallow the next flag as a backup suffix and leave "*-E" junk files.
    [ -f "$1" ] || return 0
    sed -E "/gemini|workflows/ s#(\.\./){2,}#${ABS_ESC}/#g" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
}

mkdir -p "$SKILLS_DEST"

# --- Install real skills (skills/<name>/SKILL.md) ---
SKILL_COUNT=0
if [ -d "$SRC_SKILLS" ]; then
    for skill_dir in "$SRC_SKILLS"/*; do
        [ -d "$skill_dir" ] || continue
        [ -f "$skill_dir/SKILL.md" ] || continue
        skill_name=$(basename "$skill_dir")
        # Dest IS the source dir (Hermes/OpenClaw project scope): the skills are
        # read in place. Do NOT copy or rewrite — that would mutate tracked files.
        if [ "$skill_dir" -ef "$SKILLS_DEST/$skill_name" ]; then
            INPLACE=1
            SKILL_COUNT=$((SKILL_COUNT + 1))
            continue
        fi
        mkdir -p "$SKILLS_DEST/$skill_name"
        cp -r "$skill_dir/." "$SKILLS_DEST/$skill_name/"
        rewrite_imports "$SKILLS_DEST/$skill_name/SKILL.md"
        SKILL_COUNT=$((SKILL_COUNT + 1))
    done
fi
echo -e "   ${GREEN}✓${NC} $SKILL_COUNT skills -> $SKILLS_DEST"

if [ "$INPLACE" = "1" ]; then
    echo -e "   ${GREEN}✓${NC} Skills are read in place from $SKILLS_DEST (no copies made)"
fi
echo ""

# ------------------------------------------------------------------
# Step 5: Create projects folder
# ------------------------------------------------------------------
echo "4. Creating projects folder..."
mkdir -p "$SCRIPT_DIR/projects"
echo -e "   ${GREEN}✓${NC} projects/ folder ready"
echo ""

# ------------------------------------------------------------------
# Done - tool-specific next steps
# ------------------------------------------------------------------
echo "=========================================="
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Add your API key(s) to .env"
echo -e "     ${BLUE}Gemini: https://aistudio.google.com/app/apikey${NC}"
echo -e "     ${BLUE}OpenRouter: https://openrouter.ai/keys${NC}"
echo ""

case "$TOOL" in
    claude)
        echo "  2. Start Claude Code:"
        echo -e "     ${GREEN}claude${NC}"
        echo ""
        echo "  3. Ask naturally, or use slash commands:"
        echo "     /content-preflight  /generate-video  /generate-image"
        echo "     /generate-brand-assets  /generate-voiceover  /generate-music"
        echo "     /plan-content  /write-copy  /content-review"
        ;;
    hermes)
        if [ "$SCOPE" = "project" ]; then
            # Read-only check — this script NEVER edits the user's config.yaml.
            if grep -qs "$SCRIPT_DIR/skills" "$HOME/.hermes/config.yaml" 2>/dev/null; then
                echo "  2. This repo's skills dir is already registered in ~/.hermes/config.yaml ✓"
            else
                echo "  2. Register this repo's skills with Hermes (one-time, manual —"
                echo "     we never modify your config.yaml). Add under the existing"
                echo "     'skills:' section (or create it) in ~/.hermes/config.yaml:"
                echo ""
                echo "       skills:"
                echo "         external_dirs:"
                echo "           - $SCRIPT_DIR/skills"
            fi
            echo ""
            echo "  3. Start Hermes:"
            echo -e "     ${GREEN}hermes${NC}"
            echo ""
            echo "  4. Skills auto-register as slash commands"
        else
            echo "  2. Start Hermes:"
            echo -e "     ${GREEN}hermes${NC}"
            echo ""
            echo "  3. Skills in $SKILLS_DEST auto-register as slash commands"
        fi
        ;;
    openclaw)
        echo "  2. Start OpenClaw:"
        echo -e "     ${GREEN}openclaw${NC}"
        echo ""
        echo "  3. Skills in $SKILLS_DEST are auto-discovered"
        ;;
    codex)
        echo "  2. Start Codex CLI:"
        echo -e "     ${GREEN}codex${NC}"
        echo ""
        echo "  3. Skills in $SKILLS_DEST load on demand"
        ;;
    gemini)
        echo "  2. Start Gemini CLI:"
        echo -e "     ${GREEN}gemini${NC}"
        echo ""
        echo "  3. Skills in $SKILLS_DEST are auto-discovered"
        ;;
esac

echo ""
echo "  Documentation:"
echo "     GETTING-STARTED.md     - First 10 minutes (new users start here)"
echo "     README.md              - Quick start"
echo "     USER_GUIDE.md          - Full documentation"
echo "     AGENT-GUIDE.md         - Agent context (read first!)"
echo "     RULES.md               - Ground rules every AI tool must follow"
echo "     workflows/PROMPT-GUIDES-INDEX.md - All prompt guides"
echo ""

# Final health check — tells the user exactly what still needs fixing (if anything).
echo "  Health check:"
echo ""
node "$SCRIPT_DIR/workflows/cli.cjs" doctor || true
echo ""
if [ "$SCOPE" = "global" ]; then
    echo -e "  ${YELLOW}Note:${NC} Run your AI CLI from this toolkit folder"
    echo "  (${SCRIPT_DIR}) so import paths resolve correctly."
    echo ""
fi
