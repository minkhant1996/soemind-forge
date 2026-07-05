@echo off
REM Min AI Content Studio Kit - Windows Setup Script
REM ====================================================
REM Central installer for Claude Code, Hermes, and OpenClaw.
REM Installs the toolkit's skills into the right place for
REM whichever AI CLI you use, then builds the gemini module.

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   Min AI Content Studio Kit - Setup
echo ==========================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "SRC_SKILLS=%SCRIPT_DIR%\skills"

REM ------------------------------------------------------------------
REM Step 0: Choose your AI tool
REM ------------------------------------------------------------------
echo Which AI CLI are you using?
echo   1) Claude Code  (Anthropic)
echo   2) Hermes       (NousResearch)
echo   3) OpenClaw
echo   4) Codex CLI    (OpenAI)
echo   5) Gemini CLI   (Google)
echo.
set /p TOOL_CHOICE="Enter choice [1-5]: "

if "%TOOL_CHOICE%"=="1" (set "TOOL=claude") else (
if "%TOOL_CHOICE%"=="2" (set "TOOL=hermes") else (
if "%TOOL_CHOICE%"=="3" (set "TOOL=openclaw") else (
if "%TOOL_CHOICE%"=="4" (set "TOOL=codex") else (
if "%TOOL_CHOICE%"=="5" (set "TOOL=gemini") else (
    echo [ERROR] Invalid choice. Run the script again and pick 1-5.
    exit /b 1
)))))
echo    [OK] Selected: %TOOL%
echo.

REM ------------------------------------------------------------------
REM Step 1: Choose install scope
REM ------------------------------------------------------------------
echo Install scope?
echo   1) Project  (this toolkit folder only)
echo   2) Global   (your home config - available in any project)
echo.
set /p SCOPE_CHOICE="Enter choice [1-2]: "

if "%SCOPE_CHOICE%"=="1" (set "SCOPE=project") else (
if "%SCOPE_CHOICE%"=="2" (set "SCOPE=global") else (
    echo [ERROR] Invalid choice. Run the script again and pick 1 or 2.
    exit /b 1
))
echo    [OK] Scope: %SCOPE%
echo.

REM Resolve skills destination per tool + scope
set "SKILLS_DEST="

if "%TOOL%"=="claude" (
    if "%SCOPE%"=="project" (
        set "SKILLS_DEST=%SCRIPT_DIR%\.claude\skills"
    ) else (
        set "SKILLS_DEST=%USERPROFILE%\.claude\skills"
    )
)
if "%TOOL%"=="hermes" (
    if "%SCOPE%"=="project" (
        set "SKILLS_DEST=%SCRIPT_DIR%\skills"
    ) else (
        set "SKILLS_DEST=%USERPROFILE%\.hermes\skills"
    )
)
if "%TOOL%"=="openclaw" (
    REM OpenClaw workspace skills live at ^<workspace^>\skills - this repo's
    REM skills\ already IS that dir, so project scope reads them in place.
    if "%SCOPE%"=="project" (
        set "SKILLS_DEST=%SCRIPT_DIR%\skills"
    ) else (
        set "SKILLS_DEST=%USERPROFILE%\.openclaw\skills"
    )
)
if "%TOOL%"=="codex" (
    if "%SCOPE%"=="project" (
        set "SKILLS_DEST=%SCRIPT_DIR%\.agents\skills"
    ) else (
        set "SKILLS_DEST=%USERPROFILE%\.agents\skills"
    )
)
if "%TOOL%"=="gemini" (
    if "%SCOPE%"=="project" (
        set "SKILLS_DEST=%SCRIPT_DIR%\.gemini\skills"
    ) else (
        set "SKILLS_DEST=%USERPROFILE%\.gemini\skills"
    )
)

REM ------------------------------------------------------------------
REM Step 2: Check for .env
REM ------------------------------------------------------------------
echo 1. Checking environment...
if exist "%SCRIPT_DIR%\.env" (
    echo    [OK] .env file found
) else (
    if exist "%SCRIPT_DIR%\.env.example" (
        echo    [!] .env not found. Creating from .env.example...
        copy "%SCRIPT_DIR%\.env.example" "%SCRIPT_DIR%\.env" >nul
        echo    [!] Please edit .env and add your API key(s)
    ) else (
        echo    [ERROR] .env.example not found
    )
)
echo.

REM ------------------------------------------------------------------
REM Step 3: Install npm dependencies + build modules
REM ------------------------------------------------------------------
echo 2. Installing dependencies...

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo    [ERROR] npm not found. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    exit /b 1
)

REM Install root dependencies
call npm install --silent 2>nul
echo    [OK] Root dependencies installed

REM Build gemini module
if exist "%SCRIPT_DIR%\gemini" (
    cd "%SCRIPT_DIR%\gemini"
    call npm install --silent
    echo    [OK] Gemini dependencies installed

    call npm run build 2>nul
    if exist "%SCRIPT_DIR%\gemini\dist" (
        echo    [OK] Gemini module built
    )
    cd "%SCRIPT_DIR%"
) else (
    echo    [ERROR] gemini/ folder not found
    exit /b 1
)

REM Build workflows module
if exist "%SCRIPT_DIR%\workflows" (
    cd "%SCRIPT_DIR%\workflows"
    call npm install --silent
    call npm run build 2>nul
    if exist "%SCRIPT_DIR%\workflows\dist\index.js" (
        echo    [OK] Workflows module built
    ) else (
        echo    [ERROR] Workflows build failed
    )
    cd "%SCRIPT_DIR%"
) else (
    echo    [!] workflows/ folder not found - skipping
)
echo.

REM ------------------------------------------------------------------
REM Step 4: Install skills
REM ------------------------------------------------------------------
echo 3. Installing skills for %TOOL% (%SCOPE%)...

if not exist "%SKILLS_DEST%" mkdir "%SKILLS_DEST%"

REM Install skills
REM In-place case (Hermes/OpenClaw project scope): dest IS the source dir -
REM the skills are read where they live; never copy a folder onto itself.
set SKILL_COUNT=0
if /I "%SKILLS_DEST%"=="%SRC_SKILLS%" (
    for /d %%d in ("%SRC_SKILLS%\*") do (
        if exist "%%d\SKILL.md" set /a SKILL_COUNT+=1
    )
    echo    [OK] %SKILL_COUNT% skills read in place from %SKILLS_DEST%
) else (
    REM The skill files reference the gemini + workflows builds via RELATIVE
    REM paths - climbs of two or more ../ - which only resolve at one specific
    REM install depth, and never for global installs. After copying, rewrite
    REM those climbs to the toolkit's ABSOLUTE path - forward slashes - so
    REM imports work at any depth and scope. Mirrors rewrite_imports in setup.sh:
    REM on any line mentioning gemini or workflows, replace 2+ ../ with the root.
    if exist "%SRC_SKILLS%" (
        for /d %%d in ("%SRC_SKILLS%\*") do (
            if exist "%%d\SKILL.md" (
                set "skill_name=%%~nxd"
                if not exist "%SKILLS_DEST%\!skill_name!" mkdir "%SKILLS_DEST%\!skill_name!"
                xcopy "%%d\*" "%SKILLS_DEST%\!skill_name!\" /E /Y /Q >nul
                powershell -NoProfile -ExecutionPolicy Bypass -Command "$f = '%SKILLS_DEST%\!skill_name!\SKILL.md'; if (Test-Path -LiteralPath $f) { $abs = '%SCRIPT_DIR%' -replace '\\', '/'; $rep = ($abs + '/').Replace('$', '$$'); $out = foreach ($l in [IO.File]::ReadAllLines($f)) { if ($l -match 'gemini|workflows') { $l -replace '(\.\./){2,}', $rep } else { $l } }; [IO.File]::WriteAllLines($f, [string[]]@($out)) }"
                set /a SKILL_COUNT+=1
            )
        )
    )
    echo    [OK] %SKILL_COUNT% skills installed to %SKILLS_DEST%
)


REM Install remotion module (local text rendering)
if exist "%SCRIPT_DIR%\remotion" (
    cd /d "%SCRIPT_DIR%\remotion"
    call npm install --silent 2>nul
    cd /d "%SCRIPT_DIR%"
    echo    OK Remotion module installed
)

echo.

REM ------------------------------------------------------------------
REM Step 5: Create projects folder
REM ------------------------------------------------------------------
echo 4. Creating projects folder...
if not exist "%SCRIPT_DIR%\projects" mkdir "%SCRIPT_DIR%\projects"
echo    [OK] projects/ folder ready
echo.

REM ------------------------------------------------------------------
REM Done
REM ------------------------------------------------------------------
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo.
echo   1. Add your API key(s) to .env
echo      Gemini: https://aistudio.google.com/app/apikey
echo      OpenRouter: https://openrouter.ai/keys
echo.

if "%TOOL%"=="claude" (
    echo   2. Start Claude Code:
    echo      claude
    echo.
    echo   3. Ask naturally, or use slash commands:
    echo      /content-preflight  /generate-video  /generate-image
    echo      /generate-voiceover  /generate-music  /plan-content
    echo      /generate-brand-assets  /content-review  /write-copy
)
if "%TOOL%"=="hermes" (
    if "%SCOPE%"=="project" (
        echo   2. Register this repo's skills with Hermes ^(one-time^):
        echo      add to %%USERPROFILE%%\.hermes\config.yaml:
        echo.
        echo        skills:
        echo          external_dirs:
        echo            - %SCRIPT_DIR%\skills
        echo.
        echo   3. Start Hermes:
        echo      hermes
        echo.
        echo   4. Skills auto-register as slash commands
    ) else (
        echo   2. Start Hermes:
        echo      hermes
        echo.
        echo   3. Skills auto-register as slash commands
    )
)
if "%TOOL%"=="openclaw" (
    echo   2. Start OpenClaw:
    echo      openclaw
)
if "%TOOL%"=="codex" (
    echo   2. Start Codex CLI:
    echo      codex
)
if "%TOOL%"=="gemini" (
    echo   2. Start Gemini CLI:
    echo      gemini
)
echo.
echo Documentation:
echo   - GETTING-STARTED.md - First 10 minutes (new users start here)
echo   - README.md          - Quick start
echo   - USER_GUIDE.md      - Full documentation
echo   - AGENT-GUIDE.md     - Agent context (read first!)
echo   - RULES.md           - Ground rules every AI tool must follow
echo   - workflows/PROMPT-GUIDES-INDEX.md - All prompt guides
echo.

REM Final health check - tells the user exactly what still needs fixing (if anything).
echo Health check:
echo.
node "%~dp0workflows\cli.cjs" doctor
echo.

endlocal
