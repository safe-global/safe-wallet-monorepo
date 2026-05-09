# Feature Specification: Hypernative v3 Architecture Migration

**Feature Branch**: `001-migrate-hypernative-v3`  
**Created**: 2026-01-28  
**Status**: Draft  
**Input**: User description: "Migrate the Hypernative feature to v3 architecture using the codemod tool"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Developers Use Hypernative Components via Feature Handle (Priority: P1)

Developers consuming the Hypernative feature should be able to import and use components through the new v3 architecture pattern with `useLoadFeature`, rather than importing directly from internal paths.

**Why this priority**: This is the core architectural change that enables lazy loading and proper encapsulation. All other benefits (bundle size reduction, tree-shaking) depend on this pattern being adopted.

**Independent Test**: Can be fully tested by verifying that a consumer component can render Hypernative banners using `useLoadFeature(HypernativeFeature)` and that components render correctly when the feature is enabled.

**Acceptance Scenarios**:

1. **Given** a developer wants to display an Hypernative banner, **When** they import `HypernativeFeature` from `@/features/hypernative` and use `useLoadFeature`, **Then** they can access components via `feature.HnBanner` and render them without null checks
2. **Given** the Hypernative feature flag is disabled, **When** a component attempts to render via `useLoadFeature`, **Then** components render null automatically (stub behavior) without errors
3. **Given** the Hypernative feature flag is enabled, **When** a component renders via `useLoadFeature`, **Then** the feature bundle is lazy-loaded and components display correctly

---

### User Story 2 - Safe-Shield Integration Continues Working (Priority: P1)

The safe-shield feature's integration with Hypernative (threat analysis routing, eligibility checks, OAuth) must continue to function without any breaking changes.

**Why this priority**: Safe-shield is a critical security feature that deeply depends on Hypernative hooks. Any regression here would impact core security functionality.

**Independent Test**: Can be fully tested by verifying that `useIsHypernativeEligible` and `useHypernativeOAuth` hooks remain directly importable and return the same data shapes as before.

**Acceptance Scenarios**:

1. **Given** a safe-shield component uses `useIsHypernativeEligible`, **When** the import path is `@/features/hypernative`, **Then** the hook returns `{ isHypernativeEligible, loading }` with correct values
2. **Given** a safe-shield component uses `useHypernativeOAuth`, **When** initiating OAuth login, **Then** the authentication flow completes successfully
3. **Given** safe-shield performs threat analysis routing, **When** checking Hypernative eligibility, **Then** the routing logic works identically to before migration

---

### User Story 3 - OAuth Callback Page Functions Correctly (Priority: P1)

The OAuth callback page must continue to work for users completing Hypernative authentication.

**Why this priority**: Breaking the OAuth flow would prevent new users from activating Hypernative protection, directly impacting security feature adoption.

**Independent Test**: Can be fully tested by completing an OAuth login flow end-to-end and verifying the callback page processes the response correctly.

**Acceptance Scenarios**:

1. **Given** a user initiates Hypernative OAuth login, **When** they complete authentication and are redirected to the callback page, **Then** the PKCE token exchange completes successfully
2. **Given** the OAuth callback page needs PKCE helpers, **When** importing from `@/features/hypernative`, **Then** `savePkce`, `readPkce`, and `clearPkce` are available
3. **Given** an OAuth error occurs, **When** the callback page processes the response, **Then** appropriate error handling displays to the user

---

### User Story 4 - Banners Display in All Contexts (Priority: P2)

All Hypernative banner variants (dashboard, transaction pages, settings, queue) must display correctly in their respective contexts.

**Why this priority**: Banners are the primary user-facing elements of the feature. While not as critical as the safe-shield integration, incorrect banner display would degrade user experience.

**Independent Test**: Can be fully tested by navigating to each banner location (dashboard carousel, transaction details, settings page, queue page) and verifying banner visibility and functionality.

**Acceptance Scenarios**:

1. **Given** a user views the dashboard, **When** the Hypernative feature is enabled and banner conditions are met, **Then** the HnBanner displays in the carousel
2. **Given** a user views transaction details, **When** queue assessment is available, **Then** the HnQueueAssessmentBanner displays with correct severity
3. **Given** a user views settings, **When** the Hypernative guard is activated, **Then** the HnActivatedSettingsBanner displays
4. **Given** a user dismisses a banner, **When** they return to the page, **Then** the banner remains dismissed (persistence works)

---

### User Story 5 - Codemod Tool Generates Valid Migration (Priority: P2)

The migrate-feature codemod tool should successfully analyze and generate migration artifacts for the Hypernative feature.

**Why this priority**: The codemod accelerates migration and reduces manual error. However, manual migration is possible as a fallback.

**Independent Test**: Can be fully tested by running `yarn migrate analyze hypernative` and verifying the generated config, then running `yarn migrate execute hypernative --dry-run` and reviewing proposed changes.

**Acceptance Scenarios**:

1. **Given** a developer runs the analyze command, **When** targeting the hypernative feature, **Then** a valid config file is generated at `.codemod/hypernative.config.json`
2. **Given** a developer runs the execute command with `--dry-run`, **When** reviewing the output, **Then** all proposed file changes are valid and match the expected v3 structure
3. **Given** a developer executes the migration, **When** the tool completes, **Then** `contract.ts`, `feature.ts`, and `index.ts` are created with correct structure

---

### User Story 6 - Bundle Size Reduction Achieved (Priority: P3)

The main application bundle should be reduced by removing eager-loaded Hypernative code that is now lazy-loaded.

**Why this priority**: Performance optimization is a secondary goal. The architecture migration provides value even without measurable bundle reduction.

**Independent Test**: Can be fully tested by running production build analysis before and after migration, comparing main bundle size.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** building the production bundle, **Then** a separate `hypernative-[hash].js` chunk exists
2. **Given** the Hypernative feature flag is disabled, **When** building the bundle, **Then** Hypernative component code is tree-shaken
3. **Given** a page that doesn't use Hypernative, **When** loading that page, **Then** the Hypernative chunk is not downloaded

---

### Edge Cases

- What happens when the feature flag changes state during a user session (enabled → disabled)?
- How does the system handle partial feature loading failures (network issues)?
- What happens if a consumer imports from an internal path (ESLint warning behavior)?
- How does the system handle concurrent lazy-load requests for the same feature?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST create a `contract.ts` file defining the public API surface with typed exports for components and services
- **FR-002**: System MUST create a `feature.ts` file that lazy-loads all components and services using direct imports (no nested `lazy()` calls)
- **FR-003**: System MUST create an `index.ts` file that exports the feature handle and all public hooks directly
- **FR-004**: System MUST maintain backward compatibility for all hook imports (`useIsHypernativeEligible`, `useHypernativeOAuth`, etc.)
- **FR-005**: System MUST register the hypernative feature flag mapping in `FEATURE_FLAG_MAPPING` (hypernative → FEATURES.HYPERNATIVE)
- **FR-006**: System MUST migrate all 44 consumer files to use the `useLoadFeature` pattern for components
- **FR-007**: System MUST preserve all store exports as direct imports (not lazy-loaded) per architecture rules
- **FR-008**: System MUST preserve OAuth helper functions (`savePkce`, `readPkce`, `clearPkce`) in the public API
- **FR-009**: System MUST ensure all components render null when feature is disabled (proxy stub behavior)
- **FR-010**: System MUST ensure services are undefined when feature is not ready (require `$isReady` check)
- **FR-011**: System MUST NOT include hooks in `feature.ts` (hooks exported directly from `index.ts` to avoid Rules of Hooks violations)
- **FR-012**: System MUST use flat structure in `feature.ts` (no nested categories like `components:` or `services:`)
- **FR-013**: System MUST update ESLint configuration to warn on direct imports from internal feature paths
- **FR-014**: System MUST preserve all existing test functionality with updated mocks for the new architecture

### Key Entities

- **HypernativeFeature**: The feature handle created via `createFeatureHandle<HypernativeContract>('hypernative')` that provides lazy-loaded access to components and services
- **HypernativeContract**: TypeScript interface defining the public API surface (9 components + 1 service)
- **Consumer Files**: The 44 files that import from the Hypernative feature and need migration to use `useLoadFeature`
- **Feature Configuration**: The config generated by the codemod tool at `.codemod/hypernative.config.json`

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 44 consumer files successfully migrated to use `useLoadFeature` pattern (0 direct internal imports remaining)
- **SC-002**: Zero breaking changes for safe-shield integration (all 11 safe-shield files work without modification to their hook usage)
- **SC-003**: OAuth authentication flow completes successfully end-to-end (login → callback → token stored)
- **SC-004**: All Hypernative banners display correctly in their respective contexts (dashboard, transactions, settings, queue)
- **SC-005**: Main application bundle reduced by removing Hypernative component code from initial load
- **SC-006**: Hypernative code properly tree-shaken when feature flag is disabled
- **SC-007**: All existing unit tests pass with updated mocks (30+ tests)
- **SC-008**: Zero ESLint errors related to feature architecture violations
- **SC-009**: Type-check passes with no errors in migrated files
- **SC-010**: Feature lazy-loads in under 200ms on standard network conditions

## Assumptions

- The `@/features/__core__` infrastructure with `createFeatureHandle` and `useLoadFeature` already exists and is stable
- The FEATURE_FLAG_MAPPING mechanism is already implemented in the codebase
- The codemod tool at `tools/codemods/migrate-feature` is functional and can be used to accelerate migration
- Existing HOC patterns (withHnFeature, withHnBannerConditions, withHnSignupFlow) will be preserved initially and optionally refactored to container components in a later phase
- The 44 consumer files have been identified through codemod analysis and represent the complete set of files requiring migration
