# Data Model: Refactor Earn Feature

**Feature**: 002-refactor-earn-feature  
**Date**: 2026-01-15  
**Purpose**: Define data entities, relationships, and state management for the earn feature

---

## Overview

The earn feature is a UI-centric feature with minimal local state management. Most data flows through external systems (Kiln widget iframe, CGW API for feature flags, browser LocalStorage for user preferences). This document defines the logical data entities and their relationships within the earn feature domain.

---

## Entities

### 1. Earn Consent State

**Description**: Tracks whether the user has accepted the disclaimer to use the Kiln earn widget.

**Storage**: Browser LocalStorage

**Key**: `lendDisclaimerAcceptedV1` (stored in `EARN_CONSENT_STORAGE_KEY` constant)

**Schema**:

```typescript
type EarnConsentState = boolean | undefined

// undefined = not checked yet (loading)
// false = user has not accepted
// true = user has accepted
```

**Lifecycle**:

1. On first visit to `/earn`, state is `undefined` (loading from localStorage)
2. Hook `useConsent` resolves to `false` if no consent stored
3. User clicks "Continue" on disclaimer → state becomes `true`, stored in localStorage
4. On subsequent visits, state immediately resolves to `true`

**Validation Rules**:

- Must be a boolean value when stored
- No expiration (persists indefinitely until user clears storage)
- Feature-specific (does not affect other features)

**Dependencies**:

- Used by: `EarnPage` component to determine whether to show disclaimer or widget
- Hook: `useConsent(EARN_CONSENT_STORAGE_KEY)` from `@/hooks/useConsent`

---

### 2. Feature Flag State

**Description**: Determines whether the earn feature is enabled for the current chain.

**Storage**: CGW API (Chain Gateway) chain configuration

**Key**: `FEATURES.EARN` from `@safe-global/utils/utils/chains`

**Schema**:

```typescript
type FeatureFlagState = boolean | undefined

// undefined = loading (chain config not yet fetched)
// false = feature disabled for current chain
// true = feature enabled for current chain
```

**Lifecycle**:

1. On app load, chain config is fetched from CGW API
2. Hook `useHasFeature(FEATURES.EARN)` returns `undefined` while loading
3. Once loaded, returns `true` or `false` based on chain config
4. Changes when user switches chains (re-evaluated per chain)

**Validation Rules**:

- Read-only (cannot be modified by client)
- Per-chain configuration (different chains have different values)
- Combines with geoblocking check in `useIsEarnFeatureEnabled`

**Dependencies**:

- Used by: `useIsEarnFeatureEnabled` hook (public API)
- Used by: `earn.tsx` page to show/hide feature
- Hook: `useHasFeature(FEATURES.EARN)` from `@/hooks/useChains`

---

### 3. Geoblocking State

**Description**: Determines whether the user's country is blocked from accessing earn features.

**Storage**: Global React Context (`GeoblockingContext`)

**Schema**:

```typescript
type GeoblockingState = boolean

// false = country is not blocked
// true = country is blocked (user cannot access earn)
```

**Lifecycle**:

1. On app load, geolocation check is performed
2. Context provider sets boolean value based on user's country
3. Value is accessible throughout the app via `useContext(GeoblockingContext)`

**Validation Rules**:

- Read-only (cannot be modified by client)
- Global state (not feature-specific, but affects earn)
- Regulatory compliance requirement

**Dependencies**:

- Used by: `useIsEarnFeatureEnabled` hook to combine with feature flag
- Context: `GeoblockingContext` from `@/components/common/GeoblockingProvider`

---

### 4. Blocked Address State

**Description**: Determines whether the current Safe address is on a blocklist.

**Storage**: Determined by backend check

**Schema**:

```typescript
type BlockedAddressState = string | null

// null = address is not blocked
// string = blocked address (shows error message)
```

**Lifecycle**:

1. Hook `useBlockedAddress` checks current Safe against blocklist
2. Returns `null` if not blocked, or the address string if blocked
3. Re-evaluated when Safe address changes

**Validation Rules**:

- Read-only (cannot be modified by client)
- Address-specific (not chain-specific)
- Security/compliance requirement

**Dependencies**:

- Used by: `EarnPage` component to show blocked address message
- Hook: `useBlockedAddress()` from `@/hooks/useBlockedAddress`

---

### 5. Asset Selection State

**Description**: Pre-selects a specific asset when navigating to the earn page.

**Storage**: URL query parameter (`asset_id`)

**Key**: `asset_id` query parameter

**Schema**:

```typescript
type AssetSelectionState = string | undefined

// undefined = no asset pre-selected
// string = asset identifier in format "{chainId}_{tokenAddress}"
// Example: "1_0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" (WETH on Ethereum)
```

**Lifecycle**:

1. User clicks `EarnButton` on an asset row
2. Button navigates to `/earn?asset_id={chainId}_{tokenAddress}`
3. `EarnView` component reads query parameter
4. Parameter is passed to Kiln widget via `useGetWidgetUrl` hook
5. Widget pre-selects the asset for the user

**Validation Rules**:

- Format: `{chainId}_{tokenAddress}` (e.g., "1_0xABC...")
- Chain ID must match current chain
- Token address must be valid Ethereum address
- Token must be eligible for earn (checked via `isEligibleEarnToken` utility)

**Dependencies**:

- Set by: `EarnButton` component when clicked
- Read by: `EarnView` component via `useRouter().query`
- Passed to: Kiln widget via `useGetWidgetUrl` hook
- Validated by: `isEligibleEarnToken` utility in `services/utils.ts`

---

### 6. Info Panel Display State

**Description**: Tracks whether the user has dismissed the informational panel about earn.

**Storage**: Browser LocalStorage

**Key**: `hideEarnInfoV2` (stored in `hideEarnInfoStorageKey` constant)

**Schema**:

```typescript
type InfoPanelState = boolean | undefined

// undefined = not checked yet (loading)
// false = info panel should be shown
// true = info panel has been dismissed, show widget directly
```

**Lifecycle**:

1. On visit to `/earn`, state is checked from localStorage
2. If `false` or `undefined`, show `EarnInfo` component
3. User clicks "Get Started" → state becomes `true`, stored in localStorage
4. On subsequent visits, show `EarnWidget` directly (skip info panel)

**Validation Rules**:

- Boolean value when stored
- No expiration (persists indefinitely)
- User can reset by clearing localStorage

**Dependencies**:

- Used by: `EarnView` component to determine which view to show
- Hook: `useLocalStorage<boolean>(hideEarnInfoStorageKey)` from `@/services/local-storage/useLocalStorage`

---

### 7. Widget Configuration

**Description**: Configuration data passed to the Kiln widget iframe.

**Storage**: Computed dynamically (not persisted)

**Schema**:

```typescript
interface WidgetConfiguration {
  url: string // Base URL (production or testnet)
  theme: 'light' | 'dark' // Theme based on user preference
  asset_id?: string // Optional pre-selected asset
}
```

**Lifecycle**:

1. `useGetWidgetUrl` hook computes widget URL
2. Checks if current chain is testnet → use `WIDGET_TESTNET_URL`
3. Otherwise → use `WIDGET_PRODUCTION_URL`
4. Appends query parameters: `theme`, `asset_id` (if provided)
5. Returns complete URL for iframe `src` attribute

**Validation Rules**:

- URL must be from approved Kiln domains
- Theme must match user's dark mode preference
- Asset ID (if provided) must match format from Asset Selection State

**Dependencies**:

- Generated by: `useGetWidgetUrl` hook in `hooks/useGetWidgetUrl.ts`
- Used by: `EarnWidget` component to set iframe `src`
- Depends on: `useDarkMode`, `useChains`, `useChainId` hooks

---

## Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Navigation                          │
│                    (to /earn or via EarnButton)                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          earn.tsx Page                           │
│             (checks Feature Flag + Geoblocking)                  │
└───┬─────────────────────┬─────────────────────┬─────────────────┘
    │                     │                     │
    │ FeatureFlagState    │ GeoblockingState    │ BlockedAddressState
    │ = undefined         │ = true              │ ≠ null
    ▼                     ▼                     ▼
┌─────────┐         ┌──────────────┐      ┌───────────────────┐
│ Render  │         │   Render     │      │     Render        │
│ nothing │         │ Geoblocking  │      │ Blocked Address   │
│         │         │   Message    │      │     Message       │
└─────────┘         └──────────────┘      └───────────────────┘
    │
    │ FeatureFlagState = true && GeoblockingState = false
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EarnPage Component                       │
│                    (checks Earn Consent State)                   │
└───┬─────────────────────────────────────────┬───────────────────┘
    │ EarnConsentState = false                │ EarnConsentState = true
    ▼                                         ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│   Disclaimer Component      │     │      EarnView Component     │
│  (user clicks "Continue")   │     │  (checks Info Panel State)  │
└────────────┬────────────────┘     └───┬─────────────────────────┘
             │                           │
             │ Sets EarnConsentState     │ InfoPanelState = false
             │ to true                   ▼
             │                    ┌──────────────────┐
             │                    │  EarnInfo        │
             │                    │  (user clicks    │
             │                    │  "Get Started")  │
             │                    └────────┬─────────┘
             │                             │
             │                             │ Sets InfoPanelState
             │                             │ to true
             │ InfoPanelState = true       │
             └────────────┬────────────────┘
                          ▼
                ┌──────────────────────────┐
                │     EarnWidget           │
                │  (renders Kiln iframe)   │
                └────────────┬─────────────┘
                             │
                             │ Uses Widget Configuration
                             │ + Asset Selection State
                             ▼
                  ┌────────────────────┐
                  │   Kiln Widget      │
                  │   (third-party)    │
                  └────────────────────┘
```

---

## State Management

### Local Component State

The earn feature uses **local component state** and **React hooks** rather than Redux. This is appropriate because:

1. **Ephemeral UI state**: Consent, info panel visibility are UI concerns
2. **No cross-feature sharing**: No other features need access to earn state
3. **Simple state transitions**: Boolean flags with straightforward logic
4. **External widget**: Core functionality lives in Kiln iframe (external system)

### No Redux Store Needed

**Decision**: The earn feature does NOT require a Redux store slice.

**Rationale**:

- State is localized to the feature
- No complex state machines or async state
- No need for time-travel debugging
- Follows principle of simplicity (Constitution Principle: avoid over-engineering)

### Hooks Used for State

| Hook                             | Purpose                                 | Source                                     |
| -------------------------------- | --------------------------------------- | ------------------------------------------ |
| `useConsent`                     | Manage consent state in localStorage    | `@/hooks/useConsent`                       |
| `useLocalStorage`                | Manage info panel state in localStorage | `@/services/local-storage/useLocalStorage` |
| `useHasFeature`                  | Read feature flag state from CGW config | `@/hooks/useChains`                        |
| `useContext(GeoblockingContext)` | Read geoblocking state from context     | React Context                              |
| `useBlockedAddress`              | Check if current address is blocked     | `@/hooks/useBlockedAddress`                |
| `useRouter`                      | Read and write URL query parameters     | Next.js router                             |
| `useDarkMode`                    | Read user's theme preference            | `@/hooks/useDarkMode`                      |

---

## Data Flow Summary

1. **User navigates to `/earn`** → Page checks feature flag + geoblocking
2. **Feature enabled** → Page checks consent state
3. **Consent not given** → Show disclaimer, wait for acceptance
4. **Consent given** → Show EarnView, check info panel state
5. **Info panel not dismissed** → Show EarnInfo, wait for "Get Started"
6. **Info panel dismissed** → Show EarnWidget with Kiln iframe
7. **Asset pre-selected** (via query param) → Pass to widget URL
8. **Widget loads** → User interacts with third-party Kiln interface

---

## Validation Summary

| Entity           | Validation                   | Enforced By                   |
| ---------------- | ---------------------------- | ----------------------------- |
| Earn Consent     | Boolean only                 | `useConsent` hook             |
| Feature Flag     | Read-only from API           | CGW API + `useHasFeature`     |
| Geoblocking      | Read-only from context       | `GeoblockingContext`          |
| Blocked Address  | Read-only from hook          | `useBlockedAddress`           |
| Asset Selection  | Format `{chainId}_{address}` | `isEligibleEarnToken` utility |
| Info Panel State | Boolean only                 | `useLocalStorage` hook        |
| Widget Config    | URL from allowed domains     | `useGetWidgetUrl` hook        |

---

## Conclusion

The earn feature's data model is intentionally simple. State is managed through React hooks and browser APIs (localStorage, URL parameters, Context). No Redux store is needed. The refactoring will preserve this simple state management while improving the code organization and API boundaries.
