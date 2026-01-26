# Data Model: Hypernative Feature Contract

**Feature**: 002-migrate-hypernative
**Date**: 2026-01-26

## Overview

This document defines the data model for the hypernative feature architecture v2 migration. The "data model" in this context represents the feature contract types that define the public API surface.

## Core Entities

### HypernativeFeature (Handle)

The feature handle is the entry point for lazy loading.

| Property       | Type                                                    | Description               |
| -------------- | ------------------------------------------------------- | ------------------------- |
| `name`         | `'hypernative'`                                         | Unique feature identifier |
| `useIsEnabled` | `() => boolean \| undefined`                            | Feature flag check hook   |
| `load`         | `() => Promise<{ default: HypernativeImplementation }>` | Lazy loader               |

### HypernativeImplementation

The lazy-loaded feature implementation containing components, hooks, and services.

```
HypernativeImplementation
├── components (14)
│   ├── HnBannerForHistory
│   ├── HnBannerForQueue
│   ├── HnBannerForCarousel
│   ├── HnBannerForSettings
│   ├── HnLoginCard
│   ├── HnMiniTxBanner
│   ├── HnPendingBanner
│   ├── HnDashboardBannerWithNoBalanceCheck
│   ├── HnActivatedBannerForSettings
│   ├── HypernativeTooltip
│   ├── HypernativeLogo
│   ├── HnQueueAssessment
│   ├── HnQueueAssessmentBanner
│   └── QueueAssessmentProvider
├── hooks (14)
│   ├── useIsHypernativeGuard
│   ├── useIsHypernativeFeature
│   ├── useIsHypernativeQueueScanFeature
│   ├── useBannerStorage
│   ├── useBannerVisibility
│   ├── useTrackBannerEligibilityOnConnect
│   ├── useAuthToken
│   ├── useCalendly
│   ├── useShowHypernativeAssessment
│   ├── useAssessmentUrl
│   ├── useHnAssessmentSeverity
│   ├── useHypernativeOAuth
│   ├── useIsHypernativeEligible
│   └── useQueueAssessment
└── services (2)
    ├── isHypernativeGuard
    └── calculateSafeTxHash (if needed)
```

### HypernativeContract

The full loaded feature type combining handle metadata with implementation.

| Property       | Type                         | Description                  |
| -------------- | ---------------------------- | ---------------------------- |
| `name`         | `'hypernative'`              | Feature identifier           |
| `useIsEnabled` | `() => boolean \| undefined` | Feature flag hook            |
| `components`   | `ComponentMap`               | Lazy-loaded React components |
| `hooks`        | `HooksMap`                   | Feature hooks                |
| `services`     | `ServicesMap`                | Utility services             |

## Related Entities (Unchanged)

### Redux State: HnState

The Redux slice remains unchanged and directly importable from `@/features/hypernative/store`.

```typescript
type HnState = {
  [chainIdAndAddress: string]: SafeHnState
}

type SafeHnState = {
  bannerDismissed: boolean
  formCompleted: boolean
  pendingBannerDismissed: boolean
  bannerEligibilityTracked: boolean
}
```

## Type Exports

Public types exported from `@/features/hypernative/types.ts`:

| Type                          | Source                   | Description                |
| ----------------------------- | ------------------------ | -------------------------- |
| `HypernativeAuthStatus`       | useHypernativeOAuth      | OAuth authentication state |
| `HypernativeEligibility`      | useIsHypernativeEligible | Feature eligibility result |
| `HypernativeGuardCheckResult` | useIsHypernativeGuard    | Guard detection result     |
| `BannerType`                  | useBannerStorage         | Banner type enum           |
| `BannerVisibilityResult`      | useBannerVisibility      | Banner visibility state    |

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    Consumer Component                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ imports HypernativeFeature
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    @/features/hypernative                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           HypernativeFeature (Handle)                │   │
│  │  • name: 'hypernative'                               │   │
│  │  • useIsEnabled: () => useHasFeature(FEATURES.HN)   │   │
│  │  • load: () => import('./feature')                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              │ lazy loads                   │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         HypernativeImplementation (feature.ts)      │   │
│  │  • components: { ... }                               │   │
│  │  • hooks: { ... }                                    │   │
│  │  • services: { ... }                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ reads/writes
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redux Store (hnStateSlice)               │
│  Directly importable from @/features/hypernative/store     │
└─────────────────────────────────────────────────────────────┘
```

## State Transitions

The feature handle has three states from consumer perspective:

| State    | `useLoadFeature()` returns | Meaning                            |
| -------- | -------------------------- | ---------------------------------- |
| Loading  | `undefined`                | Feature flag or code still loading |
| Disabled | `null`                     | Feature flag is disabled           |
| Loaded   | `HypernativeContract`      | Feature ready to use               |

```
                    ┌──────────────┐
                    │   Initial    │
                    │  undefined   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
     ┌────────────────┐       ┌────────────────┐
     │    Disabled    │       │    Loading     │
     │     null       │       │   undefined    │
     └────────────────┘       └───────┬────────┘
                                      │
                                      ▼
                              ┌────────────────┐
                              │    Loaded      │
                              │   feature obj  │
                              └────────────────┘
```
