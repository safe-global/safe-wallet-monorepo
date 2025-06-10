import { renderHook, act } from '@testing-library/react-hooks'
import { Alert } from 'react-native'
import { useEditContact } from './useEditContact'
import { addContact, updateContact, type Contact } from '@/src/store/addressBookSlice'
import { router } from 'expo-router'

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}))

jest.mock('expo-router', () => ({
  router: {
    setParams: jest.fn(),
  },
}))

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => {
    // Mock the selectAllContacts selector specifically
    return mockAllContacts
  },
}))

jest.mock('@/src/store/addressBookSlice', () => ({
  selectAllContacts: 'MOCK_SELECT_ALL_CONTACTS',
  addContact: jest.fn(),
  updateContact: jest.fn(),
}))

const mockDispatch = jest.fn()
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

const mockAllContacts = [mockExistingContact]

describe('useEditContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return handleEdit and handleSave functions', () => {
    const { result } = renderHook(() =>
      useEditContact({
        mode: 'edit',
        setIsEditing: mockSetIsEditing,
      }),
    )

    expect(result.current.handleEdit).toBeDefined()
    expect(result.current.handleSave).toBeDefined()
    expect(typeof result.current.handleEdit).toBe('function')
    expect(typeof result.current.handleSave).toBe('function')
  })

  it('should set editing to true when handleEdit is called', () => {
    const { result } = renderHook(() =>
      useEditContact({
        mode: 'edit',
        setIsEditing: mockSetIsEditing,
      }),
    )

    act(() => {
      result.current.handleEdit()
    })

    expect(mockSetIsEditing).toHaveBeenCalledWith(true)
  })

  it('should update existing contact in edit mode', () => {
    const { result } = renderHook(() =>
      useEditContact({
        mode: 'edit',
        setIsEditing: mockSetIsEditing,
      }),
    )

    act(() => {
      result.current.handleSave(mockExistingContact)
    })

    expect(mockDispatch).toHaveBeenCalledWith(updateContact(mockExistingContact))
    expect(mockSetIsEditing).toHaveBeenCalledWith(false)
  })

  it('should add new contact when no existing contact found', () => {
    const { result } = renderHook(() =>
      useEditContact({
        mode: 'new',
        setIsEditing: mockSetIsEditing,
      }),
    )

    act(() => {
      result.current.handleSave(mockNewContact)
    })

    expect(mockDispatch).toHaveBeenCalledWith(addContact(mockNewContact))
    expect(mockSetIsEditing).toHaveBeenCalledWith(false)
    expect(router.setParams).toHaveBeenCalledWith({
      address: mockNewContact.value,
      mode: 'view',
    })
  })

  it('should show alert when contact with same address already exists', () => {
    const { result } = renderHook(() =>
      useEditContact({
        mode: 'new',
        setIsEditing: mockSetIsEditing,
      }),
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

    // Should not dispatch add/update immediately
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockSetIsEditing).not.toHaveBeenCalled()
  })

  it('should update existing contact when user confirms in alert', () => {
    const { result } = renderHook(() =>
      useEditContact({
        mode: 'new',
        setIsEditing: mockSetIsEditing,
      }),
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

    expect(mockDispatch).toHaveBeenCalledWith(updateContact(contactWithExistingAddress))
    expect(mockSetIsEditing).toHaveBeenCalledWith(false)
    expect(router.setParams).toHaveBeenCalledWith({
      address: contactWithExistingAddress.value,
      mode: 'view',
    })
  })

  it('should memoize functions with useCallback', () => {
    const { result, rerender } = renderHook(() =>
      useEditContact({
        mode: 'edit',
        setIsEditing: mockSetIsEditing,
      }),
    )

    const firstRenderFunctions = {
      handleEdit: result.current.handleEdit,
      handleSave: result.current.handleSave,
    }

    // Re-render with the same props to test memoization
    rerender()

    // Functions should be the same reference due to useCallback
    expect(result.current.handleEdit).toBe(firstRenderFunctions.handleEdit)
    expect(result.current.handleSave).toBe(firstRenderFunctions.handleSave)
  })
})
