# Tasks: Migrate Hypernative Feature to Architecture v2

**Input**: Design documents from `/specs/002-migrate-hypernative/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Existing tests should continue to pass. No new tests explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Project root**: `apps/web/src/`
- **Feature folder**: `apps/web/src/features/hypernative/`
- **Core infrastructure**: `apps/web/src/features/__core__/`

---

## Phase 1: Setup (Feature Flag Mapping)

**Purpose**: Update core infrastructure to support hypernative feature handle

- [x] T001 Add `hypernative: FEATURES.HYPERNATIVE` to `FEATURE_FLAG_MAPPING` in `apps/web/src/features/__core__/createFeatureHandle.ts`

---

## Phase 2: Foundational (Feature Architecture Files)

**Purpose**: Create the three core architecture files that ALL user stories depend on

**⚠️ CRITICAL**: Consumer migration cannot begin until these files exist

- [x] T002 [P] Create contract type definitions in `apps/web/src/features/hypernative/contract.ts` with HypernativeImplementation and HypernativeContract interfaces using `typeof` pattern for all 14 components, 14 hooks, and 1 service
- [x] T003 [P] Create public types barrel export in `apps/web/src/features/hypernative/types.ts` re-exporting HypernativeAuthStatus, HypernativeEligibility, HypernativeGuardCheckResult, BannerType, and BannerVisibilityResult
- [x] T004 Create lazy-loaded feature implementation in `apps/web/src/features/hypernative/feature.ts` with components (using withSuspense + lazy), hooks, and services mapped to contract
- [x] T005 Create feature handle and public exports in `apps/web/src/features/hypernative/index.ts` exporting HypernativeFeature via createFeatureHandle, public types, and OAuth utilities (readPkce, clearPkce, HYPERNATIVE_OAUTH_CONFIG, getRedirectUri)

**Checkpoint**: Feature handle ready - consumer migration can now begin

---

## Phase 3: User Story 1+2 - Lazy Loading with Type Safety (Priority: P1) 🎯 MVP

**Goal**: Enable developers to access hypernative via `useLoadFeature(HypernativeFeature)` with full TypeScript inference

**Independent Test**: Import `HypernativeFeature` from `@/features/hypernative`, call `useLoadFeature()`, verify components/hooks/services are accessible with autocomplete

### Implementation for User Story 1+2

- [x] T006 [US1] Verify feature handle exports correctly by creating a test import in a scratch file, confirm TypeScript resolves HypernativeFeature, HypernativeContract types
- [x] T007 [US1] Verify `useLoadFeature(HypernativeFeature)` returns correct types by checking TypeScript inference on `.components`, `.hooks`, `.services`
- [x] T008 [US1] Verify IDE navigation (Cmd+click) from contract types jumps to implementation files
- [x] T009 [US1] Run `yarn workspace @safe-global/web type-check` to confirm no TypeScript errors

**Checkpoint**: User Story 1+2 complete - Feature handle is type-safe and lazy-loadable

---

## Phase 4: User Story 3 - Update Consumer Code (Priority: P2)

**Goal**: Migrate all external consumers (~15 files) to use `useLoadFeature(HypernativeFeature)` pattern

**Independent Test**: Run ESLint with no warnings for restricted imports from hypernative internal folders

### Implementation for User Story 3 - Pages

- [x] T010 [P] [US3] Migrate `apps/web/src/pages/transactions/history.tsx` to use useLoadFeature pattern for useBannerVisibility, BannerType, HnBannerForHistory
- [x] T011 [P] [US3] Migrate `apps/web/src/pages/transactions/queue.tsx` to use useLoadFeature pattern for HnLoginCard, HnBannerForQueue, QueueAssessmentProvider, useIsHypernativeEligible, useIsHypernativeQueueScanFeature, useBannerVisibility, BannerType
- [x] T012 [P] [US3] Migrate `apps/web/src/pages/hypernative/oauth-callback.tsx` to use direct exports (readPkce, clearPkce, HYPERNATIVE_OAUTH_CONFIG, getRedirectUri) and useLoadFeature for useAuthToken

### Implementation for User Story 3 - Dashboard Components

- [x] T013 [P] [US3] Migrate `apps/web/src/components/dashboard/index.tsx` to use useLoadFeature pattern for useBannerVisibility, BannerType, HnBannerForCarousel, hnBannerID, HnPendingBanner
- [x] T014 [P] [US3] Migrate `apps/web/src/components/dashboard/FirstSteps/index.tsx` to use useLoadFeature pattern for HnDashboardBannerWithNoBalanceCheck, BannerType, useBannerVisibility

### Implementation for User Story 3 - Transaction Components

- [x] T015 [P] [US3] Migrate `apps/web/src/components/tx-flow/flows/NewTx/index.tsx` to use useLoadFeature pattern for HnMiniTxBanner
- [x] T016 [P] [US3] Migrate `apps/web/src/components/transactions/TxSummary/index.tsx` to use useLoadFeature pattern for HnQueueAssessment, useQueueAssessment, useShowHypernativeAssessment, useHypernativeOAuth
- [x] T017 [P] [US3] Migrate `apps/web/src/components/transactions/TxDetails/index.tsx` to use useLoadFeature pattern for HnQueueAssessmentBanner, useQueueAssessment, useShowHypernativeAssessment, useHypernativeOAuth

### Implementation for User Story 3 - Other Components

- [x] T018 [P] [US3] Migrate `apps/web/src/components/settings/SecurityLogin/index.tsx` to use useLoadFeature pattern for HnBannerForSettings, HnActivatedBannerForSettings
- [x] T019 [P] [US3] Migrate `apps/web/src/components/sidebar/SidebarHeader/SafeHeaderInfo.tsx` to use useLoadFeature pattern for useIsHypernativeGuard
- [x] T020 [P] [US3] Migrate `apps/web/src/components/common/EthHashInfo/SrcEthHashInfo/index.tsx` to use useLoadFeature pattern for HypernativeTooltip

### Implementation for User Story 3 - Safe-Shield Feature

- [x] T021 [P] [US3] Migrate `apps/web/src/features/safe-shield/index.tsx` to use useLoadFeature pattern for useHypernativeOAuth, useIsHypernativeEligible
- [x] T022 [P] [US3] Migrate `apps/web/src/features/safe-shield/SafeShieldContext.tsx` to use useLoadFeature pattern for useAuthToken
- [x] T023 [P] [US3] Migrate `apps/web/src/features/safe-shield/hooks/useThreatAnalysis.ts` to use useLoadFeature pattern for useIsHypernativeEligible
- [x] T024 [P] [US3] Migrate `apps/web/src/features/safe-shield/hooks/useNestedThreatAnalysis.ts` to use useLoadFeature pattern for useIsHypernativeEligible
- [x] T025 [P] [US3] Update `apps/web/src/features/safe-shield/components/HypernativeInfo/index.tsx` to import HypernativeAuthStatus from @/features/hypernative types and use useLoadFeature for HypernativeTooltip
- [x] T026 [P] [US3] Update `apps/web/src/features/safe-shield/components/AnalysisGroupCard/AnalysisGroupCard.tsx` to use useLoadFeature pattern for HypernativeLogo
- [x] T027 [P] [US3] Update safe-shield component type imports (ThreatAnalysis, SafeShieldContent, SafeShieldDisplay, HypernativeCustomChecks) to import HypernativeAuthStatus from @/features/hypernative

**Checkpoint**: User Story 3 complete - All external consumers use feature handle pattern

---

## Phase 5: User Story 4 - Redux Store Integration (Priority: P2)

**Goal**: Verify Redux store integration continues working correctly

**Independent Test**: Verify store imports work from `@/features/hypernative/store`, dispatch actions, read state

### Implementation for User Story 4

- [x] T028 [US4] Verify `apps/web/src/store/slices.ts` continues to re-export from `@/features/hypernative/store` without changes
- [x] T029 [US4] Verify Redux selectors (selectHnState, selectSafeHnState) return correct state shape
- [x] T030 [US4] Verify Redux actions (setBannerDismissed, setFormCompleted, setPendingBannerDismissed, setBannerEligibilityTracked) dispatch correctly

**Checkpoint**: User Story 4 complete - Redux integration unchanged

---

## Phase 6: User Story 5 - Tests Pass (Priority: P3)

**Goal**: All existing hypernative tests pass after migration

**Independent Test**: Run `yarn workspace @safe-global/web test -- --testPathPattern="hypernative"`

### Implementation for User Story 5

- [x] T031 [US5] Run existing hypernative feature tests and identify any failures
- [x] T032 [US5] Update test mocks in `apps/web/src/components/settings/__tests__/SecurityLogin.test.tsx` if needed for new import pattern
- [x] T033 [US5] Update test mocks in `apps/web/src/features/safe-shield/__tests__/*.test.tsx` if needed for useLoadFeature pattern
- [x] T034 [US5] Update test mocks in `apps/web/src/features/hypernative/**/__tests__/*.test.tsx` if needed for internal restructuring
- [x] T035 [US5] Verify all hypernative tests pass: `yarn workspace @safe-global/web test -- --testPathPattern="hypernative"`

**Checkpoint**: User Story 5 complete - All tests pass

---

## Phase 7: Polish & Validation

**Purpose**: Final validation and cleanup

- [x] T036 Run full type-check: `yarn workspace @safe-global/web type-check`
- [x] T037 Run linter: `yarn workspace @safe-global/web lint`
- [x] T038 Run all tests: `yarn workspace @safe-global/web test -- --testPathPattern="hypernative|safe-shield"`
- [ ] T039 Verify feature loads lazily by checking bundle analysis (hypernative code not in main chunk when flag disabled)
- [ ] T040 Update `apps/web/src/features/hypernative/README.md` with new usage patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user story work
- **Phase 3 (US1+2)**: Depends on Phase 2 - Validates feature handle works
- **Phase 4 (US3)**: Depends on Phase 2 - Can run parallel with Phase 3
- **Phase 5 (US4)**: Depends on Phase 2 - Can run parallel with Phase 3/4
- **Phase 6 (US5)**: Depends on Phases 3-5 - Tests verify everything works
- **Phase 7 (Polish)**: Depends on all user stories complete

### User Story Dependencies

| Story      | Depends On   | Can Start After     |
| ---------- | ------------ | ------------------- |
| US1+2 (P1) | Foundational | Phase 2 complete    |
| US3 (P2)   | Foundational | Phase 2 complete    |
| US4 (P2)   | Foundational | Phase 2 complete    |
| US5 (P3)   | US1-4        | Phases 3-5 complete |

### Parallel Opportunities

**Phase 2 (Foundational)**:

- T002, T003 can run in parallel (different files)
- T004 depends on T002 (uses contract types)
- T005 depends on T004 (exports feature.ts default)

**Phase 4 (Consumer Migration)**: ALL tasks T010-T027 can run in parallel (different files)

---

## Parallel Example: Consumer Migration

```bash
# Launch all page migrations together:
Task: T010 - Migrate pages/transactions/history.tsx
Task: T011 - Migrate pages/transactions/queue.tsx
Task: T012 - Migrate pages/hypernative/oauth-callback.tsx

# Launch all dashboard migrations together:
Task: T013 - Migrate components/dashboard/index.tsx
Task: T014 - Migrate components/dashboard/FirstSteps/index.tsx

# Launch all transaction component migrations together:
Task: T015 - Migrate components/tx-flow/flows/NewTx/index.tsx
Task: T016 - Migrate components/transactions/TxSummary/index.tsx
Task: T017 - Migrate components/transactions/TxDetails/index.tsx

# Launch all safe-shield migrations together:
Task: T021-T027 - All safe-shield file updates
```

---

## Implementation Strategy

### MVP First (User Story 1+2 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T005)
3. Complete Phase 3: User Story 1+2 (T006-T009)
4. **STOP and VALIDATE**: Feature handle works, types resolve correctly
5. Feature is now usable (though consumers still use old pattern)

### Incremental Delivery

1. Setup + Foundational → Feature handle exists
2. Add US1+2 → Feature handle verified type-safe
3. Add US3 → All consumers migrated (biggest phase)
4. Add US4 → Redux verified working
5. Add US5 → All tests pass
6. Polish → Final validation

### Parallel Team Strategy

With multiple developers after Foundational completes:

- Developer A: US3 consumer migrations (pages)
- Developer B: US3 consumer migrations (components)
- Developer C: US3 consumer migrations (safe-shield)
- All verify against US4 (Redux) and US5 (tests) at end

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story
- US1 and US2 combined because type safety is achieved through correct contract implementation
- Consumer migration (US3) is the largest phase with 18 parallel tasks
- Store re-export (slices.ts) intentionally unchanged per FR-006
- OAuth utilities exported directly for synchronous access (special case)
- Commit after each task or logical group
- Run type-check frequently during migration
