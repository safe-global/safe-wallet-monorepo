# Research Findings: Design System Migration

**Branch**: `001-shadcn-storybook-migration` | **Date**: 2026-01-29

## 1. MSW-Storybook Integration

### Decision: Use existing native MSW support via `parameters.msw.handlers`

**Rationale**: The codebase already has functional MSW-Storybook integration without needing the explicit `msw-storybook-addon`. Storybook 10.1.10 has built-in support for `parameters.msw.handlers` pattern.

**Alternatives Considered**:

- `msw-storybook-addon` explicit installation: Not needed, already works transitively via `@chromatic-com/storybook`
- Custom decorator approach: More complex, less integrated with Storybook ecosystem

### Current State

| Component                | Version | Status                                    |
| ------------------------ | ------- | ----------------------------------------- |
| MSW                      | 2.7.3   | Installed at root                         |
| @chromatic-com/storybook | 4.1.2   | Includes msw-storybook-addon transitively |
| Storybook                | 10.1.10 | Native `parameters.msw.handlers` support  |

### Working Pattern (from existing stories)

```typescript
import { http, HttpResponse } from 'msw'

const meta = {
  component: MyComponent,
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/transactions/:id', () => {
          return HttpResponse.json(mockData)
        }),
      ],
    },
  },
} satisfies Meta<typeof MyComponent>

// Per-story override
export const ErrorCase: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/transactions/:id', () => {
          return HttpResponse.json(null, { status: 500 })
        }),
      ],
    },
  },
}
```

### Existing MSW Handlers

Located at: `config/test/msw/handlers.ts` (463 lines)

**Endpoints currently mocked (18+)**:

- Authentication (nonce)
- Balances & collectibles
- Safe info & relay limits
- Master copies & chain config
- Safe Apps
- Transactions & messages
- Notifications
- Data decoder
- Targeted messaging (Hypernative)
- OAuth token exchange

### Gaps to Fill

1. **Web3 provider mocking** - Not currently in handlers.ts
2. **Organized handler modules** - All in single file, should split by domain
3. **Factory functions** - No faker-based factories for common entities
4. **Scenario presets** - No predefined error/loading/empty state scenarios

---

## 2. Chromatic Configuration & CI

### Decision: Adopt Chromatic cloud service with GitHub Actions workflow

**Rationale**: The `@chromatic-com/storybook` addon is already installed. Chromatic provides designer-friendly review workflow that integrates with GitHub PRs, matching the spec requirement for designer sign-off.

**Alternatives Considered**:

- Custom screenshot solution (currently in place): Uses Playwright + S3 + PR comments. Works but lacks structured approval workflow and visual diff comparison.
- jest-image-snapshot only: Local visual testing, no cloud review capability.

### Current State

| Component                        | Status                                    |
| -------------------------------- | ----------------------------------------- |
| `@chromatic-com/storybook` addon | ✅ Installed (v4.1.2)                     |
| jest-image-snapshot              | ✅ Installed (v6.5.1)                     |
| Chromatic project token          | ❌ Not configured                         |
| Chromatic GitHub workflow        | ❌ Not present                            |
| Custom screenshot workflow       | ✅ Active (web-storybook-screenshots.yml) |

### Required Setup

1. **GitHub Secrets**:
   - `CHROMATIC_PROJECT_TOKEN` - From Chromatic project settings

2. **New Workflow**: `.github/workflows/chromatic.yml`

```yaml
name: Chromatic

on:
  push:
    branches: [dev, main]
  pull_request:
    branches: [dev]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: yarn
      - run: yarn install --frozen-lockfile
      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          workingDir: apps/web
          buildScriptName: build-storybook
          exitZeroOnChanges: false # Fail PR if unapproved changes
          exitOnceUploaded: true # Don't wait for verification
```

3. **Package.json scripts** (apps/web):

```json
{
  "chromatic": "chromatic --build-script-name build-storybook",
  "chromatic:ci": "chromatic --ci --auto-accept-changes main"
}
```

### Existing Visual Testing Setup

**test-runner.mjs configuration**:

- Threshold: 5% (configurable via `VISUAL_REGRESSION_THRESHOLD`)
- Snapshots: `__visual_snapshots__/`
- Per-story opt-out: `parameters.visualTest.disable: true`
- Waits for fonts and network idle

---

## 3. Story Template Patterns

### Decision: Follow existing CSF3 patterns with three template tiers

**Rationale**: Consistency with existing 58 stories. Patterns are well-established and typed.

### Template 1: UI Component (shadcn primitives)

For stateless, self-contained components with no data dependencies:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './component-name'

const meta = {
  title: 'UI/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Label',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div className="flex flex-wrap items-center gap-4">
          <ComponentName variant="default">Default</ComponentName>
          <ComponentName variant="secondary">Secondary</ComponentName>
          <ComponentName variant="outline">Outline</ComponentName>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <ComponentName size="sm">Small</ComponentName>
          <ComponentName size="default">Default</ComponentName>
          <ComponentName size="lg">Large</ComponentName>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div className="flex flex-wrap items-center gap-4">
          <ComponentName>Enabled</ComponentName>
          <ComponentName disabled>Disabled</ComponentName>
        </div>
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}
```

### Template 2: Common Component (with data/store)

For components that need Redux state or API data:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { StoreDecorator } from '@/stories/storeDecorator'
import { ComponentName } from './ComponentName'

const mockData = {
  // Deterministic mock data for snapshots
}

const meta = {
  title: 'Common/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get('*/v1/endpoint', () => {
          return HttpResponse.json(mockData)
        }),
      ],
    },
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    address: '0x1234567890123456789012345678901234567890',
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/endpoint', async () => {
          await new Promise((r) => setTimeout(r, 100000))
          return HttpResponse.json({})
        }),
      ],
    },
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/endpoint', () => {
          return HttpResponse.json({ error: 'Failed' }, { status: 500 })
        }),
      ],
    },
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/endpoint', () => {
          return HttpResponse.json([])
        }),
      ],
    },
  },
}
```

### Template 3: Page-Level Story (with layout)

For full-page stories with sidebar and header:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { LayoutDecorator } from '@/.storybook/decorators/LayoutDecorator'
import { StoreDecorator } from '@/stories/storeDecorator'
import { DashboardPage } from './DashboardPage'
import { mockSafeInfo, mockBalances, mockTransactions } from './mockData'

const meta = {
  title: 'Pages/Dashboard',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/safes/:address', () => {
          return HttpResponse.json(mockSafeInfo)
        }),
        http.get('*/v1/chains/:chainId/safes/:address/balances/*', () => {
          return HttpResponse.json(mockBalances)
        }),
        http.get('*/v1/chains/:chainId/safes/:address/transactions/*', () => {
          return HttpResponse.json(mockTransactions)
        }),
      ],
    },
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{ /* safe state */ }}>
        <LayoutDecorator>
          <Story />
        </LayoutDecorator>
      </StoreDecorator>
    ),
  ],
} satisfies Meta<typeof DashboardPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}
```

---

## 4. Component Inventory Automation

### Decision: TypeScript-based AST analysis script

**Rationale**: Can integrate with existing tooling, provides type-safe output, reusable for ongoing coverage tracking.

### Approach

Use `@typescript-eslint/parser` to:

1. Find all `.tsx` files in target directories
2. Detect exported React components (function components, class components)
3. Extract hook/API dependencies from imports and function bodies
4. Cross-reference with `.stories.tsx` files

### Output Schema

```typescript
interface ComponentInventory {
  path: string
  name: string
  type: 'ui' | 'common' | 'feature' | 'page'
  hasStory: boolean
  storyPath?: string
  dependencies: {
    hooks: string[]
    apiCalls: string[]
    reduxSelectors: string[]
  }
  priority: number // Calculated based on visibility + dependencies
}
```

### Implementation Location

`scripts/storybook/inventory.ts` - Runs as: `yarn workspace @safe-global/web inventory`

---

## 5. Web3 Mocking in Storybook

### Decision: Create dedicated Web3 mock decorator and handlers

**Rationale**: Many components depend on wallet connection state. Need consistent mocking approach.

### Approach

1. **Mock Provider Decorator**

```typescript
// .storybook/decorators/MockWeb3Decorator.tsx
export const MockWeb3Decorator = ({
  isConnected = true,
  chainId = 1,
  address = '0x1234...',
}: MockWeb3Config) => (Story) => (
  <MockWeb3Provider
    isConnected={isConnected}
    chainId={chainId}
    address={address}
  >
    <Story />
  </MockWeb3Provider>
)
```

2. **RPC Handlers** (for ethers.js calls)

```typescript
// config/test/msw/handlers/web3.ts
export const web3Handlers = [
  http.post('*/rpc', async ({ request }) => {
    const body = await request.json()
    switch (body.method) {
      case 'eth_chainId':
        return HttpResponse.json({ result: '0x1' })
      case 'eth_getBalance':
        return HttpResponse.json({ result: '0x1000000000000000000' })
      // ... other methods
    }
  }),
]
```

### Considerations

- Need to mock Web3-Onboard provider state
- Some components may need transaction signing mocks
- Chain switching scenarios require state updates

---

---

## 6. Context Provider Patterns for Complex Stories

### Decision: Stack multiple context providers for components with complex dependencies

**Rationale**: Many Safe{Wallet} components require multiple contexts beyond just Redux state. The patterns below were discovered through implementation of Phase 5 stories.

### Available Decorators/Helpers

| Helper            | Location                    | Purpose                                 |
| ----------------- | --------------------------- | --------------------------------------- |
| `StoreDecorator`  | `@/stories/storeDecorator`  | Wraps story with Redux Provider         |
| `RouterDecorator` | `@/stories/routerDecorator` | Wraps story with Next.js Router context |

### Context Providers for Complex Components

#### 1. MockSDKProvider (Safe SDK)

Components using `useSafeSDK()` or Safe SDK methods need this:

```typescript
import { useEffect } from 'react'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}
```

#### 2. WalletContext.Provider

Components using `useWallet()`, `useWalletContext()`, or `CheckWallet`:

```typescript
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
    provider: null,
  },
  setSignerAddress: () => {},
}
```

#### 3. TxModalContext.Provider

Components using `TxModalContext` (transaction flows, change threshold, etc.):

```typescript
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'

const mockTxModalContext: TxModalContextType = {
  txFlow: undefined,
  setTxFlow: () => {},
  setFullWidth: () => {},
}
```

### Template 4: Complex Component (with full context stack)

For components that need wallet, SDK, and Redux context:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { ComponentName } from './ComponentName'

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
    provider: null,
  },
  setSignerAddress: () => {},
}

const mockTxModalContext: TxModalContextType = {
  txFlow: undefined,
  setTxFlow: () => {},
  setFullWidth: () => {},
}

const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}

const meta: Meta<typeof ComponentName> = {
  title: 'Components/Category/ComponentName',
  component: ComponentName,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MockSDKProvider>
        <WalletContext.Provider value={mockConnectedWallet}>
          <TxModalContext.Provider value={mockTxModalContext}>
            <StoreDecorator
              initialState={{
                chains: {
                  data: [{ chainId: '1' }],
                },
                safeInfo: {
                  data: {
                    address: { value: MOCK_WALLET_ADDRESS },
                    chainId: '1',
                    owners: [
                      { value: MOCK_WALLET_ADDRESS },
                      { value: '0xabcdef1234567890abcdef1234567890abcdef12' },
                    ],
                    threshold: 2,
                    deployed: true,
                  },
                  loading: false,
                  loaded: true,
                },
              }}
            >
              <Paper sx={{ padding: 3, maxWidth: 800 }}>
                <Story />
              </Paper>
            </StoreDecorator>
          </TxModalContext.Provider>
        </WalletContext.Provider>
      </MockSDKProvider>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { /* component props */ },
}
```

### Common Redux State Shapes

#### safeInfo slice

```typescript
safeInfo: {
  data: {
    address: { value: '0x...' },
    chainId: '1',
    owners: [{ value: '0x...' }, { value: '0x...' }],
    threshold: 2,
    deployed: true,
    nonce: 42,                    // optional
    implementation: { value: '0x...' },  // optional
    modules: [],                  // optional
    guard: null,                  // optional
    fallbackHandler: { value: '0x...' }, // optional
    version: '1.3.0',             // optional
  },
  loading: false,
  loaded: true,
}
```

#### chains slice

```typescript
chains: {
  data: [
    {
      chainId: '1',
      chainName: 'Ethereum',      // optional
      shortName: 'eth',           // optional
      // ... other chain config
    },
  ],
}
```

#### balances slice

```typescript
balances: {
  data: {
    fiatTotal: '12345.67',
    items: [
      {
        tokenInfo: {
          type: 'NATIVE_TOKEN',   // or 'ERC20'
          address: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          logoUri: 'https://...',
        },
        balance: '1000000000000000000',
        fiatBalance: '3000.00',
        fiatConversion: '3000.00',
        fiatBalance24hChange: '-5.08%',  // optional
      },
    ],
  },
  loading: false,
  loaded: true,
  error: undefined,
}
```

#### settings slice

```typescript
settings: {
  currency: 'usd',
  hiddenTokens: {},              // { '1': ['0x...'] }
  tokenList: 'ALL',              // from TOKEN_LISTS enum
  shortName: { copy: true, qr: true },
  theme: { darkMode: false },
  env: {
    tenderly: { url: '', accessToken: '' },
    rpc: {},
  },
  signing: { onChainSigning: false, blindSigning: false },
  transactionExecution: true,
}
```

### Identifying Required Contexts

When a component fails in Storybook with context errors:

| Error Pattern                              | Required Context          |
| ------------------------------------------ | ------------------------- |
| `could not find react-redux context`       | `StoreDecorator`          |
| `useWallet` / `useWalletContext` undefined | `WalletContext.Provider`  |
| `useSafeSDK` undefined                     | `MockSDKProvider`         |
| `TxModalContext` / `setTxFlow` undefined   | `TxModalContext.Provider` |
| `RouterContext` / `useRouter` undefined    | `RouterDecorator`         |

### Example Files

Reference implementations for complex stories:

- `apps/web/src/components/balances/AssetsTable/index.stories.tsx` - Full context stack with balances
- `apps/web/src/components/settings/RequiredConfirmations/RequiredConfirmations.stories.tsx` - Wallet + TxModal contexts

---

## Summary

| Research Area       | Decision                               | Key Action                     |
| ------------------- | -------------------------------------- | ------------------------------ |
| MSW-Storybook       | Use existing `parameters.msw.handlers` | Extend handlers, add factories |
| Chromatic CI        | Adopt Chromatic cloud                  | Create workflow, set token     |
| Story Templates     | 3-tier template system                 | Create template files          |
| Component Inventory | TypeScript AST script                  | Build inventory tool           |
| Web3 Mocking        | Decorator + handlers                   | Create MockWeb3Provider        |
| Context Providers   | Stack providers for complex components | Use Template 4 pattern         |

All research tasks complete. Ready for Phase 1 design artifacts.

---

## 7. Real Component Stories (Page-Level)

### Decision: Render real components, mock data dependencies via MSW + chain config

**Rationale**: Mock components don't provide real visual testing value. Real components with mocked data dependencies give accurate visual representation.

### Key Learnings from Dashboard Implementation

#### 1. Feature Flag Control via Chain Config

Disable complex features that require extra mocking by filtering `chainData.features`:

```typescript
const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  chainData.features = chainData.features.filter(
    (f: string) =>
      ![
        'PORTFOLIO_ENDPOINT', // Uses portfolio API instead of balances
        'POSITIONS', // DeFi positions widget
        'RECOVERY', // Recovery feature
        'HYPERNATIVE', // Security alerts
        'NATIVE_SWAPS', // Swap feature
        'EARN', // Staking/earn features
        'SPACES', // Spaces feature
        'EURCV_BOOST', // Promotional banners
        'NO_FEE_CAMPAIGN', // Campaign banners
      ].includes(f),
  )
  return chainData
}
```

#### 2. Required Context Provider Stack

Most dashboard components need this provider stack:

```typescript
<MockSDKProvider>
  <WalletContext.Provider value={mockConnectedWallet}>
    <TxModalContext.Provider value={mockTxModalContext}>
      <StoreDecorator initialState={{...}}>
        <Story />
      </StoreDecorator>
    </TxModalContext.Provider>
  </WalletContext.Provider>
</MockSDKProvider>
```

#### 3. Essential Redux State Structure

```typescript
initialState: {
  safeInfo: {
    data: { ...safeFixtures.efSafe, deployed: true }, // deployed: true is CRITICAL
    loading: false,
    loaded: true,  // Must be true for RTK Query
  },
  chains: {
    data: [chainData],
    loading: false,
  },
  settings: {
    currency: 'usd',
    hiddenTokens: {},
    tokenList: TOKEN_LISTS.ALL,
    // ... other settings
  },
  safeApps: {
    pinned: [],
  },
}
```

#### 4. MSW Handler Coverage for Dashboard

Minimum handlers needed:

| Endpoint                                                 | Purpose             |
| -------------------------------------------------------- | ------------------- |
| `/v1/chains/:chainId`                                    | Chain config        |
| `/v1/chains`                                             | Chain list          |
| `/v1/chains/:chainId/safes/:address`                     | Safe info           |
| `/v1/chains/:chainId/safes/:address/balances/:currency`  | Token balances      |
| `/v1/chains/:chainId/safe-apps`                          | Safe Apps list      |
| `/v1/chains/:chainId/safes/:address/transactions/queued` | Pending txs         |
| `/v1/chains/:chainId/about/master-copies`                | Version checks      |
| `/v1/targeted-messaging/safes/:address/outreaches`       | Hypernative (empty) |

### Widget-Level Stories

Created bottom-up stories for individual widgets before composing page:

| Widget         | File                                    | Key Dependencies                                      |
| -------------- | --------------------------------------- | ----------------------------------------------------- |
| Overview       | `Overview/Overview.stories.tsx`         | `useSafeInfo`, `useVisibleBalances`, `TxModalContext` |
| AssetsWidget   | `Assets/Assets.stories.tsx`             | `useBalances`, `useVisibleAssets`                     |
| PendingTxsList | `PendingTxs/PendingTxsList.stories.tsx` | `useTxQueue`, `useRecoveryQueue` (disabled)           |
| SafeAppList    | `SafeAppList/SafeAppList.stories.tsx`   | `useSafeApps`, props-based                            |
| OwnerList      | `OwnerList/OwnerList.stories.tsx`       | `useSafeInfo`, `useAddressBook`, `TxModalContext`     |

### Best Practice: Bottom-Up Story Development

1. **Start with widgets** - Isolated, fewer dependencies
2. **Identify common patterns** - Reusable provider stacks, handlers
3. **Compose to pages** - Combine tested widgets with full context
4. **Disable non-essential features** - Reduce mocking complexity

### Reference Files

- Knowledge base: `apps/web/CLAUDE.storybook.md`
- Example real Dashboard: `apps/web/src/components/dashboard/Dashboard.stories.tsx`
- Fixture infrastructure: `config/test/msw/fixtures/`
