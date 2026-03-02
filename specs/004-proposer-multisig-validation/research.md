# Research: Proposer Multisig Validation for 2/N Parent Safes

## Decision 1: Off-Chain Message Content Format

**Decision**: Pass the delegate EIP-712 TypedData object as the `message` field when creating the off-chain SafeMessage on the parent Safe.

**Rationale**: The off-chain message API accepts either a string or TypedData object. When TypedData is provided, the Transaction Service:

1. Computes the EIP-712 hash of the TypedData → `delegateHash`
2. Wraps in `SafeMessage { message: delegateHash }` with `verifyingContract = parentSafe`
3. Each owner signs this SafeMessage typed data

This produces signatures that are valid for the Safe contract's `isValidSignature(delegateHash, signatures)` because the contract internally reconstructs the same SafeMessage wrapping before verifying signatures.

**Alternatives considered**:

- Pass raw delegate hash as string: Would be double-hashed (keccak256 of the hash), producing invalid signatures for the delegate API
- Pass custom wrapper message: Unnecessary complexity; the TypedData message is already the correct primitive

## Decision 2: Off-Chain Message API Endpoint Targeting

**Decision**: Create off-chain messages on the **parent Safe's** address (not the nested Safe), using `POST /v1/chains/{chainId}/safes/{parentSafeAddress}/messages`.

**Rationale**:

- The CGW message endpoint uses the Safe's threshold as `confirmationsRequired`
- The parent Safe's owners are the ones who need to sign
- The Transaction Service validates that each signer is an owner of the target Safe
- Using the parent Safe address ensures correct threshold and owner validation

**Alternatives considered**:

- Create message on nested Safe: Incorrect — the nested Safe's owners (which include the parent Safe) wouldn't match the EOA signers
- Custom storage mechanism: Unnecessary when existing infrastructure fits perfectly

## Decision 3: Identifying Delegation Messages Among All Off-Chain Messages

**Decision**: Include a structured `origin` field when creating the off-chain message to tag it as a delegation request. Format: `{"type":"proposer-delegation","action":"add"|"remove","delegate":"0x...","nestedSafe":"0x...","label":"..."}`.

**Rationale**:

- The off-chain message API has an `origin` field (string, optional) designed for metadata
- This allows filtering parent Safe messages to find only delegation-related ones
- The `origin` is stored and returned in message responses
- No collision with other off-chain messages on the parent Safe (dApp messages, etc.)

**Alternatives considered**:

- Filter by message content (TypedData structure): Works but fragile — other dApps could use similar typed data structures
- Store message hashes locally: Defeats the purpose of cross-device discovery
- Use a unique prefix in message content: The TypedData is fixed by the delegate API format

## Decision 4: EIP-1271 Signature Assembly from preparedSignature

**Decision**: Use the `preparedSignature` field from the off-chain message response directly as the inner signature data for EIP-1271 encoding.

**Rationale**:

- The Transaction Service's `build_signature()` method concatenates all confirmations sorted by owner address (ascending) — exactly what the Safe contract requires
- The CGW exposes this as `preparedSignature` when `status === 'CONFIRMED'`
- The existing `encodeEIP1271Signature` function can be adapted to accept multi-owner signature bytes instead of a single EOA signature

**Alternatives considered**:

- Manual concatenation on client: Redundant — the backend already does this correctly
- Fetching individual confirmations and sorting: Extra work with no benefit over preparedSignature

## Decision 5: TOTP Expiration Detection

**Decision**: Compare the TOTP value embedded in the delegate TypedData message with the current TOTP (± 1 hour tolerance). If the message's TOTP is outside this window, display as expired.

**Rationale**:

- The delegate TypedData contains `totp: Math.floor(Date.now() / 1000 / 3600)` at creation time
- The backend accepts current TOTP ± 1 previous interval (total ~2 hour window)
- Client-side detection avoids a round-trip to the backend to discover expiration
- Expired messages are shown with visual indicator; no cleanup needed

**Alternatives considered**:

- Server-side validation only (submit and handle 4xx): Poor UX — user collects signatures only to fail at submission
- Use `creationTimestamp` from message response: Less precise — doesn't account for exact TOTP boundaries

## Decision 6: Threshold Detection for Parent Safe

**Decision**: Fetch the parent Safe's info using the existing `useSafesGetSafeV1Query` RTK Query hook with the parent Safe's address and chain ID.

**Rationale**:

- The `useNestedSafeOwners()` hook already provides the parent Safe address
- The CGW `GET /v1/chains/{chainId}/safes/{safeAddress}` endpoint returns `threshold` and `owners[]`
- Reusing the existing RTK Query hook means automatic caching and refetching

**Alternatives considered**:

- Direct RPC call to Safe contract: Unnecessary complexity when CGW API provides the data
- Store threshold in local state: Would go stale; better to fetch fresh from CGW

## Decision 7: Auto-Submission After Threshold Met

**Decision**: When the current user's confirmation brings `confirmationsSubmitted` to equal `confirmationsRequired`, immediately attempt the delegate API submission. If another user completed the threshold, show a "Ready to submit" state that any owner can trigger.

**Rationale**:

- The user who provides the final signature has the best context to submit immediately
- For cases where another owner completed the threshold (discovered on page load), any authenticated owner should be able to trigger submission
- The `preparedSignature` is only available when `status === 'CONFIRMED'`

**Alternatives considered**:

- Always manual submission: Extra click for the common case (user provides final signature)
- Background polling + auto-submit: Could race with stale TOTP; explicit user action is safer

## Decision 8: Modifying encodeEIP1271Signature for Multi-Owner Signatures

**Decision**: The existing `encodeEIP1271Signature(parentSafeAddress, ownerSignature)` function already works for multi-owner signatures because the EIP-1271 format encodes the inner signature as ABI-encoded bytes regardless of length. The `preparedSignature` (multiple concatenated 65-byte signatures) is simply longer bytes that get ABI-encoded the same way.

**Rationale**:

- EIP-1271 contract signature format: `r(address) | s(offset=65) | v(0x00) | ABI.encode(bytes, innerSignatures)`
- The ABI encoding handles variable-length bytes naturally
- No code change needed to `encodeEIP1271Signature` — just pass the full `preparedSignature` as the signature parameter

**Alternatives considered**:

- Create a separate function for multi-sig: Unnecessary duplication; same encoding logic applies
- Manually construct the bytes: Error-prone and duplicates existing tested logic
