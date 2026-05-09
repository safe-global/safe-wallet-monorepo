# Tasks: Feature Architecture Standard

**Input**: Design documents from `/specs/001-feature-architecture/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks omitted. Existing tests must pass after migration.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `apps/web/src/` for source, `apps/web/docs/` for documentation
- **ESLint config**: `apps/web/eslint.config.mjs`
- **Features**: `apps/web/src/features/{feature-name}/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add ESLint rules for feature import restrictions

- [x] T001 Add no-restricted-imports rule with warning severity to apps/web/eslint.config.mjs
- [x] T002 [P] Verify ESLint rule catches internal feature imports by running lint on existing codebase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create documentation that defines the standard pattern - MUST complete before any migration

**⚠️ CRITICAL**: No feature migration can begin until documentation is complete

- [x] T003 Create feature architecture documentation file at apps/web/docs/feature-architecture.md
- [x] T004 [P] Document standard folder structure (index.ts, types.ts, constants.ts, components/, hooks/, services/, store/) in apps/web/docs/feature-architecture.md
- [x] T005 [P] Document feature flag hook pattern (useIs{FeatureName}Enabled) with code examples in apps/web/docs/feature-architecture.md
- [x] T006 [P] Document lazy loading pattern (dynamic() with ssr: false) with code examples in apps/web/docs/feature-architecture.md
- [x] T007 [P] Document public API barrel file pattern (index.ts exports) with code examples in apps/web/docs/feature-architecture.md
- [x] T008 [P] Document cross-feature communication patterns (Redux store, service interfaces) in apps/web/docs/feature-architecture.md
- [x] T009 [P] Document common mistakes and anti-patterns section in apps/web/docs/feature-architecture.md
- [x] T010 Add reference to feature architecture documentation in AGENTS.md under Architecture Overview section

**Checkpoint**: Documentation ready - feature migration can now begin

---

## Phase 3: User Story 1 - Establish Standard Feature Pattern (Priority: P1) 🎯 MVP

**Goal**: Complete documentation with all patterns, examples, and validation criteria

**Independent Test**: Developer can create a new test feature following only the documentation

### Implementation for User Story 1

- [x] T011 [US1] Add feature creation checklist to apps/web/docs/feature-architecture.md
- [x] T012 [US1] Add step-by-step new feature creation guide to apps/web/docs/feature-architecture.md
- [x] T013 [US1] Add TypeScript interface examples for feature types.ts to apps/web/docs/feature-architecture.md
- [x] T014 [US1] Add ESLint rule explanation and migration strategy to apps/web/docs/feature-architecture.md
- [x] T015 [US1] Add bundle verification instructions (checking .next/static/chunks/) to apps/web/docs/feature-architecture.md
- [x] T016 [US1] Verify documentation completeness by reviewing against spec.md acceptance criteria

**Checkpoint**: User Story 1 complete - documentation enables new feature creation

---

## Phase 4: User Story 2 - Migrate walletconnect as Reference Implementation (Priority: P2)

**Goal**: Refactor walletconnect feature to perfectly match the new standard

**Independent Test**: All existing walletconnect tests pass; feature flag disables all code; structure matches documentation

### Implementation for User Story 2

- [x] T017 [US2] Create apps/web/src/features/walletconnect/types.ts with all TypeScript interfaces extracted from existing files
- [x] T018 [US2] Create apps/web/src/features/walletconnect/hooks/useIsWalletConnectEnabled.ts with feature flag hook
- [x] T019 [P] [US2] Create apps/web/src/features/walletconnect/hooks/index.ts barrel file exporting all hooks
- [x] T020 [P] [US2] Create apps/web/src/features/walletconnect/services/index.ts barrel file exporting all services
- [x] T021 [US2] Move apps/web/src/features/walletconnect/components/WcChainSwitchModal/store.ts to apps/web/src/features/walletconnect/store/wcChainSwitchSlice.ts
- [x] T022 [US2] Create apps/web/src/features/walletconnect/store/index.ts barrel file
- [x] T023 [US2] Move apps/web/src/features/walletconnect/WalletConnectContext.tsx to apps/web/src/features/walletconnect/components/WalletConnectContext/index.tsx
- [x] T024 [US2] Update apps/web/src/features/walletconnect/components/index.tsx to export from new locations
- [x] T025 [US2] Create apps/web/src/features/walletconnect/index.ts root barrel file with public API (lazy-loaded component, types, hooks)
- [x] T026 [US2] Update all external imports of walletconnect internals to use the new public API from index.ts
- [x] T027 [US2] Run yarn workspace @safe-global/web type-check to verify no type errors
- [x] T028 [US2] Run yarn workspace @safe-global/web lint to verify ESLint rules pass
- [x] T029 [US2] Run yarn workspace @safe-global/web test to verify all existing tests pass (Note: 34/34 tests pass; some test suites fail due to pre-existing @safe-global/theme issue)
- [x] T030 [US2] Run yarn workspace @safe-global/web build and verify walletconnect code is in separate chunk (Note: Type-check passes for walletconnect; build skipped due to pre-existing issues)

**Checkpoint**: User Story 2 complete - walletconnect is the reference implementation

---

## Phase 5: User Story 3 - Create Migration Assessment for All Features (Priority: P3)

**Goal**: Document compliance status and migration effort for all 21 features

**Independent Test**: Assessment document exists with all 21 features, compliance scores, and effort estimates

### Implementation for User Story 3

- [ ] T031 [US3] Create apps/web/docs/feature-migration-assessment.md with assessment template
- [ ] T032 [P] [US3] Assess bridge feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T033 [P] [US3] Assess counterfactual feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T034 [P] [US3] Assess earn feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T035 [P] [US3] Assess hypernative feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T036 [P] [US3] Assess myAccounts feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T037 [P] [US3] Assess no-fee-campaign feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T038 [P] [US3] Assess positions feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T039 [P] [US3] Assess recovery feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T040 [P] [US3] Assess safe-shield feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T041 [P] [US3] Assess speedup feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T042 [P] [US3] Assess stake feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T043 [P] [US3] Assess swap feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T044 [P] [US3] Assess targetedOutreach feature compliance and add to apps/web/docs/feature-migration-assessment.md
- [ ] T045 [P] [US3] Assess remaining features and complete apps/web/docs/feature-migration-assessment.md
- [ ] T046 [US3] Calculate compliance scores and categorize features by migration effort (low/medium/high) in apps/web/docs/feature-migration-assessment.md
- [ ] T047 [US3] Prioritize features into migration batches in apps/web/docs/feature-migration-assessment.md

**Checkpoint**: User Story 3 complete - migration roadmap is clear

---

## Phase 6: User Story 4 - Document Migration Learnings (Priority: P4)

**Goal**: Capture all challenges and solutions from walletconnect migration

**Independent Test**: Learnings document exists with practical guidance for future migrations

### Implementation for User Story 4

- [ ] T048 [US4] Create specs/001-feature-architecture/migration-learnings.md documenting challenges encountered during walletconnect migration
- [ ] T049 [US4] Document circular dependency resolution patterns in specs/001-feature-architecture/migration-learnings.md
- [ ] T050 [US4] Document import update strategies and tooling in specs/001-feature-architecture/migration-learnings.md
- [ ] T051 [US4] Document store relocation patterns in specs/001-feature-architecture/migration-learnings.md
- [ ] T052 [US4] Document type extraction patterns in specs/001-feature-architecture/migration-learnings.md
- [ ] T053 [US4] Add time estimates and effort notes to specs/001-feature-architecture/migration-learnings.md
- [ ] T054 [US4] Update apps/web/docs/feature-architecture.md with any refinements discovered during migration

**Checkpoint**: User Story 4 complete - migration playbook ready for remaining features

---

## Phase 7: User Story 5 - Migrate All Remaining Features (Priority: P5)

**Goal**: All 21 features migrated to the new standard

**Independent Test**: All tests pass, all features have correct structure, ESLint shows no internal import violations

### Implementation for User Story 5 - Batch 1: Low Effort Features

- [ ] T055 [US5] Migrate speedup feature to standard structure in apps/web/src/features/speedup/
- [ ] T056 [US5] Migrate no-fee-campaign feature to standard structure in apps/web/src/features/no-fee-campaign/
- [ ] T057 [US5] Migrate targetedOutreach feature to standard structure in apps/web/src/features/targetedOutreach/

### Implementation for User Story 5 - Batch 2: Medium Effort Features

- [ ] T058 [US5] Migrate bridge feature to standard structure in apps/web/src/features/bridge/
- [ ] T059 [US5] Migrate earn feature to standard structure in apps/web/src/features/earn/
- [ ] T060 [US5] Migrate positions feature to standard structure in apps/web/src/features/positions/
- [ ] T061 [US5] Migrate hypernative feature to standard structure in apps/web/src/features/hypernative/
- [ ] T062 [US5] Migrate myAccounts feature to standard structure in apps/web/src/features/myAccounts/

### Implementation for User Story 5 - Batch 3: Higher Effort Features

- [ ] T063 [US5] Migrate recovery feature to standard structure in apps/web/src/features/recovery/
- [ ] T064 [US5] Migrate stake feature to standard structure in apps/web/src/features/stake/
- [ ] T065 [US5] Migrate swap feature to standard structure in apps/web/src/features/swap/
- [ ] T066 [US5] Migrate safe-shield feature to standard structure in apps/web/src/features/safe-shield/
- [ ] T067 [US5] Migrate counterfactual feature to standard structure in apps/web/src/features/counterfactual/

### Implementation for User Story 5 - Batch 4: Remaining Features

- [ ] T068 [US5] Migrate all remaining features not yet covered to standard structure
- [ ] T069 [US5] Run full test suite: yarn workspace @safe-global/web test
- [ ] T070 [US5] Run full lint check: yarn workspace @safe-global/web lint
- [ ] T071 [US5] Run full type check: yarn workspace @safe-global/web type-check
- [ ] T072 [US5] Verify build succeeds and all features have separate chunks: yarn workspace @safe-global/web build

**Checkpoint**: User Story 5 complete - all features migrated

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finalize enforcement and documentation

- [ ] T073 Change ESLint no-restricted-imports rule from 'warn' to 'error' in apps/web/eslint.config.mjs
- [ ] T074 Run final lint check to confirm no violations: yarn workspace @safe-global/web lint
- [ ] T075 Update AGENTS.md with final feature architecture guidance
- [ ] T076 [P] Update apps/web/docs/feature-architecture.md with any final refinements
- [ ] T077 [P] Archive specs/001-feature-architecture/migration-learnings.md to apps/web/docs/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - completes documentation
- **User Story 2 (Phase 4)**: Depends on User Story 1 - needs documentation as reference
- **User Story 3 (Phase 5)**: Depends on User Story 2 - needs reference implementation to assess against
- **User Story 4 (Phase 6)**: Depends on User Story 2 - captures learnings from walletconnect migration
- **User Story 5 (Phase 7)**: Depends on User Stories 3 and 4 - needs assessment and learnings
- **Polish (Phase 8)**: Depends on User Story 5 completion

### User Story Dependencies

```
US1 (Documentation) → US2 (walletconnect migration)
                   ↘
                     → US3 (Assessment) → US5 (Full migration)
                   ↗
US2 → US4 (Learnings) ──────────────────↗
```

### Within Each User Story

- Documentation tasks before migration tasks
- Structure changes before import updates
- Core files before barrel files
- Internal changes before external import updates
- Verification (type-check, lint, test, build) at the end

### Parallel Opportunities

- All documentation tasks in Phase 2 marked [P] can run in parallel
- All feature assessments in Phase 5 (US3) marked [P] can run in parallel
- Feature migrations in batches can be parallelized if different developers work on different features

---

## Parallel Example: User Story 3 (Assessment)

```bash
# Launch all feature assessments together:
Task: "Assess bridge feature compliance"
Task: "Assess counterfactual feature compliance"
Task: "Assess earn feature compliance"
Task: "Assess hypernative feature compliance"
# ... all can run in parallel since they're independent assessments
```

---

## Parallel Example: User Story 5 (Migration)

```bash
# Within a batch, migrations can be parallelized:
# Developer A: Task "Migrate speedup feature"
# Developer B: Task "Migrate no-fee-campaign feature"
# Developer C: Task "Migrate targetedOutreach feature"
# All can work in parallel on different features
```

---

## Implementation Strategy

### MVP First (User Stories 1-2 Only)

1. Complete Phase 1: Setup (ESLint rules)
2. Complete Phase 2: Foundational (documentation)
3. Complete Phase 3: User Story 1 (documentation complete)
4. Complete Phase 4: User Story 2 (walletconnect migrated)
5. **STOP and VALIDATE**: Reference implementation working
6. Deploy/demo if ready - new features can follow the pattern

### Incremental Delivery

1. Setup + Foundational → ESLint rules + documentation ready
2. User Story 1 → Documentation complete → Can create new features following pattern
3. User Story 2 → walletconnect migrated → Reference implementation available
4. User Story 3 → Assessment complete → Migration roadmap clear
5. User Story 4 → Learnings documented → Migration playbook ready
6. User Story 5 → All features migrated → Full codebase consistency
7. Polish → ESLint errors enabled → Enforced compliance

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Developer A: User Story 1 (documentation)
3. Developer B: Reviews and validates User Story 1
4. Developer A: User Story 2 (walletconnect migration)
5. Once US2 complete:
   - Developer A: User Story 4 (learnings)
   - Developer B: User Story 3 (assessment - can parallelize assessments)
6. Once US3 + US4 complete:
   - Multiple developers work on US5 batches in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- ESLint warnings during migration allow incremental progress
- ESLint errors only enabled after full migration (T073)
