import { renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useThreatAnalysisHypernative } from '../useThreatAnalysisHypernative'
import { isSafeTransaction } from '@safe-global/utils/utils/safeTransaction'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { HypernativeAssessmentResponseDto } from '@safe-global/store/hypernative/hypernativeApi.dto'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'

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

  const createMockHypernativeResponse = (): HypernativeAssessmentResponseDto => ({
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
  })

  describe('nonce change handling', () => {
    it('should not re-trigger mutation when only nonce changes', async () => {
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

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })

      // Change only nonce
      const updatedSafeTx = {
        ...mockSafeTx,
        data: { ...mockSafeTx.data, nonce: 2 },
      }

      mockTriggerAssessment.mockClear()
      rerender({ data: updatedSafeTx })

      // Should not trigger again since only nonce changed
      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(0)
      })
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
    it('should throw error when no authToken provided', async () => {
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
          }),
        ),
      ).toThrow('authToken is required')

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
      const mockError = { error: 'Failed to analyze threat' }
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
        expect(data).toBeUndefined()
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
      const mockHypernativeResponse: HypernativeAssessmentResponseDto = {
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
                  details: 'Transfer to known phishing address',
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
            title: 'Transfer to malicious',
            description: 'Transfer to known phishing address',
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
      const mockError = { error: 'Failed to analyze threat' }
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
