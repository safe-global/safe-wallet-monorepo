import { getAddress, parseUnits } from 'ethers'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '../types'
import type { DesiredAllowance } from './spendingLimitExecution'
import { buildSpendingLimitEdit } from './spendingLimitEdit'

const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const BOB = getAddress('0x00000000000000000000000000000000000000b0')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const DAI = getAddress('0x6b175474e89094c44da98b954eedeac495271d0f')

const desired = (overrides: Partial<DesiredAllowance> = {}): DesiredAllowance => ({
  beneficiary: ALICE,
  tokenAddress: USDC,
  amount: '100',
  decimals: 6,
  resetTime: '1440',
  ...overrides,
})

type OnChainOverrides = {
  beneficiary?: string
  tokenAddress?: string
  decimals?: number
  amount?: string
  resetTimeMin?: string
  spent?: string
}

const onChain = ({
  beneficiary = ALICE,
  tokenAddress = USDC,
  decimals = 6,
  amount = '100',
  resetTimeMin = '1440',
  spent = '0',
}: OnChainOverrides = {}): SpendingLimitState =>
  spendingLimitStateBuilder()
    .with({
      beneficiary,
      amount: parseUnits(amount, decimals).toString(),
      resetTimeMin,
      spent,
      token: { address: tokenAddress, symbol: 'USDC', decimals, logoUri: '' },
    })
    .build()

describe('buildSpendingLimitEdit', () => {
  it('plans a modification when the amount changed', () => {
    const edit = buildSpendingLimitEdit([desired({ amount: '80' })], [onChain({ amount: '100' })])

    expect(edit.modified).toEqual([desired({ amount: '80' })])
    expect(edit.added).toEqual([])
    expect(edit.removed).toEqual([])
  })

  it('plans nothing when the typed amount matches the base units already on chain', () => {
    expect(buildSpendingLimitEdit([desired()], [onChain()]).modified).toEqual([])
  })

  it('plans a modification when only the reset period changed', () => {
    const edit = buildSpendingLimitEdit([desired({ resetTime: '43200' })], [onChain({ resetTimeMin: '1440' })])

    expect(edit.modified).toEqual([desired({ resetTime: '43200' })])
  })

  it('plans an addition for a token the spender has no limit for yet', () => {
    const edit = buildSpendingLimitEdit([desired(), desired({ tokenAddress: DAI })], [onChain()])

    expect(edit.added).toEqual([desired({ tokenAddress: DAI })])
    expect(edit.modified).toEqual([])
  })

  it('plans a removal for a limit the form no longer carries', () => {
    const edit = buildSpendingLimitEdit([desired()], [onChain(), onChain({ tokenAddress: DAI })])

    expect(edit.removed).toEqual([{ beneficiary: ALICE, tokenAddress: DAI }])
  })

  it('registers a spender the module does not know yet', () => {
    const edit = buildSpendingLimitEdit([desired(), desired({ beneficiary: BOB })], [onChain()])

    expect(edit.addedDelegates).toEqual([BOB])
  })

  it('unregisters a spender whose every limit is gone', () => {
    const edit = buildSpendingLimitEdit([desired()], [onChain(), onChain({ beneficiary: BOB, tokenAddress: DAI })])

    expect(edit.removedDelegates).toEqual([BOB])
    expect(edit.removed).toEqual([{ beneficiary: BOB, tokenAddress: DAI }])
  })

  it('removes every limit and every spender when the form is empty', () => {
    const edit = buildSpendingLimitEdit([], [onChain(), onChain({ beneficiary: BOB, tokenAddress: DAI })])

    expect(edit.removed).toEqual([
      { beneficiary: ALICE, tokenAddress: USDC },
      { beneficiary: BOB, tokenAddress: DAI },
    ])
    expect(edit.removedDelegates).toEqual([ALICE, BOB])
    expect(edit.added).toEqual([])
    expect(edit.modified).toEqual([])
  })

  it('keeps a spender registered when only one of their tokens is dropped', () => {
    const edit = buildSpendingLimitEdit([desired()], [onChain(), onChain({ tokenAddress: DAI })])

    expect(edit.removed).toEqual([{ beneficiary: ALICE, tokenAddress: DAI }])
    expect(edit.removedDelegates).toEqual([])
  })

  it('leaves the other spenders alone when one of them is dropped', () => {
    const edit = buildSpendingLimitEdit(
      [desired({ beneficiary: BOB, tokenAddress: DAI })],
      [onChain(), onChain({ beneficiary: BOB, tokenAddress: DAI })],
    )

    expect(edit.removed).toEqual([{ beneficiary: ALICE, tokenAddress: USDC }])
    expect(edit.removedDelegates).toEqual([ALICE])
    expect(edit.added).toEqual([])
    expect(edit.modified).toEqual([])
  })

  it('does not re-register a spender who is only gaining a token', () => {
    const edit = buildSpendingLimitEdit([desired(), desired({ tokenAddress: DAI })], [onChain()])

    expect(edit.addedDelegates).toEqual([])
  })

  it('matches a lowercase form address against the checksummed one on chain', () => {
    const edit = buildSpendingLimitEdit([desired({ beneficiary: ALICE.toLowerCase() })], [onChain()])

    expect(edit).toEqual({
      added: [],
      modified: [],
      removed: [],
      addedDelegates: [],
      removedDelegates: [],
    })
  })

  it('plans nothing when a spender is deleted and added back unchanged', () => {
    expect(buildSpendingLimitEdit([desired()], [onChain()])).toEqual({
      added: [],
      modified: [],
      removed: [],
      addedDelegates: [],
      removedDelegates: [],
    })
  })

  it('plans a modification when the chain reported no decimals to compare against', () => {
    const unknownDecimals = spendingLimitStateBuilder()
      .with({
        beneficiary: ALICE,
        amount: '100',
        resetTimeMin: '1440',
        token: { address: USDC, symbol: 'USDC', decimals: null, logoUri: '' },
      })
      .build()

    expect(buildSpendingLimitEdit([desired()], [unknownDecimals]).modified).toEqual([desired()])
  })
})
