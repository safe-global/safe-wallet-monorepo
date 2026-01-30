# Implementation Plan: Hypernative v3 Architecture Migration

**Branch**: `001-migrate-hypernative-v3` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-migrate-hypernative-v3/spec.md`

## Summary

Migrate the Hypernative feature to the v3 feature architecture to enable lazy loading, proper encapsulation, and bundle optimization. The migration involves creating infrastructure files (`contract.ts`, `feature.ts`, updated `index.ts`), updating the FEATURE_FLAG_MAPPING, and migrating ~25 external consumer files to use the `useLoadFeature` pattern for components while preserving direct hook exports.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14.x)  
**Primary Dependencies**: React, Redux Toolkit, Next.js dynamic imports, ESLint (import restrictions)  
**Storage**: N/A (architecture pattern, no new data storage)  
**Testing**: Jest + React Testing Library + MSW  
**Target Platform**: Web (Next.js SSR/CSR)
**Project Type**: web (monorepo workspace: `apps/web`)  
**Performance Goals**: Feature lazy-loads in <200ms, main bundle reduced by >100KB  
**Constraints**: Zero breaking changes for safe-shield integration, backward-compatible hook exports  
**Scale/Scope**: ~45 files total (3 new infrastructure files, ~25 consumer migrations, ~17 test updates)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status  | Notes                                                                       |
| ------------------------------- | ------- | --------------------------------------------------------------------------- |
| I. Type Safety                  | ✅ PASS | Using TypeScript interfaces, `typeof` pattern for contracts, no `any` types |
| II. Branch Protection           | ✅ PASS | Feature branch created, will run quality gates before commit                |
| III. Cross-Platform Consistency | ✅ PASS | Web-only feature, no shared package changes                                 |
| IV. Testing Discipline          | ✅ PASS | Will use MSW for network mocks, update Jest mocks for feature module        |
| V. Feature Organization         | ✅ PASS | Following `src/features/` pattern, behind existing feature flags            |
| VI. Theme System Integrity      | ✅ PASS | No theme changes, UI components unchanged                                   |

**All gates pass. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/001-migrate-hypernative-v3/
├── plan.md              # This file
├── research.md          # Phase 0 output - architecture decisions
├── data-model.md        # Phase 1 output - public API contract definition
├── quickstart.md        # Phase 1 output - migration steps
├── contracts/           # Phase 1 output - TypeScript interfaces
│   └── hypernative-contract.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/web/src/features/hypernative/
├── index.ts              # PUBLIC API (updated - adds feature handle, direct hook exports)
├── contract.ts           # NEW - TypeScript interface defining public surface
├── feature.ts            # NEW - Lazy-loaded implementation (components + services)
├── types.ts              # Existing public types (unchanged)
├── constants.ts          # Existing constants (unchanged)
├── README.md             # Existing documentation (update with v3 notes)
├── components/           # INTERNAL (ESLint blocks external imports)
│   ├── HnBanner/
│   ├── HnDashboardBanner/
│   ├── HnMiniTxBanner/
│   ├── HnPendingBanner/
│   ├── HnQueueAssessmentBanner/
│   ├── HnActivatedSettingsBanner/
│   ├── HnSecurityReportBtn/
│   ├── HnSignupFlow/
│   ├── HnLoginCard/
│   ├── HnQueueAssessment/
│   ├── QueueAssessmentProvider/
│   ├── HypernativeLogo/
│   └── HypernativeTooltip/
├── hooks/                # INTERNAL (exported directly from index.ts)
│   ├── useIsHypernativeGuard.ts
│   ├── useIsHypernativeFeature.ts
│   ├── useIsHypernativeQueueScanFeature.ts
│   ├── useIsHypernativeEligible.ts
│   ├── useHypernativeOAuth.ts
│   ├── useBannerStorage.ts
│   ├── useBannerVisibility.ts
│   └── ... (16 hooks total)
├── services/             # INTERNAL (exposed via feature.ts)
│   ├── hypernativeGuardCheck.ts
│   └── safeTxHashCalculation.ts
├── store/                # DIRECT EXPORTS (not lazy-loaded)
│   ├── hnStateSlice.ts
│   ├── calendlySlice.ts
│   └── index.ts
├── contexts/             # INTERNAL
│   └── QueueAssessmentContext.tsx
├── config/               # INTERNAL
│   └── oauth.ts
└── utils/                # INTERNAL
    └── buildSecurityReportUrl.ts

# Consumer files requiring migration (grouped by priority):

# P1: Critical - Safe-Shield Integration (11 files)
apps/web/src/features/safe-shield/
├── index.tsx
├── SafeShieldContext.tsx
├── hooks/useThreatAnalysis.ts
├── hooks/useNestedThreatAnalysis.ts
├── components/SafeShieldDisplay.tsx
├── components/SafeShieldContent/index.tsx
├── components/HypernativeInfo/index.tsx
├── components/HypernativeCustomChecks/HypernativeCustomChecks.tsx
├── components/ThreatAnalysis/ThreatAnalysis.tsx
├── components/AnalysisGroupCard/AnalysisGroupCard.tsx
└── __tests__/* (test files)

# P1: Critical - OAuth Flow
apps/web/src/pages/hypernative/oauth-callback.tsx

# P2: Transaction Pages
apps/web/src/pages/transactions/queue.tsx
apps/web/src/pages/transactions/history.tsx
apps/web/src/components/transactions/TxSummary/index.tsx
apps/web/src/components/transactions/TxDetails/index.tsx
apps/web/src/components/tx-flow/flows/NewTx/index.tsx

# P2: Dashboard & Settings
apps/web/src/components/dashboard/index.tsx
apps/web/src/components/dashboard/FirstSteps/index.tsx
apps/web/src/components/settings/SecurityLogin/index.tsx

# P3: Miscellaneous
apps/web/src/components/sidebar/SidebarHeader/SafeHeaderInfo.tsx
apps/web/src/components/common/EthHashInfo/SrcEthHashInfo/index.tsx
apps/web/src/store/slices.ts
```

**Structure Decision**: Using the existing `src/features/hypernative/` directory, adding v3 architecture files (`contract.ts`, `feature.ts`) alongside existing code. No directory reorganization needed - internal folders already match the pattern.

## Complexity Tracking

> No violations requiring justification. All constitution gates pass.
