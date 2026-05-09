# Quickstart: Counterfactual Feature Refactor

**Feature**: 002-counterfactual-refactor  
**Purpose**: Step-by-step guide for executing the refactoring  
**Estimated Time**: 5-6 hours  
**Difficulty**: Medium (systematic file reorganization + import updates)

## Prerequisites

Before starting:

- ✅ Clean working directory (commit or stash all changes)
- ✅ On branch `002-counterfactual-refactor`
- ✅ All tests passing: `yarn workspace @safe-global/web test`
- ✅ Familiarize with walletconnect reference: `apps/web/src/features/walletconnect/`
- ✅ Read `research.md` and `data-model.md` for context

## Overview

This refactoring involves 6 phases executed sequentially. Phases 2-4 should be done in a single focused session to minimize broken state duration.

**Total File Operations**: 27 (10 moves, 5 keeps, 1 rename, 1 create, 2 test relocations, 8 new barrels)  
**External Import Updates**: 49 files across codebase  
**Critical Path**: Redux store export → transaction flows → Safe creation → remaining files

## Phase 1: Create Structure (Non-Breaking)

**Objective**: Create all barrel files and new files without moving anything yet.

**Time**: ~15 minutes

### Step 1.1: Create Root Files

```bash
cd apps/web/src/features/counterfactual/

# Create root barrel files
touch index.ts types.ts constants.ts
```

### Step 1.2: Create Subdirectory Barrels

```bash
# Components barrel
mkdir -p components
touch components/index.ts

# Hooks barrel (directory already exists)
touch hooks/index.ts

# Services barrel (directory already exists)
touch services/index.ts

# Store barrel (directory already exists)
touch store/index.ts
```

### Step 1.3: Verify Structure

```bash
# Check structure matches standard
ls -la
# Should see: index.ts, types.ts, constants.ts
# Should see directories: components/, hooks/, services/, store/

# Verify type-check still passes (empty files don't break anything)
yarn workspace @safe-global/web type-check
```

**Checkpoint**: Type-check passes, new files exist, nothing broken yet.

---

## Phase 2: File Reorganization (Breaking)

**Objective**: Move all files to correct locations and update internal imports.

**Time**: ~1 hour

**WARNING**: This phase breaks the build. Work quickly and methodically.

### Step 2.1: Move Component Files

```bash
cd apps/web/src/features/counterfactual/

# Create component subdirectories and move files
mkdir -p components/ActivateAccountButton && mv ActivateAccountButton.tsx components/ActivateAccountButton/index.tsx
mkdir -p components/ActivateAccountFlow && mv ActivateAccountFlow.tsx components/ActivateAccountFlow/index.tsx
mkdir -p components/CheckBalance && mv CheckBalance.tsx components/CheckBalance/index.tsx
mkdir -p components/CounterfactualForm && mv CounterfactualForm.tsx components/CounterfactualForm/index.tsx
mkdir -p components/CounterfactualHooks && mv CounterfactualHooks.tsx components/CounterfactualHooks/index.tsx
mkdir -p components/CounterfactualStatusButton && mv CounterfactualStatusButton.tsx components/CounterfactualStatusButton/index.tsx
mkdir -p components/CounterfactualSuccessScreen && mv CounterfactualSuccessScreen.tsx components/CounterfactualSuccessScreen/index.tsx
mkdir -p components/FirstTxFlow && mv FirstTxFlow.tsx components/FirstTxFlow/index.tsx
mkdir -p components/LazyCounterfactual && mv LazyCounterfactual.tsx components/LazyCounterfactual/index.tsx
mkdir -p components/PayNowPayLater && mv PayNowPayLater.tsx components/PayNowPayLater/index.tsx
```

### Step 2.2: Move Hook File

```bash
# Move hook from root to hooks/
mv useCounterfactualBalances.ts hooks/
```

### Step 2.3: Move and Rename Service File

```bash
# Rename utils.ts for clarity and move to services/
mv utils.ts services/counterfactualUtils.ts
```

### Step 2.4: Move Test Files

```bash
# Move tests to colocated __tests__/ directories
mkdir -p hooks/__tests__
mv __tests__/useDeployGasLimit.test.ts hooks/__tests__/

mkdir -p services/__tests__
mv __tests__/utils.test.ts services/__tests__/counterfactualUtils.test.ts

# Remove empty __tests__/ directory
rmdir __tests__
```

### Step 2.5: Handle Styles

```bash
# Check if styles.module.css is used
# If used by specific components, move to their directories
# If shared, keep at root or move to appropriate component
# For now, keep at root (determine usage during import updates)
```

### Step 2.6: Update Internal Imports

**Strategy**: Update imports within counterfactual feature files to reflect new paths.

**Common Import Updates**:

| Old Import                            | New Import                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `from './utils'`                      | `from '../services/counterfactualUtils'` (adjust `../` based on file location) |
| `from './useCounterfactualBalances'`  | `from '../hooks/useCounterfactualBalances'`                                    |
| `from './store/undeployedSafesSlice'` | `from '../store/undeployedSafesSlice'`                                         |

**Files to Update** (within counterfactual feature):

- All component files: update imports to services, hooks, store
- Hook files: update imports to services, store
- Service files: update imports to each other
- Test files: update imports to match new source locations

**Tool**: Use find-and-replace carefully, or update manually file-by-file.

```bash
# Run type-check to find broken imports
yarn workspace @safe-global/web type-check | grep counterfactual
# Fix imports until no counterfactual-related errors
```

**Checkpoint**: Type-check shows only external import errors (not internal counterfactual errors).

---

## Phase 3: Establish Public API (Breaking Externally)

**Objective**: Create types.ts, constants.ts, feature flag hook, and populate barrel files.

**Time**: ~1 hour

### Step 3.1: Extract Types to `types.ts`

Open `types.ts` and add all counterfactual-specific interfaces:

```typescript
// types.ts
import type { PredictedSafeProps } from '@safe-global/protocol-kit'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'

// Re-export commonly used types
export type { PredictedSafeProps, PayMethod }
export { PendingSafeStatus }

// Counterfactual-specific types
export interface UndeployedSafesState {
  [chainId: string]: {
    [address: string]: UndeployedSafe
  }
}

export interface UndeployedSafe {
  props: UndeployedSafeProps
  status: UndeployedSafeStatus
}

export interface UndeployedSafeStatus {
  status: PendingSafeStatus
  type: PayMethod
  txHash?: string
  submittedAt?: number
  startBlock?: number
  taskId?: string
}

export type UndeployedSafeProps = PredictedSafeProps | ReplayedSafeProps

export interface ReplayedSafeProps {
  safeAccountConfig: {
    owners: string[]
    threshold: number
    to?: string
    data?: string
    fallbackHandler?: string
    paymentToken?: string
    payment?: string
    paymentReceiver?: string
  }
  masterCopy: string
  factoryAddress: string
  saltNonce: string
  safeVersion?: string
}
```

**Note**: Extract types from `store/undeployedSafesSlice.ts` and `services/counterfactualUtils.ts`. Update those files to import from `../types`.

### Step 3.2: Extract Constants to `constants.ts`

```typescript
// constants.ts
export const CF_TX_GROUP_KEY = 'cf-tx'
```

Update `services/counterfactualUtils.ts` to import from `../constants`.

### Step 3.3: Create Feature Flag Hook

Create `hooks/useIsCounterfactualEnabled.ts`:

```typescript
// hooks/useIsCounterfactualEnabled.ts
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsCounterfactualEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.COUNTERFACTUAL)
}
```

### Step 3.4: Populate Barrel Files

**`components/index.ts`**:

```typescript
// NOTE: Components are INTERNAL - not exported from feature root
// This barrel is for internal feature use only
export { ActivateAccountButton } from './ActivateAccountButton'
export { ActivateAccountFlow } from './ActivateAccountFlow'
export { CheckBalance } from './CheckBalance'
export { CounterfactualForm } from './CounterfactualForm'
export { CounterfactualHooks } from './CounterfactualHooks'
export { CounterfactualStatusButton } from './CounterfactualStatusButton'
export { CounterfactualSuccessScreen } from './CounterfactualSuccessScreen'
export { FirstTxFlow } from './FirstTxFlow'
export { LazyCounterfactual } from './LazyCounterfactual'
export { PayNowPayLater } from './PayNowPayLater'
```

**`hooks/index.ts`**:

```typescript
export { useIsCounterfactualEnabled } from './useIsCounterfactualEnabled'
// Internal hooks NOT exported (used only within feature)
```

**`services/index.ts`**:

```typescript
export * from './counterfactualUtils'
export * from './safeCreationEvents'
```

**`store/index.ts`**:

```typescript
export * from './undeployedSafesSlice'
```

### Step 3.5: Populate Root `index.ts` (Public API)

See `contracts/public-api.ts` for full contract. Summary:

```typescript
// index.ts (feature root - PUBLIC API)
import dynamic from 'next/dynamic'

// Types (tree-shakeable)
export type {
  UndeployedSafe,
  UndeployedSafesState,
  UndeployedSafeStatus,
  UndeployedSafeProps,
  ReplayedSafeProps,
} from './types'

// Feature flag hook (REQUIRED)
export { useIsCounterfactualEnabled } from './hooks'

// Store exports
export {
  undeployedSafesSlice,
  addUndeployedSafe,
  addUndeployedSafes,
  updateUndeployedSafeStatus,
  removeUndeployedSafe,
  selectUndeployedSafes,
  selectUndeployedSafe,
  selectUndeployedSafesByAddress,
  selectIsUndeployedSafe,
} from './store'

// Service functions
export {
  getUndeployedSafeInfo,
  deploySafeAndExecuteTx,
  dispatchTxExecutionAndDeploySafe,
  getCounterfactualBalance,
  replayCounterfactualSafeDeployment,
  checkSafeActivation,
  checkSafeActionViaRelay,
  extractCounterfactualSafeSetup,
  activateReplayedSafe,
  isReplayedSafeProps,
  isPredictedSafeProps,
} from './services'

// Constants
export { CF_TX_GROUP_KEY } from './constants'

// No default export - feature has no single main component
```

**Checkpoint**: All barrel files populated, public API defined. Type-check will show many external errors (expected - imports not updated yet).

---

## Phase 4: Update External Imports (Critical Path)

**Objective**: Update all 49 external files to import from `@/features/counterfactual` only.

**Time**: ~2-3 hours

**Strategy**: Update in priority order, run type-check after each priority group.

### Step 4.1: Priority 1 - Redux Store (CRITICAL)

**File**: `apps/web/src/store/slices.ts`

**Before**:

```typescript
export * from '@/features/counterfactual/store/undeployedSafesSlice'
```

**After**:

```typescript
export * from '@/features/counterfactual'
```

**Verify**: `yarn workspace @safe-global/web type-check` - store imports should resolve.

### Step 4.2: Priority 2 - Transaction Flows (8 files)

Update all files in `components/tx-flow/`:

| File                                   | Before                            | After                       |
| -------------------------------------- | --------------------------------- | --------------------------- |
| `actions/Counterfactual.tsx`           | Deep imports to utils, components | `@/features/counterfactual` |
| `actions/Execute/index.tsx`            | Deep imports to hooks             | `@/features/counterfactual` |
| `actions/Sign/index.tsx`               | Deep imports to hooks             | `@/features/counterfactual` |
| `actions/ExecuteThroughRole/index.tsx` | Deep imports to hooks             | `@/features/counterfactual` |
| `actions/Batching/index.tsx`           | Deep imports to hooks             | `@/features/counterfactual` |
| `features/BalanceChanges.tsx`          | Deep imports to hooks             | `@/features/counterfactual` |
| `features/ExecuteCheckbox.tsx`         | Deep imports to hooks             | `@/features/counterfactual` |
| `TxFlowProvider.tsx`                   | Deep imports to hooks             | `@/features/counterfactual` |

**Pattern**:

- Replace all `@/features/counterfactual/...` imports with `@/features/counterfactual`
- Import only what's needed from public API
- Run type-check to verify

### Step 4.3: Priority 3 - Safe Creation (5 files)

Update all files in `components/new-safe/create/`:

| File                                    | Imports to Update                     |
| --------------------------------------- | ------------------------------------- |
| `steps/StatusStep/index.tsx`            | Components, hooks, utils → public API |
| `steps/ReviewStep/index.tsx`            | Components, hooks, utils → public API |
| `steps/StatusStep/StatusMessage.tsx`    | Hooks → public API                    |
| `steps/StatusStep/useUndeployedSafe.ts` | Store → public API                    |
| `logic/index.ts`                        | Utils → public API                    |

### Step 4.4: Priority 4 - Remaining Files (36 files)

**Batch Update Strategy**: Group by directory, update all at once, verify.

**Directories**:

- `features/myAccounts/` (3 files)
- `features/multichain/` (3 files)
- `hooks/loadables/` (4 files)
- `hooks/coreSDK/` (2 files)
- `components/sidebar/` (2 files)
- `components/settings/` (3 files)
- `components/dashboard/` (1 file)
- `components/balances/` (1 file)
- `pages/_app.tsx` (1 file)

**Pattern for Each File**:

1. Find all imports from `@/features/counterfactual/...`
2. Replace with `@/features/counterfactual`
3. Ensure imported names match public API exports
4. Update type imports to use `export type {}`

**Example**:

**Before**:

```typescript
import { selectIsUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getUndeployedSafeInfo } from '@/features/counterfactual/utils'
import type { UndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
```

**After**:

```typescript
import { selectIsUndeployedSafe, getUndeployedSafeInfo } from '@/features/counterfactual'
import type { UndeployedSafe } from '@/features/counterfactual'
```

**Tool Assistance**: Use IDE refactoring or grep to find all instances:

```bash
# Find all files importing from counterfactual
grep -r "from '@/features/counterfactual/" apps/web/src --exclude-dir=features/counterfactual

# Update each file manually or with sed (careful with sed!)
```

**Verify After Each Group**:

```bash
yarn workspace @safe-global/web type-check
```

**Checkpoint**: All 49 files updated, type-check passes.

---

## Phase 5: Verification (Gate Before Commit)

**Objective**: Verify zero behavioral changes, proper code splitting, full compliance.

**Time**: ~30 minutes

### Step 5.1: Type Check

```bash
yarn workspace @safe-global/web type-check
```

**Expected**: Exit code 0, zero errors.

### Step 5.2: Linting

```bash
yarn workspace @safe-global/web lint
```

**Expected**: Zero `no-restricted-imports` warnings for counterfactual.

**If warnings exist**: Update imports to use public API only.

### Step 5.3: Unit Tests

```bash
yarn workspace @safe-global/web test
```

**Expected**: 100% pass rate, all tests pass.

**If tests fail**: Check import paths in test files, verify no behavioral changes.

### Step 5.4: Build

```bash
yarn workspace @safe-global/web build
```

**Expected**: Build succeeds without errors.

### Step 5.5: Bundle Analysis

```bash
# Check for counterfactual chunks
ls -lh apps/web/.next/static/chunks/ | grep -i counterfactual

# Should see separate chunk files for counterfactual feature
# Indicates proper code splitting
```

**Expected**: Counterfactual code in separate chunks, not in main bundle.

### Step 5.6: Manual QA

Test these critical flows manually:

1. **Activate Account Flow**:
   - Create undeployed Safe (prediction)
   - Click "Activate Account" button
   - Verify deployment transaction submits
   - Verify status updates correctly

2. **Pay Later Flow**:
   - Create undeployed Safe
   - Create first transaction (any transaction)
   - Verify Safe + transaction deployed together
   - Verify status updates correctly

3. **Pending Notifications**:
   - With pending counterfactual Safe
   - Verify notification banner appears
   - Verify status chip shows correct state

**Expected**: All flows work identically to before refactoring.

**Checkpoint**: All checks pass, ready to commit.

---

## Phase 6: Commit & Review

**Objective**: Create atomic commit, push, create PR, verify CI.

**Time**: ~30 minutes

### Step 6.1: Review Changes

```bash
git status
# Should show all modified files

git diff --stat
# Review diff statistics
```

### Step 6.2: Commit

```bash
# Add all changes
git add apps/web/src/features/counterfactual/
git add apps/web/src/store/slices.ts
git add apps/web/src/components/
git add apps/web/src/hooks/
git add apps/web/src/features/myAccounts/
git add apps/web/src/features/multichain/
git add apps/web/src/pages/_app.tsx

# Create semantic commit
git commit -m "refactor(web): migrate counterfactual feature to standard architecture pattern

- Reorganize files into standard subdirectories (components/, hooks/, services/, store/)
- Create public API barrel with lazy loading
- Implement useIsCounterfactualEnabled feature flag hook
- Update 49 external import sites to use public API only
- Extract types to types.ts, constants to constants.ts
- Add barrel files for all subdirectories

BREAKING CHANGE: Internal imports from @/features/counterfactual/* no longer work.
All external code must import from @/features/counterfactual (feature root).

Ref: specs/002-counterfactual-refactor"
```

### Step 6.3: Push & Create PR

```bash
git push origin 002-counterfactual-refactor

# Create PR via gh CLI
gh pr create --title "refactor: migrate counterfactual feature to standard architecture" \
  --body "## Summary

Migrates the counterfactual feature to the standard architecture pattern established in #[001-PR-NUMBER].

## Changes

- ✅ Reorganized 20 files into standard subdirectories
- ✅ Created public API with lazy loading
- ✅ Implemented feature flag hook
- ✅ Updated 49 external import sites
- ✅ Zero behavioral changes (100% test pass rate)

## Verification

- ✅ Type-check passes
- ✅ Lint passes (zero no-restricted-imports warnings)
- ✅ All tests pass
- ✅ Build succeeds with proper code splitting
- ✅ Manual QA: activate account, pay later, notifications all work

## Testing

Tested all critical counterfactual flows:
- Safe activation (pay now)
- First transaction deployment (pay later)
- Pending Safe status notifications
- Safe creation with counterfactual

Closes #[ISSUE-NUMBER]"
```

### Step 6.4: Verify CI

Wait for CI checks to complete:

- ✅ Type-check
- ✅ Lint
- ✅ Tests
- ✅ Build
- ✅ E2E smoke tests (if applicable)

**If CI fails**: Investigate, fix, push additional commit.

**Checkpoint**: PR created, CI passes, ready for review.

---

## Rollback Plan

If issues discovered after merge:

```bash
# Find commit SHA
git log --oneline | grep "counterfactual"

# Revert commit
git revert <commit-sha>

# Verify rollback
yarn workspace @safe-global/web test

# Push revert
git push origin 002-counterfactual-refactor
```

**Expected**: All tests pass after revert, back to pre-refactor state.

---

## Troubleshooting

### Type Errors After Moving Files

**Symptom**: Type-check fails with "Cannot find module" errors.

**Solution**: Update relative import paths in moved files. Ensure `../` depth matches new location.

### ESLint Warnings After Refactor

**Symptom**: `no-restricted-imports` warnings persist.

**Solution**: Ensure all external imports use `@/features/counterfactual` (feature root), not deep paths.

### Tests Fail After Refactor

**Symptom**: Tests fail that passed before.

**Solution**:

1. Check import paths in test files
2. Verify no behavioral changes to reducers/selectors
3. Ensure test data matches expected types

### Build Fails

**Symptom**: Next.js build fails with module errors.

**Solution**:

1. Clear cache: `rm -rf apps/web/.next`
2. Reinstall dependencies: `yarn install`
3. Verify all imports resolve
4. Check for circular dependencies

### Bundle Not Code-Split

**Symptom**: Counterfactual code in main bundle, not separate chunks.

**Solution**:

1. Verify `index.ts` uses `dynamic()` imports (not needed for counterfactual)
2. Check that external code uses dynamic imports where appropriate
3. Counterfactual may not need default export - verify usage patterns

---

## Success Criteria Checklist

Before marking refactoring complete, verify:

- [x] Directory structure matches standard pattern
- [x] All 27 file operations completed
- [x] 49 external import sites updated
- [x] Type-check passes (zero errors)
- [x] Lint passes (zero no-restricted-imports warnings)
- [x] All tests pass (100% pass rate)
- [x] Build succeeds
- [x] Code splitting verified (separate chunks exist)
- [x] Manual QA passed (all flows work)
- [x] PR created with comprehensive description
- [x] CI passes (all checks green)

**Refactoring Complete**: Feature follows standard architecture, zero behavioral changes, ready to merge.
