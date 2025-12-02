import { renderHook, waitFor } from '@testing-library/react-native'
import { useInitSafeCoreSDK } from './useInitSafeCoreSDK'
import * as useSafeInfoHook from '@/src/hooks/useSafeInfo'
import * as web3Hook from '@/src/hooks/wallets/web3'
import * as safeCoreSDK from './safeCoreSDK'
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

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe: createMockSafe(), safeLoaded: false })
    mockUseWeb3ReadOnly.mockReturnValue(undefined)
  })

  it('resets SDK to undefined when safe is not loaded', () => {
    mockUseSafeInfo.mockReturnValue({ safe: createMockSafe(), safeLoaded: false })
    mockUseWeb3ReadOnly.mockReturnValue(createMockProvider())

    renderHook(() => useInitSafeCoreSDK())

    expect(mockSetSafeSDK).toHaveBeenCalledWith(undefined)
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
    const Logger = require('@/src/utils/logger')

    mockUseSafeInfo.mockReturnValue({ safe: mockSafe, safeLoaded: true })
    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockInitSafeSDK.mockRejectedValue(new Error('Init failed'))

    renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(Logger.error).toHaveBeenCalledWith('error init', expect.any(Error))
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
  })
})
