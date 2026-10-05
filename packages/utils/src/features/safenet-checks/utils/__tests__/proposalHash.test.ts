import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { keccak256, toUtf8Bytes } from 'ethers'
import { TRANSACTION_PROPOSAL_TYPEHASH, transactionProposalHash, type TransactionProposal } from '../proposalHash'
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

describe('transactionProposalHash — real Gnosis captures', () => {
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
})

describe('transactionProposalHash — every input changes the hash', () => {
  const [base, other] = fixture.captures
  const baseProposal = proposalOf(base)
  const mutations: Array<{ field: string; override: Partial<TransactionProposal> }> = [
    { field: 'protocol chain id', override: { chainId: '101' } },
    { field: 'Consensus address', override: { consensus: OTHER_ADDRESS } },
    { field: 'epoch', override: { epoch: (BigInt(base.epoch) + 1n).toString() } },
    { field: 'oracle', override: { oracle: OTHER_ADDRESS } },
    { field: 'oracleDataHash', override: { oracleDataHash: keccak256('0x1234') as Hex } },
    { field: 'safeTxHash', override: { safeTxHash: other.safeTxHash } },
  ]

  it.each(mutations)('changes when only the $field changes', ({ override }) => {
    expect(transactionProposalHash({ ...baseProposal, ...override })).not.toBe(base.requestId)
  })

  it('never collides across single-field changes', () => {
    const hashes = [{}, ...mutations.map(({ override }) => override)].map((override) =>
      transactionProposalHash({ ...baseProposal, ...override }),
    )
    expect(new Set(hashes).size).toBe(hashes.length)
  })
})

describe('TRANSACTION_PROPOSAL_TYPEHASH', () => {
  /**
   * Deriving the typehash from the type string (rather than restating the hash)
   * is what makes this catch a typo: change `uint64` to `uint256` and this
   * fails, naming the field.
   */
  it('equals the keccak of the ConsensusMessages.sol type string', () => {
    expect(
      keccak256(toUtf8Bytes('TransactionProposal(uint64 epoch,address oracle,bytes oracleData,bytes32 safeTxHash)')),
    ).toBe(TRANSACTION_PROPOSAL_TYPEHASH)
  })
})
