import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { keccak256, toUtf8Bytes } from 'ethers'
import { oracleReadInterface } from '../../abi'
import { decodeLogs, type RawLog } from '../decodeLogs'
import {
  buildArbitrationTimedOutLog,
  buildCommittedLog,
  buildDisputeOutOfScopeLog,
  buildDisputeResolvedLog,
  buildDisputeTriggeredLog,
  buildNewRequestLog,
  buildOracleAttestedLog,
  buildOracleProposedLog,
  buildOracleResultLog,
  buildRequestTimedOutLog,
  buildRevealedLog,
  resetLogCounter,
} from '../../builders/rawLogs'
import { CheckEventType, type NormalizedCheckEvent } from '../../types'

type Point = { x: string; y: string }

type Capture = {
  label: string
  kind: 'attested' | 'disputed'
  safeTxHash: string
  homeChainId: string
  safe: string
  epoch: string
  requestId: string
  oracleDataHash: string
  proposal: { blockNumber: number; logIndex: number; transactionHash: string }
  attestation: {
    signatureId: string
    r: Point
    z: string
    blockNumber: number
    logIndex: number
    transactionHash: string
  } | null
  logs: RawLog[]
  requestState: { rawResult: string }
  expected: { committedCount: number; revealedCount: number; approveCount: number; denyCount: number }
}

type Approved = Capture & { attestation: NonNullable<Capture['attestation']> }

type RequestTuple = {
  terms: { commitDeadline: bigint; revealDeadline: bigint; bondTarget: bigint; sponsor: string }
  progress: { arbitrationDeadline: bigint }
}

const fixture: { provenance: { oracle: string }; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const approvedCaptures = fixture.captures.filter((capture): capture is Approved => capture.attestation !== null)
const disputedCaptures = fixture.captures.filter((capture) => capture.kind === 'disputed')

// Emitted by the deployed Oracle but absent from our fragments (sentinel payout); the decoder must ignore it.
const CLAIMED_TOPIC0 = keccak256(toUtf8Bytes('Claimed(bytes32,address,uint96,uint96)'))

const byType = <T extends NormalizedCheckEvent['type']>(
  events: NormalizedCheckEvent[],
  type: T,
): Extract<NormalizedCheckEvent, { type: T }>[] =>
  events.filter((event): event is Extract<NormalizedCheckEvent, { type: T }> => event.type === type)

const lower = (value: string): string => value.toLowerCase()

const requestOf = (capture: Capture): RequestTuple =>
  oracleReadInterface.decodeFunctionResult('getRequest', capture.requestState.rawResult)[0]

type LogPosition = Pick<RawLog, 'blockNumber' | 'logIndex' | 'transactionHash'>

const positionOf = ({ blockNumber, logIndex, transactionHash }: LogPosition) => ({
  blockNumber,
  logIndex,
  transactionHash,
})

const SAFE_TX_HASH = '0x1111111111111111111111111111111111111111111111111111111111111111'
const REQUEST_ID = '0x2222222222222222222222222222222222222222222222222222222222222222'
const TX_HASH = `0x${'ab'.repeat(32)}`
const SAFE = `0x${'5a'.repeat(20)}`
const ORACLE = `0x${'0b'.repeat(20)}`
const SPONSOR = `0x${'51'.repeat(20)}`
const SENTINEL = `0x${'e1'.repeat(20)}`
const HOME_CHAIN_ID = 42161n

const at = (blockNumber: number, logIndex: number) => ({ blockNumber, logIndex, transactionHash: TX_HASH })

describe('decodeLogs — every event kind, built through the real fragments', () => {
  const sequence: Array<[CheckEventType, RawLog]> = [
    [
      CheckEventType.ORACLE_PROPOSED,
      buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n, chainId: HOME_CHAIN_ID, safe: SAFE }, at(100, 1)),
    ],
    [CheckEventType.REQUEST_CREATED, buildNewRequestLog({ requestId: REQUEST_ID }, at(100, 2))],
    [CheckEventType.SENTINEL_COMMITTED, buildCommittedLog({ requestId: REQUEST_ID }, at(101, 0))],
    [CheckEventType.SENTINEL_REVEALED, buildRevealedLog({ requestId: REQUEST_ID }, at(102, 4))],
    [CheckEventType.DISPUTE_TRIGGERED, buildDisputeTriggeredLog({ requestId: REQUEST_ID }, at(102, 5))],
    [CheckEventType.DISPUTE_RESOLVED, buildDisputeResolvedLog({ requestId: REQUEST_ID }, at(103, 0))],
    [CheckEventType.DISPUTE_OUT_OF_SCOPE, buildDisputeOutOfScopeLog({ requestId: REQUEST_ID }, at(103, 1))],
    [CheckEventType.ARBITRATION_TIMED_OUT, buildArbitrationTimedOutLog({ requestId: REQUEST_ID }, at(104, 0))],
    [CheckEventType.REQUEST_TIMED_OUT, buildRequestTimedOutLog({ requestId: REQUEST_ID }, at(104, 1))],
    [CheckEventType.ORACLE_RESULT, buildOracleResultLog({ requestId: REQUEST_ID }, at(105, 0))],
    [
      CheckEventType.ORACLE_ATTESTED,
      buildOracleAttestedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n, chainId: HOME_CHAIN_ID, safe: SAFE }, at(106, 3)),
    ],
  ]
  const events = decodeLogs(sequence.map(([, log]) => log))

  it('decodes one event per log, in input order, with the right type', () => {
    expect(events.map((event) => event.type)).toEqual(sequence.map(([type]) => type))
  })

  it('keeps each log position on its event', () => {
    expect(events.map(positionOf)).toEqual(sequence.map(([, log]) => positionOf(log)))
  })
})

describe('decodeLogs — Consensus proposal and attestation', () => {
  it('decodes the proposal with the tuple-sourced home chain and Safe (string bigints)', () => {
    const log = buildOracleProposedLog({
      safeTxHash: SAFE_TX_HASH,
      epoch: 7n,
      chainId: HOME_CHAIN_ID,
      safe: SAFE,
      oracle: ORACLE,
      oracleData: '0x1234',
    })
    const [proposed] = byType(decodeLogs([log]), CheckEventType.ORACLE_PROPOSED)
    expect(proposed).toMatchObject({
      safeTxHash: SAFE_TX_HASH,
      chainId: '42161',
      epoch: '7',
      oracleDataHash: keccak256('0x1234'),
    })
    expect(lower(proposed.safe)).toBe(SAFE)
    expect(lower(proposed.oracle)).toBe(ORACLE)
  })

  it('hashes empty oracleData to the keccak of empty bytes', () => {
    const [proposed] = byType(decodeLogs([buildOracleProposedLog()]), CheckEventType.ORACLE_PROPOSED)
    expect(proposed.oracleDataHash).toBe(keccak256('0x'))
  })

  it('decodes the attestation with exact decimal coordinates, signatureId and oracleDataHash', () => {
    const r = { x: 2n ** 200n + 1n, y: 2n ** 201n + 3n }
    const z = 2n ** 255n + 7n
    const signatureId = `0x${'3c'.repeat(32)}`
    const oracleDataHash = keccak256('0xabcd')
    const log = buildOracleAttestedLog({
      safeTxHash: SAFE_TX_HASH,
      epoch: 7n,
      oracle: ORACLE,
      signatureId,
      oracleDataHash,
      r,
      z,
    })
    const [attested] = byType(decodeLogs([log]), CheckEventType.ORACLE_ATTESTED)
    expect(attested).toMatchObject({
      safeTxHash: SAFE_TX_HASH,
      epoch: '7',
      signatureId,
      oracleDataHash,
      attestation: { r: { x: r.x.toString(), y: r.y.toString() }, z: z.toString() },
    })
    expect(lower(attested.oracle)).toBe(ORACLE)
  })

  it('unpacks safeId into the same home chain and Safe the proposal tuple carries', () => {
    const spec = { safeTxHash: SAFE_TX_HASH, chainId: HOME_CHAIN_ID, safe: SAFE }
    const [proposed] = byType(decodeLogs([buildOracleProposedLog(spec)]), CheckEventType.ORACLE_PROPOSED)
    const [attested] = byType(decodeLogs([buildOracleAttestedLog(spec)]), CheckEventType.ORACLE_ATTESTED)
    expect(attested.chainId).toBe('42161')
    expect(attested.chainId).toBe(proposed.chainId)
    expect(lower(attested.safe)).toBe(lower(proposed.safe))
    expect(lower(attested.safe)).toBe(SAFE)
  })
})

describe('decodeLogs — sentinel request lifecycle', () => {
  it('decodes the seven-field NewRequest with both deadline kinds', () => {
    const log = buildNewRequestLog({
      requestId: REQUEST_ID,
      sponsor: SPONSOR,
      fee: 360_000_000_000_000_000n,
      bondTarget: 800_000_000_000_000_000_000n,
      slashAmount: 8_000_000_000_000_000_000n,
      commitDeadline: 150n,
      revealDeadline: 160n,
    })
    const [request] = byType(decodeLogs([log]), CheckEventType.REQUEST_CREATED)
    expect(request).toMatchObject({
      requestId: REQUEST_ID,
      fee: '360000000000000000',
      bondTarget: '800000000000000000000',
      commitDeadlineBlock: '150',
      deadlineBlock: '160',
    })
    expect(lower(request.proposer)).toBe(SPONSOR)
  })

  it('keeps commits blind: a commit carries the bond but no verdict', () => {
    const log = buildCommittedLog({ requestId: REQUEST_ID, sentinel: SENTINEL, bondAmount: 5000n })
    const [commit] = byType(decodeLogs([log]), CheckEventType.SENTINEL_COMMITTED)
    expect(commit).toMatchObject({ requestId: REQUEST_ID, bondAmount: '5000' })
    expect(lower(commit.sentinel)).toBe(SENTINEL)
    expect('approved' in commit).toBe(false)
  })

  it.each([
    { approved: true, reason: 'looks benign' },
    { approved: false, reason: 'drains the vault ✓\nsecond line' },
    { approved: true, reason: '' },
    { approved: false, reason: '' },
  ])('carries the verdict and reason on a reveal ($approved, "$reason")', ({ approved, reason }) => {
    const log = buildRevealedLog({ requestId: REQUEST_ID, sentinel: SENTINEL, approved, bondAmount: 7n, reason })
    const [revealed] = byType(decodeLogs([log]), CheckEventType.SENTINEL_REVEALED)
    expect(revealed).toMatchObject({ requestId: REQUEST_ID, approved, bondAmount: '7', reason })
    expect(lower(revealed.sentinel)).toBe(SENTINEL)
  })

  it.each([true, false])('decodes OracleResult approved=%s with its result bytes', (approved) => {
    const log = buildOracleResultLog({ requestId: REQUEST_ID, sponsor: SPONSOR, result: '0x1234', approved })
    const [result] = byType(decodeLogs([log]), CheckEventType.ORACLE_RESULT)
    expect(result).toMatchObject({ requestId: REQUEST_ID, approved, result: '0x1234' })
    expect(lower(result.proposer)).toBe(SPONSOR)
  })
})

describe('decodeLogs — dispute and timeout events', () => {
  it('decodes the arbitration deadline of DisputeTriggered', () => {
    const [triggered] = byType(
      decodeLogs([buildDisputeTriggeredLog({ requestId: REQUEST_ID, deadline: 48_643_753n })]),
      CheckEventType.DISPUTE_TRIGGERED,
    )
    expect(triggered.arbitrationDeadlineBlock).toBe('48643753')
  })

  it.each(['', 'Council ruled: the payload is secure.\nSecond line — ünïcode ✓', ' padded '])(
    'keeps the DisputeResolved context verbatim (%j) with outcome and slashed amount',
    (context) => {
      const log = buildDisputeResolvedLog({
        requestId: REQUEST_ID,
        outcome: 2,
        slashed: 123_456_789_012_345_678_901n,
        context,
      })
      const [resolved] = byType(decodeLogs([log]), CheckEventType.DISPUTE_RESOLVED)
      expect(resolved).toMatchObject({ requestId: REQUEST_ID, outcome: 2, slashed: '123456789012345678901', context })
    },
  )

  it.each(['', 'Out of scope: not a transaction-security question', '  '])(
    'keeps the DisputeOutOfScope context verbatim (%j)',
    (context) => {
      const [outOfScope] = byType(
        decodeLogs([buildDisputeOutOfScopeLog({ requestId: REQUEST_ID, context })]),
        CheckEventType.DISPUTE_OUT_OF_SCOPE,
      )
      expect(outOfScope.context).toBe(context)
    },
  )

  it.each([
    { type: CheckEventType.DISPUTE_TRIGGERED, build: buildDisputeTriggeredLog },
    { type: CheckEventType.DISPUTE_RESOLVED, build: buildDisputeResolvedLog },
    { type: CheckEventType.DISPUTE_OUT_OF_SCOPE, build: buildDisputeOutOfScopeLog },
    { type: CheckEventType.ARBITRATION_TIMED_OUT, build: buildArbitrationTimedOutLog },
    { type: CheckEventType.REQUEST_TIMED_OUT, build: buildRequestTimedOutLog },
  ])('keeps the request identity on $type', ({ type, build }) => {
    const events = decodeLogs([build({ requestId: REQUEST_ID })])
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type, requestId: REQUEST_ID })
  })
})

describe.each(fixture.captures)('decodeLogs — real Gnosis capture $label', (capture) => {
  const events = decodeLogs(capture.logs)
  const claimedLogs = capture.logs.filter((log) => log.topics[0] === CLAIMED_TOPIC0)
  const request = requestOf(capture)

  it('decodes the lifecycle in on-chain order and skips the undeclared Claimed logs', () => {
    const { committedCount, revealedCount } = capture.expected
    const closing =
      capture.kind === 'attested'
        ? [CheckEventType.ORACLE_RESULT, CheckEventType.ORACLE_ATTESTED]
        : [CheckEventType.DISPUTE_TRIGGERED]
    expect(events.map((event) => event.type)).toEqual([
      CheckEventType.ORACLE_PROPOSED,
      CheckEventType.REQUEST_CREATED,
      ...Array<CheckEventType>(committedCount).fill(CheckEventType.SENTINEL_COMMITTED),
      ...Array<CheckEventType>(revealedCount).fill(CheckEventType.SENTINEL_REVEALED),
      ...closing,
    ])
    expect(events).toHaveLength(capture.logs.length - claimedLogs.length)
    expect(decodeLogs(claimedLogs)).toEqual([])
  })

  it('reads the Safe home chain and address from the proposal tuple', () => {
    const [proposed] = byType(events, CheckEventType.ORACLE_PROPOSED)
    expect(proposed).toMatchObject({
      ...capture.proposal,
      safeTxHash: capture.safeTxHash,
      chainId: capture.homeChainId,
      epoch: capture.epoch,
      oracleDataHash: capture.oracleDataHash,
    })
    expect(lower(proposed.safe)).toBe(lower(capture.safe))
    expect(lower(proposed.oracle)).toBe(lower(fixture.provenance.oracle))
  })

  it('tags every request-scoped event with the requestId', () => {
    const requestIds = events.flatMap((event) => ('requestId' in event ? [event.requestId] : []))
    expect(new Set(requestIds)).toEqual(new Set([capture.requestId]))
  })

  it('tallies the reveal verdicts into the sentinel counts the Oracle reports', () => {
    const reveals = byType(events, CheckEventType.SENTINEL_REVEALED)
    expect(reveals.filter((reveal) => reveal.approved)).toHaveLength(capture.expected.approveCount)
    expect(reveals.filter((reveal) => !reveal.approved)).toHaveLength(capture.expected.denyCount)
  })

  it('reports the same request terms the Oracle holds in state', () => {
    const [opened] = byType(events, CheckEventType.REQUEST_CREATED)
    expect(lower(opened.proposer)).toBe(lower(request.terms.sponsor))
    expect(opened.bondTarget).toBe(request.terms.bondTarget.toString())
    expect(opened.commitDeadlineBlock).toBe(request.terms.commitDeadline.toString())
    expect(opened.deadlineBlock).toBe(request.terms.revealDeadline.toString())
  })
})

describe.each(approvedCaptures)('decodeLogs — real Gnosis attestation of $label', (capture) => {
  const events = decodeLogs(capture.logs)
  const [proposed] = byType(events, CheckEventType.ORACLE_PROPOSED)
  const [attested] = byType(events, CheckEventType.ORACLE_ATTESTED)

  it('decodes the on-chain FROST attestation with exact coordinates', () => {
    const { attestation } = capture
    expect(attested).toMatchObject({
      blockNumber: attestation.blockNumber,
      logIndex: attestation.logIndex,
      transactionHash: attestation.transactionHash,
      signatureId: attestation.signatureId,
      attestation: { r: attestation.r, z: attestation.z },
      oracleDataHash: capture.oracleDataHash,
      safeTxHash: capture.safeTxHash,
    })
  })

  it('unpacks safeId into the home chain and Safe the proposal tuple carries', () => {
    expect(attested.chainId).toBe(capture.homeChainId)
    expect(attested.chainId).toBe(proposed.chainId)
    expect(lower(attested.safe)).toBe(lower(proposed.safe))
    expect(lower(attested.safe)).toBe(lower(capture.safe))
    expect(attested.epoch).toBe(proposed.epoch)
  })
})

describe.each(disputedCaptures)('decodeLogs — real Gnosis dispute of $label', (capture) => {
  it('reports the arbitration deadline the Oracle holds in state', () => {
    const request = requestOf(capture)
    const [triggered] = byType(decodeLogs(capture.logs), CheckEventType.DISPUTE_TRIGGERED)
    expect(triggered.requestId).toBe(capture.requestId)
    expect(triggered.arbitrationDeadlineBlock).toBe(request.progress.arbitrationDeadline.toString())
  })
})

describe('decodeLogs — totality (never throws)', () => {
  const everyEventLog = (): Array<{ name: string; log: RawLog; carriesData: boolean }> => [
    { name: 'TransactionProposed', log: buildOracleProposedLog(), carriesData: true },
    { name: 'TransactionAttested', log: buildOracleAttestedLog(), carriesData: true },
    { name: 'NewRequest', log: buildNewRequestLog(), carriesData: true },
    { name: 'Committed', log: buildCommittedLog(), carriesData: true },
    { name: 'Revealed', log: buildRevealedLog(), carriesData: true },
    { name: 'OracleResult', log: buildOracleResultLog(), carriesData: true },
    { name: 'DisputeTriggered', log: buildDisputeTriggeredLog(), carriesData: true },
    { name: 'DisputeResolved', log: buildDisputeResolvedLog(), carriesData: true },
    { name: 'DisputeOutOfScope', log: buildDisputeOutOfScopeLog(), carriesData: true },
    { name: 'ArbitrationTimedOut', log: buildArbitrationTimedOutLog(), carriesData: false },
    { name: 'RequestTimedOut', log: buildRequestTimedOutLog(), carriesData: false },
  ]

  it('returns [] for empty input', () => {
    expect(decodeLogs([])).toEqual([])
  })

  it('skips an unknown topic0', () => {
    resetLogCounter()
    const known = buildOracleProposedLog()
    const unknown: RawLog = { ...known, topics: ['0x' + 'f'.repeat(64)] }
    expect(decodeLogs([unknown])).toEqual([])
    expect(decodeLogs([known])).toHaveLength(1)
  })

  it('skips a log with no topics', () => {
    const bad: RawLog = { topics: [], data: '0x', blockNumber: 1, logIndex: 0, transactionHash: '0x' }
    expect(decodeLogs([bad])).toEqual([])
  })

  it.each(everyEventLog().filter(({ carriesData }) => carriesData))(
    'skips a malformed $name log (right topic0, garbage data) without throwing',
    ({ log }) => {
      const corrupt: RawLog = { ...log, data: '0xabcd' }
      expect(() => decodeLogs([corrupt])).not.toThrow()
      expect(decodeLogs([corrupt])).toEqual([])
    },
  )

  it.each(everyEventLog())('skips a $name log whose indexed topics are missing without throwing', ({ log }) => {
    const truncated: RawLog = { ...log, topics: log.topics.slice(0, 1) }
    expect(() => decodeLogs([truncated])).not.toThrow()
    expect(decodeLogs([truncated])).toEqual([])
  })

  it('decodes the good events and drops the bad ones in a mixed batch', () => {
    resetLogCounter()
    const good1 = buildOracleProposedLog()
    const good2 = buildNewRequestLog()
    const unknown: RawLog = {
      topics: ['0x' + '1'.repeat(64)],
      data: '0x',
      blockNumber: 1,
      logIndex: 9,
      transactionHash: '0x',
    }
    const corrupt: RawLog = { ...buildCommittedLog(), data: '0xabcd' }
    const events = decodeLogs([good1, unknown, corrupt, good2])
    expect(events.map((event) => event.type)).toEqual([CheckEventType.ORACLE_PROPOSED, CheckEventType.REQUEST_CREATED])
  })
})
