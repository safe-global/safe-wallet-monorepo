import { TypedDataEncoder, keccak256, toUtf8Bytes } from 'ethers'
import {
  PLAIN_PROPOSAL_TYPES,
  TRANSACTION_PROPOSAL_TYPEHASH,
  plainProposalHash,
  transactionProposalHash,
} from '../proposalHash'
import type { Hex } from '../../types'

// Live capture: proposal tx 0x94b9f9b3…30b1 (Sepolia relaunch, 2026-08-19).
// The contract uses this hash as the oracle requestId, so the NewRequest
// event pins the whole derivation on-chain.
const live = {
  chainId: '11155111',
  consensus: '0xc0856A2e4084212459aa9C4408962eA6Ff03bb05',
  epoch: '38394',
  oracle: '0x78C13Af7697f6fD4cCA05DED3D436Fa21308E8cE',
  // keccak256('0x') — the proposal carried empty oracleData.
  oracleDataHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' as Hex,
  safeTxHash: '0x3545e6df004878589ee07c02a9c7d832f230de5e7ee20493feb62b4fde0a5e3e' as Hex,
}

describe('transactionProposalHash', () => {
  it('matches the onchain requestId captured live from the Sepolia relaunch (EIP-712 parity)', () => {
    expect(transactionProposalHash(live)).toBe('0x9cc6584852bee0ef2fad7ea848ca124a2ba99639ae8b22352868b11b97984ee0')
  })

  /**
   * The typehash constant has to be exactly the keccak of the type string the
   * deployed `ConsensusMessages.sol` precomputed. Deriving it from the string
   * (rather than restating the hash) is what makes this catch a typo: change
   * `uint64` to `uint256` and this fails, naming the field.
   */
  it('pins the typehash to its ConsensusMessages.sol type string', () => {
    expect(
      keccak256(toUtf8Bytes('TransactionProposal(uint64 epoch,address oracle,bytes oracleData,bytes32 safeTxHash)')),
    ).toBe(TRANSACTION_PROPOSAL_TYPEHASH)
  })
})

describe('plainProposalHash', () => {
  const plain = {
    chainId: live.chainId,
    consensus: live.consensus,
    epoch: live.epoch,
    safeTxHash: live.safeTxHash,
  }

  it('is distinct from the oracle-transaction hash for the same epoch and safeTxHash', () => {
    expect(plainProposalHash(plain)).not.toBe(transactionProposalHash(live))
  })

  it('our struct encodes to the typehash hardcoded in the beta ConsensusMessages.sol', () => {
    const encoded = TypedDataEncoder.from(PLAIN_PROPOSAL_TYPES).encodeType('TransactionProposal')
    expect(keccak256(toUtf8Bytes(encoded))).toBe('0x0791f9d2a47e59f417d6c5d2ac1c700ccf949a66461ac7842e6d104c1a92b152')
  })

  it('uses the EIP-712 domain ConsensusMessages.sol defines', () => {
    const encoded = TypedDataEncoder.from({
      EIP712Domain: [
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    }).encodeType('EIP712Domain')
    expect(keccak256(toUtf8Bytes(encoded))).toBe('0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218')
  })
})
