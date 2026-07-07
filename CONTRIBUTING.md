# Contributing to SoeMind Forge

Thanks for your interest in improving the kit! Contributions of all kinds are
welcome — new workflows, skills, prompt guides, provider integrations, docs
fixes, and bug reports.

## Ways to contribute

| You want to… | Start here |
|---|---|
| Report a bug or request a feature | [Open an issue](https://github.com/minkhant1996/soemind-forge/issues) |
| Add or improve a **workflow** (generation function) | [`workflows/CREATING_WORKFLOWS.md`](workflows/CREATING_WORKFLOWS.md) |
| Share a **campaign recipe** (easiest contribution — just markdown) | [`workflows/recipes/README.md`](workflows/recipes/README.md) |
| Add or improve a **skill** (agent slash command) | [`skills/README.md`](skills/README.md) and existing `skills/*/SKILL.md` |
| Improve **prompt guides** (thumbnail/image/video prompting) | `workflows/*-GUIDE.md` + [`workflows/PROMPT-GUIDES-INDEX.md`](workflows/PROMPT-GUIDES-INDEX.md) |
| Add a **provider** (new AI API) | Model it on `gemini/` or `openrouter/` — see below |
| Update **model pricing** | `gemini/pricing.json`, `openrouter/pricing.json` |

## Dev setup

```bash
git clone https://github.com/minkhant1996/soemind-forge.git
cd soemind-forge
npm install
cd gemini && npm install && cd ..
cd workflows && npm install && npm run build && cd ..
cp .env.example .env   # add your own API keys — never commit them
```

Node.js >= 18 is required.

## Contributing a workflow

Workflows are the heart of the kit. Read
[`workflows/CREATING_WORKFLOWS.md`](workflows/CREATING_WORKFLOWS.md) — it
documents the `WorkflowResult<T>` contract, validation, retry, file-saving,
and cost-reporting conventions every workflow must follow. In short:

1. Add your function to `workflows/` following the contract.
2. Register the command in `workflows/cli.cjs` (`COMMANDS`) so agents can call
   it without writing scripts.
3. Document the argument shape in `workflows/WORKFLOWS.md`.
4. Run `npm run build` in `workflows/` and test via
   `node workflows/cli.cjs <yourCommand> '<json>'`.

## Contributing a skill

Skills are markdown instructions (`skills/<name>/SKILL.md`) with YAML
frontmatter (`name`, `description`, `allowed-tools`). They should:

- Call existing workflows via `node workflows/cli.cjs …` — never instruct the
  agent to author new scripts.
- Include an explicit checklist if user confirmation or asset resolution is
  needed before spending money (see `skills/generate-video/SKILL.md` for the
  pattern).
- Work on any supported AI CLI (Claude Code, Codex CLI, Gemini CLI, Hermes,
  OpenClaw) — `setup.sh` installs them for each tool.

## Contributing a provider

Model a new provider directory on `gemini/` or `openrouter/`:

- `types.ts`, `<name>-provider.ts`, `cost-calculator.ts`, `pricing.json`, `index.ts`
- Every API call must report cost via the pricing data so the budget
  ledger (`workflows/cost-tracker.ts`) stays accurate.
- API keys come from the root `.env` only — document the variable in
  `.env.example`.

## Ground rules

- **Never commit secrets or personal data.** `.env`, `projects/`, and
  generated media are gitignored — keep it that way.
- **Cost safety first.** Anything that spends API credits must report its cost
  and respect the project budget cap.
- **Keep it agent-callable.** Users drive this kit through AI agents; every
  feature should be reachable via a CLI command or skill, not just a library
  import.
- Match the style of surrounding code and docs.

## Pull requests

1. Fork, create a branch, make your change.
2. Ensure `workflows/` still builds (`npm run build`) and tests that don't
   require API keys pass (`npm test` in `gemini/` skips paid calls when keys
   are absent).
3. Open a PR describing **what** and **why**. Screenshots or sample outputs
   are great for generation-related changes (link them — media files are
   gitignored by design).
