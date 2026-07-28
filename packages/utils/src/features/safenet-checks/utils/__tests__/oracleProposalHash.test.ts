import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveRequestId, oracleProposalHash, type OracleProposal } from '../oracleProposalHash'
import type { Hex } from '../../types'

const golden: { chainId: string; consensus: string; epoch: string; oracle: string; safeTxHash: Hex; requestId: Hex } =
  JSON.parse(readFileSync(join(__dirname, '../../__fixtures__/devnet-attestation.golden.json'), 'utf8'))

const proposal: OracleProposal = {
  chainId: golden.chainId,
  consensus: golden.consensus,
  epoch: golden.epoch,
  oracle: golden.oracle,
  safeTxHash: golden.safeTxHash,
}

describe('oracleProposalHash', () => {
  it('matches the onchain requestId captured live from the devnet (EIP-712 parity)', () => {
    expect(oracleProposalHash(proposal)).toBe(golden.requestId)
  })

  it('deriveRequestId is an alias producing the same hash', () => {
    expect(deriveRequestId(proposal)).toBe(oracleProposalHash(proposal))
  })

  it('accepts string, number, and bigint chainId/epoch interchangeably', () => {
    expect(oracleProposalHash({ ...proposal, chainId: Number(golden.chainId), epoch: Number(golden.epoch) })).toBe(
      golden.requestId,
    )
    expect(oracleProposalHash({ ...proposal, chainId: BigInt(golden.chainId), epoch: BigInt(golden.epoch) })).toBe(
      golden.requestId,
    )
  })

  it('changes when any proposal field changes', () => {
    expect(oracleProposalHash({ ...proposal, epoch: '99' })).not.toBe(golden.requestId)
    expect(oracleProposalHash({ ...proposal, oracle: '0x0000000000000000000000000000000000000000' })).not.toBe(
      golden.requestId,
    )
    expect(oracleProposalHash({ ...proposal, safeTxHash: `0x${'0'.repeat(64)}` as Hex })).not.toBe(golden.requestId)
  })
})
