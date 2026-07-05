# Getting Started — Your First 10 Minutes

From zero to your first AI-generated image, for about **7 cents**. No coding
required — you'll type a few terminal commands, then talk to an AI agent in
plain English.

## Minute 0–2: Get an API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) (free
   Google account is enough)
2. Click **Create API key** and copy it

This key is how you pay for generations — costs are per-item (a thumbnail is
about $0.07). Nothing runs, nothing spends, until you ask for it.

## Minute 2–5: Set up the kit

You need [Node.js 18+](https://nodejs.org) and one AI agent CLI installed —
[Claude Code](https://claude.com/claude-code), Codex CLI, Gemini CLI, Hermes,
or OpenClaw.

```bash
git clone https://github.com/minkhant1996/min-ai-content-studio-kit.git
cd min-ai-content-studio-kit
./setup.sh        # Windows: setup.bat
```

The script asks which AI tool you use, installs the skills for it, builds the
kit, and ends with a health check. When it asks about API keys, paste yours —
or add it manually:

```bash
cp .env.example .env
# open .env and set: GEMINI_API_KEY=your-key-here
```

Verify everything is green:

```bash
node workflows/cli.cjs doctor
```

Every line should be ✅ (the OpenRouter warning is fine — that key is optional).

## Minute 5–6: Try the demo brand

The kit works per-project: each project holds a brand guide, a campaign brief,
and a registry of reusable assets. Start with the built-in fictional coffee
brand so you can generate immediately:

```bash
mkdir -p projects
cp -r examples/demo-brand projects/demo-brand
```

(Skim `projects/demo-brand/templates/brand.md` — this is the kind of context
the agent uses to keep everything on-brand.)

## Minute 6–10: Generate your first image

Start your AI agent **from the kit folder**:

```bash
claude        # or: codex, gemini, hermes, openclaw
```

Then say (Claude Code loads the kit's context automatically; on other tools,
start with "Read AGENT-GUIDE.md first, then …"):

```
Using the demo-brand project, create one Instagram feed image (4:5)
announcing the new Ethiopia Yirgacheffe roast. Keep it under $0.10.
```

The agent will run its pre-flight check, write an on-brand prompt, ask you to
confirm, generate the image, and tell you what it cost. Your image lands under
`projects/demo-brand/output-contents/`.

**That's it.** You've seen the whole loop: project context → confirmation →
generation → cost tracking.

## Next: make it yours

Tell the agent:

```
Onboard my brand.
```

It interviews you (name, audience, colors, tone, budget — about 5 minutes) and
builds your real project. From there, useful things to try:

| Say | Get |
|-----|-----|
| "Generate my brand assets" | Logo, profile pics, covers for every platform |
| "Plan 30 days of content for Instagram" | A content calendar |
| "Create a 15-second TikTok ad" | Storyboard → your approval → video |
| "How much have I spent?" | Budget summary for the project |

**Costs to expect:** images ≈ $0.07 · 30s voiceover ≈ $0.01 · 30s music ≈
$0.04 · videos ≈ $0.08–0.20 per second. The agent asks before anything
expensive, and your per-project budget cap stops overspending.

More depth: [USER_GUIDE.md](./USER_GUIDE.md) · platform specs and prompt
guides in [`workflows/`](./workflows/PROMPT-GUIDES-INDEX.md)
