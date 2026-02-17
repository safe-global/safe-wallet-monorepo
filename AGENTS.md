# AI Contributor Guidelines

This repository is the Safe{Wallet} monorepo, containing both web and mobile applications for Safe (formerly Gnosis Safe), a multi-signature smart contract wallet on Ethereum and other EVM chains. The repository uses a Yarn 4 workspace-based monorepo structure. Follow these rules when proposing changes via an AI agent.

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

## Architecture Overview

- **apps/web** - Next.js web application
- **apps/mobile** - Expo/React Native mobile application
- **packages/** - Shared libraries (store, utils, etc.) used by both platforms
- **config/** - Shared configuration files

The monorepo uses **Yarn 4 workspaces** to manage dependencies and enables sharing code between web and mobile applications.

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

Specifically for the web app:

- New features must be created in a separate folder inside `src/features/` – only components, hooks, and services used globally across many features belong in top-level folders inside `src/`
- **All features must follow the standard feature architecture pattern** – See `apps/web/docs/feature-architecture.md` for the complete guide including folder structure, feature flags, lazy loading, and public API patterns
- Each new feature must be behind a feature flag (stored on the CGW API in chains configs)
- When making a new component, create a Storybook story file for it
- Use theme variables from vars.css instead of hard-coded CSS values
- Use MUI components and the Safe MUI theme

### Feature Architecture Import Rules

Features use a lazy-loading architecture to optimize bundle size. ESLint warns about these import restrictions (warnings until all features are migrated):

**Allowed Imports:**

```typescript
import { MyFeature, useMyHook } from '@/features/myfeature' // Feature handle + hooks (direct exports)
import { someSlice, selectSomething } from '@/features/myfeature/store' // Redux store
import type { MyType } from '@/features/myfeature/types' // Public types
```

**Forbidden Imports (ESLint will warn):**

```typescript
// ❌ NEVER import components directly - defeats lazy loading
import { MyComponent } from '@/features/myfeature/components'
import MyComponent from '@/features/myfeature/components/MyComponent'

// ❌ NEVER import hooks from internal folder - use index.ts export
import { useMyHook } from '@/features/myfeature/hooks/useMyHook'

// ❌ NEVER import internal service files - use useLoadFeature
import { heavyService } from '@/features/myfeature/services/heavyService'
```

**Accessing Feature Exports:**

Use the `useLoadFeature` hook for components and services. Import hooks directly:

```typescript
import { useLoadFeature } from '@/features/__core__'
import { MyFeature, useMyHook } from '@/features/myfeature'

// Prefer destructuring for cleaner component usage
function ParentComponent() {
  const { MyComponent } = useLoadFeature(MyFeature)
  const hookData = useMyHook()  // Direct import, always safe

  // No null check needed - always returns an object
  // Components render null when not ready (proxy stub)
  // Services are undefined when not ready (check $isReady before calling)
  return <MyComponent />
}

// For explicit loading/disabled states:
function ParentWithStates() {
  const { MyComponent, $isReady, $isDisabled } = useLoadFeature(MyFeature)

  if ($isDisabled) return null
  if (!$isReady) return <Skeleton />

  return <MyComponent />
}
```

**feature.ts Pattern (IMPORTANT):**

Use **direct imports** with a **flat structure** - do NOT use `lazy()` or nested categories. **NO hooks in feature.ts**:

```typescript
// feature.ts - This file is already lazy-loaded via createFeatureHandle
import MyComponent from './components/MyComponent'
import { myService } from './services/myService'

// ✅ CORRECT: Flat structure, NO hooks
export default {
  MyComponent, // PascalCase → component (stub renders null)
  myService, // camelCase → service (undefined when not ready - check $isReady before calling)
  // NO hooks here!
}

// index.ts - Hooks exported directly (always loaded, not lazy)
export const MyFeature = createFeatureHandle<MyFeatureContract>('my-feature')
export { useMyHook } from './hooks/useMyHook' // Direct export, always loaded
```

```typescript
// ❌ WRONG - Don't use nested categories
export default {
  components: { MyComponent }, // ❌ No nesting!
}

// ❌ WRONG - Don't use lazy() inside feature.ts
export default {
  MyComponent: lazy(() => import('./components/MyComponent')), // ❌
}

// ❌ WRONG - Don't include hooks in feature.ts
export default {
  MyComponent,
  useMyHook, // ❌ Violates Rules of Hooks when lazy-loaded!
}
```

**Hooks Pattern:** Hooks are exported directly from `index.ts` (always loaded, not lazy) to avoid Rules of Hooks violations. Keep hooks lightweight with minimal imports. Put heavy logic in services (lazy-loaded).

See `apps/web/docs/feature-architecture.md` for the complete guide including proxy-based stubs and meta properties (`$isDisabled`, `$isReady`, `$error`).

## Workflow

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

### E2E Tests (Web only)

- Located in `apps/web/cypress/e2e/`
- **IMPORTANT**: Follow the Cypress E2E automation rules in `.cursor/rules/cypress-e2e.mdc` when writing or modifying tests
- Run with `yarn workspace @safe-global/web cypress:open` for interactive mode
- Run with `yarn workspace @safe-global/web cypress:run` for headless mode
- Smoke tests in `cypress/e2e/smoke/` are run in CI

### Test Coverage

- Aim for comprehensive test coverage of business logic and critical paths
- Run `yarn workspace @safe-global/web test:coverage` to generate coverage reports
- Coverage reports help identify untested code paths

## Mobile Development (Expo + Tamagui)

- **UI Components** – Use Tamagui components for styling and theming. Import from `tamagui` not React Native directly when possible.
- **Theme System** – Follow the custom theme configuration in `src/theme/tamagui.config.ts`. Use theme tokens like `$background`, `$primary`, etc.
- **Component Structure** – Follow container/presentation pattern. See `apps/mobile/docs/code-style.md` for detailed component organization.
- **Font Management** – Use the configured DM Sans font family. Custom icons go through `SafeFontIcon` component.
- **Expo Plugins** – Custom Expo config plugins are in the `expo-plugins/` directory.

## Shared Packages

- **Cross-Platform Code** – Shared logic goes in `packages/` directory. Consider both web and mobile when making changes.
- **Environment Handling** – Use dual environment variable patterns (`NEXT_PUBLIC_*` || `EXPO_PUBLIC_*`) in shared packages.
- **Store Management** – Redux store is shared between web and mobile. State changes should work for both platforms.

## Storybook (Web only)

Storybook is used for developing and documenting UI components in isolation.

### Running Storybook

```bash
yarn workspace @safe-global/web storybook
# Runs on http://localhost:6006
```

### Creating Stories

#### Simple Component Stories

For simple components that don't need API mocking, create a basic `.stories.tsx` file:

```typescript
// Example: MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from './MyComponent'

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // component props
  },
}
```

#### Component Stories with Redux

For components that use Redux hooks (`useAppSelector`, `useDispatch`, RTK Query) but don't need full API mocking, wrap with `withMockProvider()`:

```typescript
import { withMockProvider } from '@/storybook/preview'

const meta = {
  title: 'Features/MyFeature/MyComponent',
  component: MyComponent,
  decorators: [withMockProvider()],
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>
```

For detailed Storybook patterns, context error reference, MSW fixtures, and the full provider stack, see `apps/web/.storybook/AGENTS.md`.

#### Page/Widget Stories with API Mocking

For pages, widgets, or components that need Redux state and API mocking, use the `createMockStory` factory from `@/stories/mocks`:

```typescript
// Example: Dashboard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Dashboard from './index'

// Create mock setup with configuration
// Note: portfolio, positions, and swaps are enabled by default - only specify features to disable them
const defaultSetup = createMockStory({
  scenario: 'efSafe', // Data scenario: 'efSafe' | 'vitalik' | 'empty' | 'spamTokens' | 'safeTokenHolder'
  wallet: 'disconnected', // Wallet state: 'disconnected' | 'connected' | 'owner' | 'nonOwner'
  layout: 'none', // Layout: 'none' | 'paper' | 'fullPage'
})

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters, // Includes MSW handlers and Next.js router mock
  },
  decorators: [defaultSetup.decorator], // Provides Redux, Wallet, SDK, TxModal contexts
  tags: ['autodocs'],
} satisfies Meta<typeof Dashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Override configuration per story
export const WithLayout: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'connected',
    layout: 'fullPage',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
```

#### createMockStory Configuration Options

| Option     | Type                                                                          | Default                                             | Description                                   |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `scenario` | `'efSafe' \| 'vitalik' \| 'empty' \| 'spamTokens' \| 'safeTokenHolder'`       | `'efSafe'`                                          | Data fixture scenario                         |
| `wallet`   | `'disconnected' \| 'connected' \| 'owner' \| 'nonOwner'`                      | `'disconnected'`                                    | Wallet connection state                       |
| `features` | `{ portfolio?, positions?, swaps?, recovery?, hypernative?, earn?, spaces? }` | `{ portfolio: true, positions: true, swaps: true }` | Chain feature flags (only specify to disable) |
| `layout`   | `'none' \| 'paper' \| 'fullPage'`                                             | `'none'`                                            | Layout wrapper                                |
| `store`    | `object`                                                                      | `{}`                                                | Redux store overrides                         |
| `handlers` | `RequestHandler[]`                                                            | `[]`                                                | Additional MSW handlers                       |
| `pathname` | `string`                                                                      | `'/home'`                                           | Router pathname                               |

#### Escape Hatch for Custom Composition

For advanced cases, import individual utilities:

```typescript
import {
  MockContextProvider,
  createChainData,
  createInitialState,
  getFixtureData,
  resolveWallet,
  coreHandlers,
  balanceHandlers,
} from '@/stories/mocks'
```

### Story Guidelines

- Place story files next to the component they document
- Use descriptive story names (Default, WithError, Loading, etc.)
- Include all important component states and variations
- Use the `autodocs` tag for automatic documentation generation
- Story files are located throughout `apps/web/src/` alongside components
- **For pages/widgets**: Use `createMockStory` to avoid duplicating mock setup code
- **For simple components**: Use basic story format without mocking utilities
- **Do not override feature flags** unless testing a specific disabled feature state (e.g., `features: { swaps: false }` to test no-swap UI). The defaults (`portfolio: true`, `positions: true`, `swaps: true`) should be used for most stories.

#### Transaction Mocking (Known Limitation)

Transaction page stories (Queue, History) have basic MSW handlers but **transaction mocking is not fully working** and requires further work. Current limitations:

- Transaction details use `txData: null` to avoid "Error parsing data" errors in the Receipt component
- Expanding transaction details may show incomplete data or errors
- The CGW staging API (`safe-client.staging.5afe.dev`) can be used to fetch real fixture data, but the complex `txData` structure causes parsing issues in the UI components

To improve transaction mocking, the `txData` structure in `handlers.ts` would need to match what the Receipt/Summary components expect, which requires deeper investigation of the CGW response format.

#### Decorator Stacking Warning

**IMPORTANT**: Storybook decorators stack - story-level decorators are added to meta-level decorators, they don't replace them. If you define a decorator at the meta level AND override it at the story level, both will run, which can cause duplicate layouts or elements.

**Problem example** (causes two layouts to render):

```typescript
const defaultSetup = createMockStory({ scenario: 'efSafe', layout: 'fullPage' })

const meta = {
  decorators: [defaultSetup.decorator], // Meta-level decorator
} satisfies Meta<typeof MyPage>

export const Empty: Story = (() => {
  const setup = createMockStory({ scenario: 'empty', layout: 'fullPage' })
  return {
    decorators: [setup.decorator], // ❌ This ADDS to meta decorator, doesn't replace!
  }
})()
```

**Solution**: If you need different configurations per story, don't define decorators at the meta level:

```typescript
const meta = {
  title: 'Pages/MyPage',
  component: MyPage,
  loaders: [mswLoader],
  parameters: { layout: 'fullscreen' },
  // No decorators here!
} satisfies Meta<typeof MyPage>

export const Default: Story = (() => {
  const setup = createMockStory({ scenario: 'efSafe', layout: 'fullPage' })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator], // ✅ Only decorator, no stacking
  }
})()

export const Empty: Story = (() => {
  const setup = createMockStory({ scenario: 'empty', layout: 'fullPage' })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator], // ✅ Only decorator, no stacking
  }
})()
```

### Chromatic Visual Regression Testing

Chromatic is integrated for visual regression testing. It automatically captures snapshots of all stories in both light and dark themes.

- **Workflow**: Runs automatically on PRs affecting `apps/web/**` or `packages/**`
- **TurboSnap**: Only stories affected by code changes are re-snapshotted
- **Theme modes**: Both light and dark themes are captured automatically
- **PR checks**: Chromatic posts status checks with links to visual diffs

To run locally (set `CHROMATIC_PROJECT_TOKEN` in `.env.local`):

```bash
yarn workspace @safe-global/web chromatic
```

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

Avoid these common mistakes when contributing:

1. **Using `any` type** – Always properly type your code, create interfaces/types as needed
2. **Forgetting to run tests** – Always run tests before committing (`yarn workspace @safe-global/web test`)
3. **Breaking mobile when changing shared code** – Shared packages (`packages/**`) affect both web and mobile
4. **Hardcoding values** – Use theme variables from `vars.css` (web) or Tamagui tokens (mobile)
5. **Modifying generated files** – Files in `packages/utils/src/types/contracts/` are auto-generated from ABIs
6. **Not handling chain-specific logic** – Always consider multi-chain scenarios
7. **Skipping Storybook stories** – New components should have stories for documentation
8. **Incomplete error handling** – Always handle loading, error, and empty states in UI components
9. **Using lazy() or nested structure in feature.ts** – The `feature.ts` file is already lazy-loaded via `createFeatureHandle`. Do NOT add `lazy()` calls for individual components, and do NOT use nested categories (`components`, `hooks`, `services`). Use a flat structure with direct imports. Naming conventions determine stub behavior: `useSomething` → hook, `PascalCase` → component, `camelCase` → service.
10. **Using lazy loading inside features** – The entire feature is lazy-loaded by default via `createFeatureHandle`. Do NOT use `lazy()`, `dynamic()`, or any other lazy-loading mechanism inside the feature (not in `feature.ts`, not in components, not anywhere). All components and services inside a feature should use direct imports with a flat structure.

## Debugging Tips

- **Type errors**: Run `yarn workspace @safe-global/web type-check` to see all TypeScript errors
- **Test failures**: Run tests in watch mode with `yarn workspace @safe-global/web test --watch`
- **RPC issues**: Check that `INFURA_TOKEN` or other RPC provider env vars are set correctly
- **Build errors**: Check `.next` cache – sometimes `rm -rf apps/web/.next` helps
- **Storybook issues**: Try `rm -rf node_modules/.cache/storybook`

## Code Complexity Guidelines

When writing utility scripts or complex logic, follow these patterns to keep cyclomatic complexity low:

### Prevent High Complexity

1. **Use lookup tables instead of conditional chains**

   ```typescript
   // ❌ Bad: 5+ if-else conditions
   if (type === 'a') doA()
   else if (type === 'b') doB()
   else if (type === 'c') doC()

   // ✅ Good: Lookup table
   const handlers = { a: doA, b: doB, c: doC }
   handlers[type]?.()
   ```

2. **Extract helper functions for nested conditions**

   ```typescript
   // ❌ Bad: 3+ levels of nesting
   if (condition1) {
     if (condition2) {
       if (condition3) {
         /* ... */
       }
     }
   }

   // ✅ Good: Early returns + helpers
   if (!condition1) return
   if (!condition2) return
   handleCondition3()
   ```

3. **Use switch for type discrimination**

   ```typescript
   // ❌ Bad: Multiple type checks
   if (obj.type === 'a') { ... }
   else if (obj.type === 'b') { ... }

   // ✅ Good: Switch statement
   switch (obj.type) {
     case 'a': return handleA()
     case 'b': return handleB()
   }
   ```

4. **Keep functions under 20 lines** – Extract when longer
5. **Maximum 3 levels of nesting** – Refactor if deeper
6. **Single responsibility** – One function, one job
