# Feature Specification: Proposer Multisig Validation for 2/N Parent Safes

**Feature Branch**: `004-proposer-multisig-validation`
**Created**: 2026-01-23
**Status**: Draft
**Input**: User description: "In a previous spec 001-nested-safe-proposer we fixed a proposing bug, but it was assuming the parent safe was a 1/1 and it doesn't work for 2/N now. What do we need to do for 2/N validation to work."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Add Proposer via 2/N Parent Safe with Signature Collection (Priority: P1)

As a user whose connected wallet is a signer of a 2-of-N (or higher threshold) parent Safe that owns a nested Safe, I want to add a proposer to the nested Safe by collecting the required number of signatures from parent Safe owners, so that the delegation is properly authorized.

Currently, when a 2/N parent Safe owner tries to add a proposer to the nested Safe, the single EOA signature is wrapped in EIP-1271 format and submitted. The backend calls `isValidSignature` on the parent Safe contract, which rejects it because only 1 signature is present but the threshold requires 2 or more.

**Why this priority**: This is the core broken flow — users with multi-sig parent Safes cannot add proposers to nested Safes at all, receiving cryptic validation errors from the backend.

**Independent Test**: Can be fully tested by connecting a wallet that is a signer of a 2-of-3 parent Safe (which owns a nested Safe), initiating a proposer addition, collecting a second owner's signature, and verifying the proposer is successfully registered.

**Acceptance Scenarios**:

1. **Given** a user whose wallet is a signer of a 2-of-3 parent Safe that owns a nested Safe, **When** the user submits a proposer addition, **Then** the system initiates a signature collection flow rather than immediately submitting.
2. **Given** a signature collection has been initiated for a proposer addition on a 2/N parent Safe, **When** the required threshold of parent Safe owners have provided their signatures, **Then** the system wraps all collected signatures in EIP-1271 format and submits to the delegate API.
3. **Given** a 2/N parent Safe proposer addition is pending signatures, **When** the initiating user views the status, **Then** they see how many signatures have been collected versus how many are required.

---

### User Story 2 - Threshold-Aware UX Feedback (Priority: P1)

As a user with a multi-sig parent Safe, I want the interface to clearly indicate that adding a proposer requires multiple signatures, so I understand the process before initiating it.

**Why this priority**: Without upfront communication, users will be confused about why the flow doesn't complete immediately (as it does for 1/1 parent Safes). Clear messaging prevents user frustration and support requests.

**Independent Test**: Can be tested by connecting as a 2/N parent Safe owner and verifying the UI communicates the multi-signature requirement before and during the submission flow.

**Acceptance Scenarios**:

1. **Given** a user is a signer of a 2/N parent Safe that owns the current nested Safe, **When** they open the "Add proposer" dialog, **Then** they see messaging indicating that multiple parent Safe owners must sign to complete the delegation.
2. **Given** a user has initiated a proposer addition requiring 2+ signatures, **When** only their signature is collected so far, **Then** the interface shows a pending state with clear instructions on how remaining signers can approve.

---

### User Story 3 - Retrieve and Complete Pending Proposer Delegations (Priority: P2)

As a parent Safe co-owner, I want to view and sign pending proposer delegation requests initiated by another owner, so that the delegation can reach the required threshold.

**Why this priority**: For the multi-sig flow to work end-to-end, non-initiating owners must be able to discover and approve pending delegation requests.

**Independent Test**: Can be tested by having Owner A initiate a proposer delegation on the nested Safe, then connecting as Owner B of the same parent Safe and verifying they can see and sign the pending request.

**Acceptance Scenarios**:

1. **Given** Owner A initiated a proposer delegation on the nested Safe requiring 2 signatures, **When** Owner B (a co-signer of the parent Safe) navigates to the nested Safe's proposers settings page, **Then** they can see the pending delegation request listed with its current signature count. Discovery is passive — no active notifications are shown elsewhere in the UI.
2. **Given** Owner B views a pending delegation request, **When** they sign and submit their approval, **Then** the system detects the threshold is met, wraps all signatures in EIP-1271 format, and submits the completed delegation to the backend.
3. **Given** a pending delegation has expired (TOTP window exceeded ~2 hours), **When** any owner views it, **Then** the system indicates it has expired and allows re-initiation.

---

### User Story 4 - Remove Proposer via 2/N Parent Safe (Priority: P1)

As a user whose connected wallet is a signer of a 2-of-N parent Safe that owns a nested Safe, I want to remove a proposer from the nested Safe by collecting the required number of signatures from parent Safe owners, so that the removal is properly authorized.

**Why this priority**: The delegate API's DELETE endpoint also requires a valid EIP-1271 signature from the parent Safe. Without multi-sig support, 2/N parent Safe owners cannot remove proposers either.

**Independent Test**: Can be tested by connecting as a 2/N parent Safe owner, initiating a proposer removal, collecting the required co-signatures, and verifying the proposer is removed.

**Acceptance Scenarios**:

1. **Given** a user whose wallet is a signer of a 2-of-N parent Safe that owns a nested Safe with an existing proposer, **When** the user initiates proposer removal, **Then** the system initiates a signature collection flow (same as addition).
2. **Given** the required threshold of parent Safe owners have signed the removal request, **When** the system submits the deletion, **Then** the proposer is removed from the nested Safe's proposers list.

---

### Edge Cases

- What happens when the parent Safe threshold is met by the initiating user alone (1/1 case)? The existing single-step flow should continue working unchanged — no signature collection needed.
- What happens if a parent Safe owner is removed while a delegation signature collection is in progress? The pending request should be invalidated or refreshed to reflect the current owner set.
- What happens if the parent Safe threshold changes while signatures are being collected? The system should re-validate against the current threshold before submitting.
- What happens when the TOTP value rolls over during signature collection? The delegation hash changes hourly; all signatures must use the same TOTP. If the window expires before threshold is met, signers must restart with a fresh hash.
- What happens if there are multiple parent Safes that own the nested Safe (user controls more than one)? The system should use the first detected parent Safe (existing behavior) or allow the user to choose.

## Clarifications

### Session 2026-01-23

- Q: Where should pending delegation requests (collected signatures awaiting threshold) be stored? → A: Safe Transaction Service off-chain messages — leverages existing infra; co-owners discover pending requests automatically.
- Q: Does this feature also cover removing proposers from nested Safes with 2/N parent Safes, or only adding? → A: Both add and remove — apply the same multi-sig signature collection flow to proposer removal.
- Q: How should co-owners discover pending delegation requests that need their signature? → A: Passive — co-owners navigate to proposers settings page where pending requests are listed.
- Q: What nesting depth does this feature support for the parent Safe relationship? → A: Direct parent only — only the immediate parent Safe (one level up) is supported.
- Q: How should expired pending delegation requests be handled? → A: Display-only — show as expired in UI, no cleanup; user re-initiates with fresh TOTP.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST detect the parent Safe's threshold before initiating the proposer delegation signing flow.
- **FR-002**: System MUST branch the signing flow based on threshold: if threshold = 1, use the existing single-step flow; if threshold > 1, initiate a multi-signature collection flow. This applies to both adding and removing proposers.
- **FR-003**: System MUST allow the initiating user to sign the delegate typed data hash and store their signature as the first collected signature.
- **FR-004**: System MUST persist pending delegation requests (with collected signatures) via the Safe Transaction Service off-chain message signing infrastructure so that other parent Safe owners can discover and sign them across devices/sessions.
- **FR-005**: System MUST allow other parent Safe owners to view pending delegation requests (fetched from the Transaction Service) and add their signatures.
- **FR-006**: System MUST automatically submit the completed EIP-1271-wrapped delegation to the delegate API once the threshold number of valid signatures is collected.
- **FR-007**: System MUST concatenate all collected owner signatures (sorted by owner address, ascending) before encoding in EIP-1271 format, as required by the Safe contract's signature validation.
- **FR-008**: System MUST display the current signature collection progress (e.g., "1 of 2 signatures collected") to users.
- **FR-009**: System MUST handle TOTP expiration by displaying pending requests whose signatures were generated in a previous TOTP window beyond the backend's tolerance (~2 hours) as expired. Expired messages are not deleted from the Transaction Service; users may re-initiate with a fresh TOTP.
- **FR-010**: System MUST continue to support the existing 1/1 parent Safe flow without regression.

### Key Entities

- **Parent Safe**: A multi-signature wallet with threshold >= 1 that is an owner of the nested Safe. Its owners must collectively sign the delegation.
- **Pending Delegation Request**: A record of an in-progress proposer delegation that has not yet reached the parent Safe's signature threshold. Contains the delegate address, label, TOTP used, and collected signatures.
- **Collected Signature**: An individual owner's signature on the delegate typed data hash, associated with a pending delegation request.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users with 2/N parent Safes can successfully add a proposer to nested Safes once the threshold of owner signatures is collected.
- **SC-002**: The signature collection flow completes within the TOTP validity window (~2 hours) for parent Safes with up to 5 owners.
- **SC-003**: 100% of completed multi-sig delegations (threshold met) result in the proposer appearing in the nested Safe's proposers list.
- **SC-004**: No regression in the existing 1/1 parent Safe proposer addition flow.
- **SC-005**: Users can clearly see the number of signatures collected versus required at every stage of the process.

## Out of Scope

- Multi-level nested Safe resolution (e.g., Safe A → Safe B → Safe C). Only the direct parent Safe (one level up) is supported for signature collection.
- Active notifications or badges for pending delegation requests outside the proposers settings page.
- Backend/Transaction Service modifications — this feature uses existing off-chain message signing infrastructure as-is.

## Assumptions

- The backend (Safe Transaction Service) already supports EIP-1271 signatures with multiple concatenated owner signatures — no backend changes are needed.
- The Safe contract's `isValidSignature` implementation validates that the concatenated signatures meet the threshold and that each signer is a current owner, with signatures sorted by owner address (ascending).
- Pending delegation requests will be stored via the Safe Transaction Service's off-chain message signing infrastructure, enabling co-owners on different devices/browsers to discover and sign pending requests without shared local state.
- The TOTP window from the backend is approximately 2 hours (current hour ± 1 hour, with chain_id variations).
- The existing `useNestedSafeOwners()` and `useIsNestedSafeOwner()` hooks correctly identify parent Safe relationships and do not need modification.
