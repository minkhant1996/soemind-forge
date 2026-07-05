# Pipelines — workflow graphs as JSON

A pipeline is a JSON file of connected workflow calls: nodes run in order, and
any string `"{{nodeId.data.field}}"` in a node's args is replaced by that value
from an earlier node's result — outputs wired to inputs, like nodes in a graph.

```bash
node workflows/cli.cjs runPipeline @path/to/my.pipeline.json
```

- Whole-string refs keep their type; embedded refs interpolate as strings
- Every node passes the SAME budget gate + auto-ledger as a direct CLI call
- A failed node stops the run (mark `"optional": true` to continue past it);
  `"skip": true` holds a node without deleting it
- `pipeline-result.json` is written next to the file: per-node status, costs,
  full results — the run is inspectable and the file is the reproducible plan

## The rule: pipeline-first, every piece

Agents author the pipeline JSON BEFORE any generation — for every content
piece, even single-node ones. The plan is reviewable before money moves, and
every folder stays auditable after: plan → result → outputs.

## How agents use this

1. Copy a template below (or author nodes from WORKFLOWS.md commands)
2. Fill the ALL-CAPS placeholders, save as `<content-id>.pipeline.json` INSIDE
   the content folder (it doubles as the prompts record)
3. `runPipeline`, read the result, fix the flagged node, re-run

## Templates

| File | Chain |
|------|-------|
| pov-episode.pipeline.json | keyframe → Veo clip → kinetic text → QA → package |
| omni-writing-scene.pipeline.json | NBP prop keyframe → Omni image_to_video (stroke order) → QA |
