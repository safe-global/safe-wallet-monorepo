import { getAddress, parseUnits } from 'ethers'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '@/features/spending-limits'
import type { SpendingLimitPolicyFormValues } from '../../types'
import { hasEditChanges } from '../hasEditChanges'

const SAFE = '1:0x1000000000000000000000000000000000000001'
const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const BOB = getAddress('0x00000000000000000000000000000000000000b0')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const DAI = getAddress('0x6b175474e89094c44da98b954eedeac495271d0f')

const onChain = (
  beneficiary: string,
  tokenAddress: string,
  amount: string,
  resetTimeMin = '1440',
): SpendingLimitState =>
  spendingLimitStateBuilder()
    .with({
      beneficiary,
      amount: parseUnits(amount, 6).toString(),
      resetTimeMin,
      token: { address: tokenAddress, symbol: 'TKN', decimals: 6, logoUri: '' },
    })
    .build()

const form = (rows: Array<[string, string, string, string]>): SpendingLimitPolicyFormValues => {
  const spenders: SpendingLimitPolicyFormValues['spenders'] = []
  for (const [address, tokenAddress, amount, resetTime] of rows) {
    const card = spenders.find((s) => s.address === address)
    const limit = { tokenAddress, amount, resetTime }
    if (card) card.limits.push(limit)
    else spenders.push({ address, limits: [limit] })
  }
  return { safe: SAFE, spenders }
}

const baseline = [onChain(ALICE, USDC, '100'), onChain(BOB, DAI, '5', '0')]
const untouched = form([
  [ALICE, USDC, '100', '1440'],
  [BOB, DAI, '5', '0'],
])

describe('hasEditChanges', () => {
  it('sees no change in the form the chain state produced', () => {
    expect(hasEditChanges(baseline, untouched)).toBe(false)
  })

  it('sees no change when an amount is retyped in an equivalent form', () => {
    expect(
      hasEditChanges(
        baseline,
        form([
          [ALICE, USDC, '100.00', '1440'],
          [BOB, DAI, '5', '0'],
        ]),
      ),
    ).toBe(false)
  })

  it('sees no change when a spender is deleted and added back as they were', () => {
    expect(
      hasEditChanges(
        baseline,
        form([
          [BOB, DAI, '5', '0'],
          [ALICE, USDC, '100', '1440'],
        ]),
      ),
    ).toBe(false)
  })

  it('sees a changed amount', () => {
    expect(
      hasEditChanges(
        baseline,
        form([
          [ALICE, USDC, '80', '1440'],
          [BOB, DAI, '5', '0'],
        ]),
      ),
    ).toBe(true)
  })

  it('sees a changed reset period', () => {
    expect(
      hasEditChanges(
        baseline,
        form([
          [ALICE, USDC, '100', '43200'],
          [BOB, DAI, '5', '0'],
        ]),
      ),
    ).toBe(true)
  })

  it('sees a dropped limit', () => {
    expect(hasEditChanges(baseline, form([[ALICE, USDC, '100', '1440']]))).toBe(true)
  })

  it('sees an added limit', () => {
    expect(
      hasEditChanges(
        baseline,
        form([
          [ALICE, USDC, '100', '1440'],
          [ALICE, DAI, '9', '1440'],
          [BOB, DAI, '5', '0'],
        ]),
      ),
    ).toBe(true)
  })

  it('ignores a row that is still being typed', () => {
    const half = form([
      [ALICE, USDC, '100', '1440'],
      [BOB, DAI, '5', '0'],
    ])
    half.spenders.push({ address: '', limits: [{ tokenAddress: '', amount: '', resetTime: '0' }] })

    expect(hasEditChanges(baseline, half)).toBe(false)
  })
})
