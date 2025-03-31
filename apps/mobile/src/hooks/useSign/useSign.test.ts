import { act, renderHook } from '@/src/tests/test-utils'
import { useSign, storePrivateKey, getPrivateKey, createMnemonicAccount } from './useSign'
import { HDNodeWallet, Wallet } from 'ethers'
import { keyStorageService, walletService } from '@/src/services/key-storage'

jest.mock('@/src/services/key-storage', () => ({
  keyStorageService: {
    storePrivateKey: jest.fn(),
    getPrivateKey: jest.fn(),
  },
  walletService: {
    createMnemonicAccount: jest.fn(),
  },
  PrivateKeyStorageOptions: {},
}))

describe('useSign', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Direct function exports', () => {
    it('call the keyStorageService to store the private key', async () => {
      const { privateKey } = Wallet.createRandom()
      const userId = 'userId'
      const options = { requireAuthentication: true }

      await storePrivateKey(userId, privateKey, options)

      expect(keyStorageService.storePrivateKey).toHaveBeenCalledWith(userId, privateKey, options)
    })

    it('call the keyStorageService to get the private key', async () => {
      const userId = 'userId'
      const options = { requireAuthentication: true }
      const mockPrivateKey = '0x123456'

      jest.mocked(keyStorageService.getPrivateKey).mockResolvedValueOnce(mockPrivateKey)

      const result = await getPrivateKey(userId, options)

      expect(keyStorageService.getPrivateKey).toHaveBeenCalledWith(userId, options)
      expect(result).toBe(mockPrivateKey)
    })

    it('call the walletService to create a mnemonic account', async () => {
      const { mnemonic, privateKey } = Wallet.createRandom()
      const mockWallet = { privateKey } as HDNodeWallet

      jest.mocked(walletService.createMnemonicAccount).mockResolvedValueOnce(mockWallet)

      const wallet = await createMnemonicAccount(mnemonic?.phrase as string)

      expect(walletService.createMnemonicAccount).toHaveBeenCalledWith(mnemonic?.phrase)
      expect(wallet).toBe(mockWallet)
    })
  })

  describe('useSign hook', () => {
    it('returns loading state and handle successful key storage', async () => {
      const { privateKey } = Wallet.createRandom()
      const userId = 'userId'
      const options = { requireAuthentication: true }

      jest.mocked(keyStorageService.storePrivateKey).mockImplementation(async () => {
        return Promise.resolve()
      })

      const { result } = renderHook(() => useSign())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)

      let success
      await act(async () => {
        success = await result.current.storePrivateKey(userId, privateKey, options)
      })

      expect(keyStorageService.storePrivateKey).toHaveBeenCalledWith(userId, privateKey, options)
      expect(success).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles errors when storing private key', async () => {
      const { privateKey } = Wallet.createRandom()
      const userId = 'userId'
      const options = { requireAuthentication: true }
      const errorMessage = 'Storage error'

      jest.mocked(keyStorageService.storePrivateKey).mockImplementation(async () => {
        throw new Error(errorMessage)
      })

      const { result } = renderHook(() => useSign())

      let success
      await act(async () => {
        success = await result.current.storePrivateKey(userId, privateKey, options)
      })

      expect(keyStorageService.storePrivateKey).toHaveBeenCalledWith(userId, privateKey, options)
      expect(success).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })

    it('handles successful private key retrieval', async () => {
      const userId = 'userId'
      const options = { requireAuthentication: true }
      const mockPrivateKey = '0x123456'

      jest.mocked(keyStorageService.getPrivateKey).mockResolvedValueOnce(mockPrivateKey)

      const { result } = renderHook(() => useSign())

      let returnedKey
      await act(async () => {
        returnedKey = await result.current.getPrivateKey(userId, options)
      })

      expect(keyStorageService.getPrivateKey).toHaveBeenCalledWith(userId, options)
      expect(returnedKey).toBe(mockPrivateKey)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles successful mnemonic account creation', async () => {
      const { mnemonic, privateKey } = Wallet.createRandom()
      const mockWallet = { privateKey } as HDNodeWallet

      jest.mocked(walletService.createMnemonicAccount).mockResolvedValueOnce(mockWallet)

      const { result } = renderHook(() => useSign())

      let wallet
      await act(async () => {
        wallet = await result.current.createMnemonicAccount(mnemonic?.phrase as string)
      })

      expect(walletService.createMnemonicAccount).toHaveBeenCalledWith(mnemonic?.phrase)
      expect(wallet).toBe(mockWallet)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('KeyStorageService integration', () => {
    it('stores and retrieves a private key', async () => {
      const mockStoreImpl = jest.spyOn(keyStorageService, 'storePrivateKey')
      const mockGetImpl = jest.spyOn(keyStorageService, 'getPrivateKey')

      mockStoreImpl.mockResolvedValue(undefined)
      mockGetImpl.mockResolvedValue('decryptedKey')

      const userId = 'testUser'
      const privateKey = 'privateKey123'

      await keyStorageService.storePrivateKey(userId, privateKey, { requireAuthentication: true })
      const retrievedKey = await keyStorageService.getPrivateKey(userId, { requireAuthentication: true })

      expect(mockStoreImpl).toHaveBeenCalledWith(userId, privateKey, { requireAuthentication: true })
      expect(mockGetImpl).toHaveBeenCalledWith(userId, { requireAuthentication: true })
      expect(retrievedKey).toBe('decryptedKey')
    })
  })
})
