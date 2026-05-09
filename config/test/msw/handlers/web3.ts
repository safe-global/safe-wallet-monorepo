import { http, HttpResponse } from 'msw'

/**
 * Web3/RPC mock handlers for Storybook stories
 *
 * These handlers mock JSON-RPC calls that ethers.js and other Web3 libraries make.
 * Use these when components need blockchain state (balances, chain ID, etc.)
 */

type JsonRpcRequest = {
  jsonrpc: string
  method: string
  params?: unknown[]
  id: number | string
}

type JsonRpcResponse = {
  jsonrpc: string
  result?: unknown
  error?: { code: number; message: string }
  id: number | string
}

// Default mock values for common RPC responses
const MOCK_CHAIN_ID = '0x1' // Ethereum mainnet
const MOCK_BLOCK_NUMBER = '0x10d4f00' // ~17,580,800
const MOCK_GAS_PRICE = '0x3b9aca00' // 1 gwei
const MOCK_BALANCE = '0xde0b6b3a7640000' // 1 ETH in wei

/**
 * Create Web3 RPC handlers for a given RPC URL pattern
 *
 * @param rpcUrlPattern - URL pattern to match (e.g., '*\/rpc' or 'https://ethereum.publicnode.com')
 */
export const createWeb3Handlers = (rpcUrlPattern = '*/rpc') => [
  http.post(rpcUrlPattern, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]

    // Handle batch requests
    if (Array.isArray(body)) {
      const responses: JsonRpcResponse[] = body.map((req) => handleRpcRequest(req))
      return HttpResponse.json(responses)
    }

    // Handle single request
    const response = handleRpcRequest(body)
    return HttpResponse.json(response)
  }),
]

/**
 * Handle individual JSON-RPC requests
 */
function handleRpcRequest(request: JsonRpcRequest): JsonRpcResponse {
  const { method, params, id } = request

  switch (method) {
    case 'eth_chainId':
      return { jsonrpc: '2.0', result: MOCK_CHAIN_ID, id }

    case 'eth_blockNumber':
      return { jsonrpc: '2.0', result: MOCK_BLOCK_NUMBER, id }

    case 'eth_gasPrice':
      return { jsonrpc: '2.0', result: MOCK_GAS_PRICE, id }

    case 'eth_getBalance':
      return { jsonrpc: '2.0', result: MOCK_BALANCE, id }

    case 'eth_getCode':
      // Return non-empty code for contract addresses, empty for EOAs
      return { jsonrpc: '2.0', result: '0x', id }

    case 'eth_call':
      // Return empty result for generic calls
      return { jsonrpc: '2.0', result: '0x', id }

    case 'eth_estimateGas':
      return { jsonrpc: '2.0', result: '0x5208', id } // 21000 gas

    case 'eth_getTransactionCount':
      return { jsonrpc: '2.0', result: '0x0', id }

    case 'eth_getTransactionReceipt':
      return {
        jsonrpc: '2.0',
        result: {
          transactionHash: params?.[0] || '0x0',
          blockNumber: MOCK_BLOCK_NUMBER,
          status: '0x1', // Success
        },
        id,
      }

    case 'net_version':
      return { jsonrpc: '2.0', result: '1', id } // Mainnet

    case 'eth_accounts':
      return { jsonrpc: '2.0', result: [], id }

    case 'eth_requestAccounts':
      return { jsonrpc: '2.0', result: [], id }

    case 'wallet_switchEthereumChain':
      return { jsonrpc: '2.0', result: null, id }

    default:
      // Return null for unhandled methods
      return { jsonrpc: '2.0', result: null, id }
  }
}

/**
 * Pre-configured handlers for common RPC endpoints
 */
export const ethereumRpcHandlers = createWeb3Handlers('https://ethereum.publicnode.com')
export const polygonRpcHandlers = createWeb3Handlers('https://polygon-rpc.com')
export const arbitrumRpcHandlers = createWeb3Handlers('https://arbitrum-one.publicnode.com')

/**
 * All RPC handlers combined (matches any URL ending in /rpc or common public endpoints)
 */
export const allWeb3Handlers = [
  ...createWeb3Handlers('*/rpc'),
  ...createWeb3Handlers('*://ethereum.publicnode.com'),
  ...createWeb3Handlers('*://polygon-rpc.com'),
  ...createWeb3Handlers('*://arbitrum-one.publicnode.com'),
]
