import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type {
  PendingPolicyOperation,
  Policy,
  PolicyAllowance,
  PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { getSpendingLimitTokens, toSpendingLimitTokenOption } from '../spendingLimitTokens'

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

describe('getSpendingLimitTokens', () => {
  const safe: PolicySafe = { chainId: '11155111', address: faker.finance.ethereumAddress() }
  const usdc = faker.finance.ethereumAddress()
  const weth = faker.finance.ethereumAddress()

  const addressesOf = (policies: Policy[]) => getSpendingLimitTokens(policies, safe).map(({ address }) => address)

  it('should, when the Safe has an active spending limit, return the token of each allowance', () => {
    const allowance = makeAllowance(usdc)
    const policies = [makeSpendingLimit(safe, [{ spender: faker.finance.ethereumAddress(), allowances: [allowance] }])]

    expect(getSpendingLimitTokens(policies, safe)).toEqual([allowance.token])
  })

  it('should, when several allowances share a token, return the token once', () => {
    const policies = [
      makeSpendingLimit(safe, [
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc), makeAllowance(weth)] },
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(checksumAddress(usdc))] },
      ]),
    ]

    expect(addressesOf(policies)).toEqual([usdc, weth])
  })

  it('should, when a spender is deregistered, leave its tokens out', () => {
    const policies = [
      makeSpendingLimit(safe, [
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] },
        { spender: faker.finance.ethereumAddress(), isActive: false, allowances: [makeAllowance(weth)] },
      ]),
    ]

    expect(addressesOf(policies)).toEqual([usdc])
  })

  it('should, when the module is not enabled on the Safe, return nothing', () => {
    const policies = [
      makeSpendingLimit(safe, [{ spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] }], false),
    ]

    expect(addressesOf(policies)).toEqual([])
  })

  it('should, when the spending limits are on other Safes or other chains, return nothing', () => {
    const policies = [
      makeSpendingLimit({ ...safe, chainId: '1' }, [
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] },
      ]),
      makeSpendingLimit({ ...safe, address: faker.finance.ethereumAddress() }, [
        { spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] },
      ]),
    ]

    expect(addressesOf(policies)).toEqual([])
  })

  it('should, when the Safe has a queued spending limit, return its token', () => {
    const queued = makeQueuedSpendingLimit(
      safe,
      [{ spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(weth)] }],
      'create',
    )

    expect(addressesOf([queued])).toEqual([weth])
  })

  it('should, when a queued edit removes one allowance and adds another, return only the added token', () => {
    const queued = makeQueuedSpendingLimit(
      safe,
      [
        {
          spender: faker.finance.ethereumAddress(),
          allowances: [
            { ...makeAllowance(usdc), change: 'removed' },
            { ...makeAllowance(weth), change: 'added' },
          ],
        },
      ],
      'update',
    )

    expect(addressesOf([queued])).toEqual([weth])
  })

  it('should, when the queued transaction removes the spending limit, return nothing for it', () => {
    const queued = makeQueuedSpendingLimit(
      safe,
      [{ spender: faker.finance.ethereumAddress(), allowances: [makeAllowance(usdc)] }],
      'remove',
    )

    expect(addressesOf([queued])).toEqual([])
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

    expect(addressesOf([queued])).toEqual([])
  })
})

describe('toSpendingLimitTokenOption', () => {
  it('should, when the token has no logo, make an option without one', () => {
    const { token } = makeAllowance(faker.finance.ethereumAddress())

    expect(toSpendingLimitTokenOption(token)).toEqual({
      address: token.address,
      symbol: token.symbol,
      name: '',
      decimals: token.decimals,
      logoUri: undefined,
      group: 'custom',
    })
  })
})
