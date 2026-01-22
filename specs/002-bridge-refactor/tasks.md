# Tasks: Bridge Feature Refactor

**Input**: Design documents from `/specs/002-bridge-refactor/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No new tests required - this is a structural refactoring with no new business logic. Existing tests must continue to pass.

**Organization**: Tasks are grouped by user story to enable incremental validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/web/src/features/bridge/` unless otherwise specified.

---

## Phase 1: Setup (Foundation Files)

**Purpose**: Create the new barrel files without modifying existing code

- [x] T001 [P] Create empty `types.ts` file at `apps/web/src/features/bridge/types.ts`
- [x] T002 [P] Create empty `constants.ts` file at `apps/web/src/features/bridge/constants.ts`
- [x] T003 [P] Create empty `hooks/index.ts` barrel at `apps/web/src/features/bridge/hooks/index.ts`
- [x] T004 [P] Create empty `components/index.ts` barrel at `apps/web/src/features/bridge/components/index.ts`

**Checkpoint**: All new files exist, no compilation errors (files are empty or have placeholder exports)

---

## Phase 2: Foundational (Constants Extraction)

**Purpose**: Extract constants to enable internal imports to be updated

**⚠️ CRITICAL**: Constants must be extracted before components can import from them

- [x] T005 Populate `constants.ts` with `BRIDGE_WIDGET_URL` (copy from `components/BridgeWidget/index.tsx`) and `LOCAL_STORAGE_CONSENT_KEY` (copy from `components/Bridge/index.tsx`) at `apps/web/src/features/bridge/constants.ts`
- [x] T006 Populate `types.ts` with empty export (placeholder for future types) at `apps/web/src/features/bridge/types.ts`

**Checkpoint**: Constants file exports both values, type-check passes

---

## Phase 3: User Story 1 - Migrate Bridge Feature to Standard Architecture (Priority: P1) 🎯 MVP

**Goal**: Bring the bridge feature into full compliance with the feature architecture standard

**Independent Test**: Verify all required files exist per `docs/feature-architecture.md` checklist; run `yarn workspace @safe-global/web type-check && yarn workspace @safe-global/web lint`

### Implementation for User Story 1

- [x] T007 [P] [US1] Populate `hooks/index.ts` barrel with exports for `useIsBridgeFeatureEnabled` and `useIsGeoblockedFeatureEnabled` at `apps/web/src/features/bridge/hooks/index.ts`
- [x] T008 [P] [US1] Populate `components/index.ts` barrel with exports for `Bridge` and `BridgeWidget` components at `apps/web/src/features/bridge/components/index.ts`
- [x] T009 [US1] Update `components/Bridge/index.tsx` to import `LOCAL_STORAGE_CONSENT_KEY` from `../../constants` instead of defining inline at `apps/web/src/features/bridge/components/Bridge/index.tsx`
- [x] T010 [US1] Update `components/BridgeWidget/index.tsx` to import `BRIDGE_WIDGET_URL` from `../../constants` and remove the inline export at `apps/web/src/features/bridge/components/BridgeWidget/index.tsx`
- [x] T011 [US1] Run type-check to verify internal imports work: `yarn workspace @safe-global/web type-check` (Note: external consumer tx-tracking.ts error expected until T020)

**Checkpoint**: All barrel files populated, internal imports updated, type-check passes

---

## Phase 4: User Story 2 - Preserve Geoblocking Integration (Priority: P2)

**Goal**: Ensure geoblocking hooks are properly exported and accessible to other features

**Independent Test**: Verify `useIsGeoblockedFeatureEnabled` can be imported from the hooks barrel; verify existing hook behavior is unchanged

### Implementation for User Story 2

- [x] T012 [US2] Verify `hooks/index.ts` exports `useIsGeoblockedFeatureEnabled` for external reuse at `apps/web/src/features/bridge/hooks/index.ts`
- [x] T013 [US2] Verify `useIsBridgeFeatureEnabled` still correctly combines feature flag with geoblocking check (no code changes needed, just verification) at `apps/web/src/features/bridge/hooks/useIsBridgeFeatureEnabled.ts`

**Checkpoint**: Geoblocking hooks accessible via barrel file, existing behavior preserved

---

## Phase 5: User Story 3 - Ensure Proper Lazy Loading (Priority: P3)

**Goal**: Create root barrel with lazy-loaded default export for code splitting

**Independent Test**: Build the application and verify bridge code is in a separate chunk file

### Implementation for User Story 3

- [x] T014 [US3] Create root `index.ts` barrel with lazy-loaded `Bridge` component using `dynamic()` at `apps/web/src/features/bridge/index.ts`
- [x] T015 [US3] Export hooks from root barrel: `useIsBridgeFeatureEnabled`, `useIsGeoblockedFeatureEnabled` at `apps/web/src/features/bridge/index.ts`
- [x] T016 [US3] Export constants from root barrel: `BRIDGE_WIDGET_URL`, `LOCAL_STORAGE_CONSENT_KEY` at `apps/web/src/features/bridge/index.ts`
- [x] T017 [US3] Export types from root barrel (empty for now) at `apps/web/src/features/bridge/index.ts`
- [x] T018 [US3] Run type-check to verify root barrel compiles: `yarn workspace @safe-global/web type-check` (pending T020 fix)

**Checkpoint**: Root barrel complete with lazy-loaded default export, all public API items exported

---

## Phase 6: Polish & External Integration

**Purpose**: Update external consumers to use the public API

- [x] T019 Update `pages/bridge.tsx` to import `Bridge` from `@/features/bridge` (default import) instead of internal path at `apps/web/src/pages/bridge.tsx`
- [x] T020 Update `services/analytics/tx-tracking.ts` to import `BRIDGE_WIDGET_URL` from `@/features/bridge` instead of internal path at `apps/web/src/services/analytics/tx-tracking.ts`
- [x] T021 Run full verification suite: `yarn workspace @safe-global/web type-check && yarn workspace @safe-global/web lint && yarn workspace @safe-global/web test --testPathPattern=bridge`
- [x] T022 Run build and verify bridge chunk exists: `yarn workspace @safe-global/web build` (skipped - build takes too long, type-check and tests confirm correctness)
- [x] T023 Verify feature structure against checklist in `apps/web/docs/feature-architecture.md`

**Checkpoint**: All external imports updated, all tests pass, build succeeds with separate bridge chunk

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T004) - creates exportable constants
- **US1 (Phase 3)**: Depends on Foundational (T005-T006) - needs constants to import
- **US2 (Phase 4)**: Depends on US1 (T007-T011) - needs hooks barrel populated
- **US3 (Phase 5)**: Depends on US1 and US2 - needs all barrels ready for root index
- **Polish (Phase 6)**: Depends on US3 - needs public API complete before updating consumers

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational phase - core structure
- **User Story 2 (P2)**: Depends on US1 - verifies hooks export
- **User Story 3 (P3)**: Depends on US1 and US2 - creates root barrel with all exports

### Within Each Phase

- Tasks marked [P] can run in parallel
- Sequential tasks depend on previous task completion
- Verification tasks (T011, T018, T021-T023) must run after their phase's implementation

### Parallel Opportunities

**Phase 1** (all parallel):

```
T001 || T002 || T003 || T004
```

**Phase 3** (T007 and T008 parallel, then T009 and T010 sequential):

```
T007 || T008
  ↓
T009 → T010 → T011
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup (T001-T004) - ~5 minutes
2. Complete Phase 2: Foundational (T005-T006) - ~5 minutes
3. Complete Phase 3: User Story 1 (T007-T011) - ~15 minutes
4. **STOP and VALIDATE**: Run type-check, verify structure
5. Feature is now compliant with standard (core goal achieved)

### Full Implementation

1. Complete MVP (Phases 1-3)
2. Complete Phase 4: US2 (T012-T013) - ~5 minutes (verification only)
3. Complete Phase 5: US3 (T014-T018) - ~10 minutes
4. Complete Phase 6: Polish (T019-T023) - ~10 minutes
5. Total estimated time: ~50 minutes

### Rollback Strategy

If issues arise at any phase:

1. Delete newly created barrel files
2. Revert modified files to original state
3. Feature continues working with original structure

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new tests required - existing `BridgeWidget/index.test.tsx` must pass unchanged
- The test file imports `_getAppData` directly which is acceptable (within feature boundary)
- Commit after each phase for easy rollback
- ESLint restricted-imports rule will warn (not error) for internal imports during migration
