import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { createSimulationServer, forkRpcUrls, simulationParams } from './simulation.mjs'

const address = '0x0000000000000000000000000000000000000001'
const slot = `0x${'4'.padStart(64, '0')}`
const one = `0x${'1'.padStart(64, '0')}`
const payload = {
  network_id: '11155111',
  from: address,
  to: address,
  input: '0x6a761202',
  gas: 30000000,
  state_objects: { [address]: { storage: { [slot]: one } } },
}

test('translates Safe simulation storage overrides without modifying chain state', () => {
  const [call, block, overrides] = simulationParams(payload)
  assert.equal(call.data, payload.input)
  assert.equal(call.gas, '0x1c9c380')
  assert.equal(block, 'latest')
  assert.deepEqual(overrides[address], { stateDiff: { [slot]: one } })
})

test('rejects remote RPC and unsupported simulation requests', () => {
  assert.throws(() => createSimulationServer({ 1: 'https://example.com' }), /must point to the local stack/)
  for (const invalid of [{ network_id: 1 }, { to: 'invalid' }, { gas: -1 }, { input: '0x' }]) {
    assert.throws(() => simulationParams({ ...payload, ...invalid }), /Safe transaction/)
  }
  assert.throws(
    () => simulationParams({ ...payload, state_objects: { [address]: { storage: { '0x1': '0x1' } } } }),
    /storage override/,
  )
})

async function listen(server, t) {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())
  return `http://127.0.0.1:${server.address().port}`
}

function fakeRpc(reply, calls = []) {
  return createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const body = JSON.parse(Buffer.concat(chunks).toString())
    calls.push(body)
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ jsonrpc: '2.0', id: 1, ...reply() }))
  })
}

test('maps every fork in the stack manifest to its RPC', () => {
  const manifest = {
    chainId: 11155111,
    rpcUrl: 'http://localhost:8545',
    chains: { 137: { chainId: 137, rpcUrl: 'http://localhost:8548' } },
  }
  assert.deepEqual(forkRpcUrls(manifest), { 11155111: 'http://localhost:8545', 137: 'http://localhost:8548' })
})

test('reports execution results and keeps provider errors distinct from reverts', async (t) => {
  let reply = { result: one }
  const calls = []
  const rpc = await listen(
    fakeRpc(() => reply, calls),
    t,
  )
  const adapter = await listen(createSimulationServer({ 11155111: rpc }), t)
  // Like the wallet without a Tenderly token: no content-type header.
  const simulate = () => fetch(`${adapter}/simulate`, { method: 'POST', body: JSON.stringify(payload) })
  const success = await (await simulate()).json()
  assert.equal(calls[0].method, 'eth_call')
  assert.deepEqual(calls[0].params, simulationParams(payload))
  assert.equal(success.simulation.status, true)
  assert.deepEqual(success.transaction.call_trace, [])
  reply = { error: { code: 3, message: 'execution reverted: GS013' } }
  const reverted = await (await simulate()).json()
  assert.equal(reverted.simulation.status, false)
  assert.match(reverted.transaction.error_message, /GS013/)
  assert.equal(reverted.transaction.error_info.address, payload.to)
  assert.deepEqual(reverted.transaction.call_trace, [{ error: 'execution reverted: GS013', input: payload.input }])
  reply = { result: `0x${'0'.repeat(64)}` }
  const failed = await (await simulate()).json()
  assert.equal(failed.simulation.status, false)
  assert.equal(failed.transaction.call_trace[0].error, 'Safe execution returned false')
  reply = { error: { code: -32000, message: 'upstream unavailable' } }
  assert.equal((await simulate()).status, 502)
})

test('routes each chain to its own fork and rejects chains without one', async (t) => {
  const sepolia = []
  const polygon = []
  const sepoliaRpc = await listen(
    fakeRpc(() => ({ result: one }), sepolia),
    t,
  )
  const polygonRpc = await listen(
    fakeRpc(() => ({ result: one }), polygon),
    t,
  )
  const adapter = await listen(createSimulationServer({ 11155111: sepoliaRpc, 137: polygonRpc }), t)
  const simulate = (network_id) =>
    fetch(`${adapter}/simulate`, { method: 'POST', body: JSON.stringify({ ...payload, network_id }) })
  assert.equal((await (await simulate('137')).json()).simulation.status, true)
  assert.equal(polygon.length, 1)
  assert.equal(sepolia.length, 0)
  assert.equal((await simulate('1')).status, 400)
})

test('answers the Transaction Builder and wallet origins only', async (t) => {
  const rpc = await listen(
    fakeRpc(() => ({ result: one })),
    t,
  )
  const adapter = await listen(createSimulationServer({ 11155111: rpc }), t)
  const preflight = (origin) => fetch(`${adapter}/simulate`, { method: 'OPTIONS', headers: { origin } })
  for (const origin of ['http://localhost:4000', 'http://localhost:3080', 'http://localhost:8080']) {
    const response = await preflight(origin)
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), origin)
  }
  const wallet = await fetch(`${adapter}/simulate`, {
    method: 'POST',
    headers: { origin: 'http://localhost:8080' },
    body: JSON.stringify(payload),
  })
  assert.equal(wallet.headers.get('access-control-allow-origin'), 'http://localhost:8080')
  assert.equal((await wallet.json()).simulation.status, true)
  const unknown = await preflight('https://evil.example')
  assert.equal(unknown.status, 403)
  assert.equal(unknown.headers.get('access-control-allow-origin'), null)
  const post = await fetch(`${adapter}/simulate`, {
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
    body: JSON.stringify(payload),
  })
  assert.equal(post.status, 403)
})
