import { getSafeItemKey, applyCustomOrder } from '../safeOrder'
import type { SafeItem } from '@/hooks/safes'
import type { MultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'

const makeSingle = (chainId: string, address: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const makeMulti = (address: string): MultiChainSafeItem => ({
  address,
  safes: [makeSingle('1', address), makeSingle('10', address)],
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

describe('getSafeItemKey', () => {
  it('keys single-chain items by chainId:address (lowercased)', () => {
    expect(getSafeItemKey(makeSingle('1', '0xAbC'))).toBe('1:0xabc')
  })

  it('keys multi-chain groups by multi:address (lowercased)', () => {
    expect(getSafeItemKey(makeMulti('0xAbC'))).toBe('multi:0xabc')
  })
})

describe('applyCustomOrder', () => {
  const a = makeSingle('1', '0xa')
  const b = makeSingle('1', '0xb')
  const c = makeSingle('1', '0xc')

  it('reorders items to match the saved key order', () => {
    const result = applyCustomOrder([a, b, c], ['1:0xc', '1:0xa', '1:0xb'])
    expect(result.map((i) => i.address)).toEqual(['0xc', '0xa', '0xb'])
  })

  it('appends items not present in the saved order, preserving their relative order', () => {
    // Only a and c are known; b is new and should land at the end
    const result = applyCustomOrder([a, b, c], ['1:0xc', '1:0xa'])
    expect(result.map((i) => i.address)).toEqual(['0xc', '0xa', '0xb'])
  })

  it('ignores stale keys that no longer correspond to an item', () => {
    const result = applyCustomOrder([a, b], ['1:0xc', '1:0xb', '1:0xa'])
    expect(result.map((i) => i.address)).toEqual(['0xb', '0xa'])
  })

  it('orders multi-chain and single-chain items together by key', () => {
    const multi = makeMulti('0xff')
    const result = applyCustomOrder([a, multi, b], ['multi:0xff', '1:0xb', '1:0xa'])
    expect(result.map(getSafeItemKey)).toEqual(['multi:0xff', '1:0xb', '1:0xa'])
  })
})
