# Style Block — one locked look, prepended to EVERY prompt in the series

> Copy to `projects/{name}/templates/style-block.md` when producing a **series**:
> a cinematic film, an animated series, or a product-shot campaign. Write it ONCE
> with the user, lock it, then prepend the block verbatim to every image/video
> prompt of that series. Identity refs lock WHO/WHAT appears; this block locks
> HOW IT'S RENDERED. You need both.

## Rules of engagement

1. **4–7 lines max.** A long block crowds out the actual shot description —
   prompt budget is real. Cut any line that doesn't change pixels.
2. **Look only — no camera movement.** Camera moves come from the `cameraMove`
   preset per clip (VIDEO-PROMPT-GUIDE §2b); a movement line here would fight it.
3. **One block per series, per format.** Film ≠ product campaign — use the right
   variant below. Record which variant + values in `brand.md`.
4. **Lock it like a character.** Register as `style_references` with
   `locked: true`; never edit mid-series (continuity breaks visibly).
5. **Agent MUST prepend it** to every `generateSingleImage` / `generateImageVariation`
   / `generateSilentVideo` / `generateVideoFromImage` / `generateOmniVideoClip` /
   keyframe prompt of the series, and note "style-block: v1" in prompts.txt.

---

## Variant A — Cinematic film / short film

```
Style: <medium, e.g. photorealistic 35mm film | 3D papercraft | claymation>, <ratio> <format, e.g. anamorphic widescreen>.
Lighting: <one regime, e.g. natural light only, contre-jour backlight, no artificial sources>.
Color: <dominant/secondary/accent, e.g. 60:30:10 — charcoal / off-white / blue>.
Camera: <lens + physics, e.g. physical cine lens, shallow depth of field, 180° shutter motion blur>. (lens character only — movement comes from cameraMove)
Detail: <realism anchors, e.g. pore-level skin, fabric weave, respected gravity and inertia>.
Continuity: characters, props, environment identical across every shot.
```

## Variant B — Animated series

```
Style: <art style id or description, e.g. OMNI_ART_STYLES claymation | 2d-illustration>, consistent line weight and texture.
Palette: <3-5 named colors, same across episodes>.
Lighting: <e.g. soft toy-box key light, no hard shadows>.
World rules: <physics/scale rules of the world, e.g. everything hand-made scale, visible fingerprints in clay>.
Continuity: characters, props, sets identical across every episode and shot.
```

## Variant C — Product-shot campaign

```
Style: <e.g. premium e-commerce photography, tack-sharp product, true-to-life color>.
Lighting: <one regime, e.g. large soft key at 45°, gentle falloff, no mixed color temperatures>.
Color: <background/surface palette, e.g. warm neutrals, brand accent only in props>.
Lens: <e.g. 85mm look, product fills 60-70% of frame>. 
Fidelity: the product is EXACTLY as in the reference photo — label, proportions, materials unchanged.
```

> Variant C composes WITH `productShot` presets: the preset sets the scene,
> this block sets the constant look across all 26-scene outputs.

---

## Anti-patterns (don't put these in a style block)

- Camera **movement** ("slow dolly-in") → per-clip `cameraMove` decides that.
- Per-scene content ("she opens the door") → that's the shot prompt.
- Audio directives on image prompts; fps/technical lines on stills.
- Vague adjectives with no pixel meaning ("high quality", "stunning", "8K" on a 1K render).
