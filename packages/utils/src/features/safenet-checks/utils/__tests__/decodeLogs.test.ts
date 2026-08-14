import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { decodeLogs, type RawLog } from '../decodeLogs'
import {
  buildDisputeResolvedLog,
  buildOracleAttestedLog,
  buildOracleProposedLog,
  buildOracleResultLog,
  buildV1CommittedLog,
  buildV1NewRequestLog,
  buildV2CommittedLog,
  buildV2NewRequestLog,
  buildV2RevealedLog,
  resetLogCounter,
} from '../../builders/rawLogs'
import { CheckEventType, OracleGeneration, type NormalizedCheckEvent } from '../../types'

const loadFixture = (name: string): { logs: RawLog[]; safeTxHash?: string } =>
  JSON.parse(readFileSync(join(__dirname, '../../__fixtures__', name), 'utf8'))

const byType = <T extends NormalizedCheckEvent['type']>(
  events: NormalizedCheckEvent[],
  type: T,
): Extract<NormalizedCheckEvent, { type: T }>[] =>
  events.filter((event): event is Extract<NormalizedCheckEvent, { type: T }> => event.type === type)

describe('decodeLogs — V1 (direct-commit) lifecycle, built through the real fragments', () => {
  const SAFE_TX_HASH = '0x1111111111111111111111111111111111111111111111111111111111111111'
  const REQUEST_ID = '0x2222222222222222222222222222222222222222222222222222222222222222'
  const events = decodeLogs([
    buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n }),
    buildV1NewRequestLog({ requestId: REQUEST_ID, deadline: 150n }),
    buildV1CommittedLog({ requestId: REQUEST_ID, approved: true, position: 0n }),
    buildV1CommittedLog({ requestId: REQUEST_ID, approved: false, position: 1n }),
    buildOracleResultLog({ requestId: REQUEST_ID, approved: true }),
    buildDisputeResolvedLog({ requestId: REQUEST_ID, outcome: 2, slashed: 42n }),
    buildOracleAttestedLog({ safeTxHash: SAFE_TX_HASH, epoch: 7n }),
  ])

  it('decodes every event in the sequence', () => {
    expect(events).toHaveLength(7)
  })

  it('decodes the Consensus proposal (generation-agnostic, string bigints)', () => {
    const [proposed] = byType(events, CheckEventType.ORACLE_PROPOSED)
    expect(proposed.safeTxHash).toBe('0x1111111111111111111111111111111111111111111111111111111111111111')
    expect(proposed.epoch).toBe('7')
    expect(proposed.generation).toBe(OracleGeneration.STABLE)
    expect(typeof proposed.chainId).toBe('string')
  })

  it('normalizes the V1 NewRequest deadline and tags it V1', () => {
    const [request] = byType(events, CheckEventType.REQUEST_CREATED)
    expect(request.generation).toBe(OracleGeneration.V1)
    expect(request.deadlineBlock).toBe('150')
    expect(request.commitDeadlineBlock).toBeNull()
  })

  it('carries the per-sentinel verdict on V1 Committed', () => {
    const commits = byType(events, CheckEventType.SENTINEL_COMMITTED)
    expect(commits).toHaveLength(2)
    expect(commits.map((c) => c.approved)).toEqual([true, false])
    expect(commits[0].position).toBe('0')
    expect(commits[0].generation).toBe(OracleGeneration.V1)
  })

  it('decodes the shared OracleResult and DisputeResolved', () => {
    const [result] = byType(events, CheckEventType.ORACLE_RESULT)
    expect(result.approved).toBe(true)
    const [dispute] = byType(events, CheckEventType.DISPUTE_RESOLVED)
    expect(dispute.outcome).toBe(2)
    expect(dispute.slashed).toBe('42')
  })

  it('decodes the attestation with string point coordinates', () => {
    const [attested] = byType(events, CheckEventType.ORACLE_ATTESTED)
    expect(typeof attested.attestation.r.x).toBe('string')
    expect(typeof attested.attestation.z).toBe('string')
  })
})

describe('decodeLogs — V2 (commit-reveal) lifecycle, built through the real fragments', () => {
  const REQUEST_ID = '0x3333333333333333333333333333333333333333333333333333333333333333'
  const events = decodeLogs([
    buildV2NewRequestLog({ requestId: REQUEST_ID, commitDeadline: 150n, revealDeadline: 160n }),
    buildV2CommittedLog({ requestId: REQUEST_ID }),
    buildV2RevealedLog({ requestId: REQUEST_ID, approved: true, reason: 'looks benign' }),
  ])

  it('normalizes the V2 NewRequest deadlines (revealDeadline is the timeout block)', () => {
    const [request] = byType(events, CheckEventType.REQUEST_CREATED)
    expect(request.generation).toBe(OracleGeneration.V2)
    expect(request.deadlineBlock).toBe('160')
    expect(request.commitDeadlineBlock).toBe('150')
  })

  it('leaves the verdict off V2 Committed (activity only) and on V2 Revealed', () => {
    const [committed] = byType(events, CheckEventType.SENTINEL_COMMITTED)
    expect(committed.approved).toBeNull()
    expect(committed.position).toBeNull()
    const [revealed] = byType(events, CheckEventType.SENTINEL_REVEALED)
    expect(revealed.approved).toBe(true)
    expect(revealed.reason).toBe('looks benign')
    expect(revealed.generation).toBe(OracleGeneration.V2)
  })
})

describe('decodeLogs — live-captured devnet consensus logs', () => {
  const events = decodeLogs(loadFixture('consensus-lifecycle.captured.json').logs)

  it('decodes the real proposed + attested + result triple', () => {
    expect(byType(events, CheckEventType.ORACLE_PROPOSED)).toHaveLength(1)
    expect(byType(events, CheckEventType.ORACLE_ATTESTED)).toHaveLength(1)
    expect(byType(events, CheckEventType.ORACLE_RESULT)).toHaveLength(1)
  })

  it('decodes a real, non-degenerate FROST attestation', () => {
    const [attested] = byType(events, CheckEventType.ORACLE_ATTESTED)
    expect(BigInt(attested.attestation.r.x)).toBeGreaterThan(0n)
    expect(BigInt(attested.attestation.z)).toBeGreaterThan(0n)
  })
})

describe('decodeLogs — live-captured Gnosis beta plain-pair logs', () => {
  const fixture = loadFixture('gnosis-plain-lifecycle.captured.json')
  const events = decodeLogs(fixture.logs)

  it('decodes the real proposed + attested pair the beta actually emits', () => {
    expect(byType(events, CheckEventType.PLAIN_PROPOSED)).toHaveLength(1)
    expect(byType(events, CheckEventType.PLAIN_ATTESTED)).toHaveLength(1)
  })

  it('correlates the pair by safeTxHash across both events', () => {
    const [proposed] = byType(events, CheckEventType.PLAIN_PROPOSED)
    const [attested] = byType(events, CheckEventType.PLAIN_ATTESTED)
    expect(proposed.safeTxHash).toBe(fixture.safeTxHash)
    expect(attested.safeTxHash).toBe(fixture.safeTxHash)
    expect(attested.epoch).toBe(proposed.epoch)
  })

  it('reads the event chainId as the Safe home chain, not the Safenet chain', () => {
    // A real Arbitrum Safe checked on Gnosis beta: the event field is 42161.
    // The EIP-712 verification domain stays chainId 100 — see decisions 2026-07-28.
    const [proposed] = byType(events, CheckEventType.PLAIN_PROPOSED)
    expect(proposed.chainId).toBe('42161')
  })

  it('decodes a real, non-degenerate FROST attestation from the beta validator set', () => {
    const [attested] = byType(events, CheckEventType.PLAIN_ATTESTED)
    expect(BigInt(attested.attestation.r.x)).toBeGreaterThan(0n)
    expect(BigInt(attested.attestation.z)).toBeGreaterThan(0n)
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
    const good = buildV2NewRequestLog()
    const corrupt: RawLog = { ...good, data: '0xabcd' }
    expect(() => decodeLogs([corrupt])).not.toThrow()
    expect(decodeLogs([corrupt])).toEqual([])
  })

  it('decodes the good events and drops the bad ones in a mixed batch', () => {
    resetLogCounter()
    const good1 = buildOracleProposedLog()
    const good2 = buildV2NewRequestLog()
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
