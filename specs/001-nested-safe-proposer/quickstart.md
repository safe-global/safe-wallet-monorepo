# Quickstart: Nested Safe Proposer Management

**Date**: 2026-01-23
**Feature**: 001-nested-safe-proposer

## Prerequisites

- Node.js (version per `.nvmrc`)
- Yarn 4 (via corepack)
- Repository cloned and dependencies installed: `yarn install`

## Development Setup

```bash
# Checkout feature branch
git checkout 001-nested-safe-proposer

# Install dependencies
yarn install

# Run web app in development mode
yarn workspace @safe-global/web dev
```

## Key Files to Modify

### 1. Permission Gate (P1 - Button enablement)

**File**: `apps/web/src/components/settings/ProposersList/index.tsx`

- Replace `OnlyOwner` wrapper with `CheckWallet` component
- Configure: `allowProposer={false}` (nested owners yes, proposers no)

**File**: `apps/web/src/components/common/CheckWallet/index.tsx`

- No changes needed — already supports `isNestedSafeOwner`

### 2. Proposer Form (P2 - Signing flow)

**File**: `apps/web/src/features/proposers/components/UpsertProposer.tsx`

- Add conditional logic: if user is nested Safe owner, wrap EOA signature in EIP-1271 format
- Determine parent Safe address from `useNestedSafeOwners()`
- Use parent Safe address as `delegator` in the API call

### 3. Signing Utilities

**File**: `apps/web/src/features/proposers/utils/utils.ts`

- Add `encodeEIP1271Signature(parentSafeAddress: string, ownerSignature: string): string`
- Encodes: v=0, r=parentSafeAddress (32 bytes), s=65, + ABI-encoded owner signature

## Testing

```bash
# Run unit tests
yarn workspace @safe-global/web test

# Run specific test file
yarn workspace @safe-global/web test --testPathPattern="ProposersList"

# Type checking
yarn workspace @safe-global/web type-check

# Linting
yarn workspace @safe-global/web lint
```

## Test Scenarios

1. **Nested Safe owner sees enabled button**: Connect wallet → Open nested Safe → Settings > Setup → Verify "Add proposer" enabled
2. **Non-owner sees disabled button**: Connect unrelated wallet → Same page → Verify disabled with tooltip
3. **Direct owner flow unchanged**: Connect direct owner → Add proposer → Verify existing flow works
4. **Nested Safe owner initiates proposer addition**: Click "Add proposer" → Fill form → Submit → Verify parent Safe tx created

## Architecture Notes

- The permission fix (replacing `OnlyOwner` with `CheckWallet`) is a simple, low-risk change
- The signing flow is simpler than initially expected:
  - No on-chain transaction (SignMessageLib) needed
  - No async multisig approval needed (for 1-of-1 parent Safes)
  - Backend EIP-1271 support confirmed in Safe Transaction Service source code
  - The connected wallet signs the delegate typed data (same as direct owner), then the signature is wrapped in EIP-1271 format
- For multi-sig parent Safes (threshold > 1), collecting multiple owner signatures is needed — deferred to future phase
- Both phases can be implemented together since there are no blocking dependencies
