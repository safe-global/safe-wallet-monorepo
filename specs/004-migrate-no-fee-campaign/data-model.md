# Data Model: Migrate No Fee Campaign to Feature Architecture

**Date**: 2025-01-27  
**Feature**: 004-migrate-no-fee-campaign  
**Phase**: 1 - Design & Contracts

## Entities

### No Fee Campaign Feature Handle

**Type**: Runtime object (FeatureHandle)  
**Purpose**: Entry point for lazy loading the feature

**Properties**:

- `name: string` - Feature identifier: `'no-fee-campaign'`
- `useIsEnabled: () => boolean | undefined` - Feature flag check hook
- `load: () => Promise<{ default: NoFeeCampaignContract }>` - Lazy loader function

**Relationships**:

- Created by: `createFeatureHandle('no-fee-campaign')`
- Used by: `useLoadFeature()` hook
- Maps to: `FEATURES.NO_FEE_NOVEMBER` via semantic mapping

**State Transitions**:

- Initial: Handle created (static, ~100 bytes)
- Enabled: `useIsEnabled()` returns `true` → triggers `load()`
- Disabled: `useIsEnabled()` returns `false` → no loading
- Loading: `useIsEnabled()` returns `undefined` → waiting for flag resolution

### No Fee Campaign Contract

**Type**: TypeScript interface  
**Purpose**: Defines public API surface (components only, no hooks)

**Properties** (flat structure):

- `NoFeeCampaignBanner: typeof NoFeeCampaignBanner` - Dashboard banner component
- `NoFeeCampaignTransactionCard: typeof NoFeeCampaignTransactionCard` - Transaction card component
- `GasTooHighBanner: typeof GasTooHighBanner` - Gas limit warning banner

**Relationships**:

- Implemented by: `feature.ts` (lazy-loaded)
- Referenced by: `contract.ts` (type definition)
- Used by: TypeScript type inference for `useLoadFeature()`

**Validation Rules**:

- All properties must be components (PascalCase naming)
- No hooks in contract (exported separately from index.ts)
- No services in contract (none exist for this feature)
- Must use `typeof` pattern for IDE navigation

### No Fee Campaign Eligibility

**Type**: Hook return value  
**Purpose**: Represents eligibility state for sponsored transactions

**Properties**:

- `isEligible: boolean | undefined` - Whether Safe is eligible
- `remaining: number | undefined` - Remaining sponsored transactions
- `limit: number | undefined` - Total limit for sponsored transactions
- `isLoading: boolean` - Loading state for eligibility data
- `error: Error | undefined` - Error if eligibility check failed
- `blockedAddress?: string` - Blocked address if detected

**Relationships**:

- Provided by: `useNoFeeCampaignEligibility()` hook
- Used by: Components (NoFeeCampaignTransactionCard, ExecuteForm, ExecutionMethodSelector)
- Depends on: Backend API (`useRelayGetRelaysRemainingV1Query`)

**State Transitions**:

- Initial: `isLoading: true`, `isEligible: undefined`
- Loading: `isLoading: true`, data fetching
- Eligible: `isEligible: true`, `remaining > 0`, `limit > 0`
- Not Eligible: `isEligible: false` (no limit or limit reached)
- Blocked: `isEligible: false`, `blockedAddress` set
- Error: `error` set, `isEligible: false`

**Validation Rules**:

- `isEligible` requires: feature enabled AND `limit > 0` AND not blocked
- `remaining` must be `<= limit` when both are defined
- `blockedAddress` takes precedence over eligibility check

### Gas Limit Check

**Type**: Hook return value  
**Purpose**: Determines if transaction gas exceeds campaign limit

**Properties**:

- `gasTooHigh: boolean | undefined` - Whether gas limit exceeds `MAX_GAS_LIMIT_NO_FEE_CAMPAIGN`

**Relationships**:

- Provided by: `useGasTooHigh(safeTx)` hook
- Used by: ExecuteForm, ExecutionMethodSelector
- Depends on: `MAX_GAS_LIMIT_NO_FEE_CAMPAIGN` constant (1,000,000 gas)

**Validation Rules**:

- `gasTooHigh: true` when `gasLimit > MAX_GAS_LIMIT_NO_FEE_CAMPAIGN`
- `gasTooHigh: undefined` when `gasLimit` is not available
- `gasTooHigh: false` when `gasLimit <= MAX_GAS_LIMIT_NO_FEE_CAMPAIGN`

## Feature Meta Properties

**Type**: Properties added by `useLoadFeature()`  
**Purpose**: State information about feature loading

**Properties** (prefixed with `$`):

- `$isDisabled: boolean` - Feature flag is disabled for current chain
- `$isReady: boolean` - Feature is loaded and enabled
- `$error: Error | undefined` - Error if loading failed

**State Transitions**:

- Initial: `$isDisabled: false`, `$isReady: false`
- Ready: `$isDisabled: false`, `$isReady: true`
- Disabled: `$isDisabled: true`, `$isReady: false`
- Error: `$error` set, `$isReady: false`

## Relationships Summary

```
NoFeeCampaignFeatureHandle
  ├── uses → createFeatureHandle('no-fee-campaign')
  ├── maps to → FEATURES.NO_FEE_NOVEMBER (semantic mapping)
  └── loads → NoFeeCampaignContract

NoFeeCampaignContract
  ├── defines → NoFeeCampaignBanner
  ├── defines → NoFeeCampaignTransactionCard
  └── defines → GasTooHighBanner

Hooks (exported from index.ts, not in contract)
  ├── useIsNoFeeCampaignEnabled() → boolean | undefined
  ├── useNoFeeCampaignEligibility() → Eligibility object
  └── useGasTooHigh(safeTx) → boolean | undefined

Eligibility
  ├── depends on → Backend API (useRelayGetRelaysRemainingV1Query)
  ├── depends on → useBlockedAddress()
  └── depends on → useIsNoFeeCampaignEnabled()

Gas Limit Check
  └── depends on → MAX_GAS_LIMIT_NO_FEE_CAMPAIGN constant
```

## Migration Impact

**No data model changes** - This is a pure refactoring task. All entities remain the same, only their organization and access patterns change:

- **Before**: Direct imports from feature folders
- **After**: Access via `useLoadFeature()` and direct hook imports

**Data flow unchanged**:

- Eligibility data still comes from same backend API
- Gas limit checks still use same constant
- Blocked address detection still uses same logic
- All state transitions remain identical
