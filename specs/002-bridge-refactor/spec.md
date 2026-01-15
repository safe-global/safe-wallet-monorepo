# Feature Specification: Bridge Feature Refactor

**Feature Branch**: `002-bridge-refactor`  
**Created**: 2026-01-15  
**Status**: Draft  
**Input**: User description: "in 001-feature-architecture we created a feature pattern and refactored walletconnect to use it. I want to continue with the refactoring and refactor the bridge feature next."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Migrate Bridge Feature to Standard Architecture (Priority: P1)

The bridge feature is refactored to fully comply with the feature architecture standard established in 001-feature-architecture. This includes creating missing barrel files, extracting types, adding a proper public API, and ensuring the feature is properly lazy-loaded and feature-flagged.

**Why this priority**: This is the core deliverable—bringing the bridge feature into full compliance with the documented standard.

**Independent Test**: Can be fully tested by comparing the refactored feature structure against the documented standard checklist, verifying all required files exist, and confirming existing tests continue to pass.

**Acceptance Scenarios**:

1. **Given** the current bridge feature structure, **When** refactored to the standard, **Then** the feature has all required files: `index.ts`, `types.ts`, `constants.ts`, `components/index.ts`, `hooks/index.ts`
2. **Given** the refactored bridge feature, **When** imported from outside the feature, **Then** only the public API (`index.ts`) can be used (ESLint enforces this)
3. **Given** the refactored bridge feature, **When** the BRIDGE feature flag is disabled, **Then** no bridge code is loaded or executed
4. **Given** the refactored bridge feature, **When** all existing tests are run, **Then** they pass without modification

---

### User Story 2 - Preserve Geoblocking Integration (Priority: P2)

The bridge feature has a `useIsGeoblockedFeatureEnabled` hook that combines feature flag checks with geoblocking checks. This pattern must be preserved and properly integrated into the new architecture.

**Why this priority**: Geoblocking is a compliance requirement. Breaking this integration would expose the feature to users in restricted regions.

**Independent Test**: Can be fully tested by verifying that when geoblocking context indicates a blocked region, the feature flag hook returns false/undefined regardless of the chain's feature flag setting.

**Acceptance Scenarios**:

1. **Given** a user in a geoblocked region, **When** they access the bridge feature, **Then** the `useIsBridgeFeatureEnabled` hook returns `false`
2. **Given** a user in an allowed region on a chain with BRIDGE enabled, **When** they access the bridge feature, **Then** the `useIsBridgeFeatureEnabled` hook returns `true`
3. **Given** the `useIsGeoblockedFeatureEnabled` hook, **When** exported from the feature, **Then** it can be reused by other features (swap, staking) that need geoblocking

---

### User Story 3 - Ensure Proper Lazy Loading (Priority: P3)

The bridge feature must be lazy-loaded using Next.js `dynamic()` imports to ensure code splitting. The feature's code should not be included in the initial bundle.

**Why this priority**: Code splitting is essential for performance. Including bridge code in the initial bundle increases load time for all users, even those who never use bridging.

**Independent Test**: Can be fully tested by building the application and verifying that a separate chunk exists for the bridge feature code.

**Acceptance Scenarios**:

1. **Given** the bridge feature, **When** the application is built, **Then** the bridge code is in a separate chunk file
2. **Given** a user who never navigates to the bridge page, **When** they use other parts of the app, **Then** zero bridge code is loaded
3. **Given** the bridge feature, **When** lazy-loaded with `{ ssr: false }`, **Then** it does not cause hydration mismatches

---

### Edge Cases

- What happens when `useIsGeoblockedFeatureEnabled` is called before the geoblocking context is initialized? The hook returns `undefined` during loading state, and the component renders nothing.
- How does the system handle the existing `SanctionWrapper` and `DisclaimerWrapper` patterns? These wrappers remain in the `Bridge` component as they are UI-level concerns, not architecture concerns.
- What happens to the `BRIDGE_WIDGET_URL` constant? It is moved to `constants.ts` and exported from the public API if needed externally.
- How are the existing test files handled? Test files (`index.test.tsx`) remain colocated with their components but are not exported from barrel files.

## Requirements _(mandatory)_

### Functional Requirements

**Directory Structure**

- **FR-001**: Bridge feature MUST have an `index.ts` barrel file at `src/features/bridge/index.ts` that exports the public API
- **FR-002**: Bridge feature MUST have a `types.ts` file containing all TypeScript interfaces used by the feature
- **FR-003**: Bridge feature MUST have a `constants.ts` file containing `BRIDGE_WIDGET_URL` and `LOCAL_STORAGE_CONSENT_KEY`
- **FR-004**: Bridge feature MUST have a `components/index.ts` barrel file re-exporting public components
- **FR-005**: Bridge feature MUST have a `hooks/index.ts` barrel file re-exporting public hooks

**Public API**

- **FR-006**: The `index.ts` barrel MUST export `useIsBridgeFeatureEnabled` hook
- **FR-007**: The `index.ts` barrel MUST export `useIsGeoblockedFeatureEnabled` hook (for reuse by other features)
- **FR-008**: The `index.ts` barrel MUST have a default export of the lazy-loaded `Bridge` component
- **FR-009**: The `index.ts` barrel MUST export types from `types.ts` using `export type { ... }`
- **FR-010**: The `index.ts` barrel MUST NOT export internal components (`BridgeWidget`) directly

**Feature Flag Integration**

- **FR-011**: The `useIsBridgeFeatureEnabled` hook MUST check both the BRIDGE feature flag and geoblocking status
- **FR-012**: The main `Bridge` component MUST render nothing when `useIsBridgeFeatureEnabled` returns `false` or `undefined`
- **FR-013**: No bridge API calls or side effects MUST occur when the feature is disabled

**Lazy Loading**

- **FR-014**: The `Bridge` component MUST be lazy-loaded using Next.js `dynamic()` with `{ ssr: false }`
- **FR-015**: The `BridgeWidget` component MUST continue to be dynamically imported within the `Bridge` component
- **FR-016**: External consumers MUST import the feature via `import Bridge from '@/features/bridge'`

**Type Definitions**

- **FR-017**: The `types.ts` file MUST define interfaces for any feature-specific data structures
- **FR-018**: Types MUST be exported from the public API for external consumers if needed

**Backward Compatibility**

- **FR-019**: All existing bridge functionality MUST continue to work after refactoring
- **FR-020**: All existing tests MUST pass without modification (or with minimal adaptation to new import paths)
- **FR-021**: The `FeatureWrapper`, `SanctionWrapper`, and `DisclaimerWrapper` patterns MUST be preserved

### Key Entities

- **Bridge Feature**: The self-contained domain module at `src/features/bridge/` providing cross-chain asset bridging via LI.FI integration
- **BridgeWidget**: Internal component that renders the LI.FI iframe embed within an `AppFrame`
- **Bridge Component**: Public entry point that wraps the widget with feature flag, sanction, and disclaimer checks
- **Geoblocking Hook**: A reusable hook pattern that combines feature flag checks with geographic restriction checks

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The bridge feature passes 100% of the structural compliance checklist from the feature architecture documentation
- **SC-002**: All existing bridge tests pass without modification
- **SC-003**: ESLint produces no warnings for bridge feature imports from the rest of the codebase
- **SC-004**: After `yarn build`, a separate chunk file exists for bridge feature code (verified via filename inspection)
- **SC-005**: When BRIDGE feature flag is disabled, network tab shows zero requests to bridge-related endpoints
- **SC-006**: The refactoring introduces zero regressions (existing E2E tests pass, if any exist for bridge)
- **SC-007**: A developer can import the bridge feature using only `import Bridge, { useIsBridgeFeatureEnabled } from '@/features/bridge'`

## Assumptions

- The existing `useIsGeoblockedFeatureEnabled` hook pattern is correct and should be preserved
- The `FeatureWrapper`, `SanctionWrapper`, and `DisclaimerWrapper` components are shared infrastructure, not bridge-specific code
- The `FEATURES.BRIDGE` enum value already exists and is correctly configured in the CGW API
- No new feature flag is needed; the existing BRIDGE flag is sufficient
- The `BridgeWidget` test file (`index.test.tsx`) remains valid after the refactoring
- The bridge feature has no Redux store requirements (no state management needed beyond what exists)
