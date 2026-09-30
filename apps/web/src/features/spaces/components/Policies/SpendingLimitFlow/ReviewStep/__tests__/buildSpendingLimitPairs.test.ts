import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { tokenOptionBuilder } from '../../utils/tokenOptions.fixtures'
import type { SpendingLimitPolicyFormValues } from '../../types'
import { buildSpendingLimitPairs, findExistingPair, UNKNOWN_TOKEN_IN_POLICY_ERROR } from '../buildSpendingLimitPairs'

const ALICE = '0x1234567890123456789012345678901234567890'
const BOB = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const eth = tokenOptionBuilder().with({ address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18 }).build()
const usdc = tokenOptionBuilder().with({ address: USDC, symbol: 'USDC', decimals: 6 }).build()

const values: SpendingLimitPolicyFormValues = {
  safe: `1:${ZERO_ADDRESS}`,
  spenders: [
    {
      address: ALICE,
      limits: [
        { tokenAddress: ZERO_ADDRESS, amount: '0.5', resetTime: '0' },
        { tokenAddress: USDC.toLowerCase(), amount: '250', resetTime: '10080' },
      ],
    },
    { address: BOB, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '1440' }] },
  ],
}

describe('buildSpendingLimitPairs', () => {
  it('flattens every row in form order with the decimals of its token option', () => {
    expect(buildSpendingLimitPairs(values, [eth, usdc])).toEqual({
      pairs: [
        { beneficiary: ALICE, tokenAddress: ZERO_ADDRESS, amount: '0.5', decimals: 18, resetTime: '0' },
        { beneficiary: ALICE, tokenAddress: USDC.toLowerCase(), amount: '250', decimals: 6, resetTime: '10080' },
        { beneficiary: BOB, tokenAddress: ZERO_ADDRESS, amount: '1', decimals: 18, resetTime: '1440' },
      ],
    })
  })

  it('reports an unknown token instead of guessing its decimals', () => {
    const result = buildSpendingLimitPairs(values, [eth])

    expect(result.pairs).toBeUndefined()
    expect(result.error?.message).toBe(UNKNOWN_TOKEN_IN_POLICY_ERROR)
  })
})

describe('findExistingPair', () => {
  const pair = { beneficiary: ALICE, tokenAddress: USDC, amount: '250', decimals: 6, resetTime: '10080' }

  it('returns the colliding pair regardless of casing', () => {
    const existing = [
      spendingLimitStateBuilder()
        .with({
          beneficiary: ALICE.toLowerCase(),
          token: { ...spendingLimitStateBuilder().build().token, address: USDC.toLowerCase() },
        })
        .build(),
    ]

    expect(findExistingPair([pair], existing)).toBe(pair)
  })

  it('returns undefined when only another spender has that token', () => {
    const existing = [
      spendingLimitStateBuilder()
        .with({ beneficiary: BOB, token: { ...spendingLimitStateBuilder().build().token, address: USDC } })
        .build(),
    ]

    expect(findExistingPair([pair], existing)).toBeUndefined()
  })

  it('returns undefined for an empty existing list', () => {
    expect(findExistingPair([pair], [])).toBeUndefined()
  })
})
