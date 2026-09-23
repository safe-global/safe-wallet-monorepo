import type { EntitlementsResponse, FeatureKey } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { getPolicyEngineAccess, getSeatsMeter, getSponsoredTxsMeter } from '../entitlements'

const response = (entitlements: EntitlementsResponse['entitlements']): EntitlementsResponse => ({
  plan: { id: 'plan', name: 'Business', cycleEndsAt: '2026-12-06T00:00:00Z' },
  entitlements,
})

describe('getSeatsMeter', () => {
  it('reads used and quota from the metered safe_seats entitlement', () => {
    const data = response([
      { feature: 'safe_seats', type: 'metered', enabled: true, quota: 10, used: 6, resetsAt: null },
    ])
    expect(getSeatsMeter(data)).toEqual({ used: 6, quota: 10 })
  })

  it('keeps a null quota as unlimited and tolerates usage above quota', () => {
    expect(
      getSeatsMeter(
        response([{ feature: 'safe_seats', type: 'metered', enabled: true, quota: null, used: 3, resetsAt: null }]),
      ),
    ).toEqual({ used: 3, quota: null })
    expect(
      getSeatsMeter(
        response([{ feature: 'safe_seats', type: 'metered', enabled: false, quota: 2, used: 5, resetsAt: null }]),
      ),
    ).toEqual({ used: 5, quota: 2 })
  })

  it('returns null without data or when the feature is not metered', () => {
    expect(getSeatsMeter(undefined)).toBeNull()
    expect(getSeatsMeter(response([]))).toBeNull()
    expect(getSeatsMeter(response([{ feature: 'safe_seats', type: 'binary', enabled: true }]))).toBeNull()
  })

  it('reads the sponsored transactions meter from its own entitlement', () => {
    const data = response([
      { feature: 'safe_seats', type: 'metered', enabled: true, quota: 2, used: 2, resetsAt: null },
      {
        feature: 'sponsored_transactions',
        type: 'metered',
        enabled: true,
        quota: 10,
        used: 0,
        resetsAt: '2026-10-17T15:52:37.000Z',
      },
    ])
    expect(getSponsoredTxsMeter(data)).toEqual({ used: 0, quota: 10, resetsAt: '2026-10-17T15:52:37.000Z' })
    expect(getSponsoredTxsMeter(response([]))).toBeNull()
  })
})

describe('getPolicyEngineAccess', () => {
  // The catalogue does not publish the key yet, so the tests spell it as the CGW will.
  const policyEngine = 'policy_engine' as FeatureKey

  it('should, when the plan carries the policy engine entitlement, read whether it is enabled', () => {
    expect(getPolicyEngineAccess(response([{ feature: policyEngine, type: 'binary', enabled: true }]))).toBe(true)
    expect(getPolicyEngineAccess(response([{ feature: policyEngine, type: 'binary', enabled: false }]))).toBe(false)
  })

  it('should, when the catalogue has no policy engine key or there is no data, stay undefined', () => {
    expect(getPolicyEngineAccess(undefined)).toBeUndefined()
    expect(getPolicyEngineAccess(response([]))).toBeUndefined()
    expect(getPolicyEngineAccess(response([{ feature: 'safe_seats', type: 'binary', enabled: true }]))).toBeUndefined()
  })
})
