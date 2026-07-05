# Project Brief Template

> Copy to `project.md` in your output folder.
> Agent will check this file FIRST before generating any content.
> Fill what you know. Agent will ask about missing info or suggest options.

---

## 1. Business & Product

```yaml
business:
  name: ""                    # Company/brand name
  domain: ""                  # ecommerce | saas | education | b2b | local | other
  website: ""                 # URL (optional)

product:
  name: ""                    # Product/service name
  type: ""                    # physical | digital | app | course | service
  price: ""                   # Price or range (optional)
  description: ""             # One sentence: what is it?

# What makes you different from competitors?
unique_selling_points:
  - ""
  - ""
  - ""
```

**Agent can suggest:** Domain and product type based on description.

---

## 2. Target Audience

```yaml
audience:
  # Primary target
  primary:
    name: ""                  # e.g., "University Students"
    age_range: ""             # e.g., "18-24"
    gender: ""                # male | female | all
    location: ""              # Countries/regions
    situation: ""             # e.g., "Preparing for study abroad"

  # What problem do they have?
  pain_points:
    - ""
    - ""
    - ""

  # What do they want to achieve?
  goals:
    - ""
    - ""

  # What have they tried that didn't work?
  failed_solutions:
    - ""
    - ""

# Secondary audience (optional)
secondary:
  name: ""
  age_range: ""
  situation: ""
```

**Agent can suggest:** Audience segments based on product type.
**Agent CANNOT fake:** Specific customer data.

---

## 3. Social Proof & Testimonials

> ⚠️ MUST BE REAL - Agent cannot make these up!

```yaml
social_proof:
  # Real numbers only
  stats:
    customers: ""             # e.g., "10,000+" or leave empty
    success_rate: ""          # e.g., "95%" or leave empty
    rating: ""                # e.g., "4.8/5" or leave empty
    reviews_count: ""         # e.g., "500+ reviews"

  # Real testimonials only (or leave empty)
  testimonials:
    - quote: ""
      name: ""                # Can use first name only
      result: ""              # What they achieved

  # Trust badges (real only)
  featured_in: []             # e.g., ["Forbes", "TechCrunch"]
  certifications: []          # e.g., ["ISO certified", "Official partner"]
  awards: []
```

**Agent CANNOT suggest or fake these.** If empty, agent will:
- Skip social proof in content
- Or ask: "Do you have any customer stats or testimonials?"

---

## 4. Offer & Campaign

```yaml
campaign:
  name: ""                    # e.g., "Summer 2026 Launch"
  objective: ""               # awareness | leads | sales | app_installs

offer:
  type: ""                    # free_trial | discount | lead_magnet | none
  headline: ""                # e.g., "7-Day Free Trial"
  details: ""                 # e.g., "No credit card required"
  urgency: ""                 # e.g., "Limited spots" (optional)

cta:
  primary: ""                 # e.g., "Start Free Trial"
  secondary: ""               # e.g., "Learn More"
  url: ""                     # Landing page URL
```

**Agent can suggest:** Offer types and CTA phrases based on domain.

---

## 5. Content Requirements

```yaml
content:
  type: ""                    # ad | explainer | story | testimonial | ugc
  platform: ""                # tiktok | instagram | youtube | facebook | linkedin
  duration: ""                # e.g., "15-30 seconds"

style:
  visual: ""                  # polished | ugc_authentic | cinematic | minimal
  tone: ""                    # professional | casual | energetic | emotional

# Does video have people?
talent:
  has_character: false        # true | false
  speaks_in_video: false      # true | false
  character_description: ""   # If yes, describe
```

**Agent can suggest:** Style and tone based on platform and domain.

---

## 6. Hooks & Messaging

```yaml
# Opening hook (first 1-3 seconds)
hooks:
  type: ""                    # problem | curiosity | result | story | shock
  ideas:
    - ""
    - ""
    - ""

# Key messages to convey
key_messages:
  - ""
  - ""
  - ""

# Words/phrases to AVOID
restrictions:
  - ""                        # e.g., "guaranteed" (legal)
  - ""                        # e.g., competitor names
```

**Agent can suggest:** Hook ideas based on audience pain points.

---

## 7. Visual References (Optional)

```yaml
references:
  # Links to videos you like
  video_examples:
    - url: ""
      what_you_like: ""

  # Competitor ads to differentiate from
  competitors:
    - name: ""
      their_approach: ""
      our_difference: ""
```

---

## 8. Domain-Specific Requirements

### For E-commerce (physical product):
```yaml
ecommerce:
  show_product: true
  unboxing: false
  lifestyle_context: ""       # e.g., "kitchen", "gym", "office"
  close_up_features: []       # Features to highlight
  packaging_visible: false
```

### For SaaS / App:
```yaml
saas:
  show_ui: true
  screen_recording: false
  key_feature_demo: ""        # Main feature to show
  before_after_result: ""     # What screen shows before/after
  integration_mentions: []    # e.g., ["Slack", "Google"]
```

### For Education / Course:
```yaml
education:
  show_student: true          # Student character
  transformation_story: true  # Before/after journey
  credential_mention: ""      # e.g., "Certificate of Completion"
  learning_preview: false     # Show course content
  instructor_visible: false
```

### For B2B / Service:
```yaml
b2b:
  show_professional: true
  case_study_style: false
  client_logos: []            # Real logos only!
  roi_focus: ""               # e.g., "Save 10 hours/week"
  meeting_cta: false          # "Book a demo" style
```

### For Local Business:
```yaml
local:
  show_location: true
  staff_faces: false
  community_feel: true
  local_landmarks: ""
  service_area: ""
```

---

## Checklist Before Generation

Agent verifies:

- [ ] Business & product defined
- [ ] Target audience defined
- [ ] Pain points identified
- [ ] Offer/CTA decided
- [ ] Content type & platform set
- [ ] Visual style chosen
- [ ] At least one hook idea
- [ ] Domain-specific requirements filled

**Missing items = Agent asks user before proceeding.**

---

## Agent Instructions

```
1. READ this file first
2. CHECK what's filled vs empty
3. For empty REQUIRED fields:
   - ASK user
   - SUGGEST options where allowed
   - NEVER fake testimonials/stats
4. UPDATE this file with user's answers
5. CONFIRM plan before generating
6. PROCEED to content generation
```
