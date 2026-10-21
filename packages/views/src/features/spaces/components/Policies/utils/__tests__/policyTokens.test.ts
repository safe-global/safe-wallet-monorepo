import { MOCK_TOKENS, mockActiveSpendingLimit } from '@/features/spaces/components/Policies/mocks/policies'
import { mockActiveAllowlist } from '@/features/spaces/components/Policies/mocks/allowlistPolicies'
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
