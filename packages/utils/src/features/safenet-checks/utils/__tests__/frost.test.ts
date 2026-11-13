import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { secp256k1 } from '@noble/curves/secp256k1'
import { concatBytes } from '@noble/hashes/utils'
import { getBytes, keccak256, toBeHex, toUtf8Bytes } from 'ethers'
import { h2, verifyAttestation, type AttestationInput } from '../frost'
import { transactionProposalHash } from '../proposalHash'
import type { Hex } from '../../types'
import { decodeLogs, type RawLog } from '../decodeLogs'
import { CheckEventType } from '../../types'

const N = secp256k1.Point.Fn.ORDER

type Vector = {
  chainId: string
  consensus: string
  epoch: string
  safeTxHash: Hex
  groupKey: { x: string; y: string }
  r: { x: string; y: string }
  z: string
}

const load = <T>(name: string): T => JSON.parse(readFileSync(join(__dirname, '../../__fixtures__', name), 'utf8'))

const captured = load<{
  provenance: { chainId: string; consensus: string; oracle: string }
  captures: Array<{ epoch: string; safeTxHash: Hex; groupKey: Vector['groupKey']; logs: RawLog[] }>
}>('safenet-gnosis-chain.captured.json')
const approved = captured.captures[0]
const attested = decodeLogs(approved.logs).find((event) => event.type === CheckEventType.ORACLE_ATTESTED)!
const upgraded = {
  ...captured.provenance,
  ...approved,
  ...attested.attestation,
  oracleDataHash: attested.oracleDataHash,
}

const inputFor = (vector: Vector, message: Hex): AttestationInput => ({
  groupKey: { ...vector.groupKey },
  attestation: { r: { ...vector.r }, z: vector.z },
  message,
})

const upgradedMessage: Hex = transactionProposalHash({
  chainId: upgraded.chainId,
  consensus: upgraded.consensus,
  epoch: upgraded.epoch,
  oracle: upgraded.oracle,
  oracleDataHash: upgraded.oracleDataHash,
  safeTxHash: upgraded.safeTxHash,
})

describe('verifyAttestation — live golden vectors', () => {
  it('verifies the Safenet deployment on Gnosis Chain oracle attestation against the derived unified preimage', () => {
    expect(verifyAttestation(inputFor(upgraded, upgradedMessage))).toBe(true)
  })

  it('h2 matches the RFC-9591 known-answer vector from the protocol repo', () => {
    const input = getBytes('0x37e58bc84afff4e1afade4140135583af3d6d3523a435e60cec5dc75ae3d7e8b')
    expect(h2(input)).toBe(33150593925562805502779376598105657283445871999808781975649610745815960364725n)
  })
})

describe('verifyAttestation — total over malformed input', () => {
  // These document the contract (bad input is `false`, never an exception) so a
  // poll loop can't be killed by one bad attestation. Note that `z` out of range
  // and off-curve points are also rejected by @noble/curves before our own
  // guards see them, so passing here does not prove those guards work.
  it.each([
    ['z = N', inputFor({ ...upgraded, z: N.toString() }, upgradedMessage)],
    ['z = 0', inputFor({ ...upgraded, z: '0' }, upgradedMessage)],
    ['z negative', inputFor({ ...upgraded, z: '-1' }, upgradedMessage)],
    ['z not a number', inputFor({ ...upgraded, z: 'not-a-number' }, upgradedMessage)],
    [
      'off-curve points',
      { groupKey: { x: '1', y: '1' }, attestation: { r: { x: '2', y: '2' }, z: '3' }, message: upgradedMessage },
    ],
    [
      'identity group key',
      { groupKey: { x: '0', y: '0' }, attestation: { r: { ...upgraded.r }, z: upgraded.z }, message: upgradedMessage },
    ],
  ] as Array<[string, AttestationInput]>)('returns false without throwing for %s', (_name, input) => {
    expect(verifyAttestation(input)).toBe(false)
  })

  it.each([undefined, null, {}])('returns false without throwing for %p', (input) => {
    expect(verifyAttestation(input as unknown as AttestationInput)).toBe(false)
  })
})

/**
 * Round-trip properties. The golden vector proves the verifier accepts a
 * specific real signature; it cannot prove it rejects anything, and a
 * verifier that returns `true` too easily is a security hole where one that
 * returns `false` is only a UX bug.
 *
 * The signer below implements the group-signature equation FROST reduces to once
 * shares are combined (`z = k + c·x`, verified as `z·G - c·Y == R`) directly on
 * `@noble/curves`. It shares exactly one thing with the code under test: `h2`.
 * That means it catches a wrong challenge *preimage* (the concat order is
 * re-derived here, independently) but NOT a wrong DST inside `h2` itself — the
 * RFC-9591 known-answer vector and the live golden vector are what pin
 * that.
 */
const scalarAt = (seed: string, index: number): bigint =>
  (BigInt(keccak256(toUtf8Bytes(`${seed}:${index}`))) % (N - 1n)) + 1n

const messageAt = (index: number): Hex => keccak256(toBeHex(index + 1, 32)) as Hex

const sign = (x: bigint, k: bigint, message: Hex): AttestationInput => {
  const groupPublicKey = secp256k1.Point.BASE.multiply(x)
  const groupCommitment = secp256k1.Point.BASE.multiply(k)
  const challenge = h2(concatBytes(groupCommitment.toBytes(true), groupPublicKey.toBytes(true), getBytes(message)))
  const affine = (point: typeof groupPublicKey) => {
    const { x: px, y: py } = point.toAffine()
    return { x: px.toString(), y: py.toString() }
  }
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
  const otherPoint = (index: number) => {
    const { x, y } = secp256k1.Point.BASE.multiply(scalarAt('other', index)).toAffine()
    return { x: x.toString(), y: y.toString() }
  }

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
