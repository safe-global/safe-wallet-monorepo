# Feature Specification: Migrate tx-builder to safe-wallet-monorepo

**Feature Branch**: `001-migrate-tx-builder`  
**Created**: 2026-01-12  
**Status**: Draft  
**Input**: User description: "Move tx-builder app from safe-react-apps repo to apps package within safe-wallet-monorepo, update dependencies to match monorepo versions, design deployment workflow"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Developer Runs tx-builder Locally (Priority: P1)

A developer clones the safe-wallet-monorepo and wants to run the tx-builder app locally for development or testing purposes.

**Why this priority**: Without local development capability, no other work can proceed. This validates the migration foundation.

**Independent Test**: Can be fully tested by running `yarn workspace @safe-global/tx-builder dev` and verifying the app loads in a browser at localhost.

**Acceptance Scenarios**:

1. **Given** a fresh clone of safe-wallet-monorepo with dependencies installed, **When** the developer runs the tx-builder dev command, **Then** the app starts and is accessible in the browser within 30 seconds.
2. **Given** the tx-builder is running locally, **When** a developer makes a code change, **Then** the change is reflected in the browser via hot reload.
3. **Given** the tx-builder is running locally, **When** loaded in a Safe App iframe context (via Safe{Wallet}), **Then** the Safe Apps SDK connection initializes successfully.

---

### User Story 2 - User Creates and Executes Transaction Batches (Priority: P1)

A Safe owner uses tx-builder to create a batch of transactions, review them, and submit them for execution through their Safe.

**Why this priority**: This is the core functionality of tx-builder. If this doesn't work, the migration has failed.

**Independent Test**: Load tx-builder as a Safe App, create a batch with multiple transactions, and submit to the Safe for signing.

**Acceptance Scenarios**:

1. **Given** a user has loaded tx-builder in Safe{Wallet}, **When** they add a contract interaction to a batch, **Then** the transaction appears in the batch list with correct parameters displayed.
2. **Given** a user has a batch with multiple transactions, **When** they click submit/execute, **Then** the batch is sent to the Safe for signing and execution.
3. **Given** a user has created a batch, **When** they save it to their transaction library, **Then** the batch persists across browser sessions.

---

### User Story 3 - CI/CD Pipeline Builds and Deploys tx-builder (Priority: P2)

A maintainer merges a PR affecting tx-builder, and the CI/CD pipeline automatically builds and deploys the app to the appropriate environment.

**Why this priority**: Automated deployment is essential for sustainable maintenance, but can be set up after core functionality works.

**Independent Test**: Create a PR with tx-builder changes, verify preview deployment, merge to dev branch, verify staging deployment.

**Acceptance Scenarios**:

1. **Given** a PR with tx-builder changes, **When** the PR is opened, **Then** a preview deployment is created and linked in the PR comments.
2. **Given** a merged PR to the dev branch, **When** the CI workflow completes, **Then** tx-builder is deployed to the development environment.
3. **Given** a release is triggered, **When** the production workflow runs, **Then** tx-builder is deployed to production with appropriate versioning.

---

### User Story 4 - Developer Shares Code Between tx-builder and Web App (Priority: P3)

A developer wants to use shared utilities, theme tokens, or components from the monorepo's packages in tx-builder.

**Why this priority**: Code sharing is a key benefit of monorepo migration but not required for initial launch.

**Independent Test**: Import a utility from `@safe-global/utils` or theme from `@safe-global/theme` in tx-builder and verify it works.

**Acceptance Scenarios**:

1. **Given** a shared utility exists in packages/utils, **When** imported in tx-builder, **Then** it compiles and functions correctly.
2. **Given** the unified theme package exists, **When** tx-builder uses theme tokens, **Then** the styling matches the monorepo's design system.

---

### Edge Cases

- What happens when the Safe Apps SDK fails to initialize? (tx-builder should show an error state with retry option)
- How does tx-builder handle being loaded outside a Safe App context? (should display informative error or redirect)
- What happens when a saved batch references a contract that no longer exists? (graceful error handling)
- How does the build handle missing environment variables? (build should fail fast with clear error messages)

## Requirements _(mandatory)_

### Functional Requirements

**Migration & Setup**:

- **FR-001**: tx-builder MUST be added as a workspace package at `apps/tx-builder` with package name `@safe-global/tx-builder`
- **FR-002**: tx-builder MUST use React 19.x as specified in the monorepo root
- **FR-003**: tx-builder MUST use MUI v6 (`@mui/material`) instead of Material UI v4 (`@material-ui/core`)
- **FR-004**: tx-builder MUST use ethers v6 instead of ethers v5
- **FR-005**: tx-builder MUST use TypeScript 5.x matching the monorepo
- **FR-006**: tx-builder MUST pass all monorepo quality gates (type-check, lint, prettier, test)

**Core Functionality Preservation**:

- **FR-007**: Users MUST be able to create transaction batches by adding contract interactions
- **FR-008**: Users MUST be able to import contract ABIs via address lookup or manual entry
- **FR-009**: Users MUST be able to save and load transaction batches (transaction library)
- **FR-010**: Users MUST be able to simulate transactions before execution (Tenderly integration)
- **FR-011**: Users MUST be able to export/import batches as JSON files
- **FR-012**: System MUST support drag-and-drop reordering of transactions in a batch

**Deployment**:

- **FR-013**: A GitHub Actions workflow MUST build tx-builder on PRs and pushes to dev/main
- **FR-014**: PR deployments MUST create preview URLs accessible for testing
- **FR-015**: Production releases MUST be versioned and trigger deployment to production CDN
- **FR-016**: Deployment MUST be independent from web app deployment (tx-builder can release separately)

**Environment Configuration**:

- **FR-017**: Environment variables MUST use `VITE_*` prefix (Vite bundler chosen for standalone SPA)

**Testing**:

- **FR-018**: All existing unit tests (6 files) MUST be migrated and pass
- **FR-019**: All existing Cypress E2E tests (17 test cases) MUST be migrated and pass
- **FR-020**: Test infrastructure MUST use MSW for network mocking (per monorepo constitution)
- **FR-021**: Cypress tests MUST be runnable against local dev server and CI environments

### Key Entities

- **Transaction**: A single contract call with target address, method, parameters, and value
- **Batch**: An ordered collection of transactions to be executed as a multi-send
- **Transaction Library**: User's saved collection of reusable batches, persisted in browser storage
- **Contract ABI**: Interface definition for contract interaction, fetched or manually provided

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All existing tx-builder functionality works identically after migration (100% feature parity)
- **SC-002**: tx-builder build completes in under 3 minutes on CI
- **SC-003**: tx-builder bundle size does not increase by more than 20% compared to current production
- **SC-004**: All existing tests pass after migration to new dependency versions
- **SC-005**: Local development server starts in under 30 seconds
- **SC-006**: Preview deployments are available within 10 minutes of PR creation
- **SC-007**: Zero regressions in user-facing functionality as validated by existing Cypress tests

## Assumptions

- tx-builder will remain a standalone SPA (not integrated into Next.js web app) since it runs as a Safe App in an iframe
- The bundler will be Vite (replacing CRA/react-scripts) for better performance, modern tooling, and active maintenance
- Existing component logic can be preserved while updating styling from MUI v4 to v6
- The hardhat contracts for testing can be retained or removed based on actual usage
- S3 deployment infrastructure already exists and can be reused with appropriate bucket configuration
