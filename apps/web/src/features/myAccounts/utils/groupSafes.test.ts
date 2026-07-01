import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import { buildAddressSet, groupSafesByPrecedence } from './groupSafes'

const makeSafe = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: '0x0000000000000000000000000000000000000001',
  isReadOnly: true,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

const makeMulti = (
  address: string,
  safes: SafeItem[],
  overrides: Partial<MultiChainSafeItem> = {},
): MultiChainSafeItem => ({
  address,
  safes,
  isPinned: safes.some((s) => s.isPinned),
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

describe('groupSafesByPrecedence', () => {
  it('puts pinned safes in trusted', () => {
    const pinned = makeSafe({ address: '0xAAA', isPinned: true })
    const { trusted, owned, local } = groupSafesByPrecedence([pinned], new Set(), true)

    expect(trusted).toEqual([pinned])
    expect(owned).toHaveLength(0)
    expect(local).toHaveLength(0)
  })

  it('puts owned (non-readonly) safes in owned when connected', () => {
    const ownedSafe = makeSafe({ address: '0xBBB', isReadOnly: false })
    const { trusted, owned, local } = groupSafesByPrecedence([ownedSafe], new Set(), true)

    expect(owned).toEqual([ownedSafe])
    expect(trusted).toHaveLength(0)
    expect(local).toHaveLength(0)
  })

  it('does not populate owned when wallet is disconnected', () => {
    const ownedSafe = makeSafe({ address: '0xBBB', isReadOnly: false })
    const { owned, local } = groupSafesByPrecedence([ownedSafe], new Set(), false)

    expect(owned).toHaveLength(0)
    expect(local).toEqual([ownedSafe])
  })

  it('puts everything else in local storage', () => {
    const watched = makeSafe({ address: '0xCCC', isReadOnly: true })
    const { trusted, owned, local } = groupSafesByPrecedence([watched], new Set(), true)

    expect(local).toEqual([watched])
    expect(trusted).toHaveLength(0)
    expect(owned).toHaveLength(0)
  })

  it('prefers trusted over owned for a pinned + owned safe', () => {
    const pinnedAndOwned = makeSafe({ address: '0xDDD', isReadOnly: false, isPinned: true })
    const { trusted, owned } = groupSafesByPrecedence([pinnedAndOwned], new Set(), true)

    expect(trusted).toEqual([pinnedAndOwned])
    expect(owned).toHaveLength(0)
  })

  it('excludes workspace addresses from all buckets (case-insensitive)', () => {
    const inWorkspace = makeSafe({ address: '0xEee', isReadOnly: false })
    const other = makeSafe({ address: '0xFFF', isPinned: true })
    const workspaceAddresses = new Set(['0xeee'])

    const { trusted, owned, local } = groupSafesByPrecedence([inWorkspace, other], workspaceAddresses, true)

    expect([...trusted, ...owned, ...local]).toEqual([other])
  })

  it('treats a multi-chain safe owned on any chain as owned', () => {
    const multi = makeMulti('0x111', [
      makeSafe({ chainId: '1', address: '0x111', isReadOnly: true }),
      makeSafe({ chainId: '137', address: '0x111', isReadOnly: false }),
    ])
    const { owned, local } = groupSafesByPrecedence([multi], new Set(), true)

    expect(owned).toEqual([multi])
    expect(local).toHaveLength(0)
  })

  it('keeps a read-only multi-chain safe in local', () => {
    const multi = makeMulti('0x222', [
      makeSafe({ chainId: '1', address: '0x222', isReadOnly: true }),
      makeSafe({ chainId: '137', address: '0x222', isReadOnly: true }),
    ])
    const { owned, local } = groupSafesByPrecedence([multi], new Set(), true)

    expect(local).toEqual([multi])
    expect(owned).toHaveLength(0)
  })

  it('places each safe in exactly one bucket', () => {
    const items = [
      makeSafe({ address: '0x1', isPinned: true, isReadOnly: false }),
      makeSafe({ address: '0x2', isReadOnly: false }),
      makeSafe({ address: '0x3', isReadOnly: true }),
    ]
    const { trusted, owned, local } = groupSafesByPrecedence(items, new Set(), true)

    expect(trusted.length + owned.length + local.length).toBe(items.length)
  })
})

describe('buildAddressSet', () => {
  it('lowercases addresses', () => {
    const set = buildAddressSet([makeSafe({ address: '0xAbCdEf' })])
    expect(set.has('0xabcdef')).toBe(true)
  })
})
