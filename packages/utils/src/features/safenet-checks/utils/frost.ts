import { hash_to_field } from '@noble/curves/abstract/hash-to-curve'
import { secp256k1 } from '@noble/curves/secp256k1'
import { concatBytes } from '@noble/hashes/utils'
import { sha256 } from '@noble/hashes/sha2'
import { getBytes } from 'ethers'
import type { Hex } from '../types'

/**
 * FROST(secp256k1, SHA-256) signature verification per RFC-9591. Hand-rolled
 * because `@noble/curves`' `schnorr` is BIP-340 (x-only keys, different
 * challenge hash) and rejects every valid Safenet attestation.
 */

const N = secp256k1.Point.Fn.ORDER

/** RFC-9591 `H2` — the challenge hash. */
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

/** True when (x, y) parses as a valid, non-identity secp256k1 point. */
export const isValidPoint = (point: { x: string; y: string }): boolean => {
  try {
    toPoint(BigInt(point.x), BigInt(point.y))
    return true
  } catch {
    return false
  }
}

export type AttestationInput = {
  /** Epoch group public key, affine coordinates as decimal strings. */
  groupKey: { x: string; y: string }
  attestation: { r: { x: string; y: string }; z: string }
  /** The signed message — the EIP-712 proposal hash for the path that emitted it. */
  message: Hex
}

/**
 * Verify an attestation against the epoch group key: recompute `R = z·G - c·Y`
 * and check it equals the group commitment. Total — any invalid input resolves
 * to `false` rather than an exception.
 */
export const verifyAttestation = (input: AttestationInput): boolean => {
  try {
    // Destructured inside the try so a null argument returns false, not throws.
    const { groupKey, attestation, message } = input
    const z = BigInt(attestation.z)
    // FROST.sol enforces `z < N`; noble currently rejects out-of-range scalars
    // too, but that must not be inherited silently — it guards malleable `z`.
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
