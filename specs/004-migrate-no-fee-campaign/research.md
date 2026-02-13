# Research: Migrate No Fee Campaign to Feature Architecture

**Date**: 2025-01-27  
**Feature**: 004-migrate-no-fee-campaign  
**Phase**: 0 - Outline & Research

## Research Tasks

### Task 1: Feature Architecture Migration Patterns

**Question**: How do other migrated features structure their contracts and implementations?

**Findings**:

- **Reference Features**: counterfactual, hypernative, tx-notes, portfolio
- **Contract Pattern**: Flat structure with `typeof` imports for IDE navigation
  ```typescript
  import type MyComponent from './components/MyComponent'
  export interface MyContract {
    MyComponent: typeof MyComponent
  }
  ```
- **Feature Implementation**: Direct imports, no nested lazy loading
  ```typescript
  import MyComponent from './components/MyComponent'
  export default { MyComponent }
  ```
- **Hook Exports**: Direct exports from `index.ts`, never in contract or feature.ts
- **Feature Handle**: Use `createFeatureHandle()` factory with semantic mapping

**Decision**: Follow exact same pattern as reference features  
**Rationale**: Consistency with existing codebase, proven approach  
**Alternatives Considered**: None - architecture is well-established

### Task 2: Semantic Mapping Verification

**Question**: Does the feature flag mapping already exist for `no-fee-campaign`?

**Findings**:

- **Location**: `apps/web/src/features/__core__/createFeatureHandle.ts`
- **Mapping Found**: `'no-fee-campaign': FEATURES.NO_FEE_NOVEMBER` (line 13)
- **Status**: ✅ Already exists, no changes needed

**Decision**: Use `createFeatureHandle('no-fee-campaign')` without second parameter  
**Rationale**: Mapping already configured, follows convention  
**Alternatives Considered**: Explicit parameter - rejected (unnecessary, breaks convention)

### Task 3: Consumer Code Migration Pattern

**Question**: How should consumer code be updated to use `useLoadFeature()`?

**Findings**:

- **Pattern**: Import feature handle, use `useLoadFeature()` hook
- **Components**: Access via `feature.ComponentName` (proxy stubs render null when not ready)
- **Hooks**: Import directly from feature index (always loaded)
- **Example**:

  ```typescript
  import { NoFeeCampaignFeature, useNoFeeCampaignEligibility } from '@/features/no-fee-campaign'
  import { useLoadFeature } from '@/features/__core__'

  const feature = useLoadFeature(NoFeeCampaignFeature)
  const eligibility = useNoFeeCampaignEligibility() // Direct import

  return <feature.NoFeeCampaignBanner />
  ```

**Decision**: Update all consumers to use `useLoadFeature()` pattern  
**Rationale**: Enables lazy loading, maintains type safety, follows architecture  
**Alternatives Considered**: Gradual migration - rejected (all-or-nothing for consistency)

### Task 4: Hook Organization

**Question**: Should all hooks be exported directly from index.ts?

**Findings**:

- **Architecture Rule**: Hooks must be exported directly to avoid Rules of Hooks violations
- **Current Hooks**:
  - `useIsNoFeeCampaignEnabled` - lightweight, used externally
  - `useNoFeeCampaignEligibility` - used externally, has internal dependencies
  - `useGasTooHigh` - used externally, lightweight
- **All hooks are used by external consumers** (dashboard, ExecuteForm, ExecutionMethodSelector, etc.)

**Decision**: Export all three hooks directly from `index.ts`  
**Rationale**: All are used externally, lightweight enough to always load, avoids Rules of Hooks violations  
**Alternatives Considered**:

- Lazy-load hooks - rejected (violates Rules of Hooks)
- Keep only eligibility hook - rejected (breaks existing consumers)

### Task 5: Component Contract Definition

**Question**: Which components should be in the contract?

**Findings**:

- **Components**:
  - `NoFeeCampaignBanner` - used in dashboard, balances page
  - `NoFeeCampaignTransactionCard` - used in TokenTransfer flow
  - `GasTooHighBanner` - used in ExecutionMethodSelector
- **All components are used by external consumers**
- **Architecture Pattern**: All externally-used components go in contract

**Decision**: Include all three components in contract  
**Rationale**: All are used externally, must be accessible via `useLoadFeature()`  
**Alternatives Considered**: None - clear requirement

### Task 6: Constants Handling

**Question**: How should constants be handled in the feature architecture?

**Findings**:

- **Current Constant**: `MAX_GAS_LIMIT_NO_FEE_CAMPAIGN` in `constants.ts`
- **Usage**: Only used internally by `useGasTooHigh` hook
- **Pattern**: Internal constants stay in `constants.ts`, not exported from index
- **No external consumers** of the constant

**Decision**: Keep constant in `constants.ts`, do not export from index  
**Rationale**: Internal-only constant, no need to expose in public API  
**Alternatives Considered**: Export constant - rejected (not needed externally)

### Task 7: Error Handling and Edge Cases

**Question**: How does the architecture handle errors and edge cases?

**Findings**:

- **Error Handling**: `useLoadFeature` exposes `$error` meta property
- **Loading States**: `$isDisabled`, `$isReady` meta properties
- **Feature Flag Toggling**: React reactivity handles changes automatically
- **Chain Switching**: `useHasFeature` reacts to chain changes, feature reloads
- **Business Logic**: Eligibility, gas limits, blocked addresses - all unchanged

**Decision**: Rely on architecture's built-in error handling, maintain existing business logic  
**Rationale**: Architecture provides reactive handling, business logic must remain unchanged per FR-010, FR-011  
**Alternatives Considered**: Custom error handling - rejected (architecture handles it)

## Summary

All research tasks completed. No unknowns remain. The migration follows established patterns from reference features (counterfactual, hypernative, tx-notes). The semantic mapping already exists, all hooks should be exported directly, all components go in the contract, and consumer code follows the standard `useLoadFeature()` pattern.

**Key Decisions**:

1. Use `createFeatureHandle('no-fee-campaign')` with existing semantic mapping
2. Export all three hooks directly from `index.ts`
3. Include all three components in contract
4. Keep constants internal
5. Update all consumers to `useLoadFeature()` pattern
6. Maintain all existing business logic unchanged

**No blocking issues identified. Ready for Phase 1 design.**
