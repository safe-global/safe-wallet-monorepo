import { renderHook, waitFor, act } from '@/src/tests/test-utils'
import { useLedgerAddresses } from './useLedgerAddresses'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { ledgerEthereumService, type EthereumAddress } from '@/src/services/ledger/ledger-ethereum.service'
import { faker } from '@faker-js/faker'
import logger from '@/src/utils/logger'

// Mock the ledger services
jest.mock('@/src/services/ledger/ledger-dmk.service', () => ({
  ledgerDMKService: {
    getCurrentSession: jest.fn(),
  },
}))

jest.mock('@/src/services/ledger/ledger-ethereum.service', () => ({
  ledgerEthereumService: {
    getEthereumAddresses: jest.fn(),
  },
}))

const mockLedgerDMKService = ledgerDMKService as jest.Mocked<typeof ledgerDMKService>
const mockLedgerEthereumService = ledgerEthereumService as jest.Mocked<typeof ledgerEthereumService>

describe('useLedgerAddresses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const createMockSessionId = () => faker.string.uuid()
  const createMockAddress = () => faker.finance.ethereumAddress()
  const createMockPath = (index: number) => `m/44'/60'/0'/0/${index}`

  const createMockAddresses = (count: number, startIndex = 0): EthereumAddress[] => {
    return Array.from({ length: count }, (_, i) => {
      const index = startIndex + i
      return {
        address: createMockAddress(),
        path: createMockPath(index),
        index,
      }
    })
  }

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const sessionId = createMockSessionId()
      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      expect(result.current.addresses).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.fetchAddresses).toBe('function')
    })

    it('should work without sessionId parameter', () => {
      const { result } = renderHook(() => useLedgerAddresses({}))

      expect(result.current.addresses).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('session validation', () => {
    it('should fail validation when sessionId is not provided', async () => {
      const { result } = renderHook(() => useLedgerAddresses({}))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'SESSION',
        message: 'No device session found',
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.addresses).toEqual([])
    })

    it('should fail validation when no current session exists', async () => {
      const sessionId = createMockSessionId()
      mockLedgerDMKService.getCurrentSession.mockReturnValue(null)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'SESSION',
        message: 'Device session not found or expired',
      })
      expect(result.current.isLoading).toBe(false)
    })

    it('should fail validation when session does not match', async () => {
      const sessionId = createMockSessionId()
      const differentSessionId = createMockSessionId()
      mockLedgerDMKService.getCurrentSession.mockReturnValue(differentSessionId)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'SESSION',
        message: 'Device session not found or expired',
      })
      expect(result.current.isLoading).toBe(false)
    })

    it('should pass validation when sessions match', async () => {
      const sessionId = createMockSessionId()
      const mockAddresses = createMockAddresses(3)

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockResolvedValue(mockAddresses)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(3)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.addresses).toEqual(mockAddresses)
    })
  })

  describe('address fetching', () => {
    it('should successfully fetch addresses', async () => {
      const sessionId = createMockSessionId()
      const mockAddresses = createMockAddresses(5)

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockResolvedValue(mockAddresses)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.addresses).toEqual(mockAddresses)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledWith(sessionId, 5, 0)
    })

    it('should set loading state during fetch', async () => {
      const sessionId = createMockSessionId()
      let resolveAddresses: ((addresses: EthereumAddress[]) => void) | undefined
      const addressesPromise = new Promise<EthereumAddress[]>((resolve) => {
        resolveAddresses = resolve
      })

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockReturnValue(addressesPromise)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      // Start fetching
      const fetchPromise = result.current.fetchAddresses(3)

      // Check loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the promise
      if (resolveAddresses) {
        resolveAddresses(createMockAddresses(3))
      }
      await act(async () => {
        await fetchPromise
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should handle fetching errors', async () => {
      const sessionId = createMockSessionId()
      const mockError = new Error('Failed to connect to device')

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockRejectedValue(mockError)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'LOAD',
        message: 'Failed to load addresses',
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.addresses).toEqual([])
      expect(logger.error).toHaveBeenCalledWith('Error loading addresses:', mockError)
    })

    it('should handle session becoming unavailable during fetch', async () => {
      const sessionId = createMockSessionId()

      // First call succeeds for validation, second call returns null
      mockLedgerDMKService.getCurrentSession.mockReturnValueOnce(sessionId).mockReturnValueOnce(null)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'LOAD',
        message: 'Failed to load addresses',
      })
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('pagination and state management', () => {
    it('should append new addresses to existing ones', async () => {
      const sessionId = createMockSessionId()
      const firstBatch = createMockAddresses(3, 0)
      const secondBatch = createMockAddresses(2, 3)

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      // Fetch first batch
      await act(async () => {
        await result.current.fetchAddresses(3)
      })

      expect(result.current.addresses).toEqual(firstBatch)
      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledWith(sessionId, 3, 0)

      // Fetch second batch
      await act(async () => {
        await result.current.fetchAddresses(2)
      })

      expect(result.current.addresses).toEqual([...firstBatch, ...secondBatch])
      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledWith(sessionId, 2, 3)
    })

    it('should use correct start index for pagination', async () => {
      const sessionId = createMockSessionId()
      const mockAddresses = createMockAddresses(5, 0)

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockResolvedValue(mockAddresses)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledWith(sessionId, 5, 0)

      // Clear mock to test second call
      mockLedgerEthereumService.getEthereumAddresses.mockClear()
      const secondBatch = createMockAddresses(3, 5)
      mockLedgerEthereumService.getEthereumAddresses.mockResolvedValue(secondBatch)

      await act(async () => {
        await result.current.fetchAddresses(3)
      })

      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledWith(sessionId, 3, 5)
    })
  })

  describe('overlapping load prevention', () => {
    it('should not start new load while already loading', async () => {
      const sessionId = createMockSessionId()
      let resolveFirstFetch: ((addresses: EthereumAddress[]) => void) | undefined
      const firstFetchPromise = new Promise<EthereumAddress[]>((resolve) => {
        resolveFirstFetch = resolve
      })

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockReturnValue(firstFetchPromise)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      // Start first fetch
      const firstFetch = result.current.fetchAddresses(3)

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Try to start second fetch while first is still loading
      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      // Should still be loading from first fetch, and service should only be called once
      expect(result.current.isLoading).toBe(true)
      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledTimes(1)

      // Resolve first fetch
      if (resolveFirstFetch) {
        resolveFirstFetch(createMockAddresses(3))
      }
      await act(async () => {
        await firstFetch
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.addresses).toHaveLength(3)
    })

    it('should allow new fetch after previous one completes', async () => {
      const sessionId = createMockSessionId()
      const firstBatch = createMockAddresses(3, 0)
      const secondBatch = createMockAddresses(2, 3)

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch)

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      // Complete first fetch
      await act(async () => {
        await result.current.fetchAddresses(3)
      })

      expect(result.current.isLoading).toBe(false)
      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledTimes(1)

      // Start second fetch
      await act(async () => {
        await result.current.fetchAddresses(2)
      })

      expect(result.current.isLoading).toBe(false)
      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledTimes(2)
      expect(result.current.addresses).toHaveLength(5)
    })
  })

  describe('error clearing', () => {
    it('should clear error when clearError is called', async () => {
      const sessionId = createMockSessionId()
      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      // Create an error
      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).not.toBeNull()

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should clear error when starting new successful fetch', async () => {
      const { result } = renderHook(() => useLedgerAddresses({}))

      // Create a session error first
      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'SESSION',
        message: 'No device session found',
      })

      // Now provide valid session and addresses
      const sessionId = createMockSessionId()
      const mockAddresses = createMockAddresses(3)

      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockResolvedValue(mockAddresses)

      const { result: newResult } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await newResult.current.fetchAddresses(3)
      })

      expect(newResult.current.error).toBeNull()
      expect(newResult.current.addresses).toEqual(mockAddresses)
    })
  })

  describe('function reference stability', () => {
    it('should maintain stable fetchAddresses reference with same sessionId', () => {
      const sessionId = createMockSessionId()
      const { result, rerender } = renderHook(() => useLedgerAddresses({ sessionId }))

      const firstFetchAddresses = result.current.fetchAddresses

      rerender({})

      expect(result.current.fetchAddresses).toBe(firstFetchAddresses)
    })

    it('should create new fetchAddresses when sessionId changes', () => {
      const sessionId1 = createMockSessionId()
      const sessionId2 = createMockSessionId()

      const { result: result1 } = renderHook(() => useLedgerAddresses({ sessionId: sessionId1 }))
      const { result: result2 } = renderHook(() => useLedgerAddresses({ sessionId: sessionId2 }))

      // Different sessionIds should result in different function references
      expect(result1.current.fetchAddresses).not.toBe(result2.current.fetchAddresses)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined sessionId gracefully', () => {
      const { result } = renderHook(() => useLedgerAddresses({ sessionId: undefined }))

      expect(result.current.addresses).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle empty string sessionId', async () => {
      const { result } = renderHook(() => useLedgerAddresses({ sessionId: '' }))

      await act(async () => {
        await result.current.fetchAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'SESSION',
        message: 'No device session found',
      })
    })

    it('should handle zero address count', async () => {
      const sessionId = createMockSessionId()
      mockLedgerDMKService.getCurrentSession.mockReturnValue(sessionId)
      mockLedgerEthereumService.getEthereumAddresses.mockResolvedValue([])

      const { result } = renderHook(() => useLedgerAddresses({ sessionId }))

      await act(async () => {
        await result.current.fetchAddresses(0)
      })

      expect(result.current.addresses).toEqual([])
      expect(result.current.error).toBeNull()
      expect(mockLedgerEthereumService.getEthereumAddresses).toHaveBeenCalledWith(sessionId, 0, 0)
    })
  })
})
