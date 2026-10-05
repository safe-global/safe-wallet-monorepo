import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { secp256k1 } from '@noble/curves/secp256k1'
import { concatBytes } from '@noble/hashes/utils'
import { getBytes, keccak256, toBeHex, toUtf8Bytes } from 'ethers'
import { h2, verifyAttestation, type AttestationInput } from '../frost'
import { transactionProposalHash, type TransactionProposal } from '../proposalHash'
import type { Hex } from '../../types'

const N = secp256k1.Point.Fn.ORDER
const P = secp256k1.Point.Fp.ORDER

type Point = { x: string; y: string }

type Capture = {
  label: string
  safeTxHash: Hex
  homeChainId: string
  epoch: string
  requestId: Hex
  oracleDataHash: Hex
  attestation: { r: Point; z: string } | null
  groupKey: Point | null
}

type Approved = Capture & { attestation: NonNullable<Capture['attestation']>; groupKey: Point }

const fixture: { provenance: { chainId: string; consensus: string; oracle: string }; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const approved = fixture.captures.filter(
  (capture): capture is Approved => capture.attestation !== null && capture.groupKey !== null,
)

const inputFor = (capture: Approved, message: Hex = capture.requestId): AttestationInput => ({
  groupKey: { ...capture.groupKey },
  attestation: { r: { ...capture.attestation.r }, z: capture.attestation.z },
  message,
})

const withZ = (capture: Approved, z: string): AttestationInput => {
  const input = inputFor(capture)
  return { ...input, attestation: { ...input.attestation, z } }
}

const preimageFor = (capture: Approved, override: Partial<TransactionProposal> = {}): Hex =>
  transactionProposalHash({
    chainId: fixture.provenance.chainId,
    consensus: fixture.provenance.consensus,
    epoch: capture.epoch,
    oracle: fixture.provenance.oracle,
    oracleDataHash: capture.oracleDataHash,
    safeTxHash: capture.safeTxHash,
    ...override,
  })

const OTHER_ADDRESS = `0x${'11'.repeat(20)}`

type CurvePoint = typeof secp256k1.Point.BASE

const affine = (point: CurvePoint): Point => {
  const { x, y } = point.toAffine()
  return { x: x.toString(), y: y.toString() }
}

const scalarAt = (seed: string, index: number): bigint =>
  (BigInt(keccak256(toUtf8Bytes(`${seed}:${index}`))) % (N - 1n)) + 1n

const pointOf = (scalar: bigint): Point => affine(secp256k1.Point.BASE.multiply(scalar))

const messageAt = (index: number): Hex => keccak256(toBeHex(index + 1, 32)) as Hex

/**
 * The golden vectors are the real approved Gnosis captures: validators that
 * never saw this code produced both signatures, so neither can be satisfied by
 * a bug here.
 */
describe('verifyAttestation — real Gnosis attestations', () => {
  it.each(approved)('verifies $label against its epoch group key with its requestId as message', (capture) => {
    expect(verifyAttestation(inputFor(capture))).toBe(true)
  })

  it.each(approved)('verifies $label against the message re-derived on the Gnosis domain', (capture) => {
    expect(verifyAttestation(inputFor(capture, preimageFor(capture)))).toBe(true)
  })

  it('h2 matches the RFC-9591 known-answer vector from the protocol repo', () => {
    const input = getBytes('0x37e58bc84afff4e1afade4140135583af3d6d3523a435e60cec5dc75ae3d7e8b')
    expect(h2(input)).toBe(33150593925562805502779376598105657283445871999808781975649610745815960364725n)
  })
})

describe.each(approved)('verifyAttestation — $label must never verify', (capture) => {
  const mutations: Array<{ field: string; override: Partial<TransactionProposal> }> = [
    { field: 'EIP-712 chain id (the Safe home chain instead of Gnosis)', override: { chainId: capture.homeChainId } },
    { field: 'Consensus address', override: { consensus: OTHER_ADDRESS } },
    { field: 'epoch', override: { epoch: (BigInt(capture.epoch) + 1n).toString() } },
    { field: 'oracle', override: { oracle: OTHER_ADDRESS } },
    { field: 'oracleDataHash', override: { oracleDataHash: keccak256('0x1234') as Hex } },
    { field: 'safeTxHash', override: { safeTxHash: keccak256('0x5678') as Hex } },
  ]

  it.each(mutations)('against a message whose preimage has another $field', ({ override }) => {
    expect(verifyAttestation(inputFor(capture, preimageFor(capture, override)))).toBe(false)
  })

  it("against another capture's requestId", () => {
    const other = approved.find((candidate) => candidate.requestId !== capture.requestId)!
    expect(verifyAttestation(inputFor(capture, other.requestId))).toBe(false)
  })

  it.each([
    ['z + 1', (z: bigint) => z + 1n],
    ['z + N (out of range, malleable)', (z: bigint) => z + N],
    ['z negated', (z: bigint) => N - z],
  ])('with a mutated scalar: %s', (_name, mutate) => {
    expect(verifyAttestation(withZ(capture, mutate(BigInt(capture.attestation.z)).toString()))).toBe(false)
  })

  it.each([
    ['an independent valid point', () => pointOf(scalarAt('wrong-commitment', 1))],
    ['its own negation', () => ({ x: capture.attestation.r.x, y: (P - BigInt(capture.attestation.r.y)).toString() })],
  ])('with the commitment R replaced by %s', (_name, replacement) => {
    const input = inputFor(capture)
    expect(verifyAttestation({ ...input, attestation: { ...input.attestation, r: replacement() } })).toBe(false)
  })

  // Both captures share one epoch group key, so a wrong key has to come from outside the fixture.
  it('against an independently generated group key', () => {
    expect(verifyAttestation({ ...inputFor(capture), groupKey: pointOf(scalarAt('wrong-group-key', 1)) })).toBe(false)
  })
})

describe('verifyAttestation — total over malformed input', () => {
  const [capture] = approved

  // z out of range and off-curve points are also rejected by @noble/curves before our own guards see them,
  // so passing here documents the contract (false, never an exception) rather than proving those guards.
  it.each([
    ['z = N', withZ(capture, N.toString())],
    ['z = 0', withZ(capture, '0')],
    ['z negative', withZ(capture, '-1')],
    ['z not a number', withZ(capture, 'not-a-number')],
    [
      'off-curve points',
      { groupKey: { x: '1', y: '1' }, attestation: { r: { x: '2', y: '2' }, z: '3' }, message: capture.requestId },
    ],
    ['identity group key', { ...inputFor(capture), groupKey: { x: '0', y: '0' } }],
  ] as Array<[string, AttestationInput]>)('returns false without throwing for %s', (_name, input) => {
    expect(verifyAttestation(input)).toBe(false)
  })

  it.each([undefined, null, {}])('returns false without throwing for %p', (input) => {
    expect(verifyAttestation(input as unknown as AttestationInput)).toBe(false)
  })
})

/**
 * Round-trip properties. The golden vectors prove the verifier *accepts* two
 * specific real signatures; they cannot prove it rejects anything, and a
 * verifier that returns `true` too easily is a security hole where one that
 * returns `false` is only a UX bug.
 *
 * The signer below implements the group-signature equation FROST reduces to once
 * shares are combined (`z = k + c·x`, verified as `z·G - c·Y == R`) directly on
 * `@noble/curves`. It shares exactly one thing with the code under test: `h2`.
 * That means it catches a wrong challenge *preimage* (the concat order is
 * re-derived here, independently) but NOT a wrong DST inside `h2` itself — the
 * RFC-9591 known-answer vector and the live golden vectors are what pin that.
 */
const sign = (x: bigint, k: bigint, message: Hex): AttestationInput => {
  const groupPublicKey = secp256k1.Point.BASE.multiply(x)
  const groupCommitment = secp256k1.Point.BASE.multiply(k)
  const challenge = h2(concatBytes(groupCommitment.toBytes(true), groupPublicKey.toBytes(true), getBytes(message)))
  return {
    groupKey: affine(groupPublicKey),
    attestation: { r: affine(groupCommitment), z: ((k + ((challenge * x) % N)) % N).toString() },
    message,
  }
}

const CASES = 32
const inc = (value: string): string => (BigInt(value) + 1n).toString()

describe('verifyAttestation — round-trip properties', () => {
  it(`accepts ${CASES} independently generated honest signatures`, () => {
    for (let i = 0; i < CASES; i++) {
      expect(verifyAttestation(sign(scalarAt('key', i), scalarAt('nonce', i), messageAt(i)))).toBe(true)
    }
  })

  it('accepts a signature whose challenge multiplication wraps the field order', () => {
    expect(verifyAttestation(sign(N - 2n, scalarAt('nonce', 999), messageAt(999)))).toBe(true)
  })

  /**
   * Every substitution here stays ON the curve. Incrementing a coordinate would
   * be simpler but lands off-curve every time, which `toPoint` rejects before
   * the verification equation runs — that path is covered above, and testing it
   * here would look like coverage without being any.
   */
  const otherPoint = (index: number): Point => pointOf(scalarAt('other', index))

  it.each([
    ['scalar z', (i: AttestationInput) => ({ ...i, attestation: { ...i.attestation, z: inc(i.attestation.z) } })],
    [
      'commitment R (valid point, wrong one)',
      (i: AttestationInput, n: number) => ({ ...i, attestation: { ...i.attestation, r: otherPoint(n) } }),
    ],
    ['group key Y (valid point, wrong one)', (i: AttestationInput, n: number) => ({ ...i, groupKey: otherPoint(n) })],
    ['message', (i: AttestationInput) => ({ ...i, message: keccak256(i.message) as Hex })],
  ])('rejects a mutated %s across all cases', (_name, mutate) => {
    for (let i = 0; i < CASES; i++) {
      expect(verifyAttestation(mutate(sign(scalarAt('key', i), scalarAt('nonce', i), messageAt(i)), i))).toBe(false)
    }
  })

  it("rejects another key's valid signature over the same message", () => {
    for (let i = 0; i < CASES; i++) {
      const mine = sign(scalarAt('key', i), scalarAt('nonce', i), messageAt(i))
      const theirs = sign(scalarAt('key', i + 1), scalarAt('nonce', i + 1), messageAt(i))
      expect(verifyAttestation({ ...theirs, groupKey: mine.groupKey })).toBe(false)
    }
  })

  it('rejects the identity commitment (R = 0)', () => {
    const honest = sign(scalarAt('key', 1), scalarAt('nonce', 1), messageAt(1))
    expect(verifyAttestation({ ...honest, attestation: { ...honest.attestation, r: { x: '0', y: '0' } } })).toBe(false)
  })
})
