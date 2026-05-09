# Data Model: Ledger Feature Architecture Refactor

**Feature**: 002-ledger-refactor  
**Date**: 2026-01-15  
**Purpose**: Document data structures, state management, and entity relationships

## Overview

The ledger feature manages a simple UI state for displaying a transaction hash comparison dialog. There is minimal data modeling complexity since this is a structural refactoring of existing functionality.

## State Management

### Store State

**Type**: ExternalStore (from `@safe-global/utils`)  
**State Shape**:

```typescript
type LedgerHashState = string | undefined
```

**State Values**:
| Value | Meaning | UI Behavior |
|-------|---------|-------------|
| `undefined` | No dialog to show | Dialog is hidden |
| `"0x..."` | Transaction hash | Dialog is visible, displays hash |

**State Transitions**:

```text
          showLedgerHashComparison(hash)
undefined ─────────────────────────────────> "0x..." (hash)
    ^                                             |
    |        hideLedgerHashComparison()           |
    └─────────────────────────────────────────────┘
```

**Invariants**:

- State is always either `undefined` or a valid hex string
- Only one hash can be displayed at a time (new hash replaces old)
- State updates are synchronous (no async state transitions)

### State Operations

#### showLedgerHashComparison

**Signature**: `(hash: string) => void`

**Effect**: Sets store state to the provided hash value

**Preconditions**:

- `hash` should be a transaction hash (0x-prefixed hex string)
- No validation performed (caller responsibility)

**Postconditions**:

- Store state is `hash`
- All subscribers notified
- Dialog component will render

**Called From**:

- `apps/web/src/services/onboard/ledger-module.ts` (line 167)
- Called when Ledger device is about to sign a transaction

#### hideLedgerHashComparison

**Signature**: `() => void`

**Effect**: Clears store state to `undefined`

**Preconditions**: None

**Postconditions**:

- Store state is `undefined`
- All subscribers notified
- Dialog component will not render

**Called From**:

- `apps/web/src/services/onboard/ledger-module.ts` (lines 177, 182)
- Called after successful transaction signing or on error
- `LedgerHashComparison` component (user clicks close button)

## Entities

### LedgerHashStore

**Type**: ExternalStore instance  
**Purpose**: Holds current dialog state  
**Lifecycle**: Singleton (created at module load)  
**Persistence**: None (in-memory only, resets on page reload)

**Properties**:
| Property | Type | Description |
|----------|------|-------------|
| state | `string \| undefined` | Current hash to display or undefined |

**Methods**:
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| useStore | none | `string \| undefined` | React hook to subscribe to state |
| setStore | `value: string \| undefined` | `void` | Update state (internal) |

### LedgerHashComparison Component

**Type**: React functional component  
**Purpose**: Display dialog with transaction hash  
**Props**: None (reads from store directly)

**Internal State**: None (fully controlled by store)

**Behavior**:

- Renders `null` when store state is `undefined`
- Renders Material-UI Dialog when store state is a hash string
- Dialog contains:
  - Title: "Compare transaction hash"
  - Info alert with instructions
  - Hash display (HexEncodedData component)
  - Copy button
  - Close button

### External Consumers

#### ledger-module.ts

**Location**: `apps/web/src/services/onboard/ledger-module.ts`  
**Purpose**: Ledger hardware wallet integration (Web3-Onboard module)  
**Usage**:

- Dynamically imports `showLedgerHashComparison` and `hideLedgerHashComparison`
- Shows hash before device signing
- Hides hash after signing (success or error)

**Integration Points**:

```typescript
// Line 166-167: Dynamic import
const { showLedgerHashComparison, hideLedgerHashComparison } = await import('@/features/ledger/store') // ← Will change to '@/features/ledger'

// Line 167: Show dialog
showLedgerHashComparison(txHash)

// Line 177: Hide on success
hideLedgerHashComparison()

// Line 182: Hide on error
hideLedgerHashComparison()
```

#### TxFlow.tsx

**Location**: `apps/web/src/components/tx-flow/TxFlow.tsx`  
**Purpose**: Transaction flow modal wrapper  
**Usage**:

- Statically imports and renders `LedgerHashComparison` component
- Component is rendered unconditionally (self-controls visibility via store)

**Integration**:

```typescript
// Line 13: Import (already uses public API)
import LedgerHashComparison from '@/features/ledger'

// Line 118: Render
<LedgerHashComparison />
```

## Data Flow

### Transaction Signing Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│ User initiates transaction signature via Ledger device         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│ ledger-module.ts: eth_signTransaction handler                  │
│ 1. Calculate transaction hash (keccak256)                      │
│ 2. Dynamic import: showLedgerHashComparison, hide functions   │
│ 3. Call showLedgerHashComparison(txHash)                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│ ledgerHashStore: setStore(txHash)                              │
│ - Updates internal state                                        │
│ - Notifies all subscribers                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│ LedgerHashComparison component (in TxFlow)                     │
│ - useStore() hook returns txHash                                │
│ - Component re-renders                                          │
│ - Dialog opens with hash displayed                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│ User verifies hash on Ledger device screen                     │
│ User confirms or rejects on device                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                ┌──────┴──────┐
                │             │
         Success│             │Error/Rejection
                v             v
┌─────────────────────────┐ ┌─────────────────────────┐
│ ledger-module.ts:       │ │ ledger-module.ts:       │
│ hideLedgerHashComparison()│ │ catch block:            │
│ (line 177)              │ │ hideLedgerHashComparison()│
│                         │ │ (line 182)              │
└────────┬────────────────┘ └────────┬────────────────┘
         │                           │
         └──────────┬────────────────┘
                    v
┌─────────────────────────────────────────────────────────────────┐
│ ledgerHashStore: setStore(undefined)                            │
│ - Clears state                                                   │
│ - Notifies subscribers                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       v
┌─────────────────────────────────────────────────────────────────┐
│ LedgerHashComparison component                                  │
│ - useStore() returns undefined                                   │
│ - Component re-renders                                           │
│ - Returns null (dialog closes)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure Mapping

### Current → Target File Mapping

| Current File                          | Target File(s)                                                     | Entities/Functions                                             |
| ------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `store.ts` (15 lines)                 | `store/ledgerHashStore.ts`                                         | ExternalStore instance                                         |
|                                       | `store/index.ts`                                                   | Re-exports: showLedgerHashComparison, hideLedgerHashComparison |
| `LedgerHashComparison.tsx` (65 lines) | `components/LedgerHashComparison/index.tsx`                        | Dialog component                                               |
|                                       | `components/LedgerHashComparison/index.test.tsx`                   | Component tests (NEW)                                          |
|                                       | `components/LedgerHashComparison/LedgerHashComparison.stories.tsx` | Storybook story (NEW)                                          |
|                                       | `components/index.ts`                                              | Re-exports: LedgerHashComparison                               |
| `index.ts` (3 lines)                  | `index.ts`                                                         | Public API with lazy loading                                   |
| N/A                                   | `types.ts`                                                         | Type definitions (NEW)                                         |
| N/A                                   | `constants.ts`                                                     | UI constants (NEW)                                             |
| N/A                                   | `hooks/index.ts`                                                   | Hook exports (empty for now)                                   |

### State Access Patterns

**From Components** (via useStore hook):

```typescript
import ledgerHashStore from '../../store/ledgerHashStore'

const LedgerHashComparison = () => {
  const hash = ledgerHashStore.useStore() // Subscribe to changes
  // ...
}
```

**From Services** (via exported functions):

```typescript
import { showLedgerHashComparison, hideLedgerHashComparison } from '@/features/ledger'

// Show dialog
showLedgerHashComparison('0xabc123...')

// Hide dialog
hideLedgerHashComparison()
```

## Validation Rules

| Rule                                             | Enforcement        | Location                                            |
| ------------------------------------------------ | ------------------ | --------------------------------------------------- |
| Hash must be string when defined                 | Type system        | TypeScript compiler                                 |
| Only one dialog visible at a time                | State design       | ExternalStore single value                          |
| Dialog closes on unmount                         | React cleanup      | Component effect (not needed - controlled by state) |
| Functions callable even when component unmounted | Store independence | ExternalStore exists outside React                  |

## Migration Impact

### Data Changes

- No database or persistent storage
- No API calls
- No data format changes
- State shape unchanged (still `string | undefined`)

### Breaking Changes

- None (public API remains identical)
- Internal import paths change (consumers must update)

### Backward Compatibility

- All existing functionality preserved
- Same behavior for end users
- Same programmatic API for calling code (after import path updates)
