import { renderHook, waitFor, act } from '@testing-library/react-native'
import { useTransactionSigning } from './useTransactionSigning'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { signTx } from '@/src/services/tx/tx-sender/sign'
import { useTransactionsAddConfirmationV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { useGuard } from '@/src/context/GuardProvider'
import logger from '@/src/utils/logger'

// Mock dependencies
jest.mock('@/src/hooks/useSign/useSign')
jest.mock('@/src/services/tx/tx-sender/sign')
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions')
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('@/src/store/hooks')
jest.mock('@/src/context/GuardProvider')
jest.mock('@/src/utils/logger')

const mockGetPrivateKey = getPrivateKey as jest.MockedFunction<typeof getPrivateKey>
const mockSignTx = signTx as jest.MockedFunction<typeof signTx>
const mockUseTransactionsAddConfirmationV1Mutation = useTransactionsAddConfirmationV1Mutation as jest.MockedFunction<
  typeof useTransactionsAddConfirmationV1Mutation
>
const mockUseDefinedActiveSafe = useDefinedActiveSafe as jest.MockedFunction<typeof useDefinedActiveSafe>
const mockUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>
const mockUseGuard = useGuard as jest.MockedFunction<typeof useGuard>

const mockActiveSafe = {
  chainId: '1',
  address: '0x123' as const,
}

const mockActiveChain = {
  chainId: '1',
  chainName: 'Ethereum',
}

const mockAddConfirmation = jest.fn()
const mockResetGuard = jest.fn()
const mockGetGuard = jest.fn()
const mockSetGuard = jest.fn()
const mockResetAllGuards = jest.fn()

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

describe('useTransactionSigning', () => {
  const defaultProps = {
    txId: 'test-tx-id',
    signerAddress: '0x456',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseDefinedActiveSafe.mockReturnValue(mockActiveSafe)
    mockUseAppSelector.mockReturnValue(mockActiveChain)
    mockUseGuard.mockReturnValue({
      resetGuard: mockResetGuard,
      getGuard: mockGetGuard,
      setGuard: mockSetGuard,
      resetAllGuards: mockResetAllGuards,
      guards: {},
    })
    mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([mockAddConfirmation, mockMutationResult])
  })

  describe('initial state', () => {
    it('should return idle status initially', () => {
      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      expect(result.current.status).toBe('idle')
      expect(result.current.hasTriggeredAutoSign).toBe(false)
    })

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      expect(typeof result.current.executeSign).toBe('function')
      expect(typeof result.current.retry).toBe('function')
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('executeSign', () => {
    it('should successfully sign transaction', async () => {
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockResolvedValue({ data: 'success' })

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      await act(async () => {
        await result.current.executeSign()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(mockGetPrivateKey).toHaveBeenCalledWith('0x456')
      expect(mockSignTx).toHaveBeenCalledWith({
        chain: mockActiveChain,
        activeSafe: mockActiveSafe,
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
      expect(mockResetGuard).toHaveBeenCalledWith('signing')
    })

    it('should handle missing private key', async () => {
      mockGetPrivateKey.mockResolvedValue(undefined)

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      await act(async () => {
        await result.current.executeSign()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(mockSignTx).not.toHaveBeenCalled()
      expect(mockAddConfirmation).not.toHaveBeenCalled()
      expect(mockResetGuard).not.toHaveBeenCalled()
    })

    it('should handle signing errors', async () => {
      const signingError = new Error('Signing failed')
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockRejectedValue(signingError)

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      await act(async () => {
        await result.current.executeSign()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(logger.error).toHaveBeenCalledWith('Error signing transaction:', signingError)
      expect(mockAddConfirmation).not.toHaveBeenCalled()
      expect(mockResetGuard).not.toHaveBeenCalled()
    })

    it('should handle API confirmation errors', async () => {
      const apiError = new Error('API failed')
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockRejectedValue(apiError)

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      await act(async () => {
        await result.current.executeSign()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(logger.error).toHaveBeenCalledWith('Error signing transaction:', apiError)
      expect(mockResetGuard).not.toHaveBeenCalled()
    })

    it('should prevent multiple executions', async () => {
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockResolvedValue({ data: 'success' })

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      // Call executeSign multiple times
      await act(async () => {
        result.current.executeSign()
        result.current.executeSign()
        result.current.executeSign()
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Should only call once
      expect(mockGetPrivateKey).toHaveBeenCalledTimes(1)
      expect(mockSignTx).toHaveBeenCalledTimes(1)
      expect(mockAddConfirmation).toHaveBeenCalledTimes(1)
    })
  })

  describe('retry', () => {
    it('should reset state and re-execute signing', async () => {
      mockGetPrivateKey.mockResolvedValue('private-key')
      mockSignTx.mockResolvedValue(mockSignedTx)
      mockAddConfirmation.mockResolvedValue({ data: 'success' })

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

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
      mockAddConfirmation.mockResolvedValue({ data: 'success' })

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

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
        expect(result.current.hasTriggeredAutoSign).toBe(false)
      })
    })
  })

  describe('API state forwarding', () => {
    it('should forward API loading state', () => {
      mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([
        mockAddConfirmation,
        { isLoading: true, data: null, isError: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      expect(result.current.isApiLoading).toBe(true)
    })

    it('should forward API error state', () => {
      mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([
        mockAddConfirmation,
        { isLoading: false, data: null, isError: true, reset: jest.fn() },
      ])

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      expect(result.current.isApiError).toBe(true)
    })

    it('should forward API data', () => {
      const mockData = { result: 'success' }
      mockUseTransactionsAddConfirmationV1Mutation.mockReturnValue([
        mockAddConfirmation,
        { isLoading: false, data: mockData, isError: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() => useTransactionSigning(defaultProps))

      expect(result.current.apiData).toBe(mockData)
    })
  })
})
