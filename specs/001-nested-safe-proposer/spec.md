# Feature Specification: Nested Safe Proposer Management

**Feature Branch**: `001-nested-safe-proposer`
**Created**: 2026-01-23
**Status**: Draft
**Input**: User description: "As a user with a Safe and a nested safe, I want to be able to add a proposer to the nested safe. Currently when connected to my nested safe and on the settings page the add a proposer button is disabled with the error message 'Your connected wallet is not a signer of this Safe Account'"

## Clarifications

### Session 2026-01-23

- Q: Who is the delegator when a nested Safe owner adds a proposer — the connected wallet (EOA) or the parent Safe? → A: The parent Safe address is the delegator. This requires the parent Safe to produce the delegation signature via a multisig approval flow.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Add Proposer to Nested Safe via Parent Safe Ownership (Priority: P1)

As a user whose connected wallet controls a parent Safe that is an owner of a nested Safe, I want to add a proposer to the nested Safe so that I can delegate transaction proposal rights without being a direct signer of the nested Safe.

Currently, when I navigate to the nested Safe's Settings > Setup page, the "Add proposer" button is disabled with the tooltip "Your connected wallet is not a signer of this Safe Account." This occurs because the permission check only verifies direct ownership, not ownership through a parent Safe in the hierarchy.

**Why this priority**: This is the core bug/feature gap — users who legitimately control a nested Safe through a parent Safe are blocked from managing proposers, which breaks expected functionality.

**Independent Test**: Can be fully tested by connecting a wallet that owns a parent Safe (which is an owner of the nested Safe), navigating to the nested Safe's settings, and verifying the "Add proposer" button is enabled and functional.

**Acceptance Scenarios**:

1. **Given** a user whose wallet is a signer of Safe A, and Safe A is an owner of Safe B (nested Safe), **When** the user navigates to Safe B's Settings > Setup page, **Then** the "Add proposer" button is enabled and clickable.
2. **Given** a user whose wallet is a signer of Safe A, and Safe A is an owner of Safe B, **When** the user clicks "Add proposer" on Safe B's settings, **Then** the proposer creation dialog opens and functions correctly.
3. **Given** a user whose wallet is a signer of Safe A, and Safe A is an owner of Safe B, **When** the user submits a new proposer for Safe B, **Then** the proposer is successfully added and appears in the proposers list.

---

### User Story 2 - Correct Permission Feedback for Non-Owners (Priority: P2)

As a user who is neither a direct signer nor a nested Safe owner, I want to see the appropriate disabled state and error message so that I understand why I cannot add a proposer.

**Why this priority**: Ensures that the permission relaxation for nested Safe owners does not inadvertently allow unauthorized users to manage proposers.

**Independent Test**: Can be tested by connecting a wallet that is neither a direct owner nor a nested Safe owner of the target Safe, and verifying the button remains disabled with the correct message.

**Acceptance Scenarios**:

1. **Given** a user whose wallet is not a signer of the Safe and does not control any parent Safe that owns it, **When** the user views the Settings > Setup page, **Then** the "Add proposer" button remains disabled with the message "Your connected wallet is not a signer of this Safe Account."
2. **Given** a user who is only a proposer (not an owner or nested Safe owner), **When** the user views the Settings > Setup page, **Then** the "Add proposer" button remains disabled.

---

### User Story 3 - Signing Flow for Nested Safe Proposer Addition (Priority: P2)

As a nested Safe owner adding a proposer, I want the delegation to be authorized by the parent Safe (as the delegator) so that the proposer is properly registered under the parent Safe's authority.

Since the parent Safe is the delegator (not the connected EOA wallet), adding a proposer from a nested Safe requires a multisig approval flow on the parent Safe to produce the delegation signature. The user initiates the proposer addition from the nested Safe's settings, but the authorization is routed through the parent Safe.

**Why this priority**: The proposer delegation must be signed by the delegator (parent Safe). This requires orchestrating a multisig transaction on the parent Safe, which is more complex than a direct EOA signature.

**Independent Test**: Can be tested by initiating a proposer addition on the nested Safe, confirming it creates a signing request on the parent Safe, completing the multisig approval, and verifying the proposer appears in the nested Safe's list.

**Acceptance Scenarios**:

1. **Given** a nested Safe owner has entered a valid proposer address and label on the nested Safe's settings, **When** they submit the form, **Then** a signing/approval request is created on the parent Safe for the delegation.
2. **Given** the parent Safe's required threshold of signers have approved the delegation, **When** the delegation is submitted to the backend, **Then** it is accepted and the proposer appears in the nested Safe's proposers list.
3. **Given** a nested Safe owner initiates a proposer addition but the parent Safe's threshold is not yet met, **When** they view the status, **Then** they can see the pending approval state.

---

### Edge Cases

- What happens when the user's wallet controls multiple parent Safes that are owners of the nested Safe? The user should still be able to add a proposer (any valid nested ownership path is sufficient).
- What happens when the nested Safe is undeployed (counterfactual)? The "Add proposer" button should remain disabled with the existing "activate Safe" message, regardless of nested ownership.
- What happens when the parent Safe is removed as an owner of the nested Safe while the user is on the settings page? The button should reflect the updated ownership state on next data refresh.
- What happens if the nested ownership chain is deeper than one level (Safe A owns Safe B, which owns Safe C)? Only direct parent Safe ownership should be considered (one level deep), consistent with existing nested Safe owner detection behavior.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST recognize a user as authorized to manage proposers on a Safe if their connected wallet is a signer of any Safe that is a direct owner of the target Safe (nested Safe ownership).
- **FR-002**: System MUST enable the "Add proposer" button for users who are nested Safe owners, provided the Safe is deployed.
- **FR-003**: System MUST continue to disable the "Add proposer" button for users who are neither direct signers nor nested Safe owners.
- **FR-004**: System MUST allow nested Safe owners to initiate a proposer addition (enter address, provide label) and route the delegation signature through the parent Safe's multisig approval flow, using the parent Safe as the delegator.
- **FR-005**: System MUST maintain the existing disabled state and tooltip message for undeployed Safes, regardless of ownership type.
- **FR-006**: System MUST validate that proposed addresses are not the Safe itself and not existing owners, regardless of whether the requester is a direct signer or nested Safe owner.

### Key Entities

- **Safe Account (Parent)**: A multi-signature wallet whose signers include the connected user's wallet. Acts as an owner of the nested Safe.
- **Safe Account (Nested/Child)**: A multi-signature wallet that has another Safe Account as one of its owners. This is the Safe where the proposer is being added.
- **Proposer**: An address delegated permission to suggest transactions to a Safe, without approval or execution rights.
- **Nested Safe Owner**: A user whose connected wallet is a signer of a Safe that is itself an owner of the target Safe.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users who are nested Safe owners can successfully add a proposer to the nested Safe within 60 seconds of navigating to the settings page.
- **SC-002**: 100% of proposer additions by nested Safe owners result in the proposer appearing in the proposers list after page refresh.
- **SC-003**: The "Add proposer" button correctly reflects permissions for all ownership scenarios (direct owner, nested owner, non-owner) with zero false positives or false negatives.
- **SC-004**: No regression in existing proposer management functionality for direct Safe owners.

## Assumptions

- The existing nested Safe owner detection correctly identifies whether the connected wallet controls a parent Safe that owns the current Safe. This behavior is already implemented and used elsewhere in the app.
- The proposer delegation signing flow for nested Safe owners uses the parent Safe as the delegator, requiring multisig approval on the parent Safe to produce the delegation signature. The backend delegation API accepts Safe contract signatures (not just EOA signatures) as valid delegator authorization.
- Nested Safe ownership detection is limited to one level of nesting (the connected wallet's Safe is a direct owner of the target Safe), consistent with existing behavior.
- The feature flag for proposers is already enabled on the relevant chains and does not need modification.
