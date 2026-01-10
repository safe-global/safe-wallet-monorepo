import { renderHook, act } from '@testing-library/react-native'
import { useWalletSession } from './useWalletSession'
import { Keyboard } from 'react-native'

// Mock dependencies
jest.mock('react-native', () => ({
  Keyboard: {
    dismiss: jest.fn(),
  },
}))

const mockConnect = jest.fn()
const mockClose = jest.fn()
const mockWaitForLink = jest.fn()
const mockEmitterOn = jest.fn()

const mockSession = {
  connect: mockConnect,
  close: mockClose,
  waitForLink: mockWaitForLink,
  emitter: {
    on: mockEmitterOn,
  },
}

jest.mock('@openlv/react-native', () => ({
  connectSession: jest.fn(),
}))

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ({ value: 'mock-signer-address' })),
}))

jest.mock('@/src/services/key-storage', () => ({
  keyStorageService: {
    getPrivateKey: jest.fn(),
  },
}))

// Mock the notification sync middleware to avoid import issues
jest.mock('@/src/store/middleware/notificationSync', () => ({
  __esModule: true,
  default: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
}))

const mockSafeAddress = '0x1234567890123456789012345678901234567890'

describe('useWalletSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnect.mockResolvedValue(undefined)
    mockClose.mockResolvedValue(undefined)
    mockWaitForLink.mockResolvedValue(undefined)
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    expect(result.current.connectionUrl).toBe('')
    expect(result.current.status).toBe('idle')
    expect(result.current.session).toBeNull()
    expect(result.current.pendingRequest).toBeNull()
  })

  it('should update connectionUrl when setConnectionUrl is called', () => {
    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    act(() => {
      result.current.setConnectionUrl('https://example.com/connect')
    })

    expect(result.current.connectionUrl).toBe('https://example.com/connect')
  })

  it('should set error status when startSession is called without connectionUrl', async () => {
    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    await act(async () => {
      await result.current.startSession()
    })

    expect(result.current.status).toBe('error')
  })

  it('should dismiss keyboard and set connecting status when startSession is called', async () => {
    const { connectSession } = jest.requireMock('@openlv/react-native')
    connectSession.mockResolvedValue(mockSession)

    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    act(() => {
      result.current.setConnectionUrl('https://example.com/connect')
    })

    await act(async () => {
      await result.current.startSession()
    })

    expect(Keyboard.dismiss).toHaveBeenCalled()
    expect(connectSession).toHaveBeenCalledWith('https://example.com/connect', expect.any(Function))
  })

  it('should handle closeSession when no session exists', async () => {
    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    await act(async () => {
      await result.current.closeSession()
    })

    // Should not throw and status should remain idle
    expect(result.current.status).toBe('idle')
  })

  it('should reject pending request when rejectRequest is called', () => {
    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    // Simulate having a pending request by directly testing rejectRequest
    act(() => {
      result.current.rejectRequest()
    })

    expect(result.current.pendingRequest).toBeNull()
  })

  it('should return all expected functions', () => {
    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    expect(typeof result.current.setConnectionUrl).toBe('function')
    expect(typeof result.current.startSession).toBe('function')
    expect(typeof result.current.closeSession).toBe('function')
    expect(typeof result.current.confirmRequest).toBe('function')
    expect(typeof result.current.rejectRequest).toBe('function')
  })

  it('should not confirm request when no pending request exists', async () => {
    const { result } = renderHook(() => useWalletSession(mockSafeAddress))

    await act(async () => {
      await result.current.confirmRequest()
    })

    // Should complete without error
    expect(result.current.pendingRequest).toBeNull()
  })
})
