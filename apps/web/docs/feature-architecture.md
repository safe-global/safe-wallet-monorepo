# Feature Architecture Standard

This document defines the standard architecture pattern for features in the Safe{Wallet} web application. All features must follow this pattern to ensure consistency, maintainability, and proper isolation.

## Table of Contents

- [Overview](#overview)
- [Standard Folder Structure](#standard-folder-structure)
- [Feature Flag Pattern](#feature-flag-pattern)
- [Lazy Loading Pattern](#lazy-loading-pattern)
- [Public API Barrel File](#public-api-barrel-file)
- [Cross-Feature Communication](#cross-feature-communication)
- [Common Mistakes & Anti-Patterns](#common-mistakes--anti-patterns)
- [Feature Creation Guide](#feature-creation-guide)
- [Migration Guide](#migration-guide)
- [ESLint Enforcement](#eslint-enforcement)
- [Bundle Verification](#bundle-verification)
- [Checklist](#checklist)

## Overview

A **feature** is a self-contained domain module that:

- Resides in its own directory under `src/features/{feature-name}/`
- Has a clear public API exposed through an `index.ts` barrel file
- Is associated with a feature flag from the `FEATURES` enum
- Is lazy-loaded to enable code splitting
- Has no side effects when its feature flag is disabled

### Key Principles

1. **Isolation**: Features don't import each other's internals
2. **Lazy Loading**: Features are loaded on-demand, not in the initial bundle
3. **Feature Flags**: Features can be disabled per chain without loading their code
4. **Type Safety**: All feature interfaces are strongly typed

## Standard Folder Structure

Every feature MUST have this structure:

```
src/features/{feature-name}/
├── index.ts              # Public API (barrel file) - REQUIRED
├── types.ts              # TypeScript interfaces - REQUIRED
├── constants.ts          # Feature constants - REQUIRED
├── components/
│   ├── index.ts          # Component exports - REQUIRED
│   └── {ComponentName}/
│       ├── index.tsx     # Component implementation
│       └── index.test.tsx
├── hooks/
│   ├── index.ts          # Hook exports - REQUIRED
│   ├── useIs{FeatureName}Enabled.ts - REQUIRED
│   └── use{HookName}.ts
├── services/
│   ├── index.ts          # Service exports - REQUIRED if services exist
│   └── {ServiceName}.ts
└── store/                # Redux slice - OPTIONAL
    ├── index.ts          # Store exports
    └── {sliceName}Slice.ts
```

### File Purposes

| File                             | Purpose                                                         | Required          |
| -------------------------------- | --------------------------------------------------------------- | ----------------- |
| `index.ts`                       | Public API barrel - only exports meant for external consumption | Yes               |
| `types.ts`                       | All TypeScript interfaces, types, and enums for the feature     | Yes               |
| `constants.ts`                   | Feature-specific constants, magic strings, configuration        | Yes               |
| `components/index.ts`            | Re-exports public components                                    | Yes               |
| `hooks/index.ts`                 | Re-exports public hooks                                         | Yes               |
| `hooks/useIs{Feature}Enabled.ts` | Feature flag check hook                                         | Yes               |
| `services/index.ts`              | Re-exports public services                                      | If services exist |
| `store/index.ts`                 | Re-exports Redux slice and selectors                            | If store exists   |

## Feature Flag Pattern

Every feature MUST have a feature flag hook that checks if the feature is enabled.

### Required Hook

```typescript
// hooks/useIsWalletConnectEnabled.ts
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsWalletConnectEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.NATIVE_WALLETCONNECT)
}
```

### Return Values

| Value       | Meaning                               | Behavior       |
| ----------- | ------------------------------------- | -------------- |
| `undefined` | Loading (chain config not yet loaded) | Render nothing |
| `false`     | Feature disabled for current chain    | Render nothing |
| `true`      | Feature enabled                       | Render feature |

### Component Usage

```typescript
// components/MyFeatureWidget/index.tsx
import type { ReactElement } from 'react'
import { useIsMyFeatureEnabled } from '../../hooks'

export function MyFeatureWidget(): ReactElement | null {
  const isEnabled = useIsMyFeatureEnabled()

  // CRITICAL: Return null if not enabled
  if (isEnabled !== true) return null

  return (
    <div data-testid="my-feature-widget">
      {/* Feature content */}
    </div>
  )
}
```

## Lazy Loading Pattern

Every feature MUST be lazy-loaded using Next.js `dynamic()` imports.

### Basic Pattern

```typescript
// index.ts
import dynamic from 'next/dynamic'

const MyFeatureWidget = dynamic(
  () => import('./components/MyFeatureWidget').then((mod) => ({ default: mod.MyFeatureWidget })),
  { ssr: false },
)

export default MyFeatureWidget
```

### When to Use `{ ssr: false }`

Use `{ ssr: false }` when the feature:

- Uses browser-only APIs (WalletConnect, Web3, localStorage, etc.)
- Depends on window or document objects
- Uses libraries that don't support SSR

### Consumer Usage

```typescript
// pages/my-page.tsx
import dynamic from 'next/dynamic'
import { useIsMyFeatureEnabled } from '@/features/my-feature'

const MyFeature = dynamic(() => import('@/features/my-feature'), { ssr: false })

export default function MyPage() {
  const isEnabled = useIsMyFeatureEnabled()

  return (
    <main>
      {isEnabled && <MyFeature />}
    </main>
  )
}
```

## Public API Barrel File

The `index.ts` file is the feature's public API. It defines what the feature exposes to the rest of the application.

### Complete Example

```typescript
// src/features/my-feature/index.ts
import dynamic from 'next/dynamic'

// Types (tree-shakeable, always safe to export)
export type { MyFeatureConfig, MyFeatureState, MyFeatureEvent } from './types'

// Feature flag hook (REQUIRED)
export { useIsMyFeatureEnabled } from './hooks'

// Store selectors (if feature has Redux state)
export { selectMyFeatureState, selectMyFeatureStatus } from './store'

// Constants (if needed externally)
export { MY_FEATURE_EVENTS } from './constants'

// Lazy-loaded component (default export)
const MyFeatureWidget = dynamic(() => import('./components/MyFeatureWidget'), { ssr: false })

export default MyFeatureWidget
```

### Allowed Exports

| Export Type       | Example                          | Notes                      |
| ----------------- | -------------------------------- | -------------------------- |
| Default component | `export default FeatureWidget`   | Lazy-loaded entry point    |
| Types             | `export type { FeatureConfig }`  | Always tree-shakeable      |
| Feature flag hook | `export { useIsFeatureEnabled }` | Required                   |
| Store selectors   | `export { selectFeatureState }`  | If feature has Redux state |
| Constants         | `export { FEATURE_CONSTANT }`    | If needed externally       |

### Forbidden Exports

- Internal components (anything in component subdirectories)
- Internal hooks (except the feature flag hook)
- Service implementations
- Internal utilities

## Cross-Feature Communication

Features must NOT import each other's internals. Use these patterns instead:

### Via Redux Store

```typescript
// Feature A dispatches action
dispatch(someAction(payload))

// Feature B selects state
const state = useSelector(selectSomeState)
```

### Via Defined Service Interfaces

```typescript
// Shared service interface in src/services/
export interface FeatureCommunicationService {
  notify(event: string, data: unknown): void
  subscribe(event: string, handler: (data: unknown) => void): () => void
}
```

### Shared Code Location

| Code Type                            | Location          |
| ------------------------------------ | ----------------- |
| Utilities used by multiple features  | `src/utils/`      |
| Hooks used by multiple features      | `src/hooks/`      |
| Components used by multiple features | `src/components/` |

## Common Mistakes & Anti-Patterns

### ❌ Importing Internal Files

```typescript
// WRONG - imports feature internals
import { WcInput } from '@/features/walletconnect/components/WcInput'
import { useWcUri } from '@/features/walletconnect/hooks/useWcUri'
```

```typescript
// CORRECT - imports from feature index only
import WalletConnect, { useIsWalletConnectEnabled } from '@/features/walletconnect'
```

### ❌ Missing Feature Flag Check

```typescript
// WRONG - no feature flag check, always renders
export function MyFeature() {
  return <div>Always renders</div>
}
```

```typescript
// CORRECT - checks feature flag
export function MyFeature() {
  const isEnabled = useIsMyFeatureEnabled()
  if (!isEnabled) return null
  return <div>Conditionally renders</div>
}
```

### ❌ Static Import of Feature

```typescript
// WRONG - static import bundles feature in main chunk
import MyFeature from '@/features/my-feature/components/MyFeatureWidget'
```

```typescript
// CORRECT - dynamic import enables code splitting
const MyFeature = dynamic(() => import('@/features/my-feature'), { ssr: false })
```

### ❌ Side Effects When Disabled

```typescript
// WRONG - API call happens even when disabled
export function MyFeature() {
  const isEnabled = useIsMyFeatureEnabled()
  const { data } = useQuery('my-feature-data') // Always fetches!

  if (!isEnabled) return null
  return <div>{data}</div>
}
```

```typescript
// CORRECT - no side effects when disabled
export function MyFeature() {
  const isEnabled = useIsMyFeatureEnabled()

  if (!isEnabled) return null

  // Data fetching only happens when enabled
  return <MyFeatureContent />
}

function MyFeatureContent() {
  const { data } = useQuery('my-feature-data')
  return <div>{data}</div>
}
```

### ❌ Store Inside Component Directory

```typescript
// WRONG - store logic mixed with UI
components / MyComponent / index.tsx
store.ts // Should be in feature's store/ directory
```

```typescript
// CORRECT - store in dedicated directory
store / index.ts
mySlice.ts
components / MyComponent / index.tsx
```

## Feature Creation Guide

### Step 1: Create Directory Structure

```bash
mkdir -p src/features/{feature-name}/{components,hooks,services,store}
```

### Step 2: Create Required Files

```bash
touch src/features/{feature-name}/index.ts
touch src/features/{feature-name}/types.ts
touch src/features/{feature-name}/constants.ts
touch src/features/{feature-name}/components/index.ts
touch src/features/{feature-name}/hooks/index.ts
touch src/features/{feature-name}/hooks/useIs{FeatureName}Enabled.ts
```

### Step 3: Add Feature Flag (if new)

1. Add to `FEATURES` enum in `packages/utils/src/utils/chains.ts`:

```typescript
export enum FEATURES {
  // ... existing features
  MY_NEW_FEATURE = 'MY_NEW_FEATURE',
}
```

2. Configure in CGW API chain configs (coordinate with backend team)

### Step 4: Implement Feature Flag Hook

```typescript
// hooks/useIsMyFeatureEnabled.ts
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsMyFeatureEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.MY_NEW_FEATURE)
}
```

### Step 5: Export Hook from Barrel

```typescript
// hooks/index.ts
export { useIsMyFeatureEnabled } from './useIsMyFeatureEnabled'
```

### Step 6: Create Main Component

```typescript
// components/MyFeatureWidget/index.tsx
import type { ReactElement } from 'react'
import { useIsMyFeatureEnabled } from '../../hooks'

export function MyFeatureWidget(): ReactElement | null {
  const isEnabled = useIsMyFeatureEnabled()

  if (!isEnabled) return null

  return (
    <div data-testid="my-feature-widget">
      {/* Feature content */}
    </div>
  )
}
```

### Step 7: Export Component from Barrel

```typescript
// components/index.ts
export { MyFeatureWidget } from './MyFeatureWidget'
```

### Step 8: Create Public API

```typescript
// index.ts
import dynamic from 'next/dynamic'

export type { MyFeatureConfig } from './types'
export { useIsMyFeatureEnabled } from './hooks'

const MyFeatureWidget = dynamic(
  () => import('./components/MyFeatureWidget').then((mod) => ({ default: mod.MyFeatureWidget })),
  { ssr: false },
)

export default MyFeatureWidget
```

## Migration Guide

### Step 1: Assess Current State

Check what's missing against the standard structure:

| Required                         | Check                              |
| -------------------------------- | ---------------------------------- |
| `index.ts`                       | Feature root barrel file           |
| `types.ts`                       | All TypeScript interfaces          |
| `constants.ts`                   | Feature constants                  |
| `components/index.ts`            | Component barrel file              |
| `hooks/index.ts`                 | Hook barrel file                   |
| `hooks/useIs{Feature}Enabled.ts` | Feature flag hook                  |
| `services/index.ts`              | Service barrel (if services exist) |
| `store/index.ts`                 | Store barrel (if store exists)     |

### Step 2: Create Missing Files

Add barrel files and required hooks.

### Step 3: Extract Types

Move all interfaces to `types.ts`.

### Step 4: Relocate Store

If store is inside component directory, move to feature's `store/` directory.

### Step 5: Update External Imports

Find all imports to feature internals and update to use public API.

### Step 6: Verify

```bash
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web test
```

## ESLint Enforcement

The codebase uses ESLint's `no-restricted-imports` rule to enforce feature architecture compliance.

### Current Configuration

```javascript
// apps/web/eslint.config.mjs
'no-restricted-imports': [
  'warn', // Will change to 'error' after migration
  {
    patterns: [
      {
        group: [
          '@/features/*/components/*',
          '@/features/*/hooks/*',
          '@/features/*/services/*',
          '@/features/*/store/*',
        ],
        message: 'Import from feature index file only.',
      },
    ],
  },
]
```

### Migration Strategy

1. **During Migration**: Rule is set to `'warn'` - violations show warnings but don't fail builds
2. **After Migration**: Rule changes to `'error'` - violations fail builds

## Bundle Verification

Verify that features are properly code-split:

### Build and Analyze

```bash
yarn workspace @safe-global/web build
```

### Check Chunks

Look in `.next/static/chunks/` for feature-specific chunks:

```bash
ls -la apps/web/.next/static/chunks/ | grep -i feature
```

Each feature should have its own chunk file, indicating proper code splitting.

### Bundle Analysis (Optional)

For detailed analysis, use `@next/bundle-analyzer`:

```bash
ANALYZE=true yarn workspace @safe-global/web build
```

## Checklist

Use this checklist when creating or reviewing features:

### Structure

- [ ] Feature directory uses kebab-case
- [ ] `index.ts` exists at feature root
- [ ] `types.ts` exists with all interfaces
- [ ] `constants.ts` exists
- [ ] `components/index.ts` exists
- [ ] `hooks/index.ts` exists
- [ ] `services/index.ts` exists (if services present)
- [ ] `store/index.ts` exists (if store present)

### Feature Flag

- [ ] Feature has entry in `FEATURES` enum
- [ ] `useIs{FeatureName}Enabled` hook exists
- [ ] Main component checks feature flag
- [ ] Component renders `null` when disabled

### Lazy Loading

- [ ] Main component uses `dynamic()` import
- [ ] `{ ssr: false }` set for browser-only features
- [ ] No static imports from outside the feature

### Isolation

- [ ] No external imports to feature internals
- [ ] Shared code extracted to `src/utils/` or `src/hooks/`
- [ ] Cross-feature communication via Redux or services

### Verification

- [ ] `yarn lint` passes (no restricted import warnings)
- [ ] `yarn type-check` passes
- [ ] `yarn test` passes
- [ ] `yarn build` succeeds
- [ ] Feature chunk exists in build output

## TypeScript Interface Examples

### Feature Types File

```typescript
// types.ts

/**
 * Configuration for the feature
 */
export interface MyFeatureConfig {
  enabled: boolean
  options?: MyFeatureOptions
}

/**
 * Feature options
 */
export interface MyFeatureOptions {
  mode: 'basic' | 'advanced'
  timeout?: number
}

/**
 * Feature state (if using Redux)
 */
export interface MyFeatureState {
  status: 'idle' | 'loading' | 'success' | 'error'
  data: MyFeatureData | null
  error: string | null
}

/**
 * Feature data structure
 */
export interface MyFeatureData {
  id: string
  name: string
  createdAt: Date
}

/**
 * Feature event types
 */
export type MyFeatureEventType = 'initialized' | 'updated' | 'completed' | 'error'

/**
 * Feature event payload
 */
export interface MyFeatureEvent {
  type: MyFeatureEventType
  payload?: unknown
  timestamp: number
}
```

## Reference Implementation

See `src/features/walletconnect/` for a complete reference implementation of this architecture.
