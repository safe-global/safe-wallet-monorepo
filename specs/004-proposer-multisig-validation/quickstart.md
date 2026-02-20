# Quickstart: Proposer Multisig Validation

## Prerequisites

- Node.js 18+
- Yarn 4 (via corepack)
- A test environment with:
  - A 2-of-3 Safe ("parent Safe") deployed on a testnet
  - A nested Safe owned by the parent Safe
  - Access to at least 2 owner wallets of the parent Safe

## Setup

```bash
# Install dependencies
yarn install

# Start the web app in development mode (points to staging backend)
yarn workspace @safe-global/web dev
```

## Key Files to Understand

Before implementing, read these files in order:

1. **Current signing flow**: `apps/web/src/features/proposers/utils/utils.ts`
   - `getDelegateTypedData()` — generates the EIP-712 typed data
   - `signProposerTypedDataForSafe()` — signs wrapped in SafeMessage for nested owners
   - `encodeEIP1271Signature()` — encodes for contract signature validation

2. **Current UI flow**: `apps/web/src/features/proposers/components/UpsertProposer.tsx`
   - `onConfirm()` handler — branches on nested ownership
   - Currently submits immediately (works for 1/1, fails for 2/N)

3. **Off-chain message infrastructure**: `apps/web/src/services/safe-messages/safeMsgSender.ts`
   - `dispatchSafeMsgProposal()` — creates new off-chain message
   - `dispatchSafeMsgConfirmation()` — adds signature to existing message

4. **Nested ownership detection**: `apps/web/src/hooks/useNestedSafeOwners.tsx`
   - Returns parent Safe addresses that own the current Safe

5. **RTK Query hooks**: `packages/store/src/gateway/AUTO_GENERATED/messages.ts`
   - `useMessagesCreateMessageV1Mutation` — create message
   - `useMessagesUpdateMessageSignatureV1Mutation` — confirm message
   - `useMessagesGetMessagesBySafeV1Query` — list messages

## Implementation Order

### Step 1: Parent Safe Threshold Hook

Create `apps/web/src/features/proposers/hooks/useParentSafeThreshold.ts`:

- Uses `useNestedSafeOwners()` to get parent Safe address
- Fetches parent Safe info via `useSafesGetSafeV1Query`
- Returns `{ threshold, owners, parentSafeAddress }`

### Step 2: Delegation Message Service

Create `apps/web/src/features/proposers/services/delegationMessages.ts`:

- `createDelegationMessage(parentSafe, delegateTypedData, signature, origin)` — wraps RTK Query mutation
- `confirmDelegationMessage(chainId, messageHash, signature)` — wraps RTK Query mutation
- `buildDelegationOrigin(action, delegate, nestedSafe, label)` — creates origin metadata

### Step 3: Pending Delegations Hook

Create `apps/web/src/features/proposers/hooks/usePendingDelegations.ts`:

- Fetches messages for parent Safe via `useMessagesGetMessagesBySafeV1Query`
- Filters by `origin.type === 'proposer-delegation'`
- Filters by `origin.nestedSafe === currentSafeAddress`
- Derives status (pending/ready/expired) based on TOTP and confirmations
- Returns typed `PendingDelegation[]`

### Step 4: Submit Delegation Hook

Create `apps/web/src/features/proposers/hooks/useSubmitDelegation.ts`:

- Takes a confirmed `PendingDelegation` (with `preparedSignature`)
- Wraps `preparedSignature` in EIP-1271 format via `encodeEIP1271Signature`
- Submits to delegate API (V2) — add or remove based on `action`

### Step 5: Modify UpsertProposer Component

Modify `apps/web/src/features/proposers/components/UpsertProposer.tsx`:

- Check parent Safe threshold before signing
- If threshold === 1: existing flow (unchanged)
- If threshold > 1: create off-chain message, show pending state
- Add messaging about multi-sig requirement

### Step 6: Modify DeleteProposerDialog Component

Same branching logic as UpsertProposer for the removal flow.

### Step 7: Pending Delegations UI Components

Create `PendingDelegation.tsx` and `PendingDelegationsList.tsx`:

- Show pending delegation cards with progress (e.g., "1 of 2 signatures")
- Allow co-owners to sign pending requests
- Show "Submit" button when threshold is met
- Show "Expired" indicator with re-initiate option

### Step 8: Integrate into Settings Page

Modify `apps/web/src/components/settings/ProposersList/index.tsx`:

- Add `PendingDelegationsList` above or below the existing proposers list
- Only visible when parent Safe threshold > 1 and pending delegations exist

## Testing Approach

```bash
# Run tests
yarn workspace @safe-global/web test --watch

# Run type-check
yarn workspace @safe-global/web type-check
```

**MSW Handlers needed**:

- `GET /v1/chains/:chainId/safes/:safeAddress` — mock parent Safe with threshold=2
- `POST /v1/chains/:chainId/safes/:safeAddress/messages` — mock message creation
- `POST /v1/chains/:chainId/messages/:hash/signatures` — mock confirmation
- `GET /v1/chains/:chainId/safes/:safeAddress/messages` — mock message list
- `POST /v2/chains/:chainId/delegates` — mock delegate creation
- `DELETE /v2/chains/:chainId/delegates/:address` — mock delegate deletion

## Verification

After implementation, verify the full flow:

1. Connect as Owner A of a 2/3 parent Safe
2. Navigate to nested Safe → Settings → Proposers
3. Click "Add proposer" — should see multi-sig messaging
4. Sign — should create off-chain message and show pending state
5. Connect as Owner B of the same parent Safe
6. Navigate to same nested Safe → Settings → Proposers
7. See pending delegation — sign to confirm
8. After threshold met — delegation should auto-submit
9. Proposer should appear in the list
