import { getQuotaExceededMessage } from '../quotaMessage'

const quotaError = (data: Record<string, unknown>) => ({
  status: 402,
  data: { code: 'QUOTA_EXCEEDED', quota: 20, used: 20, resetsAt: null, message: 'Quota exceeded', ...data },
})

describe('getQuotaExceededMessage', () => {
  it('says how many Safe accounts the plan covers and how many the Workspace holds', () => {
    expect(getQuotaExceededMessage(quotaError({ feature: 'safe_seats' }))).toBe(
      'Your plan covers 20 Safe accounts and this Workspace already holds 20. Remove one to add another, or upgrade your plan.',
    )
  })

  it('says how many sponsored transactions were used and when they come back', () => {
    expect(
      getQuotaExceededMessage(
        quotaError({ feature: 'sponsored_transactions', quota: 50, used: 50, resetsAt: '2026-11-01T00:00:00.000Z' }),
      ),
    ).toBe(
      'Your Workspace has used all 50 sponsored transactions of this cycle until Nov 1, 2026. Pay the gas with your connected wallet instead.',
    )
  })

  it('leaves the date out when the sponsored cycle never resets', () => {
    expect(getQuotaExceededMessage(quotaError({ feature: 'sponsored_transactions', quota: 10, used: 10 }))).toBe(
      'Your Workspace has used all 10 sponsored transactions of this cycle. Pay the gas with your connected wallet instead.',
    )
  })

  it('returns undefined for a feature without copy', () => {
    expect(getQuotaExceededMessage(quotaError({ feature: 'address_book_entries' }))).toBeUndefined()
    expect(getQuotaExceededMessage(quotaError({}))).toBeUndefined()
  })

  it('returns undefined for an error that is not a quota refusal', () => {
    expect(getQuotaExceededMessage({ status: 500, data: { message: 'Boom' } })).toBeUndefined()
  })
})
