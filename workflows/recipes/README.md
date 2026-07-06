# Campaign Recipes

Pre-built, named campaign structures. A **recipe** encodes the marketing
strategy (what to make, in what order, and why); the skills and workflows are
the plumbing underneath. When a user asks for a campaign by shape — "launch my
product", "build authority", "turn my podcast into a week of content" — run
the matching recipe instead of planning from scratch.

| Recipe | Ask sounds like | Duration | Rough budget* |
|--------|-----------------|----------|---------------|
| [product-launch-week.md](./product-launch-week.md) | "launching next week", "launch campaign" | 7 days | $8–20 |
| [authority-calendar-30d.md](./authority-calendar-30d.md) | "build my audience", "post consistently" | 30 days | $15–40 |
| [testimonial-ad.md](./testimonial-ad.md) | "make an ad from this review" | 1 piece | $2–8 |
| [podcast-content-week.md](./podcast-content-week.md) | "repurpose my episode" | 1 episode → 1 week | $0.5–3 |
| [cinematic-story-film.md](./cinematic-story-film.md) | "brand film", "cinematic story with a character" | 1 film (30–45s) | $3.5–8 |
| [story-short-film.md](./story-short-film.md) | "short film", "animated story", multi-character story with consistent cast/locations/props | 1 short (15–60s) | $4–10 |
| [video-essay-explainer.md](./video-essay-explainer.md) | "explainer", "video essay", "break down why X" | 1 essay (60–90s) | $0.6–3 |
| [pov-series.md](./pov-series.md) | "POV video", relatable-pain series | episodes (8s) | ~$0.90/ep |
| [storytime-confession.md](./storytime-confession.md) | "storytime", "tell the real story of…" | 1 story (60–90s) | $2.5–4 |
| [what-if-scenario.md](./what-if-scenario.md) | "what if video", product-philosophy promo | 1 piece (20–30s) | $2–3 |
| [build-in-public-post.md](./build-in-public-post.md) | "share our numbers", weekly BIP post | 1 post (+card) | $0–0.07 |
| [agent-character-series.md](./agent-character-series.md) | "give the agents faces", episodic show | setup + episodes | $0.90 + ~$2/ep |
| [ugc-skit-labeled.md](./ugc-skit-labeled.md) | "skit", "UGC-style" — labeled fiction ONLY | 1 skit (8s) | $0.8–1.6 |

\* Generation costs only, assuming preview-first habits. Always estimate for
the user's actual scope before starting, and `checkBudget` first.

## How agents use a recipe

1. Read the recipe file. It defines **phases → pieces → which skill makes each**.
2. Run `/content-preflight` once — recipes assume brand + assets are resolved.
3. Materialize the recipe as a calendar (`/plan-content` format) in
   `projects/{name}/content-plans/` so `/produce-content` can execute it
   day by day. Adapt pieces to the user's platforms — don't force all of them.
4. Confirm the total estimated cost before producing anything.

## Contributing a recipe

Recipes are just markdown — the easiest, highest-value contribution. Follow
the structure of an existing recipe (Goal / When to use / Prerequisites /
The plan / Budget / Success signals) and open a PR. See
[CONTRIBUTING.md](../../CONTRIBUTING.md).
