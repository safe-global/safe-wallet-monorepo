import { http, HttpResponse } from 'msw'
import { custom, createPublicClient } from 'viem'
import { server } from '@/tests/server'
import { RetryingRpcProvider, RpcRetryExhaustedError, getOrCreateReadProvider } from '../RetryingRpcProvider'

const RPC_URL = 'https://rpc.test.example/v3/test-token'
const CHAIN_ID = 1

type RpcItem = { id: number; method: string; params?: unknown[] }

const parseBody = async (request: Request): Promise<RpcItem[]> => {
  const body = (await request.json()) as RpcItem | RpcItem[]
  return Array.isArray(body) ? body : [body]
}

const respond = (
  items: RpcItem[],
  results: Array<{ id: number; result?: unknown; error?: { code: number; message: string } }>,
) => {
  // ethers' _send normalises single object body / response symmetrically; we mirror
  // the request shape: array request → array response, single → single.
  const wrap = (item: RpcItem) => {
    const matching = results.find((r) => r.id === item.id)
    if (matching?.error) {
      return { jsonrpc: '2.0', id: item.id, error: matching.error }
    }
    return { jsonrpc: '2.0', id: item.id, result: matching?.result ?? '0x0' }
  }
  // Single-item requests can still be answered with a single object; ethers
  // normalises both shapes (`_send` wraps single in array). Use array to match
  // every request shape uniformly.
  return HttpResponse.json(items.map(wrap))
}

describe('RetryingRpcProvider', () => {
  it('retries HTTP 429 and resolves on success', async () => {
    let attempts = 0
    server.use(
      http.post(RPC_URL, async ({ request }) => {
        const items = await parseBody(request)
        attempts += 1
        if (attempts < 3) return new HttpResponse(null, { status: 429 })
        return respond(
          items,
          items.map((i) => ({ id: i.id, result: '0x2a' })),
        )
      }),
    )

    const provider = new RetryingRpcProvider(RPC_URL, CHAIN_ID)
    const result = await provider.request({ method: 'eth_blockNumber', params: [] })
    expect(result).toBe('0x2a')
    expect(attempts).toBe(3)
  })

  it('retries on JSON-RPC -32005 detected by processFunc and resolves', async () => {
    let attempts = 0
    server.use(
      http.post(RPC_URL, async ({ request }) => {
        const items = await parseBody(request)
        attempts += 1
        if (attempts === 1) {
          return respond(
            items,
            items.map((i) => ({ id: i.id, error: { code: -32005, message: 'rate limited' } })),
          )
        }
        return respond(
          items,
          items.map((i) => ({ id: i.id, result: '0xabc' })),
        )
      }),
    )

    const provider = new RetryingRpcProvider(RPC_URL, CHAIN_ID)
    const result = await provider.request({ method: 'eth_call', params: [{}, 'latest'] })
    expect(result).toBe('0xabc')
    expect(attempts).toBe(2)
  })

  it('does not retry on non-throttle RPC errors (e.g. -32600)', async () => {
    let attempts = 0
    server.use(
      http.post(RPC_URL, async ({ request }) => {
        const items = await parseBody(request)
        attempts += 1
        return respond(
          items,
          items.map((i) => ({ id: i.id, error: { code: -32600, message: 'invalid request' } })),
        )
      }),
    )

    const provider = new RetryingRpcProvider(RPC_URL, CHAIN_ID)
    await expect(provider.request({ method: 'eth_blockNumber', params: [] })).rejects.toThrow(/invalid request/i)
    expect(attempts).toBe(1)
  })

  it('throws RpcRetryExhaustedError after sustained 429s, preserving original error in cause', async () => {
    server.use(http.post(RPC_URL, () => new HttpResponse(null, { status: 429 })))

    const provider = new RetryingRpcProvider(RPC_URL, CHAIN_ID)
    let caught: unknown
    try {
      await provider.request({ method: 'eth_blockNumber', params: [] })
    } catch (err) {
      caught = err
    }
    if (!(caught instanceof RpcRetryExhaustedError)) throw new Error('unreachable')
    expect(caught.code).toBe(-32099)
    expect(caught.cause).toBeDefined()
    expect(caught.message).toContain('method=eth_blockNumber')
  })

  it('batches concurrent requests via ethers batchMaxCount', async () => {
    let httpPostCount = 0
    server.use(
      http.post(RPC_URL, async ({ request }) => {
        const items = await parseBody(request)
        httpPostCount += 1
        return respond(
          items,
          items.map((i, idx) => ({ id: i.id, result: `0x${idx}` })),
        )
      }),
    )

    const provider = new RetryingRpcProvider(RPC_URL, CHAIN_ID)
    // Three concurrent requests should coalesce into a single batched POST
    // because batchMaxCount = 3 and these fire in the same tick.
    await Promise.all([
      provider.request({ method: 'eth_blockNumber', params: [] }),
      provider.request({ method: 'eth_blockNumber', params: [] }),
      provider.request({ method: 'eth_blockNumber', params: [] }),
    ])
    expect(httpPostCount).toBe(1)
  })

  // The critical correctness test: when this provider is wrapped by viem's
  // `custom()` transport (exactly how protocol-kit consumes it), viem's outer
  // `withRetry` must NOT re-invoke our provider after `RpcRetryExhaustedError`.
  // If our error shape is wrong, viem's default-true `shouldRetry` will trigger
  // a geometric retry storm (3 × 3 = 9 HTTP calls instead of 3).
  it('regression: viem custom() transport does not retry on top of our exhausted-throttle error', async () => {
    let attempts = 0
    server.use(
      http.post(RPC_URL, () => {
        attempts += 1
        return new HttpResponse(null, { status: 429 })
      }),
    )

    const provider = new RetryingRpcProvider(RPC_URL, CHAIN_ID)
    const client = createPublicClient({ transport: custom(provider) })
    await expect(client.request({ method: 'eth_blockNumber' })).rejects.toBeDefined()
    // With correct error shape (BaseError, code -32099): exactly 3 attempts
    // (THROTTLE.maxAttempts). With a wrong shape, viem would retry on top and
    // we'd see ~9 (3 × viem's default retryCount of 3).
    expect(attempts).toBe(3)
  })
})

describe('getOrCreateReadProvider', () => {
  it('returns the same instance for the same URL+chainId', () => {
    const a = getOrCreateReadProvider('https://rpc.cache.example/v3/a', 1)
    const b = getOrCreateReadProvider('https://rpc.cache.example/v3/a', 1)
    expect(a).toBe(b)
  })

  it('returns a different instance when chainId differs', () => {
    const a = getOrCreateReadProvider('https://rpc.cache.example/v3/b', 1)
    const b = getOrCreateReadProvider('https://rpc.cache.example/v3/b', 5)
    expect(a).not.toBe(b)
  })

  it('returns a different instance when URL differs', () => {
    const a = getOrCreateReadProvider('https://rpc.cache.example/v3/c', 1)
    const b = getOrCreateReadProvider('https://rpc.cache.example/v3/d', 1)
    expect(a).not.toBe(b)
  })
})
