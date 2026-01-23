# Feature Architecture Standard v2

This document defines the revised architecture pattern for features in the Safe{Wallet} web application. It addresses tight coupling, unclear boundaries, testing difficulties, and circular import issues through **Feature Contracts** and **Feature Handles**.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Feature Contract](#feature-contract)
- [Feature Handles](#feature-handles)
- [Helper: createFeatureHandle](#helper-createfeaturehandle)
- [Reducing Boilerplate with typeof Pattern](#reducing-boilerplate-with-typeof-pattern)
- [Folder Structure](#folder-structure)
- [Public API Pattern](#public-api-pattern)
- [Cross-Feature Communication](#cross-feature-communication)
- [Testing Strategy](#testing-strategy)
- [ESLint Enforcement](#eslint-enforcement)
- [Migration Guide](#migration-guide)
- [Checklist](#checklist)

## Overview

A **feature** is a self-contained domain module that:

- Implements a typed **Feature Contract** interface
- Exports a **Feature Handle** for lazy loading
- Has explicit **public API** enforced via ESLint (only `index.ts` exports)
- Communicates with other features via **Redux** (data) or direct imports of feature handles

### Key Principles

1. **Contract-First**: Every feature defines what it exposes through a typed contract
2. **Lazy Loading**: Features are loaded on-demand via handles with `useLoadFeature()`
3. **Type Safety**: Direct handle imports provide full type inference
4. **Flexibility**: Features can be simple or complex based on their needs

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

| Part                              | Bundled?   | Purpose                                    |
| --------------------------------- | ---------- | ------------------------------------------ |
| `useIsEnabled()`                  | Yes (tiny) | Flag check via `useHasFeature(FEATURES.X)` |
| `components`, `hooks`, `services` | No (lazy)  | Actual feature code, loaded on demand      |

The `useLoadFeature()` hook combines flag check + lazy loading in one step:

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

// Consumer component with loading state
function MyPage() {
  const walletConnect = useLoadFeature(WalletConnectFeature)

  // Show skeleton while loading (feature flag or code)
  if (walletConnect === undefined) return <Skeleton />

  // Hide if feature is disabled
  if (walletConnect === null) return null

  // Feature is loaded - safe to use
  return <walletConnect.components.WalletConnectWidget />
}

// Simple pattern: treat loading same as disabled
function SimpleComponent() {
  const walletConnect = useLoadFeature(WalletConnectFeature)
  if (!walletConnect) return null
  return <walletConnect.components.WalletConnectWidget />
}
```

**`useLoadFeature()` return values:**
| Condition | Returns | When to use |
|-----------|---------|-------------|
| Feature flag or code loading | `undefined` | Show loading UI (Skeleton, Spinner) |
| Feature flag disabled | `null` | Hide feature completely |
| Feature loaded successfully | Feature object | Render feature components |

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
│    // Returns: undefined | null | feature                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
           ┌──────────┐ ┌──────────┐ ┌─────────┐
           │   null   │ │undefined │ │ feature │
           │(disabled)│ │(loading) │ │(loaded) │
           └──────────┘ └──────────┘ └─────────┘
                 │            │            │
                 ▼            ▼            ▼
            return null  <Skeleton/>  <wc.components.Widget />
```

### Benefits of This Pattern

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

const walletConnect = useLoadFeature(WalletConnectFeature)
```

Benefits:

- **Type-safe**: Full TypeScript inference from the handle
- **Simple API**: Returns `undefined` (loading), `null` (disabled), or the feature object
- **Loading states**: Can distinguish between loading and disabled for better UX
- **IDE-friendly**: Cmd+click on `WalletConnectFeature` jumps to the handle definition
- **Tree-shakeable**: Unused features won't be bundled
- **No boilerplate**: No context providers, no string lookups
- **Better UX**: Show skeletons/spinners during loading instead of blank screens
- **Testable**: Just mock the feature module with Jest

## Feature Contract

Every feature MUST export a contract type that defines its public API.

### Contract Interface

```typescript
// src/features/__core__/types.ts

/**
 * Base contract that all features extend.
 * The useIsEnabled hook is STATIC (bundled) - just a FEATURES enum lookup.
 * Components/hooks/services are LAZY (code-split).
 */
export interface BaseFeatureContract {
  /** Unique feature identifier (used for registry lookup) */
  readonly name: string

  /**
   * Feature flag check - STATIC, always bundled.
   * Implementation is just: () => useHasFeature(FEATURES.MY_FEATURE)
   * @returns true/false/undefined (loading)
   */
  useIsEnabled: () => boolean | undefined
}

/**
 * Contract for features that expose components
 */
export interface ComponentContract {
  components?: Record<string, React.ComponentType<any>>
}

/**
 * Contract for features that expose hooks
 */
export interface HooksContract {
  hooks?: Record<string, (...args: any[]) => any>
}

/**
 * Contract for features that expose services
 */
export interface ServicesContract {
  services?: Record<string, unknown>
}

/**
 * Contract for features that expose Redux selectors
 */
export interface SelectorsContract {
  selectors?: Record<string, (state: RootState) => unknown>
}

/**
 * Full feature contract combining all capabilities
 */
export type FeatureContract = BaseFeatureContract &
  Partial<ComponentContract> &
  Partial<HooksContract> &
  Partial<ServicesContract> &
  Partial<SelectorsContract>
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
import type { myService } from './services/myService'
import type { myStore } from './store/myStore'

export interface MyFeatureContract {
  components: {
    // ✅ CORRECT: Cmd+click on 'typeof MyComponent' jumps to implementation
    MyComponent: typeof MyComponent
  }
  services: {
    // ✅ CORRECT: Cmd+click on 'typeof myService' jumps to implementation
    myService: typeof myService

    // ✅ CORRECT: For stores, always use typeof
    myStore: typeof myStore
  }
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
components: {
  MyComponent: ComponentType // Can't jump to definition
}

// ❌ WRONG: Manual type annotation requires maintenance
components: {
  MyComponent: React.FC<{ prop: string }> // Must update manually when props change
}
```

### Example Contracts

**Minimal Feature Contract (component only):**

```typescript
// src/features/bridge/contract.ts
import type { FeatureImplementation } from '@/features/__core__'
import type Bridge from './components/Bridge'
import type BridgeWidget from './components/BridgeWidget'

export interface BridgeImplementation extends FeatureImplementation {
  components: {
    // Use typeof for IDE navigation (Cmd+click jumps to implementation)
    Bridge: typeof Bridge
    BridgeWidget: typeof BridgeWidget
  }
}

export interface BridgeContract extends BridgeImplementation {
  readonly name: 'bridge'
  useIsEnabled: () => boolean | undefined
}
```

**Standard Feature Contract (with hooks):**

```typescript
// src/features/multichain/contract.ts
import type { BaseFeatureContract, ComponentContract, HooksContract } from '@/features/__core__/types'
import type CreateSafeOnNewChain from './components/CreateSafeOnNewChain'
import type NetworkLogosList from './components/NetworkLogosList'
import type { useIsMultichainSafe } from './hooks/useIsMultichainSafe'
import type { useSafeCreationData } from './hooks/useSafeCreationData'

export interface MultichainContract extends BaseFeatureContract, ComponentContract, HooksContract {
  readonly name: 'multichain'
  useIsEnabled: () => boolean | undefined // Static flag check
  components: {
    // Use typeof for IDE navigation
    CreateSafeOnNewChain: typeof CreateSafeOnNewChain
    NetworkLogosList: typeof NetworkLogosList
  }
  hooks: {
    // Use typeof for hooks too
    useIsMultichainSafe: typeof useIsMultichainSafe
    useSafeCreationData: typeof useSafeCreationData
  }
}
```

**Full Feature Contract (with services and selectors):**

```typescript
// src/features/walletconnect/contract.ts
import type { FeatureContract } from '@/features/__core__/types'
import type WalletConnectWidget from './components/WalletConnectWidget'
import type WcSessionManager from './components/WcSessionManager'
import type { useWcUri } from './hooks/useWcUri'
import type { useWalletConnectSearchParamUri } from './hooks/useWalletConnectSearchParamUri'
import type WalletConnectWallet from './services/WalletConnectWallet'
import type { wcPopupStore } from './store/wcPopupStore'
import type { wcSessionStore } from './store/wcSessionStore'

export interface WalletConnectContract extends FeatureContract {
  readonly name: 'walletconnect'
  useIsEnabled: () => boolean | undefined // Static flag check
  components: {
    // Use typeof for components - enables IDE navigation
    WalletConnectWidget: typeof WalletConnectWidget
    WcSessionManager: typeof WcSessionManager
  }
  hooks: {
    // Use typeof for hooks
    useWcUri: typeof useWcUri
    useWalletConnectSearchParamUri: typeof useWalletConnectSearchParamUri
  }
  services: {
    // Use typeof for services
    walletConnectInstance: WalletConnectWallet

    // Use typeof for stores
    wcPopupStore: typeof wcPopupStore
    wcSessionStore: typeof wcSessionStore
  }
}
```

## Feature Handles

Features are loaded lazily via handles and the `useLoadFeature()` hook.

### useLoadFeature Implementation

The `useLoadFeature()` hook provides:

- Feature flag checking via `handle.useIsEnabled()`
- Lazy loading of the full implementation
- Module-level caching with `useSyncExternalStore` for reactivity

```typescript
// src/features/__core__/useLoadFeature.ts
import { useEffect, useSyncExternalStore } from 'react'
import type { FeatureHandle, FeatureImplementation, FeatureContract } from './types'

// Module-level cache shared across all components
const cache = new Map<string, FeatureContract>()
const loading = new Set<string>()
const subscribers = new Set<() => void>()

export function useLoadFeature<T extends FeatureImplementation>(
  handle: FeatureHandle<T>,
): (T & { name: string; useIsEnabled: () => boolean | undefined }) | null {
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
      cache.set(handle.name, { name: handle.name, useIsEnabled: handle.useIsEnabled, ...module.default })
      loading.delete(handle.name)
      notifySubscribers()
    })
  }, [isEnabled, cached, handle])

  if (isEnabled !== true || !cached) return null
  return cached
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
  // Type is automatically inferred from WalletConnectFeature
  const walletConnect = useLoadFeature(WalletConnectFeature)

  if (!walletConnect) return null

  // Feature is enabled - render component directly
  return <walletConnect.components.WalletConnectWidget />
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

**Traditional approach (manual contract):**

```typescript
// contract.ts (~50 lines)
import type { FeatureContract } from '@/features/__core__'
import type MyComponent from './components/MyComponent'
import type { useMyHook } from './hooks/useMyHook'

export interface MyFeatureContract extends FeatureContract {
  readonly name: 'my-feature'
  components: {
    MyComponent: typeof MyComponent
  }
  hooks: {
    useMyHook: typeof useMyHook
  }
}

// handle.ts (~15 lines)
export const MyFeatureHandle: FeatureHandle<MyFeatureContract> = {
  name: 'my-feature',
  useIsEnabled: () => useHasFeature(FEATURES.MY_FEATURE),
  load: () => import('./feature'),
}

// feature.ts
export default {
  components: { MyComponent },
  hooks: { useMyHook },
} satisfies MyFeatureContract

// index.ts
export { MyFeatureHandle } from './handle'
export type { MyFeatureContract } from './contract'
```

**Simplified approach (typeof inference):**

```typescript
// feature.ts (~20 lines)
import MyComponent from './components/MyComponent'
import { useMyHook } from './hooks/useMyHook'

export default {
  components: { MyComponent },
  hooks: { useMyHook },
}

// index.ts (~5 lines)
import { createFeatureHandle } from '@/features/__core__'
import featureImpl from './feature'

export const MyFeature = createFeatureHandle<typeof featureImpl>('my-feature')
export type * from './types'
```

**Reduction: 100 lines across 4 files → 25 lines across 2 files (75% reduction)**

### Bundle Size Impact

**Zero impact.** TypeScript types are compile-time only and completely stripped during transpilation:

```typescript
// TypeScript source
export const MyFeature = createFeatureHandle<typeof featureImpl>('my-feature')

// Compiled JavaScript (all types removed)
export const MyFeature = createFeatureHandle('my-feature')
```

All `interface`, `type`, `typeof`, and generic parameters are erased before bundling.

### Type Safety Preserved

Full type inference and autocomplete still work:

```typescript
const feature = useLoadFeature(MyFeature)
//    ^? {
//      components: { MyComponent: ComponentType<...> },
//      hooks: { useMyHook: () => ... }
//    } | null | undefined

if (!feature) return null

feature.components.MyComponent // ✅ Full autocomplete
feature.hooks.useMyHook() // ✅ Type-safe
```

### Benefits

- ✅ **Less boilerplate**: No manual contract definitions to maintain
- ✅ **Auto-sync**: Types update automatically when implementation changes
- ✅ **Zero bundle cost**: TypeScript types don't affect bundle size
- ✅ **Type-safe**: Full type checking and IDE autocomplete preserved
- ✅ **Fewer files**: Eliminates contract.ts and handle.ts

### Trade-offs

- ⚠️ **IDE navigation**: Cmd+click on `MyFeature` goes to index.ts first, not directly to components
- ⚠️ **Anonymous type**: No explicitly named contract interface
- ⚠️ **Less documentation**: Contract interface can serve as API documentation

### When to Use

**Use typeof pattern when:**

- Feature has simple to moderate complexity
- You want minimal boilerplate
- Types naturally describe themselves through implementation

**Keep manual contracts when:**

- Feature contract serves as important API documentation
- Multiple features depend on explicit contract interface
- You need named contract types for external references

### Example: Standard Feature

```typescript
// src/features/multichain/feature.ts
import { lazy } from 'react'
import { useIsMultichainSafe } from './hooks/useIsMultichainSafe'
import { useSafeCreationData } from './hooks/useSafeCreationData'

export default {
  components: {
    CreateSafeOnNewChain: lazy(() => import('./components/CreateSafeOnNewChain')),
    NetworkLogosList: lazy(() => import('./components/NetworkLogosList')),
  },
  hooks: {
    useIsMultichainSafe,
    useSafeCreationData,
  },
}

// src/features/multichain/index.ts
import { createFeatureHandle } from '@/features/__core__'
import featureImpl from './feature'

export const MultichainFeature = createFeatureHandle<typeof featureImpl>('multichain')

// Re-export public types
export type * from './types'

// Consumers can now use the feature with full type safety
import { MultichainFeature } from '@/features/multichain'
import { useLoadFeature } from '@/features/__core__'

function MyComponent() {
  const mc = useLoadFeature(MultichainFeature)
  if (!mc) return null

  return (
    <div>
      <mc.components.CreateSafeOnNewChain />
      <mc.components.NetworkLogosList networks={mc.hooks.useIsMultichainSafe()} />
    </div>
  )
}
```

## Folder Structure

Features can be organized based on their complexity:

### Simple Features

For straightforward features with minimal logic:

```
src/features/bridge/
├── index.ts              # Lazy default export
└── Bridge.tsx            # Implementation
```

### Complex Features

For features with multiple components, hooks, and services:

```
src/features/walletconnect/
├── index.ts              # Public API exports
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

## Public API Pattern

Each feature exposes exactly three things:

1. **Feature handle**: Registered at app startup (static flag + lazy refs)
2. **Contract type**: TypeScript interface for registry consumers
3. **Public types** (optional): Types needed by consumers

### handle.ts Template

```typescript
// src/features/{feature-name}/handle.ts
// IMPORTANT: This file must be SMALL (~100 bytes) - only flag lookup + lazy loader
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeatureHandle } from '@/features/__core__'
import type { MyFeatureImplementation } from './contract'

export const myFeatureHandle: FeatureHandle<MyFeatureImplementation> = {
  name: 'my-feature',

  // STATIC: Just a flag lookup - this is bundled, not lazy
  useIsEnabled: () => useHasFeature(FEATURES.MY_FEATURE),

  // LAZY: Loads the full feature only when enabled + accessed
  load: () => import('./feature'),
}
```

### What NOT to Export

- ❌ Internal hooks (use registry instead)
- ❌ Internal services (use registry instead)
- ❌ Internal components (only expose via contract)
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
  // Get feature (null if disabled or still loading)
  const walletConnect = useLoadFeature(WalletConnectFeature)

  if (!walletConnect) return null

  // Use its services
  const handleConnect = () => walletConnect.services.walletConnectInstance.connect(uri)

  // Render its components
  return <walletConnect.components.WalletConnectWidget />
}
```

### Communication Patterns Summary

| Need                               | Pattern            | Example                                           |
| ---------------------------------- | ------------------ | ------------------------------------------------- |
| Get feature if enabled             | `useLoadFeature()` | `const wc = useLoadFeature(WalletConnectFeature)` |
| Render another feature's component | Feature handle     | `<wc.components.Widget />`                        |
| Use another feature's hook         | Feature handle     | `wc.hooks.useY()`                                 |
| Call another feature's service     | Feature handle     | `wc.services.doY()`                               |
| Read shared state                  | Redux selector     | `useSelector(selectSafeInfo)`                     |
| Write shared state                 | Redux action       | `dispatch(setSafeInfo(data))`                     |
| Share types                        | Direct import      | `import type { X } from '@/features/y/types'`     |

## Testing Strategy

Testing is straightforward - just mock the feature module.

### Unit Testing a Feature

```typescript
// src/features/safe-shield/components/__tests__/SafeShieldScanner.test.tsx
import { render, screen, waitFor } from '@testing-library/react'

// Mock the feature module
jest.mock('@/features/walletconnect', () => ({
  WalletConnectFeature: {
    name: 'walletconnect',
    useIsEnabled: () => true,
    load: () => Promise.resolve({
      default: {
        components: {
          WalletConnectWidget: () => <div data-testid="widget">Mock Widget</div>,
        },
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
  expect(screen.queryByTestId('widget')).not.toBeInTheDocument()
})
```

### Benefits for Testing

- **No context providers needed**: Each component manages its own state
- **Easy mocking**: Just mock the feature module with Jest
- **Async handling**: Use `waitFor()` to wait for lazy loading

## ESLint Enforcement

### Updated Rules

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

## Migration Guide

### Phase 1: Add Infrastructure

1. Create `src/features/__core__/types.ts` with base contract types
2. Create `src/features/__core__/useLoadFeature.ts` with the loading hook
3. Update ESLint rules (keep as warnings initially)

### Phase 2: Migrate Features (One at a Time)

For each feature:

1. **Determine tier** (Minimal, Standard, or Full)
2. **Create contract.ts** defining the feature's public API type
3. **Create handle.ts** with static flag + lazy load function
4. **Create index.ts** exporting `{FeatureName}Feature` from handle
5. **Organize internals** in `components/`, `hooks/`, `services/`, `store/` folders
6. **Update consumers** to use `useLoadFeature()` with the feature handle
7. **Verify** with `yarn lint && yarn type-check && yarn test`

### Phase 3: Enforce

1. Change ESLint rule from 'warn' to 'error'
2. Verify CI passes
3. Document any exceptions

### Migration Example: safe-shield Feature

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

**After (feature handle - lazy loading):**

```typescript
// src/features/safe-shield/components/SafeShieldScanner.tsx
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

function SafeShieldScanner() {
  const hypernative = useLoadFeature(HypernativeFeature)

  // Show loading state
  if (hypernative === undefined) return <Skeleton />

  // Hide if disabled
  if (hypernative === null) return null

  return <hypernative.components.Banner />
}
```

## Checklist

### For New Features

- [ ] Determined feature tier (Minimal/Standard/Full)
- [ ] Created `contract.ts` with typed contract interface
- [ ] **Used `typeof` pattern in contract for all components, hooks, services, and stores (for IDE navigation)**
- [ ] Created `handle.ts` with static `useIsEnabled` + lazy `load()` function
- [ ] Created `index.ts` exporting `{FeatureName}Feature` from handle
- [ ] Organized implementation in `components/`, `hooks/`, `services/`, `store/`
- [ ] Created `types.ts` for public types (if needed)
- [ ] No direct imports of other features' internal folders
- [ ] All cross-feature communication via Redux or feature handles

### For Existing Features (Migration)

- [ ] Created `contract.ts`
- [ ] **Used `typeof` pattern in contract for all components, hooks, services, and stores (for IDE navigation)**
- [ ] Created `handle.ts`
- [ ] Created `index.ts` with `{FeatureName}Feature` export
- [ ] Organized internals in `components/`, `hooks/`, `services/`, `store/`
- [ ] Updated all external consumers to use `useLoadFeature()`
- [ ] Removed direct exports of internal files from `index.ts`
- [ ] Verified no ESLint warnings
- [ ] Tests pass

### For Feature Consumers

- [ ] Using `useLoadFeature()` hook with feature handle
- [ ] Handling return values: `undefined` (loading), `null` (disabled), or feature object (loaded)
- [ ] Optionally showing loading UI for better UX (instead of blank screen)
- [ ] Type-safe (types inferred from handle)
- [ ] No direct imports from feature internal folders (components/, hooks/, etc.)

## FAQ

### Q: Can I still use Redux for feature state?

Yes. Redux remains the standard for shared application state. Feature handles provide access to components, hooks, and services, while Redux handles data flow.

### Q: What's the difference between a handle and a contract?

- **Contract** (`contract.ts`): TypeScript interface that defines the shape of the feature's public API
- **Handle** (`handle.ts`): Runtime object with `name`, `useIsEnabled()`, and `load()` function

The contract is for type safety; the handle is what you pass to `useLoadFeature()`.

### Q: When does feature code actually load?

The handle is imported at app startup, but it's tiny (~100 bytes). The actual feature code loads when:

1. `useLoadFeature()` is called
2. The feature flag is enabled (`useIsEnabled()` returns `true`)
3. The `load()` function is invoked

### Q: What does `useLoadFeature()` return?

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__core__'

const feature = useLoadFeature(WalletConnectFeature)
// Returns:
// - undefined if feature flag or code is loading
// - null if feature flag is disabled
// - the full feature contract if enabled and loaded
```

You can handle loading states explicitly:

```typescript
if (feature === undefined) return <Skeleton />  // Loading
if (feature === null) return null  // Disabled
return <feature.components.Widget />  // Loaded
```

Or use a simple null check to treat loading same as disabled:

```typescript
if (!feature) return null  // Not available (loading or disabled)
return <feature.components.Widget />  // Loaded
```

### Q: How do I share types between features?

Import types directly from `types.ts` - this is always allowed:

```typescript
import type { SafeSetup } from '@/features/multichain/types'
```

### Q: What about testing internal components?

Test files inside a feature can import from other files within the same feature freely. External tests should mock the feature module.

### Q: How does lazy loading work?

Components in the feature implementation should use `withSuspense` to wrap lazy components:

```typescript
// feature.ts
import { lazy } from 'react'
import { withSuspense } from '@/features/__core__'

export default {
  components: {
    // withSuspense wraps the lazy component with Suspense internally
    Widget: withSuspense(lazy(() => import('./components/Widget'))),
  },
}
```

This means consumers can render components directly without wrapping in `<Suspense>`:

```typescript
const feature = useLoadFeature(MyFeature)
if (!feature) return null
return <feature.components.Widget /> // No Suspense wrapper needed
```

## Reference Implementations

After migration, see these features as examples:

- **Tier 1 (Minimal)**: `src/features/bridge/`
- **Tier 2 (Standard)**: `src/features/multichain/`
- **Tier 3 (Full)**: `src/features/walletconnect/`
