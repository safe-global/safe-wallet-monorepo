# Tasks: Design System Migration to shadcn with Storybook Coverage

**Input**: Design documents from `/specs/001-shadcn-storybook-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Note**: Chromatic/Visual Regression (US5) deferred to final phase - requires approval first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/` (monorepo structure)
- **MSW handlers**: `config/test/msw/`
- **Scripts**: `scripts/storybook/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure and shared decorators setup

- [x] T001 Create decorators directory structure in apps/web/.storybook/decorators/
- [x] T002 [P] Create LayoutDecorator.tsx for page-level stories in apps/web/.storybook/decorators/LayoutDecorator.tsx
- [x] T003 [P] Create MockProviderDecorator.tsx for Redux/context in apps/web/.storybook/decorators/MockProviderDecorator.tsx
- [x] T004 [P] Create barrel export in apps/web/.storybook/decorators/index.ts
- [x] T005 Update apps/web/.storybook/preview.tsx to register global decorators

---

## Phase 2: Foundational (MSW Infrastructure)

**Purpose**: Mock infrastructure that MUST be complete before story creation work

**⚠️ CRITICAL**: No story work (US3, US4) can begin until this phase is complete

**Architecture Decision**: Using **fixture-based handlers** with real API data fetched from staging CGW, instead of hardcoded synthetic data. This ensures mock data matches actual API response shapes exactly.

- [x] T006 Create MSW handlers directory structure in config/test/msw/handlers/
- [x] T007 [P] Extract safe-related handlers to config/test/msw/handlers/safe.ts
- [x] T008 [P] Extract transaction handlers to config/test/msw/handlers/transactions.ts
- [x] T009 [P] Create fixture-based handlers in config/test/msw/handlers/fromFixtures.ts (supersedes balances.ts)
- [x] T010 [P] Create Web3/RPC mock handlers in config/test/msw/handlers/web3.ts
- [x] T011 Create handler aggregation barrel in config/test/msw/handlers/index.ts with fixtureHandlers as primary API
- [x] T012 Create fixtures directory in config/test/msw/fixtures/
- [x] T013 [P] Fetch and store balance fixtures from staging CGW in config/test/msw/fixtures/balances/
- [x] T014 [P] Fetch and store portfolio fixtures in config/test/msw/fixtures/portfolio/
- [x] T015 [P] Fetch and store position fixtures in config/test/msw/fixtures/positions/
- [x] T016 Create fixture barrel export with type-safe imports in config/test/msw/fixtures/index.ts
- [x] T017 Create scenarios directory in config/test/msw/scenarios/
- [x] T018 [P] Create emptyState.ts scenario handlers in config/test/msw/scenarios/emptyState.ts
- [x] T019 [P] Create errorState.ts scenario handlers in config/test/msw/scenarios/errorState.ts
- [x] T020 [P] Create loadingState.ts scenario handlers in config/test/msw/scenarios/loadingState.ts
- [x] T021 Create scenarios barrel export in config/test/msw/scenarios/index.ts

**Checkpoint**: MSW infrastructure ready - story creation can now begin ✅

---

## Phase 3: User Story 1 - Component Inventory & Story Coverage (Priority: P1) 🎯 MVP

**Goal**: Automated inventory of all components with coverage tracking and dependency analysis

**Independent Test**: Run `yarn workspace @safe-global/web inventory` and verify it produces a JSON report with component count, coverage percentage, and dependencies

### Implementation for User Story 1

- [x] T022 [US1] Create scripts/storybook/ directory structure
- [x] T023 [US1] Create ComponentEntry interface types in scripts/storybook/types.ts
- [x] T024 [US1] Implement component scanner using AST parser in scripts/storybook/scanner.ts
- [x] T025 [US1] Implement story coverage checker in scripts/storybook/coverage.ts
- [x] T026 [US1] Implement dependency analyzer (hooks, API calls, Redux) in scripts/storybook/dependencies.ts
- [x] T027 [US1] Implement priority scoring algorithm in scripts/storybook/priority.ts
- [x] T028 [US1] Create main inventory script in scripts/storybook/inventory.ts
- [x] T029 [US1] Create coverage report generator in scripts/storybook/coverage-report.ts
- [x] T030 [US1] Add "inventory" script to apps/web/package.json
- [x] T031 [US1] Add "coverage-report" script to apps/web/package.json
- [x] T032 [US1] Run inventory and generate initial coverage report
- [x] T033 [US1] Document inventory tool usage in specs/001-shadcn-storybook-migration/quickstart.md

**Checkpoint**: Component inventory system complete - provides foundation for systematic story creation ✅

---

## Phase 4: User Story 2 - MSW Fixture Expansion (Priority: P2)

**Goal**: Extend fixture coverage for all API endpoints used by components

**Independent Test**: Create a sample story for TransactionsList that renders with realistic mocked data from fixture handlers

**Note**: Core fixture infrastructure (balances, portfolio, positions, chains, safes) already complete. This phase adds coverage for remaining endpoints.

### Implementation for User Story 2

- [ ] T034 [US2] Audit fixture coverage against inventory dependency report - identify uncovered endpoints
- [ ] T035 [US2] Document fixture scenarios and usage in specs/001-shadcn-storybook-migration/msw-fixtures.md
- [ ] T036 [P] [US2] Add Safe Apps fixtures to config/test/msw/fixtures/safe-apps/
- [ ] T037 [P] [US2] Add transaction fixtures to config/test/msw/fixtures/transactions/
- [ ] T038 [P] [US2] Add notifications fixtures to config/test/msw/fixtures/notifications/
- [ ] T039 [US2] Update fromFixtures.ts to include new fixture types
- [ ] T040 [US2] Create MockWeb3Provider component in apps/web/.storybook/decorators/MockWeb3Provider.tsx
- [ ] T041 [US2] Create MockWeb3Decorator in apps/web/.storybook/decorators/MockWeb3Decorator.tsx
- [ ] T042 [US2] Create sample TransactionsList story demonstrating fixture usage in apps/web/src/components/transactions/TransactionsList/TransactionsList.stories.tsx
- [ ] T043 [US2] Verify sample story renders correctly in Storybook with fixtureHandlers

**Checkpoint**: Fixture coverage complete - all API endpoints covered for story development

---

## Phase 5: User Story 3 - Individual Component Stories (Priority: P3)

**Goal**: Storybook stories for all visually-rendered components showing all states

**Independent Test**: Navigate Storybook UI and verify each component category has stories with Default, Loading, Error, Empty, and Disabled states as applicable

### Phase 5.1: shadcn/ui Component Stories (Tier 1 - Most Used)

- [ ] T044 [P] [US3] Create input.stories.tsx in apps/web/src/components/ui/input.stories.tsx
- [ ] T045 [P] [US3] Create select.stories.tsx in apps/web/src/components/ui/select.stories.tsx
- [ ] T046 [P] [US3] Create checkbox.stories.tsx in apps/web/src/components/ui/checkbox.stories.tsx
- [ ] T047 [P] [US3] Create switch.stories.tsx in apps/web/src/components/ui/switch.stories.tsx
- [ ] T048 [P] [US3] Create tabs.stories.tsx in apps/web/src/components/ui/tabs.stories.tsx
- [ ] T049 [P] [US3] Create dropdown-menu.stories.tsx in apps/web/src/components/ui/dropdown-menu.stories.tsx
- [ ] T050 [P] [US3] Create dialog.stories.tsx in apps/web/src/components/ui/dialog.stories.tsx
- [ ] T051 [P] [US3] Create alert-dialog.stories.tsx in apps/web/src/components/ui/alert-dialog.stories.tsx

### Phase 5.2: shadcn/ui Component Stories (Tier 2 - Common)

- [ ] T052 [P] [US3] Create badge.stories.tsx in apps/web/src/components/ui/badge.stories.tsx
- [ ] T053 [P] [US3] Create tooltip.stories.tsx in apps/web/src/components/ui/tooltip.stories.tsx
- [ ] T054 [P] [US3] Create popover.stories.tsx in apps/web/src/components/ui/popover.stories.tsx
- [ ] T055 [P] [US3] Create sheet.stories.tsx in apps/web/src/components/ui/sheet.stories.tsx
- [ ] T056 [P] [US3] Create accordion.stories.tsx in apps/web/src/components/ui/accordion.stories.tsx
- [ ] T057 [P] [US3] Create table.stories.tsx in apps/web/src/components/ui/table.stories.tsx

### Phase 5.3: shadcn/ui Component Stories (Tier 3 - Specialized)

- [ ] T058 [P] [US3] Create slider.stories.tsx in apps/web/src/components/ui/slider.stories.tsx
- [ ] T059 [P] [US3] Create progress.stories.tsx in apps/web/src/components/ui/progress.stories.tsx
- [ ] T060 [P] [US3] Create navigation-menu.stories.tsx in apps/web/src/components/ui/navigation-menu.stories.tsx
- [ ] T061 [P] [US3] Create pagination.stories.tsx in apps/web/src/components/ui/pagination.stories.tsx
- [ ] T062 [P] [US3] Create scroll-area.stories.tsx in apps/web/src/components/ui/scroll-area.stories.tsx
- [ ] T063 [P] [US3] Create separator.stories.tsx in apps/web/src/components/ui/separator.stories.tsx
- [ ] T064 [P] [US3] Create skeleton.stories.tsx in apps/web/src/components/ui/skeleton.stories.tsx
- [ ] T065 [P] [US3] Create textarea.stories.tsx in apps/web/src/components/ui/textarea.stories.tsx
- [ ] T066 [P] [US3] Create toggle.stories.tsx in apps/web/src/components/ui/toggle.stories.tsx
- [ ] T067 [P] [US3] Create radio-group.stories.tsx in apps/web/src/components/ui/radio-group.stories.tsx
- [ ] T068 [P] [US3] Create label.stories.tsx in apps/web/src/components/ui/label.stories.tsx
- [ ] T069 [P] [US3] Create hover-card.stories.tsx in apps/web/src/components/ui/hover-card.stories.tsx
- [ ] T070 [P] [US3] Create context-menu.stories.tsx in apps/web/src/components/ui/context-menu.stories.tsx
- [ ] T071 [P] [US3] Create collapsible.stories.tsx in apps/web/src/components/ui/collapsible.stories.tsx
- [ ] T072 [P] [US3] Create alert.stories.tsx in apps/web/src/components/ui/alert.stories.tsx
- [ ] T073 [P] [US3] Create aspect-ratio.stories.tsx in apps/web/src/components/ui/aspect-ratio.stories.tsx
- [ ] T074 [P] [US3] Create breadcrumb.stories.tsx in apps/web/src/components/ui/breadcrumb.stories.tsx
- [ ] T075 [P] [US3] Create drawer.stories.tsx in apps/web/src/components/ui/drawer.stories.tsx
- [ ] T076 [P] [US3] Create input-otp.stories.tsx in apps/web/src/components/ui/input-otp.stories.tsx
- [ ] T077 [P] [US3] Create resizable.stories.tsx in apps/web/src/components/ui/resizable.stories.tsx

### Phase 5.4: Sidebar Component Stories (17 components, 0 stories - critical for page stories)

- [ ] T078 [US3] Identify all sidebar components using inventory tool
- [ ] T079 [P] [US3] Create SidebarNavigation.stories.tsx in apps/web/src/components/sidebar/SidebarNavigation/SidebarNavigation.stories.tsx
- [ ] T080 [P] [US3] Create SafeListItem.stories.tsx in apps/web/src/components/sidebar/SafeListItem/SafeListItem.stories.tsx
- [ ] T081 [P] [US3] Create ChainIndicator.stories.tsx in apps/web/src/components/sidebar/ChainIndicator/ChainIndicator.stories.tsx
- [ ] T082 [P] [US3] Create remaining sidebar component stories (based on inventory)

### Phase 5.5: Common Component Stories (fill coverage gaps)

- [ ] T083 [US3] Generate list of uncovered common components using inventory tool
- [ ] T084 [P] [US3] Create stories for Tier 1 common components (address display, balance display, token amounts)
- [ ] T085 [P] [US3] Create stories for Tier 2 common components (tables, lists, pagination, search)
- [ ] T086 [P] [US3] Create stories for Tier 3 common components (modals, toasts, errors, loading states)

### Phase 5.6: Feature Component Stories (expand existing coverage)

- [ ] T087 [US3] Generate list of feature components needing stories using inventory tool
- [ ] T088 [P] [US3] Create/expand stories for Tier 1 features (Transactions, Balances, Dashboard)
- [ ] T089 [P] [US3] Create/expand stories for Tier 2 features (Settings, Address Book, Safe Apps)
- [ ] T090 [P] [US3] Create/expand stories for Tier 3 features (Staking, Swaps, Bridge)

**Checkpoint**: All individual components have Storybook stories with documented states

---

## Phase 6: User Story 4 - Page-Level Stories with Layout (Priority: P4)

**Goal**: Full-page stories including sidebar and header for designer review

**Independent Test**: View page story in Storybook showing complete layout with sidebar, header, and content; resize viewport to verify responsive behavior

### Implementation for User Story 4

- [ ] T091 [US4] Create LayoutDecorator component for full-page layouts in apps/web/.storybook/decorators/LayoutDecorator.tsx
- [ ] T092 [US4] Configure viewport addon for responsive testing in apps/web/.storybook/preview.tsx
- [ ] T093 [P] [US4] Create Dashboard page story in apps/web/src/pages/Dashboard/Dashboard.stories.tsx
- [ ] T094 [P] [US4] Create Transactions list page story in apps/web/src/pages/Transactions/Transactions.stories.tsx
- [ ] T095 [P] [US4] Create Transaction details page story in apps/web/src/pages/TransactionDetails/TransactionDetails.stories.tsx
- [ ] T096 [P] [US4] Create Settings page story in apps/web/src/pages/Settings/Settings.stories.tsx
- [ ] T097 [P] [US4] Create Safe Apps page story in apps/web/src/pages/SafeApps/SafeApps.stories.tsx
- [ ] T098 [US4] Add Mobile viewport variant to all page stories
- [ ] T099 [US4] Add Tablet viewport variant to all page stories
- [ ] T100 [US4] Verify all page stories render correctly with realistic data

**Checkpoint**: Page-level stories complete - designers can review full layouts

---

## Phase 7: User Story 5 - Visual Regression Testing with Chromatic (Priority: P5)

**⚠️ DEFERRED**: This phase requires approval for Chromatic account setup before proceeding

**Goal**: Automated visual regression testing integrated into CI

**Independent Test**: Make a visual change to a component, create PR, and verify Chromatic detects and flags the change

### Prerequisites (External - Requires Approval)

- [ ] T101 [US5] Request approval for Chromatic account setup
- [ ] T102 [US5] Create Chromatic project and obtain project token
- [ ] T103 [US5] Add CHROMATIC_PROJECT_TOKEN to GitHub repository secrets

### Implementation for User Story 5 (After Approval)

- [ ] T104 [US5] Add chromatic npm scripts to apps/web/package.json
- [ ] T105 [US5] Create Chromatic GitHub Actions workflow in .github/workflows/chromatic.yml
- [ ] T106 [US5] Configure workflow to block PRs on unapproved visual changes
- [ ] T107 [US5] Run initial Chromatic build to capture baselines
- [ ] T108 [US5] Test PR workflow with intentional visual change
- [ ] T109 [US5] Document Chromatic review process for designers in specs/001-shadcn-storybook-migration/chromatic-guide.md
- [ ] T110 [US5] Train team on Chromatic review workflow

**Checkpoint**: Visual regression pipeline active - changes are caught before merge

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and validation

- [ ] T111 [P] Update quickstart.md with final patterns and examples
- [ ] T112 [P] Update AGENTS.md with Storybook story requirements
- [ ] T113 Run final coverage report and document results
- [ ] T114 Verify Storybook builds successfully with all stories
- [ ] T115 Run yarn workspace @safe-global/web type-check
- [ ] T116 Run yarn workspace @safe-global/web lint
- [ ] T117 Create PR with all changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS story creation
- **User Story 1 (Phase 3)**: Can start after Setup; provides inventory for later phases
- **User Story 2 (Phase 4)**: Depends on Phase 2 (MSW infrastructure)
- **User Story 3 (Phase 5)**: Depends on Phase 2 (MSW) and benefits from Phase 3 (inventory) and Phase 4 (mock data)
- **User Story 4 (Phase 6)**: Depends on Phase 5 (component stories) for sidebar components
- **User Story 5 (Phase 7)**: Deferred - requires external approval; depends on all prior story phases
- **Polish (Phase 8)**: Depends on all desired phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - can start after Setup
- **User Story 2 (P2)**: Depends on Phase 2 foundational work
- **User Story 3 (P3)**: Benefits from US1 (inventory) and US2 (mock data) but can start core UI stories immediately
- **User Story 4 (P4)**: Depends on US3 for sidebar component stories
- **User Story 5 (P5)**: DEFERRED - requires approval; depends on story coverage being substantial

### Parallel Opportunities

Within Phase 2:

- T007, T008, T009, T010 can run in parallel (different handler files)
- T013, T014, T015 can run in parallel (different factory files)
- T018, T019, T020 can run in parallel (different scenario files)

Within Phase 5 (shadcn/ui stories):

- All T044-T077 can run in parallel (different component story files)

Within Phase 6 (page stories):

- T093, T094, T095, T096, T097 can run in parallel (different page story files)

---

## Parallel Example: Phase 5.1 shadcn/ui Tier 1

```bash
# Launch all Tier 1 UI component stories together:
Task: "Create input.stories.tsx in apps/web/src/components/ui/input.stories.tsx"
Task: "Create select.stories.tsx in apps/web/src/components/ui/select.stories.tsx"
Task: "Create checkbox.stories.tsx in apps/web/src/components/ui/checkbox.stories.tsx"
Task: "Create switch.stories.tsx in apps/web/src/components/ui/switch.stories.tsx"
Task: "Create tabs.stories.tsx in apps/web/src/components/ui/tabs.stories.tsx"
Task: "Create dropdown-menu.stories.tsx in apps/web/src/components/ui/dropdown-menu.stories.tsx"
Task: "Create dialog.stories.tsx in apps/web/src/components/ui/dialog.stories.tsx"
Task: "Create alert-dialog.stories.tsx in apps/web/src/components/ui/alert-dialog.stories.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + shadcn/ui stories)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational MSW infrastructure
3. Complete Phase 3: Inventory tool (US1)
4. Complete Phase 5.1-5.3: shadcn/ui component stories
5. **STOP and VALIDATE**: Run Storybook, verify UI components render
6. Demo to designer for feedback

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US1 (Inventory) → Coverage tracking available
3. Add US2 (MSW extension) → Mock data complete
4. Add US3 (Component stories) → Designer can review components
5. Add US4 (Page stories) → Designer can review full layouts
6. Add US5 (Chromatic) → Visual regression protection (after approval)

### Suggested MVP Scope

**Phase 1 + 2 + 3 + 5.1-5.3** (Setup, MSW, Inventory, shadcn/ui stories)

This delivers:

- Inventory tool for tracking progress
- Complete story coverage for all 45 shadcn/ui components
- Foundation for continued story development

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Chromatic (US5) deferred to end - requires external approval
- Commit after each task or logical group
- Stop at any checkpoint to validate and demo
- Use template files from contracts/ when creating stories
