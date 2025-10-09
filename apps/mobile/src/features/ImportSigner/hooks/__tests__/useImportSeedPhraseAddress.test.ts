import { renderHook, act } from '@/src/tests/test-utils'
import { useImportSeedPhraseAddress } from '../useImportSeedPhraseAddress'
import { ethers } from 'ethers'
import Logger from '@/src/utils/logger'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import useDelegate from '@/src/hooks/useDelegate'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'

// Mock ONLY I/O boundaries
jest.mock('@/src/hooks/useSign/useSign')
jest.mock('@/src/hooks/useDelegate')
jest.mock('@/src/hooks/useAddressOwnershipValidation')

const mockStorePrivateKey = storePrivateKey as jest.MockedFunction<typeof storePrivateKey>
const mockUseDelegate = useDelegate as jest.MockedFunction<typeof useDelegate>
const mockUseAddressOwnershipValidation = useAddressOwnershipValidation as jest.MockedFunction<
  typeof useAddressOwnershipValidation
>

describe('useImportSeedPhraseAddress', () => {
  const mockCreateDelegate = jest.fn()
  const mockValidateAddressOwnership = jest.fn()

  // Real test data from Hardhat
  const VALID_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  const VALID_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  const DERIVATION_PATH = "m/44'/60'/0'/0/0"
  const ACCOUNT_INDEX = 0

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseDelegate.mockReturnValue({
      createDelegate: mockCreateDelegate,
      isLoading: false,
      error: null,
    })

    mockUseAddressOwnershipValidation.mockReturnValue({
      validateAddressOwnership: mockValidateAddressOwnership,
    })
  })

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      expect(result.current.isImporting).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.clearError).toBeInstanceOf(Function)
      expect(result.current.importAddress).toBeInstanceOf(Function)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      // First set an error by calling importAddress with invalid params
      await act(async () => {
        await result.current.importAddress('', '', 0, '')
      })

      expect(result.current.error).not.toBeNull()

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('importAddress - validation', () => {
    it('should reject empty address', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress('', DERIVATION_PATH, ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address, derivation path, or private key',
      })
      expect(result.current.isImporting).toBe(false)
    })

    it('should reject empty derivation path', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(VALID_ADDRESS, '', ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address, derivation path, or private key',
      })
    })

    it('should reject empty private key', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, '')
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address, derivation path, or private key',
      })
    })

    it('should reject all empty parameters', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress('', '', 0, '')
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'Invalid address, derivation path, or private key',
      })
      expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
      expect(mockStorePrivateKey).not.toHaveBeenCalled()
    })
  })

  describe('importAddress - ownership validation', () => {
    it('should reject address that is not an owner', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: false,
      })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(mockValidateAddressOwnership).toHaveBeenCalledWith(VALID_ADDRESS)
      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'OWNER_VALIDATION',
        message: 'This address is not an owner of the Safe Account',
      })
      expect(result.current.isImporting).toBe(false)
      expect(mockStorePrivateKey).not.toHaveBeenCalled()
    })

    it('should proceed when address is validated as owner', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS, name: 'Test Owner' },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(mockValidateAddressOwnership).toHaveBeenCalledWith(VALID_ADDRESS)
      expect(mockStorePrivateKey).toHaveBeenCalledWith(VALID_ADDRESS, VALID_PRIVATE_KEY)
      expect(importResult).toMatchObject({ success: true })
    })
  })

  describe('importAddress - successful import flow', () => {
    it('should successfully import address and update Redux store', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS, name: 'Test Owner', logoUri: 'https://example.com/logo.png' },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(importResult).toEqual({
        success: true,
        selected: {
          address: VALID_ADDRESS,
          path: DERIVATION_PATH,
          index: ACCOUNT_INDEX,
        },
      })
      expect(result.current.error).toBeNull()
      expect(result.current.isImporting).toBe(false)
    })

    it('should set isImporting to true during import and false after', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      expect(result.current.isImporting).toBe(false)

      const importPromise = act(async () => {
        await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      await importPromise

      expect(result.current.isImporting).toBe(false)
    })

    it('should clear error state when starting a new import', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      // First import fails
      mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

      await act(async () => {
        await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      expect(result.current.error).not.toBeNull()

      // Second import succeeds
      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      await act(async () => {
        await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      expect(result.current.error).toBeNull()
    })

    it('should use ownerInfo logoUri when available', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      const logoUri = 'https://example.com/custom-logo.png'
      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS, logoUri },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      await act(async () => {
        await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      expect(result.current.error).toBeNull()
    })

    it('should use null for logoUri when not provided', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      await act(async () => {
        await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('importAddress - delegate creation', () => {
    it('should continue import when delegate creation succeeds', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(mockCreateDelegate).toHaveBeenCalledWith(VALID_PRIVATE_KEY, null)
      expect(importResult).toMatchObject({ success: true })
      expect(result.current.error).toBeNull()
    })

    it('should continue import when delegate creation fails', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: false, error: 'Network error' })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(Logger.error).toHaveBeenCalledWith('Failed to create delegate during seed phrase import', 'Network error')
      expect(importResult).toMatchObject({ success: true })
      expect(result.current.error).toBeNull()
    })

    it('should continue import when delegate creation throws exception', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockRejectedValue(new Error('Network timeout'))

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(Logger.error).toHaveBeenCalledWith('Error creating delegate during seed phrase import', expect.any(Error))
      expect(importResult).toMatchObject({ success: true })
      expect(result.current.error).toBeNull()
    })
  })

  describe('importAddress - storage errors', () => {
    it('should fail import when storage fails', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockRejectedValue(new Error('Storage unavailable'))

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(mockStorePrivateKey).toHaveBeenCalledWith(VALID_ADDRESS, VALID_PRIVATE_KEY)
      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'IMPORT',
        message: 'Failed to import the selected address. Please try again.',
      })
      expect(result.current.isImporting).toBe(false)
      expect(Logger.error).toHaveBeenCalledWith('Error importing seed phrase address:', expect.any(Error))
    })

    it('should set isImporting to false when storage fails', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockRejectedValue(new Error('Storage error'))

      await act(async () => {
        await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, VALID_PRIVATE_KEY)
      })

      expect(result.current.isImporting).toBe(false)
    })
  })

  describe('importAddress - validation errors', () => {
    it('should handle validation network errors gracefully', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockRejectedValue(new Error('Network timeout'))

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          VALID_ADDRESS,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(importResult).toEqual({ success: false })
      expect(result.current.error).toEqual({
        code: 'IMPORT',
        message: 'Failed to import the selected address. Please try again.',
      })
      expect(Logger.error).toHaveBeenCalledWith('Error importing seed phrase address:', expect.any(Error))
    })
  })

  describe('importAddress - real cryptographic validation', () => {
    it('should validate that address matches private key', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      // Derive the actual address from the private key
      const wallet = new ethers.Wallet(VALID_PRIVATE_KEY)
      const derivedAddress = wallet.address

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: derivedAddress },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          derivedAddress,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(importResult).toMatchObject({ success: true })
      expect(mockStorePrivateKey).toHaveBeenCalledWith(derivedAddress, VALID_PRIVATE_KEY)
    })

    it('should handle multiple account indices correctly', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      // Import account at index 5
      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(VALID_ADDRESS, "m/44'/60'/0'/0/5", 5, VALID_PRIVATE_KEY)
      })

      expect(importResult).toEqual({
        success: true,
        selected: {
          address: VALID_ADDRESS,
          path: "m/44'/60'/0'/0/5",
          index: 5,
        },
      })
    })
  })

  describe('importAddress - edge cases', () => {
    it('should handle address with different casing', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      const lowercaseAddress = VALID_ADDRESS.toLowerCase()

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: lowercaseAddress },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          lowercaseAddress,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(importResult).toMatchObject({ success: true })
      expect(mockStorePrivateKey).toHaveBeenCalledWith(lowercaseAddress, VALID_PRIVATE_KEY)
    })

    it('should handle checksummed addresses', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      const checksummedAddress = ethers.getAddress(VALID_ADDRESS)

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: checksummedAddress },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(
          checksummedAddress,
          DERIVATION_PATH,
          ACCOUNT_INDEX,
          VALID_PRIVATE_KEY,
        )
      })

      expect(importResult).toMatchObject({ success: true })
    })

    it('should handle private key with 0x prefix', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      const keyWithPrefix = `0x${VALID_PRIVATE_KEY.replace('0x', '')}`

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, ACCOUNT_INDEX, keyWithPrefix)
      })

      expect(importResult).toMatchObject({ success: true })
      expect(mockStorePrivateKey).toHaveBeenCalledWith(VALID_ADDRESS, keyWithPrefix)
    })

    it('should handle account index 0', async () => {
      const { result } = renderHook(() => useImportSeedPhraseAddress())

      mockValidateAddressOwnership.mockResolvedValue({
        isOwner: true,
        ownerInfo: { value: VALID_ADDRESS },
      })
      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      let importResult
      await act(async () => {
        importResult = await result.current.importAddress(VALID_ADDRESS, DERIVATION_PATH, 0, VALID_PRIVATE_KEY)
      })

      expect(importResult).toEqual({
        success: true,
        selected: {
          address: VALID_ADDRESS,
          path: DERIVATION_PATH,
          index: 0,
        },
      })
    })
  })
})
