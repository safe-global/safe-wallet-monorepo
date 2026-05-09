# Implementation Plan: Ledger Feature Architecture Refactor

**Branch**: `002-ledger-refactor` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-ledger-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the ledger feature to conform to the established feature architecture pattern. The current implementation has 3 files in a flat structure (index.ts, store.ts, LedgerHashComparison.tsx). This refactoring will reorganize it into the standard pattern with dedicated folders for components, hooks, store, types, and constants; implement lazy loading for code splitting; and ensure all external imports use the public API rather than internal files.

**Key Goals:**

- Restructure from flat 3-file layout to standard feature pattern (components/, hooks/, store/, types.ts, constants.ts)
- Implement lazy loading with Next.js dynamic imports for code splitting
- Update external imports (ledger-module.ts, TxFlow.tsx) to use public API
- Maintain 100% backward compatibility with existing functionality
- Use walletconnect feature as reference implementation

## Technical Context

**Language/Version**: TypeScript 5.x (as per monorepo)  
**Primary Dependencies**:

- Next.js 14+ (dynamic imports for lazy loading)
- React 18+ (component structure)
- @safe-global/utils (ExternalStore pattern for state management)
- Material-UI v5 (Dialog, Button, Typography components)
- ethers.js v6 (hash display via HexEncodedData)

**Storage**: ExternalStore (client-side state management for dialog visibility)  
**Testing**: Jest + React Testing Library (existing test framework)  
**Target Platform**: Next.js web application (apps/web/)  
**Project Type**: Monorepo web application (apps/web/src/features/ledger/)

**Performance Goals**:

- Lazy loading chunk should be <50KB gzipped
- Dialog render time <100ms after show function call
- No impact on initial bundle size (code must be split)

**Constraints**:

- MUST maintain backward compatibility (no functionality changes)
- MUST preserve ExternalStore pattern (no Redux migration)
- MUST keep existing dynamic import in ledger-module.ts service
- Feature is always enabled (NOT behind a feature flag)

**Scale/Scope**:

- 3 existing files → ~8-10 files after refactoring
- 2 external consumers (ledger-module.ts, TxFlow.tsx)
- Zero breaking changes required

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Core Principles Assessment

**I. Monorepo Unity** ✅ PASS

- This is web-only refactoring (no shared packages affected)
- No impact on mobile or shared code
- No environment variables or theme changes needed

**II. Type Safety** ✅ PASS

- No `any` types present in current code
- Refactoring will maintain strict typing
- New types.ts file will explicitly define all interfaces
- All exports will be properly typed

**III. Test-First Development** ⚠️ REQUIRES ATTENTION

- Current ledger feature has NO existing unit tests
- **Plan:** Add tests for state management (showLedgerHashComparison, hideLedgerHashComparison) and component behavior
- Tests must verify dialog appears/disappears based on state
- Use MSW if any network calls are added (none currently exist)

**IV. Design System Compliance** ✅ PASS

- Already uses MUI components (Dialog, Button, Typography, Paper)
- No hard-coded styles (uses sx prop and theme)
- No Storybook story currently exists
- **Plan:** Add LedgerHashComparison.stories.tsx for visual documentation

**V. Safe-Specific Security** ✅ PASS

- Dialog displays transaction hash for verification (security-enhancing feature)
- No private keys or sensitive data handling
- Works with existing Ledger hardware wallet integration
- No changes to signature validation or transaction building

### Architecture Constraints

**Code Organization** ✅ PASS

- Feature already in `src/features/ledger/` ✓
- Will follow standard feature folder structure ✓
- NOT behind feature flag (always enabled - this is correct for core hardware wallet support) ✓

**Dependency Management** ✅ PASS

- No new dependencies required
- All current dependencies are appropriate
- Yarn 4 workspace structure unchanged

**Workflow Enforcement** ✅ PASS

- Pre-commit hooks will validate types and formatting
- ESLint will enforce no-restricted-imports for internal file access
- Standard semantic commits will be used

### Quality Standards

**Code Quality** ✅ PASS

- Refactoring follows DRY (extracting types, using barrel files)
- Functional patterns maintained (ExternalStore, React hooks)
- No over-engineering (keeping existing patterns)

**Error Handling** ✅ PASS

- Dialog handles undefined state (no hash) gracefully
- Component renders null when no hash present
- Cleanup functions called in error handlers

**Performance** ✅ PASS

- Lazy loading will reduce initial bundle
- Build scoped to web workspace
- No impact on build performance

**Documentation** ⚠️ REQUIRES ATTENTION

- No existing Storybook story
- **Plan:** Create LedgerHashComparison.stories.tsx showing dialog states

### Gate Summary

| Principle                | Status       | Action Required                                   |
| ------------------------ | ------------ | ------------------------------------------------- |
| Monorepo Unity           | ✅ Pass      | None                                              |
| Type Safety              | ✅ Pass      | None                                              |
| Test-First Development   | ⚠️ Attention | Add unit tests for component and state management |
| Design System Compliance | ⚠️ Attention | Add Storybook story                               |
| Safe-Specific Security   | ✅ Pass      | None                                              |
| Code Organization        | ✅ Pass      | None                                              |
| Dependency Management    | ✅ Pass      | None                                              |
| Workflow Enforcement     | ✅ Pass      | None                                              |

**Overall Gate Status: ✅ PASS WITH FOLLOW-UPS**

- Refactoring can proceed
- Unit tests must be added during implementation
- Storybook story should be added for documentation

## Project Structure

### Documentation (this feature)

```text
specs/002-ledger-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── ledger-public-api.ts  # TypeScript interface definitions
├── checklists/
│   └── requirements.md  # Already created
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code Structure

**Current Structure (3 files):**

```text
apps/web/src/features/ledger/
├── index.ts                      # Basic exports
├── store.ts                      # ExternalStore instance + functions
└── LedgerHashComparison.tsx      # Dialog component
```

**Target Structure (standard feature pattern):**

```text
apps/web/src/features/ledger/
├── index.ts                      # Public API barrel file (lazy loading)
├── types.ts                      # All TypeScript interfaces
├── constants.ts                  # Feature constants (if any needed)
├── components/
│   ├── index.ts                  # Component exports barrel
│   └── LedgerHashComparison/
│       ├── index.tsx             # Dialog component (moved from root)
│       ├── index.test.tsx        # Component unit tests (NEW)
│       └── LedgerHashComparison.stories.tsx  # Storybook story (NEW)
├── hooks/
│   └── index.ts                  # Hook exports barrel (may be empty initially)
└── store/
    ├── index.ts                  # Store exports barrel
    └── ledgerHashStore.ts        # ExternalStore instance (moved from root store.ts)
```

**External Consumers (to be updated):**

```text
apps/web/src/
├── services/onboard/ledger-module.ts
│   # Currently: import { showLedgerHashComparison, hideLedgerHashComparison } from '@/features/ledger/store'
│   # Target:    import { showLedgerHashComparison, hideLedgerHashComparison } from '@/features/ledger'
│
└── components/tx-flow/TxFlow.tsx
    # Currently: import LedgerHashComparison from '@/features/ledger'
    # Target:    import LedgerHashComparison from '@/features/ledger' (already correct)
```

**Structure Decision**: Single web application structure. The ledger feature is web-only and resides in `apps/web/src/features/`. This follows the established monorepo pattern where features are organized within their respective application directories. The refactoring maintains this structure while improving internal organization.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_No constitutional violations present. All complexity is justified by existing patterns._

| Assessment          | Status                                                        |
| ------------------- | ------------------------------------------------------------- |
| Type safety         | ✅ No `any` types                                             |
| Test coverage       | ⚠️ Tests to be added during implementation                    |
| Import restrictions | ✅ Will be enforced by ESLint                                 |
| Feature flag        | N/A - Feature always enabled (correct for core functionality) |
| Design system       | ✅ Uses MUI components with theme                             |

---

## Post-Design Constitution Re-Check

_Conducted after Phase 1 (data-model.md, contracts/, quickstart.md complete)_

### Updated Assessment

**III. Test-First Development** ✅ RESOLVED

- Test specifications created in quickstart.md
- Store tests defined (4 test cases)
- Component tests defined (4 test cases)
- Test implementation included in Phase 5 of quickstart
- Constitution requirement will be met during implementation

**IV. Design System Compliance** ✅ RESOLVED

- Storybook story specification created in quickstart.md
- Three story variants defined (Default, ShortHash, Hidden)
- Story implementation included in Phase 6 of quickstart
- Constitution requirement will be met during implementation

### Final Gate Status: ✅ ALL CLEAR

All constitutional principles satisfied. Implementation can proceed with confidence.

| Principle                | Initial Status | Post-Design Status | Notes                                     |
| ------------------------ | -------------- | ------------------ | ----------------------------------------- |
| Monorepo Unity           | ✅ Pass        | ✅ Pass            | No shared packages affected               |
| Type Safety              | ✅ Pass        | ✅ Pass            | All types defined in contracts/           |
| Test-First Development   | ⚠️ Attention   | ✅ Resolved        | Tests specified, ready for implementation |
| Design System Compliance | ⚠️ Attention   | ✅ Resolved        | Story specified, ready for implementation |
| Safe-Specific Security   | ✅ Pass        | ✅ Pass            | No security concerns                      |

---

## Phase 0-1 Artifacts Complete

✅ **Phase 0: Research** - Complete

- `research.md` created with 6 research tasks
- All technical decisions documented
- No unresolved questions

✅ **Phase 1: Design & Contracts** - Complete

- `data-model.md` created with state management, entities, data flow
- `contracts/ledger-public-api.ts` created with TypeScript interfaces
- `quickstart.md` created with implementation guide
- Agent context updated (CLAUDE.md)

✅ **Ready for Phase 2** - Tasks breakdown via `/speckit.tasks`
