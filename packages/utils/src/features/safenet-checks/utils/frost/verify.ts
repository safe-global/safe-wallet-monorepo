import type { WeierstrassPoint } from '@noble/curves/abstract/weierstrass'
import { secp256k1 } from '@noble/curves/secp256k1'
import { concatBytes } from '@noble/hashes/utils'
import { getBytes } from 'ethers'
import type { Hex } from '../../types'
import { h2 } from './hashes'

/**
 * FROST group-signature verification, ported from
 * `repos/safenet/explorer/src/lib/frost/verify.ts` onto the pinned
 * `@noble/curves` 1.9.7, with the explicit `z < N` scalar-range check the
 * Solidity verifier enforces (`contracts/src/libraries/FROST.sol:157-161`).
 */

export type FrostPoint = WeierstrassPoint<bigint>

export const N: bigint = secp256k1.Point.Fn.ORDER

/** Scalar multiplication of the base point: `scalar * G`. */
export const g = (scalar: bigint): FrostPoint => secp256k1.Point.BASE.multiply(scalar)

/** Build a validated curve point from affine coordinates (throws if off-curve). */
const toPoint = (coordinates: { x: bigint; y: bigint }): FrostPoint => {
  const point = secp256k1.Point.fromAffine(coordinates)
  point.assertValidity()
  return point
}

const groupChallenge = (groupCommitment: FrostPoint, groupPublicKey: FrostPoint, message: Hex): bigint =>
  h2(concatBytes(groupCommitment.toBytes(true), groupPublicKey.toBytes(true), getBytes(message)))

/**
 * Core verification: recompute `R = z·G - c·Y` and check it equals the group
 * commitment. Faithful port — assumes valid, on-curve points.
 */
export const verifySignature = (
  groupCommitment: FrostPoint,
  combinedSignatureShares: bigint,
  groupPublicKey: FrostPoint,
  msg: Hex,
): boolean => {
  const challenge = groupChallenge(groupCommitment, groupPublicKey, msg)
  const r = g(combinedSignatureShares).add(groupPublicKey.multiply(secp256k1.Point.Fn.neg(challenge)))
  if (r.is0()) return false
  return r.equals(groupCommitment)
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
 * Verify an attestation end-to-end. Total (never throws): any invalid input —
 * an out-of-range scalar, an off-curve point — resolves to `false` rather than
 * an exception, so a bad attestation can never break a poll.
 */
export const verifyAttestation = ({ groupKey, attestation, message }: AttestationInput): boolean => {
  try {
    const z = BigInt(attestation.z)
    // FROST.sol requires the combined scalar to be reduced mod N.
    if (z < 0n || z >= N) return false
    const groupPublicKey = toPoint({ x: BigInt(groupKey.x), y: BigInt(groupKey.y) })
    const groupCommitment = toPoint({ x: BigInt(attestation.r.x), y: BigInt(attestation.r.y) })
    return verifySignature(groupCommitment, z, groupPublicKey, message)
  } catch {
    return false
  }
}
