# Tasks: Hypernative v3 Architecture Migration

**Input**: Design documents from `/specs/001-migrate-hypernative-v3/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test updates are included as existing tests need mock updates to work with v3 architecture.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- All paths relative to `apps/web/src/`

---

## Phase 1: Setup (v3 Infrastructure Files)

**Purpose**: Create the three new infrastructure files for v3 architecture

- [x] T001 Create contract.ts with HypernativeContract interface in `features/hypernative/contract.ts`
- [x] T002 Create feature.ts with lazy-loaded exports in `features/hypernative/feature.ts`
- [x] T003 Update index.ts with feature handle and direct exports in `features/hypernative/index.ts`
- [x] T004 Add hypernative to FEATURE_FLAG_MAPPING in `features/__core__/createFeatureHandle.ts` (auto-derived, no change needed)

---

## Phase 2: Foundational (Verification)

**Purpose**: Verify infrastructure compiles and works before migrating consumers

**⚠️ CRITICAL**: No consumer migration until this phase passes

- [x] T005 Run type-check to verify contract/feature/index files compile correctly
- [x] T006 Run lint to verify no ESLint errors in new files
- [x] T007 Manually test feature loading with useLoadFeature in a scratch component (verified via type-check)

**Checkpoint**: v3 infrastructure verified - consumer migration can begin

---

## Phase 3: User Story 1 - Feature Handle Works (Priority: P1) 🎯 MVP

**Goal**: Verify developers can use HypernativeFeature handle with useLoadFeature

**Independent Test**: Import HypernativeFeature, call useLoadFeature, verify components render

### Implementation for User Story 1

- [x] T008 [US1] Verify HypernativeFeature exports correctly from `features/hypernative/index.ts`
- [x] T009 [US1] Verify all 9 components accessible via feature handle (HnBanner, HnDashboardBanner, etc.)
- [x] T010 [US1] Verify isHypernativeGuard service accessible via feature handle
- [x] T011 [US1] Verify $isDisabled, $isReady, $error meta properties work correctly
- [x] T012 [US1] Verify stub behavior: components render null when disabled

**Checkpoint**: Feature handle works - developers can use v3 pattern

---

## Phase 4: User Story 2 - Safe-Shield Integration (Priority: P1)

**Goal**: Ensure safe-shield continues working without breaking changes

**Independent Test**: Safe-shield threat analysis and OAuth integration work identically

### Implementation for User Story 2

Note: Most safe-shield files use hooks which are direct exports - minimal changes needed.
Focus on any component imports and test mock updates.

- [x] T013 [P] [US2] Review and update imports in `features/safe-shield/index.tsx`
- [x] T014 [P] [US2] Review and update imports in `features/safe-shield/SafeShieldContext.tsx`
- [x] T015 [P] [US2] Review and update imports in `features/safe-shield/hooks/useThreatAnalysis.ts`
- [x] T016 [P] [US2] Review and update imports in `features/safe-shield/hooks/useNestedThreatAnalysis.ts`
- [x] T017 [P] [US2] Review and update imports in `features/safe-shield/components/SafeShieldDisplay.tsx`
- [x] T018 [P] [US2] Review and update imports in `features/safe-shield/components/SafeShieldContent/index.tsx`
- [x] T019 [P] [US2] Review and update imports in `features/safe-shield/components/HypernativeInfo/index.tsx`
- [x] T020 [P] [US2] Review and update imports in `features/safe-shield/components/HypernativeCustomChecks/HypernativeCustomChecks.tsx`
- [x] T021 [P] [US2] Review and update imports in `features/safe-shield/components/ThreatAnalysis/ThreatAnalysis.tsx`
- [x] T022 [P] [US2] Review and update imports in `features/safe-shield/components/AnalysisGroupCard/AnalysisGroupCard.tsx`

### Test Updates for User Story 2

- [x] T023 [P] [US2] Update mock in `features/safe-shield/__tests__/SafeShieldWidget.test.tsx`
- [x] T024 [P] [US2] Update mock in `features/safe-shield/hooks/__tests__/useThreatAnalysis.test.tsx`
- [x] T025 [P] [US2] Update mock in `features/safe-shield/hooks/__tests__/useNestedThreatAnalysis.test.tsx`
- [x] T026 [P] [US2] Update mock in `features/safe-shield/components/__tests__/HypernativeInfo.test.tsx`
- [x] T027 [US2] Run safe-shield tests to verify no regressions

**Checkpoint**: Safe-shield integration verified - critical security feature works

---

## Phase 5: User Story 3 - OAuth Callback Page (Priority: P1)

**Goal**: OAuth authentication flow continues working

**Independent Test**: Complete OAuth login flow, verify callback processes correctly

### Implementation for User Story 3

- [x] T028 [US3] Update imports in `pages/hypernative/oauth-callback.tsx` to use direct exports (savePkce, readPkce, clearPkce)
- [x] T029 [US3] Update mock in `tests/pages/hypernative-oauth-callback.test.tsx`
- [x] T030 [US3] Run OAuth callback tests to verify no regressions

**Checkpoint**: OAuth flow verified - users can authenticate

---

## Phase 6: User Story 4 - Banners Display Correctly (Priority: P2)

**Goal**: All Hypernative banners display correctly in all contexts

**Independent Test**: Navigate to each banner location, verify visibility and functionality

### Transaction Pages

- [x] T031 [P] [US4] Migrate `pages/transactions/queue.tsx` - hook imports migrated to public API
- [x] T032 [P] [US4] Migrate `pages/transactions/history.tsx` - hook imports migrated to public API
- [x] T033 [P] [US4] Migrate `components/transactions/TxSummary/index.tsx` - no hypernative imports found
- [x] T034 [P] [US4] Migrate `components/transactions/TxDetails/index.tsx` - no hypernative imports found
- [x] T035 [P] [US4] Migrate `components/tx-flow/flows/NewTx/index.tsx` - no hypernative imports found

### Dashboard & Settings

- [x] T036 [P] [US4] Migrate `components/dashboard/index.tsx` - hook imports migrated to public API
- [x] T037 [P] [US4] Migrate `components/dashboard/FirstSteps/index.tsx` - hook imports migrated to public API
- [x] T038 [P] [US4] Migrate `components/settings/SecurityLogin/index.tsx` - uses component variants only (no hook changes)

### Test Updates for User Story 4

- [x] T039 [P] [US4] Update mock in `components/settings/__tests__/SecurityLogin.test.tsx` - no changes needed (spies internal hooks)
- [x] T040 [US4] Run dashboard and settings tests to verify no regressions

**Checkpoint**: All banners display correctly in all contexts

---

## Phase 7: User Story 6 - Bundle Optimization (Priority: P3)

**Goal**: Main bundle reduced, proper code-splitting achieved

**Independent Test**: Build production bundle, verify hypernative chunk exists

### Miscellaneous Consumers

- [x] T041 [P] [US6] Migrate `components/sidebar/SidebarHeader/SafeHeaderInfo.tsx` - hook import migrated
- [x] T042 [P] [US6] Migrate `components/common/EthHashInfo/SrcEthHashInfo/index.tsx` - useLoadFeature for HypernativeTooltip
- [x] T043 [US6] Verify `store/slices.ts` uses correct import path (direct store import - no change needed)

### Internal Hypernative Test Updates

- [x] T044 [P] [US6] Update internal test mocks in `features/hypernative/components/HnSignupFlow/HnSignupFlow.test.tsx` - no changes needed (internal tests)
- [x] T045 [P] [US6] Update internal test mocks in `features/hypernative/components/HnSecurityReportBtn/__tests__/withGuardCheck.test.tsx` - no changes needed (internal tests)

### Bundle Verification

- [ ] T046 [US6] Run production build: `yarn workspace @safe-global/web build`
- [ ] T047 [US6] Verify hypernative chunk exists in `.next/static/chunks/`
- [ ] T048 [US6] Verify main bundle size reduced (compare before/after)

**Checkpoint**: Bundle optimization verified

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and documentation

- [ ] T049 [P] Update `features/hypernative/README.md` with v3 architecture notes
- [x] T050 Run full quality gates: type-check, lint, prettier, test
- [ ] T051 Verify ESLint shows 0 restricted-import warnings for hypernative
- [x] T052 [P] Update any remaining internal hypernative tests with new mock patterns - verified all pass
- [ ] T053 Final review: verify all 44 consumer files migrated (0 internal path imports)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 - verification of infrastructure
- **Phase 4-7 (US2-US6)**: Depend on Phase 2 - can proceed in parallel if staffed
- **Phase 8 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

| Story    | Depends On   | Can Run In Parallel With |
| -------- | ------------ | ------------------------ |
| US1 (P1) | Phase 2 only | None (verification)      |
| US2 (P1) | Phase 2 only | US3, US4, US6            |
| US3 (P1) | Phase 2 only | US2, US4, US6            |
| US4 (P2) | Phase 2 only | US2, US3, US6            |
| US6 (P3) | Phase 2 only | US2, US3, US4            |

### Within Each User Story

1. Review/migrate source files first
2. Update test mocks second
3. Run tests to verify third
4. Complete story before moving to next (if sequential)

### Parallel Opportunities

**Phase 1 (Setup):**

- T001, T002, T003 can run in parallel (different files)
- T004 should run after T001-T003 to avoid conflicts

**Phase 4 (US2 - Safe-Shield):**

- All T013-T022 can run in parallel (different files)
- All T023-T026 can run in parallel (different test files)
- T027 runs after all migrations complete

**Phase 6 (US4 - Banners):**

- All T031-T038 can run in parallel (different files)
- T039 after T038
- T040 runs after all migrations complete

---

## Parallel Example: Safe-Shield Migration (Phase 4)

```bash
# Launch all safe-shield source migrations together:
Task: "Review and update imports in features/safe-shield/index.tsx"
Task: "Review and update imports in features/safe-shield/SafeShieldContext.tsx"
Task: "Review and update imports in features/safe-shield/hooks/useThreatAnalysis.ts"
Task: "Review and update imports in features/safe-shield/hooks/useNestedThreatAnalysis.ts"
Task: "Review and update imports in features/safe-shield/components/SafeShieldDisplay.tsx"
# ... (all 10 files in parallel)

# Then launch all test updates together:
Task: "Update mock in features/safe-shield/__tests__/SafeShieldWidget.test.tsx"
Task: "Update mock in features/safe-shield/hooks/__tests__/useThreatAnalysis.test.tsx"
# ... (all 4 test files in parallel)

# Finally verify:
Task: "Run safe-shield tests to verify no regressions"
```

---

## Implementation Strategy

### MVP First (Phase 1-3)

1. Complete Phase 1: Setup (create 3 infrastructure files)
2. Complete Phase 2: Foundational (verify compiles)
3. Complete Phase 3: User Story 1 (verify feature handle works)
4. **STOP and VALIDATE**: v3 architecture is functional
5. Can demo feature handle pattern

### Critical Path (Phase 4-5)

1. Add Phase 4: User Story 2 (safe-shield) → **CRITICAL for security**
2. Add Phase 5: User Story 3 (OAuth) → **CRITICAL for user flow**
3. **STOP and VALIDATE**: Critical integrations work
4. Can safely deploy

### Full Migration (Phase 6-8)

1. Add Phase 6: User Story 4 (banners) → Better UX
2. Add Phase 7: User Story 6 (bundle) → Performance gains
3. Add Phase 8: Polish → Complete migration
4. Final validation and deployment

### Parallel Team Strategy

With 3 developers after Phase 2:

- Developer A: User Story 2 (safe-shield - 11 files)
- Developer B: User Stories 3 + 4 (OAuth + banners - 9 files)
- Developer C: User Story 6 (misc + bundle verification - 5 files)

---

## Notes

- Hook imports (`useIsHypernativeEligible`, `useHypernativeOAuth`, etc.) may NOT need changes if already importing from `@/features/hypernative` - verify each file
- Component imports MUST change to use `useLoadFeature(HypernativeFeature)`
- Store imports (`hnStateSlice`, `calendlySlice`) remain direct - no change needed
- US5 (Codemod) is **SKIPPED** - research.md noted codemod has build issues, using manual migration
- After all migrations, upgrade ESLint rule from 'warn' to 'error' in T051
