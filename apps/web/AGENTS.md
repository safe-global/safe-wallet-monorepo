# Web App AI Contributor Guidelines

Web-specific guidance for the Next.js app under `apps/web/`. For monorepo-wide rules (Turborepo, theme system, Workflow, regression checklist, Security), see the root [AGENTS.md](../../AGENTS.md). For Cypress E2E, see [cypress/AGENTS.md](cypress/AGENTS.md). For Storybook story patterns, see [.storybook/AGENTS.md](.storybook/AGENTS.md).

## Web-specific principles

- New features must be created in a separate folder inside `src/features/` – only components, hooks, and services used globally across many features belong in top-level folders inside `src/`
- **All features must follow the standard feature architecture pattern** – See [docs/feature-architecture.md](docs/feature-architecture.md) for the complete guide including folder structure, feature flags, lazy loading, and public API patterns
- Each new feature must be behind a feature flag (stored on the CGW API in chains configs)
- When making a new component, create a Storybook story file for it
- Use theme variables from vars.css instead of hard-coded CSS values
- Build UI from the shadcn/ui primitives in `@/components/ui/*` (Tailwind); MUI/Emotion are removed
- **Prefer a component's variant/size prop over one-off `className` overrides.** If you find yourself hand-rolling padding, height, border color, or hover on a `Button`/`Input`/etc., there is probably a variant for it — and if a pattern recurs, add a variant rather than repeating the classes. Watch the tokens: `--input` is white in light mode, so a visible field border needs `border-border`, not `border-input`. The `Button` and `Input` stories are the canonical variant reference; see [.storybook/AGENTS.md](.storybook/AGENTS.md#component-variants-over-custom-styling).

## Feature Architecture Import Rules

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

See [docs/feature-architecture.md](docs/feature-architecture.md) for the complete guide including proxy-based stubs and meta properties (`$isDisabled`, `$isReady`, `$error`).

## Web Testing

Cross-cutting unit-test conventions live in the root [AGENTS.md](../../AGENTS.md). The matrix and tooling below are web-specific.

### E2E Tests

Located in [cypress/e2e/](cypress/e2e/). Full conventions and patterns: [cypress/CLAUDE.md](cypress/CLAUDE.md).

| Category   | Folder            | CI                           | Purpose                                    |
| ---------- | ----------------- | ---------------------------- | ------------------------------------------ |
| Smoke      | `e2e/smoke/`      | Every PR                     | Critical path functional tests             |
| Visual     | `e2e/visual/`     | Manual (`workflow_dispatch`) | Chromatic visual regression (light + dark) |
| Regression | `e2e/regression/` | On-demand                    | Feature tests                              |
| Happy path | `e2e/happypath/`  | On-demand                    | User journey tests                         |

```bash
yarn workspace @safe-global/web cypress:open   # interactive
yarn workspace @safe-global/web cypress:run    # headless
```

Coverage report: [cypress/COVERAGE.md](cypress/COVERAGE.md)

### Test Coverage

- Aim for comprehensive test coverage of business logic and critical paths
- Run `yarn workspace @safe-global/web test:coverage` to generate coverage reports
- Coverage reports help identify untested code paths

### Test Decision Matrix

| What you changed             | Required tests                 | Test type                                      | Example                                                            |
| ---------------------------- | ------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------ |
| New hook (`use*.ts`)         | Unit test with `renderHook`    | `hooks/__tests__/useX.test.ts`                 | Mock dependencies, test return values and state changes            |
| New utility/service (`*.ts`) | Unit test                      | `utils.test.ts` colocated                      | Pure function tests, edge cases, error paths                       |
| New component with logic     | Unit test + Storybook story    | `Component.test.tsx` + `Component.stories.tsx` | Render with providers, test interactions, story for visual states  |
| New component (layout only)  | Storybook story only           | `Component.stories.tsx`                        | No unit test needed — story covers visual correctness              |
| Redux slice                  | State transition test          | `mySlice.test.ts`                              | Test reducers by dispatching actions and asserting resulting state |
| RTK Query endpoint           | MSW integration test           | `api.test.ts`                                  | Use MSW to mock API, test cache behavior                           |
| Bug fix (any file)           | Regression test                | Add to existing test file                      | Write a test that fails without the fix, passes with it            |
| Feature (new feature dir)    | All of the above as applicable | Per-file rules above                           | Plus: add feature flag test showing disabled state                 |

### What NOT to test

- Type-only files, barrel re-exports, constants
- Auto-generated files (`AUTO_GENERATED/`, contract types)
- Storybook stories themselves (covered by snapshot workflow)

## Storybook

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

For detailed Storybook patterns, context error reference, MSW fixtures, and the full provider stack, see [.storybook/AGENTS.md](.storybook/AGENTS.md).

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
- Story files are located throughout `src/` alongside components
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

### Argos visual regression testing (Storybook)

Storybook visual regression runs on Argos (the same service as the Cypress visual E2E suite), via
`.github/workflows/web-argos-storybook.yml`: it builds the static Storybook, screenshots every story
in **light and dark** with the render-sweep harness, and uploads to Argos. Requires the
`ARGOS_TOKEN_STORYBOOK` repo secret. It runs **automatically on PRs touching `apps/web/**`or`packages/**`** (plus manual `workflow_dispatch` for baseline management) — do not remove the
`pull_request` trigger; it exists because a fully broken send-tokens screen once shipped past
6,600 green unit tests (ISSUE-050).

- **Opting a story out of snapshots**: add `tags: ['skip-visual-test']` (story- or meta-level) for
  flaky/animated/interactive-only stories. The story is still render-checked (errors fail CI) —
  only the pixel snapshot is skipped. This replaces the Chromatic-era `!chromatic` tag and
  `chromatic: { disableSnapshot: true }` parameter.
- **Local run**: `yarn workspace @safe-global/web storybook:sweep -- --shots=<dir>` produces the
  same screenshots; add `--filter=<substr>` to scope.

## Web-specific common pitfalls

1. **Hardcoding values** – Use theme variables from `vars.css` instead of hard-coded CSS values
2. **Skipping Storybook stories** – New components should have stories for documentation
3. **Using lazy() or nested structure in feature.ts** – The `feature.ts` file is already lazy-loaded via `createFeatureHandle`. Do NOT add `lazy()` calls for individual components, and do NOT use nested categories (`components`, `hooks`, `services`). Use a flat structure with direct imports. Naming conventions determine stub behavior: `useSomething` → hook, `PascalCase` → component, `camelCase` → service.
4. **Using lazy loading inside features** – The entire feature is lazy-loaded by default via `createFeatureHandle`. Do NOT use `lazy()`, `dynamic()`, or any other lazy-loading mechanism inside the feature (not in `feature.ts`, not in components, not anywhere). All components and services inside a feature should use direct imports with a flat structure.
5. **CSS-module padding silently beaten by variant utilities** – shadcn primitives ship group-data
   variant utilities (e.g. Card's `group-data-[size=none]/card:px-0`) whose two-class selectors
   outrank a single CSS-module class. If a module style "mysteriously doesn't apply", check for a
   competing variant utility before adding more CSS (see ISSUE-050: every tx-flow card lost its
   horizontal padding this way). Prefer utility classes at the call site; when a module must win,
   document the `!important`.
6. **`<img height={24}>` doesn't size images** – Tailwind's preflight sets `img { height: auto }`,
   which overrides the HTML `height` attribute. Always size raster images with classes
   (`className="h-6 w-auto"`), never attributes.
7. **Unit tests don't see layout** – 6,600 green tests said nothing while the send-tokens form
   rendered with zero padding (ISSUE-050). Any UI-affecting change must be verified visually:
   check the component's story (or the live page) yourself, and rely on the Argos Storybook
   workflow (auto-runs on web PRs) for regression cover. Never ship a story that permanently
   renders skeletons/blank without a doc comment saying so — a broken story that "passes" is
   worse than no story.
8. **Don't rebuild field chrome out of raw divs + CSS modules** – `NumberField`/`Field`/
   `InputGroup` already provide the label (with error coloring), the outline, focus ring, and
   inline-start/end adornment slots. The migrated amount field hand-rolled its own outline box,
   floating label, and adornment layout around a `NumberField` — producing a double border and
   an overlapping MAX button (ISSUE-052). The variant lint cannot catch this: raw `div`s contain
   no design-system component to flag. If a field needs something the primitives lack, extend
   the primitive, don't wrap it.

## Debugging Tips

- **Type errors**: Run `yarn workspace @safe-global/web type-check` to see all TypeScript errors
- **Test failures**: Run tests in watch mode with `yarn workspace @safe-global/web test --watch`
- **RPC issues**: Check that `INFURA_TOKEN` or other RPC provider env vars are set correctly
- **Build errors**: Check `.next` cache – sometimes `rm -rf apps/web/.next` helps
- **Storybook issues**: Try `rm -rf node_modules/.cache/storybook`

## Code complexity

See [docs/code-style.md](docs/code-style.md) for code complexity guidelines (lookup tables, early returns, switch for type discrimination, function-length limits).
