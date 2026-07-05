# Agent Skills

> Loadable skill definitions that activate based on user intent.
> Skills are for **GENERATING** content. For **PLANNING** content, see `templates/README.md`.

---

## Before Using Any Skill

**ALWAYS check if project exists first:**

```
1. Does projects/{project-name}/ exist?
   YES → Read project.md and brand.md for context
   NO  → Ask user: Create project first? (See templates/README.md)

2. Is there a content plan for this piece?
   YES → Read the content plan (content-plans/day-XX/content-XX.md)
   NO  → Generate from scratch (ask user all required questions)

3. Load the appropriate skill below
```

---

## How Skills Work

Skills are loaded **conditionally** when a task matches the skill's description.

```
User: "Create a TikTok video for my product"

Agent reads AGENT-GUIDE.md
  → Sees skill trigger: "create video", "TikTok"
  → Checks if project exists (projects/{name}/)
  → Reads project.md + brand.md for context
  → Loads skills/generate-video/SKILL.md
  → Follows decision tree
  → Asks user questions (or uses content plan)
  → Generates content
```

## Available Skills

19 skills live in the repo-root [`skills/`](../skills/) directory (one folder per
skill, each containing a `SKILL.md`):

| Category | Skills |
|----------|--------|
| Setup & planning | `onboard-brand`, `plan-content`, `content-preflight` |
| Generation | `generate-video`, `generate-image`, `generate-voiceover`, `generate-music`, `generate-brand-assets` |
| Writing | `write-copy` |
| Review & QA | `content-review`, `qa-review`, `preview-pick` |
| Budget | `cost-guard` |
| Production & publishing | `produce-content`, `package-content`, `repurpose-content`, `revise-content`, `localize-content` |
| Extending the kit | `create-workflow` |

Trigger phrases and slash commands for every skill are listed in
[AGENT-GUIDE.md](../AGENT-GUIDE.md) (§ Available Skills) and
[`skills/README.md`](../skills/README.md).

## Skill Structure

Each skill folder contains:

```
skills/
├── content-preflight/
│   └── SKILL.md       # Main skill definition
├── generate-video/
│   └── SKILL.md
├── generate-image/
│   └── SKILL.md
├── …                  # one folder per skill (19 total)
└── write-copy/
    └── SKILL.md
```

## SKILL.md Format

```yaml
---
name: skill-name
description: |
  When to activate this skill. Include trigger phrases
  that users commonly say.
license: MIT
allowed-tools:
  - tool1
  - tool2
---

# Skill Title

## When This Skill Activates
[Trigger conditions]

## STEP 1: Ask [First Question]
[Question and options]

## STEP 2: Ask [Next Question]
[Question and options]

## STEP N: Generate
[Generation code and settings]
```

## How Agents Should Use Skills

1. **Read AGENT-GUIDE.md first** - Get project context
2. **Match user intent to skill** - Check trigger phrases
3. **Load relevant SKILL.md** - Read the full skill file
4. **Follow the steps** - Ask questions in order
5. **Apply presets** - Use the decision tree results
6. **Confirm before generating** - Show plan and cost
7. **Execute** - Generate the content

## Extending Skills

To add a new skill:

1. Create folder: `skills/your-skill/`
2. Create `SKILL.md` with YAML frontmatter
3. Define trigger phrases in description
4. Add decision tree (questions → settings)
5. Update `AGENT-GUIDE.md` with new skill reference

## Creating a Custom Workflow Function

The `.md` skills above describe *what the agent asks*; the actual generation is done by
pre-built **workflow functions** in [`index.ts`](./index.ts). To add your own reusable,
agent-callable function (typed input → `WorkflowResult`, with retry, file saving, and cost
built in), follow [CREATING_WORKFLOWS.md](./CREATING_WORKFLOWS.md).

## Reference

- [Creating a Custom Workflow](./CREATING_WORKFLOWS.md)
- [SKILL.md Format](https://www.thepromptindex.com/how-to-use-ai-agent-skills-the-complete-guide.html)
- [Agent Skills - Anthropic](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
