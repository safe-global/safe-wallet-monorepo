---
date: 2026-03-23
---

topic: mobile-passkey-signer

# Mobile Passkey Signer MVP

## What We're Building

A passkey-based signer for the Safe mobile app. Users can create a passkey on a dedicated tab, get a counterfactual identity contract address, and add that address as a Safe owner (via the web app). When the mobile app detects a Safe owner that matches a locally stored passkey, it enables signing with that passkey — automatically deploying the identity contract via Gelato relay if it hasn't been deployed yet.

## Core Flow

1. **Create passkey** — New tab with "Create passkey" button. Uses `react-native-passkeys` for WebAuthn registration (`create()`).
2. **Compute identity address** — `Safe.createPasskeySigner()` derives the `SafeWebAuthnSignerProxy` address counterfactually from the passkey's public key coordinates (x, y) + verifier address + factory address. No on-chain deployment yet.
3. **Display address** — Show the identity contract address with a copy button. User adds it as a Safe owner via the web app.
4. **Owner detection** — When the app fetches Safe owners, it matches owner addresses against locally stored passkey identity addresses.
5. **Signing flow** — When a passkey-owner needs to sign:
   - Check if identity contract is deployed on the current chain
   - If not deployed: deploy via Gelato relay, show "Deploying contract..." UI, wait for confirmation
   - Prompt biometric authentication (passkey `get()`)
   - Submit signature to the tx service
6. **Multi-chain** — If the user signs on a chain where the identity contract isn't deployed, deploy it on that chain first.

## Why This Approach

**Counterfactual deployment** delays gas costs until the passkey is actually used for signing. This avoids wasting gas if the user creates a passkey but never adds it as an owner.

**Deploy-on-sign** (vs deploy-on-execute) guarantees the identity contract exists before the signature is submitted. This is critical because Safe's `checkSignatures` calls `isValidSignature()` on the owner address via ERC-1271 — if no contract is deployed at that address, verification reverts. By deploying before submitting the signature, we ensure it works regardless of who executes the transaction (threshold=1 sole signer, or multi-sig where another party executes).

## Key Decisions

- **Deploy timing**: Deploy identity contract on sign, not on execute. Guarantees verification works for both single-signer and multi-sig scenarios. Small gas cost via Gelato is acceptable.
- **Owner detection**: Store `{credentialId → identityContractAddress}` mapping locally. Fast lookup when checking Safe owners.
- **Storage**: Use `react-native-keychain` with `ACCESSIBLE.AFTER_FIRST_UNLOCK` (without `THIS_DEVICE_ONLY`) to enable iCloud Keychain / Google backup sync. Data stored: `rawId`, `coordinates.x`, `coordinates.y`, `identityContractAddress`, per-chain deployment status. No encryption needed — this is public key metadata, not secret.
- **Add-as-owner**: External (web app) for MVP. Mobile app detects new owners via existing Safe data sync.
- **Signing serialization**: One transaction at a time. Sign → deploy (if needed) → wait for deployment → submit signature → next.
- **RP ID**: `safe.global` (already established).

## Critical Edge Cases

### 1. ERC-1271 Verification Requires Deployed Contract

Safe's `checkSignatures` calls `isValidSignature()` on the owner address. The `SafeWebAuthnSignerFactory` supports counterfactual verification for ERC-4337, but standard Safe signature checks need the contract deployed. **Solution**: Always deploy before submitting signature.

### 2. Passkey Metadata vs Passkey Credential

The OS keychain syncs the passkey _credential_ (private key) across devices. But the _public key coordinates_ (x, y) are only returned during registration (`create()`), not during authentication (`get()`). If the app-local metadata is lost, the passkey can still sign but we can't match it to a Safe owner. **Solution**: Store metadata in `react-native-keychain` with iCloud sync enabled.

### 3. Multi-Chain Identity Deployment

The identity contract must be deployed separately on each chain. Track deployment status per chain in the stored metadata. **Solution**: Check deployment on the active chain before each signing operation.

### 4. Gelato Relay for Identity Contract Deployment

The existing CGW relay API (`/v1/chains/{chainId}/relay`) may only accept Safe addresses as `to`. Deploying the identity contract calls `createSigner` on `SafeWebAuthnSignerFactory`, which is not a Safe address. **Open question**: Verify if CGW relay supports factory calls. If not, call Gelato relay API directly.

### 5. Gelato Deployment Failure

If Gelato relay fails or times out during identity contract deployment, the signing flow is blocked. **Solution**: Clear error messaging ("Identity contract deployment failed. Your signature cannot be submitted until the contract is deployed. Retry?"). Do not submit the signature without confirmed deployment.

### 6. Domain Binding

Passkeys are bound to the RP ID (`safe.global`). Changing this would invalidate all existing passkeys. **Solution**: RP ID is already established and stable. Document this dependency.

## Technical Components

| Component           | Technology                                              | Notes                                                                 |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Passkey creation    | `react-native-passkeys`                                 | WebAuthn `create()` with `alg: -7` (P-256)                            |
| Signer derivation   | `@safe-global/protocol-kit`                             | `Safe.createPasskeySigner()` for counterfactual address               |
| Passkey signing     | `react-native-passkeys`                                 | WebAuthn `get()` returns authenticatorData, clientDataJSON, signature |
| Metadata storage    | `react-native-keychain`                                 | iCloud sync via `AFTER_FIRST_UNLOCK` accessible level                 |
| Identity deployment | Gelato relay (TBD: via CGW or direct)                   | `SafeWebAuthnSignerFactory.createSigner()`                            |
| Owner detection     | RTK Query Safe data                                     | Match owner addresses against stored identity addresses               |
| Signature encoding  | `abi.encode(authenticatorData, clientDataFields, r, s)` | Required format for ERC-1271 verification                             |

## Open Questions

- **CGW relay compatibility**: Can the CGW relay endpoint (`/v1/chains/{chainId}/relay`) relay calls to `SafeWebAuthnSignerFactory`, or does it only support Safe contract addresses? If not, need direct Gelato integration.
- **Protocol Kit passkey support maturity**: The tutorial uses `Safe.createPasskeySigner()` and `protocolKit.signTransaction()` with passkey signers. Verify this works with the latest protocol-kit version in the monorepo.
- **Signature format for tx service**: When submitting a passkey signature to the Safe transaction service, does it accept the ERC-1271 contract signature format? Or does it need special handling?
- **Which chains support the SafeWebAuthnSignerFactory**: Need to verify factory deployment on all chains the mobile app supports.

## Next Steps

→ `/safe-engineering:workflows:plan` for implementation details
