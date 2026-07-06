# Product Shot Guide (e-commerce photography)

> **MANDATORY:** Read before generating product images. The job of most
> product shots is not aesthetics — it's answering buyer questions fast
> (what is it, what size, what material, what's included, can I trust it)
> and cutting returns caused by mismatched expectations.

---

## The iron rules

1. **Always start from a REAL product photo.** Product shots run through
   `generateImageVariation` with the registry product asset as
   `referenceImagePath` — never describe a product into existence (RULES 4).
   A messy supplier photo, warehouse snapshot, or phone shot is a fine base
   as long as the real product detail is visible.
2. **Fidelity is non-negotiable.** Every `productShot` preset automatically
   appends: *"Keep the exact shape, proportions, branding, label text,
   colors, and material finish of the product from the reference image."*
   QA every output against the reference — wrong label text or altered
   proportions can mislead buyers and violate marketplace rules.
3. **Draft cheap, finalize sharp.** Iterate composition with
   `imageModel:"lite"` ($0.0336) → user approves a direction → regenerate
   final at `imageSize:"2K"` (flash/pro). Don't polish directions nobody
   picked (preview-pick skill).
4. **Marketplace accuracy:** on Amazon/Etsy/eBay the image is the trust
   signal. Main listing images: `pure-white-packshot`, no props. Review
   shadows, labels, proportions before shipping.

---

## The preset library (26 ids → `productShot` on `generateImageVariation`)

```bash
node workflows/cli.cjs generateImageVariation '{
  "referenceImagePath": "projects/{name}/assets/products/prod-main-hero.png",
  "productShot": "pure-white-packshot",
  "prompt": "The ceramic honey jar with the gold lid.",
  "outputPath": "projects/{name}/output-contents/{date}/packshot-white.png",
  "aspectRatio": "1:1", "imageSize": "2K"
}'
```

The preset supplies the scene + lighting + fidelity clause; your `prompt`
adds only the specifics — product name, props, colors, surface swaps.

### Studio / marketplace — clean PDP + catalog images

| id | Look | Use for |
|---|---|---|
| `pure-white-packshot` | Centered on pure white, soft studio light, shadow under product, no props | Amazon/Etsy/eBay/Walmart main image, first Shopify PDP image |
| `soft-gray-hero` | Light gray seamless, diffused light, realistic reflections | DTC sites where white feels clinical; electronics, premium packaging |
| `floating-shadow` | Floating cutout, soft grounding shadow, neutral bg | Landing pages, collection banners, product cards |
| `flat-lay` | Top-down on clean surface, even light | Packaging, stationery, beauty, kitchen — layout reads faster top-down |

### Scale & buying confidence — risk-reduction shots (cut returns)

| id | Look | Use for |
|---|---|---|
| `multi-angle` | Front + side + angled views in ONE frame | Bags, devices, containers, hardware |
| `open-closed` | Closed and open state in one composition | Cases, wallets, boxes, foldables — shows capacity/structure |
| `texture-closeup` | Macro on material, stitching, finish | "Looks cheap" vs "looks worth it" — fabric, leather, metal |
| `in-hand-scale` | Held naturally in one hand | Small gadgets, jars, accessories — size misjudgment killer |

### Lifestyle / context — when a packshot doesn't explain the product

| id | Look | Use for |
|---|---|---|
| `natural-habitat` | The product in its real-life environment | Anything that needs context to make sense fast |
| `minimal-interior` | Modern minimal room, product is the hero | Home decor, fragrance, small appliances |
| `outdoor-lifestyle` | Outdoor setting matching its use | Bottles, backpacks, sunglasses, travel |
| `desk-context` | Realistic desk setup, complementary objects | Electronics, planners, chargers, headphones |
| `hands-usage` | Hands only, product in use, no full person | Kitchen tools, beauty, grooming, devices — cheap model-shot substitute |
| `model-usage` | Model naturally using the product | Headphones, bags, bottles — body context aids understanding |
| `hands-premium` | Elegant hands, shallow DOF, no face | Premium feel without a person dominating |
| `in-use-closeup` | Close-up of application/use, product in soft-focus bg | Skincare, lotions, food prep — shows the experience |

### Mood / style — brand-tone variants for ads & social

| id | Look | Use for |
|---|---|---|
| `luxury-dark` | Dark marble, gold accents, directional light | Perfume, watches, jewelry, spirits |
| `rustic-artisan` | Weathered wood, burlap, warm window light | Handmade soap, honey, ceramics, craft goods |
| `colorful-pop` | Coral × teal color-blocking, tropical props | Beverages, candy, phone cases, summer lines — feed-stopper |
| `moody-editorial` | Dark slate, side light, smoke, deep contrast | Coffee, whiskey, cologne, men's grooming |

### Seasonal / merchandising — one base photo, every campaign

| id | Look |
|---|---|
| `spring-fresh` | Light airy spring styling, soft natural light |
| `summer-bright` | Warm bright summer energy |
| `winter-snow` | Crisp snow, bright winter light |
| `cozy-holiday` | Knitted blanket, pine cones, fairy lights |
| `holiday-gift` | Festive gifting scene, elegant styling |
| `black-friday` | Bold high-contrast promo composition |

Same base image + 6 seasonal presets = a year of campaign assets without a
reshoot. Batch these when the user asks for "seasonal versions".

---

## Channel → shot mapping (what to propose)

| User's channel | Propose |
|---|---|
| Marketplace listing (Amazon/Etsy/eBay) | `pure-white-packshot` (main) + `multi-angle` + `texture-closeup` + `in-hand-scale` |
| Own site PDP | `soft-gray-hero` (hero) + scale shots + one lifestyle |
| Paid social ads | 2-3 directions to TEST: one mood preset + one lifestyle + one seasonal |
| Email / homepage banner | `floating-shadow` or `minimal-interior` |
| Instagram feed | `flat-lay`, `colorful-pop`, lifestyle presets |

A shot that works on a PDP dies as an ad thumbnail — generate per channel
from the same reference, don't reuse one image everywhere
(sizes: `PLATFORM-SPECS.md`).

---

## Writing the `prompt` specifics (on top of a preset)

- **Name surfaces with materials:** "on a table" → "on a scratched vintage
  oak table". Marble, concrete, velvet, slate, linen all steer the model.
- **Name the light source and quality:** "warm golden hour sunlight from the
  right", "soft overhead studio light", "cool window light on a cloudy day".
  Never "good lighting".
- **2-3 props, not 10.** Props reinforce the story: tea → teacup + book +
  wool blanket; sunscreen → sunglasses + beach towel.
- **One mood word** ("cozy", "dramatic", "airy", "luxurious") + concrete
  details beats either alone.
- **Iterate small:** change ONE thing per retry — surface, light direction,
  or a prop — and log each retry in prompts.txt with a RESULT note.

## People in product shots

`model-usage` / `hands-usage` / `hands-premium` / `in-hand-scale` involve
people: set `personGeneration:"allow"`, specify expression + setting
("smiling in bliss, bright airy living room with natural window light"),
and never depict a real named person. Fashion/on-body accuracy drifts
fastest — QA fit and proportions strictly (`reviewOutput` with
`expectedSubject`).

## QA + audit (every product shot)

```bash
node workflows/cli.cjs reviewOutput '{"imagePath":"…/packshot-white.png","checks":["consistency","unwanted-text","aspect","quality"],"expectedSubject":"<the exact product>"}'
```

Compare against the reference: label text, proportions, colors, material.
Log prompt + preset id in the manifest and prompts.txt. Register winning
shots as assets for reuse (`registerAsset`, collection `products`).
