# Tasks: Mobile Positions Tab

**Input**: Design documents from `/specs/001-mobile-positions-tab/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included per Constitution Check (Test-First Development principle)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and shared utilities foundation

- [ ] T001 Create shared positions utils directory structure at `packages/utils/src/features/positions/`
- [ ] T002 Create mobile Positions components directory at `apps/mobile/src/features/Assets/components/Positions/`
- [ ] T003 [P] Create barrel export file at `packages/utils/src/features/positions/index.ts`

---

## Phase 2: Foundational (Shared Utilities)

**Purpose**: Extract and implement shared utilities that ALL user stories depend on

**⚠️ CRITICAL**: No mobile component work can begin until shared utilities are complete and tested

### Tests for Shared Utilities

- [ ] T004 [P] Create test file for getReadablePositionType at `packages/utils/src/features/positions/__tests__/getReadablePositionType.test.ts`
- [ ] T005 [P] Create test file for calculatePositionsFiatTotal at `packages/utils/src/features/positions/__tests__/calculatePositionsFiatTotal.test.ts`
- [ ] T006 [P] Create test file for calculateProtocolPercentage at `packages/utils/src/features/positions/__tests__/calculateProtocolPercentage.test.ts`
- [ ] T007 [P] Create test file for transformAppBalancesToProtocols at `packages/utils/src/features/positions/__tests__/transformAppBalancesToProtocols.test.ts`

### Implementation for Shared Utilities

- [ ] T008 [P] Implement getReadablePositionType utility at `packages/utils/src/features/positions/utils/getReadablePositionType.ts`
- [ ] T009 [P] Implement calculatePositionsFiatTotal utility at `packages/utils/src/features/positions/utils/calculatePositionsFiatTotal.ts`
- [ ] T010 [P] Implement calculateProtocolPercentage utility at `packages/utils/src/features/positions/utils/calculateProtocolPercentage.ts`
- [ ] T011 [P] Implement transformAppBalancesToProtocols utility at `packages/utils/src/features/positions/utils/transformAppBalancesToProtocols.ts`
- [ ] T012 Export all utilities from `packages/utils/src/features/positions/index.ts`
- [ ] T013 Run tests to verify all shared utilities pass: `yarn workspace @safe-global/utils test`

### Web Refactor (Validate Shared Utilities)

- [ ] T014 Refactor web `apps/web/src/features/positions/utils.ts` to import getReadablePositionType from `@safe-global/utils`
- [ ] T015 Refactor web `apps/web/src/features/positions/hooks/usePositions.ts` to import transformAppBalancesToProtocols from `@safe-global/utils`
- [ ] T016 Run web tests to verify refactor didn't break anything: `yarn workspace @safe-global/web test`

**Checkpoint**: Shared utilities complete and validated via web refactor

---

## Phase 3: User Story 1 + 4 - View DeFi Positions with Collapsible Sections (Priority: P1/P2) 🎯 MVP

**Goal**: Display user's DeFi positions grouped by protocol with name, icon, total value, percentage, and collapsible expand/collapse behavior

**Independent Test**: Open app with a Safe that has DeFi positions in 3+ protocols, tap Positions tab, verify positions grouped by protocol, can expand/collapse each section

### Tests for User Story 1+4

- [ ] T017 [P] [US1] Create test file for PositionItem at `apps/mobile/src/features/Assets/components/Positions/PositionItem/PositionItem.test.tsx`
- [ ] T018 [P] [US1] Create test file for ProtocolSection at `apps/mobile/src/features/Assets/components/Positions/ProtocolSection/ProtocolSection.test.tsx` (include expand/collapse interaction tests)

### Implementation for User Story 1+4

- [ ] T019 [P] [US1] Create PositionItem component at `apps/mobile/src/features/Assets/components/Positions/PositionItem/PositionItem.tsx` (displays token icon, name, balance, position type, fiat value, 24h change)
- [ ] T020 [P] [US1] Create PositionItem barrel export at `apps/mobile/src/features/Assets/components/Positions/PositionItem/index.ts`
- [ ] T021 [US1] Create ProtocolSection component at `apps/mobile/src/features/Assets/components/Positions/ProtocolSection/ProtocolSection.tsx` (shows protocol icon, name, fiat total, percentage; renders PositionItems)
- [ ] T022 [US1] Add expand/collapse state management to ProtocolSection (expanded by default per clarification, toggle icon and animation)
- [ ] T023 [US1] Create ProtocolSection barrel export at `apps/mobile/src/features/Assets/components/Positions/ProtocolSection/index.ts`
- [ ] T024 [US1] Create Positions barrel export at `apps/mobile/src/features/Assets/components/Positions/index.ts`

**Checkpoint**: Core display components with collapsible behavior complete, ready for container integration

---

## Phase 4: User Story 2 - Initial Loading State (Priority: P1) 🎯 MVP

**Goal**: Show green spinner centered during initial load, then display positions or error/empty state

**Independent Test**: Navigate to Positions tab with no cached data, verify green spinner appears centered until data loads

### Tests for User Story 2

- [ ] T025 [P] [US2] Create test file for PositionsEmpty at `apps/mobile/src/features/Assets/components/Positions/PositionsEmpty/PositionsEmpty.test.tsx`
- [ ] T026 [P] [US2] Create test file for PositionsError at `apps/mobile/src/features/Assets/components/Positions/PositionsError/PositionsError.test.tsx`
- [ ] T027 [US2] Create test file for Positions.container at `apps/mobile/src/features/Assets/components/Positions/Positions.container.test.tsx` (test loading, loaded, error, empty states with MSW)

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create PositionsEmpty component at `apps/mobile/src/features/Assets/components/Positions/PositionsEmpty/PositionsEmpty.tsx`
- [ ] T029 [P] [US2] Create PositionsEmpty barrel export at `apps/mobile/src/features/Assets/components/Positions/PositionsEmpty/index.ts`
- [ ] T030 [P] [US2] Create PositionsError component at `apps/mobile/src/features/Assets/components/Positions/PositionsError/PositionsError.tsx` (includes retry button)
- [ ] T031 [P] [US2] Create PositionsError barrel export at `apps/mobile/src/features/Assets/components/Positions/PositionsError/index.ts`
- [ ] T032 [US2] Create Positions.container at `apps/mobile/src/features/Assets/components/Positions/Positions.container.tsx` (uses usePositionsGetPositionsV1Query, handles loading/error/empty/loaded states, renders FlatList with ProtocolSection items)
- [ ] T033 [US2] Add Positions tab to Assets.container at `apps/mobile/src/features/Assets/Assets.container.tsx` (insert between Tokens and NFTs, conditionally render based on useHasFeature(FEATURES.POSITIONS))
- [ ] T034 [US2] Run mobile tests: `yarn workspace @safe-global/mobile test`

**Checkpoint**: MVP complete - User can view positions with proper loading/error/empty states

---

## Phase 5: User Story 3 - Pull-to-Refresh (Priority: P2)

**Goal**: Support pull-to-refresh with native OS indicator while keeping existing data visible

**Independent Test**: With positions displayed, pull down to refresh, verify native indicator appears, existing data stays visible, data updates in place

### Tests for User Story 3

- [ ] T035 [US3] Update Positions.container.test.tsx to add pull-to-refresh test cases (verify RefreshControl behavior, data persistence during refresh)

### Implementation for User Story 3

- [ ] T036 [US3] Add RefreshControl to FlatList in `apps/mobile/src/features/Assets/components/Positions/Positions.container.tsx`
- [ ] T037 [US3] Implement onRefresh handler with isRefreshing state management in Positions.container.tsx
- [ ] T038 [US3] Handle refresh error case (keep existing data visible, hide refresh indicator)
- [ ] T039 [US3] Run mobile tests to verify pull-to-refresh: `yarn workspace @safe-global/mobile test`

**Checkpoint**: All user stories complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T040 Run full type-check: `yarn workspace @safe-global/mobile type-check`
- [ ] T041 Run linting: `yarn workspace @safe-global/mobile lint`
- [ ] T042 Run prettier: `yarn workspace @safe-global/mobile prettier`
- [ ] T043 Verify web still works after shared utils refactor: `yarn workspace @safe-global/web type-check && yarn workspace @safe-global/web test`
- [ ] T044 Manual test on iOS simulator with Safe containing DeFi positions
- [ ] T045 Manual test on Android emulator with Safe containing DeFi positions
- [ ] T046 Verify feature flag correctly hides tab when FEATURES.POSITIONS disabled

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all mobile work
- **Phase 3 (US1+US4)**: Depends on Phase 2 shared utilities
- **Phase 4 (US2)**: Depends on Phase 3 components (PositionItem, ProtocolSection)
- **Phase 5 (US3)**: Depends on Phase 4 (working container)
- **Phase 6 (Polish)**: Depends on all user stories

### User Story Dependencies

| Story   | Depends On   | Can Parallel With |
| ------- | ------------ | ----------------- |
| US1+US4 | Foundational | -                 |
| US2     | US1+US4      | -                 |
| US3     | US2          | -                 |

### Parallel Opportunities

**Phase 2 (all parallelizable):**

```
T004, T005, T006, T007 (tests) - all parallel
T008, T009, T010, T011 (implementations) - all parallel
T014, T015 (web refactor) - parallel after T008-T012
```

**Phase 3 (partially parallelizable):**

```
T017, T018 (tests) - parallel
T019, T020 (PositionItem) - parallel with T021-T023 (ProtocolSection)
```

**Phase 4 (partially parallelizable):**

```
T025, T026 (Empty/Error tests) - parallel
T028-T031 (Empty/Error components) - parallel
```

---

## Parallel Example: Phase 2 Shared Utilities

```bash
# Launch all tests in parallel:
T004: "Test getReadablePositionType"
T005: "Test calculatePositionsFiatTotal"
T006: "Test calculateProtocolPercentage"
T007: "Test transformAppBalancesToProtocols"

# Launch all implementations in parallel:
T008: "Implement getReadablePositionType"
T009: "Implement calculatePositionsFiatTotal"
T010: "Implement calculateProtocolPercentage"
T011: "Implement transformAppBalancesToProtocols"
```

---

## Implementation Strategy

### MVP First (Phase 1-4)

1. Complete Phase 1: Setup directories
2. Complete Phase 2: Shared utilities (validates with web)
3. Complete Phase 3: US1+US4 - Core display components with collapsible sections
4. Complete Phase 4: US2 - Container with loading states
5. **STOP and VALIDATE**: Test on device with real Safe

### Incremental Delivery

1. **MVP (Phases 1-4)**: View positions with collapsible sections + loading states → Demo
2. **+Pull-to-Refresh (Phase 5)**: Add refresh capability → Demo
3. **Polish (Phase 6)**: Final validation → Release

---

## Notes

- All shared utilities MUST be tested before mobile work begins
- Web refactor (T014-T016) validates shared utilities work correctly
- Use MSW for API mocking in container tests
- Feature flag check already exists (`useHasFeature`)
- Reuse existing components where possible (Logo, FiatChange, AssetsCard patterns)
- Constitution requires: no `any` types, Tamagui components, theme tokens
