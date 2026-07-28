import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { N, verifyAttestation, type AttestationInput } from '../verify'
import { deriveRequestId, plainProposalHash } from '../../oracleProposalHash'
import type { Hex } from '../../../types'

/**
 * Both vectors are live captures — validators that never saw this code produced
 * both signatures, so neither can be satisfied by a bug here. Each fixture's
 * `provenance` field records where it came from and how to re-capture it.
 *
 * Two vectors because the paths sign different preimages AND live on different
 * contracts: the beta Consensus has no oracle path in its bytecode at all, so
 * the oracle vector has to come from the devnet (repo HEAD).
 *
 * Rejection breadth lives in `roundtrip.test.ts`, which runs every single-field
 * mutation across 32 generated keys. This file covers what only a real capture
 * can: that the preimage we derive is the one that was actually signed.
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
  JSON.parse(readFileSync(join(__dirname, '../../../__fixtures__', name), 'utf8'))

/** Devnet (repo HEAD) oracle attestation — `requestId` is the signed message. */
const devnet = load<Vector & { oracle: string; requestId: Hex; oracleProposalHash: Hex }>(
  'devnet-attestation.golden.json',
)
/** Gnosis mainnet beta non-oracle attestation — the path beta actually emits. */
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
    const derived = deriveRequestId({
      chainId: devnet.chainId,
      consensus: devnet.consensus,
      epoch: devnet.epoch,
      oracle: devnet.oracle,
      safeTxHash: devnet.safeTxHash,
    })
    expect(derived).toBe(devnet.requestId)
    expect(derived).toBe(devnet.oracleProposalHash)
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
    const crossed = deriveRequestId({
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
  const base = () => inputFor(devnet, devnet.requestId)

  it('rejects z >= N (the FROST.sol z < N requirement)', () => {
    expect(verifyAttestation({ ...base(), attestation: { r: { ...devnet.r }, z: N.toString() } })).toBe(false)
  })

  it('rejects z = 0 without throwing', () => {
    const zero = { ...base(), attestation: { r: { ...devnet.r }, z: '0' } }
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
