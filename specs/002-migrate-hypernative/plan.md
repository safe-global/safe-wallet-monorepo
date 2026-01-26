# Implementation Plan: Migrate Hypernative Feature to Architecture v2

**Branch**: `002-migrate-hypernative` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-migrate-hypernative/spec.md`

## Summary

Migrate the existing hypernative feature to the feature-architecture-v2 pattern, enabling lazy loading via feature handles. The migration will create a typed contract (`HypernativeContract`), a feature handle using `createFeatureHandle()`, and update all external consumers (~15 files) to use `useLoadFeature(HypernativeFeature)` instead of direct imports.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14.x
**Primary Dependencies**: React 18, Redux Toolkit, `@/features/__core__` (useLoadFeature, createFeatureHandle, withSuspense)
**Storage**: Redux store (hnStateSlice for banner dismissals, form completion)
**Testing**: Jest with React Testing Library, MSW for network mocking
**Target Platform**: Web (Next.js app)
**Project Type**: Web monorepo (`apps/web`)
**Performance Goals**: Feature code excluded from main bundle when flag disabled (lazy loading)
**Constraints**: Must maintain backward compatibility with existing Redux store integration
**Scale/Scope**: ~20 components, ~15 hooks, 2 services, 1 Redux slice, ~15 external consumers

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle               | Status | Notes                                                                     |
| ----------------------- | ------ | ------------------------------------------------------------------------- |
| I. Type Safety          | PASS   | Contract uses `typeof` pattern for IDE navigation; no `any` types         |
| II. Branch Protection   | PASS   | Working on feature branch `002-migrate-hypernative`                       |
| III. Cross-Platform     | PASS   | Web-only feature, no shared package changes                               |
| IV. Testing Discipline  | PASS   | Existing tests will be maintained; consumer mocks may need updates        |
| V. Feature Organization | PASS   | Feature already in `src/features/hypernative/`; adding architecture files |
| VI. Theme System        | N/A    | No theme changes                                                          |

**Gate Result**: PASS - No violations, proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-migrate-hypernative/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/src/features/hypernative/
├── index.ts             # NEW: Feature handle export (HypernativeFeature)
├── contract.ts          # NEW: HypernativeImplementation & HypernativeContract types
├── feature.ts           # NEW: Lazy-loaded implementation
├── types.ts             # NEW/MODIFY: Public types export
├── constants.ts         # EXISTING: Constants
├── components/          # EXISTING: ~20 components (internal)
├── hooks/               # EXISTING: ~15 hooks (internal, barrel export remains for store)
│   └── index.ts         # MODIFY: Export only types needed externally
├── services/            # EXISTING: Guard check, tx hash calculation
├── store/               # EXISTING: hnStateSlice (remains directly importable)
│   └── index.ts         # EXISTING: Redux slice exports
└── config/              # EXISTING: OAuth config
```

**Structure Decision**: Preserves existing internal folder structure. Adds three new architecture files (index.ts, contract.ts, feature.ts) at the feature root. Store remains directly importable per FR-006.

## Complexity Tracking

> No constitution violations to justify.

| Aspect             | Complexity            | Justification                                                  |
| ------------------ | --------------------- | -------------------------------------------------------------- |
| Components exposed | ~14 (externally used) | Only expose components actually imported by external consumers |
| Hooks exposed      | ~14                   | All hooks currently used externally via barrel export          |
| Services exposed   | 1                     | isHypernativeGuard                                             |
| Consumer updates   | ~15 files             | Pages, dashboard, settings, safe-shield, transactions          |

## Constitution Re-Check (Post-Phase 1)

_GATE: Re-evaluate after design phase._

| Principle               | Status | Notes                                                                        |
| ----------------------- | ------ | ---------------------------------------------------------------------------- |
| I. Type Safety          | PASS   | Contract uses `typeof` pattern; HypernativeContract interface properly typed |
| II. Branch Protection   | PASS   | Design artifacts committed to feature branch                                 |
| III. Cross-Platform     | PASS   | Web-only feature; no shared package impacts                                  |
| IV. Testing Discipline  | PASS   | Mock patterns documented in quickstart.md                                    |
| V. Feature Organization | PASS   | Contract defines clear public API; internals remain encapsulated             |
| VI. Theme System        | N/A    | No theme changes                                                             |

**Gate Result**: PASS - Design phase complete. Ready for `/speckit.tasks`.
