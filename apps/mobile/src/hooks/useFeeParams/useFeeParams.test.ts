import { waitFor } from '@testing-library/react-native'
import { createTestStore, renderHookWithStore, type RootState, type TestStore } from '@/src/tests/test-utils'
import { useFeeParams } from './useFeeParams'
import type { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Address } from '@/src/types/address'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'

const mockUseWeb3ReadOnly = jest.fn()
const mockUseDefaultGasPrice = jest.fn()
const mockUseAsync = jest.fn()
const mockUseGasLimit = jest.fn()
const mockUseSafeSDK = jest.fn()
const mockUseSafeTx = jest.fn()

jest.mock('@/src/hooks/wallets/web3', () => ({
  useWeb3ReadOnly: () => mockUseWeb3ReadOnly(),
  getUserNonce: jest.fn(),
}))

jest.mock('@safe-global/utils/hooks/useDefaultGasPrice', () => ({
  useDefaultGasPrice: (...args: unknown[]) => mockUseDefaultGasPrice(...args),
}))

jest.mock('@safe-global/utils/hooks/useAsync', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseAsync(...args),
}))

jest.mock('@safe-global/utils/hooks/useDefaultGasLimit', () => ({
  useGasLimit: (...args: unknown[]) => mockUseGasLimit(...args),
}))

jest.mock('@/src/hooks/coreSDK/safeCoreSDK', () => ({
  useSafeSDK: () => mockUseSafeSDK(),
}))

jest.mock('@/src/hooks/useSafeTx', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSafeTx(...args),
}))

const SAFE_ADDRESS = '0x1234567890123456789012345678901234567890' as Address
const SIGNER_ADDRESS = '0x0987654321098765432109876543210987654321'

const createStoreWithChains = async (overrides?: Partial<RootState>): Promise<TestStore> => {
  const store = createTestStore({
    activeSafe: {
      address: SAFE_ADDRESS,
      chainId: '1',
    },
    activeSigner: {
      [SAFE_ADDRESS]: {
        value: SIGNER_ADDRESS,
        name: 'Test Signer',
        logoUri: null,
        type: 'private-key' as const,
      },
    },
    safes: {
      [SAFE_ADDRESS]: {
        '1': { threshold: 2 },
      },
    } as unknown as RootState['safes'],
    ...overrides,
  })

  await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())

  return store
}

describe('useFeeParams', () => {
  const mockTxDetails = { txId: 'tx123' } as unknown as TransactionDetails

  const mockGasPrice = {
    maxFeePerGas: BigInt('2000000000'),
    maxPriorityFeePerGas: BigInt('1000000000'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWeb3ReadOnly.mockReturnValue({})
    mockUseDefaultGasPrice.mockReturnValue([mockGasPrice, undefined, false])
    mockUseAsync.mockReturnValue([10, undefined, false])
    mockUseGasLimit.mockReturnValue({
      gasLimit: BigInt('21000'),
      gasLimitLoading: false,
      gasLimitError: undefined,
    })
    mockUseSafeSDK.mockReturnValue({})
    mockUseSafeTx.mockReturnValue({})
  })

  describe('with manual params', () => {
    it('should return manual params when provided', async () => {
      const manualParams: EstimatedFeeValues = {
        maxFeePerGas: BigInt('5000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
        gasLimit: BigInt('50000'),
        nonce: 15,
      }

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, manualParams), store)

      expect(result.current.maxFeePerGas).toBe(manualParams.maxFeePerGas)
      expect(result.current.maxPriorityFeePerGas).toBe(manualParams.maxPriorityFeePerGas)
      expect(result.current.gasLimit).toBe(manualParams.gasLimit)
      expect(result.current.nonce).toBe(manualParams.nonce)
    })

    it('should still include loading states with manual params', async () => {
      const manualParams: EstimatedFeeValues = {
        maxFeePerGas: BigInt('5000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
        gasLimit: BigInt('50000'),
        nonce: 15,
      }

      mockUseDefaultGasPrice.mockReturnValue([mockGasPrice, undefined, true])
      mockUseGasLimit.mockReturnValue({
        gasLimit: BigInt('21000'),
        gasLimitLoading: true,
        gasLimitError: undefined,
      })

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, manualParams), store)

      expect(result.current.isLoadingGasPrice).toBe(true)
      expect(result.current.gasLimitLoading).toBe(true)
    })

    it('should include gas limit error with manual params', async () => {
      const manualParams: EstimatedFeeValues = {
        maxFeePerGas: BigInt('5000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
        gasLimit: BigInt('50000'),
        nonce: 15,
      }

      const gasError = new Error('Gas estimation failed')
      mockUseGasLimit.mockReturnValue({
        gasLimit: undefined,
        gasLimitLoading: false,
        gasLimitError: gasError,
      })

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, manualParams), store)

      expect(result.current.gasLimitError).toBe(gasError)
    })
  })

  describe('without manual params', () => {
    it('should return estimated gas price values', async () => {
      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      await waitFor(() => {
        expect(result.current.maxFeePerGas).toBe(mockGasPrice.maxFeePerGas)
        expect(result.current.maxPriorityFeePerGas).toBe(mockGasPrice.maxPriorityFeePerGas)
      })
    })

    it('should return estimated gas limit', async () => {
      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.gasLimit).toBe(BigInt('21000'))
    })

    it('should return user nonce from async hook', async () => {
      mockUseAsync.mockReturnValue([42, undefined, false])

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.nonce).toBe(42)
    })

    it('should handle undefined gas price gracefully', async () => {
      mockUseDefaultGasPrice.mockReturnValue([undefined, undefined, false])

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.maxFeePerGas).toBeUndefined()
      expect(result.current.maxPriorityFeePerGas).toBeUndefined()
    })

    it('should handle undefined gas limit gracefully', async () => {
      mockUseGasLimit.mockReturnValue({
        gasLimit: undefined,
        gasLimitLoading: false,
        gasLimitError: undefined,
      })

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.gasLimit).toBeUndefined()
    })

    it('should handle undefined user nonce', async () => {
      mockUseAsync.mockReturnValue([undefined, undefined, false])

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.nonce).toBeUndefined()
    })
  })

  describe('loading states', () => {
    it('should return loading true when gas price is loading', async () => {
      mockUseDefaultGasPrice.mockReturnValue([undefined, undefined, true])

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.isLoadingGasPrice).toBe(true)
    })

    it('should return loading false when gas price is loaded', async () => {
      mockUseDefaultGasPrice.mockReturnValue([mockGasPrice, undefined, false])

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.isLoadingGasPrice).toBe(false)
    })

    it('should return gas limit loading state', async () => {
      mockUseGasLimit.mockReturnValue({
        gasLimit: undefined,
        gasLimitLoading: true,
        gasLimitError: undefined,
      })

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.gasLimitLoading).toBe(true)
    })
  })

  describe('error states', () => {
    it('should return gas limit error', async () => {
      const gasError = new Error('Failed to estimate gas')
      mockUseGasLimit.mockReturnValue({
        gasLimit: undefined,
        gasLimitLoading: false,
        gasLimitError: gasError,
      })

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.gasLimitError).toBe(gasError)
    })

    it('should handle gas price error gracefully', async () => {
      const gasPriceError = new Error('Failed to fetch gas price')
      mockUseDefaultGasPrice.mockReturnValue([undefined, gasPriceError, false])

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(result.current.maxFeePerGas).toBeUndefined()
      expect(result.current.maxPriorityFeePerGas).toBeUndefined()
    })
  })

  describe('settings', () => {
    it('should pass pooling setting to useDefaultGasPrice', async () => {
      const store = await createStoreWithChains()
      renderHookWithStore(() => useFeeParams(mockTxDetails, null, { pooling: false }), store)

      expect(mockUseDefaultGasPrice).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: '1' }),
        expect.anything(),
        expect.objectContaining({ withPooling: false }),
      )
    })

    it('should default pooling to true', async () => {
      const store = await createStoreWithChains()
      renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(mockUseDefaultGasPrice).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: '1' }),
        expect.anything(),
        expect.objectContaining({ withPooling: true }),
      )
    })

    it('should pass logError to useDefaultGasPrice', async () => {
      const logError = jest.fn()
      const store = await createStoreWithChains()
      renderHookWithStore(() => useFeeParams(mockTxDetails, null, { logError }), store)

      expect(mockUseDefaultGasPrice).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ logError }),
      )
    })

    it('should pass logError to useGasLimit', async () => {
      const logError = jest.fn()
      const store = await createStoreWithChains()
      renderHookWithStore(() => useFeeParams(mockTxDetails, null, { logError }), store)

      expect(mockUseGasLimit).toHaveBeenCalledWith(expect.objectContaining({ logError }))
    })
  })

  describe('hook dependencies', () => {
    it('should call useSafeTx with txDetails', async () => {
      const store = await createStoreWithChains()
      renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(mockUseSafeTx).toHaveBeenCalledWith(mockTxDetails)
    })

    it('should handle undefined txDetails', async () => {
      mockUseSafeTx.mockReturnValue(undefined)

      const store = await createStoreWithChains()
      const { result } = renderHookWithStore(() => useFeeParams(undefined, null), store)

      expect(mockUseSafeTx).toHaveBeenCalledWith(undefined)
      expect(result.current).toBeDefined()
    })

    it('should pass correct params to useGasLimit', async () => {
      const mockSafeTx = { data: { to: '0x123' } }
      mockUseSafeTx.mockReturnValue(mockSafeTx)

      const store = await createStoreWithChains()
      renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(mockUseGasLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          safeTx: mockSafeTx,
          chainId: '1',
          safeAddress: SAFE_ADDRESS,
          threshold: 2,
          walletAddress: SIGNER_ADDRESS,
          isOwner: true,
        }),
      )
    })

    it('should use 0 threshold when safeInfo is undefined', async () => {
      const store = await createStoreWithChains({ safes: {} as RootState['safes'] })
      renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(mockUseGasLimit).toHaveBeenCalledWith(expect.objectContaining({ threshold: 0 }))
    })

    it('should use empty string for walletAddress when activeSigner is undefined', async () => {
      const store = await createStoreWithChains({ activeSigner: {} })
      renderHookWithStore(() => useFeeParams(mockTxDetails, null), store)

      expect(mockUseGasLimit).toHaveBeenCalledWith(expect.objectContaining({ walletAddress: '' }))
    })
  })
})
