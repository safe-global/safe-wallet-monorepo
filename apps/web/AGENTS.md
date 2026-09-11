# Web App AI Contributor Guidelines

Web-specific guidance for the Next.js app under `apps/web/`. For monorepo-wide rules, see the root [AGENTS.md](../../AGENTS.md). For E2E, see [e2e/AGENTS.md](e2e/AGENTS.md) (Playwright — all new tests) and [cypress/AGENTS.md](cypress/AGENTS.md) (legacy maintenance). For story authoring, see [docs/storybook-guide.md](docs/storybook-guide.md).

## Web-specific principles

- New features must be created in a separate folder inside `src/features/` – only components, hooks, and services used globally across many features belong in top-level folders inside `src/`
- **All features must follow the standard feature architecture pattern** – See [docs/feature-architecture.md](docs/feature-architecture.md) for the complete guide including folder structure, feature flags, lazy loading, and public API patterns
- Each new feature must be behind a feature flag (stored on the CGW API in chains configs); read it in code with `useHasFeature` from `src/hooks/useChains.ts`, passing a flag from `FEATURES` (imported from `@safe-global/utils/utils/chains`)
- A new Redux slice must be exported from `src/store/slices.ts` and registered in the `rootReducer` in `src/store/index.ts`; adding it to `persistedSlices` there both persists it to localStorage **and** syncs it across tabs (`persistStore.ts` and `broadcast.ts` share that list)
- Use theme variables from vars.css instead of hard-coded CSS values
- Build UI from the shadcn/ui primitives in `@/components/ui/*` (Tailwind); MUI/Emotion are removed
- **Never hand-roll a modal scrim.** Anything that dims the page behind it — a dialog, alert dialog, sheet, drawer, backdrop-ed select — renders `overlayVariants()` from [`@/components/ui/overlay`](src/components/ui/overlay.ts). Tint lives in the `--backdrop` token, the blur and the stacking layer live in that one cva. `overlay.test.tsx` fails if a surface drifts. Anchored surfaces (popovers, dropdowns, menus, tooltips) have no scrim by design.
- **Prefer a component's variant/size prop over one-off `className` overrides.** See [Component variants over custom styling](#component-variants-over-custom-styling) below.
- **Errors are logged imperatively at the catch site, never from render (component body, `useMemo`, `useEffect`).** See [Error logging](#error-logging) below.

## Component variants over custom styling

Reach for a component's **variant/size prop before a one-off `className`**. If you're hand-rolling
padding/height/border/hover on a primitive, a variant probably exists; if the pattern recurs (~3 places),
add a variant or a preset instead of pasting the classes again. The **`UI/Button` → Guidelines and
`UI/Input` stories are the canonical variant/size reference** — this section only states the rule.

- **On `<Button>`, `className` is LAYOUT-ONLY** (`w-full`, margins, grid placement); size/skin utilities are
  **ESLint-enforced errors** (`no-restricted-syntax` in `eslint.config.mjs`). The only sanctioned escape is a
  justified `// eslint-disable-next-line no-restricted-syntax -- <reason>` — when a pattern recurs, add a
  size/variant to `components/ui/button.tsx` rather than disabling.
- **Prefer the closed presets in `components/common/`** (`SubmitButton`, `ActionBar`+`ActionButton`,
  `DialogActions`, `OnboardingFooter`, `IconAction`) over the raw primitive — they take semantic props and
  reject styling `className` at the type level.
- **Token gotcha (bit you):** `--input` is the field **fill** token, not a border colour — a visible
  field/button border must use `border-border`, never `border-input` or hard-coded `border-gray-*`. The field
  primitives already default correctly; don't re-declare borders/backgrounds on them.

## Feature Architecture Import Rules

Features are lazy-loaded to keep the bundle small. ESLint enforces the import boundaries as **errors** (CI-failing):

```typescript
// ✅ Allowed
import { MyFeature, useMyHook } from '@/features/myfeature' // barrel: handle + hooks
import { someSlice, selectSomething } from '@/features/myfeature/store' // Redux store
import type { MyType } from '@/features/myfeature/types' // public types
import { lightUtil } from '@/features/myfeature/services' // services barrel only — lightweight utils

// ❌ Forbidden: ANY deep import (components, hooks/*, services/* files) — it defeats
// lazy loading. Components and heavy services are reached via useLoadFeature() instead.
```

**Using a feature:**

```typescript
const { MyComponent, myService, $isReady, $isDisabled } = useLoadFeature(MyFeature) // from '@/features/__core__'
// Always returns an object: components render null until ready (proxy stub);
// services are undefined until ready — check $isReady before calling.
```

**Defining a feature:**

```typescript
// feature.ts — already lazy via createFeatureHandle: FLAT object of direct imports only.
// Naming determines stub behavior: PascalCase → component, camelCase → service.
// NO lazy()/dynamic(), NO nested categories, NO hooks here (Rules of Hooks).
export default { MyComponent, myService }

// index.ts — hooks are exported directly (always loaded — keep them lightweight,
// heavy logic goes in services):
export const MyFeature = createFeatureHandle<MyFeatureContract>('my-feature')
export { useMyHook } from './hooks/useMyHook'
```

Full guide (folder structure, proxy stubs, `$error`, feature flags): [docs/feature-architecture.md](docs/feature-architecture.md).

## Error logging

**Report an error where it is caught, imperatively. Never from the render layer.** A component body, a
`useMemo`, and a `useEffect` keyed on an error value are all re-entrant: RTK Query writes a fresh error
object into store state on every rejection, `useAsync` constructs a new `Error` per run, a memo is a cache
hint and not a guarantee of a single evaluation, StrictMode double-invokes, and a component rendered once
per list item multiplies every report. Logging from there reports one failure once per attempt, per
consumer, per render — so logging belongs on the imperative path that produced the failure.

- **Async call** — log in `.catch` (or `try`/`catch`) and rethrow, so the error still reaches the UI:

  ```ts
  const [data, error, loading] = useAsync(() => {
    return getTxHistory(chainId, address).catch((e) => {
      logError(Errors._602, e)
      throw e
    })
  }, [chainId, address])
  ```

- **Pure transform that can throw** — move it into a service function that catches, logs, and returns a
  fallback (`undefined`, or the un-normalized input); widen the return type to say so. The hook or memo then
  just calls it: `useMemo(() => (data ? transformMasterCopies(data) : undefined), [data])`. See
  `src/services/contracts/masterCopies.ts` and `src/services/safe-messages/normalizeMessage.ts`.
- **A failure every flow funnels through** — report at that one choke point, e.g. the `setSafeTxError`
  setter in `components/tx-flow/SafeTxProvider.tsx`, not in each flow.
- **An RTK Query rejection no hook owns** — use a listener in the slice, not a hook. Match with
  `isRejectedWithValue` + the `endpointName`, and register the listener in the `listeners` array in
  `src/store/index.ts` (see `safeInfoListener` in `src/store/safeInfoSlice.ts`).
- **Never carry a failure out of a memo as a value to log later**, and never add per-call-site dedupe
  machinery for it — `CodedException.log()` already throttles an identical `message` + context for 60s
  (`LOG_THROTTLE_MS` in `src/services/exceptions/index.ts`), which is what makes a 15s poll or several
  concurrent readers of one gas estimate report once.
- **Filter expected failures at the catch site, before logging** — a reverted gas estimate
  (`isExpectedEstimationError`), an RPC throttle (`isRateLimitError`), a counterfactual Safe's 404. An
  expected answer is not a fault.
- **Pass the caught value, not its message** — `CodedException` recovers the HTTP status and
  hardware-wallet details from the error itself, and neither survives being flattened to a string.
- **Tests** target the catch site, not a render. Unit-test the service function or the listener with
  `logError` mocked (`jest.mock('@/services/exceptions', ...)`); when asserting against the real
  implementation, call `__resetLogThrottleForTests()` in `beforeEach` so each test starts with an open
  throttle window.

RPC-specific context (`getRpcErrorContext`) rules: [docs/rpc-endpoint-attribution.md](docs/rpc-endpoint-attribution.md).

## Web Testing

Before writing or changing any test, read the cross-cutting conventions in [docs/ai/testing-conventions.md](../../docs/ai/testing-conventions.md). The matrix and tooling below are web-specific.

### E2E tests

**All new E2E tests are Playwright** — `e2e/` ([e2e/AGENTS.md](e2e/AGENTS.md); canonical rules in [e2e/docs/README.md](e2e/docs/README.md), 12-step output format mandatory before writing any test).

**Cypress is legacy — no new tests.** Maintenance conventions for the existing suite: [cypress/AGENTS.md](cypress/AGENTS.md).

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

### Developer-owned tests rule

Always consider what developers should test before QA automation. For every changed feature, suggest developer-owned tests first:

- **Unit tests** — pure functions, parsers, validators, formatters, hooks
- **Component tests** — React components render correctly with props
- **Integration tests** — hooks + stores + API mocks wired together

If a feature lacks unit and component coverage, the correct response is to flag missing developer tests — not to write a Playwright test that compensates for them. Playwright tests are the top of the pyramid, not the foundation. Full QA-developer agreement: [Developer Testability Contract](e2e/docs/developer-testability-contract.md).

## Storybook

Run: `yarn workspace @safe-global/web storybook` (port 6006). Every new component gets a story, colocated with it and with an explicit `meta.title`. Full reference — title taxonomy, fixtures, MSW patterns, decorator stacking, Argos: [docs/storybook-guide.md](docs/storybook-guide.md).

Choosing a setup:

1. **No store/API needs** → plain `Meta`/`StoryObj`.
2. **Redux hooks only** → `decorators: [withMockProvider()]` from `@/storybook/preview`.
3. **Pages/widgets needing API mocks** → `createMockStory` from `@/stories/mocks` — do NOT hand-roll `StoreDecorator`/provider stacks/MSW handlers.

```typescript
const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected', layout: 'fullPage' })
// scenario: efSafe | vitalik | empty | spamTokens | safeTokenHolder
// layout: none | paper | withSidebar | fullPage · wallet: disconnected | connected | owner | nonOwner
export const Default: Story = { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
```

Don't add `loaders: [mswLoader]` — it is global in `preview.tsx`. Don't override feature flags unless testing a disabled state.

**Visual regression (Argos) does NOT auto-run on PRs** — the workflow is currently `workflow_dispatch`-only. Verify UI changes via the story (or live page) yourself; run `yarn workspace @safe-global/web storybook:sweep -- --shots=<dir>` locally. Opt flaky/animated stories out of snapshots with `tags: ['skip-visual-test']` (still render-checked).

## Web-specific common pitfalls

1. **Never use `lazy()`/`dynamic()` anywhere inside a feature** – the whole feature is already lazy via `createFeatureHandle` (see [Feature Architecture Import Rules](#feature-architecture-import-rules) above).
2. **CSS-module padding silently beaten by variant utilities** – shadcn primitives ship group-data
   variant utilities (e.g. Card's `group-data-[size=none]/card:px-0`) whose two-class selectors
   outrank a single CSS-module class. If a module style "mysteriously doesn't apply", check for a
   competing variant utility before adding more CSS (see ISSUE-050: every tx-flow card lost its
   horizontal padding this way). Prefer utility classes at the call site; when a module must win,
   document the `!important`.
3. **`<img height={24}>` doesn't size images** – Tailwind's preflight sets `img { height: auto }`,
   which overrides the HTML `height` attribute. Always size raster images with classes
   (`className="h-6 w-auto"`), never attributes.
4. **Unit tests don't see layout** – 6,600 green tests said nothing while the send-tokens form
   rendered with zero padding (ISSUE-050). Any UI-affecting change must be verified visually:
   check the component's story (or the live page) yourself — Argos does not auto-run on PRs
   (see [Storybook](#storybook) above). Never ship a story that permanently renders
   skeletons/blank without a doc comment saying so — a broken story that "passes" is worse
   than no story.
5. **Don't rebuild field chrome out of raw divs + CSS modules** – `NumberField`/`Field`/
   `InputGroup` already provide the label (with error coloring), the outline, focus ring, and
   inline-start/end adornment slots. The migrated amount field hand-rolled its own outline box,
   floating label, and adornment layout around a `NumberField` — producing a double border and
   an overlapping MAX button (ISSUE-052). The variant lint cannot catch this: raw `div`s contain
   no design-system component to flag. If a field needs something the primitives lack, extend
   the primitive, don't wrap it.
6. **`src/components/ui/` primitives are managed via the shadcn CLI** – read
   [src/components/ui/README.md](src/components/ui/README.md) before hand-editing them.

## Code complexity

See [docs/code-style.md](docs/code-style.md) for code complexity guidelines (lookup tables, early returns, switch for type discrimination, nesting limits).
