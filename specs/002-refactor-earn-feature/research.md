# Research & Decisions: Refactor Earn Feature

**Feature**: 002-refactor-earn-feature  
**Date**: 2026-01-15  
**Purpose**: Resolve all unknowns and document design decisions before Phase 1

---

## Research Task 1: Identify External Dependencies

**Goal**: Map every location in the codebase that imports from the earn feature to understand what must be included in the public API.

### Findings

**Direct Imports** (components imported from outside the feature):

1. **`EarnButton`** component:
   - `apps/web/src/components/dashboard/Assets/index.tsx` (line 18)
   - `apps/web/src/components/balances/AssetsTable/PromoButtons.tsx` (line 5)
   - Current import path: `@/features/earn/components/EarnButton`
2. **`useIsEarnFeatureEnabled`** hook (aliased as `useIsEarnPromoEnabled`):
   - `apps/web/src/components/dashboard/index.tsx` (line 19)
   - Current import path: `@/features/earn/hooks/useIsEarnFeatureEnabled`

3. **Analytics constants** (`EARN_EVENTS`, `EARN_LABELS`):
   - **NOT imported from earn feature** - these live in `@/services/analytics/events/earn.ts` (global analytics service)
   - No refactoring needed for analytics imports
   - `EarnButton` and `EarnInfo` components import these from the global service

**Indirect Dependencies** (used by the feature page):

1. **Main feature component** (default export from `index.tsx`):
   - `apps/web/src/pages/earn.tsx` (line 9) - uses dynamic import
   - Current import path: `@/features/earn`

### Decision: Public API Surface

**Must be exported from `index.ts` (public API)**:

- ✅ Default export: Main earn page component (for lazy loading from page)
- ✅ Named export: `EarnButton` component
- ✅ Named export: `useIsEarnFeatureEnabled` hook
- ✅ Named export: Types used by `EarnButton` props (if any external types are needed)

**Should remain internal** (not exported):

- ❌ `EarnView`, `EarnWidget`, `EarnInfo` (internal components)
- ❌ `useGetWidgetUrl` hook (internal utility)
- ❌ `utils.ts` functions (internal utilities - except `isEligibleEarnToken` which is public)

**Vault components** (required public exports):

- ✅ All vault-related components ARE part of the public API (used by external transaction flow components)
- ✅ `VaultDepositConfirmation`, `VaultRedeemConfirmation` (used in confirmation-views)
- ✅ `VaultDepositTxDetails`, `VaultRedeemTxDetails` (used in TxData)
- ✅ `VaultDepositTxInfo`, `VaultRedeemTxInfo` (used in TxInfo)

### Files Requiring Updates

1. `apps/web/src/components/dashboard/Assets/index.tsx`:

   ```typescript
   // BEFORE:
   import EarnButton from '@/features/earn/components/EarnButton'

   // AFTER:
   import { EarnButton } from '@/features/earn'
   ```

2. `apps/web/src/components/balances/AssetsTable/PromoButtons.tsx`:

   ```typescript
   // BEFORE:
   import EarnButton from '@/features/earn/components/EarnButton'

   // AFTER:
   import { EarnButton } from '@/features/earn'
   ```

3. `apps/web/src/components/dashboard/index.tsx`:

   ```typescript
   // BEFORE:
   import { useIsEarnFeatureEnabled as useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'

   // AFTER:
   import { useIsEarnFeatureEnabled as useIsEarnPromoEnabled } from '@/features/earn'
   ```

4. `apps/web/src/pages/earn.tsx`:
   - No change needed (already uses `@/features/earn`)
   - The dynamic import will continue to work with the new barrel file

---

## Research Task 2: Type Extraction Analysis

**Goal**: Identify all TypeScript interfaces currently defined inline within components to centralize in `types.ts`.

### Findings

**Component Prop Types**:

After examining all component files in the earn feature:

1. **`EarnButton`** props (line 18-27 of `components/EarnButton/index.tsx`):

   ```typescript
   {
     tokenInfo: Balance['tokenInfo']
     trackingLabel: EARN_LABELS
     compact?: boolean
     onlyIcon?: boolean
   }
   ```

   - Uses `Balance['tokenInfo']` from `@safe-global/store/gateway/AUTO_GENERATED/balances`
   - Uses `EARN_LABELS` from global analytics (not earn feature)
   - **Decision**: Extract to named interface `EarnButtonProps` in `types.ts`

2. **`EarnInfo`** props:

   ```typescript
   { onGetStarted: () => void }
   ```

   - Simple function prop, no extraction needed (can remain inline)

3. **`EarnWidget`** props:

   ```typescript
   { asset?: string }
   ```

   - Simple optional string, no extraction needed (can remain inline)

4. **`EarnView`** props:
   - No props (component uses hooks internally)

5. **Vault component props**:
   - These components have more complex inline prop types
   - **Decision**: Extract to `types.ts` for consistency, but mark as internal (not exported from public API)

### Decision: Type Centralization Strategy

**Create `types.ts` with the following structure**:

```typescript
// Public types (exported from public API)
export interface EarnButtonProps {
  tokenInfo: Balance['tokenInfo']
  trackingLabel: EARN_LABELS
  compact?: boolean
  onlyIcon?: boolean
}

// Internal types (not exported from public API)
interface EarnWidgetProps {
  asset?: string
}

interface EarnInfoProps {
  onGetStarted: () => void
}

// ... vault-related types (internal)
```

**Types NOT needing extraction**:

- Simple inline function types: `() => void`
- Simple inline primitive types: `string`, `boolean`
- Re-exported external types: `Balance['tokenInfo']`, `EARN_LABELS`

---

## Research Task 3: Analytics Tracking Patterns

**Goal**: Determine how earn analytics events are currently implemented and whether they need to be extracted to a dedicated `services/tracking.ts`.

### Findings

**Current Analytics Architecture**:

1. **Analytics events defined globally**:
   - Location: `apps/web/src/services/analytics/events/earn.ts`
   - Contains: `EARN_EVENTS` object and `EARN_LABELS` enum
   - This is NOT part of the earn feature (it's in global services)

2. **Analytics usage within earn feature**:
   - `EarnButton` imports from `@/services/analytics/events/earn`
   - `EarnInfo` imports from `@/services/analytics/events/earn`
   - Uses generic `<Track>` component from `@/components/common/Track`

3. **Analytics used outside earn feature**:
   - `SidebarNavigation` uses `EARN_EVENTS` and `EARN_LABELS`
   - `NewsCarousel/EarnBanner` uses `EARN_EVENTS` and `EARN_LABELS`
   - Global GA/Mixpanel mapping references `EARN_EVENTS`

### Decision: Analytics Remain in Global Service

**Rationale**:

- Analytics events are already properly separated in the global analytics service
- Multiple parts of the app (sidebar, banners, dashboard) track earn-related events
- Earn feature should remain a consumer of the global analytics service, not own its definitions
- This pattern follows the principle of "analytics as cross-cutting concern"

**No changes needed**:

- ✅ Keep analytics imports pointing to `@/services/analytics/events/earn`
- ✅ Do NOT create `services/tracking.ts` within the earn feature
- ✅ Do NOT move `EARN_EVENTS` or `EARN_LABELS` into the feature

---

## Research Task 4: Feature Flag Usage Patterns

**Goal**: Verify how the `useIsEarnFeatureEnabled` hook is used and ensure the pattern matches the reference implementation.

### Findings

**Current Implementation** (`hooks/useIsEarnFeatureEnabled.ts`):

```typescript
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useContext } from 'react'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'

const useIsEarnFeatureEnabled = () => {
  const isBlockedCountry = useContext(GeoblockingContext)
  return useHasFeature(FEATURES.EARN) && !isBlockedCountry
}

export default useIsEarnFeatureEnabled
```

**Reference Pattern** (`walletconnect/hooks/useIsWalletConnectEnabled.ts`):

```typescript
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsWalletConnectEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.NATIVE_WALLETCONNECT)
}
```

### Analysis: Pattern Differences

**Earn pattern**:

- Returns: `boolean` (never `undefined`)
- Checks: Both feature flag AND geoblocking
- Export: Default export

**WalletConnect pattern**:

- Returns: `boolean | undefined` (preserves loading state)
- Checks: Only feature flag
- Export: Named export

### Decision: Preserve Earn Pattern with Improvements

**Keep the geoblocking check** because:

- Earn feature specifically requires geoblocking (due to regulatory compliance with Kiln)
- This is intentional domain logic, not a deviation from the pattern
- Blocked address checks are also performed at the component level (in `index.tsx`)

**Improvements to make**:

1. ✅ Change from default export to named export: `export function useIsEarnFeatureEnabled`
2. ✅ Add explicit return type annotation: `boolean | undefined`
3. ⚠️ Consider returning `undefined` during loading state (currently returns `false` if feature flag is loading)

**Decision**: Change return type to `boolean | undefined` to match standard pattern:

```typescript
export function useIsEarnFeatureEnabled(): boolean | undefined {
  const isBlockedCountry = useContext(GeoblockingContext)
  const hasFeature = useHasFeature(FEATURES.EARN)

  // If feature flag is loading (undefined), return undefined
  if (hasFeature === undefined) return undefined

  // If feature is disabled or country is blocked, return false
  return hasFeature && !isBlockedCountry
}
```

### Alternatives Considered

**Alternative 1: Remove geoblocking from hook, keep only in component**

- ❌ Rejected: Geoblocking is domain logic that belongs in the feature's public API
- External code using this hook expects geoblocking to be checked

**Alternative 2: Create two separate hooks (one for flag, one for geoblocking)**

- ❌ Rejected: Overcomplicates the API for a single use case
- No external code needs the feature flag without geoblocking check

**Alternative 3: Keep current implementation without changes**

- ❌ Rejected: Doesn't preserve loading state (`undefined`), violates standard pattern
- Components need to know when the feature flag is loading vs. disabled

---

## Research Task 5: Test File Locations

**Goal**: Catalog all existing test files to ensure they are preserved during refactoring.

### Findings

**Test files search result**: 0 test files found in `apps/web/src/features/earn/`

**Explanation**: The earn feature currently has no unit tests. This is not ideal but is the current state.

### Implications

1. ✅ No test files need to be moved or updated during refactoring
2. ⚠️ Refactoring cannot break tests (because there are none)
3. ⚠️ Manual testing will be critical to validate functionality preservation
4. 📝 Future work: Add test coverage for earn feature (outside scope of this refactoring)

### Manual Testing Checklist

Since there are no automated tests, the following must be manually verified:

1. **Feature flag behavior**:
   - ✅ Feature renders when enabled
   - ✅ Feature renders nothing when disabled
   - ✅ Feature renders nothing during loading

2. **Consent flow**:
   - ✅ Disclaimer shows on first visit
   - ✅ Clicking "Continue" stores consent
   - ✅ Widget shows after consent
   - ✅ Consent persists across sessions

3. **Geoblocking**:
   - ✅ Blocked countries see appropriate message
   - ✅ Blocked addresses see appropriate message

4. **Asset selection**:
   - ✅ Clicking EarnButton navigates with correct `asset_id` query param
   - ✅ Widget pre-selects the asset
   - ✅ Direct navigation to `/earn` works (no asset selected)

5. **Widget integration**:
   - ✅ Kiln widget iframe loads correctly
   - ✅ Theme (light/dark) passes correctly
   - ✅ Test chains use testnet widget URL
   - ✅ Mainnet chains use production widget URL

---

## Additional Research: Barrel Export Best Practices

**Goal**: Determine the correct structure for barrel exports to avoid circular dependencies and follow the reference pattern.

### Reference Pattern Analysis

**From `walletconnect/index.ts`**:

```typescript
import dynamic from 'next/dynamic'

// 1. Re-export types
export type { WalletConnectContextType, WcChainSwitchRequest, WcAutoApproveProps } from './types'
export { WCLoadingState } from './types'

// 2. Re-export hooks
export { useIsWalletConnectEnabled } from './hooks'
export { useWcUri, useWalletConnectSearchParamUri, WC_URI_SEARCH_PARAM } from './hooks'

// 3. Re-export store
export { wcPopupStore, openWalletConnect, wcChainSwitchStore } from './store'

// 4. Re-export services
export { walletConnectInstance, isSafePassApp } from './services'

// 5. Re-export components (context)
export { WalletConnectContext, WalletConnectProvider } from './components/WalletConnectContext'

// 6. Re-export constants
export {
  SAFE_COMPATIBLE_METHODS,
  SAFE_COMPATIBLE_EVENTS,
  SAFE_WALLET_METADATA,
  EIP155,
  BlockedBridges,
  WarnedBridges,
  WarnedBridgeNames,
} from './constants'

// 7. Default export: lazy-loaded main component
const WalletConnectWidget = dynamic(
  () => import('./components/WalletConnectUi').then((mod) => ({ default: mod.default })),
  { ssr: false },
)

export default WalletConnectWidget
```

### Decision: Barrel Export Structure for Earn

**Apply the same pattern**:

```typescript
// apps/web/src/features/earn/index.ts
import dynamic from 'next/dynamic'

// 1. Re-export types
export type { EarnButtonProps } from './types'

// 2. Re-export hooks
export { useIsEarnFeatureEnabled } from './hooks'

// 3. Re-export components
export { EarnButton } from './components'

// 4. Default export: lazy-loaded main component
const EarnPage = dynamic(() => import('./components/EarnPage').then((mod) => ({ default: mod.default })), {
  ssr: false,
})

export default EarnPage
```

**Note**: The current `index.tsx` IS the main component. During refactoring, we need to:

1. Rename current `index.tsx` to `components/EarnPage/index.tsx` (or similar)
2. Create new `index.ts` as barrel file with above structure

---

## Summary of Key Decisions

| Decision Area               | Choice                                                | Rationale                                        |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| **Public API Components**   | `EarnButton` only                                     | Only component used outside feature              |
| **Public API Hooks**        | `useIsEarnFeatureEnabled` only                        | Only hook used outside feature                   |
| **Public API Types**        | `EarnButtonProps` only                                | Only type needed by external consumers           |
| **Analytics**               | Keep in global service                                | Already properly separated, used outside feature |
| **Feature Flag Hook**       | Add `undefined` return type                           | Preserve loading state per standard pattern      |
| **utils.ts Location**       | Move to `services/utils.ts`                           | Align with standard structure                    |
| **Type Extraction**         | Extract `EarnButtonProps`, keep simple types inline   | Balance between DRY and readability              |
| **Barrel Export Pattern**   | Follow walletconnect pattern exactly                  | Proven, compliant reference implementation       |
| **Main Component Location** | Rename `index.tsx` to `components/EarnPage/index.tsx` | Separate concerns (component vs. barrel)         |
| **Testing Strategy**        | Manual testing checklist                              | No automated tests exist currently               |

---

## Resolved NEEDS CLARIFICATION Items

All unknowns from the Technical Context have been resolved:

1. ✅ External dependencies mapped (2 component imports, 1 hook import)
2. ✅ Public API surface defined (3 exports: default component, EarnButton, useIsEarnFeatureEnabled)
3. ✅ Type extraction strategy determined (extract EarnButtonProps only)
4. ✅ Analytics tracking pattern confirmed (keep in global service)
5. ✅ Feature flag pattern validated (add undefined return type)
6. ✅ Test strategy defined (manual testing checklist)
7. ✅ Barrel export structure determined (follow walletconnect pattern)

**Status**: ✅ Ready for Phase 1 (Design & Contracts)
