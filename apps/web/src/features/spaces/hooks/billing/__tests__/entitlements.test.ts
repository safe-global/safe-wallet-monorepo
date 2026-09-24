import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { getSeatsMeter, getSponsoredTxsMeter, isEntitled } from '../entitlements'

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

describe('isEntitled', () => {
  const binary = (enabled: boolean) => response([{ feature: 'sponsored_transactions', type: 'binary', enabled }])

  it('grants a feature only while the plan enables it', () => {
    expect(isEntitled(binary(true), 'sponsored_transactions')).toBe(true)
    expect(isEntitled(binary(false), 'sponsored_transactions')).toBe(false)
  })

  it('does not grant a feature the response does not carry', () => {
    expect(isEntitled(binary(true), 'policies')).toBe(false)
    expect(isEntitled(undefined, 'policies')).toBe(false)
  })
})
