# Implementation Plan: Migrate No Fee Campaign to Feature Architecture

**Branch**: `004-migrate-no-fee-campaign` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-migrate-no-fee-campaign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the No Fee Campaign feature from direct imports to the new Feature Architecture pattern. This is a pure refactoring task that maintains 100% functional parity while improving code organization, enabling lazy loading, and ensuring proper code-splitting. The migration follows established patterns from other migrated features (counterfactual, hypernative, tx-notes) and uses the `createFeatureHandle` helper with existing semantic mapping.

**Technical Approach**:

- Create feature contract (`contract.ts`) with flat structure for 3 components
- Create feature implementation (`feature.ts`) with direct imports (no nested lazy loading)
- Create public API (`index.ts`) exporting feature handle and hooks directly
- Update all consumer code to use `useLoadFeature()` pattern
- Maintain all existing hooks, components, and business logic unchanged

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js project)  
**Primary Dependencies**: React, Next.js, MUI, Redux RTK Query, @safe-global/protocol-kit  
**Storage**: N/A (feature uses existing backend APIs via RTK Query)  
**Testing**: Jest, React Testing Library, MSW  
**Target Platform**: Web (Next.js) - web-only migration  
**Project Type**: Web application (monorepo structure)  
**Performance Goals**:

- Feature code should be code-split into separate chunk
- No impact on initial bundle size when feature is disabled
- Lazy loading should occur only when feature flag is enabled
  **Constraints**:
- Must maintain 100% functional parity
- Must pass ESLint restricted import rules
- Must maintain type safety with full TypeScript inference
- No breaking changes to external APIs
  **Scale/Scope**:
- 3 components (NoFeeCampaignBanner, NoFeeCampaignTransactionCard, GasTooHighBanner)
- 3 hooks (useIsNoFeeCampaignEnabled, useNoFeeCampaignEligibility, useGasTooHigh)
- 1 constant (MAX_GAS_LIMIT_NO_FEE_CAMPAIGN)
- ~8 consumer locations to update

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Type Safety (NON-NEGOTIABLE)

✅ **PASS** - Migration maintains full type safety:

- Feature contract uses `typeof` pattern for IDE navigation
- All TypeScript interfaces properly defined
- No `any` types introduced
- Type inference works for `useLoadFeature()` usage

### II. Branch Protection & Quality Gates

✅ **PASS** - Standard workflow applies:

- Feature branch created: `004-migrate-no-fee-campaign`
- Must pass: type-check, lint, prettier, test before commit
- Semantic commit messages required

### III. Cross-Platform Consistency

✅ **PASS** - Web-only migration:

- No shared package changes
- Mobile app unaffected
- No cross-platform concerns

### IV. Testing Discipline

✅ **PASS** - Testing requirements:

- Existing tests must continue to pass (100% test pass rate per SC-006)
- Use MSW for network mocking (already in use via RTK Query)
- Verify state changes, not implementation details
- Tests colocated with source files

### V. Feature Organization

✅ **PASS** - Follows feature architecture:

- Feature in `src/features/no-fee-campaign/`
- Feature flag already exists: `FEATURES.NO_FEE_NOVEMBER`
- Storybook stories may need updates for component exports
- Loading/error states already handled in components

### VI. Theme System Integrity

✅ **PASS** - No theme changes:

- No hardcoded colors/spacing
- Uses existing MUI theme
- No theme system modifications

**Gate Status**: ✅ **ALL GATES PASS** - No violations detected. Migration is a pure refactoring task that follows established patterns.

## Project Structure

### Documentation (this feature)

```text
specs/004-migrate-no-fee-campaign/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/web/src/features/no-fee-campaign/
├── index.ts                    # Public API: feature handle + hook exports
├── contract.ts                 # Feature contract (flat structure, components only)
├── feature.ts                  # Feature implementation (direct imports, lazy-loaded)
├── constants.ts                # MAX_GAS_LIMIT_NO_FEE_CAMPAIGN (unchanged)
├── components/
│   ├── NoFeeCampaignBanner/
│   │   ├── index.tsx
│   │   └── styles.module.css
│   ├── NoFeeCampaignTransactionCard/
│   │   ├── index.tsx
│   │   └── styles.module.css
│   └── GasTooHighBanner/
│       ├── index.tsx
│       └── styles.module.css
└── hooks/
    ├── index.ts
    ├── useIsNoFeeCampaignEnabled.ts
    ├── useNoFeeCampaignEligibility.ts
    └── useGasTooHigh.ts

# Consumer locations to update:
apps/web/src/components/dashboard/index.tsx
apps/web/src/components/tx-flow/actions/Execute/ExecuteForm.tsx
apps/web/src/components/tx/ExecutionMethodSelector/index.tsx
apps/web/src/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer.tsx
apps/web/src/pages/balances/index.tsx
```

**Structure Decision**: Standard feature architecture pattern with:

- `index.ts` for public API (handle + hooks)
- `contract.ts` for TypeScript contract definition
- `feature.ts` for lazy-loaded implementation
- Components and hooks in subdirectories
- Constants file remains at root level

## Complexity Tracking

> **No violations detected - all gates pass**
