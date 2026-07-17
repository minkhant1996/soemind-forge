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
   apply its fixes before retrying. Special case: a Gemini
   `RESOURCE_EXHAUSTED` / "monthly spending cap" error is an AI Studio
   billing-account cap (key rotation will NOT help) — either the user raises
   the cap at https://ai.studio/billing, or set `GEMINI_USE_VERTEX=true` +
   `GOOGLE_CLOUD_PROJECT=<id>` to bill via Vertex AI instead (needs
   `gcloud auth application-default login`; see AGENT-GUIDE § Provider
   Selection).
7. **Pipeline-first, ALWAYS.** Before generating ANY content (video, image,
   audio, even a single call), author `<content-id>.pipeline.json` IN the
   content folder — nodes = CLI commands, `{{node.data.field}}` refs wire
   outputs to inputs — then execute it with `runPipeline`
   (`workflows/pipelines/README.md`). The folder must let a reviewer map the
   whole piece later: pipeline.json (plan) → pipeline-result.json (execution +
   per-node costs) → prompts.txt (human log) → outputs.
8. **Use the preset libraries — don't improvise prompt language.** Camera
   moves (`cameraMove`, 46), Omni art styles (`artStyle`, 10), product shots
   (`productShot`, 26) are tested presets on the CLI commands. Style is the
   user's call: ASK before picking an art style; PROPOSE camera moves and
   product-shot sets (by channel) for confirmation. Product shots always
   start from a real product photo — never generate the product from text.
9. **Creative text on video: ASK the route.** Offer the user the explicit
   choice — **free** (Remotion `renderTextMotion`, agent-designed overlay) or
   **paid with Gemini Omni** (in-scene baked text, ≈$0.10/sec) — recommend
   free, and never route to Omni silently. If the user picks Omni, CALCULATE
   the job's actual total first (count every ≤10s call the scenes need ×
   ~$0.10/sec, splits and all), state it alongside the budget position, and
   `checkBudget` before the first call. Normal transcript captions need no
   ask — every VO video gets them ($0). Route details:
   `workflows/TEXT-OVERLAY-DESIGN-GUIDE.md` §0-pre + §8.
10. **Content rights, consent & AI ethics — non-negotiable.** This kit is for
    people's OWN brands and lawful, consented work — not for taking, altering, or
    impersonating others' material. Enforce this actively; don't wait to be asked.
    - **Third-party material** (a brand's/competitor's video, image, song, ad, or
      any footage the user did not create): before you edit, dub, re-voice,
      face-swap, restyle, or republish it, **ASK the user to confirm they own it
      or hold written permission to use *and modify* it.** Reselling a physical
      product does **not** grant rights to the brand's marketing videos. If the
      source is clearly stolen or infringing, **decline and explain why.**
    - **Real people — likeness & voice:** never clone a real person's face or
      voice, or put words in their mouth, without their consent. No impersonation
      of real individuals. (The user's own face/voice, or a hired talent's with
      permission, is fine.)
    - **Privacy & personal data:** don't process someone's private images,
      identifiable likeness, or personal data without a lawful basis/consent, and
      never commit third-party personal data into the repo.
    - **No deception:** no fake endorsements, fake reviews/testimonials (see Rule
      5), fake press, or misleading product claims. Disclose AI-generated media
      where a platform or law requires it.
    - **Delivery, not publishing:** the kit produces files for the user; the user
      owns rights-clearance and publishing risk. Doing client work on
      client-supplied material? Advise getting the client's **written warranty of
      rights + indemnity** first.
    This is practical guidance, not legal advice — for high-stakes or cross-border
    work, tell the user to get local legal review.

Skills live in `skills/*/SKILL.md`; campaign playbooks in `workflows/recipes/`;
a filled example project in `examples/demo-brand/`.
