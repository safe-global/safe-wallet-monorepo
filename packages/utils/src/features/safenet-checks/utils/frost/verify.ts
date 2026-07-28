import { concatBytes } from '@noble/hashes/utils'
import { getBytes } from 'ethers'
import type { Hex } from '../../types'
import { h2 } from './hashes'
import { N, g, neg, toPoint, type FrostPoint } from './math'

/**
 * FROST group-signature verification, ported from
 * `repos/safenet/explorer/src/lib/frost/verify.ts`, with the explicit `z < N`
 * scalar-range check the Solidity verifier enforces
 * (`contracts/src/libraries/FROST.sol:157-161`).
 */

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
  const r = g(combinedSignatureShares).add(groupPublicKey.multiply(neg(challenge)))
  if (r.is0()) return false
  return r.equals(groupCommitment)
}

export type AttestationInput = {
  /** Epoch group public key, affine coordinates as decimal strings. */
  groupKey: { x: string; y: string }
  /** The FROST signature carried by the attestation. */
  attestation: { r: { x: string; y: string }; z: string }
  /** The signed message — the oracle-proposal hash (a.k.a. requestId). */
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
