# Quickstart: Hypernative v3 Migration

**Feature**: 001-migrate-hypernative-v3  
**Date**: 2026-01-28

## Prerequisites

- Node.js 18+
- Yarn 4
- Understanding of the [Feature Architecture Standard](../../../apps/web/docs/feature-architecture.md)

## Phase 1: Create Infrastructure Files

### Step 1.1: Create contract.ts

```bash
# Create the contract file
touch apps/web/src/features/hypernative/contract.ts
```

```typescript
// apps/web/src/features/hypernative/contract.ts
import type HnBanner from './components/HnBanner'
import type HnDashboardBanner from './components/HnDashboardBanner'
import type HnMiniTxBanner from './components/HnMiniTxBanner'
import type HnPendingBanner from './components/HnPendingBanner'
import type HnQueueAssessmentBanner from './components/HnQueueAssessmentBanner'
import type HnActivatedSettingsBanner from './components/HnActivatedSettingsBanner'
import type HnSecurityReportBtn from './components/HnSecurityReportBtn/HnSecurityReportBtn'
import type HnLoginCard from './components/HnLoginCard'
import type HypernativeLogo from './components/HypernativeLogo'
import type { isHypernativeGuard } from './services/hypernativeGuardCheck'

export interface HypernativeContract {
  // Components
  HnBanner: typeof HnBanner
  HnDashboardBanner: typeof HnDashboardBanner
  HnMiniTxBanner: typeof HnMiniTxBanner
  HnPendingBanner: typeof HnPendingBanner
  HnQueueAssessmentBanner: typeof HnQueueAssessmentBanner
  HnActivatedSettingsBanner: typeof HnActivatedSettingsBanner
  HnSecurityReportBtn: typeof HnSecurityReportBtn
  HnLoginCard: typeof HnLoginCard
  HypernativeLogo: typeof HypernativeLogo

  // Services
  isHypernativeGuard: typeof isHypernativeGuard
}
```

### Step 1.2: Create feature.ts

```bash
touch apps/web/src/features/hypernative/feature.ts
```

```typescript
// apps/web/src/features/hypernative/feature.ts
import type { HypernativeContract } from './contract'

// Direct imports - this file IS the lazy-loaded chunk
import HnBanner from './components/HnBanner'
import HnDashboardBanner from './components/HnDashboardBanner'
import HnMiniTxBanner from './components/HnMiniTxBanner'
import HnPendingBanner from './components/HnPendingBanner'
import HnQueueAssessmentBanner from './components/HnQueueAssessmentBanner'
import HnActivatedSettingsBanner from './components/HnActivatedSettingsBanner'
import HnSecurityReportBtn from './components/HnSecurityReportBtn/HnSecurityReportBtn'
import HnLoginCard from './components/HnLoginCard'
import HypernativeLogo from './components/HypernativeLogo'
import { isHypernativeGuard } from './services/hypernativeGuardCheck'

// Flat structure - naming determines stub behavior
const feature: HypernativeContract = {
  HnBanner,
  HnDashboardBanner,
  HnMiniTxBanner,
  HnPendingBanner,
  HnQueueAssessmentBanner,
  HnActivatedSettingsBanner,
  HnSecurityReportBtn,
  HnLoginCard,
  HypernativeLogo,
  isHypernativeGuard,
}

export default feature satisfies HypernativeContract
```

### Step 1.3: Update index.ts

Replace the existing `index.ts` with the v3 public API:

```typescript
// apps/web/src/features/hypernative/index.ts
/**
 * Hypernative Feature - Public API
 *
 * Provides Hypernative security scanning, OAuth authentication,
 * and guard detection for Safe wallets.
 */
import { createFeatureHandle } from '@/features/__core__'
import type { HypernativeContract } from './contract'

// Feature handle (uses FEATURES.HYPERNATIVE via auto-derivation)
export const HypernativeFeature = createFeatureHandle<HypernativeContract>('hypernative')

// Contract type
export type { HypernativeContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

export { useIsHypernativeEligible } from './hooks/useIsHypernativeEligible'
export type { HypernativeEligibility } from './hooks/useIsHypernativeEligible'

export { useHypernativeOAuth, savePkce, readPkce, clearPkce } from './hooks/useHypernativeOAuth'
export type { HypernativeAuthStatus, PkceData } from './hooks/useHypernativeOAuth'

export { useIsHypernativeGuard } from './hooks/useIsHypernativeGuard'
export type { HypernativeGuardCheckResult } from './hooks/useIsHypernativeGuard'

export { useIsHypernativeFeature as useIsHypernativeFeatureEnabled } from './hooks/useIsHypernativeFeature'
export { useIsHypernativeQueueScanFeature } from './hooks/useIsHypernativeQueueScanFeature'
export { useHnAssessmentSeverity } from './hooks/useHnAssessmentSeverity'

// Public types
export type { BannerVisibilityResult } from './hooks/useBannerVisibility'
export { BannerType } from './hooks/useBannerStorage'
export { MIN_BALANCE_USD } from './hooks/useBannerVisibility'

// ─────────────────────────────────────────────────────────────────
// STORE (direct imports, not lazy)
// ─────────────────────────────────────────────────────────────────

export * from './store'

// Constants
export { HYPERNATIVE_OUTREACH_ID, HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from './constants'
```

### Step 1.4: Add Feature Flag Mapping

Update `createFeatureHandle.ts` to include the hypernative mapping:

```typescript
// apps/web/src/features/__core__/createFeatureHandle.ts
const FEATURE_FLAG_MAPPING: Record<string, FEATURES> = {
  walletconnect: FEATURES.NATIVE_WALLETCONNECT,
  stake: FEATURES.STAKING,
  swap: FEATURES.NATIVE_SWAPS,
  // ... existing mappings
  hypernative: FEATURES.HYPERNATIVE, // ADD THIS LINE
}
```

### Step 1.5: Verify Infrastructure

```bash
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
```

---

## Phase 2: Migrate Consumers

### Migration Pattern

**Before (direct import - VIOLATION):**

```typescript
import { HnBanner } from '@/features/hypernative/components/HnBanner'
import { useBannerVisibility } from '@/features/hypernative/hooks'

function Dashboard() {
  const { showBanner } = useBannerVisibility(BannerType.Promo)
  return showBanner ? <HnBanner /> : null
}
```

**After (v3 architecture):**

```typescript
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

function Dashboard() {
  const hn = useLoadFeature(HypernativeFeature)

  // Component renders null when not ready - no manual check needed
  return <hn.HnBanner />
}
```

### Hook Migration (No Change Needed)

Hooks are already exported directly, so most hook imports don't need changes:

```typescript
// This import pattern is CORRECT (direct hook export)
import { useIsHypernativeEligible, useHypernativeOAuth } from '@/features/hypernative'

function SafeShieldWidget() {
  const { isHypernativeEligible } = useIsHypernativeEligible()
  const auth = useHypernativeOAuth()
  // ... use normally
}
```

### Priority Order

1. **P1: Safe-Shield Integration** (11 files)
   - `features/safe-shield/index.tsx`
   - `features/safe-shield/SafeShieldContext.tsx`
   - `features/safe-shield/hooks/*`
   - `features/safe-shield/components/*`

2. **P1: OAuth Callback**
   - `pages/hypernative/oauth-callback.tsx`

3. **P2: Transaction Pages** (5 files)
   - `pages/transactions/queue.tsx`
   - `pages/transactions/history.tsx`
   - `components/transactions/TxSummary/index.tsx`
   - `components/transactions/TxDetails/index.tsx`
   - `components/tx-flow/flows/NewTx/index.tsx`

4. **P2: Dashboard & Settings** (3 files)
   - `components/dashboard/index.tsx`
   - `components/dashboard/FirstSteps/index.tsx`
   - `components/settings/SecurityLogin/index.tsx`

5. **P3: Miscellaneous** (3 files)
   - `components/sidebar/SidebarHeader/SafeHeaderInfo.tsx`
   - `components/common/EthHashInfo/SrcEthHashInfo/index.tsx`
   - `store/slices.ts` (no change needed - direct store import)

---

## Phase 3: Update Tests

### Mock Pattern

**Before:**

```typescript
jest.mock('@/features/hypernative/hooks/useIsHypernativeEligible', () => ({
  useIsHypernativeEligible: () => ({ isHypernativeEligible: true, loading: false }),
}))
```

**After:**

```typescript
jest.mock('@/features/hypernative', () => ({
  HypernativeFeature: {
    name: 'hypernative',
    useIsEnabled: () => true,
    load: () => Promise.resolve({
      default: {
        HnBanner: () => <div data-testid="hn-banner">Mock Banner</div>,
        HypernativeLogo: () => <div>Mock Logo</div>,
        isHypernativeGuard: jest.fn(),
      },
    }),
  },
  // Hooks still exported directly (no change)
  useIsHypernativeEligible: () => ({ isHypernativeEligible: true, loading: false }),
  useHypernativeOAuth: () => ({
    isAuthenticated: false,
    initiateLogin: jest.fn(),
    logout: jest.fn(),
  }),
}))
```

---

## Phase 4: Verify

### Run Quality Gates

```bash
# Type check
yarn workspace @safe-global/web type-check

# Lint (check for import violations)
yarn workspace @safe-global/web lint

# Prettier
yarn workspace @safe-global/web prettier

# Tests
yarn workspace @safe-global/web test
```

### Verify Bundle

```bash
# Build
yarn workspace @safe-global/web build

# Check for hypernative chunk
ls -la apps/web/.next/static/chunks/ | grep -i hypernative
```

### ESLint Upgrade (After Migration Complete)

Once all consumers are migrated, upgrade ESLint rule to 'error':

```javascript
// eslint.config.mjs
'no-restricted-imports': [
  'error', // Changed from 'warn'
  // ... patterns
]
```

---

## Troubleshooting

### "Cannot find module" Errors

Ensure the contract imports match the actual component export paths:

```typescript
// If component has nested export:
import type HnSecurityReportBtn from './components/HnSecurityReportBtn/HnSecurityReportBtn'

// If component has index.ts:
import type HnBanner from './components/HnBanner'
```

### Type Errors in feature.ts

Ensure all imports in `feature.ts` match the contract interface exactly:

```typescript
// contract.ts says:
HnBanner: typeof HnBanner

// feature.ts must have:
import HnBanner from './components/HnBanner' // Default export
```

### Consumer Still Shows ESLint Warning

After migration, if a consumer still shows warnings, check:

1. Import path is `@/features/hypernative` (not internal path)
2. Using `useLoadFeature(HypernativeFeature)` for components
3. Using direct import for hooks

### Tests Failing After Mock Update

Ensure test mocks include all used components/hooks:

```typescript
// If test uses HnBanner and useIsHypernativeEligible:
jest.mock('@/features/hypernative', () => ({
  HypernativeFeature: {
    name: 'hypernative',
    useIsEnabled: () => true,
    load: () =>
      Promise.resolve({
        default: { HnBanner: () => null },
      }),
  },
  useIsHypernativeEligible: () => ({ isHypernativeEligible: true, loading: false }),
}))
```
