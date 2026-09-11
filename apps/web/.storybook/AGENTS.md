# Storybook Configuration Guidelines

Guidance for the Storybook **configuration** in this directory. For writing stories (taxonomy, mocking, fixtures, Argos), see the canonical [../docs/storybook-guide.md](../docs/storybook-guide.md). For component variant/styling rules, see [../AGENTS.md](../AGENTS.md#component-variants-over-custom-styling).

## What lives here

- `main.ts` — Storybook config (webpack-based).
- `preview.tsx` — global setup that stories must NOT re-add per-file: the global `mswLoader`, `ShadcnProvider` + light/dark theme sync decorators, viewport presets, and the sidebar `storySort` (including the curated `Design System` top-level group).
- `decorators/` — shared story decorators; `withMockProvider` is re-exported to stories via `@/storybook/preview`.
- `mocks/` — config-level mocks.
- `COVERAGE.md` — **generated**; regenerate with `yarn workspace @safe-global/web storybook:generate-coverage`, never hand-edit.
- `test-runner.mjs` — Storybook test-runner config.

## The `.storybook-vite` twin config

A parallel config dir `.storybook-vite/` backs the `storybook:vite` / `build-storybook:vite` scripts (Vite builder). When changing `main.ts` or `preview.tsx` here, check whether `.storybook-vite/` needs the same change.

## Visual sweep harness

The Argos render sweep lives at `scripts/storybook/render-sweep.ts` (repo root), run via `yarn workspace @safe-global/web storybook:sweep`. It handles the `skip-visual-test` tag: tagged stories are render-checked but not snapshotted. Workflow status and local usage: see the guide's "Visual regression (Argos)" section.
