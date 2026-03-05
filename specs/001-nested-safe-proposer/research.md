# Research: Nested Safe Proposer Management

**Date**: 2026-01-23
**Feature**: 001-nested-safe-proposer

## Research Questions & Findings

### RQ-001: How does the current permission check work for the "Add proposer" button?

**Decision**: The ProposersList component uses `OnlyOwner` wrapper, which only checks direct Safe ownership via `useIsSafeOwner()`. This excludes nested Safe owners.

**Rationale**: The `OnlyOwner` component is a strict permission gate that only validates if the connected wallet address exists in `safe.owners`. It does not support nested Safe owners, proposers, or any other authorization level.

**Alternatives considered**:

- `CheckWallet` component supports nested Safe owners via `useIsNestedSafeOwner()` and has configurable props (`allowProposer`, `allowNonOwner`, etc.)
- The fix for the button enablement is to replace `OnlyOwner` with `CheckWallet` using `allowProposer={false}` to allow nested Safe owners but not proposers.

### RQ-002: How does the delegate/proposer API handle delegator identity and signatures?

**Decision**: The CGW delegate API V2 accepts a `CreateDelegateDto` with fields: `safe`, `delegate`, `delegator`, `signature`, `label`. The `delegator` is the address that authorizes the delegation, and the `signature` must be verifiable against the `delegator` address.

**Rationale**: The API uses EIP-712 typed data with domain "Safe Transaction Service" containing `delegateAddress` and `totp` (hourly time-based value). The backend validates that the signature was produced by the `delegator` address.

**Key finding**: The API types do not explicitly distinguish between EOA and contract signatures. The `delegator` field accepts any address (EOA or Safe). The signature format is a standard hex string.

### RQ-003: Can a Safe (smart contract) produce a valid delegation signature?

**Decision**: YES — confirmed. The Safe Transaction Service fully supports EIP-1271 contract signatures for the delegate API. No on-chain SignMessageLib transaction is required. Instead, the parent Safe's owner signatures are encoded inline in EIP-1271 format.

**Confirmed by**: Safe Transaction Service source code at `/workspace/safe-transaction-service/safe_transaction_service/history/serializers.py` (class `DelegateSerializerV2`, method `validate_delegator_signature`) and explicit test `_test_add_delegate_using_1271_signature()` in `/workspace/safe-transaction-service/safe_transaction_service/history/tests/test_views_v2.py`.

**How it works**:

1. The Safe Transaction Service calls `SafeSignature.parse_signature(signature, message_hash)` which detects the signature type from the v-value.
2. For v=0 (contract signature), it extracts the contract address from the r-value.
3. It calls `safe_signature.is_valid(ethereum_client, owner)` which invokes `isValidSignature(hash, data)` on the parent Safe contract.
4. The Safe contract's `isValidSignature` implementation validates the inline owner signatures against its threshold.

**EIP-1271 signature format for delegates** (from test):

```
signature_1271 = (
    signature_to_bytes(v=0, r=int(parent_safe_address), s=65)  # 65-byte header
    + eth_abi.encode(["bytes"], [concatenated_owner_signatures])[32:]  # dynamic data
)
```

Structure:

- Bytes 0-31 (r): Parent Safe address, left-padded to 32 bytes
- Bytes 32-63 (s): Offset to dynamic signature data (value: 65)
- Byte 64 (v): 0x00 (indicates contract signature)
- Bytes 65+: ABI-encoded bytes containing concatenated owner signatures

**Rationale**: The backend validates by calling `isValidSignature` on the parent Safe. The Safe contract checks whether the provided inner signatures meet its threshold. This means:

- For a 1-of-1 parent Safe: Only the connected wallet's signature is needed (single-step flow)
- For a multi-sig parent Safe (threshold > 1): Multiple owner signatures must be collected before submission

**Alternatives considered**:

- SignMessageLib on-chain signing (rejected: not needed — inline EIP-1271 signatures are simpler and don't require on-chain transactions)
- Direct EOA signing as delegator (rejected: user specified parent Safe as delegator)

**CGW behavior** (confirmed at `/workspace/safe-client-gateway`): The CGW does NOT validate signatures — it simply proxies the request to the Transaction Service. The `signature` field is validated only as a string format (`z.string()` in the schema).

### RQ-004: What is the existing pattern for Safe-as-signer in the app?

**Decision**: The app uses `dispatchOnChainSigning` for contract wallet signers in transaction flows. However, for delegate registration (an off-chain API call), we use a different pattern: EIP-1271 inline signatures where the parent Safe's owners sign off-chain and their signatures are wrapped in EIP-1271 format.

**Rationale**: The on-chain `approveHash` pattern exists for Safe transactions, but delegate registration is an HTTP POST to the CGW API, not an on-chain transaction. The backend validates EIP-1271 signatures by calling `isValidSignature` on the delegator contract, which checks inline owner signatures against the threshold.

**Key insight**: For a 1-of-1 parent Safe, the connected wallet (sole owner) signs the delegate typed data directly, then the signature is wrapped in EIP-1271 format with the parent Safe address. No on-chain transaction or async flow needed.

### RQ-005: How does EIP-1271 validation work for the delegate API?

**Decision**: The Safe Transaction Service validates EIP-1271 delegate signatures by calling `isValidSignature(hash, signature_data)` on the delegator contract (parent Safe). The Safe contract validates the inline owner signatures against its threshold. No SignMessageLib on-chain transaction is required.

**Confirmed by**: The `validate_delegator_signature()` method in `/workspace/safe-transaction-service/safe_transaction_service/history/serializers.py` (lines 449-489):

1. Computes the delegate typed data hash (with TOTP and chain_id)
2. Parses the signature via `SafeSignature.parse_signature(signature, message_hash)`
3. For EIP-1271 (v=0): extracts the contract address from r-value
4. Calls `safe_signature.is_valid(ethereum_client, owner)` which invokes `isValidSignature` on-chain
5. The Safe contract checks if the inline signatures meet its threshold

**TOTP handling**: The backend tries 4 combinations to be lenient:

- Current TOTP vs previous TOTP (allows signatures from the previous hour)
- Current chain_id vs None (backwards compatibility)
- This gives a ~2-hour validity window for signatures

**Implication for implementation**: The flow for nested Safe proposer addition is:

1. Compute the delegate typed data hash (same as for EOA, using `getDelegateTypedData()`)
2. Have the parent Safe's owners sign this hash off-chain (each signs with their EOA)
3. For a 1-of-1 parent Safe: the connected wallet is the sole owner, so only one signature needed
4. Encode the owner signature(s) in EIP-1271 format (v=0, r=parentSafe, s=65, then ABI-encoded signatures)
5. POST to delegate API with `delegator: parentSafeAddress`, `signature: eip1271Signature`

**Key simplification**: No on-chain transaction is needed. No SignMessageLib. No async multisig approval wait. For a 1-of-1 parent Safe, this is a single-step synchronous flow (sign → wrap → submit), identical in UX to the direct owner flow.

**Multi-sig parent Safe (threshold > 1)**: Would require collecting signatures from multiple owners before submission. This is a UX challenge but not a backend limitation. Could be deferred to a later phase.

### RQ-006: How does the nested Safe owner detection work?

**Decision**: `useNestedSafeOwners()` finds the intersection of Safes owned by the connected wallet AND listed as owners of the current Safe. `useIsNestedSafeOwner()` returns boolean based on this.

**Rationale**:

1. `useOwnedSafes()` fetches all Safes where the wallet is a signer (via CGW API)
2. `safe.owners` provides the current Safe's owner list
3. Intersection = Safes the user controls that are owners of the current Safe
4. This is limited to one level of nesting (direct parent only)

### RQ-007: What is the UpsertProposer submission flow?

**Decision**: The current `UpsertProposer` component:

1. Validates address (not self, not existing owner)
2. Detects wallet type (ETH_SIGN vs EIP-712)
3. Signs with connected wallet EOA via `signProposerTypedData()` or `signProposerData()`
4. POSTs to delegate API with `delegator: wallet.address`

**Modification needed**: For nested Safe owners, the component needs an alternate flow:

1. Same validation (address not self, not existing owner)
2. Determine parent Safe address from `useNestedSafeOwners()`
3. Sign the delegate typed data with the connected wallet (same as direct owner — the wallet IS an owner of the parent Safe)
4. Wrap the EOA signature in EIP-1271 format: `v=0, r=parentSafeAddress, s=65, + ABI-encoded(ownerSignature)`
5. POST to delegate API with `delegator: parentSafeAddress`, `signature: eip1271Signature`

For a 1-of-1 parent Safe, this is a single-step synchronous flow. For multi-sig parent Safes (threshold > 1), collecting additional owner signatures is needed (deferred to future phase).

## Architecture Decision

The implementation requires two distinct changes:

1. **Permission gate fix** (simple): Replace `OnlyOwner` with `CheckWallet` in ProposersList to enable the button for nested Safe owners.

2. **Signing flow** (moderate complexity): Create a new code path in UpsertProposer that, for nested Safe owners:
   - Identifies the parent Safe address (from `useNestedSafeOwners()`)
   - Signs the delegate typed data with the connected wallet's EOA (same signing method as direct owners)
   - Wraps the EOA signature in EIP-1271 format (v=0, r=parentSafe, s=65, + ABI-encoded signature)
   - POSTs to delegate API with `delegator: parentSafeAddress`

**Key simplification** (confirmed via Safe Transaction Service source): No on-chain transaction is needed. The backend calls `isValidSignature` on the parent Safe contract, which validates inline owner signatures. For a 1-of-1 parent Safe, this is a single-step synchronous flow — the UX is identical to the direct owner flow.

**Scope limitation**: Multi-sig parent Safes (threshold > 1) would require collecting signatures from multiple owners before submission. This is deferred to a future phase. The initial implementation targets 1-of-1 parent Safes (or cases where the connected wallet's single signature meets the threshold).

## Backend Verification Sources

| Source                         | Location                                                         | Finding                                                                                   |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| CGW delegate handler           | `/workspace/safe-client-gateway/src/modules/delegate/`           | Proxy only — no signature validation, passes to Transaction Service                       |
| Transaction Service serializer | `/workspace/safe-transaction-service/.../history/serializers.py` | `DelegateSerializerV2.validate_delegator_signature()` supports EIP-1271                   |
| Transaction Service test       | `/workspace/safe-transaction-service/.../tests/test_views_v2.py` | `_test_add_delegate_using_1271_signature()` — explicit test with nested Safe as delegator |
| Signature parsing              | `safe_eth` library via `SafeSignature.parse_signature()`         | Detects v=0 as contract signature, extracts address from r-value                          |
| Validation                     | `safe_signature.is_valid(ethereum_client, owner)`                | Calls `isValidSignature` on-chain for contract signatures                                 |
