# Research: Ledger Feature Architecture Refactor

**Feature**: 002-ledger-refactor  
**Date**: 2026-01-15  
**Purpose**: Document technical decisions and patterns for refactoring ledger feature

## Research Tasks Completed

### Task 1: Analyze Walletconnect Reference Implementation

**Research Question**: What is the exact pattern used in the walletconnect feature that serves as the reference implementation?

**Findings**:

1. **Directory Structure**:
   - `components/` folder with index.ts barrel and subdirectories for each component
   - `hooks/` folder with index.ts barrel and individual hook files
   - `services/` folder with index.ts barrel and service implementations
   - `store/` folder with index.ts barrel and Redux/store slices
   - `types.ts` for all TypeScript interfaces
   - `constants.ts` for feature constants
   - `index.ts` as public API with lazy-loaded default export

2. **Lazy Loading Pattern**:

   ```typescript
   const WalletConnectWidget = dynamic(
     () => import('./components/WalletConnectUi').then((mod) => ({ default: mod.default })),
     { ssr: false },
   )
   export default WalletConnectWidget
   ```

3. **Public API Exports**:
   - Types exported as `export type { ... }`
   - Enums exported as `export { ... }`
   - Hooks exported from hooks barrel
   - Store functions exported from store barrel
   - Constants exported selectively
   - Context providers exported from components

4. **Testing Pattern**:
   - Tests colocated with components (`__tests__/` subdirectories)
   - Hook tests in `hooks/__tests__/`
   - Service tests in `services/__tests__/`

**Decision**: Follow walletconnect pattern exactly for consistency.

**Rationale**:

- Proven pattern already in production
- Other features will follow this pattern
- ESLint rules already configured for this structure
- Developers are familiar with this organization

---

### Task 2: ExternalStore State Management Pattern

**Research Question**: Should we keep ExternalStore or migrate to Redux for consistency?

**Findings**:

1. **Current Implementation**:
   - Uses `ExternalStore<string | undefined>` from `@safe-global/utils`
   - Simple state: hash string or undefined
   - Two functions: `showLedgerHashComparison(hash)` and `hideLedgerHashComparison()`
   - Component uses `ledgerHashStore.useStore()` hook

2. **Alternative Redux Approach**:
   - Would require creating slice, actions, selectors
   - More boilerplate for simple boolean+string state
   - Walletconnect uses BOTH ExternalStore (`wcPopupStore`) AND Redux (`wcChainSwitchSlice`)

3. **ExternalStore Benefits**:
   - Lightweight (no Redux overhead)
   - Already works perfectly
   - Similar to React's `useSyncExternalStore`
   - Appropriate for UI-only state (dialog visibility)
   - No persistence needed
   - No complex state transformations

**Decision**: Keep ExternalStore pattern, do NOT migrate to Redux.

**Rationale**:

- Spec explicitly states "preserve ExternalStore pattern (no Redux migration needed)"
- State is simple UI state (dialog open/closed with hash)
- Redux would be over-engineering for this use case
- Walletconnect reference also uses ExternalStore for similar UI state
- Refactoring goal is structure, not state management migration

**Alternatives Considered**:

- Redux slice: Rejected (too heavy for simple UI state)
- React Context: Rejected (ExternalStore already provides subscribe pattern)
- useState in parent: Rejected (state needs to be triggerable from service layer)

---

### Task 3: Lazy Loading Implementation Best Practices

**Research Question**: What is the correct Next.js dynamic import pattern for feature components?

**Findings**:

1. **Next.js Dynamic Import Options**:

   ```typescript
   dynamic(loader, options)
   ```

   - `loader`: Function that returns promise of component
   - `options.ssr`: Boolean (false for browser-only)
   - `options.loading`: Optional loading component
   - `options.suspense`: Optional Suspense integration

2. **Current Ledger Usage**:
   - TxFlow.tsx imports: `import LedgerHashComparison from '@/features/ledger'`
   - Ledger index.ts exports: `export { default } from './LedgerHashComparison'`
   - No lazy loading currently (static import)

3. **Ledger-Module Service Dynamic Import**:
   - Line 166: `const { showLedgerHashComparison, hideLedgerHashComparison } = await import('@/features/ledger/store')`
   - This is ALREADY dynamic (imports functions at call time)
   - Functions are small and tree-shakeable

4. **Browser-Only Requirements**:
   - Uses Material-UI Dialog (requires window.document)
   - Uses ExternalStore (subscribes to events)
   - No SSR needed for dialog overlay

**Decision**: Use `dynamic()` with `{ ssr: false }` for component, keep function dynamic imports.

**Pattern**:

```typescript
// index.ts
import dynamic from 'next/dynamic'

export type {} from /* types */ './types'
export { showLedgerHashComparison, hideLedgerHashComparison } from './store'

const LedgerHashComparison = dynamic(
  () => import('./components/LedgerHashComparison').then((mod) => ({ default: mod.LedgerHashComparison })),
  { ssr: false },
)

export default LedgerHashComparison
```

**Rationale**:

- Component is browser-only (Dialog, ExternalStore)
- Functions can remain in separate export (ledger-module.ts dynamic import is intentional)
- No loading state needed (dialog appears on-demand)
- Matches walletconnect pattern

**Alternatives Considered**:

- React.lazy: Rejected (Next.js uses dynamic for better SSR handling)
- Static import: Rejected (defeats code splitting goal)
- Suspense loading: Rejected (unnecessary for on-demand dialog)

---

### Task 4: Type Extraction Strategy

**Research Question**: What types need to be extracted to types.ts?

**Findings**:

**Current Type Usage**:

1. LedgerHashComparison.tsx:
   - No exported types
   - Props: none (reads from store internally)
   - Local variables: `hash: string | undefined`, `open: boolean`

2. store.ts:
   - `ExternalStore<string | undefined>` (from utils)
   - Function signatures implicitly typed

3. External consumers:
   - ledger-module.ts: Imports functions (no types needed)
   - TxFlow.tsx: Imports component (React.ComponentType)

**Type Needs Analysis**:

- Dialog doesn't accept props (self-contained)
- Store state is `string | undefined`
- Functions are simple (`(hash: string) => void`, `() => void`)
- No complex domain types needed

**Decision**: Create minimal types.ts with public types for documentation.

**Types to Define**:

```typescript
// types.ts
/**
 * Transaction hash value (0x-prefixed hex string)
 */
export type TransactionHash = string

/**
 * Store state: transaction hash to display, or undefined when dialog is hidden
 */
export type LedgerHashState = TransactionHash | undefined

/**
 * Function to show the hash comparison dialog
 */
export type ShowHashFunction = (hash: TransactionHash) => void

/**
 * Function to hide the hash comparison dialog
 */
export type HideHashFunction = () => void
```

**Rationale**:

- Provides type documentation for consumers
- Makes intent explicit (hash is transaction hash)
- Enables future type narrowing if needed
- Follows walletconnect pattern of explicit types

**Alternatives Considered**:

- No types.ts: Rejected (violates standard pattern)
- Component props interface: Rejected (component has no props)
- Complex state types: Rejected (state is intentionally simple)

---

### Task 5: Constants Identification

**Research Question**: Are there any constants that should be extracted to constants.ts?

**Findings**:

**Current Code Scan**:

1. LedgerHashComparison.tsx:
   - Dialog title: `"Compare transaction hash"` (hardcoded)
   - Alert message: `"Compare this hash with the one displayed on your Ledger device..."` (hardcoded)
   - Button text: `"Close"` (hardcoded)
   - maxWidth: `"sm"` (MUI size)
   - Paper maxWidth: `'180px'` (specific styling)
   - HexEncodedData limit: `9999` (essentially "show all")

2. store.ts:
   - Initial state: `undefined`

3. No feature flags (always enabled)
4. No API endpoints
5. No magic numbers that affect behavior

**Decision**: Create minimal constants.ts for documentation, extract UI strings.

**Constants to Define**:

```typescript
// constants.ts
/**
 * Dialog configuration
 */
export const DIALOG_MAX_WIDTH = 'sm' as const
export const HASH_DISPLAY_WIDTH = '180px'
export const HASH_DISPLAY_LIMIT = 9999

/**
 * UI text constants
 */
export const DIALOG_TITLE = 'Compare transaction hash'
export const DIALOG_DESCRIPTION =
  'Compare this hash with the one displayed on your Ledger device before confirming the transaction.'
export const CLOSE_BUTTON_TEXT = 'Close'
```

**Rationale**:

- Makes text easily changeable for i18n future work
- Documents magic numbers (9999 = show all bytes)
- Improves testability (can assert on constants)
- Follows principle of no magic values in components

**Alternatives Considered**:

- No constants.ts: Rejected (violates standard pattern, strings should be extractable)
- Keep strings inline: Rejected (future i18n would require changes)
- Feature flag constant: Rejected (feature not behind flag)

---

### Task 6: Testing Strategy

**Research Question**: What tests are needed for the refactored feature?

**Findings**:

**Current Test Coverage**: NONE (no existing tests for ledger feature)

**Test Categories Needed**:

1. **Store Tests** (`store/ledgerHashStore.test.ts`):
   - `showLedgerHashComparison(hash)` updates store state
   - `hideLedgerHashComparison()` clears store state
   - Multiple rapid calls use latest hash value
   - Initial state is undefined

2. **Component Tests** (`components/LedgerHashComparison/index.test.tsx`):
   - Renders null when store state is undefined
   - Renders dialog when store state has hash
   - Displays hash value correctly
   - Calls hide function when close button clicked
   - Calls hide function when dialog onClose triggered
   - Copies hash to clipboard when copy button clicked

3. **Integration Test** (in existing transaction flow tests):
   - Verify dialog appears during Ledger signing flow
   - Not needed as separate test (covered by manual testing)

**Testing Tools**:

- Jest (already configured)
- React Testing Library (already configured)
- @testing-library/user-event (for interactions)
- No MSW needed (no network calls)

**Decision**: Add unit tests for store and component, skip integration test.

**Test Structure**:

```typescript
// store/ledgerHashStore.test.ts
describe('ledgerHashStore', () => {
  it('should start with undefined state')
  it('should update state when showLedgerHashComparison called')
  it('should clear state when hideLedgerHashComparison called')
  it('should use latest hash when called multiple times')
})

// components/LedgerHashComparison/index.test.tsx
describe('LedgerHashComparison', () => {
  it('should not render when no hash present')
  it('should render dialog when hash present')
  it('should display transaction hash')
  it('should close dialog when close button clicked')
  it('should close dialog when backdrop clicked')
})
```

**Rationale**:

- Constitution requires unit tests for all logic
- Store functions are testable in isolation
- Component behavior is straightforward
- No complex state interactions
- Existing e2e tests cover integration

**Alternatives Considered**:

- Skip tests: Rejected (violates constitution)
- Only integration tests: Rejected (doesn't test units)
- Snapshot tests: Rejected (too brittle for dialogs)

---

## Research Summary

### Technology Stack Confirmed

- Next.js 14+ dynamic imports for lazy loading
- React 18+ for component structure
- TypeScript 5.x strict mode
- Material-UI v5 for Dialog component
- ExternalStore from @safe-global/utils for state
- Jest + React Testing Library for testing

### Key Architectural Decisions

| Decision         | Choice                           | Alternative Rejected              |
| ---------------- | -------------------------------- | --------------------------------- |
| State Management | Keep ExternalStore               | Redux (too heavy)                 |
| Lazy Loading     | dynamic() with ssr: false        | Static import (no code splitting) |
| Type Extraction  | Minimal documentation types      | No types (violates pattern)       |
| Constants        | Extract UI strings               | Inline strings (not i18n-ready)   |
| Testing          | Unit tests for store + component | No tests (violates constitution)  |
| Folder Structure | Match walletconnect pattern      | Custom structure (inconsistent)   |

### No Unresolved Questions

All technical decisions are clear and documented. Ready for Phase 1 (data model and contracts).
