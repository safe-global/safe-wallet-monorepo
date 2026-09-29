import { getAddress, parseUnits } from 'ethers'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '@/features/spending-limits'
import { buildSpendingLimitDelta } from '@/features/spending-limits/services'
import { toSpendingLimitFormValues } from '../prefill'

const SAFE = `11155111:${getAddress('0x1000000000000000000000000000000000000001')}`
const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const BOB = getAddress('0x00000000000000000000000000000000000000b0')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const DAI = getAddress('0x6b175474e89094c44da98b954eedeac495271d0f')

type OnChainOverrides = {
  beneficiary?: string
  tokenAddress?: string
  decimals?: number
  amount?: string
  resetTimeMin?: string
}

const onChain = ({
  beneficiary = ALICE,
  tokenAddress = USDC,
  decimals = 6,
  amount = '100',
  resetTimeMin = '1440',
}: OnChainOverrides = {}): SpendingLimitState =>
  spendingLimitStateBuilder()
    .with({
      beneficiary,
      amount: parseUnits(amount, decimals).toString(),
      resetTimeMin,
      token: { address: tokenAddress, symbol: 'TKN', decimals, logoUri: '' },
    })
    .build()

describe('toSpendingLimitFormValues', () => {
  it('reads a limit back as one spender card with one token row', () => {
    expect(toSpendingLimitFormValues(SAFE, [onChain()])).toEqual({
      safe: SAFE,
      spenders: [
        {
          address: ALICE,
          limits: [{ tokenAddress: USDC, amount: '100', resetTime: '1440' }],
        },
      ],
    })
  })

  it('puts every token of one spender on that spender’s single card', () => {
    const values = toSpendingLimitFormValues(SAFE, [onChain(), onChain({ tokenAddress: DAI, decimals: 18 })])

    expect(values.spenders).toHaveLength(1)
    expect(values.spenders[0].limits.map((limit) => limit.tokenAddress)).toEqual([USDC, DAI])
  })

  it('gives each spender their own card', () => {
    const values = toSpendingLimitFormValues(SAFE, [onChain(), onChain({ beneficiary: BOB, tokenAddress: DAI })])

    expect(values.spenders.map((spender) => spender.address)).toEqual([ALICE, BOB])
  })

  it('reads a one-time limit back as one time rather than as absent', () => {
    const values = toSpendingLimitFormValues(SAFE, [onChain({ resetTimeMin: '0' })])

    expect(values.spenders[0].limits[0].resetTime).toBe('0')
  })

  it('keeps a reset period the form does not offer instead of normalising it', () => {
    const values = toSpendingLimitFormValues(SAFE, [onChain({ resetTimeMin: '45' })])

    expect(values.spenders[0].limits[0].resetTime).toBe('45')
  })

  it('plans no transaction when the prefilled form is submitted untouched', () => {
    const baseline = [
      onChain({ amount: '1234567.89', decimals: 6 }),
      onChain({ beneficiary: BOB, tokenAddress: DAI, amount: '0.000000000000000001', decimals: 18, resetTimeMin: '0' }),
    ]
    const decimalsOf = (tokenAddress: string): number =>
      baseline.find((limit) => limit.token.address === tokenAddress)?.token.decimals ?? 0

    const values = toSpendingLimitFormValues(SAFE, baseline)
    const pairs = values.spenders.flatMap((spender) =>
      spender.limits.map((limit) => ({
        beneficiary: spender.address,
        tokenAddress: limit.tokenAddress,
        amount: limit.amount,
        decimals: decimalsOf(limit.tokenAddress),
        resetTime: limit.resetTime,
      })),
    )

    expect(buildSpendingLimitDelta(pairs, baseline)).toEqual({
      added: [],
      modified: [],
      removed: [],
      addedDelegates: [],
      removedDelegates: [],
    })
  })
})
