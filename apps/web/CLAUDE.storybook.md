# Storybook Patterns for Safe{Wallet}

This document provides quick reference patterns for creating Storybook stories. For comprehensive guides, see:

- **Quick Start Guide**: `specs/001-shadcn-storybook-migration/quickstart.md`
- **MSW Fixtures**: `specs/001-shadcn-storybook-migration/msw-fixtures.md`
- **Research/Learnings**: `specs/001-shadcn-storybook-migration/research.md`

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
