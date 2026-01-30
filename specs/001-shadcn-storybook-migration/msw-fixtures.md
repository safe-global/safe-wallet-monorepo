# MSW Fixture Documentation

**Branch**: `001-shadcn-storybook-migration` | **Date**: 2026-01-30

This document describes the fixture-based MSW infrastructure for Storybook stories.

## Architecture Overview

```
config/test/msw/
├── fixtures/                    # Real API response data (JSON)
│   ├── balances/               # Token balances
│   ├── portfolio/              # Portfolio aggregation
│   ├── positions/              # DeFi positions
│   ├── safes/                  # Safe info
│   ├── chains/                 # Chain configuration
│   ├── safe-apps/              # Safe Apps
│   └── index.ts                # Type-safe exports
├── handlers/
│   ├── fromFixtures.ts         # Primary fixture-based handlers
│   ├── safe.ts                 # Auth, relay, messages
│   ├── transactions.ts         # Transaction endpoints
│   ├── web3.ts                 # RPC handlers
│   └── index.ts                # Barrel export
├── scenarios/                  # State handlers (empty, error, loading)
└── scripts/
    └── fetch-fixtures.ts       # Fixture refresh script
```

## Available Fixture Scenarios

| Scenario           | Description                | Tokens | Positions           | Use Case                         |
| ------------------ | -------------------------- | ------ | ------------------- | -------------------------------- |
| `efSafe`           | Ethereum Foundation Safe   | 32     | $142M (8 protocols) | DeFi heavy, position aggregation |
| `vitalik`          | Vitalik's Safe             | 1551   | $19M (1 protocol)   | Whale, performance testing       |
| `spamTokens`       | Spam token Safe            | 26     | $1.7M (2 protocols) | Spam filtering                   |
| `safeTokenHolder`  | SAFE token holder          | 25     | $707 (15 protocols) | Protocol diversity               |
| `empty`            | Empty Safe                 | 0      | $0                  | Empty states, onboarding         |
| `withoutPositions` | EF Safe, no POSITIONS flag | 32     | N/A                 | Feature flag testing             |

## Usage in Stories

### Basic Usage

```typescript
import { fixtureHandlers } from '@safe-global/test/msw/handlers'

const GATEWAY_URL = 'https://safe-client.safe.global'

export const Default: Story = {
  parameters: {
    msw: {
      handlers: fixtureHandlers.efSafe(GATEWAY_URL),
    },
  },
}
```

### With Feature Flag Testing

```typescript
// Test with POSITIONS feature disabled
export const WithoutPositions: Story = {
  parameters: {
    msw: {
      handlers: fixtureHandlers.withoutPositions(GATEWAY_URL),
    },
  },
}
```

### Combining with Custom Handlers

```typescript
import { fixtureHandlers } from '@safe-global/test/msw/handlers'
import { http, HttpResponse } from 'msw'

export const WithError: Story = {
  parameters: {
    msw: {
      handlers: [
        ...fixtureHandlers.efSafe(GATEWAY_URL),
        // Override specific endpoint
        http.get('*/v1/chains/:chainId/safes/:address/balances/*', () => {
          return HttpResponse.json({ error: 'Failed' }, { status: 500 })
        }),
      ],
    },
  },
}
```

## Endpoint Coverage

### ✅ Covered by Fixtures

| Endpoint                                                     | Handler                              | Scenarios                                    |
| ------------------------------------------------------------ | ------------------------------------ | -------------------------------------------- |
| `GET /v1/chains`                                             | `createChainHandlersFromFixture`     | All                                          |
| `GET /v1/chains/:chainId`                                    | `createChainHandlersFromFixture`     | All                                          |
| `GET /v1/chains/:chainId/safes/:address`                     | `createSafeHandlersFromFixture`      | efSafe, vitalik, spamTokens, safeTokenHolder |
| `GET /v1/chains/:chainId/safes/:address/balances/:currency`  | `createBalanceHandlersFromFixture`   | All                                          |
| `GET /v1/chains/:chainId/safes/:address/positions/:fiatCode` | `createPositionHandlersFromFixture`  | All                                          |
| `GET /v1/portfolio/:address`                                 | `createPortfolioHandlersFromFixture` | All                                          |
| `GET /v1/chains/:chainId/safe-apps`                          | `createSafeAppsHandlersFromFixture`  | mainnet, empty                               |

### ⚠️ Covered by Utility Handlers (Synthetic Data)

| Endpoint                                                      | Handler                     | Notes           |
| ------------------------------------------------------------- | --------------------------- | --------------- |
| `GET /v1/auth/nonce`                                          | `createSafeHandlers`        | Auth flow       |
| `GET /v1/chains/:chainId/relay/:address`                      | `createSafeHandlers`        | Relay remaining |
| `GET /v1/chains/:chainId/about/master-copies`                 | `createSafeHandlers`        | Safe versions   |
| `GET /v1/chains/:chainId/safes/:address/messages`             | `createSafeHandlers`        | Message signing |
| `GET /v1/chains/:chainId/transactions/:id`                    | `createTransactionHandlers` | Tx details      |
| `GET /v1/chains/:chainId/safes/:address/transactions/queued`  | `createTransactionHandlers` | Tx queue        |
| `GET /v1/chains/:chainId/safes/:address/transactions/history` | `createTransactionHandlers` | Tx history      |

### ❌ Not Yet Covered

| Endpoint                                              | Priority | Used By        |
| ----------------------------------------------------- | -------- | -------------- |
| `GET /v2/chains/:chainId/safes/:address/collectibles` | Low      | NFT components |

## Refreshing Fixtures

To update fixtures with fresh data from staging CGW:

```bash
npx tsx config/test/msw/scripts/fetch-fixtures.ts
```

The script fetches from these Safes:

- **EF Safe**: `eth:0x9fC3dc011b461664c835F2527fffb1169b3C213e`
- **Vitalik**: `eth:0x220866b1a2219f40e72f5c628b65d54268ca3a9d`
- **Spam Tokens**: `eth:0x9d94ef33e7f8087117f85b3ff7b1d8f27e4053d5`
- **SAFE Token Holder**: `eth:0x8675B754342754A30A2AeF474D114d8460bca19b`

## Scenario Metadata

For IDE hints and Storybook selectors, use `FIXTURE_SCENARIOS`:

```typescript
import { FIXTURE_SCENARIOS } from '@safe-global/test/msw/handlers'

// Access scenario metadata
const scenario = FIXTURE_SCENARIOS.efSafe
console.log(scenario.description) // "$142M in DeFi positions across 8 protocols..."
console.log(scenario.tokens) // 32
console.log(scenario.defiApps) // 8
```

## Adding New Fixtures

1. **Add to fetch-fixtures.ts** if fetching from CGW
2. **Create JSON file** in appropriate `fixtures/` subdirectory
3. **Export from fixtures/index.ts** with type annotation
4. **Add handler** in `fromFixtures.ts`
5. **Update this documentation**

## Dependency Audit

Run the dependency audit to identify fixture gaps:

```bash
yarn workspace @safe-global/web storybook:dependencies
```

This analyzes uncovered components and reports:

- Most used hooks
- Fixture gaps (endpoints not covered)
- Recommendations for new fixtures
