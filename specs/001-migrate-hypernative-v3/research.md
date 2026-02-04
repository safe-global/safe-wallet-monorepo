# Research: Hypernative v3 Architecture Migration

**Feature**: 001-migrate-hypernative-v3  
**Date**: 2026-01-28  
**Status**: Complete

## Research Questions

### Q1: Which components should be in the public contract?

**Decision**: 9 components + 1 service in the contract

**Rationale**: Only expose components that are directly consumed by external files. Internal composition components (HOCs, wrappers) remain internal.

**Public Components**:
| Component | Purpose | Consumers |
|-----------|---------|-----------|
| `HnBanner` | Main promotional banner | Dashboard carousel |
| `HnDashboardBanner` | Dashboard-specific variant | Dashboard |
| `HnMiniTxBanner` | Mini banner for transactions | TxDetails, TxSummary |
| `HnPendingBanner` | Pending transaction banner | Queue page |
| `HnQueueAssessmentBanner` | Queue assessment results | Queue page, NewTx |
| `HnActivatedSettingsBanner` | Settings confirmation | Settings page |
| `HnSecurityReportBtn` | Security report button | TxDetails |
| `HnLoginCard` | OAuth login card | Settings |
| `HypernativeLogo` | Brand logo | Safe-shield |

**Public Service**:
| Service | Purpose | Consumers |
|---------|---------|-----------|
| `isHypernativeGuard` | Guard bytecode detection | Safe-shield (programmatic checks) |

**Internal (not in contract)**:

- `HnSignupFlow` - embedded in banners via HOC
- `HnQueueAssessment` - internal to assessment banner
- `QueueAssessmentProvider` - internal context provider
- `HypernativeTooltip` - internal UI component
- `HnFeature` wrapper - replaced by `useLoadFeature`
- HOCs (`withHnFeature`, `withHnBannerConditions`, `withHnSignupFlow`) - internal composition

**Alternatives Considered**:

- Export all 17 components → Rejected (too large public surface, harder to maintain)
- Export only 5 core banners → Rejected (missing HnLoginCard, HypernativeLogo needed by safe-shield)

---

### Q2: Which hooks should be directly exported from index.ts?

**Decision**: 8 public hooks exported directly (always loaded, not lazy)

**Rationale**: Hooks cannot be lazy-loaded (Rules of Hooks violation). Export lightweight hooks that don't carry heavy dependencies.

**Public Hooks**:
| Hook | Purpose | Primary Consumers |
|------|---------|-------------------|
| `useIsHypernativeEligible` | Check if safe is eligible | Safe-shield (critical) |
| `useHypernativeOAuth` | OAuth flow management | Safe-shield, settings |
| `useIsHypernativeGuard` | Check if guard is installed | Safe-shield, settings |
| `useIsHypernativeFeatureEnabled` | Main feature flag check | Various |
| `useIsHypernativeQueueScanFeature` | Queue scan flag check | Queue pages |
| `useHnAssessmentSeverity` | Get assessment severity | Transaction pages |

**Also export** (for OAuth callback page):

- `savePkce`, `readPkce`, `clearPkce` - PKCE helper functions

**Internal hooks** (not exported):

- `useBannerStorage` - internal banner state
- `useBannerVisibility` - internal visibility logic
- `useTrackBannerEligibilityOnConnect` - internal analytics
- `useAuthToken` - internal auth token management
- `useCalendly` - internal Calendly integration
- `useShowHypernativeAssessment` - internal display logic
- `useAssessmentUrl` - internal URL building
- `useQueueAssessment` - internal queue context
- `useQueueBatchAssessments` - internal batch assessment

**Alternatives Considered**:

- Export all 16 hooks → Rejected (unnecessary API surface, some are internal implementation details)
- Export only 3 hooks (eligibility, OAuth, guard) → Rejected (missing feature flag hooks used by multiple consumers)

---

### Q3: How to handle multiple feature flags?

**Decision**: Feature handle uses main `FEATURES.HYPERNATIVE` flag; sub-feature hooks check additional flags

**Rationale**: The v3 architecture supports one feature flag per handle. Sub-features are controlled via lightweight hooks that check their specific flags.

**Implementation**:

```typescript
// Feature handle → FEATURES.HYPERNATIVE
export const HypernativeFeature = createFeatureHandle<HypernativeContract>('hypernative')

// Sub-feature hooks (always loaded, check specific flags)
export { useIsHypernativeQueueScanFeature } from './hooks/useIsHypernativeQueueScanFeature'
// → checks FEATURES.HYPERNATIVE_QUEUE_SCAN

// Internal hook checks FEATURES.HYPERNATIVE_RELAX_GUARD_CHECK
```

**Feature Flags**:
| Flag | Controls | Checked By |
|------|----------|------------|
| `FEATURES.HYPERNATIVE` | Main feature / lazy bundle loading | Feature handle |
| `FEATURES.HYPERNATIVE_QUEUE_SCAN` | Queue scanning behavior | `useIsHypernativeQueueScanFeature` |
| `FEATURES.HYPERNATIVE_RELAX_GUARD_CHECK` | ABI check bypass | `useIsHypernativeGuard` (internal) |

**Alternatives Considered**:

- Split into 3 separate features → Rejected (unnecessary complexity, all share same core bundle)
- Single flag for everything → Rejected (loses granular control over queue scanning)

---

### Q4: How to handle store exports?

**Decision**: Store exports remain direct imports (not lazy-loaded)

**Rationale**: Redux slices must be registered at store initialization, before any feature flag checks. This is per v3 architecture rules.

**Implementation**:

```typescript
// index.ts - store exports are direct (not in feature.ts)
export * from './store'
// Exports: hnStateSlice, calendlySlice, selectors
```

**Store Registration** (`apps/web/src/store/slices.ts`):

```typescript
import { hnStateSlice, calendlySlice } from '@/features/hypernative/store'
// Registered directly, not via useLoadFeature
```

**Alternatives Considered**:

- Lazy-load store slices → Rejected (breaks Redux initialization, slices needed before feature loads)
- Move store to shared packages → Rejected (store is feature-specific, not shared)

---

### Q5: How to handle HOC patterns during migration?

**Decision**: Preserve HOCs initially, embed logic in container components

**Rationale**: The existing HOC pattern (`withHnFeature`, `withHnBannerConditions`, `withHnSignupFlow`) is complex but works. Refactoring to container components can be done incrementally after the v3 migration is stable.

**Current Pattern**:

```typescript
// HnBanner/index.ts
const HnBannerWithSignupAndDismissal = withHnSignupFlow(HnBannerWithDismissal)
const HnBannerWithConditions = withHnBannerConditions(BannerType.Promo)(HnBannerWithSignupAndDismissal)
export default withHnFeature(HnBannerWithConditions)
```

**Migration Strategy**:

1. Export composed components (with HOCs applied) from `feature.ts`
2. Consumers use `feature.HnBanner` which already includes all HOC logic
3. Optional future refactor: Replace HOCs with container components

**Alternatives Considered**:

- Refactor all HOCs to containers first → Rejected (scope creep, increases risk)
- Export raw components + HOCs separately → Rejected (exposes internal composition)

---

### Q6: What is the codemod tool status?

**Decision**: Manual migration (codemod has build issues)

**Rationale**: The codemod tool at `tools/codemods/migrate-feature` has TypeScript build errors (missing `inquirer` types). Manual migration is straightforward for ~25 files.

**Migration Pattern** (manual):

```typescript
// Before
import { HnBanner } from '@/features/hypernative/components/HnBanner'

// After
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

const hn = useLoadFeature(HypernativeFeature)
return <hn.HnBanner />
```

**Alternatives Considered**:

- Fix codemod first → Rejected (time investment, manual migration is manageable)
- Use sed/awk for bulk changes → Rejected (error-prone, loses type safety)

---

### Q7: ESLint rule configuration?

**Decision**: Keep ESLint rule at `'warn'` level during migration, upgrade to `'error'` after completion

**Rationale**: Warning level allows incremental migration without blocking builds. Once all consumers are migrated, upgrade to error to prevent regression.

**Implementation**:

```javascript
// eslint.config.mjs - already configured
'no-restricted-imports': [
  'warn', // Change to 'error' after migration
  {
    patterns: [
      '@/features/*/components/*',
      '@/features/*/hooks/*',  // Note: hooks from index.ts are allowed
      '@/features/*/services/*',
      '@/features/*/store/*',   // Note: store from feature index is allowed
    ],
  },
],
```

**Alternatives Considered**:

- Start with 'error' → Rejected (blocks all builds until migration complete)
- No lint rule → Rejected (allows regression after migration)

---

## Summary of Decisions

| Question               | Decision                                 |
| ---------------------- | ---------------------------------------- |
| Public contract size   | 9 components + 1 service                 |
| Public hooks           | 8 hooks exported directly                |
| Multiple feature flags | Main flag on handle, sub-flags via hooks |
| Store exports          | Direct imports (not lazy)                |
| HOC patterns           | Preserve initially, refactor later       |
| Codemod usage          | Manual migration                         |
| ESLint level           | 'warn' during, 'error' after             |
