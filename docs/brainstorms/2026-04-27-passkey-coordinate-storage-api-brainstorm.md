---
date: 2026-04-27
topic: passkey-coordinate-storage-api
---

# Passkey Coordinate Storage API (RFC scope)

## What We're Building

A small API, hosted in the Client Gateway, that maps a WebAuthn `credentialId` to its
P-256 public key coordinates `(x, y)` and the associated `verifiers` contract address.
This unblocks Safe signer recovery on a second device: when a synced passkey shows up
on a new phone, we have only a `credentialId` from the assertion — the API gives us
the `(x, y, verifiers)` we need to derive the deterministic `SafeWebAuthnSignerFactory`
signer address.

Scope is intentionally narrow: a write endpoint at registration time, a read endpoint
at recovery/sign time. No auth coupling, no orchestration, no synthetic users.

## Why This Approach

The blog ([auth0-passkey-as-onchain-signer.md](../../../content/blogs/auth0-passkey-as-onchain-signer.md))
walks through why we are not solving this through Auth0: the Management API path takes
five hops, requires synthetic email users, and the `userHandle` shortcut is unverifiable
before you have the public key. `(x, y)` is the public half of a keypair — there is no
security reason not to store it ourselves keyed by `credentialId`. Cometh already does this.

Of the considered hosts, CGW wins on operational fit (existing auth, deploy, monitoring,
client SDKs) without forcing the wrong domain shape onto Config or Transaction Service.

## Key Decisions

- **Write trust model — verify the WebAuthn attestation on the server.** Client posts the
  full `attestationObject` + `clientDataJSON`; the backend parses the COSE key and extracts
  `(credentialId, x, y)` itself. The client never asserts coordinates the server then trusts.
- **Read model — public lookup by `credentialId`.** `GET /v1/passkeys/{credentialId}` returns
  `{ x, y, verifiers, createdAt }`. No auth: `(x, y)` is public and the lookup is required
  before we even know what wallet, if any, this passkey owns.
- **Schema — `(credentialId, x, y, verifiers, createdAt)`.** `verifiers` is mandatory; without
  it the deterministic CREATE2 signer address can't be reproduced cross-chain. Other metadata
  (rpId, label, deviceHint) deferred to a follow-up — not needed for the recovery flow.
- **Write semantics — immutable, idempotent first-write-wins.** Re-posting an identical
  `(credentialId, x, y, verifiers)` returns 200. A conflicting `(x, y)` for an existing
  `credentialId` returns 409. Coordinates are fixed at passkey creation; nothing legitimate
  ever needs to mutate them.
- **Service home — extend CGW.** New module/endpoints under CGW; backed by its existing
  Postgres. No new service to operate.
- **Lifecycle — no delete endpoint.** The data is public-key material, not PII, and deleting
  it would silently brick Safe recovery on any device that hadn't yet cached the coords.
  Revisit only if a concrete legal requirement forces it.

## Open Questions

These should be settled in the RFC and during planning, not now:

- **Rate limiting & enumeration.** Reads are public; do we need per-IP throttles or a
  bloom-filter-style "exists" probe to discourage scraping which credentialIds are Safe signers?
- **rpId storage and scoping.** Worth recording even if not returned, for debugging cross-RP
  issues and future analytics. Decide before schema is frozen.
- **Listing / batch reads.** Useful if a device may hold multiple synced Safe-signer passkeys
  and we want a single round-trip. Defer unless mobile UX needs it.
- **Attestation formats accepted.** `none` (most platform authenticators), `packed`, `apple`?
  Which subset must be supported on day one across iOS, Android, web?
- **Exact CGW endpoint path, OpenAPI shape, and auth-header story** — to be drafted in the RFC.
- **Storage encoding** — `(x, y)` as `0x`-prefixed 32-byte hex, COSE blob, or both? Pick one
  canonical form to avoid round-trip ambiguity.

## Next Steps

→ Draft the RFC in Notion using the linked template, capturing the decisions above and
resolving the open questions before implementation.
→ `/safe-engineering:workflows-plan` once the RFC has feedback and we're ready to scope
the CGW changes.
