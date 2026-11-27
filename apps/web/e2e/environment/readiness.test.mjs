import assert from 'node:assert/strict'
import { after, afterEach, before, test } from 'node:test'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { assertEnvironmentReady } from './run.mjs'

const manifest = {
  gatewayUrl: 'http://localhost:8000/cgw',
  decoderUrl: 'http://localhost:8000/decoder',
  rpcUrl: 'http://localhost:8545',
  chainId: 11155111,
  forkBlock: 10008682,
  forkBlockHash: `0x${'a'.repeat(64)}`,
}
const rpcResponse = [
  { jsonrpc: '2.0', id: 2, result: { hash: manifest.forkBlockHash } },
  { jsonrpc: '2.0', id: 1, result: '0xaa36a7' },
]
const server = setupServer(
  http.get(`${manifest.gatewayUrl}/health/ready`, () => HttpResponse.json({})),
  http.get(`${manifest.decoderUrl}/health/ready`, () => HttpResponse.json({ ready: true })),
  http.post(manifest.rpcUrl, async ({ request }) => {
    assert.deepEqual(await request.json(), [
      { jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] },
      { jsonrpc: '2.0', id: 2, method: 'eth_getBlockByNumber', params: ['0x98b86a', false] },
    ])
    return HttpResponse.json(rpcResponse)
  }),
)

before(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
after(() => server.close())

test('requires live CGW, decoder and the expected Anvil fork, regardless of RPC response order', async () => {
  await assertEnvironmentReady(manifest)
})

test('rejects unavailable backend dependencies or non-local URLs before browser startup', async () => {
  await assert.rejects(assertEnvironmentReady({ ...manifest, decoderUrl: undefined }), /refresh it after upgrading/)
  await assert.rejects(
    assertEnvironmentReady({ ...manifest, decoderUrl: 'https://example.com' }),
    /must point to the local stack/,
  )
  for (const response of [new HttpResponse(null, { status: 503 }), HttpResponse.json({ ready: false })]) {
    server.use(http.get(`${manifest.decoderUrl}/health/ready`, () => response))
    await assert.rejects(assertEnvironmentReady(manifest), /is not ready/)
  }
})

test('fails before browser startup when the gateway or Anvil is unavailable', async () => {
  server.use(http.get(`${manifest.gatewayUrl}/health/ready`, () => new HttpResponse(null, { status: 503 })))
  await assert.rejects(assertEnvironmentReady(manifest), /Local gateway is not ready/)
  server.resetHandlers()
  server.use(http.post(manifest.rpcUrl, () => HttpResponse.error()))
  await assert.rejects(assertEnvironmentReady(manifest), /Local Anvil for chain 11155111 is not ready/)
})

test('rejects a different chain, fork block or non-local RPC', async () => {
  await assert.rejects(
    assertEnvironmentReady({ ...manifest, rpcUrl: 'https://example.com' }),
    /must point to the local stack/,
  )
  for (const response of [
    [{ ...rpcResponse[1], result: '0x1' }, rpcResponse[0]],
    [rpcResponse[1], { ...rpcResponse[0], result: { hash: `0x${'b'.repeat(64)}` } }],
    [{ jsonrpc: '2.0', id: 1, error: { code: -32603, message: 'RPC error' } }],
  ]) {
    server.use(http.post(manifest.rpcUrl, () => HttpResponse.json(response)))
    await assert.rejects(assertEnvironmentReady(manifest), /does not match/)
  }
})

test('checks every optional forked chain in the manifest', async () => {
  const mainnet = {
    rpcUrl: 'http://localhost:8547',
    chainId: 1,
    forkBlock: 26083334,
    forkBlockHash: `0x${'c'.repeat(64)}`,
  }
  const chainResponse = (hash) => [
    { jsonrpc: '2.0', id: 1, result: '0x1' },
    { jsonrpc: '2.0', id: 2, result: { hash } },
  ]
  server.use(http.post(mainnet.rpcUrl, () => HttpResponse.json(chainResponse(mainnet.forkBlockHash))))
  await assertEnvironmentReady({ ...manifest, chains: { 1: mainnet } })
  server.use(http.post(mainnet.rpcUrl, () => HttpResponse.json(chainResponse(`0x${'d'.repeat(64)}`))))
  await assert.rejects(
    assertEnvironmentReady({ ...manifest, chains: { 1: mainnet } }),
    /Local Anvil for chain 1 does not match the configured fork/,
  )
})
