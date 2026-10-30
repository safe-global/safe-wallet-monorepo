import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { selectCheckRequestedAtMs } from '@safe-global/store/safenet/safenetCheckSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { Errors, logError } from '@/services/exceptions'
import { getStoreInstance, makeStore, setStoreInstance } from '@/store'
import { setAuthenticated } from '@/store/authSlice'
import { chainBuilder } from '@/tests/builders/chains'
import { server } from '@/tests/server'
import { MixpanelEventParams, SAFENET_EVENTS, trackEvent } from '@/services/analytics'
import { requestSafenetCheck as requestCheck } from '../requestSafenetCheck'

jest.mock('@/services/exceptions', () => ({ ...jest.requireActual('@/services/exceptions'), logError: jest.fn() }))
jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

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

// Matches any Workspace id, so a request sent with a wrong or missing one is still recorded
const mockCheckRoute = (chainId: string, status = 202) => {
  const received = jest.fn()
  server.use(
    http.post(
      `${GATEWAY_URL}/v1/spaces/:spaceId/chains/${chainId}/safes/${safeAddress}/safenet/checks`,
      async ({ request, params }) => {
        received({ spaceId: params.spaceId, body: await request.json(), credentials: request.credentials })
        return new HttpResponse(null, { status })
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

  it('records the request time of an accepted check in the Safenet slice', async () => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    mockCheckRoute(chainId)
    const before = Date.now()

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash })

    const state = getStoreInstance().getState()
    expect(selectCheckRequestedAtMs(state, { chainId, safeAddress, safeTxHash })).toBeGreaterThanOrEqual(before)
  })

  it.each([403, 500])('records no request time when CGW answers %s', async (status) => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    mockCheckRoute(chainId, status)

    await requestSafenetCheck({ chainId, safeAddress, safeTxHash })

    const state = getStoreInstance().getState()
    expect(selectCheckRequestedAtMs(state, { chainId, safeAddress, safeTxHash })).toBeUndefined()
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

  it.each([500, 402])('resolves, logs once and tracks nothing when CGW answers %s', async (status) => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    mockCheckRoute(chainId, status)

    await expect(requestSafenetCheck({ chainId, safeAddress, safeTxHash })).resolves.toBeUndefined()

    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(Errors._652, expect.objectContaining({ status }))
    expect(trackEvent).not.toHaveBeenCalled()
  })

  it.each([
    ['refuses the Workspace (membership, Safe or plan)', 403],
    ['reports the Workspace daily limit as used', 429],
    ['does not offer checks on the chain', 501],
  ])('resolves without logging when CGW %s', async (_title, status) => {
    const chainId = await setupStore({ features: [FEATURES.SAFENET_CHECKS] })
    mockCheckRoute(chainId, status)

    await expect(requestSafenetCheck({ chainId, safeAddress, safeTxHash })).resolves.toBeUndefined()

    expect(logError).not.toHaveBeenCalled()
    expect(trackEvent).not.toHaveBeenCalled()
  })
})
