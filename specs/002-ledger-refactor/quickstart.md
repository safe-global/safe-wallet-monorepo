# Quickstart: Ledger Feature Refactoring

**Feature**: 002-ledger-refactor  
**Date**: 2026-01-15  
**Purpose**: Fast-track guide for implementing the ledger feature refactoring

## TL;DR

Refactor the ledger feature from a 3-file flat structure to the standard feature pattern with lazy loading and proper public API. Zero functionality changes, pure structural refactoring.

**Estimated Time**: 2-3 hours  
**Difficulty**: Easy (structural refactoring, no logic changes)  
**Prerequisites**: Familiarity with TypeScript, React, Next.js dynamic imports

## Quick Reference

### What's Changing

| Aspect    | Before                    | After                               |
| --------- | ------------------------- | ----------------------------------- |
| Files     | 3 files (flat structure)  | ~10 files (organized structure)     |
| Structure | Components at root        | components/, hooks/, store/ folders |
| Exports   | Direct exports            | Lazy-loaded default export          |
| Imports   | `@/features/ledger/store` | `@/features/ledger`                 |
| Tests     | None                      | Unit tests for store + component    |
| Stories   | None                      | Storybook story                     |

### File Migration Map

```text
OLD                                    NEW
───────────────────────────────────    ───────────────────────────────────────
index.ts (3 lines)              →      index.ts (with lazy loading)
store.ts (15 lines)             →      store/ledgerHashStore.ts
                                       store/index.ts
LedgerHashComparison.tsx (65)   →      components/LedgerHashComparison/index.tsx
                                       components/LedgerHashComparison/index.test.tsx (NEW)
                                       components/LedgerHashComparison/*.stories.tsx (NEW)
                                       components/index.ts
(none)                          →      types.ts (NEW)
(none)                          →      constants.ts (NEW)
(none)                          →      hooks/index.ts (NEW, empty)
```

## Implementation Phases

### Phase 1: Create Folder Structure (5 minutes)

```bash
cd apps/web/src/features/ledger/

# Create standard folders
mkdir -p components/LedgerHashComparison
mkdir -p hooks
mkdir -p store

# Create barrel files
touch components/index.ts
touch hooks/index.ts
touch store/index.ts
touch types.ts
touch constants.ts
```

### Phase 2: Extract Constants & Types (15 minutes)

**Create `constants.ts`:**

```typescript
export const DIALOG_MAX_WIDTH = 'sm' as const
export const HASH_DISPLAY_WIDTH = '180px'
export const HASH_DISPLAY_LIMIT = 9999

export const DIALOG_TITLE = 'Compare transaction hash'
export const DIALOG_DESCRIPTION =
  'Compare this hash with the one displayed on your Ledger device before confirming the transaction.'
export const CLOSE_BUTTON_TEXT = 'Close'
```

**Create `types.ts`:**

```typescript
export type TransactionHash = string
export type LedgerHashState = TransactionHash | undefined
export type ShowHashFunction = (hash: TransactionHash) => void
export type HideHashFunction = () => void
```

### Phase 3: Move Store Files (15 minutes)

**1. Rename `store.ts` → `store/ledgerHashStore.ts`**

```bash
git mv store.ts store/ledgerHashStore.ts
```

**2. Update `store/ledgerHashStore.ts` imports:**

- No changes needed (ExternalStore import stays same)

**3. Create `store/index.ts`:**

```typescript
export { default as ledgerHashStore } from './ledgerHashStore'
export { showLedgerHashComparison, hideLedgerHashComparison } from './ledgerHashStore'
```

**4. Add tests `store/ledgerHashStore.test.ts`:**

```typescript
import { showLedgerHashComparison, hideLedgerHashComparison } from './index'
import ledgerHashStore from './ledgerHashStore'

describe('ledgerHashStore', () => {
  it('should start with undefined state', () => {
    const state = ledgerHashStore.getStore()
    expect(state).toBeUndefined()
  })

  it('should update state when showLedgerHashComparison called', () => {
    const hash = '0xabc123'
    showLedgerHashComparison(hash)
    expect(ledgerHashStore.getStore()).toBe(hash)
  })

  it('should clear state when hideLedgerHashComparison called', () => {
    showLedgerHashComparison('0xtest')
    hideLedgerHashComparison()
    expect(ledgerHashStore.getStore()).toBeUndefined()
  })

  it('should use latest hash when called multiple times', () => {
    showLedgerHashComparison('0xfirst')
    showLedgerHashComparison('0xsecond')
    expect(ledgerHashStore.getStore()).toBe('0xsecond')
  })
})
```

### Phase 4: Move Component (20 minutes)

**1. Move component file:**

```bash
git mv LedgerHashComparison.tsx components/LedgerHashComparison/index.tsx
```

**2. Update imports in `components/LedgerHashComparison/index.tsx`:**

```typescript
// OLD:
import ledgerHashStore from './store'

// NEW:
import ledgerHashStore from '../../store/ledgerHashStore'
import {
  DIALOG_TITLE,
  DIALOG_DESCRIPTION,
  CLOSE_BUTTON_TEXT,
  HASH_DISPLAY_WIDTH,
  HASH_DISPLAY_LIMIT,
} from '../../constants'
```

**3. Replace hardcoded strings with constants**

**4. Create `components/index.ts`:**

```typescript
export { default as LedgerHashComparison } from './LedgerHashComparison'
```

### Phase 5: Add Tests (30 minutes)

**Create `components/LedgerHashComparison/index.test.tsx`:**

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { showLedgerHashComparison, hideLedgerHashComparison } from '../../store'
import { LedgerHashComparison } from './index'

describe('LedgerHashComparison', () => {
  beforeEach(() => {
    hideLedgerHashComparison()
  })

  it('should not render when no hash present', () => {
    const { container } = render(<LedgerHashComparison />)
    expect(container.firstChild).toBeNull()
  })

  it('should render dialog when hash present', () => {
    showLedgerHashComparison('0xabc123')
    render(<LedgerHashComparison />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should display transaction hash', () => {
    const hash = '0xabc123def456'
    showLedgerHashComparison(hash)
    render(<LedgerHashComparison />)
    expect(screen.getByText(new RegExp(hash))).toBeInTheDocument()
  })

  it('should close dialog when close button clicked', async () => {
    showLedgerHashComparison('0xtest')
    render(<LedgerHashComparison />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

### Phase 6: Add Storybook Story (20 minutes)

**Create `components/LedgerHashComparison/LedgerHashComparison.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import { LedgerHashComparison } from './index'
import { showLedgerHashComparison } from '../../store'

const meta = {
  title: 'Features/Ledger/LedgerHashComparison',
  component: LedgerHashComparison,
  tags: ['autodocs'],
} satisfies Meta<typeof LedgerHashComparison>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    useEffect(() => {
      showLedgerHashComparison('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
    }, [])
    return <LedgerHashComparison />
  },
}

export const ShortHash: Story = {
  render: () => {
    useEffect(() => {
      showLedgerHashComparison('0xabc123')
    }, [])
    return <LedgerHashComparison />
  },
}

export const Hidden: Story = {
  render: () => <LedgerHashComparison />,
}
```

### Phase 7: Update Public API with Lazy Loading (15 minutes)

**Rewrite `index.ts`:**

```typescript
import dynamic from 'next/dynamic'

// Type exports
export type { TransactionHash, LedgerHashState, ShowHashFunction, HideHashFunction } from './types'

// Function exports
export { showLedgerHashComparison, hideLedgerHashComparison } from './store'

// Lazy-loaded component (default export)
const LedgerHashComparison = dynamic(
  () => import('./components/LedgerHashComparison').then((mod) => ({ default: mod.LedgerHashComparison })),
  { ssr: false },
)

export default LedgerHashComparison
```

### Phase 8: Update External Imports (10 minutes)

**Update `apps/web/src/services/onboard/ledger-module.ts` line 166:**

```typescript
// OLD:
const { showLedgerHashComparison, hideLedgerHashComparison } = await import('@/features/ledger/store')

// NEW:
const { showLedgerHashComparison, hideLedgerHashComparison } = await import('@/features/ledger')
```

**Verify `apps/web/src/components/tx-flow/TxFlow.tsx` line 13:**

```typescript
// Should already be correct:
import LedgerHashComparison from '@/features/ledger'
```

### Phase 9: Verify & Test (30 minutes)

**1. Type check:**

```bash
yarn workspace @safe-global/web type-check
```

**2. Run tests:**

```bash
yarn workspace @safe-global/web test ledger
```

**3. Lint:**

```bash
yarn workspace @safe-global/web lint
```

**4. Build:**

```bash
yarn workspace @safe-global/web build
```

**5. Verify bundle splitting:**

```bash
ls -lh apps/web/.next/static/chunks/ | grep -i ledger
# Should see a separate chunk for ledger feature
```

**6. Manual test:**

- Start dev server: `yarn workspace @safe-global/web dev`
- Connect Ledger device
- Initiate transaction signing
- Verify dialog appears with hash
- Verify dialog closes after signing

## Verification Checklist

- [ ] Directory structure matches standard pattern
- [ ] All files in correct folders
- [ ] types.ts contains all type definitions
- [ ] constants.ts contains extracted UI strings
- [ ] store/index.ts exports functions
- [ ] components/index.ts exports component
- [ ] hooks/index.ts exists (empty is ok)
- [ ] index.ts uses dynamic() for lazy loading
- [ ] External imports updated to public API
- [ ] Unit tests for store pass
- [ ] Unit tests for component pass
- [ ] Storybook story renders correctly
- [ ] ESLint shows no restricted import warnings
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Separate ledger chunk exists in build output
- [ ] Manual test: dialog appears during Ledger signing
- [ ] Manual test: dialog closes after signing

## Common Issues & Solutions

### Issue: Type errors after moving files

**Solution**: Update import paths to use relative paths (../../)

### Issue: Tests fail after refactoring

**Solution**: Update test imports to match new structure

### Issue: Bundle not code-split

**Solution**: Verify dynamic() is used correctly in index.ts with { ssr: false }

### Issue: ESLint warnings about restricted imports

**Solution**: Ensure all imports use @/features/ledger, not @/features/ledger/store or /components

### Issue: Storybook story doesn't show dialog

**Solution**: Make sure useEffect calls showLedgerHashComparison in story render function

## Next Steps

After completing this refactoring:

1. Use this as a reference for migrating other small features (2-5 files)
2. Document any learnings or challenges encountered
3. Update migration assessment document with completion status
4. Consider adding E2E test for full Ledger signing flow (optional)

## Reference

- **Spec**: `specs/002-ledger-refactor/spec.md`
- **Plan**: `specs/002-ledger-refactor/plan.md`
- **Data Model**: `specs/002-ledger-refactor/data-model.md`
- **Reference Implementation**: `apps/web/src/features/walletconnect/`
- **Feature Architecture Docs**: `apps/web/docs/feature-architecture.md`
