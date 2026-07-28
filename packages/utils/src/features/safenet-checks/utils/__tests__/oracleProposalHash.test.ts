import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { keccak256, toUtf8Bytes } from 'ethers'
import { oracleProposalHash, plainProposalHash, type OracleProposal } from '../oracleProposalHash'
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

/**
 * Typehash constants as hardcoded in `ConsensusMessages.sol`, so a typo in
 * either ported type string names itself instead of producing a hash that
 * verifies against nothing.
 *
 * Corroboration, not the primary evidence — `frost/verify.test.ts` proves both
 * preimages against real attestations. The domain and `TransactionProposal`
 * typehashes were also confirmed present in the beta Consensus runtime bytecode;
 * the `OracleTransactionProposal` one is absent, because the oracle path is not
 * in that deployment at all.
 */
describe('plainProposalHash', () => {
  const plain = {
    chainId: golden.chainId,
    consensus: golden.consensus,
    epoch: golden.epoch,
    safeTxHash: golden.safeTxHash,
  }

  it.each([
    [
      'EIP712Domain(uint256 chainId,address verifyingContract)',
      '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218',
    ],
    [
      'TransactionProposal(uint64 epoch,bytes32 safeTxHash)',
      '0x0791f9d2a47e59f417d6c5d2ac1c700ccf949a66461ac7842e6d104c1a92b152',
    ],
    [
      'OracleTransactionProposal(uint64 epoch,address oracle,bytes32 safeTxHash)',
      '0x30673a82bcf1a0fa66d1c97cbe53999fc6c0b3e987742353c9aaecb3890205e9',
    ],
  ])('the contract typehash for %s is the keccak of the ported type string', (typeString, typehash) => {
    expect(keccak256(toUtf8Bytes(typeString))).toBe(typehash)
  })

  it('is distinct from the oracle hash for the same epoch and safeTxHash', () => {
    expect(plainProposalHash(plain)).not.toBe(oracleProposalHash(proposal))
  })

  it('changes when any proposal field changes', () => {
    const base = plainProposalHash(plain)
    expect(plainProposalHash({ ...plain, epoch: '99' })).not.toBe(base)
    expect(plainProposalHash({ ...plain, safeTxHash: `0x${'0'.repeat(64)}` as Hex })).not.toBe(base)
    expect(plainProposalHash({ ...plain, consensus: '0x0000000000000000000000000000000000000000' })).not.toBe(base)
  })
})
