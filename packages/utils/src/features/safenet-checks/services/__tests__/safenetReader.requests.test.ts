import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAddress } from 'ethers'
import { setupServer, type SetupServerApi } from 'msw/node'
import { SafenetReader, type SafenetReaderConfig } from '../safenetReader'
import { EMPTY_ORACLE_DATA_HASH, buildOracleProposedLog } from '../../builders/rawLogs'
import { transactionProposalHash } from '../../utils/proposalHash'
import type { RawLog } from '../../utils/decodeLogs'
import type { CheckEventBase, Hex, RequestRead, SentinelVote } from '../../types'
import { encodeRequest, makeEndpoint, type RpcConfig } from './rpcEndpoint'

type Capture = Pick<RequestRead, 'requestId' | 'epoch' | 'oracleDataHash'> & {
  label: string
  safeTxHash: Hex
  homeChainId: string
  safe: string
  proposal: CheckEventBase
  logs: RawLog[]
  requestState: { blockNumber: number; rawResult: string }
  expected: Pick<RequestRead, 'state' | 'outcome' | 'committedCount' | 'revealedCount' | 'approveCount' | 'denyCount'>
}

type Provenance = Pick<SafenetReaderConfig, 'chainId' | 'consensus' | 'coordinator'> & { oracle: string }

const { provenance, captures }: { provenance: Provenance; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const ARBITRATION_DEADLINE: Record<string, string | null> = { 'approved-first': null, 'disputed-split': '48643753' }

const RPC_URL = 'http://rpc.test/1'
// The fixed addresses the raw-log builders encode (see builders/rawLogs.ts).
const CONSENSUS = '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'
const ORACLE = '0x00000000000000000000000000000000000000AA'
const SAFE_TX_HASH: Hex = `0x${'ab'.repeat(32)}`

let server: SetupServerApi
afterEach(() => server?.close())

const serve = (config: Omit<RpcConfig, 'url'>) => {
  const endpoint = makeEndpoint({ url: RPC_URL, head: 25_000, ...config })
  server = setupServer(endpoint.handler)
  server.listen()
  return endpoint
}

const makeReader = (over: Partial<SafenetReaderConfig> = {}) =>
  new SafenetReader({
    rpcUrls: [RPC_URL],
    chainId: '100',
    consensus: CONSENSUS,
    coordinator: ORACLE,
    oracles: [ORACLE],
    ...over,
  })

const requestIdFor = (epoch: bigint): Hex =>
  transactionProposalHash({
    chainId: '100',
    consensus: CONSENSUS,
    epoch: epoch.toString(),
    oracle: ORACLE,
    oracleDataHash: EMPTY_ORACLE_DATA_HASH as Hex,
    safeTxHash: SAFE_TX_HASH,
  })

const proposalLog = (epoch: bigint, blockNumber: number): RawLog =>
  buildOracleProposedLog({ safeTxHash: SAFE_TX_HASH, epoch, oracle: ORACLE }, { blockNumber, logIndex: 1 })

/** The `index`th 32-byte word of ABI-encoded getRequest bytes, as a decimal string. */
const word = (rawResult: string, index: number): string =>
  BigInt(`0x${rawResult.slice(2 + 64 * index, 2 + 64 * (index + 1))}`).toString()

const SENTINEL_1 = '0x6D081448c04d9ef7cf8EcF54207B1931ecc25312'
const SENTINEL_2 = '0xc84a0928632382E75c543ACCeD101B9525027362'

const vote = (
  sentinel: string,
  verdict: Pick<SentinelVote, 'approved' | 'reason'>,
  commitTxHash: string,
  revealTxHash: string,
): SentinelVote => ({ sentinel, ...verdict, bondAmount: '800000000000000000000', commitTxHash, revealTxHash })

/** Rows as the capture's commit and reveal logs show them, sorted by lowercase sentinel. */
const VOTES: Record<string, SentinelVote[]> = {
  'approved-first': [
    vote(
      SENTINEL_1,
      { approved: true, reason: '' },
      '0x4462d92d851483e7e32c8d175e108dd56be431c14a4bd3b00a8e68b7c6d507e0',
      '0x5b86f8bd6e5e4aaa377eb6687bcbf61cdd002507aea5943ee1a17183d1c9b959',
    ),
    vote(
      SENTINEL_2,
      { approved: true, reason: '' },
      '0x6cc066e1ad41f53f0d6caa172f3f6d3d205972bb25187289cddf39a198ff5734',
      '0x734150a6e54f4d5c150574caa5dffe2f3ab0c410a433f563bc62e845a726909d',
    ),
  ],
  'disputed-split': [
    vote(
      SENTINEL_1,
      { approved: false, reason: 'R-4.6' },
      '0xb4a4a30e1ed9c9936d6dba783cd6d09165dbff8909940021e9fbf1876e2019ea',
      '0xc9fd101ec3c3a0b97251f719697eed99a3194fc31f00784e52b0b42c6c4a0200',
    ),
    vote(
      SENTINEL_2,
      { approved: true, reason: '' },
      '0xd31f5b541c5f4e79a6e5e46db2cf879c03abef0b9f830500766ea9caa2146d33',
      '0x2f1adb45e494e656d74fcb35c6a004b16c946a61bb398080f3e5af72d6c12c32',
    ),
  ],
}

describe('fetchCheckState: request state', () => {
  it.each(captures)('$label: reads the state at the head and the votes from the logs', async (c) => {
    const { rawResult, blockNumber } = c.requestState
    const { state, outcome, committedCount, revealedCount, approveCount, denyCount } = c.expected
    const endpoint = serve({ head: blockNumber, logs: c.logs, requests: { [c.requestId]: rawResult } })

    const result = await makeReader({ ...provenance, oracles: [provenance.oracle] }).fetchCheckState(c.safeTxHash)

    expect(result.requests).toHaveLength(1)
    const [request] = result.requests
    expect(request).toEqual({
      requestId: c.requestId,
      epoch: c.epoch,
      oracle: getAddress(provenance.oracle),
      oracleDataHash: c.oracleDataHash,
      chainId: c.homeChainId,
      safe: getAddress(c.safe),
      proposedAt: c.proposal,
      state,
      outcome,
      commitDeadlineBlock: word(rawResult, 0),
      revealDeadlineBlock: word(rawResult, 2),
      arbitrationDeadlineBlock: ARBITRATION_DEADLINE[c.label],
      committedCount,
      revealedCount,
      approveCount,
      denyCount,
      votes: VOTES[c.label],
      resolution: null,
      resolutionContext: null,
      resolutionTxHash: null,
    })
    expect(JSON.parse(JSON.stringify(request))).not.toHaveProperty('fee')
    expect(endpoint.reads.blockTags).toEqual([`0x${blockNumber.toString(16)}`])
  })

  it('fails the read when a discovered request reverts', async () => {
    serve({ logs: [proposalLog(1n, 100)], requests: {} })

    await expect(makeReader().fetchCheckState(SAFE_TX_HASH)).rejects.toMatchObject({ code: 'CALL_EXCEPTION' })
  })

  it.each([0, 6])('fails the read on the unknown state ordinal %i', async (state) => {
    serve({ logs: [proposalLog(1n, 100)], requests: { [requestIdFor(1n)]: encodeRequest(state) } })

    await expect(makeReader().fetchCheckState(SAFE_TX_HASH)).rejects.toThrow('unknown request state')
  })

  it('reads one request per id, in the order of its first proposal', async () => {
    // Out of log order on purpose; epoch 7 is proposed twice.
    serve({ logs: [proposalLog(3n, 200), proposalLog(7n, 300), proposalLog(7n, 100)] })

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(result.requests.map((request) => [request.requestId, request.proposedAt.blockNumber])).toEqual([
      [requestIdFor(7n), 100],
      [requestIdFor(3n), 200],
    ])
  })

  it('keeps at most three getRequest calls in flight', async () => {
    const logs = Array.from({ length: 7 }, (_, index) => proposalLog(BigInt(index + 1), 100 + index))
    const endpoint = serve({ logs, getRequestDelayMs: 25 })

    const result = await makeReader().fetchCheckState(SAFE_TX_HASH)

    expect(result.requests).toHaveLength(logs.length)
    expect(endpoint.reads.peak).toBeLessThanOrEqual(3)
  })
})
