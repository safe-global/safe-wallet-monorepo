import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { decodeLogs, type RawLog } from '../decodeLogs'
import { Interface } from 'ethers'
import {
  buildCommittedLog,
  buildDisputeResolvedLog,
  buildNewRequestLog,
  buildOracleAttestedLog,
  buildOracleProposedLog,
  buildOracleResultLog,
  buildRevealedLog,
  resetLogCounter,
} from '../../builders/rawLogs'
import { CheckEventType, type NormalizedCheckEvent } from '../../types'

const byType = <T extends NormalizedCheckEvent['type']>(
  events: NormalizedCheckEvent[],
  type: T,
): Extract<NormalizedCheckEvent, { type: T }>[] =>
  events.filter((event): event is Extract<NormalizedCheckEvent, { type: T }> => event.type === type)

describe('decodeLogs — commit-reveal lifecycle, built through the real fragments', () => {
  const SAFE_TX_HASH = '0x1111111111111111111111111111111111111111111111111111111111111111'
  const REQUEST_ID = '0x2222222222222222222222222222222222222222222222222222222222222222'
  const events = decodeLogs([
    buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n, chainId: 100n }),
    buildNewRequestLog({ requestId: REQUEST_ID, commitDeadline: 150n, revealDeadline: 160n }),
    buildCommittedLog({ requestId: REQUEST_ID }),
    buildRevealedLog({ requestId: REQUEST_ID, approved: true, reason: 'looks benign' }),
    buildOracleResultLog({ requestId: REQUEST_ID, approved: true }),
    buildDisputeResolvedLog({ requestId: REQUEST_ID, outcome: 2, slashed: 42n }),
    buildOracleAttestedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n }),
  ])

  it('decodes every event in the sequence', () => {
    expect(events).toHaveLength(7)
  })

  it('decodes the Consensus proposal with the tuple-sourced chainId (string bigints)', () => {
    const [proposed] = byType(events, CheckEventType.ORACLE_PROPOSED)
    expect(proposed.safeTxHash).toBe(SAFE_TX_HASH)
    expect(proposed.epoch).toBe('7')
    expect(proposed.chainId).toBe('100')
    // Empty oracleData hashes to the well-known empty keccak.
    expect(proposed.oracleDataHash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
  })

  it('normalizes both request deadlines', () => {
    const [request] = byType(events, CheckEventType.REQUEST_CREATED)
    expect(request.commitDeadlineBlock).toBe('150')
    expect(request.deadlineBlock).toBe('160')
  })

  it('keeps commits blind and carries the verdict on Revealed', () => {
    const [commit] = byType(events, CheckEventType.SENTINEL_COMMITTED)
    expect(commit.requestId).toBe(REQUEST_ID)
    expect('approved' in commit).toBe(false)
    const [revealed] = byType(events, CheckEventType.SENTINEL_REVEALED)
    expect(revealed.approved).toBe(true)
    expect(revealed.reason).toBe('looks benign')
  })

  it('decodes OracleResult and DisputeResolved', () => {
    const [result] = byType(events, CheckEventType.ORACLE_RESULT)
    expect(result.approved).toBe(true)
    const [dispute] = byType(events, CheckEventType.DISPUTE_RESOLVED)
    expect(dispute.outcome).toBe(2)
    expect(dispute.slashed).toBe('42')
  })

  it('decodes the attestation with string point coordinates and its oracleDataHash', () => {
    const [attested] = byType(events, CheckEventType.ORACLE_ATTESTED)
    expect(typeof attested.attestation.r.x).toBe('string')
    expect(typeof attested.attestation.z).toBe('string')
    expect(attested.oracleDataHash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
  })
})

describe('deployed Gnosis terminal events', () => {
  it.each([
    ['DisputeTriggered', 'uint64 deadline', [200n], CheckEventType.DISPUTE_TRIGGERED],
    ['DisputeOutOfScope', 'string context', ['outside scope'], CheckEventType.DISPUTE_OUT_OF_SCOPE],
    ['ArbitrationTimedOut', '', [], CheckEventType.ARBITRATION_TIMED_OUT],
    ['RequestTimedOut', '', [], CheckEventType.REQUEST_TIMED_OUT],
  ] as const)('decodes %s from the deployed signature', (name, fields, values, type) => {
    const iface = new Interface([`event ${name}(bytes32 indexed requestId${fields ? `, ${fields}` : ''})`])
    const requestId = `0x${'12'.repeat(32)}`
    const encoded = iface.encodeEventLog(name, [requestId, ...values])
    const [event] = decodeLogs([{ ...encoded, blockNumber: 100, logIndex: 0, transactionHash: '0x123' }])
    expect(event).toMatchObject({ type, requestId })
    if (type === CheckEventType.DISPUTE_TRIGGERED) expect(event).toHaveProperty('deadlineBlock', '200')
  })
})

describe('decodeLogs — totality (never throws)', () => {
  it('returns [] for empty input', () => {
    expect(decodeLogs([])).toEqual([])
  })

  it('skips an unknown topic0', () => {
    resetLogCounter()
    const known = buildOracleProposedLog()
    const unknown: RawLog = {
      ...known,
      topics: ['0x' + 'f'.repeat(64)],
    }
    expect(decodeLogs([unknown])).toEqual([])
    expect(decodeLogs([known])).toHaveLength(1)
  })

  it('skips a log with no topics', () => {
    const bad: RawLog = { topics: [], data: '0x', blockNumber: 1, logIndex: 0, transactionHash: '0x' }
    expect(decodeLogs([bad])).toEqual([])
  })

  it('skips a malformed log (right topic0, garbage data) without throwing', () => {
    resetLogCounter()
    const good = buildNewRequestLog()
    const corrupt: RawLog = { ...good, data: '0xabcd' }
    expect(() => decodeLogs([corrupt])).not.toThrow()
    expect(decodeLogs([corrupt])).toEqual([])
  })

  it('decodes the good events and drops the bad ones in a mixed batch', () => {
    resetLogCounter()
    const good1 = buildOracleProposedLog()
    const good2 = buildNewRequestLog()
    const bad: RawLog = {
      topics: ['0x' + '1'.repeat(64)],
      data: '0x',
      blockNumber: 1,
      logIndex: 9,
      transactionHash: '0x',
    }
    expect(decodeLogs([good1, bad, good2])).toHaveLength(2)
  })
})

const upgraded = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/safenet-gnosis-chain.captured.json'), 'utf8'),
) as {
  captures: Array<{
    logs: RawLog[]
    safeTxHash: string
    requestId: string
    homeChainId: string
    safe: string
    epoch: string
  }>
}
const fixture = upgraded.captures[0]
const events = decodeLogs(fixture.logs)

describe('decodeLogs — live-captured Safenet deployment on Gnosis Chain lifecycle', () => {
  it('decodes the full lifecycle, skipping unknown topics (Claimed)', () => {
    // Nine raw logs: the two Claimed logs are outside the decoder's event families.
    expect(events).toHaveLength(7)
  })

  it('reads chainId and safe from the transaction tuple on the proposal', () => {
    const [proposed] = byType(events, CheckEventType.ORACLE_PROPOSED)
    expect(proposed.safeTxHash).toBe(fixture.safeTxHash)
    expect(proposed.chainId).toBe(fixture.homeChainId)
    expect(proposed.chainId).toBe('1')
    expect(proposed.safe.toLowerCase()).toBe(fixture.safe.toLowerCase())
    expect(proposed.epoch).toBe(fixture.epoch)
    // keccak256 of the empty oracleData — derives the requestId.
    expect(proposed.oracleDataHash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
  })

  it('keeps commits blind and carries the verdict on reveals', () => {
    const commits = byType(events, CheckEventType.SENTINEL_COMMITTED)
    expect(commits).toHaveLength(2)
    expect(commits.every((commit) => !('approved' in commit))).toBe(true)
    const reveals = byType(events, CheckEventType.SENTINEL_REVEALED)
    expect(reveals).toHaveLength(2)
    expect(reveals.every((reveal) => reveal.approved)).toBe(true)
  })

  it('decodes the OracleResult for the request', () => {
    const [result] = byType(events, CheckEventType.ORACLE_RESULT)
    expect(result.requestId).toBe(fixture.requestId)
    expect(result.approved).toBe(true)
  })
})

describe('decodeLogs — live-captured Safenet deployment on Gnosis Chain attestation', () => {
  it('decodes the real proposed + attested pair', () => {
    expect(byType(events, CheckEventType.ORACLE_PROPOSED)).toHaveLength(1)
    expect(byType(events, CheckEventType.ORACLE_ATTESTED)).toHaveLength(1)
  })

  it('unpacks safeId and carries oracleDataHash on the attested event', () => {
    const [attested] = byType(events, CheckEventType.ORACLE_ATTESTED)
    expect(attested.safeTxHash).toBe(fixture.safeTxHash)
    expect(attested.chainId).toBe(fixture.homeChainId)
    expect(attested.chainId).toBe('1')
    expect(attested.safe.toLowerCase()).toBe(fixture.safe.toLowerCase())
    expect(attested.epoch).toBe(fixture.epoch)
    expect(attested.oracleDataHash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
    expect(BigInt(attested.attestation.r.x)).toBeGreaterThan(0n)
    expect(BigInt(attested.attestation.z)).toBeGreaterThan(0n)
  })

  it('derives the same chainId/safe from the tuple (proposed) and from safeId (attested)', () => {
    const [proposed] = byType(events, CheckEventType.ORACLE_PROPOSED)
    const [attested] = byType(events, CheckEventType.ORACLE_ATTESTED)
    expect(attested.chainId).toBe(proposed.chainId)
    expect(attested.safe.toLowerCase()).toBe(proposed.safe.toLowerCase())
  })
})
