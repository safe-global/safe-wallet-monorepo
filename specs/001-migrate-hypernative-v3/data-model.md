# Data Model: Hypernative v3 Public API

**Feature**: 001-migrate-hypernative-v3  
**Date**: 2026-01-28

## Overview

This document defines the public API surface for the Hypernative feature after migration to v3 architecture. The API is split into:

1. **Feature Contract** - Lazy-loaded components and services (accessed via `useLoadFeature`)
2. **Direct Exports** - Hooks and store (always loaded, imported directly)
3. **Type Exports** - TypeScript types (compile-time only)

## Feature Contract (Lazy-Loaded)

The feature contract defines what is accessible via `useLoadFeature(HypernativeFeature)`.

### Components (PascalCase)

| Export                      | Type      | Description                              | Stub Behavior  |
| --------------------------- | --------- | ---------------------------------------- | -------------- |
| `HnBanner`                  | Component | Main promotional banner with signup flow | Renders `null` |
| `HnDashboardBanner`         | Component | Dashboard-specific banner variant        | Renders `null` |
| `HnMiniTxBanner`            | Component | Mini banner for transaction pages        | Renders `null` |
| `HnPendingBanner`           | Component | Pending transaction banner               | Renders `null` |
| `HnQueueAssessmentBanner`   | Component | Queue assessment results banner          | Renders `null` |
| `HnActivatedSettingsBanner` | Component | Settings activation confirmation         | Renders `null` |
| `HnSecurityReportBtn`       | Component | Security report button                   | Renders `null` |
| `HnLoginCard`               | Component | OAuth login card for settings            | Renders `null` |
| `HypernativeLogo`           | Component | Hypernative brand logo                   | Renders `null` |

### Services (camelCase)

| Export               | Type     | Description                      | Stub Behavior |
| -------------------- | -------- | -------------------------------- | ------------- |
| `isHypernativeGuard` | Function | Guard bytecode detection service | `undefined`   |

**Usage Pattern**:

```typescript
const hn = useLoadFeature(HypernativeFeature)

// Components - always callable, render null when not ready
return <hn.HnBanner />

// Services - check $isReady before calling
if (hn.$isReady) {
  const isGuard = await hn.isHypernativeGuard(chainId, address, provider)
}
```

## Direct Exports (Always Loaded)

These are imported directly from `@/features/hypernative`, not via `useLoadFeature`.

### Hooks

| Export                             | Return Type                                            | Description                                                    |
| ---------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| `useIsHypernativeEligible`         | `{ isHypernativeEligible: boolean, loading: boolean }` | Check if safe is eligible for Hypernative                      |
| `useHypernativeOAuth`              | `HypernativeAuthStatus`                                | OAuth flow management (isAuthenticated, initiateLogin, logout) |
| `useIsHypernativeGuard`            | `HypernativeGuardCheckResult`                          | Check if guard is installed on safe                            |
| `useIsHypernativeFeatureEnabled`   | `boolean`                                              | Check if main feature flag is enabled                          |
| `useIsHypernativeQueueScanFeature` | `boolean`                                              | Check if queue scan feature flag is enabled                    |
| `useHnAssessmentSeverity`          | `HnSeverity \| null`                                   | Get assessment severity for current context                    |

### OAuth Helper Functions

| Export      | Signature                  | Description                  |
| ----------- | -------------------------- | ---------------------------- |
| `savePkce`  | `(data: PkceData) => void` | Save PKCE data to storage    |
| `readPkce`  | `() => PkceData \| null`   | Read PKCE data from storage  |
| `clearPkce` | `() => void`               | Clear PKCE data from storage |

### Store Exports

| Export                | Type        | Description                |
| --------------------- | ----------- | -------------------------- |
| `hnStateSlice`        | Redux Slice | Hypernative state slice    |
| `calendlySlice`       | Redux Slice | Calendly integration slice |
| `selectHnState`       | Selector    | Select Hypernative state   |
| `selectCalendlyState` | Selector    | Select Calendly state      |

### Constants

| Export                              | Type     | Description           |
| ----------------------------------- | -------- | --------------------- |
| `HYPERNATIVE_OUTREACH_ID`           | `string` | Outreach campaign ID  |
| `HYPERNATIVE_ALLOWLIST_OUTREACH_ID` | `string` | Allowlist campaign ID |

## Type Exports (Compile-Time Only)

### Public Types

| Type                          | Description                              |
| ----------------------------- | ---------------------------------------- |
| `HypernativeContract`         | Feature contract interface               |
| `HypernativeEligibility`      | Return type for useIsHypernativeEligible |
| `HypernativeAuthStatus`       | OAuth status type                        |
| `PkceData`                    | PKCE token data type                     |
| `HypernativeGuardCheckResult` | Guard check result type                  |
| `BannerVisibilityResult`      | Banner visibility state type             |
| `BannerType`                  | Banner type enum                         |

## Meta Properties

When using `useLoadFeature(HypernativeFeature)`, these properties are always available:

| Property      | Type            | Description                        |
| ------------- | --------------- | ---------------------------------- |
| `$isLoading`  | `boolean`       | True while feature code is loading |
| `$isDisabled` | `boolean`       | True if feature flag is disabled   |
| `$isReady`    | `boolean`       | True when loaded and enabled       |
| `$error`      | `Error \| null` | Error if loading failed            |

## Feature Flag Mapping

| Folder Name   | Feature Flag           | Controlled By                          |
| ------------- | ---------------------- | -------------------------------------- |
| `hypernative` | `FEATURES.HYPERNATIVE` | Feature handle (`createFeatureHandle`) |

Sub-feature flags are checked by hooks:

- `FEATURES.HYPERNATIVE_QUEUE_SCAN` → `useIsHypernativeQueueScanFeature`
- `FEATURES.HYPERNATIVE_RELAX_GUARD_CHECK` → `useIsHypernativeGuard` (internal)

## Validation Rules

### Component Props

Components maintain their existing prop interfaces. No changes to component APIs.

### Hook Return Types

All hooks maintain their existing return types for backward compatibility:

```typescript
// useIsHypernativeEligible
type HypernativeEligibility = {
  isHypernativeEligible: boolean
  loading: boolean
}

// useHypernativeOAuth
type HypernativeAuthStatus = {
  isAuthenticated: boolean
  isLoading: boolean
  initiateLogin: () => Promise<void>
  logout: () => void
  error: Error | null
}

// useIsHypernativeGuard
type HypernativeGuardCheckResult = {
  isHypernativeGuard: boolean
  loading: boolean
  error: Error | null
}
```

## State Transitions

The feature handle transitions through these states:

```
Initial → Loading → Ready
                 ↘ Disabled
                 ↘ Error
```

| State    | $isLoading | $isDisabled | $isReady | Component Behavior | Service Behavior   |
| -------- | ---------- | ----------- | -------- | ------------------ | ------------------ |
| Initial  | `false`    | `false`     | `false`  | Renders `null`     | `undefined`        |
| Loading  | `true`     | `false`     | `false`  | Renders `null`     | `undefined`        |
| Ready    | `false`    | `false`     | `true`   | Renders component  | Function available |
| Disabled | `false`    | `true`      | `false`  | Renders `null`     | `undefined`        |
| Error    | `false`    | `false`     | `false`  | Renders `null`     | `undefined`        |
