# Project Brief — Sunrise Roasters (Demo)

> ⚠️ FICTIONAL DEMO DATA — every name, number, and testimonial here is invented
> to show what a completed brief looks like. For a real project, only enter
> social proof that is actually true.

---

## 1. Business & Product

```yaml
business:
  name: "Sunrise Roasters"
  domain: ecommerce            # also runs a local café
  website: "https://sunriseroasters.example.com"

product:
  name: "Single-Origin Roast Boxes"
  type: physical
  price: "$18–24 per 12oz bag, $16/mo subscription"
  description: "Small-batch single-origin coffee, roasted to order and shipped within 48 hours of roasting."

unique_selling_points:
  - "Roasted to order — ships within 48h of the roast date"
  - "Direct-trade beans from 6 named farms (farmer story on every bag)"
  - "Subscription pauses automatically when you're stocked up"
```

---

## 2. Target Audience

```yaml
audience:
  primary:
    name: "Home Coffee Upgraders"
    age_range: "25-40"
    gender: all
    location: "US & Canada, urban/suburban"
    situation: "Bought a decent grinder or pour-over kit during the last few years; supermarket beans now taste flat"

  pain_points:
    - "Supermarket coffee is stale long before the bag says so"
    - "Specialty coffee shops feel gatekeep-y and jargon-heavy"
    - "Subscriptions pile up bags faster than they can drink them"

  goals:
    - "Café-quality coffee at home without becoming a hobbyist"
    - "Feel good about where their coffee money goes"

  failed_solutions:
    - "Big-brand 'premium' supermarket beans (stale)"
    - "A subscription they cancelled because bags piled up"

secondary:
  name: "Gift Buyers"
  age_range: "25-55"
  situation: "Looking for a consumable gift that feels thoughtful, not generic"
```

---

## 3. Social Proof & Testimonials

> ⚠️ FICTIONAL — replace with REAL data in your own project, or leave empty.

```yaml
social_proof:
  stats:
    customers: "4,200+ subscribers"
    success_rate: ""
    rating: "4.9/5"
    reviews_count: "870+ reviews"

  testimonials:
    - quote: "First bag ruined supermarket coffee for me forever."
      name: "Dana"
      result: "Subscriber for 14 months"
    - quote: "The auto-pause is genius. No more guilt shelf."
      name: "Marcus"
      result: "Switched from a big-box subscription"

  featured_in: []
  certifications: ["Direct trade partnerships (self-verified)"]
  awards: []
```

---

## 4. Offer & Campaign

```yaml
campaign:
  name: "Ethiopia Yirgacheffe Launch — July 2026"
  objective: sales

offer:
  type: discount
  headline: "20% off your first box"
  details: "Code SUNRISE20 at checkout, applies to one-time boxes and first subscription month"
  urgency: "Yirgacheffe lot limited to 400 bags"

cta:
  primary: "Try the Yirgacheffe"
  secondary: "See all roasts"
  url: "https://sunriseroasters.example.com/yirgacheffe"
```

---

## 5. Content Requirements

```yaml
content:
  type: ad
  platform: instagram
  duration: "15-30 seconds"

style:
  visual: polished           # with warm, natural feel — see brand.md
  tone: casual

talent:
  has_character: true
  speaks_in_video: false
  character_description: "Maya, the founder/roaster — see char-maya in config/assets.yaml"
```

---

## 6. Hooks & Messaging

```yaml
hooks:
  type: problem
  ideas:
    - "Your coffee was stale before you even opened the bag."
    - "The roast date matters more than the price tag."
    - "POV: you finally taste what a blueberry note actually means."

key_messages:
  - "Roasted to order, shipped within 48 hours"
  - "You can taste the difference freshness makes"
  - "Every bag names the farm it came from"

restrictions:
  - "No 'world's best coffee' claims"
  - "Don't disparage named competitors"
  - "No health claims about coffee"
```

---

## 7. Visual References (Optional)

```yaml
references:
  video_examples:
    - url: ""
      what_you_like: "Slow-motion pour shots with steam, warm morning window light"

  competitors:
    - name: "(large national subscription brand)"
      their_approach: "Sleek, tech-startup aesthetic, heavy on packaging shots"
      our_difference: "Human and warm — the roaster's hands, the farm names, the morning ritual"
```

---

## 8. Domain-Specific Requirements

### For E-commerce (physical product):
```yaml
ecommerce:
  show_product: true
  unboxing: false
  lifestyle_context: "sunlit home kitchen, morning"
  close_up_features: ["roast date stamp on bag", "beans texture", "pour-over bloom"]
  packaging_visible: true
```
