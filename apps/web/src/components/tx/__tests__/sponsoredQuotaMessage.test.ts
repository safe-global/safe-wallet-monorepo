import { QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import { sponsoredQuotaMessage } from '../sponsoredQuotaMessage'

describe('sponsoredQuotaMessage', () => {
  it('says how many were used and when they come back', () => {
    expect(
      sponsoredQuotaMessage(new QuotaExceededError('sponsored_transactions', 50, 50, '2026-11-01T00:00:00.000Z', 'x')),
    ).toBe(
      'Your Workspace has used all 50 sponsored transactions of this cycle until Nov 1, 2026. Pay the gas with your connected wallet instead.',
    )
  })

  it('leaves the date out when the cycle never resets', () => {
    expect(sponsoredQuotaMessage(new QuotaExceededError('sponsored_transactions', 10, 10, null, 'x'))).toBe(
      'Your Workspace has used all 10 sponsored transactions of this cycle. Pay the gas with your connected wallet instead.',
    )
  })
})
