import { renderHook } from '@testing-library/react-native'
import { useScreenProtection } from '../useScreenProtection'

// Mock dependencies
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}))

jest.mock('react-native-capture-protection', () => ({
  CaptureProtection: {
    prevent: jest.fn(),
    allow: jest.fn(),
  },
}))

const mockUseFocusEffect = jest.requireMock('expo-router').useFocusEffect
const mockCaptureProtection = jest.requireMock('react-native-capture-protection').CaptureProtection

describe('useScreenProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call useFocusEffect with correct parameters', () => {
    renderHook(() => useScreenProtection())

    expect(mockUseFocusEffect).toHaveBeenCalledTimes(1)
    expect(mockUseFocusEffect).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should prevent screen capture when focused', () => {
    renderHook(() => useScreenProtection())

    // Get the focus effect callback
    const focusEffectCallback = mockUseFocusEffect.mock.calls[0][0]

    // Execute the focus effect callback
    focusEffectCallback()

    expect(mockCaptureProtection.prevent).toHaveBeenCalledTimes(1)
    expect(mockCaptureProtection.prevent).toHaveBeenCalledWith({
      screenshot: true,
      record: true,
      appSwitcher: true,
    })
  })

  it('should allow screen capture when cleanup is called', () => {
    renderHook(() => useScreenProtection())

    // Get the focus effect callback
    const focusEffectCallback = mockUseFocusEffect.mock.calls[0][0]

    // Execute the focus effect callback and get cleanup function
    const cleanup = focusEffectCallback()

    // Execute cleanup
    cleanup()

    expect(mockCaptureProtection.allow).toHaveBeenCalledTimes(1)
  })

  it('should use custom options when provided', () => {
    const customOptions = {
      screenshot: false,
      record: true,
      appSwitcher: false,
    }

    renderHook(() => useScreenProtection(customOptions))

    // Get the focus effect callback
    const focusEffectCallback = mockUseFocusEffect.mock.calls[0][0]

    // Execute the focus effect callback
    focusEffectCallback()

    expect(mockCaptureProtection.prevent).toHaveBeenCalledTimes(1)
    expect(mockCaptureProtection.prevent).toHaveBeenCalledWith(customOptions)
  })
})
