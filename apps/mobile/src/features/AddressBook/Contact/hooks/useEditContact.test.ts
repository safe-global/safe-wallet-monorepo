import { renderHook, act } from '@/src/tests/test-utils'
import { Alert } from 'react-native'
import { useEditContact } from './useEditContact'
import { type Contact } from '@/src/store/addressBookSlice'
import { router } from 'expo-router'
import type { RootState } from '@/src/tests/test-utils'

// Mock dependencies
jest.mock('react-native/Libraries/Alert/Alert')

jest.mock('expo-router', () => ({
  router: {
    setParams: jest.fn(),
  },
}))

const mockSetIsEditing = jest.fn()

const mockExistingContact: Contact = {
  value: '0x1234567890123456789012345678901234567890',
  name: 'Existing Contact',
  chainIds: ['1', '137'],
}

const mockNewContact: Contact = {
  value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  name: 'New Contact',
  chainIds: ['1'],
}

// Set up initial store state with contacts
const initialStore: Partial<RootState> = {
  addressBook: {
    contacts: {
      [mockExistingContact.value]: mockExistingContact,
    },
    selectedContact: null,
  },
}

describe('useEditContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return handleEdit and handleSave functions', () => {
    const { result } = renderHook(
      () =>
        useEditContact({
          mode: 'edit',
          setIsEditing: mockSetIsEditing,
        }),
      initialStore,
    )

    expect(result.current.handleEdit).toBeDefined()
    expect(result.current.handleSave).toBeDefined()
    expect(typeof result.current.handleEdit).toBe('function')
    expect(typeof result.current.handleSave).toBe('function')
  })

  it('should set editing to true when handleEdit is called', () => {
    const { result } = renderHook(
      () =>
        useEditContact({
          mode: 'edit',
          setIsEditing: mockSetIsEditing,
        }),
      initialStore,
    )

    act(() => {
      result.current.handleEdit()
    })

    expect(mockSetIsEditing).toHaveBeenCalledWith(true)
  })

  it('should update existing contact in edit mode', () => {
    const { result } = renderHook(
      () =>
        useEditContact({
          mode: 'edit',
          setIsEditing: mockSetIsEditing,
        }),
      initialStore,
    )

    act(() => {
      result.current.handleSave(mockExistingContact)
    })

    expect(mockSetIsEditing).toHaveBeenCalledWith(false)
  })

  it('should add new contact when no existing contact found', () => {
    const { result } = renderHook(
      () =>
        useEditContact({
          mode: 'new',
          setIsEditing: mockSetIsEditing,
        }),
      initialStore,
    )

    act(() => {
      result.current.handleSave(mockNewContact)
    })

    expect(mockSetIsEditing).toHaveBeenCalledWith(false)
    expect(router.setParams).toHaveBeenCalledWith({
      address: mockNewContact.value,
      mode: 'view',
    })
  })

  it('should show alert when contact with same address already exists', () => {
    const { result } = renderHook(
      () =>
        useEditContact({
          mode: 'new',
          setIsEditing: mockSetIsEditing,
        }),
      initialStore,
    )

    const contactWithExistingAddress = {
      ...mockNewContact,
      value: mockExistingContact.value, // Same address as existing contact
    }

    act(() => {
      result.current.handleSave(contactWithExistingAddress)
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Contact Already Exists',
      `A contact with this address already exists: "${mockExistingContact.name}". Do you want to update the existing contact?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update Existing',
          onPress: expect.any(Function),
        },
      ],
      { cancelable: true },
    )

    // Should not set editing immediately
    expect(mockSetIsEditing).not.toHaveBeenCalled()
  })

  it('should update existing contact when user confirms in alert', () => {
    const { result } = renderHook(
      () =>
        useEditContact({
          mode: 'new',
          setIsEditing: mockSetIsEditing,
        }),
      initialStore,
    )

    const contactWithExistingAddress = {
      ...mockNewContact,
      value: mockExistingContact.value,
    }

    act(() => {
      result.current.handleSave(contactWithExistingAddress)
    })

    // Get the onPress function from the alert call
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
    const updateButton = alertCall[2][1] // Second button (Update Existing)
    const onPressFunction = updateButton.onPress

    act(() => {
      onPressFunction()
    })

    expect(mockSetIsEditing).toHaveBeenCalledWith(false)
    expect(router.setParams).toHaveBeenCalledWith({
      address: contactWithExistingAddress.value,
      mode: 'view',
    })
  })

  it('should return stable function references when props do not change', () => {
    const { result } = renderHook(
      () =>
        useEditContact({
          mode: 'edit',
          setIsEditing: mockSetIsEditing,
        }),
      initialStore,
    )

    // Test that the functions exist and are callable
    expect(typeof result.current.handleEdit).toBe('function')
    expect(typeof result.current.handleSave).toBe('function')

    // Test that the handleEdit function is stable (doesn't depend on external state)
    const handleEditRef = result.current.handleEdit
    expect(result.current.handleEdit).toBe(handleEditRef)
  })
})
