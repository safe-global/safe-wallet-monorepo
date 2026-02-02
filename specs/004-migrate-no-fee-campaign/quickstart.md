# Quickstart: Migrate No Fee Campaign to Feature Architecture

**Date**: 2025-01-27  
**Feature**: 004-migrate-no-fee-campaign

## Overview

This guide provides step-by-step instructions for migrating the No Fee Campaign feature to the new Feature Architecture pattern. The migration maintains 100% functional parity while enabling lazy loading and proper code-splitting.

## Prerequisites

- Feature architecture infrastructure (`@/features/__core__`) available
- `createFeatureHandle` helper function working
- ESLint restricted import rules configured
- Feature flag `FEATURES.NO_FEE_NOVEMBER` exists
- Semantic mapping `'no-fee-campaign': FEATURES.NO_FEE_NOVEMBER` exists in `createFeatureHandle.ts`

## Migration Steps

### Step 1: Create Feature Contract

Create `apps/web/src/features/no-fee-campaign/contract.ts`:

```typescript
import type NoFeeCampaignBanner from './components/NoFeeCampaignBanner'
import type NoFeeCampaignTransactionCard from './components/NoFeeCampaignTransactionCard'
import type GasTooHighBanner from './components/GasTooHighBanner'

export interface NoFeeCampaignContract {
  NoFeeCampaignBanner: typeof NoFeeCampaignBanner
  NoFeeCampaignTransactionCard: typeof NoFeeCampaignTransactionCard
  GasTooHighBanner: typeof GasTooHighBanner
}
```

### Step 2: Create Feature Implementation

Create `apps/web/src/features/no-fee-campaign/feature.ts`:

```typescript
import type { NoFeeCampaignContract } from './contract'

// Direct imports - this file is already lazy-loaded
import NoFeeCampaignBanner from './components/NoFeeCampaignBanner'
import NoFeeCampaignTransactionCard from './components/NoFeeCampaignTransactionCard'
import GasTooHighBanner from './components/GasTooHighBanner'

// Flat structure - naming conventions determine stub behavior
export default {
  NoFeeCampaignBanner,
  NoFeeCampaignTransactionCard,
  GasTooHighBanner,
} satisfies NoFeeCampaignContract
```

### Step 3: Create Public API

Update `apps/web/src/features/no-fee-campaign/index.ts`:

```typescript
import { createFeatureHandle } from '@/features/__core__'
import type { NoFeeCampaignContract } from './contract'

// Feature handle - uses semantic mapping (no-fee-campaign → FEATURES.NO_FEE_NOVEMBER)
export const NoFeeCampaignFeature = createFeatureHandle<NoFeeCampaignContract>('no-fee-campaign')

// Export contract type
export type { NoFeeCampaignContract } from './contract'

// Export hooks directly (always loaded, not in contract)
export { useIsNoFeeCampaignEnabled } from './hooks/useIsNoFeeCampaignEnabled'
export { useNoFeeCampaignEligibility } from './hooks/useNoFeeCampaignEligibility'
export { useGasTooHigh } from './hooks/useGasTooHigh'
```

### Step 4: Update Consumer Code

Update all consumers to use `useLoadFeature()` pattern:

**Before (direct import - VIOLATION):**:

```typescript
import NoFeeCampaignBanner from '@/features/no-fee-campaign/components/NoFeeCampaignBanner'
import { useNoFeeCampaignEligibility } from '@/features/no-fee-campaign/hooks/useNoFeeCampaignEligibility'
```

**After**:

```typescript
import { NoFeeCampaignFeature, useNoFeeCampaignEligibility } from '@/features/no-fee-campaign'
import { useLoadFeature } from '@/features/__core__'

function MyComponent() {
  // Prefer destructuring for cleaner component usage
  const { NoFeeCampaignBanner } = useLoadFeature(NoFeeCampaignFeature)
  const eligibility = useNoFeeCampaignEligibility()

  return <NoFeeCampaignBanner />
}
```

**Consumer locations to update**:

1. `apps/web/src/components/dashboard/index.tsx`
2. `apps/web/src/components/tx-flow/actions/Execute/ExecuteForm.tsx`
3. `apps/web/src/components/tx/ExecutionMethodSelector/index.tsx`
4. `apps/web/src/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer.tsx`
5. `apps/web/src/pages/balances/index.tsx`

### Step 5: Verify Migration

Run quality gates:

```bash
# Type check
yarn workspace @safe-global/web type-check

# Lint (should show no restricted import warnings)
yarn workspace @safe-global/web lint

# Format
yarn workspace @safe-global/web prettier

# Tests (all should pass)
yarn workspace @safe-global/web test
```

### Step 6: Verify Bundle Splitting

Build and verify code-splitting:

```bash
yarn workspace @safe-global/web build

# Check that No Fee Campaign code is in separate chunk
ls -la apps/web/.next/static/chunks/ | grep -i no-fee
```

## Key Patterns

### Component Usage

```typescript
// Prefer destructuring for cleaner component usage
// Components render null when not ready (no check needed)
const { NoFeeCampaignBanner } = useLoadFeature(NoFeeCampaignFeature)
return <NoFeeCampaignBanner onDismiss={handleDismiss} />
```

### Hook Usage

```typescript
// Hooks imported directly, always safe to call
import { useNoFeeCampaignEligibility } from '@/features/no-fee-campaign'

const { isEligible, remaining, limit } = useNoFeeCampaignEligibility()
```

### Explicit State Handling

```typescript
const noFeeFeature = useLoadFeature(NoFeeCampaignFeature)

if (noFeeFeature.$isLoading) return <Skeleton />
if (noFeeFeature.$isDisabled) return null

// Destructure after state checks
const { NoFeeCampaignBanner } = noFeeFeature
return <NoFeeCampaignBanner />
```

## Common Pitfalls

1. **Don't use lazy() in feature.ts** - The entire feature is already lazy-loaded
2. **Don't include hooks in contract** - Export them directly from index.ts
3. **Don't nest structure** - Use flat structure in contract and feature.ts
4. **Don't import from internal folders** - Use feature handle and direct hook imports
5. **Don't change business logic** - Maintain 100% functional parity

## Verification Checklist

- [ ] `contract.ts` created with flat structure
- [ ] `feature.ts` created with direct imports
- [ ] `index.ts` exports feature handle and hooks
- [ ] All consumers updated to use `useLoadFeature()`
- [ ] Type check passes
- [ ] Lint passes (no restricted import warnings)
- [ ] Tests pass
- [ ] Bundle analysis shows code-splitting
- [ ] Feature works identically to before migration

## Next Steps

After migration:

1. Verify all acceptance scenarios from spec
2. Run bundle analysis to confirm code-splitting
3. Test on chains with feature enabled and disabled
4. Update Storybook stories if needed
5. Document any edge cases discovered
