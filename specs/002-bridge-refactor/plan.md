# Implementation Plan: Bridge Feature Refactor

**Branch**: `002-bridge-refactor` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-bridge-refactor/spec.md`

## Summary

Refactor the bridge feature to comply with the feature architecture standard established in 001-feature-architecture. This involves creating missing barrel files, extracting constants, adding a proper public API with lazy loading, and updating external imports to use the public API instead of internal paths.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14)  
**Primary Dependencies**: Next.js (dynamic imports), React, MUI  
**Storage**: N/A (no state persistence)  
**Testing**: Jest + React Testing Library  
**Target Platform**: Web (Next.js SSR/CSR)  
**Project Type**: web (monorepo workspace: `@safe-global/web`)  
**Performance Goals**: Zero impact on initial bundle size (feature is lazy-loaded)  
**Constraints**: Must preserve existing functionality, geoblocking integration, and test coverage  
**Scale/Scope**: 5 existing files to refactor, ~5 new barrel/type files to create, 2 external imports to update

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                        | Status  | Notes                                                           |
| -------------------------------- | ------- | --------------------------------------------------------------- |
| **I. Monorepo Unity**            | ✅ Pass | Feature is web-only, no shared package changes                  |
| **II. Type Safety**              | ✅ Pass | All new files will have explicit types, no `any` usage          |
| **III. Test-First Development**  | ✅ Pass | Existing tests preserved; no new business logic requiring tests |
| **IV. Design System Compliance** | ✅ Pass | No UI changes, only structural refactoring                      |
| **V. Safe-Specific Security**    | ✅ Pass | No security-critical changes, preserving existing patterns      |
| **Architecture Constraints**     | ✅ Pass | Feature remains in `src/features/`, follows standard structure  |
| **Workflow Enforcement**         | ✅ Pass | Will run type-check, lint, tests before committing              |

**Violations**: None

## Project Structure

### Documentation (this feature)

```text
specs/002-bridge-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - no unknowns)
├── data-model.md        # Phase 1 output (minimal - no data model)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty - no API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

**Current Structure** (before refactoring):

```text
apps/web/src/features/bridge/
├── components/
│   ├── Bridge/
│   │   └── index.tsx          # Entry point with wrappers
│   └── BridgeWidget/
│       ├── index.tsx          # LI.FI iframe embed
│       └── index.test.tsx     # Widget tests
└── hooks/
    ├── useIsBridgeFeatureEnabled.ts
    └── useIsGeoblockedFeatureEnabled.ts
```

**Target Structure** (after refactoring):

```text
apps/web/src/features/bridge/
├── index.ts                   # NEW: Public API barrel (lazy-loaded default export)
├── types.ts                   # NEW: TypeScript interfaces
├── constants.ts               # NEW: BRIDGE_WIDGET_URL, LOCAL_STORAGE_CONSENT_KEY
├── components/
│   ├── index.ts               # NEW: Component barrel
│   ├── Bridge/
│   │   └── index.tsx          # Entry point (unchanged)
│   └── BridgeWidget/
│       ├── index.tsx          # Widget (remove BRIDGE_WIDGET_URL export)
│       └── index.test.tsx     # Tests (unchanged)
└── hooks/
    ├── index.ts               # NEW: Hook barrel
    ├── useIsBridgeFeatureEnabled.ts    # (unchanged)
    └── useIsGeoblockedFeatureEnabled.ts # (unchanged)
```

**External Files Requiring Updates**:

```text
apps/web/src/pages/bridge.tsx                    # Update import to use public API
apps/web/src/services/analytics/tx-tracking.ts   # Update import to use public API
```

**Structure Decision**: Single feature module following the standard feature architecture pattern. No services or store directories needed (bridge feature has no state management or service layer).

## Complexity Tracking

No violations requiring justification. This is a straightforward structural refactoring following an established pattern.

## Phase 0: Research Summary

**Unknowns**: None. The pattern is fully established in 001-feature-architecture and demonstrated in the walletconnect reference implementation.

**Decisions**:

1. **`useIsGeoblockedFeatureEnabled` location**: Keep in bridge feature and export from public API. The TODO comment in the code suggests it should be reusable, but moving to shared hooks is out of scope for this refactoring. Other features can import it from `@/features/bridge` until a separate extraction task is planned.

2. **`_getAppData` function**: This is a private helper function (underscore prefix indicates internal use). The test file imports it directly which is acceptable for unit tests within the feature. The function will NOT be exported from the public API.

3. **Types file contents**: The bridge feature has no complex types. The `types.ts` file will be minimal, potentially just re-exporting types used by the hooks if needed for external consumers.

## Phase 1: Design

### Data Model

N/A - The bridge feature has no data model. It renders an iframe (LI.FI widget) and checks feature flags. No entities, no state, no persistence.

### API Contracts

N/A - The bridge feature has no API contracts. It does not expose any programmatic interface beyond:

- A default export (lazy-loaded Bridge component)
- Feature flag hooks
- Constants

### Public API Design

```typescript
// src/features/bridge/index.ts

// Types (if any are needed by external consumers)
export type {} from /* TBD based on actual needs */ './types'

// Feature flag hooks (required exports)
export { useIsBridgeFeatureEnabled } from './hooks'
export { useIsGeoblockedFeatureEnabled } from './hooks'

// Constants (needed by analytics)
export { BRIDGE_WIDGET_URL, LOCAL_STORAGE_CONSENT_KEY } from './constants'

// Lazy-loaded component (default export)
import dynamic from 'next/dynamic'

const Bridge = dynamic(() => import('./components/Bridge').then((mod) => ({ default: mod.Bridge })), { ssr: false })

export default Bridge
```

### File Changes Summary

| File                                | Action | Description                                                                             |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| `index.ts`                          | Create | Public API barrel with lazy-loaded default export                                       |
| `types.ts`                          | Create | TypeScript interfaces (minimal)                                                         |
| `constants.ts`                      | Create | Move `BRIDGE_WIDGET_URL` from BridgeWidget, add `LOCAL_STORAGE_CONSENT_KEY` from Bridge |
| `components/index.ts`               | Create | Re-export `Bridge` component                                                            |
| `hooks/index.ts`                    | Create | Re-export hooks                                                                         |
| `components/Bridge/index.tsx`       | Modify | Import `LOCAL_STORAGE_CONSENT_KEY` from constants                                       |
| `components/BridgeWidget/index.tsx` | Modify | Import `BRIDGE_WIDGET_URL` from constants, remove export                                |
| `pages/bridge.tsx`                  | Modify | Use public API import                                                                   |
| `services/analytics/tx-tracking.ts` | Modify | Use public API import                                                                   |

## Verification Checklist

After implementation, verify:

- [ ] `yarn workspace @safe-global/web type-check` passes
- [ ] `yarn workspace @safe-global/web lint` passes (no restricted import warnings)
- [ ] `yarn workspace @safe-global/web test` passes (bridge tests pass)
- [ ] `yarn workspace @safe-global/web build` succeeds
- [ ] Bridge feature chunk exists in build output
- [ ] Feature structure matches standard checklist in `docs/feature-architecture.md`
