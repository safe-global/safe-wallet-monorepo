# API Contracts: Proposer Multisig Validation

This feature uses **existing** CGW/Transaction Service endpoints. No new endpoints are needed. This document describes how the existing APIs are composed to implement the multi-sig delegation flow.

## Endpoints Used

### 1. Create Off-Chain Message (Initiate Delegation)

**Endpoint**: `POST /v1/chains/{chainId}/safes/{parentSafeAddress}/messages`

Creates a new off-chain SafeMessage on the parent Safe containing the delegate TypedData.

**Request**:

```typescript
interface CreateMessageDto {
  message: TypedData // The delegate EIP-712 typed data
  signature: string // Initiating owner's signature on the SafeMessage
  safeAppId: null
  origin: string // JSON-encoded DelegationOrigin metadata
}
```

**Example Request Body**:

```json
{
  "message": {
    "domain": {
      "name": "Safe Transaction Service",
      "version": "1.0",
      "chainId": 1
    },
    "types": {
      "Delegate": [
        { "name": "delegateAddress", "type": "address" },
        { "name": "totp", "type": "uint256" }
      ]
    },
    "message": {
      "delegateAddress": "0x1234...proposer",
      "totp": 497142
    },
    "primaryType": "Delegate"
  },
  "signature": "0xabc...ownerA_signature",
  "safeAppId": null,
  "origin": "{\"type\":\"proposer-delegation\",\"action\":\"add\",\"delegate\":\"0x1234...proposer\",\"nestedSafe\":\"0x5678...nested\",\"label\":\"My Proposer\"}"
}
```

**Response**: `201 Created` (Message object)

**Signing Process** (for the initiating owner):

```typescript
// 1. Generate delegate typed data
const delegateTypedData = getDelegateTypedData(chainId, proposerAddress)

// 2. Generate SafeMessage typed data wrapping the delegate hash
const safeMessageTypedData = generateSafeMessageTypedData(parentSafe, delegateTypedData)

// 3. Sign the SafeMessage with the owner's wallet
const signature = await tryOffChainMsgSigning(signer, parentSafe, delegateTypedData)
```

---

### 2. Confirm Off-Chain Message (Co-owner Signs)

**Endpoint**: `POST /v1/chains/{chainId}/messages/{messageHash}/signatures`

Adds a co-owner's signature to an existing delegation message.

**Request**:

```typescript
interface UpdateMessageSignatureDto {
  signature: string // Co-owner's signature on the SafeMessage
}
```

**Example Request Body**:

```json
{
  "signature": "0xdef...ownerB_signature"
}
```

**Response**: `200 OK`

**Signing Process** (for confirming owners):

```typescript
// 1. Fetch the message to get its content (delegate TypedData)
const message = await getMessageByHash(chainId, messageHash)

// 2. Sign the same SafeMessage that the initiator signed
const signature = await tryOffChainMsgSigning(signer, parentSafe, message.message)
```

---

### 3. Get Messages by Safe (Discover Pending Delegations)

**Endpoint**: `GET /v1/chains/{chainId}/safes/{parentSafeAddress}/messages`

Fetches all off-chain messages for the parent Safe. Client filters by `origin.type === 'proposer-delegation'`.

**Query Parameters**:

```typescript
interface GetMessagesArgs {
  limit?: number // Pagination
  offset?: number
}
```

**Response**:

```typescript
interface MessagePage {
  count: number | null
  next: string | null
  previous: string | null
  results: Message[]
}

interface Message {
  messageHash: string
  status: 'NEEDS_CONFIRMATION' | 'CONFIRMED'
  logoUri: string | null
  name: string | null
  message: string | TypedData // The delegate TypedData
  creationTimestamp: number
  modifiedTimestamp: number
  confirmationsSubmitted: number // Current signature count
  confirmationsRequired: number // Parent Safe threshold
  proposedBy: AddressInfo
  confirmations: MessageConfirmation[]
  preparedSignature: string | null // All sigs concatenated when CONFIRMED
  origin: string | null // Our DelegationOrigin JSON
}

interface MessageConfirmation {
  owner: AddressInfo
  signature: string
}
```

**Client-Side Filtering**:

```typescript
const pendingDelegations = messages.results.filter((msg) => {
  try {
    const origin = JSON.parse(msg.origin || '')
    return origin.type === 'proposer-delegation' && origin.nestedSafe === currentSafeAddress
  } catch {
    return false
  }
})
```

---

### 4. Submit Completed Delegation (Add Proposer)

**Endpoint**: `POST /v2/chains/{chainId}/delegates`

Submits the completed multi-sig EIP-1271 signature to register the delegate.

**Request**:

```typescript
interface CreateDelegateDto {
  safe: string // Nested Safe address
  delegate: string // Proposer address
  delegator: string // Parent Safe address
  signature: string // EIP-1271 wrapped preparedSignature
  label: string // Proposer label
}
```

**Signature Assembly**:

```typescript
// 1. Get preparedSignature from confirmed message
const confirmedMessage = await getMessageByHash(chainId, messageHash)
const innerSignatures = confirmedMessage.preparedSignature!

// 2. Wrap in EIP-1271 format
const eip1271Signature = encodeEIP1271Signature(parentSafeAddress, innerSignatures)

// 3. Submit
await addDelegateV2({
  chainId,
  createDelegateDto: {
    safe: nestedSafeAddress,
    delegate: proposerAddress,
    delegator: parentSafeAddress,
    signature: eip1271Signature,
    label: proposerLabel,
  },
})
```

---

### 5. Submit Completed Delegation (Remove Proposer)

**Endpoint**: `DELETE /v2/chains/{chainId}/delegates/{delegateAddress}`

Submits the completed multi-sig EIP-1271 signature to remove the delegate.

**Request Body**:

```typescript
interface DeleteDelegateV2Dto {
  delegator: string // Parent Safe address
  safe: string // Nested Safe address
  signature: string // EIP-1271 wrapped preparedSignature
}
```

**Same signature assembly as addition** — the delegate TypedData structure is the same for both add and remove operations. The only difference is the HTTP method and endpoint.

---

## Data Flow Sequence

```
Owner A (Initiator)                    CGW / Transaction Service              Owner B (Co-signer)
       │                                        │                                     │
       │ 1. Sign SafeMessage(delegateTypedData) │                                     │
       │───────────────────────────────────────►│                                     │
       │   POST /safes/{parent}/messages        │                                     │
       │                                        │                                     │
       │ 2. Receive messageHash                 │                                     │
       │◄───────────────────────────────────────│                                     │
       │                                        │                                     │
       │                                        │  3. Owner B opens settings page      │
       │                                        │◄─────────────────────────────────────│
       │                                        │  GET /safes/{parent}/messages        │
       │                                        │                                     │
       │                                        │  4. Returns pending delegation       │
       │                                        │─────────────────────────────────────►│
       │                                        │  (status: NEEDS_CONFIRMATION)        │
       │                                        │                                     │
       │                                        │  5. Owner B signs & confirms         │
       │                                        │◄─────────────────────────────────────│
       │                                        │  POST /messages/{hash}/signatures    │
       │                                        │                                     │
       │                                        │  6. Returns updated message          │
       │                                        │─────────────────────────────────────►│
       │                                        │  (status: CONFIRMED,                 │
       │                                        │   preparedSignature: "0x...")         │
       │                                        │                                     │
       │                                        │  7. Wrap & submit to delegate API    │
       │                                        │◄─────────────────────────────────────│
       │                                        │  POST /delegates (EIP-1271 sig)      │
       │                                        │                                     │
       │                                        │  8. Proposer registered ✓            │
       │                                        │─────────────────────────────────────►│
```

## EIP-1271 Signature Encoding

```
┌─────────────────────────────────────────────────────────────┐
│ Byte Range  │ Content                                       │
├─────────────┼───────────────────────────────────────────────│
│ 0-31        │ r: parentSafeAddress left-padded to 32 bytes  │
│ 32-63       │ s: 0x00...0041 (offset 65 to dynamic data)    │
│ 64          │ v: 0x00 (contract signature type indicator)   │
│ 65-96       │ length: byte length of preparedSignature      │
│ 97+         │ preparedSignature (N × 65 bytes, sorted)      │
└─────────────┴───────────────────────────────────────────────┘
```

For a 2-of-3 parent Safe:

- Inner signatures: 2 × 65 = 130 bytes
- Total EIP-1271 signature: 65 (header) + 32 (length) + 130 (sigs) = 227 bytes
