# Feature Specification: Safe UI Design System

**Feature Branch**: `worktree-safe-ui-design-system-spec`
**Created**: 2026-11-11
**Status**: Draft (decisions D1–D5 recorded; docs domain/host open)
**Input**: "Move our shared components to a new npm package, Safe UI. This is our design system. Alongside the package, a new project that is the static website for the design system, in the shadcn style."

## Summary

Safe UI is two deliverables, built from one source:

1. **`@safe-global/ui`**: a published npm package with Safe's shadcn/Base UI components, design tokens and styles. Projects use it with `import { Button } from '@safe-global/ui/button'`.
2. **`apps/design-system`**: a static docs website in the style of ui.shadcn.com. It has live previews, code samples, a theme and token reference, and install instructions. The same site also hosts a **shadcn registry**, so a team that wants to own and customize a component can run `npx shadcn add @safe/button`.

Both live in `safe-wallet-monorepo` for v1. The wallet is the main consumer, so a component change and its effect on the wallet are reviewed in the same PR. The code can move to its own repo later without changing the public API.

## Background: what exists today

- `packages/views/src/components/ui` has about 50 shadcn components built on `@base-ui/react`, Tailwind v4 and `cva`. Many have tests, and there are 54 Storybook stories. The package is private and exports raw `.tsx`. It also contains domain views (transactions, balances, …) that are **not** design-system material.
- `apps/web/components.json` uses style `base-vega`, `iconLibrary: lucide` and baseColor `neutral`. It points the `ui`/`utils`/`hooks` aliases at `@safe-global/views`.
- Tokens are split across two places:
  - `apps/web/src/styles/shadcn.css` (357 lines) holds shadcn tokens. They're mostly hex, and they're **scoped to `.shadcn-scope`** so they can coexist with MUI. A `ShadcnProvider` provides the portal container for that scope.
  - `packages/theme` holds the shared palettes and generates MUI, Tamagui and CSS variables (`vars.css`).
- ESLint rules in `packages/views/eslint-design-system.mjs` stop call sites from restyling `Button`, `Card`, `Input`, `Tabs` and `Badge` through `className`.

Known coupling that has to be cut before publishing:

| Coupling                                  | Where           | Resolution                                                                                         |
| ----------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `@safe-global/utils` (address parsing)    | `ui/input.tsx`  | Move the address-aware input into `views` as a composed component. The base `Input` stays generic. |
| `next-themes`                             | `ui/sonner.tsx` | Take `theme` as a prop, or use a framework-agnostic theme hook from the package.                   |
| `@safe-global/views/...` absolute imports | all ui files    | Rewrite to relative or package-internal imports.                                                   |
| Tokens in `apps/web` CSS                  | `shadcn.css`    | Move into the package (see Tokens).                                                                |

## Goals

- **G1.** One importable, versioned package that any Safe React web project can use.
- **G2.** A public docs site that's the single place to find, preview and copy Safe components.
- **G3.** One source of truth for web tokens, kept in step with `packages/theme` (and so with mobile).
- **G4.** The wallet moves to the package with no visual change.
- **G5.** An optional "own the code" path through a shadcn registry, for teams that need to fork a component.

## Non-goals (v1)

- React Native / Tamagui components. Mobile shares **tokens only** for now (D5). Keep component APIs (names, variants, sizes) platform-neutral so a future Tamagui set can mirror them.
- Domain components (transaction rows, Safe-specific widgets). They stay in `@safe-global/views`.
- Removing MUI from the wallet.
- Support for Tailwind v3 or for projects without Tailwind.

## User Scenarios

### US1: Consume the package in a new Safe project (P1)

As a developer starting a new Safe web app, I install `@safe-global/ui`, import its stylesheet once, and use components with Safe branding without copying any code.

**Acceptance**

1. **Given** a fresh Vite or Next app with Tailwind v4, **when** I follow the docs install steps (install, `@import '@safe-global/ui/styles.css'`, `@source` the package), **then** `<Button>` renders with Safe styles in light and dark mode.
2. **Given** I import only `@safe-global/ui/button`, **when** I build, **then** unrelated components (calendar, sidebar, …) and their dependencies aren't in my bundle.
3. **Given** TypeScript, **when** I use a component, **then** props, including `cva` variant unions, are fully typed.

### US2: Browse the docs site (P1)

As a developer or designer, I open the Safe UI site, find a component, see it live, switch the theme, and copy a working example.

**Acceptance**

1. Every exported component has a page with a live preview, a code tab, a props table and its variants.
2. The site has pages for Introduction, Installation, Theming/Tokens (colors, radius, typography, spacing as swatches with variable names), Dark mode and Changelog.
3. The site is fully static (SSG) and deployable to any static host.

### US3: Wallet migrates to the package (P1)

As a wallet engineer, I import from `@safe-global/ui` instead of `@safe-global/views/components/ui`, and nothing looks different.

**Acceptance**

1. All imports of `@safe-global/views/components/ui/*` and `@safe-global/views/utils/cn` in `apps/web` and `packages/views` point at `@safe-global/ui/*`.
2. Existing Chromatic/Storybook visual tests pass with no unexpected diffs.
3. The design-system ESLint rules ship from the package (for example `@safe-global/ui/eslint`) and stay enforced in the wallet.

### US4: Own a component through the registry (P2)

As a developer who needs to change a component beyond its props, I run `npx shadcn add @safe/button` and get the Safe-themed source in my project.

**Acceptance**

1. Adding `"@safe": "https://<docs-host>/r/{name}.json"` to `components.json` lets `shadcn add @safe/<item>` work for every component.
2. `npx shadcn add @safe/theme` installs Safe tokens as a `registry:theme` item.
3. Registry items are generated from the same source files as the npm package, so they can't drift.

### US5: Release a new version (P2)

As a maintainer, I merge a change with a changeset and a new version is published, with a changelog entry on the docs site.

## Requirements

### Package: `packages/ui` → `@safe-global/ui`

- **R1. Exports:** one entry per component, plus `./styles.css`, `./tokens.css`, `./utils` (`cn`), `./hooks/*`, `./eslint` and `./provider`. No root barrel in v1, which keeps tree-shaking simple.
- **R2. Build:** compile to ESM with `.d.ts`, using tsup or tsdown with one entry per component and `'use client'` banners kept. Mark React, React DOM and Tailwind as peer dependencies. Base UI, cva, `cn` and lucide are dependencies.
- **R3. Styles:**
  - `styles.css` holds the `@theme inline` mapping, the tokens, the dark variant and `tw-animate-css`.
  - Consumers add `@source "../node_modules/@safe-global/ui/dist"`, and the docs must explain this clearly.
  - The `.shadcn-scope` scoping becomes an **opt-in** `scoped.css` variant for apps that mix with MUI, like the wallet. Unscoped `:root`/`.dark` is the default for new projects.
- **R4. Tokens:**
  - Token values are generated from `packages/theme` palettes by extending the existing `css-vars` generator to output shadcn-named variables.
  - Nobody hand-edits hex values in two places.
  - Moving to oklch is optional and must not change rendered colors.
- **R5. Framework agnostic:** no imports from `next/*` or `next-themes`. The package must work in Next and Vite. `apps/web-tanstack` is the proof.
- **R6. Quality:** existing component tests move with their components. Stories move to the package and are reused by the docs site wherever possible.
- **R7. Publishing:**
  - Publish public on npm under `@safe-global`, managed with changesets. Start at `0.x`, and go `1.0` after the wallet migration lands.
  - Public package (D2). Add `"publishConfig": { "access": "public" }`, a license and a README. Publish from CI with npm provenance.

### Docs site: `apps/design-system`

- **R8. Stack:** Next.js (static export) with Fumadocs (MDX), the same approach ui.shadcn.com uses. Tailwind v4, consuming `@safe-global/ui` like any external consumer would.
- **R9. Pages:**
  - Getting started: Introduction, Installation (npm path and registry path), Theming, Dark mode, Changelog.
  - Foundations: Colors, Typography, Spacing, Radius, Icons.
  - One page per component.
  - Later: Blocks/patterns (forms, empty states, dialogs).
- **R10. Component page anatomy:** Preview/Code tabs, Installation (npm import and `shadcn add @safe/x`), Usage, Variants/Examples, Props (generated from TypeScript), Accessibility notes, Do/Don't (from the ESLint rules).
- **R11. Registry:** `apps/design-system/registry.json` lists every component as `registry:ui` and the tokens as `registry:theme`. `shadcn build` outputs to `public/r/` during the site build. The source files are read from `packages/ui/src`.
- **R12. Features:** light/dark toggle, search (⌘K), copy-to-clipboard and mobile layout. Optionally, an MCP or `llms.txt` page so AI agents can find components.
- **R13. Hosting:** a static host behind a Safe domain. The domain and host aren't decided yet (see Open questions). The build must be a plain static export with no host-specific features, so any static host works. Deploys come from `main`, with preview deploys on PRs.

### Governance

- **R14. Ownership:** shared by engineering and design (D4). CODEOWNERS for `packages/ui` lists both an engineering group and a design group. Engineering approval is required for code, and design approval for anything visual (tokens, variants, new components).
- **R15. Figma:** keep and extend the existing Code Connect mapping (`ui/docs/figma-code-connect.md`) so Figma components link to the package.
- **R16. Contribution rules:**
  - New components start as `shadcn add` from upstream and are then themed.
  - Domain logic is never allowed in the package.
  - Breaking prop changes require a major changeset.
- **R17. Storybook as the design workspace:**
  - `packages/ui` gets its own Storybook, with the stories moved from `views/components/ui/stories`.
  - It's deployed on every PR (Chromatic), so designers can review and comment without running code.
  - Designers contribute by opening PRs that add or edit stories and token values. The existing repo skills (`design.prototype`, `design.sync-component`, `design.verify`) are the supported path from Figma to a story.
  - Chromatic visual review is a required check on `packages/ui` and is approved by the design owner.
  - The docs site reuses the same stories or examples for its previews, so a story a designer adds shows up in the docs.

## Proposed structure

```
packages/ui/                     # @safe-global/ui (published)
  src/components/button.tsx …
  src/hooks/  src/lib/cn.ts  src/provider/
  src/styles/{styles,tokens,scoped}.css   # tokens generated from packages/theme
  eslint/index.mjs
  components.json                # so `shadcn add` works inside the package
  tsup.config.ts  package.json  CHANGELOG.md
apps/design-system/              # docs site + registry (static)
  content/docs/**.mdx
  registry.json → public/r/*.json
packages/views/                  # domain views only; depends on @safe-global/ui
```

## Rollout

1. **Phase 0, extract:** create `packages/ui` and move generic components, `cn`, hooks and tests. Cut the couplings listed in the table above. `views` re-exports from `ui` temporarily so nothing breaks.
2. **Phase 1, tokens:** generate `tokens.css` from `packages/theme` and move `shadcn.css` into the package. The wallet uses `scoped.css`. Visual tests must be unchanged.
3. **Phase 2, wallet migration:** codemod the imports, remove the re-exports and move the ESLint rules into the package.
4. **Phase 3, docs site:** scaffold `apps/design-system` with Foundations and the 10 most-used components first, then the rest.
5. **Phase 4, publish:** set up changesets and publishing to npm, and host the registry. Validate by consuming from a fresh Vite app outside the monorepo.

## Success criteria

- **SC1.** A fresh app outside the monorepo installs `@safe-global/ui` and renders a themed Button and Dialog in under 10 minutes by following the docs.
- **SC2.** The wallet has zero imports from `@safe-global/views/components/ui`, and Chromatic shows no unexpected diffs.
- **SC3.** 100% of exported components have a docs page with a preview and props.
- **SC4.** `shadcn add @safe/<item>` works for every component.
- **SC5.** Token values have one source (`packages/theme`). A test fails if the generated CSS drifts.

## Decisions (2026-11-11)

| #   | Topic        | Decision                                                                                                                        |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Package name | `@safe-global/ui`: existing npm scope, a single package with per-component subpath exports.                                     |
| D2  | Visibility   | Public on npm.                                                                                                                  |
| D3  | Repo         | Stays in `safe-wallet-monorepo` (`packages/ui` + `apps/design-system`).                                                         |
| D4  | Ownership    | Shared by engineering and design. Design contributes through Storybook (see R17).                                               |
| D5  | Mobile       | Out of scope for now. It may come later as a Tamagui set. Tokens stay shared through `packages/theme`, so that door stays open. |

## Open questions

1. **Docs domain and host:** not decided yet. The site is a plain static export (R13), so this can be decided late without code changes. Phases 0–3 don't depend on it. Only Phase 4 (public registry URL) does.
