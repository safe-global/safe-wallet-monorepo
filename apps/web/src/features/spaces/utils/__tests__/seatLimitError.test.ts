import { getSeatLimitMessage } from '../seatLimitError'

describe('getSeatLimitMessage', () => {
  it('words the spent seat allowance', () => {
    expect(
      getSeatLimitMessage({
        status: 402,
        data: { code: 'QUOTA_EXCEEDED', feature: 'safe_seats', quota: 2, used: 2, resetsAt: null },
      }),
    ).toBe(
      'Your plan covers 2 Safe accounts and this Workspace already holds 2. Remove one to add another, or upgrade your plan.',
    )
  })

  it('leaves other errors, and other quotas, to the generic handling', () => {
    expect(getSeatLimitMessage({ status: 500, data: { message: 'boom' } })).toBeUndefined()
    expect(
      getSeatLimitMessage({
        status: 402,
        data: { code: 'QUOTA_EXCEEDED', feature: 'sponsored_transactions', quota: 50, used: 50, resetsAt: null },
      }),
    ).toBeUndefined()
  })
})
