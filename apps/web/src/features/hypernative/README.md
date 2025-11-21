# Hypernative Guard Detection

This feature provides functionality to detect if a Safe has a HypernativeGuard installed by checking if the guard contract's bytecode contains all expected function selectors extracted from the HypernativeGuard ABI.

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
  const chainId = '1'
  const guardAddress = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'

  const result = await isHypernativeGuard(chainId, guardAddress, provider)
  console.log('Is HypernativeGuard:', result)
}
```

## Updating the ABI

When a new version of HypernativeGuard is deployed with different function signatures:

1. Obtain the new ABI JSON file for the updated contract version
2. Replace `services/HypernativeGuard.abi.json` with the new ABI
3. The function selectors will be automatically extracted on the next build/deployment

**Important Notes:**

- The ABI file must match the deployed contract version
- If the ABI doesn't match the deployed contract, detection may fail or produce false negatives
- The ABI is loaded at module initialization, so changes require a rebuild/redeploy
- If a new version removes functions that exist in the old ABI, the code will fail at runtime (see security considerations below)

## How It Works

1. The hook (`useIsHypernativeGuard`) checks if the current Safe (from `useSafeInfo`) has a guard set
2. If a guard exists, it fetches the contract bytecode using `web3ReadOnly.getCode()`
3. Function selectors are extracted from the HypernativeGuard ABI at module initialization
4. The bytecode is checked to see if it contains all expected function selectors
5. Returns `true` if all selectors are found in the bytecode, `false` otherwise

**Detection Method:**

- Uses function selector (4-byte signature) presence checking
- Similar to how ERC20 approvals are detected using `APPROVAL_SIGNATURE_HASH`
- Only requires one RPC call (`getCode`) per check
- Selectors are searched anywhere in the bytecode using `includes()`

**Feature Flag:**

- `FEATURES.HYPERNATIVE_RELAX_GUARD_CHECK`: When enabled, skips ABI verification and accepts any guard contract (useful as a fallback if ABI-based detection encounters issues)

## Examples

### Badge Component

```typescript
import { useIsHypernativeGuard } from '@/features/hypernative/hooks'
import { Box, Chip, CircularProgress } from '@mui/material'

export const HypernativeGuardBadge = () => {
  const { isHypernativeGuard, loading } = useIsHypernativeGuard()

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <span>Checking guard...</span>
      </Box>
    )
  }

  if (!isHypernativeGuard) {
    return null
  }

  return <Chip label="Protected by Hypernative" color="success" size="small" />
}
```

### Conditional Rendering

```typescript
export const ConditionalHypernativeFeature = () => {
  const { isHypernativeGuard, loading } = useIsHypernativeGuard()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {isHypernativeGuard ? (
        <div>
          <h3>Hypernative Guard Settings</h3>
          <p>Configure your Hypernative security policies here.</p>
        </div>
      ) : (
        <div>
          <h3>Enhance Your Security</h3>
          <p>Install Hypernative Guard to add advanced transaction monitoring.</p>
          <button>Install Hypernative Guard</button>
        </div>
      )}
    </div>
  )
}
```

## Architecture

```
hooks/
  useIsHypernativeGuard.ts  - React hook wrapper
  __tests__/
    useIsHypernativeGuard.test.ts

services/
  hypernativeGuardCheck.ts  - Core logic for checking guard
  HypernativeGuard.abi.json - ABI file containing function signatures
  __tests__/
    hypernativeGuardCheck.test.ts
```

## Testing

Run the tests:

```bash
npm test -- --testPathPattern="hypernativeGuardCheck|useIsHypernativeGuard"
```

All 17 tests should pass.

## Notes

- Detection is based on function selector presence in bytecode, not exact bytecode matching
- This approach is more flexible than code hash comparison and works with any version that implements the same interface
- The ABI file must be kept in sync with the deployed contract version
- Empty guard (no guard set) returns `false` immediately without any blockchain calls
- Results are memoized per `chainId:guardAddress` to avoid redundant RPC calls
- Errors are logged using `logError(Errors._809, error)` for monitoring
- Failed lookups are not cached, allowing automatic retry on transient errors

## Security Considerations

**ABI Version Mismatch:**

- If the ABI file describes a different version than the deployed contract, detection may fail
- If the ABI contains function names that don't exist in the deployed contract, the code will crash at runtime
- Always ensure the ABI file matches the contract version being checked

**False Positives:**

- The `includes()` check may match selectors that appear in data/constants, not just as function selectors
- This is mitigated by checking for multiple selectors (all functions in the ABI)
- The approach is similar to ERC20 approval detection patterns used elsewhere in the codebase
