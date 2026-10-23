/**
 * Answers the gateway's LiFi requests in place of https://li.quest, whose address the gateway does not let us change.
 *
 * With FF_LIFITRANSACTIONS_MAPPING the gateway reads the LiFi Diamond of a chain from `/v1/chains` and maps calls to
 * it as swaps and bridges; Safe Shield then checks the bridge's target chain. No bridge is ever executed on the forks,
 * so `/v1/status` reports every transfer as not found.
 */
import { isMain, json, serveTls } from './http.ts'
import type { MockRequest, Reply } from './http.ts'
import { LIFI_DIAMOND_ADDRESS } from './lifi-constants.ts'

const PORT = 443
// Sepolia, Ethereum and Polygon: the forks of the stack
export const FORK_CHAIN_IDS = [11155111, 1, 137]

function transferStatus(query: URLSearchParams): Reply {
  const txHash = query.get('txHash')
  const fromChain = query.get('fromChain')
  if (!txHash || !fromChain) return json(400, { message: 'Pass txHash and fromChain' })
  return json(200, {
    status: 'NOT_FOUND',
    substatus: 'UNKNOWN_FAILED_ERROR',
    substatusMessage: null,
    sending: { txHash, chainId: Number(fromChain), txLink: '' },
  })
}

export function dispatch({ method, path, query }: Pick<MockRequest, 'method' | 'path' | 'query'>): Reply {
  if (path === '/health') return json(200, { ready: true })
  if (method === 'GET' && path === '/v1/chains') {
    return json(200, { chains: FORK_CHAIN_IDS.map((id) => ({ id, diamondAddress: LIFI_DIAMOND_ADDRESS })) })
  }
  if (method === 'GET' && path === '/v1/status') return transferStatus(query)
  return json(404, { message: `No LiFi fixture for ${method} ${path}` })
}

if (isMain(import.meta.url)) serveTls(PORT, dispatch)
