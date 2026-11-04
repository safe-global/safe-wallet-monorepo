import { QuotaExceededError, getQuotaExceededError } from '../quotaErrors'

describe('getQuotaExceededError', () => {
  it('reads the CGW 402 body into a typed error', () => {
    const result = getQuotaExceededError({
      status: 402,
      data: {
        code: 'QUOTA_EXCEEDED',
        message: 'Quota exceeded for sponsored_transactions: 50 of 50 used.',
        feature: 'sponsored_transactions',
        quota: 50,
        used: 50,
        resetsAt: '2026-11-01T00:00:00.000Z',
      },
    })

    expect(result).toBeInstanceOf(QuotaExceededError)
    expect(result).toMatchObject({
      feature: 'sponsored_transactions',
      quota: 50,
      used: 50,
      resetsAt: '2026-11-01T00:00:00.000Z',
      message: 'Quota exceeded for sponsored_transactions: 50 of 50 used.',
    })
  })

  it('keeps a null reset for a feature that never restarts', () => {
    expect(
      getQuotaExceededError({
        status: 402,
        data: { code: 'QUOTA_EXCEEDED', feature: 'safe_seats', quota: 2, used: 2, resetsAt: null },
      }),
    ).toMatchObject({ feature: 'safe_seats', quota: 2, resetsAt: null })
  })

  it.each([
    ['another CGW code', { status: 422, data: { code: 'SIMULATION_FAILED', message: 'x' } }],
    ['a plain Error', new Error('boom')],
    ['a fetch error without data', { status: 'FETCH_ERROR', error: 'network' }],
    ['non-object data', { status: 402, data: 'Payment Required' }],
    ['null', null],
  ])('returns undefined for %s', (_label, input) => {
    expect(getQuotaExceededError(input)).toBeUndefined()
  })
})
