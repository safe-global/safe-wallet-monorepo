# Recovery Feature Migration Status

## Completed ✅

1. **Created core architecture files:**
   - `index.ts` - Public API with feature handle and minimal hook exports
   - `contract.ts` - Minimal contract with only actually-used components/services  
   - `feature.ts` - Lazy-loaded implementation with flat structure

2. **Minimized exported hooks** (5 instead of 15):
   - `useIsRecoverer`
   - `useIsRecoverySupported`
   - `useIsValidRecoveryExecTransactionFromModule`
   - `useRecovery`
   - `useRecoveryQueue`

3. **Simplified contract** to include only what consumers actually use:
   - 6 components (Recovery, RecoveryList, RecoveryInfo, RecoveryStatus, RecoveryValidationErrors, RecoveryDescription)
   - 7 services (selectors, transaction helpers, recovery senders, setup)

## Remaining Work ⚠️

### 1. Convert Internal Component Exports (Critical)

Many internal components within the recovery feature still use named exports but need default exports. Files that need conversion:

```bash
# These components need to export default instead of named exports:
- components/RecoveryInfo/index.tsx
- components/RecoveryStatus/index.tsx
- components/RecoveryType/index.tsx
- components/RecoveryValidationErrors/index.tsx
- components/RecoveryDescription/index.tsx
- components/RecoveryListItem/index.tsx
- components/RecoverySigners/index.tsx
- components/RecoveryDetails/index.tsx
- components/GroupedRecoveryListItems/index.tsx
- components/RecoverySummary/index.tsx
- components/ExecuteRecoveryButton/index.tsx
- components/CancelRecoveryButton/index.tsx
```

**How to fix:**  
For each file, change from:
```typescript
export const RecoveryInfo = () => { ... }
```

To:
```typescript
const RecoveryInfo = () => { ... }
export default RecoveryInfo
```

### 2. Fix RecoveryHeader Component

`components/RecoveryHeader/index.tsx` has multiple default exports error (lines 14 and 72). This file likely exports both `RecoveryHeader` and `InternalRecoveryHeader` - needs restructuring.

### 3. Fix RecoveryModal Component

Similar issue with `InternalRecoveryModal` in test file.

### 4. Update Consumer Files

23 consumer files were identified but the codemod failed to transform them. These need manual updates:

**Pattern to follow:**
```typescript
// Before
import { RecoveryInfo } from '@/features/recovery/components/RecoveryInfo'

// After  
import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'

const recovery = useLoadFeature(RecoveryFeature)
return <recovery.RecoveryInfo />
```

**For hooks - import directly:**
```typescript
import { useRecoveryQueue } from '@/features/recovery'
```

**Consumer files to update:**
- `src/components/dashboard/PendingTxs/PendingRecoveryListItem.tsx`
- `src/components/dashboard/PendingTxs/PendingTxsList.tsx`
- `src/components/dashboard/index.tsx`
- `src/components/settings/SafeModules/index.tsx`
- `src/components/settings/SecurityLogin/index.tsx`
- `src/components/tx-flow/flows/CancelRecovery/*`
- `src/components/tx-flow/flows/RecoverAccount/*`
- `src/components/tx-flow/flows/RecoveryAttempt/*`
- `src/components/tx-flow/flows/RemoveRecovery/*`
- `src/components/tx-flow/flows/UpsertRecovery/*`
- `src/features/counterfactual/components/FirstTxFlow/index.tsx`
- `src/pages/_app.tsx`
- `src/pages/transactions/queue.tsx`
- `src/permissions/hooks/useRoles.ts`
- `src/utils/transaction-guards.ts`
- `src/utils/tx-list.ts`

### 5. Update Tests

All test files that mock the recovery feature need updating:

```typescript
jest.mock('@/features/recovery', () => ({
  RecoveryFeature: {
    name: 'recovery',
    useIsEnabled: () => true,
    load: () => Promise.resolve({
      default: {
        // Flat structure - components and services only (NO hooks)
        Recovery: () => <div>Mock</div>,
        RecoveryInfo: () => <div>Mock</div>,
        selectDelayModifierByRecoverer: jest.fn(),
        // ... other services
      },
    }),
  },
  // Hooks exported directly (not lazy-loaded)
  useRecovery: jest.fn(),
  useRecoveryQueue: jest.fn(),
  // ... other hooks
}))
```

## Next Steps

1. **Fix internal component exports** (see list above) - convert to default exports
2. **Fix RecoveryHeader** - resolve multiple default exports
3. **Update consumer files** - use `useLoadFeature()` pattern for components/services, direct imports for hooks
4. **Update tests** - mock the feature handle correctly
5. **Run validation:**
   ```bash
   yarn workspace @safe-global/web type-check
   yarn workspace @safe-global/web lint
   yarn workspace @safe-global/web test
   ```

## Current Type Errors

22 recovery-related type errors remaining, mostly:
- Components using named imports instead of default imports (internal to feature)
- Multiple default exports in RecoveryHeader
- Consumer files trying to import internal component paths directly

## Architecture Notes

The migration follows the v3 feature architecture pattern:

- **Hooks are NOT lazy-loaded** - exported directly from `index.ts` to avoid Rules of Hooks violations
- **Components/services ARE lazy-loaded** - accessed via `useLoadFeature(RecoveryFeature)`
- **Flat structure** - no nested `components`/`services` in the contract
- **Proxy stubs** - components render null when not ready, services are undefined (check `$isReady`)
- **Minimal exports** - only 5 hooks (down from 15) based on actual consumer usage

## References

- Feature Architecture Guide: `apps/web/docs/feature-architecture.md`
- Migration Guide: `tools/codemods/migrate-feature/README.md`
- Example Features: `bridge`, `multichain`, `walletconnect`
