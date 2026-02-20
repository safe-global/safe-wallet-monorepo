# Implementation Plan: Counterfactual Feature Refactor

**Branch**: `002-counterfactual-refactor` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-counterfactual-refactor/spec.md`

## Summary

Refactor the counterfactual feature to comply with the standard feature architecture pattern established in 001-feature-architecture. This is a structural-only refactoring with zero behavioral changes - all existing functionality must work identically after refactoring. The work involves reorganizing 20 files from a flat structure into standard subdirectories (`components/`, `hooks/`, `services/`, `store/`), establishing a public API boundary, implementing feature flag checks, enabling lazy loading, and updating 49+ external import sites across the codebase.

**Primary Requirement**: Migrate counterfactual feature from current flat structure to standard architecture pattern (directories, barrel files, public API, feature flag, lazy loading) while preserving 100% of existing functionality.

**Technical Approach**: Systematic file reorganization following established walletconnect reference implementation, then update all external imports to use public API, verify with ESLint and tests, validate bundle code splitting.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14.x)  
**Primary Dependencies**: Next.js (dynamic imports), React, Redux Toolkit, ethers.js, Safe SDK, ESLint (import restrictions)  
**Storage**: Redux store (`undeployedSafesSlice` already correctly structured in `store/`)  
**Testing**: Jest/Vitest with React Testing Library, MSW for network mocking, faker for test data  
**Target Platform**: Web application (Next.js) running in browser  
**Project Type**: Web monorepo workspace (`apps/web/` within Yarn 4 monorepo)  
**Performance Goals**: Zero bytes of counterfactual code loaded when feature flag disabled; code-split into separate chunks  
**Constraints**: Zero behavioral changes (100% test pass rate required); backward compatibility mandatory (no breaking changes to public APIs)  
**Scale/Scope**: 20 TypeScript files to reorganize, 49+ external import sites to update, ~21 components/hooks/services total

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Core Principles Compliance

| Principle                        | Status  | Notes                                                                                  |
| -------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| **I. Monorepo Unity**            | ✅ PASS | Counterfactual is web-only feature; no shared package modifications needed             |
| **II. Type Safety**              | ✅ PASS | All existing code is properly typed; refactoring preserves types; no `any` usage       |
| **III. Test-First Development**  | ✅ PASS | Existing tests preserved; test pass rate is success criterion (SC-003)                 |
| **IV. Design System Compliance** | ✅ PASS | No UI changes; existing MUI usage preserved; no theme modifications                    |
| **V. Safe-Specific Security**    | ✅ PASS | No transaction logic changes; Safe SDK patterns preserved; chain-specific logic intact |

### Architecture Constraints Compliance

| Constraint                | Status  | Notes                                                                                       |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| **Code Organization**     | ✅ PASS | Feature already in `src/features/counterfactual/`; refactoring aligns with standard pattern |
| **Feature Flag**          | ✅ PASS | `FEATURES.COUNTERFACTUAL` already exists; implementing `useIsCounterfactualEnabled` hook    |
| **Dependency Management** | ✅ PASS | No new dependencies; using existing infrastructure (Next.js dynamic, Redux, ESLint)         |
| **Workflow Enforcement**  | ✅ PASS | Pre-commit hooks will verify type-check, lint, prettier; all must pass before commit        |

### Quality Standards Compliance

| Standard           | Status  | Notes                                                                                 |
| ------------------ | ------- | ------------------------------------------------------------------------------------- |
| **Code Quality**   | ✅ PASS | Refactoring follows DRY, functional patterns; no new abstractions introduced          |
| **Error Handling** | ✅ PASS | Existing error handling preserved; feature flag adds undefined/loading state handling |
| **Performance**    | ✅ PASS | Code splitting improves performance (lazy loading); bundle analysis validates         |
| **Documentation**  | ✅ PASS | Following documented pattern from `feature-architecture.md`; walletconnect reference  |

**GATE RESULT: ✅ ALL CHECKS PASS** - Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/002-counterfactual-refactor/
├── spec.md                 # Feature specification (completed)
├── checklists/
│   └── requirements.md     # Spec quality checklist (completed)
├── plan.md                 # This file (Phase 2 planning output)
├── research.md             # Phase 0 output (architecture patterns research)
├── data-model.md           # Phase 1 output (Redux state structure documentation)
├── quickstart.md           # Phase 1 output (developer guide for refactoring)
└── contracts/              # Phase 1 output (public API contract definitions)
    └── public-api.ts       # TypeScript interface contracts for exports
```

### Source Code (repository root)

This is a refactoring within existing `apps/web/` structure:

```text
apps/web/src/features/counterfactual/
# BEFORE (current flat structure):
├── ActivateAccountButton.tsx
├── ActivateAccountFlow.tsx
├── CheckBalance.tsx
├── CounterfactualForm.tsx
├── CounterfactualHooks.tsx
├── CounterfactualStatusButton.tsx
├── CounterfactualSuccessScreen.tsx
├── FirstTxFlow.tsx
├── LazyCounterfactual.tsx
├── PayNowPayLater.tsx
├── useCounterfactualBalances.ts
├── utils.ts
├── styles.module.css
├── hooks/
│   ├── useDeployGasLimit.ts
│   ├── useIsCounterfactualSafe.ts
│   ├── usePendingSafeNotifications.ts
│   └── usePendingSafeStatuses.ts
├── services/
│   └── safeCreationEvents.ts
├── store/
│   └── undeployedSafesSlice.ts
└── __tests__/
    ├── useDeployGasLimit.test.ts
    └── utils.test.ts

# AFTER (standard architecture):
├── index.ts                    # NEW: Public API barrel (lazy-loaded exports)
├── types.ts                    # NEW: All TypeScript interfaces centralized
├── constants.ts                # NEW: Feature constants (CF_TX_GROUP_KEY, etc.)
├── components/
│   ├── index.ts                # NEW: Component barrel file
│   ├── ActivateAccountButton/
│   │   └── index.tsx           # MOVED from root
│   ├── ActivateAccountFlow/
│   │   └── index.tsx           # MOVED from root
│   ├── CheckBalance/
│   │   └── index.tsx           # MOVED from root
│   ├── CounterfactualForm/
│   │   └── index.tsx           # MOVED from root
│   ├── CounterfactualHooks/
│   │   └── index.tsx           # MOVED from root
│   ├── CounterfactualStatusButton/
│   │   └── index.tsx           # MOVED from root
│   ├── CounterfactualSuccessScreen/
│   │   └── index.tsx           # MOVED from root
│   ├── FirstTxFlow/
│   │   └── index.tsx           # MOVED from root
│   ├── LazyCounterfactual/
│   │   └── index.tsx           # MOVED from root
│   └── PayNowPayLater/
│       └── index.tsx           # MOVED from root
├── hooks/
│   ├── index.ts                # NEW: Hook barrel file
│   ├── useIsCounterfactualEnabled.ts  # NEW: Feature flag hook (REQUIRED)
│   ├── useCounterfactualBalances.ts   # MOVED from root
│   ├── useDeployGasLimit.ts    # EXISTS (keep location)
│   ├── useIsCounterfactualSafe.ts     # EXISTS (keep location)
│   ├── usePendingSafeNotifications.ts # EXISTS (keep location)
│   ├── usePendingSafeStatuses.ts      # EXISTS (keep location)
│   └── __tests__/
│       └── useDeployGasLimit.test.ts  # MOVED into hooks/__tests__/
├── services/
│   ├── index.ts                # NEW: Service barrel file
│   ├── counterfactualUtils.ts  # RENAMED from utils.ts for clarity
│   ├── safeCreationEvents.ts   # EXISTS (keep location)
│   └── __tests__/
│       └── counterfactualUtils.test.ts  # MOVED from root __tests__/
└── store/
    ├── index.ts                # NEW: Store barrel file
    └── undeployedSafesSlice.ts # EXISTS (keep location)
```

**Structure Decision**: Using existing web application structure within monorepo. Counterfactual feature already resides in `apps/web/src/features/counterfactual/`. Refactoring reorganizes flat file structure into standard subdirectories with barrel files while preserving all functionality. The `store/` subdirectory already exists and is correctly structured; other subdirectories (`components/`, `hooks/`, `services/`) need files reorganized within them. New barrel files (`index.ts`) establish public API boundaries.

**External Dependencies**: 49+ files across the codebase import from counterfactual:

- Core locations: `components/tx-flow/`, `components/new-safe/create/`, `hooks/loadables/`, `store/slices.ts`
- Feature integrations: `features/myAccounts/`, `features/multichain/`
- All external imports must be updated to use public API (`@/features/counterfactual`) after refactoring

## Complexity Tracking

_No constitutional violations. This section intentionally left blank._

The refactoring follows established patterns from 001-feature-architecture (walletconnect reference implementation) and complies with all constitutional principles. No complexity justifications needed.

## Phase 0: Research & Architecture Patterns

**Objective**: Document refactoring patterns, identify all files to move, map external dependencies, establish verification strategy.

**Research Tasks**:

1. **Pattern Analysis**: Review walletconnect reference implementation to extract reusable patterns
2. **File Inventory**: Create complete manifest of counterfactual files and their target locations
3. **Dependency Mapping**: Identify all 49+ external import sites and categorize by update complexity
4. **Public API Design**: Determine which components/hooks/services must be exported vs internal-only
5. **Test Strategy**: Define verification approach for zero behavioral changes guarantee

**Output**: `research.md` covering:

- Walletconnect refactoring patterns (what worked, lessons learned)
- Complete file movement manifest with source → destination mapping
- External import dependency matrix (file, import statement, update required)
- Public API surface area (what to export from `index.ts`)
- Verification checklist (type-check, lint, tests, bundle analysis, manual QA)

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete

**Design Artifacts**:

1. **Data Model**: Document Redux state structure (`undeployedSafesSlice`) to verify no changes
2. **Public API Contract**: Define TypeScript interface for feature's public exports
3. **Migration Guide**: Step-by-step instructions for executing the refactoring
4. **Rollback Plan**: Strategy for reverting if issues discovered post-refactor

**Outputs**:

### `data-model.md`

Document existing Redux store structure to ensure refactoring doesn't modify it:

```typescript
// Redux state shape (DO NOT MODIFY)
interface UndeployedSafesState {
  [chainId: string]: {
    [address: string]: UndeployedSafe
  }
}

interface UndeployedSafe {
  props: PredictedSafeProps | ReplayedSafeProps
  status: UndeployedSafeStatus
}

interface UndeployedSafeStatus {
  status: PendingSafeStatus
  type: PayMethod
  txHash?: string
  submittedAt?: number
  startBlock?: number
  taskId?: string
}
```

Verify selectors remain unchanged: `selectUndeployedSafes`, `selectUndeployedSafe`, `selectUndeployedSafesByAddress`, `selectIsUndeployedSafe`

### `contracts/public-api.ts`

Define the public API contract (TypeScript interface):

```typescript
// Public API contract for @/features/counterfactual
// External code MUST import from this public API only

// Types (tree-shakeable - always safe to export)
export type {
  UndeployedSafe,
  UndeployedSafesState,
  UndeployedSafeStatus,
  UndeployedSafeProps,
  ReplayedSafeProps,
  PredictedSafeProps,
} from './types'

// Feature flag hook (REQUIRED)
export { useIsCounterfactualEnabled } from './hooks'

// Store exports (Redux slice + selectors)
export {
  undeployedSafesSlice,
  addUndeployedSafe,
  updateUndeployedSafeStatus,
  removeUndeployedSafe,
  selectUndeployedSafes,
  selectUndeployedSafe,
  selectUndeployedSafesByAddress,
  selectIsUndeployedSafe,
} from './store'

// Service functions (used externally)
export {
  getUndeployedSafeInfo,
  deploySafeAndExecuteTx,
  getCounterfactualBalance,
  replayCounterfactualSafeDeployment,
  checkSafeActivation,
  checkSafeActionViaRelay,
  extractCounterfactualSafeSetup,
  activateReplayedSafe,
  isReplayedSafeProps,
  isPredictedSafeProps,
} from './services'

// Constants (used externally)
export { CF_TX_GROUP_KEY } from './constants'

// Lazy-loaded components (which ones need external access?)
// NOTE: Most counterfactual components are internal to the feature
// Determine during research which components are used externally
```

### `quickstart.md`

Developer guide for executing the refactoring:

**Prerequisites**:

- Clean working directory (commit or stash changes)
- All tests passing on `dev` branch before starting
- Familiarize with walletconnect structure as reference

**Execution Steps**:

1. **Phase 1: Create Structure** (non-breaking)
   - Create barrel files: `index.ts`, `types.ts`, `constants.ts`
   - Create barrel files in subdirectories: `components/index.ts`, `hooks/index.ts`, `services/index.ts`, `store/index.ts`
   - Run type-check: should still pass (new empty files don't break)

2. **Phase 2: Move Files** (breaking - do in single commit)
   - Move component files into `components/{ComponentName}/index.tsx`
   - Move hook files (already mostly in place, add `useIsCounterfactualEnabled`)
   - Move `utils.ts` → `services/counterfactualUtils.ts`
   - Move test files into `__tests__/` within appropriate subdirectories
   - Update all internal imports within the feature

3. **Phase 3: Establish Public API** (non-breaking within feature)
   - Populate `types.ts` with all interfaces extracted from components/services
   - Populate `constants.ts` with constants like `CF_TX_GROUP_KEY`
   - Populate barrel `index.ts` files in each subdirectory
   - Populate root `index.ts` with public API exports

4. **Phase 4: Update External Imports** (breaking - critical path)
   - Update all 49+ external import sites to use `@/features/counterfactual`
   - Test incrementally: type-check after each batch of import updates
   - Priority order: `store/slices.ts` first (most critical), then features, then components

5. **Phase 5: Verification** (gate before commit)
   - `yarn workspace @safe-global/web type-check` → MUST pass
   - `yarn workspace @safe-global/web lint` → zero no-restricted-imports warnings
   - `yarn workspace @safe-global/web test` → 100% pass rate
   - `yarn workspace @safe-global/web build` → succeeds, check bundle analysis
   - Manual QA: Test Safe activation flows (pay now, pay later, pending notifications)

6. **Phase 6: Commit & Verify**
   - Single atomic commit with all changes (follows semantic commit convention)
   - Push to branch, create PR
   - CI must pass (all checks green)

**Rollback Strategy**:

- If issues discovered: `git revert <commit-sha>` immediately
- All changes in single commit enable clean rollback
- Re-run tests to verify rollback successful

## Phase 2: Task Breakdown

**Note**: Task breakdown is created by `/speckit.tasks` command, NOT by `/speckit.plan`. This section documents the high-level task categories that will be broken down:

### Task Categories

1. **Structural Setup** (~5 tasks)
   - Create barrel files (`index.ts`, `types.ts`, `constants.ts`)
   - Create subdirectory barrel files
   - Validate structure against standard pattern

2. **File Reorganization** (~15 tasks)
   - Move each component file (10 components)
   - Move hook files (2 moves: main hooks already placed)
   - Move service files (1 move: `utils.ts` → `counterfactualUtils.ts`)
   - Move test files (2 moves)
   - Update internal imports within feature

3. **Public API Definition** (~8 tasks)
   - Extract types to `types.ts`
   - Extract constants to `constants.ts`
   - Create `useIsCounterfactualEnabled` hook
   - Populate barrel files in subdirectories
   - Populate root `index.ts` with public API
   - Add lazy loading with dynamic imports

4. **External Import Updates** (~49 tasks - one per file)
   - Update `store/slices.ts` import
   - Update imports in `components/tx-flow/` (9 files)
   - Update imports in `components/new-safe/create/` (5 files)
   - Update imports in `hooks/loadables/` (3 files)
   - Update imports in `features/myAccounts/` (3 files)
   - Update imports in `features/multichain/` (3 files)
   - Update remaining imports (26 files)

5. **Verification** (~7 tasks)
   - Run type-check
   - Run lint and fix no-restricted-imports warnings
   - Run all tests (verify 100% pass)
   - Build and analyze bundle (verify code splitting)
   - Manual QA: activate account flow
   - Manual QA: pay now/pay later flows
   - Manual QA: pending notifications

**Estimated Total Tasks**: ~84 tasks

## Agent Context Update

After Phase 1 design completion, update agent context:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This will update `CLAUDE.md` with new technologies used in this plan (none new - all existing infrastructure).

## Next Steps

1. **Complete this plan**: Review and approve plan structure
2. **Execute Phase 0**: Generate `research.md` with detailed patterns and file manifest
3. **Execute Phase 1**: Generate `data-model.md`, `contracts/public-api.ts`, `quickstart.md`
4. **Run agent context update**: Update `CLAUDE.md` with plan context
5. **Ready for tasks**: Run `/speckit.tasks` to break down into actionable tasks

---

**Plan Status**: ✅ Complete - Ready for Phase 0 research execution
