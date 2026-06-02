---
name: code-conventions
description: Create and maintain repo-specific engineering convention docs. Supports setup from repository structure, forward compounding from closed PR review feedback, historical backfill, daily coding docs, JSON Schema-backed rules, structured review learnings, generated Markdown views, and PR self-review.
argument-hint: '--setup | --compound [--backfill] | --review-pr [--repo owner/repo] [--since ISO-8601] [--until ISO-8601]'
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
---

# /code-conventions

Create and maintain repo-specific engineering convention docs.

This skill turns repository structure and PR review feedback into active coding
guidance, rule checks, examples, and traceable review learnings.

For monorepos, rule objects may use the optional `project` field to route
checks to subtrees such as `web`, `mobile`, or `packages`. Omit `project` in
single-project repositories or when the repo has no useful project split.

## Information Ownership

- `SKILL.md` owns routing, required mode order, validation commands, and final
  response shape.
- `references/convention-docs-schema.md` owns all output files, data schemas,
  ID formats, invariants, and doc responsibilities.
- `workflows/*.md` files own only mode-specific procedure.

Do not duplicate schema details in workflow files. When a workflow needs the
current file shape, read `references/convention-docs-schema.md`.

## Mode Routing

Use one mode per run. Always read `references/convention-docs-schema.md` first.

| Mode                    | Purpose                                                                                 | Then Read                                             | Omit                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `--setup`               | Initial repo analysis or structured documentation refresh.                              | `workflows/setup.md`                                  | `workflows/compound.md`, `workflows/backfill.md`, `workflows/review-pr.md` |
| `--compound`            | Forward maintenance from closed PR review comments after the covered range.             | `workflows/compound.md`                               | `workflows/setup.md`, `workflows/backfill.md`, `workflows/review-pr.md`    |
| `--compound --backfill` | Historical compounding before the covered range.                                        | `workflows/compound.md`, then `workflows/backfill.md` | `workflows/setup.md`, `workflows/review-pr.md`                             |
| `--review-pr`           | Apply the repo's current convention rules before opening, finishing, or reviewing a PR. | `workflows/review-pr.md`                              | `workflows/setup.md`, `workflows/compound.md`, `workflows/backfill.md`     |

## Validation

After editing convention docs, and after every `--compound` or
`--compound --backfill` run, run:

```bash
node .claude/skills/code-conventions/scripts/generate-rules-md.js
node .claude/skills/code-conventions/scripts/validate-convention-docs.js
```

Then run `git diff --check`.

`rules.generated.md` is formatted through the repo's Prettier inside
`renderRulesMarkdown`, so it's byte-identical to what a pre-commit
`prettier`/`lint-staged` hook produces and won't be rewritten (and then flagged
stale) after a commit. Generator and validator share that formatting path, so
they agree. If a commit hook still reformats the generated file, that's a
generator bug — fix the emitted Markdown, don't hand-edit the output.

## Final Response

Tell the user:

- mode used
- window fetched, if any
- PR/comment counts, if any
- review-learning IDs added or changed
- project-structure sections or rule objects added or changed
- example sections added or changed
- rule/check areas touched
- active docs changed
- working docs changed
- open questions added or resolved
- rule-mapping gaps found or closed

Keep it concise. Trust Git for the full diff.
