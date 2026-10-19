# Engineering Docs

Entry point for the Safe wallet monorepo's convention docs, learned from
closed PR review feedback. The data lives here; the tooling that maintains
and applies it lives in the
[safe-engineering-plugin](https://github.com/safe-global/safe-plugins-marketplace/tree/main/plugins/engineering/safe-engineering-plugin).

## Layout

- `conventions/` — the canonical, ordered docs. Read these when writing code.
- `sources/` — what conventions are built from: the durable rule index
  (`rules.json`), the PR-sourced receipts (`examples/`, `web/examples/`,
  `mobile/examples/`), and `working/` (maintenance-only inputs).

## How To Use

1. Before starting a coding task, read
   [conventions/project-structure.md](./conventions/project-structure.md) for
   repo-wide guidance. If the change touches `apps/web/**`, also read
   [conventions/web/project-structure.md](./conventions/web/project-structure.md).
   If it touches `apps/mobile/**`, also read
   [conventions/mobile/project-structure.md](./conventions/mobile/project-structure.md).
2. Before opening or finishing a PR, run `/safe-code-review` from the
   [safe-engineering-plugin](https://github.com/safe-global/safe-plugins-marketplace/tree/main/plugins/engineering/safe-engineering-plugin).
   Its team-rules pass checks the change against every rule in
   [sources/rules.json](./sources/rules.json).

3. If a review comment surfaces a behavior the docs do not yet
   cover, nothing extra is needed: the weekly compound run reads every
   closed PR's review comments and picks it up.

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
    examples/
      general/                      # cross-project examples
    web/
      examples/                     # web-specific examples
    mobile/
      examples/                     # mobile-specific examples
    working/
      review-learnings.json         # review-learning source objects
      review-learning-ledger.json   # closedAt range state
      open-question-options.md      # team decisions still open
```

Maintenance inputs live under `sources/working/` and
are not part of normal-agent routing.

## Project Routing Rules

- All PR rules live in [sources/rules.json](./sources/rules.json).
- The optional `project` field is used for monorepo routing. In this repo it
  marks whether a rule applies to `general`, `web`, `mobile`, or another
  subtree. The `area` field groups the engineering concern within that project.
- PR review always considers every rule. The reviewer may decide a rule does
  not apply to a change. Each finding cites its rule ID and counts in the
  rule's natural review category (security, testing, and so on).

## Maintaining The System

Maintained with `/safe-repo-rules` from the safe-engineering-plugin, usually
as one PR per week:

```text
/safe-repo-rules --setup                 # initial or refresh
/safe-repo-rules --compound              # forward from the covered range, one week at a time
/safe-repo-rules --compound --backfill   # historical
/safe-repo-rules --prune                 # merge duplicate rules, shorten bloated ones
```

Forward and backfill runs read closed PR review comments by exact
`closedAt` timestamp. Review learnings live in
`sources/working/review-learnings.json` and map to one or more rule IDs in
`sources/rules.json`. The covered closed-at range is tracked in
`sources/working/review-learning-ledger.json`.
