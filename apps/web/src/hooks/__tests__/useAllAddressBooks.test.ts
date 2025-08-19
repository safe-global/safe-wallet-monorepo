import { renderHook } from '@testing-library/react'
import {
  useAllMergedAddressBooks,
  useAddressBookItem,
  ContactSource,
  type ExtendedContact,
} from '@/hooks/useAllAddressBooks'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import * as currentSpaceIdHook from '@/features/spaces/hooks/useCurrentSpaceId'
import type { AddressBook } from '@/store/addressBookSlice'

let signedIn = false
let currentSpaceId = '123'
let localAddressBook: Record<string, AddressBook> = {}
let remoteContacts: ExtendedContact[] = []

jest.mock('@/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: () => signedIn,
}))

jest.mock('@/store/addressBookSlice', () => ({
  selectAllAddressBooks: jest.fn(() => localAddressBook),
}))

describe('useAllAddressBooks', () => {
  describe('useAllMergedAddressBooks', () => {
    beforeEach(() => {
      jest.spyOn(spacesQueries, 'useAddressBooksGetAddressBookItemsV1Query').mockImplementation(() => ({
        currentData: {
          data: remoteContacts,
        },
        refetch: jest.fn(),
      }))

      jest.spyOn(currentSpaceIdHook, 'useCurrentSpaceId').mockReturnValue(currentSpaceId)
    })

    afterEach(() => {
      remoteContacts = []
      localAddressBook = {}
      signedIn = false
      jest.clearAllMocks()
    })

    it('returns ONLY local contacts when the user is NOT signed in', () => {
      signedIn = false
      localAddressBook = {
        '1': {
          '0xA': 'Alice',
          '0xB': 'Bob',
        },
      }

      const { result } = renderHook(() => useAllMergedAddressBooks())

      expect(result.current).toHaveLength(2)
      expect(result.current.map((c) => c.address)).toEqual(['0xA', '0xB'])
      result.current.forEach((c) => expect(c.source).toBe(ContactSource.local))
    })

    it('merges space & local contacts, filtering duplicates by address', () => {
      signedIn = true
      localAddressBook = {
        '1': {
          '0xA': 'Alice (local)',
          '0xB': 'Bob',
        },
      }

      remoteContacts = [
        {
          name: 'Alice (space)',
          address: '0xA',
          chainIds: ['1'],
          createdBy: '',
          lastUpdatedBy: '',
          source: ContactSource.space,
        },
        {
          name: 'Carl',
          address: '0xC',
          chainIds: ['1'],
          createdBy: '',
          lastUpdatedBy: '',
          source: ContactSource.space,
        },
      ]

      const { result } = renderHook(() => useAllMergedAddressBooks())

      expect(result.current).toHaveLength(3)
      expect(result.current.map((c) => c.address)).toEqual(['0xA', '0xC', '0xB'])

      const addressToSource = Object.fromEntries(result.current.map((c) => [c.address, c.source]))

      expect(addressToSource).toEqual({
        '0xA': ContactSource.space,
        '0xC': ContactSource.space,
        '0xB': ContactSource.local,
      })
    })
  })

  describe('useAddressBookItem', () => {
    afterEach(() => {
      remoteContacts = []
      localAddressBook = {}
      signedIn = false
    })

    it('returns the matching contact by address + chainId', () => {
      signedIn = true

      remoteContacts = [
        {
          name: 'Alice',
          address: '0xA',
          chainIds: ['1', '5'],
          createdBy: '',
          lastUpdatedBy: '',
          source: ContactSource.space,
        },
      ]

      const { result } = renderHook(() => useAddressBookItem('0xA', '1'))

      expect(result.current).toEqual(remoteContacts[0])
    })

    it('returns undefined when no chainId is provided', () => {
      localAddressBook = {
        '1': {
          '0xB': 'Bob',
        },
      }

      const { result } = renderHook(() => useAddressBookItem('0xB', undefined))

      expect(result.current).toBeUndefined()
    })
  })
})
