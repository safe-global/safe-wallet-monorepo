# Tasks: Migrate No Fee Campaign to Feature Architecture

**Input**: Design documents from `/specs/004-migrate-no-fee-campaign/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: No new tests required. This is a pure refactoring task that must preserve all existing functionality. Manual testing checklist provided in `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each architectural improvement.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US3)
- All paths are relative to `apps/web/src/features/no-fee-campaign/` unless otherwise specified

---

## Phase 1: Setup (Pre-Migration Preparation)

**Purpose**: Prepare for migration by backing up, documenting current state, and verifying baseline

- [x] T001 Create a backup of the current no-fee-campaign feature state (git commit or branch checkpoint)
- [x] T002 Run and document current type-check status: `yarn workspace @safe-global/web type-check | grep -i "no-fee-campaign\|noFeeCampaign" || echo "No type errors"`
- [x] T003 [P] Run and document current lint status: `yarn workspace @safe-global/web lint | grep -i "no-fee-campaign\|noFeeCampaign" || echo "No lint warnings"`
- [x] T004 [P] Document all current external imports (search codebase for `@/features/no-fee-campaign`): `grep -r "@/features/no-fee-campaign" apps/web/src/ --exclude-dir=node_modules`
- [x] T005 [P] Verify semantic mapping exists: Check that `apps/web/src/features/__core__/createFeatureHandle.ts` contains `'no-fee-campaign': FEATURES.NO_FEE_NOVEMBER` mapping

**Checkpoint**: Baseline documented and verified - ready to begin migration

---

## Phase 2: Foundational (Core Architecture Files)

**Purpose**: Create foundational files that all subsequent tasks depend on

**⚠️ CRITICAL**: No consumer updates can begin until these core files exist

- [x] T006 Create `apps/web/src/features/no-fee-campaign/contract.ts` with flat structure from `contracts/NoFeeCampaignContract.ts`:

  ```typescript
  import type NoFeeCampaignBanner from './components/NoFeeCampaignBanner'
  import type NoFeeCampaignTransactionCard from './components/NoFeeCampaignTransactionCard'
  import type GasTooHighBanner from './components/GasTooHighBanner'

  export interface NoFeeCampaignContract {
    NoFeeCampaignBanner: typeof NoFeeCampaignBanner
    NoFeeCampaignTransactionCard: typeof NoFeeCampaignTransactionCard
    GasTooHighBanner: typeof GasTooHighBanner
  }
  ```

- [x] T007 Create `apps/web/src/features/no-fee-campaign/feature.ts` with direct imports:

  ```typescript
  import type { NoFeeCampaignContract } from './contract'

  import NoFeeCampaignBanner from './components/NoFeeCampaignBanner'
  import NoFeeCampaignTransactionCard from './components/NoFeeCampaignTransactionCard'
  import GasTooHighBanner from './components/GasTooHighBanner'

  export default {
    NoFeeCampaignBanner,
    NoFeeCampaignTransactionCard,
    GasTooHighBanner,
  } satisfies NoFeeCampaignContract
  ```

**Checkpoint**: Foundation ready - hook exports and consumer updates can now proceed

---

## Phase 3: User Story 1 - Maintain Functional Parity (Priority: P1) 🎯

**Goal**: Ensure all existing No Fee Campaign functionality works identically after migration

**Independent Test**: Verify all No Fee Campaign UI components render correctly, eligibility checks work, and transaction execution with the campaign option functions as expected. Test on chains with feature enabled and disabled.

### 3.1: Update Hook Exports to Named Exports

- [x] T009 [US1] Update `apps/web/src/features/no-fee-campaign/hooks/useIsNoFeeCampaignEnabled.ts`:
  - Change from: `export default useIsNoFeeCampaignEnabled`
  - To: `export function useIsNoFeeCampaignEnabled() { ... }` (named export)

- [x] T010 [US1] Update `apps/web/src/features/no-fee-campaign/hooks/useNoFeeCampaignEligibility.ts`:
  - Change from: `export default useNoFeeCampaignEligibility`
  - To: `export function useNoFeeCampaignEligibility() { ... }` (named export)

- [x] T011 [US1] Update `apps/web/src/features/no-fee-campaign/hooks/useGasTooHigh.ts`:
  - Change from: `export default useGasTooHigh`
  - To: `export function useGasTooHigh(safeTx?: SafeTransaction): boolean | undefined { ... }` (named export)

### 3.2: Create Public API (index.ts)

- [x] T012 [US1] Create new `apps/web/src/features/no-fee-campaign/index.ts` with feature handle and hook exports:

  ```typescript
  import { createFeatureHandle } from '@/features/__core__'
  import type { NoFeeCampaignContract } from './contract'

  export const NoFeeCampaignFeature = createFeatureHandle<NoFeeCampaignContract>('no-fee-campaign')

  export type { NoFeeCampaignContract } from './contract'

  export { useIsNoFeeCampaignEnabled } from './hooks/useIsNoFeeCampaignEnabled'
  export { useNoFeeCampaignEligibility } from './hooks/useNoFeeCampaignEligibility'
  export { useGasTooHigh } from './hooks/useGasTooHigh'
  ```

### 3.3: Verify Type Safety

- [x] T013 [US1] Run type-check: `yarn workspace @safe-global/web type-check` (must pass with zero errors related to no-fee-campaign)

**Checkpoint**: Core architecture files created - hooks use named exports, public API exists, type-check passes

---

## Phase 4: User Story 2 - Verify Lazy Loading (Priority: P1)

**Goal**: Verify No Fee Campaign code is properly code-split and lazy-loaded

**Independent Test**: Build the application with the feature disabled and verify that No Fee Campaign code is in a separate chunk that is not loaded initially. Test on chains with feature enabled and disabled.

### 4.1: Bundle Analysis

- [ ] T014 [US2] Build the app: `yarn workspace @safe-global/web build`
- [ ] T015 [US2] Analyze bundle to verify no-fee-campaign is in separate chunk:
  - Look for chunk files containing "no-fee-campaign" or similar in `.next/static/chunks/`
  - Verify no-fee-campaign code is not in main bundle (`main-*.js`)
  - Document chunk file names and sizes

### 4.2: Runtime Verification

- [ ] T016 [US2] Start app, open DevTools Network tab, navigate to a chain with NO_FEE_NOVEMBER DISABLED
- [ ] T017 [US2] Navigate to dashboard and transaction pages
- [ ] T018 [US2] Verify no network requests for no-fee-campaign-related chunks in DevTools
- [ ] T019 [US2] Navigate to a chain with NO_FEE_NOVEMBER ENABLED (Ethereum mainnet)
- [ ] T020 [US2] Navigate to dashboard and verify No Fee Campaign banner appears if eligible
- [ ] T021 [US2] Verify no-fee-campaign chunk is loaded on-demand in DevTools Network tab

**Checkpoint**: Lazy loading verified - no-fee-campaign code only loads when feature is enabled and accessed

---

## Phase 5: User Story 3 - Follow Architecture Standards (Priority: P1) 🎯

**Goal**: Update all consumer code to use `useLoadFeature()` pattern and verify architecture compliance

**Independent Test**: Verify that the feature has the required files (contract.ts, feature.ts, index.ts), follows naming conventions, exports hooks correctly, and passes ESLint rules.

### 5.1: Update Consumer Code - Dashboard

- [x] T022 [US3] Update `apps/web/src/components/dashboard/index.tsx`:
  - Remove: `import NoFeeCampaignBanner, { noFeeCampaignBannerID } from '@/features/no-fee-campaign/components/NoFeeCampaignBanner'`
  - Remove: `import useNoFeeCampaignEligibility from '@/features/no-fee-campaign/hooks/useNoFeeCampaignEligibility'`
  - Remove: `import useIsNoFeeCampaignEnabled from '@/features/no-fee-campaign/hooks/useIsNoFeeCampaignEnabled'`
  - Add: `import { NoFeeCampaignFeature, useNoFeeCampaignEligibility, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'`
  - Add: `import { useLoadFeature } from '@/features/__core__'`
  - Update component usage: Replace `<NoFeeCampaignBanner />` with `const { NoFeeCampaignBanner } = useLoadFeature(NoFeeCampaignFeature)` and use `<NoFeeCampaignBanner />`
  - Handle `noFeeCampaignBannerID`: If needed externally, export it from `index.ts` as a named constant export (e.g., `export { noFeeCampaignBannerID } from './components/NoFeeCampaignBanner'`). If only used for banner display logic, keep it internal to the component.

### 5.2: Update Consumer Code - Execute Form

- [x] T023 [US3] Update `apps/web/src/components/tx-flow/actions/Execute/ExecuteForm.tsx`:
  - Remove: `import useNoFeeCampaignEligibility from '@/features/no-fee-campaign/hooks/useNoFeeCampaignEligibility'`
  - Remove: `import useGasTooHigh from '@/features/no-fee-campaign/hooks/useGasTooHigh'`
  - Remove: `import useIsNoFeeCampaignEnabled from '@/features/no-fee-campaign/hooks/useIsNoFeeCampaignEnabled'`
  - Add: `import { useNoFeeCampaignEligibility, useGasTooHigh, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'`
  - Note: Only add `NoFeeCampaignFeature` and `useLoadFeature` imports if this file uses components from the feature
  - Update: If any components are used, replace with destructuring pattern: `const { ComponentName } = useLoadFeature(NoFeeCampaignFeature)`
  - Hooks are imported directly (always loaded, not lazy) and work independently of the feature handle

### 5.3: Update Consumer Code - Execution Method Selector

- [x] T024 [US3] Update `apps/web/src/components/tx/ExecutionMethodSelector/index.tsx`:
  - Remove: `import GasTooHighBanner from '@/features/no-fee-campaign/components/GasTooHighBanner'`
  - Add: `import { NoFeeCampaignFeature } from '@/features/no-fee-campaign'`
  - Add: `import { useLoadFeature } from '@/features/__core__'`
  - Update: Replace `<GasTooHighBanner />` with `const { GasTooHighBanner } = useLoadFeature(NoFeeCampaignFeature)` and use `<GasTooHighBanner />`

### 5.4: Update Consumer Code - Token Transfer

- [x] T025 [US3] Update `apps/web/src/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer.tsx`:
  - Remove: `import NoFeeCampaignTransactionCard from '@/features/no-fee-campaign/components/NoFeeCampaignTransactionCard'`
  - Remove: `import useNoFeeCampaignEligibility from '@/features/no-fee-campaign/hooks/useNoFeeCampaignEligibility'`
  - Remove: `import useIsNoFeeCampaignEnabled from '@/features/no-fee-campaign/hooks/useIsNoFeeCampaignEnabled'`
  - Add: `import { NoFeeCampaignFeature, useNoFeeCampaignEligibility, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'`
  - Add: `import { useLoadFeature } from '@/features/__core__'`
  - Update: Replace `<NoFeeCampaignTransactionCard />` with `const { NoFeeCampaignTransactionCard } = useLoadFeature(NoFeeCampaignFeature)` and use `<NoFeeCampaignTransactionCard />`

### 5.5: Update Consumer Code - Balances Page

- [x] T026 [US3] Update `apps/web/src/pages/balances/index.tsx`:
  - Remove: `import NoFeeCampaignBanner from '@/features/no-fee-campaign/components/NoFeeCampaignBanner'`
  - Remove: `import useIsNoFeeCampaignEnabled from '@/features/no-fee-campaign/hooks/useIsNoFeeCampaignEnabled'`
  - Add: `import { NoFeeCampaignFeature, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'`
  - Add: `import { useLoadFeature } from '@/features/__core__'`
  - Update: Replace `<NoFeeCampaignBanner />` with `const { NoFeeCampaignBanner } = useLoadFeature(NoFeeCampaignFeature)` and use `<NoFeeCampaignBanner />`

### 5.6: Verify No Deep Imports Remain

- [x] T027 [US3] Search codebase for remaining deep imports: `grep -r "@/features/no-fee-campaign/components" apps/web/src/ --exclude-dir=node_modules` (should return nothing)
- [x] T028 [US3] Search codebase for remaining deep imports: `grep -r "@/features/no-fee-campaign/hooks" apps/web/src/ --exclude-dir=node_modules` (should return nothing)
- [x] T029 [US3] Search codebase for remaining deep imports: `grep -r "@/features/no-fee-campaign/services" apps/web/src/ --exclude-dir=node_modules` (should return nothing)

### 5.7: ESLint Verification

- [x] T030 [US3] Run lint: `yarn workspace @safe-global/web lint` (must pass with zero restricted import warnings for no-fee-campaign)
- [x] T031 [US3] Verify no ESLint warnings about importing from `@/features/no-fee-campaign/components`, `@/features/no-fee-campaign/hooks`, or `@/features/no-fee-campaign/services`

### 5.8: Architecture Compliance Check

- [x] T032 [US3] Verify all required files exist:
  - `apps/web/src/features/no-fee-campaign/index.ts` ✅
  - `apps/web/src/features/no-fee-campaign/contract.ts` ✅
  - `apps/web/src/features/no-fee-campaign/feature.ts` ✅
  - `apps/web/src/features/no-fee-campaign/constants.ts` ✅ (unchanged)
- [x] T033 [US3] Verify folder structure matches standard pattern from `apps/web/docs/feature-architecture.md`
- [x] T034 [US3] Verify contract uses flat structure (no nested categories)
- [x] T035 [US3] Verify feature.ts uses direct imports (no `lazy()` calls)
- [x] T036 [US3] Verify hooks are exported directly from index.ts (not in contract or feature.ts)

**Checkpoint**: All consumers updated - architecture standards followed, ESLint passes, no deep imports remain

---

## Phase 6: Polish & Validation

**Purpose**: Final cleanup, comprehensive testing, and success criteria verification

### 6.1: Code Quality

- [x] T037 [P] Run prettier auto-fix: `yarn prettier:fix`
- [x] T038 [P] Final type-check: `yarn workspace @safe-global/web type-check` (must pass)
- [x] T039 [P] Final lint check: `yarn workspace @safe-global/web lint` (must pass)

### 6.2: Functional Testing

- [ ] T040 [P] Test on chain with feature ENABLED (Ethereum mainnet):
  - Navigate to dashboard, verify No Fee Campaign banner appears in news carousel if eligible
  - Navigate to transaction page, verify No Fee Campaign transaction card displays if eligible
  - Create a transaction, verify No Fee Campaign execution method option is available if eligible
  - Create a transaction with high gas, verify Gas Too High banner appears and option is disabled
  - Create a transaction when limit reached, verify limit reached state shows
- [ ] T041 [P] Test on chain with feature DISABLED:
  - Navigate to dashboard, verify no No Fee Campaign components render
  - Navigate to transaction page, verify no No Fee Campaign components render
  - Verify no network requests for no-fee-campaign chunks in DevTools
- [ ] T042 [P] Test eligibility states:
  - Test with eligible Safe (has remaining sponsored transactions)
  - Test with ineligible Safe (no limit or limit reached)
  - Test with blocked address (should show BlockedAddress component)
  - Test loading state (should show skeleton)
  - Test error state (should fail gracefully)

### 6.3: Bundle Verification

- [ ] T043 Clean build artifacts: `rm -rf apps/web/.next`
- [ ] T044 Build app: `yarn workspace @safe-global/web build` (must succeed)
- [ ] T045 Verify bundle analysis shows no-fee-campaign in separate chunk
- [ ] T046 Verify main bundle size decreased (no-fee-campaign code removed from main chunk)

### 6.4: Success Criteria Validation

Verify all success criteria from spec.md:

- [ ] T047 ✅ SC-001: All existing No Fee Campaign functionality works identically after migration (verified through manual testing T040-T042)
- [ ] T048 ✅ SC-002: No Fee Campaign code is code-split into separate chunk (verified in T014-T015, T045)
- [ ] T049 ✅ SC-003: ESLint restricted import rules pass with zero warnings (verified in T030-T031)
- [ ] T050 ✅ SC-004: All TypeScript type checks pass with full type inference (verified in T013, T038)
- [ ] T051 ✅ SC-005: Bundle size for main chunk decreases when feature disabled (verified in T046)
- [ ] T052 ✅ SC-006: All existing unit tests and integration tests continue to pass (run: `yarn workspace @safe-global/web test`)
- [ ] T053 ✅ SC-007: Feature can be disabled per chain without loading any feature code (verified in T016-T018, T041)
- [ ] T054 ✅ SC-008: Developers can use feature via `useLoadFeature()` pattern with proper autocomplete (verified through TypeScript inference in T038)

### 6.5: Git & Cleanup

- [ ] T055 Review all changed files in git diff
- [ ] T056 Verify no unintended changes (e.g., formatting changes in unrelated files)
- [ ] T057 Verify all TODOs or FIXME comments are addressed (if any)

**Checkpoint**: All success criteria met - migration complete and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all migration work
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - needs contract.ts and feature.ts
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) - needs public API in place
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3) - needs public API, can run in parallel with Phase 4
- **Polish (Phase 6)**: Depends on all previous phases - final validation

### User Story Dependencies

- **US1 (Functional Parity)**: Must complete before US2 and US3 (needs core architecture files)
- **US2 (Lazy Loading)**: Can run after US1, can run in parallel with US3
- **US3 (Architecture Standards)**: Can run after US1, can run in parallel with US2

### Within Each Phase

- Tasks marked [P] can run in parallel (different files)
- Tasks marked [US#] are sequenced within that user story
- Follow task numbers for optimal ordering

### Parallel Opportunities

Within Phase 1 (Setup):

- T003, T004, T005 can run in parallel (different checks) ✅

Within Phase 3.1 (Update Hook Exports):

- T009, T010, T011 can run in parallel (different files) ✅

Within Phase 5.1-5.5 (Update Consumer Code):

- T022, T023, T024, T025, T026 can run in parallel (different files) ✅

Within Phase 5.6 (Verify No Deep Imports):

- T027, T028, T029 can run in parallel (different searches) ✅

Within Phase 6.1 (Code Quality):

- T037, T038, T039 can run in parallel (different tools) ✅

Within Phase 6.2 (Functional Testing):

- T040, T041, T042 can run in parallel (different test scenarios) ✅

---

## Implementation Strategy

### Recommended Sequence (Single Developer)

1. **Phase 1: Setup** (T001-T005) - 15 minutes
   - Document baseline, verify current state

2. **Phase 2: Foundational** (T006-T008) - 30 minutes
   - Create contract.ts, feature.ts, hooks/index.ts

3. **Phase 3: User Story 1** (T009-T013) - 45 minutes
   - Update hook exports, create public API, verify type-check

4. **Phase 4: User Story 2** (T014-T021) - 1 hour
   - Verify lazy loading, test bundle splitting

5. **Phase 5: User Story 3** (T022-T036) - 2-3 hours
   - Update all consumer code, verify ESLint, verify architecture compliance

6. **Phase 6: Polish** (T037-T057) - 2 hours
   - Final validation, testing, success criteria check

**Total Estimated Time**: 6-8 hours (single developer, sequential)

### Checkpoints for Validation

Stop and validate at these points:

1. ✅ **After Phase 2**: All foundational files exist, structure ready
2. ✅ **After Phase 3**: Core architecture complete, hooks exported, type-check passes
3. ✅ **After Phase 4**: Bundle analysis confirms code splitting works
4. ✅ **After Phase 5**: All consumers updated, ESLint passes, architecture compliant
5. ✅ **After Phase 6**: All success criteria met, ready to commit

---

## Notes

- This is a **pure refactoring task** with zero functional changes
- No new features, components, or logic are being added
- All existing behavior must be preserved exactly
- Focus on structural organization and API boundaries
- Reference implementations: `apps/web/src/features/counterfactual/`, `apps/web/src/features/hypernative/`, `apps/web/src/features/tx-notes/`
- Complete documentation: `apps/web/docs/feature-architecture.md`
- Manual testing checklist: `specs/004-migrate-no-fee-campaign/quickstart.md`

---

## Commit Strategy

Suggested commit points:

1. After Phase 2 (Foundational): `refactor(no-fee-campaign): create feature architecture files (contract, feature, index)`
2. After Phase 3 (US1): `refactor(no-fee-campaign): update hooks to named exports and create public API`
3. After Phase 4 (US2): `refactor(no-fee-campaign): verify lazy loading and code splitting`
4. After Phase 5 (US3): `refactor(no-fee-campaign): update all consumers to use useLoadFeature pattern`
5. After Phase 6 (Polish): `refactor(no-fee-campaign): final validation and cleanup`

Or single commit after all phases complete:

- `refactor(no-fee-campaign): migrate to feature architecture pattern`

Follow semantic commit conventions per `CONTRIBUTING.md`.
