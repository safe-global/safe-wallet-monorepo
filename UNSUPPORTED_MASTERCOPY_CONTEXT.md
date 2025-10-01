# Unsupported L2 Mastercopy Migration - Implementation Context

## Problem Statement

Safe accounts with unsupported base contracts (mastercopies) cannot be migrated to L2, even when their bytecode is identical to official L2 singleton deployments. The Client Gateway (CGW) returns `version: null` for these Safes, preventing:
- SDK initialization
- Transaction hash calculation
- Transaction proposal to CGW
- Migration execution

## Solution Overview

We implemented bytecode matching in the frontend to detect when an unsupported mastercopy's bytecode matches a known L2 deployment (1.3.0+L2 or 1.4.1+L2). When a match is found:
1. SDK initializes with custom `contractNetworks` configuration
2. Transaction hashes are calculated using the detected version
3. Migration UI is enabled for these Safes

## What Was Implemented

### 1. Bytecode Comparison Utilities

**File**: `packages/utils/src/services/contracts/deployments.ts`

Added two utility functions:

```typescript
// Check if a bytecode hash matches any L2 deployment
export const isL2MasterCopyCodeHash = (codeHash: string | undefined): boolean

// Get the version string for a matched bytecode hash
export const getL2MasterCopyVersionByCodeHash = (codeHash: string | undefined): string | undefined
```

These use a pre-built Set of code hashes from `_SAFE_L2_DEPLOYMENTS` for efficient lookup.

### 2. SDK Initialization with Bytecode Matching

**File**: `apps/web/src/hooks/coreSDK/safeCoreSDK.ts`

Modified `initSafeSDK()` to:
1. Detect when mastercopy is unsupported (`implementationVersionState === 'UNKNOWN'`)
2. Fetch bytecode from the mastercopy address
3. Calculate keccak256 hash and check against known L2 deployments
4. If match found, initialize SDK with custom `contractNetworks`:
   ```typescript
   contractNetworks = {
     [chainId]: {
       safeSingletonAddress: masterCopy, // Use the unsupported address
     },
   }
   ```
5. Set `safeVersion` to the detected version (e.g., "1.3.0+L2")

### 3. Hash Calculation with SDK Fallback

**File**: `apps/web/src/components/transactions/TxDetails/Summary/SafeTxHashDataRow/index.tsx`

Modified three hooks to use SDK version as fallback when gateway version is null:

```typescript
export function useSafeTxHash({ safeTxData, safeTxHash })
export function useDomainHash()
export function useMessageHash({ safeTxData })
```

Each now does:
```typescript
const safeSDK = useSafeSDK()
const version = safeSDK?.getContractVersion() || safe.version
```

This allows transaction hashes to be displayed even when CGW returns `version: null`.

### 4. Migration Review Component Update

**File**: `apps/web/src/components/tx-flow/flows/MigrateSafeL2/MigrateSafeL2Review.tsx`

Added dependency on SDK initialization:
```typescript
const safeSDK = useSafeSDK()

useEffect(() => {
  if (!chain || !safeSDK) return  // Wait for SDK
  const txData = createMigrateToL2(chain)
  createTx(txData).then(setSafeTx).catch(setSafeTxError)
}, [chain, setSafeTx, setSafeTxError, safeSDK])
```

### 5. UI Components for Bytecode Status

**File**: `apps/web/src/hooks/useBytecodeComparison.ts`

New hook that provides bytecode comparison status for UI components:
```typescript
export const useBytecodeComparison = (): BytecodeComparisonResult | null
```

Used in:
- `UnsupportedMasterCopyWarning` - Shows different message for bytecode-matched contracts
- `UnknownContractError` - Hides error for bytecode-matched contracts
- `useSafeNotifications` - Adjusts notification text

## Current Status

### ✅ What Works

1. **SDK Initialization**: Successfully detects bytecode matches and initializes SDK with custom configuration
2. **Transaction Creation**: Can create migration transactions
3. **Hash Display**: safeTxHash, domainHash, and messageHash display correctly in UI
4. **Migration UI**: "Migrate to L2" option appears for compatible unsupported mastercopies

Tested with: `opbnb:0x69158987610093f2A3156987E412fC0Bf40C6F64`
- SDK version: "1.3.0" ✅
- Transaction created: nonce 5 ✅
- Hashes displayed: Yes ✅

### ❌ What Doesn't Work (Requires CGW Backend Changes)

**Cannot propose or execute transactions**

Error: `POST https://safe-client.safe.global/v1/chains/204/transactions/{address}/propose 422`
Error message: "Could not calculate safeTxHash"

**Root Cause**:
- CGW has `version: null` in its database for unsupported mastercopies
- When frontend proposes a transaction with a safeTxHash, CGW tries to recalculate it to verify
- CGW cannot recalculate because it doesn't have a valid version
- CGW rejects the proposal with 422 error

**Why this blocks everything**:
- The execution flow requires a `txId` from CGW proposal
- Even for immediate execution (threshold=1, no pending txs), the code requires proposal first
- See `apps/web/src/components/tx/SignOrExecuteForm/hooks.ts:141-143`

## Architecture & Code Flow

### SDK Initialization Flow

1. `useInitSafeCoreSDK` effect runs when Safe loads
2. Calls `initSafeSDK()` with Safe info from gateway
3. `initSafeSDK()`:
   - Checks if `implementationVersionState === 'UNKNOWN'`
   - Fetches bytecode from mastercopy address using `provider.getCode()`
   - Calculates `keccak256(code)`
   - Calls `isL2MasterCopyCodeHash(codeHash)`
   - If true, gets version via `getL2MasterCopyVersionByCodeHash(codeHash)`
   - Initializes SDK with custom `contractNetworks` config
4. SDK is stored in external store via `setSafeSDK()`

### Transaction Creation Flow

1. User opens migration modal
2. `MigrateSafeL2Review` waits for `safeSDK` to be available
3. Calls `createMigrateToL2(chain)` to build transaction data
4. Calls `createTx(txData)` which uses `safeSDK.createTransaction()`
5. Transaction is created successfully with nonce, to, data, etc.
6. `setSafeTx(tx)` stores it in context

### Hash Display Flow

1. `Receipt` component renders with `safeTxData`
2. Calls `useSafeTxHash({ safeTxData })`
3. Hook checks:
   - If `safeTxHash` provided, use it
   - Get `version = safeSDK?.getContractVersion() || safe.version`
   - If version exists, call `calculateSafeTransactionHash()`
4. Hash is displayed in "Hashes" tab

### Transaction Proposal Flow (WHERE IT FAILS)

1. User clicks "Execute" button
2. `ExecuteForm` calls `executeTx()` from `useTxActions()`
3. `executeTx()` calls `_propose()` at line 141-143
4. `_propose()` calls `dispatchTxProposal()`
5. `dispatchTxProposal()` (in `dispatch.ts`):
   - Calls `safeSDK.getTransactionHash(safeTx)` ✅ (works, returns hash)
   - Calls `proposeTx(chainId, safeAddress, sender, safeTx, safeTxHash)`
6. `proposeTx()` (in `proposeTransaction.ts`):
   - Calls CGW API: `POST /v1/chains/{chainId}/transactions/{address}/propose`
7. **CGW receives proposal**:
   - Looks up Safe info from its database → finds `version: null`
   - Tries to recalculate safeTxHash to verify it matches what client sent
   - Calls `assertValidSafeVersion(safe.version)` → throws error
   - Returns 422: "Could not calculate safeTxHash"

## What Needs to Happen Next

### CGW Backend Investigation Required

The Client Gateway needs to be updated to handle unsupported mastercopies with bytecode-matched versions. Possible solutions:

#### Option 1: Implement Bytecode Matching in CGW
- Add the same bytecode comparison logic we implemented in frontend
- When Safe has `version: null`, fetch bytecode and check against known deployments
- Store detected version in database or calculate on-demand

#### Option 2: Trust Client safeTxHash
- For known migration contract addresses, skip safeTxHash recalculation
- Trust the hash provided by client
- Only applicable for delegate calls to SafeMigration contract

#### Option 3: Accept Version Parameter
- Allow clients to provide a version parameter when proposing
- Use client-provided version for hash calculation
- Requires API changes and security considerations

#### Option 4: Skip Validation for Migrations
- Detect when transaction is a migration (delegate call to known migration contract)
- Skip version validation for these specific transactions
- Most targeted fix for this use case

### Files to Investigate in CGW

1. Transaction proposal endpoint handler
2. safeTxHash calculation/validation logic
3. Safe version resolution logic
4. Database schema for Safe metadata

### Testing After CGW Fix

Once CGW is updated, test the complete flow:
1. Navigate to unsupported mastercopy Safe
2. Open migration modal
3. Review transaction (should show hashes)
4. Execute transaction
5. Verify it proposes to CGW successfully
6. Verify execution completes
7. Verify Safe is migrated

## Key Technical Decisions

### Why Bytecode Matching?

- More reliable than address matching (same bytecode = same behavior)
- Supports networks where official contracts aren't deployed
- Matches how Ethereum clients verify contract behavior

### Why Use SDK Version as Fallback?

- SDK has correct version from bytecode detection
- Gateway has `null` because it only knows about official deployments
- Fallback pattern maintains backward compatibility

### Why Not Skip CGW Entirely?

- CGW provides transaction coordination and queueing
- Existing architecture requires `txId` for execution
- Significant refactor needed to bypass CGW
- Better to fix CGW than work around it

## Important Constants & Types

### L2 Versions Supported
```typescript
const SUPPORTED_VERSIONS = ['1.3.0+L2', '1.4.1+L2']
```

### Code Hash Source
```typescript
import { _SAFE_L2_DEPLOYMENTS } from '@safe-global/safe-deployments/dist/deployments'
```

### Implementation Version State
```typescript
type ImplementationVersionState = 'UP_TO_DATE' | 'OUTDATED' | 'UNKNOWN'
// 'UNKNOWN' = unsupported mastercopy
```

## Testing Notes

### Test Safe
- **Network**: opBNB (chainId: 204)
- **Address**: `0x69158987610093f2A3156987E412fC0Bf40C6F64`
- **Mastercopy**: `0xE2CF742b554F466d5E7a37C371FD47C786d2FBc0`
- **Detected Version**: 1.3.0+L2
- **Current Nonce**: 5

### Console Filter
Use `[*]` to filter implementation logs (all removed from final PR)

### Expected Behavior
- SDK initializes without errors
- Migration option appears in UI
- Transaction can be created
- Hashes display in review screen
- Proposal to CGW fails with 422

## Related Files Reference

### Core Implementation
- `packages/utils/src/services/contracts/deployments.ts` - Hash checking utilities
- `apps/web/src/hooks/coreSDK/safeCoreSDK.ts` - SDK initialization with bytecode matching
- `apps/web/src/components/transactions/TxDetails/Summary/SafeTxHashDataRow/index.tsx` - Hash calculation

### UI Components
- `apps/web/src/hooks/useBytecodeComparison.ts` - Bytecode status hook
- `apps/web/src/components/tx-flow/flows/MigrateSafeL2/MigrateSafeL2Review.tsx` - Migration review
- `apps/web/src/features/multichain/components/UnsupportedMastercopyWarning/` - Warning component

### Transaction Flow
- `apps/web/src/services/tx/tx-sender/create.ts` - Transaction creation
- `apps/web/src/services/tx/tx-sender/dispatch.ts` - Transaction proposal/execution
- `apps/web/src/services/tx/proposeTransaction.ts` - CGW API call
- `apps/web/src/components/tx/SignOrExecuteForm/hooks.ts` - Execute button logic

### Tests
- `packages/utils/src/services/contracts/__tests__/bytecodeComparison.test.ts`
- `packages/utils/src/services/contracts/__tests__/safeContracts.test.ts`

## Pull Request

**PR #6399**: https://github.com/safe-global/safe-wallet-monorepo/pull/6399

Branch: `feature/unsupported-l2-mastercopy-migration`
Base: `dev`

## Next Steps for New Context

1. **Investigate CGW backend** to understand where version validation happens
2. **Identify best solution** from the 4 options above
3. **Implement CGW changes** to support unsupported mastercopies with bytecode matching
4. **Test end-to-end** migration flow after CGW update
5. **Update frontend** if any API changes needed
