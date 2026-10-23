import { MOCK_TOKENS, mockActiveSpendingLimit } from '../../mocks/policies'
import { mockActiveAllowlist } from '../../mocks/allowlistPolicies'
import { getPolicyTokens } from '../policyTokens'

describe('getPolicyTokens', () => {
  it('should return each token of a spending limit once', () => {
    expect(getPolicyTokens(mockActiveSpendingLimit())).toEqual([MOCK_TOKENS.usdc, MOCK_TOKENS.usdt])
  })

  it('should return each token of an allowlist once, whatever the address casing', () => {
    const policy = mockActiveAllowlist()
    policy.data.entries.push({
      token: { ...MOCK_TOKENS.usdc, address: MOCK_TOKENS.usdc.address.toLowerCase() },
      recipients: [],
    })

    expect(getPolicyTokens(policy).map(({ symbol }) => symbol)).toEqual(['USDC', 'USDT'])
  })
})
