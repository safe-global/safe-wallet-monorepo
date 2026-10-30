import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { delay } from '@safe-global/utils/utils/helpers'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { Errors, logError } from '@/services/exceptions'
import { makeStore, setStoreInstance } from '@/store'
import { setAuthenticated } from '@/store/authSlice'
import { chainBuilder } from '@/tests/builders/chains'
import { server } from '@/tests/server'
import { MixpanelEventParams, SAFENET_EVENTS, trackEvent } from '@/services/analytics'
import { requestSafenetCheck as requestCheck } from '../requestSafenetCheck'

jest.mock('@/services/exceptions', () => ({ ...jest.requireActual('@/services/exceptions'), logError: jest.fn() }))
jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))
jest.mock('@safe-global/utils/utils/helpers', () => {
  const actual = jest.requireActual('@safe-global/utils/utils/helpers')
  return { ...actual, delay: jest.fn(actual.delay) }
})

const safeAddress = faker.finance.ethereumAddress()
const safeTxHash = faker.string.hexadecimal({ length: 64 })
const spaceId = faker.string.uuid()

const openPage = (query: string) => window.history.replaceState(null, '', `/transactions/queue?${query}`)

const setupStore = async ({ features, signedIn = true }: { features: FEATURES[]; signedIn?: boolean }) => {
  const chain = chainBuilder().with({ features }).build()
  const store = makeStore()
  setStoreInstance(store)
  await store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryData(
      'getChainsConfigV2',
      CONFIG_SERVICE_KEY,
      chainsAdapter.setAll(chainsInitialState, [chain]),
    ),
  )
  if (signedIn) store.dispatch(setAuthenticated(Date.now() + 60_000))
  return chain.chainId
}

type Reply = number | (() => Response)

const htmlTooManyRequests = () =>
  new HttpResponse('<html><body><h1>429 Too Many Requests</h1></body></html>', {
    status: 429,
    headers: { 'Content-Type': 'text/html' },
  })

const dailyLimitReached = () =>
  HttpResponse.json(
    { message: 'Daily Safenet check limit reached for this workspace', statusCode: 429 },
    { status: 429 },
  )

// Matches any Workspace id, so a request sent with a wrong or missing one is still recorded.
// The nth request gets the nth reply; the last reply repeats.
const mockCheckRoute = (chainId: string, ...replies: Reply[]) => {
  const sequence = replies.length > 0 ? replies : [202]
  const received = jest.fn()
  server.use(
    http.post(
      `${GATEWAY_URL}/v1/spaces/:spaceId/chains/${chainId}/safes/${safeAddress}/safenet/checks`,
      async ({ request, params }) => {
        const reply = sequence[Math.min(received.mock.calls.length, sequence.length - 1)]
        received({ spaceId: params.spaceId, body: await request.json(), credentials: request.credentials })
        return typeof reply === 'function' ? reply() : new HttpResponse(null, { status: reply })
      },
    ),
  )
  return received
}

const requestSafenetCheck = (
  args: { chainId: string; safeAddress: string; safeTxHash: string },
  isFirstSignature = true,
) => requestCheck({ ...args, isFirstSignature })

describe('requestSafenetCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    openPage(`safe=gno:${safeAddress}&spaceId=${spaceId}`)
  })

  it('posts the safeTxHash to the check route of the Workspace in the page URL', async () => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    const received = mockCheckRoute(chainId)

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash })

    expect(received).toHaveBeenCalledTimes(1)
    expect(received).toHaveBeenCalledWith({ spaceId, body: { safeTxHash }, credentials: 'include' })
    expect(logError).not.toHaveBeenCalled()
  })

  it('tracks one submission for the first signature and none for a co-signature', async () => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    mockCheckRoute(chainId)

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash }, false)
    expect(trackEvent).not.toHaveBeenCalled()

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash })
    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(SAFENET_EVENTS.SUBMITTED, {
      [MixpanelEventParams.SAFE_TX_HASH]: safeTxHash,
    })
  })

  it('sends nothing for a chain that does not list SAFENET_CHECKS', async () => {
    const chainId = await setupStore({ features: [] })
    const received = mockCheckRoute(chainId)

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash })

    expect(received).not.toHaveBeenCalled()
    expect(trackEvent).not.toHaveBeenCalled()
  })

  it.each([
    ['outside a Workspace', `safe=gno:${safeAddress}`],
    ['for a legacy numeric Workspace id', `safe=gno:${safeAddress}&spaceId=42`],
  ])('sends nothing %s', async (_title, query) => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    const received = mockCheckRoute(chainId)
    openPage(query)

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash })

    expect(received).not.toHaveBeenCalled()
    expect(trackEvent).not.toHaveBeenCalled()
    expect(logError).not.toHaveBeenCalled()
  })

  it('sends nothing without a Workspace session', async () => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS], signedIn: false })
    const received = mockCheckRoute(chainId)

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash })

    expect(received).not.toHaveBeenCalled()
    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('sends once, logs once and tracks nothing when CGW rejects the request for good', async () => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    const received = mockCheckRoute(chainId, 404)

    await expect(requestSafenetCheck({ chainId, safeAddress, safeTxHash })).resolves.toBeUndefined()

    expect(received).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(Errors._652, expect.objectContaining({ status: 404 }))
    expect(trackEvent).not.toHaveBeenCalled()
  })

  it.each<[string, Reply]>([
    ['lacks the plan entitlement', 402],
    ['refuses the Workspace (membership or Safe)', 403],
    ['does not offer checks on the chain', 501],
    ['reports the Workspace daily limit as used', dailyLimitReached],
  ])('sends once and logs nothing when CGW %s', async (_title, reply) => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    const received = mockCheckRoute(chainId, reply)

    await expect(requestSafenetCheck({ chainId, safeAddress, safeTxHash })).resolves.toBeUndefined()

    expect(received).toHaveBeenCalledTimes(1)
    expect(logError).not.toHaveBeenCalled()
    expect(trackEvent).not.toHaveBeenCalled()
  })

  describe('transient failures', () => {
    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    // Runs the fake clock until the request, retries included, has settled
    const settle = async (request: Promise<void>): Promise<void> => {
      let isSettled = false
      void request.then(() => {
        isSettled = true
      })
      while (!isSettled) await jest.advanceTimersByTimeAsync(1_000)
    }

    it.each<[string, Reply]>([
      ['a 5xx', 500],
      ['a request timeout', 408],
      ['a network error', () => HttpResponse.error()],
    ])('retries after %s and stops once CGW accepts the check', async (_title, failure) => {
      const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
      const received = mockCheckRoute(chainId, failure, 202)

      await settle(requestSafenetCheck({ chainId, safeAddress, safeTxHash }))

      expect(received).toHaveBeenCalledTimes(2)
      expect(logError).not.toHaveBeenCalled()
    })

    it('retries a 429 that is not CGW JSON three times with backoff, then logs once', async () => {
      const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
      const received = mockCheckRoute(chainId, htmlTooManyRequests)

      await settle(requestSafenetCheck({ chainId, safeAddress, safeTxHash }))

      const parseError = expect.objectContaining({ status: 'PARSING_ERROR', originalStatus: 429 })

      expect(received).toHaveBeenCalledTimes(4)
      expect(jest.mocked(delay).mock.calls).toEqual([[2_000], [5_000], [15_000]])
      expect(logError).toHaveBeenCalledTimes(1)
      expect(logError).toHaveBeenCalledWith(Errors._652, parseError)
    })
  })
})
