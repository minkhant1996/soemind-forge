# Ground Rules — for EVERY AI tool working in this repo

> Binding rules for any AI agent (Claude Code, Codex CLI, Gemini CLI, Cursor, …)
> generating content with this kit. Read [AGENT-GUIDE.md](./AGENT-GUIDE.md) for
> the full project context; these rules override default agent behavior.

1. **Workflows are CLI commands — call them, never re-implement them.**
   `node workflows/cli.cjs <command> '<json-args>'` · `list` shows all commands ·
   argument shapes are in `workflows/WORKFLOWS.md`. Do NOT write `.cjs`/`.ts`
   scripts that import from `workflows/dist/` — that's the anti-pattern the CLI
   exists to remove.
2. **Run the content-preflight skill before any plan or generation** — it
   resolves the project, brand, assets (characters/products/logos/voices), and
   budget. New user with no project? Start with the onboard-brand skill.
3. **Money moves only with consent.** State the estimated cost before any
   generation and `checkBudget` first. The CLI **enforces** the cap (paid
   commands hard-stop at `BUDGET_EXCEEDED`) and **auto-records** every real
   cost to the project ledger — call `recordCost` manually only for spend made
   outside the CLI. Preview cheap before rendering expensive (preview-pick skill).
4. **Consistency comes from the asset registry** (`projects/{name}/config/assets.yaml`).
   Reuse locked assets by id; never re-describe a registered character/product.
5. **Never fake social proof** — testimonials, stats, and press must come from
   the user, verbatim.
5b. **Every content folder gets a `prompts.txt`** — image prompt(s), video
   prompt(s), and script/VO text (with tags), written when generating, including
   retries with a one-line RESULT note. The manifest is the machine log;
   prompts.txt is the human one. No exceptions.
6. If anything errors unexpectedly, run `node workflows/cli.cjs doctor` and
   apply its fixes before retrying.
7. **Pipeline-first, ALWAYS.** Before generating ANY content (video, image,
   audio, even a single call), author `<content-id>.pipeline.json` IN the
   content folder — nodes = CLI commands, `{{node.data.field}}` refs wire
   outputs to inputs — then execute it with `runPipeline`
   (`workflows/pipelines/README.md`). The folder must let a reviewer map the
   whole piece later: pipeline.json (plan) → pipeline-result.json (execution +
   per-node costs) → prompts.txt (human log) → outputs.

Skills live in `skills/*/SKILL.md`; campaign playbooks in `workflows/recipes/`;
a filled example project in `examples/demo-brand/`.
