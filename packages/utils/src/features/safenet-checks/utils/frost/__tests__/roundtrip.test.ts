import { concatBytes } from '@noble/hashes/utils'
import { getBytes, keccak256, toBeHex } from 'ethers'
import { h2 } from '../hashes'
import { N, g, verifyAttestation } from '../verify'
import type { Hex } from '../../../types'

/**
 * Sign/verify round-trip properties.
 *
 * The golden vectors prove the verifier accepts two specific real signatures.
 * They cannot prove it *rejects* things, and a verifier that returns `true` too
 * easily is a security hole where one that returns `false` is only a UX bug. So
 * these tests sign locally across many random keys and assert both directions:
 * every honestly-produced signature verifies, and every single-field mutation
 * of it does not.
 *
 * The signer here is the group-signature equation FROST reduces to once shares
 * are combined — `z = k + c·x`, verified as `z·G - c·Y == R`. It is written from
 * the equation rather than ported, so agreement with the verifier is evidence
 * about the verifier, not a shared transcription.
 */

/** Deterministic scalars in [1, N): keccak(seed || i) reduced mod N. */
const scalarAt = (seed: string, index: number): bigint => {
  const raw = BigInt(keccak256(getBytes(keccak256(getBytes(`0x${Buffer.from(`${seed}:${index}`).toString('hex')}`)))))
  const reduced = raw % (N - 1n)
  return reduced + 1n
}

const messageAt = (index: number): Hex => keccak256(getBytes(toBeHex(index + 1, 32))) as Hex

/** Produce an honest group signature over `message` for secret key `x`. */
const sign = (x: bigint, k: bigint, message: Hex) => {
  const groupPublicKey = g(x)
  const groupCommitment = g(k)
  const challenge = h2(concatBytes(groupCommitment.toBytes(true), groupPublicKey.toBytes(true), getBytes(message)))
  const z = (k + ((challenge * x) % N)) % N
  const affine = (point: ReturnType<typeof g>) => {
    const { x: px, y: py } = point.toAffine()
    return { x: px.toString(), y: py.toString() }
  }
  return {
    groupKey: affine(groupPublicKey),
    attestation: { r: affine(groupCommitment), z: z.toString() },
    message,
  }
}

const CASES = 32

describe('FROST round-trip — honest signatures verify', () => {
  it(`accepts ${CASES} independently generated signatures`, () => {
    for (let i = 0; i < CASES; i++) {
      const input = sign(scalarAt('key', i), scalarAt('nonce', i), messageAt(i))
      expect(verifyAttestation(input)).toBe(true)
    }
  })

  it('accepts a signature whose challenge multiplication wraps the field order', () => {
    // x close to N exercises the mod-N reduction in z = k + c·x.
    const input = sign(N - 2n, scalarAt('nonce', 999), messageAt(999))
    expect(verifyAttestation(input)).toBe(true)
  })
})

describe('FROST round-trip — every single-field mutation is rejected', () => {
  const mutations: Array<{ name: string; apply: (i: ReturnType<typeof sign>) => ReturnType<typeof sign> }> = [
    { name: 'scalar z', apply: (i) => ({ ...i, attestation: { ...i.attestation, z: inc(i.attestation.z) } }) },
    {
      name: 'commitment r.x',
      apply: (i) => ({ ...i, attestation: { ...i.attestation, r: { ...i.attestation.r, x: inc(i.attestation.r.x) } } }),
    },
    {
      name: 'commitment r.y',
      apply: (i) => ({ ...i, attestation: { ...i.attestation, r: { ...i.attestation.r, y: inc(i.attestation.r.y) } } }),
    },
    { name: 'group key x', apply: (i) => ({ ...i, groupKey: { ...i.groupKey, x: inc(i.groupKey.x) } }) },
    { name: 'group key y', apply: (i) => ({ ...i, groupKey: { ...i.groupKey, y: inc(i.groupKey.y) } }) },
    { name: 'message', apply: (i) => ({ ...i, message: keccak256(getBytes(i.message)) as Hex }) },
  ]

  it.each(mutations)('rejects a mutated $name across all cases', ({ apply }) => {
    for (let i = 0; i < CASES; i++) {
      const honest = sign(scalarAt('key', i), scalarAt('nonce', i), messageAt(i))
      expect(verifyAttestation(apply(honest))).toBe(false)
    }
  })

  it("rejects another key's valid signature over the same message", () => {
    for (let i = 0; i < CASES; i++) {
      const mine = sign(scalarAt('key', i), scalarAt('nonce', i), messageAt(i))
      const theirs = sign(scalarAt('key', i + 1), scalarAt('nonce', i + 1), messageAt(i))
      expect(verifyAttestation({ ...theirs, groupKey: mine.groupKey })).toBe(false)
    }
  })

  it('rejects the identity commitment (R = 0) regardless of scalar', () => {
    const honest = sign(scalarAt('key', 1), scalarAt('nonce', 1), messageAt(1))
    expect(verifyAttestation({ ...honest, attestation: { ...honest.attestation, r: { x: '0', y: '0' } } })).toBe(false)
  })
})

const inc = (value: string): string => (BigInt(value) + 1n).toString()
