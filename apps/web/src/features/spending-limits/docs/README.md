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

| Environment                   | Options                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| Production                    | One time, 1 day, 1 week, 1 month                                                                     |
| Test chains (Sepolia, Goerli) | One time, 5 min, 30 min, 1 hour, 1 day, 1 week, 1 month — production periods plus short test periods |

- **Test chains** offer both sets: the short periods keep reset behaviour testable in one session, the production periods keep daily / weekly / monthly verifiable on Sepolia. Both apply to the Safe-level and the Workspace policy flows.
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
├── public/                  # Entry point for other code
│   ├── components/          # Gated components: SpendingLimitsSettings, ...
│   ├── hooks/               # useSpendingLimits, useSpendingLimit, ...
│   ├── services/
│   └── store/               # spendingLimitsRefreshListener
├── components/              # Private UI
├── hooks/                   # Private hooks
├── services/                # Private services
├── store/                   # spendingLimitsApi (RTK Query endpoint)
└── stories/                 # withSpendingLimits story decorator
```

### Data Loading

The `getSpendingLimits` RTK Query endpoint in `store/spendingLimitsApi.ts` reads the limits from the chain. The key is the chain, the Safe address, its module addresses and the custom RPC, so every caller shares one read per Safe. The loader service is imported on the first read only.

- The read gets no token list. ERC-20 symbols and decimals come from the chain, and the native token comes from the chain config. The settings table takes the symbol, decimals and logo of a token the Safe holds from its balances (`public/services/withKnownTokenInfo.ts`); the Workspace flow does the same with its token options, because the chain read has no logos and falls back to 18 decimals when a token's calls fail.
- When the Safe's `txHistoryTag` changes, `spendingLimitsRefreshListener` invalidates that Safe's tag. The refetch keeps the old limits on screen until the new ones arrive.
- A Safe without modules reads nothing.
- A failed read is read again every 30 seconds (`SPENDING_LIMITS_RETRY_MS`) until it succeeds.

**How to read spending limits:**

```typescript
import useSpendingLimits from '@/features/spending-limits/public/hooks/useSpendingLimits'

// The Safe in the URL, also inside a Space flow; empty while the SPENDING_LIMIT flag is off
const { spendingLimits, loading } = useSpendingLimits()
```

In a story, put the limits in the cache with `withSpendingLimits(limits)` inside the store decorator.

### Feature Flag

This feature is controlled by the `SPENDING_LIMIT` feature flag, configured per-chain in the CGW API.

`public/components/SpendingLimitsSettings` and the other public components render nothing while the flag is off, so consumers do not check it:

```typescript
import SpendingLimitsSettings from '@/features/spending-limits/public/components/SpendingLimitsSettings'

<SpendingLimitsSettings />
```

## Testing

### Unit Tests

```bash
yarn workspace @safe-global/web test --testPathPatterns=spending
```

### E2E Tests

- `e2e/tests/e2e/spending-limit.spec.ts` (Playwright, isolated stack)

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
