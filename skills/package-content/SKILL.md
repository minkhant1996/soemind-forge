---
name: package-content
description: Package a generated asset into ready-to-upload folders per platform — correctly sized media, captions within char limits, hashtags, alt text. Use when the user says "export for Instagram", "make it ready to post", "prepare for upload", "package this", or after any generation when the user wants to publish the result.
allowed-tools: Bash Read Write Edit Glob Grep
---

# Package Content

Turn a generated file into the thing the user actually uploads. One command
does the resizing, caption limits, and per-platform folders:

```bash
node workflows/cli.cjs packageContent '{"mediaPath":"…","platforms":["instagram","tiktok"],"caption":"…","hashtags":["…"],"outputDir":"…"}'
```

Full argument shape: `workflows/WORKFLOWS.md` § *Publish & Repurpose*.
Local ffmpeg only — **zero API cost**, no budget check needed.

## Steps

1. **Identify the asset.** Usually the file you just generated; otherwise ask.
   Confirm it exists before packaging.

2. **Pick platforms + content type.** If the user didn't say, ask once
   ("Which platforms?"). Content type defaults are usually right
   (video → reel/short, image → feed); only ask when ambiguous (e.g. a 16:9
   video could be a YouTube `long` or get cropped for `short`).

3. **Write the copy.** If a caption doesn't exist yet, produce it with
   `/write-copy` conventions from the project's `brand.md` (tone, CTA phrases,
   restrictions). Include:
   - `caption` — platform-appropriate copy (front-load the first 125 chars)
   - `hashtags` — from the brand/plan; the workflow trims to per-platform max
   - `altText` — REQUIRED for images (accessibility)
   - `title` — for YouTube
   - `link` — only if the user has one

4. **Run it** with `outputDir` inside the content's output folder, e.g.
   `projects/{name}/output-contents/{piece}/publish/`.

5. **Report.** Show the user each platform folder, surface every warning from
   the result (truncated captions, dropped hashtags), and remind them what
   `post.json` records. If a caption was truncated, offer to write a shorter
   platform-specific version instead.

> A 16:9 video packaged as `reel`/`short` gets **padded**, not cropped. If the
> user wants full-frame vertical, extract/crop first (`extractClip` with
> `cropTo: "9:16"`) and package the cropped file.
