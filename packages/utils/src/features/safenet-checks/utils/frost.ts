import { hash_to_field } from '@noble/curves/abstract/hash-to-curve'
import { secp256k1 } from '@noble/curves/secp256k1'
import { concatBytes } from '@noble/hashes/utils'
import { sha256 } from '@noble/hashes/sha2'
import { getBytes } from 'ethers'
import type { Hex } from '../types'

/**
 * FROST(secp256k1, SHA-256) signature verification — RFC-9591, ported from
 * `repos/safenet/explorer/src/lib/frost/` onto the pinned `@noble/curves` 1.9.7,
 * with the `z < N` scalar-range check the Solidity verifier enforces
 * (`contracts/src/libraries/FROST.sol:157-161`).
 *
 * `@noble/curves` ships a `schnorr` module, but it is BIP-340: x-only public
 * keys and a `BIP0340/challenge` tagged hash. FROST derives its challenge by
 * hash-to-field under its own domain separator and signs over full compressed
 * points, so `schnorr.verify` rejects every valid Safenet attestation. Hence
 * this file.
 */

const N = secp256k1.Point.Fn.ORDER

/** RFC-9591 `H2` — the challenge hash. DST is the FROST context string + "chal". */
export const h2 = (input: Uint8Array): bigint =>
  hash_to_field(input, 1, {
    m: 1,
    p: N,
    k: 128,
    expand: 'xmd',
    hash: sha256,
    DST: 'FROST-secp256k1-SHA256-v1chal',
  })[0][0]

/** Build a validated curve point from affine coordinates (throws if off-curve). */
const toPoint = (x: bigint, y: bigint) => {
  const point = secp256k1.Point.fromAffine({ x, y })
  point.assertValidity()
  return point
}

export type AttestationInput = {
  /** Epoch group public key, affine coordinates as decimal strings. */
  groupKey: { x: string; y: string }
  /** The FROST signature carried by the attestation. */
  attestation: { r: { x: string; y: string }; z: string }
  /** The signed message — the EIP-712 proposal hash for the path that emitted it. */
  message: Hex
}

/**
 * Verify an attestation against the epoch group key: recompute `R = z·G - c·Y`
 * and check it equals the group commitment.
 *
 * Total (never throws): any invalid input — an out-of-range scalar, an off-curve
 * point — resolves to `false` rather than an exception, so a bad attestation can
 * never break a poll.
 */
export const verifyAttestation = (input: AttestationInput): boolean => {
  try {
    // Destructured inside the try: at parameter position it would throw on a
    // null/undefined argument, which the read layer polls in a loop.
    const { groupKey, attestation, message } = input
    const z = BigInt(attestation.z)
    // FROST.sol enforces `z < N`, so state it here rather than inherit it.
    // `@noble/curves` also rejects out-of-range scalars today, which makes this
    // line currently unobservable — keep it anyway: if noble ever reduced mod N
    // instead of throwing, dropping it would silently accept malleable `z`.
    if (z < 0n || z >= N) return false

    const groupPublicKey = toPoint(BigInt(groupKey.x), BigInt(groupKey.y))
    const groupCommitment = toPoint(BigInt(attestation.r.x), BigInt(attestation.r.y))
    const challenge = h2(concatBytes(groupCommitment.toBytes(true), groupPublicKey.toBytes(true), getBytes(message)))

    const r = secp256k1.Point.BASE.multiply(z).add(groupPublicKey.multiply(secp256k1.Point.Fn.neg(challenge)))
    return !r.is0() && r.equals(groupCommitment)
  } catch {
    return false
  }
}
