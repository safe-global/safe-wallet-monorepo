# Storybook Configuration Guidelines

Guidance for the Storybook **configuration** in this directory. For writing stories (taxonomy, mocking, fixtures, Argos), see the canonical [../docs/storybook-guide.md](../docs/storybook-guide.md). For component variant/styling rules, see [../AGENTS.md](../AGENTS.md#component-variants-over-custom-styling).

## What lives here

- `main.ts` — Storybook config (webpack-based).
- `preview.tsx` — global setup that stories don't re-add per file: the global `mswLoader`, `ShadcnProvider` + light/dark theme sync decorators, viewport presets, and the sidebar `storySort` (including the curated `Design System` top-level group).
- `decorators/` — shared story decorators; stories import `withMockProvider` from `@/storybook/decorators`. Never re-export them from `preview.tsx`: every story downloads its imports, and `withMockProvider` pulls in the whole store.
- `mocks/` — config-level mocks.
- `COVERAGE.md` — **generated**; regenerate with `yarn workspace @safe-global/web storybook:generate-coverage`, never hand-edit.
- `test-runner.mjs` — Storybook test-runner config.

## The `.storybook-vite` twin config

A parallel config dir `.storybook-vite/` backs the `storybook:vite` / `build-storybook:vite` scripts (Vite builder). When changing `main.ts` or `preview.tsx` here, check whether `.storybook-vite/` needs the same change.

## Visual sweep harness

The Argos render sweep lives at `scripts/storybook/render-sweep.ts` (repo root), run via `yarn workspace @safe-global/web storybook:sweep`. It handles the `skip-visual-test` tag: tagged stories are render-checked but not snapshotted. `--shots` writes sheets, grouped by `scripts/storybook/sheets.ts`. Every sheet must be identical between runs of the same commit, so each story gets a fresh browser context with a fixed clock (2026-01-15 12:00 UTC), a seeded `Math.random`, `prefers-reduced-motion` (which `preview.tsx` turns into `MotionGlobalConfig.skipAnimations`) and a placeholder for any page outside the swept Storybook; Chrome runs without partial raster and with sandboxed iframes in the page process. `IframeIcon` (every `TokenIcon`) is replaced by a plain-image mock (`mocks/iframeIcon.tsx`, aliased in both `main.ts` files): its sandboxed iframes painted too late on CI runners and left icons missing. Keep these when you change the sweep or the previews. Workflow status and local usage: see the guide's "Visual regression (Argos)" section.
