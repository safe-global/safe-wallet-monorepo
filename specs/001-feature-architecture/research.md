# Research: Feature Architecture Standard

**Date**: 2026-01-08
**Feature**: 001-feature-architecture

## Research Areas

1. ESLint import restriction patterns
2. Next.js lazy loading best practices
3. Feature flag isolation patterns
4. Existing walletconnect structure analysis

---

## 1. ESLint Import Restriction Patterns

### Decision: Use `no-restricted-imports` rule (native ESLint)

### Rationale

The native ESLint `no-restricted-imports` rule supports pattern matching without requiring additional plugins. The existing `eslint.config.mjs` uses flat config format, making it straightforward to add the rule.

### Alternatives Considered

| Alternative                                       | Pros                                        | Cons                                       | Decision                    |
| ------------------------------------------------- | ------------------------------------------- | ------------------------------------------ | --------------------------- |
| `eslint-plugin-import` with `no-internal-modules` | Purpose-built for this use case             | Adds new dependency; complex configuration | Rejected - adds complexity  |
| Native `no-restricted-imports`                    | No new dependency; built-in pattern support | Requires regex patterns                    | **Selected**                |
| Custom ESLint plugin                              | Maximum flexibility                         | High maintenance burden                    | Rejected - over-engineering |

### Implementation Pattern

```javascript
// In eslint.config.mjs
{
  rules: {
    'no-restricted-imports': ['warn', {
      patterns: [
        {
          group: ['@/features/*/components/*', '@/features/*/hooks/*', '@/features/*/services/*', '@/features/*/store/*'],
          message: 'Import from feature index file only (e.g., @/features/walletconnect). Internal imports are not allowed.'
        },
        {
          group: ['../features/*/components/*', '../features/*/hooks/*', '../features/*/services/*', '../features/*/store/*'],
          message: 'Import from feature index file only. Internal imports are not allowed.'
        }
      ]
    }]
  }
}
```

### Migration Strategy

1. Add rule with `'warn'` severity during migration phase
2. Change to `'error'` after all 21 features migrated
3. Rule change tracked in a dedicated commit

---

## 2. Next.js Lazy Loading Best Practices

### Decision: Use `dynamic()` with `{ ssr: false }` for features with browser-only APIs

### Rationale

Next.js `dynamic()` is already used throughout the codebase (verified in `apps/web/src/features/walletconnect/components/index.tsx`). This provides:

- Automatic code splitting
- SSR control
- Loading state handling

### Existing Pattern Analysis

Current usage in walletconnect:

```typescript
// apps/web/src/features/walletconnect/components/index.tsx
import dynamic from 'next/dynamic'
const WalletConnectUi = dynamic(() => import('./WalletConnectUi'))
export default WalletConnectUi
```

### Recommended Pattern

```typescript
// Feature index.ts (public API)
import dynamic from 'next/dynamic'

// Lazy-loaded main component
const FeatureWidget = dynamic(() => import('./components/FeatureWidget'), {
  ssr: false, // For browser-only features (WalletConnect, Web3, etc.)
  loading: () => null, // Return nothing while loading (feature flag pattern)
})

// Re-export types (tree-shakeable)
export type { FeatureConfig, FeatureState } from './types'

// Re-export hooks for consumers
export { useIsFeatureEnabled } from './hooks'

// Default export is the lazy-loaded component
export default FeatureWidget
```

### Bundle Verification

Verify code splitting with:

```bash
yarn workspace @safe-global/web build
# Check .next/static/chunks/ for feature-specific chunks
```

---

## 3. Feature Flag Isolation Patterns

### Decision: Feature flag check at entry point + conditional rendering

### Rationale

The existing `useHasFeature` hook and `FEATURES` enum provide sufficient infrastructure. Each feature needs:

1. A `useIs{FeatureName}Enabled` hook (wraps `useHasFeature`)
2. Entry point renders `null` when disabled
3. No side effects (useEffect, API calls) execute when disabled

### Pattern Analysis

Current patterns vary across features:

| Feature         | Has useIsEnabled Hook                 | Lazy Loaded | Flag Check Location |
| --------------- | ------------------------------------- | ----------- | ------------------- |
| `walletconnect` | ❌ No (uses useHasFeature directly)   | ✅ Yes      | Consumer level      |
| `stake`         | ✅ Yes (`useIsStakingFeatureEnabled`) | ✅ Yes      | Consumer level      |
| `bridge`        | ✅ Yes (`useIsBridgeFeatureEnabled`)  | ✅ Yes      | Consumer level      |
| `recovery`      | ✅ Yes (`useIsRecoveryEnabled`)       | ✅ Yes      | Consumer level      |

### Recommended Pattern

```typescript
// hooks/useIsWalletConnectEnabled.ts
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsWalletConnectEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.NATIVE_WALLETCONNECT)
}

// Usage in consumer (page or component)
const WalletConnectWidget = dynamic(() => import('@/features/walletconnect'), { ssr: false })

function MyComponent() {
  const isEnabled = useIsWalletConnectEnabled()

  // Render nothing if disabled or loading
  if (!isEnabled) return null

  return <WalletConnectWidget />
}
```

### Side Effect Prevention

Features MUST NOT:

- Call APIs in module scope
- Initialize services outside of React lifecycle
- Dispatch Redux actions at import time

Features SHOULD:

- Defer all initialization to component mount
- Guard useEffect with feature flag check
- Use conditional hook patterns sparingly (prefer conditional rendering)

---

## 4. Existing Walletconnect Structure Analysis

### Current Structure

```
walletconnect/
├── __tests__/
│   └── WalletConnectContext.test.tsx
├── components/
│   ├── index.tsx                    # ✅ Barrel file exists
│   ├── WalletConnectUi/
│   ├── WcChainSwitchModal/
│   │   ├── index.tsx
│   │   └── store.ts                 # ⚠️ Store inside component
│   ├── WcConnectionForm/
│   ├── WcConnectionState/
│   ├── WcErrorMessage/
│   ├── WcHeaderWidget/
│   ├── WcHints/
│   ├── WcInput/
│   ├── WcLogoHeader/
│   ├── WcProposalForm/
│   ├── WcSessionList/
│   └── WcSessionManager/
├── hooks/
│   ├── __tests__/
│   ├── useWalletConnectClipboardUri.ts
│   ├── useWalletConnectSearchParamUri.ts
│   └── useWcUri.ts
│   # ⚠️ Missing index.ts barrel file
│   # ⚠️ Missing useIsWalletConnectEnabled.ts
├── services/
│   ├── __tests__/
│   ├── tracking.ts
│   ├── utils.ts
│   ├── walletConnectInstance.ts
│   └── WalletConnectWallet.ts
│   # ⚠️ Missing index.ts barrel file
├── constants.ts                     # ✅ Exists
└── WalletConnectContext.tsx         # ⚠️ Should be in components/ or moved to index
# ⚠️ Missing index.ts (feature root)
# ⚠️ Missing types.ts
# ⚠️ Missing store/ directory (store is in component subdirectory)
```

### Migration Requirements

| Item                        | Current State | Required State     | Effort |
| --------------------------- | ------------- | ------------------ | ------ |
| Root `index.ts`             | ❌ Missing    | Public API barrel  | Low    |
| `types.ts`                  | ❌ Missing    | All interfaces     | Medium |
| `hooks/index.ts`            | ❌ Missing    | Hook exports       | Low    |
| `services/index.ts`         | ❌ Missing    | Service exports    | Low    |
| `store/` directory          | In component  | Separate directory | Medium |
| `useIsWalletConnectEnabled` | ❌ Missing    | New hook           | Low    |
| `WalletConnectContext.tsx`  | Root level    | Move to components | Low    |

### Estimated Migration Effort: Medium (4-6 hours)

---

## Summary of Decisions

| Area                | Decision                                               |
| ------------------- | ------------------------------------------------------ |
| ESLint enforcement  | Native `no-restricted-imports` rule with patterns      |
| Lazy loading        | `dynamic()` with `{ ssr: false }` for browser features |
| Feature flag        | `useIs{Feature}Enabled` hook + entry point check       |
| Bundle verification | Build analysis of `.next/static/chunks/`               |
| Migration severity  | Warnings during migration → Errors after completion    |

## Next Steps

1. Create `data-model.md` defining the standard feature structure
2. Create `quickstart.md` with step-by-step feature creation/migration guide
3. Create `contracts/` with TypeScript interfaces for feature public APIs
