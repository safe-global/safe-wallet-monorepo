# Quickstart Guide: Earn Feature

**Feature**: 002-refactor-earn-feature  
**Date**: 2026-01-15  
**Audience**: Developers working with or modifying the earn feature

---

## Overview

The earn feature enables Safe{Wallet} users to access staking and earning opportunities through the Kiln DeFi widget. This guide covers how to work with the refactored earn feature following the standard architecture pattern.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Using the Earn Feature](#using-the-earn-feature)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Import the Earn Feature

```typescript
// ✅ CORRECT: Import from public API
import { EarnButton, useIsEarnFeatureEnabled } from '@/features/earn'
import type { EarnButtonProps } from '@/features/earn'

// ❌ WRONG: Deep imports (will break)
import EarnButton from '@/features/earn/components/EarnButton'
import useIsEarnFeatureEnabled from '@/features/earn/hooks/useIsEarnFeatureEnabled'
```

### Folder Structure

```
apps/web/src/features/earn/
├── index.ts                          # Public API (START HERE)
├── types.ts                          # TypeScript interfaces
├── constants.ts                      # Feature constants
├── components/
│   ├── index.ts                      # Component barrel export
│   ├── EarnPage/                     # Main component (default export)
│   ├── EarnButton/                   # Public component
│   └── [internal components]/        # Not exported
├── hooks/
│   ├── index.ts                      # Hook barrel export
│   ├── useIsEarnFeatureEnabled.ts    # Public hook
│   └── useGetWidgetUrl.ts            # Internal hook
└── services/
    ├── index.ts                      # Service barrel export
    └── utils.ts                      # Internal utilities
```

### Key Files

| File                               | Purpose                       | Exported?          |
| ---------------------------------- | ----------------------------- | ------------------ |
| `index.ts`                         | Public API barrel file        | -                  |
| `types.ts`                         | TypeScript interfaces         | Yes (public types) |
| `constants.ts`                     | Feature constants             | No (internal only) |
| `components/EarnButton/`           | Button for navigating to earn | Yes                |
| `components/EarnPage/`             | Main page component           | Yes (default)      |
| `hooks/useIsEarnFeatureEnabled.ts` | Feature flag check            | Yes                |
| `hooks/useGetWidgetUrl.ts`         | Widget URL generator          | No (internal)      |
| `services/utils.ts`                | Utility functions             | No (internal)      |

---

## Using the Earn Feature

### 1. Adding an Earn Button to Your Component

Use the `EarnButton` component to provide users a way to access the earn feature with a pre-selected asset.

```typescript
import { EarnButton } from '@/features/earn'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

function MyAssetRow({ balance }: { balance: Balance }) {
  return (
    <div>
      <span>{balance.tokenInfo.name}</span>

      <EarnButton
        tokenInfo={balance.tokenInfo}
        trackingLabel={EARN_LABELS.dashboard_asset}
        compact={true}      // Text button style
        onlyIcon={false}    // Show text, not just icon
      />
    </div>
  )
}
```

**Props**:

- `tokenInfo`: Token data from balance object (required)
- `trackingLabel`: Analytics label (required) - use values from `EARN_LABELS` enum
- `compact`: Boolean for button style (optional, default: `true`)
- `onlyIcon`: Boolean to show only icon (optional, default: `false`)

### 2. Checking if Earn is Enabled

Use the `useIsEarnFeatureEnabled` hook to conditionally show earn-related UI.

```typescript
import { useIsEarnFeatureEnabled } from '@/features/earn'

function MyComponent() {
  const isEarnEnabled = useIsEarnFeatureEnabled()

  // Handle loading state
  if (isEarnEnabled === undefined) {
    return null // or <Skeleton />
  }

  // Handle disabled state
  if (isEarnEnabled === false) {
    return <p>Earn feature not available</p>
  }

  // Feature is enabled
  return <EarnButton {...props} />
}
```

**Return Values**:

- `undefined`: Loading (chain config not fetched yet) → render nothing
- `false`: Disabled (feature flag off OR country blocked) → hide earn UI
- `true`: Enabled → show earn UI

### 3. Lazy Loading the Earn Page

The earn page should be lazy-loaded to enable code splitting.

```typescript
import dynamic from 'next/dynamic'
import { useIsEarnFeatureEnabled } from '@/features/earn'

const LazyEarnPage = dynamic(() => import('@/features/earn'), { ssr: false })

function EarnPage() {
  const isFeatureEnabled = useIsEarnFeatureEnabled()

  return (
    <>
      {isFeatureEnabled === true ? (
        <LazyEarnPage />
      ) : isFeatureEnabled === false ? (
        <p>Earn is not available on this network.</p>
      ) : null}
    </>
  )
}
```

---

## Development Workflow

### Running the App

```bash
# Start development server
yarn workspace @safe-global/web dev

# Navigate to earn page
# http://localhost:3000/earn
```

### Type Checking

```bash
# Run TypeScript type checker
yarn workspace @safe-global/web type-check
```

### Linting

```bash
# Run linter
yarn workspace @safe-global/web lint

# Auto-fix linting issues
yarn workspace @safe-global/web lint:fix
```

### Formatting

```bash
# Check formatting
yarn workspace @safe-global/web prettier

# Auto-fix formatting
yarn prettier:fix
```

### Testing

```bash
# Run all tests
yarn workspace @safe-global/web test

# Run tests in watch mode
yarn workspace @safe-global/web test --watch

# Run tests with coverage
yarn workspace @safe-global/web test:coverage
```

---

## Testing

### Manual Testing Checklist

Since the earn feature currently lacks automated tests, use this manual testing checklist:

#### Feature Flag Behavior

- [ ] Navigate to a chain with earn enabled (Ethereum mainnet, Base)
- [ ] Verify earn page loads and shows disclaimer or widget
- [ ] Navigate to a chain with earn disabled (Sepolia)
- [ ] Verify earn page shows "not available" message
- [ ] Verify no earn code is loaded when feature is disabled (DevTools Network tab)

#### Consent Flow

- [ ] Clear localStorage (`lendDisclaimerAcceptedV1`)
- [ ] Navigate to `/earn`
- [ ] Verify disclaimer is shown
- [ ] Click "Continue" button
- [ ] Verify widget loads
- [ ] Refresh page
- [ ] Verify widget loads directly (disclaimer not shown again)

#### Info Panel Flow

- [ ] Clear localStorage (`hideEarnInfoV2`)
- [ ] Accept disclaimer (if needed)
- [ ] Verify info panel is shown
- [ ] Click "Get Started" button
- [ ] Verify widget loads
- [ ] Refresh page
- [ ] Verify widget loads directly (info panel not shown again)

#### Asset Selection

- [ ] Navigate to balances page
- [ ] Click "Earn" button on WETH asset
- [ ] Verify navigation to `/earn?asset_id=1_0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- [ ] Verify Kiln widget pre-selects WETH
- [ ] Navigate directly to `/earn` (no query param)
- [ ] Verify widget loads without pre-selected asset

#### Geoblocking

- [ ] **Note**: Difficult to test without VPN/proxy
- [ ] If geoblocked country detected, verify appropriate message shows
- [ ] Verify earn feature does not load for blocked countries

#### Blocked Address

- [ ] **Note**: Requires access to blocked address
- [ ] If address is blocked, verify blocked address message shows
- [ ] Verify widget does not load for blocked addresses

#### Theme Switching

- [ ] Load earn page in light mode
- [ ] Verify widget uses light theme
- [ ] Switch to dark mode (toggle in app header)
- [ ] Verify widget switches to dark theme

#### Analytics

- [ ] Open browser DevTools > Network tab
- [ ] Filter for analytics requests (e.g., `mixpanel`, `google-analytics`)
- [ ] Click "Earn" button on asset
- [ ] Verify `EARN_VIEWED` event fires
- [ ] Click "Get Started" in info panel
- [ ] Verify `GET_STARTED_WITH_EARN` event fires
- [ ] Click "Learn more" link
- [ ] Verify `OPEN_EARN_LEARN_MORE` event fires

---

## Common Tasks

### Adding a New Component

1. Create component directory in `components/`
2. Add component implementation in `index.tsx`
3. If component should be public, export from `components/index.ts`
4. If component should be public to external code, export from root `index.ts`

```bash
# Example: Adding EarnBanner component (internal)
mkdir -p apps/web/src/features/earn/components/EarnBanner
touch apps/web/src/features/earn/components/EarnBanner/index.tsx
```

```typescript
// components/EarnBanner/index.tsx
export default function EarnBanner() {
  return <div>Earn Banner</div>
}
```

```typescript
// components/index.ts (if internal, don't add)
// If this is for internal use only within the earn feature, don't export

// index.ts (if public, add)
export { EarnBanner } from './components'
```

### Adding a New Hook

1. Create hook file in `hooks/`
2. Export from `hooks/index.ts`
3. If hook should be public to external code, export from root `index.ts`

```typescript
// hooks/useEarnAnalytics.ts
export function useEarnAnalytics() {
  // implementation
}
```

```typescript
// hooks/index.ts
export { useIsEarnFeatureEnabled } from './useIsEarnFeatureEnabled'
export { useEarnAnalytics } from './useEarnAnalytics'
```

```typescript
// index.ts (only if public)
export { useEarnAnalytics } from './hooks'
```

### Adding a New Constant

1. Add constant to `constants.ts`
2. Constant is NOT automatically exported (internal by default)
3. If needed externally, re-export from root `index.ts`

```typescript
// constants.ts
export const NEW_CONSTANT = 'value'
```

```typescript
// index.ts (only if needed externally)
export { NEW_CONSTANT } from './constants'
```

### Adding a New Type

1. Add type to `types.ts`
2. Type is NOT automatically exported (internal by default)
3. If needed externally, re-export from root `index.ts`

```typescript
// types.ts
export interface NewType {
  field: string
}
```

```typescript
// index.ts (only if needed externally)
export type { NewType } from './types'
```

---

## Troubleshooting

### Error: "Cannot find module '@/features/earn'"

**Cause**: The feature might not be properly exported or the path alias is incorrect.

**Solution**:

1. Verify `apps/web/src/features/earn/index.ts` exists
2. Check that the file has a default export
3. Restart your development server

### Error: "Property 'EarnButton' does not exist on module '@/features/earn'"

**Cause**: The component is not exported from the public API.

**Solution**:

1. Verify `components/EarnButton/index.tsx` exports the component
2. Verify `components/index.ts` re-exports it
3. Verify root `index.ts` re-exports it

### Type Errors After Refactoring

**Cause**: Deep imports might still exist in your code.

**Solution**:

1. Search codebase for `@/features/earn/components/` (deep import pattern)
2. Replace with `@/features/earn` (public API pattern)
3. Run `yarn workspace @safe-global/web type-check` to verify

### Bundle Still Includes Earn Code When Disabled

**Cause**: Earn feature might be statically imported somewhere.

**Solution**:

1. Search codebase for `import.*@/features/earn` (not using `dynamic()`)
2. Ensure all page-level imports use `dynamic(() => import('@/features/earn'), { ssr: false })`
3. Run bundle analyzer to verify code splitting:
   ```bash
   yarn workspace @safe-global/web analyze
   ```

### Widget Not Loading

**Possible Causes**:

1. Chain is testnet but using production URL (or vice versa)
2. Asset ID format is incorrect
3. Kiln widget is down (external service)
4. CORS or iframe security policy blocking the widget

**Solution**:

1. Check browser console for errors
2. Verify widget URL in DevTools > Network tab
3. Test on a different chain (mainnet vs. testnet)
4. Check Kiln status page (if available)

### Analytics Events Not Firing

**Cause**: Analytics tracking might be misconfigured.

**Solution**:

1. Check browser console for analytics errors
2. Verify `<Track>` component is wrapping the interactive elements
3. Check DevTools > Network tab for analytics requests
4. Verify `EARN_EVENTS` constants are imported from `@/services/analytics/events/earn`

---

## Additional Resources

- **Feature Architecture Documentation**: `apps/web/docs/feature-architecture.md`
- **Reference Implementation**: `apps/web/src/features/walletconnect/`
- **Code Style Guide**: `apps/web/docs/code-style.md`
- **Analytics Events**: `apps/web/src/services/analytics/events/earn.ts`
- **Kiln Widget Documentation**: [Contact Kiln for documentation]

---

## Getting Help

- **Type Errors**: Run `yarn workspace @safe-global/web type-check` for detailed error messages
- **Lint Errors**: Run `yarn workspace @safe-global/web lint` for detailed error messages
- **Feature Not Working**: Follow the manual testing checklist above
- **Questions**: Refer to the feature architecture documentation or ask the team

---

**Last Updated**: 2026-01-15  
**Maintainers**: Safe{Wallet} Web Team
