# @safe-global/utils

Shared utilities, hooks, services, and business logic for Safe Wallet web and mobile applications.

## Overview

This package provides cross-platform utilities used by both `apps/web` and `apps/mobile`. It includes:

- Pure utility functions (formatting, validation, address handling)
- React hooks for common async operations
- Services for blockchain interactions
- Feature-specific business logic
- Test utilities and builders

## Directory Structure

```
src/
├── components/       # Shared React components (confirmation views, tx utilities)
├── config/           # Cross-platform configuration and constants
├── features/         # Feature-specific business logic
├── hooks/            # React hooks for async operations
├── services/         # Stateful services and blockchain interactions
├── tests/            # Test utilities and data builders
├── types/            # Auto-generated contract types (Typechain)
└── utils/            # Pure utility functions
```

### `/hooks` - React Hooks

Core async and utility hooks:

| Hook                 | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `useAsync`           | Generic async operation wrapper with loading/error states |
| `useDebounce`        | Debounce value changes                                    |
| `useIntervalCounter` | Counter that increments at intervals                      |
| `useDefaultGasPrice` | Fetch default gas price for chain                         |
| `useDefaultGasLimit` | Estimate gas limit for transactions                       |
| `useSignerCanPay`    | Check if signer has enough funds for gas                  |
| `useTxTokenInfo`     | Get token info for transaction                            |

```typescript
import { useAsync } from '@safe-global/utils/hooks/useAsync'

const [data, error, loading] = useAsync(
  async () => fetchData(),
  [dependency],
  false, // immediate execution
)
```

### `/utils` - Pure Utilities

| File               | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `addresses.ts`     | Address validation, checksumming, comparison |
| `chains.ts`        | Chain feature detection utilities            |
| `formatters.ts`    | Number and amount formatting                 |
| `formatNumber.ts`  | Locale-aware number formatting               |
| `gateway.ts`       | Gateway URL builders                         |
| `helpers.ts`       | Generic helper functions                     |
| `hex.ts`           | Hex encoding/decoding                        |
| `safe-messages.ts` | EIP-712 message handling                     |
| `tokens.ts`        | Token utilities                              |
| `validation.ts`    | Data validation functions                    |
| `web3.ts`          | Web3/ethers.js utilities                     |

```typescript
import { sameAddress, shortenAddress } from '@safe-global/utils/utils/addresses'
import { formatAmount } from '@safe-global/utils/utils/formatters'

sameAddress('0xABC...', '0xabc...') // true (case-insensitive)
shortenAddress('0x1234567890abcdef...') // '0x1234...cdef'
formatAmount('1000000000000000000') // '1.0'
```

### `/services` - Services

| Directory/File       | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `contracts/`         | Contract deployment info, bytecode comparison |
| `delegates/`         | Delegate management                           |
| `exceptions/`        | Error code mapping and utilities              |
| `security/`          | BlockAid integration, security modules        |
| `ExternalStore.ts`   | External state store pattern                  |
| `RelayTxWatcher.ts`  | Watch relayed transaction status              |
| `SimpleTxWatcher.ts` | Watch on-chain transaction status             |

```typescript
import { ExternalStore } from '@safe-global/utils/services/ExternalStore'

const store = new ExternalStore<MyState>()
store.setStore(newState)
const current = store.getStore()
```

### `/features` - Feature Business Logic

| Feature           | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `counterfactual/` | Undeployed (counterfactual) Safe support     |
| `multichain/`     | Multi-chain operation hooks and utilities    |
| `safe-shield/`    | Security analysis builders, hooks, and utils |
| `stake/`          | Native staking utilities                     |
| `swap/`           | DEX swap logic and fee calculations          |

```typescript
import { getCounterfactualBalance } from '@safe-global/utils/features/counterfactual'
import { calculateSwapFee } from '@safe-global/utils/features/swap'
```

### `/tests` - Test Utilities

Test helpers using the builder pattern with [Faker.js](https://fakerjs.dev/):

| File              | Purpose                                |
| ----------------- | -------------------------------------- |
| `Builder.ts`      | Generic builder pattern implementation |
| `builders/`       | Domain-specific test data builders     |
| `transactions.ts` | Transaction test utilities             |
| `utils.ts`        | General test utilities                 |
| `web3Provider.ts` | Mock Web3 provider                     |

```typescript
import { Builder } from '@safe-global/utils/tests/Builder'
import { faker } from '@faker-js/faker'

const mockSafe = new Builder().with({ address: faker.finance.ethereumAddress() }).with({ threshold: 2 }).build()
```

### `/types` - Contract Types

Auto-generated TypeScript types from contract ABIs using Typechain. Includes:

- `@openzeppelin/` - OpenZeppelin contract types
- `@safe-global/` - Safe contract types
- `factories/` - Contract factory classes

> **Note:** These files are auto-generated. Do not edit manually.

### `/config` - Configuration

Cross-platform environment variable handling:

```typescript
import { SAFE_VERSION } from '@safe-global/utils/config/constants'

// Handles both NEXT_PUBLIC_* (web) and EXPO_PUBLIC_* (mobile) prefixes
```

## Import Patterns

Always import from specific paths (no barrel exports):

```typescript
// Hooks
import { useAsync } from '@safe-global/utils/hooks/useAsync'
import { useDebounce } from '@safe-global/utils/hooks/useDebounce'

// Utilities
import { sameAddress, parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { hasFeature } from '@safe-global/utils/utils/chains'

// Services
import { getSafeDeploymentInfo } from '@safe-global/utils/services/contracts'

// Features
import { useMultiChainSafes } from '@safe-global/utils/features/multichain'

// Types
import type { SafeTransaction } from '@safe-global/utils/types/contracts/@safe-global/...'
```

## Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "@safe-global/protocol-kit": "^5.x",
  "@safe-global/types-kit": "^1.x",
  "ethers": "^6.x"
}
```

## Scripts

```bash
# Run tests
yarn workspace @safe-global/utils test

# Run tests with coverage
yarn workspace @safe-global/utils test:coverage

# Type check
yarn workspace @safe-global/utils type-check

# Lint
yarn workspace @safe-global/utils lint

# Format
yarn workspace @safe-global/utils prettier:fix
```

## Contributing

1. **Pure functions preferred** - Keep utilities stateless when possible
2. **Cross-platform aware** - Code must work in both web (Next.js) and mobile (Expo) environments
3. **Type safety** - Never use `any` type
4. **Test coverage** - Add tests for new utilities
5. **Import from specific paths** - Don't create circular dependencies
