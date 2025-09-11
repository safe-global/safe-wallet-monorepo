import { renderHook } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useGuard } from '@/src/context/GuardProvider'
import { useTransactionGuard } from '../useTransactionGuard'

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}))

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/src/context/GuardProvider', () => ({
  useGuard: jest.fn(),
}))

const mockRouter = {
  back: jest.fn(),
}

const mockGuard = {
  getGuard: jest.fn(),
}

describe('useTransactionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useGuard as jest.Mock).mockReturnValue(mockGuard)
  })

  describe('when user can transact initially', () => {
    beforeEach(() => {
      mockGuard.getGuard.mockReturnValue(true)
    })

    it('should return guard as true', () => {
      const { result } = renderHook(() => useTransactionGuard('signing'))

      expect(result.current.guard).toBe(true)
    })

    it('should not show alert', () => {
      renderHook(() => useTransactionGuard('signing'))

      expect(Alert.alert).not.toHaveBeenCalled()
    })
  })

  describe('when user cannot transact initially', () => {
    beforeEach(() => {
      mockGuard.getGuard.mockReturnValue(false)
    })

    it('should return guard as false', () => {
      const { result } = renderHook(() => useTransactionGuard('signing'))

      expect(result.current.guard).toBe(false)
    })

    it('should show security alert for initial unauthorized access', () => {
      renderHook(() => useTransactionGuard('signing'))

      expect(Alert.alert).toHaveBeenCalledWith(
        'Something is fishy!',
        'You somehow got here, but you did not look at the transaction details. Go Back, inspect the transaction details and try again.',
        [
          {
            text: 'Go Back',
            onPress: expect.any(Function),
          },
        ],
      )
    })

    it('should navigate back when alert button is pressed', () => {
      renderHook(() => useTransactionGuard('signing'))

      // Get the onPress function from the Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
      const onPressHandler = alertCall[2][0].onPress

      // Simulate button press
      onPressHandler()

      expect(mockRouter.back).toHaveBeenCalled()
    })

    it('should not show alert multiple times on re-renders', () => {
      const { rerender } = renderHook(() => useTransactionGuard('signing'), {})

      // First render shows alert
      expect(Alert.alert).toHaveBeenCalledTimes(1)

      // Re-render should not show alert again
      rerender({})
      expect(Alert.alert).toHaveBeenCalledTimes(1)
    })
  })

  describe('when guard status changes after being authorized', () => {
    it('should NOT show alert when going from authorized to unauthorized (post-signing)', () => {
      // Start with canSign = true (authorized)
      mockGuard.getGuard.mockReturnValue(true)
      const { result, rerender } = renderHook(() => useTransactionGuard('signing'))

      expect(result.current.guard).toBe(true)
      expect(Alert.alert).not.toHaveBeenCalled()

      // Change to canSign = false (simulating guard reset after signing)
      mockGuard.getGuard.mockReturnValue(false)
      rerender({})

      expect(result.current.guard).toBe(false)
      // Alert should NOT be shown because we were previously authorized
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('should track authorization state across multiple changes', () => {
      // Start unauthorized
      mockGuard.getGuard.mockReturnValue(false)
      const { result, rerender } = renderHook(() => useTransactionGuard('signing'))

      expect(result.current.guard).toBe(false)
      expect(Alert.alert).toHaveBeenCalledTimes(1) // Shows alert for initial unauthorized

      // Become authorized
      mockGuard.getGuard.mockReturnValue(true)
      rerender({})

      expect(result.current.guard).toBe(true)
      expect(Alert.alert).toHaveBeenCalledTimes(1) // No new alert

      // Become unauthorized again (simulating guard reset after signing)
      mockGuard.getGuard.mockReturnValue(false)
      rerender({})

      expect(result.current.guard).toBe(false)
      expect(Alert.alert).toHaveBeenCalledTimes(1) // Still no new alert
    })
  })

  describe('edge cases', () => {
    it('should handle rapid state changes correctly', () => {
      // Multiple rapid changes
      mockGuard.getGuard.mockReturnValue(false)
      const { rerender } = renderHook(() => useTransactionGuard('signing'))

      mockGuard.getGuard.mockReturnValue(true)
      rerender({})

      mockGuard.getGuard.mockReturnValue(false)
      rerender({})

      mockGuard.getGuard.mockReturnValue(true)
      rerender({})

      // Should only show alert once for initial unauthorized state
      expect(Alert.alert).toHaveBeenCalledTimes(1)
    })
  })
})
