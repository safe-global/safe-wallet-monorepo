# Research: Counterfactual Feature Refactor

**Feature**: 002-counterfactual-refactor  
**Phase**: 0 (Outline & Research)  
**Date**: 2026-01-15

## Purpose

Document refactoring patterns, file inventory, dependency mapping, public API design, and verification strategy for migrating the counterfactual feature to the standard architecture pattern established in 001-feature-architecture.

## 1. Pattern Analysis: Walletconnect Reference Implementation

### Key Learnings from Walletconnect Refactor

**What Worked Well**:

1. **Clear Directory Structure**: Components, hooks, services, and store each in dedicated subdirectories with barrel files
2. **Public API Boundary**: Root `index.ts` exports only what external code needs - types, feature flag hook, store exports, and lazy-loaded components
3. **Feature Flag Pattern**: Simple hook (`useIsWalletConnectEnabled`) checking `useHasFeature(FEATURES.NATIVE_WALLETCONNECT)`
4. **Lazy Loading**: Default export uses `dynamic(() => import('./components/WalletConnectUi'), { ssr: false })`
5. **Type Safety**: All types centralized in `types.ts`, re-exported from root `index.ts` as `export type {}`

**Structure Pattern** (from walletconnect):

```typescript
features/walletconnect/
├── index.ts                      // Public API with lazy loading
├── types.ts                      // All TypeScript interfaces
├── constants.ts                  // Feature constants
├── components/
│   ├── index.tsx                 // Component barrel
│   └── {ComponentName}/index.tsx
├── hooks/
│   ├── index.ts                  // Hook barrel
│   └── useIsWalletConnectEnabled.ts  // Feature flag hook
├── services/
│   ├── index.ts                  // Service barrel
│   └── *.ts files
└── store/
    ├── index.ts                  // Store barrel
    └── *Slice.ts files
```

**Decision**: Apply this exact pattern to counterfactual.

**Rationale**: Walletconnect refactor successfully demonstrates the pattern works. Proven approach reduces risk and ensures consistency across features.

**Alternatives Considered**: Custom structure for counterfactual - rejected because consistency is a key goal of the standard architecture.

## 2. File Inventory: Complete Manifest

### Current Structure Analysis

**Total Files**: 20 TypeScript files + 1 CSS file

**Files by Category**:

| Category             | Count | Files                                                                                                                                                                                                       |
| -------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components (root)    | 10    | ActivateAccountButton, ActivateAccountFlow, CheckBalance, CounterfactualForm, CounterfactualHooks, CounterfactualStatusButton, CounterfactualSuccessScreen, FirstTxFlow, LazyCounterfactual, PayNowPayLater |
| Hooks (root)         | 2     | useCounterfactualBalances.ts                                                                                                                                                                                |
| Hooks (hooks/)       | 4     | useDeployGasLimit, useIsCounterfactualSafe, usePendingSafeNotifications, usePendingSafeStatuses                                                                                                             |
| Services (root)      | 1     | utils.ts                                                                                                                                                                                                    |
| Services (services/) | 1     | safeCreationEvents.ts                                                                                                                                                                                       |
| Store                | 1     | store/undeployedSafesSlice.ts                                                                                                                                                                               |
| Tests                | 2     | **tests**/utils.test.ts, **tests**/useDeployGasLimit.test.ts                                                                                                                                                |
| Styles               | 1     | styles.module.css                                                                                                                                                                                           |

### File Movement Manifest

| Source Path                            | Destination Path                                   | Action        | Notes                                        |
| -------------------------------------- | -------------------------------------------------- | ------------- | -------------------------------------------- |
| `ActivateAccountButton.tsx`            | `components/ActivateAccountButton/index.tsx`       | MOVE          | Component → subdirectory                     |
| `ActivateAccountFlow.tsx`              | `components/ActivateAccountFlow/index.tsx`         | MOVE          | Component → subdirectory                     |
| `CheckBalance.tsx`                     | `components/CheckBalance/index.tsx`                | MOVE          | Component → subdirectory                     |
| `CounterfactualForm.tsx`               | `components/CounterfactualForm/index.tsx`          | MOVE          | Component → subdirectory                     |
| `CounterfactualHooks.tsx`              | `components/CounterfactualHooks/index.tsx`         | MOVE          | Component → subdirectory                     |
| `CounterfactualStatusButton.tsx`       | `components/CounterfactualStatusButton/index.tsx`  | MOVE          | Component → subdirectory                     |
| `CounterfactualSuccessScreen.tsx`      | `components/CounterfactualSuccessScreen/index.tsx` | MOVE          | Component → subdirectory                     |
| `FirstTxFlow.tsx`                      | `components/FirstTxFlow/index.tsx`                 | MOVE          | Component → subdirectory                     |
| `LazyCounterfactual.tsx`               | `components/LazyCounterfactual/index.tsx`          | MOVE          | Component → subdirectory                     |
| `PayNowPayLater.tsx`                   | `components/PayNowPayLater/index.tsx`              | MOVE          | Component → subdirectory                     |
| `useCounterfactualBalances.ts`         | `hooks/useCounterfactualBalances.ts`               | MOVE          | Hook root → hooks/                           |
| `hooks/useDeployGasLimit.ts`           | `hooks/useDeployGasLimit.ts`                       | KEEP          | Already in correct location                  |
| `hooks/useIsCounterfactualSafe.ts`     | `hooks/useIsCounterfactualSafe.ts`                 | KEEP          | Already in correct location                  |
| `hooks/usePendingSafeNotifications.ts` | `hooks/usePendingSafeNotifications.ts`             | KEEP          | Already in correct location                  |
| `hooks/usePendingSafeStatuses.ts`      | `hooks/usePendingSafeStatuses.ts`                  | KEEP          | Already in correct location                  |
| N/A                                    | `hooks/useIsCounterfactualEnabled.ts`              | CREATE        | New feature flag hook                        |
| `utils.ts`                             | `services/counterfactualUtils.ts`                  | MOVE + RENAME | Service root → services/, rename for clarity |
| `services/safeCreationEvents.ts`       | `services/safeCreationEvents.ts`                   | KEEP          | Already in correct location                  |
| `store/undeployedSafesSlice.ts`        | `store/undeployedSafesSlice.ts`                    | KEEP          | Already in correct location                  |
| `__tests__/utils.test.ts`              | `services/__tests__/counterfactualUtils.test.ts`   | MOVE + RENAME | Colocate with source                         |
| `__tests__/useDeployGasLimit.test.ts`  | `hooks/__tests__/useDeployGasLimit.test.ts`        | MOVE          | Colocate with source                         |
| `styles.module.css`                    | `components/*/styles.module.css`                   | SPLIT         | Move to component subdirectories as needed   |

### New Files to Create

| File Path                             | Purpose                                   | Required |
| ------------------------------------- | ----------------------------------------- | -------- |
| `index.ts`                            | Public API barrel with lazy loading       | Yes      |
| `types.ts`                            | All TypeScript interfaces                 | Yes      |
| `constants.ts`                        | Feature constants (CF_TX_GROUP_KEY, etc.) | Yes      |
| `components/index.ts`                 | Component barrel file                     | Yes      |
| `hooks/index.ts`                      | Hook barrel file                          | Yes      |
| `hooks/useIsCounterfactualEnabled.ts` | Feature flag hook                         | Yes      |
| `services/index.ts`                   | Service barrel file                       | Yes      |
| `store/index.ts`                      | Store barrel file                         | Yes      |

**Total Actions**: 10 moves, 5 keeps, 1 rename, 1 create, 2 test relocations, 8 new barrel files = **27 file operations**

## 3. Dependency Mapping: External Import Sites

### Import Analysis

**Total External Imports**: 69 import statements across 49 files

### External Import Matrix by Priority

**Priority 1: Critical Infrastructure** (must update first)

| File              | Import Count | Imports                | Update Complexity             |
| ----------------- | ------------ | ---------------------- | ----------------------------- |
| `store/slices.ts` | 1            | `undeployedSafesSlice` | HIGH - exports for entire app |

**Priority 2: Transaction Flow** (core functionality)

| File                                                      | Import Count | Imports           | Update Complexity |
| --------------------------------------------------------- | ------------ | ----------------- | ----------------- |
| `components/tx-flow/actions/Counterfactual.tsx`           | 2            | utils, components | MEDIUM            |
| `components/tx-flow/actions/Execute/index.tsx`            | 1            | hooks             | LOW               |
| `components/tx-flow/actions/Sign/index.tsx`               | 1            | hooks             | LOW               |
| `components/tx-flow/actions/ExecuteThroughRole/index.tsx` | 1            | hooks             | LOW               |
| `components/tx-flow/actions/Batching/index.tsx`           | 1            | hooks             | LOW               |
| `components/tx-flow/features/BalanceChanges.tsx`          | 1            | hooks             | LOW               |
| `components/tx-flow/features/ExecuteCheckbox.tsx`         | 1            | hooks             | LOW               |
| `components/tx-flow/TxFlowProvider.tsx`                   | 1            | hooks             | LOW               |

**Priority 3: Safe Creation** (activation flows)

| File                                                               | Import Count | Imports                  | Update Complexity |
| ------------------------------------------------------------------ | ------------ | ------------------------ | ----------------- |
| `components/new-safe/create/steps/StatusStep/index.tsx`            | 3            | components, hooks, utils | MEDIUM            |
| `components/new-safe/create/steps/ReviewStep/index.tsx`            | 3            | components, hooks, utils | MEDIUM            |
| `components/new-safe/create/steps/StatusStep/StatusMessage.tsx`    | 1            | hooks                    | LOW               |
| `components/new-safe/create/steps/StatusStep/useUndeployedSafe.ts` | 1            | store                    | LOW               |
| `components/new-safe/create/logic/index.ts`                        | 1            | utils                    | LOW               |

**Priority 4: Feature Integrations**

| File                                                                | Import Count | Imports      | Update Complexity |
| ------------------------------------------------------------------- | ------------ | ------------ | ----------------- |
| `features/myAccounts/components/AccountItems/SingleAccountItem.tsx` | 2            | hooks, store | LOW               |
| `features/myAccounts/components/AccountItems/MultiAccountItem.tsx`  | 2            | hooks, store | LOW               |
| `features/myAccounts/components/AccountInfoChips/index.tsx`         | 1            | hooks        | LOW               |
| `features/multichain/utils/utils.ts`                                | 1            | utils        | LOW               |
| `features/multichain/hooks/useSafeCreationData.ts`                  | 1            | store        | LOW               |
| `features/multichain/components/CreateSafeOnNewChain/index.tsx`     | 1            | utils        | LOW               |

**Priority 5: Loadables & Hooks**

| File                                                | Import Count | Imports      | Update Complexity |
| --------------------------------------------------- | ------------ | ------------ | ----------------- |
| `hooks/loadables/useLoadSafeInfo.ts`                | 2            | hooks, utils | LOW               |
| `hooks/loadables/useLoadBalances.ts`                | 1            | utils        | LOW               |
| `hooks/loadables/useTrustedTokenBalances.ts`        | 1            | utils        | LOW               |
| `hooks/loadables/__tests__/useLoadBalances.test.ts` | 1            | utils        | LOW               |
| `hooks/coreSDK/useInitSafeCoreSDK.ts`               | 1            | hooks        | LOW               |
| `hooks/coreSDK/safeCoreSDK.ts`                      | 1            | utils        | LOW               |

**Priority 6: UI Components**

| File                                                                | Import Count | Imports                  | Update Complexity |
| ------------------------------------------------------------------- | ------------ | ------------------------ | ----------------- |
| `components/dashboard/FirstSteps/index.tsx`                         | 4            | components, hooks, utils | MEDIUM            |
| `components/sidebar/SidebarHeader/index.tsx`                        | 1            | hooks                    | LOW               |
| `components/sidebar/NewTxButton/index.tsx`                          | 2            | hooks                    | LOW               |
| `components/balances/AssetsTable/index.tsx`                         | 1            | hooks                    | LOW               |
| `components/settings/PushNotifications/GlobalPushNotifications.tsx` | 1            | hooks                    | LOW               |
| `components/settings/DataManagement/index.tsx`                      | 1            | utils                    | LOW               |
| `components/settings/DataManagement/ImportDialog.tsx`               | 1            | utils                    | LOW               |

**Priority 7: Internal Feature Imports** (counterfactual files importing from counterfactual)

| File                   | Import Count | Imports                  | Update Complexity                       |
| ---------------------- | ------------ | ------------------------ | --------------------------------------- |
| Internal feature files | 21           | Various internal imports | MEDIUM - update after structure changes |

### Update Strategy by Priority

1. **Phase 1**: Update `store/slices.ts` FIRST (blocks everything else)
2. **Phase 2**: Update transaction flow (8 files) - validates core functionality
3. **Phase 3**: Update Safe creation (5 files) - validates activation flows
4. **Phase 4**: Batch update feature integrations, loadables, UI components (28 files)
5. **Phase 5**: Update internal imports within counterfactual feature (21 internal imports)

**Decision**: Phased update approach with critical infrastructure first.

**Rationale**: Minimizes risk by updating most critical paths first, enables incremental validation, and reduces blast radius if issues arise.

**Alternatives Considered**: Update all at once - rejected due to high risk of missing broken imports; would make debugging difficult.

## 4. Public API Design

### Public API Surface Area

Based on external import analysis, the public API must export:

**Types** (tree-shakeable - safe to export all):

- `UndeployedSafe`
- `UndeployedSafesState`
- `UndeployedSafeStatus`
- `UndeployedSafeProps`
- `ReplayedSafeProps`
- `PredictedSafeProps` (imported from `@safe-global/protocol-kit`, re-export for convenience)

**Feature Flag Hook** (required):

- `useIsCounterfactualEnabled` (NEW)

**Store Exports**:

- `undeployedSafesSlice` (slice itself)
- Actions: `addUndeployedSafe`, `updateUndeployedSafeStatus`, `removeUndeployedSafe`
- Selectors: `selectUndeployedSafes`, `selectUndeployedSafe`, `selectUndeployedSafesByAddress`, `selectIsUndeployedSafe`

**Service Functions** (used extensively across codebase):

- `getUndeployedSafeInfo`
- `deploySafeAndExecuteTx`
- `getCounterfactualBalance`
- `replayCounterfactualSafeDeployment`
- `checkSafeActivation`
- `checkSafeActionViaRelay`
- `extractCounterfactualSafeSetup`
- `activateReplayedSafe`
- `isReplayedSafeProps`
- `isPredictedSafeProps`
- `dispatchTxExecutionAndDeploySafe` (used in tx flows)

**Constants**:

- `CF_TX_GROUP_KEY` (used in transaction monitoring)

**Components** (used externally - may need lazy loading):

- Most counterfactual components are NOT used externally
- External usage is via hooks/services/store, not direct component imports
- No default export component needed (feature is integrated at multiple points)

### Internal-Only APIs

These remain internal (not exported):

**Hooks**:

- `useDeployGasLimit` - Internal gas calculation
- `usePendingSafeStatuses` - Internal monitoring (exports safeCreationPendingStatuses constant)
- `usePendingSafeNotifications` - Internal notification logic

**Components** (not directly exported, composed internally):

- `ActivateAccountFlow` - Internal to ActivateAccountButton
- `CounterfactualSuccessScreen` - Internal to CounterfactualHooks
- `LazyCounterfactual` - Internal to CounterfactualHooks

### Public APIs (Actually Exported)

**Hooks** (all exported for React integration):

- `useIsCounterfactualEnabled` - Feature flag check (REQUIRED)
- `useIsCounterfactualSafe` - Check if Safe is undeployed (used by 11+ external files)
- `useCounterfactualBalances` - Get balance data for undeployed Safes
- `safeCreationPendingStatuses` - Status constants for monitoring

**Components** (exported for UI integration points):

- `CounterfactualHooks` - Global UI rendered in \_app.tsx
- `ActivateAccountButton` - Sidebar, NewTxButton
- `CheckBalance` - AssetsTable
- `CounterfactualForm` - Tx flow actions
- `CounterfactualStatusButton` - SidebarHeader
- `FirstTxFlow` - Dashboard
- `PayNowPayLater` - New Safe creation
- `LoopIcon` - Account info chips

**Decision**: Export types, hooks (including integration hooks), components (used at integration points), store, services, and constants. This is broader than initially planned but reflects actual integration requirements.

**Rationale**: The feature integrates deeply with transaction flows, sidebars, dashboards, and Safe creation. External code needs both hooks for state checks and components for UI rendering at multiple locations. Store selectors alone are insufficient for the complex UI integration requirements across 11+ external files.

**Alternatives Considered**:

1. Export only selectors - rejected, less ergonomic and doesn't match existing patterns
2. Single wrapper component - rejected, counterfactual UI appears at multiple independent locations
3. Move integration logic external - rejected, would spread feature logic and violate encapsulation

## 5. Verification Strategy

### Zero Behavioral Changes Guarantee

**Testing Pyramid**:

1. **Type Safety** (fast feedback):
   - `yarn workspace @safe-global/web type-check` → MUST pass
   - Catches 80% of issues immediately
   - Run after every batch of import updates

2. **Linting** (import compliance):
   - `yarn workspace @safe-global/web lint` → zero no-restricted-imports warnings
   - Validates public API boundary enforcement
   - Run before commit

3. **Unit Tests** (logic correctness):
   - `yarn workspace @safe-global/web test` → 100% pass rate
   - Existing tests must pass without modification (except import path updates)
   - Run before commit

4. **Build Verification** (code splitting):
   - `yarn workspace @safe-global/web build` → succeeds
   - Check `.next/static/chunks/` for counterfactual chunks
   - Verify separate bundle exists (not in main chunk)

5. **Manual QA** (user flows):
   - Activate account flow (pay now)
   - First transaction flow (pay later)
   - Pending notifications display
   - Safe creation with counterfactual

### Verification Checklist

| Check                    | Command                                      | Success Criteria                       | When to Run             |
| ------------------------ | -------------------------------------------- | -------------------------------------- | ----------------------- |
| Type Check               | `yarn workspace @safe-global/web type-check` | Exit code 0, no errors                 | After each import batch |
| Linting                  | `yarn workspace @safe-global/web lint`       | Zero no-restricted-imports warnings    | Before commit           |
| Unit Tests               | `yarn workspace @safe-global/web test`       | 100% pass rate                         | Before commit           |
| Build                    | `yarn workspace @safe-global/web build`      | Succeeds, counterfactual chunks exist  | Before commit           |
| Bundle Analysis          | Inspect `.next/static/chunks/`               | Counterfactual code in separate chunks | After build             |
| Manual QA: Activate      | Test activate account flow                   | Works identically                      | Before PR               |
| Manual QA: First TX      | Test pay later flow                          | Works identically                      | Before PR               |
| Manual QA: Notifications | Test pending Safe notifications              | Appear correctly                       | Before PR               |

### Rollback Plan

**Single Atomic Commit Strategy**:

- All refactoring changes in ONE commit
- Enables clean rollback: `git revert <commit-sha>`
- If issues discovered post-merge: revert immediately, investigate separately

**Rollback Verification**:

1. Run `git revert <commit-sha>`
2. Run full test suite: `yarn workspace @safe-global/web test`
3. Verify 100% pass rate (back to pre-refactor state)
4. Deploy reverted code if issues found in production

**Decision**: Single atomic commit with comprehensive verification before merge.

**Rationale**: Reduces risk by enabling instant rollback. Comprehensive pre-merge verification minimizes chance of needing rollback.

**Alternatives Considered**: Multiple smaller commits - rejected because it makes rollback harder (must revert multiple commits in order) and increases risk of intermediate broken states.

## 6. Implementation Sequence

### Recommended Execution Order

**Phase 1: Preparation** (non-breaking):

1. Create all barrel files (`index.ts` files) - empty initially
2. Create `types.ts` and `constants.ts` - empty initially
3. Run type-check (should still pass - new empty files don't break anything)

**Phase 2: File Reorganization** (breaking - do in single session):

1. Move all component files to `components/*/index.tsx`
2. Move hook files to `hooks/`
3. Move/rename `utils.ts` to `services/counterfactualUtils.ts`
4. Move test files to colocated `__tests__/` directories
5. Update ALL internal imports within counterfactual feature
6. Run type-check continuously to catch broken imports

**Phase 3: Public API Establishment** (breaking):

1. Extract all interfaces to `types.ts`
2. Extract constants to `constants.ts`
3. Create `useIsCounterfactualEnabled` hook
4. Populate all barrel files (`components/index.ts`, `hooks/index.ts`, `services/index.ts`, `store/index.ts`)
5. Populate root `index.ts` with public API exports
6. Run type-check (may fail - external imports not yet updated)

**Phase 4: External Import Updates** (critical path):

1. Update `store/slices.ts` FIRST
2. Update transaction flow files (8 files)
3. Update Safe creation files (5 files)
4. Batch update remaining files (28 files)
5. Run type-check after each priority group

**Phase 5: Verification** (gate before commit):

1. Type-check: `yarn workspace @safe-global/web type-check` → PASS
2. Lint: `yarn workspace @safe-global/web lint` → zero warnings
3. Tests: `yarn workspace @safe-global/web test` → 100% pass
4. Build: `yarn workspace @safe-global/web build` → succeeds
5. Bundle analysis: verify code splitting
6. Manual QA: all critical flows work

**Phase 6: Commit & Review**:

1. Semantic commit: `refactor: migrate counterfactual feature to standard architecture pattern`
2. Push to branch
3. Create PR with verification checklist in description
4. CI must pass (all checks green)
5. Code review
6. Merge

### Estimated Timeline

| Phase                        | Tasks                                                   | Estimated Time |
| ---------------------------- | ------------------------------------------------------- | -------------- |
| Phase 1: Preparation         | Create 8 barrel files                                   | 15 minutes     |
| Phase 2: File Reorganization | Move 12 files, update internal imports                  | 1 hour         |
| Phase 3: Public API          | Extract types/constants, create hooks, populate barrels | 1 hour         |
| Phase 4: External Imports    | Update 49 files across codebase                         | 2-3 hours      |
| Phase 5: Verification        | Run all checks, manual QA                               | 30 minutes     |
| Phase 6: Commit & Review     | Create PR, address feedback                             | 30 minutes     |
| **Total**                    |                                                         | **5-6 hours**  |

**Recommendation**: Execute Phases 2-4 in single focused session to minimize broken state duration.

## Summary

**Research Complete**: All unknowns resolved, patterns documented, file manifest created, dependencies mapped, public API designed, verification strategy established.

**Key Decisions**:

1. Follow walletconnect reference implementation pattern exactly
2. Phased external import updates (critical infrastructure first)
3. Export types, feature flag hook, store, services, constants only (internal hooks/components remain private)
4. Single atomic commit with comprehensive pre-merge verification
5. Zero behavioral changes - 100% test pass rate required

**Ready for Phase 1**: Design artifacts (data-model.md, contracts/public-api.ts, quickstart.md) can now be created with full context.

**Risk Mitigation**:

- Phased updates reduce blast radius
- Type-check after each batch catches issues early
- Single atomic commit enables instant rollback
- Comprehensive verification before merge minimizes production risk
