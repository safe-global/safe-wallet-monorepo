# Data Model: Counterfactual Feature

**Feature**: 002-counterfactual-refactor  
**Phase**: 1 (Design & Contracts)  
**Date**: 2026-01-15

## Purpose

Document the existing Redux state structure for the counterfactual feature to ensure the refactoring does NOT modify any state shapes, selectors, or action signatures. This is a reference document that validates zero behavioral changes during migration.

## Redux Store Structure

### State Shape

The counterfactual feature manages state through the `undeployedSafesSlice` in Redux.

**Slice Name**: `undeployedSafes`

**State Type**: `UndeployedSafesState`

```typescript
interface UndeployedSafesState {
  [chainId: string]: {
    [address: string]: UndeployedSafe
  }
}
```

**Structure**:

- Top-level keys: `chainId` (string) - groups Safes by blockchain
- Second-level keys: `address` (string) - Safe address (checksummed)
- Values: `UndeployedSafe` objects containing prediction props and status

### Core Types

```typescript
interface UndeployedSafe {
  props: PredictedSafeProps | ReplayedSafeProps
  status: UndeployedSafeStatus
}

interface UndeployedSafeStatus {
  status: PendingSafeStatus // Enum: AWAITING_EXECUTION, PROCESSING, etc.
  type: PayMethod // 'payNow' | 'payLater'
  txHash?: string // Transaction hash (when processing/success)
  submittedAt?: number // Timestamp when submitted
  startBlock?: number // Block number when tx submitted
  taskId?: string // Relay task ID (for relayed transactions)
}

// From @safe-global/utils
enum PendingSafeStatus {
  AWAITING_EXECUTION = 'AWAITING_EXECUTION',
  PROCESSING = 'PROCESSING',
  RELAYING = 'RELAYING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  REVERTED = 'REVERTED',
}

type PayMethod = 'payNow' | 'payLater'

// Safe prediction props (from @safe-global/protocol-kit)
interface PredictedSafeProps {
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig?: SafeDeploymentConfig
}

interface ReplayedSafeProps {
  safeAccountConfig: SafeAccountConfig
  masterCopy: string
  factoryAddress: string
  saltNonce: string
  safeVersion?: SafeVersion
}

interface SafeAccountConfig {
  owners: string[]
  threshold: number
  to?: string
  data?: string
  fallbackHandler?: string
  paymentToken?: string
  payment?: string
  paymentReceiver?: string
}
```

### Actions

The slice defines three actions:

```typescript
// Add new undeployed Safe
addUndeployedSafe(state, action: PayloadAction<{
  chainId: string
  address: string
  type: PayMethod
  safeProps: PredictedSafeProps | ReplayedSafeProps
}>)

// Update status of existing undeployed Safe
updateUndeployedSafeStatus(state, action: PayloadAction<{
  chainId: string
  address: string
  status: Omit<UndeployedSafeStatus, 'type'>  // Can't change payment type
}>)

// Remove deployed/cancelled Safe
removeUndeployedSafe(state, action: PayloadAction<{
  chainId: string
  address: string
}>)

// Bulk add (used during hydration from storage)
addUndeployedSafes(_, action: PayloadAction<UndeployedSafesState>)
```

**Action Behaviors**:

- `addUndeployedSafe`: Creates entry with `AWAITING_EXECUTION` status
- `updateUndeployedSafeStatus`: Merges status updates, preserves `type` field
- `removeUndeployedSafe`: Deletes Safe entry, cleans up empty chain entries
- `addUndeployedSafes`: Replaces entire state (hydration use case)

### Selectors

```typescript
// Base selector: entire undeployed Safes state
selectUndeployedSafes(state: RootState): UndeployedSafesState

// Select single Safe by current chain + address
selectUndeployedSafe(state: RootState): UndeployedSafe | undefined
// Uses selectChainIdAndSafeAddress from store/common
// Returns undefined if not found

// Select all Safes across chains for given address
selectUndeployedSafesByAddress(state: RootState): UndeployedSafe[]
// Uses selectSafeAddress from store/common
// Returns empty array if none found

// Check if current Safe is undeployed
selectIsUndeployedSafe(state: RootState): boolean
// Derived from selectUndeployedSafe
// Returns false if Safe is deployed or doesn't exist
```

**Selector Dependencies**:

- All selectors use `createSelector` from Redux Toolkit for memoization
- Depend on common selectors: `selectChainIdAndSafeAddress`, `selectSafeAddress`
- Selectors MUST remain unchanged during refactoring

## State Lifecycle

### Safe Creation → Deployment Flow

```
1. User creates Safe prediction
   ↓
   addUndeployedSafe({ chainId, address, type: 'payLater', props: PredictedSafeProps })
   ↓
   State: { [chainId]: { [address]: { props, status: { status: AWAITING_EXECUTION, type: 'payLater' } } } }

2a. Pay Later: User submits first transaction
   ↓
   Transaction batched with Safe deployment
   ↓
   updateUndeployedSafeStatus({ chainId, address, status: { status: PROCESSING, txHash: '0x...' } })
   ↓
   State: status.status = PROCESSING, status.txHash = '0x...'

2b. Pay Now: User explicitly activates Safe
   ↓
   Deployment transaction submitted
   ↓
   updateUndeployedSafeStatus({ chainId, address, status: { status: PROCESSING, txHash: '0x...' } })
   ↓
   State: status.status = PROCESSING, status.txHash = '0x...'

3. Transaction mined successfully
   ↓
   safeCreationEvents dispatch SUCCESS event
   ↓
   updateUndeployedSafeStatus({ chainId, address, status: { status: SUCCESS } })
   ↓
   State: status.status = SUCCESS

4. Safe Info loaded from chain
   ↓
   useLoadSafeInfo detects Safe is now deployed
   ↓
   removeUndeployedSafe({ chainId, address })
   ↓
   State: Entry removed, Safe is now fully deployed
```

### Error States

```
Transaction reverted:
  updateUndeployedSafeStatus({ chainId, address, status: { status: REVERTED } })

Transaction failed (other):
  updateUndeployedSafeStatus({ chainId, address, status: { status: ERROR } })

Relay-specific:
  updateUndeployedSafeStatus({ chainId, address, status: { status: RELAYING, taskId: '...' } })
```

## Refactoring Validation

### What MUST NOT Change

✅ **State Shape**: `UndeployedSafesState` structure (chainId → address → UndeployedSafe)  
✅ **Action Signatures**: All four actions must have identical signatures  
✅ **Action Behaviors**: Logic inside reducers must be identical  
✅ **Selector Signatures**: All selectors must have identical input/output types  
✅ **Selector Logic**: Memoization and derivation logic must be identical  
✅ **Type Definitions**: All interfaces must be identical (can move to `types.ts` but shapes unchanged)

### What CAN Change

✅ **File Location**: `store/undeployedSafesSlice.ts` stays in place, gets barrel export via `store/index.ts`  
✅ **Import Paths**: Internal imports can change (e.g., types imported from `../types.ts`)  
✅ **Export Method**: Slice exports can go through barrel file (`store/index.ts`)  
✅ **Documentation**: Can add comments, JSDoc, or type annotations for clarity

### Verification Tests

**Before Refactoring** (baseline):

```bash
yarn workspace @safe-global/web test store/undeployedSafesSlice
```

**After Refactoring** (must be identical):

```bash
yarn workspace @safe-global/web test store/undeployedSafesSlice
```

All tests MUST pass with zero modifications (except import path updates in test files).

### Integration Points

The Redux store is exported and used by:

| Consumer           | Usage                          | Import Path (after refactor) |
| ------------------ | ------------------------------ | ---------------------------- |
| `store/slices.ts`  | Export slice to root store     | `@/features/counterfactual`  |
| Transaction flows  | Dispatch actions, read status  | `@/features/counterfactual`  |
| Safe creation      | Add new Safes, update status   | `@/features/counterfactual`  |
| Loadables          | Check if Safe is undeployed    | `@/features/counterfactual`  |
| Feature components | Select Safes, dispatch actions | `@/features/counterfactual`  |

All consumers MUST import from `@/features/counterfactual` after refactoring (public API).

## Storage Persistence

### Local Storage Integration

Undeployed Safes are persisted to localStorage for recovery after page refresh.

**Storage Key**: Part of Redux persist configuration (handled by `store/` infrastructure)

**Hydration**:

- On app load, persisted state is restored
- Uses `addUndeployedSafes` action to bulk-load state
- Triggers status checks for any `PROCESSING` Safes

**Refactoring Impact**: None - persistence handled at store level, slice structure unchanged.

## Summary

**State Structure**: Two-level map (chainId → address → UndeployedSafe) managing counterfactual Safe predictions and deployment status.

**Critical Invariant**: Zero changes to state shape, action signatures, selector logic, or behaviors. Refactoring only affects file organization and import paths.

**Verification**: All existing tests must pass without modification. Type-check confirms no breaking changes to consumers.

**Integration**: Public API exports all slice exports (actions, selectors, slice itself) for external consumption.
