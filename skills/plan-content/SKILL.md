---
name: plan-content
description: Create content calendars and plans. Use for 30-day calendars, campaign planning, content strategy.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Plan Content

## RUN PRE-FLIGHT FIRST

Before planning, run [`content-preflight`](../content-preflight/SKILL.md): classify the
topic, verify project + brand (+ product if it's a product topic), and resolve the required
reusable assets (characters, products, logos, voices) from
`projects/{name}/config/assets.yaml`. Generate or register any missing asset **once** and
save its path so every planned piece reuses it. See
[`templates/content-requirements.md`](../../templates/content-requirements.md) for what each
content type requires.

## CHECK THE RECIPES FIRST

If the request matches a known campaign shape — product launch, authority/consistency
calendar, testimonial ad, podcast repurposing — start from the matching recipe in
[`workflows/recipes/`](../../workflows/recipes/README.md) instead of planning from scratch.
Recipes encode proven structure; adapt the pieces to the user's platforms, then
materialize as a calendar below so `/produce-content` can execute it.

## IMPORTANT: DO NOT SKIP QUESTIONS

**Even if user says "just create a plan" or "quick content plan" - YOU MUST:**
1. Ask the required questions below
2. Wait for user answers
3. THEN create the plan

**Never assume or make up:**
- Brand name
- Target audience details
- Offers or CTAs
- Testimonials or stats (NEVER fake these)

---

## Step 1: Create or Check Project

Ask: **"What's your project/campaign name?"**

**IMPORTANT: ALL projects go under `projects/` folder!**

Create folder structure:
```bash
# CORRECT: Under projects/ folder
mkdir -p projects/{name}/templates
mkdir -p projects/{name}/content-plans
mkdir -p projects/{name}/style-samples
mkdir -p projects/{name}/output-contents
mkdir -p projects/{name}/assets
mkdir -p projects/{name}/config
mkdir -p projects/{name}/scripts

# WRONG: Do NOT create at root level
# mkdir -p {name}  ← WRONG!
```

Copy templates:
```bash
cp templates/project.template.md projects/{name}/templates/project.md
cp templates/brand.template.md projects/{name}/templates/brand.md
```

**Project structure must be:**
```
projects/
└── {project-name}/
    ├── templates/        # project.md, brand.md
    ├── content-plans/    # content calendars
    ├── output-contents/  # generated files
    ├── assets/           # reference files (characters/, products/, logo/, …)
    └── config/           # assets.yaml — reusable asset registry
```

> Generate content by CALLING the workflow CLI (`node workflows/cli.cjs <command> '<json>'`),
> not by writing scripts. Projects hold data (templates, assets, outputs) — not code.

Copy the asset registry template too:
```bash
cp templates/assets.config.template.yaml projects/{name}/config/assets.yaml
```

## Step 2: MUST ASK These Questions (DO NOT SKIP)

**Read `templates/project.template.md` for all fields, then ASK:**

**STOP and wait for answers before creating any content plan.**

### Business Info → fills `product` section
1. **Business name?** → `product.name`
2. **What do you sell?** → `product.description`
3. **Website?** → `product.website`
4. **What makes you unique?** → `product.unique_selling_points[]`

### Target Audience → fills `audience` section
5. **Who is your ideal customer?**
   - Name/label → `audience.primary.name`
   - Age range → `audience.primary.age_range`
   - Location → `audience.primary.location`
   - Their situation → `audience.primary.situation`

6. **What pain points do they have?** → `audience.pain_points[]`
7. **What do they want to achieve?** → `audience.goals[]`

### Offer → fills `offer` section
8. **What's your offer?** → `offer.headline`, `offer.details`
9. **What's the CTA?** → `cta.primary`
10. **Any urgency?** → `offer.urgency`

### Social Proof → fills `social_proof` section (MUST BE REAL)
11. **Any customer stats?** → `social_proof.stats[]`
12. **Any testimonials?** → `social_proof.testimonials[]`
13. **Featured in or awards?** → `social_proof.authority[]`

**If no social proof, leave empty - NEVER make it up.**

## Step 3: Fill Brand Info - ASK User

Read `templates/brand.template.md`, then ask:

### Colors → fills `colors` section
1. **Primary brand color?** → `colors.primary` (hex)
2. **Secondary color?** → `colors.secondary` (hex)
3. **Accent/highlight color?** → `colors.accent` (hex)

### Tone → fills `tone` section
4. **How should we speak?** → `tone.voice` (professional, casual, friendly, bold)
5. **What energy level?** → `tone.energy` (high, medium, calm)

### Visual Style → fills `visual` section
6. **Visual style?** → `visual.style` (modern, minimal, bold, elegant)
7. **What imagery to use?** → `visual.imagery` (photos, illustrations, etc.)

### Restrictions → fills `restrictions` section
8. **Any words to AVOID?** → `restrictions.never_say[]`
9. **Any topics to avoid?** → `restrictions.avoid_topics[]`

## Step 4: Plan Content Calendar

Ask:
1. **How many days?** (7, 14, 30)
2. **How many posts per day?** (1-5)
3. **Which platforms?** (TikTok, Instagram, YouTube, etc.)

### Content Pillars (suggest these):
- Educational (40%) - tips, how-to, value
- Promotional (20%) - offers, CTAs
- Engagement (20%) - questions, polls
- Testimonial (10%) - social proof (REAL only)
- Behind scenes (10%) - authentic content

## Step 5: Create Calendar File

Copy template:
```bash
cp templates/content-calendar.template.md projects/{name}/content-plans/calendar.md
```

Fill the calendar with:
```yaml
schedule:
  - day: 1
    date: "YYYY-MM-DD"
    contents:
      - id: "d01-c01"
        type: "video"
        platform: "tiktok"
        pillar: "educational"
        topic: "Brief topic description"
        plan_file: "day-01/content-01-video.md"
```

## Step 6: Create Individual Content Plans

For each content piece, create a plan file:

```bash
mkdir -p projects/{name}/content-plans/day-01
```

Copy appropriate template:
- Video: `templates/video-content.template.md`
- Image: `templates/image-content.template.md`
- Carousel: `templates/carousel-content.template.md`
- Text: `templates/text-content.template.md`

Fill with specific details for that content.

## Step 7: Show Summary & Confirm

Present to user:
```
Project: {name}
Duration: 30 days
Total contents: {count}

By type:
- Videos: X
- Carousels: X
- Images: X
- Text posts: X

By platform:
- TikTok: X
- Instagram: X

Estimated cost: ${total}

Ready to generate? Which day first?
```

## Templates Location

All templates are in `templates/` folder:
- `project.template.md` - Business info
- `brand.template.md` - Visual identity
- `content-calendar.template.md` - 30-day overview
- `video-content.template.md` - Video plans
- `image-content.template.md` - Image plans
- `carousel-content.template.md` - Carousel plans
- `text-content.template.md` - Text post plans

## Rules

- **NEVER fake testimonials or stats**
- **ASK for missing required info**
- **SUGGEST options where template says "Agent can suggest"**
- **UPDATE files as user answers**
- **CONFIRM before generating**
