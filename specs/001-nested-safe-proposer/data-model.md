# Data Model: Nested Safe Proposer Management

**Date**: 2026-01-23
**Feature**: 001-nested-safe-proposer

## Entities

### Safe Account

Represents a multi-signature wallet contract on an EVM chain.

| Field     | Type      | Description                               |
| --------- | --------- | ----------------------------------------- |
| address   | Address   | The Safe's contract address               |
| chainId   | string    | The chain where this Safe is deployed     |
| owners    | Address[] | List of addresses authorized as signers   |
| threshold | number    | Minimum signatures required for execution |
| deployed  | boolean   | Whether the Safe contract exists on-chain |
| version   | string    | Safe contract version (e.g., "1.3.0")     |

### Delegate (Proposer)

Represents a delegation granting proposal rights to an address.

| Field     | Type            | Description                                              |
| --------- | --------------- | -------------------------------------------------------- |
| delegate  | Address         | The address granted proposer rights                      |
| delegator | Address         | The address that authorized the delegation (EOA or Safe) |
| safe      | Address \| null | The Safe this delegation applies to                      |
| label     | string          | Human-readable name for the proposer                     |
| signature | HexString       | The authorization signature (EIP-712 or EIP-1271)        |

### Nested Safe Ownership Relationship

Represents the ownership chain between a user's wallet and a nested Safe.

| Field      | Type    | Description                                                   |
| ---------- | ------- | ------------------------------------------------------------- |
| userWallet | Address | The connected EOA wallet                                      |
| parentSafe | Address | The Safe controlled by the user (one of nested Safe's owners) |
| nestedSafe | Address | The target Safe where the proposer is being added             |
| chainId    | string  | The chain (must be same for all three)                        |

## Relationships

```
UserWallet ──owns──> ParentSafe ──owns──> NestedSafe
                         │
                         └── delegator for ──> Delegate (Proposer)
                                                   │
                                                   └── can propose on ──> NestedSafe
```

## State Transitions

### Delegation Creation (Nested Safe Owner Flow — 1-of-1 parent Safe)

```
States:
  IDLE → FORM_OPEN → SIGNING → DELEGATION_SUBMITTED → COMPLETE

Transitions:
  IDLE → FORM_OPEN
    Trigger: User clicks "Add proposer" button
    Condition: User is nested Safe owner, Safe is deployed

  FORM_OPEN → SIGNING
    Trigger: User submits form with valid proposer address and label
    Action: Sign delegate typed data with connected wallet (EOA)
    Condition: Address validation passes

  SIGNING → DELEGATION_SUBMITTED
    Trigger: EOA signature obtained
    Action: Wrap signature in EIP-1271 format (v=0, r=parentSafe, s=65, + ABI-encoded signature)
            POST to delegate API with delegator=parentSafeAddress
    Condition: Signature valid

  DELEGATION_SUBMITTED → COMPLETE
    Trigger: API accepts the delegation (HTTP 201)
    Action: Cache invalidation, proposer appears in list
```

Note: For multi-sig parent Safes (threshold > 1), additional states would be needed to collect
multiple owner signatures before wrapping in EIP-1271 format. This is deferred to a future phase.

### Delegation Creation (Direct Owner Flow - existing, unchanged)

```
States:
  IDLE → FORM_OPEN → SIGNING → DELEGATION_SUBMITTED → COMPLETE

Transitions:
  IDLE → FORM_OPEN
    Trigger: User clicks "Add proposer" button

  FORM_OPEN → SIGNING
    Trigger: User submits form
    Action: Wallet signs EIP-712 typed data directly

  SIGNING → DELEGATION_SUBMITTED
    Trigger: Signature obtained
    Action: POST to delegate API with EOA signature

  DELEGATION_SUBMITTED → COMPLETE
    Trigger: API accepts
    Action: Cache invalidation
```

## Validation Rules

| Rule                    | Entity    | Constraint                                      |
| ----------------------- | --------- | ----------------------------------------------- |
| Not self-delegation     | Delegate  | delegate address != Safe address                |
| Not existing owner      | Delegate  | delegate address not in Safe.owners             |
| Valid Ethereum address  | Delegate  | delegate must be a valid checksummed address    |
| Safe must be deployed   | Safe      | deployed == true for proposer management        |
| Chain consistency       | All       | parentSafe.chainId == nestedSafe.chainId        |
| Nested ownership exists | Ownership | parentSafe.address must be in nestedSafe.owners |
| User controls parent    | Ownership | userWallet must be in parentSafe.owners         |

## Key Data Flows

### Permission Check Data Flow

```
useOwnedSafes(wallet.address)          → owned Safe addresses on current chain
useSafeInfo().safe.owners               → current Safe's owner addresses
intersection(owned, owners)             → parent Safes the user controls
length > 0                              → isNestedSafeOwner = true
```

### Delegate Typed Data (for signature)

```
Domain: { name: "Safe Transaction Service", version: "1.0", chainId }
Types: { Delegate: [{ delegateAddress: address }, { totp: uint256 }] }
Message: { delegateAddress: <proposer>, totp: floor(now / 3600) }
```

### EIP-1271 Signature Construction (inline owner signatures)

```
signature = concat(
  r: parentSafe.address (32 bytes, left-padded with zeros),
  s: 0x41 (32 bytes, = 65, offset to dynamic signature data),
  v: 0x00 (1 byte, indicates contract signature type),
  --- dynamic data starts at byte 65 ---
  ABI-encoded bytes of concatenated owner signatures
)
```

For a 1-of-1 parent Safe with a single EOA owner:

```
bytes 0-31:   parentSafe address (left-padded to 32 bytes)
bytes 32-63:  0x0000...0041 (offset = 65)
byte 64:      0x00 (v = contract signature)
bytes 65+:    abi.encode(["bytes"], [ownerEOASignature])[32:]
              (length-prefixed owner signature, 65 bytes for ECDSA)
```
