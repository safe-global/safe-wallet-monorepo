import { renderHook, act } from '@/src/tests/test-utils'
import { useDelegate } from './useDelegate'
import { selectAllChains } from '@/src/store/chains'
import { faker } from '@faker-js/faker'
import { chainBuilder } from '@safe-global/utils/tests/builders/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const TEST_PRIVATE_KEY = '0xdd503e13625fa99fdea1e1dfb180dd3de94ee4d16c858bb04128b46225f92f84'
// The address corresponding to the test private key
const OWNER_ADDRESS = '0x82E92d643B9B4e767Bd95a85C5e83D248Cb40548'
// Test safe address
const TEST_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockDispatch = jest.fn()
const mockUseAppSelector = jest.fn()
const mockStorePrivateKey = jest.fn()
const mockRegisterDelegateV2 = jest.fn()
const mockRegisterDelegateV3 = jest.fn()
const mockGetDelegateTypedData = jest.mocked(getDelegateTypedData)

const withoutQueueService = () =>
  faker.helpers.arrayElements(Object.values(FEATURES).filter((feature) => feature !== FEATURES.QUEUE_SERVICE))

const transactionServiceChain = () => chainBuilder().with({ features: withoutQueueService() }).build()

const queueServiceChain = () =>
  chainBuilder()
    .with({ features: [...withoutQueueService(), FEATURES.QUEUE_SERVICE] })
    .build()

// Mock ethers Wallet. Signing now goes through `signingKey.sign()` on the raw
// EIP-712 digest, and `hashDelegateTypedData` (real impl) calls these ethers
// helpers — stub them so the digest computation doesn't blow up under the mock.
jest.mock('ethers', () => {
  return {
    ...jest.requireActual('ethers'),
    Wallet: class {
      address = OWNER_ADDRESS
      privateKey = TEST_PRIVATE_KEY
      signingKey = {
        sign: () => ({ serialized: 'mockedSignature' }),
      }

      static createRandom() {
        return {
          address: '0xDelegateAddress123',
          privateKey: '0xDelegatePrivateKey123',
        }
      }
    },
    verifyMessage: () => 'mockedVerification',
    ZeroAddress: '0x0000000000000000000000000000000000000000',
    TypedDataEncoder: { hashStruct: () => `0x${'00'.repeat(32)}`, hash: () => `0x${'00'.repeat(32)}` },
    concat: () => '0x',
    keccak256: () => `0x${'00'.repeat(32)}`,
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

jest.mock('@safe-global/utils/services/delegates', () => {
  const actual = jest.requireActual<typeof import('@safe-global/utils/services/delegates')>(
    '@safe-global/utils/services/delegates',
  )
  return { ...actual, getDelegateTypedData: jest.fn(actual.getDelegateTypedData) }
})

// Import the real addDelegate, no need to mock it
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  cgwApi: {
    useDelegatesPostDelegateV2Mutation: () => [mockRegisterDelegateV2],
    useDelegatesPostDelegateV3Mutation: () => [mockRegisterDelegateV3],
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
  let mockChains: Chain[]

  beforeEach(() => {
    jest.clearAllMocks()

    mockChains = [queueServiceChain(), transactionServiceChain()]

    // Mock chains data
    mockUseAppSelector.mockImplementation((selector: unknown) => {
      if (selector === selectAllChains) {
        return mockChains
      }
      return null
    })

    // Mock successful key storage
    mockStorePrivateKey.mockResolvedValue(true)

    // Mock successful delegate registration
    mockRegisterDelegateV2.mockResolvedValue({ data: 'success' })
    mockRegisterDelegateV3.mockResolvedValue({ data: 'success' })

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
    expect(mockRegisterDelegateV3).toHaveBeenCalledTimes(1)
    expect(mockRegisterDelegateV3).toHaveBeenCalledWith(expect.objectContaining({ chainId: mockChains[0].chainId }))
    expect(mockRegisterDelegateV2).toHaveBeenCalledTimes(1)
    expect(mockRegisterDelegateV2).toHaveBeenCalledWith(expect.objectContaining({ chainId: mockChains[1].chainId }))

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
    expect(mockRegisterDelegateV2).not.toHaveBeenCalled()
    expect(mockRegisterDelegateV3).not.toHaveBeenCalled()

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
    expect(mockRegisterDelegateV3).toHaveBeenCalledWith(
      expect.objectContaining({
        createDelegateDto: expect.objectContaining({
          safe: TEST_SAFE_ADDRESS,
        }),
      }),
    )
    expect(mockRegisterDelegateV2).toHaveBeenCalledWith(
      expect.objectContaining({
        createDelegateDto: expect.objectContaining({
          safe: TEST_SAFE_ADDRESS,
        }),
      }),
    )

    // Just verify that dispatch was called - we'll trust that the real addDelegate implementation works
    expect(mockDispatch.mock.calls[0][0].payload.delegateInfo.safe).toBe(TEST_SAFE_ADDRESS)
  })

  it('should register via the v3 endpoint with queue service typed data on chains with QUEUE_SERVICE', async () => {
    const chain = queueServiceChain()
    mockChains = [chain]
    const safe = faker.finance.ethereumAddress()

    const { result } = renderHook(() => useDelegate())

    let delegateAddress: string | undefined

    await act(async () => {
      delegateAddress = (await result.current.createDelegate(TEST_PRIVATE_KEY, safe)).delegateAddress
    })

    expect(mockGetDelegateTypedData).toHaveBeenCalledWith(chain, delegateAddress, safe)
    expect(mockGetDelegateTypedData).toHaveReturnedWith({
      domain: { name: 'Safe Queue Service', version: '1.0', chainId: Number(chain.chainId), safe },
      types: expect.any(Object),
      message: { delegateAddress, totp: expect.any(Number), action: 'add' },
      primaryType: 'Delegate',
    })
    expect(mockRegisterDelegateV3).toHaveBeenCalledWith({
      chainId: chain.chainId,
      createDelegateDto: {
        safe,
        delegate: delegateAddress,
        delegator: OWNER_ADDRESS,
        signature: 'mockedSignature',
        label: 'Mobile App Delegate',
      },
    })
    expect(mockRegisterDelegateV2).not.toHaveBeenCalled()
  })

  it('should register via the v2 endpoint with transaction service typed data on chains without QUEUE_SERVICE', async () => {
    const chain = transactionServiceChain()
    mockChains = [chain]
    const safe = faker.finance.ethereumAddress()

    const { result } = renderHook(() => useDelegate())

    let delegateAddress: string | undefined

    await act(async () => {
      delegateAddress = (await result.current.createDelegate(TEST_PRIVATE_KEY, safe)).delegateAddress
    })

    expect(mockGetDelegateTypedData).toHaveBeenCalledWith(chain, delegateAddress, safe)
    expect(mockGetDelegateTypedData).toHaveReturnedWith({
      domain: { name: 'Safe Transaction Service', version: '1.0', chainId: Number(chain.chainId) },
      types: expect.any(Object),
      message: { delegateAddress, totp: expect.any(Number) },
      primaryType: 'Delegate',
    })
    expect(mockRegisterDelegateV2).toHaveBeenCalledWith({
      chainId: chain.chainId,
      createDelegateDto: {
        safe,
        delegate: delegateAddress,
        delegator: OWNER_ADDRESS,
        signature: 'mockedSignature',
        label: 'Mobile App Delegate',
      },
    })
    expect(mockRegisterDelegateV3).not.toHaveBeenCalled()
  })
})
