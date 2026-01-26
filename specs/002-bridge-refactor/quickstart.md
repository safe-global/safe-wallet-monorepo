# Quickstart: Bridge Feature Refactor

**Feature**: 002-bridge-refactor  
**Date**: 2026-01-15

## Prerequisites

- Node.js and Yarn 4 installed
- Repository cloned and dependencies installed (`yarn install`)
- On the feature branch (`002-bridge-refactor`)

## Implementation Order

Follow this sequence to minimize broken state during refactoring:

### Step 1: Create Barrel Files (No Breaking Changes)

Create the new barrel files without modifying existing code:

```bash
# Create the new files
touch apps/web/src/features/bridge/index.ts
touch apps/web/src/features/bridge/types.ts
touch apps/web/src/features/bridge/constants.ts
touch apps/web/src/features/bridge/components/index.ts
touch apps/web/src/features/bridge/hooks/index.ts
```

### Step 2: Populate Constants

Move constants from components to `constants.ts`:

1. Copy `BRIDGE_WIDGET_URL` from `components/BridgeWidget/index.tsx`
2. Copy `LOCAL_STORAGE_CONSENT_KEY` from `components/Bridge/index.tsx`

### Step 3: Populate Hook Barrel

Export hooks from `hooks/index.ts`:

```typescript
export { useIsBridgeFeatureEnabled } from './useIsBridgeFeatureEnabled'
export { useIsGeoblockedFeatureEnabled } from './useIsGeoblockedFeatureEnabled'
```

### Step 4: Populate Component Barrel

Export components from `components/index.ts`:

```typescript
export { Bridge } from './Bridge'
export { BridgeWidget } from './BridgeWidget'
```

### Step 5: Populate Root Barrel

Create the public API in `index.ts` with lazy-loaded default export.

### Step 6: Update Internal Imports

Update components to import from `constants.ts` instead of defining inline.

### Step 7: Update External Imports

Update files outside the feature to use the public API:

- `pages/bridge.tsx`
- `services/analytics/tx-tracking.ts`

### Step 8: Verify

Run all checks:

```bash
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web test --testPathPattern=bridge
yarn workspace @safe-global/web build
```

## Key Files Reference

### Public API (`index.ts`)

```typescript
import dynamic from 'next/dynamic'

export type {} from './types'
export { useIsBridgeFeatureEnabled, useIsGeoblockedFeatureEnabled } from './hooks'
export { BRIDGE_WIDGET_URL, LOCAL_STORAGE_CONSENT_KEY } from './constants'

const Bridge = dynamic(() => import('./components/Bridge').then((mod) => ({ default: mod.Bridge })), { ssr: false })

export default Bridge
```

### Constants (`constants.ts`)

```typescript
export const BRIDGE_WIDGET_URL = 'https://iframe.jumper.exchange/bridge'
export const LOCAL_STORAGE_CONSENT_KEY = 'bridgeConsent'
```

### Hooks Barrel (`hooks/index.ts`)

```typescript
export { useIsBridgeFeatureEnabled } from './useIsBridgeFeatureEnabled'
export { useIsGeoblockedFeatureEnabled } from './useIsGeoblockedFeatureEnabled'
```

### Components Barrel (`components/index.ts`)

```typescript
export { Bridge } from './Bridge'
export { BridgeWidget } from './BridgeWidget'
```

## Verification Checklist

After implementation:

- [ ] All new files created per target structure
- [ ] No TypeScript errors (`yarn workspace @safe-global/web type-check`)
- [ ] No ESLint warnings for internal imports (`yarn workspace @safe-global/web lint`)
- [ ] All bridge tests pass (`yarn workspace @safe-global/web test --testPathPattern=bridge`)
- [ ] Build succeeds (`yarn workspace @safe-global/web build`)
- [ ] Bridge chunk visible in `.next/static/chunks/`

## Rollback

If issues arise, the refactoring can be reverted by:

1. Deleting the new barrel files
2. Restoring original imports in modified files
3. The feature will work as before since no logic was changed

## Common Issues

### Import Cycle Errors

If you see import cycle warnings, ensure:

- Components import constants from `../../constants`, not from sibling components
- The root `index.ts` only imports from barrel files, not individual files

### Test Import Errors

The test file `BridgeWidget/index.test.tsx` imports `_getAppData` directly. This is acceptable since:

- It's within the feature boundary
- The underscore prefix indicates it's internal
- ESLint rules only restrict imports from _outside_ the feature
