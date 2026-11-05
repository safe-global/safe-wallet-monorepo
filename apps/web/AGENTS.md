# Web App AI Contributor Guidelines

Web-specific guidance for the Next.js app under `apps/web/`. For monorepo-wide rules, see the root [AGENTS.md](../../AGENTS.md). For E2E, see [e2e/AGENTS.md](e2e/AGENTS.md) (Playwright — all new tests) and [cypress/AGENTS.md](cypress/AGENTS.md) (legacy maintenance). For story authoring, see [docs/storybook-guide.md](docs/storybook-guide.md).

## Web-specific principles

- New features must be created in a separate folder inside `src/features/` – only components, hooks, and services used globally across many features belong in top-level folders inside `src/`
- **All features must follow the standard feature architecture pattern** – See [docs/feature-architecture.md](docs/feature-architecture.md) for the complete guide including folder structure, feature flags, lazy loading, and public API patterns
- Each new feature must be behind a feature flag (stored on the CGW API in chains configs); read it in code with `useHasFeature` from `src/hooks/useChains.ts`, passing a flag from `FEATURES` (imported from `@safe-global/utils/utils/chains`)
- A new Redux slice must be exported from `src/store/slices.ts` and registered in the `rootReducer` in `src/store/index.ts`; adding it to `persistedSlices` there both persists it to localStorage **and** syncs it across tabs (`persistStore.ts` and `broadcast.ts` share that list)
- Use theme variables from vars.css instead of hard-coded CSS values
- Build UI from the shadcn/ui primitives in `@safe-global/views/components/ui/*` (Tailwind); MUI/Emotion are removed
- **Put as much markup as possible in `packages/views`.** New UI is a view in `packages/views/src/features/<feature>/components/` that only turns props into markup. The component in `apps/web` calls the hooks, the store and the router, and renders that view with the results. This holds even when the code around it is still in `apps/web`: that code has not been moved yet and is not an example to follow. What may go in a view: [packages/views/AGENTS.md](../../packages/views/AGENTS.md).
- **Never hand-roll a modal scrim.** Anything that dims the page behind it — a dialog, alert dialog, sheet, drawer, backdrop-ed select — renders `overlayVariants()` from [`@safe-global/views/components/ui/overlay`](../../packages/views/src/components/ui/overlay.ts). Tint lives in the `--backdrop` token, the blur and the stacking layer live in that one cva. `overlay.test.tsx` fails if a surface drifts. Anchored surfaces (popovers, dropdowns, menus, tooltips) have no scrim by design.
- **Prefer a component's variant/size prop over one-off `className` overrides.** See [Component variants over custom styling](#component-variants-over-custom-styling) below.
- **Errors are logged imperatively at the catch site, never from render (component body, `useMemo`, `useEffect`).** See [Error logging](#error-logging) below.
- **Tracking stays out of component logic.** A "viewed" event is `useTrackOnce` from `src/services/analytics/useTrackOnce.ts` (pass `ready` when the data arrives after mount); a pure click event wraps the control in `components/common/Track`; an event that mirrors an API result is sent by a store listener on the endpoint's `matchFulfilled`, with props from the request args, the response or the RTK cache (see `features/spaces/store/workspaceTrackingListener.ts`). Call `trackEvent` from a handler only when the handler also does something for the event, such as storing state.
- **Don't add `next/*` imports that have a plain replacement; we are migrating away from Next.** Use `<img>` instead of `next/image`, `<a>` instead of `next/link` for external links, `dynamic` from `@/utils/dynamic` instead of `next/dynamic` (it renders nothing on the server, so the module does not load during the static export), a plain function component instead of the `NextPage` type, and `stringify` from `querystring` instead of `resolveHref` from `next/dist/client/resolve-href`. Routing and document APIs (`next/router`, `next/navigation`, `next/link` for internal routes, `next/head`, `next/app`, `next/document`) have no replacement yet, so keep using them.

## Component variants over custom styling

Reach for a component's **variant/size prop before a one-off `className`**. If you're hand-rolling
padding/height/border/hover on a primitive, a variant probably exists; if the pattern recurs (~3 places),
add a variant or a preset instead of pasting the classes again. The **`UI/Button` → Guidelines and
`UI/Input` stories are the canonical variant/size reference** — this section only states the rule.

- **On `<Button>`, `className` is layout-only** (`w-full`, margins, grid placement); size/skin utilities are **ESLint-enforced errors** (`no-restricted-syntax` in `eslint.config.mjs`). The only sanctioned escape is a justified `// eslint-disable-next-line no-restricted-syntax -- <reason>` — when a pattern recurs, add a size/variant to `packages/views/src/components/ui/button.tsx` rather than disabling.
- **Prefer the closed presets in `components/common/`** (`SubmitButton`, `ActionBar`+`ActionButton`, `DialogActions`, `OnboardingFooter`, `IconAction`) over the raw primitive — they take semantic props and reject styling `className` at the type level.
- **Token gotcha (bit you):** `--input` is the field **fill** token, not a border colour — a visible field/button border must use `border-border`, never `border-input` or hard-coded `border-gray-*`. The field primitives already default correctly; don't re-declare borders/backgrounds on them.

## Feature Architecture Import Rules

Features are lazy-loaded to keep the bundle small. ESLint enforces the import boundaries as **errors** (CI-failing):

```typescript
// ✅ Allowed
import { MyFeature, useMyHook } from '@/features/myfeature' // barrel: handle + hooks
import { someSlice, selectSomething } from '@/features/myfeature/store' // Redux store
import type { MyType } from '@/features/myfeature/types' // public types
import { lightUtil } from '@/features/myfeature/services' // services barrel only — lightweight utils

// ❌ Forbidden: any deep import (components, hooks/*, services/* files) — it defeats
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
// feature.ts — already lazy via createFeatureHandle: a flat object of direct imports only.
// Naming determines stub behavior: PascalCase → component, camelCase → service.
// No lazy()/dynamic(), no nested categories, no hooks here (Rules of Hooks).
export default { MyComponent, myService }

// index.ts — hooks are exported directly (always loaded — keep them lightweight,
// heavy logic goes in services):
export const MyFeature = createFeatureHandle<MyFeatureContract>('my-feature')
export { useMyHook } from './hooks/useMyHook'
```

Full guide (folder structure, proxy stubs, `$error`, feature flags): [docs/feature-architecture.md](docs/feature-architecture.md).

## Error logging

Report an error where it is caught, imperatively — never from the render layer (component body, `useMemo`, `useEffect` keyed on an error), which re-runs and reports one failure many times. Patterns for async calls, throwing transforms, choke points, RTK Query listeners, throttling, expected failures and tests: [docs/error-logging.md](docs/error-logging.md).

## Web Testing

Before writing or changing any test, read [docs/ai/testing-conventions.md](../../docs/ai/testing-conventions.md) (cross-cutting) and [docs/TESTING.md](docs/TESTING.md) (web): choosing the test level, the test decision matrix, what not to test, mock patterns and templates, including how to set or assert `window.location` (non-configurable in jsdom 26).

- **E2E:** all new E2E tests are Playwright — `e2e/` ([e2e/AGENTS.md](e2e/AGENTS.md); canonical rules in [e2e/docs/README.md](e2e/docs/README.md); answer the 4 questions in [e2e/docs/AI_TEST_OUTPUT_FORMAT.md](e2e/docs/AI_TEST_OUTPUT_FORMAT.md) before writing any test). Cypress is legacy, no new tests: [cypress/AGENTS.md](cypress/AGENTS.md).
- **Write each test at the lowest level that can show the behaviour.** Playwright only for what needs a real browser or several real services together; everything else goes in Jest. A Playwright test does not make up for missing unit and component tests. Levels, examples and when to mock: [docs/TESTING.md](docs/TESTING.md#choose-the-test-level).

## Storybook

Run: `yarn workspace @safe-global/web storybook` (port 6006). Every new component gets a story, colocated with it and with an explicit `meta.title`. Full reference — title taxonomy, fixtures, MSW patterns, decorator stacking, Argos: [docs/storybook-guide.md](docs/storybook-guide.md).

Choosing a setup:

1. **No store/API needs** → plain `Meta`/`StoryObj`.
2. **Redux hooks only** → `decorators: [withMockProvider()]` from `@/storybook/decorators`.
3. **Pages/widgets needing API mocks** → `createMockStory` from `@/stories/mocks` — don't hand-roll `StoreDecorator`/provider stacks/MSW handlers.

```typescript
const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected', layout: 'fullPage' })
// scenario: efSafe | vitalik | empty | spamTokens | safeTokenHolder
// layout: none | paper | withSidebar | fullPage · wallet: disconnected | connected | owner | nonOwner
export const Default: Story = { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
```

Don't add `loaders: [mswLoader]` — it is global in `preview.tsx`. Don't override feature flags unless testing a disabled state.

**Visual regression (Argos) doesn't run on PRs** — the workflow runs weekly on `dev` and by hand before a release. Verify UI changes via the story (or live page) yourself; run `yarn workspace @safe-global/web storybook:sweep -- --shots=<dir>` locally. Opt flaky/animated stories out of snapshots with `tags: ['skip-visual-test']` (still render-checked).

## Web-specific common pitfalls

1. **Never use `lazy()`/`dynamic()` anywhere inside a feature** – the whole feature is already lazy via `createFeatureHandle` (see [Feature Architecture Import Rules](#feature-architecture-import-rules) above).
2. **CSS-module padding silently beaten by variant utilities** – shadcn primitives ship group-data variant utilities (e.g. Card's `group-data-[size=none]/card:px-0`) whose two-class selectors outrank a single CSS-module class. If a module style "mysteriously doesn't apply", check for a competing variant utility before adding more CSS (see ISSUE-050: every tx-flow card lost its horizontal padding this way). Prefer utility classes at the call site; when a module must win, document the `!important`.
3. **`<img height={24}>` doesn't size images** – Tailwind's preflight sets `img { height: auto }`, which overrides the HTML `height` attribute. Always size raster images with classes (`className="h-6 w-auto"`), never attributes.
4. **Unit tests don't see layout** – 6,600 green tests said nothing while the send-tokens form rendered with zero padding (ISSUE-050). Any UI-affecting change must be verified visually: check the component's story (or the live page) yourself — Argos does not auto-run on PRs (see [Storybook](#storybook) above). Never ship a story that permanently renders skeletons/blank without a doc comment saying so — a broken story that "passes" is worse than no story.
5. **Don't rebuild field chrome out of raw divs + CSS modules** – `NumberField`/`Field`/`InputGroup` already provide the label (with error coloring), the outline, focus ring, and inline-start/end adornment slots. The migrated amount field hand-rolled its own outline box, floating label, and adornment layout around a `NumberField` — producing a double border and an overlapping MAX button (ISSUE-052). The variant lint cannot catch this: raw `div`s contain no design-system component to flag. If a field needs something the primitives lack, extend the primitive, don't wrap it.
6. **`packages/views/src/components/ui/` primitives are managed via the shadcn CLI** – read [packages/views/src/components/ui/README.md](../../packages/views/src/components/ui/README.md) before hand-editing them.
7. **`next dev` and `next build` need `--webpack`** – Next 16 uses Turbopack by default, and Turbopack ignores the `webpack()` config in `next.config.mjs` (SVGR, SRI, the dev page stub). The `dev`, `dev:full`, `start` and `build` scripts pass the flag; keep it when adding a script.
8. **The dev server renders every page as empty** – in `next dev`, `next.config.mjs` replaces each page with `scripts/dev-server-page-stub.js` for the server compile, and `_app.tsx` renders nothing until the client mounts (`RenderAfterMount`). Page code never runs on the server in dev. Production builds and the static export do not use the stub.

## Code complexity

See [docs/code-style.md](docs/code-style.md) for code complexity guidelines (lookup tables, early returns, switch for type discrimination, nesting limits).
