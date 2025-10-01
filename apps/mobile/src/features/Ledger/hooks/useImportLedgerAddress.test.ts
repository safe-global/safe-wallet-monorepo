import { renderHook, waitFor, act } from '@/src/tests/test-utils'
import { useImportLedgerAddress } from './useImportLedgerAddress'
import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { faker } from '@faker-js/faker'
import type { RootState } from '@/src/store'
import { selectSigners } from '@/src/store/signersSlice'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'

// Mock the ledger service
jest.mock('@/src/services/ledger/ledger-dmk.service', () => ({
  ledgerDMKService: {
    disconnect: jest.fn(),
  },
}))

// Mock expo-router
jest.mock('expo-router', () => ({
  useGlobalSearchParams: jest.fn(() => ({})),
}))

const mockLedgerDMKService = ledgerDMKService as jest.Mocked<typeof ledgerDMKService>
const mockUseGlobalSearchParams = require('expo-router').useGlobalSearchParams

describe('useImportLedgerAddress', () => {
  let mockSafeAddress: `0x${string}`
  let mockChainId: string

  beforeEach(() => {
    jest.clearAllMocks()
    server.resetHandlers()

    // Generate fresh mock data
    mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
    mockChainId = '1'

    // Clear console.error mock calls
    jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    })

    // Default mock for expo-router
    mockUseGlobalSearchParams.mockReturnValue({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    server.resetHandlers()
  })

  const createMockAddress = () => faker.finance.ethereumAddress() as `0x${string}`
  const createMockPath = () => `m/44'/60'/0'/0/${faker.number.int({ min: 0, max: 20 })}`
  const createMockIndex = () => faker.number.int({ min: 0, max: 20 })

  const setupSuccessfulOwnershipValidation = (address: string, safeAddress: string, chainId: string) => {
    const mockOwners = [
      { value: address, name: faker.person.fullName(), logoUri: faker.image.url() },
      { value: faker.finance.ethereumAddress() },
    ]

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}`, () => {
        return HttpResponse.json({ owners: mockOwners })
      }),
    )

    return mockOwners
  }

  const setupSuccessfulOwnershipValidationWithoutInfo = (address: string, safeAddress: string, chainId: string) => {
    const mockOwners = [{ value: address }, { value: faker.finance.ethereumAddress() }]

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}`, () => {
        return HttpResponse.json({ owners: mockOwners })
      }),
    )

    return mockOwners
  }

  const setupFailedOwnershipValidation = (safeAddress: string, chainId: string) => {
    const mockOwners = [{ value: faker.finance.ethereumAddress() }, { value: faker.finance.ethereumAddress() }]

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}`, () => {
        return HttpResponse.json({ owners: mockOwners })
      }),
    )

    return mockOwners
  }

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useImportLedgerAddress())

      expect(result.current.isImporting).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.importAddress).toBe('function')
    })
  })

  describe('validation errors', () => {
    it('should return validation error for empty address', async () => {
      const { result } = renderHook(() => useImportLedgerAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress('', createMockPath(), createMockIndex(), 'Ledger Device')
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address or derivation path',
      })
      expect(result.current.isImporting).toBe(false)
    })

    it('should return validation error for empty path', async () => {
      const { result } = renderHook(() => useImportLedgerAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(createMockAddress(), '', createMockIndex(), 'Ledger Device')
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address or derivation path',
      })
      expect(result.current.isImporting).toBe(false)
    })

    it('should return validation error for both empty address and path', async () => {
      const { result } = renderHook(() => useImportLedgerAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress('', '', createMockIndex(), 'Ledger Device')
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address or derivation path',
      })
      expect(result.current.isImporting).toBe(false)
    })

    it('should return owner validation error when address is not an owner', async () => {
      setupFailedOwnershipValidation(mockSafeAddress, mockChainId)

      const { result } = renderHook(() => useImportLedgerAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          createMockAddress(),
          createMockPath(),
          createMockIndex(),
          'Ledger Device',
        )
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'OWNER_VALIDATION',
        message: 'This address is not an owner of the Safe Account',
      })
      expect(result.current.isImporting).toBe(false)
    })
  })

  describe('successful address import', () => {
    it('should successfully import a ledger address and update state', async () => {
      mockLedgerDMKService.disconnect.mockResolvedValue(undefined)

      const mockAddress = createMockAddress()
      const mockPath = createMockPath()
      const mockIndex = createMockIndex()

      setupSuccessfulOwnershipValidationWithoutInfo(mockAddress, mockSafeAddress, mockChainId)

      const initialState: Partial<RootState> = {
        signers: {},
        addressBook: { contacts: {}, selectedContact: null },
        activeSigner: {},
      }

      const hookResult = renderHook(() => useImportLedgerAddress(), initialState)
      const { result } = hookResult
      const store = hookResult.store as { getState: () => RootState }

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')
      })

      // Check import result
      expect(importResult).toEqual({
        success: true,
        selected: {
          address: mockAddress,
          path: mockPath,
          index: mockIndex,
        },
      })

      // Check hook state
      expect(result.current.isImporting).toBe(false)
      expect(result.current.error).toBeNull()

      // Now check the Redux state through the returned store
      const state = store.getState() as RootState

      // Check that signer was added to Redux state
      const signers = selectSigners(state)
      expect(signers[mockAddress]).toEqual({
        value: mockAddress,
        name: `Ledger Device-${mockAddress.slice(-4)}`,
        logoUri: null,
        type: 'ledger',
        derivationPath: mockPath,
      })

      // Check that address book entry was created
      const contact = selectContactByAddress(mockAddress)(state)
      expect(contact).toEqual({
        value: mockAddress,
        name: `Ledger Device-${mockAddress.slice(-4)}`,
        chainIds: [],
      })

      // Verify ledger service was disconnected
      expect(mockLedgerDMKService.disconnect).toHaveBeenCalledTimes(1)
    })

    it('should set isImporting to true during import process', async () => {
      const mockAddress = createMockAddress()
      const mockPath = createMockPath()
      const mockIndex = createMockIndex()

      setupSuccessfulOwnershipValidation(mockAddress, mockSafeAddress, mockChainId)

      // Mock a longer running disconnect to test loading state
      let resolveDisconnect: (() => void) | undefined
      const disconnectPromise = new Promise<void>((resolve) => {
        resolveDisconnect = resolve
      })
      mockLedgerDMKService.disconnect.mockReturnValue(disconnectPromise)

      const { result } = renderHook(() => useImportLedgerAddress())

      // Start the import process
      const importPromise = result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')

      // Check that isImporting is true during the process
      await waitFor(() => {
        expect(result.current.isImporting).toBe(true)
      })

      // Resolve the disconnect
      resolveDisconnect?.()
      await act(async () => {
        await importPromise
      })

      // Check that isImporting is false after completion
      expect(result.current.isImporting).toBe(false)
    })
  })

  describe('import failures', () => {
    it('should handle disconnect service error as import failure', async () => {
      const mockAddress = createMockAddress()
      const mockPath = createMockPath()
      const mockIndex = createMockIndex()

      setupSuccessfulOwnershipValidation(mockAddress, mockSafeAddress, mockChainId)

      const disconnectError = new Error('Disconnect failed')
      mockLedgerDMKService.disconnect.mockRejectedValue(disconnectError)

      const { result } = renderHook(() => useImportLedgerAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')
      })

      // Should fail when disconnect fails since it's in the try-catch
      expect(importResult).toEqual({ success: false })

      expect(result.current.isImporting).toBe(false)
      expect(result.current.error).toEqual({
        code: 'IMPORT',
        message: 'Failed to import the selected address. Please try again.',
      })
    })
  })

  describe('error clearing', () => {
    it('should clear error when clearError is called', async () => {
      const { result } = renderHook(() => useImportLedgerAddress())

      // First, create an error
      await act(async () => {
        await result.current.importAddress('', '', createMockIndex(), 'Ledger Device')
      })

      expect(result.current.error).not.toBeNull()

      // Then clear it
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should clear error when starting a new import after validation error', async () => {
      // Ensure disconnect succeeds for the valid import
      mockLedgerDMKService.disconnect.mockResolvedValue(undefined)

      const { result } = renderHook(() => useImportLedgerAddress())

      // First, create a validation error
      await act(async () => {
        await result.current.importAddress('', '', createMockIndex(), 'Ledger Device')
      })

      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address or derivation path',
      })

      // Then start a valid import - error should be cleared
      const mockAddress = createMockAddress()
      const mockPath = createMockPath()
      const mockIndex = createMockIndex()

      setupSuccessfulOwnershipValidation(mockAddress, mockSafeAddress, mockChainId)

      await act(async () => {
        await result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('function reference stability', () => {
    it('should maintain stable clearError function reference', () => {
      const { result, rerender } = renderHook(() => useImportLedgerAddress())

      const firstClearError = result.current.clearError

      rerender({})

      expect(result.current.clearError).toBe(firstClearError)
    })
  })

  describe('integration with Redux state', () => {
    it('should add signer to existing signers state', async () => {
      mockLedgerDMKService.disconnect.mockResolvedValue(undefined)

      const existingAddress = createMockAddress()
      const existingSigner = {
        value: existingAddress,
        name: 'Existing Signer',
        logoUri: null,
        type: 'private-key' as const,
      }

      const newAddress = createMockAddress()
      const newPath = createMockPath()
      const newIndex = createMockIndex()

      setupSuccessfulOwnershipValidationWithoutInfo(newAddress, mockSafeAddress, mockChainId)

      const initialState: Partial<RootState> = {
        signers: {
          [existingAddress]: existingSigner,
        },
        addressBook: { contacts: {}, selectedContact: null },
        activeSigner: {},
      }

      const hookResult = renderHook(() => useImportLedgerAddress(), initialState)
      const { result } = hookResult
      const store = hookResult.store as { getState: () => RootState }

      await act(async () => {
        await result.current.importAddress(newAddress, newPath, newIndex, 'Ledger Device')
      })

      // Check the Redux state through the returned store
      const state = store.getState() as RootState
      const signers = selectSigners(state)

      // Should have both signers
      expect(signers[existingAddress]).toEqual(existingSigner)
      expect(signers[newAddress]).toEqual({
        value: newAddress,
        name: `Ledger Device-${newAddress.slice(-4)}`,
        logoUri: null,
        type: 'ledger',
        derivationPath: newPath,
      })
    })

    it('should set active signer when no active signer exists for safe', async () => {
      mockLedgerDMKService.disconnect.mockResolvedValue(undefined)

      const safeAddress = createMockAddress()
      const mockAddress = createMockAddress()
      const mockPath = createMockPath()
      const mockIndex = createMockIndex()

      setupSuccessfulOwnershipValidationWithoutInfo(mockAddress, mockSafeAddress, mockChainId)

      const initialState: Partial<RootState> = {
        signers: {},
        addressBook: { contacts: {}, selectedContact: null },
        activeSigner: {},
        activeSafe: {
          address: safeAddress,
          chainId: '1',
        },
      }

      const hookResult = renderHook(() => useImportLedgerAddress(), initialState)
      const { result } = hookResult
      const store = hookResult.store as { getState: () => RootState }

      await act(async () => {
        await result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')
      })

      // Check the Redux state through the returned store
      const state = store.getState() as RootState

      // Should set active signer for the safe
      const activeSigner = selectActiveSigner(state, safeAddress)
      expect(activeSigner).toEqual({
        value: mockAddress,
        name: `Ledger Device-${mockAddress.slice(-4)}`,
        logoUri: null,
        type: 'ledger',
        derivationPath: mockPath,
      })
    })
  })
})
