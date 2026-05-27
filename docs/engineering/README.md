# Engineering Docs

Entry point for the Safe wallet monorepo's convention docs. Generated
and maintained by the `safe-engineering:code-conventions` skill from
closed PR review feedback.

## Layout

- `conventions/` — the canonical, ordered docs. Read these when writing code.
- `sources/` — what conventions are built from: the durable rule index
  (`rules.json`), the PR-sourced receipts (`examples/`, `web/examples/`,
  `mobile/examples/`), the generated rule view (`rules.generated.md`), and
  `working/` (maintenance-only inputs).
- `pr-self-review-checklist.generated.md` — a per-session checklist (gitignored).

## How To Use

1. Before starting a coding task, read
   [conventions/project-structure.md](./conventions/project-structure.md) for
   repo-wide guidance. If the change touches `apps/web/**`, also read
   [conventions/web/project-structure.md](./conventions/web/project-structure.md).
   If it touches `apps/mobile/**`, also read
   [conventions/mobile/project-structure.md](./conventions/mobile/project-structure.md).
2. Before opening or finishing a PR, generate the temporary checklist
   from [sources/rules.json](./sources/rules.json), review every rule, and mark
   every generated item checked:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/code-conventions/scripts/generate-checklist.js
   ```

   The generated checklist is ignored by Git and must not be
   committed.

3. If a review comment surfaces a behavior the docs do not yet
   cover, either re-run the convention skill in compound mode or
   file an issue / PR comment so the next compound run picks it up.

## Tree

Active docs read by normal coding agents:

```text
docs/engineering/
  README.md
  conventions/
    project-structure.md            # repo-wide guidance
    web/
      project-structure.md          # web-specific structure
    mobile/
      project-structure.md          # mobile-specific structure
  sources/
    rules.json                      # canonical PR rule checklist
    rules.generated.md              # generated human-readable rules
    examples/
      general/                      # cross-project examples
    web/
      examples/                     # web-specific examples
    mobile/
      examples/                     # mobile-specific examples
    working/
      review-learnings.json         # review-learning source objects
      review-learning-ledger.json   # closedAt range state
```

Maintenance inputs for the convention skill live under `sources/working/` and
are not part of normal-agent routing.

## Project Routing Rules

- All PR rules live in [sources/rules.json](./sources/rules.json).
- The optional `project` field is used for monorepo routing. In this repo it
  marks whether a rule applies to `general`, `web`, `mobile`, or another
  subtree. The `area` field groups the engineering concern within that project.
- PR review always generates the full checklist from every rule. The
  agent may decide a rule does not apply, but it still marks it
  checked after considering it.

## Maintaining The System

```text
/safe-engineering:code-conventions --setup            # initial or refresh
/safe-engineering:code-conventions --compound         # forward from covered range
/safe-engineering:code-conventions --compound --backfill   # historical
```

Forward and backfill runs read closed PR review comments by exact
`closedAt` timestamp. Review learnings live in
`sources/working/review-learnings.json` and map to one or more rule IDs in
`sources/rules.json`. The covered closed-at range is tracked in
`sources/working/review-learning-ledger.json`.
