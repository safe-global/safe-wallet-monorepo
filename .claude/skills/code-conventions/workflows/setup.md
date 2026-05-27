# Setup Workflow

Use setup mode when the repo does not yet have convention docs, or when it
needs a structured refresh.

## Inputs

Read:

- existing `AGENTS.md`, `CLAUDE.md`, contributing docs, architecture docs
- existing `REVIEW_LEARNINGS.md` if present
- repository module / package / app structure
- representative canonical areas and known legacy areas
- framework-specific conventions already visible in code

## Work

1. Inventory the current repo structure.
2. Identify good "copy this" examples and avoid-copying exceptions.
3. Extract existing placement conventions from code, tests, and docs.
4. Create or refresh the files defined in
   `references/convention-docs-schema.md`.
5. Update agent routing so normal agents know when to read the active docs and
   when to run the all-rules checklist.
6. Generate committed views and run validation as described in `SKILL.md`.

## Constraints

- Do not import generic framework ideals wholesale. Use the repo's actual
  conventions as the authority.
- Keep outputs adapted to the repo. A NestJS backend, Next.js frontend, and
  mobile app should not receive identical categories.
- Mark legacy/special-case code so agents do not copy it as precedent.
- Do not over-document speculative conventions. If the team preference is
  unclear, capture a concrete open question instead.

## Agent Routing

Update repository agent docs to follow the normal-agent routing defined in
`references/convention-docs-schema.md`.
