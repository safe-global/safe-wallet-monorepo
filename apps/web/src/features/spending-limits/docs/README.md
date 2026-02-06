# Spending Limits Feature

## Overview

Spending Limits allow Safe owners to delegate spending authority to beneficiaries. A beneficiary can execute token transfers within their allowance without requiring multi-signature approval from Safe owners.

This feature is powered by the [Allowance Module](https://github.com/safe-global/safe-modules/tree/main/modules/allowances), a Safe module that enables granular spending permissions.

## User Roles

### Safe Owners

- Create, modify, and remove spending limits
- Set allowances for any token in the Safe
- Define reset periods (one-time or recurring)
- Choose beneficiaries (any Ethereum address)

### Beneficiaries

- Execute token transfers within their allowance
- Single-signature transactions (no multi-sig required)
- Can be any address, not just Safe signers

### Beneficiary-Only Users

- Users who are beneficiaries but NOT Safe owners or proposers
- Can only transact using their spending limit
- Cannot manage Safe settings or propose standard transactions

## User Flows

### Creating a Spending Limit

1. Navigate to Settings > Setup > Spending Limits
2. Click "New spending limit"
3. Enter beneficiary address
4. Select token and amount
5. Choose reset period:
   - **One time**: Allowance can only be used once
   - **Recurring**: Allowance refills automatically after the reset period
6. Review and sign the transaction

**Note**: The first spending limit for a Safe will also enable the Allowance Module.

### Using a Spending Limit

1. Start a token transfer
2. If you have a spending limit for the selected token, choose "Spending limit" as the transaction type
3. Enter recipient and amount (within your allowance)
4. Execute with a single signature

### Managing Spending Limits

- View all active spending limits in Settings > Setup > Spending Limits
- See spent/available amounts and reset times
- Remove limits by clicking the delete icon

## Data Model

```typescript
type SpendingLimitState = {
  beneficiary: string // Address of the beneficiary
  token: {
    address: string // Token contract address
    symbol: string // Token symbol (e.g., "USDC")
    decimals?: number // Token decimals
    logoUri?: string // Token logo URL
  }
  amount: string // Total allowance (in wei)
  spent: string // Amount already spent (in wei)
  nonce: string // Allowance nonce
  resetTimeMin: string // Reset period in minutes ("0" = one-time)
  lastResetMin: string // Last reset timestamp in minutes
}
```

## Reset Periods

| Environment | Options                          |
| ----------- | -------------------------------- |
| Production  | One time, 1 day, 1 week, 1 month |
| Testnet     | One time, 5 min, 30 min, 1 hour  |

- **One-time** (`resetTimeMin = "0"`): Allowance is permanent, no automatic refill
- **Recurring**: Allowance refills to the full amount after the reset period

## Contract Integration

### AllowanceModule Methods

| Method                                                        | Description                       |
| ------------------------------------------------------------- | --------------------------------- |
| `addDelegate(delegate)`                                       | Register a new beneficiary        |
| `setAllowance(delegate, token, amount, resetTime, resetBase)` | Set/update an allowance           |
| `deleteAllowance(delegate, token)`                            | Remove an allowance               |
| `executeAllowanceTransfer(...)`                               | Execute a spending limit transfer |
| `getDelegates(safe, start, pageSize)`                         | List all beneficiaries            |
| `getTokens(safe, delegate)`                                   | List tokens for a beneficiary     |
| `getTokenAllowance(safe, delegate, token)`                    | Get allowance details             |

### Module Addresses

The Allowance Module is deployed across multiple chains. Addresses are fetched from `@safe-global/safe-modules-deployments`.

Supported versions:

- 0.1.0
- 0.1.1

## Architecture

### Feature Structure

```
src/features/spending-limits/
├── index.ts                 # Public API exports
├── contract.ts              # TypeScript interface
├── feature.ts               # Lazy-loaded implementation
├── types.ts                 # Type definitions
├── constants.ts             # Reset time options
├── components/
│   ├── SpendingLimitsSettings/  # Settings page UI
│   ├── SpendingLimitRow/        # Transaction type selector
│   ├── CreateSpendingLimit/     # New limit form
│   ├── ReviewSpendingLimit/     # Review new limit
│   ├── RemoveSpendingLimitReview/
│   └── ReviewSpendingLimitTx/   # Spending limit execution
├── hooks/
│   ├── useSpendingLimits.ts     # useLoadSpendingLimits (used by SpendingLimitsLoader)
│   ├── useSpendingLimit.ts      # Get limit for token
│   ├── useSpendingLimitGas.ts   # Gas estimation
│   └── useIsOnlySpendingLimitBeneficiary.ts
├── services/
│   ├── spendingLimitContracts.ts
│   ├── spendingLimitParams.ts
│   ├── spendingLimitLoader.ts
│   └── spendingLimitExecution.ts
└── store/
    └── spendingLimitsSlice.ts
```

### Data Loading

Spending limits data is loaded automatically on app start via the `SpendingLimitsLoader` component.

**Architecture:**

1. **Global loader component** (`SpendingLimitsLoader`) - Lazy-loaded, fetches data when Safe is loaded
2. **Store selectors** - Components read data from Redux store

This keeps the heavy fetching logic lazy-loaded while making data available to all components.

**How to read spending limits:**

```typescript
import { selectSpendingLimits } from '@/features/spending-limits'
import { useAppSelector } from '@/store'

// Read data from store (loaded on app start)
const spendingLimits = useAppSelector(selectSpendingLimits)
```

### Feature Flag

This feature is controlled by the `SPENDING_LIMIT` feature flag, configured per-chain in the CGW API.

```typescript
import { SpendingLimitsFeature } from '@/features/spending-limits'
import { useLoadFeature } from '@/features/__core__'

const { SpendingLimitsSettings, $isDisabled, $isLoading } = useLoadFeature(SpendingLimitsFeature)

// Check feature status
if ($isDisabled) return null
if ($isLoading) return <Skeleton />

// Use components
<SpendingLimitsSettings />
```

## Testing

### Unit Tests

```bash
yarn workspace @safe-global/web test --testPathPattern=spending
```

### E2E Tests

- `cypress/e2e/smoke/spending_limits.cy.js`
- `cypress/e2e/regression/spending_limits.cy.js`
- `cypress/e2e/regression/spending_limits_nonowner.cy.js`

### Manual Testing Checklist

- [ ] Create spending limit as Safe owner
- [ ] Execute transfer as beneficiary
- [ ] Verify beneficiary-only user permissions
- [ ] Test reset period behavior
- [ ] Remove spending limit

## Security Considerations

- Spending limits bypass multi-sig requirements - owners should carefully consider allowance amounts
- Beneficiaries can drain their full allowance in a single transaction
- Module must be enabled on the Safe before setting allowances
- Removing a spending limit requires a standard multi-sig transaction
