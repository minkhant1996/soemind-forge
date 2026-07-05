# Recipe: Testimonial Ad

**Goal:** convert a real customer quote into the most trusted ad format there is.
**When to use:** "make an ad from this review", "use this customer story".
**Prerequisites:** a REAL testimonial (quote + attribution the user actually
has). ⚠️ **Hard rule: never invent, embellish, or "improve" the quote.** If
they have none, this recipe is blocked — offer the authority calendar to earn
some instead.

## Pick the format by what the testimonial contains

| You have | Make | Skill |
|----------|------|-------|
| A strong one-liner | Quote card image (4:5) — big type, brand style, attribution | `/generate-image` |
| A before/after story | 15-30s video: struggle → product → outcome, quote as VO or overlay | `/generate-video` |
| Multiple short quotes | Carousel — one quote per slide, product shot last | `/generate-image` (carousel) |
| Stats + a quote | Result-first video/image: number up front, quote as proof | either |

## The build (video variant — richest form)

1. **Structure the story** (`/write-copy`): Hook = the outcome or the pain
   ("I almost gave up on home coffee") → context → turning point (product) →
   result → CTA. The customer is the protagonist; the product is the tool.
2. **Cast honestly.** Never generate a character presented as the real
   customer. Two clean options — text-quote treatment (no face; typographic +
   product b-roll), or a clearly generic "customers like Dana" character
   (registered, `person_generation` policy respected). Ask the user which.
3. **Storyboard first** (`/preview-pick` Pattern B), then clips.
4. **Overlay the exact quote** as on-screen text (or VO reading it verbatim) —
   add "Results may vary" style disclaimers per brand.md if claims are
   outcome-based.
5. **Package** (`/package-content`) — testimonial content performs on feed
   (4:5) and reels (9:16); make both if budget allows.

## Compliance checklist (before generating anything)

- [ ] Quote is verbatim from a real customer (user confirmed)
- [ ] Attribution style approved (first name / initials / anonymous)
- [ ] Any numbers in the quote are the customer's own claim, presented as such
- [ ] Face treatment chosen honestly (no fake "real customer" faces)
- [ ] Required disclaimers from brand.md applied

## Budget

Quote card ~$0.10 · carousel ~$0.30-0.50 · video ~$2-8 (storyboard-first).

## Success signals

Comments echoing the pain point ("this is literally me") — proof of resonance;
higher CTR than product-first ads is normal when the quote leads. If it
underperforms, the quote is probably generic praise — go find a quote with a
specific outcome in it.
