import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { mockProposerDto, mockSpendingLimitDto } from '../../mocks/activePolicies'
import { mockPendingDto } from '../../mocks/pendingPolicies'
import { MOCK_ADDRESSES, MOCK_SAFES, MOCK_TOKENS } from '../../mocks/policies'
import { getReferencedTokens, mapActivePolicies } from '../mapActivePolicies'

const withAllowanceToken = (token: string) =>
  mockPendingDto({
    data: {
      ...mockPendingDto().data,
      changes: [{ kind: 'set-allowance', delegate: MOCK_ADDRESSES.bob, token, amount: '1', resetPeriodMinutes: 0 }],
    },
  })

describe('mapActivePolicies', () => {
  it('should, when given a spending limit, keep the reset in minutes and compute the remaining amount', () => {
    const [policy] = mapActivePolicies([mockSpendingLimitDto()])

    expect(policy.type).toBe('spending-limit')
    expect(policy.status).toBe('active')
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    const [allowance] = policy.data.spenders[0].allowances

    expect(allowance.token).toEqual(MOCK_TOKENS.usdc)
    expect(allowance.remaining).toBe('500000000')
    expect(allowance.resetPeriodMinutes).toBe(43_200)
    expect(allowance.resetsAtMinute).toBe(29_846_880)
    expect(allowance.createdAt).toBe(1_790_000_000)
  })

  it('should, when the allowance never resets, leave the reset time empty', () => {
    const dto = mockSpendingLimitDto()
    if (!('spenders' in dto.data)) throw new Error('expected spending limit data')
    dto.data.spenders[0].allowances[0].resetPeriodMinutes = 0
    dto.data.spenders[0].allowances[0].resetsAtMinute = null

    const [policy] = mapActivePolicies([dto])
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    expect(policy.data.spenders[0].allowances[0].resetPeriodMinutes).toBe(0)
    expect(policy.data.spenders[0].allowances[0].resetsAtMinute).toBeNull()
  })

  it('should, when more was spent than allowed, floor the remaining amount at zero', () => {
    const dto = mockSpendingLimitDto()
    if (!('spenders' in dto.data)) throw new Error('expected spending limit data')
    dto.data.spenders[0].allowances[0].spent = '9000000000'

    const [policy] = mapActivePolicies([dto])
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    expect(policy.data.spenders[0].allowances[0].remaining).toBe('0')
  })

  it('should, when CGW could not resolve the token, render its address as the symbol in base units', () => {
    const dto = mockSpendingLimitDto()
    if (!('spenders' in dto.data)) throw new Error('expected spending limit data')
    dto.data.spenders[0].allowances[0].tokenMetadata = null

    const [policy] = mapActivePolicies([dto])
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    expect(policy.data.spenders[0].allowances[0].token).toEqual({
      address: MOCK_TOKENS.usdc.address,
      symbol: '0xA0b8...eB48',
      decimals: 0,
      logoUri: null,
    })
  })

  it('should, when the module is not enabled, keep the policy and mark it as not enabled', () => {
    const [policy] = mapActivePolicies([mockSpendingLimitDto({ enabled: false })])

    expect(policy.enabled).toBe(false)
  })

  it('should, when given a proposer grant, keep every proposer with their grantors', () => {
    const [policy] = mapActivePolicies([mockProposerDto()])

    expect(policy.type).toBe('proposer')
    expect(policy.enforcement).toEqual({ via: 'offchain', source: 'delegates' })
    if (policy.type !== 'proposer') throw new Error('expected a proposer policy')

    expect(policy.data.proposers).toEqual([
      { proposer: MOCK_ADDRESSES.bob, delegatedBy: [{ delegator: MOCK_ADDRESSES.alice, label: 'Bob' }] },
    ])
  })

  it('should, when a Safe has several proposers, give each proposer its own policy and id', () => {
    const dto = mockProposerDto({
      data: {
        proposers: [
          { proposer: MOCK_ADDRESSES.bob, delegatedBy: [{ delegator: MOCK_ADDRESSES.alice, label: 'Bob' }] },
          { proposer: MOCK_ADDRESSES.unresolved, delegatedBy: [{ delegator: MOCK_ADDRESSES.alice, label: '' }] },
        ],
      },
    })

    const policies = mapActivePolicies([dto])

    expect(policies).toHaveLength(2)
    expect(policies[0].id).not.toBe(policies[1].id)
    expect(
      policies.map((policy) => (policy.type === 'proposer' ? policy.data.proposers.map((p) => p.proposer) : [])),
    ).toEqual([[MOCK_ADDRESSES.bob], [MOCK_ADDRESSES.unresolved]])
  })

  it('should, when the same Safe has a policy on two chains, give each its own id', () => {
    const policies = mapActivePolicies([
      mockSpendingLimitDto(),
      mockSpendingLimitDto({ safe: { ...MOCK_SAFES.treasury, chainId: '137' } }),
    ])

    expect(policies).toHaveLength(2)
    expect(policies[0].id).not.toBe(policies[1].id)
  })

  it('should, when given a type the page does not render, leave it out', () => {
    const policies = mapActivePolicies([mockSpendingLimitDto({ type: 'cosigner' })])

    expect(policies).toEqual([])
  })

  it('should, when the data does not match the type, leave the policy out', () => {
    const mismatched = mockProposerDto({ type: 'spending-limit', enforcement: { via: 'module', moduleAddress: '0x1' } })

    expect(mapActivePolicies([mismatched])).toEqual([])
  })

  it('leaves out a spending limit whose allowances have all been removed', () => {
    const dto = mockSpendingLimitDto()
    if (!('spenders' in dto.data)) throw new Error('expected spending limit data')
    dto.data.spenders = []

    expect(mapActivePolicies([dto])).toEqual([])
  })

  it('leaves out a spending limit whose spender has no allowance left', () => {
    const dto = mockSpendingLimitDto()
    if (!('spenders' in dto.data)) throw new Error('expected spending limit data')
    dto.data.spenders = dto.data.spenders.map((spender) => ({ ...spender, allowances: [] }))

    expect(mapActivePolicies([dto])).toEqual([])
  })
})

describe('getReferencedTokens', () => {
  it('should, when queued txs share a token on one chain, list it once', () => {
    const pending = withAllowanceToken(MOCK_TOKENS.usdt.address)

    expect(getReferencedTokens([pending, pending])).toEqual([
      { chainId: MOCK_SAFES.treasury.chainId, address: MOCK_TOKENS.usdt.address },
    ])
  })

  it('should, when the same token is queued on two chains, list it per chain', () => {
    const pending = withAllowanceToken(MOCK_TOKENS.usdt.address)

    const tokens = getReferencedTokens([pending, { ...pending, safe: { ...MOCK_SAFES.treasury, chainId: '137' } }])

    expect(tokens.map((token) => token.chainId)).toEqual(['1', '137'])
  })

  it('should, when a queued allowance is in the native currency, not list it', () => {
    expect(getReferencedTokens([withAllowanceToken(ZERO_ADDRESS)])).toEqual([])
  })
})
