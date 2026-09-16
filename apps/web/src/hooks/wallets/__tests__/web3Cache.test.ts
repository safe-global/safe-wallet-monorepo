import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { createWeb3ReadOnly, createSafeAppsWeb3Provider } from '../web3'
import { chainBuilder } from '@/tests/builders/chains'

const RPC_URL = 'https://rpc.cache.test.safe.global'
const ADDRESS = '0x1111111111111111111111111111111111111111'

type JsonRpcRequest = { id: number | string; method: string }

let calls = 0

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const providerFor = (factory: typeof createWeb3ReadOnly) =>
  factory(chainBuilder().with({ chainId: '1' }).build(), RPC_URL)

describe('read-only provider request cache', () => {
  beforeEach(() => {
    calls = 0
    server.use(
      http.post(RPC_URL, async ({ request }) => {
        const body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
        const batch = Array.isArray(body) ? body : [body]
        const responses = batch.map((req) => {
          if (req.method === 'eth_getCode') calls++
          return { jsonrpc: '2.0', id: req.id, result: '0x6080' }
        })
        return HttpResponse.json(Array.isArray(body) ? responses : responses[0])
      }),
    )
  })

  it('coalesces repeat reads made further apart than the ethers default window', async () => {
    const provider = providerFor(createWeb3ReadOnly)!

    await provider.getCode(ADDRESS)
    await sleep(400)
    await provider.getCode(ADDRESS)

    expect(calls).toBe(1)
  })

  it('still refetches once the window has passed, so reads never go permanently stale', async () => {
    const provider = providerFor(createWeb3ReadOnly)!

    await provider.getCode(ADDRESS)
    await sleep(2100)
    await provider.getCode(ADDRESS)

    expect(calls).toBe(2)
  })

  it('leaves the Safe Apps provider on the ethers default, so dapps are not served our cache', async () => {
    const provider = providerFor(createSafeAppsWeb3Provider)!

    await provider.getCode(ADDRESS)
    await sleep(400)
    await provider.getCode(ADDRESS)

    expect(calls).toBe(2)
  })
})
