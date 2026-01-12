# Data Model: tx-builder

**Phase**: 1 - Design
**Date**: 2026-01-12

## Overview

tx-builder uses browser-based storage (localStorage via localforage) for persisting user data. There is no backend database - all data lives in the user's browser.

## Core Entities

### Transaction

A single contract call to be executed as part of a batch.

```typescript
interface Transaction {
  id: string // Unique identifier (UUID)
  to: string // Target contract address (checksummed)
  value: string // ETH value in wei (string for precision)
  data: string // Encoded call data (hex string)

  // Metadata for UI display
  contractMethod?: ContractMethod
  contractFieldsValues?: Record<string, string>
  contractInputsValues?: unknown[]
}

interface ContractMethod {
  name: string // Method name (e.g., "transfer")
  inputs: ContractInput[] // Method parameters
}

interface ContractInput {
  name: string // Parameter name
  type: string // Solidity type (e.g., "address", "uint256")
  internalType?: string // Internal type for complex types
  components?: ContractInput[] // For tuple types
}
```

**Validation Rules**:

- `to` MUST be a valid Ethereum address (checksummed)
- `value` MUST be a non-negative integer string
- `data` MUST be a valid hex string starting with "0x"

---

### Batch

An ordered collection of transactions to be executed together via MultiSend.

```typescript
interface Batch {
  id: string // Unique identifier (UUID)
  name: string // User-provided batch name
  transactions: Transaction[] // Ordered list of transactions
  createdAt: number // Unix timestamp (ms)
  updatedAt: number // Unix timestamp (ms)
  chainId?: string // Chain ID where batch was created
}
```

**Validation Rules**:

- `name` MUST NOT be empty
- `transactions` MUST have at least 1 transaction
- `id` MUST be unique within the library

**State Transitions**:

```
[New] → [Draft] → [Saved to Library]
                ↘ [Submitted to Safe]
```

---

### TransactionLibrary

Collection of saved batches for a user.

```typescript
interface TransactionLibrary {
  batches: Batch[] // All saved batches
  // Stored per-Safe (keyed by chainId:safeAddress in localStorage)
}
```

**Storage Key Pattern**: `txBuilder_${chainId}_${safeAddress}`

---

### ContractABI

Interface definition for a smart contract.

```typescript
interface ContractABI {
  address: string // Contract address
  abi: ABIItem[] // Parsed ABI array
  name?: string // Contract name (from Etherscan/Sourcify)
  implementation?: string // Implementation address (for proxies)
}

type ABIItem = ABIFunction | ABIEvent | ABIError

interface ABIFunction {
  type: 'function'
  name: string
  inputs: ContractInput[]
  outputs: ContractInput[]
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable'
}
```

**Source Resolution Order**:

1. User-provided ABI (manual entry)
2. Safe Gateway API (verified contracts)
3. Etherscan/Sourcify API (fallback)

---

### SimulationResult

Result of transaction simulation via Tenderly.

```typescript
interface SimulationResult {
  success: boolean // Whether simulation passed
  gasUsed: string // Gas used in simulation
  error?: string // Error message if failed
  logs?: SimulationLog[] // Event logs emitted
  stateChanges?: StateChange[] // State changes preview
}

interface SimulationLog {
  address: string
  topics: string[]
  data: string
  decoded?: {
    name: string
    args: Record<string, unknown>
  }
}

interface StateChange {
  address: string
  key: string
  before: string
  after: string
}
```

---

## Storage Schema

### localStorage Keys

| Key Pattern                           | Value Type                  | Description                      |
| ------------------------------------- | --------------------------- | -------------------------------- |
| `txBuilder_${chainId}_${safeAddress}` | `TransactionLibrary`        | Saved batches for a Safe         |
| `txBuilder_recentContracts`           | `string[]`                  | Recently used contract addresses |
| `txBuilder_customAbis`                | `Record<string, ABIItem[]>` | User-provided ABIs               |

### Data Persistence

```typescript
// Using localforage for async storage with IndexedDB fallback
import localforage from 'localforage'

const txBuilderStore = localforage.createInstance({
  name: 'tx-builder',
  storeName: 'batches',
})

// Save batch
await txBuilderStore.setItem(`${chainId}_${safeAddress}`, library)

// Load batch
const library = await txBuilderStore.getItem<TransactionLibrary>(`${chainId}_${safeAddress}`)
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    TransactionLibrary                    │
│  (stored per Safe: chainId + safeAddress)               │
└─────────────────────────────────────────────────────────┘
                           │
                           │ contains
                           ▼
              ┌────────────────────────┐
              │         Batch          │
              │  - id                  │
              │  - name                │
              │  - createdAt           │
              └────────────────────────┘
                           │
                           │ contains (ordered)
                           ▼
              ┌────────────────────────┐
              │      Transaction       │
              │  - to (address)        │
              │  - value (wei)         │
              │  - data (calldata)     │
              └────────────────────────┘
                           │
                           │ references
                           ▼
              ┌────────────────────────┐
              │      ContractABI       │
              │  - address             │
              │  - abi[]               │
              │  - implementation?     │
              └────────────────────────┘
```

---

## Type Definitions Location

After migration, types will be located at:

```
apps/tx-builder/src/typings/
├── models.ts          # Transaction, Batch, Library types
├── contracts.ts       # ABI-related types
├── simulation.ts      # Tenderly simulation types
└── errors.ts          # Error type definitions
```

---

## Migration Notes

### From Current Implementation

The existing types in `safe-react-apps/apps/tx-builder/src/typings/models.ts` will be preserved with minimal changes:

1. **Keep**: Core Transaction/Batch interfaces
2. **Update**: Add explicit TypeScript strict types (no implicit any)
3. **Add**: Zod schemas for runtime validation at storage boundaries
4. **Remove**: Any deprecated fields from legacy code

### Zod Schemas (New)

```typescript
// src/typings/schemas.ts
import { z } from 'zod'

export const transactionSchema = z.object({
  id: z.string().uuid(),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.string().regex(/^\d+$/),
  data: z.string().regex(/^0x[a-fA-F0-9]*$/),
  contractMethod: z
    .object({
      name: z.string(),
      inputs: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
        }),
      ),
    })
    .optional(),
})

export const batchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  transactions: z.array(transactionSchema).min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
  chainId: z.string().optional(),
})
```
