# Tasks: Nested Safe Proposer Management

**Input**: Design documents from `/specs/001-nested-safe-proposer/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included — the plan explicitly defines unit tests for each phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Foundational (EIP-1271 Utility)

**Purpose**: Create the shared EIP-1271 signature encoding utility that the signing flow depends on.

**Why foundational**: The `encodeEIP1271Signature` function is needed by User Story 1 (full flow) and User Story 3 (signing). It operates on a separate file from the permission gate change, so it can be implemented first without conflicts.

- [x] T001 Implement `encodeEIP1271Signature(parentSafeAddress: string, ownerSignature: string): string` utility function in `apps/web/src/features/proposers/utils/utils.ts`. The function must encode the signature in EIP-1271 contract signature format: r=parentSafeAddress (32 bytes, left-padded), s=0x41 (65, offset to dynamic data), v=0x00, followed by ABI-encoded bytes of the owner signature. Reference format from Safe Transaction Service test `_test_add_delegate_using_1271_signature`.
- [x] T002 Add unit test for `encodeEIP1271Signature` in `apps/web/src/features/proposers/utils/utils.test.ts`. Test cases: (1) correct byte layout for a known parent Safe address and signature, (2) output is a valid hex string, (3) r-value contains the parent Safe address left-padded to 32 bytes, (4) v-value is 0x00, (5) s-value is 65 (0x41). Use faker for test addresses.

**Checkpoint**: EIP-1271 encoding utility is available and tested.

---

## Phase 2: User Story 1 + User Story 2 - Permission Gate Fix (Priority: P1) 🎯 MVP

**Goal**: Enable the "Add proposer" button for nested Safe owners while keeping it disabled for non-owners and proposer-only users.

**Independent Test**: Connect a wallet that owns a parent Safe (which is an owner of the nested Safe), navigate to Settings > Setup, verify "Add proposer" button is enabled. Connect an unrelated wallet, verify button remains disabled with tooltip.

### Implementation

- [x] T003 [US1] Replace `OnlyOwner` wrapper with `CheckWallet` component around the "Add proposer" button in `apps/web/src/components/settings/ProposersList/index.tsx`. Use props `allowProposer={false}` to prevent proposers from managing other proposers while allowing nested Safe owners. Remove the `OnlyOwner` import if no longer used in the file. Add `CheckWallet` import from `@/components/common/CheckWallet`.
- [x] T004 [P] [US1] Add unit tests for ProposersList permission behavior in `apps/web/src/components/settings/ProposersList/index.test.tsx`. Test cases using MSW and React Testing Library: (1) button enabled when `useIsNestedSafeOwner` returns true and Safe is deployed, (2) button disabled when user is only a proposer (not owner/nested owner), (3) button disabled when user has no relationship to the Safe (shows tooltip "Your connected wallet is not a signer of this Safe Account"), (4) button disabled when Safe is undeployed (shows "activate Safe" tooltip), (5) button enabled for direct Safe owner (no regression). Mock `useIsNestedSafeOwner`, `useIsSafeOwner`, `useIsWalletProposer` hooks.

**Checkpoint**: Button correctly reflects permissions for nested owners, direct owners, proposers, and non-owners.

---

## Phase 3: User Story 3 - EIP-1271 Signing Flow (Priority: P2)

**Goal**: When a nested Safe owner submits the proposer form, sign with the connected wallet and wrap in EIP-1271 format with the parent Safe as delegator.

**Independent Test**: As a nested Safe owner, click "Add proposer", enter a valid address and label, submit — verify the delegate API is called with `delegator: parentSafeAddress` and `signature` in EIP-1271 format.

### Implementation

- [x] T005 [US3] Modify `apps/web/src/features/proposers/components/UpsertProposer.tsx` to detect nested Safe ownership and use parent Safe as delegator. Changes: (1) Import and call `useIsNestedSafeOwner()` and `useNestedSafeOwners()` hooks. (2) In the form submission handler, after signing with the connected wallet (existing `signProposerTypedData`/`signProposerData`), check if user is a nested Safe owner. (3) If nested Safe owner: get the first parent Safe address from `useNestedSafeOwners()`, call `encodeEIP1271Signature(parentSafeAddress, eoaSignature)` to wrap, and set `delegator` to `parentSafeAddress` in the API payload. (4) If direct owner: keep existing behavior unchanged (delegator = wallet.address, raw EOA signature).
- [x] T006 [P] [US3] Add unit tests for UpsertProposer nested Safe flow in `apps/web/src/features/proposers/components/UpsertProposer.test.tsx`. Test cases: (1) When user is nested Safe owner and submits form, the delegate API mutation is called with `delegator` set to the parent Safe address (not the wallet address). (2) When user is nested Safe owner, the `signature` field in the API call is the EIP-1271 wrapped version. (3) When user is a direct owner, the delegate API is called with `delegator` set to the wallet address and raw EOA signature (no regression). (4) When user has multiple parent Safes, the first one is used as delegator. Use MSW for API mocking, mock the nested Safe ownership hooks.

**Checkpoint**: End-to-end flow works — nested Safe owner can add a proposer with parent Safe as delegator using EIP-1271 signature.

---

## Phase 4: Polish & Validation

**Purpose**: Quality gates, type checking, and validation across all stories.

- [x] T007 Run `yarn workspace @safe-global/web type-check` and fix any TypeScript errors introduced by the changes in ProposersList, UpsertProposer, and utils.ts.
- [x] T008 Run `yarn workspace @safe-global/web lint` and fix any linting issues.
- [x] T009 Run `yarn workspace @safe-global/web test` to verify all existing tests pass (no regressions) and all new tests pass.
- [x] T010 Verify edge case handling: (1) Confirm undeployed Safe still shows disabled button regardless of nested ownership, (2) Confirm address validation (not self, not existing owner) works for nested Safe owner flow, (3) Confirm ETH_SIGN wallet detection still works correctly for nested Safe owners (Trezor/Keystone use `signProposerData` fallback).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately
- **US1+US2 (Phase 2)**: No dependency on Phase 1 (different file: ProposersList vs utils.ts)
- **US3 (Phase 3)**: Depends on Phase 1 (needs `encodeEIP1271Signature` from utils.ts)
- **Polish (Phase 4)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Permission gate change is independent. Full end-to-end flow requires US3 signing flow.
- **User Story 2 (P2)**: Automatically satisfied by US1's CheckWallet change (non-owners/proposers blocked via `allowProposer={false}`).
- **User Story 3 (P2)**: Depends on Phase 1 foundational utility. Independent of US1 permission gate (different file).

### Within Each Phase

- Tasks marked [P] within the same phase can run in parallel
- T001 (utility) before T005 (UpsertProposer uses utility)
- T003 (ProposersList) and T001 (utils) are in different files — can run in parallel
- Tests ([P] marked) can run in parallel with their phase's implementation if in different files

### Parallel Opportunities

- **Phase 1 + Phase 2 can run in parallel** (different files: utils.ts vs ProposersList)
- T002 and T004 can run in parallel (different test files)
- T005 and T003 are independent (different files)
- T006 and T004 can run in parallel (different test files)

---

## Parallel Example: Phase 1 + Phase 2

```bash
# These can run simultaneously (different files):
Task: "T001 - encodeEIP1271Signature in utils.ts"
Task: "T003 - Replace OnlyOwner with CheckWallet in ProposersList"

# Then tests in parallel:
Task: "T002 - Unit test for EIP-1271 encoding in utils.test.ts"
Task: "T004 - Unit tests for ProposersList in index.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 - Permission Gate)

1. Complete Phase 1 (foundational utility) + Phase 2 (permission gate) in parallel
2. **STOP and VALIDATE**: Verify button is enabled for nested Safe owners, disabled for non-owners
3. This alone delivers visible value (unblocks the button)

### Full Feature Delivery

1. Complete Phase 1 + Phase 2 (in parallel) → Button works correctly
2. Complete Phase 3 → Signing flow uses EIP-1271 with parent Safe as delegator
3. Complete Phase 4 → All quality gates pass
4. **Full feature complete**: Nested Safe owners can add proposers end-to-end

### Scope Note

Initial implementation targets 1-of-1 parent Safes (single connected wallet is sole owner of parent Safe). Multi-sig parent Safes (threshold > 1) requiring collection of multiple owner signatures are deferred to a future iteration.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 is implicitly covered by US1's CheckWallet change — no separate implementation needed
- The `encodeEIP1271Signature` utility is the only new function; all other changes modify existing files
- Existing hooks (`useIsNestedSafeOwner`, `useNestedSafeOwners`) require no changes
- Existing signing functions (`signProposerTypedData`, `signProposerData`) require no changes — EIP-1271 wrapping happens after signing
