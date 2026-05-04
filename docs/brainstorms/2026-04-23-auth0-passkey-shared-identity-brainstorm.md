---
date: 2026-04-23
topic: auth0-passkey-shared-identity
---

# Auth0 Passkey as Shared Onchain Identity

## What We're Building

A single WebAuthn passkey that serves two purposes:

1. **Authentication** — logs the user into Auth0 (used by the web app's spaces feature and, eventually, the mobile app).
2. **Onchain identity** — signs Safe transactions directly against a P-256 verifier (e.g. `SafeWebAuthnSignerFactory` / `SafeWebAuthnSharedSigner`). Signer address is deterministic from the passkey's (x, y) public key coordinates.

Goal: avoid the UX oddity of users having two separate passkeys (one Auth0-owned for auth, one app-owned for signing) stored in their OS passkey manager. Auth0 is out of the signing path entirely; at sign time the OS surfaces available passkeys for the RP domain and the user picks one.

## Why This Approach

Initially assumed Auth0-managed passkeys were opaque to the relying party — standard "SDK returns only OIDC tokens" mental model. Research overturned this:

- **Auth0 Native Passkeys API** has the mobile app own the WebAuthn ceremony locally. The app receives the full `AuthenticatorAttestationResponse` (including `attestationObject`) before forwarding it to Auth0 for registration via `/oauth/token`. App can extract x/y/credentialId inline.
- **Management API exposes the public key** on `GET /api/v2/users/{id}/authentication-methods`: returns `public_key` (base64 COSE_Key) and `key_id` (base64url credentialId). Decoding the COSE gives x (field -2) and y (field -3). This closes the gap for passkeys registered via web Universal Login, where the browser never hands the attestation to your app.

Alternative approaches considered and rejected:

- **Two separate passkeys, align UX** — Simpler to ship but permanently confusing for users.
- **Skip Auth0 passkey entirely** — Would force Auth0 auth users into email-OTP-only, weakening auth UX and still requiring separate signing passkey on mobile.
- **App-owned passkey, enroll into Auth0 post-hoc** — Auth0's Management API for creating passkey credentials reportedly 404s; `webauthn-roaming` imports work but produce 2FA factors, not passkeys. Not a viable path today.

## Key Decisions

- **Mobile registration path**: Use Auth0's Native Passkeys API. Parse `attestationObject` locally before forwarding to `/oauth/token`. Extract (x, y) + credentialId for onchain signer setup.
- **Web registration path**: Use Auth0 Universal Login for the WebAuthn ceremony. Backend calls Management API (M2M token with `read:authentication_methods`) to retrieve `public_key` + `key_id` for the newly enrolled passkey. Decode COSE → (x, y).
- **Signing path**: Direct WebAuthn assertion (`navigator.credentials.get()` on web, `react-native-passkey` on mobile) with `challenge = safeTxHash`. Pass `allowCredentials = [credentialIds registered as Safe owners]` so the OS picker only surfaces valid signers — an Auth0 auth-only passkey that was never promoted to a signer simply will not appear. Submit signature to Safe's P-256 verifier. **Auth0 is not in the signing path.**
- **Onchain address**: Deterministic via CREATE2 from (x, y) through Safe's WebAuthn signer factory. Same passkey → same address on every chain.
- **Multi-passkey model**: Each enrolled passkey has its own (x, y) and its own deterministic P-256 signer address. Multiple enrolled passkeys → multiple potential Safe owners. The Safe owner set is the source of truth for "which passkey can sign this Safe"; the OS picker is filtered to that set via `allowCredentials`. Auth0 user record structure (one user / synthetic email / multiple passkeys per email) does not affect signing — it's a concern only for the auth side.
- **RP ID strategy**: Custom Auth0 domain (e.g. `auth.safe.global`) that Safe owns. Mobile app declares the same domain in Apple Associated Domains / Android Digital Asset Links so OS surfaces the credential for direct assertions. Default `*.auth0.com` domains will not work — the app can't claim them. **Note the current mobile app uses `RP_ID = 'app.safe.global'`** ([apps/mobile/src/services/passkey/passkey.service.ts:4](apps/mobile/src/services/passkey/passkey.service.ts#L4)); for the shared-identity design, the RP ID on the Auth0 side and the app side must match (or use a common parent-scoped RP ID like `safe.global`). Existing passkeys registered under `app.safe.global` would need a migration path if the RP ID changes.
- **Mobile signing already filters correctly**: [`authenticatePasskey`](apps/mobile/src/services/passkey/passkey.service.ts#L73) forwards `allowCredentials` from protocol-kit to `react-native-passkeys` `get()`. Today the `PasskeyArgType` in [`signWithPasskey`](apps/mobile/src/services/tx/tx-sender/signWithPasskey.ts#L34) carries exactly one `rawId` per Safe. For multi-passkey-per-Safe support the caller needs to supply the full set of Safe-owner credentialIds (array instead of single), or pre-select one before invoking protocol-kit. No change needed to `authenticatePasskey` itself — it already handles arrays.

## Open Questions

- **How do new passkeys become Safe owners?** A newly enrolled passkey is _not_ automatically a Safe owner — Safe ownership changes require a tx signed by an existing owner. The design choice is only whether the app prompts the user to sign `addOwnerWithThreshold` _immediately_ after passkey enrollment (one guided flow) or leaves it as a separate later action. Either way it's a user-signed, gas-costing Safe tx per chain.
- **Should the onchain signer proxy be deployed eagerly or lazily (bundled into the first Safe tx)?** Gas + UX trade-off; likely lazy.
- **Cross-device sync**: out of Auth0's and Safe's hands — depends on the user's platform (iCloud Keychain / Google Password Manager / 1Password). Documented, not solved here. Same constraint as the existing mobile passkey signer work (see largeBlob memory).
- **Custom login page + passkey**: Auth0 docs note that custom login pages don't support passkeys today. Confirm whether Safe's planned spaces login UX is affected, or whether hosted Universal Login is acceptable for the passkey ceremony.
- **Multiple custom domains**: Auth0 binds a passkey to exactly one RP ID. If Safe ever runs multiple custom Auth0 domains, users can only enroll a passkey on one of them. Worth confirming this is a non-issue for spaces.
- **Management API public_key shape confirmation**: One source blog post shows the `public_key` field; we have not yet called the API against a live tenant to verify the encoding (COSE vs SPKI) and confirm credentialId format. Recommend a 20-minute spike against a dev Auth0 tenant before committing.

## Next Steps

→ Validate the Management API response shape against a live Auth0 tenant (quick spike).
→ Confirm RP ID / custom domain plan with the spaces team.
→ `/safe-engineering:workflows:plan` for implementation details once the two above are resolved.
