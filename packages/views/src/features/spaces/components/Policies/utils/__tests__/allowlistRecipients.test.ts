import { MOCK_ADDRESSES, MOCK_TOKENS } from '@/features/spaces/components/Policies/mocks/policies'
import { getAllowlistRecipients } from '../allowlistRecipients'

describe('getAllowlistRecipients', () => {
  it('should list a recipient allowed for several tokens once, in first-seen order', () => {
    const recipients = getAllowlistRecipients({
      entries: [
        { token: MOCK_TOKENS.usdc, recipients: [{ account: MOCK_ADDRESSES.bob, permission: 'ALWAYS' }] },
        {
          token: MOCK_TOKENS.usdt,
          recipients: [
            { account: MOCK_ADDRESSES.alice, permission: 'ONCE' },
            { account: MOCK_ADDRESSES.bob.toLowerCase(), permission: 'ALWAYS' },
          ],
        },
      ],
    })

    expect(recipients).toEqual([MOCK_ADDRESSES.bob, MOCK_ADDRESSES.alice])
  })

  it('should return no recipients for an empty allowlist', () => {
    expect(getAllowlistRecipients({ entries: [] })).toEqual([])
  })
})
