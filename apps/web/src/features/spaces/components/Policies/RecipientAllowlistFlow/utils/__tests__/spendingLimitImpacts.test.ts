import { faker } from '@faker-js/faker'
import type { Policy, PolicyAllowance, PolicySafe } from '@safe-global/views/features/spaces/components/Policies/types'
import { getSpendingLimitImpacts } from '../spendingLimitImpacts'

const makeAllowance = (tokenAddress: string): PolicyAllowance => ({
  token: { address: tokenAddress, symbol: faker.finance.currencyCode(), decimals: 6, logoUri: null },
  amount: '500000000',
  spent: '0',
  remaining: '500000000',
  resetPeriodMinutes: 1_440,
  resetsAtMinute: null,
})

const makeSpendingLimit = (
  safe: PolicySafe,
  spenders: { spender: string; isActive?: boolean; allowances: PolicyAllowance[] }[],
): Policy => ({
  id: faker.string.uuid(),
  type: 'spending-limit',
  status: 'active',
  safe,
  enabled: true,
  enforcement: { via: 'module', moduleAddress: faker.finance.ethereumAddress() },
  data: { spenders },
})

describe('getSpendingLimitImpacts', () => {
  const safe: PolicySafe = { chainId: '11155111', address: faker.finance.ethereumAddress() }
  const usdc = faker.finance.ethereumAddress()
  const weth = faker.finance.ethereumAddress()
  const recipients = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]

  it('marks an allowance on an allowlisted token as restricted to its recipients', () => {
    const spender = faker.finance.ethereumAddress()
    const policies = [makeSpendingLimit(safe, [{ spender, allowances: [makeAllowance(usdc)] }])]

    const [impact] = getSpendingLimitImpacts(policies, safe, [{ tokenAddress: usdc.toLowerCase(), recipients }])

    expect(impact).toMatchObject({ spender, impact: 'restricted', recipients })
  })

  it('blocks an allowance on a token the allowlist leaves out, since the guard denies by default', () => {
    const policies = [
      makeSpendingLimit(safe, [{ spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(weth)] }]),
    ]

    const impacts = getSpendingLimitImpacts(policies, safe, [{ tokenAddress: usdc, recipients }])

    expect(impacts).toEqual([expect.objectContaining({ impact: 'blocked', recipients: [] })])
  })

  it('leaves out the allowances of a deregistered spender', () => {
    const active = faker.finance.ethereumAddress()
    const policies = [
      makeSpendingLimit(safe, [
        { spender: active, allowances: [makeAllowance(usdc)] },
        { spender: faker.finance.ethereumAddress(), isActive: false, allowances: [makeAllowance(usdc)] },
      ]),
    ]

    const impacts = getSpendingLimitImpacts(policies, safe, [{ tokenAddress: usdc, recipients }])

    expect(impacts.map(({ spender }) => spender)).toEqual([active])
  })

  it('ignores spending limits on other Safes and other chains', () => {
    const policies = [
      makeSpendingLimit({ ...safe, chainId: '1' }, [
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] },
      ]),
      makeSpendingLimit({ ...safe, address: faker.finance.ethereumAddress() }, [
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] },
      ]),
    ]

    expect(getSpendingLimitImpacts(policies, safe, [{ tokenAddress: usdc, recipients }])).toEqual([])
  })

  it('returns one impact per allowance across spenders', () => {
    const policies = [
      makeSpendingLimit(safe, [
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc), makeAllowance(weth)] },
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] },
      ]),
    ]

    const impacts = getSpendingLimitImpacts(policies, safe, [{ tokenAddress: usdc, recipients }])

    expect(impacts.map(({ impact }) => impact)).toEqual(['restricted', 'blocked', 'restricted'])
  })
})
