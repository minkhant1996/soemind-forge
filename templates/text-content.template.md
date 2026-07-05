# Text-Only Content Plan

> Full plan for text-only posts (no media).
> Twitter/X, LinkedIn, Facebook, Threads, Blog.

---

## Content Info

```yaml
id: ""
day: 0
date: ""
platform: ""                      # twitter | linkedin | facebook | threads | blog
pillar: ""
status: "planned"
```

---

## Writing Format

```yaml
# Choose the format type
format:
  type: ""                        # See options below

# FORMAT OPTIONS:
# ─────────────────────────────────────────────────────
# SOCIAL POSTS:
#   hook_story     - Hook + story + lesson
#   listicle       - "5 ways to...", "3 things..."
#   question       - Ask audience, drive comments
#   hot_take       - Opinion, controversial stance
#   thread         - Multi-post deep dive
#   quote          - Quote + commentary
#   tip            - Single actionable tip
#   announcement   - News, launch, update
#
# BLOG/LONG-FORM:
#   how_to         - Step-by-step tutorial
#   explainer      - What/Why/How breakdown
#   comparison     - A vs B analysis
#   case_study     - Problem → Solution → Results
#   interview      - Q&A format
#   roundup        - "Best of" curated list
#   opinion        - Perspective piece
#   news_analysis  - Current event + take
#   story          - Narrative arc
# ─────────────────────────────────────────────────────
```

---

## Copywriting Framework

```yaml
# Choose framework for structure
framework:
  type: ""                        # See options below

# FRAMEWORK OPTIONS:
# ─────────────────────────────────────────────────────
# AIDA:
#   Attention  → Hook that stops scroll
#   Interest   → Why they should care
#   Desire     → Make them want it
#   Action     → Tell them what to do
#
# PAS:
#   Problem    → State the pain point
#   Agitate    → Make it worse, emotional
#   Solution   → Present the answer
#
# BAB:
#   Before     → Current painful state
#   After      → Desired future state
#   Bridge     → How to get there
#
# 4Ps:
#   Promise    → What they'll get
#   Picture    → Paint the vision
#   Proof      → Evidence it works
#   Push       → Urgency to act
#
# HSO:
#   Hook       → Grab attention
#   Story      → Tell the narrative
#   Offer      → Present solution/CTA
# ─────────────────────────────────────────────────────
```

---

## Platform Limits

```yaml
limits:
  twitter: 280                    # characters
  linkedin: 3000                  # characters (700 before "see more")
  facebook: 63206                 # but 80-100 words ideal
  threads: 500                    # characters
  blog: 0                         # no limit (1500-2500 words typical)
```

---

## Content Structure

```yaml
structure:
  # For single post
  hook: ""                        # First line - MOST IMPORTANT
  body: ""                        # Main content
  cta: ""                         # Call to action / closer

  # For thread (Twitter/X)
  is_thread: false
  thread_count: 0

  # For blog/long-form
  sections: []                    # List of section headings
```

---

## The Post

```yaml
post:
  # Single post content
  text: |
    [Full post text here]

  # If thread
  thread:
    - tweet: 1
      text: |
        [Tweet 1 - Hook]

    - tweet: 2
      text: |
        [Tweet 2 - Context]

    - tweet: 3
      text: |
        [Tweet 3 - Main point]

    # ... continue

    - tweet: 10
      text: |
        [Last tweet - CTA]
```

---

## Engagement Elements

```yaml
engagement:
  question: ""                    # Question to ask audience
  poll_options: []                # If poll post
  controversial_take: ""          # Hot take (if applicable)

  hashtags:
    - ""
    - ""

  mentions: []

  emoji_use: ""                   # none | minimal | moderate
```

---

## Tone & Style

```yaml
tone:
  voice: ""                       # professional | casual | witty | inspirational
  energy: ""                      # calm | energetic | urgent
  format: ""                      # paragraph | bullet_points | one_liners
```

---

## Output Files

```yaml
outputs:
  post_file: "post.md"            # Or post.txt
  thread_file: "thread.md"        # If thread

output_path: ""
```
