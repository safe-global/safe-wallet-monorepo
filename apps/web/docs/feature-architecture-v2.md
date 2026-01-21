# Feature Architecture Standard v2

This document defines the revised architecture pattern for features in the Safe{Wallet} web application. It addresses tight coupling, unclear boundaries, testing difficulties, and circular import issues through **Feature Contracts**, a **Feature Registry**, and **tiered structure**.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Feature Contract](#feature-contract)
- [Feature Registry](#feature-registry)
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
- Registers itself with the **Feature Registry** for discovery
- Follows one of three **tiers** based on complexity
- Has explicit **public** and **internal** boundaries
- Communicates with other features via **Redux** (data) or **Registry** (components/hooks/services)

### Key Principles

1. **Contract-First**: Every feature defines what it exposes through a typed contract
2. **Loose Coupling**: Features discover each other through the registry, not direct imports
3. **Tiered Complexity**: Simple features stay simple; complex features have structure
4. **Testability**: DI through registry enables isolated testing without circular imports

### Problems This Architecture Solves

| Problem                              | Solution                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| Tight coupling between features      | Feature Registry for discovery instead of direct imports |
| Unclear boundaries                   | Feature Contract defines exactly what's public           |
| Testing difficulties                 | Registry can be mocked; no import cycles                 |
| Circular imports in Jest             | No inter-feature imports; registry lookup at runtime     |
| Forced structure for simple features | Three tiers: Minimal, Standard, Full                     |
| No DI mechanism                      | Feature Registry provides runtime lookup                 |

## Core Concepts

### What is a Feature Contract?

A **Feature Contract** is a TypeScript interface that explicitly declares what a feature exposes to the outside world. Think of it as the feature's "API surface".

### What is the Feature Registry?

The **Feature Registry** is a React Context that holds references to all **loaded** features' contracts. Features register when their code mounts; other features discover them via runtime lookup.

### Feature Handles: Static + Lazy

Each feature exposes a **handle** with two parts:

| Part                              | Bundled?   | Purpose                                    |
| --------------------------------- | ---------- | ------------------------------------------ |
| `useIsEnabled()`                  | Yes (tiny) | Flag check via `useHasFeature(FEATURES.X)` |
| `components`, `hooks`, `services` | No (lazy)  | Actual feature code, loaded on demand      |

The `useFeature()` hook combines registry lookup + flag check in one step:

```typescript
// Consumer component
function MyPage() {
  // Returns null if: not registered, disabled, or loading
  const hypernative = useFeature('hypernative')

  if (!hypernative) return null

  // Feature is enabled - safe to use lazy components
  const Banner = hypernative.components.Banner
  return (
    <Suspense fallback={<Skeleton />}>
      <Banner />
    </Suspense>
  )
}
```

**`useFeature()` return values:**
| Condition | Returns |
|-----------|---------|
| Feature not registered | `null` |
| Feature flag disabled | `null` |
| Feature flag loading (undefined) | `null` |
| Feature flag enabled | The feature handle |

### The Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. APP STARTUP: Feature handles registered (static, tiny)      │
│    <FeatureRegistryProvider initialFeatures={[...handles]} />  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONSUMER calls useFeature (combines lookup + flag check)    │
│    const hypernative = useFeature('hypernative')               │
│    // Returns null if disabled, handle if enabled              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ if not null
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONSUMER renders lazy component (triggers code load)        │
│    const Banner = hypernative.components.Banner                │
│    return <Suspense><Banner /></Suspense>                      │
└─────────────────────────────────────────────────────────────────┘
```

### Why Not Direct Imports?

Direct imports create compile-time dependencies:

```typescript
// ❌ Direct import - creates compile-time coupling
import { useHypernativeScanner } from '@/features/hypernative/hooks'

// ✅ Registry lookup - runtime discovery, no compile-time coupling
const hypernative = useFeature<HypernativeContract>('hypernative')
const scanner = hypernative?.hooks.useScanner?.()
```

Benefits:

- No circular import issues (registry lookup happens at runtime)
- Features can be mocked entirely in tests
- Features remain truly lazy-loadable (no static imports from features)
- Clear API boundaries enforced by TypeScript

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

### Example Contracts

**Minimal Feature Contract (component only):**

```typescript
// src/features/bridge/contract.ts
import type { BaseFeatureContract, ComponentContract } from '@/features/__contracts__/types'

export interface BridgeContract extends BaseFeatureContract, ComponentContract {
  readonly name: 'bridge'
  useIsEnabled: () => boolean | undefined // Static flag check
  components: {
    Bridge: React.LazyExoticComponent<React.ComponentType> // Lazy
    BridgeWidget: React.LazyExoticComponent<React.ComponentType> // Lazy
  }
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

## Feature Registry

The registry provides runtime feature discovery without compile-time imports.

### Registry Implementation

```typescript
// src/features/__registry__/FeatureRegistry.tsx
import { createContext, useContext, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { FeatureContract } from '@/features/__contracts__/types'

interface FeatureRegistryContextValue {
  register: <T extends FeatureContract>(contract: T) => () => void
  get: <T extends FeatureContract>(name: string) => T | undefined
  getAll: () => Map<string, FeatureContract>
}

const FeatureRegistryContext = createContext<FeatureRegistryContextValue | null>(null)

export function FeatureRegistryProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef(new Map<string, FeatureContract>())
  const subscribersRef = useRef(new Set<() => void>())

  const register = useCallback(<T extends FeatureContract>(contract: T) => {
    registryRef.current.set(contract.name, contract)
    subscribersRef.current.forEach((cb) => cb())

    // Return unregister function
    return () => {
      registryRef.current.delete(contract.name)
      subscribersRef.current.forEach((cb) => cb())
    }
  }, [])

  const get = useCallback(<T extends FeatureContract>(name: string): T | undefined => {
    return registryRef.current.get(name) as T | undefined
  }, [])

  const getAll = useCallback(() => {
    return new Map(registryRef.current)
  }, [])

  const value = useMemo(() => ({ register, get, getAll }), [register, get, getAll])

  return (
    <FeatureRegistryContext.Provider value={value}>
      {children}
    </FeatureRegistryContext.Provider>
  )
}

/**
 * Hook to access the feature registry
 */
export function useFeatureRegistry(): FeatureRegistryContextValue {
  const context = useContext(FeatureRegistryContext)
  if (!context) {
    throw new Error('useFeatureRegistry must be used within FeatureRegistryProvider')
  }
  return context
}

/**
 * Hook to get a specific feature's contract
 */
export function useFeature<T extends FeatureContract>(name: string): T | undefined {
  const registry = useFeatureRegistry()
  return registry.get<T>(name)
}

/**
 * Hook to register a feature (call in feature's provider/entry component)
 */
export function useRegisterFeature<T extends FeatureContract>(contract: T): void {
  const registry = useFeatureRegistry()

  useEffect(() => {
    return registry.register(contract)
  }, [registry, contract])
}
```

### Using the Registry

**Feature Handle Definition (tiny, static file):**

```typescript
// src/features/walletconnect/handle.ts
// This file is SMALL - only flag lookup + lazy import references
import { lazy } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { WalletConnectContract } from './contract'

export const walletConnectHandle: WalletConnectContract = {
  name: 'walletconnect',

  // STATIC: Just a flag lookup, no heavy imports
  useIsEnabled: () => useHasFeature(FEATURES.NATIVE_WALLETCONNECT),

  // LAZY: These only load when the component is rendered
  components: {
    WalletConnectWidget: lazy(() => import('./__internal__/components/WalletConnectWidget')),
    WcSessionManager: lazy(() => import('./__internal__/components/WcSessionManager')),
  },

  // LAZY: Hooks are wrapped - internal code loads on first call
  hooks: {
    useWcUri: () => {
      const { useWcUri } = require('./__internal__/hooks/useWcUri')
      return useWcUri()
    },
  },

  // LAZY: Services load on first access
  services: {
    connect: async (uri: string) => {
      const { walletConnectService } = await import('./__internal__/services/walletConnectService')
      return walletConnectService.connect(uri)
    },
  },
}
```

**App Startup Registration:**

```typescript
// src/features/registry.ts
// All handles are imported here - they're tiny (just flag + lazy refs)
import { walletConnectHandle } from '@/features/walletconnect/handle'
import { hypernativeHandle } from '@/features/hypernative/handle'
import { bridgeHandle } from '@/features/bridge/handle'
// ... other handles

export const featureHandles = [
  walletConnectHandle,
  hypernativeHandle,
  bridgeHandle,
  // ... other handles
]

// In _app.tsx or layout
import { featureHandles } from '@/features/registry'

function App({ children }) {
  return (
    <FeatureRegistryProvider initialFeatures={featureHandles}>
      {children}
    </FeatureRegistryProvider>
  )
}
```

**Feature Consumption:**

```typescript
// src/features/safe-shield/__internal__/components/SafeShieldScanner.tsx
import { Suspense } from 'react'
import { useFeature } from '@/features/__registry__'
import type { HypernativeContract } from '@/features/hypernative/contract'

function SafeShieldScanner() {
  // Returns null if hypernative is disabled or not registered
  const hypernative = useFeature<HypernativeContract>('hypernative')

  if (!hypernative) return null

  // Feature is enabled - render lazy component
  const Scanner = hypernative.components.Scanner

  return (
    <Suspense fallback={<Skeleton />}>
      <Scanner />
    </Suspense>
  )
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
import type { MyFeatureContract } from './contract'

export const myFeatureHandle: MyFeatureContract = {
  name: 'my-feature',

  // STATIC: Just a flag lookup - this is bundled, not lazy
  useIsEnabled: () => useHasFeature(FEATURES.MY_FEATURE),

  // LAZY: Components load when rendered
  components: {
    Widget: lazy(() => import('./__internal__/components/Widget')),
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

### For Components/Hooks/Services: Use Registry

Features access other features' **capabilities** through the registry:

```typescript
import { Suspense } from 'react'

function MyComponent() {
  // Get feature (null if disabled or not registered)
  const walletConnect = useFeature<WalletConnectContract>('walletconnect')

  if (!walletConnect) return null

  // Use its hooks (lazy, loads on call)
  const uri = walletConnect.hooks.useWcUri()

  // Use its services (lazy, loads on call)
  const handleConnect = () => walletConnect.services.connect(uri)

  // Render its components (lazy, loads when rendered)
  const WcWidget = walletConnect.components.WalletConnectWidget
  return WcWidget ? <WcWidget /> : null
}
```

### Communication Patterns Summary

| Need                               | Pattern             | Example                                        |
| ---------------------------------- | ------------------- | ---------------------------------------------- |
| Get feature if enabled             | `useFeature()`      | `const x = useFeature('x')` (null if disabled) |
| Render another feature's component | Registry + Suspense | `<Suspense><x.components.Widget /></Suspense>` |
| Use another feature's hook         | Registry lookup     | `x.hooks.useY()`                               |
| Call another feature's service     | Registry lookup     | `x.services.doY()`                             |
| Read shared state                  | Redux selector      | `useSelector(selectSafeInfo)`                  |
| Write shared state                 | Redux action        | `dispatch(setSafeInfo(data))`                  |
| Share types                        | Direct import       | `import type { X } from '@/features/y/types'`  |

## Testing Strategy

The registry pattern makes testing significantly easier.

### Unit Testing a Feature

```typescript
// src/features/safe-shield/__internal__/components/__tests__/SafeShieldScanner.test.tsx
import { render, screen } from '@testing-library/react'
import { FeatureRegistryProvider, createMockFeatureContract } from '@/features/__registry__'
import SafeShieldScanner from '../SafeShieldScanner'

// Mock the hypernative feature handle
const mockHypernative = createMockFeatureContract('hypernative', {
  useIsEnabled: () => true,
  components: {
    Scanner: () => <div data-testid="scanner">Mocked Scanner</div>,
  },
})

// Test wrapper with mock features
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FeatureRegistryProvider initialFeatures={[mockHypernative]}>
      {children}
    </FeatureRegistryProvider>
  )
}

describe('SafeShieldScanner', () => {
  it('renders hypernative scanner when enabled', () => {
    render(<SafeShieldScanner />, { wrapper: TestWrapper })
    expect(screen.getByTestId('scanner')).toBeInTheDocument()
  })

  it('renders nothing when hypernative is disabled', () => {
    const disabledHypernative = createMockFeatureContract('hypernative', {
      useIsEnabled: () => false,
    })

    render(<SafeShieldScanner />, {
      wrapper: ({ children }) => (
        <FeatureRegistryProvider initialFeatures={[disabledHypernative]}>
          {children}
        </FeatureRegistryProvider>
      ),
    })

    expect(screen.queryByTestId('scanner')).not.toBeInTheDocument()
  })

  it('renders nothing when hypernative not registered', () => {
    render(<SafeShieldScanner />, {
      wrapper: ({ children }) => (
        <FeatureRegistryProvider>{children}</FeatureRegistryProvider>
      )
    })
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })
})
```

### Integration Testing

```typescript
// Test with real feature handles
import { walletConnectHandle } from '@/features/walletconnect/handle'
import { hypernativeHandle } from '@/features/hypernative/handle'

function IntegrationTestWrapper({ children }) {
  return (
    <FeatureRegistryProvider initialFeatures={[walletConnectHandle, hypernativeHandle]}>
      {children}
    </FeatureRegistryProvider>
  )
}
```

### Why This Solves Circular Imports

**Before (direct imports):**

```
Feature A imports from Feature B's internals
Feature B imports from Feature A's internals
→ Circular dependency at compile time
→ Jest module resolution breaks
```

**After (registry):**

```
Feature A registers itself
Feature B registers itself
Feature A looks up Feature B at runtime
Feature B looks up Feature A at runtime
→ No compile-time dependency
→ Jest works correctly
```

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
// ✅ Allowed: Feature handle (for registration in registry.ts)
import { myFeatureHandle } from '@/features/my-feature/handle'

// ✅ Allowed: Contract type (for type-safe registry lookup)
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
2. Create `src/features/__registry__/` with FeatureRegistry implementation
3. Add FeatureRegistryProvider to app root
4. Update ESLint rules (keep as warnings initially)

### Phase 2: Migrate Features (One at a Time)

For each feature:

1. **Determine tier** (Minimal, Standard, or Full)
2. **Create contract.ts** defining the feature's public API type
3. **Create handle.ts** with static flag + lazy component/hook refs
4. **Move internals** to `__internal__/` folder
5. **Register handle** in `src/features/registry.ts`
6. **Update consumers** to use registry lookup instead of direct imports
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

**After (registry lookup - loose coupling):**

```typescript
// src/features/safe-shield/__internal__/components/SafeShieldScanner.tsx
import { Suspense } from 'react'
import { useFeature } from '@/features/__registry__'
import type { HypernativeContract } from '@/features/hypernative/contract'

function SafeShieldScanner() {
  // null if hypernative is disabled or not registered
  const hypernative = useFeature<HypernativeContract>('hypernative')

  if (!hypernative) return null

  const Banner = hypernative.components.Banner

  return (
    <Suspense fallback={<Skeleton />}>
      <Banner />
    </Suspense>
  )
}
```

## Checklist

### For New Features

- [ ] Determined feature tier (Minimal/Standard/Full)
- [ ] Created `contract.ts` with typed contract interface
- [ ] Created `handle.ts` with static `useIsEnabled` + lazy component/hook refs
- [ ] Placed all implementation in `__internal__/` (if Standard or Full tier)
- [ ] Created `types.ts` for public types (if needed)
- [ ] Added handle to `src/features/registry.ts`
- [ ] No direct imports of other features' internals
- [ ] All cross-feature communication via Redux or registry

### For Existing Features (Migration)

- [ ] Created `contract.ts`
- [ ] Created `handle.ts`
- [ ] Moved internals to `__internal__/`
- [ ] Registered handle in `src/features/registry.ts`
- [ ] Updated all external consumers to use registry
- [ ] Removed barrel file exports of internals
- [ ] Verified no ESLint warnings
- [ ] Tests pass without circular import issues

### For Feature Consumers

- [ ] Using `useFeature()` hook for cross-feature access
- [ ] Handling `null` return (feature disabled or not registered)
- [ ] Wrapping lazy components in `<Suspense>`
- [ ] Type-safe with proper contract type parameter
- [ ] No direct imports from `__internal__/`

## FAQ

### Q: Can I still use Redux for feature state?

Yes. Redux remains the standard for shared application state. The registry handles discovery of feature capabilities (components, hooks, services), while Redux handles data flow.

### Q: What's the difference between a handle and a contract?

- **Contract** (`contract.ts`): TypeScript interface that defines the shape of the feature's public API
- **Handle** (`handle.ts`): Runtime object that implements the contract with actual code

The contract is for type safety; the handle is what gets registered in the registry.

### Q: When does feature code actually load?

Handles are registered at app startup, but they're tiny (just flag lookups + lazy import references). The actual feature code loads when:

1. A lazy **component** is first rendered (inside `<Suspense>`)
2. A lazy **hook** is first called
3. A lazy **service** method is first invoked

### Q: What does `useFeature()` return?

`useFeature()` combines registry lookup + feature flag check:

```typescript
const feature = useFeature<MyContract>('my-feature')
// Returns:
// - null if feature not registered
// - null if feature flag is disabled
// - null if feature flag is loading (undefined)
// - the feature handle if enabled
```

This means one simple null check handles all cases:

```typescript
if (!feature) return null // Not available (any reason)
// Feature is enabled and ready to use
```

### Q: What if I need the handle even when disabled?

Use `useFeatureHandle()` instead - it returns the raw handle without checking the flag:

```typescript
const handle = useFeatureHandle<MyContract>('my-feature')
// Returns undefined if not registered, but ignores flag state
```

### Q: How do I share types between features?

Import types directly from `types.ts` - this is always allowed:

```typescript
import type { SafeSetup } from '@/features/multichain/types'
```

### Q: What about testing internal components?

Test files inside `__internal__/` can import from the same `__internal__/` directory. External tests should use the registry.

### Q: How does lazy loading work with the registry?

Components in the contract can be lazy-loaded:

```typescript
const contract = {
  components: {
    Widget: lazy(() => import('./__internal__/components/Widget')),
  },
}
```

The component is only loaded when first rendered.

## Reference Implementations

After migration, see these features as examples:

- **Tier 1 (Minimal)**: `src/features/bridge/`
- **Tier 2 (Standard)**: `src/features/multichain/`
- **Tier 3 (Full)**: `src/features/walletconnect/`
