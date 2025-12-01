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

jest.mock('@/src/services/ledger/ledger-dmk.service', () => ({
  ledgerDMKService: {
    disconnect: jest.fn(),
  },
}))

const mockLedgerDMKService = ledgerDMKService as jest.Mocked<typeof ledgerDMKService>

describe('useImportLedgerAddress', () => {
  let mockSafeAddress: `0x${string}`
  let mockChainId: string

  beforeEach(() => {
    jest.clearAllMocks()
    server.resetHandlers()

    mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
    mockChainId = '1'

    jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
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

  const getDefaultInitialState = (safeAddress: string, chainId: string): Partial<RootState> => ({
    activeSafe: { address: safeAddress as `0x${string}`, chainId },
    signers: {},
    addressBook: { contacts: {}, selectedContact: null },
    activeSigner: {},
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

      expect(result.current.isImporting).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.importAddress).toBe('function')
    })
  })

  describe('validation errors', () => {
    it('should return validation error for empty address', async () => {
      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

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
      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

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
      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

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

      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

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
        ...getDefaultInitialState(mockSafeAddress, mockChainId),
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

      expect(importResult).toEqual({
        success: true,
        selected: {
          address: mockAddress,
          path: mockPath,
          index: mockIndex,
        },
      })

      expect(result.current.isImporting).toBe(false)
      expect(result.current.error).toBeNull()

      const state = store.getState() as RootState

      const signers = selectSigners(state)
      expect(signers[mockAddress]).toEqual({
        value: mockAddress,
        name: `Ledger Device-${mockAddress.slice(-4)}`,
        logoUri: null,
        type: 'ledger',
        derivationPath: mockPath,
      })

      const contact = selectContactByAddress(mockAddress)(state)
      expect(contact).toEqual({
        value: mockAddress,
        name: `Ledger Device-${mockAddress.slice(-4)}`,
        chainIds: [],
      })

      expect(mockLedgerDMKService.disconnect).toHaveBeenCalledTimes(1)
    })

    it('should set isImporting to true during import process', async () => {
      const mockAddress = createMockAddress()
      const mockPath = createMockPath()
      const mockIndex = createMockIndex()

      setupSuccessfulOwnershipValidation(mockAddress, mockSafeAddress, mockChainId)

      let resolveDisconnect: (() => void) | undefined
      const disconnectPromise = new Promise<void>((resolve) => {
        resolveDisconnect = resolve
      })
      mockLedgerDMKService.disconnect.mockReturnValue(disconnectPromise)

      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

      const importPromise = result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')

      await waitFor(() => {
        expect(result.current.isImporting).toBe(true)
      })

      resolveDisconnect?.()
      await act(async () => {
        await importPromise
      })

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

      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')
      })

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
      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

      await act(async () => {
        await result.current.importAddress('', '', createMockIndex(), 'Ledger Device')
      })

      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should clear error when starting a new import after validation error', async () => {
      mockLedgerDMKService.disconnect.mockResolvedValue(undefined)

      const { result } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

      await act(async () => {
        await result.current.importAddress('', '', createMockIndex(), 'Ledger Device')
      })

      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address or derivation path',
      })

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
      const { result, rerender } = renderHook(
        () => useImportLedgerAddress(),
        getDefaultInitialState(mockSafeAddress, mockChainId),
      )

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
        ...getDefaultInitialState(mockSafeAddress, mockChainId),
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

      const state = store.getState() as RootState
      const signers = selectSigners(state)

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

      setupSuccessfulOwnershipValidationWithoutInfo(mockAddress, safeAddress, mockChainId)

      const initialState: Partial<RootState> = {
        signers: {},
        addressBook: { contacts: {}, selectedContact: null },
        activeSigner: {},
        activeSafe: {
          address: safeAddress,
          chainId: mockChainId,
        },
      }

      const hookResult = renderHook(() => useImportLedgerAddress(), initialState)
      const { result } = hookResult
      const store = hookResult.store as { getState: () => RootState }

      await act(async () => {
        await result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')
      })

      const state = store.getState() as RootState

      const activeSigner = selectActiveSigner(state, safeAddress)
      expect(activeSigner).toEqual({
        value: mockAddress,
        name: `Ledger Device-${mockAddress.slice(-4)}`,
        logoUri: null,
        type: 'ledger',
        derivationPath: mockPath,
      })
    })

    it('should work with pendingSafe for onboarding flow', async () => {
      mockLedgerDMKService.disconnect.mockResolvedValue(undefined)

      const pendingSafeAddress = createMockAddress()
      const mockAddress = createMockAddress()
      const mockPath = createMockPath()
      const mockIndex = createMockIndex()

      const mockOwnedSafesResponse = {
        '1': [pendingSafeAddress],
        '137': [faker.finance.ethereumAddress()],
      }

      server.use(
        http.get(`${GATEWAY_URL}/v2/owners/${mockAddress}/safes`, () => {
          return HttpResponse.json(mockOwnedSafesResponse)
        }),
      )

      const initialState: Partial<RootState> = {
        signers: {},
        addressBook: { contacts: {}, selectedContact: null },
        activeSigner: {},
        signerImportFlow: {
          pendingSafe: { address: pendingSafeAddress, name: 'Pending Safe' },
        },
      }

      const hookResult = renderHook(() => useImportLedgerAddress(), initialState)
      const { result } = hookResult
      const store = hookResult.store as { getState: () => RootState }

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(mockAddress, mockPath, mockIndex, 'Ledger Device')
      })

      expect(importResult).toEqual({
        success: true,
        selected: {
          address: mockAddress,
          path: mockPath,
          index: mockIndex,
        },
      })

      const state = store.getState() as RootState
      const signers = selectSigners(state)

      expect(signers[mockAddress]).toEqual({
        value: mockAddress,
        name: `Ledger Device-${mockAddress.slice(-4)}`,
        logoUri: null,
        type: 'ledger',
        derivationPath: mockPath,
      })
    })
  })
})
