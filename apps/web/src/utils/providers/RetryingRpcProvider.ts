import { FetchRequest, type FetchResponse, JsonRpcProvider } from 'ethers'
import { BaseError } from 'viem'

const THROTTLE = { maxAttempts: 3, slotInterval: 300 } as const
const BATCH_MAX_COUNT = 3
const RETRYABLE_RPC_CODES = new Set([-32005, -32603])

/**
 * Thrown when ethers' built-in throttle retry mechanism has exhausted its
 * attempts. Extends viem's BaseError with a numeric `code` outside viem's
 * retry set ({-1, -32005, -32603}) so that viem's `shouldRetry` returns
 * false and the outer `withRetry` wrapping our `custom()` transport does
 * NOT re-invoke this provider — preventing geometric N×M retries.
 *
 * See node_modules/viem/utils/buildRequest.ts:185 (BaseError rethrow path)
 * and :212-239 (shouldRetry). The chosen literal `-32099` sits in the
 * JSON-RPC reserved server-error range (-32000 to -32099) and is unused by
 * viem's error switch.
 *
 * Original error is preserved on the standard ES2022 `cause` (set by viem
 * `BaseError`'s constructor) — both for `Error.cause` consumers and for
 * `BaseError.walk` traversal in `isRateLimitError`.
 */
export class RpcRetryExhaustedError extends BaseError {
  readonly code = -32099

  constructor(originalError: unknown, context?: { method?: string }) {
    const method = context?.method ? ` (method=${context.method})` : ''
    super(`RPC retry exhausted after throttle${method}`, {
      cause: originalError instanceof Error ? originalError : undefined,
      name: 'RpcRetryExhaustedError',
    })
  }
}

const detectRpcThrottle = (response: FetchResponse): { code: number; message: string } | null => {
  // Note: cannot short-circuit on HTTP 2xx — JSON-RPC errors (including
  // -32005 / -32603) commonly come back with HTTP 200 OK and the error in
  // the body. HTTP-level 429 is handled by ethers BEFORE processFunc runs,
  // so we only see it here when the body is what carries the throttle.
  let body: unknown
  try {
    const text = new TextDecoder().decode(response.body ?? new Uint8Array())
    if (!text) return null
    body = JSON.parse(text)
  } catch {
    return null
  }

  const entries: Array<{ error?: { code?: number; message?: string } }> = Array.isArray(body)
    ? (body as Array<{ error?: { code?: number; message?: string } }>)
    : [body as { error?: { code?: number; message?: string } }]

  for (const entry of entries) {
    const code = entry?.error?.code
    if (typeof code === 'number' && RETRYABLE_RPC_CODES.has(code)) {
      return { code, message: entry.error?.message ?? 'rate limited' }
    }
  }
  return null
}

const isThrottleExhausted = (err: unknown): boolean => {
  if (err == null || typeof err !== 'object') return false
  const e = err as { code?: unknown; message?: unknown; shortMessage?: unknown }
  if (e.code !== 'SERVER_ERROR') return false
  const candidates = [e.message, e.shortMessage]
  return candidates.some((m) => typeof m === 'string' && m.includes('exceeded maximum retry limit'))
}

/**
 * Read-only EIP-1193 provider that retries transient RPC rate-limits (HTTP
 * 429 and JSON-RPC -32005 / -32603) using ethers v6's built-in throttle
 * machinery, then surfaces a typed `RpcRetryExhaustedError` if retries are
 * exhausted.
 *
 * Construct via `getOrCreateReadProvider(url)` to share one instance per URL
 * — that way ethers' concurrent-call batching (`batchMaxCount`) coalesces
 * reads across `Safe.init` and `getSafeProvider` callers instead of fanning
 * out one HTTP POST per call site. Tests construct directly to bypass the
 * cache.
 */
export class RetryingRpcProvider {
  readonly #provider: JsonRpcProvider

  /**
   * @param url      JSON-RPC endpoint URL
   * @param chainId  Optional chain id. When provided, ethers skips its initial
   *                 `eth_chainId` probe (which can otherwise be batched into
   *                 the first user RPC call and complicates throttle scenarios).
   */
  constructor(url: string, chainId?: number) {
    const req = new FetchRequest(url)
    req.setThrottleParams(THROTTLE)
    req.processFunc = async (_request, response) => {
      const throttleHit = detectRpcThrottle(response)
      if (throttleHit) {
        // Hand control to ethers' built-in throttle path (fetch.js:481-498)
        // by throwing an error with { throttle: true, stall }. stall=0 lets
        // ethers compute its own backoff: slotInterval * trunc(random() * 2^attempt).
        response.throwThrottleError(`RPC ${throttleHit.code}: ${throttleHit.message}`, 0)
      }
      return response
    }
    this.#provider = new JsonRpcProvider(req, chainId, {
      batchMaxCount: BATCH_MAX_COUNT,
      ...(chainId != null ? { staticNetwork: true } : {}),
    })
  }

  // Signature matches ethers' Eip1193Provider so consumers like protocol-kit /
  // viem's `custom()` transport accept this instance without type assertions.
  request = async ({
    method,
    params = [],
  }: {
    method: string
    params?: readonly unknown[] | object
  }): Promise<unknown> => {
    try {
      return await this.#provider.send(method, (Array.isArray(params) ? params : [params]) as unknown[])
    } catch (err) {
      if (isThrottleExhausted(err)) throw new RpcRetryExhaustedError(err, { method })
      throw err
    }
  }
}

// Module-level cache so callers that share an RPC URL share the underlying
// `JsonRpcProvider` (and thus its batch scheduler). Without this,
// `getSafeProvider()` was creating a fresh wrapper on each call from
// `safeContracts.ts` (multiple call sites), defeating concurrent-call
// batching and triggering an extra `eth_chainId` probe per instance.
const providerCache = new Map<string, RetryingRpcProvider>()

export const getOrCreateReadProvider = (url: string, chainId?: number): RetryingRpcProvider => {
  // Cache key includes chainId so a misconfigured URL→chain reassignment
  // (rare, but possible in env overrides) doesn't reuse a stale wrapper.
  const key = `${chainId ?? 'auto'}:${url}`
  let provider = providerCache.get(key)
  if (!provider) {
    provider = new RetryingRpcProvider(url, chainId)
    providerCache.set(key, provider)
  }
  return provider
}
