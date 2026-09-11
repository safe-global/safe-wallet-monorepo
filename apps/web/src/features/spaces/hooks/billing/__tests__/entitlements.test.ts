import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { getSeatsMeter } from '../entitlements'

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
})
