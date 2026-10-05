import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAddress, id as textHash } from 'ethers'
import { http, type HttpHandler } from 'msw'
import { setupServer, type SetupServerApi } from 'msw/node'
import { SafenetReader, type CheckReadResult, type FetchCheckStateOptions } from '../safenetReader'
import { MAX_EVIDENCE_BLOCKS, MAX_LOOKBACK_BLOCKS, SAFENET_DEPLOYMENT, SAFENET_DEPLOYMENT_BLOCK } from '../../constants'
import { oracleReadInterface } from '../../abi'
import { transactionProposalHash } from '../../utils/proposalHash'
import type { RawLog } from '../../utils/decodeLogs'
import {
  EMPTY_ORACLE_DATA_HASH,
  buildArbitrationTimedOutLog,
  buildCommittedLog,
  buildDisputeOutOfScopeLog,
  buildDisputeResolvedLog,
  buildDisputeTriggeredLog,
  buildOracleAttestedLog,
  buildOracleProposedLog,
  buildRequestTimedOutLog,
  buildRevealedLog,
} from '../../builders/rawLogs'
import {
  AttestationVerificationStatus,
  CheckEventType,
  type Hex,
  type OracleRequestState,
  type RequestOutcome,
  type RequestRead,
  type RequestRef,
  type SentinelVote,
} from '../../types'
import { makeEndpoint, type EthCall, type GetLogsFilter, type RequestStateSpec, type RpcConfig } from './rpcEndpoint'

const RPC_URL = 'http://rpc.test/1'
const BASE = SAFENET_DEPLOYMENT_BLOCK
const HEAD = BASE + 25_000
const FAR_HEAD = BASE + 100_000
const HOME = '1'
const SAFE = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const OTHER_SAFE = '0x2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b'
const ORACLE = '0x00000000000000000000000000000000000000AA'
const OTHER_ORACLE = getAddress('0x00000000000000000000000000000000000000bb')
const SAFE_TX_HASH: Hex = `0x${'ab'.repeat(32)}`
const SIGNATURE_ID: Hex = `0x${'5a'.repeat(32)}`
const S1 = '0x1111111111111111111111111111111111111111'
const S2 = '0x2222222222222222222222222222222222222222'
const S3 = '0x3333333333333333333333333333333333333333'
// Checksummed 'B' sorts before lowercase 'a' as a string; by lowercase address the order is the reverse.
const SENTINEL_LOWER_A = '0xa000000000000000000000000000000000000000'
const SENTINEL_UPPER_B = '0xB000000000000000000000000000000000000000'
const TARGET = { chainId: HOME, safeAddress: SAFE }
const CONSENSUS_ADDRESS = SAFENET_DEPLOYMENT.consensus.toLowerCase()
const PINNED_ORACLES = [...SAFENET_DEPLOYMENT.oracles]
const EVIDENCE_END_BLOCKS = MAX_EVIDENCE_BLOCKS / 2

const OPEN: RequestStateSpec = { state: 1 }
const APPROVED: RequestStateSpec = { state: 3, committed: 2, revealed: 2, approve: 2 }
const CONTESTED = { committed: 3, revealed: 3, approve: 2, deny: 1 }
const SPLIT = { committed: 2, revealed: 2, approve: 1, deny: 1 }
const TIMEOUT = { committed: 2, revealed: 1, approve: 1 }

const selector = (signature: string): string => textHash(signature).slice(0, 10)
const GET_REQUEST = selector('getRequest(bytes32)')
const GET_SIGNATURE_ID = selector('getAttestationSignatureId(bytes32)')
const GET_ATTESTATION = selector('getTransactionAttestationByHash(uint64,address,bytes32,bytes32)')

type Endpoint = { handler: HttpHandler; getLogsCalls: GetLogsFilter[]; ethCalls: EthCall[] }

let server: SetupServerApi
afterEach(() => server?.close())

const listen = (...handlers: HttpHandler[]): void => {
  server = setupServer(...handlers)
  server.listen()
}

const serve = (config: Omit<RpcConfig, 'url'> = {}): Endpoint => {
  const endpoint = makeEndpoint({ url: RPC_URL, head: HEAD, ...config })
  listen(endpoint.handler)
  return endpoint
}

const makeReader = (oracles: string[] = [ORACLE], rpcUrls: string[] = [RPC_URL]): SafenetReader =>
  new SafenetReader({
    rpcUrls,
    chainId: SAFENET_DEPLOYMENT.chainId,
    consensus: SAFENET_DEPLOYMENT.consensus,
    coordinator: SAFENET_DEPLOYMENT.coordinator,
    oracles,
  })

const read = (reader: SafenetReader, over: Partial<FetchCheckStateOptions> = {}): Promise<CheckReadResult> =>
  reader.fetchCheckState(SAFE_TX_HASH, { target: TARGET, ...over })

const rejection = async (promise: Promise<unknown>): Promise<Error> => {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected the read to fail')
}

const required = <T>(value: T | null | undefined, what: string): T => {
  if (value == null) throw new Error(`fixture is missing ${what}`)
  return value
}

const txHash = (block: number, logIndex: number): string =>
  `0x${block.toString(16).padStart(60, '0')}${logIndex.toString(16).padStart(4, '0')}`

const meta = (block: number, logIndex = 1) => ({
  blockNumber: block,
  logIndex,
  transactionHash: txHash(block, logIndex),
})

const hexBlock = (block: number): string => `0x${block.toString(16)}`

const idOf = (epoch: bigint, oracle: string = ORACLE): Hex =>
  transactionProposalHash({
    chainId: SAFENET_DEPLOYMENT.chainId,
    consensus: SAFENET_DEPLOYMENT.consensus,
    epoch: epoch.toString(),
    oracle,
    oracleDataHash: EMPTY_ORACLE_DATA_HASH as Hex,
    safeTxHash: SAFE_TX_HASH,
  })

type Where = { chainId?: bigint; safe?: string; oracle?: string; logIndex?: number }

const proposalLog = (epoch: bigint, block: number, over: Where = {}): RawLog =>
  buildOracleProposedLog(
    {
      safeTxHash: SAFE_TX_HASH,
      chainId: over.chainId ?? 1n,
      safe: over.safe ?? SAFE,
      epoch,
      oracle: over.oracle ?? ORACLE,
    },
    meta(block, over.logIndex),
  )

const attestedLog = (epoch: bigint, block: number): RawLog =>
  buildOracleAttestedLog(
    {
      safeTxHash: SAFE_TX_HASH,
      chainId: 1n,
      safe: SAFE,
      epoch,
      oracle: ORACLE,
      oracleDataHash: EMPTY_ORACLE_DATA_HASH,
      signatureId: SIGNATURE_ID,
      r: { x: 11n, y: 12n },
      z: 13n,
    },
    meta(block),
  )

const commitLog = (requestId: Hex, sentinel: string, block: number): RawLog =>
  buildCommittedLog({ requestId, sentinel, bondAmount: 5_000n }, meta(block))

const revealLog = (
  spec: { requestId: Hex; sentinel: string; approved: boolean; bondAmount?: bigint; reason?: string },
  block: number,
): RawLog => buildRevealedLog(spec, meta(block, 2))

const refFor = (epoch: bigint, block: number | null = null): RequestRef => ({
  requestId: idOf(epoch),
  epoch: epoch.toString(),
  oracle: ORACLE,
  oracleDataHash: EMPTY_ORACLE_DATA_HASH as Hex,
  chainId: HOME,
  safe: getAddress(SAFE),
  proposedAt: block === null ? null : meta(block),
})

const fanOut = (firstEpoch: number, count: number, over: Where = {}): { logs: RawLog[]; ids: Hex[] } => {
  const epochs = Array.from({ length: count }, (_, index) => BigInt(firstEpoch + index))
  return {
    logs: epochs.map((epoch) => proposalLog(epoch, BASE + 1_000 + Number(epoch), over)),
    ids: epochs.map((epoch) => idOf(epoch, over.oracle)),
  }
}

const requestsFor = (ids: Hex[], spec: RequestStateSpec): Record<string, RequestStateSpec> =>
  Object.fromEntries(ids.map((requestId) => [requestId, spec]))

const idsOfRead = (result: CheckReadResult): Hex[] => result.requests.map((request) => request.requestId)

const callsTo = (endpoint: Endpoint, calledSelector: string): EthCall[] =>
  endpoint.ethCalls.filter((call) => call.selector === calledSelector)

const oracleLogCalls = (endpoint: Endpoint): GetLogsFilter[] =>
  endpoint.getLogsCalls.filter((call) => call.address?.toLowerCase() !== CONSENSUS_ADDRESS)

const requestIdsFiltered = (call: GetLogsFilter): string[] => [call.topics[1]].flat() as string[]

const coveredRanges = (calls: GetLogsFilter[]): Array<[number, number]> =>
  [...calls]
    .sort((a, b) => a.fromBlock - b.fromBlock)
    .reduce<Array<[number, number]>>((merged, { fromBlock, toBlock }) => {
      const last = merged[merged.length - 1]
      if (last && fromBlock <= last[1] + 1) last[1] = Math.max(last[1], toBlock)
      else merged.push([fromBlock, toBlock])
      return merged
    }, [])

type OutcomeCase = [name: string, spec: RequestStateSpec, state: OracleRequestState, outcome: RequestOutcome]

const PAST_DEADLINES = { commitDeadline: BASE + 100, revealDeadline: BASE + 150 }

const OUTCOME_CASES: OutcomeCase[] = [
  ['an open request', { state: 1, commitDeadline: HEAD + 50, revealDeadline: HEAD + 100 }, 'PENDING', 'PENDING'],
  [
    'a frozen split far past both deadlines and its arbitration deadline',
    { state: 2, ...PAST_DEADLINES, arbitrationDeadline: BASE + 500, ...SPLIT },
    'FROZEN',
    'DISPUTED',
  ],
  ['a frozen request with no revealed votes', { state: 2, ...PAST_DEADLINES }, 'FROZEN', 'DISPUTED'],
  ['a unanimous approval', APPROVED, 'RESOLVED_APPROVED', 'APPROVED'],
  ['an approval with a dissenting vote', { state: 3, ...CONTESTED }, 'RESOLVED_APPROVED', 'RULED_SECURE'],
  ['a unanimous denial', { state: 4, committed: 2, revealed: 2, deny: 2 }, 'RESOLVED_DENIED', 'DENIED'],
  ['a denial with a dissenting vote', { state: 4, ...CONTESTED }, 'RESOLVED_DENIED', 'RULED_INSECURE'],
  ['a timeout with one side silent', { state: 5, ...TIMEOUT }, 'TIMED_OUT', 'TIMED_OUT'],
  ['a timeout with no reveals', { state: 5, committed: 1 }, 'TIMED_OUT', 'TIMED_OUT'],
  ['a timeout with both sides revealed', { state: 5, ...SPLIT }, 'TIMED_OUT', 'NO_RULING'],
]

describe('fetchCheckState: authoritative request state', () => {
  it.each(OUTCOME_CASES)('maps %s to its state and outcome', async (_name, spec, state, outcome) => {
    const requestId = idOf(1n)
    serve({ logs: [proposalLog(1n, BASE + 1_000)], requests: { [requestId]: spec } })

    const { requests } = await read(makeReader())

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ requestId, state, outcome })
  })

  it('reports deadlines as decimal strings, counts as numbers and an absent arbitration deadline as null', async () => {
    const spec: RequestStateSpec = {
      state: 3,
      commitDeadline: BASE + 2_000,
      revealDeadline: BASE + 2_100,
      committed: 3,
      revealed: 3,
      approve: 3,
    }
    serve({ logs: [proposalLog(1n, BASE + 1_000)], requests: { [idOf(1n)]: spec } })

    const [request] = (await read(makeReader())).requests

    expect(request).toMatchObject({
      commitDeadlineBlock: String(BASE + 2_000),
      revealDeadlineBlock: String(BASE + 2_100),
      arbitrationDeadlineBlock: null,
      committedCount: 3,
      revealedCount: 3,
      approveCount: 3,
      denyCount: 0,
    })
  })

  it('reports an opened arbitration deadline as a decimal string', async () => {
    const spec: RequestStateSpec = { state: 2, arbitrationDeadline: BASE + 9_000, ...SPLIT }
    serve({ logs: [proposalLog(1n, BASE + 1_000)], requests: { [idOf(1n)]: spec } })

    const [request] = (await read(makeReader())).requests

    expect(request.arbitrationDeadlineBlock).toBe(String(BASE + 9_000))
  })

  it.each([0, 9])('fails the poll on state ordinal %i instead of reading an empty request', async (state) => {
    serve({ logs: [proposalLog(1n, BASE + 1_000)], requests: { [idOf(1n)]: { state } } })

    await expect(read(makeReader())).rejects.toThrow('unknown request state')
  })

  it('pins every getRequest to the head the read started from', async () => {
    const { logs, ids } = fanOut(1, 3)
    const endpoint = serve({ logs, requests: requestsFor(ids, OPEN) })

    const result = await read(makeReader())

    expect(result.headBlock).toBe(String(HEAD))
    const tags = callsTo(endpoint, GET_REQUEST).map((call) => call.blockTag)
    expect(tags).toEqual([hexBlock(HEAD), hexBlock(HEAD), hexBlock(HEAD)])
  })
})

type Capture = {
  label: string
  safeTxHash: Hex
  homeChainId: string
  safe: string
  epoch: string
  requestId: Hex
  oracleDataHash: Hex
  proposal: { blockNumber: number; logIndex: number; transactionHash: string }
  attestation: {
    signatureId: Hex
    r: { x: string; y: string }
    z: string
    blockNumber: number
    logIndex: number
  } | null
  groupKey: { x: string; y: string } | null
  logs: RawLog[]
  requestState: { blockNumber: number; rawResult: string }
  expected: {
    state: OracleRequestState
    outcome: RequestOutcome
    committedCount: number
    revealedCount: number
    approveCount: number
    denyCount: number
  }
}

const { captures }: { captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const capture = (label: string): Capture =>
  required(
    captures.find((c) => c.label === label),
    `capture ${label}`,
  )

const readCapture = async (c: Capture): Promise<{ endpoint: Endpoint; result: CheckReadResult }> => {
  const endpoint = serve({
    head: c.requestState.blockNumber,
    logs: c.logs,
    requests: { [c.requestId]: { raw: c.requestState.rawResult } },
  })
  const target = { chainId: c.homeChainId, safeAddress: c.safe }
  const result = await makeReader(PINNED_ORACLES).fetchCheckState(c.safeTxHash, { target })
  return { endpoint, result }
}

const txAt = (c: Capture, [blockNumber, logIndex]: [number, number]): string => {
  const log = c.logs.find((entry) => entry.blockNumber === blockNumber && entry.logIndex === logIndex)
  return required(log, `a log at ${blockNumber}#${logIndex} in ${c.label}`).transactionHash
}

type VoteRow = {
  sentinel: string
  approved: boolean
  reason: string
  commit: [number, number]
  reveal: [number, number]
}

const SENTINEL_0637 = '0x0637ccF4B63Df46265CF4afCd7b0c9d06B98c3ca'
const SENTINEL_6D08 = '0x6D081448c04d9ef7cf8EcF54207B1931ecc25312'
const SENTINEL_C84A = '0xc84a0928632382E75c543ACCeD101B9525027362'
const CAPTURE_BOND = '800000000000000000000'

const CAPTURE_VOTES: Record<string, VoteRow[]> = {
  'approved-first': [
    { sentinel: SENTINEL_6D08, approved: true, reason: '', commit: [48597462, 25], reveal: [48597469, 77] },
    { sentinel: SENTINEL_C84A, approved: true, reason: '', commit: [48597462, 22], reveal: [48597469, 76] },
  ],
  'approved-second': [
    { sentinel: SENTINEL_0637, approved: true, reason: '', commit: [48597510, 128], reveal: [48597517, 54] },
    { sentinel: SENTINEL_C84A, approved: true, reason: '', commit: [48597510, 126], reveal: [48597518, 49] },
  ],
  'disputed-split': [
    { sentinel: SENTINEL_6D08, approved: false, reason: 'R-4.6', commit: [48593345, 130], reveal: [48593352, 62] },
    { sentinel: SENTINEL_C84A, approved: true, reason: '', commit: [48593345, 122], reveal: [48593352, 61] },
  ],
  'disputed-three-revealed': [
    { sentinel: SENTINEL_0637, approved: true, reason: '', commit: [48593380, 107], reveal: [48593386, 90] },
    { sentinel: SENTINEL_6D08, approved: false, reason: 'R-4.6', commit: [48593380, 112], reveal: [48593386, 89] },
    { sentinel: SENTINEL_C84A, approved: true, reason: '', commit: [48593380, 103], reveal: [48593386, 88] },
  ],
}

const ARBITRATION_DEADLINES: Record<string, string> = {
  'disputed-split': '48643753',
  'disputed-three-revealed': '48643787',
}

const CAPTURE_LABELS = captures.map((c) => c.label)

describe('fetchCheckState: captured Gnosis getter bytes and logs', () => {
  it.each(CAPTURE_LABELS)('%s: state, outcome and counts equal the capture, with complete evidence', async (label) => {
    const c = capture(label)
    const { state, outcome, committedCount, revealedCount, approveCount, denyCount } = c.expected

    const { result } = await readCapture(c)

    expect(result.headBlock).toBe(String(c.requestState.blockNumber))
    expect(result.requests).toHaveLength(1)
    expect(result.requests[0]).toMatchObject({
      requestId: c.requestId,
      chainId: c.homeChainId,
      state,
      outcome,
      committedCount,
      revealedCount,
      approveCount,
      denyCount,
    })
    expect(result.requests[0].evidenceComplete).toBe(true)
    expect(result.evidenceComplete).toBe(true)
  })

  it.each(CAPTURE_LABELS)('%s: leaves the Oracle’s mutable settlement pot out of the read request', async (label) => {
    const c = capture(label)
    const [{ progress }] = oracleReadInterface.decodeFunctionResult('getRequest', c.requestState.rawResult)
    const pot: bigint = progress.fee
    expect(pot).toBeGreaterThan(0n)

    const { result } = await readCapture(c)

    const [request] = result.requests
    expect(request).not.toHaveProperty('fee')
    expect(JSON.stringify(request)).not.toContain(pot.toString())
  })

  it.each(CAPTURE_LABELS)('%s: votes come from the Oracle logs, sorted by sentinel', async (label) => {
    const c = capture(label)
    const expected = required(CAPTURE_VOTES[label], `votes for ${label}`).map(
      (row): SentinelVote => ({
        sentinel: row.sentinel,
        approved: row.approved,
        reason: row.reason,
        bondAmount: CAPTURE_BOND,
        commitTxHash: txAt(c, row.commit),
        revealTxHash: txAt(c, row.reveal),
      }),
    )

    const { result } = await readCapture(c)

    expect(result.requests[0].votes).toEqual(expected)
  })

  it('gives all three revealed sentinels of the three-vote dispute a verdict', async () => {
    const { result } = await readCapture(capture('disputed-three-revealed'))

    const [{ votes, approveCount, denyCount }] = result.requests
    expect(votes).toHaveLength(3)
    expect(votes.every((vote) => vote.approved !== null)).toBe(true)
    expect(votes.filter((vote) => vote.approved === true)).toHaveLength(approveCount)
    expect(votes.filter((vote) => vote.approved === false)).toHaveLength(denyCount)
  })

  it.each(['disputed-split', 'disputed-three-revealed'])(
    '%s: stays DISPUTED with its reveal deadline behind the head',
    async (label) => {
      const { result, endpoint } = await readCapture(capture(label))

      const [request] = result.requests
      expect(Number(request.revealDeadlineBlock)).toBeLessThan(Number(result.headBlock))
      expect(request).toMatchObject({
        state: 'FROZEN',
        outcome: 'DISPUTED',
        arbitrationDeadlineBlock: ARBITRATION_DEADLINES[label],
        resolution: null,
      })
      expect(result.candidates).toEqual([])
      expect(callsTo(endpoint, GET_SIGNATURE_ID)).toHaveLength(0)
    },
  )

  it.each(['approved-first', 'approved-second'])(
    '%s: the attested log is the candidate and no getter runs',
    async (label) => {
      const c = capture(label)
      const attestation = required(c.attestation, `attestation of ${label}`)

      const { result, endpoint } = await readCapture(c)

      expect(result.candidates).toHaveLength(1)
      expect(result.candidates[0]).toMatchObject({
        requestId: c.requestId,
        event: {
          type: CheckEventType.ORACLE_ATTESTED,
          blockNumber: attestation.blockNumber,
          logIndex: attestation.logIndex,
        },
        input: {
          epoch: c.epoch,
          signatureId: attestation.signatureId,
          attestation: { r: attestation.r, z: attestation.z },
        },
      })
      expect(callsTo(endpoint, GET_SIGNATURE_ID)).toHaveLength(0)
      expect(callsTo(endpoint, GET_ATTESTATION)).toHaveLength(0)
    },
  )
})

describe('fetchCheckState: votes from the Oracle logs', () => {
  it('builds one row per sentinel, sorted by address, with the reveal bond superseding the commit bond', async () => {
    const requestId = idOf(1n)
    const logs = [
      proposalLog(1n, HEAD - 5_000),
      commitLog(requestId, S3, HEAD - 4_900),
      commitLog(requestId, S1, HEAD - 4_800),
      commitLog(requestId, S2, HEAD - 4_700),
      revealLog(
        { requestId, sentinel: S2, approved: false, bondAmount: 7_000n, reason: 'unsafe delegatecall' },
        HEAD - 4_600,
      ),
    ]
    serve({ logs, requests: { [requestId]: { state: 1, committed: 3, revealed: 1, deny: 1 } } })

    const [request] = (await read(makeReader())).requests

    expect(request.votes).toEqual([
      {
        sentinel: S1,
        approved: null,
        reason: null,
        bondAmount: '5000',
        commitTxHash: txHash(HEAD - 4_800, 1),
        revealTxHash: null,
      },
      {
        sentinel: S2,
        approved: false,
        reason: 'unsafe delegatecall',
        bondAmount: '7000',
        commitTxHash: txHash(HEAD - 4_700, 1),
        revealTxHash: txHash(HEAD - 4_600, 2),
      },
      {
        sentinel: S3,
        approved: null,
        reason: null,
        bondAmount: '5000',
        commitTxHash: txHash(HEAD - 4_900, 1),
        revealTxHash: null,
      },
    ])
  })

  it('sorts the rows by lowercase sentinel address, whatever the checksum casing', async () => {
    const requestId = idOf(1n)
    const logs = [
      proposalLog(1n, HEAD - 5_000),
      commitLog(requestId, SENTINEL_UPPER_B, HEAD - 4_900),
      commitLog(requestId, SENTINEL_LOWER_A, HEAD - 4_800),
    ]
    serve({ logs, requests: { [requestId]: { state: 1, committed: 2 } } })

    const [request] = (await read(makeReader())).requests

    expect(request.votes.map((vote) => vote.sentinel)).toEqual([SENTINEL_LOWER_A, SENTINEL_UPPER_B])
  })

  it('keeps the logs of one request out of the votes of another', async () => {
    const [first, second] = [idOf(1n), idOf(2n)]
    const logs = [
      proposalLog(1n, HEAD - 5_000),
      proposalLog(2n, HEAD - 4_000),
      commitLog(first, S1, HEAD - 4_900),
      commitLog(second, S2, HEAD - 3_900),
    ]
    serve({ logs, requests: requestsFor([first, second], { state: 1, committed: 1 }) })

    const { requests } = await read(makeReader())

    const sentinels = requests.map((request) => [request.requestId, request.votes.map((vote) => vote.sentinel)])
    expect(sentinels).toEqual([
      [first, [S1]],
      [second, [S2]],
    ])
  })
})

type Resolved = Pick<RequestRead, 'resolution' | 'resolutionContext' | 'resolutionTxHash'>
type ResolutionCase = [name: string, spec: RequestStateSpec, logs: (requestId: Hex) => RawLog[], expected: Resolved]

const RULING_META = meta(BASE + 1_050, 3)
const RULING_TX = RULING_META.transactionHash
const NO_RESOLUTION: Resolved = { resolution: null, resolutionContext: null, resolutionTxHash: null }

const RESOLUTION_CASES: ResolutionCase[] = [
  [
    'a council ruling with its context verbatim',
    { state: 3, ...CONTESTED },
    (requestId) => [buildDisputeResolvedLog({ requestId, context: 'insecure: drains the Safe' }, RULING_META)],
    { resolution: 'COUNCIL', resolutionContext: 'insecure: drains the Safe', resolutionTxHash: RULING_TX },
  ],
  [
    'a council ruling with an empty context',
    { state: 4, ...CONTESTED },
    (requestId) => [buildDisputeResolvedLog({ requestId, context: '' }, RULING_META)],
    { resolution: 'COUNCIL', resolutionContext: '', resolutionTxHash: RULING_TX },
  ],
  [
    'a ruled request whose ruling log is not in the evidence',
    { state: 4, ...CONTESTED },
    () => [],
    { resolution: 'COUNCIL', resolutionContext: null, resolutionTxHash: null },
  ],
  [
    'an out-of-scope dispute',
    { state: 5, ...SPLIT },
    (requestId) => [buildDisputeOutOfScopeLog({ requestId, context: 'not a security question' }, RULING_META)],
    { resolution: 'OUT_OF_SCOPE', resolutionContext: 'not a security question', resolutionTxHash: RULING_TX },
  ],
  [
    'an arbitration timeout',
    { state: 5, ...SPLIT },
    (requestId) => [buildArbitrationTimedOutLog({ requestId }, RULING_META)],
    { resolution: 'ARBITRATION_TIMEOUT', resolutionContext: null, resolutionTxHash: RULING_TX },
  ],
  ['a no-ruling outcome with neither log', { state: 5, ...SPLIT }, () => [], NO_RESOLUTION],
  [
    'an ordinary request timeout',
    { state: 5, ...TIMEOUT },
    (requestId) => [buildRequestTimedOutLog({ requestId }, RULING_META)],
    { resolution: 'REQUEST_TIMEOUT', resolutionContext: null, resolutionTxHash: RULING_TX },
  ],
  [
    'an ordinary request timeout whose log is not in the evidence',
    { state: 5, ...TIMEOUT },
    () => [],
    { resolution: 'REQUEST_TIMEOUT', resolutionContext: null, resolutionTxHash: null },
  ],
  [
    'an open dispute',
    { state: 2, ...SPLIT },
    (requestId) => [buildDisputeTriggeredLog({ requestId, deadline: BigInt(HEAD + 9_000) }, RULING_META)],
    NO_RESOLUTION,
  ],
  ['a pending request', OPEN, () => [], NO_RESOLUTION],
  ['a unanimous approval', APPROVED, () => [], NO_RESOLUTION],
]

describe('fetchCheckState: resolution metadata', () => {
  it.each(RESOLUTION_CASES)('derives the resolution of %s', async (_name, spec, logsFor, expected) => {
    const requestId = idOf(1n)
    serve({ logs: [proposalLog(1n, BASE + 1_000), ...logsFor(requestId)], requests: { [requestId]: spec } })

    const [request] = (await read(makeReader())).requests

    expect(request).toMatchObject(expected)
  })
})

describe('fetchCheckState: binding requests to the target Safe', () => {
  it.each([
    ['another Safe', { safe: OTHER_SAFE }],
    ['another home chain', { chainId: 10n }],
  ])('keeps the target request when %s proposes the same request id earlier', async (_name, foreign: Where) => {
    const requestId = idOf(1n)
    const logs = [proposalLog(1n, BASE + 900, foreign), proposalLog(1n, BASE + 1_000)]
    const endpoint = serve({ logs, requests: { [requestId]: OPEN } })

    const result = await read(makeReader())

    expect(result.requests).toHaveLength(1)
    expect(result.requests[0]).toMatchObject({
      requestId,
      chainId: HOME,
      safe: getAddress(SAFE),
      proposedAt: { blockNumber: BASE + 1_000 },
    })
    expect(result.events.map((event) => event.blockNumber)).toEqual([BASE + 1_000])
    expect(Math.min(...oracleLogCalls(endpoint).map((call) => call.fromBlock))).toBe(BASE + 1_000)
  })

  it('reads only the target’s requests when two Safes propose the same safeTxHash', async () => {
    const [mine, theirs] = [idOf(1n), idOf(2n)]
    const logs = [proposalLog(2n, BASE + 900, { safe: OTHER_SAFE }), proposalLog(1n, BASE + 1_000)]
    const endpoint = serve({ logs, requests: requestsFor([mine, theirs], OPEN) })

    const result = await read(makeReader())

    expect(idsOfRead(result)).toEqual([mine])
    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(1)
    const filters = oracleLogCalls(endpoint).map((call) => requestIdsFiltered(call))
    expect(filters.length).toBeGreaterThan(0)
    for (const filter of filters) expect(filter).toEqual([mine])
  })

  it.each([
    ['lowercase', SAFE],
    ['checksummed', getAddress(SAFE)],
    ['uppercase', `0x${SAFE.slice(2).toUpperCase()}`],
  ])('matches the target Safe regardless of address case (%s)', async (_name, safeAddress) => {
    const requestId = idOf(1n)
    const logs = [proposalLog(1n, BASE + 1_000), attestedLog(1n, BASE + 1_020)]
    serve({ logs, requests: { [requestId]: APPROVED } })

    const result = await read(makeReader(), { target: { chainId: HOME, safeAddress } })

    expect(idsOfRead(result)).toEqual([requestId])
    expect(result.events.map((event) => event.type)).toEqual([
      CheckEventType.ORACLE_PROPOSED,
      CheckEventType.ORACLE_ATTESTED,
    ])
    expect(result.candidates).toHaveLength(1)
  })
})

describe('fetchCheckState: the per-Oracle request cap', () => {
  it('counts only target-bound requests: 16 foreign-Safe requests do not crowd out the target’s one', async () => {
    const foreign = fanOut(100, 16, { safe: OTHER_SAFE })
    const requestId = idOf(1n)
    const logs = [...foreign.logs, proposalLog(1n, BASE + 2_000)]
    const endpoint = serve({ logs, requests: { [requestId]: OPEN } })

    const result = await read(makeReader())

    expect(idsOfRead(result)).toEqual([requestId])
    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(1)
  })

  it('accepts exactly 16 target requests for one Oracle and returns every one of them', async () => {
    const { logs, ids } = fanOut(1, 16)
    const endpoint = serve({ logs, requests: requestsFor(ids, OPEN) })

    const result = await read(makeReader())

    expect([...idsOfRead(result)].sort()).toEqual([...ids].sort())
    const filters = oracleLogCalls(endpoint).map((call) => requestIdsFiltered(call).sort())
    expect(filters.length).toBeGreaterThan(0)
    for (const filter of filters) expect(filter).toEqual([...ids].sort())
  })

  it('fails on 17 target requests for one Oracle without truncating or reading any of them', async () => {
    const { logs, ids } = fanOut(1, 17)
    const endpoint = serve({ logs, requests: requestsFor(ids, OPEN) })

    await expect(read(makeReader())).rejects.toThrow(
      new Error('Safenet reader: too many requests for this transaction'),
    )

    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(0)
  })

  it('applies the cap per Oracle: 16 requests on each of two allowlisted Oracles are accepted', async () => {
    const mine = fanOut(1, 16)
    const other = fanOut(50, 16, { oracle: OTHER_ORACLE })
    serve({
      logs: [...mine.logs, ...other.logs],
      requests: { ...requestsFor(mine.ids, OPEN), ...requestsFor(other.ids, OPEN) },
    })

    const result = await read(makeReader([ORACLE, OTHER_ORACLE]))

    expect(result.requests).toHaveLength(32)
  })

  it('never counts requests of a non-allowlisted Oracle toward the cap', async () => {
    const allowed = fanOut(1, 16)
    const stranger = fanOut(50, 17, { oracle: OTHER_ORACLE })
    const endpoint = serve({ logs: [...allowed.logs, ...stranger.logs], requests: requestsFor(allowed.ids, OPEN) })

    const result = await read(makeReader())

    expect([...idsOfRead(result)].sort()).toEqual([...allowed.ids].sort())
    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(16)
  })
})

describe('fetchCheckState: carried requests', () => {
  it('refreshes a carried request at the head when its logs are outside every window', async () => {
    const requestId = idOf(1n)
    const farHead = BASE + 200_000
    const rpc: RpcConfig = {
      url: RPC_URL,
      head: HEAD,
      logs: [proposalLog(1n, BASE + 1_000)],
      requests: { [requestId]: OPEN },
    }
    const endpoint = makeEndpoint(rpc)
    listen(endpoint.handler)
    const first = await read(makeReader())
    rpc.head = farHead
    rpc.requests = { [requestId]: APPROVED }

    const second = await read(makeReader(), { knownRequests: first.requests, minimumBlock: Number(first.headBlock) })

    expect(first.requests[0].proposedAt).not.toBeNull()
    expect(second.headBlock).toBe(String(farHead))
    expect(second.requests).toHaveLength(1)
    expect(second.requests[0]).toMatchObject({
      requestId,
      state: 'RESOLVED_APPROVED',
      outcome: 'APPROVED',
      proposedAt: first.requests[0].proposedAt,
    })
    expect(callsTo(endpoint, GET_REQUEST).pop()?.blockTag).toBe(hexBlock(farHead))
  })

  it.each([
    ['another Safe', { ...refFor(2n, BASE + 900), safe: getAddress(OTHER_SAFE) }],
    ['another home chain', { ...refFor(2n, BASE + 900), chainId: '10' }],
    [
      'a non-allowlisted Oracle',
      { ...refFor(2n, BASE + 900), oracle: OTHER_ORACLE, requestId: idOf(2n, OTHER_ORACLE) },
    ],
  ])('ignores a carried reference bound to %s', async (_name, foreign) => {
    const requestId = idOf(1n)
    const endpoint = serve({ logs: [proposalLog(1n, BASE + 1_000)], requests: { [requestId]: OPEN } })

    const result = await read(makeReader(), { knownRequests: [foreign] })

    expect(idsOfRead(result)).toEqual([requestId])
    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(1)
  })

  it.each([
    ['a request id that is not its own', { ...refFor(2n, BASE + 900), requestId: idOf(3n) }],
    ['a tampered oracleDataHash', { ...refFor(2n, BASE + 900), oracleDataHash: `0x${'11'.repeat(32)}` as Hex }],
  ])('fails the read on a carried reference with %s', async (_name, invalid) => {
    serve({ logs: [], requests: {} })

    await expect(read(makeReader(), { knownRequests: [invalid] })).rejects.toThrow(
      new Error('Safenet reader: invalid known request reference'),
    )
  })
})

describe('fetchCheckState: proposal positions across polls', () => {
  it('keeps the carried proposal position when the attestation becomes visible later', async () => {
    const requestId = idOf(1n)
    const rpc: RpcConfig = {
      url: RPC_URL,
      head: HEAD,
      logs: [proposalLog(1n, BASE + 1_000)],
      requests: { [requestId]: OPEN },
    }
    listen(makeEndpoint(rpc).handler)
    const first = await read(makeReader())
    rpc.head = FAR_HEAD
    rpc.logs = [proposalLog(1n, BASE + 1_000), attestedLog(1n, FAR_HEAD - 100)]
    rpc.requests = { [requestId]: APPROVED }

    const second = await read(makeReader(), { knownRequests: first.requests })

    expect(first.requests[0].proposedAt).not.toBeNull()
    expect(second.requests[0].proposedAt).toEqual(first.requests[0].proposedAt)
    expect(second.candidates[0].event).toMatchObject({
      type: CheckEventType.ORACLE_ATTESTED,
      blockNumber: FAR_HEAD - 100,
    })
    expect(second.events.some((event) => event.type === CheckEventType.ORACLE_PROPOSED)).toBe(false)
  })

  it('reports an attested-only request with no proposal position and never synthesizes the proposal', async () => {
    const requestId = idOf(1n)
    serve({ logs: [attestedLog(1n, BASE + 1_020)], requests: { [requestId]: APPROVED } })

    const result = await read(makeReader())

    expect(result.requests).toHaveLength(1)
    expect(result.requests[0].proposedAt).toBeNull()
    expect(result.events.map((event) => event.type)).toEqual([CheckEventType.ORACLE_ATTESTED])
  })
})

describe('fetchCheckState: RequestNotFound semantics', () => {
  const missing = (epoch: bigint): string => `Safenet reader: request ${idOf(epoch)} is missing from the Oracle`

  it.each([undefined, HEAD - 1])(
    'fails the poll when a discovered request reverts RequestNotFound (minimumBlock %s)',
    async (minimumBlock) => {
      serve({ logs: [proposalLog(1n, BASE + 1_000)], requests: { [idOf(1n)]: 'not-found' } })

      await expect(read(makeReader(), { minimumBlock })).rejects.toThrow(missing(1n))
    },
  )

  it('drops a carried-only request that reverts RequestNotFound when the previous head is known', async () => {
    const live = idOf(2n)
    const endpoint = serve({ logs: [proposalLog(2n, BASE + 1_000)], requests: { [live]: OPEN } })

    const result = await read(makeReader(), { knownRequests: [refFor(1n, BASE + 900)], minimumBlock: HEAD - 10 })

    expect(idsOfRead(result)).toEqual([live])
    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(2)
  })

  it('fails the poll for the same carried-only revert without a previous head', async () => {
    serve({ logs: [proposalLog(2n, BASE + 1_000)], requests: { [idOf(2n)]: OPEN } })

    await expect(read(makeReader(), { knownRequests: [refFor(1n, BASE + 900)] })).rejects.toThrow(missing(1n))
  })

  const GENERIC_FAILURES: Array<[name: string, rpc: Omit<RpcConfig, 'url'>]> = [
    ['fails without revert data', { failRequests: true }],
    ['reverts with an unrelated error', { requests: { [idOf(1n)]: { revert: '0xb704eaea' } } }],
  ]

  it.each(GENERIC_FAILURES)(
    'fails the poll, keeping the carried request, when its getRequest %s',
    async (_name, rpc) => {
      serve({ head: BASE + 200_000, logs: [proposalLog(1n, BASE + 1_000)], ...rpc })

      const failure = await rejection(
        read(makeReader(), { knownRequests: [refFor(1n, BASE + 1_000)], minimumBlock: HEAD - 10 }),
      )

      expect(failure.message).not.toContain('is missing from the Oracle')
    },
  )
})

describe('fetchCheckState: lagging endpoints and reorgs', () => {
  const reorgingHash = (_number: number, probe: number): string => `0x${(probe === 0 ? 'aa' : 'bb').repeat(32)}`
  const hashChangesAfterLogs = (endpoint: Endpoint): string =>
    `0x${(endpoint.getLogsCalls.length === 0 ? 'aa' : 'bb').repeat(32)}`
  // A submission past the head makes the read fetch the head's numbered header first, which ethers then caches.
  const SUBMITTED_AT_HEAD_MS = (1_000_000 + 300) * 1000

  it('rejects a head below the previous read and accepts one equal to it', async () => {
    serve({ logs: [], requests: {} })

    await expect(read(makeReader(), { minimumBlock: HEAD + 1 })).rejects.toThrow(
      new Error('Safenet reader: endpoint is behind the previous read'),
    )
    const result = await read(makeReader(), { minimumBlock: HEAD })

    expect(result.headBlock).toBe(String(HEAD))
  })

  it('fails the whole read when the head hash changes after an earlier probe cached the head header', async () => {
    const endpoint: Endpoint = serve({ logs: [], blockHash: () => hashChangesAfterLogs(endpoint) })

    await expect(read(makeReader(), { timestampMs: SUBMITTED_AT_HEAD_MS })).rejects.toThrow(
      new Error('Safenet reader: chain head changed during the read'),
    )
  })

  it('serves a coherent read from the next endpoint after one that reorged mid-read', async () => {
    const unstable = makeEndpoint({ url: 'http://rpc.test/unstable', head: HEAD, blockHash: reorgingHash })
    const stable = makeEndpoint({ url: 'http://rpc.test/stable', head: HEAD + 3 })
    listen(unstable.handler, stable.handler)

    const result = await read(makeReader([ORACLE], ['http://rpc.test/unstable', 'http://rpc.test/stable']))

    expect(result.headBlock).toBe(String(HEAD + 3))
    expect(stable.getLogsCalls.length).toBeGreaterThan(0)
  })
})

describe('fetchCheckState: attestation candidates from logs', () => {
  it('takes an attested log in the window as the candidate, copying its input and calling no getter', async () => {
    const requestId = idOf(1n)
    const logs = [proposalLog(1n, BASE + 1_000), attestedLog(1n, BASE + 1_020)]
    const endpoint = serve({ logs, requests: { [requestId]: APPROVED } })

    const { candidates } = await read(makeReader())

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      requestId,
      event: { type: CheckEventType.ORACLE_ATTESTED, blockNumber: BASE + 1_020, signatureId: SIGNATURE_ID },
      input: {
        epoch: '1',
        oracle: ORACLE,
        oracleDataHash: EMPTY_ORACLE_DATA_HASH,
        safeTxHash: SAFE_TX_HASH,
        signatureId: SIGNATURE_ID,
        attestation: { r: { x: '11', y: '12' }, z: '13' },
      },
    })
    expect(callsTo(endpoint, GET_SIGNATURE_ID)).toHaveLength(0)
    expect(callsTo(endpoint, GET_ATTESTATION)).toHaveLength(0)
  })

  it.each([
    ['a pending request', OPEN],
    ['a frozen dispute', { state: 2, ...SPLIT }],
    ['a ruled-secure request', { state: 3, ...CONTESTED }],
    ['a denied request', { state: 4, committed: 2, revealed: 2, deny: 2 }],
    ['a ruled-insecure request', { state: 4, ...CONTESTED }],
    ['a timed-out request', { state: 5, ...TIMEOUT }],
    ['a no-ruling request', { state: 5, ...SPLIT }],
  ])('runs no attestation getter for %s', async (_name, spec: RequestStateSpec) => {
    const endpoint = serve({ logs: [proposalLog(1n, BASE + 1_000)], requests: { [idOf(1n)]: spec } })

    const result = await read(makeReader())

    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(1)
    expect(result.candidates).toEqual([])
    expect(callsTo(endpoint, GET_SIGNATURE_ID)).toHaveLength(0)
    expect(callsTo(endpoint, GET_ATTESTATION)).toHaveLength(0)
  })
})

describe('fetchCheckState: attestation candidates from the Consensus getters', () => {
  const approved = capture('approved-first')
  const attestation = required(approved.attestation, 'attestation of approved-first')
  const lateHead = attestation.blockNumber + MAX_LOOKBACK_BLOCKS + 100
  const target = { chainId: approved.homeChainId, safeAddress: approved.safe }
  const carried: RequestRef = {
    requestId: approved.requestId,
    epoch: approved.epoch,
    oracle: getAddress(PINNED_ORACLES[0]),
    oracleDataHash: approved.oracleDataHash,
    chainId: approved.homeChainId,
    safe: approved.safe,
    proposedAt: approved.proposal,
  }

  const serveLate = (over: Omit<RpcConfig, 'url'> = {}): Endpoint =>
    serve({
      head: lateHead,
      logs: approved.logs,
      requests: { [approved.requestId]: { raw: approved.requestState.rawResult } },
      signatureIds: { [approved.requestId]: attestation.signatureId },
      attestation: { r: attestation.r, z: attestation.z },
      groupKey: required(approved.groupKey, 'group key of approved-first'),
      ...over,
    })

  const readLate = (reader: SafenetReader): Promise<CheckReadResult> =>
    reader.fetchCheckState(approved.safeTxHash, {
      target,
      knownRequests: [carried],
      minimumBlock: approved.requestState.blockNumber,
    })

  it('derives one verifiable candidate from the getters when the attested log is outside the window', async () => {
    const endpoint = serveLate()
    const reader = makeReader(PINNED_ORACLES)

    const result = await readLate(reader)

    expect(result.requests[0].outcome).toBe('APPROVED')
    expect(result.events.some((event) => event.type === CheckEventType.ORACLE_ATTESTED)).toBe(false)
    expect(result.candidates).toHaveLength(1)
    const [candidate] = result.candidates
    expect(candidate.requestId).toBe(approved.requestId)
    expect(candidate.event).toBeNull()
    expect(candidate.input).toEqual({
      epoch: approved.epoch,
      oracle: carried.oracle,
      oracleDataHash: approved.oracleDataHash,
      safeTxHash: approved.safeTxHash,
      signatureId: attestation.signatureId,
      attestation: { r: attestation.r, z: attestation.z },
    })
    expect(callsTo(endpoint, GET_SIGNATURE_ID).map((call) => call.blockTag)).toEqual([hexBlock(lateHead)])
    expect(callsTo(endpoint, GET_ATTESTATION).map((call) => call.blockTag)).toEqual([hexBlock(lateHead)])
    await expect(reader.verifyAttestation(candidate.input)).resolves.toEqual({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: attestation.signatureId,
      message: approved.requestId,
    })
  })

  it('treats a zero signature id as no attestation and reads no signature', async () => {
    const endpoint = serveLate({ signatureIds: {} })

    const result = await readLate(makeReader(PINNED_ORACLES))

    expect(result.requests[0].outcome).toBe('APPROVED')
    expect(result.candidates).toEqual([])
    expect(callsTo(endpoint, GET_SIGNATURE_ID)).toHaveLength(1)
    expect(callsTo(endpoint, GET_ATTESTATION)).toHaveLength(0)
  })

  it('fails the poll when an attestation getter fails', async () => {
    serveLate({ failAttestationGetters: true })

    await expect(readLate(makeReader(PINNED_ORACLES))).rejects.toThrow()
  })
})

describe('fetchCheckState: Oracle evidence ranges', () => {
  it('scans an Oracle once for all of its requests, over the whole span when it fits the budget', async () => {
    const epochs = [1n, 2n, 3n]
    const blocks = [HEAD - 5_000, HEAD - 3_000, HEAD - 1_000]
    const ids = epochs.map((epoch) => idOf(epoch))
    const logs = [
      ...epochs.map((epoch, index) => proposalLog(epoch, blocks[index])),
      ...ids.flatMap((requestId, index) => [
        commitLog(requestId, S1, blocks[index] + 5),
        commitLog(requestId, S2, blocks[index] + 6),
      ]),
    ]
    const endpoint = serve({ logs, requests: requestsFor(ids, { state: 1, committed: 2 }) })

    await read(makeReader())

    const calls = oracleLogCalls(endpoint)
    expect(calls).toHaveLength(1)
    expect(calls[0].address?.toLowerCase()).toBe(ORACLE.toLowerCase())
    expect([calls[0].fromBlock, calls[0].toBlock]).toEqual([HEAD - 5_000, HEAD])
    expect(requestIdsFiltered(calls[0]).sort()).toEqual([...ids].sort())
  })

  it('scans each allowlisted Oracle once, with only its own requests and its own earliest proposal', async () => {
    const mine = [idOf(1n), idOf(2n)]
    const other = idOf(3n, OTHER_ORACLE)
    const logs = [
      proposalLog(1n, HEAD - 5_000),
      proposalLog(2n, HEAD - 4_000),
      proposalLog(3n, HEAD - 2_000, { oracle: OTHER_ORACLE }),
    ]
    const endpoint = serve({ logs, requests: { ...requestsFor(mine, OPEN), [other]: OPEN } })

    await read(makeReader([ORACLE, OTHER_ORACLE]))

    const calls = oracleLogCalls(endpoint)
    expect(calls).toHaveLength(2)
    const byOracle = Object.fromEntries(
      calls.map((call) => [
        call.address?.toLowerCase(),
        [call.fromBlock, call.toBlock, requestIdsFiltered(call).sort()],
      ]),
    )
    expect(byOracle).toEqual({
      [ORACLE.toLowerCase()]: [HEAD - 5_000, HEAD, [...mine].sort()],
      [OTHER_ORACLE.toLowerCase()]: [HEAD - 2_000, HEAD, [other]],
    })
  })

  it('reads only the first and last halves of a span beyond the evidence budget and flags it incomplete', async () => {
    const requestId = idOf(1n)
    const proposedAt = BASE + 1_000
    const logs = [
      commitLog(requestId, S1, proposedAt + 500),
      commitLog(requestId, S3, BASE + 50_000),
      commitLog(requestId, S2, FAR_HEAD - 1_000),
    ]
    // the gap commit is never read, so the two visible commits still match the getter count
    const endpoint = serve({ head: FAR_HEAD, logs, requests: { [requestId]: { state: 1, committed: 2 } } })

    const result = await read(makeReader(), { knownRequests: [refFor(1n, proposedAt)] })

    expect(coveredRanges(oracleLogCalls(endpoint))).toEqual([
      [proposedAt, proposedAt + EVIDENCE_END_BLOCKS - 1],
      [FAR_HEAD - EVIDENCE_END_BLOCKS + 1, FAR_HEAD],
    ])
    expect(result.requests[0].votes.map((vote) => vote.sentinel)).toEqual([S1, S2])
    expect(result.requests[0].evidenceComplete).toBe(false)
    expect(result.evidenceComplete).toBe(false)
  })

  const readEvidenceSpan = async (span: number): Promise<{ endpoint: Endpoint; request: RequestRead }> => {
    const proposedAt = FAR_HEAD - span + 1
    const requestId = idOf(1n)
    const logs = [commitLog(requestId, S1, proposedAt + 5), commitLog(requestId, S2, FAR_HEAD - 5)]
    const endpoint = serve({ head: FAR_HEAD, logs, requests: { [requestId]: { state: 1, committed: 2 } } })

    const result = await read(makeReader(), { knownRequests: [refFor(1n, proposedAt)] })

    return { endpoint, request: result.requests[0] }
  }

  it('reads a span of exactly 60,000 blocks whole and keeps its evidence complete', async () => {
    const { endpoint, request } = await readEvidenceSpan(60_000)

    expect(coveredRanges(oracleLogCalls(endpoint))).toEqual([[FAR_HEAD - 59_999, FAR_HEAD]])
    expect(request.evidenceComplete).toBe(true)
  })

  it('reads only the first and last 30,000 blocks of a 60,001-block span and flags it incomplete', async () => {
    const { endpoint, request } = await readEvidenceSpan(60_001)

    expect(coveredRanges(oracleLogCalls(endpoint))).toEqual([
      [FAR_HEAD - 60_000, FAR_HEAD - 30_001],
      [FAR_HEAD - 29_999, FAR_HEAD],
    ])
    expect(request.votes.map((vote) => vote.sentinel)).toEqual([S1, S2])
    expect(request.evidenceComplete).toBe(false)
  })

  it('reads from the deployment block for an attested-only request', async () => {
    const requestId = idOf(1n)
    const logs = [
      attestedLog(1n, HEAD - 100),
      commitLog(requestId, S1, BASE + 5),
      revealLog({ requestId, sentinel: S1, approved: true }, BASE + 6),
    ]
    const spec: RequestStateSpec = { state: 3, committed: 1, revealed: 1, approve: 1 }
    const endpoint = serve({ logs, requests: { [requestId]: spec } })

    const result = await read(makeReader())

    expect(coveredRanges(oracleLogCalls(endpoint))).toEqual([[BASE, HEAD]])
    expect(result.requests[0].votes.map((vote) => vote.sentinel)).toEqual([S1])
    expect(result.requests[0].evidenceComplete).toBe(true)
  })
})

describe('fetchCheckState: evidence completeness', () => {
  const requestId = idOf(1n)
  const EVIDENCE_LOGS = [
    proposalLog(1n, HEAD - 5_000),
    commitLog(requestId, S1, HEAD - 4_900),
    commitLog(requestId, S2, HEAD - 4_800),
    revealLog({ requestId, sentinel: S1, approved: true }, HEAD - 4_700),
  ]

  it('is complete when the distinct sentinels equal the getter counts, however often their logs repeat', async () => {
    const duplicates = [
      commitLog(requestId, S1, HEAD - 4_850),
      revealLog({ requestId, sentinel: S1, approved: true }, HEAD - 4_650),
    ]
    serve({
      logs: [...EVIDENCE_LOGS, ...duplicates],
      requests: { [requestId]: { state: 1, committed: 2, revealed: 1, approve: 1 } },
    })

    const result = await read(makeReader())

    expect(result.requests[0].votes.map((vote) => vote.sentinel)).toEqual([S1, S2])
    expect(result.requests[0].evidenceComplete).toBe(true)
    expect(result.evidenceComplete).toBe(true)
  })

  it.each([
    ['commits', { committed: 3, revealed: 1 }],
    ['reveals', { committed: 2, revealed: 2 }],
  ])(
    'is incomplete, with the getter counts still authoritative, when the getter counts more %s',
    async (_kind, counts) => {
      serve({ logs: EVIDENCE_LOGS, requests: { [requestId]: { state: 1, approve: 1, ...counts } } })

      const result = await read(makeReader())

      const [request] = result.requests
      expect(request).toMatchObject({
        state: 'PENDING',
        outcome: 'PENDING',
        committedCount: counts.committed,
        revealedCount: counts.revealed,
        evidenceComplete: false,
      })
      expect(request.votes).toHaveLength(2)
      expect(result.evidenceComplete).toBe(false)
    },
  )

  it.each([
    [1, true],
    [2, false],
  ])(
    'is complete only when every request is (second request counts %i commits, one seen)',
    async (committed, complete) => {
      const [first, second] = [idOf(1n), idOf(2n)]
      const logs = [
        proposalLog(1n, HEAD - 5_000),
        proposalLog(2n, HEAD - 4_000),
        commitLog(first, S1, HEAD - 4_900),
        commitLog(second, S1, HEAD - 3_900),
      ]
      serve({ logs, requests: { [first]: { state: 1, committed: 1 }, [second]: { state: 1, committed } } })

      const result = await read(makeReader())

      expect(result.requests.map((request) => request.evidenceComplete)).toEqual([true, complete])
      expect(result.evidenceComplete).toBe(complete)
    },
  )

  it.each([
    [HEAD, 'proven', true],
    [FAR_HEAD, 'heuristic', false],
  ])(
    'with no requests at head %i, discovery is %s and evidence completeness is %s',
    async (head, coverage, complete) => {
      serve({ head, logs: [], requests: {} })

      const result = await read(makeReader())

      expect(result.requests).toEqual([])
      expect(result.windowCoverage).toBe(coverage)
      expect(result.evidenceComplete).toBe(complete)
    },
  )
})

type RpcCall = { method: string; params: Array<{ data?: string }> }

const delay = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

// A real delay keeps responses outstanding: the provider batches on its own real timer, so overlap is only visible then.
const trackRequestReads = (): { handler: HttpHandler; readonly peak: number } => {
  let inFlight = 0
  let peak = 0
  const handler = http.post(RPC_URL, async ({ request }) => {
    const body = (await request.clone().json()) as RpcCall | RpcCall[]
    const isRequestRead = (call: RpcCall) => call.method === 'eth_call' && call.params[0]?.data?.startsWith(GET_REQUEST)
    const reads = [body].flat().filter(isRequestRead).length
    if (reads === 0) return
    inFlight += reads
    peak = Math.max(peak, inFlight)
    await delay(25)
    inFlight -= reads
  })
  return {
    handler,
    get peak() {
      return peak
    },
  }
}

describe('fetchCheckState: read concurrency and request order', () => {
  it('keeps at most 3 getRequest reads in flight and still returns every request in proposal order', async () => {
    const { logs, ids } = fanOut(1, 7)
    const tracker = trackRequestReads()
    const endpoint = makeEndpoint({
      url: RPC_URL,
      head: HEAD,
      logs: [...logs].reverse(),
      requests: requestsFor(ids, OPEN),
    })
    listen(tracker.handler, endpoint.handler)

    const result = await read(makeReader())

    expect(idsOfRead(result)).toEqual(ids)
    expect(callsTo(endpoint, GET_REQUEST)).toHaveLength(7)
    expect(tracker.peak).toBeGreaterThan(1)
    expect(tracker.peak).toBeLessThanOrEqual(3)
  })

  it('sorts requests by proposal block, then log index, whatever order the logs arrive in', async () => {
    const proposals: Array<[epoch: bigint, block: number, logIndex: number]> = [
      [3n, BASE + 3_000, 1],
      [1n, BASE + 1_000, 1],
      [2n, BASE + 2_000, 1],
      [5n, BASE + 4_000, 9],
      [4n, BASE + 4_000, 2],
    ]
    const ids = [1n, 2n, 3n, 4n, 5n].map((epoch) => idOf(epoch))
    const logs = proposals.map(([epoch, block, logIndex]) => proposalLog(epoch, block, { logIndex }))
    serve({ logs, requests: requestsFor(ids, OPEN) })

    const result = await read(makeReader())

    expect(idsOfRead(result)).toEqual(ids)
  })

  it('puts requests with an unknown proposal position last, ordered by request id', async () => {
    const [known, four, five] = [idOf(1n), idOf(4n), idOf(5n)]
    const logs = [attestedLog(4n, BASE + 500), attestedLog(5n, BASE + 600), proposalLog(1n, HEAD - 100)]
    serve({ logs, requests: { ...requestsFor([four, five], APPROVED), [known]: OPEN } })

    const result = await read(makeReader())

    expect(idsOfRead(result)).toEqual([known, ...[four, five].sort()])
  })
})
