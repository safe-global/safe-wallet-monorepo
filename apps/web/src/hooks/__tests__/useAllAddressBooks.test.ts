import { renderHook } from '@testing-library/react'
import {
  useMergedAddressBooks,
  useAddressBookItem,
  ContactSource,
  type ExtendedContact,
} from '@/hooks/useAllAddressBooks'

let signedIn = false
let chainId = '1'
let currentSpaceId = '123'
let localAddressBook: Record<string, string> = {}
let remoteContacts: ExtendedContact[] = []
let privateContacts: ExtendedContact[] = []

jest.mock('@/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    typeof selector === 'function' ? selector({}) : undefined,
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: jest.fn(),
  useGetSpaceAddressBook: jest.fn(),
  useGetPrivateAddressBook: jest.fn(),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: () => signedIn,
}))

jest.mock('@/store/addressBookSlice', () => ({
  selectAllAddressBooks: jest.fn(() => localAddressBook),
  selectAddressBookByChain: jest.fn(() => localAddressBook),
}))

jest.mock('@/hooks/useAddressBook', () => () => localAddressBook)

jest.mock('@/hooks/useChainId', () => () => chainId)

// Import the mocked hooks
import { useCurrentSpaceId, useGetSpaceAddressBook, useGetPrivateAddressBook } from '@/features/spaces'

describe('useAllAddressBooks', () => {
  describe('useAllMergedAddressBooks', () => {
    beforeEach(() => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(currentSpaceId)
      ;(useGetSpaceAddressBook as jest.Mock).mockImplementation(() => remoteContacts)
      ;(useGetPrivateAddressBook as jest.Mock).mockImplementation(() => privateContacts)
    })

    afterEach(() => {
      remoteContacts = []
      privateContacts = []
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
          lastUpdatedBy: '',
          createdAt: '',
          updatedAt: '',
          source: ContactSource.space,
        },
        {
          name: 'Carl',
          address: '0xC',
          chainIds: ['1'],
          createdBy: '',
          lastUpdatedBy: '',
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

    it('prefers private over local when both exist for the same (address, chainId)', () => {
      const mockChainId = '1'
      signedIn = true
      localAddressBook = {
        '0xA': 'Alice (local)',
      }
      privateContacts = [
        {
          name: 'Alice (private)',
          address: '0xA',
          chainIds: ['1'],
          createdBy: '',
          lastUpdatedBy: '',
          createdAt: '',
          updatedAt: '',
          source: ContactSource.private,
        },
      ]

      const { result } = renderHook(() => useMergedAddressBooks(mockChainId))

      // Both list and get should resolve the address to the private contact, not the local one
      expect(result.current.list).toHaveLength(1)
      expect(result.current.list[0]).toMatchObject({
        address: '0xA',
        name: 'Alice (private)',
        source: ContactSource.private,
      })
      expect(result.current.get('0xA', '1')).toMatchObject({ name: 'Alice (private)', source: ContactSource.private })
    })

    it('prefers space over private on overlapping chains but keeps private chainIds not covered by space', () => {
      const mockChainId = '1'
      signedIn = true
      remoteContacts = [
        {
          name: 'Alice (space)',
          address: '0xA',
          chainIds: ['1'],
          createdBy: '',
          lastUpdatedBy: '',
          createdAt: '',
          updatedAt: '',
          source: ContactSource.space,
        },
      ]
      privateContacts = [
        {
          name: 'Alice (private)',
          address: '0xA',
          chainIds: ['1', '10'],
          createdBy: '',
          lastUpdatedBy: '',
          createdAt: '',
          updatedAt: '',
          source: ContactSource.private,
        },
      ]

      const { result } = renderHook(() => useMergedAddressBooks(mockChainId))

      // byKey lookups: space wins on chainId '1', private fills chainId '10'
      expect(result.current.get('0xA', '1')).toMatchObject({ name: 'Alice (space)', source: ContactSource.space })
      expect(result.current.get('0xA', '10')).toMatchObject({ name: 'Alice (private)', source: ContactSource.private })

      // list: one space entry + one private entry narrowed to only its non-overlapping chainIds
      expect(result.current.list).toHaveLength(2)
      const [spaceEntry, privateEntry] = result.current.list
      expect(spaceEntry).toMatchObject({ address: '0xA', source: ContactSource.space, chainIds: ['1'] })
      expect(privateEntry).toMatchObject({ address: '0xA', source: ContactSource.private, chainIds: ['10'] })
    })
  })

  describe('useAddressBookItem', () => {
    beforeEach(() => {
      ;(useCurrentSpaceId as jest.Mock).mockReturnValue(currentSpaceId)
      ;(useGetSpaceAddressBook as jest.Mock).mockImplementation(() => remoteContacts)
      ;(useGetPrivateAddressBook as jest.Mock).mockImplementation(() => privateContacts)
    })

    afterEach(() => {
      remoteContacts = []
      privateContacts = []
      localAddressBook = {}
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
          lastUpdatedBy: '',
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
  })
})
