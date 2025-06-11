import { renderHook, act } from '@testing-library/react-hooks'
import { Alert } from 'react-native'
import { useDeleteContact } from './useDeleteContact'
import { removeContact, type Contact } from '@/src/store/addressBookSlice'
import { router } from 'expo-router'

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}))

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}))

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/src/store/addressBookSlice', () => ({
  removeContact: jest.fn(),
}))

const mockDispatch = jest.fn()
const mockSetIsEditing = jest.fn()

const mockContact: Contact = {
  value: '0x1234567890123456789012345678901234567890',
  name: 'Test Contact',
  chainIds: ['1', '137'],
}

describe('useDeleteContact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return handleDeletePress function', () => {
    const { result } = renderHook(() =>
      useDeleteContact({
        contact: mockContact,
        setIsEditing: mockSetIsEditing,
      }),
    )

    expect(result.current.handleDeletePress).toBeDefined()
    expect(typeof result.current.handleDeletePress).toBe('function')
  })

  it('should show confirmation alert when handleDeletePress is called', () => {
    const { result } = renderHook(() =>
      useDeleteContact({
        contact: mockContact,
        setIsEditing: mockSetIsEditing,
      }),
    )

    act(() => {
      result.current.handleDeletePress()
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Contact',
      'Do you really want to delete this contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: expect.any(Function),
        },
      ],
      { cancelable: true },
    )
  })

  it('should not show alert when handleDeletePress is called with no contact', () => {
    const { result } = renderHook(() =>
      useDeleteContact({
        contact: null,
        setIsEditing: mockSetIsEditing,
      }),
    )

    act(() => {
      result.current.handleDeletePress()
    })

    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('should dispatch removeContact, set editing to false, and navigate back when delete is confirmed', () => {
    const { result } = renderHook(() =>
      useDeleteContact({
        contact: mockContact,
        setIsEditing: mockSetIsEditing,
      }),
    )

    // Trigger the alert
    act(() => {
      result.current.handleDeletePress()
    })

    // Get the onPress function from the alert call and trigger it
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
    const deleteButton = alertCall[2][1]
    const onPressFunction = deleteButton.onPress

    act(() => {
      onPressFunction()
    })

    expect(mockDispatch).toHaveBeenCalledWith(removeContact(mockContact.value))
    expect(mockSetIsEditing).toHaveBeenCalledWith(false)

    // Fast-forward through setTimeout
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(router.back).toHaveBeenCalled()
  })

  it('should not perform any action when delete is confirmed with no contact', () => {
    const { result } = renderHook(() =>
      useDeleteContact({
        contact: null,
        setIsEditing: mockSetIsEditing,
      }),
    )

    // Should not show alert when no contact
    act(() => {
      result.current.handleDeletePress()
    })

    expect(Alert.alert).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockSetIsEditing).not.toHaveBeenCalled()
    expect(router.back).not.toHaveBeenCalled()
  })

  it('should execute delete confirmation when alert confirm button is pressed', () => {
    const { result } = renderHook(() =>
      useDeleteContact({
        contact: mockContact,
        setIsEditing: mockSetIsEditing,
      }),
    )

    act(() => {
      result.current.handleDeletePress()
    })

    // Get the onPress function from the alert call
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
    const deleteButton = alertCall[2][1] // Second button (Delete button)
    const onPressFunction = deleteButton.onPress

    act(() => {
      onPressFunction()
    })

    expect(mockDispatch).toHaveBeenCalledWith(removeContact(mockContact.value))
    expect(mockSetIsEditing).toHaveBeenCalledWith(false)

    // Fast-forward through setTimeout
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(router.back).toHaveBeenCalled()
  })

  it('should memoize functions with useCallback', () => {
    const { result, rerender } = renderHook(() =>
      useDeleteContact({
        contact: mockContact,
        setIsEditing: mockSetIsEditing,
      }),
    )

    const firstRenderFunctions = {
      handleDeletePress: result.current.handleDeletePress,
    }

    // Re-render with the same props to test memoization
    rerender(() =>
      useDeleteContact({
        contact: mockContact,
        setIsEditing: mockSetIsEditing,
      }),
    )

    // Functions should be the same reference due to useCallback
    expect(result.current.handleDeletePress).toBe(firstRenderFunctions.handleDeletePress)
  })
})
