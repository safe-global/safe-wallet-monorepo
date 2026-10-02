import { getAddress } from 'ethers'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '@/features/spending-limits'
import type { SpendingLimitPolicyFormValues } from '../../types'
import { describeRemovals, findPendingRemovals } from '../removals'

const SAFE = '11155111:0x1000000000000000000000000000000000000001'
const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const BOB = getAddress('0x00000000000000000000000000000000000000b0')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const DAI = getAddress('0x6b175474e89094c44da98b954eedeac495271d0f')
const WETH = getAddress('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')

const onChain = (beneficiary: string, tokenAddress: string): SpendingLimitState =>
  spendingLimitStateBuilder()
    .with({ beneficiary, token: { address: tokenAddress, symbol: 'TKN', decimals: 6, logoUri: '' } })
    .build()

const form = (spenders: Array<{ address: string; tokens: string[] }>): SpendingLimitPolicyFormValues => ({
  safe: SAFE,
  spenders: spenders.map(({ address, tokens }) => ({
    address,
    limits: tokens.map((tokenAddress) => ({ tokenAddress, amount: '1', resetTime: '0' })),
  })),
})

describe('findPendingRemovals', () => {
  it('reports nothing while the form still carries every limit on chain', () => {
    const baseline = [onChain(ALICE, USDC), onChain(BOB, DAI)]

    expect(
      findPendingRemovals(
        baseline,
        form([
          { address: ALICE, tokens: [USDC] },
          { address: BOB, tokens: [DAI] },
        ]),
      ),
    ).toEqual({ spenders: [], limits: 0 })
  })

  it('counts nothing when a row swaps one token for another', () => {
    const baseline = [onChain(ALICE, USDC)]

    expect(findPendingRemovals(baseline, form([{ address: ALICE, tokens: [DAI] }]))).toEqual({
      spenders: [],
      limits: 0,
    })
  })

  it('counts the one row that went when another swapped token in the same edit', () => {
    const baseline = [onChain(ALICE, USDC), onChain(ALICE, DAI)]

    expect(findPendingRemovals(baseline, form([{ address: ALICE, tokens: [WETH] }]))).toEqual({
      spenders: [],
      limits: 1,
    })
  })

  it('counts a token dropped from a spender who stays', () => {
    const baseline = [onChain(ALICE, USDC), onChain(ALICE, DAI)]

    expect(findPendingRemovals(baseline, form([{ address: ALICE, tokens: [USDC] }]))).toEqual({
      spenders: [],
      limits: 1,
    })
  })

  it('names a spender who is gone entirely and counts each of their limits', () => {
    const baseline = [onChain(ALICE, USDC), onChain(BOB, USDC), onChain(BOB, DAI)]

    expect(findPendingRemovals(baseline, form([{ address: ALICE, tokens: [USDC] }]))).toEqual({
      spenders: [BOB],
      limits: 2,
    })
  })

  it('reports every spender and limit once the form is empty', () => {
    const baseline = [onChain(ALICE, USDC), onChain(BOB, DAI)]

    expect(findPendingRemovals(baseline, form([]))).toEqual({ spenders: [ALICE, BOB], limits: 2 })
  })

  it('ignores a half-typed spender row instead of reading it as a removal', () => {
    const baseline = [onChain(ALICE, USDC)]

    expect(
      findPendingRemovals(
        baseline,
        form([
          { address: ALICE, tokens: [USDC] },
          { address: '', tokens: [''] },
        ]),
      ),
    ).toEqual({ spenders: [], limits: 0 })
  })
})

describe('describeRemovals', () => {
  it('names both counts when a whole spender goes', () => {
    expect(describeRemovals({ spenders: [ALICE, BOB], limits: 3 }, false).title).toBe(
      '2 spenders and 3 limits will be removed',
    )
  })

  it('speaks of one spender and one limit in the singular', () => {
    expect(describeRemovals({ spenders: [ALICE], limits: 1 }, false).title).toBe(
      '1 spender and 1 limit will be removed',
    )
  })

  it('leaves the spenders out when only a token is dropped', () => {
    expect(describeRemovals({ spenders: [], limits: 1 }, false).title).toBe('1 limit will be removed')
  })

  it('says the policy goes away entirely once nothing is left', () => {
    const { description } = describeRemovals({ spenders: [ALICE], limits: 2 }, true)

    expect(description).toContain('removes the spending limit')
  })

  it('does not threaten to remove the policy while limits remain', () => {
    const { description } = describeRemovals({ spenders: [ALICE], limits: 2 }, false)

    expect(description).not.toContain('removes the spending limit')
  })
})
