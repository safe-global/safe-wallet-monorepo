# AI Contributor Guidelines

This repository is the Safe{Wallet} monorepo, containing both web and mobile applications for Safe (formerly Gnosis Safe), a multi-signature smart contract wallet on Ethereum and other EVM chains. The repository uses a Yarn 4 workspace-based monorepo structure. Follow these rules when proposing changes via an AI agent.

## Nested guidance

This monorepo uses nested AGENTS.md files. Agents working in a subtree automatically load the nearest one — for Claude Code this works via a one-line pointer `CLAUDE.md` next to each AGENTS.md, so every new AGENTS.md needs one. Start at root for cross-cutting rules, then drop into the relevant subtree:

| Subtree                | File                                                           | Covers                                                                                 |
| ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/web/`            | [apps/web/AGENTS.md](apps/web/AGENTS.md)                       | Feature architecture, variants/styling, web testing, web pitfalls                      |
| `apps/web/e2e/`        | [apps/web/e2e/AGENTS.md](apps/web/e2e/AGENTS.md)               | **Playwright E2E — all new tests go here**                                             |
| `apps/web/cypress/`    | [apps/web/cypress/AGENTS.md](apps/web/cypress/AGENTS.md)       | Cypress E2E (legacy — maintenance only)                                                |
| `apps/web/.storybook/` | [apps/web/.storybook/AGENTS.md](apps/web/.storybook/AGENTS.md) | Storybook config; story authoring: [storybook-guide](apps/web/docs/storybook-guide.md) |
| `apps/web-tanstack/`   | [apps/web-tanstack/AGENTS.md](apps/web-tanstack/AGENTS.md)     | TanStack Router + Vite migration runtime — reuses `apps/web/src`                       |
| `apps/tx-builder/`     | [apps/tx-builder/AGENTS.md](apps/tx-builder/AGENTS.md)         | Safe App (iframe), **MUI v6 + Vite — web styling rules do not apply**                  |
| `apps/mobile/`         | [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md)                 | Expo + Tamagui                                                                         |
| `packages/`            | [packages/AGENTS.md](packages/AGENTS.md)                       | Shared packages: verification, codegen, dual env vars, theme workflow                  |
| `config/`              | [config/AGENTS.md](config/AGENTS.md)                           | Shared test workspace (`@safe-global/test`): MSW fixtures/scenarios, verify caveat     |

When adding new guidance, place it in the most-specific subtree it applies to. When a workspace, script, generated path, test framework, or architecture boundary changes, update the nearest AGENTS.md in the same PR — and prefer replacing old rules over appending exceptions.

## Quick Start

Common commands for getting started:

```bash
# Install dependencies (Yarn 4 via corepack; also runs `after-install` for web,
# which generates TypeScript types from contract ABIs)
yarn install

# Run web app in development mode
yarn workspace @safe-global/web dev

# Run mobile app in development mode
yarn workspace @safe-global/mobile start

# Run tests for web
yarn workspace @safe-global/web test

# Run Storybook for web
yarn workspace @safe-global/web storybook
```

Workspace-scoped scripts (`pw:*`, `test:scaffold`, `css-vars`, `storybook`, …) must be run via `yarn workspace @safe-global/<name> …`; the root package.json only adds `verify:*`, `knip`, `prettier:fix`, and the Turborepo-backed `lint`/`type-check`/`test`.

## Turborepo

Root-level `lint`, `type-check`, and `test` run through [Turborepo](https://turborepo.com). Tasks are cached by input hash and re-used on subsequent runs — locally and in CI.

```bash
yarn type-check                                        # all workspaces (cached)
yarn turbo run type-check --filter=@safe-global/web    # scoped
yarn turbo run test --filter=@safe-global/utils...     # package + dependents
```

Cache directory is `.turbo/` (gitignored). Task definitions live in `turbo.json`. Remote-cache setup (one-time, per team): [docs/turbo-remote-cache.md](docs/turbo-remote-cache.md).

## Architecture Overview

- **apps/web** – Next.js web application (the main app)
- **apps/web-tanstack** – TanStack Router + Vite runtime reusing `apps/web/src`
- **apps/mobile** – Expo/React Native mobile application
- **apps/tx-builder** – Safe App (runs in an iframe), MUI v6 + Vite
- **packages/** – shared libraries (`store`, `theme`, `utils`) used by web and mobile
- **config/**, `expo-plugins/*`, `tools/codemods/*` – shared configuration and tooling workspaces

Subtree-specific caveats live in the Nested guidance table above.

### Key Entry Points

Stable architectural landmarks for fast orientation:

| Area           | Path                                         | Purpose                                              |
| -------------- | -------------------------------------------- | ---------------------------------------------------- |
| Web app entry  | `apps/web/src/pages/_app.tsx`                | Next.js app bootstrap, providers, `InitApp`          |
| Redux store    | `apps/web/src/store/index.ts`                | `makeStore()`, middleware, RTK Query APIs            |
| RTK Query APIs | `apps/web/src/store/api/gateway/`            | CGW API endpoints (balances, transactions, etc.)     |
| Feature system | `apps/web/src/features/__core__/`            | `createFeatureHandle`, `useLoadFeature`, proxy stubs |
| Page layout    | `apps/web/src/components/common/PageLayout/` | Main app layout, sidebar, header                     |
| Safe info hook | `apps/web/src/hooks/useSafeInfo.ts`          | Current Safe address, owners, threshold              |
| Chain config   | `packages/store/src/gateway/chains/`         | RTK Query chains endpoint with retry logic           |
| Theme package  | `packages/theme/src/`                        | Palettes, spacing, typography tokens                 |
| Mobile entry   | `apps/mobile/src/app/_layout.tsx`            | Expo Router root layout                              |

### Code search

For "who uses this symbol?" questions, prefer the `LSP` tool (`findReferences`, `goToDefinition`) — it follows imports and re-exports across the monorepo. For structural patterns ("every `useMemo` with `chainId` in deps"), use `ast-grep`. Plain `grep` is fine for strings, comments, config, and UI copy. Full guide, examples, and the default-export gotcha: [docs/ai/code-navigation.md](docs/ai/code-navigation.md).

## Unified Theme System

`@safe-global/theme` is the single source of truth for all design tokens (colors, spacing, typography, radius) across web and mobile — always use theme tokens instead of hard-coded values. Web consumes the theme as CSS variables (→ Tailwind utilities), not a JS theme object; read a palette in JS (`@safe-global/theme/palettes`) only for non-CSS consumers (canvas, QR codes, meta tags, third-party widgets). Mobile consumes Tamagui tokens. Token rules and the modification workflow: [packages/AGENTS.md](packages/AGENTS.md).

## General Principles

- Prefer DRY, functional, declarative code – pure functions, derived state, and `map`/`filter`/`reduce` over duplication, side effects, and manual state synchronization
- Never use the `any` type!
- Treat code comments as tech debt! Add them only when really necessary & the code at hand is hard to understand.
- **Use sentence case for UI text** – Buttons, headings, labels, warnings, and other UI copy should use sentence case (e.g., "Add new owner") not Title Case (e.g., "Add New Owner")

Web-specific principles live in [apps/web/AGENTS.md](apps/web/AGENTS.md); mobile-specific ones in [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md).

## Testing Requirements

Every behavioral change must include tests — each platform's file defines the exact matrix and exemptions (see the Test Decision Matrix in [apps/web/AGENTS.md](apps/web/AGENTS.md) for web). Suggest developer-owned tests (unit / component / integration) before reaching for QA automation — the full rule lives in the Web Testing section of [apps/web/AGENTS.md](apps/web/AGENTS.md). Web conventions, templates, and mock patterns: [apps/web/docs/TESTING.md](apps/web/docs/TESTING.md).

## Workflow

### Fast Feedback Loop

Verify your changes with the repo's `verify` scripts before committing — running them is your responsibility:

1. **Scoped check**: `yarn verify:changed` type-checks, lints, prettier-checks and tests changed files — **for `apps/web/` only. It does not auto-detect the workspace**: it defaults to web and silently skips files outside `apps/<workspace>/`, so a mobile-, web-tanstack-, packages-, or config-only change gets a false green pass. Other workspaces: `node scripts/verify.mjs --changed --workspace=mobile|web-tanstack`. For `packages/` changes see [packages/AGENTS.md](packages/AGENTS.md); for `config/` changes see [config/AGENTS.md](config/AGENTS.md). (`SKIP_VERIFY=1` skips verify entirely — only with the user's explicit say-so.)

2. **Full check**: Run `yarn verify:web` for a full check before committing.

3. **Test scaffolding**: Run `yarn workspace @safe-global/web test:scaffold <file>` to generate a test skeleton with the correct imports, mocks, and structure.

**Rules for agents:**

- Run the scoped check for the workspace you changed and fix all errors before moving on
- If a significant code change has no colocated unit test, write one before committing
- Do NOT run type-check, lint, prettier, and test separately — `verify` runs them all; it only **checks** formatting (never writes), so if it reports formatting errors, run `yarn prettier:fix` once and re-check. **CI rejects unformatted code.**
- Do NOT commit without a clean scoped-check pass

### Pre-implementation regression checklist (REQUIRED)

Before writing code for any non-trivial change (anything beyond a typo, doc tweak, or single-line local fix), you MUST produce a regression checklist and include it in your response to the user. Optimise for **impact analysis**, not diff completion: a change to a shared hook, selector, component, slice, or API endpoint touches many user journeys, and plain text search is not enough to find them.

**Build the checklist in this order:**

1. **Map the surface.** Identify what you are touching: the primary file(s), plus any shared hooks, components, selectors, Redux slices, RTK Query endpoints, feature flags, routes, or persisted state involved.
2. **Find consumers with symbol-aware search** — LSP `findReferences`, not plain text search (see [Code search](#code-search) above).
3. **Translate consumers into flows.** For each consumer, name the user journey it belongs to (create / edit / delete / retry / empty / error / offline / permission / feature-flag-off / mobile variant).
4. **List tests to add or run.** Happy path, each neighbouring flow, regression-sensitive paths, and invariant properties. Prefer targeted tests around shared contracts over broad E2E sweeps.
5. **State what you will NOT verify.** Be explicit. This exposes false confidence.

**Required checklist format (paste into your response before implementing):**

```
### Regression checklist

**Primary flow changed:** <one sentence>

**Surfaces touched:**
- <shared hook / component / selector / slice / endpoint / flag / route>

**Neighbouring flows to verify:**
- <flow A> — <why it could be affected>
- <flow B> — <why it could be affected>

**Tests to add/run:**
- <test name or description>

**Not verified (risks):**
- <what you are skipping and why>
```

**Rules:**

- Do NOT start editing code until this checklist exists in the conversation. For small, strictly local changes, a one-line "local change, no shared surfaces touched" note is sufficient.
- When you open the PR, carry the relevant lines into the "Affected flows", "Blast radius", and "Risks / not checked" fields of the PR template.
- If the checklist reveals that a shared abstraction has many unknown consumers, slow down and investigate before coding — that is the signal this process is designed to surface.

### Commit and PR conventions

1. **Pre-commit hooks** (Husky): **pre-commit** runs `lint-staged` (**prettier only — no type-check at commit time**); **pre-push** runs linting (set `RUN_TESTS_ON_PUSH=true` to also run tests).

2. **Commit messages**: use [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/) as described in `CONTRIBUTING.md`.
   - Examples: `feat: add transaction history`, `fix: resolve wallet connection bug`, `refactor: simplify address validation`
   - **CI/CD changes**: Always use `chore:` prefix for CI, workflows, build configs (NEVER `feat:` or `fix:`)
   - **Test changes**: Always use `tests:` prefix for changes in unit or e2e tests (NEVER `feat:` or `fix:`)

3. **Code style**: follow the guidelines in:
   - `apps/web/docs/code-style.md` for the web app.
   - `apps/mobile/docs/code-style.md` for the mobile app.

4. **Pull requests**: fill out the GitHub PR template (`.github/PULL_REQUEST_TEMPLATE.md`) completely — "What it solves", "How this PR fixes it", "How to test it", and the checklist — and ensure all checks pass.

5. **PR visual summary (required)**: Every PR must include a visual in the `## Visual summary` section. This is mandatory, not optional.
   - **Architecture/logic changes** → Mermaid diagram (flowchart, sequence, or class diagram) showing what changed — GitHub renders mermaid natively
   - **UI changes** → Screenshot of the result (use Chrome DevTools MCP if the app is running, or describe how to capture manually)
   - **Both** if the PR includes UI + logic changes

## Testing Guidelines

### Unit Tests

- When writing Redux tests, verify resulting state changes rather than checking that specific actions were dispatched.
- **Avoid `any` type assertions** – create properly typed test helpers instead of using `as any` (templates in [apps/web/docs/TESTING.md](apps/web/docs/TESTING.md)).
- Use [Mock Service Worker](https://mswjs.io/) (MSW) for tests involving network requests instead of mocking `fetch`. Use MSW for mocking blockchain RPC calls instead of mocking ethers.js directly
- Create test data with helpers using [faker](https://fakerjs.dev/)
- Test files should be colocated with source files using the `*.test.ts(x)` naming convention

## Security & Safe Wallet Patterns

Safe is a smart contract wallet requiring M-of-N owner signatures (the **threshold**) to execute transactions.

- **Chain-Specific Safes** – Safe addresses are unique per chain; always include chainId when referencing a Safe
- **Transaction Building** – Use the Safe SDK (`@safe-global/protocol-kit`, `@safe-global/api-kit`) for transaction creation; validate addresses with ethers.js `isAddress`
- **Never hardcode private keys or sensitive data** – Use environment variables and secure key management

## Common Pitfalls

Cross-cutting mistakes to avoid. Web-specific pitfalls live in [apps/web/AGENTS.md](apps/web/AGENTS.md#web-specific-common-pitfalls); mobile-specific ones in [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md#mobile-specific-common-pitfalls).

1. **Breaking mobile when changing shared code** – `packages/**` affects both web and mobile, and app verify scripts don't cover it — see [packages/AGENTS.md](packages/AGENTS.md).
2. **Modifying generated files** – never hand-edit generated files under `packages/` (contract types, `AUTO_GENERATED/`); regeneration commands in [packages/AGENTS.md](packages/AGENTS.md).
3. **Not handling chain-specific logic** – Always consider multi-chain scenarios.
4. **Incomplete error handling** – Always handle loading, error, and empty states in UI components.
