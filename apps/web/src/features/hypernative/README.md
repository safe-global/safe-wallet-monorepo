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

  const result = await isHypernativeGuard(guardAddress, provider)
  console.log('Is HypernativeGuard:', result)
}
```

## Adding New Code Hashes

HypernativeGuard uses the same bytecode across all chains. When a new version is deployed:

1. Fetch the bytecode from any deployment (e.g., Sepolia at `0x4784e9bF408F649D04A0a3294e87B0c74C5A3020`)
2. Hash it using `keccak256`
3. Add the hash to `HYPERNATIVE_GUARD_CODE_HASHES` in `services/hypernativeGuardCheck.ts`:
   ```typescript
   export const HYPERNATIVE_GUARD_CODE_HASHES: string[] = [
     '0xabcd1234...', // Version 1.0.0
     '0xef567890...', // Version 2.0.0
   ]
   ```

## How It Works

1. The hook (`useIsHypernativeGuard`) checks if the current Safe (from `useSafeInfo`) has a guard set
2. If a guard exists, it fetches the contract bytecode using `web3ReadOnly.getCode()`
3. The bytecode is hashed using `keccak256`
4. The hash is compared against known HypernativeGuard code hashes
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

examples/
  HypernativeGuardBadge.tsx - Example components showing usage
```

## Testing

Run the tests:
```bash
npm test -- --testPathPattern="hypernativeGuardCheck|useIsHypernativeGuard"
```

All 17 tests should pass.

## Notes

- The bytecode comparison is done at the bytecode level, not the source code level
- HypernativeGuard uses the same bytecode across all chains (deterministic deployment)
- Different compiler versions or settings may produce different bytecode, requiring multiple hashes
- Empty guard (no guard set) returns `false` immediately without any blockchain calls
- No known hashes configured returns `false` without fetching bytecode
- Errors are logged using `logError(Errors._809, error)` for monitoring
