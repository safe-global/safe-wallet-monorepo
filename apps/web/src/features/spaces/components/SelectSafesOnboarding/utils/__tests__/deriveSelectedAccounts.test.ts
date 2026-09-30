import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import { deriveSidePanelAccounts, deriveSelectedBalanceSafes, deriveNameByAddress } from '../deriveSelectedAccounts'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../../constants'

const makeSafe = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: '0x1111111111111111111111111111111111111111',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: 'My Safe',
  ...overrides,
})

const makeMultiChain = (overrides: Partial<MultiChainSafeItem> = {}): MultiChainSafeItem => ({
  address: '0x2222222222222222222222222222222222222222',
  isPinned: false,
  lastVisited: 0,
  name: 'Multi Safe',
  safes: [],
  ...overrides,
})

describe('deriveSidePanelAccounts', () => {
  it('returns an empty list when no safes are selected', () => {
    expect(deriveSidePanelAccounts({}, [])).toEqual([])
  })

  it('returns only selected safes, ignoring deselected ones', () => {
    const safeA = makeSafe({ chainId: '1', address: '0xaaa1111111111111111111111111111111111111', name: 'A' })
    const safeB = makeSafe({ chainId: '1', address: '0xbbb1111111111111111111111111111111111111', name: 'B' })
    const result = deriveSidePanelAccounts(
      {
        [`1:${safeA.address}`]: true,
        [`1:${safeB.address}`]: false,
      },
      [safeA, safeB],
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ address: safeA.address, name: 'A' })
  })

  it('skips the multichain parent key but keeps the per-chain sub-safes', () => {
    const subA = makeSafe({ chainId: '1', address: '0xccc1111111111111111111111111111111111111', name: 'sub-eth' })
    const subB = makeSafe({ chainId: '137', address: '0xccc1111111111111111111111111111111111111', name: 'sub-poly' })
    const parent = makeMultiChain({ address: subA.address, name: 'Parent', safes: [subA, subB] })
    const result = deriveSidePanelAccounts(
      {
        [`${MULTICHAIN_SAFE_KEY_PREFIX}${subA.address}`]: true,
        [`1:${subA.address}`]: true,
        [`137:${subB.address}`]: true,
      },
      [parent],
    )
    // Same address across two chains → deduplicated to one row
    expect(result).toHaveLength(1)
    expect(result[0].address).toBe(subA.address)
  })

  it('returns no row when the form key is malformed (missing colon)', () => {
    const result = deriveSidePanelAccounts({ 'no-colon-key': true }, [])
    expect(result).toEqual([])
  })

  it('falls back to the parent name when the sub-safe has no name', () => {
    const sub = makeSafe({ chainId: '1', address: '0xddd1111111111111111111111111111111111111', name: undefined })
    const parent = makeMultiChain({ address: sub.address, name: 'Parent', safes: [sub] })
    const result = deriveSidePanelAccounts({ [`1:${sub.address}`]: true }, [parent])
    expect(result[0].name).toBe('Parent')
  })

  it('threads the matching SafeItem through as _safeItem', () => {
    const safe = makeSafe({ chainId: '1', address: '0xeee1111111111111111111111111111111111111' })
    const result = deriveSidePanelAccounts({ [`1:${safe.address}`]: true }, [safe])
    expect(result[0]._safeItem).toBe(safe)
  })
})

describe('deriveSelectedBalanceSafes', () => {
  it('falls back to flattening the persisted Space safes when the form is empty', () => {
    const sub1 = makeSafe({ chainId: '1', address: '0xfff1111111111111111111111111111111111111' })
    const sub2 = makeSafe({ chainId: '137', address: '0xfff1111111111111111111111111111111111111' })
    const multi = makeMultiChain({ address: sub1.address, safes: [sub1, sub2] })
    expect(deriveSelectedBalanceSafes({}, [], [multi])).toEqual([sub1, sub2])
  })

  it('returns matching per-chain SafeItems for single-chain selections', () => {
    const safeA = makeSafe({ chainId: '1', address: '0xa111111111111111111111111111111111111111' })
    const safeB = makeSafe({ chainId: '10', address: '0xb111111111111111111111111111111111111111' })
    const result = deriveSelectedBalanceSafes(
      { [`1:${safeA.address}`]: true, [`10:${safeB.address}`]: true },
      [safeA, safeB],
      [],
    )
    expect(result).toEqual([safeA, safeB])
  })

  it('flattens multi-chain selections into one SafeItem per chain', () => {
    const sub1 = makeSafe({ chainId: '1', address: '0x1234567890123456789012345678901234567890' })
    const sub2 = makeSafe({ chainId: '137', address: '0x1234567890123456789012345678901234567890' })
    const multi = makeMultiChain({ address: sub1.address, safes: [sub1, sub2] })
    const result = deriveSelectedBalanceSafes(
      {
        [`${MULTICHAIN_SAFE_KEY_PREFIX}${sub1.address}`]: true,
        [`1:${sub1.address}`]: true,
        [`137:${sub2.address}`]: true,
      },
      [multi],
      [],
    )
    expect(result).toEqual([sub1, sub2])
  })

  it('skips deselected entries and malformed keys', () => {
    const safe = makeSafe({ chainId: '1', address: '0x9999999999999999999999999999999999999999' })
    const result = deriveSelectedBalanceSafes({ [`1:${safe.address}`]: false, 'malformed-key': true }, [safe], [])
    expect(result).toEqual([])
  })

  it('drops selections that have no matching entry in allSafes', () => {
    const result = deriveSelectedBalanceSafes({ '1:0xunknown1111111111111111111111111111111111': true }, [], [])
    expect(result).toEqual([])
  })
})

describe('deriveNameByAddress', () => {
  it('returns an empty map when there are no safes', () => {
    expect(deriveNameByAddress([])).toEqual(new Map())
  })

  it('lower-cases the address when keying the map', () => {
    const safe = makeSafe({ address: '0xAABBCCDDEEFF00112233445566778899AABBCCDD', name: 'Mixed Case' })
    const map = deriveNameByAddress([safe])
    expect(map.get(safe.address.toLowerCase())).toBe('Mixed Case')
    expect(map.get(safe.address)).toBeUndefined()
  })

  it('flattens multi-chain safes — falls back to the parent name when a sub-safe has none', () => {
    const sub1 = makeSafe({
      chainId: '1',
      address: '0xaaaa111111111111111111111111111111111111',
      name: undefined,
    })
    const sub2 = makeSafe({
      chainId: '137',
      address: '0xbbbb222222222222222222222222222222222222',
      name: 'Sub With Name',
    })
    const multi = makeMultiChain({
      address: '0xcccc333333333333333333333333333333333333',
      name: 'Parent Group',
      safes: [sub1, sub2],
    })
    const map = deriveNameByAddress([multi])
    expect(map.get(multi.address.toLowerCase())).toBe('Parent Group')
    expect(map.get(sub1.address.toLowerCase())).toBe('Parent Group')
    expect(map.get(sub2.address.toLowerCase())).toBe('Sub With Name')
  })

  it('does not overwrite an existing entry — first writer wins', () => {
    const first = makeSafe({ chainId: '1', address: '0xeeee444444444444444444444444444444444444', name: 'First' })
    const second = makeSafe({ chainId: '10', address: first.address, name: 'Second' })
    const map = deriveNameByAddress([first, second])
    expect(map.get(first.address.toLowerCase())).toBe('First')
  })

  it('skips safes that have no name', () => {
    const safe = makeSafe({ address: '0xffff555555555555555555555555555555555555', name: undefined })
    expect(deriveNameByAddress([safe]).size).toBe(0)
  })
})
