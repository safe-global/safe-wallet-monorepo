# Quickstart: Hypernative Feature Migration

**Feature**: 002-migrate-hypernative
**Date**: 2026-01-26

## Overview

This guide explains how to consume the hypernative feature after migration to the feature-architecture-v2 pattern.

## Basic Usage

### Importing the Feature

```typescript
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
```

### Using Components

```typescript
function MyComponent() {
  const hypernative = useLoadFeature(HypernativeFeature)

  // Handle loading state
  if (hypernative === undefined) return <Skeleton />

  // Handle disabled state
  if (hypernative === null) return null

  // Use feature components
  return <hypernative.components.HypernativeTooltip>...</hypernative.components.HypernativeTooltip>
}
```

### Simple Pattern (loading = disabled)

```typescript
function SimpleComponent() {
  const hypernative = useLoadFeature(HypernativeFeature)
  if (!hypernative) return null

  return <hypernative.components.HnBannerForHistory />
}
```

### Using Hooks

```typescript
function ComponentWithHook() {
  const hypernative = useLoadFeature(HypernativeFeature)
  if (!hypernative) return null

  const { isHypernativeGuard, loading } = hypernative.hooks.useIsHypernativeGuard()

  if (loading) return <Spinner />
  if (!isHypernativeGuard) return null

  return <div>Protected by Hypernative</div>
}
```

## Special Cases

### Redux Store Access

The Redux store remains directly importable (no lazy loading needed):

```typescript
import { selectSafeHnState, setBannerDismissed } from '@/features/hypernative/store'
import { useSelector, useDispatch } from 'react-redux'

function MyComponent() {
  const dispatch = useDispatch()
  const hnState = useSelector((state) => selectSafeHnState(state, chainId, safeAddress))

  const handleDismiss = () => {
    dispatch(setBannerDismissed({ chainId, safeAddress, dismissed: true }))
  }
}
```

### OAuth Callback Page

OAuth utilities are exported directly for synchronous access:

```typescript
import { readPkce, clearPkce, HYPERNATIVE_OAUTH_CONFIG, getRedirectUri } from '@/features/hypernative'

// Use directly without useLoadFeature
const pkce = readPkce()
```

### Type Imports

Types are available for compile-time use without runtime cost:

```typescript
import type { HypernativeAuthStatus, HypernativeEligibility, BannerType } from '@/features/hypernative'

function processAuth(status: HypernativeAuthStatus) {
  // ...
}
```

## Migration Checklist

When updating existing code to use the new pattern:

1. Replace direct component imports:

   ```typescript
   // Before
   import { HnBannerForHistory } from '@/features/hypernative/components/HnBanner'

   // After
   import { HypernativeFeature } from '@/features/hypernative'
   import { useLoadFeature } from '@/features/__core__'
   const hypernative = useLoadFeature(HypernativeFeature)
   // Use: hypernative.components.HnBannerForHistory
   ```

2. Replace direct hook imports:

   ```typescript
   // Before
   import { useIsHypernativeGuard } from '@/features/hypernative/hooks'

   // After
   const hypernative = useLoadFeature(HypernativeFeature)
   // Use: hypernative.hooks.useIsHypernativeGuard()
   ```

3. Keep store imports unchanged:

   ```typescript
   // This is still valid
   import { selectSafeHnState } from '@/features/hypernative/store'
   ```

4. Update type imports:

   ```typescript
   // Before
   import type { HypernativeAuthStatus } from '@/features/hypernative/hooks/useHypernativeOAuth'

   // After
   import type { HypernativeAuthStatus } from '@/features/hypernative'
   ```

## Testing

### Mocking the Feature

```typescript
jest.mock('@/features/hypernative', () => ({
  HypernativeFeature: {
    name: 'hypernative',
    useIsEnabled: () => true,
    load: () =>
      Promise.resolve({
        default: {
          components: {
            HypernativeTooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
          },
          hooks: {
            useIsHypernativeGuard: () => ({ isHypernativeGuard: true, loading: false }),
          },
        },
      }),
  },
}))
```

### Mocking Disabled Feature

```typescript
jest.mock('@/features/hypernative', () => ({
  HypernativeFeature: {
    name: 'hypernative',
    useIsEnabled: () => false, // Feature disabled
    load: () => Promise.resolve({ default: {} }),
  },
}))
```

## Common Patterns

### Conditional Rendering

```typescript
function ConditionalFeature() {
  const hypernative = useLoadFeature(HypernativeFeature)

  return (
    <div>
      {hypernative && <hypernative.components.HnBannerForCarousel />}
      <OtherContent />
    </div>
  )
}
```

### Provider Pattern

```typescript
function QueuePage() {
  const hypernative = useLoadFeature(HypernativeFeature)
  if (!hypernative) return <FallbackContent />

  const { QueueAssessmentProvider } = hypernative.components

  return (
    <QueueAssessmentProvider>
      <QueueContent />
    </QueueAssessmentProvider>
  )
}
```

## Troubleshooting

### ESLint Warnings

If you see restricted import warnings:

```
Import from feature index file only (e.g., @/features/hypernative).
```

Update your import to use the feature handle pattern instead of direct internal imports.

### TypeScript Errors

Ensure you're checking for `null`/`undefined` before accessing feature properties:

```typescript
const hypernative = useLoadFeature(HypernativeFeature)
// ❌ hypernative.components.X // Error: possibly null
// ✅ hypernative?.components.X // OK
// ✅ if (hypernative) { hypernative.components.X } // OK
```

### Component Not Found

If a component isn't in the contract, check if it's intentionally internal. Only externally-consumed components are exposed in the contract.
