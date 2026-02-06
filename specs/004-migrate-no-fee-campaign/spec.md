# Feature Specification: Migrate No Fee Campaign to Feature Architecture

**Feature Branch**: `004-migrate-no-fee-campaign`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "I want to move the No Fee Campaign to the new Feature architecture (see @apps/web/docs/feature-architecture.md )."

## Clarifications

### Session 2025-01-27

- Q: How should the feature flag be mapped when creating the feature handle? The folder name is `no-fee-campaign` but the flag is `FEATURES.NO_FEE_NOVEMBER`. → A: Omit the second parameter - use semantic mapping. The `FEATURE_FLAG_MAPPING` in `createFeatureHandle.ts` already contains `'no-fee-campaign': FEATURES.NO_FEE_NOVEMBER`, so `createFeatureHandle('no-fee-campaign')` will automatically use the correct flag.
- Q: Which hooks should be exported directly from `index.ts`? There are three hooks: `useIsNoFeeCampaignEnabled`, `useNoFeeCampaignEligibility`, and `useGasTooHigh`. → A: Export all three hooks directly from `index.ts`. They are lightweight, used by external consumers, and should remain accessible. `useIsNoFeeCampaignEnabled` can coexist with the feature handle's `useIsEnabled()` for backward compatibility and convenience.
- Q: Which components should be included in the feature contract? There are three components: NoFeeCampaignBanner, NoFeeCampaignTransactionCard, and GasTooHighBanner. → A: Include all three components in the contract. They are all used by external consumers and should be accessible via `useLoadFeature()`.
- Q: How should remaining edge cases be handled? → A: All edge cases clarified in the Edge Cases section. Eligibility data loading, feature flag toggling, chain switching, blocked addresses, and gas limit checks all maintain existing behavior - the feature architecture provides reactive handling via `useLoadFeature` hook dependencies, while business logic (eligibility, gas limits) remains unchanged per FR-010 and FR-011.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - No Fee Campaign Feature Remains Functional After Migration (Priority: P1)

After migration, all existing No Fee Campaign functionality must continue to work exactly as before. Users should see campaign banners, eligibility information, and transaction execution options without any visible changes to behavior or user experience.

**Why this priority**: This is a refactoring task - the primary goal is maintaining existing functionality while improving code organization. Any regression would directly impact users' ability to use the sponsored transaction feature.

**Independent Test**: Can be fully tested by verifying that all No Fee Campaign UI components render correctly, eligibility checks work, and transaction execution with the campaign option functions as expected. This delivers the core value of maintaining feature parity.

**Acceptance Scenarios**:

1. **Given** a user on a chain where No Fee Campaign is enabled, **When** they view the dashboard, **Then** the No Fee Campaign banner appears in the news carousel if they are eligible
2. **Given** a user viewing the transaction page, **When** they are eligible for No Fee Campaign, **Then** the No Fee Campaign transaction card displays with eligibility information
3. **Given** a user executing a transaction, **When** they are eligible and have remaining sponsored transactions, **Then** the No Fee Campaign execution method option is available in the execution selector
4. **Given** a user with a transaction that exceeds gas limits, **When** they view the execution options, **Then** the Gas Too High banner appears and No Fee Campaign option is disabled appropriately
5. **Given** a user who has reached their sponsored transaction limit, **When** they view execution options, **Then** the No Fee Campaign option shows limit reached state
6. **Given** a user on a chain where No Fee Campaign is disabled, **When** they view any page, **Then** no No Fee Campaign components are rendered and no related code is loaded

---

### User Story 2 - Feature Code is Properly Lazy-Loaded (Priority: P1)

The No Fee Campaign feature code should only be loaded when the feature flag is enabled for the current chain. When disabled, no feature code should be included in the initial bundle.

**Why this priority**: Bundle size optimization is a core benefit of the feature architecture. Disabled features should not impact application performance or initial load time.

**Independent Test**: Can be fully tested by building the application with the feature disabled and verifying that No Fee Campaign code is in a separate chunk that is not loaded initially. This delivers the value of improved performance for users on chains without the feature.

**Acceptance Scenarios**:

1. **Given** the application is built, **When** the feature flag is disabled for a chain, **Then** No Fee Campaign code is in a separate code-split chunk
2. **Given** a user on a chain with the feature disabled, **When** they load the application, **Then** the No Fee Campaign chunk is not downloaded
3. **Given** a user on a chain with the feature enabled, **When** they navigate to a page using the feature, **Then** the feature chunk loads on-demand
4. **Given** the application bundle is analyzed, **When** the feature is disabled, **Then** No Fee Campaign components and services are not included in the main bundle

---

### User Story 3 - Feature Follows Architecture Standards (Priority: P1)

The migrated No Fee Campaign feature must follow all patterns defined in the feature architecture documentation, including proper contract definition, feature handle creation, hook exports, and public API structure.

**Why this priority**: Consistency with architecture standards ensures maintainability, enables proper tooling support (ESLint rules), and makes the codebase easier for developers to understand and contribute to.

**Independent Test**: Can be fully tested by verifying that the feature has the required files (contract.ts, feature.ts, index.ts), follows naming conventions, exports hooks correctly, and passes ESLint rules. This delivers the value of code consistency and maintainability.

**Acceptance Scenarios**:

1. **Given** the feature is migrated, **When** ESLint runs, **Then** no restricted import warnings are generated for No Fee Campaign
2. **Given** a developer imports the feature, **When** they use useLoadFeature with the feature handle, **Then** they receive proper TypeScript type inference
3. **Given** the feature structure is reviewed, **When** checked against architecture documentation, **Then** all required files exist and follow the correct patterns
4. **Given** hooks are accessed, **When** imported directly from the feature index, **Then** they work correctly without lazy loading violations

---

### Edge Cases

- What happens when the feature flag is undefined (loading state) during initial render? The feature renders nothing until the flag resolves to true or false.
- How does the system handle errors when loading the feature chunk fails? Errors are logged via the error logging service and exposed via the `$error` meta property on the feature object returned by `useLoadFeature()`. Components can check `feature.$error` to handle error states appropriately.
- What happens when eligibility data is loading but the feature is enabled? The `useNoFeeCampaignEligibility` hook maintains its existing loading state behavior (`isLoading: true`). Components can check this state and show loading skeletons. The feature architecture does not change this behavior - eligibility data loading is independent of feature code loading.
- How does the system handle rapid toggling of the feature flag? The `useLoadFeature` hook reacts to flag changes via React's reactivity. When the flag changes from `true` to `false`, components return stub proxies (render null). When it changes back to `true`, the feature chunk reloads. The `useAsync` hook in `useLoadFeature` handles this reactively based on the `isEnabled` dependency.
- What happens when a user switches chains mid-session and the feature availability changes? When the chain changes, `useHasFeature` returns a new value for the feature flag. The `useLoadFeature` hook detects this change (via the `isEnabled` dependency) and reacts accordingly: if the feature becomes disabled, components return stubs; if it becomes enabled, the feature chunk loads on-demand. The existing eligibility hook (`useNoFeeCampaignEligibility`) will also re-fetch data for the new chain.
- How does the system handle blocked addresses that make users ineligible? This is maintained by existing logic in `useNoFeeCampaignEligibility` hook (FR-010). When a blocked address is detected, the hook returns `isEligible: false` and `blockedAddress` property. Components check this and display the `BlockedAddress` component. The feature architecture does not change this behavior.
- What happens when gas limits are exceeded for a transaction that would otherwise be eligible? The `useGasTooHigh` hook checks if gas exceeds `MAX_GAS_LIMIT_NO_FEE_CAMPAIGN`. When gas is too high, the execution method selector disables the No Fee Campaign option and shows the `GasTooHighBanner` component. This behavior is preserved (FR-011) - the feature architecture does not change the gas limit checking logic.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST maintain 100% functional parity with the current No Fee Campaign implementation after migration
- **FR-002**: System MUST lazy-load No Fee Campaign code only when the feature flag is enabled for the current chain
- **FR-003**: System MUST export a feature handle using `createFeatureHandle('no-fee-campaign')` without the second parameter, relying on the existing semantic mapping to `FEATURES.NO_FEE_NOVEMBER`
- **FR-004**: System MUST define a feature contract in `contract.ts` with flat structure including all three components (NoFeeCampaignBanner, NoFeeCampaignTransactionCard, GasTooHighBanner) and any services (components and services only, no hooks)
- **FR-005**: System MUST export all three hooks directly from `index.ts` (useIsNoFeeCampaignEnabled, useNoFeeCampaignEligibility, useGasTooHigh) - not in contract or feature.ts - to avoid Rules of Hooks violations
- **FR-006**: System MUST use direct imports in `feature.ts` (no nested lazy loading) since the entire feature is already lazy-loaded
- **FR-007**: System MUST organize components, hooks, services, and constants in appropriate subdirectories
- **FR-008**: System MUST update all consumer code to use `useLoadFeature()` with the feature handle instead of direct imports
- **FR-009**: System MUST ensure all No Fee Campaign components render null when the feature is disabled (via proxy stubs)
- **FR-010**: System MUST maintain all existing eligibility checking logic, including blocked address detection
- **FR-011**: System MUST preserve all existing UI states (loading, error, eligible, not eligible, limit reached, gas too high)
- **FR-012**: System MUST ensure hooks can be imported directly and work independently of feature loading state
- **FR-013**: System MUST pass ESLint restricted import rules (no imports from internal feature folders)
- **FR-014**: System MUST maintain type safety with proper TypeScript interfaces and contract types
- **FR-015**: System MUST ensure the feature flag check uses `FEATURES.NO_FEE_NOVEMBER` via the semantic mapping in `createFeatureHandle` (mapping already exists: `'no-fee-campaign': FEATURES.NO_FEE_NOVEMBER`)

### Key Entities _(include if feature involves data)_

- **No Fee Campaign Eligibility**: Represents whether a Safe address is eligible for sponsored transactions, including remaining count, limit, and blocked address status
- **No Fee Campaign Feature Handle**: Runtime object containing feature name, flag check hook, and lazy load function for the feature implementation
- **No Fee Campaign Contract**: TypeScript interface defining the public API surface (components and services) exposed by the feature
- **No Fee Campaign Implementation**: The actual feature code (components, services) that is lazy-loaded when the feature is enabled

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All existing No Fee Campaign functionality works identically after migration (100% feature parity verified through automated tests)
- **SC-002**: No Fee Campaign code is code-split into a separate chunk that loads only when the feature flag is enabled (verified through bundle analysis)
- **SC-003**: ESLint restricted import rules pass with zero warnings for No Fee Campaign feature imports (verified through linting)
- **SC-004**: All TypeScript type checks pass with full type inference working for feature handle usage (verified through type-check)
- **SC-005**: Bundle size for main chunk decreases when No Fee Campaign is disabled (measured through build analysis, target: remove No Fee Campaign code from main bundle)
- **SC-006**: All existing unit tests and integration tests for No Fee Campaign continue to pass after migration (100% test pass rate)
- **SC-007**: Feature can be disabled per chain without loading any feature code (verified through network tab inspection)
- **SC-008**: Developers can successfully use the feature via `useLoadFeature()` pattern with proper autocomplete and type safety (verified through developer testing)

## Assumptions

- The feature flag `FEATURES.NO_FEE_NOVEMBER` (or equivalent) already exists in the chain configuration system
- All existing No Fee Campaign components, hooks, and services can be organized into the feature architecture without breaking changes to their internal logic
- The migration will maintain backward compatibility during the transition (no breaking changes to external APIs)
- ESLint rules for restricted imports are already configured in the project
- The `createFeatureHandle` helper function is available and working correctly
- All consumer code locations have been identified and can be updated in this migration
- No new functionality will be added during this migration (pure refactoring task)

## Dependencies

- Feature architecture infrastructure (`@/features/__core__`) must be available
- `createFeatureHandle` helper function must be implemented and working
- ESLint configuration must support restricted import rules
- Feature flag system (`useHasFeature`, `FEATURES` enum) must be functional
- Existing No Fee Campaign backend API endpoints and data structures remain unchanged

## Out of Scope

- Adding new No Fee Campaign functionality or features
- Changing the eligibility logic or business rules
- Modifying the UI/UX design of No Fee Campaign components
- Updating backend APIs or data structures
- Adding new tests beyond what's needed to verify migration success
- Performance optimizations beyond what the architecture provides (lazy loading)
- Mobile app changes (this migration is web-only)
