import { renderHook, waitFor, act } from '@testing-library/react-native'
import { useInitSafeCoreSDK } from './useInitSafeCoreSDK'
import * as useSafeInfoHook from '@/src/hooks/useSafeInfo'
import * as web3Hook from '@/src/hooks/wallets/web3'
import * as safeCoreSDK from './safeCoreSDK'
import Logger from '@/src/utils/logger'
import Safe from '@safe-global/protocol-kit'
import { generateChecksummedAddress, createMockProvider } from '@safe-global/test'

jest.mock('@/src/hooks/useSafeInfo')
jest.mock('@/src/hooks/wallets/web3')
jest.mock('./safeCoreSDK', () => ({
  initSafeSDK: jest.fn(),
  setSafeSDK: jest.fn(),
}))
jest.mock('@/src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}))

const createMockSafe = (overrides = {}) => ({
  chainId: '1',
  address: { value: generateChecksummedAddress() },
  version: '1.3.0',
  implementationVersionState: 'UP_TO_DATE' as const,
  implementation: { value: generateChecksummedAddress() },
  ...overrides,
})

describe('useInitSafeCoreSDK', () => {
  const mockUseSafeInfo = useSafeInfoHook.default as jest.Mock
  const mockUseWeb3ReadOnly = web3Hook.useWeb3ReadOnly as jest.Mock
  const mockInitSafeSDK = safeCoreSDK.initSafeSDK as jest.Mock
  const mockSetSafeSDK = safeCoreSDK.setSafeSDK as jest.Mock
  const mockLogger = Logger as jest.Mocked<typeof Logger>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe: createMockSafe(), safeLoaded: false })
    mockUseWeb3ReadOnly.mockReturnValue(undefined)
  })

  it('does not initialize SDK when safe is not loaded', () => {
    mockUseSafeInfo.mockReturnValue({ safe: createMockSafe(), safeLoaded: false })
    mockUseWeb3ReadOnly.mockReturnValue(createMockProvider())

    renderHook(() => useInitSafeCoreSDK())

    expect(mockInitSafeSDK).not.toHaveBeenCalled()
  })

  it('does not initialize SDK when safe address is missing', () => {
    const mockSafe = createMockSafe({ address: { value: '' as `0x${string}` } })
    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(createMockProvider())

    renderHook(() => useInitSafeCoreSDK())

    expect(mockInitSafeSDK).not.toHaveBeenCalled()
  })

  it('does not initialize SDK when chainId is missing', () => {
    const mockSafe = createMockSafe({ chainId: '' })
    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(createMockProvider())

    renderHook(() => useInitSafeCoreSDK())

    expect(mockInitSafeSDK).not.toHaveBeenCalled()
  })

  it('resets SDK to undefined when web3ReadOnly is not available', () => {
    mockUseSafeInfo.mockReturnValue({ safe: createMockSafe(), safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(undefined)

    renderHook(() => useInitSafeCoreSDK())

    expect(mockSetSafeSDK).toHaveBeenCalledWith(undefined)
    expect(mockInitSafeSDK).not.toHaveBeenCalled()
  })

  it('initializes SDK when safe is loaded and web3ReadOnly is available', async () => {
    const mockSafe = createMockSafe()
    const mockProvider = createMockProvider()
    const mockSafeInstance = { address: mockSafe.address.value } as unknown as Safe

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockResolvedValue(mockSafeInstance)

    renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledWith({
        provider: mockProvider,
        chainId: mockSafe.chainId,
        address: mockSafe.address.value,
        version: mockSafe.version,
        implementationVersionState: mockSafe.implementationVersionState,
        implementation: mockSafe.implementation.value,
      })
    })

    await waitFor(() => {
      expect(mockSetSafeSDK).toHaveBeenCalledWith(mockSafeInstance)
    })
  })

  it('handles initSafeSDK errors gracefully', async () => {
    const mockSafe = createMockSafe()
    const mockProvider = createMockProvider()

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockRejectedValue(new Error('Init failed'))

    renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockLogger.error).toHaveBeenCalledWith('error init', expect.any(Error))
    })
  })

  it('reinitializes SDK when safe address changes', async () => {
    const mockSafe1 = createMockSafe()
    const mockSafe2 = createMockSafe()
    const mockProvider = createMockProvider()
    const mockSafeInstance = {} as unknown as Safe

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe1, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockResolvedValue(mockSafeInstance)

    const { rerender } = renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
    })

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe2, safeLoaded: true })

    rerender({})

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(2)
    })
  })

  it('reinitializes SDK when chainId changes', async () => {
    const mockSafe = createMockSafe()
    const mockProvider = createMockProvider()
    const mockSafeInstance = {} as unknown as Safe

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockResolvedValue(mockSafeInstance)

    const { rerender } = renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
    })

    const updatedSafe = { ...mockSafe, chainId: '137' }
    mockUseSafeInfo.mockReturnValue({ safe: updatedSafe, safeLoaded: true })

    rerender({})

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(2)
    })
  })

  it('reinitializes SDK when implementation changes', async () => {
    const mockSafe = createMockSafe()
    const mockProvider = createMockProvider()
    const mockSafeInstance = {} as unknown as Safe

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockResolvedValue(mockSafeInstance)

    const { rerender } = renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
    })

    const updatedSafe = { ...mockSafe, implementation: { value: generateChecksummedAddress() } }
    mockUseSafeInfo.mockReturnValue({ safe: updatedSafe, safeLoaded: true })

    rerender({})

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(2)
    })
  })

  it('reinitializes SDK when web3ReadOnly provider changes', async () => {
    const mockSafe = createMockSafe()
    const mockProvider1 = createMockProvider()
    const mockProvider2 = createMockProvider()
    const mockSafeInstance = {} as unknown as Safe

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider1)
    mockInitSafeSDK.mockResolvedValue(mockSafeInstance)

    const { rerender } = renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
    })

    mockUseWeb3ReadOnly.mockReturnValue(mockProvider2)

    rerender({})

    await waitFor(() => {
      expect(mockInitSafeSDK).toHaveBeenCalledTimes(2)
    })
  })

  it('sets SDK to result of initSafeSDK even if undefined', async () => {
    const mockSafe = createMockSafe()
    const mockProvider = createMockProvider()

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockResolvedValue(undefined)

    renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockSetSafeSDK).toHaveBeenLastCalledWith(undefined)
    })

    await waitFor(() => {
      expect(mockLogger.warn).toHaveBeenCalledWith('initSafeSDK returned undefined', {
        chainId: mockSafe.chainId,
        address: mockSafe.address.value,
        providerUrl: expect.any(String),
      })
    })
  })

  it('logs info when SDK is initialized successfully', async () => {
    const mockSafe = createMockSafe()
    const mockProvider = createMockProvider()
    const mockSafeInstance = { address: mockSafe.address.value } as unknown as Safe

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockResolvedValue(mockSafeInstance)

    renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(mockLogger.info).toHaveBeenCalledWith('safe sdk initialized', mockSafeInstance)
    })
  })

  describe('AbortController race condition prevention', () => {
    it('prevents stale operations from updating state when dependencies change rapidly', async () => {
      const mockSafe1 = createMockSafe({ chainId: '1' })
      const mockSafe2 = createMockSafe({ chainId: '137' })
      const mockProvider = createMockProvider()
      const mockSafeInstance1 = { chainId: '1' } as unknown as Safe
      const mockSafeInstance2 = { chainId: '137' } as unknown as Safe

      mockUseSafeInfo.mockReturnValue({ safe: mockSafe1, safeLoaded: true })
      mockUseWeb3ReadOnly.mockReturnValue(mockProvider)

      const slowPromise = new Promise<Safe>((resolve) => {
        setTimeout(() => resolve(mockSafeInstance1), 200)
      })
      const fastPromise = new Promise<Safe>((resolve) => {
        setTimeout(() => resolve(mockSafeInstance2), 50)
      })

      mockInitSafeSDK.mockReturnValueOnce(slowPromise).mockReturnValueOnce(fastPromise)

      const { rerender } = renderHook(() => useInitSafeCoreSDK())

      await waitFor(() => {
        expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
      })

      mockUseSafeInfo.mockReturnValue({ safe: mockSafe2, safeLoaded: true })

      rerender({})

      await waitFor(() => {
        expect(mockInitSafeSDK).toHaveBeenCalledTimes(2)
      })

      await act(async () => {
        jest.advanceTimersByTime(50)
      })

      await waitFor(() => {
        expect(mockSetSafeSDK).toHaveBeenLastCalledWith(mockSafeInstance2)
      })

      const callsAfterFast = mockSetSafeSDK.mock.calls.length

      await act(async () => {
        jest.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(mockSetSafeSDK.mock.calls.length).toBe(callsAfterFast)
      })

      const lastCall = mockSetSafeSDK.mock.calls[mockSetSafeSDK.mock.calls.length - 1]
      expect(lastCall[0]).toBe(mockSafeInstance2)
      expect(mockSetSafeSDK).not.toHaveBeenCalledWith(mockSafeInstance1)
    })

    it('aborts previous operation when dependencies change before completion', async () => {
      const mockSafe1 = createMockSafe()
      const mockSafe2 = createMockSafe()
      const mockProvider = createMockProvider()
      const mockSafeInstance1 = {} as unknown as Safe
      const mockSafeInstance2 = {} as unknown as Safe

      mockUseSafeInfo.mockReturnValue({ safe: mockSafe1, safeLoaded: true })
      mockUseWeb3ReadOnly.mockReturnValue(mockProvider)

      const slowPromise = new Promise<Safe>((resolve) => {
        setTimeout(() => resolve(mockSafeInstance1), 200)
      })
      const fastPromise = new Promise<Safe>((resolve) => {
        setTimeout(() => resolve(mockSafeInstance2), 50)
      })

      mockInitSafeSDK.mockReturnValueOnce(slowPromise).mockReturnValueOnce(fastPromise)

      const { rerender } = renderHook(() => useInitSafeCoreSDK())

      await waitFor(() => {
        expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
      })

      mockUseSafeInfo.mockReturnValue({ safe: mockSafe2, safeLoaded: true })

      rerender({})

      await waitFor(() => {
        expect(mockInitSafeSDK).toHaveBeenCalledTimes(2)
      })

      await act(async () => {
        jest.advanceTimersByTime(50)
      })

      await waitFor(() => {
        expect(mockSetSafeSDK).toHaveBeenLastCalledWith(mockSafeInstance2)
      })

      const callsAfterFast = mockSetSafeSDK.mock.calls.length

      await act(async () => {
        jest.advanceTimersByTime(150)
      })

      await waitFor(() => {
        const calls = mockSetSafeSDK.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall[0]).toBe(mockSafeInstance2)
        expect(mockSetSafeSDK.mock.calls.length).toBe(callsAfterFast)
      })
    })

    it('aborts operation on unmount', async () => {
      const mockSafe = createMockSafe()
      const mockProvider = createMockProvider()
      const mockSafeInstance = {} as unknown as Safe

      mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
      mockUseWeb3ReadOnly.mockReturnValue(mockProvider)

      const pendingPromise = new Promise<Safe>((resolve) => {
        setTimeout(() => resolve(mockSafeInstance), 100)
      })

      mockInitSafeSDK.mockReturnValueOnce(pendingPromise)

      const { unmount } = renderHook(() => useInitSafeCoreSDK())

      await waitFor(() => {
        expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
      })

      const callsBeforeUnmount = mockSetSafeSDK.mock.calls.length

      unmount()

      await act(async () => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(mockSetSafeSDK.mock.calls.length).toBe(callsBeforeUnmount)
      })

      expect(mockSetSafeSDK).not.toHaveBeenCalledWith(mockSafeInstance)
    })

    it('does not update state when operation is aborted after error', async () => {
      const mockSafe1 = createMockSafe()
      const mockSafe2 = createMockSafe()
      const mockProvider = createMockProvider()
      const mockSafeInstance2 = {} as unknown as Safe

      mockUseSafeInfo.mockReturnValue({ safe: mockSafe1, safeLoaded: true })
      mockUseWeb3ReadOnly.mockReturnValue(mockProvider)

      const slowErrorPromise = new Promise<Safe>((_, reject) => {
        setTimeout(() => reject(new Error('Network error')), 200)
      })
      const fastPromise = new Promise<Safe>((resolve) => {
        setTimeout(() => resolve(mockSafeInstance2), 50)
      })

      mockInitSafeSDK.mockReturnValueOnce(slowErrorPromise).mockReturnValueOnce(fastPromise)

      const { rerender } = renderHook(() => useInitSafeCoreSDK())

      await waitFor(() => {
        expect(mockInitSafeSDK).toHaveBeenCalledTimes(1)
      })

      mockUseSafeInfo.mockReturnValue({ safe: mockSafe2, safeLoaded: true })

      rerender({})

      await waitFor(() => {
        expect(mockInitSafeSDK).toHaveBeenCalledTimes(2)
      })

      await act(async () => {
        jest.advanceTimersByTime(50)
      })

      await waitFor(() => {
        expect(mockSetSafeSDK).toHaveBeenLastCalledWith(mockSafeInstance2)
      })

      const callsAfterFast = mockSetSafeSDK.mock.calls.length

      await act(async () => {
        jest.advanceTimersByTime(150)
      })

      await waitFor(() => {
        const calls = mockSetSafeSDK.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall[0]).toBe(mockSafeInstance2)
        expect(mockSetSafeSDK.mock.calls.length).toBe(callsAfterFast)
      })

      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })
})
