import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AbiCoder, concat, keccak256, toUtf8Bytes } from 'ethers'
import { deriveRequestId, oracleProposalHash, plainProposalHash, type OracleProposal } from '../oracleProposalHash'
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

/**
 * Typehash constants as they are hardcoded in the deployed
 * `ConsensusMessages.sol`. Pinning them here means a typo in either ported type
 * string fails the build rather than producing a hash that verifies against
 * nothing.
 */
const DOMAIN_TYPEHASH = '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218'
const TRANSACTION_PROPOSAL_TYPEHASH = '0x0791f9d2a47e59f417d6c5d2ac1c700ccf949a66461ac7842e6d104c1a92b152'
const ORACLE_TRANSACTION_PROPOSAL_TYPEHASH = '0x30673a82bcf1a0fa66d1c97cbe53999fc6c0b3e987742353c9aaecb3890205e9'

const abi = AbiCoder.defaultAbiCoder()

describe('plainProposalHash', () => {
  const plain = {
    chainId: golden.chainId,
    consensus: golden.consensus,
    epoch: golden.epoch,
    safeTxHash: golden.safeTxHash,
  }

  it("the contract's precomputed typehashes match the ported type strings", () => {
    expect(keccak256(toUtf8Bytes('EIP712Domain(uint256 chainId,address verifyingContract)'))).toBe(DOMAIN_TYPEHASH)
    expect(keccak256(toUtf8Bytes('TransactionProposal(uint64 epoch,bytes32 safeTxHash)'))).toBe(
      TRANSACTION_PROPOSAL_TYPEHASH,
    )
    expect(keccak256(toUtf8Bytes('OracleTransactionProposal(uint64 epoch,address oracle,bytes32 safeTxHash)'))).toBe(
      ORACLE_TRANSACTION_PROPOSAL_TYPEHASH,
    )
  })

  it('matches a hand-built EIP-712 digest over the contract typehash', () => {
    const structHash = keccak256(
      abi.encode(['bytes32', 'uint64', 'bytes32'], [TRANSACTION_PROPOSAL_TYPEHASH, golden.epoch, golden.safeTxHash]),
    )
    const domainSeparator = keccak256(
      abi.encode(['bytes32', 'uint256', 'address'], [DOMAIN_TYPEHASH, golden.chainId, golden.consensus]),
    )
    expect(plainProposalHash(plain)).toBe(keccak256(concat(['0x1901', domainSeparator, structHash])))
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
