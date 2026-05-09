# Tasks: Migrate tx-builder to safe-wallet-monorepo

**Input**: Design documents from `/specs/001-migrate-tx-builder/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Required per FR-018 (migrate existing unit tests). Cypress E2E tests dropped - see Phase 4 notes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Source (migrate from)**: `safe-react-apps/apps/tx-builder/`
- **Target (migrate to)**: `apps/tx-builder/`
- **Workflows**: `.github/workflows/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create the Vite project structure and configuration files

- [x] T001 Create `apps/tx-builder/` directory structure per plan.md
- [x] T002 Create `apps/tx-builder/package.json` with name `@safe-global/tx-builder` and Vite dependencies
- [x] T003 [P] Create `apps/tx-builder/vite.config.ts` with React plugin and base path `/tx-builder/`
- [x] T004 [P] Create `apps/tx-builder/tsconfig.json` extending monorepo TypeScript config
- [x] T005 [P] Create `apps/tx-builder/index.html` (Vite entry point, moved from public/)
- [x] T006 [P] Create `apps/tx-builder/.env.example` with VITE\_\* environment variables template (skipped - gitignore)
- [x] T007 Copy `apps/tx-builder/public/manifest.json` from source (Safe App manifest)
- [x] T008 [P] Copy `apps/tx-builder/public/tx-builder.png` from source (app icon)

**Checkpoint**: Empty Vite project structure ready for source migration

---

## Phase 2: Foundational (Source Migration & Dependency Updates)

**Purpose**: Migrate source files and update all imports/dependencies - BLOCKS all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Core Source Migration

- [x] T009 Copy `apps/tx-builder/src/typings/` directory (type definitions)
- [x] T010 [P] Copy `apps/tx-builder/src/routes/` directory (route definitions)
- [x] T011 [P] Copy `apps/tx-builder/src/assets/` directory (SVGs, fonts)
- [x] T012 [P] Copy `apps/tx-builder/src/utils/` directory (utility functions)
- [x] T013 Copy `apps/tx-builder/src/lib/` directory (business logic, batches, simulation, storage)
- [x] T014 Copy `apps/tx-builder/src/hooks/` directory (custom React hooks)
- [x] T015 Copy `apps/tx-builder/src/store/` directory (React Context providers)

### 2.2 Component Migration

- [x] T016 Copy `apps/tx-builder/src/components/Icon/` directory
- [x] T017 [P] Copy `apps/tx-builder/src/components/FixedIcon/` directory
- [x] T018 [P] Copy `apps/tx-builder/src/components/buttons/` directory
- [x] T019 Copy `apps/tx-builder/src/components/forms/` directory (includes SolidityForm)
- [x] T020 [P] Copy `apps/tx-builder/src/components/modals/` directory
- [x] T021 Copy remaining `apps/tx-builder/src/components/*.tsx` files (Header, Card, Text, etc.)

### 2.3 Page Migration

- [x] T022 Copy `apps/tx-builder/src/pages/Dashboard.tsx`
- [x] T023 [P] Copy `apps/tx-builder/src/pages/CreateTransactions.tsx`
- [x] T024 [P] Copy `apps/tx-builder/src/pages/ReviewAndConfirm.tsx`
- [x] T025 [P] Copy `apps/tx-builder/src/pages/TransactionLibrary.tsx`
- [x] T026 [P] Copy `apps/tx-builder/src/pages/SaveTransactionLibrary.tsx`
- [x] T027 [P] Copy `apps/tx-builder/src/pages/EditTransactionLibrary.tsx`

### 2.4 Theme Migration

- [x] T028 Copy `apps/tx-builder/src/theme/` directory and update to MUI v6 createTheme API
- [x] T029 Update `apps/tx-builder/src/theme/safeTheme.ts` - ensure all imports use `@mui/material`

### 2.5 Entry Point Migration

- [x] T030 Create `apps/tx-builder/src/main.tsx` from source index.tsx (rename + React 19 createRoot)
- [x] T031 [P] Copy `apps/tx-builder/src/App.tsx` (router setup)
- [x] T032 [P] Create `apps/tx-builder/src/vite-env.d.ts` (Vite type declarations)
- [x] T033 [P] Copy `apps/tx-builder/src/global.ts` (global styles)

### 2.6 MUI v4 → v6 Import Updates (46 files)

- [x] T034 Update all `@material-ui/core` imports to `@mui/material` in `apps/tx-builder/src/components/`
- [x] T035 [P] Update all `@material-ui/icons` imports to `@mui/icons-material` in `apps/tx-builder/src/`
- [x] T036 [P] Update all `@material-ui/lab` imports to `@mui/lab` in `apps/tx-builder/src/`
- [x] T037 Replace deprecated `fade()` with `alpha()` in all theme/styling files (not needed - no fade() usage)

### 2.7 ethers v5 → v6 Updates (web3.js → ethers.js migration)

- [x] T038 Update ethers imports in `apps/tx-builder/src/lib/` (migrated from web3 to ethers v6)
- [x] T039 [P] Update ethers usage in `apps/tx-builder/src/hooks/` (updated useSimulation.ts)
- [x] T040 [P] Update web3 provider instantiation patterns throughout codebase (replaced Web3 with ethers BrowserProvider)

### 2.8 Environment Variable Updates

- [x] T041 Replace all `process.env.REACT_APP_*` with `import.meta.env.VITE_*` throughout codebase
- [x] T042 [P] Update `apps/tx-builder/src/lib/simulation/` for Tenderly env vars

### 2.9 Safe Apps SDK Update

- [x] T043 Update `@safe-global/safe-apps-sdk` usage to v9 API in `apps/tx-builder/src/` (SDK API compatible)
- [x] T044 [P] Update `@safe-global/safe-apps-react-sdk` SafeProvider usage (API compatible)

**Checkpoint**: All source migrated, imports updated - app should compile (may have runtime issues)

---

## Phase 3: User Story 1 - Developer Runs tx-builder Locally (Priority: P1) 🎯 MVP

**Goal**: Developer can run `yarn workspace @safe-global/tx-builder dev` and access the app locally

**Independent Test**: Run dev server, verify app loads at localhost:3000/tx-builder/

### Unit Test Migration for US1

- [x] T045 [P] [US1] Create `apps/tx-builder/src/test-utils.tsx` with React 19 + MUI v6 providers
- [x] T046 [P] [US1] Create `apps/tx-builder/src/mocks/handlers.ts` with MSW request handlers
- [x] T047 [P] [US1] Create `apps/tx-builder/jest.config.js` matching monorepo patterns
- [x] T048 [US1] Migrate `apps/tx-builder/src/utils/utils.test.ts` - update imports
- [x] T049 [P] [US1] Migrate `apps/tx-builder/src/lib/checksum.test.ts` - convert from .js to .ts
- [x] T050 [P] [US1] Migrate `apps/tx-builder/src/components/Header.test.tsx` - replace axios mock with MSW

### Implementation for US1

- [x] T051 [US1] Verify `yarn install` succeeds with tx-builder workspace
- [x] T052 [US1] Run `yarn workspace @safe-global/tx-builder dev` and fix any startup errors
- [x] T053 [US1] Verify hot reload works when editing a component
- [x] T054 [US1] Run `yarn workspace @safe-global/tx-builder type-check` and fix all type errors
- [x] T055 [US1] Run `yarn workspace @safe-global/tx-builder lint` and fix all lint errors
- [x] T056 [US1] Run `yarn workspace @safe-global/tx-builder prettier` and fix formatting
- [x] T057 [US1] Run `yarn workspace @safe-global/tx-builder test` and verify migrated tests pass
- [x] T058 [US1] Run `yarn workspace @safe-global/tx-builder build` and verify production build succeeds

**Checkpoint**: Local development fully functional - `dev`, `build`, `test`, `lint` all pass

---

## Phase 4: User Story 2 - User Creates and Executes Transaction Batches (Priority: P1)

**Goal**: Core tx-builder functionality works when loaded as Safe App

**Independent Test**: Load in Safe{Wallet}, create batch, submit transaction

### Unit Test Migration for US2

- [x] T059 [P] [US2] Migrate `apps/tx-builder/src/components/forms/SolidityForm.test.tsx` - update MUI selectors
- [x] T060 [P] [US2] Migrate `apps/tx-builder/src/components/forms/validations/validations.test.ts`
- [x] T061 [P] [US2] Migrate `apps/tx-builder/src/components/forms/fields/fields.test.ts`

### Cypress E2E Test Migration for US2

> **DROPPED**: The original Cypress E2E tests from safe-react-apps were outdated and incompatible with the current Safe{Wallet} UI. E2E testing should rely on the web app's existing Cypress suite which covers Safe Apps integration (`apps/web/cypress/e2e/safe-apps/`).

- [~] T062-T067 DROPPED - Original Cypress tests were outdated and non-functional

### Implementation Verification for US2

- [ ] T068 [US2] Test Safe Apps SDK connection in Safe{Wallet} iframe context (manual)
- [ ] T069 [US2] Verify contract ABI lookup works (Safe Gateway API integration)
- [ ] T070 [US2] Verify transaction batch creation flow works end-to-end
- [ ] T071 [US2] Verify batch save/load from transaction library works
- [ ] T072 [US2] Verify drag-and-drop reordering of transactions works
- [ ] T073 [US2] Verify batch export/import as JSON works
- [ ] T074 [US2] Verify Tenderly simulation integration works

**Checkpoint**: All core functionality works (manual verification)

---

## Phase 5: User Story 3 - CI/CD Pipeline Builds and Deploys (Priority: P2)

**Goal**: GitHub Actions workflow automatically builds and deploys tx-builder

**Independent Test**: Open PR, verify preview deployment, merge to dev, verify staging deployment

### Implementation for US3

- [x] T077 [US3] Create `.github/workflows/tx-builder-checks.yml` for PR checks (type-check, lint, test)
- [x] T078 [US3] Create `.github/workflows/tx-builder-deploy.yml` for deployment workflow
- [x] T079 [US3] Configure S3 bucket paths for tx-builder deployments (dev, staging, preview)
- [x] T080 [US3] Add PR comment action for preview deployment URL
- [x] T081 [US3] Configure path filters to only trigger on `apps/tx-builder/**` changes
- [~] T082 DROPPED - E2E tests handled by web app's existing Safe Apps Cypress suite
- [ ] T083 [US3] Test PR workflow - verify preview deployment created
- [ ] T084 [US3] Test dev branch workflow - verify staging deployment
- [x] T085 [US3] Configure production release workflow with versioning

**Checkpoint**: CI/CD fully automated for tx-builder

---

## Phase 6: User Story 4 - Developer Shares Code (Priority: P3)

**Goal**: tx-builder can use shared packages from the monorepo

**Independent Test**: Import utility from `@safe-global/utils`, verify it works

### Implementation for US4

- [ ] T086 [P] [US4] Add `@safe-global/utils` as dependency in `apps/tx-builder/package.json`
- [ ] T087 [P] [US4] Add `@safe-global/theme` as dependency in `apps/tx-builder/package.json`
- [ ] T088 [US4] Replace address validation utilities with `@safe-global/utils` equivalents
- [ ] T089 [US4] Evaluate theme token adoption from `@safe-global/theme` (optional enhancement)
- [ ] T090 [US4] Document shared package usage in `apps/tx-builder/README.md`

**Checkpoint**: Shared code integration working, documented

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation, and validation

- [x] T091 [P] Create `apps/tx-builder/README.md` with setup and development instructions
- [ ] T092 [P] Remove any CRA-specific files (config-overrides.js, react-app-env.d.ts)
- [ ] T093 [P] Remove hardhat contracts if not needed in monorepo context
- [ ] T094 Run full unit test suite: `yarn workspace @safe-global/tx-builder test`
- [ ] T095 Verify bundle size is within 20% of current production
- [ ] T096 Verify build time is under 3 minutes
- [ ] T097 Verify dev server starts in under 30 seconds
- [ ] T098 Run quickstart.md validation - follow setup steps from scratch
- [ ] T099 Final code review - ensure no `any` types, proper TypeScript throughout
- [ ] T100 Update monorepo root README.md to mention tx-builder workspace

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 - MVP validation
- **Phase 4 (US2)**: Depends on Phase 3 - Core functionality
- **Phase 5 (US3)**: Depends on Phase 4 - CI/CD (can start earlier if confident)
- **Phase 6 (US4)**: Depends on Phase 3 - Can run in parallel with US2/US3
- **Phase 7 (Polish)**: Depends on all prior phases

### User Story Dependencies

```
Phase 1 (Setup)
     ↓
Phase 2 (Foundational) ←── BLOCKS ALL
     ↓
Phase 3 (US1: Local Dev) ←── MVP
     ↓
Phase 4 (US2: Core Functionality)
     ↓
Phase 5 (US3: CI/CD)

Phase 6 (US4: Shared Code) ←── Can run after US1, parallel with US2/US3
```

### Parallel Opportunities

**Within Phase 1**:

- T003, T004, T005, T006, T008 can all run in parallel

**Within Phase 2**:

- T010, T011, T012, T016-T018, T020, T023-T027, T035-T036, T039-T040, T042, T044 marked [P]

**Within Phase 3 (US1)**:

- T045-T047, T049-T050 can run in parallel
- Tests should complete before implementation verification

**Within Phase 4 (US2)**:

- T059-T061, T063-T065 can run in parallel
- Cypress setup (T062-T067) before E2E verification (T068-T076)

**Within Phase 6 (US4)**:

- T086, T087 can run in parallel

---

## Parallel Example: Phase 2 Component Migration

```bash
# These can all run simultaneously:
Task T016: "Copy apps/tx-builder/src/components/Icon/ directory"
Task T017: "Copy apps/tx-builder/src/components/FixedIcon/ directory"
Task T018: "Copy apps/tx-builder/src/components/buttons/ directory"
Task T020: "Copy apps/tx-builder/src/components/modals/ directory"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (~8 tasks)
2. Complete Phase 2: Foundational (~36 tasks) ← **CRITICAL PATH**
3. Complete Phase 3: US1 Local Dev (~14 tasks)
4. **STOP and VALIDATE**: Verify local dev works end-to-end
5. Complete Phase 4: US2 Core Functionality (~18 tasks)
6. **STOP and VALIDATE**: Verify all E2E tests pass

### Incremental Delivery

1. **Setup + Foundational** → App compiles
2. **US1** → Local development works → Can demo locally
3. **US2** → Core functionality works → Can use in Safe{Wallet}
4. **US3** → CI/CD works → Can deploy automatically
5. **US4** → Shared code → Future enhancement

### Suggested MVP Scope

**Minimum for "migration complete"**: Phases 1-4 (US1 + US2)

- Total tasks: ~76
- Result: Fully functional tx-builder in monorepo with all tests passing

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps to user stories from spec.md
- Each user story checkpoint validates that story independently
- MUI v4 → v6 migration (Phase 2) is the highest-risk portion
- ethers v5 → v6 changes may require careful testing of transaction flows
- **Cypress E2E tests**: The original tests from safe-react-apps were outdated and incompatible with current Safe{Wallet}. E2E coverage is provided by the web app's existing Safe Apps Cypress suite at `apps/web/cypress/e2e/safe-apps/`
