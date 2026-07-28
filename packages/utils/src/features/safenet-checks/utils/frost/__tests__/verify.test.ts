import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { N } from '../math'
import { verifyAttestation, type AttestationInput } from '../verify'
import { deriveRequestId, plainProposalHash } from '../../oracleProposalHash'
import type { Hex } from '../../../types'

type GoldenVector = {
  chainId: string
  consensus: string
  epoch: string
  oracle: string
  safeTxHash: Hex
  requestId: Hex
  oracleProposalHash: Hex
  groupKey: { x: string; y: string }
  r: { x: string; y: string }
  z: string
}

const golden: GoldenVector = JSON.parse(
  readFileSync(join(__dirname, '../../../__fixtures__/devnet-attestation.golden.json'), 'utf8'),
)

const baseParams = (): AttestationInput => ({
  groupKey: { x: golden.groupKey.x, y: golden.groupKey.y },
  attestation: { r: { x: golden.r.x, y: golden.r.y }, z: golden.z },
  message: golden.requestId,
})

const inc = (value: string): string => (BigInt(value) + 1n).toString()

describe('verifyAttestation — devnet golden vector (live-captured, real FROST signature)', () => {
  it('verifies the real attestation against the epoch group key', () => {
    expect(verifyAttestation(baseParams())).toBe(true)
  })

  it('requestId equals the derived oracle-proposal hash (message == requestId)', () => {
    const derived = deriveRequestId({
      chainId: golden.chainId,
      consensus: golden.consensus,
      epoch: golden.epoch,
      oracle: golden.oracle,
      safeTxHash: golden.safeTxHash,
    })
    expect(derived).toBe(golden.requestId)
    expect(derived).toBe(golden.oracleProposalHash)
  })
})

type PlainVector = {
  chainId: string
  safeChainId: string
  consensus: string
  epoch: string
  safeTxHash: Hex
  groupKey: { x: string; y: string }
  r: { x: string; y: string }
  z: string
}

const plain: PlainVector = JSON.parse(
  readFileSync(join(__dirname, '../../../__fixtures__/gnosis-plain-attestation.golden.json'), 'utf8'),
)

const plainMessage = (chainId: string): Hex =>
  plainProposalHash({ chainId, consensus: plain.consensus, epoch: plain.epoch, safeTxHash: plain.safeTxHash })

const plainParams = (chainId = plain.chainId): AttestationInput => ({
  groupKey: { x: plain.groupKey.x, y: plain.groupKey.y },
  attestation: { r: { x: plain.r.x, y: plain.r.y }, z: plain.z },
  message: plainMessage(chainId),
})

describe('verifyAttestation — Gnosis beta non-oracle vector (live-captured, real FROST signature)', () => {
  it('verifies a real mainnet attestation against the preimage plainProposalHash derives', () => {
    expect(verifyAttestation(plainParams())).toBe(true)
  })

  it('uses the Safenet chain id for the EIP-712 domain, not the Safe transaction chain id', () => {
    // The event carries chainId 42161 (the Safe is on Arbitrum); the domain is
    // Gnosis (100), where Consensus is deployed. Reaching for the event's field
    // derives a different preimage that verifies against nothing.
    expect(plain.safeChainId).not.toBe(plain.chainId)
    expect(plainMessage(plain.safeChainId)).not.toBe(plainMessage(plain.chainId))
    expect(verifyAttestation(plainParams(plain.safeChainId))).toBe(false)
  })

  it('rejects the oracle preimage for a non-oracle attestation (paths never cross)', () => {
    const crossed = deriveRequestId({
      chainId: plain.chainId,
      consensus: plain.consensus,
      epoch: plain.epoch,
      oracle: '0x0000000000000000000000000000000000000000',
      safeTxHash: plain.safeTxHash,
    })
    expect(verifyAttestation({ ...plainParams(), message: crossed })).toBe(false)
  })

  it('rejects a tampered epoch, safeTxHash, or verifying contract', () => {
    const base = plainParams()
    const withMessage = (message: Hex) => verifyAttestation({ ...base, message })
    expect(
      withMessage(
        plainProposalHash({
          chainId: plain.chainId,
          consensus: plain.consensus,
          epoch: inc(plain.epoch),
          safeTxHash: plain.safeTxHash,
        }),
      ),
    ).toBe(false)
    expect(
      withMessage(
        plainProposalHash({
          chainId: plain.chainId,
          consensus: '0x0000000000000000000000000000000000000000',
          epoch: plain.epoch,
          safeTxHash: plain.safeTxHash,
        }),
      ),
    ).toBe(false)
    expect(
      withMessage(
        plainProposalHash({
          chainId: plain.chainId,
          consensus: plain.consensus,
          epoch: plain.epoch,
          safeTxHash: `0x${'0'.repeat(64)}` as Hex,
        }),
      ),
    ).toBe(false)
  })

  it('rejects a tampered signature scalar and commitment', () => {
    const z = plainParams()
    z.attestation.z = inc(z.attestation.z)
    expect(verifyAttestation(z)).toBe(false)

    const r = plainParams()
    r.attestation.r.x = inc(r.attestation.r.x)
    expect(verifyAttestation(r)).toBe(false)
  })
})

describe('verifyAttestation — per-field tamper tests (each must fail closed)', () => {
  it('rejects a tampered group key x', () => {
    const p = baseParams()
    p.groupKey.x = inc(p.groupKey.x)
    expect(verifyAttestation(p)).toBe(false)
  })

  it('rejects a tampered group key y', () => {
    const p = baseParams()
    p.groupKey.y = inc(p.groupKey.y)
    expect(verifyAttestation(p)).toBe(false)
  })

  it('rejects a tampered commitment r.x', () => {
    const p = baseParams()
    p.attestation.r.x = inc(p.attestation.r.x)
    expect(verifyAttestation(p)).toBe(false)
  })

  it('rejects a tampered commitment r.y', () => {
    const p = baseParams()
    p.attestation.r.y = inc(p.attestation.r.y)
    expect(verifyAttestation(p)).toBe(false)
  })

  it('rejects a tampered scalar z', () => {
    const p = baseParams()
    p.attestation.z = inc(p.attestation.z)
    expect(verifyAttestation(p)).toBe(false)
  })

  it('rejects a different signed message', () => {
    const p = baseParams()
    p.message = golden.safeTxHash // a real bytes32, but not the proposal hash
    expect(verifyAttestation(p)).toBe(false)
  })
})

describe('verifyAttestation — scalar-range and totality guards', () => {
  it('rejects z >= N (the FROST.sol z < N requirement)', () => {
    const p = baseParams()
    p.attestation.z = N.toString()
    expect(verifyAttestation(p)).toBe(false)
  })

  it('rejects z = 0 without throwing', () => {
    const p = baseParams()
    p.attestation.z = '0'
    expect(() => verifyAttestation(p)).not.toThrow()
    expect(verifyAttestation(p)).toBe(false)
  })

  it('returns false (never throws) for off-curve garbage points', () => {
    const params: AttestationInput = {
      groupKey: { x: '1', y: '1' },
      attestation: { r: { x: '2', y: '2' }, z: '3' },
      message: golden.requestId,
    }
    expect(() => verifyAttestation(params)).not.toThrow()
    expect(verifyAttestation(params)).toBe(false)
  })
})
