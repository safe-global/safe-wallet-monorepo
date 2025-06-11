import { render, userEvent } from '@/src/tests/test-utils'
import { AddressBookListContainer } from './AddressBookList.container'
import { Contact } from '@/src/store/addressBookSlice'
import * as router from 'expo-router'
import React from 'react'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}))

// Mock the store hooks
jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(() => jest.fn()),
}))

// Mock the AddressBookListView component
jest.mock('./components/AddressBookListView', () => ({
  AddressBookListView: ({
    contacts,
    filteredContacts,
    onSearch,
    onSelectContact,
    onAddContact,
  }: {
    contacts: AddressInfo[]
    filteredContacts: AddressInfo[]
    onSearch: (query: string) => void
    onSelectContact: (contact: AddressInfo) => void
    onAddContact: () => void
  }) => {
    const React = require('react')
    return React.createElement(
      'View',
      { testID: 'address-book-view' },
      React.createElement('Text', { testID: 'total-contacts' }, contacts.length),
      React.createElement('Text', { testID: 'filtered-contacts' }, filteredContacts.length),
      React.createElement('TextInput', { testID: 'search-input', onChangeText: onSearch }),
      React.createElement(
        'Pressable',
        { testID: 'add-contact-btn', onPress: onAddContact },
        React.createElement('Text', null, 'Add Contact'),
      ),
      filteredContacts.map((contact: AddressInfo) =>
        React.createElement(
          'Pressable',
          {
            key: contact.value,
            testID: `select-contact-${contact.value}`,
            onPress: () => onSelectContact(contact),
          },
          React.createElement('Text', null, contact.name),
        ),
      ),
    )
  },
}))

describe('AddressBookListContainer', () => {
  const mockContacts: Contact[] = [
    {
      value: '0x1234567890123456789012345678901234567890',
      name: 'Alice',
      chainIds: ['1'],
    },
    {
      value: '0x0987654321098765432109876543210987654321',
      name: 'Bob',
      chainIds: ['1'],
    },
    {
      value: '0x1111111111111111111111111111111111111111',
      name: 'Charlie',
      chainIds: ['1'],
    },
  ]

  const mockStore = {
    addressBook: {
      contacts: {
        '0x1234567890123456789012345678901234567890': mockContacts[0],
        '0x0987654321098765432109876543210987654321': mockContacts[1],
        '0x1111111111111111111111111111111111111111': mockContacts[2],
      },
      selectedContact: null,
    },
    settings: {
      onboardingVersionSeen: '',
      themePreference: 'auto' as const,
      env: {
        rpc: {},
        tenderly: {
          url: '',
          accessToken: '',
        },
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const { useAppSelector } = require('@/src/store/hooks')
    useAppSelector.mockImplementation((selector: (state: unknown) => unknown) => {
      if (selector.toString().includes('selectAllContacts')) {
        return mockContacts
      }
      return selector(mockStore)
    })
  })

  it('should render with contacts from Redux store', () => {
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    expect(container.getByTestId('address-book-view')).toBeTruthy()
    expect(container.getByTestId('total-contacts')).toHaveTextContent('3')
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('3')
  })

  it('should filter contacts by name when searching', async () => {
    const user = userEvent.setup()
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    const searchInput = container.getByTestId('search-input')
    await user.type(searchInput, 'Alice')

    // Should show only Alice in filtered results
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('1')
    expect(container.getByTestId('select-contact-0x1234567890123456789012345678901234567890')).toBeTruthy()
    expect(container.queryByTestId('select-contact-0x0987654321098765432109876543210987654321')).not.toBeTruthy()
  })

  it('should filter contacts by address when searching', async () => {
    const user = userEvent.setup()
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    const searchInput = container.getByTestId('search-input')
    await user.type(searchInput, '0x0987654321')

    // Should show only Bob in filtered results
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('1')
    expect(container.getByTestId('select-contact-0x0987654321098765432109876543210987654321')).toBeTruthy()
    expect(container.queryByTestId('select-contact-0x1234567890123456789012345678901234567890')).not.toBeTruthy()
  })

  it('should show all contacts when search is empty', async () => {
    const user = userEvent.setup()
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    const searchInput = container.getByTestId('search-input')

    // First search for something
    await user.type(searchInput, 'Alice')
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('1')

    // Then clear the search
    await user.clear(searchInput)
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('3')
  })

  it('should be case insensitive when searching', async () => {
    const user = userEvent.setup()
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    const searchInput = container.getByTestId('search-input')
    await user.type(searchInput, 'ALICE')

    // Should still find Alice despite case difference
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('1')
    expect(container.getByTestId('select-contact-0x1234567890123456789012345678901234567890')).toBeTruthy()
  })

  it('should navigate to contact view when selecting a contact', async () => {
    const user = userEvent.setup()
    const mockPush = jest.spyOn(router.router, 'push')
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    const selectContactBtn = container.getByTestId('select-contact-0x1234567890123456789012345678901234567890')
    await user.press(selectContactBtn)

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/contact',
      params: {
        address: '0x1234567890123456789012345678901234567890',
        mode: 'view',
      },
    })
  })

  it('should navigate to add contact when pressing add contact button', async () => {
    const user = userEvent.setup()
    const mockPush = jest.spyOn(router.router, 'push')
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    const addContactBtn = container.getByTestId('add-contact-btn')
    await user.press(addContactBtn)

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/contact',
      params: {
        mode: 'new',
      },
    })
  })

  it('should show empty results when search matches nothing', async () => {
    const user = userEvent.setup()
    const container = render(<AddressBookListContainer />, { initialStore: mockStore })

    const searchInput = container.getByTestId('search-input')
    await user.type(searchInput, 'NonexistentName')

    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('0')
    expect(container.queryByTestId('select-contact-0x1234567890123456789012345678901234567890')).not.toBeTruthy()
    expect(container.queryByTestId('select-contact-0x0987654321098765432109876543210987654321')).not.toBeTruthy()
    expect(container.queryByTestId('select-contact-0x1111111111111111111111111111111111111111')).not.toBeTruthy()
  })

  it('should handle empty contacts array from store', () => {
    const { useAppSelector } = require('@/src/store/hooks')
    useAppSelector.mockImplementation((selector: (state: unknown) => unknown) => {
      if (selector.toString().includes('selectAllContacts')) {
        return []
      }
      return selector({
        addressBook: {
          contacts: {},
          selectedContact: null,
        },
        settings: {
          onboardingVersionSeen: '',
          themePreference: 'auto' as const,
          env: {
            rpc: {},
            tenderly: {
              url: '',
              accessToken: '',
            },
          },
        },
      })
    })

    const emptyStore = {
      addressBook: {
        contacts: {},
        selectedContact: null,
      },
      settings: {
        onboardingVersionSeen: '',
        themePreference: 'auto' as const,
        env: {
          rpc: {},
          tenderly: {
            url: '',
            accessToken: '',
          },
        },
      },
    }

    const container = render(<AddressBookListContainer />, { initialStore: emptyStore })

    expect(container.getByTestId('total-contacts')).toHaveTextContent('0')
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('0')
  })

  it('should handle contacts without names in search', async () => {
    const contactWithoutName: Contact = {
      value: '0x1234567890123456789012345678901234567890',
      name: '',
      chainIds: ['1'],
    }

    const { useAppSelector } = require('@/src/store/hooks')
    useAppSelector.mockImplementation((selector: (state: unknown) => unknown) => {
      if (selector.toString().includes('selectAllContacts')) {
        return [contactWithoutName]
      }
      return selector({
        addressBook: {
          contacts: {
            '0x1234567890123456789012345678901234567890': contactWithoutName,
          },
          selectedContact: null,
        },
        settings: {
          onboardingVersionSeen: '',
          themePreference: 'auto' as const,
          env: {
            rpc: {},
            tenderly: {
              url: '',
              accessToken: '',
            },
          },
        },
      })
    })

    const storeWithUnnamedContacts = {
      addressBook: {
        contacts: {
          '0x1234567890123456789012345678901234567890': contactWithoutName,
        },
        selectedContact: null,
      },
      settings: {
        onboardingVersionSeen: '',
        themePreference: 'auto' as const,
        env: {
          rpc: {},
          tenderly: {
            url: '',
            accessToken: '',
          },
        },
      },
    }

    const user = userEvent.setup()
    const container = render(<AddressBookListContainer />, { initialStore: storeWithUnnamedContacts })

    const searchInput = container.getByTestId('search-input')
    await user.type(searchInput, '0x1234')

    // Should still find the contact by address
    expect(container.getByTestId('filtered-contacts')).toHaveTextContent('1')
  })
})
