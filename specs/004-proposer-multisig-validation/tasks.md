# Tasks: Proposer Multisig Validation for 2/N Parent Safes

**Input**: Design documents from `/specs/004-proposer-multisig-validation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TypeScript interfaces and type definitions used across all user stories

- [x] T001 [P] Create DelegationOrigin and PendingDelegation TypeScript interfaces in apps/web/src/features/proposers/types.ts
- [x] T002 [P] Create TOTP utility functions (getCurrentTotp, isTotpValid) in apps/web/src/features/proposers/utils/totp.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks and services that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement useParentSafeThreshold hook that fetches parent Safe threshold and owners via useSafesGetSafeV1Query in apps/web/src/features/proposers/hooks/useParentSafeThreshold.ts
- [x] T004 Implement delegation message service with createDelegationMessage and confirmDelegationMessage functions using RTK Query mutations in apps/web/src/features/proposers/services/delegationMessages.ts
- [x] T005 Implement buildDelegationOrigin helper that creates JSON-encoded origin metadata string in apps/web/src/features/proposers/services/delegationMessages.ts

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Add Proposer via 2/N Parent Safe (Priority: P1) MVP

**Goal**: Enable a 2/N parent Safe owner to initiate a proposer addition by creating an off-chain message on the parent Safe, collecting the first signature, and showing a pending state.

**Independent Test**: Connect as a signer of a 2-of-3 parent Safe (which owns a nested Safe), initiate a proposer addition, verify the off-chain message is created on the parent Safe with correct delegate TypedData and origin metadata, and verify the UI shows a pending state with "1 of 2 signatures collected".

### Implementation for User Story 1

- [x] T006 [US1] Modify UpsertProposer.tsx onConfirm handler to check parent Safe threshold before signing: if threshold === 1 use existing flow, if threshold > 1 branch to multi-sig flow in apps/web/src/features/proposers/components/UpsertProposer.tsx
- [x] T007 [US1] Implement multi-sig branch in UpsertProposer: generate delegate TypedData, sign SafeMessage via tryOffChainMsgSigning on parent Safe, create off-chain message via delegationMessages service with DelegationOrigin in apps/web/src/features/proposers/components/UpsertProposer.tsx
- [x] T008 [US1] Add success state in UpsertProposer after multi-sig message creation showing "Signature collection initiated — 1 of N signatures collected" with instructions for other owners in apps/web/src/features/proposers/components/UpsertProposer.tsx
- [x] T009 [US1] Verify encodeEIP1271Signature in utils.ts works with multi-owner preparedSignature (multiple concatenated 65-byte signatures) — add unit test verifying variable-length inner signatures encode correctly in apps/web/src/features/proposers/utils/utils.test.ts

**Checkpoint**: Owner A can initiate a multi-sig proposer delegation and see it stored as an off-chain message on the parent Safe

---

## Phase 4: User Story 2 — Threshold-Aware UX Feedback (Priority: P1)

**Goal**: Clearly communicate to users that adding/removing a proposer requires multiple signatures before they initiate the flow.

**Independent Test**: Connect as a 2/N parent Safe owner, open the "Add proposer" dialog, verify messaging indicates multiple signatures are required before signing.

### Implementation for User Story 2

- [x] T010 [US2] Add threshold-aware messaging to UpsertProposer dialog: when parent Safe threshold > 1, show info alert (MUI Alert component) explaining that N owner signatures are required to complete this delegation in apps/web/src/features/proposers/components/UpsertProposer.tsx
- [x] T011 [US2] Display parent Safe owner count and threshold in the dialog subtitle (e.g., "This requires 2 of 3 parent Safe owner signatures") in apps/web/src/features/proposers/components/UpsertProposer.tsx

**Checkpoint**: Users are informed upfront about the multi-sig requirement before initiating

---

## Phase 5: User Story 4 — Remove Proposer via 2/N Parent Safe (Priority: P1)

**Goal**: Enable a 2/N parent Safe owner to initiate a proposer removal using the same multi-sig signature collection flow as addition.

**Independent Test**: Connect as a 2/N parent Safe owner, initiate proposer removal, verify off-chain message is created with action="remove" and correct delegate TypedData.

### Implementation for User Story 4

- [x] T012 [US4] Modify DeleteProposerDialog.tsx to check parent Safe threshold before signing: if threshold > 1, branch to multi-sig flow (same pattern as UpsertProposer) in apps/web/src/features/proposers/components/DeleteProposerDialog.tsx
- [x] T013 [US4] Implement multi-sig branch in DeleteProposerDialog: generate delegate TypedData, sign SafeMessage, create off-chain message with action="remove" in origin metadata in apps/web/src/features/proposers/components/DeleteProposerDialog.tsx
- [x] T014 [US4] Add threshold-aware messaging and pending state to DeleteProposerDialog (same UX pattern as UpsertProposer) in apps/web/src/features/proposers/components/DeleteProposerDialog.tsx

**Checkpoint**: Both add and remove proposer flows support multi-sig initiation

---

## Phase 6: User Story 3 — Retrieve and Complete Pending Proposer Delegations (Priority: P2)

**Goal**: Enable co-owners to discover pending delegation requests on the proposers settings page, add their signatures, and auto-submit once threshold is met.

**Independent Test**: Have Owner A initiate a delegation, then connect as Owner B of the same parent Safe, navigate to the nested Safe's proposer settings, verify the pending delegation is visible with "1 of 2" progress, sign as Owner B, verify the system auto-submits the completed EIP-1271 signature to the delegate API.

### Implementation for User Story 3

- [x] T015 [US3] Implement usePendingDelegations hook: fetch messages for parent Safe via useMessagesGetMessagesBySafeV1Query, filter by origin.type === "proposer-delegation" and origin.nestedSafe === currentSafe, derive status (pending/ready/expired) using TOTP validation in apps/web/src/features/proposers/hooks/usePendingDelegations.ts
- [x] T016 [US3] Implement useSubmitDelegation hook: take a confirmed PendingDelegation, wrap preparedSignature with encodeEIP1271Signature, call delegate API (V2 add or V2 delete based on action field), invalidate delegates query cache on success in apps/web/src/features/proposers/hooks/useSubmitDelegation.ts
- [x] T017 [US3] Create PendingDelegation component showing: delegate address/label, action (add/remove), signature progress bar (e.g., "1 of 2"), proposedBy address, creation time, status badge (pending/ready/expired), and action buttons in apps/web/src/features/proposers/components/PendingDelegation.tsx
- [x] T018 [US3] Implement "Sign" button in PendingDelegation component: when clicked, sign the SafeMessage (same delegate TypedData from message content) via tryOffChainMsgSigning on parent Safe, call confirmDelegationMessage, refetch messages on success in apps/web/src/features/proposers/components/PendingDelegation.tsx
- [x] T019 [US3] Implement auto-submission logic: after successful confirmation that brings confirmationsSubmitted to equal confirmationsRequired, automatically call useSubmitDelegation with the updated preparedSignature in apps/web/src/features/proposers/components/PendingDelegation.tsx
- [x] T020 [US3] Implement "Submit" button for ready-state delegations: when threshold was met by another user (discovered on page load), show a "Submit delegation" button that triggers useSubmitDelegation in apps/web/src/features/proposers/components/PendingDelegation.tsx
- [x] T021 [US3] Implement expired state display: show "Expired" badge and "Re-initiate" button that opens UpsertProposer/DeleteProposerDialog pre-filled with the same delegate address and label in apps/web/src/features/proposers/components/PendingDelegation.tsx
- [x] T022 [US3] Create PendingDelegationsList component that renders a list of PendingDelegation components, with a section header "Pending Delegations" and empty state when no pending delegations exist in apps/web/src/features/proposers/components/PendingDelegationsList.tsx
- [x] T023 [US3] Integrate PendingDelegationsList into ProposersList settings page: render above the existing proposers list, only visible when parent Safe threshold > 1 and isNestedSafeOwner in apps/web/src/components/settings/ProposersList/index.tsx

**Checkpoint**: Full end-to-end multi-sig delegation flow works — Owner A initiates, Owner B discovers and confirms, delegation auto-submits

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error handling, and verification

- [x] T024 [P] Add error handling for off-chain message creation failures (network errors, permission errors) with user-facing error messages in UpsertProposer and DeleteProposerDialog
- [x] T025 [P] Add loading states for async operations: message creation, signature confirmation, delegate API submission in PendingDelegation component
- [x] T026 Verify 1/1 parent Safe regression: ensure existing single-step flow is unchanged when parent threshold === 1 by running existing proposer tests in apps/web/src/features/proposers/utils/utils.test.ts
- [x] T027 Run full quality gate validation: type-check, lint, prettier, and test suite pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (uses interfaces from T001)
- **US1 (Phase 3)**: Depends on Foundational — the core MVP
- **US2 (Phase 4)**: Depends on T003 (useParentSafeThreshold) — can run in parallel with US1
- **US4 (Phase 5)**: Depends on Foundational — can run in parallel with US1/US2
- **US3 (Phase 6)**: Depends on US1 completion (needs off-chain messages to exist for discovery)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2)
- **US2 (P1)**: Can start after Foundational — only needs useParentSafeThreshold
- **US4 (P1)**: Can start after Foundational — parallel with US1/US2
- **US3 (P2)**: Depends on US1 being complete (the initiation flow must exist for discovery to work)

### Within Each User Story

- Services/hooks before components
- Core implementation before UX polish
- Story complete before moving to next

### Parallel Opportunities

Phase 1: T001 and T002 can run in parallel (different files)

Phase 3-5: US1, US2, and US4 can run in parallel after Foundational completes (different components, shared hooks are read-only)

Phase 7: T024 and T025 can run in parallel (different components)

---

## Parallel Example: After Foundational

```bash
# These can all start once Phase 2 completes:
Task: "T006 [US1] Modify UpsertProposer.tsx..."
Task: "T010 [US2] Add threshold-aware messaging..."
Task: "T012 [US4] Modify DeleteProposerDialog.tsx..."
```

---

## Implementation Strategy

### MVP First (User Story 1 + 3 minimum)

1. Complete Phase 1: Setup (interfaces)
2. Complete Phase 2: Foundational (hooks, services)
3. Complete Phase 3: US1 (initiate multi-sig add)
4. Complete Phase 6: US3 (discover and complete pending delegations)
5. **STOP and VALIDATE**: Full add-proposer flow works end-to-end with 2/N parent Safe
6. Deploy/demo if ready

### Full Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Owner can initiate multi-sig delegation
3. US2 → Clear UX messaging about multi-sig requirement
4. US4 → Remove proposer also works with multi-sig
5. US3 → Co-owners can discover, sign, and complete delegations
6. Polish → Error handling, loading states, regression verification
7. Quality gates → type-check, lint, test all pass

### Parallel Team Strategy

With 2 developers after Foundational completes:

- Developer A: US1 (add flow) → US3 (discovery/completion)
- Developer B: US4 (remove flow) → US2 (UX messaging) → Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- The existing `encodeEIP1271Signature` function already handles multi-owner signatures (no code change needed per Research Decision 8)
- Parent Safe info is fetched fresh via CGW API (no stale local cache)
- TOTP validity is checked client-side before allowing submission
- `preparedSignature` from Transaction Service is pre-sorted by owner address (no client sorting needed)
- All new components use MUI and theme tokens (no hardcoded styles)
