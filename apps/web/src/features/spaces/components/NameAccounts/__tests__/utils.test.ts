import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { AllSafeItems, SafeItem } from '@/hooks/safes'
import { buildWorkspaceSafeNames, getSafesToName, hasAllNames, nameFieldKey, withWorkspaceNames } from '../utils'

const ADDRESS_A = '0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaA'
const ADDRESS_B = '0xBbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbB'

const safeItem = (chainId: string, address: string, name?: string): SafeItem => ({
  chainId,
  address,
  name,
  isPinned: true,
  isReadOnly: false,
  lastVisited: 0,
})

const entry = (address: string, name: string, chainIds: string[]): SpaceAddressBookItemDto =>
  ({ address, name, chainIds }) as SpaceAddressBookItemDto

describe('getSafesToName', () => {
  it('skips a Safe whose workspace entry already covers its chain', () => {
    const result = getSafesToName([{ chainId: '1', address: ADDRESS_A }], [], [entry(ADDRESS_A, 'Treasury', ['1'])])

    expect(result).toEqual([])
  })

  it('lists a Safe whose workspace entry misses the added chain, prefilled with that entry name', () => {
    const result = getSafesToName(
      [{ chainId: '10', address: ADDRESS_A }],
      [safeItem('10', ADDRESS_A, 'Local name')],
      [entry(ADDRESS_A.toLowerCase(), 'Treasury', ['1'])],
    )

    expect(result).toEqual([expect.objectContaining({ chainId: '10', address: ADDRESS_A, name: 'Treasury' })])
  })

  it('prefills the local name when there is no workspace entry', () => {
    const result = getSafesToName([{ chainId: '1', address: ADDRESS_A }], [safeItem('1', ADDRESS_A, 'Local name')], [])

    expect(result).toEqual([expect.objectContaining({ address: ADDRESS_A, name: 'Local name', isPinned: true })])
  })

  it('builds a minimal unnamed item for a Safe not in the known list', () => {
    const result = getSafesToName([{ chainId: '1', address: ADDRESS_B }], [], [])

    expect(result).toEqual([
      { chainId: '1', address: ADDRESS_B, name: undefined, isPinned: false, isReadOnly: false, lastVisited: 0 },
    ])
  })

  it('groups a Safe added on several chains into one multichain row', () => {
    const known: AllSafeItems = [safeItem('1', ADDRESS_A, 'Ops'), safeItem('137', ADDRESS_A, 'Ops')]
    const result = getSafesToName(
      [
        { chainId: '1', address: ADDRESS_A },
        { chainId: '137', address: ADDRESS_A },
        { chainId: '1', address: ADDRESS_B },
      ],
      known,
      [],
    )

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(
      expect.objectContaining({ address: ADDRESS_A, name: 'Ops', safes: [expect.anything(), expect.anything()] }),
    )
    expect(result[1]).toEqual(expect.objectContaining({ chainId: '1', address: ADDRESS_B }))
  })
})

describe('buildWorkspaceSafeNames', () => {
  it('maps a single Safe to one item on its chain and a multichain Safe to all of its chains', () => {
    const items = getSafesToName(
      [
        { chainId: '1', address: ADDRESS_A },
        { chainId: '137', address: ADDRESS_A },
        { chainId: '1', address: ADDRESS_B },
      ],
      [],
      [],
    )

    const result = buildWorkspaceSafeNames(
      { [ADDRESS_A.toLowerCase()]: 'Ops', [ADDRESS_B.toLowerCase()]: 'Treasury' },
      items,
    )

    expect(result).toEqual([
      { address: ADDRESS_A, name: 'Ops', chainIds: ['1', '137'] },
      { address: ADDRESS_B, name: 'Treasury', chainIds: ['1'] },
    ])
  })

  it('falls back to an empty name when none was entered', () => {
    const items = getSafesToName([{ chainId: '1', address: ADDRESS_B }], [], [])

    expect(buildWorkspaceSafeNames({}, items)).toEqual([{ address: ADDRESS_B, name: '', chainIds: ['1'] }])
  })
})

describe('nameFieldKey', () => {
  it('lowercases the address so checksummed and lowercased inputs share one field', () => {
    expect(nameFieldKey(ADDRESS_A)).toBe(`names.${ADDRESS_A.toLowerCase()}`)
  })
})

describe('hasAllNames', () => {
  const items = getSafesToName([{ chainId: '1', address: ADDRESS_A }], [], [])

  it('is true only when every Safe has a non-blank name', () => {
    expect(hasAllNames({ [ADDRESS_A.toLowerCase()]: 'Treasury' }, items)).toBe(true)
    expect(hasAllNames({ [ADDRESS_A.toLowerCase()]: '   ' }, items)).toBe(false)
    expect(hasAllNames({}, items)).toBe(false)
    expect(hasAllNames(undefined, items)).toBe(false)
  })

  it('rejects a name the workspace address book would reject', () => {
    expect(hasAllNames({ [ADDRESS_A.toLowerCase()]: 'Op' }, items)).toBe(false)
    expect(hasAllNames({ [ADDRESS_A.toLowerCase()]: 'Treasury <script>' }, items)).toBe(false)
    expect(hasAllNames({ [ADDRESS_A.toLowerCase()]: 'x'.repeat(51) }, items)).toBe(false)
  })

  it('is true for an empty list', () => {
    expect(hasAllNames({}, [])).toBe(true)
  })
})

describe('withWorkspaceNames', () => {
  it('shows the workspace name over a local one', () => {
    const [safe] = withWorkspaceNames([safeItem('1', ADDRESS_A, 'Local')], [entry(ADDRESS_A, 'Workspace', ['1'])])

    expect(safe.name).toBe('Workspace')
  })

  it('shows the workspace name for a Safe with no local name', () => {
    const [safe] = withWorkspaceNames([safeItem('1', ADDRESS_A)], [entry(ADDRESS_A.toLowerCase(), 'Workspace', ['1'])])

    expect(safe.name).toBe('Workspace')
  })

  it('keeps the local name when the workspace entry covers another chain', () => {
    const [safe] = withWorkspaceNames([safeItem('10', ADDRESS_A, 'Local')], [entry(ADDRESS_A, 'Workspace', ['1'])])

    expect(safe.name).toBe('Local')
  })
})
