# Feature Architecture Quickstart

**Date**: 2026-01-08
**Feature**: 001-feature-architecture

This guide explains how to create a new feature or migrate an existing one to the standard feature architecture.

---

## Table of Contents

1. [Creating a New Feature](#creating-a-new-feature)
2. [Migrating an Existing Feature](#migrating-an-existing-feature)
3. [Feature Checklist](#feature-checklist)
4. [Code Examples](#code-examples)
5. [Common Mistakes](#common-mistakes)

---

## Creating a New Feature

### Step 1: Create Directory Structure

```bash
mkdir -p apps/web/src/features/{feature-name}/{components,hooks,services,store}
```

### Step 2: Create Required Files

```bash
touch apps/web/src/features/{feature-name}/index.ts
touch apps/web/src/features/{feature-name}/types.ts
touch apps/web/src/features/{feature-name}/constants.ts
touch apps/web/src/features/{feature-name}/components/index.ts
touch apps/web/src/features/{feature-name}/hooks/index.ts
touch apps/web/src/features/{feature-name}/hooks/useIs{FeatureName}Enabled.ts
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

### Step 5: Create Main Component

```typescript
// components/MyFeatureWidget/index.tsx
import type { ReactElement } from 'react'
import { useIsMyFeatureEnabled } from '../../hooks'

export function MyFeatureWidget(): ReactElement | null {
  const isEnabled = useIsMyFeatureEnabled()

  // Don't render anything if disabled or loading
  if (!isEnabled) return null

  return (
    <div>
      {/* Feature content */}
    </div>
  )
}
```

### Step 6: Create Public API (index.ts)

```typescript
// index.ts
import dynamic from 'next/dynamic'

// Lazy-loaded main component
const MyFeatureWidget = dynamic(
  () => import('./components/MyFeatureWidget').then((mod) => ({ default: mod.MyFeatureWidget })),
  { ssr: false },
)

// Re-export types
export type { MyFeatureConfig, MyFeatureState } from './types'

// Re-export feature flag hook
export { useIsMyFeatureEnabled } from './hooks'

// Default export
export default MyFeatureWidget
```

---

## Migrating an Existing Feature

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

### Step 2: Create Missing Barrel Files

Add `index.ts` files that re-export public APIs:

```typescript
// components/index.ts
export { MyComponent } from './MyComponent'
export { AnotherComponent } from './AnotherComponent'

// hooks/index.ts
export { useIsFeatureEnabled } from './useIsFeatureEnabled'
export { useFeatureHook } from './useFeatureHook'

// services/index.ts
export { FeatureService } from './FeatureService'
```

### Step 3: Create types.ts

Extract all interfaces/types from component files:

```typescript
// types.ts
export interface FeatureConfig {
  // ...
}

export interface FeatureState {
  // ...
}

export type FeatureEventType = 'connect' | 'disconnect' | 'error'
```

### Step 4: Create Feature Flag Hook

```typescript
// hooks/useIs{FeatureName}Enabled.ts
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIs{FeatureName}Enabled(): boolean | undefined {
  return useHasFeature(FEATURES.{FEATURE_FLAG})
}
```

### Step 5: Create Root index.ts

```typescript
// index.ts
import dynamic from 'next/dynamic'

const FeatureWidget = dynamic(() => import('./components/FeatureWidget'), {
  ssr: false,
})

export type { FeatureConfig, FeatureState } from './types'
export { useIsFeatureEnabled } from './hooks'
export default FeatureWidget
```

### Step 6: Update External Imports

Find all imports to feature internals and update to use the public API:

```typescript
// Before (invalid)
import { WcInput } from '@/features/walletconnect/components/WcInput'

// After (valid)
import WalletConnect, { useIsWalletConnectEnabled } from '@/features/walletconnect'
```

### Step 7: Run ESLint to Verify

```bash
yarn workspace @safe-global/web lint
```

ESLint will warn on any remaining internal imports.

---

## Feature Checklist

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

---

## Code Examples

### Complete Feature Index File

```typescript
// apps/web/src/features/my-feature/index.ts
import dynamic from 'next/dynamic'

// Types (tree-shakeable)
export type { MyFeatureConfig, MyFeatureState, MyFeatureEvent } from './types'

// Feature flag hook (required)
export { useIsMyFeatureEnabled } from './hooks'

// Store selectors (if feature has Redux state)
export { selectMyFeatureState, selectMyFeatureStatus } from './store'

// Constants (if needed externally)
export { MY_FEATURE_EVENTS } from './constants'

// Lazy-loaded component (default export)
const MyFeatureWidget = dynamic(() => import('./components/MyFeatureWidget'), { ssr: false })

export default MyFeatureWidget
```

### Feature Flag Hook

```typescript
// apps/web/src/features/my-feature/hooks/useIsMyFeatureEnabled.ts
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsMyFeatureEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.MY_FEATURE)
}
```

### Component with Feature Flag Check

```typescript
// apps/web/src/features/my-feature/components/MyFeatureWidget/index.tsx
import type { ReactElement } from 'react'
import { useIsMyFeatureEnabled } from '../../hooks'

export function MyFeatureWidget(): ReactElement | null {
  const isEnabled = useIsMyFeatureEnabled()

  // Return nothing while loading or disabled
  if (isEnabled !== true) return null

  return (
    <div data-testid="my-feature-widget">
      {/* Feature UI */}
    </div>
  )
}
```

### Using a Feature from Outside

```typescript
// apps/web/src/pages/my-page.tsx
import dynamic from 'next/dynamic'
import { useIsMyFeatureEnabled } from '@/features/my-feature'

const MyFeature = dynamic(() => import('@/features/my-feature'), { ssr: false })

export default function MyPage() {
  const isEnabled = useIsMyFeatureEnabled()

  return (
    <main>
      <h1>My Page</h1>
      {isEnabled && <MyFeature />}
    </main>
  )
}
```

---

## Common Mistakes

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
// WRONG - no feature flag check
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

---

## Next Steps

After creating/migrating a feature:

1. Run `yarn workspace @safe-global/web lint` to check for violations
2. Run `yarn workspace @safe-global/web type-check` to verify types
3. Run `yarn workspace @safe-global/web test` to ensure tests pass
4. Run `yarn workspace @safe-global/web build` to verify bundle splitting
