import { configureStore } from '@reduxjs/toolkit'
import { policiesApi, DEFAULT_POLICY_TYPES } from '../index'
import { PolicyType } from '../types'
import type { GetActivePoliciesResponse, GetPendingPoliciesResponse } from '../types'
import { setBaseUrl } from '../../cgwClient'

const GATEWAY_URL = 'https://test-gateway.safe.global'

const SPACE_ID = 'space-1'
const CHAIN_ID = '1'
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const POLICY_CONTRACT = '0x2222222222222222222222222222222222222222'
const SAFE_POLICY_GUARD = '0x3333333333333333333333333333333333333333'
const ZERO_HASH = `0x${'0'.repeat(64)}`
const CONFIGURE_ROOT = `0x${'ab'.repeat(32)}`

const makeStore = () =>
  configureStore({
    reducer: { [policiesApi.reducerPath]: policiesApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(policiesApi.middleware),
  })

const arg = { spaceId: SPACE_ID, chainId: CHAIN_ID, safeAddress: SAFE_ADDRESS }

/** The reads are space-scoped and filter by Safe; only the write path addresses the Safe in its URL. */
const READS = `${GATEWAY_URL}/v1/spaces/${SPACE_ID}/policies`
const WRITE_BASE = `${GATEWAY_URL}/v1/spaces/${SPACE_ID}/chains/${CHAIN_ID}/safes/${SAFE_ADDRESS}/policies`

/** `types` is mandatory and `safes` narrows to one Safe; both comma-separated. */
const readQuery = `types=${encodeURIComponent(DEFAULT_POLICY_TYPES.join(','))}&safes=${encodeURIComponent(`${CHAIN_ID}:${SAFE_ADDRESS}`)}`

const guardEnforcement = {
  via: 'guard' as const,
  guards: { transactionGuard: { policyContract: POLICY_CONTRACT, safePolicyGuard: SAFE_POLICY_GUARD } },
}

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

const mockFetch = (body: unknown) => {
  const fetchMock = jest.fn().mockResolvedValue(jsonResponse(body))
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

/** The request the base query actually issued. */
const requestOf = (fetchMock: jest.Mock): Request => fetchMock.mock.calls[0][0] as Request

describe('policiesApi', () => {
  let store: ReturnType<typeof makeStore>

  beforeAll(() => {
    setBaseUrl(GATEWAY_URL)
  })

  beforeEach(() => {
    store = makeStore()
    jest.restoreAllMocks()
  })

  // The endpoint answers with a bare array; there is no `items` envelope to unwrap.
  it('requests /active and passes the bare array through', async () => {
    const items: GetActivePoliciesResponse = [
      {
        type: PolicyType.Allow,
        enabled: true,
        enforcement: guardEnforcement,
        safe: { chainId: CHAIN_ID, address: SAFE_ADDRESS },
        data: {},
      },
    ]
    const fetchMock = mockFetch(items)

    const result = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

    expect(result.data).toHaveLength(1)
    expect(result.data?.[0].type).toBe(PolicyType.Allow)
    expect(requestOf(fetchMock).url).toBe(`${READS}/active?${readQuery}`)
  })

  it('requests /pending and accepts items whose policy could not be decoded', async () => {
    const items: GetPendingPoliciesResponse['items'] = [
      {
        configureRoot: CONFIGURE_ROOT,
        requestedAt: 1_000,
        readyAt: 1_000 + 86_400,
        isReady: true,
        policy: null,
      },
    ]
    const fetchMock = mockFetch({ items })

    const result = await store.dispatch(policiesApi.endpoints.policiesGetPendingPoliciesV1.initiate(arg))

    expect(result.data?.items[0].policy).toBeNull()
    expect(result.data?.items[0].isReady).toBe(true)
    expect(requestOf(fetchMock).url).toBe(`${READS}/pending?${readQuery}`)
  })

  // /v1/spaces is a credentialed route — CGW answers 403 without the session cookie.
  it('sends credentials with policy requests', async () => {
    const fetchMock = mockFetch({ items: [] })

    await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

    expect(requestOf(fetchMock).credentials).toBe('include')
  })

  describe('policiesCreateRequestV1', () => {
    const configurations = [
      {
        target: POLICY_CONTRACT,
        selector: '0xa9059cbb',
        operation: 0 as const,
        policy: SAFE_POLICY_GUARD,
        data: '0x',
      },
    ]

    it('POSTs the root and configurations to /requests', async () => {
      const fetchMock = mockFetch({ root: CONFIGURE_ROOT })

      const result = await store.dispatch(
        policiesApi.endpoints.policiesCreateRequestV1.initiate({ ...arg, root: CONFIGURE_ROOT, configurations }),
      )

      expect(result.data).toEqual({ root: CONFIGURE_ROOT })

      const request = requestOf(fetchMock)
      expect(request.url).toBe(`${WRITE_BASE}/requests`)
      expect(request.method).toBe('POST')
      // The route arg is not part of the body.
      await expect(request.json()).resolves.toEqual({ root: CONFIGURE_ROOT, configurations })
    })

    it('sends credentials', async () => {
      const fetchMock = mockFetch({ root: CONFIGURE_ROOT })

      await store.dispatch(
        policiesApi.endpoints.policiesCreateRequestV1.initiate({ ...arg, root: CONFIGURE_ROOT, configurations }),
      )

      expect(requestOf(fetchMock).credentials).toBe('include')
    })

    it('surfaces the status so the caller can tell a cap (400) from a client bug (422)', async () => {
      global.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 422 })) as unknown as typeof fetch

      const result = await store.dispatch(
        policiesApi.endpoints.policiesCreateRequestV1.initiate({ ...arg, root: CONFIGURE_ROOT, configurations }),
      )

      expect(result.error).toEqual(expect.objectContaining({ status: 422 }))
    })
  })

  it('caches by arg (same store + same arg → one request)', async () => {
    const fetchMock = mockFetch({ items: [] })

    const a = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))
    const b = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

    expect(a.data).toEqual(b.data)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
