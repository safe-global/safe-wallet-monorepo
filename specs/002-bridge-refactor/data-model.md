# Data Model: Bridge Feature Refactor

**Feature**: 002-bridge-refactor  
**Date**: 2026-01-15

## Overview

The bridge feature has no data model. It is a stateless UI feature that:

1. Checks if the BRIDGE feature flag is enabled for the current chain
2. Checks if the user is in a geoblocked region
3. Renders an iframe embedding the LI.FI bridge widget

## Entities

None. The feature does not define or manage any domain entities.

## State Management

None. The feature does not use Redux or any other state management:

- **Feature flag state**: Provided by `useHasFeature` hook (external to this feature)
- **Geoblocking state**: Provided by `GeoblockingContext` (external to this feature)
- **Theme state**: Provided by `useDarkMode` hook (external to this feature)
- **Chain state**: Provided by `useCurrentChain` hook (external to this feature)

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Bridge Page                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │  Chain Config    │────▶│ useHasFeature    │─┐                │
│  │  (CGW API)       │     │ (BRIDGE flag)    │ │                │
│  └──────────────────┘     └──────────────────┘ │                │
│                                                │                 │
│  ┌──────────────────┐     ┌──────────────────┐ │  ┌───────────┐ │
│  │  Geoblocking     │────▶│ GeoblockingCtx   │─┼─▶│ Bridge    │ │
│  │  Service         │     │                  │ │  │ Component │ │
│  └──────────────────┘     └──────────────────┘ │  └───────────┘ │
│                                                │        │       │
│                     useIsBridgeFeatureEnabled ─┘        │       │
│                                                         ▼       │
│                                               ┌───────────────┐ │
│  ┌──────────────────┐     ┌──────────────────┐│ BridgeWidget  │ │
│  │  useCurrentChain │────▶│  _getAppData     ││ (LI.FI iframe)│ │
│  │  useDarkMode     │────▶│                  │└───────────────┘ │
│  └──────────────────┘     └──────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Type Definitions

The feature requires minimal type definitions. The `types.ts` file will be created for consistency with the standard but will contain minimal content:

```typescript
// types.ts

// Currently no feature-specific types needed.
// This file exists for consistency with the feature architecture standard.
// Types can be added here as the feature evolves.

export {}
```

If future requirements introduce types (e.g., bridge transaction tracking), they would be defined here.
