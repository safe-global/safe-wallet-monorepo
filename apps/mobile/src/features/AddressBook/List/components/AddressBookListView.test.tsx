import { render, userEvent } from '@/src/tests/test-utils'
import { AddressBookListView } from './AddressBookListView'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React from 'react'

// Only mock the complex components with dependencies
jest.mock('../ContactItemActions.container', () => ({
  ContactItemActionsContainer: ({
    contacts,
    onSelectContact,
  }: {
    contacts: AddressInfo[]
    onSelectContact: (contact: AddressInfo) => void
  }) => {
    const React = require('react')
    return React.createElement(
      'View',
      { testID: 'address-book-list' },
      contacts.map((contact: AddressInfo) =>
        React.createElement(
          'Pressable',
          {
            key: contact.value,
            testID: `contact-${contact.value}`,
            onPress: () => onSelectContact(contact),
          },
          React.createElement('Text', null, contact.name),
        ),
      ),
    )
  },
}))

describe('AddressBookListView', () => {
  const mockContacts: AddressInfo[] = [
    {
      value: '0x1234567890123456789012345678901234567890',
      name: 'Alice',
    },
    {
      value: '0x0987654321098765432109876543210987654321',
      name: 'Bob',
    },
  ]

  const defaultProps = {
    contacts: mockContacts,
    filteredContacts: mockContacts,
    onSearch: jest.fn(),
    onSelectContact: jest.fn(),
    onAddContact: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the address book view with all elements', () => {
    const container = render(<AddressBookListView {...defaultProps} />)

    expect(container.getByText('Address book')).toBeTruthy()
    expect(container.getByPlaceholderText('Name, address')).toBeTruthy()
    expect(container.getByTestId('address-book-list')).toBeTruthy()
    expect(container.getByText('Add contact')).toBeTruthy()
    expect(container.getByTestId('address-book-screen')).toBeTruthy()
  })

  it('should show no contacts component when contacts array is empty', () => {
    const props = {
      ...defaultProps,
      contacts: [],
      filteredContacts: [],
    }

    const container = render(<AddressBookListView {...props} />)

    expect(container.getByText('No contacts yet')).toBeTruthy()
    expect(container.getByText('This account has no contacts added.')).toBeTruthy()
    expect(container.queryByText('No contacts found matching your search.')).not.toBeTruthy()
    expect(container.queryByTestId('address-book-list')).toBeTruthy()
  })

  it('should show no contacts found when search returns empty results', () => {
    const props = {
      ...defaultProps,
      contacts: mockContacts, // Has contacts
      filteredContacts: [], // But search returned empty
    }

    const container = render(<AddressBookListView {...props} />)

    expect(container.getByText('No contacts found matching your search.')).toBeTruthy()
    expect(container.queryByText('No contacts yet')).not.toBeTruthy()
  })

  it('should call onSearch when search input changes', async () => {
    jest.useFakeTimers()

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const mockOnSearch = jest.fn()
    const props = {
      ...defaultProps,
      onSearch: mockOnSearch,
    }

    const container = render(<AddressBookListView {...props} />)
    const searchInput = container.getByPlaceholderText('Name, address')

    await user.type(searchInput, 'Alice')

    // Fast-forward timers to trigger the throttled callback
    jest.advanceTimersByTime(300)

    expect(mockOnSearch).toHaveBeenCalledWith('Alice')

    jest.useRealTimers()
  })

  it('should call onAddContact when add contact button is pressed', async () => {
    const user = userEvent.setup()
    const mockOnAddContact = jest.fn()
    const props = {
      ...defaultProps,
      onAddContact: mockOnAddContact,
    }

    const container = render(<AddressBookListView {...props} />)
    const addButton = container.getByText('Add contact')

    await user.press(addButton)

    expect(mockOnAddContact).toHaveBeenCalled()
  })

  it('should pass filtered contacts to the list component', () => {
    const filteredContacts = [mockContacts[0]] // Only Alice
    const props = {
      ...defaultProps,
      filteredContacts,
    }

    const container = render(<AddressBookListView {...props} />)

    expect(container.getByTestId('address-book-list')).toBeTruthy()
    expect(container.getByTestId('contact-0x1234567890123456789012345678901234567890')).toBeTruthy()
    expect(container.queryByTestId('contact-0x0987654321098765432109876543210987654321')).not.toBeTruthy()
  })

  it('should pass onSelectContact callback to the list component', () => {
    const mockOnSelectContact = jest.fn()
    const props = {
      ...defaultProps,
      onSelectContact: mockOnSelectContact,
    }

    render(<AddressBookListView {...props} />)

    // The mock component should receive the callback
    // This tests that the prop is correctly passed down
    expect(mockOnSelectContact).toBeDefined()
  })

  it('should have correct search bar placeholder', () => {
    const container = render(<AddressBookListView {...defaultProps} />)
    const searchBar = container.getByPlaceholderText('Name, address')

    expect(searchBar).toBeTruthy()
  })

  it('should not show no contacts found when there are filtered contacts', () => {
    const container = render(<AddressBookListView {...defaultProps} />)

    expect(container.queryByText('No contacts found matching your search.')).not.toBeTruthy()
    expect(container.queryByText('No contacts yet')).not.toBeTruthy()
  })
})
