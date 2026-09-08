# Storybook Guide

Canonical reference for writing Storybook stories in `apps/web`. The quick decision guide lives in [../AGENTS.md](../AGENTS.md); Storybook **configuration** internals in [../.storybook/AGENTS.md](../.storybook/AGENTS.md).

## Story title taxonomy (required)

Every story file MUST set an explicit `meta.title` — untitled stories get auto-titled from their lowercase file path and pollute the sidebar with stray `features/…`/`components/…` groups.

Five top-level groups (the first is curated in `preview.tsx` storySort — don't add to it from feature work):

| Group            | What belongs there                             | Example                                                                          |
| ---------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `Design System/` | Curated design-system overview pages           | `Design System` (see `components/ui/stories/design-system.stories.tsx`)          |
| `UI/`            | Design-system atoms (`components/ui/*`)        | `UI/Button`                                                                      |
| `Components/`    | Shared, cross-feature components               | `Components/Common/EthHashInfo`, `Components/TxFlow/ConfirmationViews/SwapOrder` |
| `Features/`      | Feature-scoped components, grouped by feature  | `Features/Spaces/SafeWidget`                                                     |
| `Pages/`         | Full-route page stories (`src/stories/pages/`) | `Pages/Core/Home`                                                                |

Rules:

- The title leaf is the **component name**, never `index` (e.g. `Features/Swap/SwapOrderConfirmationView`).
- Titles follow **domain ownership, not file location**: a Space-specific component that happens to live under `components/common/` (e.g. `SpaceSafeBar/SpaceChainSelector`) is titled `Features/Spaces/…`.
- Prefer stories that render the **real component**. Hand-built "UI patterns" mockup showcases are only acceptable while a feature has no real-component stories; once real stories exist, delete the mockup (precedent: `features/safe-shield`).

## Choosing a mock setup

1. **No store/API needs** → plain `Meta`/`StoryObj` with an explicit `meta.title`.
2. **Redux hooks only** (`useAppSelector`, `useDispatch`) → `decorators: [withMockProvider()]` from `@/storybook/preview`.
3. **Pages/widgets needing API mocks** → **`createMockStory` from `@/stories/mocks` — the canonical factory. Do NOT hand-roll `StoreDecorator` + provider stacks + MSW handlers**; that is exactly what the factory replaces.

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import Dashboard from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe', // 'efSafe' | 'vitalik' | 'empty' | 'spamTokens' | 'safeTokenHolder'
  wallet: 'disconnected', // 'disconnected' | 'connected' | 'owner' | 'nonOwner'
  layout: 'none', // 'none' | 'paper' | 'withSidebar' | 'fullPage'
})

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: { layout: 'fullscreen', ...defaultSetup.parameters }, // MSW handlers + router mock
  decorators: [defaultSetup.decorator], // Redux, Wallet, SDK, TxModal contexts
} satisfies Meta<typeof Dashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
```

### createMockStory options

| Option     | Type                                                                                                           | Default                                             | Description                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `scenario` | `'efSafe' \| 'vitalik' \| 'empty' \| 'spamTokens' \| 'safeTokenHolder'`                                        | `'efSafe'`                                          | Data fixture scenario                         |
| `wallet`   | `'disconnected' \| 'connected' \| 'owner' \| 'nonOwner'`                                                       | `'disconnected'`                                    | Wallet connection state                       |
| `features` | `{ portfolio?, positions?, swaps?, recovery?, hypernative?, earn?, spaces?, oidcAuth?, switchAuthenticator? }` | `{ portfolio: true, positions: true, swaps: true }` | Chain feature flags (only specify to disable) |
| `layout`   | `'none' \| 'paper' \| 'withSidebar' \| 'fullPage'`                                                             | `'none'`                                            | Layout wrapper                                |
| `store`    | `object`                                                                                                       | `{}`                                                | Redux store overrides                         |
| `handlers` | `RequestHandler[]`                                                                                             | `[]`                                                | Additional MSW handlers                       |
| `pathname` | `string`                                                                                                       | `'/home'`                                           | Router pathname                               |

- **Do not override feature flags** unless testing a specific disabled state (e.g. `features: { swaps: false }`).
- Escape hatch for custom composition — import the pieces the factory is built from: `MockContextProvider`, `createChainData`, `createInitialState`, `getFixtureData`, `resolveWallet`, `coreHandlers`, `balanceHandlers` (all from `@/stories/mocks`). `MockContextProvider` already covers the Wallet, SDK, and TxModal contexts.

## What preview.tsx already provides globally (don't re-add)

- **`mswLoader` is registered globally** — do NOT add `loaders: [mswLoader]` at meta or story level. (~110 story files still cargo-cult it; don't copy them.)
- `ShadcnProvider` + light/dark theme sync decorators, viewport presets, and the sidebar `storySort`.
- `withMockProvider` is re-exported from `@/storybook/preview`.

## MSW patterns

Use **regex, not wildcard strings** — string patterns with wildcards don't work reliably in MSW v2:

```typescript
import { http, HttpResponse } from 'msw'

// ❌ Unreliable
http.get('*/v1/chains/:chainId/safes/:address/balances/:currency', handler)

// ✅ Works for any origin
http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesFixtures.efSafe))
```

Handler order matters — MSW resolves first-match-wins. `createMockStory`'s `handlers` option is **appended after the defaults**, so it can only add handlers for routes the defaults don't mock — it cannot override a default. To override one, compose the msw parameter yourself with your handler first:

```typescript
export const Overridden: Story = {
  parameters: { ...setup.parameters, msw: { handlers: [myHandler, ...setup.handlers] } },
  decorators: [setup.decorator],
}
```

> **There is no `chains` Redux slice.** Chain config was migrated to RTK Query in Nov 2025 — preloading `chains: { data: [...] }` initialState is silently dropped by the store. Mock `/v1/chains` and `/v2/chains` via MSW instead (`createMockStory` does this for you). Several older story files still cargo-cult the dead pattern; don't copy them.

## Redux state gotchas (manual `StoreDecorator` use only)

- Safe info MUST have `deployed: true` and `loaded: true` for RTK Query hooks to fire.
- The settings shape is `shortName: { qr: boolean }` — the `copy` key was removed in 2026-07 (#8285); `StoreDecorator` won't error on a wrong shape, it just silently teaches one.

## Fixture scenarios

Import via the tsconfig alias — never via depth-dependent relative paths (`'../../../../../../config/...'` breaks at other nesting levels):

```typescript
import { safeFixtures, chainFixtures, balancesFixtures, SAFE_ADDRESSES } from '@safe-global/test/msw'
```

| Scenario          | Tokens | Positions           | Use case            |
| ----------------- | ------ | ------------------- | ------------------- |
| `efSafe`          | 32     | $142M (8 protocols) | DeFi heavy, default |
| `vitalik`         | 1551   | $19M                | Whale, performance  |
| `spamTokens`      | 26     | $1.7M               | Spam filtering      |
| `safeTokenHolder` | 25     | $707 (15 protocols) | Protocol diversity  |
| `empty`           | 0      | $0                  | Empty states        |

## Context error reference

| Error pattern                              | Fix                                                        |
| ------------------------------------------ | ---------------------------------------------------------- |
| `could not find react-redux context`       | `withMockProvider()` (or `createMockStory` for pages)      |
| `useWallet` / `useWalletContext` undefined | `createMockStory` `wallet:` option / `MockContextProvider` |
| `useSafeSDK` undefined                     | `createMockStory` / `MockContextProvider` (mocks the SDK)  |
| `TxModalContext` / `setTxFlow` undefined   | `createMockStory` / `MockContextProvider`                  |
| `RouterContext` / `useRouter` undefined    | `createMockStory` parameters (router mock included)        |

## Decorator stacking warning

Storybook decorators **stack** — story-level decorators are added to meta-level decorators, they don't replace them. Defining a `createMockStory` decorator at the meta level AND another at the story level runs both (duplicate layouts/providers). If stories need different configurations, don't define decorators at the meta level:

```typescript
const meta = {
  title: 'Pages/MyPage',
  component: MyPage,
  parameters: { layout: 'fullscreen' },
  // No decorators here!
} satisfies Meta<typeof MyPage>

export const Default: Story = (() => {
  const setup = createMockStory({ scenario: 'efSafe', layout: 'fullPage' })
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
})()

export const Empty: Story = (() => {
  const setup = createMockStory({ scenario: 'empty', layout: 'fullPage' })
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
})()
```

## Transaction mocking (known limitation)

_Status as of 2026-08 — re-verify against `src/stories/mocks/handlers.ts` before relying on it._ Transaction page stories (Queue, History) have basic MSW handlers but transaction mocking is not fully working: details use `txData: null` to avoid Receipt parsing errors, and expanding details may show incomplete data. Improving this requires matching the CGW `txData` structure the Receipt/Summary components expect.

## Visual regression (Argos)

`.github/workflows/web-argos-storybook.yml` builds the static Storybook, screenshots every story in **light and dark**, and uploads to Argos. **The workflow is currently `workflow_dispatch`-only — its `pull_request` trigger is temporarily disabled, so visual regression does NOT run automatically on PRs.** Verify UI changes yourself via the story (or live page), and run the sweep locally:

```bash
yarn workspace @safe-global/web storybook:sweep -- --shots=<dir>   # add --filter=<substr> to scope
```

- Opt a story out of pixel snapshots with `tags: ['skip-visual-test']` (story- or meta-level) for flaky/animated stories. It is still render-checked — errors fail CI; only the snapshot is skipped.
- Never ship a story that permanently renders skeletons/blank without a doc comment saying so — a broken story that "passes" is worse than no story.

## Commands

```bash
yarn workspace @safe-global/web storybook                    # dev server on :6006 (storybook:lazy = faster, lazy compilation)
yarn workspace @safe-global/web generate:storybook-tests     # regenerates *.stories.test.tsx render checks
yarn workspace @safe-global/web test:storybook               # runs them
yarn workspace @safe-global/web storybook:generate-coverage  # regenerates .storybook/COVERAGE.md
```

## Adding learnings

Add durable patterns and gotchas to **this guide**. (The `specs/001-shadcn-storybook-migration/*` documents are a frozen historical record of the 2026-02 migration — don't add to them.)
