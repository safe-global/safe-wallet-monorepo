# Research: Migrate Hypernative Feature to Architecture v2

**Feature**: 002-migrate-hypernative
**Date**: 2026-01-26

## Research Topics

### 1. Feature Architecture v2 Pattern

**Decision**: Use `createFeatureHandle()` factory with typed contract

**Rationale**:

- The `__core__` infrastructure already exists with `createFeatureHandle`, `useLoadFeature`, and `withSuspense`
- WalletConnect feature provides a reference implementation
- Factory pattern reduces boilerplate (eliminates separate handle.ts file)
- Semantic mapping in `createFeatureHandle.ts` needs to be updated with `hypernative: FEATURES.HYPERNATIVE`

**Alternatives Considered**:

- Manual handle definition (rejected: more boilerplate, no additional benefit)
- No contract file (rejected: loses type safety and IDE navigation)

### 2. Feature Flag Mapping

**Decision**: Add `hypernative: FEATURES.HYPERNATIVE` to `FEATURE_FLAG_MAPPING` in `createFeatureHandle.ts`

**Rationale**:

- Verified `FEATURES.HYPERNATIVE` exists and is used in 4 hook files
- Folder name `hypernative` matches the semantic mapping convention
- Enables single-parameter `createFeatureHandle('hypernative')` usage

**Alternatives Considered**:

- Pass flag explicitly (rejected: unnecessary when mapping can handle it)
- Auto-derivation (works but explicit mapping is clearer)

### 3. External Consumer Analysis

**Decision**: Update ~15 external consumer files to use `useLoadFeature(HypernativeFeature)`

**Files requiring updates**:

| File                                                     | Current Imports   | Migration Approach                    |
| -------------------------------------------------------- | ----------------- | ------------------------------------- |
| `pages/transactions/history.tsx`                         | hooks, components | useLoadFeature pattern                |
| `pages/transactions/queue.tsx`                           | hooks, components | useLoadFeature pattern                |
| `pages/hypernative/oauth-callback.tsx`                   | hooks, config     | Special handling (OAuth utilities)    |
| `components/dashboard/index.tsx`                         | hooks, components | useLoadFeature pattern                |
| `components/dashboard/FirstSteps/index.tsx`              | hooks, components | useLoadFeature pattern                |
| `components/tx-flow/flows/NewTx/index.tsx`               | component         | useLoadFeature pattern                |
| `components/settings/SecurityLogin/index.tsx`            | components        | useLoadFeature pattern                |
| `components/sidebar/SidebarHeader/SafeHeaderInfo.tsx`    | hook              | useLoadFeature pattern                |
| `components/common/EthHashInfo/SrcEthHashInfo/index.tsx` | component         | useLoadFeature pattern                |
| `components/transactions/TxSummary/index.tsx`            | hooks, components | useLoadFeature pattern                |
| `components/transactions/TxDetails/index.tsx`            | hooks, components | useLoadFeature pattern                |
| `features/safe-shield/index.tsx`                         | hooks             | useLoadFeature pattern                |
| `features/safe-shield/SafeShieldContext.tsx`             | hook              | useLoadFeature pattern                |
| `features/safe-shield/hooks/*.ts`                        | hooks, types      | useLoadFeature pattern + type imports |
| `features/safe-shield/components/*.tsx`                  | types             | Type imports from types.ts            |
| `store/slices.ts`                                        | store barrel      | Keep direct import (FR-006)           |

**Rationale**:

- Most consumers follow standard component/hook usage pattern
- OAuth callback page needs special handling for synchronous utilities
- Store re-export should remain direct (per FR-006 in spec)

### 4. OAuth Callback Page Handling

**Decision**: Export OAuth utilities (`readPkce`, `clearPkce`, `getRedirectUri`, `HYPERNATIVE_OAUTH_CONFIG`) as lightweight direct exports from index.ts

**Rationale**:

- OAuth callback page needs synchronous access to these utilities
- They are lightweight constants/functions, not heavy feature code
- Alternative of lazy-loading would break OAuth flow

**Implementation**:

```typescript
// index.ts
export { HypernativeFeature } from './handle' // Main feature handle

// Lightweight OAuth utilities (synchronous, no heavy imports)
export { readPkce, clearPkce } from './hooks/useHypernativeOAuth'
export { HYPERNATIVE_OAUTH_CONFIG, getRedirectUri } from './config/oauth'
```

### 5. Components to Expose in Contract

**Decision**: Expose only components currently used by external consumers

**Components for contract (10 total)**:

| Component                             | Used By                                     |
| ------------------------------------- | ------------------------------------------- |
| `HnBannerForHistory`                  | pages/transactions/history.tsx              |
| `HnBannerForQueue`                    | pages/transactions/queue.tsx                |
| `HnBannerForCarousel`                 | components/dashboard/index.tsx              |
| `HnBannerForSettings`                 | components/settings/SecurityLogin/index.tsx |
| `HnLoginCard`                         | pages/transactions/queue.tsx                |
| `HnMiniTxBanner`                      | components/tx-flow/flows/NewTx/index.tsx    |
| `HnPendingBanner`                     | components/dashboard/index.tsx              |
| `HnDashboardBannerWithNoBalanceCheck` | components/dashboard/FirstSteps/index.tsx   |
| `HnActivatedBannerForSettings`        | components/settings/SecurityLogin/index.tsx |
| `HypernativeTooltip`                  | safe-shield, EthHashInfo                    |
| `HypernativeLogo`                     | safe-shield/AnalysisGroupCard               |
| `HnQueueAssessment`                   | components/transactions/TxSummary           |
| `HnQueueAssessmentBanner`             | components/transactions/TxDetails           |
| `QueueAssessmentProvider`             | pages/transactions/queue.tsx                |

### 6. Hooks to Expose in Contract

**Decision**: Expose all hooks currently exported from hooks/index.ts plus additional hooks used externally

**Hooks for contract (14 total)**:

| Hook                                 | Used By                           |
| ------------------------------------ | --------------------------------- |
| `useIsHypernativeGuard`              | SafeHeaderInfo, safe-shield       |
| `useIsHypernativeFeature`            | settings tests                    |
| `useIsHypernativeQueueScanFeature`   | pages/transactions/queue.tsx      |
| `useBannerStorage`                   | various                           |
| `useBannerVisibility`                | dashboard, transactions pages     |
| `useTrackBannerEligibilityOnConnect` | various                           |
| `useAuthToken`                       | oauth-callback, safe-shield       |
| `useCalendly`                        | signup flow                       |
| `useShowHypernativeAssessment`       | TxSummary, TxDetails              |
| `useAssessmentUrl`                   | internal                          |
| `useHnAssessmentSeverity`            | internal                          |
| `useHypernativeOAuth`                | safe-shield, TxSummary, TxDetails |
| `useIsHypernativeEligible`           | safe-shield                       |
| `useQueueAssessment`                 | TxSummary, TxDetails              |

### 7. Services to Expose

**Decision**: Expose guard check service for direct usage

**Services**:

- `isHypernativeGuard` from `services/hypernativeGuardCheck.ts`
- `calculateSafeTxHash` from `services/safeTxHashCalculation.ts` (if used externally)

### 8. Type Exports

**Decision**: Create `types.ts` consolidating all public types

**Types to export**:

- `HypernativeAuthStatus` (from useHypernativeOAuth)
- `HypernativeEligibility` (from useIsHypernativeEligible)
- `HypernativeGuardCheckResult` (from useIsHypernativeGuard)
- `BannerType` (from useBannerStorage)
- `BannerVisibilityResult` (from useBannerVisibility)

### 9. Test Mocking Strategy

**Decision**: Update test mocks to use feature module mocking pattern

**Rationale**:

- Existing tests mock individual hooks/components directly
- After migration, tests should mock `@/features/hypernative` module
- Consumer tests (safe-shield) will need mock updates for `useLoadFeature` pattern

**Example mock pattern**:

```typescript
jest.mock('@/features/hypernative', () => ({
  HypernativeFeature: {
    name: 'hypernative',
    useIsEnabled: () => true,
    load: () =>
      Promise.resolve({
        default: {
          components: { HypernativeTooltip: () => null },
          hooks: { useIsHypernativeGuard: () => ({ isHypernativeGuard: false, loading: false }) },
        },
      }),
  },
}))
```

## Summary

All research topics resolved. No NEEDS CLARIFICATION items remain. Ready to proceed to Phase 1: Design & Contracts.
