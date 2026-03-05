# Implementation Plan: Nested Safe Proposer Management

**Branch**: `001-nested-safe-proposer` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-nested-safe-proposer/spec.md`

## Summary

Enable users who are nested Safe owners (their wallet controls a parent Safe that is an owner of the target Safe) to add proposers to the nested Safe. This requires two changes: (1) replace the `OnlyOwner` permission gate with `CheckWallet` on the "Add proposer" button, and (2) implement a signing flow that wraps the connected wallet's EOA signature in EIP-1271 format with the parent Safe as delegator. Backend EIP-1271 support has been confirmed in the Safe Transaction Service source code.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14.x)
**Primary Dependencies**: React, MUI, Redux Toolkit (RTK Query), ethers.js, @safe-global/protocol-kit, @safe-global/api-kit
**Storage**: N/A (backend-managed via CGW API)
**Testing**: Jest + React Testing Library + MSW
**Target Platform**: Web (Next.js, all modern browsers)
**Project Type**: Web (monorepo workspace `apps/web`)
**Performance Goals**: Standard web app responsiveness (<100ms UI interactions)
**Constraints**: Must work with existing CGW delegate API; parent Safe signing is async (multisig threshold)
**Scale/Scope**: ~5-7 files modified, 1-2 new utility functions

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status | Notes                                                                                                                                                                                          |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Type Safety                  | PASS   | All new code will use proper TypeScript interfaces. No `any` types.                                                                                                                            |
| II. Branch Protection           | PASS   | Working on feature branch `001-nested-safe-proposer`. Will run all quality gates before commit.                                                                                                |
| III. Cross-Platform Consistency | PASS   | Changes are web-only (`apps/web/`). No shared package modifications.                                                                                                                           |
| IV. Testing Discipline          | PASS   | Will use MSW for API mocking, colocated test files, faker for test data.                                                                                                                       |
| V. Feature Organization         | PASS   | Changes are within existing `src/features/proposers/` and `src/components/settings/`. No new feature folder needed (extending existing). Existing feature flag (`FEATURES.PROPOSERS`) applies. |
| VI. Theme System Integrity      | PASS   | No styling changes required.                                                                                                                                                                   |

**Post-Phase 1 Re-check**: All gates still pass. No new patterns or dependencies introduced that violate constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-nested-safe-proposer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── delegate-api.md  # API contract documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/web/src/
├── components/
│   ├── common/
│   │   ├── CheckWallet/index.tsx            # Already supports nested owners (no changes)
│   │   └── OnlyOwner/index.tsx              # Reference only (being replaced in ProposersList)
│   └── settings/
│       └── ProposersList/index.tsx          # MODIFY: Replace OnlyOwner with CheckWallet
├── features/
│   └── proposers/
│       ├── components/
│       │   └── UpsertProposer.tsx           # MODIFY: Add nested Safe owner detection + EIP-1271 wrapping
│       └── utils/
│           └── utils.ts                     # MODIFY: Add encodeEIP1271Signature() helper
└── hooks/
    ├── useIsNestedSafeOwner.ts              # Existing (no changes)
    └── useNestedSafeOwners.tsx              # Existing (no changes)
```

**Structure Decision**: This feature extends the existing proposers feature within `apps/web/`. No new directories or feature folders are needed. The changes are localized to the permission gate component and the proposer form submission logic.

## Implementation Phases

### Phase A: Permission Gate Fix (P1)

**Goal**: Enable the "Add proposer" button for nested Safe owners.

**Change**: In `ProposersList/index.tsx`, replace:

```tsx
<OnlyOwner>
  {(isOk) => ( ... )}
</OnlyOwner>
```

with:

```tsx
<CheckWallet allowProposer={false}>
  {(isOk) => ( ... )}
</CheckWallet>
```

**Why `allowProposer={false}`**: Proposers should not be able to add other proposers. Only direct owners and nested Safe owners should manage proposers.

**Risk**: Low. `CheckWallet` is a well-tested component already used throughout the app.

**Tests**:

- Unit test: Verify button enabled when `useIsNestedSafeOwner` returns true
- Unit test: Verify button disabled when user is only a proposer (not owner/nested owner)
- Unit test: Verify button disabled when user has no relationship to the Safe
- Unit test: Verify existing direct owner behavior unchanged

### Phase B: Nested Safe Signing Flow (P2)

**Goal**: When a nested Safe owner submits the proposer form, sign with the connected wallet and wrap in EIP-1271 format with the parent Safe as delegator.

**Confirmed**: The Safe Transaction Service fully supports EIP-1271 contract signatures for delegates (verified in source code and explicit test `_test_add_delegate_using_1271_signature()`). No on-chain transaction (SignMessageLib) is required.

**Steps**:

1. **Detect nested Safe owner in UpsertProposer**: Use `useIsNestedSafeOwner()` and `useNestedSafeOwners()` to determine if the current user is a nested Safe owner and get the parent Safe address.

2. **Sign delegate typed data with connected wallet**: Use the same `signProposerTypedData()` or `signProposerData()` functions. The connected wallet IS an owner of the parent Safe, so its signature is valid as an inner signature.

3. **Wrap in EIP-1271 format**: Encode the EOA signature in the EIP-1271 contract signature format:

   ```
   v=0, r=parentSafeAddress (32 bytes), s=65 (offset to dynamic data)
   + ABI-encoded bytes of the owner signature(s)
   ```

4. **Submit to delegate API**: POST with `delegator: parentSafeAddress` and `signature: eip1271Signature`.

**Flow for 1-of-1 parent Safe** (initial scope):

- Single-step, synchronous — identical UX to direct owner flow
- Connected wallet signs → wrap in EIP-1271 → submit → done

**Flow for multi-sig parent Safe** (threshold > 1, future phase):

- Would require collecting signatures from additional parent Safe owners
- Deferred — out of scope for initial implementation

**Risk**: Low-Medium.

- Backend EIP-1271 support: CONFIRMED (no longer a risk)
- EIP-1271 encoding: Well-defined format, test reference available
- Scope limited to 1-of-1 parent Safes initially

**New utility functions needed** (in `apps/web/src/features/proposers/utils/utils.ts`):

- `encodeEIP1271Signature(parentSafeAddress: string, ownerSignature: string): string` — wraps an EOA signature in EIP-1271 contract signature format
- Update `UpsertProposer` to detect nested Safe ownership and use the new encoding

**Tests**:

- Unit test: `encodeEIP1271Signature` produces correct byte layout
- Unit test: Parent Safe address is correctly identified from `useNestedSafeOwners()`
- Unit test: UpsertProposer uses EIP-1271 flow when user is nested Safe owner
- Unit test: UpsertProposer uses direct EOA flow when user is direct owner (no regression)
- Integration test: Full submission flow with mocked delegate API (MSW)

## Dependencies & Risks

| Dependency                             | Risk   | Status    | Notes                                                                                                           |
| -------------------------------------- | ------ | --------- | --------------------------------------------------------------------------------------------------------------- |
| Backend EIP-1271 support for delegates | LOW    | CONFIRMED | Safe Transaction Service supports it; explicit test exists (`_test_add_delegate_using_1271_signature`)          |
| EIP-1271 signature encoding            | LOW    | RESOLVED  | Format documented in Transaction Service test; well-defined byte layout                                         |
| Parent Safe threshold > 1              | MEDIUM | DEFERRED  | Initial scope limited to 1-of-1 parent Safes. Multi-sig collection is a future phase.                           |
| TOTP expiration                        | LOW    | RESOLVED  | Backend accepts current AND previous hour's TOTP (~2 hour window). For 1-of-1 parent Safes, signing is instant. |

## Open Questions (resolved)

1. ~~**Backend EIP-1271 support**~~: CONFIRMED. The Safe Transaction Service `DelegateSerializerV2.validate_delegator_signature()` calls `safe_signature.is_valid(ethereum_client, owner)` which invokes `isValidSignature` on contract delegators.
2. **Multi-signer UX** (deferred): For threshold > 1 parent Safes, a signature collection mechanism is needed. This is out of scope for the initial implementation.
3. ~~**TOTP window**~~: RESOLVED. The backend tries both current and previous TOTP values, giving a ~2 hour validity window. For the synchronous 1-of-1 flow, this is not a concern.
