import { AbiCoder } from 'ethers'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

const loadFixture = (name: string): { logs: RawLog[]; safeTxHash?: string } =>
  JSON.parse(readFileSync(join(__dirname, '../../__fixtures__', name), 'utf8'))

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

describe('decodeLogs — dispute and timeout events', () => {
  const REQUEST_ID = '0x3333333333333333333333333333333333333333333333333333333333333333'
  const meta = { blockNumber: 10, logIndex: 2, transactionHash: `0x${'ab'.repeat(32)}` }
  const base = { requestId: REQUEST_ID, ...meta }
  const SENTINEL = '0xa000000000000000000000000000000000000002'

  it('decodes DisputeTriggered with the arbitration deadline as a decimal string', () => {
    const logs = [buildDisputeTriggeredLog({ requestId: REQUEST_ID, deadline: 2n ** 40n }, meta)]
    expect(decodeLogs(logs)).toEqual([
      { type: CheckEventType.DISPUTE_TRIGGERED, ...base, arbitrationDeadlineBlock: '1099511627776' },
    ])
  })

  it('decodes the timeout events by request id alone', () => {
    const logs = [
      buildArbitrationTimedOutLog({ requestId: REQUEST_ID }, meta),
      buildRequestTimedOutLog({ requestId: REQUEST_ID }, meta),
    ]
    expect(decodeLogs(logs)).toEqual([
      { type: CheckEventType.ARBITRATION_TIMED_OUT, ...base },
      { type: CheckEventType.REQUEST_TIMED_OUT, ...base },
    ])
  })

  it.each(['', ' Council: "no" ✓ '])('keeps the context %j verbatim', (context) => {
    const logs = [
      buildDisputeResolvedLog({ requestId: REQUEST_ID, outcome: 1, slashed: 7n, context }, meta),
      buildDisputeOutOfScopeLog({ requestId: REQUEST_ID, context }, meta),
    ]
    expect(decodeLogs(logs)).toEqual([
      { type: CheckEventType.DISPUTE_RESOLVED, ...base, outcome: 1, slashed: '7', context },
      { type: CheckEventType.DISPUTE_OUT_OF_SCOPE, ...base, context },
    ])
  })

  // Solidity does not validate UTF-8; ethers throws only when the string field is read.
  it.each([
    {
      name: 'DisputeResolved',
      log: buildDisputeResolvedLog({ requestId: REQUEST_ID }, meta),
      types: ['uint8', 'uint128', 'bytes'],
      values: [1, 7n, '0xc3'],
      expected: { type: CheckEventType.DISPUTE_RESOLVED, ...base, outcome: 1, slashed: '7', context: null },
    },
    {
      name: 'DisputeOutOfScope',
      log: buildDisputeOutOfScopeLog({ requestId: REQUEST_ID }, meta),
      types: ['bytes'],
      values: ['0xc3'],
      expected: { type: CheckEventType.DISPUTE_OUT_OF_SCOPE, ...base, context: null },
    },
    {
      name: 'Revealed',
      log: buildRevealedLog({ requestId: REQUEST_ID, sentinel: SENTINEL }, meta),
      types: ['bool', 'uint96', 'bytes'],
      values: [true, 5n, '0xc3'],
      expected: {
        type: CheckEventType.SENTINEL_REVEALED,
        ...base,
        sentinel: SENTINEL,
        approved: true,
        bondAmount: '5',
        reason: null,
      },
    },
  ])('keeps $name with a null string field when the bytes are not valid UTF-8', ({ log, types, values, expected }) => {
    const data = AbiCoder.defaultAbiCoder().encode(types, values)
    expect(decodeLogs([{ ...log, data }])).toEqual([expected])
  })

  // Live Gnosis Oracle log, request 0xfc47e0c3…79e1 (capture `disputed-split`).
  it('decodes a real DisputeTriggered log off the deployed Oracle', () => {
    const real: RawLog = {
      address: '0x544F12bAd6FF72564abBc7eA6494A2a4BdD0DDD0',
      topics: [
        '0x86e8b85731e4787f033d85108356db1e068dea243be32d422e6dc5681ff49cc1',
        '0xfc47e0c375d455940f8173597b0ca5191b7d3949b2c2112593bf1b4ee9c179e1',
      ],
      data: '0x0000000000000000000000000000000000000000000000000000000002e63ea9',
      blockNumber: 48593353,
      logIndex: 135,
      transactionHash: '0x19da9d45c5fb6a792d130840859f2f359b5fee3ea8a7f5965de2d6724278ada3',
    }
    expect(decodeLogs([real])).toEqual([
      {
        type: CheckEventType.DISPUTE_TRIGGERED,
        requestId: '0xfc47e0c375d455940f8173597b0ca5191b7d3949b2c2112593bf1b4ee9c179e1',
        arbitrationDeadlineBlock: '48643753',
        blockNumber: 48593353,
        logIndex: 135,
        transactionHash: real.transactionHash,
      },
    ])
  })
})

describe('decodeLogs — live-captured Sepolia relaunch lifecycle', () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, '../../__fixtures__', 'sepolia-relaunch-lifecycle.json'), 'utf8'),
  ) as { logs: RawLog[]; safeTxHash: string; requestId: string; chainId: string; epoch: string }
  const events = decodeLogs(fixture.logs)

  it('decodes the full lifecycle, skipping unknown topics (Claimed)', () => {
    // 12 raw logs: 1 proposal + 8 decodable oracle events + 3 Claimed (unknown).
    expect(events).toHaveLength(9)
  })

  it('reads chainId and safe from the transaction tuple on the proposal', () => {
    const [proposed] = byType(events, CheckEventType.ORACLE_PROPOSED)
    expect(proposed.safeTxHash).toBe(fixture.safeTxHash)
    // The Safe's HOME chain from the transaction tuple — a mainnet Safe
    // checked by the Sepolia consensus.
    expect(proposed.chainId).toBe('1')
    expect(proposed.safe.toLowerCase()).toBe('0x888614448eb7c766864fafb1dd20ff0b47988a87')
    expect(proposed.epoch).toBe(fixture.epoch)
    // keccak256 of the empty oracleData — derives the requestId.
    expect(proposed.oracleDataHash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
  })

  it('maps sponsor to proposer and both deadlines on NewRequest', () => {
    const [request] = byType(events, CheckEventType.REQUEST_CREATED)
    expect(request.requestId).toBe(fixture.requestId)
    expect(request.proposer.toLowerCase()).toBe('0x1ff07880982708b139c8efb87f4f43d15f312127')
    expect(request.fee).toBe('400000000000000000')
    expect(request.commitDeadlineBlock).toBe('11528811')
    expect(request.deadlineBlock).toBe('11528814')
  })

  it('keeps commits blind and carries the verdict on reveals', () => {
    const commits = byType(events, CheckEventType.SENTINEL_COMMITTED)
    expect(commits).toHaveLength(3)
    const reveals = byType(events, CheckEventType.SENTINEL_REVEALED)
    expect(reveals).toHaveLength(3)
    expect(reveals.every((reveal) => reveal.approved)).toBe(true)
  })

  it('decodes the OracleResult for the request', () => {
    const [result] = byType(events, CheckEventType.ORACLE_RESULT)
    expect(result.requestId).toBe(fixture.requestId)
    expect(result.approved).toBe(true)
  })
})

describe('decodeLogs — live-captured Sepolia relaunch attestation', () => {
  const golden = JSON.parse(
    readFileSync(join(__dirname, '../../__fixtures__', 'sepolia-relaunch-attestation.golden.json'), 'utf8'),
  ) as { logs: RawLog[]; safeTxHash: string; epoch: string; oracleDataHash: string }
  const events = decodeLogs(golden.logs)

  it('decodes the real proposed + attested pair', () => {
    expect(byType(events, CheckEventType.ORACLE_PROPOSED)).toHaveLength(1)
    expect(byType(events, CheckEventType.ORACLE_ATTESTED)).toHaveLength(1)
  })

  it('unpacks safeId and carries oracleDataHash on the attested event', () => {
    const [attested] = byType(events, CheckEventType.ORACLE_ATTESTED)
    expect(attested.safeTxHash).toBe(golden.safeTxHash)
    // This check is cross-chain: a mainnet Safe (chainId 1) checked by the
    // Sepolia consensus. The tuple field is the Safe's HOME chain.
    expect(attested.chainId).toBe('1')
    expect(attested.safe.toLowerCase()).toBe('0x888614448eb7c766864fafb1dd20ff0b47988a87')
    expect(attested.epoch).toBe(golden.epoch)
    expect(attested.oracleDataHash).toBe(golden.oracleDataHash)
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

describe('decodeLogs — real Gnosis attestation', () => {
  type Attestation = { signatureId: string; r: { x: string; y: string }; z: string }
  type Capture = { label: string; logs: RawLog[]; safeTxHash: string; oracleDataHash: string }
  const { captures }: { captures: Array<Capture & { attestation: Attestation | null }> } = JSON.parse(
    readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
  )
  const attestedCaptures = captures.flatMap(({ attestation, ...capture }) =>
    attestation ? [{ ...capture, attestation }] : [],
  )

  it.each(attestedCaptures)('decodes the FROST signature of $label with its exact coordinates', (capture) => {
    const [attested] = byType(decodeLogs(capture.logs), CheckEventType.ORACLE_ATTESTED)
    const { signatureId, r, z } = capture.attestation

    expect(attested).toMatchObject({
      signatureId,
      attestation: { r, z },
      oracleDataHash: capture.oracleDataHash,
      safeTxHash: capture.safeTxHash,
    })
  })
})
