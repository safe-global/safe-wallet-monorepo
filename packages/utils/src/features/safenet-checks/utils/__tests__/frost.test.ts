import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { secp256k1 } from '@noble/curves/secp256k1'
import { concatBytes } from '@noble/hashes/utils'
import { getBytes, keccak256, toBeHex, toUtf8Bytes } from 'ethers'
import { h2, verifyAttestation, type AttestationInput } from '../frost'
import { oracleProposalHash, plainProposalHash } from '../oracleProposalHash'
import type { Hex } from '../../types'

const N = secp256k1.Point.Fn.ORDER

/**
 * Both vectors are live captures — validators that never saw this code produced
 * both signatures, so neither can be satisfied by a bug here. Each fixture's
 * `provenance` field records where it came from and how to re-capture it.
 *
 * Two vectors because the paths sign different preimages AND live on different
 * contracts: the beta Consensus has no oracle path in its bytecode at all, so
 * the oracle vector has to come from the devnet (repo HEAD).
 */
type Vector = {
  chainId: string
  consensus: string
  epoch: string
  safeTxHash: Hex
  groupKey: { x: string; y: string }
  r: { x: string; y: string }
  z: string
}

const load = <T extends Vector>(name: string): T =>
  JSON.parse(readFileSync(join(__dirname, '../../__fixtures__', name), 'utf8'))

const devnet = load<Vector & { oracle: string; requestId: Hex; oracleProposalHash: Hex }>(
  'devnet-attestation.golden.json',
)
const gnosis = load<Vector & { safeChainId: string }>('gnosis-plain-attestation.golden.json')

const inputFor = (vector: Vector, message: Hex): AttestationInput => ({
  groupKey: { ...vector.groupKey },
  attestation: { r: { ...vector.r }, z: vector.z },
  message,
})

const plainMessage = (chainId: string): Hex =>
  plainProposalHash({ chainId, consensus: gnosis.consensus, epoch: gnosis.epoch, safeTxHash: gnosis.safeTxHash })

describe('verifyAttestation — live golden vectors', () => {
  it('verifies the Gnosis beta non-oracle attestation against the derived plain preimage', () => {
    expect(verifyAttestation(inputFor(gnosis, plainMessage(gnosis.chainId)))).toBe(true)
  })

  it('verifies the devnet oracle attestation against its onchain requestId', () => {
    expect(verifyAttestation(inputFor(devnet, devnet.requestId))).toBe(true)
  })

  it('derives the devnet requestId from the oracle proposal (EIP-712 parity)', () => {
    const derived = oracleProposalHash({
      chainId: devnet.chainId,
      consensus: devnet.consensus,
      epoch: devnet.epoch,
      oracle: devnet.oracle,
      safeTxHash: devnet.safeTxHash,
    })
    expect(derived).toBe(devnet.requestId)
    expect(derived).toBe(devnet.oracleProposalHash)
  })

  it('h2 matches the RFC-9591 known-answer vector from the protocol repo', () => {
    const input = getBytes('0x37e58bc84afff4e1afade4140135583af3d6d3523a435e60cec5dc75ae3d7e8b')
    expect(h2(input)).toBe(33150593925562805502779376598105657283445871999808781975649610745815960364725n)
  })
})

describe('verifyAttestation — the preimage must match the path and the domain', () => {
  it('uses the Safenet chain id for the EIP-712 domain, not the Safe transaction chain id', () => {
    // The event carries chainId 42161 (the Safe is on Arbitrum); the domain is
    // Gnosis (100), where Consensus is deployed. Reaching for the event's field
    // derives a different preimage that verifies against nothing.
    expect(gnosis.safeChainId).not.toBe(gnosis.chainId)
    expect(verifyAttestation(inputFor(gnosis, plainMessage(gnosis.safeChainId)))).toBe(false)
  })

  it('rejects the oracle preimage for a non-oracle attestation (paths never cross)', () => {
    const crossed = oracleProposalHash({
      chainId: gnosis.chainId,
      consensus: gnosis.consensus,
      epoch: gnosis.epoch,
      oracle: '0x0000000000000000000000000000000000000000',
      safeTxHash: gnosis.safeTxHash,
    })
    expect(verifyAttestation(inputFor(gnosis, crossed))).toBe(false)
  })
})

describe('verifyAttestation — scalar-range and totality guards', () => {
  it('rejects z >= N (the FROST.sol z < N requirement)', () => {
    expect(verifyAttestation(inputFor({ ...devnet, z: N.toString() }, devnet.requestId))).toBe(false)
  })

  it('rejects z = 0 without throwing', () => {
    const zero = inputFor({ ...devnet, z: '0' }, devnet.requestId)
    expect(() => verifyAttestation(zero)).not.toThrow()
    expect(verifyAttestation(zero)).toBe(false)
  })

  it('returns false (never throws) for off-curve garbage points', () => {
    const garbage: AttestationInput = {
      groupKey: { x: '1', y: '1' },
      attestation: { r: { x: '2', y: '2' }, z: '3' },
      message: devnet.requestId,
    }
    expect(() => verifyAttestation(garbage)).not.toThrow()
    expect(verifyAttestation(garbage)).toBe(false)
  })
})

/**
 * Round-trip properties. The golden vectors prove the verifier *accepts* two
 * specific real signatures; they cannot prove it rejects anything, and a
 * verifier that returns `true` too easily is a security hole where one that
 * returns `false` is only a UX bug.
 *
 * The signer below is built straight on `@noble/curves` from the group-signature
 * equation FROST reduces to once shares are combined (`z = k + c·x`, verified as
 * `z·G - c·Y == R`). It deliberately shares no helper with the code under test,
 * so agreement is evidence about the verifier rather than a common bug.
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

  it.each([
    ['scalar z', (i: AttestationInput) => ({ ...i, attestation: { ...i.attestation, z: inc(i.attestation.z) } })],
    [
      'commitment r.x',
      (i: AttestationInput) => ({
        ...i,
        attestation: { ...i.attestation, r: { ...i.attestation.r, x: inc(i.attestation.r.x) } },
      }),
    ],
    [
      'commitment r.y',
      (i: AttestationInput) => ({
        ...i,
        attestation: { ...i.attestation, r: { ...i.attestation.r, y: inc(i.attestation.r.y) } },
      }),
    ],
    ['group key x', (i: AttestationInput) => ({ ...i, groupKey: { ...i.groupKey, x: inc(i.groupKey.x) } })],
    ['group key y', (i: AttestationInput) => ({ ...i, groupKey: { ...i.groupKey, y: inc(i.groupKey.y) } })],
    ['message', (i: AttestationInput) => ({ ...i, message: keccak256(i.message) as Hex })],
  ])('rejects a mutated %s across all cases', (_name, mutate) => {
    for (let i = 0; i < CASES; i++) {
      expect(verifyAttestation(mutate(sign(scalarAt('key', i), scalarAt('nonce', i), messageAt(i))))).toBe(false)
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
