import { http, HttpResponse } from 'msw'
import { Interface } from 'ethers'
import { CONSENSUS_READ_ABI, COORDINATOR_READ_ABI } from '../../abi'
import type { RawLog } from '../../utils/decodeLogs'

/**
 * Fake JSON-RPC endpoint for reader tests (msw). Answers real JSON-RPC shapes —
 * single and batched bodies — so the reader is exercised through an actual
 * ethers `JsonRpcProvider`, not a mocked one.
 *
 * Not a test file: `testMatch` only picks `*.test.ts`.
 */

export type GetLogsFilter = { address?: string; topics: unknown[]; fromBlock: number; toBlock: number }

export type RpcConfig = {
  url: string
  chainId?: string
  head?: number
  headTimestamp?: number
  /** Seconds between consecutive blocks (default 5, the nominal Gnosis cadence). */
  blockTimeSeconds?: number
  /** Nonlinear cadence: unix timestamp for block `n`. Wins over `blockTimeSeconds`. */
  timestampAt?: (blockNumber: number) => number
  logs?: RawLog[]
  /**
   * How numeric `eth_getBlockByNumber` probes fail. `'null'` answers "block not
   * found". `'error'` answers a JSON-RPC error, which is what a load-balanced
   * node returns for an old header it cannot serve, and which rejects in ethers
   * rather than resolving to null.
   */
  failBlockProbes?: 'null' | 'error'
  failEverything?: boolean
  /** `getEpochGroupId(epoch)` result. */
  epochGroupId?: string
  /** `coordinator.groupKey(gid)` result. */
  groupKey?: { x: string; y: string }
  /** `groupKey` calls revert (an epoch the coordinator has not seen). */
  failGroupKey?: boolean
}

const hexToNum = (value: string): number => Number(BigInt(value))

const consensusRead = new Interface([...CONSENSUS_READ_ABI])
const coordinatorRead = new Interface([...COORDINATOR_READ_ABI])

const filterLogs = (logs: RawLog[], filter: GetLogsFilter): RawLog[] => {
  const topic0s = (Array.isArray(filter.topics[0]) ? filter.topics[0] : [filter.topics[0]]) as string[]
  const topic1s =
    filter.topics[1] == null
      ? null
      : ((Array.isArray(filter.topics[1]) ? filter.topics[1] : [filter.topics[1]]) as string[])
  return logs.filter((log) => {
    if (filter.address && (log.address ?? '').toLowerCase() !== filter.address.toLowerCase()) return false
    if (!topic0s.includes(log.topics[0])) return false
    if (topic1s && !topic1s.includes(log.topics[1])) return false
    return log.blockNumber >= filter.fromBlock && log.blockNumber <= filter.toBlock
  })
}

/** One JSON-RPC endpoint recorder + responder. Handles single and batched bodies. */
export const makeEndpoint = (config: RpcConfig) => {
  const getLogsCalls: GetLogsFilter[] = []
  const methods: string[] = []

  const blockTimestamp = (number: number): number => {
    if (config.timestampAt) return config.timestampAt(number)
    const head = config.head ?? 0
    return Math.max(0, (config.headTimestamp ?? 1_000_000) - (head - number) * (config.blockTimeSeconds ?? 5))
  }

  const respondOne = (req: { id: number; method: string; params: unknown[] }) => {
    methods.push(req.method)
    if (config.failEverything) {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32000, message: 'endpoint down' } }
    }
    const ok = (result: unknown) => ({ jsonrpc: '2.0', id: req.id, result })
    const err = (message: string) => ({ jsonrpc: '2.0', id: req.id, error: { code: 3, message } })

    switch (req.method) {
      case 'eth_chainId':
        return ok('0x' + Number(config.chainId ?? '100').toString(16))
      case 'eth_getBlockByNumber': {
        const head = config.head ?? 0
        const tag = req.params[0] as string
        if (tag !== 'latest' && config.failBlockProbes) {
          return config.failBlockProbes === 'error' ? err('missing trie node') : ok(null)
        }
        const number = tag === 'latest' ? head : hexToNum(tag)
        return ok({
          number: '0x' + number.toString(16),
          timestamp: '0x' + blockTimestamp(number).toString(16),
          hash: '0x' + '22'.repeat(32),
          parentHash: '0x' + '33'.repeat(32),
          nonce: '0x0000000000000000',
          difficulty: '0x0',
          gasLimit: '0x1c9c380',
          gasUsed: '0x0',
          miner: '0x' + '00'.repeat(20),
          extraData: '0x',
          baseFeePerGas: '0x7',
          transactions: [],
        })
      }
      case 'eth_getLogs': {
        const raw = req.params[0] as { address?: string; topics: unknown[]; fromBlock: string; toBlock: string }
        const filter: GetLogsFilter = {
          address: raw.address,
          topics: raw.topics,
          fromBlock: hexToNum(raw.fromBlock),
          toBlock: hexToNum(raw.toBlock),
        }
        getLogsCalls.push(filter)
        // Onto the wire shape ethers parses back into `Log`s.
        return ok(
          filterLogs(config.logs ?? [], filter).map((log) => ({
            address: log.address ?? '0x' + 'aa'.repeat(20),
            topics: log.topics,
            data: log.data,
            blockNumber: '0x' + log.blockNumber.toString(16),
            transactionHash: log.transactionHash,
            transactionIndex: '0x0',
            blockHash: '0x' + '11'.repeat(32),
            logIndex: '0x' + log.logIndex.toString(16),
            removed: false,
          })),
        )
      }
      case 'eth_call': {
        const call = req.params[0] as { to: string; data: string }
        const selector = call.data.slice(0, 10)
        if (selector === consensusRead.getFunction('getEpochGroupId')!.selector) {
          return ok(
            consensusRead.encodeFunctionResult('getEpochGroupId', [config.epochGroupId ?? '0x' + '00'.repeat(32)]),
          )
        }
        if (selector === coordinatorRead.getFunction('groupKey')!.selector) {
          if (config.failGroupKey) return err('group key not ready')
          const gk = config.groupKey ?? { x: '1', y: '2' }
          return ok(coordinatorRead.encodeFunctionResult('groupKey', [[BigInt(gk.x), BigInt(gk.y)]]))
        }
        return err('unexpected eth_call')
      }
      default:
        return err(`unhandled ${req.method}`)
    }
  }

  const handler = http.post(config.url, async ({ request }) => {
    const body = (await request.json()) as
      | { id: number; method: string; params: unknown[] }
      | Array<{ id: number; method: string; params: unknown[] }>
    const response = Array.isArray(body) ? body.map(respondOne) : respondOne(body)
    return HttpResponse.json(response)
  })

  return { handler, getLogsCalls, methods }
}
