import type { AddressBookState } from '@/store/addressBookSlice'
import {
  createContactItems,
  flattenAddressBook,
  getSelectedAddresses,
} from '@/features/spaces/components/SpaceAddressBook/utils'
import type { ImportContactsFormValues } from '@/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookDialog'

describe('space address book utils', () => {
  describe('flattenAddressBook', () => {
    it('returns an empty array for an empty AddressBookState', () => {
      const emptyState: AddressBookState = {}
      const result = flattenAddressBook(emptyState)
      expect(result).toEqual([])
    })

    it('flattens a single chain with a single address', () => {
      const state: AddressBookState = {
        '1': {
          '0x123': 'Alice',
        },
      }
      const result = flattenAddressBook(state)
      expect(result).toEqual([{ chainId: '1', address: '0x123', name: 'Alice' }])
    })

    it('flattens multiple chains and addresses', () => {
      const state: AddressBookState = {
        '1': {
          '0x123': 'Alice',
          '0x456': 'Bob',
        },
        '5': {
          '0xabc': 'Charlie',
        },
      }
      const result = flattenAddressBook(state)
      expect(result).toHaveLength(3)
      expect(result).toEqual(
        expect.arrayContaining([
          { chainId: '1', address: '0x123', name: 'Alice' },
          { chainId: '1', address: '0x456', name: 'Bob' },
          { chainId: '5', address: '0xabc', name: 'Charlie' },
        ]),
      )
    })

    it('handles repeated addresses on different chains', () => {
      const state: AddressBookState = {
        '1': {
          '0xaaa': 'TokenA',
        },
        '5': {
          '0xaaa': 'TokenB',
        },
      }
      const result = flattenAddressBook(state)
      expect(result).toEqual([
        { chainId: '1', address: '0xaaa', name: 'TokenA' },
        { chainId: '5', address: '0xaaa', name: 'TokenB' },
      ])
    })
  })

  describe('createContactItems', () => {
    it('returns an empty array when no contacts exist', () => {
      const data: ImportContactsFormValues = {
        contacts: {},
      }

      const result = createContactItems(data)
      expect(result).toEqual([])
    })

    it('returns an empty array if all contacts have empty or undefined names', () => {
      const data: ImportContactsFormValues = {
        contacts: {
          '1:0x123': '',
          '5:0x456': undefined,
        },
      }

      const result = createContactItems(data)
      expect(result).toEqual([])
    })

    it('parses valid contacts correctly', () => {
      const data: ImportContactsFormValues = {
        contacts: {
          '1:0x123': 'Alice',
        },
      }

      const result = createContactItems(data)
      expect(result).toEqual([{ chainIds: ['1'], address: '0x123', name: 'Alice' }])
    })

    it('filters out entries without a name and only keeps valid items', () => {
      const data: ImportContactsFormValues = {
        contacts: {
          '1:0x123': 'Alice',
          '1:0x456': '',
          '5:0xABC': 'Charlie',
        },
      }

      const result = createContactItems(data)
      expect(result).toHaveLength(2)
      expect(result).toEqual(
        expect.arrayContaining([
          { chainIds: ['1'], address: '0x123', name: 'Alice' },
          { chainIds: ['5'], address: '0xABC', name: 'Charlie' },
        ]),
      )
    })

    it('parses multiple valid contacts', () => {
      const data: ImportContactsFormValues = {
        contacts: {
          '1:0x123': 'Alice',
          '1:0x456': 'Bob',
          '5:0xABC': 'Charlie',
        },
      }

      const result = createContactItems(data)
      expect(result).toHaveLength(3)
      expect(result).toEqual(
        expect.arrayContaining([
          { chainIds: ['1'], address: '0x123', name: 'Alice' },
          { chainIds: ['1'], address: '0x456', name: 'Bob' },
          { chainIds: ['5'], address: '0xABC', name: 'Charlie' },
        ]),
      )
    })
  })

  describe('getSelectedAddresses', () => {
    it('returns an empty set for an empty contacts object', () => {
      const contacts: ImportContactsFormValues['contacts'] = {}
      const result = getSelectedAddresses(contacts)
      expect(result.size).toBe(0)
    })

    it('returns a set containing a single address if it has a valid name', () => {
      const contacts: ImportContactsFormValues['contacts'] = {
        '1:0x123': 'Alice',
      }
      const result = getSelectedAddresses(contacts)
      expect(result.size).toBe(1)
      expect(result.has('0x123')).toBe(true)
    })

    it('ignores addresses with empty or undefined names', () => {
      const contacts: ImportContactsFormValues['contacts'] = {
        '1:0xAAA': '',
        '5:0xBBB': undefined,
        '1:0xCCC': 'Charlie',
      }
      const result = getSelectedAddresses(contacts)
      expect(result.size).toBe(1)
      expect(result.has('0xCCC')).toBe(true)
      expect(result.has('0xAAA')).toBe(false)
      expect(result.has('0xBBB')).toBe(false)
    })

    it('returns multiple addresses if multiple contacts have valid names', () => {
      const contacts: ImportContactsFormValues['contacts'] = {
        '1:0x111': 'Alice',
        '5:0x222': 'Bob',
        '5:0x333': 'Charlie',
      }
      const result = getSelectedAddresses(contacts)
      expect(result.size).toBe(3)
      expect(result.has('0x111')).toBe(true)
      expect(result.has('0x222')).toBe(true)
      expect(result.has('0x333')).toBe(true)
    })

    it('extracts addresses regardless of chainId', () => {
      const contacts: ImportContactsFormValues['contacts'] = {
        '1:0xABC': 'Name1',
        '10:0xABC': 'Name2',
      }

      const result = getSelectedAddresses(contacts)
      expect(result.size).toBe(1)
      expect(result.has('0xABC')).toBe(true)
    })
  })
})
