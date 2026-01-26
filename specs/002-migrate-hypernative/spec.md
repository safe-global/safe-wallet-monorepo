# Feature Specification: Migrate Hypernative Feature to Architecture v2

**Feature Branch**: `002-migrate-hypernative`
**Created**: 2026-01-26
**Status**: Draft
**Input**: User description: "Migrate hypernative feature to feature-architecture-v2 pattern"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Lazy Loading Hypernative Feature (Priority: P1)

When a developer consumes the hypernative feature from outside the feature folder, they should be able to access all hypernative functionality through the `useLoadFeature()` hook with the feature handle pattern, ensuring the feature code is only loaded when enabled.

**Why this priority**: This is the core benefit of the architecture migration - enabling lazy loading to improve bundle size and initial load performance for users who don't have the hypernative feature enabled.

**Independent Test**: Can be tested by importing `HypernativeFeature` from `@/features/hypernative` and verifying that components, hooks, and services are accessible through `useLoadFeature()`.

**Acceptance Scenarios**:

1. **Given** a developer imports from `@/features/hypernative`, **When** they import the feature handle, **Then** they receive a `HypernativeFeature` export that can be passed to `useLoadFeature()`
2. **Given** a component uses `useLoadFeature(HypernativeFeature)`, **When** the feature flag is enabled, **Then** the feature code loads lazily and components/hooks/services become accessible
3. **Given** a component uses `useLoadFeature(HypernativeFeature)`, **When** the feature flag is disabled, **Then** `null` is returned and no feature code is bundled
4. **Given** a component uses `useLoadFeature(HypernativeFeature)`, **When** the feature is still loading, **Then** `undefined` is returned allowing for loading states

---

### User Story 2 - Type-Safe Feature Contract (Priority: P1)

Developers consuming the hypernative feature should have full TypeScript type inference for all exposed components, hooks, and services without needing to import internal types.

**Why this priority**: Type safety is essential for maintaining code quality and preventing runtime errors during and after migration.

**Independent Test**: Can be tested by using `useLoadFeature(HypernativeFeature)` and verifying TypeScript autocomplete works for all exposed members.

**Acceptance Scenarios**:

1. **Given** a developer accesses `feature.components`, **When** they type a component name, **Then** TypeScript provides autocomplete and type checking for all exposed components
2. **Given** a developer accesses `feature.hooks`, **When** they type a hook name, **Then** TypeScript provides autocomplete and correct parameter/return types
3. **Given** a developer uses `typeof` pattern in the contract, **When** they Cmd+click on a contract type, **Then** IDE navigates directly to the implementation file

---

### User Story 3 - Update Consumer Code to Use Feature Handles (Priority: P2)

All existing code that directly imports from hypernative internal folders must be updated to use the `useLoadFeature()` pattern.

**Why this priority**: Updating consumers ensures the lazy loading benefits are realized and prevents ESLint violations once enforcement is enabled.

**Independent Test**: Can be tested by running ESLint with no-restricted-imports warnings for hypernative internal folder imports.

**Acceptance Scenarios**:

1. **Given** a component previously imported from `@/features/hypernative/components/*`, **When** the migration is complete, **Then** it imports `HypernativeFeature` and accesses components via `useLoadFeature()`
2. **Given** a component previously imported from `@/features/hypernative/hooks/*`, **When** the migration is complete, **Then** it accesses hooks via the feature handle
3. **Given** no external code imports from internal hypernative folders, **When** ESLint runs, **Then** no warnings about restricted imports are produced

---

### User Story 4 - Maintain Redux Store Integration (Priority: P2)

The hypernative Redux slice (`hnStateSlice`) should continue to work correctly with the global Redux store after migration.

**Why this priority**: State management is critical for banner dismissals, form completion tracking, and other persistent state.

**Independent Test**: Can be tested by verifying Redux actions dispatch correctly and selectors return expected state.

**Acceptance Scenarios**:

1. **Given** the hypernative feature uses Redux for state, **When** the store barrel export is accessed, **Then** the slice, selectors, and actions are importable from `@/features/hypernative/store`
2. **Given** a consumer needs to read hypernative state, **When** they use `selectSafeHnState`, **Then** the selector returns the correct state shape

---

### User Story 5 - All Existing Tests Pass (Priority: P3)

All existing unit tests for the hypernative feature should continue to pass after migration.

**Why this priority**: Ensures no regressions are introduced during the architecture migration.

**Independent Test**: Can be tested by running `yarn workspace @safe-global/web test -- --testPathPattern="hypernative"`.

**Acceptance Scenarios**:

1. **Given** all existing hypernative tests, **When** the test suite runs after migration, **Then** all tests pass without modification (or with minimal mocking updates for the new pattern)

---

### Edge Cases

- What happens when a consumer tries to import directly from internal folders? ESLint should warn (and eventually error) about restricted imports.
- How does the feature handle OAuth callback page that exists at `/hypernative/oauth-callback`? The page should continue to work, accessing the feature via the handle pattern.
- What happens to components that are consumed by the `safe-shield` feature? They should access hypernative through `useLoadFeature(HypernativeFeature)`.
- How should the existing HOCs (`withHnFeature`, `withHnBannerConditions`, `withHnSignupFlow`) be exposed? They should be accessible via the feature handle or refactored if needed.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a `HypernativeFeature` handle export from `@/features/hypernative/index.ts` that includes `name`, `useIsEnabled()`, and `load()` function
- **FR-002**: System MUST provide a `HypernativeContract` type in `@/features/hypernative/contract.ts` defining all public components, hooks, and services
- **FR-003**: System MUST export a `feature.ts` file with lazy-loaded components and direct hook/service references
- **FR-004**: System MUST use `createFeatureHandle()` factory for handle creation to reduce boilerplate
- **FR-005**: System MUST maintain backward compatibility with the existing Redux store integration (`hnStateSlice`)
- **FR-006**: System MUST allow store imports from `@/features/hypernative/store` for Redux integration
- **FR-007**: System MUST expose public types via `@/features/hypernative/types.ts` (if needed)
- **FR-008**: All external consumers MUST be updated to use `useLoadFeature(HypernativeFeature)` pattern
- **FR-009**: The feature MUST use `FEATURES.HYPERNATIVE` as the feature flag check in `useIsEnabled()`
- **FR-010**: System MUST maintain existing Storybook stories and tests with minimal changes

### Key Entities

- **HypernativeFeature**: The feature handle object containing name, useIsEnabled hook, and lazy loader
- **HypernativeContract**: TypeScript interface defining the feature's public API surface
- **Feature Implementation**: The default export from `feature.ts` containing components, hooks, and services
- **Redux Slice**: `hnStateSlice` for managing per-Safe hypernative state (banner dismissals, form completion)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All hypernative components are accessible via `useLoadFeature(HypernativeFeature).components` with full type inference
- **SC-002**: All hypernative hooks are accessible via `useLoadFeature(HypernativeFeature).hooks` with full type inference
- **SC-003**: All hypernative services are accessible via `useLoadFeature(HypernativeFeature).services` with full type inference
- **SC-004**: Zero ESLint warnings for restricted imports from hypernative internal folders in external code
- **SC-005**: All existing hypernative tests pass (100% of current test suite)
- **SC-006**: TypeScript compilation succeeds with no errors
- **SC-007**: Feature loads lazily - hypernative code is not included in main bundle when feature flag is disabled
- **SC-008**: IDE navigation (Cmd+click) from contract types jumps to implementation files
- **SC-009**: The `safe-shield` feature successfully consumes hypernative components via the handle pattern

## Assumptions

- The existing `FEATURES.HYPERNATIVE` feature flag exists and is used to gate the feature
- The existing folder structure (`components/`, `hooks/`, `services/`, `store/`) can be preserved internally
- The `__core__` feature infrastructure (`useLoadFeature`, `createFeatureHandle`, types) is already available
- OAuth callback page (`/pages/hypernative/oauth-callback.tsx`) can access the feature via the handle pattern
- Analytics events (`/services/analytics/events/hypernative.ts`) can remain as direct imports since they're utility files
