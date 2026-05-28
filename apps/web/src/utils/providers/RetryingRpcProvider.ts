import { FetchRequest, type FetchResponse, JsonRpcProvider } from 'ethers'
import { BaseError } from 'viem'

const THROTTLE = { maxAttempts: 3, slotInterval: 300 } as const
const BATCH_MAX_COUNT = 3
const RETRYABLE_RPC_CODES = new Set([-32005, -32603])

/**
 * Thrown when ethers' built-in throttle retry mechanism has exhausted its
 * attempts. Extends viem's BaseError with a numeric `code` outside viem's
 * retry set (`{-1, -32005, -32603}`) so that viem's `shouldRetry` returns
 * false and the outer `withRetry` wrapping our `custom()` transport does
 * NOT re-invoke this provider — preventing geometric N×M retries.
 *
 * See node_modules/viem/utils/buildRequest.ts:185 (BaseError rethrow path)
 * and :212-239 (shouldRetry).
 */
export class RpcRetryExhaustedError extends BaseError {
  readonly code = -32099
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super('RPC retry exhausted after throttle', {
      cause: originalError instanceof Error ? originalError : undefined,
      name: 'RpcRetryExhaustedError',
    })
    this.originalError = originalError
  }
}

const detectRpcThrottle = (response: FetchResponse): { code: number; message: string } | null => {
  let body: unknown
  try {
    const text = new TextDecoder().decode(response.body ?? new Uint8Array())
    body = JSON.parse(text)
  } catch {
    return null
  }
  const errors = Array.isArray(body)
    ? body.map((entry) => (entry as { error?: { code?: number; message?: string } } | null)?.error).filter(Boolean)
    : [(body as { error?: { code?: number; message?: string } } | null)?.error].filter(Boolean)
  const hit = (errors as Array<{ code?: number; message?: string }>).find(
    (err) => typeof err.code === 'number' && RETRYABLE_RPC_CODES.has(err.code),
  )
  return hit && typeof hit.code === 'number' ? { code: hit.code, message: hit.message ?? 'rate limited' } : null
}

const isThrottleExhausted = (err: unknown): boolean => {
  if (err == null || typeof err !== 'object') return false
  const e = err as { code?: unknown; message?: unknown; shortMessage?: unknown }
  if (e.code !== 'SERVER_ERROR') return false
  const messages = [e.message, e.shortMessage].filter((s): s is string => typeof s === 'string')
  return messages.some((m) => m.includes('exceeded maximum retry limit'))
}

/**
 * Read-only EIP-1193 provider that retries transient RPC rate-limits (HTTP
 * 429 and JSON-RPC -32005 / -32603) using ethers v6's built-in throttle
 * machinery, then surfaces a typed `RpcRetryExhaustedError` if retries are
 * exhausted.
 *
 * Passed to `Safe.init({ provider })` instead of a URL string so that
 * protocol-kit routes through viem's `custom()` (pass-through) transport
 * over this wrapper, gaining retry/backoff without giving viem a chance
 * to retry on top of us.
 */
export class RetryingRpcProvider {
  readonly #provider: JsonRpcProvider

  /**
   * @param url   JSON-RPC endpoint URL
   * @param chainId  Optional chain id. When provided, ethers skips its initial
   *                 `eth_chainId` probe — which is desirable both for latency
   *                 and to avoid the probe being batched together with the
   *                 first user RPC call (the JsonRpcApiProvider's batch
   *                 scheduler queues both into one POST otherwise).
   */
  constructor(url: string, chainId?: number) {
    const req = new FetchRequest(url)
    req.setThrottleParams(THROTTLE)
    req.processFunc = async (_request, response) => {
      const throttleHit = detectRpcThrottle(response)
      if (throttleHit) {
        // Hand control to ethers' built-in throttle path (fetch.js:481-498)
        // by throwing an error with { throttle: true, stall }. stall=0 lets
        // ethers compute its own backoff (slotInterval * trunc(random() * 2^attempt)).
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
      if (isThrottleExhausted(err)) throw new RpcRetryExhaustedError(err)
      throw err
    }
  }
}
