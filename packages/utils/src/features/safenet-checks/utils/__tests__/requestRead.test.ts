import { AbiCoder } from 'ethers'
import { decodeLogs, type RawLog } from '../decodeLogs'
import {
  buildArbitrationTimedOutLog,
  buildCommittedLog,
  buildDisputeOutOfScopeLog,
  buildDisputeResolvedLog,
  buildRequestTimedOutLog,
  buildRevealedLog,
} from '../../builders/rawLogs'
import { buildRequestRead } from '../requestRead'
import type { Hex, OracleRequestState, RequestRead, RequestRef } from '../../types'

const REQUEST_ID: Hex = `0x${'11'.repeat(32)}`
const OTHER_REQUEST_ID: Hex = `0x${'22'.repeat(32)}`
// Their checksummed forms start with `0xB` and `0xa`, so an original-case sort would put Bob first.
const ALICE = '0xa000000000000000000000000000000000000002'
const BOB = '0xB000000000000000000000000000000000000004'

const tx = (n: number): Hex => `0x${n.toString(16).padStart(64, '0')}`

const ref: RequestRef = {
  requestId: REQUEST_ID,
  epoch: '1',
  oracle: '0x00000000000000000000000000000000000000AA',
  oracleDataHash: tx(0),
  chainId: '100',
  safe: ALICE,
  proposedAt: { blockNumber: 1, logIndex: 0, transactionHash: tx(0) },
}

const read = (state: OracleRequestState, logs: RawLog[], counts = { approveCount: 1, denyCount: 1 }): RequestRead =>
  buildRequestRead({
    ref,
    facts: {
      state,
      commitDeadlineBlock: '150',
      revealDeadlineBlock: '160',
      arbitrationDeadlineBlock: null,
      committedCount: 2,
      revealedCount: 2,
      ...counts,
    },
    evidence: decodeLogs(logs),
  })

describe('buildRequestRead: votes', () => {
  it('sorts the rows by lowercase sentinel address, whatever the checksum casing', () => {
    const { votes } = read('PENDING', [
      buildCommittedLog({ requestId: REQUEST_ID, sentinel: BOB }),
      buildCommittedLog({ requestId: REQUEST_ID, sentinel: ALICE }),
    ])

    expect(votes.map((vote) => vote.sentinel)).toEqual([ALICE, BOB])
  })

  it("takes the reveal's bond amount over the commit's", () => {
    const { votes } = read('RESOLVED_APPROVED', [
      buildCommittedLog({ requestId: REQUEST_ID, sentinel: ALICE, bondAmount: 5000n }, { transactionHash: tx(1) }),
      buildRevealedLog(
        { requestId: REQUEST_ID, sentinel: ALICE, approved: false, bondAmount: 7000n, reason: 'bad' },
        { transactionHash: tx(2) },
      ),
    ])

    expect(votes).toEqual([
      {
        sentinel: ALICE,
        approved: false,
        reason: 'bad',
        bondAmount: '7000',
        commitTxHash: tx(1),
        revealTxHash: tx(2),
      },
    ])
  })

  it('leaves a commit-only row unrevealed; a revealed empty reason stays empty', () => {
    const { votes } = read('PENDING', [
      buildCommittedLog({ requestId: REQUEST_ID, sentinel: ALICE }),
      buildCommittedLog({ requestId: REQUEST_ID, sentinel: BOB }),
      buildRevealedLog({ requestId: REQUEST_ID, sentinel: ALICE, approved: true, reason: '' }),
    ])

    expect(votes.map(({ sentinel, approved, reason }) => ({ sentinel, approved, reason }))).toEqual([
      { sentinel: ALICE, approved: true, reason: '' },
      { sentinel: BOB, approved: null, reason: null },
    ])
  })

  it('keeps a revealed row when the reason is not valid UTF-8', () => {
    const invalidReason = {
      ...buildRevealedLog({ requestId: REQUEST_ID, sentinel: ALICE }, { transactionHash: tx(2) }),
      data: AbiCoder.defaultAbiCoder().encode(['bool', 'uint96', 'bytes'], [false, 5000n, '0xc3']),
    }
    const { votes } = read('PENDING', [
      buildCommittedLog({ requestId: REQUEST_ID, sentinel: ALICE, bondAmount: 5000n }, { transactionHash: tx(1) }),
      invalidReason,
    ])

    expect(votes).toEqual([
      { sentinel: ALICE, approved: false, reason: null, bondAmount: '5000', commitTxHash: tx(1), revealTxHash: tx(2) },
    ])
  })

  it('ignores the logs of another request', () => {
    const request = read('RESOLVED_APPROVED', [
      buildCommittedLog({ requestId: OTHER_REQUEST_ID, sentinel: ALICE }),
      buildRevealedLog({ requestId: OTHER_REQUEST_ID, sentinel: ALICE }),
      buildDisputeResolvedLog({ requestId: OTHER_REQUEST_ID, context: 'other' }, { transactionHash: tx(9) }),
      buildCommittedLog({ requestId: REQUEST_ID, sentinel: BOB }),
    ])

    expect(request.votes.map((vote) => vote.sentinel)).toEqual([BOB])
    expect(request).toMatchObject({ resolution: 'COUNCIL', resolutionContext: null, resolutionTxHash: null })
  })
})

describe('buildRequestRead: resolution', () => {
  const none = { resolution: null, resolutionContext: null, resolutionTxHash: null }
  const contested = { approveCount: 1, denyCount: 1 }
  const noReveals = { approveCount: 0, denyCount: 0 }
  const meta = { transactionHash: tx(9) }
  const invalidUtf8 = {
    ...buildDisputeResolvedLog({ requestId: REQUEST_ID }, meta),
    data: AbiCoder.defaultAbiCoder().encode(['uint8', 'uint128', 'bytes'], [1, 7n, '0xc3']),
  }

  it.each([
    {
      name: 'RULED_SECURE',
      state: 'RESOLVED_APPROVED' as const,
      counts: contested,
      logs: [buildDisputeResolvedLog({ requestId: REQUEST_ID, context: 'safe' }, meta)],
      expected: { resolution: 'COUNCIL', resolutionContext: 'safe', resolutionTxHash: tx(9) },
    },
    {
      name: 'RULED_INSECURE',
      state: 'RESOLVED_DENIED' as const,
      counts: contested,
      logs: [buildDisputeResolvedLog({ requestId: REQUEST_ID, context: 'unsafe' }, meta)],
      expected: { resolution: 'COUNCIL', resolutionContext: 'unsafe', resolutionTxHash: tx(9) },
    },
    {
      name: 'RULED_SECURE with a context that is not valid UTF-8',
      state: 'RESOLVED_APPROVED' as const,
      counts: contested,
      logs: [invalidUtf8],
      expected: { resolution: 'COUNCIL', resolutionContext: null, resolutionTxHash: tx(9) },
    },
    {
      name: 'NO_RULING with DisputeOutOfScope',
      state: 'TIMED_OUT' as const,
      counts: contested,
      logs: [buildDisputeOutOfScopeLog({ requestId: REQUEST_ID, context: 'declined' }, meta)],
      expected: { resolution: 'OUT_OF_SCOPE', resolutionContext: 'declined', resolutionTxHash: tx(9) },
    },
    {
      name: 'NO_RULING with ArbitrationTimedOut',
      state: 'TIMED_OUT' as const,
      counts: contested,
      logs: [buildArbitrationTimedOutLog({ requestId: REQUEST_ID }, meta)],
      expected: { resolution: 'ARBITRATION_TIMEOUT', resolutionContext: null, resolutionTxHash: tx(9) },
    },
    {
      name: 'TIMED_OUT',
      state: 'TIMED_OUT' as const,
      counts: noReveals,
      logs: [buildRequestTimedOutLog({ requestId: REQUEST_ID }, meta)],
      expected: { resolution: 'REQUEST_TIMEOUT', resolutionContext: null, resolutionTxHash: tx(9) },
    },
    {
      name: 'RULED_INSECURE without its log',
      state: 'RESOLVED_DENIED' as const,
      counts: contested,
      logs: [],
      expected: { resolution: 'COUNCIL', resolutionContext: null, resolutionTxHash: null },
    },
    {
      name: 'TIMED_OUT without its log',
      state: 'TIMED_OUT' as const,
      counts: noReveals,
      logs: [],
      expected: { resolution: 'REQUEST_TIMEOUT', resolutionContext: null, resolutionTxHash: null },
    },
    { name: 'NO_RULING without either log', state: 'TIMED_OUT' as const, counts: contested, logs: [], expected: none },
  ])('$name', ({ state, counts, logs, expected }) => {
    expect(read(state, logs, counts)).toMatchObject(expected)
  })
})
