import { getAddress, parseUnits } from 'ethers'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '../types'
import type { SpendingLimitPair } from './spendingLimitExecution'
import { buildSpendingLimitDelta } from './spendingLimitDelta'

const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const BOB = getAddress('0x00000000000000000000000000000000000000b0')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const DAI = getAddress('0x6b175474e89094c44da98b954eedeac495271d0f')

const desired = (overrides: Partial<SpendingLimitPair> = {}): SpendingLimitPair => ({
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

describe('buildSpendingLimitDelta', () => {
  it('plans a modification when the amount changed', () => {
    const delta = buildSpendingLimitDelta([desired({ amount: '80' })], [onChain({ amount: '100' })])

    expect(delta.modified).toEqual([desired({ amount: '80' })])
    expect(delta.added).toEqual([])
    expect(delta.removed).toEqual([])
  })

  it('plans nothing when the typed amount matches the base units already on chain', () => {
    expect(buildSpendingLimitDelta([desired()], [onChain()]).modified).toEqual([])
  })

  it('plans a modification when only the reset period changed', () => {
    const delta = buildSpendingLimitDelta([desired({ resetTime: '43200' })], [onChain({ resetTimeMin: '1440' })])

    expect(delta.modified).toEqual([desired({ resetTime: '43200' })])
  })

  it('plans an addition for a token the spender has no limit for yet', () => {
    const delta = buildSpendingLimitDelta([desired(), desired({ tokenAddress: DAI })], [onChain()])

    expect(delta.added).toEqual([desired({ tokenAddress: DAI })])
    expect(delta.modified).toEqual([])
  })

  it('plans a removal for a limit the form no longer carries', () => {
    const delta = buildSpendingLimitDelta([desired()], [onChain(), onChain({ tokenAddress: DAI })])

    expect(delta.removed).toEqual([{ beneficiary: ALICE, tokenAddress: DAI }])
  })

  it('registers a spender the module does not know yet', () => {
    const delta = buildSpendingLimitDelta([desired(), desired({ beneficiary: BOB })], [onChain()])

    expect(delta.addedDelegates).toEqual([BOB])
  })

  it('unregisters a spender whose every limit is gone', () => {
    const delta = buildSpendingLimitDelta([desired()], [onChain(), onChain({ beneficiary: BOB, tokenAddress: DAI })])

    expect(delta.removedDelegates).toEqual([BOB])
    expect(delta.removed).toEqual([{ beneficiary: BOB, tokenAddress: DAI }])
  })

  it('removes every limit and every spender when the form is empty', () => {
    const delta = buildSpendingLimitDelta([], [onChain(), onChain({ beneficiary: BOB, tokenAddress: DAI })])

    expect(delta.removed).toEqual([
      { beneficiary: ALICE, tokenAddress: USDC },
      { beneficiary: BOB, tokenAddress: DAI },
    ])
    expect(delta.removedDelegates).toEqual([ALICE, BOB])
    expect(delta.added).toEqual([])
    expect(delta.modified).toEqual([])
  })

  it('keeps a spender registered when only one of their tokens is dropped', () => {
    const delta = buildSpendingLimitDelta([desired()], [onChain(), onChain({ tokenAddress: DAI })])

    expect(delta.removed).toEqual([{ beneficiary: ALICE, tokenAddress: DAI }])
    expect(delta.removedDelegates).toEqual([])
  })

  it('leaves the other spenders alone when one of them is dropped', () => {
    const delta = buildSpendingLimitDelta(
      [desired({ beneficiary: BOB, tokenAddress: DAI })],
      [onChain(), onChain({ beneficiary: BOB, tokenAddress: DAI })],
    )

    expect(delta.removed).toEqual([{ beneficiary: ALICE, tokenAddress: USDC }])
    expect(delta.removedDelegates).toEqual([ALICE])
    expect(delta.added).toEqual([])
    expect(delta.modified).toEqual([])
  })

  it('does not re-register a spender who is only gaining a token', () => {
    const delta = buildSpendingLimitDelta([desired(), desired({ tokenAddress: DAI })], [onChain()])

    expect(delta.addedDelegates).toEqual([])
  })

  it('matches a lowercase form address against the checksummed one on chain', () => {
    const delta = buildSpendingLimitDelta([desired({ beneficiary: ALICE.toLowerCase() })], [onChain()])

    expect(delta).toEqual({
      added: [],
      modified: [],
      removed: [],
      addedDelegates: [],
      removedDelegates: [],
    })
  })

  it('plans nothing when a spender is deleted and added back unchanged', () => {
    expect(buildSpendingLimitDelta([desired()], [onChain()])).toEqual({
      added: [],
      modified: [],
      removed: [],
      addedDelegates: [],
      removedDelegates: [],
    })
  })
})
