import { renderHook } from '@/src/tests/test-utils'
import useGasFee from './useGasFee'
import { useFeeParams } from '@/src/hooks/useFeeParams/useFeeParams'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'
import * as chainsSelectors from '@/src/store/chains'
import { generateChecksummedAddress, createMockChain } from '@safe-global/test'

jest.mock('@/src/hooks/useFeeParams/useFeeParams', () => ({
  useFeeParams: jest.fn(),
}))

jest.mock('@/src/store/chains', () => ({
  ...jest.requireActual('@/src/store/chains'),
  selectActiveChain: jest.fn(),
}))

const mockUseFeeParams = useFeeParams as jest.MockedFunction<typeof useFeeParams>
const mockSelectActiveChain = chainsSelectors.selectActiveChain as unknown as jest.Mock

const createMockTxDetails = (): TransactionDetails =>
  ({
    safeAddress: generateChecksummedAddress(),
    txId: faker.string.uuid(),
    executedAt: null,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Custom',
      to: { value: generateChecksummedAddress() },
      value: '0',
      dataSize: '0',
      methodName: null,
      isCancellation: false,
    },
  }) as TransactionDetails

describe('useGasFee', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelectActiveChain.mockReturnValue(createMockChain())
  })

  describe('when loading', () => {
    it('returns "loading..." for totalFee when gas price is loading', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: 10000000000n,
        gasLimit: 21000n,
        isLoadingGasPrice: true,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFee).toBe('loading...')
    })

    it('returns "loading..." for totalFee when gas limit is loading', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: 10000000000n,
        gasLimit: 21000n,
        isLoadingGasPrice: false,
        gasLimitLoading: true,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFee).toBe('loading...')
    })

    it('returns "loading..." when both gas price and limit are loading', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: undefined,
        gasLimit: undefined,
        isLoadingGasPrice: true,
        gasLimitLoading: true,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFee).toBe('loading...')
    })
  })

  describe('when loaded', () => {
    it('calculates and formats totalFee correctly', () => {
      const maxFeePerGas = 10000000000n // 10 gwei
      const gasLimit = 21000n

      mockUseFeeParams.mockReturnValue({
        maxFeePerGas,
        gasLimit,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFee).not.toBe('loading...')
      expect(result.current.totalFeeRaw).toBe(maxFeePerGas * gasLimit)
    })

    it('returns totalFeeRaw as bigint', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: 20000000000n,
        gasLimit: 50000n,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(typeof result.current.totalFeeRaw).toBe('bigint')
      expect(result.current.totalFeeRaw).toBe(20000000000n * 50000n)
    })

    it('returns formatted totalFeeEth', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: 10000000000n,
        gasLimit: 21000n,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFeeEth).toBeDefined()
      expect(typeof result.current.totalFeeEth).toBe('string')
    })

    it('returns estimatedFeeParams from useFeeParams', () => {
      const feeParams = {
        maxFeePerGas: 15000000000n,
        maxPriorityFeePerGas: 1000000000n,
        gasLimit: 100000n,
        nonce: 5,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      }

      mockUseFeeParams.mockReturnValue(feeParams)

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.estimatedFeeParams).toEqual(feeParams)
    })
  })

  describe('with undefined values', () => {
    it('handles undefined maxFeePerGas by using 0n', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: undefined,
        gasLimit: 21000n,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFeeRaw).toBe(0n)
    })

    it('handles undefined gasLimit by using 0n', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: 10000000000n,
        gasLimit: undefined,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFeeRaw).toBe(0n)
    })

    it('handles both undefined maxFeePerGas and gasLimit', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: undefined,
        gasLimit: undefined,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFeeRaw).toBe(0n)
      expect(result.current.totalFee).not.toBe('loading...')
    })
  })

  describe('with manual params', () => {
    it('passes manual params to useFeeParams', () => {
      const manualParams = {
        maxFeePerGas: 25000000000n,
        maxPriorityFeePerGas: 2000000000n,
        gasLimit: 150000n,
        nonce: 10,
      }

      mockUseFeeParams.mockReturnValue({
        ...manualParams,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const txDetails = createMockTxDetails()
      renderHook(() => useGasFee(txDetails, manualParams), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(mockUseFeeParams).toHaveBeenCalledWith(txDetails, manualParams, undefined)
    })

    it('calculates fee based on manual params', () => {
      const manualParams = {
        maxFeePerGas: 30000000000n,
        maxPriorityFeePerGas: 2000000000n,
        gasLimit: 200000n,
        nonce: 15,
      }

      mockUseFeeParams.mockReturnValue({
        ...manualParams,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), manualParams), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFeeRaw).toBe(30000000000n * 200000n)
    })
  })

  describe('with settings', () => {
    it('passes settings to useFeeParams', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: 10000000000n,
        gasLimit: 21000n,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const txDetails = createMockTxDetails()
      const settings = { pooling: false, logError: jest.fn() }

      renderHook(() => useGasFee(txDetails, null, settings), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(mockUseFeeParams).toHaveBeenCalledWith(txDetails, null, settings)
    })
  })

  describe('with undefined txDetails', () => {
    it('handles undefined txDetails', () => {
      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: undefined,
        gasLimit: undefined,
        isLoadingGasPrice: true,
        gasLimitLoading: true,
      })

      const { result } = renderHook(() => useGasFee(undefined, null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFee).toBe('loading...')
      expect(mockUseFeeParams).toHaveBeenCalledWith(undefined, null, undefined)
    })
  })

  describe('with different chain decimals', () => {
    it('formats fee correctly for chain with different decimals', () => {
      mockSelectActiveChain.mockReturnValue(
        createMockChain({
          nativeCurrency: {
            name: 'Test Token',
            symbol: 'TST',
            decimals: 8,
          },
        }),
      )

      mockUseFeeParams.mockReturnValue({
        maxFeePerGas: 1000000n,
        gasLimit: 21000n,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      })

      const { result } = renderHook(() => useGasFee(createMockTxDetails(), null), {
        activeSafe: { chainId: '1', address: generateChecksummedAddress() },
      })

      expect(result.current.totalFee).not.toBe('loading...')
      expect(result.current.totalFeeRaw).toBe(1000000n * 21000n)
    })
  })
})
