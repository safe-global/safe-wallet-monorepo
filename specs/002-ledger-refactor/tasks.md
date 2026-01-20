---
description: 'Task list for ledger feature architecture refactoring'
---

# Tasks: Ledger Feature Architecture Refactor

**Input**: Design documents from `/specs/002-ledger-refactor/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Test tasks are included per constitution requirement (Test-First Development principle).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo web application**: `apps/web/src/features/ledger/`
- All paths are relative to repository root: `/Users/daniel.d/Development/safe/safe-wallet-monorepo-2/`

---

## Phase 1: Setup (Initial Structure)

**Purpose**: Create the standard feature folder structure

- [x] T001 Create components/ directory in apps/web/src/features/ledger/
- [x] T002 [P] Create hooks/ directory in apps/web/src/features/ledger/
- [x] T003 [P] Create store/ directory in apps/web/src/features/ledger/
- [x] T004 [P] Create components/LedgerHashComparison/ subdirectory
- [x] T005 [P] Create barrel files: components/index.ts, hooks/index.ts, store/index.ts

---

## Phase 2: Foundational (Type System & Constants)

**Purpose**: Extract types and constants that all other code depends on

**⚠️ CRITICAL**: These files must be created before moving component/store files

- [x] T006 Create types.ts with TransactionHash, LedgerHashState, ShowHashFunction, HideHashFunction types in apps/web/src/features/ledger/types.ts
- [x] T007 Create constants.ts with DIALOG_MAX_WIDTH, HASH_DISPLAY_WIDTH, HASH_DISPLAY_LIMIT, DIALOG_TITLE, DIALOG_DESCRIPTION, CLOSE_BUTTON_TEXT in apps/web/src/features/ledger/constants.ts

**Checkpoint**: Foundation ready - component and store migration can now begin

---

## Phase 3: User Story 1 - Refactor Ledger Feature Structure (Priority: P1) 🎯 MVP

**Goal**: Reorganize the 3-file flat structure into standard feature pattern with proper folder organization

**Independent Test**: Verify directory structure matches standard pattern, existing functionality works, all imports resolve correctly

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Create store tests in apps/web/src/features/ledger/store/ledgerHashStore.test.ts (test initial state, showLedgerHashComparison, hideLedgerHashComparison, multiple rapid calls)
- [x] T009 [P] [US1] Create component tests in apps/web/src/features/ledger/components/LedgerHashComparison/index.test.tsx (test null render, dialog render, hash display, close button)

### Implementation for User Story 1

**Store Migration:**

- [x] T010 [US1] Move store.ts to store/ledgerHashStore.ts using git mv in apps/web/src/features/ledger/
- [x] T011 [US1] Update imports in store/ledgerHashStore.ts to use types from ../types.ts
- [x] T012 [US1] Create store/index.ts that re-exports ledgerHashStore, showLedgerHashComparison, hideLedgerHashComparison from ledgerHashStore.ts
- [x] T013 [US1] Run store tests and verify they pass

**Component Migration:**

- [x] T014 [US1] Move LedgerHashComparison.tsx to components/LedgerHashComparison/index.tsx using git mv in apps/web/src/features/ledger/
- [x] T015 [US1] Update imports in components/LedgerHashComparison/index.tsx to use ../../store/ledgerHashStore, ../../constants
- [x] T016 [US1] Replace hardcoded strings in component with constants from ../../constants (DIALOG_TITLE, DIALOG_DESCRIPTION, CLOSE_BUTTON_TEXT, HASH_DISPLAY_WIDTH, HASH_DISPLAY_LIMIT)
- [x] T017 [US1] Create components/index.ts that exports LedgerHashComparison from ./LedgerHashComparison
- [x] T018 [US1] Run component tests and verify they pass

**Verification:**

- [x] T019 [US1] Verify apps/web/src/features/ledger/ directory structure matches standard pattern (components/, hooks/, store/, types.ts, constants.ts, index.ts)
- [x] T020 [US1] Run yarn workspace @safe-global/web type-check to verify no type errors
- [x] T021 [US1] Verify dialog displays correctly when triggered during transaction signing (manual test)

**Checkpoint**: At this point, User Story 1 should be fully functional - directory structure is correct, all files are organized, tests pass

---

## Phase 4: User Story 2 - Implement Lazy Loading (Priority: P2)

**Goal**: Load the hash comparison dialog on-demand rather than in initial application bundle for code splitting

**Independent Test**: Analyze build output to confirm separate bundle exists for ledger feature, verify it loads on-demand when triggered

### Tests for User Story 2

- [x] T022 [US2] Add bundle analysis test: verify ledger chunk exists in .next/static/chunks/ after build
- [x] T023 [US2] Add lazy loading test: verify component is wrapped in dynamic() with ssr: false

### Implementation for User Story 2

- [x] T024 [US2] Rewrite index.ts in apps/web/src/features/ledger/ to use Next.js dynamic() import for LedgerHashComparison component with { ssr: false }
- [x] T025 [US2] Export types from index.ts: export type { TransactionHash, LedgerHashState, ShowHashFunction, HideHashFunction } from './types'
- [x] T026 [US2] Export store functions from index.ts: export { showLedgerHashComparison, hideLedgerHashComparison } from './store'
- [x] T027 [US2] Set default export in index.ts to the lazy-loaded LedgerHashComparison component
- [x] T028 [US2] Run yarn workspace @safe-global/web build to verify build succeeds
- [x] T029 [US2] Verify separate ledger chunk exists in apps/web/.next/static/chunks/ (ls -lh apps/web/.next/static/chunks/ | grep -i ledger)
- [x] T030 [US2] Verify initial page load does not include ledger code (check network tab in browser dev tools)
- [x] T031 [US2] Verify ledger feature loads on-demand when transaction signing initiated (manual test with network throttling)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - structure is correct AND code is properly split into separate bundle

---

## Phase 5: User Story 3 - Update External Import (Priority: P3)

**Goal**: Update external code to import from feature's public interface (@/features/ledger) instead of internal files

**Independent Test**: Run code quality checks and confirm no violations exist for ledger feature imports

### Tests for User Story 3

- [x] T032 [US3] Add ESLint test: verify no restricted import warnings for ledger feature (yarn workspace @safe-global/web lint | grep ledger)

### Implementation for User Story 3

- [x] T033 [US3] Update import in apps/web/src/services/onboard/ledger-module.ts line 166 from '@/features/ledger/store' to '@/features/ledger'
- [x] T034 [US3] Verify import in apps/web/src/components/tx-flow/TxFlow.tsx line 13 is already correct (import LedgerHashComparison from '@/features/ledger')
- [x] T035 [US3] Run yarn workspace @safe-global/web lint to verify no ESLint warnings about restricted imports
- [x] T036 [US3] Run yarn workspace @safe-global/web type-check to verify all imports resolve correctly
- [x] T037 [US3] Verify showLedgerHashComparison and hideLedgerHashComparison functions work correctly after import update (manual test)
- [x] T038 [US3] Verify dialog state updates correctly when functions called from ledger-module.ts (manual test with Ledger device)

**Checkpoint**: All user stories should now be independently functional - structure correct, code split, imports compliant

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, Storybook, final verification

- [x] T039 [P] Create Storybook story in apps/web/src/features/ledger/components/LedgerHashComparison/LedgerHashComparison.stories.tsx with Default, ShortHash, and Hidden variants
- [x] T040 [P] Verify Storybook story renders correctly (yarn workspace @safe-global/web storybook and navigate to Features/Ledger/LedgerHashComparison)
- [x] T041 Run yarn workspace @safe-global/web prettier to verify code formatting
- [x] T042 Run all existing tests to verify no regressions (yarn workspace @safe-global/web test)
- [x] T043 Verify quickstart.md checklist items all pass
- [x] T044 Manual end-to-end test: Connect Ledger device, sign transaction, verify hash dialog appears and closes correctly
- [x] T045 Measure bundle size impact: verify initial page load bundle size has not increased (ledger code is split)
- [x] T046 Verify dialog appears within 500ms when triggered (performance test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Depends on User Story 1 completion (needs public API structure from US1)
  - User Story 3 (P3): Depends on User Story 2 completion (needs lazy loading from US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ INDEPENDENT
- **User Story 2 (P2)**: Depends on User Story 1 - Requires refactored structure and public API ⚠️ SEQUENTIAL
- **User Story 3 (P3)**: Depends on User Story 2 - Requires lazy-loaded public API ⚠️ SEQUENTIAL

**Note**: These user stories are intentionally sequential as each builds on the previous (structure → lazy loading → import updates). This is appropriate for a refactoring task where each phase depends on the completion of the previous structural change.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Store migration before component migration (US1)
- Public API structure before lazy loading (US1 → US2)
- Lazy loading before external import updates (US2 → US3)
- All tests pass before moving to next story

### Parallel Opportunities

**Within Phase 1 (Setup):**

- Tasks T002, T003, T004, T005 can all run in parallel (creating different directories)

**Within Phase 2 (Foundational):**

- Tasks T006 and T007 can run in parallel (types.ts and constants.ts are independent)

**Within Phase 3 (User Story 1):**

- Tasks T008 and T009 can run in parallel (different test files)
- After store migration complete: Component migration can begin

**Within Phase 6 (Polish):**

- Tasks T039 and T040 can run in parallel with T041-T043 (different concerns)

---

## Parallel Example: User Story 1

```bash
# Launch both test files together:
Task: "Create store tests in apps/web/src/features/ledger/store/ledgerHashStore.test.ts"
Task: "Create component tests in apps/web/src/features/ledger/components/LedgerHashComparison/index.test.tsx"

# After tests fail, these can run in sequence:
# 1. Store migration (T010-T013)
# 2. Component migration (T014-T018)
# 3. Verification (T019-T021)
```

---

## Parallel Example: Phase 6 Polish

```bash
# These polish tasks can run together:
Task: "Create Storybook story in apps/web/src/features/ledger/components/LedgerHashComparison/LedgerHashComparison.stories.tsx"
Task: "Run yarn workspace @safe-global/web prettier"
Task: "Run all existing tests (yarn workspace @safe-global/web test)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (5 tasks, ~5 minutes)
2. Complete Phase 2: Foundational (2 tasks, ~15 minutes)
3. Complete Phase 3: User Story 1 (14 tasks, ~1.5 hours)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. At this point you have a refactored feature with proper structure ✅

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~20 minutes)
2. Add User Story 1 → Test independently → Structure refactored (MVP!)
3. Add User Story 2 → Test independently → Code splitting enabled
4. Add User Story 3 → Test independently → Import compliance achieved
5. Add Polish → Storybook + final verification → Complete refactoring

### Sequential Strategy (Recommended for this refactoring)

Since user stories are sequential dependencies (each builds on previous):

1. Complete Phase 1 (Setup) - creates folder structure
2. Complete Phase 2 (Foundational) - creates types and constants
3. Complete Phase 3 (US1) - migrates files to new structure
4. Complete Phase 4 (US2) - adds lazy loading
5. Complete Phase 5 (US3) - updates external imports
6. Complete Phase 6 (Polish) - adds documentation and final checks

**Estimated Total Time**: 2-3 hours (as specified in quickstart.md)

---

## Task Summary

**Total Tasks**: 46 tasks across 6 phases

**Tasks per Phase**:

- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 2 tasks
- Phase 3 (User Story 1): 14 tasks
- Phase 4 (User Story 2): 10 tasks
- Phase 5 (User Story 3): 7 tasks
- Phase 6 (Polish): 8 tasks

**Tasks per User Story**:

- User Story 1 (Refactor Structure): 14 tasks
- User Story 2 (Lazy Loading): 10 tasks
- User Story 3 (External Imports): 7 tasks

**Parallel Opportunities**: 8 tasks marked [P] can run in parallel within their phases

**Independent Test Criteria**:

- US1: Directory structure matches pattern, functionality preserved, imports resolve
- US2: Separate bundle exists, loads on-demand, initial bundle unchanged
- US3: ESLint passes, imports use public API, functionality preserved

**Suggested MVP Scope**: Complete through User Story 1 (Phase 3) for minimal refactored structure

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
✅ All task IDs are sequential (T001-T046)
✅ All [P] markers indicate truly parallel tasks (different files, no dependencies)
✅ All [Story] labels map to user stories (US1, US2, US3)
✅ All file paths are explicit and complete
✅ Setup and Foundational phases have no story labels
✅ User Story phases have story labels
✅ Polish phase has no story labels

---

## Notes

- All tasks include explicit file paths for clarity
- [P] tasks can run in parallel within their phase
- [Story] labels enable tracking tasks to specific user stories
- Tests written first per constitution (Test-First Development)
- Each user story has clear independent test criteria
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- This is a refactoring task - functionality must remain identical throughout
