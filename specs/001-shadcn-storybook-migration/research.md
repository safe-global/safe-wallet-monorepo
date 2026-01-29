# Research Findings: Design System Migration

**Branch**: `001-shadcn-storybook-migration` | **Date**: 2026-01-29

## 1. MSW-Storybook Integration

### Decision: Use existing native MSW support via `parameters.msw.handlers`

**Rationale**: The codebase already has functional MSW-Storybook integration without needing the explicit `msw-storybook-addon`. Storybook 10.1.10 has built-in support for `parameters.msw.handlers` pattern.

**Alternatives Considered**:
- `msw-storybook-addon` explicit installation: Not needed, already works transitively via `@chromatic-com/storybook`
- Custom decorator approach: More complex, less integrated with Storybook ecosystem

### Current State

| Component | Version | Status |
|-----------|---------|--------|
| MSW | 2.7.3 | Installed at root |
| @chromatic-com/storybook | 4.1.2 | Includes msw-storybook-addon transitively |
| Storybook | 10.1.10 | Native `parameters.msw.handlers` support |

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

| Component | Status |
|-----------|--------|
| `@chromatic-com/storybook` addon | ✅ Installed (v4.1.2) |
| jest-image-snapshot | ✅ Installed (v6.5.1) |
| Chromatic project token | ❌ Not configured |
| Chromatic GitHub workflow | ❌ Not present |
| Custom screenshot workflow | ✅ Active (web-storybook-screenshots.yml) |

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
          exitZeroOnChanges: false  # Fail PR if unapproved changes
          exitOnceUploaded: true    # Don't wait for verification
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

## Summary

| Research Area | Decision | Key Action |
|---------------|----------|------------|
| MSW-Storybook | Use existing `parameters.msw.handlers` | Extend handlers, add factories |
| Chromatic CI | Adopt Chromatic cloud | Create workflow, set token |
| Story Templates | 3-tier template system | Create template files |
| Component Inventory | TypeScript AST script | Build inventory tool |
| Web3 Mocking | Decorator + handlers | Create MockWeb3Provider |

All research tasks complete. Ready for Phase 1 design artifacts.
