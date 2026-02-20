# Data Model: Proposer Multisig Validation

## Entities

### PendingDelegation (derived from off-chain SafeMessage)

A pending proposer delegation request stored as an off-chain SafeMessage on the parent Safe. Not a new entity — a view/projection of existing `Message` responses filtered by origin metadata.

| Field                  | Type                                | Source                                   | Description                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| messageHash            | `Hex`                               | `Message.messageHash`                    | Unique identifier of the off-chain message                 |
| action                 | `'add' \| 'remove'`                 | Parsed from `Message.origin`             | Whether this is an add or remove delegation                |
| delegateAddress        | `Address`                           | Parsed from `Message.origin` + TypedData | The proposer address being added/removed                   |
| delegateLabel          | `string`                            | Parsed from `Message.origin`             | Human-readable label for the proposer                      |
| nestedSafeAddress      | `Address`                           | Parsed from `Message.origin`             | The nested Safe this delegation targets                    |
| parentSafeAddress      | `Address`                           | Context (URL of message creation)        | The parent Safe collecting signatures                      |
| totp                   | `number`                            | Parsed from delegate TypedData message   | The TOTP value used at creation time                       |
| status                 | `'pending' \| 'ready' \| 'expired'` | Derived                                  | Computed from confirmations vs threshold and TOTP validity |
| confirmationsSubmitted | `number`                            | `Message.confirmationsSubmitted`         | Number of owner signatures collected                       |
| confirmationsRequired  | `number`                            | `Message.confirmationsRequired`          | Parent Safe threshold                                      |
| confirmations          | `MessageConfirmation[]`             | `Message.confirmations`                  | Individual owner signature records                         |
| preparedSignature      | `Hex \| null`                       | `Message.preparedSignature`              | All signatures concatenated (available when confirmed)     |
| creationTimestamp      | `number`                            | `Message.creationTimestamp`              | When the delegation request was initiated                  |
| proposedBy             | `AddressInfo`                       | `Message.proposedBy`                     | The owner who initiated the request                        |

### DelegationOrigin (stored in Message.origin field)

Structured metadata stored as JSON string in the off-chain message's `origin` field.

```typescript
interface DelegationOrigin {
  type: 'proposer-delegation'
  action: 'add' | 'remove'
  delegate: Address
  nestedSafe: Address
  label: string
}
```

### ParentSafeInfo (fetched from CGW)

Threshold and owner data for the parent Safe, used to determine signing flow.

| Field     | Type            | Source                  | Description                   |
| --------- | --------------- | ----------------------- | ----------------------------- |
| address   | `Address`       | `useNestedSafeOwners()` | Parent Safe address           |
| threshold | `number`        | `SafeState.threshold`   | Required number of signatures |
| owners    | `AddressInfo[]` | `SafeState.owners`      | List of owner addresses       |
| chainId   | `string`        | Current chain context   | Chain the Safe is deployed on |

## State Transitions

### PendingDelegation Lifecycle

```
                    ┌─────────────┐
                    │  (none)     │
                    └──────┬──────┘
                           │ Owner A initiates delegation
                           │ (creates off-chain message)
                           ▼
                    ┌─────────────┐
                    │   PENDING   │ confirmationsSubmitted < confirmationsRequired
                    │             │ AND TOTP is valid
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              │ Owner B    │ TOTP       │ Owner removed /
              │ confirms   │ expires    │ threshold changes
              ▼            ▼            ▼
       ┌─────────────┐ ┌─────────┐ ┌──────────────┐
       │    READY     │ │ EXPIRED │ │   INVALID    │
       │ threshold    │ │         │ │ (re-validate │
       │ met          │ │         │ │  on display) │
       └──────┬───────┘ └────┬────┘ └──────────────┘
              │              │
              │ Submit to    │ User re-initiates
              │ delegate API │ (new message, new TOTP)
              ▼              ▼
       ┌─────────────┐ ┌─────────────┐
       │  SUBMITTED   │ │  (none)     │
       │ (proposer    │ │  old msg    │
       │  appears)    │ │  remains    │
       └─────────────┘ └─────────────┘
```

### Status Derivation Logic

```typescript
function deriveDelegationStatus(message: Message, currentTotp: number): 'pending' | 'ready' | 'expired' {
  const messageTotp = (message.message as TypedData).message.totp
  const totpDiff = currentTotp - messageTotp

  // TOTP valid window: current hour and previous hour (±1)
  if (totpDiff > 1) return 'expired'

  if (message.confirmationsSubmitted >= message.confirmationsRequired) {
    return 'ready'
  }

  return 'pending'
}
```

## Relationships

```
┌──────────────────┐         ┌──────────────────┐
│   Nested Safe    │◄────────│   Parent Safe    │
│   (current)      │  owns   │   (delegator)    │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      │ has off-chain messages
                                      ▼
                             ┌──────────────────┐
                             │  SafeMessage     │
                             │  (off-chain)     │
                             │                  │
                             │  origin: {       │
                             │   type: "proposer│
                             │   -delegation"   │
                             │  }               │
                             └────────┬─────────┘
                                      │
                                      │ has confirmations
                                      ▼
                             ┌──────────────────┐
                             │ MessageConfirm-  │
                             │ ation            │
                             │ (per owner sig)  │
                             └──────────────────┘
```

## TypeScript Interfaces

```typescript
// Origin metadata for delegation messages
interface DelegationOrigin {
  type: 'proposer-delegation'
  action: 'add' | 'remove'
  delegate: Address
  nestedSafe: Address
  label: string
}

// Parsed pending delegation (view model)
interface PendingDelegation {
  messageHash: Hex
  action: 'add' | 'remove'
  delegateAddress: Address
  delegateLabel: string
  nestedSafeAddress: Address
  parentSafeAddress: Address
  totp: number
  status: 'pending' | 'ready' | 'expired'
  confirmationsSubmitted: number
  confirmationsRequired: number
  confirmations: MessageConfirmation[]
  preparedSignature: Hex | null
  creationTimestamp: number
  proposedBy: AddressInfo
}

// Parent Safe info needed for threshold check
interface ParentSafeInfo {
  address: Address
  threshold: number
  owners: AddressInfo[]
  chainId: string
}
```

## Validation Rules

1. **TOTP validity**: `currentTotp - messageTotp <= 1` (within ~2 hour window)
2. **Owner verification**: Only current owners of the parent Safe can sign confirmations (enforced by Transaction Service)
3. **Signature ordering**: `preparedSignature` is pre-sorted by owner address ascending (handled by Transaction Service `build_signature()`)
4. **Threshold satisfaction**: `confirmationsSubmitted >= confirmationsRequired` before submission to delegate API
5. **Address checksumming**: All addresses use EIP-55 checksummed format for comparison
