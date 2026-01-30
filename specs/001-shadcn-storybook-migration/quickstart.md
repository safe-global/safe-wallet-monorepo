# Quick Start: Creating Storybook Stories

**Branch**: `001-shadcn-storybook-migration` | **Date**: 2026-01-29

This guide walks you through creating Storybook stories for the Safe{Wallet} design system migration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Running Storybook](#running-storybook)
3. [Component Inventory Tool](#component-inventory-tool)
4. [Creating a UI Component Story](#creating-a-ui-component-story)
5. [Creating a Data-Dependent Story](#creating-a-data-dependent-story)
6. [Creating a Page-Level Story](#creating-a-page-level-story)
7. [Adding MSW Handlers](#adding-msw-handlers)
8. [Chromatic Review Process](#chromatic-review-process)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Ensure you have the monorepo set up:

```bash
# Install dependencies
yarn install

# Verify Storybook works
yarn workspace @safe-global/web storybook
```

---

## Running Storybook

```bash
# Development mode (with hot reload)
yarn workspace @safe-global/web storybook
# Opens at http://localhost:6006

# Build static version
yarn workspace @safe-global/web build-storybook

# Run snapshot tests
yarn workspace @safe-global/web test:storybook
```

---

## Component Inventory Tool

The inventory tool helps you find components that need stories and prioritizes them by importance.

### Running the Inventory

```bash
# Basic inventory scan
yarn workspace @safe-global/web storybook:inventory

# Verbose output with priority explanations
yarn workspace @safe-global/web storybook:inventory --verbose

# JSON output for processing
yarn workspace @safe-global/web storybook:inventory --json

# Save to file
yarn workspace @safe-global/web storybook:inventory --json --output inventory.json
```

### Example Output

```
📦 Component Inventory Scanner
==============================

📊 Coverage Summary
-------------------
Total Components: 330
With Stories: 14
Coverage: 4%

📁 Coverage by Category
-----------------------
other        [█░░░░░░░░░░░░░░░░░░░] 9/227 (4%)
transaction  [░░░░░░░░░░░░░░░░░░░░] 0/38 (0%)
sidebar      [░░░░░░░░░░░░░░░░░░░░] 0/3 (0%)

🎯 Top Priority Components (need stories)
------------------------------------------
  SafeHeaderInfo           [sidebar] Score: 20
  MultiAccountContextMenu  [sidebar] Score: 20
  QrModal                  [sidebar] Score: 15
```

### Generating Coverage Reports

```bash
# Markdown report
yarn workspace @safe-global/web storybook:coverage --format md --output coverage.md

# HTML report (visual dashboard)
yarn workspace @safe-global/web storybook:coverage --format html --output coverage.html

# JSON report (for CI/tooling)
yarn workspace @safe-global/web storybook:coverage --format json --output coverage.json
```

### Priority Scoring

Components are scored based on:

- **Category weight**: UI (10), Sidebar (15), Common (8)
- **Dependents**: Components used by many others score higher
- **Complexity**: Simple components (no mocking needed) score higher for quick wins
- **MSW needs**: Components that need API mocking get slight boost (common use case)

### Work Order

The tool suggests a phased approach:

1. **Phase 1**: UI primitives (no dependencies)
2. **Phase 2**: Sidebar components (critical for page stories)
3. **Phase 3**: Simple common components
4. **Phase 4**: Redux-dependent components
5. **Phase 5**: MSW-dependent components
6. **Phase 6**: Complex components (Web3, multiple decorators)

---

## Creating a UI Component Story

For shadcn/ui primitives (`/components/ui/`):

### Step 1: Create the story file

Story files are colocated with components. Create `component-name.stories.tsx` next to the component:

```
src/components/ui/
├── switch.tsx
└── switch.stories.tsx    ← Create this file
```

### Step 2: Use the UI template

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './switch'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    checked: false,
  },
}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Switch />
        <span>Unchecked</span>
      </div>
      <div className="flex items-center gap-4">
        <Switch checked />
        <span>Checked</span>
      </div>
      <div className="flex items-center gap-4">
        <Switch disabled />
        <span>Disabled</span>
      </div>
    </div>
  ),
}
```

### Step 3: Verify in Storybook

1. Run Storybook: `yarn workspace @safe-global/web storybook`
2. Navigate to UI → Switch in the sidebar
3. Verify all stories render correctly
4. Check the Docs tab for auto-generated documentation

---

## Creating a Data-Dependent Story

For components that need API data or Redux state:

### Step 1: Identify dependencies

Before writing the story, check what the component needs:

```typescript
// Look for these patterns in the component:
import { useSelector } from 'react-redux' // → Need StoreDecorator
import { useSafeInfo } from '@/hooks/useSafeInfo' // → Need MSW handler
import { useRouter } from 'next/router' // → Need RouterDecorator (usually automatic)
```

### Step 2: Create mock data

Use deterministic values (no faker/random) for consistent snapshots:

```typescript
// At the top of your story file
const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_CHAIN_ID = '1'

const mockApiResponse = {
  address: { value: MOCK_ADDRESS },
  threshold: 2,
  owners: [
    { value: '0xowner1111111111111111111111111111111111' },
    { value: '0xowner2222222222222222222222222222222222' },
  ],
}
```

### Step 3: Add decorators and MSW handlers

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { StoreDecorator } from '@/stories/storeDecorator'
import { AddressInfo } from './AddressInfo'

const meta = {
  title: 'Common/AddressInfo',
  component: AddressInfo,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/safes/:address', () => {
          return HttpResponse.json(mockApiResponse)
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
} satisfies Meta<typeof AddressInfo>
```

### Step 4: Add state stories

Always include Loading, Error, and Empty states:

```typescript
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/safes/:address', async () => {
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
        http.get('*/v1/chains/:chainId/safes/:address', () => {
          return HttpResponse.json({ error: 'Failed' }, { status: 500 })
        }),
      ],
    },
  },
}
```

---

## Creating a Page-Level Story

For full-page stories with sidebar and header:

### Step 1: Use fullscreen layout

```typescript
const meta = {
  title: 'Pages/Dashboard',
  component: DashboardPage,
  parameters: {
    layout: 'fullscreen', // Important!
  },
}
```

### Step 2: Add layout decorator

```typescript
decorators: [
  (Story) => (
    <StoreDecorator initialState={fullSafeState}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1 }}>
          <Header />
          <Story />
        </main>
      </div>
    </StoreDecorator>
  ),
],
```

### Step 3: Add viewport stories

```typescript
export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'responsive' },
    chromatic: { viewports: [1440] },
  },
}

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    chromatic: { viewports: [768] },
  },
}

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    chromatic: { viewports: [375] },
  },
}
```

---

## Adding MSW Handlers

### Option 1: Fixture handlers (recommended)

Use pre-configured fixtures with real API data from staging CGW:

```typescript
import { fixtureHandlers, FIXTURE_SCENARIOS } from '@safe-global/test/msw/handlers'

const GATEWAY_URL = 'https://safe-client.safe.global'

// In your story:
export const Default: Story = {
  parameters: {
    msw: {
      handlers: fixtureHandlers.efSafe(GATEWAY_URL),
    },
  },
}

// Available scenarios:
// - efSafe: $142M DeFi positions, 8 protocols (best for testing positions)
// - vitalik: 1551 tokens, whale scenario (best for performance testing)
// - spamTokens: Spam token testing
// - safeTokenHolder: 15 diverse DeFi protocols
// - empty: Empty state testing
// - withoutPositions: POSITIONS feature flag disabled
```

### Option 2: Inline handlers (simple overrides)

For component-specific mocking or overriding fixture data:

```typescript
import { http, HttpResponse } from 'msw'

parameters: {
  msw: {
    handlers: [
      http.get('*/v1/endpoint', () => {
        return HttpResponse.json(mockData)
      }),
    ],
  },
},
```

### Option 3: Combining fixtures with overrides

Layer inline handlers on top of fixtures:

```typescript
import { fixtureHandlers } from '@safe-global/test/msw/handlers'
import { http, HttpResponse } from 'msw'

export const WithError: Story = {
  parameters: {
    msw: {
      handlers: [
        ...fixtureHandlers.efSafe(GATEWAY_URL),
        // Override specific endpoint with error
        http.get('*/v1/chains/:chainId/safes/:address/balances/*', () => {
          return HttpResponse.json({ error: 'Failed' }, { status: 500 })
        }),
      ],
    },
  },
}
```

### Refreshing fixtures

To update fixtures with fresh data from staging CGW:

```bash
npx tsx config/test/msw/scripts/fetch-fixtures.ts
```

---

## Chromatic Review Process

### When PRs have visual changes:

1. **Chromatic runs automatically** on PR creation/update
2. **Check the Chromatic status** in GitHub PR checks
3. **Click "View in Chromatic"** to see visual diffs
4. **Review changes**:
   - Green: No visual changes
   - Yellow: Visual changes detected (need approval)
   - Red: Build failed

### Approving changes:

1. Open Chromatic review link
2. Compare side-by-side diffs
3. Click **Accept** for intentional changes
4. Click **Deny** for unintended changes → Fix in code
5. Designer must approve visual changes before merge

### Opting out of visual testing:

For stories that shouldn't be visually tested (e.g., loading spinners):

```typescript
export const LoadingSpinner: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
}
```

---

## Troubleshooting

### Story doesn't render

1. Check browser console for errors
2. Verify all imports are correct
3. Check if decorators are needed (StoreDecorator, Paper wrapper)

### MSW handlers not working

1. Verify URL pattern matches (use `*/v1/...` for flexible matching)
2. Check handler is in `parameters.msw.handlers` array
3. Use browser Network tab to see actual request URLs

### TypeScript errors

```bash
# Run type-check to see all errors
yarn workspace @safe-global/web type-check
```

### Snapshots failing

```bash
# Update snapshots after intentional changes
yarn workspace @safe-global/web test:storybook -u
```

### Component needs router

Storybook's Next.js integration handles router automatically. If issues persist:

```typescript
import { RouterDecorator } from '@/stories/routerDecorator'

decorators: [
  (Story) => (
    <RouterDecorator router={{ pathname: '/dashboard' }}>
      <Story />
    </RouterDecorator>
  ),
],
```

---

## Checklist: Before Committing

- [ ] Story file created next to component
- [ ] `tags: ['autodocs']` included
- [ ] All significant states covered (default, loading, error, empty, disabled)
- [ ] Deterministic mock data (no random/faker values)
- [ ] Type-check passes: `yarn workspace @safe-global/web type-check`
- [ ] Stories render correctly in Storybook
- [ ] No console errors

---

## Templates

Full templates are available in `specs/001-shadcn-storybook-migration/contracts/`:

- `ui-component.stories.template.tsx` - For shadcn primitives
- `common-component.stories.template.tsx` - For data-dependent components
- `page.stories.template.tsx` - For full-page layouts
- `msw-handler.template.ts` - For organized MSW handlers
