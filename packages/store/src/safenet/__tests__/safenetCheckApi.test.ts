import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { configureStore } from '@reduxjs/toolkit'
import { Interface } from 'ethers'
import { setupServer, type SetupServerApi } from 'msw/node'
import {
  AttestationVerificationStatus,
  CheckEventType,
  CheckStatus,
  SAFENET_DEPLOYMENT,
  SAFENET_DEPLOYMENT_BLOCK,
  SafenetReader,
  UNVERIFIED_ATTESTATION,
  getSafenetReader,
  verdictAttestation,
  type Hex,
  type RequestOutcome,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import {
  CONSENSUS_READ_ABI,
  COORDINATOR_READ_ABI,
  ORACLE_READ_ABI,
} from '@safe-global/utils/features/safenet-checks/abi'
import {
  EMPTY_ORACLE_DATA_HASH,
  buildOracleAttestedLog,
  buildOracleProposedLog,
} from '@safe-global/utils/features/safenet-checks/builders'
import {
  makeEndpoint,
  type EthCall,
  type RequestStateSpec,
  type RpcConfig,
} from '@safe-global/utils/features/safenet-checks/services/__tests__/rpcEndpoint'
import type { RawLog } from '@safe-global/utils/features/safenet-checks/utils/decodeLogs'
import { transactionProposalHash } from '@safe-global/utils/features/safenet-checks/utils/proposalHash'
import type { CheckIdentity } from '../checkIdentity'
import { forgetAim, recordAim, resolveAim } from '../safenetAimRegistry'
import { safenetCheckApi } from '../safenetCheckApi'

jest.mock('@safe-global/utils/features/safenet-checks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks'),
  getSafenetReader: jest.fn(),
}))

const mockedGetReader = getSafenetReader as jest.MockedFunction<typeof getSafenetReader>

type Point = { x: string; y: string }

type CaptureAttestation = {
  signatureId: Hex
  r: Point
  z: string
  blockNumber: number
  logIndex: number
  transactionHash: string
}

type Capture = {
  label: string
  safeTxHash: Hex
  homeChainId: string
  safe: string
  timestampMs: number
  epoch: string
  requestId: Hex
  proposal: { blockNumber: number; logIndex: number; transactionHash: string }
  attestation: CaptureAttestation | null
  groupKey: Point | null
  logs: RawLog[]
  requestState: { blockNumber: number; rawResult: string }
  expected: {
    state: string
    outcome: string
    committedCount: number
    revealedCount: number
    approveCount: number
    denyCount: number
  }
}

const aegis: { provenance: { oracle: string }; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../../../utils/src/features/safenet-checks/__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const capture = (label: string): Capture => {
  const found = aegis.captures.find((candidate) => candidate.label === label)
  if (!found) throw new Error(`missing capture ${label}`)
  return found
}

const attestationOf = (source: Capture): CaptureAttestation => {
  if (!source.attestation) throw new Error(`capture ${source.label} has no attestation`)
  return source.attestation
}

const APPROVED = capture('approved-first')
const APPROVED_OTHER = capture('approved-second')
const REAL_ATTESTATION = attestationOf(APPROVED)
const DISPUTED = capture('disputed-split')

// Decoded from each capture's verbatim getRequest bytes.
const DEADLINES: Record<string, { reveal: string; arbitration: string | null }> = {
  'approved-first': { reveal: '48597473', arbitration: null },
  'disputed-split': { reveal: '48593356', arbitration: '48643753' },
  'disputed-three-revealed': { reveal: '48593390', arbitration: '48643787' },
}

const RPC_URL = 'http://rpc.safenet.test/gnosis'
const BLOCK_SECONDS = 5
const ORACLE = aegis.provenance.oracle
const OBSERVED_AT_MS = 1_900_000_000_000
const HEAD = APPROVED.requestState.blockNumber
const NEXT_HEAD = HEAD + 100

const identityOf = (source: Capture): CheckIdentity => ({
  safeTxHash: source.safeTxHash,
  chainId: source.homeChainId,
  safeAddress: source.safe,
})

const IDENTITY = identityOf(APPROVED)

const SELECTORS = {
  getRequest: new Interface([...ORACLE_READ_ABI]).getFunction('getRequest')!.selector,
  getAttestationSignatureId: new Interface([...CONSENSUS_READ_ABI]).getFunction('getAttestationSignatureId')!.selector,
  groupKey: new Interface([...COORDINATOR_READ_ABI]).getFunction('groupKey')!.selector,
}

const callsOf = (calls: EthCall[], name: keyof typeof SELECTORS): EthCall[] =>
  calls.filter((call) => call.selector === SELECTORS[name])

/** Block timestamps follow one timeline: the capture's proposal block sits at its submission time. */
const headTimestampFor = (source: Capture, head: number): number =>
  source.timestampMs / 1000 + (head - source.proposal.blockNumber) * BLOCK_SECONDS

const blockTimeOf = (source: Capture, block: number): number =>
  source.timestampMs + (block - source.proposal.blockNumber) * BLOCK_SECONDS * 1000

const configFor = (source: Capture, over: Partial<RpcConfig> = {}): RpcConfig => {
  const head = over.head ?? source.requestState.blockNumber
  return {
    url: RPC_URL,
    head,
    headTimestamp: headTimestampFor(source, head),
    logs: source.logs,
    requests: { [source.requestId]: { raw: source.requestState.rawResult } },
    ...(source.groupKey ? { groupKey: source.groupKey } : {}),
    ...over,
  }
}

const moveHead = (source: Capture, config: RpcConfig, head: number): void => {
  config.head = head
  config.headTimestamp = headTimestampFor(source, head)
}

const getterEvidence = (source: Capture): Pick<RpcConfig, 'signatureIds' | 'attestation'> => {
  const { signatureId, r, z } = attestationOf(source)
  return { signatureIds: { [source.requestId]: signatureId }, attestation: { r, z } }
}

const without = (logs: RawLog[], position: { blockNumber: number; logIndex: number }): RawLog[] =>
  logs.filter((log) => log.blockNumber !== position.blockNumber || log.logIndex !== position.logIndex)

const logAt = (logs: RawLog[], position: { blockNumber: number; logIndex: number }): RawLog => {
  const found = logs.find((log) => log.blockNumber === position.blockNumber && log.logIndex === position.logIndex)
  if (!found) throw new Error(`no log at ${position.blockNumber}:${position.logIndex}`)
  return found
}

const txHash = (seed: number): string => `0x${seed.toString(16).padStart(64, '0')}`

const requestIdFor = (source: Capture, epoch: bigint): Hex =>
  transactionProposalHash({
    chainId: '100',
    consensus: SAFENET_DEPLOYMENT.consensus,
    epoch: epoch.toString(),
    oracle: ORACLE,
    oracleDataHash: EMPTY_ORACLE_DATA_HASH as Hex,
    safeTxHash: source.safeTxHash,
  })

type ExtraRequest = { epoch: bigint; blockNumber: number; homeChainId?: bigint }

const proposalLog = (source: Capture, extra: ExtraRequest): RawLog =>
  buildOracleProposedLog(
    {
      safeTxHash: source.safeTxHash,
      chainId: extra.homeChainId ?? BigInt(source.homeChainId),
      safe: source.safe,
      epoch: extra.epoch,
      oracle: ORACLE,
    },
    { blockNumber: extra.blockNumber, logIndex: 1, transactionHash: txHash(extra.blockNumber) },
  )

/** An attested log with a valid curve point and a signature that cannot verify. */
const unverifiableAttestationLog = (source: Capture, extra: ExtraRequest, signatureId: Hex): RawLog =>
  buildOracleAttestedLog(
    {
      safeTxHash: source.safeTxHash,
      chainId: extra.homeChainId ?? BigInt(source.homeChainId),
      safe: source.safe,
      epoch: extra.epoch,
      oracle: ORACLE,
      signatureId,
      r: { x: BigInt(REAL_ATTESTATION.r.x), y: BigInt(REAL_ATTESTATION.r.y) },
      z: 1n,
    },
    { blockNumber: extra.blockNumber + 1, logIndex: 2, transactionHash: txHash(extra.blockNumber + 1) },
  )

const SIBLING: ExtraRequest = { epoch: 999n, blockNumber: HEAD - 40 }
const SIBLING_ID = requestIdFor(APPROVED, SIBLING.epoch)
const FOREIGN: ExtraRequest = { epoch: 777n, blockNumber: HEAD - 30, homeChainId: 137n }
const FOREIGN_ID = requestIdFor(APPROVED, FOREIGN.epoch)
const OTHER_SIGNATURE_ID = `0x${'77'.repeat(32)}` as Hex
const EPOCH = BigInt(APPROVED.epoch)

/** The builder places the attested log one block after `extra.blockNumber`. */
const forgedAttestationLog = (attestedBlock: number): RawLog =>
  unverifiableAttestationLog(APPROVED, { epoch: EPOCH, blockNumber: attestedBlock - 1 }, OTHER_SIGNATURE_ID)

const withSibling = (state: RequestStateSpec, extraLogs: RawLog[] = []): RpcConfig =>
  configFor(APPROVED, {
    logs: [...APPROVED.logs, proposalLog(APPROVED, SIBLING), ...extraLogs],
    requests: { [APPROVED.requestId]: { raw: APPROVED.requestState.rawResult }, [SIBLING_ID]: state },
  })

let server: SetupServerApi | undefined

const serve = (config: RpcConfig, oracles: string[] = [ORACLE]) => {
  const endpoint = makeEndpoint(config)
  server = setupServer(endpoint.handler)
  server.listen({ onUnhandledRequest: 'error' })
  // A fresh reader per poll: ethers shares identical requests for 250ms, which would hide a chain that moved.
  mockedGetReader.mockImplementation(
    () =>
      new SafenetReader({
        rpcUrls: [RPC_URL],
        chainId: '100',
        consensus: SAFENET_DEPLOYMENT.consensus,
        coordinator: SAFENET_DEPLOYMENT.coordinator,
        oracles,
      }),
  )
  return endpoint
}

const startSession = () => {
  const store = configureStore({
    reducer: { [safenetCheckApi.reducerPath]: safenetCheckApi.reducer },
    middleware: (getDefault) => getDefault().concat(safenetCheckApi.middleware),
  })
  const query = (identity: CheckIdentity) =>
    store.dispatch(safenetCheckApi.endpoints.getSafenetCheck.initiate(identity, { forceRefetch: true }))
  /** One poll that must succeed. */
  const poll = async (identity: CheckIdentity): Promise<SafenetCheckSnapshot> => {
    const { data, error } = await query(identity)
    if (error || !data) throw new Error(`poll failed: ${JSON.stringify(error)}`)
    return data
  }
  const cached = (identity: CheckIdentity) =>
    safenetCheckApi.endpoints.getSafenetCheck.select(identity)(store.getState())
  return { store, query, poll, cached }
}

const firstPoll = async (source: Capture = APPROVED) => {
  const config = configFor(source)
  const endpoint = serve(config)
  const session = startSession()
  const first = await session.poll(identityOf(source))
  return { config, endpoint, session, first }
}

const requestOf = (snapshot: SafenetCheckSnapshot, requestId: Hex) => {
  const request = snapshot.requests.find((candidate) => candidate.requestId === requestId)
  if (!request) throw new Error(`no request ${requestId} in the snapshot`)
  return request
}

const idsOf = (snapshot: SafenetCheckSnapshot): Hex[] => snapshot.requests.map((request) => request.requestId)

const verifiedBy = (source: Capture) => ({
  status: AttestationVerificationStatus.VERIFIED,
  signatureId: attestationOf(source).signatureId,
  message: source.requestId,
})

/** Lets a cache-entry lifecycle continuation run: the tick queue drains ahead of pending microtasks. */
const flushLifecycle = (): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  process.nextTick(resolve)
  return promise
}

beforeEach(() => {
  forgetAim(IDENTITY)
})

afterEach(() => {
  server?.close()
  server = undefined
  jest.restoreAllMocks()
})

describe('a real approved request', () => {
  it('decides BENIGN from the request, its verified attestation and its attested log', async () => {
    serve(configFor(APPROVED))

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      safeTxHash: APPROVED.safeTxHash,
      chainId: '100',
      status: CheckStatus.BENIGN,
      outcome: 'APPROVED',
      requestId: APPROVED.requestId,
      epoch: APPROVED.epoch,
      deadlineBlock: DEADLINES['approved-first'].reveal,
      attestation: verifiedBy(APPROVED),
      aimedAtMs: null,
      windowCoverage: 'heuristic',
      evidenceComplete: true,
    })
    expect(data.oracle?.toLowerCase()).toBe(ORACLE.toLowerCase())
    expect(idsOf(data)).toEqual([APPROVED.requestId])
    expect(data.requests[0]).toMatchObject({
      chainId: APPROVED.homeChainId,
      state: APPROVED.expected.state,
      outcome: APPROVED.expected.outcome,
      committedCount: APPROVED.expected.committedCount,
      revealedCount: APPROVED.expected.revealedCount,
      approveCount: APPROVED.expected.approveCount,
      denyCount: APPROVED.expected.denyCount,
      revealDeadlineBlock: DEADLINES['approved-first'].reveal,
      arbitrationDeadlineBlock: null,
      proposedAt: APPROVED.proposal,
      attestation: verifiedBy(APPROVED),
    })
  })

  it('carries the attested log of the request and the signature that verified it', async () => {
    serve(configFor(APPROVED))

    const data = await startSession().poll(IDENTITY)

    expect(data.requests[0].attestedEvent).toMatchObject({
      type: CheckEventType.ORACLE_ATTESTED,
      epoch: APPROVED.epoch,
      signatureId: REAL_ATTESTATION.signatureId,
      attestation: { r: REAL_ATTESTATION.r, z: REAL_ATTESTATION.z },
      blockNumber: REAL_ATTESTATION.blockNumber,
      logIndex: REAL_ATTESTATION.logIndex,
      transactionHash: REAL_ATTESTATION.transactionHash,
    })
    expect(verdictAttestation(data)).toEqual(data.requests[0].attestedEvent)
    expect(data.events).toContainEqual(data.requests[0].attestedEvent)
  })

  it('dates the attestation from its block header and the snapshot from the head header', async () => {
    serve(configFor(APPROVED))

    const data = await startSession().poll(IDENTITY)

    expect(data.headBlock).toBe(String(HEAD))
    expect(data.headAtMs).toBe(blockTimeOf(APPROVED, HEAD))
    expect(data.attestedAtMs).toBe(blockTimeOf(APPROVED, REAL_ATTESTATION.blockNumber))
    expect(data.requests[0].attestedAtMs).toBe(data.attestedAtMs)
  })

  it.each(['null', 'error'] as const)(
    'keeps the verified attestation and loses only its date when the header read answers %s',
    async (failBlockProbes) => {
      serve(configFor(APPROVED, { failBlockProbes }))

      const data = await startSession().poll(IDENTITY)

      expect(data).toMatchObject({
        status: CheckStatus.BENIGN,
        attestation: verifiedBy(APPROVED),
        attestedAtMs: null,
        headAtMs: blockTimeOf(APPROVED, HEAD),
      })
      expect(data.requests[0].attestedAtMs).toBeNull()
    },
  )
})

describe('the approved snapshot as Redux state', () => {
  it('stamps the time the snapshot was observed', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(OBSERVED_AT_MS)
    serve(configFor(APPROVED))

    const data = await startSession().poll(IDENTITY)

    expect(data.observedAtMs).toBe(OBSERVED_AT_MS)
  })

  it('is JSON-serializable, so it can live in Redux', async () => {
    serve(configFor(APPROVED))

    const data = await startSession().poll(IDENTITY)

    expect(JSON.parse(JSON.stringify(data))).toStrictEqual(data)
  })

  it('keeps two checks of one store apart, each with its own request and signature', async () => {
    serve(
      configFor(APPROVED, {
        logs: [...APPROVED.logs, ...APPROVED_OTHER.logs],
        requests: {
          [APPROVED.requestId]: { raw: APPROVED.requestState.rawResult },
          [APPROVED_OTHER.requestId]: { raw: APPROVED_OTHER.requestState.rawResult },
        },
      }),
    )
    const session = startSession()

    const first = await session.poll(IDENTITY)
    const second = await session.poll(identityOf(APPROVED_OTHER))

    expect(first).toMatchObject({ requestId: APPROVED.requestId, attestation: verifiedBy(APPROVED) })
    expect(second).toMatchObject({ requestId: APPROVED_OTHER.requestId, attestation: verifiedBy(APPROVED_OTHER) })
    expect(idsOf(second)).toEqual([APPROVED_OTHER.requestId])
    expect(Object.keys(session.store.getState()[safenetCheckApi.reducerPath].queries)).toHaveLength(2)
  })
})

describe('real open disputes', () => {
  it.each(['disputed-split', 'disputed-three-revealed'])(
    '%s waits on its arbitration deadline and claims no attestation',
    async (label) => {
      const source = capture(label)
      const deadlines = DEADLINES[label]
      const endpoint = serve(configFor(source))

      const data = await startSession().poll(identityOf(source))

      expect(data).toMatchObject({
        status: CheckStatus.IN_PROGRESS,
        outcome: 'DISPUTED',
        requestId: source.requestId,
        epoch: source.epoch,
        deadlineBlock: deadlines.arbitration,
        attestation: UNVERIFIED_ATTESTATION,
        attestedAtMs: null,
      })
      expect(idsOf(data)).toEqual([source.requestId])
      expect(data.requests[0]).toMatchObject({
        state: source.expected.state,
        outcome: 'DISPUTED',
        committedCount: source.expected.committedCount,
        revealedCount: source.expected.revealedCount,
        approveCount: source.expected.approveCount,
        denyCount: source.expected.denyCount,
        revealDeadlineBlock: deadlines.reveal,
        arbitrationDeadlineBlock: deadlines.arbitration,
        attestation: UNVERIFIED_ATTESTATION,
        attestedEvent: null,
        attestedAtMs: null,
      })
      expect(verdictAttestation(data)).toBeUndefined()
      expect(callsOf(endpoint.ethCalls, 'getAttestationSignatureId')).toHaveLength(0)
      expect(callsOf(endpoint.ethCalls, 'groupKey')).toHaveLength(0)
    },
  )
})

describe('Oracle allowlist', () => {
  it('never reads a request of an unlisted Oracle, so a valid FROST attestation cannot make it BENIGN', async () => {
    const endpoint = serve(configFor(APPROVED), ['0x00000000000000000000000000000000000000AA'])

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status: CheckStatus.UNAVAILABLE,
      outcome: null,
      requestId: null,
      attestation: UNVERIFIED_ATTESTATION,
      attestedAtMs: null,
      evidenceComplete: false,
    })
    expect(data.requests).toEqual([])
    expect(data.events).toEqual([])
    expect(callsOf(endpoint.ethCalls, 'getRequest')).toHaveLength(0)
    expect(callsOf(endpoint.ethCalls, 'groupKey')).toHaveLength(0)
  })
})

describe('check target binding', () => {
  const WRONG_TARGETS: Array<[string, Partial<CheckIdentity>]> = [
    ['another Safe', { safeAddress: APPROVED_OTHER.safe }],
    ['another home chain', { chainId: '137' }],
  ]

  it.each(WRONG_TARGETS)('reads the request as absent when the same hash is viewed for %s', async (_name, over) => {
    const endpoint = serve(configFor(APPROVED))

    const data = await startSession().poll({ ...IDENTITY, ...over })

    expect(data).toMatchObject({
      status: CheckStatus.UNAVAILABLE,
      outcome: null,
      requestId: null,
      attestation: UNVERIFIED_ATTESTATION,
      windowCoverage: 'heuristic',
      evidenceComplete: false,
    })
    expect(data.requests).toEqual([])
    expect(data.events).toEqual([])
    expect(callsOf(endpoint.ethCalls, 'getRequest')).toHaveLength(0)
  })

  it.each([
    ['lower-case', APPROVED.safe.toLowerCase()],
    ['upper-case', `0x${APPROVED.safe.slice(2).toUpperCase()}`],
  ])('matches the Safe address in %s', async (_name, safeAddress) => {
    serve(configFor(APPROVED))

    const data = await startSession().poll({ ...IDENTITY, safeAddress })

    expect(data).toMatchObject({ status: CheckStatus.BENIGN, requestId: APPROVED.requestId })
  })

  describe('a same-hash proposal and attestation from another home chain', () => {
    const foreignConfig = configFor(APPROVED, {
      logs: [
        ...APPROVED.logs,
        proposalLog(APPROVED, FOREIGN),
        unverifiableAttestationLog(APPROVED, FOREIGN, OTHER_SIGNATURE_ID),
      ],
      requests: {
        [APPROVED.requestId]: { raw: APPROVED.requestState.rawResult },
        [FOREIGN_ID]: { state: 3 },
      },
    })

    it('does not enter, decide or alter the view of the target chain', async () => {
      serve(foreignConfig)

      const data = await startSession().poll(IDENTITY)

      expect(data).toMatchObject({
        status: CheckStatus.BENIGN,
        requestId: APPROVED.requestId,
        attestation: verifiedBy(APPROVED),
      })
      expect(idsOf(data)).toEqual([APPROVED.requestId])
    })

    it('is judged on its own signature in the foreign view, not by the target chain', async () => {
      serve(foreignConfig)

      const data = await startSession().poll({ ...IDENTITY, chainId: '137' })

      expect(data).toMatchObject({
        status: CheckStatus.VERIFICATION_FAILED,
        requestId: FOREIGN_ID,
        attestation: { status: AttestationVerificationStatus.INVALID, signatureId: OTHER_SIGNATURE_ID },
      })
      expect(idsOf(data)).toEqual([FOREIGN_ID])
    })
  })
})

describe('per-request verification', () => {
  const ARBITRATION_DEADLINE = HEAD + 50_000
  const SIBLING_STATES: Array<[string, RequestStateSpec, CheckStatus, RequestOutcome]> = [
    [
      'an open dispute outranks the verified request',
      { state: 2, arbitrationDeadline: ARBITRATION_DEADLINE },
      CheckStatus.IN_PROGRESS,
      'DISPUTED',
    ],
    ['a denied sibling outranks the verified request', { state: 4 }, CheckStatus.MALICIOUS, 'DENIED'],
  ]

  it('leaves an approved sibling without an attestation unverified while the real request stays verified', async () => {
    serve(withSibling({ state: 3 }))

    const data = await startSession().poll(IDENTITY)

    expect(idsOf(data).sort()).toEqual([APPROVED.requestId, SIBLING_ID].sort())
    expect(requestOf(data, APPROVED.requestId).attestation).toEqual(verifiedBy(APPROVED))
    expect(requestOf(data, SIBLING_ID)).toMatchObject({
      outcome: 'APPROVED',
      attestation: UNVERIFIED_ATTESTATION,
      attestedEvent: null,
      attestedAtMs: null,
    })
    expect(data).toMatchObject({
      status: CheckStatus.BENIGN,
      requestId: APPROVED.requestId,
      epoch: APPROVED.epoch,
      attestation: verifiedBy(APPROVED),
    })
  })

  it('gives an approved sibling its own failed signature and never the one of the real request', async () => {
    serve(withSibling({ state: 3 }, [unverifiableAttestationLog(APPROVED, SIBLING, OTHER_SIGNATURE_ID)]))

    const data = await startSession().poll(IDENTITY)

    expect(requestOf(data, SIBLING_ID).attestation).toMatchObject({
      status: AttestationVerificationStatus.INVALID,
      signatureId: OTHER_SIGNATURE_ID,
      message: SIBLING_ID,
    })
    expect(requestOf(data, APPROVED.requestId).attestation).toEqual(verifiedBy(APPROVED))
    expect(data).toMatchObject({
      status: CheckStatus.BENIGN,
      requestId: APPROVED.requestId,
      attestation: verifiedBy(APPROVED),
    })
    expect(verdictAttestation(data)).toMatchObject({ signatureId: REAL_ATTESTATION.signatureId })
  })

  it.each(SIBLING_STATES)('%s', async (_name, state, status, outcome) => {
    serve(withSibling(state))

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status,
      outcome,
      requestId: SIBLING_ID,
      epoch: String(SIBLING.epoch),
      attestation: UNVERIFIED_ATTESTATION,
      attestedAtMs: null,
    })
    expect(requestOf(data, APPROVED.requestId)).toMatchObject({
      outcome: 'APPROVED',
      attestation: verifiedBy(APPROVED),
    })
    expect(verdictAttestation(data)).toBeUndefined()
  })

  it('points the deadline of a disputed sibling at its arbitration deadline', async () => {
    serve(withSibling({ state: 2, arbitrationDeadline: ARBITRATION_DEADLINE }))

    const data = await startSession().poll(IDENTITY)

    expect(data.deadlineBlock).toBe(String(ARBITRATION_DEADLINE))
  })
})

describe('attestation selection', () => {
  const NEWER = REAL_ATTESTATION.blockNumber + 5
  const OLDER = REAL_ATTESTATION.blockNumber - 5

  it.each([
    ['newer', NEWER],
    ['older', OLDER],
  ])('verifies a request through its valid attestation when an invalid one of it is %s', async (_order, block) => {
    serve(configFor(APPROVED, { logs: [...APPROVED.logs, forgedAttestationLog(block)] }))

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status: CheckStatus.BENIGN,
      requestId: APPROVED.requestId,
      attestation: verifiedBy(APPROVED),
      attestedAtMs: blockTimeOf(APPROVED, REAL_ATTESTATION.blockNumber),
    })
    expect(verdictAttestation(data)).toMatchObject({
      signatureId: REAL_ATTESTATION.signatureId,
      blockNumber: REAL_ATTESTATION.blockNumber,
      logIndex: REAL_ATTESTATION.logIndex,
    })
    expect(idsOf(data)).toEqual([APPROVED.requestId])
  })

  it('fails verification only when none of the attestations of the request verifies', async () => {
    const invalidOnly = [
      ...without(APPROVED.logs, REAL_ATTESTATION),
      forgedAttestationLog(NEWER),
      forgedAttestationLog(OLDER),
    ]
    serve(configFor(APPROVED, { logs: invalidOnly }))

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status: CheckStatus.VERIFICATION_FAILED,
      requestId: APPROVED.requestId,
      attestation: { status: AttestationVerificationStatus.INVALID, signatureId: OTHER_SIGNATURE_ID },
    })
  })

  it('stays awaiting verification when a transient group-key failure hides the valid attestation', async () => {
    const config = configFor(APPROVED, { logs: [...APPROVED.logs, forgedAttestationLog(OLDER)] })
    // The newest attestation is read first and meets the failure; the older one then finds the key.
    let groupKeyReads = 0
    Object.defineProperty(config, 'failGroupKey', { get: () => groupKeyReads++ === 0 })
    serve(config)
    const session = startSession()

    const first = await session.poll(IDENTITY)
    const retried = await session.poll(IDENTITY)

    expect(first).toMatchObject({
      status: CheckStatus.AWAITING_VERIFICATION,
      requestId: APPROVED.requestId,
      attestation: { status: AttestationVerificationStatus.PENDING, signatureId: REAL_ATTESTATION.signatureId },
    })
    expect(retried).toMatchObject({ status: CheckStatus.BENIGN, attestation: verifiedBy(APPROVED) })
  })
})

describe('an attested log of another transaction', () => {
  const OTHER_TX: Capture = { ...APPROVED, safeTxHash: `0x${'cd'.repeat(32)}` as Hex }
  const OTHER_TX_ID = requestIdFor(OTHER_TX, EPOCH)

  it('is not accepted as verification when a node that ignores the topic filter serves it', async () => {
    const raw = { raw: APPROVED.requestState.rawResult }
    serve(
      configFor(APPROVED, {
        logs: [logAt(APPROVED.logs, REAL_ATTESTATION), proposalLog(OTHER_TX, { ...SIBLING, epoch: EPOCH })],
        requests: { [APPROVED.requestId]: raw, [OTHER_TX_ID]: raw },
        ignoreIndexedTopics: true,
      }),
    )

    const data = await startSession().poll(identityOf(OTHER_TX))

    expect(requestOf(data, OTHER_TX_ID).attestation.status).toBe(AttestationVerificationStatus.INVALID)
    expect(data.status).toBe(CheckStatus.VERIFICATION_FAILED)
  })
})

describe('getter-only attestation evidence', () => {
  it('verifies an approved request whose attested log is outside the window, without dating it', async () => {
    serve(configFor(APPROVED, { logs: without(APPROVED.logs, REAL_ATTESTATION), ...getterEvidence(APPROVED) }))

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status: CheckStatus.BENIGN,
      requestId: APPROVED.requestId,
      attestation: verifiedBy(APPROVED),
      attestedAtMs: null,
    })
    expect(data.requests[0]).toMatchObject({ attestedEvent: null, attestedAtMs: null })
    expect(verdictAttestation(data)).toBeUndefined()
  })

  it('resolves the verdict attestation to the attested log for log-derived evidence', async () => {
    serve(configFor(APPROVED, getterEvidence(APPROVED)))

    const data = await startSession().poll(IDENTITY)

    expect(verdictAttestation(data)).toMatchObject({
      signatureId: REAL_ATTESTATION.signatureId,
      blockNumber: REAL_ATTESTATION.blockNumber,
      logIndex: REAL_ATTESTATION.logIndex,
    })
  })

  it('fails the read instead of reading the request as unattested when the getter fails', async () => {
    serve(
      configFor(APPROVED, {
        logs: without(APPROVED.logs, REAL_ATTESTATION),
        ...getterEvidence(APPROVED),
        failAttestationGetters: true,
      }),
    )

    const result = await startSession().query(IDENTITY)

    expect(result.data).toBeUndefined()
    expect(result.error).toEqual({ message: expect.any(String) })
  })
})

describe('polling an existing check', () => {
  it('reads a carried request at the new head after its logs left the window', async () => {
    const { config, endpoint, session } = await firstPoll()
    moveHead(APPROVED, config, NEXT_HEAD)
    Object.assign(config, { logs: [], ...getterEvidence(APPROVED) })

    const second = await session.poll(IDENTITY)

    expect(second).toMatchObject({ headBlock: String(NEXT_HEAD), status: CheckStatus.BENIGN })
    expect(idsOf(second)).toEqual([APPROVED.requestId])
    expect(second.requests[0]).toMatchObject({ proposedAt: APPROVED.proposal, attestedEvent: null, attestedAtMs: null })
    expect(second.evidenceComplete).toBe(false)
    expect(callsOf(endpoint.ethCalls, 'getRequest').slice(-1)[0].blockTag).toBe(`0x${NEXT_HEAD.toString(16)}`)
  })

  it('keeps the complete previous snapshot when the endpoint falls behind it, and recovers later', async () => {
    const { config, session, first } = await firstPoll()
    moveHead(APPROVED, config, HEAD - 10)

    const failed = await session.query(IDENTITY)

    expect(failed.error).toEqual({ message: 'Safenet reader: endpoint is behind the previous read' })
    expect(session.cached(IDENTITY).data).toEqual(first)

    moveHead(APPROVED, config, NEXT_HEAD)
    expect((await session.poll(IDENTITY)).headBlock).toBe(String(NEXT_HEAD))
  })

  it('keeps the complete last success through a generic RPC failure', async () => {
    const { config, session, first } = await firstPoll()
    config.failEverything = true

    const failed = await session.query(IDENTITY)

    expect(failed.error).toEqual({ message: expect.any(String) })
    expect(session.cached(IDENTITY).data).toEqual(first)
  })

  const READ_FAILURES: Array<[string, Partial<RpcConfig>]> = [
    ['no revert data', { failRequests: true }],
    ['a revert other than RequestNotFound', { requests: { [DISPUTED.requestId]: { revert: '0xb704eaea' } } }],
  ]

  it.each(READ_FAILURES)(
    'keeps a carried open dispute and the complete previous snapshot through a read failure with %s',
    async (_name, failure) => {
      const { config, session, first } = await firstPoll(DISPUTED)
      moveHead(DISPUTED, config, NEXT_HEAD)
      Object.assign(config, { logs: [], ...failure })

      const failed = await session.query(identityOf(DISPUTED))

      expect(first).toMatchObject({ status: CheckStatus.IN_PROGRESS, outcome: 'DISPUTED' })
      expect(failed.error).toEqual({ message: expect.any(String) })
      expect(session.cached(identityOf(DISPUTED)).data).toEqual(first)
    },
  )

  it('drops a carried request the Oracle reports as RequestNotFound, and does not bring it back', async () => {
    const { config, session } = await firstPoll()
    moveHead(APPROVED, config, NEXT_HEAD)
    Object.assign(config, { logs: [], requests: { [APPROVED.requestId]: 'not-found' } })

    const second = await session.poll(IDENTITY)

    expect(second).toMatchObject({
      status: CheckStatus.UNAVAILABLE,
      outcome: null,
      requestId: null,
      attestation: UNVERIFIED_ATTESTATION,
    })
    expect(second.requests).toEqual([])

    config.requests = { [APPROVED.requestId]: { raw: APPROVED.requestState.rawResult } }
    expect((await session.poll(IDENTITY)).requests).toEqual([])
  })
})

describe('whole-snapshot replacement', () => {
  it('replaces every field together, leaving a snapshot no different from a cold read of the final state', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(OBSERVED_AT_MS)
    const pendingHead = APPROVED.proposal.blockNumber + 5
    const config = configFor(APPROVED, {
      head: pendingHead,
      logs: APPROVED.logs.filter((log) => log.blockNumber <= pendingHead),
      requests: {
        [APPROVED.requestId]: {
          state: 1,
          commitDeadline: pendingHead + 1,
          revealDeadline: Number(DEADLINES['approved-first'].reveal),
          committed: 2,
        },
      },
    })
    serve(config)
    const session = startSession()

    const pending = await session.poll(IDENTITY)
    Object.assign(config, configFor(APPROVED))
    const settled = await session.poll(IDENTITY)
    const cold = await startSession().poll(IDENTITY)

    expect(pending).toMatchObject({
      status: CheckStatus.IN_PROGRESS,
      outcome: 'PENDING',
      attestation: UNVERIFIED_ATTESTATION,
      attestedAtMs: null,
    })
    expect(settled).toMatchObject({ status: CheckStatus.BENIGN, outcome: 'APPROVED' })
    expect(settled).toEqual(cold)
  })

  it('follows chain state without a floor: a later timeout is not held at BENIGN', async () => {
    const { config, session, first } = await firstPoll()
    config.requests = {
      [APPROVED.requestId]: {
        state: 5,
        revealDeadline: Number(DEADLINES['approved-first'].reveal),
        committed: 2,
        revealed: 2,
        approve: 2,
      },
    }

    const second = await session.poll(IDENTITY)

    expect(first.status).toBe(CheckStatus.BENIGN)
    expect(second).toMatchObject({
      status: CheckStatus.TIMED_OUT,
      outcome: 'TIMED_OUT',
      requestId: APPROVED.requestId,
      attestation: UNVERIFIED_ATTESTATION,
      attestedAtMs: null,
    })
    expect(requestOf(second, APPROVED.requestId).attestedEvent).toBeNull()
  })
})

describe('block window aim', () => {
  // 40,000 blocks past the proposal: outside the head-relative lookback, reachable only by an aimed window.
  const FAR_HEAD = APPROVED.proposal.blockNumber + 40_000
  const PROPOSED_AT = APPROVED.timestampMs
  const LATER_OFFER = PROPOSED_AT + 7_200_000

  const farConfig = () => configFor(APPROVED, { head: FAR_HEAD })

  it('aims the read at the registered submission time', async () => {
    serve(farConfig())
    recordAim(IDENTITY, PROPOSED_AT)

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status: CheckStatus.BENIGN,
      requestId: APPROVED.requestId,
      aimedAtMs: PROPOSED_AT,
      windowCoverage: 'heuristic',
    })
  })

  it('scans head-relative when no surface offered a submission time, and cannot claim absence', async () => {
    serve(farConfig())

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status: CheckStatus.UNAVAILABLE,
      requestId: null,
      aimedAtMs: null,
      windowCoverage: 'heuristic',
      evidenceComplete: false,
    })
    expect(data.requests).toEqual([])
  })

  it('keeps ONE cache entry and one read for a check every surface shares', async () => {
    const endpoint = serve(configFor(APPROVED))
    const { store } = startSession()
    const { initiate } = safenetCheckApi.endpoints.getSafenetCheck

    await store.dispatch(initiate(IDENTITY))
    await store.dispatch(initiate({ ...IDENTITY, safeAddress: IDENTITY.safeAddress.toLowerCase() }))

    expect(Object.keys(store.getState()[safenetCheckApi.reducerPath].queries)).toHaveLength(1)
    expect(callsOf(endpoint.ethCalls, 'getRequest')).toHaveLength(1)
  })

  it('does not let the surface that subscribed first aim every later read', async () => {
    serve(farConfig())
    const session = startSession()

    recordAim(IDENTITY, LATER_OFFER)
    const worse = await session.poll(IDENTITY)
    recordAim(IDENTITY, PROPOSED_AT)
    const better = await session.poll(IDENTITY)

    expect(worse).toMatchObject({ aimedAtMs: LATER_OFFER, status: CheckStatus.UNAVAILABLE, requestId: null })
    expect(better).toMatchObject({ aimedAtMs: PROPOSED_AT, status: CheckStatus.BENIGN })
  })

  it('replays the best aim on every poll', async () => {
    serve(farConfig())
    const session = startSession()
    recordAim(IDENTITY, LATER_OFFER)
    recordAim(IDENTITY, PROPOSED_AT)

    const reads: SafenetCheckSnapshot[] = []
    for (let attempt = 0; attempt < 3; attempt++) reads.push(await session.poll(IDENTITY))

    expect(reads.map((read) => [read.aimedAtMs, read.status])).toEqual(Array(3).fill([PROPOSED_AT, CheckStatus.BENIGN]))
  })

  it('forgets the aim once the cache entry is gone', async () => {
    serve(configFor(APPROVED))
    const { store } = startSession()
    recordAim(IDENTITY, PROPOSED_AT)
    await store.dispatch(safenetCheckApi.endpoints.getSafenetCheck.initiate(IDENTITY))

    store.dispatch(safenetCheckApi.util.resetApiState())
    await flushLifecycle()

    expect(resolveAim(IDENTITY)).toBeNull()
  })
})

describe('discovery coverage', () => {
  it('proves absence only when the discovery ranges span the deployment block', async () => {
    serve({ url: RPC_URL, head: SAFENET_DEPLOYMENT_BLOCK + 25_000, logs: [] })

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({
      status: CheckStatus.UNAVAILABLE,
      requestId: null,
      windowCoverage: 'proven',
      evidenceComplete: true,
    })
  })

  it('does not prove absence once the head is beyond the lookback from the deployment block', async () => {
    serve({ url: RPC_URL, head: SAFENET_DEPLOYMENT_BLOCK + 100_000, logs: [] })

    const data = await startSession().poll(IDENTITY)

    expect(data).toMatchObject({ windowCoverage: 'heuristic', evidenceComplete: false })
  })
})

describe('read failures', () => {
  it('resolves to an error and no data when the endpoint serves another chain', async () => {
    serve(configFor(APPROVED, { chainId: '1' }))

    const result = await startSession().query(IDENTITY)

    expect(result.data).toBeUndefined()
    expect(result.error).toEqual({ message: 'Safenet reader: RPC serves chain 1, expected Gnosis Chain (100)' })
  })

  it('resolves to an error when a request found in the logs is missing from the Oracle', async () => {
    serve(configFor(APPROVED, { requests: {} }))

    const result = await startSession().query(IDENTITY)

    expect(result.data).toBeUndefined()
    expect(result.error).toEqual({
      message: `Safenet reader: request ${APPROVED.requestId} is missing from the Oracle`,
    })
  })

  it('surfaces an invalid check target before any network read', async () => {
    const endpoint = serve(configFor(APPROVED))

    const result = await startSession().query({ ...IDENTITY, chainId: '' })

    expect(result.data).toBeUndefined()
    expect(result.error).toEqual({ message: 'Safenet reader: invalid check target' })
    expect(endpoint.methods).toHaveLength(0)
  })

  it('reads normally on the next poll after a failed first read', async () => {
    const config = configFor(APPROVED, { failEverything: true })
    serve(config)
    const session = startSession()

    const failed = await session.query(IDENTITY)
    config.failEverything = false

    expect(failed.data).toBeUndefined()
    expect(await session.poll(IDENTITY)).toMatchObject({ status: CheckStatus.BENIGN, requestId: APPROVED.requestId })
  })
})
