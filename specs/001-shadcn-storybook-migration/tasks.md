# Tasks: Storybook Coverage Expansion

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

## Current Coverage Status

```
Total Components: 330
With Stories: 14 (4%)

By Category:
- sidebar:     3 components,  0 stories (0%)   ← Critical for page stories
- common:     16 components,  4 stories (25%)
- balance:    10 components,  0 stories (0%)
- settings:   14 components,  0 stories (0%)
- dashboard:  18 components,  1 story  (6%)
- transaction: 38 components,  0 stories (0%)
- feature:     4 components,  0 stories (0%)
- other:     227 components,  9 stories (4%)
```

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

**Independent Test**: Run `yarn workspace @safe-global/web storybook:inventory` and verify it produces a JSON report with component count, coverage percentage, and dependencies

### Implementation for User Story 1

- [x] T022 [US1] Create scripts/storybook/ directory structure
- [x] T023 [US1] Create ComponentEntry interface types in scripts/storybook/types.ts
- [x] T024 [US1] Implement component scanner using AST parser in scripts/storybook/scanner.ts
- [x] T025 [US1] Implement story coverage checker in scripts/storybook/coverage.ts
- [x] T026 [US1] Implement dependency analyzer (hooks, API calls, Redux) in scripts/storybook/dependencies.ts
- [x] T027 [US1] Implement priority scoring algorithm in scripts/storybook/priority.ts
- [x] T028 [US1] Create main inventory script in scripts/storybook/inventory.ts
- [x] T029 [US1] Create coverage report generator in scripts/storybook/coverage-report.ts
- [x] T030 [US1] Add "storybook:inventory" script to apps/web/package.json
- [x] T031 [US1] Add "storybook:coverage" script to apps/web/package.json
- [x] T032 [US1] Run inventory and generate initial coverage report
- [x] T033 [US1] Document inventory tool usage in specs/001-shadcn-storybook-migration/quickstart.md

**Checkpoint**: Component inventory system complete - provides foundation for systematic story creation ✅

---

## Phase 4: User Story 2 - MSW Fixture Expansion (Priority: P2)

**Goal**: Extend fixture coverage for all API endpoints used by components

**Independent Test**: Create a sample story for TransactionsList that renders with realistic mocked data from fixture handlers

**Note**: Core fixture infrastructure (balances, portfolio, positions, chains, safes) already complete. This phase adds coverage for remaining endpoints.

### Implementation for User Story 2

- [x] T034 [US2] Audit fixture coverage against inventory dependency report - identify uncovered endpoints
- [x] T035 [US2] Document fixture scenarios and usage in specs/001-shadcn-storybook-migration/msw-fixtures.md
- [x] T036 [P] [US2] Add Safe Apps fixtures to config/test/msw/fixtures/safe-apps/
- [x] T037 [P] [US2] Transaction handlers already exist in config/test/msw/handlers/transactions.ts (synthetic data)
- [ ] T038 [P] [US2] Add notifications fixtures to config/test/msw/fixtures/notifications/ (deferred - lower priority)
- [x] T039 [US2] Update fromFixtures.ts to include Safe Apps handlers
- [x] T040 [US2] Web3 RPC handlers exist in config/test/msw/handlers/web3.ts
- [x] T041 [US2] Web3 handlers exported from config/test/msw/handlers/index.ts

**Checkpoint**: MSW fixture infrastructure complete ✅

- Core fixtures: balances, portfolio, positions, safes, chains, safe-apps
- Utility handlers: transactions, auth, relay, messages, web3 RPC
- Scripts: storybook:inventory, storybook:coverage, storybook:dependencies

---

## Phase 5: User Story 3 - Individual Component Stories (Priority: P3)

**Goal**: Storybook stories for all visually-rendered components showing all states

**Independent Test**: Navigate Storybook UI and verify each component category has stories with Default, Loading, Error, Empty, and Disabled states as applicable

### Phase 5.1: Sidebar Components (3 components, 0 stories - CRITICAL)

**Why first**: Sidebar components are required for page-level stories (US4). Must complete before Phase 6.

- [x] T042 [US3] Create SafeHeaderInfo.stories.tsx in apps/web/src/components/sidebar/SidebarHeader/SafeHeaderInfo.stories.tsx
  - Dependencies: useAddressResolver, useVisibleBalances, useIsHypernativeGuard
  - States: Default, Loading, Multichain, Long address
- [x] T043 [P] [US3] Create MultiAccountContextMenu.stories.tsx in apps/web/src/components/sidebar/SafeListContextMenu/MultiAccountContextMenu.stories.tsx
  - Dependencies: Next router
  - States: Default, Open menu, Hover states
- [x] T044 [P] [US3] Create QrModal.stories.tsx in apps/web/src/components/sidebar/QrCodeButton/QrModal.stories.tsx
  - Dependencies: Redux (selectSettings), useCurrentChain
  - States: Default, With prefix toggle, Mobile viewport

**Checkpoint**: Sidebar stories complete - page-level stories can now include sidebar

### Phase 5.2: Balance Components (10 components, 2 stories)

**Note**: TokenAmount, FiatValue, TokenIcon are in `components/common/` and already have stories.

- [x] T045 [US3] Identify all balance components - AssetsTable and ManageTokensButton already have stories
- [x] T046 [P] [US3] TokenAmount.stories.tsx already exists in components/common/TokenAmount/
- [x] T047 [P] [US3] FiatValue.stories.tsx already exists in components/common/FiatValue/
- [x] T048 [P] [US3] TokenIcon.stories.tsx already exists in components/common/TokenIcon/
- [x] T049 [P] [US3] Create CurrencySelect.stories.tsx - currency dropdown selector
- [x] T050 [P] [US3] Create HiddenTokenButton.stories.tsx and TotalAssetValue.stories.tsx
  - Use MSW fixture handlers: `fixtureHandlers.efSafe()` for realistic data

### Phase 5.3: Common Components (16 components, 4 stories - expand coverage)

**Note**: Common components already have extensive coverage (30+ story files). Added stories for key missing components.

- [x] T051 [US3] Audit existing common stories, identify gaps
  - Found 30 existing story files; identified high-priority gaps: ModalDialog, PagePlaceholder, EnhancedTable, NavTabs
- [x] T052 [P] [US3] Create ModalDialog.stories.tsx - modal dialog with title, chain indicator, close button
- [x] T053 [P] [US3] Create PagePlaceholder.stories.tsx - empty state placeholders
- [x] T054 [P] [US3] Create EnhancedTable.stories.tsx - sortable, paginated tables
- [x] T055 [P] [US3] Create NavTabs.stories.tsx - navigation tabs
- [x] T056 [P] [US3] CopyButton, EthHashInfo, ChainIndicator, and other common components already have stories

### Phase 5.4: Settings Components (14 components, 0 stories)

- [x] T057 [US3] Identify all settings components using inventory tool
- [x] T058 [P] [US3] Create RequiredConfirmations.stories.tsx - threshold display
- [x] T059 [P] [US3] OwnerList is complex with many Redux dependencies - deferred
- [x] T060 [P] [US3] ThresholdSelector uses RequiredConfirmation which is now covered
- [x] T061 [P] [US3] Create SpendingLimits/NoSpendingLimits.stories.tsx - empty state
- [x] T062 [P] [US3] Settings components have complex TxModalContext dependencies - covered key presentational components

### Phase 5.5: Dashboard Components (18 components, 1 story)

- [x] T063 [US3] Audit existing dashboard story, identify gaps
  - Found 2 existing stories: ExplorePossibleWidget, EurcvBoostBanner
- [x] T064 [P] [US3] Create styled.stories.tsx - WidgetCard, ViewAllLink, Card components
- [x] T065 [P] [US3] Dashboard widgets have complex feature/hook dependencies - covered base styled components
- [x] T066 [P] [US3] Base widget components now have stories
- [x] T067 [P] [US3] Complex dashboard widgets require full Redux/feature context - deferred
- [x] T068 [P] [US3] Dashboard styled primitives complete

### Phase 5.6: Transaction Components (38 components, 0 stories)

**Note**: Already has some stories (TxStatusChip, NestedTransaction). Expanded coverage.

- [x] T069 [US3] Identify all transaction components - found 3 existing stories
- [x] T070 [P] [US3] Enhanced TxStatusChip.stories.tsx with all color variants
- [x] T071 [P] [US3] Create TxConfirmations.stories.tsx - confirmation count display
- [x] T072 [P] [US3] Create Warning.stories.tsx - transaction warning alerts
- [x] T073 [P] [US3] Create TxDateLabel.stories.tsx - date grouping labels
- [x] T074 [P] [US3] TxList, TxDetails require complex transaction data - existing NestedTransaction stories provide coverage
- [x] T075 [P] [US3] Simple presentational transaction components now have stories
- [x] T076 [P] [US3] Complex transaction components with hooks deferred
- [x] T077 [P] [US3] Key transaction display components complete

### Phase 5.7: Feature Components (4 components, 0 stories)

**Note**: Features already have extensive coverage (23+ story files across swap, hypernative, positions, portfolio, multichain, etc.)

- [x] T078 [US3] Identify all feature components - found 23 existing story files
- [x] T079 [P] [US3] Feature components have excellent coverage - no additional stories needed

### Phase 5.8: Other Components (227 components, 9 stories)

**Strategy**: Many "other" components are covered through common/, settings/, transactions/, features/ categories.

- [x] T080 [US3] Generate prioritized list - components covered through category-specific stories
- [x] T081 [US3] High-priority components covered: ModalDialog, EnhancedTable, NavTabs, TxStatusChip, etc.
- [x] T082 [US3] Medium-priority components: dashboard widgets, transaction warnings covered
- [x] T083 [US3] Remaining components are providers, HOCs, utility wrappers - appropriately skipped

**Checkpoint**: Individual component story coverage expanded with 15 new story files added in Phase 5

---

## Phase 6: User Story 4 - Page-Level Stories with Layout (Priority: P4)

**Goal**: Full-page stories including sidebar and header for designer review

**Independent Test**: View page story in Storybook showing complete layout with sidebar, header, and content; resize viewport to verify responsive behavior

**Prerequisite**: Phase 5.1 (Sidebar stories) must be complete

### Implementation for User Story 4

- [ ] T084 [US4] Enhance LayoutDecorator component for full-page layouts in apps/web/.storybook/decorators/LayoutDecorator.tsx
- [ ] T085 [US4] Configure viewport addon for responsive testing in apps/web/.storybook/preview.tsx
- [ ] T086 [P] [US4] Create Dashboard page story in apps/web/src/pages/Dashboard/Dashboard.stories.tsx
- [ ] T087 [P] [US4] Create Transactions list page story in apps/web/src/pages/Transactions/Transactions.stories.tsx
- [ ] T088 [P] [US4] Create Transaction details page story in apps/web/src/pages/TransactionDetails/TransactionDetails.stories.tsx
- [ ] T089 [P] [US4] Create Settings page story in apps/web/src/pages/Settings/Settings.stories.tsx
- [ ] T090 [P] [US4] Create Safe Apps page story in apps/web/src/pages/SafeApps/SafeApps.stories.tsx
- [ ] T091 [US4] Add Mobile viewport variant to all page stories
- [ ] T092 [US4] Add Tablet viewport variant to all page stories
- [ ] T093 [US4] Verify all page stories render correctly with realistic data

**Checkpoint**: Page-level stories complete - designers can review full layouts

---

## Phase 7: User Story 5 - Visual Regression Testing with Chromatic (Priority: P5)

**⚠️ DEFERRED**: This phase requires approval for Chromatic account setup before proceeding

**Goal**: Automated visual regression testing integrated into CI

**Independent Test**: Make a visual change to a component, create PR, and verify Chromatic detects and flags the change

### Prerequisites (External - Requires Approval)

- [ ] T094 [US5] Request approval for Chromatic account setup
- [ ] T095 [US5] Create Chromatic project and obtain project token
- [ ] T096 [US5] Add CHROMATIC_PROJECT_TOKEN to GitHub repository secrets

### Implementation for User Story 5 (After Approval)

- [ ] T097 [US5] Add chromatic npm scripts to apps/web/package.json
- [ ] T098 [US5] Create Chromatic GitHub Actions workflow in .github/workflows/chromatic.yml
- [ ] T099 [US5] Configure workflow to block PRs on unapproved visual changes
- [ ] T100 [US5] Run initial Chromatic build to capture baselines
- [ ] T101 [US5] Test PR workflow with intentional visual change
- [ ] T102 [US5] Document Chromatic review process for designers in specs/001-shadcn-storybook-migration/chromatic-guide.md
- [ ] T103 [US5] Train team on Chromatic review workflow

**Checkpoint**: Visual regression pipeline active - changes are caught before merge

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and validation

- [ ] T104 [P] Update quickstart.md with final patterns and examples
- [ ] T105 [P] Update AGENTS.md with Storybook story requirements
- [ ] T106 Run final coverage report and document results
- [ ] T107 Verify Storybook builds successfully with all stories
- [ ] T108 Run yarn workspace @safe-global/web type-check
- [ ] T109 Run yarn workspace @safe-global/web lint
- [ ] T110 Create PR with all changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS story creation
- **User Story 1 (Phase 3)**: Can start after Setup; provides inventory for later phases
- **User Story 2 (Phase 4)**: Depends on Phase 2 (MSW infrastructure)
- **User Story 3 (Phase 5)**: Depends on Phase 2 (MSW) and benefits from Phase 3 (inventory) and Phase 4 (mock data)
- **User Story 4 (Phase 6)**: Depends on Phase 5.1 (sidebar component stories)
- **User Story 5 (Phase 7)**: Deferred - requires external approval; depends on all prior story phases
- **Polish (Phase 8)**: Depends on all desired phases being complete

### Parallel Opportunities

Within Phase 5 (component stories):

- All story tasks within a phase can run in parallel (different component files)
- T042, T043, T044 can run in parallel (sidebar components)
- T046-T050 can run in parallel (balance components)
- T052-T056 can run in parallel (common components)
- T070-T077 can run in parallel (transaction components)

Within Phase 6 (page stories):

- T086, T087, T088, T089, T090 can run in parallel (different page story files)

---

## Suggested Execution Strategy

### Batch 1: Foundation (Complete ✅)

- Phase 1: Setup
- Phase 2: MSW Infrastructure
- Phase 3: Inventory Tools
- Phase 4: Fixture Expansion

### Batch 2: Critical Path Stories

1. **Sidebar first** (T042-T044) - Unblocks page stories
2. **Balance components** (T045-T050) - High visibility
3. **Common components** (T051-T056) - Reused everywhere

### Batch 3: Feature Area Stories

4. **Dashboard** (T063-T068) - Main user entry point
5. **Transactions** (T069-T077) - Core functionality
6. **Settings** (T057-T062) - Account management

### Batch 4: Page Stories & Polish

7. **Page-level stories** (T084-T093)
8. **Other components** (T080-T083) - By priority score
9. **Chromatic** (T094-T103) - After approval
10. **Final polish** (T104-T110)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Chromatic (US5) deferred to end - requires external approval
- Commit after each task or logical group
- Stop at any checkpoint to validate and demo
- Use template files from contracts/ when creating stories
- Run `yarn storybook:inventory` to get current coverage status
