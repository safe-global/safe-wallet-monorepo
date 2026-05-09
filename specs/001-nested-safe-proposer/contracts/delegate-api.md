# API Contract: Delegate (Proposer) Management

**Date**: 2026-01-23
**Feature**: 001-nested-safe-proposer

## Existing Endpoints (No Changes)

The delegate API endpoints are already implemented by the CGW (Client Gateway) backend. This feature uses them with a new delegator type (Safe address instead of EOA).

### POST /v2/chains/{chainId}/delegates

Add a new delegate (proposer) to a Safe.

**Request Body** (`CreateDelegateDto`):

```typescript
{
  safe?: string | null       // The Safe address the delegate can propose to
  delegate: string           // Address being granted proposer rights
  delegator: string          // Address authorizing (EOA or Safe address)
  signature: string          // Authorization signature (EIP-712 EOA or EIP-1271 contract)
  label: string              // Human-readable name
}
```

**For nested Safe owner flow**:

- `safe`: The nested Safe address
- `delegate`: The new proposer address
- `delegator`: The parent Safe address (not the EOA wallet)
- `signature`: EIP-1271 contract signature from the parent Safe
- `label`: User-provided name

**Response**: `201 Created`

### DELETE /v2/chains/{chainId}/delegates/{delegateAddress}

Remove a delegate from a Safe.

**Request Body** (`DeleteDelegateV2Dto`):

```typescript
{
  delegator?: string | null  // Address that authorized (for permission check)
  safe?: string | null       // The Safe address
  signature: string          // Authorization signature
}
```

**Response**: `204 No Content`

### GET /v2/chains/{chainId}/delegates

List delegates for a Safe.

**Query Parameters**:

- `safe`: Filter by Safe address
- `delegate`: Filter by delegate address
- `delegator`: Filter by delegator address

**Response** (`DelegatePage`):

```typescript
{
  count?: number | null
  next?: string | null
  previous?: string | null
  results: Array<{
    safe?: string | null
    delegate: string
    delegator: string
    label: string
  }>
}
```

## Signature Formats

### EOA Signature (existing, direct owners)

Standard EIP-712 signature from the delegator's private key:

- 65 bytes: `r (32) + s (32) + v (1)`
- Produced by `eth_signTypedData_v4`

### Contract Signature (new, nested Safe owners)

EIP-1271 contract signature from the parent Safe:

- Variable length, encodes the verifying contract address
- Parent Safe must have signed the delegate typed data hash on-chain via SignMessageLib
- Backend validates by calling `isValidSignature(hash, signature)` on the delegator (parent Safe) contract

## Typed Data Structure

Both EOA and contract signatures authorize the same typed data:

```typescript
{
  domain: {
    name: "Safe Transaction Service",
    version: "1.0",
    chainId: <chain ID>
  },
  types: {
    Delegate: [
      { name: "delegateAddress", type: "address" },
      { name: "totp", type: "uint256" }
    ]
  },
  message: {
    delegateAddress: <proposer address>,
    totp: Math.floor(Date.now() / 1000 / 3600)  // hourly window
  },
  primaryType: "Delegate"
}
```

## Backend Support (Confirmed)

The Safe Transaction Service FULLY supports EIP-1271 contract signature validation for the delegate API.

**Verified in source code**:

- `/workspace/safe-transaction-service/safe_transaction_service/history/serializers.py` — `DelegateSerializerV2.validate_delegator_signature()` uses `SafeSignature.parse_signature()` which detects contract signatures (v=0) and calls `is_valid(ethereum_client, owner)` which invokes `isValidSignature` on-chain.
- `/workspace/safe-transaction-service/safe_transaction_service/history/tests/test_views_v2.py` — Explicit test `_test_add_delegate_using_1271_signature()` verifies a nested Safe (contract) as delegator returns HTTP 201 Created.

**CGW behavior** (confirmed in `/workspace/safe-client-gateway`): The CGW is a pure proxy for delegate operations — it validates only the request schema (addresses, required fields) and forwards the signature as-is to the Transaction Service. No signature validation occurs in the CGW.

**Validation flow**:

1. CGW receives POST with `delegator: parentSafeAddress` and `signature: eip1271Bytes`
2. CGW forwards to Transaction Service at `POST {transactionService}/api/v2/delegates/`
3. Transaction Service parses signature, detects v=0 (contract signature)
4. Extracts parent Safe address from r-value
5. Calls `isValidSignature(delegateTypedDataHash, signatureData)` on the parent Safe contract
6. Parent Safe validates inner owner signatures against its threshold
7. If valid, returns EIP-1271 magic value → delegation accepted (HTTP 201)
