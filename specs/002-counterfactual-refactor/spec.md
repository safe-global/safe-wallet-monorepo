# Feature Specification: Counterfactual Feature Refactor

**Feature Branch**: `002-counterfactual-refactor`  
**Created**: 2026-01-15  
**Status**: Draft  
**Input**: User description: "In 001-feature-architecture we created a feature pattern and refactored walletconnect to use it. I want to continue with the refactoring and refactor the counterfactual feature next."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Establish Standard File Structure (Priority: P1)

A developer working on the counterfactual feature needs to locate components, hooks, and services. Following the standard architecture, they find all components in `components/`, hooks in `hooks/`, services in `services/`, and store logic in `store/`, each with barrel export files. Types are centralized in `types.ts`.

**Why this priority**: The standardized structure is foundational for maintainability. Without it, code discovery is difficult and imports become chaotic.

**Independent Test**: Can be fully tested by verifying the directory structure matches the standard pattern exactly - each required directory exists with its barrel file, and all files are properly categorized.

**Acceptance Scenarios**:

1. **Given** the counterfactual feature exists with its current flat structure, **When** refactored to the standard pattern, **Then** all components reside in `components/` directory with an `index.ts` barrel file
2. **Given** the refactored structure, **When** a developer looks for hooks, **Then** all hooks are in `hooks/` directory with their own `index.ts` barrel
3. **Given** the refactored structure, **When** a developer looks for types, **Then** all TypeScript interfaces are defined in a single `types.ts` file at feature root
4. **Given** the refactored structure, **When** a developer examines the feature, **Then** the Redux store logic is in `store/` directory with `index.ts` barrel

---

### User Story 2 - Establish Public API Boundary (Priority: P2)

External code throughout the application imports from the counterfactual feature. After refactoring, these imports use only the public API exposed through the feature's root `index.ts`, never importing internal components, hooks, or services directly.

**Why this priority**: API boundaries enable feature isolation. Without them, tight coupling makes changes risky and features cannot be safely disabled or lazy-loaded.

**Independent Test**: Can be fully tested by running ESLint and verifying zero restricted import violations for the counterfactual feature. Grep for internal imports and confirm all have been updated to use the public API.

**Acceptance Scenarios**:

1. **Given** external code importing counterfactual internals, **When** refactored to use public API, **Then** all imports reference `@/features/counterfactual` (feature root) only
2. **Given** the refactored public API, **When** examined, **Then** the feature's `index.ts` exports only types, the feature flag hook, store selectors, and lazy-loaded components
3. **Given** the refactored public API, **When** ESLint runs, **Then** zero violations of no-restricted-imports rule appear for counterfactual
4. **Given** the refactored feature, **When** a developer tries to import counterfactual internals, **Then** ESLint warns against the import

---

### User Story 3 - Implement Feature Flag Check (Priority: P3)

The counterfactual feature has a `COUNTERFACTUAL` feature flag in the `FEATURES` enum. All counterfactual components check this flag via `useIsCounterfactualEnabled` hook and render nothing when disabled, ensuring no side effects occur.

**Why this priority**: Feature flag compliance is critical for chain-specific feature toggling. The pattern is already defined; this story applies it to counterfactual.

**Independent Test**: Can be fully tested by mocking the feature flag to return false and verifying no counterfactual components render and no counterfactual code executes.

**Acceptance Scenarios**:

1. **Given** the `COUNTERFACTUAL` feature flag exists, **When** `useIsCounterfactualEnabled` hook is called, **Then** it returns the flag value from `useHasFeature(FEATURES.COUNTERFACTUAL)`
2. **Given** the feature flag is disabled (false), **When** counterfactual components render, **Then** they all return null
3. **Given** the feature flag is loading (undefined), **When** counterfactual components render, **Then** they return null
4. **Given** the feature flag is disabled, **When** counterfactual components execute, **Then** no side effects occur (no API calls, no analytics, no Redux dispatches)

---

### User Story 4 - Enable Lazy Loading (Priority: P4)

The counterfactual feature's main components are lazy-loaded using Next.js `dynamic()` imports from the feature's root `index.ts`. When the feature flag is disabled, no counterfactual code is loaded into the browser bundle.

**Why this priority**: Lazy loading reduces initial bundle size and enables true feature isolation. Disabled features should not consume bandwidth or parsing time.

**Independent Test**: Can be fully tested by disabling the feature flag, building the application, and verifying counterfactual code is not included in the initial bundle. Check that counterfactual chunks exist but are not loaded until needed.

**Acceptance Scenarios**:

1. **Given** the refactored counterfactual feature, **When** the feature's main components are exported from `index.ts`, **Then** they use `dynamic()` imports with appropriate `ssr` settings
2. **Given** the feature flag is disabled, **When** the application loads, **Then** no counterfactual JavaScript is loaded in the browser
3. **Given** the feature flag is enabled, **When** a page using counterfactual loads, **Then** counterfactual code is loaded on-demand as a separate chunk
4. **Given** the application builds, **When** examining build output, **Then** counterfactual feature has its own chunk files indicating code splitting

---

### User Story 5 - Preserve All Existing Functionality (Priority: P5)

All existing counterfactual functionality continues to work identically after refactoring. Every test passes, every component renders correctly, every user flow (activate account, pay now/pay later, pending notifications) works without regression.

**Why this priority**: Refactoring is structural only - no behavioral changes. Users must not experience any differences in how counterfactual features work.

**Independent Test**: Can be fully tested by running all existing counterfactual tests (unit and integration) and verifying 100% pass rate. Manual testing of Safe activation flows confirms no regressions.

**Acceptance Scenarios**:

1. **Given** the refactored counterfactual feature, **When** all existing tests run, **Then** every test passes without modification
2. **Given** a user with an undeployed Safe, **When** they activate their account, **Then** the flow works identically to before refactoring
3. **Given** a user viewing their Safe list, **When** they have pending counterfactual Safes, **Then** status indicators and notifications appear correctly
4. **Given** the refactored feature, **When** Redux state updates occur, **Then** the `undeployedSafesSlice` behaves identically to before

---

### Edge Cases

- What happens when external code deep-imports counterfactual internals (e.g., `@/features/counterfactual/hooks/useDeployGasLimit`)? ESLint warns against the import during development; imports are updated to use only public API exports.
- How does the system handle circular dependencies between counterfactual and shared utilities? Shared utilities are extracted to `src/utils/` or `src/hooks/` to break circular dependencies; features never import each other.
- What happens when the feature flag check returns `undefined` (loading state) while a counterfactual component is mounted? Component immediately returns `null` to render nothing, preventing flash of unsupported content.
- How are counterfactual Redux actions handled when the feature is disabled? The slice remains in the store but no actions are dispatched when disabled; components don't mount so they can't dispatch.
- What happens to counterfactual types that are used outside the feature (e.g., `UndeployedSafe` interface)? Types are exported from the feature's public API (`index.ts`) as they are tree-shakeable and safe to export.
- How are tests structured after moving files into subdirectories? Test files remain colocated with their source files (`__tests__` directories move into `components/`, `hooks/`, etc.); imports are updated to reflect new paths.

## Requirements _(mandatory)_

### Functional Requirements

**Directory Structure**

- **FR-001**: The counterfactual feature MUST have these directories: `components/`, `hooks/`, `services/`, `store/`, with barrel `index.ts` files in each
- **FR-002**: The counterfactual feature MUST have these files at root: `index.ts` (public API), `types.ts` (all interfaces), `constants.ts` (feature constants)
- **FR-003**: All React components MUST be moved into `components/` directory with subdirectories per component
- **FR-004**: All hooks MUST be moved into `hooks/` directory
- **FR-005**: All services and utility functions MUST be moved into `services/` directory
- **FR-006**: Redux slice MUST remain in `store/` directory (already correctly placed)
- **FR-007**: Test files MUST be colocated with their source files in `__tests__/` directories within the appropriate subdirectory

**Public API Definition**

- **FR-008**: The feature's `index.ts` MUST export only: types (tree-shakeable), the feature flag hook, store selectors/actions, lazy-loaded components, and necessary constants
- **FR-009**: The feature's `index.ts` MUST NOT export internal hooks (except feature flag hook), internal components, or service implementations
- **FR-010**: Each subdirectory (`components/`, `hooks/`, `services/`, `store/`) MUST have an `index.ts` barrel file exporting its public members
- **FR-011**: All TypeScript interfaces MUST be defined in `types.ts` at feature root
- **FR-012**: Feature constants MUST be defined in `constants.ts` at feature root

**External Import Updates**

- **FR-013**: All imports from outside the feature MUST be updated to import from `@/features/counterfactual` (feature root) only
- **FR-014**: No external code MUST import from `@/features/counterfactual/components/*`, `@/features/counterfactual/hooks/*`, `@/features/counterfactual/services/*`, or `@/features/counterfactual/store/*`
- **FR-015**: The Redux store's `slices.ts` MUST continue exporting the counterfactual slice but MUST import it from the feature's public API

**Feature Flag Implementation**

- **FR-016**: A `useIsCounterfactualEnabled` hook MUST exist in `hooks/` that calls `useHasFeature(FEATURES.COUNTERFACTUAL)`
- **FR-017**: The `useIsCounterfactualEnabled` hook MUST return `boolean | undefined` (true=enabled, false=disabled, undefined=loading)
- **FR-018**: The `useIsCounterfactualEnabled` hook MUST be exported from the feature's public API (`index.ts`)
- **FR-019**: All counterfactual components that can be disabled MUST check the feature flag and return `null` when not enabled
- **FR-020**: Feature flag checks MUST occur before any side effects (API calls, analytics, Redux dispatches)

**Lazy Loading**

- **FR-021**: Main counterfactual components exported from `index.ts` MUST use Next.js `dynamic()` imports
- **FR-022**: Dynamic imports MUST use `{ ssr: false }` as counterfactual uses browser-only APIs
- **FR-023**: The default export from `index.ts` MUST be a lazy-loaded component (if a primary widget exists)
- **FR-024**: Pages or components using counterfactual MUST use dynamic imports to load the feature

**Types and Interfaces**

- **FR-025**: All existing TypeScript interfaces MUST be moved to `types.ts` at feature root
- **FR-026**: The `types.ts` file MUST export interfaces for: `UndeployedSafe`, `UndeployedSafesState`, `UndeployedSafeStatus`, `UndeployedSafeProps`, `ReplayedSafeProps`, and any other counterfactual-specific types
- **FR-027**: Types imported from `@safe-global/utils` (e.g., `PayMethod`, `PendingSafeStatus`) MUST NOT be duplicated; they remain imported from the shared package
- **FR-028**: All type exports from `types.ts` MUST be re-exported from the feature's `index.ts` as `export type {}`

**Backward Compatibility**

- **FR-029**: All existing counterfactual functionality MUST work identically after refactoring
- **FR-030**: All existing tests MUST pass without modification (except for import path updates)
- **FR-031**: The Redux store structure MUST remain unchanged; the `undeployedSafesSlice` continues to work identically
- **FR-032**: All existing public APIs MUST remain accessible (either exported directly or through new public API structure)

### Key Entities

- **Counterfactual Safe**: An undeployed Safe account that exists deterministically at a predicted address but has not been created on-chain yet. Users can receive funds to this address before deployment.
- **Undeployed Safe**: The Redux state representation of a counterfactual Safe, including its predicted properties (owners, threshold, fallback handler) and deployment status.
- **Safe Activation**: The process of deploying a counterfactual Safe on-chain, either by executing the first transaction (pay later) or by explicitly deploying (activate account).
- **Feature Flag Hook**: The `useIsCounterfactualEnabled` hook that checks if the counterfactual feature is enabled for the current chain.
- **Public API**: The exported interface from `index.ts` that defines what the counterfactual feature exposes to the rest of the application.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The counterfactual feature directory structure matches the standard pattern exactly (all required directories and files exist)
- **SC-002**: Zero ESLint no-restricted-imports warnings for counterfactual feature imports across the entire codebase
- **SC-003**: 100% of existing counterfactual tests pass without modification (except import path updates)
- **SC-004**: When the counterfactual feature flag is disabled, zero bytes of counterfactual code are loaded in the browser
- **SC-005**: Bundle analysis shows counterfactual code is code-split into separate chunks (not in main bundle)
- **SC-006**: Type-check passes with zero errors after refactoring
- **SC-007**: All 49 files that import from counterfactual are updated to use public API only
- **SC-008**: The `types.ts` file contains all counterfactual TypeScript interfaces (currently scattered across files)
- **SC-009**: The public API (`index.ts`) exports exactly: types, feature flag hook, store exports, constants (if needed), and lazy-loaded components
- **SC-010**: Manual testing confirms Safe activation flows (pay now, pay later) work identically to before refactoring

## Assumptions

- The existing `FEATURES.COUNTERFACTUAL` enum value and feature flag infrastructure are sufficient and require no changes
- The `useHasFeature` hook from `@/hooks/useChains` correctly checks the counterfactual feature flag from chain configurations
- The counterfactual feature's Redux slice location in `store/` is already correct and requires no structural changes
- External dependencies on counterfactual types and functions are known and can be identified through imports; no hidden dependencies exist
- The Next.js `dynamic()` import mechanism correctly handles code splitting for counterfactual components
- Test files can be moved into subdirectories without breaking test discovery (Jest/Vitest configuration supports `__tests__` directories anywhere)
- The counterfactual feature does not need a default exported "main component" - it may only export named components as the feature is integrated at multiple points
- Shared utilities currently in counterfactual that are used by other features (if any) will be identified during refactoring and extracted to `src/utils/` or `src/hooks/`
