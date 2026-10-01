import { getAddress, parseUnits } from 'ethers'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '@/features/spending-limits'
import { tokenOptionBuilder } from '../../utils/tokenOptions.fixtures'
import type { SpendingLimitPolicyFormValues } from '../../types'
import { toEditSummaryModel } from '../toEditSummaryModel'

const SAFE = '1:0x1000000000000000000000000000000000000001'
const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const BOB = getAddress('0x00000000000000000000000000000000000000b0')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const DAI = getAddress('0x6b175474e89094c44da98b954eedeac495271d0f')

const sources = {
  accounts: [],
  tokens: [
    tokenOptionBuilder().with({ address: USDC, symbol: 'USDC', decimals: 6 }).build(),
    tokenOptionBuilder().with({ address: DAI, symbol: 'DAI', decimals: 18 }).build(),
  ],
  names: {},
}

const onChain = (
  beneficiary: string,
  tokenAddress: string,
  amount: string,
  resetTimeMin = '1440',
  spent = '0',
  decimals = 6,
): SpendingLimitState =>
  spendingLimitStateBuilder()
    .with({
      beneficiary,
      amount: parseUnits(amount, decimals).toString(),
      resetTimeMin,
      spent,
      token: { address: tokenAddress, symbol: 'TKN', decimals, logoUri: '' },
    })
    .build()

const form = (spenders: Array<{ address: string; limits: Array<[string, string, string]> }>) =>
  ({
    safe: SAFE,
    spenders: spenders.map(({ address, limits }) => ({
      address,
      limits: limits.map(([tokenAddress, amount, resetTime]) => ({ tokenAddress, amount, resetTime })),
    })),
  }) as SpendingLimitPolicyFormValues

describe('toEditSummaryModel', () => {
  it('marks a row nobody touched as unchanged', () => {
    const model = toEditSummaryModel(
      form([{ address: ALICE, limits: [[USDC, '100', '1440']] }]),
      [onChain(ALICE, USDC, '100')],
      sources,
    )

    expect(model.spenders[0].limits[0].change).toBe('unchanged')
    expect(model.spenders[0].change).toBeUndefined()
  })

  it('marks a changed amount and keeps what the chain holds today', () => {
    const model = toEditSummaryModel(
      form([{ address: ALICE, limits: [[USDC, '80', '1440']] }]),
      [onChain(ALICE, USDC, '100')],
      sources,
    )

    expect(model.spenders[0].limits[0].change).toBe('changed')
    expect(model.spenders[0].limits[0].previous).toEqual({ amount: '100', resetTimeMin: '1440' })
  })

  it('marks a changed reset period even when the amount stays', () => {
    const model = toEditSummaryModel(
      form([{ address: ALICE, limits: [[USDC, '100', '43200']] }]),
      [onChain(ALICE, USDC, '100')],
      sources,
    )

    expect(model.spenders[0].limits[0].change).toBe('changed')
  })

  it('marks a token the spender did not have as added', () => {
    const model = toEditSummaryModel(
      form([
        {
          address: ALICE,
          limits: [
            [USDC, '100', '1440'],
            [DAI, '5', '0'],
          ],
        },
      ]),
      [onChain(ALICE, USDC, '100')],
      sources,
    )

    expect(model.spenders[0].limits[1].change).toBe('added')
  })

  it('still shows a token dropped from a spender who stays, marked removed', () => {
    const model = toEditSummaryModel(
      form([{ address: ALICE, limits: [[USDC, '100', '1440']] }]),
      [onChain(ALICE, USDC, '100'), onChain(ALICE, DAI, '5', '0', '0', 18)],
      sources,
    )

    const removed = model.spenders[0].limits.find((limit) => limit.change === 'removed')
    expect(removed?.token.address).toBe(DAI)
    expect(removed?.previous).toEqual({ amount: '5', resetTimeMin: '0' })
  })

  it('still shows a spender who is gone entirely, with every limit removed', () => {
    const model = toEditSummaryModel(
      form([{ address: ALICE, limits: [[USDC, '100', '1440']] }]),
      [onChain(ALICE, USDC, '100'), onChain(BOB, DAI, '5', '0', '0', 18)],
      sources,
    )

    const bob = model.spenders.find((spender) => spender.address === BOB)
    expect(bob?.change).toBe('removed')
    expect(bob?.limits.every((limit) => limit.change === 'removed')).toBe(true)
  })

  it('marks a spender arriving in this edit as added', () => {
    const model = toEditSummaryModel(
      form([
        { address: ALICE, limits: [[USDC, '100', '1440']] },
        { address: BOB, limits: [[DAI, '5', '0']] },
      ]),
      [onChain(ALICE, USDC, '100')],
      sources,
    )

    expect(model.spenders[1].change).toBe('added')
  })

  it('carries the spend a reset would hand back, so the row can warn about it', () => {
    const model = toEditSummaryModel(
      form([{ address: ALICE, limits: [[USDC, '80', '1440']] }]),
      [onChain(ALICE, USDC, '100', '1440', parseUnits('50', 6).toString())],
      sources,
    )

    expect(model.spenders[0].limits[0].spent).toBe(parseUnits('50', 6).toString())
  })

  it('calls a row changed rather than untouched when the chain reported no decimals for its token', () => {
    const unknownDecimals = spendingLimitStateBuilder()
      .with({
        beneficiary: ALICE,
        amount: '100',
        resetTimeMin: '1440',
        token: { address: USDC, symbol: 'TKN', decimals: null, logoUri: '' },
      })
      .build()

    const model = toEditSummaryModel(
      form([{ address: ALICE, limits: [[USDC, '100', '1440']] }]),
      [unknownDecimals],
      sources,
    )

    expect(model.spenders[0].limits[0].change).toBe('changed')
  })
})
