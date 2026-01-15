# Tasks: Refactor Earn Feature

**Input**: Design documents from `/specs/002-refactor-earn-feature/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: No new tests required. This is a pure refactoring task that must preserve all existing functionality. Manual testing checklist provided in `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each structural improvement.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- All paths are relative to `apps/web/src/features/earn/`

---

## Phase 1: Setup (Pre-Refactoring Preparation)

**Purpose**: Prepare for refactoring by backing up, documenting current state, and verifying baseline

- [ ] T001 Create a backup of the current earn feature state (git commit or branch checkpoint)
- [ ] T002 Run and document current type-check status: `yarn workspace @safe-global/web type-check | grep earn`
- [ ] T003 [P] Run and document current lint status: `yarn workspace @safe-global/web lint | grep earn`
- [ ] T004 [P] Document all current external imports (search codebase for `@/features/earn`)

**Checkpoint**: Baseline documented and verified - ready to begin refactoring

---

## Phase 2: Foundational (Core Structure Files)

**Purpose**: Create foundational files that all subsequent tasks depend on

**⚠️ CRITICAL**: No component/hook refactoring can begin until these core files exist

- [ ] T006 Create `apps/web/src/features/earn/types.ts` with `EarnButtonProps` interface from research.md
- [ ] T007 Create `apps/web/src/features/earn/hooks/index.ts` barrel export file (initially empty)
- [ ] T008 [P] Create `apps/web/src/features/earn/components/index.ts` barrel export file (initially empty)
- [ ] T009 [P] Create `apps/web/src/features/earn/services/` directory
- [ ] T010 Create `apps/web/src/features/earn/services/index.ts` barrel export file (initially empty)

**Checkpoint**: Foundation ready - component/hook/service refactoring can now proceed

---

## Phase 3: User Story 1 - Restructure Earn Feature Folders (Priority: P1) 🎯

**Goal**: Organize all files into standard folders with proper barrel exports

**Independent Test**: Verify folder structure exactly matches pattern in `apps/web/docs/feature-architecture.md`

### 3.1: Move Services

- [ ] T011 [US1] Move `apps/web/src/features/earn/utils.ts` to `apps/web/src/features/earn/services/utils.ts`
- [ ] T012 [US1] Update all internal imports of `utils.ts` to point to `../services/utils` or `./services/utils`
- [ ] T013 [US1] Export utilities from `services/index.ts`: `export { vaultTypeToLabel, isEligibleEarnToken } from './utils'`

### 3.2: Rename Main Component

- [ ] T014 [US1] Create directory `apps/web/src/features/earn/components/EarnPage/`
- [ ] T015 [US1] Move current `apps/web/src/features/earn/index.tsx` to `apps/web/src/features/earn/components/EarnPage/index.tsx`
- [ ] T016 [US1] Update imports in `EarnPage/index.tsx` to use relative paths (e.g., `../../constants`, `../EarnView`)

### 3.3: Update Hook Exports

- [ ] T017 [US1] Update `useIsEarnFeatureEnabled.ts` to use named export: `export function useIsEarnFeatureEnabled(): boolean | undefined`
- [ ] T018 [US1] Update `useIsEarnFeatureEnabled.ts` to properly handle undefined return (preserve loading state) per research.md
- [ ] T019 [US1] Export hooks from `hooks/index.ts`:
  ```typescript
  export { useIsEarnFeatureEnabled } from './useIsEarnFeatureEnabled'
  export { default as useGetWidgetUrl } from './useGetWidgetUrl'
  ```

### 3.4: Update Component Barrel Exports

- [ ] T020 [US1] Export components from `components/index.ts`:
  ```typescript
  export { default as EarnPage } from './EarnPage'
  export { default as EarnButton } from './EarnButton'
  // Do NOT export EarnView, EarnWidget, EarnInfo, or vault components (internal)
  ```

**Checkpoint**: Folder structure complete - all files organized in correct directories

---

## Phase 4: User Story 2 - Create Proper Public API (Priority: P1) 🎯

**Goal**: Expose only public API through root `index.ts`, preventing direct imports of internals

**Independent Test**: Attempt to import internal components from outside feature (should fail after barrel file is the only entry point)

### 4.1: Create Public API Barrel File

- [ ] T021 [US2] Create new `apps/web/src/features/earn/index.ts` (replacing old index.tsx) with structure from research.md:

  ```typescript
  import dynamic from 'next/dynamic'

  // Re-export types
  export type { EarnButtonProps } from './types'

  // Re-export hooks
  export { useIsEarnFeatureEnabled } from './hooks'

  // Re-export components
  export { EarnButton } from './components'

  // Default export: lazy-loaded main component
  const EarnPage = dynamic(() => import('./components/EarnPage').then((mod) => ({ default: mod.default })), {
    ssr: false,
  })

  export default EarnPage
  ```

### 4.2: Update External Imports (Files Outside Earn Feature)

- [ ] T022 [US2] Update `apps/web/src/components/dashboard/Assets/index.tsx`:
  - Change: `import EarnButton from '@/features/earn/components/EarnButton'`
  - To: `import { EarnButton } from '@/features/earn'`

- [ ] T023 [US2] Update `apps/web/src/components/balances/AssetsTable/PromoButtons.tsx`:
  - Change: `import EarnButton from '@/features/earn/components/EarnButton'`
  - To: `import { EarnButton } from '@/features/earn'`

- [ ] T024 [US2] Update `apps/web/src/components/dashboard/index.tsx`:
  - Change: `import { useIsEarnFeatureEnabled as useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'`
  - To: `import { useIsEarnFeatureEnabled as useIsEarnPromoEnabled } from '@/features/earn'`

### 4.3: Verify No Deep Imports Remain

- [ ] T025 [US2] Search codebase for remaining deep imports: `grep -r "@/features/earn/components" apps/web/src/` (should return nothing)
- [ ] T026 [US2] Search codebase for remaining deep imports: `grep -r "@/features/earn/hooks" apps/web/src/` (should return nothing)
- [ ] T027 [US2] Search codebase for remaining deep imports: `grep -r "@/features/earn/services" apps/web/src/` (should return nothing)

**Checkpoint**: Public API complete - all external imports use `@/features/earn` barrel file

---

## Phase 5: User Story 3 - Ensure Proper Lazy Loading (Priority: P1) 🎯

**Goal**: Verify earn feature is lazy-loaded and code-split correctly

**Independent Test**: Disable EARN feature flag, load app, verify no earn code loaded in bundle

### 5.1: Verify Page-Level Lazy Loading

- [ ] T028 [US3] Verify `apps/web/src/pages/earn.tsx` uses `dynamic(() => import('@/features/earn'), { ssr: false })`
  - ✅ Already correct (confirmed in research.md), no changes needed

### 5.2: Verify No Static Imports

- [ ] T029 [US3] Search for static imports of earn feature: `grep -r "^import.*@/features/earn" apps/web/src/ | grep -v "pages/earn.tsx"`
  - Verify only the three updated files from Phase 4 appear (Assets, PromoButtons, dashboard)
  - Verify all three use dynamic imports or are not page-level (components can use named imports)

### 5.3: Bundle Analysis

- [ ] T030 [US3] Build the app: `yarn workspace @safe-global/web build`
- [ ] T031 [US3] Analyze bundle to verify earn is in separate chunk:
  - Look for chunk files containing "earn" in `.next/static/chunks/`
  - Verify earn code is not in main bundle (`main-*.js`)

### 5.4: Runtime Verification

- [ ] T032 [US3] Start app, open DevTools Network tab, navigate to a chain with earn DISABLED
- [ ] T033 [US3] Navigate to `/earn` page
- [ ] T034 [US3] Verify "Earn is not available on this network" message shows
- [ ] T035 [US3] Verify no network requests for earn-related chunks in DevTools
- [ ] T036 [US3] Navigate to a chain with earn ENABLED (Ethereum mainnet or Base)
- [ ] T037 [US3] Navigate to `/earn` page
- [ ] T038 [US3] Verify earn page loads and shows disclaimer or widget
- [ ] T039 [US3] Verify earn chunk is loaded on-demand in DevTools Network tab

**Checkpoint**: Lazy loading verified - earn code only loads when feature is enabled and user navigates to page

---

## Phase 6: User Story 4 - Add TypeScript Type Definitions (Priority: P2)

**Goal**: All TypeScript interfaces centralized in `types.ts`

**Independent Test**: Verify all types exported from `types.ts`, no inline interfaces in components

### 6.1: Update EarnButton to Use Centralized Types

- [ ] T040 [US4] Update `apps/web/src/features/earn/components/EarnButton/index.tsx`:
  - Remove inline props interface (lines 18-27)
  - Import type from parent: `import type { EarnButtonProps } from '../../types'`
  - Change component signature to: `const EarnButton = (props: EarnButtonProps): ReactElement => {`
  - Destructure props inside component body

### 6.2: Verify Type Exports

- [ ] T041 [US4] Verify `types.ts` exports `EarnButtonProps` interface
- [ ] T042 [US4] Verify root `index.ts` re-exports: `export type { EarnButtonProps } from './types'`

### 6.3: Verify Type Safety

- [ ] T043 [US4] Run type-check: `yarn workspace @safe-global/web type-check`
- [ ] T044 [US4] Verify no type errors related to earn feature
- [ ] T045 [US4] Verify external consumers of `EarnButton` still type-check correctly

**Checkpoint**: Types centralized - all earn types defined in `types.ts` with proper exports

---

## Phase 7: User Story 5 - Preserve All Existing Functionality (Priority: P1) 🎯

**Goal**: Validate 100% of existing functionality works identically after refactoring

**Independent Test**: Run manual testing checklist from `quickstart.md` and verify all scenarios pass

### 7.1: Type Checking & Linting

- [ ] T046 [US5] Run type-check: `yarn workspace @safe-global/web type-check` (must pass with zero errors)
- [ ] T047 [US5] Run lint: `yarn workspace @safe-global/web lint` (must pass or match baseline from T003)
- [ ] T048 [US5] Run format check: `yarn workspace @safe-global/web prettier` (must pass)

### 7.2: Build Verification

- [ ] T049 [US5] Clean build artifacts: `rm -rf apps/web/.next`
- [ ] T050 [US5] Build app: `yarn workspace @safe-global/web build` (must succeed)

### 7.3: Manual Testing - Feature Flag Behavior

- [ ] T051 [P] [US5] Navigate to Ethereum mainnet (chain with earn enabled)
- [ ] T052 [P] [US5] Verify `/earn` page loads successfully
- [ ] T053 [P] [US5] Navigate to Sepolia testnet (chain with earn disabled)
- [ ] T054 [P] [US5] Verify `/earn` shows "not available" message

### 7.4: Manual Testing - Consent Flow

- [ ] T055 [US5] Clear localStorage key `lendDisclaimerAcceptedV1`
- [ ] T056 [US5] Navigate to `/earn` on enabled chain
- [ ] T057 [US5] Verify disclaimer is shown with "Continue" button
- [ ] T058 [US5] Click "Continue" button
- [ ] T059 [US5] Verify widget loads (iframe from kiln.fi domain)
- [ ] T060 [US5] Refresh page
- [ ] T061 [US5] Verify widget loads directly (disclaimer not shown again)

### 7.5: Manual Testing - Info Panel Flow

- [ ] T062 [US5] Clear localStorage key `hideEarnInfoV2`
- [ ] T063 [US5] Accept disclaimer (if needed from previous test)
- [ ] T064 [US5] Verify info panel is shown with "Get Started" button
- [ ] T065 [US5] Click "Get Started" button
- [ ] T066 [US5] Verify widget loads
- [ ] T067 [US5] Refresh page
- [ ] T068 [US5] Verify widget loads directly (info panel not shown again)

### 7.6: Manual Testing - Asset Selection

- [ ] T069 [US5] Navigate to `/balances` page
- [ ] T070 [US5] Find an eligible earn asset (e.g., WETH) in the balances table
- [ ] T071 [US5] Click the "Earn" button on the asset row
- [ ] T072 [US5] Verify navigation to `/earn?asset_id={chainId}_{address}`
- [ ] T073 [US5] Verify URL contains correct asset_id query parameter
- [ ] T074 [US5] Verify Kiln widget iframe loads with asset pre-selected
- [ ] T075 [US5] Navigate directly to `/earn` (no query parameter)
- [ ] T076 [US5] Verify widget loads without pre-selected asset

### 7.7: Manual Testing - EarnButton Component

- [ ] T077 [US5] Navigate to dashboard with assets
- [ ] T078 [US5] Verify "Earn" buttons appear on eligible assets
- [ ] T079 [US5] Hover over earn button, verify tooltip/visual feedback
- [ ] T080 [US5] Click earn button, verify navigation with asset_id

### 7.8: Manual Testing - Theme Switching

- [ ] T081 [US5] Load `/earn` page in light mode
- [ ] T082 [US5] Verify widget uses light theme (check iframe URL params)
- [ ] T083 [US5] Switch to dark mode using app header toggle
- [ ] T084 [US5] Verify widget switches to dark theme (check iframe URL params)

### 7.9: Manual Testing - Analytics (Optional)

- [ ] T085 [P] [US5] Open browser DevTools > Network tab, filter for analytics requests
- [ ] T086 [P] [US5] Click "Earn" button on asset, verify `EARN_VIEWED` event fires
- [ ] T087 [P] [US5] Click "Get Started" in info panel, verify `GET_STARTED_WITH_EARN` event fires
- [ ] T088 [P] [US5] Click "Learn more" link, verify `OPEN_EARN_LEARN_MORE` event fires

**Checkpoint**: All functionality verified - refactoring preserves 100% of existing behavior

---

## Phase 8: Polish & Validation

**Purpose**: Final cleanup, documentation, and compliance verification

### 8.1: Code Quality

- [ ] T089 [P] Run prettier auto-fix: `yarn prettier:fix`
- [ ] T090 [P] Final type-check: `yarn workspace @safe-global/web type-check` (must pass)
- [ ] T091 [P] Final lint check: `yarn workspace @safe-global/web lint` (must pass)

### 8.2: Architecture Compliance

- [ ] T092 Review folder structure against checklist in `apps/web/docs/feature-architecture.md`
- [ ] T093 Verify all required files exist: `index.ts`, `types.ts`, `constants.ts`, `components/index.ts`, `hooks/index.ts`, `services/index.ts`
- [ ] T094 Verify no files in wrong locations (e.g., no loose files in feature root except required ones)

### 8.3: Documentation

- [ ] T095 [P] Update `apps/web/docs/feature-architecture.md` if any learnings from this refactoring should be added
- [ ] T096 [P] Document any challenges or deviations in migration notes (if applicable)

### 8.4: Git & Cleanup

- [ ] T097 Review all changed files in git diff
- [ ] T098 Verify no unintended changes (e.g., formatting changes in unrelated files)
- [ ] T099 Verify all TODOs or FIXME comments are addressed
- [ ] T100 Stage all changes: `git add apps/web/src/features/earn/`
- [ ] T101 Stage external import updates: `git add apps/web/src/components/dashboard/Assets/ apps/web/src/components/balances/AssetsTable/ apps/web/src/components/dashboard/`

### 8.5: Success Criteria Validation

Verify all success criteria from spec.md:

- [ ] T102 ✅ SC-001: Folder structure passes 100% compliance against feature-architecture.md checklist
- [ ] T103 ✅ SC-002: All existing tests pass (N/A - no tests exist)
- [ ] T104 ✅ SC-003: Bundle analysis confirms earn in separate chunk, not loaded when disabled
- [ ] T105 ✅ SC-004: External imports use only `@/features/earn` (verified by grep in T025-T027)
- [ ] T106 ✅ SC-005: `types.ts` contains all earn-specific interfaces
- [ ] T107 ✅ SC-006: Earn page loads and functions identically (verified by manual testing)
- [ ] T108 ✅ SC-007: Analytics events fire correctly (verified by manual testing)
- [ ] T109 ✅ SC-008: Geoblocking and consent work identically (verified by manual testing)

**Checkpoint**: All success criteria met - refactoring complete and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all refactoring work
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) - needs folder structure in place
- **User Story 3 (Phase 5)**: Depends on User Story 2 (Phase 4) - needs public API in place
- **User Story 4 (Phase 6)**: Can run in parallel with Phase 5 - independent type work
- **User Story 5 (Phase 7)**: Depends on all previous phases - final validation
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Folder Structure)**: Must complete before US2 (needs organized structure)
- **US2 (Public API)**: Must complete before US3 (lazy loading needs public API)
- **US3 (Lazy Loading)**: Can run after US2, independent of US4
- **US4 (Type Definitions)**: Can run in parallel with US3, independent type work
- **US5 (Preserve Functionality)**: Must run last, validates all previous work

### Within Each Phase

- Tasks marked [P] can run in parallel (different files)
- Tasks marked [US#] are sequenced within that user story
- Follow task numbers for optimal ordering

### Parallel Opportunities

Within Phase 3.1 (Move Services):

- T011, T012, T013 are sequential (same files)

Within Phase 3.3 (Update Hook Exports):

- T017, T018, T019 are sequential (same files)

Within Phase 4.2 (Update External Imports):

- T022, T023, T024 can run in parallel (different files) ✅

Within Phase 7 (Manual Testing):

- T051-T054 can run in parallel (feature flag tests) ✅
- T085-T088 can run in parallel (analytics tests) ✅

Within Phase 8.1 (Code Quality):

- T089, T090, T091 can run in parallel (different tools) ✅

Within Phase 8.3 (Documentation):

- T095, T096 can run in parallel (different docs) ✅

---

## Implementation Strategy

### Recommended Sequence (Single Developer)

1. **Phase 1: Setup** (T001-T005) - 30 minutes
   - Document baseline, verify current state

2. **Phase 2: Foundational** (T006-T010) - 30 minutes
   - Create core structure files (types, barrel exports, directories)

3. **Phase 3: User Story 1** (T011-T020) - 2 hours
   - Reorganize folder structure, move files, update imports

4. **Phase 4: User Story 2** (T021-T027) - 1 hour
   - Create public API, update external imports

5. **Phase 5: User Story 3** (T028-T039) - 1 hour
   - Verify lazy loading, test bundle splitting

6. **Phase 6: User Story 4** (T040-T045) - 30 minutes
   - Centralize types, update EarnButton

7. **Phase 7: User Story 5** (T046-T088) - 2-3 hours
   - Comprehensive manual testing of all functionality

8. **Phase 8: Polish** (T089-T109) - 1 hour
   - Final validation, cleanup, success criteria check

**Total Estimated Time**: 8-10 hours (single developer, sequential)

### Checkpoints for Validation

Stop and validate at these points:

1. ✅ **After Phase 2**: All foundational files exist, structure ready
2. ✅ **After Phase 3**: Folder structure matches standard, all files organized
3. ✅ **After Phase 4**: Public API created, external imports updated, no deep imports
4. ✅ **After Phase 5**: Bundle analysis confirms code splitting works
5. ✅ **After Phase 6**: Types centralized, type-check passes
6. ✅ **After Phase 7**: All manual tests pass, functionality preserved
7. ✅ **After Phase 8**: All success criteria met, ready to commit

---

## Notes

- This is a **pure refactoring task** with zero functional changes
- No new features, components, or logic are being added
- All existing behavior must be preserved exactly
- Focus on structural organization and API boundaries
- Reference implementation: `apps/web/src/features/walletconnect/`
- Complete documentation: `apps/web/docs/feature-architecture.md`
- Manual testing checklist: `specs/002-refactor-earn-feature/quickstart.md`

---

## Commit Strategy

Suggested commit points:

1. After Phase 2 (Foundational): `feat(earn): create foundational structure files`
2. After Phase 3 (US1): `refactor(earn): reorganize folder structure to match standard pattern`
3. After Phase 4 (US2): `refactor(earn): create public API and update external imports`
4. After Phase 5 (US3): `refactor(earn): verify lazy loading and code splitting`
5. After Phase 6 (US4): `refactor(earn): centralize TypeScript types`
6. After Phase 8 (Polish): `refactor(earn): final cleanup and validation`

Or single commit after all phases complete:

- `refactor(earn): restructure feature to follow standard architecture pattern`

Follow semantic commit conventions per `CONTRIBUTING.md`.
