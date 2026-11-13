import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { decodeLogs, type RawLog } from '../decodeLogs'
import { CheckEventType } from '../../types'
import { keccak256, toUtf8Bytes } from 'ethers'
import { TRANSACTION_PROPOSAL_TYPEHASH, transactionProposalHash } from '../proposalHash'
import type { Hex } from '../../types'

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/safenet-gnosis-chain.captured.json'), 'utf8'),
) as {
  provenance: { chainId: string; consensus: string }
  captures: Array<{ logs: RawLog[]; requestId: Hex }>
}
const approved = fixture.captures[0]
const proposed = decodeLogs(approved.logs).find((event) => event.type === CheckEventType.ORACLE_PROPOSED)!
const live = {
  ...proposed,
  ...fixture.provenance,
}

describe('transactionProposalHash', () => {
  it('matches the onchain requestId captured live from the Safenet deployment on Gnosis Chain (EIP-712 parity)', () => {
    expect(transactionProposalHash(live)).toBe(approved.requestId)
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
