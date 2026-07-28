import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TypedDataEncoder, keccak256, toUtf8Bytes } from 'ethers'
import {
  ORACLE_PROPOSAL_TYPES,
  PLAIN_PROPOSAL_TYPES,
  oracleProposalHash,
  plainProposalHash,
  type OracleProposal,
} from '../oracleProposalHash'
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
})

describe('plainProposalHash', () => {
  const plain = {
    chainId: golden.chainId,
    consensus: golden.consensus,
    epoch: golden.epoch,
    safeTxHash: golden.safeTxHash,
  }

  it('is distinct from the oracle hash for the same epoch and safeTxHash', () => {
    expect(plainProposalHash(plain)).not.toBe(oracleProposalHash(proposal))
  })

  /**
   * The struct definitions above have to encode to exactly the type strings the
   * deployed `ConsensusMessages.sol` precomputed. Deriving the string from the
   * types object (rather than restating it) is what makes this catch a typo:
   * change `uint64` to `uint256` in either object and this fails.
   *
   * The live golden vectors in `frost.test.ts` catch the same class of error,
   * but only as "a real signature stopped verifying". This names the field.
   */
  it.each([
    [
      ORACLE_PROPOSAL_TYPES,
      'OracleTransactionProposal',
      '0x30673a82bcf1a0fa66d1c97cbe53999fc6c0b3e987742353c9aaecb3890205e9',
    ],
    [PLAIN_PROPOSAL_TYPES, 'TransactionProposal', '0x0791f9d2a47e59f417d6c5d2ac1c700ccf949a66461ac7842e6d104c1a92b152'],
  ])('%#: our struct encodes to the typehash hardcoded in ConsensusMessages.sol', (types, name, typehash) => {
    const encoded = TypedDataEncoder.from(types).encodeType(name)
    expect(keccak256(toUtf8Bytes(encoded))).toBe(typehash)
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
