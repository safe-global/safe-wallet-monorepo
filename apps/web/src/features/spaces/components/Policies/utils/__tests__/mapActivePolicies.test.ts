import type { ActivePolicyDto, GuardSlotsDto, PolicyAccessDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  isAllowlistPolicy,
  type AllowlistRecipient,
  type PolicyTokenInfo,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { getPolicyGuardAddress } from '@/features/policy-guard/services'
import {
  mockErc20TransferDto,
  mockGuardExitDto,
  mockNativeTransferDto,
  mockProposerDto,
  mockSpendingLimitDto,
  mockTreasuryAllowlistDtos,
} from '../../mocks/activePolicies'
import { MOCK_ADDRESSES, MOCK_SAFES, MOCK_TOKENS } from '../../mocks/policies'
import { mapActivePolicies, type NativeTokenResolver } from '../mapActivePolicies'

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

  it('should carry whether the spender is still registered', () => {
    const [policy] = mapActivePolicies([mockSpendingLimitDto()])
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    expect(policy.data.spenders[0].isActive).toBe(true)
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

  describe('allowlists', () => {
    const ETH: PolicyTokenInfo = { address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18, logoUri: 'eth.png' }
    const resolveNativeToken = () => ETH
    const GUARD = '0x5202B1ebE100812437d47eae769e155945fbba6a'
    const CONTRACTS = { policyContract: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187', safePolicyGuard: GUARD }

    const withGuards = (dto: ActivePolicyDto, guards: GuardSlotsDto): ActivePolicyDto => {
      if (dto.enforcement.via !== 'guard') throw new Error('expected a guard policy')
      return { ...dto, enforcement: { ...dto.enforcement, guards } }
    }

    const withAccess = (dto: ActivePolicyDto, access: Partial<PolicyAccessDto>): ActivePolicyDto => {
      if (dto.enforcement.via !== 'guard') throw new Error('expected a guard policy')
      return { ...dto, enforcement: { ...dto.enforcement, access: { ...dto.enforcement.access, ...access } } }
    }

    const usdtDto = (recipients: AllowlistRecipient[]) =>
      mockErc20TransferDto({ data: { tokenAddress: MOCK_TOKENS.usdt.address, tokenMetadata: null, recipients } })

    const toAllowlists = (dtos: ActivePolicyDto[], resolver: NativeTokenResolver = resolveNativeToken) =>
      mapActivePolicies(dtos, resolver).filter(isAllowlistPolicy)

    it('groups every token and ETH recipient on a Safe into one row', () => {
      const [policy, ...rest] = toAllowlists(mockTreasuryAllowlistDtos())

      expect(rest).toEqual([])
      expect(policy).toMatchObject({
        id: `allowlist:${MOCK_SAFES.treasury.chainId}:${MOCK_SAFES.treasury.address.toLowerCase()}`,
        type: 'allowlist',
        status: 'active',
        safe: MOCK_SAFES.treasury,
        enforcement: { via: 'guard', guardAddress: GUARD },
        enabled: true,
        spendingLimitsCovered: true,
      })
      expect(policy.data.entries.map((entry) => entry.token.address)).toEqual([
        ZERO_ADDRESS,
        MOCK_TOKENS.usdc.address,
        MOCK_TOKENS.usdt.address,
      ])
    })

    it('gives each Safe its own row', () => {
      const policies = toAllowlists([mockErc20TransferDto(), mockErc20TransferDto({ safe: MOCK_SAFES.payroll })])

      expect(policies.map((policy) => policy.safe)).toEqual([MOCK_SAFES.treasury, MOCK_SAFES.payroll])
    })

    it('shows a token with transfer and transferFrom policies once, with their recipients merged', () => {
      const transfer = usdtDto([{ account: MOCK_ADDRESSES.alice, permission: 'ALWAYS' }])
      const transferFrom = withAccess(
        usdtDto([
          { account: MOCK_ADDRESSES.alice.toLowerCase(), permission: 'ALWAYS' },
          { account: MOCK_ADDRESSES.bob, permission: 'ONCE' },
        ]),
        { selector: '0x23b872dd' },
      )

      const [policy] = toAllowlists([transfer, transferFrom])

      expect(policy.data.entries).toEqual([
        {
          token: { address: MOCK_TOKENS.usdt.address, symbol: '0xdAC1...1ec7', decimals: 0, logoUri: null },
          recipients: [
            { account: MOCK_ADDRESSES.alice, permission: 'ALWAYS' },
            { account: MOCK_ADDRESSES.bob, permission: 'ONCE' },
          ],
        },
      ])
    })

    it('reads ETH recipients from the access target and allows them always', () => {
      const [policy] = toAllowlists([
        mockNativeTransferDto(MOCK_ADDRESSES.alice),
        mockNativeTransferDto(MOCK_ADDRESSES.bob),
      ])

      expect(policy.data.entries).toEqual([
        {
          token: ETH,
          recipients: [
            { account: MOCK_ADDRESSES.alice, permission: 'ALWAYS' },
            { account: MOCK_ADDRESSES.bob, permission: 'ALWAYS' },
          ],
        },
      ])
    })

    it('names an ERC-20 token from its metadata and keeps the address for one CGW could not resolve', () => {
      const [policy] = toAllowlists([mockErc20TransferDto(), usdtDto([])])

      expect(policy.data.entries.map((entry) => entry.token)).toEqual([
        MOCK_TOKENS.usdc,
        { address: MOCK_TOKENS.usdt.address, symbol: '0xdAC1...1ec7', decimals: 0, logoUri: null },
      ])
    })

    it('lists an ETH recipient once when several policies name it, whatever the casing', () => {
      const [policy] = toAllowlists([
        mockNativeTransferDto(MOCK_ADDRESSES.alice),
        mockNativeTransferDto(MOCK_ADDRESSES.alice.toLowerCase()),
      ])

      expect(policy.data.entries[0].recipients).toEqual([{ account: MOCK_ADDRESSES.alice, permission: 'ALWAYS' }])
    })

    it('leaves out an erc20-transfer policy whose data has another shape', () => {
      const mismatched = mockErc20TransferDto({ data: { module: '0x1', spenders: [] } })

      expect(toAllowlists([mismatched])).toEqual([])
    })

    it('ignores the guard slots of an erc20-transfer policy whose data has another shape', () => {
      const mismatched = withGuards(mockErc20TransferDto({ data: { module: '0x1', spenders: [] } }), {})

      const [policy] = toAllowlists([mockErc20TransferDto(), mismatched])

      expect(policy).toMatchObject({ enabled: true, spendingLimitsCovered: true })
    })

    it('leaves out the ETH entry when the chain config is not loaded', () => {
      const [policy] = toAllowlists([mockErc20TransferDto(), mockNativeTransferDto()], () => undefined)

      expect(policy.data.entries.map((entry) => entry.token.address)).toEqual([MOCK_TOKENS.usdc.address])
    })

    it.each([
      ['the target is the zero address', { target: ZERO_ADDRESS }],
      ['the selector is not a plain transfer', { selector: '0xa9059cbb' }],
      ['the operation is a delegatecall', { operation: 'DELEGATECALL' as const }],
    ])('skips a native-transfer policy when %s', (_, access) => {
      const [policy] = toAllowlists([mockErc20TransferDto(), withAccess(mockNativeTransferDto(), access)])

      expect(policy.data.entries.map((entry) => entry.token.address)).toEqual([MOCK_TOKENS.usdc.address])
    })

    it('takes the guard address from the module slot when the transaction slot is empty', () => {
      const [policy] = toAllowlists([withGuards(mockErc20TransferDto(), { moduleGuard: CONTRACTS })])

      expect(policy.enforcement).toEqual({ via: 'guard', guardAddress: GUARD })
    })

    it('takes the guard address from the deployment when no slot holds the guard', () => {
      const [policy] = toAllowlists([withGuards(mockErc20TransferDto({ safe: MOCK_SAFES.grants }), {})])

      expect(policy.enforcement).toEqual({
        via: 'guard',
        guardAddress: getPolicyGuardAddress(MOCK_SAFES.grants.chainId),
      })
    })

    it.each<[string, GuardSlotsDto, boolean]>([
      ['both slots', { transactionGuard: CONTRACTS, moduleGuard: CONTRACTS }, true],
      ['only the transaction slot', { transactionGuard: CONTRACTS }, true],
      ['only the module slot', { moduleGuard: CONTRACTS }, false],
      ['no slot', {}, false],
    ])('marks the allowlist enabled only when the guard is in the transaction slot: %s', (_, guards, enabled) => {
      const [policy] = toAllowlists([withGuards(mockErc20TransferDto(), guards)])

      expect(policy.enabled).toBe(enabled)
    })

    it.each<[string, GuardSlotsDto, boolean]>([
      ['both slots', { transactionGuard: CONTRACTS, moduleGuard: CONTRACTS }, true],
      ['only the transaction slot', { transactionGuard: CONTRACTS }, false],
    ])('covers spending limits only when the guard is in the module slot: %s', (_, guards, covered) => {
      const [policy] = toAllowlists([withGuards(mockErc20TransferDto(), guards)])

      expect(policy).toMatchObject({ spendingLimitsCovered: covered })
    })

    it('marks the whole row not enabled when one of its policies is not enforced', () => {
      const [policy] = toAllowlists([
        mockErc20TransferDto(),
        withGuards(mockNativeTransferDto(), { moduleGuard: CONTRACTS }),
      ])

      expect(policy.enabled).toBe(false)
    })

    it('should keep a row waiting for the guard to come off, when an applied removal left only the setGuard rule', () => {
      const [policy, ...rest] = toAllowlists([mockGuardExitDto()])

      expect(rest).toEqual([])
      expect(policy).toMatchObject({
        safe: MOCK_SAFES.treasury,
        enabled: true,
        awaitingGuardRemoval: true,
        data: { entries: [] },
        enforcement: { via: 'guard', guardAddress: GUARD },
      })
    })

    it('should leave no row, when the guard came off after the removal', () => {
      expect(toAllowlists([withGuards(mockGuardExitDto(), {})])).toEqual([])
    })

    it('should leave no row, when an allow rule is on something other than the Safe setGuard', () => {
      expect(toAllowlists([withAccess(mockGuardExitDto(), { selector: '0xe068df37' })])).toEqual([])
    })

    it('should not mark an allowlist as waiting for guard removal, when no setGuard rule is bound', () => {
      const [policy] = toAllowlists([mockErc20TransferDto()])

      expect(policy).not.toHaveProperty('awaitingGuardRemoval')
    })

    it('marks the whole row not covering spending limits when one of its policies lacks the module slot', () => {
      const [policy] = toAllowlists([
        mockErc20TransferDto(),
        withGuards(mockNativeTransferDto(), { transactionGuard: CONTRACTS }),
      ])

      expect(policy).toMatchObject({ enabled: true, spendingLimitsCovered: false })
    })
  })
})
