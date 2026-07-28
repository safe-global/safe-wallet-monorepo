import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { N } from '../math'
import { verifyAttestation, type AttestationInput } from '../verify'
import { deriveRequestId } from '../../oracleProposalHash'
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
