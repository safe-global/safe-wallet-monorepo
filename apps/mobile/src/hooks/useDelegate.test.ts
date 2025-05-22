import { renderHook, act } from '@/src/tests/test-utils'
import { useDelegate } from './useDelegate'
import { selectAllChains } from '@/src/store/chains'

const TEST_PRIVATE_KEY = '0xdd503e13625fa99fdea1e1dfb180dd3de94ee4d16c858bb04128b46225f92f84'
// The address corresponding to the test private key
const OWNER_ADDRESS = '0x82E92d643B9B4e767Bd95a85C5e83D248Cb40548'
// Test safe address
const TEST_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockDispatch = jest.fn()
const mockUseAppSelector = jest.fn()
const mockStorePrivateKey = jest.fn()
const mockRegisterDelegate = jest.fn()

// Mock ethers Wallet
jest.mock('ethers', () => {
  return {
    Wallet: class {
      address = OWNER_ADDRESS
      privateKey = TEST_PRIVATE_KEY

      static createRandom() {
        return {
          address: '0xDelegateAddress123',
          privateKey: '0xDelegatePrivateKey123',
        }
      }

      signTypedData() {
        return 'mockedSignature'
      }
    },
    verifyMessage: () => 'mockedVerification',
  }
})

// Explicitly mock siwe to avoid the verifyMessage dependency
jest.mock('siwe', () => ({
  SiweMessage: class {
    constructor(props: {
      address: string
      chainId: number
      domain: string
      statement: string
      nonce: string
      uri: string
      version: string
      issuedAt: string
    }) {
      Object.assign(this, props)
    }

    prepareMessage() {
      return 'mockedSiweMessage'
    }
  },
}))

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector),
}))

jest.mock('@/src/store/chains', () => ({
  selectAllChains: jest.fn(),
}))

// Import the real addDelegate, no need to mock it
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  cgwApi: {
    useDelegatesPostDelegateV2Mutation: () => [mockRegisterDelegate],
  },
}))

jest.mock('./useSign/useSign', () => ({
  useSign: () => ({
    storePrivateKey: mockStorePrivateKey,
  }),
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

describe('useDelegate', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock chains data
    mockUseAppSelector.mockImplementation((selector: unknown) => {
      if (selector === selectAllChains) {
        return [
          { chainId: '1', name: 'Ethereum' },
          { chainId: '137', name: 'Polygon' },
        ]
      }
      return null
    })

    // Mock successful key storage
    mockStorePrivateKey.mockResolvedValue(true)

    // Mock successful delegate registration
    mockRegisterDelegate.mockResolvedValue({ data: 'success' })

    // Mock setTimeout to execute immediately in tests
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create a delegate successfully', async () => {
    const { result } = renderHook(() => useDelegate())

    // Store the initial state before calling the function
    const initialState = { ...result.current }
    expect(initialState.isLoading).toBe(false)
    expect(initialState.error).toBeNull()

    // Call the createDelegate function
    let delegateResult = { success: false } as {
      success: boolean
      delegateAddress?: string
      error?: string
    }

    await act(async () => {
      delegateResult = await result.current.createDelegate(TEST_PRIVATE_KEY)
    })

    // We need to manually trigger the async operations since we can't wait for them
    // Run all pending promises
    await act(async () => {
      jest.runAllTimers()
    })

    // Check the result of the operation
    expect(delegateResult).toBeDefined()
    expect(delegateResult.success).toBe(true)
    expect(delegateResult.delegateAddress).toBeTruthy()
    expect(delegateResult.error).toBeUndefined()

    // Verify the private key was stored in the keychain
    expect(mockStorePrivateKey).toHaveBeenCalledWith(expect.stringContaining('delegate_'), expect.any(String), {
      requireAuthentication: false,
    })

    // Verify the delegate was registered on all chains
    expect(mockRegisterDelegate).toHaveBeenCalledTimes(2) // Once for each chain

    // Verify the delegate was added to the Redux store
    expect(mockDispatch).toHaveBeenCalled()
    expect(mockDispatch.mock.calls.length).toBeGreaterThan(0)

    // Check that the hook's state was updated correctly
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle error when private key storage fails', async () => {
    // Mock failed key storage
    mockStorePrivateKey.mockResolvedValue(false)

    const { result } = renderHook(() => useDelegate())

    let delegateResult = { success: false } as {
      success: boolean
      delegateAddress?: string
      error?: string
    }

    await act(async () => {
      delegateResult = await result.current.createDelegate(TEST_PRIVATE_KEY)
    })

    // Check the result of the operation
    expect(delegateResult.success).toBe(false)
    expect(delegateResult.delegateAddress).toBeUndefined()
    expect(delegateResult.error).toBe('Failed to securely store delegate key')

    // Check that delegate registration was not attempted
    expect(mockRegisterDelegate).not.toHaveBeenCalled()

    // Check that the hook's state was updated correctly
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Failed to securely store delegate key')
  })

  it('should create a delegate for a specific safe address', async () => {
    const { result } = renderHook(() => useDelegate())

    let delegateResult = { success: false } as {
      success: boolean
      delegateAddress?: string
      error?: string
    }

    await act(async () => {
      delegateResult = await result.current.createDelegate(TEST_PRIVATE_KEY, TEST_SAFE_ADDRESS)
    })

    // We need to manually trigger the async operations
    await act(async () => {
      jest.runAllTimers()
    })

    // Check the result of the operation
    expect(delegateResult.success).toBe(true)
    expect(delegateResult.delegateAddress).toBeTruthy()

    // Verify the delegate was registered with the safe address
    expect(mockRegisterDelegate).toHaveBeenCalledWith(
      expect.objectContaining({
        createDelegateDto: expect.objectContaining({
          safe: TEST_SAFE_ADDRESS,
        }),
      }),
    )

    // Just verify that dispatch was called - we'll trust that the real addDelegate implementation works
    expect(mockDispatch.mock.calls[0][0].payload.delegateInfo.safe).toBe(TEST_SAFE_ADDRESS)
  })
})
