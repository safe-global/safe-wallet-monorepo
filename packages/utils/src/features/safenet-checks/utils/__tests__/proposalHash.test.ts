import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TypedDataEncoder, keccak256, toUtf8Bytes } from 'ethers'
import {
  PLAIN_PROPOSAL_TYPES,
  TRANSACTION_PROPOSAL_TYPEHASH,
  plainProposalHash,
  transactionProposalHash,
  type TransactionProposal,
} from '../proposalHash'
import type { Hex } from '../../types'

type Capture = {
  label: string
  safeTxHash: Hex
  homeChainId: string
  epoch: string
  requestId: Hex
  oracleDataHash: Hex
}

const fixture: { provenance: { chainId: string; consensus: string; oracle: string }; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

// The contract uses the proposal hash as the oracle requestId, so each capture pins the derivation on-chain.
const proposalOf = (capture: Capture): TransactionProposal => ({
  chainId: fixture.provenance.chainId,
  consensus: fixture.provenance.consensus,
  epoch: capture.epoch,
  oracle: fixture.provenance.oracle,
  oracleDataHash: capture.oracleDataHash,
  safeTxHash: capture.safeTxHash,
})

const OTHER_ADDRESS = `0x${'11'.repeat(20)}`

describe('transactionProposalHash', () => {
  it.each(fixture.captures)('reproduces the on-chain requestId of $label (EIP-712 parity)', (capture) => {
    expect(transactionProposalHash(proposalOf(capture))).toBe(capture.requestId)
  })

  it.each(fixture.captures)('does not reproduce $label with the Safe home chain as domain', (capture) => {
    const withHomeChain = { ...proposalOf(capture), chainId: capture.homeChainId }
    expect(transactionProposalHash(withHomeChain)).not.toBe(capture.requestId)
  })

  it('derives the same hash whatever the casing of the Consensus and Oracle addresses', () => {
    const [capture] = fixture.captures
    const lowercased = {
      ...proposalOf(capture),
      consensus: fixture.provenance.consensus.toLowerCase(),
      oracle: fixture.provenance.oracle.toLowerCase(),
    }
    expect(transactionProposalHash(lowercased)).toBe(capture.requestId)
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

describe('transactionProposalHash — every input changes the hash', () => {
  const [base, other] = fixture.captures
  const mutations: Array<{ field: string; override: Partial<TransactionProposal> }> = [
    { field: 'protocol chain id', override: { chainId: '101' } },
    { field: 'Consensus address', override: { consensus: OTHER_ADDRESS } },
    { field: 'epoch', override: { epoch: (BigInt(base.epoch) + 1n).toString() } },
    { field: 'oracle', override: { oracle: OTHER_ADDRESS } },
    { field: 'oracleDataHash', override: { oracleDataHash: keccak256('0x1234') as Hex } },
    { field: 'safeTxHash', override: { safeTxHash: other.safeTxHash } },
  ]

  it.each(mutations)('changes when only the $field changes', ({ override }) => {
    expect(transactionProposalHash({ ...proposalOf(base), ...override })).not.toBe(
      transactionProposalHash(proposalOf(base)),
    )
  })
})

describe('plainProposalHash', () => {
  const [capture] = fixture.captures
  const plain = {
    chainId: fixture.provenance.chainId,
    consensus: fixture.provenance.consensus,
    epoch: capture.epoch,
    safeTxHash: capture.safeTxHash,
  }

  it('is distinct from the oracle-transaction hash for the same epoch and safeTxHash', () => {
    expect(plainProposalHash(plain)).not.toBe(transactionProposalHash(proposalOf(capture)))
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
