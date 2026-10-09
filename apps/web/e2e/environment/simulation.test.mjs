import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { createSimulationServer, simulationParams } from './simulation.mjs'

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
  assert.throws(() => createSimulationServer('https://example.com'), /must point to the local stack/)
  for (const invalid of [{ network_id: '1' }, { to: 'invalid' }, { gas: -1 }, { input: '0x' }]) {
    assert.throws(() => simulationParams({ ...payload, ...invalid }), /Sepolia transaction/)
  }
  assert.throws(
    () => simulationParams({ ...payload, state_objects: { [address]: { storage: { '0x1': '0x1' } } } }),
    /storage override/,
  )
})

test('reports execution results and keeps provider errors distinct from reverts', async (t) => {
  let reply = { result: one }
  const rpc = createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const body = JSON.parse(Buffer.concat(chunks).toString())
    assert.equal(body.method, 'eth_call')
    assert.deepEqual(body.params, simulationParams(payload))
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ jsonrpc: '2.0', id: 1, ...reply }))
  }).listen(0, '127.0.0.1')
  await once(rpc, 'listening')
  t.after(() => rpc.close())
  const adapter = createSimulationServer(`http://127.0.0.1:${rpc.address().port}`).listen(0, '127.0.0.1')
  await once(adapter, 'listening')
  t.after(() => adapter.close())
  const simulate = () =>
    fetch(`http://127.0.0.1:${adapter.address().port}/simulate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  assert.equal((await (await simulate()).json()).simulation.status, true)
  reply = { error: { code: 3, message: 'execution reverted: GS013' } }
  const reverted = await (await simulate()).json()
  assert.equal(reverted.simulation.status, false)
  assert.match(reverted.transaction.error_message, /GS013/)
  reply = { result: `0x${'0'.repeat(64)}` }
  assert.equal((await (await simulate()).json()).simulation.status, false)
  reply = { error: { code: -32000, message: 'upstream unavailable' } }
  assert.equal((await simulate()).status, 502)
})
