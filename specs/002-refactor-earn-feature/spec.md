# Feature Specification: Refactor Earn Feature

**Feature Branch**: `002-refactor-earn-feature`  
**Created**: 2026-01-15  
**Status**: Draft  
**Input**: User description: "Refactor the earn feature to follow the new feature architecture pattern established in 001-feature-architecture"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Restructure Earn Feature Folders (Priority: P1)

The earn feature needs to be restructured to match the standard feature architecture pattern. All files must be organized into the proper folders (`components/`, `hooks/`, `services/`, `store/`, `types.ts`, `constants.ts`) with proper barrel exports.

**Why this priority**: The folder structure is foundational for all other compliance aspects. Without proper organization, lazy loading and API boundaries cannot be correctly enforced.

**Independent Test**: Can be fully tested by verifying the folder structure exactly matches the documented pattern in `apps/web/docs/feature-architecture.md`, all barrel files exist, and no files are in incorrect locations.

**Acceptance Scenarios**:

1. **Given** the current earn feature structure, **When** refactored to the new pattern, **Then** all components are in `components/` subdirectories with barrel exports
2. **Given** the refactored structure, **When** examining the feature root, **Then** `index.ts`, `types.ts`, and `constants.ts` files exist at the root level
3. **Given** hooks in the feature, **When** organized, **Then** they reside in `hooks/` with a barrel export and `useIsEarnFeatureEnabled.ts` exists
4. **Given** any services or utilities, **When** organized, **Then** they reside in `services/` with proper barrel exports

---

### User Story 2 - Create Proper Public API (Priority: P1)

The earn feature must expose only its public API through the root `index.ts` barrel file. Internal components and utilities should not be directly importable from outside the feature.

**Why this priority**: API boundaries prevent tight coupling and ensure features remain isolated. This is critical for maintainability and the ability to refactor internals without breaking external consumers.

**Independent Test**: Can be fully tested by attempting to import internal components from outside the feature (should fail) and verifying only public exports work.

**Acceptance Scenarios**:

1. **Given** the earn feature barrel file, **When** examined, **Then** it exports only the main feature component, public hooks, and types meant for external use
2. **Given** internal components like `EarnView`, `EarnWidget`, `EarnInfo`, **When** accessed from outside the feature, **Then** they are not directly importable (only through the public API)
3. **Given** the `EarnButton` component used in other parts of the app, **When** imported, **Then** it comes from `@/features/earn` not `@/features/earn/components/EarnButton`

---

### User Story 3 - Ensure Proper Lazy Loading (Priority: P1)

The earn feature must be lazy-loaded from the page level, ensuring that when the feature flag is disabled or the user hasn't navigated to the earn page, no earn feature code is loaded.

**Why this priority**: Lazy loading is essential for performance and code splitting. Features should not bloat the initial bundle when they may never be used on a given chain.

**Independent Test**: Can be fully tested by disabling the EARN feature flag, loading the app, and verifying via bundle analysis that no earn feature code is loaded.

**Acceptance Scenarios**:

1. **Given** the earn page at `apps/web/src/pages/earn.tsx`, **When** it imports the earn feature, **Then** it uses Next.js `dynamic()` with `{ ssr: false }`
2. **Given** the app with EARN feature disabled, **When** loaded, **Then** no earn feature code is in the loaded bundle (verified via DevTools or bundle analyzer)
3. **Given** the app with EARN feature enabled, **When** user navigates to `/earn`, **Then** the earn feature bundle is loaded on-demand

---

### User Story 4 - Add TypeScript Type Definitions (Priority: P2)

All TypeScript interfaces, types, and enums used within the earn feature must be defined in a dedicated `types.ts` file at the feature root.

**Why this priority**: Centralized type definitions improve discoverability and maintainability. This supports strong typing without circular dependencies.

**Independent Test**: Can be fully tested by verifying all types are exported from `types.ts`, no inline interfaces exist in component files, and types are properly imported throughout the feature.

**Acceptance Scenarios**:

1. **Given** any TypeScript interfaces used in earn, **When** defined, **Then** they exist in `types.ts` at the feature root
2. **Given** components that need earn-specific types, **When** importing types, **Then** they import from `../types` (relative) or `@/features/earn` (public API)
3. **Given** the public API, **When** external consumers need earn types, **Then** types are exported from the main barrel file

---

### User Story 5 - Preserve All Existing Functionality (Priority: P1)

The refactoring must preserve 100% of existing earn feature functionality including the earn page, earn button, widget integration, consent handling, geoblocking, and asset selection.

**Why this priority**: This is a pure refactoring with no functional changes. Breaking existing functionality defeats the purpose of improving code structure.

**Independent Test**: Can be fully tested by running all existing tests and manually verifying all earn user flows work identically before and after the refactoring.

**Acceptance Scenarios**:

1. **Given** the refactored earn feature, **When** all tests run, **Then** 100% of existing tests pass without modification
2. **Given** a user navigating to `/earn`, **When** the page loads, **Then** the earn widget displays exactly as before
3. **Given** a user clicking an earn button on an asset, **When** navigated to earn page, **Then** the asset is pre-selected exactly as before
4. **Given** a user encountering the disclaimer, **When** accepting it, **Then** consent is stored and widget displays exactly as before
5. **Given** a blocked address or geoblocked country, **When** accessing earn, **Then** the appropriate error message displays exactly as before

---

### Edge Cases

- What happens when the earn feature flag is undefined (loading)? The feature renders nothing until the flag resolves to true or false.
- How are Kiln widget-specific utilities handled? They remain in the `services/` directory as they are implementation details of the earn feature.
- What happens to the `EarnButton` component used across the app? It becomes part of the public API exported from the earn feature barrel file.
- How are analytics events for earn handled? They remain within the feature in `services/tracking.ts` or integrated through the existing global analytics service.
- What happens to the consent storage key constant? It remains in `constants.ts` within the feature.
- How is the `useIsEarnFeatureEnabled` hook that checks both feature flag and geoblocking handled? It stays in `hooks/` and can be enhanced if needed but functionality remains the same.

## Requirements _(mandatory)_

### Functional Requirements

**Folder Structure**

- **FR-001**: The earn feature MUST be organized under `apps/web/src/features/earn/` with the standard structure
- **FR-002**: The feature MUST have `index.ts`, `types.ts`, and `constants.ts` at the root level
- **FR-003**: All components MUST be in `components/` subdirectories with a `components/index.ts` barrel file
- **FR-004**: All hooks MUST be in `hooks/` subdirectory with a `hooks/index.ts` barrel file
- **FR-005**: All services and utilities MUST be in `services/` subdirectory with a `services/index.ts` barrel file

**Public API**

- **FR-006**: The root `index.ts` MUST export only the public API (main component, public hooks, public types)
- **FR-007**: Internal components like `EarnView`, `EarnWidget`, `EarnInfo` MUST NOT be directly exported from the public API
- **FR-008**: The `EarnButton` component MUST be exported from the public API as it is used outside the feature
- **FR-009**: The `useIsEarnFeatureEnabled` hook MUST be exported from the public API
- **FR-010**: External code importing earn feature MUST use `@/features/earn` not deep imports like `@/features/earn/components/EarnButton`

**Lazy Loading**

- **FR-011**: The earn page MUST import the earn feature using Next.js `dynamic()` with `{ ssr: false }`
- **FR-012**: The earn feature MUST NOT be statically imported anywhere in the codebase
- **FR-013**: When the EARN feature flag is disabled, no earn feature code MUST be loaded in the browser bundle

**Type Safety**

- **FR-014**: All TypeScript interfaces and types MUST be defined in `types.ts` at the feature root
- **FR-015**: The `types.ts` file MUST be exported from the public API barrel file for external consumers
- **FR-016**: Components MUST NOT define inline interfaces for feature-specific concepts (extract to `types.ts`)

**Feature Flag**

- **FR-017**: The `useIsEarnFeatureEnabled` hook MUST continue to check both the EARN feature flag and geoblocking status
- **FR-018**: The main earn component MUST check the feature flag and render nothing when disabled or loading
- **FR-019**: The earn page MUST handle the three states: undefined (loading), false (disabled), true (enabled)

**Functionality Preservation**

- **FR-020**: All existing earn functionality MUST work identically after refactoring (widget, consent, asset selection)
- **FR-021**: All existing earn tests MUST pass without modification
- **FR-022**: The Kiln widget integration MUST continue to function exactly as before
- **FR-023**: Geoblocking and blocked address checks MUST continue to work exactly as before
- **FR-024**: Analytics tracking for earn events MUST continue to work exactly as before

### Key Entities

- **Earn Feature**: A domain module enabling users to access staking/earning opportunities via the Kiln widget, checking feature flags, geoblocking, and consent.
- **Earn Button**: A reusable component displayed on asset rows that navigates to the earn page with a pre-selected asset.
- **Earn Widget**: The embedded Kiln widget that provides the actual staking interface.
- **Earn Consent**: A disclaimer that users must accept before accessing the earn widget, stored in local storage.
- **Asset Selection**: The ability to pre-select a specific asset when navigating to the earn page via query parameter.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The earn feature folder structure passes 100% compliance against the checklist in `apps/web/docs/feature-architecture.md`
- **SC-002**: All existing earn tests pass without modification after refactoring
- **SC-003**: Bundle analysis confirms earn feature code is in a separate chunk and not loaded when feature flag is disabled
- **SC-004**: External imports of earn feature use only `@/features/earn` (no deep imports to internal components)
- **SC-005**: The `types.ts` file contains all earn-specific TypeScript interfaces with no inline type definitions in components
- **SC-006**: The earn page loads and functions identically to the pre-refactor version in manual testing
- **SC-007**: All earn analytics events continue to fire correctly after refactoring
- **SC-008**: Geoblocking and consent handling work identically to the pre-refactor version

## Assumptions

- The existing `FEATURES.EARN` enum value is correctly configured in the chains configuration
- The `useIsEarnFeatureEnabled` hook correctly checks both the feature flag and geoblocking status
- The Kiln widget integration code in `utils.ts` and related components does not need functional changes
- No new functionality is being added; this is purely a structural refactoring.
- The earn feature does not need a Redux store slice (state is managed locally or via existing global state)
- External imports of earn functionality are limited and can be easily updated to use the new public API
