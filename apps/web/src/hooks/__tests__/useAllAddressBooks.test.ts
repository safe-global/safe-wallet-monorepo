import { renderHook } from '@testing-library/react'
import {
  useMergedAddressBooks,
  useAddressBookItem,
  useSafeNameResolver,
  ContactSource,
  type ExtendedContact,
} from '@/hooks/useAllAddressBooks'
import type { AddressBookSource } from '@/components/common/AddressBookSourceProvider'

let signedIn = false
let chainId = '1'
let currentSpaceId = '123'
let localAddressBook: Record<string, string> = {}
// Real `selectAllAddressBooks` is keyed by chain (`{ [chainId]: { [address]: name } }`), unlike the
// flat per-chain `selectAddressBookByChain`. `useSafeNameResolver` reads the former, so it gets its
// own nested fixture; the per-chain selector keeps returning the flat `localAddressBook`.
let localAddressBooksByChain: Record<string, Record<string, string>> = {}
let remoteContacts: ExtendedContact[] = []
let mockAddressBookSource: AddressBookSource = 'merged'

jest.mock('@/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    typeof selector === 'function' ? selector({}) : undefined,
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: jest.fn(),
  useGetSpaceAddressBook: jest.fn(),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: () => signedIn,
}))

jest.mock('@/store/addressBookSlice', () => ({
  selectAllAddressBooks: jest.fn(() => localAddressBooksByChain),
  selectAddressBookByChain: jest.fn(() => localAddressBook),
}))

jest.mock('@/hooks/useAddressBook', () => () => localAddressBook)

jest.mock('@/hooks/useChainId', () => () => chainId)

jest.mock('@/components/common/AddressBookSourceProvider', () => ({
  useAddressBookSource: () => mockAddressBookSource,
}))

// Import the mocked hooks
import { useCurrentSpaceId, useGetSpaceAddressBook } from '@/features/spaces'

describe('useAllAddressBooks', () => {
  describe('useAllMergedAddressBooks', () => {
    beforeEach(() => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(currentSpaceId)
      ;(useGetSpaceAddressBook as jest.Mock).mockImplementation(() => remoteContacts)
    })

    afterEach(() => {
      remoteContacts = []
      localAddressBook = {}
      signedIn = false
      jest.clearAllMocks()
    })

    it('returns ONLY local contacts when the user is NOT signed in', () => {
      const mockChainId = '1'
      signedIn = false
      localAddressBook = {
        '0xA': 'Alice',
        '0xB': 'Bob',
      }

      const { result } = renderHook(() => useMergedAddressBooks(mockChainId))

      expect(result.current.list).toHaveLength(2)
      expect(result.current.list.map((c) => c.address)).toEqual(['0xA', '0xB'])
      result.current.list.forEach((c) => expect(c.source).toBe(ContactSource.local))
    })

    it('returns undefined when no chainId is provided', () => {
      localAddressBook = { '0xB': 'Bob' }

      const { result } = renderHook(() => useAddressBookItem('0xB', undefined))

      expect(result.current).toBeUndefined()
    })

    it('merges space & local contacts, filtering duplicates by address', () => {
      const mockChainId = '1'
      signedIn = true
      localAddressBook = {
        '0xA': 'Alice (local)',
        '0xB': 'Bob',
      }

      remoteContacts = [
        {
          name: 'Alice (space)',
          address: '0xA',
          chainIds: ['1'],
          createdBy: '',
          createdByUserId: 0,
          lastUpdatedBy: '',
          lastUpdatedByUserId: 0,
          createdAt: '',
          updatedAt: '',
          source: ContactSource.space,
        },
        {
          name: 'Carl',
          address: '0xC',
          chainIds: ['1'],
          createdBy: '',
          createdByUserId: 0,
          lastUpdatedBy: '',
          lastUpdatedByUserId: 0,
          createdAt: '',
          updatedAt: '',
          source: ContactSource.space,
        },
      ]

      const { result } = renderHook(() => useMergedAddressBooks(mockChainId))

      expect(result.current.list).toHaveLength(3)
      expect(result.current.list.map((c) => c.address)).toEqual(['0xA', '0xC', '0xB'])

      const addressToSource = Object.fromEntries(result.current.list.map((c) => [c.address, c.source]))

      expect(addressToSource).toEqual({
        '0xA': ContactSource.space,
        '0xC': ContactSource.space,
        '0xB': ContactSource.local,
      })
    })
  })

  describe('useAddressBookItem', () => {
    beforeEach(() => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(currentSpaceId)
      ;(useGetSpaceAddressBook as jest.Mock).mockImplementation(() => remoteContacts)
    })

    afterEach(() => {
      remoteContacts = []
      localAddressBook = {}
      localAddressBooksByChain = {}
      mockAddressBookSource = 'merged'
      signedIn = false
      jest.clearAllMocks()
    })

    it('returns the matching contact by address + chainId', () => {
      signedIn = true

      remoteContacts = [
        {
          name: 'Alice',
          address: '0xA',
          chainIds: ['1'],
          createdBy: '',
          createdByUserId: 0,
          lastUpdatedBy: '',
          lastUpdatedByUserId: 0,
          createdAt: '',
          updatedAt: '',
          source: ContactSource.space,
        },
      ]

      const { result } = renderHook(() => useAddressBookItem('0xA', '1'))

      expect(result.current).toEqual(remoteContacts[0])
    })

    it('returns undefined when no chainId is provided', () => {
      localAddressBook = {
        '0xB': 'Bob',
      }

      const { result } = renderHook(() => useAddressBookItem('0xB', undefined))

      expect(result.current).toBeUndefined()
    })

    it('resolves the space name by address regardless of chain (spaceOnly + merged)', () => {
      signedIn = true
      remoteContacts = [
        {
          name: 'Shared',
          address: '0xA',
          chainIds: ['1'], // named only on chain 1
          createdBy: '',
          createdByUserId: 0,
          lastUpdatedBy: '',
          lastUpdatedByUserId: 0,
          createdAt: '',
          updatedAt: '',
          source: ContactSource.space,
        },
      ]

      mockAddressBookSource = 'spaceOnly'
      const spaceOnly = renderHook(() => useAddressBookItem('0xA', '137')) // a chain NOT in chainIds
      expect(spaceOnly.result.current?.name).toBe('Shared')

      mockAddressBookSource = 'merged'
      const merged = renderHook(() => useAddressBookItem('0xA', '137'))
      expect(merged.result.current?.name).toBe('Shared')

      // The address-level helper keeps the full chainIds of the underlying row.
      const m = renderHook(() => useMergedAddressBooks('137'))
      expect(m.result.current.getFromSpaceByAddress('0xA')?.chainIds).toEqual(['1'])
    })

    it('inherits a local name across chains under merged, but not under localOnly', () => {
      signedIn = true
      remoteContacts = []
      localAddressBook = {} // no entry on the currently-viewed chain (137)
      localAddressBooksByChain = { '1': { '0xL': 'Local' } } // name set only on chain 1

      mockAddressBookSource = 'merged'
      const merged = renderHook(() => useAddressBookItem('0xL', '137'))
      expect(merged.result.current?.name).toBe('Local') // inherited via any-chain fallback

      mockAddressBookSource = 'localOnly'
      const localOnly = renderHook(() => useAddressBookItem('0xL', '137'))
      expect(localOnly.result.current).toBeUndefined() // localOnly stays strictly per-chain
    })

    it('prefers the space name over a local name for the same address (merged)', () => {
      signedIn = true
      remoteContacts = [
        {
          name: 'Shared',
          address: '0xA',
          chainIds: ['1'],
          createdBy: '',
          createdByUserId: 0,
          lastUpdatedBy: '',
          lastUpdatedByUserId: 0,
          createdAt: '',
          updatedAt: '',
          source: ContactSource.space,
        },
      ]
      localAddressBooksByChain = { '1': { '0xA': 'Local' } }
      mockAddressBookSource = 'merged'

      const { result } = renderHook(() => useAddressBookItem('0xA', '1'))
      expect(result.current?.name).toBe('Shared')
    })
  })

  describe('useSafeNameResolver', () => {
    const spaceContact = (name: string, address: string, chainIds = ['1']): ExtendedContact => ({
      name,
      address,
      chainIds,
      createdBy: '',
      createdByUserId: 0,
      lastUpdatedBy: '',
      lastUpdatedByUserId: 0,
      createdAt: '',
      updatedAt: '',
      source: ContactSource.space,
    })

    beforeEach(() => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(currentSpaceId)
      ;(useGetSpaceAddressBook as jest.Mock).mockImplementation(() => remoteContacts)
      mockAddressBookSource = 'merged'
    })

    afterEach(() => {
      remoteContacts = []
      localAddressBook = {}
      localAddressBooksByChain = {}
      signedIn = false
      mockAddressBookSource = 'merged'
      jest.clearAllMocks()
    })

    it('returns the preferred name verbatim when provided', () => {
      signedIn = true
      remoteContacts = [spaceContact('Address Book Name', '0xA')]

      const { result } = renderHook(() => useSafeNameResolver())
      // Preferred name wins over the address book entry.
      expect(result.current('0xA', '1', 'Preferred Name')).toBe('Preferred Name')
    })

    it('falls back to the address-book name when no preferred name is given', () => {
      signedIn = true
      remoteContacts = [spaceContact('Treasury', '0xA')]

      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xA', '1')).toBe('Treasury')
    })

    it('matches the address book case-insensitively', () => {
      signedIn = true
      remoteContacts = [spaceContact('Treasury', '0xAbCdEf')]

      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xabcdef', '1')).toBe('Treasury')
    })

    it('returns an empty string when nothing matches', () => {
      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xUnknown', '1')).toBe('')
    })

    it('returns an empty string when no chainId is given', () => {
      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xA', undefined, '')).toBe('')
    })

    it('ignores space names under the localOnly source', () => {
      signedIn = true
      remoteContacts = [spaceContact('Treasury', '0xA')]
      mockAddressBookSource = 'localOnly'

      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xA', '1')).toBe('')
    })

    it('returns the space-book name under the spaceOnly source', () => {
      signedIn = true
      remoteContacts = [spaceContact('Treasury', '0xA')]
      mockAddressBookSource = 'spaceOnly'

      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xA', '1')).toBe('Treasury')
    })

    it('resolves a local-only name on the current chain (merged source)', () => {
      localAddressBooksByChain = { '1': { '0xlocal': 'Local Wallet' } }

      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xLocal', '1')).toBe('Local Wallet')
    })

    it('resolves a local-only name on a NON-current chain (the cross-chain case)', () => {
      // useChainId() is '1'; this entry lives on chain 137, which the merged map would miss.
      localAddressBooksByChain = { '137': { '0xremotechain': 'Polygon Wallet' } }

      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xRemoteChain', '137')).toBe('Polygon Wallet')
    })

    it('still resolves cross-chain local names under the localOnly source', () => {
      remoteContacts = [spaceContact('Should Be Ignored', '0xRemoteChain', ['137'])]
      localAddressBooksByChain = { '137': { '0xremotechain': 'Polygon Wallet' } }
      mockAddressBookSource = 'localOnly'

      const { result } = renderHook(() => useSafeNameResolver())
      expect(result.current('0xRemoteChain', '137')).toBe('Polygon Wallet')
    })
  })
})
