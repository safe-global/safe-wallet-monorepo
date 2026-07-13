# AI Contributor Guidelines

This repository is the Safe{Wallet} monorepo, containing both web and mobile applications for Safe (formerly Gnosis Safe), a multi-signature smart contract wallet on Ethereum and other EVM chains. The repository uses a Yarn 4 workspace-based monorepo structure. Follow these rules when proposing changes via an AI agent.

## Nested guidance

This monorepo uses nested AGENTS.md files. Agents working in a subtree automatically load the nearest one. Start at root for cross-cutting rules, then drop into the relevant subtree:

| Subtree                | File                                                           | Covers                                                     |
| ---------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/web/`            | [apps/web/AGENTS.md](apps/web/AGENTS.md)                       | Feature architecture, Storybook, web testing, web pitfalls |
| `apps/web/cypress/`    | [apps/web/cypress/AGENTS.md](apps/web/cypress/AGENTS.md)       | Cypress E2E patterns (legacy — no new tests)               |
| `apps/web/e2e/`        | [apps/web/e2e/docs/README.md](apps/web/e2e/docs/README.md)     | **Playwright E2E — all new tests go here**                 |
| `apps/web/.storybook/` | [apps/web/.storybook/AGENTS.md](apps/web/.storybook/AGENTS.md) | Storybook fixtures and provider patterns                   |
| `apps/mobile/`         | [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md)                 | Expo + Tamagui                                             |
| `packages/`            | [packages/AGENTS.md](packages/AGENTS.md)                       | Shared packages, dual env vars                             |

When adding new guidance, place it in the most-specific subtree it applies to.

## Quick Start

Common commands for getting started:

```bash
# Install dependencies (uses Yarn 4 via corepack)
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

## Turborepo

Root-level `lint`, `type-check`, and `test` run through [Turborepo](https://turborepo.com). Tasks are cached by input hash and re-used on subsequent runs — locally and in CI.

```bash
yarn type-check                                   # all workspaces (cached)
yarn turbo run type-check --filter=@safe-global/web    # scoped
yarn turbo run test --filter=@safe-global/utils... # package + dependents
```

Cache directory is `.turbo/` (gitignored). Task definitions live in `turbo.json`.

### Remote cache

CI reads `TURBO_TOKEN` (repo secret) and `TURBO_TEAM` (repo variable) via `.github/actions/yarn`. These must be configured once per Vercel team:

1. Create or pick a Vercel team; copy the team slug → set repo variable `TURBO_TEAM`.
2. Create a Vercel personal access token with access to that team → set repo secret `TURBO_TOKEN`.
3. Locally: `yarn turbo login && yarn turbo link` to enable remote cache in development.

Self-hosted cache (e.g. [ducktors/turborepo-remote-cache](https://github.com/ducktors/turborepo-remote-cache)) can be wired by setting `TURBO_API`, `TURBO_TOKEN`, `TURBO_TEAM` — the same env vars the Vercel backend uses.

## Architecture Overview

- **apps/web** - Next.js web application
- **apps/mobile** - Expo/React Native mobile application
- **packages/** - Shared libraries (store, utils, etc.) used by both platforms
- **config/** - Shared configuration files

The monorepo uses **Yarn 4 workspaces** to manage dependencies and enables sharing code between web and mobile applications.

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

### AST-Based Code Search

If `ast-grep` (aka `sg`) is installed, prefer it over text-based grep for structural code searches. It understands TypeScript/TSX syntax so it won't match inside comments or strings.

```bash
# Find all components using useAppSelector
sg -p 'useAppSelector($$$)' --lang tsx apps/web/src/

# Find all createSlice calls
sg -p 'createSlice({ name: $NAME, $$$})' --lang ts apps/web/src/

# Find all default exports of a function component
sg -p 'export default function $NAME($$$) { $$$}' --lang tsx apps/web/src/

# Find useMemo with specific dependency
sg -p 'useMemo(() => $$$, [$$$, chainId, $$$])' --lang tsx apps/web/src/
```

Install: `brew install ast-grep` or `npm install -g @ast-grep/cli`

### TypeScript LSP (symbol-aware navigation)

When available in your agent environment, the `LSP` tool exposes the TypeScript language server and indexes the entire monorepo (`apps/` + `packages/`, ~40k+ symbols). Use it for any question about **what a symbol is** or **who uses it** — it follows imports, re-exports, and module resolution, and ignores matches in comments and strings. This is strictly more accurate than `grep` for symbol-level questions, and complements `ast-grep` (which is best for structural pattern matching).

**When to reach for LSP (strongly preferred over `grep`):**

- "Who consumes this hook / component / selector / slice / endpoint / type?" → `findReferences`
- "Where is this symbol defined?" → `goToDefinition`
- "What are all implementations of this interface?" → `goToImplementation`
- "What's the exported API of this file?" → `documentSymbol`
- "Does a symbol named X exist anywhere, and where?" → `workspaceSymbol`
- "Who calls this function, and whom does it call?" → `prepareCallHierarchy` + `incomingCalls` / `outgoingCalls`
- "What type is this expression?" → `hover`

**When to reach for `ast-grep` instead:**

- Structural patterns, not symbol identity. E.g. "every `useMemo` whose deps array contains `chainId`", "every call to `createSlice` with a given shape".

**When plain `grep` is still fine:**

- Searching strings, comments, config, copy/UI text, file names, or anything that isn't a TS/TSX identifier.

**Gotcha — default exports:** For files that use `export default`, target the identifier on the `export default` line, not the local `const`/`function` binding, or you will miss all the importing consumers. Example: for `apps/web/src/hooks/useSafeInfo.ts`, aiming `findReferences` at the local `const useSafeInfo` binding returns ~2 refs; aiming at `export default useSafeInfo` returns 500+ refs across the codebase. For named exports this does not matter.

**All operations take:** `filePath`, `line` (1-based), `character` (1-based), `operation`.

```
# Examples
operation=documentSymbol  filePath=apps/web/src/hooks/useSafeInfo.ts  line=1 character=1
operation=findReferences  filePath=apps/web/src/hooks/useSafeInfo.ts  line=29 character=16  # the "default" identifier
operation=goToDefinition  filePath=apps/web/src/hooks/useSafeInfo.ts  line=4  character=10  # selectSafeInfo import
operation=workspaceSymbol filePath=<any .ts file>                     line=1  character=1   # index-wide symbol search
```

**Cost note:** `workspaceSymbol` with an empty/broad query returns tens of thousands of entries (1.7 MB+) and will be truncated to a persisted file — use it with a specific query, or prefer `findReferences` / `goToDefinition` starting from a known site.

## Unified Theme System

The project uses `@safe-global/theme` package as a single source of truth for all design tokens (colors, spacing, typography, radius) across web and mobile.

### Key Features

- **Unified Palettes**: Light and dark mode color palettes shared between platforms
- **Dual Spacing Systems**: 4px base for mobile, 8px base for web (with overlapping values using same names)
- **Platform Generators**: Automatic generation of MUI themes (web) and Tamagui tokens (mobile)
- **Static Colors**: Theme-independent brand colors available to both platforms

### Usage

**Web (MUI)**:

```typescript
import { generateMuiTheme } from '@safe-global/theme'

const theme = generateMuiTheme('light') // or 'dark'
```

**Mobile (Tamagui)**:

```typescript
import { generateTamaguiTokens, generateTamaguiThemes } from '@safe-global/theme'

const tokens = generateTamaguiTokens()
const themes = generateTamaguiThemes()
```

**Direct Token Access**:

```typescript
import { lightPalette, darkPalette, spacingMobile, spacingWeb, typography } from '@safe-global/theme'
```

### Modifying Theme

To add or modify colors/tokens:

1. Edit files in `packages/theme/src/palettes/` or `packages/theme/src/tokens/`
2. Run type-check to ensure consistency: `yarn workspace @safe-global/theme type-check`
3. Regenerate CSS vars for web: `yarn workspace @safe-global/web css-vars`

### Important Notes

- Never edit `apps/web/src/styles/vars.css` directly - it's auto-generated
- Always use theme tokens instead of hard-coded colors
- Both light and dark modes must be updated together for consistency

## General Principles

- Follow the DRY principle – avoid code duplication by extracting reusable functions, hooks, and components
- Prefer functional code over imperative – use pure functions, avoid side effects, leverage `map`/`filter`/`reduce` instead of loops
- Use declarative and reactive patterns – prefer React hooks, derived state, and data transformations over manual state synchronization
- Always cover new logic, services, and hooks with unit tests
- Run type-check, lint, prettier and unit tests before each commit
- Never use the `any` type!
- Treat code comments as tech debt! Add them only when really necessary & the code at hand is hard to understand.
- **Use sentence case for UI text** – Buttons, headings, labels, warnings, and other UI copy should use sentence case (e.g., "Add new owner") not Title Case (e.g., "Add New Owner")

Web-specific principles (feature architecture, MUI theme, vars.css, feature flags, Storybook story requirement) live in [apps/web/AGENTS.md](apps/web/AGENTS.md). Mobile-specific principles live in [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md).

## Testing Requirements

Every code change must include tests. See [`apps/web/docs/TESTING.md`](apps/web/docs/TESTING.md) for conventions, templates, and mock patterns.

## Workflow

### Fast Feedback Loop

Verify your changes with the repo's `verify` scripts before committing — running them is your responsibility:

1. **Scoped check**: Run `yarn verify:changed:web` (or `yarn verify:changed` from the repo root) to type-check the project and run lint, prettier, and tests scoped to your changed files. The workspace (web/mobile) is auto-detected from the changed file paths.

2. **Full check**: Run `yarn verify:web` for a full check before committing.

3. **Test scaffolding**: Run `yarn test:scaffold <file>` to generate a test skeleton with the correct imports, mocks, and structure. See the Test Decision Matrix in the Testing Guidelines section for which files need tests.

**Rules for agents:**

- Run `verify:changed` and fix all errors before moving on
- If a significant code change has no colocated unit test, write one before committing
- Do NOT run type-check, lint, prettier, and test separately — use `verify`
- Do NOT commit without a clean `verify:changed` pass

### Pre-implementation regression checklist (REQUIRED)

Before writing code for any non-trivial change (anything beyond a typo, doc tweak, or single-line local fix), you MUST produce a regression checklist and include it in your response to the user. Optimise for **impact analysis**, not diff completion: a change to a shared hook, selector, component, slice, or API endpoint touches many user journeys, and plain text search is not enough to find them.

**Build the checklist in this order:**

1. **Map the surface.** Identify what you are touching: the primary file(s), plus any shared hooks, components, selectors, Redux slices, RTK Query endpoints, feature flags, routes, or persisted state involved.
2. **Find consumers with symbol-aware search.** For "who uses this symbol?" questions, prefer the `LSP` tool's `findReferences` (see "TypeScript LSP" above) — it follows imports, re-exports, and module resolution across the whole monorepo. Use `ast-grep` for structural pattern questions (e.g. "every `useMemo` with `chainId` in deps"). Fall back to plain `grep` only for strings, comments, config, or UI copy. Plain text search misses structural usages, matches inside comments/strings, and does not follow re-exports.
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

1. **Install dependencies**: `yarn install` (from the repository root).
   - Uses Yarn 4 (managed via `corepack`)
   - Automatically runs `yarn after-install` for the web workspace, which generates TypeScript types from contract ABIs

2. **Pre-commit hooks**: The repository uses Husky for git hooks:
   - **pre-commit**: Automatically runs `lint-staged` (prettier) and type-check on staged TypeScript files
   - **pre-push**: Runs linting before pushing
   - These hooks ensure code quality before commits reach the repository
   - **If hooks fail**: Fix the reported issues and try committing again. Common issues:
     - Type errors: Run `yarn workspace @safe-global/web type-check` to see all errors
     - Formatting: Run `yarn prettier:fix` to auto-fix
     - Linting: Run `yarn workspace @safe-global/web lint:fix` to auto-fix where possible

3. **Formatting (CRITICAL)**: **ALWAYS** run `yarn prettier:fix` before staging and committing. Do NOT rely on lint-staged alone — it can miss formatting issues due to stash/restore edge cases. Run it explicitly:

   ```bash
   yarn prettier:fix
   ```

   Then verify with `yarn workspace @safe-global/web prettier` (the check-only command). **CI will reject unformatted code.**

4. **Linting and tests**: when you change any source code under `apps/` or `packages/`, execute, for web:

   ```bash
   yarn workspace @safe-global/web type-check
   yarn workspace @safe-global/web lint
   yarn workspace @safe-global/web prettier   # verify formatting (CI runs this)
   yarn workspace @safe-global/web test
   ```

   For mobile:

   ```bash
   yarn workspace @safe-global/mobile type-check
   yarn workspace @safe-global/mobile lint
   yarn workspace @safe-global/mobile prettier
   yarn workspace @safe-global/mobile test
   ```

5. **Commit messages**: use [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/) as described in `CONTRIBUTING.md`.
   - Examples: `feat: add transaction history`, `fix: resolve wallet connection bug`, `refactor: simplify address validation`
   - **CI/CD changes**: Always use `chore:` prefix for CI, workflows, build configs (NEVER `feat:` or `fix:`)
   - **Test changes**: Always use `tests:` prefix for changes in unit or e2e tests (NEVER `feat:` or `fix:`)

6. **Code style**: follow the guidelines in:
   - `apps/web/docs/code-style.md` for the web app.
   - `apps/mobile/docs/code-style.md` for the mobile app.

7. **Pull requests**: fill out the PR template and ensure all checks pass.

8. **PR description**: Always use the GitHub PR template (`.github/PULL_REQUEST_TEMPLATE.md`). Fill out all sections — "What it solves", "How this PR fixes it", "How to test it", and the checklist.

9. **PR visual summary (required)**: Every PR must include a visual in the `## Visual summary` section. This is mandatory, not optional.
   - **Architecture/logic changes** → Mermaid diagram (flowchart, sequence, or class diagram) showing what changed
   - **UI changes** → Screenshot of the result (use Chrome DevTools MCP if the app is running, or describe how to capture manually)
   - **Both** if the PR includes UI + logic changes

   Mermaid diagrams are rendered natively by GitHub. Example:

   ````markdown
   ```mermaid
   flowchart LR
     A[useSafeInfo hook] --> B[New validation logic]
     B --> C{Is owner?}
     C -->|Yes| D[Show actions]
     C -->|No| E[Show read-only]
   ```
   ````

   For refactors, use a before/after diagram:

   ````markdown
   ```mermaid
   flowchart TB
     subgraph Before
       A1[Component A] --> B1[Inline logic]
       A1 --> C1[Inline logic]
     end
     subgraph After
       A2[Component A] --> H[useSharedHook]
       H --> B2[Extracted service]
     end
   ```
   ````

**Environment Variables** – Web apps use `NEXT_PUBLIC_*` prefix, mobile apps use `EXPO_PUBLIC_*` prefix for environment variables. In shared packages, check for both prefixes.

## Testing Guidelines

### Unit Tests

- When writing Redux tests, verify resulting state changes rather than checking that specific actions were dispatched.
- **Avoid `any` type assertions** – Create properly typed test helpers instead of using `as any`. For example, when testing Redux slices with a minimal store, create a helper function that properly types the state:

  ```typescript
  // Good: Properly typed helper
  type TestRootState = ReturnType<ReturnType<typeof createTestStore>['getState']>
  const getSafeState = (state: TestRootState, chainId: string, safeAddress: string) => {
    return state[sliceName][`${chainId}:${safeAddress}`]
  }

  // Bad: Using 'any'
  const state = store.getState() as any
  ```

- Use [Mock Service Worker](https://mswjs.io/) (MSW) for tests involving network requests instead of mocking `fetch`. Use MSW for mocking blockchain RPC calls instead of mocking ethers.js directly
- Create test data with helpers using [faker](https://fakerjs.dev/)
- Ensure shared package tests work for both web and mobile environments
- Test files should be colocated with source files using the `*.test.ts(x)` naming convention

### Platform-specific testing

- **Web — Cypress** (legacy, no new tests): see [apps/web/AGENTS.md](apps/web/AGENTS.md#web-testing).
- **Web — Playwright** (all new E2E tests): see [apps/web/e2e/docs/README.md](apps/web/e2e/docs/README.md).
- **Mobile** (E2E guidelines, mobile test commands): see [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md#mobile-specific-testing).

### Playwright E2E Framework

All new E2E tests must be written in Playwright (`apps/web/e2e/`). Cypress is legacy — no new Cypress tests.

| Command              | Purpose                      |
| -------------------- | ---------------------------- |
| `yarn pw:test`       | Run all Playwright tests     |
| `yarn pw:test:smoke` | Run `@smoke` tests only      |
| `yarn pw:test:api`   | Run `@api` tests only        |
| `yarn pw:ci`         | CI mode — smoke with retries |

**Before writing any Playwright test, AI agents must follow the [12-step AI Test Output Format](apps/web/e2e/docs/AI_TEST_OUTPUT_FORMAT.md).** Code is step 11 of 12.

For Cypress → Playwright migration, follow the [Cypress Migration Guide](apps/web/e2e/docs/CYPRESS_MIGRATION_GUIDE.md).

### Developer-Owned Tests Rule

AI agents must always consider what developers should test before QA automation. For every changed feature, AI should suggest developer-owned tests first:

- **Unit tests** — pure functions, parsers, validators, formatters, hooks
- **Component tests** — React components render correctly with props
- **Integration tests** — hooks + stores + API mocks wired together

If a feature lacks unit and component coverage, the correct response is to flag missing developer tests — not to write a Playwright test that compensates for them. Playwright tests are the top of the pyramid, not the foundation.

See [Developer Testability Contract](apps/web/e2e/docs/developer-testability-contract.md) for the full QA-developer agreement.

## Security & Safe Wallet Patterns

Safe (formerly Gnosis Safe) is a multi-signature smart contract wallet that requires multiple signatures to execute transactions.

### Key Concepts

- **Safe Account** – A smart contract wallet requiring M-of-N signatures to execute transactions
- **Owners** – Addresses that can sign transactions for a Safe
- **Threshold** – Minimum number of signatures required to execute a transaction
- **Transaction Building** – Follow Safe SDK patterns for building multi-signature transactions using `@safe-global/protocol-kit`

### Best Practices

- **Safe Address Validation** – Always validate Ethereum addresses using established utilities (ethers.js `isAddress`)
- **Chain-Specific Safes** – Safe addresses are unique per chain; always include chainId when referencing a Safe
- **Transaction Building** – Use the Safe SDK (`@safe-global/protocol-kit`, `@safe-global/api-kit`) for transaction creation
- **Wallet Provider Integration** – Follow established patterns for wallet connection and Web3 provider setup (Web3-Onboard)
- **Never hardcode private keys or sensitive data** – Use environment variables and secure key management

## Environment Configuration

- **Local Development** – Points to staging backend by default
- **Environment Branches** – PRs get deployed automatically for testing
- **RPC Configuration** – Infura integration for Web3 RPC calls (requires `INFURA_TOKEN`)
- **Chain Configuration** – Chain configs are managed through the Safe Config Service

## Common Pitfalls

Cross-cutting mistakes to avoid. Web-specific pitfalls live in [apps/web/AGENTS.md](apps/web/AGENTS.md#web-specific-common-pitfalls); mobile-specific ones in [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md#mobile-specific-common-pitfalls).

1. **Using `any` type** – Always properly type your code, create interfaces/types as needed.
2. **Forgetting to run tests** – Always run tests before committing.
3. **Breaking mobile when changing shared code** – Shared packages (`packages/**`) affect both web and mobile.
4. **Modifying generated files** – Never manually edit auto-generated files in `packages/utils/src/types/contracts/` or `packages/store/src/gateway/AUTO_GENERATED/`. CI fails if they don't match the schema. Run `yarn workspace @safe-global/store build:dev` to regenerate the store types.
5. **Not handling chain-specific logic** – Always consider multi-chain scenarios.
6. **Incomplete error handling** – Always handle loading, error, and empty states in UI components.
