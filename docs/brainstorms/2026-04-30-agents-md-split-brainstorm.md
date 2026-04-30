---
date: 2026-04-30
topic: agents-md-split
---

# Split AGENTS.md across the monorepo

## What We're Building

The root `AGENTS.md` is 41,739 chars and exceeds Claude Code's 40k performance threshold. We will split it into nested `AGENTS.md` files following the [agents.md](https://agents.md) monorepo guidance — agents auto-load the nearest file in the directory tree, so each subproject can ship tailored instructions and the root file stays focused on cross-cutting concerns.

Target layout:

- `AGENTS.md` (root) — monorepo-wide: Quick Start, Turborepo, Architecture Overview, AST/LSP tooling, Unified Theme System, General Principles, Workflow + Pre-implementation regression checklist, Security/Safe wallet concepts, Environment Configuration. Keep pointers to the nested files.
- `apps/web/AGENTS.md` (new) — Feature Architecture Import Rules, Storybook (Web only), Web Testing Guidelines, Common Pitfalls, Debugging Tips.
- `apps/mobile/AGENTS.md` (new) — Mobile Development (Expo + Tamagui).
- `packages/AGENTS.md` (new) — Shared Packages conventions, dual env-var patterns (`NEXT_PUBLIC_*` || `EXPO_PUBLIC_*`), cross-platform considerations.
- Existing nested files stay: `apps/web/cypress/AGENTS.md`, `apps/web/.storybook/AGENTS.md`.

The "Code Complexity Guidelines" section moves to `apps/web/docs/code-style.md` (it largely duplicates global `~/.claude/CLAUDE.md` "Hard limits" but we keep the content).

## Why This Approach

Three approaches were considered:

1. **Extract verbose sections to docs and link** — works short term, doesn't scale.
2. **Tighten prose in place** — diminishing returns, doesn't address future growth.
3. **Split by domain via nested AGENTS.md** — chosen. Aligned with the agents.md spec ("Large monorepo? Use nested AGENTS.md files for subprojects"), matches existing pattern in `apps/web/cypress/` and `apps/web/.storybook/`, and ensures each agent loads only context relevant to the subtree it's working in.

## Key Decisions

- **Nested split over single-file trim**: Authoritative agents.md guidance for monorepos; OpenAI's repo reportedly has 88 nested AGENTS.md files. Sustainable as the repo grows.
- **Four-tier split (root + web + mobile + packages)**: Packages are genuinely cross-platform and deserve their own contributor notes (dual env-var prefixes, store-shape considerations).
- **Move Code Complexity Guidelines to `apps/web/docs/code-style.md`**: Preserves content while removing duplication with the global CLAUDE.md "Hard limits".
- **Cross-cutting workflow rules stay at root**: The Pre-implementation regression checklist applies to any change, web or mobile, so it belongs in root AGENTS.md.
- **No content lost**: This is a re-organisation, not a content cull. Each section moves to its most-relevant subtree.
- **Root AGENTS.md keeps a short index** linking to each nested file so newcomers (and agents that start at root) can navigate.

## Open Questions

- Exact root-file size target after split — aim for <25k chars to leave headroom for future additions.
- Should the regression-checklist _example output format_ (~3k chars of markdown template) live in root, or be moved into a `docs/regression-checklist.md` and linked? Defer — keep at root unless size budget forces a move.
- Are there any sections that should be duplicated rather than moved (e.g. "Use sentence case for UI text" applies to both web and mobile)? Default to single-source-of-truth at root with cross-references.

## Next Steps

→ `/safe-engineering:workflows-plan` for implementation details (file-by-file mapping, exact section moves, verification of post-split sizes).
