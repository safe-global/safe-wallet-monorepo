# Hypernative Guard Detection

This feature provides functionality to detect if a Safe has a HypernativeGuard installed by comparing the guard contract's bytecode hash against known HypernativeGuard deployments.

## Usage

### Hook

```typescript
import { useIsHypernativeGuard } from '@/features/hypernative/hooks'

function MyComponent() {
  const { isHypernativeGuard, loading } = useIsHypernativeGuard()

  if (loading) {
    return <div>Checking guard...</div>
  }

  if (isHypernativeGuard) {
    return <div>This Safe is protected by HypernativeGuard</div>
  }

  return <div>No HypernativeGuard detected</div>
}
```

### Service

```typescript
import { isHypernativeGuard } from '@/features/hypernative/services/hypernativeGuardCheck'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'

async function checkGuard() {
  const provider = useWeb3ReadOnly()
  const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
  const chainId = '11155111' // Sepolia

  const result = await isHypernativeGuard(guardAddress, provider, chainId)
  console.log('Is HypernativeGuard:', result)
}
```

## Adding New Deployments

When HypernativeGuard is deployed to a new network or a new version is released:

1. Update the RPC URL in `scripts/fetchGuardCodeHash.ts`
2. Run the script to get the code hash:
   ```bash
   npx ts-node src/features/hypernative/scripts/fetchGuardCodeHash.ts
   ```
3. Add the returned hash to `HYPERNATIVE_GUARD_CODE_HASHES` in `services/hypernativeGuardCheck.ts`:
   ```typescript
   export const HYPERNATIVE_GUARD_CODE_HASHES: Record<string, string[]> = {
     '11155111': ['0xabcd1234...'], // Sepolia
     '1': ['0xef567890...'],         // Mainnet
   }
   ```

## How It Works

1. The hook (`useIsHypernativeGuard`) checks if the current Safe (from `useSafeInfo`) has a guard set
2. If a guard exists, it fetches the contract bytecode using `web3ReadOnly.getCode()`
3. The bytecode is hashed using `keccak256`
4. The hash is compared against known HypernativeGuard code hashes for the current chain
5. Returns `true` if there's a match, `false` otherwise

## Architecture

```
hooks/
  useIsHypernativeGuard.ts  - React hook wrapper
  __tests__/
    useIsHypernativeGuard.test.ts

services/
  hypernativeGuardCheck.ts  - Core logic for checking guard
  __tests__/
    hypernativeGuardCheck.test.ts

scripts/
  fetchGuardCodeHash.ts     - Utility to fetch code hashes
```

## Testing

Run the tests:
```bash
npm test -- --testPathPattern="hypernativeGuardCheck|useIsHypernativeGuard"
```

## Notes

- The bytecode comparison is done at the bytecode level, not the source code level
- Different compiler versions or settings may produce different bytecode, requiring multiple hashes per version
- Empty guard (no guard set) returns `false` immediately without any blockchain calls
- Chains without known HypernativeGuard deployments return `false` without fetching bytecode
