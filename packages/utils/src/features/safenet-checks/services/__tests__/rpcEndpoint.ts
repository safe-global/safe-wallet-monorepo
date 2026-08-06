import { http, HttpResponse } from 'msw'
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
  logs?: RawLog[]
  failEverything?: boolean
}

const hexToNum = (value: string): number => Number(BigInt(value))

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
      // The reader only ever asks for 'latest' in this slice.
      case 'eth_getBlockByNumber': {
        const number = config.head ?? 0
        return ok({
          number: '0x' + number.toString(16),
          timestamp: '0x' + (config.headTimestamp ?? 1_000_000).toString(16),
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
