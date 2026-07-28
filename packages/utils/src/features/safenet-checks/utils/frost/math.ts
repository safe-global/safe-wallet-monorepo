import type { WeierstrassPoint } from '@noble/curves/abstract/weierstrass'
import { secp256k1 } from '@noble/curves/secp256k1'

/**
 * secp256k1 point/scalar helpers, ported from the protocol explorer
 * (`repos/safenet/explorer/src/lib/frost/math.ts`) onto the pinned
 * `@noble/curves` 1.9.7 (its `Point`/`Fn` API matches the explorer's 2.x usage).
 */

export type FrostPoint = WeierstrassPoint<bigint>

export const G_BASE: FrostPoint = secp256k1.Point.BASE
export const N: bigint = secp256k1.Point.Fn.ORDER

/** Scalar multiplication of the base point: `scalar * G`. */
export const g = (scalar: bigint): FrostPoint => secp256k1.Point.BASE.multiply(scalar)

/** Negate a scalar in the curve's scalar field (`-val mod N`). */
export const neg = (val: bigint): bigint => secp256k1.Point.Fn.neg(val)

/** Build a validated curve point from affine coordinates (throws if off-curve). */
export const toPoint = (coordinates: { x: bigint; y: bigint }): FrostPoint => {
  const point = secp256k1.Point.fromAffine(coordinates)
  point.assertValidity()
  return point
}
