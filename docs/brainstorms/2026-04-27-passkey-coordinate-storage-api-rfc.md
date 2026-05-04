# RFC: Passkey Coordinate Storage API

**Status:** Draft
**Author:** Daniel Dimitrov (daniel.d@safe.global)
**Date:** 2026-04-27
**Related:** [Research: Can the Auth0 passkey also be a Safe signer?](https://www.notion.so/safe-global/Can-the-Auth0-passkey-also-be-a-Safe-signer-34c8180fe57381cb8efacad8499dd40f)

---

## 1. Summary

Add a small CGW-hosted API that maps a WebAuthn `credentialId` to its P-256 public key
coordinates `(x, y)` plus the `verifiers` contract address. This is the missing piece that
lets a synced passkey on a second device be used as a Safe signer: the platform syncs the
private key but never re-emits `(x, y)`, so we have to store them ourselves.

Two endpoints, one table, no auth coupling.

## 2. Motivation

Safe's `SafeWebAuthnSignerFactory` deploys a P-256 signer proxy with `(x, y, verifiers)` as
the CREATE2 salt. The signer address is therefore deterministic: same `(x, y)` → same Safe
signer address on every chain.

WebAuthn only emits the public key once — at credential creation, in the attestation. Every
subsequent assertion returns a signature but no key, and unlike secp256k1 you cannot recover
the public key from a P-256 signature. iCloud / Google Password Manager sync the private
key across the user's devices but not the coordinates.

Concretely: a user creates a passkey on their iPhone, adds it as a Safe signer, then opens
the app on their iPad. The iPad sees the synced credential and produces an assertion, but
all it has is the `credentialId`. Without `(x, y)` we cannot derive the signer address, and
without the signer address we cannot identify which Safe this passkey owns or sign for it.

We considered Auth0's Management API as the storage layer (full analysis in the
linked research doc). Five hops, synthetic per-passkey email users, and an
unverifiable `userHandle` shortcut. We're using an auth provider to solve a
storage problem.

`(x, y)` is the public half of a keypair. Storing it ourselves, keyed by `credentialId`,
has no security downside. [Cometh](https://cometh.io) already does exactly this.

## 3. Goals & Non-Goals

**Goals**

- Allow a client to register `(credentialId, x, y, verifiers)` immediately after a passkey
  is created, with the server independently verifying the WebAuthn attestation.
- Allow any client to look up `(x, y, verifiers)` for a known `credentialId`.
- Be the single source of truth for cross-device passkey-signer recovery for Safe.

**Non-goals**

- Authentication / login / session management. The API is not aware of users.
- Storing private keys, seed material, or anything that isn't a public key.
- Replacing or wrapping the WebAuthn ceremony itself — that still happens on the device.
- Any onchain interaction. The API never deploys signers or talks to a chain.

## 4. Design

### 4.1 Endpoints

**`POST /v1/passkeys`**

Register a newly-created passkey. The request body is the full WebAuthn attestation, plus
the verifiers contract the client intends to use:

```json
{
  "rpId": "app.safe.global",
  "attestationObject": "<base64url>",
  "clientDataJSON": "<base64url>",
  "verifiers": "0x445a09..."
}
```

The server:

1. Parses `clientDataJSON`, validates `type == "webauthn.create"`, that the `rpId` in
   the request matches the one bound into the attestation, and that it appears in our
   server-side RP-ID allowlist (e.g. `app.safe.global`, `safe.global`). Writes for any
   other RP ID are rejected with `403 Forbidden` — this table is for Safe passkeys only.
2. Parses `attestationObject`, extracts the COSE-encoded public key and `credentialId`
   from `authData`.
3. Verifies the attestation statement (`fmt = none | packed | apple`, see §4.5).
4. Decodes the COSE key, asserts `alg = ES256`, `crv = P-256`, extracts `x` and `y`.
5. Persists `(credentialId, x, y, verifiers, rpId, createdAt)` if the row doesn't exist.
6. Returns the canonical record.

Responses:

- `201 Created` — new row written
- `200 OK` — row already existed with identical `(x, y, verifiers)` (idempotent)
- `409 Conflict` — `credentialId` exists with different `(x, y)` or `verifiers`
- `400 Bad Request` — malformed attestation, unsupported algorithm, RP mismatch
- `422 Unprocessable Entity` — attestation signature verification failed

**`GET /v1/passkeys/{credentialId}`**

Look up coordinates by `credentialId` (URL-encoded base64url). Public, no auth.

Response 200:

```json
{
  "credentialId": "foNlEKGDGREYERxDu3OuXu8sD-rhn1Dsy47HHcwxwg",
  "x": "0x2d3a...",
  "y": "0x9f12...",
  "verifiers": "0x445a09...",
  "rpId": "app.safe.global",
  "createdAt": "2026-04-27T10:00:00Z"
}
```

Response 404 if not found.

### 4.2 Data Model

Single Postgres table inside the CGW database. Naming conventions follow the layer:
SQL columns are `snake_case` (e.g. `credential_id`, `rp_id`, `signer_address`,
`created_at`), JSON API fields are `camelCase` (`credentialId`, `rpId`,
`signerAddress`, `createdAt`). They refer to the same values — just rendered in
each layer's idiomatic form.

| Column           | Type                                              | Notes                                                                                                                                                                             |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `credential_id`  | `bytea` PK                                        | Raw credential ID bytes                                                                                                                                                           |
| `x`              | `bytea(32)`                                       | P-256 public key X coordinate, big-endian                                                                                                                                         |
| `y`              | `bytea(32)`                                       | P-256 public key Y coordinate, big-endian                                                                                                                                         |
| `verifiers`      | `bytea(20)`                                       | Verifier contract address                                                                                                                                                         |
| `rp_id`          | `text`                                            | RP ID from `clientDataJSON`                                                                                                                                                       |
| `signer_address` | `bytea(20)`                                       | Counterfactual CREATE2 address (analytics, derived)                                                                                                                               |
| `created_at`     | `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()` | Server timestamp of first successful write. Matches CGW's convention used across `users`, `wallets`, `organizations`, etc. No `updated_at` — rows are immutable by design (§4.3). |

Each field is encoded in the form that's idiomatic for its domain. This is a
deliberate split, not a single uniform encoding:

| Field                                      | Wire format                         | Why                                                                                                                                                                              |
| ------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x`, `y`                                   | `0x`-prefixed lowercase 64-char hex | They're 256-bit unsigned ints in `F_p`. `0x`-hex is the universal Ethereum convention for `bytes32`/`uint256`; consumers can pass directly into `BigInt(...)` and onchain calls. |
| `verifiers` and any other Ethereum address | EIP-55-checksummed `0x`-hex         | Standard Ethereum address rendering. Accepted case-insensitively on input; emitted checksummed.                                                                                  |
| `credentialId`                             | base64url (no padding)              | This is the WebAuthn spec encoding for the field — what `PublicKeyCredential.id` and `clientDataJSON` already serialize to. Anything else would require clients to convert.      |
| `attestationObject`, `clientDataJSON`      | base64url (no padding)              | Same reasoning — these are WebAuthn byte blobs and the spec serializes them this way.                                                                                            |
| Timestamps                                 | RFC 3339 / ISO 8601 (UTC)           | Standard JSON-API convention.                                                                                                                                                    |

The principle: WebAuthn-domain fields take their encoding from the WebAuthn spec;
Ethereum-domain fields take their encoding from the Ethereum ecosystem. This
keeps the API legible from both sides without forcing one domain to translate.

At rest, all of these are stored as raw bytes (`bytea`) — encoding only matters on
the wire. The server normalizes input (lowercases hex, strips/adds `0x`, validates
base64url charset) before persisting, so a single canonical byte sequence is the
source of truth.

`signer_address` is a derived column: at write time we compute the counterfactual
CREATE2 address from `(x, y, verifiers)` plus the known `SafeWebAuthnSignerFactory`
address and proxy init-code hash. Authoritative input is still `(x, y, verifiers)` —
this column exists purely so the data team can export the set of Safe-passkey signer
addresses and correlate them with onchain activity (signing, owner changes, deployments)
without having to replicate the CREATE2 derivation in their pipeline. It is **not**
exposed via the public GET response and **not** part of the API contract; if the
factory's init-code hash ever changes we'll recompute the column rather than treat
it as ground truth.

Estimated row size ~150 bytes; even at 10M passkeys this is ~1.5 GB. No partitioning,
no archival, no TTL.

### 4.3 Write semantics

Writes are immutable and idempotent. `(credentialId, x, y, verifiers)` is fixed at the
moment of attestation; nothing legitimate ever needs to mutate it. A retry of the same
attestation is a 200, a different `(x, y)` for the same `credentialId` is a 409. The
server is the source of truth — clients never see a "your coords were overwritten" state.

### 4.4 No delete endpoint

The data is public-key material, not PII. More importantly, the corresponding signer
proxy is deployed onchain via `SafeWebAuthnSignerFactory` and cannot be removed — its
address is a CREATE2 function of `(x, y, verifiers)`. Any Safe that has this passkey
as an owner will keep referencing that signer address forever. Deleting our offchain
record doesn't undo the onchain reality; it just makes that owner unrecoverable on
any device that hadn't already cached the coordinates.

The correct way to "remove" a passkey is to rotate it out as a Safe owner onchain
(`swapOwner` / `removeOwner`). After that, our row is harmless residual data — there
is still no operational reason to delete it, but at that point doing so wouldn't
strand a Safe.

### 4.5 Attestation handling

The server uses `@simplewebauthn/server` for parsing and signature verification. The
library covers every `fmt` value in the WebAuthn spec — `none`, `packed`, `apple`,
`android-key`, `android-safetynet`, `tpm`, `fido-u2f` — including CBOR decoding,
certificate-chain checks, and AAGUID handling. We accept whatever it accepts; we do
not maintain a per-format allowlist.

We do **not** require enterprise attestation or trust-store validation. The goal of
verification here is to ensure `(credentialId, x, y)` are internally consistent and
freshly minted, not to prove device provenance.

### 4.6 Rate limiting

Both endpoints use CGW's existing `RateLimitGuard`
([`rate-limit.guard.ts`](https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/common/guards/rate-limit.guard.ts)),
the same primitive Spaces and Address Books already use. It keys on `route + method +
client IP`, increments a Redis counter with a TTL window, returns `429 Too Many Requests`
on overflow, and logs the hit. Limits are env-configurable with sensible defaults:

| Endpoint                | Default    | Env vars                                                                    |
| ----------------------- | ---------- | --------------------------------------------------------------------------- |
| `GET /v1/passkeys/{id}` | 120 / 600s | `PASSKEYS_READ_RATE_LIMIT_MAX`, `PASSKEYS_READ_RATE_LIMIT_WINDOW_SECONDS`   |
| `POST /v1/passkeys`     | 20 / 600s  | `PASSKEYS_WRITE_RATE_LIMIT_MAX`, `PASSKEYS_WRITE_RATE_LIMIT_WINDOW_SECONDS` |

The asymmetry is deliberate. A user typically has a handful of passkeys, and the client
only calls `GET` on a local cache miss, so steady-state reads per IP are near zero — the
generous read budget is sized for first-launch on a new device, not normal use. Writes,
on the other hand, are already gated by attestation signature verification, so the
stricter write budget is just defence-in-depth against a compromised attestation
generator.

We do **not** add a `HEAD`/exists probe or hashed-credentialId scheme. The
Safe-passkey signer set is already enumerable onchain via `SafeWebAuthnSignerFactory`
deployment events, so obscuring it at the API layer would add complexity for no real
privacy gain.

### 4.7 Trust & threat model

| Threat                                                   | Mitigation                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| Client lies about `(x, y)`                               | Server re-derives them from the attestation                      |
| Attacker registers a `credentialId` they don't own       | Attestation signature must verify; can't be forged               |
| Attacker overwrites a victim's `(x, y)`                  | Immutable: 409 on conflict                                       |
| Bulk enumeration of which credentialIds are Safe signers | Per-IP read rate limit (§4.6); set is already onchain-enumerable |
| Spammy/abusive writes                                    | Attestation verification + per-IP write rate limit (§4.6)        |
| API outage blocks signing on new device                  | Clients cache `(x, y)` locally on first lookup                   |

Not in scope: protecting against an attacker who can already produce assertions with the
victim's passkey (they own the device, game over).

## 5. Alternatives Considered

- **Auth0 Management API as storage.** Five-hop fetch, requires synthetic emailed users,
  `userHandle` shortcut isn't verifiable. Solving a storage problem with an auth provider.
- **Stuff coords into `largeBlob` extension.** Was the original plan. iOS doesn't sync
  `largeBlob` across devices via iCloud Keychain — same problem in a different shape.
- **Per-chain on-chain registry.** Defeats determinism (we'd be paying gas to write what
  is already implied by the salt) and doesn't help cross-device on the first sign.
- **Client-side derivation from a passkey-derived seed.** WebAuthn deliberately doesn't
  expose key material outside the secure enclave; not possible.

## 6. Reviewer Feedback Wanted

No specific blocking decisions remain — the design above is internally consistent and
matches what the mobile stack already does. General feedback welcome on:

- Whether the threat model in §4.7 misses anything Safe-specific.
- Whether CGW is the right home (vs. e.g. a separate small service) given operational
  preferences.
- Any product concerns about labelling / multi-passkey UX that should shape the
  schema before we freeze it.

## 7. Rollout

1. Land schema migration + endpoints behind a CGW feature flag.
2. Wire mobile app to call `POST` after every successful passkey creation, and `GET` as
   the fallback path when a synced credential surfaces with no local cache.
3. Web follows once the wallet-side passkey signer ships on `app.safe.global`.
4. Lift the feature flag once we've verified end-to-end recovery on iOS + Android +
   web with a fresh device.

## 8. References

- Research: [Can the Auth0 passkey also be a Safe signer?](https://www.notion.so/safe-global/Can-the-Auth0-passkey-also-be-a-Safe-signer-34c8180fe57381cb8efacad8499dd40f)
- Safe contracts: `SafeWebAuthnSignerFactory`
- WebAuthn spec: https://www.w3.org/TR/webauthn-3/
- Cometh's prior art on `(credentialId → x, y)` storage
