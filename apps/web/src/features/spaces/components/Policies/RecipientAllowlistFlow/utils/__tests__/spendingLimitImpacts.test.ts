import { faker } from '@faker-js/faker'
import type {
  PendingPolicyOperation,
  Policy,
  PolicyAllowance,
  PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'
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
  enabled = true,
): Policy => ({
  id: faker.string.uuid(),
  type: 'spending-limit',
  status: 'active',
  safe,
  enabled,
  enforcement: { via: 'module', moduleAddress: faker.finance.ethereumAddress() },
  data: { spenders },
})

const makeQueuedSpendingLimit = (
  safe: PolicySafe,
  spenders: { spender: string; allowances: PolicyAllowance[] }[],
  operation: PendingPolicyOperation,
): Policy => ({
  id: faker.string.uuid(),
  type: 'spending-limit',
  status: 'pending',
  operation,
  safe,
  enabled: true,
  enforcement: { via: 'module', moduleAddress: faker.finance.ethereumAddress() },
  safeTxHash: faker.string.hexadecimal({ length: 64 }),
  nonce: faker.number.int({ max: 100 }),
  confirmationsSubmitted: 1,
  confirmationsRequired: 2,
  proposedAt: faker.date.recent().getTime() / 1_000,
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

  it('should mark an allowance as blocked, when the allowlist leaves its token out', () => {
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

  it('should leave out a spending limit, when its module is not enabled on the Safe', () => {
    const policies = [
      makeSpendingLimit(safe, [{ spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] }], false),
    ]

    expect(getSpendingLimitImpacts(policies, safe, [{ tokenAddress: usdc, recipients }])).toEqual([])
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

  it('should, when the Safe has a queued spending limit, return its allowance as pending', () => {
    const spender = faker.finance.ethereumAddress()
    const queued = makeQueuedSpendingLimit(safe, [{ spender, allowances: [makeAllowance(weth)] }], 'create')

    const impacts = getSpendingLimitImpacts([queued], safe, [{ tokenAddress: usdc, recipients }])

    expect(impacts).toEqual([
      expect.objectContaining({ policyId: queued.id, isPending: true, spender, impact: 'blocked' }),
    ])
  })

  it('should, when the spending limit is active, return its allowance as not pending', () => {
    const active = makeSpendingLimit(safe, [
      { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] },
    ])

    const impacts = getSpendingLimitImpacts([active], safe, [{ tokenAddress: usdc, recipients }])

    expect(impacts).toEqual([expect.objectContaining({ policyId: active.id, isPending: false })])
  })

  it('should, when a queued edit removes one allowance and adds another, return only the added one', () => {
    const spender = faker.finance.ethereumAddress()
    const queued = makeQueuedSpendingLimit(
      safe,
      [
        {
          spender,
          allowances: [
            { ...makeAllowance(usdc), change: 'removed' },
            { ...makeAllowance(weth), change: 'added' },
          ],
        },
      ],
      'update',
    )

    const impacts = getSpendingLimitImpacts([queued], safe, [{ tokenAddress: usdc, recipients }])

    expect(impacts.map(({ allowance }) => allowance.token.address)).toEqual([weth])
  })

  it('should, when the queued transaction removes the spending limit, return nothing for it', () => {
    const queued = makeQueuedSpendingLimit(
      safe,
      [{ spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] }],
      'remove',
    )

    expect(getSpendingLimitImpacts([queued], safe, [{ tokenAddress: usdc, recipients }])).toEqual([])
  })

  it('should, when a queued spending limit leaves its module disabled on the Safe, return nothing for it', () => {
    const queued: Policy = {
      ...makeQueuedSpendingLimit(
        safe,
        [{ spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] }],
        'update',
      ),
      enabled: false,
    }

    expect(getSpendingLimitImpacts([queued], safe, [{ tokenAddress: usdc, recipients }])).toEqual([])
  })

  it('should return one impact per allowance with the restricted ones first, when spenders mix both kinds', () => {
    const blockedSpender = faker.finance.ethereumAddress()
    const restrictedSpender = faker.finance.ethereumAddress()
    const policies = [
      makeSpendingLimit(safe, [
        { spender: blockedSpender, allowances: [makeAllowance(weth)] },
        { spender: restrictedSpender, allowances: [makeAllowance(usdc)] },
      ]),
    ]

    const impacts = getSpendingLimitImpacts(policies, safe, [{ tokenAddress: usdc, recipients }])

    expect(impacts.map(({ spender, impact }) => [spender, impact])).toEqual([
      [restrictedSpender, 'restricted'],
      [blockedSpender, 'blocked'],
    ])
  })
})
