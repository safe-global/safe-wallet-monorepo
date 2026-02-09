import { renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useThreatAnalysisHypernative } from '../useThreatAnalysisHypernative'
import { isSafeTransaction } from '@safe-global/utils/utils/safeTransaction'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type {
  HypernativeAssessmentResponseDto,
  HypernativeAssessmentFailedResponseDto,
} from '@safe-global/store/hypernative/hypernativeApi.dto'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'

// Mock dependencies
jest.mock('@safe-global/utils/utils/safeTransaction')
jest.mock('@safe-global/protocol-kit/dist/src/utils', () => ({
  calculateSafeTransactionHash: jest.fn(),
}))
jest.mock('@safe-global/store/hypernative/hypernativeApi', () => ({
  hypernativeApi: {
    useAssessTransactionMutation: jest.fn(),
  },
}))

const mockIsSafeTransaction = isSafeTransaction as jest.MockedFunction<typeof isSafeTransaction>
const mockUseAssessTransactionMutation = hypernativeApi.useAssessTransactionMutation as jest.MockedFunction<
  typeof hypernativeApi.useAssessTransactionMutation
>

// Import the mocked function
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
const mockCalculateSafeTransactionHash = calculateSafeTransactionHash as jest.MockedFunction<
  typeof calculateSafeTransactionHash
>

describe('useThreatAnalysisHypernative', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const mockChainId = '1'
  const mockWalletAddress = faker.finance.ethereumAddress()
  const mockSafeVersion = '1.4.1'
  const mockOrigin = 'https://app.example.com'
  const mockSafeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
  const mockAuthToken = 'test-bearer-token-123'

  const createMockSafeTransaction = (): SafeTransaction => ({
    data: {
      to: faker.finance.ethereumAddress(),
      value: '1000000000000000000',
      data: '0x',
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: 1,
    },
    signatures: new Map(),
    addSignature: jest.fn(),
    encodedSignatures: jest.fn(),
    getSignature: jest.fn(),
  })

  const createMockTypedData = (): TypedData => ({
    domain: {
      chainId: 1,
      verifyingContract: mockSafeAddress,
    },
    primaryType: 'SafeTx',
    types: {
      SafeTx: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
      ],
    },
    message: {
      to: faker.finance.ethereumAddress(),
      value: '100',
    },
  })

  const createMockHypernativeResponse = (): HypernativeAssessmentResponseDto['data'] => ({
    safeTxHash: mockSafeTxHash,
    status: 'OK',
    assessmentData: {
      assessmentId: faker.string.uuid(),
      assessmentTimestamp: new Date().toISOString(),
      recommendation: 'accept',
      interpretation: 'Transfer 1 ETH to recipient',
      findings: {
        THREAT_ANALYSIS: {
          status: 'No risks found',
          severity: 'accept',
          risks: [],
        },
        CUSTOM_CHECKS: {
          status: 'Passed',
          severity: 'accept',
          risks: [],
        },
      },
    },
  })

  const mockTriggerAssessment = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockIsSafeTransaction.mockReturnValue(false)
    mockCalculateSafeTransactionHash.mockReturnValue(mockSafeTxHash as `0x${string}`)
    mockUseAssessTransactionMutation.mockReturnValue([
      mockTriggerAssessment,
      { data: undefined, error: undefined, isLoading: false },
    ] as any)
  })

  describe('API calls', () => {
    it('should trigger Hypernative mutation with SafeTransaction data', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          origin: mockOrigin,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(
          expect.objectContaining({
            safeAddress: mockSafeAddress,
            safeTxHash: mockSafeTxHash,
            transaction: expect.objectContaining({
              chain: mockChainId,
              input: '0x',
              operation: '0',
              toAddress: mockSafeTx.data.to,
              fromAddress: mockWalletAddress,
              safeTxGas: '0',
              value: '1000000000000000000',
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
              nonce: String(mockSafeTx.data.nonce),
            }),
            url: mockOrigin,
            authToken: mockAuthToken,
          }),
        )
      })
    })

    it('should not trigger mutation with TypedData (only SafeTransaction)', async () => {
      const mockTypedData = createMockTypedData()

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).not.toHaveBeenCalled()
      })
    })

    it('should not trigger mutation when data is undefined', () => {
      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should not trigger mutation when safeTxHash generation fails', () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)
      mockCalculateSafeTransactionHash.mockReturnValue(undefined as unknown as `0x${string}`)

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should not trigger mutation when walletAddress is empty', () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: '',
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should not trigger mutation when walletAddress is undefined', () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: undefined as unknown as string,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })
  })

  describe('nonce change handling with debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should re-trigger mutation when nonce changes (with debounce)', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      const { rerender } = renderHook(
        ({ data }) =>
          useThreatAnalysisHypernative({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
            authToken: mockAuthToken,
          }),
        { initialProps: { data: mockSafeTx } },
      )

      // Fast-forward past initial debounce
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })

      // Create new transaction with only nonce changed
      const updatedSafeTx = {
        ...mockSafeTx,
        data: {
          ...mockSafeTx.data,
          nonce: mockSafeTx.data.nonce + 1,
        },
      }

      mockTriggerAssessment.mockClear()
      rerender({ data: updatedSafeTx })

      // Should not trigger immediately (debounced)
      expect(mockTriggerAssessment).toHaveBeenCalledTimes(0)

      // Fast-forward past debounce delay
      jest.advanceTimersByTime(300)

      // Should trigger after debounce
      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })
    })

    it('should debounce multiple rapid changes and only trigger once', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      const { rerender } = renderHook(
        ({ data }) =>
          useThreatAnalysisHypernative({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
            authToken: mockAuthToken,
          }),
        { initialProps: { data: mockSafeTx } },
      )

      // Fast-forward past initial debounce
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })

      mockTriggerAssessment.mockClear()

      // Make multiple rapid changes
      const changes = [
        { ...mockSafeTx, data: { ...mockSafeTx.data, nonce: 1 } },
        { ...mockSafeTx, data: { ...mockSafeTx.data, nonce: 2 } },
        { ...mockSafeTx, data: { ...mockSafeTx.data, nonce: 3 } },
      ]

      // Apply changes rapidly (within debounce window)
      changes.forEach((change, index) => {
        rerender({ data: change })
        jest.advanceTimersByTime(100) // Less than 300ms debounce
      })

      // Should not have triggered yet
      expect(mockTriggerAssessment).toHaveBeenCalledTimes(0)

      // Fast-forward past final debounce delay
      jest.advanceTimersByTime(300)

      // Should only trigger once with the final state
      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })
    })

    it('should trigger for non-nonce changes with debounce', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      const { rerender } = renderHook(
        ({ data }) =>
          useThreatAnalysisHypernative({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
            authToken: mockAuthToken,
          }),
        { initialProps: { data: mockSafeTx } },
      )

      // Fast-forward past initial debounce
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })

      // Create new transaction with different data (not just nonce)
      const updatedSafeTx = {
        ...mockSafeTx,
        data: {
          ...mockSafeTx.data,
          to: faker.finance.ethereumAddress(),
          value: '2000000000000000000',
        },
      }

      mockTriggerAssessment.mockClear()
      rerender({ data: updatedSafeTx })

      // Should not trigger immediately (debounced)
      expect(mockTriggerAssessment).toHaveBeenCalledTimes(0)

      // Fast-forward past debounce
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })
    })

    it('should cancel pending debounced calls on unmount', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      const { rerender, unmount } = renderHook(
        ({ data }) =>
          useThreatAnalysisHypernative({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
            authToken: mockAuthToken,
          }),
        { initialProps: { data: mockSafeTx } },
      )

      // Fast-forward past initial debounce
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })

      mockTriggerAssessment.mockClear()

      // Make a change that would trigger debounced update
      const updatedSafeTx = {
        ...mockSafeTx,
        data: {
          ...mockSafeTx.data,
          nonce: mockSafeTx.data.nonce + 1,
        },
      }

      rerender({ data: updatedSafeTx })

      // Unmount before debounce completes
      unmount()

      // Fast-forward past debounce delay
      jest.advanceTimersByTime(300)

      // Should not have triggered after unmount
      expect(mockTriggerAssessment).toHaveBeenCalledTimes(0)
    })
  })

  describe('origin parsing', () => {
    it('should parse origin from JSON string with url property', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const inputUrl = 'https://parsed.example.com'
      const jsonOrigin = JSON.stringify({ url: inputUrl })

      mockIsSafeTransaction.mockReturnValue(true)

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          origin: jsonOrigin,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(
          expect.objectContaining({
            url: inputUrl,
          }),
        )
      })
    })

    it('should use origin as-is when not valid JSON', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const plainOrigin = 'https://plain.example.com'

      mockIsSafeTransaction.mockReturnValue(true)

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          origin: plainOrigin,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(
          expect.objectContaining({
            url: plainOrigin,
          }),
        )
      })
    })
  })

  describe('return values', () => {
    it('should return error when no authToken provided', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      const [, error] = result.current
      expect(error).toBeDefined()
      expect(error?.message).toBe('authToken is required')
      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should return mapped threat data when successful', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockHypernativeResponse = createMockHypernativeResponse()
      mockIsSafeTransaction.mockReturnValue(true)
      mockUseAssessTransactionMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: mockHypernativeResponse, error: undefined, isLoading: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        const [data, error, loading] = result.current
        expect(data).toBeDefined()
        expect(data?.[StatusGroup.THREAT]).toBeDefined()
        expect(error).toBeUndefined()
        expect(loading).toBe(false)
      })
    })

    it('should return error result when mutation fails', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockError: HypernativeAssessmentFailedResponseDto = {
        error: 'Failed to analyze threat',
        errorCode: 500,
        success: false,
        data: null,
      }
      mockIsSafeTransaction.mockReturnValue(true)
      mockUseAssessTransactionMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: undefined, error: mockError, isLoading: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        const [data, error, loading] = result.current
        expect(data).toEqual({ [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] })
        expect(error).toBeDefined()
        expect(error?.message).toContain('Failed to analyze threat')
        expect(loading).toBe(false)
      })
    })

    it('should return loading state when mutation is in progress', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)
      mockUseAssessTransactionMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: undefined, error: undefined, isLoading: true, reset: jest.fn() },
      ])

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      const [, , loading] = result.current
      expect(loading).toBe(true)
    })

    it('should handle Hypernative response with risks', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockHypernativeResponse: HypernativeAssessmentResponseDto['data'] = {
        ...createMockHypernativeResponse(),
        assessmentData: {
          assessmentId: faker.string.uuid(),
          assessmentTimestamp: new Date().toISOString(),
          recommendation: 'deny',
          interpretation: 'Transfer to malicious address',
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'deny',
              risks: [
                {
                  title: 'Transfer to malicious',
                  details: 'Transfer to known phishing address.',
                  severity: 'deny',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      mockIsSafeTransaction.mockReturnValue(true)
      mockUseAssessTransactionMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: mockHypernativeResponse, error: undefined, isLoading: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        const [data] = result.current
        expect(data?.[StatusGroup.THREAT]?.[0]).toEqual(
          expect.objectContaining({
            severity: Severity.CRITICAL,
            type: ThreatStatus.HYPERNATIVE_GUARD,
            title: 'Malicious threat detected',
            description: 'Transfer to malicious. The full threat report is available in your Hypernative account.',
          }),
        )
      })
    })
  })

  describe('skip parameter', () => {
    it('should not trigger mutation when skip is true', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
          skip: true,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).not.toHaveBeenCalled()
      })
    })

    it('should return undefined result when skip is true', () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockHypernativeResponse = createMockHypernativeResponse()
      mockIsSafeTransaction.mockReturnValue(true)
      mockUseAssessTransactionMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: mockHypernativeResponse, error: undefined, isLoading: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
          skip: true,
        }),
      )

      const [data] = result.current
      expect(data).toBeUndefined()
    })

    it('should return undefined result when skip is true even if there is an error', () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockError: HypernativeAssessmentFailedResponseDto = {
        error: 'Failed to analyze threat',
        errorCode: 500,
        success: false,
        data: null,
      }
      mockIsSafeTransaction.mockReturnValue(true)
      mockUseAssessTransactionMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: undefined, error: mockError, isLoading: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
          skip: true,
        }),
      )

      const [data] = result.current
      expect(data).toBeUndefined()
    })

    it('should stop triggering mutation when skip changes from false to true', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      const { rerender } = renderHook(
        ({ skip }) =>
          useThreatAnalysisHypernative({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data: mockSafeTx,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
            authToken: mockAuthToken,
            skip,
          }),
        { initialProps: { skip: false } },
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })

      mockTriggerAssessment.mockClear()
      rerender({ skip: true })

      await waitFor(() => {
        expect(mockTriggerAssessment).not.toHaveBeenCalled()
      })
    })

    it('should start triggering mutation when skip changes from true to false', async () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      const { rerender } = renderHook(
        ({ skip }) =>
          useThreatAnalysisHypernative({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data: mockSafeTx,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
            authToken: mockAuthToken,
            skip,
          }),
        { initialProps: { skip: true } },
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).not.toHaveBeenCalled()
      })

      rerender({ skip: false })

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })
    })

    it('should return undefined when skip is true even with successful mutation data', () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockHypernativeResponse = createMockHypernativeResponse()
      mockIsSafeTransaction.mockReturnValue(true)
      mockUseAssessTransactionMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: mockHypernativeResponse, error: undefined, isLoading: false, reset: jest.fn() },
      ])

      const { result } = renderHook(() =>
        useThreatAnalysisHypernative({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          authToken: mockAuthToken,
          skip: true,
        }),
      )

      const [data, error, loading] = result.current

      expect(data).toBeUndefined()
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should not throw error when skip is true and authToken is missing', () => {
      const mockSafeTx = createMockSafeTransaction()
      mockIsSafeTransaction.mockReturnValue(true)

      expect(() =>
        renderHook(() =>
          useThreatAnalysisHypernative({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data: mockSafeTx,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
            skip: true,
          }),
        ),
      ).not.toThrow()

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })
  })
})
