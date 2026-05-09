# Feature Specification: Ledger Feature Architecture Refactor

**Feature Branch**: `002-ledger-refactor`  
**Created**: 2026-01-15  
**Status**: Draft  
**Input**: User description: "In 001-feature-architecture we created a feature pattern and refactored walletconnect to use it. I want to continue with the refactoring and refactor the ledger feature next."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Refactor Ledger Feature Structure (Priority: P1)

A developer working on the Safe{Wallet} codebase needs the ledger feature to conform to the established feature architecture pattern. The ledger feature currently has a minimal structure with only 3 files (index.ts, store.ts, LedgerHashComparison.tsx) and lacks proper organization into the standard folders (components/, hooks/, services/, store/, types.ts, constants.ts). The refactoring reorganizes the feature to match the walletconnect reference implementation.

**Why this priority**: This is the core structural refactoring that enables all other improvements. Without proper organization, lazy loading and proper public API patterns cannot be implemented.

**Independent Test**: Can be fully tested by verifying the directory structure matches the standard pattern, all existing functionality works, and all imports resolve correctly.

**Acceptance Scenarios**:

1. **Given** the current ledger feature with 3 files in flat structure, **When** refactored to standard pattern, **Then** the feature has folders for components/, hooks/, store/, and files for types.ts, constants.ts, and index.ts
2. **Given** the refactored structure, **When** ledger hash comparison dialog is triggered during transaction signing, **Then** the dialog displays correctly with the transaction hash
3. **Given** the refactored structure, **When** the application builds, **Then** all TypeScript types resolve and no import errors occur
4. **Given** the refactored structure, **When** existing tests run, **Then** all tests pass without modification

---

### User Story 2 - Implement Lazy Loading (Priority: P2)

The ledger hash comparison dialog needs to be loaded on-demand rather than included in the initial application bundle. This ensures users who don't use Ledger devices don't download unnecessary code. The component should only load when a Ledger transaction signing is initiated.

**Why this priority**: On-demand loading reduces initial application load time for all users and improves performance for users who never connect Ledger devices.

**Independent Test**: Can be fully tested by analyzing the build output to confirm a separate code bundle exists for the ledger feature and verifying it loads on-demand when triggered.

**Acceptance Scenarios**:

1. **Given** the application builds, **When** analyzing output bundles, **Then** a separate bundle exists for the ledger feature
2. **Given** a user loads the application, **When** the initial page loads, **Then** ledger feature code is not included in the initial download
3. **Given** a user connects a Ledger device, **When** signing a transaction, **Then** the ledger feature loads on-demand at that moment
4. **Given** the application server-renders pages, **When** pages are generated, **Then** no ledger code executes during server rendering

---

### User Story 3 - Update External Import (Priority: P3)

External code that uses ledger functionality currently imports internal implementation files. This needs to be updated to import only from the feature's public interface to comply with the architecture pattern.

**Why this priority**: Ensuring clear public interfaces prevents tight coupling and makes it easier to modify internal implementations without breaking external code.

**Independent Test**: Can be fully tested by running code quality checks and confirming no violations exist for ledger feature imports.

**Acceptance Scenarios**:

1. **Given** services that use ledger functionality, **When** importing ledger functions, **Then** imports use the public interface not internal files
2. **Given** the refactored imports, **When** code quality checks run, **Then** no "Import from feature index file only" violations appear for ledger
3. **Given** the public interface, **When** external code imports ledger functions, **Then** the functions work identically to before
4. **Given** the refactored structure, **When** the dialog state is empty, **Then** calling show/hide functions works correctly without errors

---

### Edge Cases

- What happens when the hash comparison is triggered multiple times rapidly? The display updates immediately, showing only the most recent hash. Previous dialogs are replaced without stacking.
- What happens when the dialog closes unexpectedly while a user is verifying the hash? The state management persists, but cleanup functions ensure stale dialogs don't remain. The dialog closure functions are called in transaction error and completion handlers.
- How does on-demand loading interact with the existing dynamic imports in the wallet integration service? Both patterns complement each other - the service dynamically imports state management functions, and the dialog component loads on-demand. Both are necessary for full code separation.
- What happens when a user switches blockchain networks while the dialog is open? The dialog closes because the transaction flow resets. Cleanup functions are called in error handlers and transaction completion handlers.
- What happens when the hash comparison is triggered but no Ledger device is connected? The dialog still displays the hash for verification. The dialog is informational only; device connection is handled by the wallet integration layer.

## Requirements _(mandatory)_

### Functional Requirements

**Directory Structure**

- **FR-001**: The ledger feature MUST have a standard folder structure with dedicated directories for components, hooks, state management, type definitions, and constants
- **FR-002**: The hash comparison dialog component MUST be moved into the components subdirectory with appropriate nesting
- **FR-003**: All type definitions used by the feature MUST be extracted to a dedicated types file
- **FR-004**: Feature-specific constants (if any) MUST be extracted to a dedicated constants file
- **FR-005**: The state management directory MUST contain a public interface file and implementation files with proper exports

**Lazy Loading**

- **FR-006**: The hash comparison dialog component MUST be loaded on-demand rather than in the initial application bundle
- **FR-007**: The on-demand loading MUST exclude the component from server-side rendering since it requires browser APIs
- **FR-008**: The feature's default export MUST be the on-demand loaded component
- **FR-009**: A separate code bundle MUST be created for the ledger feature in the build output

**Public API**

- **FR-010**: The public interface MUST export the on-demand loaded dialog component as the default export
- **FR-011**: The public interface MUST export functions to show and hide the hash comparison dialog
- **FR-012**: The public interface MUST export all relevant type definitions
- **FR-013**: Internal components, hooks, or utilities MUST NOT be directly importable from outside the feature

**External Import Compliance**

- **FR-014**: Wallet integration services MUST import from the feature's public interface not internal implementation files
- **FR-015**: Transaction flow components MUST import from the feature's public interface as designed
- **FR-016**: No other files in the codebase MUST import internal ledger feature files (enforced by automated checks)

**Backward Compatibility**

- **FR-017**: All existing functionality MUST work identically after refactoring
- **FR-018**: The ledger hash comparison dialog MUST appear during Ledger transaction signing
- **FR-019**: The dialog MUST close after successful signing or on error
- **FR-020**: All existing tests MUST pass without modification (or be updated to match new structure if paths changed)

### Key Entities

- **Hash Comparison Dialog**: A user interface element that displays a transaction hash for verification against the physical Ledger device screen during transaction signing. Controlled by feature state.
- **Hash State Store**: A state container that holds the current transaction hash (present or absent). When absent, the dialog is hidden; when present, the dialog displays that hash.
- **Show Hash Function**: An action that updates the hash state with a transaction hash, triggering the dialog to appear.
- **Hide Hash Function**: An action that clears the hash state, triggering the dialog to close.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The refactored ledger feature directory structure matches the documented standard pattern with 100% compliance
- **SC-002**: Code quality checks produce zero violations about restricted imports related to the ledger feature
- **SC-003**: All existing tests pass after refactoring with no changes to test behavior or assertions
- **SC-004**: Build output contains a separate code bundle for the ledger feature, confirming proper code separation
- **SC-005**: When the LEDGER feature flag is disabled, zero bytes of ledger feature code are loaded in the browser
- **SC-006**: The ledger hash comparison dialog appears within 500ms when triggered and the feature is enabled
- **SC-007**: Transaction signing flow with Ledger device completes successfully with the refactored feature (end-to-end test)
- **SC-008**: Code compilation produces zero type errors related to ledger feature imports or exports
- **SC-009**: The refactored feature can be used as a reference example for migrating other small features (2-5 files)
- **SC-010**: Initial page load bundle size does not increase after refactoring (ledger code remains code-split)

## Assumptions

- The current state management pattern is appropriate for this feature (no state management system migration needed)
- The existing dynamic import pattern in the wallet integration service is intentional and should be preserved
- No new feature functionality needs to be added; this is purely a structural refactoring
- The transaction flow component's import of the hash comparison dialog is the primary consumer and should remain as designed
- The dialog's positioning and styling do not need to change, only the component organization
- The ledger feature is always available (not behind a feature flag) as it is core hardware wallet functionality
