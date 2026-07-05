# Templates

> Master templates for agent to copy when creating new projects.
> These files contain NO real data - only structure and guidance.

---

## Agent Quick Reference

**When to read this file:** User asks for new project, campaign, or content plan.

### Reading Order for Content Planning

```
1. This file (templates/README.md) ← You are here
2. project.template.md → Understand business/audience fields
3. brand.template.md → Understand visual identity fields
4. content-calendar.template.md → Understand calendar structure
5. Content type templates (as needed):
   - video-content.template.md
   - carousel-content.template.md
   - image-content.template.md
   - text-content.template.md
   - audio-slides-content.template.md
```

### Agent Workflow Summary

```
Step 1: Create Project Folder
  → projects/{project-name}/templates/
  → projects/{project-name}/content-plans/
  → projects/{project-name}/style-samples/
  → projects/{project-name}/output-contents/

Step 2: Copy & Fill Project Templates
  → Copy project.template.md → projects/{name}/templates/project.md
  → Copy brand.template.md → projects/{name}/templates/brand.md
  → ASK user for missing required fields
  → SUGGEST options where allowed (see template comments)
  → NEVER fake testimonials/stats

Step 3: Create Content Calendar
  → Copy content-calendar.template.md
  → Plan 30 days with 1-5 contents per day
  → Confirm with user

Step 4: Create Individual Content Plans
  → For each content piece, copy the matching template
  → Fill all generation requirements (hook, body, style, etc.)
  → Output path: content-plans/day-XX/content-XX-{type}.md

Step 5: Generate (separate workflow)
  → Read skills/*.md for generation
  → Output to: output-contents/day-XX/content-XX/
```

---

## Available Templates

### Project Setup Templates

| Template | Purpose | Copy To |
|----------|---------|---------|
| `project.template.md` | Business, audience, offer, requirements | `projects/{name}/templates/project.md` |
| `brand.template.md` | Visual identity, colors, tone, style | `projects/{name}/templates/brand.md` |
| `assets.config.template.yaml` | Reusable asset registry (characters, products, logos, voices…) | `projects/{name}/config/assets.yaml` |
| `style-samples-README.md` | Guide for adding style references | `projects/{name}/style-samples/README.md` |

> **Before planning, read [`content-requirements.md`](./content-requirements.md)** — the
> matrix of what each kind of content requires (topic type × visual mode), the
> provide-vs-generate flow for assets, and the edge-case checklist. The
> [`content-preflight`](../skills/content-preflight/SKILL.md) skill executes it.

### Content Planning Templates

| Template | Purpose | Copy To |
|----------|---------|---------|
| `content-calendar.template.md` | 30-day content schedule overview | `projects/{name}/content-plans/calendar.md` |

### Content Type Templates (one per content piece)

| Template | Purpose | Copy To |
|----------|---------|---------|
| `video-content.template.md` | Full video plan (hook, scenes, dialogue, thumbnail) | `projects/{name}/content-plans/day-XX/content-XX-video.md` |
| `carousel-content.template.md` | Multi-image carousel plan | `projects/{name}/content-plans/day-XX/content-XX-carousel.md` |
| `image-content.template.md` | Single image post plan | `projects/{name}/content-plans/day-XX/content-XX-image.md` |
| `text-content.template.md` | Text-only post/thread plan | `projects/{name}/content-plans/day-XX/content-XX-text.md` |
| `audio-slides-content.template.md` | Audio + image slides plan | `projects/{name}/content-plans/day-XX/content-XX-audio.md` |

## How Agents Use These

### When User Creates New Project

```typescript
// 1. Create project folder structure
const projectPath = `projects/${projectName}`;
fs.mkdirSync(`${projectPath}/templates`, { recursive: true });
fs.mkdirSync(`${projectPath}/content-plans`, { recursive: true });
fs.mkdirSync(`${projectPath}/output-contents`, { recursive: true });

// 2. Copy templates to project
fs.copyFileSync('templates/project.template.md', `${projectPath}/templates/project.md`);
fs.copyFileSync('templates/brand.template.md', `${projectPath}/templates/brand.md`);

// 3. Fill templates as user provides info
// 4. Generate content plans
// 5. Output to output-contents/
```

### Project Folder Structure

```
projects/
└── summer-campaign/
    │
    ├── templates/                      # Filled project info
    │   ├── project.md
    │   └── brand.md
    │
    ├── style-samples/                  # User adds reference content (optional)
    │   ├── README.md
    │   ├── video-examples/
    │   ├── image-examples/
    │   ├── caption-examples/
    │   └── audio-examples/
    │
    ├── content-plans/                  # Plans before generation
    │   ├── calendar.md                 # 30-day overview
    │   │
    │   ├── day-01/                     # Day 1 content (1-5 pieces)
    │   │   ├── content-01-video.md
    │   │   └── content-02-carousel.md
    │   │
    │   ├── day-02/
    │   │   └── content-01-text.md
    │   │
    │   └── ... (day-03 through day-30)
    │
    └── output-contents/                # Generated files
        ├── day-01/
        │   ├── content-01/              # Video content
        │   │   ├── keyframes/
        │   │   ├── video.mp4
        │   │   ├── thumbnail.png        # Generated thumbnail
        │   │   └── caption.md
        │   └── content-02/
        │       ├── slide-01.png
        │       ├── slide-02.png
        │       └── caption.md
        │
        └── day-02/
            └── content-01/
                └── post.md
```

## Template Rules

1. **Templates are guides** - No real data, only structure
2. **Copy, don't modify** - Always copy to project folder first
3. **Agent fills as user answers** - Update project copy, not master
4. **Never fake data** - Testimonials, stats must be real or skipped

## Adding New Templates

1. Create `{name}.template.md` in this folder
2. Use YAML code blocks for structured data
3. Add comments explaining each field
4. Mark required vs optional fields
5. Note what agent can suggest vs must ask
