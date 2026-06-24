import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import { deriveSidePanelAccountsFromSpace } from '../deriveSidePanelAccountsFromSpace'

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

describe('deriveSidePanelAccountsFromSpace', () => {
  it('returns an empty list for an empty input', () => {
    expect(deriveSidePanelAccountsFromSpace([])).toEqual([])
  })

  it('emits one entry per single-chain SafeItem and threads the SafeItem through', () => {
    const a = makeSafe({ address: '0xaaa1111111111111111111111111111111111111', name: 'A' })
    const b = makeSafe({ address: '0xbbb1111111111111111111111111111111111111', name: 'B' })
    const result = deriveSidePanelAccountsFromSpace([a, b])
    expect(result).toEqual([
      { address: a.address, name: 'A', _safeItem: a },
      { address: b.address, name: 'B', _safeItem: b },
    ])
  })

  it('picks the first sub-SafeItem for a MultiChainSafeItem', () => {
    const sub1 = makeSafe({ chainId: '1', address: '0xccc1111111111111111111111111111111111111' })
    const sub2 = makeSafe({ chainId: '137', address: '0xccc1111111111111111111111111111111111111' })
    const multi = makeMultiChain({ address: sub1.address, name: 'Multi', safes: [sub1, sub2] })
    const result = deriveSidePanelAccountsFromSpace([multi])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ address: sub1.address, name: 'Multi', _safeItem: sub1 })
  })

  it('dedupes safes by lower-cased address — first occurrence wins', () => {
    const first = makeSafe({ chainId: '1', address: '0xDDD1111111111111111111111111111111111111', name: 'First' })
    const second = makeSafe({
      chainId: '10',
      address: '0xddd1111111111111111111111111111111111111',
      name: 'Second',
    })
    const result = deriveSidePanelAccountsFromSpace([first, second])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('First')
  })

  it('falls back to nameLookup when the safe has no name', () => {
    const safe = makeSafe({ address: '0xeee1111111111111111111111111111111111111', name: undefined })
    const nameLookup = new Map([[safe.address.toLowerCase(), 'Positive Ethereum Safe']])
    const result = deriveSidePanelAccountsFromSpace([safe], nameLookup)
    expect(result[0].name).toBe('Positive Ethereum Safe')
  })

  it('falls back to nameLookup when the safe name is whitespace-only', () => {
    const safe = makeSafe({ address: '0xfff1111111111111111111111111111111111111', name: '   ' })
    const nameLookup = new Map([[safe.address.toLowerCase(), 'From Lookup'] as const])
    const result = deriveSidePanelAccountsFromSpace([safe], nameLookup)
    expect(result[0].name).toBe('From Lookup')
  })

  it('leaves the name undefined when neither the safe nor the lookup has one', () => {
    const safe = makeSafe({ address: '0x1112221111111111111111111111111111111111', name: undefined })
    const result = deriveSidePanelAccountsFromSpace([safe])
    expect(result[0].name).toBeUndefined()
  })

  it('matches the nameLookup case-insensitively (address in the safe may be mixed-case)', () => {
    const safe = makeSafe({
      address: '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
      name: undefined,
    })
    const nameLookup = new Map([[safe.address.toLowerCase(), 'Lookup Name']])
    const result = deriveSidePanelAccountsFromSpace([safe], nameLookup)
    expect(result[0].name).toBe('Lookup Name')
  })
})
