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

The Argos render sweep lives at `scripts/storybook/render-sweep.ts` (repo root), run via `yarn workspace @safe-global/web storybook:sweep`. `render-sweep.ts` only runs the workers and writes the output; the work lives next to it: `sweep-options.ts` (flags, story selection), `sweep-browser.ts` (launch flags, the per-story context), `sweep-check.ts` (one story in one mode), `sweep-settle.ts` (waits, viewport fit, stable screenshot) and `sweep-findings.ts` (issue rules, pure and unit-tested in `__tests__/`). It handles the `skip-visual-test` tag: tagged stories are render-checked but not snapshotted. `--shots` writes sheets, grouped by `scripts/storybook/sheets.ts`. Every sheet must be identical between runs of the same commit, so each story gets a fresh browser context with a fixed clock (2026-01-15 12:00 UTC), a seeded `Math.random`, `prefers-reduced-motion` (which `preview.tsx` turns into `MotionGlobalConfig.skipAnimations`) and a placeholder for any page outside the swept Storybook; Chrome runs without partial raster and with sandboxed iframes in the page process. `IframeIcon` (every `TokenIcon`) is replaced by a plain-image mock (`mocks/iframeIcon.tsx`, aliased in both `main.ts` files): its sandboxed iframes painted too late on CI runners and left icons missing, and the sweep reports any `srcdoc` iframe as `SRCDOC_IFRAME`. Full-page stories render with a viewport as tall as the page, fitted once the page has settled at 900px, so the fixed sidebar spans the whole sheet; a screen-sized layout (`min-h-screen`, `100vh`) keeps the default 900px. A screenshot sometimes shrinks the viewport to 1px for a moment, and a popup that hears it flips above its anchor and stays there, so the sweep stops those resize events before the page sees them; content that fits is also captured without a full-page resize. Check popup stories over several runs: the flip comes in about one run in five. Keep these when you change the sweep or the previews. Workflow status and local usage: see the guide's "Visual regression (Argos)" section.
