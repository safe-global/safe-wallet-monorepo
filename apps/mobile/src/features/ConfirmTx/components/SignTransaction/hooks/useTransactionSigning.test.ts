import { renderHook, waitFor, act } from '@/src/tests/test-utils'
import { useTransactionSigning } from './useTransactionSigning'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import logger from '@/src/utils/logger'
import type { RootState } from '@/src/tests/test-utils'

// Mock only external dependencies that can't be mocked through Redux state
jest.mock('@/src/hooks/useSign/useSign')
jest.mock('@/src/services/tx/tx-sender/sign')
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useTransactionsAddConfirmationV1Mutation: jest.fn(),
  cgwApi: {
    util: {
      invalidateTags: jest.fn(() => ({ type: 'cgwApi/invalidateTags' })),
    },
  },
}))
jest.mock('@/src/utils/logger')
jest.mock('@/src/services/ledger/ledger-safe-signing.service')

const mockGetPrivateKey = getPrivateKey as jest.MockedFunction<typeof getPrivateKey>
const mockSignTx = signTx as jest.MockedFunction<typeof signTx>
const mockUseTransactionsAddConfirmationV1Mutation = useTransactionsAddConfirmationV1Mutation as jest.MockedFunction<
  typeof useTransactionsAddConfirmationV1Mutation
>

const mockAddConfirmation = jest.fn(() => ({
  unwrap: jest.fn().mockResolvedValue({ data: 'success' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
})) as any // RTK Query mutation mock

const mockSignedTx = {
  safeTransactionHash: '0xabcd',
  signature: '0xsignature',
}

const mockMutationResult = {
  isLoading: false,
  data: null,
  isError: false,
  reset: jest.fn(),
}

// Create initial Redux state for tests
const createMockState = (overrides?: Partial<RootState>): Partial<RootState> => {
  const mockChain = {
    chainId: '1',
    chainName: 'Ethereum',
    rpcUri: 'https://ethereum.rpc',
    safeAppsRpcUri: 'https://ethereum.rpc',
    publicRpcUri: 'https://ethereum.rpc',
    blockExplorerUriTemplate: {
      address: 'https://etherscan.io/address/{{address}}',
      txHash: 'https://etherscan.io/tx/{{txHash}}',
      api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
    },
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      logoUri: 'https://ethereum.logo',
    },
    transactionService: 'https://safe-transaction-mainnet.safe.global',
    chainLogoUri: 'https://ethereum.logo',
    l2: false,
    description: 'Ethereum Mainnet',
    shortName: 'eth',
    isTestnet: false,
    rpcAuthentication: 'NO_AUTHENTICATION',
    safeAppsRpcAuthentication: 'NO_AUTHENTICATION',
    publicRpcAuthentication: 'NO_AUTHENTICATION',
    features: [
      'CONTRACT_INTERACTION',
      'DOMAIN_LOOKUP',
      'EIP1559',
      'ERC721',
      'SAFE_APPS',
      'SAFE_TX_GAS_OPTIONAL',
      'SAFE_TX_GAS_REQUIRED',
    ],
    gasPrice: [
      {
        type: 'ORACLE',
        uri: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey={{apiKey}}',
        gasParameter: 'FastGasPrice',
        gweiFactor: '1000000000.000000000',
      },
    ],
    ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    theme: {
      textColor: '#001428',
      backgroundColor: '#E8E7E6',
    },
    hidden: false,
    disabledWallets: [],
  }

  return {
    activeSafe: {
      chainId: '1',
      address: '0x123',
    },
    // Mock the cgwClient API slice state structure
    api: {
      queries: {
        'getChainsConfig(undefined)': {
          status: 'fulfilled' as const,
          data: {
            results: [mockChain],
            entities: {
              '1': mockChain,
            },
            ids: ['1'],
          },
        },
      },
    } as unknown as RootState['api'],
    signers: {
      '0x456': {
        value: '0x456',
        name: 'Test Signer',
        logoUri: null,
        type: 'private-key' as const,
      },
    },
    ...overrides,
  }
}

describe('useTransactionSigning', () => {
  const defaultProps = {
    txId: 'test-tx-id',
    signerAddress: '0x456',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([mockAddConfirmation, mockMutationResult])
  })

  describe('initial state', () => {
    it('should return idle status initially', () => {
      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      expect(result.current.status).toBe('idle')
    })

    it('should provide all required methods and properties', () => {
      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      expect(typeof result.current.executeSign).toBe('function')
      expect(typeof result.current.retry).toBe('function')
      expect(typeof result.current.reset).toBe('function')
      expect(result.current.signer).toEqual({
        value: '0x456',
        name: 'Test Signer',
        logoUri: null,
        type: 'private-key',
      })
    })
  })

  describe('executeSign', () => {
    it('should successfully sign transaction', async () => {
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ data: 'success' }),
      })

      const initialState = createMockState()
      const { result } = renderHook(() => useTransactionSigning(defaultProps), initialState)

      await act(async () => {
        await result.current.executeSign()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(mockGetPrivateKey).toHaveBeenCalledWith('0x456')
      expect(mockSignTx).toHaveBeenCalledWith({
        chain: expect.objectContaining({
          chainId: '1',
          chainName: 'Ethereum',
        }),
        activeSafe: initialState.activeSafe,
        txId: 'test-tx-id',
        privateKey: 'private-key',
      })
      expect(mockAddConfirmation).toHaveBeenCalledWith({
        chainId: '1',
        safeTxHash: '0xabcd',
        addConfirmationDto: {
          signature: '0xsignature',
        },
      })
    })

    it('should handle missing private key', async () => {
      mockGetPrivateKey.mockResolvedValue(undefined)

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      await act(async () => {
        try {
          await result.current.executeSign()
        } catch (err) {
          expect((err as Error).message).toBe('Failed to retrieve private key')
        }
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(logger.error).toHaveBeenCalledWith('Error signing transaction:', expect.any(Error))
      expect(mockSignTx).not.toHaveBeenCalled()
      expect(mockAddConfirmation).not.toHaveBeenCalled()
    })

    it('should handle signing errors', async () => {
      const signingError = new Error('Signing failed')
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockRejectedValue(signingError)

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      await act(async () => {
        try {
          await result.current.executeSign()
        } catch (err) {
          expect(err).toBe(signingError)
        }
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(logger.error).toHaveBeenCalledWith('Error signing transaction:', signingError)
      expect(mockAddConfirmation).not.toHaveBeenCalled()
    })

    it('should handle API confirmation errors', async () => {
      const apiError = new Error('API failed')
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockRejectedValue(apiError)

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      await act(async () => {
        try {
          await result.current.executeSign()
        } catch (err) {
          expect(err).toBe(apiError)
        }
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(logger.error).toHaveBeenCalledWith('Error signing transaction:', apiError)
    })

    it('should allow multiple executions when called multiple times', async () => {
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockResolvedValue({ data: 'success' })

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      // Call executeSign multiple times - each call is independent
      await act(async () => {
        await Promise.all([result.current.executeSign(), result.current.executeSign(), result.current.executeSign()])
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Each call executes independently
      expect(mockGetPrivateKey).toHaveBeenCalledTimes(3)
      expect(mockSignTx).toHaveBeenCalledTimes(3)
      expect(mockAddConfirmation).toHaveBeenCalledTimes(3)
    })

    it('should handle Ledger signing', async () => {
      // Create state with a Ledger signer
      const ledgerState = createMockState({
        signers: {
          '0x456': {
            value: '0x456',
            name: 'Ledger Signer',
            logoUri: null,
            type: 'ledger' as const,
            derivationPath: "m/44'/60'/0'/0/0",
          },
        },
      })

      const { result } = renderHook(() => useTransactionSigning(defaultProps), ledgerState)

      // Verify the signer type is correctly read from state
      expect(result.current.signer).toEqual({
        value: '0x456',
        name: 'Ledger Signer',
        logoUri: null,
        type: 'ledger',
        derivationPath: "m/44'/60'/0'/0/0",
      })
    })
  })

  describe('retry', () => {
    it('should reset state and re-execute signing', async () => {
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ data: 'success' }),
      })

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      // First execution
      await act(async () => {
        await result.current.executeSign()
      })
      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Retry should allow re-execution
      await act(async () => {
        await result.current.retry()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(mockGetPrivateKey).toHaveBeenCalledTimes(2)
      expect(mockSignTx).toHaveBeenCalledTimes(2)
    })
  })

  describe('reset', () => {
    it('should reset to idle state', async () => {
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ data: 'success' }),
      })

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      await act(async () => {
        await result.current.executeSign()
      })
      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      act(() => {
        result.current.reset()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('idle')
      })
    })
  })

  describe('API state forwarding', () => {
    it('should forward API loading state', () => {
      mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([
        mockAddConfirmation,
        { isLoading: true, data: null, isError: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      expect(result.current.isApiLoading).toBe(true)
    })

    it('should forward API error state', () => {
      mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([
        mockAddConfirmation,
        { isLoading: false, data: null, isError: true, reset: jest.fn() },
      ])

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      expect(result.current.isApiError).toBe(true)
    })

    it('should forward API data', () => {
      const mockData = { result: 'success' }
      mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([
        mockAddConfirmation,
        { isLoading: false, data: mockData, isError: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() => useTransactionSigning(defaultProps), createMockState())

      expect(result.current.apiData).toBe(mockData)
    })
  })
})
