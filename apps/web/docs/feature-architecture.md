# Feature Architecture Standard

This document defines the architecture pattern for features in the Safe{Wallet} web application. All features must follow this pattern to ensure consistency, maintainability, and proper isolation.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Feature Contract](#feature-contract)
- [Feature Handles](#feature-handles)
- [Helper: createFeatureHandle](#helper-createfeaturehandle)
- [Reducing Boilerplate with typeof Pattern](#reducing-boilerplate-with-typeof-pattern)
- [Folder Structure](#folder-structure)
- [Feature Flag Pattern](#feature-flag-pattern)
- [Lazy Loading Pattern](#lazy-loading-pattern)
- [Public API Pattern](#public-api-pattern)
- [Cross-Feature Communication](#cross-feature-communication)
- [Common Mistakes & Anti-Patterns](#common-mistakes--anti-patterns)
- [Testing Strategy](#testing-strategy)
- [ESLint Enforcement](#eslint-enforcement)
- [Bundle Verification](#bundle-verification)
- [Feature Creation Guide](#feature-creation-guide)
- [Migration Guide](#migration-guide)
- [Checklist](#checklist)
- [FAQ](#faq)

## Overview

A **feature** is a self-contained domain module that:

- Resides in its own directory under `src/features/{feature-name}/`
- Implements a typed **Feature Contract** interface
- Exports a **Feature Handle** for lazy loading
- Has explicit **public API** enforced via ESLint (only `index.ts` exports)
- Communicates with other features via **Redux** (data) or direct imports of feature handles
- Has no side effects when its feature flag is disabled

### Key Principles

1. **Contract-First**: Every feature defines what it exposes through a typed contract
2. **Isolation**: Features don't import each other's internals
3. **Lazy Loading**: Features are loaded on-demand via handles with `useLoadFeature()`
4. **Feature Flags**: Features can be disabled per chain without loading their code
5. **Type Safety**: Direct handle imports provide full type inference

### Problems This Architecture Solves

| Problem                         | Solution                                                 |
| ------------------------------- | -------------------------------------------------------- |
| Tight coupling between features | Feature handles with lazy loading                        |
| Unclear boundaries              | Feature Contract defines exactly what's public           |
| Testing difficulties            | Module-level cache can be cleared; handles can be mocked |
| Excessive boilerplate           | Helper functions simplify common patterns                |
| Bundle size                     | Lazy loading ensures disabled features aren't bundled    |

## Core Concepts

### What is a Feature Contract?

A **Feature Contract** is a TypeScript interface that explicitly declares what a feature exposes to the outside world. Think of it as the feature's "API surface".

### What is a Feature Handle?

A **Feature Handle** is a tiny object (~100 bytes) that contains:

- The feature name
- A `useIsEnabled()` hook for flag checking
- A `load()` function that lazily imports the full implementation

### Feature Handles: Static + Lazy

Each feature exposes a **handle** with two parts:

| Part             | Bundled?   | Purpose                                    |
| ---------------- | ---------- | ------------------------------------------ |
| `useIsEnabled()` | Yes (tiny) | Flag check via `useHasFeature(FEATURES.X)` |
| Feature exports  | No (lazy)  | Actual feature code, loaded on demand      |

The `useLoadFeature()` hook combines flag check + lazy loading in one step:

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

function MyPage() {
  const wc = useLoadFeature(WalletConnectFeature)

  // No null checks needed! Always returns an object.
  // Hooks return {} when not ready (safe destructuring), components render null.
  const uri = wc.useWcUri()

  return <wc.WalletConnectWidget />
}

// If you need explicit loading/disabled handling:
function MyPageWithStates() {
  const wc = useLoadFeature(WalletConnectFeature)

  if (wc.$isLoading) return <Skeleton />
  if (wc.$isDisabled) return null

  return <wc.WalletConnectWidget />
}
```

### Proxy-Based Stubs

`useLoadFeature()` **always returns an object** - never `null` or `undefined`. When the feature is loading or disabled, it returns a Proxy that provides automatic stubs based on naming conventions:

| Naming Pattern              | Type      | Stub Behavior                     |
| --------------------------- | --------- | --------------------------------- |
| `useSomething`              | Hook      | Returns `{}` (empty object)       |
| `PascalCase` (not `use...`) | Component | Renders `null`                    |
| `camelCase` (not `use...`)  | Service   | Property is `undefined` (no stub) |

**Why `{}` for hooks?** Allows safe destructuring: `const { data } = feature.useMyHook()` won't throw when not ready (individual values will be `undefined`).

**Why `undefined` for services?** The service property is `undefined` when not ready (no stub function). Attempting to call it throws `TypeError: X is not a function`. This catches developer mistakes when they forget to check `$isReady` before calling a service. Components and hooks can safely "do nothing" when not ready, but services typically have side effects that shouldn't silently fail.

**Meta properties** (prefixed with `$`) provide state information:

| Property      | Type      | Description                          |
| ------------- | --------- | ------------------------------------ |
| `$isLoading`  | `boolean` | `true` while feature code is loading |
| `$isDisabled` | `boolean` | `true` if feature flag is off        |
| `$isReady`    | `boolean` | `true` when loaded and enabled       |
| `$error`      | `Error?`  | Error if loading failed              |

### Why Proxy-Based Stubs?

This design solves two problems:

1. **No optional chaining** - Eliminates `feature?.hooks.useX() ?? default` patterns that increase cyclomatic complexity
2. **React hooks rules** - Hooks are always called unconditionally (stubs return defaults when not ready)

```typescript
// ❌ OLD: Optional chaining + null checks (complexity, rules violation)
const feature = useLoadFeature(MyFeature)
const show = feature?.hooks.useShowBanner() ?? false  // Conditional hook call!
if (!feature) return null
return <feature.components.Banner />

// ✅ NEW: Always callable, no optional chaining
const feature = useLoadFeature(MyFeature)
const show = feature.useShowBanner()  // Always called, returns {} if not ready
return <feature.Banner />              // Always renders, returns null if not ready
```

### The Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CONSUMER imports feature handle (static, tiny ~100 bytes)   │
│    import { WalletConnectFeature } from '@/features/walletconnect'│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONSUMER calls useLoadFeature (flag check + lazy load)      │
│    const wc = useLoadFeature(WalletConnectFeature)             │
│    // ALWAYS returns object (Proxy stubs when not ready)       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │ $isLoading│  │$isDisabled│  │  $isReady │
        │   true    │  │   true    │  │   true    │
        └───────────┘  └───────────┘  └───────────┘
              │               │               │
              ▼               ▼               ▼
        Proxy stubs     Proxy stubs     Real impl
        (hooks→undef)   (hooks→undef)   (full feature)
        (comps→null)    (comps→null)
```

## Feature Contract

Every feature MUST export a contract type that defines its public API.

### Contract Interface

Feature contracts use a **flat structure** - no nested `components`, `hooks`, or `services` categories. Naming conventions distinguish types:

```typescript
// src/features/__core__/types.ts

/**
 * Base feature implementation type.
 * Uses flat structure with naming conventions:
 * - useSomething → hook (stub returns {})
 * - PascalCase → component (stub renders null)
 * - camelCase → service/function (undefined, no stub)
 */
export type FeatureImplementation = Record<string, unknown>

/**
 * Meta properties added by useLoadFeature ($ prefix)
 */
export interface FeatureMeta {
  /** True while feature code is loading */
  $isLoading: boolean
  /** True if feature flag is disabled */
  $isDisabled: boolean
  /** True when feature is loaded and enabled */
  $isReady: boolean
  /** Error if loading failed */
  $error: Error | null
}

/**
 * Result type from useLoadFeature - always an object, never null
 */
export type FeatureResult<T> = T & FeatureMeta
```

### Type Inference

When calling `useLoadFeature()`, types are automatically inferred from the handle:

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

// Type is automatically inferred from WalletConnectFeature
const walletConnect = useLoadFeature(WalletConnectFeature)
```

Benefits of this approach:

1. **Automatic inference**: No need to specify the type explicitly
2. **IDE navigation**: Cmd+click on `WalletConnectFeature` jumps to the handle definition
3. **Explicit dependencies**: The import makes it obvious which feature the consumer depends on
4. **No string lookups**: Direct import instead of magic strings

### IDE Navigation (Jump-to-Definition)

With direct feature handle imports, IDE navigation works naturally:

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
//       ^^^^^^^^^^^^^^^^^^^^
//       Cmd+click jumps to handle definition in index.ts
```

**IMPORTANT: Always use `typeof` pattern in contracts for IDE navigation.**

For navigating to implementation details from contracts, use `typeof` imports. This enables Cmd+click to jump directly to the implementation:

```typescript
// contract.ts
import type MyComponent from './components/MyComponent'
import type AnotherComponent from './components/AnotherComponent'
import type { useMyHook } from './hooks/useMyHook'
import type { myService } from './services/myService'

// Flat structure - no nested categories
export interface MyFeatureContract {
  // Components (PascalCase)
  MyComponent: typeof MyComponent
  AnotherComponent: typeof AnotherComponent

  // Hooks (useSomething)
  useMyHook: typeof useMyHook

  // Services (camelCase)
  myService: typeof myService
}
```

**Why this matters:**

- **IDE Navigation**: `typeof` creates a direct link to the implementation file
- **Type Safety**: Automatically keeps the contract in sync with implementation changes
- **Refactoring**: Renaming/moving files updates the type automatically
- **Developer Experience**: Cmd+click takes you directly to the source

**Anti-patterns to avoid:**

```typescript
// ❌ WRONG: Generic ComponentType loses IDE navigation
import type { ComponentType } from 'react'
export interface BadContract {
  MyComponent: ComponentType // Can't jump to definition
}

// ❌ WRONG: Manual type annotation requires maintenance
export interface BadContract {
  MyComponent: React.FC<{ prop: string }> // Must update manually when props change
}

// ❌ WRONG: Nested structure (old pattern)
export interface OldContract {
  components: { MyComponent: typeof MyComponent } // Don't nest!
  hooks: { useMyHook: typeof useMyHook } // Don't nest!
}
```

### Example Contracts

**Minimal Feature Contract (component only):**

```typescript
// src/features/bridge/contract.ts
import type Bridge from './components/Bridge'
import type BridgeWidget from './components/BridgeWidget'

// Flat structure - no nested categories
export interface BridgeContract {
  Bridge: typeof Bridge
  BridgeWidget: typeof BridgeWidget
}
```

**Standard Feature Contract (with hooks):**

```typescript
// src/features/multichain/contract.ts
import type CreateSafeOnNewChain from './components/CreateSafeOnNewChain'
import type NetworkLogosList from './components/NetworkLogosList'
import type { useIsMultichainSafe } from './hooks/useIsMultichainSafe'
import type { useSafeCreationData } from './hooks/useSafeCreationData'

// Flat structure - naming conventions distinguish types
export interface MultichainContract {
  // Components (PascalCase) - stub renders null
  CreateSafeOnNewChain: typeof CreateSafeOnNewChain
  NetworkLogosList: typeof NetworkLogosList

  // Hooks (useSomething) - stub returns {}
  useIsMultichainSafe: typeof useIsMultichainSafe
  useSafeCreationData: typeof useSafeCreationData
}
```

**Full Feature Contract (with services):**

```typescript
// src/features/walletconnect/contract.ts
import type WalletConnectWidget from './components/WalletConnectWidget'
import type WcSessionManager from './components/WcSessionManager'
import type { useWcUri } from './hooks/useWcUri'
import type { useWalletConnectSearchParamUri } from './hooks/useWalletConnectSearchParamUri'
import type WalletConnectWallet from './services/WalletConnectWallet'
import type { wcPopupStore } from './store/wcPopupStore'

// Flat structure - all exports at top level
export interface WalletConnectContract {
  // Components (PascalCase)
  WalletConnectWidget: typeof WalletConnectWidget
  WcSessionManager: typeof WcSessionManager

  // Hooks (useSomething)
  useWcUri: typeof useWcUri
  useWalletConnectSearchParamUri: typeof useWalletConnectSearchParamUri

  // Services (camelCase)
  walletConnectInstance: WalletConnectWallet
  wcPopupStore: typeof wcPopupStore
}
```

## Feature Handles

Features are loaded lazily via handles and the `useLoadFeature()` hook.

### useLoadFeature Implementation

The `useLoadFeature()` hook provides:

- Feature flag checking via `handle.useIsEnabled()`
- Lazy loading of the full implementation
- **Proxy-based stubs** when loading or disabled (always returns an object)
- Module-level caching with `useSyncExternalStore` for reactivity

```typescript
// src/features/__core__/useLoadFeature.ts
import { useEffect, useSyncExternalStore } from 'react'
import type { FeatureHandle, FeatureImplementation, FeatureMeta } from './types'

// Module-level cache shared across all components
const cache = new Map<string, unknown>()
const loading = new Set<string>()
const subscribers = new Set<() => void>()

/**
 * Creates a Proxy that returns stubs based on naming conventions:
 * - useSomething → returns {} (hook stub, safe for destructuring)
 * - PascalCase → returns () => null (component stub)
 * - camelCase → returns () => {} (service stub)
 */
function createFeatureProxy<T>(meta: FeatureMeta, impl?: T): T & FeatureMeta {
  return new Proxy({} as T & FeatureMeta, {
    get(_, prop: string) {
      // Meta properties ($ prefix)
      if (prop === '$isLoading') return meta.$isLoading
      if (prop === '$isDisabled') return meta.$isDisabled
      if (prop === '$isReady') return meta.$isReady
      if (prop === '$error') return meta.$error

      // If ready, return actual implementation
      if (meta.$isReady && impl && prop in impl) {
        return (impl as Record<string, unknown>)[prop]
      }

      // Otherwise return stub based on naming convention
      if (prop.startsWith('use')) {
        // Hook stub - return function that returns {} (safe destructuring)
        return () => ({})
      }
      if (prop[0] === prop[0].toUpperCase() && prop[0] !== '$') {
        // Component stub - return component that renders null
        return () => null
      }
      // Service - no stub, property is undefined (check $isReady before calling)
      return undefined
    },
  })
}

export function useLoadFeature<T extends FeatureImplementation>(handle: FeatureHandle<T>): T & FeatureMeta {
  const isEnabled = handle.useIsEnabled()

  const cached = useSyncExternalStore(
    subscribe,
    () => getSnapshot(handle.name),
    () => getSnapshot(handle.name),
  )

  useEffect(() => {
    if (isEnabled !== true || cached || loading.has(handle.name)) return

    loading.add(handle.name)
    handle.load().then((module) => {
      cache.set(handle.name, module.default)
      loading.delete(handle.name)
      notifySubscribers()
    })
  }, [isEnabled, cached, handle])

  // Build meta state
  const meta: FeatureMeta = {
    $isLoading: isEnabled === true && !cached && loading.has(handle.name),
    $isDisabled: isEnabled === false,
    $isReady: isEnabled === true && !!cached,
    $error: null,
  }

  // Always return proxy - never null
  return createFeatureProxy(meta, cached as T | undefined)
}
```

### Feature Handle Definition

```typescript
// src/features/walletconnect/handle.ts
// This file is SMALL (~100 bytes) - only flag lookup + lazy import
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeatureHandle } from '@/features/__core__'
import type { WalletConnectImplementation } from './contract'

export const walletConnectHandle: FeatureHandle<WalletConnectImplementation> = {
  name: 'walletconnect',

  // STATIC: Just a flag lookup, no heavy imports
  useIsEnabled: () => useHasFeature(FEATURES.NATIVE_WALLETCONNECT),

  // LAZY: Loads the full feature only when enabled + accessed
  load: () => import('./feature'),
}
```

### Feature Public API (index.ts)

```typescript
// src/features/walletconnect/index.ts
// Export the handle as {FeatureName}Feature for use with useLoadFeature()
export { walletConnectHandle as WalletConnectFeature } from './handle'
export type { WalletConnectContract } from './contract'
```

### Feature Consumption

```typescript
// src/components/common/Header/index.tsx
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

function Header() {
  const wc = useLoadFeature(WalletConnectFeature)

  // No null check needed - always returns an object
  // Component renders null when not ready (via Proxy stub)
  return <wc.WalletConnectWidget />
}

// With explicit loading/disabled handling:
function HeaderWithStates() {
  const wc = useLoadFeature(WalletConnectFeature)

  if (wc.$isLoading) return <Skeleton />
  if (wc.$isDisabled) return null

  return <wc.WalletConnectWidget />
}
```

## Helper: createFeatureHandle

The `createFeatureHandle` function simplifies creating feature handles by auto-deriving feature flags from folder names.

```typescript
import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'

// Auto-derive feature flag from folder name
export const BridgeFeature = createFeatureHandle('bridge')
// Creates handle with FEATURES.BRIDGE

// Override when flag doesn't match folder name
export const WalletConnectFeature = createFeatureHandle('walletconnect', FEATURES.NATIVE_WALLETCONNECT)
```

**Auto-derivation rules:**

- `bridge` → `FEATURES.BRIDGE`
- `tx-notes` → `FEATURES.TX_NOTES`
- `wallet-connect` → `FEATURES.WALLET_CONNECT`

**Benefits:**

- Reduces boilerplate (one line vs manual handle definition)
- Prevents typos in feature flag names
- Provides type inference for the handle

**When to use explicit flag:**

- When the feature flag doesn't follow folder name convention
- Example: `walletconnect` folder uses `FEATURES.NATIVE_WALLETCONNECT`

## Reducing Boilerplate with typeof Pattern

You can further reduce boilerplate by using TypeScript's `typeof` operator to infer types from implementation instead of manually defining contract interfaces.

### The Pattern

**Traditional approach (4 files):**

```typescript
// contract.ts
import type MyComponent from './components/MyComponent'
import type { useMyHook } from './hooks/useMyHook'

export interface MyFeatureContract {
  MyComponent: typeof MyComponent
  useMyHook: typeof useMyHook
}

// handle.ts
export const MyFeatureHandle: FeatureHandle<MyFeatureContract> = {
  name: 'my-feature',
  useIsEnabled: () => useHasFeature(FEATURES.MY_FEATURE),
  load: () => import('./feature'),
}

// feature.ts
import MyComponent from './components/MyComponent'
import { useMyHook } from './hooks/useMyHook'

export default { MyComponent, useMyHook } satisfies MyFeatureContract

// index.ts
export { MyFeatureHandle } from './handle'
export type { MyFeatureContract } from './contract'
```

**Simplified approach (3 files - use factory):**

```typescript
// contract.ts - KEEP THIS
import type MyComponent from './components/MyComponent'
import type { useMyHook } from './hooks/useMyHook'

export interface MyFeatureContract {
  MyComponent: typeof MyComponent
  useMyHook: typeof useMyHook
}

// feature.ts
import MyComponent from './components/MyComponent'
import { useMyHook } from './hooks/useMyHook'

export default { MyComponent, useMyHook } satisfies MyFeatureContract

// index.ts - Use factory, no handle.ts needed!
import { createFeatureHandle } from '@/features/__core__'
import type { MyFeatureContract } from './contract'

export const MyFeature = createFeatureHandle<MyFeatureContract>('my-feature')
export type * from './types'
```

**Reduction: 4 files → 3 files (removes handle.ts, ~15 lines saved)**

### Bundle Size Caveat

**The typeof pattern with dynamic imports can cause bundle bloat!**

While TypeScript types are normally compile-time only, using `import type ... from './feature'` with `typeof` can confuse bundlers:

```typescript
// ❌ DANGEROUS - Can bundle feature code in main chunk!
import type featureImpl from './feature'
export const MyFeature = createFeatureHandle<typeof featureImpl>('my-feature')
```

**Why this happens:**

- Bundlers may not distinguish `import type` from regular imports when analyzing dependencies
- The `./feature` module gets included in the main bundle instead of code-split
- Feature code loads eagerly instead of lazily

**✅ SAFE: Use manual contract types instead:**

```typescript
// contract.ts - Manual but safe (flat structure)
import type MyComponent from './components/MyComponent'

export interface MyFeatureContract {
  MyComponent: typeof MyComponent
}

// index.ts - Uses contract type
import { createFeatureHandle } from '@/features/__core__'
import type { MyFeatureContract } from './contract'

export const MyFeature = createFeatureHandle<MyFeatureContract>('my-feature')
```

**Recommended approach:**

- Delete `handle.ts` (use `createFeatureHandle` factory)
- Keep `contract.ts` with manual types (prevents bundle bloat)
- Result: 3 files instead of 4, safe lazy loading

### Type Safety Preserved

Full type inference and autocomplete still work:

```typescript
const feature = useLoadFeature(MyFeature)
//    ^? {
//      MyComponent: ComponentType<...>,
//      useMyHook: () => ...,
//      $isLoading: boolean,
//      $isDisabled: boolean,
//      $isReady: boolean,
//    }

// No null check needed - always an object
feature.MyComponent // ✅ Full autocomplete (stub when not ready)
feature.useMyHook() // ✅ Type-safe (returns {} when not ready)
```

### Benefits

- ✅ **Less boilerplate**: Eliminates handle.ts (~15 lines saved per feature)
- ✅ **Convention-based**: Auto-derives feature flags from folder names
- ✅ **Zero bundle cost**: TypeScript types don't affect bundle size
- ✅ **Type-safe**: Full type checking and IDE autocomplete preserved
- ✅ **Safe lazy loading**: Proper code-splitting maintained

### Comparison

| Aspect          | Traditional (4 files)                           | Balanced (3 files)                  |
| --------------- | ----------------------------------------------- | ----------------------------------- |
| Files           | handle.ts + contract.ts + feature.ts + index.ts | contract.ts + feature.ts + index.ts |
| Lines           | ~100 lines                                      | ~85 lines                           |
| Handle creation | Manual (15 lines)                               | Factory (1 line)                    |
| Type safety     | ✅ Full                                         | ✅ Full                             |
| Bundle safety   | ✅ Safe                                         | ✅ Safe                             |
| IDE navigation  | ✅ Direct                                       | ✅ Direct                           |

### Recommendation

**Always use the balanced approach:**

✅ **DO:**

- Use `createFeatureHandle<ContractType>()` factory (eliminates handle.ts)
- Keep manual `contract.ts` with type definitions (safe lazy loading)
- Use `typeof` for individual exports in contract (e.g., `typeof MyComponent`)

❌ **DON'T:**

- Use `import type featureImpl from './feature'` with `typeof featureImpl` (bundles feature code)
- Try to infer types from the full feature module (bundler confusion)

**Result:** 3 files (index, contract, feature) instead of 4, safe and minimal.

## Folder Structure

Features can be organized based on their complexity:

### Simple Features

For straightforward features with minimal logic:

```
src/features/bridge/
├── index.ts              # Public API exports
├── contract.ts           # Feature contract type
├── feature.ts            # Implementation exports
└── Bridge.tsx            # Implementation
```

### Standard Features

For features with multiple components and hooks:

```
src/features/multichain/
├── index.ts              # Public API exports
├── contract.ts           # Feature contract type
├── feature.ts            # Implementation exports
├── types.ts              # Public types
├── constants.ts          # Feature constants
├── components/
│   ├── CreateSafeOnNewChain/
│   └── NetworkLogosList/
└── hooks/
    ├── useIsMultichainSafe.ts
    └── useSafeCreationData.ts
```

### Complex Features

For features with multiple components, hooks, services, and store:

```
src/features/walletconnect/
├── index.ts              # Public API exports
├── contract.ts           # Feature contract type
├── feature.ts            # Implementation exports
├── types.ts              # Public types
├── constants.ts          # Feature constants
├── components/           # (ESLint blocks external imports)
│   ├── WalletConnectWidget/
│   └── WcSessionManager/
├── hooks/
│   ├── useWcUri.ts
│   └── index.ts
├── services/
│   ├── walletConnectService.ts
│   └── sessionManager.ts
└── store/
    ├── wcSlice.ts
    └── selectors.ts
```

**Key points:**

- Structure adapts to feature needs
- ESLint enforces that external code can only import from `index.ts` and `types.ts`
- Internal folders (components/, hooks/, services/) are implementation details

## Feature Flag Pattern

Every feature MUST be associated with a feature flag that can be checked to determine if the feature is enabled.

### Feature Flag Hook (within handle)

```typescript
// Within the handle definition
useIsEnabled: () => useHasFeature(FEATURES.NATIVE_WALLETCONNECT)
```

Or when using `createFeatureHandle`:

```typescript
// Auto-derived from folder name
export const BridgeFeature = createFeatureHandle('bridge')
// Creates handle that checks FEATURES.BRIDGE

// Or explicit flag
export const WalletConnectFeature = createFeatureHandle('walletconnect', FEATURES.NATIVE_WALLETCONNECT)
```

### Return Values

| Value       | Meaning                               | Behavior                |
| ----------- | ------------------------------------- | ----------------------- |
| `undefined` | Loading (chain config not yet loaded) | `$isLoading` is true    |
| `false`     | Feature disabled for current chain    | `$isDisabled` is true   |
| `true`      | Feature enabled                       | `$isReady` becomes true |

### Adding a New Feature Flag

1. Add to `FEATURES` enum in `packages/utils/src/utils/chains.ts`:

```typescript
export enum FEATURES {
  // ... existing features
  MY_NEW_FEATURE = 'MY_NEW_FEATURE',
}
```

2. Configure in CGW API chain configs (coordinate with backend team)

## Lazy Loading Pattern

### One Dynamic Import Per Feature

**The core principle: ONE dynamic import per feature.**

When you use `createFeatureHandle`, it sets up:

```typescript
load: () => import('./feature') // This is THE lazy load
```

**Inside `feature.ts`, use direct imports with a flat structure:**

```typescript
// feature.ts - This entire file IS the lazy-loaded chunk
import MyComponent from './components/MyComponent'
import AnotherComponent from './components/AnotherComponent'
import { useMyHook } from './hooks/useMyHook'
import { myService } from './services/myService'

export default {
  // Flat structure - no nested categories
  MyComponent, // PascalCase → component (stub renders null)
  AnotherComponent, // PascalCase → component (stub renders null)
  useMyHook, // useSomething → hook (stub returns {})
  myService, // camelCase → service (stub is no-op)
}
```

**Naming conventions determine stub behavior:**

- `useSomething` → Hook → stub returns `{}` (safe destructuring)
- `PascalCase` → Component → stub renders `null`
- `camelCase` → Service/function → `undefined` (no stub - check `$isReady` before calling)

### Anti-Pattern: Multiple lazy() Calls Inside feature.ts

```typescript
// ❌ WRONG: Don't do this!
import { lazy } from 'react'

export default {
  // ❌ Unnecessary - feature.ts is already lazy-loaded
  MyComponent: lazy(() => import('./components/MyComponent')),
  AnotherComponent: lazy(() => import('./components/AnotherComponent')),
}
```

This creates unnecessary complexity:

- Multiple network requests instead of one
- Each component becomes a separate chunk
- Adds Suspense boundaries everywhere
- Makes debugging harder

### Rare Exception: Giant Internal Dependencies

The ONLY time to use `lazy()` inside `feature.ts` is when you have a giant internal dependency (e.g., a chart library, PDF renderer) that's only needed on one specific page within the feature:

```typescript
// feature.ts - Rare exception for giant sub-dependency
import RegularComponent from './components/RegularComponent'
import { useMyHook } from './hooks/useMyHook'
import { withSuspense } from '@/features/__core__'
import { lazy } from 'react'

export default {
  RegularComponent, // ✅ Direct - loads with feature
  useMyHook, // ✅ Direct - loads with feature

  // Exception: 500KB chart component only used on analytics page
  HeavyChartComponent: withSuspense(lazy(() => import('./components/HeavyChartComponent'))),
}
```

**When in doubt, use direct imports.** If you're not sure whether something qualifies as a "giant internal dependency," it probably doesn't.

### Benefits of This Pattern

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

const wc = useLoadFeature(WalletConnectFeature)

// Always callable - no optional chaining
const uri = wc.useWcUri()
return <wc.WalletConnectWidget />
```

Benefits:

- **No optional chaining**: Proxy stubs eliminate `?.` complexity
- **React hooks compliant**: Hooks always called unconditionally
- **Type-safe**: Full TypeScript inference from the handle
- **Simple API**: Always returns an object, use `$isReady`/`$isLoading`/`$isDisabled` for state
- **Flat structure**: No nested `.components.` or `.hooks.` - just `feature.MyComponent`
- **IDE-friendly**: Cmd+click on `WalletConnectFeature` jumps to the handle definition
- **Tree-shakeable**: Unused features won't be bundled
- **No boilerplate**: No context providers, no string lookups
- **Testable**: Just mock the feature module with Jest

## Public API Pattern

Each feature exposes exactly three things:

1. **Feature handle**: For use with `useLoadFeature()` (static flag + lazy refs)
2. **Contract type**: TypeScript interface for type safety
3. **Public types** (optional): Types needed by consumers

### index.ts Template

```typescript
// src/features/{feature-name}/index.ts
import { createFeatureHandle } from '@/features/__core__'
import type { MyFeatureContract } from './contract'

// Export the handle as {FeatureName}Feature
export const MyFeature = createFeatureHandle<MyFeatureContract>('my-feature')

// Export contract type
export type { MyFeatureContract } from './contract'

// Export public types (if any)
export type * from './types'
```

### Allowed Exports

| Export Type    | Example                                 | Notes                       |
| -------------- | --------------------------------------- | --------------------------- |
| Feature handle | `export const MyFeature = ...`          | For use with useLoadFeature |
| Contract type  | `export type { MyFeatureContract }`     | TypeScript interface        |
| Public types   | `export type { MyData } from './types'` | Types needed by consumers   |

### What NOT to Export

- ❌ Internal hooks (access via feature handle)
- ❌ Internal services (access via feature handle)
- ❌ Internal components (access via feature handle)
- ❌ Internal utilities
- ❌ Store slices directly (expose selectors via contract)

## Cross-Feature Communication

### For Data: Use Redux

Features share **data** through the Redux store:

```typescript
// Feature A writes to store
dispatch(setTransactionStatus({ id, status: 'pending' }))

// Feature B reads from store (via its own selector or shared selector)
const status = useSelector(selectTransactionStatus(id))
```

### For Components/Hooks/Services: Use Feature Handles

Features access other features' **capabilities** through handles:

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

function MyComponent() {
  const wc = useLoadFeature(WalletConnectFeature)

  // No null check needed - flat structure, always callable
  const uri = wc.useWcUri()

  // Services are undefined when not ready - check $isReady before calling
  const handleConnect = () => {
    if (wc.$isReady) {
      wc.walletConnectInstance.connect(uri)
    }
  }

  // Components render null when not ready
  return <wc.WalletConnectWidget />
}
```

### Shared Code Location

| Code Type                            | Location          |
| ------------------------------------ | ----------------- |
| Utilities used by multiple features  | `src/utils/`      |
| Hooks used by multiple features      | `src/hooks/`      |
| Components used by multiple features | `src/components/` |

### Communication Patterns Summary

| Need                               | Pattern            | Example                                           |
| ---------------------------------- | ------------------ | ------------------------------------------------- |
| Get feature                        | `useLoadFeature()` | `const wc = useLoadFeature(WalletConnectFeature)` |
| Check if ready                     | Meta property      | `if (wc.$isReady) ...`                            |
| Render another feature's component | Feature handle     | `<wc.Widget />`                                   |
| Use another feature's hook         | Feature handle     | `wc.useY()`                                       |
| Call another feature's service     | Feature handle     | `if (wc.$isReady) wc.doY()`                       |
| Read shared state                  | Redux selector     | `useSelector(selectSafeInfo)`                     |
| Write shared state                 | Redux action       | `dispatch(setSafeInfo(data))`                     |
| Share types                        | Direct import      | `import type { X } from '@/features/y/types'`     |

## Common Mistakes & Anti-Patterns

### ❌ Importing Internal Files

```typescript
// WRONG - imports feature internals
import { WcInput } from '@/features/walletconnect/components/WcInput'
import { useWcUri } from '@/features/walletconnect/hooks/useWcUri'
```

```typescript
// CORRECT - uses feature handle
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

const wc = useLoadFeature(WalletConnectFeature)
const uri = wc.useWcUri()
```

### ❌ Optional Chaining with Feature Results

```typescript
// WRONG - unnecessary, feature always returns an object
const uri = wc?.useWcUri() ?? ''
if (!wc) return null
```

```typescript
// CORRECT - always callable, use meta properties for state
const uri = wc.useWcUri()
if (wc.$isDisabled) return null
```

### ❌ Static Import of Feature Internals

```typescript
// WRONG - static import bundles feature in main chunk
import MyFeature from '@/features/my-feature/components/MyFeatureWidget'
```

```typescript
// CORRECT - use feature handle with useLoadFeature
import { MyFeature } from '@/features/my-feature'
import { useLoadFeature } from '@/features/__core__'

const feature = useLoadFeature(MyFeature)
return <feature.MyFeatureWidget />
```

### ❌ Side Effects When Disabled

```typescript
// WRONG - API call happens even when disabled
export function MyFeature() {
  const { data } = useQuery('my-feature-data') // Always fetches!
  const feature = useLoadFeature(MyFeature)

  if (feature.$isDisabled) return null
  return <div>{data}</div>
}
```

```typescript
// CORRECT - no side effects when disabled
export function MyFeature() {
  const feature = useLoadFeature(MyFeature)

  if (feature.$isDisabled) return null

  // Data fetching only happens when enabled
  return <MyFeatureContent />
}

function MyFeatureContent() {
  const { data } = useQuery('my-feature-data')
  return <div>{data}</div>
}
```

### ❌ Using lazy() Inside feature.ts

```typescript
// WRONG - feature.ts is already lazy-loaded
import { lazy } from 'react'

export default {
  MyComponent: lazy(() => import('./components/MyComponent')), // ❌
}
```

```typescript
// CORRECT - direct imports in feature.ts
import MyComponent from './components/MyComponent'

export default {
  MyComponent, // ✅
}
```

### ❌ Nested Structure in feature.ts

```typescript
// WRONG - don't use nested categories
export default {
  components: { MyComponent }, // ❌ No nesting!
  hooks: { useMyHook }, // ❌ No nesting!
}
```

```typescript
// CORRECT - flat structure
export default {
  MyComponent, // ✅
  useMyHook, // ✅
}
```

## Testing Strategy

Testing is straightforward - just mock the feature module.

### Unit Testing a Feature

```typescript
// src/features/safe-shield/components/__tests__/SafeShieldScanner.test.tsx
import { render, screen, waitFor } from '@testing-library/react'

// Mock the feature module with flat structure
jest.mock('@/features/walletconnect', () => ({
  WalletConnectFeature: {
    name: 'walletconnect',
    useIsEnabled: () => true,
    load: () => Promise.resolve({
      default: {
        // Flat structure - no nested categories
        WalletConnectWidget: () => <div data-testid="widget">Mock Widget</div>,
        useWcUri: () => 'wc://mock-uri',
      },
    }),
  },
}))

describe('Component using WalletConnect', () => {
  it('renders widget when feature is enabled', async () => {
    render(<MyComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('widget')).toBeInTheDocument()
    })
  })
})
```

### Testing with Disabled Features

```typescript
jest.mock('@/features/walletconnect', () => ({
  WalletConnectFeature: {
    name: 'walletconnect',
    useIsEnabled: () => false, // Feature disabled
    load: () => Promise.resolve({ default: {} }),
  },
}))

it('renders nothing when feature is disabled', () => {
  render(<MyComponent />)
  // Component stub renders null, so widget won't appear
  expect(screen.queryByTestId('widget')).not.toBeInTheDocument()
})
```

### Benefits for Testing

- **No context providers needed**: Each component manages its own state
- **Easy mocking**: Just mock the feature module with Jest
- **Proxy stubs**: Components render null, hooks return {} when not ready
- **Async handling**: Use `waitFor()` to wait for lazy loading

## ESLint Enforcement

### Configuration

```javascript
// apps/web/eslint.config.mjs
'no-restricted-imports': [
  'warn', // 'error' after migration is complete
  {
    patterns: [
      {
        // Block internal feature folders
        group: [
          '@/features/*/components/*',
          '@/features/*/hooks/*',
          '@/features/*/services/*',
          '@/features/*/store/*',
        ],
        message: 'Import from feature index file only (e.g., @/features/walletconnect).',
      },
      {
        // Block internal file imports (handle.ts is internal)
        group: ['@/features/*/handle'],
        message: 'Import from feature index file only. The handle is internal.',
      },
    ],
  },
],
```

### Migration Strategy

1. **During Migration**: Rule is set to `'warn'` - violations show warnings but don't fail builds
2. **After Migration**: Rule changes to `'error'` - violations fail builds

### Allowed Imports

```typescript
// ✅ Allowed: Feature export (for use with useLoadFeature)
import { MyFeature } from '@/features/my-feature'

// ✅ Allowed: Contract type (for type annotations if needed)
import type { MyFeatureContract } from '@/features/my-feature/contract'

// ✅ Allowed: Public types
import type { MyFeatureData } from '@/features/my-feature/types'

// ❌ Blocked: Internal imports
import { useInternalHook } from '@/features/my-feature/hooks/useInternal'
import { InternalComponent } from '@/features/my-feature/components/Internal'
import { myFeatureHandle } from '@/features/my-feature/handle' // Use index.ts instead
```

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

## Feature Creation Guide

### Step 1: Create Directory Structure

```bash
mkdir -p src/features/{feature-name}/{components,hooks,services,store}
```

### Step 2: Create Contract

```typescript
// src/features/{feature-name}/contract.ts
import type MyComponent from './components/MyComponent'
import type { useMyHook } from './hooks/useMyHook'

export interface MyFeatureContract {
  MyComponent: typeof MyComponent
  useMyHook: typeof useMyHook
}
```

### Step 3: Create Feature Implementation

```typescript
// src/features/{feature-name}/feature.ts
import MyComponent from './components/MyComponent'
import { useMyHook } from './hooks/useMyHook'
import type { MyFeatureContract } from './contract'

export default {
  MyComponent,
  useMyHook,
} satisfies MyFeatureContract
```

### Step 4: Create Public API

```typescript
// src/features/{feature-name}/index.ts
import { createFeatureHandle } from '@/features/__core__'
import type { MyFeatureContract } from './contract'

export const MyFeature = createFeatureHandle<MyFeatureContract>('my-feature')
export type { MyFeatureContract } from './contract'
```

### Step 5: Create Components and Hooks

```typescript
// src/features/{feature-name}/components/MyComponent/index.tsx
import type { ReactElement } from 'react'

export default function MyComponent(): ReactElement {
  return (
    <div data-testid="my-component">
      {/* Component content */}
    </div>
  )
}
```

```typescript
// src/features/{feature-name}/hooks/useMyHook.ts
export function useMyHook() {
  // Hook implementation
  return { data: null }
}
```

### Step 6: Add Feature Flag (if new)

1. Add to `FEATURES` enum in `packages/utils/src/utils/chains.ts`:

```typescript
export enum FEATURES {
  // ... existing features
  MY_FEATURE = 'MY_FEATURE',
}
```

2. Configure in CGW API chain configs (coordinate with backend team)

### Step 7: Verify

```bash
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web test
```

## Migration Guide

### Phase 1: Add Infrastructure

1. Create `src/features/__core__/types.ts` with base contract types
2. Create `src/features/__core__/useLoadFeature.ts` with the loading hook
3. Update ESLint rules (keep as warnings initially)

### Phase 2: Migrate Features (One at a Time)

For each feature:

1. **Create contract.ts** defining the feature's public API type (flat structure)
2. **Create feature.ts** with direct imports and flat exports
3. **Create index.ts** with `createFeatureHandle()` factory
4. **Organize internals** in `components/`, `hooks/`, `services/`, `store/` folders
5. **Update consumers** to use `useLoadFeature()` with the feature handle
6. **Remove null checks** where proxy stubs suffice
7. **Verify** with `yarn lint && yarn type-check && yarn test`

### Phase 3: Enforce

1. Change ESLint rule from 'warn' to 'error'
2. Verify CI passes
3. Document any exceptions

### Migration Example

**Before (direct imports - tight coupling):**

```typescript
// src/features/safe-shield/components/SafeShieldScanner.tsx
import { useHypernativeScanner } from '@/features/hypernative/hooks'
import { HypernativeBanner } from '@/features/hypernative/components'

function SafeShieldScanner() {
  const scanner = useHypernativeScanner()
  return <HypernativeBanner data={scanner.data} />
}
```

**After (feature handle - flat structure, proxy stubs):**

```typescript
// src/features/safe-shield/components/SafeShieldScanner.tsx
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

function SafeShieldScanner() {
  const hn = useLoadFeature(HypernativeFeature)

  // No null checks needed - flat structure, always callable
  // Hook returns {} when not ready, component renders null
  const scanner = hn.useHypernativeScanner()

  return <hn.Banner data={scanner?.data} />
}

// With explicit loading/disabled states:
function SafeShieldScannerWithStates() {
  const hn = useLoadFeature(HypernativeFeature)

  if (hn.$isLoading) return <Skeleton />
  if (hn.$isDisabled) return null

  const scanner = hn.useHypernativeScanner()
  return <hn.Banner data={scanner.data} />
}
```

## Checklist

### For New Features

- [ ] Created `contract.ts` with **flat structure** (no nested `components`/`hooks`/`services`)
- [ ] **Used `typeof` pattern in contract for IDE navigation**
- [ ] **Used naming conventions**: `useSomething` (hooks), `PascalCase` (components), `camelCase` (services)
- [ ] Created `index.ts` with `createFeatureHandle()` factory
- [ ] **`feature.ts` uses direct imports** (NOT `lazy()`) - see "Lazy Loading: One Dynamic Import"
- [ ] **`feature.ts` exports flat object** (no nested categories)
- [ ] Organized implementation in `components/`, `hooks/`, `services/`, `store/`
- [ ] Created `types.ts` for public types (if needed)
- [ ] No direct imports of other features' internal folders
- [ ] All cross-feature communication via Redux or feature handles

### For Existing Features (Migration)

- [ ] Created `contract.ts` with **flat structure**
- [ ] **Used `typeof` pattern in contract for IDE navigation**
- [ ] Created `index.ts` with `{FeatureName}Feature` export
- [ ] **`feature.ts` uses direct imports and flat structure**
- [ ] Organized internals in `components/`, `hooks/`, `services/`, `store/`
- [ ] Updated consumers to use flat access (e.g., `feature.MyComponent` not `feature.components.MyComponent`)
- [ ] Removed null checks where proxy stubs suffice
- [ ] Verified no ESLint warnings
- [ ] Tests pass

### For Feature Consumers

- [ ] Using `useLoadFeature()` hook with feature handle
- [ ] **No optional chaining** - feature always returns an object (proxy stubs)
- [ ] Using **flat access**: `feature.MyComponent`, `feature.useMyHook()` (no nested `.components.`)
- [ ] Using meta properties (`$isLoading`, `$isDisabled`, `$isReady`) for explicit state handling
- [ ] Type-safe (types inferred from handle)
- [ ] No direct imports from feature internal folders

### Verification

- [ ] `yarn lint` passes (no restricted import warnings)
- [ ] `yarn type-check` passes
- [ ] `yarn test` passes
- [ ] `yarn build` succeeds
- [ ] Feature chunk exists in build output

## FAQ

### Q: Can I still use Redux for feature state?

Yes. Redux remains the standard for shared application state. Feature handles provide access to components, hooks, and services, while Redux handles data flow.

### Q: What's the difference between a handle and a contract?

- **Contract** (`contract.ts`): TypeScript interface that defines the shape of the feature's public API
- **Handle** (`handle.ts` or created via factory): Runtime object with `name`, `useIsEnabled()`, and `load()` function

The contract is for type safety; the handle is what you pass to `useLoadFeature()`.

### Q: When does feature code actually load?

The handle is imported at app startup, but it's tiny (~100 bytes). The actual feature code loads when:

1. `useLoadFeature()` is called
2. The feature flag is enabled (`useIsEnabled()` returns `true`)
3. The `load()` function is invoked

### Q: What does `useLoadFeature()` return?

**Always returns an object** - never `null` or `undefined`. The object includes:

1. **Feature exports** (flat structure) - actual implementation when ready, proxy stubs otherwise
2. **Meta properties** (`$isLoading`, `$isDisabled`, `$isReady`, `$error`)

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

const wc = useLoadFeature(WalletConnectFeature)

// Always callable - no null checks needed
const uri = wc.useWcUri()  // Returns undefined if not ready
return <wc.Widget />        // Renders null if not ready
```

For explicit state handling, use meta properties:

```typescript
if (wc.$isLoading) return <Skeleton />
if (wc.$isDisabled) return null
return <wc.Widget />
```

| Meta Property | Type      | Description                          |
| ------------- | --------- | ------------------------------------ |
| `$isLoading`  | `boolean` | `true` while feature code is loading |
| `$isDisabled` | `boolean` | `true` if feature flag is off        |
| `$isReady`    | `boolean` | `true` when loaded and enabled       |
| `$error`      | `Error?`  | Error if loading failed              |

### Q: How do I share types between features?

Import types directly from `types.ts` - this is always allowed:

```typescript
import type { SafeSetup } from '@/features/multichain/types'
```

### Q: What about testing internal components?

Test files inside a feature can import from other files within the same feature freely. External tests should mock the feature module.

### Q: How does lazy loading work?

The `feature.ts` file is lazy-loaded via `handle.load()` (which is set up by `createFeatureHandle`). Use **direct imports** with a **flat structure** inside `feature.ts`:

```typescript
// feature.ts - This entire file is lazy-loaded via handle.load()
import MyComponent from './components/MyComponent'
import { useMyHook } from './hooks/useMyHook'

// Flat structure - no nested categories
export default {
  MyComponent, // PascalCase → component (stub renders null)
  useMyHook, // useSomething → hook (stub returns {})
}
```

**Do NOT use `lazy()` inside `feature.ts`** - the file is already lazy-loaded. Adding more `lazy()` calls creates unnecessary chunks and complexity. See the "Lazy Loading: One Dynamic Import" section above.

The rare exception is when you have a giant internal dependency (500KB+ chart library, PDF renderer) that's only used on one specific page within the feature:

```typescript
// Rare exception for giant sub-dependency
import RegularComponent from './components/RegularComponent'
import { withSuspense } from '@/features/__core__'
import { lazy } from 'react'

export default {
  RegularComponent, // ✅ Direct - loads with feature
  // Exception: 500KB chart only used on one page
  HeavyChart: withSuspense(lazy(() => import('./components/HeavyChart'))),
}
```

Consumers use flat access - no null checks needed:

```typescript
const feature = useLoadFeature(MyFeature)
// Proxy stubs: components render null, hooks return {} when not ready
return <feature.Widget />
```

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

## Reference Implementations

See these features as examples:

- **Simple Feature**: `src/features/bridge/`
- **Standard Feature**: `src/features/multichain/`
- **Complex Feature**: `src/features/walletconnect/`
