# SoeMind Forge — agent entry point

**READ THESE TWO FILES BEFORE DOING ANYTHING** (they are the actual instructions;
this file is only the pointer for tools that don't auto-load CLAUDE.md):

1. [RULES.md](./RULES.md) — 9 binding ground rules (CLI-only workflows, preflight,
   money-with-consent, asset registry, no fake social proof, prompts.txt,
   pipeline-first, preset libraries, creative-text route ask).
2. [AGENT-GUIDE.md](./AGENT-GUIDE.md) — full project context, what to read per
   request type, provider selection, costs.

Non-negotiables even if you read nothing else:

- **Workflows are CLI commands**: `node workflows/cli.cjs <command> '<json>'`.
  Never write scripts that import from `workflows/dist/`.
- **Money moves only with consent** — state estimated cost + `checkBudget`
  before any paid generation. Text rendering with Remotion is $0; Gemini Omni
  is PAID (≈$0.10/sec): ASK the user "free creative (Remotion) or paid (Omni)?",
  and if Omni, CALCULATE the job's total (every ≤10s call × ~$0.10/sec) and
  show it before running.
- **Every content folder gets** pipeline.json + prompts.txt + manifest entries.
- On errors: `node workflows/cli.cjs doctor` first, then retry.
