import { renderHook, waitFor } from '@/src/tests/test-utils'
import { useTransactionData } from './useTransactionData'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'

// Mock the useDefinedActiveSafe hook
jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: jest.fn(),
}))

const mockUseDefinedActiveSafe = require('@/src/store/hooks/activeSafe').useDefinedActiveSafe

// Helper to create minimal transaction data with faker
const createMockTransactionDetails = (overrides: Partial<TransactionDetails> = {}): TransactionDetails => {
  const baseTransaction = {
    txInfo: {
      type: 'Transfer',
      sender: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
      recipient: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
      direction: 'OUTGOING',
      transferInfo: {
        type: 'NATIVE_COIN',
        value: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
      },
    },
    safeAddress: faker.finance.ethereumAddress(),
    txId: `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64, prefix: '0x' })}`,
    executedAt: faker.date.past().getTime(),
    txStatus: 'SUCCESS',
    txHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
    detailedExecutionInfo: {
      type: 'MULTISIG',
      submittedAt: faker.date.past().getTime(),
      nonce: faker.number.int({ min: 1, max: 100 }),
      safeTxGas: faker.number.int({ min: 0, max: 100000 }),
      baseGas: faker.number.int({ min: 21000, max: 50000 }),
      gasPrice: faker.number.bigInt({ min: 1000000000n, max: 50000000000n }).toString(),
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: { value: '0x0000000000000000000000000000000000000000', name: null, logoUri: null },
      safeTxHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
      executor: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
      signers: [
        { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
        { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
      ],
      confirmationsRequired: faker.number.int({ min: 1, max: 5 }),
      confirmations: [
        {
          signer: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
          signature: faker.string.hexadecimal({ length: 130, prefix: '0x' }),
          submittedAt: faker.date.past().getTime(),
        },
      ],
      rejectors: [],
      gasTokenInfo: null,
      trusted: faker.datatype.boolean(),
      proposer: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
    },
    ...overrides,
  } as TransactionDetails

  return baseTransaction
}

const createMockActiveSafe = () => ({
  address: faker.finance.ethereumAddress(),
  chainId: faker.helpers.arrayElement(['1', '137', '10', '42161']),
  threshold: faker.number.int({ min: 1, max: 3 }),
  owners: faker.helpers.multiple(() => faker.finance.ethereumAddress(), { count: { min: 1, max: 5 } }),
})

describe('useTransactionData', () => {
  let mockTransactionDetails: TransactionDetails
  let mockActiveSafe: ReturnType<typeof createMockActiveSafe>

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Generate fresh mock data for each test
    mockTransactionDetails = createMockTransactionDetails()
    mockActiveSafe = createMockActiveSafe()

    // Default mock for useDefinedActiveSafe
    mockUseDefinedActiveSafe.mockReturnValue(mockActiveSafe)
  })

  afterEach(() => {
    // Reset MSW handlers after each test
    server.resetHandlers()
  })

  describe('successful data fetching', () => {
    it('should fetch transaction data successfully', async () => {
      const txId = faker.string.alphanumeric(10)

      // Setup MSW handler for successful response
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${mockActiveSafe.chainId}/transactions/${txId}`, () => {
          return HttpResponse.json(mockTransactionDetails)
        }),
      )

      const { result } = renderHook(() => useTransactionData(txId))

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()

      // Wait for the data to be fetched
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have successful data
      expect(result.current.data).toEqual(mockTransactionDetails)
      expect(result.current.error).toBeUndefined()
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isFetching).toBe(false)
    })

    // TODO: Fix this test - it's flacky, but can't figure out why
    it.skip('should re-fetch when chainId changes', async () => {
      const txId = faker.string.alphanumeric(10)
      const newChainId = '137'
      const newTransactionDetails = createMockTransactionDetails({
        safeAddress: faker.finance.ethereumAddress(),
        txId: `multisig_different_${faker.string.hexadecimal({ length: 64, prefix: '0x' })}`,
      })

      // Setup handlers for different chains
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${mockActiveSafe.chainId}/transactions/${txId}`, () => {
          return HttpResponse.json(mockTransactionDetails)
        }),
        http.get(`${GATEWAY_URL}/v1/chains/${newChainId}/transactions/${txId}`, () => {
          return HttpResponse.json(newTransactionDetails)
        }),
      )

      const { result, rerender } = renderHook(() => useTransactionData(txId))

      // Wait for first fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.data).toEqual(mockTransactionDetails)

      // Change chainId in activeSafe
      mockUseDefinedActiveSafe.mockReturnValue({
        ...mockActiveSafe,
        chainId: newChainId,
      })

      rerender({})

      // Should trigger new fetch
      await waitFor(() => {
        expect(result.current.data).toEqual(newTransactionDetails)
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const txId = faker.string.alphanumeric(10)
      const errorMessage = faker.lorem.sentence()

      // Setup MSW handler for error response
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${mockActiveSafe.chainId}/transactions/${txId}`, () => {
          return HttpResponse.json({ message: errorMessage }, { status: 404 })
        }),
      )

      const { result } = renderHook(() => useTransactionData(txId))

      // Wait for the error to be handled
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have error state
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeTruthy()
      expect(result.current.isError).toBe(true)
      expect(result.current.isSuccess).toBe(false)
    })

    it('should handle network errors', async () => {
      const txId = faker.string.alphanumeric(10)

      // Setup MSW handler for network error
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${mockActiveSafe.chainId}/transactions/${txId}`, () => {
          return HttpResponse.error()
        }),
      )

      const { result } = renderHook(() => useTransactionData(txId))

      // Wait for the error to be handled
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have error state
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeTruthy()
      expect(result.current.isError).toBe(true)
    })
  })

  describe('skip conditions', () => {
    it('should skip query when txId is empty', () => {
      const { result } = renderHook(() => useTransactionData(''))

      // Should not make any request
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(result.current.isUninitialized).toBe(true)
    })

    it('should skip query when txId is undefined', () => {
      const { result } = renderHook(() => useTransactionData(undefined as unknown as string))

      // Should not make any request
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(result.current.isUninitialized).toBe(true)
    })

    it('should skip query when activeSafe.chainId is missing', () => {
      mockUseDefinedActiveSafe.mockReturnValue({
        ...mockActiveSafe,
        chainId: '',
      })

      const txId = faker.string.alphanumeric(10)
      const { result } = renderHook(() => useTransactionData(txId))

      // Should not make any request
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(result.current.isUninitialized).toBe(true)
    })

    it('should skip query when activeSafe chainId is null', () => {
      mockUseDefinedActiveSafe.mockReturnValue({
        ...mockActiveSafe,
        chainId: null,
      })

      const txId = faker.string.alphanumeric(10)
      const { result } = renderHook(() => useTransactionData(txId))

      // Should not make any request
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(result.current.isUninitialized).toBe(true)
    })
  })

  describe('loading states', () => {
    it('should show correct loading states during fetch', async () => {
      const txId = faker.string.alphanumeric(10)
      let resolveRequest: ((value: unknown) => void) | undefined
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve
      })

      // Setup MSW handler with delayed response
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${mockActiveSafe.chainId}/transactions/${txId}`, async () => {
          await requestPromise
          return HttpResponse.json(mockTransactionDetails)
        }),
      )

      const { result } = renderHook(() => useTransactionData(txId))

      // Should be loading initially
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)
      expect(result.current.isUninitialized).toBe(false)
      expect(result.current.data).toBeUndefined()

      // Resolve the request
      if (resolveRequest) {
        resolveRequest(null)
      }

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toEqual(mockTransactionDetails)
    })
  })

  describe('caching behavior', () => {
    it('should use RTK Query caching mechanism', async () => {
      const txId = faker.string.alphanumeric(10)

      // Setup MSW handler
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/${mockActiveSafe.chainId}/transactions/${txId}`, () => {
          return HttpResponse.json(mockTransactionDetails)
        }),
      )

      // First hook instance
      const { result: result1 } = renderHook(() => useTransactionData(txId))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(result1.current.data).toEqual(mockTransactionDetails)
      expect(result1.current.isSuccess).toBe(true)

      // Second hook instance with same parameters should use cached data
      const { result: result2 } = renderHook(() => useTransactionData(txId))

      // RTK Query should eventually provide the cached data
      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true)
      })
      expect(result2.current.data).toEqual(mockTransactionDetails)
    })
  })
})
