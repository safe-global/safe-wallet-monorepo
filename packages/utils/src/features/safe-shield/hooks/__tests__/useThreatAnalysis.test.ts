import { renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useThreatAnalysis } from '../useThreatAnalysis'
import { useSafeShieldAnalyzeThreatV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { generateTypedData } from '../../utils/generateTypedData'
import { isSafeTransaction } from '../../../../utils/safeTransaction'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { StatusGroup } from '../../types'
import { ThreatAnalysisBuilder } from '../../builders/threat-analysis.builder'
import { ErrorType, getErrorInfo } from '../../utils/errors'

// Mock dependencies
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safe-shield')
jest.mock('../../utils/generateTypedData')
jest.mock('../../../../utils/safeTransaction')

const mockUseSafeShieldAnalyzeThreatV1Mutation = useSafeShieldAnalyzeThreatV1Mutation as jest.MockedFunction<
  typeof useSafeShieldAnalyzeThreatV1Mutation
>
const mockGenerateTypedData = generateTypedData as jest.MockedFunction<typeof generateTypedData>
const mockIsSafeTransaction = isSafeTransaction as jest.MockedFunction<typeof isSafeTransaction>

describe('useThreatAnalysis', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const mockChainId = '1'
  const mockWalletAddress = faker.finance.ethereumAddress()
  const mockSafeVersion = '1.3.0'
  const mockOrigin = 'https://app.example.com'

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

  const mockTriggerAnalysis = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
      mockTriggerAnalysis,
      { data: undefined, error: undefined, isLoading: false },
    ] as any)
    mockIsSafeTransaction.mockReturnValue(false)
  })

  describe('mutation triggering', () => {
    it('should trigger mutation when typed data is available', async () => {
      const mockTypedData = createMockTypedData()
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: mockWalletAddress,
          origin: mockOrigin,
          safeVersion: mockSafeVersion,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledWith({
          chainId: mockChainId,
          safeAddress: mockSafeAddress,
          threatAnalysisRequestDto: {
            data: mockTypedData,
            walletAddress: mockWalletAddress,
            origin: mockOrigin,
          },
        })
      })
    })

    it('should generate typed data from SafeTransaction and trigger mutation', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockTypedData = createMockTypedData()

      mockIsSafeTransaction.mockReturnValue(true)
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockSafeTx,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      await waitFor(() => {
        expect(mockGenerateTypedData).toHaveBeenCalledWith({
          data: mockSafeTx,
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeVersion: mockSafeVersion,
        })
        expect(mockTriggerAnalysis).toHaveBeenCalled()
      })
    })

    it('should not trigger mutation when data is undefined', () => {
      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      expect(mockTriggerAnalysis).not.toHaveBeenCalled()
    })

    it('should not trigger mutation when required parameters are missing', () => {
      const mockTypedData = createMockTypedData()
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: '',
          safeVersion: mockSafeVersion,
        }),
      )

      expect(mockTriggerAnalysis).not.toHaveBeenCalled()
    })
  })

  describe('nonce change handling', () => {
    it('should not re-trigger mutation when only nonce changes in SafeTransaction', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockTypedData = createMockTypedData()

      mockIsSafeTransaction.mockReturnValue(true)
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      const { rerender } = renderHook(
        ({ data }) =>
          useThreatAnalysis({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
          }),
        { initialProps: { data: mockSafeTx } },
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
      })

      // Change only nonce
      const updatedSafeTx = {
        ...mockSafeTx,
        data: { ...mockSafeTx.data, nonce: 2 },
      }

      mockTriggerAnalysis.mockClear()
      rerender({ data: updatedSafeTx })

      // Should not trigger again since only nonce changed
      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(0)
      })
    })

    it('should re-trigger mutation when other fields change in SafeTransaction', async () => {
      const mockSafeTx = createMockSafeTransaction()
      const mockTypedData = createMockTypedData()
      const mockTypedData2 = { ...createMockTypedData(), message: { ...mockTypedData.message, value: '200' } }

      mockIsSafeTransaction.mockReturnValue(true)
      mockGenerateTypedData.mockReturnValueOnce(mockTypedData)

      const { rerender } = renderHook(
        ({ data }) =>
          useThreatAnalysis({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data,
            walletAddress: mockWalletAddress,
            safeVersion: mockSafeVersion,
          }),
        { initialProps: { data: mockSafeTx } },
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
      })

      // Change value field
      const updatedSafeTx = {
        ...mockSafeTx,
        data: { ...mockSafeTx.data, value: '2000000000000000000' },
      }

      // Return different typed data for the updated transaction
      mockGenerateTypedData.mockReturnValueOnce(mockTypedData2)
      mockTriggerAnalysis.mockClear()
      rerender({ data: updatedSafeTx })

      // Should trigger again since value changed
      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('origin parsing', () => {
    it('should parse origin from JSON string with url property', async () => {
      const mockTypedData = createMockTypedData()
      const jsonOrigin = JSON.stringify({ url: 'https://parsed.example.com' })

      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: mockWalletAddress,
          origin: jsonOrigin,
          safeVersion: mockSafeVersion,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({
            threatAnalysisRequestDto: expect.objectContaining({
              origin: 'https://parsed.example.com',
            }),
          }),
        )
      })
    })

    it('should use origin as-is when not valid JSON', async () => {
      const mockTypedData = createMockTypedData()
      const plainOrigin = 'https://plain.example.com'

      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: mockWalletAddress,
          origin: plainOrigin,
          safeVersion: mockSafeVersion,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({
            threatAnalysisRequestDto: expect.objectContaining({
              origin: plainOrigin,
            }),
          }),
        )
      })
    })

    it('should handle undefined origin', async () => {
      const mockTypedData = createMockTypedData()
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({
            threatAnalysisRequestDto: expect.objectContaining({
              origin: undefined,
            }),
          }),
        )
      })
    })

    it('should ignore empty url in JSON origin', async () => {
      const mockTypedData = createMockTypedData()
      const jsonOrigin = JSON.stringify({ url: '' })

      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: mockWalletAddress,
          origin: jsonOrigin,
          safeVersion: mockSafeVersion,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({
            threatAnalysisRequestDto: expect.objectContaining({
              origin: undefined,
            }),
          }),
        )
      })
    })
  })

  describe('return values', () => {
    it('should return threat data, no error, and not loading when successful', () => {
      const mockThreatResult = ThreatAnalysisBuilder.noThreat()!

      mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: mockThreatResult[0], error: undefined, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      const [data, error, loading] = result.current

      expect(data).toEqual(mockThreatResult[0])
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should return error and common failure when mutation fails', () => {
      const mockError = { error: 'Failed to analyze threat' }

      mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: mockError, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      const [data, error, loading] = result.current

      expect(data).toEqual({ [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] })
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Failed to analyze threat')
      expect(loading).toBe(false)
    })

    it('should return loading state when mutation is in progress', () => {
      mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: undefined, isLoading: true },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      const [data, error, loading] = result.current

      expect(data).toBeUndefined()
      expect(error).toBeUndefined()
      expect(loading).toBe(true)
    })

    it('should handle error without error property', () => {
      const mockError = { status: 500 }

      mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: mockError, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
        }),
      )

      const [, error] = result.current

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Failed to fetch threat analysis')
    })
  })

  describe('skip parameter', () => {
    it('should not trigger mutation when skip is true', async () => {
      const mockTypedData = createMockTypedData()
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: mockTypedData,
          walletAddress: mockWalletAddress,
          origin: mockOrigin,
          safeVersion: mockSafeVersion,
          skip: true,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).not.toHaveBeenCalled()
      })
    })

    it('should return undefined result when skip is true', () => {
      const mockThreatResult = ThreatAnalysisBuilder.noThreat()!

      mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: mockThreatResult[0], error: undefined, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          skip: true,
        }),
      )

      const [data] = result.current
      expect(data).toBeUndefined()
    })

    it('should return undefined result when skip is true even if there is an error', () => {
      const mockError = { error: 'Failed to analyze threat' }

      mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: mockError, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          skip: true,
        }),
      )

      const [data] = result.current
      expect(data).toBeUndefined()
    })

    it('should stop triggering mutation when skip changes from false to true', async () => {
      const mockTypedData = createMockTypedData()
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      const { rerender } = renderHook(
        ({ skip }) =>
          useThreatAnalysis({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data: mockTypedData,
            walletAddress: mockWalletAddress,
            origin: mockOrigin,
            safeVersion: mockSafeVersion,
            skip,
          }),
        { initialProps: { skip: false } },
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
      })

      mockTriggerAnalysis.mockClear()
      rerender({ skip: true })

      await waitFor(() => {
        expect(mockTriggerAnalysis).not.toHaveBeenCalled()
      })
    })

    it('should start triggering mutation when skip changes from true to false', async () => {
      const mockTypedData = createMockTypedData()
      mockGenerateTypedData.mockReturnValue(mockTypedData)

      const { rerender } = renderHook(
        ({ skip }) =>
          useThreatAnalysis({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            data: mockTypedData,
            walletAddress: mockWalletAddress,
            origin: mockOrigin,
            safeVersion: mockSafeVersion,
            skip,
          }),
        { initialProps: { skip: true } },
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).not.toHaveBeenCalled()
      })

      rerender({ skip: false })

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
      })
    })

    it('should return undefined when skip is true even with successful mutation data', () => {
      const mockThreatResult = ThreatAnalysisBuilder.noThreat()!

      mockUseSafeShieldAnalyzeThreatV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: mockThreatResult[0], error: undefined, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          data: undefined,
          walletAddress: mockWalletAddress,
          safeVersion: mockSafeVersion,
          skip: true,
        }),
      )

      const [data, error, loading] = result.current

      expect(data).toBeUndefined()
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })
  })
})
