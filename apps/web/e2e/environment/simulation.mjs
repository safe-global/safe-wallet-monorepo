import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isAddress, isHexString, toQuantity } from 'ethers'
import { localUrl } from './local-stack.mjs'

const isSafeExecution = (payload) =>
  payload.network_id === '11155111' &&
  isAddress(payload.from) &&
  isAddress(payload.to) &&
  isHexString(payload.input) &&
  payload.input.startsWith('0x6a761202') &&
  Number.isSafeInteger(payload.gas) &&
  payload.gas > 0 &&
  payload.gas <= 60_000_000

function stateOverride(address, { storage = {}, balance, code }) {
  if (!isAddress(address)) throw new Error('Invalid override address')
  if (Object.entries(storage).some(([key, value]) => !isHexString(key, 32) || !isHexString(value, 32))) {
    throw new Error('Invalid storage override')
  }
  return {
    stateDiff: storage,
    ...(balance !== undefined ? { balance: toQuantity(balance) } : {}),
    ...(code !== undefined ? { code } : {}),
  }
}

/** Turns a Tenderly simulation request for execTransaction into eth_call params with state overrides. */
export function simulationParams(payload) {
  if (!isSafeExecution(payload)) {
    throw new Error('Simulation requires a Sepolia transaction with valid addresses, calldata and gas')
  }
  const overrides = Object.fromEntries(
    Object.entries(payload.state_objects || {}).map(([address, state]) => [address, stateOverride(address, state)]),
  )
  const call = {
    from: payload.from,
    to: payload.to,
    data: payload.input,
    gas: toQuantity(payload.gas),
    gasPrice: toQuantity(payload.gas_price || 0),
    value: toQuantity(payload.value || 0),
  }
  return [call, 'latest', overrides]
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 1_000_000) throw new Error('Simulation request is too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString())
}

async function ethCall(rpc, params) {
  const response = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Anvil answered ${response.status}`)
  const result = await response.json()
  const reverted = result.error?.code === 3
  if (result.error && !reverted) throw new Error(`Anvil eth_call failed: ${result.error.message}`)
  if (!reverted && !isHexString(result.result)) throw new Error('Anvil eth_call returned no result')
  return { reverted, result }
}

// The shape of a Tenderly simulation that the Transaction Builder reads.
function simulationResponse({ reverted, result }, to) {
  const status = !reverted && result.result !== `0x${'0'.repeat(64)}`
  const failure = {
    error_message: result.error?.message || 'Safe execution returned false',
    error_info: { address: to },
  }
  return {
    simulation: { id: `anvil-${randomUUID()}`, status },
    transaction: { status, ...(status ? {} : failure) },
  }
}

export function createSimulationServer(rpcUrl) {
  const rpc = localUrl(rpcUrl, 'Simulation RPC')
  return createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000')
    response.setHeader('Access-Control-Allow-Headers', 'content-type')
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Content-Type', 'application/json')
    if (request.method === 'OPTIONS') return response.writeHead(204).end()
    if (request.method !== 'POST' || request.url !== '/simulate') return response.writeHead(404).end()
    let payload
    let params
    try {
      payload = await readJsonBody(request)
      params = simulationParams(payload)
    } catch (error) {
      console.error(`Rejected simulation request: ${error.message}`)
      return response.writeHead(400).end(JSON.stringify({ error: 'Invalid simulation request' }))
    }
    try {
      response.end(JSON.stringify(simulationResponse(await ethCall(rpc, params), payload.to)))
    } catch (error) {
      console.error(`Local simulation failed: ${error.message}`)
      response.writeHead(502).end(JSON.stringify({ error: 'Local Anvil simulation failed' }))
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = createSimulationServer(process.env.SAFE_RPC_URL)
  server.listen(4003, '127.0.0.1', () => console.log('Local simulation adapter: http://localhost:4003/simulate'))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close())
}
