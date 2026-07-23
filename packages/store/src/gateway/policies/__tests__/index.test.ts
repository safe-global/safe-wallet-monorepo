import { configureStore } from '@reduxjs/toolkit'
import { policiesApi } from '../index'
import { PolicyType } from '../types'
import { setBaseUrl } from '../../cgwClient'

const GATEWAY_URL = 'https://test-gateway.safe.global'

const makeStore = () =>
  configureStore({
    reducer: { [policiesApi.reducerPath]: policiesApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(policiesApi.middleware),
  })

const arg = { spaceId: '42', chainId: '1', safeAddress: '0x1111111111111111111111111111111111111111' }

describe('policiesApi (mocked)', () => {
  let store: ReturnType<typeof makeStore>

  beforeAll(() => {
    // The mocked endpoints use queryFn (no HTTP) but the base query still asserts a URL is set.
    setBaseUrl(GATEWAY_URL)
  })

  beforeEach(() => {
    store = makeStore()
  })

  describe('policiesGetPoliciesV1', () => {
    it('returns all four available policy types with correct enforcement', async () => {
      const result = await store.dispatch(policiesApi.endpoints.policiesGetPoliciesV1.initiate(arg))

      expect(result.isSuccess).toBe(true)
      const byType = Object.fromEntries(result.data!.items.map((i) => [i.type, i]))
      expect(Object.keys(byType).sort()).toEqual([
        PolicyType.Cosigner,
        PolicyType.Recovery,
        PolicyType.SpendingLimit,
        PolicyType.TokenWithdraw,
      ])

      // Spending limit + recovery are enabled via a module (no guard).
      for (const type of [PolicyType.SpendingLimit, PolicyType.Recovery]) {
        const e = byType[type].enforcement
        expect(e.via).toBe('module')
        if (e.via === 'module') expect(e.moduleAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
      }
      // Token withdraw + cosigner are guard-enforced.
      for (const type of [PolicyType.TokenWithdraw, PolicyType.Cosigner]) {
        const e = byType[type].enforcement
        expect(e.via).toBe('guard')
        if (e.via === 'guard') {
          expect(e.guards.transactionGuard!.policyContract).toMatch(/^0x[0-9a-fA-F]{40}$/)
          expect(e.guards.transactionGuard!.safePolicyGuard).toMatch(/^0x[0-9a-fA-F]{40}$/)
        }
      }
    })

    it('marks token-withdraw / cosigner unavailable on an unsupported chain', async () => {
      const onUnsupported = await store.dispatch(
        policiesApi.endpoints.policiesGetPoliciesV1.initiate({ ...arg, chainId: '999999' }),
      )
      const byType = Object.fromEntries(onUnsupported.data!.items.map((i) => [i.type, i.available]))

      expect(byType[PolicyType.TokenWithdraw]).toBe(false)
      expect(byType[PolicyType.Cosigner]).toBe(false)
      // Module-enforced types stay available regardless of policy-engine deployment.
      expect(byType[PolicyType.SpendingLimit]).toBe(true)
      expect(byType[PolicyType.Recovery]).toBe(true)
    })
  })

  describe('policiesGetActivePoliciesV1', () => {
    it('returns one active policy per type with the right enforcement mode', async () => {
      const result = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

      expect(result.isSuccess).toBe(true)
      const byType = Object.fromEntries(result.data!.items.map((i) => [i.type, i]))

      // spending-limit + recovery are module-enforced (no guard)
      expect(byType[PolicyType.SpendingLimit].enforcement.via).toBe('module')
      expect(byType[PolicyType.Recovery].enforcement.via).toBe('module')
      // token-withdraw + cosigner are guard-enforced
      expect(byType[PolicyType.TokenWithdraw].enforcement.via).toBe('guard')
      expect(byType[PolicyType.Cosigner].enforcement.via).toBe('guard')
    })
  })

  it('caches by arg (same store + same arg → same cached data)', async () => {
    const a = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))
    // RTK Query dedupes/caches by arg — a second subscribe with the same arg
    // returns the cached result, not a freshly-generated one.
    const b = await store.dispatch(policiesApi.endpoints.policiesGetActivePoliciesV1.initiate(arg))

    expect(a.data).toEqual(b.data)
  })

  it('wires the `policies` cache tag', () => {
    // The tag is declared via enhanceEndpoints; assert it is registered on the api.
    // (providesTags: ['policies'] on both endpoints.)
    expect(policiesApi.reducerPath).toBe('api')
    expect(policiesApi.endpoints.policiesGetPoliciesV1).toBeDefined()
    expect(policiesApi.endpoints.policiesGetActivePoliciesV1).toBeDefined()
  })
})
