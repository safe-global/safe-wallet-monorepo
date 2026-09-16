import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { makeStore } from '@/store'
import { rpcApi } from '../rpc'
import { JsonRpcProvider } from 'ethers'
import { setWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'

const RPC_URL = 'https://rpc.test.safe.global'
const CONTRACT = '0x1111111111111111111111111111111111111aBc'
const CONTRACT_LOWERCASE = '0x1111111111111111111111111111111111111abc'
const BYTECODE = '0x6080604052'
const EMPTY_CODE = '0x'

// A read that is no longer in flight, so a second call cannot be explained by promise sharing.
const afterFirstReadSettles = () => new Promise((resolve) => setTimeout(resolve, 50))

type JsonRpcRequest = { id: number | string; method: string; params?: unknown[] }
type RpcOutcome = { result: string } | { error: { code: number; message: string } }

let getCodeParams: string[] = []

const rpcHandler = (outcome: () => RpcOutcome) =>
  http.post(RPC_URL, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
    const batch = Array.isArray(body) ? body : [body]

    const responses = batch.map((req) => {
      if (req.method === 'eth_getCode') {
        getCodeParams.push(String(req.params?.[0]))
        return { jsonrpc: '2.0', id: req.id, ...outcome() }
      }
      return { jsonrpc: '2.0', id: req.id, result: null }
    })

    return HttpResponse.json(Array.isArray(body) ? responses : responses[0])
  })

// ethers' own request cache is disabled here so every assertion below is about rpcApi alone.
// That the app's provider sets a 2s window is covered in hooks/wallets/__tests__/web3Cache.test.ts.
const setProviderForChain = (chainId: string) => {
  setWeb3ReadOnly(new JsonRpcProvider(RPC_URL, Number(chainId), { staticNetwork: true, cacheTimeout: -1 }))
}

const cacheKeys = (store: ReturnType<typeof makeStore>) => Object.keys(store.getState().rpcApi.queries)

describe('rpcApi.getCode', () => {
  beforeEach(() => {
    getCodeParams = []
    server.use(rpcHandler(() => ({ result: BYTECODE })))
    setProviderForChain('1')
  })

  afterEach(() => {
    setWeb3ReadOnly(undefined)
  })

  it('serves a repeat read from its own cache, not from an in-flight promise', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    const first = await store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT })).unwrap()
    await afterFirstReadSettles()
    const second = await store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT })).unwrap()

    expect(first).toBe(BYTECODE)
    expect(second).toBe(BYTECODE)
    expect(getCodeParams).toHaveLength(1)
  })

  it('shares one cache entry between checksummed and lowercased spellings of an address', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    await store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT })).unwrap()
    await store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT_LOWERCASE })).unwrap()

    expect(cacheKeys(store)).toHaveLength(1)
  })

  it('does not serve one chains bytecode for the same address on another chain', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    await store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT })).unwrap()
    setProviderForChain('137')
    await store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '137', address: CONTRACT })).unwrap()

    expect(cacheKeys(store)).toHaveLength(2)
    expect(getCodeParams).toHaveLength(2)
  })

  it('refetches after a failed read instead of serving the failure for the rest of the session', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    server.use(rpcHandler(() => ({ error: { code: -32000, message: 'node unavailable' } })))

    await expect(
      store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT })).unwrap(),
    ).rejects.toBeDefined()

    server.use(rpcHandler(() => ({ result: BYTECODE })))
    await afterFirstReadSettles()

    const retried = await store
      .dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT }))
      .unwrap()

    expect(retried).toBe(BYTECODE)
    expect(getCodeParams).toHaveLength(2)
  })

  it('does not cache an empty-bytecode answer, so a later deployment is observed', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    server.use(rpcHandler(() => ({ result: EMPTY_CODE })))

    const undeployed = await store
      .dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT }))
      .unwrap()

    server.use(rpcHandler(() => ({ result: BYTECODE })))
    await afterFirstReadSettles()

    const deployed = await store
      .dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '1', address: CONTRACT }))
      .unwrap()

    expect(undeployed).toBe(EMPTY_CODE)
    expect(deployed).toBe(BYTECODE)
    expect(getCodeParams).toHaveLength(2)
  })

  it('refuses to answer from a provider connected to a different chain', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    setProviderForChain('1')

    await expect(
      store.dispatch(rpcApi.endpoints.getCode.initiate({ chainId: '137', address: CONTRACT })).unwrap(),
    ).rejects.toBeDefined()

    expect(getCodeParams).toHaveLength(0)
  })
})
