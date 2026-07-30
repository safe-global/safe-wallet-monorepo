import { configureStore } from '@reduxjs/toolkit'
import { policiesApi } from '../index'
import { PolicyType } from '../types'
import type { GetActivePoliciesResponse, GetPendingPoliciesResponse, GetPoliciesResponse } from '../types'
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

/** The Safe reference CGW routes expect: `chainId:safeAddress`, with the colon encoded. */
const SAFE_SEGMENT = `${CHAIN_ID}%3A${SAFE_ADDRESS}`
const BASE = `${GATEWAY_URL}/v1/spaces/${SPACE_ID}/safes/${SAFE_SEGMENT}/policies`

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

  it('requests the space-scoped catalogue and passes the payload through', async () => {
    const items: GetPoliciesResponse['items'] = [
      {
        type: PolicyType.TokenWithdraw,
        title: 'Token withdraw allowlist',
        description: 'Restrict, per token, which addresses the Safe can send to.',
        available: false,
        configuredCount: 1,
        // CGW reports no wiring for the catalogue entries.
        enforcement: null,
      },
    ]
    const fetchMock = mockFetch({ items })

    const result = await store.dispatch(policiesApi.endpoints.policiesGetPoliciesV1.initiate(arg))

    expect(result.isSuccess).toBe(true)
    expect(result.data).toEqual({ items })
    expect(requestOf(fetchMock).url).toBe(BASE)
  })

  it('requests /active and keeps the AllowPolicy entry', async () => {
    const items: GetActivePoliciesResponse['items'] = [
      {
        id: ZERO_HASH,
        type: PolicyType.Allow,
        enabled: true,
        enforcement: guardEnforcement,
        data: {},
      },
    ]
    const fetchMock = mockFetch({ items })

    const result = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

    expect(result.data?.items[0].type).toBe(PolicyType.Allow)
    expect(requestOf(fetchMock).url).toBe(`${BASE}/active`)
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
    expect(requestOf(fetchMock).url).toBe(`${BASE}/pending`)
  })

  // /v1/spaces is a credentialed route — CGW answers 403 without the session cookie.
  it('sends credentials with policy requests', async () => {
    const fetchMock = mockFetch({ items: [] })

    await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

    expect(requestOf(fetchMock).credentials).toBe('include')
  })

  it('caches by arg (same store + same arg → one request)', async () => {
    const fetchMock = mockFetch({ items: [] })

    const a = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))
    const b = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

    expect(a.data).toEqual(b.data)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
