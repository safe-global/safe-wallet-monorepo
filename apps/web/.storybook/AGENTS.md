# Storybook Patterns for Safe{Wallet}

This document provides quick reference patterns for creating Storybook stories. For comprehensive guides, see:

- **Quick Start Guide**: `specs/001-shadcn-storybook-migration/quickstart.md`
- **MSW Fixtures**: `specs/001-shadcn-storybook-migration/msw-fixtures.md`
- **Research/Learnings**: `specs/001-shadcn-storybook-migration/research.md`

## Story Title Taxonomy (required)

Every story file MUST set an explicit `meta.title` — untitled stories get auto-titled from their
lowercase file path and pollute the sidebar with stray `features/…`/`components/…` groups.

Exactly four top-level groups:

| Group         | What belongs there                             | Example                                                                          |
| ------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `UI/`         | Design-system atoms (`components/ui/*`)        | `UI/Button`                                                                      |
| `Components/` | Shared, cross-feature components               | `Components/Common/EthHashInfo`, `Components/TxFlow/ConfirmationViews/SwapOrder` |
| `Features/`   | Feature-scoped components, grouped by feature  | `Features/Spaces/SafeWidget`                                                     |
| `Pages/`      | Full-route page stories (`src/stories/pages/`) | `Pages/Core/Home`                                                                |

Rules:

- The title leaf is the **component name**, never `index` (e.g. `Features/Swap/SwapOrderConfirmationView`).
- Titles follow **domain ownership, not file location**: a Space-specific component that happens to live
  under `components/common/` (e.g. `SpaceSafeBar/SpaceChainSelector`) is titled `Features/Spaces/…`.
- Prefer stories that render the **real component**. Hand-built "UI patterns" mockup showcases are only
  acceptable while a feature has no real-component stories; once real stories exist, delete the mockup
  (precedent: `features/safe-shield` — the mockup `index.stories.tsx` was removed in favor of the real
  `SafeShield.stories.tsx`).

## Component variants over custom styling

Reach for a component's **variant/size prop before a one-off `className`**. If you're hand-rolling
padding/height/border/hover on a primitive, a variant probably exists; if the pattern recurs, add one.
The **`UI/Button` and `UI/Input` stories are the canonical reference** — don't restate the full list here.

**On `<Button>`, `className` is LAYOUT-ONLY** (`w-full`, margins, grid placement). Height, padding,
font-size, radius and background are owned by the `size`/`variant` props — never re-declare them via
`className`. This is **enforced by ESLint** (`no-restricted-syntax` in `apps/web/eslint.config.mjs` flags
`h-*`, `px-*`/`py-*`, `text-xs|sm|base|lg`, `rounded-*`, `bg-*` on `<Button>`). Genuine exceptions
(split-button corner joins, on-colour CTAs, the documented onboarding `h-12` scale) carry a justified
`// eslint-disable-next-line no-restricted-syntax -- <reason>`. When a pattern recurs, add a size/variant to
`components/ui/button.tsx` rather than disabling — that's the whole point.

**Prefer a closed preset over the primitive.** For recurring intents there are "factory" presets in
`components/common/` — reach for these first. They take **semantic props, own their styling, and accept no
styling `className`** (it's Omitted from their types, so `<SubmitButton className="h-9">` is a _compile error_ —
a stronger guard than lint, which is why humans and AI can't drift them):

- **`SubmitButton`** — modal/flow/settings submit (`size="submit"` + loading→spinner swap). Props: `loading`,
  `fullWidth`, `variant`, `type`, `form`, `disabled`.
- **`ActionBar` + `ActionButton`** — CTA row; `ActionBar` owns gap/wrap, `ActionButton` locks `size="action"`,
  `variant` carries emphasis, `fullWidth` for stacked-mobile.
- **`DialogActions`** — the Cancel(outline)+Confirm(default/destructive) dialog footer (order, sizes, spinner,
  responsive layout). Named `DialogActions`, not `DialogFooter` (that's the shadcn layout slot).
- **`OnboardingFooter`** — the Back/Continue footer for full-screen onboarding flows (`size="xl"` 48px scale,
  chevrons, loading→spinner, stacked-mobile → row-on-xl). Props: `onBack`, `continueLabel`, `onContinue`,
  `continueType`/`continueForm`, `continueDisabled`/`continueLoading`, testids.
- **`IconAction`** — the compact top-bar / header icon button (locks `variant="ghost"` + `size="icon-sm"` + margin).

**Rule of three:** if the same variant+size(+layout) combo appears in ~3 places, promote it to a variant on
`button.tsx` or a preset in `components/common/` — don't paste the classes a fourth time.

**The only sanctioned raw-styling escape** is the primitive `<Button>` + `// eslint-disable-next-line
no-restricted-syntax -- <reason>` (greppable, review-visible). Closed presets have no className escape by design —
if you think you need one, add a prop/variant/preset instead. Layout composites (`ActionBar`, `DialogActions`)
do take a `className`, but for **layout only** (padding/margins/alignment), never button skin.

**AI note:** this section is the single, tool-agnostic source of truth for the rule (Claude Code reads it). Point
any other AI tool (Cursor `.mdc`, Copilot instructions) here rather than duplicating it — duplicated rules drift.

Highlights so agents don't rediscover them:

- **Button** — pick **variant by emphasis**: `default` (the one filled primary per surface/row), `secondary`
  (filled — white/card surfaces only), `outline` (secondary on page/toolbar backgrounds + dialog Cancel),
  `ghost` (low-emphasis/icon/toolbar/menu), `destructive` / `destructive-outline` (filled vs bordered
  destructive), `surface` (card-surface CTA on a coloured/promo surface — Earn/Stake/Add-funds), `link`
  (inline). Pick **size by box**: `action` (h-10 px-6 CTA/action-bar pill: Send/Receive/Swap, Confirm/Execute,
  Filter/Export, page-header primary actions), `submit` (action + stable min-width for modal/flow submits —
  replaces magic `min-w-[…]`), `lg` (h-10 form-step buttons), `default` (h-9), `sm` (h-8 compact/toolbar/cards),
  `xs` (h-6), `xl` (h-12 full-screen onboarding footer — via `OnboardingFooter`). Full decision matrix +
  Do/Don't: the **`UI/Button` → Guidelines** story.
- **Input** — `inputSize` `sm`/`default`/`lg` mirrors `SelectTrigger` so a field and a select on one row line up (named `inputSize`, not `size`, to dodge the native numeric `size` attr).
- **Surface & token rules (bit you) :** filled `secondary` only reads on white/card surfaces — on the muted
  page background use `variant="outline"`. `--input` is `#fff` in light mode, so a **visible field/button
  border must use `border-border`, not `border-input`** (which also looks borderless in dark until you
  switch it to `border-border`). The `Input`, `InputGroup`, and `SelectTrigger` primitives now default to
  `border-border`, so you should not need to set a border color on a field — and never re-introduce
  `border-input` or a hard-coded `border-gray-*`.

## Core Patterns

### 1. MSW Handler Pattern (Use Regex, Not Wildcards)

String patterns with wildcards don't work reliably in MSW v2. Always use regex:

```typescript
import { http, HttpResponse } from 'msw'

// ❌ Don't use wildcard strings - unreliable
http.get('*/v1/chains/:chainId/safes/:address/balances/:currency', handler)

// ✅ Use regex patterns - works for any origin
http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesFixtures.efSafe))
```

### 2. Redux State Pattern (RTK Query Requirements)

For RTK Query hooks to fire, ensure complete state:

```typescript
import { StoreDecorator } from '@/stories/storeDecorator'
import { safeFixtures, chainFixtures } from '../../../../../../config/test/msw/fixtures'

// Safe MUST have deployed: true for RTK Query to fire
const safeData = { ...safeFixtures.efSafe, deployed: true }
const chainData = { ...chainFixtures.mainnet }

<StoreDecorator
  initialState={{
    safeInfo: {
      data: safeData,
      loading: false,
      loaded: true,  // MUST be true
    },
    chains: {
      data: [chainData],
      loading: false,
    },
    settings: {
      currency: 'usd',
      hiddenTokens: {},
      tokenList: TOKEN_LISTS.ALL,
      shortName: { copy: true, qr: true },
      theme: { darkMode: false },
      env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
      signing: { onChainSigning: false, blindSigning: false },
      transactionExecution: true,
    },
  }}
>
```

### 3. Feature Flag Simplification

Remove complex feature flags to use simpler data paths:

```typescript
const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  // Remove features that require extra mocking
  chainData.features = chainData.features.filter(
    (f: string) => !['PORTFOLIO_ENDPOINT', 'POSITIONS', 'RECOVERY', 'HYPERNATIVE'].includes(f),
  )
  return chainData
}
```

### 4. Docs Mode Requires mswLoader

MSW handlers don't work in Storybook's Docs mode by default:

```typescript
import { mswLoader } from 'msw-storybook-addon'

const meta = {
  title: 'Components/MyComponent',
  loaders: [mswLoader],  // REQUIRED for docs mode
  parameters: {
    msw: {
      handlers: [...],
    },
  },
}

export const Default: Story = {
  loaders: [mswLoader],  // Also add to individual stories
}
```

### 5. Context Provider Stack

Common contexts needed for complex components:

```typescript
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

// Mock wallet context
const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: MOCK_ADDRESS,
    chainId: '1',
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: MOCK_ADDRESS,
    chainId: '1',
    provider: null,
  },
  setSignerAddress: () => {},
}

// Mock TxModal context
const mockTxModalContext: TxModalContextType = {
  txFlow: undefined,
  setTxFlow: () => {},
  setFullWidth: () => {},
}

// Mock SDK Provider
const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}

// Stack them in decorators
decorators: [
  (Story) => (
    <MockSDKProvider>
      <WalletContext.Provider value={mockConnectedWallet}>
        <TxModalContext.Provider value={mockTxModalContext}>
          <StoreDecorator initialState={{...}}>
            <Story />
          </StoreDecorator>
        </TxModalContext.Provider>
      </WalletContext.Provider>
    </MockSDKProvider>
  ),
]
```

## Fixture Scenarios

Use fixtures from `config/test/msw/fixtures/`:

| Scenario          | Tokens | Positions           | Use Case            |
| ----------------- | ------ | ------------------- | ------------------- |
| `efSafe`          | 32     | $142M (8 protocols) | DeFi heavy, default |
| `vitalik`         | 1551   | $19M                | Whale, performance  |
| `spamTokens`      | 26     | $1.7M               | Spam filtering      |
| `safeTokenHolder` | 25     | $707 (15 protocols) | Protocol diversity  |
| `empty`           | 0      | $0                  | Empty states        |

```typescript
import {
  safeFixtures,
  chainFixtures,
  balancesFixtures,
  positionsFixtures,
  portfolioFixtures,
  safeAppsFixtures,
  SAFE_ADDRESSES,
} from '../../../../../../config/test/msw/fixtures'
```

## Context Error Reference

| Error Pattern                              | Required Context              |
| ------------------------------------------ | ----------------------------- |
| `could not find react-redux context`       | `StoreDecorator`              |
| `useWallet` / `useWalletContext` undefined | `WalletContext.Provider`      |
| `useSafeSDK` undefined                     | `MockSDKProvider`             |
| `TxModalContext` / `setTxFlow` undefined   | `TxModalContext.Provider`     |
| `RouterContext` / `useRouter` undefined    | Next.js handles automatically |

## Critical Reminders

1. **Always render REAL components** - Never mock components, mock their data dependencies instead
2. **Use fixtures** from `config/test/msw/fixtures/` for realistic data
3. **`deployed: true`** required in safeInfo for RTK Query to fire
4. **Regex patterns** for MSW handlers, not string wildcards
5. **Handler order matters** - MSW matches handlers in order, place specific handlers first
6. **Add mswLoader** at both meta and story level for docs mode compatibility

## Adding Learnings

When you discover new patterns, gotchas, or fixes while working on Storybook stories:

1. Add them to `specs/001-shadcn-storybook-migration/research.md` under a new section
2. If it's a core pattern that should be referenced frequently, add it to this file

## Example: Complete Story Template

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { safeFixtures, chainFixtures, balancesFixtures } from '../../../../../../config/test/msw/fixtures'
import MyComponent from './MyComponent'

const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  chainData.features = chainData.features.filter((f: string) =>
    !['PORTFOLIO_ENDPOINT', 'POSITIONS'].includes(f)
  )
  return chainData
}

const createHandlers = () => [
  http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(createChainData())),
  http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () =>
    HttpResponse.json(safeFixtures.efSafe)
  ),
  http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () =>
    HttpResponse.json(balancesFixtures.efSafe)
  ),
]

const meta = {
  title: 'Components/Category/MyComponent',
  component: MyComponent,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    msw: { handlers: createHandlers() },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      return (
        <StoreDecorator
          initialState={{
            safeInfo: {
              data: { ...safeFixtures.efSafe, deployed: true },
              loading: false,
              loaded: true,
            },
            chains: { data: [createChainData()], loading: false },
            settings: {
              currency: 'usd',
              hiddenTokens: {},
              tokenList: TOKEN_LISTS.ALL,
              shortName: { copy: true, qr: true },
              theme: { darkMode: isDarkMode },
              env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
              signing: { onChainSigning: false, blindSigning: false },
              transactionExecution: true,
            },
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  loaders: [mswLoader],
}
```
