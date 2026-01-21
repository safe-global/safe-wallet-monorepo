# Feature Architecture Standard v2

This document defines the revised architecture pattern for features in the Safe{Wallet} web application. It addresses tight coupling, unclear boundaries, testing difficulties, and circular import issues through **Feature Contracts**, **Feature Handles**, and **tiered structure**.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Feature Contract](#feature-contract)
- [Feature Handles](#feature-handles)
- [Feature Tiers](#feature-tiers)
- [Folder Structure by Tier](#folder-structure-by-tier)
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
- Follows one of three **tiers** based on complexity
- Has explicit **public** and **internal** boundaries
- Communicates with other features via **Redux** (data) or direct imports of feature handles

### Key Principles

1. **Contract-First**: Every feature defines what it exposes through a typed contract
2. **Lazy Loading**: Features are loaded on-demand via handles with `useLoadFeature()`
3. **Tiered Complexity**: Simple features stay simple; complex features have structure
4. **Type Safety**: Direct handle imports provide full type inference

### Problems This Architecture Solves

| Problem                              | Solution                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| Tight coupling between features      | Feature handles with lazy loading                        |
| Unclear boundaries                   | Feature Contract defines exactly what's public           |
| Testing difficulties                 | Module-level cache can be cleared; handles can be mocked |
| Forced structure for simple features | Three tiers: Minimal, Standard, Full                     |
| Bundle size                          | Lazy loading ensures disabled features aren't bundled    |

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
import { useLoadFeature } from '@/features/__contracts__'

// Consumer component
function MyPage() {
  // Returns null if: disabled or still loading
  const walletConnect = useLoadFeature(WalletConnectFeature)

  if (!walletConnect) return null

  // Feature is enabled and loaded - safe to use components
  return <walletConnect.components.WalletConnectWidget />
}
```

**`useLoadFeature()` return values:**
| Condition | Returns |
|-----------|---------|
| Feature flag disabled | `null` |
| Feature flag loading (undefined) | `null` |
| Feature flag enabled + loaded | The loaded feature contract |

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
│    // Returns null if disabled, full contract if enabled       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ if not null
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONSUMER renders component (already wrapped with Suspense)  │
│    return <wc.components.WalletConnectWidget />                │
└─────────────────────────────────────────────────────────────────┘
```

### Benefits of This Pattern

```typescript
import { WalletConnectFeature } from '@/features/walletconnect'
import { useLoadFeature } from '@/features/__contracts__'

const walletConnect = useLoadFeature(WalletConnectFeature)
```

Benefits:

- **Type-safe**: Full TypeScript inference from the handle
- **IDE-friendly**: Cmd+click on `WalletConnectFeature` jumps to the handle definition
- **Tree-shakeable**: Unused features won't be bundled
- **Simple**: No context providers, no string lookups
- **Testable**: Module-level cache can be cleared with `clearFeatureCache()`

## Feature Contract

Every feature MUST export a contract type that defines its public API.

### Contract Interface

```typescript
// src/features/__contracts__/types.ts

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
import { useLoadFeature } from '@/features/__contracts__'

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

For navigating to implementation details from contracts, use `typeof` imports:

```typescript
// contract.ts
import type { myService } from './__internal__/services/myService'

export interface MyFeatureContract {
  services: {
    // Cmd+click on 'typeof myService' jumps to implementation
    myService: typeof myService
  }
}
```

### Example Contracts

**Minimal Feature Contract (component only):**

```typescript
// src/features/bridge/contract.ts
import type { ComponentType } from 'react'
import type { FeatureImplementation } from '@/features/__contracts__'

export interface BridgeImplementation extends FeatureImplementation {
  components: {
    Bridge: ComponentType
    BridgeWidget: ComponentType
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
import type { BaseFeatureContract, ComponentContract, HooksContract } from '@/features/__contracts__/types'

export interface MultichainContract extends BaseFeatureContract, ComponentContract, HooksContract {
  readonly name: 'multichain'
  useIsEnabled: () => boolean | undefined // Static flag check
  components: {
    CreateSafeOnNewChain: React.LazyExoticComponent<React.ComponentType>
    NetworkLogosList: React.LazyExoticComponent<React.ComponentType<{ chainIds: string[] }>>
  }
  hooks: {
    useIsMultichainSafe: () => boolean
    useSafeCreationData: (chainId: string) => SafeCreationData | undefined
  }
}
```

**Full Feature Contract (with services and selectors):**

```typescript
// src/features/walletconnect/contract.ts
import type { FeatureContract } from '@/features/__contracts__/types'

export interface WalletConnectContract extends FeatureContract {
  readonly name: 'walletconnect'
  useIsEnabled: () => boolean | undefined // Static flag check
  components: {
    WalletConnectWidget: React.LazyExoticComponent<React.ComponentType>
    WcSessionManager: React.LazyExoticComponent<React.ComponentType>
  }
  hooks: {
    useWcUri: () => string | undefined
    useWalletConnectSearchParamUri: () => string | null
  }
  services: {
    connect: (uri: string) => Promise<void>
    disconnect: (topic: string) => Promise<void>
  }
  selectors: {
    selectWcPopupOpen: (state: RootState) => boolean
    selectWcSessions: (state: RootState) => WcSession[]
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
// src/features/__contracts__/useLoadFeature.ts
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
import type { FeatureHandle } from '@/features/__contracts__'
import type { WalletConnectImplementation } from './contract'

export const walletConnectHandle: FeatureHandle<WalletConnectImplementation> = {
  name: 'walletconnect',

  // STATIC: Just a flag lookup, no heavy imports
  useIsEnabled: () => useHasFeature(FEATURES.NATIVE_WALLETCONNECT),

  // LAZY: Loads the full feature only when enabled + accessed
  load: () => import('./__internal__/feature'),
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
import { useLoadFeature } from '@/features/__contracts__'

function Header() {
  // Type is automatically inferred from WalletConnectFeature
  const walletConnect = useLoadFeature(WalletConnectFeature)

  if (!walletConnect) return null

  // Feature is enabled - render component directly
  return <walletConnect.components.WalletConnectWidget />
}
```

## Feature Tiers

Features are categorized into three tiers based on complexity:

### Tier 1: Minimal

For simple, self-contained features (typically a single component).

**Characteristics:**

- No state shared with other features
- No services or complex logic
- Single component or small set of related components

**Required files:**

- `index.ts` - Default export of main component
- `contract.ts` - Feature contract type definition

**Examples:** bridge, speedup, tx-notes

### Tier 2: Standard

For features with hooks, selectors, or shared state.

**Characteristics:**

- Has feature-specific hooks for external use
- May have Redux state
- May have shared types

**Required files:**

- `index.ts` - Default export + contract registration
- `contract.ts` - Feature contract type definition
- `types.ts` - Public type definitions (optional if no public types)
- `__internal__/` - All implementation details

**Examples:** multichain, positions, myAccounts

### Tier 3: Full

For complex features with services, extensive state, and cross-feature interactions.

**Characteristics:**

- Has services that other features may call
- Complex state management
- Multiple entry points/components

**Required files:**

- `index.ts` - Contract registration and lazy exports
- `contract.ts` - Full feature contract
- `types.ts` - Public type definitions
- `__internal__/` - All implementation details
  - `components/`
  - `hooks/`
  - `services/`
  - `store/`

**Examples:** walletconnect, recovery, hypernative

### Tier Comparison

| Aspect          | Minimal  | Standard  | Full   |
| --------------- | -------- | --------- | ------ |
| `contract.ts`   | ✓        | ✓         | ✓      |
| `index.ts`      | ✓        | ✓         | ✓      |
| `types.ts`      | Optional | If needed | ✓      |
| `__internal__/` | Optional | ✓         | ✓      |
| Feature flag    | Optional | ✓         | ✓      |
| Redux store     | ✗        | Optional  | Common |
| Services        | ✗        | Optional  | Common |
| Registry hooks  | Optional | ✓         | ✓      |

## Folder Structure by Tier

### Tier 1: Minimal

```
src/features/bridge/
├── index.ts              # Lazy default export
├── contract.ts           # BridgeContract type
└── Bridge.tsx            # Implementation (can be flat for simple features)
```

**index.ts:**

```typescript
import dynamic from 'next/dynamic'

export type { BridgeContract } from './contract'

const Bridge = dynamic(() => import('./Bridge'), { ssr: false })
export default Bridge
```

### Tier 2: Standard

```
src/features/multichain/
├── handle.ts             # Feature handle (static flag + lazy refs)
├── contract.ts           # MultichainContract type
├── types.ts              # Public types (SafeSetup, etc.)
└── __internal__/
    ├── components/
    │   ├── CreateSafeOnNewChain.tsx
    │   └── NetworkLogosList.tsx
    ├── hooks/
    │   └── useIsMultichainSafe.ts
    └── utils/
        └── addressPrediction.ts
```

### Tier 3: Full

```
src/features/walletconnect/
├── handle.ts             # Feature handle (static flag + lazy refs)
├── contract.ts           # WalletConnectContract type
├── types.ts              # Public types
└── __internal__/
    ├── components/
    │   ├── WalletConnectWidget/
    │   │   ├── index.tsx
    │   │   └── index.test.tsx
    │   └── WcSessionManager/
    ├── hooks/
    │   ├── useWcUri.ts
    │   └── index.ts      # Internal barrel (optional)
    ├── services/
    │   ├── walletConnectService.ts
    │   └── sessionManager.ts
    ├── store/
    │   ├── wcSlice.ts
    │   └── selectors.ts
    └── constants.ts
```

## Public API Pattern

Each feature exposes exactly three things:

1. **Feature handle**: Registered at app startup (static flag + lazy refs)
2. **Contract type**: TypeScript interface for registry consumers
3. **Public types** (optional): Types needed by consumers

### handle.ts Template

```typescript
// src/features/{feature-name}/handle.ts
// IMPORTANT: This file must be SMALL - only static imports for flag lookup
import { lazy } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { withSuspense } from '@/features/__contracts__'
import type { MyFeatureContract } from './contract'

export const myFeatureHandle: MyFeatureContract = {
  name: 'my-feature',

  // STATIC: Just a flag lookup - this is bundled, not lazy
  useIsEnabled: () => useHasFeature(FEATURES.MY_FEATURE),

  // LAZY: Components wrapped with Suspense so consumers don't need to
  components: {
    Widget: withSuspense(lazy(() => import('./__internal__/components/Widget'))),
  },

  // LAZY: Hooks load on first call
  hooks: {
    useData: () => {
      const { useData } = require('./__internal__/hooks/useData')
      return useData()
    },
  },
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
import { useLoadFeature } from '@/features/__contracts__'

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

The module-level cache pattern makes testing straightforward.

### Unit Testing a Feature

```typescript
// src/features/safe-shield/__internal__/components/__tests__/SafeShieldScanner.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { clearFeatureCache } from '@/features/__contracts__'

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
  beforeEach(() => {
    // Clear the feature cache before each test
    clearFeatureCache()
  })

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

- **No context providers needed**: Module-level cache doesn't require wrapping
- **Easy mocking**: Just mock the feature module with Jest
- **Clean state**: `clearFeatureCache()` resets between tests
- **Async handling**: Use `waitFor()` to wait for lazy loading

## ESLint Enforcement

### Updated Rules

```javascript
// apps/web/eslint.config.mjs
'no-restricted-imports': [
  'error',
  {
    patterns: [
      // Block all __internal__ imports from outside the feature
      {
        group: ['@/features/*/__internal__/*', '@/features/*/__internal__/**/*'],
        message: 'Cannot import feature internals. Use the feature registry instead.',
      },
      // Block direct imports from feature subdirectories (legacy pattern)
      {
        group: [
          '@/features/*/components/*',
          '@/features/*/hooks/*',
          '@/features/*/services/*',
          '@/features/*/store/*',
        ],
        message: 'Import from feature index or use feature registry.',
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
import { useInternalHook } from '@/features/my-feature/__internal__/hooks'
import { InternalComponent } from '@/features/my-feature/__internal__/components'
```

## Migration Guide

### Phase 1: Add Infrastructure

1. Create `src/features/__contracts__/types.ts` with base contract types
2. Create `src/features/__contracts__/useLoadFeature.ts` with the loading hook
3. Update ESLint rules (keep as warnings initially)

### Phase 2: Migrate Features (One at a Time)

For each feature:

1. **Determine tier** (Minimal, Standard, or Full)
2. **Create contract.ts** defining the feature's public API type
3. **Create handle.ts** with static flag + lazy load function
4. **Create index.ts** exporting `{FeatureName}Feature` from handle
5. **Move internals** to `__internal__/` folder
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
// src/features/safe-shield/__internal__/components/SafeShieldScanner.tsx
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__contracts__'

function SafeShieldScanner() {
  // Type inferred from HypernativeFeature, null if disabled or loading
  const hypernative = useLoadFeature(HypernativeFeature)

  if (!hypernative) return null

  return <hypernative.components.Banner />
}
```

## Checklist

### For New Features

- [ ] Determined feature tier (Minimal/Standard/Full)
- [ ] Created `contract.ts` with typed contract interface
- [ ] Created `handle.ts` with static `useIsEnabled` + lazy `load()` function
- [ ] Created `index.ts` exporting `{FeatureName}Feature` from handle
- [ ] Placed all implementation in `__internal__/` (if Standard or Full tier)
- [ ] Created `types.ts` for public types (if needed)
- [ ] No direct imports of other features' internals
- [ ] All cross-feature communication via Redux or feature handles

### For Existing Features (Migration)

- [ ] Created `contract.ts`
- [ ] Created `handle.ts`
- [ ] Created `index.ts` with `{FeatureName}Feature` export
- [ ] Moved internals to `__internal__/`
- [ ] Updated all external consumers to use `useLoadFeature()`
- [ ] Removed barrel file exports of internals
- [ ] Verified no ESLint warnings
- [ ] Tests pass

### For Feature Consumers

- [ ] Using `useLoadFeature()` hook with feature handle
- [ ] Handling `null` return (feature disabled or loading)
- [ ] Type-safe (types inferred from handle)
- [ ] No direct imports from `__internal__/`

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
import { useLoadFeature } from '@/features/__contracts__'

const feature = useLoadFeature(WalletConnectFeature)
// Returns:
// - null if feature flag is disabled
// - null if feature flag is loading (undefined)
// - the full feature contract if enabled and loaded
```

This means one simple null check handles all cases:

```typescript
if (!feature) return null // Not available (any reason)
// Feature is enabled and ready to use
```

### Q: How do I share types between features?

Import types directly from `types.ts` - this is always allowed:

```typescript
import type { SafeSetup } from '@/features/multichain/types'
```

### Q: What about testing internal components?

Test files inside `__internal__/` can import from the same `__internal__/` directory. External tests should mock the feature module.

### Q: How does lazy loading work?

Components in the feature implementation should use `withSuspense` to wrap lazy components:

```typescript
// __internal__/feature.ts
import { lazy } from 'react'
import { withSuspense } from '@/features/__contracts__'

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
