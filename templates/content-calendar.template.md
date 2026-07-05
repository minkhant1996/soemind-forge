# Content Calendar Template

> 30-day (or custom) content plan overview.
> Each content piece links to its own detailed plan file.

---

## Calendar Info

```yaml
calendar:
  name: ""                        # e.g., "June 2026 Summer Campaign"
  start_date: ""                  # YYYY-MM-DD
  end_date: ""                    # YYYY-MM-DD
  duration_days: 30
  status: "planning"              # planning | approved | in_progress | completed
```

---

## Goals & Strategy

```yaml
campaign_goal: ""                 # e.g., "App installs", "Brand awareness"
target_audience: ""               # From project.md

content_pillars:                  # Rotate these content themes
  educational:
    percentage: 40
    description: "Tips, how-to, value content"
  promotional:
    percentage: 20
    description: "Direct offers, CTAs"
  engagement:
    percentage: 20
    description: "Questions, polls, trends"
  testimonial:
    percentage: 10
    description: "Social proof (REAL only)"
  behind_scenes:
    percentage: 10
    description: "Authentic, relatable"

platforms:
  - name: "tiktok"
    posts_per_week: 5
    best_times: ["7pm"]
  - name: "instagram"
    posts_per_week: 7
    best_times: ["12pm", "6pm"]
  - name: "youtube"
    posts_per_week: 2
    best_times: ["3pm"]
```

---

## Content Schedule

```yaml
# Agent fills this based on strategy
# Each entry links to detailed plan in content-plans/day-XX/

schedule:
  - day: 1
    date: ""
    contents:
      - id: "d01-c01"
        type: "video"                 # video | carousel | image | text | audio_slides
        platform: "tiktok"
        pillar: "educational"
        topic: ""                     # Brief topic
        plan_file: "day-01/content-01-video.md"
        status: "planned"             # planned | approved | generated | published

      - id: "d01-c02"
        type: "carousel"
        platform: "instagram"
        pillar: "educational"
        topic: ""
        plan_file: "day-01/content-02-carousel.md"
        status: "planned"

  - day: 2
    date: ""
    contents:
      - id: "d02-c01"
        type: "text"
        platform: "twitter"
        pillar: "engagement"
        topic: ""
        plan_file: "day-02/content-01-text.md"
        status: "planned"

  # ... continue for all days
```

---

## Summary Stats

```yaml
# Agent calculates
totals:
  total_days: 30
  total_contents: 0

  by_type:
    video: 0
    carousel: 0
    image: 0
    text: 0
    audio_slides: 0

  by_platform:
    tiktok: 0
    instagram: 0
    youtube: 0
    facebook: 0
    twitter: 0

  by_pillar:
    educational: 0
    promotional: 0
    engagement: 0
    testimonial: 0
    behind_scenes: 0

estimated_cost:
  images: 0
  videos: 0
  audio: 0
  total: 0
```

---

## Style Samples Check

```yaml
style_samples:
  folder: "style-samples/"

  # Agent checks what's available
  available:
    video_examples: false
    image_examples: false
    caption_examples: false
    audio_examples: false

  # If none available
  fallback: "Agent will create engaging content using platform best practices"
```

---

## Approval Workflow

```yaml
workflow:
  - step: "Calendar review"
    status: "pending"             # pending | approved
    notes: ""

  - step: "Day 1-7 plans review"
    status: "pending"
    notes: ""

  - step: "Day 8-14 plans review"
    status: "pending"
    notes: ""

  # ... etc
```

---

## Notes

```
[Agent or user notes here]
```
